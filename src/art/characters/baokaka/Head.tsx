import { artUrl } from '../../defs';
import type { FigGroup, FigRaw } from '../../Fig';
import { compactPath, num, type Vec } from '../../geom';
import { ACCENTS, MATERIALS, RIM } from '../../palette';

/**
 * 寶咖咖's head (art direction § 2.5, § 5.1), ported from `head()` and `eye()` in
 * `docs/art/options/_gen/anime.py`, the head every pose of `_gen/anime2.py` uses. Authored at its
 * own origin, ~104u wide, light from the upper left; poses place it with `at`/`scale`.
 *
 * Expressions swap the eyes, brows and mouth groups, never the head (§ 2.5):
 *   happy (開心, default) · laugh (大笑) · teary (淚汪汪) · surprised (驚訝)
 * and two the battle actions use: wail (哇哇大哭: squeezed eyes, tears, mouth wide open) and
 * sleep (累倒了: eyes softly closed).
 */

export const BAOKAKA_EXPRS = ['happy', 'laugh', 'teary', 'surprised'] as const;
export type BaokakaExpr = (typeof BAOKAKA_EXPRS)[number] | 'wail' | 'sleep';

const HEAD = 'M0,-50 C30,-50 52,-30 52,-3 C52,22 37,44 0,46 C-37,44 -52,22 -52,-3 C-52,-30 -30,-50 0,-50 Z';
const HAIR_BACK = 'M-54,-4 C-58,-34 -34,-58 0,-58 C34,-58 58,-34 54,-4 C50,-24 30,-40 0,-40 C-30,-40 -50,-24 -54,-4 Z';
/** The anime fringe: pointed clumps (battle, portrait and icon). */
const FRINGE =
  'M-50,-6 C-52,-36 -30,-55 0,-55 C30,-55 52,-36 50,-8 Q47,-18 42,-22 Q38,-14 33,-9 Q32,-21 28,-25 Q24,-17 18,-12 Q17,-22 13,-27 Q9,-19 4,-14 Q4,-21 1,-25 Q-3,-14 -8,-7 Q-8,-18 -11,-25 Q-15,-17 -20,-12 Q-21,-21 -24,-25 Q-28,-16 -33,-10 Q-35,-18 -38,-22 Q-42,-14 -46,-8 Q-48,-7 -50,-6 Z';
/** The same fringe as three big clumps for the map LOD (§ 8.3: ≤ 3 hair clumps). */
const FRINGE_MAP = 'M-50,-6 C-52,-36 -30,-55 0,-55 C30,-55 52,-36 50,-8 Q44,-22 36,-26 Q28,-14 18,-10 Q12,-24 2,-28 Q-6,-14 -16,-8 Q-22,-22 -30,-26 Q-40,-16 -50,-6 Z';
/** Tapered separation strokes between the fringe's clumps. */
const CLUMPS = [[-20, -48, -24, -25], [-6, -50, -11, -25], [8, -50, 13, -27], [22, -46, 28, -25], [-34, -40, -38, -22], [34, -40, 42, -22]]
  .map(([x0, y0, x1, y1]) => `M${x0},${y0} Q${(x0 + x1) / 2 + 1.6},${(y0 + y1) / 2} ${x1},${y1} Q${(x0 + x1) / 2 - 0.4},${(y0 + y1) / 2} ${x0},${y0} Z`)
  .join(' ');
const AHOGE = 'M-2,-54 C-6,-65 2,-73 12,-71 C6,-69 3,-65 5,-59 C8,-63 14,-63 17,-59 C10,-59 6,-57 4,-53 Z';
const SIDE_L = 'M-50,-8 C-56,0 -55,10 -51,18 Q-49,8 -46,4 Q-47,0 -44,-4 Z';
const SIDE_R = 'M50,-10 C56,-2 55,8 51,16 Q50,6 47,2 Q47,-2 45,-6 Z';

/** The angel ring: a band following the skull with a jagged lower edge (§ 2.4). */
const ANGEL_RING = (() => {
  const zig = Array.from({ length: 17 }, (_, i) => 38 - i * 5)
    .map((x, i) => ` L${x},${(-38.5 + (i % 2) * 3.2 + Math.abs(x) * 0.1).toFixed(2)}`)
    .join('');
  return `M-42,-33 C-32,-44 -14,-48.5 0,-48.5 C16,-48.5 32,-44 40,-35${zig} Z`;
})();

/** A closed-eye arc as a tapered fill (laugh: arched up; sleep: hanging down). */
const arc = (cx: number, cy: number, up: boolean) =>
  up
    ? `M${cx - 9},${cy + 2} C${cx - 6},${cy - 7} ${cx + 6},${cy - 7} ${cx + 9},${cy + 2} C${cx + 5},${cy - 3.4} ${cx - 5},${cy - 3.4} ${cx - 9},${cy + 2} Z`
    : `M${cx - 9},${cy + 1} C${cx - 5},${cy + 7} ${cx + 5},${cy + 7} ${cx + 9},${cy + 1} C${cx + 5},${cy + 4} ${cx - 5},${cy + 4} ${cx - 9},${cy + 1} Z`;

/** One anime eye (§ 2.5) as LOD-gated layers. `flip` mirrors it for the right eye. */
function eyeItems(cx: number, cy: number, flip: boolean, expr: BaokakaExpr): FigRaw[] {
  const sx = flip ? -1 : 1;
  if (expr === 'laugh' || expr === 'sleep') return [{ raw: <path d={arc(cx, cy, expr === 'laugh')} fill={ACCENTS.lash} /> }];
  if (expr === 'wail') {
    // Squeezed shut (> <), tears streaming
    const [a, b] = [cx - 9 * sx, cx + 8 * sx];
    return [
      { raw: <path d={compactPath(`M${a},${cy - 4} Q${cx + 2 * sx},${cy - 1} ${b},${cy + 2} Q${cx + 2 * sx},${cy + 3.4} ${a},${cy + 7} Q${cx},${cy + 2.4} ${a},${cy - 4} Z`)} fill={ACCENTS.lash} /> },
      { raw: <path d={compactPath(`M${cx + 2 * sx},${cy + 6} C${cx + 3 * sx},${cy + 12} ${cx},${cy + 16} ${cx + 2 * sx},${cy + 24}`)} stroke={ACCENTS.tear} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.95} /> },
    ];
  }
  const surprised = expr === 'surprised';
  const teary = expr === 'teary';
  const [irx, iry] = surprised ? [6, 7.2] : [8.2, 9.6];
  const ix = cx + 0.6 * sx;
  const [ox, inner] = [cx + 9.6 * sx, cx - 9.6 * sx];
  const rays = [0.35, 0.9, 1.4, 1.9, 2.4, 2.8];
  return [
    { raw: <path d={compactPath(`M${cx - 9.6},${cy} C${cx - 9.6},${cy - 10} ${cx + 9.6},${cy - 10} ${cx + 9.6},${cy} C${cx + 9.6},${cy + 10.6} ${cx - 9.6},${cy + 10.6} ${cx - 9.6},${cy} Z`)} fill={ACCENTS.white} /> },
    { raw: <ellipse cx={ix} cy={cy + 1} rx={irx} ry={iry} fill={artUrl('irisBrown')} stroke={ACCENTS.irisRing} strokeWidth={0.9} /> },
    { raw: <path d={compactPath(`M${cx - 8},${cy - 3} C${cx - 6},${cy - 9} ${cx + 7},${cy - 9} ${cx + 9},${cy - 3} C${cx + 5},${cy - 6} ${cx - 4},${cy - 6} ${cx - 8},${cy - 3} Z`)} fill={ACCENTS.lidShadow} opacity={0.55} />, tier: 'battle' },
    { raw: <ellipse cx={ix} cy={cy + 1.6} rx={surprised ? 2.2 : 3.4} ry={surprised ? 3 : 4.6} fill={ACCENTS.pupil} /> },
    {
      raw: (
        <path
          d={rays.map((a) => `M${num(ix + 3.6 * Math.cos(a))},${num(cy + 1.6 + 4.6 * Math.sin(a))} L${num(ix + 7.4 * Math.cos(a))},${num(cy + 1 + 9 * Math.sin(a))}`).join(' ')}
          stroke={ACCENTS.irisLight}
          strokeWidth={0.7}
          opacity={0.55}
        />
      ),
      tier: 'portrait',
    },
    { raw: <path d={compactPath(`M${cx - 5.6},${cy + 6.4} C${cx - 3},${cy + 9.4} ${cx + 4},${cy + 9.4} ${cx + 6.6},${cy + 6.2} C${cx + 3},${cy + 7.6} ${cx - 2.4},${cy + 7.8} ${cx - 5.6},${cy + 6.4} Z`)} fill={ACCENTS.irisLight} opacity={0.95} />, tier: 'battle' },
    ...(teary
      ? ([
          // Welling up: a pale line along the lower lid and bigger, wetter highlights
          { raw: <path d={compactPath(`M${cx - 9},${cy + 7} C${cx - 4},${cy + 11} ${cx + 5},${cy + 11} ${cx + 9.4},${cy + 6.6}`)} stroke={ACCENTS.tear} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.9} /> },
          { raw: <ellipse cx={cx - 3.2 * sx} cy={cy - 3} rx={3.8} ry={4.6} fill={ACCENTS.white} /> },
          {
            raw: <path d={compactPath(`M${cx + 3.6 * sx - 2.2},${cy + 4.4}a2.2,2.2 0 1,0 4.4,0a2.2,2.2 0 1,0 -4.4,0M${cx - 4 * sx - 1.2},${cy + 4}a1.2,1.2 0 1,0 2.4,0a1.2,1.2 0 1,0 -2.4,0`)} fill={ACCENTS.white} />,
            tier: 'battle',
          },
        ] satisfies FigRaw[])
      : ([
          // The big upper specular is the one highlight the map keeps
          { raw: <ellipse cx={cx - 3.4 * sx} cy={cy - 3.2} rx={3.2} ry={4} transform={`rotate(${-20 * sx} ${cx - 3.4 * sx} ${cy - 3.2})`} fill={ACCENTS.white} /> },
          { raw: <circle cx={cx + 3.8 * sx} cy={cy + 4.2} r={1.6} fill={ACCENTS.white} />, tier: 'battle' },
          { raw: <circle cx={cx + 1 * sx} cy={cy - 5.6} r={0.8} fill={ACCENTS.white} />, tier: 'portrait' },
        ] satisfies FigRaw[])),
    // Tapered upper lash, thicker at the outer corner, with a flick
    { raw: <path d={compactPath(`M${inner},${cy + 0.4} C${inner + 1 * sx},${cy - 9.4} ${ox - 2 * sx},${cy - 10.6} ${ox + 1.4 * sx},${cy - 3.4} L${ox + 2.6 * sx},${cy - 4.6} C${ox + 0.6 * sx},${cy - 12.4} ${inner - 0.4 * sx},${cy - 12} ${inner - 0.6 * sx},${cy + 0.4} Z`)} fill={ACCENTS.lash} /> },
    { raw: <path d={compactPath(`M${cx + 2 * sx},${cy + 10.6} C${cx + 5 * sx},${cy + 10.4} ${cx + 7.6 * sx},${cy + 8.6} ${cx + 8.8 * sx},${cy + 6.4}`)} stroke={MATERIALS.skin.line} strokeWidth={0.9} fill="none" strokeLinecap="round" />, tier: 'battle' },
  ];
}

const OPEN = (d: string, tongue: string): FigRaw[] => [
  { raw: <path d={compactPath(d)} fill={ACCENTS.mouth} stroke={ACCENTS.mouthLine} strokeWidth={1} strokeLinejoin="round" /> },
  { raw: <path d={tongue} fill={ACCENTS.tongue} />, tier: 'battle' },
];

const MOUTHS: Record<BaokakaExpr, FigRaw[]> = {
  happy: [
    ...OPEN('M-7,27 C-6,36 10,36 11,27 C6,29 -2,29 -7,27 Z', 'M-3,32.6 C0,35 6,35 8,32.4 C5,31 0,31 -3,32.6 Z'),
    { raw: <path d={compactPath("M-5,27.6 C-1,29 5,29 9,27.6")} stroke={ACCENTS.white} strokeWidth={1.2} opacity={0.85} fill="none" />, tier: 'portrait' },
  ],
  laugh: [
    ...OPEN('M-10,25 C-9,40 13,40 14,25 C8,28 -4,28 -10,25 Z', 'M-5,33 C-1,38 8,38 10,33 C6,31 -1,31 -5,33 Z'),
    { raw: <path d={compactPath("M-34,8 l-6,-3 M-34,12 l-7,1 M38,8 l6,-3 M38,12 l7,1")} stroke={ACCENTS.markRed} strokeWidth={1.2} strokeLinecap="round" />, tier: 'battle' },
  ],
  teary: [
    { raw: <path d={compactPath("M-6,30 C-3,27 0,28 2,30 C4,28 7,27 10,30")} stroke={ACCENTS.mouthLine} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> },
    { raw: <path d={compactPath("M-38,20 C-39,26 -36,30 -33,28 C-31,26 -34,22 -38,20 Z")} fill={ACCENTS.tear} stroke={ACCENTS.tearLine} strokeWidth={0.8} />, tier: 'battle' },
  ],
  surprised: [
    ...OPEN('M-2.6,31a4.6,5.6 0 1,0 9.2,0a4.6,5.6 0 1,0 -9.2,0Z', 'M-.6,33.4a2.6,2 0 1,0 5.2,0a2.6,2 0 1,0 -5.2,0Z'),
    { raw: <path d={compactPath("M-44,-28 l-4,-6 M-48,-20 l-7,-2 M48,-28 l4,-6 M52,-20 l7,-2")} stroke={ACCENTS.mouthLine} strokeWidth={1.4} strokeLinecap="round" />, tier: 'battle' },
  ],
  // 哇哇大哭: the mouth wide open (a bigger laugh mouth, squarer at the bottom)
  wail: OPEN('M-11,23 C-13,43 15,43 15,23 C9,20 -5,20 -11,23 Z', 'M-6,34 C-2,40 8,40 11,34 C6,31 -1,31 -6,34 Z'),
  sleep: [{ raw: <path d={compactPath("M-.4,30a2.6,2.2 0 1,0 5.2,0a2.6,2.2 0 1,0 -5.2,0Z")} fill={ACCENTS.mouth} stroke={ACCENTS.mouthLine} strokeWidth={0.9} /> }],
};

const BROW_CALM = 'M-28,-13 C-24,-16 -18,-17 -13,-16 M15,-16 C20,-17 26,-16 30,-13';
const BROW_WORRY = 'M-28,-10 C-24,-14 -18,-15 -13,-14 M15,-14 C20,-15 26,-14 30,-10';
const BROWS: Record<BaokakaExpr, string> = {
  happy: BROW_CALM,
  laugh: BROW_CALM,
  teary: BROW_WORRY,
  surprised: 'M-29,-17 C-25,-21 -18,-22 -12,-20 M14,-20 C20,-22 27,-21 31,-17',
  wail: 'M-28,-9 C-24,-15 -18,-17 -12,-17 M14,-17 C20,-17 26,-15 30,-9',
  sleep: BROW_CALM,
};

export type HeadPlacement = {
  /** Where the head's origin sits on the canvas */
  readonly at: Vec;
  readonly scale: number;
  /** The joint the head turns around (the neck) */
  readonly origin: Vec;
  /** A static tilt in degrees (a wail throws the head back) */
  readonly tilt?: number;
};

/** The head as a rig group (`{char}-head`), with eyes, mouth and front hair as sub-groups. */
export function baokakaHead(expr: BaokakaExpr, { at, scale, origin, tilt = 0 }: HeadPlacement): FigGroup {
  const skin = MATERIALS.skin;
  const hair = MATERIALS.hair;
  return {
    part: 'head',
    origin,
    transform: `translate(${at[0]} ${at[1]})${tilt ? ` rotate(${tilt})` : ''} scale(${scale})`,
    scale,
    items: [
      { d: HAIR_BACK, mat: 'hair', cel: [3, 3], lw: 1.3 },
      { d: 'M-47,4 C-58,-2 -60,16 -48,20 C-46,14 -46,9 -47,4 Z', mat: 'skin', cel: false, lw: 1.3 },
      { d: 'M47,4 C58,-2 60,16 48,20 C46,14 46,9 47,4 Z', mat: 'skin', cel: [1.4, 1.2], lw: 1.3 },
      {
        d: HEAD,
        mat: 'skin',
        cel: false,
        lw: 1.3,
        // Hand-placed cel (§ 2.4): the far cheek, the fringe's cast shadow, occlusion under the jaw
        deep: (
          <>
            <path d={compactPath("M30,-40 C50,-20 52,10 36,34 C28,42 14,46 4,46 L60,60 L60,-50 Z")} fill={skin.cel} />
            <path d={compactPath(FRINGE)} fill={skin.cel} transform="translate(2 5)" />
            <path d={compactPath("M44,20 C40,34 28,42 12,45 L60,60 Z")} fill={skin.deep} />
          </>
        ),
        extra: <path d={compactPath("M-46,10 C-46,24 -40,32 -30,38")} stroke={RIM.warm} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.8} />,
        rim: 'M50,-14 C53,0 51,16 44,28',
      },
      // Blush: the shared gradient, plus three hatch strokes in the portrait
      { raw: [-30, 32].map((bx) => <ellipse key={bx} cx={bx} cy={20} rx={13} ry={7} fill={artUrl('blush')} />) },
      {
        raw: <path d={[-30, 32].flatMap((bx) => [0, 1, 2].map((k) => `M${bx - 6 + k * 4},23 l2.4,-5`)).join(' ')} stroke={ACCENTS.blushHatch} strokeWidth={1} strokeLinecap="round" opacity={0.8} />,
        tier: 'portrait',
      },
      { raw: <path d={compactPath(BROWS[expr])} stroke={ACCENTS.brow} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.9} />, tier: 'battle' },
      { raw: <path d={compactPath("M1,20 C2,21.4 3.6,21.4 4.4,20.4")} stroke={ACCENTS.nose} strokeWidth={1.2} strokeLinecap="round" fill="none" />, tier: 'battle' },
    ],
    children: [
      { part: 'eyes', origin: [0, 8], items: [...eyeItems(-20, 8, false, expr), ...eyeItems(22, 8, true, expr)] },
      { part: 'mouth', origin: [2, 30], items: MOUTHS[expr] },
      {
        part: 'hair-front',
        origin: [0, -40],
        items: [
          { d: SIDE_L, mat: 'hair', cel: false, lw: 1.3 },
          { d: SIDE_R, mat: 'hair', cel: false, lw: 1.3 },
          { d: AHOGE, mat: 'hair', cel: false, lw: 1.3 },
          {
            d: FRINGE,
            mat: 'hair',
            cel: false,
            lw: 1.3,
            only: ['portrait', 'battle', 'icon'],
            deep: (
              <>
                <path d={compactPath("M16,-56 C38,-50 54,-32 50,-6 L64,-6 L64,-64 Z")} fill={hair.cel} />
                <path d={compactPath("M30,-30 C34,-26 38,-22 42,-20 L50,-8 L50,-30 Z")} fill={hair.deep} opacity={0.6} />
                <path d={compactPath(CLUMPS)} fill={hair.deep} />
              </>
            ),
            extra: (
              <>
                <path d={compactPath(ANGEL_RING)} fill={hair.ring} />
                <path d={compactPath("M-32,-40 C-27,-43.4 -22,-45 -17,-46 M-7,-47 C-3,-47.4 1,-47.4 5,-47.2 M15,-46 C20,-45 24,-43.4 28,-41")} stroke={hair.ringLight} strokeWidth={1.4} fill="none" strokeLinecap="round" />
              </>
            ),
          },
          // Map: three big clumps, the shade band and a plain ring
          {
            d: FRINGE_MAP,
            mat: 'hair',
            cel: false,
            lw: 1.3,
            only: ['map'],
            deep: <path d={compactPath("M16,-56 C38,-50 54,-32 50,-6 L64,-6 L64,-64 Z")} fill={hair.cel} />,
            extra: <path d={compactPath("M-36,-38 C-24,-46 -8,-48.5 4,-48.5 C18,-48.5 30,-44 36,-38 C24,-40 -20,-40 -36,-38 Z")} fill={hair.ring} />,
          },
          { raw: <path d={compactPath("M2,-57 C1,-63 5,-68 10,-69")} stroke={hair.ringLight} strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.7} />, tier: 'portrait' },
        ],
      },
    ],
  };
}
