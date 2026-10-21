import type { Pt } from '../geometry';
import { clamp01, easeInOut } from '../interp';

/**
 * Standee motion (#95; popup art bible § 5, § 8): the characters move as rigid cards. Pure
 * functions of the time into the tick, like the rest of the view.
 *
 * - **Step:** a hop-lerp over the tick (the arc is `stepPose`'s), finished `LAND_MS` before the
 *   tick ends so the landing has its time; the card leans 3–5° into the travel direction, most
 *   at mid-step.
 * - **Landing:** a ±2° wobble over `LAND_MS`, damped.
 * - **Look L/R** (the fallback until #141's head turns): card flips away and back over the tick.
 * - **First steps** (§ 2.5 第一步, #128): a walk step sways side to side on top of the lean, twice a
 *   stride, arms out (`walkSway`): he is not sure of it yet.
 * - **Reduced motion:** no arc, lean or wobble; a step is a short fade-slide into place.
 */

/** The landing wobble (bible § 8: ±2° for 120 ms). */
export const LAND_MS = 120;
export const WOBBLE_DEG = 2;
/** The lean into the travel direction at mid-step (bible § 5: 3–5°). */
export const LEAN_DEG = 4;
/** Reduced motion: the fade-slide's length and its slide. */
export const FADE_MS = 180;
export const FADE_SLIDE = 10;
export const FADE_FROM = 0.25;

/** How far through its step the actor is (0–1), `ms` into a `tickMs` tick: the step ends `LAND_MS` early. */
export function stepT(ms: number, tickMs: number): number {
  const travel = Math.max(tickMs * 0.6, tickMs - LAND_MS);
  return clamp01(ms / Math.max(1, travel));
}

/** −1 travelling left, 1 right, 0 straight up or down (no lean). */
export const travelDir = (from: Pt, to: Pt): -1 | 0 | 1 => (Math.abs(to[0] - from[0]) < 0.5 ? 0 : to[0] < from[0] ? -1 : 1);

/**
 * The card's rotation in degrees (clockwise, about its feet) at `ms`: the lean while stepping,
 * then the damped landing wobble. Zero when it isn't stepping.
 */
export function standeeTilt(ms: number, tickMs: number, dir: -1 | 0 | 1, reduced = false): number {
  if (dir === 0 || reduced) return 0;
  const t = stepT(ms, tickMs);
  if (t < 1) return dir * LEAN_DEG * Math.sin(Math.PI * easeInOut(t));
  const u = ms - Math.max(tickMs * 0.6, tickMs - LAND_MS);
  if (u >= LAND_MS) return 0;
  const v = u / LAND_MS;
  // Rocks forward first (the card's momentum), then back, settling
  return dir * WOBBLE_DEG * Math.sin(Math.PI * 2 * 1.5 * v) * (1 - v);
}

/** The first walk's sway (#128): degrees at its widest, either side. */
export const WALK_SWAY_DEG = 5;

/**
 * The wobble of a walk step (§ 2.5 第一步, #128), degrees clockwise about his feet, `t` (0–1) through
 * a step `strides` strides long: two sways a stride, settling to upright as he lands. Zero under
 * reduced motion.
 */
export function walkSway(t: number, strides: number, reduced = false): number {
  if (reduced || t <= 0 || t >= 1) return 0;
  return WALK_SWAY_DEG * Math.sin(Math.PI * 2 * strides * t) * (1 - t * 0.5);
}

/** Reduced motion's step: a short slide into place from the travel side while fading in. */
export function fadeSlide(from: Pt, to: Pt, ms: number): { x: number; y: number; opacity: number } {
  const k = clamp01(ms / FADE_MS);
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  const s = len < 0.01 ? 0 : (Math.min(FADE_SLIDE, len) * (1 - k)) / len;
  return { x: to[0] - dx * s, y: to[1] - dy * s, opacity: FADE_FROM + (1 - FADE_FROM) * k };
}

/** The lamp glow behind 寶咖咖 (bible § 5): within this many units of a lit light. */
export const LAMP_GLOW_R = 110;
