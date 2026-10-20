import { POPUP as C, POPUP_HOME as H, POPUP_STAGE as S, POPUP_STATION as T, mixHex } from '../../../art/palette';
import { depth, f1, pageBlock, pinholes, ref, scallopBand, seeded, skyline, softEllipse, wheelRim, type KitCtx } from '../../art';
import { dieCut } from '../../view/art/creatures';
import { tudigong, vFold } from '../../view/art/placeholders';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorWiden } from '../../view/geometry';
import type { BackdropDraw, PartSource } from '../sources';
import { FLOOR_RECT, bakedFlap, bookCues, calmMoon, floorPage, flapSize, kraftBack, lin, paperFace, paperFibres, rad, standingPage } from './common';

/** The page block under the floor page (a thick old book). */
const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};

/**
 * Chapter 1 (台北車站) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The chapter's art issue (#108) adds the rest here.
 */

/** One split-flap card (proof A): the dark card, its lighter top half, the split, the glyph. */
function flapCard(x: number, y: number, ch: string, color: string, digit = false): string {
  const family = digit ? "'Fredoka'" : "'Chiron GoRound TC'";
  return `<g transform="translate(${f1(x)} ${f1(y)})"><rect width="18" height="24" rx="2" fill="${C.tile}"/>`
    + `<rect width="18" height="12" rx="2" fill="${C.sticker}"/><path d="M0 12H18" stroke="${C.stickerDeep}" stroke-width="1"/>`
    + `<path d="M.6 .6H17.4" stroke="${C.stickerRim}" stroke-width=".6" opacity=".7"/>`
    + `<text x="9" y="18.4" text-anchor="middle" font-family="${family}" font-weight="700" font-size="${digit ? 16 : 14}" fill="${color}">${ch}</text></g>`;
}

/** What the board reads in each state: the line, the time, where it goes. */
const BOARD_TEXT: Readonly<Record<string, { line: string; time: string; to: string }>> = {
  // GDD § 4.3: the 月亮線 to Baokaka's home, at the chapter's 00:20
  times: { line: '月亮線', time: '00:20', to: '往寶咖咖的家' },
  // Tapped, every card flips to the next departure: the 福德 (土地公) line, and he peeks out
  flip: { line: '福德線', time: '00:21', to: '往土地公的家' },
};

/** The board's half size and how far its cords run up to the backdrop page's top edge (1-2 hangs it at y 40). */
const BW = 88, BH = 32, CORD = 40;

/**
 * 1-2's split-flap departure board (GDD § 4.3; proof A): a navy board in a gold-foil frame,
 * hanging on two cords from the top of the backdrop page, with a line of split-flap cards (the
 * line and the time in warm lamp light, the destination in paper white) and a green "on time"
 * lamp. It is a `prop` (tap to flip, a discovery): printed, never marigold.
 *
 * Local space: the origin at the board's centre (the part's hit centre), the cords running up
 * `CORD` units to the page's top edge.
 */
export const departureBoard: PartSource = {
  preset: 'prop',
  states: ['times', 'flip'],
  box: { x: -BW - 8, y: -BH - CORD - 2, w: 2 * BW + 22, h: 2 * BH + CORD + 22 },
  draw(ctx: KitCtx, state: string): string {
    const t = BOARD_TEXT[state] ?? BOARD_TEXT.times;
    const cords = `<path d="M${-BW + 22} ${-BH - CORD}V${-BH + 2}M${BW - 22} ${-BH - CORD}V${-BH + 2}" stroke="${C.stickerDeep}" stroke-width="1.4" opacity=".85"/>`
      + `<g fill="${ref(ctx, 'foil')}"><circle cx="${-BW + 22}" cy="${-BH + 2}" r="2.2"/><circle cx="${BW - 22}" cy="${-BH + 2}" r="2.2"/></g>`;
    const cards = [
      ...[...t.line].map((c, i) => flapCard(-BW + 9 + i * 20, -BH + 7, c, C.lamp)),
      ...[...t.time].map((c, i) => flapCard(-BW + 77 + i * 18.6, -BH + 7, c, C.lamp, true)),
      ...[...t.to].map((c, i) => flapCard(-BW + 9 + i * 20, -BH + 35, c, C.barLabel)),
    ].join('');
    const body = `<rect x="${-BW}" y="${-BH}" width="${2 * BW}" height="${2 * BH}" rx="5" fill="${C.nightInk}"/>`
      + `<rect x="${-BW + 2.5}" y="${-BH + 2.5}" width="${2 * BW - 5}" height="${2 * BH - 5}" rx="4" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1.1"/>`
      + cards
      + `<path d="M${-BW + 1} ${-BH + 0.7}H${BW - 2}" stroke="${C.cutRim}" stroke-width="1" opacity=".35"/>`;
    // The status lamp: a lit bead with a little bloom (a light, so the grade leaves it alone)
    const lamp = softEllipse(ctx, BW - 12, BH - 13, 6, 6, 'lamp', 0.35, 'blur3')
      + `<circle cx="${BW - 12}" cy="${BH - 13}" r="3.6" fill="${C.neonCyan}"/><circle cx="${BW - 13}" cy="${BH - 14.2}" r="1.2" fill="${C.lampHot}"/>`;
    return cords + depth(ctx, 3, body, `<rect x="${-BW}" y="${-BH}" width="${2 * BW}" height="${2 * BH}" rx="5"/>`) + lamp;
  },
};

// ——— Chapter 1's page art (#108): 台北車站 at 00:20 ———

/** The station's gradient defs, shared by the chapter's backdrops. */
function stationDefs(ctx: KitCtx): string {
  return `<defs>`
    + lin(ctx, 'sandWall', [[0, mixHex(T.sandShade, T.navy, 0.42)], [0.5, mixHex(T.sand, T.navy, 0.3)], [1, mixHex(T.sandLight, T.navy, 0.18)]])
    + lin(ctx, 'sandWallDim', [[0, mixHex(T.sandShade, C.shadow, 0.35)], [1, mixHex(T.sand, C.shadow, 0.15)]])
    + lin(ctx, 'navyG', [[0, T.navyLight], [1, T.navyDeep]])
    + lin(ctx, 'ceilG', [[0, T.lattice], [1, T.ceilingLit]])
    + lin(ctx, 'carWallG', [[0, T.carCeiling], [0.5, mixHex(T.carWall, T.navy, 0.1)], [1, mixHex(T.carWallShade, T.navy, 0.18)]])
    + lin(ctx, 'seatG', [[0, T.seat], [1, T.seatDeep]])
    + lin(ctx, 'prioG', [[0, T.priority], [1, T.priorityDeep]])
    + lin(ctx, 'steelG', [[0, T.steelDeep], [0.4, T.steel], [0.6, C.cutRim], [1, T.steelDeep]], 'h')
    + lin(ctx, 'pillarS', [[0, mixHex(T.sandLight, T.navy, 0.22)], [0.5, mixHex(T.sand, T.navy, 0.3)], [1, mixHex(T.sandDeep, T.navy, 0.3)]], 'h')
    + lin(ctx, 'stRoof', [[0, S.roofTop], [1, S.roofLow]])
    + lin(ctx, 'stFacade', [[0, mixHex(T.sandShade, T.navy, 0.35)], [0.55, T.sandShade], [1, T.sand]])
    + lin(ctx, 'lampWashS', [[0, C.lampAmber, 0], [1, C.lampAmber, 0.12]])
    + rad(ctx, 'warmPoolS', [[0, C.lamp, 0.42], [0.6, C.lampAmber, 0.12], [1, C.lampAmber, 0]])
    + rad(ctx, 'skylight', [[0, H.moonSpill, 0.3], [1, H.moonSpill, 0]], 0.5, 0.2, 0.7)
    + lin(ctx, 'shaftG', [[0, T.shaft], [1, mixHex(T.shaft, C.shadow, 0.4)]], 'h')
    + `</defs>`;
}

/**
 * A perspective checker printed on the floor page (rows shrink toward the gutter), its dark squares
 * at `contrast` (bible § 11: the hall floor calmer than proof A's, about 15 % less).
 */
function checkerFloor(ctx: KitCtx, cell: number, contrast = 0.72): string {
  const yh = GUTTER_Y - 90;
  const kp = FLOOR_BOTTOM - yh;
  const zf = kp / (GUTTER_Y - yh);
  const zs: number[] = [];
  for (let z = zf; z >= 0.98; z /= 1.11) zs.push(z);
  zs.push(1);
  const yOf = (z: number) => yh + kp / z;
  const xOf = (u: number, z: number) => 195 + (u * cell) / z;
  let d = '';
  for (let r = 0; r < zs.length - 1; r++) {
    for (let u = -16; u < 16; u++) {
      if ((u + r) % 2) continue;
      const [za, zb] = [zs[r], zs[r + 1]];
      d += `M${f1(xOf(u, za))} ${f1(yOf(za))}L${f1(xOf(u + 1, za))} ${f1(yOf(za))}L${f1(xOf(u + 1, zb))} ${f1(yOf(zb))}L${f1(xOf(u, zb))} ${f1(yOf(zb))}Z`;
    }
  }
  const { x, y, w, h } = FLOOR_RECT;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T.checkLight}"/><path d="${d}" fill="${T.checkDark}" opacity="${contrast}"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}"/>`;
}

/** A terrazzo floor page: a pale ground with seeded flecks and expansion lines toward the vanishing point. */
function terrazzoFloor(ctx: KitCtx, seed: number): string {
  const { x, y, w, h } = FLOOR_RECT;
  const r = seeded(seed);
  let flecks = '';
  for (let i = 0; i < 220; i++) {
    const t = r();
    const fy = GUTTER_Y + h * t * t * 0.4 + h * t * 0.6;
    const fx = x + r() * w;
    flecks += `M${f1(fx)} ${f1(fy)}h${f1(0.8 + t * 1.6)}v${f1(0.6 + t)}h${f1(-(0.8 + t * 1.6))}z`;
  }
  const k = (FLOOR_BOTTOM - GUTTER_Y) / (GUTTER_Y + 360);
  let lines = '';
  for (let bx = -120; bx <= PAGE_W + 120; bx += 66) lines += `M${bx} ${GUTTER_Y}L${f1(bx + (bx - 195) * k)} ${FLOOR_BOTTOM}`;
  for (const t of [0.18, 0.42, 0.72]) lines += `M${x} ${f1(GUTTER_Y + h * t)}H${x + w}`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mixHex(T.terrazzo, T.navy, 0.22)}"/><path d="${flecks}" fill="${T.terrazzoFleck}" opacity=".55"/>`
    + `<path d="${lines}" stroke="${T.sandShade}" stroke-width="1" opacity=".5" fill="none"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}"/>`;
}

/** Warm light pools painted on the floor page. */
const pools = (ctx: KitCtx, list: readonly (readonly [number, number, number, number])[]) =>
  list.map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ref(ctx, 'warmPoolS')}"/>`).join('');

/** A navy station sign with foil characters (and an optional small English line). */
function stationSign(ctx: KitCtx, x: number, y: number, w: number, h: number, text: string, sub = '', size = 12): string {
  return depth(ctx, 2, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${ref(ctx, 'navyG')}"/>`
    + `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="1.5" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width=".7" opacity=".8"/>`, `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`)
    + `<text data-art-text="" x="${f1(x + w / 2)}" y="${f1(y + (sub ? h * 0.52 : h * 0.68))}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${size}" fill="${ref(ctx, 'foilH')}" letter-spacing="2">${text}</text>`
    + (sub ? `<text data-art-text="" x="${f1(x + w / 2)}" y="${f1(y + h * 0.86)}" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="${f1(size * 0.5)}" fill="${C.chalk}" opacity=".8" letter-spacing="1">${sub}</text>` : '');
}

/** A round station clock (white face, navy rim) showing 00:20, centred on (x, y). */
function stationClock(ctx: KitCtx, x: number, y: number, r: number): string {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `M${f1(x + Math.sin(a) * r * 0.8)} ${f1(y - Math.cos(a) * r * 0.8)}L${f1(x + Math.sin(a) * r * 0.66)} ${f1(y - Math.cos(a) * r * 0.66)}`;
  }).join('');
  const m = (20 / 60) * Math.PI * 2;
  const hr = ((0 + 20 / 60) / 12) * Math.PI * 2;
  return depth(ctx, 3, `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="${ref(ctx, 'navyG')}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${T.clockFace}"/>`, `<circle cx="${x}" cy="${y}" r="${r + 4}"/>`)
    + `<circle cx="${x}" cy="${y}" r="${r + 2}" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width=".9"/>`
    + `<path d="${ticks}" stroke="${T.navy}" stroke-width="${f1(r * 0.07)}" stroke-linecap="round"/>`
    + `<path d="M${x} ${y}L${f1(x + Math.sin(hr) * r * 0.45)} ${f1(y - Math.cos(hr) * r * 0.45)}M${x} ${y}L${f1(x + Math.sin(m) * r * 0.68)} ${f1(y - Math.cos(m) * r * 0.68)}" stroke="${T.navyDeep}" stroke-width="${f1(r * 0.09)}" stroke-linecap="round"/>`
    + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.08)}" fill="${C.seal}"/>`;
}

/** A paper-style person seen from above (the travellers printed on 1-4's disk): head, shoulders, a bag. */
function seatedTop(x: number, y: number, rot: number, coat: string, hair: string, bag: string): string {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot})"><ellipse rx="9" ry="6" fill="${coat}"/><circle cy="-1" r="4.4" fill="${hair}"/>`
    + `<rect x="5" y="2" width="8" height="7" rx="2" fill="${bag}"/><path d="M-6 3q6 4 12 0" stroke="${C.shadow}" stroke-width="1" opacity=".25" fill="none"/></g>`;
}

// ——— 1-1 「月亮線，出發！」 ———

/**
 * Inside the 板南線 car (1-1), a side cut-away box fold (bible § 6): the cream ceiling with its
 * light strips, the neon route map lit at 台北車站, the strap rail with two hand straps (Mocha's
 * `strap1` at (84, 222), `strap2` at (184, 214)) and a third for show (looped up, no ring, #183), the 「請讓座」 poster whose
 * picture is the 土地公 (196, 136), windows with the night city sliding by, the long blue bench, the
 * teal 博愛座 at the far end and the luggage rack over it (`rack`, its edge at (286, 286)). Below
 * the car body (the live ledge) the track runs on the floor page.
 */
const car: BackdropDraw = (ctx) => {
  const winA = { x: 72, y: 150, w: 92, h: 104 };
  const winB = { x: 236, y: 150, w: 132, h: 104 };
  const view = (g: { x: number; y: number; w: number; h: number }, seed: number) => {
    const id = ctx.id(`carWin${seed}`);
    const sk = skyline(g.x - 8, g.x + g.w + 8, g.y + g.h - 8, seed, { minH: 14, maxH: 60, winP: 0.16, winOpacity: 0.7 });
    let streaks = '';
    const r = seeded(seed + 5);
    for (let i = 0; i < 7; i++) streaks += `M${f1(g.x + r() * g.w)} ${f1(g.y + g.h * (0.55 + r() * 0.4))}h${f1(10 + r() * 26)}`;
    return `<clipPath id="${id}"><rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="10"/></clipPath><g clip-path="url(#${id})">`
      + `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" fill="${ref(ctx, 'sky')}"/>` + pinholes(ctx, g.x, g.y, g.w, 40, Math.round(g.w / 8), seed)
      + `<path d="${sk.d}" fill="${mixHex(T.navyDeep, C.shadow, 0.2)}"/>${sk.windows}`
      + `<path d="${streaks}" stroke="${C.lamp}" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>`
      + `<path d="M${g.x} ${g.y + g.h * 0.6}L${g.x + g.w * 0.5} ${g.y}H${g.x + g.w * 0.66}L${g.x} ${g.y + g.h}Z" fill="${C.cutRim}" opacity=".07"/></g>`
      + `<rect x="${g.x - 3}" y="${g.y - 3}" width="${g.w + 6}" height="${g.h + 6}" rx="12" fill="none" stroke="${ref(ctx, 'steelG')}" stroke-width="5"/>`;
  };
  // A tiny 101 in the far window (the finale's foreshadow)
  const t101 = `<g transform="translate(${winB.x + 98} ${winB.y + winB.h - 8})"><path d="M-5 0V-50L-3.5 -52V-62H-2.5V-72H2.5V-62H3.5V-52L5 -50V0Z" fill="${mixHex(T.navyDeep, C.shadow, 0.2)}"/>`
    + `<path d="${Array.from({ length: 6 }, (_, i) => `M-6 ${-12 - i * 6.5}H6`).join('')}" stroke="${C.neonCyan}" stroke-width=".6" opacity=".45"/></g>`;
  // The route map: a navy strip, the blue line, station dots; 台北車站 lit
  const stops = [86, 124, 162, 200, 238, 276, 314];
  const route = depth(ctx, 2, `<rect x="66" y="64" width="270" height="26" rx="4" fill="${T.navyDeep}"/>`, `<rect x="66" y="64" width="270" height="26" rx="4"/>`)
    + `<path d="M80 80H322" stroke="${T.bannan}" stroke-width="4" stroke-linecap="round"/>`
    + stops.map((x, i) => `<circle cx="${x}" cy="80" r="${i === 3 ? 4.6 : 3}" fill="${i === 3 ? C.lampHot : C.cutRim}" stroke="${T.bannan}" stroke-width="1.6"/>`).join('')
    + softEllipse(ctx, 200, 80, 10, 8, 'lamp', 0.4)
    + `<text data-art-text="" x="200" y="74" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7.5" fill="${C.lamp}">台北車站</text>`
    + `<text data-art-text="" x="86" y="74" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="700" font-size="6" fill="${C.chalk}" opacity=".7">板南線</text>`;
  // The 「請讓座」 poster: the 土地公 (drawn live at (196, 136)) is its picture
  const poster = depth(ctx, 2, `<rect x="166" y="100" width="72" height="76" rx="2" fill="${C.washi}"/><rect x="166" y="100" width="72" height="15" rx="2" fill="${T.priority}"/>`
    + `<circle cx="196" cy="137" r="16" fill="${mixHex(C.washi, T.priority, 0.15)}"/>`, `<rect x="166" y="100" width="72" height="76"/>`)
    + `<text data-art-text="" x="212" y="111.5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8.5" fill="${C.cutRim}" letter-spacing="1">請讓座</text>`
    + `<g fill="${T.priorityDeep}" opacity=".7"><circle cx="218" cy="132" r="2.6"/><path d="M215 136h6v6h-6z"/><circle cx="228" cy="132" r="2.6"/><path d="M225 136h6l-1 6h-4z"/><circle cx="222" cy="152" r="2"/><path d="M219 155h6v6h-6z"/></g>`;
  // The strap rail and the straps: a steel bar, belts, round handles (Mocha sits on a handle's top)
  const strap = (x: number, top: number) => `<path d="M${x} 100V${top - 2}" stroke="${T.seatDeep}" stroke-width="4"/>`
    + `<circle cx="${x}" cy="${top + 9}" r="9" fill="none" stroke="${C.cutRim}" stroke-width="3.6"/><circle cx="${x}" cy="${top + 9}" r="9" fill="none" stroke="${T.steel}" stroke-width="2"/>`;
  // The third strap is only for show (#183: it read as a perch): looped up short on the rail, a
  // dark belt with a small triangular grip, nothing like the steel rings Mocha sits on
  const tiedStrap = (x: number) => `<path d="M${x} 100V136" stroke="${T.seatDeep}" stroke-width="4"/>`
    + `<path d="M${x - 7} 136H${x + 7}L${x} 148Z" fill="none" stroke="${T.seatDeep}" stroke-width="3" stroke-linejoin="round"/>`;
  const rail = depth(ctx, 3, `<rect x="30" y="96" width="350" height="5" rx="2.5" fill="${ref(ctx, 'steelG')}"/>`
    + `<path d="M40 70V96M210 70V96M370 70V96" stroke="${T.steelDeep}" stroke-width="2.4"/>`
    + strap(84, 222) + strap(184, 214) + tiedStrap(330), `<rect x="30" y="96" width="350" height="5"/>`);
  // The luggage rack over the 博愛座: a steel shelf on brackets; the sign under it
  const rack = depth(ctx, 3, `<rect x="230" y="286" width="164" height="6" rx="2" fill="${ref(ctx, 'steelG')}"/><path d="M244 292l-10 18M384 292l8 18" stroke="${T.steelDeep}" stroke-width="2.4"/>`
    + `<path d="${Array.from({ length: 11 }, (_, i) => `M${236 + i * 15} 286v5`).join('')}" stroke="${T.steelDeep}" stroke-width="1"/>`, `<rect x="230" y="286" width="164" height="6"/>`);
  const prioSign = depth(ctx, 2, `<rect x="318" y="300" width="58" height="16" rx="3" fill="${T.priority}"/>`, `<rect x="318" y="300" width="58" height="16" rx="3"/>`)
    + `<text data-art-text="" x="347" y="311.5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.cutRim}" letter-spacing="2">博愛座</text>`;
  // The car's end door at the left: two panels with windows, an amber 台北車站 sign above
  const door = depth(ctx, 2, `<rect x="-4" y="104" width="62" height="256" fill="${T.carWallShade}"/><rect x="0" y="112" width="27" height="248" fill="${T.steel}"/><rect x="29" y="112" width="27" height="248" fill="${T.steel}"/>`
    + `<rect x="4" y="132" width="19" height="92" rx="4" fill="${ref(ctx, 'sky')}"/><rect x="33" y="132" width="19" height="92" rx="4" fill="${ref(ctx, 'sky')}"/>`
    + `<path d="M28 112V360" stroke="${C.printDark}" stroke-width="1.6"/><rect x="2" y="84" width="52" height="14" rx="2" fill="${C.printDark}"/>`, `<rect x="-4" y="84" width="62" height="276"/>`)
    + `<text data-art-text="" x="28" y="94.6" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="700" font-size="8" fill="${C.lamp}" letter-spacing="1">台北車站</text>`;
  // The poles: floor to ceiling by the door and between the benches
  const poles = `<rect x="64" y="40" width="5" height="420" fill="${ref(ctx, 'steelG')}"/><rect x="222" y="40" width="5" height="420" fill="${ref(ctx, 'steelG')}"/>`;
  // The ceiling: a curved cream panel with two lit strips
  const ceiling = `<path d="M-20 0H410V52Q195 64 -20 52Z" fill="${T.carCeiling}"/><path d="M-20 52Q195 64 410 52" stroke="${T.carWallShade}" stroke-width="2" fill="none"/>`
    + `<rect x="40" y="22" width="130" height="5" rx="2.5" fill="${C.lampHot}"/><rect x="220" y="22" width="130" height="5" rx="2.5" fill="${C.lampHot}"/>`
    + softEllipse(ctx, 105, 24, 70, 8, 'lamp', 0.3) + softEllipse(ctx, 285, 24, 70, 8, 'lamp', 0.3);
  const back = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'carWallG')}"/>`
    + paperFibres(-20, 0, PAGE_W + 40, GUTTER_Y, 50, T.carWallShade, 61, 0.25)
    + ceiling + route
    // The car's blue band under the windows, running the car's length
    + `<rect x="-20" y="270" width="${PAGE_W + 40}" height="10" fill="${T.bannan}"/><rect x="-20" y="281" width="${PAGE_W + 40}" height="2" fill="${T.bannanDeep}"/>`
    + view(winA, 3) + view(winB, 8) + t101
    + poster + rack + prioSign + door
    + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${C.shadow}" opacity=".08"/>`;
  // The benches on the floor page, against the wall: blue, then the teal 博愛座; dark under them
  const bench = (x0: number, x1: number, fill: string) => depth(ctx, 3, `<rect x="${x0}" y="350" width="${x1 - x0}" height="56" rx="8" fill="${fill}"/>`
    + `<rect x="${x0 - 2}" y="404" width="${x1 - x0 + 4}" height="18" rx="6" fill="${fill}"/><path d="M${x0 + 6} 408h${x1 - x0 - 12}" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`
    + `<path d="${Array.from({ length: Math.floor((x1 - x0) / 36) }, (_, i) => `M${x0 + 36 + i * 36} 356V400`).join('')}" stroke="${C.shadow}" stroke-width="1.6" opacity=".2"/>`, `<rect x="${x0}" y="350" width="${x1 - x0}" height="72"/>`);
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="80" fill="${T.floorLinoDeep}"/>`
    // The track bed below the car: ballast, sleepers toward the vanishing point, two rails
    + `<rect x="${FLOOR_RECT.x}" y="440" width="${FLOOR_RECT.w}" height="${FLOOR_BOTTOM - 440}" fill="${mixHex(T.navyDeep, C.printDark, 0.5)}"/>`
    + (() => {
      const k = (FLOOR_BOTTOM - GUTTER_Y) / (GUTTER_Y + 360);
      let d = '';
      for (let x = -140; x <= PAGE_W + 140; x += 26) d += `M${f1(x + (x - 195) * k * 0.55)} 532L${f1(x + (x - 195) * k)} ${FLOOR_BOTTOM}`;
      return `<path d="${d}" stroke="${C.printDark}" stroke-width="5" opacity=".9"/>`;
    })()
    + `<path d="M-40 548H430M-40 616H430" stroke="${T.steelDeep}" stroke-width="5"/><path d="M-40 546.5H430M-40 614.5H430" stroke="${T.steel}" stroke-width="1.6"/>`
    + `<rect x="${FLOOR_RECT.x}" y="440" width="${FLOOR_RECT.w}" height="70" fill="${C.shadow}" opacity=".35"/>`);
  return stationDefs(ctx) + standingPage(ctx, back) + floor
    + bench(70, 292, ref(ctx, 'seatG')) + bench(296, 410, ref(ctx, 'prioG')) + poles + rail
    + bookCues(ctx) + block();
};

// ——— 1-2 「月台的縫」 ———

/** A paper street lamp with a small vellum lantern (its glow kept small), standing at `foot`. */
function stLamp(ctx: KitCtx, x: number, top: number, foot: number): string {
  return softEllipse(ctx, x, top + 6, 20, 20, 'lamp', 0.16, 'blur8')
    + depth(ctx, 3, `<rect x="${x - 2}" y="${top + 12}" width="4" height="${foot - top - 12}" fill="${S.lampPost}"/><path d="M${x - 7} ${foot}h14l-2 -6h-10z" fill="${S.lampPost}"/>`
      + `<path d="M${x - 9} ${top + 2}h18l-3 12h-12z" fill="${S.lampShade}"/><path d="M${x - 11} ${top + 2}h22l-11 -8z" fill="${S.lampPost}"/>`,
    `<rect x="${x - 2}" y="${top + 12}" width="4" height="${foot - top - 12}"/><path d="M${x - 11} ${top + 2}h22l-3 12h-16z"/>`)
    + `<path d="M${x - 7} ${top + 4}h14l-2 9h-10z" fill="${C.lampHot}" opacity=".85"/>`;
}

/**
 * Taipei Main Station's facade (bible § 6 row 1), a pop-up box folded down its centre: sandstone
 * walls with tall slim windows lit behind vellum (calm), the 重簷 two-tier roof with its gold ridge
 * and upturned eaves, the drum's lit band, the foil 台北車站 plate and the lit arcade.
 */
function stationFacade(ctx: KitCtx, x0: number, x1: number, top: number, base: number): string {
  const cx = (x0 + x1) / 2;
  const body = top + 44;
  const n = 9;
  const step = (x1 - x0 - 28) / n;
  let s = depth(ctx, 2, `<rect x="${x0}" y="${body}" width="${x1 - x0}" height="${base - body}" fill="${ref(ctx, 'stFacade')}"/>`
    + `<path d="${Array.from({ length: n }, (_, i) => `M${f1(x0 + 14 + i * step)} ${body + 24}h${f1(step * 0.5)}V${base - 16}h${f1(-step * 0.5)}Z`).join('')}" fill="${S.facadeRecess}"/>`,
  `<rect x="${x0}" y="${body}" width="${x1 - x0}" height="${base - body}"/>`);
  // The windows: vellum lit at a low bloom (#140's squint note), a mullion each
  s += `<path d="${Array.from({ length: n }, (_, i) => `M${f1(x0 + 16 + i * step)} ${body + 26}h${f1(step * 0.5 - 4)}V${base - 20}h${f1(-(step * 0.5 - 4))}Z`).join('')}" fill="${ref(ctx, 'window')}" opacity=".72"/>`
    + `<path d="${Array.from({ length: n }, (_, i) => `M${f1(x0 + 14 + i * step + step * 0.25)} ${body + 26}V${base - 20}M${f1(x0 + 16 + i * step)} ${body + 52}h${f1(step * 0.5 - 4)}`).join('')}" stroke="${S.facadeRecess}" stroke-width=".9" opacity=".55"/>`;
  s += depth(ctx, 3, `<rect x="${cx - 45}" y="${base - 40}" width="90" height="40" fill="${S.facadeRecess}"/>`, `<rect x="${cx - 45}" y="${base - 40}" width="90" height="40"/>`)
    + `<path d="${[0, 1, 2].map((i) => `M${cx - 37 + i * 28} ${base}V${base - 22}a10 10 0 0 1 20 0V${base}Z`).join('')}" fill="${ref(ctx, 'window')}" opacity=".8"/>`;
  s += depth(ctx, 3, `<rect x="${cx - 58}" y="${body + 4}" width="116" height="22" rx="2" fill="${C.printDark}"/>`, `<rect x="${cx - 58}" y="${body + 4}" width="116" height="22" rx="2"/>`)
    + `<rect x="${cx - 55.5}" y="${body + 6.5}" width="111" height="17" rx="1" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width=".8"/>`
    + `<text data-art-text="" x="${cx}" y="${body + 20}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="13" fill="${ref(ctx, 'foilH')}" letter-spacing="5">台北車站</text>`;
  const lower = `M${x0 - 18} ${top + 48}Q${x0 - 6} ${top + 40} ${x0 + 14} ${top + 26}L${x1 - 14} ${top + 26}Q${x1 + 6} ${top + 40} ${x1 + 18} ${top + 48}Q${x1} ${top + 44} ${x1 - 8} ${top + 46}H${x0 + 8}Q${x0} ${top + 44} ${x0 - 18} ${top + 48}Z`;
  s += depth(ctx, 3, `<path d="${lower}" fill="${ref(ctx, 'stRoof')}"/><path d="${Array.from({ length: 24 }, (_, i) => `M${f1(x0 + 18 + i * ((x1 - x0 - 28) / 24))} ${top + 28}L${f1(x0 + 14 + i * ((x1 - x0 - 24) / 24))} ${top + 45}`).join('')}" stroke="${S.roofTile}" stroke-width="1.2" opacity=".7"/>`
    + `<path d="M${x0 + 14} ${top + 26}H${x1 - 14}" stroke="${ref(ctx, 'foilH')}" stroke-width="2"/>`, `<path d="${lower}"/>`);
  const dx0 = cx - 77, dx1 = cx + 77;
  s += depth(ctx, 3, `<rect x="${dx0}" y="${top + 2}" width="154" height="26" fill="${ref(ctx, 'sandWallDim')}"/>`, `<rect x="${dx0}" y="${top + 2}" width="154" height="26"/>`)
    + `<path d="${Array.from({ length: 8 }, (_, i) => `M${f1(dx0 + 8 + i * 18.5)} ${top + 8}h9v14h-9Z`).join('')}" fill="${ref(ctx, 'window')}" opacity=".7"/>`;
  const upper = `M${cx - 103} ${top + 6}Q${cx - 91} ${top - 2} ${cx - 73} ${top - 16}L${cx + 73} ${top - 16}Q${cx + 91} ${top - 2} ${cx + 103} ${top + 6}Q${cx + 89} ${top + 2} ${cx + 81} ${top + 4}H${cx - 81}Q${cx - 89} ${top + 2} ${cx - 103} ${top + 6}Z`;
  s += depth(ctx, 4, `<path d="${upper}" fill="${ref(ctx, 'stRoof')}"/><path d="${Array.from({ length: 14 }, (_, i) => `M${f1(cx - 69 + i * 10.6)} ${top - 14}L${f1(cx - 73 + i * 10.9)} ${top + 3}`).join('')}" stroke="${S.roofTile}" stroke-width="1.2" opacity=".7"/>`
    + `<path d="M${cx - 73} ${top - 16}H${cx + 73}" stroke="${ref(ctx, 'foilH')}" stroke-width="2.2"/><path d="M${cx - 77} ${top - 16}q-6 -6 -2 -11M${cx + 77} ${top - 16}q6 -6 2 -11" stroke="${ref(ctx, 'foilH')}" stroke-width="2" fill="none"/>`, `<path d="${upper}"/>`);
  const shape = `M${x0} ${base}V${body}H${x0 - 18}L${x0 + 14} ${top + 26}H${dx0}V${top + 6}H${cx - 103}L${cx - 73} ${top - 16}H${cx + 73}L${cx + 103} ${top + 6}H${dx1}V${top + 26}H${x1 - 14}L${x1 + 18} ${top + 48}H${x1}V${base}Z`;
  return s + vFold(ctx, shape, cx, top - 16, base, { clipId: ctx.id('stationFold') });
}

/** The city night over the station: sky, pinholes, a calm moon, cloud bands, the skyline with a tiny 101. */
function cityNight(ctx: KitCtx, moon: readonly [number, number, number], skyBase = 254): string {
  const sk = skyline(-4, PAGE_W + 4, skyBase, 33, { minH: 18, maxH: 58, winP: 0.12, winOpacity: 0.7 });
  const tower = `<g transform="translate(58 ${skyBase})"><path d="M-6 0V-64L-4 -66V-80H-3V-92H3V-80H4V-66L6 -64V0Z" fill="${mixHex(T.navyDeep, C.shadow, 0.15)}"/>`
    + `<path d="${Array.from({ length: 8 }, (_, i) => `M-7 ${-14 - i * 6.5}H7`).join('')}" stroke="${C.neonCyan}" stroke-width=".7" opacity=".45"/><circle cy="-94" r="1.4" fill="${C.neonPink}"/></g>`;
  const band = (y0: number, y1: number, seed: number, amp: number, stp: number, fill: string) => depth(ctx, 1, `<path d="${scallopBand(-6, PAGE_W + 6, y0, y1, seed, amp, stp)}" fill="${fill}"/>`, `<path d="${scallopBand(-6, PAGE_W + 6, y0, y1, seed, amp, stp)}"/>`);
  return `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, 0, 0, PAGE_W, 230, 64, 9)
    + calmMoon(ctx, moon[0], moon[1], moon[2], { halo: 0.08 })
    + band(skyBase - 94, skyBase - 40, 21, 9, 34, ref(ctx, 'cloudFar'))
    + depth(ctx, 1, `<path d="${sk.d}" fill="${mixHex(T.navyDeep, C.shadow, 0.15)}"/>${tower}`, `<path d="${sk.d}"/>`) + sk.windows
    + band(skyBase - 6, skyBase + 36, 44, 6, 40, ref(ctx, 'cloudNear'));
}

/**
 * The platforms at night (1-2; proof A): the city sky with a calm moon held off the play path, the
 * station's facade folded down its centre, lamp posts, and the hall's checker printed on the floor
 * page at proof A's contrast less about 15 % (bible § 11). The split-flap board hangs from the
 * top of the page (a baked part); the 土地公 peeks from behind its right edge at (236, 98).
 */
const hallNight: BackdropDraw = (ctx) => {
  const back = cityNight(ctx, [326, 64, 20]) + stationFacade(ctx, 34, 356, 196, GUTTER_Y + 4)
    + `<rect x="-20" y="${GUTTER_Y - 44}" width="${PAGE_W + 40}" height="44" fill="${ref(ctx, 'lampWashS')}"/>`;
  return stationDefs(ctx) + standingPage(ctx, back)
    + floorPage(ctx, checkerFloor(ctx, 33, 0.6) + pools(ctx, [[100, GUTTER_Y + 30, 130, 44], [350, GUTTER_Y + 30, 120, 42], [195, GUTTER_Y + 12, 100, 24]])
      + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${ref(ctx, 'hatch')}" opacity=".2"/>`)
    + bookCues(ctx) + stLamp(ctx, 18, 288, GUTTER_Y + 18) + stLamp(ctx, 372, 282, GUTTER_Y + 22) + block();
};

// ——— 1-3 「嗶！閘門」 ———

/** The concourse ceiling: navy coffers with pan lights, and the hanging wayfinding boards. */
function concourseCeiling(ctx: KitCtx, signs: readonly (readonly [number, number, string, string])[]): string {
  let coffers = '';
  for (let x = -10; x < PAGE_W + 20; x += 52) coffers += `M${x + 4} 6h44v38h-44Z`;
  const lights = Array.from({ length: 8 }, (_, i) => -10 + 26 + i * 52);
  return `<rect x="-20" y="0" width="${PAGE_W + 40}" height="52" fill="${ref(ctx, 'ceilG')}"/><path d="${coffers}" fill="${T.ceiling}" opacity=".7"/>`
    + lights.map((x) => softEllipse(ctx, x, 30, 16, 6, 'lamp', 0.25) + `<ellipse cx="${x}" cy="30" rx="8" ry="2.4" fill="${C.lampHot}"/>`).join('')
    + `<rect x="-20" y="50" width="${PAGE_W + 40}" height="4" fill="${T.sandDeep}"/>`
    + signs.map(([x, w, text, sub]) => `<path d="M${x + 8} 54V64M${x + w - 8} 54V64" stroke="${T.steelDeep}" stroke-width="1.4"/>` + stationSign(ctx, x, 64, w, 26, text, sub, 11)).join('');
}

/** Sandstone wall panels between pilasters, from y0 to the gutter. */
function sandWall(ctx: KitCtx, y0: number, x0 = -20, x1 = PAGE_W + 20, every = 78): string {
  let pil = '';
  for (let x = x0 + 30; x < x1; x += every) pil += `<rect x="${x}" y="${y0}" width="12" height="${GUTTER_Y - y0}" fill="${ref(ctx, 'pillarS')}"/>`;
  let joints = '';
  for (let y = y0 + 40; y < GUTTER_Y; y += 40) joints += `M${x0} ${y}H${x1}`;
  return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${GUTTER_Y - y0}" fill="${ref(ctx, 'sandWall')}"/>`
    + `<path d="${joints}" stroke="${T.sandShade}" stroke-width="1" opacity=".55"/>` + pil
    + `<rect x="${x0}" y="${GUTTER_Y - 14}" width="${x1 - x0}" height="14" fill="${T.sandDeep}"/>`;
}

/**
 * The fare-gate concourse (1-3): coffered ceiling and hanging signs, sandstone walls, the 詢問處
 * booth whose lit window frames the 土地公 in his station cap (214, 214), the 服務台 counter (the
 * `counter` perch, its top at (100, 300), where the card waits), the ticket machine (`ticketMachine`,
 * its top at (30, 320)), a lit station map, and terrazzo underfoot.
 */
const gates: BackdropDraw = (ctx) => {
  const booth = depth(ctx, 2, `<rect x="176" y="170" width="76" height="100" fill="${ref(ctx, 'navyG')}"/><rect x="182" y="196" width="64" height="40" rx="2" fill="${ref(ctx, 'window')}" opacity=".8"/>`
    + `<rect x="170" y="236" width="88" height="34" fill="${T.sandDeep}"/><rect x="168" y="234" width="92" height="5" rx="1.5" fill="${T.sandLight}"/>`
    + `<path d="M214 196V236" stroke="${T.navy}" stroke-width="1.4" opacity=".5"/>`, `<rect x="168" y="170" width="92" height="100"/>`)
    + `<text data-art-text="" x="214" y="189" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="11" fill="${ref(ctx, 'foilH')}" letter-spacing="3">詢問處</text>`
    + softEllipse(ctx, 214, 216, 36, 22, 'lamp', 0.12, 'blur8');
  const map = depth(ctx, 2, `<rect x="276" y="108" width="100" height="74" rx="3" fill="${C.washi}"/><rect x="276" y="108" width="100" height="14" rx="3" fill="${T.navy}"/>`, `<rect x="276" y="108" width="100" height="74"/>`)
    + `<text data-art-text="" x="326" y="118.6" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${C.cutRim}" letter-spacing="2">車站導覽</text>`
    + `<path d="M286 150H366M326 128V176M290 132L362 172" stroke="${T.bannan}" stroke-width="3" stroke-linecap="round" opacity=".85"/><path d="M290 172L362 132" stroke="${T.priority}" stroke-width="3" stroke-linecap="round" opacity=".85"/>`
    + `<circle cx="326" cy="150" r="5" fill="${C.seal}"/><circle cx="326" cy="150" r="2" fill="${C.cutRim}"/>`;
  const back = sandWall(ctx, 52) + concourseCeiling(ctx, [[30, 90, '↑ 月台', 'Platforms'], [262, 104, '出口 →', 'Exit']])
    + booth + map
    + `<ellipse cx="200" cy="300" rx="220" ry="90" fill="${ref(ctx, 'warmPoolS')}" opacity=".5"/>`;
  // The 服務台 counter and the ticket machine stand at the wall's foot, down onto the floor page
  const counter = depth(ctx, 3, `<rect x="62" y="304" width="76" height="106" fill="${ref(ctx, 'navyG')}"/><rect x="56" y="298" width="88" height="8" rx="2" fill="${T.sandLight}"/>`
    + `<path d="M56 298.6h88" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<rect x="56" y="298" width="88" height="112"/>`)
    + `<text data-art-text="" x="100" y="340" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="12" fill="${ref(ctx, 'foilH')}" letter-spacing="2">服務台</text>`;
  const machine = depth(ctx, 3, `<rect x="4" y="320" width="52" height="92" rx="3" fill="${T.gate}"/><rect x="10" y="330" width="40" height="26" rx="2" fill="${T.readerLight}" opacity=".55"/>`
    + `<rect x="10" y="364" width="18" height="6" rx="1.5" fill="${T.gateDeep}"/><rect x="34" y="362" width="14" height="22" rx="2" fill="${T.gateDeep}"/><rect x="10" y="390" width="40" height="8" rx="2" fill="${C.printDark}"/>`
    + `<path d="M4 320.6h52" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<rect x="4" y="320" width="52" height="92"/>`)
    + `<text data-art-text="" x="30" y="345.6" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7.5" fill="${T.navyDeep}">售票</text>`;
  return stationDefs(ctx) + standingPage(ctx, back)
    + floorPage(ctx, terrazzoFloor(ctx, 13) + pools(ctx, [[200, GUTTER_Y + 30, 180, 40], [60, GUTTER_Y + 60, 90, 30]]))
    + counter + machine + bookCues(ctx) + block();
};

// ——— 1-4 「大廳的棋盤」 ———

/**
 * The great hall (1-4): the skylight's lattice with moonlight falling through it in vellum shafts,
 * the big departure board on the sandstone wall, the hall clock (the `clock` perch: Mocha sits on
 * its top at (330, 214)), the lightbox over gate N (`lightbox`, its top at (195, 268)), and the
 * hall's famous checker printed on the floor page, calmer than proof A's. The turntable disk is a
 * baked wheel part.
 */
const hall: BackdropDraw = (ctx) => {
  // The skylight: a trapezoid of glass panes in a navy lattice, moonlight shafts below it
  let panes = '';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      const y0 = 8 + r * 26, y1 = y0 + 22;
      const k0 = 1 - r * 0.06, k1 = 1 - (r + 1) * 0.06 + 0.02;
      const xa = 195 + (-190 + c * 47.5) * k0, xb = 195 + (-190 + (c + 1) * 47.5 - 6) * k0;
      const xc = 195 + (-190 + (c + 1) * 47.5 - 6) * k1, xd = 195 + (-190 + c * 47.5) * k1;
      panes += `M${f1(xa)} ${y0}L${f1(xb)} ${y0}L${f1(xc)} ${y1}L${f1(xd)} ${y1}Z`;
    }
  }
  const skylight = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="92" fill="${T.lattice}"/><path d="${panes}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, 0, 6, PAGE_W, 70, 22, 15)
    + `<rect x="-20" y="88" width="${PAGE_W + 40}" height="8" fill="${T.sandDeep}"/>`
    + `<path d="M40 96L10 360H120L130 96ZM250 96L250 360H380L330 96Z" fill="${H.moonSpill}" opacity=".07"/>`;
  // The departure board: navy, foil frame, rows of split-flap text in calm lamp light
  const rows: [string, string, string][] = [['月亮線', '00:20', '往寶咖咖的家'], ['自強', '00:35', '往 高雄'], ['區間', '00:48', '往 基隆']];
  const board = depth(ctx, 2, `<rect x="64" y="124" width="262" height="78" rx="4" fill="${C.nightInk}"/><rect x="67" y="127" width="256" height="72" rx="3" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1"/>`, `<rect x="64" y="124" width="262" height="78"/>`)
    + rows.map(([a, b, c], i) => {
      const y = 148 + i * 20;
      return `<text data-art-text="" x="78" y="${y}" font-family="'Noto Serif TC'" font-weight="700" font-size="11" fill="${C.lamp}" opacity=".85" letter-spacing="1">${a}</text>`
        + `<text data-art-text="" x="142" y="${y}" font-family="Fredoka" font-weight="600" font-size="12" fill="${C.lamp}" opacity=".85">${b}</text>`
        + `<text data-art-text="" x="196" y="${y}" font-family="'Noto Serif TC'" font-weight="700" font-size="11" fill="${C.barLabel}" opacity=".8">${c}</text>`;
    }).join('')
    + `<path d="M70 ${155}H320M70 ${175}H320" stroke="${T.navyLight}" stroke-width=".8" opacity=".6"/>`;
  // The lightbox over gate N (its top at y 268) and the hall clock on its bracket (its top at y 214)
  const lightbox = depth(ctx, 3, `<rect x="158" y="268" width="74" height="30" rx="3" fill="${ref(ctx, 'navyG')}"/><rect x="162" y="272" width="66" height="22" rx="2" fill="${ref(ctx, 'window')}" opacity=".55"/>`, `<rect x="158" y="268" width="74" height="30"/>`)
    + `<text data-art-text="" x="195" y="288" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="12" fill="${T.navyDeep}" letter-spacing="2">北 ↑ 月台</text>`
    + `<path d="M170 298V346M220 298V346" stroke="${T.steelDeep}" stroke-width="2"/>`;
  const clock = `<path d="M330 214V200M352 250h24" stroke="${T.steelDeep}" stroke-width="3"/>` + stationClock(ctx, 330, 248, 30);
  const back = sandWall(ctx, 96, -20, PAGE_W + 20, 96) + skylight + board + lightbox + clock
    + `<ellipse cx="195" cy="330" rx="230" ry="80" fill="${ref(ctx, 'warmPoolS')}" opacity=".45"/>`;
  return stationDefs(ctx) + standingPage(ctx, back)
    + floorPage(ctx, checkerFloor(ctx, 38, 0.55) + pools(ctx, [[195, GUTTER_Y + 22, 190, 46]])
      + `<path d="M40 ${GUTTER_Y}L-30 ${FLOOR_BOTTOM}H150L130 ${GUTTER_Y}ZM250 ${GUTTER_Y}L260 ${FLOOR_BOTTOM}H420L330 ${GUTTER_Y}Z" fill="${H.moonSpill}" opacity=".06"/>`)
    + bookCues(ctx) + block();
};

// ——— 1-5 「便當店的電梯」 ———

/** The 店員小哥 (paper style, behind the counter): a red cap, a blue apron, a friendly face. */
export function clerk(ctx: KitCtx, x: number, y: number): string {
  const outline = `<circle cx="${x}" cy="${y - 30}" r="12"/><path d="M${x - 18} ${y + 10}q0 -26 18 -28q18 2 18 28z"/>`;
  const print = `<path d="M${x - 18} ${y + 10}q0 -26 18 -28q18 2 18 28z" fill="${C.washi}"/><path d="M${x - 10} ${y - 12}h20l2 22h-24z" fill="${T.clerkApron}"/>`
    + `<circle cx="${x}" cy="${y - 30}" r="11" fill="${S.skin}"/><path d="M${x - 11} ${y - 33}q0 -11 11 -11q11 0 11 11z" fill="${T.clerkCap}"/><path d="M${x + 8} ${y - 34}h9a2 2 0 0 1 0 4h-10z" fill="${T.clerkCap}"/>`
    + paperFace(x + 1, y - 28, { s: 0.85 }) + `<path d="M${x - 2} ${y - 22}q3 2 6 0" stroke="${C.ink}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
  return depth(ctx, 2, dieCut(outline, print), outline);
}

/**
 * The bento shop in cross-section (1-5): 1F above — the shop's tiled wall, its menu board with the
 * 土地公 among the dishes (296, 152), the 店員小哥 behind the counter (its top at y 238, under the
 * 叮咚 bell), steam over the rice — beside the station corridor; the floor slab cut through; the
 * elevator shaft with its cables and floor plates; B1 below — the tiled corridor wall and the
 * storage rack (the `b1Shelf` perch, its top at (318, 430)).
 */
const bentoShop: BackdropDraw = (ctx) => {
  // 1F: the corridor at the left, the shop at the right
  const tiles = (x0: number, x1: number, y0: number, y1: number) => {
    let d = '';
    for (let y = y0; y < y1; y += 12) d += `M${x0} ${y}H${x1}`;
    for (let y = y0, r = 0; y < y1; y += 12, r++) for (let x = x0 + (r % 2 ? 9 : 0); x < x1; x += 18) d += `M${x} ${y}v12`;
    return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${T.shopTile}"/><path d="${d}" stroke="${T.shopTileLine}" stroke-width=".8"/>`;
  };
  const menuItems: [number, number, string][] = [[262, 122, '排骨'], [330, 122, '雞腿'], [262, 150, '鯖魚'], [356, 150, '素食']];
  const menu = depth(ctx, 2, `<rect x="252" y="96" width="136" height="80" rx="3" fill="${T.menu}"/><rect x="252" y="96" width="136" height="14" rx="3" fill="${T.clerkCap}"/>`, `<rect x="252" y="96" width="136" height="80"/>`)
    + `<text data-art-text="" x="320" y="106.8" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.cutRim}" letter-spacing="3">便當 菜單</text>`
    + menuItems.map(([x, y, name]) => `<rect x="${x}" y="${y}" width="22" height="16" rx="2" fill="${C.printWhite}"/><ellipse cx="${x + 11}" cy="${y + 9}" rx="7" ry="4.6" fill="${C.ochre}" opacity=".7"/>`
      + `<text data-art-text="" x="${x + 26}" y="${y + 12}" font-family="'Noto Serif TC'" font-weight="700" font-size="8" fill="${T.menuChalk}">${name}</text>`).join('')
    + `<circle cx="296" cy="152" r="13" fill="${mixHex(T.menu, C.cutRim, 0.12)}"/>`;
  const noren = depth(ctx, 2, `<rect x="250" y="56" width="140" height="6" fill="${T.cartWoodDeep}"/>${[0, 1, 2, 3].map((i) => `<path d="M${254 + i * 34} 62h31v26q-15 5 -31 0z" fill="${T.noren}"/>`).join('')}`, `<rect x="250" y="56" width="140" height="34"/>`)
    + `<text data-art-text="" x="288" y="80" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="12" fill="${C.washi}">便</text><text data-art-text="" x="356" y="80" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="12" fill="${C.washi}">當</text>`;
  const counter = depth(ctx, 3, `<rect x="296" y="242" width="100" height="58" fill="${T.counter}"/><rect x="292" y="238" width="108" height="6" rx="2" fill="${T.counterTop}"/>`
    + `<path d="M300 256h96M300 276h96" stroke="${T.cartWoodDeep}" stroke-width="1.2" opacity=".5"/>`, `<rect x="292" y="238" width="108" height="62"/>`);
  // The rice cooker steaming on the back shelf, a stack of bento boxes
  const cooker = depth(ctx, 3, `<rect x="362" y="206" width="26" height="22" rx="5" fill="${T.lift}"/><rect x="360" y="202" width="30" height="6" rx="3" fill="${T.liftDeep}"/>`, `<rect x="360" y="202" width="30" height="26"/>`)
    + `<path d="M370 198q-6 -8 0 -16q6 -8 0 -16M380 198q-5 -7 0 -14" stroke="${T.steam}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
  const stack = depth(ctx, 3, [0, 1, 2].map((i) => `<rect x="${262 + i * 2}" y="${226 - i * 9}" width="26" height="8" rx="1.5" fill="${i % 2 ? T.bentoBand : T.bentoBox}"/>`).join(''), `<rect x="262" y="208" width="30" height="26"/>`);
  const corridor = sandWall(ctx, 40, -20, 188, 80) + stationSign(ctx, 46, 96, 96, 30, '↓ B1 便當', '', 12)
    + `<path d="M-20 40H188" stroke="${T.sandDeep}" stroke-width="3"/>`;
  // The elevator shaft: dark, cut open, its two cables, the door frames and floor plates at 1F and B1
  const shaft = `<rect x="186" y="40" width="66" height="${GUTTER_Y - 40}" fill="${ref(ctx, 'shaftG')}"/>`
    + `<path d="M204 40V${GUTTER_Y}M232 40V${GUTTER_Y}" stroke="${T.steelDeep}" stroke-width="1.4"/>`
    + `<rect x="186" y="40" width="66" height="10" fill="${C.printDark}"/><circle cx="204" cy="45" r="4" fill="${T.steel}"/><circle cx="232" cy="45" r="4" fill="${T.steel}"/>`
    + stationSign(ctx, 190, 170, 26, 18, '1F', '', 10);
  // The floor slab between 1F and B1, cut through (hatched) where no shop floor covers it
  let hatch = '';
  for (let x = -60; x < 190; x += 9) hatch += `M${x} 352L${x + 52} 300`;
  const slab = `<clipPath id="${ctx.id('slabClip')}"><rect x="-20" y="300" width="206" height="52"/></clipPath><rect x="-20" y="300" width="206" height="52" fill="${T.sandShade}"/>`
    + `<g clip-path="url(#${ctx.id('slabClip')})"><path d="${hatch}" stroke="${T.sandDeep}" stroke-width="1" opacity=".55"/></g><rect x="-20" y="300" width="206" height="10" fill="${T.shopTile}"/><path d="M-20 300.5H186" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`;
  const back = corridor + shaft
    + tiles(252, PAGE_W + 20, 176, 300) + `<rect x="252" y="40" width="${PAGE_W - 232}" height="136" fill="${ref(ctx, 'sandWall')}"/>`
    + noren + menu + cooker + stack + clerk(ctx, 374, 236) + counter
    + `<ellipse cx="320" cy="250" rx="110" ry="70" fill="${ref(ctx, 'warmPoolS')}" opacity=".6"/>`
    + slab + `<rect x="252" y="300" width="${PAGE_W - 232}" height="60" fill="${T.sandShade}"/>`
    + `<rect x="-20" y="0" width="${PAGE_W + 40}" height="40" fill="${T.ceiling}"/><rect x="-20" y="36" width="${PAGE_W + 40}" height="4" fill="${T.sandDeep}"/>`
    + softEllipse(ctx, 80, 20, 40, 8, 'lamp', 0.22) + softEllipse(ctx, 320, 20, 50, 8, 'lamp', 0.26);
  // B1 on the floor page: the tiled corridor wall (painted standing), the shaft going on down, the rack
  const b1 = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="84" fill="${T.shopTile}"/>`
    + (() => { let d = ''; for (let y = GUTTER_Y + 12; y < 444; y += 12) d += `M-40 ${y}H430`; return `<path d="${d}" stroke="${T.shopTileLine}" stroke-width=".8"/>`; })()
    + `<rect x="${FLOOR_RECT.x}" y="436" width="${FLOOR_RECT.w}" height="8" fill="${T.sandDeep}"/>`
    + terrazzoFloor(ctx, 23).replace(`y="${GUTTER_Y}"`, 'y="444"')
    + `<rect x="186" y="${GUTTER_Y}" width="66" height="134" fill="${ref(ctx, 'shaftG')}"/><path d="M204 ${GUTTER_Y}V494M232 ${GUTTER_Y}V494" stroke="${T.steelDeep}" stroke-width="1.4"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="22" fill="${C.shadow}" opacity=".25"/>`)
    + stationSign(ctx, 150, 380, 30, 18, 'B1', '', 10)
    + depth(ctx, 3, `<path d="M292 430V482M344 430V482" stroke="${T.steelDeep}" stroke-width="3"/><rect x="286" y="430" width="64" height="5" rx="1.5" fill="${T.steel}"/><rect x="286" y="456" width="64" height="4" rx="1.5" fill="${T.steel}"/>`
      + `<rect x="292" y="440" width="22" height="16" rx="2" fill="${C.kraft}"/><rect x="318" y="444" width="26" height="12" rx="2" fill="${T.bentoBand}"/><rect x="296" y="462" width="44" height="18" rx="3" fill="${C.washi}"/>`
      + `<text data-art-text="" x="318" y="475" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${T.cartWoodDeep}">米</text>`, `<rect x="286" y="430" width="64" height="52"/>`);
  // On B1's floor: painted arrows to the lift, and delivery crates of 便當 waiting to go up
  const arrows = `<path d="M40 600h56l-8 -8M96 600l-8 8M132 600h40l-8 -8M172 600l-8 8" stroke="${C.ochre}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>`
    + `<text data-art-text="" x="66" y="628" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="13" fill="${C.ochre}" opacity=".75">電梯</text>`;
  const crate = (x: number, y: number) => depth(ctx, 4, `<rect x="${x}" y="${y}" width="58" height="28" rx="2" fill="${ref(ctx, 'corr')}"/><rect x="${x}" y="${y}" width="58" height="6" fill="${C.corrugatedLip}"/>`
    + `<rect x="${x + 16}" y="${y + 10}" width="26" height="12" rx="2" fill="${C.washi}"/><text data-art-text="" x="${x + 29}" y="${y + 20}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${T.awningRed}">便當</text>`, `<rect x="${x}" y="${y}" width="58" height="28"/>`);
  return stationDefs(ctx) + standingPage(ctx, back) + b1 + arrows + crate(296, 604) + crate(326, 576) + crate(282, 576) + bookCues(ctx) + block();
};

// ——— 1-6 「台鐵便當」 (spread) ———

/**
 * The bento spread (1-6), a centrefold (the spine is live): the concourse on the left page — its
 * sandstone wall, the 出口 sign over the exit gate, the hanging station clock (the `clock` perch, its
 * top at (120, 226)) — and the platform on the right page under the night sky: the canopy and its
 * roof beam (the pigeon's perch at (300, 196)), a cream 台鐵 train standing at the platform with
 * lit windows (the 土地公 shows in one at (300, 330) when the cart is back by the kitchen), a 便當
 * lantern, and the track the bento cart runs on.
 */
const bentoSpread: BackdropDraw = (ctx) => {
  // Left page: the concourse
  const left = sandWall(ctx, 52, -20, 196, 74) + concourseCeiling(ctx, [[80, 88, '出口 ↗', 'Exit']]).replace(`width="${PAGE_W + 40}"`, 'width="216"')
    + `<path d="M120 54V214" stroke="${T.steelDeep}" stroke-width="2.4"/>` + stationClock(ctx, 120, 250, 22)
    + `<ellipse cx="100" cy="300" rx="130" ry="70" fill="${ref(ctx, 'warmPoolS')}" opacity=".55"/>`;
  // Right page: sky, canopy, beam, the train
  const rid = ctx.id('rightPage');
  const trainY = 250;
  const twins = Array.from({ length: 5 }, (_, i) => 206 + i * 38);
  const train = depth(ctx, 2, `<rect x="196" y="${trainY}" width="214" height="110" fill="${T.trainCream}"/><rect x="196" y="${trainY}" width="214" height="10" fill="${T.trainCreamShade}"/>`
    + `<rect x="196" y="${trainY + 82}" width="214" height="9" fill="${T.trainBlue}"/><rect x="196" y="${trainY + 92}" width="214" height="2.6" fill="${T.trainLine}"/>`
    + twins.map((x) => `<rect x="${x}" y="${trainY + 46}" width="28" height="30" rx="3" fill="${ref(ctx, 'window')}" opacity=".7"/>`).join('')
    + `<rect x="358" y="${trainY + 24}" width="30" height="58" rx="2" fill="${T.trainCreamShade}"/><path d="M373 ${trainY + 24}V${trainY + 82}" stroke="${T.steelDeep}" stroke-width="1"/>`, `<rect x="196" y="${trainY}" width="214" height="110"/>`);
  const canopy = depth(ctx, 3, `<path d="M190 150H410V190H190Z" fill="${T.navyDeep}"/><path d="${Array.from({ length: 12 }, (_, i) => `M${194 + i * 18} 152V188`).join('')}" stroke="${T.navyLight}" stroke-width="2" opacity=".6"/>`
    + `<rect x="190" y="190" width="220" height="10" fill="${ref(ctx, 'steelG')}"/><path d="M236 200V360M348 200V360" stroke="${T.steelDeep}" stroke-width="5"/>`, `<path d="M190 150H410V200H190Z"/>`)
    + softEllipse(ctx, 270, 210, 40, 10, 'lamp', 0.22) + softEllipse(ctx, 340, 210, 40, 10, 'lamp', 0.22);
  const lantern = `<path d="M378 200v10" stroke="${C.printDark}" stroke-width="1"/>` + softEllipse(ctx, 378, 226, 16, 18, 'lamp', 0.2)
    + depth(ctx, 3, `<ellipse cx="378" cy="226" rx="11" ry="15" fill="${H.lantern}"/><path d="M370 212h16M370 240h16" stroke="${C.printDark}" stroke-width="2.4"/>`, `<ellipse cx="378" cy="226" rx="11" ry="15"/>`)
    + `<text data-art-text="" x="378" y="230" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.washi}">便當</text>`;
  const right = `<clipPath id="${rid}"><rect x="195" y="0" width="230" height="${GUTTER_Y}"/></clipPath><g clip-path="url(#${rid})">`
    + `<rect x="190" y="0" width="230" height="${GUTTER_Y}" fill="${ref(ctx, 'sky')}"/>` + pinholes(ctx, 195, 0, 200, 140, 26, 41)
    + calmMoon(ctx, 342, 64, 18, { halo: 0.08 }) + train + canopy + lantern
    + `<rect x="190" y="${GUTTER_Y - 30}" width="230" height="30" fill="${ref(ctx, 'lampWashS')}"/></g>`;
  return stationDefs(ctx) + standingPage(ctx, left + right)
    + floorPage(ctx, terrazzoFloor(ctx, 31) + `<rect x="195" y="${GUTTER_Y}" width="240" height="${FLOOR_RECT.h}" fill="${C.printDark}" opacity=".18"/>`
      + pools(ctx, [[100, GUTTER_Y + 40, 140, 40], [300, GUTTER_Y + 30, 120, 36]]))
    + bookCues(ctx) + block();
};

export const C1_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'c1/car': car,
  'c1/hall-night': hallNight,
  'c1/gates': gates,
  'c1/hall': hall,
  'c1/bento-shop': bentoShop,
  'c1/bento-spread': bentoSpread,
};

// ——— Chapter 1's parts (#108) ———

/** 1-1's folded city map on the rack (a pushable Mocha knocks onto the sleeper's face): paper panels, a red route. */
const cityMap: PartSource = {
  preset: 'pushable',
  states: ['onPerch'],
  box: { x: -20, y: -16, w: 40, h: 32 },
  draw(ctx) {
    const d = 'M-14 -9l9 -2l9 2l9 -2v18l-9 2l-9 -2l-9 2z';
    return softEllipse(ctx, 1, 11, 13, 2.6, 'shadow', 0.4)
      + depth(ctx, 4, `<path d="${d}" fill="${C.washi}"/><path d="M-5 -11v18M4 -9v18" stroke="${C.pageEdge}" stroke-width="1"/>`
        + `<path d="M-5 -11l9 2v18l-9 -2z" fill="${C.shadow}" opacity=".1"/>`
        + `<path d="M-11 4q6 -10 12 -4t10 -6" stroke="${C.seal}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M-10 -4q8 4 22 -2" stroke="${T.bannan}" stroke-width="1.4" fill="none"/>`
        + `<circle cx="9" cy="-6" r="1.8" fill="${C.seal}"/>`, `<path d="${d}"/>`);
  },
};

/** 1-3's transit card on the 服務台 (a pushable onto the reader): unbranded, a moon over the blue line. */
const transitCard: PartSource = {
  preset: 'pushable',
  states: ['onPerch'],
  box: { x: -20, y: -16, w: 40, h: 32 },
  draw(ctx) {
    const d = 'M-14 -9h28a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-28a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3z';
    return softEllipse(ctx, 1, 10, 14, 2.4, 'shadow', 0.4)
      + `<g transform="rotate(-6)">` + depth(ctx, 4, `<path d="${d}" fill="${T.card}"/><path d="M-17 3q16 -8 34 -2v3q-18 -5 -34 3z" fill="${T.cardLight}"/>`
        + `<path d="M-6 -6a5 5 0 1 0 5 7a4 4 0 1 1 -5 -7z" fill="${C.moon}"/><rect x="5" y="-5" width="7" height="5" rx="1" fill="${C.ochre}"/>`, `<path d="${d}"/>`) + `</g>`;
  },
};

/**
 * 1-3's card reader (a weight `button`; the card lands on it, 「嗶！」): a teal pad on a steel post.
 * Down, the card lies on it and its ring lights up. Local origin at the hit centre (120, 390) = the
 * pad's top; the post stands to the walkway (y 430).
 */
const cardReader: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -24, y: -22, w: 48, h: 66 },
  draw(ctx, state) {
    const down = state === 'down';
    return depth(ctx, 3, `<rect x="-4" y="6" width="8" height="34" fill="${ref(ctx, 'steelG')}"/><rect x="-12" y="38" width="24" height="5" rx="2" fill="${T.steelDeep}"/>`
      + `<rect x="-16" y="-6" width="32" height="14" rx="4" fill="${T.gate}"/><ellipse cx="0" cy="-5" rx="14" ry="5" fill="${T.reader}"/>`, `<rect x="-16" y="-10" width="32" height="18"/><rect x="-4" y="6" width="8" height="37"/>`)
      + (down ? softEllipse(ctx, 0, -5, 16, 8, 'lamp', 0.3) + `<ellipse cx="0" cy="-5" rx="12" ry="4" fill="none" stroke="${T.readerLight}" stroke-width="1.6"/>` : `<ellipse cx="0" cy="-5" rx="9" ry="3" fill="none" stroke="${T.readerLight}" stroke-width="1" opacity=".55"/>`);
  },
};

/**
 * A fare gate (1-3, 1-4, 1-6; 嗶！ opens it): two navy cabinets with cream tops and lamps either side
 * of the way, red paddles meeting between them when closed, folded into the cabinets when open (a
 * green arrow lit). Local origin at the hit centre = the doorway node, the gate standing on y 0.
 */
const fareGate: PartSource = {
  preset: 'gate',
  states: ['closed', 'open'],
  box: { x: -34, y: -72, w: 68, h: 80 },
  draw(ctx, state) {
    const open = state === 'open';
    const cab = (x: number) => `<rect x="${x}" y="-62" width="14" height="62" rx="2" fill="${T.gate}"/><rect x="${x - 1}" y="-64" width="16" height="6" rx="2" fill="${T.gateTop}"/>`
      + `<rect x="${x + 3}" y="-50" width="8" height="10" rx="1.5" fill="${T.gateDeep}"/>`;
    const paddles = open
      ? `<path d="M-14 -46h5v20h-5zM9 -46h5v20h-5z" fill="${T.paddle}" opacity=".85"/>`
      : `<path d="M-14 -46h13q2 10 0 20h-13zM14 -46h-13q-2 10 0 20h13z" fill="${T.paddle}" opacity=".9"/><path d="M-1 -46v20M1 -46v20" stroke="${T.paddleDeep}" stroke-width="1"/>`;
    const lamp = (x: number) => open
      ? `<path d="M${x - 3} -66l3 -4l3 4M${x} -70v6" stroke="${T.lampGo}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
      : `<path d="M${x - 2.6} -69.6l5.2 5.2M${x + 2.6} -69.6l-5.2 5.2" stroke="${T.lampStop}" stroke-width="1.6" stroke-linecap="round"/>`;
    return depth(ctx, 3, cab(-28) + cab(14) + paddles, `<rect x="-29" y="-64" width="58" height="64"/>`)
      + softEllipse(ctx, -21, -67, 6, 4, 'lamp', open ? 0.3 : 0.15) + softEllipse(ctx, 21, -67, 6, 4, 'lamp', open ? 0.3 : 0.15)
      + lamp(-21) + lamp(21);
  },
};

/**
 * 1-3's floor-cleaning robot (a prop; his 嗶！ sets it spinning): a pearl disc with a teal eye strip
 * and a friendly face, little side brushes; `spin` — happy eyes, swirl arcs and bubbles. Its lid
 * (the `robotLid` perch, (226, 488)) is 40 above the part's centre (230, 528).
 */
const robot: PartSource = {
  preset: 'prop',
  states: ['idle', 'spin'],
  box: { x: -46, y: -54, w: 92, h: 76 },
  draw(ctx, state) {
    const spin = state === 'spin';
    const body = 'M-30 -38a30 7 0 0 1 60 0v18a30 7 0 0 1 -60 0z';
    const eyes = spin
      ? `<path d="M-9 -28q3 -4 6 0M3 -28q3 -4 6 0" stroke="${C.ink}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
      : `<circle cx="-6" cy="-28" r="1.8" fill="${C.ink}"/><circle cx="6" cy="-28" r="1.8" fill="${C.ink}"/>`;
    const arcs = spin ? `<g stroke="${C.chalk}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".85"><path d="M-40 -14q-6 -18 10 -30"/><path d="M40 -40q8 18 -8 30"/></g>`
      + `<g fill="${C.vellum}" opacity=".8"><circle cx="-38" cy="-2" r="3"/><circle cx="34" cy="0" r="2.4"/><circle cx="-30" cy="6" r="1.8"/></g>` : '';
    return softEllipse(ctx, 0, -12, 32, 5, 'shadow', 0.45)
      + `<path d="M-30 -14l-10 6M30 -14l10 6" stroke="${T.robotShade}" stroke-width="2" stroke-linecap="round"/>`
      + depth(ctx, 4, `<path d="${body}" fill="${T.robot}"/><ellipse cx="0" cy="-38" rx="30" ry="7" fill="${mixHex(T.robot, C.cutRim, 0.5)}"/>`
        + `<rect x="-14" y="-33" width="28" height="9" rx="4.5" fill="${T.robotEye}"/><path d="M-30 -22a30 7 0 0 0 60 0" stroke="${T.robotShade}" stroke-width="1.6" fill="none"/>`
        + `<circle cx="18" cy="-38" r="2.2" fill="${T.readerLight}"/>`, `<path d="${body}"/>`)
      + `<rect x="-11" y="-31" width="22" height="5" rx="2.5" fill="${C.cutRim}" opacity=".85"/>` + eyes
      + `<circle cx="-12" cy="-24" r="1.8" fill="${S.blush}" opacity=".6"/><circle cx="12" cy="-24" r="1.8" fill="${S.blush}" opacity=".6"/>` + arcs;
  },
};

/**
 * 1-4's turntable (a wheel, 4 states; 轉): the hall's checker printed on a round disk with the aisle's
 * cream runner across it and travellers sitting on the squares either side (bible § 6: "the 1-4
 * turntable"), ringed by the marigold knurled rim (its grip, the one marigold it wears). The view turns
 * each state's bitmap by the state's angle, so every state draws the disk unturned; state `2` (the disk
 * half round) shows the 土地公 in his station cap among the travellers, drawn upside down here so he
 * sits upright at (248, 528) once turned. Pivot at the centre (195, 495), radius 76.
 */
const turntable: PartSource = {
  preset: 'wheel',
  states: ['0', '1', '2', '3'],
  pivot: [0, 0],
  box: { x: -90, y: -90, w: 180, h: 180 },
  draw(ctx, state) {
    const r = 76;
    const cid = ctx.id(`disk${state}`);
    let checks = '';
    const cell = 19;
    for (let i = -4; i < 4; i++) for (let j = -4; j < 4; j++) if ((i + j) % 2 === 0) checks += `M${i * cell} ${j * cell}h${cell}v${cell}h${-cell}z`;
    const people = [
      seatedTop(-50, -30, 10, T.packer, S.hair, T.backpack), seatedTop(-12, -36, -6, C.printLilacDeep, T.packerHair, T.bentoBand),
      seatedTop(30, -30, 4, H.dadShirt, S.hair, C.kraft), seatedTop(-34, 32, 170, H.floral, S.hair, T.card),
      seatedTop(14, 36, 186, T.priority, S.hair, C.washi),
    ].join('');
    // The 土地公 traveller (state 2 only): at (-53, -33), turned 180° so he reads upright when the disk is
    const tdg = state === '2' ? `<g transform="translate(-53 -33) rotate(180) rotate(14) scale(1.2)">${tudigong(ctx, '站務帽')}</g>` : seatedTop(-53, -33, 0, C.printLilac, S.hair, C.kraft);
    const disk = `<clipPath id="${cid}"><circle r="${r - 6}"/></clipPath>`
      + `<circle r="${r - 6}" fill="${T.checkLight}"/><g clip-path="url(#${cid})"><path d="${checks}" fill="${T.checkDark}" opacity=".55"/>`
      + `<rect x="${-r}" y="-11" width="${2 * r}" height="22" fill="${C.washi}" opacity=".9"/><path d="M${-r} -11H${r}M${-r} 11H${r}" stroke="${T.sandShade}" stroke-width="1.2"/>`
      + `<path d="M-40 0l6 -5v10zM34 0l6 -5v10z" fill="${T.sandShade}"/>${people}</g>`;
    const rim = wheelRim(r, 28);
    return depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/>${disk}`
      + `<circle r="${r - 6}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1.4" opacity=".6"/><circle r="${r - 4}" fill="none" stroke="${C.marigoldShine}" stroke-width="1" opacity=".6"/>`, `<path d="${rim}"/>`)
      + tdg;
  },
};

/**
 * 1-5's elevator car (a lift between B1 and 1F; it slides with the part): a steel cabin cut open at
 * the front, its floor at the origin (the riding node `E`), a lit ceiling, a handrail, the doors
 * folded back at its sides. The panel (`c1/elevator-panel`) rides it separately.
 */
const elevator: PartSource = {
  preset: 'lift',
  states: ['B1', '1F'],
  box: { x: -36, y: -104, w: 72, h: 118 },
  draw(ctx) {
    const cabin = 'M-30 6V-92h60V6Z';
    return depth(ctx, 3, `<path d="${cabin}" fill="${T.liftDeep}"/><rect x="-26" y="-88" width="52" height="88" fill="${mixHex(T.lift, C.shadow, 0.18)}"/>`
      + `<rect x="-30" y="-98" width="60" height="8" rx="2" fill="${T.lift}"/><rect x="-22" y="-88" width="44" height="4" fill="${C.lampHot}"/>`
      + `<path d="M-24 -40H24" stroke="${T.steel}" stroke-width="2.4"/><rect x="-30" y="0" width="60" height="8" fill="${T.steelDeep}"/>`
      + `<path d="M-30 -92V6M30 -92V6" stroke="${T.steel}" stroke-width="3"/>`, `<path d="${cabin}"/>`)
      + softEllipse(ctx, 0, -84, 22, 6, 'lamp', 0.3);
  },
};

/**
 * 1-5's call panel inside the car (a weight `button` Mocha sits on; it rides the car): a steel plate
 * with ▲ and ▼ buttons; pressed (`down`), one is lit. Mocha sits on its top (local y 0, the hit centre).
 */
const elevatorPanel: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -16, y: -4, w: 32, h: 44 },
  draw(ctx, state) {
    const down = state === 'down';
    return depth(ctx, 3, `<rect x="-10" y="0" width="20" height="34" rx="3" fill="${T.lift}"/><rect x="-11" y="-1" width="22" height="4" rx="2" fill="${T.liftDeep}"/>`, `<rect x="-11" y="-1" width="22" height="35"/>`)
      + `<circle cx="0" cy="12" r="5" fill="${down ? C.lampHot : T.liftDeep}"/><path d="M-2.6 13.4l2.6 -4l2.6 4z" fill="${down ? C.lampAmber : T.lift}"/>`
      + `<circle cx="0" cy="25" r="5" fill="${T.liftDeep}"/><path d="M-2.6 23.6l2.6 4l2.6 -4z" fill="${T.lift}"/>`
      + (down ? softEllipse(ctx, 0, 12, 7, 7, 'lamp', 0.4) : '');
  },
};

/** 1-5's 叮咚 desk bell on the counter (Mocha sits on it; tapping him rings it): a silver dome; `down` rings (chime marks). */
const counterBell: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -24, y: -14, w: 48, h: 30 },
  draw(ctx, state) {
    const down = state === 'down';
    return depth(ctx, 3, `<path d="M-12 10q0 -12 12 -12q12 0 12 12z" fill="${ref(ctx, 'silver')}"/><rect x="-15" y="9" width="30" height="4" rx="2" fill="${T.steelDeep}"/>`
      + `<rect x="-1.6" y="-5" width="3.2" height="4" fill="${T.steelDeep}"/>`, `<path d="M-15 13V9q3 -11 15 -11q12 0 15 11v4z"/>`)
      + (down ? `<g stroke="${C.chalk}" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".85"><path d="M-18 -4l-4 -3M18 -4l4 -3M-16 2h-5M16 2h5"/></g>` : '');
  },
};

/** 1-6's giant bento lid (a flap riding the cart): the kraft 便當 sleeve with its red band (unbranded) and a moon stamp. */
const bentoLid: PartSource = (() => {
  const { w, h } = flapSize(56, 56);
  const face = (ctx: KitCtx) => `<rect width="${w}" height="${h}" fill="${ref(ctx, 'kraft')}"/>` + paperFibres(0, 0, w, h, 16, C.kraftFiber, 71, 0.3)
    + `<rect y="${h * 0.42}" width="${w}" height="${h * 0.22}" fill="${T.awningRed}"/>`
    + `<text data-art-text="" x="${w * 0.42}" y="${f1(h * 0.42 - 3)}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="11" fill="${T.navyDeep}">便當</text>`
    + `<circle cx="${w * 0.3}" cy="${h * 0.84}" r="4" fill="none" stroke="${C.seal}" stroke-width="1"/>`;
  return bakedFlap(w, h, face, kraftBack(w, h, 73));
})();

export const C1_PARTS: Readonly<Record<string, PartSource>> = {
  'c1/departure-board': departureBoard,
  'c1/map': cityMap,
  'c1/card': transitCard,
  'c1/reader': cardReader,
  'c1/gate': fareGate,
  'c1/robot': robot,
  'c1/turntable': turntable,
  'c1/elevator': elevator,
  'c1/elevator-panel': elevatorPanel,
  'c1/counter-bell': counterBell,
  'c1/bento-lid': bentoLid,
};
