import { POPUP as C, POPUP_CHAPTER_CLOCK } from '../../art/palette';
import { standee } from './actors';
import { kitDefs } from './defs';
import { depth, fibers, grain, mountainFold, pinholes, softEllipse, valleyFold } from './paper';
import { f1, filterAttr, ref, translate, type KitCtx } from './svg';
import { brad, flap, paw, perch, pullTab, seal, slider, wheel } from './touchables';

/**
 * Proof D, the material and affordance swatch sheet (`docs/art/popup/proof-d-swatches.png`),
 * rebuilt from the TS port so PageLab can show the two side by side (`#/pagelab?section=kit`).
 * Same layout and order as `proof-d-swatches.html`: paper stocks, edges/folds/depth, light at
 * night, the touchables, one tab in five states, printed vs touchable and the standee, and the
 * chapter colour-clock strip. 390 × 844, with filters when `ctx.filters` is set.
 */

export type SwatchSprites = {
  /** Mocha sitting (v2 frame), 92 × 176 */
  mochaSit?: string;
  /** Baokaka crawling (v2 pose `baokaka-crawl-0`), 225 × 237 */
  crawl?: string;
};

/** The chapters on proof D's colour-script strip (it skips 2, 5 and 7 for width). */
const STRIP = [0, 1, 3, 4, 6, 8, 9, 10, 11];

const label = (x: number, y: number, text: string, anchor = 'middle', size = 10.5, color: string = C.inkSoft) =>
  `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="700" fill="${color}">${text}</text>`;

const heading = (y: number, zh: string, en: string) =>
  `<text x="14" y="${y}" font-family="'Noto Serif TC'" font-weight="900" font-size="14" fill="${C.ink}">${zh}<tspan font-family="Fredoka" font-weight="500" font-size="11" fill="${C.inkSoft}" dx="6">${en}</tspan></text>`
  + `<path d="M14 ${y + 5}H376" stroke="${C.dimpleShade}" stroke-width=".8"/>`;

/** The whole sheet as the inside of a 390 × 844 `<svg>`. */
export function swatchSheet(ctx: KitCtx, sprites: SwatchSprites = {}): string {
  const clip = ctx.id('tileClip');
  const card = (w: number, h: number, fill: string, z: 2 | 3 = 2) => depth(ctx, z, `<rect width="${w}" height="${h}" rx="3" fill="${fill}"/>`, `<rect width="${w}" height="${h}" rx="3"/>`);
  const grainOver = (opacity: number, blend: string) =>
    ctx.filters ? `<rect width="87" height="56"${filterAttr(ctx, 'grain')} opacity="${opacity}" style="mix-blend-mode:${blend}"/>` : '';

  let s = kitDefs(ctx, undefined, `<clipPath id="${clip}"><rect width="87" height="50" rx="3"/></clipPath>`
    + STRIP.map((chapter) => {
      const sky = POPUP_CHAPTER_CLOCK[chapter];
      return `<linearGradient id="${ctx.id(`ch${chapter}`)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky.top}"/><stop offset="1" stop-color="${sky.horizon}"/></linearGradient>`;
    }).join(''));
  s += `<rect width="390" height="844" fill="${C.page}"/>${fibers(0, 0, 390, 844, 500, C.pageFiber, 2, 0.2)}`;

  // Header band: the navy linen cover
  s += `<rect width="390" height="50" fill="${ref(ctx, 'linen')}"/><path d="M0 50H390" stroke="${ref(ctx, 'foilH')}" stroke-width="2"/>`
    + `<text x="14" y="32" font-family="'Noto Serif TC'" font-weight="900" font-size="19" fill="${C.goldLight}" letter-spacing="1">翻翻台北 · 材質與機關</text>`
    + `<text x="376" y="31" text-anchor="end" font-family="Fredoka" font-weight="500" font-size="11" fill="${C.stickerLabel}">materials &amp; affordances · TS kit</text>`;

  // A. Paper materials (bible § 3.1)
  s += heading(70, '紙材', 'paper materials');
  const tile = (i: number, name: string, en: string, inner: string) => {
    const x = 12 + (i % 4) * 93, y = 78 + Math.floor(i / 4) * 76;
    return `<g transform="${translate(x, y)}">${card(87, 50, C.standeeCard)}<g clip-path="url(#${clip})">${inner}</g>`
      + `${label(43.5, 62, name, 'middle', 11, C.ink)}${label(43.5, 72, en, 'middle', 8.5)}</g>`;
  };
  s += tile(0, '卡紙', 'card stock (night)', `<rect width="87" height="56" fill="${ref(ctx, 'nightCard')}"/>${pinholes(ctx, 0, 0, 87, 56, 12, 3)}${grainOver(0.9, 'soft-light')}`);
  s += tile(1, '牛皮紙', 'kraft', `<rect width="87" height="56" fill="${ref(ctx, 'kraft')}"/>${fibers(0, 0, 87, 56, 50, C.kraftFiber, 7, 0.45)}${grainOver(0.5, 'multiply')}`);
  s += tile(2, '和紙', 'washi (fibres)', `<rect width="87" height="56" fill="${C.washi}"/>${fibers(0, 0, 87, 56, 90, C.washiFiber, 9, 0.55)}<rect width="87" height="56" fill="${C.washiPink}" opacity=".25"/>`);
  s += tile(3, '描圖紙', 'tracing / vellum', `<rect width="87" height="56" fill="${ref(ctx, 'nightCard')}"/><rect x="10" y="10" width="20" height="30" fill="${ref(ctx, 'window')}"/><rect x="40" y="16" width="20" height="30" fill="${ref(ctx, 'window')}"/>`
    + `<path d="M-4 30q16 -22 40 -10q20 -18 44 -4q16 -6 12 14V60H-4z" fill="${C.vellum}" opacity=".62"/>`);
  s += tile(4, '燙金', 'gold foil', `<rect width="87" height="56" fill="${C.tile}"/><rect x="8" y="10" width="71" height="36" rx="4" fill="${ref(ctx, 'foil')}"/><text x="43.5" y="35" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="16" fill="${C.foilInk}">金珠珠</text>`);
  s += tile(5, '玻璃紙', 'glassine (gloss)', `<rect width="87" height="56" fill="${ref(ctx, 'tiles')}"/><rect width="87" height="56" fill="${ref(ctx, 'glassine')}"/><path d="M10 0L30 56M48 0L60 56" stroke="${C.standeeCard}" stroke-width="2" opacity=".55"/>`);
  s += tile(6, '瓦楞紙', 'corrugated (props)', `<rect width="87" height="56" fill="${ref(ctx, 'corr')}"/><rect width="87" height="9" fill="${C.corrugatedLip}"/>`);
  s += tile(7, '花磚', 'endpaper motif', `<rect width="87" height="56" fill="${ref(ctx, 'tiles')}"/>`);

  // B. Edges, folds, depth (bible § 2.2, § 3.2)
  s += heading(240, '邊 · 摺 · 層', 'cut edge · crease · stacked depth');
  s += `<rect x="12" y="250" width="160" height="94" rx="3" fill="${C.nightCardDeep}"/>`;
  const depthCards = [C.depth0, C.depth1, C.depth2, C.depth3, C.depth4] as const;
  depthCards.forEach((fill, i) => {
    const x = 20 + i * 22, y = 257 + i * 11;
    s += depth(ctx, i as 0 | 1 | 2 | 3 | 4, `<rect x="${x}" y="${y}" width="70" height="44" rx="2" fill="${fill}"/>`, `<rect x="${x}" y="${y}" width="70" height="44" rx="2"/>`);
    s += label(30 + i * 22, 269 + i * 11, `z${i}`, 'start', 9, C.standeeCard);
  });
  s += label(92, 356, '每層 = 接觸影 + 柔影 + 切邊亮線', 'middle', 9.5);
  s += mountainFold(ctx, 186, 248, 84, 88, 18) + label(228, 356, '山摺 mountain', 'middle', 9.5);
  s += valleyFold(ctx, 284, 252, 84, 88, 18) + label(326, 356, '谷摺 + AO valley', 'middle', 9.5);

  // C. Light on paper at night (bible § 3.3)
  s += heading(376, '夜光', 'light on paper at night');
  const light = (x: number, name: string, inner: string) =>
    `<g transform="${translate(x, 386)}">${card(116, 56, C.nightInk)}${inner}${label(58, 70, name, 'middle', 10.5, C.ink)}</g>`;
  const block = (body: string, outline: string) => depth(ctx, 3, body, outline);
  s += light(12, '月光：冷邊光 + 長影', `<circle cx="22" cy="18" r="9" fill="${C.windowTop}"${filterAttr(ctx, 'glowS')}/>`
    + block(`<path d="M46 56V28l18 -10l18 10v28z" fill="${C.moonFacade}"/>`, `<path d="M46 56V28l18 -10l18 10v28z"/>`)
    + `<path d="M46 28l18 -10" stroke="${C.moonRim}" stroke-width="1.4"/>`);
  s += light(137, '燈：描圖紙透光', `<ellipse cx="58" cy="46" rx="56" ry="22" fill="${ref(ctx, 'lampPool')}"/>`
    + block(`<rect x="34" y="12" width="48" height="40" fill="${C.lampFacade}"/>`, `<rect x="34" y="12" width="48" height="40"/>`)
    + [0, 1, 2].map((i) => `<rect x="${39 + i * 14}" y="18" width="10" height="28" rx="1" fill="${ref(ctx, 'window')}"${filterAttr(ctx, 'glowS')}/>`).join(''));
  s += light(262, '霓虹：發光墨 + 溢色', (ctx.filters
    ? `<rect x="20" y="10" width="76" height="40" rx="6" fill="${C.neonPink}" opacity=".18"${filterAttr(ctx, 'blur8')}/>`
    : `<rect x="14" y="6" width="88" height="46" rx="12" fill="${C.neonPink}" opacity=".12"/>`)
    + `<text x="58" y="40" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="24" fill="${C.neonPink}"${filterAttr(ctx, 'glowS')}>冰果室</text>`);

  // D. The touchables (bible § 4)
  s += heading(476, '機關', 'touchables: marigold card + red verb seal + motion cue');
  s += `<rect x="12" y="484" width="366" height="118" rx="4" fill="${C.nightCardDeep}"/>${pinholes(ctx, 12, 484, 366, 118, 18, 5)}`;
  s += `<g transform="translate(22 496) scale(.78)">${pullTab(ctx, 0, 0, { w: 104, h: 42, track: 30 })}</g>${label(56, 596, '拉 pull-tab', 'middle', 10.5, C.barLabel)}`;
  s += wheel(ctx, 160, 530, 24, { teeth: 16 }) + label(160, 596, '轉 wheel', 'middle', 10.5, C.barLabel);
  s += flap(ctx, 214, 504, 50, 40) + label(240, 596, '翻 flap', 'middle', 10.5, C.barLabel);
  s += slider(ctx, 306, 556, 58, 0.25) + label(336, 596, '推 slider', 'middle', 10.5, C.barLabel);
  s += perch(ctx, 76, 566, 0.8) + label(122, 570, '摩卡停點', 'start', 9, C.chalk);
  s += brad(ctx, 364, 500, 4.5, true) + label(354, 504, '連動', 'end', 9, C.chalk);

  // E. One tab, five states (bible § 4.1)
  s += heading(616, '狀態', 'one tab, five states');
  const state = (x: number, name: string, extra: string, opacity = 1, dy = 0, z: 3 | 5 = 3) =>
    `<g transform="${translate(x, 640 + dy)}"${opacity === 1 ? '' : ` opacity="${opacity}"`}>${extra}`
    + depth(ctx, z, `<rect width="58" height="26" rx="9" fill="${ref(ctx, 'tabG')}"/><rect x="38" y="4" width="14" height="18" rx="3" fill="${ref(ctx, 'ridges')}"/>`, `<rect width="58" height="26" rx="9"/>`)
    + `${seal(ctx, 13, 13, '拉', 8)}</g>${label(x + 29, 682, name, 'middle', 10)}`;
  s += state(14, '待機 idle', `<path d="M-6 4l-5 -3M-7 13h-6M-6 22l-5 3" stroke="${C.marigoldEdge}" stroke-width="1.6" stroke-linecap="round"/>`);
  s += state(88, '提示 hint', ctx.filters
    ? `<rect x="-6" y="-6" width="70" height="38" rx="14" fill="${C.marigold}" opacity=".55"${filterAttr(ctx, 'blur3')}/>`
    : softEllipse(ctx, 29, 13, 34, 18, 'marigold', 0.6));
  s += state(162, '拖曳 drag', '', 1, -5, 5);
  s += state(236, '鎖住 locked', `<g transform="translate(46 -4)"><circle r="8" fill="${C.lockBadge}"/><g transform="translate(0 .6)">${paw(C.chalk, 0.56)}</g></g>`, 0.55);
  s += state(310, '完成 done', `<g transform="translate(64 0)"><circle r="7" fill="${C.doneGreen}" stroke="${C.standeeCard}" stroke-width="1.2"/><path d="M-3 0l2 2.4l4 -4.6" fill="none" stroke="${C.standeeCard}" stroke-width="1.8" stroke-linecap="round"/></g>`, 0.8);

  // F. Printed vs touchable, and the standee (bible § 4, § 5)
  s += heading(702, '裝飾 vs 機關 · 角色立牌', 'printed vs touchable · standee');
  s += `<g transform="translate(14 712)"><rect width="176" height="84" rx="3" fill="${C.nightCardDeep}"/>`
    + `<g transform="translate(14 22)"><rect width="56" height="22" rx="6" fill="${C.ochre}"/><rect x="10" y="-10" width="30" height="12" rx="3" fill="${C.ochreDark}"/><circle cx="12" cy="24" r="5" fill="${C.printDark}"/><circle cx="44" cy="24" r="5" fill="${C.printDark}"/></g>`
    + label(42, 78, '印刷・無印章', 'middle', 9.5, C.stickerLabel)
    + `<g transform="translate(100 18) scale(.6)">${pullTab(ctx, 0, 0, { w: 100, h: 40, track: 10, ticks: false })}</g>`
    + label(134, 78, '機關・金盞黃+印章', 'middle', 9.5, C.marigoldLight) + `</g>`;
  s += `<g transform="translate(200 712)"><rect width="176" height="84" rx="3" fill="${C.nightCard}"/>`
    + (sprites.mochaSit ? `<image href="${sprites.mochaSit}" x="14" y="6" width="30" height="58"/>` : '')
    + label(30, 78, '原圖', 'middle', 8.5, C.stickerLabel)
    + (sprites.mochaSit ? standee(ctx, sprites.mochaSit, 80, 64, 58, 92 / 176, { shadowW: 22 }) : '')
    + label(80, 78, '立牌', 'middle', 8.5, C.stickerLabel)
    + (sprites.crawl ? standee(ctx, sprites.crawl, 140, 64, 52, 225 / 237, { glow: true, easel: false, shadowW: 40 }) : '')
    + label(140, 78, '爬行', 'middle', 8.5, C.stickerLabel) + `</g>`;

  // G. The chapter colour clock (bible § 3.3)
  s += STRIP.map((chapter, i) => {
    const sky = POPUP_CHAPTER_CLOCK[chapter];
    return `<rect x="${f1(14 + i * 40.6)}" y="823" width="38" height="18" rx="2" fill="${ref(ctx, `ch${chapter}`)}"/>`
      + `<text x="${f1(33 + i * 40.6)}" y="819" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="8.5" fill="${C.inkSoft}">${sky.label} ${sky.time}</text>`;
  }).join('');

  return s + grain(ctx, 390, 844, 0.3);
}
