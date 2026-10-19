import { POPUP as C } from '../../art/palette';
import { paw } from './touchables';
import { f1, ref, translate, type KitCtx } from './svg';

/**
 * The touchable states (popup art bible § 4.1, proof D row 5) as kit pieces: the locked paw badge,
 * the done check knot, the hint L1 halo, the hint L2 vellum ghost hand, the drag's lifted shadow
 * and the reduced-motion double outline. Filter-free on every path (GDD § 3.9: the halo and the
 * lifted shadow are radial-gradient blobs, the "pre-baked" soft shapes, never a runtime blur).
 */

/**
 * Verb-seal half-sizes on a page (bible § 4 cue 2): ≥ 22 CSS px after the 0.91 book scale, and
 * 28 px in 長輩模式 (bible § 9.3). The kit's own default (`seal(…, r = 13)`) is for sheets at 1:1.
 */
export const SEAL_R = { normal: 12.5, elder: 15.5 } as const;

/** A seal half-size at least as big as the page minimum for the mode. */
export const sealR = (base: number, elder = false): number => Math.max(base, elder ? SEAL_R.elder : SEAL_R.normal);

/** The locked badge (bible § 4.1 locked): a deep-violet disc with a chalk paw, centred on (x, y). */
export function pawBadge(x: number, y: number, r = 9): string {
  return `<g data-badge="locked" transform="${translate(x, y)}"><circle r="${f1(r + 1.4)}" fill="${C.shadow}" opacity=".35" transform="translate(.8 1.2)"/>`
    + `<circle r="${f1(r)}" fill="${C.lockBadge}" stroke="${C.chalk}" stroke-width="1.2"/>`
    + `<g transform="translate(0 ${f1(r * 0.08)})">${paw(C.chalk, r * 0.07)}</g></g>`;
}

/** The done knot (bible § 4.1 done, optional per page): a small green check on a solved part. */
export function checkKnot(x: number, y: number, r = 8): string {
  return `<g data-badge="done" transform="${translate(x, y)}"><circle r="${f1(r + 1.2)}" fill="${C.shadow}" opacity=".3" transform="translate(.6 1)"/>`
    + `<circle r="${f1(r)}" fill="${C.doneGreen}" stroke="${C.standeeCard}" stroke-width="1.4"/>`
    + `<path d="M${f1(-r * 0.42)} 0l${f1(r * 0.3)} ${f1(r * 0.34)}l${f1(r * 0.56)} ${f1(-r * 0.64)}" fill="none" stroke="${C.standeeCard}" stroke-width="${f1(Math.max(1.6, r * 0.26))}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

/** A box (x, y, w, h) in page units. */
export type ArtBox = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

/**
 * The hint L1 halo (bible § 4.1 "where"): a soft marigold glow around `box` at 55 % (75 % in
 * 長輩模式, bible § 9.3), standing in for kit.js's blur-3 halo. A crisp-edged card of light hugging
 * the shape plus a wide radial bloom, both flat paints. The caller pulses its opacity (CSS).
 */
export function hintHalo(ctx: KitCtx, { x, y, w, h }: ArtBox, round = false, strong = false): string {
  const a = strong ? 0.75 : 0.55;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const ring = (grow: number, opacity: number) =>
    round
      ? `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(w / 2 + grow)}" fill="${C.marigold}" opacity="${f1(opacity * 100) / 100}"/>`
      : `<rect x="${f1(x - grow)}" y="${f1(y - grow)}" width="${f1(w + 2 * grow)}" height="${f1(h + 2 * grow)}" rx="${f1(Math.min(w, h) * 0.3 + grow)}" fill="${C.marigold}" opacity="${f1(opacity * 100) / 100}"/>`;
  return `<g data-affordance="hint">`
    + `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(w * 0.62 + 16)}" ry="${f1(h * 0.62 + 16)}" fill="${ref(ctx, 'softMarigold')}" opacity="${f1(a * 80) / 100}"/>`
    + ring(7, a * 0.22) + ring(4.5, a * 0.36) + ring(2, a * 0.6)
    + `</g>`;
}

/**
 * The hint L2 vellum ghost hand (bible § 4.1 "how"): a translucent lilac-white pointing hand with a
 * white cut edge, its index fingertip at the origin, the hand trailing down and right. `press`
 * draws the little tap ripple under the fingertip.
 */
export function ghostHand(press = false): string {
  const hand = 'M-4.5 2.5C-4.6 -1.6 -0.6 -3.6 2.3 -1.8C3.6 -1 4.3 0.4 4.4 2L5.4 17.6C7 15.6 10.5 15.8 11.6 18.4C13.4 16.8 16.9 17.4 17.7 20.2'
    + 'C19.5 18.9 22.7 19.8 23.2 22.7L24.8 34.8C25.9 43.2 21.8 50.6 13.6 52.3C6.7 53.7 0.6 50.3 -2.7 44.2L-9.6 31.6'
    + 'C-11 29 -10.1 25.9 -7.6 24.9C-5.6 24.1 -3.4 24.9 -2.3 26.7L-0.6 29.4Z';
  return `<g data-ghost-hand="">`
    + (press ? `<circle r="10" fill="none" stroke="${C.chalk}" stroke-width="1.6" opacity=".7"/><circle r="4" fill="${C.chalk}" opacity=".5"/>` : '')
    + `<path d="${hand}" fill="${C.shadow}" opacity=".22" transform="translate(2.5 3.5)"/>`
    + `<path d="${hand}" fill="${C.vellum}" opacity=".82" stroke="${C.standeeCard}" stroke-width="1.8" stroke-linejoin="round"/>`
    + `<path d="M5.4 17.6L6.4 27M11.6 18.4L12.3 27.6M17.7 20.2L18.2 28.6" fill="none" stroke="${C.printLilac}" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>`
    + `<path d="M-2.6 2.2C-2.4 0.2 -0.4 -0.8 1.3 0" fill="none" stroke="${C.standeeCard}" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>`
    + `</g>`;
}

/**
 * The drag's lifted shadow (bible § 4.1 dragging, § 9.1): the "pre-blurred shadow image" under a
 * part lifted to the next z, as a soft indigo blob over `box`. The caller drops it down-right
 * (`LIFT_SHADOW_OFFSET`, in screen space, so it doesn't turn with a rotated card).
 */
export function liftShadow(ctx: KitCtx, { x, y, w, h }: ArtBox, rx = Math.min(w, h) * 0.34): string {
  // A soft penumbra plus the card's own silhouette, so the height reads even on a dark floor
  return `<g data-lift-shadow=""><ellipse cx="${f1(x + w / 2)}" cy="${f1(y + h / 2)}" rx="${f1(w * 0.6 + 10)}" ry="${f1(h * 0.6 + 10)}" fill="${ref(ctx, 'softShadow')}" opacity=".7"/>`
    + `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(rx)}" fill="${C.shadow}" opacity=".38"/></g>`;
}

/** The drag (bible § 4.1 dragging): a 5-unit rise, 1.04 scale, the shadow dropped this far down-right. */
export const LIFT = { rise: 5, scale: 1.04, shadow: [5, 12] as const };

/**
 * The reduced-motion idle cue (bible § 4.1, § 9.3): no wiggle, a permanent 1 px light double outline
 * around the part instead (1.1 units ≈ 1 px at the book scale). `shape(grow)` draws the outline grown by `grow` units.
 */
export function doubleOutline(shape: (grow: number) => string): string {
  return `<g data-outline="reduced" fill="none" stroke="${C.chalk}" stroke-width="1.1">`
    + `<g opacity=".9">${shape(3)}</g><g opacity=".6">${shape(6)}</g></g>`;
}

/** A rounded rectangle outline `grow` units outside (x, y, w, h), for `doubleOutline`. */
export const rectOutline = ({ x, y, w, h }: ArtBox, rx = 6) => (grow: number): string =>
  `<rect x="${f1(x - grow)}" y="${f1(y - grow)}" width="${f1(w + 2 * grow)}" height="${f1(h + 2 * grow)}" rx="${f1(rx + grow)}"/>`;

/** A circle outline `grow` units outside radius `r` about (cx, cy), for `doubleOutline`. */
export const circleOutline = (cx: number, cy: number, r: number) => (grow: number): string =>
  `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r + grow)}"/>`;

/** The darkened veil over a locked part (bible § 4.1 locked: darkened 35 %), over `shape`'s outline. */
export const lockVeil = (outline: string): string => `<g data-veil="" fill="${C.shadow}" opacity=".35">${outline}</g>`;
