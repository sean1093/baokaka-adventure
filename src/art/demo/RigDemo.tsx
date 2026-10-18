import { artUrl } from '../defs';
import { Fig, SpriteSvg, type FigGroup, type FigItem, type FigRaw } from '../Fig';
import { blob, compactPath, crease, footie, hand, limb, num, star4, type HandPose, type Vec } from '../geom';
import { ACCENTS, MATERIALS, RIM, type Material, type MaterialName } from '../palette';
import { defineSprite, type Bones, type Skeleton, type SpriteProps } from '../sprite';

/**
 * 測試寶寶, the rig test figure: the anatomy sheet's "first steps" pose (`bk_stand` in
 * `docs/art/options/_gen/anime2.py`) built with the option D rig, so `geom`, `Fig`, `ArtDefs`, the
 * LOD rules and the rig classes can be checked before the real heroes land (#16). It is not game
 * art and not in `SPRITES`; the art lab's Rig section and the sprite lint tests use it.
 *
 * Expressions: `happy` (default), `laugh`, `surprised`.
 */

const CHAR = 'rigdemo';

export type DemoJoint =
  | 'head' | 'neck' | 'shL' | 'shR' | 'elL' | 'elR' | 'wrL' | 'wrR'
  | 'pel' | 'hipL' | 'hipR' | 'knL' | 'knR' | 'anL' | 'anR';

/** The standing pose's joints on the 200u canvas (L = near side, R = far side). */
export const DEMO_SKELETON: Skeleton<DemoJoint> = {
  head: [100, 48], neck: [100, 76], shL: [83, 88], shR: [117, 87], elL: [71, 102], elR: [131, 98], wrL: [64, 113], wrR: [141, 106],
  pel: [100, 128], hipL: [91, 130], hipR: [110, 130], knL: [86, 152], knR: [115, 151], anL: [84, 172], anR: [118, 171],
};

export const DEMO_BONES: Bones<DemoJoint> = [
  ['head', 'neck'], ['neck', 'shL'], ['neck', 'shR'], ['shL', 'elL'], ['elL', 'wrL'], ['shR', 'elR'], ['elR', 'wrR'],
  ['neck', 'pel'], ['pel', 'hipL'], ['pel', 'hipR'], ['hipL', 'knL'], ['knL', 'anL'], ['hipR', 'knR'], ['knR', 'anR'],
];

const J = DEMO_SKELETON;

/** Head scale: the head is authored ~104u wide at its own origin; 0.56 makes the figure 3.3 heads tall. */
const HEAD_SCALE = 0.56;

/** The icon LOD's head crop on the canvas. */
const ICON_BOX = [62, 4, 76, 76] as const;

type DemoExpr = 'happy' | 'laugh' | 'surprised';

// ---- small builders ---------------------------------------------------------------------------

/** A tapered crease filled with a material's line tint. */
const fold = (p0: Vec, p1: Vec, w: number, mat: MaterialName, tier: FigRaw['tier'] = 'battle'): FigRaw => ({
  raw: <path d={compactPath(crease(p0, p1, w))} fill={(MATERIALS[mat] as Material).line ?? MATERIALS[mat].cel} />,
  tier,
});

/** A hand: one contour, finger splits from the battle LOD up (a mitten on the map). */
function handItems(wrist: Vec, angle: number, scale: number, pose: HandPose): FigItem[] {
  const shape = hand(wrist, angle, scale, pose);
  return [
    { d: shape.d, mat: 'skin', cel: [1.3, 1.1], lw: 1 },
    { raw: <path d={compactPath(shape.creases.join(' '))} fill={MATERIALS.skin.line} />, tier: 'battle' },
  ];
}

/** A footie foot in side view: the foot, its grip strip and the toe crease. */
function footItems(heel: Vec, toe: Vec, w: number, mat: 'pajama' | 'pajamaFar', up: 1 | -1): FigItem[] {
  const shape = footie(heel, toe, w, { up });
  return [
    { d: shape.d, mat, cel: [1.6, 1.4] },
    { raw: <path d={compactPath(shape.strip!)} stroke={ACCENTS.soleStrip} strokeWidth={2.2} fill="none" strokeLinecap="round" />, tier: 'battle' },
    { raw: <path d={compactPath(shape.crease!)} fill={MATERIALS[mat].line} />, tier: 'portrait' },
  ];
}

/** The bear patch on the chest (a print, so no contour pass). */
const BearPatch = ({ x, y, s }: { x: number; y: number; s: number }) => {
  const bear = MATERIALS.bearPatch;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={-4.4} cy={-4.6} r={2.6} fill={bear.cel} stroke={bear.line} strokeWidth={0.8} />
      <circle cx={4.4} cy={-4.6} r={2.6} fill={bear.cel} stroke={bear.line} strokeWidth={0.8} />
      <circle r={6.2} fill={bear.base} stroke={bear.line} strokeWidth={0.9} />
      <path d="M2,-5.6 C6,-3 6.6,2 3.4,5.4 C4.6,1.6 4.4,-2.4 2,-5.6 Z" fill={bear.cel} />
      <ellipse cy={2} rx={3.2} ry={2.4} fill={MATERIALS.cream.base} />
      <circle cx={-2.2} cy={-1.2} r={0.9} fill={MATERIALS.hair.line} />
      <circle cx={2.2} cy={-1.2} r={0.9} fill={MATERIALS.hair.line} />
      <ellipse cy={1.3} rx={1.1} ry={0.8} fill={MATERIALS.hair.line} />
    </g>
  );
};

// ---- head (authored at its own origin, ~104u wide; light from the upper left) ----------------

const HEAD = 'M0,-50 C30,-50 52,-30 52,-3 C52,22 37,44 0,46 C-37,44 -52,22 -52,-3 C-52,-30 -30,-50 0,-50 Z';
const HAIR_BACK = 'M-54,-4 C-58,-34 -34,-58 0,-58 C34,-58 58,-34 54,-4 C50,-24 30,-40 0,-40 C-30,-40 -50,-24 -54,-4 Z';
/** The anime fringe: pointed clumps (battle and portrait). */
const FRINGE =
  'M-50,-6 C-52,-36 -30,-55 0,-55 C30,-55 52,-36 50,-8 Q47,-18 42,-22 Q38,-14 33,-9 Q32,-21 28,-25 Q24,-17 18,-12 Q17,-22 13,-27 Q9,-19 4,-14 Q4,-21 1,-25 Q-3,-14 -8,-7 Q-8,-18 -11,-25 Q-15,-17 -20,-12 Q-21,-21 -24,-25 Q-28,-16 -33,-10 Q-35,-18 -38,-22 Q-42,-14 -46,-8 Q-48,-7 -50,-6 Z';
/** The same fringe as three big clumps, for the map LOD (§ 8.3: ≤ 3 hair clumps). */
const FRINGE_MAP = 'M-50,-6 C-52,-36 -30,-55 0,-55 C30,-55 52,-36 50,-8 Q44,-22 36,-26 Q28,-14 18,-10 Q12,-24 2,-28 Q-6,-14 -16,-8 Q-22,-22 -30,-26 Q-40,-16 -50,-6 Z';
/** Tapered separation strokes between the fringe's clumps. */
const CLUMPS = [[-20, -48, -24, -25], [-6, -50, -11, -25], [8, -50, 13, -27], [22, -46, 28, -25], [-34, -40, -38, -22], [34, -40, 42, -22]]
  .map(([x0, y0, x1, y1]) => `M${x0},${y0} Q${(x0 + x1) / 2 + 1.6},${(y0 + y1) / 2} ${x1},${y1} Q${(x0 + x1) / 2 - 0.4},${(y0 + y1) / 2} ${x0},${y0} Z`)
  .join(' ');
const AHOGE = 'M-2,-54 C-6,-65 2,-73 12,-71 C6,-69 3,-65 5,-59 C8,-63 14,-63 17,-59 C10,-59 6,-57 4,-53 Z';

/** The angel ring: a band following the skull with a jagged lower edge (§ 2.4). */
const ANGEL_RING = (() => {
  const zig = Array.from({ length: 17 }, (_, i) => 38 - i * 5)
    .map((x, i) => ` L${x},${(-38.5 + (i % 2) * 3.2 + Math.abs(x) * 0.1).toFixed(2)}`)
    .join('');
  return `M-42,-33 C-32,-44 -14,-48.5 0,-48.5 C16,-48.5 32,-44 40,-35${zig} Z`;
})();

/** One anime eye (§ 2.5) as LOD-gated layers. `flip` mirrors the highlights for the right eye. */
function eyeItems(cx: number, cy: number, flip: boolean, expr: DemoExpr): FigRaw[] {
  const sx = flip ? -1 : 1;
  if (expr === 'laugh') {
    return [{ raw: <path d={`M${cx - 9},${cy + 2} C${cx - 6},${cy - 7} ${cx + 6},${cy - 7} ${cx + 9},${cy + 2} C${cx + 5},${cy - 3.4} ${cx - 5},${cy - 3.4} ${cx - 9},${cy + 2} Z`} fill={ACCENTS.lash} /> }];
  }
  const surprised = expr === 'surprised';
  const [irx, iry] = surprised ? [6, 7.2] : [8.2, 9.6];
  const ix = cx + 0.6 * sx;
  const [ox, inner] = [cx + 9.6 * sx, cx - 9.6 * sx];
  const rays = [0.35, 0.9, 1.4, 1.9, 2.4, 2.8];
  return [
    { raw: <path d={`M${cx - 9.6},${cy} C${cx - 9.6},${cy - 10} ${cx + 9.6},${cy - 10} ${cx + 9.6},${cy} C${cx + 9.6},${cy + 10.6} ${cx - 9.6},${cy + 10.6} ${cx - 9.6},${cy} Z`} fill={ACCENTS.white} /> },
    { raw: <ellipse cx={ix} cy={cy + 1} rx={irx} ry={iry} fill={artUrl('irisBrown')} stroke={ACCENTS.irisRing} strokeWidth={0.9} /> },
    { raw: <path d={`M${cx - 8},${cy - 3} C${cx - 6},${cy - 9} ${cx + 7},${cy - 9} ${cx + 9},${cy - 3} C${cx + 5},${cy - 6} ${cx - 4},${cy - 6} ${cx - 8},${cy - 3} Z`} fill={ACCENTS.lidShadow} opacity={0.55} />, tier: 'battle' },
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
    { raw: <path d={`M${cx - 5.6},${cy + 6.4} C${cx - 3},${cy + 9.4} ${cx + 4},${cy + 9.4} ${cx + 6.6},${cy + 6.2} C${cx + 3},${cy + 7.6} ${cx - 2.4},${cy + 7.8} ${cx - 5.6},${cy + 6.4} Z`} fill={ACCENTS.irisLight} opacity={0.95} />, tier: 'battle' },
    // The big upper specular is the one highlight the map keeps
    { raw: <ellipse cx={cx - 3.4 * sx} cy={cy - 3.2} rx={3.2} ry={4} transform={`rotate(${-20 * sx} ${cx - 3.4 * sx} ${cy - 3.2})`} fill={ACCENTS.white} /> },
    { raw: <circle cx={cx + 3.8 * sx} cy={cy + 4.2} r={1.6} fill={ACCENTS.white} />, tier: 'battle' },
    { raw: <circle cx={cx + 1 * sx} cy={cy - 5.6} r={0.8} fill={ACCENTS.white} />, tier: 'portrait' },
    // Tapered upper lash, thicker at the outer corner, with a flick
    { raw: <path d={`M${inner},${cy + 0.4} C${inner + 1 * sx},${cy - 9.4} ${ox - 2 * sx},${cy - 10.6} ${ox + 1.4 * sx},${cy - 3.4} L${ox + 2.6 * sx},${cy - 4.6} C${ox + 0.6 * sx},${cy - 12.4} ${inner - 0.4 * sx},${cy - 12} ${inner - 0.6 * sx},${cy + 0.4} Z`} fill={ACCENTS.lash} /> },
    { raw: <path d={`M${cx + 2 * sx},${cy + 10.6} C${cx + 5 * sx},${cy + 10.4} ${cx + 7.6 * sx},${cy + 8.6} ${cx + 8.8 * sx},${cy + 6.4}`} stroke={MATERIALS.skin.line} strokeWidth={0.9} fill="none" strokeLinecap="round" />, tier: 'battle' },
  ];
}

const MOUTHS: Record<DemoExpr, FigRaw[]> = {
  happy: [
    { raw: <path d="M-7,27 C-6,36 10,36 11,27 C6,29 -2,29 -7,27 Z" fill={ACCENTS.mouth} stroke={ACCENTS.mouthLine} strokeWidth={1} strokeLinejoin="round" /> },
    { raw: <path d="M-3,32.6 C0,35 6,35 8,32.4 C5,31 0,31 -3,32.6 Z" fill={ACCENTS.tongue} />, tier: 'battle' },
  ],
  laugh: [
    { raw: <path d="M-10,25 C-9,40 13,40 14,25 C8,28 -4,28 -10,25 Z" fill={ACCENTS.mouth} stroke={ACCENTS.mouthLine} strokeWidth={1} strokeLinejoin="round" /> },
    { raw: <path d="M-5,33 C-1,38 8,38 10,33 C6,31 -1,31 -5,33 Z" fill={ACCENTS.tongue} />, tier: 'battle' },
  ],
  surprised: [
    { raw: <ellipse cx={2} cy={31} rx={4.6} ry={5.6} fill={ACCENTS.mouth} stroke={ACCENTS.mouthLine} strokeWidth={1} /> },
    { raw: <ellipse cx={2} cy={33.4} rx={2.6} ry={2} fill={ACCENTS.tongue} />, tier: 'battle' },
  ],
};

const BROWS: Record<DemoExpr, string> = {
  happy: 'M-28,-13 C-24,-16 -18,-17 -13,-16 M15,-16 C20,-17 26,-16 30,-13',
  laugh: 'M-28,-13 C-24,-16 -18,-17 -13,-16 M15,-16 C20,-17 26,-16 30,-13',
  surprised: 'M-29,-17 C-25,-21 -18,-22 -12,-20 M14,-20 C20,-22 27,-21 31,-17',
};

function headGroup(expr: DemoExpr): FigGroup {
  const skin = MATERIALS.skin;
  const hair = MATERIALS.hair;
  return {
    part: 'head',
    origin: J.neck,
    transform: `translate(${J.head[0]} ${J.head[1]}) scale(${HEAD_SCALE})`,
    scale: HEAD_SCALE,
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
            <path d="M30,-40 C50,-20 52,10 36,34 C28,42 14,46 4,46 L60,60 L60,-50 Z" fill={skin.cel} />
            <path d={FRINGE} fill={skin.cel} transform="translate(2 5)" />
            <path d="M44,20 C40,34 28,42 12,45 L60,60 Z" fill={skin.deep} />
          </>
        ),
        extra: <path d="M-46,10 C-46,24 -40,32 -30,38" stroke={RIM.warm} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.8} />,
        rim: 'M50,-14 C53,0 51,16 44,28',
      },
      // Blush: the shared gradient, plus three hatch strokes in the portrait
      { raw: [-30, 32].map((bx) => <ellipse key={bx} cx={bx} cy={20} rx={13} ry={7} fill={artUrl('blush')} />) },
      {
        raw: [-30, 32].map((bx) => (
          <path key={bx} d={[0, 1, 2].map((k) => `M${bx - 6 + k * 4},23 l2.4,-5`).join(' ')} stroke={ACCENTS.blushHatch} strokeWidth={1} strokeLinecap="round" opacity={0.8} />
        )),
        tier: 'portrait',
      },
      { raw: <path d={BROWS[expr]} stroke={ACCENTS.brow} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.9} />, tier: 'battle' },
      { raw: <path d="M1,20 C2,21.4 3.6,21.4 4.4,20.4" stroke={ACCENTS.nose} strokeWidth={1.2} strokeLinecap="round" fill="none" />, tier: 'battle' },
    ],
    children: [
      { part: 'eyes', origin: [0, 8], items: [...eyeItems(-20, 8, false, expr), ...eyeItems(22, 8, true, expr)] },
      { part: 'mouth', origin: [2, 30], items: MOUTHS[expr] },
      {
        part: 'hair-front',
        origin: [0, -40],
        items: [
          { d: 'M-50,-8 C-56,0 -55,10 -51,18 Q-49,8 -46,4 Q-47,0 -44,-4 Z', mat: 'hair', cel: false, lw: 1.3 },
          { d: 'M50,-10 C56,-2 55,8 51,16 Q50,6 47,2 Q47,-2 45,-6 Z', mat: 'hair', cel: false, lw: 1.3 },
          { d: AHOGE, mat: 'hair', cel: false, lw: 1.3 },
          {
            d: FRINGE,
            mat: 'hair',
            cel: false,
            lw: 1.3,
            only: ['portrait', 'battle', 'icon'],
            deep: (
              <>
                <path d="M16,-56 C38,-50 54,-32 50,-6 L64,-6 L64,-64 Z" fill={hair.cel} />
                <path d="M30,-30 C34,-26 38,-22 42,-20 L50,-8 L50,-30 Z" fill={hair.deep} opacity={0.6} />
                <path d={CLUMPS} fill={hair.deep} />
              </>
            ),
            extra: (
              <>
                <path d={ANGEL_RING} fill={hair.ring} />
                <path d="M-32,-40 C-27,-43.4 -22,-45 -17,-46 M-7,-47 C-3,-47.4 1,-47.4 5,-47.2 M15,-46 C20,-45 24,-43.4 28,-41" stroke={hair.ringLight} strokeWidth={1.4} fill="none" strokeLinecap="round" />
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
            deep: <path d="M16,-56 C38,-50 54,-32 50,-6 L64,-6 L64,-64 Z" fill={hair.cel} />,
            extra: <path d="M-36,-38 C-24,-46 -8,-48.5 4,-48.5 C18,-48.5 30,-44 36,-38 C24,-40 -20,-40 -36,-38 Z" fill={hair.ring} />,
          },
          { raw: <path d="M2,-57 C1,-63 5,-68 10,-69" stroke={hair.ringLight} strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.7} />, tier: 'portrait' },
        ],
      },
    ],
  };
}

// ---- body ------------------------------------------------------------------------------------

const TORSO = blob([[100, 77], [110, 78.6], [119, 83], [124, 92], [126, 106], [127, 118], [122, 130], [111, 138], [100, 140], [89, 138], [78, 130], [73, 118], [74, 106], [76, 92], [81, 83], [90, 78.6]]);
const COLLAR = 'M86,77 C92,83 108,83 114,77 C117,79 116,84 112,85.6 C104,88.6 96,88.6 88,85.6 C84,84 83,79 86,77 Z';
const STARS: readonly (readonly [number, number, number])[] = [[85, 102, 2.6], [89, 126, 2.2], [118, 122, 2.4], [114, 100, 2]];

function demoGroups(expr: DemoExpr): FigGroup[] {
  return [
    {
      part: 'arm-far',
      origin: J.shR,
      items: [
        { d: limb([J.shR, J.elR, J.wrR], [6.8, 5.8, 4.8]), mat: 'pajamaFar', cel: [2, 1.8] },
        fold([127, 94], [130, 100], 0.9, 'pajamaFar'),
        ...handItems([J.wrR[0] + 1.4, J.wrR[1] + 0.4], -14, 1.15, 'open'),
      ],
    },
    {
      part: 'leg-far',
      origin: J.hipR,
      items: [
        { d: limb([J.hipR, J.knR, [117, 162], J.anR], [12, 8.8, 8.2, 5.8]), mat: 'pajamaFar', cel: [2.6, 2] },
        fold([111, 150], [119, 149], 0.9, 'pajamaFar'),
        ...footItems([116, 178], [132, 184], 6.8, 'pajamaFar', 1),
      ],
    },
    {
      part: 'leg-near',
      origin: J.hipL,
      items: [
        { d: limb([J.hipL, J.knL, [84, 162], J.anL], [12.4, 9, 8.4, 6]), mat: 'pajama', cel: [2.8, 2] },
        fold([81, 150], [90, 151], 1, 'pajama'),
        fold([88, 160], [85, 167], 0.7, 'pajama', 'portrait'),
        ...footItems([86, 179], [70, 186], 7, 'pajama', -1),
      ],
    },
    { part: 'neck', origin: J.neck, items: [{ d: limb([[100, 68], [100, 80]], [9.4, 10]), mat: 'skin', cel: [1.4, 1] }] },
    {
      part: 'torso',
      origin: J.pel,
      items: [
        {
          d: TORSO,
          mat: 'pajama',
          cel: [4, 3.4],
          deep: <ellipse cx={100} cy={80} rx={18} ry={6.6} fill={MATERIALS.pajama.deep} />,
          rim: 'M124,96 C127,108 127,120 121,130',
        },
        { raw: <path d={compactPath(STARS.map(([x, y, s]) => star4(x, y, s)).join(' '))} fill={ACCENTS.star} opacity={0.95} />, tier: 'battle' },
        { raw: <BearPatch x={101} y={111} s={0.95} /> },
        fold([83, 131], [95, 135], 0.9, 'pajama'),
        fold([105, 135], [117, 131], 0.9, 'pajama'),
        fold([79, 92], [84, 98], 0.8, 'pajama', 'portrait'),
        fold([121, 91], [117, 97], 0.8, 'pajama', 'portrait'),
      ],
    },
    {
      part: 'arm-near',
      origin: J.shL,
      items: [
        { d: limb([J.shL, J.elL, J.wrL], [7, 6, 4.9]), mat: 'pajama', cel: [2, 1.8] },
        fold([74, 97], [71, 103], 0.9, 'pajama'),
        { raw: <path d="M66,110 C64,113 63,116 64,118" stroke={MATERIALS.redString.base} strokeWidth={2.4} fill="none" strokeLinecap="round" /> },
        ...handItems([J.wrL[0] - 1.6, J.wrL[1] + 1.2], 116, 1.15, 'open'),
      ],
    },
    { part: 'collar', origin: J.neck, items: [{ d: COLLAR, mat: 'cream', cel: [1, 1] }] },
    headGroup(expr),
  ];
}

const EXPRS: readonly DemoExpr[] = ['happy', 'laugh', 'surprised'];

/** The contact shadow under the feet (the shared gradient). */
const Shadow = () => <ellipse cx={101} cy={186} rx={44} ry={6} fill={artUrl('contact')} />;

export const RigDemo = defineSprite(
  {
    kind: 'hero',
    rig: { skeleton: () => DEMO_SKELETON, bones: DEMO_BONES },
  },
  ({ lod, expr, facing, state }: SpriteProps) => {
    const face = EXPRS.includes(expr as DemoExpr) ? (expr as DemoExpr) : 'happy';
    return (
      <SpriteSvg char={CHAR} lod={lod} state={state} facing={facing} faces="left" box={lod === 'icon' ? ICON_BOX : undefined}>
        {lod !== 'icon' && <Shadow />}
        <Fig char={CHAR} lod={lod} groups={demoGroups(face)} />
      </SpriteSvg>
    );
  },
);

/** The demo's expressions, for the art lab. */
export const DEMO_EXPRS = EXPRS;
