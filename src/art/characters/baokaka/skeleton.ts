import type { Bones, Skeleton } from '../../sprite';

/**
 * 寶咖咖's skeleton per pose (art direction § 2.1 step 2, § 8.2 rule 1) on the 200u canvas, ported
 * from `bk_stand`, `bk_sit` and `bk_crawl` in `docs/art/options/_gen/anime2.py` (the approved
 * anatomy sheet); `clap`, `cry` and `lie` are new poses built the same way. `N` is the near side
 * (toward the viewer: his right), `F` the far side. 3.4 heads tall standing.
 *
 * | pose    | used for                                                                     |
 * |---------|------------------------------------------------------------------------------|
 * | crawl   | the map (palms under the shoulders, thighs vertical, flat back, head lifted) |
 * | sit     | battle idle (weight on the bottom, near leg out, far knee up, block raised)  |
 * | stand   | first steps: the Ch14 finale, the ending, and 勇敢的第一步               |
 * | clap    | 拍拍手 (sit, both hands meeting in front of the chest)                      |
 * | cry     | 哇哇大哭 (sit, head thrown back, the block dropped, a fist on the floor)  |
 * | lie     | KO, 累倒了 (flopped on his tummy asleep)                                  |
 */

export type BaokakaJoint =
  | 'head' | 'neck' | 'shN' | 'shF' | 'elN' | 'elF' | 'wrN' | 'wrF'
  | 'pel' | 'hipN' | 'hipF' | 'knN' | 'knF' | 'anN' | 'anF';

export const BAOKAKA_POSES = ['sit', 'crawl', 'stand', 'clap', 'cry', 'lie'] as const;
export type BaokakaPose = (typeof BAOKAKA_POSES)[number];

const SIT: Skeleton<BaokakaJoint> = {
  head: [102, 58], neck: [102, 86], shN: [86, 96], shF: [119, 94], elN: [77, 117], elF: [135, 82], wrN: [82, 134], wrF: [141, 64],
  pel: [103, 140], hipN: [92, 144], hipF: [115, 143], knN: [70, 158], knF: [139, 132], anN: [50, 165], anF: [146, 160],
};

export const BAOKAKA_SKELETONS: Readonly<Record<BaokakaPose, Skeleton<BaokakaJoint>>> = {
  sit: SIT,
  crawl: {
    head: [147, 80], neck: [136, 100], shN: [128, 112], shF: [121, 108], elN: [137, 137], elF: [117, 138], wrN: [146, 162], wrF: [114, 162],
    pel: [68, 112], hipN: [72, 120], hipF: [64, 115], knN: [78, 168], knF: [60, 166], anN: [50, 172], anF: [36, 168],
  },
  stand: {
    head: [100, 48], neck: [100, 76], shN: [83, 88], shF: [117, 87], elN: [71, 102], elF: [131, 98], wrN: [64, 113], wrF: [141, 106],
    pel: [100, 128], hipN: [91, 130], hipF: [110, 130], knN: [86, 152], knF: [115, 151], anN: [84, 172], anF: [118, 171],
  },
  // Both forearms swing in so the hands meet over the chest
  clap: { ...SIT, elN: [80, 120], wrN: [96, 118], elF: [128, 116], wrF: [112, 114] },
  // The raised arm drops: elbow out, a fist on the floor beside the hip
  cry: { ...SIT, head: [101, 57], elF: [132, 116], wrF: [138, 136] },
  lie: {
    head: [156, 146], neck: [140, 152], shN: [128, 152], shF: [122, 148], elN: [134, 170], elF: [146, 160], wrN: [116, 176], wrF: [160, 168],
    pel: [64, 156], hipN: [66, 162], hipF: [60, 156], knN: [40, 170], knF: [36, 164], anN: [20, 166], anF: [16, 158],
  },
};

export const BAOKAKA_BONES: Bones<BaokakaJoint> = [
  ['head', 'neck'], ['neck', 'shN'], ['neck', 'shF'], ['shN', 'elN'], ['elN', 'wrN'], ['shF', 'elF'], ['elF', 'wrF'],
  ['neck', 'pel'], ['pel', 'hipN'], ['pel', 'hipF'], ['hipN', 'knN'], ['knN', 'anN'], ['hipF', 'knF'], ['knF', 'anF'],
];
