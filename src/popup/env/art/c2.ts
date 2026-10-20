import { POPUP as C, POPUP_PARK as P, POPUP_STAGE as S, POPUP_STATION as T, mixHex } from '../../../art/palette';
import { depth, f1, pageBlock, pinholes, ref, scallopBand, seeded, skyline, softEllipse, wheelRim, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorWiden } from '../../view/geometry';
import type { BackdropDraw, CutoutSource, PartSource } from '../sources';
import { vFold } from '../../view/art/placeholders';
import { clerk } from './c1';
import { FLOOR_RECT, bookCues, calmMoon, flapSize, floorPage, kraftBack, lin, paperFibres, rad, shushuPeek, standingPage } from './common';

/**
 * Chapter 2 (大安森林公園, 00:50) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#114) drew the pieces whose preset placeholder would
 * mislead a player (the umbrella, the curtain, the trap-door plate, the lily pad); the chapter's art
 * issue (#115) draws the rest: the palette kit, six backdrops and the parts.
 *
 * **The kit** (bible § 6 row 2): deep canopy green and the night's indigo, with firefly lime as the
 * one accent (`POPUP_PARK`). The signature material is **layered leaf cut-outs** at four depths
 * (`canopy`, `crown`): far leaves are bluest and darkest, near ones greenest with a moonlit rim.
 * Reusable cut-outs: the park lamp (`parkLamp`), a tree (`trunk` + `crown`), a hedge (`hedge`),
 * fireflies as lime pinholes (`fireflies`), the lawn and pavers on the floor page (`lawnFloor`).
 */

/** The page block under the floor page (a thick old book). */
const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};

// ——— The palette kit ———

/** The park's gradient defs, shared by the chapter's backdrops. */
function parkDefs(ctx: KitCtx): string {
  return `<defs>`
    + lin(ctx, 'lawnG', [[0, P.lawnDeep], [0.45, P.lawn], [1, P.lawnLight]])
    + lin(ctx, 'trunkG', [[0, P.trunkLit], [0.4, P.trunk], [1, P.trunkDeep]], 'h')
    + lin(ctx, 'waterG', [[0, P.waterDeep], [0.6, P.water], [1, mixHex(P.water, P.waterLight, 0.35)]])
    + lin(ctx, 'shellL', [[0, P.shell], [1, mixHex(P.shell, P.shellShade, 0.3)]], 'h')
    + lin(ctx, 'shellR', [[0, P.shellShade], [1, P.shellDeep]], 'h')
    + lin(ctx, 'plankG', [[0, P.plankLight], [1, P.plank]])
    + lin(ctx, 'paverG', [[0, mixHex(P.paver, C.shadow, 0.3)], [1, P.paver]])
    + lin(ctx, 'lampPostG', [[0, P.lampPostLit], [0.5, P.lampPost], [1, mixHex(P.lampPost, C.shadow, 0.4)]], 'h')
    + lin(ctx, 'carWallP', [[0, T.carCeiling], [0.5, mixHex(T.carWall, T.navy, 0.08)], [1, mixHex(T.carWallShade, T.navy, 0.16)]])
    + lin(ctx, 'tileWall', [[0, mixHex(P.stationTile, T.navy, 0.3)], [1, mixHex(P.stationTile, T.navy, 0.12)]])
    + lin(ctx, 'steelP', [[0, T.steelDeep], [0.4, T.steel], [0.6, C.cutRim], [1, T.steelDeep]], 'h')
    + lin(ctx, 'prioP', [[0, T.priority], [1, T.priorityDeep]])
    + lin(ctx, 'lampWashP', [[0, C.lampAmber, 0], [1, C.lampAmber, 0.12]])
    + lin(ctx, 'mistP', [[0, P.canopyMid, 0], [1, mixHex(P.canopyFar, C.vellum, 0.25), 0.55]])
    + rad(ctx, 'warmPoolP', [[0, C.lamp, 0.42], [0.6, C.lampAmber, 0.12], [1, C.lampAmber, 0]])
    + rad(ctx, 'moonPoolP', [[0, C.vellum, 0.22], [1, C.vellum, 0]])
    + rad(ctx, 'ffGlow', [[0, P.firefly, 0.7], [0.4, P.firefly, 0.22], [1, P.firefly, 0]])
    + `</defs>`;
}

/** One almond leaf as a path segment: base at (x, y), pointing at angle `a` (radians), length `s`. */
function leafD(x: number, y: number, a: number, s: number): string {
  const [c, n] = [Math.cos(a), Math.sin(a)];
  const tip = [x + c * s, y + n * s];
  const w = s * 0.34;
  const m = [x + c * s * 0.5, y + n * s * 0.5];
  return `M${f1(x)} ${f1(y)}Q${f1(m[0] - n * w)} ${f1(m[1] + c * w)} ${f1(tip[0])} ${f1(tip[1])}Q${f1(m[0] + n * w)} ${f1(m[1] - c * w)} ${f1(x)} ${f1(y)}Z`;
}

/**
 * A canopy layer hanging from the top of the page (bible § 6: layered leaf cut-outs): the solid
 * leaf mass down to `y1`, its lower edge a row of round leafy clusters (each a disc with almond
 * leaves cut round its rim), a moonlit rim on the upper left of each cluster and a darker underside.
 */
function canopy(ctx: KitCtx, x0: number, x1: number, y1: number, seed: number, fill: string, { amp = 16, step = 40, lit = 0.35, z = 2 as 1 | 2 | 3 | 4, y0 = -20 } = {}): string {
  const r = seeded(seed);
  // The solid mass, its ends rounded where they stop inside the page
  const yb = y1 - amp;
  const endR = x1 < PAGE_W ? `C${f1(x1 + step * 0.7)} ${y0} ${f1(x1 + step * 0.7)} ${f1(yb)} ${f1(x1)} ${f1(yb)}` : `V${f1(yb)}`;
  const endL = x0 > 0 ? `C${f1(x0 - step * 0.7)} ${f1(yb)} ${f1(x0 - step * 0.7)} ${y0} ${x0} ${y0}` : `V${y0}`;
  let d = `M${x0} ${y0}H${x1}${endR}H${x0}${endL}Z`;
  let leaves = '';
  let rims = '';
  let under = '';
  for (let x = x0 - step * 0.2; x < x1 + step * 0.3; x += step * (0.55 + r() * 0.35)) {
    const pr = step * (0.42 + r() * 0.22);
    const cy = y1 - amp * 0.4 + (r() - 0.5) * amp;
    d += `M${f1(x - pr)} ${f1(cy)}a${f1(pr)} ${f1(pr)} 0 1 0 ${f1(2 * pr)} 0a${f1(pr)} ${f1(pr)} 0 1 0 ${f1(-2 * pr)} 0Z`;
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.12 + 0.76 * (i / 4)) + (r() - 0.5) * 0.3;
      leaves += leafD(x + Math.cos(a) * pr * 0.84, cy + Math.sin(a) * pr * 0.84, a, 7 + r() * 6);
    }
    rims += `M${f1(x - pr * 0.8)} ${f1(cy + pr * 0.1)}Q${f1(x - pr * 0.75)} ${f1(cy - pr * 0.6)} ${f1(x - pr * 0.1)} ${f1(cy - pr * 0.75)}`;
    under += `M${f1(x - pr * 0.7)} ${f1(cy + pr * 0.45)}Q${f1(x)} ${f1(cy + pr * 1.05)} ${f1(x + pr * 0.7)} ${f1(cy + pr * 0.45)}`;
  }
  const body = `<path d="${d}" fill="${fill}"/><path d="${leaves}" fill="${fill}"/>`
    + `<path d="${under}" stroke="${C.shadow}" stroke-width="5" fill="none" opacity=".16" stroke-linecap="round"/>`
    + `<path d="${rims}" stroke="${P.canopyLit}" stroke-width="1.4" fill="none" opacity="${lit}" stroke-linecap="round"/>`;
  return depth(ctx, z, body, `<path d="${d}"/>`);
}

/**
 * A round tree crown (a camphor's, a banyan's): a cluster of leafy puffs around (cx, cy), each a
 * disc with leaves cut round its rim, lit from the upper left by the moon and shaded below.
 */
function crown(ctx: KitCtx, cx: number, cy: number, r: number, seed: number, fill: string, { z = 2 as 1 | 2 | 3 | 4, lit = 0.4, puffs = 7 } = {}): string {
  const rr = seeded(seed);
  let disc = '';
  let leaves = '';
  let rims = '';
  const parts: [number, number, number][] = [[cx, cy, r * 0.62]];
  for (let i = 0; i < puffs; i++) {
    const a = (i / puffs) * Math.PI * 2 + rr() * 0.5;
    const d = r * (0.42 + rr() * 0.2);
    parts.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, r * (0.34 + rr() * 0.16)]);
  }
  for (const [x, y, pr] of parts) {
    disc += `M${f1(x - pr)} ${f1(y)}a${f1(pr)} ${f1(pr)} 0 1 0 ${f1(2 * pr)} 0a${f1(pr)} ${f1(pr)} 0 1 0 ${f1(-2 * pr)} 0Z`;
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rr();
      leaves += leafD(x + Math.cos(a) * pr * 0.82, y + Math.sin(a) * pr * 0.82, a, 6 + rr() * 6);
    }
    rims += `M${f1(x - pr * 0.75)} ${f1(y - pr * 0.25)}Q${f1(x - pr * 0.55)} ${f1(y - pr * 0.8)} ${f1(x + pr * 0.1)} ${f1(y - pr * 0.75)}`;
  }
  const clip = ctx.id(`crownClip${seed}`);
  const body = `<path d="${disc}" fill="${fill}"/><path d="${leaves}" fill="${fill}"/>`
    + `<clipPath id="${clip}"><path d="${disc}"/></clipPath><g clip-path="url(#${clip})"><ellipse cx="${f1(cx + r * 0.25)}" cy="${f1(cy + r * 0.7)}" rx="${f1(r)}" ry="${f1(r * 0.55)}" fill="${C.shadow}" opacity=".22"/></g>`
    + `<path d="${rims}" stroke="${P.canopyLit}" stroke-width="1.3" fill="none" opacity="${lit}" stroke-linecap="round"/>`;
  return depth(ctx, z, body, `<path d="${disc}"/>`);
}

/** A trunk from `base` up to `top`, a little tapered, with bark strokes and a moonlit left side; branches as [dx, dy] reaches from its top. */
function trunk(ctx: KitCtx, x: number, top: number, base: number, w: number, seed: number, branches: readonly (readonly [number, number, number])[] = []): string {
  const r = seeded(seed);
  const t = w * 0.62;
  const d = `M${f1(x - w / 2)} ${base}Q${f1(x - w * 0.42)} ${f1((top + base) / 2)} ${f1(x - t / 2)} ${top}H${f1(x + t / 2)}Q${f1(x + w * 0.44)} ${f1((top + base) / 2)} ${f1(x + w / 2)} ${base}`
    // Root flare
    + `Q${f1(x + w * 0.7)} ${base + 2} ${f1(x + w * 0.95)} ${base + 4}H${f1(x - w * 0.95)}Q${f1(x - w * 0.7)} ${base + 2} ${f1(x - w / 2)} ${base}Z`;
  let bark = '';
  for (let i = 0; i < Math.round((base - top) / 14); i++) {
    const bx = x + (r() - 0.5) * w * 0.6;
    const by = top + r() * (base - top);
    bark += `M${f1(bx)} ${f1(by)}q${f1((r() - 0.5) * 3)} ${f1(6 + r() * 8)} ${f1((r() - 0.5) * 2)} ${f1(12 + r() * 10)}`;
  }
  let limbs = '';
  for (const [dx, dy, bw] of branches) {
    limbs += `M${f1(x - bw / 2)} ${f1(top + 10)}Q${f1(x + dx * 0.3)} ${f1(top + dy * 0.6)} ${f1(x + dx)} ${f1(top + dy)}L${f1(x + dx + bw * 0.4)} ${f1(top + dy + bw * 0.5)}Q${f1(x + dx * 0.35 + bw)} ${f1(top + dy * 0.5 + bw)} ${f1(x + bw / 2)} ${f1(top + 18)}Z`;
  }
  return depth(ctx, 2, `<path d="${limbs}" fill="${P.trunk}"/><path d="${d}" fill="${ref(ctx, 'trunkG')}"/>`
    + `<path d="${bark}" stroke="${P.trunkDeep}" stroke-width="1.2" fill="none" opacity=".55" stroke-linecap="round"/>`
    + `<path d="M${f1(x - w * 0.42)} ${base - 4}Q${f1(x - w * 0.36)} ${f1((top + base) / 2)} ${f1(x - t * 0.42)} ${top + 4}" stroke="${C.cutRim}" stroke-width="1" opacity=".22" fill="none"/>`,
  `<path d="${d}"/><path d="${limbs}"/>`);
}

/**
 * The park's lamp post (大安森林公園's dark green posts): a slim fluted post on a stepped base, a
 * crook arm and a lantern of lit vellum; its small bloom kept calm (the squint test). The lamp's
 * top (the lantern's cap) is at `top`; it stands at `foot`.
 */
function parkLamp(ctx: KitCtx, x: number, top: number, foot: number, { glow = 0.18, cap = false } = {}): string {
  const post = `M${x - 2.6} ${foot - 12}V${top + 26}h5.2V${foot - 12}Z`;
  const base = `M${x - 8} ${foot}h16l-2 -6h-2l-1 -6h-8l-1 6h-2Z`;
  const lantern = `M${x - 9} ${top + 6}h18l-3 16h-12Z`;
  const roof = `M${x - 12} ${top + 6}h24l-6 -7h-12Z`;
  return softEllipse(ctx, x, top + 14, 26, 24, 'lamp', glow, 'blur8')
    + depth(ctx, 3, `<path d="${post}${base}" fill="${ref(ctx, 'lampPostG')}"/><path d="M${x} ${top + 30}V${foot - 14}" stroke="${P.lampPostLit}" stroke-width=".8" opacity=".6"/>`
      + `<rect x="${x - 4}" y="${top + 21}" width="8" height="6" rx="1.5" fill="${P.lampPost}"/>`
      + `<path d="${lantern}" fill="${C.lampHot}"/><path d="M${x - 6} ${top + 8}h12l-2 12h-8Z" fill="${ref(ctx, 'window')}"/>`
      + `<path d="M${x} ${top + 6}V${top + 22}M${x - 7.5} ${top + 13}h15" stroke="${P.lampPost}" stroke-width="1" opacity=".55"/>`
      + `<path d="${roof}" fill="${P.lampPost}"/><circle cx="${x}" cy="${top - 2.5}" r="2.4" fill="${P.lampPost}"/>`
      + (cap ? `<rect x="${x - 13}" y="${top - 1}" width="26" height="4" rx="2" fill="${P.lampPostLit}"/>` : ''),
    `<path d="${post}${base}${lantern}${roof}"/>`);
}

/** A clipped hedge (a scalloped band of box leaves) along `y`, from x0 to x1, `h` tall. */
function hedge(ctx: KitCtx, x0: number, x1: number, y: number, h: number, seed: number, fill: string = P.hedge, z: 1 | 2 | 3 = 2): string {
  const d = scallopBand(x0, x1, y - h, y, seed, 6, 18);
  const r = seeded(seed + 1);
  let tex = '';
  for (let i = 0; i < Math.round((x1 - x0) / 7); i++) {
    const lx = x0 + r() * (x1 - x0);
    const ly = y - h + 4 + r() * (h - 6);
    tex += leafD(lx, ly, -Math.PI / 2 + (r() - 0.5) * 2, 4 + r() * 3);
  }
  return depth(ctx, z, `<path d="${d}" fill="${fill}"/><path d="${tex}" fill="${P.canopyLit}" opacity=".35"/>`
    + `<rect x="${x0}" y="${y - h * 0.35}" width="${x1 - x0}" height="${f1(h * 0.35)}" fill="${C.shadow}" opacity=".2"/>`, `<path d="${d}"/>`);
}

/**
 * Fireflies (bible § 6: lime pinholes, the chapter's accent): `n` tiny lime holes with light behind
 * them in a soft glow, seeded across a box. Baked here; a few drift live over the page (`dress`).
 */
function fireflies(ctx: KitCtx, x: number, y: number, w: number, h: number, n: number, seed: number): string {
  const r = seeded(seed);
  let glows = '';
  let dots = '';
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h;
    const s = 0.8 + r() * 0.9;
    glows += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(7 * s)}"/>`;
    dots += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(1.1 * s)}"/>`;
  }
  return `<g fill="${ref(ctx, 'ffGlow')}">${glows}</g><g fill="${P.fireflyCore}">${dots}</g>`;
}

/** The night over the park: the chapter's sky, pinholes, a calm moon and the city's towers far off (with a tiny 101). */
function parkSky(ctx: KitCtx, moon: readonly [number, number, number] | null, skyBase: number, seed = 5): string {
  const sk = skyline(-6, PAGE_W + 6, skyBase, seed + 30, { minH: 26, maxH: 74, winP: 0.1, winOpacity: 0.6 });
  const tower = `<g transform="translate(300 ${skyBase})"><path d="M-5 0V-58L-3.5 -60V-72H-2.5V-82H2.5V-72H3.5V-60L5 -58V0Z" fill="${mixHex(T.navyDeep, C.shadow, 0.2)}"/>`
    + `<path d="${Array.from({ length: 7 }, (_, i) => `M-6 ${-12 - i * 6.5}H6`).join('')}" stroke="${C.neonCyan}" stroke-width=".6" opacity=".4"/><circle cy="-84" r="1.2" fill="${C.neonPink}"/></g>`;
  return `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, 0, 0, PAGE_W, skyBase - 40, 54, seed)
    + (moon ? calmMoon(ctx, moon[0], moon[1], moon[2], { halo: 0.08 }) : '')
    + depth(ctx, 1, `<path d="${sk.d}" fill="${mixHex(T.navyDeep, P.canopyFar, 0.3)}"/>${tower}`, `<path d="${sk.d}"/>`) + sk.windows;
}

/** The far woods: two misty layers of crowns along the horizon (the canopy's far depths). */
function farWoods(ctx: KitCtx, y: number, seed: number): string {
  const r = seeded(seed);
  let far = '';
  for (let x = -30; x < PAGE_W + 40; x += 34 + r() * 20) far += crown(ctx, x, y - 10 - r() * 14, 26 + r() * 10, seed + Math.round(x), P.canopyFar, { z: 1, lit: 0.18, puffs: 5 });
  let mid = '';
  for (let x = -10; x < PAGE_W + 40; x += 46 + r() * 24) mid += crown(ctx, x, y + 6 - r() * 10, 30 + r() * 10, seed + 100 + Math.round(x), P.canopyMid, { z: 1, lit: 0.25, puffs: 6 });
  return far + `<rect x="-20" y="${y - 40}" width="${PAGE_W + 40}" height="60" fill="${ref(ctx, 'mistP')}"/>` + mid;
}

/**
 * The lawn on the floor page: deep near the gutter, lighter toward the reader, with grass strokes
 * in rows that grow toward the front, a moonlit sheen and a shade under the standing page.
 */
function lawnFloor(ctx: KitCtx, seed: number): string {
  const { x, y, w, h } = FLOOR_RECT;
  const r = seeded(seed);
  let blades = '';
  for (let i = 0; i < 520; i++) {
    const t = r();
    const by = GUTTER_Y + 6 + h * t;
    const bx = x + r() * w;
    const s = 2 + t * 5;
    blades += `M${f1(bx)} ${f1(by)}l${f1((r() - 0.5) * s * 0.6)} ${f1(-s)}`;
  }
  let lit = '';
  for (let i = 0; i < 160; i++) {
    const t = r();
    const by = GUTTER_Y + 10 + h * t;
    const bx = x + r() * w;
    const s = 2 + t * 4;
    lit += `M${f1(bx)} ${f1(by)}l${f1(-s * 0.3)} ${f1(-s)}`;
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'lawnG')}"/>`
    + `<path d="${blades}" stroke="${P.lawnDeep}" stroke-width="1" opacity=".55" stroke-linecap="round"/>`
    + `<path d="${lit}" stroke="${P.canopyLit}" stroke-width=".8" opacity=".4" stroke-linecap="round"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}" opacity=".45"/>`;
}

/** Light pools on the floor page: warm under lamps, cool where the moon falls through the leaves. */
const pools = (ctx: KitCtx, list: readonly (readonly [number, number, number, number, ('warm' | 'moon')?])[]) =>
  list.map(([cx, cy, rx, ry, tone]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ref(ctx, tone === 'moon' ? 'moonPoolP' : 'warmPoolP')}"/>`).join('');

/** A park bench (green iron ends, slatted wood): its back's top at `top`, its seat at `seat`, standing at `foot`. */
function parkBench(ctx: KitCtx, x0: number, x1: number, top: number, seat: number, foot: number): string {
  const slats = [0, 1, 2].map((i) => `<rect x="${x0}" y="${top + i * 8}" width="${x1 - x0}" height="5.5" rx="1.5" fill="${i ? S.benchBack : mixHex(S.benchBack, C.cutRim, 0.15)}"/>`).join('');
  const seatS = `<rect x="${x0 - 4}" y="${seat - 3}" width="${x1 - x0 + 8}" height="7" rx="2" fill="${S.benchSeat}"/><path d="M${x0 - 3} ${seat - 2.4}H${x1 + 3}" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`;
  const end = (x: number) => `<path d="M${x} ${top - 2}V${foot}M${x} ${seat + 2}l${x < (x0 + x1) / 2 ? -6 : 6} ${foot - seat - 2}" stroke="${P.lampPost}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
  return depth(ctx, 3, end(x0 + 6) + end(x1 - 6) + slats + seatS, `<rect x="${x0 - 4}" y="${top}" width="${x1 - x0 + 8}" height="${seat - top + 4}"/>`);
}

// ——— 2-1 「信義線」 ———

/** A 信義線 window: a rounded cut with a steel frame, showing what is outside it. */
function carWindow(ctx: KitCtx, x: number, y: number, w: number, h: number, inside: string, seed: number): string {
  const id = ctx.id(`c2win${seed}`);
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/></clipPath><g clip-path="url(#${id})">${inside}`
    + `<path d="M${x} ${y + h * 0.6}L${x + w * 0.5} ${y}H${x + w * 0.66}L${x} ${y + h}Z" fill="${C.cutRim}" opacity=".07"/></g>`
    + `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="11" fill="none" stroke="${ref(ctx, 'steelP')}" stroke-width="5"/>`;
}

/**
 * 2-1: a 信義線 car standing at 大安森林公園 station (bible § 6, the 月亮線 car row: a side
 * cut-away box with the front wall removed). Left, the car: its cream wall and ceiling strips, the
 * neon route strip lit at 大安森林公園, the strap rail with Mocha's strap at (96, 226), the window
 * he squeezes out of (its top pane tipped open), the teal 博愛座 (`priority`, its top at (48, 392)),
 * the red line band, the car's end frame round the doors (the `c2/doors` part). Right, the
 * platform: the station's tiled wall and its name board, the glass atrium onto the sunken garden
 * (trees, the moon), the bench where the commuter sleeps (`bench`, its back's top at (272, 372)),
 * the poster whose picture becomes the 土地公 (332, 300) once the doors are open.
 */
const xinyiCar: BackdropDraw = (ctx) => {
  // ——— The platform side (drawn first: the car's end frame overlaps it) ———
  // The atrium: glass onto the sunken garden, its mullions, trees and the moon beyond
  const atrium = (() => {
    const x0 = 196, x1 = PAGE_W + 20, y0 = 20, y1 = 196;
    const id = ctx.id('atrium');
    let mull = '';
    for (let x = x0 + 30; x < x1; x += 46) mull += `M${x} ${y0}V${y1}`;
    return `<clipPath id="${id}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath><g clip-path="url(#${id})">`
      + `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${ref(ctx, 'sky')}"/>`
      + pinholes(ctx, x0, y0, x1 - x0, 90, 20, 41)
      + calmMoon(ctx, 352, 58, 16, { halo: 0.08 })
      + crown(ctx, 236, 176, 44, 11, P.canopyFar, { z: 1, lit: 0.2 }) + crown(ctx, 320, 168, 52, 12, P.canopyMid, { z: 1, lit: 0.28 })
      + crown(ctx, 400, 186, 40, 13, P.canopyFar, { z: 1, lit: 0.2 })
      + fireflies(ctx, x0 + 10, 120, x1 - x0 - 20, 70, 9, 43)
      + `<path d="M${x0} ${y0 + 60}L${x0 + 90} ${y0}H${x0 + 130}L${x0} ${y0 + 120}Z" fill="${C.cutRim}" opacity=".06"/></g>`
      + `<path d="${mull}" stroke="${T.steelDeep}" stroke-width="3"/><path d="M${x0} ${y0 + 88}H${x1}" stroke="${T.steelDeep}" stroke-width="2.4"/>`
      + `<rect x="${x0}" y="${y0 - 6}" width="${x1 - x0}" height="8" fill="${T.steelDeep}"/>`;
  })();
  // The tiled wall with the station's name board on the line's red
  let tiles = '';
  for (let y = 204; y < GUTTER_Y; y += 14) tiles += `M196 ${y}H${PAGE_W + 20}`;
  for (let x = 202; x < PAGE_W + 20; x += 22) tiles += `M${x} 204V${GUTTER_Y}`;
  const wall = `<rect x="196" y="196" width="${PAGE_W - 176}" height="${GUTTER_Y - 196}" fill="${ref(ctx, 'tileWall')}"/>`
    + `<path d="${tiles}" stroke="${P.stationTileDeep}" stroke-width=".8" opacity=".45"/>`;
  const nameBoard = depth(ctx, 2, `<rect x="214" y="210" width="168" height="34" rx="3" fill="${C.washi}"/><rect x="214" y="236" width="168" height="8" fill="${P.xinyi}"/>`, `<rect x="214" y="210" width="168" height="34" rx="3"/>`)
    + `<text data-art-text="" x="298" y="230" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="14" fill="${T.navyDeep}" letter-spacing="3">大安森林公園</text>`
    + `<circle cx="226" cy="224" r="6" fill="${P.xinyi}"/><text data-art-text="" x="226" y="227" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="7" fill="${C.cutRim}">R</text>`;
  // The poster (its picture is the 土地公 once the doors open: he is drawn live at (332, 300))
  const poster = depth(ctx, 2, `<rect x="306" y="262" width="54" height="74" rx="2" fill="${C.washi}"/><rect x="306" y="262" width="54" height="13" rx="2" fill="${P.canopyNear}"/>`
    + `<circle cx="333" cy="300" r="15" fill="${mixHex(C.washi, P.lilyLight, 0.25)}"/><path d="M314 328q19 -10 38 0" stroke="${P.lilyLight}" stroke-width="3" fill="none" opacity=".6"/>`, `<rect x="306" y="262" width="54" height="74"/>`)
    + `<text data-art-text="" x="333" y="272" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7.5" fill="${C.cutRim}" letter-spacing="1">森林音樂會</text>`;
  // The platform's bench (Mocha's `bench`: its back's top at (272, 372)); the commuter sleeps on its seat (300, 428)
  const bench = parkBench(ctx, 244, 344, 372, 428, 462);
  // Platform lamps in the ceiling
  const ceilP = `<rect x="196" y="0" width="${PAGE_W - 176}" height="16" fill="${T.lattice}"/>`;
  // ——— The car ———
  const carX1 = 196;
  const back = `<rect x="-20" y="0" width="${carX1 + 20}" height="${GUTTER_Y + 40}" fill="${ref(ctx, 'carWallP')}"/>`
    + paperFibres(-20, 0, carX1 + 20, GUTTER_Y, 40, T.carWallShade, 63, 0.25);
  // The ceiling: a curved panel with its light strip
  const ceiling = `<path d="M-20 0H${carX1}V64Q88 76 -20 64Z" fill="${T.carCeiling}"/><path d="M-20 64Q88 76 ${carX1} 64" stroke="${T.carWallShade}" stroke-width="2" fill="none"/>`
    + `<rect x="10" y="30" width="150" height="5" rx="2.5" fill="${C.lampHot}"/>` + softEllipse(ctx, 85, 32, 80, 8, 'lamp', 0.3);
  // The route strip: the 信義線's red, its stops, 大安森林公園 lit
  const stops = [22, 58, 94, 130, 166];
  const route = depth(ctx, 2, `<rect x="6" y="80" width="176" height="26" rx="4" fill="${T.navyDeep}"/>`, `<rect x="6" y="80" width="176" height="26" rx="4"/>`)
    + `<path d="M16 96H172" stroke="${P.xinyi}" stroke-width="4" stroke-linecap="round"/>`
    + stops.map((x, i) => `<circle cx="${x}" cy="96" r="${i === 2 ? 4.6 : 3}" fill="${i === 2 ? C.lampHot : C.cutRim}" stroke="${P.xinyi}" stroke-width="1.6"/>`).join('')
    + softEllipse(ctx, 94, 96, 10, 8, 'lamp', 0.4)
    + `<text data-art-text="" x="94" y="90" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7" fill="${C.lamp}">大安森林公園</text>`
    + `<text data-art-text="" x="22" y="90" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="700" font-size="5.5" fill="${C.chalk}" opacity=".7">信義線</text>`;
  // The car's windows: the left one shows the far wall's green tiles; the right one is the open one Mocha squeezes out of
  const tunnel = (x: number, y: number, w: number, h: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mixHex(P.stationTile, T.navy, 0.45)}"/>`
    + `<path d="${Array.from({ length: Math.ceil(h / 10) }, (_, i) => `M${x} ${y + i * 10}h${w}`).join('')}" stroke="${P.stationTileDeep}" stroke-width=".7" opacity=".5"/>`
    + `<rect x="${x}" y="${y + h * 0.34}" width="${w}" height="12" fill="${P.xinyi}" opacity=".75"/>`
    + softEllipse(ctx, x + w / 2, y + 10, w * 0.4, 10, 'lamp', 0.18);
  const winA = carWindow(ctx, 6, 128, 74, 92, tunnel(6, 128, 74, 92), 1);
  // The open window: the upper pane tipped in, a dark slot above it (Mocha's way out, C2)
  const winB = carWindow(ctx, 112, 128, 70, 92, tunnel(112, 128, 70, 92)
    + `<rect x="112" y="128" width="70" height="20" fill="${C.shadow}" opacity=".55"/>`, 2)
    + depth(ctx, 3, `<path d="M112 150L182 150L178 132L116 132Z" fill="${C.glassine}" opacity=".55"/><path d="M112 150H182" stroke="${ref(ctx, 'steelP')}" stroke-width="3"/>`, `<path d="M112 150L182 150L178 132L116 132Z"/>`);
  // The strap rail and Mocha's strap (its handle's top at (96, 226)); a second strap for show, looped short
  const strap = (x: number, top: number) => `<path d="M${x} 116V${top - 2}" stroke="${P.xinyiDeep}" stroke-width="4"/>`
    + `<circle cx="${x}" cy="${top + 9}" r="9" fill="none" stroke="${C.cutRim}" stroke-width="3.6"/><circle cx="${x}" cy="${top + 9}" r="9" fill="none" stroke="${T.steel}" stroke-width="2"/>`;
  const rail = depth(ctx, 3, `<rect x="-20" y="112" width="${carX1 + 20}" height="5" rx="2.5" fill="${ref(ctx, 'steelP')}"/>`
    + `<path d="M30 70V112M150 70V112" stroke="${T.steelDeep}" stroke-width="2.4"/>`
    + strap(96, 226) + `<path d="M40 116V146" stroke="${P.xinyiDeep}" stroke-width="4"/><path d="M33 146H47L40 158Z" fill="none" stroke="${P.xinyiDeep}" stroke-width="3" stroke-linejoin="round"/>`,
  `<rect x="-20" y="112" width="${carX1 + 20}" height="5"/>`);
  // The red band under the windows
  const band = `<rect x="-20" y="236" width="${carX1 + 20}" height="10" fill="${P.xinyi}"/><rect x="-20" y="247" width="${carX1 + 20}" height="2" fill="${P.xinyiDeep}"/>`;
  // The 博愛座 sign over the seat
  const prioSign = depth(ctx, 2, `<rect x="16" y="262" width="58" height="16" rx="3" fill="${T.priority}"/>`, `<rect x="16" y="262" width="58" height="16" rx="3"/>`)
    + `<text data-art-text="" x="45" y="273.5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.cutRim}" letter-spacing="2">博愛座</text>`;
  // The car's end: a steel frame with rounded corners round the doorway (the doors part fills x 130–190)
  const frame = depth(ctx, 3, `<path d="M124 196H196V470H190V214Q190 206 182 206H138Q130 206 130 214V470H124Z" fill="${T.steel}"/>`
    + `<path d="M196 0V470" stroke="${T.steelDeep}" stroke-width="4"/>`
    + `<rect x="138" y="196" width="44" height="8" rx="2" fill="${C.printDark}"/>`, `<path d="M124 196H196V470H124Z"/>`);
  // Through the doorway (seen once the doors slide open): the platform's tiled wall in the lamps' wash
  const doorway = `<rect x="130" y="206" width="60" height="264" fill="${ref(ctx, 'tileWall')}"/>`
    + `<path d="${Array.from({ length: 11 }, (_, i) => `M130 ${214 + i * 14}h60`).join('')}M152 206V360M174 206V360" stroke="${P.stationTileDeep}" stroke-width=".8" opacity=".45"/>`
    + `<rect x="130" y="360" width="60" height="110" fill="${mixHex(T.granite, T.navy, 0.3)}"/>`
    + softEllipse(ctx, 160, 420, 34, 40, 'lamp', 0.2);
  // The 博愛座 (teal, against the wall): its top at (48, 392)
  const seat = depth(ctx, 3, `<rect x="8" y="392" width="84" height="40" rx="8" fill="${ref(ctx, 'prioP')}"/>`
    + `<rect x="4" y="428" width="92" height="22" rx="6" fill="${ref(ctx, 'prioP')}"/><path d="M12 432h76" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`
    + `<path d="M50 398V426" stroke="${C.shadow}" stroke-width="1.6" opacity=".2"/>`, `<rect x="4" y="392" width="92" height="58"/>`);
  const poles = `<rect x="104" y="40" width="5" height="440" fill="${ref(ctx, 'steelP')}"/>`;
  // The floor page: the car's dark underfloor to the left, the gap's pit, the platform's granite to the right
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(T.navyDeep, C.printDark, 0.4)}"/>`
    + `<rect x="196" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="110" fill="${mixHex(T.granite, T.navy, 0.35)}"/>`
    + `<rect x="196" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="110" fill="${ref(ctx, 'floorShade')}"/>`
    + `<rect x="-40" y="${GUTTER_Y}" width="236" height="110" fill="${T.floorLino}"/>`
    + `<path d="${Array.from({ length: 8 }, (_, i) => `M${-20 + i * 30} ${GUTTER_Y}l${f1((-20 + i * 30 - 195) * 0.08)} 110`).join('')}" stroke="${T.floorLinoDeep}" stroke-width=".8" opacity=".5"/>`
    + `<rect x="-40" y="${GUTTER_Y}" width="236" height="24" fill="${C.shadow}" opacity=".18"/>`
    + softEllipse(ctx, 60, GUTTER_Y + 50, 90, 26, 'lamp', 0.12)
    // Below the car and platform: the track bed
    + (() => {
      const k = (FLOOR_BOTTOM - GUTTER_Y) / (GUTTER_Y + 360);
      let d = '';
      for (let x = -140; x <= PAGE_W + 140; x += 26) d += `M${f1(x + (x - 195) * k * 0.55)} 548L${f1(x + (x - 195) * k)} ${FLOOR_BOTTOM}`;
      return `<rect x="${FLOOR_RECT.x}" y="530" width="${FLOOR_RECT.w}" height="${FLOOR_BOTTOM - 530}" fill="${mixHex(T.navyDeep, C.printDark, 0.5)}"/><path d="${d}" stroke="${C.printDark}" stroke-width="5" opacity=".9"/>`;
    })()
    + `<path d="M-40 572H430M-40 626H430" stroke="${T.steelDeep}" stroke-width="5"/><path d="M-40 570.5H430M-40 624.5H430" stroke="${T.steel}" stroke-width="1.6"/>`
    + pools(ctx, [[300, GUTTER_Y + 40, 110, 30]]));
  return parkDefs(ctx) + standingPage(ctx, atrium + wall + nameBoard + poster + ceilP + back + ceiling + route + winA + winB + band + prioSign + `<rect x="196" y="${GUTTER_Y - 30}" width="${PAGE_W}" height="30" fill="${ref(ctx, 'lampWashP')}"/>`)
    + floor + doorway + bench + poles + rail + seat + frame + bookCues(ctx) + block();
};

// ——— 2-2 「露天音樂台」 ———

/**
 * 2-2: the open-air bandshell (bible § 6 row 2: the amphitheatre shell as a white V-fold). The shell
 * is a quarter dome of white ribs folded down its centre, its inside stepping darker toward the back
 * row's benches (where the 土地公 sits, (250, 330), seen only in the spotlight); the catwalk up in the
 * right wing where the 掃地阿伯 naps (330, 250); the stage's deck on the floor page. Left, the lawn
 * under a camphor's canopy: the park lamp (`lamp`, its top at (44, 300)), the 店員小哥's drinks cart
 * with its crate on the stage's edge (`crate`, its rim at (186, 372)), fireflies over the grass, and
 * the spotlight's tripod at the lawn's edge (the `c2/spotlight` wheel turns on it at (176, 540)).
 */
const bandshell: BackdropDraw = (ctx) => {
  const cx = 258, base = GUTTER_Y + 6;
  // The shell: concentric ribs from the outer white lip inward, each a half ellipse, darker inside
  const ribs = [[178, 206], [156, 180], [134, 154], [112, 128], [90, 102]] as const;
  const arch = (rx: number, ry: number) => `M${cx - rx} ${base}A${rx} ${ry} 0 0 1 ${cx + rx} ${base}Z`;
  const tones = [P.shell, mixHex(P.shell, P.shellShade, 0.35), mixHex(P.shell, P.shellShade, 0.65), P.shellShade, mixHex(P.shellShade, P.shellDeep, 0.5)];
  let shell = depth(ctx, 2, `<path d="${arch(ribs[0][0], ribs[0][1])}" fill="${tones[0]}"/>`, `<path d="${arch(ribs[0][0], ribs[0][1])}"/>`);
  ribs.slice(1).forEach(([rx, ry], i) => {
    shell += `<path d="${arch(rx, ry)}" fill="${tones[i + 1]}"/><path d="M${cx - rx} ${base}A${rx} ${ry} 0 0 1 ${cx + rx} ${base}" stroke="${C.cutRim}" stroke-width="1.2" fill="none" opacity=".5"/>`;
  });
  // The back wall inside the last rib: the choir benches, three tiers
  const inner = ribs[ribs.length - 1];
  const benches = [0, 1, 2].map((k) => `<rect x="${cx - inner[0] + 8 + k * 6}" y="${306 + k * 18}" width="${2 * inner[0] - 16 - k * 12}" height="6" rx="2" fill="${P.stageDeep}" opacity=".8"/>`
    + `<path d="M${cx - inner[0] + 8 + k * 6} ${306 + k * 18 + 0.6}h${2 * inner[0] - 16 - k * 12}" stroke="${P.stageLight}" stroke-width="1" opacity=".6"/>`).join('');
  shell += benches + vFold(ctx, arch(ribs[0][0], ribs[0][1]), cx, base - ribs[0][1], base, { shade: 0.18, clipId: ctx.id('shellFold') });
  // The catwalk in the right wing (the 掃地阿伯's nap, (330, 250)): a plank on two hangers, a broom leaning on it
  const catwalk = depth(ctx, 3, `<rect x="300" y="250" width="70" height="6" rx="2" fill="${P.plank}"/><path d="M306 250V196M364 250V196" stroke="${P.shellDeep}" stroke-width="1.6"/>`
    + `<path d="M302 256h66" stroke="${P.plankDeep}" stroke-width="2"/>`, `<rect x="300" y="250" width="70" height="6"/>`)
    + `<path d="M372 250l10 -40" stroke="${P.plankDeep}" stroke-width="2.4" stroke-linecap="round"/><path d="M380 212l6 -12l-8 2z" fill="${C.corrugatedLight}"/>`;
  // A string of small lamps along the shell's lip, calm (the squint test)
  const lip = ribs[0];
  let rig = '';
  for (let i = 1; i < 12; i++) {
    const a = Math.PI * (i / 12);
    const [lx, ly] = [cx - Math.cos(a) * (lip[0] - 6), base - Math.sin(a) * (lip[1] - 6)];
    rig += `<circle cx="${f1(lx)}" cy="${f1(ly)}" r="1.8" fill="${C.lampHot}"/>` + softEllipse(ctx, lx, ly, 4, 4, 'lamp', 0.25);
  }
  // The left: sky, far woods, a camphor's canopy, the lamp, the drinks cart with the 店員小哥
  const back = parkSky(ctx, [346, 52, 15], 216, 7) + farWoods(ctx, 236, 21)
    + `<rect x="-20" y="250" width="${PAGE_W + 40}" height="${GUTTER_Y - 250}" fill="${P.canopyFar}"/>`
    + crown(ctx, 24, 262, 54, 31, P.canopyMid, { lit: 0.3 }) + crown(ctx, 116, 286, 46, 32, P.canopyNear, { lit: 0.35 })
    + hedge(ctx, -20, 140, GUTTER_Y + 2, 26, 33)
    + shell + catwalk + rig
    + canopy(ctx, -20, 150, 46, 35, P.canopyNear, { amp: 18, step: 38, z: 3 })
    + fireflies(ctx, 0, 200, 150, 150, 14, 37);
  // The drinks cart (the 店員小哥's chapter cameo): a little striped awning, the clerk behind his counter
  const cart = depth(ctx, 3, `<rect x="128" y="318" width="64" height="40" rx="2" fill="${T.cartWood}"/><rect x="124" y="314" width="72" height="6" rx="2" fill="${T.counterTop}"/>`
    + `<path d="M132 330h56M132 342h56" stroke="${T.cartWoodDeep}" stroke-width="1.2" opacity=".6"/>`, `<rect x="124" y="314" width="72" height="44"/>`)
    + `<text data-art-text="" x="160" y="340" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="10" fill="${T.awningCream}" letter-spacing="2">飲料</text>`;
  const awning = (() => {
    let d = '';
    for (let i = 0; i < 6; i++) d += `<path d="M${120 + i * 14} 268h14v14q-7 6 -14 0z" fill="${i % 2 ? T.awningCream : T.awningRed}"/>`;
    return `<path d="M124 282V314M196 282V314" stroke="${T.cartWoodDeep}" stroke-width="2.4"/>` + depth(ctx, 3, d, `<rect x="120" y="268" width="84" height="18"/>`);
  })();
  // The crate on the stage's edge (Mocha's `crate`, C9): bottles in a plastic-look crate, its rim at y 372
  const crate = depth(ctx, 3, `<rect x="160" y="372" width="52" height="40" rx="3" fill="${P.lily}"/><path d="M164 384h44M164 396h44M173 374v36M186 374v36M199 374v36" stroke="${mixHex(P.lily, C.shadow, 0.4)}" stroke-width="2"/>`
    + `<rect x="158" y="370" width="56" height="6" rx="2" fill="${P.lilyLight}"/><path d="M160 371h52" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`
    + `<rect x="178" y="380" width="16" height="7" rx="2" fill="${mixHex(P.lily, C.shadow, 0.5)}"/>`, `<rect x="158" y="370" width="56" height="42"/>`);
  // The stage deck on the floor page under the shell, the lawn in front of it
  const deckFloor = (() => {
    let boards = '';
    for (let x = 100; x < PAGE_W + 30; x += 12) boards += `M${x} ${GUTTER_Y}L${f1(x + (x - 195) * 0.12)} 440`;
    return `<path d="M${cx - 160} ${GUTTER_Y}H${PAGE_W + 30}V440H${cx - 170}Z" fill="${P.stageLight}"/><path d="${boards}" stroke="${P.stage}" stroke-width="1" opacity=".6"/>`
      + `<path d="M${cx - 160} ${GUTTER_Y}H${PAGE_W + 30}V${GUTTER_Y + 24}H${cx - 162}Z" fill="${C.shadow}" opacity=".3"/>`;
  })();
  // The spotlight's tripod at the lawn's edge, under the wheel (176, 540)
  const tripod = `<path d="M176 548L150 604M176 548L202 604M176 548V600" stroke="${C.printDark}" stroke-width="3.4" stroke-linecap="round"/>`
    + softEllipse(ctx, 176, 604, 34, 5, 'shadow', 0.4);
  const floor = floorPage(ctx, lawnFloor(ctx, 51) + deckFloor
    + pools(ctx, [[44, 500, 70, 22], [222, 500, 50, 14, 'moon']])
    + fireflies(ctx, -10, 520, 120, 100, 6, 53));
  return parkDefs(ctx) + standingPage(ctx, back + awning + cart + clerk(ctx, 160, 300) + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'lampWashP')}"/>`)
    + floor + tripod + crate + parkLamp(ctx, 44, 300, 482) + bookCues(ctx) + block();
};

// ——— 2-3 「跑步的阿姨」 ———

/** Water on the floor page (the stream, the pond): deep glassine over the water card, sheen streaks, ripples. */
function water(ctx: KitCtx, d: string, seed: number, { moon }: { moon?: readonly [number, number] } = {}): string {
  const id = ctx.id(`water${seed}`);
  const r = seeded(seed);
  let ripples = '';
  for (let i = 0; i < 26; i++) {
    const x = -20 + r() * (PAGE_W + 40), y = GUTTER_Y + r() * (FLOOR_BOTTOM - GUTTER_Y);
    const w = 6 + r() * 16;
    ripples += `M${f1(x)} ${f1(y)}q${f1(w / 2)} -3 ${f1(w)} 0`;
  }
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${ref(ctx, 'waterG')}"/><g clip-path="url(#${id})">`
    + (moon ? `<ellipse cx="${moon[0]}" cy="${moon[1]}" rx="14" ry="5" fill="${ref(ctx, 'foil')}" opacity=".55"/><ellipse cx="${moon[0]}" cy="${moon[1] + 9}" rx="9" ry="2.4" fill="${ref(ctx, 'foil')}" opacity=".35"/>` : '')
    + `<path d="${ripples}" stroke="${C.vellum}" stroke-width="1" fill="none" opacity=".35"/>`
    + `<path d="M-40 ${GUTTER_Y + 40}L${PAGE_W + 40} ${GUTTER_Y + 140}V${GUTTER_Y + 152}L-40 ${GUTTER_Y + 52}Z" fill="${ref(ctx, 'glassine')}" opacity=".45"/>`
    + `<path d="M-40 ${GUTTER_Y + 150}L${PAGE_W + 40} ${GUTTER_Y + 250}V${GUTTER_Y + 256}L-40 ${GUTTER_Y + 156}Z" fill="${ref(ctx, 'glassine')}" opacity=".35"/>`
    + `</g><path d="${d}" fill="none" stroke="${C.vellum}" stroke-width="1.2" opacity=".4"/>`;
}

/** A clump of reeds and a few cattails, standing at `foot`. */
function reeds(ctx: KitCtx, x: number, foot: number, h: number, seed: number): string {
  const r = seeded(seed);
  let blades = '';
  let tails = '';
  for (let i = 0; i < 9; i++) {
    const bx = x - 16 + r() * 32, bh = h * (0.55 + r() * 0.45), lean = (r() - 0.5) * 18;
    blades += `M${f1(bx)} ${foot}q${f1(lean * 0.3)} ${f1(-bh * 0.6)} ${f1(lean)} ${f1(-bh)}`;
    if (r() < 0.4) tails += `<rect x="${f1(bx + lean - 2)}" y="${f1(foot - bh - 4)}" width="4" height="12" rx="2" fill="${P.trunk}"/>`;
  }
  return depth(ctx, 2, `<path d="${blades}" stroke="${P.reed}" stroke-width="2.4" fill="none" stroke-linecap="round"/>${tails}`, `<path d="${blades}" stroke="#000" stroke-width="2.4" fill="none"/>`);
}

/**
 * 2-3: the little bridge by the joggers' path. Behind, the park at night: far woods, two tall
 * camphors framing the page, a lamp, the joggers' path curving away along the floor page's back
 * (the jogger runs off along it to (370, 400)) with its 「慢跑步道」 marker. The stream runs under the
 * bridge into the pond at the front left, where the turtle's rock is (52, 532). The bridge's far
 * railing (`railing`, its top at (206, 390)) arches over the stream; the pond-side bench is
 * Mocha's (`bench`, its back's top at (60, 384)).
 */
const bridge: BackdropDraw = (ctx) => {
  const back = parkSky(ctx, [300, 58, 14], 222, 9) + farWoods(ctx, 238, 61)
    + `<rect x="-20" y="252" width="${PAGE_W + 40}" height="${GUTTER_Y - 252}" fill="${P.canopyFar}"/>`
    + trunk(ctx, 22, 150, GUTTER_Y + 4, 30, 62) + trunk(ctx, 362, 140, GUTTER_Y + 4, 34, 63)
    + crown(ctx, 30, 150, 58, 160, P.canopyMid, { lit: 0.32 }) + crown(ctx, 366, 136, 62, 161, P.canopyMid, { lit: 0.32 })
    + crown(ctx, 300, 300, 50, 64, P.canopyMid, { lit: 0.3 }) + crown(ctx, 120, 308, 44, 65, P.canopyMid, { lit: 0.3 })
    + hedge(ctx, -20, PAGE_W + 20, GUTTER_Y + 2, 30, 66)
    + parkLamp(ctx, 272, 262, GUTTER_Y + 4, { glow: 0.16 })
    + canopy(ctx, -20, 160, 70, 67, P.canopyMid, { amp: 20, step: 40, z: 2 }) + canopy(ctx, 230, PAGE_W + 20, 56, 68, P.canopyMid, { amp: 20, step: 40, z: 2 })
    + canopy(ctx, -20, 110, 34, 69, P.canopyNear, { amp: 16, step: 34, z: 3 }) + canopy(ctx, 290, PAGE_W + 20, 26, 70, P.canopyNear, { amp: 16, step: 34, z: 3 })
    + fireflies(ctx, 40, 150, 320, 190, 18, 71);
  // The joggers' path along the floor page's back, curving off to the right; its marker post
  const path = `M-30 ${GUTTER_Y + 14}C80 ${GUTTER_Y + 6} 240 ${GUTTER_Y + 30} ${PAGE_W + 30} ${GUTTER_Y + 34}V${GUTTER_Y + 58}C240 ${GUTTER_Y + 52} 80 ${GUTTER_Y + 30} -30 ${GUTTER_Y + 36}Z`;
  const marker = depth(ctx, 3, `<rect x="340" y="${GUTTER_Y - 22}" width="5" height="44" fill="${P.lampPost}"/><rect x="318" y="${GUTTER_Y - 34}" width="48" height="16" rx="3" fill="${P.lampPost}"/>`, `<rect x="318" y="${GUTTER_Y - 34}" width="48" height="56"/>`)
    + `<text data-art-text="" x="342" y="${GUTTER_Y - 23}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${C.chalk}" letter-spacing="1">慢跑步道</text>`;
  // The stream from under the bridge to the pond at the front left
  const stream = `M130 ${GUTTER_Y + 40}C150 ${GUTTER_Y + 80} 190 ${GUTTER_Y + 96} 200 ${GUTTER_Y + 130}C206 ${GUTTER_Y + 150} 150 ${GUTTER_Y + 160} 120 ${GUTTER_Y + 160}`
    + `L-40 ${GUTTER_Y + 150}V${FLOOR_BOTTOM}H170C180 ${FLOOR_BOTTOM - 40} 210 ${GUTTER_Y + 190} 236 ${GUTTER_Y + 150}C252 ${GUTTER_Y + 120} 196 ${GUTTER_Y + 70} 180 ${GUTTER_Y + 40}Z`;
  const rock = depth(ctx, 3, `<path d="M28 540q2 -16 22 -18q24 -2 30 14q2 8 -6 10h-40q-8 0 -6 -6z" fill="${P.paverDeep}"/><path d="M36 526q10 -6 24 -4" stroke="${C.cutRim}" stroke-width="1.2" opacity=".35" fill="none"/>`, `<path d="M28 540q2 -16 22 -18q24 -2 30 14q2 8 -6 10h-40q-8 0 -6 -6z"/>`);
  const floor = floorPage(ctx, lawnFloor(ctx, 73)
    + `<path d="${path}" fill="${ref(ctx, 'paverG')}"/><path d="${path}" fill="none" stroke="${P.paverDeep}" stroke-width="1" opacity=".5"/>`
    + water(ctx, stream, 74, { moon: [70, 600] })
    + pools(ctx, [[272, GUTTER_Y + 30, 90, 24], [60, 470, 70, 20, 'moon']])
    + fireflies(ctx, 0, 560, 380, 80, 7, 75));
  // The bridge's far railing, arched over the stream (its top rail passes (206, 390)); red lacquered posts
  const railTop = 'M110 404Q168 360 226 404';
  let posts = '';
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const x = (1 - t) * (1 - t) * 110 + 2 * t * (1 - t) * 168 + t * t * 226;
    const y = (1 - t) * (1 - t) * 404 + 2 * t * (1 - t) * 360 + t * t * 404;
    posts += `M${f1(x)} ${f1(y)}V${f1(460 - Math.sin(t * Math.PI) * 10)}`;
  }
  const railing = depth(ctx, 3, `<path d="${posts}" stroke="${P.xinyiDeep}" stroke-width="3.4"/><path d="${railTop}" stroke="${P.xinyi}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    + `<path d="M112 418Q168 378 224 418" stroke="${P.xinyiDeep}" stroke-width="2.4" fill="none"/>`
    + `<path d="M110 402.6Q168 358.6 226 402.6" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".5"/>`, `<path d="${railTop}" stroke="#000" stroke-width="5" fill="none"/>`);
  return parkDefs(ctx) + standingPage(ctx, back + marker + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'lampWashP')}"/>`)
    + floor + reeds(ctx, 6, 560, 46, 76) + rock + railing + parkBench(ctx, 20, 100, 384, 424, 466) + bookCues(ctx) + block();
};

// ——— 2-4 「松鼠的樹」 ———

/**
 * 2-4: the squirrel's tree, a great camphor filling the page. Its trunk rises from the roots to two
 * forks (Mocha's `westFork` (162, 270) and `eastFork` (248, 250)); a branch reaches out each way to
 * the squirrel's high perches (`westBranch` (96, 214), `eastBranch` (318, 188)), and a low branch
 * bends down over the roots at the right (where it sits when herded, (308, 484)). A knot-hole at
 * (226, 340) is the 土地公's window. The stump at the left is Mocha's start (`stump`, (40, 392)).
 * 咻咻 (the little cloud) rustles the leaves up in the crown, top right.
 */
const tree: BackdropDraw = (ctx) => {
  const back = parkSky(ctx, [56, 52, 13], 230, 11) + farWoods(ctx, 248, 81)
    + `<rect x="-20" y="262" width="${PAGE_W + 40}" height="${GUTTER_Y - 262}" fill="${P.canopyFar}"/>`
    + hedge(ctx, -20, PAGE_W + 20, GUTTER_Y + 2, 26, 82)
    + parkLamp(ctx, 360, 274, GUTTER_Y + 4, { glow: 0.16 });
  // The crown: far layer behind the limbs, then the trunk and limbs, then the near leaves in front
  const crownBack = canopy(ctx, -20, PAGE_W + 20, 120, 83, P.canopyFar, { amp: 22, step: 46, z: 1, lit: 0.2 })
    + crown(ctx, 120, 120, 80, 84, P.canopyMid, { lit: 0.28 }) + crown(ctx, 290, 104, 86, 85, P.canopyMid, { lit: 0.28 });
  const limbs = (() => {
    // The trunk (base 170–250 at the roots), the two forks and the branches
    const t = `M150 ${GUTTER_Y + 6}Q174 404 176 330Q178 300 158 274L148 262Q172 246 192 266Q202 282 206 294Q216 272 238 252L250 236Q270 246 258 264Q236 292 232 330Q232 404 264 ${GUTTER_Y + 6}Z`;
    const west = 'M172 282Q138 242 94 228L84 206Q140 204 188 258Z';
    const east = 'M236 268Q278 216 320 202L336 180Q286 182 230 244Z';
    const low = 'M230 322Q298 350 324 448L304 456Q284 388 226 348Z';
    let bark = '';
    const r = seeded(86);
    for (let i = 0; i < 26; i++) {
      const x = 186 + r() * 36, y = 290 + r() * 150;
      bark += `M${f1(x)} ${f1(y)}q${f1((r() - 0.5) * 3)} ${f1(8 + r() * 10)} ${f1((r() - 0.5) * 2)} ${f1(14 + r() * 12)}`;
    }
    return depth(ctx, 2, `<path d="${west}${east}${low}" fill="${P.trunk}"/><path d="${t}" fill="${ref(ctx, 'trunkG')}"/>`
      + `<path d="${bark}" stroke="${P.trunkDeep}" stroke-width="1.3" fill="none" opacity=".55" stroke-linecap="round"/>`
      + `<path d="M176 ${GUTTER_Y}Q186 380 186 330" stroke="${C.cutRim}" stroke-width="1" opacity=".22" fill="none"/>`
      + `<path d="M92 216Q140 222 176 266M236 252Q282 204 326 190" stroke="${P.trunkLit}" stroke-width="1.4" fill="none" opacity=".6"/>`
      // The knot-hole (the 土地公's window at (226, 340)): a dark oval with a lit lip
      + `<ellipse cx="216" cy="344" rx="13" ry="16" fill="${P.trunkDeep}"/><ellipse cx="216" cy="346" rx="9" ry="12" fill="${C.shadow}" opacity=".6"/>`
      + `<path d="M204 336q12 -14 24 0" stroke="${P.trunkLit}" stroke-width="1.6" fill="none" opacity=".7"/>`
      // Roots spreading over the lawn
      + `<path d="M162 ${GUTTER_Y + 6}q-30 4 -48 22M252 ${GUTTER_Y + 6}q34 6 50 24M200 ${GUTTER_Y + 6}q0 16 -8 30" stroke="${P.trunk}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    `<path d="${t}"/><path d="${west}${east}${low}"/>`);
  })();
  // Little leaf clumps on the branch ends and over the low branch
  const tufts = crown(ctx, 84, 206, 22, 87, P.canopyNear, { lit: 0.4, puffs: 5 }) + crown(ctx, 334, 182, 24, 88, P.canopyNear, { lit: 0.4, puffs: 5 })
    + crown(ctx, 322, 436, 18, 89, P.canopyNear, { lit: 0.4, puffs: 4 });
  // 咻咻 in the crown, rustling the leaves: a few leaves tumbling off the near layer
  const r = seeded(90);
  let tumble = '';
  for (let i = 0; i < 7; i++) tumble += leafD(250 + r() * 110, 120 + r() * 60, r() * Math.PI * 2, 7 + r() * 4);
  const shushu = shushuPeek(ctx, 296, 92, 1.5) + `<path d="${tumble}" fill="${P.canopyLit}" opacity=".85"/>`
    + `<path d="M330 120q10 -6 20 0M318 136q12 -6 24 0" stroke="${C.vellum}" stroke-width="1.2" fill="none" opacity=".5" stroke-linecap="round"/>`;
  const front = canopy(ctx, -20, 150, 40, 91, P.canopyNear, { amp: 18, step: 36, z: 3 }) + canopy(ctx, 250, PAGE_W + 20, 60, 92, P.canopyNear, { amp: 18, step: 36, z: 3 });
  // The stump at the left (Mocha's `stump`, its top at (40, 392)): its rings on top
  const stump = depth(ctx, 3, `<path d="M18 392V468q22 8 44 0V392Z" fill="${ref(ctx, 'trunkG')}"/><ellipse cx="40" cy="392" rx="22" ry="7" fill="${P.trunkLit}"/>`
    + `<ellipse cx="40" cy="392" rx="15" ry="4.6" fill="none" stroke="${P.trunk}" stroke-width="1"/><ellipse cx="40" cy="392" rx="8" ry="2.4" fill="none" stroke="${P.trunk}" stroke-width="1"/>`
    + `<path d="M24 410v40M50 404v52" stroke="${P.trunkDeep}" stroke-width="1.2" opacity=".5"/>`, `<path d="M18 392V468q22 8 44 0V392Z"/><ellipse cx="40" cy="392" rx="22" ry="7"/>`);
  const floor = floorPage(ctx, lawnFloor(ctx, 93)
    + pools(ctx, [[360, GUTTER_Y + 30, 80, 22], [120, GUTTER_Y + 60, 90, 26, 'moon']])
    + fireflies(ctx, 0, 540, 390, 100, 8, 94));
  return parkDefs(ctx) + standingPage(ctx, back + crownBack + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'lampWashP')}"/>`)
    + floor + limbs + tufts + shushu + front + stump + fireflies(ctx, 20, 140, 350, 200, 16, 95) + bookCues(ctx) + block();
};

// ——— 2-5 「生態池」 ———

/**
 * 2-5: the eco-pond. The water fills the floor page between the two boardwalks (the lily-pad wheel
 * turns in it at (206, 478)), with the moon's reflection in foil under glassine, lilies, and the
 * stepping stone at the front (Mocha's wet `stone`, (112, 528)). Left, the pavilion (涼亭) whose
 * rail is Mocha's start (`pavilion`, (52, 330)); right, the reeds the egret flaps off to (354, 380).
 * The 土地公 fishes beside the far lilies (150, 540) when the pad swings to the front.
 */
const pond: BackdropDraw = (ctx) => {
  const back = parkSky(ctx, [214, 60, 15], 224, 13) + farWoods(ctx, 240, 101)
    + `<rect x="-20" y="254" width="${PAGE_W + 40}" height="${GUTTER_Y - 254}" fill="${P.canopyFar}"/>`
    + crown(ctx, 300, 296, 46, 102, P.canopyMid, { lit: 0.3 }) + crown(ctx, 380, 290, 40, 103, P.canopyMid, { lit: 0.3 })
    + hedge(ctx, 120, PAGE_W + 20, GUTTER_Y + 2, 22, 104)
    + canopy(ctx, 250, PAGE_W + 20, 50, 105, P.canopyMid, { amp: 18, step: 38, z: 2 }) + canopy(ctx, 300, PAGE_W + 20, 22, 106, P.canopyNear, { amp: 16, step: 34, z: 3 })
    + fireflies(ctx, 120, 160, 260, 180, 16, 107);
  // The pavilion (涼亭): a hipped roof with upturned eaves on red posts, its rail at y 330
  const pavilion = (() => {
    const roof = 'M-10 236L40 196H64L114 236Q100 232 92 236H12Q4 232 -10 236Z';
    return depth(ctx, 3, `<path d="M6 236V470M98 236V470" stroke="${P.xinyiDeep}" stroke-width="7"/>`
      + `<rect x="0" y="326" width="104" height="7" rx="2" fill="${P.xinyi}"/><path d="M8 333V372M30 333V372M52 333V372M74 333V372M96 333V372" stroke="${P.xinyiDeep}" stroke-width="2.4"/>`
      + `<rect x="0" y="370" width="104" height="5" fill="${P.xinyiDeep}"/>`
      + `<path d="${roof}" fill="${P.canopyDeep}"/><path d="M40 196H64" stroke="${ref(ctx, 'foilH')}" stroke-width="2.4"/>`
      + `<path d="M-10 236q-6 -6 -2 -11M114 236q6 -6 2 -11" stroke="${ref(ctx, 'foilH')}" stroke-width="1.8" fill="none"/>`
      + `<path d="${Array.from({ length: 9 }, (_, i) => `M${f1(44 + i * 2)} 198L${f1(4 + i * 11.5)} 234`).join('')}" stroke="${P.canopyMid}" stroke-width="1.2" opacity=".8"/>`
      + `<path d="M0 326.6h104" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`
      + `<rect x="46" y="236" width="12" height="16" rx="2" fill="${C.lampHot}"/>` + softEllipse(ctx, 52, 246, 14, 12, 'lamp', 0.3),
    `<path d="${roof}"/><rect x="0" y="236" width="104" height="139"/>`);
  })();
  const pondD = `M-40 ${GUTTER_Y + 30}C60 ${GUTTER_Y + 10} 300 ${GUTTER_Y + 10} ${PAGE_W + 40} ${GUTTER_Y + 30}V${FLOOR_BOTTOM}H-40Z`;
  const lily = (x: number, y: number, s: number) => `M${x} ${y}m${-10 * s} 0a${10 * s} ${4.4 * s} 0 1 0 ${10 * s} ${-4.4 * s}L${x} ${y}Z`;
  const lilies = `<path d="${lily(150, 552, 1.3)}${lily(176, 566, 1)}${lily(300, 600, 1.4)}${lily(60, 620, 1.2)}${lily(340, 420, 0.9)}${lily(110, 410, 0.8)}" fill="${P.lily}"/>`
    + `<path d="M144 544q4 -8 0 -12q-5 3 -3 11zM296 592q4 -8 0 -12q-5 3 -3 11z" fill="${P.lotus}"/>`;
  // The stepping stone (Mocha's `stone`, its top at (112, 528))
  const stone = depth(ctx, 3, `<ellipse cx="112" cy="536" rx="26" ry="10" fill="${P.paverDeep}"/><ellipse cx="112" cy="531" rx="24" ry="8" fill="${P.paver}"/>`
    + `<path d="M96 528q14 -6 30 -2" stroke="${C.cutRim}" stroke-width="1.2" opacity=".4" fill="none"/>`, `<ellipse cx="112" cy="534" rx="26" ry="11"/>`)
    + `<path d="M84 544q28 8 56 0" stroke="${C.vellum}" stroke-width="1.2" fill="none" opacity=".5"/>`;
  const floor = floorPage(ctx, lawnFloor(ctx, 108) + water(ctx, pondD, 109, { moon: [222, 560] }) + lilies
    + pools(ctx, [[52, GUTTER_Y + 40, 80, 20], [220, 560, 120, 40, 'moon']])
    + fireflies(ctx, 120, 400, 240, 200, 10, 110));
  return parkDefs(ctx) + standingPage(ctx, back + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'lampWashP')}"/>`)
    + floor + reeds(ctx, 356, 452, 70, 111) + reeds(ctx, 380, 470, 60, 112) + pavilion + stone + bookCues(ctx) + block();
};

// ——— 2-6 「畫畫的阿伯」 (spread) ———

/** A painter's dab of colour, as a short stroke. */
const dab = (x: number, y: number, w: number, color: string, a = 0) => `<path d="M${x} ${y}q${f1(w / 2)} -3 ${w} 0" stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none" transform="rotate(${a} ${x} ${y})" opacity=".9"/>`;

/**
 * The painter's canvas (2-6): the park by night painted in gouache, the corners where the three
 * flaps were cut out of it left as bare primed canvas. Drawn at (x, y), w × h.
 */
function paintedCanvas(ctx: KitCtx, x: number, y: number, w: number, h: number): string {
  const id = ctx.id('canvasClip');
  const paint = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mixHex(T.navyDeep, P.canopyFar, 0.4)}"/>`
    + `<circle cx="${x + w * 0.74}" cy="${y + h * 0.22}" r="9" fill="${C.moon}"/>`
    + `<path d="M${x} ${y + h * 0.62}Q${x + w * 0.3} ${y + h * 0.4} ${x + w * 0.55} ${y + h * 0.56}T${x + w} ${y + h * 0.5}V${y + h}H${x}Z" fill="${P.canopyNear}"/>`
    + `<path d="M${x} ${y + h * 0.8}Q${x + w * 0.5} ${y + h * 0.7} ${x + w} ${y + h * 0.82}V${y + h}H${x}Z" fill="${P.lawnLight}"/>`
    + dab(x + 12, y + h * 0.5, 14, P.canopyLit) + dab(x + w * 0.5, y + h * 0.58, 12, P.canopyLit, -10) + dab(x + w * 0.3, y + h * 0.86, 18, P.lilyLight)
    + `<circle cx="${x + w * 0.2}" cy="${y + h * 0.3}" r="1.6" fill="${P.firefly}"/><circle cx="${x + w * 0.42}" cy="${y + h * 0.18}" r="1.4" fill="${P.firefly}"/><circle cx="${x + w * 0.6}" cy="${y + h * 0.36}" r="1.4" fill="${P.firefly}"/>`;
  return depth(ctx, 3, `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" fill="${P.plank}"/>`
    + `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${id})">${paint}</g>`
    + `<path d="M${x - 3} ${y - 2.4}h${w + 6}" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}"/>`);
}

/**
 * 2-6, the centrefold: the painter's corner of the park. The left page is the meadow by the lamp
 * (`lamp`, its top at (40, 300)) and the easel (`easel`, its top at (150, 262)) holding the canvas;
 * a stream runs down the floor page by the spine, the gap the painted bridge pops up over. The right
 * page is the path up to the painter: his big striped parasol (`parasol`, its top at (300, 320)),
 * his stool at the path's end (he sits at (326, 484)), his paint box and jars, and the tree at the
 * page's edge the squirrel is shooed up to (372, 226). The spine's crease is drawn live (`spine`).
 */
const painterSpread: BackdropDraw = (ctx) => {
  const back = parkSky(ctx, [262, 54, 15], 226, 15) + farWoods(ctx, 244, 121)
    + `<rect x="-20" y="258" width="${PAGE_W + 40}" height="${GUTTER_Y - 258}" fill="${P.canopyFar}"/>`
    + crown(ctx, 70, 300, 40, 122, P.canopyMid, { lit: 0.3 })
    + hedge(ctx, -20, PAGE_W + 20, GUTTER_Y + 2, 24, 123)
    + trunk(ctx, 372, 150, GUTTER_Y + 4, 30, 124, [[-40, 70, 12]])
    + crown(ctx, 360, 140, 64, 125, P.canopyMid, { lit: 0.32 }) + crown(ctx, 396, 196, 40, 126, P.canopyNear, { lit: 0.38 })
    + canopy(ctx, -20, 170, 44, 127, P.canopyMid, { amp: 20, step: 40, z: 2 }) + canopy(ctx, -20, 100, 20, 128, P.canopyNear, { amp: 16, step: 34, z: 3 })
    + fireflies(ctx, 20, 150, 340, 190, 18, 129);
  // The easel: three legs, a ledge, the canvas on it; its top (Mocha's `easel`) at (150, 262)
  const easel = depth(ctx, 3, `<path d="M150 262L112 478M150 262L188 478M150 262L156 470" stroke="${P.plankDeep}" stroke-width="4" stroke-linecap="round"/>`
    + `<rect x="92" y="390" width="112" height="6" rx="2" fill="${P.plank}"/><rect x="140" y="258" width="20" height="8" rx="2" fill="${P.plankLight}"/>`, `<path d="M150 262L112 478L188 478Z"/>`)
    + paintedCanvas(ctx, 98, 270, 102, 118);
  // The parasol: a striped canopy on its pole, its top (Mocha's `parasol`) at (300, 320)
  const parasol = (() => {
    const can = 'M244 350Q252 322 300 316Q348 322 356 350Q340 344 328 350Q314 344 300 350Q286 344 272 350Q258 344 244 350Z';
    let stripes = '';
    for (let i = 0; i < 4; i++) stripes += `<path d="M300 316L${258 + i * 28} 350L${272 + i * 28} 350Z" fill="${P.parasolCream}"/>`;
    const cid = ctx.id('parasolClip');
    return `<path d="M300 320V484" stroke="${C.printDark}" stroke-width="3"/>`
      + depth(ctx, 3, `<path d="${can}" fill="${P.parasol}"/><clipPath id="${cid}"><path d="${can}"/></clipPath><g clip-path="url(#${cid})">${stripes}</g>`
        + `<path d="M252 334Q300 318 348 334" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".35"/><circle cx="300" cy="316" r="3" fill="${P.parasolCream}"/>`, `<path d="${can}"/>`);
  })();
  // His paint box and jars by the stool
  const box = depth(ctx, 3, `<rect x="340" y="452" width="40" height="22" rx="2" fill="${P.plank}"/><rect x="340" y="448" width="40" height="6" rx="2" fill="${P.plankLight}"/>`
    + `<circle cx="350" cy="458" r="3" fill="${P.parasol}"/><circle cx="360" cy="458" r="3" fill="${P.waterLight}"/><circle cx="370" cy="458" r="3" fill="${P.lilyLight}"/>`, `<rect x="340" y="448" width="40" height="26"/>`)
    + depth(ctx, 3, `<rect x="230" y="456" width="12" height="16" rx="2" fill="${C.glassine}"/><path d="M234 444l2 14" stroke="${P.plankDeep}" stroke-width="2"/>`, `<rect x="230" y="456" width="12" height="16"/>`);
  // The stream down the left page by the spine (the gap the painted bridge spans, 152–176)
  const stream = `M140 ${GUTTER_Y}C150 ${GUTTER_Y + 40} 152 ${GUTTER_Y + 90} 156 ${GUTTER_Y + 130}C162 ${GUTTER_Y + 200} 150 ${GUTTER_Y + 250} 136 ${FLOOR_BOTTOM}H196C188 ${GUTTER_Y + 250} 186 ${GUTTER_Y + 200} 180 ${GUTTER_Y + 130}C176 ${GUTTER_Y + 90} 170 ${GUTTER_Y + 40} 162 ${GUTTER_Y}Z`;
  const floor = floorPage(ctx, lawnFloor(ctx, 131) + water(ctx, stream, 132)
    + `<path d="M196 ${GUTTER_Y + 40}C240 ${GUTTER_Y + 50} 300 ${GUTTER_Y + 44} ${PAGE_W + 30} ${GUTTER_Y + 50}V${GUTTER_Y + 70}C300 ${GUTTER_Y + 64} 240 ${GUTTER_Y + 70} 196 ${GUTTER_Y + 60}Z" fill="${ref(ctx, 'paverG')}" opacity=".8"/>`
    + pools(ctx, [[40, GUTTER_Y + 40, 80, 22], [300, GUTTER_Y + 60, 110, 30, 'moon']])
    + fireflies(ctx, 0, 540, 390, 100, 8, 133));
  return parkDefs(ctx) + standingPage(ctx, back + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'lampWashP')}"/>`)
    + floor + easel + parasol + box + parkLamp(ctx, 40, 300, 478) + bookCues(ctx) + block();
};

export const C2_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'c2/xinyi-car': xinyiCar,
  'c2/bandshell': bandshell,
  'c2/bridge': bridge,
  'c2/tree': tree,
  'c2/pond': pond,
  'c2/painter-spread': painterSpread,
};

// ——— Chapter 2's parts ———

/**
 * 2-1's commuter's long umbrella (a pushable, C3): a navy folded umbrella with a crook handle.
 * Leaning on the bench while he sleeps (`onPerch`, local origin at the fall path's start), tipping
 * (`falling`), and lying flat across the gap between the car and the platform (`landed`, origin
 * at the gap: it reaches the doorway and the platform's edge).
 */
const umbrella: PartSource = {
  preset: 'pushable',
  states: ['onPerch', 'falling', 'landed'],
  box: { x: -52, y: -48, w: 104, h: 96 },
  draw(ctx, state) {
    // Drawn lying along +x, the tip at -44 and the crook at +40; then turned for the state
    const canopyD = 'M-44 0L-30 -4.6Q-4 -7.6 22 -5L30 -3.4V3.4L22 5Q-4 7.6 -30 4.6Z';
    const body = depth(ctx, 3, `<path d="${canopyD}" fill="${C.nightCard}"/>`
      + `<path d="M-30 -1.4Q-4 -3.4 22 -2.2M-26 2.2Q0 3.8 22 2.6" stroke="${C.nightCardDeep}" stroke-width="1.1" fill="none" opacity=".8"/>`
      + `<path d="M-16 -6.6L-12 6.4M2 -7L5 7" stroke="${C.nightInk}" stroke-width=".9" opacity=".5"/>`
      + `<rect x="-6" y="-7.6" width="7" height="15.2" rx="2" fill="${C.washiPink}"/>`
      + `<path d="M30 0H38" stroke="${C.printDark}" stroke-width="3" stroke-linecap="round"/>`
      + `<path d="M38 0q8 0 8 7t-7 7" stroke="${C.kraftDark}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
      + `<path d="M-44 0h-4" stroke="${C.printDark}" stroke-width="2" stroke-linecap="round"/>`, `<path d="${canopyD}"/>`);
    const turn = state === 'landed' ? 0 : state === 'falling' ? -40 : -74;
    const shadow = state === 'landed' ? softEllipse(ctx, 0, 9, 46, 3, 'shadow', 0.4) : '';
    // Leaning, its tip rests on the platform and the crook hooks the bench's arm
    const at = state === 'onPerch' ? 'translate(-4 22)' : '';
    return shadow + `<g transform="${at} rotate(${turn})">${body}</g>`;
  },
};

/**
 * 2-2's bandshell curtain (a `lift` the trap-door plate raises; event-driven, so it wears no
 * marigold). Down, the red velvet hangs from the proscenium to the stage (local origin at its
 * foot, the hit area's bottom centre); up, it is gathered into a swag under the proscenium
 * (origin at the hit area's top: `MoverView` slides it there), and the stage behind shows.
 */
const curtain: PartSource = {
  preset: 'lift',
  states: ['down', 'up'],
  box: { x: -50, y: -170, w: 100, h: 214 },
  draw(ctx, state) {
    if (state === 'up') {
      const swag = 'M-44 0H44V10Q30 34 0 30Q-30 34 -44 10Z';
      return depth(ctx, 3, `<path d="${swag}" fill="${C.peony}"/>`
        + `<path d="M-36 8Q-20 26 0 24Q20 26 36 8" stroke="${C.peonyDeep}" stroke-width="2" fill="none"/>`
        + `<path d="M-40 4Q-22 16 0 15Q22 16 40 4" stroke="${C.peonyLight}" stroke-width="1.4" fill="none" opacity=".8"/>`
        + `<path d="M-46 -2H46" stroke="${C.printDark}" stroke-width="4" stroke-linecap="round"/>`, `<path d="${swag}"/>`);
    }
    const drape = 'M-44 -160H44V-6Q40 2 30 0Q20 4 10 0Q0 4 -10 0Q-20 4 -30 0Q-40 2 -44 -6Z';
    let folds = '';
    for (let i = 0; i < 8; i++) {
      const x = -38 + i * 11;
      folds += `<path d="M${f1(x)} -156Q${f1(x + 3)} -80 ${f1(x)} -4" stroke="${i % 2 ? C.peonyDeep : C.peonyLight}" stroke-width="${i % 2 ? 2.4 : 1.4}" fill="none" opacity="${i % 2 ? 0.7 : 0.55}"/>`;
    }
    return softEllipse(ctx, 0, 4, 46, 4, 'shadow', 0.4)
      + depth(ctx, 3, `<path d="${drape}" fill="${C.peony}"/>${folds}`
        + `<path d="M-46 -162H46" stroke="${C.printDark}" stroke-width="4" stroke-linecap="round"/>`, `<path d="${drape}"/>`);
  },
};

/**
 * 2-2's trap-door plate (a weight `button` on the stage's front edge): a round wooden lid with an
 * iron ring, flush with the boards (`up`), and pushed down a little under his weight (`down`, darker,
 * the ring tipped). Local origin at its hit centre, the plate's middle.
 */
const trapPlate: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -32, y: -14, w: 64, h: 28 },
  draw(ctx, state) {
    const down = state === 'down';
    const lid = `<ellipse cx="0" cy="0" rx="26" ry="8"/>`;
    return depth(ctx, down ? 1 : 2, `<ellipse cx="0" cy="0" rx="26" ry="8" fill="${down ? C.kraftDark : C.kraft}"/>`
      + `<path d="M-22 -2.6H22M-24 1.6H24" stroke="${C.kraftFiber}" stroke-width=".9" opacity=".55"/>`
      + `<ellipse cx="0" cy="0" rx="26" ry="8" fill="none" stroke="${C.kraftFiber}" stroke-width="1.4"/>`
      + `<ellipse cx="${down ? 2 : 0}" cy="${down ? 1 : 0}" rx="5" ry="${down ? 1.6 : 2.2}" fill="none" stroke="${C.printDark}" stroke-width="1.6"/>`, lid);
  },
};

/**
 * 2-5's lily-pad wheel (a `wheel`; the pond's ferry): a disk of pond water ringed by the marigold
 * knurled rim (its grip), the great lily pad at its `west` place (local (-56, 0)) with a lotus bud,
 * and a few small pads and ripples. The view turns each state's bitmap by the state's angle (90° a
 * step, clockwise: west → north → east → south), so every state draws the disk unturned. Pivot at
 * the centre (206, 478), radius 76.
 */
const lilyPad: PartSource = {
  preset: 'wheel',
  // Every state draws the same unturned disk (the view turns it), so one bitmap serves all four
  // (a state not listed draws the first): a quarter of the payload (#115)
  states: ['west'],
  pivot: [0, 0],
  box: { x: -90, y: -90, w: 180, h: 180 },
  draw(ctx) {
    const r = 76;
    const pad = 'M-56 0m-22 0a22 22 0 1 0 22 -22L-56 0Z';
    const small = (x: number, y: number, s: number) => `<path d="M${x} ${y}m${-9 * s} 0a${9 * s} ${9 * s} 0 1 0 ${9 * s} ${-9 * s}L${x} ${y}Z" fill="${P.lily}" opacity=".9"/>`;
    // The pond's own water (#115: the chapter's pond), a glassine sheen and ripples on it
    const water = `<circle r="${r - 6}" fill="${P.water}"/><circle r="${r - 6}" fill="${P.waterLight}" opacity=".25"/>`
      + `<path d="M-60 -20L20 -66L34 -58L-52 -8Z" fill="${C.glassine}" opacity=".18"/><path d="M-40 40L50 -16L56 -6L-30 50Z" fill="${C.glassine}" opacity=".12"/>`
      + `<path d="M-20 -40q10 -4 20 0M10 30q12 -4 24 0M-30 34q8 -3 16 0M24 -22q8 -3 16 0" stroke="${C.vellum}" stroke-width="1.2" fill="none" opacity=".55"/>`
      + small(30, -38, 1) + small(40, 28, 0.8) + small(-6, 46, 0.7);
    const leaf = depth(ctx, 2, `<path d="${pad}" fill="${P.lilyLight}"/><path d="M-56 0L-74 -8M-56 0L-60 18M-56 0L-40 14M-56 0L-46 -16" stroke="${P.lily}" stroke-width="1.2" opacity=".8"/>`
      + `<path d="M-36 -6q4 -8 0 -14q-6 4 -4 12z" fill="${C.washiPink}"/><path d="M-36 -6q-4 -8 0 -14q6 4 4 12z" fill="${C.peonyLight}" opacity=".8"/>`, `<path d="${pad}"/>`);
    const rim = wheelRim(r, 28);
    return depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/>${water}`
      + `<circle r="${r - 6}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1.4" opacity=".6"/><circle r="${r - 4}" fill="none" stroke="${C.marigoldShine}" stroke-width="1" opacity=".6"/>`, `<path d="${rim}"/>`)
      + leaf;
  },
};

/**
 * 2-1's car doors (a `gate`: 嗶！ opens them, and they stay open). Two steel leaves with tall windows
 * and the line's red band, meeting on a rubber seal under the door lamp, lit red while they are
 * shut (「車門即將關閉。」); open, the leaves are slid into their pockets (only their edges show) and
 * the platform's light spills onto the threshold. Local origin at the hit centre (160, 430); the
 * doorway's floor at local y 40, the lintel at −226.
 */
const doors: PartSource = {
  preset: 'gate',
  states: ['closed', 'open'],
  box: { x: -38, y: -240, w: 76, h: 292 },
  draw(ctx, state) {
    const open = state === 'open';
    const top = -222;
    const foot = 40;
    const leaf = (x0: number, w: number, glass: number) => `<rect x="${x0}" y="${top}" width="${w}" height="${foot - top}" fill="${T.steel}"/>`
      + `<rect x="${x0 + glass}" y="${top + 34}" width="${w - 10}" height="96" rx="5" fill="${mixHex(P.stationTile, T.navy, 0.35)}"/>`
      + `<path d="M${x0 + glass} ${top + 90}L${x0 + glass + 12} ${top + 34}h6L${x0 + glass} ${top + 110}Z" fill="${C.cutRim}" opacity=".18"/>`
      // The line's red band, level with the car wall's (y 236)
      + `<rect x="${x0}" y="-194" width="${w}" height="10" fill="${P.xinyi}"/><rect x="${x0}" y="-183" width="${w}" height="2" fill="${P.xinyiDeep}"/>`
      + `<path d="M${x0 + 3} ${top + 1}h${w - 6}" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`;
    const lamp = open
      ? `<rect x="-8" y="-236" width="16" height="7" rx="3" fill="${C.printDark}"/><rect x="-5" y="-234.5" width="10" height="4" rx="2" fill="${T.steelDeep}"/>`
      : softEllipse(ctx, 0, -232, 12, 8, 'lamp', 0.3) + `<rect x="-8" y="-236" width="16" height="7" rx="3" fill="${C.printDark}"/><rect x="-5" y="-234.5" width="10" height="4" rx="2" fill="${T.lampStop}"/>`;
    const threshold = `<rect x="-30" y="${foot - 2}" width="60" height="5" fill="${T.steelDeep}"/><path d="M-28 ${foot - 1}h56" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`;
    if (open) {
      return softEllipse(ctx, 0, foot - 4, 30, 8, 'lamp', 0.3)
        + depth(ctx, 3, `<rect x="-30" y="${top}" width="5" height="${foot - top}" fill="${T.steel}"/><rect x="25" y="${top}" width="5" height="${foot - top}" fill="${T.steel}"/>`
          + `<path d="M-25 ${top}V${foot}M25 ${top}V${foot}" stroke="${C.printDark}" stroke-width="1.4"/>` + threshold, `<rect x="-30" y="${top}" width="60" height="${foot - top + 3}"/>`)
        + lamp;
    }
    return depth(ctx, 3, leaf(-30, 30, 5) + leaf(0, 30, 5) + `<path d="M0 ${top}V${foot}" stroke="${C.printDark}" stroke-width="2.4"/><path d="M-1.6 ${top}V${foot}" stroke="${T.steelDeep}" stroke-width="1"/>` + threshold,
      `<rect x="-30" y="${top}" width="60" height="${foot - top + 3}"/>`) + lamp;
  },
};

/**
 * Where 2-2's spotlight aims in each state, as a bearing (degrees clockwise from up) from its pivot
 * (176, 540) toward the pool of light: the lawn (`L2`), the trap door (`T`), the stage (`S3`), up in
 * the wings (the 掃地阿伯). The wheel's view turns each state's bitmap a quarter turn per step
 * (lawn 0°, trap 90°, stage 180°, nap 270°), so each state draws its lamp at its bearing less that turn.
 */
export const SPOT_BEARING: Readonly<Record<string, number>> = { lawn: -58, trap: 46, stage: 54, nap: 28 };
const SPOT_TURN: Readonly<Record<string, number>> = { lawn: 0, trap: 90, stage: 180, nap: 270 };

/**
 * 2-2's spotlight (a `wheel`, 轉): a follow-spot on its tripod, seen from above as a disc. The
 * marigold knurled rim is the grip (its one marigold); inside, the lamp's black housing and its
 * barrel aiming at the pool of light, the lens lit warm. Pivot at the centre, radius 30 (rim 34).
 */
const spotlight: PartSource = {
  preset: 'wheel',
  states: ['lawn', 'trap', 'stage', 'nap'],
  pivot: [0, 0],
  box: { x: -44, y: -44, w: 88, h: 88 },
  draw(ctx, state) {
    const r = 30;
    const rim = wheelRim(r, 18);
    const aim = (SPOT_BEARING[state] ?? 0) - (SPOT_TURN[state] ?? 0);
    const lamp = `<g transform="rotate(${aim})">`
      + `<rect x="-7" y="-22" width="14" height="26" rx="3" fill="${C.printDark}"/><rect x="-8.5" y="-25" width="17" height="6" rx="2" fill="${T.steelDeep}"/>`
      + `<ellipse cx="0" cy="-25" rx="6.5" ry="2.2" fill="${C.lampHot}"/>` + softEllipse(ctx, 0, -27, 7, 5, 'lamp', 0.55)
      + `<path d="M-5 -14h10M-5 -8h10" stroke="${T.steel}" stroke-width="1" opacity=".6"/></g>`;
    return depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/>`
      + `<circle r="${r - 6}" fill="${mixHex(C.printDark, T.steelDeep, 0.35)}"/><circle r="${r - 6}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1.2" opacity=".6"/>`
      + `<circle r="${r - 4}" fill="none" stroke="${C.marigoldShine}" stroke-width="1" opacity=".6"/>`
      + `<circle r="9" fill="${T.steelDeep}"/>`, `<path d="${rim}"/>`)
      + lamp;
  },
};

// ——— 2-6's painted flaps: a pop-up inside the pop-up ———

/** The fold of an open flap (`FlapView`: closed 1, open −0.35 about the hinge). */
const OPEN_FOLD = -0.35;
/** The flap's marigold dog-ear corner (`FlapView`: 22 units). */
const EAR = 22;

/**
 * A painted flap on 2-6 (a `flap`, 翻): closed, a patch of the painter's canvas with what he painted
 * on it (`face`), taped down, its marigold dog-ear the grip; open, the card folds up over its hinge
 * (its kraft back shows) and the painted thing **pops up as real paper** (`pop`, drawn in page units).
 * The view draws the open state folded (`scaleY −0.35` about the hinge), so the pop-up is drawn
 * through the inverse of that fold: it stands where `pop` puts it, and grows out of the hinge line as
 * the flap lifts. `origin` is the card's top-left on the page (the hit's corner + 4).
 */
function popFlap(hit: readonly [number, number, number, number], face: (w: number, h: number) => string, pop: (ctx: KitCtx) => string, popBox: { x: number; y: number; w: number; h: number }): PartSource {
  const [hx, hy, hw, hh] = hit;
  const { w, h } = flapSize(hw, hh);
  const [ox, oy] = [hx + 4, hy + 4];
  const card = `M0 0H${w}V${h - EAR}L${w - EAR} ${h}H0Z`;
  const ear = `M${w} ${h - EAR}L${w - EAR} ${h}L${f1(w - EAR * 0.35)} ${f1(h + EAR * 0.42)}Z`;
  // The page-unit box of the pop-up, in the flap's local space (through the inverse fold)
  const ly = (y: number) => (y - oy) / OPEN_FOLD;
  const yA = ly(popBox.y), yB = ly(popBox.y + popBox.h);
  const top = Math.min(-4, yA, yB), bottom = Math.max(h + 16, yA, yB);
  const left = Math.min(-4, popBox.x - ox), right = Math.max(w + 12, popBox.x + popBox.w - ox);
  return {
    preset: 'flap',
    states: ['closed', 'open'],
    hinge: 0,
    box: { x: f1(left), y: f1(top), w: f1(right - left), h: f1(bottom - top) },
    draw(ctx, state) {
      const clip = ctx.id(`popClip${state}`);
      const open = state === 'open';
      const body = open ? kraftBack(w, h, Math.round(hx + hy))(ctx) : face(w, h);
      const cardArt = `<clipPath id="${clip}"><path d="${card}"/></clipPath>`
        + depth(ctx, 3, `<g clip-path="url(#${clip})">${body}</g><path d="M2 1.2H${w - 2}" stroke="${C.cutRim}" stroke-width="1" opacity=".45"/>`, `<path d="${card}"/>`)
        + depth(ctx, 4, `<path data-grip="ear" d="${ear}" fill="${ref(ctx, 'tabG')}"/><path d="M${w - EAR} ${h}L${f1(w - EAR * 0.35)} ${f1(h + EAR * 0.42)}" stroke="${C.marigoldEdge}" stroke-width="1" opacity=".6"/>`, `<path d="${ear}"/>`);
      if (!open) return cardArt;
      // Page units → the flap's local space: x − ox, (y − oy) / −0.35
      const k = (n: number) => Math.round(n * 10000) / 10000;
      return `<g transform="matrix(1 0 0 ${k(1 / OPEN_FOLD)} ${-ox} ${k(oy / -OPEN_FOLD)})">${pop(ctx)}</g>` + cardArt;
    },
  };
}

/** A patch of the painter's canvas: primed cream, a gouache wash, a strip of washi tape on its top edge. */
function canvasPatch(w: number, h: number, wash: string, paint: string): string {
  return `<rect width="${w}" height="${h}" fill="${P.canvas}"/><rect x="3" y="3" width="${w - 6}" height="${h - 6}" fill="${wash}" opacity=".35"/>${paint}`
    + `<rect x="${w / 2 - 9}" y="-2" width="18" height="7" fill="${C.washiCeladon}" opacity=".78" transform="rotate(-4 ${w / 2} 2)"/>`;
}

/** 2-6's `flapA`: a painted bridge over the stream; open, a paper footbridge pops up across the gap (152–176). */
const canvasBridge = popFlap([120, 444, 56, 56],
  (w, h) => canvasPatch(w, h, P.water,
    `<path d="M4 ${h - 8}Q${w / 2} ${h - 26} ${w - 4} ${h - 8}" stroke="${P.xinyi}" stroke-width="3.4" fill="none"/>`
    + `<path d="M8 ${h - 9}V${h - 16}M${w / 2} ${h - 17}V${h - 24}M${w - 8} ${h - 9}V${h - 16}" stroke="${P.xinyiDeep}" stroke-width="1.6"/>`
    + `<path d="M3 ${h - 4}q10 -3 20 0t20 0" stroke="${C.vellum}" stroke-width="1.2" fill="none" opacity=".7"/>`),
  (ctx) => {
    // The footbridge: a planked deck on an arch from the meadow's edge to the path's, red rails
    const deck = 'M136 470Q164 458 192 470V478Q164 467 136 478Z';
    const arch = 'M140 478Q164 466 188 478L184 500Q164 482 144 500Z';
    let planks = '';
    for (let x = 142; x < 190; x += 6) planks += `M${x} ${f1(470 - Math.sin(((x - 136) / 56) * Math.PI) * 9)}v8`;
    return softEllipse(ctx, 164, 500, 30, 4, 'shadow', 0.4)
      + depth(ctx, 3, `<path d="${arch}" fill="${P.plankDeep}"/><path d="${deck}" fill="${P.plank}"/><path d="${planks}" stroke="${P.plankDeep}" stroke-width=".9" opacity=".6"/>`
        + `<path d="M138 448Q164 436 190 448" stroke="${P.xinyi}" stroke-width="3" fill="none"/><path d="M140 448V470M164 442V462M188 448V470" stroke="${P.xinyiDeep}" stroke-width="2"/>`
        + `<path d="M136 470.6Q164 458.6 192 470.6" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".5"/>`, `<path d="${deck}${arch}"/>`);
  },
  { x: 128, y: 432, w: 72, h: 76 });

/** 2-6's `flapB`: a painted branch; open, a leafy paper branch pops up from the easel's top to the parasol's. */
const canvasBranch = popFlap([196, 262, 56, 56],
  (w, h) => canvasPatch(w, h, mixHex(T.navyDeep, P.canopyFar, 0.4),
    `<path d="M2 ${h * 0.4}Q${w * 0.5} ${h * 0.25} ${w - 2} ${h * 0.6}" stroke="${P.trunkLit}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`
    + `<path d="${leafD(w * 0.3, h * 0.34, -1.2, 9)}${leafD(w * 0.55, h * 0.36, 1.4, 9)}${leafD(w * 0.75, h * 0.48, -0.9, 8)}" fill="${P.lilyLight}"/>`),
  (ctx) => {
    const limb = 'M150 266Q220 248 300 314L296 320Q222 260 152 274Z';
    let leaves = '';
    const r = seeded(141);
    for (let i = 0; i < 12; i++) {
      const t = 0.1 + (i / 12) * 0.85;
      const x = (1 - t) * (1 - t) * 151 + 2 * t * (1 - t) * 221 + t * t * 298;
      const y = (1 - t) * (1 - t) * 270 + 2 * t * (1 - t) * 254 + t * t * 317;
      leaves += leafD(x, y, (i % 2 ? -1 : 1) * (1.1 + r() * 0.5) - (i % 2 ? 0.3 : 0), 10 + r() * 5);
    }
    return depth(ctx, 3, `<path d="${limb}" fill="${P.trunk}"/><path d="M152 268Q220 250 298 315" stroke="${P.trunkLit}" stroke-width="1.2" fill="none" opacity=".7"/>`
      + `<path d="${leaves}" fill="${P.canopyFront}"/><path d="${leaves}" fill="none" stroke="${P.canopyLit}" stroke-width=".6" opacity=".5"/>`, `<path d="${limb}"/><path d="${leaves}"/>`);
  },
  { x: 140, y: 236, w: 170, h: 96 });

/** 2-6's `flapC`: the canvas's portrait corner (the painted lawn); open, it folds up off a painted path (the 土地公 sweeps at its end). */
const canvasPortrait = popFlap([108, 330, 56, 56],
  (w, h) => canvasPatch(w, h, P.lawnLight,
    `<path d="M0 ${h * 0.4}Q${w * 0.5} ${h * 0.28} ${w} ${h * 0.42}V0H0Z" fill="${P.canopyNear}"/>`
    + `<path d="M6 ${h * 0.75}q8 -4 14 0M22 ${h * 0.62}q8 -4 14 0" stroke="${P.lily}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    + `<circle cx="${w * 0.3}" cy="${h * 0.2}" r="1.6" fill="${P.firefly}"/>`),
  () => '',
  { x: 112, y: 334, w: 40, h: 34 });

export const C2_PARTS: Readonly<Record<string, PartSource>> = {
  'c2/doors': doors,
  'c2/umbrella': umbrella,
  'c2/spotlight': spotlight,
  'c2/canvas-bridge': canvasBridge,
  'c2/canvas-branch': canvasBranch,
  'c2/canvas-portrait': canvasPortrait,
  'c2/curtain': curtain,
  'c2/plate': trapPlate,
  'c2/lily-pad': lilyPad,
};

// ——— 2-6's 淘氣: the painting becomes Mocha ———

/**
 * The portrait of Mocha (2-6's 淘氣 「把三片畫都翻開，畫出摩卡」): with all three flaps open, the
 * painter's canvas shows Mocha in gouache instead of the park — his grey tabby head with its
 * stripes, green eyes, pink nose and blue collar, a smug little smile, on a warm wash with a few
 * firefly dabs. A cut-out placed on the canvas's top-left (98, 270), 102 × 118, shown only then.
 */
const mochaPortrait: CutoutSource = {
  chapter: 2,
  box: { x: -4, y: -4, w: 110, h: 126 },
  draw(ctx) {
    const [w, h] = [102, 118];
    const head = 'M16 74Q12 40 30 30L26 8L44 24Q51 22 58 24L76 8L72 30Q90 40 86 74Q82 98 51 100Q20 98 16 74Z';
    const clip = ctx.id('portraitClip');
    const paint = `<rect width="${w}" height="${h}" fill="${mixHex(C.peonyHeart, P.canvas, 0.45)}"/>`
      + `<path d="M0 ${h * 0.7}Q${w / 2} ${h * 0.6} ${w} ${h * 0.72}V${h}H0Z" fill="${P.lilyLight}" opacity=".7"/>`
      + dab(8, 14, 16, P.lotus, 8) + dab(70, 112, 22, P.lily, -6) + dab(4, 104, 18, P.canopyLit)
      + `<circle cx="88" cy="16" r="2" fill="${P.firefly}"/><circle cx="12" cy="40" r="1.6" fill="${P.firefly}"/>`
      // Mocha: the head, his stripes, eyes, nose, smile, collar with its tag
      + `<path d="${head}" fill="${S.catFur}"/><path d="M30 30L28 14L40 26ZM72 30L74 14L62 26Z" fill="${S.catNose}" opacity=".55"/>`
      + `<path d="M51 26V40M42 28l2 12M60 28l-2 12M18 60h12M18 70h11M84 60H72M84 70H73" stroke="${S.catFurDark}" stroke-width="3.2" stroke-linecap="round"/>`
      + `<path d="M30 80Q51 96 72 80Q66 98 51 98Q36 98 30 80Z" fill="${S.catBelly}"/>`
      + `<ellipse cx="37" cy="58" rx="6.5" ry="7.5" fill="${S.catEye}"/><ellipse cx="65" cy="58" rx="6.5" ry="7.5" fill="${S.catEye}"/>`
      + `<path d="M37 52v12M65 52v12" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/><circle cx="39" cy="55" r="1.4" fill="${C.cutRim}"/><circle cx="67" cy="55" r="1.4" fill="${C.cutRim}"/>`
      + `<path d="M47 70h8l-4 4z" fill="${S.catNose}"/><path d="M51 74q-4 6 -10 3M51 74q5 5 11 1" stroke="${C.ink}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
      + `<path d="M26 72l-14 -2M26 77l-13 3M76 72l14 -2M76 77l13 3" stroke="${C.cutRim}" stroke-width=".9" opacity=".8"/>`
      + `<path d="M24 92Q51 108 78 92" stroke="${S.catCollar}" stroke-width="6" fill="none"/><circle cx="51" cy="104" r="4" fill="${ref(ctx, 'foil')}"/>`
      // Brush marks over the fur, and his signature: a paw
      + `<path d="M24 46q6 -4 10 0M68 44q6 -4 10 0M44 86q6 3 14 0" stroke="${mixHex(S.catFur, C.cutRim, 0.3)}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`
      + `<g fill="${P.parasol}" opacity=".85"><circle cx="90" cy="104" r="3"/><circle cx="85" cy="98" r="1.4"/><circle cx="89" cy="96" r="1.4"/><circle cx="93" cy="97" r="1.4"/><circle cx="96" cy="101" r="1.4"/></g>`;
    return `<clipPath id="${clip}"><rect width="${w}" height="${h}"/></clipPath><g clip-path="url(#${clip})">${paint}</g>`
      + `<rect width="${w}" height="${h}" fill="none" stroke="${P.plank}" stroke-width="1.2" opacity=".6"/>`;
  },
};

export const C2_CUTOUTS: Readonly<Record<string, CutoutSource>> = {
  'c2/mocha-portrait': mochaPortrait,
};
