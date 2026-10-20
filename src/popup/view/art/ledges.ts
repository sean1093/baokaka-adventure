import { POPUP as C, POPUP_HOME as H, POPUP_STATION as T, mixHex } from '../../../art/palette';
import { depth, f1, ref, softEllipse, type KitCtx } from '../../art';
import { PAGE_W, towardVp } from '../geometry';
import { LEDGE_DEPTH, type LedgeRun } from '../stage';
import type { ForegroundCard, LedgeStyle } from './dress';
import { ledge as plainLedge, pottedPlant, type StageTheme } from './placeholders';

/**
 * The dressed ledges and foreground cards (#108): what a page's walkable runs are made of once its
 * own art is in (`dress.ts`). Live SVG with flat fills (GDD § 3.9: the ledges are part of the
 * animated budget's static layers), in the bible's paper language — every ledge is a paper box
 * whose top recedes toward the vanishing point, with its cut-edge rim and stacked shadow
 * (`depth`), its inner side face showing toward the page centre.
 */

/** The box's geometry: its top face, its inner side face (or none) and its front rectangle. */
function box(run: LedgeRun) {
  const { x0, x1, y } = run;
  const t = LEDGE_DEPTH;
  const [ax, ay] = towardVp([x0, y]);
  const [bx] = towardVp([x1, y]);
  const top = `M${ax} ${ay}H${bx}L${x1} ${y}H${x0}Z`;
  const inner = x1 < PAGE_W / 2 + 40 && !run.toRight ? x1 : x0 > PAGE_W / 2 - 40 && !run.toLeft ? x0 : null;
  const side = inner === null ? null : (() => {
    const [sx, sy] = towardVp([inner, y]);
    const [lx, ly] = towardVp([inner, y + t]);
    return `M${inner} ${y}L${sx} ${sy}L${lx} ${ly}L${inner} ${y + t}Z`;
  })();
  return { x0, x1, y, t, ax, ay, bx, top, side, front: `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${t}"/>` };
}

const rim = (x0: number, x1: number, y: number, o = 0.6) => `<path d="M${x0} ${y + 0.5}H${x1}" stroke="${C.cutRim}" stroke-width="1" opacity="${o}"/>`;

/** 巧拼: a pile of two thick foam play-mat slabs, pastel tiles interlocking along each one. */
function playmat(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  // Dusky pastels in the lamplight: calm under the squint test (bible § 4.2), so the touchables and standees lead
  const tiles = [H.matPink, H.matMint, H.matSky, H.matLilac, H.matCream].map((c) => mixHex(c, H.wallMid, 0.36));
  const tw = 46;
  const slab = b.t / 2;
  // One path per colour (front tiles and top tiles), so the ledge stays a handful of nodes
  const face = tiles.map(() => '');
  const top = tiles.map(() => '');
  let teeth = '';
  for (let r = 0; r < 2; r++) {
    const y0 = b.y + r * slab;
    const off = r % 2 ? tw * 0.4 : 0;
    for (let i = -1, x = b.x0 - off; x < b.x1; i++, x += tw) {
      const xa = Math.max(b.x0, x), xb = Math.min(b.x1, x + tw);
      if (xb <= xa) continue;
      face[(i + 7 + r * 2) % tiles.length] += `M${f1(xa)} ${f1(y0)}H${f1(xb)}V${f1(y0 + slab)}H${f1(xa)}Z`;
      // The jigsaw seam: a little tab biting into the next tile
      if (x + tw < b.x1 - 4) teeth += `M${f1(x + tw)} ${f1(y0)}V${f1(y0 + slab * 0.28)}h3.5v${f1(slab * 0.44)}h-3.5V${f1(y0 + slab)}`;
    }
    teeth += `M${b.x0} ${f1(y0 + slab - 0.6)}H${b.x1}`;
  }
  for (let i = 0, x = b.x0; x < b.x1; i++, x += tw) {
    const xb = Math.min(b.x1, x + tw);
    const [p, q] = [towardVp([x, b.y]), towardVp([xb, b.y])];
    top[(i + 7) % tiles.length] += `M${p[0]} ${p[1]}H${q[0]}L${f1(xb)} ${b.y}H${f1(x)}Z`;
  }
  const side = b.side ? `<path d="${b.side}" fill="${mixHex(H.matLilac, H.matCut, 0.45)}"/>` : '';
  const body = side + tiles.map((c, i) => (face[i] ? `<path d="${face[i]}" fill="${c}"/>` : '')).join('')
    + `<path d="${teeth}" fill="none" stroke="${H.matCut}" stroke-width="1" opacity=".38"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="5" fill="${C.shadow}" opacity=".12"/>`
    + tiles.map((c, i) => (top[i] ? `<path d="${top[i]}" fill="${mixHex(c, C.cutRim, 0.16)}"/>` : '')).join('')
    + `<path d="M${b.ax} ${b.ay}H${b.bx}" stroke="${H.matCut}" stroke-width=".8" opacity=".35"/>` + rim(b.x0, b.x1, b.y, 0.7);
  return depth(ctx, 4, body, `${b.side ? `<path d="${b.side}"/>` : ''}${b.front}<path d="${b.top}"/>`);
}

/** The crib: a gingham-sheeted mattress on top, the slatted pine side in front. */
function crib(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  const checks = Array.from({ length: Math.ceil((b.x1 - b.x0) / 10) }, (_, i) => `M${f1(b.x0 + 5 + i * 10)} ${b.y - 1}l-.4 ${f1(b.ay - b.y + 2)}`).join('');
  const top = `<path d="${b.top}" fill="${H.sheet}"/><path d="${checks}" stroke="${H.sheetCheck}" stroke-width="4" opacity=".55"/>`
    + `<path d="M${b.ax} ${f1((b.ay + b.y) / 2)}H${b.bx}" stroke="${H.sheetCheck}" stroke-width="3" opacity=".45"/>`;
  // The mattress edge (a plump band), then the rails and the slats over the sheet's shadow
  const mattress = `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="12" fill="${H.sheet}"/><rect x="${b.x0}" y="${b.y + 9}" width="${b.x1 - b.x0}" height="3" fill="${H.sheetShade}" opacity=".7"/>`;
  const back = `<rect x="${b.x0}" y="${b.y + 12}" width="${b.x1 - b.x0}" height="${b.t - 12}" fill="${mixHex(H.sheetShade, C.shadow, 0.35)}"/>`;
  let slats = '';
  for (let x = b.x0 + 14; x < b.x1 - 8; x += 15) slats += `M${f1(x)} ${b.y + 8}h6v${b.t - 16}h-6z`;
  const rails = `<rect x="${b.x0}" y="${b.y + 4}" width="${b.x1 - b.x0}" height="7" rx="2" fill="${H.pine}"/>`
    + `<rect x="${b.x0}" y="${b.y + b.t - 10}" width="${b.x1 - b.x0}" height="10" rx="2" fill="${H.pineDeep}"/>`
    + `<path d="${slats}" fill="${H.pine}"/><path d="${slats.replace(/h6/g, 'h1.4')}" fill="${C.cutRim}" opacity=".35"/>`;
  const posts = [b.x0 + 2, b.x1 - 10].map((x) => `<rect x="${f1(x)}" y="${b.y - 4}" width="9" height="${b.t + 4}" rx="2.5" fill="${H.pineDeep}"/><circle cx="${f1(x + 4.5)}" cy="${b.y - 5}" r="5" fill="${H.pine}"/>`).join('');
  const side = b.side ? `<path d="${b.side}" fill="${H.pineShade}"/>` : '';
  return depth(ctx, 4, side + back + top + mattress + rails + posts + rim(b.x0, b.x1, b.y + 4, 0.5), `${b.side ? `<path d="${b.side}"/>` : ''}${b.front}<path d="${b.top}"/>`);
}

/** The 板南線 car's body in cut-away: the lino floor on top, the side skirt with its blue band and bogies in front. */
function carBody(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  const top = `<path d="${b.top}" fill="${T.floorLino}"/>`
    + `<path d="${Array.from({ length: Math.ceil((b.x1 - b.x0) / 34) }, (_, i) => `M${f1(b.x0 + 17 + i * 34)} ${b.y}l-.3 ${f1(b.ay - b.y)}`).join('')}" stroke="${T.floorLinoDeep}" stroke-width=".8" opacity=".5"/>`;
  const skirt = `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t - 10}" fill="${T.steel}"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="4" fill="${T.steelDeep}" opacity=".5"/>`
    + `<rect x="${b.x0}" y="${b.y + 12}" width="${b.x1 - b.x0}" height="9" fill="${T.bannan}"/>`
    + `<rect x="${b.x0}" y="${b.y + 22}" width="${b.x1 - b.x0}" height="2" fill="${T.bannanDeep}"/>`
    + `<rect x="${b.x0}" y="${b.y + b.t - 12}" width="${b.x1 - b.x0}" height="4" fill="${T.steelDeep}"/>`;
  // Two bogies under the car: a dark frame and two wheels each
  let bogies = '';
  const span = b.x1 - b.x0;
  for (const k of [0.2, 0.8]) {
    const cx = b.x0 + span * k;
    bogies += `<rect x="${f1(cx - 34)}" y="${b.y + b.t - 10}" width="68" height="9" rx="3" fill="${C.printDark}"/>`
      + [-20, 20].map((d) => `<circle cx="${f1(cx + d)}" cy="${b.y + b.t - 1}" r="9" fill="${C.printDark}"/><circle cx="${f1(cx + d)}" cy="${b.y + b.t - 1}" r="4" fill="${T.steelDeep}"/>`).join('');
  }
  const side = b.side ? `<path d="${b.side}" fill="${T.steelDeep}"/>` : '';
  return depth(ctx, 4, side + bogies + skirt + top + rim(b.x0, b.x1, b.y, 0.7), `${b.side ? `<path d="${b.side}"/>` : ''}${b.front}<path d="${b.top}"/>`);
}

/** The concourse's granite walkway box: polished slabs, an ochre tactile strip, block joints in front. */
function granite(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let joints = '';
  for (let r = 0; r < 2; r++) {
    joints += `M${b.x0} ${b.y + 18 + r * 17}H${b.x1}`;
    for (let x = b.x0 + (r % 2 ? 31 : 0); x < b.x1; x += 62) joints += `M${f1(x)} ${b.y + 1 + r * 17}v17`;
  }
  joints += `M${b.x0} ${b.y + 1 + 2 * 17}v0`;
  for (let x = b.x0 + 15; x < b.x1; x += 62) joints += `M${f1(x)} ${b.y + 35}v17`;
  const body = (b.side ? `<path d="${b.side}" fill="${T.graniteDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${ref(ctx, 'graniteFace')}"/>`
    + `<path d="${joints}" stroke="${T.graniteDeep}" stroke-width="1" opacity=".55"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="6" fill="${C.shadow}" opacity=".18"/>`
    + `<path d="${b.top}" fill="${T.graniteLight}"/>`
    + `<path d="M${b.ax} ${b.ay}H${b.bx}" stroke="${T.graniteDeep}" stroke-width="1" opacity=".5"/>`
    + `<path d="M${b.x0} ${b.y - 2.5}H${b.x1}" stroke="${C.ochre}" stroke-width="4.5"/>`
    + `<path d="M${b.x0 + 4} ${b.y - 2.5}H${b.x1}" stroke="${C.ochreDark}" stroke-width="1.8" stroke-dasharray="0 6" stroke-linecap="round"/>`
    + rim(b.x0, b.x1, b.y, 0.55);
  return `<defs><linearGradient id="${ctx.id('graniteFace')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.granite}"/><stop offset="1" stop-color="${mixHex(T.granite, T.graniteDeep, 0.6)}"/></linearGradient></defs>`
    + depth(ctx, 4, body, `${b.side ? `<path d="${b.side}"/>` : ''}${b.front}<path d="${b.top}"/>`);
}

/** The bento shop's floor in cross-section: cream tiles on top, the cut slab (hatched) in front. */
function shopFloor(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  const tiles = Array.from({ length: Math.ceil((b.x1 - b.x0) / 18) }, (_, i) => `M${f1(b.x0 + i * 18)} ${b.y}l-.4 ${f1(b.ay - b.y)}`).join('');
  let hatch = '';
  for (let x = b.x0 - b.t; x < b.x1; x += 9) hatch += `M${f1(Math.max(b.x0, x))} ${f1(b.y + 12 + Math.max(0, b.x0 - x))}L${f1(Math.min(b.x1, x + b.t - 12))} ${f1(b.y + 12 + Math.min(b.t - 12, b.x1 - x))}`;
  const body = (b.side ? `<path d="${b.side}" fill="${T.sandDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${T.sandShade}"/>`
    + `<path d="${hatch}" stroke="${T.sandDeep}" stroke-width="1" opacity=".5"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="12" fill="${T.shopTile}"/><path d="M${b.x0} ${b.y + 12}H${b.x1}" stroke="${T.sandDeep}" stroke-width="1.4"/>`
    + `<path d="${b.top}" fill="${T.shopTile}"/><path d="${tiles}" stroke="${T.shopTileLine}" stroke-width=".8"/>`
    + rim(b.x0, b.x1, b.y, 0.7);
  return depth(ctx, 4, body, `${b.side ? `<path d="${b.side}"/>` : ''}${b.front}<path d="${b.top}"/>`);
}

/** The balcony's grey terrazzo slab: a tiled top, a concrete front with a drip line and a drain spout. */
function balcony(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  const tiles = Array.from({ length: Math.ceil((b.x1 - b.x0) / 22) }, (_, i) => `M${f1(b.x0 + i * 22)} ${b.y}l-.4 ${f1(b.ay - b.y)}`).join('');
  const body = (b.side ? `<path d="${b.side}" fill="${C.printLilacDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(C.printLilac, C.shadow, 0.18)}"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="8" fill="${C.printLilac}"/><path d="M${b.x0} ${b.y + 8}H${b.x1}" stroke="${C.printLilacDeep}" stroke-width="1.2"/>`
    + `<rect x="${b.x0}" y="${b.y + b.t - 8}" width="${b.x1 - b.x0}" height="8" fill="${C.shadow}" opacity=".2"/>`
    + `<rect x="${f1((b.x0 + b.x1) / 2 - 4)}" y="${b.y + 14}" width="8" height="6" rx="1.5" fill="${C.printDark}" opacity=".6"/>`
    + `<path d="${b.top}" fill="${C.printLilac}"/><path d="${tiles}" stroke="${C.printLilacDeep}" stroke-width=".8" opacity=".7"/>`
    + rim(b.x0, b.x1, b.y, 0.6);
  return depth(ctx, 4, body, `${b.side ? `<path d="${b.side}"/>` : ''}${b.front}<path d="${b.top}"/>`);
}

/** The crib's pillow (a single-node ledge at home): a plump gingham pillow lying on the slope. */
function pillow(ctx: KitCtx, x: number, y: number): string {
  const d = `M${x - 34} ${y + 4}Q${x - 38} ${y - 10} ${x - 24} ${y - 11}Q${x} ${y - 16} ${x + 24} ${y - 11}Q${x + 38} ${y - 10} ${x + 34} ${y + 4}Q${x + 38} ${y + 20} ${x + 24} ${y + 22}Q${x} ${y + 26} ${x - 24} ${y + 22}Q${x - 38} ${y + 20} ${x - 34} ${y + 4}Z`;
  const checks = Array.from({ length: 7 }, (_, i) => `M${x - 27 + i * 9} ${y - 12}V${y + 23}`).join('') + `M${x - 34} ${y + 1}H${x + 34}M${x - 34} ${y + 12}H${x + 34}`;
  const clip = ctx.id(`pillow${x}`);
  return `<clipPath id="${clip}"><path d="${d}"/></clipPath>`
    + depth(ctx, 4, `<path d="${d}" fill="${H.sheet}"/><g clip-path="url(#${clip})"><path d="${checks}" stroke="${H.sheetCheck}" stroke-width="4" opacity=".5"/>`
      + `<path d="M${x - 40} ${y + 14}Q${x} ${y + 30} ${x + 40} ${y + 14}V${y + 30}H${x - 40}Z" fill="${H.sheetShade}" opacity=".5"/></g>`
      + `<path d="M${x - 22} ${y - 9}Q${x} ${y - 13} ${x + 22} ${y - 9}" stroke="${C.cutRim}" stroke-width="1.4" fill="none" opacity=".7"/>`, `<path d="${d}"/>`);
}

/** A ledge in its page's material (`dress.ts`): the dressed styles here, brick and rug from the placeholder stage. */
export function styledLedge(ctx: KitCtx, run: LedgeRun, style: LedgeStyle, theme: StageTheme): string {
  if (run.single) return style === 'playmat' || style === 'crib' ? pillow(ctx, (run.x0 + run.x1) / 2, run.y) : plainLedge(ctx, run, theme);
  switch (style) {
    case 'balcony':
      return balcony(ctx, run);
    case 'playmat':
      return playmat(ctx, run);
    case 'crib':
      return crib(ctx, run);
    case 'carBody':
      return carBody(ctx, run);
    case 'granite':
      return granite(ctx, run);
    case 'shopFloor':
      return shopFloor(ctx, run);
    case 'brick':
      return plainLedge(ctx, run, 'city');
    case 'rug':
      return plainLedge(ctx, run, 'room');
  }
}

/**
 * A run in its page's dress: one material, or two either side of the dress's `ledgeSplit` (each
 * drawn whole and clipped to its side, so the box's shadow and rim stay continuous).
 */
export function dressedLedge(ctx: KitCtx, run: LedgeRun, styleOf: (y: number) => LedgeStyle, theme: StageTheme, split?: { x: number; style: LedgeStyle }): string {
  const main = styleOf(run.y);
  if (split === undefined || run.single || split.x <= run.x0 || split.x >= run.x1) return styledLedge(ctx, run, main, theme);
  const [a, b] = [ctx.id(`ledgeL${run.y}`), ctx.id(`ledgeR${run.y}`)];
  return `<clipPath id="${a}"><rect x="-200" y="-200" width="${split.x + 200}" height="1200"/></clipPath><clipPath id="${b}"><rect x="${split.x}" y="-200" width="800" height="1200"/></clipPath>`
    + `<g clip-path="url(#${a})">${styledLedge(ctx, run, main, theme)}</g><g clip-path="url(#${b})">${styledLedge(ctx, run, split.style, theme)}</g>`;
}

/** A stack of three wooden ㄅㄆㄇ blocks (home's foreground card), its foot at the origin. */
function blocks(ctx: KitCtx): string {
  const cube = (x: number, y: number, s: number, face: string, glyph: string, rot: number) => {
    const d = `M0 0h${s}v${s}h${-s}z`;
    const topD = `M0 0l6 -6h${s}l-6 6z`;
    const sideD = `M${s} 0l6 -6v${s}l-6 6z`;
    return `<g transform="translate(${x} ${y}) rotate(${rot})">`
      + depth(ctx, 5, `<path d="${d}" fill="${H.pine}"/><path d="${topD}" fill="${mixHex(H.pine, C.cutRim, 0.35)}"/><path d="${sideD}" fill="${H.pineDeep}"/>`
        + `<rect x="4" y="4" width="${s - 8}" height="${s - 8}" rx="3" fill="${face}"/>`
        + `<text data-art-text="" x="${s / 2}" y="${s / 2 + 7}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${f1(s * 0.5)}" fill="${C.cutRim}">${glyph}</text>`, `<path d="${d}"/>`)
      + `</g>`;
  };
  return softEllipse(ctx, 2, 0, 40, 6, 'shadow', 0.4)
    + cube(-36, -32, 32, H.blockRed, 'ㄅ', -4) + cube(2, -32, 32, H.blockBlue, 'ㄆ', 3) + cube(-18, -64, 32, H.blockGreen, 'ㄇ', -2);
}

/** A little suitcase with a paper luggage tag (the station's foreground card), its foot at the origin. */
function luggage(ctx: KitCtx): string {
  const d = 'M-30 -62h60a6 6 0 0 1 6 6v50a6 6 0 0 1 -6 6h-60a6 6 0 0 1 -6 -6v-50a6 6 0 0 1 6 -6z';
  // Drawn a little left of the slot's centre and smaller, so its tag stays on the page
  return `<g transform="translate(-10 0) scale(.86)">` + softEllipse(ctx, 2, 0, 40, 6, 'shadow', 0.4)
    + depth(ctx, 5, `<path d="M-12 -62v-10a4 4 0 0 1 4 -4h16a4 4 0 0 1 4 4v10" fill="none" stroke="${C.printDark}" stroke-width="4"/>`
      + `<path d="${d}" fill="${T.navyLight}"/><path d="M-36 -40h72M-36 -22h72" stroke="${T.navy}" stroke-width="2.4"/>`
      + `<rect x="-36" y="-62" width="72" height="5" fill="${C.cutRim}" opacity=".18"/>`
      // Travel stickers: a moon and a little 101, printed (no marigold)
      + `<circle cx="-16" cy="-48" r="7" fill="${T.sandLight}"/><path d="M-18 -52a5 5 0 1 0 5 7a4 4 0 1 1 -5 -7z" fill="${T.navy}"/>`
      + `<rect x="8" y="-34" width="18" height="10" rx="2" fill="${T.priority}"/>`, `<path d="${d}"/>`)
    + `<path d="M26 -58q8 6 6 18" fill="none" stroke="${T.sandDeep}" stroke-width="1"/>`
    + depth(ctx, 5, `<path d="M26 -40l12 -4l4 14l-12 4z" fill="${T.sandLight}"/><circle cx="30.5" cy="-38" r="1.4" fill="${T.sandDeep}"/>`, `<path d="M26 -40l12 -4l4 14l-12 4z"/>`) + `</g>`;
}

/** The near-corner foreground card for a dress (bible § 2.2), its foot at the origin. */
export function foregroundCard(ctx: KitCtx, kind: ForegroundCard): string {
  switch (kind) {
    case 'blocks':
      return blocks(ctx);
    case 'luggage':
      return luggage(ctx);
    case 'plant':
      return pottedPlant(ctx);
  }
}

