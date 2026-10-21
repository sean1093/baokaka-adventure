import { describe, expect, test } from 'vitest';
import { e, line, n, page, part } from './fixtures/toy';
import type { SimEvent } from './events';
import { initialState } from './state';
import { LEARNED_KEY, step } from './step';
import type { CreatureDef, Input, PageDef, SimState, Word } from './types';
import { inReach, sayNo, WHOOSH_CONE_DEGREES, WORD_EVENT, wordAvailable, wordEvent } from './words';

const say = (word: Word): Input => ({ t: 'say', word });
const NONE: Input = { t: 'none' };

/** Runs inputs from the page's initial state (or `from`), returning the final state and all events. */
function run(def: PageDef, inputs: Input[], from: SimState = initialState(def)) {
  let s = from;
  const events: SimEvent[] = [];
  for (const input of inputs) {
    const r = step(def, s, input);
    events.push(...r.events);
    s = r.state;
  }
  return { state: s, events };
}

describe('the words table (GDD § 2.4)', () => {
  test('each word emits its event', () => {
    expect(WORD_EVENT).toEqual({ beep: 'beep', bye: 'wave', no: null, wow: 'wow', hug: 'hug', plane: 'sky', whoosh: 'whoosh', together: 'together' });
    expect(WHOOSH_CONE_DEGREES).toBe(90);
  });

  test.each([
    ['beep', { type: 'beep', within: 120 }],
    ['bye', { type: 'wave', within: 160 }],
    ['wow', { type: 'wow', within: 160 }],
    ['plane', { type: 'sky', within: Infinity }],
    ['whoosh', { type: 'whoosh', within: 140, facing: 'l' }],
    ['hug', { type: 'hug' }],
    ['together', { type: 'together' }],
  ] as const)('%s comes from his node with its radius', (word, expected) => {
    const def = page({ nodes: [n('A', 30, 40)], edges: [], baby: { start: 'A', facing: 'l' } });
    expect(wordEvent(def, initialState(def), word)).toEqual({ id: 'A', at: [30, 40], ...expected });
  });

  test('不要！ emits nothing, and an unknown node gives no origin', () => {
    const def = page({ nodes: [n('A', 0)], edges: [] });
    expect(wordEvent(def, initialState(def), 'no')).toBeNull();
    const lost = { ...initialState(def), baby: { ...initialState(def).baby, node: 'nowhere' } };
    expect(wordEvent(def, lost, 'beep')).toEqual({ type: 'beep', id: 'nowhere', within: 120 });
  });
});

describe('inReach: radius and cone math', () => {
  const from = (within?: number, facing?: 'l' | 'r'): SimEvent => ({ type: 'beep', at: [100, 100], within, facing });

  test.each([
    ['the origin itself', [100, 100], true],
    ['exactly on the radius', [220, 100], true],
    ['on the radius diagonally (72² + 96² = 120²)', [172, 196], true],
    ['one unit past it', [221, 100], false],
    ['one unit past it diagonally', [173, 196], false],
  ] as const)('radius 120: %s', (_, point, expected) => {
    expect(inReach(from(120), point)).toBe(expected);
  });

  test('a whole-page event reaches everything, even off the page; no radius = whole page', () => {
    expect(inReach(from(Infinity), [9999, -9999])).toBe(true);
    expect(inReach(from(Infinity), undefined)).toBe(true);
    expect(inReach(from(undefined), [9999, 0])).toBe(true);
  });

  test('a finite radius never reaches off the page, nor from an unknown origin', () => {
    expect(inReach(from(120), undefined)).toBe(false);
    expect(inReach({ type: 'beep', within: 120 }, [0, 0])).toBe(false);
  });

  test('a reaction radius overrides the event radius', () => {
    expect(inReach(from(120), [300, 100], 200)).toBe(true);
    expect(inReach(from(120), [150, 100], 40)).toBe(false);
  });

  test.each([
    ['r', 'straight ahead', [200, 100], true],
    ['r', 'on the +45° edge', [190, 10], true],
    ['r', 'on the −45° edge', [190, 190], true],
    ['r', 'just outside the edge', [189, 190], false],
    ['r', 'straight up (90°)', [100, 50], false],
    ['r', 'behind', [40, 100], false],
    ['r', 'ahead but out of range (141 > 140)', [241, 100], false],
    ['r', 'his own spot', [100, 100], true],
    ['r', 'the cone’s far corner, inside (98² + 98² ≤ 140²)', [198, 198], true],
    ['r', 'the cone’s far corner, just past the arc (99² + 99² > 140²)', [199, 199], false],
    ['r', 'on the edge and the arc at once (84, −84 is inside: 84² · 2 ≤ 140²)', [184, 16], true],
    ['l', 'straight ahead (left)', [0, 100], true],
    ['l', 'on the edge', [10, 190], true],
    ['l', 'behind (right)', [160, 100], false],
    ['l', 'just outside the edge', [11, 190], false],
  ] as const)('咻—— facing %s: %s', (facing, _, point, expected) => {
    expect(inReach(from(140, facing), point)).toBe(expected);
  });
});

describe('wordAvailable and 不要！ bookkeeping', () => {
  test('every word unless the page restricts them; the learned word joins once learned', () => {
    const open = page({ nodes: [n('A', 0)], edges: [] });
    expect(wordAvailable(open, 'whoosh', false)).toBe(true);
    const strict = { ...open, words: ['bye'] as Word[], learns: { word: 'beep' as Word, when: { event: 'beep' as const } } };
    expect(wordAvailable(strict, 'bye', false)).toBe(true);
    expect(wordAvailable(strict, 'beep', false)).toBe(false);
    expect(wordAvailable(strict, 'beep', true)).toBe(true);
    expect(wordAvailable(strict, 'wow', true)).toBe(false);
  });

  test('sayNo adds the current target once; no target, no change', () => {
    const def = page({ nodes: [n('A', 0)], edges: [] });
    const s = initialState(def);
    expect(sayNo(s)).toBe(s);
    const aiming = { ...s, baby: { ...s.baby, target: 'bead' } };
    expect(sayNo(aiming).baby.refused).toEqual(['bead']);
    const again = sayNo(sayNo(aiming));
    expect(again.baby.refused).toEqual(['bead']);
  });
});

describe('saying a word (step, § 3.3 phases 1 and 5)', () => {
  test('saying lasts one tick: he stays put, and the word resolves at the end of it', () => {
    const def = page({ ...line('ABC'), parts: [part('gate', 'gate', 0, 0, { react: [{ on: 'beep', to: 'open' }] })], attractors: [{ id: 'bead', kind: 'shiny', node: 'C' }] });
    const r = step(def, initialState(def), say('beep'));
    expect(r.state.baby).toMatchObject({ mode: 'saying', node: 'A' });
    expect(r.events.map((ev) => ev.type)).toEqual(['beep', 'partEnter']);
    expect(r.state.parts.gate).toBe('open');
    const next = step(def, r.state, NONE).state;
    expect(next.baby).toMatchObject({ mode: 'moving', node: 'B' });
  });

  test('嗶！ opens gates within 120 of him, not beyond', () => {
    const gate = (id: string, x: number) => part(id, 'gate', x, 0, { react: [{ on: 'beep', to: 'open' }] });
    const def = page({ ...line('AB'), parts: [gate('near', 120), gate('far', 121)] });
    expect(step(def, initialState(def), say('beep')).state.parts).toEqual({ near: 'open', far: 'closed' });
  });

  test('掰掰 sends a creature away, dropping what it holds at its node; again near it brings it back', () => {
    const squirrel: CreatureDef = {
      id: 'squirrel',
      positions: { home: 'B', away: 'C' },
      initial: 'home',
      art: 'squirrel',
      react: [
        { on: 'wave', when: { creature: 'squirrel', at: 'home' }, to: 'away', drop: 'bead' },
        { on: 'wave', when: { creature: 'squirrel', at: 'away' }, to: 'home' },
      ],
    };
    const def = page({ ...line('ABC'), creatures: [squirrel], attractors: [{ id: 'bead', kind: 'shiny', node: 'B', heldBy: 'squirrel', goal: true }] });
    const away = step(def, initialState(def), say('bye')).state;
    expect(away.creatures.squirrel).toBe('away');
    expect(away.dropped).toEqual({ bead: 'B' });
    // The bead stays where it fell; he goes for it.
    const after = run(def, [NONE, NONE], away).state;
    expect(after.done).toBe(true);
    // From A (x 0) the squirrel at C (x 200) is out of 掰掰's 160: it stays away.
    expect(step(def, away, say('bye')).state.creatures.squirrel).toBe('away');
  });

  test('掰掰 again near the away position brings the creature back', () => {
    const crow: CreatureDef = {
      id: 'crow',
      positions: { home: 'B', away: 'C' },
      initial: 'home',
      art: 'crow',
      react: [
        { on: 'wave', when: { creature: 'crow', at: 'home' }, to: 'away' },
        { on: 'wave', when: { creature: 'crow', at: 'away' }, to: 'home' },
      ],
    };
    const def = page({ nodes: [n('A', 0), n('B', 100), n('C', 150)], edges: [], creatures: [crow] });
    const s = run(def, [say('bye'), say('bye')]).state;
    expect(s.creatures.crow).toBe('home');
  });

  test('不要！ refuses his target: he re-targets on the next tick', () => {
    const def = page({ ...line('ABC'), attractors: [{ id: 'coin', kind: 'shiny', node: 'C', decoy: true }, { id: 'milk', kind: 'snack', node: 'B' }] });
    const reaching = run(def, [NONE]).state;
    expect(reaching.baby.target).toBe('coin');
    const said = step(def, reaching, say('no'));
    expect(said.events).toEqual([]);
    expect(said.state.baby).toMatchObject({ mode: 'saying', refused: ['coin'] });
    expect(step(def, said.state, NONE).state.baby).toMatchObject({ target: 'milk', node: 'B', mode: 'eating' });
  });

  test('不要！ with nothing to refuse sends him looking; refusing the only thing makes him cry', () => {
    const def = page({ ...line('AB'), attractors: [{ id: 'coin', kind: 'shiny', node: 'B', decoy: true }] });
    const s = run(def, [NONE, say('no'), NONE, NONE, NONE]);
    expect(s.state.baby.mode).toBe('crying');
    expect(s.events.filter((ev) => ev.type === 'cry')).toHaveLength(1);
  });

  test('refusing the only thing: two cries, then he forgets and wants it again (D-75, never stranded)', () => {
    // A bead behind a closed edge: he reaches for it, refuses it, looks twice, cries twice, then goes back to reaching.
    const far = page({ nodes: [n('A', 0), n('B', 100)], edges: [e('A', 'B', { when: { flag: 'bridge' } })], attractors: [{ id: 'bead', kind: 'shiny', node: 'B', goal: true }] });
    let s = run(far, [NONE, NONE]).state;
    expect(s.baby).toMatchObject({ mode: 'reaching', target: 'bead' });
    const modes: string[] = [];
    const refusedLog: string[][] = [];
    let cries = 0;
    for (const input of [say('no'), NONE, NONE, NONE, NONE, NONE]) {
      const r = step(far, s, input);
      s = r.state;
      modes.push(s.baby.mode);
      refusedLog.push(s.baby.refused);
      cries += r.events.filter((ev) => ev.type === 'cry').length;
    }
    expect(modes).toEqual(['saying', 'looking', 'looking', 'crying', 'crying', 'reaching']);
    expect(refusedLog).toEqual([['bead'], ['bead'], ['bead'], ['bead'], [], []]);
    expect(cries).toBe(2);
    // Comfort is silent, and the count is back to 0
    expect(s.baby).toMatchObject({ target: 'bead', lookCount: 0 });
  });

  test('crying with nothing refused goes on (0-4: crying is a tool) and keeps lookCount at 0', () => {
    const def = page({ ...line('AB') });
    let s = initialState(def);
    for (let i = 0; i < 8; i++) s = step(def, s, NONE).state;
    expect(s.baby).toMatchObject({ mode: 'crying', lookCount: 0 });
  });

  test('a cry over a refusal still works as a tool: it wakes what hears it', () => {
    const door = part('door', 'gate', 0, 0, { react: [{ on: 'cry', to: 'open' }] });
    const def = page({ ...line('AB'), parts: [door], attractors: [{ id: 'moon', kind: 'shiny', node: 'B', decoy: true }] });
    const s = run(def, [NONE, say('no'), NONE, NONE, NONE]).state;
    expect(s.parts.door).toBe('open');
  });

  test('a refusal lapses on the say tick when its attractor changes then (哇！ turns the refused lamp off)', () => {
    const lamp = part('lamp', 'light', 100, 0, { attractor: 'glow', react: [{ on: 'wow', to: 'toggle' }] });
    const def = page({ ...line('AB'), parts: [lamp], attractors: [{ id: 'glow', kind: 'light', node: 'B', activeWhen: { part: 'lamp', in: ['on'] } }] });
    const lit = { ...initialState(def), parts: { lamp: 'on' }, baby: { ...initialState(def).baby, refused: ['glow'] } };
    expect(step(def, lit, say('wow')).state.baby.refused).toEqual([]);
  });

  test('哇！ switches lights within 160 on, and off again; their attractors become active', () => {
    const lamp = (id: string, x: number) => part(id, 'light', x, 0, { attractor: `${id}Glow`, react: [{ on: 'wow', to: 'toggle' }] });
    const def = page({
      ...line('ABC'),
      parts: [lamp('near', 160), lamp('far', 200)],
      attractors: [{ id: 'nearGlow', kind: 'light', node: 'B', activeWhen: { part: 'near', in: ['on'] } }],
    });
    const on = step(def, initialState(def), say('wow')).state;
    expect(on.parts).toEqual({ near: 'on', far: 'off' });
    const watching = run(def, [NONE], on).state;
    expect(watching.baby).toMatchObject({ target: 'nearGlow', node: 'B', mode: 'watching' });
    expect(step(def, on, say('wow')).state.parts.near).toBe('off');
  });

  test('飛機！ toggles every winged creature, wherever it is, between ground and sky', () => {
    const bird = (id: string, positions: Record<string, string>, more: Partial<CreatureDef> = {}): CreatureDef => ({ id, positions, initial: 'ground', winged: true, art: id, ...more });
    const def = page({
      nodes: [n('A', 0), n('B', 5000)],
      edges: [e('A', 'B')],
      creatures: [
        bird('pigeon', { ground: 'B', away: 'offpage' }),
        bird('heron', { ground: 'B', sky: 'offpage', away: 'A' }),
        bird('dodo', { ground: 'B', nest: 'A' }),
        bird('hen', { ground: 'B', away: 'A' }, { winged: false }),
        bird('owl', { ground: 'B', away: 'offpage', perch: 'A' }, { react: [{ on: 'sky', to: 'perch' }] }),
      ],
    });
    const up = step(def, initialState(def), say('plane')).state;
    expect(up.creatures).toEqual({ pigeon: 'away', heron: 'sky', dodo: 'ground', hen: 'ground', owl: 'perch' });
    const down = step(def, up, say('plane')).state;
    expect(down.creatures).toMatchObject({ pigeon: 'ground', heron: 'ground' });
  });

  test('飛機！ also reaches parts with a `sky` reaction across the page', () => {
    const def = page({ ...line('AB'), parts: [part('plane', 'tab', 9000, 0, { states: ['s0', 's1'], react: [{ on: 'sky', to: 'next' }] })] });
    expect(step(def, initialState(def), say('plane')).state.parts.plane).toBe('s1');
  });

  test('咻—— advances blowables in its cone, wrapping; not behind him; a reaction of their own wins', () => {
    const blow = (id: string, x: number, y = 0, more: Partial<Parameters<typeof part>[4]> = {}) => part(id, 'blowable', x, y, { states: ['0', '1', '2'], ...more });
    const def = page({
      nodes: [n('A', 100), n('B', 200)],
      edges: [e('A', 'B')],
      parts: [
        blow('ahead', 200),
        blow('edge', 180, 80),
        blow('wide', 179, 81),
        blow('behind', 40),
        blow('far', 241),
        blow('last', 150, 0, { initial: '2' }),
        blow('sail', 150, 0, { react: [{ on: 'whoosh', when: { flag: 'never' }, to: '2' }] }),
        part('mill', 'section', 150, 0, { states: ['n', 'e'], react: [{ on: 'whoosh', to: 'next' }] }),
      ],
    });
    expect(step(def, initialState(def), say('whoosh')).state.parts).toEqual({ ahead: '1', edge: '1', wide: '0', behind: '0', far: '0', last: '0', sail: '0', mill: 'e' });
    const turned = { ...initialState(def), baby: { ...initialState(def).baby, facing: 'l' as const } };
    expect(step(def, turned, say('whoosh')).state.parts).toMatchObject({ ahead: '0', behind: '1' });
  });

  test('words a page restricts are ignored until learned', () => {
    const def = page({
      ...line('AB'),
      parts: [part('gate', 'gate', 0, 0, { react: [{ on: 'beep', to: 'open' }] })],
      words: [],
      learns: { word: 'beep', when: { flag: 'taught' } },
    });
    const s = step(def, initialState(def), say('beep')).state;
    expect(s.baby.mode).not.toBe('saying');
    expect(s.parts.gate).toBe('closed');
    const taught = { ...initialState(def), counters: { [LEARNED_KEY]: 1 } };
    expect(step(def, taught, say('beep')).state.parts.gate).toBe('open');
  });

  test('抱抱 lets an adjacent idle carrier pick him up (#120; the rules in m3.test.ts)', () => {
    const def = page({ ...line('ABC'), parts: [part('auntie', 'carrier', 100, 0, { route: ['B', 'C'] })] });
    const s = step(def, initialState(def), say('hug')).state;
    expect(s.baby).toMatchObject({ mode: 'carried', node: 'B', carriedBy: { id: 'auntie', k: 0 } });
  });

  test('一起 enters linked mode (#128): Mocha hops down to his node (the rules in m4.test.ts)', () => {
    const def = page({ ...line('AB'), perches: [{ id: 'p', node: 'B' }], mocha: { start: 'p' } });
    const s = step(def, initialState(def), say('together')).state;
    expect(s.baby).toMatchObject({ linked: true, mode: 'saying', node: 'A' });
    expect(s.mocha).toEqual({ perch: null, path: [], floorNode: 'A' });
  });

  test('抱抱 with no carrier: the event and hugNobody (arms up, Mocha purrs); 一起 with no Mocha links nothing', () => {
    const def = page({ ...line('AB') });
    expect(step(def, initialState(def), say('hug')).events).toEqual([{ type: 'hug', id: 'A', at: [0, 0] }, { type: 'hugNobody' }]);
    expect(step(def, initialState(def), say('together')).state.baby.linked).toBe(false);
  });
});
