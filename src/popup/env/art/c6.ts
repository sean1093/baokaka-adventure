import { POPUP as C, POPUP_AIRPORT as A, POPUP_STATION as T, mixHex } from '../../../art/palette';
import { depth, f1, filterAttr, pageBlock, pinholes, ref, seeded, skyline, softEllipse, sparkle, wheelRim, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, VANISHING_POINT, floorWiden } from '../../view/geometry';
import type { BackdropDraw, PartSource } from '../sources';
import { clerk } from './c1';
import { FLOOR_RECT, bookCues, calmMoon, floorPage, lin, paperFibres, rad, shushuPeek, standingPage, windowView } from './common';
import { crewArt } from '../../view/art/airport';

/**
 * Chapter 6 (松山機場, 02:50) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#123) drew 6-1's front window and 6-6's 印章 as
 * placeholders; the chapter's art issue (#124) draws the palette kit, the six backdrops and every part.
 *
 * **The kit** (bible § 6 row 6, `POPUP_AIRPORT`): runway blue and white dominant, taxi-light amber
 * and wing-tip red the accent. The airport's lights are the chapter's beauty — the runway's edge
 * lights as rows of pinholes converging on the dark (`lightLine`, `runway`), the taxiways' blue
 * edges and green centre line, amber guidance boards — and its planes sleep: sharp **origami jets**
 * (`jet`: a faceted fuselage in three tones with a crease line, swept wings, a fin; no airline's
 * livery), their cabins dark, a wing-tip light glowing. The signature materials are the terminal's
 * **glassine glass** (`curtainWall`) and silver foil (the jet bridge, the X-ray machine). The floor
 * page is the apron's tarmac (`apronFloor`) or the terminal's terrazzo (`terrazzoFloor`). Ledges:
 * `carBodyWenhu`, `terminalFloor`, `deckBoards`, `bridgeFloor`, `catwalk` (`view/art/ledges.ts`).
 */

/** The page block under the floor page. */
const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};

type Pt = readonly [number, number];

// ——— The palette kit ———

/** The airport's gradient defs, shared by the chapter's backdrops and parts. */
export function airportDefs(ctx: KitCtx): string {
  return `<defs>`
    + lin(ctx, 'glassG', [[0, mixHex(A.glassDeep, C.shadow, 0.3)], [0.55, A.glassDeep], [1, A.glass]])
    + lin(ctx, 'tarmacG', [[0, mixHex(A.tarmacDeep, C.shadow, 0.3)], [0.45, A.tarmac], [1, A.tarmacLight]])
    + lin(ctx, 'whiteG', [[0, A.white], [1, A.whiteShade]])
    + lin(ctx, 'hallG', [[0, mixHex(A.whiteDeep, A.runwayDeep, 0.7)], [0.55, mixHex(A.whiteDeep, A.runwayDeep, 0.38)], [1, mixHex(A.whiteShade, A.whiteDeep, 0.6)]])
    + lin(ctx, 'steelG', [[0, A.steelDeep], [0.35, A.steel], [0.55, A.steelLight], [1, A.steelDeep]], 'h')
    + lin(ctx, 'steelV', [[0, A.steelLight], [1, A.steelDeep]])
    + lin(ctx, 'fuselageG', [[0, A.fuselage], [0.55, A.fuselageShade], [1, A.fuselageDeep]])
    + lin(ctx, 'carWallG', [[0, mixHex(A.carWall, A.runwayDeep, 0.32)], [1, mixHex(A.carWallShade, A.runwayDeep, 0.3)]])
    + lin(ctx, 'counterG', [[0, A.counterLight], [1, A.counterDeep]])
    + lin(ctx, 'xrayG', [[0, A.xray], [1, A.xrayDeep]])
    + lin(ctx, 'towerG', [[0, A.towerGlassLight], [1, A.towerGlass]])
    + lin(ctx, 'blueWash', [[0, A.taxiBlue, 0], [1, A.taxiBlue, 0.14]])
    + lin(ctx, 'amberWash', [[0, A.taxiAmber, 0], [1, A.taxiAmber, 0.16]])
    + rad(ctx, 'amberPool', [[0, C.lamp, 0.4], [0.55, A.taxiAmber, 0.14], [1, A.taxiAmber, 0]])
    + rad(ctx, 'bluePool', [[0, A.taxiBlue, 0.3], [0.6, A.taxiBlue, 0.08], [1, A.taxiBlue, 0]])
    + `</defs>`;
}

/** Light pools on the floor page: warm under lamps, blue by the taxiway's lights. */
const pools = (ctx: KitCtx, list: readonly (readonly [number, number, number, number, ('amber' | 'blue')?])[]) =>
  list.map(([cx, cy, rx, ry, tone]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ref(ctx, tone === 'blue' ? 'bluePool' : 'amberPool')}"/>`).join('');

const blur = (ctx: KitCtx, name: 'blur3' | 'blur8' | 'blur18' = 'blur3') => (ctx.filters ? filterAttr(ctx, name) : '');

/**
 * A row of airfield lights from `a` to `b` (`b` the far end): `n` pinholes whose size shrinks from
 * `r0` to `r1` with distance, each with a soft bloom (one blurred group) and a hot core. Unlit
 * (`lit` false), dark glass caps.
 */
export function lightLine(ctx: KitCtx, a: Pt, b: Pt, n: number, colour: string, r0 = 2.4, r1 = 0.8, lit = true): string {
  let cores = '';
  let blooms = '';
  for (let i = 0; i < n; i++) {
    // Perspective spacing: closer together toward the far end
    const t = n > 1 ? 1 - (1 - i / (n - 1)) ** 1.6 : 0;
    const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
    const r = r0 + (r1 - r0) * t;
    cores += `M${f1(x - r)} ${f1(y)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0z`;
    blooms += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 2.6)}"/>`;
  }
  if (!lit) return `<path d="${cores}" fill="${A.tarmacLight}"/>`;
  return `<g fill="${colour}" opacity=".55"${blur(ctx)}>${blooms}</g><path d="${cores}" fill="${colour}"/><path d="${cores}" fill="${C.lampHot}" opacity=".55" transform="translate(0 -.3)"/>`;
}

/**
 * A runway in perspective: the strip from its near edge (`nl`–`nr`) to its far edge (`fl`–`fr`),
 * dark asphalt with the centre line's dashes and the piano-key threshold; its edge lights (white,
 * amber over the far third), green threshold lights across the near end and red ones across the far
 * end. Unlit (`lit` false), every fixture is a dark cap (6-5's runway before 哇！).
 */
export function runway(ctx: KitCtx, nl: Pt, nr: Pt, fl: Pt, fr: Pt, { n = 14, lit = true, paint = true } = {}): string {
  const lerp = (p: Pt, q: Pt, t: number): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const strip = `M${nl[0]} ${nl[1]}L${nr[0]} ${nr[1]}L${fr[0]} ${fr[1]}L${fl[0]} ${fl[1]}Z`;
  let dashes = '';
  const nc = lerp(nl, nr, 0.5), fc = lerp(fl, fr, 0.5);
  for (let i = 0; i < 10; i++) {
    const t0 = 1 - (1 - i / 10) ** 1.6, t1 = 1 - (1 - (i + 0.45) / 10) ** 1.6;
    const p = lerp(nc, fc, t0), q = lerp(nc, fc, t1);
    dashes += `M${f1(p[0])} ${f1(p[1])}L${f1(q[0])} ${f1(q[1])}`;
  }
  let keys = '';
  for (let k = 0; k < 8; k++) {
    const u0 = 0.08 + k * 0.105 + (k > 3 ? 0.04 : 0), u1 = u0 + 0.06;
    const a = lerp(nl, nr, u0), b = lerp(nl, nr, u1);
    const c = lerp(lerp(nl, fl, 0.05), lerp(nr, fr, 0.05), u1), d = lerp(lerp(nl, fl, 0.05), lerp(nr, fr, 0.05), u0);
    keys += `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}L${f1(c[0])} ${f1(c[1])}L${f1(d[0])} ${f1(d[1])}Z`;
  }
  const w = Math.hypot(nr[0] - nl[0], nr[1] - nl[1]);
  const amberFrom = lerp(nl, fl, 0.66), amberFromR = lerp(nr, fr, 0.66);
  return `<path d="${strip}" fill="${A.tarmacDeep}"/>`
    + (paint ? `<path d="${dashes}" stroke="${A.paint}" stroke-width="${f1(Math.max(0.6, w / 90))}" opacity=".45"/><path d="${keys}" fill="${A.paint}" opacity=".35"/>` : '')
    + lightLine(ctx, nl, amberFrom, Math.round(n * 0.7), C.lampHot, 2.4, 1.1, lit) + lightLine(ctx, amberFrom, fl, Math.round(n * 0.4), A.taxiAmber, 1.1, 0.6, lit)
    + lightLine(ctx, nr, amberFromR, Math.round(n * 0.7), C.lampHot, 2.4, 1.1, lit) + lightLine(ctx, amberFromR, fr, Math.round(n * 0.4), A.taxiAmber, 1.1, 0.6, lit)
    + lightLine(ctx, nl, nr, 9, A.wingGreen, 1.8, 1.8, lit) + lightLine(ctx, fl, fr, 6, A.wingRed, 0.8, 0.8, lit);
}

/** A taxiway: a curve of blue edge lights with the green centre line beside it, from `a` to `b` bending through `c`. */
function taxiway(ctx: KitCtx, a: Pt, c: Pt, b: Pt, n: number, r0 = 1.8, r1 = 0.8): string {
  const pts = (off: number): Pt[] => Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0];
    const y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1] + off * (1 - t);
    return [x, y];
  });
  const dots = (list: Pt[], colour: string, k: number) => {
    let d = '';
    let bl = '';
    list.forEach(([x, y], i) => {
      const r = (r0 + (r1 - r0) * (i / (n - 1))) * k;
      d += `M${f1(x - r)} ${f1(y)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0z`;
      bl += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 2.4)}"/>`;
    });
    return `<g fill="${colour}" opacity=".5"${blur(ctx)}>${bl}</g><path d="${d}" fill="${colour}"/>`;
  };
  return dots(pts(-6), A.taxiBlue, 1) + dots(pts(6), A.taxiBlue, 1) + dots(pts(0), A.wingGreen, 0.7);
}

/** An amber taxi guidance board on two legs (black face, amber lettering, lit from inside). */
function guideBoard(ctx: KitCtx, x: number, y: number, s: number, text: string): string {
  const w = text.length * 7 * s + 8 * s, h = 10 * s;
  return `<path d="M${f1(x + 2 * s)} ${f1(y + h)}v${f1(3 * s)}M${f1(x + w - 2 * s)} ${f1(y + h)}v${f1(3 * s)}" stroke="${A.tarmacDeep}" stroke-width="${f1(s)}"/>`
    + `<rect x="${f1(x - 3 * s)}" y="${f1(y - 3 * s)}" width="${f1(w + 6 * s)}" height="${f1(h + 6 * s)}" fill="${A.taxiAmber}" opacity=".18"${blur(ctx, 'blur3')}/>`
    + `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(s)}" fill="${C.printDark}"/>`
    + `<text data-art-text="" x="${f1(x + w / 2)}" y="${f1(y + h * 0.78)}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${f1(8 * s)}" fill="${A.taxiAmber}">${text}</text>`;
}

/** The airport's sky: the colour clock's 02:50, pinholes, a small calm moon, and Taipei's lights on the horizon. */
function airportSky(ctx: KitCtx, base: number, { moon = null as readonly [number, number, number] | null, seed = 6, city = true } = {}): string {
  const sk = skyline(-6, PAGE_W + 6, base, seed + 40, { minH: 10, maxH: 40, winP: 0.22, winOpacity: 0.7 });
  return `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, 0, 0, PAGE_W, base - 40, 46, seed)
    + (moon ? calmMoon(ctx, moon[0], moon[1], moon[2], { halo: 0.06 }) : '')
    + (city ? depth(ctx, 1, `<path d="${sk.d}" fill="${mixHex(A.runwayDeep, C.shadow, 0.25)}"/>`, `<path d="${sk.d}"/>`) + sk.windows : '')
    + `<rect x="-20" y="${base - 40}" width="${PAGE_W + 40}" height="40" fill="${ref(ctx, 'blueWash')}"/>`;
}

/**
 * 圓山大飯店 on its hill across the river (松山機場's neighbour, drawn small and with affection): a
 * dark wooded hill, the hotel's red columns and its golden-ridged palace roof lit warm, the base `y`.
 */
function grandHotel(ctx: KitCtx, x: number, y: number, s = 1): string {
  const hill = `M${f1(x - 70 * s)} ${y}Q${f1(x - 30 * s)} ${f1(y - 34 * s)} ${f1(x + 10 * s)} ${f1(y - 30 * s)}Q${f1(x + 50 * s)} ${f1(y - 28 * s)} ${f1(x + 80 * s)} ${y}Z`;
  const bx = x - 6 * s, by = y - 30 * s;
  const body = `<rect x="${f1(bx - 22 * s)}" y="${f1(by - 16 * s)}" width="${f1(44 * s)}" height="${f1(14 * s)}" fill="${mixHex(C.hatRed, C.shadow, 0.35)}"/>`;
  const windows = Array.from({ length: 7 }, (_, i) => `<rect x="${f1(bx - 19 * s + i * 6 * s)}" y="${f1(by - 13 * s)}" width="${f1(3 * s)}" height="${f1(8 * s)}" fill="${C.lamp}" opacity=".85"/>`).join('');
  const roof = `M${f1(bx - 28 * s)} ${f1(by - 16 * s)}Q${f1(bx - 18 * s)} ${f1(by - 20 * s)} ${f1(bx - 16 * s)} ${f1(by - 25 * s)}H${f1(bx + 16 * s)}Q${f1(bx + 18 * s)} ${f1(by - 20 * s)} ${f1(bx + 28 * s)} ${f1(by - 16 * s)}Z`;
  const top = `M${f1(bx - 12 * s)} ${f1(by - 25 * s)}Q${f1(bx - 8 * s)} ${f1(by - 28 * s)} ${f1(bx - 6 * s)} ${f1(by - 32 * s)}H${f1(bx + 6 * s)}Q${f1(bx + 8 * s)} ${f1(by - 28 * s)} ${f1(bx + 12 * s)} ${f1(by - 25 * s)}Z`;
  return softEllipse(ctx, bx, by - 14 * s, 34 * s, 16 * s, 'lamp', 0.16, 'blur8')
    + depth(ctx, 1, `<path d="${hill}" fill="${mixHex(A.runwayDeep, C.shadow, 0.45)}"/>`, `<path d="${hill}"/>`)
    + body + windows
    + `<path d="${roof}${top}" fill="${mixHex(C.hatRed, C.shadow, 0.2)}"/>`
    + `<path d="M${f1(bx - 28 * s)} ${f1(by - 16 * s)}Q${f1(bx - 18 * s)} ${f1(by - 20 * s)} ${f1(bx - 16 * s)} ${f1(by - 25 * s)}H${f1(bx + 16 * s)}Q${f1(bx + 18 * s)} ${f1(by - 20 * s)} ${f1(bx + 28 * s)} ${f1(by - 16 * s)}M${f1(bx - 12 * s)} ${f1(by - 25 * s)}Q${f1(bx - 8 * s)} ${f1(by - 28 * s)} ${f1(bx - 6 * s)} ${f1(by - 32 * s)}H${f1(bx + 6 * s)}" stroke="${C.goldLight}" stroke-width="${f1(0.9 * s)}" fill="none"/>`;
}

/** The airport's control tower in the distance: a slim shaft, the flared cab of green-blue glass lit inside, an antenna with a red light. */
function farTower(ctx: KitCtx, x: number, base: number, s = 1): string {
  const top = base - 120 * s;
  const shaft = `M${f1(x - 6 * s)} ${base}L${f1(x - 4 * s)} ${f1(top + 18 * s)}H${f1(x + 4 * s)}L${f1(x + 6 * s)} ${base}Z`;
  const cab = `M${f1(x - 14 * s)} ${f1(top + 4 * s)}L${f1(x - 10 * s)} ${f1(top + 18 * s)}H${f1(x + 10 * s)}L${f1(x + 14 * s)} ${f1(top + 4 * s)}Z`;
  return depth(ctx, 1, `<path d="${shaft}" fill="${mixHex(A.whiteDeep, A.runwayDeep, 0.5)}"/><rect x="${f1(x - 11 * s)}" y="${f1(top)}" width="${f1(22 * s)}" height="${f1(4 * s)}" fill="${A.whiteDeep}"/>`
    + `<path d="${cab}" fill="${ref(ctx, 'towerG')}"/><path d="M${f1(x - 12 * s)} ${f1(top + 10 * s)}H${f1(x + 12 * s)}" stroke="${C.lamp}" stroke-width="${f1(1.2 * s)}" opacity=".6"/>`, `<path d="${shaft}${cab}"/>`)
    + `<path d="M${x} ${f1(top)}V${f1(top - 14 * s)}" stroke="${A.whiteDeep}" stroke-width="${f1(s)}"/>`
    + softEllipse(ctx, x, top - 14 * s, 3 * s, 3 * s, 'lamp', 0.3) + `<circle cx="${x}" cy="${f1(top - 14 * s)}" r="${f1(1.4 * s)}" fill="${A.wingRed}"/>`;
}

// ——— The origami jet ———

/** What a jet is drawn as. */
interface JetOpts {
  /** Facing +x (nose right) or −x */
  readonly dir?: 1 | -1;
  readonly s?: number;
  /** The 貨機: grey, a short row of windows at the front only */
  readonly cargo?: boolean;
  readonly z?: 1 | 2 | 3;
}

// The unit jet, facing +x, its origin on the belly under the wing root (about 214 long, 72 tall)
const JET = {
  body: 'M-92 -28H74C92 -28 104 -22 108 -12C109 -6 104 -1 96 0H-78L-106 -20C-106 -25 -100 -28 -92 -28Z',
  top: 'M-92 -28H74C92 -28 104 -22 108 -12L-103 -14L-106 -20C-106 -25 -100 -28 -92 -28Z',
  fin: 'M-68 -28L-98 -74H-84L-48 -28Z',
  finLit: 'M-68 -28L-98 -74H-91L-58 -28Z',
  stab: 'M-82 -14L-118 -24L-112 -12Z',
  farWing: 'M-6 -24L-38 -42H-29L14 -24Z',
  wing: 'M-16 -6L-60 26L-47 28L24 -4Z',
  wingLit: 'M-16 -6L-60 26L-54 27L4 -5Z',
  engine: 'M-18 2H10Q18 2 18 9Q18 16 10 16H-18Q-22 9 -18 2Z',
  cockpit: 'M84 -22L97 -22L102 -16L86 -16Z',
} as const;

/** The jet's window points (unit space). */
const jetWindows = (cargo = false): Pt[] => {
  const out: Pt[] = [];
  for (let x = cargo ? 50 : -72; x <= 66; x += 6.6) if (Math.abs(x + 76) > 4 && Math.abs(x - 60) > 4) out.push([x, -17]);
  return out;
};

const jetT = (x: number, y: number, { dir = 1, s = 1 }: JetOpts) => `translate(${f1(x)} ${f1(y)}) scale(${f1(dir * s)} ${f1(s)})`;

/**
 * A sleeping origami jet (bible § 6 row 6: "a paper jet as a sharp origami fold"): the fuselage in
 * three tones — a lit top facet over the crease, the shaded belly — swept wings (the far one peeking
 * over the back), the fin and tailplane, an engine under the near wing, the cockpit's dark glass,
 * door outlines and a row of dark windows; no airline's livery. Its lights are `jetLights`.
 */
function jet(ctx: KitCtx, x: number, y: number, o: JetOpts = {}): string {
  const body = o.cargo ? A.cargo : A.fuselage;
  const shade = o.cargo ? A.cargoDeep : A.fuselageShade;
  const tail = o.cargo ? A.cargoDeep : A.tail;
  let win = '';
  for (const [wx, wy] of jetWindows(o.cargo)) win += `M${f1(wx - 1.4)} ${wy - 2}h2.8v4h-2.8z`;
  const art = `<path d="${JET.stab}" fill="${shade}"/><path d="${JET.farWing}" fill="${mixHex(shade, C.shadow, 0.3)}"/>`
    + `<path d="${JET.fin}" fill="${tail}"/><path d="${JET.finLit}" fill="${mixHex(tail, C.cutRim, 0.18)}"/>`
    + `<path d="${JET.body}" fill="${shade}"/><path d="${JET.top}" fill="${body}"/>`
    + `<path d="M-103 -14L108 -12" stroke="${mixHex(shade, C.shadow, 0.3)}" stroke-width=".8" opacity=".7"/>`
    + `<path d="${win}" fill="${mixHex(A.glassDeep, C.shadow, 0.2)}"/>`
    + `<path d="M58 -25v18h5v-18zM-80 -24v16h5v-16z" fill="none" stroke="${mixHex(shade, C.shadow, 0.35)}" stroke-width=".8"/>`
    + `<path d="${JET.cockpit}" fill="${A.glassDeep}"/><path d="M87 -21L94 -21" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`
    + `<path d="M-6 0v6M90 0v6" stroke="${C.printDark}" stroke-width="2"/><circle cx="-6" cy="7" r="3" fill="${C.printDark}"/><circle cx="90" cy="7" r="2.6" fill="${C.printDark}"/>`
    + `<path d="${JET.engine}" fill="${A.engine}"/><ellipse cx="16" cy="9" rx="2.6" ry="6.6" fill="${mixHex(A.engine, C.shadow, 0.5)}"/>`
    + `<path d="${JET.wing}" fill="${shade}"/><path d="${JET.wingLit}" fill="${body}"/>`;
  const outline = `<path d="${JET.body}"/><path d="${JET.fin}"/><path d="${JET.wing}"/><path d="${JET.stab}"/>`;
  return softEllipse(ctx, x, y + 8 * (o.s ?? 1), 90 * (o.s ?? 1), 5 * (o.s ?? 1), 'shadow', 0.35)
    + `<g transform="${jetT(x, y, o)}">${depth(ctx, o.z ?? 2, art, outline)}</g>`;
}

/**
 * A jet's lights over its drawing: asleep (`on` false), only the wing-tip light glows faintly (red
 * to port, green to starboard: the side the viewer sees); awake, the cabin windows glow warm, the
 * red beacon flashes on its back and belly, the wing tip and the tail's white light shine.
 */
function jetLights(ctx: KitCtx, x: number, y: number, o: JetOpts, on: boolean): string {
  const s = o.s ?? 1, dir = o.dir ?? 1;
  const P = ([ux, uy]: Pt): Pt => [x + ux * s * dir, y + uy * s];
  const tipColour = dir === 1 ? A.wingRed : A.wingGreen;
  const [tx, ty] = P([-58, 27]);
  const dot = ([px, py]: Pt, r: number, colour: string, bloom: number) => softEllipse(ctx, px, py, r * 4, r * 4, 'lamp', bloom) + `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(r)}" fill="${colour}"/>`;
  if (!on) return dot([tx, ty], 1.4 * s, tipColour, 0.12);
  let win = '';
  for (const p of jetWindows(o.cargo)) {
    const [wx, wy] = P(p);
    win += `M${f1(wx - 1.4 * s)} ${f1(wy - 2 * s)}h${f1(2.8 * s)}v${f1(4 * s)}h${f1(-2.8 * s)}z`;
  }
  const [b1x, b1y] = P([0, -30]);
  const [b2x, b2y] = P([0, 2]);
  const [lx, ly] = P([-112, -18]);
  const [cx, cy] = P([92, -19]);
  return `<path d="${win}" fill="${C.lamp}" opacity=".5"${blur(ctx)}/><path d="${win}" fill="${C.lamp}"/>`
    + dot([cx, cy], 2 * s, C.lampHot, 0.35)
    + dot([tx, ty], 2.2 * s, tipColour, 0.4) + dot([b1x, b1y], 2 * s, A.wingRed, 0.35) + dot([b2x, b2y], 1.8 * s, A.wingRed, 0.3) + dot([lx, ly], 1.6 * s, C.lampHot, 0.3);
}

// ——— Glass, tarmac and terrazzo ———

/**
 * Glassine terminal glass (bible § 3.1: "the airport glass"): a tinted pane `w` × `h` with mullions
 * every `bay`, two diagonal sheen streaks and a thin white frame. Draw what shows through first.
 */
function glassOver(x: number, y: number, w: number, h: number, { bay = 48, opacity = 0.3, frame = A.steelDeep as string } = {}): string {
  let mull = '';
  for (let xx = x + bay; xx < x + w - 2; xx += bay) mull += `M${f1(xx)} ${y}v${h}`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${A.glass}" opacity="${opacity}"/>`
    + `<path d="M${f1(x + w * 0.1)} ${y + h}L${f1(x + w * 0.42)} ${y}H${f1(x + w * 0.5)}L${f1(x + w * 0.18)} ${y + h}Z" fill="${C.glassine}" opacity=".08"/>`
    + `<path d="M${f1(x + w * 0.56)} ${y + h}L${f1(x + w * 0.8)} ${y}H${f1(x + w * 0.83)}L${f1(x + w * 0.6)} ${y + h}Z" fill="${C.glassine}" opacity=".06"/>`
    + `<path d="${mull}" stroke="${frame}" stroke-width="3"/><path d="${mull}" stroke="${C.cutRim}" stroke-width=".7" opacity=".3" transform="translate(-1 0)"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${frame}" stroke-width="4"/>`;
}

/**
 * The apron's tarmac on the floor page: night asphalt, painted lines receding to the vanishing
 * point (white, and the taxi line in chalky ochre: decorative yellow is never marigold), joints, a
 * row of blue edge lights at the back, the wet sheen of the lights.
 */
function apronFloor(ctx: KitCtx, { seed = 3, lines = [100, 290] as readonly number[] } = {}): string {
  const { x, y, w, h } = FLOOR_RECT;
  const [vx, vy] = VANISHING_POINT;
  // A painted line from the floor page's front edge toward the vanishing point, cut at the gutter
  const ray = (bx: number) => `M${f1(bx)} ${FLOOR_BOTTOM}L${f1(bx + (vx - bx) * ((y - FLOOR_BOTTOM) / (vy - FLOOR_BOTTOM)))} ${y}`;
  const r = seeded(seed);
  let joints = '';
  for (let yy = y + 40; yy < y + h; yy += 46 + r() * 10) joints += `M${x} ${f1(yy)}H${x + w}`;
  let sheen = '';
  for (let i = 0; i < 7; i++) sheen += `<ellipse cx="${f1(x + 40 + r() * (w - 80))}" cy="${f1(y + 50 + r() * (h - 80))}" rx="${f1(16 + r() * 26)}" ry="${f1(2 + r() * 2)}" fill="${i % 2 ? A.taxiBlue : A.taxiAmber}" opacity=".1"/>`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'tarmacG')}"/>`
    + `<path d="${joints}" stroke="${A.tarmacDeep}" stroke-width="1" opacity=".6"/>`
    + `<path d="${lines.map(ray).join('')}" stroke="${C.ochre}" stroke-width="4" opacity=".55"/>`
    + `<path d="M${x} ${y + 14}H${x + w}" stroke="${A.paint}" stroke-width="2" opacity=".25" stroke-dasharray="14 10"/>`
    + sheen
    + lightLine(ctx, [x + 10, y + 8], [x + w - 10, y + 8], 11, A.taxiBlue, 1.6, 1.6)
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}" opacity=".35"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="20" fill="${C.shadow}" opacity=".22"/>`;
}

/** The terminal's polished terrazzo on the floor page: pale flecked stone, slab joints receding, the ceiling lights' reflections. */
function terrazzoFloor(ctx: KitCtx, { seed = 5, tone = A.terrazzo as string } = {}): string {
  const { x, y, w, h } = FLOOR_RECT;
  const [vx, vy] = VANISHING_POINT;
  const r = seeded(seed);
  let joints = '';
  for (let bx = -200; bx <= PAGE_W + 200; bx += 48) joints += `M${f1(bx)} ${FLOOR_BOTTOM}L${f1(bx + (vx - bx) * ((y - FLOOR_BOTTOM) / (vy - FLOOR_BOTTOM)))} ${y}`;
  for (let yy = y + 26, step = 26; yy < y + h; step *= 1.18, yy += step) joints += `M${x} ${f1(yy)}H${x + w}`;
  let flecks = '';
  for (let i = 0; i < 110; i++) flecks += `M${f1(x + r() * w)} ${f1(y + r() * h)}h1.2`;
  let glints = '';
  for (let i = 0; i < 6; i++) glints += `<ellipse cx="${f1(30 + i * 66 + r() * 20)}" cy="${f1(y + 70 + r() * 150)}" rx="${f1(10 + r() * 8)}" ry="${f1(22 + r() * 20)}" fill="${C.lamp}" opacity=".07"/>`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mixHex(mixHex(tone, A.terrazzoDeep, 0.35), A.runwayDeep, 0.3)}"/>`
    + `<path d="${flecks}" stroke="${A.terrazzoDeep}" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>`
    + `<path d="${joints}" stroke="${A.terrazzoDeep}" stroke-width=".8" opacity=".55"/>` + glints
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}" opacity=".45"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="20" fill="${C.shadow}" opacity=".22"/>`;
}

/** A lit sign board: a navy board with white lettering (and an English line), its light spilling round it. */
function hallSign(ctx: KitCtx, x: number, y: number, w: number, h: number, zh: string, en = '', { glyph = '' } = {}): string {
  const sz = Math.min(h * (en ? 0.5 : 0.62), (w - (glyph ? 30 : 12)) / (zh.length * 1.05));
  const cx = x + w / 2 + (glyph ? 10 : 0);
  return `<rect x="${f1(x - 6)}" y="${f1(y - 6)}" width="${f1(w + 12)}" height="${f1(h + 12)}" rx="6" fill="${C.lamp}" opacity=".1"${blur(ctx, 'blur8')}/>`
    + depth(ctx, 2, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${T.navy}"/><path d="M${x + 1} ${y + 0.8}h${w - 2}" stroke="${C.cutRim}" stroke-width=".8" opacity=".4"/>`, `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`)
    + (glyph ? planeGlyph(x + 14, y + h / 2, h * 0.034, C.chalk) : '')
    + `<text data-art-text="" x="${f1(cx)}" y="${f1(y + (en ? h * 0.52 : h * 0.68))}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${f1(sz)}" fill="${C.chalk}" letter-spacing="${f1(sz * 0.08)}">${zh}</text>`
    + (en ? `<text data-art-text="" x="${f1(cx)}" y="${f1(y + h * 0.86)}" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="${f1(Math.min(h * 0.24, (w - (glyph ? 30 : 10)) / (en.length * 0.56)))}" fill="${C.chalk}" opacity=".8">${en}</text>` : '');
}

/**
 * Downlights washing a night wall (the terminal is lit low at 02:50): a warm scallop of light
 * spreading down the wall from each fitting at `xs` on the ceiling line `top`, `h` long.
 */
function wallWash(ctx: KitCtx, xs: readonly number[], top: number, h: number): string {
  return xs.map((x) => `<path d="M${x - 6} ${top}L${x - 34} ${top + h}Q${x} ${top + h + 14} ${x + 34} ${top + h}L${x + 6} ${top}Z" fill="${C.lamp}" opacity=".09"${blur(ctx, 'blur8')}/>`
    + `<rect x="${x - 8}" y="${top - 3}" width="16" height="4" rx="2" fill="${C.lampHot}"/>` + softEllipse(ctx, x, top + 2, 12, 5, 'lamp', 0.4)).join('');
}

/** The airport pictogram (a plane seen from above), centred at (x, y), `s` × a 30-unit plane. */
function planeGlyph(x: number, y: number, s: number, fill: string): string {
  return `<path transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s)}) rotate(-45)" d="M0 -15q2 0 2 4v6l12 7v3l-12 -3v7l4 3v2l-6 -2l-6 2v-2l4 -3v-7l-12 3v-3l12 -7v-6q0 -4 2 -4z" fill="${fill}"/>`;
}

// ——— 6-1 「文湖線前窗」 ———

/**
 * 6-1: the front car of a driverless 文湖線 train in cut-away (bible § 6, the 月亮線 car row: the
 * line's brown band). The front window itself is the `c6/front-window` part (page (14, 226)–(206,
 * 356)); round it the car's front bulkhead and the dashboard shelf under it (Mocha's `dash`, its top
 * at (70, 372)). Over it the route strip, 松山機場 next. The strap rail with Mocha's strap (its
 * handle's top at (226, 250)); the doors (x 252–306) where the cabin-crew 姊姊 dozes; past them,
 * 松山機場 station's platform: its screen doors, the station's sign, the warm platform lights.
 */
const frontCar: BackdropDraw = (ctx) => {
  const wall = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y + 40}" fill="${ref(ctx, 'carWallG')}"/>`
    + paperFibres(-20, 0, 330, GUTTER_Y, 40, A.carWallShade, 61, 0.35);
  // The ceiling with its lit strip
  const ceiling = `<path d="M-20 0H306V58Q140 70 -20 58Z" fill="${mixHex(A.carWallShade, C.shadow, 0.15)}"/>`
    + `<rect x="20" y="30" width="270" height="7" rx="3.5" fill="${C.lampHot}"/>` + softEllipse(ctx, 155, 36, 140, 10, 'lamp', 0.35, 'blur8');
  // The route strip: 文湖線's brown, 松山機場 next (lit)
  const stops = [26, 66, 106, 146, 186];
  const names = ['劍南路', '大直', '松山機場', '中山國中', '南京復興'];
  const route = depth(ctx, 2, `<rect x="10" y="74" width="196" height="30" rx="4" fill="${T.navyDeep}"/>`, `<rect x="10" y="74" width="196" height="30" rx="4"/>`)
    + `<path d="M20 95H196" stroke="${A.wenhu}" stroke-width="4" stroke-linecap="round"/>`
    + stops.map((x, i) => `<circle cx="${x}" cy="95" r="${i === 2 ? 4.6 : 3}" fill="${i === 2 ? C.lampAmber : i < 2 ? A.steelDeep : C.cutRim}" stroke="${A.wenhu}" stroke-width="1.6"/>`).join('')
    + softEllipse(ctx, 106, 95, 9, 7, 'lamp', 0.4)
    + stops.map((x, i) => `<text data-art-text="" x="${x}" y="87" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="${i === 2 ? 900 : 700}" font-size="${i === 2 ? 8 : 5.5}" fill="${i === 2 ? C.lampAmber : C.chalk}"${i === 2 ? '' : ' opacity=".6"'}>${names[i]}</text>`).join('')
    + planeGlyph(122, 82, 0.24, C.lampAmber);
  // The front bulkhead round the window: a dark rounded frame, the dashboard shelf under it
  const bulk = 'M-20 196H200Q218 196 218 214V384H-20Z';
  const bulkhead = depth(ctx, 3, `<path d="${bulk}" fill="${mixHex(A.carWallShade, A.steelDeep, 0.5)}"/>`
    + `<path d="M-20 199H198Q214 199 215 214" stroke="${C.cutRim}" stroke-width="1" opacity=".35" fill="none"/>`
    + `<rect x="-20" y="376" width="238" height="8" fill="${A.wenhu}"/>`, `<path d="${bulk}"/>`);
  const dash = depth(ctx, 3, `<path d="M4 362H214L210 376H8Z" fill="${A.steelDeep}"/><path d="M4 362.6H214" stroke="${A.steelLight}" stroke-width="1.2"/>`
    + `<rect x="150" y="364" width="40" height="8" rx="2" fill="${C.printDark}"/><circle cx="160" cy="368" r="1.6" fill="${A.wingGreen}"/><circle cx="168" cy="368" r="1.6" fill="${A.taxiBlue}"/>`, `<path d="M4 362H214L210 376H8Z"/>`);
  // The strap rail and Mocha's strap (handle top at (226, 250)); a second strap
  const strap = (x: number, top: number) => `<path d="M${x} 116V${top - 2}" stroke="${A.wenhuDeep}" stroke-width="4"/>`
    + `<circle cx="${x}" cy="${top + 9}" r="9" fill="none" stroke="${A.steelLight}" stroke-width="3.6"/><circle cx="${x}" cy="${top + 9}" r="9" fill="none" stroke="${A.steel}" stroke-width="2"/>`;
  const rail = depth(ctx, 3, `<rect x="200" y="112" width="110" height="5" rx="2.5" fill="${ref(ctx, 'steelG')}"/><path d="M240 60V112M296 60V112" stroke="${A.steelDeep}" stroke-width="2.4"/>`
    + strap(226, 250) + `<path d="M280 116V150" stroke="${A.wenhuDeep}" stroke-width="4"/><path d="M273 150H287L280 162Z" fill="none" stroke="${A.wenhuDeep}" stroke-width="3" stroke-linejoin="round"/>`,
  `<rect x="200" y="112" width="110" height="5"/>`);
  const band = `<rect x="200" y="236" width="110" height="10" fill="${A.wenhu}"/><rect x="200" y="247" width="110" height="2" fill="${A.wenhuDeep}"/>`;
  // The side window behind the straps: the 文湖線 runs high over the city — its night lights from above
  const sideId = ctx.id('sideWin');
  const city = skyline(206, 304, 196, 67, { minH: 14, maxH: 44, winP: 0.4, winOpacity: 0.9 });
  const sideWin = `<clipPath id="${sideId}"><rect x="210" y="128" width="88" height="96" rx="10"/></clipPath><g clip-path="url(#${sideId})">`
    + windowView(`<rect x="206" y="124" width="96" height="104" fill="${ref(ctx, 'sky')}"/>` + pinholes(ctx, 210, 128, 88, 30, 6, 68)
      + `<path d="${city.d}" fill="${mixHex(A.runwayDeep, C.shadow, 0.3)}"/>` + city.windows
      + `<rect x="206" y="196" width="96" height="30" fill="${mixHex(A.tarmacDeep, C.shadow, 0.3)}"/>`
      + `<path d="M206 208h96" stroke="${C.lampAmber}" stroke-width="2" stroke-dasharray="10 5" opacity=".7"/><path d="M206 216h96" stroke="${A.wingRed}" stroke-width="1.6" stroke-dasharray="6 8" opacity=".6"/>`, 206, 124, 96, 104)
    + `<path d="M216 228L262 128H270L224 228Z" fill="${C.glassine}" opacity=".07"/></g>`
    + `<rect x="207" y="125" width="94" height="102" rx="12" fill="none" stroke="${A.steelDeep}" stroke-width="5"/>`;
  // The doors, slid open on the platform's light
  const doors = depth(ctx, 3, `<rect x="248" y="226" width="62" height="250" fill="${A.steelDeep}"/>`
    + `<rect x="252" y="262" width="8" height="214" fill="${A.steel}"/><rect x="298" y="262" width="8" height="214" fill="${A.steel}"/>`
    + `<rect x="260" y="262" width="38" height="214" fill="${mixHex(A.whiteShade, C.lamp, 0.35)}"/>`
    + `<rect x="260" y="430" width="38" height="46" fill="${mixHex(A.terrazzo, A.terrazzoDeep, 0.3)}"/><rect x="272" y="262" width="10" height="168" fill="${mixHex(A.whiteShade, A.whiteDeep, 0.4)}"/>`
    + `<path d="M260 300h38M260 300v130M298 300v130" stroke="${A.steelDeep}" stroke-width="1.4" opacity=".6"/>`
    + `<rect x="250" y="252" width="58" height="10" fill="${T.navyDeep}"/><text data-art-text="" x="279" y="259.6" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6" fill="${C.lampAmber}">松山機場 到了</text>`,
  `<rect x="248" y="226" width="62" height="250"/>`) + softEllipse(ctx, 279, 380, 30, 90, 'lamp', 0.14, 'blur18');
  // 松山機場 station's platform beyond: screen doors, the station's sign, lights
  const station = `<rect x="306" y="0" width="110" height="${GUTTER_Y + 40}" fill="${mixHex(A.whiteShade, A.runwayDeep, 0.25)}"/>`
    + `<rect x="306" y="0" width="110" height="60" fill="${mixHex(A.whiteDeep, A.runwayDeep, 0.4)}"/>`
    + lightLine(ctx, [318, 46], [394, 46], 5, C.lampHot, 2, 2)
    + hallSign(ctx, 316, 120, 74, 40, '松山機場', 'Songshan Airport', { glyph: 'plane' })
    + `<path d="M310 200H404M310 330H404" stroke="${A.steelDeep}" stroke-width="4"/>`
    + glassOver(310, 200, 94, 130, { bay: 32, opacity: 0.22 })
    + `<rect x="306" y="226" width="6" height="250" fill="${A.wenhuDeep}"/>`;
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${A.tarmacDeep}"/>`
    + `<rect x="-40" y="${GUTTER_Y}" width="352" height="120" fill="${mixHex(T.floorLino, A.carWallShade, 0.3)}"/>`
    + `<path d="${Array.from({ length: 11 }, (_, i) => `M${-20 + i * 34} ${GUTTER_Y}l${f1((-20 + i * 34 - 195) * 0.08)} 120`).join('')}" stroke="${T.floorLinoDeep}" stroke-width=".8" opacity=".6"/>`
    + `<rect x="312" y="${GUTTER_Y}" width="120" height="120" fill="${mixHex(A.terrazzo, A.terrazzoDeep, 0.3)}"/>`
    + `<rect x="-40" y="${GUTTER_Y}" width="${PAGE_W + 80}" height="24" fill="${C.shadow}" opacity=".22"/>`
    + `<path d="M-40 580H430M-40 628H430" stroke="${A.steelDeep}" stroke-width="5"/><path d="M-40 578.5H430M-40 626.5H430" stroke="${A.steel}" stroke-width="1.4"/>`
    + lightLine(ctx, [-20, 604], [410, 604], 9, A.taxiBlue, 1.4, 1.4) + pools(ctx, [[350, 470, 70, 18], [150, GUTTER_Y + 40, 140, 26]]));
  return airportDefs(ctx) + standingPage(ctx, wall + station + ceiling + route + sideWin + band + rail + doors + bulkhead + dash)
    + floor + bookCues(ctx) + block();
};

// ——— 6-2 「行李轉盤」 ———

/**
 * 6-2: the baggage hall at night, switched off. The back wall's white panels under a lit band
 * 「行李提領 Baggage Claim」, the ceiling's lights receding, the carousel's number board 「3」 with its
 * arrivals; tall windows on the night apron, a plane's tail outside. The carousel's island in the
 * middle of the loop (Mocha's `island`, its top at (214, 420)) with the beacon's post (the beacon is
 * a part, at (214, 328)); the belt itself is the `c6/carousel-belt` part. Right, the baggage chute's
 * steel housing: its rubber curtain hanging over the opening, the start button behind it (a part,
 * its hit (316, 380)–(372, 436)), and on its roof the lost-and-found cage (the 土地公's luggage tag at
 * (330, 330)). A trolley parked on the left.
 */
const baggageHall: BackdropDraw = (ctx) => {
  const wall = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'hallG')}"/>`
    + `<path d="${Array.from({ length: 9 }, (_, i) => `M${-6 + i * 50} 70V${GUTTER_Y}`).join('')}" stroke="${A.whiteDeep}" stroke-width="1" opacity=".4"/>`;
  // Windows high on the wall: the night apron, a sleeping plane's tail and a far runway
  const winId = ctx.id('hallWin');
  const view = `<clipPath id="${winId}"><rect x="10" y="80" width="190" height="88"/></clipPath><g clip-path="url(#${winId})">`
    + `<rect x="10" y="80" width="190" height="88" fill="${ref(ctx, 'sky')}"/>` + pinholes(ctx, 10, 80, 190, 40, 10, 62)
    + `<rect x="10" y="140" width="190" height="30" fill="${A.tarmacDeep}"/>`
    + lightLine(ctx, [10, 146], [200, 144], 12, C.lampHot, 1.2, 1.2) + taxiway(ctx, [14, 162], [100, 150], [200, 154], 9, 1.2, 1)
    + jet(ctx, 120, 150, { dir: 1, s: 0.42, z: 1 }) + jetLights(ctx, 120, 150, { dir: 1, s: 0.42 }, false)
    + `</g>` + glassOver(10, 80, 190, 88, { bay: 38, opacity: 0.25 });
  const band = depth(ctx, 2, `<rect x="-20" y="20" width="${PAGE_W + 40}" height="38" fill="${T.navyDeep}"/>`, `<rect x="-20" y="20" width="${PAGE_W + 40}" height="38"/>`)
    + `<rect x="-20" y="16" width="${PAGE_W + 40}" height="48" fill="${A.taxiBlue}" opacity=".06"${blur(ctx, 'blur8')}/>`
    + planeGlyph(60, 39, 0.5, C.chalk)
    + `<text data-art-text="" x="200" y="44" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="17" fill="${C.chalk}" letter-spacing="3">行李提領</text>`
    + `<text data-art-text="" x="312" y="43" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="11" fill="${C.chalk}" opacity=".8">Baggage Claim</text>`
    + lightLine(ctx, [-10, 4], [400, 4], 9, C.lampHot, 1.8, 1.8);
  // The carousel's number board: 「3」 and its arrivals (dark at night: only the number lit)
  const board = depth(ctx, 2, `<rect x="232" y="86" width="140" height="80" rx="4" fill="${C.printDark}"/>`, `<rect x="232" y="86" width="140" height="80"/>`)
    + `<rect x="238" y="92" width="34" height="68" rx="2" fill="${A.runwayDeep}"/>`
    + `<text data-art-text="" x="255" y="140" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="44" fill="${A.taxiAmber}">3</text>`
    + ['金門', '馬祖', '花蓮', '澎湖'].map((c, i) => `<text data-art-text="" x="282" y="${106 + i * 15}" font-family="'Noto Serif TC'" font-weight="700" font-size="9" fill="${C.chalk}" opacity=".7">${c}</text>`
      + `<text data-art-text="" x="362" y="${106 + i * 15}" text-anchor="end" font-family="Fredoka" font-weight="600" font-size="8.4" fill="${A.wingGreen}" opacity=".7">已到</text>`).join('');
  // The island in the loop's middle (Mocha's island: its top at y 420) and the beacon's post
  const island = depth(ctx, 3, `<path d="M176 420H252L258 448H170Z" fill="${ref(ctx, 'steelG')}"/><path d="M176 420.6H252" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`
    + `<rect x="211" y="340" width="6" height="80" fill="${A.steelDeep}"/><rect x="200" y="414" width="28" height="6" rx="2" fill="${A.steelDeep}"/>`, `<path d="M176 420H252L258 448H170Z"/><rect x="211" y="340" width="6" height="80"/>`);
  // The chute's housing: steel, a dark opening, the rubber curtain parted over the button
  const chute = depth(ctx, 3, `<path d="M300 346H392V476H300Z" fill="${ref(ctx, 'steelV')}"/><path d="M300 347H392" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`
    + `<rect x="312" y="368" width="64" height="80" fill="${mixHex(A.rubber, C.shadow, 0.4)}"/>`
    + `<path d="${Array.from({ length: 8 }, (_, i) => `M${314 + i * 8} 368h7v${i === 3 || i === 4 ? 10 : 22 + (i % 2) * 4}h-7z`).join('')}" fill="${A.rubber}"/>`
    + `<path d="${Array.from({ length: 8 }, (_, i) => `M${314.6 + i * 8} 369v${i === 3 || i === 4 ? 8 : 20}`).join('')}" stroke="${A.rubberLight}" stroke-width=".8"/>`
    + `<path d="M300 456H392" stroke="${A.steelDeep}" stroke-width="3"/>`, `<path d="M300 346H392V476H300Z"/>`);
  // The lost-and-found cage on the chute's roof: wire mesh, two forgotten suitcases (the 土地公's tag on one)
  const cage = depth(ctx, 2, `<rect x="300" y="300" width="92" height="46" fill="${mixHex(A.whiteDeep, C.shadow, 0.3)}"/>`
    + `<rect x="308" y="316" width="30" height="26" rx="3" fill="${A.tail}"/><rect x="342" y="310" width="38" height="32" rx="3" fill="${A.scarf}"/>`
    + `<path d="M318 316v-4h10v4M354 310v-4h14v4" stroke="${C.printDark}" stroke-width="1.6" fill="none"/>`, `<rect x="300" y="300" width="92" height="46"/>`)
    + `<path d="${Array.from({ length: 12 }, (_, i) => `M${302 + i * 8} 300v46`).join('')}M300 312H392M300 324H392M300 336H392" stroke="${A.steelLight}" stroke-width=".7" opacity=".7"/>`
    + `<rect x="298" y="296" width="96" height="5" rx="2" fill="${A.steelDeep}"/>`
    + `<text data-art-text="" x="346" y="292" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${C.chalk}" opacity=".8">失物招領</text>`;
  // A trolley parked by the wall
  const trolley = depth(ctx, 3, `<path d="M14 352H58L54 418H18Z" fill="none" stroke="${A.steelLight}" stroke-width="2.6"/><path d="M18 418H62" stroke="${A.steelLight}" stroke-width="3"/>`
    + `<path d="M58 352L66 334" stroke="${A.steelLight}" stroke-width="2.6"/><circle cx="22" cy="424" r="4" fill="${C.printDark}"/><circle cx="56" cy="424" r="4" fill="${C.printDark}"/>`
    + `<rect x="20" y="372" width="30" height="40" rx="3" fill="${A.whiteDeep}"/>`, `<path d="M14 334H66V428H14Z"/>`);
  // The baggage-service desk under the windows, and the 店員小哥 behind it (the chain runs this hall too: § 5.3)
  const service = clerk(ctx, 150, 318)
    + depth(ctx, 3, `<rect x="104" y="318" width="92" height="40" rx="2" fill="${ref(ctx, 'whiteG')}"/><rect x="104" y="318" width="92" height="7" fill="${T.navyDeep}"/>`
      + `<path d="M104 318.6H196" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`, `<rect x="104" y="318" width="92" height="40"/>`)
    + `<text data-art-text="" x="150" y="324" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="5.4" fill="${C.chalk}">行李服務</text>`;
  const floor = floorPage(ctx, terrazzoFloor(ctx, { seed: 21 }) + pools(ctx, [[214, GUTTER_Y + 40, 140, 26], [344, 470, 60, 16]]));
  return airportDefs(ctx) + standingPage(ctx, wall + wallWash(ctx, [40, 112, 214, 296, 370], 64, 150) + view + band + board + service
    + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'blueWash')}"/>`)
    + floor + trolley + island + cage + chute + bookCues(ctx) + block();
};

// ——— 6-3 「看飛機」 ———

/** 6-3's sleeping A321, where its lights part draws over it. */
const DECK_JET = { x: 252, y: 296, o: { dir: -1, s: 1.08, z: 2 } as JetOpts };

/**
 * 6-3, the chapter's beauty: the observation deck on the terminal's roof at night. Over the glass
 * windbreak the whole airfield sleeps — the runway's edge lights converging on the dark, white then
 * amber, green across its threshold; the taxiways' blue curves and green centre lines; amber guide
 * boards; a far plane asleep by the terminal's lit wing, the control tower, 圓山大飯店's lit roof on
 * its hill, Taipei's lights along the horizon, the moon. In front a sleeping A321 (its lights are the
 * `c6/plane-lights` part; the 土地公 stands on its fin at (330, 228)). The windbreak's top rail at
 * y 372 (Mocha's `rail`, (176, 372)); the bench by the stairs (Mocha's `bench`, its seat at (64, 410));
 * the stair house's lit door; a coin telescope by the gate.
 */
const observationDeck: BackdropDraw = (ctx) => {
  const sky = airportSky(ctx, 214, { moon: [58, 50, 13], seed: 31 });
  const hill = grandHotel(ctx, 76, 214, 0.9);
  // The airfield: grass between, runway converging to the left, taxiways, the far terminal wing
  const field = `<rect x="-20" y="210" width="${PAGE_W + 40}" height="${GUTTER_Y - 210 + 40}" fill="${mixHex(A.runwayDeep, C.shadow, 0.2)}"/>`
    + `<path d="M-20 214H410V226H-20Z" fill="${mixHex(A.runway, C.shadow, 0.3)}"/>`
    + runway(ctx, [-30, 320], [120, 328], [150, 218], [196, 219], { n: 16 })
    + taxiway(ctx, [130, 340], [260, 270], [400, 248], 14)
    + taxiway(ctx, [-20, 272], [60, 246], [150, 232], 10, 1.4, 0.7)
    + lightLine(ctx, [196, 226], [400, 224], 18, A.taxiBlue, 1, 1)
    + guideBoard(ctx, 20, 296, 1, 'B3') + guideBoard(ctx, 212, 236, 0.7, 'A') + guideBoard(ctx, 300, 236, 0.7, 'C2');
  // The far terminal wing (lit glass) and the control tower, a far plane asleep at its gate
  const terminal = depth(ctx, 1, `<rect x="240" y="196" width="170" height="30" fill="${mixHex(A.whiteDeep, A.runwayDeep, 0.45)}"/>`, `<rect x="240" y="196" width="170" height="30"/>`)
    + `<rect x="246" y="204" width="164" height="12" fill="${ref(ctx, 'window')}" opacity=".55"/>`
    + `<path d="${Array.from({ length: 14 }, (_, i) => `M${252 + i * 12} 204v12`).join('')}" stroke="${A.whiteDeep}" stroke-width="1.6"/>`
    + farTower(ctx, 372, 214, 0.72)
    + jet(ctx, 214, 238, { dir: 1, s: 0.34, z: 1 }) + jetLights(ctx, 214, 238, { dir: 1, s: 0.34 }, false);
  // The stand it sleeps on: a paler pad of apron under a floodlight, its lead-in line
  const stand = `<path d="M110 336L170 280H404V336Z" fill="${mixHex(A.tarmac, A.runwayDeep, 0.2)}"/>` + pools(ctx, [[270, 312, 130, 18]])
    + `<path d="M150 318L250 300L404 300" stroke="${C.ochre}" stroke-width="1.6" fill="none" opacity=".5"/>`
    + `<path d="M396 236V300" stroke="${A.steelDeep}" stroke-width="2"/><path d="M386 232h20l-4 6h-12z" fill="${A.steelDeep}"/>` + softEllipse(ctx, 396, 238, 10, 5, 'lamp', 0.35);
  const plane = stand + jet(ctx, DECK_JET.x, DECK_JET.y, DECK_JET.o) + jetLights(ctx, DECK_JET.x, DECK_JET.y, DECK_JET.o, false);
  // The windbreak: glass panels on steel posts, the top rail (Mocha's rail at y 372)
  const posts = [0, 70, 140, 210, 280, 350].map((x) => `M${x} 372V430`).join('');
  const glassId = ctx.id('windbreak');
  const windbreak = `<clipPath id="${glassId}"><rect x="-20" y="372" width="${PAGE_W + 40}" height="58"/></clipPath>`
    + `<g clip-path="url(#${glassId})"><rect x="-20" y="372" width="${PAGE_W + 40}" height="58" fill="${A.glass}" opacity=".22"/>`
    + `<path d="M20 430L60 372H72L32 430ZM190 430L230 372H236L196 430Z" fill="${C.glassine}" opacity=".1"/></g>`
    + depth(ctx, 3, `<path d="${posts}" stroke="${A.steelDeep}" stroke-width="4"/><rect x="-20" y="368" width="${PAGE_W + 40}" height="6" rx="3" fill="${ref(ctx, 'steelG')}"/>`
      + `<path d="M-20 368.8H410" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<rect x="-20" y="368" width="${PAGE_W + 40}" height="62"/>`);
  // The stair house's door (lit), its sign, and the bench by it (seat at y 410)
  const stairs = depth(ctx, 3, `<rect x="-20" y="296" width="44" height="134" fill="${mixHex(A.whiteShade, A.whiteDeep, 0.5)}"/><rect x="-6" y="330" width="22" height="100" fill="${mixHex(A.whiteShade, C.lamp, 0.45)}"/><path d="M5 330v100" stroke="${A.whiteDeep}" stroke-width="1.4"/><rect x="-6" y="330" width="22" height="100" fill="none" stroke="${A.steelDeep}" stroke-width="2"/>`
    + `<path d="M-20 296H24" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="-20" y="296" width="44" height="134"/>`)
    + softEllipse(ctx, 6, 424, 30, 8, 'lamp', 0.2, 'blur8')
    + `<rect x="-14" y="306" width="34" height="14" rx="2" fill="${T.navyDeep}"/><text data-art-text="" x="3" y="316.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7.4" fill="${C.chalk}">觀景台</text>`;
  const bench = depth(ctx, 3, `<rect x="30" y="410" width="72" height="7" rx="2" fill="${A.deckLight}"/><rect x="30" y="398" width="72" height="5" rx="2" fill="${A.deck}"/>`
    + `<path d="M36 417V452M96 417V452M36 403V410M96 403V410" stroke="${A.steelDeep}" stroke-width="3"/>`, `<rect x="30" y="398" width="72" height="54"/>`);
  // A coin telescope on the deck by the gate's far side
  const scope = depth(ctx, 3, `<path d="M330 450V412" stroke="${A.steelDeep}" stroke-width="4"/><rect x="316" y="396" width="32" height="18" rx="7" fill="${A.tail}"/><rect x="342" y="400" width="10" height="10" rx="3" fill="${A.tailDeep}"/>`
    + `<path d="M320 450H340" stroke="${A.steelDeep}" stroke-width="4"/>`, `<rect x="316" y="396" width="36" height="56"/>`);
  const floor = floorPage(ctx, (() => {
    const { x, y, w, h } = FLOOR_RECT;
    const [vx, vy] = VANISHING_POINT;
    let boards = '';
    for (let yy = y + 10, step = 9; yy < y + h; step *= 1.12, yy += step) boards += `M${x} ${f1(yy)}H${x + w}`;
    let seams = '';
    for (let bx = -160; bx <= PAGE_W + 160; bx += 70) seams += `M${f1(bx)} ${FLOOR_BOTTOM}L${f1(bx + (vx - bx) * ((y - FLOOR_BOTTOM) / (vy - FLOOR_BOTTOM)))} ${y}`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${A.deck}"/><path d="${boards}" stroke="${A.deckDeep}" stroke-width="1.2" opacity=".7"/>`
      + `<path d="${seams}" stroke="${A.deckDeep}" stroke-width=".8" opacity=".5"/>`
      + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}" opacity=".4"/>`
      + `<rect x="${x}" y="${y}" width="${w}" height="74" fill="${C.shadow}" opacity=".18"/>`
      + lightLine(ctx, [x + 14, 446], [x + w - 14, 446], 12, A.taxiBlue, 1.2, 1.2)
      // Painted on the deck: the runway's two numbers (松山's runway 10/28) with an arrow between
      + `<g opacity=".1" fill="${A.paint}" font-family="Fredoka" font-weight="700"><text data-art-text="" x="110" y="600" font-size="34" text-anchor="middle">10</text><text data-art-text="" x="290" y="600" font-size="34" text-anchor="middle">28</text></g>`
      + `<path d="M150 588H250M240 580l10 8l-10 8M160 580l-10 8l10 8" stroke="${A.paint}" stroke-width="3" fill="none" opacity=".1"/>`;
  })() + pools(ctx, [[10, 450, 70, 20], [230, GUTTER_Y + 40, 180, 20, 'blue']]));
  return airportDefs(ctx) + standingPage(ctx, sky + hill + field + terminal + plane)
    + floor + windbreak + stairs + bench + scope + bookCues(ctx) + block();
};

// ——— 6-4 「空橋」 ———

/**
 * 6-4: the jet bridge. Left, the gate lounge in the terminal (its roof edge Mocha's `roof`, (60,
 * 300)): glass over warm light, rows of seats, the gate's sign 「登機門 3」. The bridge's fixed tunnel
 * runs out from it (x 118–200; its roof Mocha's `bridgeTop`, (170, 384)); its telescoping section and
 * the cab are drawn by their parts. Right, the sleeping A321's white flank fills the page's edge:
 * its open door (the bead's, its sill at y 440) glowing warm, the cockpit's windows high up. Upstage,
 * the 貨機 (the wrong plane, its door where the cab swings at (282, 372); the 土地公 in a window at
 * (250, 330)). The night sky over the far runway; the apron below, its lead-in line and stand number.
 */
const jetBridge: BackdropDraw = (ctx) => {
  const sky = airportSky(ctx, 286, { moon: [214, 46, 12], seed: 41 });
  const far = `<rect x="-20" y="284" width="${PAGE_W + 40}" height="80" fill="${mixHex(A.runwayDeep, C.shadow, 0.2)}"/>`
    + lightLine(ctx, [-20, 296], [410, 292], 22, C.lampHot, 1.2, 1) + lightLine(ctx, [-20, 306], [410, 302], 20, A.taxiBlue, 1, 1)
    + farTower(ctx, 132, 290, 0.8);
  // The 貨機 upstage (its door at (282, 372)): grey, a short row of windows at the front
  const cargo = jet(ctx, 200, 374, { dir: -1, s: 1.25, cargo: true, z: 2 }) + jetLights(ctx, 200, 374, { dir: -1, s: 1.25, cargo: true }, false)
    // Its upper-deck hump, a porthole in it (where the 土地公 looks out), its cargo door
    + depth(ctx, 2, `<path d="M206 341Q222 318 248 318H300L314 341Z" fill="${A.cargo}"/><path d="M212 334Q226 322 248 322H298" stroke="${C.cutRim}" stroke-width=".8" fill="none" opacity=".4"/>`
      + `<rect x="240" y="322" width="20" height="16" rx="7" fill="${A.cargoDeep}"/><rect x="243" y="325" width="14" height="10" rx="5" fill="${mixHex(A.glassDeep, C.lamp, 0.25)}"/>`, `<path d="M206 341Q222 318 248 318H300L314 341Z"/>`)
    + `<rect x="272" y="348" width="20" height="25" rx="2" fill="none" stroke="${A.cargoDeep}" stroke-width="1.4"/>`
    + `<text data-art-text="" x="150" y="364" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="8" fill="${A.cargoDeep}" opacity=".7">CARGO</text>`;
  // The terminal's gate lounge (roof edge at y 300): glass over warm light, seats, the gate's sign
  const lounge = depth(ctx, 3, `<rect x="-20" y="300" width="142" height="160" fill="${mixHex(A.whiteDeep, C.lamp, 0.3)}"/>`
    + `<rect x="-20" y="296" width="146" height="8" rx="2" fill="${A.whiteShade}"/><path d="M-20 296.8H126" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`
    + `<rect x="-20" y="330" width="142" height="4" fill="${A.steelDeep}"/>`
    + `<path d="M-6 410h30v-14h-30zM34 410h30v-14h-30zM74 410h30v-14h-30z" fill="${A.crew}"/><path d="M-6 396h30M34 396h30M74 396h30" stroke="${A.crewDeep}" stroke-width="3"/>`
    + glassOver(-20, 334, 142, 110, { bay: 36, opacity: 0.18 }), `<rect x="-20" y="296" width="146" height="164"/>`)
    + hallSign(ctx, 20, 306, 72, 20, '登機門 3') + softEllipse(ctx, 50, 440, 70, 14, 'lamp', 0.3, 'blur8');
  // The fixed tunnel (x 118–200, floor y 440, roof y 384): cut away, its back wall's windows, ribbed roof
  const tunnel = depth(ctx, 3, `<rect x="118" y="384" width="82" height="60" fill="${mixHex(A.steel, A.steelDeep, 0.25)}"/>`
    + `<rect x="114" y="380" width="90" height="8" rx="2" fill="${ref(ctx, 'steelG')}"/>`
    + `<rect x="126" y="396" width="66" height="18" rx="3" fill="${A.glassDeep}"/><path d="M148 396v18M170 396v18" stroke="${A.steelDeep}" stroke-width="2"/>`
    + `<path d="M118 424H200" stroke="${A.steelDeep}" stroke-width="1.4"/><path d="M114 380.8H204" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`
    + softEllipse(ctx, 159, 430, 34, 8, 'lamp', 0.3), `<rect x="114" y="380" width="90" height="64"/>`)
    + `<path d="M130 444V520M188 444V520" stroke="${A.steelDeep}" stroke-width="5"/>`;
  // The A321's flank at the page's edge: white, its open door (sill y 440) lit, the cockpit's windows
  const flank = 'M330 330Q352 318 400 316V520H340Q326 470 326 420Q326 360 330 330Z';
  const a321 = depth(ctx, 3, `<path d="${flank}" fill="${ref(ctx, 'fuselageG')}"/><path d="M328 420H400" stroke="${A.fuselageDeep}" stroke-width="1" opacity=".6"/>`
    + `<path d="M330 330Q352 318 400 316V326Q356 328 334 340Z" fill="${A.fuselage}"/>`
    + `<rect x="346" y="392" width="30" height="50" rx="5" fill="${ref(ctx, 'window')}"/><path d="M346 397q15 -8 30 0" stroke="${A.fuselageDeep}" stroke-width="1" fill="none"/>`
    + `<path d="M378 392l10 4v42l-10 4z" fill="${A.fuselageShade}"/>`
    + `<path d="M366 336l14 -4l2 10l-14 2zM384 330l14 -2v10l-12 2z" fill="${A.glassDeep}"/>`
    + `<path d="M334 470H400" stroke="${A.fuselageShade}" stroke-width="10"/>`, `<path d="${flank}"/>`)
    + softEllipse(ctx, 360, 440, 30, 12, 'lamp', 0.4, 'blur8');
  const floor = floorPage(ctx, apronFloor(ctx, { seed: 43, lines: [300] })
    + `<text data-art-text="" x="230" y="610" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="40" fill="${A.paint}" opacity=".18" transform="rotate(-4 230 610)">3</text>`
    + pools(ctx, [[50, 470, 90, 20], [360, 460, 60, 16]]));
  return airportDefs(ctx) + standingPage(ctx, sky + far + cargo)
    + floor + lounge + tunnel + a321 + bookCues(ctx) + block();
};

// ——— 6-5 「塔台」 ———

/** 6-5's runway, far below the tower: its geometry, shared with the `c6/runway-lights` part. */
const TOWER_RUNWAY: readonly [Pt, Pt, Pt, Pt] = [[96, 300], [380, 286], [-10, 214], [80, 210]];

/**
 * 6-5: the catwalk round the control tower's cab, high over the airfield at night. Left, the cab's
 * corner — slanted green-blue glass lit warm inside, consoles' silhouettes and screens — its roof's
 * lattice antenna mast (Mocha's `antenna`, (46, 300)) with the red obstruction light on top and the
 * radio's sill (the radio is a prop part). The railing along the catwalk (top rail y 428), the
 * crate of spare runway bulbs on it (Mocha's `crate`, its top at (176, 414)), the mast at right with
 * the windsock (where the searchlight finds the 土地公, (310, 160)). Below and beyond: the dark
 * runway (its lights are the `c6/runway-lights` part, its switch box past the rail), the terminal's
 * lit apron with its sleeping planes, the city's lights to the horizon, the moon.
 */
const towerCatwalk: BackdropDraw = (ctx) => {
  const sky = airportSky(ctx, 196, { moon: [200, 54, 12], seed: 51 });
  const [nl, nr, fl, fr] = TOWER_RUNWAY;
  const field = `<rect x="-20" y="194" width="${PAGE_W + 40}" height="${GUTTER_Y - 194 + 40}" fill="${mixHex(A.runwayDeep, C.shadow, 0.25)}"/>`
    + runway(ctx, nl, nr, fl, fr, { n: 16, lit: false })
    // The apron by the terminal: lit, planes asleep at their gates
    + `<path d="M180 214H410V262L250 270Z" fill="${mixHex(A.tarmac, A.runwayDeep, 0.3)}"/>`
    + pools(ctx, [[300, 236, 110, 18]])
    + `<rect x="230" y="204" width="180" height="12" fill="${mixHex(A.whiteDeep, A.runwayDeep, 0.4)}"/><rect x="234" y="207" width="176" height="5" fill="${ref(ctx, 'window')}" opacity=".6"/>`
    + jet(ctx, 260, 236, { dir: 1, s: 0.22, z: 1 }) + jet(ctx, 318, 238, { dir: 1, s: 0.22, z: 1 }) + jet(ctx, 372, 240, { dir: 1, s: 0.22, z: 1 })
    + taxiway(ctx, [120, 320], [230, 286], [400, 270], 12, 1.4, 0.8)
    + lightLine(ctx, [180, 262], [410, 258], 14, A.taxiBlue, 1, 1);
  // The windsock on its mast (the 土地公 at (310, 160) when the searchlight finds it)
  const sock = `<path d="M300 430V164" stroke="${A.steelDeep}" stroke-width="4"/><path d="M300 430V164" stroke="${A.steelLight}" stroke-width="1" transform="translate(-1 0)"/>`
    + depth(ctx, 3, `<path d="M302 166L346 172L344 184L302 182Z" fill="${C.chalk}"/><path d="M313 167.5L324 169V183L313 182.6ZM335 170.6L345 172L344 184L335 183.6Z" fill="${A.wingRed}"/>`, `<path d="M302 166L346 172L344 184L302 182Z"/>`)
    + softEllipse(ctx, 300, 160, 4, 4, 'lamp', 0.4) + `<circle cx="300" cy="160" r="2.2" fill="${A.wingRed}"/>`;
  // The tower cab's corner (left): slanted glass lit inside, consoles, the roof and its antenna mast
  const glass = 'M-20 336H70L58 438H-20Z';
  const cab = depth(ctx, 3, `<rect x="-20" y="320" width="84" height="16" fill="${A.whiteShade}"/><path d="M-20 320.8H64" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`
    + `<path d="${glass}" fill="${ref(ctx, 'towerG')}"/>`
    + `<path d="M-20 400H66M-4 400V380H20V400M28 400V384H52V400" fill="none" stroke="${mixHex(A.towerGlass, C.shadow, 0.5)}" stroke-width="3"/>`
    + `<rect x="0" y="384" width="16" height="10" fill="${A.wingGreen}" opacity=".5"/><rect x="32" y="386" width="16" height="10" fill="${A.taxiBlue}" opacity=".5"/>`
    + `<path d="M10 336L8 438M42 336L36 438" stroke="${A.steelDeep}" stroke-width="3"/>`
    + `<path d="M-20 438H74V446H-20Z" fill="${A.steelDeep}"/>`, `<path d="${glass}"/><rect x="-20" y="320" width="84" height="126"/>`)
    + softEllipse(ctx, 20, 390, 50, 30, 'lamp', 0.18, 'blur18');
  // The antenna mast: a lattice on the cab's roof up to its red light; the crossbar Mocha sits on (y 300)
  let lattice = '';
  for (let y = 182; y < 320; y += 14) lattice += `M38 ${y}L54 ${y + 14}M54 ${y}L38 ${y + 14}`;
  const mast = depth(ctx, 3, `<path d="M38 320V170M54 320V170" stroke="${A.steelDeep}" stroke-width="2.6"/><path d="${lattice}" stroke="${A.steelDeep}" stroke-width="1.2"/>`
    + `<rect x="26" y="300" width="40" height="5" rx="2" fill="${ref(ctx, 'steelG')}"/><path d="M26 300.8H66" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`
    + `<path d="M46 170V150" stroke="${A.steelDeep}" stroke-width="2"/>`, `<rect x="26" y="150" width="40" height="170"/>`)
    + softEllipse(ctx, 46, 148, 6, 6, 'lamp', 0.4) + `<circle cx="46" cy="148" r="3" fill="${A.wingRed}"/>`;
  // The railing along the catwalk (top rail at y 428): posts, a mid rail, a kick plate
  const railing = depth(ctx, 4, `<path d="${Array.from({ length: 8 }, (_, i) => `M${72 + i * 46} 428V472`).join('')}" stroke="${A.steelDeep}" stroke-width="3"/>`
    + `<rect x="66" y="425" width="340" height="5" rx="2.5" fill="${ref(ctx, 'steelG')}"/><path d="M66 448H406" stroke="${A.steelDeep}" stroke-width="2"/>`
    + `<path d="M66 425.8H406" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<rect x="66" y="425" width="340" height="47"/>`);
  // The crate of spare runway bulbs (top at (176, 414)): slatted wood, stencilled 「備用燈泡」, bulbs peeking
  const crate = depth(ctx, 4, `<rect x="150" y="414" width="54" height="40" fill="${C.wood}"/><path d="M150 427H204M150 440H204" stroke="${C.woodDeep}" stroke-width="1.6"/>`
    + `<path d="M150 414L204 454M204 414L150 454" stroke="${C.woodDeep}" stroke-width="1" opacity=".4"/>`
    + `<path d="M150 414.8H204" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<rect x="150" y="414" width="54" height="40"/>`)
    + `<circle cx="164" cy="412" r="4" fill="${C.glassine}" opacity=".8"/><circle cx="190" cy="411" r="4" fill="${C.glassine}" opacity=".8"/>`
    + `<text data-art-text="" x="177" y="448" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7" fill="${C.washi}" opacity=".8">備用燈泡</text>`;
  const floor = floorPage(ctx, (() => {
    const { x, y, w, h } = FLOOR_RECT;
    let grate = '';
    for (let yy = y + 4, step = 6; yy < y + h; step *= 1.06, yy += step) grate += `M${x} ${f1(yy)}H${x + w}`;
    let bars = '';
    const [vx, vy] = VANISHING_POINT;
    for (let bx = -200; bx <= PAGE_W + 200; bx += 10) bars += `M${f1(bx)} ${FLOOR_BOTTOM}L${f1(bx + (vx - bx) * ((y - FLOOR_BOTTOM) / (vy - FLOOR_BOTTOM)))} ${y}`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mixHex(A.runwayDeep, C.shadow, 0.35)}"/>`
      + `<path d="${grate}${bars}" stroke="${A.grate}" stroke-width="1.2" opacity=".45"/>`
      + `<path d="M${x} ${y + 150}H${x + w}" stroke="${A.white}" stroke-width="5" opacity=".14"/>`
      + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}" opacity=".5"/>`;
  })() + pools(ctx, [[30, 470, 80, 20], [220, GUTTER_Y + 30, 180, 22, 'blue']]));
  // 咻咻, the little cloud that asked the tower if it could take off (the radio's log): peeking by the mast
  const shushu = shushuPeek(ctx, 236, 118, 1.1);
  return airportDefs(ctx) + standingPage(ctx, sky + shushu + field + sock)
    + floor + cab + mast + railing + crate + bookCues(ctx) + block();
};

// ——— 6-6 「海關的印章」 (spread) ———

/**
 * 6-6, the centrefold (its spine's crease is drawn live): the customs hall. Left page: the queue
 * under 「入境查驗 Immigration」, lane numbers, retractable-belt posts (the near one Mocha's `rope`, its
 * top at (40, 410)), a poster of the airport's passport stamps (the 土地公 at (110, 300)). Middle: the
 * X-ray machine — its cream housing and the tunnel the belt runs through (the belt and its tray are
 * the `c6/xray-belt` part), the hood over it (Mocha's `hood`, (200, 352)), the monitor on its arm.
 * Right page: the officer's high booth — its lit glass and sign 「護照查驗」, the counter (its top at
 * y 320; Mocha's `counter` at (334, 318), the 印章's ink pad at (362, 330)), the knee space under it.
 */
const customsSpread: BackdropDraw = (ctx) => {
  const wall = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'hallG')}"/>`
    + paperFibres(-20, 0, PAGE_W + 40, GUTTER_Y, 40, A.whiteDeep, 63, 0.3)
    + `<rect x="-20" y="0" width="${PAGE_W + 40}" height="34" fill="${mixHex(A.whiteDeep, A.runwayDeep, 0.5)}"/>`
    + lightLine(ctx, [-10, 22], [400, 22], 11, C.lampHot, 1.8, 1.8);
  const sign = hallSign(ctx, 20, 52, 156, 40, '入境查驗', 'Immigration')
    + [['1', 30], ['2', 130]].map(([n, x]) => `<rect x="${x}" y="112" width="24" height="24" rx="12" fill="${A.runway}"/><text data-art-text="" x="${Number(x) + 12}" y="129" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="15" fill="${C.chalk}">${n}</text>`).join('');
  // The poster of passport stamps (the 土地公 at (110, 300) once the scanner wakes)
  const stamps = [[90, 262, A.scarf], [126, 270, A.tail], [100, 300, A.wenhu], [130, 306, A.wingGreen]] as const;
  const poster = depth(ctx, 2, `<rect x="72" y="236" width="78" height="94" rx="2" fill="${C.washi}"/>`, `<rect x="72" y="236" width="78" height="94"/>`)
    + `<text data-art-text="" x="111" y="250" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${T.navy}">機場的印章</text>`
    + stamps.map(([x, y, col]) => `<circle cx="${x}" cy="${y}" r="11" fill="none" stroke="${col}" stroke-width="1.6" opacity=".8"/><circle cx="${x}" cy="${y}" r="7.4" fill="none" stroke="${col}" stroke-width=".8" opacity=".8"/>`
      + planeGlyph(x, y, 0.2, col)).join('');
  // The queue's belt posts and their belts (the near post's top is Mocha's rope, (40, 410))
  const post = (x: number, top: number) => `<rect x="${x - 3}" y="${top}" width="6" height="${470 - top}" fill="${ref(ctx, 'steelG')}"/><rect x="${x - 6}" y="${top - 4}" width="12" height="6" rx="3" fill="${A.steelLight}"/><ellipse cx="${x}" cy="470" rx="10" ry="3" fill="${A.steelDeep}"/>`;
  const queue = depth(ctx, 3, post(40, 410) + post(150, 380)
    + `<path d="M43 418Q96 426 147 390" stroke="${A.runway}" stroke-width="4" fill="none"/><path d="M43 417Q96 425 147 389" stroke="${A.taxiBlue}" stroke-width="1" fill="none" opacity=".5"/>`, `<rect x="30" y="376" width="130" height="98"/>`);
  // The X-ray machine: the hood (top at y 352), the tunnel housing over the belt (y 408–472), lead curtains
  const hood = 'M174 352H226L234 408H166Z';
  const machine = depth(ctx, 3, `<path d="${hood}" fill="${ref(ctx, 'xrayG')}"/><path d="M174 352.8H226" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`
    + `<rect x="184" y="364" width="32" height="20" rx="2" fill="${A.runwayDeep}"/><path d="M188 378l6 -6l5 4l8 -9l5 4" stroke="${A.taxiBlue}" stroke-width="1.2" fill="none" opacity=".6"/>`
    + `<rect x="158" y="406" width="84" height="66" rx="4" fill="${ref(ctx, 'xrayG')}"/><path d="M158 406.8H242" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`
    + `<rect x="166" y="420" width="68" height="44" rx="3" fill="${mixHex(A.rubber, C.shadow, 0.3)}"/>`
    + `<path d="${Array.from({ length: 6 }, (_, i) => `M${168 + i * 11} 420h9v${i === 2 || i === 3 ? 24 : 34}h-9z`).join('')}" fill="${A.rubber}" opacity=".9"/>`
    + `<rect x="158" y="440" width="84" height="6" fill="${A.tail}"/>`
    + `<text data-art-text="" x="200" y="415.6" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6.4" fill="${A.runway}">X光檢查</text>`, `<path d="${hood}"/><rect x="158" y="406" width="84" height="66"/>`);
  // The officer's booth on the right page: lit glass, its sign, the counter (top y 320) and its knee space
  const booth = depth(ctx, 2, `<rect x="240" y="150" width="160" height="176" fill="${mixHex(A.counterDeep, A.runwayDeep, 0.3)}"/>`
    + `<rect x="252" y="196" width="140" height="122" fill="${mixHex(A.white, C.lamp, 0.4)}"/>`, `<rect x="240" y="150" width="160" height="176"/>`)
    + softEllipse(ctx, 322, 290, 60, 30, 'lamp', 0.3, 'blur18')
    + `<rect x="306" y="262" width="30" height="34" rx="8" fill="${A.crew}"/><rect x="300" y="292" width="42" height="8" rx="3" fill="${A.crewDeep}"/><path d="M321 300v18" stroke="${A.steelDeep}" stroke-width="3"/>`
    + `<rect x="268" y="292" width="24" height="18" rx="2" fill="${C.printDark}"/><rect x="270" y="294" width="20" height="13" fill="${A.glassLight}" opacity=".5"/>`
    + `<path d="M380 318v-30l8 -10" stroke="${A.steelDeep}" stroke-width="2" fill="none"/><path d="M382 274l14 -4l-2 10z" fill="${A.steelDeep}"/>` + softEllipse(ctx, 388, 282, 10, 6, 'lamp', 0.4)
    + glassOver(252, 196, 140, 122, { bay: 70, opacity: 0.16 })
    + hallSign(ctx, 252, 160, 140, 28, '護照查驗', 'Passport Control');
  const counter = depth(ctx, 4, `<rect x="236" y="320" width="170" height="12" rx="2" fill="${ref(ctx, 'counterG')}"/><path d="M236 320.8H406" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`
    + `<rect x="250" y="332" width="156" height="104" fill="${A.counter}"/><path d="M250 384H406" stroke="${A.counterDeep}" stroke-width="2"/><rect x="250" y="400" width="156" height="8" fill="${A.tail}"/>`
    + `<rect x="250" y="332" width="10" height="160" fill="${A.counterDeep}"/>`
    + `<rect x="346" y="326" width="32" height="6" rx="1.4" fill="${A.inkPad}"/>`
    + `<rect x="306" y="312" width="22" height="8" rx="1" fill="${A.tailDeep}"/><path d="M308 314h18" stroke="${C.goldLight}" stroke-width=".8"/>`, `<rect x="236" y="320" width="170" height="172"/>`);
  const floor = floorPage(ctx, terrazzoFloor(ctx, { seed: 61 })
    + `<path d="M-40 520H150M-40 560H150" stroke="${A.runway}" stroke-width="3" opacity=".45"/>`
    + pools(ctx, [[320, 470, 90, 22], [200, GUTTER_Y + 40, 120, 22, 'blue']]));
  return airportDefs(ctx) + standingPage(ctx, wall + wallWash(ctx, [30, 110, 196], 34, 170) + sign + poster + booth
    + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'amberWash')}"/>`)
    + floor + queue + machine + counter + bookCues(ctx) + block();
};

export const C6_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'c6/front-car': frontCar,
  'c6/baggage-hall': baggageHall,
  'c6/observation-deck': observationDeck,
  'c6/jet-bridge': jetBridge,
  'c6/tower-catwalk': towerCatwalk,
  'c6/customs-spread': customsSpread,
};

// ——— Parts ———

// 6-1's front window and switch

/** The window's frame (page (14, 226)–(206, 356)), in local units round the front panel's centre (80, 420). */
const PANE = { x: -66, y: -194, w: 192, h: 130 };

/** Two rails and their sleepers from the window's foot to a vanishing point, bending by `bend`. */
function track(from: Pt, to: Pt, bend: number, colour: string, sleepers = true): string {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const cx = (x0 + x1) / 2 + bend;
  const cy = (y0 + y1) / 2;
  const at = (t: number, dx: number): Pt => {
    const k = 1 - t * 0.85;
    return [(1 - t) ** 2 * (x0 + dx) + 2 * (1 - t) * t * (cx + dx * 0.5) + t * t * (x1 + dx * 0.15), (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1 + 0 * k];
  };
  let ties = '';
  if (sleepers) for (let i = 1; i < 9; i++) {
    const t = 1 - (1 - i / 9) ** 1.5;
    const [ax, ay] = at(t, -20 * (1 - t * 0.8));
    const [bx, by] = at(t, 20 * (1 - t * 0.8));
    ties += `M${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}`;
  }
  const rail = (dx: number) => `M${f1(x0 + dx)} ${f1(y0)}Q${f1(cx + dx * 0.5)} ${f1(cy)} ${f1(x1 + dx * 0.15)} ${f1(y1)}`;
  return `<path d="${ties}" stroke="${mixHex(A.tarmac, A.steelDeep, 0.5)}" stroke-width="2.4"/>`
    + `<path d="${rail(-14)}${rail(14)}" stroke="${colour}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
}

/**
 * 6-1's driverless train, as its front window shows it (a `tab` nobody drives: printed art per
 * state, D-79), local origin at the front panel's centre (80, 420). The window over the night
 * track, the car's headlights pooling on it: at the `junction` the rails fork in the dark (the depot
 * loop bending away left past a red signal, the airport branch straight on under a green one to a
 * far 「松山機場」 and a plane's lights in the sky); on the `loop` the rails curve round the depot past
 * its lit shed (where the 土地公 waves); at the `airport` the station's platform lights, its sign and a
 * plane's tail over the roof fill the glass. Under it the front panel: no driver, just a speaker
 * grille and a lamp that waits for 嗶！ (blue), green once running.
 */
const frontWindow: PartSource = {
  preset: 'tab',
  states: ['junction', 'loop', 'airport'],
  box: { x: -76, y: -204, w: 212, h: 246 },
  draw(ctx: KitCtx, state) {
    const { x, y, w, h } = PANE;
    const frame = `M${x - 6} ${y - 8}H${x + w + 6}Q${x + w + 10} ${y - 8} ${x + w + 10} ${y - 4}V${y + h + 6}H${x - 6}Z`;
    const id = ctx.id(`pane${state}`);
    const sky = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.nightCardDeep}"/>`
      + `<rect x="${x}" y="${y + 40}" width="${w}" height="30" fill="${mixHex(C.nightCardDeep, C.nightCard, 0.5)}"/>`
      + pinholes(ctx, x, y, w, 40, 10, 66);
    const ground = (top: number) => `<path d="M${x} ${y + top}H${x + w}V${y + h}H${x}Z" fill="${mixHex(A.tarmacDeep, C.shadow, 0.3)}"/>`;
    const foot: Pt = [x + w / 2, y + h + 4];
    const head = `<path d="M${x + 40} ${y + h}L${x + w / 2 - 6} ${y + 76}H${x + w / 2 + 6}L${x + w - 40} ${y + h}Z" fill="${C.lamp}" opacity=".14"${blur(ctx, 'blur8')}/>`;
    const signal = (sx: number, sy: number, col: string) => `<path d="M${sx} ${sy}v14" stroke="${A.steelDeep}" stroke-width="1.6"/><rect x="${sx - 3}" y="${sy - 8}" width="6" height="9" rx="2" fill="${C.printDark}"/>`
      + softEllipse(ctx, sx, sy - 4, 4, 4, 'lamp', 0.4) + `<circle cx="${sx}" cy="${sy - 4}" r="1.8" fill="${col}"/>`;
    let view = '';
    if (state === 'junction') {
      view = sky + ground(66)
        + `<text data-art-text="" x="${x + w / 2 + 40}" y="${y + 50}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.lampAmber}">松山機場</text>`
        + lightLine(ctx, [x + w / 2 + 10, y + 64], [x + w - 6, y + 62], 7, C.lampHot, 1, 1)
        + planeGlyph(x + w - 30, y + 22, 0.2, C.chalk) + softEllipse(ctx, x + w - 30, y + 22, 4, 4, 'lamp', 0.4)
        + track(foot, [x + 36, y + 70], -46, A.steel) + track(foot, [x + w / 2 + 34, y + 66], 8, A.steelLight)
        + signal(x + 54, y + 74, A.wingRed) + signal(x + w / 2 + 20, y + 70, A.wingGreen) + head;
    } else if (state === 'loop') {
      view = sky + ground(60)
        + `<path d="M${x + 58} ${y + 62}h66v-22l-33 -16l-33 16z" fill="${mixHex(A.whiteDeep, A.runwayDeep, 0.3)}"/><rect x="${x + 80}" y="${y + 44}" width="22" height="18" fill="${ref(ctx, 'window')}"/>`
        + softEllipse(ctx, x + 91, y + 56, 20, 10, 'lamp', 0.3)
        + `<text data-art-text="" x="${x + 91}" y="${y + 38}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6" fill="${C.chalk}" opacity=".8">機廠</text>`
        + track(foot, [x + w - 20, y + 66], -150, A.steelLight) + head;
    } else {
      view = sky + `<rect x="${x}" y="${y + 50}" width="${w}" height="${h - 50}" fill="${mixHex(A.whiteShade, A.runwayDeep, 0.3)}"/>`
        + jet(ctx, x + 150, y + 46, { dir: -1, s: 0.3, z: 1 })
        + `<path d="M${x} ${y + h}L${x + 66} ${y + 76}H${x + w}V${y + h}Z" fill="${mixHex(A.terrazzo, A.terrazzoDeep, 0.4)}"/>`
        + `<path d="M${x + 66} ${y + 76}H${x + w}" stroke="${C.ochre}" stroke-width="2.4"/>`
        + lightLine(ctx, [x + 70, y + 58], [x + w - 4, y + 58], 6, C.lampHot, 2, 2)
        + hallSign(ctx, x + 100, y + 14, 80, 26, '松山機場', 'Songshan Airport')
        + softEllipse(ctx, x + 140, y + 90, 70, 24, 'lamp', 0.3, 'blur8');
    }
    const shine = `<path d="M${x + 8} ${y + 8}L${x + 54} ${y + 8}L${x + 8} ${y + 64}Z" fill="${C.glassine}" opacity=".16"/><path d="M${x + 70} ${y + h}L${x + 120} ${y}H${x + 128}L${x + 78} ${y + h}Z" fill="${C.glassine}" opacity=".06"/>`;
    const glass = `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/></clipPath><g clip-path="url(#${id})">${view}${shine}</g>`;
    const pane = airportDefs(ctx) + depth(ctx, 3, `<path d="${frame}" fill="${mixHex(A.steelDeep, C.shadow, 0.3)}"/>${glass}`
      + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="none" stroke="${A.steelDeep}" stroke-width="2"/>`, `<path d="${frame}"/>`);
    // The front panel: a speaker grille and the lamp that waits for a beep
    const panelBody = 'M-36 -24H36Q40 -24 40 -20V26H-40V-20Q-40 -24 -36 -24Z';
    const lamp = state === 'junction' ? C.wordBeep : C.doneGreen;
    const panel = depth(ctx, 2, `<path d="${panelBody}" fill="${A.steelDeep}"/><path d="M-36 -23.2H36" stroke="${A.steelLight}" stroke-width="1" opacity=".6"/>`
      + `<path d="M-26 -10h30M-26 -3h30M-26 4h30M-26 11h30" stroke="${mixHex(A.steelDeep, C.shadow, 0.5)}" stroke-width="2" stroke-linecap="round"/>`
      + `<circle cx="22" cy="0" r="8" fill="${lamp}" stroke="${C.printDark}" stroke-width="1.4"/><circle cx="20" cy="-2.4" r="2.4" fill="${C.cutRim}" opacity=".5"/>`
      + `<text data-art-text="" x="22" y="20" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6" fill="${C.chalk}" opacity=".85">嗶</text>`, `<path d="${panelBody}"/>`)
      + softEllipse(ctx, 22, 0, 10, 10, 'lamp', state === 'junction' ? 0.12 : 0.3);
    return pane + panel;
  },
};

/**
 * 6-1's track switch (under its 拉 tab, a printed housing under the track): a steel switch box set
 * in the car's floor with a little map of the fork printed on its lid — the depot loop's bend and
 * the airport's straight branch — the chosen branch lit (amber loop, green airport). Local origin
 * at the tab's hit centre (105, 532).
 */
const trackSwitch: PartSource = {
  preset: 'tab',
  states: ['loop', 'airport'],
  box: { x: -82, y: -34, w: 164, h: 64 },
  draw(ctx, state) {
    const lid = 'M-76 -26H76Q80 -26 80 -22V22Q80 26 76 26H-76Q-80 26 -80 22V-22Q-80 -26 -76 -26Z';
    const loop = state === 'loop';
    return airportDefs(ctx) + depth(ctx, 2, `<path d="${lid}" fill="${ref(ctx, 'steelV')}"/><path d="M-76 -25.2H76" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`
      + `<rect x="-72" y="-20" width="144" height="40" rx="3" fill="${mixHex(A.steelDeep, C.shadow, 0.3)}"/>`, `<path d="${lid}"/>`)
      // The little fork map along the lid's top edge
      + `<path d="M-64 -12H-34" stroke="${A.steelLight}" stroke-width="2" stroke-linecap="round"/>`
      + `<path d="M-34 -12Q-22 -12 -16 -18Q-10 -22 -2 -18" stroke="${loop ? A.taxiAmber : A.steel}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      + `<path d="M-34 -12H0" stroke="${loop ? A.steel : A.wingGreen}" stroke-width="2" stroke-linecap="round"/>`
      + `<text data-art-text="" x="8" y="-14" font-family="'Noto Serif TC'" font-weight="900" font-size="6" fill="${C.chalk}" opacity=".8">${loop ? '機廠環線' : '往 松山機場'}</text>`;
  },
};

// 6-2's carousel

/** 6-2's belt slots (page units) and the loop's hit centre. */
const BELT2: readonly Pt[] = [[152, 456], [276, 456], [270, 396], [158, 396]];
const BELT2_HIT: Pt = [214, 473];

/**
 * 6-2's carousel belt (a `loop`; its crank is drawn live, marigold, by the view): seen from the
 * front, the racetrack of kraft-card plates (bible § 6 row 6: "the baggage carousel as a loop of
 * kraft cards") overlapping like fish scales round its steel bed — the front run, the far end's
 * curve, the back run ducking toward the chute — on a dark rubber skirt; while switched off it is
 * the same in every state (the suitcases ride as the loop's riders, `view/art/carriages.ts`). One
 * drawing (state `0`; the loader serves the others from it). Local origin at the hit centre.
 */
const carouselBelt: PartSource = {
  preset: 'loop',
  states: ['0'],
  box: { x: -112, y: -104, w: 224, h: 140 },
  draw(ctx) {
    const [hx, hy] = BELT2_HIT;
    const L = ([x, y]: Pt): Pt => [x - hx, y - hy];
    const [f0, f1p] = [L(BELT2[0]), L(BELT2[1])];
    const [b2] = [L(BELT2[2])];
    // The bed: an oblong ring from the front run (y 456) to the back run (y 396)
    const front = f0[1] + 6, back = b2[1] + 6;
    const xl = f0[0] - 30, xr = f1p[0] + 26;
    const ring = (inset: number) => {
      const t = back + inset, b = front - inset, l = xl + inset, r = xr - inset, rr = (b - t) / 2;
      return `M${f1(l + rr)} ${f1(t)}H${f1(r - rr)}A${f1(rr)} ${f1(rr)} 0 0 1 ${f1(r - rr)} ${f1(b)}H${f1(l + rr)}A${f1(rr)} ${f1(rr)} 0 0 1 ${f1(l + rr)} ${f1(t)}Z`;
    };
    // Plates: overlapping kraft scales along the ring's middle line
    let plates = '';
    const mid = (k: number): Pt => {
      const t = back + 9, b = front - 9, l = xl + 9, r = xr - 9, rr = (b - t) / 2;
      const straight = r - l - 2 * rr;
      const per = 2 * straight + 2 * Math.PI * rr;
      let d = k * per;
      if (d < straight) return [l + rr + d, b];
      d -= straight;
      if (d < Math.PI * rr) { const a = Math.PI / 2 - d / rr; return [r - rr + Math.cos(a) * rr, (t + b) / 2 + Math.sin(a) * rr]; }
      d -= Math.PI * rr;
      if (d < straight) return [r - rr - d, t];
      d -= straight;
      const a = -Math.PI / 2 - d / rr;
      return [l + rr + Math.cos(a) * rr, (t + b) / 2 + Math.sin(a) * rr];
    };
    for (let i = 0; i < 28; i++) {
      const [px, py] = mid(i / 28);
      plates += `<path d="M${f1(px - 6)} ${f1(py - 6)}h12l3 6l-3 6h-12l3 -6z" fill="${i % 2 ? C.kraft : mixHex(C.kraft, C.kraftDark, 0.5)}"/>`;
    }
    return airportDefs(ctx) + softEllipse(ctx, (xl + xr) / 2, front + 10, (xr - xl) / 2, 8, 'shadow', 0.4)
      + depth(ctx, 3, `<path d="${ring(-6)}" fill="${A.rubber}"/><path d="${ring(-2)}" fill="${ref(ctx, 'steelV')}"/>`
        + `<path d="${ring(3)}" fill="${C.kraftDark}"/>` + plates
        + `<path d="${ring(16)}" fill="${mixHex(A.steelDeep, C.shadow, 0.35)}"/>`
        + `<path d="${ring(-2)}" fill="none" stroke="${C.cutRim}" stroke-width=".9" opacity=".45"/>`, `<path d="${ring(-6)}"/>`)
      + `<path d="M${f1(xl + 4)} ${f1(front + 6)}H${f1(xr - 4)}" stroke="${A.rubberLight}" stroke-width="3" opacity=".7"/>`;
  },
};

/**
 * 6-2's start button behind the rubber curtain (a weight `button`; Mocha's weight presses it): a
 * steel box with a big green mushroom button and 「啟動」; `down`, pressed — the button
 * sunk, its ring lit, chalk 「喀！」. Local origin at the hit centre (344, 408).
 */
const startButton: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -30, y: -30, w: 64, h: 60 },
  draw(ctx, state) {
    const down = state === 'down';
    const box = 'M-18 -2H18V22H-18Z';
    return airportDefs(ctx) + depth(ctx, 3, `<path d="${box}" fill="${ref(ctx, 'steelV')}"/><path d="M-17 -1.2H17" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`
      + `<text data-art-text="" x="0" y="17" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7" fill="${C.printDark}">啟動</text>`
      + (down ? `<ellipse cx="0" cy="-2" rx="11" ry="3" fill="${mixHex(C.doneGreen, C.shadow, 0.3)}"/>` : `<path d="M-11 -2V-8Q0 -13 11 -8V-2Z" fill="${C.doneGreen}"/><ellipse cx="0" cy="-8.6" rx="11" ry="3.4" fill="${mixHex(C.doneGreen, C.cutRim, 0.3)}"/>`),
    `<path d="${box}"/>`)
      + (down ? softEllipse(ctx, 0, -2, 14, 6, 'lamp', 0.35)
        + `<g stroke="${C.chalk}" stroke-width="1.4" stroke-linecap="round" opacity=".9"><path d="M16 -10l5 -4M18 -2h6"/></g>`
        + `<text data-art-text="" x="14" y="-16" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.chalk}">喀！</text>` : '');
  },
};

/**
 * 6-2's beacon over the carousel (a `light`): an amber dome on the island's post; `off`, dark glass;
 * `on`, spinning amber — the dome lit, two beams swept out either side and the hall washed with its
 * light. Local origin at the hit centre (214, 328).
 */
const carouselBeacon: PartSource = {
  preset: 'light',
  states: ['off', 'on'],
  box: { x: -110, y: -40, w: 220, h: 80 },
  draw(ctx, state) {
    const on = state === 'on';
    const dome = 'M-10 6V-4Q-10 -14 0 -14Q10 -14 10 -4V6Z';
    return airportDefs(ctx) + (on ? `<path d="M0 -4L-104 -30V18ZM0 -4L104 -26V20Z" fill="${A.taxiAmber}" opacity=".18"${blur(ctx, 'blur8')}/>` + softEllipse(ctx, 0, -4, 22, 18, 'lamp', 0.5, 'blur8') : '')
      + depth(ctx, 3, `<rect x="-13" y="6" width="26" height="8" rx="2" fill="${A.steelDeep}"/><path d="${dome}" fill="${on ? A.taxiAmber : mixHex(A.taxiAmber, A.steelDeep, 0.7)}"/>`
        + `<path d="M-6 -6q2 -5 6 -6" stroke="${C.cutRim}" stroke-width="1.4" fill="none" opacity=".6"/>`, `<path d="${dome}"/><rect x="-13" y="6" width="26" height="8"/>`)
      + (on ? `<path d="M-4 -8h8v10h-8z" fill="${C.lampHot}" opacity=".85"/>` : '');
  },
};

// 6-3's gate and the plane's lights

/**
 * 6-3's deck gate (a `gate`; the pigeons on its push button hold it shut): a low steel gate on a
 * post, its push button on a post beside it (where the pigeons roost, (262, 420)) with 「按」;
 * `open`, swung back flat against the windbreak, the button's ring lit green. Local origin at the
 * hit centre (244, 442), the deck at local y 42.
 */
const deckGate: PartSource = {
  preset: 'gate',
  states: ['closed', 'open'],
  box: { x: -34, y: -40, w: 68, h: 86 },
  draw(ctx, state) {
    const open = state === 'open';
    const foot = 42;
    const post = `<rect x="-24" y="-6" width="5" height="${foot + 6}" fill="${ref(ctx, 'steelG')}"/><rect x="16" y="-18" width="5" height="${foot + 18}" fill="${ref(ctx, 'steelG')}"/>`;
    const button = `<rect x="11" y="-26" width="16" height="10" rx="2" fill="${A.steelDeep}"/><circle cx="19" cy="-22" r="4" fill="${open ? C.doneGreen : mixHex(C.doneGreen, A.steelDeep, 0.6)}"/>`;
    const bars = open
      ? `<path d="M-19 0L-12 -4V${foot - 6}L-19 ${foot - 2}Z" fill="${A.steel}"/><path d="M-16 4V${foot - 6}" stroke="${A.steelDeep}" stroke-width="1"/>`
      : `<path d="M-19 2H16M-19 ${foot - 4}H16" stroke="${A.steelLight}" stroke-width="3"/><path d="${Array.from({ length: 5 }, (_, i) => `M${-14 + i * 6.5} 2V${foot - 4}`).join('')}" stroke="${A.steel}" stroke-width="2"/>`;
    return airportDefs(ctx) + depth(ctx, 3, post + bars + button, `<rect x="-24" y="-26" width="51" height="${foot + 26}"/>`)
      + (open ? softEllipse(ctx, 19, -22, 7, 7, 'lamp', 0.35) : '')
      + `<text data-art-text="" x="19" y="-29" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6" fill="${C.chalk}" opacity=".85">按</text>`;
  },
};

/**
 * 6-3's sleeping A321's lights (a `light`; it winks them at every 飛機！): `off`, asleep — only its
 * wing-tip light glows faintly (on the backdrop); `on`, its cabin windows glow, the beacon flashes,
 * its wing tip and tail light shine. Local origin at the hit centre (310, 280).
 */
const planeLights: PartSource = {
  preset: 'light',
  states: ['off', 'on'],
  box: { x: -200, y: -70, w: 260, h: 110 },
  draw(ctx, state) {
    if (state === 'off') return `<g/>`;
    return `<g transform="translate(-310 -280)">${jetLights(ctx, DECK_JET.x, DECK_JET.y, DECK_JET.o, true)}</g>`;
  },
};

// 6-4's bridge

/** 6-4's cab positions (the `cab` node per `swing` state) and the plank's end (node `P` per `plank` state). */
const CAB: Readonly<Record<string, Pt>> = { stow: [252, 470], jet: [286, 440], cargo: [282, 372] };
const PLANK_END: Readonly<Record<string, Pt>> = { down: [324, 440], up: [320, 412] };

/**
 * 6-4's telescoping bridge (under its 拉 tab, the tab's printed housing): the bridge's control
 * desk set in the gate lounge's floor — a steel console with a little diagram of the bridge, in or
 * out. The telescoping section itself is the carriage the tab moves (`view/art/carriages.ts`).
 * Local origin at the tab's hit centre (120, 532).
 */
const bridgeExtend: PartSource = {
  preset: 'tab',
  states: ['in', 'out'],
  box: { x: -92, y: -32, w: 184, h: 62 },
  draw(ctx, state) {
    const desk = 'M-86 -24H86Q90 -24 90 -20V22Q90 26 86 26H-86Q-90 26 -90 22V-20Q-90 -24 -86 -24Z';
    const out = state === 'out';
    return airportDefs(ctx) + depth(ctx, 2, `<path d="${desk}" fill="${ref(ctx, 'steelV')}"/><path d="M-86 -23.2H86" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`
      + `<rect x="-82" y="-18" width="164" height="38" rx="3" fill="${mixHex(A.steelDeep, C.shadow, 0.3)}"/>`, `<path d="${desk}"/>`)
      + `<rect x="-70" y="-15" width="22" height="6" rx="1" fill="${A.white}"/><rect x="${out ? -48 : -52}" y="-14" width="${out ? 24 : 10}" height="4" rx="1" fill="${out ? A.wingGreen : A.whiteShade}"/>`
      + `<text data-art-text="" x="-10" y="-9" font-family="'Noto Serif TC'" font-weight="900" font-size="6" fill="${C.chalk}" opacity=".8">空橋 ${out ? '伸出' : '收回'}</text>`;
  },
};

/**
 * 6-4's cab wheels (a `wheel`, 轉; locked while the birds roost): the bridge's drive bogie as a dial —
 * a marigold knurled rim (its grip) round a printed face: the bogie's two tyres from above and a
 * steering arrow. The view turns the bitmap by each state's angle; one drawing (state `stow`).
 * Pivot at its centre (300, 528), radius 30.
 */
const bridgeWheels: PartSource = {
  preset: 'wheel',
  states: ['stow'],
  pivot: [0, 0],
  box: { x: -38, y: -38, w: 76, h: 76 },
  draw(ctx) {
    const r = 30;
    const rim = wheelRim(r, 20);
    const tyre = (x: number) => `<rect x="${x - 4}" y="-12" width="8" height="24" rx="3" fill="${C.printDark}"/><path d="M${x - 4} -6h8M${x - 4} 0h8M${x - 4} 6h8" stroke="${A.rubberLight}" stroke-width="1"/>`;
    return depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/>`
      + `<circle r="${r - 5}" fill="${A.steel}"/><circle r="${r - 5}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1.4" opacity=".6"/>`
      + `<rect x="-11" y="-3" width="22" height="6" fill="${A.steelDeep}"/>` + tyre(-12) + tyre(12)
      + `<path d="M0 -22l5 7h-10z" fill="${A.white}"/>`, `<path d="${rim}"/>`);
  },
};

/**
 * 6-4's cab and gangplank (a `lift` riding the cab, `ridesOn`): the jet bridge's rotunda cab — a
 * steel box with a window, its accordion bellows toward the plane, its drive leg down to the bogie's
 * tyres — and the plank, a seesaw on the cab's sill: `down` (the birds roosting on its inner end),
 * its outer end tipped down; `up`, tipped up into the air. The view draws it at the plank's end
 * (`P`) shifted with the cab, so the cab is drawn where the cab node is relative to that point.
 */
const bridgePlank: PartSource = {
  preset: 'lift',
  states: ['down', 'up'],
  box: { x: -120, y: -40, w: 130, h: 172 },
  draw(ctx, state) {
    // Local origin: the plank's end for this state with the cab at home (stow); the cab is at
    // CAB.stow − PLANK_END[state], and the plank runs from the cab's sill out to its end
    const [ex, ey] = PLANK_END[state];
    const [cx, cy] = [CAB.stow[0] - ex, CAB.stow[1] - ey];
    const up = state === 'up';
    // The cab: floor at the cab node, walls 52 up, bellows on its +x side, a window, a roof
    const cab = `M${cx - 26} ${cy}V${cy - 52}H${cx + 18}V${cy}Z`;
    const bellows = Array.from({ length: 4 }, (_, i) => `M${cx + 18 + i * 3} ${cy - 50}V${cy - 2}`).join('');
    // The plank: from the cab's sill (cx + 18, cy) out to its tip, tipped down or up about its pivot
    const tip: Pt = up ? [cx + 50, cy - 26] : [cx + 54, cy + 2];
    const plank = `M${cx + 14} ${cy - 3}L${f1(tip[0])} ${f1(tip[1] - 3)}L${f1(tip[0])} ${f1(tip[1] + 2)}L${cx + 14} ${cy + 2}Z`;
    return airportDefs(ctx)
      // The drive leg and the bogie's tyres
      + `<path d="M${cx - 4} ${cy}V${cy + 44}" stroke="${A.steelDeep}" stroke-width="6"/><path d="M${cx - 18} ${cy + 46}H${cx + 10}" stroke="${A.steelDeep}" stroke-width="4"/>`
      + `<circle cx="${cx - 14}" cy="${cy + 50}" r="7" fill="${C.printDark}"/><circle cx="${cx + 6}" cy="${cy + 50}" r="7" fill="${C.printDark}"/>`
      + `<circle cx="${cx - 14}" cy="${cy + 50}" r="2.6" fill="${A.steel}"/><circle cx="${cx + 6}" cy="${cy + 50}" r="2.6" fill="${A.steel}"/>`
      + softEllipse(ctx, cx - 4, cy + 57, 22, 3, 'shadow', 0.4)
      + depth(ctx, 3, `<path d="${cab}" fill="${ref(ctx, 'steelV')}"/><rect x="${cx - 30}" y="${cy - 56}" width="52" height="6" rx="2" fill="${A.steelDeep}"/>`
        + `<rect x="${cx - 18}" y="${cy - 42}" width="24" height="16" rx="2" fill="${ref(ctx, 'window')}"/>`
        + `<path d="${bellows}" stroke="${A.rubber}" stroke-width="2.4"/><path d="M${cx - 26} ${cy - 1}H${cx + 18}" stroke="${A.steelDeep}" stroke-width="3"/>`
        + `<path d="M${cx - 30} ${cy - 55.2}H${cx + 22}" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`, `<path d="${cab}"/>`)
      + softEllipse(ctx, cx - 6, cy - 34, 16, 10, 'lamp', 0.25)
      + depth(ctx, 3, `<path d="${plank}" fill="${C.kraft}"/><path d="M${cx + 16} ${cy - 2}L${f1(tip[0])} ${f1(tip[1] - 2)}" stroke="${C.kraftDark}" stroke-width="1" stroke-dasharray="3 3"/>`
        + `<circle cx="${cx + 16}" cy="${cy}" r="3" fill="${ref(ctx, 'foil')}"/>`, `<path d="${plank}"/>`)
      + (up ? `<path d="M${f1(tip[0] + 4)} ${f1(tip[1] - 8)}q6 -2 6 -8" stroke="${C.chalk}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/>` : '');
  },
};

// 6-5's searchlight, runway lights and radio

/**
 * 6-5's searchlight mount (a `wheel`, 轉): a marigold knurled dial (its grip) round a printed face —
 * the signal lamp's barrel and lens, pointing the way the dial turns. One drawing (state `near`).
 * Pivot at its centre (190, 528), radius 30.
 */
const searchlight: PartSource = {
  preset: 'wheel',
  states: ['near'],
  pivot: [0, 0],
  box: { x: -38, y: -38, w: 76, h: 76 },
  draw(ctx) {
    const r = 30;
    const rim = wheelRim(r, 20);
    return airportDefs(ctx) + depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/>`
      + `<circle r="${r - 5}" fill="${A.runwayDeep}"/><circle r="${r - 5}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1.4" opacity=".6"/>`
      + `<path d="M-8 10V-10H8V10Z" fill="${A.steel}"/><path d="M-11 -10H11L8 -18H-8Z" fill="${A.steelLight}"/><ellipse cx="0" cy="-18" rx="8" ry="2.4" fill="${C.lampHot}"/>`
      + `<path d="M-14 4H-8M8 4H14" stroke="${A.steelDeep}" stroke-width="3"/>`, `<path d="${rim}"/>`)
      + `<path d="M-6 -20L-14 -27H14L6 -20Z" fill="${C.lamp}" opacity=".35"/>`;
  },
};

/**
 * 6-5's runway lights (a `light`; 哇！ from the far end): the switch box on its bracket past the rail
 * (a steel box, a lever, 「跑道燈」) and, `on`, the whole runway far below lit — its edge lights white
 * and amber converging on the dark, green across the threshold, red at the far end, the approach
 * lights' bar — with a glow over the field; the box's lamp green. `off`: just the box, its lamp dark.
 * Local origin at the hit centre (330, 330).
 */
const runwayLights: PartSource = {
  preset: 'light',
  states: ['off', 'on'],
  box: { x: -350, y: -130, w: 420, h: 170 },
  draw(ctx, state) {
    const on = state === 'on';
    const box = 'M-20 -18H20V18H-20Z';
    const swBox = depth(ctx, 3, `<path d="M-30 18L-60 96" stroke="${A.steelDeep}" stroke-width="3"/><path d="${box}" fill="${ref(ctx, 'steelV')}"/><path d="M-19 -17.2H19" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`
      + `<rect x="-14" y="-4" width="20" height="16" rx="2" fill="${mixHex(A.steelDeep, C.shadow, 0.3)}"/><path d="M-4 8L${on ? 4 : -10} -2" stroke="${A.steelLight}" stroke-width="2.4" stroke-linecap="round"/>`
      + `<circle cx="12" cy="4" r="3" fill="${on ? C.doneGreen : A.steelDeep}"/>`
      + `<text data-art-text="" x="0" y="-8" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6" fill="${C.printDark}">跑道燈</text>`, `<path d="${box}"/>`)
      + (on ? softEllipse(ctx, 12, 4, 5, 5, 'lamp', 0.5) : '');
    if (!on) return airportDefs(ctx) + swBox;
    const [nl, nr, fl, fr] = TOWER_RUNWAY.map(([x, y]) => [x - 330, y - 330] as Pt);
    // The approach lights' bar running in toward the near threshold, and a glow over the field
    const approach = lightLine(ctx, [nl[0] + (nr[0] - nl[0]) * 0.5 + 40, nl[1] + 26], [nl[0] + (nr[0] - nl[0]) * 0.5 + 6, nl[1] + 4], 6, C.lampHot, 2.2, 1.4);
    return airportDefs(ctx)
      + `<path d="M${nl[0]} ${nl[1]}L${nr[0]} ${nr[1]}L${fr[0]} ${fr[1]}L${fl[0]} ${fl[1]}Z" fill="${C.lamp}" opacity=".12"${blur(ctx, 'blur18')}/>`
      + runway(ctx, nl, nr, fl, fr, { n: 16, lit: true, paint: false }) + approach + swBox;
  },
};

/**
 * 6-5's tower radio (a `prop`, the 淘氣): a chunky handset radio on the cab's sill, its antenna up;
 * `over`, its lamp lit, sound rings and chalk 「Over。」. Local origin at the hit centre (78, 408).
 */
const towerRadio: PartSource = {
  preset: 'prop',
  states: ['quiet', 'over'],
  box: { x: -40, y: -46, w: 84, h: 76 },
  draw(ctx, state) {
    const over = state === 'over';
    const body = 'M-18 -6H18V22H-18Z';
    return airportDefs(ctx) + depth(ctx, 3, `<path d="M10 -6V-32" stroke="${C.printDark}" stroke-width="2"/><circle cx="10" cy="-33" r="2" fill="${C.printDark}"/>`
      + `<path d="${body}" fill="${A.engine}"/><path d="M-17 -5.2H17" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`
      + `<path d="M-13 2h14M-13 7h14M-13 12h14" stroke="${mixHex(A.engine, C.shadow, 0.5)}" stroke-width="2" stroke-linecap="round"/>`
      + `<circle cx="10" cy="8" r="4" fill="${mixHex(A.engine, C.shadow, 0.4)}"/><circle cx="10" cy="17" r="2" fill="${over ? A.wingGreen : mixHex(A.engine, C.shadow, 0.5)}"/>`
      + `<path d="M-22 4q-8 6 -4 16" stroke="${C.printDark}" stroke-width="1.4" fill="none"/><rect x="-30" y="16" width="8" height="12" rx="3" fill="${C.printDark}"/>`, `<path d="${body}"/><rect x="-30" y="16" width="8" height="12"/>`)
      + (over ? softEllipse(ctx, 10, 17, 5, 5, 'lamp', 0.4)
        + `<g stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"><path d="M20 -24q5 5 0 10M25 -28q9 9 0 18"/></g>`
        + `<text data-art-text="" x="-6" y="-24" text-anchor="end" font-family="Fredoka" font-weight="700" font-size="10" fill="${C.chalk}">Over。</text>` : '');
  },
};

// 6-6's belt, scanner, stamper and the 印章

/** 6-6's belt slots: the mouth, in the tunnel, the far end, back over the top. */
const BELT6: readonly Pt[] = [[130, 470], [200, 470], [270, 470], [200, 404]];

/**
 * 6-6's X-ray belt (a `loop`; its crank is drawn live, marigold, by the view): the conveyor through
 * the machine — the belt over its rollers from the queue's end (x 104) out to the far end (x 296),
 * its steel side rails, the return rollers over the tunnel's roof — the same in every state (the
 * tray rides as the loop's rider). One drawing (state `0`). Local origin at the hit centre (200, 520).
 */
const xrayBelt: PartSource = {
  preset: 'loop',
  states: ['0'],
  box: { x: -112, y: -134, w: 224, h: 112 },
  draw(ctx) {
    const y = BELT6[0][1] - 520;
    const top = BELT6[3][1] - 520;
    let rollers = '';
    for (let x = -94; x <= 94; x += 9) rollers += `<circle cx="${x}" cy="${y + 7}" r="2.6"/>`;
    let ret = '';
    for (let x = -36; x <= 36; x += 9) ret += `<circle cx="${x}" cy="${top + 4}" r="2"/>`;
    return airportDefs(ctx) + softEllipse(ctx, 0, y + 22, 100, 5, 'shadow', 0.4)
      + depth(ctx, 3, `<rect x="-98" y="${y + 2}" width="196" height="12" rx="4" fill="${A.rubber}"/><g fill="${A.steelDeep}">${rollers}</g>`
        + `<rect x="-100" y="${y - 2}" width="200" height="5" rx="2" fill="${ref(ctx, 'steelG')}"/>`
        + `<path d="M-90 ${y + 14}V${y + 40}M90 ${y + 14}V${y + 40}" stroke="${A.steelDeep}" stroke-width="5"/>`
        + `<path d="M-100 ${y - 1.2}H100" stroke="${C.cutRim}" stroke-width=".8" opacity=".55"/>`, `<rect x="-100" y="${y - 2}" width="200" height="16"/>`)
      + `<rect x="-42" y="${top}" width="84" height="7" rx="3" fill="${A.rubber}"/><g fill="${A.steelDeep}">${ret}</g>`;
  },
};

/**
 * 6-6's scanner (a `light`; 嗶！ wakes it): the X-ray machine's status lamps on the tunnel's front
 * and its monitor on an arm at the left; `off`, asleep — the lamps dark, the screen black with a
 * chalk 「zz」; `on`, awake — the lamps green, the monitor glowing the X-ray's blue with a bag's
 * outline on it, a beep's chalk ticks. Local origin at the hit centre (200, 430).
 */
const xrayScanner: PartSource = {
  preset: 'light',
  states: ['off', 'on'],
  box: { x: -96, y: -56, w: 150, h: 98 },
  draw(ctx, state) {
    const on = state === 'on';
    const scr = 'M-86 -44H-46V-14H-86Z';
    const monitor = `<path d="M-66 -14V20M-74 20H-58" stroke="${A.steelDeep}" stroke-width="3"/>`
      + depth(ctx, 3, `<rect x="-90" y="-48" width="48" height="38" rx="3" fill="${C.printDark}"/><path d="${scr}" fill="${on ? A.glassLight : A.runwayDeep}"/>`
        + (on ? `<path d="M-80 -22h28v-12a3 3 0 0 0 -3 -3h-22a3 3 0 0 0 -3 3z" fill="none" stroke="${C.chalk}" stroke-width="1.2" opacity=".85"/><path d="M-72 -37v-3h12v3" stroke="${C.chalk}" stroke-width="1.2" fill="none" opacity=".85"/><rect x="-62" y="-32" width="5" height="8" rx="1.4" fill="${A.wingGreen}" opacity=".8"/>` : ''),
      `<rect x="-90" y="-48" width="48" height="38"/>`)
      + (on ? softEllipse(ctx, -66, -29, 24, 18, 'lamp', 0.18) : `<text data-art-text="" x="-66" y="-24" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="9" fill="${C.chalk}" opacity=".6">zz</text>`);
    const lamps = [-20, -10, 0].map((x, i) => `<circle cx="${x}" cy="-18" r="2.6" fill="${on ? [C.doneGreen, C.doneGreen, A.taxiAmber][i] : A.xrayDeep}"/>`).join('');
    return airportDefs(ctx) + monitor + `<rect x="-26" y="-23" width="32" height="10" rx="3" fill="${A.xrayDeep}"/>` + lamps
      + (on ? softEllipse(ctx, -10, -18, 14, 6, 'lamp', 0.3) + `<g stroke="${C.chalk}" stroke-width="1.3" stroke-linecap="round" opacity=".9"><path d="M14 -30l5 -4M16 -22h6"/></g>` : '');
  },
};

/**
 * 6-6's date stamper (a `prop`, the 淘氣): the officer's self-inking date stamper on the counter —
 * a dark handle over a steel frame and its date wheels; `down`, thumped down with chalk 「碰！」 and a
 * fresh red date stamp beside it. Local origin at the hit centre (278, 328).
 */
const dateStamper: PartSource = {
  preset: 'prop',
  states: ['up', 'down'],
  box: { x: -32, y: -44, w: 66, h: 56 },
  draw(ctx, state) {
    const down = state === 'down';
    const lift = down ? 0 : -8;
    return airportDefs(ctx) + depth(ctx, 3, `<rect x="-11" y="-14" width="22" height="6" rx="1" fill="${A.steelDeep}"/>`
      + `<path d="M-9 -14V${-26 + lift}H9V-14" stroke="${A.steel}" stroke-width="2" fill="none"/>`
      + `<rect x="-6" y="${-30 + lift}" width="12" height="10" rx="2" fill="${A.tail}"/><ellipse cx="0" cy="${-32 + lift}" rx="7" ry="4" fill="${A.tailDeep}"/>`
      + `<rect x="-8" y="${-20 + lift}" width="16" height="6" rx="1" fill="${A.steelLight}"/><path d="M-6 ${-17 + lift}h12" stroke="${C.printDark}" stroke-width="1" stroke-dasharray="1.6 1"/>`, `<rect x="-11" y="${-36 + lift}" width="22" height="28"/>`)
      + (down ? `<rect x="14" y="-12" width="14" height="5" rx="1" fill="none" stroke="${C.seal}" stroke-width="1"/><text data-art-text="" x="21" y="-8.4" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="4" fill="${C.seal}">10.21</text>`
        + `<g stroke="${C.chalk}" stroke-width="1.3" stroke-linecap="round" opacity=".9"><path d="M-16 -30l-5 -4M-18 -22h-6M16 -30l5 -4"/></g>`
        + `<text data-art-text="" x="-30" y="-36" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.chalk}">碰！</text>` : '');
  },
};

/**
 * 6-6's 印章 as Mocha knocks it off the counter (a pushable, C3), local origin at its hit centre.
 * While it stands on the counter (`onPerch`) and once it has landed the goal draws the treasure
 * there (`treasureOnPage`), so this draws only a faint ink ring under it; `falling`, it is the
 * 印章 tumbling — a turned wooden handle over a red seal base, its plane mark in white.
 */
const stamp: PartSource = {
  preset: 'pushable',
  states: ['onPerch', 'falling', 'landed'],
  box: { x: -24, y: -28, w: 48, h: 56 },
  draw(ctx: KitCtx, state) {
    if (state !== 'falling') return `<ellipse cx="0" cy="14" rx="10" ry="2.6" fill="${C.sealDark}" opacity=".25"/>`;
    return `<g transform="rotate(28)">` + depth(ctx, 2, `<rect x="-10" y="2" width="20" height="11" rx="2" fill="${C.seal}"/>`
      + `<path d="M-8 13h16" stroke="${C.sealDark}" stroke-width="1.6"/>` + planeGlyph(0, 7.6, 0.18, C.cutRim)
      + `<path d="M-4 2V-8Q-4 -14 0 -14Q4 -14 4 -8V2Z" fill="${C.wood}"/><circle cx="0" cy="-16" r="5" fill="${C.woodDeep}"/><path d="M-2 -18q2 -2 4 -1" stroke="${C.cutRim}" stroke-width=".8" fill="none" opacity=".6"/>`,
    `<path d="M-10 2H10V13H-10ZM-5 2V-21H5V2Z"/>`) + `</g>`
      + `<g stroke="${C.chalk}" stroke-width="1.2" stroke-linecap="round" opacity=".8"><path d="M-16 -10l-4 -3M-18 -2h-5"/></g>` + sparkle(ctx, 14, -14, 3.6);
  },
};

// The cabin-crew 姊姊 (6-1's carrier)

/** 6-1's cabin-crew 姊姊 (a carrier, baked per look, D-85): `idle` dozing by the doors; `carrying`, `back`, `done`. Feet at the origin. */
const sleepyCrew: PartSource = {
  preset: 'carrier',
  states: ['idle', 'carrying', 'back', 'done'],
  box: { x: -72, y: -190, w: 150, h: 196 },
  draw: (ctx, look) => crewArt(ctx, look as 'idle'),
};

export const C6_PARTS: Readonly<Record<string, PartSource>> = {
  'c6/front-window': frontWindow,
  'c6/track-switch': trackSwitch,
  'c6/sleepy-crew': sleepyCrew,
  'c6/carousel-belt': carouselBelt,
  'c6/start-button': startButton,
  'c6/carousel-beacon': carouselBeacon,
  'c6/deck-gate': deckGate,
  'c6/plane-lights': planeLights,
  'c6/bridge-extend': bridgeExtend,
  'c6/bridge-wheels': bridgeWheels,
  'c6/bridge-plank': bridgePlank,
  'c6/searchlight': searchlight,
  'c6/runway-lights': runwayLights,
  'c6/tower-radio': towerRadio,
  'c6/xray-belt': xrayBelt,
  'c6/xray-scanner': xrayScanner,
  'c6/date-stamper': dateStamper,
  'c6/stamp': stamp,
};
