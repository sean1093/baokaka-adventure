import { holds, partState } from '../core/cond';
import { nodePos } from '../core/graph';
import { mochaNode, perchHidesMocha } from '../core/mocha';
import { compilePart } from '../core/presets';
import type { Id, Input, PageDef, PartDef, SimState } from '../core/types';
import type { Hit, Pt } from './geometry';
import { PRESET_Z } from './layers';

/**
 * The interaction grammar (GDD § 2.6; R3 touch pauses the world, R4 one thumb, R6 generous touch):
 * hit testing, the tap magnet, the drag threshold and capture, rubber-band over-drag, snapping to
 * stops, rotary steps, the double-tap debounce, palm rejection and hold-to-reveal.
 *
 * Pure TypeScript with no DOM and no clock: `PagePlayer` feeds pointer samples in page units and
 * times in ms, and applies what comes back (pause / resume the session, queue an `Input`, tell the
 * view). Everything is in page units; screen-px rules (48 px hit areas, the 32 px magnet, the 8 px
 * threshold) are divided by the current book scale, so they hold at any viewport (decision D-51).
 *
 * **Targets** are what a finger can touch now (`targetsOf`): every player-driven part (its `hit`),
 * the perch paw prints while Mocha is on the page, Mocha himself, Baokaka, and the 土地公 while he
 * shows. Each sits on a layer (the § 3.9 order, `layers.ts`): a higher layer wins ties.
 *
 * **Hit test** (`hitTest`), in order:
 * 1. the topmost target whose own shape contains the point;
 * 2. else a target whose shape, grown to 48 × 48 screen px about its centre (`minHit`), contains it
 *    (the nearest by its own shape; ties to the higher layer). This keeps R6 on short phones, where
 *    the book shrinks (0.66 at 375 × 667);
 * 3. else the magnet: the nearest target whose grown shape is within 32 screen px.
 */

/** GDD § 2.6 / R6, in screen px. */
export const MIN_HIT_PX = 48;
export const MAGNET_PX = 32;
export const DRAG_THRESHOLD_PX = 8;
/** Taps on the same element closer than this are one tap (GDD § 2.6). */
export const DEBOUNCE_MS = 250;
/** Holding still on empty page space this long outlines every touchable (GDD § 2.6). */
export const HOLD_MS = 600;
/** More simultaneous points than this is a palm: the whole gesture is ignored (GDD § 2.6). */
export const PALM_POINTS = 3;
/** How far past an end stop over-drag can stretch, in stops (it eases toward this). */
export const RUBBER_STOPS = 0.35;
/** A flap drag commits once its corner is lifted half way. */
export const FLAP_COMMIT = 0.5;

/**
 * Actor and marker hit shapes around their feet / node, in page units (stand-in standee sizes, § 3.9).
 * Each is at least 48 CSS px across at the 390 × 844 book scale (≈ 0.91, so ≥ 52.9 units; bible
 * § 4.2, #140's `A06-hit-small`), before `minHit` grows anything on shorter phones.
 */
export const BABY_BOX = { x: -48, y: -64, w: 96, h: 66 } as const;
export const MOCHA_BOX = { x: -28, y: -68, w: 56, h: 70 } as const;
export const PERCH_R = 27;
export const TUDIGONG_R = 27;

export type TargetKind = 'part' | 'perch' | 'mocha' | 'baby' | 'tudigong';

/** How a part is dragged: along its track, around its centre, or by its corner (GDD § 2.6 drag row). */
export type DragSpec =
  | { readonly kind: 'linear'; readonly from: Pt; readonly to: Pt; readonly count: number }
  | { readonly kind: 'rotary'; readonly center: Pt; readonly count: number }
  | { readonly kind: 'flap'; readonly reach: number };

export interface Target {
  /** Unique per page: the part id for parts, `kind:id` for the rest */
  readonly key: string;
  readonly kind: TargetKind;
  /** The part, perch or actor id */
  readonly id: Id;
  /** Its own hit shape, in page units */
  readonly hit: Hit;
  /** Draw order (higher is nearer the reader); ties go to the higher layer */
  readonly layer: number;
  readonly drag?: DragSpec;
}

/**
 * Layers for the targets that aren't parts (parts use their preset's z, `PRESET_Z`). The 土地公 is
 * drawn far back (z2) but is a small find hidden behind parts (1-2's board): once he shows he
 * takes the touch over the part in front of him, so he is above the parts here.
 */
export const TARGET_LAYER = { perch: 4.5, tudigong: 5, mocha: 6, baby: 6.5 } as const;

const box = (p: Pt, b: { x: number; y: number; w: number; h: number }): Hit => ({ x: p[0] + b.x, y: p[1] + b.y, w: b.w, h: b.h });

/** The centre of a hit shape. */
export function hitCenter(hit: Hit): Pt {
  return 'r' in hit ? [hit.cx, hit.cy] : [hit.x + hit.w / 2, hit.y + hit.h / 2];
}

/** How a player-driven part is dragged, or undefined when it is tap-only. */
export function dragSpec(part: PartDef): DragSpec | undefined {
  const c = compilePart(part);
  if (c.input === 'drag-linear' && part.track) return { kind: 'linear', from: part.track.from, to: part.track.to, count: c.states.length };
  if (c.input === 'drag-rotary') return { kind: 'rotary', center: part.center ?? hitCenter(part.hit), count: c.states.length };
  if (part.preset === 'flap' && c.input !== 'none') {
    const h = 'r' in part.hit ? part.hit.r * 2 : part.hit.h;
    return { kind: 'flap', reach: Math.max(28, h * 0.6) };
  }
  return undefined;
}

/**
 * How far a part that rides a node (`ridesOn`, #107: 1-6's bento lid on its cart) has moved from
 * where its `hit` and art were authored — the node's place in the initial state. [0, 0] otherwise.
 */
export function rideOffset(def: PageDef, state: SimState, part: PartDef): Pt {
  const home = rideHome(def, part);
  const now = part.ridesOn === undefined ? undefined : nodePos(def, state, part.ridesOn);
  return home === undefined || now === undefined ? [0, 0] : [now[0] - home[0], now[1] - home[1]];
}

/** Where a riding part's node is in the initial state (its `hit` is authored there), or undefined. */
export function rideHome(def: PageDef, part: PartDef): Pt | undefined {
  const node = part.ridesOn === undefined ? undefined : def.nodes.find((n) => n.id === part.ridesOn);
  if (node === undefined) return undefined;
  const host = node.attach === undefined ? undefined : def.parts.find((p) => p.id === node.attach!.part);
  return (host === undefined ? undefined : node.attach!.pos[compilePart(host).initial]) ?? [node.x, node.y];
}

/** A hit shape moved by (dx, dy). */
export const shiftHit = (hit: Hit, [dx, dy]: Pt): Hit => (dx === 0 && dy === 0 ? hit : 'r' in hit ? { ...hit, cx: hit.cx + dx, cy: hit.cy + dy } : { ...hit, x: hit.x + dx, y: hit.y + dy });

/** True when Mocha is on the page (settled or travelling), as the view draws him. */
const mochaOn = (state: SimState) => state.mocha.perch !== null || state.mocha.path.length > 0;

/** Everything a finger can touch in `state`, in draw order (lowest layer first). */
export function targetsOf(def: PageDef, state: SimState): Target[] {
  const out: Target[] = [];
  if (holds(def, state, def.tudigong.visibleWhen)) {
    out.push({ key: 'tudigong:tudigong', kind: 'tudigong', id: 'tudigong', hit: { cx: def.tudigong.x, cy: def.tudigong.y, r: TUDIGONG_R }, layer: TARGET_LAYER.tudigong });
  }
  for (const part of def.parts) {
    if (compilePart(part).input === 'none' || partState(state, part.id) === undefined) continue;
    out.push({ key: part.id, kind: 'part', id: part.id, hit: shiftHit(part.hit, rideOffset(def, state, part)), layer: PRESET_Z[part.preset], drag: dragSpec(part) });
  }
  if (mochaOn(state) && !state.baby.linked) {
    for (const perch of def.perches) {
      if (perch.id === state.mocha.perch) continue;
      const p = nodePos(def, state, perch.node);
      if (p) out.push({ key: `perch:${perch.id}`, kind: 'perch', id: perch.id, hit: { cx: p[0], cy: p[1] - 6, r: PERCH_R }, layer: TARGET_LAYER.perch });
    }
    const on = def.perches.find((x) => x.id === state.mocha.perch);
    const hidden = on !== undefined && state.mocha.path.length === 0 && perchHidesMocha(def, on);
    const node = mochaNode(def, state);
    const p = node === null ? undefined : nodePos(def, state, node);
    if (p && !hidden) out.push({ key: 'mocha:mocha', kind: 'mocha', id: 'mocha', hit: box(p, MOCHA_BOX), layer: TARGET_LAYER.mocha });
  }
  const b = state.done ? undefined : nodePos(def, state, state.baby.node);
  if (b) out.push({ key: 'baby:baby', kind: 'baby', id: 'baby', hit: box(b, BABY_BOX), layer: TARGET_LAYER.baby });
  return out.sort((a, c) => a.layer - c.layer);
}

/** A hit shape grown about its centre to at least `minPx` screen px each way at `scale` (R6). */
export function minHit(hit: Hit, scale: number, minPx = MIN_HIT_PX): Hit {
  const min = minPx / scale;
  if ('r' in hit) return hit.r * 2 >= min ? hit : { cx: hit.cx, cy: hit.cy, r: min / 2 };
  const w = Math.max(hit.w, min);
  const h = Math.max(hit.h, min);
  return w === hit.w && h === hit.h ? hit : { x: hit.x - (w - hit.w) / 2, y: hit.y - (h - hit.h) / 2, w, h };
}

/** Distance from a point to a hit shape in page units (0 inside or on its edge). */
export function hitDistance(hit: Hit, [px, py]: Pt): number {
  if ('r' in hit) return Math.max(0, Math.hypot(px - hit.cx, py - hit.cy) - hit.r);
  const dx = Math.max(hit.x - px, 0, px - (hit.x + hit.w));
  const dy = Math.max(hit.y - py, 0, py - (hit.y + hit.h));
  return Math.hypot(dx, dy);
}

const EPS = 1e-6;

/** The nearest of `list` by `dist`; ties go to the higher layer (and then the later, drawn on top). */
function nearest(list: readonly Target[], dist: (t: Target) => number): { target: Target; d: number } | null {
  let best: { target: Target; d: number } | null = null;
  for (const target of list) {
    const d = dist(target);
    if (best === null || d < best.d - EPS || (Math.abs(d - best.d) <= EPS && target.layer >= best.target.layer)) best = { target, d };
  }
  return best;
}

export type HitHow = 'direct' | 'grown' | 'magnet';

/** What a finger at page point `p` touches (see the file comment), or null. */
export function hitTest(targets: readonly Target[], p: Pt, scale: number, { magnetPx = MAGNET_PX, minPx = MIN_HIT_PX } = {}): { target: Target; how: HitHow } | null {
  const direct = targets.filter((t) => hitDistance(t.hit, p) <= EPS);
  if (direct.length > 0) return { target: nearest(direct, () => 0)!.target, how: 'direct' };
  const grown = targets.filter((t) => hitDistance(minHit(t.hit, scale, minPx), p) <= EPS);
  if (grown.length > 0) return { target: nearest(grown, (t) => hitDistance(t.hit, p))!.target, how: 'grown' };
  return magnet(targets, p, scale, { magnetPx, minPx });
}

/** GDD § 2.6 magnet: the nearest target whose (grown) hit area is within `magnetPx` screen px. */
export function magnet(targets: readonly Target[], p: Pt, scale: number, { magnetPx = MAGNET_PX, minPx = MIN_HIT_PX } = {}): { target: Target; how: 'magnet' } | null {
  const best = nearest(targets, (t) => hitDistance(minHit(t.hit, scale, minPx), p));
  return best !== null && best.d <= magnetPx / scale + EPS ? { target: best.target, how: 'magnet' } : null;
}

/** Where `p` falls along a track, as a fraction from `from` (0) to `to` (1), unclamped. */
export function projectTrack(from: Pt, to: Pt, p: Pt): number {
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
  const len2 = dx * dx + dy * dy;
  return len2 === 0 ? 0 : ((p[0] - from[0]) * dx + (p[1] - from[1]) * dy) / len2;
}

/** Over-drag past either end stop stretches like a rubber band: it eases toward `RUBBER_STOPS`. */
export function rubberBand(index: number, last: number, limit = RUBBER_STOPS): number {
  if (index >= 0 && index <= last) return index;
  const over = index < 0 ? -index : index - last;
  const give = limit * (1 - Math.exp(-over / limit));
  return index < 0 ? -give : last + give;
}

/** The stop a linear drag released at fractional `index` snaps to: the nearest, clamped to the track. */
export function snapStop(index: number, count: number): number {
  return Math.min(count - 1, Math.max(0, Math.round(index)));
}

/** The signed angle from `a` to `b` around `center`, in radians in (−π, π] (positive = clockwise on screen). */
export function rotaryDelta(center: Pt, a: Pt, b: Pt): number {
  const ta = Math.atan2(a[1] - center[1], a[0] - center[0]);
  const tb = Math.atan2(b[1] - center[1], b[0] - center[0]);
  let d = tb - ta;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  return d;
}

/** Whole steps for a rotary drag of `radians` on a part with `count` orientations (nearest step). */
export function rotaryStep(radians: number, count: number): number {
  const s = Math.round((radians * count) / (2 * Math.PI));
  return s === 0 ? 0 : s; // no −0
}

/** `i` wrapped into 0 … count − 1. */
export const wrapIndex = (i: number, count: number): number => ((i % count) + count) % count;

/** GDD § 2.6: a second tap on the same element within 250 ms is ignored. */
export class Debouncer {
  private readonly last = new Map<string, number>();
  constructor(private readonly ms = DEBOUNCE_MS) {}
  /** True if a tap on `key` at `now` counts (and remembers it). */
  accept(key: string, now: number): boolean {
    const prev = this.last.get(key);
    if (prev !== undefined && now - prev < this.ms) return false;
    this.last.set(key, now);
    return true;
  }
}

/** A part drawn between stops: its state index as a fraction (unwrapped for wheels). */
export interface PartPreview {
  readonly part: Id;
  readonly index: number;
}

/** What the view shows of the gesture (GDD § 2.6; bible § 4.1 states, drawn by the part views' `look`, #140). */
export interface GestureFlags {
  /** The part following the finger while it drags (the snapped stop after release is `settlePreview`'s) */
  readonly preview: PartPreview | null;
  /** The part being dragged (bible § 4.1 *Dragging*) */
  readonly dragging: Id | null;
  /** The last locked part touched; `serial` bumps on every touch so its wobble replays */
  readonly locked: { readonly part: Id; readonly serial: number } | null;
  /** Hold-to-reveal: outline every touchable */
  readonly reveal: boolean;
  /** Where the finger is (page units) while it pauses the world: Baokaka watches it */
  readonly finger: Pt | null;
}

export const NO_GESTURE: GestureFlags = { preview: null, dragging: null, locked: null, reveal: false, finger: null };

/** What the page needs to know at the moment a finger lands (the world is paused from then on). */
export interface GestureWorld {
  readonly targets: readonly Target[];
  /** Page units → screen px */
  readonly scale: number;
  /** A part's states and the index of its current state (the pending one, if a drag is waiting for its tick) */
  states(part: Id): readonly string[];
  stateIndex(part: Id): number;
  /** The player can't move it now (`lockedWhen`, or Mocha sitting on it) */
  locked(part: Id): boolean;
  /** Holding on empty space may reveal touchables (false while an overlay owns the finger) */
  readonly hold?: boolean;
}

/** Things the game layer hears: sounds, Mocha's glare, the word ring, the 土地公 sticker (#97, #99, #101). */
export type GestureEvent =
  | { readonly type: 'tap'; readonly target: Target }
  | { readonly type: 'nope'; readonly part: Id }
  | { readonly type: 'dragStart'; readonly part: Id }
  | { readonly type: 'snap'; readonly part: Id; readonly to: string; readonly index: number }
  | { readonly type: 'wordRing' }
  | { readonly type: 'tudigong' }
  | { readonly type: 'reveal' };

export type GestureEffect =
  | { readonly type: 'pause' }
  | { readonly type: 'resume' }
  | { readonly type: 'input'; readonly input: Input }
  | { readonly type: 'event'; readonly event: GestureEvent };

interface Active {
  readonly pointer: number;
  readonly start: Pt;
  readonly startTime: number;
  readonly target: Target | null;
  readonly world: GestureWorld;
  last: Pt;
  moved: boolean;
  mode: 'pending' | 'drag' | 'dead';
  /** Drag: the state index it started at, and the raw (un-banded) fractional index now */
  startIndex: number;
  raw: number;
  /** Rotary drags accumulate angle so a full turn and more counts */
  angle: number;
}

/**
 * One page's gesture state machine. Feed it pointer events in page units with a time in ms; each
 * call returns the effects to apply, and `flags` is what the view should draw.
 *
 * - The first finger down pauses the session; the last one up resumes it (R3; the 150 ms grace
 *   is the session's). Every finger counts for the pause, but only the first drives a gesture.
 * - More than three fingers at once cancels the gesture (palm); nothing commits.
 * - Under 8 px of travel it is a tap (on release, debounced per element). Past 8 px on a draggable
 *   part it is a drag, captured by that part until release, which snaps and commits a `set` (or a
 *   flap's `tap`). A non-draggable target still takes the tap if the finger lifts over it.
 * - A locked part wobbles, Mocha glares, `nope` is heard; no input is queued.
 */
export class GestureTracker {
  private readonly pointers = new Set<number>();
  private active: Active | null = null;
  private palm = false;
  private holdArmed = false;
  private lockSerial = 0;
  private readonly debounce: Debouncer;
  flags: GestureFlags = NO_GESTURE;

  constructor(debounceMs = DEBOUNCE_MS) {
    this.debounce = new Debouncer(debounceMs);
  }

  /** True while a finger rests on empty space that may become a hold (`hold()` is then due after `HOLD_MS`). */
  get holdPending(): boolean {
    return this.holdArmed;
  }

  /** How many points are down. */
  get points(): number {
    return this.pointers.size;
  }

  down(pointer: number, p: Pt, now: number, world: GestureWorld): GestureEffect[] {
    const fx: GestureEffect[] = [];
    if (this.pointers.has(pointer)) return fx;
    this.pointers.add(pointer);
    if (this.pointers.size === 1) fx.push({ type: 'pause' });
    if (this.pointers.size > PALM_POINTS) {
      this.palm = true;
      this.active = null;
      this.holdArmed = false;
      this.set({ preview: null, dragging: null, reveal: false, finger: null });
      return fx;
    }
    if (this.palm || this.active !== null || this.pointers.size > 1) return fx; // second finger: ignored
    const hit = hitTest(world.targets, p, world.scale);
    const target = hit?.target ?? null;
    const a: Active = { pointer, start: p, startTime: now, target, world, last: p, moved: false, mode: 'pending', startIndex: 0, raw: 0, angle: 0 };
    this.active = a;
    this.holdArmed = target === null && world.hold !== false;
    if (target?.kind === 'part' && world.locked(target.id)) {
      a.mode = 'dead';
      this.lockSerial += 1;
      this.set({ locked: { part: target.id, serial: this.lockSerial }, finger: p });
      fx.push({ type: 'event', event: { type: 'nope', part: target.id } });
      return fx;
    }
    this.set({ finger: p });
    return fx;
  }

  move(pointer: number, p: Pt): GestureEffect[] {
    const a = this.active;
    if (a === null || pointer !== a.pointer || this.palm) return [];
    const fx: GestureEffect[] = [];
    const travel = Math.hypot(p[0] - a.start[0], p[1] - a.start[1]) * a.world.scale;
    if (!a.moved && travel >= DRAG_THRESHOLD_PX) {
      a.moved = true;
      this.holdArmed = false;
      if (a.mode === 'pending' && a.target?.drag) {
        a.mode = 'drag';
        a.startIndex = a.world.stateIndex(a.target.id);
        a.raw = a.startIndex;
        fx.push({ type: 'event', event: { type: 'dragStart', part: a.target.id } });
      }
    }
    if (a.mode === 'drag' && a.target?.drag) {
      const spec = a.target.drag;
      let shown: number;
      if (spec.kind === 'linear') {
        const along = projectTrack(spec.from, spec.to, p) - projectTrack(spec.from, spec.to, a.start);
        a.raw = a.startIndex + along * (spec.count - 1);
        shown = rubberBand(a.raw, spec.count - 1);
      } else if (spec.kind === 'rotary') {
        a.angle += rotaryDelta(spec.center, a.last, p);
        a.raw = a.startIndex + (a.angle * spec.count) / (2 * Math.PI);
        shown = a.raw;
      } else {
        const lift = Math.min(1, Math.hypot(p[0] - a.start[0], p[1] - a.start[1]) / spec.reach);
        a.raw = a.startIndex === 0 ? lift : 1 - lift;
        shown = a.raw;
      }
      this.set({ preview: { part: a.target.id, index: shown }, dragging: a.target.id, finger: p });
    } else {
      this.set({ finger: p });
    }
    a.last = p;
    return fx;
  }

  up(pointer: number, p: Pt, now: number): GestureEffect[] {
    if (!this.pointers.delete(pointer)) return [];
    const fx: GestureEffect[] = [];
    const a = this.active;
    if (a !== null && pointer === a.pointer) {
      if (!this.palm) {
        fx.push(...this.move(pointer, p));
        fx.push(...this.finish(a, p, now));
      }
      this.end();
    }
    if (this.pointers.size === 0) {
      this.palm = false;
      fx.push({ type: 'resume' });
    }
    return fx;
  }

  /** The browser took the pointer away (`pointercancel`): the gesture ends with no input. */
  cancel(pointer: number): GestureEffect[] {
    if (!this.pointers.delete(pointer)) return [];
    if (this.active?.pointer === pointer) {
      this.end();
      this.set({ preview: null });
    }
    if (this.pointers.size === 0) {
      this.palm = false;
      return [{ type: 'resume' }];
    }
    return [];
  }

  /** Called `HOLD_MS` after a finger landed on empty space: if it is still there and still, reveal. */
  hold(now: number): GestureEffect[] {
    const a = this.active;
    if (!this.holdArmed || a === null || a.moved || this.palm || now - a.startTime < HOLD_MS - 1) return [];
    this.holdArmed = false;
    this.set({ reveal: true });
    return [{ type: 'event', event: { type: 'reveal' } }];
  }

  private end(): void {
    this.active = null;
    this.holdArmed = false;
    this.set({ dragging: null, reveal: false, finger: null });
  }

  private set(patch: Partial<GestureFlags>): void {
    this.flags = { ...this.flags, ...patch };
  }

  private finish(a: Active, p: Pt, now: number): GestureEffect[] {
    const t = a.target;
    if (t === null || a.mode === 'dead') return [];
    if (a.mode === 'drag' && t.drag) return this.release(a, t, t.drag);
    // A tap: under the threshold, or a non-draggable target the finger lifts over again
    if (a.moved && hitDistance(minHit(t.hit, a.world.scale), p) > MAGNET_PX / a.world.scale) return [];
    if (!this.debounce.accept(t.key, now)) return [];
    const fx: GestureEffect[] = [{ type: 'event', event: { type: 'tap', target: t } }];
    switch (t.kind) {
      case 'part':
        fx.push({ type: 'input', input: { t: 'tap', id: t.id } });
        break;
      case 'perch':
        fx.push({ type: 'input', input: { t: 'mocha', perch: t.id } });
        break;
      case 'mocha':
        fx.push({ type: 'input', input: { t: 'pet' } });
        break;
      case 'baby':
        fx.push({ type: 'event', event: { type: 'wordRing' } });
        break;
      case 'tudigong':
        fx.push({ type: 'event', event: { type: 'tudigong' } });
        break;
    }
    return fx;
  }

  /** A drag lets go: snap to the nearest stop and commit it at the next tick (via the queued input). */
  private release(a: Active, t: Target, spec: DragSpec): GestureEffect[] {
    const states = a.world.states(t.id);
    let index: number;
    let input: Input | null = null;
    if (spec.kind === 'linear') {
      index = snapStop(a.raw, spec.count);
      if (index !== a.startIndex) input = { t: 'set', part: t.id, to: states[index] };
    } else if (spec.kind === 'rotary') {
      index = a.startIndex + rotaryStep(a.angle, spec.count);
      const to = states[wrapIndex(index, spec.count)];
      if (to !== states[a.startIndex]) input = { t: 'set', part: t.id, to };
    } else {
      const flipped = Math.abs(a.raw - a.startIndex) >= FLAP_COMMIT;
      index = flipped ? 1 - a.startIndex : a.startIndex;
      if (flipped) input = { t: 'tap', id: t.id };
    }
    this.set({ preview: null }); // the caller holds the snapped stop until the tick lands (`settlePreview`)
    if (input === null) return [];
    return [
      { type: 'input', input },
      { type: 'event', event: { type: 'snap', part: t.id, to: states[wrapIndex(index, states.length)], index } },
    ];
  }
}

/**
 * Where a part's preview puts a node that rides it (the train under the tab): between the attach
 * positions of the two states either side of the fractional index (straight on past the ends).
 */
export function previewNodePos(def: PageDef, preview: PartPreview, nodeId: Id): Pt | undefined {
  const node = def.nodes.find((n) => n.id === nodeId);
  if (node?.attach?.part !== preview.part) return undefined;
  const part = def.parts.find((p) => p.id === preview.part);
  if (part === undefined) return undefined;
  const { states } = compilePart(part);
  if (states.length < 2) return node.attach.pos[states[0]];
  const i = Math.min(states.length - 2, Math.max(0, Math.floor(preview.index)));
  const a = node.attach.pos[states[i]];
  const b = node.attach.pos[states[i + 1]];
  if (!a || !b) return undefined;
  const f = preview.index - i;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

/**
 * The preview to draw while a released drag waits for its tick and then settles: the snapped stop
 * until the tick that applies it (`applyAt`), then a 0 → 1 `progress` glide to where the state
 * really landed (it may have jammed short). Null once there is nothing left to show.
 */
export function settlePreview(
  held: { readonly part: Id; readonly index: number; readonly applyAt: number },
  serial: number,
  actual: { readonly index: number; readonly count: number; readonly wraps: boolean },
  progress: number,
): PartPreview | null {
  if (serial < held.applyAt) return { part: held.part, index: held.index };
  if (serial > held.applyAt || progress >= 1) return null;
  // Wheels land the short way round from the snapped (unwrapped) index
  let target = actual.index;
  if (actual.wraps) {
    const d = wrapIndex(actual.index - held.index, actual.count);
    target = held.index + (d > actual.count / 2 ? d - actual.count : d);
  }
  return { part: held.part, index: held.index + (target - held.index) * progress };
}
