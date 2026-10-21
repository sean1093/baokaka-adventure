import { POPUP as C, POPUP_BEITOU as BT, POPUP_CHAPTER_CLOCK, POPUP_MAOKONG as MK, POPUP_STAGE as S, POPUP_STATION as T, mixHex, type PopupChapterSky } from '../../../art/palette';
import type { Kind, PageDef } from '../../core/types';
import { PRESET_DEFS, brad, depth, f1, f2, kitDefs, pageBlock, paw, pinholes, ref, scallopBand, seeded, skyline, softEllipse, sparkle, translate, type DefName, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorOutline, floorWiden, towardVp } from '../geometry';
import { treasureArt } from '../photo/treasureArt';
import { LEDGE_DEPTH, type Carriage, type LedgeRun, type PerchPost, type Slope } from '../stage';
import { boomboxBody } from './ximen';

/**
 * The placeholder stage (#89): what a page shows until its own art is baked (#96) and the
 * character frames are wired (#94). Built from the kit (`src/popup/art/`) in the bible's paper
 * language, so M0/M1 pages already read as a pop-up book: a night backdrop page standing behind
 * a floor page in gentle perspective, the gutter's ambient occlusion and lit crease, a landmark
 * pop-up with a V-fold crease, paper ledges under every walkable run, perch furniture, a carriage
 * for parts that carry nodes, and die-cut stand-ins for 寶咖咖, 摩卡 and the creatures.
 *
 * Every function returns an SVG string in page units, with `ctx`-scoped def ids and no filters
 * on the in-game path (`ctx.filters` false: GDD § 3.9). Colours come from `POPUP` and
 * `POPUP_STAGE` only.
 */

/** Every kit def a page may reference: the part presets' and the stage's (filters drop out in game). */
export const STAGE_DEFS: readonly DefName[] = [...new Set<DefName>([...PRESET_DEFS, 'foil', 'foilH', 'coin', 'kraft', 'corr', 'window', 'tabG', 'tabR', 'ridges', 'hatch', 'softShadow', 'softMarigold', 'softLamp', 'softFoil'])];

/** The chapter's sky on the colour clock (bible § 3.3); the prologue for unknown chapters. */
export function chapterSky(chapter: number): PopupChapterSky {
  return POPUP_CHAPTER_CLOCK.find((s) => s.chapter === chapter) ?? POPUP_CHAPTER_CLOCK[0];
}

/** Indoors (the prologue and page E at home) or a city night. */
export type StageTheme = 'room' | 'city';
export const themeOf = (def: Pick<PageDef, 'chapter'>): StageTheme => (def.chapter === 0 || def.chapter === 11 ? 'room' : 'city');

const lin = (id: string, stops: readonly (readonly [number, string, number?])[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">`
  + stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')
  + `</linearGradient>`;
const radial = (id: string, stops: readonly (readonly [number, string, number?])[], cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">`
  + stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')
  + `</radialGradient>`;

/**
 * The page's `<defs>`: the kit's paints and the stage's own gradients (sky per chapter, materials),
 * scoped by `ctx`. `all` emits every kit def (the bake, whose art may use any depth filter).
 */
export function stageDefs(ctx: KitCtx, sky: PopupChapterSky, { all = false }: { all?: boolean } = {}): string {
  const id = ctx.id;
  return kitDefs(ctx, all ? undefined : STAGE_DEFS, [
    lin(id('sky'), [[0, sky.top], [0.45, mixHex(sky.top, sky.horizon, 0.38)], [0.82, mixHex(sky.top, sky.horizon, 0.72)], [1, sky.horizon]]),
    lin(id('cloudFar'), [[0, mixHex(sky.top, sky.horizon, 0.42)], [1, mixHex(sky.top, sky.horizon, 0.3)]]),
    lin(id('cloudNear'), [[0, mixHex(sky.top, sky.horizon, 0.62)], [1, mixHex(sky.top, sky.horizon, 0.44)]]),
    radial(id('moon'), [[0, C.foilShine], [0.7, C.moon], [1, mixHex(C.moon, C.gold, 0.55)]], 0.42, 0.38, 0.7),
    lin(id('facade'), [[0, S.facadeTop], [0.55, S.facadeMid], [1, S.facadeLow]]),
    lin(id('roof'), [[0, S.roofTop], [1, S.roofLow]]),
    lin(id('drum'), [[0, S.drumTop], [1, S.drumLow]]),
    lin(id('brick'), [[0, S.brickTop], [1, S.brickLow]]),
    lin(id('platTop'), [[0, S.platTop], [1, S.platTopNear]]),
    lin(id('rug'), [[0, S.rugTop], [1, S.rugLow]]),
    lin(id('rugTop'), [[0, mixHex(S.rugTop, C.page, 0.25)], [1, S.rugTop]]),
    lin(id('wall'), [[0, S.wallTop], [1, S.wallLow]]),
    lin(id('wood'), [[0, S.woodLight], [1, S.wood]]),
    lin(id('pillar'), [[0, S.pillarLit], [0.5, S.pillarMid], [1, S.pillarShade]], false),
    lin(id('carriage'), [[0, S.carriageTop], [1, S.carriageLow]]),
    lin(id('floorShade'), [[0, S.floorShade, 0.12], [1, S.floorShade, 0.5]]),
    lin(id('gutterAo'), [[0, C.vignette, 0], [0.5, C.vignette, 0.55], [1, C.vignette, 0]]),
    lin(id('lampBand'), [[0, C.lampAmber, 0], [1, C.lampAmber, 0.16]]),
    radial(id('lampPool'), [[0, C.lamp, 0.55], [0.6, C.lampAmber, 0.18], [1, C.lampAmber, 0]]),
    // The lamp glow behind 寶咖咖 near a lit light (bible § 5: a soft warm glow, ≈ 18 %), as a gradient: no filter on a mover
    radial(id('standeeGlow'), [[0, C.lamp, 0.34], [0.5, C.lampAmber, 0.18], [1, C.lampAmber, 0]]),
    lin(id('leaf'), [[0, S.leafLight], [1, S.leaf]]),
  ].join(''));
}

// ——— Book cues (bible § 2.2) ———

/** The gutter: an 18-unit ambient-occlusion band, darkest (55 %) on the fold, and a 0.6 lit crease. */
export function gutter(ctx: KitCtx, y = GUTTER_Y): string {
  return `<rect x="-20" y="${y - 9}" width="${PAGE_W + 40}" height="18" fill="${ref(ctx, 'gutterAo')}"/>`
    + `<path d="M-20 ${y + 0.5}H${PAGE_W + 20}" stroke="${C.cutRim}" stroke-width=".6" opacity=".35"/>`;
}

/**
 * A spread's spine (GDD § 2.9; bible § 3.2 valley fold; #103): the book opened flat across two
 * pages, so a crease runs down the middle of both the standing page and the floor page — a blurred
 * ambient-occlusion strip, darkest on the fold, a dark crease line and a lit ridge on its left.
 * Flat fills and gradients (no filter), in page units over the whole drawn book.
 */
export function spine(ctx: KitCtx, x = PAGE_W / 2): string {
  const id = ctx.id('spineAo');
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.foldAo}" stop-opacity="0"/>`
    + `<stop offset=".5" stop-color="${C.foldAo}" stop-opacity=".6"/><stop offset="1" stop-color="${C.foldAo}" stop-opacity="0"/></linearGradient></defs>`
    + `<g data-spine="">`
    + `<rect x="${x - 22}" y="0" width="44" height="${FLOOR_BOTTOM}" fill="url(#${id})"/>`
    + `<rect x="${x}" y="0" width="12" height="${FLOOR_BOTTOM}" fill="${C.shadow}" opacity=".16"/>`
    + `<path d="M${x - 2} 0V${FLOOR_BOTTOM}" stroke="${C.cutRim}" stroke-width="1.2" opacity=".42"/>`
    + `<path d="M${x} 0V${FLOOR_BOTTOM}" stroke="${C.foldAo}" stroke-width="1.4" opacity=".8"/>`
    + `</g>`;
}

/**
 * The V-fold crease of a landmark pop-up (bible § 2.2): the facade `shape` folded down its centre
 * line `cx`. The left half stays lit, the right half falls 20–26 % darker (`shade`, default 23 %),
 * and a 0.8 light ridge runs down the fold. `clipId` must be unique in the document.
 */
export function vFold(ctx: KitCtx, shape: string, cx: number, top: number, bottom: number, { shade = 0.23, clipId = ctx.id('vfold') } = {}): string {
  return `<clipPath id="${clipId}"><path d="${shape}"/></clipPath>`
    + `<g clip-path="url(#${clipId})"><rect x="${cx}" y="${top - 40}" width="${PAGE_W}" height="${bottom - top + 80}" fill="${C.shadow}" opacity="${shade}"/>`
    + `<rect x="${cx - 40}" y="${top - 40}" width="40" height="${bottom - top + 80}" fill="${C.cutRim}" opacity=".05"/></g>`
    + `<path d="M${cx} ${top}V${bottom}" stroke="${C.cutRim}" stroke-width=".8" opacity=".38"/>`;
}

/** A paper street lamp: card post, a glowing vellum lantern, its light pool painted on the floor. */
function lampPost(ctx: KitCtx, x: number, top: number, foot: number): string {
  return softEllipse(ctx, x, top + 6, 26, 26, 'lamp', 0.22, 'blur8')
    + depth(ctx, 3, `<rect x="${x - 2}" y="${top + 12}" width="4" height="${foot - top - 12}" fill="${S.lampPost}"/><path d="M${x - 7} ${foot}h14l-2 -6h-10z" fill="${S.lampPost}"/>`
      + `<path d="M${x - 9} ${top + 2}h18l-3 12h-12z" fill="${S.lampShade}"/><path d="M${x - 11} ${top + 2}h22l-11 -8z" fill="${S.lampPost}"/>`,
    `<rect x="${x - 2}" y="${top + 12}" width="4" height="${foot - top - 12}"/><path d="M${x - 11} ${top + 2}h22l-3 12h-16z"/>`)
    + `<path d="M${x - 7} ${top + 4}h14l-2 9h-10z" fill="${C.lampHot}"/>`;
}

/** The moon (bible § 3.3): a backlit vellum disc with embossed craters, a foil ring and two halos. */
function moon(ctx: KitCtx, x: number, y: number, r: number): string {
  return softEllipse(ctx, x, y, r * 2.2, r * 2.2, 'lamp', 0.1, 'blur18') + softEllipse(ctx, x, y, r * 1.35, r * 1.35, 'lamp', 0.14, 'blur8')
    + depth(ctx, 2, `<circle cx="${x}" cy="${y}" r="${r}" fill="${ref(ctx, 'moon')}"/>`, `<circle cx="${x}" cy="${y}" r="${r}"/>`)
    + `<g fill="${mixHex(C.moon, C.ochre, 0.35)}"><circle cx="${f1(x - r * 0.3)}" cy="${f1(y - r * 0.27)}" r="${f1(r * 0.23)}" opacity=".6"/><circle cx="${f1(x + r * 0.3)}" cy="${f1(y + r * 0.33)}" r="${f1(r * 0.17)}" opacity=".55"/><circle cx="${f1(x + r * 0.33)}" cy="${f1(y - r * 0.37)}" r="${f1(r * 0.1)}" opacity=".5"/></g>`
    + `<circle cx="${x}" cy="${y}" r="${f1(r + 3.5)}" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1" opacity=".7"/>`;
}

/** A perspective checker printed on the floor page, as one path (rows shrink toward the gutter). */
function floorChecker(cell = 33): string {
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
    for (let u = -14; u < 14; u++) {
      if ((u + r) % 2) continue;
      const [za, zb] = [zs[r], zs[r + 1]];
      d += `M${f1(xOf(u, za))} ${f1(yOf(za))}L${f1(xOf(u + 1, za))} ${f1(yOf(za))}L${f1(xOf(u + 1, zb))} ${f1(yOf(zb))}L${f1(xOf(u, zb))} ${f1(yOf(zb))}Z`;
    }
  }
  return d;
}

/** Wooden floorboards in perspective (seams converge on the vanishing point), as one path. */
function floorboards(seed = 5): string {
  const r = seeded(seed);
  const k = (FLOOR_BOTTOM - GUTTER_Y) / (GUTTER_Y + 360);
  let d = '';
  for (let x = -80; x <= PAGE_W + 80; x += 30) {
    const xb = x + (x - 195) * k;
    d += `M${f1(x)} ${GUTTER_Y}L${f1(xb)} ${FLOOR_BOTTOM}`;
    // A few butt joints across the board
    for (let j = 0; j < 2; j++) {
      const t = 0.15 + r() * 0.8;
      const y = GUTTER_Y + (FLOOR_BOTTOM - GUTTER_Y) * t;
      const xa = x + (x - 195) * k * t;
      const w = 30 + (30 + 60 * k) * t * 0.9;
      d += `M${f1(xa)} ${f1(y)}h${f1(w * 0.95)}`;
    }
  }
  return d;
}

/** The floor page, clipped to its widening outline: base card, print, shade, light pools, hatch. */
function floorPage(ctx: KitCtx, theme: StageTheme): string {
  const clip = ctx.id('floorClip');
  const w = floorWiden(FLOOR_BOTTOM);
  const print = theme === 'city'
    ? `<rect x="${-w}" y="${GUTTER_Y}" width="${PAGE_W + 2 * w}" height="${FLOOR_BOTTOM - GUTTER_Y}" fill="${S.floorCard}"/><path d="${floorChecker()}" fill="${S.floorCheck}"/>`
    : `<rect x="${-w}" y="${GUTTER_Y}" width="${PAGE_W + 2 * w}" height="${FLOOR_BOTTOM - GUTTER_Y}" fill="${ref(ctx, 'wood')}"/><path d="${floorboards()}" stroke="${S.woodDark}" stroke-width="1.2" opacity=".55" fill="none"/>`;
  const pools = theme === 'city'
    ? [[100, GUTTER_Y + 30, 130, 44], [350, GUTTER_Y + 30, 120, 42], [195, GUTTER_Y + 12, 100, 24]]
    : [[80, GUTTER_Y + 40, 150, 56], [300, GUTTER_Y + 22, 110, 30]];
  return `<clipPath id="${clip}"><path d="${floorOutline()}"/></clipPath><g clip-path="url(#${clip})">${print}`
    + `<rect x="${-w}" y="${GUTTER_Y}" width="${PAGE_W + 2 * w}" height="${FLOOR_BOTTOM - GUTTER_Y}" fill="${ref(ctx, 'floorShade')}"/>`
    + pools.map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ref(ctx, 'lampPool')}"/>`).join('')
    + `<rect x="${-w}" y="${GUTTER_Y}" width="${PAGE_W + 2 * w}" height="${FLOOR_BOTTOM - GUTTER_Y}" fill="${ref(ctx, 'hatch')}" opacity=".22"/></g>`
    // The floor page's cut front edge catching light
    + `<path d="M${f1(-w)} ${FLOOR_BOTTOM - 0.5}H${f1(PAGE_W + w)}" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`;
}

// ——— Backdrops ———

/** A generic civic hall standing just in front of the city backdrop, folded down its centre (proof A). */
function landmark(ctx: KitCtx, place: string): string {
  const x0 = 34, x1 = 356, top = 196, base = GUTTER_Y + 4, cx = 195;
  const body = top + 44;
  const n = 9;
  const step = (x1 - x0 - 28) / n;
  let s = depth(ctx, 2, `<rect x="${x0}" y="${body}" width="${x1 - x0}" height="${base - body}" fill="${ref(ctx, 'facade')}"/>`
    + `<path d="${Array.from({ length: n }, (_, i) => `M${f1(x0 + 14 + i * step)} ${body + 24}h${f1(step * 0.5)}V${base - 16}h${f1(-step * 0.5)}Z`).join('')}" fill="${S.facadeRecess}"/>`,
  `<rect x="${x0}" y="${body}" width="${x1 - x0}" height="${base - body}"/>`);
  // Lit windows: cut holes backed with glowing vellum, a mullion each
  s += `<path d="${Array.from({ length: n }, (_, i) => `M${f1(x0 + 16 + i * step)} ${body + 26}h${f1(step * 0.5 - 4)}V${base - 20}h${f1(-(step * 0.5 - 4))}Z`).join('')}" fill="${ref(ctx, 'window')}"/>`
    + `<path d="${Array.from({ length: n }, (_, i) => `M${f1(x0 + 14 + i * step + step * 0.25)} ${body + 26}V${base - 20}`).join('')}" stroke="${S.facadeRecess}" stroke-width=".8" opacity=".45"/>`;
  // Entrance arcade: three lit arches
  s += depth(ctx, 3, `<rect x="150" y="${base - 40}" width="90" height="40" fill="${S.facadeRecess}"/>`, `<rect x="150" y="${base - 40}" width="90" height="40"/>`)
    + `<path d="${[0, 1, 2].map((i) => `M${158 + i * 28} ${base}V${base - 22}a10 10 0 0 1 20 0V${base}Z`).join('')}" fill="${ref(ctx, 'window')}"/>`;
  // The name plate in foil
  s += depth(ctx, 3, `<rect x="135" y="${body + 4}" width="120" height="22" rx="2" fill="${C.printDark}"/>`, `<rect x="135" y="${body + 4}" width="120" height="22" rx="2"/>`)
    + `<rect x="137.5" y="${body + 6.5}" width="115" height="17" rx="1" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width=".8"/>`
    + `<text data-art-text="" x="195" y="${body + 20}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="13" fill="${ref(ctx, 'foilH')}" letter-spacing="5">${place}</text>`;
  // 重簷: the lower roof with upturned eaves, the drum, the upper roof with a gold ridge
  const lower = `M${x0 - 18} ${top + 48}Q${x0 - 6} ${top + 40} ${x0 + 14} ${top + 26}L${x1 - 14} ${top + 26}Q${x1 + 6} ${top + 40} ${x1 + 18} ${top + 48}Q${x1} ${top + 44} ${x1 - 8} ${top + 46}H${x0 + 8}Q${x0} ${top + 44} ${x0 - 18} ${top + 48}Z`;
  s += depth(ctx, 3, `<path d="${lower}" fill="${ref(ctx, 'roof')}"/><path d="${Array.from({ length: 24 }, (_, i) => `M${f1(x0 + 18 + i * 12.3)} ${top + 28}L${f1(x0 + 14 + i * 12.5)} ${top + 45}`).join('')}" stroke="${S.roofTile}" stroke-width="1.2" opacity=".7"/>`
    + `<path d="M${x0 + 14} ${top + 26}H${x1 - 14}" stroke="${S.roofRidge}" stroke-width="2"/>`, `<path d="${lower}"/>`);
  s += depth(ctx, 3, `<rect x="118" y="${top + 2}" width="154" height="26" fill="${ref(ctx, 'drum')}"/>`, `<rect x="118" y="${top + 2}" width="154" height="26"/>`)
    + `<path d="${Array.from({ length: 8 }, (_, i) => `M${f1(126 + i * 18.5)} ${top + 8}h9v14h-9Z`).join('')}" fill="${ref(ctx, 'window')}"/>`;
  const upper = `M92 ${top + 6}Q104 ${top - 2} 122 ${top - 16}L268 ${top - 16}Q286 ${top - 2} 298 ${top + 6}Q284 ${top + 2} 276 ${top + 4}H114Q106 ${top + 2} 92 ${top + 6}Z`;
  s += depth(ctx, 4, `<path d="${upper}" fill="${ref(ctx, 'roof')}"/><path d="${Array.from({ length: 14 }, (_, i) => `M${f1(126 + i * 10.6)} ${top - 14}L${f1(122 + i * 10.9)} ${top + 3}`).join('')}" stroke="${S.roofTile}" stroke-width="1.2" opacity=".7"/>`
    + `<path d="M122 ${top - 16}H268" stroke="${S.roofRidge}" stroke-width="2.2"/><path d="M118 ${top - 16}q-6 -6 -2 -11M272 ${top - 16}q6 -6 2 -11" stroke="${S.roofRidge}" stroke-width="2" fill="none"/>`, `<path d="${upper}"/>`);
  // The V-fold down the facade: the most "pop-up" read a flat facade can get
  const shape = `M${x0} ${base}V${body}H${x0 - 18}L${x0 + 14} ${top + 26}H118V${top + 6}H92L122 ${top - 16}H268L298 ${top + 6}H272V${top + 26}H${x1 - 14}L${x1 + 18} ${top + 48}H${x1}V${base}Z`;
  return s + vFold(ctx, shape, cx, top - 16, base, { clipId: ctx.id('landmarkFold') });
}

/** The city night backdrop page (chapters 1–10): sky, pinholes, moon, cut-paper clouds, skyline, landmark. */
function cityBackdrop(ctx: KitCtx, sky: PopupChapterSky): string {
  const clip = ctx.id('backClip');
  const sk = skyline(-4, PAGE_W + 4, 254, 33, { minH: 18, maxH: 58, winP: 0.14 });
  const tower = `<g transform="translate(58 254)"><path d="M-6 0V-64L-4 -66V-80H-3V-92H3V-80H4V-66L6 -64V0Z" fill="${mixHex(sky.top, C.shadow, 0.15)}"/>`
    + `<path d="${Array.from({ length: 8 }, (_, i) => `M-7 ${-14 - i * 6.5}H7`).join('')}" stroke="${C.neonCyan}" stroke-width=".7" opacity=".5"/><circle cy="-94" r="1.4" fill="${C.neonPink}"/></g>`;
  let back = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, 0, 0, PAGE_W, 230, 70, 9)
    + moon(ctx, 318, 62, 30)
    + `<path d="M232 92q10 -18 30 -10q14 -16 34 -4q20 -8 30 8q24 0 22 16H228q-12 -2 4 -10z" fill="${C.vellum}" opacity=".42"/>`
    + depth(ctx, 1, `<path d="${scallopBand(-6, PAGE_W + 6, 160, 214, 21, 9, 34)}" fill="${ref(ctx, 'cloudFar')}" opacity=".95"/>`, `<path d="${scallopBand(-6, PAGE_W + 6, 160, 214, 21, 9, 34)}"/>`)
    + depth(ctx, 1, `<path d="${sk.d}" fill="${mixHex(sky.top, C.shadow, 0.15)}"/>${tower}`, `<path d="${sk.d}"/>`) + sk.windows
    + depth(ctx, 1, `<path d="${scallopBand(-6, PAGE_W + 6, 248, 290, 44, 6, 40)}" fill="${ref(ctx, 'cloudNear')}"/>`, `<path d="${scallopBand(-6, PAGE_W + 6, 248, 290, 44, 6, 40)}"/>`)
    + landmark(ctx, sky.place)
    + `<rect x="-20" y="${GUTTER_Y - 44}" width="${PAGE_W + 40}" height="44" fill="${ref(ctx, 'lampBand')}"/>`;
  back = `<clipPath id="${clip}"><rect x="0" y="0" width="${PAGE_W}" height="${GUTTER_Y}" rx="5"/></clipPath><g clip-path="url(#${clip})">${back}</g>`;
  return back + floorPage(ctx, 'city') + gutter(ctx) + lampPost(ctx, 18, 288, GUTTER_Y + 18) + lampPost(ctx, 372, 282, GUTTER_Y + 22);
}

/** The home backdrop page (序章, page E): plum wallpaper, wainscot, the window on the night street, curtains, a lamp. */
function roomBackdrop(ctx: KitCtx, sky: PopupChapterSky): string {
  const clip = ctx.id('backClip');
  const win = { x: 206, y: 34, w: 160, h: 176 };
  const winClip = ctx.id('winClip');
  const sk = skyline(win.x - 4, win.x + win.w + 4, win.y + win.h, 7, { minH: 14, maxH: 46, winP: 0.2 });
  const stripes = Array.from({ length: 27 }, (_, i) => `M${i * 15} 0V${GUTTER_Y}`).join('');
  const view = `<clipPath id="${winClip}"><rect x="${win.x}" y="${win.y}" width="${win.w}" height="${win.h}"/></clipPath>`
    + `<g clip-path="url(#${winClip})"><rect x="${win.x}" y="${win.y}" width="${win.w}" height="${win.h}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, win.x, win.y, win.w, 110, 24, 4)
    + moon(ctx, win.x + 44, win.y + 44, 18)
    + `<path d="${sk.d}" fill="${mixHex(sky.top, C.shadow, 0.1)}"/>${sk.windows}`
    // The little 土地公 shrine across the street: a red roof over a lit niche
    + `<path d="M${win.x + 108} ${win.y + 98}h28l-4 -8h-20z" fill="${C.hatRed}"/><rect x="${win.x + 112}" y="${win.y + 98}" width="20" height="16" fill="${ref(ctx, 'window')}"/>`
    + `</g>`;
  const frame = depth(ctx, 2, `<path d="M${win.x - 8} ${win.y - 8}h${win.w + 16}v${win.h + 16}h${-(win.w + 16)}Z M${win.x} ${win.y}v${win.h}h${win.w}v${-win.h}Z" fill="${ref(ctx, 'wood')}" fill-rule="evenodd"/>`
    + `<path d="M${win.x + win.w / 2} ${win.y}V${win.y + win.h}M${win.x} ${win.y + win.h * 0.45}H${win.x + win.w}" stroke="${S.woodDark}" stroke-width="5"/>`
    + `<rect x="${win.x - 14}" y="${win.y + win.h + 6}" width="${win.w + 28}" height="8" rx="2" fill="${S.woodLight}"/>`,
  // The outline keeps the window's hole, so the frame's shadow never dims the view through it
  `<path d="M${win.x - 8} ${win.y - 8}h${win.w + 16}v${win.h + 16}h${-(win.w + 16)}Z M${win.x} ${win.y}v${win.h}h${win.w}v${-win.h}Z" fill-rule="evenodd"/>`);
  const curtain = (x: number, flip: number) => {
    const d = `M0 0H34Q30 70 38 ${win.h + 20}H${-2}Q4 80 0 0Z`;
    return `<g transform="${translate(x, win.y - 14)} scale(${flip} 1)">`
      + depth(ctx, 3, `<path d="${d}" fill="${S.curtain}"/><path d="M10 4Q8 80 12 ${win.h + 16}M22 4Q20 80 25 ${win.h + 16}" stroke="${S.curtainDeep}" stroke-width="3" fill="none" opacity=".7"/>`, `<path d="${d}"/>`)
      + `</g>`;
  };
  const rod = `<rect x="${win.x - 30}" y="${win.y - 20}" width="${win.w + 60}" height="5" rx="2.5" fill="${ref(ctx, 'foil')}"/>`;
  const lamp = `<g transform="translate(-30 64)">${softEllipse(ctx, 70, 120, 70, 70, 'lamp', 0.3, 'blur18')}`
    + depth(ctx, 3, `<path d="M52 92h36l10 34h-56z" fill="${S.lampShade}"/><rect x="68" y="126" width="4" height="40" fill="${S.lampPost}"/><path d="M58 166h24v6h-24z" fill="${S.lampPost}"/>`, `<path d="M52 92h36l10 34h-56z"/>`)
    + `<path d="M56 98h28l7 24h-42z" fill="${C.lampHot}" opacity=".7"/></g>`;
  const wainscot = `<rect x="-20" y="${GUTTER_Y - 70}" width="${PAGE_W + 40}" height="70" fill="${S.wainscot}"/>`
    + `<path d="M-20 ${GUTTER_Y - 70}H${PAGE_W + 20}" stroke="${S.woodLight}" stroke-width="3"/>`
    + `<path d="${Array.from({ length: 7 }, (_, i) => `M${8 + i * 58} ${GUTTER_Y - 58}h46v46h-46Z`).join('')}" fill="none" stroke="${S.woodDark}" stroke-width="1.6" opacity=".7"/>`;
  let back = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'wall')}"/>`
    + `<path d="${stripes}" stroke="${S.wallStripe}" stroke-width="5" opacity=".35"/>`
    + view + frame + rod + curtain(win.x - 26, 1) + curtain(win.x + win.w + 26, -1) + lamp + wainscot
    + `<rect x="-20" y="${GUTTER_Y - 44}" width="${PAGE_W + 40}" height="44" fill="${ref(ctx, 'lampBand')}"/>`;
  back = `<clipPath id="${clip}"><rect x="0" y="0" width="${PAGE_W}" height="${GUTTER_Y}" rx="5"/></clipPath><g clip-path="url(#${clip})">${back}</g>`;
  return back + floorPage(ctx, 'room') + gutter(ctx);
}

/**
 * The placeholder backdrop for a page (GDD § 3.9 layer 1): its chapter's sky on the colour clock,
 * indoors for the prologue, a city night otherwise; the floor page, the gutter and the page-block
 * edges. Static: drawn once per page. It references `stageDefs`, which the page emits once.
 */
export function placeholderBackdrop(ctx: KitCtx, def: Pick<PageDef, 'chapter'>): string {
  const sky = chapterSky(def.chapter);
  const w = floorWiden(FLOOR_BOTTOM);
  return (themeOf(def) === 'room' ? roomBackdrop(ctx, sky) : cityBackdrop(ctx, sky))
    + pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
}

// ——— Walkable scenery (from the walk graph, `stage.ts`) ———

/** A paper ledge box (bible § 2.2 z4): front face, a top receding toward the VP, an inner side face. */
export function ledge(ctx: KitCtx, run: LedgeRun, theme: StageTheme): string {
  const { x0, x1, y } = run;
  const t = LEDGE_DEPTH;
  if (run.single) return cushion(ctx, (x0 + x1) / 2, y, theme);
  const [ax, ay] = towardVp([x0, y]);
  const [bx] = towardVp([x1, y]); // every point at one y recedes to the same y
  const top = `M${ax} ${ay}H${bx}L${x1} ${y}H${x0}Z`;
  // The side face toward the page centre shows (the VP is above the centre)
  const inner = x1 < PAGE_W / 2 + 40 && !run.toRight ? x1 : x0 > PAGE_W / 2 - 40 && !run.toLeft ? x0 : null;
  const side = inner === null ? '' : (() => {
    const [sx, sy] = towardVp([inner, y]);
    const [lx, ly] = towardVp([inner, y + t]);
    return `<path d="M${inner} ${y}L${sx} ${sy}L${lx} ${ly}L${inner} ${y + t}Z" fill="${theme === 'city' ? S.brickSide : S.rugLow}"/>`;
  })();
  const front = `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${t}" fill="${ref(ctx, theme === 'city' ? 'brick' : 'rug')}"/>`;
  let detail: string;
  if (theme === 'city') {
    let mortar = '';
    for (let r = 0; r < 3; r++) {
      mortar += `M${x0} ${y + 12 + r * 10}H${x1}`;
      for (let x = x0 + (r % 2 ? 11 : 0); x < x1; x += 22) mortar += `M${f1(x)} ${y + 2 + r * 10}v10`;
    }
    detail = `<path d="${mortar}" stroke="${S.brickMortar}" stroke-width="1" opacity=".5"/>`
      + `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="6" fill="${C.shadow}" opacity=".2"/>`
      + `<path d="${top}" fill="${ref(ctx, 'platTop')}"/><path d="M${ax} ${ay}H${bx}" stroke="${S.platEdge}" stroke-width="1" opacity=".6"/>`
      // The tactile strip, printed ochre (marigold is reserved for touchables, bible § 4)
      + `<path d="M${x0} ${y - 2.5}H${x1}" stroke="${C.ochre}" stroke-width="5"/><path d="M${x0 + 4} ${y - 2.5}H${x1}" stroke="${C.ochreDark}" stroke-width="2" stroke-dasharray="0 7" stroke-linecap="round"/>`;
  } else {
    detail = `<path d="${top}" fill="${ref(ctx, 'rugTop')}"/>`
      + `<path d="M${x0 + 4} ${y + 6}H${x1 - 4}M${x0 + 4} ${y + t - 7}H${x1 - 4}" stroke="${S.rugStitch}" stroke-width="1.2" stroke-dasharray="4 4" opacity=".75"/>`
      + `<path d="${Array.from({ length: Math.floor((x1 - x0) / 26) }, (_, i) => `M${f1(x0 + 13 + i * 26)} ${y + 14}l5 5l-5 5l-5 -5z`).join('')}" fill="${S.rugStitch}" opacity=".45"/>`;
  }
  const rim = `<path d="M${x0} ${y + 0.5}H${x1}" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`;
  return depth(ctx, 4, side + front + detail + rim, `${side ? side.replace(/ fill="[^"]*"/, '') : ''}<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${t}"/><path d="${top}"/>`);
}

/** A single-node ledge: a plump cushion indoors, a small crate outdoors. */
function cushion(ctx: KitCtx, x: number, y: number, theme: StageTheme): string {
  if (theme === 'room') {
    const d = `M${x - 32} ${y + 2}Q${x - 36} ${y - 8} ${x - 24} ${y - 9}Q${x} ${y - 14} ${x + 24} ${y - 9}Q${x + 36} ${y - 8} ${x + 32} ${y + 2}Q${x + 36} ${y + 18} ${x + 24} ${y + 20}Q${x} ${y + 24} ${x - 24} ${y + 20}Q${x - 36} ${y + 18} ${x - 32} ${y + 2}Z`;
    return depth(ctx, 4, `<path d="${d}" fill="${ref(ctx, 'rug')}"/><path d="M${x - 22} ${y - 3}Q${x} ${y - 8} ${x + 22} ${y - 3}" stroke="${S.rugStitch}" stroke-width="1.2" stroke-dasharray="3 3" fill="none" opacity=".8"/>`, `<path d="${d}"/>`);
  }
  return depth(ctx, 4, `<rect x="${x - 26}" y="${y}" width="52" height="30" fill="${ref(ctx, 'corr')}"/><rect x="${x - 26}" y="${y}" width="52" height="5" fill="${S.platTop}"/>`, `<rect x="${x - 26}" y="${y}" width="52" height="30"/>`);
}

/** A ramp between two levels (always open), drawn as a sloped card under its ends. */
export function ramp(ctx: KitCtx, slope: Pick<Slope, 'from' | 'to'>, theme: StageTheme): string {
  const [[ax, ay], [bx, by]] = [slope.from, slope.to];
  const t = 18;
  const d = `M${ax} ${ay}L${bx} ${by}L${bx} ${by + t}L${ax} ${ay + t}Z`;
  const fill = theme === 'city' ? ref(ctx, 'platTop') : ref(ctx, 'rugTop');
  return depth(ctx, 4, `<path d="${d}" fill="${fill}"/><path d="M${ax} ${ay + 0.5}L${bx} ${by + 0.5}" stroke="${C.cutRim}" stroke-width="1" opacity=".55"/>`, `<path d="${d}"/>`);
}

/**
 * The rail that blocks a conditional crossing while it is closed (a crib rail, a little barrier).
 * Drawn standing on its foot at the origin, so the view can fold it flat with `scaleY`. `linked`
 * adds the brad with the dashed marigold ring that pairs it with the touchable that moves it.
 */
export function rail(ctx: KitCtx, theme: StageTheme, linked: boolean): string {
  const h = 52;
  const [bar, post] = theme === 'room' ? [C.foldLitHigh, S.woodLight] : [C.printLilac, C.printLilacDeep];
  const slats = `M-13 ${-h + 7}h5V0h-5z M-4.5 ${-h + 7}h5V0h-5z M4 ${-h + 7}h5V0h-5z`;
  const rails = `M-18 ${-h}h36v7h-36z M-18 -6h36v6h-36z`;
  return depth(ctx, 3, `<path d="${slats}" fill="${bar}"/><path d="${rails}" fill="${post}"/><path d="M-18 ${-h + 0.5}h36" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<path d="M-18 ${-h}h36v${h}h-36z"/>`)
    + (linked ? brad(ctx, 0, -h + 3.5, 3.2, true) : '');
}

/** Perch furniture: a pillar (high perch) or a bench (a seat) standing on its ledge, a wall shelf, or a laundry basket. */
export function perchPost(ctx: KitCtx, post: PerchPost): string {
  const { x, top, foot } = post;
  if (post.kind === 'shelf') {
    // A plank on two brackets, its top at the perch node (indoors, on the standing page)
    const body = `<path d="M${x - 24} ${top + 8}l8 0l-8 16z M${x + 24} ${top + 8}l-8 0l8 16z" fill="${S.woodDark}"/>`
      + `<rect x="${x - 34}" y="${top}" width="68" height="8" rx="1.5" fill="${ref(ctx, 'wood')}"/>`
      + `<path d="M${x - 34} ${top + 0.5}h68" stroke="${C.cutRim}" stroke-width="1" opacity=".7"/>`;
    return depth(ctx, 3, body, `<rect x="${x - 34}" y="${top}" width="68" height="8"/><path d="M${x - 24} ${top + 8}l8 0l-8 16z M${x + 24} ${top + 8}l-8 0l8 16z"/>`);
  }
  if (post.kind === 'basket') return laundryBasket(ctx, x, top, foot);
  if (post.kind === 'pillar') {
    const body = `<rect x="${x - 15}" y="${top + 12}" width="30" height="${foot - top - 12}" fill="${ref(ctx, 'pillar')}"/>`
      + `<rect x="${x - 21}" y="${top}" width="42" height="14" rx="2" fill="${S.pillarCap}"/><rect x="${x - 19}" y="${top + 12}" width="38" height="4" fill="${S.drumLow}"/>`
      + `<path d="M${x - 21} ${top + 0.5}h42" stroke="${C.cutRim}" stroke-width="1" opacity=".7"/>`;
    return depth(ctx, 3, body, `<rect x="${x - 15}" y="${top + 12}" width="30" height="${foot - top - 12}"/><rect x="${x - 21}" y="${top}" width="42" height="14"/>`);
  }
  const body = `<rect x="${x - 29}" y="${top - 14}" width="58" height="5" rx="2" fill="${S.benchBack}"/><rect x="${x - 29}" y="${top}" width="58" height="6" rx="2" fill="${S.benchSeat}"/>`
    + `<path d="M${x - 23} ${top - 10}V${top}M${x + 23} ${top - 10}V${top}M${x - 23} ${top + 6}V${foot}M${x + 23} ${top + 6}V${foot}" stroke="${S.benchLeg}" stroke-width="3.5"/>`;
  return depth(ctx, 4, body, `<rect x="${x - 29}" y="${top - 14}" width="58" height="20"/>`);
}

/**
 * The laundry basket (0-4's box perch, C9; #106): a woven wicker tub on its ledge, its rim at the
 * perch node `top` so Mocha's in-box frame (his head and paws, cut flat at the rim) sits on it; a
 * striped towel hangs over the front edge and a sock peeks out at the back.
 */
export function laundryBasket(ctx: KitCtx, x: number, top: number, foot: number): string {
  const w0 = 38;
  const w1 = 31;
  const y0 = top + 4;
  const h = Math.max(30, foot - y0);
  const at = (t: number) => w0 + (w1 - w0) * t;
  const tub = `M${x - w0} ${y0}L${x + w0} ${y0}L${x + w1} ${y0 + h}L${x - w1} ${y0 + h}Z`;
  let weave = '';
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const y = y0 + h * t;
    weave += `M${f1(x - at(t))} ${f1(y)}L${f1(x + at(t))} ${f1(y)}`;
  }
  let stakes = '';
  for (let i = -3; i <= 3; i++) stakes += `M${f1(x + (i * w0) / 3.6)} ${y0 + 4}L${f1(x + (i * w1) / 3.6)} ${f1(y0 + h - 2)}`;
  const body = `<path d="M${x + 12} ${top + 1}q6 -9 13 -5q3 3 -2 7z" fill="${C.printLilac}"/>`
    + `<path d="${tub}" fill="${ref(ctx, 'wood')}"/>`
    + `<path d="${stakes}" stroke="${S.woodDark}" stroke-width="2" opacity=".45"/>`
    + `<path d="${weave}" stroke="${S.woodLight}" stroke-width="3.2" opacity=".85"/>`
    + `<path d="${weave}" stroke="${S.woodDark}" stroke-width=".8" opacity=".5" transform="translate(0 2)"/>`
    + `<rect x="${x - w0 - 3}" y="${top - 2}" width="${(w0 + 3) * 2}" height="9" rx="4.5" fill="${S.woodLight}"/>`
    + `<path d="M${x - w0 - 1} ${top - 1.5}h${(w0 + 1) * 2}" stroke="${C.cutRim}" stroke-width="1" opacity=".75"/>`
    // The towel over the front edge, a little left of centre
    + `<path d="M${x - 24} ${top + 2}h22l-2 26q-9 4 -19 0z" fill="${S.rugStitch}"/>`
    + `<path d="M${x - 23.5} ${top + 12}h20.5M${x - 22.8} ${top + 18}h19" stroke="${S.rugTop}" stroke-width="2.4"/>`;
  return depth(ctx, 3, body, `<path d="${tub}"/><rect x="${x - w0 - 3}" y="${top - 2}" width="${(w0 + 3) * 2}" height="9"/>`);
}

/**
 * Mocha's empty-perch marker (GDD § 2.1: a faint paw print while Mocha is available). `bold`
 * (長輩模式, § 2.11 "perch markers bolder"; #104): a larger paw with an ink edge on a stronger halo.
 */
export function perchMark(ctx: KitCtx, x: number, y: number, bold = false): string {
  if (bold) {
    return `<g data-affordance="perch" data-bold="" transform="${translate(x, y - 7)}">${softEllipse(ctx, 0, 3, 27, 8, 'marigold', 0.6)}`
      + `<g stroke="${C.ink}" stroke-width="1.1">${paw(C.chalk, 1.4)}</g></g>`;
  }
  // An ink hairline round the chalk paw keeps it readable on any art, cream paper included (#183:
  // 1-1's rack paw vanished on the cream map)
  return `<g data-affordance="perch" transform="${translate(x, y - 6)}">${softEllipse(ctx, 0, 2, 22, 7, 'marigold', 0.45)}`
    + `<g stroke="${C.ink}" stroke-width=".9" stroke-opacity=".85">${paw(C.chalk, 1.15)}</g></g>`;
}

/** A baby's footprint, toes up (+y is the heel): a sole and four toes, centred on the origin. */
function babyFoot(fill: string, s = 1, mirror = false): string {
  const m = mirror ? -1 : 1;
  const toe = (x: number, y: number, r: number) => `<circle cx="${f1(x * s * m)}" cy="${f1(y * s)}" r="${f1(r * s)}"/>`;
  return `<g fill="${fill}"><ellipse cy="${f1(1.4 * s)}" rx="${f1(3.4 * s)}" ry="${f1(4.8 * s)}"/>`
    + toe(-2.6, -4.6, 1.5) + toe(-0.4, -5.6, 1.15) + toe(1.6, -5.2, 1) + toe(3.2, -4, 0.9) + `</g>`;
}

/**
 * Linked mode's floor marker (一起, GDD § 2.4, #128): where a tap leads them both — Mocha's chalk
 * paw and a baby's footprint side by side on a soft marigold halo, laid flat on the floor
 * (`data-affordance="floor"`: like a perch's paw, an affordance, so it may wear marigold). Centred
 * on the node's floor point (x, y); `bold` for 長輩模式.
 */
export function floorMark(ctx: KitCtx, x: number, y: number, bold = false): string {
  const k = bold ? 1.25 : 1;
  return `<g data-affordance="floor"${bold ? ' data-bold=""' : ''} transform="${translate(x, y - 6)}">${softEllipse(ctx, 0, 2, 24 * k, 8 * k, 'marigold', bold ? 0.6 : 0.45)}`
    + `<g transform="scale(1 .62)" stroke="${C.ink}" stroke-width="${bold ? 1.1 : 0.9}" stroke-opacity=".85">`
    + `<g transform="translate(${f1(-7 * k)} 0)">${paw(C.chalk, 1.05 * k)}</g>`
    + `<g transform="translate(${f1(8 * k)} 1)">${babyFoot(C.chalk, 1.05 * k, true)}</g></g></g>`;
}

/**
 * One of his first footprints (§ 2.5 第一步, #128), a soft print on the floor where a walk step put
 * his foot down: left or right of the line he walks, laid flat. Centred on (x, y).
 */
export function firstFootprint(x: number, y: number, left: boolean, opacity: number): string {
  return `<g data-footprint="" transform="${translate(x, y)} scale(1.5 .8)" opacity="${f2(opacity)}">${babyFoot(C.inkSoft, 1, left)}</g>`;
}

/** The track pit a carriage runs in, from its level down to the floor page's front edge. */
export function trackPit(c: Carriage): string {
  if (c.gap === null) return '';
  const [x0, x1] = c.gap;
  const y = c.y + 6;
  const spread = (FLOOR_BOTTOM - y) * 0.06;
  let sleepers = '';
  for (let i = 0; i < 7; i++) {
    const yy = y + 14 + i * i * 3.4 + i * 10;
    if (yy > FLOOR_BOTTOM - 4) break;
    const k = (yy - y) / (FLOOR_BOTTOM - y);
    sleepers += `M${f1(x0 + 14 - spread * k)} ${f1(yy)}H${f1(x1 - 14 + spread * k)}`;
  }
  return `<path d="M${x0} ${y}H${x1}L${f1(x1 + spread)} ${FLOOR_BOTTOM}H${f1(x0 - spread)}Z" fill="${S.pit}" opacity=".9"/>`
    + `<path d="${sleepers}" stroke="${S.sleeper}" stroke-width="3"/>`
    + `<path d="M${x0 + 20} ${y + 2}L${f1(x0 + 20 - spread * 0.9)} ${FLOOR_BOTTOM}M${x1 - 20} ${y + 2}L${f1(x1 - 20 + spread * 0.9)} ${FLOOR_BOTTOM}" stroke="${S.rail}" stroke-width="2"/>`;
}

/**
 * A carriage card (the train a tab moves): `w` wide, its top at the origin, the nose toward +x
 * (`dir` −1 mirrors). Drawn once; the view slides it with the part's tween.
 */
export function carriage(ctx: KitCtx, w: number, dir: 1 | -1, linked: boolean): string {
  const h = LEDGE_DEPTH - 2;
  const body = `M0 -4H${w - 16}q14 0 18 14V${h}H0Z`;
  const windows = Array.from({ length: Math.max(1, Math.floor((w - 40) / 26)) }, (_, i) => `M${12 + i * 26} 4h18v16h-18Z`).join('');
  const art = depth(ctx, 3, `<path d="${body}" fill="${ref(ctx, 'carriage')}"/>`
    + `<rect x="0" y="28" width="${w + 2}" height="9" fill="${S.carriageStripe}"/>`
    + `<path d="${windows}" fill="${ref(ctx, 'window')}"/><path d="M${w - 12} 2q8 2 10 14h-12z" fill="${S.carriageNose}"/>`
    + `<path d="M0 -3.5H${w - 16}" stroke="${C.cutRim}" stroke-width="1" opacity=".7"/>`, `<path d="${body}"/>`)
    + (linked ? brad(ctx, w - 30, h - 9, 4.5, true) : '');
  return dir === 1 ? art : `<g transform="translate(${w} 0) scale(-1 1)">${art}</g>`;
}

// ——— Creatures and small things (the characters are baked sprites, #94: `src/popup/sprites/`) ———

/** A creature stand-in (bible § 5: origami): a folded paper pigeon, feet at the origin, facing +x. */
export function origamiBird(ctx: KitCtx): string {
  const body = `M-18 -6L-4 -16L4 -10L12 -18L10 -6L0 0Z`;
  return softEllipse(ctx, -2, 1, 12, 2.5, 'shadow', 0.4)
    + depth(ctx, 4, `<path d="${body}" fill="${S.pigeon}"/><path d="M-4 -16L0 0L4 -10Z" fill="${S.pigeonShade}"/><path d="M10 -6l6 -2l-5 4z" fill="${S.pigeonBeak}"/><circle cx="7" cy="-10" r=".9" fill="${C.ink}"/>`, `<path d="${body}"/>`);
}

/**
 * The 土地公 peeking (the per-page secret sticker): a round face with a long white beard and kind
 * eyes under the chapter's hat (GDD § 5.1: each chapter dresses him). `''` is his own red 員外帽
 * with an ochre band (the prologue); `站務帽` is chapter 1's navy station cap with a peak and a
 * foil badge (#108); `斗笠` is chapter 2's wide straw hat (#114) with his 掃把 on his shoulder (#115);
 * `藍色校工帽` is chapter 3's blue campus janitor's cap with a short peak (#116); `算命墨鏡` is chapter 4's
 * fortune-teller's round dark glasses in gold wire under his red 員外帽 (#118, #119); `鴨舌帽` is chapter 5's
 * night-market duck-bill cap, worn peak forward (#121); `機場背心` is chapter 6's apron crew's safety
 * vest, under his red 員外帽 (#123); `叢林帽` is chapter 7's khaki jungle hat (a zookeeper's pith
 * helmet, its brim all round and a leaf-green band; #125); `毛巾` is chapter 8's folded white bath towel on
 * his head, the way the hot-spring 阿伯 wear it (#129).
 */
export function tudigong(ctx: KitCtx, hat = ''): string {
  const face = `<circle r="7.5" fill="${S.skin}"/>`
    + `<path d="M-6.4 1.5q-.6 9 6.4 11q7 -2 6.4 -11q-2 3.4 -6.4 3.4q-4.4 0 -6.4 -3.4z" fill="${C.standeeCard}"/>`
    + `<path d="M-4.6 -1.2q1.6 -1.2 3 0M1.6 -1.2q1.6 -1.2 3 0" stroke="${C.standeeCard}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`
    + `<path d="M-3.6 .9q.9 .8 1.8 0M1.8 .9q.9 .8 1.8 0" stroke="${C.ink}" stroke-width=".9" stroke-linecap="round" fill="none"/>`
    + `<circle cx="-4.6" cy="3" r="1.3" fill="${S.blush}" opacity=".7"/><circle cx="4.6" cy="3" r="1.3" fill="${S.blush}" opacity=".7"/>`;
  // Chapter 5's 鴨舌帽 (#121; #122): a night-market duck-bill cap worn peak forward — a two-tone crown
  // (a cream front panel, a vermilion back), a button on top, a long dark peak jutting out
  const cap = hat === '毛巾'
    // Chapter 8's 毛巾 (#129): a white bath towel folded flat on his head, a blue stripe at its end
    ? `<path d="M-8.6 -2.6Q-9 -9.4 0 -9.6Q9 -9.4 8.6 -2.6Z" fill="${C.standeeCard}"/><path d="M-9.4 -5.4H9.4V-2.4H-9.4Z" fill="${C.washi}"/>`
      + `<path d="M5.6 -5.4V-2.4" stroke="${C.wordBeep}" stroke-width="1.4"/><path d="M-6 -8q3 -1.4 6 -1.2" stroke="${C.cutRim}" stroke-width=".8" fill="none" opacity=".7"/>`
    : hat === '叢林帽'
    // Chapter 7's 叢林帽 (#125): a khaki pith helmet — a domed crown, a brim all round, a leaf-green band
    ? `<path d="M-12.6 -2.2Q0 1.4 12.6 -2.2Q11 -.4 0 .4Q-11 -.4 -12.6 -2.2Z" fill="${C.corrugatedDark}"/>`
      + `<path d="M-8.4 -2.6q0 -8.6 8.4 -8.6q8.4 0 8.4 8.6z" fill="${C.corrugatedLight}"/><path d="M-8.4 -3.4h16.8v1.6h-16.8z" fill="${C.quiltLeaf}"/>`
      + `<path d="M-4.6 -8.6q2 -1.8 4.4 -2" stroke="${C.chalk}" stroke-width=".8" fill="none" opacity=".6"/><circle cx="0" cy="-11" r="1" fill="${C.corrugatedDark}"/>`
    : hat === '鴨舌帽'
    ? `<path d="M-7.8 -2.2q0 -7.8 7.8 -7.8q7.8 0 7.8 7.8z" fill="${C.hatRed}"/><path d="M-1.6 -9.8q5.4 .4 7.6 5.6l1.8 2h-9.4z" fill="${C.washi}"/>`
      + `<path d="M3.6 -2.6q8.4 -1.4 13.4 1.6q-5.6 2 -13.4 1.2z" fill="${C.printDark}"/><path d="M-8 -2.4h12" stroke="${C.peonyDeep}" stroke-width="1.4"/>`
      + `<circle cx="-.4" cy="-10" r="1.3" fill="${C.printDark}"/><path d="M-5 -8q1.4 -1.6 3 -2" stroke="${C.cutRim}" stroke-width=".8" fill="none" opacity=".6"/>`
    : hat === '藍色校工帽'
    ? `<path d="M-7.6 -2.6q0 -7 7.6 -7q7.6 0 7.6 7z" fill="${C.wordBeep}"/><path d="M-8 -3.4h16v2h-16z" fill="${C.nightCardDeep}"/>`
      + `<path d="M4 -2.4q6 -.4 9.4 1.6l-9.4 .8z" fill="${C.nightCardDeep}"/><circle cx="0" cy="-9.4" r="1.2" fill="${C.nightCardDeep}"/>`
    : hat === '斗笠'
    ? `<path d="M-14 -2.2L0 -12.4L14 -2.2Q0 .6 -14 -2.2Z" fill="${C.corrugatedLight}"/><path d="M-7 -7.2L7 -7.2M-10.4 -4.6L10.4 -4.6" stroke="${C.corrugatedDark}" stroke-width=".8" opacity=".7"/>`
      + `<path d="M-14 -2.2Q0 .6 14 -2.2" stroke="${C.corrugatedDark}" stroke-width="1.2" fill="none"/><circle cx="0" cy="-12.2" r="1.3" fill="${C.corrugatedDark}"/>`
    : hat === '站務帽'
    ? `<path d="M-7.6 -2.4q0 -7.2 7.6 -7.2q7.6 0 7.6 7.2z" fill="${T.capNavy}"/><path d="M-8.6 -2.6h17.2l-1 2.2h-15.2z" fill="${C.printDark}"/>`
      + `<path d="M-9.4 -.8q4 2.6 9.4 2.6" stroke="${C.printDark}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="0" cy="-5.6" r="1.7" fill="${ref(ctx, 'foil')}"/>`
    : `<path d="M-7 -2a7.5 7.5 0 0 1 14 0z" fill="${C.hatRed}"/><rect x="-8.5" y="-3.5" width="17" height="3" rx="1.5" fill="${C.ochre}"/>`
      + `<path d="M-9.6 -3.2q-2.4 -1 -3 1.4M9.6 -3.2q2.4 -1 3 1.4" stroke="${C.printDark}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
  // Chapter 2's 掃把 (#115): a bamboo broom on his shoulder, its handle up past his hat, the bristles fanned below
  const broom = hat === '斗笠'
    ? `<path d="M17 -18L8 9" stroke="${C.corrugatedDark}" stroke-width="1.8" stroke-linecap="round"/>`
      + `<path d="M8 7L3 19L16 16Z" fill="${C.corrugatedLight}"/><path d="M8 8L6 18M9 8L10 17M10 8L13 16" stroke="${C.corrugatedDark}" stroke-width=".6" opacity=".8"/>`
      + `<path d="M5 8.5L11 10" stroke="${C.hatRed}" stroke-width="1.6"/>`
    : '';
  // Chapter 4's 算命墨鏡 (#118; gold wire rims #119): a fortune-teller's round dark glasses over his own red 員外帽
  const shades = hat === '算命墨鏡'
    ? `<path d="M-1.4 -.4h2.8" stroke="${C.printDark}" stroke-width="1"/><circle cx="-3.6" cy="-.2" r="2.6" fill="${C.ink}" stroke="${C.goldDeep}" stroke-width=".6"/><circle cx="3.6" cy="-.2" r="2.6" fill="${C.ink}" stroke="${C.goldDeep}" stroke-width=".6"/>`
      + `<path d="M-4.6 -1.4l1 -.6M2.6 -1.4l1 -.6" stroke="${C.standeeCard}" stroke-width=".7" stroke-linecap="round" opacity=".8"/>`
    : '';
  // Chapter 6's 機場背心 (#123): an apron crew's safety vest over his shoulders, under the beard — an
  // ochre yoke with a reflective chalk band (never marigold: that is the touchables' card)
  const vest = hat === '機場背心'
    ? `<path d="M-10 16q0 -8 6 -9.4l4 3.4l4 -3.4q6 1.4 6 9.4z" fill="${C.ochre}"/><path d="M-9.6 13.4h19.2" stroke="${C.chalk}" stroke-width="1.6"/>`
      + `<path d="M0 10v6" stroke="${C.ochreDark}" stroke-width=".8"/>`
    : '';
  return depth(ctx, 2, broom + vest + face + shades + cap, `<circle r="7.5"/>${vest === '' ? '' : '<path d="M-10 16q0 -8 6 -9.4h8q6 1.4 6 9.4z"/>'}`);
}

/** A light attractor where it lies: a little paper star lamp. */
const lampIcon = `<path d="M0 -10l2.6 6.4l6.9 .5l-5.3 4.4l1.7 6.7l-5.9 -3.7l-5.9 3.7l1.7 -6.7l-5.3 -4.4l6.9 -.5z" fill="${C.lamp}" stroke="${C.lampAmber}" stroke-width="1"/>`;

/**
 * A light attractor that follows a part (`nodeBy`: 2-2's spotlight, #114): a pool of lamplight on
 * the floor under a faint beam, so the light reads as a place he can sit in, not a thing to grab.
 * The origin is the floor point the light is aimed at.
 */
export function spotPool(ctx: KitCtx, from?: readonly [number, number]): string {
  // The beam: from the lamp (`from`, relative to the pool; #115: 2-2's follow-spot) or straight down from above
  const beam = from === undefined
    ? `<path d="M-6 -150L6 -150L30 6L-30 6Z" fill="${C.lamp}" opacity=".16"/>`
    : (() => {
      const [fx, fy] = from;
      const len = Math.hypot(fx, fy) || 1;
      const [nx, ny] = [-fy / len, fx / len];
      // Narrow at the lens, as wide as the pool where it lands (the pool is an ellipse on the floor)
      const [a, b] = fx < 0 ? [[-26, 4], [26, 8]] : [[26, 4], [-26, 8]];
      return `<path d="M${f1(fx + nx * 5)} ${f1(fy + ny * 5)}L${f1(fx - nx * 5)} ${f1(fy - ny * 5)}L${a[0]} ${a[1]}L${b[0]} ${b[1]}Z" fill="${C.lamp}" opacity=".18"/>`;
    })();
  return beam
    + softEllipse(ctx, 0, 6, 34, 10, 'lamp', 0.75, 'blur8')
    + `<ellipse cx="0" cy="6" rx="24" ry="6" fill="${C.lamp}" opacity=".62"/>`;
}

/**
 * A **decoy** where it lies (GDD § 2.2.1: a shiny he can never grab; #116): drawn as itself, never
 * as a bead and never in the bead's cup of light, so the player can tell it from the goal. By its
 * art key: `c3/moon` the moon's reflection on the water (a foil ellipse under glassine ripples, its
 * origin on the water), `c3/bell` the brass 傅鐘 (origin at its crown), `c3/glasses` reading glasses
 * (origin at the bridge); `c5/phone` 5-1's glowing phone and `c5/griddle` 5-6's shining griddle (#121,
 * drawn in the market kit by #122); `c7/panda-sign` 7-1's lit panda sign over the platform (#125; drawn in the
 * chapter's kit by #126); `c8/stained-glass` 8-1's stained-glass window in the hot-spring car (#129;
 * drawn in the chapter's kit by #130); any other key a cold silver glint. Drawn in the campus kit by #117.
 */
export function decoyArt(ctx: KitCtx, key?: string): string {
  const glint = (x: number, y: number, r: number) => sparkle(ctx, x, y, r);
  switch (key) {
    case 'c3/moon':
      // The moon's reflection (#117): foil slivers broken by the ripples, under glassine, a vellum glow
      return softEllipse(ctx, 0, 0, 30, 9, 'lamp', 0.24, 'blur8')
        + `<ellipse rx="18" ry="5.6" fill="${ref(ctx, 'foil')}"/><ellipse rx="18" ry="5.6" fill="${C.glassine}" opacity=".35"/>`
        + `<path d="M-19 -1.4h38M-16 2.4h32" stroke="${C.glassineDeep}" stroke-width="1.3" opacity=".9"/>`
        + `<ellipse cx="-3" cy="8.4" rx="11" ry="1.8" fill="${ref(ctx, 'foil')}" opacity=".7"/><ellipse cx="4" cy="12.6" rx="6" ry="1.2" fill="${ref(ctx, 'foil')}" opacity=".45"/>`
        + `<path d="M-32 6q8 -3 16 0M16 7q8 -3 16 0M-24 -8q6 -2 12 0M12 -9q6 -2 12 0" stroke="${C.vellum}" stroke-width="1" fill="none" opacity=".6"/>`
        + glint(20, -12, 3.6);
    case 'c3/bell': {
      // 傅鐘's brass bell (#117): its crown loop, the shoulder and lip bands, an inscription panel
      const bell = 'M-12 22Q-12 2 -7 -2Q-4 -5 0 -5Q4 -5 7 -2Q12 2 12 22Q14 24 14 26H-14Q-14 24 -12 22Z';
      return depth(ctx, 4, `<path d="${bell}" fill="${ref(ctx, 'foil')}"/><path d="M4 -3Q10 2 10 22L13 26H6Q7 8 4 -3Z" fill="${C.goldDeep}" opacity=".55"/>`
        + `<path d="M-6 0Q-9 8 -9 20" stroke="${C.goldLight}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/>`
        + `<path d="M-9 3H9M-12 19H12M-13 23H13" stroke="${C.goldDeep}" stroke-width="1.2"/><rect x="-4" y="7" width="8" height="9" rx="1" fill="none" stroke="${C.goldDeep}" stroke-width=".9"/>`
        + `<circle cy="-8" r="3.4" fill="none" stroke="${C.goldDeep}" stroke-width="2"/>`
        + `<circle cy="28" r="3" fill="${C.goldDeep}"/>`, `<path d="${bell}"/>`)
        + glint(-18, 2, 4.4) + glint(17, 14, 3.4);
    }
    case 'c3/glasses':
      // 藍教授's round reading glasses (#117): fine gold wire, glassine lenses catching the light
      return `<path d="M-3 0q3 -3 6 0M-13.6 -1l-4 -2.4M13.6 -1l4 -2.4" stroke="${C.goldDeep}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
        + `<circle cx="-8" r="5.6" fill="${C.glassine}" fill-opacity=".55" stroke="${C.goldDeep}" stroke-width="1.5"/><circle cx="8" r="5.6" fill="${C.glassine}" fill-opacity=".55" stroke="${C.goldDeep}" stroke-width="1.5"/>`
        + `<path d="M-10.4 -2.6l2.6 -1.2M5.6 -2.6l2.6 -1.2" stroke="${C.foilShine}" stroke-width="1.4" stroke-linecap="round"/>`
        + glint(16, -9, 3.6);
    case 'c4/ad-screen': {
      // 4-1's ad screen over the seats (#119): a slim LED panel in a steel frame playing a neon ad — a
      // pink heart bursting over a cyan wave, a ticker line. Within ±18 units: in his bubble it sits
      // beside 「要！」 (R5 contrast)
      const panel = 'M-18 -12H18V12H-18Z';
      return depth(ctx, 3, `<path d="${panel}" fill="${C.printDark}"/><rect x="-16" y="-10" width="32" height="17" fill="${C.nightCardDeep}"/>`
          + `<path d="M-16 4q4 -4 8 0t8 0t8 0t8 0V7H-16Z" fill="${C.neonCyan}" opacity=".8"/>`
          + `<path d="M-3 -1.6q-4 -3 -4 -5.4q0 -2.6 2.4 -2.6q1.6 0 1.6 1.6q0 -1.6 1.6 -1.6q2.4 0 2.4 2.6q0 2.4 -4 5.4z" fill="${C.neonPink}"/>`
          + `<path d="M6 -7h7M6 -4h5" stroke="${C.foilShine}" stroke-width="1.2" stroke-linecap="round"/>`
          + `<rect x="-14" y="8.6" width="20" height="1.6" rx=".8" fill="${C.neonPink}" opacity=".8"/>`, `<path d="${panel}"/>`)
        + `<path d="M-17 -11.2H17" stroke="${C.cutRim}" stroke-width=".7" opacity=".4"/>` + glint(16, -14, 3.6);
    }
    case 'c4/boombox-shine':
      // 4-5's boombox, playing on its speaker stack (#119): the same boombox the baked part draws silent
      return `<g transform="scale(.92)">${boomboxBody(ctx, true)}</g>` + glint(-18, -14, 3.6) + glint(18, -16, 4);
    case 'c4/disco-ball': {
      // 4-6's disco ball (#119): a mirrored ball on its chain, its facets a mosaic of foil and glassine
      const id = ctx.id('discoClip');
      let tiles = '';
      for (let y = -15; y < 15; y += 4) for (let x = -15 + ((y + 15) % 8 ? 2 : 0); x < 15; x += 4) if ((x * 7 + y * 3) % 5 === 0) tiles += `M${x} ${y}h3v3h-3z`;
      return `<path d="M0 -40V-15" stroke="${C.printDark}" stroke-width="1.4"/><clipPath id="${id}"><circle r="15"/></clipPath>`
        + `<circle r="15" fill="${C.printLilac}"/><circle cx="4" cy="5" r="11" fill="${C.printLilacDeep}" opacity=".5"/><g clip-path="url(#${id})"><path d="${tiles}" fill="${C.foilShine}" opacity=".9"/>`
        + `<path d="M-15 -11H15M-15 -7H15M-15 -3H15M-15 1H15M-15 5H15M-15 9H15M-15 13H15M-11 -15V15M-7 -15V15M-3 -15V15M1 -15V15M5 -15V15M9 -15V15M13 -15V15" stroke="${C.printLilacDeep}" stroke-width=".5" opacity=".7"/></g>`
        + `<circle r="15" fill="none" stroke="${C.printLilacDeep}" stroke-width="1"/><ellipse cx="-5" cy="-6" rx="4" ry="3" fill="${C.foilShine}" opacity=".8"/>`
        + glint(-20, -10, 4) + glint(18, 12, 3.4);
    }
    case 'c5/phone': {
      // 5-1's phone in a dozing passenger's lap (#122): a dark handset tilted in the dark car, its
      // screen glowing cold — a cartoon playing, a progress bar — throwing its light up round it. Within ±18 units
      const body = 'M-9 -16H9Q12 -16 12 -13V13Q12 16 9 16H-9Q-12 16 -12 13V-13Q-12 -16 -9 -16Z';
      return softEllipse(ctx, 0, -4, 26, 24, 'lamp', 0.12, 'blur8')
        + `<g transform="rotate(-10)">` + depth(ctx, 3, `<path d="${body}" fill="${C.printDark}"/><rect x="-9.6" y="-12.6" width="19.2" height="23" rx="1.6" fill="${C.neonCyan}" opacity=".9"/>`
          + `<circle cx="-2" cy="-4" r="4.4" fill="${C.neonPink}" opacity=".85"/><circle cx="-3.4" cy="-5" r=".9" fill="${C.ink}"/><circle cx="-.4" cy="-5" r=".9" fill="${C.ink}"/>`
          + `<path d="M3 -2l5 3l-5 3z" fill="${C.chalk}"/><rect x="-7" y="6.4" width="14" height="1.6" rx=".8" fill="${C.nightCardDeep}" opacity=".6"/>`
          + `<rect x="-7" y="6.4" width="6" height="1.6" rx=".8" fill="${C.neonPink}"/><path d="M-8 -11l6 -1" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<path d="${body}"/>`) + `</g>`
        + glint(15, -14, 3.6);
    }
    case 'c5/griddle': {
      // 5-6's griddle on the counter (#122): the 蔥抓餅 stall's round steel plate seen from the
      // front on its gas ring, oiled and shining, a ring of blue flame under it, the sizzle. Within ±18 units
      return softEllipse(ctx, 0, 0, 24, 12, 'lamp', 0.16, 'blur8')
        + depth(ctx, 3, `<path d="M-14 4l-3 7h34l-3 -7z" fill="${C.printDark}"/><ellipse rx="19" ry="7" fill="${C.printDark}"/><ellipse cy="-1.4" rx="17" ry="5.8" fill="${C.printLilac}"/><ellipse cx="3" cy="-.6" rx="12" ry="4" fill="${C.printLilacDeep}" opacity=".45"/>`
          + `<ellipse cx="-5" cy="-2.4" rx="7" ry="2" fill="${C.foilShine}" opacity=".75"/><path d="M6 -3.6q4 -.8 7 .6" stroke="${C.foilShine}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`
          + `<path d="M-10 8l1 -2l1 2M-2 8l1 -2l1 2M6 8l1 -2l1 2" stroke="${C.neonCyan}" stroke-width="1" fill="none"/>`, `<ellipse rx="19" ry="7"/>`)
        + `<path d="M-8 -9q-2 -4 0 -7t0 -7M0 -10q-2 -4 0 -7t0 -7M8 -9q-2 -4 0 -7t0 -7" stroke="${C.vellum}" stroke-width="1.2" fill="none" opacity=".7" stroke-linecap="round"/>`
        + glint(-19, -10, 3.6) + glint(18, -7, 3.2);
    }
    case 'c7/panda-sign': {
      // 7-1's panda sign over the platform (#125; drawn in the chapter's kit by #126): the zoo's lit
      // lightbox in a green steel frame — a panda's face (white card, black ear and eye patches, a
      // bamboo sprig) over 「熊貓館」 — glittering. Within ±18 units (it sits in his bubble)
      const box = 'M-18 -14H18V14H-18Z';
      return softEllipse(ctx, 0, 0, 28, 20, 'lamp', 0.18, 'blur8')
        + depth(ctx, 3, `<path d="${box}" fill="${MK.keeperGreen}"/><rect x="-16" y="-12" width="32" height="24" rx="1.4" fill="${C.lamp}"/>`
          + `<path d="M-11 -5.6a3.6 3.6 0 1 1 5 -3.2M11 -5.6a3.6 3.6 0 1 0 -5 -3.2" fill="${C.ink}"/>`
          + `<ellipse cx="0" cy="-1" rx="9.6" ry="8.4" fill="${MK.panda}"/>`
          + `<ellipse cx="-4" cy="-2" rx="2.6" ry="3.2" fill="${C.ink}" transform="rotate(-24 -4 -2)"/><ellipse cx="4" cy="-2" rx="2.6" ry="3.2" fill="${C.ink}" transform="rotate(24 4 -2)"/>`
          + `<circle cx="-3.6" cy="-2.4" r=".8" fill="${C.cutRim}"/><circle cx="4.4" cy="-2.4" r=".8" fill="${C.cutRim}"/><ellipse cx="0" cy="2.4" rx="1.6" ry="1.1" fill="${C.ink}"/>`
          + `<path d="M12 -10v16M12 -6l4 -2M12 0l-4 -2" stroke="${MK.tea}" stroke-width="1.4" stroke-linecap="round"/>`
          + `<rect x="-16" y="7" width="32" height="5" fill="${MK.keeperGreen}"/>`
          + `<text data-art-text="" x="0" y="11.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="4.6" fill="${C.washi}">熊貓館</text>`, `<path d="${box}"/>`)
        + glint(17, -15, 3.8) + glint(-17, 12, 3);
    }
    case 'c8/stained-glass': {
      // 8-1's stained-glass window in the hot-spring car (#129; drawn in the chapter's kit by #130): an
      // arched window of coloured glassine in its cedar leading — a moon over 北投's hills, a teal
      // spring with its steam curling up — lamplight glittering through it. Within ±18 units
      const arch = 'M-14 14V-4Q-14 -18 0 -18Q14 -18 14 -4V14Z';
      const inner = 'M-11 12V-4Q-11 -15 0 -15Q11 -15 11 -4V12Z';
      return softEllipse(ctx, 0, 0, 26, 22, 'lamp', 0.2, 'blur8')
        + depth(ctx, 3, `<path d="${arch}" fill="${BT.cedarDeep}"/><path d="${inner}" fill="${C.printLilac}"/>`
          + `<circle cx="4" cy="-8" r="3.4" fill="${C.lamp}"/>`
          + `<path d="M-11 0L-4 -6L2 -2L11 -7V12H-11Z" fill="${BT.roofGreen}"/><path d="M-11 5Q0 1 11 5V12H-11Z" fill="${BT.tealLight}"/>`
          + `<path d="M-4 4q-2 -3 0 -6t0 -5M2 4q-2 -3 0 -6" stroke="${C.washi}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
          + `<path d="M0 -15V12M-11 0H11M-11 6H11" stroke="${BT.cedarDeep}" stroke-width="1.2"/>`
          + `<path d="${inner}" fill="${C.glassine}" opacity=".18"/><path d="M-9 10L-2 -12" stroke="${C.cutRim}" stroke-width="1.4" opacity=".5"/>`, `<path d="${arch}"/>`)
        + glint(15, -14, 3.8) + glint(-15, 10, 3);
    }
    default:
      return softEllipse(ctx, 0, 0, 16, 16, 'lamp', 0.16, 'blur8') + `<circle r="7" fill="${C.glassine}" stroke="${C.moonRim}" stroke-width="1.2"/>`
        + `<circle cx="-2.4" cy="-2.4" r="2" fill="${C.foilShine}"/>` + glint(12, -10, 3.6);
  }
}

/** The goal and other attractors where they lie (bead for shinies; simple paper icons otherwise). */
export function attractorArt(ctx: KitCtx, kind: Kind): string {
  if (kind === 'shiny') {
    const r = 9;
    return softEllipse(ctx, 0, 0, r * 3, r * 3, 'foil', 0.26, 'blur8') + softEllipse(ctx, 0, r + 3, r * 1.2, r * 0.3, 'shadow', 0.45)
      + depth(ctx, 4, `<circle r="${r}" fill="${ref(ctx, 'foil')}"/>`, `<circle r="${r}"/>`)
      + `<circle cx="-3.2" cy="-3.4" r="2.7" fill="${C.foilShine}"/>`
      + sparkle(ctx, -17, -14, 6) + sparkle(ctx, 16, -20, 4.5);
  }
  return depth(ctx, 4, kind === 'light' ? lampIcon : bubbleIcon(ctx, kind), `<circle r="10"/>`);
}

/**
 * The thought bubble's icons (GDD § 2.2.1, bible § 5): paper-style shapes, never colour alone — a
 * foil bead with a sparkle (shiny), Mocha's head (with ears), a milk bottle (snack), a music note
 * (light). Centred on the origin, about 22 units across.
 */
export function bubbleIcon(ctx: KitCtx, kind: Kind | 'mocha'): string {
  switch (kind) {
    case 'shiny':
      return `<circle r="9" fill="${ref(ctx, 'foil')}" stroke="${C.goldDeep}" stroke-width=".8"/><circle cx="-3" cy="-3" r="2.6" fill="${C.foilShine}"/>`
        + `<path d="M10 -15l1.6 4.4l4.4 1.6l-4.4 1.6l-1.6 4.4l-1.6 -4.4l-4.4 -1.6l4.4 -1.6z" fill="${C.goldDeep}"/>`;
    case 'mocha':
      return `<path d="M-9 -3L-8 -13L-3 -8ZM3 -8L8 -13L9 -3Z" fill="${S.catFur}"/><circle r="9" fill="${S.catFur}"/><circle cx="-3.4" cy="-1" r="1.6" fill="${S.catEye}"/><circle cx="3.4" cy="-1" r="1.6" fill="${S.catEye}"/><path d="M-1.2 2h2.4l-1.2 1.5z" fill="${S.catNose}"/>`;
    case 'snack':
      return `<rect x="-6" y="-8" width="12" height="17" rx="4" fill="${C.vellum}" stroke="${C.inkSoft}" stroke-width=".8"/><rect x="-4" y="-13" width="8" height="6" rx="2" fill="${S.rugTop}"/><path d="M-6 0h12" stroke="${S.rugLow}" stroke-width="1.4"/>`;
    case 'light':
      return musicNote(0, 0);
  }
}

/** A music note (watching a light; a light's icon), centred on (x, y). */
const musicNote = (x: number, y: number) =>
  `<g transform="${translate(x, y)}"><path d="M-3 8V-10l10 -3v16" stroke="${C.ink}" stroke-width="2" fill="none"/><ellipse cx="-6" cy="8" rx="4" ry="3" fill="${C.ink}"/><ellipse cx="4" cy="5" rx="4" ry="3" fill="${C.ink}"/></g>`;

/** What the thought bubble shows (GDD § 2.2.6). */
export type BubbleShow =
  /**
   * `treasure`: the target is a spread's chapter treasure (#107): its own picture, not the bead;
   * `decoy`: the target is a decoy (#116), drawn as itself by its art key (`decoyArt`)
   */
  | { kind: 'want'; target: Kind | 'mocha'; reach: boolean; treasure?: number; decoy?: string }
  | { kind: 'text'; text: string }
  | { kind: 'cry' }
  | { kind: 'heart' }
  | { kind: 'note' };

/** The serif text in a bubble, centred on (x, y): 「要！」 in red (bible § 5), 「？」 in ink. */
export const bubbleText = (t: string, x: number, y: number, size: number, fill: string) =>
  `<text x="${f1(x)}" y="${f1(y + size * 0.36)}" text-anchor="middle" font-family="'Noto Serif TC', serif" font-weight="900" font-size="${f1(size)}" fill="${fill}">${t}</text>`;

/**
 * What goes inside the thought bubble's cloud (GDD § 2.2.6, bible § 5), centred on the origin of
 * a 92 × 46 cloud: the target's icon; while reaching, the icon and 「要！」 (red serif; the view
 * pulses it); 「？」 while looking; tears while crying; a note while watching; a heart while
 * cuddling, eating, grabbing or done. `tucked` (#197): for the small cloud a beat folds it into.
 */
export function thoughtContent(ctx: KitCtx, show: BubbleShow, tucked = false): string {
  switch (show.kind) {
    case 'want': {
      // A chapter treasure is drawn as itself (about 40 units across: halved to the icons' 22)
      const icon = show.treasure !== undefined ? `<g transform="scale(.56)" data-bubble-treasure="${show.treasure}">${treasureArt(ctx, show.treasure)}</g>`
        : show.decoy !== undefined ? `<g transform="scale(.7)" data-bubble-decoy="${show.decoy}">${decoyArt(ctx, show.decoy || undefined)}</g>`
        : bubbleIcon(ctx, show.target);
      // Tucked (#197): the icon alone, in a cloud the size of a 60 × 40 one (his reaching pose says 「要！」)
      if (tucked) return icon;
      return show.reach
        ? `<g transform="${translate(-22, 0)}">${icon}</g><g data-reach="">${bubbleText('要！', 13, 0, 22, C.sealInk)}</g>`
        : `<g transform="scale(1.25)">${icon}</g>`;
    }
    case 'text':
      return bubbleText(show.text, 0, 0, tucked ? 22 : 26, C.ink);
    case 'cry':
      // Three falling tears (shape, not colour: drops with a highlight)
      return [[-14, -8], [-2, -2], [10, -9]].map(([x, y]) => `<path d="M${x} ${y}q5 9 0 13q-5 -4 0 -13z" fill="${C.moonRim}" stroke="${C.printLilacDeep}" stroke-width="1"/><circle cx="${x - 1.2}" cy="${y + 7}" r="1.1" fill="${C.cutRim}"/>`).join('');
    case 'heart':
      return `<path d="M0 10l-11 -11a6.5 6.5 0 0 1 11 -8a6.5 6.5 0 0 1 11 8z" fill="${S.blush}" stroke="${C.sealDark}" stroke-width="1.2"/>`;
    case 'note':
      return musicNote(0, 0);
  }
}

/** A foreground card for a near corner (bible § 2.2): a paper potted plant, its foot at the origin. */
export function pottedPlant(ctx: KitCtx): string {
  const leaf = (rot: number, len: number) => `<path d="M0 0Q${f1(len * 0.3)} ${f1(-len * 0.5)} 0 ${-len}Q${f1(-len * 0.3)} ${f1(-len * 0.5)} 0 0Z" transform="rotate(${rot})"/>`;
  const leaves = [-38, -18, 0, 20, 40].map((r, i) => leaf(r, 44 + (i % 2) * 14)).join('');
  return depth(ctx, 5, `<g transform="translate(0 -30)" fill="${ref(ctx, 'leaf')}">${leaves}</g>`
    + `<g transform="translate(0 -30)" stroke="${S.leaf}" stroke-width="1" fill="none" opacity=".7"><path d="M0 0V-50M0 0L-24 -40M0 0L24 -40"/></g>`
    + `<path d="M-18 -32h36l-5 32h-26z" fill="${ref(ctx, 'kraft')}"/><rect x="-20" y="-36" width="40" height="7" rx="1.5" fill="${S.woodLight}"/>`,
  `<path d="M-18 -32h36l-5 32h-26z"/><g transform="translate(0 -30)">${leaves}</g>`);
}
