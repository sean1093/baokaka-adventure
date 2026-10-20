import { partState } from '../../core/cond';
import { nodePos } from '../../core/graph';
import { compilePart } from '../../core/presets';
import type { PageDef, SimState } from '../../core/types';
import type { Hit, Pt } from '../geometry';
import { hitCenter, type Target } from '../gestures';
import { KNOB, TAB } from '../parts/TabView';
import type { HandGesture, HintShow } from './look';

/**
 * Where the hint visuals go (bible § 4.1 hint L1/L2; GDD § 2.7): the halo hugs what the finger
 * should touch (`haloShape`), the ghost hand does the target's gesture — a tab dragged to the hinted stop, a wheel
 * turned one step, a flap's corner lifted, anything else tapped. #100 decides *what* to hint.
 */

/** A tab or slider card's centre at a (fractional) stop index, as `TabView` draws it. */
export function trackPoint(track: { readonly from: Pt; readonly to: Pt }, index: number, count: number): Pt {
  const t = count > 1 ? index / (count - 1) : 0;
  return [track.from[0] + (track.to[0] - track.from[0]) * t, track.from[1] + (track.to[1] - track.from[1]) * t];
}

/**
 * Where the L1 halo glows: hugging what the finger should touch, not the whole hit area — a tab's
 * card at its current stop (turned to its track), a wheel's rim, a flap's card; otherwise the hit
 * shape. `at` and `deg` place a shape drawn about the origin.
 */
export interface HaloShape {
  readonly hit: Hit;
  readonly at?: Pt;
  readonly deg?: number;
}

export function haloShape(def: PageDef, state: SimState, target: Target): HaloShape {
  const part = target.kind === 'part' ? def.parts.find((p) => p.id === target.id) : undefined;
  if (part === undefined) return { hit: target.hit };
  const { states, input } = compilePart(part);
  if (input === 'drag-linear' && part.track) {
    const index = Math.max(0, states.indexOf(partState(state, part.id) ?? ''));
    const [len, thick] = part.preset === 'slider' ? [KNOB, 30] : [TAB.len, TAB.thick];
    const deg = (Math.atan2(part.track.to[1] - part.track.from[1], part.track.to[0] - part.track.from[0]) * 180) / Math.PI;
    return { hit: { x: -len / 2, y: -thick / 2, w: len, h: thick }, at: trackPoint(part.track, index, states.length), deg };
  }
  if (input === 'drag-rotary') {
    const hb = 'r' in part.hit ? { w: part.hit.r * 2, h: part.hit.r * 2 } : part.hit;
    const r = part.radius ?? Math.max(20, Math.min(hb.w, hb.h) / 2 - 8);
    const [cx, cy] = part.center ?? hitCenter(part.hit);
    return { hit: { cx, cy, r: r * 1.12 } };
  }
  // The target's hit: a flap riding a node (`ridesOn`, #107) has moved with it
  const fh = target.hit;
  if (part.preset === 'flap' && !('r' in fh)) {
    return { hit: { x: fh.x + 4, y: fh.y + 4, w: Math.max(40, fh.w - 22), h: Math.max(32, fh.h - 22) } };
  }
  return { hit: target.hit };
}

/** The ghost hand's gesture for a hinted target in `state`. */
export function handGesture(def: PageDef, state: SimState, target: Target, hint: Pick<HintShow, 'stop'> = {}): HandGesture {
  const at = hitCenter(target.hit);
  if (target.kind !== 'part') return { kind: 'tap', at };
  const part = def.parts.find((p) => p.id === target.id);
  if (part === undefined) return { kind: 'tap', at };
  const { states, input } = compilePart(part);
  const index = Math.max(0, states.indexOf(partState(state, part.id) ?? ''));
  const count = states.length;
  if (input === 'drag-linear' && part.track) {
    const next = hint.stop ?? (index + 1 < count ? index + 1 : index - 1);
    return { kind: 'drag', from: trackPoint(part.track, index, count), to: trackPoint(part.track, Math.max(0, Math.min(count - 1, next)), count) };
  }
  if (input === 'drag-rotary') {
    const hb = 'r' in part.hit ? { w: part.hit.r * 2, h: part.hit.r * 2 } : part.hit;
    const radius = part.radius ?? Math.max(20, Math.min(hb.w, hb.h) / 2 - 8);
    const steps = hint.stop === undefined ? 1 : ((hint.stop - index + count) % count) || count;
    return { kind: 'turn', center: part.center ?? at, radius, degrees: (360 / Math.max(1, count)) * steps };
  }
  const fh = target.hit;
  if (part.preset === 'flap' && input !== 'none' && !('r' in fh)) {
    // The dog-ear corner, as FlapView places the card inside its hit area (moved with a riding flap)
    const w = Math.max(40, fh.w - 22);
    const h = Math.max(32, fh.h - 22);
    return { kind: 'lift', at: [fh.x + 4 + w - 6, fh.y + 4 + h - 4], rise: Math.max(18, h * 0.5) };
  }
  return { kind: 'tap', at };
}

/**
 * The dotted thread from a hinted part to what it moves (bible § 4 linked parts: "during hint
 * L1/L2, a dotted thread connects them"): its hit centre to the first node riding it, or null.
 */
export function linkThread(def: PageDef, state: SimState, target: Target): readonly [Pt, Pt] | null {
  if (target.kind !== 'part') return null;
  const rider = def.nodes.find((n) => n.attach?.part === target.id);
  if (rider === undefined) return null;
  const p = nodePos(def, state, rider.id);
  return p === undefined ? null : [hitCenter(target.hit), p];
}
