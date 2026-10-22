import { POPUP as C, POPUP_101 as T, POPUP_AIRPORT as A, POPUP_BEITOU as BT, POPUP_CAMPUS as K, POPUP_MAOKONG as G, POPUP_MARKET as M, POPUP_NEON as N, POPUP_PARK as P, POPUP_STATION as S, POPUP_TAMSUI as W, POPUP_VIGNETTE as V } from '../../../art/palette';
import { f1, seeded, sparkle, standeeFilter, type KitCtx } from '../../art';
import { chapterSky } from '../../view/art/placeholders';
import { envGrade, gradeSvg, keepColours } from '../grade';
import type { EnvBox } from '../manifest';
import { t101Defs, tower101, xinyiSkyline } from './c10';
import { calmMoon } from './common';
import type { ScreenSource } from './screens';

/**
 * The chapters' landmark vignettes (#193; GDD § 2.13, bible § 6, § 7): one small drawing of each
 * chapter's landmark (the prologue's is 家), baked twice by `npm run bake:popup` as screen art:
 *
 * - **On the chapter card** (`vignette-card-<N>`): the landmark as a die-cut pop-up standing
 *   behind the departure card, rising over its top edge between the strings — the card's text,
 *   sizes and contrast are untouched (it is behind the paper).
 * - **On the 目錄** (`vignette-map-<N>`): the same drawing in a round medallion with the chapter's
 *   night sky, the station's button on the map.
 *
 * Each landmark is drawn in a 150 × 70 space (CSS px), standing on y = 66, centred on x = 75, in
 * the chapter kit's colours (graded like the chapter's backdrops; chapter 10's kit is in screen
 * colours), with a `focus` circle the medallion frames. No lettering.
 */

/** The cut-out's box (CSS px at board scale 1) and where it stands: its foot hides 6 px behind the card's top edge. */
export const VIGNETTE_CARD: EnvBox = { x: 0, y: 0, w: 150, h: 76 };
/** The medallion's box (CSS px): a 23 px radius disc, the 目錄 draws its ring live. */
export const VIGNETTE_MAP: EnvBox = { x: 0, y: 0, w: 48, h: 48 };
const GROUND = 66;

interface Landmark {
  /** The landmark, standing on y = 66 in the 150 × 70 space */
  readonly draw: (ctx: KitCtx) => string;
  /** What the medallion frames: a circle (cx, cy, r) in the same space */
  readonly focus: readonly [number, number, number];
  /** The kit is authored in screen colours (chapter 10): no grade */
  readonly screen?: boolean;
}

const lin = (id: string, stops: readonly (readonly [number, string])[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

/** A lit window: a warm pane with a bright core (lamp light is never graded: bible § 3.3). */
const pane = (x: number, y: number, w: number, h: number, on = true) =>
  `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${on ? C.windowMid : V.paneDark}"/>`
  + (on ? `<rect x="${f1(x + w * 0.18)}" y="${f1(y + h * 0.2)}" width="${f1(w * 0.3)}" height="${f1(h * 0.6)}" fill="${C.lampHot}" opacity=".55"/>` : '');

/** A paper flat's cut edge: a lit rim on the top-left, a shade on the right. */
const rim = (d: string) => `<path d="${d}" fill="none" stroke="${C.cutRim}" stroke-width=".9" opacity=".55"/>`;

/**
 * What floats rather than stands (cables, steam, mist, fireflies, bulbs on a wire): drawn over the
 * card's die-cut, never inside its border (a dilated border turns a cable fan into a solid blob).
 */
const air = (inner: string) => `<g data-air="">${inner}</g>`;
const AIR = /<g data-air="">((?:(?!<\/?g[ >]).)*?)<\/g>/gs;

// ——— The landmarks ———

/** 序 · 家: two old 公寓 walk-ups side by side, tiled, iron window grilles, one window lit (his), a water tank on the roof. */
function home(ctx: KitCtx): string {
  const id = ctx.id('vHomeWall');
  let out = `<defs>${lin(id, [[0, V.homeTile], [1, V.homeTileDeep]])}</defs>`;
  const block = (x: number, w: number, top: number, lit: readonly number[]) => {
    let s = `<path d="M${x} ${GROUND}V${top}H${x + w}V${GROUND}Z" fill="url(#${id})"/>`;
    // Tiles: faint horizontal courses
    for (let y = top + 4; y < GROUND; y += 4) s += `<path d="M${x} ${y}H${x + w}" stroke="${V.homeTileDeep}" stroke-width=".4" opacity=".6"/>`;
    // A parapet, then storeys of windows behind grilles
    s += `<rect x="${x - 1}" y="${top - 2}" width="${w + 2}" height="3" fill="${V.homeTileDeep}"/>`;
    const cols = Math.floor((w - 6) / 14);
    let k = 0;
    for (let y = top + 6; y + 9 < GROUND - 2; y += 13) {
      for (let c = 0; c < cols; c++) {
        const wx = x + 5 + c * ((w - 10) / cols) + 1;
        const ww = (w - 10) / cols - 3;
        s += pane(wx, y, ww, 8, lit.includes(k));
        s += `<path d="M${f1(wx - 1)} ${y - 1}h${f1(ww + 2)}v10h${f1(-ww - 2)}z${[1, 2, 3].map((i) => `M${f1(wx + (ww * i) / 4)} ${y - 1}v10`).join('')}" fill="none" stroke="${V.grille}" stroke-width=".7"/>`;
        k++;
      }
    }
    return s + rim(`M${x} ${GROUND}V${top}H${x + w}`);
  };
  out += block(26, 52, 20, [4]) + block(76, 48, 28, [1, 6]);
  // The rooftop water tank on its stand, an antenna
  out += `<path d="M38 20v-6M50 20v-6" stroke="${V.grille}" stroke-width="1"/><rect x="34" y="6" width="20" height="9" rx="2" fill="${V.tank}"/><path d="M34 9h20" stroke="${V.tankDeep}" stroke-width=".8"/>`
    + `<path d="M104 28V12M98 15h12M100 19h8" stroke="${V.grille}" stroke-width=".8"/>`
    // A potted plant on his window's sill
    + `<path d="M55 58h8v3h-8z" fill="${V.pot}"/><circle cx="57" cy="56" r="2.4" fill="${V.leaf}"/><circle cx="61" cy="55.4" r="2.6" fill="${V.leaf}"/>`;
  return out;
}

/** 1 · 台北車站: the station's 重簷 two-tier roof with its gold ridge on a sandstone hall, a row of lit windows. */
function station(ctx: KitCtx): string {
  const id = ctx.id('vStation');
  let out = `<defs>${lin(id, [[0, S.sandLight], [1, S.sandShade]])}</defs>`;
  // The hall: a long sandstone block, a darker base, a row of tall lit windows
  out += `<path d="M14 ${GROUND}V40H136V${GROUND}Z" fill="url(#${id})"/><rect x="14" y="60" width="122" height="6" fill="${S.sandDeep}"/>`;
  for (let i = 0; i < 9; i++) out += pane(20 + i * 13, 44, 7, 13);
  // The lower roof (the wide eave), the upper hall and its own roof, the gold ridges
  const roof = (x0: number, x1: number, y: number, h: number) => `<path d="M${x0 - 6} ${y + h}Q${(x0 + x1) / 2} ${y + h - 3} ${x1 + 6} ${y + h}L${x1 - 4} ${y}H${x0 + 4}Z" fill="${S.navy}"/>`
    + `<path d="M${x0 - 6} ${y + h}Q${(x0 + x1) / 2} ${y + h - 3} ${x1 + 6} ${y + h}" stroke="${S.navyLight}" stroke-width="1.2" fill="none"/>`
    + `<path d="M${x0 + 4} ${y}H${x1 - 4}" stroke="${C.gold}" stroke-width="1.6"/>`;
  out += roof(16, 134, 31, 9);
  out += `<path d="M46 31V20H104V31Z" fill="url(#${id})"/>`;
  for (let i = 0; i < 5; i++) out += pane(52 + i * 10, 23, 5, 6);
  out += roof(48, 102, 10, 10);
  // The ridge's gold finials
  out += `<circle cx="52" cy="10" r="1.6" fill="${C.gold}"/><circle cx="98" cy="10" r="1.6" fill="${C.gold}"/>`;
  return out + rim('M14 66V40H136');
}

/** 2 · 大安森林公園: the open-air amphitheatre's white shell (a V-fold quarter dome) among the park's dark crowns. */
function park(ctx: KitCtx): string {
  const id = ctx.id('vShell');
  let out = `<defs>${lin(id, [[0, P.shell], [1, P.shellShade]], false)}</defs>`;
  const crown = (x: number, y: number, r: number, col: string) => `<path d="M${f1(x - r)} ${f1(y + r * 0.4)}q${f1(-r * 0.2)} ${f1(-r)} ${f1(r * 0.6)} ${f1(-r * 1.1)}q${f1(r * 0.5)} ${f1(-r * 0.5)} ${f1(r)} 0q${f1(r * 0.9)} ${f1(0.1 * r)} ${f1(r * 0.6)} ${f1(r * 1.1)}q${f1(-r * 0.3)} ${f1(r * 0.6)} ${f1(-r * 1.2)} ${f1(r * 0.5)}z" fill="${col}"/>`;
  out += crown(26, 42, 14, P.canopyDeep) + crown(124, 40, 15, P.canopyDeep) + crown(38, 52, 12, P.canopyMid) + crown(114, 52, 13, P.canopyMid);
  // The shell: two V-fold faces meeting along its crease, the stage under it
  out += `<path d="M42 ${GROUND - 4}Q44 16 92 12Q72 34 70 ${GROUND - 4}Z" fill="${P.shell}"/>`
    + `<path d="M70 ${GROUND - 4}Q72 34 92 12Q112 30 110 ${GROUND - 4}Z" fill="url(#${id})"/>`
    + `<path d="M70 ${GROUND - 4}Q72 34 92 12" stroke="${P.shellDeep}" stroke-width="1.1" fill="none"/>`
    + `<path d="M50 ${GROUND - 6}Q52 26 88 16" stroke="${P.shellShade}" stroke-width=".7" fill="none" opacity=".6"/>`
    + rim(`M42 ${GROUND - 4}Q44 16 92 12`);
  out += `<path d="M36 ${GROUND}V${GROUND - 5}H116V${GROUND}Z" fill="${P.stage}"/><path d="M36 ${GROUND - 5}H116" stroke="${P.stageLight}" stroke-width="1"/>`;
  // Fireflies (the chapter's lime pinholes)
  let flies = '';
  for (const [x, y] of [[24, 24], [126, 20], [56, 30], [140, 52]] as const) flies += `<circle cx="${x}" cy="${y}" r="1.4" fill="${P.firefly}"/><circle cx="${x}" cy="${y}" r=".6" fill="${P.fireflyCore}"/>`;
  return out + air(flies);
}

/** 3 · 台灣大學: the 傅鐘 — a small stone tower with its bell in an open belfry — between two royal palms. */
function campus(ctx: KitCtx): string {
  const id = ctx.id('vBell');
  let out = `<defs>${lin(id, [[0, K.stone], [1, K.stoneShade]], false)}</defs>`;
  const palm = (x: number, h: number, lean: number) => {
    let s = `<path d="M${x - 2} ${GROUND}L${x + lean - 1.2} ${GROUND - h}H${x + lean + 1.2}L${x + 2} ${GROUND}Z" fill="${K.palmTrunk}"/>`;
    s += `<rect x="${f1(x + lean - 1.8)}" y="${GROUND - h - 6}" width="3.6" height="7" fill="${K.crownshaft}"/>`;
    for (let i = 0; i < 7; i++) {
      const a = -160 + i * 25;
      const r = (a * Math.PI) / 180;
      const tx = x + lean + Math.cos(r) * 15;
      const ty = GROUND - h - 6 + Math.sin(r) * 9 + 6;
      s += `<path d="M${f1(x + lean)} ${GROUND - h - 6}Q${f1((x + lean + tx) / 2)} ${f1(ty - 7)} ${f1(tx)} ${f1(ty)}" stroke="${i % 2 ? K.palm : K.palmLit}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    }
    return s;
  };
  out += palm(26, 46, -3) + palm(124, 50, 3);
  // The tower: plinth, shaft, the open belfry with its bronze bell, a pyramid roof
  out += `<path d="M62 ${GROUND}V60H88V${GROUND}Z" fill="${K.stoneDeep}"/>`
    + `<path d="M66 60V30H84V60Z" fill="url(#${id})"/>`
    + `<path d="M64 30V14H86V30Z" fill="${K.stone}"/><path d="M68 28V17H82V28Z" fill="${V.belfry}"/>`
    + `<path d="M71 24q0 -6 4 -6t4 6z" fill="${K.bronze}"/><path d="M71 24h8" stroke="${K.bronzeDeep}" stroke-width="1"/><circle cx="75" cy="25" r="1" fill="${K.bronzeDeep}"/>`
    + `<path d="M62 14L75 3L88 14Z" fill="${K.roof}"/><path d="M75 3L88 14" stroke="${K.roofLight}" stroke-width=".8"/>`
    + `<path d="M70 40h10v8h-10z" fill="${K.stoneShade}"/><circle cx="75" cy="44" r="3" fill="${C.page}" stroke="${K.stoneDeep}" stroke-width=".6"/>`
    + rim('M66 60V30M64 30V14H86');
  return out;
}

/** 4 · 西門町: 紅樓, the octagonal brick house — three lit arched doorways, the drum and lantern over it — and a neon sign beside it. */
function ximen(ctx: KitCtx): string {
  const id = ctx.id('vBrick');
  let out = `<defs>${lin(id, [[0, N.brickLight], [0.5, N.brick], [1, N.brickDeep]], false)}</defs>`;
  // The octagon's three visible faces (the side ones foreshortened)
  out += `<path d="M38 ${GROUND}V30L52 24V${GROUND}Z" fill="${N.brickDeep}"/><path d="M98 ${GROUND}V24L112 30V${GROUND}Z" fill="${N.brickDeep}"/>`
    + `<path d="M52 ${GROUND}V24H98V${GROUND}Z" fill="url(#${id})"/>`;
  for (let y = 28; y < GROUND; y += 3.4) out += `<path d="M38 ${f1(y)}H112" stroke="${N.mortar}" stroke-width=".35" opacity=".5"/>`;
  // Three arched doorways, lit
  for (const x of [58, 70, 82]) out += `<path d="M${x} ${GROUND}V50q5 -7 10 0V${GROUND}Z" fill="${C.windowMid}"/><path d="M${x + 2} ${GROUND}V52q3 -4 6 0V${GROUND}Z" fill="${C.lampHot}" opacity=".5"/>`;
  // The cornice, the drum storey, the lantern
  out += `<rect x="36" y="22" width="78" height="3" fill="${N.trim}"/><path d="M58 22V12H92V22Z" fill="${N.brick}"/>`
    + `<rect x="62" y="14" width="5" height="6" fill="${C.windowMid}"/><rect x="72" y="14" width="6" height="6" fill="${C.windowMid}"/><rect x="83" y="14" width="5" height="6" fill="${C.windowMid}"/>`
    + `<path d="M56 12L75 4L94 12Z" fill="${N.roof}"/><path d="M71 4V0H79V4Z" fill="${N.roofLight}"/>`;
  // The neon sign: a vertical board, a pink tube round it, cyan lines
  out += `<rect x="122" y="14" width="12" height="40" rx="1.5" fill="${N.plumDeep}"/>`
    + `<rect x="122" y="14" width="12" height="40" rx="1.5" fill="none" stroke="${C.neonPink}" stroke-width="1.6"/>`
    + `<path d="M125 22h6M125 30h6M125 38h6M125 46h6" stroke="${C.neonCyan}" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M128 54V${GROUND}" stroke="${N.chrome}" stroke-width="1.2"/>`;
  return out + rim(`M52 ${GROUND}V24H98`);
}

/** 5 · 士林夜市: a row of stalls under vermilion-and-cream awnings, a sagging string of bulbs, a red lantern and steam. */
function market(_ctx: KitCtx): string {
  let out = '';
  // Stall backs (tin), counters
  out += `<path d="M10 ${GROUND}V32H140V${GROUND}Z" fill="${M.tinDeep}"/>`;
  for (let i = 0; i < 3; i++) {
    const x = 12 + i * 43;
    out += pane(x + 4, 40, 34, 10) + `<rect x="${x}" y="52" width="42" height="${GROUND - 52}" fill="${M.wood}"/><path d="M${x} 52h42" stroke="${M.woodLight}" stroke-width="1"/>`;
  }
  // The awnings: stripes with a scalloped edge
  for (let i = 0; i < 3; i++) {
    const x0 = 10 + i * 43;
    let stripes = '';
    for (let s = 0; s < 6; s++) stripes += `<path d="M${f1(x0 + s * 7.3)} 26h3.65l-1 10h-3.65z" fill="${s % 2 ? M.awningCream : M.vermilion}"/>`;
    stripes += `<path d="M${x0 - 2} 26h48" stroke="${M.vermilionDeep}" stroke-width="1.6"/>`;
    let scal = `M${x0} 36`;
    for (let s = 0; s < 6; s++) scal += `q3.6 4 7.3 0`;
    stripes += `<path d="${scal}" fill="none" stroke="${M.vermilionDeep}" stroke-width="1.4"/>`;
    out += stripes;
  }
  // A string of bulbs across the top, a lantern, steam off the middle stall
  let bulbs = `<path d="M6 12Q75 26 144 10" stroke="${C.printDark}" stroke-width=".8" fill="none"/>`;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const x = 6 + 138 * t;
    const y = (1 - t) * (1 - t) * 12 + 2 * (1 - t) * t * 26 + t * t * 10 + 2;
    bulbs += `<circle cx="${f1(x)}" cy="${f1(y)}" r="2.2" fill="${C.lampAmber}" opacity=".55"/><circle cx="${f1(x)}" cy="${f1(y)}" r="1.1" fill="${C.lampHot}"/>`;
  }
  out += air(bulbs);
  out += `<path d="M30 18v4" stroke="${C.printDark}" stroke-width=".8"/><ellipse cx="30" cy="27" rx="5" ry="5.6" fill="${C.ribbon}"/><path d="M27 22h6M27 32h6" stroke="${C.gold}" stroke-width="1"/>`;
  out += air(`<path d="M76 24q-6 -6 0 -11t0 -10M84 25q6 -7 0 -12" stroke="${S.steam}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`);
  return out + rim(`M10 ${GROUND}V32H140`);
}

/** 6 · 松山機場: the control tower's lit glass drum over the low terminal, an origami jet climbing past. */
function airport(ctx: KitCtx): string {
  const id = ctx.id('vTower');
  let out = `<defs>${lin(id, [[0, A.whiteShade], [0.5, A.white], [1, A.whiteDeep]], false)}</defs>`;
  // The terminal: a long low block with a glass front
  out += `<path d="M8 ${GROUND}V50H142V${GROUND}Z" fill="${A.whiteShade}"/><rect x="12" y="53" width="126" height="8" fill="${A.glass}"/>`;
  for (let i = 0; i < 12; i++) out += pane(14 + i * 10.4, 54.5, 5, 5, i % 3 !== 1);
  // The tower: a shaft, the drum's balcony, the glass cab, its cap and mast
  out += `<path d="M102 50V20H112V50Z" fill="url(#${id})"/><rect x="96" y="17" width="22" height="3" fill="${A.steel}"/>`
    + `<path d="M98 17L96 8H118L116 17Z" fill="${A.towerGlass}"/><path d="M99 15L98 10H116L115 15Z" fill="${A.towerGlassLight}" opacity=".7"/>`
    + `<path d="M95 8h24v-2.4h-24z" fill="${A.steelDeep}"/><path d="M107 5.6V0" stroke="${A.steelDeep}" stroke-width="1"/><circle cx="107" cy="0.8" r="1.2" fill="${A.wingRed}"/>`;
  // The origami jet: three facets and a crease, climbing left to right
  out += `<g transform="translate(46 26) rotate(-14)"><path d="M-26 0L16 -3L24 0L16 3Z" fill="${A.fuselage}"/><path d="M-26 0L16 -3L24 0Z" fill="${A.fuselageShade}" opacity=".5"/>`
    + `<path d="M-2 -1L-12 -13L-6 -13L8 -1Z" fill="${A.fuselageDeep}"/><path d="M-2 1L-14 12L-7 12L8 1Z" fill="${A.fuselageShade}"/>`
    + `<path d="M-22 -1L-27 -9L-23 -9L-16 -1Z" fill="${A.tail}"/><circle cx="-12" cy="12" r="1.2" fill="${A.wingRed}"/></g>`;
  return out + rim('M102 50V20M96 17h22');
}

/** 7 · 貓空: a gondola cabin on its cable over the stepped tea terraces, the big moon's light on it. */
function maokong(_ctx: KitCtx): string {
  let out = '';
  // The hill: stepped terraces, rows of tea on each
  const steps = [[0, 50], [24, 46], [48, 42], [74, 46], [100, 50], [124, 54], [150, 56]] as const;
  let hill = `M0 ${GROUND}`;
  for (const [x, y] of steps) hill += `L${x} ${y}`;
  out += `<path d="${hill}L150 ${GROUND}Z" fill="${G.hill}"/>`;
  for (let i = 0; i < steps.length - 1; i++) {
    const [x0, y0] = steps[i];
    const [x1] = steps[i + 1];
    for (let k = 0; k < 3; k++) out += `<path d="M${x0 + 2} ${y0 + 3 + k * 4}h${x1 - x0 - 4}" stroke="${k % 2 ? G.teaLight : G.tea}" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  // The cable and its pylon, the cabin hanging from it
  out += air(`<path d="M0 6L150 26" stroke="${G.cable}" stroke-width="1"/><path d="M0 10L150 30" stroke="${G.cable}" stroke-width=".6" opacity=".7"/>`)
    + `<path d="M132 ${GROUND - 10}L136 24H140L144 ${GROUND - 10}Z" fill="${G.steel}"/><path d="M134 28h8" stroke="${G.steelDeep}" stroke-width="1.2"/>`;
  const cx = 72;
  const cy = 6 + (20 * cx) / 150;
  out += `<path d="M${cx} ${f1(cy)}V${f1(cy + 8)}" stroke="${G.steelDeep}" stroke-width="1.2"/>`
    + `<rect x="${cx - 12}" y="${f1(cy + 8)}" width="24" height="20" rx="5" fill="${G.cabin}"/>`
    + `<rect x="${cx - 9}" y="${f1(cy + 11)}" width="18" height="9" rx="2" fill="${G.gondolaAmber}"/>`
    + `<rect x="${cx - 12}" y="${f1(cy + 22)}" width="24" height="3" fill="${G.cabinBand}"/>`
    + `<path d="M${cx - 10} ${f1(cy + 9)}h20" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`;
  // A wisp of mist across the slope
  out += air(`<path d="M10 52q30 -6 60 -1t70 -2" stroke="${G.mist}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>`);
  return out;
}

/** 8 · 北投: the library's green V-fold roof over its wooden body and balcony, steam rising off the springs beside it. */
function beitou(ctx: KitCtx): string {
  const id = ctx.id('vCedar');
  let out = `<defs>${lin(id, [[0, BT.cedarLight], [1, BT.cedarDeep]])}</defs>`;
  // Steam behind, on the left
  out += air([[22, 46, 9], [16, 34, 8], [26, 24, 7], [20, 14, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${BT.steam}" opacity=".4"/>`).join(''));
  // The body: slatted wood, a balcony rail, lit windows
  out += `<path d="M42 ${GROUND}V32H132V${GROUND}Z" fill="url(#${id})"/>`;
  for (let x = 44; x < 132; x += 4) out += `<path d="M${x} 32V${GROUND}" stroke="${BT.cedarDeep}" stroke-width=".5" opacity=".6"/>`;
  for (let i = 0; i < 6; i++) out += pane(48 + i * 14, 38, 9, 9);
  out += `<rect x="40" y="50" width="94" height="2.4" fill="${BT.hinoki}"/>`;
  for (let x = 42; x < 134; x += 5) out += `<path d="M${x} 52v6" stroke="${BT.hinokiDeep}" stroke-width=".9"/>`;
  out += `<rect x="40" y="58" width="94" height="2" fill="${BT.hinoki}"/>`;
  // The roof: a shallow V (two faces meeting over the middle), green, its eave lit
  out += `<path d="M30 32L88 24L144 32L138 35H36Z" fill="${BT.roofGreen}"/><path d="M88 24L144 32L138 35H88Z" fill="${BT.roofGreenDeep}"/>`
    + `<path d="M30 32L88 24L144 32" stroke="${BT.leafLight}" stroke-width="1" fill="none"/>`;
  // A tree to the right
  out += `<circle cx="142" cy="44" r="9" fill="${BT.leafDeep}"/><circle cx="138" cy="40" r="6" fill="${BT.leaf}"/>`;
  return out + rim(`M42 ${GROUND}V32`);
}

/** 9 · 淡水: 淡江大橋 — one tall pylon, its cables fanned in one plane to the long deck — over the river at first light. */
function tamsui(ctx: KitCtx): string {
  const id = ctx.id('vPylon');
  let out = `<defs>${lin(id, [[0, W.pylonShade], [0.55, W.pylon], [1, W.pylonPeach]], false)}</defs>`;
  const px = 102;
  const deck = 52;
  // The cables: asymmetric fans (the long span to 八里 on the left)
  let cables = '';
  for (let i = 0; i < 9; i++) cables += `M${px} ${f1(8 + i * 2.6)}L${f1(px - 14 - i * 10.4)} ${deck}`;
  for (let i = 0; i < 5; i++) cables += `M${px} ${f1(10 + i * 3.4)}L${f1(px + 9 + i * 8)} ${deck}`;
  out += air(`<path d="${cables}" stroke="${W.cable}" stroke-width=".55" fill="none"/>`);
  // The deck, the water under it, the pylon (a tapering single tower)
  out += `<rect x="0" y="${deck}" width="150" height="4" fill="${W.deck}"/><path d="M0 ${deck + 4}H150" stroke="${W.deckDeep}" stroke-width="1"/>`
    + `<path d="M0 ${GROUND}V${deck + 6}H150V${GROUND}Z" fill="${W.sea}"/><path d="M8 ${deck + 9}h30M60 ${deck + 11}h40M112 ${deck + 9}h26" stroke="${W.seaLit}" stroke-width="1" opacity=".7"/>`
    + `<path d="M${px - 4} ${GROUND}L${px - 1.6} 4H${px + 1.6}L${px + 4} ${GROUND}Z" fill="url(#${id})"/>`
    + `<path d="M${px + 1.6} 4L${px + 4} ${GROUND}" stroke="${W.peachLight}" stroke-width=".8"/>`;
  return out;
}

/** 10 · 台北101: the tower true to its form (`tower101`), a vellum cloud wrapped round its middle. */
function taipei101(ctx: KitCtx): string {
  return t101Defs(ctx) + xinyiSkyline(ctx, 26, 124, GROUND, 24, 193, { lit: 0.25 })
    + tower101(ctx, { cx: 75, ground: GROUND, tip: 1, z: 2 })
    + air(`<path d="M44 46q10 -6 22 -2t22 0t20 2" stroke="${T.cloud}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`);
}

const LANDMARKS: Readonly<Record<number, Landmark>> = {
  0: { draw: home, focus: [74, 36, 32] },
  1: { draw: station, focus: [75, 38, 34] },
  2: { draw: park, focus: [76, 42, 40] },
  3: { draw: campus, focus: [75, 32, 30] },
  4: { draw: ximen, focus: [82, 34, 33] },
  5: { draw: market, focus: [60, 36, 30] },
  6: { draw: airport, focus: [84, 34, 33] },
  7: { draw: maokong, focus: [80, 34, 32] },
  8: { draw: beitou, focus: [86, 40, 32] },
  9: { draw: tamsui, focus: [94, 34, 32] },
  10: { draw: taipei101, focus: [75, 34, 32], screen: true },
};

/** The chapters with a vignette (the prologue and the ten chapters of the night). */
export const VIGNETTE_CHAPTERS: readonly number[] = Object.keys(LANDMARKS).map(Number);

/** The landmark in its chapter's colours: graded like the chapter's backdrops (bible § 3.3), chapter 10's kit is screen colours already. */
function graded(ch: number, ctx: KitCtx): string {
  const l = LANDMARKS[ch];
  const svg = l.draw(ctx);
  return l.screen ? svg : gradeSvg(svg, envGrade(ch), keepColours(ch));
}

/**
 * The cut-out on the chapter card: the landmark die-cut out of the page's stock (the standee's
 * warm-white border, cut line and shadow, from the sprite bake's filter), standing on the box's foot.
 */
function cardVignette(ch: number) {
  return (ctx: KitCtx): string => {
    const fid = ctx.id('vStandee');
    const art = graded(ch, ctx);
    const floating = [...art.matchAll(AIR)].map((m) => m[1]).join('');
    return `<defs>${standeeFilter(fid, { bake: true })}</defs><g transform="translate(0 4)"><g filter="url(#${fid})">${art.replace(AIR, '')}</g>${floating}</g>`;
  };
}

/** The medallion on the 目錄: the chapter's night sky (a few stars, the moon) behind the landmark's focus, cut round. */
function mapVignette(ch: number) {
  return (ctx: KitCtx): string => {
    const sky = chapterSky(ch);
    const [fx, fy, fr] = LANDMARKS[ch].focus;
    const R = 23;
    const k = R / fr;
    const clip = ctx.id('vMedal');
    const grad = ctx.id('vMedalSky');
    const r = seeded(ch + 7);
    let stars = '';
    for (let i = 0; i < 6; i++) stars += `<circle cx="${f1(4 + r() * 40)}" cy="${f1(3 + r() * 16)}" r="${f1(0.5 + r() * 0.5)}" fill="${C.foilShine}" opacity="${f1(0.5 + r() * 0.4)}"/>`;
    return `<defs><clipPath id="${clip}"><circle cx="24" cy="24" r="${R}"/></clipPath>${lin(grad, [[0, sky.top], [1, sky.horizon]])}</defs>`
      + `<g clip-path="url(#${clip})"><rect width="48" height="48" fill="url(#${grad})"/>${stars}`
      + (ch === 10 ? '' : calmMoon(ctx, 38, 10, 4, { cloud: false, halo: 0.18 }))
      + `<g transform="translate(${f1(24 - fx * k)} ${f1(24 - fy * k)}) scale(${f1(k * 100) / 100})">${graded(ch, ctx)}</g>`
      // A soft lamp-lit floor so the foot never ends in a hard line
      + `<rect y="44" width="48" height="6" fill="${sky.top}" opacity=".35"/>`
      + sparkle(ctx, 9, 10, 2.2, 0.7)
      + `</g>`;
  };
}

/** The screen art for every vignette (`screens.ts` adds them to `SCREEN_ART`). */
export const VIGNETTE_ART: Readonly<Record<string, ScreenSource>> = Object.fromEntries(
  VIGNETTE_CHAPTERS.flatMap((ch) => [
    [`vignette-card-${ch}`, { box: VIGNETTE_CARD, draw: cardVignette(ch) }],
    [`vignette-map-${ch}`, { box: VIGNETTE_MAP, draw: mapVignette(ch) }],
  ]),
);
