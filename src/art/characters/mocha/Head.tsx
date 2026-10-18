import { artUrl } from '../../defs';
import type { FigGroup, FigItem, FigRaw } from '../../Fig';
import { compactPath, num, type Vec } from '../../geom';
import { ACCENTS, CAT, MATERIALS } from '../../palette';

/**
 * 摩卡貓's head (art direction § 2.5, § 5.2), ported from `mocha_head()` and `cat_eye()` in
 * `docs/art/options/_gen/anime.py` (the head `mc_sit`/`mc_walk` place): forehead M, cheek stripes,
 * jagged cheek fluff, a cream muzzle, almond green-gold eyes with slit pupils, whiskers. Authored at
 * its own origin, ~112u wide with the fluff; poses place it with `at`/`scale`.
 *
 * Expressions (eyes and mouth swap, § 2.5): 平常 `content` (default) · 得意 `smug` (half-lidded,
 * the "translating" face) · 開心 `happy` · 驚訝 `surprised`; and two the poses use: `hunt` (round
 * pupils for the pounce) and `sleep` (the loaf).
 */

export const MOCHA_EXPRS = ['content', 'smug', 'happy', 'surprised'] as const;
export type MochaExpr = (typeof MOCHA_EXPRS)[number] | 'hunt' | 'sleep';

const fur = MATERIALS.tabby;

const EAR_L = 'M-44,-16 C-49,-36 -47,-52 -40,-62 C-29,-57 -19,-49 -13,-40 Z';
const EAR_R = 'M13,-40 C21,-50 31,-58 42,-62 C47,-52 47,-36 43,-16 Z';
const HEAD =
  'M0,-44 C26,-44 44,-30 48,-12 L55,-7 L49,-3 L56,3 L48,7 L53,12 L45,13 C38,28 22,38 0,38 C-22,38 -38,28 -45,13 L-53,12 L-48,7 L-56,3 L-49,-3 L-55,-7 L-48,-12 C-44,-30 -26,-44 0,-44 Z';
/** Forehead M: five tapered stripes */
const M_STRIPES =
  'M1,-45 C4.6,-38 4.6,-32 2,-24 C-.4,-32 -1.6,-38 1,-45 Z M-9,-43 C-4.6,-37 -4.6,-31 -8,-24 C-9.6,-31 -10.6,-37 -9,-43 Z M11,-43 C13.6,-37 13.6,-31 11,-24 C8.6,-31 8.4,-37 11,-43 Z M-21,-37 C-15.6,-32 -14.6,-26 -17.6,-20 C-19.6,-26 -21.6,-32 -21,-37 Z M23,-37 C26,-32 26,-26 23,-20 C20.6,-26 20.6,-32 23,-37 Z';
const CHEEK_STRIPES =
  'M-56,-2 C-46,-4 -38,-2 -32,2 C-38,0 -46,0 -56,2 Z M-54,8 C-46,6 -40,8 -34,11 C-40,10 -46,10 -54,10 Z M56,-2 C47,-4 40,-2 35,2 C40,0 47,0 56,2 Z M54,8 C47,6 41,8 36,11 C41,10 47,10 54,10 Z';
const MUZZLE = 'M2,4 C14,4 23,12 21,22 C19,30 10,33 2,33 C-6,33 -16,30 -18,22 C-20,12 -10,4 2,4 Z';
const WHISKERS = 'M-16,18 C-30,16 -44,17 -60,21 M-16,22 C-30,22 -44,25 -58,30 M20,18 C34,16 48,17 62,20 M20,22 C34,22 46,25 60,29';

/** One cat eye (§ 2.5) centred on (cx, cy): almond sclera clipping the iris, slit pupil, speculars, lash. */
function catEye(cx: number, cy: number, flip: boolean, expr: MochaExpr): FigItem[] {
  const sx = flip ? -1 : 1;
  if (expr === 'happy' || expr === 'sleep') {
    const d =
      expr === 'happy'
        ? `M${cx - 10},${cy + 3} C${cx - 6},${cy - 7} ${cx + 6},${cy - 7} ${cx + 10},${cy + 3} C${cx + 5},${cy - 2.6} ${cx - 5},${cy - 2.6} ${cx - 10},${cy + 3} Z`
        : `M${cx - 10},${cy} C${cx - 5},${cy + 6} ${cx + 5},${cy + 6} ${cx + 10},${cy} C${cx + 5},${cy + 3} ${cx - 5},${cy + 3} ${cx - 10},${cy} Z`;
    return [{ raw: <path d={compactPath(d)} fill={ACCENTS.lash} /> }];
  }
  const smug = expr === 'smug';
  const round = expr === 'surprised' || expr === 'hunt';
  const E = `M${cx - 11},${cy + 1} C${cx - 9},${cy - 9} ${cx + 9},${cy - 10} ${cx + 11},${cy - 1} C${cx + 9},${cy + 9} ${cx - 8},${cy + 10} ${cx - 11},${cy + 1} Z`;
  const ix = cx + 0.6 * sx;
  const rays = [0.3, 0.8, 1.3, 1.8, 2.3, 2.8];
  const hy = smug ? cy - 1 : cy - 4;
  const lash = smug
    ? `M${cx - 12},${cy + 1} C${cx - 6},${cy - 3.6} ${cx + 6},${cy - 3.6} ${cx + 12},${cy - 0.6} L${cx + 12.6},${cy - 2.6} C${cx + 6},${cy - 6} ${cx - 6},${cy - 6} ${cx - 12.4},${cy - 1} Z`
    : `M${cx - 11.4},${cy + 1} C${cx - 9},${cy - 10} ${cx + 9},${cy - 11} ${cx + 12},${cy - 1.4} L${cx + 13.6},${cy - 3} C${cx + 9},${cy - 13.4} ${cx - 10},${cy - 12.6} ${cx - 12},${cy + 1} Z`;
  return [
    {
      // The sclera is a part only for its clip: the iris, pupil and lid shadow are cut to the almond
      d: E,
      mat: 'furCream',
      cel: false,
      sil: false,
      lw: 0,
      deep: <path d={E} fill={CAT.sclera} />,
      extra: (
        <>
          <circle cx={ix} cy={cy} r={9.6} fill={artUrl('irisCat')} stroke={CAT.irisRing} strokeWidth={0.9} />
          <ellipse cx={ix} cy={cy} rx={round ? 6 : 2.6} ry={round ? 6.6 : 7.4} fill={CAT.pupil} />
          <path d={compactPath(`M${cx - 12},${cy - 12} L${cx + 12},${cy - 12} L${cx + 12},${cy - 3} C${cx + 5},${cy - 7} ${cx - 5},${cy - 7} ${cx - 12},${cy - 3} Z`)} fill={CAT.lidShadow} opacity={0.45} />
          {smug && <path d={compactPath(`M${cx - 13},${cy - 14} L${cx + 13},${cy - 14} L${cx + 13},${cy - 1} C${cx + 6},${cy - 3} ${cx - 6},${cy - 3} ${cx - 13},${cy - 1} Z`)} fill={fur.base} />}
          <ellipse cx={cx - 3.6 * sx} cy={hy} rx={2.8} ry={3.4} fill={ACCENTS.white} />
        </>
      ),
    },
    {
      raw: <path d={rays.map((a) => `M${num(cx + 3 * Math.cos(a))},${num(cy + 5 * Math.sin(a))} L${num(cx + 8.4 * Math.cos(a))},${num(cy + 8.4 * Math.sin(a))}`).join(' ')} stroke={CAT.irisLight} strokeWidth={0.7} opacity={0.5} />,
      tier: 'portrait',
    },
    {
      raw: (
        <path
          d={compactPath(`M${cx - 6},${cy + 6} C${cx - 2},${cy + 9} ${cx + 4},${cy + 9} ${cx + 7},${cy + 5.6} C${cx + 3},${cy + 7} ${cx - 2},${cy + 7.2} ${cx - 6},${cy + 6} Z M${num(cx + 4 * sx - 1.5)},${cy + 4} a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 Z`)}
          fill={CAT.reflect}
        />
      ),
      tier: 'battle',
    },
    { raw: <path d={compactPath(lash)} fill={ACCENTS.lash} transform={flip && !smug ? `translate(${2 * cx} 0) scale(-1 1)` : undefined} /> },
    { raw: <path d={compactPath(`M${cx - 7},${cy + 9.4} C${cx - 2},${cy + 11} ${cx + 5},${cy + 10.4} ${cx + 9},${cy + 6.6}`)} stroke={fur.deep} strokeWidth={0.9} fill="none" strokeLinecap="round" />, tier: 'battle' },
  ];
}

const MOUTH_LINE = 'M3,17 L3,20 M-3,20 C-1,23.4 2,23.4 3,20 C4,23.4 7,23.4 9,20';
const MOUTHS: Record<MochaExpr, FigRaw[]> = {
  content: [{ raw: <path d={MOUTH_LINE} stroke={CAT.mouthLine} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /> }],
  hunt: [{ raw: <path d={MOUTH_LINE} stroke={CAT.mouthLine} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /> }],
  sleep: [{ raw: <path d={MOUTH_LINE} stroke={CAT.mouthLine} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /> }],
  // A lopsided smirk to go with the half-lidded eyes
  smug: [{ raw: <path d={compactPath("M3,17 L3,20 M-3,20 C-1,22.6 2,22.8 3,20 C4.6,23 8,22.6 10.4,18.6")} stroke={CAT.mouthLine} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /> }],
  happy: [{ raw: <path d={compactPath("M3,17 L3,20 M-4,20 C-2,25 2,25 3,20 C4,25 8,25 10,20 C8,27 -2,27 -4,20 Z")} fill={ACCENTS.mouth} stroke={CAT.mouthLine} strokeWidth={1} strokeLinejoin="round" /> }],
  surprised: [
    { raw: <path d={compactPath("M3,17 L3,19")} stroke={CAT.mouthLine} strokeWidth={1.2} /> },
    { raw: <ellipse cx={3} cy={23} rx={3.6} ry={4.2} fill={ACCENTS.mouth} stroke={CAT.mouthLine} strokeWidth={1} /> },
    { raw: <path d={compactPath("M-40,-40 l-3,-6 M-44,-32 l-6,-2 M44,-40 l3,-6 M48,-32 l6,-2")} stroke={CAT.mouthLine} strokeWidth={1.4} strokeLinecap="round" />, tier: 'battle' },
  ],
};

export type CatHeadPlacement = { readonly at: Vec; readonly scale: number; readonly origin: Vec; readonly tilt?: number };

/** Scale an eye about its own centre (the reference draws them 1.25× their authored size). */
const eyeGroup = (part: string, cx: number, cy: number, flip: boolean, expr: MochaExpr): FigGroup => ({
  part,
  origin: [cx, cy],
  transform: `translate(${cx} ${cy}) scale(1.25) translate(${-cx} ${-cy})`,
  items: catEye(cx, cy, flip, expr),
});

/** The head as a rig group (`mocha-head`), eyes and mouth as sub-groups. */
export function mochaHead(expr: MochaExpr, { at, scale, origin, tilt = 0 }: CatHeadPlacement): FigGroup {
  return {
    part: 'head',
    origin,
    transform: `translate(${at[0]} ${at[1]})${tilt ? ` rotate(${tilt})` : ''} scale(${scale})`,
    scale,
    items: [
      { d: EAR_L, mat: 'tabby', cel: false, lw: 1.3 },
      { d: EAR_R, mat: 'tabby', cel: false, lw: 1.3, deep: <path d={compactPath("M30,-56 C40,-48 44,-36 43,-18 L47,-18 C48,-38 46,-52 42,-62 Z")} fill={fur.deep} /> },
      {
        d: HEAD,
        mat: 'tabby',
        cel: false,
        lw: 1.3,
        deep: (
          <>
            <path d={compactPath("M22,-42 C44,-30 50,-6 42,14 C34,28 20,36 6,38 L70,50 L70,-50 Z")} fill={fur.cel} />
            <path d={compactPath("M40,6 C36,22 26,32 12,37 L70,50 Z")} fill={fur.deep} />
          </>
        ),
        extra: (
          <>
            <path d={compactPath(M_STRIPES)} fill={fur.stripe} stroke={fur.stripe} strokeWidth={0.8} />
            <path d={compactPath(CHEEK_STRIPES)} fill={fur.stripe} stroke={fur.stripe} strokeWidth={1.6} />
            <path d={compactPath("M-44,-14 C-46,-4 -45,6 -42,12")} stroke={CAT.furRim} strokeWidth={2.6} fill="none" strokeLinecap="round" />
          </>
        ),
        rim: 'M46,-10 C48,0 47,8 44,14',
      },
      // Inner ears over the head's edge, as drawn in the reference; tufts from the battle LOD up
      { raw: <path d={compactPath("M-40,-22 C-43,-36 -42,-48 -38,-55 C-31,-51 -25,-45 -21,-39 Z")} fill={CAT.earInner} /> },
      { raw: <path d={compactPath("M21,-39 C26,-46 32,-51 38,-54 C41,-46 41,-34 39,-22 Z")} fill={CAT.earInnerFar} /> },
      { raw: <path d={compactPath("M-36,-26 L-37,-40 M-31,-30 L-31,-42 M-27,-34 L-26,-42 M33,-28 L34,-40 M29,-32 L29,-42")} stroke={CAT.earTuft} strokeWidth={1} strokeLinecap="round" />, tier: 'battle' },
      { raw: <path d={compactPath(MUZZLE)} fill={MATERIALS.furCream.base} /> },
      { raw: <path d={compactPath("M14,8 C22,14 22,26 14,31 C18,24 18,16 14,8 Z")} fill={MATERIALS.furCream.cel} />, tier: 'battle' },
      { raw: <path d={compactPath("M-30,16m-7,0a7,3.6 0 1,0 14,0a7,3.6 0 1,0 -14,0M34,16m-6,0a6,3.4 0 1,0 12,0a6,3.4 0 1,0 -12,0")} fill={CAT.blush} opacity={0.35} />, tier: 'battle' },
      { raw: <path d={compactPath("M-2,12 C0,10 6,10 8,12 C7,15 4,17 3,17 C2,17 -1,15 -2,12 Z")} fill={CAT.nose} stroke={CAT.noseLine} strokeWidth={0.8} /> },
      { raw: <path d={compactPath("M0,12 C1.4,11.4 3.4,11.4 4.4,11.8")} stroke={ACCENTS.white} strokeWidth={0.8} strokeLinecap="round" />, tier: 'battle' },
      { raw: <path d={compactPath(WHISKERS)} stroke={CAT.whisker} strokeWidth={0.8} fill="none" strokeLinecap="round" /> },
    ],
    children: [
      { part: 'eyes', origin: [1, -5], items: [], children: [eyeGroup('eye-near', -19, -5, false, expr), eyeGroup('eye-far', 21, -5, true, expr)] },
      { part: 'mouth', origin: [3, 20], items: MOUTHS[expr] },
    ],
  };
}
