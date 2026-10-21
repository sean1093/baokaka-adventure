import { POPUP as C, POPUP_BEITOU as B, POPUP_MARKET as M, POPUP_STAGE as S, mixHex } from '../../../art/palette';
import { depth, f1, filterAttr, pageBlock, pinholes, ref, seeded, softEllipse, wheelRim, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, VANISHING_POINT, floorWiden } from '../../view/geometry';
import type { BackdropDraw, PartSource } from '../sources';
import { bathUncleArt, grannyFigure } from '../../view/art/beitou';
import { clerk } from './c1';
import { FLOOR_RECT, bakedFlap, bookCues, calmMoon, floorPage, kraftBack, lin, rad, shushuPeek, standingPage } from './common';

/**
 * Chapter 8 (北投, 04:00) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#129) drew placeholders where a preset misleads
 * (D-93 § 7); the chapter's art issue (#130) draws the palette kit, the six backdrops and every part.
 *
 * **The kit** (bible § 6 row 8, `POPUP_BEITOU`): cedar brown and teal water dominant, steam white
 * the accent. The signature materials are **wood-grain card** (`planks`, `woodGrain`: the old
 * bathhouses, the library, the car's benches, the tubs and buckets) and **vellum steam**
 * (`steamPlume`: soft billows rising from every pool and vent, densest low, thinning as they rise;
 * never a hard shadow). The hot-spring lanterns glow warm (`hotLantern`). 北投's hills stand behind in
 * layers with the steam drifting up between them (`beitouHills`), and the trees of 北投公園 crowd the
 * slopes (`treeCrown`). Tiled roofs (`tiledRoof`) over the old houses, the bath's pale mosaic
 * (`mosaic`). **咻咻's beat** (GDD § 4.2, D-93): one plume on 8-2's valley and one off 8-6's urn
 * swirls the wrong way, against all the others, and the little cloud peeks out of it (`wrongSwirl`).
 */

/** The page block under the floor page. */
const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};

type Pt = readonly [number, number];

/** A soft blur for vellum (baked only: the bake draws with filters on). */
const blur = (ctx: KitCtx, name: 'blur3' | 'blur8' = 'blur3') => (ctx.filters ? filterAttr(ctx, name) : '');

// ——— The palette kit ———

/** 北投's gradient defs, shared by the chapter's backdrops and parts. */
export function beitouDefs(ctx: KitCtx): string {
  return `<defs>`
    + lin(ctx, 'cedarG', [[0, B.cedarLight], [1, B.cedarDeep]])
    + lin(ctx, 'cedarH', [[0, B.cedarDeep], [0.3, B.cedar], [0.7, B.cedarLight], [1, B.cedar]], 'h')
    + lin(ctx, 'hinokiG', [[0, B.hinokiLight], [1, B.hinokiDeep]])
    + lin(ctx, 'hinokiH', [[0, B.hinokiDeep], [0.35, B.hinoki], [0.6, B.hinokiLight], [1, B.hinokiDeep]], 'h')
    + lin(ctx, 'poolG', [[0, B.tealLit], [0.18, B.tealLight], [0.6, B.teal], [1, B.tealDeep]])
    + lin(ctx, 'rockG', [[0, B.rockLight], [1, B.rockDeep]])
    + lin(ctx, 'brickG', [[0, B.brick], [1, B.brickDeep]])
    + lin(ctx, 'tileG', [[0, B.tile], [1, B.tileShade]])
    + lin(ctx, 'brassG', [[0, B.brassDeep], [0.3, B.brass], [0.55, mixHex(B.brass, C.cutRim, 0.45)], [1, B.brassDeep]], 'h')
    + lin(ctx, 'steelV', [[0, B.steel], [1, B.steelDeep]])
    + lin(ctx, 'lacquerG', [[0, B.lacquer], [1, B.lacquerDeep]])
    + lin(ctx, 'carNight', [[0, mixHex(B.carWall, B.hill, 0.55)], [0.5, mixHex(B.carWall, B.hill, 0.62)], [1, mixHex(B.carWallShade, B.hill, 0.66)]])
    + lin(ctx, 'carShell', [[0, mixHex(B.carWall, B.hill, 0.38)], [1, mixHex(B.carWallShade, B.hill, 0.5)]])
    + lin(ctx, 'steamV', [[0, B.steam, 0], [0.45, B.steam, 0.4], [1, B.steam, 0.7]])
    + lin(ctx, 'steamUp', [[0, B.steam, 0], [1, B.steam, 0.55]])
    + lin(ctx, 'roofG', [[0, B.roofGreen], [1, B.roofGreenDeep]])
    + lin(ctx, 'muralSky', [[0, mixHex(B.tealLit, C.washi, 0.5)], [1, B.tealLit]])
    + rad(ctx, 'amberPool', [[0, C.lamp, 0.44], [0.55, C.lampAmber, 0.15], [1, C.lampAmber, 0]])
    + rad(ctx, 'moonPool', [[0, B.steam, 0.28], [0.6, B.steam, 0.08], [1, B.steam, 0]])
    + rad(ctx, 'springGlow', [[0, B.tealLit, 0.45], [0.6, B.tealLight, 0.12], [1, B.tealLight, 0]])
    + `</defs>`;
}

/** Light pools on the floor page: amber under the lanterns, the moon's, the spring's teal glow. */
const pools = (ctx: KitCtx, list: readonly (readonly [number, number, number, number, ('amber' | 'moon' | 'spring')?])[]) =>
  list.map(([cx, cy, rx, ry, tone]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ref(ctx, tone === 'moon' ? 'moonPool' : tone === 'spring' ? 'springGlow' : 'amberPool')}"/>`).join('');

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

/** 北投's sky at 04:00 (the colour clock), pinholes thinning toward the horizon, the moon. */
function beitouSky(ctx: KitCtx, base: number, { moon = [312, 70, 22] as readonly [number, number, number] | null, seed = 8, stars = 48 } = {}): string {
  return `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, 0, 0, PAGE_W, base - 70, stars, seed)
    + (moon ? softEllipse(ctx, moon[0], moon[1], moon[2] * 2.4, moon[2] * 2.4, 'lamp', 0.07, 'blur18') + calmMoon(ctx, moon[0], moon[1], moon[2], { halo: 0.08 }) : '');
}

/**
 * Vellum steam (the chapter's signature, bible § 6 row 8): a plume of soft billows rising from
 * (x, y) up `h`, swaying as it goes — wide and dense at its foot, thinning and fading as it rises,
 * a few white edges on its top billows and two loose curls of wisp. Vellum takes no hard shadow
 * (bible § 3.1). `lean` drifts it sideways over its height.
 */
export function steamPlume(ctx: KitCtx, x: number, y: number, h: number, w: number, seed: number, { o = 0.6, lean = 14 } = {}): string {
  const r = seeded(seed);
  let puffs = '';
  let edges = '';
  const n = Math.max(8, Math.round(h / 5));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const cx = x + lean * t + Math.sin(t * 4 + seed) * w * 0.14 + (r() - 0.5) * w * (0.25 + t * 0.3);
    const cy = y - h * t + (r() - 0.5) * 6;
    const rr = w * (0.2 + 0.2 * t) * (0.7 + r() * 0.6);
    const op = o * (1 - t * 0.85) * (0.55 + r() * 0.45);
    puffs += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}" opacity="${f1(op)}"/>`;
    if (t > 0.3 && t < 0.9 && r() > 0.72) edges += `M${f1(cx - rr * 0.7)} ${f1(cy - rr * 0.55)}q${f1(rr * 0.6)} ${f1(-rr * 0.55)} ${f1(rr * 1.3)} ${f1(-rr * 0.05)}`;
  }
  const curl = (dx: number, dy: number, s: number) => `M${f1(x + dx)} ${f1(y + dy)}q${f1(-6 * s)} ${f1(-8 * s)} 0 ${f1(-14 * s)}t0 ${f1(-14 * s)}`;
  return `<g fill="${B.steam}"${blur(ctx)}>${puffs}</g>`
    + `<path d="${edges}" stroke="${C.vellum}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="${f1(o * 0.55)}"/>`
    + `<path d="${curl(lean * 0.9 - w * 0.2, -h * 0.86, 1)}${curl(lean + w * 0.25, -h * 0.98, 0.8)}" stroke="${B.steam}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="${f1(o * 0.45)}"/>`;
}

/**
 * 咻咻's beat (GDD § 4.2 ch8, D-93): a plume of steam swirling **the wrong way** — where every
 * other plume rises and drifts right, this one curls back down and round on itself to the left in
 * a tight spiral of vellum — and the little cloud peeking out of its eye, pleased with itself.
 */
function wrongSwirl(ctx: KitCtx, x: number, y: number, s = 1): string {
  const k = (n: number) => f1(n * s);
  // A spiral turning counter to the others: out from the eye, round and down
  let d = `M${f1(x)} ${f1(y)}`;
  for (let i = 0; i < 26; i++) {
    const a = -i * 0.5;
    const rr = 3 + i * 1.2;
    d += `L${f1(x + Math.cos(a) * rr * s)} ${f1(y + Math.sin(a) * rr * 0.8 * s)}`;
  }
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${k(30)}" fill="${B.steam}" opacity=".22"/>`
    + `<path d="${d}" stroke="${B.steam}" stroke-width="${k(7)}" fill="none" stroke-linecap="round" opacity=".55"/>`
    + `<path d="${d}" stroke="${C.vellum}" stroke-width="${k(1.4)}" fill="none" stroke-linecap="round" opacity=".8"/>`
    // Its tail runs back down into the steam it came from, against the drift
    + `<path d="M${f1(x - 30 * s)} ${f1(y + 4 * s)}q${k(-10)} ${k(18)} ${k(4)} ${k(34)}q${k(10)} ${k(12)} ${k(-2)} ${k(28)}" stroke="${B.steam}" stroke-width="${k(5)}" fill="none" stroke-linecap="round" opacity=".4"/>`
    + shushuPeek(ctx, x + 3 * s, y + 1 * s, 0.72 * s);
}

/** Wood grain over a board from (x0, y0) to (x1, y1): long wavering lines and a knot or two. */
function woodGrain(x0: number, y0: number, x1: number, y1: number, seed: number, vertical = false, every = 5): string {
  const r = seeded(seed);
  let d = '';
  if (vertical) {
    for (let x = x0 + 1.5 + r() * 2; x < x1 - 1; x += every * (0.7 + r() * 0.6)) {
      const wob = (r() - 0.5) * 3;
      d += `M${f1(x)} ${f1(y0)}q${f1(wob)} ${f1((y1 - y0) * 0.33)} 0 ${f1((y1 - y0) * 0.5)}t0 ${f1((y1 - y0) * 0.5)}`;
    }
    if (y1 - y0 > 40 && r() > 0.3) {
      const kx = x0 + (x1 - x0) * (0.3 + r() * 0.4), ky = y0 + (y1 - y0) * (0.25 + r() * 0.5);
      d += `M${f1(kx - 2.4)} ${f1(ky)}a2.4 4 0 1 0 4.8 0a2.4 4 0 1 0 -4.8 0`;
    }
  } else {
    for (let y = y0 + 1.5 + r() * 2; y < y1 - 1; y += every * (0.7 + r() * 0.6)) {
      const wob = (r() - 0.5) * 3;
      d += `M${f1(x0)} ${f1(y)}q${f1((x1 - x0) * 0.33)} ${f1(wob)} ${f1((x1 - x0) * 0.5)} 0t${f1((x1 - x0) * 0.5)} 0`;
    }
    if (x1 - x0 > 40 && r() > 0.3) {
      const kx = x0 + (x1 - x0) * (0.2 + r() * 0.6), ky = y0 + (y1 - y0) * (0.3 + r() * 0.4);
      d += `M${f1(kx - 4)} ${f1(ky)}a4 2.2 0 1 0 8 0a4 2.2 0 1 0 -8 0`;
    }
  }
  return d;
}

/**
 * Wood-grain card (the chapter's signature material): boards from (x0, y0) to (x1, y1) — vertical
 * (`vertical`, a bathhouse's cladding) or horizontal (a deck, a wainscot) — each `w` wide, in a
 * tone with its grain, a dark joint and a lit edge between boards.
 */
function planks(x0: number, y0: number, x1: number, y1: number, { vertical = true, w = 16, tone = B.cedar as string, seed = 5 } = {}): string {
  const r = seeded(seed);
  let fills = '';
  let grain = '';
  let joints = '';
  let lit = '';
  if (vertical) {
    for (let x = x0, i = 0; x < x1; x += w, i++) {
      const ww = Math.min(w, x1 - x);
      fills += `<rect x="${f1(x)}" y="${f1(y0)}" width="${f1(ww)}" height="${f1(y1 - y0)}" fill="${mixHex(tone, i % 3 === 1 ? C.shadow : C.cutRim, 0.06 + r() * 0.06)}"/>`;
      grain += woodGrain(x, y0, x + ww, y1, seed * 31 + i, true, 4.5);
      joints += `M${f1(x)} ${f1(y0)}V${f1(y1)}`;
      lit += `M${f1(x + 1)} ${f1(y0)}V${f1(y1)}`;
    }
  } else {
    for (let y = y0, i = 0; y < y1; y += w, i++) {
      const hh = Math.min(w, y1 - y);
      fills += `<rect x="${f1(x0)}" y="${f1(y)}" width="${f1(x1 - x0)}" height="${f1(hh)}" fill="${mixHex(tone, i % 3 === 1 ? C.shadow : C.cutRim, 0.06 + r() * 0.06)}"/>`;
      grain += woodGrain(x0, y, x1, y + hh, seed * 31 + i, false, 4);
      joints += `M${f1(x0)} ${f1(y)}H${f1(x1)}`;
      lit += `M${f1(x0)} ${f1(y + 1)}H${f1(x1)}`;
    }
  }
  return fills + `<path d="${grain}" stroke="${B.grain}" stroke-width=".7" fill="none" opacity=".35"/>`
    + `<path d="${joints}" stroke="${B.grain}" stroke-width="1.2" opacity=".55"/><path d="${lit}" stroke="${C.cutRim}" stroke-width=".6" opacity=".18"/>`;
}

/** The night hills over 北投 in three layers (大屯山 far, 紗帽山, the near slope), steam drifting between them. */
function beitouHills(ctx: KitCtx, base: number, seed: number, { far = base - 120, mid = base - 74, near = base - 30 } = {}): string {
  const band = (y: number, h: number, o: number, s: number) => {
    const r = seeded(s);
    let top = `M-30 ${f1(y + 6)}`;
    for (let x = -30; x < PAGE_W + 30;) {
      const w = 34 + r() * 40;
      top += `q${f1(w / 2)} ${f1(-7 - r() * 7)} ${f1(w)} ${f1((r() - 0.5) * 5)}`;
      x += w;
    }
    return `<path d="${top}V${f1(y + h)}H-30Z" fill="${ref(ctx, 'steamV')}" opacity="${o}"/>`;
  };
  return depth(ctx, 1, `<path d="${ridge(-30, PAGE_W + 30, far, 54, seed, base)}" fill="${B.hillFar}"/>`, `<path d="${ridge(-30, PAGE_W + 30, far, 54, seed, base)}"/>`)
    + band(far + 14, 46, 0.35, seed + 1)
    + depth(ctx, 1, `<path d="${ridge(-30, PAGE_W + 30, mid, 40, seed + 2, base)}" fill="${B.hill}"/>`, `<path d="${ridge(-30, PAGE_W + 30, mid, 40, seed + 2, base)}"/>`)
    + band(mid + 12, 42, 0.4, seed + 3)
    + depth(ctx, 2, `<path d="${ridge(-30, PAGE_W + 30, near, 26, seed + 4, base + 4, 60)}" fill="${B.hillNear}"/>`, `<path d="${ridge(-30, PAGE_W + 30, near, 26, seed + 4, base + 4, 60)}"/>`);
}

/**
 * A broadleaf crown at night (北投公園's trees): clusters in the shade tone, their moonlit faces up
 * and left in the leaf tone, a few lit edges — paper in three tones, so it reads round.
 */
function treeCrown(ctx: KitCtx, x: number, y: number, r: number, seed: number, tone: string = B.leaf, z: 1 | 2 | 3 | 4 = 2): string {
  const rr = seeded(seed);
  const disc = (cx: number, cy: number, cr: number) => `M${f1(cx - cr)} ${f1(cy)}a${f1(cr)} ${f1(cr)} 0 1 0 ${f1(2 * cr)} 0a${f1(cr)} ${f1(cr)} 0 1 0 ${f1(-2 * cr)} 0z`;
  let shade = '';
  let face = '';
  let lit = '';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rr() * 0.6;
    const d = r * (0.35 + rr() * 0.25);
    const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * 0.7;
    const cr = r * (0.36 + rr() * 0.16);
    shade += disc(cx, cy, cr);
    face += disc(cx - cr * 0.18, cy - cr * 0.22, cr * 0.78);
    if (cy < y + r * 0.1) lit += `M${f1(cx - cr * 0.75)} ${f1(cy - cr * 0.35)}q${f1(cr * 0.45)} ${f1(-cr * 0.6)} ${f1(cr * 1.05)} ${f1(-cr * 0.5)}`;
  }
  shade += disc(x, y, r * 0.7);
  return depth(ctx, z, `<path d="${shade}" fill="${mixHex(tone, C.shadow, 0.35)}"/><path d="${face}" fill="${tone}"/>`
    + `<path d="${lit}" stroke="${mixHex(tone, B.tealLit, 0.5)}" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".7"/>`, `<path d="${shade}"/>`);
}

/**
 * A hot-spring lantern (a paper 提燈 on a bracket or a cord): a white washi cylinder ribbed with
 * bamboo, black caps, 「湯」 in red ink, glowing warm from inside; `s` scales a 20-unit lantern.
 */
function hotLantern(ctx: KitCtx, x: number, y: number, s = 1, glyph = '湯'): string {
  const k = (n: number) => f1(n * s);
  const body = `M${f1(x - 8 * s)} ${f1(y - 9 * s)}Q${f1(x - 11 * s)} ${f1(y)} ${f1(x - 8 * s)} ${f1(y + 9 * s)}H${f1(x + 8 * s)}Q${f1(x + 11 * s)} ${f1(y)} ${f1(x + 8 * s)} ${f1(y - 9 * s)}Z`;
  let ribs = '';
  for (let i = -2; i <= 2; i++) ribs += `M${f1(x - 10 * s)} ${f1(y + i * 3.6 * s)}H${f1(x + 10 * s)}`;
  return softEllipse(ctx, x, y, 22 * s, 20 * s, 'lamp', 0.34, 'blur8')
    + `<path d="${body}" fill="${C.windowTop}"/><path d="${ribs}" stroke="${C.lampAmber}" stroke-width="${k(0.6)}" opacity=".7"/>`
    + `<rect x="${f1(x - 7 * s)}" y="${f1(y - 11.4 * s)}" width="${k(14)}" height="${k(3)}" rx="${k(0.8)}" fill="${C.printDark}"/><rect x="${f1(x - 7 * s)}" y="${f1(y + 8.6 * s)}" width="${k(14)}" height="${k(3)}" rx="${k(0.8)}" fill="${C.printDark}"/>`
    + (glyph ? `<text data-art-text="" x="${f1(x)}" y="${f1(y + 3.6 * s)}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${k(9)}" fill="${C.hatRed}">${glyph}</text>` : '');
}

/**
 * A tiled roof (the old houses of 北投: 和洋 bathhouses with deep eaves): a hipped slab of slate tiles
 * from (x0, y) to (x1, y) at its eaves, `h` tall, its ridge `inset` in at each end; tile courses, a
 * lit ridge and the eaves' shadow.
 */
function tiledRoof(ctx: KitCtx, x0: number, x1: number, y: number, h: number, inset: number, z: 1 | 2 | 3 = 2): string {
  const d = `M${f1(x0)} ${f1(y)}Q${f1(x0 + inset * 0.4)} ${f1(y - h * 0.3)} ${f1(x0 + inset)} ${f1(y - h)}H${f1(x1 - inset)}Q${f1(x1 - inset * 0.4)} ${f1(y - h * 0.3)} ${f1(x1)} ${f1(y)}Z`;
  let courses = '';
  for (let k = 1; k < 5; k++) {
    const t = k / 5;
    const yy = y - h * t;
    courses += `M${f1(x0 + inset * t * 0.9)} ${f1(yy)}H${f1(x1 - inset * t * 0.9)}`;
  }
  return depth(ctx, z, `<path d="${d}" fill="${B.slate}"/><path d="${courses}" stroke="${B.slateLight}" stroke-width="${f1(Math.max(0.6, h / 30))}" opacity=".7"/>`
    + `<path d="M${f1(x0 + inset)} ${f1(y - h)}H${f1(x1 - inset)}" stroke="${C.cutRim}" stroke-width="1.2" opacity=".45"/>`
    + `<path d="M${f1(x0 - 2)} ${f1(y + 0.6)}H${f1(x1 + 2)}" stroke="${mixHex(B.slate, C.shadow, 0.5)}" stroke-width="2.4"/>`, `<path d="${d}"/>`);
}

/**
 * The hot-spring museum (北投溫泉博物館, drawn with affection, no lettering): red brick arches below,
 * a timber upper floor with its long veranda lit warm, a tiled hipped roof; `s` × a 120-unit house,
 * its foot at (x, y).
 */
function springMuseum(ctx: KitCtx, x: number, y: number, s: number): string {
  const P = (dx: number, dy: number) => `${f1(x + dx * s)} ${f1(y + dy * s)}`;
  const k = (n: number) => f1(n * s);
  let arches = '';
  for (let i = -2; i <= 2; i++) arches += `M${P(i * 20 - 7, 0)}V${f1(y - 14 * s)}a${k(7)} ${k(7)} 0 0 1 ${k(14)} 0V${f1(y)}Z`;
  let posts = '';
  for (let i = -3; i <= 3; i++) posts += `M${P(i * 17, -26)}V${f1(y - 46 * s)}`;
  return depth(ctx, 2, `<rect x="${f1(x - 56 * s)}" y="${f1(y - 26 * s)}" width="${k(112)}" height="${k(26)}" fill="${ref(ctx, 'brickG')}"/>`
    + `<path d="${arches}" fill="${ref(ctx, 'window')}"/>`
    + `<rect x="${f1(x - 54 * s)}" y="${f1(y - 48 * s)}" width="${k(108)}" height="${k(22)}" fill="${mixHex(B.cedarDeep, C.shadow, 0.2)}"/>`
    + `<rect x="${f1(x - 50 * s)}" y="${f1(y - 45 * s)}" width="${k(100)}" height="${k(15)}" fill="${ref(ctx, 'window')}" opacity=".85"/>`
    + `<path d="${posts}" stroke="${B.cedarDeep}" stroke-width="${k(2)}"/><path d="M${P(-56, -30)}H${f1(x + 56 * s)}" stroke="${B.cedarLight}" stroke-width="${k(1.6)}"/>`, `<rect x="${f1(x - 56 * s)}" y="${f1(y - 48 * s)}" width="${k(112)}" height="${k(48)}"/>`)
    + tiledRoof(ctx, x - 64 * s, x + 64 * s, y - 47 * s, 18 * s, 22 * s)
    + softEllipse(ctx, x, y - 36 * s, 60 * s, 16 * s, 'lamp', 0.16, 'blur8');
}

/** A bath's pale mosaic: small square tiles from (x0, y0) to (x1, y1), `t` each, grout lines, a few teal tiles. */
function mosaic(x0: number, y0: number, x1: number, y1: number, t: number, seed: number, tone = B.tile as string, accent = 0.6): string {
  const r = seeded(seed);
  let grout = '';
  let teal = '';
  for (let y = y0; y <= y1; y += t) grout += `M${f1(x0)} ${f1(y)}H${f1(x1)}`;
  for (let x = x0; x <= x1; x += t) grout += `M${f1(x)} ${f1(y0)}V${f1(y1)}`;
  for (let y = y0; y < y1 - 1; y += t) for (let x = x0; x < x1 - 1; x += t) if (r() < 0.12) teal += `M${f1(x + 0.5)} ${f1(y + 0.5)}h${f1(t - 1)}v${f1(t - 1)}h${f1(1 - t)}z`;
  return `<rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(x1 - x0)}" height="${f1(y1 - y0)}" fill="${tone}"/>`
    + `<path d="${teal}" fill="${B.tealLight}" opacity="${accent}"/><path d="${grout}" stroke="${B.grout}" stroke-width=".6" opacity=".55"/>`;
}

/** Rows of boards on the floor page converging on the vanishing point, from `top` to the page's foot. */
function floorBoards(top: number, tone: string, every = 22): string {
  const [vx, vy] = VANISHING_POINT;
  let seams = '';
  let joints = '';
  const r = seeded(Math.round(top + every));
  for (let bx = -220; bx <= PAGE_W + 220; bx += every) {
    seams += `M${f1(bx)} ${FLOOR_BOTTOM}L${f1(bx + (vx - bx) * ((top - FLOOR_BOTTOM) / (vy - FLOOR_BOTTOM)))} ${top}`;
    for (let j = 0; j < 2; j++) {
      const t = 0.1 + r() * 0.85;
      const yy = top + (FLOOR_BOTTOM - top) * t;
      const k = (yy - FLOOR_BOTTOM) / (vy - FLOOR_BOTTOM);
      joints += `M${f1(bx + (vx - bx) * k)} ${f1(yy)}h${f1(every * (1 - k) * 0.95)}`;
    }
  }
  return `<rect x="${FLOOR_RECT.x}" y="${top}" width="${FLOOR_RECT.w}" height="${FLOOR_BOTTOM - top}" fill="${tone}"/>`
    + `<path d="${seams}" stroke="${mixHex(tone, C.shadow, 0.5)}" stroke-width="1.1" opacity=".7"/>`
    + `<path d="${joints}" stroke="${mixHex(tone, C.shadow, 0.5)}" stroke-width=".9" opacity=".55"/>`
    + `<path d="${seams}" stroke="${C.cutRim}" stroke-width=".5" opacity=".1" transform="translate(1.2 0)"/>`;
}

/** A pebble bank: rounded stones in two tones with lit tops, scattered between x0 and x1 at y (depth `dy`). */
function pebbles(x0: number, x1: number, y: number, dy: number, seed: number, n = 24): string {
  const r = seeded(seed);
  let dark = '';
  let lit = '';
  for (let i = 0; i < n; i++) {
    const px = x0 + r() * (x1 - x0), py = y + r() * dy, rx = 3 + r() * 6, ry = rx * (0.55 + r() * 0.2);
    dark += `M${f1(px - rx)} ${f1(py)}a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(2 * rx)} 0a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(-2 * rx)} 0z`;
    lit += `M${f1(px - rx * 0.6)} ${f1(py - ry * 0.4)}q${f1(rx * 0.6)} ${f1(-ry * 0.6)} ${f1(rx * 1.2)} 0`;
  }
  return `<path d="${dark}" fill="${B.rock}"/><path d="${lit}" stroke="${B.rockLight}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/>`;
}

/** A fern: a frond of paired leaflets arching from (x, y) toward `dir`, `len` long. */
function fern(x: number, y: number, dir: number, len: number, tone: string = B.leafLight): string {
  let leaves = '';
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    const px = x + dir * len * 0.45 * t * t, py = y - len * t;
    leaves += `M${f1(px)} ${f1(py)}q${f1(-6 * (1 - t) - 2)} ${f1(-2)} ${f1(-9 * (1 - t) - 3)} ${f1(3)}M${f1(px)} ${f1(py)}q${f1(6 * (1 - t) + 2)} ${f1(-2)} ${f1(9 * (1 - t) + 3)} ${f1(3)}`;
  }
  return `<path d="M${x} ${y}Q${f1(x + dir * len * 0.1)} ${f1(y - len * 0.6)} ${f1(x + dir * len * 0.45)} ${f1(y - len)}" stroke="${tone}" stroke-width="1.4" fill="none"/>`
    + `<path d="${leaves}" stroke="${tone}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;
}

/** A rock in the paper's language: a faceted lump, its lit face up and left, a sulphur streak, its foot at y. */
function rockLump(ctx: KitCtx, x: number, y: number, w: number, h: number, seed: number, { sulphur = true, z = 3 as 1 | 2 | 3 | 4 } = {}): string {
  const r = seeded(seed);
  const pts: Pt[] = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI;
    const k = 0.82 + r() * 0.22;
    pts.push([x + Math.cos(a) * w * 0.5 * k, y + Math.sin(a) * h * k]);
  }
  const d = `M${f1(x - w / 2)} ${f1(y)}` + pts.map(([px, py]) => `L${f1(px)} ${f1(py)}`).join('') + `L${f1(x + w / 2)} ${f1(y)}Z`;
  const lit = `M${f1(pts[1][0])} ${f1(pts[1][1])}L${f1(pts[2][0])} ${f1(pts[2][1])}L${f1(pts[3][0])} ${f1(pts[3][1])}L${f1(pts[4][0])} ${f1(pts[4][1])}L${f1(x - w * 0.05)} ${f1(y - h * 0.45)}L${f1(x - w * 0.3)} ${f1(y - h * 0.2)}Z`;
  return depth(ctx, z, `<path d="${d}" fill="${ref(ctx, 'rockG')}"/><path d="${lit}" fill="${B.rockLight}" opacity=".55"/>`
    + `<path d="M${f1(x - w * 0.05)} ${f1(y - h * 0.45)}L${f1(x + w * 0.2)} ${f1(y)}" stroke="${B.rockDeep}" stroke-width="1" opacity=".6"/>`
    + (sulphur ? `<path d="M${f1(x + w * 0.05)} ${f1(y - h * 0.8)}q${f1(w * 0.12)} ${f1(h * 0.3)} ${f1(w * 0.04)} ${f1(h * 0.6)}" stroke="${B.sulphur}" stroke-width="${f1(Math.max(2, w * 0.06))}" stroke-linecap="round" fill="none" opacity=".7"/>` : ''), `<path d="${d}"/>`);
}

// ——— 8-1 「新北投支線」 ———

/** 8-1's car: its back wall's window band, its floor line (the floor ledges' feet) and its body's foot. */
const CAR = { ceiling: 54, winTop: 140, winBottom: 262, wainscot: 282, floor: 486, body: 540 };

/** A luggage rack on its stanchions (Mocha's perch, its top at (x, top)): a slatted wooden shelf on steel brackets. */
function luggageRack(ctx: KitCtx, x: number, top: number, w: number, foot: number): string {
  const [l, r] = [x - w / 2, x + w / 2];
  let slats = '';
  for (let sx = l + 4; sx < r - 2; sx += 7) slats += `M${f1(sx)} ${top + 1}v6`;
  return depth(ctx, 3, `<path d="M${f1(l + 6)} ${top + 6}V${foot}M${f1(r - 6)} ${top + 6}V${foot}" stroke="${B.steelDeep}" stroke-width="3"/>`
    + `<path d="M${f1(l + 6)} ${top + 26}L${f1(l + 18)} ${top + 8}M${f1(r - 6)} ${top + 26}L${f1(r - 18)} ${top + 8}" stroke="${B.steelDeep}" stroke-width="2"/>`
    + `<rect x="${f1(l)}" y="${top}" width="${w}" height="8" rx="2" fill="${ref(ctx, 'cedarG')}"/><path d="${slats}" stroke="${B.cedarDeep}" stroke-width="1.6"/>`
    + `<path d="M${f1(l + 2)} ${top + 0.8}H${f1(r - 2)}" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`
    + `<path d="M${f1(l)} ${top + 8}H${f1(r)}" stroke="${B.steel}" stroke-width="1.6"/>`, `<rect x="${f1(l)}" y="${top}" width="${w}" height="${foot - top}"/>`);
}

/**
 * 8-1: the 新北投支線's hot-spring car at night, cut away from the side (bible § 6 cars row): one stop
 * on the little branch line. Its back wall: the cream ceiling with its strip lights and the overhead
 * route strip (北投 → 新北投, the next stop lit), hand straps, the window band (outside: 北投 at night —
 * the hills, steam drifting up from the valley, the hot-spring museum lit warm, street lamps) between
 * framed hot-spring prints, the cedar wainscot. The luggage racks are Mocha's (`rack1` over the left
 * bench, its top at (44, 384); `rack2` past the bucket, (330, 380)). The stained-glass screen beside
 * the middle seat holds the decoy window at (140, 350) (drawn live); the 阿伯's big wooden bath bucket
 * stands in the aisle at x 263 (the cruise step). The car's floor and body run the page's width (the
 * ledges are the floor and the benches); the trackbed below.
 */
const hotSpringTrain: BackdropDraw = (ctx) => {
  const { ceiling, winTop, winBottom, wainscot, floor, body } = CAR;
  // The view outside, clipped to the window band
  const clip = ctx.id('carWinClip');
  const wins: [number, number][] = [[12, 98], [178, 98], [304, 98]];
  const winPath = wins.map(([x, w]) => `M${x} ${winTop}h${w}v${winBottom - winTop}h${-w}z`).join('');
  const outside = `<clipPath id="${clip}"><path d="${winPath}"/></clipPath><g clip-path="url(#${clip})">`
    + `<rect x="0" y="${winTop}" width="${PAGE_W}" height="${winBottom - winTop}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, 0, winTop, PAGE_W, 50, 22, 81)
    + calmMoon(ctx, 336, 168, 13, { halo: 0.06, cloud: false })
    + beitouHills(ctx, winBottom + 6, 82, { far: 196, mid: 214, near: 236 })
    + springMuseum(ctx, 220, 252, 0.62)
    + steamPlume(ctx, 92, 250, 70, 34, 83, { o: 0.5, lean: 12 }) + steamPlume(ctx, 330, 252, 60, 30, 84, { o: 0.45, lean: 10 })
    + [40, 150, 286, 372].map((x) => softEllipse(ctx, x, 238, 8, 8, 'lamp', 0.4) + `<circle cx="${x}" cy="238" r="2" fill="${C.lamp}"/><path d="M${x} 240V262" stroke="${B.hillNear}" stroke-width="1.6"/>`).join('')
    // The glass: a cool sheen across each pane
    + wins.map(([x, w]) => `<path d="M${x + w * 0.15} ${winBottom}L${x + w * 0.45} ${winTop}H${x + w * 0.55}L${x + w * 0.25} ${winBottom}Z" fill="${C.glassine}" opacity=".1"/>`).join('')
    + `</g>`;
  // The car's wall: cream card, the window frames in cedar, the teal band, prints between the windows
  const wall = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'carNight')}"/>`
    + `<rect x="-20" y="${winBottom + 6}" width="${PAGE_W + 40}" height="6" fill="${B.carBand}"/>`;
  const frames = wins.map(([x, w]) => depth(ctx, 2, `<path d="M${x - 6} ${winTop - 6}h${w + 12}v${winBottom - winTop + 12}h${-w - 12}zM${x} ${winTop}v${winBottom - winTop}h${w}v${winTop - winBottom}z" fill-rule="evenodd" fill="${ref(ctx, 'cedarG')}"/>`
    + `<path d="M${x + w / 2} ${winTop}V${winBottom}" stroke="${B.cedarDeep}" stroke-width="3"/><path d="M${x - 5} ${winTop - 5.2}h${w + 10}" stroke="${C.cutRim}" stroke-width="1" opacity=".45"/>`,
  `<path d="M${x - 6} ${winTop - 6}h${w + 12}v${winBottom - winTop + 12}h${-w - 12}z"/>`)).join('');
  // Two framed hot-spring prints between the windows: the valley's steam, a bather's bucket and towel
  const print = (x: number, y: number, art: string) => depth(ctx, 2, `<rect x="${x}" y="${y}" width="54" height="70" fill="${B.cedarDeep}"/><rect x="${x + 4}" y="${y + 4}" width="46" height="62" fill="${C.washi}"/>`, `<rect x="${x}" y="${y}" width="54" height="70"/>`)
    + art + `<path d="M${x + 1} ${y + 0.8}h52" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`;
  const printA = print(117, 156, `<rect x="121" y="160" width="46" height="62" fill="${ref(ctx, 'muralSky')}" opacity=".5"/><path d="M121 206q12 -14 23 -6q12 -10 23 2v20h-46z" fill="${B.rock}"/>`
    + `<path d="M126 216q16 -6 36 0v6h-36z" fill="${B.tealLight}"/><path d="M134 210q-5 -8 0 -16t0 -16M146 208q-5 -9 0 -18t0 -14M156 210q-4 -7 0 -14" stroke="${C.cutRim}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85"/>`);
  const printB = print(240, 156, `<rect x="244" y="160" width="46" height="62" fill="${mixHex(C.washi, B.hinokiLight, 0.4)}"/>`
    + `<path d="M256 214h22l-3 -16h-16z" fill="${B.hinoki}"/><path d="M256 206h22M257 202h20" stroke="${B.hinokiDeep}" stroke-width="1.2"/><path d="M252 214h30" stroke="${B.hinokiDeep}" stroke-width="2"/>`
    + `<path d="M260 196q8 -10 16 -2" stroke="${C.washi}" stroke-width="6" fill="none"/><path d="M262 194q2 -3 5 -2" stroke="${B.towelStripe}" stroke-width="2" fill="none"/>`
    + `<text data-art-text="" x="267" y="182" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="12" fill="${C.hatRed}">湯</text>`);
  // The ceiling: a cream vault with strip lights, the route strip, the strap rail and its straps
  const ceil = `<path d="M-20 0H410V${ceiling}Q195 ${ceiling + 18} -20 ${ceiling}Z" fill="${mixHex(B.carWall, B.hill, 0.45)}"/>`
    + `<path d="M-20 ${ceiling}Q195 ${ceiling + 18} 410 ${ceiling}" stroke="${B.carWallShade}" stroke-width="2" fill="none"/>`
    + [44, 140, 250, 346].map((x) => `<rect x="${x - 30}" y="18" width="60" height="6" rx="3" fill="${C.lampHot}"/>`).join('')
    + softEllipse(ctx, 195, 26, 220, 18, 'lamp', 0.22, 'blur8');
  const stations: [number, string, boolean][] = [[136, '北投', false], [254, '新北投', true]];
  const route = depth(ctx, 2, `<rect x="104" y="62" width="182" height="24" rx="4" fill="${C.printDark}"/>`, `<rect x="104" y="62" width="182" height="24"/>`)
    + `<path d="M118 76H272" stroke="${C.neonPink}" stroke-width="2.4" opacity=".8"/><path d="M118 76H272" stroke="${C.lampHot}" stroke-width=".7" opacity=".7"/>`
    + stations.map(([x, name, lit]) => (lit ? softEllipse(ctx, x, 76, 9, 9, 'lamp', 0.5) : '') + `<circle cx="${x}" cy="76" r="3.4" fill="${lit ? C.lampHot : C.printLilac}"/>`
      + `<text data-art-text="" x="${x}" y="71" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6.4" fill="${lit ? C.lampHot : C.printLilac}">${name}</text>`).join('');
  let straps = '';
  for (let x = 30; x < 390; x += 44) {
    if (x > 96 && x < 296) continue;
    straps += `<path d="M${x} 100V122" stroke="${B.steelDeep}" stroke-width="1.6"/><path d="M${x - 5} 122h10l-1 6a4 4 0 0 1 -8 0z" fill="${B.carBand}"/><circle cx="${x}" cy="133" r="6" fill="none" stroke="${B.steel}" stroke-width="2.4"/>`;
  }
  const rail = `<path d="M-20 98H410" stroke="${B.steel}" stroke-width="2.6"/><path d="M-20 97H410" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>` + straps;
  // The cedar wainscot under the windows, the heater grille along its foot
  const wains = planks(-20, wainscot, PAGE_W + 20, GUTTER_Y, { vertical: true, w: 18, tone: B.cedar, seed: 85 })
    + `<rect x="-20" y="${wainscot - 4}" width="${PAGE_W + 40}" height="6" fill="${B.cedarLight}"/><path d="M-20 ${wainscot - 3.4}H410" stroke="${C.cutRim}" stroke-width="1" opacity=".4"/>`
    + `<rect x="-20" y="340" width="${PAGE_W + 40}" height="20" fill="${mixHex(B.cedarDeep, C.shadow, 0.3)}"/>`
    + `<path d="${Array.from({ length: 50 }, (_, i) => `M${-16 + i * 8.6} 344v12`).join('')}" stroke="${B.cedar}" stroke-width="2.4" opacity=".7"/>`;
  // The floor page: the car's cedar floor running back to the wall, its body's shell across the page
  // (behind the ledges, so the gaps under the middle seat and by the bucket read as one car), the trackbed
  const trackTop = body + 14;
  let sleepers = '';
  for (let x = -60; x < PAGE_W + 60; x += 26) sleepers += `M${x} ${trackTop + 30}l10 -22h12l-6 22z`;
  const floorArt = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(B.hillNear, C.shadow, 0.35)}"/>`
    + `<g opacity=".95">${floorBoards(GUTTER_Y, mixHex(B.cedar, B.hinoki, 0.3), 20)}</g>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="22" fill="${C.shadow}" opacity=".22"/>`
    + pools(ctx, [[195, 420, 210, 40], [80, 470, 90, 18, 'moon'], [330, 470, 90, 18, 'moon']])
    // The trackbed under the car: ballast, sleepers, two rails catching the moon
    + `<rect x="${FLOOR_RECT.x}" y="${trackTop}" width="${FLOOR_RECT.w}" height="${FLOOR_BOTTOM - trackTop}" fill="${mixHex(B.rockDeep, C.shadow, 0.3)}"/>`
    + pebbles(FLOOR_RECT.x, FLOOR_RECT.x + FLOOR_RECT.w, trackTop + 40, 50, 86, 60)
    + `<path d="${sleepers}" fill="${B.cedarDeep}"/><path d="M-60 ${trackTop + 14}H460M-60 ${trackTop + 30}H460" stroke="${B.steel}" stroke-width="3"/>`
    + `<path d="M-60 ${trackTop + 13}H460M-60 ${trackTop + 29}H460" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${trackTop}" width="${FLOOR_RECT.w}" height="10" fill="${C.shadow}" opacity=".4"/>`);
  const shell = depth(ctx, 3, `<rect x="-30" y="${floor}" width="${PAGE_W + 60}" height="${body - floor}" fill="${ref(ctx, 'carShell')}"/>`
    + `<rect x="-30" y="${floor + 14}" width="${PAGE_W + 60}" height="10" fill="${B.carBand}"/><rect x="-30" y="${floor + 25}" width="${PAGE_W + 60}" height="2.4" fill="${B.cedarLight}"/>`
    + `<rect x="-30" y="${body - 8}" width="${PAGE_W + 60}" height="8" fill="${mixHex(B.steelDeep, C.shadow, 0.3)}"/>`, `<rect x="-30" y="${floor}" width="${PAGE_W + 60}" height="${body - floor}"/>`)
    + [60, 330].map((x) => `<rect x="${x - 26}" y="${body}" width="52" height="12" rx="2" fill="${B.steelDeep}"/><circle cx="${x - 14}" cy="${body + 12}" r="8" fill="${C.printDark}"/><circle cx="${x + 14}" cy="${body + 12}" r="8" fill="${C.printDark}"/>`).join('');
  // The racks (Mocha's): over the left bench, past the bucket
  const racks = luggageRack(ctx, 44, 384, 74, 458) + luggageRack(ctx, 330, 380, 74, 456);
  // The stained-glass screen beside the middle seat: a cedar frame, frosted glass, the window's arch
  // (the decoy's glass itself is drawn live in it at (140, 350))
  const screen = depth(ctx, 3, `<path d="M112 458V326Q112 316 122 316H158Q168 316 168 326V458Z" fill="${ref(ctx, 'cedarG')}"/>`
    + `<rect x="118" y="374" width="44" height="80" fill="${C.glassine}" opacity=".35"/><path d="M118 404H162M140 374V454" stroke="${B.cedarDeep}" stroke-width="2"/>`
    + `<path d="M124 368V336Q124 328 140 328Q156 328 156 336V368Z" fill="${mixHex(B.tealDeep, C.shadow, 0.3)}"/>`
    + `<path d="M124 336Q124 328 140 328Q156 328 156 336" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".4"/>`
    + `<path d="M113 317H167" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<path d="M112 458V316H168V458Z"/>`)
    + softEllipse(ctx, 140, 350, 26, 24, 'lamp', 0.12, 'blur8');
  // The bath bags piled in the aisle by the middle seat (why the way goes up over it)
  const bags = depth(ctx, 3, `<path d="M118 488q-2 -16 10 -20q12 -2 14 10q2 10 -2 12z" fill="${C.washiPink}"/><path d="M122 470q6 -10 14 0" stroke="${C.hatRed}" stroke-width="1.6" fill="none"/>`
    + `<path d="M140 490q0 -18 12 -18q10 0 10 18z" fill="${B.towelStripe}"/><path d="M142 480h18" stroke="${C.washi}" stroke-width="2"/>`, `<path d="M116 470H164V492H116Z"/>`);
  // The 阿伯's big wooden bath bucket in the aisle (a grown-up's step: the cruise), a towel over its rim
  const bucket = (() => {
    const [cx, top, foot] = [274, 432, 490];
    const d = `M${cx - 26} ${top}L${cx - 22} ${foot}H${cx + 22}L${cx + 26} ${top}Z`;
    return softEllipse(ctx, cx, foot, 28, 4, 'shadow', 0.45)
      + depth(ctx, 3, `<path d="${d}" fill="${ref(ctx, 'hinokiH')}"/>`
        + `<path d="${woodGrain(cx - 24, top, cx + 24, foot, 87, true, 7)}" stroke="${B.hinokiDeep}" stroke-width=".7" fill="none" opacity=".5"/>`
        + `<path d="M${cx - 25.4} ${top + 10}H${cx + 25.4}M${cx - 23} ${foot - 9}H${cx + 23}" stroke="${B.brassDeep}" stroke-width="3"/>`
        + `<ellipse cx="${cx}" cy="${top}" rx="26" ry="5.4" fill="${B.hinokiDeep}"/><ellipse cx="${cx}" cy="${top + 0.6}" rx="22.4" ry="3.8" fill="${mixHex(B.tealDeep, C.shadow, 0.3)}"/>`
        + `<path d="M${cx - 12} ${top - 2}q-3 -8 0 -14t0 -12M${cx + 2} ${top - 3}q-3 -8 0 -14" stroke="${B.steam}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>`
        + `<path d="M${cx + 8} ${top - 3}q10 2 12 16q-1 4 -4 4q0 -12 -10 -15z" fill="${C.washi}"/><path d="M${cx + 16} ${top + 4}v8" stroke="${B.towelStripe}" stroke-width="1.6"/>`
        + `<path d="M${cx - 24} ${top + 4}V${foot - 2}" stroke="${C.cutRim}" stroke-width="1" opacity=".35"/>`, `<path d="${d}"/>`);
  })();
  return beitouDefs(ctx) + standingPage(ctx, wall + outside + frames + printA + printB + ceil + route + rail + wains)
    + floorArt + shell + racks + screen + bags + bucket + bookCues(ctx) + block();
};

// ——— 8-2 「地熱谷」 ———

/** 8-2's hot pool: its far bank (y 456), its front rim (y 540) where the valves sit, the vents' mouths. */
const VALLEY = { far: 456, rim: 540, vents: [[152, 522], [232, 522]] as const };

/** A steam vent in the pool's bed: a ring of sulphur-crusted stones round a dark bubbling mouth. */
function vent(ctx: KitCtx, x: number, y: number): string {
  return softEllipse(ctx, x, y, 30, 8, 'lamp', 0.08)
    + depth(ctx, 3, `<ellipse cx="${x}" cy="${y}" rx="22" ry="7" fill="${B.rock}"/><ellipse cx="${x}" cy="${y - 1}" rx="14" ry="4" fill="${mixHex(B.tealDeep, C.shadow, 0.45)}"/>`
      + `<path d="M${x - 20} ${y - 2}q4 -4 9 -3M${x + 8} ${y - 5}q6 0 10 3" stroke="${B.sulphur}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`
      + `<circle cx="${x - 5}" cy="${y - 2}" r="1.6" fill="${B.tealLit}"/><circle cx="${x + 3}" cy="${y - 3}" r="1.2" fill="${B.tealLit}"/><circle cx="${x + 6}" cy="${y - 1}" r="1" fill="${B.tealLit}"/>`, `<ellipse cx="${x}" cy="${y}" rx="22" ry="7"/>`);
}

/**
 * 8-2: 地熱谷 (Thermal Valley) at night, the green-blue hot pool steaming in its rocky hollow. Behind:
 * the valley's cliffs of grey-violet rock streaked with sulphur, 北投公園's trees crowding their tops, the
 * hills beyond, and steam rising in plumes off the water into the night — one of them, high on the
 * right, swirling the wrong way with 咻咻 in its eye (the chapter's 咻咻 beat). The pool fills the floor
 * page from the far rocks to its front rim (y 540) where the two valves sit (parts at (120, 530) and
 * (204, 530)), iron pipes running back to the vents' mouths in the bed (152 and 232). The boardwalk
 * on the left (the ledges) with its lamp (Mocha's `lamp`, the lantern's top at (52, 368)); the rock by
 * the far vent (Mocha's `rockB`, its top at (278, 470)); the far rocks on the right (the ledges). The
 * 土地公 soaks by the far vent (262, 520) when its steam is off. A sign on the front bank.
 */
const thermalValley: BackdropDraw = (ctx) => {
  const sky = beitouSky(ctx, 230, { moon: [70, 64, 20], seed: 91 });
  const ridges = beitouHills(ctx, GUTTER_Y, 92, { far: 190, mid: 218, near: 246 });
  // The cliffs round the hollow, in two layers of rock card: the far wall dark, the near one ragged
  // with lit facets, sulphur crusting its ledges, steam seeping from its cracks
  const cliff = (d: string, seed: number, fill: string, z: 1 | 2) => {
    const r = seeded(seed);
    let facets = '';
    let crust = '';
    let cracks = '';
    for (let i = 0; i < 14; i++) {
      const x = -20 + r() * 430, y = 262 + r() * 70, w = 10 + r() * 22, h = 14 + r() * 26;
      facets += `M${f1(x)} ${f1(y)}l${f1(w * 0.5)} ${f1(-h * 0.3)}l${f1(w * 0.2)} ${f1(h)}l${f1(-w * 0.6)} ${f1(h * 0.2)}z`;
      cracks += `M${f1(x + w * 0.5)} ${f1(y - h * 0.3)}l${f1(-2 + r() * 4)} ${f1(h * 0.6)}l${f1(-3 + r() * 6)} ${f1(h * 0.5)}`;
      if (r() > 0.45) crust += `M${f1(x - 4)} ${f1(y + 1)}q${f1(w * 0.4)} ${f1(-3)} ${f1(w * 0.9)} 0`;
    }
    return depth(ctx, z, `<path d="${d}" fill="${fill}"/>`
      + `<path d="${facets}" fill="${C.cutRim}" opacity=".07"/><path d="${cracks}" stroke="${C.shadow}" stroke-width="1.2" fill="none" opacity=".45"/>`
      + `<path d="${crust}" stroke="${B.sulphur}" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".55"/>`
      + `<path d="${d.split('V360')[0].replace(/^M-30 360V/, 'M-30 ')}" stroke="${C.cutRim}" stroke-width="1.2" fill="none" opacity=".35"/>`, `<path d="${d}"/>`);
  };
  const cliffs = cliff('M-30 360V236Q0 226 30 232L66 214Q94 210 116 226L150 246Q176 252 206 250Q240 248 266 236L306 218Q336 208 362 214L420 204V360Z', 90, mixHex(B.rockDeep, B.hill, 0.45), 1)
    + cliff('M-30 360V262Q-6 250 20 256L52 240Q80 234 102 250L128 268Q150 282 176 288H230Q262 280 292 262L318 246Q344 234 370 242L420 232V360Z', 93, mixHex(B.rock, B.rockDeep, 0.45), 2)
    + steamPlume(ctx, 36, 262, 50, 20, 99, { o: 0.4, lean: 8 }) + steamPlume(ctx, 300, 262, 46, 18, 100, { o: 0.38, lean: 10 });
  const crowns = treeCrown(ctx, 8, 244, 30, 94) + treeCrown(ctx, 62, 228, 26, 95, B.leafDeep) + treeCrown(ctx, 344, 228, 28, 96)
    + treeCrown(ctx, 396, 218, 30, 97, B.leafDeep) + treeCrown(ctx, 110, 246, 18, 98, mixHex(B.leaf, B.hillNear, 0.3));
  // Steam off the water rising into the night (behind the cliffs' tops), and 咻咻's wrong-way swirl
  const steamBack = steamPlume(ctx, 160, 350, 190, 96, 101, { o: 0.62, lean: 30 }) + steamPlume(ctx, 250, 352, 210, 104, 102, { o: 0.6, lean: 36 })
    + steamPlume(ctx, 60, 352, 140, 70, 103, { o: 0.5, lean: 22 }) + steamPlume(ctx, 360, 356, 120, 60, 112, { o: 0.45, lean: 16 });
  const shushu = wrongSwirl(ctx, 330, 172, 1);
  // A hot-spring lantern on a pole by the cliff path (top left), a railing along the far path
  let rail = '';
  for (let x = 176; x <= 236; x += 12) rail += `M${x} 288v-12`;
  const path = `<path d="M170 288H240" stroke="${B.cedarDeep}" stroke-width="3"/><path d="M170 277H240${rail}" stroke="${B.cedar}" stroke-width="2"/>`;
  // The floor page: the pool — the far bank's stones, the green-blue water with its milky glow and
  // ripples, the vents in its bed, the front rim of stones with the valves' iron pipes
  const r = seeded(104);
  let ripples = '';
  for (let i = 0; i < 18; i++) {
    const x = -20 + r() * 420, y = VALLEY.far + 8 + r() * 70;
    ripples += `M${f1(x)} ${f1(y)}q${f1(6 + r() * 6)} -3 ${f1(14 + r() * 10)} 0`;
  }
  const water = `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${VALLEY.rim - GUTTER_Y + 10}" fill="${ref(ctx, 'poolG')}"/>`
    + `<path d="${ripples}" stroke="${B.tealLit}" stroke-width="1.2" fill="none" opacity=".7" stroke-linecap="round"/>`
    + pools(ctx, [[195, 500, 200, 40, 'spring'], [70, 420, 60, 14, 'moon']]);
  const farBank = `<path d="M-40 ${GUTTER_Y}H430V392Q380 404 330 396Q270 410 200 400Q130 412 60 398Q10 404 -40 396Z" fill="${mixHex(B.rockDeep, C.shadow, 0.2)}"/>`
    + pebbles(-30, 420, GUTTER_Y + 4, 26, 105, 40)
    + `<path d="M-40 396Q10 404 60 398Q130 412 200 400Q270 410 330 396Q380 404 430 392" stroke="${B.tealLit}" stroke-width="1.2" fill="none" opacity=".5"/>`;
  const vents = VALLEY.vents.map(([x, y]) => vent(ctx, x, y)).join('');
  const pipes = `<path d="M120 538Q124 528 138 524M204 538Q210 528 220 524" stroke="${B.steelDeep}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    + `<path d="M120 537Q124 527 138 523M204 537Q210 527 220 523" stroke="${B.steel}" stroke-width="1.4" fill="none" opacity=".6"/>`;
  // The front bank: a stone embankment under the rim, then the visitors' flagstone path along the
  // pool with its rope railing
  const bank = `<path d="M-40 ${VALLEY.rim}Q100 ${VALLEY.rim - 6} 200 ${VALLEY.rim - 2}Q300 ${VALLEY.rim + 2} 440 ${VALLEY.rim - 4}V${FLOOR_BOTTOM + 10}H-40Z" fill="${mixHex(B.rockDeep, B.hillNear, 0.3)}"/>`
    + (() => {
      const r2 = seeded(110);
      let stones = '';
      for (let y = VALLEY.rim + 4, row = 0; y < 578; y += 11, row++) {
        for (let x = -40 + (row % 2) * 12 + r2() * 4; x < 440; x += 22 + r2() * 8) stones += `M${f1(x + 1)} ${f1(y + 1)}h${f1(18 + r2() * 4)}v9h${f1(-18 - r2() * 4)}z`;
      }
      return `<path d="${stones}" fill="${B.rock}" opacity=".85"/><path d="${stones}" fill="none" stroke="${B.rockLight}" stroke-width=".8" opacity=".5" transform="translate(-.6 -.6)"/>`;
    })()
    + `<rect x="-40" y="580" width="480" height="80" fill="${mixHex(B.rock, B.hillNear, 0.5)}"/>`
    + (() => {
      const r2 = seeded(111);
      let flags = '';
      for (let y = 584, row = 0; y < FLOOR_BOTTOM; y += 18 + row * 3, row++) {
        for (let x = -40 + r2() * 20; x < 440; x += 34 + r2() * 20) flags += `M${f1(x + 2)} ${f1(y + 2)}h${f1(28 + r2() * 10)}l2 ${14 + row * 2}h${f1(-30 - r2() * 10)}z`;
      }
      return `<path d="${flags}" fill="${B.rockLight}" opacity=".45"/>`;
    })()
    + pebbles(-30, 420, VALLEY.rim - 6, 10, 106, 30)
    + `<path d="M-40 ${VALLEY.rim + 1}Q100 ${VALLEY.rim - 5} 200 ${VALLEY.rim - 1}Q300 ${VALLEY.rim + 3} 440 ${VALLEY.rim - 3}" stroke="${B.sulphur}" stroke-width="2.4" fill="none" opacity=".55"/>`;
  const rim = depth(ctx, 3, bank, `<path d="M-40 ${VALLEY.rim}H440V${FLOOR_BOTTOM}H-40Z"/>`);
  // The rope railing along the path (cedar posts, a sagging rope)
  const posts = [10, 92, 174, 256, 338, 420];
  const railing = depth(ctx, 4, posts.map((x) => `<rect x="${x - 3}" y="578" width="6" height="30" rx="1.4" fill="${ref(ctx, 'cedarG')}"/><circle cx="${x}" cy="578" r="3.4" fill="${B.cedarLight}"/>`).join(''), posts.map((x) => `<rect x="${x - 3}" y="576" width="6" height="32"/>`).join(''))
    + `<path d="${posts.slice(1).map((x, i) => `M${posts[i]} 584Q${(posts[i] + x) / 2} 596 ${x} 584`).join('')}" stroke="${B.hinokiLight}" stroke-width="2" fill="none"/>`;
  const floor = floorPage(ctx, water + farBank + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="18" fill="${C.shadow}" opacity=".25"/>` + rim);
  // Low steam drifting over the water's surface (vellum, in front of the bank)
  const steamLow = steamPlume(ctx, 330, 470, 70, 48, 107, { o: 0.32, lean: 18 }) + steamPlume(ctx, 40, 500, 60, 40, 108, { o: 0.28, lean: 12 });
  // The rock by the far vent (Mocha's `rockB`, top at (278, 470)), in the water
  const rockB = softEllipse(ctx, 280, 500, 26, 5, 'shadow', 0.3) + rockLump(ctx, 278, 500, 40, 31, 109)
    + `<path d="M256 500q12 4 26 0q10 -2 20 1" stroke="${B.tealLit}" stroke-width="1.4" fill="none" opacity=".7"/>`;
  // The boardwalk's lamp (Mocha's `lamp`): a cedar post, a hot-spring lantern on top (top at y 368)
  const lamp = depth(ctx, 3, `<rect x="48" y="384" width="8" height="60" fill="${ref(ctx, 'cedarG')}"/><rect x="42" y="380" width="20" height="5" rx="1" fill="${B.cedarDeep}"/>`, `<rect x="42" y="380" width="20" height="64"/>`)
    + hotLantern(ctx, 52, 374, 0.62, '');
  // The valley's sign on the front bank: 「地熱谷」 on a cedar board
  const sign = depth(ctx, 4, `<path d="M326 640V584M376 640V584" stroke="${B.cedarDeep}" stroke-width="4"/><rect x="314" y="566" width="74" height="26" rx="2" fill="${ref(ctx, 'cedarG')}"/>`
    + `<path d="M315 566.8H387" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="314" y="566" width="74" height="74"/>`)
    + `<text data-art-text="" x="351" y="584" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="13" fill="${B.steam}" letter-spacing="2">地熱谷</text>`;
  const ferns = fern(14, 640, 1, 40) + fern(30, 642, 1, 30, B.leaf) + fern(250, 646, -1, 34) + fern(268, 646, 1, 26, B.leaf);
  return beitouDefs(ctx) + standingPage(ctx, sky + ridges + steamBack + shushu + crowns + cliffs + path)
    + floor + vents + pipes + steamLow + rockB + lamp + railing + sign + ferns + bookCues(ctx) + block();
};

// ——— 8-3 「呼呼」 ———

/** A stone lantern (石燈籠) for a garden: a stacked stone post, a lit fire box, a roof cap; its foot at (x, y). */
function stoneLantern(ctx: KitCtx, x: number, y: number, s = 1): string {
  const P = (dx: number, dy: number) => `${f1(x + dx * s)} ${f1(y + dy * s)}`;
  const d = `M${P(-8, 0)}L${P(-6, -20)}H${f1(x + 6 * s)}L${P(8, 0)}ZM${P(-10, -20)}H${f1(x + 10 * s)}V${f1(y - 24 * s)}H${f1(x - 10 * s)}ZM${P(-8, -24)}H${f1(x + 8 * s)}V${f1(y - 38 * s)}H${f1(x - 8 * s)}ZM${P(-16, -38)}Q${P(0, -48)} ${P(16, -38)}L${P(12, -36)}H${f1(x - 12 * s)}Z`;
  return softEllipse(ctx, x, y - 31 * s, 16 * s, 12 * s, 'lamp', 0.4)
    + depth(ctx, 4, `<path d="${d}" fill="${ref(ctx, 'rockG')}"/><rect x="${f1(x - 5 * s)}" y="${f1(y - 35 * s)}" width="${f1(10 * s)}" height="${f1(8 * s)}" fill="${C.lamp}"/>`
      + `<path d="M${P(-15, -38)}Q${P(0, -47)} ${P(15, -38)}" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".4"/>`, `<path d="${d}"/>`);
}

/**
 * 8-3: an open-air hot spring by night (露天風呂), the boardwalk running along the bath. Behind: the
 * bath's far bank of rocks, a cedar fence (板塀) round the garden with the bathhouse's eaves and its
 * hanging lanterns at the left, 北投公園's trees beyond it, and far off the 北投圖書館's green roof among
 * them; steam rising off the water. The water lies behind the boardwalk (the floor page from the far
 * rocks to y 470) with the big rock where Mocha goes (`rock`, its top at (344, 412)). At the near end
 * (left) the bench (Mocha's `bench`: its back's top at (108, 414)) where the 溫泉阿嬤 sits (a creature
 * at (50, 476)); the boardwalk runs on under it to the page's edge. In front: a pebble garden with a
 * stone lantern and ferns, a 「露天風呂」 board.
 */
const bathBoardwalk: BackdropDraw = (ctx) => {
  const sky = beitouSky(ctx, 220, { moon: [318, 62, 20], seed: 111 });
  const ridges = beitouHills(ctx, GUTTER_Y, 112, { far: 170, mid: 196, near: 222 });
  // The library far off among the trees: a long low house under its green roof (a V-fold), lit inside
  const library = depth(ctx, 2, `<path d="M214 236L246 222L300 230V246H214Z" fill="${ref(ctx, 'roofG')}"/><path d="M214 236L246 222L300 230" stroke="${C.cutRim}" stroke-width=".8" fill="none" opacity=".4"/>`
    + `<rect x="220" y="236" width="74" height="14" fill="${B.cedarDeep}"/><rect x="224" y="239" width="66" height="7" fill="${ref(ctx, 'window')}" opacity=".85"/>`
    + `<path d="M232 239v7M244 239v7M256 239v7M268 239v7M280 239v7" stroke="${B.cedarDeep}" stroke-width="1.2"/>`, `<rect x="214" y="222" width="86" height="28"/>`)
    + softEllipse(ctx, 257, 244, 40, 10, 'lamp', 0.2);
  const trees = treeCrown(ctx, 190, 250, 26, 113, B.leafDeep) + treeCrown(ctx, 316, 248, 24, 114, B.leafDeep)
    + treeCrown(ctx, 360, 236, 32, 115) + treeCrown(ctx, 150, 246, 22, 116) + treeCrown(ctx, 400, 252, 22, 117, B.leafDeep);
  // The fence round the garden (cedar boards, a lit cap), the bathhouse's corner with its eaves at the left
  const fence = depth(ctx, 2, planks(130, 268, 420, 348, { w: 13, tone: B.cedar, seed: 118 })
    + `<rect x="128" y="262" width="294" height="7" fill="${B.cedarDeep}"/><path d="M128 262.8H422" stroke="${C.cutRim}" stroke-width="1" opacity=".45"/>`, `<rect x="128" y="262" width="294" height="86"/>`);
  const house = depth(ctx, 2, planks(-20, 214, 140, 348, { w: 14, tone: mixHex(B.cedar, B.cedarDeep, 0.3), seed: 119 })
    + `<rect x="24" y="250" width="90" height="70" fill="${ref(ctx, 'window')}"/><path d="M24 285H114M54 250V320M84 250V320" stroke="${B.cedarDeep}" stroke-width="2.4"/>`
    + `<path d="${Array.from({ length: 12 }, (_, i) => `M${28 + i * 7.6} 250v70`).join('')}" stroke="${B.cedarDeep}" stroke-width=".9" opacity=".6"/>`, `<rect x="-20" y="214" width="160" height="134"/>`)
    + softEllipse(ctx, 69, 290, 70, 40, 'lamp', 0.22, 'blur8')
    + tiledRoof(ctx, -40, 166, 216, 34, 30)
    + hotLantern(ctx, 36, 236, 0.9) + hotLantern(ctx, 128, 236, 0.9)
    + `<path d="M36 222V225M128 222V225" stroke="${C.printDark}" stroke-width="1"/>`;
  // The bath's far bank: rocks along the fence's foot, steam rising off the water against the fence
  const farRocks = rockLump(ctx, 170, 360, 60, 26, 120, { z: 2 }) + rockLump(ctx, 240, 362, 46, 20, 121, { z: 2, sulphur: false })
    + rockLump(ctx, 300, 360, 56, 24, 122, { z: 2 }) + rockLump(ctx, 380, 362, 70, 30, 123, { z: 2, sulphur: false }) + rockLump(ctx, 110, 362, 40, 18, 124, { z: 2, sulphur: false });
  const steamBack = steamPlume(ctx, 210, 356, 130, 60, 125, { o: 0.4, lean: 26 }) + steamPlume(ctx, 330, 358, 110, 54, 126, { o: 0.36, lean: 20 });
  // The floor page: the bath's water from the far bank to the boardwalk (y 470), lantern light on it;
  // in front of the boardwalk, the pebble garden
  const r = seeded(127);
  let ripples = '';
  for (let i = 0; i < 16; i++) {
    const x = -20 + r() * 420, y = 372 + r() * 92;
    ripples += `M${f1(x)} ${f1(y)}q${f1(6 + r() * 6)} -3 ${f1(14 + r() * 10)} 0`;
  }
  const water = `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="120" fill="${ref(ctx, 'poolG')}"/>`
    + `<path d="${ripples}" stroke="${B.tealLit}" stroke-width="1.2" fill="none" opacity=".7" stroke-linecap="round"/>`
    + pools(ctx, [[80, 400, 90, 20], [280, 440, 140, 26, 'spring'], [330, 380, 60, 12, 'moon']])
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="16" fill="${C.shadow}" opacity=".22"/>`;
  const garden = `<rect x="${FLOOR_RECT.x}" y="520" width="${FLOOR_RECT.w}" height="${FLOOR_BOTTOM - 520}" fill="${mixHex(B.rockDeep, B.hillNear, 0.4)}"/>`
    + pebbles(FLOOR_RECT.x, FLOOR_RECT.x + FLOOR_RECT.w, 540, 100, 128, 90)
    + `<path d="M${FLOOR_RECT.x} 560Q100 552 200 566T${FLOOR_RECT.x + FLOOR_RECT.w} 556" stroke="${B.rockLight}" stroke-width="1" fill="none" opacity=".4"/>`;
  const floor = floorPage(ctx, water + garden);
  // The boardwalk under the bench, where the ledges don't reach (x < 96): the same cedar deck
  const deck = depth(ctx, 4, `<rect x="-30" y="480" width="128" height="52" fill="${mixHex(B.cedarDeep, C.shadow, 0.25)}"/>`
    + `<path d="M-16 492V532M24 492V532M64 492V532" stroke="${B.cedar}" stroke-width="6"/>`
    + `<rect x="-30" y="480" width="128" height="12" fill="${B.cedarLight}"/><path d="${woodGrain(-30, 480, 98, 492, 129, false, 3.4)}" stroke="${B.grain}" stroke-width=".6" fill="none" opacity=".4"/>`
    + `<path d="M-30 492H98" stroke="${C.shadow}" stroke-width="1.6" opacity=".35"/>`
    + `<path d="M-30 480L-22 463H98V480Z" fill="${B.cedarLit}"/><path d="M-12 463L-20 480M8 463L1 480M28 463L22 480M48 463L43 480M68 463L64 480M88 463L85 480" stroke="${B.cedarDeep}" stroke-width=".8" opacity=".6"/>`
    + `<path d="M-30 480.5H98" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<path d="M-30 463H98V532H-30Z"/>`);
  // The rock in the bath past the steam (Mocha's `rock`, top at (344, 412))
  const rock = rockLump(ctx, 344, 448, 64, 36, 130, { sulphur: false })
    + `<path d="M312 448q16 5 32 0t32 1" stroke="${B.tealLit}" stroke-width="1.4" fill="none" opacity=".7"/>`;
  // The bench at the near end (its back's top at (108, 414), the seat at y 460), a towel folded on it
  const bench = depth(ctx, 4, `<rect x="18" y="414" width="104" height="8" rx="2" fill="${ref(ctx, 'cedarG')}"/><rect x="18" y="430" width="104" height="6" rx="2" fill="${B.cedar}"/>`
    + `<path d="M28 420V460M112 420V460" stroke="${B.cedarDeep}" stroke-width="4"/>`
    + `<rect x="14" y="456" width="112" height="7" rx="2" fill="${B.hinoki}"/><path d="M24 463V482M116 463V482" stroke="${B.cedarDeep}" stroke-width="4"/>`
    + `<path d="M18 414.8H122M14 456.8H126" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<rect x="14" y="414" width="112" height="68"/>`)
    + depth(ctx, 4, `<path d="M92 456v-6h18v6z" fill="${C.washi}"/><path d="M94 452h14" stroke="${B.towelStripe}" stroke-width="1.4"/>`, `<rect x="92" y="450" width="18" height="6"/>`);
  // The garden in front: a stone lantern, ferns, the 「露天風呂」 board on its post
  const front = stoneLantern(ctx, 350, 620, 1.2) + fern(286, 644, -1, 36) + fern(300, 646, 1, 28, B.leaf) + fern(24, 646, 1, 40) + fern(8, 640, -1, 26, B.leaf)
    + depth(ctx, 4, `<path d="M168 640V600" stroke="${B.cedarDeep}" stroke-width="4"/><rect x="128" y="582" width="80" height="22" rx="2" fill="${ref(ctx, 'cedarG')}"/>`
      + `<path d="M129 582.8H207" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="128" y="582" width="80" height="58"/>`)
    + `<text data-art-text="" x="168" y="597.6" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="11" fill="${B.steam}" letter-spacing="1.4">露天風呂</text>`;
  return beitouDefs(ctx) + standingPage(ctx, sky + ridges + library + trees + fence + house + steamBack + farRocks)
    + floor + rock + deck + bench + front + bookCues(ctx) + block();
};

// ——— 8-4 「北投圖書館」 ———

/** A run of books on a shelf from x0 to x1 at y (their feet), seeded heights and cloth colours. */
function bookRun(x0: number, x1: number, y: number, h: number, seed: number): string {
  const r = seeded(seed);
  const cols = [B.roofGreen, B.lacquer, B.noren, B.hinokiDeep, B.tealDeep, mixHex(C.washiPink, B.cedarDeep, 0.4), B.slateLight];
  let out = '';
  for (let x = x0; x < x1 - 2;) {
    const w = 3 + r() * 3.4;
    const hh = h * (0.7 + r() * 0.3);
    const lean = r() < 0.08 ? 2.4 : 0;
    const c = cols[Math.floor(r() * cols.length)];
    out += `<path d="M${f1(x)} ${f1(y)}L${f1(x + lean)} ${f1(y - hh)}h${f1(w)}L${f1(x + w)} ${f1(y)}Z" fill="${c}"/>`;
    if (r() < 0.4) out += `<path d="M${f1(x + 0.6)} ${f1(y - hh * 0.75)}h${f1(w - 1.2)}" stroke="${C.goldDeep}" stroke-width=".7" opacity=".7"/>`;
    x += w + 0.6;
  }
  return out;
}

/** A cedar bookcase from (x0, top) to (x1, foot) with `rows` shelves of books. */
function bookcase(ctx: KitCtx, x0: number, x1: number, top: number, foot: number, rows: number, seed: number, z: 2 | 3 | 4 = 3): string {
  const h = (foot - top) / rows;
  let books = '';
  let shelves = '';
  for (let i = 0; i < rows; i++) {
    const y = top + h * (i + 1);
    books += bookRun(x0 + 4, x1 - 4, y - 3, h - 8, seed + i);
    shelves += `M${f1(x0)} ${f1(y - 3)}H${f1(x1)}`;
  }
  return depth(ctx, z, `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="${foot - top}" fill="${mixHex(B.cedarDeep, C.shadow, 0.35)}"/>${books}`
    + `<path d="${shelves}" stroke="${B.cedar}" stroke-width="3"/><path d="M${x0 + 1.5} ${top}V${foot}M${x1 - 1.5} ${top}V${foot}" stroke="${B.cedar}" stroke-width="3"/>`
    + `<rect x="${x0 - 2}" y="${top - 4}" width="${x1 - x0 + 4}" height="5" fill="${B.cedarLight}"/><path d="M${x0 - 2} ${top - 3.4}H${x1 + 2}" stroke="${C.cutRim}" stroke-width="1" opacity=".45"/>`,
  `<rect x="${x0 - 2}" y="${top - 4}" width="${x1 - x0 + 4}" height="${foot - top + 4}"/>`);
}

/** A reading lamp hanging on its cord, a green shade over a warm bulb, its light below; `s` scales it. */
function hangingLamp(ctx: KitCtx, x: number, y: number, top: number, s = 1): string {
  const shade = `M${f1(x - 9 * s)} ${f1(y)}L${f1(x - 4 * s)} ${f1(y - 8 * s)}H${f1(x + 4 * s)}L${f1(x + 9 * s)} ${f1(y)}Z`;
  return `<path d="M${x} ${top}V${f1(y - 8 * s)}" stroke="${C.printDark}" stroke-width=".9"/>`
    + softEllipse(ctx, x, y + 14 * s, 26 * s, 18 * s, 'lamp', 0.3, 'blur8')
    + `<path d="${shade}" fill="${B.roofGreen}"/><ellipse cx="${x}" cy="${y}" rx="${f1(7 * s)}" ry="${f1(2.2 * s)}" fill="${C.lampHot}"/>`;
}

/**
 * 8-4: the 北投圖書館 at night, the wooden library in 北投公園 cut open from the side. Its roof is the
 * bible's **green V-fold**: two planes of turf over the timber eaves, folded at the ridge, solar
 * panels set in the turf. Upstairs, the reading room: tall cedar louvres along the glass, the stacks
 * along the back (the ledges are the reading room's floor), green-shaded lamps; the balcony at the left
 * (its floor at y 310; its rail Mocha's `rail`, the top rail at (40, 262); the 土地公 at its door,
 * (112, 272)). Between the floors the book lift's shaft (x 128–252: the belt and the tray are parts).
 * Downstairs: the left wall with its window (the flap, (20, 424)) and the window box outside it where
 * the pinwheel stands (a part at (90, 400)); the ground floor's stacks behind the floor's ledge; the
 * bookcase by the door (Mocha's `bookcase`, its top at (366, 404)) and the lit doorway. The trees of
 * the park round it, the moon.
 */
const library: BackdropDraw = (ctx) => {
  const sky = beitouSky(ctx, 200, { moon: [338, 46, 18], seed: 141, stars: 30 });
  const ridges = beitouHills(ctx, 230, 142, { far: 120, mid: 150, near: 190 });
  const trees = treeCrown(ctx, -6, 150, 34, 143, B.leafDeep, 1) + treeCrown(ctx, 400, 150, 36, 144, B.leafDeep, 1) + treeCrown(ctx, 360, 130, 26, 145, B.leaf, 1);
  // The reading room's back: a dim interior, the stacks along the back wall, the louvred glass at the left
  const room = `<rect x="120" y="170" width="300" height="190" fill="${mixHex(B.cedarDeep, C.shadow, 0.45)}"/>`
    + softEllipse(ctx, 270, 250, 170, 70, 'lamp', 0.2, 'blur18')
    + bookcase(ctx, 140, 230, 206, 306, 3, 146, 2) + bookcase(ctx, 236, 322, 206, 306, 3, 147, 2) + bookcase(ctx, 328, 414, 206, 306, 3, 148, 2)
    + hangingLamp(ctx, 186, 236, 186, 1) + hangingLamp(ctx, 280, 232, 186, 1) + hangingLamp(ctx, 370, 236, 186, 1);
  // The balcony's door and the louvres (vertical cedar slats on the glass)
  let louvres = '';
  for (let x = 4; x < 120; x += 9) louvres += `M${x} 186V306`;
  const facade = depth(ctx, 2, `<rect x="-20" y="178" width="140" height="132" fill="${mixHex(B.tealDeep, C.shadow, 0.4)}"/>`
    + `<rect x="70" y="196" width="40" height="114" fill="${ref(ctx, 'window')}" opacity=".7"/><path d="M90 196V310" stroke="${B.cedarDeep}" stroke-width="2"/>`
    + `<path d="${louvres}" stroke="${B.cedarLight}" stroke-width="4.4"/><path d="${louvres}" stroke="${B.cedarDeep}" stroke-width="1" transform="translate(2 0)"/>`
    + `<rect x="118" y="172" width="8" height="140" fill="${B.cedarDeep}"/>`, `<rect x="-20" y="178" width="146" height="132"/>`);
  // The green V-fold roof: two turf planes meeting at the ridge, the timber eaves under them
  const roofL = 'M-30 186L196 128L196 140L-30 198Z';
  const roofR = 'M196 128L420 172V184L196 140Z';
  let panels = '';
  for (let i = 0; i < 5; i++) {
    const t0 = 0.12 + i * 0.16, t1 = t0 + 0.12;
    const P = (t: number, dy: number) => `${f1(-30 + 226 * t)} ${f1(186 - 58 * t + dy)}`;
    panels += `M${P(t0, -1)}L${P(t1, -1)}L${P(t1, -6)}L${P(t0, -6)}Z`;
  }
  const turf = (d: string, seed: number) => {
    const r = seeded(seed);
    let tufts = '';
    for (let i = 0; i < 40; i++) {
      const t = r();
      const [x, y] = d === roofL ? [-30 + 226 * t, 186 - 58 * t] : [196 + 224 * t, 128 + 44 * t];
      tufts += `M${f1(x)} ${f1(y)}l${f1(-1 + r() * 2)} ${f1(-3 - r() * 3)}`;
    }
    return tufts;
  };
  const roof = depth(ctx, 2, `<path d="${roofL}" fill="${B.roofGreen}"/><path d="${roofR}" fill="${B.roofGreenDeep}"/>`
    + `<path d="M-30 198L196 140L420 184V196L196 152L-30 210Z" fill="${B.cedar}"/>`
    + `<path d="${woodGrain(-30, 198, 420, 208, 149, false, 3)}" stroke="${B.grain}" stroke-width=".5" fill="none" opacity=".3"/>`
    + `<path d="${panels}" fill="${B.slate}"/><path d="${panels}" fill="none" stroke="${B.slateLight}" stroke-width=".6"/>`
    + `<path d="${turf(roofL, 150)}${turf(roofR, 151)}" stroke="${B.leafLight}" stroke-width="1.2" stroke-linecap="round"/>`
    // The fold at the ridge (bible § 3.2: a mountain fold's light ridge beside a dark one)
    + `<path d="M196 128V140" stroke="${C.cutRim}" stroke-width="1.4" opacity=".7"/><path d="M197.4 129V141" stroke="${C.foldAo}" stroke-width=".8" opacity=".6"/>`
    + `<path d="M-30 186L196 128L420 172" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".45"/>`, `<path d="${roofL}${roofR}"/>`);
  // The balcony: its deck at y 310 under the louvres, the railing (Mocha's top rail at (40, 262))
  let balusters = '';
  for (let x = 6; x < 124; x += 8) balusters += `M${x} 266V310`;
  const balcony = depth(ctx, 3, `<rect x="-24" y="306" width="150" height="8" fill="${B.hinoki}"/><path d="M-24 306.8H126" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`
    + `<rect x="-24" y="314" width="152" height="46" fill="${ref(ctx, 'cedarG')}"/><path d="${woodGrain(-24, 316, 128, 358, 152, false, 5)}" stroke="${B.grain}" stroke-width=".6" fill="none" opacity=".35"/>`
    + `<path d="${balusters}" stroke="${B.cedar}" stroke-width="2.6"/><rect x="-24" y="260" width="150" height="6" rx="2" fill="${ref(ctx, 'cedarG')}"/>`
    + `<path d="M-24 260.8H126" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<path d="M-24 260H126V360H-24Z"/>`);
  // The book lift's shaft between the floors: two timber rails, the head beam and its little roof
  const shaft = `<rect x="128" y="300" width="124" height="60" fill="${mixHex(B.cedarDeep, C.shadow, 0.5)}"/>`
    + depth(ctx, 3, `<path d="M132 300V488M248 300V488" stroke="${B.cedarDeep}" stroke-width="6"/><path d="M130 300V488M246 300V488" stroke="${B.cedarLight}" stroke-width="1.4" opacity=".5"/>`
      + `<rect x="124" y="292" width="132" height="10" fill="${B.cedar}"/><path d="M124 292.8H256" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="124" y="292" width="132" height="196"/>`)
    + `<text data-art-text="" x="190" y="300" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7" fill="${B.steam}" letter-spacing="1">送書機</text>`;
  // The floor slab under the reading room (where the ledges don't reach, over the ground floor)
  const slab = `<rect x="252" y="310" width="170" height="50" fill="${ref(ctx, 'cedarG')}"/>`;
  // The floor page: the ground floor's polished boards, lamp pools
  const floor = floorPage(ctx, floorBoards(GUTTER_Y, mixHex(B.hinoki, B.cedar, 0.45), 20)
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="26" fill="${C.shadow}" opacity=".28"/>`
    + pools(ctx, [[300, 470, 140, 26], [190, 520, 100, 20], [60, 480, 60, 14, 'moon']]));
  // Downstairs: the left wall with the window opening (the flap covers it) and the window box outside
  const wall = depth(ctx, 3, planks(-24, 362, 124, 488, { w: 12, tone: B.cedar, seed: 153 })
    + `<rect x="22" y="426" width="44" height="40" fill="${mixHex(B.hillNear, C.shadow, 0.2)}"/>`
    + pinholes(ctx, 24, 428, 40, 18, 5, 154)
    + `<path d="M22 426h44v40h-44z" fill="none" stroke="${B.cedarDeep}" stroke-width="3"/>`
    + `<path d="M-24 362.8H124" stroke="${C.cutRim}" stroke-width="1" opacity=".4"/>`, `<rect x="-24" y="362" width="148" height="126"/>`);
  const windowBox = depth(ctx, 4, `<path d="M66 432H116L112 446H70Z" fill="${ref(ctx, 'cedarG')}"/><path d="M66 432.8H116" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`
    + `<path d="M72 446l-4 8M110 446l4 8" stroke="${B.cedarDeep}" stroke-width="2"/>`, `<path d="M66 432H116L112 446H70Z"/>`)
    + `<path d="M72 432q-2 -10 4 -14M80 432q0 -12 6 -14M104 432q2 -10 -2 -14M110 432q4 -8 0 -12" stroke="${B.leafLight}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`
    + `<circle cx="78" cy="417" r="2.4" fill="${C.washiPink}"/><circle cx="106" cy="418" r="2.4" fill="${C.washi}"/>`;
  // The ground floor's stacks behind the floor's ledge, the bookcase by the door, the lit doorway
  const stacks = bookcase(ctx, 252, 336, 392, 474, 3, 155, 3);
  const door = depth(ctx, 3, `<rect x="390" y="378" width="40" height="110" fill="${ref(ctx, 'window')}"/><path d="M388 378V488" stroke="${B.cedarDeep}" stroke-width="5"/>`, `<rect x="386" y="378" width="44" height="110"/>`)
    + softEllipse(ctx, 400, 470, 40, 14, 'lamp', 0.35);
  const caseByDoor = bookcase(ctx, 344, 388, 404, 482, 3, 156, 4);
  // In front: a reading table with its green lamp and an open book; a potted fern by the door
  const table = depth(ctx, 4, `<rect x="18" y="584" width="120" height="8" rx="2" fill="${ref(ctx, 'hinokiG')}"/><path d="M28 592V640M128 592V640" stroke="${B.cedarDeep}" stroke-width="5"/>`
    + `<path d="M19 584.8H137" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="18" y="584" width="120" height="56"/>`)
    + `<path d="M58 584q10 -4 20 0q10 -4 20 0v-3q-10 -4 -20 0q-10 -4 -20 0z" fill="${C.washi}"/><path d="M78 581v3" stroke="${B.hinokiDeep}" stroke-width=".8"/>`
    + `<path d="M118 584V560" stroke="${B.brassDeep}" stroke-width="2"/>` + `<path d="M108 560L112 552H124L128 560Z" fill="${B.roofGreen}"/>` + softEllipse(ctx, 118, 572, 24, 14, 'lamp', 0.35);
  const plant = depth(ctx, 4, `<path d="M330 640L334 616H362L366 640Z" fill="${B.brick}"/>`, `<path d="M330 640L334 616H362L366 640Z"/>`) + fern(348, 616, -1, 34) + fern(348, 616, 1, 30, B.leaf);
  return beitouDefs(ctx) + standingPage(ctx, sky + ridges + trees + room + facade + roof + slab + shaft + balcony)
    + floor + wall + windowBox + stacks + door + caseByDoor + table + plant + bookCues(ctx) + block();
};

// ——— 8-5 「大浴池」 ———

/** 8-5's bath: its tiled hollow from x 108 to 316, the far rim (y 436), the bottom (512 at the back), the front lip (540). */
const BATH = { x0: 108, x1: 316, rim: 436, bottom: 512, lip: 540 };

/**
 * The bathhouse's wall painting (a 錢湯 mural, 北投's own): 大屯山 and 紗帽山 in soft teal and
 * lilac over a pale sky, the valley's steam rising, a little red bridge, two egrets.
 */
function mural(ctx: KitCtx, x0: number, y0: number, x1: number, y1: number): string {
  const w = x1 - x0, h = y1 - y0;
  const P = (fx: number, fy: number) => `${f1(x0 + w * fx)} ${f1(y0 + h * fy)}`;
  return `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${ref(ctx, 'muralSky')}"/>`
    + `<circle cx="${f1(x0 + w * 0.8)}" cy="${f1(y0 + h * 0.22)}" r="${f1(h * 0.1)}" fill="${C.washi}" opacity=".8"/>`
    + `<path d="M${P(0, 0.7)}L${P(0.18, 0.32)}Q${P(0.3, 0.2)} ${P(0.42, 0.34)}L${P(0.58, 0.52)}L${P(0.74, 0.36)}L${P(1, 0.62)}V${f1(y1)}H${f1(x0)}Z" fill="${mixHex(B.tealLight, B.hillFar, 0.25)}"/>`
    + `<path d="M${P(0.14, 0.38)}L${P(0.18, 0.32)}Q${P(0.3, 0.2)} ${P(0.42, 0.34)}L${P(0.38, 0.38)}Q${P(0.28, 0.3)} ${P(0.2, 0.4)}Z" fill="${C.washi}" opacity=".7"/>`
    + `<path d="M${P(0, 0.86)}Q${P(0.3, 0.6)} ${P(0.52, 0.74)}Q${P(0.72, 0.62)} ${P(1, 0.8)}V${f1(y1)}H${f1(x0)}Z" fill="${B.teal}"/>`
    + `<path d="M${P(0.4, 0.8)}q${f1(-w * 0.03)} ${f1(-h * 0.12)} 0 ${f1(-h * 0.24)}t0 ${f1(-h * 0.22)}M${P(0.48, 0.8)}q${f1(-w * 0.03)} ${f1(-h * 0.1)} 0 ${f1(-h * 0.2)}t0 ${f1(-h * 0.18)}" stroke="${C.washi}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`
    + `<path d="M${P(0.66, 0.9)}q${f1(w * 0.06)} ${f1(-h * 0.1)} ${f1(w * 0.12)} 0" stroke="${C.hatRed}" stroke-width="3" fill="none"/><path d="M${P(0.68, 0.9)}v${f1(h * 0.06)}M${P(0.76, 0.9)}v${f1(h * 0.06)}" stroke="${C.hatRed}" stroke-width="2"/>`
    + `<path d="M${P(0.2, 0.18)}l4 -3l4 3l4 -3l4 3M${P(0.26, 0.12)}l3 -2l3 2l3 -2l3 2" stroke="${C.washi}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
    + `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${C.shadow}" opacity=".26"/>`;
}

/**
 * 8-5: the old bathhouse's big bath (大浴池) after hours. High up, the clerestory's lattice windows on
 * the night; the wall painting of 北投's hills over the bath; the tiled wall below with the brass tap
 * (the wheel, at (72, 290)) and its spout over the bath. On the floor page the tiled bath (x 108–316:
 * its far rim at y 436, the bottom at 512, the front lip at 540) with the stepping stone on its bottom
 * (Mocha's `stone`, its top at (196, 500)); the water and the tubs are parts. Left: the near deck's
 * stack of hinoki bath stools (Mocha's `stools`, its top at (52, 388)). Right: the stone step, and the
 * bathhouse's little shop counter (Mocha's `counter`, its top at (352, 382)) with the 店員小哥 behind
 * it — the chapter's cameo — under its noren, milk in glass bottles on the shelf. The 土地公 soaks in
 * the far corner (318, 430) while the bath is full.
 */
const bigBath: BackdropDraw = (ctx) => {
  // The wall: the clerestory's lattice windows high up, the cedar beams, the mural, the tiles
  let lattice = '';
  for (let x = -20; x < 410; x += 10) lattice += `M${x} 18V64`;
  const clere = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="80" fill="${ref(ctx, 'sky')}"/>` + pinholes(ctx, 0, 6, PAGE_W, 60, 22, 161)
    + softEllipse(ctx, 300, 40, 18, 18, 'lamp', 0.12)
    + `<path d="${lattice}M-20 40H410" stroke="${B.cedarDeep}" stroke-width="2.4"/>`
    + `<rect x="-20" y="0" width="${PAGE_W + 40}" height="16" fill="${B.cedarDeep}"/><rect x="-20" y="64" width="${PAGE_W + 40}" height="20" fill="${ref(ctx, 'cedarG')}"/>`
    + `<path d="M-20 64.8H410" stroke="${C.cutRim}" stroke-width="1" opacity=".4"/>`;
  const wallUp = `<rect x="-20" y="84" width="${PAGE_W + 40}" height="160" fill="${mixHex(mixHex(B.carWall, B.tile, 0.4), B.hill, 0.55)}"/>`
    + softEllipse(ctx, 217, 170, 190, 80, 'lamp', 0.12, 'blur18')
    + depth(ctx, 1, mural(ctx, 104, 96, 330, 236) + `<rect x="104" y="96" width="226" height="140" fill="none" stroke="${B.cedarDeep}" stroke-width="4"/>`, `<rect x="102" y="94" width="230" height="144"/>`);
  const tiles = mosaic(-20, 244, PAGE_W + 20, GUTTER_Y, 8, 162, mixHex(B.tile, B.hill, 0.48), 0.4)
    + `<rect x="-20" y="242" width="${PAGE_W + 40}" height="5" fill="${B.tileShade}"/><path d="M-20 242.6H410" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`;
  // The tap's pipe from the wheel down the tiles to the spout over the bath's near end
  const pipe = `<path d="M72 322V346Q72 352 78 352H112" stroke="${B.brassDeep}" stroke-width="7" fill="none" stroke-linecap="round"/>`
    + `<path d="M72 322V346Q72 352 78 352H112" stroke="${ref(ctx, 'brassG')}" stroke-width="4.4" fill="none" stroke-linecap="round"/>`
    + `<path d="M110 348h8v10h-8z" fill="${B.brassDeep}"/><path d="M114 358v5" stroke="${B.tealLit}" stroke-width="2" stroke-linecap="round" opacity=".8"/>`;
  // The shop corner on the right: its noren, the shelf of milk bottles, the 店員小哥 behind the counter
  const noren = depth(ctx, 2, `<rect x="306" y="252" width="104" height="5" fill="${B.cedarDeep}"/>${[0, 1, 2].map((i) => `<path d="M${310 + i * 33} 257h30v30q-15 4 -30 0z" fill="${B.noren}"/>`).join('')}`, `<rect x="306" y="252" width="104" height="38"/>`)
    + ['販', '賣', '部'].map((t, i) => `<text data-art-text="" x="${325 + i * 33}" y="279" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="11" fill="${C.washi}">${t}</text>`).join('');
  const bottles = depth(ctx, 2, `<rect x="312" y="318" width="96" height="4" fill="${B.cedar}"/>`
    + [318, 330, 342, 354, 366, 378, 390].map((x, i) => `<path d="M${x} 318v-14q0 -3 2 -4v-3h4v3q2 1 2 4v14z" fill="${C.washi}" opacity=".95"/><rect x="${x}" y="${i % 2 ? 306 : 308}" width="8" height="5" fill="${i % 3 === 0 ? B.towelStripe : i % 3 === 1 ? B.hinokiDeep : C.washiPink}"/>`).join(''), `<rect x="312" y="296" width="96" height="26"/>`);
  const shop = clerk(ctx, 372, 368);
  // The floor page: the bath hall's tiled floor; the bath sunk in it; the far deck's tiles
  const { x0, x1, rim, bottom, lip } = BATH;
  const bath = `<rect x="${x0}" y="${rim}" width="${x1 - x0}" height="${bottom - rim}" fill="${mixHex(B.tileShade, B.hill, 0.3)}"/>`
    + mosaic(x0, rim + 6, x1, bottom, 8, 163, mixHex(mixHex(B.tile, B.tealLight, 0.3), B.hill, 0.3))
    + `<rect x="${x0}" y="${bottom}" width="${x1 - x0}" height="${lip - bottom}" fill="${mixHex(mixHex(B.tileShade, B.tealDeep, 0.3), B.hill, 0.3)}"/>`
    + (() => {
      let d = '';
      for (let y = bottom + 7; y < lip; y += 7) d += `M${x0} ${y}H${x1}`;
      for (let x = x0 + 10; x < x1; x += 14) d += `M${x} ${bottom}L${f1(x + (x - 212) * 0.05)} ${lip}`;
      return `<path d="${d}" stroke="${B.grout}" stroke-width=".7" opacity=".7"/>`;
    })()
    + `<rect x="${x0 - 4}" y="${rim - 6}" width="${x1 - x0 + 8}" height="8" fill="${mixHex(B.tile, B.hill, 0.25)}"/><path d="M${x0 - 4} ${rim - 5.4}H${x1 + 4}" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`;
  const floor = floorPage(ctx, mosaic(FLOOR_RECT.x, GUTTER_Y, FLOOR_RECT.x + FLOOR_RECT.w, FLOOR_BOTTOM, 12, 164, mixHex(B.tileShade, B.hill, 0.45), 0.25)
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="24" fill="${C.shadow}" opacity=".25"/>`
    + bath
    + `<path d="M${FLOOR_RECT.x} 600H${FLOOR_RECT.x + FLOOR_RECT.w}" stroke="${B.grout}" stroke-width="5"/><path d="M${FLOOR_RECT.x} 598.6H${FLOOR_RECT.x + FLOOR_RECT.w}" stroke="${B.tileShade}" stroke-width="1"/>`
    + pools(ctx, [[212, 480, 120, 30, 'spring'], [352, 430, 70, 18], [52, 470, 60, 14, 'moon']]));
  // The bath's front lip (tiled) over the water's foot
  const lipArt = depth(ctx, 4, `<rect x="${x0 - 6}" y="${lip}" width="${x1 - x0 + 12}" height="12" fill="${mixHex(B.tile, B.hill, 0.3)}"/><path d="M${x0 - 6} ${lip + 0.6}H${x1 + 6}" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`
    + `<path d="${Array.from({ length: 26 }, (_, i) => `M${x0 - 6 + i * 8.5} ${lip}v12`).join('')}" stroke="${B.grout}" stroke-width=".6" opacity=".6"/>`, `<rect x="${x0 - 6}" y="${lip}" width="${x1 - x0 + 12}" height="12"/>`);
  // The stepping stone on the bath's bottom (Mocha's `stone`, top at (196, 500))
  const stone = softEllipse(ctx, 198, 515, 20, 3, 'shadow', 0.4)
    + depth(ctx, 3, `<path d="M178 514Q176 500 196 499Q216 500 214 514Z" fill="${ref(ctx, 'rockG')}"/><path d="M182 506Q190 501 200 501" stroke="${B.rockLight}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`, `<path d="M178 514Q176 500 196 499Q216 500 214 514Z"/>`);
  // The stack of hinoki stools on the near deck (Mocha's `stools`, top at (52, 388))
  const stool = (y: number) => `<path d="M34 ${y}h36v5h-36z" fill="${B.hinokiLight}"/><path d="M37 ${y + 5}v13h5v-9h20v9h5v-13z" fill="${B.hinoki}"/>`
    + `<path d="M34 ${y + 0.6}h36" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`;
  const stools = depth(ctx, 3, stool(388) + stool(406) + stool(424), `<rect x="34" y="388" width="36" height="56"/>`)
    + depth(ctx, 3, `<path d="M78 442q0 -10 10 -10h8q10 0 10 10z" fill="${B.hinoki}"/><path d="M78 438h28" stroke="${B.brassDeep}" stroke-width="1.6"/>`, `<rect x="78" y="432" width="28" height="10"/>`);
  // The shop counter (Mocha's `counter`, top at (352, 382)): cedar, a glass front showing more bottles
  const counter = depth(ctx, 3, `<rect x="318" y="382" width="86" height="64" fill="${ref(ctx, 'cedarG')}"/><rect x="314" y="378" width="94" height="6" rx="2" fill="${B.hinokiLight}"/>`
    + `<rect x="324" y="392" width="74" height="26" fill="${C.glassine}" opacity=".3"/>`
    + [330, 344, 358, 372, 386].map((x) => `<path d="M${x} 416v-12q0 -2 2 -3v-2h3v2q2 1 2 3v12z" fill="${C.washi}" opacity=".9"/>`).join('')
    + `<path d="M314 378.8H408" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<rect x="314" y="378" width="94" height="68"/>`)
    + `<text data-art-text="" x="361" y="436" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${B.steam}">牛乳</text>`;
  // Steam over the bath, low and soft
  const steam = steamPlume(ctx, 150, 452, 90, 54, 165, { o: 0.3, lean: 16 }) + steamPlume(ctx, 270, 454, 100, 56, 166, { o: 0.28, lean: 20 });
  // In front: two hinoki buckets and a stool on the tiles, a towel
  const front = depth(ctx, 4, `<path d="M40 632q0 -16 16 -16h12q16 0 16 16z" fill="${B.hinoki}"/><path d="M40 626h44" stroke="${B.brassDeep}" stroke-width="2"/>`
    + `<path d="M300 636h44v6h-44z" fill="${B.hinokiLight}"/><path d="M304 642v8M340 642v8" stroke="${B.hinoki}" stroke-width="5"/>`
    + `<path d="M308 636v-5h28v5z" fill="${C.washi}"/><path d="M310 633h24" stroke="${B.towelStripe}" stroke-width="1.4"/>`, `<rect x="40" y="616" width="44" height="16"/><rect x="300" y="631" width="44" height="19"/>`);
  // Two paper lanterns hung from the beam, warm on the tiles
  const lanterns = `<path d="M44 84V136M352 84V136" stroke="${C.printDark}" stroke-width="1"/>` + hotLantern(ctx, 44, 150, 1.05) + hotLantern(ctx, 352, 150, 1.05)
    + softEllipse(ctx, 44, 250, 70, 50, 'lamp', 0.1, 'blur18') + softEllipse(ctx, 352, 250, 70, 50, 'lamp', 0.1, 'blur18');
  return beitouDefs(ctx) + standingPage(ctx, clere + wallUp + tiles + lanterns + pipe + noren + bottles + shop)
    + floor + stone + steam + lipArt + stools + counter + front + bookCues(ctx) + block();
};

// ——— 8-6 「澡堂的算盤」 (spread) ———

/** 8-6's abacus frame: its posts, its beams and the rods' lines (each rod 9 under its bead block's deck). */
const ABACUS = { x0: 140, x1: 292, top: 410, foot: 500, rods: [437, 459, 481] };

/**
 * 8-6, the centrefold (its spine's crease drawn live): the old bathhouse's front hall at night. Left
 * page: the wooden shoe lockers with their tags, the price board (「大人 五十 · 囡仔 免錢」), the wall
 * clock, the noren doorway into the baths (「湯」) with steam curling out under it, a paper lantern; the
 * stack of wooden buckets on the floor (Mocha's `buckets`, its top at (60, 430)); the giant abacus
 * leaning against the counter (its frame and rods; the bead blocks are carriages). Right page: the
 * 番台 — the high cedar booth where the cashier sits behind her little shoji window (a part at (336,
 * 382)), the raised desk over it where the bell sits (Mocha's `bell`, (340, 318)), the brass hot-water
 * urn beside it (the 土地公 at its foot, (354, 336)) whose plume swirls the wrong way with 咻咻 in it;
 * the counter (the ledges) where the 算盤 lies. The rods' handles at the page's foot are parts.
 */
const bathhouseHall: BackdropDraw = (ctx) => {
  // The back wall: cedar boards over a plaster dado, ceiling beams
  const wall = planks(-20, 30, PAGE_W + 20, 250, { w: 15, tone: mixHex(B.cedar, B.cedarDeep, 0.25), seed: 171 })
    + `<rect x="-20" y="250" width="${PAGE_W + 40}" height="110" fill="${mixHex(mixHex(B.carWall, B.carWallShade, 0.6), B.hill, 0.35)}"/>`
    + `<rect x="-20" y="246" width="${PAGE_W + 40}" height="6" fill="${B.cedarDeep}"/>`
    + `<rect x="-20" y="0" width="${PAGE_W + 40}" height="30" fill="${B.cedarDeep}"/><path d="M-20 30H410" stroke="${B.cedarLight}" stroke-width="3"/>`;
  // The shoe lockers (下駄箱): a grid of cedar doors with wooden number tags
  let lockers = '';
  const nums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千'];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 10 + col * 30, y = 150 + row * 34;
      lockers += `<rect x="${x}" y="${y}" width="27" height="31" fill="${B.cedarLight}"/><rect x="${x + 8}" y="${y + 7}" width="11" height="15" rx="1" fill="${C.washi}"/>`
        + `<text data-art-text="" x="${x + 13.5}" y="${y + 18}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${B.cedarDeep}">${nums[row * 4 + col]}</text>`;
    }
  }
  const lockerArt = depth(ctx, 2, `<rect x="4" y="144" width="130" height="114" fill="${B.cedarDeep}"/>${lockers}`, `<rect x="4" y="144" width="130" height="114"/>`);
  // The price board and the clock above the lockers
  const board = depth(ctx, 2, `<rect x="12" y="62" width="112" height="64" rx="2" fill="${B.cedarDeep}"/><rect x="16" y="66" width="104" height="56" fill="${C.washi}"/>`, `<rect x="12" y="62" width="112" height="64"/>`)
    + `<text data-art-text="" x="68" y="82" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="11" fill="${C.hatRed}" letter-spacing="2">入浴料</text>`
    + `<text data-art-text="" x="68" y="99" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="700" font-size="9" fill="${C.printDark}">大人 五十</text>`
    + `<text data-art-text="" x="68" y="114" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="700" font-size="9" fill="${C.printDark}">囡仔 免錢</text>`;
  const clock = depth(ctx, 2, `<circle cx="160" cy="84" r="16" fill="${B.cedarDeep}"/><circle cx="160" cy="84" r="12.4" fill="${C.washi}"/>`
    + `<path d="M160 84V75M160 84L166 88" stroke="${C.printDark}" stroke-width="1.6" stroke-linecap="round"/><path d="M160 100v16" stroke="${B.brassDeep}" stroke-width="1.4"/><circle cx="160" cy="118" r="3" fill="${ref(ctx, 'foil')}"/>`, `<circle cx="160" cy="84" r="16"/>`);
  // The noren doorway into the baths, steam curling out from under it
  const doorway = `<rect x="150" y="150" width="96" height="210" fill="${mixHex(B.tealDeep, C.shadow, 0.35)}"/>` + softEllipse(ctx, 198, 300, 50, 60, 'lamp', 0.14, 'blur8')
    + depth(ctx, 2, `<rect x="144" y="144" width="108" height="8" fill="${B.cedarDeep}"/>`
      + `<path d="M150 152h46v74q-23 6 -46 0zM200 152h46v74q-23 6 -46 0z" fill="${B.noren}"/><path d="M150 214h46M200 214h46" stroke="${B.norenDeep}" stroke-width="2"/>`, `<rect x="144" y="144" width="108" height="84"/>`)
    + `<text data-art-text="" x="198" y="198" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="30" fill="${C.washi}">湯</text>`
    + steamPlume(ctx, 176, 356, 110, 40, 172, { o: 0.42, lean: -10 }) + steamPlume(ctx, 222, 356, 100, 36, 173, { o: 0.38, lean: 12 });
  const lantern = `<path d="M128 30V48" stroke="${C.printDark}" stroke-width="1"/>` + hotLantern(ctx, 128, 64, 1.1);
  // The right page's wall behind the 番台: a framed 「福」, the women's side's noren beyond it
  const fu = depth(ctx, 2, `<rect x="282" y="56" width="58" height="58" fill="${B.cedarDeep}"/><rect x="287" y="61" width="48" height="48" fill="${C.hatRed}" transform="rotate(45 311 85)"/>`, `<rect x="282" y="56" width="58" height="58"/>`)
    + `<text data-art-text="" x="311" y="94" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="22" fill="${ref(ctx, 'foil')}">福</text>`;
  const norenW = depth(ctx, 2, `<rect x="350" y="144" width="70" height="8" fill="${B.cedarDeep}"/><path d="M354 152h56v70q-28 6 -56 0z" fill="${mixHex(B.lacquer, C.washiPink, 0.25)}"/>`, `<rect x="350" y="144" width="70" height="80"/>`)
    + `<text data-art-text="" x="382" y="196" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="18" fill="${C.washi}">女</text>`;
  // The 番台: a tall cedar booth with lacquered rails; its raised desk (top y 326) over the window
  const booth = depth(ctx, 3, `<rect x="296" y="326" width="110" height="80" fill="${ref(ctx, 'cedarG')}"/>`
    + `<path d="${woodGrain(296, 330, 406, 406, 174, true, 6)}" stroke="${B.grain}" stroke-width=".6" fill="none" opacity=".35"/>`
    + `<rect x="314" y="360" width="44" height="44" fill="${mixHex(B.cedarDeep, C.shadow, 0.4)}"/>`
    + `<rect x="290" y="320" width="122" height="8" rx="2" fill="${ref(ctx, 'lacquerG')}"/><path d="M290 320.8H412" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`
    + `<path d="M298 330V404M404 330V404" stroke="${B.lacquerDeep}" stroke-width="4"/>`, `<rect x="290" y="320" width="122" height="86"/>`)
    + `<text data-art-text="" x="384" y="358" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="10" fill="${B.steam}" letter-spacing="1" writing-mode="tb">番台</text>`;
  // The brass hot-water urn on the desk (right of the bell): a round body, a lid, a little tap
  const urn = (() => {
    const body = 'M360 320Q352 296 362 286Q374 280 386 286Q396 296 388 320Z';
    return softEllipse(ctx, 374, 300, 30, 26, 'lamp', 0.12, 'blur8')
      + depth(ctx, 3, `<path d="${body}" fill="${ref(ctx, 'brassG')}"/><path d="M362 286Q374 278 386 286V282Q374 274 362 282Z" fill="${B.brassDeep}"/><circle cx="374" cy="274" r="3" fill="${B.brassDeep}"/>`
        + `<path d="M358 306h-6v4h6" fill="${B.brassDeep}" stroke="${B.brassDeep}" stroke-width="1.6"/><path d="M364 292Q362 302 366 314" stroke="${C.cutRim}" stroke-width="1.6" fill="none" opacity=".45"/>`
        + `<path d="M356 320H392" stroke="${B.brassDeep}" stroke-width="3"/>`, `<path d="${body}"/>`);
  })();
  // 咻咻's beat: the urn's plume swirling the wrong way, the little cloud in its eye
  const swirl = wrongSwirl(ctx, 352, 232, 0.9);
  // The floor page: the hall's polished floorboards, a lantern's warm pool, the 番台's
  const floor = floorPage(ctx, floorBoards(GUTTER_Y, mixHex(B.hinoki, B.cedarLight, 0.4), 22)
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="24" fill="${C.shadow}" opacity=".26"/>`
    + pools(ctx, [[128, 430, 110, 24], [340, 450, 90, 22], [216, 540, 140, 26]]));
  // The stack of wooden buckets (Mocha's `buckets`, top at (60, 430))
  const bucket = (y: number, s: number) => {
    const d = `M${f1(60 - 20 * s)} ${y}L${f1(60 - 16 * s)} ${f1(y + 20)}H${f1(60 + 16 * s)}L${f1(60 + 20 * s)} ${y}Z`;
    return `<path d="${d}" fill="${ref(ctx, 'hinokiH')}"/><path d="M${f1(60 - 19 * s)} ${y + 5}H${f1(60 + 19 * s)}M${f1(60 - 17 * s)} ${y + 15}H${f1(60 + 17 * s)}" stroke="${B.brassDeep}" stroke-width="2"/>`
      + `<ellipse cx="60" cy="${y}" rx="${f1(20 * s)}" ry="3.6" fill="${B.hinokiDeep}"/>`;
  };
  const buckets = depth(ctx, 3, bucket(472, 1.1) + bucket(451, 1) + bucket(430, 0.9), `<rect x="38" y="426" width="44" height="66"/>`);
  // The giant abacus leaning against the counter: its rosewood frame, the beam, the brass rods
  const { x0, x1, top, foot, rods } = ABACUS;
  const frame = depth(ctx, 3, `<rect x="${x0 - 8}" y="${top - 8}" width="${x1 - x0 + 16}" height="12" rx="2" fill="${ref(ctx, 'cedarG')}"/><rect x="${x0 - 8}" y="${foot - 4}" width="${x1 - x0 + 16}" height="12" rx="2" fill="${ref(ctx, 'cedarG')}"/>`
    + `<rect x="${x0 - 8}" y="${top - 8}" width="11" height="${foot - top + 16}" fill="${ref(ctx, 'cedarH')}"/><rect x="${x1 - 3}" y="${top - 8}" width="11" height="${foot - top + 16}" fill="${ref(ctx, 'cedarH')}"/>`
    + `<path d="M${x0 - 7} ${top - 7.2}H${x1 + 7}M${x0 - 7} ${foot - 3.2}H${x1 + 7}" stroke="${C.cutRim}" stroke-width="1.2" opacity=".5"/>`
    + rods.map((y) => `<path d="M${x0} ${y}H${x1}" stroke="${B.brassDeep}" stroke-width="3.4"/><path d="M${x0} ${y - 1}H${x1}" stroke="${mixHex(B.brass, C.cutRim, 0.45)}" stroke-width="1"/>`).join('')
    + [[x0 - 3, top - 3], [x1 + 3, top - 3], [x0 - 3, foot + 3], [x1 + 3, foot + 3]].map(([x, y]) => `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="1.6" fill="${ref(ctx, 'foil')}"/>`).join(''),
  `<rect x="${x0 - 8}" y="${top - 8}" width="${x1 - x0 + 16}" height="${foot - top + 20}"/>`)
    + `<rect x="${x0 + 3}" y="${top + 4}" width="${x1 - x0 - 6}" height="${foot - top - 8}" fill="${C.shadow}" opacity=".14"/>`;
  // The rods' cords: from each rod's right end down to its handle's slot at the page's foot (a bead on a string)
  const cords = [[156, 106], [216, 186], [276, 266]].map(([bx, sx]) => `<path d="M${bx} ${foot + 6}Q${f1((bx + sx) / 2 + 6)} ${foot + 14} ${sx} 524" stroke="${C.hatRed}" stroke-width="1.4" fill="none" opacity=".75"/><circle cx="${bx}" cy="${foot + 6}" r="1.8" fill="${C.hatRed}"/>`).join('');
  // In front: a low wooden bench for taking off shoes, slippers by it
  const front = depth(ctx, 4, `<rect x="250" y="604" width="140" height="9" rx="2" fill="${ref(ctx, 'hinokiG')}"/><path d="M262 613V646M378 613V646" stroke="${B.cedarDeep}" stroke-width="6"/>`
    + `<path d="M251 604.8H389" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="250" y="604" width="140" height="42"/>`)
    + depth(ctx, 4, `<path d="M20 632q0 -6 10 -6h14q4 0 4 6zM52 636q0 -6 10 -6h14q4 0 4 6z" fill="${M.slipperBlue}"/><path d="M24 630h20M56 634h20" stroke="${C.washi}" stroke-width="1.4"/>`, `<rect x="20" y="626" width="60" height="10"/>`);
  return beitouDefs(ctx) + standingPage(ctx, wall + board + clock + lockerArt + doorway + lantern + fu + norenW + swirl)
    + floor + buckets + frame + cords + booth + urn + front + bookCues(ctx) + block();
};

export const C8_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'c8/hot-spring-train': hotSpringTrain,
  'c8/thermal-valley': thermalValley,
  'c8/bath-boardwalk': bathBoardwalk,
  'c8/library': library,
  'c8/big-bath': bigBath,
  'c8/bathhouse-hall': bathhouseHall,
};

// ——— Parts ———

// 8-1's seat cushions

/** A seat's flat cushion (a `button` each: the dent he leaves), centred on the seat: washi pink with a ♨-steam print; `down`, dented. */
const seatCushion: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -28, y: -14, w: 58, h: 26 },
  draw(ctx, state) {
    const down = state === 'down';
    const top = down ? 'M-23 2Q-13 -3 -6 1Q0 4 6 1Q13 -3 23 2V8H-23Z' : 'M-23 2Q0 -8 23 2V8H-23Z';
    const print = `<path d="M-6 3q-2 -3 0 -5M0 3q-2 -3 0 -5M6 3q-2 -3 0 -5" stroke="${C.washi}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/>`;
    return depth(ctx, 1, `<path d="${top}" fill="${C.washiPink}"/>${print}<path d="M-23 8H23" stroke="${C.peonyDeep}" stroke-width="1.6"/>`
      + `<path d="M-15 5h30" stroke="${C.standeeCard}" stroke-width=".8" opacity=".6" stroke-dasharray="2 2"/>`
      + (down ? `<path d="M-8 1.4q8 3 16 0" stroke="${C.peonyDeep}" stroke-width="1" fill="none" opacity=".7"/>` : `<path d="M-18 1q10 -5 20 -5" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".5"/>`), `<path d="${top}"/>`);
  },
};

// Steam

/**
 * Steam over a boardwalk or a counter (a `blowable`: `fog` / `clear`), its centre at the origin:
 * fogged, a cloud of vellum billows, densest low down, with loose curls on top — thick enough that
 * he won't crawl into it; blown clear, a few thin wisps curling away to the right.
 */
const steam: PartSource = {
  preset: 'blowable',
  states: ['fog', 'clear'],
  box: { x: -50, y: -60, w: 104, h: 112 },
  draw(ctx, state) {
    if (state === 'clear') {
      return `<g stroke="${B.steam}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".5">`
        + '<path d="M-22 26q-6 -10 2 -18t0 -18"/><path d="M12 30q6 -10 -2 -18t2 -16"/><path d="M30 6q8 -4 12 -12"/></g>';
    }
    const r = seeded(131);
    let puffs = '';
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const x = (r() - 0.5) * (70 - t * 30), y = 34 - t * 74 + (r() - 0.5) * 10;
      puffs += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(11 + r() * 8 - t * 4)}" opacity="${f1(0.75 - t * 0.45)}"/>`;
    }
    return `<g fill="${B.steam}"${blur(ctx)}>${puffs}</g>`
      + `<path d="M-30 18q8 -12 22 -10M2 4q10 -12 24 -6M-18 -16q8 -10 20 -6" stroke="${C.vellum}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".75"/>`
      + `<path d="M-8 -44q-6 -8 0 -14M10 -40q6 -6 0 -12" stroke="${B.steam}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`;
  },
};

// 8-2's paper clouds and valves

/**
 * 8-2's paper clouds over the vents (a `lift` each, drawn where its node is: he sits on top): a
 * puffy cloud of vellum over card, its flat top a cushion of steam. `up`, it floats on the vent's
 * rising column; `down`, it has sunk onto its vent, limp.
 */
const steamCloud: PartSource = {
  preset: 'lift',
  states: ['down', 'up'],
  box: { x: -44, y: -12, w: 88, h: 80 },
  draw(ctx, state) {
    const up = state === 'up';
    const cloud = 'M-30 12Q-38 12 -36 4Q-34 -4 -24 -2Q-22 -10 -10 -9Q0 -14 10 -9Q22 -11 24 -2Q36 -4 36 6Q36 13 28 12Z';
    const column = up ? `<path d="M-14 66Q-20 44 -8 30Q0 22 -4 12M12 66Q18 46 8 32Q2 22 6 12" stroke="${B.steam}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>`
      + `<path d="M0 66Q-6 40 4 16" stroke="${B.steam}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".35"/>` : '';
    const body = depth(ctx, 2, `<path d="${cloud}" fill="${B.steam}"/><path d="M-30 12Q-38 12 -36 4Q-34 -4 -24 -2Q-22 -10 -10 -9Q0 -14 10 -9Q22 -11 24 -2Q36 -4 36 6" stroke="${C.cutRim}" stroke-width="1.4" fill="none"/>`
      + `<path d="M-24 8Q0 2 26 8" stroke="${B.steamDeep}" stroke-width="1.2" fill="none" opacity=".7"/><path d="M-20 -2q4 -4 10 -3M6 -6q6 -2 10 2" stroke="${C.vellum}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    `<path d="${cloud}"/>`);
    return column + `<g transform="translate(0 ${up ? 4 : 8}) scale(${up ? 1 : '1 .82'})">${body}</g>`;
  },
};

/**
 * 8-2's valve (a `wheel`, 轉: `off` / `on`): a marigold knurled rim (its grip) round a printed iron
 * handwheel — five spokes and a hub on dark steel — with a little steam mark at its top that points
 * up when it is on. One drawing (state `off`); the view turns it a step per state. Pivot at its centre.
 */
const valve: PartSource = {
  preset: 'wheel',
  states: ['off'],
  pivot: [0, 0],
  box: { x: -38, y: -38, w: 76, h: 76 },
  draw(ctx) {
    const r = 30;
    const rim = wheelRim(r, 20);
    const spokes = [0, 72, 144, 216, 288].map((a) => `<path d="M0 0V-19" transform="rotate(${a})"/>`).join('');
    return beitouDefs(ctx) + depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/>`
      + `<circle r="${r - 5}" fill="${mixHex(B.steelDeep, C.shadow, 0.3)}"/><circle r="${r - 5}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1.4" opacity=".6"/>`
      + `<circle r="19" fill="none" stroke="${C.hatRed}" stroke-width="3.4"/><g stroke="${C.hatRed}" stroke-width="2.6" stroke-linecap="round">${spokes}</g>`
      + `<circle r="5" fill="${C.sealDark}"/><circle r="1.8" fill="${B.steel}"/>`
      + `<path d="M-4 -21q-2 -2 0 -4t0 -4M1 -21q-2 -2 0 -4t0 -4M6 -21q-2 -2 0 -4t0 -4" stroke="${B.steam}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`, `<path d="${rim}"/>`);
  },
};

// 8-3's sun hat (and the 阿嬤 under it)

/**
 * The 溫泉阿嬤's straw sun hat (a `blowable`: `on` her head / blown `off`) — and the 阿嬤 herself,
 * sitting on the bench under it (`grannyFigure`): a part is drawn under the creatures, and the hat must
 * sit on her head. Its hit is where the pages issue set it (D-93: the cone reads its centre); she sits
 * 34 below it, at her node (50, 476). `on`: the hat on her bun, its brim tilted, red band; `off`: she
 * looks up, startled, and the hat tumbles up and away to the left with a chalk swish.
 */
const grannyHat: PartSource = {
  preset: 'blowable',
  states: ['on', 'off'],
  box: { x: -52, y: -108, w: 116, h: 156 },
  draw(ctx, state) {
    const off = state === 'off';
    const brim = '<ellipse cx="0" cy="0" rx="22" ry="5.4"/>';
    const hat = depth(ctx, 2, `<ellipse cx="0" cy="0" rx="22" ry="5.4" fill="${B.straw}"/><path d="M-11 -1Q-11 -14 0 -14Q11 -14 11 -1Z" fill="${B.straw}"/>`
      + `<path d="M-11 -4H11" stroke="${C.hatRed}" stroke-width="2.6"/><path d="M11 -4q6 2 8 8" stroke="${C.hatRed}" stroke-width="1.4" fill="none"/>`
      + `<path d="M-17 1Q0 6 17 1M-8 -10h16" stroke="${B.strawDeep}" stroke-width=".8" fill="none"/><path d="M-9 -11q4 -3 9 -3" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".5"/>`, brim);
    const granny = `<g transform="translate(0 34)">${grannyFigure(ctx, off)}</g>`;
    if (off) {
      return granny + `<g transform="translate(-16 -86) rotate(-32)">${hat}</g>`
        + `<path d="M6 -62q-10 -6 -16 -14M14 -68q-8 -8 -12 -16" stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>`;
    }
    return granny + `<g transform="translate(2 -45) rotate(-6)">${hat}</g>`;
  },
};

// 8-4's pinwheel, window, belt

/** The pinwheel in the window box, its hub at the origin: four washi blades curled at their tips, a quarter turn a state, on a bamboo stick. */
const pinwheel: PartSource = {
  preset: 'blowable',
  states: ['0', '1', '2', '3'],
  box: { x: -28, y: -28, w: 56, h: 64 },
  draw(ctx, state) {
    const blades = [C.washiPink, B.tealLight, C.printLilac, C.washi];
    const turn = Number(state) * 90;
    const blade = (i: number) => `<g transform="rotate(${turn + i * 90})"><path d="M0 0L0 -21Q15 -18 13 -6Z" fill="${blades[i]}"/><path d="M0 -21Q15 -18 13 -6L7 -9Z" fill="${mixHex(blades[i], C.shadow, 0.25)}"/></g>`;
    return `<path d="M0 0V34" stroke="${B.hinokiDeep}" stroke-width="2.6" stroke-linecap="round"/>`
      + depth(ctx, 2, [0, 1, 2, 3].map(blade).join(''), '<circle r="21"/>')
      + `<circle r="3" fill="${C.hatRed}"/><circle r="1.2" fill="${C.washi}"/>`;
  },
};

/**
 * 8-4's ground-floor window (a `flap`, 翻): closed, two casements of glass in cedar frames with the
 * night beyond, a latch; open, the card folds up (its kraft back shows) and the night air — and
 * 咻——'s wind — gets in through the opening in the wall (the backdrop's). Local: the card's top-left
 * at the origin (`bakedFlap`), its marigold dog-ear the grip.
 */
const libraryWindow = (() => {
  const { w, h } = { w: 40, h: 34 };
  const face = (ctx: KitCtx) => beitouDefs(ctx) + `<rect width="${w}" height="${h}" fill="${ref(ctx, 'cedarG')}"/>`
    + `<rect x="4" y="4" width="${w / 2 - 6}" height="${h - 8}" fill="${mixHex(B.hillNear, B.teal, 0.25)}"/><rect x="${w / 2 + 2}" y="4" width="${w / 2 - 6}" height="${h - 8}" fill="${mixHex(B.hillNear, B.teal, 0.25)}"/>`
    + `<path d="M6 ${h - 8}L${w / 2 - 4} 8M${w / 2 + 4} ${h - 8}L${w - 6} 8" stroke="${C.glassine}" stroke-width="2" opacity=".35"/>`
    + `<path d="M4 ${h / 2}H${w / 2 - 2}M${w / 2 + 2} ${h / 2}H${w - 4}" stroke="${B.cedarDeep}" stroke-width="1.4"/>`
    + `<rect x="${w / 2 - 2}" y="${h / 2 - 4}" width="4" height="6" rx="1" fill="${B.brass}"/>`;
  return bakedFlap(w, h, face, kraftBack(w, h, 157));
})();

/**
 * The book lift's belt (#129; a `loop` the pinwheel drives), drawn at its hit centre (the belt's
 * middle): an upright loop of canvas belt round a pulley at each floor (the ground floor 64 down, the
 * reading room 68 up), its stitched edge, a guide rail up its middle. One drawing (state `0`): the
 * tray rider shows where it is.
 */
const bookBelt: PartSource = {
  preset: 'loop',
  states: ['0'],
  box: { x: -48, y: -84, w: 96, h: 168 },
  draw(ctx) {
    const loop = 'M-36 -2C-36 -52 -20 -68 0 -68C20 -68 36 -52 36 -2C36 48 20 64 0 64C-20 64 -36 48 -36 -2Z';
    const pulley = (y: number) => depth(ctx, 2, `<circle cy="${y}" r="11" fill="${B.steelDeep}"/><circle cy="${y}" r="7" fill="${B.steel}"/>`
      + `<path d="M-6 ${y}h12M0 ${y - 6}v12" stroke="${B.steelDeep}" stroke-width="1.6"/><circle cy="${y}" r="2" fill="${B.steelDeep}"/>`, `<circle cy="${y}" r="11"/>`);
    return `<path d="${loop}" fill="none" stroke="${B.hinokiDeep}" stroke-width="6"/><path d="${loop}" fill="none" stroke="${B.hinokiLight}" stroke-width="1.4" stroke-dasharray="4 5"/>`
      + `<path d="M0 -58V54" stroke="${B.cedarDeep}" stroke-width="3"/>` + pulley(-58) + pulley(54);
  },
};

// 8-5's tap, tubs, water

/**
 * 8-5's tap (a `wheel`, 轉: `low` drained · `mid` · `high` full): a marigold knurled rim (its grip)
 * round the brass tap's cross handle on the tiles, three printed water marks (empty, half, full)
 * round its face. One drawing (state `low`); the view turns it a step per state. Pivot at its centre.
 */
const bathTap: PartSource = {
  preset: 'wheel',
  states: ['low'],
  pivot: [0, 0],
  box: { x: -40, y: -40, w: 80, h: 80 },
  draw(ctx) {
    const r = 32;
    const rim = wheelRim(r, 22);
    const drop = (a: number, fill: number) => `<g transform="rotate(${a}) translate(0 -21)"><path d="M0 -4q3 4 3 6a3 3 0 0 1 -6 0q0 -2 3 -6z" fill="none" stroke="${B.tealLit}" stroke-width="1"/>`
      + (fill > 0 ? `<path d="M${-3 + 0} ${f1(2 - fill * 2)}h6v1a3 3 0 0 1 -6 0z" fill="${B.tealLit}"/>` : '') + `</g>`;
    return beitouDefs(ctx) + depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/>`
      + `<circle r="${r - 5}" fill="${mixHex(B.tealDeep, C.shadow, 0.3)}"/><circle r="${r - 5}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1.4" opacity=".6"/>`
      + drop(0, 0) + drop(120, 1) + drop(240, 2)
      + `<path d="M-15 0H15M0 -15V15" stroke="${B.brassDeep}" stroke-width="6" stroke-linecap="round"/><path d="M-15 0H15M0 -15V15" stroke="${ref(ctx, 'brassG')}" stroke-width="3.6" stroke-linecap="round"/>`
      + `<circle r="5" fill="${B.brass}"/><circle r="2" fill="${B.brassDeep}"/>`, `<path d="${rim}"/>`);
  },
};

/** 8-5's wooden tubs (a `lift` each, drawn where its node is: he sits in it): a hinoki tub with brass hoops and a dipper's handle over its rim. */
const woodenTub: PartSource = {
  preset: 'lift',
  states: ['low', 'mid', 'high'],
  box: { x: -32, y: -12, w: 64, h: 42 },
  draw(ctx) {
    const tub = 'M-25 -2H25L21 22H-21Z';
    return softEllipse(ctx, 0, 22, 22, 3, 'shadow', 0.3) + beitouDefs(ctx)
      + depth(ctx, 3, `<path d="${tub}" fill="${ref(ctx, 'hinokiH')}"/><path d="${woodGrain(-24, 0, 24, 22, 158, true, 6)}" stroke="${B.hinokiDeep}" stroke-width=".6" fill="none" opacity=".45"/>`
        + `<path d="M-24 5H24M-22 16H22" stroke="${B.brassDeep}" stroke-width="2.4"/>`
        + `<ellipse cx="0" cy="-2" rx="25" ry="4.2" fill="${B.hinokiDeep}"/><ellipse cx="0" cy="-1.6" rx="21" ry="2.8" fill="${mixHex(B.hinokiDeep, C.shadow, 0.35)}"/>`
        + `<path d="M-23 0V20" stroke="${C.cutRim}" stroke-width="1" opacity=".35"/>`, `<path d="${tub}"/>`);
  },
};

/**
 * The bath's water (#129; a `lift` with no node: its anchor rises up its hit area per level), drawn at
 * its level's anchor: green-blue spring water from just under the tubs' rims down to the bath's front
 * lip (y 540), its surface lit, ripples and a little steam; drained, a few puddles on the tiles.
 */
const bathWater: PartSource = {
  preset: 'lift',
  states: ['low', 'mid', 'high'],
  box: { x: -108, y: -40, w: 216, h: 140 },
  draw(ctx, state) {
    if (state === 'low') {
      return `<g opacity=".55"><ellipse cx="-60" cy="96" rx="22" ry="3" fill="${B.tealLight}"/><ellipse cx="40" cy="98" rx="30" ry="3.4" fill="${B.tealLight}"/></g>`;
    }
    const depthBelow = state === 'mid' ? 61 : 94;
    const r = seeded(state === 'mid' ? 159 : 160);
    let ripples = '';
    for (let i = 0; i < 8; i++) ripples += `M${f1(-96 + r() * 180)} ${f1(16 + r() * 10)}q6 -2.4 12 0`;
    return beitouDefs(ctx) + `<rect x="-104" y="10" width="208" height="${depthBelow - 10}" fill="${ref(ctx, 'poolG')}" opacity=".6"/>`
      + `<rect x="-104" y="10" width="208" height="6" fill="${B.tealLit}" opacity=".45"/>`
      + `<path d="M-104 10q13 -3 26 0t26 0t26 0t26 0t26 0t26 0t26 0t26 0" stroke="${C.cutRim}" stroke-width="1.4" fill="none" opacity=".6"/>`
      + `<path d="${ripples}" stroke="${B.tealLit}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".8"/>`
      + `<path d="M-70 6q-4 -8 0 -14t0 -14M60 6q-4 -8 0 -14t0 -12" stroke="${B.steam}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/>`;
  },
};

// 8-6's bell, window and rods

/** A steel counter bell on a little lacquered block, its base at the origin; rung (`down`), the plunger pressed and chalk 「叮！」. */
const counterBell: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -30, y: -32, w: 64, h: 44 },
  draw(ctx, state) {
    const down = state === 'down';
    const dome = 'M-12 4Q-12 -10 0 -10Q12 -10 12 4Z';
    return beitouDefs(ctx) + depth(ctx, 2, `<rect x="-15" y="4" width="30" height="5" rx="1.4" fill="${ref(ctx, 'lacquerG')}"/><path d="${dome}" fill="${ref(ctx, 'steelV')}"/>`
      + `<path d="M-7 -4Q-4 -8 0 -8" stroke="${C.cutRim}" stroke-width="1.4" fill="none" opacity=".8"/>`
      + `<rect x="-1.4" y="${down ? -13 : -17}" width="2.8" height="${down ? 3 : 7}" fill="${B.steelDeep}"/><circle cy="${down ? -13.6 : -17.6}" r="2.2" fill="${B.steel}"/>`, `<path d="${dome}"/><rect x="-15" y="4" width="30" height="5"/>`)
      + (down ? softEllipse(ctx, 0, -4, 14, 10, 'lamp', 0.3) + `<path d="M-18 -14q-4 6 0 12M18 -14q4 6 0 12" stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/>`
        + `<text data-art-text="" x="16" y="-18" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.chalk}">叮！</text>` : '');
  },
};

/**
 * The 番台's little sliding window (a `gate`), its centre at the origin: a lattice shoji in a lacquered
 * frame; `open`, slid aside — and the cashier is there behind it, smiling, her hand on the frame.
 */
const bantaiWindow: PartSource = {
  preset: 'gate',
  states: ['closed', 'open'],
  box: { x: -28, y: -28, w: 84, h: 56 },
  draw(ctx, state) {
    const open = state === 'open';
    const frame = `<rect x="-22" y="-22" width="44" height="44" fill="${ref(ctx, 'lacquerG')}"/><rect x="-20" y="-20" width="40" height="40" fill="${mixHex(B.cedarDeep, C.shadow, 0.4)}"/>`;
    const cashier = open ? softEllipse(ctx, 0, 0, 20, 18, 'lamp', 0.4)
      + `<path d="M-14 20q0 -14 14 -14q14 0 14 14z" fill="${B.apron}"/><path d="M-4 8l4 5l4 -5" fill="${C.washi}"/>`
      + `<circle cx="0" cy="-4" r="9" fill="${S.skin}"/><path d="M-9 -6q0 -10 9 -10q9 0 9 10q-3 -5 -9 -5q-6 0 -9 5z" fill="${C.printDark}"/><circle cx="0" cy="-15" r="4" fill="${C.printDark}"/>`
      + `<path d="M-5 -4q1.6 -1.4 3 0M2 -4q1.6 -1.4 3 0" stroke="${C.ink}" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M-2.4 0q2.4 2 4.8 0" stroke="${C.ink}" stroke-width="1" fill="none" stroke-linecap="round"/>`
      + `<circle cx="-5.6" cy="-.6" r="1.4" fill="${S.blush}" opacity=".6"/><circle cx="5.6" cy="-.6" r="1.4" fill="${S.blush}" opacity=".6"/>` : '';
    const shoji = (x: number) => depth(ctx, 1, `<rect x="${x}" y="-20" width="40" height="40" fill="${C.washi}"/>`
      + `<path d="M${x + 13.3} -20V20M${x + 26.7} -20V20M${x} -6.7H${x + 40}M${x} 6.7H${x + 40}" stroke="${B.cedarDeep}" stroke-width="1.6"/>`
      + `<rect x="${x}" y="-20" width="40" height="40" fill="none" stroke="${B.cedarDeep}" stroke-width="2.4"/>`, `<rect x="${x}" y="-20" width="40" height="40"/>`);
    return beitouDefs(ctx) + frame + cashier + shoji(open ? 12 : -20);
  },
};

/**
 * 8-6's rods' handles' plate (under each `slider`'s track at the page's foot, origin at the hit
 * centre): a strip of dark wood with the three stops inlaid in brass, where the red cord from the
 * abacus ends — the bead on a string the player pulls. The same in every state.
 */
const abacusPlate: PartSource = {
  preset: 'slider',
  states: ['0', '1', '2'],
  box: { x: -40, y: -16, w: 80, h: 34 },
  draw(ctx) {
    const plate = 'M-34 -10H34Q38 -10 38 -6V8Q38 12 34 12H-34Q-38 12 -38 8V-6Q-38 -10 -34 -10Z';
    return beitouDefs(ctx) + depth(ctx, 2, `<path d="${plate}" fill="${B.ebony}"/><path d="M-36 -9.2H36" stroke="${B.ebonyLit}" stroke-width="1"/>`
      + [-18, 0, 18].map((x) => `<circle cx="${x}" cy="8" r="1.6" fill="${B.brass}"/>`).join(''), `<path d="${plate}"/>`);
  },
};

// The carrier

/** 8-1's 泡湯阿伯 (a carrier, baked per look): dozing on his feet by his bath bucket, then carrying him over it. Feet at the origin. */
const bathUncle: PartSource = {
  preset: 'carrier',
  states: ['idle', 'carrying', 'back', 'done'],
  box: { x: -76, y: -176, w: 152, h: 182 },
  draw: (ctx, look) => bathUncleArt(ctx, look as 'idle'),
};

export const C8_PARTS: Readonly<Record<string, PartSource>> = {
  'c8/seat-cushion': seatCushion,
  'c8/steam': steam,
  'c8/steam-cloud': steamCloud,
  'c8/valve': valve,
  'c8/granny-hat': grannyHat,
  'c8/pinwheel': pinwheel,
  'c8/library-window': libraryWindow,
  'c8/book-belt': bookBelt,
  'c8/bath-tap': bathTap,
  'c8/wooden-tub': woodenTub,
  'c8/bath-water': bathWater,
  'c8/counter-bell': counterBell,
  'c8/bantai-window': bantaiWindow,
  'c8/abacus-rod': abacusPlate,
  'c8/bath-uncle': bathUncle,
};
