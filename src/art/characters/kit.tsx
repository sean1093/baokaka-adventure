import { artUrl } from '../defs';
import type { FigItem, FigRaw } from '../Fig';
import { blob, compactPath, crease, footie, hand, star4, type HandPose, type Vec } from '../geom';
import type { Tier } from '../lod';
import { ACCENTS, CAT, LINE, MATERIALS, type Material, type MaterialName } from '../palette';

/**
 * Building blocks shared by the option D characters (art direction § 2.1–2.6), ported from the
 * reference generator `docs/art/options/_gen/anime2.py`: tapered folds, toddler hands, footie
 * feet, cat paws, the star print, the bear patch, the toy block and the contact shadow. Each
 * returns `Fig` items, so the two-pass line system and the LOD gates apply to them.
 */

const lineOf = (mat: MaterialName): string => (MATERIALS[mat] as Material).line ?? MATERIALS[mat].cel;

/**
 * Tapered fold marks (`crease()`), all in one path filled with a material's line tint (§ 2.3:
 * interior details are tapered fills). Main folds show from the battle LOD up; pass `portrait`
 * for the small ones.
 */
export function folds(marks: readonly (readonly [Vec, Vec, number])[], mat: MaterialName, tier: Tier = 'battle', fill = lineOf(mat)): FigRaw {
  return { raw: <path d={compactPath(marks.map(([a, b, w]) => crease(a, b, w)).join(' '))} fill={fill} />, tier };
}

/** Tabby stripes and other marks as tapered fills in one path (used inside a part's clip). */
export const marks = (list: readonly (readonly [Vec, Vec, number])[], fill: string = MATERIALS.tabby.stripe) => (
  <path d={compactPath(list.map(([a, b, w]) => crease(a, b, w)).join(' '))} fill={fill} />
);

/** A toddler hand (§ 2.6): one contour; finger splits from the battle LOD up (a mitten on the map). */
export function handItems(wrist: Vec, angle: number, scale: number, pose: HandPose, cel: readonly [number, number] = [1.3, 1.1]): FigItem[] {
  const shape = hand(wrist, angle, scale, pose);
  return [
    { d: shape.d, mat: 'skin', cel, lw: 1 },
    { raw: <path d={compactPath(shape.creases.join(' '))} fill={MATERIALS.skin.line} />, tier: 'battle' },
  ];
}

/** A footie foot in side view: the foot, the cream grip strip along the sole and the toe-cap crease. */
export function footItems(heel: Vec, toe: Vec, w: number, mat: 'pajama' | 'pajamaFar', up: 1 | -1): FigItem[] {
  const shape = footie(heel, toe, w, { up });
  return [
    { d: shape.d, mat, cel: [1.6, 1.4] },
    { raw: <path d={compactPath(shape.strip!)} stroke={ACCENTS.soleStrip} strokeWidth={2.2} fill="none" strokeLinecap="round" />, tier: 'battle' },
    { raw: <path d={compactPath(shape.crease!)} fill={MATERIALS[mat].line} />, tier: 'portrait' },
  ];
}

/** A footie foot showing its sole: cream, with orange grip dots (dots from the battle LOD up). */
export function soleItems(heel: Vec, toe: Vec, w: number): FigItem[] {
  const shape = footie(heel, toe, w, { sole: true });
  const dots = shape.dots!.map(([x, y]) => `M${(x - 1.15).toFixed(1)},${y.toFixed(1)}a1.15,1.15 0 1,0 2.3,0a1.15,1.15 0 1,0 -2.3,0`).join('');
  return [
    { d: shape.d, mat: 'cream', cel: [1.4, 1.2] },
    { raw: <path d={dots} fill={ACCENTS.gripDot} />, tier: 'battle' },
  ];
}

/** The pajama's star print, reduced to these stars (≤ 4 at battle, § 8.3); none on the map. */
export const starPrint = (stars: readonly (readonly [number, number, number])[]): FigRaw => ({
  raw: <path d={compactPath(stars.map(([x, y, s]) => star4(x, y, s)).join(' '))} fill={ACCENTS.star} opacity={0.95} />,
  tier: 'battle',
});

/** The felt bear patch on the chest (a print, so no contour pass). On the map: just the head. */
export const BearPatch = ({ x, y, s, detail = true }: { x: number; y: number; s: number; detail?: boolean }) => {
  const bear = MATERIALS.bearPatch;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-7,-4.6a2.6,2.6 0 1,0 5.2,0a2.6,2.6 0 1,0 -5.2,0M1.8,-4.6a2.6,2.6 0 1,0 5.2,0a2.6,2.6 0 1,0 -5.2,0" fill={bear.cel} stroke={bear.line} strokeWidth={0.8} />
      <circle r={6.2} fill={bear.base} stroke={bear.line} strokeWidth={0.9} />
      {detail && (
        <>
          <path d="M2,-5.6 C6,-3 6.6,2 3.4,5.4 C4.6,1.6 4.4,-2.4 2,-5.6 Z" fill={bear.cel} />
          <ellipse cy={2} rx={3.2} ry={2.4} fill={MATERIALS.cream.base} />
          <path d="M-3.1,-1.2a.9,.9 0 1,0 1.8,0a.9,.9 0 1,0 -1.8,0M1.3,-1.2a.9,.9 0 1,0 1.8,0a.9,.9 0 1,0 -1.8,0M-1.1,1.3a1.1,.8 0 1,0 2.2,0a1.1,.8 0 1,0 -2.2,0" fill={MATERIALS.hair.line} />
        </>
      )}
    </g>
  );
};

/** The toy block (積木, `block()`): three faces and a star on the front, at (x, y), scale s. */
export const ToyBlock = ({ x, y, s = 1, star = true }: { x: number; y: number; s?: number; star?: boolean }) => {
  const b = MATERIALS.toyBlock;
  const T = (px: number, py: number) => `${(x + px * s).toFixed(1)},${(y + py * s).toFixed(1)}`;
  const w = (n: number) => +(n * s).toFixed(2);
  return (
    <g stroke={LINE.sil} strokeLinejoin="round">
      <path d={`M${T(-11, -6)}L${T(-5, -11)}L${T(11, -11)}L${T(5, -6)}Z`} fill={b.top} strokeWidth={1.6} />
      <path d={`M${T(5, -6)}L${T(11, -11)}L${T(11, 5)}L${T(5, 10)}Z`} fill={b.cel} strokeWidth={1.6} />
      <path d={`M${T(-11, -6)}L${T(5, -6)}L${T(5, 10)}L${T(-11, 10)}Z`} fill={b.base} strokeWidth={1.8} />
      {star && (
        <path
          d={`M${T(-3, -3)}l${w(1.7)},${w(3.6)} ${w(3.9)},${w(0.5)} ${-w(2.8)},${w(2.6)} ${w(0.8)},${w(3.8)} ${-w(3.6)},${-w(2)} ${-w(3.6)},${w(2)} ${w(0.8)},${-w(3.8)} ${-w(2.8)},${-w(2.6)} ${w(3.9)},${-w(0.5)}Z`}
          fill={b.star}
          stroke="none"
        />
      )}
    </g>
  );
};

/**
 * A cat paw (`paw()`): a round white sock with three toe splits (splits from the battle LOD up).
 * `w`, `h`: width and height; the paw sits on (x, y).
 */
export function pawItems([x, y]: Vec, w: number, h: number): FigItem[] {
  const d = blob([[x - w / 2, y], [x - w / 2 + 1, y - h * 0.7], [x, y - h], [x + w / 2 - 1, y - h * 0.7], [x + w / 2, y], [x, y + h * 0.25]]);
  const splits = [-w * 0.2, 0, w * 0.2].map((dx) => crease([x + dx, y - h * 0.25], [x + dx * 1.05, y + h * 0.12], 0.45)).join(' ');
  return [
    { d, mat: 'furCream', cel: [1.4, 1.2] },
    { raw: <path d={compactPath(splits)} fill={CAT.pawSplit} />, tier: 'battle' },
  ];
}

/** The contact shadow under a figure (the shared gradient). */
export const Contact = ({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={artUrl('contact')} />;
