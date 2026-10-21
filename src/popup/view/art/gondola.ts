import { POPUP as C, POPUP_MAOKONG as K, POPUP_STAGE as S, POPUP_STATION as T, mixHex } from '../../../art/palette';
import { depth, softEllipse, type KitCtx } from '../../art';
import type { RiderArt } from './riders';

/**
 * Chapter 7's riders (貓空, #126; bible § 6 row 7, "gondolas on a cranked loop"): 7-2's two cabins
 * on the 貓空纜車's cable, a loop whose slots climb the hill (the stage draws carriages only for
 * level runs, D-83), so each cabin is drawn at its riding node (`riderArt`, `riders.ts`). Origin at
 * the cabin's floor (where Baokaka sits), its roof rail — Mocha's perch — 44 up, the hanger up to the
 * cable's grip 60 up. Live, flat fills (they move: no filters, GDD § 3.9).
 *
 * A cabin is drawn cut away like the 月亮線 cars (bible § 6): its front wall gone, so whoever rides it
 * sits inside — the white shell with the line's tea-green band (no operator's livery), the back
 * wall's window lit gondola amber on the night, the floor. The **水晶車廂** has a glass floor (a
 * glassine slab catching the light, a little crystal mark on its band); the **店員小哥's shop**
 * (「行動分店」) has a striped awning, shelves of snacks behind its window and the 店員小哥 himself at
 * the counter, in his cap.
 */

/** The cabin's shell outline (cut away: the back wall and the frame). */
const SHELL = 'M-26 6V-30Q-26 -40 -16 -40H16Q26 -40 26 -30V6Z';

function hanger(): string {
  return `<path d="M0 -60V-52Q0 -46 -6 -44" stroke="${K.steelDeep}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    + `<rect x="-6" y="-64" width="12" height="7" rx="2" fill="${K.steelDeep}"/><circle cx="-3" cy="-61" r="1.4" fill="${K.steelLight}"/><circle cx="3" cy="-61" r="1.4" fill="${K.steelLight}"/>`;
}

/** The roof cap and its rail (Mocha's perch at y −44). */
function roof(): string {
  return `<path d="M-24 -40Q-24 -46 -16 -46H16Q24 -46 24 -40Z" fill="${K.cabinShade}"/><path d="M-18 -45H18" stroke="${K.steelDeep}" stroke-width="2.4" stroke-linecap="round"/>`
    + `<path d="M-20 -41H20" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`;
}

/** The 水晶車廂: its back window lit warm on the night outside, a glass floor, the crystal mark. */
function glassCabin(ctx: KitCtx): string {
  return softEllipse(ctx, 0, 12, 24, 3, 'shadow', 0.3) + hanger()
    + depth(ctx, 4, `<path d="${SHELL}" fill="${K.cabin}"/>`
      + `<rect x="-21" y="-34" width="42" height="26" rx="4" fill="${C.nightCardDeep}"/>`
      + `<path d="M-21 -16Q-8 -22 4 -18Q14 -15 21 -20V-8H-21Z" fill="${mixHex(K.hill, K.hillNear, 0.5)}"/>`
      + `<circle cx="10" cy="-27" r="1" fill="${C.pinhole}"/><circle cx="-12" cy="-29" r=".8" fill="${C.pinhole}"/><circle cx="-4" cy="-24" r=".8" fill="${C.pinhole}"/>`
      + `<path d="M-21 -34H21M0 -34V-8" stroke="${K.steelDeep}" stroke-width="1.6"/>`
      + `<rect x="-26" y="-8" width="52" height="7" fill="${K.cabinBand}"/>`
      + `<path d="M-3 -5.6l3 -2.6l3 2.6l-3 3.6z" fill="${C.glassine}"/>`
      + `<rect x="-26" y="-1" width="52" height="7" rx="1.4" fill="${C.glassine}" opacity=".85"/><path d="M-18 4L-12 -1H-8L-14 4Z" fill="${C.cutRim}" opacity=".7"/>`
      + `<path d="M-26 -30V6M26 -30V6" stroke="${K.cabinShade}" stroke-width="3"/>`
      + roof(), `<path d="${SHELL}"/>`)
    + softEllipse(ctx, 0, -20, 18, 10, 'lamp', 0.08);
}

/** The 店員小哥's 「行動分店」: a striped awning, his shelves of snacks, him at the counter. */
function shopCabin(ctx: KitCtx): string {
  // His head and cap behind the counter, at the window's right
  const clerk = `<path d="M6 -8q0 -10 8 -10q8 0 8 10z" fill="${C.washi}"/><path d="M10 -16h8l1 8h-10z" fill="${T.clerkApron}"/>`
    + `<circle cx="14" cy="-22" r="5.2" fill="${S.skin}"/><path d="M8.8 -23q0 -6 5.2 -6q5.2 0 5.2 6z" fill="${T.clerkCap}"/><path d="M18 -24h4a1 1 0 0 1 0 2h-4.6z" fill="${T.clerkCap}"/>`
    + `<circle cx="12.4" cy="-21.4" r=".7" fill="${C.ink}"/><circle cx="15.8" cy="-21.4" r=".7" fill="${C.ink}"/><path d="M12.6 -19q1.4 1 2.8 0" stroke="${C.ink}" stroke-width=".6" fill="none"/>`;
  // Shelves of snacks on the back wall, at the window's left
  const shelves = `<path d="M-20 -24H2M-20 -15H2" stroke="${K.woodDeep}" stroke-width="1.4"/>`
    + `<path d="M-19 -24v-4h3v4zM-14 -24v-5h3v5zM-9 -24v-3.6h3v3.6zM-4 -24v-4.4h3v4.4zM-19 -15v-4h4v4zM-13 -15v-5h3v5zM-8 -15v-3h4v3z" fill="${C.hatRed}"/>`
    + `<path d="M-17 -28.6v-1.2M-12 -29.6v-1.2M-2 -28.6v-1.2" stroke="${C.washi}" stroke-width="1"/>`;
  let stripes = '';
  for (let x = -24; x < 24; x += 8) stripes += `M${x} -40h4v8q-2 2 -4 0z`;
  return softEllipse(ctx, 0, 12, 24, 3, 'shadow', 0.3) + hanger()
    + depth(ctx, 4, `<path d="${SHELL}" fill="${K.cabin}"/>`
      + `<rect x="-21" y="-32" width="42" height="24" rx="3" fill="${mixHex(C.lamp, K.cabin, 0.45)}"/>` + shelves + clerk
      + `<path d="M-24 -40H24V-33Q0 -30 -24 -33Z" fill="${C.washi}"/><path d="${stripes}" fill="${C.seal}"/>`
      + `<rect x="-26" y="-8" width="52" height="8" fill="${K.cabinBand}"/><rect x="-26" y="-9" width="52" height="3" fill="${K.woodLight}"/>`
      + `<rect x="-15" y="-6.6" width="30" height="5.4" rx="1" fill="${C.washi}"/>`
      + `<text data-art-text="" x="0" y="-2.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="4.4" fill="${C.sealInk}">行動分店</text>`
      + `<rect x="-26" y="0" width="52" height="6" rx="1.4" fill="${K.cabinShade}"/>`
      + `<path d="M-26 -30V6M26 -30V6" stroke="${K.cabinShade}" stroke-width="3"/>`
      + roof(), `<path d="${SHELL}"/>`)
    + softEllipse(ctx, 0, -20, 20, 12, 'lamp', 0.12);
}

/** Chapter 7's riders by `'<loop art key>:<node id>'`. */
export const MAOKONG_RIDERS: Readonly<Record<string, RiderArt>> = {
  'c7/bullwheel:A': glassCabin,
  'c7/bullwheel:shop': shopCabin,
};
