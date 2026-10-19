import { POPUP as C } from '../../art/palette';
import { depth, fibers, softEllipse, washi } from './paper';
import { f1, filterAttr, ref, translate, type KitCtx } from './svg';

/**
 * UI furniture: the book is the UI (popup art bible § 7). The HUD paper label, the bottom-bar discs
 * and stickers on the cover, and the page-block edges. Ports of kit.js `hud`, `tray`, `bookBlock`.
 * These are the kit's look; the real screens (#97) compose them with React and live text.
 */

export type HudOptions = {
  /** The landmark name, serif 900 */
  title: string;
  /** 「…」 page title after the landmark, in red serif */
  page?: string;
  /** 「第N章 · 第 n 頁 / 6」 */
  sub: string;
  /** The moon clock chip, e.g. 00:20 */
  time: string;
  /** Foil coins in the 9-slot 抓周 tray */
  filled?: number;
  /** Moon (night) or sun (dawn, page E) on the clock chip */
  moon?: boolean;
};

/**
 * The HUD (bible § 7, top 96 px): a cream deckled paper label taped on with pink and celadon washi,
 * rotated −0.6°: landmark, page title, chapter line, the moon clock chip and the 抓周 tray of foil
 * coins (filled) and blind-embossed dimples (empty). Drawn in 390-wide screen space.
 */
export function hudLabel(ctx: KitCtx, { title, page = '', sub, time, filled = 0, moon = true }: HudOptions): string {
  const label = `<rect x="16" y="14" width="358" height="74" rx="3"/>`;
  const icon = moon
    ? `<path d="M24 9a9 9 0 1 0 8 13a7 7 0 1 1 -8 -13z" fill="${ref(ctx, 'foil')}"/>`
    : `<circle cx="24" cy="17" r="6" fill="${ref(ctx, 'foil')}"/><path d="M24 5v3M24 26v3M12 17h3M33 17h3M16 9l2 2M30 23l2 2M16 25l2 -2M30 11l2 -2" stroke="${C.gold}" stroke-width="1.6" stroke-linecap="round"/>`;
  const slots = Array.from({ length: 9 }, (_, i) => {
    const cx = i * 18 + 7;
    return i < filled
      ? `<circle cx="${cx}" r="6.5" fill="${ref(ctx, 'coin')}"/><circle cx="${cx}" r="4.6" fill="none" stroke="${C.coinRing}" stroke-width=".7" opacity=".6"/><circle cx="${cx - 2}" cy="-2" r="2" fill="${C.brassShine}" opacity=".8"/>`
      : `<circle cx="${cx}" r="6" fill="${C.pageDark}"/><circle cx="${cx}" cy=".8" r="6" fill="none" stroke="${C.dimpleLight}" stroke-width="1"/><circle cx="${cx}" cy="-.4" r="6" fill="none" stroke="${C.dimpleShade}" stroke-width=".8"/>`;
  }).join('');
  return `<g transform="rotate(-.6 195 50)">`
    + depth(ctx, 2, `<rect x="16" y="14" width="358" height="74" rx="3" fill="${C.page}"${filterAttr(ctx, 'deckle')}/>`, label)
    + fibers(18, 16, 354, 70, 70, C.pageFiber, 4, 0.22)
    + `<text x="32" y="50" font-family="'Noto Serif TC'" font-weight="900" font-size="27" fill="${C.ink}" letter-spacing="2">${title}`
    + (page ? `<tspan font-size="15" font-weight="700" fill="${C.sealInk}" letter-spacing="0" dx="4">「${page}」</tspan>` : '')
    + `</text><text x="33" y="75" font-size="14" font-weight="700" fill="${C.inkSoft}">${sub}</text>`
    + `<g transform="translate(250 24)"><rect width="110" height="34" rx="17" fill="${C.cover}"/><rect x="2" y="2" width="106" height="30" rx="15" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1.2"/>`
    + `${icon}<text x="70" y="24" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="19" fill="${C.goldLight}">${time}</text></g>`
    + `<g transform="translate(176 68)">${slots}<text x="188" y="5" font-size="12" font-weight="700" fill="${C.inkSoft}" text-anchor="end">抓周</text></g>`
    + `</g>${washi(ctx, 44, 16, 50, 15, -8)}${washi(ctx, 352, 84, 46, 14, 10, C.washiCeladon)}`;
}

/** A cream card disc on the cover with a ring and a label below (bible § 7 bottom bar). */
function disc(ctx: KitCtx, x: number, y: number, label: string, icon: string, ring: string, r = 28): string {
  return `<g transform="${translate(x, y)}">${depth(ctx, 2, `<circle r="${r}" fill="${C.page}"/>`, `<circle r="${r}"/>`)}`
    + `<circle r="${f1(r - 2.5)}" fill="none" stroke="${ring}" stroke-width="2.2"/>${icon}`
    + `<text y="${r + 24}" text-anchor="middle" font-size="15" font-weight="900" fill="${C.barLabel}">${label}</text></g>`;
}

/** A sticker dimple: blind-embossed navy with a dashed gold ring when empty, a foil disc with its icon when earned. */
function sticker(ctx: KitCtx, x: number, y: number, label: string, earned: boolean, icon: string): string {
  return `<g transform="${translate(x, y)}"><circle r="15" fill="${C.sticker}"/><circle r="15" cy="1.2" fill="none" stroke="${C.stickerRim}" stroke-width="1.2"/>`
    + `<circle r="15" cy="-1" fill="none" stroke="${C.stickerDeep}" stroke-width="1.2" opacity=".7"/>`
    + (earned ? `<circle r="13.5" fill="${ref(ctx, 'foil')}"/>${icon}` : `<circle r="11" fill="none" stroke="${C.gold}" stroke-width="1.2" stroke-dasharray="2.5 3" opacity=".7"/>`)
    + `<text y="33" text-anchor="middle" font-size="12" font-weight="700" fill="${C.stickerLabel}">${label}</text></g>`;
}

export type BottomBarOptions = {
  /** 寶咖咖's portrait frame for the word-ring disc (a baked head, #94); empty draws a cream face */
  portrait?: string;
  /** Earned stickers: 解開, 淘氣, 土地公 */
  stickers?: readonly [boolean, boolean, boolean];
  /** The bar's centre line (y of the disc centres) */
  y?: number;
};

/**
 * The bottom bar on the cover (GDD § 2.1, bible § 7): [寶咖咖 portrait → word ring] (the only
 * marigold ring, with a dashed halo, because it is a touchable) [提示] [重來] [選單], then the
 * 解開 · 淘氣 · 土地公 stickers. Every disc is ≥ 56 px.
 */
export function bottomBar(ctx: KitCtx, { portrait = '', stickers = [false, false, false], y = 764 }: BottomBarOptions = {}): string {
  const clip = ctx.id('portrait');
  const face = `<clipPath id="${clip}"><circle r="25"/></clipPath><g clip-path="url(#${clip})"><circle r="25" fill="${C.lampHot}"/>`
    + (portrait ? `<image href="${portrait}" x="-24" y="-22" width="48" height="52"/>` : '')
    + `</g>`;
  const hint = `<path d="M0 -14a10.5 10.5 0 0 1 6.5 18.5V7h-13V4.5A10.5 10.5 0 0 1 0 -14z" fill="${C.bulb}" stroke="${C.bulbInk}" stroke-width="1.6"/><path d="M-5.5 11h11M-3.5 15h7" stroke="${C.bulbInk}" stroke-width="2" stroke-linecap="round"/>`;
  const retry = `<path d="M9 -8A12 12 0 1 0 12 3M3 -13L11 -9L8 -1" fill="none" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  const menu = `<path d="M-10 -7H10M-10 0H10M-10 7H10" stroke="${C.ink}" stroke-width="3.2" stroke-linecap="round"/>`;
  return `<g>${softEllipse(ctx, 46, y, 35, 35, 'marigold', 0.25)}`
    + disc(ctx, 46, y, '說話', face, C.marigold, 31)
    + `<circle cx="46" cy="${y}" r="35" fill="none" stroke="${C.marigold}" stroke-width="2" stroke-dasharray="3 4"/>`
    + disc(ctx, 116, y, '提示', hint, ref(ctx, 'foil'))
    + disc(ctx, 178, y, '重來', retry, ref(ctx, 'foil'))
    + disc(ctx, 240, y, '選單', menu, ref(ctx, 'foil'))
    + sticker(ctx, 290, y - 6, '解開', stickers[0], `<path d="M-6 0l4 4l8 -9" fill="none" stroke="${C.foilInk}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`)
    + sticker(ctx, 328, y - 6, '淘氣', stickers[1], `<text y="5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="13" fill="${C.foilInk}">嘿</text>`)
    + sticker(ctx, 366, y - 6, '土地公', stickers[2], `<path d="M-7 0a7 7 0 0 1 14 0z" fill="${C.hatRed}"/><path d="M-5 1q5 9 10 0z" fill="${C.standeeCard}"/>`)
    + `</g>`;
}

/** The page-block edges under the page: five lines, a thick old book (bible § 2.1 diagram). */
export function pageBlock(x0: number, x1: number, bottom: number): string {
  return [0, 1, 2, 3, 4]
    .map((i) => `<path d="M${f1(x0 - 1 + i * 0.4)} ${f1(bottom + 2 + i * 2.4)}H${f1(x1 + 1 - i * 0.4)}" stroke="${i % 2 ? C.pageEdge : C.foldLit}" stroke-width="2"/>`)
    .join('');
}
