import { describe, expect, test } from 'vitest';
import { replay, step, initialState } from '../../core';
import { BABY_MODES, type EdgeKind, type Growth, type Word } from '../../core/types';
import { pageById } from '../../pages';
import { SPRITE_MANIFEST, spriteDef, type SpriteId } from '../../sprites';
import {
  BABY_MODE_ANIM,
  FRAME_REPORT,
  GROWTH_NEEDS,
  HOP_AT,
  MAX_STRIDE_FPS,
  MOCHA_STATES,
  MOCHA_STATE_ANIM,
  WORD_POSE,
  babyAnim,
  chooseFrame,
  edgeKind,
  frameStatus,
  mochaAnim,
  mochaState,
  sayingWord,
  strideCycles,
  type ActorAnim,
} from './animMap';
import { FADE_MS, LAND_MS, LEAN_DEG, WOBBLE_DEG, fadeSlide, lookFacing, standeeTilt, stepT, travelDir } from './standee';

/** #95: every simulation mode and Mocha state has an animation, on frames that exist. */

const EDGES: readonly (EdgeKind | null)[] = [null, 'crawl', 'climb', 'cruise', 'walk'];
const GROWTHS: readonly Growth[] = [0, 1, 2, 3];
const WORDS: readonly (Word | null)[] = [null, 'beep', 'bye', 'no', 'wow', 'hug', 'plane', 'whoosh', 'together'];

/** Every animation any input can produce. */
function everyBabyAnim(): ActorAnim[] {
  const out: ActorAnim[] = [];
  for (const mode of BABY_MODES)
    for (const edge of EDGES)
      for (const growth of GROWTHS)
        for (const riding of [false, true])
          for (const watching of [false, true]) for (const word of WORDS) out.push(babyAnim({ mode, edge, growth, riding, watching, word }));
  return out;
}

/** The animation's frames exist: the pose is in the manifest and every frame index is in range. */
function expectFrames(anim: ActorAnim) {
  const def = spriteDef(anim.sprite);
  expect(def.kind, anim.sprite).toBe('pose');
  const play = anim.play;
  const n = def.anims.main.frames.length;
  if (play.kind === 'hold' && play.frame !== undefined) expect(play.frame).toBeLessThan(n);
  if (play.kind === 'step') expect(play.at.length).toBeLessThanOrEqual(n);
  if (play.kind === 'stride') {
    expect(n).toBe(8);
    expect(def.anims.key?.frames.length).toBe(4);
  }
  if (play.kind === 'clock') expect(n).toBeGreaterThan(1);
}

describe('寶咖咖', () => {
  test('every BabyMode has an entry, on existing frames', () => {
    expect(Object.keys(BABY_MODE_ANIM).sort()).toEqual([...BABY_MODES].sort());
    for (const mode of BABY_MODES) expectFrames(BABY_MODE_ANIM[mode]);
  });

  test('every animation the inputs can produce references existing frames', () => {
    for (const a of everyBabyAnim()) expectFrames(a);
  });

  test('the GDD names map onto the delivered poses (Art v2 § 5)', () => {
    expect(BABY_MODE_ANIM.grabbing.sprite).toBe('baokaka.hold');
    expect(BABY_MODE_ANIM.cuddling.sprite).toBe('baokaka.hug');
    expect(BABY_MODE_ANIM.saying.sprite).toBe('baokaka.point');
    expect(BABY_MODE_ANIM.reaching.sprite).toBe('baokaka.reach');
    expect(BABY_MODE_ANIM.crying).toMatchObject({ sprite: 'baokaka.cry', play: { kind: 'clock' } });
    expect(BABY_MODE_ANIM.idle.sprite).toBe('baokaka.sit');
    expect(babyAnim({ mode: 'moving', edge: 'crawl', growth: 0 })).toMatchObject({ sprite: 'baokaka.crawl', play: { kind: 'stride' } });
    expect(babyAnim({ mode: 'moving', edge: 'cruise', growth: 2 }).sprite).toBe('baokaka.wobble');
    expect(babyAnim({ mode: 'moving', edge: 'walk', growth: 3 })).toMatchObject({ sprite: 'baokaka.walk', play: { kind: 'stride' } });
  });

  test('fallbacks for the frames #141 draws, each marked', () => {
    expect(babyAnim({ mode: 'looking', edge: null, growth: 0 })).toMatchObject({ sprite: 'baokaka.sit', lookAround: true, fallback: expect.any(String) });
    expect(babyAnim({ mode: 'watching', edge: null, growth: 0 })).toMatchObject({ sprite: 'baokaka.sit', sway: true, fallback: expect.any(String) });
    expect(babyAnim({ mode: 'reaching', edge: null, growth: 0, watching: true })).toMatchObject({ sprite: 'baokaka.sit', gdd: 'touchWatch', fallback: expect.any(String) });
    expect(babyAnim({ mode: 'reaching', edge: null, growth: 0, riding: true })).toMatchObject({ sprite: 'baokaka.bounce', gdd: 'rideGiggle', fallback: expect.any(String) });
    expect(babyAnim({ mode: 'carried', edge: null, growth: 0 }).fallback).toBeDefined();
    expect(babyAnim({ mode: 'moving', edge: 'climb', growth: 1 })).toMatchObject({ sprite: 'baokaka.crawl', gdd: 'climb', fallback: expect.any(String) });
  });

  test('a ride does not interrupt his stronger poses', () => {
    expect(babyAnim({ mode: 'crying', edge: null, growth: 0, riding: true }).sprite).toBe('baokaka.cry');
    expect(babyAnim({ mode: 'done', edge: null, growth: 0, riding: true }).sprite).toBe('baokaka.clap');
  });

  test('saying: the word decides the pose (point by default)', () => {
    expect(babyAnim({ mode: 'saying', edge: null, growth: 0, word: 'beep' }).sprite).toBe('baokaka.point');
    expect(babyAnim({ mode: 'saying', edge: null, growth: 0 }).sprite).toBe('baokaka.point');
    for (const [word, sprite] of Object.entries(WORD_POSE)) expect(babyAnim({ mode: 'saying', edge: null, growth: 0, word: word as Word }).sprite).toBe(sprite);
  });

  test('growth guard: no standing pose before its stage (bible § 5)', () => {
    for (const a of everyBabyAnim()) expect(a.sprite).toBeDefined();
    for (const mode of BABY_MODES)
      for (const edge of EDGES)
        for (const growth of GROWTHS) {
          const a = babyAnim({ mode, edge, growth });
          const needs = GROWTH_NEEDS[a.sprite];
          if (needs !== undefined) expect(growth, `${mode} ${edge} @${growth} → ${a.sprite}`).toBeGreaterThanOrEqual(needs);
        }
    expect(babyAnim({ mode: 'moving', edge: 'cruise', growth: 1 }).sprite).toBe('baokaka.crawl');
    expect(babyAnim({ mode: 'moving', edge: 'walk', growth: 2 }).sprite).toBe('baokaka.crawl');
  });
});

describe('摩卡', () => {
  test('every Mocha state has an entry, on existing frames', () => {
    expect(Object.keys(MOCHA_STATE_ANIM).sort()).toEqual([...MOCHA_STATES].sort());
    for (const s of MOCHA_STATES) expectFrames(MOCHA_STATE_ANIM[s]);
  });

  test('hop is jump × 3 along the step; eye contact is push frame 1 for its whole tick; land is jump frame 3', () => {
    const hop = mochaAnim({ travelling: true, edge: 'jump' });
    expect(hop.sprite).toBe('mocha.jump');
    const at = (k: number) => chooseFrame(hop, { k, dist: 0, tickMs: 500, hold: false }).frame;
    expect([at(0), at(0.5), at(0.9), at(1)]).toEqual([0, 1, 2, 2]);
    expect(HOP_AT[0]).toBe(0);
    const stare = mochaAnim({ travelling: false, staring: true });
    expect(stare).toMatchObject({ sprite: 'mocha.push', play: { kind: 'hold', frame: 0 }, gdd: 'eyeContact' });
    expect(mochaAnim({ travelling: false, pushing: true })).toMatchObject({ sprite: 'mocha.push', play: { kind: 'hold', frame: 1 }, gdd: 'push' });
    // Arriving on the stare tick: the hop, then the eye contact from the landing on
    expect(mochaState({ travelling: true, staring: true })).toBe('hop');
    expect(mochaState({ travelling: true, landed: true, staring: true })).toBe('eyeContact');
    expect(mochaState({ travelling: true, landed: true })).toBe('hop');
  });

  test('precedence and the fallbacks', () => {
    expect(mochaState({ travelling: true, hidden: true })).toBe('inBox');
    expect(mochaState({ travelling: true, edge: 'squeeze' })).toBe('squeeze');
    expect(mochaState({ travelling: false, staring: true, glare: true })).toBe('eyeContact');
    expect(mochaState({ travelling: false, glare: true, puff: true })).toBe('glare');
    expect(mochaState({ travelling: false, puff: true })).toBe('puff');
    expect(mochaState({ travelling: false, nope: true })).toBe('nope');
    expect(mochaState({ travelling: false, cuddled: true, onPart: true })).toBe('purr');
    expect(mochaState({ travelling: false, onPart: true })).toBe('onPart');
    expect(mochaState({ travelling: false })).toBe('sit');
    expect(MOCHA_STATE_ANIM.glare).toMatchObject({ sprite: 'mocha.sit', glare: true, fallback: expect.any(String) });
    expect(MOCHA_STATE_ANIM.purr).toMatchObject({ sprite: 'mocha.loaf', fallback: expect.any(String) });
    expect(MOCHA_STATE_ANIM.inBox).toMatchObject({ hidden: true, fallback: expect.any(String) });
  });
});

describe('frames over the tick', () => {
  const crawl = BABY_MODE_ANIM.moving;

  test('whole strides per edge; the 4-frame key cycle when 8 frames would run too fast', () => {
    expect(strideCycles(10)).toBe(1);
    expect(strideCycles(50)).toBe(1);
    expect(strideCycles(90)).toBe(2);
    expect(chooseFrame(crawl, { k: 0.5, dist: 50, tickMs: 500, hold: false })).toEqual({ anim: 'main', frame: 4, playing: false });
    // 2 strides × 8 frames in 500 ms is 32 fps > 24: the key cycle
    const fast = chooseFrame(crawl, { k: 0.5, dist: 90, tickMs: 500, hold: false });
    expect(fast.anim).toBe('key');
    expect((2 * 8) / 0.5).toBeGreaterThan(MAX_STRIDE_FPS);
    expect(chooseFrame(crawl, { k: 0.5, dist: 90, tickMs: 750, hold: false }).anim).toBe('main');
  });

  test('held (reduced motion, stills) and between steps: the key frame; a step sequence shows its landed frame', () => {
    expect(chooseFrame(crawl, { k: 0.5, dist: 50, tickMs: 500, hold: true })).toEqual({ anim: 'main', playing: false });
    expect(chooseFrame(crawl, { k: 1, dist: 50, tickMs: 500, hold: false })).toEqual({ anim: 'main', playing: false });
    expect(chooseFrame(MOCHA_STATE_ANIM.hop, { k: 0.5, dist: 0, tickMs: 500, hold: true }).frame).toBe(2);
    expect(chooseFrame(BABY_MODE_ANIM.crying, { k: 0, dist: 0, tickMs: 500, hold: true }).playing).toBe(false);
    expect(chooseFrame(BABY_MODE_ANIM.crying, { k: 0, dist: 0, tickMs: 500, hold: false }).playing).toBe(true);
  });
});

describe('reading the tick', () => {
  const def = pageById('c1p2')!;

  test('edgeKind: either direction, null when not adjacent', () => {
    expect(edgeKind(def, 'L1', 'L2')).toBe('crawl');
    expect(edgeKind(def, 'L2', 'L1')).toBe('crawl');
    expect(edgeKind(def, 'pillarTop', 'bench')).toBe('jump');
    expect(edgeKind(def, 'L1', 'R2')).toBeNull();
    expect(edgeKind({ edges: [{ a: 'a', b: 'b', kind: 'climb', oneWay: true }] }, 'b', 'a')).toBeNull();
  });

  test('sayingWord: only while saying, from the word event or a grown refused set', () => {
    const s = initialState(def);
    const saying = { ...s, baby: { ...s.baby, mode: 'saying' as const } };
    expect(sayingWord(s, s, [{ type: 'beep' }])).toBeNull();
    expect(sayingWord(s, saying, [{ type: 'bark' }, { type: 'beep' }])).toBe('beep');
    expect(sayingWord(s, saying, [{ type: 'wave' }])).toBe('bye');
    expect(sayingWord(s, saying, [{ type: 'sky' }])).toBe('plane');
    expect(sayingWord(s, { ...saying, baby: { ...saying.baby, refused: ['bead'] } }, [])).toBe('no');
    expect(sayingWord(s, saying, [])).toBeNull();
  });

  test('1-2 played through: every tick maps to frames that exist', () => {
    let state = initialState(def);
    for (const tick of replay(def, def.solution).ticks) {
      const next = step(def, state, tick.input).state;
      const a = babyAnim({ mode: next.baby.mode, edge: state.baby.node === next.baby.node ? null : edgeKind(def, state.baby.node, next.baby.node), growth: 0 });
      expectFrames(a);
      state = next;
    }
  });
});

describe('the missing-frame report (GDD § 3.9)', () => {
  test('rows reference delivered frames that exist', () => {
    for (const row of FRAME_REPORT)
      for (const d of row.delivered) {
        const def = SPRITE_MANIFEST.sprites[d.sprite as SpriteId];
        expect(def, d.sprite).toBeDefined();
        for (const f of d.frames) expect(f).toBeLessThan(def.files.length);
      }
  });

  test('cycles are 8 frames; M3/M4 frames are later; every M1 gap has a fallback', () => {
    const row = (char: string, id: string) => FRAME_REPORT.find((r) => r.char === char && r.id === id)!;
    expect(row('baokaka', 'crawl').frames).toBe(8);
    expect(row('baokaka', 'walk').frames).toBe(8);
    expect(row('mocha', 'walk').frames).toBe(8);
    for (const id of ['carried', 'climb', 'standCruise', 'walk']) expect(frameStatus(row('baokaka', id))).toBe('later');
    expect(frameStatus(row('mocha', 'walk'))).toBe('later');
    for (const r of FRAME_REPORT) if (frameStatus(r) === 'missing') expect(r.fallback, `${r.char} ${r.id}`).toBeDefined();
  });

  test('today: the gaps #141 fills', () => {
    const missing = FRAME_REPORT.filter((r) => frameStatus(r) === 'missing').map((r) => `${r.char}.${r.id}`);
    expect(missing).toEqual(['baokaka.reach', 'baokaka.look', 'baokaka.watchSway', 'baokaka.rideGiggle', 'baokaka.touchWatch', 'mocha.glare', 'mocha.purr', 'mocha.inBox']);
  });

  test('every animation the map shows names a report row (or none, for an extra)', () => {
    const ids = new Set(FRAME_REPORT.map((r) => r.id));
    for (const a of [...everyBabyAnim(), ...MOCHA_STATES.map((s) => MOCHA_STATE_ANIM[s])]) if (a.gdd !== null) expect(ids.has(a.gdd), a.gdd).toBe(true);
  });
});

describe('standee motion (bible § 5, § 8)', () => {
  test('the step ends LAND_MS early; the lean peaks mid-step; the wobble is ±2° and settles', () => {
    expect(stepT(0, 500)).toBe(0);
    expect(stepT(500 - LAND_MS, 500)).toBe(1);
    expect(standeeTilt((500 - LAND_MS) / 2, 500, 1)).toBeCloseTo(LEAN_DEG);
    expect(standeeTilt((500 - LAND_MS) / 2, 500, -1)).toBeCloseTo(-LEAN_DEG);
    let peak = 0;
    for (let ms = 500 - LAND_MS; ms <= 500; ms += 2) peak = Math.max(peak, Math.abs(standeeTilt(ms, 500, 1)));
    expect(peak).toBeLessThanOrEqual(WOBBLE_DEG);
    expect(peak).toBeGreaterThan(WOBBLE_DEG / 2);
    expect(standeeTilt(500, 500, 1)).toBe(0);
    expect(standeeTilt(100, 500, 1, true)).toBe(0);
    expect(standeeTilt(100, 500, 0)).toBe(0);
  });

  test('travelDir and the fade-slide', () => {
    expect(travelDir([0, 0], [10, 0])).toBe(1);
    expect(travelDir([10, 0], [0, 0])).toBe(-1);
    expect(travelDir([0, 0], [0, 40])).toBe(0);
    expect(fadeSlide([0, 0], [100, 0], 0)).toEqual({ x: 90, y: 0, opacity: 0.25 });
    expect(fadeSlide([0, 0], [100, 0], FADE_MS)).toEqual({ x: 100, y: 0, opacity: 1 });
    expect(fadeSlide([95, 0], [100, 0], 0).x).toBe(95);
  });

  test('look L/R flips away and back over the tick', () => {
    expect(lookFacing('r', 0, 500)).toEqual({ from: 'r', to: 'r', ms: 0 });
    expect(lookFacing('r', 200, 500)).toEqual({ from: 'r', to: 'l', ms: 50 });
    expect(lookFacing('r', 400, 500)).toEqual({ from: 'l', to: 'r', ms: 50 });
  });
});
