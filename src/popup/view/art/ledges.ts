import { POPUP as C, POPUP_AIRPORT as A, POPUP_CAMPUS as K, POPUP_HOME as H, POPUP_MAOKONG as G, POPUP_MARKET as M, POPUP_NEON as N, POPUP_PARK as P, POPUP_STATION as T, mixHex } from '../../../art/palette';
import { depth, f1, ref, seeded, softEllipse, type KitCtx } from '../../art';
import { PAGE_W, towardVp } from '../geometry';
import { LEDGE_DEPTH, type LedgeRun, type Slope } from '../stage';
import type { ForegroundCard, LedgeStyle } from './dress';
import { ledge as plainLedge, pottedPlant, ramp as plainRamp, type StageTheme } from './placeholders';

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

/** A 月亮線 car's body in cut-away: the lino floor on top, the side skirt with its line's band (板南 blue, 信義 red) and bogies in front. */
function carBody(ctx: KitCtx, run: LedgeRun, band: string = T.bannan, bandDeep: string = T.bannanDeep): string {
  const b = box(run);
  const top = `<path d="${b.top}" fill="${T.floorLino}"/>`
    + `<path d="${Array.from({ length: Math.ceil((b.x1 - b.x0) / 34) }, (_, i) => `M${f1(b.x0 + 17 + i * 34)} ${b.y}l-.3 ${f1(b.ay - b.y)}`).join('')}" stroke="${T.floorLinoDeep}" stroke-width=".8" opacity=".5"/>`;
  const skirt = `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t - 10}" fill="${T.steel}"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="4" fill="${T.steelDeep}" opacity=".5"/>`
    + `<rect x="${b.x0}" y="${b.y + 12}" width="${b.x1 - b.x0}" height="9" fill="${band}"/>`
    + `<rect x="${b.x0}" y="${b.y + 22}" width="${b.x1 - b.x0}" height="2" fill="${bandDeep}"/>`
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

/** Grass tufts along a line (the lawn spilling over a path's edges), as one path of short blades. */
function tufts(x0: number, x1: number, y: number, seed: number, h = 5, every = 3.2): string {
  const r = seeded(seed);
  let d = '';
  for (let x = x0 + r() * every; x < x1; x += every * (0.6 + r() * 0.8)) {
    const hh = h * (0.5 + r());
    d += `M${f1(x)} ${f1(y + 1)}l${f1((r() - 0.5) * 3)} ${f1(-hh)}`;
  }
  return d;
}

/**
 * 大安森林公園's paths (#115): a granite-paver walkway box edged with lawn. The top is grey pavers in
 * courses receding toward the vanishing point; the front a curb stone over the cut earth (roots and
 * pebbles in it); grass tufts spill over both the back and the front edges.
 */
function parkPath(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  const r = seeded(Math.round(b.x0 * 7 + b.y));
  let joints = '';
  for (let x = b.x0 + 14; x < b.x1; x += 24) {
    const p = towardVp([x, b.y]);
    joints += `M${f1(x)} ${b.y}L${f1(p[0])} ${f1(p[1])}`;
  }
  const mid = (b.y + b.ay) / 2;
  const ml = towardVp([b.x0, b.y], 0.01);
  joints += `M${f1(ml[0])} ${f1(mid)}H${f1(b.x1 - (ml[0] - b.x0))}`;
  let roots = '';
  for (let x = b.x0 + 10; x < b.x1 - 6; x += 18 + r() * 22) {
    roots += `M${f1(x)} ${b.y + 12}q${f1(4 + r() * 6)} ${f1(8 + r() * 10)} ${f1(-2 + r() * 10)} ${f1(18 + r() * 14)}`;
  }
  let pebbles = '';
  for (let i = 0; i < (b.x1 - b.x0) / 9; i++) pebbles += `<ellipse cx="${f1(b.x0 + r() * (b.x1 - b.x0))}" cy="${f1(b.y + 16 + r() * (b.t - 22))}" rx="${f1(1.4 + r() * 2.2)}" ry="${f1(1 + r() * 1.4)}"/>`;
  const body = (b.side ? `<path d="${b.side}" fill="${mixHex(P.soil, C.shadow, 0.3)}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${ref(ctx, 'soilFace')}"/>`
    + `<path d="${tufts(b.x0, b.x1, b.y + 22, Math.round(b.x0 + 3), 7, 3)}${tufts(b.x0, b.x1, b.y + 34, Math.round(b.x0 + 5), 6, 4)}" stroke="${P.lawn}" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>`
    + `<path d="${roots}" stroke="${P.trunk}" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round" transform="translate(0 14)"/>`
    + `<g fill="${P.paverDeep}" opacity=".55">${pebbles}</g>`
    // The curb stone along the front edge
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="9" fill="${P.curb}"/><path d="M${b.x0} ${b.y + 9}H${b.x1}" stroke="${C.shadow}" stroke-width="1.4" opacity=".35"/>`
    + `<path d="${b.top}" fill="${ref(ctx, 'paverTop')}"/><path d="${joints}" stroke="${P.paverDeep}" stroke-width=".8" opacity=".55"/>`
    // Lawn tufts over the back edge and the front curb
    + `<path d="${tufts(b.ax, b.bx, b.ay + 1, Math.round(b.x0 + b.y), 4)}" stroke="${P.lawnLight}" stroke-width="1.2" stroke-linecap="round"/>`
    + `<path d="${tufts(b.x0, b.x1, b.y + 1, Math.round(b.x1 + b.y), 6, 4.4)}" stroke="${P.lawn}" stroke-width="1.4" stroke-linecap="round"/>`
    + `<path d="${tufts(b.x0, b.x1, b.y + 1, Math.round(b.x1 * 3 + b.y), 4.5, 6)}" stroke="${P.canopyLit}" stroke-width="1" stroke-linecap="round" opacity=".7"/>`
    + rim(b.x0, b.x1, b.y, 0.5);
  return `<defs><linearGradient id="${ctx.id('soilFace')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.lawn}"/><stop offset=".45" stop-color="${P.lawnDeep}"/><stop offset="1" stop-color="${mixHex(P.soil, C.shadow, 0.4)}"/></linearGradient>`
    + `<linearGradient id="${ctx.id('paverTop')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mixHex(P.paver, C.shadow, 0.25)}"/><stop offset="1" stop-color="${P.paverLight}"/></linearGradient></defs>`
    + depth(ctx, 4, body, `${b.side ? `<path d="${b.side}"/>` : ''}${b.front}<path d="${b.top}"/>`);
}

/** The eco-pond's boardwalk (#115): planks on top, the edge beam in front, posts standing down into dark water. */
function boardwalk(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let planks = '';
  for (let x = b.x0 + 11; x < b.x1; x += 11) {
    const p = towardVp([x, b.y]);
    planks += `M${f1(x)} ${b.y}L${f1(p[0])} ${f1(p[1])}`;
  }
  let posts = '';
  for (let x = b.x0 + 16; x < b.x1 - 6; x += 44) posts += `M${f1(x)} ${b.y + 12}h8v${b.t - 12}h-8z`;
  const body = (b.side ? `<path d="${b.side}" fill="${P.plankDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y + 12}" width="${b.x1 - b.x0}" height="${b.t - 12}" fill="${mixHex(P.waterDeep, C.shadow, 0.35)}"/>`
    + `<path d="${posts}" fill="${P.plankDeep}"/><path d="${posts.replace(/h8/g, 'h2')}" fill="${C.cutRim}" opacity=".18"/>`
    + `<rect x="${b.x0}" y="${b.y + b.t - 10}" width="${b.x1 - b.x0}" height="10" fill="${P.waterLight}" opacity=".18"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="12" fill="${P.plank}"/><path d="M${b.x0} ${b.y + 12}H${b.x1}" stroke="${C.shadow}" stroke-width="1.6" opacity=".4"/>`
    + `<path d="${b.top}" fill="${ref(ctx, 'plankTop')}"/><path d="${planks}" stroke="${P.plankDeep}" stroke-width=".9" opacity=".6"/>`
    + rim(b.x0, b.x1, b.y, 0.55);
  return `<defs><linearGradient id="${ctx.id('plankTop')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mixHex(P.plank, C.shadow, 0.25)}"/><stop offset="1" stop-color="${P.plankLight}"/></linearGradient></defs>`
    + depth(ctx, 4, body, `${b.side ? `<path d="${b.side}"/>` : ''}${b.front}<path d="${b.top}"/>`);
}

/** The bandshell's stage (#115): boards on top, a dark painted apron with a lit lip and small footlights in front. */
function stage(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let boards = '';
  for (let x = b.x0 + 9; x < b.x1; x += 9) {
    const p = towardVp([x, b.y]);
    boards += `M${f1(x)} ${b.y}L${f1(p[0])} ${f1(p[1])}`;
  }
  let lights = '';
  for (let x = b.x0 + 22; x < b.x1 - 10; x += 34) lights += softEllipse(ctx, x, b.y + 8, 7, 4, 'lamp', 0.32) + `<rect x="${f1(x - 4)}" y="${b.y + 5}" width="8" height="5" rx="2" fill="${C.lampHot}"/>`;
  let panels = '';
  for (let x = b.x0 + 8; x < b.x1 - 30; x += 46) panels += `M${f1(x)} ${b.y + 18}h38v${b.t - 26}h-38z`;
  const body = (b.side ? `<path d="${b.side}" fill="${P.stageDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(P.stageDeep, T.navy, 0.3)}"/>`
    + `<path d="${panels}" fill="none" stroke="${P.stage}" stroke-width="1.2" opacity=".45"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="12" fill="${P.stageDeep}"/>` + lights
    + `<path d="${b.top}" fill="${P.stageLight}"/><path d="${boards}" stroke="${P.stage}" stroke-width=".9" opacity=".7"/>`
    + rim(b.x0, b.x1, b.y, 0.6);
  return depth(ctx, 4, body, `${b.side ? `<path d="${b.side}"/>` : ''}${b.front}<path d="${b.top}"/>`);
}

/**
 * The park's little arched bridge (a single-node ledge on a park page, #115): a wooden deck on a
 * stone arch over the stream, its ends meeting the plank ramps either side (`styledRamp`).
 */
function archBridge(ctx: KitCtx, x: number, y: number): string {
  const w = 44;
  const deck = `M${x - w} ${y}H${x + w}V${y + 10}H${x - w}Z`;
  const arch = `M${x - w + 4} ${y + 10}H${x + w - 4}V${y + 46}H${x + 26}Q${x} ${y + 18} ${x - 26} ${y + 46}H${x - w + 4}Z`;
  const ta = towardVp([x - w, y]);
  const tb = towardVp([x + w, y]);
  let planks = '';
  for (let px = x - w + 8; px < x + w; px += 8) {
    const p = towardVp([px, y]);
    planks += `M${px} ${y}L${f1(p[0])} ${f1(p[1])}`;
  }
  let stones = '';
  for (let r = 0; r < 3; r++) for (let sx = x - w + 4 + (r % 2) * 9; sx < x + w - 4; sx += 18) stones += `M${sx} ${y + 10 + r * 12}v12`;
  return depth(ctx, 4, `<path d="${arch}" fill="${P.curb}"/><path d="${stones}M${x - w + 4} ${y + 22}H${x + w - 4}M${x - w + 4} ${y + 34}H${x + w - 4}" stroke="${P.paverDeep}" stroke-width=".9" opacity=".55"/>`
    + `<path d="M${x - 26} ${y + 46}Q${x} ${y + 18} ${x + 26} ${y + 46}" stroke="${C.shadow}" stroke-width="3" fill="none" opacity=".35"/>`
    + `<path d="M${ta[0]} ${ta[1]}H${tb[0]}L${x + w} ${y}H${x - w}Z" fill="${P.plankLight}"/><path d="${planks}" stroke="${P.plankDeep}" stroke-width=".8" opacity=".6"/>`
    + `<path d="${deck}" fill="${P.plank}"/>` + rim(x - w, x + w, y, 0.6), `<path d="${arch}"/><path d="${deck}"/>`);
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

// ——— 台灣大學 (#117) ———

/** Box parts shared by the campus styles: the side face, the front rectangle and the outline. */
const boxOutline = (b: ReturnType<typeof box>) => `${b.side ? `<path d="${b.side}"/>` : ''}${b.front}<path d="${b.top}"/>`;

/** Joints on a ledge top receding toward the vanishing point, every `every` units. */
function topJoints(b: ReturnType<typeof box>, every: number): string {
  let d = '';
  for (let x = b.x0 + every / 2; x < b.x1; x += every) {
    const p = towardVp([x, b.y]);
    d += `M${f1(x)} ${b.y}L${f1(p[0])} ${f1(p[1])}`;
  }
  return d;
}

/**
 * The campus walks (椰林大道, 傅鐘's plaza): rose-grey pavers on top, a granite curb in front over
 * the lawn's cut edge, a row of clipped azaleas spilling over the front.
 */
function campusPath(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  const r = seeded(Math.round(b.x0 * 5 + b.y));
  let blooms = '';
  for (let x = b.x0 + 4; x < b.x1 - 3; x += 5 + r() * 6) blooms += `<circle cx="${f1(x)}" cy="${f1(b.y + 30 + r() * 12)}" r="${f1(1.4 + r() * 1.4)}"/>`;
  const hedge = `M${b.x0} ${b.y + b.t}V${b.y + 28}` + Array.from({ length: Math.ceil((b.x1 - b.x0) / 12) }, (_, i) => `q6 ${f1(-6 - r() * 4)} ${f1(Math.min(12, b.x1 - b.x0 - i * 12))} 0`).join('') + `V${b.y + b.t}Z`;
  const body = (b.side ? `<path d="${b.side}" fill="${mixHex(K.lawnDeep, C.shadow, 0.3)}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(K.lawnDeep, C.shadow, 0.25)}"/>`
    + `<path d="${hedge}" fill="${K.azaleaLeaf}"/><g fill="${K.azalea}" opacity=".7">${blooms}</g>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="12" fill="${K.curb}"/><path d="${Array.from({ length: Math.ceil((b.x1 - b.x0) / 30) }, (_, i) => `M${f1(b.x0 + 30 * (i + 1))} ${b.y}v12`).join('')}" stroke="${K.paverDeep}" stroke-width=".8" opacity=".6"/>`
    + `<path d="M${b.x0} ${b.y + 12}H${b.x1}" stroke="${C.shadow}" stroke-width="1.6" opacity=".35"/>`
    + `<path d="${b.top}" fill="${K.paverLight}"/><path d="${topJoints(b, 8)}" stroke="${K.paverDeep}" stroke-width=".7" opacity=".45"/>`
    + rim(b.x0, b.x1, b.y, 0.55);
  return depth(ctx, 4, body, boxOutline(b));
}

/** 醉月湖's promenade: stone slabs on top, an ashlar embankment in front, its foot in the dark water. */
function lakeside(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let joints = '';
  for (let r = 0; r < 3; r++) {
    const y = b.y + 10 + r * 12;
    joints += `M${b.x0} ${y}H${b.x1}`;
    for (let x = b.x0 + (r % 2 ? 14 : 0); x < b.x1; x += 28) joints += `M${f1(x)} ${y}v12`;
  }
  const body = (b.side ? `<path d="${b.side}" fill="${K.stoneDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(K.stoneShade, K.lakeDeep, 0.25)}"/>`
    + `<path d="${joints}" stroke="${K.stoneDeep}" stroke-width="1" opacity=".6"/>`
    + `<rect x="${b.x0}" y="${b.y + b.t - 9}" width="${b.x1 - b.x0}" height="9" fill="${K.lakeDeep}" opacity=".75"/><path d="M${b.x0} ${b.y + b.t - 9}H${b.x1}" stroke="${K.lakeSheen}" stroke-width="1" opacity=".4"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="10" fill="${K.stone}"/><path d="M${b.x0} ${b.y + 10}H${b.x1}" stroke="${C.shadow}" stroke-width="1.4" opacity=".3"/>`
    + `<path d="${b.top}" fill="${mixHex(K.stone, K.stoneShade, 0.3)}"/><path d="${topJoints(b, 26)}" stroke="${K.stoneDeep}" stroke-width=".8" opacity=".5"/>`
    + rim(b.x0, b.x1, b.y, 0.6);
  return depth(ctx, 4, body, boxOutline(b));
}

/** The goose's nest on the lake's bank (a single node by the water): a grassy hummock with a ring of straw. */
function nestMound(ctx: KitCtx, x: number, y: number): string {
  const mound = `M${x - 34} ${y + 16}Q${x - 30} ${y - 6} ${x} ${y - 6}Q${x + 30} ${y - 6} ${x + 34} ${y + 16}Z`;
  const r = seeded(Math.round(x + y));
  let straw = '';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const rx = 18 + r() * 3, ry = 5 + r() * 1.5;
    straw += `M${f1(x + Math.cos(a) * rx)} ${f1(y + Math.sin(a) * ry)}l${f1((r() - 0.5) * 10)} ${f1((r() - 0.5) * 3)}`;
  }
  let grass = '';
  for (let i = 0; i < 16; i++) grass += `M${f1(x - 30 + r() * 60)} ${f1(y + 8 + r() * 8)}l${f1((r() - 0.5) * 3)} -5`;
  return depth(ctx, 4, `<path d="${mound}" fill="${K.lawn}"/><path d="${grass}" stroke="${K.lawnLight}" stroke-width="1.1" stroke-linecap="round"/>`
    + `<ellipse cx="${x}" cy="${y}" rx="20" ry="6.5" fill="${C.kraftDark}"/><ellipse cx="${x}" cy="${y - 0.6}" rx="13" ry="3.6" fill="${mixHex(C.kraftFiber, C.shadow, 0.3)}"/>`
    + `<path d="${straw}" stroke="${C.corrugatedLight}" stroke-width="1.2" stroke-linecap="round"/>`
    + `<path d="M${x - 30} ${y + 6}Q${x - 24} ${y - 5} ${x} ${y - 5.4}" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".35"/>`, `<path d="${mound}"/>`);
}

/** The library's gallery behind the stacks: oak planks on top, a carved fascia with a brass strip in front. */
function gallery(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let panels = '';
  for (let x = b.x0 + 6; x < b.x1 - 24; x += 34) panels += `M${f1(x)} ${b.y + 16}h28v${b.t - 26}h-28z`;
  const body = (b.side ? `<path d="${b.side}" fill="${K.shelfWoodDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(K.shelfWood, C.shadow, 0.2)}"/>`
    + `<path d="${panels}" fill="${K.shelfWoodDeep}" opacity=".45"/><path d="${panels}" fill="none" stroke="${K.shelfWoodLight}" stroke-width=".8" opacity=".4"/>`
    + `<rect x="${b.x0}" y="${b.y + 8}" width="${b.x1 - b.x0}" height="3" fill="${C.goldDeep}"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="8" fill="${K.shelfWoodLight}"/>`
    + `<path d="${b.top}" fill="${K.shelfWoodLight}"/><path d="${topJoints(b, 9)}" stroke="${K.shelfWoodDeep}" stroke-width=".7" opacity=".5"/>`
    + rim(b.x0, b.x1, b.y, 0.55);
  return depth(ctx, 4, body, boxOutline(b));
}

/** The reading room's floor: parquet on top, a dark skirting and panelled oak plinth in front. */
function libraryFloor(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let panels = '';
  for (let x = b.x0 + 8; x < b.x1 - 30; x += 46) panels += `M${f1(x)} ${b.y + 16}h38v${b.t - 24}h-38z`;
  const body = (b.side ? `<path d="${b.side}" fill="${K.shelfWoodDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(K.shelfWoodDeep, C.shadow, 0.15)}"/>`
    + `<path d="${panels}" fill="none" stroke="${K.shelfWood}" stroke-width="1.4" opacity=".6"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="10" fill="${K.shelfWood}"/><path d="M${b.x0} ${b.y + 10}H${b.x1}" stroke="${C.shadow}" stroke-width="1.4" opacity=".35"/>`
    + `<path d="${b.top}" fill="${K.shelfWoodLight}"/><path d="${topJoints(b, 6)}" stroke="${K.shelfWoodDeep}" stroke-width=".6" opacity=".45"/>`
    + rim(b.x0, b.x1, b.y, 0.55);
  return depth(ctx, 4, body, boxOutline(b));
}

/** 藍教授's desk: the top's edge, the apron in front with a drawer and its brass pull. */
function desk(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let drawers = '';
  for (let x = b.x0 + 12; x < b.x1 - 50; x += 70) drawers += `<rect x="${f1(x)}" y="${b.y + 14}" width="54" height="24" rx="2" fill="none" stroke="${K.shelfWoodDeep}" stroke-width="1.4"/><rect x="${f1(x + 21)}" y="${b.y + 24}" width="12" height="4" rx="2" fill="${C.goldDeep}"/>`;
  const body = (b.side ? `<path d="${b.side}" fill="${K.shelfWoodDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${K.shelfWood}"/>` + drawers
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="8" fill="${K.shelfWoodLight}"/><path d="M${b.x0} ${b.y + 8}H${b.x1}" stroke="${C.shadow}" stroke-width="1.4" opacity=".35"/>`
    + `<path d="${b.top}" fill="${K.shelfWoodLight}"/>` + rim(b.x0, b.x1, b.y, 0.55);
  return depth(ctx, 4, body, boxOutline(b));
}

/** The giant book's page block: cream pages on top, their edges in fine lines in front, the cloth board under them. */
function bookPage(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let edges = '';
  for (let y = b.y + 3; y < b.y + b.t - 12; y += 2.6) edges += `M${b.x0} ${f1(y)}H${b.x1}`;
  const body = (b.side ? `<path d="${b.side}" fill="${K.pageEdgeShade}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t - 10}" fill="${K.pageEdge}"/><path d="${edges}" stroke="${K.pageEdgeShade}" stroke-width=".7" opacity=".7"/>`
    + `<rect x="${b.x0 - 3}" y="${b.y + b.t - 10}" width="${b.x1 - b.x0 + 6}" height="10" rx="2" fill="${K.bookBlue}"/><path d="M${b.x0} ${b.y + b.t - 8}H${b.x1}" stroke="${C.goldDeep}" stroke-width="1" opacity=".8"/>`
    + `<path d="${b.top}" fill="${C.washi}"/>` + rim(b.x0, b.x1, b.y, 0.7);
  return depth(ctx, 4, body, boxOutline(b));
}

/** A stack of three big books lying flat (a single node on the desk: where 藍教授 sits on the 書). */
function bookPile(ctx: KitCtx, x: number, y: number): string {
  const books: [number, number, string][] = [[18, 0, K.bookRed], [16, 4, K.bookGreen], [18, -2, K.bookPlum]];
  let yy = y;
  let body = '';
  let outline = '';
  for (const [h, inset, color] of books) {
    const x0 = x - 30 + inset, w = 60;
    const d = `M${x0} ${yy}h${w}v${h}h${-w}z`;
    outline += `<path d="${d}"/>`;
    body += `<path d="${d}" fill="${color}"/><rect x="${x0 + 4}" y="${f1(yy + h * 0.25)}" width="${w - 10}" height="${f1(h * 0.5)}" fill="${K.pageEdge}"/>`
      + `<path d="M${x0 + 5} ${f1(yy + h * 0.5)}h${w - 12}" stroke="${K.pageEdgeShade}" stroke-width=".7"/><path d="M${x0 + 1} ${yy + 0.6}h${w - 2}" stroke="${C.cutRim}" stroke-width=".8" opacity=".45"/>`;
    yy += h;
  }
  const top = `M${x - 30} ${y}L${f1(towardVp([x - 30, y])[0])} ${f1(towardVp([x - 30, y])[1])}H${f1(towardVp([x + 30, y])[0])}L${x + 30} ${y}Z`;
  return depth(ctx, 4, `<path d="${top}" fill="${mixHex(K.bookRed, C.cutRim, 0.2)}"/>` + body, outline + `<path d="${top}"/>`);
}

/**
 * 西門町's pavement (#119): plum-grey pavers on top, a granite curb, and the street's dark face under
 * it with a smear of neon reflected in the wet asphalt (pink and cyan, alternating along the run).
 */
function neonStreet(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let smears = '';
  for (let x = b.x0 + 10, i = 0; x < b.x1 - 16; x += 38, i++) smears += `<rect x="${f1(x)}" y="${b.y + 22 + (i % 2) * 6}" width="${f1(Math.min(26, b.x1 - x - 4))}" height="2.4" rx="1.2" fill="${i % 2 ? C.neonCyan : C.neonPink}" opacity=".4"/>`;
  const body = (b.side ? `<path d="${b.side}" fill="${N.paverDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(N.asphalt, C.shadow, 0.2)}"/>` + smears
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="12" fill="${N.curb}"/>`
    + `<path d="${Array.from({ length: Math.ceil((b.x1 - b.x0) / 26) }, (_, i) => `M${f1(b.x0 + 26 * (i + 1))} ${b.y}v12`).join('')}" stroke="${N.paverDeep}" stroke-width=".8" opacity=".6"/>`
    + `<path d="M${b.x0} ${b.y + 12}H${b.x1}" stroke="${C.shadow}" stroke-width="1.6" opacity=".4"/>`
    + `<path d="${b.top}" fill="${N.paverLight}"/><path d="${topJoints(b, 12)}" stroke="${N.paverDeep}" stroke-width=".7" opacity=".5"/>`
    + rim(b.x0, b.x1, b.y, 0.55);
  return depth(ctx, 4, body, boxOutline(b));
}

/** The claw machine's prize shelves (#119): a pink cabinet card on top with star stickers, a chrome lip and a row of little bulbs in front. */
function arcadeShelf(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let bulbs = '';
  for (let x = b.x0 + 8; x < b.x1 - 4; x += 12) bulbs += `M${f1(x - 2)} ${b.y + 20}a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z`;
  const body = (b.side ? `<path d="${b.side}" fill="${N.cabinetDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(N.cabinet, N.cabinetDeep, 0.5)}"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="8" fill="${N.chrome}"/><path d="M${b.x0} ${b.y + 1}H${b.x1}" stroke="${C.cutRim}" stroke-width="1" opacity=".7"/>`
    + `<path d="${bulbs}" fill="${C.lampHot}"/><path d="M${b.x0} ${b.y + 30}H${b.x1}" stroke="${N.cabinetLight}" stroke-width="1.4" opacity=".6"/>`
    + `<path d="${b.top}" fill="${N.cabinetLight}"/>` + rim(b.x0, b.x1, b.y, 0.6);
  return depth(ctx, 4, body, boxOutline(b));
}

/** The karaoke bar's stage (#119): dark boards on top, a velvet skirt in front with a row of footlights. */
function karaokeStage(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let lights = '';
  for (let x = b.x0 + 14; x < b.x1 - 8; x += 28) lights += softEllipse(ctx, x, b.y + 7, 6, 4, 'lamp', 0.3) + `<rect x="${f1(x - 4)}" y="${b.y + 4}" width="8" height="5" rx="2" fill="${C.lampHot}"/>`;
  let folds = '';
  for (let x = b.x0 + 6; x < b.x1; x += 10) folds += `M${f1(x)} ${b.y + 12}v${b.t - 12}`;
  const body = (b.side ? `<path d="${b.side}" fill="${N.velvetDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${N.velvet}"/><path d="${folds}" stroke="${N.velvetDeep}" stroke-width="3" opacity=".55"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="11" fill="${N.stageBoard}"/>` + lights
    + `<path d="${b.top}" fill="${N.stageBoardLight}"/><path d="${topJoints(b, 9)}" stroke="${N.stageBoard}" stroke-width=".8" opacity=".7"/>`
    + rim(b.x0, b.x1, b.y, 0.6);
  return depth(ctx, 4, body, boxOutline(b));
}

/**
 * 士林夜市's lane (#122): the calm dark band the play path runs on — worn red-brick pavers on top, a
 * granite curb, the lane's dark face under it with the bulbs' reflections in the wet (amber and
 * vermilion smears, alternating along the run).
 */
function marketLane(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let smears = '';
  for (let x = b.x0 + 12, i = 0; x < b.x1 - 16; x += 40, i++) smears += `<rect x="${f1(x)}" y="${b.y + 24 + (i % 2) * 6}" width="${f1(Math.min(24, b.x1 - x - 4))}" height="2.4" rx="1.2" fill="${i % 2 ? M.vermilionLight : C.lampAmber}" opacity=".35"/>`;
  const body = (b.side ? `<path d="${b.side}" fill="${M.laneDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${M.lane}"/>` + smears
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="11" fill="${M.laneLight}"/>`
    + `<path d="${Array.from({ length: Math.ceil((b.x1 - b.x0) / 24) }, (_, i) => `M${f1(b.x0 + 24 * (i + 1))} ${b.y}v11`).join('')}" stroke="${M.laneDeep}" stroke-width=".8" opacity=".6"/>`
    + `<path d="M${b.x0} ${b.y + 11}H${b.x1}" stroke="${C.shadow}" stroke-width="1.6" opacity=".4"/>`
    + `<path d="${b.top}" fill="${mixHex(M.vermilionDeep, M.laneLight, 0.45)}"/><path d="${topJoints(b, 11)}" stroke="${M.laneDeep}" stroke-width=".7" opacity=".55"/>`
    + rim(b.x0, b.x1, b.y, 0.5);
  return depth(ctx, 4, body, boxOutline(b));
}

/** A stall's tiled floor (#122): small cream-grey tiles on top, a stainless kick plate in front. */
function stallFloor(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  const body = (b.side ? `<path d="${b.side}" fill="${M.tinDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(M.tin, M.laneDeep, 0.35)}"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="9" fill="${M.steelWarm}"/><path d="M${b.x0} ${b.y + 1}H${b.x1}" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`
    + `<path d="M${b.x0} ${b.y + 28}H${b.x1}" stroke="${M.tinLight}" stroke-width="1" opacity=".4"/>`
    + `<path d="${b.top}" fill="${mixHex(M.awningCream, M.tin, 0.45)}"/><path d="${topJoints(b, 8)}" stroke="${M.tinDeep}" stroke-width=".7" opacity=".5"/>`
    + rim(b.x0, b.x1, b.y, 0.6);
  return depth(ctx, 4, body, boxOutline(b));
}

/** A stall's shelf (#122): a dark wooden plank on top, a vermilion valance with a fringe of little bulbs in front. */
function stallShelf(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let bulbs = '';
  for (let x = b.x0 + 8; x < b.x1 - 4; x += 12) bulbs += `M${f1(x - 2)} ${b.y + 22}a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z`;
  let fringe = '';
  for (let x = b.x0; x < b.x1; x += 8) fringe += `M${f1(x)} ${b.y + 12}l4 7l4 -7z`;
  const body = (b.side ? `<path d="${b.side}" fill="${M.woodDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(M.woodDeep, M.laneDeep, 0.4)}"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="12" fill="${M.vermilion}"/><path d="${fringe}" fill="${M.vermilionDeep}"/>`
    + `<path d="${bulbs}" fill="${C.lamp}"/>`
    + `<path d="${b.top}" fill="${M.woodLight}"/>` + rim(b.x0, b.x1, b.y, 0.55);
  return depth(ctx, 4, body, boxOutline(b));
}

/**
 * The 蔥抓餅 stall's counter (#122): its front faces the lane — stainless steel with a vermilion
 * banner and a cream 「蔥抓餅」 band — and its top is the stall's floor behind it, where she works.
 */
function stallCounter(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let flutes = '';
  for (let x = b.x0 + 4; x < b.x1; x += 6) flutes += `M${f1(x)} ${b.y + 30}v${b.t - 30}`;
  const body = (b.side ? `<path d="${b.side}" fill="${M.tinDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${M.tin}"/><path d="${flutes}" stroke="${M.tinDeep}" stroke-width="2" opacity=".45"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="8" fill="${M.steelWarm}"/><path d="M${b.x0} ${b.y + 1}H${b.x1}" stroke="${C.cutRim}" stroke-width="1" opacity=".7"/>`
    + `<rect x="${b.x0}" y="${b.y + 10}" width="${b.x1 - b.x0}" height="18" fill="${M.vermilion}"/><path d="M${b.x0} ${b.y + 26}H${b.x1}" stroke="${M.vermilionDeep}" stroke-width="2"/>`
    + `<path d="${b.top}" fill="${mixHex(M.awningCream, M.tin, 0.5)}"/><path d="${topJoints(b, 8)}" stroke="${M.tinDeep}" stroke-width=".7" opacity=".45"/>`
    + rim(b.x0, b.x1, b.y, 0.65);
  return depth(ctx, 4, body, boxOutline(b));
}

/**
 * The terminal's floor (#124): a polished terrazzo slab on top, a white panel in front with a runway-
 * blue stripe and the floor lights' warm reflections.
 */
function terminalFloor(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let glints = '';
  for (let x = b.x0 + 16, i = 0; x < b.x1 - 10; x += 44, i++) glints += `<rect x="${f1(x)}" y="${b.y + 30}" width="${f1(Math.min(14, b.x1 - x - 4))}" height="2" rx="1" fill="${C.lamp}" opacity=".3"/>`;
  const body = (b.side ? `<path d="${b.side}" fill="${A.whiteDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(mixHex(A.whiteShade, A.whiteDeep, 0.35), A.runwayDeep, 0.22)}"/>`
    + `<rect x="${b.x0}" y="${b.y + 12}" width="${b.x1 - b.x0}" height="7" fill="${A.runway}"/>` + glints
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="5" fill="${A.terrazzoDeep}"/>`
    + `<path d="${b.top}" fill="${mixHex(A.terrazzo, A.runwayDeep, 0.15)}"/><path d="${topJoints(b, 24)}" stroke="${A.terrazzoDeep}" stroke-width=".7" opacity=".5"/>`
    + rim(b.x0, b.x1, b.y, 0.6);
  return depth(ctx, 4, body, boxOutline(b));
}

/** The observation deck's boards (#124): composite planks on top, a steel fascia with a row of little blue lights in front. */
function deckBoards(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let lights = '';
  for (let x = b.x0 + 10; x < b.x1 - 4; x += 20) lights += `M${f1(x - 1.6)} ${b.y + 22}a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0z`;
  const body = (b.side ? `<path d="${b.side}" fill="${A.deckDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(A.steelDeep, A.deckDeep, 0.5)}"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="10" fill="${A.deck}"/><path d="M${b.x0} ${b.y + 10}H${b.x1}" stroke="${C.shadow}" stroke-width="1.6" opacity=".4"/>`
    + `<path d="${lights}" fill="${A.taxiBlue}"/><path d="M${b.x0} ${b.y + 34}H${b.x1}" stroke="${A.steel}" stroke-width="1" opacity=".4"/>`
    + `<path d="${b.top}" fill="${A.deckLight}"/><path d="M${b.ax} ${f1((b.ay + b.y) / 2)}H${b.bx}" stroke="${A.deckDeep}" stroke-width=".8" opacity=".6"/>`
    + rim(b.x0, b.x1, b.y, 0.55);
  return depth(ctx, 4, body, boxOutline(b));
}

/** The jet bridge's floor (#124): grey-blue carpet on top, the tunnel's corrugated steel skin in front. */
function bridgeFloor(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let flutes = '';
  for (let x = b.x0 + 3; x < b.x1; x += 6) flutes += `M${f1(x)} ${b.y + 8}v${b.t - 8}`;
  const body = (b.side ? `<path d="${b.side}" fill="${A.steelDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${A.steel}"/><path d="${flutes}" stroke="${A.steelDeep}" stroke-width="2" opacity=".45"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="8" fill="${A.steelLight}"/><path d="M${b.x0} ${b.y + 8}H${b.x1}" stroke="${C.shadow}" stroke-width="1.4" opacity=".35"/>`
    + `<path d="${b.top}" fill="${mixHex(A.crew, A.steel, 0.4)}"/>` + rim(b.x0, b.x1, b.y, 0.6);
  return depth(ctx, 4, body, boxOutline(b));
}

/** The control tower's catwalk (#124): steel grating on top, its open grating face in front with a white safety stripe. */
function catwalk(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let grate = '';
  for (let x = b.x0 + 2; x < b.x1; x += 5) grate += `M${f1(x)} ${b.y + 12}v${b.t - 16}`;
  const body = (b.side ? `<path d="${b.side}" fill="${A.grate}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(A.runwayDeep, C.shadow, 0.3)}"/><path d="${grate}" stroke="${A.grate}" stroke-width="1.6"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="8" fill="${A.steel}"/><rect x="${b.x0}" y="${b.y + 8}" width="${b.x1 - b.x0}" height="3" fill="${A.white}" opacity=".8"/>`
    + `<rect x="${b.x0}" y="${b.y + b.t - 5}" width="${b.x1 - b.x0}" height="5" fill="${A.steelDeep}"/>`
    + `<path d="${b.top}" fill="${A.grate}"/><path d="${topJoints(b, 5)}" stroke="${mixHex(A.runwayDeep, C.shadow, 0.3)}" stroke-width="1.2" opacity=".7"/>`
    + rim(b.x0, b.x1, b.y, 0.55);
  return depth(ctx, 4, body, boxOutline(b));
}

// ——— 貓空 (#126) ———

/** A row of clipped tea along a ledge's top (x0–x1 at y): rounded bushes with moonlit crowns, one path per tone. */
function teaHedge(x0: number, x1: number, y: number, seed: number, h = 9): string {
  const r = seeded(seed);
  let body = `M${f1(x0)} ${f1(y + 4)}`;
  let lit = '';
  for (let x = x0; x < x1;) {
    const w = Math.min(x1 - x, 10 + r() * 6);
    const hh = h * (0.75 + r() * 0.35);
    body += `q${f1(w / 2)} ${f1(-hh * 1.5)} ${f1(w)} 0`;
    lit += `M${f1(x + w * 0.2)} ${f1(y + 4 - hh * 0.55)}q${f1(w * 0.3)} ${f1(-hh * 0.35)} ${f1(w * 0.6)} 0`;
    x += w;
  }
  body += `V${f1(y + 8)}H${f1(x0)}Z`;
  return `<path d="${body}" fill="${G.tea}"/><path d="${lit}" stroke="${G.teaLit}" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".8"/>`;
}

/** Ashlar joints on a stone face from y0 to y1 (staggered courses). */
function stoneCourses(x0: number, x1: number, y0: number, y1: number, seed: number, course = 11): string {
  const r = seeded(seed);
  let d = '';
  for (let y = y0, i = 0; y < y1 - 2; y += course, i++) {
    if (y > y0) d += `M${f1(x0)} ${f1(y)}H${f1(x1)}`;
    for (let x = x0 + (i % 2 ? 9 : 0) + r() * 6; x < x1 - 4; x += 15 + r() * 10) d += `M${f1(x)} ${f1(y)}v${f1(Math.min(course, y1 - y))}`;
  }
  return d;
}

/**
 * 7-1's elevated platform (動物園 station, #126): pale concrete on top with the ochre tactile strip
 * along its edge (decorative yellow is never marigold), a steel fascia in front with the 文湖線's
 * brown band and a row of little downlights glowing under it.
 */
function zooPlatform(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let lights = '';
  for (let x = b.x0 + 14; x < b.x1 - 6; x += 28) lights += `<rect x="${f1(x - 5)}" y="${b.y + b.t - 6}" width="10" height="3" rx="1.5" fill="${C.lampHot}"/>`;
  const body = (b.side ? `<path d="${b.side}" fill="${G.concreteDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(G.steelDeep, G.hillNear, 0.3)}"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="10" fill="${G.concrete}"/><path d="M${b.x0} ${b.y + 10}H${b.x1}" stroke="${C.shadow}" stroke-width="1.6" opacity=".35"/>`
    + `<rect x="${b.x0}" y="${b.y + 16}" width="${b.x1 - b.x0}" height="8" fill="${A.wenhu}"/><rect x="${b.x0}" y="${b.y + 24}" width="${b.x1 - b.x0}" height="2" fill="${A.wenhuDeep}"/>`
    + lights
    + `<path d="${b.top}" fill="${mixHex(G.concrete, G.stoneLight, 0.4)}"/>`
    + `<path d="M${f1(b.x0)} ${b.y - 3}H${b.x1}" stroke="${C.ochre}" stroke-width="3" opacity=".8"/><path d="M${f1(b.x0)} ${b.y - 3}H${b.x1}" stroke="${C.ochreDark}" stroke-width="3" stroke-dasharray="1 3" opacity=".6"/>`
    + rim(b.x0, b.x1, b.y, 0.6);
  return depth(ctx, 4, body, boxOutline(b));
}

/** The zoo's entrance plaza (#126): warm brick pavers on top, a low stone planter wall in front with ferns spilling over. */
function zooPlaza(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  const r = seeded(Math.round(b.x0 * 3 + b.y));
  let ferns = '';
  for (let x = b.x0 + 6; x < b.x1 - 4; x += 9 + r() * 8) ferns += `M${f1(x)} ${b.y + 14}q${f1(-3 + r() * 6)} ${f1(8 + r() * 6)} ${f1(-5 + r() * 10)} ${f1(14 + r() * 6)}`;
  const body = (b.side ? `<path d="${b.side}" fill="${G.stoneDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${ref(ctx, 'stoneG')}"/>`
    + `<path d="${stoneCourses(b.x0, b.x1, b.y + 12, b.y + b.t, Math.round(b.x0) + 7)}" stroke="${G.stoneDeep}" stroke-width=".9" opacity=".7"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="12" fill="${mixHex(G.path, G.stone, 0.4)}"/><path d="M${b.x0} ${b.y + 12}H${b.x1}" stroke="${C.shadow}" stroke-width="1.6" opacity=".35"/>`
    + `<path d="${ferns}" stroke="${G.teaLight}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>`
    + `<path d="${b.top}" fill="${mixHex(G.path, G.stoneLight, 0.3)}"/><path d="${topJoints(b, 10)}" stroke="${G.soilDeep}" stroke-width=".7" opacity=".45"/>`
    + rim(b.x0, b.x1, b.y, 0.55);
  return depth(ctx, 4, body, boxOutline(b));
}

/** The gondola stations' boarding decks (#126): chequer steel plate on top, a steel girder in front with a ochre-and-dark safety stripe and its lamps. */
function gondolaDeck(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let stripe = '';
  for (let x = b.x0; x < b.x1; x += 12) stripe += `M${f1(x)} ${b.y + 14}l6 0l-6 7h-6z`;
  let rivets = '';
  for (let x = b.x0 + 8; x < b.x1; x += 16) rivets += `M${f1(x - 1)} ${b.y + 34}h2v2h-2z`;
  const body = (b.side ? `<path d="${b.side}" fill="${G.steelDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${G.steelDeep}"/><path d="${rivets}" fill="${G.steel}"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="12" fill="${G.steel}"/><path d="M${b.x0} ${b.y + 1}H${b.x1}" stroke="${G.steelLight}" stroke-width="1"/>`
    + `<rect x="${b.x0}" y="${b.y + 14}" width="${b.x1 - b.x0}" height="7" fill="${C.printDark}"/><path d="${stripe}" fill="${C.ochre}" opacity=".85"/>`
    + `<path d="${b.top}" fill="${mixHex(G.steel, G.steelLight, 0.3)}"/><path d="${topJoints(b, 6)}" stroke="${G.steelDeep}" stroke-width=".6" opacity=".4"/>`
    + rim(b.x0, b.x1, b.y, 0.6);
  return depth(ctx, 4, body, boxOutline(b));
}

/**
 * A tea terrace (#126; bible § 6 row 7: "terraces as stepped box folds"): a clipped row of tea on top,
 * the dark soil between the rows, a dry-stone retaining wall in front.
 */
function teaTerrace(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  const seed = Math.round(b.x0 * 7 + b.y);
  const body = (b.side ? `<path d="${b.side}" fill="${G.stoneDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${ref(ctx, 'stoneG')}"/>`
    + `<path d="${stoneCourses(b.x0, b.x1, b.y + 10, b.y + b.t, seed, 10)}" stroke="${G.stoneDeep}" stroke-width="1" opacity=".75"/>`
    + `<path d="${stoneCourses(b.x0, b.x1, b.y + 10, b.y + b.t, seed, 10)}" stroke="${G.stoneLight}" stroke-width=".6" opacity=".4" transform="translate(-.8 -.8)"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="10" fill="${G.soilDeep}"/>`
    + `<path d="${b.top}" fill="${G.soil}"/><path d="${topJoints(b, 14)}" stroke="${G.soilDeep}" stroke-width="1" opacity=".5"/>`
    + teaHedge(b.x0 + 1, b.x1 - 1, b.ay + 4, seed, 7)
    + rim(b.x0, b.x1, b.y, 0.45);
  return depth(ctx, 4, body, boxOutline(b));
}

/** The tea house's deck (#126): weathered boards on top, a dark timber fascia in front with a hanging lantern's glow. */
function teaDeck(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let boards = '';
  for (let y = b.y + 14; y < b.y + b.t; y += 9) boards += `M${b.x0} ${y}H${b.x1}`;
  const body = (b.side ? `<path d="${b.side}" fill="${G.woodDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${mixHex(G.woodDeep, C.shadow, 0.25)}"/><path d="${boards}" stroke="${G.woodDeep}" stroke-width="1.2" opacity=".8"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="10" fill="${G.wood}"/><path d="M${b.x0} ${b.y + 10}H${b.x1}" stroke="${C.shadow}" stroke-width="1.6" opacity=".4"/>`
    + `<path d="${b.top}" fill="${G.woodLight}"/><path d="${topJoints(b, 9)}" stroke="${G.woodDeep}" stroke-width=".8" opacity=".55"/>`
    + rim(b.x0, b.x1, b.y, 0.55);
  return depth(ctx, 4, body, boxOutline(b));
}

/**
 * Inside the 水晶車廂 (#126): its benches (`cabinBench`, a padded seat over a steel base) and its
 * glass floor (`cabinGlass`: a glassine slab in a thin steel frame — the night shows through it).
 */
function cabinBench(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  const body = (b.side ? `<path d="${b.side}" fill="${G.steelDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y + 8}" width="${b.x1 - b.x0}" height="${b.t - 8}" fill="${ref(ctx, 'steelV')}"/>`
    + `<path d="M${b.x0} ${b.y + 30}H${b.x1}" stroke="${G.steelDeep}" stroke-width="1" opacity=".6"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="10" rx="3" fill="${G.cabinBand}"/><path d="M${b.x0 + 3} ${b.y + 1.4}H${b.x1 - 3}" stroke="${G.teaLit}" stroke-width="1.2" opacity=".6"/>`
    + `<path d="${b.top}" fill="${mixHex(G.cabinBand, G.teaLit, 0.3)}"/>` + rim(b.x0, b.x1, b.y, 0.5);
  return depth(ctx, 4, body, boxOutline(b));
}

/** The luggage rack over the right bench: a steel shelf of rods on brackets. */
function cabinRack(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let rods = '';
  for (let x = b.x0 + 4; x < b.x1; x += 6) rods += `M${f1(x)} ${b.y}v10`;
  const body = (b.side ? `<path d="${b.side}" fill="${G.steelDeep}"/>` : '')
    + `<path d="M${b.x0 + 6} ${b.y + 10}L${b.x0 + 18} ${b.y + 34}M${b.x1 - 6} ${b.y + 10}L${b.x1 - 18} ${b.y + 34}" stroke="${G.steelDeep}" stroke-width="3"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="10" fill="${G.steelDeep}"/><path d="${rods}" stroke="${G.steelLight}" stroke-width="1.6"/>`
    + `<path d="${b.top}" fill="${G.steel}"/>` + rim(b.x0, b.x1, b.y, 0.6);
  return depth(ctx, 4, body, `${b.side ? `<path d="${b.side}"/>` : ''}<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="10"/><path d="${b.top}"/>`);
}

function cabinGlass(_ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  let mull = '';
  for (let x = b.x0 + 38; x < b.x1 - 10; x += 38) mull += `M${f1(x)} ${b.y}v${b.t}`;
  const body = `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${A.glass}" opacity=".18"/>`
    + `<path d="M${f1(b.x0 + 20)} ${b.y + b.t}L${f1(b.x0 + 46)} ${b.y}H${f1(b.x0 + 56)}L${f1(b.x0 + 30)} ${b.y + b.t}ZM${f1(b.x1 - 70)} ${b.y + b.t}L${f1(b.x1 - 50)} ${b.y}H${f1(b.x1 - 44)}L${f1(b.x1 - 64)} ${b.y + b.t}Z" fill="${C.glassine}" opacity=".12"/>`
    + `<path d="${mull}" stroke="${G.steel}" stroke-width="2" opacity=".7"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="4" fill="${G.steel}"/><rect x="${b.x0}" y="${b.y + b.t - 4}" width="${b.x1 - b.x0}" height="4" fill="${G.steelDeep}"/>`
    + `<path d="${b.top}" fill="${C.glassine}" opacity=".3"/><path d="${b.top}" fill="none" stroke="${G.steelLight}" stroke-width="1" opacity=".6"/>`
    + rim(b.x0, b.x1, b.y, 0.7);
  // Glass: no stacked shadow of its own (vellum and glassine take only a soft one, bible § 3.1)
  return body;
}

/** The vegetable garden (#126): its earth path (`gardenPath`, packed soil, a grass verge in front) and its terraces (`gardenTerrace`, a stone wall under a bed of greens). */
function gardenPath(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  const r = seeded(Math.round(b.x0 * 11 + b.y));
  let grass = '';
  for (let x = b.x0 + 2; x < b.x1 - 2; x += 3 + r() * 4) grass += `M${f1(x)} ${b.y + 12}l${f1(-1 + r() * 2)} ${f1(-4 - r() * 5)}`;
  const body = (b.side ? `<path d="${b.side}" fill="${G.soilDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${G.soilDeep}"/>`
    + `<rect x="${b.x0}" y="${b.y + 8}" width="${b.x1 - b.x0}" height="${b.t - 8}" fill="${mixHex(G.tea, G.soilDeep, 0.55)}"/>`
    + `<path d="${grass}" stroke="${G.teaLight}" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="8" fill="${G.soil}"/>`
    + `<path d="${b.top}" fill="${G.path}"/><path d="${topJoints(b, 17)}" stroke="${G.soil}" stroke-width="1" opacity=".5"/>`
    + rim(b.x0, b.x1, b.y, 0.45);
  return depth(ctx, 4, body, boxOutline(b));
}

/** 7-6's path with the glazed rain jar at its right end, in front of the wall's foot (its water at y + 36). */
function gardenPathJar(ctx: KitCtx, run: LedgeRun): string {
  const cx = run.x1 - 10, top = run.y + 36;
  const jar = `M${cx - 20} ${top}Q${cx - 30} ${top + 24} ${cx - 16} ${top + 42}H${cx + 16}Q${cx + 30} ${top + 24} ${cx + 20} ${top}Z`;
  return gardenPath(ctx, run) + softEllipse(ctx, cx, top + 44, 26, 4, 'shadow', 0.45)
    + depth(ctx, 4, `<path d="${jar}" fill="${G.jar}"/><path d="M${cx + 4} ${top}Q${cx + 26} ${top + 24} ${cx + 12} ${top + 42}H${cx + 16}Q${cx + 30} ${top + 24} ${cx + 20} ${top}Z" fill="${G.jarDeep}"/>`
      + `<path d="M${cx - 16} ${top + 6}Q${cx - 22} ${top + 22} ${cx - 12} ${top + 36}" stroke="${C.cutRim}" stroke-width="1.6" fill="none" opacity=".35"/>`
      + `<ellipse cx="${cx}" cy="${top}" rx="22" ry="5" fill="${G.jarDeep}"/><ellipse cx="${cx}" cy="${top + 0.6}" rx="18" ry="3.6" fill="${mixHex(G.hillNear, C.shadow, 0.3)}"/>`
      + `<path d="M${cx - 20} ${top + 12}H${cx + 22}" stroke="${G.mistDeep}" stroke-width="1" opacity=".4"/>`, `<path d="${jar}"/>`);
}

function gardenTerrace(ctx: KitCtx, run: LedgeRun): string {
  const b = box(run);
  const seed = Math.round(b.x0 * 13 + b.y);
  const body = (b.side ? `<path d="${b.side}" fill="${G.stoneDeep}"/>` : '')
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="${b.t}" fill="${ref(ctx, 'stoneG')}"/>`
    + `<path d="${stoneCourses(b.x0, b.x1, b.y + 6, b.y + b.t, seed, 13)}" stroke="${G.stoneDeep}" stroke-width="1.1" opacity=".8"/>`
    + `<path d="${stoneCourses(b.x0, b.x1, b.y + 6, b.y + b.t, seed, 13)}" stroke="${G.stoneLight}" stroke-width=".6" opacity=".4" transform="translate(-.8 -.8)"/>`
    + `<rect x="${b.x0}" y="${b.y}" width="${b.x1 - b.x0}" height="6" fill="${G.soilDeep}"/>`
    + `<path d="${b.top}" fill="${G.soil}"/>` + rim(b.x0, b.x1, b.y, 0.45);
  return depth(ctx, 4, body, boxOutline(b));
}

/** 7-1's stairs down from the platform (#126): concrete treads between steel stringers, a handrail on the far side. */
function stationStairs(ctx: KitCtx, slope: Pick<Slope, 'from' | 'to'>): string {
  const [[ax, ay], [bx, by]] = [slope.from, slope.to];
  const n = Math.max(3, Math.round(Math.abs(by - ay) / 9));
  let treads = '';
  let lit = '';
  for (let i = 0; i < n; i++) {
    const x0 = ax + ((bx - ax) * i) / n, y0 = ay + ((by - ay) * i) / n;
    const x1 = ax + ((bx - ax) * (i + 1)) / n;
    treads += `M${f1(Math.min(x0, x1) - 10)} ${f1(y0)}H${f1(Math.max(x0, x1) + 10)}V${f1(y0 + 9)}H${f1(Math.min(x0, x1) - 10)}Z`;
    lit += `M${f1(Math.min(x0, x1) - 10)} ${f1(y0 + 0.6)}H${f1(Math.max(x0, x1) + 10)}`;
  }
  const rail = `M${f1(ax - 4)} ${f1(ay - 26)}L${f1(bx - 4)} ${f1(by - 26)}`;
  return `<path d="${rail}M${f1(ax - 4)} ${f1(ay - 26)}V${ay}M${f1((ax + bx) / 2 - 4)} ${f1((ay + by) / 2 - 26)}V${f1((ay + by) / 2)}M${f1(bx - 4)} ${f1(by - 26)}V${by}" stroke="${G.steel}" stroke-width="2" fill="none"/>`
    + depth(ctx, 4, `<path d="M${f1(ax - 10)} ${ay}L${f1(bx + 10)} ${by}V${by + 10}L${f1(ax - 10)} ${ay + 12}Z" fill="${G.steelDeep}"/><path d="${treads}" fill="${G.concrete}"/>`
      + `<path d="${lit}" stroke="${C.ochre}" stroke-width="1.4" opacity=".7"/>`, `<path d="${treads}"/>`);
}

/**
 * 7-5's big 茶海 cup on the pool's bottom (#126; a single node, his stepping stone at half): a wide
 * porcelain pitcher with a lip spout, a blue-and-white band, tea in it.
 */
function chahai(ctx: KitCtx, run: LedgeRun): string {
  const cx = (run.x0 + run.x1) / 2, y = run.y;
  const body = `M${f1(cx - 28)} ${y - 4}H${f1(cx + 28)}Q${f1(cx + 30)} ${y + 36} ${f1(cx + 18)} ${y + 48}H${f1(cx - 18)}Q${f1(cx - 30)} ${y + 36} ${f1(cx - 28)} ${y - 4}Z`;
  return depth(ctx, 4, `<path d="M${f1(cx - 28)} ${y - 4}l-9 -4l2 6z" fill="${G.porcelainShade}"/><path d="${body}" fill="${G.porcelain}"/>`
    + `<path d="M${f1(cx + 6)} ${y - 4}H${f1(cx + 28)}Q${f1(cx + 30)} ${y + 36} ${f1(cx + 18)} ${y + 48}H${f1(cx + 2)}Q${f1(cx + 14)} ${y + 30} ${f1(cx + 6)} ${y - 4}Z" fill="${G.porcelainShade}" opacity=".7"/>`
    + `<path d="M${f1(cx - 28.6)} ${y + 12}H${f1(cx + 28.6)}" stroke="${G.blueWhite}" stroke-width="4"/><path d="M${f1(cx - 27)} ${y + 18}H${f1(cx + 27)}" stroke="${G.blueWhite}" stroke-width=".9"/>`
    + `<ellipse cx="${f1(cx)}" cy="${y - 4}" rx="28" ry="5" fill="${G.porcelainShade}"/><ellipse cx="${f1(cx)}" cy="${y - 3.4}" rx="25" ry="3.8" fill="${G.brew}"/>`
    + `<path d="M${f1(cx - 22)} ${y + 2}Q${f1(cx - 26)} ${y + 26} ${f1(cx - 14)} ${y + 42}" stroke="${C.cutRim}" stroke-width="1.6" fill="none" opacity=".5"/>`, `<path d="${body}"/>`);
}

/** A tea terrace's stone step up (#126; one 22-unit riser, D-58): a slab of stone with tea at its sides. */
function terraceStep(ctx: KitCtx, slope: Pick<Slope, 'from' | 'to'>): string {
  const [[ax, ay], [bx, by]] = [slope.from, slope.to];
  const [lo, hi] = ay > by ? [[ax, ay], [bx, by]] : [[bx, by], [ax, ay]];
  const mx = (lo[0] + hi[0]) / 2;
  const d = `M${f1(mx - 12)} ${f1((lo[1] + hi[1]) / 2)}H${f1(mx + 12)}V${f1(lo[1] + 2)}H${f1(mx - 12)}Z`;
  return depth(ctx, 4, `<path d="${d}" fill="${G.stone}"/><path d="M${f1(mx - 12)} ${f1((lo[1] + hi[1]) / 2 + 0.6)}H${f1(mx + 12)}" stroke="${G.stoneLight}" stroke-width="1.6"/>`, `<path d="${d}"/>`);
}

/** A ledge in its page's material (`dress.ts`): the dressed styles here, brick and rug from the placeholder stage. */
/** Chapter 7's ledge styles (#126): a single node is a short box of the same material. */
const CHAPTER7_STYLES: ReadonlySet<LedgeStyle> = new Set<LedgeStyle>(['zooPlatform', 'zooPlaza', 'gondolaDeck', 'teaTerrace', 'teaDeck', 'chahai', 'cabinBench', 'cabinRack', 'cabinGlass', 'gardenPath', 'gardenPathJar', 'gardenTerrace']);

export function styledLedge(ctx: KitCtx, run: LedgeRun, style: LedgeStyle, theme: StageTheme): string {
  if (run.single) {
    if (style === 'playmat' || style === 'crib') return pillow(ctx, (run.x0 + run.x1) / 2, run.y);
    if (style === 'parkPath' || style === 'boardwalk') return archBridge(ctx, (run.x0 + run.x1) / 2, run.y);
    if (style === 'lakeside') return nestMound(ctx, (run.x0 + run.x1) / 2, run.y);
    if (style === 'bookPage' || style === 'desk') return bookPile(ctx, (run.x0 + run.x1) / 2, run.y);
    if (style === 'campusPath') return campusPath(ctx, run);
    if (style === 'neonStreet') return neonStreet(ctx, run);
    if (style === 'marketLane') return marketLane(ctx, run);
    if (style === 'stallFloor' || style === 'stallShelf' || style === 'stallCounter') return styledLedge(ctx, { ...run, single: false }, style, theme);
    if (style === 'terminalFloor' || style === 'deckBoards' || style === 'bridgeFloor' || style === 'catwalk' || style === 'carBodyWenhu') return styledLedge(ctx, { ...run, single: false }, style, theme);
    if (CHAPTER7_STYLES.has(style)) return styledLedge(ctx, { ...run, single: false }, style, theme);
    return plainLedge(ctx, run, theme);
  }
  switch (style) {
    case 'zooPlatform':
      return zooPlatform(ctx, run);
    case 'zooPlaza':
      return zooPlaza(ctx, run);
    case 'gondolaDeck':
      return gondolaDeck(ctx, run);
    case 'teaTerrace':
      return teaTerrace(ctx, run);
    case 'teaDeck':
      return teaDeck(ctx, run);
    case 'chahai':
      return chahai(ctx, run);
    case 'cabinBench':
      return cabinBench(ctx, run);
    case 'cabinRack':
      return cabinRack(ctx, run);
    case 'cabinGlass':
      return cabinGlass(ctx, run);
    case 'gardenPath':
      return gardenPath(ctx, run);
    case 'gardenTerrace':
      return gardenTerrace(ctx, run);
    case 'gardenPathJar':
      return gardenPathJar(ctx, run);
    case 'carBodySongshan':
      return carBody(ctx, run, K.songshan, K.songshanDeep);
    case 'neonStreet':
      return neonStreet(ctx, run);
    case 'marketLane':
      return marketLane(ctx, run);
    case 'stallFloor':
      return stallFloor(ctx, run);
    case 'stallShelf':
      return stallShelf(ctx, run);
    case 'stallCounter':
      return stallCounter(ctx, run);
    case 'carBodyWenhu':
      return carBody(ctx, run, A.wenhu, A.wenhuDeep);
    case 'terminalFloor':
      return terminalFloor(ctx, run);
    case 'deckBoards':
      return deckBoards(ctx, run);
    case 'bridgeFloor':
      return bridgeFloor(ctx, run);
    case 'catwalk':
      return catwalk(ctx, run);
    case 'arcadeShelf':
      return arcadeShelf(ctx, run);
    case 'karaokeStage':
      return karaokeStage(ctx, run);
    case 'campusPath':
      return campusPath(ctx, run);
    case 'lakeside':
      return lakeside(ctx, run);
    case 'gallery':
      return gallery(ctx, run);
    case 'libraryFloor':
      return libraryFloor(ctx, run);
    case 'desk':
      return desk(ctx, run);
    case 'bookPage':
      return bookPage(ctx, run);
    case 'carBodyXinyi':
      return carBody(ctx, run, P.xinyi, P.xinyiDeep);
    case 'parkPath':
      return parkPath(ctx, run);
    case 'boardwalk':
      return boardwalk(ctx, run);
    case 'stage':
      return stage(ctx, run);
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
  // A run wholly past the split is made of the split's material (1-6's right page, 2-1's platform)
  if (split !== undefined && !run.single && split.x <= run.x0) return styledLedge(ctx, run, split.style, theme);
  if (split === undefined || run.single || split.x >= run.x1) return styledLedge(ctx, run, main, theme);
  const [a, b] = [ctx.id(`ledgeL${run.y}`), ctx.id(`ledgeR${run.y}`)];
  return `<clipPath id="${a}"><rect x="-200" y="-200" width="${split.x + 200}" height="1200"/></clipPath><clipPath id="${b}"><rect x="${split.x}" y="-200" width="800" height="1200"/></clipPath>`
    + `<g clip-path="url(#${a})">${styledLedge(ctx, run, main, theme)}</g><g clip-path="url(#${b})">${styledLedge(ctx, run, split.style, theme)}</g>`;
}

/** A ramp in its page's material: plank ramps on the park's paths and boardwalks (#115), else the plain card. */
export function styledRamp(ctx: KitCtx, slope: Pick<Slope, 'from' | 'to'>, style: LedgeStyle, theme: StageTheme): string {
  if (style === 'lakeside') return stoneSteps(ctx, slope);
  // 貓空 (#126): the station's stairs, a terrace's stone step; a garden terrace's wall is its box (no ramp)
  if (style === 'zooPlaza' || style === 'zooPlatform') return stationStairs(ctx, slope);
  if (style === 'teaTerrace') return terraceStep(ctx, slope);
  if (style === 'cabinBench' || style === 'cabinRack' || style === 'cabinGlass') return '';
  if (style === 'gardenPath' || style === 'gardenPathJar' || style === 'gardenTerrace') return '';
  if (style !== 'parkPath' && style !== 'boardwalk') return plainRamp(ctx, slope, theme);
  const [[ax, ay], [bx, by]] = [slope.from, slope.to];
  const t = 12;
  const d = `M${ax} ${ay}L${bx} ${by}L${bx} ${by + t}L${ax} ${ay + t}Z`;
  const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 9));
  let planks = '';
  for (let i = 1; i < n; i++) {
    const k = i / n;
    const [x, y] = [ax + (bx - ax) * k, ay + (by - ay) * k];
    planks += `M${f1(x)} ${f1(y)}v${t}`;
  }
  return depth(ctx, 4, `<path d="${d}" fill="${P.plank}"/><path d="${planks}" stroke="${P.plankDeep}" stroke-width=".9" opacity=".6"/>`
    + `<path d="M${ax} ${ay + 0.5}L${bx} ${by + 0.5}" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<path d="${d}"/>`);
}

/** Stone steps down a slope (醉月湖's bank, #117): a flight of slabs, each a little box. */
function stoneSteps(ctx: KitCtx, slope: Pick<Slope, 'from' | 'to'>): string {
  const [[ax, ay], [bx, by]] = [slope.from, slope.to];
  const n = Math.max(2, Math.round(Math.abs(by - ay) / 10));
  let d = '';
  let lit = '';
  for (let i = 0; i < n; i++) {
    const [x0, y0] = [ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n];
    const [x1] = [ax + ((bx - ax) * (i + 1)) / n];
    const [lo, hi] = [Math.min(x0, x1) - 6, Math.max(x0, x1) + 6];
    d += `M${f1(lo)} ${f1(y0)}H${f1(hi)}V${f1(y0 + 12)}H${f1(lo)}Z`;
    lit += `M${f1(lo)} ${f1(y0 + 0.5)}H${f1(hi)}`;
  }
  return depth(ctx, 4, `<path d="${d}" fill="${K.stoneShade}"/><path d="${lit}" stroke="${K.stone}" stroke-width="2"/>`, `<path d="${d}"/>`);
}

/** An azalea bush in bloom (台大's foreground card, #117), its foot at the origin. */
function azaleaBush(ctx: KitCtx): string {
  const r = seeded(31);
  const puffs: [number, number, number][] = [[-16, -22, 17], [8, -30, 19], [-2, -46, 14], [22, -16, 13], [-28, -10, 11]];
  let d = '';
  for (const [x, y, pr] of puffs) d += `M${x - pr} ${y}a${pr} ${pr} 0 1 0 ${2 * pr} 0a${pr} ${pr} 0 1 0 ${-2 * pr} 0Z`;
  let blooms = '';
  let deep = '';
  for (let i = 0; i < 30; i++) {
    const [x, y, pr] = puffs[i % puffs.length];
    const a = r() * Math.PI * 2, k = r() * 0.85;
    const c = `<circle cx="${f1(x + Math.cos(a) * pr * k)}" cy="${f1(y + Math.sin(a) * pr * k)}" r="${f1(2 + r() * 1.8)}"/>`;
    if (i % 3) blooms += c;
    else deep += c;
  }
  return softEllipse(ctx, 0, 0, 40, 6, 'shadow', 0.4)
    + depth(ctx, 5, `<path d="${d}" fill="${K.azaleaLeaf}"/><g fill="${K.azaleaDeep}">${deep}</g><g fill="${K.azalea}">${blooms}</g>`
      + `<path d="M-30 -16q4 -14 16 -18M-6 -56q8 -6 18 -2" stroke="${K.palmLit}" stroke-width="1.4" fill="none" opacity=".45" stroke-linecap="round"/>`, `<path d="${d}"/>`);
}

/** A park shrub with a few lime fireflies resting on it (the park's foreground card, #115), its foot at the origin. */
function shrub(ctx: KitCtx): string {
  const r = seeded(29);
  const puffs: [number, number, number][] = [[-14, -26, 18], [10, -34, 20], [-2, -50, 16], [22, -18, 14], [-26, -12, 12]];
  let d = '';
  for (const [x, y, pr] of puffs) d += `M${x - pr} ${y}a${pr} ${pr} 0 1 0 ${2 * pr} 0a${pr} ${pr} 0 1 0 ${-2 * pr} 0Z`;
  let leaves = '';
  for (let i = 0; i < 26; i++) {
    const [x, y, pr] = puffs[i % puffs.length];
    const a = r() * Math.PI * 2;
    const lx = x + Math.cos(a) * pr * 0.85, ly = y + Math.sin(a) * pr * 0.85;
    const s = 7 + r() * 5;
    leaves += `M${f1(lx)} ${f1(ly)}q${f1(Math.cos(a - 0.6) * s * 0.6)} ${f1(Math.sin(a - 0.6) * s * 0.6)} ${f1(Math.cos(a) * s)} ${f1(Math.sin(a) * s)}q${f1(Math.cos(a + 0.6) * -s * 0.4)} ${f1(Math.sin(a + 0.6) * -s * 0.4)} ${f1(-Math.cos(a) * s)} ${f1(-Math.sin(a) * s)}z`;
  }
  const flies = [[-20, -44], [18, -52], [30, -28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${P.firefly}" opacity=".22"/><circle cx="${x}" cy="${y}" r="1.4" fill="${P.fireflyCore}"/>`).join('');
  return softEllipse(ctx, 0, 0, 40, 6, 'shadow', 0.4)
    + depth(ctx, 5, `<path d="${d}" fill="${P.canopyNear}"/><path d="${leaves}" fill="${P.canopyFront}"/>`
      + `<path d="M-30 -20q4 -14 16 -18M-6 -60q8 -6 18 -2" stroke="${P.canopyLit}" stroke-width="1.4" fill="none" opacity=".55" stroke-linecap="round"/>`
      + `<path d="M-30 -2h60" stroke="${C.shadow}" stroke-width="6" opacity=".18"/>`, `<path d="${d}"/>`)
    + flies;
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
    case 'shrub':
      return shrub(ctx);
    case 'azalea':
      return azaleaBush(ctx);
  }
}

