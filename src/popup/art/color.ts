import { POPUP as C } from '../../art/palette';

/**
 * Colour distance for the reserved-marigold rule (popup art bible § 4 cue 1, § 10 item 4): any
 * decorative fill within ΔE < 12 of marigold is flagged, so the touchables stay the only bright
 * saturated warm on a page. ΔE is CIE76 (Euclidean distance in CIELAB, D65), the unqualified
 * "ΔE" of the bible; decision D-54 records the choice and the reference stops.
 */

/** The reserved marigold card (bible § 4): light → mid → deep, and its edge. Never night-graded. */
export const MARIGOLD_CARD = { light: C.marigoldLight, mid: C.marigold, deep: C.marigoldDeep, edge: C.marigoldEdge } as const;

/**
 * What "near marigold" is measured against: the card's saturated body (`marigold`, `marigoldDeep`).
 * The light stop (`marigoldLight`) is a highlight that by design sits beside lamplight (bible § 3.3's
 * lit vellum `windowMid`, ΔE 9) and foil (`gold`, ΔE 10), and the edge (`marigoldEdge`) is a brown
 * beside kraft and wood; measuring against them would flag the bible's own night palette (D-54).
 */
export const MARIGOLD_REFERENCE: readonly string[] = [MARIGOLD_CARD.mid, MARIGOLD_CARD.deep];

/** The ΔE under which a decorative colour counts as marigold (bible § 4). */
export const MARIGOLD_DELTA_E = 12;

export type Lab = readonly [number, number, number];

/** A 3- or 6-digit hex colour → [r, g, b] in 0–255, or null when it isn't one. */
export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  const n = parseInt(h, 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

/** sRGB (0–255) → CIELAB (D65). */
export function rgbToLab([r, g, b]: readonly [number, number, number]): Lab {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [lr, lg, lb] = [lin(r), lin(g), lin(b)];
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** CIE76 ΔE between two Lab colours. */
export const deltaE = (a: Lab, b: Lab): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** CIE76 ΔE between two hex colours (NaN when either isn't one). */
export function deltaEHex(a: string, b: string): number {
  const pa = parseHex(a);
  const pb = parseHex(b);
  return pa && pb ? deltaE(rgbToLab(pa), rgbToLab(pb)) : NaN;
}

const REFERENCE_LAB = MARIGOLD_REFERENCE.map((hex) => rgbToLab(parseHex(hex)!));

/** The smallest ΔE from `hex` to the marigold reference stops (Infinity for a non-hex value). */
export function marigoldDistance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return Infinity;
  const lab = rgbToLab(rgb);
  return Math.min(...REFERENCE_LAB.map((ref) => deltaE(lab, ref)));
}

/** True when `hex` reads as the reserved marigold (ΔE < 12). */
export const isNearMarigold = (hex: string, threshold = MARIGOLD_DELTA_E): boolean => marigoldDistance(hex) < threshold;
