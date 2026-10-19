import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { POPUP, POPUP_STAGE } from '../../../art/palette';
import {
  MARIGOLD_DELTA_E,
  PART_PRESETS,
  deltaE,
  deltaEHex,
  PRESET_DEFS,
  isNearMarigold,
  kitCtx,
  kitDefs,
  marigoldDistance,
  parseHex,
  pullTab,
  rgbToLab,
  sealR,
} from '../../art';
import { initialState, replay, step, withPartState } from '../../core';
import type { PageDef, SimState } from '../../core/types';
import { PAGES, pageById } from '../../pages';
import { NO_GESTURE, targetsOf, type GestureFlags } from '../gestures';
import { PageView } from '../PageView';
import { handGesture, linkThread } from './hints';
import { lintAffordance, lintAffordanceData, lintMarkup, lintPresetArt, MIN_HIT_UNITS, REFERENCE_SCALE } from './lint';
import { marigoldParts, wearsMarigold, type AffordanceFlags } from './look';
import { WIGGLE_JITTER_MS, WIGGLE_MS, WIGGLE_PERIOD_MS, WiggleScheduler } from './wiggle';

/**
 * The touchable affordance system (#140; popup art bible § 4, § 4.1, § 4.2): the ΔE maths behind
 * the reserved marigold, the idle wiggle scheduler on a fake clock, the lint (every page and every
 * preset clean, and its negative fixtures), the hint geometry, and each § 4.1 state as `PageView`
 * draws it.
 */

beforeAll(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
});
afterAll(() => {
  vi.restoreAllMocks();
});

const c1p2 = pageById('c1p2')!;
const c0p1 = pageById('c0p1')!;

function render(def: PageDef, state: SimState, opts: { reduced?: boolean; gesture?: Partial<GestureFlags>; affordance?: AffordanceFlags; scale?: number } = {}): string {
  return renderToStaticMarkup(
    createElement(PageView, { def, prev: state, state, ms: 1e6, tickMs: 500, reduced: opts.reduced ?? false, scale: opts.scale ?? 1, gesture: { ...NO_GESTURE, ...opts.gesture }, affordance: opts.affordance }),
  );
}

/** Every state a page passes through on its solution, plus the start. */
function solutionStates(def: PageDef): SimState[] {
  let s = initialState(def);
  const out = [s];
  for (const t of replay(def, def.solution, s).ticks) {
    s = step(def, s, t.input).state;
    out.push(s);
  }
  return out;
}

describe('ΔE (CIE76) and the reserved marigold', () => {
  test('Lab conversion matches the reference values', () => {
    const near = (a: readonly number[], b: readonly number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 1));
    near(rgbToLab([255, 255, 255]), [100, 0, 0]);
    near(rgbToLab([0, 0, 0]), [0, 0, 0]);
    near(rgbToLab([255, 0, 0]), [53.24, 80.09, 67.2]);
  });

  test('ΔE is the Lab distance, symmetric, zero on itself', () => {
    expect(deltaEHex('#fff', '#000')).toBeCloseTo(100, 4);
    expect(deltaEHex(POPUP.marigold, POPUP.marigold)).toBe(0);
    expect(deltaEHex(POPUP.marigoldLight, POPUP.lamp)).toBeCloseTo(deltaEHex(POPUP.lamp, POPUP.marigoldLight), 10);
    expect(deltaE([50, 10, 10], [53, 14, 10])).toBe(5);
    expect(Number.isNaN(deltaEHex('red', '#fff'))).toBe(true);
    expect(parseHex('#abc')).toEqual([170, 187, 204]);
  });

  test('marigold and its deep stop are reserved; a printed taxi yellow is caught, ochre and lamplight are not', () => {
    expect(isNearMarigold(POPUP.marigold)).toBe(true);
    expect(isNearMarigold(POPUP.marigoldDeep)).toBe(true);
    expect(isNearMarigold('#F7B731')).toBe(true); // a saturated taxi yellow
    expect(isNearMarigold('#FFC000')).toBe(true);
    for (const c of [POPUP.ochre, POPUP.ochreDark, POPUP.gold, POPUP.lamp, POPUP.windowMid, POPUP.lampAmber, POPUP.kraft, POPUP.page]) {
      expect(marigoldDistance(c), c).toBeGreaterThanOrEqual(MARIGOLD_DELTA_E);
    }
  });

  test('no palette colour but the marigold card itself sits within ΔE 12 of it', () => {
    const named = { ...POPUP, ...Object.fromEntries(Object.entries(POPUP_STAGE).map(([k, v]) => [`stage.${k}`, v])) } as Record<string, unknown>;
    const near = Object.entries(named)
      .filter(([, v]) => typeof v === 'string' && isNearMarigold(v))
      .map(([k]) => k)
      .sort();
    expect(near).toEqual(['marigold', 'marigoldDeep']);
  });
});

describe('idle wiggle scheduler (fake clock)', () => {
  /** Runs the scheduler for `ms`, jumping straight to each due time. */
  function run(ids: string[], ms: number, seed = 7): Map<string, number[]> {
    const s = new WiggleScheduler(ids, { seed, startMs: 1000 });
    const times = new Map(ids.map((id) => [id, [] as number[]]));
    for (let now = s.nextAt(); now <= ms; now = s.nextAt()) for (const id of s.due(now)) times.get(id)!.push(now);
    return times;
  }

  test('every part wiggles every 4 s ± 0.8 s', () => {
    for (const n of [1, 2, 3, 5]) {
      const times = run(Array.from({ length: n }, (_, i) => `p${i}`), 120_000);
      for (const [, list] of times) {
        expect(list.length).toBeGreaterThan(20);
        for (let i = 1; i < list.length; i++) {
          const gap = list[i] - list[i - 1];
          expect(gap).toBeGreaterThanOrEqual(WIGGLE_PERIOD_MS - WIGGLE_JITTER_MS - 1e-6);
          expect(gap).toBeLessThanOrEqual(WIGGLE_PERIOD_MS + WIGGLE_JITTER_MS + 1e-6);
        }
      }
    }
  });

  test('the first round is spread over one period after the start', () => {
    const times = run(['a', 'b', 'c', 'd'], 5100);
    const firsts = [...times.values()].map((l) => l[0]).sort((x, y) => x - y);
    expect(firsts[0]).toBeGreaterThanOrEqual(1000);
    expect(firsts[3]).toBeLessThan(1000 + WIGGLE_PERIOD_MS);
    for (let i = 1; i < firsts.length; i++) expect(firsts[i] - firsts[i - 1]).toBeGreaterThanOrEqual(WIGGLE_MS);
  });

  test('staggered: the page never pulses in unison (no two wiggles overlap)', () => {
    for (const seed of [1, 2, 3, 42, 1234]) {
      const all = [...run(['a', 'b', 'c', 'd'], 120_000, seed).values()].flat().sort((x, y) => x - y);
      for (let i = 1; i < all.length; i++) expect(all[i] - all[i - 1], `seed ${seed} at ${all[i]}`).toBeGreaterThanOrEqual(WIGGLE_MS);
    }
  });

  test('deterministic per seed, different across seeds', () => {
    expect(run(['a', 'b'], 30_000, 5)).toEqual(run(['a', 'b'], 30_000, 5));
    expect(run(['a', 'b'], 30_000, 5)).not.toEqual(run(['a', 'b'], 30_000, 6));
  });

  test('due returns nothing before the next time, and nothing with no parts', () => {
    const s = new WiggleScheduler(['a'], { startMs: 500 });
    expect(s.due(s.nextAt() - 1)).toEqual([]);
    expect(s.due(s.nextAt())).toEqual(['a']);
    expect(new WiggleScheduler([]).nextAt()).toBe(Infinity);
  });
});

describe('affordance lint', () => {
  test('which parts wear marigold: player-driven presets with an input, never props', () => {
    expect(marigoldParts(c1p2.parts)).toEqual(['train']);
    expect(marigoldParts(c0p1.parts)).toEqual(['crib-rail']);
    const board = c1p2.parts.find((p) => p.id === 'board')!;
    expect(wearsMarigold(board)).toBe(false);
    expect(wearsMarigold({ ...c1p2.parts[0], input: 'none' })).toBe(false);
  });

  test.each(PAGES.map((def) => [def.id, def] as const))('%s: clean in every state of its solution, in every look', (_, def) => {
    for (const state of solutionStates(def)) {
      for (const reduced of [false, true]) {
        const r = lintAffordance(def, render(def, state, { reduced }));
        expect(r.errors, r.errors.map((e) => e.message).join('\n')).toEqual([]);
        expect(r.warnings, r.warnings.map((e) => e.message).join('\n')).toEqual([]);
      }
    }
    // With the states drawn: a drag, a hint at both levels, a locked veil and the reveal outlines
    const s = initialState(def);
    const touchable = marigoldParts(def.parts)[0];
    const html = render(def, s, { gesture: { dragging: touchable, reveal: true }, affordance: { hint: { level: 2, key: touchable }, elder: true } });
    expect(lintAffordance(def, html).errors).toEqual([]);
  });

  test.each(PART_PRESETS.map((p) => [p] as const))('kit preset %s: all four cues if touchable, no marigold if printed', (preset) => {
    expect(lintPresetArt(preset)).toEqual([]);
    expect(lintPresetArt(preset, { touchable: false })).toEqual([]);
  });

  test('negative fixture: a near-marigold decoration in the page art is an error', () => {
    const html = render(c1p2, initialState(c1p2));
    // A saturated taxi in the backdrop, and a cut-out painted with the touchables' own gradient
    const taxi = html.replace('data-layer="backdrop">', 'data-layer="backdrop"><rect width="40" height="20" fill="#F7B731"/>');
    const tabPaint = html.replace('data-layer="cutouts">', `data-layer="cutouts"><rect width="40" height="20" fill="url(#${html.match(/id="([^"]*tabG)"/)![1]})"/>`);
    for (const [name, bad] of [['taxi', taxi], ['gradient', tabPaint]] as const) {
      const r = lintAffordance(c1p2, bad);
      expect(r.errors.map((e) => e.code), name).toEqual(['A01-near-marigold']);
      expect(r.errors[0].message).toMatch(/ΔE \d+\.\d from the reserved marigold/);
    }
    // … but the same paint inside a marked affordance is fine
    const marked = html.replace('data-layer="backdrop">', 'data-layer="backdrop"><g data-affordance="perch"><rect fill="#F7B731"/></g>');
    expect(lintAffordance(c1p2, marked).errors).toEqual([]);
  });

  test('negative fixture: a prop painted marigold is a decoration, not a touchable', () => {
    const html = render(c1p2, initialState(c1p2)).replace(/(data-part="board"[^>]*>)/, '$1<circle r="9" fill="#FFC23A"/>');
    expect(lintAffordance(c1p2, html).errors.map((e) => [e.code, e.ids])).toEqual([['A01-near-marigold', ['board']]]);
  });

  test('negative fixture: a touchable missing its seal (and grip, cue, marigold) is an error per cue', () => {
    const ctx = kitCtx('neg');
    const unsealed = `${kitDefs(ctx, PRESET_DEFS)}<g data-part="t">${pullTab(ctx, 0, 0, { sealed: false })}</g>`;
    expect(lintMarkup(unsealed, { page: 'neg', touchable: () => true, expected: ['t'], where: 'test' }).map((e) => e.code)).toEqual(['A02-missing-seal']);
    const bare = '<g data-part="t"><rect width="10" height="10" fill="#6A4A9A"/></g>';
    expect(lintMarkup(bare, { page: 'neg', touchable: () => true, expected: ['t'], where: 'test' }).map((e) => e.code)).toEqual([
      'A05-not-marigold',
      'A02-missing-seal',
      'A03-missing-grip',
      'A04-missing-cue',
    ]);
    // On a real page: strip the train's seal
    const html = render(c1p2, initialState(c1p2)).replace(/data-seal="拉"/g, '');
    expect(lintAffordance(c1p2, html).errors.map((e) => e.code)).toEqual(['A02-missing-seal']);
  });

  test('hit areas are checked after the 390 × 844 book scale; early pages warn above 3 touchables', () => {
    expect(REFERENCE_SCALE).toBeCloseTo(0.908, 3);
    expect(MIN_HIT_UNITS).toBeCloseTo(52.9, 1);
    const small: PageDef = { ...c1p2, parts: c1p2.parts.map((p) => (p.id === 'train' ? { ...p, hit: { x: 56, y: 590, w: 150, h: 50 } } : p)) };
    const issues = lintAffordanceData(small);
    expect(issues.map((e) => [e.code, e.ids])).toEqual([['A06-hit-small', ['train']]]);
    expect(issues[0].message).toMatch(/136×45 CSS px/);
    const busy: PageDef = {
      ...c1p2,
      parts: [
        ...c1p2.parts,
        { id: 'p1', preset: 'prop', states: ['a', 'b'], hit: { x: 300, y: 100, w: 60, h: 60 }, art: 'x' },
        { id: 'p2', preset: 'prop', states: ['a', 'b'], hit: { x: 300, y: 200, w: 60, h: 60 }, art: 'x' },
      ],
    };
    expect(lintAffordanceData(busy).map((e) => [e.code, e.severity])).toEqual([['A07-touchable-count', 'warning']]);
    expect(lintAffordanceData({ ...busy, index: 4 })).toEqual([]);
  });
});

describe('hint geometry', () => {
  const target = (def: PageDef, state: SimState, key: string) => targetsOf(def, state).find((t) => t.key === key)!;

  test('a tab hint drags its card to the next stop (or the hinted one)', () => {
    const s = initialState(c1p2);
    expect(handGesture(c1p2, s, target(c1p2, s, 'train'))).toEqual({ kind: 'drag', from: [80, 610], to: [140, 610] });
    expect(handGesture(c1p2, s, target(c1p2, s, 'train'), { stop: 2 })).toEqual({ kind: 'drag', from: [80, 610], to: [200, 610] });
    const end = withPartState(s, 'train', 'full');
    expect(handGesture(c1p2, end, target(c1p2, end, 'train'))).toEqual({ kind: 'drag', from: [200, 610], to: [140, 610] });
    const r = initialState(c0p1);
    expect(handGesture(c0p1, r, target(c0p1, r, 'crib-rail'))).toEqual({ kind: 'drag', from: [150, 480], to: [150, 540] });
  });

  test('props, perches and the rest are tapped at their centre', () => {
    const s = initialState(c1p2);
    expect(handGesture(c1p2, s, target(c1p2, s, 'board'))).toEqual({ kind: 'tap', at: [140, 72] });
    const perch = targetsOf(c1p2, s).find((t) => t.kind === 'perch')!;
    expect(handGesture(c1p2, s, perch).kind).toBe('tap');
  });

  test('a part that carries nodes gets the dotted thread to its rider', () => {
    const s = initialState(c1p2);
    expect(linkThread(c1p2, s, target(c1p2, s, 'train'))).toEqual([[131, 618], [60, 430]]);
    expect(linkThread(c1p2, s, target(c1p2, s, 'board'))).toBeNull();
  });
});

describe('PageView draws each § 4.1 state', () => {
  const s = initialState(c1p2);
  const nearLayer = (html: string) => html.slice(html.indexOf('data-layer="parts-near"'), html.indexOf('data-layer="creatures"'));

  test('idle: the wiggle run is a class on the card, never on the track or the seal', () => {
    const html = render(c1p2, s, { affordance: { wiggle: { train: 'a', board: 'b' } } });
    expect(html).toContain('class="aff-wig aff-wig-tab-a"');
    expect(html).toContain('class="aff-wig aff-wig-prop-b"');
    expect(render(c1p2, s, { affordance: { wiggle: { train: 'a' } }, reduced: true })).not.toContain('aff-wig');
  });

  test('reduced motion: the double outline on touchables only', () => {
    const html = render(c1p2, s, { reduced: true });
    expect(html.match(/data-outline="reduced"/g)).toHaveLength(1);
    expect(render(c1p2, s)).not.toContain('data-outline');
  });

  test('dragging: lifted over its shadow, drawn last in its layer', () => {
    const html = render(c1p2, s, { gesture: { dragging: 'train' } });
    const near = nearLayer(html);
    expect(near).toContain('data-lift-shadow');
    expect(near.indexOf('data-part="board"')).toBeLessThan(near.indexOf('data-part="train"'));
    expect(near).toMatch(/translate\(80 605\) rotate\(0\) scale\(1\.04\)/);
  });

  test('locked: veil and paw badge while it holds; the wobble wrapper on a touch', () => {
    const locked: PageDef = { ...c1p2, parts: c1p2.parts.map((p) => (p.id === 'train' ? { ...p, lockedWhen: { creature: 'pigeon', at: 'onTrack' } } : p)) };
    const html = render(locked, initialState(locked), { gesture: { locked: { part: 'train', serial: 1 } } });
    expect(html).toContain('data-veil');
    expect(html).toContain('data-badge="locked"');
    expect(html).toContain('class="gx-wobble"');
    expect(render(c1p2, s)).not.toContain('data-veil');
  });

  test('done: the check knot on the parts named', () => {
    expect(render(c1p2, s, { affordance: { done: ['train'] } })).toContain('data-badge="done"');
  });

  test('hint L1 halo behind the target; L2 adds the ghost hand and the thread', () => {
    const l1 = render(c1p2, s, { affordance: { hint: { level: 1, key: 'train' } } });
    const near = nearLayer(l1);
    expect(near.indexOf('data-hint-halo')).toBeLessThan(near.indexOf('data-part="train"'));
    expect(l1).toContain('class="aff-halo"');
    expect(l1).not.toContain('data-hint-hand');
    const l2 = render(c1p2, s, { affordance: { hint: { level: 2, key: 'train' } } });
    expect(l2).toContain('data-hint-hand="drag"');
    expect(l2).toContain('aff-hand aff-hand-drag');
    expect(l2).toMatch(/--dx:60px/);
    expect(render(c1p2, s, { affordance: { hint: { level: 2, key: 'train' } }, reduced: true })).not.toContain('aff-hand-drag');
    expect(render(c1p2, s, { affordance: { hint: { level: 1, key: 'nope' } } })).not.toContain('data-hint-halo');
  });

  test('長輩模式 seals are 28 units', () => {
    expect(sealR(11, true)).toBe(15.5);
    const html = render(c1p2, s, { affordance: { elder: true } });
    expect(html).toMatch(/data-seal="拉"[^>]*><rect x="-15\.5" y="-15\.5" width="31"/);
  });

  test('grown hit shapes are marked (own shape under 48 px at that scale)', () => {
    const at = (scale: number) => (render(c1p2, s, { scale }).match(/data-hit-grown/g) ?? []).length;
    expect(at(REFERENCE_SCALE)).toBe(0);
    expect(at(0.66)).toBeGreaterThan(0);
  });

  test('every state stays filter-free (GDD § 3.9)', () => {
    const html = render(c1p2, s, { gesture: { dragging: 'train', reveal: true }, affordance: { hint: { level: 2, key: 'train' }, done: ['train'], wiggle: { train: 'a' } }, reduced: true });
    expect(html).not.toMatch(/\bfilter=|filter:/);
  });
});
