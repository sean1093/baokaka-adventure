import { POPUP as C, POPUP_MAOKONG as K, POPUP_AIRPORT as A, mixHex } from '../../../art/palette';
import { depth, f1, filterAttr, pageBlock, pinholes, ref, seeded, skyline, softEllipse, wheelRim, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, VANISHING_POINT, floorWiden } from '../../view/geometry';
import type { BackdropDraw, CutoutSource, PartSource } from '../sources';
import { blackBearArt, keeperArt } from '../../view/art/maokong';
import { FLOOR_RECT, bakedFlap, bookCues, calmMoon, flapSize, floorPage, kraftBack, lin, popFlap, rad, standingPage } from './common';

/**
 * Chapter 7 (貓空, 03:30) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#125) drew placeholders for 7-2's cable, 7-4's
 * clouds and 7-5's pool; the chapter's art issue (#126) draws the palette kit, the six backdrops and
 * every part.
 *
 * **The kit** (bible § 6 row 7, `POPUP_MAOKONG`): tea green and mist lilac dominant, gondola amber the
 * accent. The night hills of 木柵 and 貓空 stand in layers with **vellum mist** lying between them
 * (`hills`, `mistBand`: the signature, three layers), the **tea terraces** climb them in clipped rows
 * (`teaRows`, and the terraces' box folds, `teaTerrace` in `view/art/ledges.ts`), and the
 * **貓空纜車** crosses them on its cable, its cabins lit amber (`cableSpan`, `pylon`, `farCabin`; the
 * page's own cabins are riders, `view/art/riders.ts`). The moon is bigger here (bible § 6). Tea
 * houses (`teaHouse`) glow on the ridges with their lanterns, and far down the valley Taipei's lights
 * spread to a tiny 101 (`cityValley`).
 */

/** The page block under the floor page. */
const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};

type Pt = readonly [number, number];

const blur = (ctx: KitCtx, name: 'blur3' | 'blur8' | 'blur18' = 'blur3') => (ctx.filters ? filterAttr(ctx, name) : '');

// ——— The palette kit ———

/** 貓空's gradient defs, shared by the chapter's backdrops and parts. */
export function maokongDefs(ctx: KitCtx): string {
  return `<defs>`
    + lin(ctx, 'teaG', [[0, K.teaLit], [0.35, K.teaLight], [1, K.tea]])
    + lin(ctx, 'stoneG', [[0, K.stoneLight], [1, K.stoneDeep]])
    + lin(ctx, 'concreteG', [[0, K.concrete], [1, K.concreteDeep]])
    + lin(ctx, 'cabinG', [[0, K.cabin], [1, K.cabinShade]], 'h')
    + lin(ctx, 'steelG', [[0, K.steelDeep], [0.35, K.steel], [0.55, K.steelLight], [1, K.steelDeep]], 'h')
    + lin(ctx, 'steelV', [[0, K.steelLight], [1, K.steelDeep]])
    + lin(ctx, 'woodG', [[0, K.woodLight], [1, K.woodDeep]])
    + lin(ctx, 'clayG', [[0, K.clayLight], [0.5, K.clay], [1, K.clayDeep]], 'd')
    + lin(ctx, 'porcelainG', [[0, K.porcelain], [1, K.porcelainShade]], 'h')
    + lin(ctx, 'brewG', [[0, K.brewLight], [0.25, K.brew], [1, mixHex(K.brew, C.shadow, 0.45)]])
    + lin(ctx, 'mistV', [[0, K.mist, 0], [0.4, K.mist, 0.5], [1, K.mist, 0.75]])
    + lin(ctx, 'mistFade', [[0, K.mist, 0.55], [1, K.mist, 0]])
    + lin(ctx, 'valleyGlow', [[0, C.lampAmber, 0], [1, C.lampAmber, 0.22]])
    + rad(ctx, 'amberPool', [[0, C.lamp, 0.42], [0.55, K.gondolaAmber, 0.14], [1, K.gondolaAmber, 0]])
    + rad(ctx, 'moonPool', [[0, K.mist, 0.3], [0.6, K.mist, 0.08], [1, K.mist, 0]])
    + `</defs>`;
}

/** Light pools on the floor page: amber under the lamps, lilac moonlight. */
const pools = (ctx: KitCtx, list: readonly (readonly [number, number, number, number, ('amber' | 'moon')?])[]) =>
  list.map(([cx, cy, rx, ry, tone]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ref(ctx, tone === 'moon' ? 'moonPool' : 'amberPool')}"/>`).join('');

/** A smooth ridge line from x0 to x1 round `base`, rising up to `amp` (seeded), closed down to `floor`. */
function ridge(x0: number, x1: number, base: number, amp: number, seed: number, floor: number, step = 46): string {
  const r = seeded(seed);
  const pts: Pt[] = [];
  for (let x = x0; x <= x1 + step; x += step * (0.7 + r() * 0.6)) pts.push([x, base - amp * (0.25 + r() * 0.75)]);
  let d = `M${f1(x0)} ${floor}L${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [qx, qy] = pts[i];
    d += `Q${f1(px + (qx - px) * 0.5)} ${f1(Math.min(py, qy) - amp * 0.12)} ${f1(qx)} ${f1(qy)}`;
  }
  return `${d}L${f1(pts[pts.length - 1][0])} ${floor}Z`;
}

/**
 * A layer of vellum mist lying in a valley (bible § 6 row 7: "vellum mist layers"): a soft-topped
 * band of lilac tracing paper from `y` down `h`, its top edge rolling, a white 1.5 edge along it,
 * at `o` opacity. Vellum never takes a hard shadow (§ 3.1).
 */
function mistBand(ctx: KitCtx, x0: number, x1: number, y: number, h: number, seed: number, o = 0.5): string {
  const r = seeded(seed);
  let top = `M${f1(x0)} ${f1(y + 6)}`;
  for (let x = x0; x < x1;) {
    const w = 30 + r() * 40;
    top += `q${f1(w / 2)} ${f1(-8 - r() * 8)} ${f1(w)} ${f1((r() - 0.5) * 6)}`;
    x += w;
  }
  const d = `${top}V${f1(y + h)}H${f1(x0)}Z`;
  return `<path d="${d}" fill="${ref(ctx, 'mistV')}" opacity="${o}"/>`
    + `<path d="${top}" stroke="${C.vellum}" stroke-width="1.5" fill="none" opacity="${f1(o * 0.7)}"/>`;
}

/**
 * Tea rows on a hillside (the signature terraces in the distance): `n` contour rows of clipped tea
 * between y0 and y1, each a scalloped strip whose lit tops catch the moon, curving with `bend`.
 */
function teaRows(x0: number, x1: number, y0: number, y1: number, n: number, bend: number, seed: number): string {
  const r = seeded(seed);
  let lit = '';
  let body = '';
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    const y = y0 + (y1 - y0) * t;
    const s = 0.5 + t * 0.7;
    const h = 5 * s;
    let top = '';
    let x = x0 - r() * 8;
    top += `M${f1(x)} ${f1(y)}`;
    while (x < x1) {
      const w = (7 + r() * 4) * s;
      const yy = y - bend * Math.sin(((x - x0) / (x1 - x0)) * Math.PI);
      top += `Q${f1(x + w / 2)} ${f1(yy - h)} ${f1(x + w)} ${f1(yy)}`;
      x += w;
    }
    body += `${top}V${f1(y + h * 1.4)}H${f1(x0 - 10)}Z`;
    lit += top;
  }
  return `<path d="${body}" fill="${K.tea}"/>`
    + `<path d="${lit}" stroke="${K.teaLit}" stroke-width="1.2" fill="none" opacity=".7"/>`
    + `<path d="${lit}" stroke="${K.teaDeep}" stroke-width="1" fill="none" opacity=".5" transform="translate(0 3)"/>`;
}

/**
 * Terraces cascading down toward the reader on the floor page (below the play path): from `y0` to
 * the page's front edge, rows of clipped tea on dry-stone walls, each row a little deeper than the
 * one behind it (the floor's perspective).
 */
function lowerTerraces(x0: number, x1: number, y0: number, seed: number): string {
  let out = '';
  const r = seeded(seed);
  for (let y = y0, h = 26, i = 0; y < FLOOR_BOTTOM + 10; y += h, h *= 1.12, i++) {
    const wall = h * 0.55;
    let courses = '';
    for (let yy = y + 4; yy < y + wall; yy += 6) courses += `M${x0} ${f1(yy)}H${x1}`;
    for (let x = x0 + r() * 10; x < x1; x += 12 + r() * 8) courses += `M${f1(x)} ${f1(y)}v${f1(wall)}`;
    out += `<rect x="${x0}" y="${f1(y)}" width="${x1 - x0}" height="${f1(h + 2)}" fill="${mixHex(K.soilDeep, K.hillNear, 0.4)}"/>`
      + `<rect x="${x0}" y="${f1(y)}" width="${x1 - x0}" height="${f1(wall)}" fill="${mixHex(K.stone, K.hillNear, 0.58)}"/>`
      + `<path d="${courses}" stroke="${mixHex(K.stoneDeep, C.shadow, 0.3)}" stroke-width=".8" opacity=".7"/>`
      + teaRows(x0, x1, y + wall + h * 0.32, y + wall + h * 0.32, 1, 0, seed + i);
  }
  return out;
}

/**
 * The night hills of 貓空 in three layers with the mist between them (the chapter's signature):
 * far ridges in lilac-blue, the middle hills, the near shoulder in deep tea-green, a vellum band of
 * mist lying in front of each. `base` is the near layer's foot.
 */
function hills(ctx: KitCtx, base: number, seed: number, { far = base - 120, mid = base - 70, near = base - 26, rows = true } = {}): string {
  return depth(ctx, 1, `<path d="${ridge(-30, PAGE_W + 30, far, 50, seed, base)}" fill="${K.hillFar}"/>`, `<path d="${ridge(-30, PAGE_W + 30, far, 50, seed, base)}"/>`)
    + mistBand(ctx, -30, PAGE_W + 30, far + 12, 50, seed + 1, 0.42)
    + depth(ctx, 1, `<path d="${ridge(-30, PAGE_W + 30, mid, 46, seed + 2, base)}" fill="${K.hill}"/>`, `<path d="${ridge(-30, PAGE_W + 30, mid, 46, seed + 2, base)}"/>`)
    + (rows ? `<g opacity=".55">${teaRows(40, 260, mid + 6, mid + 34, 4, 6, seed + 3)}</g>` : '')
    + mistBand(ctx, -30, PAGE_W + 30, mid + 14, 46, seed + 4, 0.5)
    + depth(ctx, 2, `<path d="${ridge(-30, PAGE_W + 30, near, 30, seed + 5, base + 4, 60)}" fill="${K.hillNear}"/>`, `<path d="${ridge(-30, PAGE_W + 30, near, 30, seed + 5, base + 4, 60)}"/>`)
    + mistBand(ctx, -30, PAGE_W + 30, near + 10, Math.min(60, base - near), seed + 6, 0.4);
}

/** 貓空's sky: the colour clock's 03:30, pinholes, and the big moon (bible § 6: "the moon is bigger here"). */
function maokongSky(ctx: KitCtx, base: number, { moon = [300, 74, 30] as readonly [number, number, number] | null, seed = 7 } = {}): string {
  return `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, 0, 0, PAGE_W, base - 60, 54, seed)
    + (moon ? softEllipse(ctx, moon[0], moon[1], moon[2] * 2.6, moon[2] * 2.6, 'lamp', 0.08, 'blur18') + calmMoon(ctx, moon[0], moon[1], moon[2], { halo: 0.08 }) : '');
}

/**
 * Taipei far down the valley between the hills: a band of warm city lights in the haze, and 101 — a
 * tiny silhouette with its eight flared sections and a lit spire (the view 貓空 is loved for).
 */
function cityValley(ctx: KitCtx, x0: number, x1: number, base: number, seed: number, tower: number | null = null): string {
  const sk = skyline(x0, x1, base, seed, { minH: 4, maxH: 16, winP: 0.5, winOpacity: 0.9 });
  const r = seeded(seed + 9);
  let dots = '';
  for (let i = 0; i < (x1 - x0) / 4; i++) dots += `M${f1(x0 + r() * (x1 - x0))} ${f1(base - 2 + r() * 8)}h1.2`;
  let t101 = '';
  if (tower !== null) {
    const x = tower;
    let d = '';
    for (let k = 0; k < 6; k++) {
      const y = base - 16 - k * 6;
      d += `M${f1(x - 3.4)} ${f1(y)}L${f1(x - 2.6)} ${f1(y - 6)}H${f1(x + 2.6)}L${f1(x + 3.4)} ${f1(y)}Z`;
    }
    t101 = `<path d="M${f1(x - 3)} ${base}V${base - 16}H${f1(x + 3)}V${base}Z${d}" fill="${mixHex(K.hillFar, C.shadow, 0.2)}"/>`
      + `<path d="M${x} ${base - 52}V${base - 62}" stroke="${mixHex(K.hillFar, C.shadow, 0.2)}" stroke-width="1"/>`
      + softEllipse(ctx, x, base - 62, 2, 2, 'lamp', 0.4) + `<circle cx="${x}" cy="${base - 62}" r=".9" fill="${C.lampHot}"/>`;
  }
  return `<rect x="${x0}" y="${base - 18}" width="${x1 - x0}" height="22" fill="${ref(ctx, 'valleyGlow')}"/>`
    + t101 + `<path d="${sk.d}" fill="${mixHex(K.hillFar, C.shadow, 0.3)}"/>` + sk.windows
    + `<path d="${dots}" stroke="${C.lamp}" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`;
}

/** A gondola pylon (a slim lattice tower) from its foot `base` up `h`, its cross-arm and sheaves at the top. */
function pylon(ctx: KitCtx, x: number, base: number, h: number, s = 1): string {
  const top = base - h;
  let lattice = '';
  for (let y = top + 10 * s; y < base - 6; y += 12 * s) {
    const k = (y - top) / h;
    const w0 = (3 + k * 7) * s;
    const w1 = (3 + ((y + 12 * s - top) / h) * 7) * s;
    lattice += `M${f1(x - w0)} ${f1(y)}L${f1(x + w1)} ${f1(y + 12 * s)}M${f1(x + w0)} ${f1(y)}L${f1(x - w1)} ${f1(y + 12 * s)}`;
  }
  const legs = `M${f1(x - 3 * s)} ${f1(top + 6 * s)}L${f1(x - 10 * s)} ${base}M${f1(x + 3 * s)} ${f1(top + 6 * s)}L${f1(x + 10 * s)} ${base}`;
  return depth(ctx, 2, `<path d="${legs}" stroke="${K.steelDeep}" stroke-width="${f1(2.2 * s)}"/><path d="${lattice}" stroke="${K.steelDeep}" stroke-width="${f1(0.9 * s)}"/>`
    + `<rect x="${f1(x - 14 * s)}" y="${f1(top)}" width="${f1(28 * s)}" height="${f1(4 * s)}" rx="${f1(1.4 * s)}" fill="${K.steel}"/>`
    + `<circle cx="${f1(x - 10 * s)}" cy="${f1(top + 1)}" r="${f1(2.4 * s)}" fill="${K.steelDeep}"/><circle cx="${f1(x + 10 * s)}" cy="${f1(top + 1)}" r="${f1(2.4 * s)}" fill="${K.steelDeep}"/>`,
  `<rect x="${f1(x - 14 * s)}" y="${f1(top)}" width="${f1(28 * s)}" height="${f1(h)}"/>`)
    + softEllipse(ctx, x, top - 3 * s, 3 * s, 3 * s, 'lamp', 0.4) + `<circle cx="${x}" cy="${f1(top - 3 * s)}" r="${f1(1.2 * s)}" fill="${A.wingRed}"/>`;
}

/** A sagging cable from a to b (`sag` at its middle), with a faint lit edge. */
function cableSpan(a: Pt, b: Pt, sag: number, w = 1.2): string {
  const d = `M${f1(a[0])} ${f1(a[1])}Q${f1((a[0] + b[0]) / 2)} ${f1((a[1] + b[1]) / 2 + sag * 2)} ${f1(b[0])} ${f1(b[1])}`;
  return `<path d="${d}" stroke="${K.cable}" stroke-width="${w}" fill="none"/><path d="${d}" stroke="${K.steelLight}" stroke-width="${f1(w * 0.35)}" fill="none" opacity=".35" transform="translate(0 -.5)"/>`;
}

/** A point on the cable from a to b at t (the same curve as `cableSpan`). */
function onCable(a: Pt, b: Pt, sag: number, t: number): Pt {
  const c: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag * 2];
  return [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
}

/**
 * A distant gondola cabin hanging from the cable at (x, y) (the cable's grip), `s` × a 30-unit
 * cabin: its hanger, a white rounded box with a tea-green band and its windows lit gondola amber.
 */
function farCabin(ctx: KitCtx, x: number, y: number, s: number, lit = true): string {
  const k = (n: number) => f1(n * s);
  const top = y + 10 * s;
  const body = `M${f1(x - 7 * s)} ${f1(top + 13 * s)}V${f1(top + 3 * s)}Q${f1(x - 7 * s)} ${f1(top)} ${f1(x - 4 * s)} ${f1(top)}H${f1(x + 4 * s)}Q${f1(x + 7 * s)} ${f1(top)} ${f1(x + 7 * s)} ${f1(top + 3 * s)}V${f1(top + 13 * s)}Z`;
  return `<path d="M${f1(x)} ${f1(y)}V${f1(top)}" stroke="${K.cable}" stroke-width="${k(0.8)}"/>`
    + (lit ? softEllipse(ctx, x, top + 6 * s, 9 * s, 7 * s, 'lamp', 0.22) : '')
    + `<path d="${body}" fill="${K.cabin}"/><rect x="${f1(x - 5.6 * s)}" y="${f1(top + 2.6 * s)}" width="${k(11.2)}" height="${k(5.4)}" rx="${k(1)}" fill="${lit ? K.gondolaAmber : K.steelDeep}"/>`
    + `<rect x="${f1(x - 7 * s)}" y="${f1(top + 9 * s)}" width="${k(14)}" height="${k(1.8)}" fill="${K.cabinBand}"/>`;
}

/**
 * A tea house (茶藝館) on a ridge, `s` × a 60-unit house: a hipped tiled roof with upturned eaves, a
 * lit lattice front behind its veranda, two red paper lanterns, a little sign.
 */
function teaHouse(ctx: KitCtx, x: number, y: number, s: number, sign = ''): string {
  const k = (n: number) => f1(n * s);
  const P = (dx: number, dy: number) => `${f1(x + dx * s)} ${f1(y + dy * s)}`;
  const roof = `M${P(-36, -26)}Q${P(-30, -28)} ${P(-24, -40)}L${P(24, -40)}Q${P(30, -28)} ${P(36, -26)}L${P(30, -24)}L${P(-30, -24)}Z`;
  const wall = `M${P(-26, 0)}L${P(-26, -24)}L${P(26, -24)}L${P(26, 0)}Z`;
  let lattice = '';
  for (let i = -20; i <= 20; i += 6) lattice += `M${P(i, -21)}V${f1(y - 3 * s)}`;
  const lantern = (dx: number) => softEllipse(ctx, x + dx * s, y - 16 * s, 5 * s, 5 * s, 'lamp', 0.35)
    + `<ellipse cx="${f1(x + dx * s)}" cy="${f1(y - 16 * s)}" rx="${k(3)}" ry="${k(4)}" fill="${C.hatRed}"/><path d="M${P(dx, -20)}v${k(-3)}" stroke="${C.printDark}" stroke-width="${k(0.5)}"/>`;
  return depth(ctx, 2, `<path d="${wall}" fill="${mixHex(K.woodDeep, C.shadow, 0.2)}"/>`
    + `<rect x="${f1(x - 22 * s)}" y="${f1(y - 22 * s)}" width="${k(44)}" height="${k(19)}" fill="${ref(ctx, 'window')}"/>`
    + `<path d="${lattice}M${P(-22, -13)}H${f1(x + 22 * s)}" stroke="${K.woodDeep}" stroke-width="${k(0.9)}"/>`
    + `<path d="${roof}" fill="${mixHex(K.stoneDeep, C.shadow, 0.25)}"/><path d="M${P(-24, -40)}H${f1(x + 24 * s)}" stroke="${K.stoneLight}" stroke-width="${k(1)}" opacity=".6"/>`
    + `<path d="M${P(-36, -26)}Q${P(-30, -28)} ${P(-24, -40)}" stroke="${C.cutRim}" stroke-width="${k(0.6)}" fill="none" opacity=".4"/>`, `<path d="${roof}${wall}"/>`)
    + softEllipse(ctx, x, y - 10 * s, 30 * s, 12 * s, 'lamp', 0.18, 'blur8')
    + lantern(-16) + lantern(16)
    + (sign ? `<rect x="${f1(x - 9 * s)}" y="${f1(y - 37 * s)}" width="${k(18)}" height="${k(8)}" fill="${K.woodDeep}"/><text data-art-text="" x="${x}" y="${f1(y - 31.4 * s)}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${k(5.6)}" fill="${C.lampAmber}">${sign}</text>` : '');
}

/**
 * A broadleaf tree crown at night (the zoo's forest, the hills' trees): leaf clusters in the shade
 * tone, their moonlit faces (upper left) in a lighter tone, a few lit leaf edges — paper layered in
 * three tones, so it reads round.
 */
function treeCrown(ctx: KitCtx, x: number, y: number, r: number, seed: number, tone: string = K.teaDeep, z: 1 | 2 | 3 | 4 = 2): string {
  const rr = seeded(seed);
  const disc = (cx: number, cy: number, cr: number) => `M${f1(cx - cr)} ${f1(cy)}a${f1(cr)} ${f1(cr)} 0 1 0 ${f1(2 * cr)} 0a${f1(cr)} ${f1(cr)} 0 1 0 ${f1(-2 * cr)} 0z`;
  let shade = '';
  let face = '';
  let lit = '';
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rr() * 0.6;
    const d = r * (0.35 + rr() * 0.25);
    const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * 0.7;
    const cr = r * (0.36 + rr() * 0.16);
    shade += disc(cx, cy, cr);
    // The moonlit face: a smaller disc nudged up and left
    face += disc(cx - cr * 0.18, cy - cr * 0.22, cr * 0.78);
    if (cy < y + r * 0.1) lit += `M${f1(cx - cr * 0.75)} ${f1(cy - cr * 0.35)}q${f1(cr * 0.45)} ${f1(-cr * 0.6)} ${f1(cr * 1.05)} ${f1(-cr * 0.5)}`;
  }
  shade += disc(x, y, r * 0.7);
  return depth(ctx, z, `<path d="${shade}" fill="${mixHex(tone, C.shadow, 0.35)}"/><path d="${face}" fill="${tone}"/>`
    + `<path d="${lit}" stroke="${mixHex(tone, K.teaLit, 0.55)}" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".75"/>`, `<path d="${shade}"/>`);
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

/** Paving on the floor page: rows of bricks receding to the vanishing point between x0 and x1, from `top` down. */
function pavers(top: number, { x0 = FLOOR_RECT.x, x1 = FLOOR_RECT.x + FLOOR_RECT.w, tone = K.stone as string, seed = 3 } = {}): string {
  const [vx, vy] = VANISHING_POINT;
  let rows = '';
  let joints = '';
  const r = seeded(seed);
  for (let y = top + 8, step = 9, i = 0; y < FLOOR_BOTTOM; step *= 1.08, y += step, i++) {
    rows += `M${x0} ${f1(y)}H${x1}`;
    const w = step * 2.6;
    for (let x = x0 + (i % 2 ? w / 2 : 0) + r() * 2; x < x1; x += w) {
      const k = (y - FLOOR_BOTTOM) / (vy - FLOOR_BOTTOM);
      joints += `M${f1(x + (vx - x) * k)} ${f1(y)}v${f1(-step)}`;
    }
  }
  return `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="${FLOOR_BOTTOM - top}" fill="${tone}"/>`
    + `<path d="${rows}${joints}" stroke="${mixHex(tone, C.shadow, 0.45)}" stroke-width=".9" opacity=".55"/>`;
}

// ——— 7-1 「往動物園」 ———

/**
 * 7-1: 動物園 station at the end of the 文湖線, the elevated platform at night (its ledge at y 420,
 * the stairs down at x 226–262 to the plaza at y 494). Left: the station's curved canopy over the
 * platform, the brown 文湖線 car stopped at the buffer (終點站), the station's sign, the panda sign's
 * hangers (the sign itself is the decoy, drawn live at (44, 300)); the platform bench (Mocha's
 * `bench`, its backrest's top at (96, 364)). Right: the plaza at the zoo's gate — the gateway's arch
 * over the path (the 土地公 on its crossbar at (352, 408)), the zoo's dark trees behind, the plaza's
 * lamp post (Mocha's `lamp`, its lantern's top at (286, 380)); a planter under the stairs where the
 * pangolin sleeps (214, 528). Beyond: the hills of 貓空 under the big moon, mist in the valleys, the
 * gondola's lit cabins crossing the ridge.
 */
const zooStation: BackdropDraw = (ctx) => {
  const sky = maokongSky(ctx, 250, { moon: [318, 70, 27], seed: 71 });
  // The gondola crossing the hills behind: two pylons, the cable, little lit cabins
  const a: Pt = [150, 214], b: Pt = [262, 160], c: Pt = [410, 120];
  const gondola = pylon(ctx, 150, 262, 50, 0.7) + pylon(ctx, 262, 214, 56, 0.7)
    + cableSpan([-20, 250], a, 4) + cableSpan(a, b, 6) + cableSpan(b, c, 5)
    + [[0.3, a, b], [0.75, a, b], [0.5, b, c]].map(([t, p, q]) => {
      const [x, y] = onCable(p as Pt, q as Pt, 6, t as number);
      return farCabin(ctx, x, y, 0.62);
    }).join('');
  const ridges = hills(ctx, GUTTER_Y + 4, 72, { far: 200, mid: 236, near: 270 });
  // The zoo's trees behind the gate (right), dark canopies with moonlit tops
  // The zoo's boundary hedge and its path lights along the foot of the trees
  const hedgeRow = depth(ctx, 2, `<path d="M214 360V332${Array.from({ length: 10 }, () => 'q10 -12 20 0').join('')}V360Z" fill="${mixHex(K.teaDeep, K.hillNear, 0.3)}"/>`, `<rect x="214" y="320" width="200" height="40"/>`)
    + [236, 276, 316, 356, 396].map((x) => softEllipse(ctx, x, 340, 8, 5, 'lamp', 0.3) + `<circle cx="${x}" cy="340" r="1.6" fill="${C.lamp}"/>`).join('');
  const trees = treeCrown(ctx, 300, 300, 40, 73, K.teaDeep) + treeCrown(ctx, 370, 286, 46, 74, mixHex(K.teaDeep, K.hillNear, 0.4))
    + treeCrown(ctx, 236, 322, 30, 75, mixHex(K.tea, K.teaDeep, 0.5)) + treeCrown(ctx, 400, 330, 36, 76, K.teaDeep, 3) + hedgeRow;
  // The station: the elevated deck's structure under the canopy, the curved roof on its columns
  const roof = 'M-30 214Q100 176 236 210L240 222Q100 190 -30 228Z';
  const station = depth(ctx, 2, `<rect x="-30" y="226" width="252" height="134" fill="${mixHex(K.concreteDeep, K.hillNear, 0.55)}"/>`
    + `<path d="M8 228V360M100 220V360M190 222V360" stroke="${K.steelDeep}" stroke-width="5"/>`
    + `<path d="${roof}" fill="${ref(ctx, 'steelV')}"/><path d="M-30 214Q100 176 236 210" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".5"/>`
    + `<path d="M-30 228Q100 190 240 222" stroke="${K.steelDeep}" stroke-width="2" fill="none"/>`, `<path d="${roof}"/><rect x="-30" y="226" width="252" height="134"/>`)
    // The canopy's strip lights
    + [30, 76, 122, 168].map((x) => `<rect x="${x - 9}" y="${f1(222 - (x - 100) * (x - 100) * -0.0006 - 12)}" width="18" height="3" rx="1.5" fill="${C.lampHot}"/>`).join('')
    + softEllipse(ctx, 100, 240, 130, 16, 'lamp', 0.18, 'blur8');
  // The 文湖線 car stopped at the end of the line, its doors open, lit inside; the buffer stop
  const carBody = 'M-30 262H150Q170 262 176 280V350H-30Z';
  let windows = '';
  for (let x = -20; x < 140; x += 26) windows += `M${x} 276h18v26h-18z`;
  const car = depth(ctx, 2, `<path d="${carBody}" fill="${A.carWall}"/><rect x="-30" y="318" width="206" height="10" fill="${A.wenhu}"/>`
    + `<path d="${windows}" fill="${ref(ctx, 'window')}"/><path d="M150 268Q166 270 170 286H150Z" fill="${A.glassDeep}"/>`
    + `<rect x="40" y="274" width="22" height="76" fill="${mixHex(A.carWall, C.lamp, 0.5)}"/><path d="M51 274V350" stroke="${A.carWallShade}" stroke-width="1"/>`
    + `<path d="M-30 262.8H150" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/><circle cx="172" cy="334" r="2.6" fill="${C.lampHot}"/>`, `<path d="${carBody}"/>`)
    + softEllipse(ctx, 50, 340, 40, 20, 'lamp', 0.25, 'blur8')
    + depth(ctx, 2, `<path d="M190 330H214V354H190Z" fill="${C.hatRed}"/><path d="M190 336H214M190 346H214" stroke="${C.cutRim}" stroke-width="2" opacity=".7"/>`, `<rect x="190" y="330" width="24" height="24"/>`);
  // The station's sign under the canopy: 「動物園」, 「終點站」 under it
  const sign = depth(ctx, 2, `<rect x="96" y="238" width="86" height="26" rx="3" fill="${A.wenhuDeep}"/><path d="M110 228V238M168 228V238" stroke="${K.steelDeep}" stroke-width="1.6"/>`, `<rect x="96" y="238" width="86" height="26"/>`)
    + `<text data-art-text="" x="139" y="255" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="13" fill="${C.chalk}" letter-spacing="2">動物園</text>`
    + `<text data-art-text="" x="139" y="262" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="5" fill="${C.chalk}" opacity=".75">Taipei Zoo · 終點站</text>`;
  // The panda sign's two hangers from the canopy (the sign itself is the decoy, drawn live at (44, 300))
  const hangers = `<path d="M30 216V287M58 214V287" stroke="${K.steelDeep}" stroke-width="1.4"/>`;
  // The platform's back rail (glass panels) along the deck's edge, the bench (backrest top at y 364)
  const rail = `<rect x="-30" y="352" width="282" height="8" fill="${K.steelDeep}"/>`
    + `<rect x="-30" y="300" width="282" height="52" fill="${A.glass}" opacity=".16"/><path d="${Array.from({ length: 6 }, (_, i) => `M${-6 + i * 50} 300V352`).join('')}" stroke="${K.steel}" stroke-width="2"/>`
    + `<path d="M-30 300H252" stroke="${K.steelLight}" stroke-width="2"/>`;
  const bench = depth(ctx, 3, `<rect x="68" y="364" width="56" height="6" rx="2" fill="${A.wenhu}"/><rect x="66" y="386" width="60" height="7" rx="2" fill="${A.wenhu}"/>`
    + `<path d="M72 370V410M120 370V410M72 393V412M120 393V412" stroke="${K.steelDeep}" stroke-width="3"/>`
    + `<path d="M68 364.8H124" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<rect x="66" y="364" width="60" height="48"/>`);
  // The zoo's gateway over the path (crossbar under the 土地公 at y 408): two stone pillars, an arched
  // sign board 「動物園」 with a giraffe and an elephant cut-out on top, lanterns on the pillars
  const gate = depth(ctx, 3, `<rect x="318" y="410" width="12" height="80" fill="${ref(ctx, 'stoneG')}"/><rect x="384" y="410" width="12" height="80" fill="${ref(ctx, 'stoneG')}"/>`
    + `<path d="M312 414Q357 396 402 414V424Q357 406 312 424Z" fill="${K.woodDeep}"/><path d="M312 414Q357 396 402 414" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".5"/>`
    + `<rect x="316" y="404" width="16" height="6" rx="1" fill="${K.stoneDeep}"/><rect x="382" y="404" width="16" height="6" rx="1" fill="${K.stoneDeep}"/>`, `<rect x="312" y="396" width="90" height="94"/>`)
    + `<text data-art-text="" x="357" y="418.6" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${C.lampAmber}" letter-spacing="1.4">動物園</text>`
    // The giraffe and the elephant on the board's ends (printed silhouettes)
    + `<path d="M318 404l2 -18l-3 -2l1 -3l6 2l-2 3l-1 18zM326 404v-6h5v6z" fill="${K.khakiDeep}"/>`
    + `<path d="M386 404q-2 -10 6 -12q8 -1 9 6q4 1 3 6h-3q0 -3 -2 -3v3h-4v-3h-3v3z" fill="${K.khakiDeep}"/>`
    + softEllipse(ctx, 324, 404, 8, 6, 'lamp', 0.4) + softEllipse(ctx, 390, 404, 8, 6, 'lamp', 0.4)
    + `<circle cx="324" cy="402" r="2.4" fill="${C.lamp}"/><circle cx="390" cy="402" r="2.4" fill="${C.lamp}"/>`;
  // The plaza's lamp post (its lantern's top at (286, 380))
  const lamp = depth(ctx, 3, `<path d="M286 400V486" stroke="${K.steelDeep}" stroke-width="3.4"/><path d="M280 486h12" stroke="${K.steelDeep}" stroke-width="4"/>`
    + `<path d="M278 380H294L291 398H281Z" fill="${C.printDark}"/>`, `<path d="M278 380H294L291 398H281Z"/><rect x="284" y="398" width="4" height="90"/>`)
    + softEllipse(ctx, 286, 390, 18, 16, 'lamp', 0.4, 'blur8') + `<path d="M280.6 384H291.4L289.4 396H282.6Z" fill="${C.lamp}"/>`;
  // The floor page: under the elevated platform, the dark; the plaza's pavers from the stairs on
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(K.hillNear, C.shadow, 0.3)}"/>`
    + pavers(GUTTER_Y, { tone: mixHex(K.path, K.stoneDeep, 0.55), seed: 77 })
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${ref(ctx, 'floorShade')}" opacity=".35"/>`
    // A mosaic roundel set in the plaza's paving: a ring of leaves round a little elephant
    + `<g opacity=".35"><ellipse cx="300" cy="590" rx="60" ry="22" fill="none" stroke="${K.stoneLight}" stroke-width="3"/><ellipse cx="300" cy="590" rx="48" ry="17" fill="none" stroke="${K.teaLight}" stroke-width="2" stroke-dasharray="6 5"/>`
    + `<path d="M284 594q-2 -12 10 -13q12 -1 14 8q6 1 5 9h-4q0 -4 -3 -4v4h-5v-4h-5v4h-6z" fill="${K.stoneLight}"/></g>`
    + pools(ctx, [[286, 480, 90, 26], [357, 510, 70, 20], [110, GUTTER_Y + 30, 150, 20, 'moon']])
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="22" fill="${C.shadow}" opacity=".24"/>`);
  // Under the elevated platform: its concrete piers standing on the floor page in the platform's shadow
  const piers = `<path d="M-30 472H252V520Q110 540 -30 524Z" fill="${C.shadow}" opacity=".3"/>`
    + [24, 136].map((x) => depth(ctx, 3, `<rect x="${x - 9}" y="472" width="18" height="${x === 24 ? 120 : 110}" fill="${ref(ctx, 'concreteG')}"/><path d="M${x - 8} 474V${x === 24 ? 590 : 580}" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`, `<rect x="${x - 9}" y="472" width="18" height="110"/>`)).join('');
  // The planter under the stairs (the pangolin's, its soil at y 528): a stone box of ferns
  const fern = (x: number, y: number, dir: number, len: number) => {
    let leaves = '';
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const px = x + dir * len * 0.3 * t, py = y - len * t;
      leaves += `M${f1(px)} ${f1(py)}q${f1(-6 * (1 - t) - 2)} ${f1(-2)} ${f1(-9 * (1 - t) - 3)} ${f1(3)}M${f1(px)} ${f1(py)}q${f1(6 * (1 - t) + 2)} ${f1(-2)} ${f1(9 * (1 - t) + 3)} ${f1(3)}`;
    }
    return `<path d="M${x} ${y}q${f1(dir * len * 0.2)} ${f1(-len * 0.5)} ${f1(dir * len * 0.3)} ${f1(-len)}" stroke="${K.teaLight}" stroke-width="1.4" fill="none"/><path d="${leaves}" stroke="${K.teaLight}" stroke-width="2" stroke-linecap="round" fill="none"/>`;
  };
  const planter = fern(184, 524, -1, 26) + fern(196, 524, 1, 22) + fern(238, 524, 1, 26) + fern(228, 524, -1, 18)
    + depth(ctx, 4, `<path d="M172 528H254L250 562H176Z" fill="${ref(ctx, 'stoneG')}"/><path d="M172 528.8H254" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`
    + `<rect x="176" y="522" width="74" height="7" rx="3" fill="${K.soilDeep}"/>`, `<path d="M172 528H254L250 562H176Z"/>`);
  // The plaza's front: a signpost to the zoo (animal pictograms), bollards, a banana plant in the corner
  const signpost = depth(ctx, 4, `<path d="M316 600V548" stroke="${K.woodDeep}" stroke-width="3.4"/><path d="M300 548H346L352 556L346 564H300Z" fill="${K.keeperGreen}"/>`
    + `<path d="M300 548.8H346" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`, `<path d="M300 548H352V600H300Z"/>`)
    + `<text data-art-text="" x="322" y="559.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7.4" fill="${C.chalk}">動物園 →</text>`;
  const bollards = [262, 282].map((x) => depth(ctx, 4, `<rect x="${x - 3}" y="586" width="6" height="18" rx="3" fill="${K.steel}"/><rect x="${x - 3}" y="590" width="6" height="2" fill="${C.ochre}"/>`, `<rect x="${x - 3}" y="586" width="6" height="18"/>`)).join('');
  const banana = (x: number, y: number) => {
    const leaf = (a: number, l: number) => {
      const r = (a * Math.PI) / 180;
      const [tx, ty] = [x + Math.sin(r) * l, y - Math.cos(r) * l];
      const [nx, ny] = [Math.cos(r) * 9, Math.sin(r) * 9];
      return `M${x} ${y - 8}Q${f1((x + tx) / 2 + nx)} ${f1((y + ty) / 2 + ny - 4)} ${f1(tx)} ${f1(ty)}Q${f1((x + tx) / 2 - nx)} ${f1((y + ty) / 2 - ny - 4)} ${x} ${y - 8}Z`;
    };
    const d = leaf(-60, 46) + leaf(-24, 54) + leaf(18, 50) + leaf(58, 42);
    return depth(ctx, 4, `<path d="M${x - 3} ${y}V${y - 14}H${x + 3}V${y}Z" fill="${K.teaDeep}"/><path d="${d}" fill="${K.tea}"/><path d="${d}" fill="none" stroke="${K.teaLit}" stroke-width=".8" opacity=".6"/>`, `<path d="${d}"/>`);
  };
  const plants = banana(372, 640) + banana(-8, 646);
  return maokongDefs(ctx) + standingPage(ctx, sky + ridges + gondola + trees + station + car + sign + hangers + rail)
    + floor + piers + bench + gate + lamp + planter + signpost + bollards + plants + bookCues(ctx) + block();
};



// ——— 7-2's cable ———

/**
 * 7-2's cable: the up run through the slots' hangers (the cabins' nodes 60 units under them,
 * `c7/p2.ts`: the bottom station (150, 410), over the zoo (234, 325), the top station (318, 240)),
 * the down run behind it, 25 units back and up (through (209, 300)). Each run ends round its
 * station's bullwheel.
 */
const UP_ENDS: readonly [Pt, Pt] = [[128, 432], [342, 216]];
const BACK: Pt = [-25, -25];
const DOWN_ENDS: readonly [Pt, Pt] = [[UP_ENDS[0][0] + BACK[0], UP_ENDS[0][1] + BACK[1]], [UP_ENDS[1][0] + BACK[0], UP_ENDS[1][1] + BACK[1]]];

/** A station's bullwheel seen nearly edge-on, turning between the near run (`near`) and the far one (`far`). */
function bullwheel(ctx: KitCtx, near: Pt, far: Pt): string {
  const [cx, cy] = [(near[0] + far[0]) / 2, (near[1] + far[1]) / 2];
  const len = Math.hypot(far[0] - near[0], far[1] - near[1]) / 2 + 5;
  const ang = (Math.atan2(far[1] - near[1], far[0] - near[0]) * 180) / Math.PI;
  return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(ang)})">`
    + depth(ctx, 2, `<ellipse rx="${f1(len)}" ry="5.6" fill="${K.cable}"/><ellipse rx="${f1(len - 2.4)}" ry="3.6" fill="${K.steelDeep}"/><ellipse rx="${f1(len - 8)}" ry="1.8" fill="${K.cable}"/>`
      + `<path d="M${f1(-len + 4)} -1.6Q0 -5 ${f1(len - 4)} -1.6" stroke="${K.steel}" stroke-width=".8" fill="none" opacity=".6"/>`, `<ellipse rx="${f1(len)}" ry="5.6"/>`)
    + `</g>`;
}

/**
 * 7-2's cable (a cut-out at the page's origin, drawn in page units): the two runs of steel haul rope
 * between the bottom station's bullwheel and the top station's, sagging a little, each with its
 * moonlit edge, and the two bullwheels they turn round. The cabins ride its slots (riders,
 * `view/art/riders.ts`).
 */
const cable: CutoutSource = {
  chapter: 7,
  box: { x: 80, y: 170, w: 290, h: 280 },
  draw(ctx) {
    return maokongDefs(ctx)
      + cableSpan(DOWN_ENDS[0], DOWN_ENDS[1], 1.5, 1.6)
      + bullwheel(ctx, UP_ENDS[0], DOWN_ENDS[0]) + bullwheel(ctx, UP_ENDS[1], DOWN_ENDS[1])
      + cableSpan(UP_ENDS[0], UP_ENDS[1], 1.5, 2);
  },
};

// ——— 7-2 「纜車站」 ———

/**
 * 7-2: the 貓空纜車 over the zoo at night. Bottom left, 動物園 station: its concrete hall under a
 * deep roof, the cabins' bay and the bullwheel's housing (the bullwheel and the cable are the
 * `c7/cable` cut-out), the boarding deck (y 486) and the ticket booth on it (Mocha's `booth`, its
 * roof at (60, 392)). Top right, the top station (貓空): its hall and roof round the top bullwheel,
 * the cabins' docking bay at (318, 300) and the platform running back over the valley (y 300; the
 * turnstile is a part at (220, 300)). Between them, far below the cable, the zoo's forest canopy
 * under the moon (the 土地公 on a treetop at (330, 430)); the drive's housing on the floor page
 * (the crank, a part at (236, 524)). Behind, the hills and their mist, the line's pylons climbing on
 * toward 貓空 with lit cabins.
 */
const gondolaStation: BackdropDraw = (ctx) => {
  const sky = maokongSky(ctx, 220, { moon: [74, 74, 27], seed: 81 });
  const ridges = hills(ctx, GUTTER_Y + 4, 82, { far: 180, mid: 214, near: 252 });
  // The line climbing on from the top station toward 貓空: pylons on the ridges, far lit cabins
  const p1: Pt = [380, 150], p2: Pt = [430, 120];
  const onward = pylon(ctx, 380, 214, 64, 0.6) + cableSpan([360, 196], p1, 2, 1) + cableSpan(p1, p2, 2, 1)
    + farCabin(ctx, 404, 137, 0.5);
  // The far ridge's tea house, lit (the tea houses of 貓空 wait at the top of the line)
  const house = teaHouse(ctx, 196, 196, 0.42, '');
  // The top station: its hall (x 290–400) round the bullwheel, a deep roof, lit windows, the docking bay
  const hallTop = 168;
  const hall = depth(ctx, 2, `<rect x="286" y="${hallTop + 14}" width="130" height="${300 - hallTop - 14}" fill="${ref(ctx, 'concreteG')}"/>`
    + `<rect x="300" y="${hallTop + 30}" width="100" height="20" fill="${ref(ctx, 'window')}"/><path d="M325 ${hallTop + 30}v20M350 ${hallTop + 30}v20M375 ${hallTop + 30}v20" stroke="${K.concreteDeep}" stroke-width="2"/>`
    + `<rect x="290" y="244" width="58" height="56" fill="${mixHex(K.concreteDeep, C.shadow, 0.35)}"/><path d="M286 182H352V236L330 244H286Z" fill="${mixHex(K.concreteDeep, C.shadow, 0.5)}"/>`
    + `<path d="M276 ${hallTop + 16}L300 ${hallTop}H410V${hallTop + 16}Z" fill="${K.cabinBand}"/><path d="M276 ${hallTop + 16}L300 ${hallTop}H410" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".5"/>`
    + `<rect x="276" y="${hallTop + 16}" width="140" height="4" fill="${mixHex(K.cabinBand, C.shadow, 0.4)}"/>`, `<rect x="276" y="${hallTop}" width="140" height="${300 - hallTop}"/>`)
    + softEllipse(ctx, 318, 280, 30, 20, 'lamp', 0.3, 'blur8')
    + `<rect x="354" y="${hallTop + 56}" width="40" height="13" rx="2" fill="${K.hillNear}"/>`
    + `<text data-art-text="" x="374" y="${hallTop + 65.6}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8.4" fill="${C.chalk}">貓空站</text>`;
  // Under the top platform (it runs back over the valley at y 300): its steel trusses down into the trees
  let truss = '';
  for (let x = 160; x < 290; x += 26) truss += `M${x} 352L${x + 13} 400L${x + 26} 352`;
  const struts = `<path d="${truss}M154 352V420M286 352V420" stroke="${K.steelDeep}" stroke-width="2.2" fill="none"/>`;
  // The zoo's forest canopy far below the cable (seen from above, on the floor page)
  const canopy = `<path d="M170 650V400Q200 384 240 392Q300 376 360 388Q400 380 430 392V650Z" fill="${mixHex(K.teaDeep, C.shadow, 0.5)}"/>`
    + treeCrown(ctx, 220, 420, 36, 83, K.teaDeep, 1) + treeCrown(ctx, 300, 410, 42, 84, mixHex(K.tea, K.teaDeep, 0.6), 1)
    + treeCrown(ctx, 380, 420, 40, 85, K.teaDeep, 1) + treeCrown(ctx, 260, 460, 40, 86, K.tea, 2) + treeCrown(ctx, 340, 466, 44, 87, mixHex(K.tea, K.teaDeep, 0.4), 2)
    + treeCrown(ctx, 200, 480, 30, 88, K.teaDeep, 2) + treeCrown(ctx, 410, 480, 40, 89, K.tea, 2)
    + treeCrown(ctx, 180, 560, 44, 92, K.teaDeep, 2) + treeCrown(ctx, 330, 580, 54, 93, mixHex(K.tea, K.teaDeep, 0.5), 3)
    + treeCrown(ctx, 420, 560, 44, 94, K.tea, 2) + treeCrown(ctx, 250, 640, 50, 95, K.teaDeep, 3) + treeCrown(ctx, 400, 650, 50, 96, K.teaDeep, 3);
  // 動物園 station (bottom left): its hall's back wall under the roof, the bay, the booth on the deck
  const bottom = depth(ctx, 3, `<rect x="-30" y="376" width="196" height="110" fill="${ref(ctx, 'concreteG')}"/>`
    + `<rect x="-20" y="392" width="56" height="18" fill="${ref(ctx, 'window')}" opacity=".85"/><path d="M-2 392v18M18 392v18" stroke="${K.concreteDeep}" stroke-width="2"/>`
    + `<rect x="100" y="400" width="66" height="86" fill="${mixHex(K.concreteDeep, C.shadow, 0.4)}"/>`, `<rect x="-30" y="376" width="196" height="110"/>`)
    + depth(ctx, 3, `<path d="M-30 362H170L190 378H-30Z" fill="${K.cabinBand}"/><path d="M-30 362H170L190 378" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".5"/>`
      + `<rect x="-30" y="378" width="220" height="4" fill="${mixHex(K.cabinBand, C.shadow, 0.4)}"/>`, `<path d="M-30 362H170L190 382H-30Z"/>`)
    + `<rect x="40" y="366" width="76" height="11" rx="2" fill="${K.hillNear}"/>`
    + `<text data-art-text="" x="78" y="374.6" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7.6" fill="${C.chalk}">動物園站</text>`
    + softEllipse(ctx, 132, 440, 34, 30, 'lamp', 0.25, 'blur8');
  // The ticket booth on the deck (roof at y 392): a little kiosk with its lit window 「售票」
  const booth = depth(ctx, 3, `<rect x="40" y="398" width="40" height="80" fill="${K.cabin}"/><path d="M34 392H86L82 400H38Z" fill="${K.cabinBand}"/>`
    + `<rect x="46" y="410" width="28" height="22" rx="2" fill="${ref(ctx, 'window')}"/><path d="M46 426H74" stroke="${K.cabinShade}" stroke-width="1.4"/>`
    + `<path d="M34 392.8H86" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/><rect x="40" y="440" width="40" height="5" fill="${K.cabinBand}"/>`, `<path d="M34 392H86V478H34Z"/>`)
    + `<text data-art-text="" x="60" y="420" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6.4" fill="${K.cabinBand}">售票</text>`
    + softEllipse(ctx, 60, 422, 22, 14, 'lamp', 0.25);
  // The floor page: the station's concrete under the deck, the drive's steel floor plate round the crank
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(K.hillNear, C.shadow, 0.25)}"/>`
    + pavers(GUTTER_Y + 120, { x1: 170, tone: mixHex(K.concreteDeep, K.hillNear, 0.5), seed: 91 })
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${ref(ctx, 'floorShade')}" opacity=".35"/>`
    + pools(ctx, [[60, 500, 80, 20], [236, 540, 90, 26], [318, 380, 60, 14]]));
  // The drive's housing pit round the crank (its steel plate; the drive itself is the loop's art)
  const pit = `<ellipse cx="236" cy="528" rx="70" ry="22" fill="${C.shadow}" opacity=".3"/>`;
  return maokongDefs(ctx) + standingPage(ctx, sky + ridges + onward + house + hall)
    + floor + pit + canopy + struts + bottom + booth + bookCues(ctx) + block();
};

// ——— 7-5's pool of tea ———

/**
 * A floating teacup, its node (where he sits) at the origin: white porcelain shaded round, a blue-and-
 * white band, tea in it, a tall handle on the right (Mocha's perch, 22 right and 30 up).
 */
function teacup(ctx: KitCtx, wet: boolean): string {
  const cup = 'M-24 -2H24Q24 24 0 26Q-24 24 -24 -2Z';
  return depth(ctx, 4, `<path d="M20 2C40 0 40 -30 22 -28" stroke="${K.porcelainShade}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M20 2C38 0 38 -28 22 -27" stroke="${K.porcelain}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    + `<path d="${cup}" fill="${ref(ctx, 'porcelainG')}"/><path d="M-23.6 6H23.6" stroke="${K.blueWhite}" stroke-width="3"/><path d="M-22 10.6H22" stroke="${K.blueWhite}" stroke-width=".8"/>`
    + `<path d="M-14 6l3 -3l3 3l3 -3l3 3l3 -3l3 3l3 -3l3 3" stroke="${K.porcelain}" stroke-width=".8" fill="none"/>`
    + `<ellipse cx="0" cy="-2" rx="24" ry="4" fill="${K.porcelainShade}"/><ellipse cx="0" cy="-1.6" rx="21" ry="3" fill="${ref(ctx, 'brewG')}"/>`
    + `<path d="M-20 0Q-22 14 -10 22" stroke="${C.cutRim}" stroke-width="1.6" fill="none" opacity=".5"/>`
    + (wet ? `<path d="M30 -16l1 4M33 -6l1 3" stroke="${C.vellum}" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>` : ''),
  `<path d="${cup}"/>`);
}

/** The floating cups' node heights per pool state (`c7/p5.ts` FLOAT). */
const CUP_Y: Readonly<Record<string, number>> = { low: 486, mid: 464, high: 442 };

/**
 * 7-5's pool (a `lift`: `low` / `mid` / `high`), drawn where the first floating cup is (`C1`, x 142;
 * the second floats 124 to its right): the tea from its surface down to the pool's front lip (y 540),
 * amber-brown and see-through, its surface catching the lanterns and the moon, ripples round the cups,
 * steam; the two cups. Drained (`low`), the cups sit on the tiled bottom in a last wet sheen.
 */
const teaPool: PartSource = {
  preset: 'lift',
  states: ['low', 'mid', 'high'],
  box: { x: -40, y: -50, w: 230, h: 150 },
  draw(ctx, state) {
    const y0 = CUP_Y[state] ?? 486;
    const [l, r] = [POOL.x0 - 142, POOL.x1 - 142];
    const depthDown = POOL.lip - y0;
    const tea = state === 'low'
      ? `<ellipse cx="62" cy="${POOL.bottom + 22 - y0}" rx="80" ry="6" fill="${K.brew}" opacity=".3"/>`
      : `<rect x="${l}" y="8" width="${r - l}" height="${depthDown - 8}" fill="${ref(ctx, 'brewG')}" opacity=".88"/>`
        + `<rect x="${l}" y="6" width="${r - l}" height="6" fill="${K.brewLight}"/><path d="M${l} 6.6H${r}" stroke="${C.lampAmber}" stroke-width="1.2" opacity=".7"/>`
        + `<path d="M${l + 10} 18H${l + 60}M${l + 90} 24H${r - 20}M${l + 30} 32H${l + 120}" stroke="${K.brewLight}" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>`
        + `<ellipse cx="0" cy="10" rx="34" ry="3.4" fill="none" stroke="${C.lampAmber}" stroke-width="1" opacity=".55"/><ellipse cx="124" cy="10" rx="34" ry="3.4" fill="none" stroke="${C.lampAmber}" stroke-width="1" opacity=".55"/>`
        + `<path d="M${l + 20} -2q-4 -10 0 -18t0 -16M${r - 30} 0q-4 -10 0 -18t0 -16M66 -4q-4 -10 0 -18" stroke="${C.vellum}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/>`;
    return maokongDefs(ctx) + tea + teacup(ctx, state !== 'low') + `<g transform="translate(124 0)">${teacup(ctx, state !== 'low')}</g>`;
  },
};

// ——— 7-4's clouds, seat and lamp ———

/**
 * 7-4's cloud (a `flap`, 翻; bible § 6 row 7: "mist flaps hide and reveal the path"): closed, a card of
 * night mist drifting under the glass floor — three layers of lilac vellum over the dark ground, a
 * moonlit edge on each; blown aside (`open`), the card folds up and its kraft back shows, and what was
 * under it (the backdrop) shows. Local space: the card's top-left at the origin (`bakedFlap`), its
 * marigold dog-ear the grip.
 */
const cloud = (() => {
  const { w, h } = flapSize(56, 56);
  const face = (ctx: KitCtx) => {
    const layer = (y: number, amp: number, o: number, col: string) => {
      const d = `M-2 ${f1(y)}q${f1(w * 0.15)} ${f1(-amp)} ${f1(w * 0.3)} 0t${f1(w * 0.3)} 0t${f1(w * 0.3)} 0t${f1(w * 0.3)} 0V${h + 2}H-2Z`;
      return `<path d="${d}" fill="${col}" opacity="${o}"/><path d="${d.split('V')[0]}" stroke="${C.vellum}" stroke-width="1.2" fill="none" opacity="${f1(o * 0.9)}"/>`;
    };
    return maokongDefs(ctx) + `<rect width="${w}" height="${h}" fill="${mixHex(K.hillNear, C.shadow, 0.3)}"/>`
      + `<path d="M0 ${f1(h * 0.3)}h${w}" stroke="${C.lamp}" stroke-width="1" stroke-dasharray="1 7" opacity=".5"/>`
      + layer(h * 0.18, 6, 0.5, K.mistDeep) + layer(h * 0.42, 7, 0.65, mixHex(K.mist, K.mistDeep, 0.4)) + layer(h * 0.66, 6, 0.8, K.mist);
  };
  return bakedFlap(w, h, face, kraftBack(w, h, 77));
})();

/** 7-4's folding seat's card: the hit (302, 406, 56, 56). */
const SEAT_HIT: readonly [number, number, number, number] = [302, 406, 56, 56];

/**
 * 7-4's folding seat (a `flap`, 翻; D-78's pop-up flap): closed, the seat folded up against the right
 * bench's back — its tea-green cushion seen from below with its seams and the hinge's steel; tapped
 * down (`open`), the card folds up past its hinge (its kraft back shows) and the seat **pops down as
 * real paper** over the bench: a padded cushion on its steel bracket at the bench's top (y 418).
 */
const foldingSeat: PartSource = popFlap(SEAT_HIT,
  (w, h) => `<rect width="${w}" height="${h}" fill="${K.cabinBand}"/><rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="4" fill="${mixHex(K.cabinBand, K.teaLit, 0.25)}"/>`
    + `<path d="M${w / 2} 5V${h - 5}M5 ${h / 2}H${w - 5}" stroke="${mixHex(K.cabinBand, C.shadow, 0.35)}" stroke-width="1.2"/>`
    + `<rect x="0" y="0" width="${w}" height="4" fill="${K.steelDeep}"/>`,
  (ctx) => depth(ctx, 4, `<path d="M308 418H354V424H308Z" fill="${K.steelDeep}"/><rect x="304" y="408" width="54" height="11" rx="4" fill="${K.cabinBand}"/>`
    + `<path d="M310 409.6H352" stroke="${K.teaLit}" stroke-width="1.4" opacity=".6"/><path d="M331 409V418" stroke="${mixHex(K.cabinBand, C.shadow, 0.35)}" stroke-width="1"/>`, `<rect x="304" y="408" width="54" height="16"/>`),
  { x: 300, y: 404, w: 62, h: 24 });

/**
 * 7-4's reading lamp (a `light`; 哇！ from the right end of the cabin): a little brass-and-steel lamp on
 * an arm from its wall mount over the right bench; `off`, its shade dark; `on`, the bulb lit and a warm
 * cone of light down over the seat and the rack. Local origin at the hit centre (340, 318).
 */
const cabinLamp: PartSource = {
  preset: 'light',
  states: ['off', 'on'],
  box: { x: -70, y: -40, w: 120, h: 150 },
  draw(ctx, state) {
    const on = state === 'on';
    const shade = 'M-14 -2L-6 -16H6L14 -2Z';
    return maokongDefs(ctx) + (on ? `<path d="M-12 -2L-56 96H52L12 -2Z" fill="${C.lamp}" opacity=".16"${blur(ctx, 'blur8')}/>` + softEllipse(ctx, 0, 0, 30, 22, 'lamp', 0.5, 'blur8') : '')
      + depth(ctx, 3, `<path d="M34 0H8Q2 -10 0 -16" stroke="${K.steelDeep}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="34" cy="0" r="4" fill="${K.steelDeep}"/>`
        + `<path d="${shade}" fill="${on ? K.gondolaAmber : K.steel}"/><path d="M-6 -16H6" stroke="${C.goldDeep}" stroke-width="1.6"/>`
        + `<path d="M-10 -5L-4 -14" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<path d="${shade}"/>`)
      + (on ? `<ellipse cx="0" cy="-1" rx="7" ry="3" fill="${C.lampHot}"/>` : `<ellipse cx="0" cy="-1" rx="7" ry="2.4" fill="${K.steelDeep}"/>`);
  },
};

// ——— 7-3 「茶園階梯」 ———

/**
 * 7-3: 貓空's tea terraces at night. The terraces themselves are the ledges (`teaTerrace`: clipped
 * tea over dry-stone walls, a 22-unit step up to each); behind them the hillside climbs in rows of
 * tea to a tea house on the ridge with its lanterns, and to the left the valley opens over Taipei's
 * lights with 101 far away. In front: the bottom path's bench (Mocha's `bench`, its backrest's top at
 * (52, 424)), the farmer's tall bamboo stool on the first terrace (Mocha's `stool`, its seat at
 * (196, 420)), the tea shed by the top terrace (its roof Mocha's `shed` at (344, 340); the 土地公 on
 * its eave at (286, 360)) with a lit window; the farmer's picking basket. The gondola's cabins cross
 * the far ridge; mist lies in the valley.
 */
const teaTerraces: BackdropDraw = (ctx) => {
  const sky = maokongSky(ctx, 220, { moon: [86, 70, 27], seed: 101 });
  // The valley opening over Taipei (left), between the far ridges
  const valley = cityValley(ctx, -20, 160, 212, 102, 118);
  const farD = `M-30 ${GUTTER_Y + 4}V218Q60 212 150 200Q220 170 300 178Q360 168 420 176V${GUTTER_Y + 4}Z`;
  const far = depth(ctx, 1, `<path d="${farD}" fill="${K.hillFar}"/>`, `<path d="${farD}"/>`)
    + mistBand(ctx, -30, PAGE_W + 30, 204, 40, 104, 0.5);
  // The gondola crossing the far ridge with its lit cabins
  const a: Pt = [210, 176], b: Pt = [330, 146];
  const gondola = pylon(ctx, 210, 214, 40, 0.55) + pylon(ctx, 330, 196, 52, 0.55) + cableSpan([-20, 206], a, 4, 0.9) + cableSpan(a, b, 4, 0.9) + cableSpan(b, [420, 138], 2, 0.9)
    + farCabin(ctx, ...onCable(a, b, 4, 0.45), 0.5) + farCabin(ctx, ...onCable([-20, 206], a, 4, 0.7), 0.5);
  // The near hill climbing behind the terraces in rows of tea, the tea house on its ridge
  const hillD = 'M-30 364V262Q40 236 120 240Q200 232 260 210Q320 196 420 204V364Z';
  const hill = depth(ctx, 2, `<path d="${hillD}" fill="${mixHex(K.tea, K.hillNear, 0.55)}"/>`, `<path d="${hillD}"/>`)
    + teaRows(-20, 420, 250, 352, 9, 10, 105)
    + teaHouse(ctx, 300, 214, 0.62, '茶')
    + mistBand(ctx, -30, PAGE_W + 30, 300, 64, 106, 0.28);
  // The floor page: the higher terraces receding up the hill behind the play terraces, soil below
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(K.soilDeep, K.hillNear, 0.5)}"/>`
    + teaRows(-30, 430, 372, 420, 4, 0, 107)
    + lowerTerraces(FLOOR_RECT.x, FLOOR_RECT.x + FLOOR_RECT.w, 500, 109)
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="24" fill="${C.shadow}" opacity=".24"/>`
    + pools(ctx, [[344, 430, 70, 18], [60, 500, 80, 20, 'moon']]));
  // The tea shed by the top terrace (roof from the eave at (276, 362) up to the ridge, Mocha at (344, 340))
  const shedRoof = 'M272 364L344 336L404 358V366L344 344L276 370Z';
  const shed = depth(ctx, 3, `<rect x="290" y="352" width="104" height="70" fill="${ref(ctx, 'woodG')}"/>`
    + `<path d="${Array.from({ length: 8 }, (_, i) => `M${296 + i * 13} 356V422`).join('')}" stroke="${K.woodDeep}" stroke-width="1.2" opacity=".7"/>`
    + `<rect x="312" y="370" width="26" height="20" fill="${ref(ctx, 'window')}"/><path d="M325 370v20M312 380h26" stroke="${K.woodDeep}" stroke-width="1.4"/>`
    + `<path d="${shedRoof}" fill="${mixHex(K.stoneDeep, K.hillNear, 0.3)}"/><path d="M272 364L344 336L404 358" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".45"/>`
    + `<path d="M276 370L344 344L404 366" stroke="${K.stoneLight}" stroke-width="1" fill="none" opacity=".4"/>`, `<path d="${shedRoof}"/><rect x="290" y="352" width="104" height="70"/>`)
    + softEllipse(ctx, 325, 382, 26, 18, 'lamp', 0.32, 'blur8')
    // Its lantern by the door
    + softEllipse(ctx, 372, 380, 8, 8, 'lamp', 0.4) + `<ellipse cx="372" cy="380" rx="4" ry="5.4" fill="${C.hatRed}"/><path d="M372 374.6v-5" stroke="${C.printDark}" stroke-width=".8"/>`;
  // The bench on the bottom path (backrest's top at (52, 424)), the farmer's stool (seat at (196, 420))
  const bench = depth(ctx, 3, `<rect x="24" y="424" width="58" height="6" rx="2" fill="${K.wood}"/><rect x="20" y="448" width="66" height="7" rx="2" fill="${K.woodLight}"/>`
    + `<path d="M28 430V476M78 430V476M26 455V478M80 455V478" stroke="${K.woodDeep}" stroke-width="3.4"/><path d="M24 424.8H82" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="20" y="424" width="66" height="54"/>`);
  const stool = depth(ctx, 3, `<rect x="184" y="420" width="24" height="5" rx="2" fill="${K.bamboo}"/><path d="M188 425L184 462M204 425L208 462M196 425V462" stroke="${K.bambooDeep}" stroke-width="2.4"/>`
    + `<path d="M186 444H206" stroke="${K.bambooDeep}" stroke-width="1.6"/><path d="M184 420.8H208" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`, `<rect x="184" y="420" width="24" height="42"/>`);
  // The farmer's picking basket beside the stool, tea leaves heaped in it
  const basket = depth(ctx, 3, `<path d="M214 444H238L234 462H218Z" fill="${K.bamboo}"/><path d="M215 449H237M216 455H236" stroke="${K.bambooDeep}" stroke-width="1"/>`
    + `<path d="M214 444q6 -6 12 -2q6 -4 12 2z" fill="${K.teaLit}"/>`, `<path d="M214 440H238L234 462H218Z"/>`);
  // Foreground: a lower row of tea along the page's front edge, a stone lantern lit at the path's end
  const front = depth(ctx, 4, `<path d="M150 600h20v-8h-4v-14h4v-6h-20v6h4v14h-4z" fill="${ref(ctx, 'stoneG')}"/>`, `<rect x="150" y="572" width="20" height="28"/>`)
    + softEllipse(ctx, 160, 585, 10, 7, 'lamp', 0.45) + `<rect x="155" y="580" width="10" height="9" fill="${C.lamp}"/>`;
  return maokongDefs(ctx) + standingPage(ctx, sky + far + valley + gondola + hill)
    + floor + shed + bench + stool + basket + front + bookCues(ctx) + block();
};

// ——— 7-4 「水晶車廂」 ———

/**
 * The night as it looks far below the 水晶車廂's glass floor (the floor page under the cabin, and the
 * view out of its windows): dark hills, scattered lights, and the three places under the clouds — the
 * zoo's floodlit path (x ≈ 118), the tea farm's little shrine (x ≈ 194, where the 土地公 sits) and a
 * tea house's terrace with its 黑糖珍奶 sign (x ≈ 286). `lit` false: the clouds' places only (no beam).
 */
function farBelow(ctx: KitCtx, ground: number, top: number): string {
  const r = seeded(141);
  let lights = '';
  for (let i = 0; i < 60; i++) lights += `M${f1(-20 + r() * 430)} ${f1(ground + 10 + r() * (FLOOR_BOTTOM - ground - 10))}h1.4`;
  const land = `<rect x="-40" y="${ground}" width="${PAGE_W + 80}" height="${FLOOR_BOTTOM - ground + 20}" fill="${mixHex(K.hillNear, C.shadow, 0.35)}"/>`
    + teaRows(-40, 430, ground + 20, top - 6, 6, 4, 146).replace(/fill="[^"]*"/, `fill="${mixHex(K.tea, K.hillNear, 0.6)}"`)
    + teaRows(-40, 430, top + 70, FLOOR_BOTTOM, 8, 6, 142).replace(/fill="[^"]*"/, `fill="${mixHex(K.tea, K.hillNear, 0.5)}"`)
    + `<path d="${lights}" stroke="${C.lamp}" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`;
  // The zoo's path (under the left cloud): a curving lit walk with its floodlight
  const zoo = `<path d="M70 ${top + 70}Q110 ${top + 50} 130 ${top + 30}Q140 ${top + 18} 160 ${top + 10}" stroke="${mixHex(K.path, C.lamp, 0.3)}" stroke-width="8" fill="none" stroke-linecap="round"/>`
    + softEllipse(ctx, 118, top + 42, 22, 14, 'lamp', 0.55, 'blur8') + `<circle cx="118" cy="${top + 42}" r="3" fill="${C.lampHot}"/>`
    + treeCrown(ctx, 92, top + 30, 14, 143, K.teaDeep, 1) + treeCrown(ctx, 146, top + 56, 14, 144, K.teaDeep, 1);
  // The shrine (under the middle cloud): a tiny red-roofed 土地公廟 with its lamp, in the tea
  const shrine = depth(ctx, 2, `<rect x="186" y="${top + 34}" width="16" height="12" fill="${K.cabin}"/><path d="M182 ${top + 35}L194 ${top + 26}L206 ${top + 35}Z" fill="${C.hatRed}"/>`
    + `<rect x="191" y="${top + 38}" width="6" height="8" fill="${ref(ctx, 'window')}"/>`, `<rect x="182" y="${top + 26}" width="24" height="20"/>`)
    + softEllipse(ctx, 194, top + 42, 14, 10, 'lamp', 0.35);
  // The tea house's terrace (under the right cloud), its lit sign of 黑糖珍奶
  const tea = teaHouse(ctx, 286, top + 46, 0.5, '')
    + `<rect x="268" y="${top + 4}" width="36" height="10" rx="2" fill="${K.brownSugar}"/><text data-art-text="" x="286" y="${top + 11.6}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6.4" fill="${C.lampAmber}">黑糖珍奶</text>`;
  return land + zoo + shrine + tea + mistBand(ctx, -40, 430, top + 60, 40, 145, 0.25);
}

/** The 水晶車廂's shell outline: a rounded box from (−14, 150) to (404, 494). */
const CABIN = { x0: -14, x1: 404, top: 150, floor: 494 };

/** Mocha's travel basket on 7-4's left bench (its rim at (30, 390)): wicker, its lid propped open, a red lining. */
function cabinBasket(ctx: KitCtx): string {
  return depth(ctx, 4, `<path d="M8 390H52L48 418H12Z" fill="${K.bamboo}"/><path d="M9 397H51M10 404H50M11 411H49" stroke="${K.bambooDeep}" stroke-width="1.2"/>`
    + `<path d="${Array.from({ length: 6 }, (_, i) => `M${14 + i * 7} 390v28`).join('')}" stroke="${K.bambooDeep}" stroke-width=".8" opacity=".6"/>`
    + `<path d="M6 390H54" stroke="${K.bambooDeep}" stroke-width="3" stroke-linecap="round"/><path d="M8 389L2 364L44 360L52 389" fill="${mixHex(K.bamboo, K.bambooDeep, 0.4)}" opacity=".9"/>`
    + `<path d="M16 390q14 -14 28 0" stroke="${C.hatRed}" stroke-width="1.6" fill="none"/>`, `<path d="M2 360L52 389V418H12Z"/>`);
}

/**
 * 7-4: inside the 水晶車廂, cut away (its front wall gone, bible § 6 row 7 and the 月亮線 cars' box
 * fold). The cabin hangs from its grip on the cable over the night (its hanger up through the top
 * of the page); its back wall is one long window on the hills, the moon and another cabin passing;
 * a strip of signs over it (「水晶車廂」, the route 動物園 → 貓空). Left, the bench (y 418) with Mocha's
 * travel basket on it (its rim at (30, 390)); right, the folding seat's bench (y 418, the seat is a
 * part), the luggage rack over it (y 396), the reading lamp's mount (the lamp is a part at (340,
 * 318)). The glass floor (y 440) is a ledge; under it, far below, the night (`farBelow`) where the
 * three clouds drift (parts).
 */
const crystalCabin: BackdropDraw = (ctx) => {
  const sky = maokongSky(ctx, 250, { moon: [300, 60, 27], seed: 151 });
  const { x0, x1, top, floor } = CABIN;
  // The cable over the cabin and its hanger, the grip
  const hanger = cableSpan([-30, 52], [420, 30], 3, 2.4)
    + depth(ctx, 2, `<path d="M190 42V${top}M200 42V${top}" stroke="${K.steelDeep}" stroke-width="5"/><rect x="180" y="34" width="30" height="16" rx="4" fill="${K.steel}"/>`
      + `<circle cx="188" cy="40" r="4" fill="${K.steelDeep}"/><circle cx="202" cy="40" r="4" fill="${K.steelDeep}"/>`, `<rect x="180" y="34" width="30" height="${top - 34}"/>`);
  // The window's view: hills, mist, the far gondola line and a cabin passing (clipped to the window)
  const win = ctx.id('cabinWin');
  const winD = `M14 ${top + 50}H376Q386 ${top + 50} 386 ${top + 60}V372H4V${top + 60}Q4 ${top + 50} 14 ${top + 50}Z`;
  const view = `<clipPath id="${win}"><path d="${winD}"/></clipPath><g clip-path="url(#${win})">`
    + `<rect x="0" y="${top}" width="${PAGE_W}" height="${GUTTER_Y - top}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, 0, top + 40, PAGE_W, 60, 14, 152)
    + hills(ctx, GUTTER_Y + 4, 153, { far: 270, mid: 300, near: 330 })
    + cityValley(ctx, 230, 380, 292, 154, 330)
    + cableSpan([0, 250], [400, 196], 4, 1) + farCabin(ctx, ...onCable([0, 250], [400, 196], 4, 0.3), 0.9)
    + `<path d="M40 372L120 ${top + 50}H160L80 372Z" fill="${C.glassine}" opacity=".07"/><path d="M220 372L290 ${top + 50}H310L240 372Z" fill="${C.glassine}" opacity=".06"/></g>`;
  // The shell: the cabin's white walls round the window (back wall), the roof's band, the sign strip
  const shell = `M${x0} ${floor}V${top + 30}Q${x0} ${top} ${x0 + 30} ${top}H${x1 - 30}Q${x1} ${top} ${x1} ${top + 30}V${floor}Z`;
  const walls = depth(ctx, 2, `<path d="${shell}" fill="${mixHex(K.cabin, K.hillNear, 0.35)}"/>`, `<path d="${shell}"/>`)
    + view + `<path d="${winD}" fill="none" stroke="${K.steelDeep}" stroke-width="4"/>`
    + `<path d="${Array.from({ length: 5 }, (_, i) => `M${80 + i * 76} ${top + 50}V372`).join('')}" stroke="${K.steelDeep}" stroke-width="3"/>`
    + `<rect x="${x0}" y="${top + 6}" width="${x1 - x0}" height="8" fill="${K.cabinBand}"/>`
    + `<rect x="60" y="${top + 20}" width="270" height="24" rx="3" fill="${K.hillNear}"/>`
    + `<text data-art-text="" x="118" y="${top + 37}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="12" fill="${C.chalk}" letter-spacing="2">水晶車廂</text>`
    + `<path d="M178 ${top + 32}H316" stroke="${K.cabinBand}" stroke-width="3" stroke-linecap="round"/>`
    + [178, 224, 270, 316].map((x, i) => `<circle cx="${x}" cy="${top + 32}" r="${i === 0 ? 4 : 3}" fill="${i === 0 ? K.gondolaAmber : C.chalk}" stroke="${K.cabinBand}" stroke-width="1.4"/>`).join('')
    + `<text data-art-text="" x="178" y="${top + 25.6}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="5" fill="${K.gondolaAmber}">動物園</text>`
    + `<text data-art-text="" x="316" y="${top + 25.6}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="5" fill="${C.chalk}">貓空</text>`
    // The ceiling's strip light (dim: the reading lamp is off), the wall under the window
    + `<rect x="${x0}" y="372" width="${x1 - x0}" height="${GUTTER_Y + 30 - 372}" fill="${mixHex(K.cabinShade, K.hillNear, 0.45)}"/>`
    + `<path d="M${x0} 372H${x1}" stroke="${K.steelDeep}" stroke-width="3"/>`;
  // The reading lamp's mount on the wall over the right bench (the lamp is the part)
  const mount = `<path d="M366 300H382V336H366Z" fill="${K.steelDeep}"/>`;
  // The floor page: far below the glass, the night
  // The glass floor's panels between the back wall and the front edge (y 360–494), receding to the VP
  const [vx, vy] = VANISHING_POINT;
  let panels = '';
  for (let x = -40; x <= PAGE_W + 40; x += 64) panels += `M${f1(x)} ${floor}L${f1(x + (vx - x) * ((GUTTER_Y - floor) / (vy - floor)))} ${GUTTER_Y}`;
  panels += `M-40 ${GUTTER_Y + 44}H430M-40 ${GUTTER_Y + 96}H430`;
  const below = floorPage(ctx, farBelow(ctx, GUTTER_Y, 496)
    // The zoo's floodlight shining up through the gap toward the glass
    + `<path d="M108 538L94 494H142L128 538Z" fill="${C.lamp}" opacity=".1"/>`
    // The glass itself: a glassine tint, two sheen streaks, the panels' steel frames
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${floor - GUTTER_Y}" fill="${A.glass}" opacity=".22"/>`
    + `<path d="M40 ${floor}L90 ${GUTTER_Y}H120L70 ${floor}ZM250 ${floor}L290 ${GUTTER_Y}H304L264 ${floor}Z" fill="${C.glassine}" opacity=".08"/>`
    + `<path d="${panels}" stroke="${K.steel}" stroke-width="2" opacity=".55"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="16" fill="${C.shadow}" opacity=".3"/>`);
  return maokongDefs(ctx) + standingPage(ctx, sky + hanger + walls + mount) + below
    // The cabin's shell continues on the floor page down to the glass floor's frame
    + `<path d="M${x0} ${GUTTER_Y}V${floor}H${x0 + 10}V${GUTTER_Y}ZM${x1 - 10} ${GUTTER_Y}V${floor}H${x1}V${GUTTER_Y}Z" fill="${K.steelDeep}"/>`
    + cabinBasket(ctx) + bookCues(ctx) + block();
};

/**
 * 7-4's glass floor as a mirror (a cut-out shown while the reading lamp is on): the lamp's warm light
 * on the glass and the cabin's reflection — the ground far below is gone.
 */
const glassMirror: CutoutSource = {
  chapter: 7,
  box: { x: -40, y: GUTTER_Y, w: 470, h: FLOOR_BOTTOM - GUTTER_Y + 10 },
  draw(ctx) {
    const [vx, vy] = VANISHING_POINT;
    let panels = '';
    for (let x = -40; x <= PAGE_W + 40; x += 64) panels += `M${f1(x)} ${CABIN.floor}L${f1(x + (vx - x) * ((GUTTER_Y - CABIN.floor) / (vy - CABIN.floor)))} ${GUTTER_Y}`;
    // The cabin's interior reflected in the glass: the window band upside down with its mullions, the
    // lit lamp's warm pool under the lamp; outside the cabin the night goes dark (a lit room can't see out)
    const band = (y0: number, y1: number) => `<rect x="-14" y="${y0}" width="418" height="${y1 - y0}" fill="${mixHex(K.hill, K.mist, 0.25)}" opacity=".55"/>`
      + `<path d="${Array.from({ length: 5 }, (_, i) => `M${80 + i * 76} ${y0}V${y1}`).join('')}" stroke="${K.steelDeep}" stroke-width="3" opacity=".7"/>`;
    return maokongDefs(ctx) + `<rect x="-40" y="${GUTTER_Y}" width="470" height="${FLOOR_BOTTOM - GUTTER_Y + 10}" fill="${mixHex(K.hillNear, C.shadow, 0.45)}"/>`
      + `<rect x="-40" y="${CABIN.floor}" width="470" height="${FLOOR_BOTTOM - CABIN.floor + 10}" fill="${ref(ctx, 'mistFade')}" opacity=".18"/>`
      + `<rect x="-14" y="${GUTTER_Y}" width="418" height="${CABIN.floor - GUTTER_Y}" fill="${mixHex(K.hillNear, K.cabinShade, 0.25)}"/>`
      + band(GUTTER_Y + 30, GUTTER_Y + 92)
      + softEllipse(ctx, 340, 420, 70, 26, 'lamp', 0.55, 'blur18') + softEllipse(ctx, 340, 420, 26, 10, 'lamp', 0.6, 'blur8')
      + `<path d="${panels}" stroke="${K.steelLight}" stroke-width="1.4" opacity=".45"/>`
      + `<path d="M40 ${CABIN.floor}L120 ${GUTTER_Y}H150L70 ${CABIN.floor}ZM230 ${CABIN.floor}L290 ${GUTTER_Y}H304L244 ${CABIN.floor}Z" fill="${C.glassine}" opacity=".16"/>`
      + `<path d="M-14 ${CABIN.floor}H404" stroke="${K.steelLight}" stroke-width="1.4" opacity=".6"/>`
      + cabinBasket(ctx);
  },
};

// ——— 7-5 「大茶壺」 ———

/** 7-5's pool: its back wall's rim (y 420) down to its tiled bottom (y 500 at the back, 540 at the front lip). */
const POOL = { x0: 112, x1: 296, rim: 420, bottom: 500, lip: 540 };

/**
 * 7-5: the tea house's terrace at night, a giant purple-clay teapot (紫砂壺) hung in its marigold
 * cradle (the wheel, at (204, 300)) on a timber gantry over a stone pool of tea. Behind: the tea
 * house's veranda, its lattice lit warm, a string of red lanterns; the hills, the mist, the big moon.
 * Left bank: the tea table with its tray (Mocha's `tray`, its top at (56, 384)) and a little tea set.
 * Right terrace: the cabinet of tea tins (Mocha's `tins`, its top at (352, 352)). The pool's back wall
 * and its tiled bottom (the 土地公 painted on it at (236, 520)); the tea and the floating cups are the
 * `c7/tea-pool` part, the big 茶海 cup on the bottom is its ledge (`chahai`), the teapot itself the
 * `c7/teapot-*` cut-outs (one per tilt).
 */
const giantTeapot: BackdropDraw = (ctx) => {
  const sky = maokongSky(ctx, 220, { moon: [64, 66, 27], seed: 161 });
  const ridges = hills(ctx, GUTTER_Y + 4, 162, { far: 170, mid: 200, near: 236 });
  // The tea house's veranda across the back: posts, the lit lattice, the eaves and a string of lanterns
  let lattice = '';
  for (let x = -16; x < 410; x += 12) lattice += `M${x} 262V346`;
  for (let y = 270; y < 346; y += 14) lattice += `M-20 ${y}H410`;
  const veranda = depth(ctx, 2, `<rect x="-20" y="254" width="430" height="106" fill="${mixHex(K.woodDeep, C.shadow, 0.3)}"/>`
    + `<rect x="-14" y="262" width="418" height="84" fill="${ref(ctx, 'window')}" opacity=".75"/><path d="${lattice}" stroke="${K.woodDeep}" stroke-width="1.6"/>`
    + `<path d="${Array.from({ length: 6 }, (_, i) => `M${-6 + i * 80} 250V360`).join('')}" stroke="${K.woodDeep}" stroke-width="7"/>`
    + `<path d="M-30 254L-10 230H400L420 254Z" fill="${mixHex(K.stoneDeep, C.shadow, 0.3)}"/><path d="M-30 254L-10 230H400L420 254" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".35"/>`, `<rect x="-30" y="230" width="460" height="130"/>`)
    + softEllipse(ctx, 195, 310, 210, 40, 'lamp', 0.16, 'blur18');
  const lanterns = `<path d="M-20 236Q100 262 200 248Q300 236 410 258" stroke="${C.printDark}" stroke-width="1" fill="none"/>`
    + [[30, 246], [92, 254], [154, 252], [246, 245], [308, 247], [370, 254]].map(([x, y]) => softEllipse(ctx, x, y + 8, 9, 9, 'lamp', 0.35)
      + `<ellipse cx="${x}" cy="${y + 8}" rx="6" ry="7.6" fill="${C.hatRed}"/><path d="M${x - 5} ${y + 5}h10M${x - 5} ${y + 11}h10" stroke="${mixHex(C.hatRed, C.shadow, 0.4)}" stroke-width=".8"/><path d="M${x} ${y + 15.6}v4" stroke="${C.ochre}" stroke-width="1.4"/>`).join('');
  // The gantry: two timber posts up from the pool's corners to the cradle's pins, a crossbeam over it
  const gantry = depth(ctx, 3, `<path d="M130 430L150 300M278 430L258 300" stroke="${K.woodDeep}" stroke-width="9" stroke-linecap="round"/>`
    + `<path d="M130 430L150 300M278 430L258 300" stroke="${K.woodLight}" stroke-width="2" opacity=".5" transform="translate(-2 0)"/>`
    + `<path d="M120 236H288" stroke="${K.woodDeep}" stroke-width="10"/><path d="M150 236V300M258 236V300" stroke="${K.woodDeep}" stroke-width="6"/>`
    + `<path d="M120 232H288" stroke="${K.woodLight}" stroke-width="2" opacity=".6"/>`, `<rect x="116" y="228" width="176" height="204"/>`);
  // The pool: its stone back wall from the rim down to the bottom, the tiled bottom out to the front lip
  const { x0, x1, rim, bottom, lip } = POOL;
  let tiles = '';
  for (let y = bottom + 8; y < lip; y += 9) tiles += `M${x0} ${y}H${x1}`;
  for (let x = x0 + 12; x < x1; x += 16) tiles += `M${x} ${bottom}L${f1(x + (x - 204) * 0.06)} ${lip}`;
  const pool = `<rect x="${x0}" y="${rim}" width="${x1 - x0}" height="${bottom - rim}" fill="${ref(ctx, 'stoneG')}"/>`
    + `<path d="${stoneCourses(x0, x1, rim + 8, bottom, 163)}" stroke="${K.stoneDeep}" stroke-width=".9" opacity=".7"/>`
    + `<rect x="${x0}" y="${bottom}" width="${x1 - x0}" height="${lip - bottom}" fill="${mixHex(K.celadon, K.hillNear, 0.45)}"/><path d="${tiles}" stroke="${mixHex(K.celadon, C.shadow, 0.55)}" stroke-width=".8" opacity=".7"/>`
    + `<rect x="${x0}" y="${rim - 4}" width="${x1 - x0}" height="6" fill="${K.stoneLight}"/>`
    // The front lip of the pool (stone)
    + `<rect x="${x0 - 2}" y="${lip}" width="${x1 - x0 + 4}" height="10" fill="${K.stone}"/><path d="M${x0 - 2} ${lip + 0.6}H${x1 + 2}" stroke="${C.cutRim}" stroke-width="1" opacity=".4"/>`;
  // The tea table on the left bank (Mocha's tray on it, top at (56, 384)) with a little tea set
  const table = depth(ctx, 3, `<rect x="16" y="386" width="80" height="7" rx="2" fill="${K.woodLight}"/><path d="M24 393V432M88 393V432" stroke="${K.woodDeep}" stroke-width="4"/>`
    + `<rect x="30" y="380" width="52" height="6" rx="1.5" fill="${K.wood}"/><path d="M30 380.8H82" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`, `<rect x="16" y="380" width="80" height="52"/>`)
    + `<path d="M84 386q0 -8 6 -8q6 0 6 8z" fill="${K.clay}"/><path d="M96 382l4 -3" stroke="${K.clay}" stroke-width="1.6"/>`;
  // The cabinet of tea tins on the right terrace (top at (352, 352))
  const tins = [[322, 'hatRed'], [342, 'cabinBand'], [362, 'steel'], [382, 'hatRed']] as const;
  const cabinet = depth(ctx, 3, `<rect x="312" y="352" width="84" height="70" fill="${ref(ctx, 'woodG')}"/><path d="M312 386H396" stroke="${K.woodDeep}" stroke-width="2"/>`
    + `<path d="M312 352.8H396" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`
    + tins.map(([x, col], i) => `<rect x="${x - 7}" y="${360 + (i % 2) * 2}" width="14" height="${22 - (i % 2) * 2}" rx="2" fill="${col === 'hatRed' ? C.hatRed : col === 'steel' ? K.steelLight : K.cabinBand}"/><rect x="${x - 7}" y="${364 + (i % 2) * 2}" width="14" height="5" fill="${C.washi}" opacity=".8"/>`).join('')
    + `<rect x="318" y="392" width="72" height="22" rx="2" fill="${K.woodDeep}"/>`, `<rect x="312" y="352" width="84" height="70"/>`)
    + `<text data-art-text="" x="354" y="408" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="11" fill="${C.lampAmber}">茶</text>`;
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(K.woodDeep, K.hillNear, 0.5)}"/>`
    + (() => {
      const [vx, vy] = VANISHING_POINT;
      let boards = '';
      for (let bx = -200; bx <= PAGE_W + 200; bx += 22) boards += `M${f1(bx)} ${FLOOR_BOTTOM}L${f1(bx + (vx - bx) * ((GUTTER_Y - FLOOR_BOTTOM) / (vy - FLOOR_BOTTOM)))} ${GUTTER_Y}`;
      return `<path d="${boards}" stroke="${K.woodDeep}" stroke-width="1.2" opacity=".7"/>`;
    })()
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${ref(ctx, 'floorShade')}" opacity=".35"/>`
    + pools(ctx, [[204, 580, 150, 40], [60, 470, 70, 18], [350, 450, 70, 18]]));
  // The deck's front: potted tea shrubs in clay pots and a floor lantern at either corner
  const potted = (x: number, y: number, s: number) => depth(ctx, 4, `<path d="M${x - 14 * s} ${y - 20 * s}H${x + 14 * s}L${x + 10 * s} ${y}H${x - 10 * s}Z" fill="${K.clay}"/><path d="M${x - 14 * s} ${y - 20 * s}H${x + 14 * s}" stroke="${K.clayLight}" stroke-width="${f1(2 * s)}"/>`, `<rect x="${x - 14 * s}" y="${y - 20 * s}" width="${28 * s}" height="${20 * s}"/>`)
    + treeCrown(ctx, x, y - 34 * s, 18 * s, Math.round(x), K.tea, 4);
  const floorLantern = (x: number) => depth(ctx, 4, `<rect x="${x - 7}" y="600" width="14" height="20" rx="2" fill="${K.woodDeep}"/><rect x="${x - 5}" y="603" width="10" height="13" fill="${C.lamp}"/>`, `<rect x="${x - 7}" y="600" width="14" height="20"/>`)
    + softEllipse(ctx, x, 610, 16, 12, 'lamp', 0.4);
  const front = potted(36, 640, 1.2) + potted(360, 646, 1.3) + floorLantern(84) + floorLantern(318);
  return maokongDefs(ctx) + standingPage(ctx, sky + ridges + veranda + lanterns) + floor + gantry + pool + table + cabinet + front + bookCues(ctx) + block();
};

/** The teapot's tilt per wheel state (degrees, clockwise): upright, tilted, pouring. */
const TEAPOT_TILT: Readonly<Record<string, number>> = { 0: 0, 1: 22, 2: 46 };

/**
 * 7-5's giant teapot (a cut-out per tilt, shown with its wheel's state: `c7/teapot-0` … `-2`): a round
 * purple-clay 紫砂壺 pinned at its middle (the wheel's centre, (204, 300)) — its lid and knob, the spout
 * to the right, the loop handle to the left, a soft sheen — tilted 0°, 22° or 46°; tilted, a thin
 * trickle of tea, pouring, a full stream down into the pool.
 */
function teapotCutout(state: string): CutoutSource {
  return {
    chapter: 7,
    box: { x: 120, y: 236, w: 190, h: 270 },
    draw(ctx) {
      const tilt = TEAPOT_TILT[state] ?? 0;
      const body = 'M-30 2Q-32 -24 0 -26Q32 -24 30 2Q28 24 0 26Q-28 24 -30 2Z';
      const pot = depth(ctx, 3, `<path d="M-28 -6Q-52 -10 -48 10Q-44 26 -24 16" stroke="${K.clayDeep}" stroke-width="6" fill="none" stroke-linecap="round"/>`
        + `<path d="M26 4Q40 2 46 -12L54 -20L56 -15Q48 -2 44 8Q36 18 24 14Z" fill="${K.clay}"/>`
        + `<path d="${body}" fill="${ref(ctx, 'clayG')}"/>`
        + `<ellipse cx="0" cy="-24" rx="15" ry="4" fill="${K.clayDeep}"/><path d="M-12 -25Q0 -34 12 -25Z" fill="${K.clay}"/><circle cx="0" cy="-33" r="4" fill="${K.clayLight}"/>`
        + `<path d="M-20 -12Q-12 -20 0 -20" stroke="${C.cutRim}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".35"/>`
        + `<path d="M-28 6Q0 14 28 6" stroke="${K.clayDeep}" stroke-width="1.2" fill="none" opacity=".6"/>`, `<path d="${body}"/>`);
      // The spout's tip after the tilt (unit point (55, −18) turned by `tilt` about the pin)
      const a = (tilt * Math.PI) / 180;
      const [tx, ty] = [204 + 55 * Math.cos(a) + 18 * Math.sin(a), 300 + 55 * Math.sin(a) - 18 * Math.cos(a)];
      const stream = tilt === 0 ? ''
        : tilt < 30 ? `<path d="M${f1(tx)} ${f1(ty)}Q${f1(tx + 6)} ${f1(ty + 30)} ${f1(tx + 4)} ${POOL.bottom - 30}" stroke="${K.brewLight}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85"/>`
          : `<path d="M${f1(tx)} ${f1(ty)}Q${f1(tx + 10)} ${f1(ty + 20)} ${f1(tx + 8)} ${POOL.rim + 30}" stroke="${K.brew}" stroke-width="7" fill="none" stroke-linecap="round"/>`
            + `<path d="M${f1(tx - 1)} ${f1(ty + 4)}Q${f1(tx + 8)} ${f1(ty + 22)} ${f1(tx + 6)} ${POOL.rim + 26}" stroke="${K.brewLight}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>`
            + `<path d="M${f1(tx - 2)} ${POOL.rim + 32}q10 -8 20 0" stroke="${C.vellum}" stroke-width="1.4" fill="none" opacity=".6"/>`;
      return maokongDefs(ctx) + softEllipse(ctx, 204, 300, 50, 46, 'lamp', 0.12, 'blur18') + stream + `<g transform="translate(204 300) rotate(${tilt})">${pot}</g>`;
    },
  };
}

/**
 * 7-5's teapot cradle (a `wheel`, 轉): the marigold knurled ring the teapot hangs in — its grip rim,
 * three printed stops (one per tilt) — open in the middle so the pot (its cut-out) shows through,
 * pinned by the wheel's brad. One drawing (state `0`); the view turns it a step per state.
 */
const teapotCradle: PartSource = {
  preset: 'wheel',
  states: ['0'],
  pivot: [0, 0],
  box: { x: -52, y: -52, w: 104, h: 104 },
  draw(ctx) {
    const r = 44;
    const rim = wheelRim(r, 26);
    const hole = (rr: number) => `M${-rr} 0a${rr} ${rr} 0 1 0 ${2 * rr} 0a${rr} ${rr} 0 1 0 ${-2 * rr} 0Z`;
    const ticks = [0, 120, 240].map((a) => `<path d="M0 ${-r + 2}V${-r + 9}" transform="rotate(${a})"/>`).join('');
    return depth(ctx, 3, `<path data-grip="rim" d="${rim}${hole(r - 9)}" fill-rule="evenodd" fill="${ref(ctx, 'tabR')}"/>`
      + `<circle r="${r - 9}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1.6"/><circle r="${r - 3}" fill="none" stroke="${C.marigoldShine}" stroke-width="1" opacity=".6"/>`
      + `<g stroke="${C.marigoldEdge}" stroke-width="2.4" stroke-linecap="round">${ticks}</g>`
      + `<path d="M0 0L${-r + 9} 0M0 0L${r - 9} 0" stroke="${C.marigoldEdge}" stroke-width="1.4" opacity=".55"/>`, `<path d="${rim}"/>`);
  },
};

// ——— 7-6 「菜園的芹菜」 (spread) ———

/** Rows of greens on the floor page (a vegetable bed seen from the front): leafy cabbage heads in soil furrows. */
function vegRows(x0: number, x1: number, y0: number, y1: number, seed: number): string {
  const r = seeded(seed);
  let soil = '';
  let outer = '';
  let inner = '';
  let veins = '';
  for (let y = y0, h = 11, i = 0; y < y1; y += h, h *= 1.1, i++) {
    soil += `M${x0} ${f1(y + h * 0.6)}H${x1}V${f1(y + h)}H${x0}Z`;
    for (let x = x0 + r() * 10 + (i % 2) * h * 0.7; x < x1; x += h * (1.5 + r() * 0.6)) {
      const rr = h * (0.4 + r() * 0.14);
      const cy = y + h * 0.55;
      outer += `M${f1(x - rr * 1.2)} ${f1(cy)}q${f1(rr * 0.2)} ${f1(-rr * 1.1)} ${f1(rr * 1.2)} ${f1(-rr * 0.9)}q${f1(rr)} ${f1(-rr * 0.2)} ${f1(rr * 1.2)} ${f1(rr * 0.9)}z`;
      inner += `M${f1(x - rr * 0.55)} ${f1(cy - rr * 0.1)}a${f1(rr * 0.55)} ${f1(rr * 0.5)} 0 1 1 ${f1(rr * 1.1)} 0z`;
      veins += `M${f1(x)} ${f1(cy - rr * 0.1)}l${f1(-rr * 0.7)} ${f1(-rr * 0.35)}M${f1(x)} ${f1(cy - rr * 0.1)}l${f1(rr * 0.7)} ${f1(-rr * 0.35)}`;
    }
  }
  return `<path d="${soil}" fill="${K.soilDeep}" opacity=".7"/><path d="${outer}" fill="${mixHex(K.tea, K.hillNear, 0.35)}"/>`
    + `<path d="${inner}" fill="${mixHex(K.cabbage, K.hillNear, 0.4)}"/><path d="${veins}" stroke="${mixHex(K.cabbage, K.teaLit, 0.4)}" stroke-width=".8" opacity=".6"/>`;
}

/** A bamboo fence section between x0 and x1, its foot at `foot`, `h` tall: poles and two lashed rails. */
function bambooFence(ctx: KitCtx, x0: number, x1: number, foot: number, h: number, z: 2 | 3 = 3): string {
  let poles = '';
  for (let x = x0 + 3; x < x1; x += 7) poles += `M${f1(x)} ${foot}V${f1(foot - h + ((x * 7) % 5))}`;
  const rails = `M${x0} ${f1(foot - h * 0.3)}H${x1}M${x0} ${f1(foot - h * 0.72)}H${x1}`;
  return depth(ctx, z, `<path d="${poles}" stroke="${K.bamboo}" stroke-width="4.4" stroke-linecap="round"/><path d="${poles}" stroke="${K.bambooDeep}" stroke-width="1" stroke-linecap="round" opacity=".5" transform="translate(1.4 0)"/>`
    + `<path d="${rails}" stroke="${K.bambooDeep}" stroke-width="3"/>`, `<rect x="${x0}" y="${foot - h}" width="${x1 - x0}" height="${h}"/>`);
}

/**
 * 7-6, the centrefold (its spine's crease drawn live): the vegetable garden on the hill above the
 * tea, under the big moon. Left page: the earth path along the bottom (y 494) between beds of greens,
 * the scarecrow in a straw hat (Mocha's `scarecrow`, its hat's top at (60, 372)), the bamboo basket on
 * the path (Mocha's `basket`, its rim at (118, 446)), the bean trellis (its top at (200, 330)); the rain
 * jar at the wall's foot is the path's ledge (`gardenPathJar`). Right page: the stone terrace walls
 * stepping up to the celery bed (ledges), the bamboo fence along the top with its gate (a part) and
 * its post (the latch, a part, at (356, 334)), the little 土地公 shrine on the corner post at (360, 300);
 * the 芹菜's bed is where 黑糖 sleeps. Behind: the tea hills and their mist, a farmhouse's lit window.
 */
const celeryGarden: BackdropDraw = (ctx) => {
  const sky = maokongSky(ctx, 220, { moon: [300, 78, 27], seed: 171 });
  const ridges = hills(ctx, GUTTER_Y + 4, 172, { far: 186, mid: 222, near: 262 });
  // The farmhouse on the left's hillside, its window lit (where the farmer lives)
  const farm = depth(ctx, 2, `<rect x="40" y="250" width="58" height="34" fill="${mixHex(K.stone, K.hillNear, 0.5)}"/><path d="M32 252L69 230L106 252Z" fill="${mixHex(K.stoneDeep, C.shadow, 0.3)}"/>`
    + `<rect x="54" y="260" width="14" height="12" fill="${ref(ctx, 'window')}"/><rect x="76" y="262" width="12" height="22" fill="${K.woodDeep}"/>`, `<rect x="32" y="230" width="74" height="54"/>`)
    + softEllipse(ctx, 61, 266, 18, 12, 'lamp', 0.3) + treeCrown(ctx, 118, 262, 22, 173, K.teaDeep, 2);
  // The near hillside: tea rows, then the garden's beds on the floor page
  const near = depth(ctx, 2, `<path d="M-30 364V300Q90 282 200 294Q300 280 420 292V364Z" fill="${mixHex(K.tea, K.hillNear, 0.55)}"/>`, `<path d="M-30 280H420V364H-30Z"/>`)
    + teaRows(-30, 420, 300, 356, 5, 4, 174);
  // The bean trellis (top at (200, 330)): an A-frame of bamboo, vines and pods climbing it
  const trellis = depth(ctx, 3, `<path d="M180 494L198 330M222 494L202 330M176 470H226M184 420H218M190 376H212" stroke="${K.bamboo}" stroke-width="3.2" stroke-linecap="round"/>`
    + `<path d="M178 330H222" stroke="${K.bambooDeep}" stroke-width="3" stroke-linecap="round"/>`, `<path d="M176 330H226V494H176Z"/>`)
    + `<path d="M184 480q8 -20 0 -40t4 -40t-2 -40M218 480q-8 -20 0 -40t-4 -40t2 -40" stroke="${K.teaLight}" stroke-width="1.6" fill="none"/>`
    + [[186, 452], [214, 432], [190, 404], [212, 388], [196, 360], [206, 346], [184, 430], [216, 462]].map(([x, y], i) => `<path d="M${x} ${y}q${i % 2 ? 6 : -6} -4 ${i % 2 ? 2 : -2} -9q${i % 2 ? -5 : 5} 2 ${i % 2 ? -2 : 2} 9z" fill="${K.teaLit}"/>`).join('')
    + `<path d="M188 444v8M210 412v9M194 380v7" stroke="${K.celeryLight}" stroke-width="2.2" stroke-linecap="round"/>`;
  // The scarecrow (his hat's top at (60, 372)): a straw hat, a sack face, an old blue shirt on a cross pole
  const scarecrow = depth(ctx, 3, `<path d="M60 384V494" stroke="${K.woodDeep}" stroke-width="4"/><path d="M26 412H94" stroke="${K.woodDeep}" stroke-width="3.6"/>`
    + `<path d="M40 404Q60 398 80 404L86 446Q60 452 34 446Z" fill="${K.farmerBlue}"/><path d="M44 412H76M42 428H78" stroke="${K.farmerBlueDeep}" stroke-width="1.2"/>`
    + `<path d="M28 412l-6 4l6 2M92 412l6 4l-6 2" stroke="${K.straw}" stroke-width="2" fill="none"/>`
    + `<circle cx="60" cy="392" r="10" fill="${K.straw}"/><path d="M55 390h2M63 390h2M56 396q4 2 8 0" stroke="${K.soilDeep}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
    + `<path d="M38 384Q60 368 82 384Q60 380 38 384Z" fill="${K.strawDeep}"/><path d="M48 382Q50 370 60 370Q70 370 72 382Z" fill="${K.straw}"/><path d="M48 380H72" stroke="${C.hatRed}" stroke-width="2"/>`
    + `<path d="M40 446l-2 8M50 448l0 8M70 448l0 8M80 446l2 8" stroke="${K.straw}" stroke-width="1.6"/>`, `<path d="M26 368H94V494H26Z"/>`);
  // The bamboo basket on the path (its rim at (118, 446))
  const basket = depth(ctx, 4, `<path d="M96 446H140L134 492H102Z" fill="${K.bamboo}"/><path d="M98 456H138M99 466H137M100 476H136M101 486H135" stroke="${K.bambooDeep}" stroke-width="1.2"/>`
    + `<path d="${Array.from({ length: 7 }, (_, i) => `M${102 + i * 6} 446l${f1((i - 3) * -0.6)} 46`).join('')}" stroke="${K.bambooDeep}" stroke-width=".8" opacity=".6"/>`
    + `<path d="M94 446H142" stroke="${K.bambooDeep}" stroke-width="3" stroke-linecap="round"/><path d="M100 446Q118 426 136 446" stroke="${K.bambooDeep}" stroke-width="2" fill="none"/>`, `<path d="M94 426H142V492H94Z"/>`);
  // The fence along the top terrace: a section left of the gate, the latch's post and a corner post
  // with the little shrine (the 土地公 at (360, 300)); the gate's gap is the part's
  const fence = bambooFence(ctx, 268, 306, 406, 46) + bambooFence(ctx, 352, 400, 384, 40)
    + depth(ctx, 3, `<rect x="351" y="334" width="10" height="72" fill="${K.woodDeep}"/><rect x="349" y="330" width="14" height="5" fill="${K.wood}"/>`, `<rect x="349" y="330" width="14" height="76"/>`)
    + depth(ctx, 3, `<rect x="370" y="304" width="8" height="80" fill="${K.woodDeep}"/><path d="M350 288H392L386 280H356Z" fill="${C.hatRed}"/><rect x="352" y="288" width="36" height="18" fill="${mixHex(K.stone, K.hillNear, 0.3)}"/>`
      + `<rect x="358" y="290" width="24" height="14" fill="${ref(ctx, 'window')}" opacity=".6"/>`, `<path d="M350 280H392V384H350Z"/>`)
    + softEllipse(ctx, 370, 298, 20, 12, 'lamp', 0.3);
  // The floor page: beds of greens either side of the path, the terraces' earth
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(K.soilDeep, K.hillNear, 0.45)}"/>`
    + vegRows(FLOOR_RECT.x, FLOOR_RECT.x + FLOOR_RECT.w, GUTTER_Y + 4, 440, 175)
    + vegRows(FLOOR_RECT.x, FLOOR_RECT.x + FLOOR_RECT.w, 556, FLOOR_BOTTOM + 10, 176)
    // The terraces' stone mass under the walls on the right page, down to the beds
    + `<path d="M250 548V500H286V458H346V436H430V560H250Z" fill="${mixHex(K.stone, K.hillNear, 0.4)}"/>`
    + `<path d="${stoneCourses(250, 430, 440, 560, 177, 12)}" stroke="${mixHex(K.stoneDeep, C.shadow, 0.3)}" stroke-width="1" opacity=".6"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="20" fill="${C.shadow}" opacity=".22"/>`
    + pools(ctx, [[300, 420, 120, 30, 'moon'], [120, 520, 120, 20, 'moon'], [370, 300, 40, 14]]));
  return maokongDefs(ctx) + standingPage(ctx, sky + ridges + farm + near) + floor + trellis + scarecrow + basket + fence + bookCues(ctx) + block();
};

export const C7_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'c7/zoo-station': zooStation,
  'c7/gondola-station': gondolaStation,
  'c7/tea-terraces': teaTerraces,
  'c7/crystal-cabin': crystalCabin,
  'c7/giant-teapot': giantTeapot,
  'c7/celery-garden': celeryGarden,
};

// ——— Parts ———

// 7-2's drive and turnstile

/**
 * 7-2's bullwheel drive (a `loop`: its crank is drawn live, marigold, at the part's centre (236,
 * 524)): the 纜車's drive on its steel bed in the bottom station's machine pit — the great grooved
 * drive wheel lying flat (the crank turns on its hub), the haul rope running off it toward the
 * station, the motor's housing with its cooling fins and a lamp. The same in every state (the cabins
 * ride as riders). Local origin at the hit centre.
 */
const bullwheelDrive: PartSource = {
  preset: 'loop',
  states: ['0'],
  box: { x: -96, y: -54, w: 180, h: 100 },
  draw(ctx) {
    let grooves = '';
    for (let a = 0; a < 360; a += 15) grooves += `<path d="M${f1(Math.cos((a * Math.PI) / 180) * 40)} ${f1(Math.sin((a * Math.PI) / 180) * 14)}L${f1(Math.cos((a * Math.PI) / 180) * 46)} ${f1(Math.sin((a * Math.PI) / 180) * 16)}"/>`;
    let fins = '';
    for (let x = 52; x < 78; x += 4) fins += `M${x} -10v20`;
    return maokongDefs(ctx) + softEllipse(ctx, 0, 12, 76, 16, 'shadow', 0.45)
      // The steel bed and the motor's housing beside the wheel
      + depth(ctx, 3, `<path d="M-80 4H82L76 26H-74Z" fill="${K.steelDeep}"/><path d="M-80 4.6H82" stroke="${K.steelLight}" stroke-width="1" opacity=".6"/>`
        + `<rect x="48" y="-16" width="34" height="26" rx="3" fill="${ref(ctx, 'steelV')}"/><path d="${fins}" stroke="${K.steelDeep}" stroke-width="1.4"/>`
        + `<circle cx="74" cy="-20" r="2.4" fill="${C.doneGreen}"/>`, `<path d="M-80 -16H82V26H-80Z"/>`)
      // The haul rope leaving the wheel toward the station (up and to the left)
      + `<path d="M-40 -8L-96 -50M-44 6L-96 -36" stroke="${K.cable}" stroke-width="2.4"/><path d="M-40 -8L-96 -50" stroke="${K.steelLight}" stroke-width=".8" opacity=".5"/>`
      // The drive wheel lying flat: its rim, the rope in its groove, the spokes to the hub
      + depth(ctx, 3, `<ellipse cx="0" cy="2" rx="48" ry="18" fill="${K.steelDeep}"/><ellipse cx="0" cy="-2" rx="48" ry="17" fill="${K.steel}"/>`
        + `<ellipse cx="0" cy="-2" rx="44" ry="15" fill="none" stroke="${K.cable}" stroke-width="2.4"/>`
        + `<ellipse cx="0" cy="-2" rx="36" ry="12" fill="${mixHex(K.steelDeep, C.shadow, 0.3)}"/>`
        + `<g stroke="${K.steel}" stroke-width="3">${[0, 60, 120].map((a) => `<path d="M${f1(-36 * Math.cos((a * Math.PI) / 180))} ${f1(-2 - 12 * Math.sin((a * Math.PI) / 180))}L${f1(36 * Math.cos((a * Math.PI) / 180))} ${f1(-2 + 12 * Math.sin((a * Math.PI) / 180))}"/>`).join('')}</g>`
        + `<g stroke="${K.steelDeep}" stroke-width="1" opacity=".6" transform="translate(0 -2)">${grooves}</g>`
        + `<path d="M-46 -6Q0 -24 46 -6" stroke="${K.steelLight}" stroke-width="1.2" fill="none" opacity=".7"/>`, `<ellipse cx="0" cy="0" rx="48" ry="19"/>`);
  },
};

/**
 * 7-2's turnstile at the top station's exit (a `gate`): a steel pedestal with a tripod turnstile on
 * the platform (its foot at y 300), 「出口」 on a little sign; `closed`, an arm barred across the way and
 * its lamp red; `open`, the arms dropped (the 店員小哥 let his customer through) and the lamp green.
 * Local origin at the hit centre (220, 269).
 */
const turnstile: PartSource = {
  preset: 'gate',
  states: ['closed', 'open'],
  box: { x: -34, y: -36, w: 70, h: 72 },
  draw(ctx, state) {
    const open = state === 'open';
    const foot = 31;
    const hub: Pt = [-12, 2];
    const arm = (deg: number, len = 26) => {
      const a = (deg * Math.PI) / 180;
      return `M${hub[0]} ${hub[1]}L${f1(hub[0] + Math.cos(a) * len)} ${f1(hub[1] + Math.sin(a) * len)}`;
    };
    const arms = open ? arm(90, 20) + arm(210, 16) + arm(330, 16) : arm(0, 34) + arm(120, 16) + arm(240, 16);
    return maokongDefs(ctx) + depth(ctx, 3, `<rect x="-24" y="-6" width="18" height="${foot + 6}" rx="2" fill="${ref(ctx, 'steelV')}"/><path d="M-23 -5.2H-7" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`
      + `<rect x="-21" y="10" width="12" height="10" rx="1" fill="${K.steelDeep}"/><circle cx="-15" cy="15" r="3" fill="${open ? C.doneGreen : A.wingRed}"/>`
      + `<path d="${arms}" stroke="${K.steelLight}" stroke-width="3.6" stroke-linecap="round"/><path d="${arms}" stroke="${K.steelDeep}" stroke-width="1" stroke-linecap="round" opacity=".5" transform="translate(.6 .8)"/>`
      + `<circle cx="${hub[0]}" cy="${hub[1]}" r="4" fill="${K.steelDeep}"/>`
      + `<path d="M24 ${foot}V-20" stroke="${K.steelDeep}" stroke-width="2.4"/><rect x="12" y="-32" width="24" height="12" rx="2" fill="${K.cabinBand}"/>`, `<rect x="-24" y="-32" width="60" height="${foot + 32}"/>`)
      + `<text data-art-text="" x="24" y="-23.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7" fill="${C.chalk}">出口</text>`
      + softEllipse(ctx, -15, 15, 6, 6, 'lamp', open ? 0.35 : 0.2);
  },
};

// 7-6's latch and gate

/**
 * 7-6's fence latch on its post (a weight `button`: Mocha's weight presses it, C4): a bamboo latch bar
 * pinned to the post's top with a wooden toggle; `down`, pressed — the toggle tipped under his weight,
 * the bar lifted out of the gate's hook, chalk 「喀」. Local origin at the hit centre (356, 334).
 */
const fenceLatch: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -40, y: -26, w: 70, h: 52 },
  draw(ctx, state) {
    const down = state === 'down';
    const bar = down ? 'M-30 2L2 -6' : 'M-30 10L2 8';
    return maokongDefs(ctx) + depth(ctx, 3, `<path d="${bar}" stroke="${K.bamboo}" stroke-width="4" stroke-linecap="round"/><path d="${bar}" stroke="${K.bambooDeep}" stroke-width="1" stroke-linecap="round" opacity=".6" transform="translate(0 1.4)"/>`
      + `<rect x="-6" y="${down ? 2 : -2}" width="12" height="7" rx="2" fill="${K.wood}"/><circle cx="0" cy="${down ? 5.5 : 1.5}" r="1.6" fill="${K.woodDeep}"/>`
      + `<path d="M-32 14v-8h-4" stroke="${K.steelDeep}" stroke-width="1.6" fill="none"/>`, `<rect x="-36" y="-8" width="44" height="22"/>`)
      + (down ? `<g stroke="${C.chalk}" stroke-width="1.3" stroke-linecap="round" opacity=".9"><path d="M10 -10l5 -4M12 -2h6"/></g>`
        + `<text data-art-text="" x="12" y="-16" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.chalk}">喀</text>` : '');
  },
};

/**
 * 7-6's fence gate (a `gate`): a little bamboo gate between the fence and the latch's post, on the top
 * terrace (its foot at y 406); `closed`, its poles and lashed rails across the way, the latch's hook on
 * its edge; `open`, swung back against the fence, seen edge-on. Local origin at the hit centre (334, 378).
 */
const fenceGate: PartSource = {
  preset: 'gate',
  states: ['closed', 'open'],
  box: { x: -34, y: -30, w: 62, h: 64 },
  draw(ctx, state) {
    const foot = 28;
    if (state === 'open') {
      return maokongDefs(ctx) + depth(ctx, 3, `<path d="M-28 ${foot}V-14L-20 -10V${foot - 2}Z" fill="${K.bamboo}"/><path d="M-26 -8V${foot - 2}M-22 -8V${foot - 2}" stroke="${K.bambooDeep}" stroke-width="1"/>`
        + `<path d="M-28 -2L-20 0M-28 16L-20 17" stroke="${K.bambooDeep}" stroke-width="2"/>`, `<path d="M-28 ${foot}V-14L-20 -10V${foot}Z"/>`);
    }
    let poles = '';
    for (let x = -26; x <= 14; x += 6) poles += `M${x} ${foot}V${-12 + (x % 4 === 0 ? 0 : 3)}`;
    return maokongDefs(ctx) + depth(ctx, 3, `<path d="${poles}" stroke="${K.bamboo}" stroke-width="4.4" stroke-linecap="round"/><path d="${poles}" stroke="${K.bambooDeep}" stroke-width="1" stroke-linecap="round" opacity=".5" transform="translate(1.4 0)"/>`
      + `<path d="M-30 -2H18M-30 16H18" stroke="${K.bambooDeep}" stroke-width="3"/><path d="M-26 16L12 -2" stroke="${K.bambooDeep}" stroke-width="2"/>`
      + `<path d="M16 -4h4v6h-4" stroke="${K.steelDeep}" stroke-width="1.6" fill="none"/>`, `<path d="M-30 -14H20V${foot}H-30Z"/>`);
  },
};

// The carriers (baked per look, D-85)

/** 7-1's night-shift zookeeper (a carrier): `idle` dozing on his feed bucket at the top of the stairs; `carrying`, `back`, `done`. Feet at the origin. */
const zookeeper: PartSource = {
  preset: 'carrier',
  states: ['idle', 'carrying', 'back', 'done'],
  box: { x: -72, y: -190, w: 150, h: 196 },
  draw: (ctx, look) => keeperArt(ctx, look as 'idle'),
};

/**
 * 7-6's 黑糖 awake (a carrier, `lockedWhen` he sleeps): `away` while he sleeps up on the celery bed
 * (only his paw prints here), `idle` scooping a drink from the rain jar, `carrying`, `back`, `done`.
 * Feet at the origin (the wall's foot, `B5`).
 */
const blackBear: PartSource = {
  preset: 'carrier',
  states: ['idle', 'away', 'carrying', 'back', 'done'],
  box: { x: -76, y: -170, w: 156, h: 222 },
  draw: (ctx, look) => blackBearArt(ctx, look as 'idle'),
};

export const C7_PARTS: Readonly<Record<string, PartSource>> = {
  'c7/cloud': cloud,
  'c7/tea-pool': teaPool,
  'c7/teapot': teapotCradle,
  'c7/bullwheel': bullwheelDrive,
  'c7/turnstile': turnstile,
  'c7/folding-seat': foldingSeat,
  'c7/cabin-lamp': cabinLamp,
  'c7/fence-latch': fenceLatch,
  'c7/fence-gate': fenceGate,
  'c7/zookeeper': zookeeper,
  'c7/black-bear': blackBear,
};

export const C7_CUTOUTS: Readonly<Record<string, CutoutSource>> = {
  'c7/cable': cable,
  'c7/glass-mirror': glassMirror,
  'c7/teapot-0': teapotCutout('0'),
  'c7/teapot-1': teapotCutout('1'),
  'c7/teapot-2': teapotCutout('2'),
};

