import { POPUP as C, POPUP_MARKET as M, POPUP_NEON as N, POPUP_PARK as P, POPUP_STATION as T, mixHex } from '../../../art/palette';
import { depth, f1, filterAttr, pageBlock, pinholes, ref, seeded, skyline, softEllipse, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorWiden } from '../../view/geometry';
import { abeArt, auntieArt, bossArt, vendorArt } from '../../view/art/market';
import type { BackdropDraw, PartSource } from '../sources';
import { neonTube } from './c4';
import { clerk } from './c1';
import { FLOOR_RECT, bookCues, calmMoon, floorPage, lin, paperFibres, rad, shushuPeek, standingPage } from './common';

/**
 * Chapter 5 (士林夜市, 02:20) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#121) drew the steel coins and a first pachinko
 * board; the chapter's art issue (#122) draws the palette kit, the six backdrops and every part.
 *
 * **The kit** (bible § 6 row 5, `POPUP_MARKET`): hot vermilion and bulb amber dominant, steam white
 * the accent — the hottest, warmest pages of the book. **Strings of bulb pinholes** (`bulbString`:
 * a sagging wire, each bulb a warm pinhole with a hot core and a small bloom), **striped awnings**
 * (`awning`: vermilion and cream, scalloped), **corrugated stalls** (`stall`), **vellum steam** rising
 * in loops (`steam`), paper **lanterns**, sign boards in luminous ink (`signBoard`: neon is allowed
 * in 士林, bible § 3.3), the market's sky (`marketSky`) and its lane (`laneFloor`: the calm dark band
 * the play path runs on, wet with the bulbs' reflections). Ledges: `marketLane`, `stallFloor`,
 * `stallShelf`, `stallCounter` (`view/art/ledges.ts`).
 */

/** The page block under the floor page. */
const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};

// ——— The palette kit ———

/** The market's gradient defs, shared by the chapter's backdrops. */
function marketDefs(ctx: KitCtx): string {
  return `<defs>`
    + lin(ctx, 'vermG', [[0, M.vermilionLight], [0.5, M.vermilion], [1, M.vermilionDeep]])
    + lin(ctx, 'laneG', [[0, mixHex(M.laneDeep, C.shadow, 0.3)], [0.4, M.lane], [1, M.laneLight]])
    + lin(ctx, 'smokeG', [[0, mixHex(M.smoke, C.shadow, 0.35)], [1, M.smoke]])
    + lin(ctx, 'woodG', [[0, M.woodLight], [1, M.woodDeep]])
    + lin(ctx, 'tinG', [[0, M.tinLight], [0.5, M.tin], [1, M.tinDeep]], 'h')
    + lin(ctx, 'steelG', [[0, M.tinDeep], [0.35, M.steelWarm], [0.55, C.cutRim], [1, M.tinDeep]], 'h')
    + lin(ctx, 'carDarkG', [[0, mixHex(M.carDark, C.shadow, 0.2)], [0.6, M.carDark], [1, M.carDarkDeep]])
    + lin(ctx, 'leatherG', [[0, M.leatherLight], [1, M.leatherDeep]])
    + lin(ctx, 'tealG', [[0, M.cabinetTeal], [1, M.cabinetTealDeep]])
    + lin(ctx, 'warmWash', [[0, C.lampAmber, 0], [1, C.lampAmber, 0.16]])
    + rad(ctx, 'bulbPool', [[0, C.lamp, 0.42], [0.55, C.lampAmber, 0.14], [1, C.lampAmber, 0]])
    + rad(ctx, 'redPool', [[0, M.vermilionLight, 0.3], [0.6, M.vermilion, 0.08], [1, M.vermilion, 0]])
    + `</defs>`;
}

/** Light pools on the floor page: amber under the bulbs, vermilion under the lanterns and signs. */
const pools = (ctx: KitCtx, list: readonly (readonly [number, number, number, number, ('amber' | 'red')?])[]) =>
  list.map(([cx, cy, rx, ry, tone]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ref(ctx, tone === 'red' ? 'redPool' : 'bulbPool')}"/>`).join('');

const glow = (ctx: KitCtx) => (ctx.filters ? filterAttr(ctx, 'glowS') : '');

/**
 * A string of bulbs (the market's signature: bible § 6 row 5): a dark wire sagging from (x0, y0) to
 * (x1, y1), `n` bulbs hanging off it — each a warm pinhole with a hot core and a little bloom. Unlit
 * (`lit` false), the bulbs are grey glass.
 */
export function bulbString(ctx: KitCtx, x0: number, y0: number, x1: number, y1: number, sag: number, n: number, lit = true): string {
  const pt = (t: number): [number, number] => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + sag * 4 * t * (1 - t)];
  const [mx, my] = pt(0.5);
  let bulbs = '';
  let blooms = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = pt((i + 0.5) / n);
    bulbs += `M${f1(x - 2.6)} ${f1(y + 4)}a2.6 3 0 1 0 5.2 0a2.6 3 0 1 0 -5.2 0z`;
    if (lit) blooms += softEllipse(ctx, x, y + 4, 7, 7, 'lamp', 0.45);
  }
  return `<path d="M${x0} ${y0}Q${f1(2 * mx - (x0 + x1) / 2)} ${f1(2 * my - (y0 + y1) / 2)} ${x1} ${y1}" stroke="${C.printDark}" stroke-width="1" fill="none"/>`
    + blooms + `<path d="${bulbs}" fill="${lit ? C.lamp : M.tinDeep}"/>`
    + (lit ? `<path d="${bulbs}" fill="${C.lampHot}" transform="translate(0 -.6)" opacity=".8"/>` : `<path d="${bulbs}" fill="none" stroke="${M.tinLight}" stroke-width=".6" opacity=".6"/>`);
}

/**
 * A striped awning (bible § 6 row 5: "stall awnings as striped flaps"): vermilion and cream stripes
 * from x0 to x1, its top at `y`, `h` deep, with a scalloped valance along its front edge.
 */
export function awning(ctx: KitCtx, x0: number, x1: number, y: number, h: number, { z = 3 as 2 | 3, stripe = 18 } = {}): string {
  const w = x1 - x0;
  const id = ctx.id(`awn${f1(x0)}${f1(y)}`.replace(/[.-]/g, '_'));
  let stripes = '';
  for (let x = x0; x < x1; x += stripe * 2) stripes += `M${f1(x)} ${y}h${stripe}v${h + 10}h${-stripe}z`;
  let scallops = '';
  for (let x = x0; x < x1 - 0.1; x += stripe) scallops += `M${f1(x)} ${y + h}a${f1(stripe / 2)} ${f1(stripe / 2.4)} 0 0 0 ${stripe} 0z`;
  const shape = `M${x0 - 4} ${y}H${x1 + 4}L${x1} ${y + h}H${x0}Z`;
  return depth(ctx, z, `<clipPath id="${id}"><path d="${shape}"/><path d="${scallops}"/></clipPath><g clip-path="url(#${id})">`
    + `<rect x="${x0 - 4}" y="${y}" width="${w + 8}" height="${h + 12}" fill="${M.awningCream}"/><path d="${stripes}" fill="${ref(ctx, 'vermG')}"/>`
    + `<rect x="${x0 - 4}" y="${y}" width="${w + 8}" height="${f1(h * 0.4)}" fill="${C.shadow}" opacity=".18"/></g>`
    + `<path d="M${x0 - 4} ${y + 0.6}H${x1 + 4}" stroke="${C.cutRim}" stroke-width=".9" opacity=".45"/><path d="M${x0} ${y + h}H${x1}" stroke="${M.vermilionDeep}" stroke-width="1" opacity=".6"/>`,
  `<path d="${shape}"/><path d="${scallops}"/>`);
}

/** Vellum steam rising in loops from (x, y), `h` tall (bible § 6 row 5: steam is the accent). */
export function steam(ctx: KitCtx, x: number, y: number, h: number, s = 1): string {
  const loop = (dx: number, k: number) => `M${f1(x + dx)} ${y}c${f1(-8 * s)} ${f1(-h * 0.2)} ${f1(8 * s)} ${f1(-h * 0.35)} 0 ${f1(-h * 0.5 * k)}s${f1(10 * s)} ${f1(-h * 0.3 * k)} ${f1(2 * s)} ${f1(-h * 0.5 * k)}`;
  return `<g${ctx.filters ? filterAttr(ctx, 'blur3') : ''} opacity=".55"><path d="${loop(-8 * s, 1)}${loop(8 * s, 0.8)}" stroke="${C.vellum}" stroke-width="${f1(5 * s)}" fill="none" stroke-linecap="round"/></g>`
    + `<path d="${loop(-8 * s, 1)}${loop(8 * s, 0.8)}" stroke="${C.vellum}" stroke-width="${f1(1.6 * s)}" fill="none" stroke-linecap="round" opacity=".55"/>`;
}

/** A red paper lantern, lit from inside, its top at (x, top) hung from `hook` above (or none). */
export function lantern(ctx: KitCtx, x: number, top: number, r = 14, hook: number | null = null): string {
  const cy = top + 4 + r * 0.8;
  const body = `M${f1(x - r)} ${f1(cy)}q0 ${f1(-r * 0.8)} ${r} ${f1(-r * 0.8)}q${r} 0 ${r} ${f1(r * 0.8)}q0 ${f1(r * 0.8)} ${-r} ${f1(r * 0.8)}q${-r} 0 ${-r} ${f1(-r * 0.8)}z`;
  return (hook === null ? '' : `<path d="M${x} ${hook}V${top}" stroke="${C.printDark}" stroke-width="1.2"/>`)
    + softEllipse(ctx, x, cy, r * 1.9, r * 1.6, 'lamp', 0.22, 'blur8')
    + depth(ctx, 3, `<path d="${body}" fill="${ref(ctx, 'vermG')}"/>`
      + `<path d="M${f1(x - r * 0.5)} ${f1(cy - r * 0.7)}q${f1(-r * 0.3)} ${f1(r * 0.7)} 0 ${f1(r * 1.4)}M${x} ${f1(cy - r * 0.8)}v${f1(r * 1.6)}M${f1(x + r * 0.5)} ${f1(cy - r * 0.7)}q${f1(r * 0.3)} ${f1(r * 0.7)} 0 ${f1(r * 1.4)}" stroke="${M.vermilionDeep}" stroke-width="1" fill="none"/>`
      + `<ellipse cx="${f1(x - r * 0.25)}" cy="${f1(cy - r * 0.1)}" rx="${f1(r * 0.35)}" ry="${f1(r * 0.5)}" fill="${C.lamp}" opacity=".35"/>`
      + `<rect x="${f1(x - r * 0.5)}" y="${top}" width="${r}" height="4" rx="1" fill="${C.printDark}"/><rect x="${f1(x - r * 0.5)}" y="${f1(cy + r * 0.8 - 1)}" width="${r}" height="4" rx="1" fill="${C.printDark}"/>`
      + `<path d="M${x} ${f1(cy + r * 0.8 + 3)}v${f1(r * 0.7)}M${x - 2} ${f1(cy + r * 0.8 + 5)}v${f1(r * 0.6)}M${x + 2} ${f1(cy + r * 0.8 + 5)}v${f1(r * 0.6)}" stroke="${M.vermilion}" stroke-width="1.2"/>`,
    `<path d="${body}"/>`);
}

/**
 * A sign board: a dark board `w` × `h` with its words in luminous ink (bible § 3.3; 士林 may glow)
 * and a neon border, or (`lit` false) printed cream letters on vermilion. Horizontal by default,
 * vertical (`vertical`) one character a line.
 */
export function signBoard(ctx: KitCtx, x: number, y: number, w: number, h: number, text: string, { lit = true, color = C.lampAmber as string, vertical = false, size = 0, z = 3 as 2 | 3 } = {}): string {
  const chars = [...text];
  const sz = size || (vertical ? Math.min(w * 0.66, (h - 8) / (chars.length * 1.1)) : Math.min(h * 0.62, (w - 10) / (chars.length * 1.05)));
  const board = depth(ctx, z, `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="2.4" fill="${lit ? M.laneDeep : ref(ctx, 'vermG')}"/>`
    + `<path d="M${f1(x + 1)} ${f1(y + 0.8)}h${f1(w - 2)}" stroke="${C.cutRim}" stroke-width=".8" opacity=".4"/>`, `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}"/>`);
  const font = `font-family="'Chiron GoRound TC'" font-weight="900" font-size="${f1(sz)}"`;
  const glyphs = (fill: string, extra = '') => vertical
    ? chars.map((ch, i) => `<text data-art-text="" x="${f1(x + w / 2)}" y="${f1(y + (h - chars.length * sz * 1.1) / 2 + sz * 0.92 + i * sz * 1.1)}" text-anchor="middle" ${font} fill="${fill}"${extra}>${ch}</text>`).join('')
    : `<text data-art-text="" x="${f1(x + w / 2)}" y="${f1(y + h / 2 + sz * 0.36)}" text-anchor="middle" ${font} letter-spacing="${f1(sz * 0.05)}" fill="${fill}"${extra}>${text}</text>`;
  if (!lit) return board + glyphs(M.awningCream);
  const border = `M${f1(x + 3.4)} ${f1(y + 3.4)}h${f1(w - 6.8)}v${f1(h - 6.8)}h${f1(-(w - 6.8))}z`;
  return `<rect x="${f1(x - 8)}" y="${f1(y - 8)}" width="${f1(w + 16)}" height="${f1(h + 16)}" rx="8" fill="${color}" opacity=".14"${ctx.filters ? filterAttr(ctx, 'blur8') : ''}/>`
    + board + neonTube(ctx, border, M.vermilionLight, 1.3)
    + `<g${glow(ctx)}>${glyphs(color)}</g>` + glyphs('none', ` stroke="${C.lampHot}" stroke-width=".5" opacity=".7"`);
}

/** The market's sky: the colour clock's 02:20, pinholes, a small calm moon, the 士林 roofline with its haze of bulb light. */
function marketSky(ctx: KitCtx, base: number, { moon = null as readonly [number, number, number] | null, seed = 5 } = {}): string {
  const sk = skyline(-6, PAGE_W + 6, base, seed + 30, { minH: 20, maxH: 64, winP: 0.16, winOpacity: 0.6 });
  return `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, 0, 0, PAGE_W, base - 60, 40, seed)
    + (moon ? calmMoon(ctx, moon[0], moon[1], moon[2], { halo: 0.06 }) : '')
    + depth(ctx, 1, `<path d="${sk.d}" fill="${mixHex(M.laneDeep, C.shadow, 0.2)}"/>`, `<path d="${sk.d}"/>`) + sk.windows
    + `<rect x="-20" y="${base - 50}" width="${PAGE_W + 40}" height="50" fill="${ref(ctx, 'warmWash')}"/>`;
}

/**
 * A distant row of stalls (a backdrop band at z1–2): tin roofs, lit counters under little awnings, a
 * sign or two, their bulbs — the market going on behind the page's own stall, from x0 to x1.
 */
function farStalls(ctx: KitCtx, x0: number, x1: number, top: number, foot: number, seed: number, words: readonly string[] = []): string {
  const r = seeded(seed);
  let out = '';
  let i = 0;
  for (let x = x0; x < x1; i++) {
    const w = 46 + r() * 30;
    const t = top + r() * 16;
    const xa = x, xb = Math.min(x1, x + w);
    out += depth(ctx, 1, `<rect x="${f1(xa)}" y="${f1(t + 14)}" width="${f1(xb - xa)}" height="${f1(foot - t - 14)}" fill="${mixHex(M.smoke, M.laneDeep, 0.4)}"/>`
      + `<rect x="${f1(xa + 4)}" y="${f1(foot - 30)}" width="${f1(xb - xa - 8)}" height="22" fill="${ref(ctx, 'window')}" opacity=".7"/>`
      + `<path d="M${f1(xa - 3)} ${f1(t + 14)}L${f1(xa + 4)} ${f1(t)}H${f1(xb - 4)}L${f1(xb + 3)} ${f1(t + 14)}Z" fill="${i % 2 ? M.vermilionDeep : M.tinDeep}"/>`, `<rect x="${f1(xa)}" y="${f1(t)}" width="${f1(xb - xa)}" height="${f1(foot - t)}"/>`)
      + bulbString(ctx, xa, t + 16, xb, t + 16, 3, Math.max(3, Math.round((xb - xa) / 12)));
    if (words[i]) out += signBoard(ctx, xa + 4, t + 20, xb - xa - 8, 15, words[i], { lit: i % 2 === 0, z: 2, color: i % 3 === 1 ? C.neonPink : C.lampAmber });
    x = xb + 2;
  }
  return out;
}

/** A crowd of shoppers in silhouette at `foot` (heads and shoulders, a bag or a skewer). */
function crowd(ctx: KitCtx, x0: number, x1: number, foot: number, seed: number): string {
  const r = seeded(seed);
  let d = '';
  for (let x = x0; x < x1; x += 10 + r() * 9) {
    const h = 30 + r() * 14;
    d += `M${f1(x - 8)} ${foot}v${f1(-h + 14)}q0 -6 6 -7a6 6 0 1 1 6 0q6 1 6 7v${f1(h - 14)}z`;
  }
  return depth(ctx, 2, `<path d="${d}" fill="${mixHex(M.laneDeep, C.shadow, 0.25)}"/>`, `<path d="${d}"/>`);
}

/**
 * The lane on the floor page (the calm dark band the play path runs on): worn asphalt, a band of
 * red-brick pavers at the back, the bulbs' reflections in the wet (amber and vermilion smears), a
 * drain cover, a skewer or two, a paper cup.
 */
function laneFloor(ctx: KitCtx, { pavers = 60, seed = 9 } = {}): string {
  const { x, y, w, h } = FLOOR_RECT;
  const r = seeded(seed);
  let joints = '';
  for (let yy = y + 6; yy < y + pavers; yy += 8) for (let xx = x + ((yy - y) % 16 > 7 ? 8 : 0); xx < x + w; xx += 16) joints += `M${f1(xx)} ${f1(yy)}h13`;
  let wet = '';
  for (let i = 0; i < 9; i++) {
    const px = x + 30 + r() * (w - 60), py = y + pavers + 24 + r() * (h - pavers - 50);
    wet += `<ellipse cx="${f1(px)}" cy="${f1(py)}" rx="${f1(12 + r() * 22)}" ry="${f1(2.4 + r() * 2.6)}" fill="${i % 3 ? C.lampAmber : M.vermilionLight}" opacity=".13"/>`;
  }
  let litter = '';
  for (let i = 0; i < 4; i++) {
    const lx = x + 40 + r() * (w - 80), ly = y + pavers + 40 + r() * (h - pavers - 70);
    litter += i % 2
      ? `<path d="M${f1(lx)} ${f1(ly)}l${f1(14 + r() * 6)} ${f1(-3 + r() * 6)}" stroke="${M.woodLight}" stroke-width="1.1" opacity=".55"/>`
      : `<g transform="translate(${f1(lx)} ${f1(ly)}) rotate(${f1((r() - 0.5) * 60)})"><path d="M-3 -4h6l-1 7h-4z" fill="${M.awningCream}" opacity=".55"/></g>`;
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'laneG')}"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${pavers}" fill="${mixHex(M.vermilionDeep, M.laneDeep, 0.45)}"/><path d="${joints}" stroke="${M.laneDeep}" stroke-width=".8" opacity=".55"/>`
    + `<path d="M${x} ${y + pavers}H${x + w}" stroke="${M.laneLight}" stroke-width="3"/><path d="M${x} ${y + pavers - 1.2}H${x + w}" stroke="${C.cutRim}" stroke-width=".8" opacity=".25"/>`
    + wet + litter
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}" opacity=".35"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="22" fill="${C.shadow}" opacity=".2"/>`;
}

/** Corrugated tin (a stall's wall or roof): flutes over a rect. */
function corrugated(x: number, y: number, w: number, h: number, fill: string = M.tin): string {
  let flutes = '';
  for (let xx = x + 3; xx < x + w; xx += 6) flutes += `M${f1(xx)} ${f1(y)}v${f1(h)}`;
  return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${fill}"/>`
    + `<path d="${flutes}" stroke="${M.tinDeep}" stroke-width="2" opacity=".45"/><path d="${flutes}" stroke="${M.tinLight}" stroke-width=".7" opacity=".45" transform="translate(1.6 0)"/>`;
}

// ——— 5-1 「往劍潭」 ———

/**
 * 5-1: a 淡水信義線 car in the tunnel before 劍潭, its lights out (bible § 6, the 月亮線 car row: a
 * side cut-away box; the line's red band). Dim: the cream wall in the dark, lit only by the tunnel's
 * lamps streaking past the windows (the car's own lights are the `c5/car-lights` part). Left, the
 * bench where the passengers doze (the seat at y 400); the strap rail with Mocha's strap (its
 * handle's top at (96, 226)); the route strip, 劍潭 next. Middle, the doors under the route map
 * (the 土地公 at (250, 250)). Right, the luggage rack (Mocha's `rack`, its top at y 270) over the
 * teal 博愛座 (its seat at y 420).
 */
const redCar: BackdropDraw = (ctx) => {
  const back = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y + 40}" fill="${ref(ctx, 'carDarkG')}"/>`
    + paperFibres(-20, 0, PAGE_W + 40, GUTTER_Y, 50, M.carDarkDeep, 51, 0.3);
  // The ceiling and its light fittings, dark (the part lights them)
  const ceiling = `<path d="M-20 0H${PAGE_W + 20}V60Q195 74 -20 60Z" fill="${mixHex(M.carDark, C.shadow, 0.35)}"/><path d="M-20 60Q195 74 ${PAGE_W + 20} 60" stroke="${M.carDarkDeep}" stroke-width="2" fill="none"/>`
    + `<rect x="12" y="28" width="150" height="6" rx="3" fill="${M.carDarkDeep}"/><rect x="214" y="28" width="164" height="6" rx="3" fill="${M.carDarkDeep}"/>`;
  // The route strip: the 淡水信義線's red, 劍潭 the next stop (blinking amber)
  const stops = [22, 62, 102, 142, 182];
  const names = ['雙連', '民權西路', '圓山', '劍潭', '士林'];
  const route = depth(ctx, 2, `<rect x="6" y="78" width="196" height="28" rx="4" fill="${T.navyDeep}"/>`, `<rect x="6" y="78" width="196" height="28" rx="4"/>`)
    + `<path d="M16 97H192" stroke="${P.xinyi}" stroke-width="4" stroke-linecap="round"/>`
    + stops.map((x, i) => `<circle cx="${x}" cy="97" r="${i === 3 ? 4.6 : 3}" fill="${i === 3 ? C.lampAmber : i < 3 ? M.tinDeep : C.cutRim}" stroke="${P.xinyi}" stroke-width="1.6"/>`).join('')
    + softEllipse(ctx, 142, 97, 9, 7, 'lamp', 0.4)
    + stops.map((x, i) => `<text data-art-text="" x="${x}" y="90" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="${i === 3 ? 900 : 700}" font-size="${i === 3 ? 8 : 5.5}" fill="${i === 3 ? C.lampAmber : C.chalk}"${i === 3 ? '' : ' opacity=".6"'}>${names[i]}</text>`).join('');
  // The windows onto the tunnel: black, its wall lamps streaking past, cables
  const tunnel = (x: number, y: number, w: number, h: number, seed: number) => {
    const r = seeded(seed);
    let streaks = '';
    for (let i = 0; i < 3; i++) {
      const sy = y + 18 + i * 26 + r() * 8, sx = x + r() * w * 0.5;
      streaks += `<path d="M${f1(sx)} ${f1(sy)}h${f1(w * (0.4 + r() * 0.4))}" stroke="${C.lampAmber}" stroke-width="2.4" stroke-linecap="round" opacity=".75"/><path d="M${f1(sx - 10)} ${f1(sy)}h${f1(w * 0.2)}" stroke="${C.lampAmber}" stroke-width="1.2" stroke-linecap="round" opacity=".35"/>`;
    }
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${M.tunnel}"/>`
      + `<path d="M${x} ${y + h * 0.3}h${w}M${x} ${y + h * 0.36}h${w}M${x} ${y + h * 0.8}h${w}" stroke="${M.carDarkDeep}" stroke-width="2"/>` + streaks;
  };
  const win = (x: number, y: number, w: number, h: number, seed: number) => {
    const id = ctx.id(`c5win${seed}`);
    return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/></clipPath><g clip-path="url(#${id})">${tunnel(x, y, w, h, seed)}`
      + `<path d="M${x} ${y + h * 0.6}L${x + w * 0.5} ${y}H${x + w * 0.66}L${x} ${y + h}Z" fill="${C.cutRim}" opacity=".05"/></g>`
      + `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="11" fill="none" stroke="${M.tinDeep}" stroke-width="5"/>`;
  };
  const strap = (x: number, top: number) => `<path d="M${x} 116V${top - 2}" stroke="${M.vermilionDeep}" stroke-width="4"/>`
    + `<circle cx="${x}" cy="${top + 9}" r="9" fill="none" stroke="${M.tinLight}" stroke-width="3.6"/><circle cx="${x}" cy="${top + 9}" r="9" fill="none" stroke="${M.tin}" stroke-width="2"/>`;
  const rail = depth(ctx, 3, `<rect x="-20" y="112" width="232" height="5" rx="2.5" fill="${ref(ctx, 'steelG')}"/>`
    + `<path d="M30 64V112M170 64V112" stroke="${M.tinDeep}" stroke-width="2.4"/>`
    + strap(96, 226) + `<path d="M150 116V146" stroke="${M.vermilionDeep}" stroke-width="4"/><path d="M143 146H157L150 158Z" fill="none" stroke="${M.vermilionDeep}" stroke-width="3" stroke-linejoin="round"/>`,
  `<rect x="-20" y="112" width="232" height="5"/>`);
  const band = `<rect x="-20" y="236" width="${PAGE_W + 40}" height="10" fill="${P.xinyi}"/><rect x="-20" y="247" width="${PAGE_W + 40}" height="2" fill="${P.xinyiDeep}"/>`;
  // The doors (x 216–284), the route map over them with 劍潭 lit, an ad frame beside
  const doors = depth(ctx, 3, `<rect x="210" y="226" width="80" height="250" fill="${M.tinDeep}"/>`
    + `<rect x="216" y="264" width="33" height="212" fill="${mixHex(M.tin, M.carDarkDeep, 0.4)}"/><rect x="251" y="264" width="33" height="212" fill="${mixHex(M.tin, M.carDarkDeep, 0.4)}"/>`
    + `<rect x="222" y="284" width="21" height="70" rx="3" fill="${M.tunnel}"/><rect x="257" y="284" width="21" height="70" rx="3" fill="${M.tunnel}"/>`
    + `<path d="M226 300h12M260 316h14" stroke="${C.lampAmber}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`
    + `<path d="M249.5 264V476" stroke="${C.printDark}" stroke-width="1.6"/><rect x="214" y="418" width="72" height="4" fill="${P.xinyi}" opacity=".8"/>`, `<rect x="210" y="226" width="80" height="250"/>`)
    + depth(ctx, 3, `<rect x="206" y="234" width="88" height="26" rx="3" fill="${T.navyDeep}"/>`
      + `<path d="M212 252h76" stroke="${P.xinyi}" stroke-width="2.4" stroke-linecap="round"/>`
      + [218, 234, 250, 266, 282].map((x, i) => `<circle cx="${x}" cy="252" r="${i === 3 ? 2.6 : 1.8}" fill="${i === 3 ? C.lampAmber : M.tinLight}"/>`).join(''), `<rect x="206" y="234" width="88" height="26" rx="3"/>`)
    + `<text data-art-text="" x="250" y="245" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6.5" fill="${C.lampAmber}">往 淡水 · 下一站 劍潭</text>`;
  // The left bench (seat at y 400) and the 博愛座 (seat at y 420), dark
  const bench = (x0: number, x1: number, seat: number, fill: string) => depth(ctx, 3, `<rect x="${x0}" y="${seat - 54}" width="${x1 - x0}" height="50" rx="8" fill="${fill}"/>`
    + `<rect x="${x0 - 4}" y="${seat - 6}" width="${x1 - x0 + 8}" height="18" rx="6" fill="${fill}"/><path d="M${x0 + 4} ${seat - 2}h${x1 - x0 - 8}" stroke="${C.cutRim}" stroke-width="1" opacity=".22"/>`
    + `<rect x="${x0}" y="${seat + 12}" width="${x1 - x0}" height="${476 - seat - 12}" fill="${M.carDarkDeep}"/>`
    + `<path d="${Array.from({ length: Math.floor((x1 - x0) / 30) }, (_, i) => `M${x0 + 30 + i * 30} ${seat - 48}V${seat - 10}`).join('')}" stroke="${C.shadow}" stroke-width="1.6" opacity=".25"/>`,
  `<rect x="${x0 - 4}" y="${seat - 54}" width="${x1 - x0 + 8}" height="${476 - seat + 54}"/>`);
  const seats = bench(-10, 140, 400, mixHex(T.seat, C.shadow, 0.45)) + bench(300, 400, 420, mixHex(T.priority, C.shadow, 0.4))
    + depth(ctx, 2, `<rect x="314" y="326" width="58" height="16" rx="3" fill="${mixHex(T.priority, C.shadow, 0.3)}"/>`, `<rect x="314" y="326" width="58" height="16" rx="3"/>`)
    + `<text data-art-text="" x="343" y="337.5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.cutRim}" opacity=".8" letter-spacing="2">博愛座</text>`;
  // The luggage rack over the 博愛座: a steel shelf on brackets (Mocha sits on it, (318, 270))
  const rack = depth(ctx, 3, `<rect x="296" y="270" width="104" height="6" rx="2" fill="${ref(ctx, 'steelG')}"/><path d="M298 276h100" stroke="${M.tinDeep}" stroke-width="1.2" stroke-dasharray="3 2"/>`
    + `<path d="M300 276l-6 16M394 276l6 16" stroke="${M.tinDeep}" stroke-width="2.4"/><rect x="340" y="260" width="34" height="10" rx="2" fill="${M.woodDeep}"/>`, `<rect x="296" y="260" width="104" height="32"/>`);
  const poles = `<rect x="148" y="40" width="5" height="440" fill="${ref(ctx, 'steelG')}"/><rect x="294" y="40" width="5" height="440" fill="${ref(ctx, 'steelG')}"/>`;
  // The tunnel's lamps flicker in through the windows: cool streaks on the dark car
  const flicker = `<path d="M10 300h120M170 280h30" stroke="${C.lampAmber}" stroke-width="10" opacity=".05"/>`;
  // The floor page: the car's lino (dark), then the tunnel's track bed
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${M.tunnel}"/>`
    + `<rect x="-40" y="${GUTTER_Y}" width="${PAGE_W + 80}" height="120" fill="${mixHex(T.floorLino, M.carDarkDeep, 0.6)}"/>`
    + `<path d="${Array.from({ length: 13 }, (_, i) => `M${-20 + i * 34} ${GUTTER_Y}l${f1((-20 + i * 34 - 195) * 0.08)} 120`).join('')}" stroke="${M.carDarkDeep}" stroke-width=".8" opacity=".6"/>`
    + `<rect x="-40" y="${GUTTER_Y}" width="${PAGE_W + 80}" height="24" fill="${C.shadow}" opacity=".25"/>`
    + (() => {
      const k = (FLOOR_BOTTOM - GUTTER_Y) / (GUTTER_Y + 360);
      let d = '';
      for (let x = -140; x <= PAGE_W + 140; x += 26) d += `M${f1(x + (x - 195) * k * 0.6)} 552L${f1(x + (x - 195) * k)} ${FLOOR_BOTTOM}`;
      return `<path d="${d}" stroke="${M.carDarkDeep}" stroke-width="5" opacity=".9"/>`;
    })()
    + `<path d="M-40 580H430M-40 628H430" stroke="${M.tinDeep}" stroke-width="5"/><path d="M-40 578.5H430M-40 626.5H430" stroke="${M.tin}" stroke-width="1.4"/>`
    + `<path d="M-40 600H430" stroke="${C.lampAmber}" stroke-width="1.4" stroke-dasharray="2 22" opacity=".5"/>`);
  return marketDefs(ctx) + standingPage(ctx, back + ceiling + route + win(8, 128, 66, 90, 1) + win(162, 128, 40, 90, 2) + win(318, 128, 70, 90, 3) + band + flicker)
    + floor + poles + rail + seats + doors + rack + bookCues(ctx) + block();
};

// ——— 5-2 「射氣球攤」 ———

/** A dart-board balloon (paper, a foil highlight dot), at (x, y). */
const balloon = (x: number, y: number, r: number, fill: string) =>
  `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 1.15)}" fill="${fill}"/><path d="M${f1(x - 1.4)} ${f1(y + r * 1.15)}l1.4 2l1.4 -2z" fill="${fill}"/>`;

/**
 * 5-2: the balloon-dart stall (射氣球). A corrugated booth under a striped awning (its front edge
 * Mocha's `awning`, (290, 214)) and its luminous 「射氣球」 board; on its back wall the dart board — a
 * grid of balloons pinned on cork, foil dots, darts stuck in a few — dim until the bulbs light;
 * plush prizes over the prize shelf (y 326); the 店員小哥 behind the shelf (this stall's clerk too).
 * Left, the stall's striped pole (Mocha's `pole`, its cap at (44, 300)) and the lane going on behind:
 * more stalls, lanterns, the crowd. Over it all the night: 咻咻 blowing one balloon loose (the
 * chapter's 咻咻 beat), the moon.
 */
const balloonStall: BackdropDraw = (ctx) => {
  const far = marketSky(ctx, 150, { moon: [96, 44, 12], seed: 21 }) + farStalls(ctx, -20, 140, 150, GUTTER_Y, 23, ['', '大腸包小腸', '', '芒果冰'])
    + bulbString(ctx, -20, 116, 160, 128, 10, 12) + crowd(ctx, -20, 150, GUTTER_Y, 24);
  // 咻咻 and the balloon it blew loose, floating up into the night
  const shushu = shushuPeek(ctx, 300, 52, 1.1) + `<path d="M338 56q14 -4 20 -14" stroke="${C.vellum}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>`
    + depth(ctx, 2, balloon(366, 26, 9, M.balloonRed), `<ellipse cx="366" cy="26" rx="9" ry="10.4"/>`) + `<path d="M366 38q-4 10 2 18t-2 16" stroke="${C.chalk}" stroke-width=".8" fill="none" opacity=".7"/>`
    + `<ellipse cx="363" cy="22" rx="2.2" ry="3" fill="${C.foilShine}" opacity=".7"/>`;
  // The booth: corrugated walls, the dart board on the back wall
  const booth = depth(ctx, 2, corrugated(150, 150, 250, 210, mixHex(M.tin, M.laneDeep, 0.35)), `<rect x="150" y="150" width="250" height="210"/>`);
  const board = (() => {
    const id = ctx.id('dartBoard');
    const cols = [M.balloonRed, M.balloonBlue, M.balloonPink, M.balloonMint, M.balloonLilac];
    let b = '';
    let k = 0;
    for (let y = 238; y < 312; y += 16) for (let x = 206 + ((y - 238) % 32 ? 9 : 0); x < 382; x += 18, k++) {
      if ((k * 7) % 11 === 3) b += `<circle cx="${x}" cy="${y}" r="2" fill="${C.printDark}"/><path d="M${x} ${y}l6 -4" stroke="${M.vermilionDeep}" stroke-width="1"/>`;
      else b += balloon(x, y, 6.6, cols[k % cols.length]) + `<circle cx="${x - 2.2}" cy="${y - 2.8}" r="1.4" fill="${ref(ctx, 'foil')}"/>`;
    }
    return depth(ctx, 2, `<rect x="194" y="226" width="200" height="94" rx="3" fill="${M.woodDeep}"/><rect x="198" y="230" width="192" height="86" fill="${mixHex(M.woodLight, M.laneDeep, 0.3)}"/>`
      + `<clipPath id="${id}"><rect x="198" y="230" width="192" height="86"/></clipPath><g clip-path="url(#${id})">${b}</g>`, `<rect x="194" y="226" width="200" height="94"/>`)
      // Dim until the bulbs light (the part washes it with their light)
      + `<rect x="194" y="226" width="200" height="94" fill="${C.shadow}" opacity=".35"/>`;
  })();
  // Plush prizes hung over the shelf, a dart cup
  const prizes = depth(ctx, 3, `<circle cx="214" cy="306" r="10" fill="${N.plushPink}"/><circle cx="207" cy="297" r="4" fill="${N.plushPink}"/><circle cx="221" cy="297" r="4" fill="${N.plushPink}"/>`
    + `<circle cx="370" cy="306" r="11" fill="${N.plushSky}"/><path d="M361 296l-3 -8l8 5zM379 296l3 -8l-8 5z" fill="${N.plushSky}"/><circle cx="366" cy="304" r="1.2" fill="${C.ink}"/><circle cx="374" cy="304" r="1.2" fill="${C.ink}"/>`,
  `<circle cx="214" cy="306" r="12"/><circle cx="370" cy="306" r="12"/>`)
    + `<rect x="232" y="306" width="12" height="16" rx="2" fill="${M.vermilion}"/><path d="M235 306l-3 -12M238 306l1 -13M241 306l4 -11" stroke="${M.tinLight}" stroke-width="1"/>`;
  const front = awning(ctx, 140, 398, 196, 20) + signBoard(ctx, 196, 150, 150, 36, '射氣球', { color: C.lampAmber })
    + `<text data-art-text="" x="370" y="182" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${C.chalk}" opacity=".85">一次 50</text>`;
  // The stall's pole: vermilion and cream stripes, a cap (Mocha sits on it, (44, 300))
  const pole = depth(ctx, 3, `<rect x="38" y="304" width="12" height="190" fill="${M.awningCream}"/>`
    + `<path d="${Array.from({ length: 12 }, (_, i) => `M38 ${310 + i * 16}l12 -8v8l-12 8z`).join('')}" fill="${M.vermilion}"/>`
    + `<rect x="32" y="298" width="24" height="7" rx="3" fill="${M.tinDeep}"/><path d="M33 298.8h22" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`, `<rect x="32" y="298" width="24" height="196"/>`);
  const clerkHere = clerk(ctx, 382, 300);
  const floor = floorPage(ctx, laneFloor(ctx, { seed: 25 }) + pools(ctx, [[260, GUTTER_Y + 40, 140, 30], [60, 470, 70, 20, 'red']]));
  return marketDefs(ctx) + standingPage(ctx, far + shushu + booth + board + clerkHere + prizes + front
    + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'warmWash')}"/>`)
    + floor + pole + bookCues(ctx) + block();
};

// ——— 5-3 「抱抱」 ———

/**
 * 5-3: a crowded lane of 士林夜市. The lane runs off behind (stalls both sides receding, strings of
 * bulbs, lanterns, the crowd in silhouette, steam). Left, the red lantern on its wire over the
 * lane's mouth (Mocha's `lantern`, its top at (60, 264)). Right, the 雞排 stall: its awning and
 * luminous 「炸雞排」 board, the menu board (the 土地公 at (340, 300)), the fryer at the back with its
 * steam, the shelf of cutlets under a heat lamp, and the counter's end standing across the lane
 * (x 276–318, its top at y 430, the bell on it): the lane is his side, the stall the 老闆's.
 */
const marketLane: BackdropDraw = (ctx) => {
  const far = marketSky(ctx, 120, { seed: 31 }) + farStalls(ctx, -20, 270, 132, GUTTER_Y, 33, ['臭豆腐', '', '珍珠奶茶', '', '烤玉米', ''])
    + bulbString(ctx, -20, 96, 280, 110, 14, 22) + bulbString(ctx, -20, 70, 260, 60, 10, 18)
    + crowd(ctx, -20, 270, GUTTER_Y, 34) + steam(ctx, 120, 300, 70, 1.2);
  // The 雞排 stall: a corrugated booth, its awning, its board and the menu
  const stall = depth(ctx, 2, `<rect x="270" y="150" width="130" height="210" fill="${ref(ctx, 'smokeG')}"/>`
    + `<path d="M270 260h130M270 290h130" stroke="${M.laneDeep}" stroke-width="1" opacity=".5"/>`, `<rect x="270" y="150" width="130" height="210"/>`)
    + awning(ctx, 262, 400, 146, 22) + signBoard(ctx, 280, 108, 110, 32, '炸雞排', { color: C.lampAmber })
    + depth(ctx, 3, `<rect x="314" y="262" width="74" height="70" rx="3" fill="${M.woodDeep}"/><rect x="318" y="266" width="66" height="62" fill="${M.laneDeep}"/>`, `<rect x="314" y="262" width="74" height="70" rx="3"/>`)
    + ['雞排 80', '甜不辣 50', '地瓜球 40', '杏鮑菇 60'].map((t, i) => `<text data-art-text="" x="351" y="${279 + i * 13}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${C.chalk}" opacity=".9">${t}</text>`).join('');
  // The fryer at the back: steel, the oil's glow, a basket hung on its rim, steam
  const fryer = depth(ctx, 3, `<rect x="340" y="384" width="56" height="100" fill="${ref(ctx, 'steelG')}"/><rect x="340" y="380" width="56" height="8" rx="2" fill="${M.tinDeep}"/>`
    + `<path d="M350 380l-6 -14h22l-4 14" fill="none" stroke="${M.tinLight}" stroke-width="1.6"/><path d="M344 366h22" stroke="${M.tinDeep}" stroke-width="3"/>`
    + `<path d="M344 400h48M344 430h48" stroke="${M.tinDeep}" stroke-width="1" opacity=".6"/>`, `<rect x="340" y="366" width="56" height="118"/>`)
    + softEllipse(ctx, 368, 382, 20, 4, 'lamp', 0.4) + steam(ctx, 360, 366, 80, 1.1) + steam(ctx, 384, 372, 60, 0.9);
  // The counter's end, across the lane: steel front, a glass case with cutlets, under a heat lamp
  const counter = depth(ctx, 4, `<rect x="276" y="430" width="44" height="56" fill="${ref(ctx, 'steelG')}"/><rect x="274" y="426" width="48" height="6" rx="2" fill="${M.tinLight}"/>`
    + `<rect x="276" y="446" width="44" height="12" fill="${M.vermilion}"/><text data-art-text="" x="298" y="455.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${M.awningCream}">現炸</text>`, `<rect x="274" y="426" width="48" height="60"/>`);
  const heat = depth(ctx, 3, `<rect x="322" y="398" width="16" height="12" rx="2" fill="${M.tinDeep}"/>`, `<rect x="322" y="398" width="16" height="12"/>`)
    + softEllipse(ctx, 330, 412, 14, 8, 'lamp', 0.4);
  // The lane's lantern on its wire over the mouth (Mocha's lantern: its top at (60, 264))
  const wire = `<path d="M-20 250Q60 262 140 246" stroke="${C.printDark}" stroke-width="1.2" fill="none"/>`;
  const floor = floorPage(ctx, laneFloor(ctx, { seed: 35 }) + pools(ctx, [[60, 470, 70, 22, 'red'], [200, GUTTER_Y + 30, 150, 30], [340, 470, 60, 18]]));
  return marketDefs(ctx) + standingPage(ctx, far + stall + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'warmWash')}"/>`)
    + floor + fryer + heat + counter + wire + lantern(ctx, 60, 264, 15, 254) + bookCues(ctx) + block();
};

// ——— 5-4 「彈珠台」 ———

/** The board's peg field: brass pins in staggered rows, skipping the lanes the ball runs down (page units). */
function pegs(): string {
  let d = '';
  for (let row = 0; row < 9; row++) {
    const y = 110 + row * 30;
    for (let x = 169 + (row % 2) * 12; x <= 335; x += 24) {
      if (Math.abs(x - 305) < 8 && y < 220) continue;
      if (Math.abs(y - 190) < 12 && x > 240 && x < 320) continue;
      if (Math.abs(y - 340) < 12 && x > 160 && x < 236) continue;
      d += `M${f1(x)} ${f1(y)}h.01`;
    }
  }
  return `<path d="${d}" stroke="${C.goldDeep}" stroke-width="3.2" stroke-linecap="round"/>`
    + `<path d="${d}" stroke="${C.foilShine}" stroke-width="1.2" stroke-linecap="round" transform="translate(-.6 -.6)"/>`;
}

/** A painted tulip catcher on the board (a little cup of foil petals). */
const tulip = (ctx: KitCtx, x: number, y: number) => `<path d="M${x - 6} ${y - 4}l3 8h6l3 -8l-3 3l-3 -5l-3 5z" fill="${ref(ctx, 'foil')}"/>`;

/**
 * 5-4: an old pachinko board in the market's game arcade (遊藝場). The cabinet is printed here, still
 * (the ball's part draws only what lights up per state, D-85): a teal cabinet in a chrome frame,
 * glass over a painted face — a night sky with a paper moon and lanterns, rows of brass pins,
 * tulip catchers, the lanes the flippers send the ball down, the jackpot hole 「大獎」 at (236, 300),
 * the out-hole, the launch rail up the right side to the launcher (330, 120); the lower panel with
 * its name and the launch knob's well; the ball tray jutting out by his side (160, 470). Behind,
 * the arcade: a row of old machines, a luminous 「遊藝場」, a change machine; Mocha's stool (40, 380).
 */
const pachinko: BackdropDraw = (ctx) => {
  const room = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'smokeG')}"/>`
    + paperFibres(-20, 0, PAGE_W + 40, GUTTER_Y, 40, M.laneDeep, 41, 0.3)
    + `<rect x="-20" y="0" width="${PAGE_W + 40}" height="40" fill="${M.laneDeep}"/>`
    + bulbString(ctx, -20, 40, 410, 40, 12, 26)
    + signBoard(ctx, 10, 54, 110, 30, '遊藝場', { color: C.neonPink });
  // Old machines along the back wall, their faces glowing
  const machines = [[-6, 150], [52, 160], [106, 150]].map(([x, top], i) => depth(ctx, 2, `<rect x="${x}" y="${top}" width="50" height="${GUTTER_Y - top + 10}" rx="4" fill="${[M.vermilionDeep, M.cabinetTealDeep, M.denimDeep][i]}"/>`
    + `<rect x="${x + 6}" y="${top + 10}" width="38" height="50" rx="3" fill="${[C.neonPink, C.neonCyan, C.lampAmber][i]}" opacity=".3"/>`
    + `<circle cx="${x + 25}" cy="${top + 35}" r="10" fill="none" stroke="${C.lampHot}" stroke-width="1" opacity=".5"/>`
    + `<rect x="${x + 8}" y="${top + 70}" width="34" height="10" rx="2" fill="${M.laneDeep}"/>`, `<rect x="${x}" y="${top}" width="50" height="${GUTTER_Y - top + 10}"/>`)).join('');
  // The cabinet (page units: the board centred on (265, 260))
  const cab = 'M153 74H377Q383 74 383 80V436Q383 442 377 442H153Q147 442 147 436V80Q147 74 153 74Z';
  const faceId = ctx.id('pachiFace');
  const face = `<clipPath id="${faceId}"><rect x="159" y="84" width="212" height="300" rx="10"/></clipPath><g clip-path="url(#${faceId})">`
    + `<rect x="159" y="84" width="212" height="300" fill="${M.boardPrint}"/>`
    + `<rect x="159" y="84" width="212" height="150" fill="${mixHex(C.nightCard, M.boardPrint, 0.25)}"/>`
    + `<circle cx="196" cy="118" r="14" fill="${C.moon}" opacity=".85"/><circle cx="202" cy="114" r="12" fill="${mixHex(C.nightCard, M.boardPrint, 0.25)}"/>`
    + [[238, 106], [272, 98], [214, 150]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="7" fill="${M.vermilion}"/><path d="M${x - 3} ${y - 7}h6M${x - 3} ${y + 7}h6" stroke="${C.printDark}" stroke-width="1.4"/>`).join('')
    + `<path d="M159 234q50 -14 106 0t106 0V384H159Z" fill="${mixHex(M.balloonMint, M.boardPrint, 0.5)}"/>`
    + `<path d="M159 300q50 -10 106 0t106 0V384H159Z" fill="${mixHex(M.balloonLilac, M.boardPrint, 0.4)}"/>`
    + pegs() + tulip(ctx, 188, 262) + tulip(ctx, 320, 262) + tulip(ctx, 272, 330) + tulip(ctx, 196, 372)
    // Lane rails: under the upper flipper (left lane down to the lower flipper, right lane to the out-hole)
    + `<path d="M252 206L196 320M300 206L330 360" stroke="${C.printLilacDeep}" stroke-width="2.4" stroke-linecap="round"/>`
    + `<path d="M170 356L156 384M222 356L240 384" stroke="${C.printLilacDeep}" stroke-width="2.4" stroke-linecap="round"/>`
    + `<ellipse cx="330" cy="372" rx="12" ry="5" fill="${C.ink}"/><text data-art-text="" x="330" y="362" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7" fill="${C.printLilacDeep}">OUT</text>`
    // The jackpot hole's ring (lit by the part in `jackpot`)
    + `<circle cx="236" cy="300" r="16" fill="${C.wordWow}" stroke="${C.goldDeep}" stroke-width="2"/><circle cx="236" cy="300" r="7" fill="${C.ink}"/>`
    + `<text data-art-text="" x="236" y="330" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="12" fill="${C.wordWow}">大獎</text>`
    // The launch rail up the right side, over the top to the launcher
    + `<path d="M357 380V100Q357 90 345 90H320" stroke="${M.steelWarm}" stroke-width="3" fill="none"/></g>`
    + `<rect x="159" y="84" width="212" height="300" rx="10" fill="none" stroke="${M.steelWarm}" stroke-width="3"/>`
    + `<path d="M165 90L225 90L165 220Z" fill="${C.glassine}" opacity=".16"/><path d="M240 90L262 90L180 260L170 250Z" fill="${C.glassine}" opacity=".1"/>`;
  const cabinet = depth(ctx, 3, `<path d="${cab}" fill="${ref(ctx, 'tealG')}"/><path d="M150 76H380" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`
    + face
    + `<rect x="159" y="392" width="212" height="42" rx="6" fill="${M.cabinetTealDeep}"/>`
    + `<text data-art-text="" x="230" y="420" text-anchor="middle" font-family="'Chiron GoRound TC'" font-weight="900" font-size="18" fill="${M.boardPrint}" letter-spacing="2">彈珠台</text>`
    + `<circle cx="330" cy="420" r="16" fill="${M.laneDeep}"/>`, `<path d="${cab}"/>`);
  // The ball tray, jutting out at the bottom left by his side
  const tray = depth(ctx, 3, `<path d="M119 444H195L187 464H127Z" fill="${ref(ctx, 'steelG')}"/><path d="M123 448H191" stroke="${C.foilShine}" stroke-width="1.4"/>`
    + `<path d="M147 434V444" stroke="${M.tinDeep}" stroke-width="5"/>`, `<path d="M119 444H195L187 464H127Z"/>`);
  // Mocha's stool (its seat at (40, 380)) and a change machine behind it
  const stool = depth(ctx, 3, `<rect x="24" y="380" width="32" height="6" rx="3" fill="${M.vermilion}"/><path d="M28 386l-4 92M52 386l4 92M30 440h20" stroke="${M.tinDeep}" stroke-width="2.6"/>`, `<rect x="22" y="380" width="36" height="98"/>`);
  const change = depth(ctx, 2, `<rect x="62" y="250" width="44" height="110" rx="3" fill="${M.tinDeep}"/><rect x="70" y="262" width="28" height="18" rx="2" fill="${C.lampAmber}" opacity=".55"/>`
    + `<text data-art-text="" x="84" y="275" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${C.printDark}">兌幣</text><rect x="76" y="300" width="16" height="4" rx="1" fill="${C.printDark}"/>`, `<rect x="62" y="250" width="44" height="110"/>`);
  const floor = floorPage(ctx, (() => {
    const { x, y, w, h } = FLOOR_RECT;
    let tiles = '';
    for (let yy = y; yy < y + h; yy += 24) for (let xx = x + ((yy - y) % 48 ? 12 : 0); xx < x + w; xx += 24) tiles += `M${f1(xx)} ${f1(yy)}h12v12h-12z`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mixHex(M.lane, M.laneLight, 0.4)}"/><path d="${tiles}" fill="${M.laneDeep}" opacity=".5"/>`
      + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}" opacity=".4"/>`;
  })() + pools(ctx, [[260, GUTTER_Y + 30, 150, 30], [60, 480, 60, 18, 'red']]));
  return marketDefs(ctx) + standingPage(ctx, room + machines + change)
    + floor + cabinet + tray + stool + bookCues(ctx) + block();
};

// ——— 5-5 「按摩椅」 ———

/**
 * 5-5: the market's corner of coin massage chairs (投幣按摩椅), under a corrugated roof. Its sign
 * 「按摩椅 10元」 hangs on the left (Mocha's `sign`, its top at (60, 250)); the chairs' coin boxes on
 * their poles (Mocha's `box1` (236, 330) and `box2` (290, 270): each coin waits on its box's lip);
 * the second chair's dais (y 440) under a top shelf of figurines (the bead at (362, 316); the 土地公
 * figurine at (330, 290)); posters, a wall clock at 2:20, an electric fan. Left, the lane beyond.
 */
const massageChairs: BackdropDraw = (ctx) => {
  const far = marketSky(ctx, 130, { moon: [40, 40, 11], seed: 41 }) + farStalls(ctx, -20, 190, 140, GUTTER_Y, 43, ['', '鹽酥雞', '', '豆花'])
    + bulbString(ctx, -20, 108, 200, 120, 10, 14) + crowd(ctx, -20, 190, GUTTER_Y, 44);
  // The corner: tiled wall, roof, a band of light
  let tiles = '';
  for (let y = 140; y < GUTTER_Y; y += 14) tiles += `M196 ${y}H400`;
  for (let x = 206; x < 400; x += 20) tiles += `M${x} 140V${GUTTER_Y}`;
  const corner = depth(ctx, 2, `<rect x="196" y="120" width="210" height="240" fill="${mixHex(M.awningCream, M.laneDeep, 0.55)}"/><path d="${tiles}" stroke="${M.laneDeep}" stroke-width=".8" opacity=".3"/>`, `<rect x="196" y="120" width="210" height="240"/>`)
    + depth(ctx, 3, corrugated(186, 100, 220, 22, M.tin), `<rect x="186" y="100" width="220" height="22"/>`)
    + `<rect x="196" y="122" width="210" height="10" fill="${C.shadow}" opacity=".25"/>`
    + signBoard(ctx, 214, 136, 120, 28, '舒壓按摩', { color: C.neonCyan })
    // Posters: a chair diagram, 「放鬆一下」
    + depth(ctx, 2, `<rect x="344" y="140" width="40" height="54" rx="2" fill="${M.awningCream}"/><path d="M352 178q8 -20 22 -24l2 6q-12 4 -18 20z" fill="${M.leather}"/><rect x="350" y="184" width="28" height="4" fill="${M.vermilion}"/>`, `<rect x="344" y="140" width="40" height="54"/>`)
    + `<text data-art-text="" x="364" y="152" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6.5" fill="${M.vermilionDeep}">放鬆一下</text>`
    // The clock at 2:20
    + depth(ctx, 2, `<circle cx="226" cy="196" r="13" fill="${M.awningCream}"/><circle cx="226" cy="196" r="13" fill="none" stroke="${M.woodDeep}" stroke-width="2"/><path d="M226 196l5 -4M226 196l6 3" stroke="${C.printDark}" stroke-width="1.6" stroke-linecap="round"/>`, `<circle cx="226" cy="196" r="13"/>`);
  // The top shelf's figurines (the shelf itself is the ledge at y 316) and a little lamp
  const shelfThings = `<rect x="370" y="290" width="12" height="20" rx="2" fill="${M.balloonBlue}"/><circle cx="376" cy="286" r="5" fill="${M.balloonBlue}"/>`
    + `<rect x="300" y="298" width="16" height="12" rx="2" fill="${M.vermilion}"/>` + softEllipse(ctx, 350, 300, 30, 12, 'lamp', 0.25);
  // The coin boxes on their poles (Mocha sits on their tops; the coins wait on their lips)
  const coinBox = (x: number, top: number, foot: number) => depth(ctx, 3, `<rect x="${x - 2}" y="${top + 34}" width="4" height="${foot - top - 34}" fill="${M.tinDeep}"/>`
    + `<rect x="${x - 15}" y="${top}" width="30" height="36" rx="3" fill="${ref(ctx, 'steelG')}"/><rect x="${x - 10}" y="${top + 6}" width="20" height="10" rx="1.4" fill="${M.laneDeep}"/>`
    + `<text data-art-text="" x="${x}" y="${top + 14}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="7" fill="${C.lampAmber}">10</text>`
    + `<rect x="${x - 2}" y="${top + 20}" width="4" height="9" rx="1" fill="${C.printDark}"/><rect x="${x - 15}" y="${top + 30}" width="30" height="6" rx="1" fill="${M.tinDeep}"/>`, `<rect x="${x - 15}" y="${top}" width="30" height="${foot - top}"/>`);
  // Chair 2's dais (y 440) with a red carpet front
  const dais = depth(ctx, 3, `<rect x="276" y="440" width="130" height="48" fill="${M.woodDeep}"/><rect x="276" y="436" width="130" height="6" rx="2" fill="${M.woodLight}"/>`
    + `<rect x="276" y="448" width="130" height="18" fill="${M.vermilionDeep}" opacity=".8"/>`, `<rect x="276" y="436" width="130" height="52"/>`);
  // The shop's sign over the lane (Mocha's sign, its top at (60, 250)), and an electric fan
  const sign = `<path d="M30 238V250M90 238V250" stroke="${C.printDark}" stroke-width="1.4"/>` + signBoard(ctx, 14, 250, 92, 34, '按摩椅', { color: C.lampAmber })
    + `<text data-art-text="" x="60" y="298" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.chalk}">投幣 10元</text>`;
  const fan = depth(ctx, 3, `<circle cx="372" cy="400" r="16" fill="none" stroke="${M.tinLight}" stroke-width="1.6"/><path d="M372 400l-8 -12q8 -4 12 4zM372 400l12 4q-2 8 -10 6zM372 400l-6 10q-6 -6 -2 -12z" fill="${M.balloonMint}" opacity=".7"/>`
    + `<path d="M372 416v20M362 436h20" stroke="${M.tinDeep}" stroke-width="2.4"/>`, `<circle cx="372" cy="400" r="17"/>`);
  const floor = floorPage(ctx, laneFloor(ctx, { seed: 45, pavers: 40 }) + pools(ctx, [[300, GUTTER_Y + 40, 120, 30], [60, 480, 70, 20]]));
  return marketDefs(ctx) + standingPage(ctx, far + corner + shelfThings)
    + floor + coinBox(236, 330, 476) + coinBox(290, 270, 440) + dais + fan + sign + bookCues(ctx) + block();
};

// ——— 5-6 「蔥抓餅」 (spread) ———

/**
 * 5-6, the centrefold (its spine's crease is drawn live): the 蔥抓餅 stall. Over it all a long striped
 * awning and strings of bulbs, the night above. Left page: the stall's sign 「蔥抓餅」 hanging over
 * the vendor (Mocha's `sign`, its top at (54, 226)), a lantern from the awning (Mocha's `lantern`,
 * its top at (160, 236)), the menu 「原味 · 加蛋 · 加起司」. Right page: the back of the stall, smoke-
 * browned — a shelf of paper bags (the 土地公 printed on them at (300, 340)), egg trays, bundles of
 * scallions hanging, the tray dispenser's housing (the `c5/tray-stack` part at x 332–388), steam
 * from the griddle. The counter is the inner ledge (`stallCounter`), the lane the outer one.
 */
const scallionSpread: BackdropDraw = (ctx) => {
  const far = marketSky(ctx, 110, { moon: [330, 36, 12], seed: 51 }) + bulbString(ctx, -20, 70, 410, 74, 16, 30);
  const wall = depth(ctx, 2, `<rect x="-20" y="150" width="${PAGE_W + 40}" height="${GUTTER_Y - 150}" fill="${ref(ctx, 'smokeG')}"/>`
    + paperFibres(-20, 150, PAGE_W + 40, GUTTER_Y - 150, 40, M.laneDeep, 53, 0.35)
    + `<path d="M-20 300H410" stroke="${M.woodDeep}" stroke-width="4"/>`, `<rect x="-20" y="150" width="${PAGE_W + 40}" height="${GUTTER_Y - 150}"/>`);
  const roof = awning(ctx, -20, 410, 150, 26, { stripe: 20 }) + bulbString(ctx, -20, 182, 410, 182, 8, 30);
  // The menu board (left of centre)
  const menu = depth(ctx, 3, `<rect x="186" y="194" width="98" height="64" rx="3" fill="${M.woodDeep}"/><rect x="190" y="198" width="90" height="56" fill="${M.awningCream}"/>`, `<rect x="186" y="194" width="98" height="64"/>`)
    + `<text data-art-text="" x="235" y="212" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="10" fill="${M.vermilionDeep}">蔥抓餅</text>`
    + ['原味 35', '加蛋 45', '加起司 50'].map((t, i) => `<text data-art-text="" x="235" y="${225 + i * 11}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="700" font-size="8" fill="${C.printDark}">${t}</text>`).join('');
  // Hanging scallion bundles and an egg tray on the right page
  const scallions = [304, 322].map((x) => `<path d="M${x} 196v6" stroke="${C.printDark}" stroke-width="1"/>`
    + `<path d="M${x - 5} 202q-2 26 3 46M${x} 202q0 26 0 48M${x + 5} 202q2 26 -3 46" stroke="${M.scallion}" stroke-width="3.4" stroke-linecap="round" fill="none"/>`
    + `<path d="M${x - 3} 246q3 8 6 0" stroke="${M.scallionWhite}" stroke-width="4" stroke-linecap="round" fill="none"/>`).join('');
  const eggs = depth(ctx, 2, `<rect x="210" y="282" width="60" height="16" rx="2" fill="${C.corrugatedLight}"/>`
    + Array.from({ length: 5 }, (_, i) => `<ellipse cx="${218 + i * 11}" cy="282" rx="4.4" ry="5.4" fill="${C.washi}"/>`).join(''), `<rect x="210" y="276" width="60" height="22"/>`);
  // Paper bags on a shelf (the 土地公 is printed on them), the tray dispenser's housing behind its stack
  const bags = depth(ctx, 3, `<rect x="270" y="350" width="62" height="4" fill="${M.woodDeep}"/>`
    + [276, 296, 316].map((x) => `<path d="M${x} 350v-26h14v26z" fill="${C.kraft}"/><path d="M${x} 324l3 -4h8l3 4" fill="${mixHex(C.kraft, C.shadow, 0.2)}"/>`).join(''), `<rect x="270" y="318" width="62" height="36"/>`);
  const housing = depth(ctx, 2, `<rect x="334" y="196" width="52" height="${GUTTER_Y - 196}" rx="4" fill="${ref(ctx, 'steelG')}"/><rect x="346" y="210" width="28" height="${GUTTER_Y - 230}" rx="3" fill="${M.laneDeep}" opacity=".7"/>`
    + `<path d="M350 220v120M370 220v120" stroke="${M.tinDeep}" stroke-width="1" stroke-dasharray="4 3"/>`, `<rect x="334" y="196" width="52" height="${GUTTER_Y - 196}"/>`);
  // The sign over the vendor (Mocha's sign: its top at (54, 226)) and the lantern (top at (160, 236))
  const sign = `<path d="M24 176V226M84 176V226" stroke="${C.printDark}" stroke-width="1.4"/>` + signBoard(ctx, 8, 226, 92, 34, '蔥抓餅', { color: C.lampAmber });
  const steamUp = steam(ctx, 236, 330, 120, 1.4) + steam(ctx, 256, 320, 90, 1);
  const floor = floorPage(ctx, laneFloor(ctx, { seed: 55, pavers: 30 }) + pools(ctx, [[240, GUTTER_Y + 44, 170, 34], [60, 520, 80, 20, 'red'], [300, 540, 90, 20]]));
  return marketDefs(ctx) + standingPage(ctx, far + wall + roof + menu + scallions + eggs + housing + bags + steamUp
    + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'warmWash')}"/>`)
    + floor + sign + lantern(ctx, 160, 236, 15, 176) + bookCues(ctx) + block();
};

export const C5_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'c5/red-car': redCar,
  'c5/balloon-stall': balloonStall,
  'c5/market-lane': marketLane,
  'c5/pachinko': pachinko,
  'c5/massage-chairs': massageChairs,
  'c5/scallion-spread': scallionSpread,
};

// ——— Parts ———

/**
 * 5-1's car lights (a `light`; 哇！ from the far end switches them): `off`, the tube lamp under the
 * luggage rack is dark glass; `on`, it and the two ceiling strips blaze and the car fills with warm
 * light — a wash over the car and a pool on its floor. Local origin at the hit centre (310, 328).
 */
const carLights: PartSource = {
  preset: 'light',
  states: ['off', 'on'],
  box: { x: -334, y: -332, w: 430, h: 532 },
  draw(ctx, state) {
    const lit = state === 'on';
    const tube = (x: number, y: number, w: number) => `<rect x="${x}" y="${y}" width="${w}" height="6" rx="3" fill="${lit ? C.lampHot : M.tinDeep}"/>`
      + (lit ? softEllipse(ctx, x + w / 2, y + 3, w * 0.55, 10, 'lamp', 0.55) : `<path d="M${x + 3} ${y + 1.6}h${w - 6}" stroke="${M.tinLight}" stroke-width=".8" opacity=".5"/>`);
    // Page → local: x − 310, y − 328
    const rackLamp = depth(ctx, 3, `<rect x="-14" y="-40" width="96" height="12" rx="3" fill="${M.tinDeep}"/>`, `<rect x="-14" y="-40" width="96" height="12"/>`) + tube(-10, -36, 88);
    if (!lit) return rackLamp;
    return `<rect x="-330" y="-328" width="420" height="300" fill="${C.lamp}" opacity=".13"${ctx.filters ? filterAttr(ctx, 'blur18') : ''}/>`
      + `<ellipse cx="-115" cy="160" rx="240" ry="34" fill="${C.lamp}" opacity=".22"${ctx.filters ? filterAttr(ctx, 'blur18') : ''}/>`
      + tube(-298, -300, 150) + tube(-96, -300, 164) + rackLamp + softEllipse(ctx, 34, -10, 60, 30, 'lamp', 0.3, 'blur8');
  },
};

/**
 * 5-2's balloon basket (a counterweight `lift`): a wicker basket hung from a big bunch of balloons
 * (red, blue, pink, mint, lilac, foil highlights), its strings tied to the basket's rim. The origin
 * is the basket's floor (node `B`); Mocha sits on its rim at (28, −36). Up, the balloons are full
 * and taut; down (Mocha's weight), the bunch leans and the strings slacken.
 */
const balloonBasket: PartSource = {
  preset: 'lift',
  states: ['down', 'up'],
  box: { x: -60, y: -206, w: 120, h: 220 },
  draw(ctx, state) {
    const down = state === 'down';
    const lean = down ? 6 : 0;
    const bunch = [[-22, -150, M.balloonRed], [4, -164, M.balloonBlue], [26, -148, M.balloonPink], [-8, -126, M.balloonMint], [16, -124, M.balloonLilac], [-30, -122, M.balloonBlue], [34, -120, M.balloonRed]] as const;
    let strings = '';
    let balloons = '';
    for (const [x, y, col] of bunch) {
      const bx = x + lean, by = y + (down ? 6 : 0);
      strings += `M${f1(bx)} ${f1(by + 18)}Q${f1(bx * 0.6)} ${f1((by - 34) / 2)} ${x > 0 ? 22 : -22} -34`;
      balloons += balloon(bx, by, 14, col) + `<ellipse cx="${f1(bx - 5)}" cy="${f1(by - 6)}" rx="3.4" ry="4.6" fill="${C.foilShine}" opacity=".55"/>`;
    }
    const weave = 'M-30 -34H30L26 0H-26Z';
    let w = '';
    for (let y = -30; y < 0; y += 5) w += `M-29 ${y}H29`;
    for (let x = -24; x < 26; x += 8) w += `M${x} -34v34`;
    return `<path d="${strings}" stroke="${C.chalk}" stroke-width=".8" fill="none" opacity=".8"/>`
      + depth(ctx, 3, balloons, bunch.map(([x, y]) => `<ellipse cx="${x + lean}" cy="${y + (down ? 6 : 0)}" rx="14" ry="16"/>`).join(''))
      + depth(ctx, 3, `<path d="${weave}" fill="${C.corrugated}"/><path d="${w}" stroke="${C.corrugatedDark}" stroke-width="1.2" opacity=".7"/>`
        + `<rect x="-33" y="-38" width="66" height="7" rx="3.4" fill="${C.corrugatedLight}"/><path d="M-32 -37h64" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`, `<path d="${weave}"/><rect x="-33" y="-38" width="66" height="7"/>`);
  },
};

/**
 * 5-2's string of bulbs over the prize shelf (a `light`; 哇！ from up in the basket): `off`, grey
 * glass on a dark wire under the awning; `on`, warm pinholes blazing, their light washing the dart
 * board and the prizes. Local origin at the hit centre (310, 240).
 */
const stallBulbs: PartSource = {
  preset: 'light',
  states: ['off', 'on'],
  box: { x: -128, y: -30, w: 256, h: 120 },
  draw(ctx, state) {
    const lit = state === 'on';
    return (lit ? `<rect x="-116" y="-14" width="200" height="94" fill="${C.lamp}" opacity=".16"${ctx.filters ? filterAttr(ctx, 'blur8') : ''}/>` : '')
      + bulbString(ctx, -120, -22, 92, -22, 12, 14, lit);
  },
};

/**
 * 5-2's balloon bunch knot (a `prop`, the 淘氣): `tied`, the stall's spare bunch of balloons tied to a
 * brick by the pole, bobbing; `loose`, the knot undone and the whole bunch floating off up the page,
 * a chalk 「飛走了～」. Local origin at the hit centre (98, 408).
 */
const balloonKnot: PartSource = {
  preset: 'prop',
  states: ['tied', 'loose'],
  box: { x: -60, y: -260, w: 120, h: 290 },
  draw(ctx, state) {
    const brick = depth(ctx, 3, `<rect x="-12" y="8" width="24" height="14" rx="2" fill="${M.vermilionDeep}"/><path d="M-12 15h24M0 8v7" stroke="${M.laneDeep}" stroke-width=".8" opacity=".6"/>`, `<rect x="-12" y="8" width="24" height="14"/>`);
    const cols = [M.balloonPink, M.balloonMint, M.balloonLilac, M.balloonBlue, M.balloonRed];
    if (state === 'loose') {
      let b = '';
      cols.forEach((c, i) => { const x = -30 + i * 14, y = -230 + (i % 2) * 14; b += balloon(x, y, 9, c) + `<path d="M${x} ${y + 12}q4 10 -2 22" stroke="${C.chalk}" stroke-width=".7" fill="none" opacity=".7"/>`; });
      return brick + `<path d="M0 8q6 -8 -2 -14" stroke="${C.chalk}" stroke-width="1" fill="none"/>` + depth(ctx, 2, b, cols.map((_, i) => `<circle cx="${-30 + i * 14}" cy="${-230 + (i % 2) * 14}" r="9"/>`).join(''))
        + `<text data-art-text="" x="-6" y="-176" font-family="'Noto Serif TC'" font-weight="900" font-size="10" fill="${C.chalk}">飛走了～</text>`;
    }
    let b = '';
    let s = '';
    cols.forEach((c, i) => {
      const x = -24 + i * 12, y = -84 - (i % 2) * 18 - (i === 2 ? 12 : 0);
      s += `M0 8Q${f1(x * 0.4)} ${f1(y / 2)} ${x} ${y + 12}`;
      b += balloon(x, y, 11, c) + `<ellipse cx="${x - 4}" cy="${y - 4}" rx="2.6" ry="3.6" fill="${C.foilShine}" opacity=".55"/>`;
    });
    return `<path d="${s}" stroke="${C.chalk}" stroke-width=".8" fill="none" opacity=".8"/>` + depth(ctx, 3, b, cols.map((_, i) => `<circle cx="${-24 + i * 12}" cy="${-84 - (i % 2) * 18 - (i === 2 ? 12 : 0)}" r="11"/>`).join(''))
      + brick + `<path d="M-3 8q3 -5 6 0" stroke="${C.chalk}" stroke-width="1.6" fill="none"/>`;
  },
};

/**
 * 5-3's counter bell (a weight `button`; Mocha's weight rings it): a chrome desk bell on a little
 * wooden block with a 「按鈴」 card; `down`, pressed — the dome lit and chalk 「叮！」 rings out. Local
 * origin at the hit centre (296, 420); the counter's top is at local y 10.
 */
const counterBell: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -30, y: -32, w: 64, h: 50 },
  draw(ctx, state) {
    const down = state === 'down';
    const dome = 'M-11 2Q-11 -12 0 -12Q11 -12 11 2Z';
    return depth(ctx, 3, `<rect x="-16" y="2" width="32" height="8" rx="2" fill="${ref(ctx, 'woodG')}"/><path d="${dome}" fill="${ref(ctx, 'steelG')}"/>`
      + `<path d="M-6 -7q3 -3 6 -3" stroke="${C.cutRim}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
      + `<path d="M0 -12v${down ? -1 : -4}" stroke="${M.tinDeep}" stroke-width="2.4" stroke-linecap="round"/><circle cy="${down ? -13 : -16}" r="2.4" fill="${M.steelWarm}"/>`, `<path d="${dome}"/><rect x="-16" y="2" width="32" height="8"/>`)
      + `<rect x="-26" y="-2" width="12" height="12" rx="1" fill="${M.awningCream}"/><text data-art-text="" x="-20" y="6.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="4.6" fill="${M.vermilionDeep}">按鈴</text>`
      + (down ? softEllipse(ctx, 0, -6, 12, 9, 'lamp', 0.35)
        + `<g stroke="${C.chalk}" stroke-width="1.4" stroke-linecap="round" opacity=".9"><path d="M14 -14l5 -4M16 -6h6M-14 -14l-5 -4"/></g>`
        + `<text data-art-text="" x="16" y="-20" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.chalk}">叮！</text>` : '');
  },
};

/**
 * A carrier's art (#122, D-85): one bitmap per look — `idle`, `carrying` (every `carrying@k`), `back`
 * (a carry back along her route), `done`, and for a carrier who is called (`lockedWhen`) `away`. The
 * view picks the look (`view/parts/MoverView.tsx` `carrierLook`); feet at the origin.
 */
function carrier(looks: readonly string[], draw: (ctx: KitCtx, look: string) => string, box = { x: -64, y: -176, w: 128, h: 182 }): PartSource {
  return { preset: 'carrier', states: looks, box, draw };
}

const auntie = carrier(['idle', 'carrying', 'back', 'done'], (ctx, l) => auntieArt(ctx, l as 'idle'), { x: -76, y: -186, w: 152, h: 192 });
const chickenBoss = carrier(['idle', 'away', 'carrying', 'back', 'done'], (ctx, l) => bossArt(ctx, l as 'idle'), { x: -80, y: -196, w: 160, h: 202 });
const massageAbe = carrier(['idle', 'carrying', 'back', 'done'], (ctx, l) => abeArt(ctx, l as 'idle'), { x: -80, y: -170, w: 150, h: 176 });
const scallionVendor = carrier(['idle', 'carrying', 'back', 'done'], (ctx, l) => vendorArt(ctx, l as 'idle'), { x: -56, y: -158, w: 112, h: 164 });

// 5-4's board, flippers and knob

/**
 * 5-4's ball (a `tab` nobody drives: the board's state part, D-79; the cabinet itself is printed on
 * the backdrop, D-85): what lights up per state. `start`: the launcher's lamp at the top glows (the
 * ball waits there); `jackpot`: the jackpot hole blazes, a ring of bulbs and 「大獎！」 chase round it;
 * `tray`: the tray's lamp glows by his side. Local origin at the hit centre (265, 260).
 */
const pachinkoBoard: PartSource = {
  preset: 'tab',
  states: ['start', 'jackpot', 'tray'],
  box: { x: -150, y: -160, w: 270, h: 380 },
  draw(ctx, state) {
    // Page → local: x − 265, y − 260
    if (state === 'start') return softEllipse(ctx, 65, -140, 18, 12, 'lamp', 0.45) + `<path d="M50 -150h30" stroke="${C.lampHot}" stroke-width="2" stroke-linecap="round" opacity=".8"/>`;
    if (state === 'tray') return softEllipse(ctx, -105, 194, 42, 14, 'lamp', 0.5, 'blur8') + `<path d="M-138 188H-74" stroke="${C.lampHot}" stroke-width="1.6" opacity=".8"/>`;
    let ring = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ring += `M${f1(-29 + Math.cos(a) * 24 - 2)} ${f1(40 + Math.sin(a) * 24)}a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z`;
    }
    return softEllipse(ctx, -29, 40, 40, 32, 'lamp', 0.55, 'blur8') + `<circle cx="-29" cy="40" r="16" fill="${C.lampHot}" opacity=".85"/><circle cx="-29" cy="40" r="7" fill="${C.ink}"/>`
      + `<path d="${ring}" fill="${C.lampHot}"/>`
      + `<text data-art-text="" x="-29" y="76" text-anchor="middle" font-family="'Chiron GoRound TC'" font-weight="900" font-size="14" fill="${C.lampHot}">大獎！</text>`;
  },
};

/**
 * One of 5-4's flippers (under its tab card): a chrome paddle on a brass pivot in the lane below the
 * card, swung to send the ball left (`l`) or right (`r`), with a chalk arrow down the open lane.
 * Local origin at the tab's hit centre; the pivot at (0, 30).
 */
const flipper = (dy = 30): PartSource => ({
  preset: 'tab',
  states: ['l', 'r'],
  box: { x: -40, y: dy - 18, w: 80, h: 44 },
  draw(ctx, state) {
    const k = state === 'l' ? -1 : 1;
    const paddle = `M0 ${dy - 4}L${22 * k} ${dy + 10}L${20 * k} ${dy + 14}L0 ${dy + 4}Z`;
    return depth(ctx, 3, `<path d="${paddle}" fill="${ref(ctx, 'steelG')}"/><path d="M0 ${dy - 3}L${21 * k} ${dy + 10}" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`, `<path d="${paddle}"/>`)
      + `<circle cx="0" cy="${dy}" r="4" fill="${ref(ctx, 'foil')}"/>`
      + `<path d="M${10 * k} ${dy + 4}l${10 * k} 12m${-5 * k} 1l${5 * k} -1l0 -5" stroke="${C.chalk}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/>`;
  },
});

/**
 * 5-4's launch knob (a weight `button` on the board's lower panel; Mocha's weight fires the ball): a
 * big chrome knob on a spring plunger with 「發射」 under it; `down`, the spring squashed, chalk 「咻！」
 * and speed ticks. Local origin at the hit centre (330, 428).
 */
const launchKnob: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -30, y: -30, w: 64, h: 52 },
  draw(ctx, state) {
    const down = state === 'down';
    const top = down ? -6 : -12;
    let spring = '';
    for (let y = top + 8; y < 6; y += down ? 2.4 : 3.6) spring += `M-5 ${f1(y)}l10 1.4`;
    return depth(ctx, 3, `<path d="${spring}" stroke="${M.steelWarm}" stroke-width="1.6"/><ellipse cx="0" cy="${top + 4}" rx="13" ry="7" fill="${ref(ctx, 'steelG')}"/><ellipse cx="-3" cy="${top + 2}" rx="5" ry="2.4" fill="${C.cutRim}" opacity=".6"/>`
      + `<rect x="-14" y="6" width="28" height="6" rx="2" fill="${M.tinDeep}"/>`, `<ellipse cx="0" cy="${top + 4}" rx="13" ry="7"/><rect x="-14" y="${top + 4}" width="28" height="${12 - top - 4}"/>`)
      + `<text data-art-text="" x="0" y="19" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6" fill="${M.boardPrint}">發射</text>`
      + (down ? `<g stroke="${C.chalk}" stroke-width="1.4" stroke-linecap="round" opacity=".9"><path d="M18 -18l6 -8M22 -10l8 -4"/></g><text data-art-text="" x="16" y="-24" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.chalk}">咻！</text>` : '');
  },
};

// 5-5's chairs and coins

/**
 * A coin massage chair (a `lift`: a coin in its slot reclines it into a grown-up's step), side on,
 * facing −x: maroon leather on a chrome frame, a padded arm with the coin slot at its front, a
 * footrest, a headrest. The origin is its step (node `step1` / `step2`). `up`: sitting upright, the
 * origin on its seat, its tall back a wall; `flat`: reclined into a long slope rising to +x — the
 * origin mid-way up it — humming (chalk 「嗡嗡～」). `foot` is the floor (or the dais) under it in
 * local units, per state.
 */
function massageChair(footUp: number, footFlat: number): PartSource {
  return {
    preset: 'lift',
    states: ['up', 'flat'],
    box: { x: -54, y: -104, w: 128, h: 180 },
    draw(ctx, state) {
      const flat = state === 'flat';
      const foot = flat ? footFlat : footUp;
      // The pieces, in the chair's own frame: seat top at y 0 (up) — reclined, rotated about its hip
      const seat = 'M-30 0H20Q28 0 28 6V16H-30Q-34 16 -34 10V4Q-34 0 -30 0Z';
      const back = 'M14 2L22 -78Q24 -90 36 -88Q46 -86 44 -74L36 6Z';
      const head = 'M24 -84q2 -14 14 -12q10 2 8 12z';
      const rest = 'M-34 6L-50 40Q-50 46 -44 46L-38 44L-22 12Z';
      const arm = 'M-20 -22H18Q22 -22 22 -18V-12H-20Q-24 -12 -24 -16Q-24 -22 -20 -22Z';
      const pose = flat ? 'rotate(58 22 4)' : '';
      const restPose = flat ? 'rotate(50 -30 8)' : '';
      const chair = `<g transform="${pose}"><path d="${back}" fill="${ref(ctx, 'leatherG')}"/><path d="${head}" fill="${M.leatherLight}"/>`
        + `<path d="M22 -66l12 2M20 -46l13 2M18 -26l13 2" stroke="${M.leatherDeep}" stroke-width="1.4" opacity=".7"/></g>`
        + `<g transform="${restPose}"><path d="${rest}" fill="${M.leatherDeep}"/></g>`
        + `<path d="${seat}" fill="${M.leather}"/><path d="M-30 4h52" stroke="${M.leatherLight}" stroke-width="1.6" opacity=".7"/>`
        + (flat ? '' : `<path d="${arm}" fill="${M.leatherLight}"/><rect x="-18" y="-20" width="7" height="4" rx="1" fill="${C.printDark}"/><circle cx="12" cy="-17" r="2.4" fill="${C.lampAmber}"/>`);
      const frame = `<path d="M-24 16L-30 ${foot}M18 16L26 ${foot}M-34 ${foot}H32" stroke="${M.steelWarm}" stroke-width="5" stroke-linecap="round"/><path d="M-24 16L-30 ${foot}M18 16L26 ${foot}" stroke="${M.tinDeep}" stroke-width="1.4" transform="translate(1.6 0)"/>`;
      const outline = flat
        ? `<path d="M-74 18L-34 0H20L90 34L84 44L36 16H-30Z"/>`
        : `<path d="${seat}"/><path d="${back}"/><path d="${rest}"/><path d="${head}"/>`;
      return softEllipse(ctx, -2, foot, 40, 4, 'shadow', 0.45)
        + depth(ctx, 3, frame + chair, outline + `<rect x="-34" y="0" width="66" height="${foot}"/>`)
        + (flat ? softEllipse(ctx, 10, -10, 40, 30, 'lamp', 0.12, 'blur8')
          + `<g stroke="${C.chalk}" stroke-width="1.3" stroke-linecap="round" opacity=".9"><path d="M-44 -14l-5 -3M-46 -4h-7M60 -78l5 -4M64 -66h7"/></g>`
          + `<text data-art-text="" x="-48" y="-24" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.chalk}">嗡嗡～</text>` : '');
    },
  };
}

/**
 * A NT$10 coin (a pushable, C3), local origin at its centre: standing on its edge on a massage
 * chair's coin box (`onPerch`), tumbling (`falling`), half into the slot (`landed`). Steel, never
 * gold: the gold bead is the only gold on the page. Its face carries a plum blossom, as the coin does.
 */
const coin: PartSource = {
  preset: 'pushable',
  states: ['onPerch', 'falling', 'landed'],
  box: { x: -20, y: -20, w: 40, h: 40 },
  draw(ctx: KitCtx, state) {
    const face = depth(ctx, 2, `<circle r="10" fill="${ref(ctx, 'silver')}"/><circle r="7.6" fill="none" stroke="${T.steelDeep}" stroke-width="1"/>`
      + `<text data-art-text="" y="3.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${T.steelDeep}">10</text>`
      + `<path d="M-6 -6.4q3 -2.4 6.4 -2.4" stroke="${C.foilShine}" stroke-width="1.4" stroke-linecap="round" fill="none"/>`, `<circle r="10"/>`);
    if (state === 'landed') {
      return `<g transform="translate(0 -4)">${face}</g><rect x="-13" y="0" width="26" height="6" rx="2" fill="${C.printDark}"/>`
        + `<path d="M-12 .6H12" stroke="${mixHex(C.printDark, C.chalk, 0.4)}" stroke-width=".8"/>`
        + `<text data-art-text="" x="12" y="-10" font-family="'Noto Serif TC'" font-weight="900" font-size="7" fill="${C.chalk}">叮</text>`;
    }
    const turn = state === 'falling' ? 'rotate(35) scale(.7 1)' : '';
    return softEllipse(ctx, 0, 12, 9, 2, 'shadow', 0.35) + `<g transform="${turn}">${face}</g>`;
  },
};

// 5-6's tray stack and pancake

/**
 * 5-6's tray stack (a counterweight `lift`): a spring-loaded dispenser of baking trays — a stack of
 * steel trays riding up out of its housing on a spring. `up`: the stack sprung high (the 蔥's tray
 * out of sight up there); `down` (Mocha's weight): squashed down to the stall's floor, the spring
 * coiled tight. The origin is node `T` (where the 蔥 lies, on the stack's lowest tray lip); the top
 * of the stack at (−10, −32) is Mocha's seat.
 */
const trayStack: PartSource = {
  preset: 'lift',
  states: ['up', 'down'],
  box: { x: -34, y: -40, w: 68, h: 210 },
  draw(ctx, state) {
    const down = state === 'down';
    let trays = '';
    for (let i = 0; i < 6; i++) {
      const y = -30 + i * 5;
      trays += `<rect x="-26" y="${y}" width="44" height="4" rx="1.4" fill="${ref(ctx, 'steelG')}"/><path d="M-25 ${y + 0.6}h42" stroke="${C.cutRim}" stroke-width=".6" opacity=".6"/>`;
    }
    // The lip the 蔥 lies on, and the spring under the stack (long while up, coiled while down)
    const lip = `<rect x="-30" y="0" width="56" height="4" rx="1.4" fill="${M.tinDeep}"/>`;
    const springH = down ? 10 : 156;
    let coil = '';
    for (let y = 4; y < 4 + springH; y += down ? 2 : 9) coil += `M-14 ${y}l24 ${down ? 1.2 : 4.4}`;
    return depth(ctx, 3, `<path d="${coil}" stroke="${M.steelWarm}" stroke-width="1.8"/>` + lip + trays, `<rect x="-30" y="-30" width="56" height="${34 + springH}"/>`);
  },
};

/**
 * 5-6's pancake (a `prop`, the 淘氣): a 蔥抓餅 on the griddle's front, layered paper rounds (bible §
 * 6 row 5: 「蔥抓餅 as layered paper rounds」) flecked with scallion; `up` golden side up, `flipped`
 * mid-air over the spatula with a chalk 「翻！」 and steam. Local origin at the hit centre (224, 432).
 */
const pancake: PartSource = {
  preset: 'prop',
  states: ['up', 'flipped'],
  box: { x: -30, y: -46, w: 60, h: 64 },
  draw(ctx, state) {
    const rounds = (y: number) => `<ellipse cx="0" cy="${y + 2}" rx="18" ry="5.4" fill="${M.pancakeDeep}"/><ellipse cx="0" cy="${y}" rx="18" ry="5.4" fill="${M.pancake}"/>`
      + `<path d="M-12 ${y}q12 3 24 0M-8 ${y - 2}q8 2 16 0" stroke="${M.pancakeDeep}" stroke-width=".8" fill="none" opacity=".7"/>`
      + `<path d="M-9 ${y - 1}h2M2 ${y + 1}h2M8 ${y - 2}h2M-3 ${y + 2}h2" stroke="${M.scallion}" stroke-width="1.6" stroke-linecap="round"/>`;
    if (state === 'flipped') {
      return `<g transform="translate(0 -26) rotate(-24)">${depth(ctx, 3, rounds(0), `<ellipse cx="0" cy="0" rx="18" ry="6"/>`)}</g>`
        + `<path d="M-20 4l16 -6" stroke="${M.woodDeep}" stroke-width="1.8" stroke-linecap="round"/><path d="M-6 -4l8 -3l2 4l-8 3z" fill="${M.steelWarm}"/>`
        + `<path d="M16 -40q6 -4 4 -10M-20 -30q-6 -4 -2 -10" stroke="${C.chalk}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/>`
        + `<text data-art-text="" x="12" y="-30" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.chalk}">翻！</text>`;
    }
    return depth(ctx, 3, rounds(0), `<ellipse cx="0" cy="1" rx="18" ry="6.4"/>`) + steam(ctx, 0, -6, 30, 0.6);
  },
};

/** Every part draws over the market kit's gradients (the leather, the steel, the wood). */
const withKit = (src: PartSource): PartSource => ({ ...src, draw: (ctx, state) => marketDefs(ctx) + src.draw(ctx, state) });

export const C5_PARTS: Readonly<Record<string, PartSource>> = Object.fromEntries(Object.entries({
  'c5/car-lights': carLights,
  'c5/balloon-basket': balloonBasket,
  'c5/stall-bulbs': stallBulbs,
  'c5/balloon-knot': balloonKnot,
  'c5/chicken-boss': chickenBoss,
  'c5/auntie': auntie,
  'c5/counter-bell': counterBell,
  'c5/pachinko-board': pachinkoBoard,
  'c5/flipper-upper': flipper(),
  'c5/flipper-lower': flipper(),
  'c5/launch-knob': launchKnob,
  'c5/massage-abe': massageAbe,
  'c5/massage-chair-1': massageChair(34, 56),
  'c5/massage-chair-2': massageChair(40, 66),
  'c5/coin': coin,
  'c5/scallion-vendor': scallionVendor,
  'c5/tray-stack': trayStack,
  'c5/pancake': pancake,
}).map(([key, src]) => [key, withKit(src)]));
