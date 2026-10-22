import type { Word } from '../../core/types';
import type { BookLayout, Pt } from '../geometry';
import { HUD_H } from '../geometry';

/**
 * Where the word ring's discs go (GDD § 2.4; popup art bible § 7 word ring; #99), in screen px.
 *
 * The ring is a volvelle around Baokaka: the learned words sit on a circle about him, one 72 px
 * paper disc each (≥ 64 px, R6 with room), with the 「好了」 disc straight under him, nearest the
 * thumb. The words start beside 「好了」 on the thumb's side (lower right; lower left in 左手模式)
 * and go round over the top, so with one or two words every disc is in the bottom half of the ring,
 * a short reach for one thumb. Neighbours are ≥ `DISC_GAP` apart; a full ring (eight words and
 * 「好了」) closes the circle. When the ring would leave the safe area (16 px gutters, under the HUD,
 * over the bottom bar) its centre slides in, and the discs keep their places on it.
 *
 * Pure; `WordRing.tsx` draws it and `ringLayout.test.ts` checks every count at every viewport.
 */

/** A word disc's diameter in screen px (bible § 7: 64 px paper discs; a little more for its glyph). */
export const DISC = 72;
/** The space between two neighbouring discs' edges (it narrows to nothing only where a full ring would not fit, 320 px phones). */
export const DISC_GAP = 10;
/** The widest step between neighbours, in degrees: few words stay close together under the thumb. */
export const MAX_STEP = 44;
/** The page's side gutter (and the gap kept under the HUD and over the bar). */
export const RING_GUTTER = 16;

export type RingSlot = { readonly kind: 'word'; readonly word: Word; readonly at: Pt; readonly deg: number } | { readonly kind: 'close'; readonly at: Pt; readonly deg: number };

export interface RingLayout {
  /** The ring's centre (Baokaka, unless the ring had to slide in) */
  readonly center: Pt;
  readonly radius: number;
  /** The angular step between neighbours, in degrees */
  readonly step: number;
  /** 「好了」 first, then the words in order */
  readonly slots: readonly RingSlot[];
}

export interface SafeArea {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** The area the ring's discs stay inside: the screen less the gutters, the HUD and the bottom bar. */
export function ringSafeArea(layout: Pick<BookLayout, 'vw' | 'barTop'> & Partial<Pick<BookLayout, 'hudTop'>>): SafeArea {
  const top = (layout.hudTop ?? 0) + HUD_H + 4;
  return { x: RING_GUTTER, y: top, w: layout.vw - 2 * RING_GUTTER, h: layout.barTop - 4 - top };
}

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Lays out the ring about `around` (Baokaka's middle, screen px) for `words` (1–8; none still
 * places 「好了」). Angles are screen degrees: 0 right, 90 down (「好了」).
 */
export function ringLayout(around: Pt, words: readonly Word[], opts: { leftHand?: boolean; safe: SafeArea }): RingLayout {
  const count = words.length + 1;
  const step = Math.min(MAX_STEP, 360 / count);
  // Right hand: from 「好了」 (down) toward the right, up and over; left hand: the mirror
  const dir = opts.leftHand ? 1 : -1;
  const angles = [90, ...words.map((_, i) => 90 + dir * step * (i + 1))];
  const { safe } = opts;
  const half = DISC / 2;
  // Neighbours' centres a chord apart: one disc and the gap (narrowed on the smallest phones, never below touching)
  const place = (gap: number) => {
    const r = (DISC + gap) / 2 / Math.sin(rad(step) / 2);
    return { radius: r, offsets: angles.map((a): Pt => [Math.cos(rad(a)) * r, Math.sin(rad(a)) * r]) };
  };
  const span = (o: readonly Pt[], i: 0 | 1) => Math.max(...o.map((p) => p[i])) - Math.min(...o.map((p) => p[i])) + DISC;
  let gap = DISC_GAP;
  let placed = place(gap);
  while (gap > 0 && (span(placed.offsets, 0) > safe.w || span(placed.offsets, 1) > safe.h)) placed = place((gap = Math.max(0, gap - 2)));
  const { radius, offsets } = placed;
  // Slide the centre so every disc is inside the safe area
  const fit = (c: number, lo: number, hi: number, min: number, max: number): number => {
    const left = c + min - half;
    const right = c + max + half;
    if (right - left > hi - lo) return lo + (hi - lo) / 2 - (min + max) / 2;
    if (left < lo) return c + (lo - left);
    if (right > hi) return c - (right - hi);
    return c;
  };
  const xs = offsets.map((o) => o[0]);
  const ys = offsets.map((o) => o[1]);
  const center: Pt = [
    fit(around[0], safe.x, safe.x + safe.w, Math.min(...xs), Math.max(...xs)),
    fit(around[1], safe.y, safe.y + safe.h, Math.min(...ys), Math.max(...ys)),
  ];
  const at = (o: Pt): Pt => [center[0] + o[0], center[1] + o[1]];
  const slots: RingSlot[] = [
    { kind: 'close', at: at(offsets[0]), deg: angles[0] },
    ...words.map((word, i): RingSlot => ({ kind: 'word', word, at: at(offsets[i + 1]), deg: angles[i + 1] })),
  ];
  return { center, radius, step, slots };
}
