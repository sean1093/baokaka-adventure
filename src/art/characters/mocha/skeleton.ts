import { rotatePoints, type Vec } from '../../geom';
import type { Bones, Skeleton } from '../../sprite';

/**
 * 摩卡貓's skeleton per pose (art direction § 2.1, § 2.6) on the 200u canvas: a real cat skeleton
 * (shoulder blades, elbows, wrists, hip, knee, the backward-folding hock, paws), ported from `mc_sit`
 * and `mc_walk` in `docs/art/options/_gen/anime2.py`. `pounce` re-poses the walk (the body tilted
 * up into the leap, front legs reaching, hind legs driving back) and `loaf` is the KO.
 * `N` = near side, `F` = far side.
 *
 * | pose   | used for                                                                |
 * |--------|-------------------------------------------------------------------------|
 * | sit    | battle idle: straight front legs, haunch behind, hind paw tucked in front |
 * | walk   | the map: digitigrade, diagonal pairs, tail from the spine                |
 * | pounce | his attacks (喵喵連環爪, 貓草狂歡)                                           |
 * | loaf   | KO: a contented loaf, paws tucked, eyes shut                            |
 */

export type MochaJoint =
  | 'head' | 'neck' | 'shN' | 'shF' | 'elN' | 'elF' | 'wrN' | 'wrF' | 'spine'
  | 'hipN' | 'hipF' | 'knN' | 'knF' | 'hkN' | 'hkF' | 'pwN' | 'pwF';

export const MOCHA_POSES = ['sit', 'walk', 'pounce', 'loaf'] as const;
export type MochaPose = (typeof MOCHA_POSES)[number];

const WALK: Skeleton<MochaJoint> = {
  head: [154, 76], neck: [138, 96], shN: [126, 108], shF: [120, 104], elN: [131, 130], elF: [116, 132], wrN: [140, 146], wrF: [117, 164],
  spine: [96, 96], hipN: [68, 104], hipF: [60, 100], knN: [82, 126], knF: [70, 126], hkN: [66, 146], hkF: [50, 144], pwN: [70, 170], pwF: [44, 166],
};

/** The leap: the walk's trunk turned 14° nose-up about mid-body and lifted 20u. */
export const POUNCE_TURN = { centre: [100, 110] as Vec, deg: -14, by: [8, -20] as Vec };
const lift = (p: Vec): Vec => rotatePoints([p], POUNCE_TURN.centre, POUNCE_TURN.deg, POUNCE_TURN.by)[0];
const add = (p: Vec, d: Vec): Vec => [p[0] + d[0], p[1] + d[1]];

const [shN, shF, hipN, hipF] = [lift(WALK.shN), lift(WALK.shF), lift(WALK.hipN), lift(WALK.hipF)];
const [elN, elF, knN, knF] = [add(shN, [16, 14]), add(shF, [16, 10]), add(hipN, [-10, 22]), add(hipF, [-12, 18])];
const [hkN, hkF] = [add(knN, [-18, 10]), add(knF, [-16, 8])];

export const MOCHA_SKELETONS: Readonly<Record<MochaPose, Skeleton<MochaJoint>>> = {
  sit: {
    head: [100, 60], neck: [100, 92], shN: [90, 106], shF: [111, 104], elN: [88, 132], elF: [112, 130], wrN: [89, 166], wrF: [113, 166], spine: [76, 104],
    // Sitting, the hind leg folds under the haunch: hip, knee forward, hock and paw tucked in front
    hipN: [64, 146], hipF: [64, 146], knN: [80, 160], knF: [80, 160], hkN: [56, 176], hkF: [56, 176], pwN: [72, 183], pwF: [72, 183],
  },
  walk: WALK,
  pounce: {
    head: lift(WALK.head), neck: lift(WALK.neck), spine: lift(WALK.spine), shN, shF, hipN, hipF,
    elN, elF, wrN: add(elN, [15, 8]), wrF: add(elF, [16, 4]),
    knN, knF, hkN, hkF, pwN: add(hkN, [-12, 6]), pwF: add(hkF, [-12, 4]),
  },
  loaf: {
    head: [130, 122], neck: [128, 146], shN: [124, 156], shF: [132, 152], elN: [126, 172], elF: [140, 170], wrN: [126, 180], wrF: [142, 178], spine: [96, 136],
    hipN: [66, 154], hipF: [66, 154], knN: [80, 170], knF: [80, 170], hkN: [60, 178], hkF: [60, 178], pwN: [74, 182], pwF: [74, 182],
  },
};

export const MOCHA_BONES: Bones<MochaJoint> = [
  ['head', 'neck'], ['neck', 'shN'], ['neck', 'shF'], ['shN', 'elN'], ['elN', 'wrN'], ['shF', 'elF'], ['elF', 'wrF'], ['neck', 'spine'],
  ['spine', 'hipN'], ['spine', 'hipF'], ['hipN', 'knN'], ['knN', 'hkN'], ['hkN', 'pwN'], ['hipF', 'knF'], ['knF', 'hkF'], ['hkF', 'pwF'],
];
