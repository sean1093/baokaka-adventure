import { POPUP as C } from '../../../art/palette';
import { depth, softEllipse, type KitCtx } from '../../art';

/**
 * Chapter 7's riders (貓空, #125): placeholders until the chapter's art issue (#126) draws them in
 * its kit. 7-2's two cabins on the 貓空纜車's cable (a loop whose slots climb the hill, so the stage
 * draws no carriage for them, D-83): without these Baokaka would sit in mid-air. Origin at the
 * cabin's node, its floor (where he sits); the roof rail, where Mocha sits, 44 units up; the hanger
 * up to the cable 60 units up. `riderArt` (`airport.ts`) serves them.
 */

/** A gondola cabin: a rounded box with two windows, its roof and hanger; a glass floor, or the 店員小哥's shop. */
function cabin(ctx: KitCtx, kind: 'glass' | 'shop'): string {
  const body = 'M-24 6V-30Q-24 -38 -16 -38H16Q24 -38 24 -30V6Z';
  const shell = kind === 'glass' ? C.printLilac : C.washi;
  const floor = kind === 'glass'
    ? `<rect x="-24" y="-2" width="48" height="8" fill="${C.glassine}" opacity=".9"/><path d="M-20 2h40" stroke="${C.glassineDeep}" stroke-width="1"/>`
    : `<rect x="-24" y="-2" width="48" height="8" fill="${C.printLilacDeep}"/>`;
  const sign = kind === 'shop'
    ? `<path d="M-24 -30h48v8h-48z" fill="${C.seal}"/><path d="M-18 -30v8M-6 -30v8M6 -30v8M18 -30v8" stroke="${C.washi}" stroke-width="3"/>`
      + `<rect x="-14" y="-18" width="28" height="9" rx="1.6" fill="${C.washi}"/>`
      + `<text data-art-text="" x="0" y="-11.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6" fill="${C.sealInk}">行動分店</text>`
    : `<rect x="-19" y="-28" width="16" height="20" rx="3" fill="${C.nightCardDeep}" opacity=".85"/><rect x="3" y="-28" width="16" height="20" rx="3" fill="${C.nightCardDeep}" opacity=".85"/>`
      + `<path d="M-16 -25l6 0M6 -25l6 0" stroke="${C.vellum}" stroke-width="1.2" opacity=".7"/>`;
  return softEllipse(ctx, 0, 10, 22, 3, 'shadow', 0.3)
    + `<path d="M0 -38V-60" stroke="${C.printDark}" stroke-width="2.4"/><circle cx="0" cy="-60" r="3.4" fill="${C.printDark}"/>`
    + depth(ctx, 4, `<path d="${body}" fill="${shell}"/>${sign}${floor}<path d="M-26 -38H26V-42Q0 -48 -26 -42Z" fill="${C.printDark}"/>`
      + `<path d="M-20 -35H20" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`, `<path d="${body}"/>`);
}

/** Chapter 7's riders by `'<loop art key>:<node id>'`. */
export const C7_RIDERS: Readonly<Record<string, (ctx: KitCtx) => string>> = {
  'c7/bullwheel:A': (ctx) => cabin(ctx, 'glass'),
  'c7/bullwheel:shop': (ctx) => cabin(ctx, 'shop'),
};
