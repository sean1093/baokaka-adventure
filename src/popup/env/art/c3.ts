import { POPUP as C, POPUP_CAMPUS as K, POPUP_STAGE as S, POPUP_STATION as T, mixHex } from '../../../art/palette';
import { depth, f1, pageBlock, pinholes, ref, scallopBand, seeded, skyline, softEllipse, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorWiden } from '../../view/geometry';
import { vFold } from '../../view/art/placeholders';
import type { BackdropDraw, CutoutSource, PartSource } from '../sources';
import { carDoors } from './c2';
import { FLOOR_RECT, bookCues, calmMoon, floorPage, lin, paperFibres, popFlap, rad, shushuPeek, standingPage, vellumWindow } from './common';

/**
 * Chapter 3 (台灣大學, 01:20) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#116) drew placeholder bikes and shelves; the
 * chapter's art issue (#117) draws the palette kit, the six backdrops and every part.
 *
 * **The kit** (bible § 6 row 3, `POPUP_CAMPUS`): lake blue and palm green, with the warm amber of
 * the library's lamps and windows as the one accent. The signature materials are the **glassine
 * lake** (醉月湖, the moon's reflection in foil under it) and **kraft books**. Reusable cut-outs: the
 * royal palm as a tall thin flat (`royalPalm`, in rows that recede for 椰林大道's parallax), the
 * campus lamp (`campusLamp`), the old campus building with its arcade (`campusBuilding`), the
 * azalea hedge (`azaleas`), the lake (`lakeWater`), stacks of books (`bookStack`, `bookRow`).
 */

/** The page block under the floor page (a thick old book). */
const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};

// ——— The palette kit ———

/** The campus's gradient defs, shared by the chapter's backdrops. */
function campusDefs(ctx: KitCtx): string {
  return `<defs>`
    + lin(ctx, 'lakeG', [[0, K.lakeDeep], [0.55, K.lake], [1, mixHex(K.lake, K.lakeLight, 0.35)]])
    + lin(ctx, 'farLakeG', [[0, mixHex(K.lake, K.lakeLight, 0.3)], [1, K.lakeDeep]])
    + lin(ctx, 'palmTrunkG', [[0, K.palmTrunkLit], [0.42, K.palmTrunk], [1, K.palmTrunkDeep]], 'h')
    + lin(ctx, 'stoneG', [[0, K.stone], [1, mixHex(K.stone, K.stoneShade, 0.55)]])
    + lin(ctx, 'stoneR', [[0, K.stoneShade], [1, K.stoneDeep]], 'h')
    + lin(ctx, 'brickG', [[0, K.brickLight], [1, K.brickDeep]])
    + lin(ctx, 'roofG', [[0, K.roofLight], [1, K.roof]])
    + lin(ctx, 'lawnK', [[0, K.lawnDeep], [0.45, K.lawn], [1, K.lawnLight]])
    + lin(ctx, 'paverK', [[0, mixHex(K.paver, C.shadow, 0.4)], [1, K.paverLight]])
    + lin(ctx, 'ironG', [[0, K.ironPostLit], [0.5, K.ironPost], [1, mixHex(K.ironPost, C.shadow, 0.4)]], 'h')
    + lin(ctx, 'woodK', [[0, K.shelfWoodLight], [1, K.shelfWoodDeep]])
    + lin(ctx, 'woodH', [[0, K.shelfWoodLight], [0.5, K.shelfWood], [1, K.shelfWoodDeep]], 'h')
    + lin(ctx, 'deskTop', [[0, mixHex(K.shelfWood, C.shadow, 0.35)], [1, K.shelfWoodLight]])
    + lin(ctx, 'bronzeG', [[0, mixHex(K.bronze, C.cutRim, 0.2)], [1, K.bronzeDeep]])
    + lin(ctx, 'lampWashK', [[0, C.lampAmber, 0], [1, C.lampAmber, 0.12]])
    + lin(ctx, 'mistK', [[0, K.palmFar, 0], [1, mixHex(K.palmFar, C.vellum, 0.3), 0.5]])
    + lin(ctx, 'avenueG', [[0, mixHex(K.paver, C.shadow, 0.55)], [1, mixHex(K.paver, C.shadow, 0.2)]])
    // 3-1's car and station
    + lin(ctx, 'carWallK', [[0, T.carCeiling], [0.5, mixHex(T.carWall, T.navy, 0.08)], [1, mixHex(T.carWallShade, T.navy, 0.16)]])
    + lin(ctx, 'tileWallK', [[0, mixHex(T.carWall, T.navy, 0.34)], [1, mixHex(T.carWall, T.navy, 0.16)]])
    + lin(ctx, 'steelK', [[0, T.steelDeep], [0.4, T.steel], [0.6, C.cutRim], [1, T.steelDeep]], 'h')
    + lin(ctx, 'prioK', [[0, T.priority], [1, T.priorityDeep]])
    + lin(ctx, 'seatK', [[0, mixHex(K.songshan, T.carWall, 0.25)], [1, K.songshanDeep]])
    + rad(ctx, 'warmPoolK', [[0, C.lamp, 0.42], [0.6, C.lampAmber, 0.12], [1, C.lampAmber, 0]])
    + rad(ctx, 'moonPoolK', [[0, C.vellum, 0.22], [1, C.vellum, 0]])
    + rad(ctx, 'readGlow', [[0, C.lamp, 0.5], [0.5, C.lampAmber, 0.16], [1, C.lampAmber, 0]])
    + `</defs>`;
}

/** Light pools on the floor page: warm under lamps and windows, cool where the moon falls. */
const pools = (ctx: KitCtx, list: readonly (readonly [number, number, number, number, ('warm' | 'moon')?])[]) =>
  list.map(([cx, cy, rx, ry, tone]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ref(ctx, tone === 'moon' ? 'moonPoolK' : 'warmPoolK')}"/>`).join('');

/** A palm's tone at a depth: far (bluest, darkest) to near (greenest, moonlit). */
type PalmTone = 'far' | 'mid' | 'near';
const PALM: Readonly<Record<PalmTone, { frond: string; back: string; trunk: string; lit: number }>> = {
  far: { frond: K.palmFar, back: mixHex(K.palmFar, C.shadow, 0.3), trunk: mixHex(K.palmTrunkDeep, K.palmFar, 0.5), lit: 0.18 },
  mid: { frond: K.palm, back: K.palmDeep, trunk: K.palmTrunk, lit: 0.32 },
  near: { frond: K.palmNear, back: K.palm, trunk: K.palmTrunk, lit: 0.45 },
};

/**
 * One pinnate frond as a paper cut: the rib from (x, y) at angle `a` (radians), `len` long, drooping
 * by `droop`, with its leaflets as a serrated comb hanging under it (gravity and the rib's lower
 * side). Returns the cut shape and the rib line.
 */
function frond(x: number, y: number, a: number, len: number, droop: number): { d: string; rib: string } {
  const n = 9;
  const pts: [number, number][] = [];
  const [ux, uy] = [Math.cos(a), Math.sin(a)];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // The rib bends down along its length (a quadratic sag)
    pts.push([x + ux * len * t, y + uy * len * t + droop * len * t * t]);
  }
  let top = `M${f1(x)} ${f1(y)}`;
  for (const [px, py] of pts.slice(1)) top += `L${f1(px)} ${f1(py)}`;
  let comb = '';
  for (let i = n; i >= 1; i--) {
    const [px, py] = pts[i];
    const [qx, qy] = pts[i - 1];
    const [dx, dy] = [px - qx, py - qy];
    const l = Math.hypot(dx, dy) || 1;
    let [nx, ny] = [-dy / l, dx / l];
    if (ny < 0) [nx, ny] = [-nx, -ny];
    const t = i / n;
    const leaf = len * (0.3 - 0.16 * t) * (i % 2 ? 1 : 0.62);
    const [gx, gy] = [nx * 0.55, ny * 0.55 + 0.6];
    const g = Math.hypot(gx, gy);
    comb += `L${f1(px + (gx / g) * leaf)} ${f1(py + (gy / g) * leaf)}L${f1(qx + (px - qx) * 0.3)} ${f1(qy + (py - qy) * 0.3)}`;
  }
  return { d: `${top}${comb}Z`, rib: top };
}

/**
 * A royal palm (椰林大道's 大王椰子) as a tall thin flat (bible § 6 row 3): a smooth grey trunk with
 * its rings, a green crownshaft, and a crown of arching serrated fronds. It stands at `foot`; the
 * crownshaft's top (where the fronds spring, Mocha's seat on 3-2) is at `top`.
 */
function royalPalm(ctx: KitCtx, x: number, foot: number, top: number, { s = 1, tone = 'mid' as PalmTone, seed = 1, z = 2 as 1 | 2 | 3 | 4 } = {}): string {
  const p = PALM[tone];
  const r = seeded(seed);
  const w = 9 * s;
  const shaft = 24 * s;
  const trunkTop = top + shaft;
  // The trunk: a little bulge low down, tapering to the crownshaft
  const trunk = `M${f1(x - w / 2)} ${foot}C${f1(x - w * 0.7)} ${f1(foot - (foot - trunkTop) * 0.3)} ${f1(x - w * 0.36)} ${f1(trunkTop + 20)} ${f1(x - w * 0.36)} ${f1(trunkTop)}`
    + `H${f1(x + w * 0.36)}C${f1(x + w * 0.36)} ${f1(trunkTop + 20)} ${f1(x + w * 0.7)} ${f1(foot - (foot - trunkTop) * 0.3)} ${f1(x + w / 2)} ${foot}Z`;
  let rings = '';
  for (let y = trunkTop + 6 * s; y < foot - 4; y += (5 + r() * 4) * s) rings += `M${f1(x - w * 0.45)} ${f1(y)}h${f1(w * 0.9)}`;
  const cs = `M${f1(x - w * 0.36)} ${f1(trunkTop)}C${f1(x - w * 0.44)} ${f1(trunkTop - shaft * 0.5)} ${f1(x - w * 0.3)} ${f1(top + 2)} ${f1(x - w * 0.2)} ${f1(top)}H${f1(x + w * 0.2)}C${f1(x + w * 0.3)} ${f1(top + 2)} ${f1(x + w * 0.44)} ${f1(trunkTop - shaft * 0.5)} ${f1(x + w * 0.36)} ${f1(trunkTop)}Z`;
  // The fronds: the back ones darker, the front ones in the tone with a moonlit rib
  const cy = top - 3 * s;
  const angles = [-2.95, -2.55, -2.1, -1.75, -1.35, -1.0, -0.55, -0.18, 2.75, 0.4];
  let back = '';
  let front = '';
  let ribs = '';
  angles.forEach((a, i) => {
    const len = (40 + r() * 14) * s * (i >= 8 ? 0.8 : 1);
    const f = frond(x, cy, a + (r() - 0.5) * 0.12, len, 0.5 + r() * 0.35);
    if (i % 3 === 1) back += f.d;
    else {
      front += f.d;
      ribs += f.rib;
    }
  });
  return depth(ctx, z, `<path d="${back}" fill="${p.back}"/><path d="${trunk}" fill="${tone === 'far' ? p.trunk : ref(ctx, 'palmTrunkG')}"/>`
    + `<path d="${rings}" stroke="${K.palmTrunkDeep}" stroke-width="${f1(0.8 * s)}" opacity=".45"/>`
    + `<path d="M${f1(x - w * 0.3)} ${foot - 4}C${f1(x - w * 0.5)} ${f1(foot - (foot - trunkTop) * 0.3)} ${f1(x - w * 0.26)} ${f1(trunkTop + 20)} ${f1(x - w * 0.26)} ${f1(trunkTop + 4)}" stroke="${C.cutRim}" stroke-width="${f1(0.8 * s)}" opacity="${f1(p.lit * 0.6)}" fill="none"/>`
    + `<path d="${cs}" fill="${tone === 'far' ? p.back : K.crownshaft}"/>`
    + `<path d="${front}" fill="${p.frond}"/><path d="${ribs}" stroke="${K.palmLit}" stroke-width="${f1(0.9 * s)}" fill="none" opacity="${p.lit}" stroke-linecap="round"/>`,
  `<path d="${trunk}${cs}${back}${front}"/>`);
}

/**
 * A campus lamp: a slim iron post on a fluted base and a round frosted globe of lit vellum (the
 * bloom kept calm for the squint test). The globe's top is at `top`; it stands at `foot`.
 */
function campusLamp(ctx: KitCtx, x: number, top: number, foot: number, { glow = 0.16, s = 1 } = {}): string {
  const k = (n: number) => f1(n * s);
  const post = `M${f1(x - 2.2 * s)} ${foot - 10 * s}V${f1(top + 18 * s)}h${k(4.4)}V${f1(foot - 10 * s)}Z`;
  const base = `M${f1(x - 7 * s)} ${foot}h${k(14)}l${k(-2)} ${k(-5)}h${k(-1.6)}l${k(-1)} ${k(-5)}h${k(-5.8)}l${k(-1)} ${k(5)}h${k(-1.6)}Z`;
  return softEllipse(ctx, x, top + 8 * s, 24 * s, 22 * s, 'lamp', glow, 'blur8')
    + depth(ctx, 3, `<path d="${post}${base}" fill="${ref(ctx, 'ironG')}"/><rect x="${f1(x - 4.4 * s)}" y="${f1(top + 15 * s)}" width="${k(8.8)}" height="${k(4)}" rx="${k(1.4)}" fill="${K.ironPost}"/>`
      + `<circle cx="${x}" cy="${f1(top + 8 * s)}" r="${k(8)}" fill="${C.lampHot}"/><circle cx="${f1(x - 1.6 * s)}" cy="${f1(top + 6.4 * s)}" r="${k(5)}" fill="${ref(ctx, 'window')}" opacity=".7"/>`
      + `<path d="M${f1(x - 3 * s)} ${f1(top + 0.4 * s)}h${k(6)}l${k(-1)} ${k(-2)}h${k(-4)}Z" fill="${K.ironPost}"/>`,
    `<path d="${post}${base}"/><circle cx="${x}" cy="${f1(top + 8 * s)}" r="${k(8)}"/>`);
}

/** An azalea hedge (台大 is 杜鵑花城): a clipped scalloped band of dark leaves dotted with muted pink blossoms. */
function azaleas(ctx: KitCtx, x0: number, x1: number, y: number, h: number, seed: number, z: 1 | 2 | 3 | 4 = 2, bloom = 0.75): string {
  const d = scallopBand(x0, x1, y - h, y, seed, 5, 16);
  const r = seeded(seed + 1);
  let blossoms = '';
  let deep = '';
  for (let i = 0; i < Math.round((x1 - x0) / 5); i++) {
    const bx = x0 + 4 + r() * (x1 - x0 - 8);
    const by = y - h + 6 + r() * (h - 8);
    const br = 1.6 + r() * 1.8;
    if (r() < 0.6) blossoms += `M${f1(bx - br)} ${f1(by)}a${f1(br)} ${f1(br)} 0 1 0 ${f1(2 * br)} 0a${f1(br)} ${f1(br)} 0 1 0 ${f1(-2 * br)} 0Z`;
    else deep += `M${f1(bx - br)} ${f1(by)}a${f1(br)} ${f1(br)} 0 1 0 ${f1(2 * br)} 0a${f1(br)} ${f1(br)} 0 1 0 ${f1(-2 * br)} 0Z`;
  }
  return depth(ctx, z, `<path d="${d}" fill="${K.azaleaLeaf}"/><path d="${deep}" fill="${K.azaleaDeep}" opacity="${bloom}"/><path d="${blossoms}" fill="${K.azalea}" opacity="${bloom}"/>`
    + `<rect x="${x0}" y="${f1(y - h * 0.3)}" width="${x1 - x0}" height="${f1(h * 0.3)}" fill="${C.shadow}" opacity=".22"/>`, `<path d="${d}"/>`);
}

/**
 * An old campus building (the 1930s halls round 椰林大道): a cream tiled facade on a brick plinth,
 * a ground-floor arcade of round arches (deep shadow, a few lit warm), a row of tall windows above
 * (some lit), a cornice and a dark hipped roof with a lit ridge. A V-fold crease down `fold` (bible
 * § 2.2). Its eave line is at `eave`; its foot at `base`.
 */
function campusBuilding(ctx: KitCtx, x0: number, x1: number, eave: number, base: number, { seed = 1, arches = 0, fold = null as number | null, roof = 26, lit = 0.4, z = 2 as 1 | 2 | 3 } = {}): string {
  const r = seeded(seed);
  const w = x1 - x0;
  const roofD = `M${x0 - 6} ${eave}L${f1(x0 + roof * 0.9)} ${eave - roof}H${f1(x1 - roof * 0.9)}L${x1 + 6} ${eave}Z`;
  const facade = `<rect x="${x0}" y="${eave}" width="${w}" height="${base - eave}" fill="${ref(ctx, 'stoneG')}"/>`;
  const plinth = `<rect x="${x0}" y="${base - 12}" width="${w}" height="12" fill="${ref(ctx, 'brickG')}"/>`;
  const floorH = base - eave - 12;
  // The arcade: round arches along the ground floor
  let arcade = '';
  const n = arches || Math.max(3, Math.round(w / 22));
  const aw = w / n;
  for (let i = 0; i < n; i++) {
    const ax = x0 + aw * i + aw * 0.18;
    const ww = aw * 0.64;
    const ah = floorH * 0.42;
    const ay = base - 12 - ah;
    const d = `M${f1(ax)} ${f1(base - 12)}V${f1(ay + ww / 2)}A${f1(ww / 2)} ${f1(ww / 2)} 0 0 1 ${f1(ax + ww)} ${f1(ay + ww / 2)}V${f1(base - 12)}Z`;
    arcade += r() < lit * 0.6 ? `<path d="${d}" fill="${ref(ctx, 'window')}" opacity=".85"/>` : `<path d="${d}" fill="${mixHex(K.roof, C.shadow, 0.4)}"/>`;
    // The upper windows
    const wy = eave + floorH * 0.12;
    const wh = floorH * 0.3;
    if (r() < lit) arcade += vellumWindow(ctx, ax + ww * 0.12, wy, ww * 0.76, wh, { bloom: 0.08, frame: K.stoneDeep });
    else arcade += `<rect x="${f1(ax + ww * 0.12)}" y="${f1(wy)}" width="${f1(ww * 0.76)}" height="${f1(wh)}" rx="1" fill="${mixHex(K.roof, K.lakeDeep, 0.3)}"/>`;
  }
  const cornice = `<rect x="${x0 - 3}" y="${eave}" width="${w + 6}" height="5" fill="${K.stone}"/><rect x="${x0}" y="${f1(eave + floorH * 0.5)}" width="${w}" height="3" fill="${K.stoneShade}"/>`;
  const roofS = `<path d="${roofD}" fill="${ref(ctx, 'roofG')}"/><path d="M${f1(x0 + roof * 0.9)} ${eave - roof}H${f1(x1 - roof * 0.9)}" stroke="${K.stoneShade}" stroke-width="1.6"/>`
    + `<path d="${Array.from({ length: Math.round(w / 9) }, (_, i) => `M${f1(x0 + 4 + i * 9)} ${eave - 1}l${f1((x0 + 4 + i * 9 - (x0 + x1) / 2) * 0.04)} ${-roof + 3}`).join('')}" stroke="${K.roof}" stroke-width=".7" opacity=".6"/>`;
  const outline = `<path d="${roofD}"/><rect x="${x0}" y="${eave}" width="${w}" height="${base - eave}"/>`;
  return depth(ctx, z, roofS + facade + arcade + cornice + plinth
    + (fold === null ? '' : vFold(ctx, `M${x0} ${eave - roof}H${x1}V${base}H${x0}Z`, fold, eave - roof, base, { shade: 0.16, clipId: ctx.id(`bFold${seed}`) })), outline);
}

/**
 * The lake (醉月湖) in a shape on the floor or the standing page: the lake card under glassine with
 * two sheen streaks and ripples, and (optionally) the moon's reflection in foil under it.
 */
function lakeWater(ctx: KitCtx, d: string, seed: number, { moon, sheen = 0.4 }: { moon?: readonly [number, number]; sheen?: number } = {}): string {
  const id = ctx.id(`lake${seed}`);
  const r = seeded(seed);
  let ripples = '';
  for (let i = 0; i < 30; i++) {
    const x = -20 + r() * (PAGE_W + 40), y = 200 + r() * (FLOOR_BOTTOM - 200);
    const w = 6 + r() * 18;
    ripples += `M${f1(x)} ${f1(y)}q${f1(w / 2)} -3 ${f1(w)} 0`;
  }
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${ref(ctx, 'lakeG')}"/><g clip-path="url(#${id})">`
    + (moon ? `<ellipse cx="${moon[0]}" cy="${moon[1]}" rx="14" ry="4.6" fill="${ref(ctx, 'foil')}" opacity=".5"/>` : '')
    + `<path d="${ripples}" stroke="${K.lakeSheen}" stroke-width="1" fill="none" opacity=".4"/>`
    + `<path d="M-40 ${GUTTER_Y + 30}L${PAGE_W + 40} ${GUTTER_Y + 130}V${GUTTER_Y + 142}L-40 ${GUTTER_Y + 42}Z" fill="${ref(ctx, 'glassine')}" opacity="${sheen}"/>`
    + `<path d="M-40 ${GUTTER_Y + 150}L${PAGE_W + 40} ${GUTTER_Y + 250}V${GUTTER_Y + 256}L-40 ${GUTTER_Y + 156}Z" fill="${ref(ctx, 'glassine')}" opacity="${f1(sheen * 0.8)}"/>`
    + `</g><path d="${d}" fill="none" stroke="${C.vellum}" stroke-width="1.2" opacity=".4"/>`;
}

/** Book spine colours, in a fixed order. */
const SPINES = [K.bookRed, K.bookGreen, K.bookBlue, K.bookTan, K.bookPlum, C.kraft, mixHex(K.bookBlue, C.washi, 0.25), K.bookGreen, C.kraftDark, K.bookRed];

/**
 * A row of books standing on a shelf from x0 to x1, their feet on `y`, about `h` tall: cloth and
 * kraft spines with a band and a title tick, a few leaning; one path per colour (few nodes).
 */
function bookRow(x0: number, x1: number, y: number, h: number, seed: number, { gaps = 0.08 } = {}): string {
  const r = seeded(seed);
  const by: string[] = SPINES.map(() => '');
  let bands = '';
  let x = x0 + 1;
  let i = 0;
  while (x < x1 - 3) {
    const w = 3.4 + r() * 3.2;
    if (r() < gaps) {
      x += w * 0.8;
      continue;
    }
    const bh = h * (0.68 + r() * 0.32);
    const c = Math.floor(r() * SPINES.length);
    const lean = r() < 0.06 ? 3 : 0;
    by[c] += `M${f1(x)} ${f1(y)}L${f1(x + lean)} ${f1(y - bh)}h${f1(w)}L${f1(x + w)} ${f1(y)}Z`;
    bands += `M${f1(x + lean * 0.8)} ${f1(y - bh * 0.82)}h${f1(w)}M${f1(x + 0.3)} ${f1(y - bh * 0.2)}h${f1(w - 0.6)}`;
    x += w + 0.5;
    i++;
  }
  return SPINES.map((c, k) => (by[k] ? `<path d="${by[k]}" fill="${c}"/>` : '')).join('')
    + `<path d="${bands}" stroke="${C.cutRim}" stroke-width=".7" opacity=".28"/>`;
}

/**
 * A stack of books lying flat (kraft and cloth covers, cream page edges), bottom at `foot`, from
 * `x` (left) `w` wide; each book `[height, inset, colour]` from the bottom up. Returns its outline too.
 */
function bookStack(ctx: KitCtx, x: number, foot: number, w: number, books: readonly (readonly [number, number, string])[], z: 2 | 3 | 4 = 3): string {
  let y = foot;
  let body = '';
  let outline = '';
  for (const [h, inset, color] of books) {
    const bx = x + inset;
    const bw = w - Math.abs(inset) * 2;
    y -= h;
    const d = `M${f1(bx)} ${f1(y + 1.5)}q0 -1.5 1.5 -1.5h${f1(bw - 3)}q1.5 0 1.5 1.5v${f1(h - 3)}q0 1.5 -1.5 1.5h${f1(-(bw - 3))}q-1.5 0 -1.5 -1.5z`;
    outline += `<path d="${d}"/>`;
    body += `<path d="${d}" fill="${color}"/>`
      // The page block on the near side, its lines, and the spine's band
      + `<rect x="${f1(bx + 3)}" y="${f1(y + h * 0.22)}" width="${f1(bw - 8)}" height="${f1(h * 0.56)}" fill="${K.pageEdge}"/>`
      + `<path d="M${f1(bx + 4)} ${f1(y + h * 0.4)}h${f1(bw - 10)}M${f1(bx + 4)} ${f1(y + h * 0.6)}h${f1(bw - 10)}" stroke="${K.pageEdgeShade}" stroke-width=".6"/>`
      + `<path d="M${f1(bx + bw - 5)} ${f1(y)}v${h}" stroke="${C.cutRim}" stroke-width=".8" opacity=".3"/>`
      + `<path d="M${f1(bx + 1)} ${f1(y + 0.6)}h${f1(bw - 2)}" stroke="${C.cutRim}" stroke-width=".8" opacity=".4"/>`;
  }
  return depth(ctx, z, body, outline);
}

/** The night over the campus: the chapter's sky, pinholes, a calm moon and the city's towers far off (with a tiny 101). */
function campusSky(ctx: KitCtx, moon: readonly [number, number, number] | null, skyBase: number, seed = 5, { towers = true } = {}): string {
  const sk = skyline(-6, PAGE_W + 6, skyBase, seed + 30, { minH: 22, maxH: 64, winP: 0.1, winOpacity: 0.6 });
  const tower = `<g transform="translate(66 ${skyBase})"><path d="M-5 0V-58L-3.5 -60V-72H-2.5V-82H2.5V-72H3.5V-60L5 -58V0Z" fill="${mixHex(T.navyDeep, C.shadow, 0.2)}"/>`
    + `<path d="${Array.from({ length: 7 }, (_, i) => `M-6 ${-12 - i * 6.5}H6`).join('')}" stroke="${C.neonCyan}" stroke-width=".6" opacity=".4"/><circle cy="-84" r="1.2" fill="${C.neonPink}"/></g>`;
  return `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, 0, 0, PAGE_W, skyBase - 40, 56, seed)
    + (moon ? calmMoon(ctx, moon[0], moon[1], moon[2], { halo: 0.08 }) : '')
    + (towers ? depth(ctx, 1, `<path d="${sk.d}" fill="${mixHex(T.navyDeep, K.palmFar, 0.25)}"/>${tower}`, `<path d="${sk.d}"/>`) + sk.windows : '');
}

/** A clump of reeds with a few cattails, standing at `foot`. */
function reeds(ctx: KitCtx, x: number, foot: number, h: number, seed: number, z: 2 | 3 = 2): string {
  const r = seeded(seed);
  let blades = '';
  let tails = '';
  for (let i = 0; i < 10; i++) {
    const bx = x - 18 + r() * 36, bh = h * (0.55 + r() * 0.45), lean = (r() - 0.5) * 20;
    blades += `M${f1(bx)} ${foot}q${f1(lean * 0.3)} ${f1(-bh * 0.6)} ${f1(lean)} ${f1(-bh)}`;
    if (r() < 0.35) tails += `<rect x="${f1(bx + lean - 2)}" y="${f1(foot - bh - 4)}" width="4" height="12" rx="2" fill="${K.shelfWoodDeep}"/>`;
  }
  return depth(ctx, z, `<path d="${blades}" stroke="${K.palm}" stroke-width="2.4" fill="none" stroke-linecap="round"/>${tails}`, `<path d="${blades}" stroke="#000" stroke-width="2.4" fill="none"/>`);
}

/** A campus lawn on the floor page: deep at the gutter, lighter toward the reader, short grass strokes and a shade under the standing page. */
function campusLawn(ctx: KitCtx, seed: number): string {
  const { x, y, w, h } = FLOOR_RECT;
  const r = seeded(seed);
  let blades = '';
  for (let i = 0; i < 420; i++) {
    const t = r();
    const by = GUTTER_Y + 6 + h * t;
    const bx = x + r() * w;
    const s = 2 + t * 4.5;
    blades += `M${f1(bx)} ${f1(by)}l${f1((r() - 0.5) * s * 0.6)} ${f1(-s)}`;
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'lawnK')}"/>`
    + `<path d="${blades}" stroke="${K.lawnDeep}" stroke-width="1" opacity=".5" stroke-linecap="round"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}" opacity=".45"/>`;
}

/** A band of rose-grey pavers in herringbone on the floor page, from y0 to y1 (receding toward the gutter). */
function paverBand(ctx: KitCtx, y0: number, y1: number, seed: number): string {
  const w = floorWiden(y1);
  let joints = '';
  const r = seeded(seed);
  for (let y = y0 + 4; y < y1; y += 8) {
    const off = ((y - y0) / 8) % 2 ? 6 : 0;
    for (let x = -w - 20 + off; x < PAGE_W + w + 20; x += 12) joints += `M${f1(x)} ${f1(y)}l6 ${f1(4 + r() * 0.6)}`;
  }
  return `<rect x="${f1(-w - 20)}" y="${y0}" width="${f1(PAGE_W + 2 * w + 40)}" height="${y1 - y0}" fill="${ref(ctx, 'paverK')}"/>`
    + `<path d="${joints}" stroke="${K.paverDeep}" stroke-width=".8" opacity=".4"/>`
    + `<path d="M-40 ${y0 + 0.5}H${PAGE_W + 40}M-40 ${y1 - 1}H${PAGE_W + 40}" stroke="${K.curb}" stroke-width="2"/>`;
}

// ——— 3-1 「綠線」 ———

/** A car window: a rounded cut in a steel frame, showing what is outside. */
function carWindow(ctx: KitCtx, x: number, y: number, w: number, h: number, inside: string, seed: number): string {
  const id = ctx.id(`c3win${seed}`);
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/></clipPath><g clip-path="url(#${id})">${inside}`
    + `<path d="M${x} ${y + h * 0.6}L${x + w * 0.5} ${y}H${x + w * 0.66}L${x} ${y + h}Z" fill="${C.cutRim}" opacity=".07"/></g>`
    + `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="11" fill="none" stroke="${ref(ctx, 'steelK')}" stroke-width="5"/>`;
}

/**
 * 3-1: a 松山新店線 car standing at 公館 (bible § 6, the 月亮線 car row: a side cut-away box with the
 * front wall removed). Left, the car: its cream wall and ceiling, the neon route strip lit at 公館,
 * the strap rail with Mocha's strap (its handle's top at (96, 226)) and a looped one for show, the
 * green line band, the teal 博愛座 and the long bench the backpacker sits up on (its seat at
 * (158, 420)), the car's end frame round the doors (the `c3/doors` part at x 220–280). Right, the
 * platform: an 「出口 台灣大學」 sign, the tiled wall with a mosaic of 椰林大道's palms, the 公館 name
 * board (the 土地公 sits on its edge at (336, 296) once the doors are open) and, under it, the ad
 * poster (a creature drawn live at (300, 362)).
 */
const greenCar: BackdropDraw = (ctx) => {
  const carX1 = 286;
  // ——— The platform (drawn first: the car's end frame overlaps it) ———
  let tiles = '';
  for (let y = 22; y < GUTTER_Y; y += 14) tiles += `M${carX1} ${y}H${PAGE_W + 20}`;
  for (let x = carX1 + 8; x < PAGE_W + 20; x += 20) tiles += `M${x} 22V${GUTTER_Y}`;
  // The mosaic: three palms in tile colours, low contrast (a station mural toward 台大)
  const mosaic = (() => {
    const id = ctx.id('mosaic');
    const r = seeded(17);
    let dots = '';
    for (let i = 0; i < 70; i++) dots += `<rect x="${f1(carX1 + 6 + r() * 120)}" y="${f1(60 + r() * 150)}" width="4" height="4" fill="${[K.palm, K.crownshaft, K.lakeLight, K.stone][i % 4]}" opacity=".35"/>`;
    return `<clipPath id="${id}"><rect x="${carX1}" y="56" width="${PAGE_W - carX1 + 20}" height="164"/></clipPath><g clip-path="url(#${id})" opacity=".55">`
      + `<rect x="${carX1}" y="56" width="${PAGE_W}" height="164" fill="${mixHex(K.lakeDeep, T.carWall, 0.35)}"/>`
      + royalPalm(ctx, 318, 226, 104, { s: 1, tone: 'mid', seed: 21, z: 1 }) + royalPalm(ctx, 372, 226, 88, { s: 1.15, tone: 'mid', seed: 22, z: 1 })
      + `<rect x="${carX1}" y="196" width="${PAGE_W}" height="30" fill="${K.paver}"/>` + dots + `</g>`
      + `<rect x="${carX1 + 4}" y="54" width="${PAGE_W - carX1 + 10}" height="168" fill="none" stroke="${T.steelDeep}" stroke-width="2.4"/>`;
  })();
  const wall = `<rect x="${carX1}" y="0" width="${PAGE_W - carX1 + 20}" height="${GUTTER_Y}" fill="${ref(ctx, 'tileWallK')}"/>`
    + `<path d="${tiles}" stroke="${T.carWallShade}" stroke-width=".8" opacity=".35"/>` + mosaic
    + `<rect x="${carX1}" y="236" width="${PAGE_W}" height="10" fill="${K.songshan}"/><rect x="${carX1}" y="247" width="${PAGE_W}" height="2" fill="${K.songshanDeep}"/>`;
  // The exit sign hung from the ceiling: 出口 · 台灣大學, with an arrow
  const exit = `<path d="M318 0V10M376 0V10" stroke="${T.steelDeep}" stroke-width="1.6"/>`
    + depth(ctx, 2, `<rect x="304" y="10" width="86" height="26" rx="3" fill="${T.navyDeep}"/>`, `<rect x="304" y="10" width="86" height="26" rx="3"/>`)
    + `<text data-art-text="" x="322" y="27.5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.lamp}">出口</text>`
    + `<text data-art-text="" x="364" y="27.5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="700" font-size="8" fill="${C.chalk}">台灣大學</text>`
    + `<path d="M338 23h8m-3 -3l3 3l-3 3" stroke="${C.lamp}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  // The name board: 公館 on the line's green, its edge where the 土地公 sits (336, 296)
  const board = depth(ctx, 2, `<rect x="298" y="254" width="92" height="36" rx="3" fill="${C.washi}"/><rect x="298" y="282" width="92" height="8" fill="${K.songshan}"/>`, `<rect x="298" y="254" width="92" height="36" rx="3"/>`)
    + `<text data-art-text="" x="352" y="274" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="15" fill="${T.navyDeep}" letter-spacing="4">公館</text>`
    + `<circle cx="312" cy="268" r="7" fill="${K.songshan}"/><text data-art-text="" x="312" y="271" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="7" fill="${C.cutRim}">G</text>`
    + `<text data-art-text="" x="352" y="288.6" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="5.5" fill="${C.cutRim}" letter-spacing="1">GONGGUAN</text>`;
  const ceilP = `<rect x="${carX1}" y="0" width="${PAGE_W - carX1 + 20}" height="8" fill="${T.lattice}"/>`;
  // ——— The car ———
  const back = `<rect x="-20" y="0" width="${carX1 + 20}" height="${GUTTER_Y + 40}" fill="${ref(ctx, 'carWallK')}"/>`
    + paperFibres(-20, 0, carX1 + 20, GUTTER_Y, 46, T.carWallShade, 71, 0.25);
  const ceiling = `<path d="M-20 0H${carX1}V64Q130 78 -20 64Z" fill="${T.carCeiling}"/><path d="M-20 64Q130 78 ${carX1} 64" stroke="${T.carWallShade}" stroke-width="2" fill="none"/>`
    + `<rect x="10" y="30" width="96" height="5" rx="2.5" fill="${C.lampHot}"/><rect x="126" y="30" width="80" height="5" rx="2.5" fill="${C.lampHot}"/>`
    + softEllipse(ctx, 58, 32, 54, 8, 'lamp', 0.3) + softEllipse(ctx, 166, 32, 46, 8, 'lamp', 0.3);
  // The route strip: the 松山新店線's green, its stops, 公館 lit
  const stops = [22, 62, 102, 142, 182];
  const names = ['古亭', '台電大樓', '公館', '萬隆', '景美'];
  const route = depth(ctx, 2, `<rect x="6" y="78" width="196" height="28" rx="4" fill="${T.navyDeep}"/>`, `<rect x="6" y="78" width="196" height="28" rx="4"/>`)
    + `<path d="M16 97H192" stroke="${K.songshan}" stroke-width="4" stroke-linecap="round"/>`
    + stops.map((x, i) => `<circle cx="${x}" cy="97" r="${i === 2 ? 4.6 : 3}" fill="${i === 2 ? C.lampHot : C.cutRim}" stroke="${K.songshan}" stroke-width="1.6"/>`).join('')
    + softEllipse(ctx, 102, 97, 10, 8, 'lamp', 0.4)
    + stops.map((x, i) => `<text data-art-text="" x="${x}" y="90" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="${i === 2 ? 900 : 700}" font-size="${i === 2 ? 8 : 5.5}" fill="${i === 2 ? C.lamp : C.chalk}"${i === 2 ? '' : ' opacity=".7"'}>${names[i]}</text>`).join('');
  // The windows: the tunnel's tiled wall with the line's green band and a work lamp
  const tunnel = (x: number, y: number, w: number, h: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mixHex(T.carWallShade, T.navy, 0.55)}"/>`
    + `<path d="${Array.from({ length: Math.ceil(h / 10) }, (_, i) => `M${x} ${y + i * 10}h${w}`).join('')}" stroke="${T.navyDeep}" stroke-width=".7" opacity=".5"/>`
    + `<rect x="${x}" y="${y + h * 0.36}" width="${w}" height="10" fill="${K.songshan}" opacity=".7"/>`
    + softEllipse(ctx, x + w / 2, y + 12, w * 0.4, 10, 'lamp', 0.16);
  const winA = carWindow(ctx, 8, 128, 66, 90, tunnel(8, 128, 66, 90), 1);
  const winB = carWindow(ctx, 118, 128, 84, 90, tunnel(118, 128, 84, 90), 2);
  // The strap rail and Mocha's strap (its handle's top at (96, 226)); a strap looped up for show
  const strap = (x: number, top: number) => `<path d="M${x} 116V${top - 2}" stroke="${K.songshanDeep}" stroke-width="4"/>`
    + `<circle cx="${x}" cy="${top + 9}" r="9" fill="none" stroke="${C.cutRim}" stroke-width="3.6"/><circle cx="${x}" cy="${top + 9}" r="9" fill="none" stroke="${T.steel}" stroke-width="2"/>`;
  const rail = depth(ctx, 3, `<rect x="-20" y="112" width="${carX1 - 60}" height="5" rx="2.5" fill="${ref(ctx, 'steelK')}"/>`
    + `<path d="M30 70V112M170 70V112" stroke="${T.steelDeep}" stroke-width="2.4"/>`
    + strap(96, 226) + `<path d="M160 116V146" stroke="${K.songshanDeep}" stroke-width="4"/><path d="M153 146H167L160 158Z" fill="none" stroke="${K.songshanDeep}" stroke-width="3" stroke-linejoin="round"/>`,
  `<rect x="-20" y="112" width="${carX1 - 60}" height="5"/>`);
  const band = `<rect x="-20" y="236" width="${carX1 + 20}" height="10" fill="${K.songshan}"/><rect x="-20" y="247" width="${carX1 + 20}" height="2" fill="${K.songshanDeep}"/>`;
  const prioSign = depth(ctx, 2, `<rect x="14" y="262" width="58" height="16" rx="3" fill="${T.priority}"/>`, `<rect x="14" y="262" width="58" height="16" rx="3"/>`)
    + `<text data-art-text="" x="43" y="273.5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.cutRim}" letter-spacing="2">博愛座</text>`;
  // An ad frame over the bench: a little poster of 椰林大道 at night (the chapter's place)
  const carAd = depth(ctx, 2, `<rect x="120" y="258" width="76" height="44" rx="2" fill="${C.washi}"/>`
    + `<rect x="124" y="262" width="68" height="30" fill="${mixHex(K.lakeDeep, K.lake, 0.4)}"/>`
    + `<path d="M124 292L158 270L192 292Z" fill="${K.paver}" opacity=".7"/><circle cx="178" cy="270" r="4" fill="${C.moon}" opacity=".85"/>`, `<rect x="120" y="258" width="76" height="44"/>`)
    + `<text data-art-text="" x="158" y="299" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="5.5" fill="${T.navyDeep}" letter-spacing="1">椰林大道 · 夜</text>`;
  // The car's end: a steel frame round the doorway (the doors part fills x 220–280)
  const frame = depth(ctx, 3, `<path d="M214 196H${carX1}V470H280V214Q280 206 272 206H228Q220 206 220 214V470H214Z" fill="${T.steel}"/>`
    + `<path d="M${carX1} 0V470" stroke="${T.steelDeep}" stroke-width="4"/>`
    + `<rect x="228" y="196" width="44" height="8" rx="2" fill="${C.printDark}"/>`, `<path d="M214 196H${carX1}V470H214Z"/>`);
  // Through the doorway (seen once the doors slide open): the platform's tiles and its light
  const doorway = `<rect x="220" y="206" width="60" height="264" fill="${ref(ctx, 'tileWallK')}"/>`
    + `<path d="${Array.from({ length: 11 }, (_, i) => `M220 ${214 + i * 14}h60`).join('')}M240 206V360M260 206V360" stroke="${T.carWallShade}" stroke-width=".8" opacity=".35"/>`
    + `<rect x="220" y="236" width="60" height="10" fill="${K.songshan}"/>`
    + `<rect x="220" y="360" width="60" height="110" fill="${mixHex(T.granite, T.navy, 0.3)}"/>` + softEllipse(ctx, 250, 420, 34, 40, 'lamp', 0.2);
  // The 博愛座 (teal) and the long green bench (the backpacker sits up on it at (158, 420))
  const seat = (x0: number, x1: number, top: number, fill: string) => depth(ctx, 3, `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="40" rx="8" fill="${fill}"/>`
    + `<rect x="${x0 - 4}" y="${top + 36}" width="${x1 - x0 + 8}" height="22" rx="6" fill="${fill}"/><path d="M${x0 + 4} ${top + 40}h${x1 - x0 - 8}" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`
    + `<path d="${Array.from({ length: Math.floor((x1 - x0) / 32) }, (_, i) => `M${x0 + 32 + i * 32} ${top + 6}V${top + 34}`).join('')}" stroke="${C.shadow}" stroke-width="1.6" opacity=".2"/>`, `<rect x="${x0 - 4}" y="${top}" width="${x1 - x0 + 8}" height="58"/>`);
  const poles = `<rect x="104" y="40" width="5" height="440" fill="${ref(ctx, 'steelK')}"/><rect x="206" y="40" width="5" height="440" fill="${ref(ctx, 'steelK')}"/>`;
  // The floor page: the car's underfloor, the platform's granite past the doors, the track bed below
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(T.navyDeep, C.printDark, 0.4)}"/>`
    + `<rect x="${carX1}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="110" fill="${mixHex(T.granite, T.navy, 0.35)}"/>`
    + `<rect x="${carX1}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="110" fill="${ref(ctx, 'floorShade')}"/>`
    + `<rect x="-40" y="${GUTTER_Y}" width="${carX1 + 40}" height="110" fill="${T.floorLino}"/>`
    + `<path d="${Array.from({ length: 11 }, (_, i) => `M${-20 + i * 30} ${GUTTER_Y}l${f1((-20 + i * 30 - 195) * 0.08)} 110`).join('')}" stroke="${T.floorLinoDeep}" stroke-width=".8" opacity=".5"/>`
    + `<rect x="-40" y="${GUTTER_Y}" width="${carX1 + 40}" height="24" fill="${C.shadow}" opacity=".18"/>`
    + softEllipse(ctx, 120, GUTTER_Y + 50, 110, 26, 'lamp', 0.1)
    + (() => {
      const k = (FLOOR_BOTTOM - GUTTER_Y) / (GUTTER_Y + 360);
      let d = '';
      for (let x = -140; x <= PAGE_W + 140; x += 26) d += `M${f1(x + (x - 195) * k * 0.55)} 548L${f1(x + (x - 195) * k)} ${FLOOR_BOTTOM}`;
      return `<rect x="${FLOOR_RECT.x}" y="530" width="${FLOOR_RECT.w}" height="${FLOOR_BOTTOM - 530}" fill="${mixHex(T.navyDeep, C.printDark, 0.5)}"/><path d="${d}" stroke="${C.printDark}" stroke-width="5" opacity=".9"/>`;
    })()
    + `<path d="M-40 572H430M-40 626H430" stroke="${T.steelDeep}" stroke-width="5"/><path d="M-40 570.5H430M-40 624.5H430" stroke="${T.steel}" stroke-width="1.6"/>`
    + pools(ctx, [[344, GUTTER_Y + 40, 80, 26]]));
  return campusDefs(ctx) + standingPage(ctx, wall + exit + board + ceilP + back + ceiling + route + winA + winB + band + prioSign + carAd
    + `<rect x="${carX1}" y="${GUTTER_Y - 30}" width="${PAGE_W}" height="30" fill="${ref(ctx, 'lampWashK')}"/>`)
    + floor + doorway + poles + rail + seat(6, 88, 392, ref(ctx, 'prioK')) + seat(112, 206, 382, ref(ctx, 'seatK')) + frame + bookCues(ctx) + block();
};

// ——— 3-2 「椰林大道」 ———

/**
 * 3-2: 椰林大道 at night, looking down the avenue to the main library (bible § 6 row 3: the palms as
 * tall thin flats in rows, strong parallax). The avenue runs off from the gutter to the library's
 * lit portico at its end; royal palms line both sides, shrinking with distance, with lamps between
 * them. Nearer: the palm Mocha sits on (`palm`, the crownshaft's top at (60, 250)) and the one the
 * 土地公 hides behind (214, 330), the paved bike park along the floor page's back (the bikes' rack,
 * y 420–446), the walkway (the live ledges at y 484) and the azaleas along the front.
 */
const palmAvenue: BackdropDraw = (ctx) => {
  const vx = 195, vy = 276;
  // The avenue: from the gutter to the library's steps
  const avenue = `M96 ${GUTTER_Y}L${vx - 18} ${vy + 8}H${vx + 18}L294 ${GUTTER_Y}Z`;
  const lawnL = `M-20 ${GUTTER_Y}H96L${vx - 18} ${vy + 8}L-20 ${vy + 30}Z`;
  const lawnR = `M${PAGE_W + 20} ${GUTTER_Y}H294L${vx + 18} ${vy + 8}L${PAGE_W + 20} ${vy + 30}Z`;
  let lines = '';
  for (let k = 1; k < 9; k++) {
    const t = k / 9;
    const y = vy + 8 + (GUTTER_Y - vy - 8) * t * t;
    const hw = 18 + (99 - 18) * t * t;
    lines += `M${f1(vx - hw)} ${f1(y)}H${f1(vx + hw)}`;
  }
  const road = `<path d="${lawnL}${lawnR}" fill="${mixHex(K.lawnDeep, K.palmFar, 0.4)}"/><path d="${avenue}" fill="${ref(ctx, 'avenueG')}"/>`
    + `<path d="${lines}" stroke="${K.paverDeep}" stroke-width=".8" opacity=".45"/><path d="M${vx} ${vy + 10}V${GUTTER_Y}" stroke="${K.paverLight}" stroke-width="1" stroke-dasharray="4 6" opacity=".35"/>`;
  // The library at the avenue's end: a wide hall and its tall lit portico (the accent's home)
  const library = campusBuilding(ctx, 128, 262, 248, vy + 10, { seed: 31, arches: 7, lit: 0.6, roof: 14, z: 1 })
    + depth(ctx, 1, `<rect x="176" y="220" width="38" height="${vy + 10 - 220}" fill="${ref(ctx, 'stoneG')}"/><path d="M170 222L195 204L220 222Z" fill="${ref(ctx, 'roofG')}"/>`
      + `<path d="M182 ${vy + 10}V246a13 13 0 0 1 26 0V${vy + 10}Z" fill="${ref(ctx, 'window')}"/><path d="M195 233V${vy + 10}M182 258H208" stroke="${K.stoneDeep}" stroke-width="1" opacity=".6"/>`
      + `<rect x="172" y="${vy + 6}" width="46" height="5" fill="${K.stone}"/>`, `<rect x="176" y="204" width="38" height="${vy + 16 - 204}"/>`)
    + softEllipse(ctx, 195, vy + 4, 40, 14, 'lamp', 0.2);
  // The palm rows: far to near, both sides, shrinking toward the library; lamps between them
  let rows = '';
  const row = (side: -1 | 1) => {
    let out = '';
    for (let k = 0; k < 7; k++) {
      const t = 1 - k / 7;
      const foot = vy + 10 + (GUTTER_Y + 4 - vy - 10) * (1 - t) ** 1.6;
      const x = vx + side * (26 + (112 - 26) * (1 - t) ** 1.6);
      const s = 0.3 + 0.9 * (1 - t) ** 1.6;
      const h = 220 * s;
      const tone: PalmTone = k < 3 ? 'far' : k < 5 ? 'mid' : 'near';
      out += royalPalm(ctx, x, foot, foot - h, { s, tone, seed: 40 + k * 2 + (side > 0 ? 1 : 0), z: k < 4 ? 1 : 2 });
      if (k % 2 === 1 && k < 6) out += campusLamp(ctx, x + side * 14 * s, foot - 60 * s, foot, { s: s * 0.9, glow: 0.12 });
    }
    return out;
  };
  rows += row(-1) + row(1);
  // The outer rows, beyond the lawns (taller, darker, cut by the page's edges)
  const outer = royalPalm(ctx, 8, GUTTER_Y + 4, 120, { s: 1.2, tone: 'mid', seed: 61, z: 2 }) + royalPalm(ctx, 384, GUTTER_Y + 4, 112, { s: 1.25, tone: 'mid', seed: 62, z: 2 });
  const back = campusSky(ctx, [322, 54, 14], 262, 9) + `<rect x="-20" y="${vy + 20}" width="${PAGE_W + 40}" height="${GUTTER_Y - vy - 20}" fill="${mixHex(K.lawnDeep, K.palmFar, 0.5)}"/>`
    + `<rect x="-20" y="${vy - 30}" width="${PAGE_W + 40}" height="60" fill="${ref(ctx, 'mistK')}"/>` + library + road + rows + outer
    + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'lampWashK')}"/>`;
  // The floor page: the avenue's near end, the paved bike park, the walkway's lawn, azaleas in front
  const nearRoad = `M96 ${GUTTER_Y}H294L304 400H86Z`;
  const floor = floorPage(ctx, campusLawn(ctx, 33)
    + `<path d="${nearRoad}" fill="${mixHex(K.paver, C.shadow, 0.25)}"/><path d="M195 ${GUTTER_Y}V400" stroke="${K.paverLight}" stroke-width="1" stroke-dasharray="4 6" opacity=".35"/>`
    + paverBand(ctx, 398, 456, 34)
    + pools(ctx, [[195, 380, 90, 18], [60, 470, 60, 16, 'moon'], [300, 470, 70, 16, 'moon']]));
  // The palms nearest the walkway: Mocha's (the crownshaft's top at (60, 250)) and the 土地公's (214, 330)
  const near = royalPalm(ctx, 222, 404, 120, { s: 1.15, tone: 'near', seed: 71, z: 3 }) + royalPalm(ctx, 60, 412, 250, { s: 1.25, tone: 'near', seed: 72, z: 3 });
  const front = azaleas(ctx, -20, PAGE_W + 20, 612, 26, 75, 3);
  return campusDefs(ctx) + standingPage(ctx, back) + floor + near + front + bookCues(ctx) + block();
};

// ——— 3-3 「醉月湖」 ———

/**
 * A weeping willow's curtain hanging from the top of the page between x0 and x1 down to `y1`:
 * long strands of narrow leaves (each strand one stroked path), the near ones lit by the moon.
 */
function willow(ctx: KitCtx, x0: number, x1: number, y1: number, seed: number): string {
  const r = seeded(seed);
  let back = '';
  let front = '';
  for (let x = x0; x < x1; x += 5 + r() * 5) {
    const len = (y1 - 10) * (0.55 + r() * 0.45) * (1 - Math.abs((x - (x0 + x1) / 2) / (x1 - x0)) * 0.5);
    let d = `M${f1(x)} -10`;
    const sway = (r() - 0.5) * 14;
    d += `q${f1(sway)} ${f1(len * 0.5)} ${f1(sway * 0.6)} ${f1(len)}`;
    if (r() < 0.5) back += d;
    else front += d;
  }
  // The crown: overlapping leafy puffs along the page's top edge
  let crown = '';
  for (let x = x0 - 10; x < x1 + 20; x += 22 + r() * 10) {
    const pr = 18 + r() * 10;
    const cy = 6 + r() * 34;
    crown += `M${f1(x - pr)} ${f1(cy)}a${f1(pr)} ${f1(pr)} 0 1 0 ${f1(2 * pr)} 0a${f1(pr)} ${f1(pr)} 0 1 0 ${f1(-2 * pr)} 0Z`;
  }
  return depth(ctx, 2, `<path d="${back}" stroke="${K.palmDeep}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-dasharray="3.4 3"/>`
    + `<path d="${crown}" fill="${K.palmDeep}"/>`
    + `<path d="${front}" stroke="${K.palm}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-dasharray="3.6 2.6"/>`
    + `<path d="${front}" stroke="${K.palmLit}" stroke-width=".9" fill="none" stroke-linecap="round" stroke-dasharray="2 7.2" opacity=".5" transform="translate(-1 0)"/>`,
  `<path d="${crown}"/><path d="${back}${front}" stroke="#000" stroke-width="3" fill="none"/>`);
}

/**
 * 3-3: 醉月湖 by night. Behind, the far shore: campus halls with lit windows, the lake's little
 * pavilion with its lantern, trees; the far water mirrors the windows. 咻咻 skims across the lake as
 * a ripple (the chapter's cameo). Nearer: a willow over the lakeside bench (Mocha's `bench`, its
 * back's top at (60, 370)), the reeds where the 土地公 peeks (196, 386), the great rock beside the
 * goose's nest (`rock`, its top at (330, 376)). On the floor page the lake comes round in front:
 * its glassine water fills the left (the moon's reflection, a decoy, is drawn live at (130, 534));
 * the grassy bank and the nest on the right.
 */
const lake: BackdropDraw = (ctx) => {
  const shore = 262;
  const r = seeded(81);
  // The far shore: a tree line, two halls with lit windows, the pavilion on its islet
  let trees = '';
  for (let x = -30; x < PAGE_W + 40; x += 20 + r() * 16) {
    const rr = 14 + r() * 12;
    trees += `M${f1(x - rr)} ${shore}a${f1(rr)} ${f1(rr * 1.1)} 0 0 1 ${f1(2 * rr)} 0Z`;
  }
  const farTrees = depth(ctx, 1, `<path d="${trees}" fill="${K.palmFar}"/>`, `<path d="${trees}"/>`);
  const halls = campusBuilding(ctx, 6, 112, 232, shore, { seed: 82, arches: 5, lit: 0.55, roof: 12, z: 1 })
    + campusBuilding(ctx, 300, 400, 226, shore, { seed: 83, arches: 5, lit: 0.5, roof: 12, z: 1 });
  const pavilion = depth(ctx, 2, `<path d="M226 ${shore - 2}V244M262 ${shore - 2}V244" stroke="${K.brickDeep}" stroke-width="3"/>`
    + `<path d="M212 246L244 226L276 246Q262 242 244 244Q226 242 212 246Z" fill="${ref(ctx, 'roofG')}"/><path d="M212 246q-4 -4 -2 -8M276 246q4 -4 2 -8" stroke="${K.roofLight}" stroke-width="1.6" fill="none"/>`
    + `<rect x="236" y="250" width="16" height="8" rx="2" fill="${C.lampHot}"/>`
    + `<path d="M190 ${shore}l18 -6h80l18 6Z" fill="${K.stoneDeep}"/>`, `<path d="M212 246L244 226L276 246V${shore}H212Z"/>`)
    + softEllipse(ctx, 244, 254, 14, 10, 'lamp', 0.3);
  // The far water: window reflections as broken vertical streaks, ripples
  let streaks = '';
  for (const [x, w] of [[30, 6], [58, 5], [86, 6], [244, 8], [320, 5], [348, 6], [376, 5]] as const) {
    for (let k = 0; k < 5; k++) streaks += `M${f1(x - w / 2 + (k % 2) * 2)} ${f1(shore + 6 + k * 9)}h${f1(w * (1 - k * 0.12))}`;
  }
  const farLake = `<rect x="-20" y="${shore}" width="${PAGE_W + 40}" height="${GUTTER_Y - shore}" fill="${ref(ctx, 'farLakeG')}"/>`
    + `<path d="${streaks}" stroke="${C.lamp}" stroke-width="2.2" opacity=".35" stroke-linecap="round"/>`
    + `<rect x="-20" y="${shore + 30}" width="${PAGE_W + 40}" height="8" fill="${ref(ctx, 'glassine')}" opacity=".25"/>`
    + `<path d="M-20 ${shore + 0.5}H${PAGE_W + 20}" stroke="${C.vellum}" stroke-width="1" opacity=".4"/>`;
  // 咻咻 skimming the lake: the little cloud low over the water and its ripple rings
  const shushu = shushuPeek(ctx, 152, 300, 1.25)
    + `<g fill="none" stroke="${C.vellum}" stroke-linecap="round"><ellipse cx="170" cy="322" rx="16" ry="3.4" stroke-width="1.4" opacity=".55"/><ellipse cx="170" cy="322" rx="32" ry="6.4" stroke-width="1.2" opacity=".38"/>`
    + `<ellipse cx="170" cy="322" rx="54" ry="10" stroke-width="1" opacity=".24"/><path d="M96 330q20 -5 40 0M210 336q24 -5 48 0" stroke-width="1" opacity=".3"/></g>`;
  const back = campusSky(ctx, [130, 64, 15], shore - 30, 13, { towers: false }) + farTrees + halls + pavilion + farLake + shushu
    + `<rect x="-20" y="${GUTTER_Y - 24}" width="${PAGE_W + 40}" height="24" fill="${ref(ctx, 'lampWashK')}"/>`;
  // The floor page: the lake behind the promenade and round its front-left, the bank on the right
  const backWater = `M-40 ${GUTTER_Y}H${PAGE_W + 40}V438H-40Z`;
  const frontWater = `M-40 520C40 516 120 518 170 528C200 536 214 560 206 ${FLOOR_BOTTOM}H-40Z`;
  const bank = `M-40 436H${PAGE_W + 40}V${FLOOR_BOTTOM}H206C214 560 200 536 170 528C120 518 40 516 -40 520Z`;
  let grass = '';
  for (let i = 0; i < 160; i++) {
    const x = 160 + r() * 260, y = 440 + r() * 210;
    if (x < 210 && y > 520) continue;
    grass += `M${f1(x)} ${f1(y)}l${f1((r() - 0.5) * 3)} ${f1(-2 - r() * 4)}`;
  }
  const floor = floorPage(ctx, `<path d="${bank}" fill="${ref(ctx, 'lawnK')}"/><path d="${grass}" stroke="${K.lawnLight}" stroke-width="1" opacity=".6"/>`
    + lakeWater(ctx, backWater, 84, { sheen: 0.3 }) + lakeWater(ctx, frontWater, 85, { sheen: 0.45 })
    // The stone edge of the bank along the water
    + `<path d="M-40 520C40 516 120 518 170 528C200 536 214 560 206 ${FLOOR_BOTTOM}" stroke="${K.stoneShade}" stroke-width="3" fill="none" opacity=".7"/>`
    + `<path d="M-40 436H${PAGE_W + 40}" stroke="${K.stoneShade}" stroke-width="3" opacity=".6"/>`
    + pools(ctx, [[372, 450, 60, 18], [130, 560, 90, 30, 'moon']]));
  // The willow over the bench; the bench (its back's top at (60, 370)); the reeds; the rock
  const bench = (() => {
    const [x0, x1, top, seat, foot] = [22, 98, 370, 412, 456];
    const slats = [0, 1, 2].map((i) => `<rect x="${x0}" y="${top + i * 8}" width="${x1 - x0}" height="5.5" rx="1.5" fill="${i ? S.benchBack : mixHex(S.benchBack, C.cutRim, 0.15)}"/>`).join('');
    const seatS = `<rect x="${x0 - 4}" y="${seat - 3}" width="${x1 - x0 + 8}" height="7" rx="2" fill="${S.benchSeat}"/><path d="M${x0 - 3} ${seat - 2.4}H${x1 + 3}" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`;
    const end = (x: number) => `<path d="M${x} ${top - 2}V${foot}M${x} ${seat + 2}l${x < (x0 + x1) / 2 ? -6 : 6} ${foot - seat - 2}" stroke="${K.ironPost}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
    return depth(ctx, 3, end(x0 + 6) + end(x1 - 6) + slats + seatS, `<rect x="${x0 - 4}" y="${top}" width="${x1 - x0 + 8}" height="${seat - top + 4}"/>`);
  })();
  const rock = depth(ctx, 3, `<path d="M300 450Q296 404 316 386Q330 372 348 380Q372 390 376 424Q380 448 368 452Z" fill="${K.stoneDeep}"/>`
    + `<path d="M316 386Q330 372 348 380Q336 382 326 394Q314 410 312 446H302Q298 404 316 386Z" fill="${K.stoneShade}" opacity=".7"/>`
    + `<path d="M318 384Q332 374 346 380" stroke="${C.cutRim}" stroke-width="1.4" fill="none" opacity=".4"/>`
    + `<path d="M330 400q10 4 18 0M344 420q8 3 14 0" stroke="${C.shadow}" stroke-width="1.4" fill="none" opacity=".3"/>`, `<path d="M300 450Q296 404 316 386Q330 372 348 380Q372 390 376 424Q380 448 368 452Z"/>`);
  return campusDefs(ctx) + standingPage(ctx, back) + floor + willow(ctx, -20, 130, 236, 86)
    + campusLamp(ctx, 372, 330, 440, { glow: 0.14 }) + reeds(ctx, 200, 424, 58, 87) + bench + rock + reeds(ctx, 368, 470, 40, 88, 3)
    + bookCues(ctx) + block();
};

// ——— 3-4 「傅鐘」 ———

/**
 * 3-4: 傅鐘, the bell that rings twenty-one times. Centre left, the small stone pavilion on its
 * plinth (bible § 6 row 3: a small tower with a brass bell): four pillars under a bronze-green roof,
 * a beam the bell hangs from (the bell, a decoy, is drawn live with its crown at (158, 196)); the
 * plinth's arched niche where the 土地公 shows (200, 300). Right, a campus hall with its arcade; the
 * pigeons flutter up to its eaves (248, 150). In front of it, the garden wall and gate posts (the
 * right post is Mocha's `pillar`, its cap at (318, 350)); the `c3/garden-gate` part hangs between
 * them, the garden's azaleas and lamp behind. Left, a royal palm (Mocha's `palm`, (44, 280)).
 */
const fuBell: BackdropDraw = (ctx) => {
  const hall = campusBuilding(ctx, 214, 420, 150, GUTTER_Y, { seed: 91, arches: 7, lit: 0.45, roof: 22, fold: 300, z: 2 });
  // The pavilion: roof, beam, four pillars (two seen), the plinth with its steps and niche
  const cx = 158;
  const roof = `M${cx - 62} 178Q${cx - 30} 168 ${cx} 128Q${cx + 30} 168 ${cx + 62} 178Q${cx + 40} 172 ${cx} 174Q${cx - 40} 172 ${cx - 62} 178Z`;
  const tower = depth(ctx, 2, `<path d="M${cx - 42} 176V262M${cx + 42} 176V262" stroke="${ref(ctx, 'stoneR')}" stroke-width="9"/>`
    + `<path d="M${cx - 42} 176V262" stroke="${K.stone}" stroke-width="9"/><path d="M${cx - 46} 176V262" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`
    + `<rect x="${cx - 48}" y="180" width="96" height="8" fill="${K.stoneShade}"/>`
    + `<path d="${roof}" fill="${ref(ctx, 'bronzeG')}"/><path d="M${cx - 60} 177Q${cx} 168 ${cx + 60} 177" stroke="${K.bronzeDeep}" stroke-width="2" fill="none"/>`
    + `<path d="M${cx} 128V116" stroke="${K.bronzeDeep}" stroke-width="2.4"/><circle cx="${cx}" cy="114" r="3" fill="${K.bronze}"/>`
    + `<path d="M${cx - 62} 178q-6 -2 -8 -9M${cx + 62} 178q6 -2 8 -9" stroke="${K.bronze}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    + `<path d="${Array.from({ length: 9 }, (_, i) => `M${cx} 132L${f1(cx - 56 + i * 14)} 175`).join('')}" stroke="${K.bronzeDeep}" stroke-width=".8" opacity=".55"/>`
    // The plinth: stone blocks, an arched niche each side, three steps
    + `<rect x="${cx - 50}" y="262" width="100" height="${GUTTER_Y - 262}" fill="${ref(ctx, 'stoneG')}"/>`
    + `<path d="${Array.from({ length: 5 }, (_, i) => `M${cx - 50} ${276 + i * 16}H${cx + 50}`).join('')}" stroke="${K.stoneShade}" stroke-width=".9" opacity=".7"/>`
    + `<path d="M${cx - 34} 340V306a12 12 0 0 1 24 0V340ZM${cx + 30} 340V302a12 12 0 0 1 24 0V340Z" fill="${mixHex(K.roof, C.shadow, 0.35)}"/>`
    + `<rect x="${cx - 56}" y="258" width="112" height="6" fill="${K.stone}"/>`
    + `<path d="M${cx - 58} ${GUTTER_Y}h116v-6h-112z" fill="${K.stoneShade}"/>`, `<path d="${roof}"/><rect x="${cx - 56}" y="176" width="112" height="${GUTTER_Y - 176}"/>`)
    // The beam the bell hangs from (the bell is the live decoy)
    + `<rect x="${cx - 34}" y="186" width="68" height="5" rx="1.5" fill="${K.shelfWoodDeep}"/><path d="M${cx} 191V198" stroke="${K.shelfWoodDeep}" stroke-width="2.4"/>`
    + softEllipse(ctx, cx, 222, 30, 24, 'lamp', 0.12);
  // The garden wall behind the gate, the garden's azaleas and lamp
  const wall = depth(ctx, 2, `<rect x="230" y="${GUTTER_Y - 36}" width="190" height="36" fill="${ref(ctx, 'brickG')}"/>`
    + `<path d="${Array.from({ length: 4 }, (_, i) => `M230 ${GUTTER_Y - 30 + i * 9}H420`).join('')}" stroke="${K.brickDeep}" stroke-width=".8" opacity=".55"/>`
    + `<rect x="228" y="${GUTTER_Y - 40}" width="194" height="5" fill="${K.stone}"/>`, `<rect x="228" y="${GUTTER_Y - 40}" width="194" height="40"/>`);
  const back = campusSky(ctx, [56, 54, 13], 230, 17) + royalPalm(ctx, 110, GUTTER_Y, 110, { s: 0.9, tone: 'far', seed: 92, z: 1 })
    + royalPalm(ctx, 210, GUTTER_Y, 96, { s: 1, tone: 'far', seed: 93, z: 1 })
    + `<rect x="-20" y="300" width="${PAGE_W + 40}" height="${GUTTER_Y - 300}" fill="${mixHex(K.lawnDeep, K.palmFar, 0.4)}"/>`
    + azaleas(ctx, -20, 120, GUTTER_Y, 22, 94, 2) + hall + tower + wall
    + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'lampWashK')}"/>`;
  // The floor page: the plaza's pavers round the plinth, the gate's threshold, the garden's lawn
  const floor = floorPage(ctx, campusLawn(ctx, 95) + paverBand(ctx, GUTTER_Y, 470, 96)
    + `<path d="M182 470H258L262 560H178Z" fill="${mixHex(K.paver, C.shadow, 0.45)}"/>`
    + `<path d="M258 ${GUTTER_Y}H${PAGE_W + 40}V470H258Z" fill="${ref(ctx, 'lawnK')}" opacity=".9"/>`
    + pools(ctx, [[372, 440, 60, 16], [158, 400, 90, 26, 'moon'], [220, 520, 40, 14]]));
  // The gate posts: the left one, and the right one with its cap (Mocha's `pillar`, (318, 350))
  const post = (x0: number, w: number, top: number) => depth(ctx, 3, `<rect x="${x0}" y="${top}" width="${w}" height="${478 - top}" fill="${ref(ctx, 'brickG')}"/>`
    + `<path d="${Array.from({ length: Math.floor((478 - top) / 10) }, (_, i) => `M${x0} ${top + 10 + i * 10}h${w}`).join('')}" stroke="${K.brickDeep}" stroke-width=".8" opacity=".55"/>`
    + `<rect x="${x0 - 3}" y="${top - 6}" width="${w + 6}" height="8" rx="1.5" fill="${K.stone}"/><path d="M${x0 - 2} ${top - 5.4}h${w + 4}" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`
    + `<rect x="${x0}" y="${top + 2}" width="3" height="${474 - top}" fill="${C.cutRim}" opacity=".12"/>`, `<rect x="${x0 - 3}" y="${top - 6}" width="${w + 6}" height="${484 - top}"/>`);
  const garden = azaleas(ctx, 326, PAGE_W + 20, 456, 30, 97, 3) + campusLamp(ctx, 376, 362, 456, { glow: 0.14 });
  return campusDefs(ctx) + standingPage(ctx, back) + floor + garden + post(240, 16, 396) + post(306, 24, 356)
    + royalPalm(ctx, 44, 470, 280, { s: 1.2, tone: 'near', seed: 98, z: 3 }) + bookCues(ctx) + block();
};

// ——— 3-5 「總圖書館」 ———

/** A tall arched window onto the night: the sky, pinholes, palms' silhouettes, a glassine sheen and a wooden frame. */
function archWindow(ctx: KitCtx, x: number, y: number, w: number, h: number, seed: number, moon = false): string {
  const id = ctx.id(`arch${seed}`);
  const d = `M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z`;
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'sky')}"/>` + pinholes(ctx, x, y, w, h * 0.5, Math.round(w / 6), seed)
    + (moon ? calmMoon(ctx, x + w * 0.62, y + w * 0.5, 9, { cloud: false, halo: 0.06 }) : '')
    + royalPalm(ctx, x + w * 0.3, y + h, y + h * 0.4, { s: 0.55, tone: 'far', seed: seed + 3, z: 1 })
    + `<path d="M${x} ${y + h * 0.7}L${x + w * 0.6} ${y}H${x + w * 0.8}L${x} ${y + h}Z" fill="${C.cutRim}" opacity=".06"/></g>`
    + `<path d="${d}" fill="none" stroke="${ref(ctx, 'woodK')}" stroke-width="5"/><path d="M${x + w / 2} ${y}V${y + h}M${x} ${y + h * 0.55}H${x + w}" stroke="${K.shelfWoodDeep}" stroke-width="2"/>`;
}

/** A wall bookcase from x0 to x1, top to foot: a wooden frame and shelves of books. */
function bookcase(ctx: KitCtx, x0: number, x1: number, top: number, foot: number, seed: number, z: 1 | 2 | 3 = 2): string {
  const rows = Math.max(2, Math.round((foot - top - 10) / 30));
  const rh = (foot - top - 10) / rows;
  let books = '';
  let boards = '';
  for (let i = 0; i < rows; i++) {
    const y = top + 8 + (i + 1) * rh;
    books += bookRow(x0 + 4, x1 - 4, y - 2, rh - 8, seed + i);
    boards += `<rect x="${x0 + 2}" y="${f1(y - 2)}" width="${x1 - x0 - 4}" height="4" fill="${K.shelfWood}"/>`;
  }
  return depth(ctx, z, `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="${foot - top}" fill="${ref(ctx, 'woodH')}"/>`
    + `<rect x="${x0 + 4}" y="${top + 6}" width="${x1 - x0 - 8}" height="${foot - top - 10}" fill="${mixHex(K.shelfWoodDeep, C.shadow, 0.45)}"/>`
    + books + boards + `<rect x="${x0 - 2}" y="${top}" width="${x1 - x0 + 4}" height="7" fill="${K.shelfWoodLight}"/><path d="M${x0} ${top + 0.6}H${x1}" stroke="${C.cutRim}" stroke-width="1" opacity=".35"/>`,
  `<rect x="${x0 - 2}" y="${top}" width="${x1 - x0 + 4}" height="${foot - top}"/>`);
}

/** A green-shaded reading lamp (a banker's lamp) on a table at (x, y): the warm pool it casts. */
function readingLamp(ctx: KitCtx, x: number, y: number, s = 1): string {
  const k = (n: number) => f1(n * s);
  return softEllipse(ctx, x, y + 2 * s, 40 * s, 12 * s, 'lamp', 0.3)
    + depth(ctx, 3, `<rect x="${f1(x - 1 * s)}" y="${f1(y - 14 * s)}" width="${k(2)}" height="${k(14)}" fill="${ref(ctx, 'foilH')}"/><ellipse cx="${x}" cy="${y}" rx="${k(7)}" ry="${k(2.2)}" fill="${C.goldDeep}"/>`
      + `<path d="M${f1(x - 13 * s)} ${f1(y - 13 * s)}Q${x} ${f1(y - 24 * s)} ${f1(x + 13 * s)} ${f1(y - 13 * s)}Z" fill="${K.readingLamp}"/>`
      + `<path d="M${f1(x - 11 * s)} ${f1(y - 15 * s)}Q${x} ${f1(y - 23 * s)} ${f1(x + 6 * s)} ${f1(y - 19 * s)}" stroke="${K.readingLampLit}" stroke-width="${k(1.2)}" fill="none"/>`
      + `<path d="M${f1(x - 13 * s)} ${f1(y - 13 * s)}H${f1(x + 13 * s)}" stroke="${C.lampHot}" stroke-width="${k(1.6)}"/>`, `<path d="M${f1(x - 13 * s)} ${f1(y - 13 * s)}Q${x} ${f1(y - 24 * s)} ${f1(x + 13 * s)} ${f1(y - 13 * s)}Z"/>`);
}

/**
 * 3-5: the stack room of the 總圖書館 by night. The back wall: two tall arched windows onto the
 * palms and the moon, wall bookcases between them, pendant lamps; the gallery the back of the
 * stacks runs along (the live ledge at y 300). The mobile shelves are the parts (x 109–287, y
 * 300–470) on their floor rails; the book cart in aisle 2 (`cart`, its top at (168, 420)) shows when
 * the aisle is open. In front, the returns desk 「還書」 splits the floor between the two runs
 * (x 164–204); a reading table with its green lamp by the far window, where the bead waits.
 */
const stacks: BackdropDraw = (ctx) => {
  const wall = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${mixHex(K.stone, K.roof, 0.62)}"/>`
    + paperFibres(-20, 0, PAGE_W + 40, GUTTER_Y, 40, K.stoneShade, 101, 0.18)
    // The coffered ceiling band and the wood wainscot
    + `<rect x="-20" y="0" width="${PAGE_W + 40}" height="22" fill="${K.shelfWoodDeep}"/><path d="${Array.from({ length: 12 }, (_, i) => `M${-10 + i * 36} 0v22`).join('')}" stroke="${K.shelfWood}" stroke-width="2"/>`
    + `<rect x="-20" y="${GUTTER_Y - 56}" width="${PAGE_W + 40}" height="56" fill="${ref(ctx, 'woodK')}"/><rect x="-20" y="${GUTTER_Y - 60}" width="${PAGE_W + 40}" height="5" fill="${K.shelfWoodLight}"/>`;
  const windows = archWindow(ctx, 6, 60, 54, 150, 102, false) + archWindow(ctx, 320, 54, 60, 160, 103, true)
    // The great lunette over the stacks: the night and the palms behind the shelves, so they stand out
    + archWindow(ctx, 112, 44, 166, 214, 104, false);
  // A clock over the lunette's keystone, its hands at 01:20
  const shelvesBack = depth(ctx, 2, `<circle cx="195" cy="34" r="11" fill="${C.washi}"/><circle cx="195" cy="34" r="11" fill="none" stroke="${C.goldDeep}" stroke-width="1.6"/>`
    + `<path d="M195 34l2 -6M195 34l7 3" stroke="${C.ink}" stroke-width="1.4" stroke-linecap="round"/>`, `<circle cx="195" cy="34" r="12"/>`);
  // Pendant lamps from the ceiling
  const pendant = (x: number, y: number) => `<path d="M${x} 22V${y - 8}" stroke="${K.ironPost}" stroke-width="1.4"/>`
    + softEllipse(ctx, x, y + 6, 22, 14, 'lamp', 0.22, 'blur8')
    + `<path d="M${x - 11} ${y + 4}Q${x} ${y - 12} ${x + 11} ${y + 4}Z" fill="${K.readingLamp}"/><ellipse cx="${x}" cy="${y + 4}" rx="9" ry="2.4" fill="${C.lampHot}"/>`;
  const back = wall + windows + shelvesBack + pendant(130, 50) + pendant(260, 50)
    // The gallery's balustrade along the back of the stacks (its floor is the live ledge at y 300)
    + depth(ctx, 2, `<rect x="70" y="270" width="242" height="5" fill="${K.shelfWoodLight}"/><path d="${Array.from({ length: 16 }, (_, i) => `M${76 + i * 15} 275V300`).join('')}" stroke="${K.shelfWood}" stroke-width="3"/>`, `<rect x="70" y="270" width="242" height="30"/>`)
    + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'lampWashK')}"/>`;
  // The floor page: a herringbone parquet, the shelves' floor rails, pools under the lamps
  const parquet = (() => {
    const { x, y, w, h } = FLOOR_RECT;
    let d = '';
    for (let yy = y + 4; yy < y + h; yy += 10) {
      const off = ((yy - y) / 10) % 2 ? 8 : 0;
      for (let xx = x - 10 + off; xx < x + w; xx += 16) d += `M${f1(xx)} ${f1(yy)}l8 5M${f1(xx + 8)} ${f1(yy + 5)}l8 -5`;
    }
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'deskTop')}"/><path d="${d}" stroke="${K.shelfWoodDeep}" stroke-width=".8" opacity=".35"/>`
      + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}" opacity=".5"/>`;
  })();
  const floor = floorPage(ctx, parquet
    + `<path d="M50 470H304M50 478H304" stroke="${T.steelDeep}" stroke-width="2.4"/><path d="M50 469H304" stroke="${T.steel}" stroke-width=".8" opacity=".7"/>`
    + pools(ctx, [[130, 420, 70, 18], [262, 420, 70, 18], [350, 470, 60, 18]]));
  // The book cart in aisle 2 (its top at (168, 420)): two shelves of books on castors
  const cart = depth(ctx, 3, `<rect x="150" y="420" width="36" height="5" rx="1" fill="${K.shelfWoodLight}"/><rect x="150" y="436" width="36" height="4" fill="${K.shelfWood}"/>`
    + `<path d="M152 420V444M184 420V444" stroke="${K.shelfWoodDeep}" stroke-width="2.4"/>` + bookRow(152, 184, 436, 12, 105)
    + `<circle cx="155" cy="447" r="3" fill="${C.printDark}"/><circle cx="181" cy="447" r="3" fill="${C.printDark}"/>`, `<rect x="150" y="420" width="36" height="30"/>`);
  // The returns desk between the two front runs: a wooden counter, its plaque, books waiting on it
  const desk = depth(ctx, 4, `<rect x="160" y="482" width="48" height="70" fill="${ref(ctx, 'woodH')}"/><rect x="156" y="476" width="56" height="8" rx="2" fill="${K.shelfWoodLight}"/>`
    + `<path d="M164 500h40v44h-40z" fill="none" stroke="${K.shelfWoodDeep}" stroke-width="1.4"/>`
    + `<rect x="170" y="506" width="28" height="13" rx="2" fill="${C.washi}"/>`, `<rect x="156" y="476" width="56" height="76"/>`)
    + `<text data-art-text="" x="184" y="516" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8.5" fill="${K.shelfWoodDeep}" letter-spacing="1">還書</text>`
    + bookStack(ctx, 166, 476, 22, [[5, 0, K.bookBlue], [4, 2, K.bookRed], [5, -1, C.kraft]], 4);
  // The reading table by the far window, its green lamp (the bead waits beside it at (350, 500))
  const table = depth(ctx, 3, `<rect x="300" y="400" width="100" height="6" rx="2" fill="${K.shelfWoodLight}"/><path d="M308 406V456M392 406V456" stroke="${K.shelfWoodDeep}" stroke-width="4"/>`, `<rect x="300" y="400" width="100" height="56"/>`)
    + readingLamp(ctx, 372, 400) + bookStack(ctx, 312, 400, 30, [[5, 0, K.bookGreen], [4, 3, K.bookTan]], 3);
  return campusDefs(ctx) + standingPage(ctx, back) + floor + table + cart + desk + bookcase(ctx, -20, 46, 120, 470, 106, 3) + bookCues(ctx) + block();
};

// ——— 3-6 「藍教授的書」 (spread) ———

/**
 * 3-6, the centrefold: 藍教授's corner of the library at night. The standing page is a reading room
 * wall: bookcases either side of a tall arched window (the moon and the palms outside) on the left
 * page, a map of the campus and shelves with a globe on the right. The floor page is the great desk:
 * the brass reading lamp on its left (Mocha's `lamp`, the shade's top at (44, 286)), the giant open
 * book lying across the middle (its two pages; the flaps are cut in them), and the tall stack of
 * books beside 藍教授's (`near`, its top at (296, 380)). The spine's crease is drawn live.
 */
const bookSpread: BackdropDraw = (ctx) => {
  const wall = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${mixHex(K.shelfWoodDeep, K.roof, 0.45)}"/>`
    + paperFibres(-20, 0, PAGE_W + 40, GUTTER_Y, 40, K.shelfWood, 111, 0.2);
  const back = wall + bookcase(ctx, -20, 60, 30, GUTTER_Y, 112, 2) + archWindow(ctx, 82, 50, 76, 196, 113, true)
    + bookcase(ctx, 172, 230, 30, GUTTER_Y, 114, 2)
    // The campus map on the right page: 椰林大道 and 醉月湖 in a frame
    + depth(ctx, 2, `<rect x="250" y="60" width="104" height="78" fill="${K.shelfWoodLight}"/><rect x="255" y="65" width="94" height="68" fill="${C.washi}"/>`
      + `<path d="M262 128L302 72L342 128" stroke="${K.paver}" stroke-width="5" fill="none"/><ellipse cx="324" cy="112" rx="14" ry="7" fill="${K.lakeLight}"/>`
      + `<path d="${Array.from({ length: 6 }, (_, i) => `M${f1(270 + i * 6.5)} ${f1(118 - i * 8)}v-4M${f1(334 - i * 6.5)} ${f1(118 - i * 8)}v-4`).join('')}" stroke="${K.palm}" stroke-width="2.6" stroke-linecap="round"/>`
      + `<rect x="296" y="66" width="12" height="7" fill="${K.brick}"/>`, `<rect x="250" y="60" width="104" height="78"/>`)
    + bookcase(ctx, 248, 410, 170, GUTTER_Y, 115, 2)
    // A globe on the shelf's top, a little brass
    + depth(ctx, 3, `<circle cx="372" cy="146" r="17" fill="${K.lakeLight}"/><path d="M362 136q8 4 6 12q-6 4 -2 10M378 134q-4 8 4 12" stroke="${K.palm}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      + `<path d="M354 146a18 18 0 0 0 36 0" stroke="${ref(ctx, 'foilH')}" stroke-width="1.6" fill="none"/><path d="M372 164v6M364 171h16" stroke="${C.goldDeep}" stroke-width="2.4"/>`, `<circle cx="372" cy="146" r="17"/>`)
    + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'lampWashK')}"/>`;
  // The desk's top on the floor page, its grain, a sheet of notes, a pencil
  const desk = (() => {
    const { x, y, w, h } = FLOOR_RECT;
    const r = seeded(116);
    let grainD = '';
    for (let i = 0; i < 26; i++) {
      const yy = y + 6 + r() * h;
      grainD += `M${x} ${f1(yy)}q${f1(w * 0.3)} ${f1((r() - 0.5) * 6)} ${f1(w)} ${f1((r() - 0.5) * 4)}`;
    }
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'deskTop')}"/><path d="${grainD}" stroke="${K.shelfWoodDeep}" stroke-width=".9" fill="none" opacity=".35"/>`
      + `<rect x="${x}" y="${y}" width="${w}" height="26" fill="${C.shadow}" opacity=".22"/>`;
  })();
  // The giant open book lying across the desk: two pages curling up from the spine, text lines
  const book = (() => {
    const left = `M112 482V398Q140 384 196 392V482Z`;
    const right = `M196 482V392Q252 384 288 398V482Z`;
    let text = '';
    for (let i = 0; i < 8; i++) {
      const y = 404 + i * 9;
      text += `M${i < 5 ? 122 : 122} ${y}H${i === 7 ? 160 : 186}M206 ${y}H${i === 3 ? 240 : 278}`;
    }
    return depth(ctx, 3, `<path d="M108 486V402Q140 388 196 396Q252 388 292 402V486Z" fill="${K.pageEdgeShade}"/>`
      + `<path d="${left}" fill="${C.washi}"/><path d="${right}" fill="${mixHex(C.washi, K.pageEdge, 0.5)}"/>`
      + `<path d="${text}" stroke="${C.inkSoft}" stroke-width="1.6" opacity=".35" stroke-linecap="round"/>`
      + `<path d="M196 392V482" stroke="${K.pageEdgeShade}" stroke-width="2"/><rect x="186" y="392" width="20" height="90" fill="${C.shadow}" opacity=".1"/>`
      + `<path d="M112 398Q140 384 196 392Q252 384 288 398" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".5"/>`
      // The red ribbon bookmark trailing from the spine
      + `<path d="M196 392L188 470l6 -4l4 6z" fill="${K.bookRed}"/>`, `<path d="M108 486V402Q140 388 196 396Q252 388 292 402V486Z"/>`);
  })();
  const notes = depth(ctx, 3, `<path d="M28 520l52 -6l6 40l-52 6z" fill="${C.washi}"/><path d="M36 528l38 -4M37 536l38 -4M38 544l30 -3" stroke="${C.inkSoft}" stroke-width="1" opacity=".4"/>`, `<path d="M28 520l52 -6l6 40l-52 6z"/>`)
    + depth(ctx, 3, `<path d="M300 600l60 -16" stroke="${K.bookRed}" stroke-width="4" stroke-linecap="round"/><path d="M360 584l6 -2" stroke="${K.pageEdge}" stroke-width="4"/>`, `<path d="M300 600l66 -18" stroke="#000" stroke-width="4"/>`);
  // The brass reading lamp, its green shade's top at (44, 286) (Mocha's `lamp`), its pool on the desk
  const lamp = softEllipse(ctx, 44, 470, 80, 22, 'lamp', 0.36)
    + depth(ctx, 3, `<ellipse cx="44" cy="474" rx="20" ry="5" fill="${C.goldDeep}"/><rect x="42" y="306" width="4" height="168" fill="${ref(ctx, 'foilH')}"/><path d="M44 336l-10 6v10" stroke="${C.goldDeep}" stroke-width="1.6" fill="none"/>`
      + `<path d="M24 306Q24 286 44 286Q64 286 64 306Z" fill="${K.readingLamp}"/><path d="M28 300Q30 290 44 289" stroke="${K.readingLampLit}" stroke-width="1.6" fill="none"/>`
      + `<path d="M24 306H64" stroke="${C.lampHot}" stroke-width="2.4"/>`, `<ellipse cx="44" cy="474" rx="20" ry="5"/><path d="M24 306Q24 286 44 286Q64 286 64 306Z"/>`)
    + softEllipse(ctx, 44, 312, 24, 8, 'lamp', 0.45);
  // The tall stack beside 藍教授's (its top at (296, 380), Mocha's `near`)
  const tall = bookStack(ctx, 280, 474, 34, [[16, 0, K.bookBlue], [12, 2, K.bookRed], [14, -1, C.kraft], [11, 3, K.bookGreen], [15, 0, K.bookPlum], [12, 2, K.bookTan], [14, 1, K.bookBlue]], 3);
  const floor = floorPage(ctx, desk + pools(ctx, [[300, 470, 90, 22, 'moon']]));
  return campusDefs(ctx) + standingPage(ctx, back) + floor + notes + book + tall + lamp + bookCues(ctx) + block();
};

export const C3_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'c3/green-car': greenCar,
  'c3/palm-avenue': palmAvenue,
  'c3/lake': lake,
  'c3/fu-bell': fuBell,
  'c3/stacks': stacks,
  'c3/book-spread': bookSpread,
};

// ——— Chapter 3's parts ———

/** 3-1's car doors: 2-1's steel doors on the 松山新店線's green band (`carDoors`). */
const doors = carDoors(K.songshan, K.songshanDeep);

// 3-2's bikes

/** Where a bike's wheels sit per state, in its part's local space (origin at the hit centre). */
const BIKE_Y: Readonly<Record<string, number>> = { path: 18, rack: -32 };

/** The rack's hoop where a bike parks: an iron staple on a little concrete foot, drawn in both states so the slot reads. */
const rackHoop = `<path d="M-24 -12V-36q0 -10 10 -10h28q10 0 10 10V-12" stroke="${K.ironPost}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`
  + `<path d="M-23 -36q0 -9 9 -9h28" stroke="${K.ironPostLit}" stroke-width="1" fill="none" opacity=".8"/>`
  + `<rect x="-30" y="-14" width="60" height="5" rx="2" fill="${K.curb}"/>`;

/**
 * A campus bike, side on, facing +x (the student's 菜籃車): two spoked wheels, a step-through frame
 * in `frame`, a saddle, swept handlebars and a wire basket in front; `extra` (the delivery box) over
 * its rear rack. Wheel centres at y `wy`.
 */
function bike(ctx: KitCtx, wy: number, frame: string, extra = ''): string {
  const wheel = (x: number) => `M${x - 12} ${wy}a12 12 0 1 0 24 0a12 12 0 1 0 -24 0z`;
  const spokes = (x: number) => `M${x - 9} ${wy}H${x + 9}M${x} ${wy - 9}V${wy + 9}M${x - 6} ${wy - 6}L${x + 6} ${wy + 6}M${x - 6} ${wy + 6}L${x + 6} ${wy - 6}`;
  // A step-through frame: the down tube swoops low between the wheels
  const body = `M-18 ${wy}L-8 ${wy - 22}M-8 ${wy - 22}Q-4 ${wy - 2} 4 ${wy}L14 ${wy - 24}M4 ${wy}L18 ${wy}M-18 ${wy}H4`;
  const basket = `M18 ${wy - 30}h14l-2 12h-10z`;
  const outline = `<path d="${wheel(-18)}${wheel(18)}"/><path d="M-12 ${wy - 32}h12v6h-12z${basket}"/>`;
  return softEllipse(ctx, 0, wy + 13, 34, 3.2, 'shadow', 0.4)
    + depth(ctx, 2, `<path d="${wheel(-18)}${wheel(18)}" fill="none" stroke="${C.printDark}" stroke-width="3.6"/>`
      + `<path d="${spokes(-18)}${spokes(18)}" stroke="${T.steel}" stroke-width=".8" opacity=".8"/>`
      + `<path d="M-30 ${wy - 6}a12 12 0 0 1 24 0M6 ${wy - 6}a12 12 0 0 1 24 0" stroke="${frame}" stroke-width="2.4" fill="none" opacity=".9"/>`
      + `<path d="${body}" stroke="${frame}" stroke-width="3.2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`
      + `<path d="M-8 ${wy - 22}l-2 -6M14 ${wy - 24}l2 -6" stroke="${C.printDark}" stroke-width="2.4"/>`
      + `<path d="M-15 ${wy - 31}h11a3 3 0 0 1 0 6h-11z" fill="${C.printDark}"/>`
      + `<path d="M8 ${wy - 31}q8 -3 14 1" stroke="${C.printDark}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
      + `<path d="${basket}" fill="none" stroke="${T.steel}" stroke-width="1.4"/><path d="M21 ${wy - 30}l1 12M25 ${wy - 30}v12M29 ${wy - 30}l-1 12M19 ${wy - 24}h12" stroke="${T.steel}" stroke-width=".8"/>`
      + `<path d="M-6 ${wy - 22}H12" stroke="${C.cutRim}" stroke-width=".8" opacity=".4"/>`
      + extra, outline);
}

/**
 * 3-2's parked bikes (`slider` `path` / `rack`; the knob is the handlebar grip the player pulls):
 * across the path in front of the palms, or pushed back into the rack's hoop. A lake-blue frame.
 */
const campusBike: PartSource = {
  preset: 'slider',
  states: ['path', 'rack'],
  box: { x: -46, y: -66, w: 92, h: 116 },
  draw: (ctx, state) => rackHoop + bike(ctx, BIKE_Y[state] ?? BIKE_Y.path, K.lakeLight),
};

/**
 * 3-2's middle bike, the 店員小哥's delivery bike (`slider` with no input: its neighbours shove it):
 * an azalea-pink frame with his shop's red delivery box on the rear rack (外送, a cream stripe).
 * Mocha's `seat` perch is its saddle.
 */
const deliveryBike: PartSource = {
  preset: 'slider',
  states: ['path', 'rack'],
  box: { x: -46, y: -78, w: 92, h: 128 },
  draw(ctx, state) {
    const wy = BIKE_Y[state] ?? BIKE_Y.path;
    const box = `<rect x="-34" y="${wy - 50}" width="26" height="22" rx="3" fill="${T.clerkCap}"/><rect x="-34" y="${wy - 44}" width="26" height="5" fill="${T.awningCream}"/>`
      + `<path d="M-33 ${wy - 49}h24" stroke="${C.cutRim}" stroke-width="1" opacity=".45"/>`
      + `<text data-art-text="" x="-21" y="${wy - 31.5}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7" fill="${T.awningCream}">外送</text>`
      + `<path d="M12 ${wy - 32}l3 -3" stroke="${T.steel}" stroke-width="1.6"/><circle cx="16" cy="${wy - 36}" r="2.6" fill="${T.steel}"/>`;
    return rackHoop + bike(ctx, wy, K.azaleaDeep, box);
  },
};

// 3-4's bell-rope, plate and garden gate

/**
 * 3-4's bell-rope (a `tab`, 拉): the 傅鐘's rope from the clapper (page (158, 226)) down to the
 * marigold card the player pulls, which stands on the track from (108, 300) to (108, 380). Local
 * origin at the hit centre (108, 340). `up`: the rope hangs slack; `down`: pulled taut, and the bell
 * rings 「噹！」 (chalk lines round it).
 */
const bellRope: PartSource = {
  preset: 'tab',
  states: ['up', 'down'],
  box: { x: -16, y: -150, w: 106, h: 156 },
  draw(ctx, state) {
    const down = state === 'down';
    const end = down ? -6 : -86;
    const d = down ? `M50 -112Q30 -60 0 ${end}` : `M50 -112Q40 -84 22 -92Q6 -98 0 ${end}`;
    const rope = `<path d="${d}" stroke="${K.ropeDeep}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`
      + `<path d="${d}" stroke="${K.rope}" stroke-width="2" fill="none" stroke-dasharray="2.4 2" stroke-linecap="round"/>`
      + `<circle cx="50" cy="-112" r="2.6" fill="${K.ropeDeep}"/>`;
    const ring = down
      ? `<g stroke="${C.chalk}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"><path d="M24 -132q-6 6 -2 14M18 -138q-10 10 -2 24M76 -132q6 6 2 14M82 -138q10 10 2 24"/></g>`
        + `<text data-art-text="" x="84" y="-142" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="11" fill="${C.chalk}">噹！</text>`
      : '';
    return depth(ctx, 3, rope, `<path d="${d}" stroke="#000" stroke-width="3.6" fill="none"/>`) + ring;
  },
};

/**
 * 3-4's gate plate (a weight `button` in the paving before the garden gate): a square bronze plaque
 * set in a stone surround, engraved with a little bell; pressed down (`down`) it sinks and darkens.
 * Local origin at its hit centre (220, 498).
 */
const gatePlate: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -34, y: -16, w: 68, h: 32 },
  draw(ctx, state) {
    const down = state === 'down';
    const slab = 'M-28 -8L-20 -12H20L28 -8V6H-28Z';
    const plaque = down ? 'M-17 -7.4L-12 -9.6H12L17 -7.4V2H-17Z' : 'M-17 -8.6L-12 -10.8H12L17 -8.6V1H-17Z';
    return depth(ctx, down ? 1 : 2, `<path d="${slab}" fill="${K.stoneShade}"/><path d="M-28 -8L-20 -12H20L28 -8Z" fill="${K.stone}"/>`
      + `<path d="${plaque}" fill="${down ? K.bronzeDeep : ref(ctx, 'bronzeG')}"/>`
      + `<path d="M-3 ${down ? -3 : -4}q0 -4 3 -4q3 0 3 4l1 2h-8z" fill="none" stroke="${C.goldDeep}" stroke-width="1" opacity=".8"/>`
      + `<path d="M-27 -7.6H27" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`, `<path d="${slab}"/>`);
  },
};

/**
 * 3-4's garden gate (a `gate`, opened by the plate and staying open): a pair of wrought-iron leaves
 * with scrolled tops and spear finials between the brick posts; open, the leaves are swung back into
 * the garden (narrow, foreshortened) and the garden's lamplight spills through. Local origin at the
 * hit centre (282, 441): the posts' inner faces at x ±24, the gate's foot at y 37.
 */
const gardenGate: PartSource = {
  preset: 'gate',
  states: ['closed', 'open'],
  box: { x: -30, y: -64, w: 60, h: 108 },
  draw(ctx, state) {
    const foot = 37;
    const top = -44;
    const leafD = (x0: number, x1: number, k = 1) => {
      let bars = '';
      const n = 4;
      for (let i = 1; i < n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        bars += `M${f1(x)} ${foot - 3}V${f1(top + 6 * k)}`;
      }
      const arch = `M${x0} ${top + 10}Q${f1((x0 + x1) / 2)} ${f1(top - 4)} ${x1} ${top + 10}`;
      const spears = Array.from({ length: n - 1 }, (_, i) => {
        const x = x0 + ((x1 - x0) * (i + 1)) / n;
        return `M${f1(x - 1.8)} ${f1(top + 6 * k)}l1.8 -5l1.8 5z`;
      }).join('');
      return `<path d="M${x0} ${foot - 3}V${top + 10}M${x1} ${foot - 3}V${top + 10}${bars}M${x0} ${foot - 8}H${x1}M${x0} ${foot - 30}H${x1}" stroke="${K.ironPost}" stroke-width="2.4" fill="none"/>`
        + `<path d="${arch}" stroke="${K.ironPost}" stroke-width="2.4" fill="none"/><path d="${spears}" fill="${K.ironPost}"/>`
        + `<path d="M${f1((x0 + x1) / 2 - 4)} ${foot - 22}q4 -6 8 0q-4 6 -8 0z" fill="none" stroke="${K.ironPostLit}" stroke-width="1.2"/>`
        + `<path d="M${x0 + 1} ${foot - 3}V${top + 10}" stroke="${K.ironPostLit}" stroke-width=".8" opacity=".7"/>`;
    };
    if (state === 'open') {
      return softEllipse(ctx, 0, foot - 4, 26, 8, 'lamp', 0.3)
        + depth(ctx, 3, `<g transform="translate(-24 0) scale(.28 1)">${leafD(0, 24)}</g><g transform="translate(24 0) scale(-.28 1)">${leafD(0, 24)}</g>`,
          `<rect x="-24" y="${top - 6}" width="7" height="${foot - top + 4}"/><rect x="17" y="${top - 6}" width="7" height="${foot - top + 4}"/>`);
    }
    return depth(ctx, 3, leafD(-24, 0) + leafD(0, 24) + `<rect x="-3" y="${foot - 32}" width="6" height="8" rx="1" fill="${K.ironPostLit}"/>`,
      `<rect x="-24" y="${top - 8}" width="48" height="${foot - top + 6}"/>`);
  },
};

// 3-5's mobile shelves

/**
 * A mobile shelf unit, side by side with its neighbours (the 總圖's compact shelving): a tall
 * wooden case with five rows of cloth and kraft spines, a cream label holder on its cap, its feet on
 * the floor rails. `top` and `bottom` are its local y extent; `dx` where it stands in this state.
 */
function shelfUnit(ctx: KitCtx, dx: number, top: number, bottom: number, seed: number): string {
  const w = 34;
  const x0 = dx - w / 2;
  const rows = 5;
  const rh = (bottom - top - 12) / rows;
  let books = '';
  let boards = '';
  for (let r = 0; r < rows; r++) {
    const y = top + 8 + (r + 1) * rh;
    books += bookRow(x0 + 3, x0 + w - 3, y - 2.6, rh - 5, seed + r * 7, { gaps: 0.04 });
    boards += `<rect x="${x0 + 2}" y="${f1(y - 2.6)}" width="${w - 4}" height="2.8" fill="${K.shelfWood}"/>`;
  }
  const body = `<rect x="${x0}" y="${top}" width="${w}" height="${bottom - top}" rx="2"/>`;
  return softEllipse(ctx, dx, bottom + 3, 22, 3, 'shadow', 0.45)
    + depth(ctx, 3, `<rect x="${x0}" y="${top}" width="${w}" height="${bottom - top}" rx="2" fill="${ref(ctx, 'woodH')}"/>`
      + `<rect x="${x0 + 2.5}" y="${top + 6}" width="${w - 5}" height="${bottom - top - 9}" fill="${mixHex(K.shelfWoodDeep, C.shadow, 0.4)}"/>` + books + boards
      + `<rect x="${x0 - 1}" y="${top}" width="${w + 2}" height="6" rx="1.5" fill="${K.shelfWoodLight}"/><rect x="${dx - 7}" y="${top + 1.4}" width="14" height="3.4" rx="1" fill="${C.washi}"/>`
      + `<path d="M${x0} ${top + 0.6}h${w}" stroke="${C.cutRim}" stroke-width="1" opacity=".4"/>`
      + `<path d="M${x0 + 4} ${bottom}v4M${x0 + w - 4} ${bottom}v4" stroke="${C.printDark}" stroke-width="3" stroke-linecap="round"/>`, body);
}

/** Half the travel between a shelf's two stops (they stand 24 apart). */
const SHELF_DX: Readonly<Record<string, number>> = { w: -12, e: 12 };

/**
 * 3-5's inner shelves (`slider` with no input: each rolls with its outer neighbour), drawn on their
 * hit area's centre (y 300–470 on the page: local −85 to 85).
 */
const shelf: PartSource = {
  preset: 'slider',
  states: ['w', 'e'],
  box: { x: -34, y: -90, w: 68, h: 184 },
  draw: (ctx, state) => shelfUnit(ctx, SHELF_DX[state] ?? 0, -85, 85, 140),
};

/**
 * 3-5's end shelves (`slider`; the knob is the crank's handle down at the rail): the same unit,
 * drawn from the crank's centre on the rail (local y 0 = page y 544, the shelf at −244 to −74), with
 * its brass crank wheel on the end panel and the rod down to the handle the player turns.
 */
const shelfCrank: PartSource = {
  preset: 'slider',
  states: ['w', 'e'],
  box: { x: -40, y: -250, w: 80, h: 266 },
  draw(ctx, state) {
    const dx = SHELF_DX[state] ?? 0;
    const crank = `<circle cx="${dx}" cy="-120" r="9.5" fill="none" stroke="${C.goldDeep}" stroke-width="2.6"/><circle cx="${dx}" cy="-120" r="9.5" fill="none" stroke="${C.foilShine}" stroke-width=".8" opacity=".5"/>`
      + `<path d="M${dx - 9} -120H${dx + 9}M${dx} -129V-111" stroke="${C.goldDeep}" stroke-width="1.6"/><circle cx="${dx}" cy="-120" r="2.4" fill="${C.goldDeep}"/>`
      + `<path d="M${dx} -111V-20" stroke="${K.shelfWoodDeep}" stroke-width="2" stroke-dasharray="2 4" opacity=".7"/>`;
    return shelfUnit(ctx, dx, -244, -74, 150) + crank;
  },
};

// 3-6's pages: the giant book's flaps pop up (`popFlap`, D-78)

/** A printed page patch: cream paper, lines of text, an inked picture (`pic`), a page number. */
function pagePatch(w: number, h: number, pic: string, n: number): string {
  let lines = '';
  for (let y = 6; y < h - 6; y += 5) if (y < h * 0.3 || y > h * 0.78) lines += `M4 ${y}H${y % 2 ? w - 8 : w - 4}`;
  return `<rect width="${w}" height="${h}" fill="${C.washi}"/><path d="${lines}" stroke="${C.inkSoft}" stroke-width="1" opacity=".3"/>${pic}`
    + `<text data-art-text="" x="${w / 2}" y="${h - 2}" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="4.5" fill="${C.inkSoft}" opacity=".6">${n}</text>`;
}

/** 3-6's `flapA`, the bookmark page: closed, a page with the red ribbon on it; open, it folds out flat over the gap to the stack (x 282–310), a bridge. */
const pageBookmark = popFlap([266, 448, 56, 56],
  (w, h) => pagePatch(w, h, `<path d="M${w * 0.6} 0V${h * 0.7}l-4 -4l-4 4V0z" fill="${K.bookRed}"/>`, 214),
  (ctx) => {
    const sheet = 'M274 478L318 476L320 490L276 492Z';
    return softEllipse(ctx, 297, 494, 26, 3.4, 'shadow', 0.4)
      + depth(ctx, 3, `<path d="${sheet}" fill="${C.washi}"/><path d="M280 482l34 -1.4M281 486l30 -1.2" stroke="${C.inkSoft}" stroke-width=".9" opacity=".3"/>`
        + `<path d="M298 477l2 18" stroke="${K.bookRed}" stroke-width="5"/><path d="M276 478.4L318 476.4" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<path d="${sheet}"/>`);
  },
  { x: 270, y: 470, w: 54, h: 30 });

/**
 * 3-6's `flapB`, the page he sits on: closed, a page with a little bridge drawn on it; turned, it
 * stands up as a great arched page from the lamp to the stack beside 藍教授 (Mocha's bridge; the
 * 土地公 is printed on it, drawn live at (226, 330)).
 */
const pageBridge = popFlap([198, 384, 56, 56],
  (w, h) => pagePatch(w, h, `<path d="M4 ${h * 0.66}Q${w / 2} ${h * 0.34} ${w - 4} ${h * 0.66}" stroke="${K.bookBlue}" stroke-width="2.4" fill="none"/>`
    + `<path d="M8 ${h * 0.6}v6M${w / 2} ${h * 0.46}v8M${w - 8} ${h * 0.6}v6" stroke="${K.bookBlue}" stroke-width="1.2"/>`, 215),
  (ctx) => {
    const top = 'M54 300Q160 214 300 378';
    const under = 'M300 392Q166 236 58 312';
    const sheet = `${top}L300 392Q166 236 58 312Z`;
    let text = '';
    for (let i = 0; i < 9; i++) {
      const t = 0.12 + i * 0.09;
      const x = (1 - t) * (1 - t) * 54 + 2 * t * (1 - t) * 160 + t * t * 300;
      const y = (1 - t) * (1 - t) * 300 + 2 * t * (1 - t) * 214 + t * t * 378;
      text += `M${f1(x - 6)} ${f1(y + 4)}l12 2`;
    }
    return depth(ctx, 3, `<path d="${sheet}" fill="${C.washi}"/><path d="${under}" stroke="${K.pageEdgeShade}" stroke-width="3" fill="none"/>`
      + `<path d="${text}" stroke="${C.inkSoft}" stroke-width="1" opacity=".3"/>`
      + `<path d="${top}" stroke="${C.cutRim}" stroke-width="1.2" fill="none" opacity=".6"/>`, `<path d="${sheet}"/>`);
  },
  { x: 48, y: 230, w: 258, h: 168 });

/**
 * 3-6's `flapC`, the page with a cat in it: closed, a page with a small cat drawn on it; open, the
 * page stands up out of the book as a card with a tabby cat printed on it (its top edge, (146, 360),
 * is where Mocha sits: the 淘氣).
 */
const pageCat = popFlap([118, 384, 56, 56],
  (w, h) => pagePatch(w, h, `<path d="M${w * 0.3} ${h * 0.7}q-2 -10 6 -12l1 -5l3 4h6l3 -4l1 5q8 2 6 12z" fill="${S.catFur}" opacity=".85"/>`, 213),
  (ctx) => {
    const card = 'M124 362H170V438H124Z';
    const cat = 'M134 428q-4 -26 12 -30l2 -10l6 8h8l6 -8l2 10q14 6 10 30z';
    return softEllipse(ctx, 147, 440, 26, 4, 'shadow', 0.4)
      + depth(ctx, 3, `<path d="${card}" fill="${C.washi}"/><path d="M128 368h38M128 373h30" stroke="${C.inkSoft}" stroke-width="1" opacity=".3"/>`
        + `<g transform="translate(-6 0)"><path d="${cat}" fill="${S.catFur}"/><path d="M146 404q8 4 16 0M150 412h8" stroke="${S.catFurDark}" stroke-width="2.4" stroke-linecap="round"/>`
        + `<circle cx="149" cy="398" r="2" fill="${S.catEye}"/><circle cx="159" cy="398" r="2" fill="${S.catEye}"/><path d="M152 402l2 1.6l2 -1.6" stroke="${S.catNose}" stroke-width="1.2" fill="none"/>`
        + `<path d="M178 424q8 -6 2 -16" stroke="${S.catFurDark}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`
        + `<path d="M124 362.6H170" stroke="${C.cutRim}" stroke-width="1.2" opacity=".6"/>`, `<path d="${card}"/>`);
  },
  { x: 118, y: 352, w: 58, h: 92 });

export const C3_PARTS: Readonly<Record<string, PartSource>> = {
  'c3/doors': doors,
  'c3/bike': campusBike,
  'c3/delivery-bike': deliveryBike,
  'c3/bell-rope': bellRope,
  'c3/plate': gatePlate,
  'c3/garden-gate': gardenGate,
  'c3/shelf': shelf,
  'c3/shelf-crank': shelfCrank,
  'c3/page-bookmark': pageBookmark,
  'c3/page-bridge': pageBridge,
  'c3/page-cat': pageCat,
};

// ——— 3-5's 淘氣: Mocha shut in between two shelves ———

/**
 * Mocha squeezed in aisle 2 (3-5's 淘氣 「把摩卡關在兩排書架中間」): over the shut aisle's top, the
 * books his squeeze popped off the shelves tumble, with chalk squeeze lines either side and his
 * unimpressed 「哼。」. A cut-out at (168, 300), the shelves' tops over the aisle, shown only then.
 */
const squeeze: CutoutSource = {
  chapter: 3,
  box: { x: -44, y: -60, w: 88, h: 70 },
  draw(ctx) {
    const book = (x: number, y: number, a: number, c: string) => `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-4" y="-7" width="8" height="14" rx="1" fill="${c}"/><rect x="-2.4" y="-5" width="4.8" height="2" fill="${C.cutRim}" opacity=".35"/></g>`;
    return depth(ctx, 3, book(-14, -24, -30, K.bookRed) + book(10, -36, 24, K.bookGreen) + book(-2, -46, -8, K.bookBlue), `<rect x="-22" y="-56" width="40" height="44"/>`)
      + `<g stroke="${C.chalk}" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".9"><path d="M-30 -6l-8 -4M-30 2h-10M-30 10l-8 4M30 -6l8 -4M30 2h10M30 10l8 4"/></g>`
      + `<text data-art-text="" x="26" y="-26" font-family="'Noto Serif TC'" font-weight="900" font-size="10" fill="${C.chalk}">哼。</text>`;
  },
};

export const C3_CUTOUTS: Readonly<Record<string, CutoutSource>> = {
  'c3/squeeze': squeeze,
};
