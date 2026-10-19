import { POPUP as C } from '../../../art/palette';
import { depth, f1, ref, softEllipse, type KitCtx } from '../../art';
import type { PartSource } from '../sources';

/**
 * Chapter 1 (台北車站) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The chapter's art issue (#108) adds the rest here.
 */

/** One split-flap card (proof A): the dark card, its lighter top half, the split, the glyph. */
function flapCard(x: number, y: number, ch: string, color: string, digit = false): string {
  const family = digit ? "'Fredoka'" : "'Chiron GoRound TC'";
  return `<g transform="translate(${f1(x)} ${f1(y)})"><rect width="18" height="24" rx="2" fill="${C.tile}"/>`
    + `<rect width="18" height="12" rx="2" fill="${C.sticker}"/><path d="M0 12H18" stroke="${C.stickerDeep}" stroke-width="1"/>`
    + `<path d="M.6 .6H17.4" stroke="${C.stickerRim}" stroke-width=".6" opacity=".7"/>`
    + `<text x="9" y="18.4" text-anchor="middle" font-family="${family}" font-weight="700" font-size="${digit ? 16 : 14}" fill="${color}">${ch}</text></g>`;
}

/** What the board reads in each state: the line, the time, where it goes. */
const BOARD_TEXT: Readonly<Record<string, { line: string; time: string; to: string }>> = {
  // GDD § 4.3: the 月亮線 to Baokaka's home, at the chapter's 00:20
  times: { line: '月亮線', time: '00:20', to: '往寶咖咖的家' },
  // Tapped, every card flips to the next departure: the 福德 (土地公) line, and he peeks out
  flip: { line: '福德線', time: '00:21', to: '往土地公的家' },
};

/** The board's half size and how far its cords run up to the backdrop page's top edge (1-2 hangs it at y 40). */
const BW = 88, BH = 32, CORD = 40;

/**
 * 1-2's split-flap departure board (GDD § 4.3; proof A): a navy board in a gold-foil frame,
 * hanging on two cords from the top of the backdrop page, with a line of split-flap cards (the
 * line and the time in warm lamp light, the destination in paper white) and a green "on time"
 * lamp. It is a `prop` (tap to flip, a discovery): printed, never marigold.
 *
 * Local space: the origin at the board's centre (the part's hit centre), the cords running up
 * `CORD` units to the page's top edge.
 */
export const departureBoard: PartSource = {
  preset: 'prop',
  states: ['times', 'flip'],
  box: { x: -BW - 8, y: -BH - CORD - 2, w: 2 * BW + 22, h: 2 * BH + CORD + 22 },
  draw(ctx: KitCtx, state: string): string {
    const t = BOARD_TEXT[state] ?? BOARD_TEXT.times;
    const cords = `<path d="M${-BW + 22} ${-BH - CORD}V${-BH + 2}M${BW - 22} ${-BH - CORD}V${-BH + 2}" stroke="${C.stickerDeep}" stroke-width="1.4" opacity=".85"/>`
      + `<g fill="${ref(ctx, 'foil')}"><circle cx="${-BW + 22}" cy="${-BH + 2}" r="2.2"/><circle cx="${BW - 22}" cy="${-BH + 2}" r="2.2"/></g>`;
    const cards = [
      ...[...t.line].map((c, i) => flapCard(-BW + 9 + i * 20, -BH + 7, c, C.lamp)),
      ...[...t.time].map((c, i) => flapCard(-BW + 77 + i * 18.6, -BH + 7, c, C.lamp, true)),
      ...[...t.to].map((c, i) => flapCard(-BW + 9 + i * 20, -BH + 35, c, C.barLabel)),
    ].join('');
    const body = `<rect x="${-BW}" y="${-BH}" width="${2 * BW}" height="${2 * BH}" rx="5" fill="${C.nightInk}"/>`
      + `<rect x="${-BW + 2.5}" y="${-BH + 2.5}" width="${2 * BW - 5}" height="${2 * BH - 5}" rx="4" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1.1"/>`
      + cards
      + `<path d="M${-BW + 1} ${-BH + 0.7}H${BW - 2}" stroke="${C.cutRim}" stroke-width="1" opacity=".35"/>`;
    // The status lamp: a lit bead with a little bloom (a light, so the grade leaves it alone)
    const lamp = softEllipse(ctx, BW - 12, BH - 13, 6, 6, 'lamp', 0.35, 'blur3')
      + `<circle cx="${BW - 12}" cy="${BH - 13}" r="3.6" fill="${C.neonCyan}"/><circle cx="${BW - 13}" cy="${BH - 14.2}" r="1.2" fill="${C.lampHot}"/>`;
    return cords + depth(ctx, 3, body, `<rect x="${-BW}" y="${-BH}" width="${2 * BW}" height="${2 * BH}" rx="5"/>`) + lamp;
  },
};
