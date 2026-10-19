import { POPUP as C, POPUP_CHAPTER_CLOCK, POPUP_STAGE as S, mixHex, type PopupChapterSky } from '../../../art/palette';
import type { Kind, PageDef } from '../../core/types';
import { PRESET_DEFS, brad, depth, f1, kitDefs, pageBlock, paw, pinholes, ref, scallopBand, seeded, skyline, softEllipse, sparkle, springBubble, translate, type DefName, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorOutline, floorWiden, towardVp } from '../geometry';
import { LEDGE_DEPTH, type Carriage, type LedgeRun, type PerchPost, type Slope } from '../stage';

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

/** The page's `<defs>`: the kit's paints and the stage's own gradients (sky per chapter, materials), scoped by `ctx`. */
export function stageDefs(ctx: KitCtx, sky: PopupChapterSky): string {
  const id = ctx.id;
  return kitDefs(ctx, STAGE_DEFS, [
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

/** Perch furniture: a pillar (high perch) or a bench (a seat), standing on its ledge. */
export function perchPost(ctx: KitCtx, post: PerchPost): string {
  const { x, top, foot } = post;
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

/** Mocha's empty-perch marker (GDD § 2.1: a faint paw print while Mocha is available). */
export function perchMark(ctx: KitCtx, x: number, y: number): string {
  return `<g data-affordance="perch" transform="${translate(x, y - 6)}" opacity=".92">${softEllipse(ctx, 0, 2, 20, 6, 'marigold', 0.32)}${paw()}</g>`;
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

/** The 土地公 peeking (the per-page secret sticker): face, red hat with a gold band, white beard. */
export function tudigong(ctx: KitCtx): string {
  return depth(ctx, 2, `<circle r="7.5" fill="${S.skin}"/><path d="M-7 -2a7.5 7.5 0 0 1 14 0z" fill="${C.hatRed}"/><rect x="-8.5" y="-3.5" width="17" height="3" rx="1.5" fill="${C.gold}"/>`
    + `<path d="M-6 2q6 12 12 0q-2 3 -6 3q-4 0 -6 -3z" fill="${C.standeeCard}"/><circle cx="-2.6" cy="0" r=".9" fill="${C.ink}"/><circle cx="2.6" cy="0" r=".9" fill="${C.ink}"/>`, `<circle r="7.5"/>`);
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
  return depth(ctx, 4, iconArt(ctx, kind), `<circle r="10"/>`);
}

/** The bubble's icon for what he wants (bible § 5: drawn in the paper style). */
function iconArt(ctx: KitCtx, kind: Kind | 'mocha'): string {
  switch (kind) {
    case 'shiny':
      return `<circle r="9" fill="${ref(ctx, 'foil')}"/><circle cx="-3" cy="-3" r="2.6" fill="${C.foilShine}"/>`;
    case 'mocha':
      return `<path d="M-9 -3L-8 -13L-3 -8ZM3 -8L8 -13L9 -3Z" fill="${S.catFur}"/><circle r="9" fill="${S.catFur}"/><circle cx="-3.4" cy="-1" r="1.6" fill="${S.catEye}"/><circle cx="3.4" cy="-1" r="1.6" fill="${S.catEye}"/><path d="M-1.2 2h2.4l-1.2 1.5z" fill="${S.catNose}"/>`;
    case 'snack':
      return `<rect x="-6" y="-8" width="12" height="17" rx="4" fill="${C.vellum}"/><rect x="-4" y="-13" width="8" height="6" rx="2" fill="${S.rugTop}"/><path d="M-6 0h12" stroke="${S.rugLow}" stroke-width="1.4"/>`;
    case 'light':
      return `<path d="M0 -10l2.6 6.4l6.9 .5l-5.3 4.4l1.7 6.7l-5.9 -3.7l-5.9 3.7l1.7 -6.7l-5.3 -4.4l6.9 -.5z" fill="${C.lamp}" stroke="${C.lampAmber}" stroke-width="1"/>`;
  }
}

export type BubbleShow =
  | { kind: 'want'; target: Kind | 'mocha'; reach: boolean }
  | { kind: 'text'; text: string }
  | { kind: 'cry' }
  | { kind: 'heart' }
  | { kind: 'note' };

/**
 * The thought bubble on its spring (GDD § 2.2.6, bible § 5), in baby-local space (his feet at the
 * origin): the spring rises from `head` (the top of his head) to the cloud, `side` (+1 right, −1
 * left) of it so it stays on the page. #98 adds the
 * change-of-mind pop and the spring wobble; this is the static bubble.
 */
export function thoughtBubble(ctx: KitCtx, show: BubbleShow, side: 1 | -1 = 1, head: readonly [number, number] = [side * 8, -68]): string {
  const cx = head[0] + side * 12;
  const cy = head[1] - 74;
  let content: string;
  const text = (t: string, x: number, size = 22, fill: string = C.sealInk) =>
    `<text x="${x}" y="${cy + 8}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${size}" fill="${fill}">${t}</text>`;
  switch (show.kind) {
    case 'want':
      content = show.reach
        ? `<g transform="${translate(cx - 22, cy)}">${iconArt(ctx, show.target)}</g>${text('要！', cx + 12)}`
        : `<g transform="${translate(cx, cy)} scale(1.25)">${iconArt(ctx, show.target)}</g>`;
      break;
    case 'text':
      content = text(show.text, cx, 26, C.ink);
      break;
    case 'cry':
      content = `<path d="M${cx - 14} ${cy - 8}q4 9 0 14q-4 -5 0 -14zM${cx - 4} ${cy - 4}q4 9 0 14q-4 -5 0 -14z" fill="${C.moonRim}" stroke="${C.printLilacDeep}" stroke-width=".8"/>${text('哇', cx + 14)}`;
      break;
    case 'heart':
      content = `<path d="M${cx} ${cy + 9}l-10 -10a6 6 0 0 1 10 -7a6 6 0 0 1 10 7z" fill="${S.blush}" stroke="${C.sealDark}" stroke-width="1"/>`;
      break;
    case 'note':
      content = `<path d="M${cx - 3} ${cy + 8}V${cy - 10}l10 -3v16" stroke="${C.ink}" stroke-width="2" fill="none"/><ellipse cx="${cx - 6}" cy="${cy + 8}" rx="4" ry="3" fill="${C.ink}"/><ellipse cx="${cx + 4}" cy="${cy + 5}" rx="4" ry="3" fill="${C.ink}"/>`;
      break;
  }
  return springBubble(ctx, head[0], head[1], cx, cy, content, { w: 92, h: 46 });
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
