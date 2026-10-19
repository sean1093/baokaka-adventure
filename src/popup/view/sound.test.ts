import { describe, expect, it } from 'vitest';
import { SFX, SFX_CUES, type SfxCue } from '../../shared/audio';
import type { SimEvent } from '../core/events';
import { line, page, part } from '../core/fixtures/toy';
import { replay } from '../core/replay';
import { initialState } from '../core/state';
import { step } from '../core/step';
import type { PageDef, SimState, Word } from '../core/types';
import { registry } from '../pages';
import type { GestureEvent, Target } from './gestures';
import { MOTIF_STYLE, creatureCue, dropCue, gestureSounds, stickerSounds, stopCue, syllables, tickSounds, type Sound } from './sound';

const cues = (sounds: readonly Sound[]): SfxCue[] => sounds.flatMap((s) => ('cue' in s ? [s.cue] : []));

const toy = page({
  ...line('ABC'),
  parts: [
    part('tab', 'tab', 50, 0, { states: ['a', 'b'], input: 'drag-linear', track: { from: [30, 0], to: [70, 0] } }),
    part('wheel', 'wheel', 150, 0, { states: ['0', '1', '2', '3'] }),
    part('flap', 'flap', 250, 0),
    part('coin', 'pushable', 0, -50, { art: 'c1/coin', fall: { path: [[0, -50], [0, 0]], fallTo: 'A' } }),
    part('card', 'pushable', 0, -50, { art: 'c1/card', fall: { path: [[0, -50], [0, 0]], fallTo: 'A' } }),
  ],
  creatures: [{ id: 'pigeon', positions: { here: 'C', away: 'offpage' }, initial: 'here', art: 'common/pigeon' }],
});
const s0 = initialState(toy);
const with_ = (patch: Partial<SimState>, baby: Partial<SimState['baby']> = {}): SimState => ({ ...s0, ...patch, tick: s0.tick + 1, baby: { ...s0.baby, ...baby } });
const tick = (state: SimState, events: SimEvent[] = [], prev = s0) => cues(tickSounds(toy, prev, state, events));

describe('the § 2.12 cue table', () => {
  it('every cue is synthesised (voices, no files), short and dry', () => {
    for (const cue of SFX_CUES) {
      expect(SFX[cue].length, cue).toBeGreaterThan(0);
      for (const v of SFX[cue]) {
        expect((v.at ?? 0) + v.dur, cue).toBeLessThanOrEqual(1); // no reverb tails
        expect(v.peak, cue).toBeLessThanOrEqual(0.3); // filtered noise loses most of its level, so its peaks run higher
      }
    }
  });
});

describe('tickSounds: sim events → cues (GDD § 2.12)', () => {
  it('Baby crawl: pat-pat on a step', () => {
    expect(tick(with_({}, { node: 'B', mode: 'moving' }))).toContain('patpat');
    expect(tick(with_({}, { node: 'B', mode: 'carried', carriedBy: { id: 'x', k: 0 } }))).not.toContain('patpat');
  });
  it('Target change: the rising ding, then his bark as voice blips', () => {
    const state = with_({}, { target: 'toy' });
    const sounds = tickSounds(toy, s0, state, [{ type: 'bark', bark: 'pretty', id: 'toy' }]);
    expect(cues(sounds)).toContain('ding');
    expect(sounds).toContainEqual({ voice: 2, who: 'baby', delay: 0.24 });
  });
  it('Reaching: 「要！要！」 blip-blip', () => {
    const prev = with_({}, { target: 'toy', mode: 'reaching' });
    expect(tick({ ...prev, tick: prev.tick + 1 }, [{ type: 'bark', bark: 'wantWant' }], prev)).toEqual(['want']);
  });
  it('Looking: the questioning up-glide', () => {
    expect(tick(with_({}, { mode: 'looking' }))).toContain('look');
  });
  it('Crying: the soft descending glide, once', () => {
    expect(tick(with_({}, { mode: 'crying' }), [{ type: 'cry', at: [0, 0] }]).filter((c) => c === 'cry')).toHaveLength(1);
    expect(tick(with_({}), [{ type: 'cry', at: [0, 0] }])).toEqual(['cry']);
  });
  it('Word said: its motif, for every word', () => {
    const events: Record<Word, SimEvent[]> = {
      beep: [{ type: 'beep' }],
      bye: [{ type: 'wave' }],
      wow: [{ type: 'wow' }],
      hug: [{ type: 'hug' }],
      plane: [{ type: 'sky' }],
      whoosh: [{ type: 'whoosh' }],
      together: [{ type: 'together' }],
      no: [],
    };
    for (const [word, evs] of Object.entries(events) as [Word, SimEvent[]][]) {
      const state = with_({}, { mode: 'saying', refused: word === 'no' ? ['x'] : [] });
      expect(tickSounds(toy, s0, state, evs), word).toContainEqual({ word });
    }
  });
  it('every word has its own motif style (§ 6 risk 10: distinct)', () => {
    expect(new Set(Object.values(MOTIF_STYLE)).size).toBe(Object.keys(MOTIF_STYLE).length);
  });
  it('Mocha hop / land: a soft thump per node', () => {
    const t = (mocha: SimState['mocha']) => tickSounds({ ...toy, perches: [{ id: 'p', node: 'B' }, { id: 'q', node: 'C' }] as PageDef['perches'] }, s0, { ...s0, mocha }, []);
    expect(cues(t({ perch: null, path: ['B', 'C'], to: 'q' }))).toEqual(['thump']);
    expect(t({ perch: 'q', path: [] })).toContainEqual({ cue: 'thump', gain: 1.2 });
  });
  it('Mocha push: the scrape, then the drop by material', () => {
    expect(tick(s0, [{ type: 'push', id: 'coin' }])).toContain('scrape');
    expect(tick(s0, [{ type: 'land', id: 'coin' }])).toEqual(['dropCoin']);
    expect(tick(s0, [{ type: 'land', id: 'card' }])).toEqual(['dropPaper']);
    expect(dropCue('common/pigeon')).toBe('dropFlap');
  });
  it('Creature reacts: its short synth', () => {
    expect(tick({ ...s0, creatures: { pigeon: 'away' } })).toEqual(['coo']);
    expect(creatureCue('c3/goose')).toBe('honk');
    expect(creatureCue('c2/squirrel')).toBe('chitter');
    expect(creatureCue('c5/cat')).toBe('chirp');
  });
  it('Goal grab: the sparkle arpeggio (and 「這個！」 in blips)', () => {
    const sounds = tickSounds(toy, s0, with_({}), [{ type: 'grab', id: 'toy' }]);
    expect(cues(sounds)).toContain('sparkle');
    expect(sounds).toContainEqual({ voice: 2, who: 'baby', delay: 0 });
  });
  it('a part moved by the world: its stop sound; one the player just moved stays quiet', () => {
    expect(tick(s0, [{ type: 'partEnter', id: 'wheel', state: '1' }])).toEqual(['ratchet']);
    expect(tick(s0, [{ type: 'partEnter', id: 'flap', state: 'open' }])).toEqual(['flop']);
    expect(tick(s0, [{ type: 'partEnter', id: 'tab', state: 'b' }])).toEqual(['click']);
    expect(cues(tickSounds(toy, s0, s0, [{ type: 'partEnter', id: 'tab', state: 'b' }], new Set(['tab'])))).toEqual([]);
    expect(tick(s0, [{ type: 'partEnter', id: 'coin', state: 'x' }])).toEqual([]);
  });
  it('Locked part: the low boop', () => {
    expect(tick(s0, [{ type: 'locked', id: 'tab' }])).toEqual(['boop']);
    expect(tick(s0, [{ type: 'jam', id: 'tab', state: 'a' }])).toEqual(['boop']);
  });
  it("Mocha's 「喵？」 and 「不要。」", () => {
    expect(tick(s0, [{ type: 'mochaNope', id: 'p' }])).toEqual(['mew']);
    expect(tick(s0, [{ type: 'mochaPuff', id: 'p' }])).toEqual(['puff']);
    expect(tick(s0, [{ type: 'mochaStare', id: 'coin' }])).toEqual([]);
  });
  it('a quiet tick is silent', () => {
    expect(tickSounds(toy, s0, s0, [])).toEqual([]);
  });
});

describe('gestureSounds and stickerSounds (GDD § 2.12)', () => {
  const target = (id: string, kind: Target['kind'] = 'part'): Target => ({ key: id, kind, id, hit: { cx: 0, cy: 0, r: 10 }, layer: 1 });
  const g = (event: GestureEvent) => cues(gestureSounds(toy, event));
  it('Tab/slider drag: the paper swish (a wheel ratchets instead)', () => {
    expect(g({ type: 'dragStart', part: 'tab' })).toEqual(['swish']);
    expect(g({ type: 'dragStart', part: 'wheel' })).toEqual([]);
  });
  it('Snap to stop: wooden click; wheel step: ratchet; flap: flop', () => {
    expect(g({ type: 'snap', part: 'tab', to: 'b', index: 1 })).toEqual(['click']);
    expect(g({ type: 'snap', part: 'wheel', to: '1', index: 1 })).toEqual(['ratchet']);
    expect(g({ type: 'snap', part: 'flap', to: 'open', index: 1 })).toEqual(['flop']);
    expect(g({ type: 'tap', target: target('flap') })).toEqual(['flop']);
    expect(g({ type: 'tap', target: target('B', 'perch') })).toEqual([]);
  });
  it('Locked part: the boop as the finger lands', () => {
    expect(g({ type: 'nope', part: 'tab' })).toEqual(['boop']);
  });
  it('Sticker: the pop plus 「嘿嘿」 (淘氣) / the bell (土地公)', () => {
    expect(cues(stickerSounds('mischief'))).toEqual(['pop', 'hehe']);
    expect(cues(stickerSounds('tudigong'))).toEqual(['pop', 'bell']);
  });
  it('stopCue by preset', () => {
    expect(stopCue({ preset: 'loop' })).toBe('ratchet');
    expect(stopCue({ preset: 'button' })).toBe('click');
  });
  it('syllables: one blip per spoken character', () => {
    expect(syllables('要！要！')).toBe(2);
    expect(syllables('ㄋㄟㄋㄟ')).toBe(4);
    expect(syllables('哇——')).toBe(1);
  });
});

describe('the shipped pages sound as they play', () => {
  it.each(registry.pages.map((p) => [p.id, p] as const))('%s: its solution crawls, wants and grabs with sound', (_, def) => {
    const { ticks } = replay(def, def.solution);
    let state = initialState(def);
    const heard = new Set<string>();
    for (const t of ticks) {
      const r = step(def, state, t.input);
      for (const s of tickSounds(def, state, r.state, r.events)) heard.add('cue' in s ? s.cue : 'word' in s ? `word:${s.word}` : 'voice');
      state = r.state;
    }
    expect(state.done).toBe(true);
    for (const cue of ['patpat', 'ding', 'sparkle', 'voice']) expect(heard, `${def.id} ${[...heard].join(' ')}`).toContain(cue);
  });
});
