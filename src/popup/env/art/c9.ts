import { POPUP as C, POPUP_PARK as P, POPUP_STATION as T, POPUP_TAMSUI as W, mixHex } from '../../../art/palette';
import { depth, f1, filterAttr, pageBlock, pinholes, ref, seeded, softEllipse, wheelRim, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorWiden } from '../../view/geometry';
import { ironEggGrannyArt } from '../../view/art/tamsui';
import type { BackdropDraw, CutoutSource, PartSource } from '../sources';
import { clerk } from './c1';
import { steamPlume } from './c8';
import { FLOOR_RECT, bakedFlap, bookCues, calmMoon, floorPage, kraftBack, lin, rad, standingPage, windowView } from './common';

/**
 * Chapter 9 (淡水・漁人碼頭・淡江大橋, 04:40) environment art, drawn in the kit's paper language and
 * baked by `npm run bake:popup` (#96). The pages issue (#131) drew placeholders where a preset
 * misleads (D-95 § 5); the chapter's art issue (#132) draws the palette kit, the six backdrops and
 * every part.
 *
 * **The kit** (bible § 6 row 9, `POPUP_TAMSUI`): violet and sea teal dominant, the first-light peach
 * the accent — the dawn arrives this chapter (bible § 3.3): a warm glow low on the right of every sky
 * (`dawnSky`), the stars thinning toward it, right-facing facets taking the peach while left ones stay
 * violet, long vellum cloud strips lit from below (`dawnClouds`). The signature material is **glassine
 * sea** (`seaWater`: the river mouth's teal under a glassine sheen, the dawn's peach broken in its
 * ripples). 觀音山 lies across the river on every page (`guanyin`), and **淡江大橋** stands at the river
 * mouth (`tamkangBridge`): the single white pylon (211 m) with its cables in one plane, fanned
 * asymmetrically — 27 pairs over the 450 m main span to 八里, 20 over the 175 m back span to 淡水 — so
 * from upriver its long span runs left and the tower stands near the right (淡水) bank. The ferry,
 * the fishing boats and the 情人橋 (`loversBridge`) are the harbour's; red-brick arcades the old street's.
 */

/** The page block under the floor page. */
const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};

type Pt = readonly [number, number];

/** A soft blur for vellum and glows (baked only). */
const blur = (ctx: KitCtx, name: 'blur3' | 'blur8' | 'blur18' = 'blur3') => (ctx.filters ? filterAttr(ctx, name) : '');

const serif = (x: number, y: number, size: number, fill: string, text: string, extra = '') =>
  `<text data-art-text="" x="${f1(x)}" y="${f1(y)}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${size}" fill="${fill}"${extra}>${text}</text>`;

// ——— The palette kit ———

/** 淡水's gradient defs, shared by the chapter's backdrops and parts. */
export function tamsuiDefs(ctx: KitCtx): string {
  return `<defs>`
    + lin(ctx, 'seaG', [[0, mixHex(W.seaLit, W.peachLight, 0.3)], [0.16, W.seaLight], [0.55, W.sea], [1, W.seaDeep]])
    + lin(ctx, 'seaNear', [[0, W.sea], [1, W.seaDeep]])
    + lin(ctx, 'pylonH', [[0, W.pylonDeep], [0.22, W.pylonShade], [0.55, W.pylon], [0.82, W.pylonPeach], [1, W.peach]], 'h')
    + lin(ctx, 'woodG', [[0, W.woodLight], [1, W.woodDeep]])
    + lin(ctx, 'woodH', [[0, W.woodDeep], [0.4, W.wood], [0.75, W.woodLight], [1, W.wood]], 'h')
    + lin(ctx, 'brickG', [[0, W.brickLight], [1, W.brickDeep]])
    + lin(ctx, 'plasterG', [[0, W.plaster], [1, W.plasterShade]])
    + lin(ctx, 'steelH', [[0, W.steelDeep], [0.45, W.steel], [0.7, mixHex(W.steel, C.cutRim, 0.5)], [1, W.steelDeep]], 'h')
    + lin(ctx, 'steelV', [[0, W.steel], [1, W.steelDeep]])
    + lin(ctx, 'mudG', [[0, W.mudLight], [1, W.mudWet]])
    + lin(ctx, 'hullBlueG', [[0, W.hullBlue], [1, W.hullBlueDeep]])
    + lin(ctx, 'hullWhiteG', [[0, mixHex(W.hullWhite, W.violet, 0.22)], [1, mixHex(W.hullWhite, W.violet, 0.5)]])
    + lin(ctx, 'carWallG', [[0, mixHex(W.plaster, W.violet, 0.62)], [0.6, mixHex(W.plasterShade, W.violet, 0.68)], [1, mixHex(W.plasterShade, W.violetDeep, 0.74)]])
    + lin(ctx, 'mistV', [[0, W.peachLight, 0], [0.5, W.peachLight, 0.26], [1, W.rose, 0]])
    + lin(ctx, 'concreteG', [[0, mixHex(W.pylonShade, W.violet, 0.2)], [1, W.pylonDeep]])
    + rad(ctx, 'dawnGlow', [[0, W.peachLight, 0.85], [0.35, W.peach, 0.45], [0.7, W.rose, 0.14], [1, W.rose, 0]])
    + rad(ctx, 'amberPool', [[0, C.lamp, 0.44], [0.55, C.lampAmber, 0.15], [1, C.lampAmber, 0]])
    + rad(ctx, 'dawnPool', [[0, W.peachLight, 0.42], [0.6, W.peach, 0.12], [1, W.peach, 0]])
    + `</defs>`;
}

/** Light pools on the floor page: amber under the lamps, the dawn's peach. */
const pools = (ctx: KitCtx, list: readonly (readonly [number, number, number, number, ('amber' | 'dawn')?])[]) =>
  list.map(([cx, cy, rx, ry, tone]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ref(ctx, tone === 'dawn' ? 'dawnPool' : 'amberPool')}"/>`).join('');

/**
 * 淡水's sky at 04:40 (the colour clock: the first violet light): the chapter's sky, the dawn's warm
 * glow low on the right (bible § 3.3: "a warm radial from the lower right"), the stars thinning toward
 * it (pinholes only in the upper left), and a pale moon going down on the left.
 */
function dawnSky(ctx: KitCtx, horizon: number, { seed = 9, stars = 30, glow = [330, horizon, 250, 130] as readonly [number, number, number, number], moon = null as readonly [number, number, number] | null } = {}): string {
  return `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'sky')}"/>`
    + `<ellipse cx="${glow[0]}" cy="${glow[1]}" rx="${glow[2]}" ry="${glow[3]}" fill="${ref(ctx, 'dawnGlow')}"/>`
    + pinholes(ctx, 0, 0, PAGE_W * 0.62, horizon * 0.5, stars, seed)
    + (moon ? calmMoon(ctx, moon[0], moon[1], moon[2], { halo: 0.05, cloud: false }) : '');
}

/** Long vellum cloud strips lit from below by the dawn: (x, y) the strip's foot centre, `w` its length. */
export function dawnClouds(ctx: KitCtx, list: readonly (readonly [number, number, number])[]): string {
  let body = '';
  let lit = '';
  for (const [x, y, w] of list) {
    const h = Math.max(4, w * 0.09);
    body += `M${f1(x - w / 2)} ${f1(y)}Q${f1(x - w * 0.32)} ${f1(y - h)} ${f1(x - w * 0.05)} ${f1(y - h * 0.8)}Q${f1(x + w * 0.22)} ${f1(y - h * 1.25)} ${f1(x + w / 2)} ${f1(y)}Z`;
    lit += `M${f1(x - w * 0.42)} ${f1(y - 0.6)}Q${f1(x)} ${f1(y + 1.4)} ${f1(x + w * 0.46)} ${f1(y - 0.6)}`;
  }
  return `<path d="${body}" fill="${mixHex(W.violetLight, W.rose, 0.35)}" opacity=".5"${blur(ctx)}/>`
    + `<path d="${body}" fill="${mixHex(W.violetLight, W.rose, 0.45)}" opacity=".35"/>`
    + `<path d="${lit}" stroke="${W.peachLight}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/>`;
}

/**
 * 觀音山 across the river (the reclining 觀音 seen from 淡水: her brow, the nose of 硬漢嶺, her chin,
 * the long body sloping away), from x0 to x1 standing on `base`, `h` tall at the nose.
 */
const GUANYIN: readonly Pt[] = [[0, 0.06], [0.07, 0.18], [0.14, 0.42], [0.2, 0.58], [0.25, 0.72], [0.28, 1], [0.31, 0.82], [0.35, 0.66], [0.39, 0.74], [0.44, 0.6], [0.52, 0.46], [0.6, 0.5], [0.7, 0.36], [0.8, 0.26], [0.9, 0.15], [1, 0.08]];
function guanyinPath(x0: number, x1: number, base: number, h: number): string {
  const pts = GUANYIN.map(([u, v]) => [x0 + (x1 - x0) * u, base - h * v] as const);
  let d = `M${f1(x0)} ${f1(base + 20)}L${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [qx, qy] = pts[i];
    d += `Q${f1(px)} ${f1(py)} ${f1((px + qx) / 2)} ${f1((py + qy) / 2)}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  return `${d}L${f1(lx)} ${f1(ly)}L${f1(x1)} ${f1(base + 20)}Z`;
}

/** 觀音山 in two layers of card with a band of lit mist between, the far shore (八里) at its foot. */
export function guanyin(ctx: KitCtx, x0: number, x1: number, base: number, h: number, { lights = 7, seed = 3 } = {}): string {
  const back = guanyinPath(x0 - 30, x1 + 40, base, h);
  const front = guanyinPath(x0 + (x1 - x0) * 0.25, x1 + 80, base + 4, h * 0.42);
  const r = seeded(seed);
  let dots = '';
  for (let i = 0; i < lights; i++) dots += `<circle cx="${f1(x0 + r() * (x1 - x0))}" cy="${f1(base - 2 - r() * 4)}" r="${f1(0.8 + r() * 0.6)}" fill="${C.lamp}" opacity="${f1(0.55 + r() * 0.35)}"/>`;
  return depth(ctx, 1, `<path d="${back}" fill="${W.hillFar}"/>`, `<path d="${back}"/>`)
    // The dawn catches her right-facing slopes
    + `<path d="${back}" fill="${W.peach}" opacity=".08"/>`
    + `<rect x="${f1(x0 - 30)}" y="${f1(base - h * 0.36)}" width="${f1(x1 - x0 + 120)}" height="${f1(h * 0.3)}" fill="${ref(ctx, 'mistV')}"/>`
    + depth(ctx, 1, `<path d="${front}" fill="${W.hill}"/>`, `<path d="${front}"/>`)
    + `<rect x="${f1(x0 - 30)}" y="${f1(base - 3)}" width="${f1(x1 - x0 + 120)}" height="5" fill="${W.hillNear}"/>` + dots;
}

/**
 * Glassine sea (the chapter's signature material, bible § 3.1: "translucent white with two diagonal
 * sheen streaks"): the teal water from y0 to y1, short ripples catching the light, the dawn's peach
 * broken in a column of ripples under `glowX`, and two diagonal sheen streaks of glassine over it all.
 */
export function seaWater(ctx: KitCtx, x0: number, y0: number, x1: number, y1: number, seed: number, { glowX = null as number | null, dense = 1 } = {}): string {
  const r = seeded(seed);
  let ripples = '';
  const n = Math.round(((x1 - x0) * (y1 - y0)) / 520 * dense);
  for (let i = 0; i < n; i++) {
    const t = r();
    const y = y0 + 3 + (y1 - y0 - 6) * t * t;
    const x = x0 + r() * (x1 - x0);
    const w = (6 + r() * 10) * (0.5 + t);
    ripples += `M${f1(x)} ${f1(y)}q${f1(w / 2)} -2 ${f1(w)} 0`;
  }
  let glints = '';
  if (glowX !== null) {
    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const y = y0 + 2 + (y1 - y0 - 4) * t;
      const w = 6 + t * 36 * (0.6 + r() * 0.6);
      glints += `M${f1(glowX - w / 2 + (r() - 0.5) * 10)} ${f1(y)}h${f1(w)}`;
    }
  }
  const sheen = (a: number, b: number) => `<path d="M${f1(x0 + (x1 - x0) * a)} ${f1(y1)}L${f1(x0 + (x1 - x0) * (a + 0.12))} ${f1(y0)}H${f1(x0 + (x1 - x0) * (a + 0.12 + b))}L${f1(x0 + (x1 - x0) * (a + b))} ${f1(y1)}Z" fill="${C.glassine}" opacity=".09"/>`;
  return `<rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(x1 - x0)}" height="${f1(y1 - y0)}" fill="${ref(ctx, 'seaG')}"/>`
    + `<path d="${ripples}" stroke="${W.seaLit}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/>`
    + (glints ? `<path d="${glints}" stroke="${W.peachLight}" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>` : '')
    + sheen(0.1, 0.05) + sheen(0.55, 0.08)
    + `<path d="M${f1(x0)} ${f1(y0 + 0.6)}H${f1(x1)}" stroke="${W.seaLit}" stroke-width="1" opacity=".6"/>`;
}

export interface BridgeView {
  /** The pylon's x and the deck's height there */
  readonly px: number;
  readonly deckY: number;
  /** The pylon's tip, and where it meets the water */
  readonly top: number;
  readonly water: number;
  /** Where the long (八里) main span and the short (淡水) back span reach */
  readonly left: number;
  readonly right: number;
  /** More cables when it is drawn large */
  readonly detail?: boolean;
  readonly z?: 1 | 2;
}

/**
 * 淡江大橋 (opened 2026-05-12; the world's longest-span single-pylon asymmetric cable-stayed bridge),
 * drawn in elevation from upriver: the single tapering white pylon rising from the river mouth (its
 * left face in the violet shade, its right face taking the dawn's peach), a red light at its tip, the
 * cables in one plane fanning from its upper third — many over the long main span to the left (八里),
 * fewer over the short back span to the right (淡水) — the slim deck with its approach piers, and the
 * pylon's reflection broken in the water. Proportions: the deck a fifth of the way up the pylon, the
 * main span ≈ 2.6 × the back span.
 */
export function tamkangBridge(ctx: KitCtx, v: BridgeView): string {
  const { px, deckY, top, water, left, right, detail = false, z = 1 } = v;
  const H = water - top;
  const wb = Math.max(5, H * 0.07);
  const wt = Math.max(1.4, wb * 0.18);
  const dt = Math.max(1.6, H * 0.022);
  // The pylon: a slender taper with the slightest dancer's sway, two facets split down its spine
  const leftEdge = `M${f1(px - wb / 2)} ${f1(water)}Q${f1(px - wb * 0.4)} ${f1(top + H * 0.55)} ${f1(px - wt / 2)} ${f1(top + H * 0.07)}L${f1(px)} ${f1(top)}`;
  const rightEdge = `L${f1(px + wt / 2)} ${f1(top + H * 0.07)}Q${f1(px + wb * 0.32)} ${f1(top + H * 0.5)} ${f1(px + wb / 2)} ${f1(water)}Z`;
  const pylon = leftEdge + rightEdge;
  const spine = `M${f1(px)} ${f1(top)}Q${f1(px + wb * 0.02)} ${f1(top + H * 0.5)} ${f1(px + wb * 0.06)} ${f1(water)}`;
  const shadeHalf = `${leftEdge}Q${f1(px + wb * 0.02)} ${f1(top + H * 0.5)} ${f1(px + wb * 0.06)} ${f1(water)}Z`;
  // The cables: one plane, anchored up the pylon's upper third, landing evenly along the deck
  const main = detail ? 15 : 9;
  const back = detail ? 11 : 6;
  const lo = top + H * 0.12;
  const hi = top + H * 0.42;
  let cables = '';
  for (let i = 0; i < main; i++) {
    const t = i / (main - 1);
    const ay = lo + (hi - lo) * t;
    const dx = left + 6 + (px - H * 0.1 - left - 6) * t;
    cables += `M${f1(px - 0.4)} ${f1(ay)}L${f1(dx)} ${f1(deckY - dt * 0.5)}`;
  }
  for (let i = 0; i < back; i++) {
    const t = i / (back - 1);
    const ay = lo + (hi - lo) * t;
    const dx = right - 4 - (right - 4 - px - H * 0.09) * t;
    cables += `M${f1(px + 0.4)} ${f1(ay)}L${f1(dx)} ${f1(deckY - dt * 0.5)}`;
  }
  const sw = Math.max(0.35, H * 0.0028);
  // The deck: a slim band hogged a little over the main span, its edge lit
  const hog = (px - left) * 0.02;
  const deck = `M${f1(left - 30)} ${f1(deckY + hog * 0.4)}Q${f1((left + px) / 2)} ${f1(deckY - hog)} ${f1(px)} ${f1(deckY)}L${f1(right + 30)} ${f1(deckY + 2)}`;
  // Piers: the back span's two, the approaches beyond each end
  let piers = '';
  for (const x of [px + (right - px) * 0.45, right, left, left - 26]) piers += `M${f1(x)} ${f1(deckY + dt)}V${f1(water)}`;
  // The pylon's reflection broken in the water
  let refl = '';
  for (let k = 0; k < 6; k++) {
    const y = water + 2 + k * Math.max(2, H * 0.025);
    refl += `M${f1(px - wb * 0.5 + (k % 2) * 1.5)} ${f1(y)}h${f1(wb * (0.9 - k * 0.1))}`;
  }
  return `<path d="${cables}" stroke="${W.cable}" stroke-width="${f1(sw)}" opacity=".7"/>`
    + `<path d="${piers}" stroke="${W.deckDeep}" stroke-width="${f1(Math.max(1.2, dt * 0.9))}"/>`
    + `<path d="${deck}" stroke="${W.deck}" stroke-width="${f1(dt)}" fill="none"/>`
    + `<path d="${deck}" stroke="${mixHex(W.pylon, W.peach, 0.3)}" stroke-width="${f1(Math.max(0.4, dt * 0.25))}" fill="none" transform="translate(0 ${f1(-dt * 0.4)})" opacity=".7"/>`
    + depth(ctx, z, `<path d="${pylon}" fill="${W.pylonPeach}"/><path d="${shadeHalf}" fill="${mixHex(W.pylonShade, W.violet, 0.25)}"/>`
      + `<path d="${spine}" stroke="${C.cutRim}" stroke-width="${f1(Math.max(0.4, wb * 0.06))}" fill="none" opacity=".55"/>`, `<path d="${pylon}"/>`)
    + softEllipse(ctx, px, top + 1, Math.max(3, wb * 0.5), Math.max(3, wb * 0.5), 'lamp', 0.25)
    + `<circle cx="${f1(px)}" cy="${f1(top + Math.max(1.5, H * 0.012))}" r="${f1(Math.max(0.9, wb * 0.12))}" fill="${C.neonPink}"/>`
    + `<path d="${refl}" stroke="${W.pylonPeach}" stroke-width="${f1(Math.max(0.8, H * 0.012))}" stroke-linecap="round" opacity=".28"/>`;
}

/**
 * The 情人橋 at 漁人碼頭: a white footbridge curving over the harbour inlet, its inclined mast like a
 * sail with its stays fanned to the deck, little lamps along the rail; its centre at (x, y), `s` × a
 * 140-unit bridge.
 */
function loversBridge(ctx: KitCtx, x: number, y: number, s: number): string {
  const k = (n: number) => n * s;
  const deck = `M${f1(x - k(74))} ${f1(y + k(10))}Q${f1(x)} ${f1(y - k(10))} ${f1(x + k(74))} ${f1(y + k(10))}`;
  const [mx0, my0] = [x + k(22), y + k(1)];
  const [mx1, my1] = [x - k(4), y - k(58)];
  let stays = '';
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const dx = x - k(66) + k(56) * t;
    const dy = y + k(10) - k(10) * (1 - Math.pow((dx - x) / k(74), 2)) - k(1);
    stays += `M${f1(mx1 + (mx0 - mx1) * 0.08)} ${f1(my1 + (my0 - my1) * 0.08)}L${f1(dx)} ${f1(dy)}`;
  }
  stays += `M${f1(mx1)} ${f1(my1)}L${f1(x + k(66))} ${f1(y + k(7))}`;
  let lamps = '';
  for (let i = 0; i < 9; i++) {
    const dx = x - k(64) + k(16) * i;
    const dy = y + k(10) - k(10) * 2 * (1 - Math.pow((dx - x) / k(74), 2)) - k(3);
    lamps += `<circle cx="${f1(dx)}" cy="${f1(dy)}" r="${f1(k(1.1))}" fill="${C.lampHot}"/>`;
  }
  return `<path d="${stays}" stroke="${W.cable}" stroke-width="${f1(k(0.7))}" opacity=".8"/>`
    + depth(ctx, 2, `<path d="${deck}" stroke="${W.pylon}" stroke-width="${f1(k(4))}" fill="none"/><path d="${deck}" stroke="${W.pylonShade}" stroke-width="${f1(k(1.4))}" fill="none" transform="translate(0 ${f1(k(1.6))})"/>`
      + `<path d="M${f1(mx0)} ${f1(my0)}L${f1(mx1)} ${f1(my1)}" stroke="${W.pylonPeach}" stroke-width="${f1(k(3.4))}" stroke-linecap="round"/>`
      + `<path d="M${f1(mx0 - k(1))} ${f1(my0)}L${f1(mx1 - k(1))} ${f1(my1)}" stroke="${W.pylonShade}" stroke-width="${f1(k(1.2))}" stroke-linecap="round"/>`
      + `<path d="M${f1(x - k(54))} ${f1(y + k(8))}v${f1(k(18))}M${f1(x + k(54))} ${f1(y + k(8))}v${f1(k(18))}" stroke="${W.pylonShade}" stroke-width="${f1(k(3))}"/>`, `<path d="${deck}"/>`)
    + softEllipse(ctx, x, y + k(2), k(70), k(10), 'lamp', 0.12, 'blur8') + lamps;
}

/** An iron harbour lamp: a dark post with a lantern on top (its top at (x, top)), its glow and pool. */
function harbourLamp(ctx: KitCtx, x: number, top: number, foot: number, s = 1): string {
  const k = (n: number) => f1(n * s);
  const lantern = `M${f1(x - 7 * s)} ${f1(top + 4 * s)}L${f1(x - 5 * s)} ${f1(top + 18 * s)}H${f1(x + 5 * s)}L${f1(x + 7 * s)} ${f1(top + 4 * s)}Z`;
  return softEllipse(ctx, x, top + 12 * s, 26 * s, 24 * s, 'lamp', 0.32, 'blur8')
    + depth(ctx, 3, `<rect x="${f1(x - 2.2 * s)}" y="${f1(top + 18 * s)}" width="${k(4.4)}" height="${f1(foot - top - 18 * s)}" fill="${W.steelDeep}"/>`
      + `<rect x="${f1(x - 5 * s)}" y="${f1(foot - 6 * s)}" width="${k(10)}" height="${k(6)}" rx="${k(1)}" fill="${W.steelDeep}"/>`
      + `<path d="${lantern}" fill="${ref(ctx, 'window')}"/><path d="M${f1(x - 8 * s)} ${f1(top + 4 * s)}H${f1(x + 8 * s)}L${f1(x + 4 * s)} ${f1(top)}H${f1(x - 4 * s)}Z" fill="${C.printDark}"/>`
      + `<path d="M${f1(x - 6 * s)} ${f1(top + 18 * s)}h${k(12)}" stroke="${C.printDark}" stroke-width="${k(1.6)}"/>`
      + `<path d="M${x} ${f1(top + 4 * s)}V${f1(top + 18 * s)}" stroke="${C.printDark}" stroke-width="${k(0.8)}" opacity=".6"/>`, `<rect x="${f1(x - 8 * s)}" y="${f1(top)}" width="${k(16)}" height="${f1(foot - top)}"/>`);
}

/** A coil of mooring rope lying on its side, its foot at (x, y). */
function ropeCoil(ctx: KitCtx, x: number, y: number, s = 1): string {
  let rings = '';
  for (let i = 0; i < 4; i++) rings += `<ellipse cx="${x}" cy="${f1(y - (4 + i * 4.4) * s)}" rx="${f1((17 - i * 1.4) * s)}" ry="${f1(5 * s)}" fill="none" stroke="${i % 2 ? W.ropeDeep : W.rope}" stroke-width="${f1(4.2 * s)}"/>`;
  return softEllipse(ctx, x + 2, y, 20 * s, 4 * s, 'shadow', 0.4)
    + depth(ctx, 3, rings + `<path d="M${f1(x + 15 * s)} ${f1(y - 5 * s)}q${f1(10 * s)} ${f1(4 * s)} ${f1(18 * s)} ${f1(2 * s)}" stroke="${W.rope}" stroke-width="${f1(4 * s)}" fill="none" stroke-linecap="round"/>`
      + `<path d="M${f1(x - 12 * s)} ${f1(y - 20 * s)}q${f1(10 * s)} ${f1(-3 * s)} ${f1(22 * s)} 0" stroke="${C.cutRim}" stroke-width="${f1(s)}" fill="none" opacity=".45"/>`, `<ellipse cx="${x}" cy="${f1(y - 10 * s)}" rx="${f1(18 * s)}" ry="${f1(12 * s)}"/>`);
}

/** A red-and-white lifebuoy on a bracket, its centre at (x, y). */
function lifebuoy(ctx: KitCtx, x: number, y: number, r = 11): string {
  const ring = `M${f1(x - r)} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0zM${f1(x - r * 0.55)} ${y}a${f1(r * 0.55)} ${f1(r * 0.55)} 0 1 1 ${f1(r * 1.1)} 0a${f1(r * 0.55)} ${f1(r * 0.55)} 0 1 1 ${f1(-r * 1.1)} 0z`;
  const band = (a: number) => `<path d="M${f1(x + Math.cos(a) * r * 0.5)} ${f1(y + Math.sin(a) * r * 0.5)}L${f1(x + Math.cos(a) * r * 1.02)} ${f1(y + Math.sin(a) * r * 1.02)}" stroke="${W.hullWhite}" stroke-width="${f1(r * 0.42)}"/>`;
  const clip = ctx.id(`buoy${Math.round(x)}${Math.round(y)}`);
  return depth(ctx, 3, `<clipPath id="${clip}"><path d="${ring}" fill-rule="evenodd"/></clipPath><path d="${ring}" fill-rule="evenodd" fill="${W.trimRed}"/>`
    + `<g clip-path="url(#${clip})">${[0.8, 2.4, 3.9, 5.5].map(band).join('')}</g>`
    + `<path d="M${f1(x - r * 0.8)} ${f1(y - r * 0.5)}q${f1(r * 0.5)} ${f1(-r * 0.6)} ${f1(r * 1.2)} ${f1(-r * 0.5)}" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".5"/>`, `<path d="${ring}" fill-rule="evenodd"/>`);
}

/** A railing of steel posts and two rails from x0 to x1: its top rail at `top`, its mid rail at `mid`, the posts down to `foot`. */
function railing(ctx: KitCtx, x0: number, x1: number, top: number, mid: number, foot: number, { every = 26, z = 3 as 2 | 3 | 4, tone = 'steel' as 'steel' | 'wood' } = {}): string {
  let posts = '';
  for (let x = x0; x <= x1 + 0.5; x += every) posts += `M${f1(x)} ${f1(top)}V${f1(foot)}`;
  const [dark, light] = tone === 'wood' ? [mixHex(W.woodDeep, C.shadow, 0.25), W.woodLight] : [W.steelDeep, W.steel];
  return depth(ctx, z, `<path d="${posts}" stroke="${dark}" stroke-width="3"/>`
    + `<path d="M${f1(x0 - 3)} ${f1(top)}H${f1(x1 + 3)}" stroke="${dark}" stroke-width="4.4" stroke-linecap="round"/><path d="M${f1(x0 - 3)} ${f1(top - 0.8)}H${f1(x1 + 3)}" stroke="${light}" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M${f1(x0)} ${f1(mid)}H${f1(x1)}" stroke="${dark}" stroke-width="3.4" stroke-linecap="round"/><path d="M${f1(x0)} ${f1(mid - 0.7)}H${f1(x1)}" stroke="${light}" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>`,
  `<path d="M${f1(x0 - 3)} ${f1(top - 2)}H${f1(x1 + 3)}V${f1(foot)}H${f1(x0 - 3)}Z"/>`);
}

/** A small fishing boat far off on the water (a hull, a wheelhouse, a mast with its lamp), its waterline centre at (x, y). */
function farBoat(ctx: KitCtx, x: number, y: number, s: number, flip = false): string {
  const k = (n: number) => f1(n * s * (flip ? -1 : 1));
  const ky = (n: number) => f1(n * s);
  const hull = `M${f1(x)} ${f1(y)}m${k(-18)} ${ky(-5)}h${k(36)}l${k(-5)} ${ky(6)}h${k(-28)}z`;
  return `<path d="${hull}" fill="${W.hullBlue}"/><path d="M${f1(x)} ${f1(y)}m${k(-18)} ${ky(-5)}h${k(36)}" stroke="${W.hullWhite}" stroke-width="${ky(1)}"/>`
    + `<rect x="${f1(x + (flip ? -1 : 1) * 2 * s - (flip ? 9 * s : 0))}" y="${f1(y - 11 * s)}" width="${ky(9)}" height="${ky(6)}" fill="${W.hullWhite}"/>`
    + `<path d="M${f1(x - (flip ? -8 : 8) * s)} ${f1(y - 5 * s)}V${f1(y - 20 * s)}" stroke="${W.steelDeep}" stroke-width="${ky(0.8)}"/>`
    + softEllipse(ctx, x - (flip ? -8 : 8) * s, y - 20 * s, 3.4 * s, 3.4 * s, 'lamp', 0.5) + `<circle cx="${f1(x - (flip ? -8 : 8) * s)}" cy="${f1(y - 20 * s)}" r="${ky(1)}" fill="${C.lampHot}"/>`
    + `<path d="M${f1(x - 16 * s)} ${f1(y + 2 * s)}h${ky(32)}" stroke="${W.seaLit}" stroke-width="${ky(0.8)}" opacity=".5"/>`;
}

/** Mangroves (紅樹林) along a bank from x0 to x1 at y: low round crowns over a tangle of stilt roots in the water. */
export function mangroves(x0: number, x1: number, y: number, seed: number, h = 14): string {
  const r = seeded(seed);
  let crowns = '';
  let roots = '';
  for (let x = x0; x < x1; x += h * (0.7 + r() * 0.5)) {
    const cr = h * (0.45 + r() * 0.3);
    crowns += `M${f1(x - cr)} ${f1(y - h * 0.4)}a${f1(cr)} ${f1(cr * 0.7)} 0 1 1 ${f1(2 * cr)} 0z`;
    roots += `M${f1(x - cr * 0.5)} ${f1(y + 1)}q${f1(cr * 0.3)} ${f1(-h * 0.5)} ${f1(cr * 0.5)} ${f1(-h * 0.45)}q${f1(cr * 0.2)} ${f1(h * 0.05)} ${f1(cr * 0.5)} ${f1(h * 0.45)}`;
  }
  return `<path d="${roots}" stroke="${W.hillNear}" stroke-width=".9" fill="none"/><path d="${crowns}" fill="${mixHex(W.hillNear, P.canopyNear, 0.5)}"/>`
    + `<path d="${crowns}" fill="${W.peach}" opacity=".07"/>`;
}

// ——— 9-1 「往淡水」 ———

/** 9-1's car: the back wall's windows, the floor line (the floor ledges' feet) and the body's foot; the end window over the seat. */
const CAR = { ceiling: 54, winTop: 136, winBottom: 262, floor: 486, body: 540 } as const;
const END_WIN = { x0: 298, x1: 388, y0: 300, y1: 440 } as const;

/** The dawn view from the 淡水信義線 past 紅樹林: the river opening to the sea, 觀音山, mangroves, and the 關渡大橋's red arch. */
function riverView(ctx: KitCtx, x0: number, y0: number, x1: number, y1: number, { arch = false } = {}): string {
  const horizon = y0 + (y1 - y0) * 0.56;
  const w = x1 - x0;
  return dawnSky(ctx, horizon, { seed: 91, stars: 10, glow: [x0 + w * 0.82, horizon, w * 0.9, (y1 - y0) * 0.5] })
    + dawnClouds(ctx, [[x0 + w * 0.3, y0 + (y1 - y0) * 0.24, w * 0.5], [x0 + w * 0.72, y0 + (y1 - y0) * 0.36, w * 0.36]])
    + guanyin(ctx, x0 - w * 0.25, x0 + w * 0.8, horizon + 2, (y1 - y0) * 0.36, { lights: 6, seed: 92 })
    + seaWater(ctx, x0 - 10, horizon + 3, x1 + 10, y1 + 4, 93, { glowX: x0 + w * 0.82, dense: 0.8 })
    + (arch ? (() => {
      // 關渡大橋: a red steel through-arch over the river (its crown at (321, 326)), the deck under it
      const [ax0, ax1, base, crown] = [262, 380, 358, 324];
      const arc = `M${ax0} ${base}Q${(ax0 + ax1) / 2} ${crown - (base - crown) * 0.98} ${ax1} ${base}`;
      let hangers = '';
      for (let x = ax0 + 10; x < ax1 - 6; x += 10) {
        const t = (x - ax0) / (ax1 - ax0);
        hangers += `M${x} ${f1(base - 4 * t * (1 - t) * (base - crown) * 0.98 * 2 + 1)}V${base}`;
      }
      return `<path d="${hangers}" stroke="${W.trimRedDeep}" stroke-width=".9"/>`
        + `<path d="${arc}" stroke="${W.trimRed}" stroke-width="5" fill="none"/><path d="${arc}" stroke="${W.peachLight}" stroke-width="1" fill="none" opacity=".55" transform="translate(.8 -1.6)"/>`
        + `<path d="M${ax0 - 30} ${base}H${ax1 + 30}" stroke="${W.trimRedDeep}" stroke-width="3"/><path d="M${ax0 - 30} ${base - 1}H${ax1 + 30}" stroke="${W.peach}" stroke-width=".8" opacity=".6"/>`
        + `<path d="M${ax0} ${base}V${y1}M${ax1} ${base}V${y1}" stroke="${W.hillNear}" stroke-width="4"/>`;
    })() : '')
    + mangroves(x0 - 10, x1 + 10, y1 - 4, 94, 12);
}

/** A standing steel luggage rack (Mocha's perch, its top at (x, top)): a wire shelf on two tubular stanchions. */
function luggageRack(ctx: KitCtx, x: number, top: number, w: number, foot: number): string {
  const [l, r] = [x - w / 2, x + w / 2];
  let wires = '';
  for (let sx = l + 5; sx < r - 2; sx += 6) wires += `M${f1(sx)} ${top + 1.5}v4`;
  return depth(ctx, 3, `<path d="M${f1(l + 6)} ${top + 6}V${foot}M${f1(r - 6)} ${top + 6}V${foot}" stroke="${ref(ctx, 'steelH')}" stroke-width="3.4"/>`
    + `<path d="M${f1(l + 6)} ${top + 30}L${f1(l + 20)} ${top + 7}M${f1(r - 6)} ${top + 30}L${f1(r - 20)} ${top + 7}" stroke="${W.steelDeep}" stroke-width="2"/>`
    + `<rect x="${f1(l)}" y="${top}" width="${w}" height="7" rx="3" fill="${W.steelDeep}"/><path d="${wires}" stroke="${W.steel}" stroke-width="1.2"/>`
    + `<path d="M${f1(l + 2)} ${top + 0.8}H${f1(r - 2)}" stroke="${C.cutRim}" stroke-width="1.2" opacity=".6"/>`
    + `<rect x="${f1(l + 2)}" y="${foot - 4}" width="12" height="4" rx="1" fill="${W.steelDeep}"/><rect x="${f1(r - 14)}" y="${foot - 4}" width="12" height="4" rx="1" fill="${W.steelDeep}"/>`,
  `<rect x="${f1(l)}" y="${top}" width="${w}" height="${foot - top}"/>`);
}

/**
 * 9-1: a 淡水信義線 car past 紅樹林, up out of the tunnel at dawn (bible § 6 cars row: a side cut-away
 * box, the line's red band). Its back wall: the cream ceiling with its strip lights and the route
 * strip (紅樹林 → 淡水, the end of the line, lit), the strap rail, the window band onto the dawn — the
 * 淡水河 widening to the sea, 觀音山 across it, mangroves along the bank — over the wall with the red
 * band. The far end: the end wall with its big window over the window seat (the blind is a part; behind
 * it the 關渡大橋's red arch, where the 土地公 sits at (312, 330)), its deep sill (`W`, y 442) and the
 * teal 博愛座 sign. Mocha's racks stand in the aisle (`rack1` over the bench, (48, 384); `rack2` by the
 * end wall, (270, 384)). The car's floor and its red-banded body across the page; the viaduct below.
 */
const tamsuiLine: BackdropDraw = (ctx) => {
  // (the bake lifts this chapter's colours toward the dawn: ×1.32 red; the car is authored dusky)
  const { ceiling, winTop, winBottom, floor, body } = CAR;
  // The windows onto the dawn (one view behind both, clipped to them)
  const wins: [number, number][] = [[14, 112], [152, 112]];
  const clip = ctx.id('c9win');
  const winPath = wins.map(([x, w]) => `M${x + 10} ${winTop}h${w - 20}a10 10 0 0 1 10 10v${winBottom - winTop - 20}a10 10 0 0 1 -10 10h${20 - w}a10 10 0 0 1 -10 -10v${20 - winBottom + winTop}a10 10 0 0 1 10 -10z`).join('');
  const outside = `<clipPath id="${clip}"><path d="${winPath}"/></clipPath><g clip-path="url(#${clip})">${windowView(riverView(ctx, 0, winTop, 290, winBottom), 0, winTop, 290, winBottom - winTop)}`
    + wins.map(([x, w]) => `<path d="M${x + w * 0.15} ${winBottom}L${x + w * 0.45} ${winTop}H${x + w * 0.55}L${x + w * 0.25} ${winBottom}Z" fill="${C.glassine}" opacity=".1"/>`).join('') + `</g>`
    + `<path d="${winPath}" fill="none" stroke="${W.steelDeep}" stroke-width="5"/><path d="${winPath}" fill="none" stroke="${W.steel}" stroke-width="1.4" transform="translate(-.8 -.8)" opacity=".7"/>`;
  // The wall: cream card warming in the dawn, the line's red band under the windows, a steel kick panel
  const wall = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'carWallG')}"/>`
    + `<rect x="-20" y="${winBottom + 18}" width="${PAGE_W + 40}" height="9" fill="${P.xinyi}"/><rect x="-20" y="${winBottom + 27}" width="${PAGE_W + 40}" height="2" fill="${P.xinyiDeep}"/>`
    + `<rect x="-20" y="318" width="${PAGE_W + 40}" height="42" fill="${mixHex(W.steelDeep, W.violet, 0.3)}"/>`
    + `<path d="${Array.from({ length: 48 }, (_, i) => `M${-16 + i * 9} 326v26`).join('')}" stroke="${W.steel}" stroke-width="1.4" opacity=".35"/>`
    // The dawn pouring in through the windows onto the wall below them
    + `<path d="M14 ${winBottom}L-20 340H140L126 ${winBottom}ZM152 ${winBottom}L130 340H300L264 ${winBottom}Z" fill="${W.peachLight}" opacity=".12"/>`;
  // The ceiling: a cream vault, strip lights, the route strip, the strap rail and its straps
  const ceil = `<path d="M-20 0H410V${ceiling}Q195 ${ceiling + 18} -20 ${ceiling}Z" fill="${mixHex(W.plaster, W.violet, 0.45)}"/>`
    + `<path d="M-20 ${ceiling}Q195 ${ceiling + 18} 410 ${ceiling}" stroke="${W.plasterShade}" stroke-width="2" fill="none"/>`
    + [44, 140, 250, 346].map((x) => `<rect x="${x - 30}" y="18" width="60" height="6" rx="3" fill="${C.lampHot}"/>`).join('')
    + softEllipse(ctx, 195, 26, 220, 18, 'lamp', 0.2, 'blur8');
  const stops: [number, string][] = [[118, '竹圍'], [176, '紅樹林'], [250, '淡水']];
  const route = depth(ctx, 2, `<rect x="96" y="62" width="196" height="26" rx="4" fill="${T.navyDeep}"/>`, `<rect x="96" y="62" width="196" height="26"/>`)
    + `<path d="M108 80H280" stroke="${P.xinyi}" stroke-width="3.4" stroke-linecap="round"/>`
    + stops.map(([x, name], i) => (i === 2 ? softEllipse(ctx, x, 80, 10, 9, 'lamp', 0.5) : '') + `<circle cx="${x}" cy="80" r="${i === 2 ? 4.4 : 3}" fill="${i === 2 ? C.lampHot : W.steel}" stroke="${P.xinyi}" stroke-width="1.4"/>`
      + serif(x, 74, i === 2 ? 7.6 : 6, i === 2 ? C.lampHot : C.chalk, name, i === 2 ? '' : ' opacity=".7"')).join('')
    + `<path d="M268 80l8 -3.4v6.8z" fill="${C.lampHot}"/>`;
  let straps = '';
  for (let x = 30; x < 290; x += 40) {
    if (x > 92 && x < 210) continue;
    straps += `<path d="M${x} 100V118" stroke="${P.xinyiDeep}" stroke-width="3.4"/><circle cx="${x}" cy="126" r="7" fill="none" stroke="${W.steelDeep}" stroke-width="3.6"/><circle cx="${x}" cy="126" r="7" fill="none" stroke="${W.steel}" stroke-width="1.6"/>`;
  }
  const rail = `<path d="M-20 98H300" stroke="${W.steel}" stroke-width="3"/><path d="M-20 97H300" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>` + straps;
  // Two stainless poles in the aisle
  const poles = [128, 222].map((x) => `<rect x="${x - 2.5}" y="${ceiling + 8}" width="5" height="${floor - ceiling - 8}" fill="${ref(ctx, 'steelH')}"/><path d="M${x - 1} ${ceiling + 8}V${floor}" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`).join('');
  // The end wall: a cream bulkhead standing on the floor at the far end, its big window over the seat
  const { x0, x1, y0, y1 } = END_WIN;
  const endClip = ctx.id('c9end');
  const endView = `<clipPath id="${endClip}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="8"/></clipPath><g clip-path="url(#${endClip})">${riverView(ctx, 250, y0, 410, y1, { arch: true })}`
    + `<path d="M${x0 + 10} ${y1}L${x0 + 40} ${y0}H${x0 + 52}L${x0 + 22} ${y1}Z" fill="${C.glassine}" opacity=".1"/></g>`;
  const endWall = depth(ctx, 3, `<path d="M290 248H410V${floor + 6}H290Z" fill="${ref(ctx, 'carWallG')}"/>`
    + `<rect x="290" y="${winBottom + 18}" width="120" height="9" fill="${P.xinyi}"/>`
    + `<path d="M291 249H409" stroke="${C.cutRim}" stroke-width="1.2" opacity=".5"/><path d="M291 248V${floor + 6}" stroke="${mixHex(W.plasterShade, W.violetDeep, 0.5)}" stroke-width="2"/>`, `<path d="M290 248H410V${floor + 6}H290Z"/>`)
    + endView
    + `<rect x="${x0 - 3}" y="${y0 - 3}" width="${x1 - x0 + 6}" height="${y1 - y0 + 6}" rx="10" fill="none" stroke="${W.steelDeep}" stroke-width="5"/>`
    // The deep sill (the bead's ledge, `W`) and the 博愛座 sign over the window
    + depth(ctx, 3, `<rect x="${x0 - 8}" y="${y1}" width="${x1 - x0 + 16}" height="9" rx="2" fill="${ref(ctx, 'steelV')}"/><path d="M${x0 - 7} ${y1 + 0.8}H${x1 + 7}" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<rect x="${x0 - 8}" y="${y1}" width="${x1 - x0 + 16}" height="9"/>`)
    + depth(ctx, 2, `<rect x="314" y="272" width="62" height="16" rx="3" fill="${T.priority}"/>`, `<rect x="314" y="272" width="62" height="16" rx="3"/>`)
    + serif(345, 283.6, 9, C.cutRim, '博愛座', ' letter-spacing="2" opacity=".9"');
  // The floor page: the car's grey studded floor, the dawn's pools through the windows, the body shell, the viaduct
  const trackTop = body + 14;
  let studs = '';
  const r = seeded(95);
  for (let i = 0; i < 160; i++) studs += `<circle cx="${f1(-40 + r() * 470)}" cy="${f1(GUTTER_Y + r() * (floor - GUTTER_Y))}" r="1.1"/>`;
  const floorArt = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(W.hillNear, C.shadow, 0.3)}"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${floor - GUTTER_Y + 10}" fill="${mixHex(T.floorLinoDeep, W.violetDeep, 0.45)}"/>`
    + `<g fill="${mixHex(T.floorLino, W.violet, 0.3)}" opacity=".7">${studs}</g>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="22" fill="${C.shadow}" opacity=".22"/>`
    + pools(ctx, [[80, 420, 120, 26, 'dawn'], [220, 430, 110, 24, 'dawn'], [195, 470, 220, 30]])
    // The viaduct under the car: its concrete deck, the rails catching the dawn, the river far below
    + seaWater(ctx, FLOOR_RECT.x, trackTop + 40, FLOOR_RECT.x + FLOOR_RECT.w, FLOOR_BOTTOM + 4, 96, { glowX: 330, dense: 0.6 })
    + mangroves(FLOOR_RECT.x, FLOOR_RECT.x + FLOOR_RECT.w, FLOOR_BOTTOM + 6, 97, 26)
    + `<rect x="${FLOOR_RECT.x}" y="${trackTop}" width="${FLOOR_RECT.w}" height="40" fill="${ref(ctx, 'concreteG')}"/>`
    + `<path d="M-60 ${trackTop + 12}H460M-60 ${trackTop + 26}H460" stroke="${W.steelDeep}" stroke-width="3"/><path d="M-60 ${trackTop + 11}H460M-60 ${trackTop + 25}H460" stroke="${W.peachLight}" stroke-width=".9" opacity=".6"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${trackTop + 38}" width="${FLOOR_RECT.w}" height="6" fill="${W.pylonDeep}"/>`
    + `<path d="${Array.from({ length: 4 }, (_, i) => `M${30 + i * 120} ${trackTop + 44}v${FLOOR_BOTTOM - trackTop - 40}`).join('')}" stroke="${mixHex(W.pylonDeep, W.violetDeep, 0.4)}" stroke-width="22"/>`
    + `<path d="${Array.from({ length: 4 }, (_, i) => `M${40 + i * 120} ${trackTop + 44}v${FLOOR_BOTTOM - trackTop - 40}`).join('')}" stroke="${W.peach}" stroke-width="2" opacity=".25"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${trackTop}" width="${FLOOR_RECT.w}" height="8" fill="${C.shadow}" opacity=".35"/>`);
  const shell = depth(ctx, 3, `<rect x="-30" y="${floor}" width="${PAGE_W + 60}" height="${body - floor}" fill="${mixHex(W.plaster, W.violet, 0.6)}"/>`
    + `<rect x="-30" y="${floor + 14}" width="${PAGE_W + 60}" height="10" fill="${P.xinyi}"/><rect x="-30" y="${floor + 25}" width="${PAGE_W + 60}" height="2" fill="${P.xinyiDeep}"/>`
    + `<rect x="-30" y="${body - 8}" width="${PAGE_W + 60}" height="8" fill="${mixHex(W.steelDeep, C.shadow, 0.3)}"/>`, `<rect x="-30" y="${floor}" width="${PAGE_W + 60}" height="${body - floor}"/>`)
    + [60, 330].map((x) => `<rect x="${x - 26}" y="${body}" width="52" height="12" rx="2" fill="${W.steelDeep}"/><circle cx="${x - 14}" cy="${body + 12}" r="8" fill="${C.printDark}"/><circle cx="${x + 14}" cy="${body + 12}" r="8" fill="${C.printDark}"/>`).join('');
  const racks = luggageRack(ctx, 48, 384, 72, 458) + luggageRack(ctx, 266, 384, 64, 470);
  return tamsuiDefs(ctx) + standingPage(ctx, wall + outside + ceil + route + rail)
    + floorArt + shell + poles + endWall + racks + bookCues(ctx) + block();
};

// ——— 9-2 「淡水老街」 ———

/** A run of red-brick courses over a face from (x0, y0) to (x1, y1). */
function brickFace(x0: number, y0: number, x1: number, y1: number, course = 6, seed = 1): string {
  const r = seeded(seed);
  let joints = '';
  let headers = '';
  for (let y = y0 + course, row = 0; y < y1; y += course, row++) {
    joints += `M${f1(x0)} ${f1(y)}H${f1(x1)}`;
    for (let x = x0 + (row % 2) * 7 + 3; x < x1; x += 14) {
      headers += `M${f1(x)} ${f1(y - course)}v${course}`;
      if (r() < 0.05) joints += `M${f1(x + 1)} ${f1(y - course + 1.5)}h10`;
    }
  }
  return `<rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(x1 - x0)}" height="${f1(y1 - y0)}" fill="${W.brick}"/>`
    + `<path d="${joints}${headers}" stroke="${W.brickDeep}" stroke-width=".8" opacity=".55"/>`;
}

/**
 * An old-street shophouse (淡水老街's two-storey 街屋) from x0 to x1: a red-brick upper floor with two
 * arched windows (one lit), a moulded parapet, and the arcade (亭仔腳) below — plaster piers and arches
 * over the shop front, the arcade's shade. `top` is the parapet's top, the arcade's arch springs at `spring`.
 */
function shophouse(ctx: KitCtx, x0: number, x1: number, top: number, spring: number, seed: number, { lit = 0, parapet = 'round' as 'round' | 'step' } = {}): string {
  const w = x1 - x0;
  const upper = top + 22;
  const par = parapet === 'round'
    ? `M${x0} ${upper}V${top + 10}H${f1(x0 + w * 0.3)}Q${f1(x0 + w * 0.5)} ${top - 10} ${f1(x0 + w * 0.7)} ${top + 10}H${x1}V${upper}Z`
    : `M${x0} ${upper}V${top + 8}H${f1(x0 + w * 0.25)}V${top}H${f1(x1 - w * 0.25)}V${top + 8}H${x1}V${upper}Z`;
  const winW = Math.min(30, w * 0.24);
  const wins = [x0 + w * 0.3, x0 + w * 0.7].map((cx, i) => {
    const d = `M${f1(cx - winW / 2)} ${spring - 20}V${upper + 18}a${f1(winW / 2)} ${f1(winW / 2)} 0 0 1 ${f1(winW)} 0V${spring - 20}Z`;
    return `<path d="${d}" fill="${i < lit ? ref(ctx, 'window') : mixHex(W.violetDeep, C.shadow, 0.35)}"/>`
      + `<path d="M${f1(cx)} ${upper + 10}V${spring - 20}M${f1(cx - winW / 2)} ${spring - 34}H${f1(cx + winW / 2)}" stroke="${W.woodDeep}" stroke-width="1.6"/>`
      + `<path d="M${f1(cx - winW / 2 - 3)} ${upper + 18}a${f1(winW / 2 + 3)} ${f1(winW / 2 + 3)} 0 0 1 ${f1(winW + 6)} 0" stroke="${W.plaster}" stroke-width="2.4" fill="none"/>`;
  }).join('');
  // The arcade: piers and round arches over the walkway, deep shade inside
  const n = Math.max(1, Math.round(w / 64));
  const bay = w / n;
  let arches = '';
  for (let i = 0; i < n; i++) {
    const ax = x0 + i * bay + 7;
    arches += `M${f1(ax)} ${GUTTER_Y}V${spring}a${f1(bay / 2 - 7)} ${f1(Math.min(18, bay / 2 - 7))} 0 0 1 ${f1(bay - 14)} 0V${GUTTER_Y}Z`;
  }
  return depth(ctx, 2, `<path d="${par}" fill="${ref(ctx, 'plasterG')}"/>` + brickFace(x0, upper, x1, spring - 8, 6, seed)
    + `<rect x="${x0}" y="${upper - 2}" width="${w}" height="5" fill="${W.plaster}"/><rect x="${x0}" y="${spring - 10}" width="${w}" height="6" fill="${W.plaster}"/>`
    + `<rect x="${x0}" y="${spring - 4}" width="${w}" height="${GUTTER_Y - spring + 4}" fill="${ref(ctx, 'plasterG')}"/>`
    + `<path d="${arches}" fill="${mixHex(W.violetDeep, C.shadow, 0.45)}"/>`
    + `<path d="M${x0} ${upper - 1.4}H${x1}M${x0} ${f1(top + 10.6)}H${x1}" stroke="${C.cutRim}" stroke-width="1" opacity=".4"/>`
    + `<path d="M${x1 - 1} ${upper}V${GUTTER_Y}" stroke="${W.peach}" stroke-width="2" opacity=".35"/>` + wins, `<path d="${par}"/><rect x="${x0}" y="${upper}" width="${w}" height="${GUTTER_Y - upper}"/>`);
}

/** A vertical shop signboard hung from a bracket (Mocha's on 9-2: its top at (x, top)), its lettering in luminous ink. */
function shopSign(ctx: KitCtx, x: number, top: number, h: number, text: string, color: string): string {
  return depth(ctx, 3, `<path d="M${x} ${top - 12}V${top}" stroke="${W.steelDeep}" stroke-width="2"/><path d="M${x - 16} ${top - 12}H${x + 4}" stroke="${W.steelDeep}" stroke-width="2.4"/>`
    + `<rect x="${x - 12}" y="${top}" width="24" height="${h}" rx="2" fill="${W.woodDeep}"/><rect x="${x - 9}" y="${top + 3}" width="18" height="${h - 6}" rx="1" fill="${color}"/>`
    + `<path d="M${x - 11} ${top + 0.8}H${x + 11}" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="${x - 12}" y="${top}" width="24" height="${h}"/>`)
    + `<text data-art-text="" x="${x}" y="${top + 16}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="12" fill="${C.washi}" writing-mode="tb" letter-spacing="2">${text}</text>`;
}

/**
 * 9-2: 淡水老街 before the shops open, the first light at the top of the street. Two shophouses over
 * the granite lane. Left: the 阿給 shop — its rolling shutter (a part, (154, 304)) over the shop's
 * window, its display shelf below it (where the 招財貓 glints, (170, 360)), a stack of steamers by the
 * door, and the bench in the arcade where the 背包客 sits down (packBench, (196, 432); the 土地公
 * beside him, (160, 420)). Right: the 鐵蛋 shop up its step — its signboard over the arcade (Mocha's
 * `sign`, its top at (262, 352)), its shutter (a part, (338, 344)) over the counter (`C`, (362, 420)),
 * a jar of black 鐵蛋. Down the lane at the left, an old iron street lamp (Mocha's `lamp`, (30, 360)).
 * Above the roofs, 觀音山 across the river and the 淡江大橋's tower far off at the river mouth.
 */
const oldStreet: BackdropDraw = (ctx) => {
  const sky = dawnSky(ctx, 170, { seed: 201, stars: 22, glow: [360, 180, 230, 110] })
    + dawnClouds(ctx, [[110, 52, 150], [300, 80, 120], [210, 118, 90]]);
  const far = guanyin(ctx, -40, 250, 176, 70, { lights: 5, seed: 202 })
    + tamkangBridge(ctx, { px: 336, deckY: 150, top: 46, water: 174, left: 180, right: 398 })
    + `<rect x="-20" y="172" width="${PAGE_W + 40}" height="10" fill="${mixHex(W.sea, W.violet, 0.4)}"/>`;
  // The two shophouses: the 阿給 shop's (left), the 鐵蛋 shop's (right, a step up)
  const houses = shophouse(ctx, -20, 222, 150, 300, 203, { lit: 1 }) + shophouse(ctx, 226, 410, 132, 300, 204, { parapet: 'step', lit: 2 });
  // The 阿給 shop's front: its window behind the shutter (lit inside once it's up), the display shelf,
  // the shop's name on a cream board, steamers stacked by the door
  const agei = `<rect x="150" y="300" width="48" height="42" fill="${ref(ctx, 'window')}"/>` + softEllipse(ctx, 174, 322, 36, 26, 'lamp', 0.22, 'blur8')
    + `<path d="M150 300h48v42h-48z" fill="none" stroke="${W.woodDeep}" stroke-width="3"/>`
    + depth(ctx, 2, `<rect x="40" y="268" width="96" height="22" rx="2" fill="${W.canvas}"/>`, `<rect x="40" y="268" width="96" height="22"/>`)
    + serif(88, 284, 13, W.trimRedDeep, '老牌阿給', ' letter-spacing="2"')
    + depth(ctx, 2, [0, 1, 2].map((i) => `<rect x="${44 + i * 2}" y="${334 - i * 12}" width="${30 - i * 4}" height="11" rx="2" fill="${W.woodLight}"/><path d="M${44 + i * 2} ${337 - i * 12}h${30 - i * 4}" stroke="${W.woodDeep}" stroke-width="1"/>`).join(''), `<rect x="44" y="310" width="30" height="35"/>`);
  // The 鐵蛋 shop's front: its service window over the counter (behind the shutter), a jar of 鐵蛋
  const tiedan = `<rect x="334" y="340" width="50" height="40" fill="${ref(ctx, 'window')}"/>` + softEllipse(ctx, 358, 360, 36, 26, 'lamp', 0.24, 'blur8')
    + `<path d="M334 340h50v40h-50z" fill="none" stroke="${W.woodDeep}" stroke-width="3"/>`
    + depth(ctx, 2, `<rect x="236" y="250" width="132" height="24" rx="2" fill="${W.trimRedDeep}"/>`, `<rect x="236" y="250" width="132" height="24"/>`)
    + serif(302, 267, 13, C.washi, '阿婆鐵蛋', ' letter-spacing="3"')
    + depth(ctx, 3, `<path d="M248 348q-2 -16 6 -18h12q8 2 6 18z" fill="${C.glassine}" opacity=".55"/>`
      + Array.from({ length: 7 }, (_, i) => `<ellipse cx="${253 + (i % 4) * 5}" cy="${343 - Math.floor(i / 4) * 5}" rx="2.8" ry="3.4" fill="${W.egg}"/>`).join('')
      + `<rect x="250" y="326" width="20" height="4" rx="1" fill="${W.trimRed}"/>`, `<path d="M248 348q-2 -16 6 -18h12q8 2 6 18z"/>`);
  // The signboard over the 鐵蛋 shop's step (Mocha's `sign`, its top at (262, 352))
  const sign = shopSign(ctx, 262, 352, 64, '鐵蛋', W.trimRed);
  // The lane's iron lamp at the near end (Mocha's `lamp`, top at (30, 360))
  const lamp = harbourLamp(ctx, 30, 356, 470, 1.15);
  // The floor page: the granite lane's setts, the arcade's step, the lamp's and the dawn's pools
  const r = seeded(205);
  let setts = '';
  for (let y = GUTTER_Y + 8, row = 0; y < FLOOR_BOTTOM; y += 9 + row * 0.9, row++) {
    for (let x = -60 + (row % 2) * 9 + r() * 4; x < 450; x += 18 + row * 0.6) setts += `M${f1(x + 1)} ${f1(y + 1)}h${f1(15 + row * 0.5)}v${f1(7 + row * 0.8)}h${f1(-15 - row * 0.5)}z`;
  }
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${W.granite}"/>`
    + `<path d="${setts}" fill="${W.graniteLight}" opacity=".35"/><path d="${setts}" fill="none" stroke="${mixHex(W.granite, C.shadow, 0.4)}" stroke-width=".7" opacity=".6"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="20" fill="${C.shadow}" opacity=".28"/>`
    + pools(ctx, [[34, 470, 90, 22], [174, 400, 70, 16], [358, 420, 70, 16], [300, 560, 200, 40, 'dawn']]));
  // The bench in the 阿給 shop's arcade (packBench, the seat at y 432), a shop's display shelf by its window
  const bench = depth(ctx, 3, `<rect x="140" y="426" width="96" height="8" rx="2" fill="${ref(ctx, 'woodG')}"/><path d="M148 434V456M228 434V456" stroke="${W.woodDeep}" stroke-width="4"/>`
    + `<rect x="140" y="400" width="96" height="6" rx="2" fill="${W.wood}"/><path d="M146 406V426M230 406V426" stroke="${W.woodDeep}" stroke-width="3"/>`
    + `<path d="M141 426.8H235" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="140" y="400" width="96" height="56"/>`);
  const shelf = depth(ctx, 2, `<rect x="146" y="376" width="56" height="6" rx="1.4" fill="${W.woodLight}"/><path d="M150 382l4 8M198 382l-4 8" stroke="${W.woodDeep}" stroke-width="2"/>`, `<rect x="146" y="376" width="56" height="14"/>`);
  return tamsuiDefs(ctx) + standingPage(ctx, sky + far + houses + agei + tiedan)
    + floor + shelf + bench + sign + lamp + bookCues(ctx) + block();
};

// ——— 9-3 「渡輪」 ———

/**
 * 9-3: the 淡水 ferry pier at dawn, the little ferry to 八里 alongside. Behind: the river wide and
 * glassine, 觀音山 across it with 八里's lights at its foot, the 淡江大橋 at the river mouth on the right
 * in the first light, a fishing boat heading out. The pier on the left: its wooden deck, the ticket
 * booth (Mocha's `booth`, its roof at (44, 384)), a lifebuoy; the boarding gate is a part (G, (144,
 * 476)). The ferry on the right: its white cabin with its windows lit, the horn on its roof (a part,
 * (214, 330); Mocha's `horn`), its flagpole (the 土地公 at (330, 330)); the railing along the deck
 * (its top rail Mocha's `rail`, (258, 404); its middle rail at his chest, the way past the rope); the
 * coil of rope on the deck between D2 and D3; the high bench at the stern (the bead's, (364, 432)).
 */
const ferry: BackdropDraw = (ctx) => {
  const sky = dawnSky(ctx, 250, { seed: 301, stars: 26, glow: [350, 256, 240, 120], moon: [52, 60, 13] })
    + dawnClouds(ctx, [[150, 120, 170], [320, 168, 140], [60, 196, 90]]);
  const far = guanyin(ctx, -40, 270, 252, 92, { lights: 9, seed: 302 })
    + tamkangBridge(ctx, { px: 352, deckY: 222, top: 92, water: 252, left: 196, right: 412 });
  const river = seaWater(ctx, -20, 252, PAGE_W + 20, GUTTER_Y, 303, { glowX: 352 })
    + farBoat(ctx, 228, 282, 1.1, true) + farBoat(ctx, 96, 268, 0.7);
  // The ferry's cabin, standing at the deck's back: white sides, a teal band, its windows lit, the roof
  const cabin = depth(ctx, 3, `<path d="M150 470V352Q150 344 158 344H300Q310 344 312 352L316 470Z" fill="${ref(ctx, 'hullWhiteG')}"/>`
    + `<rect x="150" y="440" width="166" height="12" fill="${W.hullTeal}"/>`
    + [160, 196, 232, 268].map((x) => `<rect x="${x}" y="362" width="30" height="34" rx="5" fill="${ref(ctx, 'window')}"/><path d="M${x + 4} 394L${x + 18} 364" stroke="${C.cutRim}" stroke-width="2" opacity=".25"/>`).join('')
    + `<path d="M144 346H318" stroke="${W.hullTeal}" stroke-width="6" stroke-linecap="round"/><path d="M146 343.4H316" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`
    + `<path d="M314 352V470" stroke="${W.peach}" stroke-width="3" opacity=".4"/>`, `<path d="M144 340H318V470H144Z"/>`)
    + softEllipse(ctx, 230, 380, 90, 30, 'lamp', 0.16, 'blur8')
    + serif(233, 418, 11, W.hullTeal, '淡水 ⇄ 八里', ' letter-spacing="1.5"');
  // The flagpole at the cabin's end (the 土地公 at (330, 330)) with its little pennant
  const flag = `<path d="M334 470V300" stroke="${W.steelDeep}" stroke-width="2.4"/><circle cx="334" cy="298" r="2.4" fill="${ref(ctx, 'foil')}"/>`
    + `<path d="M335 304q12 2 22 8q-10 4 -22 6z" fill="${W.trimRed}"/><path d="M335 304q12 2 22 8" stroke="${W.peachLight}" stroke-width=".8" fill="none" opacity=".6"/>`;
  // The floor page: the river close by between the pier and the ferry, the pier's piles
  const water = floorPage(ctx, seaWater(ctx, FLOOR_RECT.x, GUTTER_Y, FLOOR_RECT.x + FLOOR_RECT.w, FLOOR_BOTTOM + 4, 304, { glowX: 300 })
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="16" fill="${C.shadow}" opacity=".2"/>`
    + pools(ctx, [[60, 470, 90, 22], [240, 470, 130, 26]]));
  // The pier's piles under its deck (left), the ferry's hull under its deck (right): seen below the ledges
  const piles = depth(ctx, 3, [8, 52, 96, 136].map((x) => `<rect x="${x - 5}" y="520" width="10" height="130" fill="${ref(ctx, 'woodH')}"/>`).join(''), [8, 52, 96, 136].map((x) => `<rect x="${x - 5}" y="520" width="10" height="130"/>`).join(''));
  const hull = depth(ctx, 3, `<path d="M168 520H420V560Q404 600 360 604H210Q178 590 168 560Z" fill="${ref(ctx, 'hullWhiteG')}"/>`
    + `<path d="M168 548H420" stroke="${W.hullTeal}" stroke-width="8"/><path d="M174 584Q240 598 360 598" stroke="${W.seaDeep}" stroke-width="3" fill="none" opacity=".5"/>`, `<path d="M168 520H420V604H168Z"/>`)
    + lifebuoy(ctx, 380, 572, 12) + `<path d="M170 608q30 6 60 0t60 0t60 0t60 0" stroke="${W.seaLit}" stroke-width="1.6" fill="none" opacity=".6"/>`;
  // The ticket booth on the pier (Mocha's `booth`, its roof at (44, 384))
  const booth = depth(ctx, 3, `<rect x="16" y="392" width="56" height="70" fill="${ref(ctx, 'woodG')}"/><rect x="24" y="402" width="40" height="28" rx="3" fill="${ref(ctx, 'window')}"/>`
    + `<path d="M24 416h40" stroke="${W.woodDeep}" stroke-width="1.4"/><path d="M8 392L16 382H72L80 392Z" fill="${W.hullTeal}"/><path d="M10 391H78" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<path d="M8 382H80V462H8Z"/>`)
    + serif(44, 448, 9, C.washi, '售票', ' letter-spacing="2"') + softEllipse(ctx, 44, 416, 30, 18, 'lamp', 0.18);
  // The coil of rope on the deck between D2 and D3 (lying at the deck's back, why he must hold the rail)
  const coil = ropeCoil(ctx, 286, 461, 1.05);
  // The ferry's railing: from the gate's side to the stern (its top rail at y 404 — Mocha's — its
  // middle rail at y 428, the height he holds standing)
  const rail = railing(ctx, 176, 350, 404, 428, 462, { every: 29, z: 3 });
  // The high bench at the stern (the bead's, its seat at y 432)
  const sternBench = depth(ctx, 3, `<rect x="340" y="428" width="56" height="8" rx="2" fill="${ref(ctx, 'woodG')}"/><path d="M346 436V462M390 436V462" stroke="${W.woodDeep}" stroke-width="4"/>`
    + `<path d="M341 428.8H395" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="340" y="428" width="56" height="34"/>`);
  return tamsuiDefs(ctx) + standingPage(ctx, sky + far + river)
    + water + piles + hull + cabin + flag + booth + sternBench + coil + rail + bookCues(ctx) + block();
};

// ——— 9-4 「漁人碼頭」 ———

/**
 * 9-4: 漁人碼頭 at low tide in the first light. Behind: the harbour inlet with the 情人橋 curving over
 * it (the 土地公 at (236, 250) at sunset), the 淡江大橋 beyond at the river mouth, 觀音山 across, the
 * open sea's horizon glowing peach. The boardwalk on the left (the ledges; under repair between W2 and
 * W3, where the plank runs along its railing — the railing at his chest), its lamp (Mocha's `lamp`, the
 * lantern's top at (52, 340)) and the tide board where the sun dial turns (a part at (112, 286)). The
 * tidal flat in the middle: wet mud with a channel, oyster shells, the stepping stone (Mocha's `stone`,
 * (258, 500)); the tide and the dinghy are parts. The far pier on the right (P1) with its mooring
 * post (the bead's, (370, 392)) and the 店員小哥's ice-cream kiosk (Mocha's `kiosk`, the awning's top
 * at (340, 352)).
 */
const fishermansWharf: BackdropDraw = (ctx) => {
  const sky = dawnSky(ctx, 238, { seed: 401, stars: 24, glow: [300, 240, 280, 130] })
    + dawnClouds(ctx, [[90, 70, 160], [300, 110, 180], [190, 160, 110]]);
  const far = guanyin(ctx, -60, 170, 236, 84, { lights: 6, seed: 402 })
    + tamkangBridge(ctx, { px: 128, deckY: 206, top: 78, water: 236, left: -60, right: 186 })
    + seaWater(ctx, -20, 236, PAGE_W + 20, GUTTER_Y, 403, { glowX: 300 })
    + farBoat(ctx, 330, 248, 0.8);
  // The 情人橋 over the inlet (the 土地公 on it at sunset), the far quay's lamps under it
  const lovers = loversBridge(ctx, 236, 256, 1.05)
    + `<rect x="150" y="268" width="180" height="8" fill="${mixHex(W.granite, W.violet, 0.4)}"/>`
    + [176, 214, 256, 300].map((x) => `<circle cx="${x}" cy="266" r="1.4" fill="${C.lampHot}"/>`).join('');
  // The boardwalk's railing (its top rail at y 362, its mid rail at his chest, 372), from the near end to the repair
  const rail = railing(ctx, -6, 186, 360, 372, 406, { every: 32, tone: 'wood', z: 3 });
  // The tide board on its post behind the boardwalk, where the sun dial turns (dawn · noon · sunset)
  const board = depth(ctx, 2, `<rect x="108" y="318" width="8" height="90" fill="${W.woodDeep}"/><circle cx="112" cy="286" r="44" fill="${ref(ctx, 'woodG')}"/>`
    + `<circle cx="112" cy="286" r="40" fill="none" stroke="${W.woodDeep}" stroke-width="1.4"/><path d="M112 236l-6 -10h12z" fill="${W.trimRedDeep}"/>`
    + `<path d="M75 270a40 40 0 0 1 74 0" stroke="${W.peachLight}" stroke-width="1.2" fill="none" opacity=".6"/>`, `<circle cx="112" cy="286" r="44"/>`)
    + serif(112, 344, 7, W.canvas, '潮汐', ' letter-spacing="2"');
  // The repair barrier at the boardwalk's gap, striped red and white
  const barrier = depth(ctx, 3, `<rect x="122" y="388" width="26" height="9" fill="${W.hullWhite}"/><path d="M124 397l6 -9M134 397l6 -9M144 397l4 -6" stroke="${W.trimRed}" stroke-width="3.4"/>`
    + `<path d="M124 397V412M146 397V412" stroke="${W.steelDeep}" stroke-width="2"/>`, `<rect x="122" y="388" width="26" height="24"/>`)
    + serif(136, 384, 6.4, W.canvas, '施工中');
  const lamp = harbourLamp(ctx, 52, 336, 410, 1.1);
  // The floor page: the tidal flat — wet mud, its channel, puddles holding the sky, shells; the far pier's stonework
  const r = seeded(404);
  let puddles = '';
  for (let i = 0; i < 14; i++) {
    const x = 120 + r() * 280, y = 446 + r() * 150, w = 10 + r() * 22;
    puddles += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(w)}" ry="${f1(w * 0.22)}"/>`;
  }
  let shells = '';
  for (let i = 0; i < 30; i++) shells += `<ellipse cx="${f1(100 + r() * 300)}" cy="${f1(440 + r() * 200)}" rx="1.8" ry="1.2"/>`;
  const flat = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${ref(ctx, 'mudG')}"/>`
    + seaWater(ctx, FLOOR_RECT.x, GUTTER_Y, FLOOR_RECT.x + FLOOR_RECT.w, 436, 405, { glowX: 300, dense: 0.7 })
    + `<path d="M${FLOOR_RECT.x} 436Q120 444 220 438T${FLOOR_RECT.x + FLOOR_RECT.w} 440" stroke="${W.mudLight}" stroke-width="2" fill="none" opacity=".7"/>`
    + `<path d="M90 650Q150 590 200 540T250 470Q270 450 330 440" stroke="${mixHex(W.sea, W.mudWet, 0.4)}" stroke-width="26" fill="none" stroke-linecap="round" opacity=".7"/>`
    + `<path d="M90 650Q150 590 200 540T250 470Q270 450 330 440" stroke="${W.seaLit}" stroke-width="1.2" fill="none" opacity=".5" transform="translate(-6 -2)"/>`
    + `<g fill="${W.seaLight}" opacity=".45">${puddles}</g><g fill="${W.peachLight}" opacity=".18">${puddles}</g>`
    + `<g fill="${W.canvas}" opacity=".5">${shells}</g>`
    + pools(ctx, [[52, 430, 70, 18], [330, 470, 120, 30, 'dawn']]));
  // The stepping stone on the flat (Mocha's `stone`, its top at y 500)
  const stone = softEllipse(ctx, 260, 512, 22, 4, 'shadow', 0.35)
    + depth(ctx, 3, `<path d="M240 512Q238 498 250 496Q262 492 272 498Q280 504 278 512Z" fill="${W.granite}"/><path d="M244 500q10 -6 24 -2" stroke="${W.graniteLight}" stroke-width="1.6" fill="none"/>`
      + `<path d="M242 508q16 3 34 0" stroke="${W.seaDeep}" stroke-width="1.4" fill="none" opacity=".5"/>`, `<path d="M240 512Q238 498 250 496Q262 492 272 498Q280 504 278 512Z"/>`);
  // The far pier: a stone quay wall from the flat up to its deck (y 434), its edge running off the page
  // (its top and fender match the far pier's ledge, `wharfPier`, so the ledge's box sits in it seamlessly)
  const pierFront = mixHex(W.pylonShade, W.violet, 0.3);
  let tyres = '';
  for (let x = 296; x < 420; x += 30) tyres += `<ellipse cx="${x}" cy="464" rx="7" ry="9" fill="${C.printDark}"/><ellipse cx="${x}" cy="464" rx="3.4" ry="4.6" fill="${W.pylonDeep}"/>`;
  const pier = depth(ctx, 3, `<path d="M290 417H420V434H282Z" fill="${mixHex(W.pylonShade, W.peach, 0.15)}"/><path d="M282 434H420V560H282Z" fill="${pierFront}"/>`
    + `<rect x="282" y="434" width="138" height="9" fill="${W.wood}"/>` + tyres
    + `<path d="${Array.from({ length: 5 }, (_, i) => `M282 ${488 + i * 16}H420`).join('')}" stroke="${W.pylonDeep}" stroke-width="1" opacity=".5"/>`
    + `<rect x="282" y="540" width="138" height="20" fill="${W.mudWet}" opacity=".6"/><path d="M282 434.5H420" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<path d="M282 417H420V560H282Z"/>`);
  // The mooring post on the pier (the bead's: its top at (370, 392)), a rope looped on it
  const post = softEllipse(ctx, 372, 418, 14, 3, 'shadow', 0.4)
    + depth(ctx, 4, `<path d="M362 418V398Q362 390 370 390Q378 390 378 398V418Z" fill="${ref(ctx, 'woodH')}"/><path d="M362 398Q370 394 378 398" stroke="${W.woodDeep}" stroke-width="1.4" fill="none"/>`
      + `<path d="M361 406q9 5 18 0" stroke="${W.rope}" stroke-width="3" fill="none"/><path d="M378 406q10 6 16 14" stroke="${W.rope}" stroke-width="2.4" fill="none"/>`, `<path d="M362 418V390H378V418Z"/>`);
  // The ice-cream kiosk on the far pier (Mocha's `kiosk`: its awning's top at (340, 352)), the 店員小哥
  // leaning on its counter in the lit window, a big paper cone on its roof's corner
  let stripes = '';
  for (let i = 0, x = 296; x < 388; x += 11.5, i++) stripes += `<path d="M${f1(x)} 354h11.5v14q-5.75 5 -11.5 0z" fill="${i % 2 ? W.hullWhite : W.candy}"/>`;
  const kiosk = depth(ctx, 3, `<rect x="304" y="364" width="78" height="56" fill="${mixHex(W.candyDeep, W.violet, 0.3)}"/><rect x="310" y="370" width="66" height="34" rx="2" fill="${ref(ctx, 'window')}"/>`
    + `<path d="M310 382h66" stroke="${W.candyDeep}" stroke-width=".8" opacity=".4"/>`, `<rect x="304" y="364" width="78" height="56"/>`)
    + softEllipse(ctx, 343, 386, 44, 26, 'lamp', 0.24, 'blur8')
    + clerk(ctx, 343, 404)
    + depth(ctx, 3, `<rect x="300" y="402" width="86" height="7" rx="1.4" fill="${W.hullWhite}"/><path d="M301 402.8H385" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="300" y="402" width="86" height="7"/>`)
    + depth(ctx, 3, `<path d="M294 352H390V356H294Z" fill="${W.candyDeep}"/>` + stripes + `<path d="M294 352.8H390" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<path d="M294 352H390V372H294Z"/>`)
    + depth(ctx, 3, `<path d="M376 350l7 -24l7 24z" fill="${W.woodLight}"/><path d="M379 340l8 4M378 345l10 3" stroke="${W.woodDeep}" stroke-width=".8"/><circle cx="383" cy="324" r="7" fill="${W.candy}"/><circle cx="380" cy="321" r="2" fill="${C.cutRim}" opacity=".6"/>`, `<path d="M376 317H390V350H376Z"/>`)
    + serif(343, 418, 7, W.hullWhite, '冰淇淋', ' letter-spacing="2"');
  return tamsuiDefs(ctx) + standingPage(ctx, sky + far + lovers + board + rail)
    + flat + pier + stone + kiosk + post + barrier + lamp + bookCues(ctx) + block();
};

// ——— 9-5 「淡江大橋」 ———

/** 9-5's tower: its left face's x at height y (it widens toward the deck), the deck line, the anchors' x. */
const TOWER = { deck: 470, baseX: 292, topX: 318 } as const;
const towerLeft = (y: number) => TOWER.baseX + ((TOWER.deck - y) * (TOWER.topX - TOWER.baseX)) / TOWER.deck;
/** The three tapped cables run at 45° through their parts' centres: x + y = 368 (Sol), 406 (La), 444 (Do). */
const NOTE_LINES = [368, 406, 444] as const;

/**
 * 9-5: on the 淡江大橋's deck at the foot of its single tower, at dawn. The tower rises off the top of
 * the page on the right — white concrete, its left face in the violet shade, its right taking the
 * peach, red lights up its edge — and the stay cables sweep down from it to the left across the whole
 * sky, in one plane, like harp strings: the three the 淡水 tune is played on (Sol, La, Do: x + y = 368,
 * 406, 444, under their parts) among the rest. Beyond the deck the river mouth opens to the Taiwan
 * Strait, the horizon glowing, 觀音山 on the left. The walkway (the ledges) with its railing and lamp
 * (Mocha's `lamp`, (40, 376)); the maintenance gantry at its end over the gap — its post, the bracket
 * (Mocha's `beam`, (148, 384)), the arm the platform hangs from (y 290). The tower's base (the ledges),
 * its maintenance box (the tune's dial is a part at (270, 384); its plate a cut-out) and the maintenance
 * ledge on the tower (the bead's, (364, 428)). Far below, the sea through the gap.
 */
const tamkangBridgePage: BackdropDraw = (ctx) => {
  const sky = dawnSky(ctx, 300, { seed: 501, stars: 26, glow: [250, 300, 300, 150] })
    + dawnClouds(ctx, [[90, 110, 150], [200, 190, 160], [60, 250, 110], [250, 262, 120]]);
  const sea = guanyin(ctx, -80, 150, 300, 70, { lights: 6, seed: 502 })
    + seaWater(ctx, -20, 300, PAGE_W + 20, GUTTER_Y, 503, { glowX: 250 })
    + farBoat(ctx, 196, 318, 0.9, true);
  // The stay cables: from the tower's left face down to the left across the sky. The three notes on
  // their 45° lines; the others fanned between and beyond (the higher an anchor, the flatter the cable)
  let cables = '';
  let lit = '';
  const cable = (ay: number, slope: number) => {
    const ax = towerLeft(ay);
    const bx = -40;
    const by = ay + (ax - bx) * slope;
    cables += `M${f1(ax)} ${f1(ay)}L${bx} ${f1(by)}`;
    lit += `M${f1(ax)} ${f1(ay - 0.9)}L${bx} ${f1(by - 0.9)}`;
  };
  for (const c of NOTE_LINES) {
    const ay = (c - TOWER.baseX - (TOWER.deck * (TOWER.topX - TOWER.baseX)) / TOWER.deck) / (1 - (TOWER.topX - TOWER.baseX) / TOWER.deck);
    cable(ay, 1);
  }
  for (const [ay, slope] of [[-20, 0.86], [14, 0.92], [34, 0.97], [74, 1.03], [114, 1.08], [154, 1.14], [178, 1.2], [200, 1.27]] as const) cable(ay, slope);
  const stays = `<path d="${cables}" stroke="${W.pylonDeep}" stroke-width="3.2"/><path d="${cables}" stroke="${W.cable}" stroke-width="2"/>`
    + `<path d="${lit}" stroke="${W.peachLight}" stroke-width=".7" opacity=".6"/>`
    // The cables' anchor housings on the tower's face
    + [...NOTE_LINES.map((c) => (c - 318) / 0.9447), -20, 14, 34, 74, 114, 154, 178, 200].map((ay) => `<rect x="${f1(towerLeft(ay) - 2)}" y="${f1(ay - 3)}" width="7" height="6" rx="1.4" fill="${W.pylonDeep}"/>`).join('');
  // The tower: concrete tapering up off the page — its right edge on the page too, so it reads as one
  // soaring column (x 292–386 at the deck, 318–356 at the page's top): the shade face (violet) left of
  // its spine, the dawn face (peach) right of it, its pour joints, red lights up its edge. The back
  // span's cables leave its right face down to the right (淡水).
  const [rTop, rDeck] = [356, 386];
  const tower = `M${TOWER.topX} -10H${rTop}Q${rTop + 10} 240 ${rDeck} ${TOWER.deck + 20}H${TOWER.baseX}Z`;
  const spine = `M${TOWER.topX + 16} -10Q${TOWER.topX + 18} 240 ${TOWER.baseX + 40} ${TOWER.deck + 20}`;
  let joints = '';
  for (let y = 30; y < TOWER.deck; y += 48) joints += `M${f1(towerLeft(y))} ${y}H${f1(rTop + (rDeck - rTop) * ((y + 10) / (TOWER.deck + 30)) ** 1.6)}`;
  let backStays = '';
  for (const [ay, by] of [[20, 300], [60, 330], [100, 352], [140, 380], [180, 410]] as const) backStays += `M${f1(rTop + 4 + ay * 0.02)} ${ay}L420 ${by}`;
  const towerArt = `<path d="${backStays}" stroke="${W.pylonDeep}" stroke-width="2.8"/><path d="${backStays}" stroke="${W.cable}" stroke-width="1.6"/>`
    + depth(ctx, 2, `<path d="${tower}" fill="${mixHex(W.pylonPeach, W.pylonShade, 0.35)}"/>`
    + `<path d="M${TOWER.topX} -10H${TOWER.topX + 16}Q${TOWER.topX + 18} 240 ${TOWER.baseX + 40} ${TOWER.deck + 20}H${TOWER.baseX}Z" fill="${mixHex(W.pylonShade, W.violet, 0.4)}"/>`
    + `<path d="${spine}" stroke="${mixHex(W.pylon, W.peach, 0.3)}" stroke-width="2" fill="none" opacity=".8"/>`
    + `<path d="M${rTop - 6} -10Q${rTop + 2} 240 ${rDeck - 8} ${TOWER.deck + 20}" stroke="${W.peachLight}" stroke-width="5" fill="none" opacity=".45"/>`
    + `<path d="${joints}" stroke="${W.pylonDeep}" stroke-width=".8" opacity=".4"/>`, `<path d="${tower}"/>`)
    + [40, 160, 280].map((y) => softEllipse(ctx, towerLeft(y) + 8, y, 6, 6, 'lamp', 0.3) + `<circle cx="${f1(towerLeft(y) + 8)}" cy="${y}" r="2" fill="${C.neonPink}"/>`).join('');
  // The deck's far edge behind the walkway: its railing, the light-rail's catenary posts receding
  const deckEdge = `<rect x="-20" y="${GUTTER_Y - 6}" width="${TOWER.baseX + 20}" height="10" fill="${W.deck}"/><path d="M-20 ${GUTTER_Y - 5.4}H${TOWER.baseX}" stroke="${W.peachLight}" stroke-width="1" opacity=".6"/>`;
  // The gantry at the walkway's end: its post, Mocha's bracket at y 384, the arm (y 290) the platform hangs from, its winch
  const gantry = depth(ctx, 3, `<rect x="158" y="290" width="10" height="186" fill="${mixHex(W.trimRedDeep, W.violetDeep, 0.3)}"/><path d="M160 290V476" stroke="${W.trimRed}" stroke-width="1.4" opacity=".6"/>`
    + `<rect x="154" y="282" width="108" height="11" rx="2" fill="${mixHex(W.trimRedDeep, W.violetDeep, 0.3)}"/><path d="M156 287h104" stroke="${W.trimRed}" stroke-width="1.2" opacity=".6"/>`
    + `<path d="M164 330L200 293M164 362L232 293M168 300L250 293" stroke="${mixHex(W.trimRedDeep, W.violetDeep, 0.3)}" stroke-width="3"/>`
    + `<rect x="132" y="384" width="36" height="6" rx="2" fill="${ref(ctx, 'steelV')}"/><path d="M134 390L160 410" stroke="${W.steelDeep}" stroke-width="2"/>`
    + `<rect x="196" y="276" width="20" height="14" rx="3" fill="${W.trimRedDeep}"/><circle cx="206" cy="283" r="4" fill="${W.steelDeep}"/>`
    + `<path d="M157 284.8H259" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/><path d="M133 384.8H167" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<path d="M132 276H260V476H132Z"/>`);
  // The walkway's railing and lamp (Mocha's `lamp`, top at (40, 376))
  const rail = railing(ctx, -6, 152, 416, 440, 456, { every: 26, z: 3 });
  const lamp = harbourLamp(ctx, 40, 372, 460, 1.1);
  // The maintenance box at the tower's foot (the tune's dial turns in it, (270, 384)) and the
  // maintenance ledge on the tower (the bead's, its top at y 428)
  const box = depth(ctx, 3, `<rect x="238" y="344" width="64" height="104" rx="3" fill="${ref(ctx, 'steelV')}"/><rect x="244" y="356" width="52" height="56" rx="3" fill="${mixHex(W.steelDeep, C.shadow, 0.3)}"/>`
    + `<path d="M270 352l-4 -6h8z" fill="${W.trimRed}"/><path d="M246 424h48M246 432h48" stroke="${W.steelDeep}" stroke-width="1.6"/>`
    + `<path d="M239 344.8H301" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<rect x="238" y="344" width="64" height="104"/>`);
  const ledge = depth(ctx, 3, `<rect x="336" y="428" width="64" height="10" fill="${W.pylonShade}"/><rect x="336" y="428" width="64" height="3" fill="${W.pylon}"/>`
    + `<path d="M340 438l8 12M392 438l-8 12" stroke="${W.pylonDeep}" stroke-width="3"/><path d="M337 428.8H399" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<rect x="336" y="428" width="64" height="22"/>`);
  // The floor page: the sea far below the deck, the gap's depth, the deck's underside
  const floor = floorPage(ctx, seaWater(ctx, FLOOR_RECT.x, GUTTER_Y, FLOOR_RECT.x + FLOOR_RECT.w, FLOOR_BOTTOM + 4, 504, { glowX: 220 })
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="70" fill="${W.violetDeep}" opacity=".25"/>`
    + steamPlume(ctx, 210, 640, 120, 90, 505, { o: 0.22, lean: 20 })
    + `<path d="M-60 560H${TOWER.baseX + 10}" stroke="${W.deckDeep}" stroke-width="40" opacity=".55"/><path d="M-60 541H${TOWER.baseX + 10}" stroke="${W.peach}" stroke-width="1" opacity=".3"/>`);
  return tamsuiDefs(ctx) + standingPage(ctx, sky + sea + deckEdge + stays + towerArt)
    + floor + gantry + box + ledge + rail + lamp + bookCues(ctx) + block();
};

// ——— 9-6 「碼頭的聽診器」 (spread) ———

/**
 * 9-6, the centrefold (its spine's crease drawn live): the fishing harbour at dawn. Left page: the
 * stone quay (the ledges) with its lamp (Mocha's `lamp`, (44, 364)), crates of the night's catch, a
 * net hung to dry, and the derrick — its mast and boom, the circuit its hook runs round (a part) —
 * swinging the net basket between the quay and the boat; the harbour light at the harbour mouth (the
 * 土地公 at (150, 300)). Right page: the blue fishing boat moored alongside — its hull (the deck is the
 * ledges), the gunwale's rail at his chest along its deck, the mast (x 322; the 聽診器 hangs on it at
 * (322, 378)) where the sail is set (a part), the wheelhouse (its roof Mocha's `wheelhouse`, (366,
 * 344)), its lamps, flags. Behind: the harbour's water, the breakwater, 觀音山 and the 淡江大橋 across the
 * river mouth in the first light.
 */
const fishingHarbour: BackdropDraw = (ctx) => {
  const sky = dawnSky(ctx, 250, { seed: 601, stars: 24, glow: [300, 252, 260, 130] })
    + dawnClouds(ctx, [[120, 80, 170], [310, 130, 150], [60, 170, 90]]);
  const far = guanyin(ctx, -60, 190, 250, 80, { lights: 8, seed: 602 })
    + tamkangBridge(ctx, { px: 236, deckY: 224, top: 108, water: 250, left: 60, right: 288 })
    + seaWater(ctx, -20, 250, PAGE_W + 20, GUTTER_Y, 603, { glowX: 300 });
  // The breakwater and the harbour light at its end (the 土地公 at (150, 300))
  const breakwater = depth(ctx, 2, `<path d="M-20 300H170V312H-20Z" fill="${mixHex(W.granite, W.violet, 0.3)}"/>`
    + `<path d="M-20 300.8H170" stroke="${W.peachLight}" stroke-width="1" opacity=".5"/>`, `<path d="M-20 300H170V312H-20Z"/>`)
    + depth(ctx, 2, `<path d="M140 300V262H160V300Z" fill="${W.hullWhite}"/><path d="M140 276H160M140 288H160" stroke="${W.trimRed}" stroke-width="5"/>`
      + `<rect x="138" y="254" width="24" height="8" rx="2" fill="${W.trimRedDeep}"/>`, `<path d="M138 254H162V300H138Z"/>`)
    + softEllipse(ctx, 150, 252, 16, 10, 'lamp', 0.5) + `<circle cx="150" cy="252" r="3" fill="${C.lampHot}"/>`;
  // Other boats moored along the far quay
  const fleet = farBoat(ctx, 40, 330, 1.4) + farBoat(ctx, 220, 326, 1.2, true) + farBoat(ctx, 110, 340, 1.6);
  // The derrick's mast on the quay's end (behind the basket's circuit), its boom up over the water
  const derrickMast = depth(ctx, 3, `<rect x="146" y="300" width="8" height="160" fill="${ref(ctx, 'steelH')}"/>`
    + `<path d="M150 312L226 358" stroke="${W.steelDeep}" stroke-width="5" stroke-linecap="round"/><path d="M150 312L226 358" stroke="${W.steel}" stroke-width="1.4" stroke-linecap="round"/>`
    + `<path d="M150 302L226 358" stroke="${W.steelDeep}" stroke-width="1" opacity=".7"/><circle cx="150" cy="300" r="4" fill="${W.trimRed}"/>`, `<path d="M144 296H230V460H144Z"/>`);
  // The quay's crates of the night's catch, the net hung to dry
  const crateList: readonly (readonly [number, number, string])[] = [[76, 418, W.hullTeal], [104, 418, W.candyDeep], [90, 400, W.hullTeal]];
  const crates = depth(ctx, 3, crateList.map(([x, y, c]) => `<rect x="${x}" y="${y}" width="26" height="16" rx="2" fill="${c}"/><path d="M${x + 3} ${y + 5}h20M${x + 3} ${y + 10}h20" stroke="${C.shadow}" stroke-width="1" opacity=".3"/>`).join(''), `<rect x="76" y="400" width="54" height="34"/>`);
  const net = `<path d="M8 350Q40 364 72 350" stroke="${W.ropeDeep}" stroke-width="1.4" fill="none"/>`
    + `<path d="${Array.from({ length: 9 }, (_, i) => `M${10 + i * 7} ${352 + Math.sin(i / 2.5) * 4}l${(i % 2) * 4 - 2} 40`).join('')}M10 368Q40 380 72 368M12 384Q40 396 70 384" stroke="${W.rope}" stroke-width=".8" fill="none" opacity=".7"/>`;
  const lamp = harbourLamp(ctx, 44, 360, 438, 1.1);
  // The floor page: the harbour water between the quay and the boat
  const water = floorPage(ctx, seaWater(ctx, FLOOR_RECT.x, GUTTER_Y, FLOOR_RECT.x + FLOOR_RECT.w, FLOOR_BOTTOM + 4, 604, { glowX: 230 })
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="16" fill="${C.shadow}" opacity=".2"/>`
    + pools(ctx, [[44, 450, 80, 20], [330, 440, 100, 24, 'dawn']]));
  // The quay's stone wall under its edge (left), seaweed at the waterline
  const quayWall = depth(ctx, 3, `<path d="M-30 490H164V572H-30Z" fill="${mixHex(W.granite, W.violetDeep, 0.6)}"/>`
    + `<path d="${Array.from({ length: 4 }, (_, i) => `M-30 ${506 + i * 16}H164`).join('')}" stroke="${mixHex(W.granite, C.shadow, 0.6)}" stroke-width="1" opacity=".6"/>`
    + `<path d="M162 490V572" stroke="${W.peach}" stroke-width="2" opacity=".25"/>`
    + `<path d="M-30 566q12 -6 24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0" stroke="${mixHex(W.sea, P.canopyNear, 0.5)}" stroke-width="5" fill="none"/>`, `<path d="M-30 490H164V572H-30Z"/>`)
    + lifebuoy(ctx, 120, 530, 12);
  // The fishing boat (right page): the blue hull under its deck (the ledges are the deck), a red trim, its name, tyre fenders
  const hull = depth(ctx, 3, `<path d="M262 468H430V560Q420 604 376 610H300Q270 600 262 560Z" fill="${ref(ctx, 'hullBlueG')}"/>`
    + `<path d="M262 476H430" stroke="${W.trimRed}" stroke-width="6"/><path d="M262 472H430" stroke="${W.hullWhite}" stroke-width="2"/>`
    + `<path d="M268 588Q320 606 400 600" stroke="${W.trimRedDeep}" stroke-width="4" fill="none"/>`, `<path d="M262 468H430V610H262Z"/>`)
    + serif(342, 534, 12, W.hullWhite, '豐收號', ' letter-spacing="3"')
    + [288, 400].map((x) => `<ellipse cx="${x}" cy="500" rx="8" ry="11" fill="${C.printDark}"/><ellipse cx="${x}" cy="500" rx="4" ry="6" fill="${W.hullBlueDeep}"/>`).join('')
    + `<path d="M262 616q30 6 60 0t60 0t60 0" stroke="${W.seaLit}" stroke-width="1.6" fill="none" opacity=".6"/>`;
  // The wheelhouse at the deck's back (its roof Mocha's `wheelhouse`, at y 344), lit inside; flags on a line to the mast
  const wheelhouse = depth(ctx, 3, `<rect x="340" y="352" width="70" height="58" fill="${ref(ctx, 'hullWhiteG')}"/><rect x="346" y="360" width="26" height="22" rx="2" fill="${ref(ctx, 'window')}"/><rect x="378" y="360" width="26" height="22" rx="2" fill="${ref(ctx, 'window')}"/>`
    + `<rect x="334" y="344" width="80" height="9" rx="2" fill="${W.hullBlue}"/><path d="M335 344.8H413" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`
    + `<path d="M348 364L360 380M380 364L392 380" stroke="${C.cutRim}" stroke-width="1.6" opacity=".25"/>`, `<rect x="334" y="344" width="80" height="66"/>`)
    + softEllipse(ctx, 374, 372, 44, 22, 'lamp', 0.22, 'blur8');
  // The boat's mast (x 322) with its yard and lamps; the pennants on the line to the wheelhouse
  const mast = depth(ctx, 3, `<rect x="319" y="236" width="6" height="176" fill="${ref(ctx, 'woodH')}"/><path d="M304 262H340" stroke="${W.woodDeep}" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M322 240L410 344" stroke="${W.ropeDeep}" stroke-width=".9"/>`, `<rect x="304" y="236" width="40" height="176"/>`)
    + [300, 344].map((x) => softEllipse(ctx, x, 266, 6, 6, 'lamp', 0.4) + `<circle cx="${x}" cy="266" r="2.4" fill="${C.lampHot}"/>`).join('')
    + [[344, 266], [358, 282], [372, 299], [386, 316]].map(([x, y], i) => `<path d="M${x} ${y}l6 7l3 -9z" fill="${[W.trimRed, W.candy, W.hullTeal, W.hullWhite][i]}"/>`).join('');
  // The gunwale's rail along the deck's back (his chest height: y 376), from the deck's near end to the wheelhouse
  const rail = railing(ctx, 270, 338, 376, 392, 412, { every: 34, z: 3 });
  return tamsuiDefs(ctx) + standingPage(ctx, sky + far + breakwater + fleet)
    + water + quayWall + hull + net + crates + derrickMast + mast + wheelhouse + rail + lamp + bookCues(ctx) + block();
};

export const C9_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'c9/tamsui-line': tamsuiLine,
  'c9/old-street': oldStreet,
  'c9/ferry': ferry,
  'c9/fishermans-wharf': fishermansWharf,
  'c9/tamkang-bridge': tamkangBridgePage,
  'c9/fishing-harbour': fishingHarbour,
};

// ——— Parts ———

// 9-1's window blind

/**
 * 9-1's blind over the end window (a `blowable`: `closed` / `open`), drawn at its hit centre (350,
 * 432); the window spans (298–388, 300–440) in page units. Closed: a roller blind of lilac-grey cloth
 * pulled down to the sill, the dawn glowing at its edges, its pull bar and cord. Open: blown up — rolled
 * tight in its box at the top, a chalk swish under it, the window clear.
 */
const windowBlind: PartSource = {
  preset: 'blowable',
  states: ['closed', 'open'],
  box: { x: -58, y: -140, w: 100, h: 156 },
  draw(ctx, state) {
    const [x0, x1, y0, y1] = [-52, 38, -132, 8];
    const boxArt = depth(ctx, 2, `<rect x="${x0 - 4}" y="${y0 - 8}" width="${x1 - x0 + 8}" height="11" rx="3" fill="${W.steelDeep}"/><path d="M${x0 - 3} ${y0 - 7.2}H${x1 + 3}" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`,
      `<rect x="${x0 - 4}" y="${y0 - 8}" width="${x1 - x0 + 8}" height="11"/>`);
    if (state === 'open') {
      return depth(ctx, 2, `<rect x="${x0}" y="${y0 - 2}" width="${x1 - x0}" height="9" rx="4.5" fill="${mixHex(W.plasterShade, W.violet, 0.2)}"/><path d="M${x0 + 2} ${y0 + 1}H${x1 - 2}" stroke="${W.plaster}" stroke-width="1.4"/>`,
        `<rect x="${x0}" y="${y0 - 2}" width="${x1 - x0}" height="9"/>`) + boxArt
        + `<path d="M${x0 + 8} ${y0 + 16}q20 8 40 0M${x0 + 20} ${y0 + 26}q14 6 28 0" stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>`;
    }
    let weave = '';
    for (let y = y0 + 10; y < y1 - 4; y += 9) weave += `M${x0 + 1} ${y}H${x1 - 1}`;
    const cloth = `M${x0} ${y0}H${x1}V${y1 - 6}H${x0}Z`;
    return softEllipse(ctx, (x0 + x1) / 2, y1 - 30, 50, 70, 'lamp', 0.12, 'blur8')
      + depth(ctx, 2, `<path d="${cloth}" fill="${mixHex(W.plasterShade, W.violet, 0.22)}"/><path d="${weave}" stroke="${W.plaster}" stroke-width=".8" opacity=".35"/>`
        // The dawn glowing through the cloth at its edges
        + `<path d="M${x1 - 1} ${y0}V${y1 - 6}" stroke="${W.peachLight}" stroke-width="3" opacity=".5"/><path d="M${x0} ${y1 - 8}H${x1}" stroke="${W.peachLight}" stroke-width="1.6" opacity=".4"/>`
        + `<rect x="${x0 - 2}" y="${y1 - 8}" width="${x1 - x0 + 4}" height="6" rx="2" fill="${W.steelDeep}"/><path d="M${x0 - 1} ${y1 - 7.4}H${x1 + 1}" stroke="${W.steel}" stroke-width="1"/>`, `<path d="${cloth}"/>`)
      + boxArt
      + `<path d="M${x1 - 10} ${y1 - 2}V${y1 + 4}" stroke="${C.printDark}" stroke-width="1.2"/><circle cx="${x1 - 10}" cy="${y1 + 5.4}" r="2.4" fill="${W.steelDeep}"/>`;
  },
};

// 9-2's shutters and the 鐵蛋阿婆

/**
 * A rolling shop shutter (a `flap` each, 翻): closed, ribbed steel down over the shop's window, a
 * little faded, its handle and padlock; rolled up, its kraft back. The marigold dog-ear is the grip
 * (`bakedFlap`); its seal and curl cue stay live.
 */
const shutter = (() => {
  const { w, h } = { w: 40, h: 34 };
  const face = (ctx: KitCtx) => {
    let ribs = '';
    for (let y = 3; y < h; y += 4) ribs += `M0 ${y}H${w}`;
    return tamsuiDefs(ctx) + `<rect width="${w}" height="${h}" fill="${ref(ctx, 'steelV')}"/>`
      + `<path d="${ribs}" stroke="${W.steelDeep}" stroke-width="1.1" opacity=".7"/><path d="${ribs}" stroke="${C.cutRim}" stroke-width=".5" opacity=".35" transform="translate(0 1)"/>`
      + `<path d="M3 6q8 4 6 14" stroke="${W.peachLight}" stroke-width="2" fill="none" opacity=".25"/>`
      + `<rect x="${w / 2 - 7}" y="${h - 8}" width="14" height="3.4" rx="1.6" fill="${W.steelDeep}"/><rect x="${w / 2 - 2.6}" y="${h - 5}" width="5.2" height="4.4" rx="1" fill="${W.trimRedDeep}"/>`;
  };
  return bakedFlap(w, h, face, kraftBack(w, h, 191));
})();

const ironEggGranny: PartSource = {
  preset: 'carrier',
  states: ['idle', 'carrying', 'back', 'done'],
  box: { x: -60, y: -170, w: 130, h: 176 },
  draw: (ctx, look) => ironEggGrannyArt(ctx, look as 'idle'),
};

// 9-3's gate and horn

/**
 * The pier's boarding gate (a `gate`: 嗶！ opens it), drawn at its hit centre (144, 428), standing on
 * the pier at (144, 476): two steel cabinets either side with the card reader's blue screen, and the
 * barrier flaps between; closed, the flaps meet with a red light; open, they fold back and the light
 * turns green, a chalk 「嗶」 over the reader.
 */
const ferryGate: PartSource = {
  preset: 'gate',
  states: ['closed', 'open'],
  box: { x: -40, y: -50, w: 84, h: 104 },
  draw(ctx, state) {
    const open = state === 'open';
    const cab = (x: number) => depth(ctx, 3, `<path d="M${x} 48V-6Q${x} -12 ${x + 6} -12H${x + 12}V48Z" fill="${ref(ctx, 'steelV')}"/>`
      + `<path d="M${x + 1} -11V47" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<path d="M${x} -12H${x + 12}V48H${x}Z"/>`);
    const flapL = open ? `<path d="M-22 6l-4 22l3 1l4 -22z" fill="${W.canvas}"/>` : `<path d="M-22 6h22v12h-22z" fill="${W.canvas}"/><path d="M-22 12h22" stroke="${W.trimRed}" stroke-width="2"/>`;
    const flapR = open ? `<path d="M22 6l4 22l-3 1l-4 -22z" fill="${W.canvas}"/>` : `<path d="M0 6h22v12h-22z" fill="${W.canvas}"/><path d="M0 12h22" stroke="${W.trimRed}" stroke-width="2"/>`;
    const light = open ? C.doneGreen : W.trimRed;
    return tamsuiDefs(ctx) + depth(ctx, 3, flapL + flapR, '<path d="M-26 6H26V30H-26Z"/>')
      + cab(-34) + cab(22)
      + `<rect x="-32" y="-6" width="8" height="10" rx="1.4" fill="${W.hullTeal}"/><rect x="-31" y="-5" width="6" height="5" fill="${W.seaLit}" opacity=".7"/>`
      + softEllipse(ctx, 28, -16, 6, 6, 'lamp', open ? 0.5 : 0.2) + `<circle cx="28" cy="-16" r="2.6" fill="${light}"/><circle cx="-28" cy="-16" r="2.6" fill="${light}"/>`
      + (open ? `<path d="M-38 -20q-4 6 0 12M-42 -24q-6 10 0 20" stroke="${C.chalk}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".85"/>` + serif(-30, -28, 9, C.chalk, '嗶') : '');
  },
};

/** The ferry's horn on its cabin roof (a `button`: Mocha's weight honks it), its base at the hit centre: a brass trumpet on a bracket; honking (`down`), rings of sound. */
const ferryHorn: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -28, y: -30, w: 64, h: 46 },
  draw(ctx, state) {
    const down = state === 'down';
    const bell = 'M-14 -6L4 -11Q10 -18 14 -12Q17 -4 12 2Q8 0 4 -1L-14 -2Z';
    return depth(ctx, 2, `<rect x="-12" y="${down ? 1 : -1}" width="22" height="${down ? 8 : 10}" rx="2" fill="${W.steelDeep}"/>`
      + `<path d="${bell}" fill="${ref(ctx, 'foil')}" transform="translate(0 ${down ? 2 : 0})"/><ellipse cx="13" cy="${down ? -3 : -5}" rx="2.4" ry="7" fill="${C.goldDeep}"/>`
      + `<path d="M-12 -4.6L4 -8.6" stroke="${C.foilShine}" stroke-width="1.2" transform="translate(0 ${down ? 2 : 0})"/>`, `<path d="${bell}"/><rect x="-12" y="-1" width="22" height="10"/>`)
      + (down ? `<path d="M20 -14q5 6 0 12M25 -18q8 10 0 20M30 -22q11 14 0 28" stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/>` + serif(18, -24, 9, C.chalk, '叭') : '');
  },
};

// 9-4's sun dial, tide and dinghy

/**
 * 9-4's sun dial (a `wheel`, 轉: `dawn` · `noon` · `sunset`): a marigold knurled rim (its grip) round a
 * printed sky disc — the sun rising out of the sea, high at noon, sinking gold into it — each a third
 * of the way round so the one turned to the top (under the board's red pointer) is the time. One
 * drawing (state `dawn`); the view turns it a third a state. Pivot at its centre.
 */
const sunDial: PartSource = {
  preset: 'wheel',
  states: ['dawn'],
  pivot: [0, 0],
  box: { x: -40, y: -40, w: 80, h: 80 },
  draw(ctx) {
    const r = 32;
    const rim = wheelRim(r, 22);
    // Each sector's little sky, drawn at the top and turned into place: dawn at 0°, noon at 240° (it
    // comes to the top after one turn), sunset at 120°. A sea line along each sector's outer edge.
    const sector = 'M0 -6L-13.4 -23.4A27 27 0 0 1 13.4 -23.4Z';
    const scene = (a: number, sky: string, sunY: number, sun: string, rays: boolean) => `<g transform="rotate(${a})">`
      + `<path d="${sector}" fill="${sky}"/>`
      + (rays ? `<path d="M0 ${sunY - 7}v-2.6M-6 ${sunY - 4}l-2 -1.6M6 ${sunY - 4}l2 -1.6" stroke="${sun}" stroke-width="1.2" stroke-linecap="round"/>` : '')
      + `<circle cx="0" cy="${sunY}" r="4.6" fill="${sun}"/>`
      + `<path d="M-12 -19.6Q0 -21.6 12 -19.6L13.4 -23.4A27 27 0 0 1 -13.4 -23.4Z" fill="${W.sea}" opacity=".85"/>`
      + `<path d="M-8 -21.2h5M2 -21.6h6" stroke="${W.seaLit}" stroke-width=".8"/></g>`;
    return tamsuiDefs(ctx) + depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/>`
      + `<circle r="${r - 4}" fill="${C.washi}"/><circle r="${r - 4}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1.4" opacity=".6"/>`
      + scene(0, mixHex(W.peachLight, W.rose, 0.3), -15, W.peachDeep, false)
      + scene(240, W.seaLit, -13, C.lampAmber, true)
      + scene(120, mixHex(W.peach, W.violetLight, 0.35), -17, W.trimRed, false)
      + [60, 180, 300].map((a) => `<path d="M0 -7V-26" stroke="${W.violetLight}" stroke-width=".8" transform="rotate(${a})"/>`).join('')
      + `<circle r="6" fill="${W.violetLight}"/><circle r="2.4" fill="${ref(ctx, 'foil')}"/>`, `<path d="${rim}"/>`);
  },
};

/**
 * The water over the tidal flat (#131; a `lift` with no node: its anchor rises up its hit area per
 * level), drawn at its level's anchor: glassine teal over the mud, its surface lit — and warming with
 * the sun (the bible's sunset-gold trick): at dawn only the channel's thin water, rose-lit; at noon a
 * clear teal flood under the boardwalk; at sunset high by the piers, gold in its ripples.
 */
const tide: PartSource = {
  preset: 'lift',
  states: ['dawn', 'noon', 'sunset'],
  box: { x: -210, y: -50, w: 380, h: 250 },
  draw(_ctx, state) {
    // The anchor: y 520 at dawn, 490 at noon, 460 at sunset; the flat's front edge is y 650
    const anchor = state === 'dawn' ? 520 : state === 'noon' ? 490 : 460;
    const front = 650 - anchor;
    const glow = state === 'dawn' ? W.peachLight : state === 'noon' ? W.seaLit : C.goldLight;
    const r = seeded(state === 'dawn' ? 461 : state === 'noon' ? 462 : 463);
    if (state === 'dawn') {
      // Low tide: only the channel's thin water through the mud (the backdrop's channel), rose-lit, and wet sheen
      const ch = 'M-165 130Q-105 70 -55 20T-5 -50';
      return `<path d="${ch}" stroke="${W.sea}" stroke-width="22" fill="none" stroke-linecap="round" opacity=".55" transform="translate(0 0)"/>`
        + `<path d="${ch}" stroke="${glow}" stroke-width="1.6" fill="none" opacity=".6" stroke-dasharray="10 8"/>`;
    }
    const top = state === 'noon' ? -38 : -14;
    let ripples = '';
    for (let i = 0; i < 24; i++) ripples += `M${f1(-200 + r() * 210)} ${f1(top + 6 + r() * (front - top - 10))}q6 -2 12 0`;
    // From under the boardwalk (left) to the far pier's wall (x 282, local 27), where it meets the stone
    let wave = `M-210 ${top}`;
    for (let x = -210; x < 27; x += 20) wave += `q5 -3 10 0t10 0`;
    const fill = state === 'sunset' ? mixHex(W.sea, W.peachDeep, 0.3) : W.sea;
    return `<path d="${wave}L27 ${top}V${front}H-210Z" fill="${fill}" opacity=".7"/>`
      + `<path d="${wave}L27 ${top}V${top + 14}H-210Z" fill="${glow}" opacity=".22"/>`
      + `<path d="M27 ${top}V${front}" stroke="${W.seaLit}" stroke-width="1.4" opacity=".5"/>`
      + `<path d="${ripples}" stroke="${glow}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>`
      + `<path d="${wave}" stroke="${C.cutRim}" stroke-width="1.4" fill="none" opacity=".6"/>`
      + `<path d="M-120 ${front}L-90 ${top}H-78L-108 ${front}ZM-30 ${front}L0 ${top}H14L-16 ${front}Z" fill="${C.glassine}" opacity=".1"/>`;
  },
};

/** The dinghy (drawn where its node is: he sits in it): a little wooden rowing boat, painted teal and white, its oars shipped. */
const dinghy: PartSource = {
  preset: 'lift',
  states: ['dawn', 'noon', 'sunset'],
  box: { x: -38, y: -14, w: 76, h: 34 },
  draw(ctx) {
    const hull = 'M-32 -2H32Q28 14 0 14Q-28 14 -32 -2Z';
    return tamsuiDefs(ctx) + softEllipse(ctx, 0, 14, 28, 3, 'shadow', 0.3)
      + depth(ctx, 3, `<path d="${hull}" fill="${W.hullTeal}"/><path d="M-30 4Q0 9 30 4" stroke="${W.hullWhite}" stroke-width="2.4" fill="none"/>`
        + `<path d="M-32 -2H32" stroke="${W.woodDeep}" stroke-width="3"/><path d="M-31 -3H31" stroke="${W.woodLight}" stroke-width="1"/>`
        + `<path d="M-24 -6L22 2M-20 2L26 -7" stroke="${W.woodLight}" stroke-width="2" stroke-linecap="round"/>`
        + `<path d="M-30 0Q-26 10 -10 12" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".4"/>`, `<path d="${hull}"/>`);
  },
};

// 9-5's cables, tune dial, platform and the maintenance box's plate

/**
 * A stay cable as you tap it (#131; a `prop` each), its centre at the origin: a length of the steel
 * cable running up to the tower (up and right, on the backdrop's own cable), with its note on a round
 * paper tag clipped to it; ringing (`hum`), the cable shivers (a doubled line) and chalk ripples.
 */
const stayCable = (note: string): PartSource => ({
  preset: 'prop',
  states: ['still', 'hum'],
  box: { x: -26, y: -26, w: 52, h: 52 },
  draw(ctx, state) {
    const hum = state === 'hum';
    const line = 'M-22 22L22 -22';
    return `<path d="${line}" stroke="${W.pylonDeep}" stroke-width="3.2" stroke-linecap="round"/><path d="${line}" stroke="${W.cable}" stroke-width="2" stroke-linecap="round"/>`
      + (hum ? `<path d="M-21 18L18 -21M-18 21L21 -18" stroke="${W.cable}" stroke-width="1" opacity=".7"/>`
        + `<path d="M-22 6q-4 -8 4 -14M-8 22q-6 -6 0 -14M8 -22q6 6 0 14M22 -6q4 8 -4 14" stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/>` : '')
      + depth(ctx, 2, `<circle r="12.5" fill="${C.washi}"/><circle r="12.5" fill="none" stroke="${W.violet}" stroke-width="1.2"/><circle r="10" fill="none" stroke="${W.violetLight}" stroke-width=".6" stroke-dasharray="2 2"/>`, '<circle r="12.5"/>')
      + `<path d="M-4 -12l4 -5l4 5" stroke="${W.steelDeep}" stroke-width="1.4" fill="none"/>`
      + `<text data-art-text="" x="0" y="4.2" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="11" fill="${C.printDark}">${note}</text>`;
  },
});

/**
 * The tune's dial in the maintenance box (a `section`, six states: how much of the line has been
 * played), its pivot at the hit centre: a brass-rimmed gauge with six notches round its face — a
 * blank, then Sol, Sol, La (the plate's three), Sol, Do (the rest of the line) — each 60° on, so the
 * one under the box's red pointer is what has been played. Printed, never marigold (not a touchable).
 */
const tuneDial: PartSource = {
  preset: 'section',
  states: ['0'],
  pivot: [0, 0],
  box: { x: -26, y: -26, w: 52, h: 52 },
  draw(ctx) {
    const notes = ['·', 'Sol', 'Sol', 'La', 'Sol', 'Do'];
    // State k turns the disc 60·k°: the note for k sits at −60·k° so it comes to the top
    const marks = notes.map((n, k) => `<g transform="rotate(${-60 * k})"><path d="M0 -19V-15" stroke="${W.violetDeep}" stroke-width="1.4"/>`
      + `<text data-art-text="" x="0" y="-8" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${n.length > 1 ? 5.4 : 8}" fill="${k >= 4 ? W.trimRedDeep : C.printDark}">${n}</text></g>`).join('');
    return tamsuiDefs(ctx) + depth(ctx, 2, `<circle r="21" fill="${ref(ctx, 'foil')}"/><circle r="18.4" fill="${C.washi}"/>` + marks
      + `<circle r="3.4" fill="${W.steelDeep}"/>`, '<circle r="21"/>');
  },
};

/**
 * The maintenance platform (a `lift`, drawn where its node is: he crawls onto it), hanging on two
 * cables from the gantry's arm (y 290 in page units): a steel cage floor with a toe-board and a rail
 * round it, a lamp; `up` it hangs under the arm (40 below it), `down` it has come down level with the
 * deck (its cables 180 long).
 */
const maintenanceLift: PartSource = {
  preset: 'lift',
  states: ['up', 'down'],
  box: { x: -40, y: -186, w: 80, h: 206 },
  draw(ctx, state) {
    const len = state === 'up' ? 40 : 180;
    return tamsuiDefs(ctx) + `<path d="M-22 -2V${-len}M22 -2V${-len}" stroke="${W.steelDeep}" stroke-width="1.6"/><path d="M-22 -2V${-len}M22 -2V${-len}" stroke="${W.cable}" stroke-width=".6"/>`
      + depth(ctx, 3, `<rect x="-32" y="0" width="64" height="10" rx="1.4" fill="${ref(ctx, 'steelV')}"/><path d="M-30 3h60M-30 7h60" stroke="${W.steelDeep}" stroke-width=".8"/>`
        + `<path d="M-30 0V-20H30V0M-30 -10H30" stroke="${W.steelDeep}" stroke-width="2.2" fill="none"/>`
        + `<path d="M-31 .8H31" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/><rect x="-32" y="8" width="64" height="4" fill="${W.trimRed}"/>`, `<rect x="-32" y="-20" width="64" height="32"/>`)
      + softEllipse(ctx, 26, -22, 6, 6, 'lamp', 0.45) + `<circle cx="26" cy="-22" r="2" fill="${C.lampHot}"/>`;
  },
};

/**
 * The maintenance box's plate (#131; a cut-out in page units, on the tower's face over the box): an
 * enamel plate screwed to the concrete, 「維修通關」 and the tune that lowers the platform — Sol, Sol,
 * La (生日快樂's first three) — on round paper tags joined by a printed staff line.
 */
const tunePlate: CutoutSource = {
  chapter: 9,
  box: { x: 246, y: 256, w: 120, h: 66 },
  draw(ctx) {
    const tag = (x: number, note: string) => `<circle cx="${x}" cy="294" r="11" fill="${C.washi}"/><circle cx="${x}" cy="294" r="11" fill="none" stroke="${W.violet}" stroke-width="1"/>`
      + `<text data-art-text="" x="${x}" y="298" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="10" fill="${C.printDark}">${note}</text>`;
    return depth(ctx, 2, `<rect x="252" y="262" width="104" height="54" rx="4" fill="${W.hullBlueDeep}"/><rect x="256" y="266" width="96" height="46" rx="3" fill="${mixHex(W.seaLit, C.washi, 0.5)}"/>`
      + [258, 350].map((x) => `<circle cx="${x}" cy="268" r="1.6" fill="${W.steelDeep}"/><circle cx="${x}" cy="310" r="1.6" fill="${W.steelDeep}"/>`).join(''), '<rect x="252" y="262" width="104" height="54" rx="4"/>')
      + `<path d="M262 294H346" stroke="${W.violetLight}" stroke-width="1"/>`
      + serif(304, 278, 7, W.hullBlueDeep, '維修平台', ' letter-spacing="2"')
      + tag(276, 'Sol') + tag(304, 'Sol') + tag(332, 'La');
  },
};

// 9-6's sail and derrick

/**
 * The fishing boat's sail on its mast (a `blowable`, four states: the boom a quarter round the derrick
 * each), its centre at (300, 400); the mast at x 322: a patched canvas steadying sail on its gaff and
 * boom, bellied out by 咻—— — the belly swings with the state; a chalk gust when it fills.
 */
const sail: PartSource = {
  preset: 'blowable',
  states: ['0', '1', '2', '3'],
  box: { x: -40, y: -48, w: 76, h: 92 },
  draw(ctx, state) {
    const belly = [10, 16, 10, 4][Number(state)] ?? 10;
    const d = `M19 -40L19 26L-26 26Q${f1(-26 + belly)} -4 19 -40Z`;
    const seams = `M19 -18L${f1(-14 + belly * 0.5)} 4M19 4L-20 18`;
    return tamsuiDefs(ctx) + depth(ctx, 2, `<path d="${d}" fill="${W.canvas}"/><path d="${seams}" stroke="${W.ropeDeep}" stroke-width=".8" fill="none" opacity=".7"/>`
      + `<path d="M-6 12h12v9h-12z" fill="${W.candy}" opacity=".7"/><path d="M4 -10h8v7h-8z" fill="${W.seaLight}" opacity=".6"/>`
      + `<path d="M18 -38V24" stroke="${W.peachLight}" stroke-width="2" opacity=".5"/>`, `<path d="${d}"/>`)
      + `<path d="M-30 28H24" stroke="${W.woodDeep}" stroke-width="3" stroke-linecap="round"/><path d="M19 -42L4 -44" stroke="${W.woodDeep}" stroke-width="2.4" stroke-linecap="round"/>`
      + (Number(state) % 2 ? `<path d="M-36 -10q8 -4 16 0M-36 0q6 -3 12 0" stroke="${C.chalk}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>` : '');
  },
};

/**
 * The derrick (#131; the boom's circuit, a `loop` the sail drives), drawn at its hit centre: the rope
 * the boom's hook runs round — from the quay, up over the water, to the boat's deck, down low — with
 * its four stops as little blocks. The same in every state (the net basket rider shows where it is).
 */
const derrick: PartSource = {
  preset: 'loop',
  states: ['0'],
  box: { x: -46, y: -46, w: 92, h: 100 },
  draw(ctx) {
    const loop = 'M-33 16C-33 -16 -16 -34 -1 -34C16 -34 29 -20 29 -6C29 20 14 44 -1 44C-18 44 -33 34 -33 16Z';
    // The stops (the basket's nodes, relative to the hit centre (215, 430))
    const stops = [[-33, 16], [-1, -34], [29, -6], [-1, 44]];
    return tamsuiDefs(ctx) + `<path d="${loop}" fill="none" stroke="${W.ropeDeep}" stroke-width="3"/><path d="${loop}" fill="none" stroke="${W.rope}" stroke-width="1.4" stroke-dasharray="3 3"/>`
      + stops.map(([x, y]) => `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" rx="1.4" fill="${W.woodDeep}"/>`).join('');
  },
};

export const C9_PARTS: Readonly<Record<string, PartSource>> = {
  'c9/window-blind': windowBlind,
  'c9/shutter': shutter,
  'c9/iron-egg-granny': ironEggGranny,
  'c9/ferry-gate': ferryGate,
  'c9/ferry-horn': ferryHorn,
  'c9/sun-dial': sunDial,
  'c9/tide': tide,
  'c9/dinghy': dinghy,
  'c9/cable-sol': stayCable('Sol'),
  'c9/cable-la': stayCable('La'),
  'c9/cable-do': stayCable('Do'),
  'c9/tune-dial': tuneDial,
  'c9/maintenance-lift': maintenanceLift,
  'c9/sail': sail,
  'c9/derrick': derrick,
};

export const C9_CUTOUTS: Readonly<Record<string, CutoutSource>> = {
  'c9/tune-plate': tunePlate,
};
