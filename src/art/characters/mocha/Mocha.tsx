import { Fig, SpriteSvg, type FigGroup, type FigItem } from '../../Fig';
import { blob, compactPath, limb, rings, rotatePoints, type Vec } from '../../geom';
import { CAT, LINE, MATERIALS } from '../../palette';
import { defineSprite, type Lod, type SpriteProps } from '../../sprite';
import { Contact, marks, pawItems } from '../kit';
import { mochaHead, MOCHA_EXPRS, type MochaExpr } from './Head';
import { MOCHA_BONES, MOCHA_POSES, MOCHA_SKELETONS, POUNCE_TURN, type MochaPose } from './skeleton';

/**
 * 摩卡貓, the hero (art direction § 5.2): a 7-year-old brown mackerel tabby with white socks on all
 * four feet, a cream bib and an MRT-blue polka-dot bandana knotted on the left with a gold fish
 * tag. Ported from `mc_sit` and `mc_walk` in `docs/art/options/_gen/anime2.py`.
 *
 * - `pose`: `sit` (battle, default), `walk` (map; the default at the map LOD), `pounce` (attack),
 *   `loaf` (KO).
 * - `expr`: 平常 `content` (default), 得意 `smug`, 開心 `happy`, 驚訝 `surprised`. With no `expr`
 *   the state picks: hurt → surprised, victory → happy, KO → asleep in a loaf.
 * - `tail` (tail acting): `up` (curled up: happy), `puff` (surprised), `flick` (low, annoyed),
 *   `wrap` (round the paws, sitting). Defaults follow the expression.
 */

const CHAR = 'mocha';

export type MochaTail = 'wrap' | 'up' | 'puff' | 'flick';
export const MOCHA_TAILS: readonly MochaTail[] = ['wrap', 'up', 'puff', 'flick'];
export type MochaProps = SpriteProps & { tail?: MochaTail };

const fur = MATERIALS.tabby;
const band = MATERIALS.bandana;

/** A tail volume with its rings, growing from the end of the spine. */
function tailGroup(pts: readonly Vec[], rs: readonly number[], count: number): FigGroup {
  return {
    part: 'tail',
    origin: pts[0],
    items: [{ d: limb(pts, rs), mat: 'tabby', cel: [1.6, 1.6], extra: <path d={compactPath(rings(pts, rs, count, 3.2))} fill={fur.stripe} /> }],
  };
}

/** Sitting tails: wrapped round the front paws, curled up behind, puffed, or low with a flicking tip. */
const SIT_TAILS: Record<MochaTail, { pts: Vec[]; rs: number[]; count: number; front: boolean }> = {
  wrap: { pts: [[46, 168], [36, 180], [60, 190], [98, 190], [128, 186], [138, 178]], rs: [7, 7.4, 7.2, 6.8, 6.4, 5.6], count: 6, front: true },
  flick: { pts: [[46, 168], [36, 180], [62, 190], [100, 189], [126, 182], [134, 168]], rs: [7, 7.4, 7.2, 6.8, 6.2, 5.4], count: 6, front: true },
  up: { pts: [[48, 166], [34, 158], [26, 138], [28, 116], [36, 100], [48, 94], [52, 102]], rs: [7.4, 7.2, 7, 6.6, 6.2, 6, 5.6], count: 6, front: false },
  puff: { pts: [[48, 166], [34, 156], [26, 134], [26, 110], [30, 90]], rs: [9.4, 10.6, 11, 10.6, 9], count: 5, front: false },
};

/** The bandana: a polka-dot triangle with a knot on the left and the gold fish tag at its point. */
function bandanaGroup(d: string, knot: string | null, dots: readonly Vec[], fold: string, tag: Vec, r: number, lod: Lod): FigGroup {
  const fish = `M${tag[0] - 2.4},${tag[1] + 0.2} c1.2,-1.6 3.4,-1.6 4.4,0 c-1,1.6 -3.2,1.6 -4.4,0Z m4.4,0 l1.8,-1.4 v2.8Z`;
  const items: FigItem[] = [{ sil: d }];
  if (knot) items.push({ d: knot, mat: 'bandana', cel: false, lw: 1.1 });
  items.push(
    { raw: <path d={d} fill={band.base} stroke={band.line} strokeWidth={1.1} /> },
    { raw: <path d={fold} fill={band.cel} /> },
    { raw: <path d={dots.map(([x, y]) => `M${x - 1.6},${y}a1.6,1.6 0 1,0 3.2,0a1.6,1.6 0 1,0 -3.2,0`).join('')} fill={CAT.bandanaDot} />, tier: lod === 'map' ? 'battle' : 'map' },
    { raw: <circle cx={tag[0]} cy={tag[1]} r={r} fill={MATERIALS.gold.base} stroke={LINE.sil} strokeWidth={1.6} /> },
    { raw: <path d={fish} fill={MATERIALS.gold.deep} />, tier: 'battle' },
    { raw: <path d={`M${tag[0] - 2},${tag[1] - 1.6} C${tag[0] - 1},${tag[1] - 2.8} ${tag[0] + 0.6},${tag[1] - 3} ${tag[0] + 1.8},${tag[1] - 2.6}`} stroke={MATERIALS.cream.base} strokeWidth={1} strokeLinecap="round" fill="none" />, tier: 'portrait' },
  );
  return { part: 'bandana', origin: tag, items };
}

type Build = { expr: MochaExpr; tail: MochaTail; lod: Lod };

/** Sitting (battle): `mc_sit`. Shoulder blades up, straight front legs with wrists, the haunch behind. */
function sitGroups({ expr, tail, lod }: Build): FigGroup[] {
  const J = MOCHA_SKELETONS.sit;
  const t = SIT_TAILS[tail];
  const T = blob([[100, 90], [110, 94], [116, 104], [116, 122], [112, 140], [106, 156], [96, 170], [80, 178], [58, 178], [42, 170], [36, 154], [40, 136], [50, 120], [62, 108], [74, 100], [86, 94]]);
  const tailG = tailGroup(t.pts, t.rs, t.count);
  return [
    ...(t.front ? [] : [tailG]),
    {
      part: 'arm-far',
      origin: J.shF,
      items: [
        { d: limb([J.shF, J.elF, J.wrF], [7.6, 6.2, 5.2]), mat: 'tabbyFar', cel: [2, 1.6], extra: marks([[[106, 140], [118, 139], 1.4], [[106, 152], [118, 151], 1.4]]) },
        ...pawItems([114, 177], 12.6, 8.4),
      ],
    },
    {
      // Body: shoulder blades → back → the big haunch; chest forward
      part: 'torso',
      origin: J.spine,
      items: [
        {
          d: T,
          mat: 'tabby',
          cel: [4, 3],
          deep: <ellipse cx={96} cy={94} rx={16} ry={6} fill={fur.deep} />,
          extra: <path d="M58,112 C54,122 52,132 53,142 C56,132 59,122 63,114 Z M70,104 C66,112 64,120 64,128 C67,120 70,112 74,106 Z M44,146 C42,154 42,162 45,168 C46,160 47,154 49,148 Z" fill={fur.stripe} />,
          rim: 'M64,104 C76,96 88,92 98,91',
        },
        {
          // The haunch (thigh mass) as its own volume so it reads
          d: blob([[40, 150], [48, 136], [64, 130], [80, 136], [88, 152], [84, 170], [66, 178], [48, 174]]),
          mat: 'tabby',
          cel: [3, 2.6],
          extra: <path d="M54,138 C60,140 64,146 66,152 C62,148 58,143 52,141 Z M44,152 C50,152 55,156 58,162 C54,159 49,156 43,156 Z" fill={fur.stripe} />,
        },
      ],
    },
    ...(t.front ? [tailG] : []),
    {
      // The hind paw tucked in front of the haunch, and the cream bib with its tufted edge
      part: 'leg-near',
      origin: J.knN,
      items: [{ d: limb([[50, 176], [66, 180]], [4.6, 5]), mat: 'tabby', cel: [1.2, 1] }, ...pawItems([72, 183], 12.4, 7.6)],
    },
    {
      part: 'bib',
      origin: [100, 120],
      items: [{ d: 'M90,96 L94,101 L98,96 L102,102 L106,96 L110,101 L112,98 C116,112 112,128 104,142 C100,148 96,150 92,146 C86,134 84,116 90,96 Z', mat: 'furCream', cel: [2, 1.6] }],
    },
    {
      // Near front leg: straight, a wrist, a round paw with toe splits
      part: 'arm-near',
      origin: J.shN,
      items: [
        { d: limb([J.shN, J.elN, J.wrN], [8, 6.4, 5.4]), mat: 'tabby', cel: [2, 1.6], extra: marks([[[82, 140], [95, 139], 1.4], [[82, 152], [95, 151], 1.4]]) },
        ...pawItems([89, 177], 13.6, 9),
      ],
    },
    bandanaGroup(
      'M74,88 C84,98 116,98 126,88 L122,98 C114,103 106,105 100,117 C94,105 86,103 78,98 Z',
      'M77,90 C70,85 63,89 65,96 C69,97 73,95 77,93 Z',
      [[84, 97], [94, 102], [106, 102], [116, 97], [100, 110]],
      'M100,117 C106,106 114,103 122,98 L124,93 C114,101 106,104 100,117 Z',
      [100, 120],
      4.6,
      lod,
    ),
    mochaHead(expr, { at: J.head, scale: 0.8, origin: J.neck }),
  ];
}

/** Walking (map): `mc_walk`. Digitigrade, the near front paw lifted, the tail up from the spine. */
function walkGroups({ expr, lod }: Build, J = MOCHA_SKELETONS.walk, turn?: (pts: readonly Vec[]) => Vec[], tailPts?: Vec[]): FigGroup[] {
  const tr = turn ?? ((pts: readonly Vec[]) => [...pts]);
  const T = blob(tr([[56, 104], [62, 92], [76, 88], [96, 90], [116, 88], [132, 92], [142, 102], [140, 116], [130, 124], [110, 126], [90, 126], [72, 124], [60, 118]]));
  const TAIL: Vec[] = tailPts ?? [[56, 98], [42, 92], [32, 80], [28, 64], [32, 50], [42, 44], [48, 48]];
  const [deep] = tr([[134, 100]]);
  const bib = tr([[128, 104], [132, 108], [136, 104], [140, 110]]);
  const bibEnd = tr([[142, 118], [138, 124], [132, 126], [126, 126], [122, 120], [124, 112]]);
  const thigh = tr([[62, 100]]);
  return [
    tailGroup(TAIL, [7.6, 7, 6.6, 6.2, 6, 5.8, 5.4], 5),
    {
      part: 'leg-far',
      origin: J.hipF,
      items: [{ d: limb([J.hipF, J.knF, J.hkF, J.pwF], [9, 6, 4.6, 4.2]), mat: 'tabbyFar', cel: [2, 1.6] }, ...pawItems([J.pwF[0], J.pwF[1] + 4], 11, 7)],
    },
    {
      part: 'arm-far',
      origin: J.shF,
      items: [{ d: limb([J.shF, J.elF, J.wrF], [7, 5.6, 4.6]), mat: 'tabbyFar', cel: [2, 1.6] }, ...pawItems([J.wrF[0] + 1, J.wrF[1] + 6], 11, 7.2)],
    },
    {
      part: 'torso',
      origin: J.spine,
      items: [
        {
          d: T,
          mat: 'tabby',
          cel: [3.4, 3.4],
          deep: <ellipse cx={deep[0]} cy={deep[1]} rx={10} ry={10} fill={fur.deep} />,
          extra: (
            <path
              d={compactPath(
                [
                  [[80, 88], [78, 98], [78, 108], [80, 118], [82, 108], [83, 98], [85, 90]],
                  [[94, 89], [92, 99], [92, 109], [94, 119], [96, 109], [97, 99], [99, 90]],
                  [[108, 88], [106, 98], [106, 108], [108, 116], [110, 108], [111, 98], [113, 90]],
                  [[66, 94], [64, 102], [64, 110], [66, 116], [68, 110], [69, 102], [71, 96]],
                ]
                  .map((s) => tr(s as unknown as Vec[]))
                  .map((p) => `M${p[0]} C${p[1]} ${p[2]} ${p[3]} C${p[4]} ${p[5]} ${p[6]} Z`)
                  .join(' '),
              )}
              fill={fur.stripe}
            />
          ),
          rim: compactPath(`M${tr([[64, 92]])[0]} C${tr([[80, 86]])[0]} ${tr([[104, 88]])[0]} ${tr([[128, 88]])[0]}`),
        },
        { d: `M${bib[0]} L${bib[1]} L${bib[2]} L${bib[3]} C${bibEnd[0]} ${bibEnd[1]} ${bibEnd[2]} C${bibEnd[3]} ${bibEnd[4]} ${bibEnd[5]} Z`, mat: 'furCream', cel: [1.6, 1.4] },
      ],
    },
    {
      // Near hind: thigh, the hock folding backwards, the paw planted
      part: 'leg-near',
      origin: J.hipN,
      items: [
        { d: limb([J.knN, J.hkN, J.pwN], [6.2, 4.8, 4.4]), mat: 'tabby', cel: [1.8, 1.6] },
        {
          d: limb([thigh[0], J.hipN, J.knN], [13, 12.4, 6.4]),
          mat: 'tabby',
          cel: [2.6, 2.2],
          extra: marks([[[J.hipN[0] - 6, J.hipN[1] + 2], [J.hipN[0] + 6, J.hipN[1] + 14], 1.6], [[J.hipN[0] - 4, J.hipN[1] - 10], [J.hipN[0] + 8, J.hipN[1] + 2], 1.6]]),
        },
        ...pawItems([J.pwN[0] + 2, J.pwN[1] + 4], 12, 7.6),
      ],
    },
    {
      part: 'arm-near',
      origin: J.shN,
      items: [
        { d: limb([J.shN, J.elN, J.wrN], [7.6, 6, 5]), mat: 'tabby', cel: [2, 1.6], extra: marks([[[J.elN[0] - 7, J.elN[1] - 2], [J.elN[0] + 5, J.elN[1] - 4], 1.4]]) },
        ...pawItems([J.wrN[0] + 6, J.wrN[1] + 4], 11.6, 7.4),
      ],
    },
    bandanaGroup(
      compactPath(`M${tr([[126, 84]])[0]} C${tr([[134, 96]])[0]} ${tr([[150, 98]])[0]} ${tr([[158, 90]])[0]} L${tr([[156, 98]])[0]} C${tr([[150, 102]])[0]} ${tr([[144, 104]])[0]} ${tr([[140, 114]])[0]} C${tr([[136, 104]])[0]} ${tr([[132, 100]])[0]} ${tr([[128, 96]])[0]} Z`),
      null,
      tr([[134, 94], [146, 97]]),
      compactPath(`M${tr([[140, 114]])[0]} C${tr([[144, 106]])[0]} ${tr([[150, 101]])[0]} ${tr([[156, 98]])[0]} L${tr([[157, 94]])[0]} C${tr([[150, 99]])[0]} ${tr([[144, 104]])[0]} ${tr([[140, 114]])[0]} Z`),
      tr([[141, 117]])[0],
      3.8,
      lod,
    ),
    mochaHead(expr, { at: J.head, scale: 0.66, origin: J.neck, tilt: turn ? -6 : 0 }),
  ];
}

/** The pounce: the walk's trunk turned up into the leap, front paws reaching, hind legs driving. */
function pounceGroups(build: Build): FigGroup[] {
  const turn = (pts: readonly Vec[]) => rotatePoints(pts, POUNCE_TURN.centre, POUNCE_TURN.deg, POUNCE_TURN.by);
  const rump = turn([[56, 98]])[0];
  const tail: Vec[] = [rump, [rump[0] - 14, rump[1] - 2], [rump[0] - 28, rump[1] - 8], [rump[0] - 38, rump[1] - 18], [rump[0] - 42, rump[1] - 30], [rump[0] - 38, rump[1] - 38], [rump[0] - 32, rump[1] - 36]];
  return walkGroups(build, MOCHA_SKELETONS.pounce, turn, tail);
}

/** KO: a loaf, paws tucked under, tail wrapped round, fast asleep. */
function loafGroups({ expr, lod }: Build): FigGroup[] {
  const J = MOCHA_SKELETONS.loaf;
  const T = blob([[52, 176], [48, 160], [56, 142], [74, 130], [98, 126], [120, 130], [140, 140], [150, 158], [148, 176], [126, 184], [76, 184]]);
  return [
    {
      part: 'torso',
      origin: J.spine,
      items: [
        {
          d: T,
          mat: 'tabby',
          cel: [3.6, 3],
          deep: <ellipse cx={136} cy={150} rx={14} ry={8} fill={fur.deep} />,
          extra: <path d="M76,132 C72,142 70,152 71,162 C74,152 77,142 81,134 Z M92,128 C88,138 87,148 88,158 C91,148 93,138 97,130 Z M108,128 C105,138 104,148 105,156 C108,148 110,138 113,130 Z M58,146 C56,154 56,162 58,170 C60,162 61,154 63,148 Z" fill={fur.stripe} />,
          rim: 'M60,140 C76,128 100,124 122,129',
        },
        {
          d: blob([[48, 166], [54, 150], [70, 146], [86, 154], [90, 170], [80, 182], [60, 184]]),
          mat: 'tabby',
          cel: [2.6, 2.2],
          extra: <path d="M58,152 C64,154 68,160 70,166 C66,162 62,158 56,156 Z" fill={fur.stripe} />,
        },
      ],
    },
    tailGroup([[52, 172], [50, 184], [76, 190], [108, 190], [132, 188], [146, 186]], [6.6, 7, 6.8, 6.4, 6, 5.2], 6),
    {
      part: 'arm-near',
      origin: J.shN,
      items: [...pawItems([124, 184], 12, 6), ...pawItems([140, 182], 11, 5.6)],
    },
    bandanaGroup(
      'M110,140 C120,150 142,150 152,140 L149,149 C143,153 137,155 131,165 C125,155 119,153 113,149 Z',
      'M113,142 C107,138 101,142 103,148 C107,149 110,147 113,145 Z',
      [[118, 148], [128, 151], [138, 151], [145, 147]],
      'M131,165 C137,155 143,153 149,149 L151,144 C143,151 137,154 131,165 Z',
      [131, 168],
      3.8,
      lod,
    ),
    mochaHead(expr, { at: J.head, scale: 0.66, origin: J.neck, tilt: 8 }),
  ];
}

// ---- the sprite ------------------------------------------------------------------------------

/** Pose name + state → which pose, face and tail. */
function resolve(pose: string | undefined, lod: Lod, state: SpriteProps['state'], expr: string | undefined, tail: MochaTail | undefined) {
  const named = MOCHA_EXPRS.includes(expr as (typeof MOCHA_EXPRS)[number]) ? (expr as MochaExpr) : undefined;
  if (state === 'ko') return { pose: 'loaf' as MochaPose, expr: 'sleep' as MochaExpr, tail: 'wrap' as MochaTail };
  const p: MochaPose = (MOCHA_POSES as readonly string[]).includes(pose ?? '') ? (pose as MochaPose) : lod === 'map' ? 'walk' : 'sit';
  const face: MochaExpr = p === 'loaf' ? (named ?? 'sleep') : p === 'pounce' ? (named ?? 'hunt') : (named ?? (state === 'hurt' ? 'surprised' : state === 'victory' ? 'happy' : 'content'));
  const mood: MochaTail = tail ?? (face === 'happy' ? 'up' : face === 'surprised' ? 'puff' : 'wrap');
  return { pose: p, expr: face, tail: mood };
}

const ICON_BOX: Record<MochaPose, readonly [number, number, number, number]> = {
  sit: [54, 10, 92, 92],
  walk: [114, 32, 80, 80],
  pounce: [116, 4, 80, 80],
  loaf: [92, 86, 76, 76],
};

/** Built figures by pose, face, tail and LOD: pure data, so every copy and re-render shares them. */
const GROUPS = new Map<string, FigGroup[]>();

const ICON_PARTS = ['torso', 'bib', 'bandana', 'head'];

const SHADOW: Record<MochaPose, readonly [number, number, number, number]> = {
  sit: [98, 186, 62, 8],
  walk: [98, 180, 70, 7],
  pounce: [102, 184, 56, 6],
  loaf: [100, 188, 58, 7],
};

export const Mocha = defineSprite(
  {
    kind: 'hero',
    rig: { skeleton: (pose) => MOCHA_SKELETONS[(MOCHA_POSES as readonly string[]).includes(pose ?? '') ? (pose as MochaPose) : 'sit'], bones: MOCHA_BONES },
  },
  ({ lod, pose, expr, facing, state, tail }: MochaProps) => {
    const r = resolve(pose, lod, state, expr, tail);
    const build: Build = { expr: r.expr, tail: r.tail, lod };
    const key = `${r.pose}|${r.expr}|${r.tail}|${lod}`;
    let all = GROUPS.get(key);
    if (!all) {
      all = r.pose === 'walk' ? walkGroups(build) : r.pose === 'pounce' ? pounceGroups(build) : r.pose === 'loaf' ? loafGroups(build) : sitGroups(build);
      GROUPS.set(key, all);
    }
    // The icon is a head crop (§ 8.3): only what shows around the head is drawn
    const groups = lod === 'icon' ? all.filter((group) => ICON_PARTS.includes(group.part)) : all;
    const [cx, cy, rx, ry] = SHADOW[r.pose];
    return (
      <SpriteSvg
        char={CHAR}
        lod={lod}
        state={state}
        facing={facing}
        faces="right"
        pose={r.pose}
        restPose={r.pose === 'loaf'}
        className={`rig--tail-${r.tail}`}
        box={lod === 'icon' ? ICON_BOX[r.pose] : undefined}
        ground={[cx, cy]}
        gait="cat"
      >
        {lod !== 'icon' && <Contact cx={cx} cy={cy} rx={rx} ry={ry} />}
        <Fig char={CHAR} lod={lod} groups={groups} />
      </SpriteSvg>
    );
  },
);
