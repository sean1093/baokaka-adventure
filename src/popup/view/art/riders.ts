import type { KitCtx } from '../../art';
import { AIRPORT_RIDERS } from './airport';
import { BEITOU_RIDERS } from './beitou';
import { MAOKONG_RIDERS } from './gondola';
import { TAMSUI_RIDERS } from './tamsui';

/**
 * What rides a loop's slots (#124, D-87; shared since #126): a suitcase on 6-2's carousel, the tray
 * on 6-6's X-ray belt, 7-2's gondola cabins on the 貓空纜車's cable, 8-4's book tray on the library's
 * book lift. The page draws each at its riding node (`PageView`'s `RiderView`), so a rider slides
 * exactly as its node does — level or climbing — and Baokaka or Mocha riding it moves with it. Live
 * SVG with flat fills (it moves: no filters, GDD § 3.9), its origin at the node (the top or the
 * floor it carries them on), keyed by `'<loop art key>:<node id>'`. Each chapter's art keeps its
 * own riders beside its cast and registers them here.
 */
export type RiderArt = (ctx: KitCtx) => string;

const RIDERS: Readonly<Record<string, RiderArt>> = {
  // 松山機場 (#124, `airport.ts`): the suitcases, the X-ray tray
  ...AIRPORT_RIDERS,
  // 貓空 (#126, `gondola.ts`): the 水晶車廂 and the 店員小哥's shop cabin
  ...MAOKONG_RIDERS,
  // 北投 (#130, `beitou.ts`): 8-4's book tray
  ...BEITOU_RIDERS,
  // 淡水 (#131, `tamsui.ts`; a placeholder until #132): 9-6's net basket on the derrick
  ...TAMSUI_RIDERS,
};

/** The rider drawn on loop `key`'s node `node`, or null. */
export const riderArt = (key: string, node: string): RiderArt | null => RIDERS[`${key}:${node}`] ?? null;
