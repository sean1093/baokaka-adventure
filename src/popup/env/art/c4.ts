import { POPUP as C, POPUP_NEON as N, POPUP_STAGE as S, POPUP_STATION as T, mixHex } from '../../../art/palette';
import { depth, f1, filterAttr, pageBlock, pinholes, ref, seeded, skyline, softEllipse, wheelRim, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorWiden } from '../../view/geometry';
import type { BackdropDraw, CutoutSource, PartSource } from '../sources';
import { boomboxBody } from '../../view/art/ximen';
import { carDoors } from './c2';
import { FLOOR_RECT, bakedFlap, bookCues, calmMoon, flapSize, floorPage, kraftBack, lin, paperFibres, rad, shushuPeek, standingPage, vellumWindow } from './common';

/**
 * Chapter 4 (西門町, 01:50) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#118) drew 4-2's lantern; the chapter's art issue
 * (#119) draws the palette kit, the six backdrops and every part.
 *
 * **The kit** (bible § 6 row 4, `POPUP_NEON`): plum and 紅樓 brick, with neon pink and cyan as the
 * accent — the one chapter where the bible's neon recipe (§ 3.3) runs free: **luminous ink**, a
 * stroke and its letters under a 1.6-unit glow with a white-hot core and a 12 % coloured spill behind
 * the sign. A sleeping sign is grey ink plus 「zz」. The signature materials are neon ink and brick
 * card. Reusable cut-outs: `signBoard` (a vertical shop sign, lit or asleep), `brickFace`,
 * `shopfront`, `streetLamp`, `speakerCab`, `ximenSky` (the night with the district's neon skyline),
 * `streetFloor` (asphalt, the painted crossing and neon puddles), `crowd`.
 */

/** The page block under the floor page. */
const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};

// ——— The palette kit ———

/** The district's gradient defs, shared by the chapter's backdrops. */
function neonDefs(ctx: KitCtx): string {
  return `<defs>`
    + lin(ctx, 'plumWall', [[0, N.plumDeep], [0.6, N.plum], [1, mixHex(N.plum, N.plumLight, 0.5)]])
    + lin(ctx, 'plumWallH', [[0, N.plumDeep], [1, N.plum]], 'h')
    + lin(ctx, 'brickG', [[0, N.brickLight], [0.5, N.brick], [1, N.brickDeep]])
    + lin(ctx, 'brickH', [[0, N.brickDeep], [0.35, N.brick], [1, mixHex(N.brick, N.brickDeep, 0.6)]], 'h')
    + lin(ctx, 'roofN', [[0, N.roofLight], [1, N.roof]])
    + lin(ctx, 'asphaltG', [[0, mixHex(N.asphalt, C.shadow, 0.4)], [1, N.asphaltLight]])
    + lin(ctx, 'paverN', [[0, mixHex(N.paverDeep, C.shadow, 0.3)], [1, N.paverLight]])
    + lin(ctx, 'shutterG', [[0, N.shutterLight], [0.5, N.shutter], [1, N.shutterDeep]])
    + lin(ctx, 'chromeG', [[0, N.chromeDeep], [0.35, N.chrome], [0.55, C.cutRim], [1, N.chromeDeep]], 'h')
    + lin(ctx, 'velvetG', [[0, N.velvetDeep], [0.5, N.velvet], [1, N.velvetDeep]], 'h')
    + lin(ctx, 'cabinetG', [[0, N.cabinetLight], [1, N.cabinetDeep]])
    + lin(ctx, 'speakerG', [[0, N.speakerCone], [1, N.speaker]])
    + lin(ctx, 'stageG', [[0, mixHex(N.stageBoard, C.shadow, 0.3)], [1, N.stageBoardLight]])
    // 4-1's car and station
    + lin(ctx, 'carWallN', [[0, T.carCeiling], [0.5, mixHex(T.carWall, T.navy, 0.08)], [1, mixHex(T.carWallShade, T.navy, 0.16)]])
    + lin(ctx, 'tileWallN', [[0, mixHex(T.carWall, N.plum, 0.4)], [1, mixHex(T.carWall, N.plum, 0.2)]])
    + lin(ctx, 'steelN', [[0, T.steelDeep], [0.4, T.steel], [0.6, C.cutRim], [1, T.steelDeep]], 'h')
    + lin(ctx, 'prioN', [[0, T.priority], [1, T.priorityDeep]])
    + lin(ctx, 'seatN', [[0, T.seat], [1, T.seatDeep]])
    + lin(ctx, 'lampWashN', [[0, C.neonPink, 0], [1, C.neonPink, 0.1]])
    + rad(ctx, 'warmPoolN', [[0, C.lamp, 0.4], [0.6, C.lampAmber, 0.12], [1, C.lampAmber, 0]])
    + rad(ctx, 'pinkPool', [[0, C.neonPink, 0.32], [0.6, C.neonPink, 0.1], [1, C.neonPink, 0]])
    + rad(ctx, 'cyanPool', [[0, C.neonCyan, 0.28], [0.6, C.neonCyan, 0.08], [1, C.neonCyan, 0]])
    + `</defs>`;
}

type Tone = 'warm' | 'pink' | 'cyan';

/** Light pools on the floor page: warm under lamps, pink and cyan under the neon. */
const pools = (ctx: KitCtx, list: readonly (readonly [number, number, number, number, Tone?])[]) =>
  list.map(([cx, cy, rx, ry, tone]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ref(ctx, tone === 'pink' ? 'pinkPool' : tone === 'cyan' ? 'cyanPool' : 'warmPoolN')}"/>`).join('');

/** The glow filter on a neon stroke (bake only). */
const glow = (ctx: KitCtx) => (ctx.filters ? filterAttr(ctx, 'glowS') : '');

/**
 * Luminous ink (bible § 3.3): a neon tube along `d`, its colour under a 1.6-unit glow with a
 * white-hot core. Lights are never graded, so the tube keeps its colour at night.
 */
export function neonTube(ctx: KitCtx, d: string, color: string, w = 2.4): string {
  return `<g${glow(ctx)}><path d="${d}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${d}" stroke="${C.lampHot}" stroke-width="${f1(w * 0.36)}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/></g>`;
}

/** Neon letters, one per line down a vertical sign from (x, y), `size` tall, lit or asleep (grey ink). */
function neonChars(ctx: KitCtx, x: number, y: number, chars: string, size: number, color: string, lit = true, gap = 1.12): string {
  const ink = lit ? color : N.sleepInk;
  const glyphs = [...chars].map((ch, i) => `<text data-art-text="" x="${f1(x)}" y="${f1(y + size * 0.86 + i * size * gap)}" text-anchor="middle" font-family="'Chiron GoRound TC'" font-weight="900" font-size="${size}" fill="${ink}">${ch}</text>`).join('');
  if (!lit) return glyphs;
  const core = [...chars].map((ch, i) => `<text data-art-text="" x="${f1(x)}" y="${f1(y + size * 0.86 + i * size * gap)}" text-anchor="middle" font-family="'Chiron GoRound TC'" font-weight="900" font-size="${size}" fill="none" stroke="${C.lampHot}" stroke-width=".5" opacity=".7">${ch}</text>`).join('');
  return `<g${glow(ctx)}>${glyphs}</g>${core}`;
}

/** The coloured spill behind a lit sign (bible § 3.3: 12 %), soft at the bake. */
function spill(ctx: KitCtx, x: number, y: number, w: number, h: number, color: string, opacity = 0.12): string {
  return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="8" fill="${color}" opacity="${opacity}"${ctx.filters ? filterAttr(ctx, 'blur8') : ''}/>`;
}

/** 「zz」 in grey chalk beside a sleeping sign. */
const zz = (x: number, y: number, s = 1) => `<text data-art-text="" x="${f1(x)}" y="${f1(y)}" font-family="Fredoka" font-weight="700" font-size="${f1(10 * s)}" fill="${C.chalk}" opacity=".7">z</text>`
  + `<text data-art-text="" x="${f1(x + 6 * s)}" y="${f1(y - 8 * s)}" font-family="Fredoka" font-weight="700" font-size="${f1(14 * s)}" fill="${C.chalk}" opacity=".8">z</text>`;

/**
 * A parked scooter (機車, 西門町's everywhere), side on, facing +x, its wheels on `foot`: a two-tone
 * body, a seat, a round headlamp, a little basket; `s` scales it.
 */
function scooter(ctx: KitCtx, x: number, foot: number, body: string, s = 1): string {
  const wheel = (cx: number) => `M${cx - 7} -7a7 7 0 1 0 14 0a7 7 0 1 0 -14 0z`;
  const shell = 'M-28 -10Q-30 -24 -16 -26H-2L0 -14H8L12 -40H18L18 -22Q26 -18 26 -10Z';
  return `<g transform="translate(${f1(x)} ${f1(foot)}) scale(${s})">` + softEllipse(ctx, 0, 0, 30, 3.4, 'shadow', 0.4)
    + depth(ctx, 3, `<path d="${wheel(-17)}${wheel(16)}" fill="${C.printDark}"/><circle cx="-17" cy="-7" r="2.6" fill="${N.chromeDeep}"/><circle cx="16" cy="-7" r="2.6" fill="${N.chromeDeep}"/>`
      + `<path d="${shell}" fill="${body}"/><path d="M-24 -30h20q3 0 3 4h-26q0 -4 3 -4z" fill="${C.printDark}"/>`
      + `<path d="M13 -42l8 -2M14 -40h-6" stroke="${C.printDark}" stroke-width="2" stroke-linecap="round"/><circle cx="21" cy="-30" r="2.6" fill="${C.lampHot}"/>`
      + `<path d="M-24 -12h44" stroke="${C.cutRim}" stroke-width=".8" opacity=".3"/><path d="M-10 -20h14" stroke="${C.cutRim}" stroke-width="1" opacity=".35"/>`, `<path d="${shell}${wheel(-17)}${wheel(16)}"/>`)
    + `</g>`;
}

/** A manhole cover and a couple of dropped flyers on the floor page. */
const streetLitter = (mx: number, my: number, seed: number) => {
  const r = seeded(seed);
  let flyers = '';
  for (let i = 0; i < 3; i++) {
    const x = mx - 120 + r() * 240, y = my - 20 + r() * 50;
    flyers += `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1((r() - 0.5) * 60)})"><rect x="-6" y="-4" width="12" height="8" fill="${[C.washi, N.plushPink, N.plushSky][i]}" opacity=".7"/><path d="M-4 -1h8M-4 1.6h6" stroke="${C.inkSoft}" stroke-width=".7" opacity=".5"/></g>`;
  }
  return `<ellipse cx="${mx}" cy="${my}" rx="26" ry="8" fill="${C.printDark}" opacity=".7"/><ellipse cx="${mx}" cy="${my}" rx="22" ry="6.4" fill="none" stroke="${N.curb}" stroke-width="1.2" stroke-dasharray="3 2" opacity=".6"/>` + flyers;
};

/**
 * A vertical shop sign (西門町's signature): a board `w` × `h` on a wall bracket, its border a neon
 * tube and its name in neon letters down it. Asleep (`lit` false), the tube and the letters are grey
 * ink and the sign snores 「zz」 (bible § 3.3). Its top-left at (x, y).
 */
function signBoard(ctx: KitCtx, x: number, y: number, w: number, h: number, chars: string, { color = C.neonPink as string, board = N.boardInk as string, lit = true, z = 2 as 1 | 2 | 3, bracket = 'l' as 'l' | 'r' | null, size = 0 } = {}): string {
  const sz = size || Math.min(w * 0.62, (h - 10) / ([...chars].length * 1.12));
  const border = `M${f1(x + 4)} ${f1(y + 4)}h${f1(w - 8)}v${f1(h - 8)}h${f1(-(w - 8))}z`;
  const arm = bracket === null ? '' : bracket === 'l'
    ? `<path d="M${f1(x - 10)} ${f1(y + 6)}H${f1(x + 2)}M${f1(x - 10)} ${f1(y + h - 8)}H${f1(x + 2)}" stroke="${C.printDark}" stroke-width="2"/>`
    : `<path d="M${f1(x + w + 10)} ${f1(y + 6)}H${f1(x + w - 2)}M${f1(x + w + 10)} ${f1(y + h - 8)}H${f1(x + w - 2)}" stroke="${C.printDark}" stroke-width="2"/>`;
  const card = depth(ctx, z, `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="2" fill="${board}"/>`
    + `<path d="M${f1(x + 1)} ${f1(y + 0.8)}h${f1(w - 2)}" stroke="${C.cutRim}" stroke-width=".8" opacity=".35"/>`, `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}"/>`);
  const tube = lit ? neonTube(ctx, border, color, 1.6) : `<path d="${border}" stroke="${N.sleepInkDeep}" stroke-width="1.6" fill="none"/>`;
  return (lit ? spill(ctx, x - 8, y - 8, w + 16, h + 16, color) : '') + arm + card + tube
    + neonChars(ctx, x + w / 2, y + (h - [...chars].length * sz * 1.12) / 2 + sz * 0.06, chars, sz, color, lit)
    + (lit ? '' : zz(x + w + 2, y + 10, 0.8));
}

/** Brick courses over a rect: the brick card and its mortar lines, running bond. */
function brickFace(ctx: KitCtx, x: number, y: number, w: number, h: number, { course = 6, fill = '' } = {}): string {
  let d = '';
  for (let yy = y + course, row = 0; yy < y + h; yy += course, row++) {
    d += `M${f1(x)} ${f1(yy)}h${f1(w)}`;
    for (let xx = x + (row % 2 ? 7 : 0); xx < x + w; xx += 14) d += `M${f1(xx)} ${f1(yy - course)}v${course}`;
  }
  return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${fill || ref(ctx, 'brickG')}"/>`
    + `<path d="${d}" stroke="${N.mortar}" stroke-width=".6" opacity=".35"/>`;
}

/**
 * A 西門町 street lamp: a dark post with a lantern head (a lit vellum box under a little roof). The
 * head's roof top is at `top` (a perch: Mocha sits on it); it stands at `foot`.
 */
function streetLamp(ctx: KitCtx, x: number, top: number, foot: number): string {
  const post = `M${x - 2.4} ${foot}V${top + 30}h4.8V${foot}Z`;
  const head = `M${x - 11} ${top + 6}h22v20h-22z`;
  return softEllipse(ctx, x, top + 16, 34, 30, 'lamp', 0.2, 'blur8')
    + depth(ctx, 3, `<path d="${post}" fill="${C.printDark}"/><rect x="${x - 7}" y="${foot - 8}" width="14" height="8" rx="2" fill="${C.printDark}"/>`
      + `<path d="M${x - 14} ${top + 6}L${x} ${top}L${x + 14} ${top + 6}Z" fill="${N.roof}"/><path d="${head}" fill="${C.lampHot}"/>`
      + `<rect x="${x - 8}" y="${top + 9}" width="16" height="14" fill="${ref(ctx, 'window')}" opacity=".8"/><path d="M${x} ${top + 6}v20M${x - 11} ${top + 16}h22" stroke="${C.printDark}" stroke-width="1.2"/>`
      + `<rect x="${x - 12}" y="${top + 26}" width="24" height="4" rx="1" fill="${C.printDark}"/>`, `<path d="${post}${head}"/><path d="M${x - 14} ${top + 6}L${x} ${top}L${x + 14} ${top + 6}Z"/>`);
}

/** A speaker cabinet (black card, two cones with lit rims), its top-left at (x, y). */
function speakerCab(ctx: KitCtx, x: number, y: number, w: number, h: number, z: 2 | 3 = 3): string {
  const r1 = Math.min(w, h * 0.5) * 0.34;
  return depth(ctx, z, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${ref(ctx, 'speakerG')}"/>`
    + `<circle cx="${f1(x + w / 2)}" cy="${f1(y + h * 0.3)}" r="${f1(r1 * 0.6)}" fill="${C.printDark}" stroke="${N.speakerCone}" stroke-width="2"/>`
    + `<circle cx="${f1(x + w / 2)}" cy="${f1(y + h * 0.68)}" r="${f1(r1)}" fill="${C.printDark}" stroke="${N.speakerCone}" stroke-width="2.4"/>`
    + `<circle cx="${f1(x + w / 2)}" cy="${f1(y + h * 0.68)}" r="${f1(r1 * 0.35)}" fill="${N.speakerCone}"/>`
    + `<path d="M${x + 1} ${y + 0.8}h${w - 2}" stroke="${C.cutRim}" stroke-width=".8" opacity=".35"/>`, `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`);
}

/** The night over 西門町: the chapter's sky, pinholes, a calm moon and the district's skyline with neon roof signs. */
function ximenSky(ctx: KitCtx, moon: readonly [number, number, number] | null, skyBase: number, seed = 5): string {
  const sk = skyline(-6, PAGE_W + 6, skyBase, seed + 30, { minH: 26, maxH: 80, winP: 0.14, winOpacity: 0.55 });
  const r = seeded(seed + 3);
  let roofSigns = '';
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * 96 + r() * 40;
    const y = skyBase - 70 - r() * 30;
    roofSigns += neonTube(ctx, `M${f1(x)} ${f1(y)}h${f1(14 + r() * 12)}`, i % 2 ? C.neonCyan : C.neonPink, 1.4);
  }
  return `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, 0, 0, PAGE_W, skyBase - 70, 48, seed)
    + (moon ? calmMoon(ctx, moon[0], moon[1], moon[2], { halo: 0.06 }) : '')
    + depth(ctx, 1, `<path d="${sk.d}" fill="${mixHex(N.plumDeep, C.shadow, 0.2)}"/>`, `<path d="${sk.d}"/>`) + sk.windows + roofSigns
    + `<rect x="-20" y="${skyBase - 40}" width="${PAGE_W + 40}" height="40" fill="${ref(ctx, 'lampWashN')}"/>`;
}

/**
 * A shopfront building in the 徒步區: a plum facade from `top` to `foot`, rows of windows (a few
 * lit, a few neon-tinted), an awning over a lit shop at street level, and vertical signs hanging
 * off it (`signs`: [x offset, y, h, chars, colour, lit]).
 */
function shopfront(ctx: KitCtx, x0: number, x1: number, top: number, foot: number, seed: number, { z = 2 as 1 | 2 | 3, shade = 0, signs = [] as readonly (readonly [number, number, number, string, string, boolean])[] } = {}): string {
  const r = seeded(seed);
  const w = x1 - x0;
  let wins = '';
  for (let y = top + 10; y < foot - 60; y += 26) {
    for (let x = x0 + 8; x < x1 - 14; x += 22) {
      const k = r();
      if (k < 0.22) wins += vellumWindow(ctx, x, y, 14, 16, { bloom: 0, frame: N.plumDeep });
      else if (k < 0.32) wins += `<rect x="${x}" y="${y}" width="14" height="16" rx="1" fill="${k < 0.27 ? C.neonPink : C.neonCyan}" opacity=".35"/>`;
      else wins += `<rect x="${x}" y="${y}" width="14" height="16" rx="1" fill="${N.plumDeep}" opacity=".8"/>`;
    }
  }
  const shopY = foot - 52;
  const facade = `<rect x="${x0}" y="${top}" width="${w}" height="${foot - top}" fill="${mixHex(N.plumLight, N.plumDeep, 0.35 + shade)}"/>`;
  const shop = `<rect x="${x0 + 4}" y="${shopY + 10}" width="${w - 8}" height="42" fill="${ref(ctx, 'window')}" opacity=".85"/>`
    + `<path d="M${x0 + 4} ${shopY + 30}h${w - 8}" stroke="${N.plumDeep}" stroke-width="1" opacity=".5"/>`
    + `<path d="M${x0} ${shopY}h${w}l-4 10h${-(w - 8)}z" fill="${N.boardMaroon}"/>`;
  const outline = `<rect x="${x0}" y="${top}" width="${w}" height="${foot - top}"/>`;
  return depth(ctx, z, facade + wins + shop + `<path d="M${x0} ${top + 0.6}h${w}" stroke="${C.cutRim}" stroke-width=".8" opacity=".3"/>`, outline)
    + signs.map(([dx, y, h, chars, color, lit]) => signBoard(ctx, x0 + dx, y, 20, h, chars, { color, lit, z: Math.min(3, z + 1) as 2 | 3, board: [N.boardInk, N.boardMaroon, N.boardTeal][Math.floor(r() * 3)] })).join('');
}

/** A crowd of paper silhouettes standing at `foot` from x0 to x1 (heads and shoulders, a phone or two lit). */
function crowd(ctx: KitCtx, x0: number, x1: number, foot: number, seed: number): string {
  const r = seeded(seed);
  let d = '';
  let phones = '';
  for (let x = x0; x < x1; x += 11 + r() * 8) {
    const h = 34 + r() * 14;
    d += `M${f1(x - 8)} ${foot}v${f1(-h + 14)}q0 -6 6 -7a6 6 0 1 1 6 0q6 1 6 7v${f1(h - 14)}z`;
    if (r() < 0.3) phones += `<rect x="${f1(x + 2)}" y="${f1(foot - h + 12)}" width="3" height="5" rx=".6" fill="${C.neonCyan}" opacity=".85"/>`;
  }
  return depth(ctx, 2, `<path d="${d}" fill="${mixHex(N.plumDeep, C.shadow, 0.3)}"/>` + phones, `<path d="${d}"/>`);
}

/**
 * The floor page as a 西門町 street: asphalt toward the reader, the 徒步區's pavers at the back,
 * neon puddles, and (optionally) the painted crossing's stripes receding to the gutter.
 */
function streetFloor(ctx: KitCtx, { crossing = false, pavers = 70, seed = 9 } = {}): string {
  const { x, y, w, h } = FLOOR_RECT;
  const r = seeded(seed);
  let joints = '';
  for (let yy = y + 6; yy < y + pavers; yy += 9) for (let xx = x + ((yy - y) % 18 > 8 ? 9 : 0); xx < x + w; xx += 18) joints += `M${f1(xx)} ${f1(yy)}h14`;
  let stripes = '';
  if (crossing) {
    const k = (FLOOR_BOTTOM - GUTTER_Y) / (GUTTER_Y + 360);
    for (let i = 0; i < 9; i++) {
      const xa = 30 + i * 40;
      const t0 = (pavers + 8) / h, t1 = 0.92;
      const p = (xx: number, t: number) => `${f1(xx + (xx - 195) * k * t)} ${f1(y + h * t)}`;
      stripes += `M${p(xa, t0)}L${p(xa + 22, t0)}L${p(xa + 22, t1)}L${p(xa, t1)}Z`;
    }
  }
  let puddles = '';
  for (let i = 0; i < 7; i++) {
    const px = x + 30 + r() * (w - 60), py = y + pavers + 20 + r() * (h - pavers - 40);
    puddles += `<ellipse cx="${f1(px)}" cy="${f1(py)}" rx="${f1(14 + r() * 20)}" ry="${f1(3 + r() * 3)}" fill="${i % 2 ? C.neonCyan : C.neonPink}" opacity=".12"/>`;
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'asphaltG')}"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${pavers}" fill="${ref(ctx, 'paverN')}"/><path d="${joints}" stroke="${N.paverDeep}" stroke-width=".8" opacity=".5"/>`
    + `<path d="M${x} ${y + pavers}H${x + w}" stroke="${N.curb}" stroke-width="3"/><path d="M${x} ${y + pavers - 1.2}H${x + w}" stroke="${C.cutRim}" stroke-width=".8" opacity=".3"/>`
    + (stripes ? `<path d="${stripes}" fill="${N.stripe}" opacity=".55"/>` : '') + puddles
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}" opacity=".4"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="24" fill="${C.shadow}" opacity=".2"/>`;
}

// ——— 4-1 「板南線往西門」 ———

/** A car window: a rounded cut in a steel frame, showing what is outside. */
function carWindow(ctx: KitCtx, x: number, y: number, w: number, h: number, inside: string, seed: number): string {
  const id = ctx.id(`c4win${seed}`);
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/></clipPath><g clip-path="url(#${id})">${inside}`
    + `<path d="M${x} ${y + h * 0.6}L${x + w * 0.5} ${y}H${x + w * 0.66}L${x} ${y + h}Z" fill="${C.cutRim}" opacity=".07"/></g>`
    + `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="11" fill="none" stroke="${ref(ctx, 'steelN')}" stroke-width="5"/>`;
}

/**
 * 4-1: a 板南線 car pulling in at 西門 (bible § 6, the 月亮線 car row: a side cut-away box). Left,
 * the car: its cream wall and ceiling, the neon route strip lit at 西門, the strap rail with
 * Mocha's strap (its handle's top at (96, 226)), the ad screen's bracket over the seats (the screen,
 * a decoy, is drawn live at (40, 286)), the blue band, the teal 博愛座 and the bench. The car's end:
 * a steel frame round the low doorway (the `c4/doors` part, x 220–280 from y 352) under the route
 * map's lit header, which Mocha sits on (330). Right, the platform: 「出口 西門町 · 紅樓」, a mosaic
 * of 西門町's neon signs on the tiled wall, the 西門 name board (the 土地公 at (336, 296)).
 */
const blueCar: BackdropDraw = (ctx) => {
  const carX1 = 286;
  // ——— The platform ———
  let tiles = '';
  for (let y = 22; y < GUTTER_Y; y += 14) tiles += `M${carX1} ${y}H${PAGE_W + 20}`;
  for (let x = carX1 + 8; x < PAGE_W + 20; x += 20) tiles += `M${x} 22V${GUTTER_Y}`;
  // The mosaic: 西門町's vertical signs in tile colours (a station mural toward the district)
  const mosaic = (() => {
    const id = ctx.id('mosaic');
    const boards: string[] = [];
    const cols = [C.neonPink, C.neonCyan, N.neonViolet, C.neonPink];
    [[296, 70, 18, 120], [322, 96, 16, 96], [348, 64, 18, 110], [374, 88, 16, 100]].forEach(([x, y, w, h], i) => {
      boards.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${N.boardInk}" opacity=".7"/><rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" fill="none" stroke="${cols[i]}" stroke-width="1.4" opacity=".5"/>`);
    });
    return `<clipPath id="${id}"><rect x="${carX1}" y="56" width="${PAGE_W - carX1 + 20}" height="164"/></clipPath><g clip-path="url(#${id})">`
      + `<rect x="${carX1}" y="56" width="${PAGE_W}" height="164" fill="${mixHex(N.plumDeep, T.carWall, 0.3)}"/>` + boards.join('')
      + `<rect x="${carX1}" y="196" width="${PAGE_W}" height="30" fill="${N.paver}"/></g>`
      + `<rect x="${carX1 + 4}" y="54" width="${PAGE_W - carX1 + 10}" height="168" fill="none" stroke="${T.steelDeep}" stroke-width="2.4"/>`;
  })();
  const wall = `<rect x="${carX1}" y="0" width="${PAGE_W - carX1 + 20}" height="${GUTTER_Y}" fill="${ref(ctx, 'tileWallN')}"/>`
    + `<path d="${tiles}" stroke="${T.carWallShade}" stroke-width=".8" opacity=".3"/>` + mosaic
    + `<rect x="${carX1}" y="236" width="${PAGE_W}" height="10" fill="${T.bannan}"/><rect x="${carX1}" y="247" width="${PAGE_W}" height="2" fill="${T.bannanDeep}"/>`;
  const exit = `<path d="M318 0V10M376 0V10" stroke="${T.steelDeep}" stroke-width="1.6"/>`
    + depth(ctx, 2, `<rect x="300" y="10" width="90" height="26" rx="3" fill="${T.navyDeep}"/>`, `<rect x="300" y="10" width="90" height="26" rx="3"/>`)
    + `<text data-art-text="" x="316" y="27.5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.lamp}">出口</text>`
    + `<text data-art-text="" x="362" y="24" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="700" font-size="7.5" fill="${C.chalk}">西門町</text>`
    + `<text data-art-text="" x="362" y="32.5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="700" font-size="6" fill="${C.chalk}" opacity=".8">紅樓</text>`
    + `<path d="M330 23h8m-3 -3l3 3l-3 3" stroke="${C.lamp}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  const board = depth(ctx, 2, `<rect x="298" y="254" width="92" height="36" rx="3" fill="${C.washi}"/><rect x="298" y="282" width="92" height="8" fill="${T.bannan}"/>`, `<rect x="298" y="254" width="92" height="36" rx="3"/>`)
    + `<text data-art-text="" x="354" y="274" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="15" fill="${T.navyDeep}" letter-spacing="6">西門</text>`
    + `<circle cx="312" cy="268" r="7" fill="${T.bannan}"/><text data-art-text="" x="312" y="270.6" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="6" fill="${C.cutRim}">BL</text>`
    + `<text data-art-text="" x="354" y="288.6" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="5.5" fill="${C.cutRim}" letter-spacing="1">XIMEN</text>`;
  const ceilP = `<rect x="${carX1}" y="0" width="${PAGE_W - carX1 + 20}" height="8" fill="${T.lattice}"/>`;
  // ——— The car ———
  const back = `<rect x="-20" y="0" width="${carX1 + 20}" height="${GUTTER_Y + 40}" fill="${ref(ctx, 'carWallN')}"/>`
    + paperFibres(-20, 0, carX1 + 20, GUTTER_Y, 46, T.carWallShade, 41, 0.25);
  const ceiling = `<path d="M-20 0H${carX1}V64Q130 78 -20 64Z" fill="${T.carCeiling}"/><path d="M-20 64Q130 78 ${carX1} 64" stroke="${T.carWallShade}" stroke-width="2" fill="none"/>`
    + `<rect x="10" y="30" width="96" height="5" rx="2.5" fill="${C.lampHot}"/><rect x="126" y="30" width="80" height="5" rx="2.5" fill="${C.lampHot}"/>`
    + softEllipse(ctx, 58, 32, 54, 8, 'lamp', 0.3) + softEllipse(ctx, 166, 32, 46, 8, 'lamp', 0.3);
  // The route strip: the 板南線's blue, 西門 lit
  const stops = [22, 62, 102, 142, 182];
  const names = ['善導寺', '台北車站', '西門', '龍山寺', '江子翠'];
  const route = depth(ctx, 2, `<rect x="6" y="78" width="196" height="28" rx="4" fill="${T.navyDeep}"/>`, `<rect x="6" y="78" width="196" height="28" rx="4"/>`)
    + `<path d="M16 97H192" stroke="${T.bannan}" stroke-width="4" stroke-linecap="round"/>`
    + stops.map((x, i) => `<circle cx="${x}" cy="97" r="${i === 2 ? 4.6 : 3}" fill="${i === 2 ? C.lampHot : C.cutRim}" stroke="${T.bannan}" stroke-width="1.6"/>`).join('')
    + softEllipse(ctx, 102, 97, 10, 8, 'lamp', 0.4)
    + stops.map((x, i) => `<text data-art-text="" x="${x}" y="90" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="${i === 2 ? 900 : 700}" font-size="${i === 2 ? 8 : 5.5}" fill="${i === 2 ? C.lamp : C.chalk}"${i === 2 ? '' : ' opacity=".7"'}>${names[i]}</text>`).join('');
  // The windows: the station sliding in — its tiled wall, the blue band, a pink neon glow from the exits
  const station = (x: number, y: number, w: number, h: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mixHex(T.carWallShade, N.plum, 0.5)}"/>`
    + `<path d="${Array.from({ length: Math.ceil(h / 10) }, (_, i) => `M${x} ${y + i * 10}h${w}`).join('')}" stroke="${N.plumDeep}" stroke-width=".7" opacity=".4"/>`
    + `<rect x="${x}" y="${y + h * 0.36}" width="${w}" height="10" fill="${T.bannan}" opacity=".75"/>`
    + softEllipse(ctx, x + w / 2, y + 14, w * 0.4, 10, 'lamp', 0.18)
    + `<path d="M${x + w * 0.2} ${y + h * 0.7}h${w * 0.22}" stroke="${C.neonPink}" stroke-width="2" opacity=".55"/>`;
  const winA = carWindow(ctx, 8, 128, 66, 90, station(8, 128, 66, 90), 1);
  const winB = carWindow(ctx, 118, 128, 84, 90, station(118, 128, 84, 90), 2);
  const strap = (x: number, top: number) => `<path d="M${x} 116V${top - 2}" stroke="${T.bannanDeep}" stroke-width="4"/>`
    + `<circle cx="${x}" cy="${top + 9}" r="9" fill="none" stroke="${C.cutRim}" stroke-width="3.6"/><circle cx="${x}" cy="${top + 9}" r="9" fill="none" stroke="${T.steel}" stroke-width="2"/>`;
  const rail = depth(ctx, 3, `<rect x="-20" y="112" width="${carX1 - 60}" height="5" rx="2.5" fill="${ref(ctx, 'steelN')}"/>`
    + `<path d="M30 70V112M170 70V112" stroke="${T.steelDeep}" stroke-width="2.4"/>`
    + strap(96, 226) + `<path d="M160 116V146" stroke="${T.bannanDeep}" stroke-width="4"/><path d="M153 146H167L160 158Z" fill="none" stroke="${T.bannanDeep}" stroke-width="3" stroke-linejoin="round"/>`,
  `<rect x="-20" y="112" width="${carX1 - 60}" height="5"/>`);
  const band = `<rect x="-20" y="236" width="${carX1 + 20}" height="10" fill="${T.bannan}"/><rect x="-20" y="247" width="${carX1 + 20}" height="2" fill="${T.bannanDeep}"/>`;
  // The ad screen's bracket over the seats (the screen itself is the decoy, drawn live at (40, 286))
  const bracket = depth(ctx, 2, `<path d="M40 250V266" stroke="${T.steelDeep}" stroke-width="3"/><rect x="14" y="264" width="52" height="4" rx="2" fill="${T.steelDeep}"/>`, `<rect x="14" y="250" width="52" height="18"/>`)
    + softEllipse(ctx, 40, 290, 40, 26, 'lamp', 0.12, 'blur8');
  const prioSign = depth(ctx, 2, `<rect x="112" y="262" width="58" height="16" rx="3" fill="${T.priority}"/>`, `<rect x="112" y="262" width="58" height="16" rx="3"/>`)
    + `<text data-art-text="" x="141" y="273.5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.cutRim}" letter-spacing="2">博愛座</text>`;
  // The car's end: a steel panel round the low doorway (x 220–280, from y 352) and the route map's
  // header over it (Mocha sits on its top, (250, 330)): 「往 南港展覽館」 in amber LEDs, 西門 lit
  const frame = depth(ctx, 3, `<path d="M214 0H${carX1}V470H280V360Q280 352 272 352H228Q220 352 220 360V470H214Z" fill="${T.steel}"/>`
    + `<path d="M${carX1} 0V470" stroke="${T.steelDeep}" stroke-width="4"/><path d="M216 70h68M216 200h68" stroke="${T.steelDeep}" stroke-width="1.2" opacity=".6"/>`
    + `<rect x="226" y="214" width="48" height="30" rx="2" fill="${C.washi}"/><path d="M232 222h36M232 228h28M232 234h32" stroke="${C.inkSoft}" stroke-width="1.6" opacity=".35"/>`
    + `<circle cx="250" cy="148" r="14" fill="${T.steelDeep}" opacity=".5"/><circle cx="250" cy="148" r="9" fill="${T.lampStop}" opacity=".75"/>`, `<path d="M214 0H${carX1}V470H214Z"/>`)
    + depth(ctx, 3, `<rect x="212" y="330" width="76" height="20" rx="3" fill="${T.navyDeep}"/>`
      + `<path d="M218 344h64" stroke="${T.bannan}" stroke-width="2.4" stroke-linecap="round"/>`
      + [226, 242, 258, 274].map((x, i) => `<circle cx="${x}" cy="344" r="${i === 1 ? 2.6 : 1.8}" fill="${i === 1 ? C.lampHot : C.cutRim}"/>`).join(''), `<rect x="212" y="330" width="76" height="20" rx="3"/>`)
    + `<text data-art-text="" x="250" y="340" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6.5" fill="${C.lampAmber}">往 南港展覽館</text>`;
  const doorway = `<rect x="220" y="352" width="60" height="118" fill="${ref(ctx, 'tileWallN')}"/>`
    + `<path d="${Array.from({ length: 8 }, (_, i) => `M220 ${360 + i * 14}h60`).join('')}" stroke="${T.carWallShade}" stroke-width=".8" opacity=".35"/>`
    + `<rect x="220" y="400" width="60" height="70" fill="${mixHex(T.granite, N.plum, 0.3)}"/>` + softEllipse(ctx, 250, 430, 34, 30, 'lamp', 0.2);
  const seat = (x0: number, x1: number, top: number, fill: string) => depth(ctx, 3, `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="40" rx="8" fill="${fill}"/>`
    + `<rect x="${x0 - 4}" y="${top + 36}" width="${x1 - x0 + 8}" height="22" rx="6" fill="${fill}"/><path d="M${x0 + 4} ${top + 40}h${x1 - x0 - 8}" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`
    + `<path d="${Array.from({ length: Math.floor((x1 - x0) / 32) }, (_, i) => `M${x0 + 32 + i * 32} ${top + 6}V${top + 34}`).join('')}" stroke="${C.shadow}" stroke-width="1.6" opacity=".2"/>`, `<rect x="${x0 - 4}" y="${top}" width="${x1 - x0 + 8}" height="58"/>`);
  const poles = `<rect x="104" y="40" width="5" height="440" fill="${ref(ctx, 'steelN')}"/><rect x="206" y="40" width="5" height="440" fill="${ref(ctx, 'steelN')}"/>`;
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(T.navyDeep, C.printDark, 0.4)}"/>`
    + `<rect x="${carX1}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="110" fill="${mixHex(T.granite, N.plum, 0.4)}"/>`
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
    + pools(ctx, [[344, GUTTER_Y + 40, 80, 26, 'pink']]));
  return neonDefs(ctx) + standingPage(ctx, wall + exit + board + ceilP + back + ceiling + route + winA + winB + band + bracket + prioSign
    + `<rect x="${carX1}" y="${GUTTER_Y - 30}" width="${PAGE_W}" height="30" fill="${ref(ctx, 'lampWashN')}"/>`)
    + floor + doorway + poles + rail + seat(6, 98, 392, ref(ctx, 'seatN')) + seat(116, 200, 392, ref(ctx, 'prioN')) + frame + bookCues(ctx) + block();
};

// ——— 4-2 「紅樓」 ———

/**
 * 4-2: 西門紅樓 at night. The octagonal house's ground floor is the wheel (`c4/red-house`, a plan
 * of the octagon turning on the plaza at (176, 380)); behind it the house's upper storey rises in
 * elevation: three faces of red brick with the white trim bands and arched windows, the dark
 * octagonal roof and its little lantern on top, whose lit window sill (176, 196) is Mocha's
 * `window`. West: the street lamp (Mocha's `lamp`, its head's roof at (34, 250)), the plaza's
 * benches. East: a record shop under a tiled eave (`eave`, (262, 300); the lantern part hangs from
 * it), its shutter (the `c4/shutter` part, x 290–346) and button, and its lit window past it where the
 * bead waits (364, 486).
 */
const redHouse: BackdropDraw = (ctx) => {
  // The upper storey of the octagon: three faces (left in shade, front lit, right in shade)
  const cx = 176;
  const faceW = 72, sideW = 44;
  const top = 228, base = 336;
  const fx0 = cx - faceW / 2, fx1 = cx + faceW / 2;
  const left = `M${fx0 - sideW} ${top + 6}L${fx0} ${top}V${base}L${fx0 - sideW} ${base - 4}Z`;
  const right = `M${fx1} ${top}L${fx1 + sideW} ${top + 6}V${base - 4}L${fx1} ${base}Z`;
  const arch = (x: number, y: number, w: number, h: number) => `M${f1(x)} ${f1(y + h)}V${f1(y + w / 2)}a${f1(w / 2)} ${f1(w / 2)} 0 0 1 ${f1(w)} 0V${f1(y + h)}Z`;
  const upper = depth(ctx, 2, `<path d="${left}" fill="${mixHex(N.brick, N.brickDeep, 0.6)}"/><path d="${right}" fill="${mixHex(N.brick, N.brickDeep, 0.45)}"/>`
    + brickFace(ctx, fx0, top, faceW, base - top)
    // White trim bands (the 紅樓's signature stripes)
    + `<path d="M${fx0 - sideW} ${top + 20}L${fx0} ${top + 15}H${fx1}L${fx1 + sideW} ${top + 20}M${fx0 - sideW} ${base - 20}L${fx0} ${base - 17}H${fx1}L${fx1 + sideW} ${base - 20}" stroke="${N.trim}" stroke-width="3" fill="none"/>`
    + `<path d="${arch(fx0 + 10, top + 26, 16, 36)}${arch(cx - 8, top + 26, 16, 36)}${arch(fx1 - 26, top + 26, 16, 36)}" fill="${ref(ctx, 'window')}" opacity=".9"/>`
    + `<path d="${arch(fx0 - sideW + 10, top + 30, 12, 32)}${arch(fx0 - sideW + 26, top + 28, 12, 32)}${arch(fx1 + 6, top + 28, 12, 32)}${arch(fx1 + 22, top + 30, 12, 32)}" fill="${mixHex(N.brickDeep, C.shadow, 0.3)}"/>`
    + `<path d="${arch(fx0 + 10, top + 26, 16, 36)}${arch(cx - 8, top + 26, 16, 36)}${arch(fx1 - 26, top + 26, 16, 36)}" fill="none" stroke="${N.trim}" stroke-width="1.6"/>`
    // A cornice and the octagonal roof's three facets, the lantern on top
    + `<path d="M${fx0 - sideW - 4} ${top + 7}L${fx0} ${top - 2}H${fx1}L${fx1 + sideW + 4} ${top + 7}V${top + 11}L${fx1} ${top + 3}H${fx0}L${fx0 - sideW - 4} ${top + 11}Z" fill="${N.trim}"/>`
    + `<path d="M${fx0 - sideW - 2} ${top + 7}L${cx - 10} ${top - 24}H${cx + 10}L${fx1 + sideW + 2} ${top + 7}L${fx1} ${top - 1}H${fx0}Z" fill="${ref(ctx, 'roofN')}"/>`
    + `<path d="M${fx0} ${top - 1}L${cx - 10} ${top - 24}M${fx1} ${top - 1}L${cx + 10} ${top - 24}" stroke="${N.roofLight}" stroke-width="1.2"/>`
    + `<rect x="${cx - 13}" y="${top - 46}" width="26" height="22" fill="${mixHex(N.brick, N.brickDeep, 0.3)}"/><path d="M${cx - 16} ${top - 46}L${cx} ${top - 58}L${cx + 16} ${top - 46}Z" fill="${N.roof}"/>`
    + `<path d="M${cx} ${top - 58}v-6" stroke="${C.goldDeep}" stroke-width="1.6"/>`,
  `<path d="${left}${right}"/><rect x="${fx0}" y="${top - 46}" width="${faceW}" height="${base - top + 46}"/>`);
  // The lantern's window: round, lit (Mocha's sill at (176, 196))
  const lanternWin = softEllipse(ctx, cx, top - 36, 16, 12, 'lamp', 0.3)
    + `<circle cx="${cx}" cy="${top - 36}" r="7" fill="${ref(ctx, 'window')}"/><path d="M${cx} ${top - 43}v14M${cx - 7} ${top - 36}h14" stroke="${N.brickDeep}" stroke-width="1"/>`
    + `<rect x="${cx - 12}" y="${top - 26}" width="24" height="3" fill="${N.trim}"/>`;
  // A neon 「紅樓」 over the door line, a cyan tube underlining it
  const name = `<g${glow(ctx)}><text data-art-text="" x="${cx}" y="${base - 23}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="11" fill="${C.neonPink}" letter-spacing="3">紅樓</text></g>`
    + neonTube(ctx, `M${cx - 18} ${base - 19}h36`, C.neonCyan, 1.2);
  // West: the plaza behind, a row of food-stall roofs and the street lamp
  const west = shopfront(ctx, -20, 70, 150, GUTTER_Y, 51, { z: 1, shade: 0.15, signs: [[50, 168, 70, '咖啡', C.neonCyan, true]] })
    + depth(ctx, 1, `<path d="M-20 190L30 170L80 190V${GUTTER_Y}H-20Z" fill="${mixHex(N.plum, N.plumDeep, 0.4)}"/>`, `<path d="M-20 190L30 170L80 190V${GUTTER_Y}H-20Z"/>`);
  // East: the record shop's building, its eave (the lantern's hook at (290, 300)), its sign and the lit shop
  const shopTop = 140;
  const east = depth(ctx, 2, `<rect x="250" y="${shopTop}" width="150" height="${GUTTER_Y - shopTop + 2}" fill="${mixHex(N.plumLight, N.plum, 0.5)}"/>`
    + [0, 1].map((row) => [0, 1, 2, 3].map((col) => {
      const x = 262 + col * 32, y = shopTop + 18 + row * 44;
      return (row + col) % 3 === 0 ? vellumWindow(ctx, x, y, 20, 26, { bloom: 0, frame: N.plumDeep }) : `<rect x="${x}" y="${y}" width="20" height="26" rx="1" fill="${N.plumDeep}"/>`;
    }).join('')).join('')
    + `<path d="M250 ${shopTop + 0.6}h150" stroke="${C.cutRim}" stroke-width=".8" opacity=".3"/>`, `<rect x="250" y="${shopTop}" width="150" height="${GUTTER_Y - shopTop}"/>`);
  const eave = depth(ctx, 3, `<path d="M244 312L256 294H400V312Z" fill="${ref(ctx, 'roofN')}"/><path d="${Array.from({ length: 13 }, (_, i) => `M${258 + i * 11} 296l-2 15`).join('')}" stroke="${N.roofLight}" stroke-width="1" opacity=".7"/>`
    + `<path d="M244 312H400" stroke="${N.trim}" stroke-width="2"/><path d="M290 312v4" stroke="${C.printDark}" stroke-width="1.6"/>`, `<path d="M244 312L256 294H400V312Z"/>`);
  const shopSign = signBoard(ctx, 352, 176, 22, 92, '唱片行', { color: C.neonCyan, board: N.boardTeal, bracket: 'r' })
    + depth(ctx, 2, `<rect x="300" y="250" width="44" height="18" rx="2" fill="${N.boardMaroon}"/>`, `<rect x="300" y="250" width="44" height="18"/>`)
    + `<g${glow(ctx)}><text data-art-text="" x="322" y="263" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="10" fill="${C.neonPink}">♪ 黑膠</text></g>`;
  const back = ximenSky(ctx, [312, 56, 13], 210, 13) + west + east + eave + shopSign + upper + lanternWin + name
    + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'lampWashN')}"/>`;
  // The shop past the shutter: its doorway (x 290–346) dark under the shutter's housing, the lit
  // window beyond (x 346–400) with record sleeves on its shelves
  const shop = depth(ctx, 3, `<rect x="286" y="330" width="120" height="160" fill="${mixHex(N.plum, N.plumDeep, 0.5)}"/>`
    + `<rect x="348" y="346" width="52" height="136" fill="${ref(ctx, 'window')}" opacity=".9"/>`
    + `<path d="M348 386h52M348 426h52" stroke="${N.brickDeep}" stroke-width="2"/>`
    + [0, 1, 2].map((i) => [0, 1, 2].map((j) => `<rect x="${352 + j * 16}" y="${352 + i * 40 + (j % 2) * 3}" width="12" height="30" rx="1" fill="${[C.neonPink, N.boardTeal, N.brick, N.neonViolet][(i + j) % 4]}" opacity=".75"/>`).join('')).join('')
    + `<rect x="288" y="378" width="60" height="18" fill="${N.shutterDeep}"/>`, `<rect x="286" y="330" width="120" height="160"/>`);
  // The plaza on the floor page: 紅樓's brick pavers fanning round the house, neon puddles
  const floor = floorPage(ctx, streetFloor(ctx, { pavers: 200, seed: 21 })
    + `<ellipse cx="176" cy="${GUTTER_Y + 60}" rx="150" ry="58" fill="${N.brickDeep}" opacity=".45"/><ellipse cx="176" cy="${GUTTER_Y + 60}" rx="132" ry="48" fill="none" stroke="${N.trim}" stroke-width="2" opacity=".35"/>`
    + `<path d="${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `M${f1(176 + Math.cos(a) * 40)} ${f1(GUTTER_Y + 60 + Math.sin(a) * 15)}L${f1(176 + Math.cos(a) * 132)} ${f1(GUTTER_Y + 60 + Math.sin(a) * 48)}`; }).join('')}" stroke="${N.mortar}" stroke-width="1" opacity=".2"/>`
    + streetLitter(200, 600, 22)
    + pools(ctx, [[34, 476, 70, 20, 'warm'], [176, 470, 110, 26, 'pink'], [356, 486, 60, 20, 'warm']]));
  // A bench on the plaza and a planter
  const bench = depth(ctx, 3, `<rect x="56" y="420" width="44" height="5" rx="2" fill="${N.brickDeep}"/><rect x="56" y="408" width="44" height="4" rx="2" fill="${N.brickDeep}"/><path d="M60 425v14M96 425v14" stroke="${C.printDark}" stroke-width="2.4"/>`, `<rect x="56" y="408" width="44" height="31"/>`);
  return neonDefs(ctx) + standingPage(ctx, back) + floor + bench + shop + eave + streetLamp(ctx, 34, 250, 470)
    + scooter(ctx, 62, 610, N.danceCyan, 1.3) + scooter(ctx, 326, 600, C.washi, 1.3) + bookCues(ctx) + block();
};

// ——— 4-3 「霓虹燈睡著了」 ———

/** A cardboard box with its flaps open (corrugated), its rim at `top`, standing on `foot`. */
function cardboardBox(ctx: KitCtx, x0: number, x1: number, top: number, foot: number): string {
  const w = x1 - x0;
  const body = `M${x0} ${top}H${x1}V${foot}H${x0}Z`;
  const flaps = `M${x0} ${top}l-10 -12l${f1(w * 0.42)} -2l${f1(-w * 0.42 + 14)} 14ZM${x1} ${top}l10 -10l${f1(-w * 0.4)} -4l${f1(w * 0.4 - 14)} 14Z`;
  return depth(ctx, 3, `<path d="${flaps}" fill="${C.corrugatedLight}"/><path d="${body}" fill="url(#${ctx.id('corr')})"/>`
    + `<path d="${body}" fill="${C.shadow}" opacity=".18"/><rect x="${x0}" y="${top}" width="${w}" height="5" fill="${C.shadow}" opacity=".45"/>`
    + `<path d="M${x0 + 6} ${top + 16}h${w - 12}" stroke="${C.corrugatedDark}" stroke-width="5" opacity=".5"/>`
    + `<text data-art-text="" x="${f1(x0 + w / 2)}" y="${top + 34}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.kraftFiber}" opacity=".7">易碎</text>`
    + `<path d="M${x0 + 1} ${top + 0.6}H${x1 - 1}" stroke="${C.cutRim}" stroke-width=".8" opacity=".4"/>`, `<path d="${body}${flaps}"/>`);
}

/**
 * 4-3: an alley off 西門町 where every sign is asleep. The alley's long side wall runs across the
 * standing page: plum render with a back door and its unlit bulb, drainpipes, an air-conditioner
 * dripping, a fire-escape ladder, and high up, more vertical signs fast asleep (grey ink and 「zz」);
 * the three sign parts hang from its brackets at x 42, 154 and 272. At the right the wall stops and
 * the alley turns: round the corner a deeper, darker passage where the bead waits (350, 430). A
 * strip of sky and tangled wires over the top. On the floor: the alley's concrete, a drain channel,
 * the cardboard box Mocha hides in (its rim at (92, 420)), bins and bags.
 */
const neonAlley: BackdropDraw = (ctx) => {
  const wallX1 = 314;
  // A strip of sky between the roofs, wires across it
  const sky = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="120" fill="${ref(ctx, 'sky')}"/>` + pinholes(ctx, 0, 0, PAGE_W, 70, 18, 33)
    + `<path d="M-20 40Q120 70 260 34T420 52M-20 58Q160 84 420 70M60 0Q90 40 140 46" stroke="${C.printDark}" stroke-width="1.2" fill="none"/>`;
  // The wall: plum render, its stains, pipes, a back door, the AC unit and a ladder
  const r = seeded(43);
  let stains = '';
  for (let i = 0; i < 16; i++) stains += `<ellipse cx="${f1(r() * wallX1)}" cy="${f1(80 + r() * 260)}" rx="${f1(10 + r() * 30)}" ry="${f1(4 + r() * 10)}" fill="${N.plumDeep}" opacity=".25"/>`;
  const wall = depth(ctx, 2, `<rect x="-20" y="34" width="${wallX1 + 20}" height="${GUTTER_Y - 34 + 2}" fill="${ref(ctx, 'plumWall')}"/>` + stains
    + paperFibres(-20, 40, wallX1 + 20, 300, 40, N.plumLight, 44, 0.2)
    + `<path d="M-20 34H${wallX1}" stroke="${N.plumLight}" stroke-width="3"/>`, `<rect x="-20" y="34" width="${wallX1 + 20}" height="${GUTTER_Y - 34}"/>`);
  const pipes = depth(ctx, 3, `<path d="M118 34V${GUTTER_Y}M226 34V200q0 8 8 8h30" stroke="${N.shutterDeep}" stroke-width="5" fill="none"/>`
    + `<path d="M116.6 34V${GUTTER_Y}M224.6 34V200" stroke="${N.shutterLight}" stroke-width="1" opacity=".5"/>`
    + `<path d="M112 120h12M112 230h12M220 110h12" stroke="${N.shutterDeep}" stroke-width="3"/>`, `<path d="M116 34h4V${GUTTER_Y}h-4z"/>`);
  const door = depth(ctx, 2, `<rect x="186" y="224" width="54" height="${GUTTER_Y - 222}" fill="${N.plumDeep}"/><rect x="190" y="230" width="46" height="${GUTTER_Y - 228}" fill="${N.boardMaroon}"/>`
    + `<path d="M194 250h38v40h-38z" fill="none" stroke="${N.plum}" stroke-width="1.4"/><circle cx="230" cy="300" r="2" fill="${C.goldDeep}"/>`
    + `<rect x="200" y="208" width="26" height="10" rx="2" fill="${N.sleepInkDeep}"/><circle cx="213" cy="216" r="3.4" fill="${N.sleepInk}"/>`, `<rect x="186" y="224" width="54" height="${GUTTER_Y - 222}"/>`);
  const ac = depth(ctx, 3, `<rect x="20" y="120" width="56" height="36" rx="3" fill="${N.shutterLight}"/><circle cx="58" cy="138" r="12" fill="${N.shutterDeep}"/><path d="M58 126v24M46 138h24M50 130l16 16M66 130l-16 16" stroke="${N.shutter}" stroke-width="1.2"/>`
    + `<path d="M26 128h18M26 134h18M26 140h18M26 146h18" stroke="${N.shutterDeep}" stroke-width="1.2"/><path d="M30 156v10" stroke="${N.shutterDeep}" stroke-width="2"/>`, `<rect x="20" y="120" width="56" height="36"/>`)
    + `<path d="M30 170v4M30 182v3M30 192v4" stroke="${C.vellum}" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>`;
  const ladder = depth(ctx, 3, `<path d="M262 60V${GUTTER_Y - 30}M286 60V${GUTTER_Y - 30}" stroke="${C.printDark}" stroke-width="2.4"/><path d="${Array.from({ length: 13 }, (_, i) => `M262 ${70 + i * 18}h24`).join('')}" stroke="${C.printDark}" stroke-width="1.8"/>`
    + `<rect x="250" y="56" width="50" height="5" fill="${C.printDark}"/>`, `<rect x="260" y="56" width="30" height="${GUTTER_Y - 86}"/>`);
  // High up: more signs, asleep
  const sleepers = signBoard(ctx, 140, 64, 22, 96, '旅社', { lit: false, board: N.boardInk, z: 2 })
    + signBoard(ctx, 64, 182, 20, 84, '拉麵', { lit: false, board: N.boardMaroon, z: 2, bracket: 'r' })
    + signBoard(ctx, 290, 120, 20, 90, '刺青', { lit: false, board: N.boardTeal, z: 2, bracket: 'l' });
  // The three sign parts' brackets (the boards are the parts: x 42, 154, 272; their tops at y 300)
  const brackets = [42, 154, 272].map((x) => `<path d="M${x - 14} 294V300M${x + 14} 294V300M${x - 22} 292H${x + 22}" stroke="${C.printDark}" stroke-width="2.4"/>`).join('');
  // Round the corner: the passage beyond the wall's end, darker and deeper, a far lamp
  const corner = `<rect x="${wallX1}" y="80" width="${PAGE_W - wallX1 + 20}" height="${GUTTER_Y - 80}" fill="${mixHex(N.plumDeep, C.shadow, 0.35)}"/>`
    + depth(ctx, 1, `<path d="M${wallX1 + 14} 120H${PAGE_W + 20}V${GUTTER_Y}H${wallX1 + 14}Z" fill="${mixHex(N.plum, N.plumDeep, 0.6)}"/>`
      + `<rect x="${wallX1 + 34}" y="170" width="18" height="24" rx="1" fill="${N.plumDeep}"/><rect x="${wallX1 + 60}" y="170" width="18" height="24" rx="1" fill="${N.plumDeep}"/>`, `<path d="M${wallX1 + 14} 120H${PAGE_W + 20}V${GUTTER_Y}H${wallX1 + 14}Z"/>`)
    + depth(ctx, 3, `<rect x="${wallX1 - 6}" y="34" width="14" height="${GUTTER_Y - 32}" fill="${mixHex(N.plumLight, N.plum, 0.4)}"/><path d="M${wallX1 + 7} 34V${GUTTER_Y}" stroke="${C.shadow}" stroke-width="2" opacity=".5"/>`,
      `<rect x="${wallX1 - 6}" y="34" width="14" height="${GUTTER_Y - 32}"/>`);
  const back = sky + corner + wall + sleepers + ladder + pipes + door + ac + brackets;
  // The floor: the alley's concrete, a drain channel, the passage round the corner going back
  const floor = floorPage(ctx, (() => {
    const { x, y, w, h } = FLOOR_RECT;
    const rr = seeded(45);
    let cracks = '';
    for (let i = 0; i < 12; i++) {
      const cx = x + rr() * w, cy = y + 20 + rr() * (h - 30);
      cracks += `M${f1(cx)} ${f1(cy)}l${f1(8 + rr() * 10)} ${f1((rr() - 0.5) * 6)}l${f1(6 + rr() * 8)} ${f1((rr() - 0.5) * 8)}`;
    }
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mixHex(N.asphalt, N.paverDeep, 0.4)}"/>`
      + `<path d="${cracks}" stroke="${C.shadow}" stroke-width=".8" fill="none" opacity=".5"/>`
      + `<path d="M${wallX1} ${y}L${PAGE_W + 40} ${y}V${y + 90}L${wallX1 + 20} ${y + 90}Z" fill="${mixHex(N.paverDeep, C.shadow, 0.3)}"/>`
      + `<rect x="${x}" y="${y + 150}" width="${w}" height="10" fill="${C.printDark}" opacity=".6"/><path d="${Array.from({ length: 40 }, (_, i) => `M${x + i * 12} ${y + 151}v8`).join('')}" stroke="${N.curb}" stroke-width="1.2" opacity=".5"/>`
      + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'floorShade')}" opacity=".5"/>`
      + `<rect x="${x}" y="${y}" width="${w}" height="24" fill="${C.shadow}" opacity=".3"/>`
      + streetLitter(150, 590, 46) + `<ellipse cx="300" cy="560" rx="40" ry="6" fill="${N.plumLight}" opacity=".25"/>`;
  })());
  // Bins and bags by the wall, the box Mocha hides in
  const bins = depth(ctx, 3, `<rect x="232" y="404" width="30" height="40" rx="3" fill="${N.boardTeal}"/><rect x="229" y="400" width="36" height="6" rx="2" fill="${mixHex(N.boardTeal, C.cutRim, 0.2)}"/>`
    + `<path d="M196 444q-8 -22 8 -28q12 -6 18 8q6 16 -4 20z" fill="${C.printDark}"/><path d="M204 416l4 -6l4 5" stroke="${C.printDark}" stroke-width="2" fill="none"/>`, `<rect x="196" y="400" width="70" height="44"/>`);
  return neonDefs(ctx) + standingPage(ctx, back) + floor + bins + cardboardBox(ctx, 70, 114, 420, 472) + scooter(ctx, 330, 616, N.brickDeep, 1.3) + bookCues(ctx) + block();
};

// ——— 4-4 「夾娃娃機」 ———

/** A plush toy's head (bunny, bear or cat) at (x, y), radius `r`, in a pastel: printed paper with dot eyes. */
function plush(x: number, y: number, r: number, kind: number, fill: string): string {
  const ears = kind === 0
    ? `<ellipse cx="${f1(x - r * 0.45)}" cy="${f1(y - r * 1.2)}" rx="${f1(r * 0.28)}" ry="${f1(r * 0.7)}" fill="${fill}"/><ellipse cx="${f1(x + r * 0.45)}" cy="${f1(y - r * 1.2)}" rx="${f1(r * 0.28)}" ry="${f1(r * 0.7)}" fill="${fill}"/>`
    : kind === 1
    ? `<circle cx="${f1(x - r * 0.75)}" cy="${f1(y - r * 0.75)}" r="${f1(r * 0.36)}" fill="${fill}"/><circle cx="${f1(x + r * 0.75)}" cy="${f1(y - r * 0.75)}" r="${f1(r * 0.36)}" fill="${fill}"/>`
    : `<path d="M${f1(x - r * 0.9)} ${f1(y - r * 0.3)}l${f1(r * 0.1)} ${f1(-r * 0.9)}l${f1(r * 0.6)} ${f1(r * 0.5)}zM${f1(x + r * 0.9)} ${f1(y - r * 0.3)}l${f1(-r * 0.1)} ${f1(-r * 0.9)}l${f1(-r * 0.6)} ${f1(r * 0.5)}z" fill="${fill}"/>`;
  return ears + `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${fill}"/>`
    + `<circle cx="${f1(x - r * 0.35)}" cy="${f1(y - r * 0.05)}" r="${f1(r * 0.1)}" fill="${C.ink}"/><circle cx="${f1(x + r * 0.35)}" cy="${f1(y - r * 0.05)}" r="${f1(r * 0.1)}" fill="${C.ink}"/>`
    + `<ellipse cx="${f1(x)}" cy="${f1(y + r * 0.3)}" rx="${f1(r * 0.22)}" ry="${f1(r * 0.15)}" fill="${C.cutRim}" opacity=".7"/>`
    + `<path d="M${f1(x - r * 0.7)} ${f1(y - r * 0.6)}q${f1(r * 0.5)} ${f1(-r * 0.4)} ${f1(r)} ${f1(-r * 0.2)}" stroke="${C.cutRim}" stroke-width=".9" fill="none" opacity=".5"/>`;
}

/** A heap of plush toys filling the pit from x0 to x1, its crest about `crest` (heads near the top, half-buried ones below). */
function plushHeap(ctx: KitCtx, x0: number, x1: number, crest: number, foot: number, seed: number): string {
  const r = seeded(seed);
  const cols = [N.plushPink, N.plushMint, N.plushLilac, N.plushSky, N.plushCream];
  // The heap's body: overlapping round lumps (plush under plush), widening toward the reader
  let lumps = '';
  for (let y = crest + 8; y < foot + 10; y += 16) {
    const half = (x1 - x0) / 2 * Math.min(1, 0.55 + (y - crest) / 120);
    for (let x = (x0 + x1) / 2 - half; x <= (x0 + x1) / 2 + half; x += 18) lumps += `M${f1(x - 16)} ${f1(y)}a16 16 0 1 0 32 0a16 16 0 1 0 -32 0Z`;
  }
  const mound = lumps;
  let heads = '';
  for (let row = 4; row >= 0; row--) {
    const y = crest + row * 26;
    for (let x = x0 + 14 + (row % 2) * 16; x < x1 - 8; x += 30 + r() * 8) {
      const yy = y + Math.abs(x - (x0 + x1) / 2) * 0.22 + r() * 6;
      const half = (x1 - x0) / 2 * Math.min(1, 0.55 + (yy - crest) / 120);
      if (yy > foot - 6 || Math.abs(x - (x0 + x1) / 2) > half) continue;
      heads += plush(x, yy, 10 + r() * 3, Math.floor(r() * 3), cols[Math.floor(r() * cols.length)]);
    }
  }
  return depth(ctx, 3, `<path d="${mound}" fill="${mixHex(N.plushLilac, N.machineWall, 0.35)}"/>` + heads, `<path d="${mound}"/>`);
}

/**
 * 4-4: inside a giant claw machine (夾娃娃機), its glass box as big as the page. The standing page is
 * the machine's back panel: plum printed with pastel stars and hearts under a neon 「夾到就是你的」,
 * the hot-pink cabinet's top (the marquee lights are the `c4/machine-lights` part, x 120–320 at y
 * 56–112; the gantry rail the claw's cart runs on is `c4/claw-cart`'s). The right wall is the
 * control panel: chrome, 「投幣」 and the coin slot (the `c4/coin-slot` part at (352, 324)), and the
 * shop's 「店長推薦」 sticker with the 店員小哥's face. On the floor page the plush pit between the two
 * prize shelves heaps up to Mocha's `pile` (214, 488); the clear prize chute stands at x 270–312;
 * Mocha's `stool` is a stack of two gift boxes on the left (its top at (40, 396)). Two glassine
 * sheens cross the whole page: we are behind the glass.
 */
const clawMachine: BackdropDraw = (ctx) => {
  const r = seeded(47);
  // The back panel: plum with a print of stars and hearts, a neon slogan
  let print = '';
  for (let i = 0; i < 46; i++) {
    const x = r() * PAGE_W, y = 130 + r() * 220, s = 3 + r() * 4;
    print += i % 2
      ? `<path d="M${f1(x)} ${f1(y + s)}l${f1(-s)} ${f1(-s)}a${f1(s * 0.6)} ${f1(s * 0.6)} 0 0 1 ${f1(s)} ${f1(-s * 0.6)}a${f1(s * 0.6)} ${f1(s * 0.6)} 0 0 1 ${f1(s)} ${f1(s * 0.6)}z" fill="${[N.plushPink, N.plushLilac][i % 4 === 1 ? 0 : 1]}" opacity=".22"/>`
      : `<path d="M${f1(x)} ${f1(y - s)}l${f1(s * 0.3)} ${f1(s * 0.7)}l${f1(s * 0.7)} ${f1(s * 0.3)}l${f1(-s * 0.7)} ${f1(s * 0.3)}l${f1(-s * 0.3)} ${f1(s * 0.7)}l${f1(-s * 0.3)} ${f1(-s * 0.7)}l${f1(-s * 0.7)} ${f1(-s * 0.3)}l${f1(s * 0.7)} ${f1(-s * 0.3)}z" fill="${N.plushSky}" opacity=".25"/>`;
  }
  const panel = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y + 2}" fill="${N.machineWall}"/>`
    + `<rect x="-20" y="120" width="${PAGE_W + 40}" height="${GUTTER_Y - 118}" fill="${ref(ctx, 'plumWall')}" opacity=".6"/>` + print
    + spill(ctx, 120, 196, 160, 46, C.neonPink, 0.14)
    + `<g${glow(ctx)}><text data-art-text="" x="200" y="230" text-anchor="middle" font-family="'Chiron GoRound TC'" font-weight="900" font-size="22" fill="${C.neonPink}" letter-spacing="2">夾到就是你的</text></g>`
    + `<text data-art-text="" x="200" y="230" text-anchor="middle" font-family="'Chiron GoRound TC'" font-weight="900" font-size="22" fill="none" stroke="${C.lampHot}" stroke-width=".6" opacity=".7" letter-spacing="2">夾到就是你的</text>`
    + neonTube(ctx, 'M128 242q72 14 144 0', C.neonCyan, 1.6)
    + neonTube(ctx, 'M108 214l-6 -6M108 222h-9M292 214l6 -6M292 222h9', C.neonCyan, 1.4);
  // The cabinet's top (behind the marquee part) and its two side posts
  const cabinet = depth(ctx, 3, `<rect x="-20" y="0" width="${PAGE_W + 40}" height="40" fill="${ref(ctx, 'cabinetG')}"/><rect x="-20" y="118" width="${PAGE_W + 40}" height="12" fill="${N.cabinetDeep}"/>`
    + `<rect x="-20" y="38" width="${PAGE_W + 40}" height="82" fill="${mixHex(N.cabinetDeep, N.machineWall, 0.5)}"/>`
    + `<path d="M-20 40H${PAGE_W + 20}M-20 118H${PAGE_W + 20}" stroke="${N.chrome}" stroke-width="2.4"/>`
    + `<path d="M-20 1H${PAGE_W + 20}" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="-20" y="0" width="${PAGE_W + 40}" height="130"/>`);
  // The control panel on the right wall: chrome, 「投幣」 over the coin slot, the shop's sticker
  const ctrl = depth(ctx, 3, `<path d="M330 130H${PAGE_W + 20}V${GUTTER_Y + 2}H330Z" fill="${ref(ctx, 'cabinetG')}"/>`
    + `<rect x="334" y="270" width="52" height="88" rx="4" fill="${ref(ctx, 'chromeG')}"/><path d="M330 130V${GUTTER_Y}" stroke="${N.chrome}" stroke-width="3"/>`
    + `<rect x="340" y="276" width="40" height="13" rx="2" fill="${N.cabinetDeep}"/>`, `<path d="M330 130H${PAGE_W + 20}V${GUTTER_Y}H330Z"/>`)
    + `<text data-art-text="" x="360" y="286" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8.5" fill="${C.chalk}" letter-spacing="2">投幣</text>`
    + `<text data-art-text="" x="360" y="356" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="7" fill="${N.cabinetDeep}">$10</text>`
    // 「店長推薦」: a round sticker with the 店員小哥's face in his red cap (the chapter's cameo)
    + depth(ctx, 2, `<circle cx="360" cy="196" r="20" fill="${C.washi}"/><circle cx="360" cy="196" r="17" fill="none" stroke="${C.neonPink}" stroke-width="1.4" stroke-dasharray="2 2"/>`
      + `<circle cx="360" cy="196" r="8" fill="${S.skin}"/><path d="M351 193q0 -10 9 -10q9 0 9 10z" fill="${T.clerkCap}"/><path d="M366 192h6" stroke="${T.clerkCap}" stroke-width="2.4" stroke-linecap="round"/>`
      + `<circle cx="357" cy="197" r=".9" fill="${C.ink}"/><circle cx="363" cy="197" r=".9" fill="${C.ink}"/><path d="M357.4 200q2.6 2 5.2 0" stroke="${C.ink}" stroke-width=".9" fill="none"/>`, `<circle cx="360" cy="196" r="20"/>`)
    + `<text data-art-text="" x="360" y="226" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7" fill="${C.chalk}">店長推薦</text>`;
  // Behind the glass: two glassine sheens across the whole page
  const glass = `<path d="M-20 300L120 130H160L-20 352Z" fill="${ref(ctx, 'glassine')}" opacity=".35"/><path d="M200 ${GUTTER_Y}L330 130H346L222 ${GUTTER_Y}Z" fill="${ref(ctx, 'glassine')}" opacity=".25"/>`;
  const back = panel + cabinet + ctrl + glass;
  // The floor: the cabinet's floor (pink card), the pit's plush heap, a glassine sheen
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(N.cabinetDeep, N.machineWall, 0.55)}"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${ref(ctx, 'floorShade')}" opacity=".4"/>`
    + pools(ctx, [[200, 470, 150, 40, 'pink'], [352, 480, 60, 20, 'cyan']]));
  const heap = plushHeap(ctx, 96, 276, 478, 636, 48);
  // The prize chute: a clear acrylic box over the drop hole
  const chute = depth(ctx, 3, `<rect x="268" y="400" width="46" height="82" fill="${C.glassine}" opacity=".18"/><rect x="268" y="400" width="46" height="82" fill="none" stroke="${C.vellum}" stroke-width="1.6" opacity=".7"/>`
    + `<path d="M270 404L292 404L270 440Z" fill="${C.cutRim}" opacity=".18"/><rect x="266" y="396" width="50" height="5" rx="1.5" fill="${N.chrome}"/>`, `<rect x="266" y="396" width="50" height="86"/>`)
    + `<text data-art-text="" x="291" y="472" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7" fill="${C.chalk}" opacity=".7">出口</text>`;
  // Mocha's stool: two gift boxes stacked, their top at (40, 396)
  const gift = (x: number, y: number, w: number, h: number, fill: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${fill}"/>`
    + `<path d="M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}" stroke="${N.plushCream}" stroke-width="3"/>`;
  const stool = depth(ctx, 3, gift(20, 432, 42, 40, N.plushSky) + gift(24, 396, 34, 36, N.plushPink)
    + `<path d="M41 396q-8 -8 -2 -10q4 0 2 10q2 -10 6 -10q6 2 -6 10z" fill="none" stroke="${N.plushCream}" stroke-width="2"/>`, `<rect x="20" y="388" width="42" height="84"/>`);
  return neonDefs(ctx) + standingPage(ctx, back) + floor + heap + chute + stool + bookCues(ctx) + block();
};

// ——— 4-5 「街頭藝人」 ———

/**
 * 4-5: 西門町's pedestrian street (徒步區) wide awake: shopfronts on both sides with their vertical
 * signs lit, the street running away between them to a crowd watching the dancers (the 土地公 among
 * them at (240, 360) once they freeze), 咻咻 flickering a sign high on the right (the chapter's
 * cameo). Nearer: the street lamp (Mocha's `lamp`, its roof at (30, 270)), the speaker stack under
 * the boombox (the `c4/boombox` part at (130, 334); the stack's foot at S2), the amp crate (Mocha's
 * `crate`, its top at (76, 396)), the bus-stop sign past the dancers (Mocha's `sign`, (300, 300)).
 * On the floor page the painted crossing's stripes run back to the gutter.
 */
const streetDance: BackdropDraw = (ctx) => {
  const vy = 300;
  // The far street: narrow buildings either side, the crowd at its end
  const far = shopfront(ctx, 136, 196, 170, vy + 40, 61, { z: 1, shade: 0.2, signs: [[44, 182, 64, '服飾', C.neonCyan, true]] })
    + shopfront(ctx, 196, 256, 176, vy + 40, 62, { z: 1, shade: 0.2, signs: [[-4, 190, 60, '冰品', C.neonPink, true]] });
  const left = shopfront(ctx, -20, 140, 70, GUTTER_Y + 2, 63, { z: 2, signs: [[118, 92, 110, '電影院', C.neonPink, true], [90, 220, 70, '鞋店', C.neonCyan, true]] });
  const right = shopfront(ctx, 252, 410, 64, GUTTER_Y + 2, 64, { z: 2, signs: [[8, 86, 100, '唱片', C.neonCyan, true], [34, 208, 80, '牛排', N.neonViolet, true]] });
  // 咻咻 flickering a sign high on the right: half lit, flicker ticks, the little cloud peeking
  const flicker = signBoard(ctx, 360, 40, 20, 74, '書店', { color: C.neonPink, board: N.boardTeal, bracket: null })
    + `<path d="M354 52l-6 -3M354 62h-7M386 50l5 -4M386 62h6" stroke="${C.lampHot}" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`
    + shushuPeek(ctx, 334, 30, 0.9);
  const crowdRow = crowd(ctx, 142, 300, GUTTER_Y + 2, 65);
  const sky = ximenSky(ctx, [96, 40, 11], 180, 17);
  const back = sky + far + crowdRow + left + right + flicker
    + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'lampWashN')}"/>`;
  const floor = floorPage(ctx, streetFloor(ctx, { crossing: true, pavers: 60, seed: 66 })
    + pools(ctx, [[30, 476, 60, 18, 'warm'], [130, 480, 70, 18, 'cyan'], [196, 470, 90, 22, 'pink'], [330, 480, 70, 18, 'warm']]));
  // The speaker stack under the boombox (its foot at S2, (110, 484)), the amp crate (top (76, 396))
  const stack = speakerCab(ctx, 104, 352, 52, 60) + speakerCab(ctx, 100, 410, 60, 66);
  const crate = depth(ctx, 3, `<rect x="54" y="396" width="44" height="76" rx="3" fill="${N.speaker}"/><rect x="58" y="402" width="36" height="12" rx="2" fill="${N.speakerCone}"/>`
    + [64, 74, 84].map((x) => `<circle cx="${x}" cy="408" r="2.6" fill="${N.chrome}"/>`).join('')
    + `<rect x="58" y="420" width="36" height="46" rx="2" fill="${C.printDark}"/><path d="${Array.from({ length: 7 }, (_, i) => `M60 ${425 + i * 6}h32`).join('')}" stroke="${N.speakerCone}" stroke-width="1.2"/>`
    + `<path d="M55 397h42" stroke="${C.cutRim}" stroke-width=".8" opacity=".4"/>`, `<rect x="54" y="396" width="44" height="76"/>`)
    + `<path d="M98 440q8 10 4 30" stroke="${C.printDark}" stroke-width="1.6" fill="none"/>`;
  // The bus-stop sign: a pole and a round-ended plate (its top at (300, 300))
  const busStop = depth(ctx, 3, `<rect x="298" y="326" width="4" height="150" fill="${N.shutterDeep}"/>`
    + `<rect x="280" y="302" width="40" height="26" rx="13" fill="${T.bannan}"/><rect x="284" y="306" width="32" height="18" rx="9" fill="${C.washi}"/>`
    + `<path d="M292 319v-8h12q3 0 3 3v5zM294 312h5v3h-5z" fill="${T.bannan}"/><circle cx="294" cy="320" r="1.4" fill="${C.ink}"/><circle cx="304" cy="320" r="1.4" fill="${C.ink}"/>`
    + `<rect x="288" y="352" width="24" height="30" rx="2" fill="${C.washi}"/><path d="M292 358h16M292 364h12M292 370h16M292 376h10" stroke="${C.inkSoft}" stroke-width="1.4" opacity=".5"/>`, `<rect x="280" y="302" width="40" height="174"/>`);
  return neonDefs(ctx) + standingPage(ctx, back) + floor + stack + crate + busStop + streetLamp(ctx, 30, 270, 474) + bookCues(ctx) + block();
};

// ——— 4-6 「走音天王」 (spread) ———

/**
 * 4-6, the centrefold: the arcade on the left page, the karaoke bar on the right. Left: the
 * arcade's front with its glowing machines inside, its vertical sign 「電玩」 (Mocha's `sign`, its top
 * at (40, 300)), the disco ball's chain from the top (the ball, a decoy, is drawn live at (110,
 * 250)), and on the floor page the dance floor's lit squares. Right: the bar's velvet proscenium
 * round the stage; the karaoke screen (its lyrics, where the 土地公 sits at (236, 250)); the lights'
 * truss (the `c4/stage-lights` part at (310, 320)); the amp at the back of the stage (Mocha's
 * `amp`, its top at (312, 370)); the wings' curtain on the right where the king waits; a star on the
 * stage floor where the trap lift rises (346). The spine's crease is drawn live.
 */
const karaokeSpread: BackdropDraw = (ctx) => {
  const mid = PAGE_W / 2;
  // Left page: the arcade
  const arcadeWall = `<rect x="-20" y="0" width="${mid + 20}" height="${GUTTER_Y + 2}" fill="${ref(ctx, 'plumWall')}"/>`;
  const machines = depth(ctx, 2, `<rect x="70" y="150" width="110" height="${GUTTER_Y - 148}" fill="${mixHex(N.plumDeep, C.shadow, 0.3)}"/>`
    + [0, 1, 2].map((i) => {
      const x = 80 + i * 34;
      return `<rect x="${x}" y="196" width="26" height="${GUTTER_Y - 196}" rx="3" fill="${[N.cabinet, N.boardTeal, N.neonViolet][i]}" opacity=".75"/><rect x="${x + 4}" y="206" width="18" height="16" rx="2" fill="${[C.neonCyan, C.neonPink, C.neonCyan][i]}" opacity=".7"/>`
        + `<circle cx="${x + 13}" cy="240" r="3" fill="${C.lampHot}" opacity=".7"/>`;
    }).join('')
    + `<path d="M70 150h110" stroke="${N.trim}" stroke-width="2"/>`, `<rect x="70" y="150" width="110" height="${GUTTER_Y - 150}"/>`)
    + neonTube(ctx, 'M72 146h106', C.neonCyan, 2)
    + `<g${glow(ctx)}><text data-art-text="" x="125" y="136" text-anchor="middle" font-family="'Chiron GoRound TC'" font-weight="900" font-size="16" fill="${C.neonCyan}" letter-spacing="4">GAME</text></g>`;
  const arcadeSign = signBoard(ctx, 26, 304, 28, 108, '電玩', { color: C.neonPink, board: N.boardInk, bracket: null, z: 3 })
    + `<path d="M40 412V470" stroke="${C.printDark}" stroke-width="4"/>`;
  const chain = `<path d="M110 0V206" stroke="${C.printDark}" stroke-width="1.4" stroke-dasharray="2 1.4"/>`;
  // Right page: the karaoke bar, its velvet proscenium, the screen, the truss, the amp, the wings
  const barWall = `<rect x="${mid}" y="0" width="${mid + 20}" height="${GUTTER_Y + 2}" fill="${mixHex(N.velvetDeep, N.plumDeep, 0.5)}"/>`;
  const sign = spill(ctx, 220, 18, 150, 42, C.neonPink, 0.14)
    + `<g${glow(ctx)}><text data-art-text="" x="296" y="50" text-anchor="middle" font-family="'Chiron GoRound TC'" font-weight="900" font-size="22" fill="${C.neonPink}" letter-spacing="3">卡拉OK</text></g>`
    + neonTube(ctx, 'M236 58h120', C.neonCyan, 1.6) + neonTube(ctx, 'M228 30l-8 -6M228 38h-10M364 30l8 -6M364 38h10', N.neonViolet, 1.4);
  const screen = depth(ctx, 3, `<rect x="208" y="186" width="96" height="74" rx="4" fill="${C.printDark}"/><rect x="214" y="192" width="84" height="56" fill="${ref(ctx, 'sky')}"/>`
    + `<circle cx="276" cy="212" r="9" fill="${C.moon}" opacity=".8"/><path d="M214 240q20 -14 40 -4t44 -4V248H214Z" fill="${N.plumDeep}"/>`
    + `<rect x="236" y="260" width="40" height="6" fill="${C.printDark}"/>`, `<rect x="208" y="186" width="96" height="80"/>`)
    + `<text data-art-text="" x="256" y="244" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7" fill="${C.lampHot}">♪ 月亮代表…</text>`
    + `<path d="M222 246h28" stroke="${C.neonCyan}" stroke-width="1.6" opacity=".8"/>`;
  const proscenium = depth(ctx, 3, `<path d="M${mid} 76H${PAGE_W + 20}V100Q300 120 ${mid + 4} 98Z" fill="${ref(ctx, 'velvetG')}"/>`
    + `<path d="M${mid} 80V${GUTTER_Y}h18V108q-10 -10 -18 -20z" fill="${ref(ctx, 'velvetG')}"/>`
    + `<path d="M${PAGE_W + 20} 80V${GUTTER_Y}h-24V108q12 -10 24 -20z" fill="${ref(ctx, 'velvetG')}"/>`
    + `<path d="M${mid} 100Q300 122 ${PAGE_W + 20} 100" stroke="${C.goldDeep}" stroke-width="2" fill="none"/>`
    + `<path d="${Array.from({ length: 10 }, (_, i) => `M${mid + 10 + i * 20} 100v-18`).join('')}" stroke="${N.velvetDeep}" stroke-width="3" opacity=".6"/>`, `<path d="M${mid} 76H${PAGE_W + 20}V${GUTTER_Y}H${mid}Z"/>`);
  const truss = depth(ctx, 3, `<rect x="${mid + 14}" y="282" width="${PAGE_W - mid - 10}" height="8" fill="${C.printDark}"/>`
    + `<path d="${Array.from({ length: 12 }, (_, i) => `M${mid + 16 + i * 16} 282l8 8M${mid + 24 + i * 16} 282l-8 8`).join('')}" stroke="${N.chromeDeep}" stroke-width="1"/>`
    + `<path d="M${mid + 40} 100V282M${PAGE_W - 30} 100V282" stroke="${C.printDark}" stroke-width="1.4"/>`, `<rect x="${mid + 14}" y="282" width="${PAGE_W - mid - 10}" height="8"/>`);
  // The amp at the back of the stage (Mocha's `amp`, its top at (312, 370))
  const amp = depth(ctx, 3, `<rect x="292" y="370" width="42" height="72" rx="3" fill="${N.speaker}"/><rect x="296" y="376" width="34" height="10" rx="2" fill="${N.speakerCone}"/>`
    + [302, 312, 322].map((x) => `<circle cx="${x}" cy="381" r="2.2" fill="${N.chrome}"/>`).join('')
    + `<circle cx="313" cy="414" r="15" fill="${C.printDark}" stroke="${N.speakerCone}" stroke-width="2.4"/><circle cx="313" cy="414" r="5" fill="${N.speakerCone}"/>`
    + `<path d="M293 371h40" stroke="${C.cutRim}" stroke-width=".8" opacity=".4"/>`, `<rect x="292" y="370" width="42" height="72"/>`);
  const wings = depth(ctx, 4, `<path d="M372 90Q380 240 368 ${GUTTER_Y + 110}H${PAGE_W + 20}V90Z" fill="${ref(ctx, 'velvetG')}"/><path d="M380 96Q386 240 378 ${GUTTER_Y + 110}" stroke="${N.velvetDeep}" stroke-width="3" fill="none"/>`,
    `<path d="M372 90Q380 240 368 ${GUTTER_Y + 110}H${PAGE_W + 20}V90Z"/>`);
  const back = arcadeWall + barWall + machines + chain + sign + proscenium + screen + truss
    + `<rect x="-20" y="${GUTTER_Y - 30}" width="${PAGE_W + 40}" height="30" fill="${ref(ctx, 'lampWashN')}"/>`;
  // The floor: the dance floor's lit squares on the left page, the bar's dark floor on the right
  const danceFloor = (() => {
    const k = (FLOOR_BOTTOM - GUTTER_Y) / (GUTTER_Y + 360);
    let tiles = '';
    const cols = [C.neonPink, C.neonCyan, N.neonViolet];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 6; col++) {
        const t0 = row / 7, t1 = (row + 1) / 7;
        const xa = -20 + col * 36, xb = xa + 36;
        const p = (xx: number, t: number) => `${f1(xx + (xx - 195) * k * t)} ${f1(GUTTER_Y + (FLOOR_BOTTOM - GUTTER_Y) * t)}`;
        if ((row + col) % 2 === 0) tiles += `<path d="M${p(xa, t0)}L${p(xb, t0)}L${p(xb, t1)}L${p(xa, t1)}Z" fill="${cols[(row * 2 + col) % 3]}" opacity=".16"/>`;
      }
    }
    return `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${mid - FLOOR_RECT.x}" height="${FLOOR_RECT.h}" fill="${mixHex(N.plumDeep, C.printDark, 0.3)}"/>` + tiles;
  })();
  const floor = floorPage(ctx, danceFloor
    + `<rect x="${mid}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${mixHex(N.stageBoard, C.printDark, 0.55)}"/>`
    + `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="${ref(ctx, 'floorShade')}" opacity=".35"/>`
    + pools(ctx, [[110, 480, 90, 26, 'pink'], [40, 490, 50, 16, 'warm'], [300, 480, 90, 24, 'warm']]));
  return neonDefs(ctx) + standingPage(ctx, back) + floor + arcadeSign + amp + wings + bookCues(ctx) + block();
};

export const C4_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'c4/blue-car': blueCar,
  'c4/red-house': redHouse,
  'c4/neon-alley': neonAlley,
  'c4/claw-machine': clawMachine,
  'c4/street-dance': streetDance,
  'c4/karaoke-spread': karaokeSpread,
};

// ——— 4-2's lantern ———

/**
 * A red paper lantern (a pushable, C3), local origin at its centre: hanging from the east eave on
 * its cord (`onPerch`), tumbling (`falling`), and sitting squashed on the shutter's button
 * (`landed`), its tassel splayed.
 */
const lantern: PartSource = {
  preset: 'pushable',
  states: ['onPerch', 'falling', 'landed'],
  box: { x: -30, y: -44, w: 60, h: 80 },
  draw(ctx: KitCtx, state) {
    const body = 'M-15 -11Q-17 0 -15 11Q0 15 15 11Q17 0 15 -11Q0 -15 -15 -11Z';
    const paper = depth(ctx, 3, `<path d="${body}" fill="${C.hatRed}"/>`
      + `<path d="M-8 -13Q-11 0 -8 13M0 -14V14M8 -13Q11 0 8 13" stroke="${C.peonyDeep}" stroke-width="1.1" fill="none" opacity=".8"/>`
      + `<rect x="-9" y="-16" width="18" height="4" rx="1.4" fill="${C.printDark}"/><rect x="-9" y="12" width="18" height="4" rx="1.4" fill="${C.printDark}"/>`
      + `<ellipse cx="-5" cy="-3" rx="3.4" ry="6" fill="${C.lampHot}" opacity=".35"/>`, `<path d="${body}"/>`);
    const tassel = state === 'landed'
      ? `<path d="M0 16l-7 4M0 16l7 4M0 16v5" stroke="${C.hatRed}" stroke-width="1.6" stroke-linecap="round"/>`
      : `<path d="M0 16v12M-2 20v8M2 20v8" stroke="${C.hatRed}" stroke-width="1.4" stroke-linecap="round"/>`;
    const cord = state === 'onPerch' ? `<path d="M0 -16V-40" stroke="${C.printDark}" stroke-width="1.4"/>` : '';
    const turn = state === 'falling' ? 'rotate(28)' : state === 'landed' ? 'translate(0 -2) scale(1.06 .9)' : '';
    const shadow = state === 'landed' ? softEllipse(ctx, 0, 16, 18, 2.6, 'shadow', 0.45) : '';
    return shadow + cord + `<g transform="${turn}">${tassel}${paper}</g>`;
  },
};

/** 4-1's doors: the 板南線's blue band, low under the route map's header (#119). */
const doors = carDoors(T.bannan, T.bannanDeep, { top: -78 });

// 4-2's house, button and shutter

/** A point at bearing `deg` (clockwise from up) and radius `r` from the origin. */
const polar = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [Math.sin(a) * r, -Math.cos(a) * r];
};
/** A regular octagon of radius `r` (its faces centred on the bearings 0, 45, … 315). */
const octagon = (r: number) => Array.from({ length: 8 }, (_, j) => polar(22.5 + j * 45, r)).map(([x, y], j) => `${j ? 'L' : 'M'}${f1(x)} ${f1(y)}`).join('') + 'Z';

/**
 * Which face of 紅樓 faces which way when the house stands unturned (state 0): face `k` at bearing
 * 180 + 45k, numbered clockwise from the front (#119). So faces 0 and 4 line up west–east in states 2
 * and 6 (his way through), the third doorway (face 3) comes round to the front in state 5 (where the
 * 土地公 sits), and the roof's lantern window (over face 7) faces the street lamp in state 4.
 */
export const RED_HOUSE_FACE = (k: number): number => (180 + 45 * k) % 360;
const DOORWAYS = [0, 3, 4];
const WINDOW_FACE = 7;

/**
 * 4-2's 西門紅樓 (a wheel, 8 states; 轉): the octagonal house seen from above as it turns on the
 * plaza — its red-brick walls round a dark octagonal roof with ridges to the lantern on top, white
 * trim lines, three arched doorways cut through the walls (lit warm inside) and the roof's little
 * lantern window, all ringed by the marigold knurled rim (its grip). The view turns each state's
 * bitmap, so every state draws the house unturned — the same drawing, so it is baked once (state
 * `0`; the loader serves a state's bitmap from the first state's when it has none of its own),
 * keeping the page in its budget. Pivot at its centre (176, 380), radius 74.
 */
const redHouseWheel: PartSource = {
  preset: 'wheel',
  states: ['0'],
  pivot: [0, 0],
  box: { x: -92, y: -92, w: 184, h: 184 },
  draw(ctx) {
    const r = 74;
    const wallR = r - 6, roofR = r - 30;
    const rim = wheelRim(r, 32);
    const cid = ctx.id('houseClip');
    // The walls: brick between two octagons, with courses (concentric) and the white trim line
    let courses = '';
    for (let rr = roofR + 3; rr < wallR; rr += 3.4) courses += `<path d="${octagon(rr)}" fill="none" stroke="${N.mortar}" stroke-width=".5" opacity=".35"/>`;
    const walls = `<path d="${octagon(wallR)}${octagon(roofR)}" fill="${ref(ctx, 'brickG')}" fill-rule="evenodd"/>` + courses
      + `<path d="${octagon(wallR - 4)}" fill="none" stroke="${N.trim}" stroke-width="1.6" opacity=".85"/>`;
    // The roof: dark tiles in eight facets, ridges to the lantern, which is a small octagon with a finial
    const facets = Array.from({ length: 8 }, (_, j) => {
      const [ax, ay] = polar(22.5 + j * 45, roofR);
      const [bx, by] = polar(67.5 + j * 45, roofR);
      return `<path d="M0 0L${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}Z" fill="${j % 2 ? N.roof : N.roofLight}"/>`;
    }).join('');
    const ridges = Array.from({ length: 8 }, (_, j) => {
      const [ax, ay] = polar(22.5 + j * 45, roofR);
      return `M0 0L${f1(ax)} ${f1(ay)}`;
    }).join('');
    const lantern = `<path d="${octagon(12)}" fill="${mixHex(N.brick, N.brickDeep, 0.3)}"/><path d="${octagon(8)}" fill="${N.roof}"/><circle r="2.6" fill="${ref(ctx, 'foil')}"/>`;
    // The doorways: arched cuts through the wall, lit warm inside, a white trim arch and a step
    const doorway = (k: number) => {
      const deg = RED_HOUSE_FACE(k);
      return `<g transform="rotate(${deg})"><path d="M-8 ${-roofR + 1}V${-wallR + 4}q8 -6 16 0V${-roofR + 1}Z" fill="${ref(ctx, 'window')}"/>`
        + `<path d="M-8 ${-wallR + 4}q8 -6 16 0" stroke="${N.trim}" stroke-width="1.6" fill="none"/>`
        + `<rect x="-10" y="${-wallR - 1}" width="20" height="4" rx="1" fill="${N.trimShade}"/></g>`;
    };
    // The lantern window over face 7: a lit round window in a dormer with a little red lantern beside it
    const win = (() => {
      const deg = RED_HOUSE_FACE(WINDOW_FACE);
      const y = -roofR + 10;
      return `<g transform="rotate(${deg})"><path d="M-10 ${-roofR + 1}L0 ${y - 12}L10 ${-roofR + 1}Z" fill="${N.roofLight}"/>`
        + `<circle cy="${y - 1}" r="5.4" fill="${ref(ctx, 'window')}"/><path d="M0 ${y - 6.4}v10.8M-5.4 ${y - 1}h10.8" stroke="${N.brickDeep}" stroke-width=".9"/>`
        + `<ellipse cx="9" cy="${y + 4}" rx="3" ry="4" fill="${C.hatRed}"/><path d="M9 ${y - 0.4}v-2" stroke="${C.printDark}" stroke-width="1"/></g>`;
    })();
    return neonDefs(ctx) + softEllipse(ctx, 0, 6, r * 0.95, r * 0.95, 'shadow', 0.35)
      + depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/>`
        + `<circle r="${r - 4}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1.4" opacity=".6"/><circle r="${r - 2}" fill="none" stroke="${C.marigoldShine}" stroke-width="1" opacity=".6"/>`
        + `<clipPath id="${cid}"><circle r="${r - 5}"/></clipPath><g clip-path="url(#${cid})"><circle r="${r - 5}" fill="${N.paverDeep}"/>`
        + `<path d="${octagon(wallR + 3)}" fill="${C.shadow}" opacity=".35"/>` + walls + facets + `<path d="${ridges}" stroke="${N.trimShade}" stroke-width="1" opacity=".55"/>`
        + DOORWAYS.map(doorway).join('') + win + lantern + `</g>`, `<path d="${rim}"/>`);
  },
};

/**
 * 4-2's shutter button (a weight `button` on the shutter's housing): a steel box with a big round
 * push-button; pressed by the landed lantern (`down`) it sinks and its little lamp lights green.
 * Local origin at its hit centre (326, 398).
 */
const shutterButton: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -26, y: -26, w: 52, h: 46 },
  draw(ctx, state) {
    const down = state === 'down';
    const box = 'M-18 -6H18V12H-18Z';
    return neonDefs(ctx) + depth(ctx, 3, `<path d="${box}" fill="${ref(ctx, 'shutterG')}"/><path d="M-17 -5.2H17" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`
      + `<rect x="-14" y="2" width="20" height="6" rx="1" fill="${N.shutterDeep}"/><path d="M-12 5h16" stroke="${N.shutterLight}" stroke-width="1" stroke-dasharray="2 1.6"/>`
      + `<circle cx="12" cy="5" r="2.4" fill="${down ? C.doneGreen : N.shutterDeep}"/>`
      + (down ? `<ellipse cx="0" cy="-6" rx="10" ry="2.6" fill="${N.shutterDeep}"/>` : `<path d="M-10 -6V-11Q0 -15 10 -11V-6Z" fill="${N.neonRed}" opacity=".85"/><ellipse cx="0" cy="-11" rx="10" ry="2.8" fill="${mixHex(N.neonRed, C.cutRim, 0.3)}"/>`), `<path d="${box}"/>`)
      + (down ? softEllipse(ctx, 12, 5, 6, 6, 'lamp', 0.4) : '');
  },
};

/**
 * 4-2's roll-down shutter (a `gate`: the button rolls it up, and it stays up): steel slats over the
 * record shop's doorway (x 290–346, y 396–486) with a handle and a 「休息中」 card; open, it is rolled
 * into its housing and the shop's light spills over the threshold. Local origin at the hit centre (318, 450).
 */
const shutter: PartSource = {
  preset: 'gate',
  states: ['closed', 'open'],
  box: { x: -34, y: -60, w: 68, h: 100 },
  draw(ctx, state) {
    const top = -54, foot = 36;
    const housing = `<rect x="-30" y="${top}" width="60" height="9" rx="3" fill="${N.shutterDeep}"/><path d="M-29 ${top + 1}h58" stroke="${N.shutterLight}" stroke-width="1" opacity=".6"/>`;
    if (state === 'open') {
      return neonDefs(ctx) + softEllipse(ctx, 0, foot - 6, 30, 10, 'lamp', 0.35)
        + depth(ctx, 3, housing + `<rect x="-28" y="${top + 8}" width="56" height="5" rx="2" fill="${N.shutter}"/><path d="M-28 ${top + 8}V${foot}M28 ${top + 8}V${foot}" stroke="${N.shutterDeep}" stroke-width="2.4"/>`,
          `<rect x="-30" y="${top}" width="60" height="14"/>`);
    }
    let slats = '';
    for (let y = top + 13; y < foot - 4; y += 5) slats += `M-27 ${y}h54`;
    return neonDefs(ctx) + depth(ctx, 3, `<rect x="-28" y="${top + 8}" width="56" height="${foot - top - 8}" fill="${ref(ctx, 'shutterG')}"/>`
      + `<path d="${slats}" stroke="${N.shutterDeep}" stroke-width="1" opacity=".7"/><path d="${slats}" stroke="${N.shutterLight}" stroke-width=".6" opacity=".5" transform="translate(0 1.2)"/>`
      + `<rect x="-28" y="${foot - 6}" width="56" height="6" fill="${N.shutterDeep}"/><rect x="-8" y="${foot - 12}" width="16" height="3" rx="1.5" fill="${C.printDark}"/>`
      + `<rect x="-14" y="-24" width="28" height="16" rx="1.5" fill="${C.washi}"/>` + housing, `<rect x="-30" y="${top}" width="60" height="${foot - top}"/>`)
      + `<text data-art-text="" x="0" y="-12.6" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="7.5" fill="${N.boardMaroon}">休息中</text>`;
  },
};

// 4-3's three signs

/**
 * One of 4-3's sleepy neon signs (a `light`): a vertical board hanging from the alley wall's bracket,
 * its top at local y −84 (page 300), its foot at 28. `off`: grey ink and 「zz」 (bible § 3.3: a
 * sleeping sign); `on`: its tube and its name in luminous ink, a spill of colour behind it.
 */
function neonSign(chars: string, color: string, board: string): PartSource {
  return {
    preset: 'light',
    states: ['off', 'on'],
    box: { x: -36, y: -96, w: 72, h: 136 },
    draw(ctx, state) {
      const lit = state === 'on';
      return (lit ? softEllipse(ctx, 0, -28, 34, 62, 'lamp', 0.12, 'blur18') : '')
        + `<path d="M-10 -92V-84M10 -92V-84" stroke="${C.printDark}" stroke-width="1.6"/>`
        + signBoard(ctx, -16, -84, 32, 112, chars, { color, board, lit, z: 3, bracket: null, size: 20 });
    },
  };
}

// 4-4's machine: the coin slot, the marquee, the gantry and the drop lever

/**
 * 4-4's coin slot (a weight `button` on the control panel; Mocha's weight is the coin): a chrome
 * box with a slot and a coin poised over it; `down`, the coin has dropped in, the slot is lit and
 * chalk 「叮！」 rings out. Local origin at its hit centre (352, 324).
 */
const coinSlot: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -30, y: -34, w: 64, h: 62 },
  draw(ctx, state) {
    const down = state === 'down';
    const box = 'M-16 -14H16V18H-16Z';
    const coin = down ? '' : `<circle cx="0" cy="-20" r="6.4" fill="${ref(ctx, 'coin')}"/><circle cx="0" cy="-20" r="4.2" fill="none" stroke="${C.coinRing}" stroke-width=".8"/>`;
    return neonDefs(ctx) + depth(ctx, 3, `<path d="${box}" fill="${ref(ctx, 'chromeG')}"/><rect x="-6" y="-6" width="12" height="18" rx="2" fill="${C.printDark}"/>`
      + `<rect x="-1.4" y="-3" width="2.8" height="12" rx="1" fill="${down ? C.lampHot : N.shutterDeep}"/>`
      + `<path d="M-15 -13.2H15" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`, `<path d="${box}"/>`)
      + coin
      + (down ? softEllipse(ctx, 0, 3, 8, 10, 'lamp', 0.45)
        + `<g stroke="${C.chalk}" stroke-width="1.4" stroke-linecap="round" opacity=".9"><path d="M20 -8l5 -3M21 0h6M20 8l5 3"/></g>`
        + `<text data-art-text="" x="22" y="-14" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.chalk}">叮！</text>` : '');
  },
};

/**
 * 4-4's marquee (the machine's lights, a `light`, on for good with the first coin): a long
 * rounded board over the glass with bulbs all round it and 「夾娃娃」 in neon; `off`, the bulbs are
 * dark and the letters asleep. Local origin at its hit centre (220, 84).
 */
const machineLights: PartSource = {
  preset: 'light',
  states: ['off', 'on'],
  box: { x: -118, y: -40, w: 236, h: 80 },
  draw(ctx, state) {
    const lit = state === 'on';
    const board = 'M-96 -24H96Q106 -24 106 -14V14Q106 24 96 24H-96Q-106 24 -106 14V-14Q-106 -24 -96 -24Z';
    let bulbs = '';
    for (let x = -96; x <= 96; x += 12) bulbs += `M${x - 2.4} -20a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0zM${x - 2.4} 20a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0z`;
    const title = `<text data-art-text="" x="0" y="7" text-anchor="middle" font-family="'Chiron GoRound TC'" font-weight="900" font-size="20" letter-spacing="6" fill="${lit ? C.neonPink : N.sleepInk}">夾娃娃</text>`;
    return (lit ? spill(ctx, -110, -30, 220, 60, C.neonPink, 0.16) : '')
      + depth(ctx, 3, `<path d="${board}" fill="${N.cabinetDeep}"/><path d="M-94 -14H94V14H-94Z" fill="${N.plumDeep}"/>`
        + `<path d="M-96 -23.2H96" stroke="${C.cutRim}" stroke-width=".8" opacity=".4"/>`, `<path d="${board}"/>`)
      + `<path d="${bulbs}" fill="${lit ? C.lampHot : N.sleepInkDeep}"/>`
      + (lit ? `<g${glow(ctx)}>${title}<path d="M-70 -6l-8 6l8 6M70 -6l8 6l-8 6" stroke="${C.neonCyan}" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`
        + `<text data-art-text="" x="0" y="7" text-anchor="middle" font-family="'Chiron GoRound TC'" font-weight="900" font-size="20" letter-spacing="6" fill="none" stroke="${C.lampHot}" stroke-width=".6" opacity=".7">夾娃娃</text>`
        : title + zz(62, 4));
  },
};

/**
 * 4-4's gantry (under the claw's cart tab, `c4/claw-cart`; the claw itself is the carriage drawn live,
 * `view/art/carriages.ts`): the chrome rail across the top of the glass the cart runs on, its end
 * brackets and three stops, the same in every state. Local origin at the tab's hit centre (215, 152).
 */
const clawGantry: PartSource = {
  preset: 'tab',
  states: ['x0', 'x1', 'x2'],
  box: { x: -112, y: -18, w: 224, h: 34 },
  draw(ctx) {
    const rail = 'M-104 -6H104V4H-104Z';
    return neonDefs(ctx) + depth(ctx, 2, `<path d="${rail}" fill="${ref(ctx, 'chromeG')}"/><path d="M-104 -5.2H104" stroke="${C.cutRim}" stroke-width="1" opacity=".7"/>`
      + `<rect x="-110" y="-12" width="10" height="22" rx="2" fill="${N.chromeDeep}"/><rect x="100" y="-12" width="10" height="22" rx="2" fill="${N.chromeDeep}"/>`
      + [-75, 0, 75].map((x) => `<circle cx="${x}" cy="-1" r="2" fill="${N.chromeDeep}"/>`).join(''), `<path d="${rail}"/>`);
  },
};

/**
 * 4-4's drop lever's housing (under the `claw` tab, on the pit's front rim): a chrome control box
 * with a slot down its face and 「夾！」 printed at its top; `down`, its little lamp is lit. Local
 * origin at the tab's hit centre (178, 509).
 */
const dropLever: PartSource = {
  preset: 'tab',
  states: ['up', 'down'],
  box: { x: -34, y: -52, w: 68, h: 104 },
  draw(ctx, state) {
    const box = 'M-24 -40H24V44H-24Z';
    return neonDefs(ctx) + depth(ctx, 3, `<path d="${box}" fill="${ref(ctx, 'cabinetG')}"/><rect x="-20" y="-36" width="40" height="76" rx="3" fill="${ref(ctx, 'chromeG')}"/>`
      + `<rect x="-4" y="-22" width="8" height="58" rx="4" fill="${C.printDark}"/>`
      + `<circle cx="14" cy="-30" r="3" fill="${state === 'down' ? C.lampHot : N.shutterDeep}"/>`
      + `<path d="M-23 -39.2H23" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`, `<path d="${box}"/>`)
      + `<text data-art-text="" x="-4" y="-26" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${N.cabinetDeep}">夾！</text>`
      + (state === 'down' ? softEllipse(ctx, 14, -30, 6, 6, 'lamp', 0.5) : '');
  },
};

// 4-5's boombox

/**
 * 4-5's boombox on the speaker stack (a `light`; 哇！ starts it and it keeps playing). `off`: the
 * boombox sits silent (its tape window dark, 「zz」); `on`: the boombox itself is the decoy, drawn
 * live over this spot (`decoyArt('c4/boombox-shine')`, the same size), so this state draws what the
 * music does round it — sound rings, notes, the EQ's neon. Local origin at the hit centre (130, 334).
 */
const boombox: PartSource = {
  preset: 'light',
  states: ['off', 'on'],
  box: { x: -48, y: -46, w: 96, h: 80 },
  draw(ctx, state) {
    if (state === 'on') {
      return spill(ctx, -40, -30, 80, 50, C.neonCyan, 0.16)
        + neonTube(ctx, 'M-30 -14q-6 8 0 16M-36 -20q-10 14 0 28M30 -14q6 8 0 16M36 -20q10 14 0 28', C.neonCyan, 1.6)
        + `<g fill="${C.chalk}"><path d="M-26 -34v-8l6 -2v8"/><circle cx="-27.6" cy="-34" r="2"/><circle cx="-21.6" cy="-36" r="2"/><path d="M22 -38v-7"/><circle cx="20.6" cy="-38" r="2"/></g>`
        + `<path d="M-26 -42v-8l6 -2v8M22 -38v-7" stroke="${C.chalk}" stroke-width="1.2" fill="none"/>`
        + neonTube(ctx, 'M-14 24v-6M-7 24v-10M0 24v-4M7 24v-8M14 24v-5', C.neonPink, 2.4);
    }
    return boomboxBody(ctx, false) + zz(20, -14, 0.8);
  },
};

// 4-6's shutter, lights and lift

/** 4-6's stage shutter (a `flap`, 翻): its face the karaoke bar's roll-down shutter with 「今晚 卡拉OK」; its back kraft. */
const stageShutter = (() => {
  const { w, h } = flapSize(72, 72);
  return bakedFlap(w, h, (ctx) => {
    let slats = '';
    for (let y = 5; y < h; y += 4.6) slats += `M0 ${f1(y)}H${w}`;
    return neonDefs(ctx) + `<rect width="${w}" height="${h}" fill="${ref(ctx, 'shutterG')}"/><path d="${slats}" stroke="${N.shutterDeep}" stroke-width=".9" opacity=".75"/>`
      + `<rect x="6" y="12" width="${w - 12}" height="18" rx="2" fill="${N.boardMaroon}"/>`
      + `<text data-art-text="" x="${w / 2}" y="20.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="6" fill="${C.chalk}">今晚</text>`
      + `<text data-art-text="" x="${w / 2}" y="27.6" text-anchor="middle" font-family="'Chiron GoRound TC'" font-weight="900" font-size="6" fill="${C.neonPink}">卡拉OK</text>`;
  }, kraftBack(w, h, 46));
})();

/**
 * 4-6's stage lights (a `light`; 哇！ from the stage front switches them): three lamp cans hanging
 * from the truss; `on`, their lenses blaze and three coloured beams (pink, cyan, violet) fall onto
 * the stage. Local origin at the hit centre (310, 320); the truss at local y −36.
 */
const stageLights: PartSource = {
  preset: 'light',
  states: ['off', 'on'],
  box: { x: -84, y: -44, w: 168, h: 200 },
  draw(ctx, state) {
    const lit = state === 'on';
    const cans = [[-50, 6, C.neonPink], [0, 0, C.neonCyan], [50, -6, N.neonViolet]] as const;
    const beams = lit ? cans.map(([x, a, col]) => `<path d="M${x - 7} -16L${x + 7} -16L${x + 34 - a} 148L${x - 34 - a} 148Z" fill="${col}" opacity=".16"/>`).join('') : '';
    const bodies = cans.map(([x, a]) => `<g transform="translate(${x} -30) rotate(${a})"><path d="M0 -6v6" stroke="${C.printDark}" stroke-width="2"/><path d="M-8 0H8L10 16H-10Z" fill="${C.printDark}"/>`
      + `<path d="M-7 1H7" stroke="${N.chromeDeep}" stroke-width="1.2"/></g>`).join('');
    const lenses = cans.map(([x, a, col]) => `<g transform="translate(${x} -30) rotate(${a})"><ellipse cy="16" rx="9" ry="2.6" fill="${lit ? C.lampHot : N.sleepInkDeep}"/>`
      + (lit ? `<ellipse cy="16" rx="9" ry="2.6" fill="none" stroke="${col}" stroke-width="1.4"/>` : '') + `</g>`).join('');
    return beams + depth(ctx, 3, bodies, cans.map(([x]) => `<rect x="${x - 10}" y="-36" width="20" height="22"/>`).join(''))
      + lenses + (lit ? cans.map(([x]) => softEllipse(ctx, x, -12, 14, 8, 'lamp', 0.45)).join('') : '');
  },
};

/**
 * 4-6's trap lift (a `lift`): a round stage riser with a lit rim and a star on its top, on a
 * scissor jack; the 麥克風 stands on it (drawn live). Its top at the origin (the node `M`): under the
 * stage while `down`, level with it while `up`.
 */
const stageLift: PartSource = {
  preset: 'lift',
  states: ['down', 'up'],
  box: { x: -32, y: -14, w: 64, h: 92 },
  draw(ctx) {
    const top = 'M-26 0a26 6 0 1 0 52 0a26 6 0 1 0 -52 0Z';
    let bulbs = '';
    for (let i = 0; i < 9; i++) bulbs += `<circle cx="${f1(-22 + i * 5.5)}" cy="${f1(8 + Math.sin((i / 8) * Math.PI) * 4)}" r="1.3" fill="${C.lampHot}"/>`;
    return depth(ctx, 3, `<path d="M-14 12L14 70M14 12L-14 70M-14 40H14" stroke="${N.chromeDeep}" stroke-width="2.4"/><rect x="-18" y="68" width="36" height="6" rx="2" fill="${C.printDark}"/>`
      + `<path d="M-26 0V8a26 6 0 0 0 52 0V0" fill="${N.velvet}"/><path d="${top}" fill="${N.stageBoardLight}"/>`
      + `<path d="M0 -4l1.4 2.8l3 .3l-2.3 2l.7 3l-2.8 -1.6l-2.8 1.6l.7 -3l-2.3 -2l3 -.3z" fill="${ref(ctx, 'foil')}"/>`, `<path d="${top}"/><rect x="-26" y="0" width="52" height="74"/>`)
      + bulbs;
  },
};

export const C4_PARTS: Readonly<Record<string, PartSource>> = {
  'c4/doors': doors,
  'c4/red-house': redHouseWheel,
  'c4/lantern': lantern,
  'c4/shutter-button': shutterButton,
  'c4/shutter': shutter,
  'c4/neon-1': neonSign('冰果室', C.neonCyan, N.boardTeal),
  'c4/neon-2': neonSign('電影院', C.neonPink, N.boardMaroon),
  'c4/neon-3': neonSign('甜湯', N.neonViolet, N.boardInk),
  'c4/coin-slot': coinSlot,
  'c4/machine-lights': machineLights,
  'c4/claw-cart': clawGantry,
  'c4/drop-lever': dropLever,
  'c4/boombox': boombox,
  'c4/stage-shutter': stageShutter,
  'c4/stage-lights': stageLights,
  'c4/stage-lift': stageLift,
};

// ——— 4-3's 淘氣: Mocha's shadow on the alley wall ———

/**
 * Mocha's enormous shadow (4-3's 淘氣 「讓摩卡躲在招牌後面，再把招牌點亮」): with Mocha hiding behind
 * the second sign as it lights, the sign throws his silhouette up the alley wall — a giant cat, ears
 * and all, in the sign's pink spill — and a chalk 「喵？」. A cut-out at (186, 300), the top of the
 * sign, shown only then.
 */
const mochaShadow: CutoutSource = {
  chapter: 4,
  box: { x: -40, y: -250, w: 170, h: 256 },
  draw(ctx) {
    const cat = 'M-8 0C-14 -60 -6 -120 20 -150L14 -196L44 -164Q60 -170 76 -164L104 -196L100 -148Q124 -120 118 -60Q116 -20 112 0Z';
    const tail = 'M110 -10Q150 -40 130 -110';
    return `<rect x="-30" y="-240" width="160" height="240" rx="20" fill="${C.neonPink}" opacity=".08"${ctx.filters ? filterAttr(ctx, 'blur8') : ''}/>`
      + `<path d="${cat}" fill="${N.plumDeep}" opacity=".78"/><path d="${tail}" stroke="${N.plumDeep}" stroke-width="16" fill="none" stroke-linecap="round" opacity=".78"/>`
      + `<text data-art-text="" x="60" y="-212" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="14" fill="${C.chalk}">喵？</text>`;
  },
};

export const C4_CUTOUTS: Readonly<Record<string, CutoutSource>> = {
  'c4/mocha-shadow': mochaShadow,
};
