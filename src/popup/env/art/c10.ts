import { POPUP as C, POPUP_101 as K, mixHex } from '../../../art/palette';
import { depth, f1, filterAttr, pageBlock, pinholes, ref, seeded, softEllipse, sparkle, wheelRim, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorWiden } from '../../view/geometry';
import { cleanerUncleArt } from '../../view/art/taipei101';
import { ungradeSvg } from '../grade';
import type { BackdropDraw, PartSource } from '../sources';
import { clerk } from './c1';
import { FLOOR_RECT, bookCues, bunting, floorPage, lin, rad, standingPage } from './common';

/**
 * Chapter 10 (台北101, 05:10) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#133) drew placeholders where a preset misleads
 * (D-97 § 7); the chapter's art issue (#134) draws the palette kit, the six backdrops and every part.
 *
 * **The kit** (bible § 6 row 10, `POPUP_101`): dawn violet and teal glass dominant, the peach of
 * first light and gold the accents. **The dawn arrives** (bible § 3.3): the sky walks to peach, a
 * warm radial low on the right where the sun comes up behind 象山 and the 四獸山 (`dawnSky101`), the
 * stars only in the upper left; right-facing facets take the peach, left ones stay indigo; on the
 * finale (10-6) the sun's foil rim clears the hills. The signature is **teal card facets with gold
 * rings**: 台北101 (`tower101`) drawn true — the podium's truncated pyramid with its gold coin, then
 * eight flared sections of eight floors (each with three facets: left indigo, front teal glass,
 * right peach, its floor mullions and a cyan rim, gold 如意 on the lowest), the crown, the silver
 * spire. Vellum clouds wrap it (`cloudWrap`). 信義's towers stand round it (`xinyiSkyline`).
 *
 * **Screen colours** (D-99): every backdrop here is passed through `ungradeSvg` — the bake's grade
 * divided out in advance — so the kit's colours are exactly what the screen shows, and a backdrop
 * and a part (parts are never graded) share one kit.
 */

/** The page block under the floor page. */
const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};

/** A chapter 10 backdrop: drawn in screen colours, the grade divided out for the bake (D-99). */
const screen = (draw: BackdropDraw): BackdropDraw => (ctx, def) => ungradeSvg(draw(ctx, def), 10);

/** A soft blur for vellum and glows (baked only). */
const blur = (ctx: KitCtx, name: 'blur3' | 'blur8' | 'blur18' = 'blur3') => (ctx.filters ? filterAttr(ctx, name) : '');

const serif = (x: number, y: number, size: number, fill: string, text: string, extra = '') =>
  `<text data-art-text="" x="${f1(x)}" y="${f1(y)}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${size}" fill="${fill}"${extra}>${text}</text>`;

// ——— The palette kit ———

/** 101's gradient defs, shared by the chapter's backdrops and parts. */
export function t101Defs(ctx: KitCtx): string {
  return `<defs>`
    + lin(ctx, 'tealGlass', [[0, K.tealLight], [0.45, K.teal], [1, K.tealDeep]])
    + lin(ctx, 'tealGlassH', [[0, K.tealDeep], [0.5, K.teal], [1, mixHex(K.teal, K.peach, 0.35)]], 'h')
    + lin(ctx, 'peachFacet', [[0, K.peachLight], [1, K.peachDeep]])
    + lin(ctx, 'indigoFacet', [[0, K.violetLight], [1, K.indigo]])
    + lin(ctx, 'steelV', [[0, K.steelLight], [1, K.steelDeep]])
    + lin(ctx, 'steelH', [[0, K.steelDeep], [0.45, K.steel], [0.7, K.steelLight], [1, K.steelDeep]], 'h')
    + lin(ctx, 'carWallG', [[0, K.carWall], [1, K.carWallShade]])
    + lin(ctx, 'lacquerG', [[0, K.lacquerLight], [1, K.lacquer]])
    + lin(ctx, 'stoneG', [[0, K.stone], [1, K.stoneShade]])
    + lin(ctx, 'graniteG', [[0, K.graniteLight], [1, K.graniteDeep]])
    + lin(ctx, 'woodG', [[0, K.woodLight], [1, K.woodDeep]])
    + lin(ctx, 'cityHaze', [[0, K.peachLight, 0], [0.6, K.peach, 0.22], [1, K.rose, 0.4]])
    + lin(ctx, 'mistV', [[0, K.peachLight, 0], [0.5, K.peachLight, 0.3], [1, K.rose, 0]])
    + lin(ctx, 'sunrise', [[0, K.violet, 0], [0.45, K.rose, 0.18], [0.8, K.peach, 0.45], [1, K.sunGlow, 0.7]])
    + rad(ctx, 'dawnGlow', [[0, K.sunCore, 0.95], [0.18, K.sunGlow, 0.7], [0.45, K.peach, 0.35], [0.75, K.rose, 0.12], [1, K.rose, 0]])
    + rad(ctx, 'sunHalo', [[0, K.sunCore, 0.9], [0.4, K.sunGlow, 0.45], [1, K.sunGlow, 0]])
    + rad(ctx, 'amberPool', [[0, C.lamp, 0.42], [0.55, C.lampAmber, 0.14], [1, C.lampAmber, 0]])
    + rad(ctx, 'dawnPool', [[0, K.peachLight, 0.45], [0.6, K.peach, 0.14], [1, K.peach, 0]])
    + `</defs>`;
}

/** Light pools on the floor page: amber under the lamps, the dawn's peach. */
const pools = (ctx: KitCtx, list: readonly (readonly [number, number, number, number, ('amber' | 'dawn')?])[]) =>
  list.map(([cx, cy, rx, ry, tone]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ref(ctx, tone === 'dawn' ? 'dawnPool' : 'amberPool')}"/>`).join('');

/**
 * The sky at 05:10 (the colour clock's last night row, indigo to peach): the chapter's sky, the
 * dawn's glow low where the sun is coming up (bible § 3.3: a warm radial from the lower right), the
 * last stars in the upper left only.
 */
function dawnSky101(ctx: KitCtx, x0: number, y0: number, x1: number, y1: number, { glow = [330, 300, 260, 150] as readonly [number, number, number, number], stars = 22, seed = 101 } = {}): string {
  return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${ref(ctx, 'sky')}"/>`
    + `<ellipse cx="${glow[0]}" cy="${glow[1]}" rx="${glow[2]}" ry="${glow[3]}" fill="${ref(ctx, 'dawnGlow')}"/>`
    + (stars > 0 ? pinholes(ctx, x0, y0, (x1 - x0) * 0.55, (y1 - y0) * 0.5, stars, seed) : '');
}

/** Long vellum cloud strips lit from below by the dawn: (x, y) a strip's foot centre, `w` its length. */
function dawnClouds(ctx: KitCtx, list: readonly (readonly [number, number, number])[], gold = 0): string {
  let body = '';
  let lit = '';
  for (const [x, y, w] of list) {
    const h = Math.max(4, w * 0.09);
    body += `M${f1(x - w / 2)} ${f1(y)}Q${f1(x - w * 0.32)} ${f1(y - h)} ${f1(x - w * 0.05)} ${f1(y - h * 0.8)}Q${f1(x + w * 0.22)} ${f1(y - h * 1.25)} ${f1(x + w / 2)} ${f1(y)}Z`;
    lit += `M${f1(x - w * 0.42)} ${f1(y - 0.6)}Q${f1(x)} ${f1(y + 1.4)} ${f1(x + w * 0.46)} ${f1(y - 0.6)}`;
  }
  const edge = gold > 0 ? mixHex(K.peachLight, K.sunGlow, gold) : K.peachLight;
  return `<path d="${body}" fill="${mixHex(K.violetLight, K.rose, 0.5)}" opacity=".5"${blur(ctx)}/>`
    + `<path d="${body}" fill="${mixHex(K.violetLight, K.rose, 0.55)}" opacity=".38"/>`
    + `<path d="${lit}" stroke="${edge}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".85"/>`;
}

/** The hills east of the city (象山 and the 四獸山), in two layers of card from x0 to x1 standing on `base`. */
function eastHills(ctx: KitCtx, x0: number, x1: number, base: number, h: number, seed: number): string {
  const r = seeded(seed);
  const ridge = (lift: number, amp: number, step: number) => {
    let d = `M${x0} ${base + 30}L${x0} ${f1(base - lift)}`;
    for (let x = x0; x < x1; x += step) {
      const y = base - lift - amp * (0.4 + r() * 0.6);
      d += `Q${f1(x + step * 0.5)} ${f1(y - amp * 0.3)} ${f1(x + step)} ${f1(base - lift - amp * r() * 0.5)}`;
    }
    return `${d}L${x1} ${base + 30}Z`;
  };
  const far = ridge(h * 0.4, h * 0.6, 70);
  const near = ridge(h * 0.05, h * 0.45, 46);
  return depth(ctx, 1, `<path d="${far}" fill="${K.hillFar}"/>`, `<path d="${far}"/>`)
    + `<path d="${far}" fill="${K.peach}" opacity=".12"/>`
    + `<rect x="${x0}" y="${f1(base - h * 0.42)}" width="${x1 - x0}" height="${f1(h * 0.34)}" fill="${ref(ctx, 'mistV')}"/>`
    + depth(ctx, 1, `<path d="${near}" fill="${K.hill}"/>`, `<path d="${near}"/>`);
}

/**
 * 信義's towers round 101 seen across the basin, from x0 to x1 standing on `base`: flat card blocks
 * in two depths, a few windows still lit, their right faces catching the peach.
 */
function xinyiSkyline(ctx: KitCtx, x0: number, x1: number, base: number, h: number, seed: number, { lit = 0.18 } = {}): string {
  const r = seeded(seed);
  let far = '';
  let near = '';
  let lights = '';
  let peach = '';
  for (const [layer, hk, wk] of [[0, 1, 1], [1, 0.62, 1.3]] as const) {
    for (let x = x0 - 10; x < x1; ) {
      const w = (10 + r() * 16) * wk;
      const bh = h * hk * (0.3 + r() * 0.7);
      const d = `M${f1(x)} ${base}V${f1(base - bh)}H${f1(x + w)}V${base}Z`;
      if (layer === 0) far += d;
      else near += d;
      peach += `M${f1(x + w - 2.2)} ${f1(base - bh)}h2.2V${base}h-2.2Z`;
      for (let wy = base - bh + 4; wy < base - 3; wy += 5) {
        for (let wx = x + 2; wx < x + w - 3; wx += 4) if (r() < lit) lights += `M${f1(wx)} ${f1(wy)}h1.6v1.8h-1.6Z`;
      }
      x += w + r() * 4;
    }
  }
  return `<path d="${far}" fill="${K.cityFar}"/><path d="${near}" fill="${K.cityMid}"/>`
    + `<path d="${peach}" fill="${K.peach}" opacity=".35"/><path d="${lights}" fill="${C.lamp}" opacity=".8"/>`
    + `<rect x="${x0 - 10}" y="${f1(base - h * 0.5)}" width="${x1 - x0 + 20}" height="${f1(h * 0.5)}" fill="${ref(ctx, 'cityHaze')}"/>`;
}

export interface Tower101 {
  /** The tower's centre line, where it meets the ground and the spire's tip */
  readonly cx: number;
  readonly ground: number;
  readonly tip: number;
  /** Floor mullions and the sections' ornaments (when drawn large) */
  readonly detail?: boolean;
  readonly z?: 1 | 2 | 3;
  /** The night-light windows still lit on the crown (a few) */
  readonly lit?: boolean;
}

/**
 * One flared section of 101 (bible § 6 row 10) from `yTop` to `yBot`: wider at the top (`wTop`)
 * than at the bottom (`wBot`), like a stacked 斗 or a bamboo joint. Three facets — left indigo
 * (in shade), front teal glass (with its sheen), right peach (the dawn) — the floor mullions, the
 * cyan rim along its lip. Returns the art and its outline.
 */
export function section101(cx: number, yTop: number, yBot: number, wTop: number, wBot: number, { floors = 8, mullions = true, glass = 'url(#none)' } = {}): { art: string; outline: string } {
  const [lt, rt, lb, rb] = [cx - wTop / 2, cx + wTop / 2, cx - wBot / 2, cx + wBot / 2];
  // The facets: the front is the middle 56 %, the side facets the rest (foreshortened)
  const fw = 0.56;
  const [flt, frt, flb, frb] = [cx - (wTop * fw) / 2, cx + (wTop * fw) / 2, cx - (wBot * fw) / 2, cx + (wBot * fw) / 2];
  const left = `M${f1(lt)} ${f1(yTop)}H${f1(flt)}L${f1(flb)} ${f1(yBot)}H${f1(lb)}Z`;
  const front = `M${f1(flt)} ${f1(yTop)}H${f1(frt)}L${f1(frb)} ${f1(yBot)}H${f1(flb)}Z`;
  const right = `M${f1(frt)} ${f1(yTop)}H${f1(rt)}L${f1(rb)} ${f1(yBot)}H${f1(frb)}Z`;
  const h = yBot - yTop;
  let lines = '';
  if (mullions) {
    for (let i = 1; i < floors; i++) {
      const t = i / floors;
      const y = yTop + h * t;
      const half = (wTop + (wBot - wTop) * t) / 2;
      lines += `M${f1(cx - half)} ${f1(y)}H${f1(cx + half)}`;
    }
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      lines += `M${f1(flt + (frt - flt) * t)} ${f1(yTop)}L${f1(flb + (frb - flb) * t)} ${f1(yBot)}`;
    }
  }
  const sheen = `M${f1(flt + (frt - flt) * 0.18)} ${f1(yBot)}L${f1(flt + (frt - flt) * 0.32)} ${f1(yTop)}H${f1(flt + (frt - flt) * 0.4)}L${f1(flt + (frt - flt) * 0.26)} ${f1(yBot)}Z`;
  const lip = Math.max(1, h * 0.06);
  const art = `<path d="${left}" fill="${K.indigo}"/><path d="${front}" fill="${glass}"/><path d="${right}" fill="${mixHex(K.peach, K.peachDeep, 0.2)}"/>`
    + (lines ? `<path d="${lines}" stroke="${K.violetDeep}" stroke-width="${f1(Math.max(0.4, h * 0.012))}" opacity=".45"/>` : '')
    + `<path d="${sheen}" fill="${C.glassine}" opacity=".16"/>`
    + `<path d="M${f1(flt)} ${f1(yTop)}L${f1(flb)} ${f1(yBot)}M${f1(frt)} ${f1(yTop)}L${f1(frb)} ${f1(yBot)}" stroke="${K.violetDeep}" stroke-width="${f1(Math.max(0.4, h * 0.016))}" opacity=".5"/>`
    // The lip: a cyan rim along the top edge, lit
    + `<path d="M${f1(lt - lip * 0.6)} ${f1(yTop)}H${f1(rt + lip * 0.6)}" stroke="${K.cyanRim}" stroke-width="${f1(lip)}" stroke-linecap="round"/>`;
  return { art, outline: `<path d="M${f1(lt)} ${f1(yTop)}H${f1(rt)}L${f1(rb)} ${f1(yBot)}H${f1(lb)}Z"/>` };
}

/** A gold 如意 (ruyi) cloud-head ornament centred on (x, y), `s` × a 12-unit one. */
export function ruyi(ctx: KitCtx, x: number, y: number, s: number): string {
  const k = (n: number) => f1(n * s);
  const d = `M${f1(x)} ${f1(y + 5 * s)}c${k(-4)} 0 ${k(-7)} ${k(-3)} ${k(-6)} ${k(-6)}c${k(0.6)} ${k(-2.6)} ${k(3.4)} ${k(-3)} ${k(4)} ${k(-0.8)}c${k(-0.6)} ${k(-3)} ${k(1)} ${k(-4.6)} ${k(2)} ${k(-4.6)}c${k(1)} 0 ${k(2.6)} ${k(1.6)} ${k(2)} ${k(4.6)}c${k(0.6)} ${k(-2.2)} ${k(3.4)} ${k(-1.8)} ${k(4)} ${k(0.8)}c${k(1)} ${k(3)} ${k(-2)} ${k(6)} ${k(-6)} ${k(6)}z`;
  return `<path d="${d}" fill="${ref(ctx, 'foil')}"/><path d="M${f1(x)} ${f1(y + 3.4 * s)}v${k(-4)}" stroke="${C.goldDeep}" stroke-width="${k(0.6)}"/>`;
}

/**
 * 台北101, drawn true (508 m to the tip; bible § 6 row 10): the podium (floors 1–25, a truncated
 * pyramid) with the great gold coin on its face, eight flared sections of eight floors each, the
 * crown (floors 91–101, stepped in), the pinnacle and the silver-foil spire with its red tip light.
 * Proportions: the podium a fifth of the height, the sections 0.53, the crown 0.13, the spire 0.14.
 */
export function tower101(ctx: KitCtx, t: Tower101): string {
  const { cx, ground, tip, detail = false, z = 2, lit = false } = t;
  const H = ground - tip;
  const y = (f: number) => ground - H * f;
  const glass = ref(ctx, 'tealGlass');
  let art = '';
  let outline = '';
  // The podium: wider at the ground, its own three facets, the gold coin medallion
  const [pt, pb] = [H * 0.1, H * 0.135];
  const podium = section101(cx, y(0.2), ground, pt, pb, { floors: detail ? 10 : 4, mullions: H > 120, glass });
  art += podium.art;
  outline += podium.outline;
  // The eight sections, each flaring out; their ends drop a hair below the next one's lip
  const sh = 0.53 / 8;
  for (let i = 0; i < 8; i++) {
    const s = section101(cx, y(0.2 + sh * (i + 1)), y(0.2 + sh * i) + 0.4, H * 0.118, H * 0.086, { floors: 8, mullions: H > 200, glass });
    art += s.art;
    outline += s.outline;
  }
  // The crown: stepped boxes in toward the pinnacle
  const crown: [number, number, number][] = [[0.73, 0.765, 0.07], [0.765, 0.8, 0.058], [0.8, 0.835, 0.045], [0.835, 0.86, 0.03]];
  for (const [a, b, w] of crown) {
    const s = section101(cx, y(b), y(a) + 0.3, H * w, H * w * 0.92, { floors: 3, mullions: H > 260, glass });
    art += s.art;
    outline += s.outline;
  }
  // The spire: silver foil with rings, the red light at its tip
  const sw = Math.max(1, H * 0.006);
  art += `<path d="M${f1(cx - sw)} ${f1(y(0.86))}L${f1(cx - sw * 0.4)} ${f1(tip + H * 0.01)}L${f1(cx)} ${f1(tip)}L${f1(cx + sw * 0.4)} ${f1(tip + H * 0.01)}L${f1(cx + sw)} ${f1(y(0.86))}Z" fill="${ref(ctx, 'silver')}"/>`;
  outline += `<path d="M${f1(cx - sw)} ${f1(y(0.86))}L${f1(cx)} ${f1(tip)}L${f1(cx + sw)} ${f1(y(0.86))}Z"/>`;
  if (H > 160) {
    let rings = '';
    for (const f of [0.885, 0.91, 0.935]) rings += `M${f1(cx - sw * 1.6)} ${f1(y(f))}h${f1(sw * 3.2)}`;
    art += `<path d="${rings}" stroke="${K.steelDeep}" stroke-width="${f1(Math.max(0.6, H * 0.003))}"/>`;
  }
  // The coin on the podium (front facet) and 如意 on the lowest section's front
  const coinR = H * 0.022;
  const coinY = y(0.165);
  const coin = `<circle cx="${f1(cx)}" cy="${f1(coinY)}" r="${f1(coinR)}" fill="${ref(ctx, 'foil')}"/>`
    + `<rect x="${f1(cx - coinR * 0.36)}" y="${f1(coinY - coinR * 0.36)}" width="${f1(coinR * 0.72)}" height="${f1(coinR * 0.72)}" fill="${K.tealDeep}"/>`;
  const ornaments = coin + (detail ? ruyi(ctx, cx, y(0.2 + sh * 0.5), H * 0.0016) : '');
  return depth(ctx, z, art + ornaments, outline)
    + softEllipse(ctx, cx, tip + 1, Math.max(3, H * 0.012), Math.max(3, H * 0.012), 'lamp', 0.35)
    + `<circle cx="${f1(cx)}" cy="${f1(tip + Math.max(0.8, H * 0.004))}" r="${f1(Math.max(0.9, H * 0.004))}" fill="${C.neonPink}"/>`
    + (lit ? `<path d="M${f1(cx - H * 0.02)} ${f1(y(0.79))}h${f1(H * 0.04)}" stroke="${C.lamp}" stroke-width="${f1(Math.max(0.6, H * 0.004))}" opacity=".8"/>` : '');
}

/** Vellum clouds wrapping the tower (bible § 6: 「Vellum clouds wrap the tower」): a band across x0–x1 at y. */
function cloudWrap(ctx: KitCtx, x0: number, x1: number, y: number, h: number, seed: number): string {
  const r = seeded(seed);
  let d = `M${x0} ${f1(y + h * 0.5)}`;
  for (let x = x0; x < x1; x += h * 1.4) {
    const bump = h * (0.6 + r() * 0.5);
    d += `q${f1(h * 0.7)} ${f1(-bump)} ${f1(h * 1.4)} 0`;
  }
  d += `V${f1(y + h)}H${x0}Z`;
  return `<path d="${d}" fill="${K.peachLight}" opacity=".32"${blur(ctx)}/><path d="${d}" fill="${mixHex(K.violetLight, K.peachLight, 0.55)}" opacity=".4"/>`
    + `<path d="${d.split('V')[0]}" stroke="${K.peachLight}" stroke-width="1.4" fill="none" opacity=".7"/>`;
}

// ——— 10-1 「信義線」 ———

/** 10-1's car: its ceiling, the window band, the floor line (the floor ledges' feet) and the body's foot; the front window. */
const CAR = { ceiling: 54, winTop: 132, winBottom: 250, floor: 486, body: 540 } as const;
const FRONT = { x0: 322, x1: 388, y0: 298, y1: 436 } as const;

/** The dawn city from the 月亮線 (信義區 at 05:10): the sky, the last stars, the towers, a strip of the eastern hills. */
function xinyiView(ctx: KitCtx, x0: number, y0: number, x1: number, y1: number, seed: number, { tower = null as null | [number, number] } = {}): string {
  const w = x1 - x0;
  const base = y0 + (y1 - y0) * 0.8;
  return dawnSky101(ctx, x0 - 10, y0 - 10, x1 + 10, y1 + 10, { glow: [x0 + w * 0.85, base, w * 0.9, (y1 - y0) * 0.6], stars: 8, seed })
    + dawnClouds(ctx, [[x0 + w * 0.3, y0 + (y1 - y0) * 0.22, w * 0.42], [x0 + w * 0.75, y0 + (y1 - y0) * 0.4, w * 0.3]])
    + eastHills(ctx, x0 - 20, x1 + 20, base - 2, (y1 - y0) * 0.22, seed + 1)
    + (tower ? tower101(ctx, { cx: tower[0], ground: base + 4, tip: tower[1], z: 1, lit: true }) : '')
    + xinyiSkyline(ctx, x0, x1, base + 6, (y1 - y0) * 0.36, seed + 2)
    + `<rect x="${x0 - 10}" y="${f1(base + 6)}" width="${w + 20}" height="${f1(y1 - base)}" fill="${K.cityNear}"/>`;
}

/** A standing steel luggage rack (Mocha's perch, its top at (x, top)): a wire shelf on two tubular stanchions. */
function luggageRack(ctx: KitCtx, x: number, top: number, w: number, foot: number): string {
  const [l, r] = [x - w / 2, x + w / 2];
  let wires = '';
  for (let sx = l + 5; sx < r - 2; sx += 6) wires += `M${f1(sx)} ${top + 1.5}v4`;
  return depth(ctx, 3, `<path d="M${f1(l + 6)} ${top + 6}V${foot}M${f1(r - 6)} ${top + 6}V${foot}" stroke="${ref(ctx, 'steelH')}" stroke-width="3.4"/>`
    + `<path d="M${f1(l + 6)} ${top + 30}L${f1(l + 20)} ${top + 7}M${f1(r - 6)} ${top + 30}L${f1(r - 20)} ${top + 7}" stroke="${K.steelDeep}" stroke-width="2"/>`
    + `<rect x="${f1(l)}" y="${top}" width="${w}" height="7" rx="3" fill="${K.steelDeep}"/><path d="${wires}" stroke="${K.steel}" stroke-width="1.2"/>`
    + `<path d="M${f1(l + 2)} ${top + 0.8}H${f1(r - 2)}" stroke="${C.cutRim}" stroke-width="1.2" opacity=".6"/>`
    + `<rect x="${f1(l + 2)}" y="${foot - 4}" width="12" height="4" rx="1" fill="${K.steelDeep}"/><rect x="${f1(r - 14)}" y="${foot - 4}" width="12" height="4" rx="1" fill="${K.steelDeep}"/>`,
  `<rect x="${f1(l)}" y="${top}" width="${w}" height="${foot - top}"/>`);
}

/**
 * 10-1: two cars of the 月亮線 on the 信義線, out on the viaduct at 05:10 (bible § 6 cars row: a
 * side cut-away box, the line's red band). The back wall: the cream ceiling with its strip lights and
 * the route strip (象山 → 台北101, the next stop lit), the strap rail and straps, the window band onto
 * the dawn — 信義's towers, the hills going peach — over the red band. Car 1 on the left; the gangway
 * between the cars (its bellows round the door, a part at (144, 438); the 悠遊卡 reader beside it);
 * car 2 on the right with its long seat (where the commuter tucks up, (236, 432); the 土地公 beside
 * him, (196, 410)). The front of the train on the right: the end wall's big front window (behind the
 * balloons: 101 straight ahead, lit at its tip) over its sill (`W`, (362, 440)). Mocha's racks stand
 * in the aisle (`rack1` (44, 372), `rack2` (300, 372)). The floor, the red-banded body, the viaduct.
 */
const xinyiLine: BackdropDraw = (ctx) => {
  const { ceiling, winTop, winBottom, floor, body } = CAR;
  const wins: [number, number][] = [[12, 92], [186, 100]];
  const clip = ctx.id('c10win');
  const winPath = wins.map(([x, w]) => `M${x + 10} ${winTop}h${w - 20}a10 10 0 0 1 10 10v${winBottom - winTop - 20}a10 10 0 0 1 -10 10h${20 - w}a10 10 0 0 1 -10 -10v${20 - winBottom + winTop}a10 10 0 0 1 10 -10z`).join('');
  const outside = `<clipPath id="${clip}"><path d="${winPath}"/></clipPath><g clip-path="url(#${clip})">${xinyiView(ctx, 0, winTop, 300, winBottom, 111)}`
    + wins.map(([x, w]) => `<path d="M${x + w * 0.15} ${winBottom}L${x + w * 0.45} ${winTop}H${x + w * 0.55}L${x + w * 0.25} ${winBottom}Z" fill="${C.glassine}" opacity=".12"/>`).join('') + `</g>`
    + `<path d="${winPath}" fill="none" stroke="${K.steelDeep}" stroke-width="5"/><path d="${winPath}" fill="none" stroke="${K.steelLight}" stroke-width="1.4" transform="translate(-.8 -.8)" opacity=".7"/>`;
  // The wall: cream card, the line's red band under the windows, a steel kick panel; the dawn pouring in
  const wall = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'carWallG')}"/>`
    + `<rect x="-20" y="${winBottom + 16}" width="${PAGE_W + 40}" height="9" fill="${K.lineRed}"/><rect x="-20" y="${winBottom + 25}" width="${PAGE_W + 40}" height="2" fill="${K.lineRedDeep}"/>`
    + `<rect x="-20" y="306" width="${PAGE_W + 40}" height="54" fill="${mixHex(K.steelDeep, K.violet, 0.3)}"/>`
    + `<path d="${Array.from({ length: 48 }, (_, i) => `M${-16 + i * 9} 314v40`).join('')}" stroke="${K.steel}" stroke-width="1.4" opacity=".3"/>`
    + `<path d="M12 ${winBottom}L-20 330H118L104 ${winBottom}ZM186 ${winBottom}L160 330H300L286 ${winBottom}Z" fill="${K.peachLight}" opacity=".14"/>`;
  // The ceiling: a cream vault, strip lights, the route strip (象山 → 台北101, the next stop lit)
  const ceil = `<path d="M-20 0H410V${ceiling}Q195 ${ceiling + 18} -20 ${ceiling}Z" fill="${mixHex(K.carWall, K.violet, 0.25)}"/>`
    + `<path d="M-20 ${ceiling}Q195 ${ceiling + 18} 410 ${ceiling}" stroke="${K.carWallShade}" stroke-width="2" fill="none"/>`
    + [44, 140, 250, 346].map((x) => `<rect x="${x - 30}" y="18" width="60" height="6" rx="3" fill="${C.lampHot}"/>`).join('')
    + softEllipse(ctx, 195, 26, 220, 18, 'lamp', 0.2, 'blur8');
  const stops: [number, string][] = [[118, '象山'], [196, '台北101'], [272, '信義安和']];
  const route = depth(ctx, 2, `<rect x="92" y="62" width="206" height="26" rx="4" fill="${K.violetDeep}"/>`, `<rect x="92" y="62" width="206" height="26"/>`)
    + `<path d="M104 80H286" stroke="${K.lineRed}" stroke-width="3.4" stroke-linecap="round"/>`
    + stops.map(([x, name], i) => (i === 1 ? softEllipse(ctx, x, 80, 10, 9, 'lamp', 0.55) : '') + `<circle cx="${x}" cy="80" r="${i === 1 ? 4.4 : 3}" fill="${i === 1 ? C.lampHot : K.steel}" stroke="${K.lineRed}" stroke-width="1.4"/>`
      + serif(x, 74, i === 1 ? 7.6 : 6, i === 1 ? C.lampHot : C.chalk, name, i === 1 ? '' : ' opacity=".7"')).join('')
    + `<path d="M150 80l8 -3.4v6.8z" fill="${C.lampHot}"/>`;
  let straps = '';
  for (const x of [30, 70, 196, 236, 276]) straps += `<path d="M${x} 100V116" stroke="${K.lineRedDeep}" stroke-width="3.4"/><circle cx="${x}" cy="124" r="7" fill="none" stroke="${K.steelDeep}" stroke-width="3.6"/><circle cx="${x}" cy="124" r="7" fill="none" stroke="${K.steelLight}" stroke-width="1.6"/>`;
  const rail = `<path d="M-20 98H310" stroke="${K.steel}" stroke-width="3"/><path d="M-20 97H310" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>` + straps;
  // The gangway between the cars: the bellows' dark folds round the door's frame, the 悠遊卡 reader
  let folds = '';
  for (let x = 108; x <= 180; x += 4) if (x < 114 || x > 174) folds += `M${x} 60V${floor}`;
  const gangway = `<rect x="104" y="58" width="80" height="${floor - 58}" fill="${mixHex(K.carWallShade, K.violet, 0.35)}"/><path d="${folds}" stroke="${K.carWallShade}" stroke-width="1.8" opacity=".8"/>`
    + `<path d="M104 58V${floor}M184 58V${floor}" stroke="${K.carWall}" stroke-width="3"/>`
    + depth(ctx, 2, `<path d="M112 ${floor}V300Q112 288 124 288H164Q176 288 176 300V${floor}H170V304Q170 296 162 296H126Q118 296 118 304V${floor}Z" fill="${ref(ctx, 'steelH')}"/>`, `<path d="M112 288H176V${floor}H112Z"/>`)
    // The next car seen through the doorway (lit)
    + `<rect x="118" y="296" width="52" height="${floor - 296}" fill="${mixHex(K.carWall, K.violet, 0.2)}"/>`
    // The car numbers over the gangway
    + depth(ctx, 2, `<rect x="126" y="252" width="36" height="22" rx="4" fill="${K.violetDeep}"/>`, `<rect x="126" y="252" width="36" height="22"/>`)
    + serif(136, 268, 10, C.chalk, '1', ' opacity=".7"') + serif(152, 268, 10, C.lampHot, '2') + `<path d="M141 263h4" stroke="${C.chalk}" stroke-width="1" opacity=".6"/>`
    // The 悠遊卡 reader on the gangway's post (嗶！ is said to it)
    + depth(ctx, 3, `<rect x="180" y="352" width="18" height="30" rx="3" fill="${K.steelDeep}"/><rect x="183" y="356" width="12" height="9" rx="1.4" fill="${K.tealLit}"/>`
      + `<circle cx="189" cy="373" r="4.4" fill="none" stroke="${K.steelLight}" stroke-width="1.2"/><path d="M186 373a3 3 0 0 1 6 0" stroke="${K.steelLight}" stroke-width="1" fill="none"/>`, `<rect x="180" y="352" width="18" height="30"/>`)
    + softEllipse(ctx, 189, 360, 10, 8, 'lamp', 0.2);
  // Car 2's long seat along the wall (the commuter's; its top at y 432) and its stanchions
  const seat = depth(ctx, 3, `<rect x="186" y="430" width="112" height="14" rx="5" fill="${K.seat}"/><path d="${Array.from({ length: 4 }, (_, i) => `M${214 + i * 28} 432v10`).join('')}" stroke="${mixHex(K.seat, C.shadow, 0.35)}" stroke-width="1.2"/>`
    + `<rect x="190" y="400" width="104" height="30" rx="5" fill="${mixHex(K.seat, K.violet, 0.25)}"/><rect x="190" y="444" width="104" height="${floor - 444}" fill="${mixHex(K.steelDeep, C.shadow, 0.25)}"/>`
    + `<path d="M187 431H297" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="186" y="400" width="112" height="${floor - 400}"/>`);
  // The front: the end wall standing at the far end, its big window over the sill (the bead's ledge)
  const { x0, x1, y0, y1 } = FRONT;
  const endClip = ctx.id('c10front');
  const endView = `<clipPath id="${endClip}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="8"/></clipPath><g clip-path="url(#${endClip})">`
    + xinyiView(ctx, 300, y0, 410, y1, 121, { tower: [355, y0 + 8] })
    // The viaduct's track running ahead toward the tower
    + `<path d="M${x0 - 4} ${y1}L353 ${y1 - 22}L359 ${y1 - 22}L${x1 + 6} ${y1}Z" fill="${K.graniteDeep}"/><path d="M340 ${y1}L354 ${y1 - 22}M372 ${y1}L358 ${y1 - 22}" stroke="${K.peachLight}" stroke-width="1" opacity=".7"/>`
    + `<path d="M${x0 + 8} ${y1}L${x0 + 30} ${y0}H${x0 + 40}L${x0 + 18} ${y1}Z" fill="${C.glassine}" opacity=".12"/></g>`;
  const endWall = depth(ctx, 3, `<path d="M306 236H410V${floor + 6}H306Z" fill="${ref(ctx, 'carWallG')}"/>`
    + `<rect x="306" y="${winBottom + 16}" width="104" height="9" fill="${K.lineRed}"/>`
    + `<path d="M307 237H409" stroke="${C.cutRim}" stroke-width="1.2" opacity=".5"/><path d="M307 236V${floor + 6}" stroke="${K.carWallShade}" stroke-width="2"/>`, `<path d="M306 236H410V${floor + 6}H306Z"/>`)
    + endView
    + `<rect x="${x0 - 3}" y="${y0 - 3}" width="${x1 - x0 + 6}" height="${y1 - y0 + 6}" rx="10" fill="none" stroke="${K.steelDeep}" stroke-width="5"/>`
    + depth(ctx, 3, `<rect x="${x0 - 8}" y="${y1 + 2}" width="${x1 - x0 + 16}" height="9" rx="2" fill="${ref(ctx, 'steelV')}"/><path d="M${x0 - 7} ${y1 + 2.8}H${x1 + 7}" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<rect x="${x0 - 8}" y="${y1 + 2}" width="${x1 - x0 + 16}" height="9"/>`)
    + depth(ctx, 2, `<rect x="320" y="266" width="66" height="16" rx="3" fill="${K.violetDeep}"/>`, `<rect x="320" y="266" width="66" height="16" rx="3"/>`)
    + serif(353, 277.6, 8, C.lampHot, '往 101 ▶', ' letter-spacing="1"');
  // Two stainless poles in the aisle
  const poles = [92, 214].map((x) => `<rect x="${x - 2.5}" y="${ceiling + 8}" width="5" height="${floor - ceiling - 8}" fill="${ref(ctx, 'steelH')}"/><path d="M${x - 1} ${ceiling + 8}V${floor}" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`).join('');
  // The floor page: the car's studded floor, the dawn's pools, the viaduct and the city below
  const trackTop = body + 14;
  let studs = '';
  const r = seeded(112);
  for (let i = 0; i < 160; i++) studs += `<circle cx="${f1(-40 + r() * 470)}" cy="${f1(GUTTER_Y + r() * (floor - GUTTER_Y))}" r="1.1"/>`;
  const floorArt = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${K.cityNear}"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${floor - GUTTER_Y + 10}" fill="${mixHex(K.graniteDeep, K.violetDeep, 0.4)}"/>`
    + `<g fill="${K.granite}" opacity=".6">${studs}</g>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="22" fill="${C.shadow}" opacity=".22"/>`
    + pools(ctx, [[60, 410, 110, 24, 'dawn'], [236, 420, 120, 24, 'dawn'], [356, 470, 70, 26, 'dawn'], [195, 470, 220, 30]])
    // Below the viaduct: the city's streets with their lamps, the dawn's haze
    + xinyiSkyline(ctx, FLOOR_RECT.x, FLOOR_RECT.x + FLOOR_RECT.w, FLOOR_BOTTOM + 4, 70, 113, { lit: 0.3 })
    + `<rect x="${FLOOR_RECT.x}" y="${trackTop}" width="${FLOOR_RECT.w}" height="40" fill="${ref(ctx, 'graniteG')}"/>`
    + `<path d="M-60 ${trackTop + 12}H460M-60 ${trackTop + 26}H460" stroke="${K.steelDeep}" stroke-width="3"/><path d="M-60 ${trackTop + 11}H460M-60 ${trackTop + 25}H460" stroke="${K.peachLight}" stroke-width=".9" opacity=".6"/>`
    + `<path d="${Array.from({ length: 4 }, (_, i) => `M${30 + i * 120} ${trackTop + 40}v${FLOOR_BOTTOM - trackTop - 36}`).join('')}" stroke="${K.graniteDeep}" stroke-width="22"/>`
    + `<path d="${Array.from({ length: 4 }, (_, i) => `M${40 + i * 120} ${trackTop + 40}v${FLOOR_BOTTOM - trackTop - 36}`).join('')}" stroke="${K.peach}" stroke-width="2" opacity=".3"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${trackTop}" width="${FLOOR_RECT.w}" height="8" fill="${C.shadow}" opacity=".35"/>`);
  const shell = depth(ctx, 3, `<rect x="-30" y="${floor}" width="${PAGE_W + 60}" height="${body - floor}" fill="${K.carWallShade}"/>`
    + `<rect x="-30" y="${floor + 14}" width="${PAGE_W + 60}" height="10" fill="${K.lineRed}"/><rect x="-30" y="${floor + 25}" width="${PAGE_W + 60}" height="2" fill="${K.lineRedDeep}"/>`
    + `<rect x="-30" y="${body - 8}" width="${PAGE_W + 60}" height="8" fill="${mixHex(K.steelDeep, C.shadow, 0.3)}"/>`, `<rect x="-30" y="${floor}" width="${PAGE_W + 60}" height="${body - floor}"/>`)
    + [60, 330].map((x) => `<rect x="${x - 26}" y="${body}" width="52" height="12" rx="2" fill="${K.steelDeep}"/><circle cx="${x - 14}" cy="${body + 12}" r="8" fill="${C.printDark}"/><circle cx="${x + 14}" cy="${body + 12}" r="8" fill="${C.printDark}"/>`).join('');
  const racks = luggageRack(ctx, 44, 384, 64, 458) + luggageRack(ctx, 296, 384, 52, 470);
  return t101Defs(ctx) + standingPage(ctx, wall + outside + ceil + route + rail + gangway)
    + floorArt + shell + seat + poles + endWall + racks + bookCues(ctx) + block();
};

// ——— 10-2 「37秒電梯」 ———

/** 10-2's cross-section: the 89F floor line, its slab, the shaft's sides, the 5F floor line. */
const LIFT = { floor89: 262, slab: 280, shaft0: 180, shaft1: 240, floor5: 486 } as const;

/**
 * The basin seen from 89F at 05:10 (382 m up): the sky walking to peach, the hills catching the
 * first light (象山 east, on the right; 觀音山 far west, on the left), the city's grid far below with
 * its lights going out, the 基隆河 a glint.
 */
function basinView(ctx: KitCtx, x0: number, y0: number, x1: number, y1: number, seed: number, { east = true } = {}): string {
  const w = x1 - x0;
  const horizon = y0 + (y1 - y0) * 0.42;
  const r = seeded(seed);
  let grid = '';
  let lights = '';
  for (let y = horizon + 10; y < y1 + 10; y += 6 + (y - horizon) * 0.08) {
    grid += `M${x0 - 10} ${f1(y)}H${x1 + 10}`;
    for (let x = x0; x < x1; x += 4 + r() * 8) if (r() < 0.22) lights += `M${f1(x)} ${f1(y - 1)}h1.4v1.4h-1.4Z`;
  }
  for (let x = x0 - 40; x < x1 + 40; x += 26) grid += `M${f1(x)} ${f1(y1 + 10)}L${f1(x0 + w / 2 + (x - x0 - w / 2) * 0.25)} ${f1(horizon + 8)}`;
  return dawnSky101(ctx, x0 - 10, y0 - 10, x1 + 10, y1 + 10, { glow: east ? [x1 - w * 0.1, horizon, w * 0.9, (y1 - y0) * 0.55] : [x1 + w * 0.6, horizon, w, (y1 - y0) * 0.5], stars: east ? 4 : 10, seed })
    + dawnClouds(ctx, [[x0 + w * 0.4, y0 + (y1 - y0) * 0.18, w * 0.5], [x0 + w * 0.8, y0 + (y1 - y0) * 0.3, w * 0.36]])
    + (east ? eastHills(ctx, x0 - 20, x1 + 20, horizon + 6, (y1 - y0) * 0.16, seed + 1)
      : `<path d="M${x0 - 20} ${f1(horizon + 6)}Q${f1(x0 + w * 0.2)} ${f1(horizon - (y1 - y0) * 0.12)} ${f1(x0 + w * 0.45)} ${f1(horizon - 2)}T${x1 + 20} ${f1(horizon + 6)}Z" fill="${K.hillFar}"/>`)
    + `<rect x="${x0 - 10}" y="${f1(horizon + 6)}" width="${w + 20}" height="${f1(y1 - horizon)}" fill="${K.cityMid}"/>`
    + `<path d="${grid}" stroke="${K.cityFar}" stroke-width=".9"/><path d="${lights}" fill="${C.lamp}" opacity=".75"/>`
    + `<path d="M${x0 - 10} ${f1(horizon + 30)}Q${f1(x0 + w * 0.5)} ${f1(horizon + 18)} ${x1 + 10} ${f1(horizon + 26)}" stroke="${K.peachLight}" stroke-width="2" fill="none" opacity=".5"/>`
    + `<rect x="${x0 - 10}" y="${f1(horizon)}" width="${w + 20}" height="${f1((y1 - y0) * 0.25)}" fill="${ref(ctx, 'cityHaze')}"/>`;
}

/** 101's observatory glass from x0 to x1 over y0–y1: the panes lean out (the tower's flare), slim mullions, a sheen. */
function leaningGlass(ctx: KitCtx, x0: number, x1: number, y0: number, y1: number, view: string, id: string): string {
  const clip = ctx.id(id);
  let mull = '';
  for (let x = x0 + 4; x < x1; x += 34) mull += `M${f1(x)} ${y1}L${f1(x + 8)} ${y0}`;
  return `<clipPath id="${clip}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath><g clip-path="url(#${clip})">${view}`
    + `<path d="M${f1(x0 + (x1 - x0) * 0.2)} ${y1}L${f1(x0 + (x1 - x0) * 0.32)} ${y0}H${f1(x0 + (x1 - x0) * 0.38)}L${f1(x0 + (x1 - x0) * 0.26)} ${y1}Z" fill="${C.glassine}" opacity=".12"/></g>`
    + `<path d="${mull}" stroke="${K.lacquer}" stroke-width="3.4"/><path d="${mull}" stroke="${K.steel}" stroke-width=".8" opacity=".6" transform="translate(-1 0)"/>`
    + `<path d="M${x0} ${y0}H${x1}M${x0} ${y1}H${x1}" stroke="${K.lacquer}" stroke-width="4"/>`;
}

/** A souvenir 101 model (a gift-shop knick-knack) standing at (x, y), `h` tall. */
const souvenir101 = (ctx: KitCtx, x: number, y: number, h: number) => tower101(ctx, { cx: x, ground: y, tip: y - h, z: 1 });

/**
 * 10-2: 101's express elevator in cross-section (a callback to 1-5). Above, **89F**, the indoor
 * observatory at dawn: the leaning glass all round onto the basin far below (觀音山 west on the left,
 * 象山 east on the right, the first light behind it); the 店員小哥's little 89F branch by the shaft on
 * the left (「我們在101也有分店。」); the gift shop on the right — its shelf of souvenirs (Mocha's `shelf`,
 * (294, 180)), the display case of souvenir hats (the 土地公 among them, (340, 176)); the floor's cut
 * slab. Between: the shaft running the whole height, its guide rails and cables, the floors flashing
 * past compressed (6F … 88F), 「37秒」 printed up its wall, the altitude dial over its door at 89F (a
 * part at (210, 148)). Below, **5F**, the ticket hall: its marble floor, the shaft's doors, the ticket
 * counter (Mocha's `counter`, (120, 410)) with its queue stanchions.
 */
const elevatorPage: BackdropDraw = (ctx) => {
  const { floor89, slab, shaft0, shaft1, floor5 } = LIFT;
  // 89F: the ceiling with its downlights, the glass all round
  const westGlass = leaningGlass(ctx, -10, 92, 70, floor89, basinView(ctx, -10, 70, 92, floor89, 201, { east: false }), 'c10west');
  const eastGlass = leaningGlass(ctx, 246, 400, 70, floor89, basinView(ctx, 246, 70, 400, floor89, 202), 'c10east');
  const ceiling = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="72" fill="${K.lacquer}"/>`
    + `<path d="M-20 66H410" stroke="${K.lacquerLight}" stroke-width="3"/>`
    + [30, 120, 290, 360].map((x) => `<ellipse cx="${x}" cy="62" rx="12" ry="3" fill="${C.lampHot}"/>`).join('')
    + softEllipse(ctx, 195, 70, 220, 14, 'lamp', 0.18, 'blur8')
    + serif(46, 40, 13, C.chalk, '89F', ' opacity=".85" letter-spacing="1"') + serif(46, 54, 6.4, C.chalk, '觀景台', ' opacity=".6" letter-spacing="2"');
  // The wall either side of the shaft at 89F (the clerk's branch on the left, the shop on the right)
  const walls = `<rect x="92" y="72" width="${shaft0 - 92}" height="${floor89 - 72}" fill="${mixHex(K.stoneShade, K.violet, 0.3)}"/>`
    + `<rect x="${shaft1}" y="72" width="6" height="${floor89 - 72}" fill="${mixHex(K.stoneShade, K.violet, 0.3)}"/>`;
  // The 店員小哥's 89F branch: a little counter with its striped awning, a coffee machine, 「歡迎光臨」
  let stripes = '';
  for (let i = 0, x = 96; x < 176; x += 10, i++) stripes += `<path d="M${x} 178h10v12q-5 4 -10 0z" fill="${i % 2 ? K.shirt : K.lineRed}"/>`;
  const branch = depth(ctx, 2, `<rect x="98" y="190" width="76" height="40" fill="${ref(ctx, 'window')}"/>` + stripes
    + `<rect x="94" y="174" width="84" height="5" fill="${K.lineRedDeep}"/>`, `<rect x="94" y="174" width="84" height="56"/>`)
    + softEllipse(ctx, 136, 210, 44, 24, 'lamp', 0.22, 'blur8')
    + `<rect x="152" y="200" width="14" height="22" rx="2" fill="${K.steelDeep}"/><circle cx="159" cy="206" r="2" fill="${C.lampHot}"/>`
    + clerk(ctx, 124, 232)
    + depth(ctx, 3, `<rect x="94" y="230" width="84" height="32" fill="${K.lineRedDeep}"/><rect x="92" y="226" width="88" height="6" rx="1.4" fill="${K.shirt}"/>`
      + `<path d="M93 226.8H179" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<rect x="92" y="226" width="88" height="36"/>`)
    + serif(136, 251, 8, C.washi, '歡迎光臨', ' letter-spacing="2"');
  // The gift shop: the shelf (Mocha's, its top at y 180) with souvenir 101s and plush, the hat case
  const shelf = depth(ctx, 3, `<rect x="262" y="180" width="64" height="7" rx="1.4" fill="${ref(ctx, 'woodG')}"/><path d="M268 187l6 10M320 187l-6 10" stroke="${K.woodDeep}" stroke-width="2"/>`
    + `<path d="M263 180.8H325" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<rect x="262" y="180" width="64" height="17"/>`)
    + souvenir101(ctx, 272, 180, 34) + souvenir101(ctx, 316, 180, 26);
  const hats: [number, number, string][] = [[334, 168, K.lineRed], [356, 168, K.teal], [334, 194, K.peach], [356, 194, K.violetLight]];
  const hatCase = depth(ctx, 3, `<rect x="322" y="146" width="48" height="62" rx="3" fill="${mixHex(K.lacquer, K.violet, 0.3)}"/>`
    + `<rect x="325" y="149" width="42" height="56" rx="2" fill="${K.tealLit}" opacity=".35"/>`
    + `<path d="M325 178H367" stroke="${K.steelLight}" stroke-width="1.4"/>`
    + hats.map(([x, y, c]) => `<path d="M${x - 8} ${y}q0 -9 8 -9q8 0 8 9zM${x - 10} ${y - 1}h20v2h-20z" fill="${c}"/>`).join('')
    + `<path d="M330 205L348 149H354L336 205Z" fill="${C.glassine}" opacity=".2"/>`
    + `<rect x="318" y="208" width="56" height="54" fill="${ref(ctx, 'woodG')}"/><path d="M319 208.8H373" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<rect x="318" y="146" width="56" height="116"/>`)
    + softEllipse(ctx, 346, 176, 30, 30, 'lamp', 0.16, 'blur8');
  // The 89F floor's cut slab (hatched, a section through the building) across the page but the shaft
  let hatch = '';
  for (let x = -20; x < 420; x += 7) if (x < shaft0 - 4 || x > shaft1) hatch += `M${x} ${slab}l7 -${slab - floor89}`;
  const cut = `<rect x="-20" y="${floor89}" width="${shaft0 + 20}" height="${slab - floor89}" fill="${K.graniteDeep}"/><rect x="${shaft1}" y="${floor89}" width="${420 - shaft1}" height="${slab - floor89}" fill="${K.graniteDeep}"/>`
    + `<path d="${hatch}" stroke="${K.granite}" stroke-width="1" opacity=".6"/>`
    + `<path d="M-20 ${floor89}H${shaft0}M${shaft1} ${floor89}H410" stroke="${K.stone}" stroke-width="2.4"/>`;
  // The floors in between, compressed: thin slabs with their lit windows, a break mark
  let mids = '';
  let litW = '';
  const r = seeded(203);
  for (let y = slab + 12; y < GUTTER_Y - 2; y += 13) {
    mids += `M-20 ${y}H${shaft0}M${shaft1} ${y}H410`;
    for (let x = -10; x < 400; x += 9) if ((x < shaft0 - 8 || x > shaft1 + 2) && r() < 0.18) litW += `M${x} ${y - 9}h5v6h-5Z`;
  }
  const middle = `<rect x="-20" y="${slab}" width="${PAGE_W + 40}" height="${GUTTER_Y - slab}" fill="${mixHex(K.violetDeep, K.lacquer, 0.4)}"/>`
    + `<path d="${litW}" fill="${C.lamp}" opacity=".55"/><path d="${mids}" stroke="${K.lacquerLight}" stroke-width="2"/>`
    + `<path d="M-20 ${slab + 34}l30 -8l30 8l30 -8l30 8l30 -8M250 ${slab + 34}l30 -8l30 8l30 -8l30 8l30 -8" stroke="${C.chalk}" stroke-width="1.2" fill="none" opacity=".4"/>`
    + serif(60, 352, 7, C.chalk, '6F … 88F', ' opacity=".55" letter-spacing="1"');
  // The shaft: dark, guide rails, cables; 「37秒」 printed up its wall; its doors at 89F
  const shaft = `<rect x="${shaft0}" y="72" width="${shaft1 - shaft0}" height="${GUTTER_Y - 72}" fill="${K.violetDeep}"/>`
    + `<path d="M${shaft0 + 5} 72V${GUTTER_Y}M${shaft1 - 5} 72V${GUTTER_Y}" stroke="${K.steelDeep}" stroke-width="3"/>`
    + `<path d="M${shaft0 + 22} 72V${GUTTER_Y}M${shaft0 + 30} 72V${GUTTER_Y}M${shaft0 + 38} 72V${GUTTER_Y}" stroke="${K.steel}" stroke-width=".8" opacity=".5"/>`
    + `<text data-art-text="" x="${shaft1 - 12}" y="296" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="11" fill="${C.chalk}" opacity=".7" writing-mode="tb" letter-spacing="3">37秒</text>`
    + `<path d="M${shaft0 + 8} 330V290M${shaft0 + 4} 296l4 -8l4 8" stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
  const doors89 = depth(ctx, 2, `<path d="M${shaft0 - 6} ${floor89}V160H${shaft1 + 6}V${floor89}H${shaft1}V166H${shaft0}V${floor89}Z" fill="${ref(ctx, 'steelH')}"/>`, `<path d="M${shaft0 - 6} 160H${shaft1 + 6}V${floor89}H${shaft0 - 6}Z"/>`)
    // The dial's bezel over the door (the dial turns in it) and its pointer
    + depth(ctx, 3, `<circle cx="210" cy="148" r="27" fill="${K.lacquer}"/><circle cx="210" cy="148" r="25" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="2.4"/>`, `<circle cx="210" cy="148" r="27"/>`)
    + `<path d="M210 126l-4 -7h8z" fill="${K.lineRed}"/>`;
  // 5F: the floor page is the ticket hall's marble; the shaft comes down to its doors
  let tiles = '';
  for (let y = GUTTER_Y + 12, row = 0; y < FLOOR_BOTTOM; y += 14 + row * 2, row++) tiles += `M-60 ${y}H460`;
  for (let x = -120; x < 520; x += 40) tiles += `M${x} ${FLOOR_BOTTOM}L${f1(195 + (x - 195) * 0.75)} ${GUTTER_Y}`;
  const hall = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${ref(ctx, 'stoneG')}"/>`
    + `<path d="${tiles}" stroke="${K.stoneShade}" stroke-width="1" opacity=".55"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="22" fill="${C.shadow}" opacity=".25"/>`
    + pools(ctx, [[120, 470, 90, 22], [210, 500, 80, 22], [330, 520, 150, 34, 'dawn']])
    + `<path d="M190 ${GUTTER_Y}L120 ${FLOOR_BOTTOM}H300L230 ${GUTTER_Y}Z" fill="${K.peachLight}" opacity=".07"/>`
    // The hall's floor medallion: 101's gold coin inlaid in the marble (laid flat), its rings
    + `<g transform="translate(286 590) scale(1 .36)"><circle r="62" fill="none" stroke="${C.gold}" stroke-width="5"/><circle r="50" fill="${mixHex(K.stone, K.peach, 0.25)}"/>`
    + `<circle r="38" fill="none" stroke="${C.gold}" stroke-width="2"/><rect x="-14" y="-14" width="28" height="28" fill="none" stroke="${C.gold}" stroke-width="3"/>`
    + [0, 90, 180, 270].map((a) => `<path d="M0 -50V-40" stroke="${C.gold}" stroke-width="3" transform="rotate(${a})"/>`).join('') + `</g>`
    // The portal's reflection in the polished floor
    + `<rect x="${shaft0 - 6}" y="500" width="${shaft1 - shaft0 + 12}" height="60" fill="${K.steelLight}" opacity=".12"/>`);
  // The shaft's 5F doors: a steel portal standing on the hall's floor, the 5F plate, the car's track
  const portal = depth(ctx, 3, `<path d="M${shaft0 - 8} ${floor5 + 4}V368H${shaft1 + 8}V${floor5 + 4}H${shaft1}V376H${shaft0}V${floor5 + 4}Z" fill="${ref(ctx, 'steelH')}"/>`, `<path d="M${shaft0 - 8} 368H${shaft1 + 8}V${floor5 + 4}H${shaft0 - 8}Z"/>`)
    + `<rect x="${shaft0}" y="376" width="${shaft1 - shaft0}" height="${floor5 - 376}" fill="${K.violetDeep}"/>`
    + `<path d="M${shaft0 + 5} 376V${floor5}M${shaft1 - 5} 376V${floor5}" stroke="${K.steelDeep}" stroke-width="3"/>`
    + depth(ctx, 2, `<rect x="${shaft1 + 12}" y="372" width="28" height="18" rx="3" fill="${K.lacquer}"/>`, `<rect x="${shaft1 + 12}" y="372" width="28" height="18"/>`)
    + serif(shaft1 + 26, 385, 10, C.lampHot, '5F');
  // The ticket counter (Mocha's `counter`, its top at (120, 410)), its sign; the queue's stanchions
  const counter = depth(ctx, 3, `<rect x="76" y="414" width="90" height="68" fill="${ref(ctx, 'lacquerG')}"/><rect x="72" y="408" width="98" height="8" rx="2" fill="${K.stone}"/>`
    + `<path d="M76 446H166" stroke="${ref(ctx, 'foil')}" stroke-width="2"/><path d="M73 408.8H169" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<rect x="72" y="408" width="98" height="74"/>`)
    + serif(121, 470, 9, C.washi, '觀景台售票', ' letter-spacing="2"')
    + depth(ctx, 3, [24, 56].map((x) => `<rect x="${x - 2}" y="440" width="4" height="44" fill="${ref(ctx, 'steelH')}"/><ellipse cx="${x}" cy="484" rx="7" ry="2.4" fill="${K.steelDeep}"/><circle cx="${x}" cy="440" r="3" fill="${K.steelLight}"/>`).join('')
      + `<path d="M24 444Q40 456 56 444" stroke="${K.lineRed}" stroke-width="3" fill="none"/>`, `<rect x="16" y="436" width="48" height="50"/>`);
  return t101Defs(ctx) + standingPage(ctx, ceiling + westGlass + eastGlass + walls + middle + shaft + cut + branch + hatCase + shelf + doors89)
    + hall + portal + counter + bookCues(ctx) + block();
};
// ——— 10-3 「八節」 ———

/** 10-3's tower: its centre line; each section's top lip (the ledges' feet lines) and widths. */
const T3 = { cx: 210, wTop: 150, wBot: 112 } as const;
/** The eight sections from the bottom: [top lip, bottom, scale] (the upper five foreshortened, looking up). */
const SECTIONS3: readonly (readonly [number, number, number])[] = [
  [430, 486, 1], [374, 430, 1], [318, 374, 1], [262, 318, 1], [216, 262, 0.94], [176, 216, 0.88], [142, 176, 0.82], [113, 142, 0.76],
];

/** The city far below the podium's roof (the basin at dawn, seen down past the terrace's edge). */
function cityBelow(ctx: KitCtx, y0: number, y1: number, seed: number): string {
  const r = seeded(seed);
  let blocks = '';
  let lights = '';
  for (let y = y0 + 6; y < y1 + 20; y += 9 + (y - y0) * 0.12) {
    for (let x = FLOOR_RECT.x; x < FLOOR_RECT.x + FLOOR_RECT.w; x += 8 + r() * 14) {
      const w = 5 + r() * 9;
      blocks += `M${f1(x)} ${f1(y)}h${f1(w)}v${f1(4 + (y - y0) * 0.05)}h${f1(-w)}Z`;
      if (r() < 0.25) lights += `M${f1(x + w * 0.4)} ${f1(y + 1)}h1.6v1.6h-1.6Z`;
    }
  }
  return `<rect x="${FLOOR_RECT.x}" y="${y0}" width="${FLOOR_RECT.w}" height="${y1 - y0}" fill="${K.cityMid}"/>`
    + `<path d="${blocks}" fill="${K.cityFar}" opacity=".55"/><path d="${lights}" fill="${C.lamp}" opacity=".7"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${y0}" width="${FLOOR_RECT.w}" height="${y1 - y0}" fill="${ref(ctx, 'mistV')}"/>`;
}

/**
 * 10-3: up the outside of 101 at dawn, from the podium's roof (floor 26), its eight sections rising
 * over the terrace (proof B). The bottom three are the puzzle's: their lips are the ledges (L 430,
 * M 374, T 318), the bottom and top sections' medallions (parts at (210, 430), (210, 318)) and the
 * middle's crank on the window-washer's drive out on the left (a part at (66, 374)), its shaft into the
 * middle section. The upper five sections recede looking up, then the crown and the spire off the
 * page's top, vellum cloud wrapping the tower. Mocha's places: the window-washer's gondola hanging
 * from its davit (`beam`, (62, 196)); the rims on the bottom and top sections' right (brackets, their
 * seats at (344, 420) and (344, 300)). The 土地公 in a window of the fourth section (150, 270). Behind:
 * the sky going peach, 象山 and the hills east, 信義's towers low; below the terrace, the city.
 */
const towerSections: BackdropDraw = (ctx) => {
  const glass = ref(ctx, 'tealGlass');
  const sky = dawnSky101(ctx, -20, 0, PAGE_W + 20, GUTTER_Y, { glow: [330, 330, 300, 170], stars: 26, seed: 301 })
    + dawnClouds(ctx, [[70, 70, 150], [330, 110, 160], [40, 200, 100], [360, 240, 120]]);
  const far = eastHills(ctx, -20, PAGE_W + 20, 336, 50, 302) + xinyiSkyline(ctx, -20, PAGE_W + 20, 350, 70, 303, { lit: 0.22 })
    + `<rect x="-20" y="348" width="${PAGE_W + 40}" height="14" fill="${K.cityNear}"/>`;
  // The floor page: the podium's roof terrace (granite), its edge, the city far below
  let pavers = '';
  for (let y = GUTTER_Y + 10, row = 0; y < 540; y += 12 + row * 1.5, row++) pavers += `M-60 ${f1(y)}H460`;
  for (let x = -100; x < 500; x += 36) pavers += `M${x} 540L${f1(195 + (x - 195) * 0.8)} ${GUTTER_Y}`;
  const terrace = floorPage(ctx, cityBelow(ctx, 548, FLOOR_BOTTOM + 4, 304)
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${548 - GUTTER_Y}" fill="${ref(ctx, 'graniteG')}"/>`
    + `<path d="${pavers}" stroke="${K.graniteDeep}" stroke-width=".9" opacity=".55"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="20" fill="${C.shadow}" opacity=".25"/>`
    + pools(ctx, [[300, 470, 160, 40, 'dawn'], [90, 500, 110, 26, 'dawn']])
    // The terrace's edge: the podium's cyan-rimmed lip, the glass falling away under it
    + `<rect x="${FLOOR_RECT.x}" y="544" width="${FLOOR_RECT.w}" height="6" fill="${K.tealDeep}"/><path d="M${FLOOR_RECT.x} 544H${FLOOR_RECT.x + FLOOR_RECT.w}" stroke="${K.cyanRim}" stroke-width="2"/>`);
  // The tower: eight flared sections from the terrace up, the crown, the spire off the top
  let art = '';
  let outline = '';
  for (const [top, bot, k] of SECTIONS3) {
    const s = section101(T3.cx, top, bot + 0.6, T3.wTop * k, T3.wBot * k, { floors: 8, glass });
    art += s.art;
    outline += s.outline;
  }
  for (const [top, bot, w] of [[92, 113.4, 70], [72, 92.4, 58], [56, 72.4, 46], [44, 56.4, 32]] as const) {
    const s = section101(T3.cx, top, bot, w, w * 0.92, { floors: 3, glass });
    art += s.art;
    outline += s.outline;
  }
  art += `<path d="M206 44L208.4 -12H211.6L214 44Z" fill="${ref(ctx, 'silver')}"/><path d="M204 30h12M205 18h10" stroke="${K.steelDeep}" stroke-width="1.4"/>`;
  // 如意 on the bottom section's front
  art += ruyi(ctx, T3.cx - 30, 470, 1.1) + ruyi(ctx, T3.cx + 30, 470, 1.1);
  const tower = depth(ctx, 2, art, outline);
  // Vellum cloud wrapping the tower (in front of its upper sections, behind the gondola)
  const wrap = cloudWrap(ctx, 70, 330, 186, 16, 305);
  // The window-washer's davit on the fifth section, its cables, the gondola (Mocha's `beam`, rail top y 196)
  const davit = depth(ctx, 2, `<path d="M162 138V128H58V134H156V138Z" fill="${K.steelDeep}"/><path d="M156 134L132 150" stroke="${K.steelDeep}" stroke-width="3"/><circle cx="62" cy="131" r="4" fill="${K.steel}"/>`, `<path d="M58 128H162V150H58Z"/>`)
    + `<path d="M40 196L58 134M84 196L66 134" stroke="${K.steelDeep}" stroke-width="1.3"/><path d="M41 196L59 134M85 196L67 134" stroke="${K.steelLight}" stroke-width=".5" opacity=".6"/>`;
  const gondola = depth(ctx, 3, `<rect x="30" y="200" width="64" height="26" rx="2" fill="${ref(ctx, 'steelV')}"/><rect x="30" y="196" width="64" height="5" rx="2" fill="${K.steelDeep}"/>`
    + `<path d="M34 206h56M34 214h56" stroke="${K.steelDeep}" stroke-width="1.2" opacity=".7"/><rect x="30" y="222" width="64" height="6" fill="${K.lineRed}"/>`
    + `<path d="M31 196.8H93" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<rect x="30" y="196" width="64" height="32"/>`)
    + serif(62, 219, 6.4, C.washi, '擦窗機', ' letter-spacing="1"');
  // The crank's drive: a shaft from the crank (66, 374) into the middle section, a gear housing
  const drive = depth(ctx, 3, `<rect x="66" y="388" width="78" height="7" rx="2" fill="${ref(ctx, 'steelH')}"/><rect x="134" y="380" width="16" height="24" rx="3" fill="${K.steelDeep}"/>`
    + `<path d="M58 400L66 382L74 400Z" fill="${K.steelDeep}"/><rect x="50" y="400" width="32" height="8" rx="2" fill="${K.steelDeep}"/>`
    + `<path d="M67 388.8H143" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="50" y="380" width="100" height="28"/>`);
  // The rims: brackets off the bottom and top sections' right facets, their seats (Mocha's) at y 420 and 300
  const rim = (seat: number, from: number) => depth(ctx, 3, `<path d="M${276} ${from}L328 ${seat + 8}H362L362 ${seat + 14}H330L282 ${from + 12}Z" fill="${K.bandDeep}"/>`
    + `<rect x="318" y="${seat}" width="52" height="9" rx="4.5" fill="${K.band}"/><path d="M320 ${seat + 1}H368" stroke="${ref(ctx, 'foil')}" stroke-width="1.6"/>`
    + `<circle cx="282" cy="${from + 6}" r="4" fill="${ref(ctx, 'foil')}"/>`, `<path d="M276 ${from}L318 ${seat}H370V${seat + 14}H330L282 ${from + 12}Z"/>`);
  const rims = rim(420, 448) + rim(300, 334);
  return t101Defs(ctx) + standingPage(ctx, sky + far)
    + terrace + tower + wrap + davit + gondola + drive + rims + bookCues(ctx) + block();
};
// ——— 10-4 「阻尼球」 ———

/**
 * 10-4: 101's tuned-mass damper at 88F (a 660-tonne gold sphere of 41 steel plates hung on eight
 * cables from the 92F frame; it steadies the tower in typhoons — 咻咻's kind of wind). The atrium in
 * cross-section at dawn: the tall glass behind (the sky going peach, the city below), the upper
 * floors' gold-railed galleries, the cables' mount — a steel yoke over the centre (Mocha's `mount`,
 * (210, 300)) — and the well under the sphere going down to 87F with its bumper ring and dampers. The
 * near balcony on the left (A1, A2) with its railing post (Mocha's `rail`, (60, 372)); the far balcony
 * on the right (B1) with the damper's plaque (the 土地公 on it, (352, 360)) and the display case (B2,
 * the bead's). The sphere and its cables are the part (`c10/damper`).
 */
const damperAtrium: BackdropDraw = (ctx) => {
  // The tall glass behind the atrium onto the dawn
  const glassView = basinView(ctx, -20, 20, PAGE_W + 20, 330, 401);
  const glass = leaningGlass(ctx, -20, PAGE_W + 20, 20, 330, glassView, 'c10atrium');
  // The upper galleries (89F–91F) round the atrium: dark slabs with gold rails and glass
  const gallery = (x0: number, x1: number, y: number) => depth(ctx, 2, `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="10" fill="${K.lacquer}"/>`
    + `<rect x="${x0}" y="${y - 16}" width="${x1 - x0}" height="16" fill="${K.tealLit}" opacity=".2"/><path d="M${x0} ${y - 16}H${x1}" stroke="${C.gold}" stroke-width="1.6"/>`, `<rect x="${x0}" y="${y - 16}" width="${x1 - x0}" height="26"/>`);
  const galleries = gallery(-20, 74, 110) + gallery(346, 410, 110) + gallery(-20, 90, 210) + gallery(330, 410, 210);
  const ceiling = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="22" fill="${K.lacquer}"/>`
    + [60, 160, 260, 340].map((x) => `<ellipse cx="${x}" cy="20" rx="10" ry="2.6" fill="${C.lampHot}"/>`).join('');
  // The cables' mount: a steel yoke hung from the 92F frame (Mocha's `mount`, its top at y 300)
  const yoke = depth(ctx, 3, `<path d="M150 22V286M270 22V286" stroke="${ref(ctx, 'steelH')}" stroke-width="7"/>`
    + `<path d="M150 60L270 120M270 60L150 120M150 140L270 200M270 140L150 200" stroke="${K.steelDeep}" stroke-width="2.6"/>`
    + `<rect x="140" y="296" width="140" height="16" rx="3" fill="${ref(ctx, 'steelV')}"/><rect x="176" y="286" width="68" height="12" rx="2" fill="${K.steelDeep}"/>`
    + [186, 200, 220, 234].map((x) => `<circle cx="${x}" cy="304" r="2.6" fill="${ref(ctx, 'foil')}"/>`).join('')
    + `<path d="M141 296.8H279" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<path d="M140 22H280V312H140Z"/>`);
  // A plaque high on the far wall: 「阻尼器」, the tonnage
  const sign = depth(ctx, 2, `<rect x="300" y="236" width="80" height="26" rx="3" fill="${K.lacquer}"/><rect x="302" y="238" width="76" height="22" rx="2" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1.2"/>`, `<rect x="300" y="236" width="80" height="26"/>`)
    + serif(340, 254, 10, C.gold, '阻尼器', ' letter-spacing="2"');
  // The floor page: the atrium's well under the sphere (87F far below), its bumper ring and dampers;
  // the balconies' floors either side
  let pistons = '';
  for (const [x, a] of [[150, -28], [178, -12], [242, 12], [270, 28]] as const) pistons += `<path d="M${x} 600l${f1(Math.sin((a * Math.PI) / 180) * 40)} -60" stroke="${K.steelDeep}" stroke-width="7" stroke-linecap="round"/><path d="M${x} 600l${f1(Math.sin((a * Math.PI) / 180) * 22)} -33" stroke="${K.steel}" stroke-width="4" stroke-linecap="round"/>`;
  const well = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${K.lacquer}"/>`
    + `<path d="M118 ${GUTTER_Y}L104 ${FLOOR_BOTTOM}H316L302 ${GUTTER_Y}Z" fill="${K.violetDeep}"/>`
    + `<ellipse cx="210" cy="600" rx="90" ry="22" fill="${K.lacquerLight}"/><ellipse cx="210" cy="600" rx="74" ry="16" fill="${K.violetDeep}"/>`
    + pistons
    + `<ellipse cx="210" cy="540" rx="60" ry="14" fill="none" stroke="${ref(ctx, 'steelH')}" stroke-width="6"/><ellipse cx="210" cy="538" rx="60" ry="14" fill="none" stroke="${K.steelLight}" stroke-width="1" opacity=".6"/>`
    + softEllipse(ctx, 210, 520, 110, 40, 'foil', 0.12, 'blur18')
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="140" height="${FLOOR_RECT.h}" fill="${ref(ctx, 'lacquerG')}"/><rect x="300" y="${GUTTER_Y}" width="160" height="${FLOOR_RECT.h}" fill="${ref(ctx, 'lacquerG')}"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="20" fill="${C.shadow}" opacity=".3"/>`
    + pools(ctx, [[60, 470, 80, 20], [350, 470, 80, 20], [210, 430, 120, 30, 'dawn']]));
  // The near balcony's railing post (Mocha's `rail`, its top at y 372): a gold-capped steel post with glass
  const railPost = depth(ctx, 3, `<rect x="54" y="376" width="12" height="82" fill="${ref(ctx, 'steelH')}"/><rect x="50" y="370" width="20" height="7" rx="3" fill="${C.gold}"/>`
    + `<rect x="66" y="398" width="54" height="56" fill="${K.tealLit}" opacity=".3"/><path d="M66 398H120" stroke="${C.gold}" stroke-width="2"/>`, `<rect x="50" y="370" width="70" height="88"/>`);
  // The far balcony's plaque stand (the 土地公 on it, (352, 360)) and its glass
  const plaque = depth(ctx, 3, `<rect x="330" y="356" width="44" height="30" rx="3" fill="${K.lacquerLight}"/><rect x="333" y="359" width="38" height="24" rx="2" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1"/>`
    + `<circle cx="352" cy="371" r="7" fill="${C.gold}"/><path d="M340 386V440M364 386V440" stroke="${K.steelDeep}" stroke-width="3"/>`, `<rect x="330" y="356" width="44" height="84"/>`)
    + serif(352, 395, 5.4, C.gold, '660 噸', ' letter-spacing="1"');
  return t101Defs(ctx) + standingPage(ctx, glass + ceiling + galleries + sign + yoke)
    + well + railPost + plaque + bookCues(ctx) + block();
};
// ——— 10-5 「咻咻的派對」 ———

/** A paper lantern (士林's red, blown up here) hung at (x, y), `s` × a 20-unit one, its glow if lit. */
function paperLantern(ctx: KitCtx, x: number, y: number, s = 1, lit = true): string {
  const k = (n: number) => f1(n * s);
  const body = `M${f1(x - 10 * s)} ${f1(y)}q0 ${k(-12)} ${k(10)} ${k(-12)}q${k(10)} 0 ${k(10)} ${k(12)}q0 ${k(12)} ${k(-10)} ${k(12)}q${k(-10)} 0 ${k(-10)} ${k(-12)}z`;
  return (lit ? softEllipse(ctx, x, y, 18 * s, 18 * s, 'lamp', 0.3, 'blur8') : '')
    + depth(ctx, 2, `<path d="${body}" fill="${K.lantern}"/><path d="M${f1(x - 6 * s)} ${f1(y - 10 * s)}q${k(-3)} ${k(10)} 0 ${k(20)}M${f1(x + 6 * s)} ${f1(y - 10 * s)}q${k(3)} ${k(10)} 0 ${k(20)}" stroke="${K.lanternDeep}" stroke-width="${k(0.9)}" fill="none"/>`
      + `<rect x="${f1(x - 5 * s)}" y="${f1(y - 14 * s)}" width="${k(10)}" height="${k(3)}" fill="${C.printDark}"/><rect x="${f1(x - 5 * s)}" y="${f1(y + 11 * s)}" width="${k(10)}" height="${k(3)}" fill="${C.printDark}"/>`
      + `<path d="M${x} ${f1(y + 14 * s)}v${k(6)}" stroke="${K.lanternDeep}" stroke-width="${k(1.2)}"/>`, `<path d="${body}"/>`);
}

/** A wrapped present, its foot centre at (x, y), `w` × `h`, with its ribbon and bow. */
function present(ctx: KitCtx, x: number, y: number, w: number, h: number, fill: string, tilt = 0): string {
  const box = `M${f1(x - w / 2)} ${f1(y)}V${f1(y - h)}H${f1(x + w / 2)}V${f1(y)}Z`;
  return `<g transform="rotate(${tilt} ${x} ${y})">` + depth(ctx, 3, `<path d="${box}" fill="${fill}"/><path d="M${x} ${f1(y)}V${f1(y - h)}M${f1(x - w / 2)} ${f1(y - h * 0.55)}H${f1(x + w / 2)}" stroke="${K.ribbon}" stroke-width="3"/>`
    + `<path d="M${x} ${f1(y - h)}q-8 -8 -10 0q2 4 10 0q8 -8 10 0q-2 4 -10 0z" fill="${K.ribbon}"/>`
    + `<path d="M${f1(x - w / 2 + 1)} ${f1(y - h + 0.8)}H${f1(x + w / 2 - 1)}" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<path d="${box}"/>`) + `</g>`;
}

/**
 * 10-5: 101's roof terrace before the dawn, and 咻咻's party — everything on it blown up here over
 * the night: the nursery's pastel bunting (0-1's), 士林's red paper lanterns, a stray balloon, presents
 * in a heap, a hand-lettered 「生日快樂」 banner (the 土地公 on it, (196, 300)). Over the table (the
 * cake turns on it, a part at (284, 456)) 咻咻 hangs in its rain cloud (the creature). The party lamp
 * (Mocha's `lamp`, its lantern's top at (52, 352)) and the stack of presents (Mocha's `gift`, its top at
 * (370, 352)), both wet. Behind: the crown's last setbacks and the spire rising off the page, the
 * parapet, the basin below, the sky lightening to peach behind 象山, grey drizzle round the cloud.
 */
const roofParty: BackdropDraw = (ctx) => {
  const sky = dawnSky101(ctx, -20, 0, PAGE_W + 20, GUTTER_Y, { glow: [340, 300, 280, 160], stars: 18, seed: 501 })
    + dawnClouds(ctx, [[80, 60, 130], [320, 96, 140], [200, 150, 110]]);
  // The rain round 咻咻's cloud: a grey vellum veil and drizzle streaks over the table
  let streaks = '';
  const r = seeded(502);
  for (let i = 0; i < 40; i++) {
    const x = 210 + r() * 160;
    const y = 230 + r() * 120;
    streaks += `M${f1(x)} ${f1(y)}l-3 ${f1(8 + r() * 8)}`;
  }
  const rain = `<ellipse cx="290" cy="270" rx="110" ry="90" fill="${K.cloudShade}" opacity=".22"${blur(ctx, 'blur18')}/>`
    + `<path d="${streaks}" stroke="${K.tear}" stroke-width="1.1" stroke-linecap="round" opacity=".55"/>`;
  const far = eastHills(ctx, -20, PAGE_W + 20, 300, 46, 503) + `<rect x="-20" y="300" width="${PAGE_W + 40}" height="60" fill="${K.cityMid}"/>`
    + xinyiSkyline(ctx, -20, PAGE_W + 20, 312, 26, 504, { lit: 0.3 });
  // The crown's top setbacks and the spire, rising behind on the left, off the page
  const glass = ref(ctx, 'tealGlass');
  let crown = '';
  let crownOutline = '';
  for (const [top, bot, w] of [[180, 290, 96], [120, 180, 74], [70, 120, 54]] as const) {
    const sct = section101(118, top, bot, w, w * 0.94, { floors: 4, glass });
    crown += sct.art;
    crownOutline += sct.outline;
  }
  crown += `<path d="M111 70L115 -10H121L125 70Z" fill="${ref(ctx, 'silver')}"/><path d="M110 40h16M111 20h14" stroke="${K.steelDeep}" stroke-width="1.6"/>`;
  const spire = depth(ctx, 1, crown, crownOutline);
  // The parapet behind the terrace: a cyan-rimmed glass wall
  const parapet = `<rect x="-20" y="318" width="${PAGE_W + 40}" height="42" fill="${K.tealDeep}" opacity=".85"/><rect x="-20" y="318" width="${PAGE_W + 40}" height="42" fill="${K.tealLit}" opacity=".18"/>`
    + `<path d="M-20 318H410" stroke="${K.cyanRim}" stroke-width="2.4"/><path d="${Array.from({ length: 14 }, (_, i) => `M${i * 30} 318V360`).join('')}" stroke="${K.tealDeep}" stroke-width="1.4"/>`;
  // Strung across: the nursery's bunting, the lanterns, the banner (the 土地公 on it)
  const PASTEL = [K.frosting, K.cake, K.candle, K.giftMint, K.giftLilac];
  const strings = bunting(ctx, -6, 214, 160, 238, 20, PASTEL)
    + `<path d="M140 238Q230 262 330 226" stroke="${C.pageEdge}" stroke-width=".8" fill="none" opacity=".7"/>`
    + paperLantern(ctx, 176, 262, 0.9) + paperLantern(ctx, 300, 248, 0.8, false);
  const letters = ['生', '日', '快', '樂'];
  const banner = depth(ctx, 2, letters.map((_, i) => `<path d="M${150 + i * 26} ${284 + (i % 2) * 3}h22l-2 28l-9 -6l-9 6z" fill="${[K.cake, K.frosting, K.cake, K.candle][i]}"/>`).join(''), `<path d="M150 284H252V318H150Z"/>`)
    + `<path d="M140 284Q200 292 262 284" stroke="${C.pageEdge}" stroke-width=".9" fill="none"/>`
    + letters.map((ch, i) => serif(161 + i * 26, 301 + (i % 2) * 3, 12, K.berry, ch)).join('');
  // The floor page: the terrace's wet tiles, puddles holding the sky, the dawn's pool
  let tiles = '';
  for (let y = GUTTER_Y + 10, row = 0; y < FLOOR_BOTTOM; y += 12 + row * 1.6, row++) tiles += `M-60 ${f1(y)}H460`;
  for (let x = -100; x < 500; x += 34) tiles += `M${x} ${FLOOR_BOTTOM}L${f1(195 + (x - 195) * 0.78)} ${GUTTER_Y}`;
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${K.deck}"/>`
    + `<path d="${tiles}" stroke="${K.violetDeep}" stroke-width=".8" opacity=".45"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="20" fill="${C.shadow}" opacity=".25"/>`
    + [[90, 580, 40], [300, 600, 56], [40, 530, 22], [370, 540, 24]].map(([x, y, w]) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${f1(w * 0.22)}" fill="${K.peachLight}" opacity=".25"/>`).join('')
    + pools(ctx, [[52, 470, 70, 18], [176, 440, 60, 16], [290, 560, 160, 40, 'dawn']])
    + `<path d="M${FLOOR_RECT.x} ${GUTTER_Y}L${FLOOR_RECT.x} ${FLOOR_BOTTOM}H${FLOOR_RECT.x + FLOOR_RECT.w}V${GUTTER_Y}Z" fill="${C.glassine}" opacity=".06"/>`);
  // 咻咻's party table (the cake turns on it, (284, 456)): a round table under a frilled pastel cloth
  let frill = '';
  for (let x = 236; x < 332; x += 8) frill += `M${x} 476q4 6 8 0`;
  const table = depth(ctx, 3, `<ellipse cx="284" cy="458" rx="50" ry="14" fill="${K.cake}"/><path d="M234 458V476H334V458Z" fill="${K.cakeShade}"/>`
    + `<path d="${frill}" stroke="${K.frosting}" stroke-width="2.4" fill="none"/><path d="M262 478L258 494M306 478L310 494" stroke="${K.woodDeep}" stroke-width="3"/>`
    + `<ellipse cx="284" cy="456" rx="46" ry="11" fill="${mixHex(K.cake, K.peachLight, 0.4)}"/>`, `<path d="M234 444H334V494H234Z"/>`);
  // The party lamp (Mocha's `lamp`, its lantern's top at y 352): a garden lamp post strung with a paper lantern
  const lamp = depth(ctx, 3, `<rect x="49" y="372" width="6" height="112" fill="${ref(ctx, 'steelH')}"/><rect x="42" y="480" width="20" height="6" rx="2" fill="${K.steelDeep}"/>`
    + `<path d="M40 356H64L60 372H44Z" fill="${ref(ctx, 'window')}"/><path d="M38 352H66V357H38Z" fill="${K.steelDeep}"/>`, `<rect x="38" y="352" width="28" height="134"/>`)
    + softEllipse(ctx, 52, 364, 26, 22, 'lamp', 0.3, 'blur8') + paperLantern(ctx, 70, 396, 0.7);
  // The heap of presents (Mocha's `gift`, its top at y 352), a balloon caught on it (10-1's, blown on)
  const gifts = present(ctx, 370, 486, 46, 50, K.giftLilac) + present(ctx, 366, 436, 38, 40, K.giftMint, -4) + present(ctx, 372, 396, 30, 42, K.frosting, 3)
    + balloon(ctx, 334, 330, 12, C.noteSky, 352, 390);
  return t101Defs(ctx) + standingPage(ctx, sky + far + spire + parapet + rain + strings + banner)
    + floor + table + lamp + gifts + bookCues(ctx) + block();
};
// ——— 10-6 「離天空最近的地方」 (spread) ———

/** 10-6's sun, coming up behind the hills on the right page (in the photo of the first steps). */
const SUN = { x: 300, y: 312, r: 30, horizon: 336 } as const;

/**
 * The sunrise (the book's last dawn; bible § 3.1: the sun is foil): a foil disc clearing the hills,
 * its halo in two blurs, long vellum rays fanning up across the sky, a hot rim where it meets the ridge.
 */
function sunrise(ctx: KitCtx): string {
  const { x, y, r } = SUN;
  let rays = '';
  for (const [a, w] of [[-78, 5], [-58, 7], [-38, 6], [-18, 8], [4, 7], [26, 6], [48, 7], [70, 5]] as const) {
    const t = (a * Math.PI) / 180;
    const [dx, dy] = [Math.sin(t), -Math.cos(t)];
    const len = 420;
    const [px, py] = [Math.cos(t) * w, Math.sin(t) * w];
    rays += `M${f1(x)} ${f1(y)}L${f1(x + dx * len - px)} ${f1(y + dy * len - py)}L${f1(x + dx * len + px)} ${f1(y + dy * len + py)}Z`;
  }
  return `<path d="${rays}" fill="${K.sunGlow}" opacity=".3"${blur(ctx, 'blur8')}/><path d="${rays}" fill="${K.sunCore}" opacity=".12"/>`
    + `<circle cx="${x}" cy="${y}" r="${r * 5}" fill="${ref(ctx, 'sunHalo')}" opacity=".55"/>`
    + `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="${ref(ctx, 'sunHalo')}"/>`
    + `<circle cx="${x}" cy="${y}" r="${r * 1.5}" fill="${K.sunCore}" opacity=".6"${blur(ctx, 'blur18')}/>`
    + `<circle cx="${x}" cy="${y}" r="${r}" fill="${ref(ctx, 'foil')}"/><circle cx="${x}" cy="${y}" r="${r - 3}" fill="${K.sunCore}" opacity=".7"/>`
    + `<circle cx="${x}" cy="${y}" r="${r - 3}" fill="none" stroke="${C.goldLight}" stroke-width="1.4" opacity=".8"/>`
    + `<path d="M${x - r * 0.5} ${y - r * 0.55}q${f1(r * 0.3)} ${f1(-r * 0.3)} ${f1(r * 0.75)} ${f1(-r * 0.3)}" stroke="${C.foilShine}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>`
    + sparkle(ctx, x - r - 10, y - r - 6, 6) + sparkle(ctx, x + r + 14, y - r + 4, 4.5);
}

/** A flock of origami birds flying into the sunrise (chapter 1's pigeons, come to see), each `[x, y, s]`. */
function dawnBirds(list: readonly (readonly [number, number, number])[]): string {
  const bird = 'M-2 0L-14 -9L-4 -4L0 -6L4 -4L14 -9L2 0Z';
  let body = '';
  let tips = '';
  for (const [x, y, k] of list) {
    body += bird.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, a: string, b: string) => `${f1(x + Number(a) * k)} ${f1(y + Number(b) * k)}`);
    tips += `M${f1(x - 14 * k)} ${f1(y - 9 * k)}l${f1(3 * k)} ${f1(2 * k)}M${f1(x + 14 * k)} ${f1(y - 9 * k)}l${f1(-3 * k)} ${f1(2 * k)}`;
  }
  return `<path d="${body}" fill="${K.violetDeep}" opacity=".75"/><path d="${tips}" stroke="${K.peachLight}" stroke-width="1" opacity=".7"/>`;
}

/** The deck's railing from x0 to x1 (its top rail at his chest, `top`; the mid rail; the posts down to `foot`), ending in a capped post. */
function deckRailing(ctx: KitCtx, x0: number, x1: number, top: number, mid: number, foot: number): string {
  let posts = '';
  for (let x = x0; x < x1 - 4; x += 24) posts += `M${f1(x)} ${top}V${foot}`;
  return depth(ctx, 3, `<rect x="${x0}" y="${top + 2}" width="${x1 - x0}" height="${foot - top - 2}" fill="${K.tealLit}" opacity=".2"/>`
    + `<path d="${posts}" stroke="${K.steelDeep}" stroke-width="3"/>`
    + `<path d="M${x0 - 3} ${top}H${x1}" stroke="${K.steelDeep}" stroke-width="5" stroke-linecap="round"/><path d="M${x0 - 3} ${top - 1}H${x1}" stroke="${K.peachLight}" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M${x0} ${mid}H${x1}" stroke="${K.steelDeep}" stroke-width="3.4" stroke-linecap="round"/><path d="M${x0} ${mid - 0.8}H${x1}" stroke="${K.steelLight}" stroke-width="1" stroke-linecap="round" opacity=".8"/>`
    // The rail ends here: a stout end post with a gold cap
    + `<rect x="${x1 - 3}" y="${top - 4}" width="8" height="${foot - top + 4}" rx="2" fill="${ref(ctx, 'steelH')}"/><circle cx="${x1 + 1}" cy="${top - 5}" r="5" fill="${ref(ctx, 'foil')}"/>`,
  `<path d="M${x0 - 3} ${top - 10}H${x1 + 6}V${foot}H${x0 - 3}Z"/>`);
}

/** The coin-operated telescope (Mocha's `scope`, its top at (x, top)), on its pedestal to the deck (`foot`), pointed at the sun. */
function coinTelescope(ctx: KitCtx, x: number, top: number, foot: number): string {
  const head = `M${x - 18} ${top + 4}Q${x - 18} ${top - 2} ${x - 10} ${top - 2}H${x + 12}Q${x + 20} ${top - 2} ${x + 20} ${top + 6}V${top + 22}Q${x + 20} ${top + 28} ${x + 12} ${top + 28}H${x - 10}Q${x - 18} ${top + 28} ${x - 18} ${top + 22}Z`;
  return softEllipse(ctx, x, foot, 22, 4, 'shadow', 0.4)
    + depth(ctx, 3, `<rect x="${x - 5}" y="${top + 28}" width="10" height="${foot - top - 34}" fill="${ref(ctx, 'steelH')}"/><path d="M${x - 16} ${foot}L${x - 8} ${foot - 10}H${x + 8}L${x + 16} ${foot}Z" fill="${K.steelDeep}"/>`
      + `<path d="${head}" fill="${K.teal}"/><path d="M${x - 18} ${top + 10}H${x + 20}" stroke="${K.tealDeep}" stroke-width="1.4"/>`
      + `<rect x="${x + 18}" y="${top + 4}" width="10" height="9" rx="3" fill="${K.tealDeep}"/><rect x="${x + 18}" y="${top + 15}" width="10" height="9" rx="3" fill="${K.tealDeep}"/>`
      + `<circle cx="${x + 28}" cy="${top + 8}" r="3" fill="${K.tealLit}"/><circle cx="${x + 28}" cy="${top + 19}" r="3" fill="${K.tealLit}"/>`
      + `<rect x="${x - 6}" y="${top + 14}" width="12" height="6" rx="1.4" fill="${K.tealDeep}"/><rect x="${x - 3}" y="${top + 16}" width="6" height="1.4" fill="${C.gold}"/>`
      + `<path d="M${x - 16} ${top - 1}H${x + 18}" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/><path d="M${x + 19} ${top + 2}V${top + 24}" stroke="${K.peach}" stroke-width="2" opacity=".6"/>`, `<path d="${head}"/><rect x="${x - 16}" y="${top}" width="46" height="${foot - top}"/>`);
}

/**
 * 10-6, the centrefold (its spine's crease drawn live): 101's outdoor deck at 91F, at first light —
 * the closest place to the sky. Left page: the crown's last setbacks and the silver spire rising
 * off the page (its red light), the deck's glass door from inside (warm, D1), the coin telescope
 * (Mocha's `scope`, (40, 372)) turned to the sunrise, the railing at his chest from the door's side
 * to where it ends — a capped post at x 152 (R1–R2, its top rail at y 408). Right page: the open deck,
 * nothing to hold on to (his three steps), its glass parapet at the far end; the sky from the night's
 * violet to peach to gold, the sun's foil disc clearing 象山 and the 四獸山 with its rays fanning up,
 * gold-lit cloud strips, the basin below waking, 基隆河 a gold ribbon. The sun's path lies across the
 * deck to where he takes his steps (the photo of the first steps is framed on it).
 */
const observationDeck: BackdropDraw = (ctx) => {
  const { horizon } = SUN;
  const sky = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'sky')}"/>`
    + `<ellipse cx="${SUN.x}" cy="${horizon}" rx="360" ry="200" fill="${ref(ctx, 'dawnGlow')}"/>`
    + `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${horizon + 4}" fill="${ref(ctx, 'sunrise')}"/>`
    + pinholes(ctx, 0, 0, 120, 120, 10, 601);
  const clouds = dawnClouds(ctx, [[110, 70, 170], [320, 118, 170], [60, 180, 120], [240, 200, 140], [360, 262, 90], [210, 268, 110], [380, 196, 120]], 0.9)
    + dawnBirds([[240, 150, 0.7], [262, 140, 0.55], [276, 158, 0.6], [220, 166, 0.45]]);
  const sun = sunrise(ctx);
  const hills = eastHills(ctx, -20, PAGE_W + 20, horizon + 4, 22, 602)
    + `<path d="M${SUN.x - 70} ${horizon - 2}Q${SUN.x} ${horizon - 12} ${SUN.x + 70} ${horizon - 2}" stroke="${K.sunGlow}" stroke-width="2.4" fill="none" opacity=".75"/>`;
  // The basin below waking: the city, 基隆河 a gold ribbon catching the sun
  const basin = `<rect x="-20" y="${horizon + 4}" width="${PAGE_W + 40}" height="${GUTTER_Y - horizon}" fill="${K.cityMid}"/>`
    + xinyiSkyline(ctx, -20, PAGE_W + 20, horizon + 16, 16, 603, { lit: 0.12 })
    + `<path d="M-20 ${horizon + 14}Q120 ${horizon + 8} 220 ${horizon + 13}T410 ${horizon + 10}" stroke="${K.sunGlow}" stroke-width="2" fill="none" opacity=".75"/>`
    + `<rect x="-20" y="${horizon + 4}" width="${PAGE_W + 40}" height="${GUTTER_Y - horizon - 4}" fill="${ref(ctx, 'cityHaze')}"/>`;
  // The crown's setbacks and the spire, rising off the page on the left; the deck's door into it
  const glass = ref(ctx, 'tealGlass');
  let crown = '';
  let crownOutline = '';
  for (const [top, bot, w] of [[150, 360, 116], [90, 150, 86], [40, 90, 62]] as const) {
    const s = section101(60, top, bot, w, w * 0.96, { floors: 5, glass });
    crown += s.art;
    crownOutline += s.outline;
  }
  crown += `<path d="M55 40L58 -12H62L65 40Z" fill="${ref(ctx, 'silver')}"/><path d="M53 22h14M54 8h12" stroke="${K.steelDeep}" stroke-width="1.6"/>`;
  // The crown's right edges face the sun: a gold rim of light down each
  const sunEdge = [[150, 360, 116], [90, 150, 86], [40, 90, 62]].map(([top, bot, w]) => `M${f1(60 + w / 2)} ${top}L${f1(60 + (w * 0.96) / 2)} ${bot}`).join('');
  const tower = depth(ctx, 2, crown, crownOutline)
    + `<path d="${sunEdge}" stroke="${K.sunGlow}" stroke-width="2.4" opacity=".85"/>`
    + softEllipse(ctx, 60, 0, 8, 8, 'lamp', 0.4) + `<circle cx="60" cy="2" r="2.4" fill="${C.neonPink}"/>`;
  const door = depth(ctx, 2, `<rect x="-6" y="250" width="44" height="110" fill="${ref(ctx, 'window')}"/><path d="M16 250V360" stroke="${K.steelDeep}" stroke-width="2"/>`
    + `<rect x="-6" y="250" width="44" height="110" fill="none" stroke="${K.steelDeep}" stroke-width="4"/>`, `<rect x="-8" y="248" width="48" height="114"/>`)
    + softEllipse(ctx, 18, 330, 40, 40, 'lamp', 0.22, 'blur8');
  // The far end's glass parapet (the deck ends: past it, only sky)
  const parapet = `<rect x="170" y="${GUTTER_Y - 30}" width="240" height="30" fill="${K.tealLit}" opacity=".18"/>`
    + `<path d="M170 ${GUTTER_Y - 30}H410" stroke="${K.cyanRim}" stroke-width="2"/><path d="${Array.from({ length: 9 }, (_, i) => `M${176 + i * 28} ${GUTTER_Y - 30}V${GUTTER_Y}`).join('')}" stroke="${K.steel}" stroke-width="1" opacity=".6"/>`;
  // The floor page: the deck's pale tiles, the sun's path laid across them to his steps, soft pools
  let tiles = '';
  for (let y = GUTTER_Y + 10, row = 0; y < FLOOR_BOTTOM; y += 12 + row * 1.6, row++) tiles += `M-60 ${f1(y)}H460`;
  for (let x = -100; x < 500; x += 34) tiles += `M${x} ${FLOOR_BOTTOM}L${f1(195 + (x - 195) * 0.78)} ${GUTTER_Y}`;
  const deck = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(K.deckLight, K.peach, 0.32)}"/>`
    + `<path d="${tiles}" stroke="${K.violet}" stroke-width=".8" opacity=".3"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="18" fill="${C.shadow}" opacity=".2"/>`
    // The sun's path: a long gold wedge from under the sun to the front, brightest where he walks
    + `<path d="M${SUN.x - 20} ${GUTTER_Y}L${SUN.x - 150} ${FLOOR_BOTTOM}H${SUN.x + 120}L${SUN.x + 24} ${GUTTER_Y}Z" fill="${K.sunGlow}" opacity=".4"${blur(ctx, 'blur8')}/>`
    + pools(ctx, [[18, 470, 60, 18], [270, 488, 150, 40, 'dawn'], [300, 560, 180, 50, 'dawn'], [300, 600, 120, 30, 'dawn']])
    + `<path d="M${FLOOR_RECT.x} ${GUTTER_Y + 20}H${FLOOR_RECT.x + FLOOR_RECT.w}" stroke="${K.peachLight}" stroke-width="1" opacity=".4"/>`);
  // The railing at his chest from the door's side to its end (R1–R2: feet line 456, top rail 408)
  const rail = deckRailing(ctx, 54, 154, 408, 432, 458);
  const scope = coinTelescope(ctx, 40, 372, 470);
  return t101Defs(ctx) + standingPage(ctx, sky + sun + clouds + hills + basin + parapet + tower + door)
    + deck + rail + scope + bookCues(ctx) + block();
};

export const C10_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'c10/xinyi-line': screen(xinyiLine),
  'c10/elevator': screen(elevatorPage),
  'c10/tower-sections': screen(towerSections),
  'c10/damper': screen(damperAtrium),
  'c10/roof-party': screen(roofParty),
  'c10/observation-deck': screen(observationDeck),
};

// ——— Parts ———

/** A paper balloon on its string, tied to (sx, sy). */
function balloon(ctx: KitCtx, x: number, y: number, r: number, fill: string, sx: number, sy: number): string {
  const body = `M${f1(x)} ${f1(y - r)}C${f1(x + r * 1.1)} ${f1(y - r)} ${f1(x + r)} ${f1(y + r * 0.7)} ${f1(x)} ${f1(y + r)}C${f1(x - r)} ${f1(y + r * 0.7)} ${f1(x - r * 1.1)} ${f1(y - r)} ${f1(x)} ${f1(y - r)}Z`;
  return `<path d="M${f1(x)} ${f1(y + r)}Q${f1((x + sx) / 2 + 4)} ${f1((y + r + sy) / 2)} ${f1(sx)} ${f1(sy)}" stroke="${C.printDark}" stroke-width=".9" fill="none" opacity=".7"/>`
    + depth(ctx, 2, `<path d="${body}" fill="${fill}"/><path d="M${f1(x - r * 0.45)} ${f1(y - r * 0.4)}q${f1(r * 0.2)} ${f1(-r * 0.35)} ${f1(r * 0.5)} ${f1(-r * 0.4)}" stroke="${C.chalk}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>`
      + `<path d="M${f1(x - 2)} ${f1(y + r + 2)}l2 -3l2 3z" fill="${fill}"/>`, `<path d="${body}"/>`);
}

const BALLOONS: readonly (readonly [number, number, number, string])[] = [
  [-14, -14, 13, C.hatRed], [12, -20, 12, C.ochre], [0, 6, 14, C.noteSky], [-20, 12, 11, C.notePink], [18, 8, 11, C.noteMint],
];
/** The bunch against the front window (local units: the window spans x −34…32, y −152…−14). */
const BUNCH: readonly (readonly [number, number, number, string])[] = [
  [-16, -126, 17, C.noteSky], [14, -132, 18, C.hatRed], [-20, -92, 18, C.ochre], [16, -96, 17, C.noteMint],
  [-2, -112, 16, C.notePink], [-14, -58, 16, C.hatRed], [14, -62, 16, C.noteSky], [0, -80, 15, K.giftLilac],
];

/**
 * 10-1's birthday balloons (a `blowable`): `down`, a bunch bobbing against the train's front window,
 * their strings tied to the sill's rail; `up`, blown to the ceiling over the window, the strings
 * hanging down and the window clear (101 straight ahead).
 */
const balloons: PartSource = {
  preset: 'blowable',
  states: ['down', 'up'],
  box: { x: -46, y: -206, w: 92, h: 220 },
  draw(ctx, state) {
    if (state === 'up') {
      // Bunched under the ceiling over the window, strings dangling to the window's top; a chalk whoosh
      return BALLOONS.map(([x, y, r, fill]) => balloon(ctx, x * 1.3, y * 0.55 - 176, r * 1.05, fill, x * 0.5, -150)).join('')
        + `<path d="M-40 -136q8 -10 20 -8M22 -140q12 -6 20 4" stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/>`;
    }
    // Bobbing against the window, covering it, their strings tied to the sill's rail
    return BUNCH.map(([x, y, r, fill]) => balloon(ctx, x, y, r, fill, x * 0.15, -8)).join('')
      + `<path d="M-8 -8h16" stroke="${C.printDark}" stroke-width="1.6" stroke-linecap="round"/>`;
  },
};

/** The damper's stops, as offsets of the sphere's centre from the part's hit centre (its node rides on top). */
const SWING: Readonly<Record<string, readonly [number, number]>> = { left: [-80, 26], centre: [-20, 46], right: [40, 26] };
/** The cables' mount over the atrium's centre (the sphere hangs from it). */
const MOUNT: readonly [number, number] = [-20, -170];

/**
 * 10-4's tuned-mass damper (a `blowable` pendulum): the great gold sphere — gold foil, its 41 steel
 * plates as bands, the darker equator, a lit crown — hanging on eight cables (four pairs) from the
 * yoke over the centre, swung to the near balcony, hanging at the centre, or out to the far side; a
 * chalk swish behind it when it has swung out.
 */
const damper: PartSource = {
  preset: 'blowable',
  states: ['left', 'centre', 'right'],
  box: { x: -140, y: -184, w: 236, h: 290 },
  draw(ctx, state) {
    const [x, y] = SWING[state] ?? SWING.centre;
    // Its top is where he and Mocha ride (the node S, 44 above its centre)
    const r = 44;
    const clip = ctx.id(`damper${state}`);
    let cables = '';
    for (const dx of [-16, -11, -5, -1, 1, 5, 11, 16]) cables += `M${f1(MOUNT[0] + dx * 0.9)} ${MOUNT[1]}L${f1(x + dx * 0.9)} ${f1(y - r + 6)}`;
    let plates = '';
    for (let i = -9; i <= 9; i++) plates += `M${f1(x - r)} ${f1(y + i * 4.8)}H${f1(x + r)}`;
    const ball = `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}"/>`;
    const swish = state === 'centre' ? '' : `<path d="M${f1(x - Math.sign(x + 20) * 40)} ${f1(y - 20)}q${f1(-Math.sign(x + 20) * 10)} 20 0 40" stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>`;
    return softEllipse(ctx, x, y + r + 8, 42, 8, 'shadow', 0.2, 'blur8')
      + `<path d="${cables}" stroke="${K.steelDeep}" stroke-width="2.4"/><path d="${cables}" stroke="${K.steelLight}" stroke-width=".8" opacity=".7"/>`
      + depth(ctx, 3, `<clipPath id="${clip}">${ball}</clipPath><circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${ref(ctx, 'foil')}"/>`
        + `<g clip-path="url(#${clip})"><path d="${plates}" stroke="${C.goldDeep}" stroke-width=".8" opacity=".55"/>`
        + `<rect x="${f1(x - r)}" y="${f1(y - 2)}" width="${2 * r}" height="6" fill="${C.goldDeep}" opacity=".7"/>`
        + `<circle cx="${f1(x + r * 0.5)}" cy="${f1(y + r * 0.4)}" r="${r}" fill="${C.goldDeep}" opacity=".25"/></g>`
        + `<rect x="${f1(x - 12)}" y="${f1(y - r - 2)}" width="24" height="8" rx="2" fill="${K.steelDeep}"/>`
        + `<path d="M${f1(x - r * 0.62)} ${f1(y - r * 0.42)}q${f1(r * 0.26)} ${f1(-r * 0.42)} ${f1(r * 0.66)} ${f1(-r * 0.48)}" stroke="${C.foilShine}" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>`, ball)
      + swish;
  },
};

/**
 * 10-1's door between the cars (a `gate`: 嗶！ opens it, and it stays open), drawn at its hit
 * centre (144, 438), its foot on the floor (local y 48), in the gangway's frame (local x ±26, top at
 * local −142): closed, a stainless sliding door with its tall window onto the next car and a pull
 * handle; open, slid into its pocket (only its edge shows), a chalk 「嗶」.
 */
const carDoor: PartSource = {
  preset: 'gate',
  states: ['closed', 'open'],
  box: { x: -40, y: -150, w: 80, h: 204 },
  draw(ctx, state) {
    if (state === 'open') {
      return t101Defs(ctx) + depth(ctx, 2, `<rect x="-26" y="-142" width="8" height="190" fill="${ref(ctx, 'steelH')}"/><path d="M-19 -140V46" stroke="${K.steelDeep}" stroke-width="1.4"/>`, `<rect x="-26" y="-142" width="8" height="190"/>`)
        + `<path d="M12 -60q8 6 0 14M18 -66q12 10 0 26" stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/>`
        + serif(4, -70, 10, C.chalk, '嗶');
    }
    const door = 'M-26 48V-142H26V48Z';
    return t101Defs(ctx) + depth(ctx, 2, `<path d="${door}" fill="${ref(ctx, 'steelH')}"/>`
      + `<rect x="-18" y="-126" width="36" height="78" rx="5" fill="${mixHex(K.carWall, K.violet, 0.25)}"/>`
      + `<rect x="-14" y="-104" width="28" height="42" rx="4" fill="${K.peachLight}" opacity=".55"/>`
      + `<path d="M-12 -50L4 -124H12L-4 -50Z" fill="${C.glassine}" opacity=".25"/>`
      + `<rect x="-18" y="-126" width="36" height="78" rx="5" fill="none" stroke="${K.steelDeep}" stroke-width="2.4"/>`
      + `<rect x="14" y="-26" width="5" height="26" rx="2.4" fill="${K.steelDeep}"/>`
      + `<rect x="-26" y="28" width="52" height="20" fill="${mixHex(K.steelDeep, C.shadow, 0.2)}"/>`
      + `<path d="M-25 -141V47" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<path d="${door}"/>`);
  },
};


// 10-2's car, panel, altitude dial and the 清潔阿伯

/**
 * 101's express car (a `lift`, `5F` / `89F`; drawn at its riding node `E`, its floor at the origin):
 * a cut-away cabin in dark lacquer with gold trim, its ceiling pricked with little lights like a
 * night sky (101's cars have one), a handrail, the doors folded back at its sides. The panel
 * (`c10/elevator-panel`) rides it separately, on its right wall.
 */
const elevatorCar: PartSource = {
  preset: 'lift',
  states: ['5F', '89F'],
  box: { x: -36, y: -100, w: 72, h: 114 },
  draw(ctx) {
    const cabin = 'M-30 6V-90h60V6Z';
    const r = seeded(204);
    let stars = '';
    for (let i = 0; i < 16; i++) stars += `<circle cx="${f1(-22 + r() * 44)}" cy="${f1(-82 + r() * 10)}" r="${f1(0.6 + r() * 0.6)}" fill="${C.pinhole}"/>`;
    return t101Defs(ctx) + depth(ctx, 3, `<path d="${cabin}" fill="${K.lacquer}"/><rect x="-26" y="-86" width="52" height="86" fill="${mixHex(K.lacquerLight, K.violetLight, 0.45)}"/>`
      + `<rect x="-26" y="-86" width="52" height="14" fill="${K.violetDeep}"/>` + stars
      + `<rect x="-20" y="-66" width="40" height="50" rx="3" fill="${ref(ctx, 'window')}" opacity=".35"/>`
      + `<rect x="-30" y="-96" width="60" height="8" rx="2" fill="${K.lacquer}"/><path d="M-30 -88H30" stroke="${ref(ctx, 'foil')}" stroke-width="1.6"/>`
      + `<path d="M-24 -36H20" stroke="${ref(ctx, 'foil')}" stroke-width="2.2" stroke-linecap="round"/><rect x="-30" y="0" width="60" height="8" fill="${K.steelDeep}"/><path d="M-30 0H30" stroke="${ref(ctx, 'foil')}" stroke-width="1.6"/>`
      + `<path d="M-30 -90V6M30 -90V6" stroke="${ref(ctx, 'foil')}" stroke-width="3"/><path d="M-26 -60L-4 -86H4L-18 -60Z" fill="${C.glassine}" opacity=".1"/>`, `<path d="${cabin}"/>`)
      + softEllipse(ctx, 0, -78, 24, 7, 'lamp', 0.22);
  },
};

/**
 * The car's panel (a weight `button` Mocha sits on; it rides the car): a brass-framed plate with
 * the two floors' buttons, 89 and 5; pressed (`down`), the other floor's lights. Mocha sits on its
 * top (local y 0, the hit centre).
 */
const elevatorPanel: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -16, y: -4, w: 32, h: 46 },
  draw(ctx, state) {
    const down = state === 'down';
    const btn = (y: number, n: string, on: boolean) => `<circle cx="0" cy="${y}" r="5.6" fill="${on ? C.lampHot : K.lacquer}" stroke="${ref(ctx, 'foil')}" stroke-width="1"/>`
      + `<text data-art-text="" x="0" y="${y + 2.4}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="6.4" fill="${on ? K.lacquer : K.steelLight}">${n}</text>`;
    return t101Defs(ctx) + depth(ctx, 3, `<rect x="-10" y="0" width="20" height="36" rx="3" fill="${K.lacquerLight}"/><rect x="-11" y="-1" width="22" height="4" rx="2" fill="${ref(ctx, 'foil')}"/>`, `<rect x="-11" y="-1" width="22" height="37"/>`)
      + btn(12, '89', down) + btn(26, '5', false)
      + (down ? softEllipse(ctx, 0, 12, 8, 8, 'lamp', 0.4) : '');
  },
};

/**
 * The altitude dial over the shaft at 89F (a `section` the car turns: `5F` / `89F`), its pivot at the
 * hit centre: a cream gauge in the bezel, 5 at the top and 89 opposite, the floors between counted
 * round both sides (20, 40, 60), so whichever way it turns the numbers run past the red pointer as the
 * car climbs. One drawing; the view turns it half round a state. Printed, never marigold.
 */
const altimeter: PartSource = {
  preset: 'section',
  states: ['5F'],
  pivot: [0, 0],
  box: { x: -26, y: -26, w: 52, h: 52 },
  draw(ctx) {
    const label = (a: number, n: string, big = false) => `<g transform="rotate(${a})"><path d="M0 -21V-17" stroke="${K.violetDeep}" stroke-width="${big ? 1.6 : 1}"/>`
      + `<text data-art-text="" x="0" y="${big ? -8 : -10}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${big ? 9.6 : 5.6}" fill="${big ? K.lineRedDeep : C.printDark}">${n}</text></g>`;
    let ticks = '';
    for (let a = 0; a < 360; a += 15) ticks += `<path d="M0 -21V-19" stroke="${K.violet}" stroke-width=".6" transform="rotate(${a})"/>`;
    return t101Defs(ctx) + depth(ctx, 2, `<circle r="22" fill="${C.washi}"/><circle r="22" fill="none" stroke="${K.violetDeep}" stroke-width="1"/>` + ticks
      + label(0, '5F', true) + label(180, '89F', true) + [45, -45].map((a) => label(a, '20')).join('') + [90, -90].map((a) => label(a, '40')).join('') + [135, -135].map((a) => label(a, '60')).join('')
      + `<circle r="3.4" fill="${K.lacquer}"/>`, '<circle r="22"/>');
  },
};

const cleanerUncle: PartSource = {
  preset: 'carrier',
  states: ['idle', 'carrying', 'back', 'done'],
  box: { x: -60, y: -170, w: 140, h: 176 },
  draw: (ctx, look) => cleanerUncleArt(ctx, look as 'idle'),
};

// 10-3's section medallions and the crank

/**
 * A section of 101 as its medallion (10-3's `low` and `top`: `section`, three turns), its pivot at the
 * hit centre on the section's lip: the section seen from above — its three facets as three sectors
 * (indigo, teal glass, peach), the ledge's notch on the teal (front) one — in a grey-lilac scalloped rim
 * (bible § 6: fixed sections are grey-lilac; it is Mocha who holds it, never a hand). One drawing; the
 * view turns it a third a state, so the teal faces front (down) when the section is in line.
 */
const towerSection: PartSource = {
  preset: 'section',
  states: ['0'],
  pivot: [0, 0],
  box: { x: -26, y: -26, w: 52, h: 52 },
  draw(ctx) {
    const rim = wheelRim(21, 12);
    const sector = (a: number, fill: string) => `<path d="M0 0L0 -16A16 16 0 0 1 13.86 8Z" fill="${fill}" transform="rotate(${a})"/>`;
    // The teal sector centred at 60° (it comes to the bottom, 180°, at the in-line turn, state 1)
    return t101Defs(ctx) + depth(ctx, 2, `<path d="${rim}" fill="${K.band}"/><circle r="17.4" fill="${K.bandDeep}"/>`
      + sector(0, ref(ctx, 'tealGlass')) + sector(120, K.peach) + sector(240, K.indigo)
      + `<path d="M0 -16V0M13.86 8L0 0M-13.86 8L0 0" stroke="${K.cyanRim}" stroke-width="1"/>`
      + `<path d="M11.2 -8.6l3.6 -2.2l1.2 2.4l-3.6 2.2z" fill="${C.washi}" transform="rotate(0)"/>`
      + `<circle r="17.4" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1.2"/>`, `<path d="${rim}"/>`)
      + `<circle r="4" fill="${ref(ctx, 'foil')}"/>`;
  },
};

/**
 * The window-washer's crank on the middle section's drive (10-3's `mid`: a `wheel`, 轉, coupled to
 * both neighbours), its pivot at the hit centre: the marigold knurled rim (its grip) round a steel
 * crank wheel with four spokes and its handle knob. One drawing; the view turns it a third a state.
 */
const sectionCrank: PartSource = {
  preset: 'wheel',
  states: ['0'],
  pivot: [0, 0],
  box: { x: -32, y: -32, w: 64, h: 64 },
  draw(ctx) {
    const r = 26;
    const rim = wheelRim(r, 20);
    const spokes = [0, 90, 180, 270].map((a) => `<path d="M0 -4V-17" transform="rotate(${a})"/>`).join('');
    return t101Defs(ctx) + depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/>`
      + `<circle r="${r - 5}" fill="${K.steelDeep}"/><circle r="${r - 7}" fill="${ref(ctx, 'steelV')}"/>`
      + `<g stroke="${K.steelDeep}" stroke-width="3.4" stroke-linecap="round">${spokes}</g>`
      + `<circle r="${r - 5}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1.4" opacity=".6"/>`
      + `<circle cx="0" cy="-14" r="4.4" fill="${K.lineRed}"/><circle cx="-1" cy="-15" r="1.4" fill="${C.cutRim}" opacity=".7"/>`
      + `<circle r="5" fill="${K.steelDeep}"/>`, `<path d="${rim}"/>`);
  },
};

/**
 * 咻咻's birthday cake on its turntable (10-5's `cake`: a `section`, `0`–`4`: a candle lit at each
 * corner of the table they are led to), its pivot at the hit centre: the cake seen from above — pink
 * frosting piped round, berries, a cream 「1」 — with its four candles, lit one by one (state k: k lit,
 * each flame's glow). A bitmap per state; the view turns it a fifth a state, like a lazy susan.
 */
const cake: PartSource = {
  preset: 'section',
  states: ['0', '1', '2', '3', '4'],
  pivot: [0, 0],
  box: { x: -32, y: -32, w: 64, h: 64 },
  draw(ctx, state) {
    const lit = Number(state);
    let piping = '';
    for (let a = 0; a < 360; a += 30) piping += `<circle cx="${f1(Math.sin((a * Math.PI) / 180) * 19)}" cy="${f1(-Math.cos((a * Math.PI) / 180) * 19)}" r="3.4"/>`;
    const candles = [45, 135, 225, 315].map((a, i) => {
      const [x, y] = [Math.sin((a * Math.PI) / 180) * 12, -Math.cos((a * Math.PI) / 180) * 12];
      const on = i < lit;
      return `<circle cx="${f1(x)}" cy="${f1(y)}" r="3" fill="${K.candle}" stroke="${C.washi}" stroke-width="1"/>`
        + (on ? softEllipse(ctx, x, y, 7, 7, 'lamp', 0.55) + `<circle cx="${f1(x)}" cy="${f1(y)}" r="2" fill="${C.lampHot}"/>` : `<circle cx="${f1(x)}" cy="${f1(y)}" r="1" fill="${C.printDark}"/>`);
    }).join('');
    return t101Defs(ctx) + depth(ctx, 2, `<circle r="26" fill="${C.washi}"/><circle r="26" fill="none" stroke="${K.cakeShade}" stroke-width="1.2"/>`
      + `<circle r="23" fill="${K.cake}"/><g fill="${K.frosting}">${piping}</g><circle r="16" fill="${mixHex(K.cake, K.frosting, 0.25)}"/>`
      + [20, 100, 200, 290].map((a) => `<circle cx="${f1(Math.sin((a * Math.PI) / 180) * 7)}" cy="${f1(-Math.cos((a * Math.PI) / 180) * 7)}" r="2.2" fill="${K.berry}"/>`).join(''), '<circle r="26"/>')
      + candles;
  },
};

export const C10_PARTS: Readonly<Record<string, PartSource>> = {
  'c10/cake': cake,
  'c10/tower-section': towerSection,
  'c10/section-crank': sectionCrank,
  'c10/elevator': elevatorCar,
  'c10/elevator-panel': elevatorPanel,
  'c10/altimeter': altimeter,
  'c10/cleaner-uncle': cleanerUncle,
  'c10/car-door': carDoor,
  'c10/balloons': balloons,
  'c10/damper': damper,
};

