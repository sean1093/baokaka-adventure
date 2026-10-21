import { POPUP as C, mixHex } from '../../../art/palette';
import { depth, softEllipse, type KitCtx } from '../../art';
import type { RiderArt } from './riders';

/**
 * Chapter 8's riders (北投, #129; a placeholder until the chapter's art, #130): 8-4's book tray on
 * the library's book lift, a belt whose slots climb the wall between the floors (the stage draws
 * carriages only for level runs, D-83), so the tray is drawn at its riding node (`riderArt`,
 * `riders.ts`). Origin at the tray's floor, where Baokaka sits. Live, flat fills (it moves: no
 * filters, GDD § 3.9).
 */

/** A wooden book tray hung from the belt: low sides, a few books stacked at its back. */
function bookTray(ctx: KitCtx): string {
  const box = 'M-24 -6H24V8H-24Z';
  return softEllipse(ctx, 0, 10, 24, 3, 'shadow', 0.3)
    + `<path d="M0 -6V-26" stroke="${C.printDark}" stroke-width="2.2"/><circle cy="-27" r="2.6" fill="${C.printDark}"/>`
    + `<rect x="-20" y="-16" width="7" height="12" fill="${C.washiCeladon}"/><rect x="-12" y="-14" width="6" height="10" fill="${C.washiPink}"/>`
    + `<rect x="14" y="-13" width="7" height="9" fill="${C.printLilac}"/>`
    + depth(ctx, 3, `<path d="${box}" fill="${C.wood}"/><path d="M-24 -6H24" stroke="${mixHex(C.wood, C.cutRim, 0.4)}" stroke-width="1.2"/>`
      + `<path d="M-24 2H24" stroke="${C.woodDeep}" stroke-width="1.2" opacity=".7"/>`, `<path d="${box}"/>`);
}

export const BEITOU_RIDERS: Readonly<Record<string, RiderArt>> = {
  'c8/book-belt:T': bookTray,
};
