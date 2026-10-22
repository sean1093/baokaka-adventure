import { POPUP as C, POPUP_HOME_DAY as D, POPUP_ENDING_SCENES as E, mixHex } from '../../../art/palette';
import { depth, f1, grain, pageBlock, ref, seeded, softEllipse, sparkle, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorWiden } from '../../view/geometry';
import { treasureArt } from '../../view/photo/treasureArt';
import { adult, circle, join, scaled, type Cut, type Look, type Pose } from '../../view/art/market';
import { figure } from '../../view/art/ximen';
import { ungradeSvg } from '../grade';
import type { BackdropDraw } from '../sources';
import { FLOOR_RECT, bookCues, bunting, floorPage, lin, paperFibres, rad, standingPage } from './common';

/**
 * 尾聲 (page E 「抓周」, 10:00, #135) environment art, baked by `npm run bake:popup`. The prologue's
 * home, the morning after: the same rose washi walls, honey boards, teal sofa and 巧拼 play-mat as
 * the night of chapter 0 — now in sunlight — and the family, at last, in the room.
 *
 * **The kit** (`POPUP_HOME_DAY`): the only daytime page. Pale rose walls, the window full of a
 * summer sky over the lane, the sun's patches on the boards, the red lacquer 抓周盤 with its gold rim
 * and all ten treasures on it. **Screen colours** (D-99): the 10:00 grade lifts everything ×1.8, so
 * the backdrop is passed through `ungradeSvg` and lands on the kit after the bake.
 *
 * The family stand behind the mat as paper die-cuts (the cast's grown-up, `adult`; GDD § 6 risk 11:
 * generic, warm and simple): 阿嬤 in her red cardigan cheering, 媽媽 with her hands together, 爸爸
 * filming on his phone.
 */

/** The page block under the floor page. */
const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};

/** A 尾聲 backdrop: drawn in screen colours, the 10:00 grade divided out for the bake (D-99). */
const screen = (draw: BackdropDraw): BackdropDraw => (ctx, def) => ungradeSvg(draw(ctx, def), 11);

const serif = (x: number, y: number, size: number, fill: string, text: string, extra = '') =>
  `<text data-art-text="" x="${f1(x)}" y="${f1(y)}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${size}" fill="${fill}"${extra}>${text}</text>`;

/** The day home's gradients. */
export function dayDefs(ctx: KitCtx): string {
  return `<defs>`
    + lin(ctx, 'dayWall', [[0, D.wallTop], [0.6, D.wallMid], [1, D.wallLow]])
    + lin(ctx, 'dayWainscot', [[0, D.wainscotLit], [0.25, D.wainscot], [1, D.wainscotDeep]])
    + lin(ctx, 'dayBoards', [[0, mixHex(D.board, D.wainscotDeep, 0.3)], [0.35, D.board], [1, D.boardLight]])
    + lin(ctx, 'daySky', [[0, D.sky], [1, D.skyLow]])
    + lin(ctx, 'daySofa', [[0, D.sofaLight], [1, D.sofaDeep]])
    + lin(ctx, 'dayTeak', [[0, D.teak], [1, D.teakDeep]])
    + lin(ctx, 'lacquer', [[0, D.lacquerLight], [0.5, D.lacquer], [1, D.lacquerDeep]])
    + rad(ctx, 'sunWash', [[0, D.sunPatch, 0.7], [1, D.sunPatch, 0]])
    + `</defs>`;
}

/** The washi wallpaper in daylight: the wall's gradient and its little cream print. */
function dayWallpaper(ctx: KitCtx, x: number, y: number, w: number, h: number): string {
  const pid = ctx.id('dayPrint');
  const flower = (cx: number, cy: number, s: number) =>
    `<g transform="translate(${cx} ${cy})"><circle cy="${-s}" r="${s * 0.8}"/><circle cy="${s}" r="${s * 0.8}"/><circle cx="${-s}" r="${s * 0.8}"/><circle cx="${s}" r="${s * 0.8}"/></g>`;
  return `<defs><pattern id="${pid}" width="34" height="34" patternUnits="userSpaceOnUse"><g fill="${D.wallPrint}">${flower(8.5, 8.5, 2)}${flower(25.5, 25.5, 2)}<circle cx="25.5" cy="8.5" r=".9"/><circle cx="8.5" cy="25.5" r=".9"/></g></pattern></defs>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'dayWall')}"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${pid})" opacity=".55"/>`
    + paperFibres(x, y, w, h, 60, D.wallPrint, 3, 0.4);
}

/** The wainscot from `y0` to the gutter, lit by the morning. */
function dayWainscot(ctx: KitCtx, y0: number): string {
  const [x0, x1] = [-20, PAGE_W + 20];
  const h = GUTTER_Y - y0;
  let panels = '';
  for (let x = x0 + 22; x < x1 - 30; x += 64) panels += `M${x} ${y0 + 14}h50v${h - 34}h-50Z`;
  return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${h}" fill="${ref(ctx, 'dayWainscot')}"/>`
    + `<path d="${panels}" fill="${D.wainscotDeep}" opacity=".22"/><path d="${panels}" fill="none" stroke="${D.wainscotLit}" stroke-width="1" opacity=".5" transform="translate(-.8 -.8)"/>`
    + `<rect x="${x0}" y="${y0 - 4}" width="${x1 - x0}" height="7" fill="${D.wainscotLit}"/><path d="M${x0} ${y0 - 3.5}H${x1}" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`
    + `<rect x="${x0}" y="${GUTTER_Y - 9}" width="${x1 - x0}" height="9" fill="${D.skirting}"/>`;
}

/** The honey floorboards in the sun, converging on the vanishing point, with the window's light on them. */
function dayFloor(ctx: KitCtx, sun: string): string {
  const { x, y, w, h } = FLOOR_RECT;
  const k = (FLOOR_BOTTOM - GUTTER_Y) / (GUTTER_Y + 360);
  const r = seeded(29);
  let seams = '';
  let joints = '';
  for (let bx = -100; bx <= PAGE_W + 100; bx += 28) {
    seams += `M${f1(bx)} ${GUTTER_Y}L${f1(bx + (bx - 195) * k)} ${FLOOR_BOTTOM}`;
    for (let j = 0; j < 3; j++) {
      const t = 0.08 + r() * 0.9;
      const yy = GUTTER_Y + (FLOOR_BOTTOM - GUTTER_Y) * t;
      joints += `M${f1(bx + (bx - 195) * k * t)} ${f1(yy)}h${f1((28 + 56 * k * t) * 0.98)}`;
    }
  }
  return floorPage(ctx, `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'dayBoards')}"/>`
    + `<path d="${seams}" stroke="${D.boardSeam}" stroke-width="1.1" opacity=".55" fill="none"/>`
    + `<path d="${joints}" stroke="${D.boardSeam}" stroke-width=".9" opacity=".45" fill="none"/>`
    + `<path d="${seams}" stroke="${C.cutRim}" stroke-width=".6" opacity=".25" fill="none" transform="translate(1.2 0)"/>`
    + sun
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'hatch')}" opacity=".08"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="26" fill="${C.shadow}" opacity=".12"/>`);
}

// ——— The window: the lane at 10:00, the little 土地公 shrine ———

/** Where the shrine's niche is through the window: the live 土地公 statue sits in it (page E's `tudigong`). */
export const SHRINE: readonly [number, number] = [236, 150];

/**
 * The lane through the window on a summer morning: a deep sky with a cumulus, the houses across
 * the lane (pale tile, iron grilles, a water tank, potted plants), a tree, and the neighbourhood's
 * little 土地公 shrine — a red-roofed niche on a stone base, two lanterns, an incense burner — its
 * niche at `SHRINE` (the statue is drawn live there; he winks when tapped).
 */
function laneByDay(ctx: KitCtx, g: { x: number; y: number; w: number; h: number }): string {
  const id = ctx.id('dayLane');
  const base = g.y + g.h;
  const [sx, sy] = SHRINE;
  const cloud = (cx: number, cy: number, s: number) =>
    `<path d="M${f1(cx - 30 * s)} ${f1(cy)}q${f1(-2 * s)} ${f1(-14 * s)} ${f1(14 * s)} ${f1(-14 * s)}q${f1(4 * s)} ${f1(-14 * s)} ${f1(20 * s)} ${f1(-12 * s)}q${f1(14 * s)} ${f1(-4 * s)} ${f1(20 * s)} ${f1(10 * s)}q${f1(14 * s)} 0 ${f1(14 * s)} ${f1(16 * s)}Z" fill="${D.cloud}"/>`
    + `<path d="M${f1(cx - 28 * s)} ${f1(cy - 2)}H${f1(cx + 40 * s)}" stroke="${D.skyLow}" stroke-width="${f1(3 * s)}" opacity=".7"/>`;
  // The houses across the lane: two pale walls with windows and grilles, a water tank, potted plants
  const houses = `<path d="M${g.x - 4} ${base}V${g.y + 96}H${sx - 30}V${base}Z" fill="${D.house}"/>`
    + `<path d="M${sx + 30} ${base}V${g.y + 84}H${g.x + g.w + 4}V${base}Z" fill="${mixHex(D.house, D.wallTop, 0.3)}"/>`
    + `<path d="M${g.x - 4} ${g.y + 96}H${sx - 30}M${sx + 30} ${g.y + 84}H${g.x + g.w + 4}" stroke="${D.houseShade}" stroke-width="4"/>`
    + `<rect x="${g.x + 6}" y="${g.y + 110}" width="22" height="18" fill="${D.sky}" opacity=".7"/><rect x="${sx + 44}" y="${g.y + 100}" width="26" height="20" fill="${D.sky}" opacity=".7"/>`
    + `<path d="${Array.from({ length: 6 }, (_, i) => `M${g.x + 7 + i * 4} ${g.y + 108}v22`).join('')}${Array.from({ length: 7 }, (_, i) => `M${sx + 45 + i * 4} ${g.y + 98}v24`).join('')}" stroke="${D.ironGrille}" stroke-width="1.1"/>`
    + `<rect x="${sx + 90}" y="${g.y + 66}" width="22" height="18" rx="3" fill="${D.houseShade}"/><path d="M${sx + 92} ${g.y + 84}v6M${sx + 110} ${g.y + 84}v6" stroke="${D.houseTrim}" stroke-width="1.6"/>`
    + `<path d="M${sx + 40} ${g.y + 132}h40" stroke="${D.houseTrim}" stroke-width="2"/>`
    + [sx + 46, sx + 58, sx + 70].map((px, i) => `<path d="M${px - 4} ${g.y + 131}l1 -7h6l1 7z" fill="${C.kraft}"/><circle cx="${px}" cy="${g.y + 120 - i}" r="${5 + (i % 2)}" fill="${i % 2 ? D.treeDeep : D.tree}"/>`).join('');
  // A tree over the wall at the left
  const tree = `<path d="M${g.x + 30} ${base}V${g.y + 90}" stroke="${D.teakDeep}" stroke-width="4"/>`
    + `<circle cx="${g.x + 22}" cy="${g.y + 78}" r="18" fill="${D.treeDeep}"/><circle cx="${g.x + 38}" cy="${g.y + 70}" r="16" fill="${D.tree}"/><circle cx="${g.x + 12}" cy="${g.y + 66}" r="11" fill="${D.tree}"/>`;
  // The shrine: a stone base, a cream wall, a dark niche (the statue sits in it), a curved red roof with
  // upturned eaves and a little gourd on its ridge, two lanterns, an incense burner with a thread of smoke
  const roof = `M${sx - 26} ${sy - 18}q8 -2 11 -10h30q3 8 11 10q-5 1 -7 4h-38q-2 -3 -7 -4z`;
  const shrine = depth(ctx, 2, `<rect x="${sx - 20}" y="${sy - 15}" width="40" height="38" fill="${D.shrineWall}"/>`
      + `<path d="M${sx - 13} ${sy + 14}V${sy - 6}q0 -6 13 -6q13 0 13 6V${sy + 14}Z" fill="${D.shrineNiche}"/>`
      + `<path d="${roof}" fill="${D.shrineRoof}"/><path d="M${sx - 15} ${sy - 28}h30" stroke="${C.ochre}" stroke-width="1.4"/>`
      + `<circle cx="${sx}" cy="${sy - 32}" r="2.6" fill="${C.ochre}"/>`
      + `<rect x="${sx - 26}" y="${sy + 22}" width="52" height="8" fill="${mixHex(D.shrineWall, C.shadow, 0.28)}"/>`
      + `<rect x="${sx - 9}" y="${sy + 14}" width="18" height="8" rx="2" fill="${C.ochre}"/>`, `<path d="${roof}"/><rect x="${sx - 26}" y="${sy - 15}" width="52" height="45"/>`)
    + [sx - 24, sx + 24].map((lx) => `<path d="M${lx} ${sy - 14}v4" stroke="${C.printDark}" stroke-width=".8"/><ellipse cx="${lx}" cy="${sy - 5}" rx="3.6" ry="4.6" fill="${D.shrineRoof}"/><path d="M${lx - 3} ${sy - 5}h6" stroke="${C.ochre}" stroke-width=".8"/>`).join('')
    + `<path d="M${sx - 2} ${sy + 13}q-4 -8 1 -14q4 -6 -1 -12" stroke="${C.vellum}" stroke-width="1" fill="none" opacity=".75"/>`;
  return `<clipPath id="${id}"><rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}"/></clipPath>`
    + `<g clip-path="url(#${id})"><rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" fill="${ref(ctx, 'daySky')}"/>`
    + cloud(g.x + 120, g.y + 50, 1) + cloud(g.x + 30, g.y + 30, 0.6)
    + tree + houses + shrine
    + `<rect x="${g.x}" y="${base - 6}" width="${g.w}" height="6" fill="${D.houseShade}"/>`
    // The glass: two soft diagonal glints
    + `<path d="M${g.x} ${g.y + g.h * 0.55}L${g.x + g.w * 0.42} ${g.y}H${g.x + g.w * 0.55}L${g.x} ${g.y + g.h * 0.8}Z" fill="${C.cutRim}" opacity=".16"/>`
    + `</g>`;
}

/** A teak window frame round the glass with a mullion, its sill (Mocha's `sill` perch, its top at y 258). */
function dayWindow(ctx: KitCtx, g: { x: number; y: number; w: number; h: number }): string {
  const t = 8;
  const outer = `M${g.x - t} ${g.y - t}h${g.w + 2 * t}v${g.h + 2 * t}h${-(g.w + 2 * t)}Z M${g.x} ${g.y}v${g.h}h${g.w}v${-g.h}Z`;
  const mx = g.x + g.w * 0.62;
  return depth(ctx, 2, `<path d="${outer}" fill="${ref(ctx, 'dayTeak')}" fill-rule="evenodd"/><rect x="${f1(mx - 2.5)}" y="${g.y}" width="5" height="${g.h}" fill="${D.teak}"/>`
      + `<path d="M${g.x - t} ${g.y - t + 0.6}h${g.w + 2 * t}" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<path d="${outer}" fill-rule="evenodd"/>`)
    + depth(ctx, 3, `<rect x="${g.x - t - 12}" y="${g.y + g.h + t - 2}" width="${g.w + 2 * t + 24}" height="9" rx="2" fill="${D.wainscotLit}"/><path d="M${g.x - t - 4} ${g.y + g.h + t + 7}l8 9h${g.w + 2 * t - 8}l8 -9z" fill="${D.wainscotDeep}"/>`
      + `<path d="M${g.x - t - 12} ${g.y + g.h + t - 1.4}h${g.w + 2 * t + 24}" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<rect x="${g.x - t - 12}" y="${g.y + g.h + t - 2}" width="${g.w + 2 * t + 24}" height="9"/>`);
}

/** A tied-back 花布 curtain hanging from `top` at x, `w` wide and `h` long, gathered at `tie`; `dir` −1 mirrors. */
function dayCurtain(ctx: KitCtx, x: number, top: number, w: number, h: number, tie: number, dir: 1 | -1): string {
  const d = `M0 0H${w}Q${w * 0.55} ${tie - top} ${w * 0.4} ${tie - top + 4}Q${w * 0.9} ${tie - top + 30} ${w * 0.8} ${h}H${-2}Q${w * 0.15} ${tie - top + 20} 0 0Z`;
  const pid = ctx.id(`dayCurtain${dir}`);
  return `<defs><pattern id="${pid}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${D.floralGround}"/>`
    + `<circle cx="7" cy="7" r="4" fill="${D.floral}"/><circle cx="7" cy="7" r="1.6" fill="${D.floralLight}"/><path d="M12 9q4 -1 5 3q-4 1 -5 -3z" fill="${D.floralLeaf}"/>`
    + `<circle cx="17" cy="17" r="2.6" fill="${D.floralLight}" opacity=".85"/></pattern></defs>`
    + `<g transform="translate(${x} ${top}) scale(${dir} 1)">`
    + depth(ctx, 3, `<path d="${d}" fill="url(#${pid})"/><path d="M${w * 0.3} 4Q${w * 0.32} ${(tie - top) * 0.6} ${w * 0.42} ${tie - top}M${w * 0.6} 4Q${w * 0.55} ${(tie - top) * 0.6} ${w * 0.48} ${tie - top}" stroke="${C.shadow}" stroke-width="2" opacity=".22" fill="none"/>`
      + `<rect x="${w * 0.28}" y="${tie - top}" width="${w * 0.3}" height="6" rx="3" fill="${C.ochre}"/>`, `<path d="${d}"/>`)
    + `</g>`;
}

/** The wall clock at ten o'clock (atmosphere only, R3). */
function tenOClock(ctx: KitCtx, x: number, y: number, r: number): string {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `M${f1(x + Math.sin(a) * r * 0.78)} ${f1(y - Math.cos(a) * r * 0.78)}L${f1(x + Math.sin(a) * r * 0.66)} ${f1(y - Math.cos(a) * r * 0.66)}`;
  }).join('');
  const hour = (10 / 12) * Math.PI * 2;
  return depth(ctx, 2, `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="${ref(ctx, 'dayTeak')}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${C.page}"/>`, `<circle cx="${x}" cy="${y}" r="${r + 4}"/>`)
    + `<path d="${ticks}" stroke="${C.inkSoft}" stroke-width="1.4" stroke-linecap="round"/>`
    + `<path d="M${x} ${y}L${f1(x + Math.sin(hour) * r * 0.45)} ${f1(y - Math.cos(hour) * r * 0.45)}M${x} ${y}V${f1(y - r * 0.62)}" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round"/>`
    + `<circle cx="${x}" cy="${y}" r="2" fill="${ref(ctx, 'foil')}"/>`;
}

/** The red 度晬 banner with its foil characters, hung from two nails. */
function birthdayBanner(ctx: KitCtx, x0: number, x1: number, y: number): string {
  const w = x1 - x0;
  const mid = (x0 + x1) / 2;
  const d = `M${x0} ${y}q${w / 2} 12 ${w} 0v26q${-w / 2} 12 ${-w} 0z`;
  return `<path d="M${x0 - 8} ${y - 4}q${w / 2 + 8} 14 ${w + 16} 0" stroke="${C.printDark}" stroke-width=".8" fill="none"/>`
    + depth(ctx, 1, `<path d="${d}" fill="${D.lacquer}"/><path d="M${x0} ${y + 26}l-6 12l10 -6zM${x1} ${y + 26}l6 12l-10 -6z" fill="${D.lacquerDeep}"/>`, `<path d="${d}"/>`)
    + serif(mid, y + 24, 16, ref(ctx, 'foilH'), '度晬快樂', ' letter-spacing="4"');
}

/** A paper balloon on its string. */
function balloon(ctx: KitCtx, x: number, y: number, c: string): string {
  return `<path d="M${x} ${y + 14}q-4 20 4 44" stroke="${C.pageEdge}" stroke-width=".8" fill="none" opacity=".8"/>`
    + depth(ctx, 2, `<ellipse cx="${x}" cy="${y}" rx="11" ry="14" fill="${c}"/><path d="M${x - 2} ${y + 14}h4l-2 3z" fill="${c}"/><ellipse cx="${x - 4}" cy="${y - 5}" rx="3" ry="4.5" fill="${C.cutRim}" opacity=".45"/>`, `<ellipse cx="${x}" cy="${y}" rx="11" ry="14"/>`);
}

/** The teal sofa's end and its arm (Mocha's `sofaArm` perch, its top at y 384: drawn 20 up), on the floor page at the right. */
function sofaEnd(ctx: KitCtx): string {
  return `<g transform="translate(0 -20)">${sofaEndAt(ctx)}</g>`;
}

function sofaEndAt(ctx: KitCtx): string {
  const back = 'M296 372V326q0 -12 12 -12h104V372Z';
  const seat = 'M296 470V376q0 -8 10 -8h110V470Z';
  const arm = 'M324 476V416q0 -12 14 -12h32q14 0 14 12V476Z';
  return depth(ctx, 2, `<path d="${back}" fill="${ref(ctx, 'daySofa')}"/><path d="${seat}" fill="${D.sofa}"/><path d="M296 448H420" stroke="${D.sofaDeep}" stroke-width="22" opacity=".5"/>`
      + `<path d="M300 320q50 -6 110 0" stroke="${C.cutRim}" stroke-width="1.2" opacity=".4" fill="none"/>`
      // A 花布 cushion against the back
      + `<path d="M396 370q-4 -32 10 -40q12 4 14 40z" fill="${D.floral}"/><circle cx="408" cy="352" r="4" fill="${D.floralLight}"/>`, `<path d="${back}"/><path d="${seat}"/>`)
    + depth(ctx, 3, `<path d="${arm}" fill="${ref(ctx, 'daySofa')}"/><path d="M328 412q26 -10 52 0" stroke="${C.cutRim}" stroke-width="1.4" opacity=".45" fill="none"/>`
      + `<rect x="324" y="452" width="60" height="24" fill="${D.sofaDeep}" opacity=".45"/>`, `<path d="${arm}"/>`);
}

// ——— The family ———

/** 阿嬤's grey perm, curls round the crown. */
const grannyPerm = (hx: number, hy: number): Cut => {
  const curls = [[-8, -4, 4.4], [-9, 2, 3.8], [-5, -9, 4.6], [1, -11, 4.8], [7, -9, 4.4], [10, -4, 3.6], [9, 2, 3.2]] as const;
  const d = curls.map(([x, y, r]) => circle(hx + x, hy + y, r)).join('');
  return { outline: `<path d="${d}"/>`, print: `<path d="${d}" fill="${D.grandmaHair}"/><path d="${circle(hx - 4, hy - 10, 1.6)}${circle(hx + 3, hy - 12, 1.4)}" fill="${C.standeeCard}" opacity=".5"/>` };
};

/** 媽媽's black hair, a fringe and a low ponytail tied with a pink scrunchie. */
const momHair = (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 10)} ${f1(hy + 3)}q-2 -14 10 -14q12 0 10 12q-4 -6 -10 -6q-5 0 -10 8z`;
  const tail = `M${f1(hx - 8)} ${f1(hy + 2)}q-8 4 -6 16q4 -2 6 -10z`;
  return {
    outline: `<path d="${d}${tail}"/>`,
    print: `<path d="${tail}" fill="${D.hair}"/><path d="${d}" fill="${D.hair}"/><path d="${circle(hx - 9, hy + 3, 2)}" fill="${D.momTopDeep}"/>`
      + `<path d="M${f1(hx - 4)} ${f1(hy - 9)}q4 -2 8 -1" stroke="${C.cutRim}" stroke-width=".8" fill="none" opacity=".5"/>`,
  };
};

/** 爸爸's short black hair, a side parting. */
const dadHair = (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 9.8)} ${f1(hy + 1)}q-1 -12 10 -12q10 0 10 9q-5 -4 -11 -3q-6 1 -9 6z`;
  return { outline: `<path d="${d}"/>`, print: `<path d="${d}" fill="${D.hair}"/><path d="M${f1(hx - 2)} ${f1(hy - 10)}q-2 3 -1 6" stroke="${C.cutRim}" stroke-width=".8" fill="none" opacity=".5"/>` };
};

const GRANDMA: Look = {
  top: D.grandmaTop, topDeep: D.grandmaTopDeep, bottom: D.grandmaSlacks, shoes: C.printDark, girth: 1.08, hair: grannyPerm,
  // Her cardigan's cream buttons and a jade bead necklace
  over: `<path d="M0 -54V-25" stroke="${D.grandmaTopDeep}" stroke-width="1"/><path d="${circle(1.6, -46, 0.9)}${circle(1.6, -39, 0.9)}${circle(1.6, -32, 0.9)}" fill="${C.page}"/>`
    + `<path d="M-4 -55q4 6 8 0" stroke="${D.floralLeaf}" stroke-width="1.6" stroke-dasharray="1.4 1" fill="none"/>`,
};
const MOM: Look = {
  top: D.momTop, topDeep: D.momTopDeep, bottom: D.momSkirt, shoes: mixHex(D.momTopDeep, C.printDark, 0.5), hair: momHair,
  over: `<path d="M-4 -56q4 4 8 0" stroke="${C.page}" stroke-width="1.4" fill="none"/>`,
};
const DAD: Look = {
  top: D.dadTop, topDeep: D.dadTopDeep, bottom: D.dadSlacks, shoes: C.printDark, shortSleeves: true, hair: dadHair,
  // His polo's collar and placket
  over: `<path d="M-5 -56l5 4l5 -4M0 -52v8" stroke="${D.dadTopDeep}" stroke-width="1.2" fill="none"/>`,
};

/** 阿嬤 cheering (「算盤啦，會賺錢！」): arms up and open toward the mat, beaming. */
const CHEER: Pose = { footB: [-6, 0], footF: [6, 0], elbowB: [-12, -50], handB: [-14, -62], elbowF: [14, -50], handF: [18, -63], eyes: 'happy', mouth: 'open' };
/** 媽媽, hands together at her chest (「拿什麼都好，慢慢來。」). */
const HANDS: Pose = { footB: [-5, 0], footF: [5, 0], elbowB: [-6, -38], handB: [2, -45], elbowF: [8, -38], handF: [4, -45], eyes: 'happy', mouth: 'smile' };
/** 爸爸 filming him on his phone, held up in both hands. */
const FILM: Pose = { footB: [-6, 0], footF: [6, 0], elbowB: [8, -44], handB: [14, -58], elbowF: [16, -44], handF: [16, -59], eyes: 'open', mouth: 'open', lean: 4 };

/** The family behind the mat, feet on the floor page (`y` their feet line). Die-cut grown-ups, k 2.3. */
function family(ctx: KitCtx, y: number): string {
  const k = 2.15;
  const at = (x: number, cut: Cut, flip = false) => {
    const s = scaled(cut, k, flip, x, y);
    return softEllipse(ctx, x, y + 1, 22, 4, 'shadow', 0.4) + figure(s.outline, s.print);
  };
  const phone: Cut = { outline: `<path d="M12 -68h9v14h-9z"/>`, print: `<rect x="12" y="-68" width="9" height="14" rx="1.6" fill="${D.phone}"/><rect x="13.2" y="-66.6" width="6.6" height="10.6" fill="${D.sky}" opacity=".85"/>` };
  return at(62, adult(GRANDMA, CHEER))
    + at(136, adult(MOM, HANDS))
    + at(208, join(adult(DAD, FILM), phone));
}

// ——— The 抓周盤 ———

/** Where each treasure lies on the tray (its centre), by chapter: he passes them left to right. */
export const TRAY_TREASURES: readonly (readonly [chapter: number, x: number, y: number, s: number, rot: number])[] = [
  [3, 86, 550, 0.86, -8], [2, 112, 570, 0.84, 24], [4, 140, 546, 0.82, -14],
  [8, 166, 572, 0.8, 0], [10, 196, 550, 1, 0], [6, 224, 572, 0.8, 8], [5, 244, 544, 0.8, -30],
  [1, 266, 566, 0.84, 10], [9, 292, 546, 0.78, -6], [7, 312, 572, 0.78, 18],
];

/** The red lacquer 抓周盤 on the floor in front of the mat, centred on (x, y): a gold rim, ten treasures round the 金鎖片. */
function zhuazhouTray(ctx: KitCtx, x: number, y: number): string {
  const [rx, ry] = [142, 36];
  const tray = `<ellipse cx="${x}" cy="${y + 6}" rx="${rx}" ry="${ry}" fill="${D.lacquerDeep}"/>`
    + `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${ref(ctx, 'lacquer')}"/>`
    + `<ellipse cx="${x}" cy="${y}" rx="${rx - 6}" ry="${ry - 4}" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="2.4"/>`
    + `<ellipse cx="${x}" cy="${y + 2}" rx="${rx - 12}" ry="${ry - 9}" fill="${D.lacquerDeep}" opacity=".35"/>`
    // A gold 壽 medallion pattern in the lacquer, low
    + [-80, -40, 0, 40, 80].map((dx) => `<circle cx="${x + dx}" cy="${y + (Math.abs(dx) > 60 ? -2 : 4)}" r="6" fill="none" stroke="${C.ochre}" stroke-width="1" opacity=".35"/>`).join('');
  const items = TRAY_TREASURES.map(([chapter, tx, ty, s, rot]) => `<g transform="translate(${tx} ${ty}) rotate(${rot}) scale(${s})">${treasureArt(ctx, chapter)}</g>`).join('');
  return softEllipse(ctx, x, y + 14, rx + 6, ry, 'shadow', 0.35)
    + depth(ctx, 3, tray, `<ellipse cx="${x}" cy="${y + 3}" rx="${rx}" ry="${ry + 3}"/>`)
    + softEllipse(ctx, x, y - 4, rx * 0.8, ry, 'foil', 0.16, 'blur8')
    + items
    + sparkle(ctx, x + 6, y - 30, 6) + sparkle(ctx, x - 70, y - 14, 4) + sparkle(ctx, x + 90, y - 18, 4.5);
}

// ——— Page E 「抓周」 ———

/**
 * Page E, the centrefold (its spine's crease drawn live): the living room at ten on the birthday
 * morning. The standing page: the pale rose washi wall in the sun, bunting and the 「度晬快樂」
 * banner, balloons, the clock at ten, a little birthday table (the cake with its one candle, a plate
 * of 紅蛋), the window onto the lane — sky, a cumulus, the houses across, the 土地公 shrine (its niche
 * at `SHRINE`) — with its tied-back 花布 curtains and the sunny sill (Mocha's `sill`, y 258). The
 * floor page: honey boards with the window's light laid across them, 阿嬤, 媽媽 and 爸爸 behind the
 * play-mat (the live ledge), the teal sofa's end on the right (`sofaArm`, y 404), and the red 抓周盤
 * in front with all ten treasures (its middle is Mocha's `tray`).
 */
const zhuazhouDay: BackdropDraw = (ctx) => {
  const win = { x: 192, y: 60, w: 176, h: 180 };
  const back = dayWallpaper(ctx, -20, 0, PAGE_W + 40, GUTTER_Y)
    + dayWainscot(ctx, 290)
    // The morning light from the window, washing the wall round it
    + `<ellipse cx="282" cy="160" rx="190" ry="150" fill="${ref(ctx, 'sunWash')}" opacity=".7"/>`
    + bunting(ctx, -6, 18, 182, 26, 18, [D.matPink, D.matCream, D.matSky, D.matMint, D.matLilac])
    + birthdayBanner(ctx, 36, 150, 48)
    + balloon(ctx, 22, 112, D.matPink) + balloon(ctx, 170, 104, D.matSky)
    + tenOClock(ctx, 96, 148, 20)
    + laneByDay(ctx, win) + dayWindow(ctx, win)
    + dayCurtain(ctx, 178, 46, 24, 214, 150, 1) + dayCurtain(ctx, 382, 46, 24, 214, 150, -1)
    + `<rect x="168" y="40" width="224" height="5" rx="2.5" fill="${ref(ctx, 'foil')}"/>`;
  // The window's light on the boards: two long parallelograms from the window, warm
  const sun = `<path d="M196 ${GUTTER_Y}L120 ${FLOOR_BOTTOM}H330L360 ${GUTTER_Y}Z" fill="${D.sunPatch}" opacity=".32"/>`
    + `<path d="M262 ${GUTTER_Y}L236 ${FLOOR_BOTTOM}" stroke="${D.board}" stroke-width="14" opacity=".35"/>`
    + `<ellipse cx="200" cy="556" rx="190" ry="60" fill="${ref(ctx, 'sunWash')}" opacity=".6"/>`;
  return dayDefs(ctx) + standingPage(ctx, back)
    + dayFloor(ctx, sun)
    + family(ctx, 414)
    + sofaEnd(ctx)
    + zhuazhouTray(ctx, 198, 560)
    + bookCues(ctx) + block();
};

export const END_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'end/zhuazhou-day': screen(zhuazhouDay),
};

/** For the screens' art (`screens.ts`): the 05:30 scene and the post-credits reuse the home's pieces. */
export { dayCurtain, dayWallpaper, dayWainscot, laneByDay, zhuazhouTray, family as familyFigures };

// ——— The scenes around page E (screen art, `screens.ts`; never graded) ———

/** A story scene's picture: page-shaped, in CSS px at 390 wide (the screen draws it fitted). */
export const SCENE_BOX = { x: 0, y: 0, w: 390, h: 500 } as const;

/** The nine treasures and the 金鎖片 set out on a small tray, centred on (x, y), scaled `s`. */
function fullTray(ctx: KitCtx, x: number, y: number, s: number): string {
  const [rx, ry] = [74, 18];
  const ring = [[3, -56, -4], [2, -38, 8], [4, -20, -6], [9, -48, 10], [8, 30, 8], [6, 48, -2], [5, 60, 8], [1, 40, -6], [7, 16, 10]] as const;
  return `<g transform="translate(${x} ${y}) scale(${s})">`
    + depth(ctx, 3, `<ellipse cy="5" rx="${rx}" ry="${ry}" fill="${D.lacquerDeep}"/><ellipse rx="${rx}" ry="${ry}" fill="${ref(ctx, 'lacquer')}"/>`
      + `<ellipse rx="${rx - 4}" ry="${ry - 3}" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1.8"/>`, `<ellipse cy="2" rx="${rx}" ry="${ry + 3}"/>`)
    + ring.map(([ch, tx, ty]) => `<g transform="translate(${tx} ${ty - 6}) scale(.46)">${treasureArt(ctx, ch)}</g>`).join('')
    + `<g transform="translate(-2 -12) scale(.6)">${treasureArt(ctx, 10)}</g>`
    + `</g>`;
}

/**
 * 05:30, home (GDD § 5.5; the scene before page E): the living room at first light. The window's
 * dawn — peach over the rooftops, 101 a far silhouette, a little white cloud at peace above it —
 * lights the room's lilac night; 阿嬤 has come in from the hall in her quilted robe, one hand at the
 * small of her back (「哎唷」), smiling down at 阿嬤's table, where the 抓周盤 is complete — nine
 * treasures round the 金鎖片 — and Mocha is curled asleep across it, guarding it.
 */
export function dawnScene(ctx: KitCtx): string {
  const { w, h } = SCENE_BOX;
  const floor = 372;
  const sky = `<defs>${lin(ctx, 'dawnWall', [[0, E.dawnWallTop], [1, E.dawnWallLow]])}${lin(ctx, 'dawnSky', [[0, E.dawnSkyTop], [0.55, E.dawnSkyMid], [1, E.dawnSkyLow]])}`
    + `${lin(ctx, 'dawnBoards', [[0, E.dawnBoard], [1, E.dawnBoardLight]])}${lin(ctx, 'lacquer', [[0, D.lacquerLight], [0.5, D.lacquer], [1, D.lacquerDeep]])}`
    + `${rad(ctx, 'dawnPool', [[0, E.dawnLight, 0.55], [1, E.dawnLight, 0]])}</defs>`;
  const wall = `<rect width="${w}" height="${floor}" fill="${ref(ctx, 'dawnWall')}"/>`
    + paperFibres(0, 0, w, floor, 70, D.wallPrint, 5, 0.12)
    + `<rect y="${floor - 70}" width="${w}" height="70" fill="${D.wainscotDeep}" opacity=".7"/><rect y="${floor - 74}" width="${w}" height="6" fill="${D.wainscot}" opacity=".8"/>`;
  // The window: dawn over the rooftops, 101 far off, a little calm cloud (咻咻, at peace)
  const g = { x: 196, y: 54, w: 160, h: 170 };
  const clip = ctx.id('dawnWin');
  const view = `<clipPath id="${clip}"><rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}"/></clipPath><g clip-path="url(#${clip})">`
    + `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" fill="${ref(ctx, 'dawnSky')}"/>`
    + softEllipse(ctx, g.x + 110, g.y + g.h - 30, 70, 46, 'lamp', 0.5, 'blur18')
    + silhouette101(g.x + 112, g.y + g.h - 30, 126, E.dawnSilhouette)
    + `<path d="M${g.x} ${g.y + g.h}V${g.y + g.h - 36}h30v-10h26v14h40v-8h34v-6h30V${g.y + g.h}Z" fill="${E.dawnRoofs}"/>`
    + `<g transform="translate(${g.x + 50} ${g.y + 46}) scale(.62)">`
    + `<path d="M-30 6q-10 0 -10 -9q0 -9 10 -9q2 -12 15 -12q11 0 14 9q11 -1 12 9q2 12 -11 12z" fill="${E.cloud}" opacity=".95"/>`
    + `<path d="M-6 -4q3 -3.6 6 0M6 -4q3 -3.6 6 0" stroke="${C.ink}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M-1 1q3 3 6 0" stroke="${C.ink}" stroke-width="1.2" fill="none"/></g>`
    + `</g>`;
  const frame = depth(ctx, 2, `<path d="M${g.x - 8} ${g.y - 8}h${g.w + 16}v${g.h + 16}h${-(g.w + 16)}Z M${g.x} ${g.y}v${g.h}h${g.w}v${-g.h}Z" fill="${D.teakDeep}" fill-rule="evenodd"/>`
    + `<rect x="${g.x + g.w * 0.5 - 2}" y="${g.y}" width="4" height="${g.h}" fill="${D.teakDeep}"/>`, `<rect x="${g.x - 8}" y="${g.y - 8}" width="${g.w + 16}" height="${g.h + 16}"/>`);
  // The dawn's light on the floor and the table
  const light = `<path d="M${g.x} ${floor}L${g.x - 80} ${h}H${g.x + g.w + 60}L${g.x + g.w} ${floor}Z" fill="${E.dawnLight}" opacity=".16"/>`
    + `<ellipse cx="200" cy="${floor + 40}" rx="170" ry="70" fill="${ref(ctx, 'dawnPool')}"/>`;
  const boards = `<rect y="${floor}" width="${w}" height="${h - floor}" fill="${ref(ctx, 'dawnBoards')}"/>`
    + Array.from({ length: 16 }, (_, i) => `<path d="M${i * 28 - 20} ${floor}L${f1((i * 28 - 20 - 195) * 1.5 + 195)} ${h}" stroke="${E.dawnSeam}" stroke-width="1" opacity=".45"/>`).join('');
  // 阿嬤's table, the full tray, Mocha asleep across it
  const tx = 214;
  const top = 318;
  const table = depth(ctx, 3, `<path d="M${tx - 66} ${top + 30}V${floor + 6}M${tx + 66} ${top + 30}V${floor + 6}" stroke="${D.teakDeep}" stroke-width="7"/>`
    + `<path d="M${tx - 80} ${top}H${tx + 80}L${tx + 74} ${top + 40}H${tx - 74}Z" fill="${D.lacquer}"/><rect x="${tx - 84}" y="${top - 7}" width="168" height="8" rx="2" fill="${D.teak}"/>`
    + `<path d="M${tx - 74} ${top + 34}H${tx + 74}" stroke="${ref(ctx, 'foilH')}" stroke-width="2"/>`, `<rect x="${tx - 84}" y="${top - 7}" width="168" height="${floor - top + 13}"/>`);
  const cat = `<g transform="translate(${tx + 18} ${top - 14}) scale(1.05)">`
    + depth(ctx, 3, `<path d="M-24 0q-4 -20 14 -24q14 -4 26 4q10 8 6 20z" fill="${E.catFur}"/><path d="M-14 -21q3 6 1 12M-4 -24q3 7 1 13M6 -22q3 6 1 11" stroke="${E.catFurDark}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`
      + `<path d="M10 -2q-2 -14 9 -16l2 -8l5 7q6 0 9 5l5 -6l1 9q4 6 0 11z" fill="${E.catFur}"/><path d="M17 -8q2 1.6 4 0M27 -8q2 1.6 4 0" stroke="${C.ink}" stroke-width="1" stroke-linecap="round" fill="none"/>`
      + `<path d="M13 -2q12 3 26 -1" stroke="${E.catCollar}" stroke-width="2.4" fill="none"/><path d="M-22 -1q4 7 24 6q8 -1 12 -5" stroke="${E.catFurDark}" stroke-width="5" stroke-linecap="round" fill="none"/>`, `<path d="M-24 0q-4 -20 14 -24q14 -4 26 4q10 8 6 20z"/><path d="M10 -2q-2 -14 9 -16l2 -8l5 7q6 0 9 5l5 -6l1 9q4 6 0 11z"/>`)
    + `</g>`;
  // 阿嬤 in her quilted robe, a hand at her back, smiling at the tray
  const robe: Look = { ...GRANDMA, top: E.robe, topDeep: E.robeDeep, bottom: E.robe, shoes: E.slipper, over: `<path d="M-2 -54L2 -25" stroke="${E.robeDeep}" stroke-width="1.2"/><path d="M-9 -32h18" stroke="${E.slipper}" stroke-width="2"/>` };
  const ache: Pose = { footB: [-5, 0], footF: [5, 0], elbowB: [-12, -36], handB: [-6, -30], elbowF: [12, -42], handF: [18, -40], eyes: 'happy', mouth: 'smile', lean: 7 };
  const granny = (() => {
    const s = scaled(adult(robe, ache), 2.5, false, 70, floor + 30);
    return softEllipse(ctx, 70, floor + 31, 30, 5, 'shadow', 0.4) + figure(s.outline, s.print);
  })();
  // The hall's doorway behind her, a lamp still on
  const door = `<rect x="18" y="96" width="104" height="${floor - 96}" fill="${E.dawnDoor}"/><rect x="18" y="96" width="104" height="${floor - 96}" fill="none" stroke="${D.teakDeep}" stroke-width="6"/>`
    + softEllipse(ctx, 70, 150, 40, 40, 'lamp', 0.35, 'blur18');
  // The night's bunting still up, and the clock at half past five
  const deco = bunting(ctx, 150, 22, 392, 30, 16, [D.matPink, D.matCream, D.matSky, D.matMint, D.matLilac])
    + `<g transform="translate(150 150)">${halfPastFive(ctx)}</g>`;
  return sky + wall + deco + door + view + frame + boards + light + table + fullTray(ctx, tx, top - 6, 1.3) + cat + granny
    + `<rect width="${w}" height="${h}" fill="${E.dawnWallTop}" opacity=".1"/>` + grain(ctx, w, h, 0.4);
}

/** 台北101 as a backlit silhouette (dawn behind it): the podium, eight flared sections, the crown, the spire. */
function silhouette101(cx: number, ground: number, height: number, fill: string): string {
  const y = (f: number) => f1(ground - height * f);
  let d = `M${f1(cx - height * 0.07)} ${ground}L${f1(cx - height * 0.05)} ${y(0.2)}H${f1(cx + height * 0.05)}L${f1(cx + height * 0.07)} ${ground}Z`;
  const sh = 0.53 / 8;
  for (let i = 0; i < 8; i++) {
    const [b, t] = [0.2 + sh * i, 0.2 + sh * (i + 1)];
    d += `M${f1(cx - height * 0.043)} ${y(b)}L${f1(cx - height * 0.059)} ${y(t)}H${f1(cx + height * 0.059)}L${f1(cx + height * 0.043)} ${y(b)}Z`;
  }
  d += `M${f1(cx - height * 0.035)} ${y(0.73)}V${y(0.8)}H${f1(cx + height * 0.035)}V${y(0.73)}Z`
    + `M${f1(cx - height * 0.022)} ${y(0.8)}V${y(0.86)}H${f1(cx + height * 0.022)}V${y(0.8)}Z`
    + `M${f1(cx - height * 0.006)} ${y(0.86)}L${f1(cx - 0.6)} ${y(1)}H${f1(cx + 0.6)}L${f1(cx + height * 0.006)} ${y(0.86)}Z`;
  return `<path d="${d}" fill="${fill}"/>`;
}

/** A wall clock at half past five (the 05:30 scene). */
function halfPastFive(ctx: KitCtx): string {
  const r = 18;
  const hour = (5.5 / 12) * Math.PI * 2;
  return depth(ctx, 2, `<circle r="${r + 4}" fill="${D.teakDeep}"/><circle r="${r}" fill="${mixHex(C.page, E.dawnWallTop, 0.25)}"/>`, `<circle r="${r + 4}"/>`)
    + `<path d="M0 0L${f1(Math.sin(hour) * r * 0.45)} ${f1(-Math.cos(hour) * r * 0.45)}M0 0V${f1(r * 0.66)}" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round"/>`
    + `<circle r="2" fill="${ref(ctx, 'foil')}"/>`;
}


/**
 * Post-credits (GDD § 5.5): the little 土地公 shrine at the mouth of the lane on a summer afternoon,
 * a 西北雨 passing in sunshine (vellum rain, wet paving shining). In the niche the statue sits
 * smiling in his gold-trimmed robe and hat, white beard — and on one fingertip a dab of red 印泥;
 * on the altar, a red ink pad and a stamp card filled with his little stamps. Over the rooftops a
 * small white cloud plays in the rain: 咻咻, come back.
 */
export function shrineScene(ctx: KitCtx): string {
  const { w, h } = SCENE_BOX;
  const ground = 404;
  const cx = 195;
  const defs = `<defs>${lin(ctx, 'rainSky', [[0, E.rainSky], [0.6, E.rainSkyMid], [1, E.rainSkyLow]])}${lin(ctx, 'paving', [[0, E.paving], [1, E.pavingLight]])}</defs>`;
  const sky = `<rect width="${w}" height="${ground}" fill="${ref(ctx, 'rainSky')}"/>`
    + softEllipse(ctx, 320, 60, 80, 60, 'lamp', 0.4, 'blur18');
  // The lane's houses either side
  const houses = `<path d="M0 ${ground}V120h96v-14h20V${ground}Z" fill="${D.house}"/><path d="M${w} ${ground}V96H${w - 104}V${ground}Z" fill="${mixHex(D.house, D.wallTop, 0.35)}"/>`
    + `<path d="M0 120h96M${w - 104} 96H${w}" stroke="${D.houseShade}" stroke-width="5"/>`
    + `<rect x="16" y="150" width="50" height="40" fill="${D.sky}" opacity=".6"/><rect x="${w - 84}" y="130" width="56" height="44" fill="${D.sky}" opacity=".6"/>`
    + `<path d="${Array.from({ length: 10 }, (_, i) => `M${18 + i * 5} 148v44`).join('')}${Array.from({ length: 11 }, (_, i) => `M${w - 82 + i * 5} 128v48`).join('')}" stroke="${D.ironGrille}" stroke-width="1.4"/>`
    + `<circle cx="40" cy="104" r="22" fill="${D.treeDeep}"/><circle cx="64" cy="96" r="18" fill="${D.tree}"/>`;
  // 咻咻 playing over the rooftops in the rain: small, white, happy
  const shushu = `<g transform="translate(300 58)">`
    + `<path d="M-30 6q-10 0 -10 -9q0 -9 10 -9q2 -12 15 -12q11 0 14 9q11 -1 12 9q2 12 -11 12z" fill="${E.cloud}"/>`
    + `<path d="M-24 2q0 -8 8 -8q7 0 7 6" stroke="${E.cloudSwirl}" stroke-width="1.6" fill="none"/>`
    + `<path d="M-8 -4q3 -3.6 6 0M4 -4q3 -3.6 6 0" stroke="${C.ink}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M-3 1q3 3 6 0" stroke="${C.ink}" stroke-width="1.2" fill="none"/>`
    + `<ellipse cx="-12" cy="1" rx="2.6" ry="1.6" fill="${E.cloudBlush}" opacity=".7"/><ellipse cx="13" cy="1" rx="2.6" ry="1.6" fill="${E.cloudBlush}" opacity=".7"/>`
    + `<path d="M14 -18l1.4 3.4l3.4 1.4l-3.4 1.4l-1.4 3.4l-1.4 -3.4l-3.4 -1.4l3.4 -1.4z" fill="${C.lampHot}"/></g>`;
  // The shrine, big: a stone base, cream walls, a red roof with swallowtail ridges, the niche
  const roof = `M${cx - 120} 150q30 -6 40 -40h160q10 34 40 40q-14 4 -22 12h-196q-8 -8 -22 -12z`;
  const shrine = depth(ctx, 2, `<rect x="${cx - 96}" y="158" width="192" height="210" fill="${D.shrineWall}"/>`
      + `<path d="M${cx - 62} 340V214q0 -34 62 -34q62 0 62 34V340Z" fill="${D.shrineNiche}"/>`
      + `<path d="${roof}" fill="${D.shrineRoof}"/><path d="M${cx - 80} 110q-14 -10 -24 -6M${cx + 80} 110q14 -10 24 -6" stroke="${D.shrineRoof}" stroke-width="6" stroke-linecap="round" fill="none"/>`
      + `<path d="M${cx - 76} 118H${cx + 76}" stroke="${C.ochre}" stroke-width="3"/><circle cx="${cx}" cy="102" r="8" fill="${C.ochre}"/>`
      + `<rect x="${cx - 104}" y="360" width="208" height="22" fill="${mixHex(D.shrineWall, C.shadow, 0.3)}"/>`
      + `<rect x="${cx - 70}" y="326" width="140" height="20" rx="3" fill="${D.teak}"/>`, `<path d="${roof}"/><rect x="${cx - 104}" y="150" width="208" height="232"/>`)
    + [cx - 108, cx + 108].map((lx) => `<path d="M${lx} 162v10" stroke="${C.printDark}" stroke-width="1.2"/><ellipse cx="${lx}" cy="186" rx="11" ry="14" fill="${D.shrineRoof}"/><path d="M${lx - 9} 186h18" stroke="${C.ochre}" stroke-width="1.4"/>`).join('')
    + serif(cx, 146, 15, ref(ctx, 'foilH'), '福德正神', ' letter-spacing="3"');
  // The statue: seated in his robe, gold-trimmed hat, white brows and beard, a smile; a dab of red on his raised finger
  const statue = `<g transform="translate(${cx} 268)">`
    + `<path d="M-40 58q-4 -54 40 -58q44 4 40 58z" fill="${E.statueGold}"/><path d="M-40 58q-4 -54 40 -58q44 4 40 58z" fill="none" stroke="${E.statueGoldDeep}" stroke-width="2"/>`
    + `<path d="M-8 2q8 30 0 56M8 2q-8 30 0 56" stroke="${E.statueGoldDeep}" stroke-width="2" fill="none"/>`
    + `<circle cy="-20" r="22" fill="${E.statueSkin}"/>`
    + `<path d="M-18 -12q-2 30 18 34q20 -4 18 -34q-6 8 -18 8q-12 0 -18 -8z" fill="${E.beard}"/>`
    + `<path d="M-14 -26q5 -4 10 0M4 -26q5 -4 10 0" stroke="${E.beard}" stroke-width="3.6" stroke-linecap="round" fill="none"/>`
    + `<path d="M-12 -21q3 2.4 6 0M6 -21q3 2.4 6 0" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`
    + `<circle cx="-14" cy="-14" r="3" fill="${E.statueBlush}" opacity=".6"/><circle cx="14" cy="-14" r="3" fill="${E.statueBlush}" opacity=".6"/>`
    + `<path d="M-26 -36q0 -20 26 -20q26 0 26 20z" fill="${E.statueHat}"/><path d="M-28 -38h56v6h-56z" fill="${E.statueGold}"/><circle cy="-48" r="4" fill="${C.ochre}"/>`
    + `<path d="M-30 -36h-14M30 -36h14" stroke="${E.statueHat}" stroke-width="4" stroke-linecap="round"/>`
    // His right hand raised a little, a fingertip red with 印泥
    + `<path d="M26 24q12 -6 14 -20" stroke="${E.statueGold}" stroke-width="10" stroke-linecap="round" fill="none"/><circle cx="40" cy="2" r="6" fill="${E.statueSkin}"/><path d="M41 -6v-6" stroke="${E.statueSkin}" stroke-width="4" stroke-linecap="round"/><circle cx="41" cy="-12" r="2.6" fill="${E.inkRed}"/>`
    + `</g>`;
  // The altar: an incense burner with smoke, the red ink pad, a stamp card full of little red stamps
  const card = `<g transform="translate(${cx + 36} 316) rotate(-6)"><rect x="-20" y="-14" width="40" height="28" rx="2" fill="${C.page}"/>`
    + Array.from({ length: 8 }, (_, i) => `<circle cx="${-13 + (i % 4) * 8.6}" cy="${-6 + Math.floor(i / 4) * 11}" r="3" fill="none" stroke="${E.inkRed}" stroke-width="1.2"/>`).join('') + `</g>`;
  const altar = `<rect x="${cx - 14}" y="306" width="28" height="18" rx="3" fill="${C.ochre}"/><path d="M${cx - 4} 306q-6 -16 2 -28q6 -12 -2 -24" stroke="${C.vellum}" stroke-width="1.6" fill="none" opacity=".8"/>`
    + `<ellipse cx="${cx - 48}" cy="320" rx="13" ry="6" fill="${E.inkRed}"/><ellipse cx="${cx - 48}" cy="318" rx="10" ry="4" fill="${E.inkPad}"/>` + card;
  // The wet paving, shining
  const pave = `<rect y="${ground}" width="${w}" height="${h - ground}" fill="${ref(ctx, 'paving')}"/>`
    + Array.from({ length: 7 }, (_, i) => `<path d="M0 ${ground + 12 + i * 13}H${w}" stroke="${E.pavingSeam}" stroke-width="1" opacity=".5"/>`).join('')
    + `<path d="M${cx - 60} ${ground + 6}h120l20 ${h - ground - 6}h-160z" fill="${D.shrineRoof}" opacity=".12"/>`
    + `<ellipse cx="300" cy="${ground + 50}" rx="60" ry="8" fill="${E.cloud}" opacity=".35"/>`;
  // The rain: fine vellum streaks over everything, a sun shower
  const r = seeded(91);
  let rain = '';
  for (let i = 0; i < 70; i++) rain += `M${f1(r() * w)} ${f1(r() * (ground + 40))}l-4 ${f1(14 + r() * 10)}`;
  return defs + sky + houses + shushu + shrine + statue + altar + pave
    + `<path d="${rain}" stroke="${E.cloud}" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>` + grain(ctx, w, h, 0.4);
}
