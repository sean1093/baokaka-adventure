import { describe, expect, test } from 'vitest';
import { initialState, replay, step, withPartState } from '../core';
import { partLocked } from '../core/step';
import type { PageDef, SimState } from '../core/types';
import { PAGES, pageById } from '../pages';
import { bookLayout, hitScreenSize, type Hit, type Pt } from './geometry';
import {
  DEBOUNCE_MS,
  Debouncer,
  GestureTracker,
  HOLD_MS,
  MAGNET_PX,
  MIN_HIT_PX,
  RUBBER_STOPS,
  TUDIGONG_R,
  hitDistance,
  hitTest,
  magnet,
  minHit,
  previewNodePos,
  projectTrack,
  rotaryDelta,
  rotaryStep,
  rubberBand,
  settlePreview,
  snapStop,
  targetsOf,
  wrapIndex,
  type GestureEffect,
  type GestureWorld,
  type Target,
} from './gestures';

/** Gestures (#90; GDD § 2.6): the pure hit testing, magnet, threshold, snapping, debounce and palm rules. */

const c1p2 = pageById('c1p2')!;
const c0p1 = pageById('c0p1')!;

const rect = (x: number, y: number, w: number, h: number): Hit => ({ x, y, w, h });
const target = (key: string, hit: Hit, layer = 4, extra: Partial<Target> = {}): Target => ({ key, kind: 'part', id: key, hit, layer, ...extra });

describe('hit shapes', () => {
  test('distance is 0 inside and on the edge, Euclidean outside', () => {
    expect(hitDistance(rect(0, 0, 10, 10), [5, 5])).toBe(0);
    expect(hitDistance(rect(0, 0, 10, 10), [10, 10])).toBe(0);
    expect(hitDistance(rect(0, 0, 10, 10), [13, 14])).toBeCloseTo(5);
    expect(hitDistance({ cx: 0, cy: 0, r: 5 }, [8, 0])).toBeCloseTo(3);
    expect(hitDistance({ cx: 0, cy: 0, r: 5 }, [3, 0])).toBe(0);
  });

  test('minHit grows a shape about its centre to 48 screen px at the scale, never shrinks it', () => {
    const grown = minHit(rect(100, 100, 40, 80), 0.5) as { x: number; y: number; w: number; h: number };
    expect(grown).toEqual({ x: 72, y: 92, w: 96, h: 96 });
    expect(minHit(rect(0, 0, 120, 120), 0.5)).toEqual(rect(0, 0, 120, 120));
    expect(minHit({ cx: 5, cy: 5, r: 10 }, 1)).toEqual({ cx: 5, cy: 5, r: 24 });
    const s = hitScreenSize(bookLayout(375, 667), minHit(rect(0, 0, 10, 10), bookLayout(375, 667).scale));
    expect(Math.min(s.w, s.h)).toBeCloseTo(MIN_HIT_PX);
  });
});

describe('hitTest and the magnet (GDD § 2.6, R6)', () => {
  const low = target('low', rect(0, 0, 100, 100), 3);
  const high = target('high', rect(50, 50, 100, 100), 4);

  test('a point inside picks the topmost shape that contains it', () => {
    expect(hitTest([low, high], [75, 75], 1)?.target.key).toBe('high');
    expect(hitTest([low, high], [10, 10], 1)).toEqual({ target: low, how: 'direct' });
  });

  test('a small shape is grown to 48 px at the current scale', () => {
    const tiny = target('tiny', rect(100, 100, 20, 20));
    expect(hitTest([tiny], [125, 110], 1)?.how).toBe('grown'); // 48 units at scale 1: 86 … 134
    expect(hitTest([tiny], [140, 110], 0.5)?.how).toBe('grown'); // 96 units at scale 0.5
  });

  test('a miss within 32 screen px snaps to the nearest; beyond it, nothing', () => {
    const a = target('a', rect(0, 0, 60, 60));
    const b = target('b', rect(200, 0, 60, 60));
    expect(hitTest([a, b], [80, 30], 1)).toEqual({ target: a, how: 'magnet' });
    expect(hitTest([a, b], [180, 30], 1)?.target.key).toBe('b');
    expect(hitTest([a, b], [60 + MAGNET_PX + 1, 30], 1)).toBeNull();
    // At half scale 32 px is 64 units
    expect(hitTest([a, b], [60 + 2 * MAGNET_PX - 1, 30], 0.5)?.target.key).toBe('a');
  });

  test('equally near: the higher layer wins (in either list order)', () => {
    const a = target('a', rect(0, 0, 60, 60), 4);
    const b = target('b', rect(100, 0, 60, 60), 6);
    expect(magnet([a, b], [80, 30], 1)?.target.key).toBe('b');
    expect(magnet([b, a], [80, 30], 1)?.target.key).toBe('b');
  });

  test('1-2 at 375 × 667: a tap 30 px under the train tab still pulls it', () => {
    const l = bookLayout(375, 667);
    const targets = targetsOf(c1p2, initialState(c1p2));
    const below: Pt = [130, 646 + 30 / l.scale];
    expect(hitTest(targets, below, l.scale)?.target.key).toBe('train');
  });
});

describe('targets (what a finger can touch)', () => {
  test('1-2 at the start: the train tab, the board, the free perch, Mocha and Baokaka', () => {
    const t = targetsOf(c1p2, initialState(c1p2));
    expect(t.map((x) => x.key).sort()).toEqual(['baby:baby', 'board', 'mocha:mocha', 'perch:pillar', 'train']);
    expect(t.find((x) => x.key === 'train')?.drag).toEqual({ kind: 'linear', from: [80, 610], to: [200, 610], count: 3 });
    // Draw order: lowest layer first
    expect(t.map((x) => x.layer)).toEqual([...t.map((x) => x.layer)].sort((a, b) => a - b));
  });

  test('the 土地公 is touchable only while he shows', () => {
    expect(targetsOf(c1p2, initialState(c1p2)).some((x) => x.kind === 'tudigong')).toBe(false);
    const flipped = withPartState(initialState(c1p2), 'board', 'flip');
    expect(targetsOf(c1p2, flipped).find((x) => x.kind === 'tudigong')?.hit).toEqual({ cx: 236, cy: 98, r: TUDIGONG_R });
  });

  test('no Mocha on 0-1: no perches, no Mocha (its 土地公 always shows); done pages drop Baokaka', () => {
    const t = targetsOf(c0p1, initialState(c0p1));
    expect(t.map((x) => x.key).sort()).toEqual(['baby:baby', 'crib-rail', 'mobile', 'tudigong:tudigong']);
    const done = replay(c0p1, c0p1.solution).state;
    expect(targetsOf(c0p1, done).some((x) => x.kind === 'baby')).toBe(false);
  });

  /** Every frame of a page's solution (with the idle ticks before it). */
  function solutionStates(def: PageDef): SimState[] {
    let s = initialState(def);
    const out = [s];
    for (const t of replay(def, def.solution, s).ticks) {
      s = step(def, s, t.input).state;
      out.push(s);
    }
    return out;
  }

  test.each([
    [390, 844],
    [375, 667],
  ])('every touchable on every page is ≥ 48 × 48 CSS px after the book scale at %i × %i (R6)', (w, h) => {
    const l = bookLayout(w, h);
    for (const def of PAGES) {
      for (const s of solutionStates(def)) {
        for (const t of targetsOf(def, s)) {
          const size = hitScreenSize(l, minHit(t.hit, l.scale));
          expect(Math.min(size.w, size.h), `${def.id} tick ${s.tick} ${t.key}`).toBeGreaterThanOrEqual(MIN_HIT_PX - 1e-9);
        }
      }
    }
  });
});

describe('drag maths', () => {
  test('projectTrack: fraction along any track direction, unclamped', () => {
    expect(projectTrack([80, 610], [200, 610], [140, 650])).toBeCloseTo(0.5);
    expect(projectTrack([150, 480], [150, 540], [150, 570])).toBeCloseTo(1.5);
    expect(projectTrack([0, 0], [0, 0], [5, 5])).toBe(0);
  });

  test('snapStop: the nearest stop, clamped to the track', () => {
    expect(snapStop(0.49, 3)).toBe(0);
    expect(snapStop(0.5, 3)).toBe(1);
    expect(snapStop(1.6, 3)).toBe(2);
    expect(snapStop(7, 3)).toBe(2);
    expect(snapStop(-2, 3)).toBe(0);
  });

  test('rubberBand: free inside, eases toward the limit past either end', () => {
    expect(rubberBand(1.3, 2)).toBe(1.3);
    expect(rubberBand(2.1, 2)).toBeGreaterThan(2);
    expect(rubberBand(2.1, 2)).toBeLessThan(2.1);
    expect(rubberBand(50, 2)).toBeCloseTo(2 + RUBBER_STOPS);
    expect(rubberBand(-50, 2)).toBeCloseTo(-RUBBER_STOPS);
  });

  test('rotary: signed angle (clockwise positive on screen), whole steps, wrapping', () => {
    expect(rotaryDelta([0, 0], [10, 0], [0, 10])).toBeCloseTo(Math.PI / 2);
    expect(rotaryDelta([0, 0], [-10, 1], [-10, -1])).toBeCloseTo(0.2, 1); // across ±π, the short way (up the left side: clockwise)
    expect(rotaryDelta([0, 0], [-10, -1], [-10, 1])).toBeCloseTo(-0.2, 1);
    expect(rotaryStep(Math.PI / 2, 4)).toBe(1);
    expect(rotaryStep(Math.PI / 5, 4)).toBe(0);
    expect(Object.is(rotaryStep(-0.1, 4), -0)).toBe(false);
    expect(rotaryStep(-Math.PI, 8)).toBe(-4);
    expect(wrapIndex(-1, 4)).toBe(3);
    expect(wrapIndex(9, 4)).toBe(1);
  });

  test('previewNodePos: riders sit between the attach positions of the stops either side', () => {
    expect(previewNodePos(c1p2, { part: 'train', index: 0.5 }, 'T1')).toEqual([105, 430]);
    expect(previewNodePos(c1p2, { part: 'train', index: 2.2 }, 'T1')).toEqual([198, 430]);
    expect(previewNodePos(c1p2, { part: 'train', index: 1 }, 'L1')).toBeUndefined();
    expect(previewNodePos(c1p2, { part: 'board', index: 1 }, 'T1')).toBeUndefined();
  });

  test('settlePreview: holds the snapped stop until its tick, then glides to where the state landed', () => {
    const held = { part: 'train', index: 2, applyAt: 5 };
    expect(settlePreview(held, 4, { index: 0, count: 3, wraps: false }, 0)).toEqual({ part: 'train', index: 2 });
    expect(settlePreview(held, 5, { index: 1, count: 3, wraps: false }, 0.5)).toEqual({ part: 'train', index: 1.5 }); // jammed at half
    expect(settlePreview(held, 5, { index: 2, count: 3, wraps: false }, 1)).toBeNull();
    expect(settlePreview(held, 6, { index: 2, count: 3, wraps: false }, 0)).toBeNull();
    // A wheel snapped to index 4 (= 0 of 4) that landed on 0 doesn't spin back
    expect(settlePreview({ part: 'w', index: 4, applyAt: 1 }, 1, { index: 0, count: 4, wraps: true }, 0.5)).toEqual({ part: 'w', index: 4 });
  });
});

describe('Debouncer (GDD § 2.6: 250 ms per element)', () => {
  test('a second tap on the same element inside 250 ms is dropped; other elements are independent', () => {
    const d = new Debouncer();
    expect(d.accept('flap', 0)).toBe(true);
    expect(d.accept('flap', DEBOUNCE_MS - 1)).toBe(false);
    expect(d.accept('prop', 10)).toBe(true);
    expect(d.accept('flap', DEBOUNCE_MS)).toBe(true);
  });
});

// ——— The tracker ———

const inputs = (fx: GestureEffect[]) => fx.flatMap((e) => (e.type === 'input' ? [e.input] : []));
const events = (fx: GestureEffect[]) => fx.flatMap((e) => (e.type === 'event' ? [e.event.type] : []));
const kinds = (fx: GestureEffect[]) => fx.map((e) => e.type);

/** A world over a page state at a scale (as PagePlayer builds it). */
function pageWorld(def: PageDef, state: SimState, scale = 1): GestureWorld {
  const states = (id: string) => {
    const p = def.parts.find((x) => x.id === id)!;
    return p.states ?? ['closed', 'open'];
  };
  return {
    targets: targetsOf(def, state),
    scale,
    states,
    stateIndex: (id) => states(id).indexOf(state.parts[id]),
    locked: (id) => partLocked(def, state, id),
  };
}

/** A hand-made world of targets with fixed states. */
function world(targets: Target[], parts: Record<string, { states: string[]; at: number; locked?: boolean }>, scale = 1): GestureWorld {
  return { targets, scale, states: (id) => parts[id].states, stateIndex: (id) => parts[id].at, locked: (id) => parts[id]?.locked === true };
}

describe('GestureTracker: taps', () => {
  const s0 = initialState(c1p2);

  test('a tap pauses on the way down, queues on the way up, resumes', () => {
    const g = new GestureTracker();
    const down = g.down(1, [100, 70], 0, pageWorld(c1p2, s0));
    expect(kinds(down)).toEqual(['pause']);
    expect(g.flags.finger).toEqual([100, 70]);
    const up = g.up(1, [100, 70], 80);
    expect(inputs(up)).toEqual([{ t: 'tap', id: 'board' }]);
    expect(kinds(up).at(-1)).toBe('resume');
    expect(g.flags.finger).toBeNull();
  });

  test('tap mapping: perch → mocha, Mocha → pet, Baokaka → word ring, tab → advance', () => {
    const w = pageWorld(c1p2, s0);
    const tap = (p: Pt, t: number) => {
      const g = new GestureTracker();
      g.down(1, p, t, w);
      return g.up(1, p, t + 50);
    };
    expect(inputs(tap([280, 234], 0))).toEqual([{ t: 'mocha', perch: 'pillar' }]);
    expect(inputs(tap([340, 350], 0))).toEqual([{ t: 'pet' }]);
    const baby = tap([40, 410], 0);
    expect(inputs(baby)).toEqual([]);
    expect(events(baby)).toEqual(['tap', 'wordRing']);
    expect(inputs(tap([90, 610], 0))).toEqual([{ t: 'tap', id: 'train' }]);
  });

  test('the 土地公 tap is an event, not an input, and he wins over the board he hides behind', () => {
    const g = new GestureTracker();
    g.down(1, [232, 96], 0, pageWorld(c1p2, withPartState(s0, 'board', 'flip')));
    const up = g.up(1, [232, 96], 40);
    expect(events(up)).toEqual(['tap', 'tudigong']);
    expect(inputs(up)).toEqual([]);
  });

  test('under 8 px of travel is still a tap; double taps within 250 ms count once', () => {
    const g = new GestureTracker();
    const w = pageWorld(c1p2, s0);
    g.down(1, [100, 70], 0, w);
    g.move(1, [107, 70]);
    expect(inputs(g.up(1, [107, 70], 60))).toEqual([{ t: 'tap', id: 'board' }]);
    g.down(2, [100, 70], 100, w);
    expect(inputs(g.up(2, [100, 70], 160))).toEqual([]);
    g.down(3, [100, 70], 300, w);
    expect(inputs(g.up(3, [100, 70], 340))).toEqual([{ t: 'tap', id: 'board' }]);
  });

  test('a wobbly tap on a tap-only element counts if the finger lifts over it; not if it slid away', () => {
    const w = pageWorld(c1p2, s0);
    const g = new GestureTracker();
    g.down(1, [100, 70], 0, w);
    g.move(1, [120, 80]);
    expect(inputs(g.up(1, [120, 80], 60))).toEqual([{ t: 'tap', id: 'board' }]);
    const h = new GestureTracker();
    h.down(1, [100, 70], 0, w);
    h.move(1, [100, 400]);
    expect(inputs(h.up(1, [100, 400], 60))).toEqual([]);
  });

  test('a miss is caught by the magnet', () => {
    const g = new GestureTracker();
    g.down(1, [140, 120], 0, pageWorld(c1p2, s0)); // 16 units under the board's hit area
    expect(inputs(g.up(1, [140, 120], 50))).toEqual([{ t: 'tap', id: 'board' }]);
  });
});

describe('GestureTracker: drags', () => {
  const s0 = initialState(c1p2);

  test('past 8 px a tab drag follows the finger along its track and snaps on release', () => {
    const g = new GestureTracker();
    g.down(1, [80, 610], 0, pageWorld(c1p2, s0));
    expect(g.flags.dragging).toBeNull();
    const start = g.move(1, [90, 612]);
    expect(events(start)).toEqual(['dragStart']);
    expect(g.flags.dragging).toBe('train');
    g.move(1, [125, 640]); // off the track's line: projection only
    expect(g.flags.preview?.index).toBeCloseTo(0.75);
    const up = g.up(1, [125, 640], 400);
    expect(inputs(up)).toEqual([{ t: 'set', part: 'train', to: 'half' }]);
    expect(events(up)).toContain('snap');
    expect(g.flags.dragging).toBeNull();
    expect(g.flags.preview).toBeNull();
  });

  test('drag capture: leaving the hit area keeps the part; over-drag rubber-bands; it snaps to the end stop', () => {
    const g = new GestureTracker();
    g.down(1, [80, 610], 0, pageWorld(c1p2, s0));
    g.move(1, [300, 100]); // far outside every hit area, 1.83 track lengths along
    expect(g.flags.dragging).toBe('train');
    const shown = g.flags.preview!.index;
    expect(shown).toBeGreaterThan(2);
    expect(shown).toBeLessThan(2 + RUBBER_STOPS);
    expect(inputs(g.up(1, [300, 100], 500))).toEqual([{ t: 'set', part: 'train', to: 'full' }]);
  });

  test('a drag back to where it started commits nothing', () => {
    const g = new GestureTracker();
    g.down(1, [80, 610], 0, pageWorld(c1p2, s0));
    g.move(1, [120, 610]);
    g.move(1, [85, 610]);
    expect(inputs(g.up(1, [85, 610], 300))).toEqual([]);
  });

  test('a drag starts from the current stop (relative to where the finger landed)', () => {
    const half = withPartState(s0, 'train', 'half');
    const g = new GestureTracker();
    g.down(1, [100, 610], 0, pageWorld(c1p2, half));
    g.move(1, [160, 610]);
    expect(g.flags.preview?.index).toBeCloseTo(2);
    expect(inputs(g.up(1, [160, 610], 200))).toEqual([{ t: 'set', part: 'train', to: 'full' }]);
  });

  test('0-1: the crib rail drags down its vertical track', () => {
    const g = new GestureTracker();
    g.down(1, [150, 485], 0, pageWorld(c0p1, initialState(c0p1)));
    g.move(1, [152, 530]);
    expect(inputs(g.up(1, [152, 548], 300))).toEqual([{ t: 'set', part: 'crib-rail', to: 'down' }]);
  });

  test('rotary: a wheel turns by whole steps around its centre, across the wrap', () => {
    const wheel = target('dial', { cx: 0, cy: 0, r: 40 }, 4, { drag: { kind: 'rotary', center: [0, 0], count: 4 } });
    const w = world([wheel], { dial: { states: ['0', '1', '2', '3'], at: 3 } });
    const g = new GestureTracker();
    g.down(1, [30, 0], 0, w);
    g.move(1, [21, 21]); // 45°
    g.move(1, [0, 30]); // 90° clockwise on screen
    expect(g.flags.preview?.index).toBeCloseTo(4);
    expect(inputs(g.up(1, [0, 30], 300))).toEqual([{ t: 'set', part: 'dial', to: '0' }]);
    // A full turn and back lands where it started: nothing
    const h = new GestureTracker();
    h.down(1, [30, 0], 0, w);
    for (const a of [1, 2, 3, 4, 5, 6, 7, 8]) h.move(1, [30 * Math.cos((a * Math.PI) / 4), 30 * Math.sin((a * Math.PI) / 4)]);
    expect(h.flags.preview?.index).toBeCloseTo(7);
    expect(inputs(h.up(1, [30, 0], 300))).toEqual([]);
  });

  test('flap: lifting the corner past half way toggles it (as a tap); less does nothing', () => {
    const flap = target('lid', rect(0, 0, 80, 60), 4, { drag: { kind: 'flap', reach: 40 } });
    const w = world([flap], { lid: { states: ['closed', 'open'], at: 0 } });
    const g = new GestureTracker();
    g.down(1, [70, 50], 0, w);
    g.move(1, [70, 30]);
    expect(g.flags.preview?.index).toBeCloseTo(0.5);
    expect(inputs(g.up(1, [70, 20], 200))).toEqual([{ t: 'tap', id: 'lid' }]);
    const h = new GestureTracker();
    h.down(1, [70, 50], 0, w);
    h.move(1, [70, 40]);
    expect(inputs(h.up(1, [70, 40], 200))).toEqual([]);
  });
});

describe('GestureTracker: palm, second finger, locks, hold', () => {
  const s0 = initialState(c1p2);

  test('a second finger is ignored, and the world stays paused until every finger lifts', () => {
    const g = new GestureTracker();
    const w = pageWorld(c1p2, s0);
    expect(kinds(g.down(1, [80, 610], 0, w))).toEqual(['pause']);
    expect(g.down(2, [100, 70], 10, w)).toEqual([]);
    g.move(2, [300, 150]); // the second finger drags nothing
    g.move(1, [145, 610]);
    expect(kinds(g.up(2, [300, 150], 100))).toEqual([]);
    const up = g.up(1, [145, 610], 200);
    expect(inputs(up)).toEqual([{ t: 'set', part: 'train', to: 'half' }]);
    expect(kinds(up).at(-1)).toBe('resume');
  });

  test('more than 3 points at once (a palm) cancels the gesture entirely', () => {
    const g = new GestureTracker();
    const w = pageWorld(c1p2, s0);
    g.down(1, [80, 610], 0, w);
    g.move(1, [145, 610]);
    g.down(2, [200, 300], 5, w);
    g.down(3, [210, 300], 6, w);
    g.down(4, [220, 300], 7, w);
    expect(g.flags.dragging).toBeNull();
    expect(g.flags.preview).toBeNull();
    const fx = [...g.up(4, [0, 0], 50), ...g.up(3, [0, 0], 50), ...g.up(1, [145, 610], 60), ...g.up(2, [0, 0], 70)];
    expect(inputs(fx)).toEqual([]);
    expect(kinds(fx)).toEqual(['resume']);
    // The next touch works again
    g.down(5, [100, 70], 400, w);
    expect(inputs(g.up(5, [100, 70], 450))).toEqual([{ t: 'tap', id: 'board' }]);
  });

  test('a locked part wobbles, Mocha glares, nope is heard; no state change is queued', () => {
    const def: PageDef = { ...c1p2, parts: c1p2.parts.map((p) => (p.id === 'train' ? { ...p, lockedWhen: { part: 'board', in: ['times'] } } : p)) };
    const g = new GestureTracker();
    const down = g.down(1, [80, 610], 0, pageWorld(def, initialState(def)));
    expect(events(down)).toEqual(['nope']);
    expect(g.flags.locked).toEqual({ part: 'train', serial: 1 });
    g.move(1, [160, 610]);
    expect(g.flags.dragging).toBeNull();
    expect(inputs(g.up(1, [160, 610], 100))).toEqual([]);
    g.down(2, [80, 610], 500, pageWorld(def, initialState(def)));
    expect(g.flags.locked?.serial).toBe(2); // replays the wobble
  });

  test('holding still on empty space for 600 ms reveals the touchables until release', () => {
    const g = new GestureTracker();
    g.down(1, [330, 60], 0, pageWorld(c1p2, s0)); // the sky
    expect(g.holdPending).toBe(true);
    expect(g.hold(HOLD_MS - 100)).toEqual([]);
    expect(events(g.hold(HOLD_MS))).toEqual(['reveal']);
    expect(g.flags.reveal).toBe(true);
    expect(inputs(g.up(1, [330, 60], 900))).toEqual([]);
    expect(g.flags.reveal).toBe(false);
  });

  test('no reveal after moving, on a touchable, or when the world says no', () => {
    const w = pageWorld(c1p2, s0);
    const moved = new GestureTracker();
    moved.down(1, [330, 60], 0, w);
    moved.move(1, [300, 60]);
    expect(moved.hold(HOLD_MS)).toEqual([]);
    const onPart = new GestureTracker();
    onPart.down(1, [100, 70], 0, w);
    expect(onPart.holdPending).toBe(false);
    const overlay = new GestureTracker();
    overlay.down(1, [330, 60], 0, { ...w, targets: [], hold: false });
    expect(overlay.hold(HOLD_MS)).toEqual([]);
  });

  test('pointercancel ends the gesture with no input', () => {
    const g = new GestureTracker();
    g.down(1, [80, 610], 0, pageWorld(c1p2, s0));
    g.move(1, [145, 610]);
    const fx = g.cancel(1);
    expect(inputs(fx)).toEqual([]);
    expect(kinds(fx)).toEqual(['resume']);
    expect(g.flags.dragging).toBeNull();
  });
});
