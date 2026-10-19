import { nodePos } from '../core/graph';
import type { Id, PageDef, SimState } from '../core/types';
import type { Pt } from './geometry';
import { previewNodePos, type PartPreview } from './gestures';

/**
 * Interpolation between ticks (GDD § 3.9 Animation; popup art bible § 8). Pure functions of
 * `(def, prev, state, ms)`, so the view stays a pure function of time and PageLab can scrub.
 *
 * - **Actors** lerp from the previous tick's node to the new one over the tick, ease-in-out.
 * - **Parts** tween to their new state over 250 ms: ease-out with a 6 % overshoot that settles
 *   back, then a 60 ms snap squash (0.97) as the stop catches.
 * - **Rides** lerp with the part: a node attached to a part is drawn where the part's tween is.
 * - **Previews** (#90): while a drag holds a part between stops, nodes riding it are drawn at the
 *   preview (`gestures.ts` `previewNodePos`), so the train follows the finger with its riders.
 * - **Reduced motion:** every tween is an instant swap.
 */

/** A part's state tween (GDD § 3.9: 250 ms). */
export const PART_TWEEN_MS = 250;
/** The squash when a snap stop catches (bible § 8: 60 ms at 0.97). */
export const SNAP_SQUASH_MS = 60;
export const SNAP_SQUASH = 0.97;
/** After this, nothing a tick started is still moving. */
export const PART_SETTLE_MS = PART_TWEEN_MS + SNAP_SQUASH_MS;
/** The overshoot of the part tween's ease-out (bible § 8: 6 %). */
export const PART_OVERSHOOT = 0.06;
/** The standee's hop arc over a step (bible § 8: 2 px). */
export const HOP_PX = 2;

export const clamp01 = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** Ease-in-out (cubic): the actors' step over a tick. */
export function easeInOut(t: number): number {
  const u = clamp01(t);
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
}

/**
 * The back-ease constant whose peak is exactly 1 + `PART_OVERSHOOT`: for
 * f(u) = 1 + (c + 1)u³ + cu² (u = t − 1) the peak is 1 + 4c³ / (27(c + 1)²); solved by bisection.
 */
export const BACK_C = (() => {
  const peak = (c: number) => (4 * c ** 3) / (27 * (c + 1) ** 2);
  let lo = 0;
  let hi = 4;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (peak(mid) < PART_OVERSHOOT) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();

/** Ease-out with a 6 % overshoot that settles back to 1 (paper moves quickly and settles softly). */
export function easeOutBack(t: number): number {
  const u = clamp01(t) - 1;
  return 1 + (BACK_C + 1) * u ** 3 + BACK_C * u ** 2;
}

/** How far a part has tweened, `ms` after its tick: 0 → (1.06) → 1. Instant under reduced motion. */
export function partProgress(ms: number, reduced = false): number {
  if (reduced || ms >= PART_TWEEN_MS) return 1;
  return easeOutBack(ms / PART_TWEEN_MS);
}

/** The snap squash right after a tween lands: 1 → 0.97 → 1 over 60 ms. 1 under reduced motion. */
export function snapSquash(ms: number, reduced = false): number {
  if (reduced || ms < PART_TWEEN_MS || ms >= PART_SETTLE_MS) return 1;
  return 1 - (1 - SNAP_SQUASH) * Math.sin((Math.PI * (ms - PART_TWEEN_MS)) / SNAP_SQUASH_MS);
}

/** Where node `id` is drawn `ms` into the tick: attached nodes ride their part's tween (or a drag preview). */
export function drawnNodePos(def: PageDef, prev: SimState, state: SimState, id: Id, ms: number, reduced = false, preview: PartPreview | null = null): Pt | undefined {
  const held = preview === null ? undefined : previewNodePos(def, preview, id);
  if (held !== undefined) return held;
  const to = nodePos(def, state, id);
  if (to === undefined) return undefined;
  const from = nodePos(def, prev, id) ?? to;
  if (from[0] === to[0] && from[1] === to[1]) return to;
  return lerpPt(from, to, partProgress(ms, reduced));
}

export interface ActorPose {
  /** Feet position in page units */
  readonly x: number;
  readonly y: number;
  /** True while stepping from one node to another this tick */
  readonly moving: boolean;
}

/**
 * An actor stepping from node `from` (where it stood after the previous tick) to node `to`, `t`
 * (0–1) through the tick: an ease-in-out lerp with a small hop arc of `hop` px. Riding (same node,
 * the node moved) follows the part's tween instead. Unknown nodes return null.
 */
export function stepPose(
  def: PageDef,
  prev: SimState,
  state: SimState,
  from: Id | null,
  to: Id | null,
  t: number,
  ms: number,
  { reduced = false, hop = HOP_PX, preview = null }: { reduced?: boolean; hop?: number; preview?: PartPreview | null } = {},
): ActorPose | null {
  if (to === null) return null;
  const end = drawnNodePos(def, prev, state, to, ms, reduced, preview);
  if (end === undefined) return null;
  if (from === null || from === to || reduced) return { x: end[0], y: end[1], moving: false };
  const start = nodePos(def, prev, from);
  if (start === undefined) return { x: end[0], y: end[1], moving: false };
  const k = easeInOut(t);
  const [x, y] = lerpPt(start, end, k);
  const done = t >= 1;
  return { x, y: y - (done ? 0 : hop * Math.sin(Math.PI * clamp01(t))), moving: !done };
}

/** A creature's or Mocha's off-page spot: past the nearest side edge, a little up (they fly or hop away). */
export function offpagePoint(near: Pt, width = 390): Pt {
  const left = near[0] < width / 2;
  return [left ? -60 : width + 60, near[1] - 90];
}
