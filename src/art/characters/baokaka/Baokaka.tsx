import { Fig, SpriteSvg, type FigGroup, type FigPart, type FigRaw } from '../../Fig';
import { blob, limb, type Vec } from '../../geom';
import { MATERIALS } from '../../palette';
import { defineSprite, type Lod, type SpriteProps } from '../../sprite';
import { BearPatch, Contact, folds, footItems, handItems, soleItems, starPrint, ToyBlock } from '../kit';
import { baokakaHead, BAOKAKA_EXPRS, type BaokakaExpr } from './Head';
import { BAOKAKA_BONES, BAOKAKA_POSES, BAOKAKA_SKELETONS, type BaokakaPose } from './skeleton';

/**
 * 寶咖咖, the hero (art direction § 5.1), on the option D rig: skeleton → tapered limb volumes →
 * footie pajamas → cel → two-pass lines, ported number for number from `bk_sit`, `bk_crawl` and
 * `bk_stand` in `docs/art/options/_gen/anime2.py` (the approved anatomy and design sheets).
 *
 * - `pose`: `sit` (battle, default), `crawl` (map; the default at the map LOD), `stand` (first
 *   steps), and the action poses `throw` (sit, block raised), `clap`, `cry`, `firstStep` (stand)
 *   and `lie` (KO). He never walks on the map before Ch14 (story constraint): the map default is
 *   the crawl.
 * - `expr`: 開心 `happy` (default), 大笑 `laugh`, 淚汪汪 `teary`, 驚訝 `surprised`. With no `expr`,
 *   the state picks one: hurt → surprised, victory → laugh, KO → asleep; 哇哇大哭 wails.
 * - `lock`: the 金鎖片 on its red cord (the ending only).
 */

const CHAR = 'baokaka';

export type BaokakaProps = SpriteProps & { lock?: boolean };

/** Every pose name the sprite accepts: the skeleton poses plus the actions drawn on them. */
export const BAOKAKA_POSE_NAMES = [...BAOKAKA_POSES, 'throw', 'firstStep'] as const;

const pj = MATERIALS.pajama;

// ---- shared pieces ----------------------------------------------------------------------------

/** The red string bracelet on his right wrist, with its gold bead (§ 5.1). */
const bracelet = (d: string, bead: Vec): FigRaw[] => [
  { raw: <path d={d} stroke={MATERIALS.redString.base} strokeWidth={2.4} fill="none" strokeLinecap="round" /> },
  { raw: <circle cx={bead[0]} cy={bead[1]} r={1.6} fill={MATERIALS.gold.base} stroke={MATERIALS.gold.deep} strokeWidth={0.5} />, tier: 'battle' },
];

/** The cream ribbed collar, authored for the standing neck at (100, 76) and moved with it. */
const COLLAR = 'M86,77 C92,83 108,83 114,77 C117,79 116,84 112,85.6 C104,88.6 96,88.6 88,85.6 C84,84 83,79 86,77 Z';
const collarAt = (dx: number, dy: number): FigGroup => ({
  part: 'collar',
  origin: [100 + dx, 80 + dy],
  items: [{ d: COLLAR, mat: 'cream', cel: [1, 1] }],
  ...(dx || dy ? { transform: `translate(${dx} ${dy})` } : {}),
});

/** The 金鎖片 (ending only): a gold heart on a red cord over the collar. */
const lockGroup = (neck: Vec): FigGroup => {
  const [x, y] = neck;
  const heart = `M${x},${y + 15} C${x + 3},${y + 11} ${x + 9},${y + 11} ${x + 9},${y + 17} C${x + 9},${y + 21} ${x + 4},${y + 24} ${x},${y + 27} C${x - 4},${y + 24} ${x - 9},${y + 21} ${x - 9},${y + 17} C${x - 9},${y + 11} ${x - 3},${y + 11} ${x},${y + 15} Z`;
  return {
    part: 'lock',
    origin: [x, y + 12],
    items: [
      { raw: <path d={`M${x - 11},${y + 4} C${x - 8},${y + 12} ${x + 8},${y + 12} ${x + 11},${y + 4}`} stroke={MATERIALS.redString.base} strokeWidth={1.6} fill="none" /> },
      { d: heart, mat: 'gold', cel: [1.2, 1.2] },
      { raw: <path d={`M${x - 5},${y + 16} C${x - 4},${y + 14} ${x - 2},${y + 13.4} ${x},${y + 14.6}`} stroke={MATERIALS.cream.base} strokeWidth={1.2} fill="none" strokeLinecap="round" />, tier: 'battle' },
    ],
  };
};

const neckGroup = (a: Vec, b: Vec, cel: readonly [number, number] = [1.4, 1]): FigGroup => ({ part: 'neck', origin: b, items: [{ d: limb([a, b], [9.4, 10]), mat: 'skin', cel }] });

const torsoItems = (d: string, cel: readonly [number, number], deep: Vec, rx: number, ry: number): FigPart => ({
  d,
  mat: 'pajama',
  cel,
  deep: <ellipse cx={deep[0]} cy={deep[1]} rx={rx} ry={ry} fill={pj.deep} />,
});

// ---- poses ------------------------------------------------------------------------------------

type Build = { expr: BaokakaExpr; lod: Lod; lock: boolean };

/** Sitting (battle): `bk_sit`. With `arms` = `raised` the far arm holds the block up. */
function sitGroups({ expr, lock }: Build, arms: 'raised' | 'clap' | 'cry'): FigGroup[] {
  const J = BAOKAKA_SKELETONS[arms === 'raised' ? 'sit' : arms];
  const T = blob([[102, 80], [112, 82], [120, 88], [125, 100], [129, 116], [130, 132], [126, 146], [114, 154], [100, 156], [86, 154], [76, 146], [73, 130], [74, 114], [77, 100], [83, 88], [92, 82]]);
  const groups: FigGroup[] = [];
  // A put-down block sits on the floor behind his far foot
  if (arms !== 'raised') groups.push({ part: 'block', origin: [168, 166], items: [{ raw: <ToyBlock x={168} y={160} s={0.8} /> }] });
  groups.push(
    neckGroup([102, 72], [102, 86]),
    {
      part: 'torso',
      origin: J.pel,
      items: [
        { ...torsoItems(T, [4, 3.4], [102, 84], 18, 6.4), rim: 'M126,98 C130,112 131,126 127,140' },
        starPrint([[84, 108, 2.6], [88, 136, 2.2], [120, 130, 2.4], [117, 108, 2]]),
        { raw: <BearPatch x={103} y={120} s={0.95} /> },
        folds([[[90, 148], [112, 150], 0.9]], 'pajama'),
        folds([[[80, 100], [85, 106], 0.8]], 'pajama', 'portrait'),
      ],
    },
    // Far leg: knee up, foot flat on the floor
    {
      part: 'leg-far',
      origin: J.hipF,
      items: [
        { d: limb([J.hipF, J.knF, [144, 148], J.anF], [12, 8.8, 8, 5.8]), mat: 'pajamaFar', cel: [2.4, 2] },
        folds([[[134, 134], [141, 128], 0.9]], 'pajamaFar'),
        ...footItems([142, 167], [160, 172], 6.6, 'pajamaFar', 1),
      ],
    },
    // Near leg: out forward in a loose V, the sole toward the viewer
    {
      part: 'leg-near',
      origin: J.hipN,
      items: [
        { d: limb([J.hipN, J.knN, [60, 162], J.anN], [12.6, 9, 8.4, 6]), mat: 'pajama', cel: [2.8, 2.2] },
        folds([[[72, 153], [69, 162], 0.9]], 'pajama'),
        ...soleItems([48, 170], [40, 153], 7),
      ],
    },
  );

  const nearArm: FigGroup =
    arms === 'clap'
      ? {
          part: 'arm-near',
          origin: J.shN,
          items: [
            { d: limb([J.shN, J.elN, J.wrN], [7, 6, 4.9]), mat: 'pajama', cel: [2, 1.8] },
            folds([[[80, 112], [84, 118], 0.9]], 'pajama'),
            ...bracelet('M93,113 C92,117 93,121 96,123', [92.6, 118]),
            ...handItems([J.wrN[0] + 1, J.wrN[1] - 1], -62, 1.15, 'open'),
          ],
        }
      : {
          // Resting on the thigh, open hand palm-down
          part: 'arm-near',
          origin: J.shN,
          items: [
            { d: limb([J.shN, J.elN, J.wrN], [7, 6, 4.9]), mat: 'pajama', cel: [2, 1.8] },
            folds([[[78, 112], [80, 119], 0.9]], 'pajama'),
            ...bracelet('M77,132 C79,136 83,137 87,135', [82, 136.4]),
            ...handItems([J.wrN[0] + 0.6, J.wrN[1] + 2], 62, 1.15, 'flat'),
          ],
        };

  const headAt = baokakaHead(expr, { at: J.head, scale: 0.56, origin: J.neck, tilt: arms === 'cry' ? -8 : 0 });

  if (arms === 'raised') {
    groups.push(nearArm, collarAt(2, 4));
    if (lock) groups.push(lockGroup([102, 80]));
    groups.push(headAt, {
      // The raised arm with the block, in front of the head's edge (it winds up for 丟積木)
      part: 'arm-far',
      origin: J.shF,
      items: [{ d: limb([J.shF, J.elF, J.wrF], [7, 6, 4.9]), mat: 'pajama', cel: [2, 1.8] }, folds([[[131, 86], [136, 84], 0.9]], 'pajama')],
      children: [
        { part: 'block', origin: [142, 40], items: [{ raw: <ToyBlock x={142} y={40} /> }] },
        { part: 'hand-far', origin: J.wrF, items: handItems([J.wrF[0] - 0.4, J.wrF[1] + 1], -84, 1.15, 'grab') },
      ],
    });
    return groups;
  }
  if (arms === 'clap') {
    groups.push(collarAt(2, 4));
    if (lock) groups.push(lockGroup([102, 80]));
    groups.push(headAt, {
      part: 'arm-far',
      origin: J.shF,
      items: [{ d: limb([J.shF, J.elF, J.wrF], [6.8, 5.8, 4.8]), mat: 'pajamaFar', cel: [2, 1.8] }, ...handItems([J.wrF[0] - 1, J.wrF[1] - 1], -118, 1.15, 'open')],
    }, nearArm);
    return groups;
  }
  // cry: the far arm drops to a fist at his side, the head thrown back
  groups.push(
    nearArm,
    {
      part: 'arm-far',
      origin: J.shF,
      items: [
        { d: limb([J.shF, J.elF, J.wrF], [6.8, 5.8, 4.8]), mat: 'pajamaFar', cel: [2, 1.8] },
        folds([[[127, 106], [133, 110], 0.9]], 'pajamaFar'),
        ...handItems([J.wrF[0] + 0.4, J.wrF[1] + 1], 76, 1.15, 'fist'),
      ],
    },
    collarAt(2, 4),
  );
  if (lock) groups.push(lockGroup([102, 80]));
  groups.push(headAt);
  return groups;
}

/** Crawling (map): `bk_crawl`. Palms flat under the shoulders, thighs vertical under the hips. */
function crawlGroups({ expr }: Build): FigGroup[] {
  const J = BAOKAKA_SKELETONS.crawl;
  const T = blob([[52, 104], [62, 96], [80, 94], [100, 95], [118, 96], [130, 100], [138, 110], [136, 124], [124, 130], [104, 134], [84, 134], [66, 132], [54, 126], [48, 116]]);
  return [
    {
      part: 'arm-far',
      origin: J.shF,
      items: [{ d: limb([J.shF, J.elF, J.wrF], [6.6, 5.6, 4.6]), mat: 'pajamaFar', cel: [2, 1.8] }, ...handItems([J.wrF[0] - 1, J.wrF[1] + 2], 8, 1.05, 'flat')],
    },
    {
      part: 'leg-far',
      origin: J.hipF,
      items: [{ d: limb([J.hipF, J.knF, J.anF], [11.6, 8.4, 6]), mat: 'pajamaFar', cel: [2.4, 2] }, ...soleItems([38, 170], [22, 163], 6.4)],
    },
    {
      // Flat back, the belly hanging a little, a diaper-padded bottom
      part: 'torso',
      origin: J.pel,
      items: [
        { ...torsoItems(T, [3.6, 3.6], [132, 104], 10, 12), rim: 'M60,98 C80,93 104,94 122,97' },
        starPrint([[70, 108, 2.6], [92, 104, 2.2], [84, 124, 2.4], [108, 112, 2]]),
        { raw: <BearPatch x={118} y={120} s={0.85} />, tier: 'battle' },
        folds([[[60, 124], [70, 130], 0.9], [[96, 131], [110, 130], 0.8]], 'pajama'),
      ],
    },
    {
      // Near leg: thigh vertical, shin on the floor, sole up
      part: 'leg-near',
      origin: J.hipN,
      items: [
        { d: limb([J.hipN, J.knN, J.anN], [12.6, 8.8, 6.2]), mat: 'pajama', cel: [2.8, 2.2] },
        folds([[[74, 150], [80, 156], 0.9]], 'pajama'),
        ...soleItems([52, 174], [34, 168], 6.8),
      ],
    },
    neckGroup(J.neck, [141, 94], [1.4, 1.2]),
    baokakaHead(expr, { at: J.head, scale: 0.52, origin: J.neck }),
    {
      // Near arm straight under the shoulder, palm flat on the floor
      part: 'arm-near',
      origin: J.shN,
      items: [
        { d: limb([J.shN, J.elN, J.wrN], [7, 6, 5]), mat: 'pajama', cel: [2, 1.8] },
        folds([[[130, 136], [136, 137], 0.8]], 'pajama'),
        ...bracelet('M141,159 C144,162 149,162 152,159', [146.6, 161.4]),
        ...handItems([J.wrN[0] + 0.4, J.wrN[1] + 3], 6, 1.15, 'flat'),
      ],
    },
  ];
}

/** Standing, first steps (Ch14 finale, ending, 勇敢的第一步): `bk_stand`. Wide stance, arms out, soft knees. */
function standGroups({ expr, lock }: Build): FigGroup[] {
  const J = BAOKAKA_SKELETONS.stand;
  const T = blob([[100, 77], [110, 78.6], [119, 83], [124, 92], [126, 106], [127, 118], [122, 130], [111, 138], [100, 140], [89, 138], [78, 130], [73, 118], [74, 106], [76, 92], [81, 83], [90, 78.6]]);
  const groups: FigGroup[] = [
    {
      part: 'arm-far',
      origin: J.shF,
      items: [
        { d: limb([J.shF, J.elF, J.wrF], [6.8, 5.8, 4.8]), mat: 'pajamaFar', cel: [2, 1.8] },
        folds([[[127, 94], [130, 100], 0.9]], 'pajamaFar'),
        ...handItems([J.wrF[0] + 1.4, J.wrF[1] + 0.4], -14, 1.15, 'open'),
      ],
    },
    {
      part: 'leg-far',
      origin: J.hipF,
      items: [
        { d: limb([J.hipF, J.knF, [117, 162], J.anF], [12, 8.8, 8.2, 5.8]), mat: 'pajamaFar', cel: [2.6, 2] },
        folds([[[111, 150], [119, 149], 0.9]], 'pajamaFar'),
        ...footItems([116, 178], [132, 184], 6.8, 'pajamaFar', 1),
      ],
    },
    {
      part: 'leg-near',
      origin: J.hipN,
      items: [
        { d: limb([J.hipN, J.knN, [84, 162], J.anN], [12.4, 9, 8.4, 6]), mat: 'pajama', cel: [2.8, 2] },
        folds([[[81, 150], [90, 151], 1]], 'pajama'),
        folds([[[88, 160], [85, 167], 0.7]], 'pajama', 'portrait'),
        ...footItems([86, 179], [70, 186], 7, 'pajama', -1),
      ],
    },
    neckGroup([100, 68], [100, 80]),
    {
      part: 'torso',
      origin: J.pel,
      items: [
        { ...torsoItems(T, [4, 3.4], [100, 80], 18, 6.6), rim: 'M124,96 C127,108 127,120 121,130' },
        starPrint([[85, 102, 2.6], [89, 126, 2.2], [118, 122, 2.4], [114, 100, 2]]),
        { raw: <BearPatch x={101} y={111} s={0.95} /> },
        folds([[[83, 131], [95, 135], 0.9], [[105, 135], [117, 131], 0.9]], 'pajama'),
        folds([[[79, 92], [84, 98], 0.8], [[121, 91], [117, 97], 0.8]], 'pajama', 'portrait'),
      ],
    },
    {
      part: 'arm-near',
      origin: J.shN,
      items: [
        { d: limb([J.shN, J.elN, J.wrN], [7, 6, 4.9]), mat: 'pajama', cel: [2, 1.8] },
        folds([[[74, 97], [71, 103], 0.9]], 'pajama'),
        ...bracelet('M66,110 C64,113 63,116 64,118', [63.8, 114.6]),
        ...handItems([J.wrN[0] - 1.6, J.wrN[1] + 1.2], 116, 1.15, 'open'),
      ],
    },
    collarAt(0, 0),
  ];
  if (lock) groups.push(lockGroup([100, 76]));
  groups.push(baokakaHead(expr, { at: J.head, scale: 0.56, origin: J.neck }));
  return groups;
}

/** KO, 累倒了: flopped on his tummy, fast asleep (never scary). */
function lieGroups({ expr }: Build): FigGroup[] {
  const J = BAOKAKA_SKELETONS.lie;
  const T = blob([[48, 150], [58, 140], [80, 137], [104, 138], [124, 140], [138, 146], [142, 156], [134, 166], [110, 170], [84, 171], [62, 170], [50, 164]]);
  return [
    {
      part: 'arm-far',
      origin: J.shF,
      items: [{ d: limb([J.shF, J.elF, J.wrF], [6.6, 5.6, 4.6]), mat: 'pajamaFar', cel: [2, 1.8] }, ...handItems([J.wrF[0], J.wrF[1] + 2], 14, 1.05, 'flat')],
    },
    {
      part: 'leg-far',
      origin: J.hipF,
      items: [{ d: limb([J.hipF, J.knF, J.anF], [11.4, 8.2, 6]), mat: 'pajamaFar', cel: [2.4, 2] }, ...soleItems([20, 162], [8, 150], 6.2)],
    },
    {
      part: 'torso',
      origin: J.pel,
      items: [
        { ...torsoItems(T, [3.6, 3.4], [134, 152], 9, 10), rim: 'M58,142 C80,136 106,137 124,141' },
        starPrint([[72, 148, 2.6], [96, 145, 2.2], [86, 160, 2.4], [116, 152, 2]]),
        folds([[[60, 160], [68, 166], 0.9], [[98, 166], [112, 165], 0.8]], 'pajama'),
      ],
    },
    {
      part: 'leg-near',
      origin: J.hipN,
      items: [
        { d: limb([J.hipN, J.knN, J.anN], [12.4, 8.6, 6.2]), mat: 'pajama', cel: [2.8, 2.2] },
        folds([[[46, 164], [52, 172], 0.9]], 'pajama'),
        ...soleItems([24, 170], [10, 160], 6.6),
      ],
    },
    neckGroup(J.neck, [146, 148], [1.4, 1.2]),
    baokakaHead(expr, { at: J.head, scale: 0.52, origin: J.neck, tilt: 12 }),
    {
      // The near arm folded beside him, hand flat on the floor
      part: 'arm-near',
      origin: J.shN,
      items: [
        { d: limb([J.shN, J.elN, J.wrN], [7, 6, 5]), mat: 'pajama', cel: [2, 1.8] },
        ...bracelet('M121,171 C120,175 121,179 123,181', [120.6, 176]),
        ...handItems([J.wrN[0] - 0.4, J.wrN[1] + 1.6], 176, 1.15, 'flat'),
      ],
    },
  ];
}

// ---- the sprite ------------------------------------------------------------------------------

type Resolved = { skeleton: BaokakaPose; arms?: 'raised' | 'clap' | 'cry'; expr: BaokakaExpr };

/** Pose name + state → which skeleton, arms and face. */
function resolve(pose: string | undefined, lod: Lod, state: SpriteProps['state'], expr: string | undefined): Resolved {
  const named = BAOKAKA_EXPRS.includes(expr as (typeof BAOKAKA_EXPRS)[number]) ? (expr as BaokakaExpr) : undefined;
  if (state === 'ko') return { skeleton: 'lie', expr: 'sleep' };
  const face = (fallback: BaokakaExpr): BaokakaExpr => named ?? (state === 'hurt' ? 'surprised' : state === 'victory' ? 'laugh' : fallback);
  const p = pose ?? (lod === 'map' ? 'crawl' : 'sit');
  switch (p) {
    case 'crawl':
      return { skeleton: 'crawl', expr: face('happy') };
    case 'stand':
    case 'firstStep':
      return { skeleton: 'stand', expr: face(p === 'firstStep' ? 'laugh' : 'happy') };
    case 'clap':
      return { skeleton: 'clap', arms: 'clap', expr: face('laugh') };
    case 'cry':
      return { skeleton: 'cry', arms: 'cry', expr: named ?? 'wail' };
    case 'lie':
      return { skeleton: 'lie', expr: named ?? 'sleep' };
    default:
      return { skeleton: 'sit', arms: 'raised', expr: face('happy') };
  }
}

/** The icon LOD's head crop per pose (a 76u square around the head and its sprout). */
const ICON_BOX: Record<BaokakaPose, readonly [number, number, number, number]> = {
  sit: [64, 14, 76, 76],
  clap: [64, 14, 76, 76],
  cry: [63, 13, 76, 76],
  stand: [62, 4, 76, 76],
  crawl: [111, 38, 72, 72],
  lie: [120, 104, 72, 72],
};

/** Built figures by pose, face, LOD and lock: pure data, so every copy and re-render shares them. */
const GROUPS = new Map<string, FigGroup[]>();

const ICON_PARTS = ['neck', 'torso', 'collar', 'lock', 'head'];

const SHADOW: Record<BaokakaPose, readonly [number, number, number, number]> = {
  sit: [100, 178, 70, 8],
  clap: [100, 178, 70, 8],
  cry: [100, 178, 70, 8],
  stand: [101, 186, 44, 6],
  crawl: [98, 180, 78, 8],
  lie: [94, 176, 84, 8],
};

/** Which pose classes `rig.css` keys its action animations on. */
const ACTION_CLASS: Record<string, string> = { throw: 'throw', sit: 'throw', clap: 'clap', cry: 'cry', firstStep: 'step', stand: 'step', crawl: 'crawl', lie: 'lie' };

export const Baokaka = defineSprite(
  {
    kind: 'hero',
    rig: {
      skeleton: (pose) => {
        const p = (pose ?? 'sit') as string;
        const key: BaokakaPose = p === 'throw' ? 'sit' : p === 'firstStep' ? 'stand' : (BAOKAKA_POSES as readonly string[]).includes(p) ? (p as BaokakaPose) : 'sit';
        return BAOKAKA_SKELETONS[key];
      },
      bones: BAOKAKA_BONES,
    },
  },
  ({ lod, pose, expr, facing, state, lock = false }: BaokakaProps) => {
    const r = resolve(pose, lod, state, expr);
    const build: Build = { expr: r.expr, lod, lock };
    const key = `${r.skeleton}|${r.arms}|${r.expr}|${lod}|${lock}`;
    let all = GROUPS.get(key);
    if (!all) {
      all = r.skeleton === 'crawl' ? crawlGroups(build) : r.skeleton === 'stand' ? standGroups(build) : r.skeleton === 'lie' ? lieGroups(build) : sitGroups(build, r.arms ?? 'raised');
      GROUPS.set(key, all);
    }
    // The icon is a head crop (§ 8.3): only what shows around the head is drawn
    const groups = lod === 'icon' ? all.filter((group) => ICON_PARTS.includes(group.part)) : all;
    const [cx, cy, rx, ry] = SHADOW[r.skeleton];
    return (
      <SpriteSvg
        char={CHAR}
        lod={lod}
        state={state}
        facing={facing}
        faces="right"
        pose={ACTION_CLASS[pose ?? r.skeleton] ?? r.skeleton}
        restPose={r.skeleton === 'lie'}
        box={lod === 'icon' ? ICON_BOX[r.skeleton] : undefined}
        ground={[cx, cy]}
        gait="crawl"
      >
        {lod !== 'icon' && <Contact cx={cx} cy={cy} rx={rx} ry={ry} />}
        <Fig char={CHAR} lod={lod} groups={groups} />
      </SpriteSvg>
    );
  },
);
