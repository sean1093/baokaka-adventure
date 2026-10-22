import { POPUP as C, POPUP_101 as K, POPUP_AIRPORT as A, POPUP_BEITOU as B, POPUP_MARKET as M, POPUP_STATION as T, POPUP_TAMSUI as W, mixHex } from '../../../art/palette';
import { f1, pinholes, ref, seeded, skyline, softEllipse, type KitCtx } from '../../art';
import { chapterSky, stageDefs } from '../../view/art/placeholders';
import { ungradeSvg } from '../grade';
import type { EnvBox } from '../manifest';
import type { CutoutSource } from '../sources';
import type { WindowStripDef } from '../windowStrips';
import { stationDefs } from './c1';
import { t101Defs, xinyiSkyline } from './c10';
import { marketDefs } from './c5';
import { airportDefs } from './c6';
import { beitouDefs, steamPlume } from './c8';
import { dawnClouds, guanyin, mangroves, seaWater, tamsuiDefs } from './c9';

/**
 * The 月亮線 window strip (#193, D-104; bible § 6, the cars row: "the window shows the chapter's
 * skyline sliding by as a looping backdrop strip — the only scrolling backdrop"). For each page-1
 * car that is moving, two baked bitmaps (cut-outs, graded with the chapter):
 *
 * - **the strip** (`<backdrop>-strip`): what passes the windows, drawn as one period of a seamless
 *   loop (the tile is drawn at −P, 0 and +P and clipped to [0, P], so whatever overhangs one edge
 *   comes back in at the other);
 * - **the frame** (`<backdrop>-frame`): the backdrop over the window band with the windows cut out
 *   (the bake's white/black matte, `WINDOW_MATTE`), so the frames, the straps hanging across them
 *   and the glass's sheen stay in front of the strip.
 *
 * The page draws the strip behind the frame, sliding left by one period on a CSS transform loop
 * (`view/WindowStrip.tsx`). The backdrop keeps its own still view (the turn's leaves, the 目錄's page
 * cards). The cars standing at a platform (2-1, 3-1, 4-1) have no strip: they are stopped.
 */

/** One period of a car's view, x in [0, P] (it may overhang), y in page units. */
type Tile = (ctx: KitCtx, P: number, band: EnvBox) => string;

/** A periodic ridge over [0, P]: the sum of whole-period waves, so its ends meet. */
function ridge(P: number, base: number, amp: number, seed: number, waves = 3): string {
  const r = seeded(seed);
  const ks = Array.from({ length: waves }, (_, i) => ({ k: i + 1 + Math.floor(r() * 2), a: amp * (0.5 + r() * 0.5) / (i + 1), p: r() * Math.PI * 2 }));
  let d = `M0 ${base + 40}`;
  for (let x = 0; x <= P; x += 6) d += `L${f1(x)} ${f1(base - amp - ks.reduce((s, w) => s + w.a * Math.sin((2 * Math.PI * w.k * x) / P + w.p), 0))}`;
  return `${d}L${P} ${base + 40}Z`;
}

/** 1-1 (板南線 to 台北車站): the night city — towers with lit windows, streaks of street light, a tiny 101 once a period. */
function cityNight(ctx: KitCtx, P: number, band: EnvBox): string {
  const base = band.y + band.h - 10;
  const far = skyline(0, P, base - 10, 211, { minH: 20, maxH: 64, winP: 0.1, winOpacity: 0.5 });
  const near = skyline(0, P, base, 212, { minH: 12, maxH: 44, winP: 0.18, winOpacity: 0.75 });
  const r = seeded(213);
  let streaks = '';
  for (let i = 0; i < 9; i++) streaks += `M${f1(r() * P)} ${f1(base - 6 + r() * 10)}h${f1(14 + r() * 30)}`;
  const t101 = `<g transform="translate(${f1(P * 0.62)} ${base - 8})"><path d="M-5 0V-50L-3.5 -52V-62H-2.5V-72H2.5V-62H3.5V-52L5 -50V0Z" fill="${mixHex(T.navyDeep, C.shadow, 0.35)}"/>`
    + `<path d="${Array.from({ length: 6 }, (_, i) => `M-6 ${-12 - i * 6.5}H6`).join('')}" stroke="${C.neonCyan}" stroke-width=".6" opacity=".45"/></g>`;
  return stationDefs(ctx) + stageDefs(ctx, chapterSky(1), { all: true })
    + `<rect x="0" y="${band.y}" width="${P}" height="${band.h}" fill="${ref(ctx, 'sky')}"/>` + pinholes(ctx, 0, band.y, P, 46, Math.round(P / 9), 214)
    + `<path d="${far.d}" fill="${mixHex(T.navy, C.shadow, 0.45)}"/>${far.windows}` + t101
    + `<path d="${near.d}" fill="${mixHex(T.navyDeep, C.shadow, 0.2)}"/>${near.windows}`
    + `<path d="${streaks}" stroke="${C.lamp}" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>`;
}

/** 5-1 (淡水信義線 in the tunnel before 劍潭): black walls, cable runs, the tunnel's lamps streaking past. */
function tunnel(ctx: KitCtx, P: number, band: EnvBox): string {
  const { y, h } = band;
  const r = seeded(511);
  let lamps = '';
  for (let i = 0; i < 4; i++) {
    const x = (i + 0.2 + r() * 0.5) * (P / 4);
    const ly = y + h * (0.22 + r() * 0.5);
    lamps += softEllipse(ctx, x, ly, 26, 7, 'lamp', 0.35, 'blur8')
      + `<path d="M${f1(x - 30)} ${f1(ly)}h${f1(60 + r() * 30)}" stroke="${C.lampAmber}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`
      + `<path d="M${f1(x - 44)} ${f1(ly)}h${f1(20)}" stroke="${C.lampAmber}" stroke-width="1.2" stroke-linecap="round" opacity=".35"/>`;
  }
  let ribs = '';
  for (let x = 12; x < P; x += 40) ribs += `M${x} ${y}v${h}`;
  return marketDefs(ctx)
    + `<rect x="0" y="${y}" width="${P}" height="${h}" fill="${M.tunnel}"/>`
    + `<path d="${ribs}" stroke="${M.carDarkDeep}" stroke-width="5" opacity=".7"/>`
    + `<path d="M0 ${f1(y + h * 0.32)}H${P}M0 ${f1(y + h * 0.38)}H${P}M0 ${f1(y + h * 0.82)}H${P}" stroke="${M.carDarkDeep}" stroke-width="2"/>`
    + lamps;
}

/** 6-1's side window (文湖線, high over the city): the lights from above, the airport's apron edge. */
function overCity(ctx: KitCtx, P: number, band: EnvBox): string {
  const city = skyline(0, P, band.y + 76, 611, { minH: 14, maxH: 44, winP: 0.4, winOpacity: 0.9 });
  return airportDefs(ctx) + stageDefs(ctx, chapterSky(6), { all: true })
    + `<rect x="0" y="${band.y}" width="${P}" height="${band.h}" fill="${ref(ctx, 'sky')}"/>` + pinholes(ctx, 0, band.y, P, 30, Math.round(P / 14), 612)
    + `<path d="${city.d}" fill="${mixHex(A.runwayDeep, C.shadow, 0.3)}"/>` + city.windows
    + `<rect x="0" y="${band.y + 76}" width="${P}" height="${band.h - 76}" fill="${mixHex(A.tarmacDeep, C.shadow, 0.3)}"/>`
    + `<path d="M0 ${band.y + 88}h${P}" stroke="${C.lampAmber}" stroke-width="2" stroke-dasharray="10 5" opacity=".7"/><path d="M0 ${band.y + 96}h${P}" stroke="${A.wingRed}" stroke-width="1.6" stroke-dasharray="6 8" opacity=".6"/>`;
}

/** 8-1 (新北投支線): the 北投 hills in three layers, steam rising off the valley, the park's lamps. */
function beitouView(ctx: KitCtx, P: number, band: EnvBox): string {
  const foot = band.y + band.h;
  let lamps = '';
  for (const x of [P * 0.1, P * 0.38, P * 0.66, P * 0.88]) lamps += softEllipse(ctx, x, foot - 34, 8, 8, 'lamp', 0.4) + `<circle cx="${f1(x)}" cy="${foot - 34}" r="2" fill="${C.lamp}"/><path d="M${f1(x)} ${foot - 32}V${foot - 10}" stroke="${B.hillNear}" stroke-width="1.6"/>`;
  return beitouDefs(ctx) + stageDefs(ctx, chapterSky(8), { all: true })
    + `<rect x="0" y="${band.y}" width="${P}" height="${band.h}" fill="${ref(ctx, 'sky')}"/>` + pinholes(ctx, 0, band.y, P, 50, Math.round(P / 18), 811)
    + `<path d="${ridge(P, foot - 64, 18, 812)}" fill="${B.hillFar}"/>`
    + steamPlume(ctx, P * 0.24, foot - 18, 70, 34, 813, { o: 0.5, lean: 12 })
    + `<path d="${ridge(P, foot - 44, 14, 814)}" fill="${B.hill}"/>`
    + steamPlume(ctx, P * 0.72, foot - 14, 60, 30, 815, { o: 0.45, lean: 10 })
    + `<path d="${ridge(P, foot - 22, 10, 816, 4)}" fill="${B.hillNear}"/>` + lamps;
}

/** 9-1 (往淡水, at dawn): 觀音山 across the 淡水河, the river's glassine water, the mangroves on the bank. */
function riverDawn(ctx: KitCtx, P: number, band: EnvBox): string {
  const top = band.y;
  const bottom = band.y + band.h;
  const horizon = top + band.h * 0.56;
  return tamsuiDefs(ctx) + stageDefs(ctx, chapterSky(9), { all: true })
    + `<rect x="0" y="${top}" width="${P}" height="${band.h}" fill="${ref(ctx, 'sky')}"/>`
    + `<rect x="0" y="${f1(horizon - 30)}" width="${P}" height="34" fill="${W.peachLight}" opacity=".18"/>`
    + pinholes(ctx, 0, top, P, 26, Math.round(P / 30), 911)
    + dawnClouds(ctx, [[P * 0.22, top + band.h * 0.24, 120], [P * 0.7, top + band.h * 0.34, 90]])
    + guanyin(ctx, P * 0.08, P * 0.92, horizon + 2, band.h * 0.36, { lights: 6, seed: 92 })
    + seaWater(ctx, 0, horizon + 3, P, bottom + 4, 93, { dense: 0.8 })
    + mangroves(0, P, bottom - 4, 94, 12);
}

/** 10-1 (信義線 on the viaduct, 05:10): the hills going peach, 信義's towers, a few windows still lit. */
function xinyiDawn(ctx: KitCtx, P: number, band: EnvBox): string {
  const foot = band.y + band.h;
  return t101Defs(ctx) + stageDefs(ctx, chapterSky(10), { all: true })
    + `<rect x="0" y="${band.y}" width="${P}" height="${band.h}" fill="${ref(ctx, 'sky')}"/>`
    + `<rect x="0" y="${foot - 70}" width="${P}" height="50" fill="${K.peachLight}" opacity=".2"/>`
    + pinholes(ctx, 0, band.y, P, 30, Math.round(P / 30), 1011)
    + `<path d="${ridge(P, foot - 46, 16, 1012)}" fill="${K.hillFar}"/>`
    + `<path d="${ridge(P, foot - 34, 10, 1013)}" fill="${K.hill}"/>`
    + xinyiSkyline(ctx, 10, P - 10, foot - 8, 54, 1014, { lit: 0.22 });
}

/** Each moving car's view (`windowStrips.ts` says where and how fast). */
const TILES: Readonly<Record<string, Tile>> = {
  'c1/car': cityNight,
  'c5/red-car': tunnel,
  'c6/front-car': overCity,
  'c8/hot-spring-train': beitouView,
  'c9/tamsui-line': riverDawn,
  'c10/xinyi-line': xinyiDawn,
};
/** Chapter 10's kit is in screen colours: its strip undoes the bake's grade first (as its backdrops do). */
const SCREEN_CHAPTERS: ReadonlySet<number> = new Set([10]);

/** One period of the strip, seamless: the tile at −P, 0 and +P, clipped to [0, P]; y from the band's top. */
export function stripSource(s: WindowStripDef): CutoutSource {
  const tile = TILES[s.backdrop];
  const P = s.period;
  return {
    chapter: s.chapter,
    box: { x: 0, y: 0, w: P, h: s.band.h },
    draw: (ctx) => {
      const clip = ctx.id('stripClip');
      const one = (dx: number) => `<g transform="translate(${dx} ${-s.band.y})">${tile(ctx, P, s.band)}</g>`;
      const svg = `<clipPath id="${clip}"><rect width="${P}" height="${s.band.h}"/></clipPath><g clip-path="url(#${clip})">${one(-P)}${one(0)}${one(P)}</g>`;
      return SCREEN_CHAPTERS.has(s.chapter) ? ungradeSvg(svg, s.chapter) : svg;
    },
  };
}
