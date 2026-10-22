import { POPUP as C } from '../../../art/palette';
import { f1, fibers, grain, pinholes, ref, seal, seeded, softEllipse, sparkle, translate, washi, type KitCtx } from '../../art';
import type { EnvBox } from '../manifest';
import { SCENE_BOX, dawnScene, shrineScene } from './end';

/**
 * The art outside the pages (#97; popup art bible § 3.1 花布, § 7 UI framing), baked by
 * `npm run bake:popup` like the backdrops: the 花布 quilt the book lies on (the cover screen, the
 * chapter turn), the closed book on 阿嬤's low table (the cover screen) and the folded paper map of
 * the 月亮線 (the 目錄). The screens draw these bitmaps and put their live, readable UI on top.
 *
 * Coordinates are CSS px on a 390-wide phone. Lettering baked in here is part of the picture (the
 * book's foil title); every word the player reads on a screen is live text.
 */

export interface ScreenSource {
  readonly box: EnvBox;
  readonly draw: (ctx: KitCtx) => string;
}

// ——— The 花布 quilt (proof C) ———

/** One peony: three rings of scalloped petals (outer → heart), a stamen and three leaves. */
function peony(x: number, y: number, r: number, rot: number, seed: number): string {
  const rr = seeded(seed);
  let petals = '';
  const rings = [C.peonyDeep, C.peony, C.peonyLight];
  for (let k = 0; k < 3; k++) {
    const R = r * (1 - k * 0.28);
    const n = 7 - k;
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + k * 0.4;
      const b = a + Math.PI / n;
      d += `${i ? 'L' : 'M'}${f1(Math.cos(a) * R * 0.55)} ${f1(Math.sin(a) * R * 0.55)}Q${f1(Math.cos(a + 0.15) * R * 1.1)} ${f1(Math.sin(a + 0.15) * R * 1.1)} ${f1(Math.cos(b) * R * 0.9)} ${f1(Math.sin(b) * R * 0.9)}`;
    }
    petals += `<path d="${d}Z" fill="${rings[k]}"/>`;
  }
  // A pale vein on the outer ring, a printed highlight (the cloth is printed, not painted)
  petals += `<circle r="${f1(r * 0.62)}" fill="none" stroke="${C.peonyLight}" stroke-width="1" stroke-dasharray="2 5" opacity=".7"/>`;
  petals += `<circle r="${f1(r * 0.16)}" fill="${C.peonyHeart}"/>`;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    petals += `<circle cx="${f1(Math.cos(a) * r * 0.24)}" cy="${f1(Math.sin(a) * r * 0.24)}" r="${f1(r * 0.035 + 0.6)}" fill="${C.peonyHeart}"/>`;
  }
  const leaves = [0, 1, 2]
    .map((i) => {
      const a = rot + i * 2.1 + rr();
      const p = (k: number, t: number) => `${f1(Math.cos(t) * r * k)} ${f1(Math.sin(t) * r * k)}`;
      return `<path d="M${p(0.8, a)}q${p(0.7, a + 0.6)} ${p(0.9, a)}q${p(0.1, a - 0.6)} ${f1(-Math.cos(a) * r * 0.9)} ${f1(-Math.sin(a) * r * 0.9)}z" fill="${C.quiltLeaf}"/>`
        + `<path d="M${p(0.8, a)}l${p(0.75, a)}" stroke="${C.quilt}" stroke-width="1" opacity=".5"/>`;
    })
    .join('');
  return `<g transform="${translate(x, y)} rotate(${f1(rot * 57)})">${leaves}${petals}</g>`;
}

/** Peonies across a quilt this size, on a jittered grid so the print repeats like cloth. */
function peonies(w: number, h: number): string {
  const r = seeded(31);
  let out = '';
  let seed = 1;
  for (let row = 0; row * 150 < h + 80; row++) {
    for (let col = 0; col * 150 < w + 80; col++) {
      const x = col * 150 + (row % 2) * 75 + (r() - 0.5) * 40 - 10;
      const y = row * 150 + (r() - 0.5) * 40 + 20;
      out += peony(x, y, 40 + r() * 20, r() * 6.28, seed++);
      // A bud between the blooms
      out += peony(x + 70 + (r() - 0.5) * 20, y + 70 + (r() - 0.5) * 20, 14 + r() * 8, r() * 6.28, seed++);
    }
  }
  return out;
}

/**
 * The 花布 quilt (bible § 3.1): big peonies in red and pink on plum with green leaves and gold
 * dots, quilted in a diamond stitch, night-graded (indigo 55 % plus a warm night-light radial from
 * 阿嬤's lamp at the upper left) and vignetted. Fills `w` × `h`.
 */
export function quilt(ctx: KitCtx, w: number, h: number): string {
  const r = seeded(40);
  const dots = Array.from({ length: Math.round((w * h) / 2600) }, () => `<circle cx="${f1(r() * w)}" cy="${f1(r() * h)}" r="${f1(1 + r() * 1.6)}"/>`).join('');
  let stitch = '';
  for (let d = -h; d < w + h; d += 46) stitch += `M${d} 0L${f1(d + h)} ${h}M${d} ${h}L${f1(d + h)} 0`;
  const id = ctx.id;
  return `<defs><radialGradient id="${id('nightlight')}" cx=".12" cy=".06" r=".95"><stop offset="0" stop-color="${C.lampAmber}" stop-opacity=".42"/><stop offset=".45" stop-color="${C.peonyLight}" stop-opacity=".1"/><stop offset="1" stop-color="${C.quiltVignette}" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="${id('quiltVig')}" cx=".5" cy=".46" r=".75"><stop offset=".5" stop-color="${C.quiltVignette}" stop-opacity="0"/><stop offset="1" stop-color="${C.quiltVignette}" stop-opacity=".78"/></radialGradient></defs>`
    + `<rect width="${w}" height="${h}" fill="${C.quilt}"/>`
    + `<g opacity=".92">${peonies(w, h)}</g>`
    + `<g fill="${C.gold}" opacity=".5">${dots}</g>`
    // Quilting: a diamond of running stitches pressed into the cloth
    + `<path d="${stitch}" stroke="${C.quiltVignette}" stroke-width="2.2" opacity=".22"/>`
    + `<path d="${stitch}" stroke="${C.goldLight}" stroke-width=".8" stroke-dasharray="5 6" opacity=".22"/>`
    + `<rect width="${w}" height="${h}" fill="${C.quiltNight}" opacity=".55"/>`
    + `<rect width="${w}" height="${h}" fill="url(#${id('nightlight')})"/>`
    + `<rect width="${w}" height="${h}" fill="url(#${id('quiltVig')})"/>`
    + grain(ctx, w, h, 0.6);
}

// ——— The cover: the closed book on 阿嬤's low table ———

/** Where the book lies in the cover scene (its front board, before the −4° turn). */
export const COVER_BOOK = { cx: 195, cy: 214, w: 262, h: 330, rot: -4 } as const;

/** The cover scene's box: the table and the book; the quilt shows around it. */
export const COVER_SCENE: EnvBox = { x: 0, y: 0, w: 390, h: 470 };

/** A gold-foil line drawing of Taipei for the cover: the station's 重簷 roof, 101, the hills, the moon line. */
function foilSkyline(w: number): string {
  const stroke = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  const hills = `<path d="M0 46Q30 24 58 38T120 30T190 40T${w} 34" ${stroke} stroke-width="1.4" opacity=".7"/>`;
  // 台北車站: a hipped double roof over a long hall
  const station = `<g transform="translate(26 22)"><path d="M0 22L14 10H62L76 22Z" ${stroke} stroke-width="1.6"/><path d="M14 10L24 2H52L62 10" ${stroke} stroke-width="1.6"/>`
    + `<path d="M6 22V38H70V22" ${stroke} stroke-width="1.4"/><path d="M18 38V28M30 38V28M46 38V28M58 38V28" ${stroke} stroke-width="1.2"/></g>`;
  // 台北101: eight flared sections stacked on a base, the spire
  let sections = '';
  for (let i = 0; i < 8; i++) {
    const y = 34 - i * 7.4;
    sections += `<path d="M${f1(-6.6 + i * 0.25)} ${f1(y)}L${f1(-8.4 + i * 0.25)} ${f1(y - 7)}H${f1(8.4 - i * 0.25)}L${f1(6.6 - i * 0.25)} ${f1(y)}" ${stroke} stroke-width="1.2"/>`;
  }
  const tower = `<g transform="translate(${f1(w - 40)} 4)"><path d="M-10 46V34H10V46" ${stroke} stroke-width="1.4"/>${sections}<path d="M0 -25V-33M-3 -27H3" ${stroke} stroke-width="1.2"/></g>`;
  // The 月亮線: a dotted line with a little paper train on it
  const line = `<path d="M8 50H${w - 8}" ${stroke} stroke-width="1.2" stroke-dasharray="1 5"/>`
    + `<g transform="translate(${f1(w * 0.46)} 41)"><path d="M0 13V4Q0 0 5 0H30Q37 0 38 7V13Z" ${stroke} stroke-width="1.3"/><path d="M5 4h5v4h-5zM14 4h5v4h-5zM23 4h5v4h-5z" ${stroke} stroke-width="1"/><circle cx="8" cy="14" r="1.6"/><circle cx="30" cy="14" r="1.6"/></g>`;
  return hills + station + tower + line;
}

/** The four gold-foil corner brackets of the linen cover (kit `cover`), inset on a board `w` × `h`. */
function corners(ctx: KitCtx, w: number, h: number): string {
  const one = (x: number, y: number, sx: number, sy: number) =>
    `<g transform="${translate(x, y)} scale(${sx} ${sy})" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1.5">`
    + `<path d="M0 30V0H30M6 23V6H23M10 10l7 7"/><circle cx="17" cy="17" r="2.4" fill="${ref(ctx, 'foil')}" stroke="none"/></g>`;
  return one(8, 38, 1, 1) + one(w - 8, 38, -1, 1) + one(8, h - 8, 1, -1) + one(w - 8, h - 8, -1, -1);
}

/**
 * The cover's front board (bible § 7): navy linen, an inner bevel, a double gold-foil rule with
 * corner brackets, the foil moon and pinhole stars, the debossed foil title 《翻翻台北》 with
 * 「Pop-Up Taipei」, the foil skyline and the red 翻 seal. Local space: the board's top-left.
 */
function frontBoard(ctx: KitCtx, w: number, h: number): string {
  const id = ctx.id;
  const title = (dx: number, dy: number, fill: string, extra = '') =>
    `<text x="${f1(w / 2 + dx)}" y="${f1(150 + dy)}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="48" letter-spacing="6" fill="${fill}"${extra}>翻翻台北</text>`;
  return `<defs><linearGradient id="${id('bevel')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.cutRim}" stop-opacity=".16"/><stop offset=".4" stop-color="${C.cutRim}" stop-opacity="0"/><stop offset="1" stop-color="${C.shadow}" stop-opacity=".35"/></linearGradient>`
    + `<radialGradient id="${id('boardLamp')}" cx=".2" cy=".1" r=".9"><stop offset="0" stop-color="${C.lamp}" stop-opacity=".22"/><stop offset="1" stop-color="${C.lamp}" stop-opacity="0"/></radialGradient></defs>`
    + `<rect width="${w}" height="${h}" rx="7" fill="${ref(ctx, 'linen')}"/>`
    + `<rect width="${w}" height="${h}" rx="7" fill="url(#${id('bevel')})"/>`
    + `<rect width="${w}" height="${h}" rx="7" fill="url(#${id('boardLamp')})"/>`
    // The hinge groove under the spine (a top-bound book)
    + `<path d="M8 30H${w - 8}" stroke="${C.coverDark}" stroke-width="3" opacity=".8"/><path d="M8 32.5H${w - 8}" stroke="${C.coverLight}" stroke-width="1" opacity=".7"/>`
    + corners(ctx, w, h)
    + `<rect x="18" y="44" width="${w - 36}" height="${h - 62}" rx="3" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1.6"/>`
    + `<rect x="23" y="49" width="${w - 46}" height="${h - 72}" rx="2" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width=".7" opacity=".8"/>`
    // The foil moon, pinhole stars, a sparkle
    + `<g transform="translate(${f1(w / 2)} 84)"><circle r="17" fill="${ref(ctx, 'foil')}"/><circle cx="7" cy="-5" r="14.5" fill="${C.cover}"/><circle cx="7" cy="-5" r="14.5" fill="${ref(ctx, 'linen')}" opacity=".9"/></g>`
    + pinholes(ctx, 40, 58, w - 80, 46, 14, 7, C.goldLight)
    + sparkle(ctx, w / 2 + 48, 70, 5) + sparkle(ctx, w / 2 - 54, 92, 3.5, 0.8)
    // The title, debossed: a dark impression under, a lit edge over, then the foil
    + title(1.4, 1.8, C.coverDark)
    + title(-0.6, -0.8, C.cutRim, ' opacity=".25"')
    + title(0, 0, ref(ctx, 'foil'))
    + `<path d="M${f1(w / 2 - 70)} 172H${f1(w / 2 + 70)}" stroke="${ref(ctx, 'foil')}" stroke-width="1"/>`
    + `<circle cx="${f1(w / 2)}" cy="172" r="2.4" fill="${ref(ctx, 'foil')}"/>`
    + `<text x="${f1(w / 2)}" y="196" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="17" letter-spacing="4" fill="${C.goldLight}" opacity=".92">POP-UP TAIPEI</text>`
    + `<g transform="translate(26 ${h - 90})" stroke="${ref(ctx, 'foil')}" fill="${ref(ctx, 'foil')}">${foilSkyline(w - 52)}</g>`
    + seal(ctx, w - 50, 74, '翻', 12);
}

/** A thick old book's page edges, as horizontal paper lines in a band `w` × `h`. */
function pageLines(w: number, h: number, step = 2.4): string {
  let d = '';
  for (let y = 1; y < h; y += step) d += `M0 ${f1(y)}H${w}`;
  return `<rect width="${w}" height="${h}" fill="${C.foldLit}"/><path d="${d}" stroke="${C.foldShade}" stroke-width=".7"/>`;
}

/**
 * The cover scene: 阿嬤's low lacquered table (its top in a gentle 3/4 view, the lit front edge),
 * lamplight pooling from the upper left, and the closed book lying on it, turned a little, with its
 * page block, a red ribbon bookmark and an indigo contact shadow. Transparent around the table, so
 * the quilt (its own bitmap) shows. Baokaka and Mocha stand in front of it as live standees.
 */
export function coverScene(ctx: KitCtx): string {
  const { cx, cy, w, h, rot } = COVER_BOOK;
  const id = ctx.id;
  // The table top: a rounded trapezoid, wider toward the reader, and its front edge band
  const top = `M30 34Q36 22 52 22H338Q354 22 360 34L384 400Q386 418 368 418H22Q4 418 6 400Z`;
  const edge = `M6 400Q4 418 22 418H368Q386 418 384 400L386 426Q386 446 366 446H24Q4 446 4 426Z`;
  let grainLines = '';
  const r = seeded(12);
  for (let i = 0; i < 26; i++) {
    const y = 30 + i * 15 + r() * 6;
    grainLines += `<path d="M${f1(10 + r() * 30)} ${f1(y)}Q${f1(120 + r() * 60)} ${f1(y - 6 + r() * 12)} ${f1(220 + r() * 40)} ${f1(y + r() * 4)}T${f1(380 - r() * 20)} ${f1(y + r() * 6)}" stroke="${i % 3 ? C.woodGrain : C.woodEdge}" stroke-width="${f1(0.6 + r() * 0.9)}" fill="none" opacity="${f1(0.35 + r() * 0.3)}"/>`;
  }
  const table = `<defs><linearGradient id="${id('woodTop')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.woodDeep}"/><stop offset=".55" stop-color="${C.wood}"/><stop offset="1" stop-color="${C.woodDeep}"/></linearGradient>`
    + `<linearGradient id="${id('woodEdge')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.woodEdge}"/><stop offset="1" stop-color="${C.woodDeep}"/></linearGradient>`
    + `<radialGradient id="${id('pool')}" cx=".22" cy=".12" r=".85"><stop offset="0" stop-color="${C.lamp}" stop-opacity=".34"/><stop offset=".5" stop-color="${C.lampAmber}" stop-opacity=".08"/><stop offset="1" stop-color="${C.lampAmber}" stop-opacity="0"/></radialGradient>`
    + `<clipPath id="${id('topClip')}"><path d="${top}"/></clipPath></defs>`
    + softEllipse(ctx, 195, 440, 210, 26, 'shadow', 0.7, 'blur18')
    + `<path d="${edge}" fill="url(#${id('woodEdge')})"/>`
    + `<path d="M8 404Q8 418 24 419H366Q382 418 382 404" fill="none" stroke="${C.lamp}" stroke-width="1.2" opacity=".35"/>`
    + `<path d="${top}" fill="url(#${id('woodTop')})"/>`
    + `<g clip-path="url(#${id('topClip')})">${grainLines}<rect width="390" height="420" fill="url(#${id('pool')})"/>`
    // The lacquer's soft sheen and the lamp's reflection
    + `<path d="M40 60Q120 30 210 44" stroke="${C.lampHot}" stroke-width="10" fill="none" opacity=".06" stroke-linecap="round"/>`
    + grain(ctx, 390, 420, 0.5) + `</g>`;
  // The book: page block (the paper edges show at the bottom and right), the boards, the ribbon
  const block = `<g transform="translate(${f1(-w / 2 + 6)} ${f1(-h / 2 + 10)})">`
    + `<rect x="2" y="${h - 4}" width="${w - 4}" height="10" rx="2" fill="${C.foldShade}"/>`
    + `<g transform="translate(4 ${h - 6})">${pageLines(w - 8, 10)}</g>`
    + `<g transform="translate(${w - 6} 22) rotate(90)"><g transform="scale(1 -1) translate(0 -8)">${pageLines(h - 26, 8)}</g></g></g>`;
  const back = `<rect x="${f1(-w / 2 + 3)}" y="${f1(-h / 2 + 7)}" width="${w + 6}" height="${h + 8}" rx="8" fill="${C.coverDark}"/>`;
  const ribbon = `<path d="M${f1(w / 2 - 70)} ${f1(h / 2 + 8)}v40l7 -8l7 8v-40z" fill="${C.ribbon}"/><path d="M${f1(w / 2 - 70)} ${f1(h / 2 + 8)}h14v6h-14z" fill="${C.ribbonDeep}" opacity=".6"/>`;
  const book = `<g transform="${translate(cx, cy)} rotate(${rot})">`
    + softEllipse(ctx, 10, 16, w / 2 + 14, h / 2 + 4, 'shadow', 0.55, 'blur18')
    + `<rect x="${f1(-w / 2 + 2)}" y="${f1(-h / 2 + 6)}" width="${w + 10}" height="${h + 14}" rx="9" fill="${C.shadow}" opacity=".5"/>`
    + back + block + ribbon
    + `<g transform="translate(${f1(-w / 2)} ${f1(-h / 2)})">${frontBoard(ctx, w, h)}</g>`
    // The spine's rounded top edge (top-bound), catching the lamp
    + `<path d="M${f1(-w / 2 + 6)} ${f1(-h / 2 + 1.5)}H${f1(w / 2 - 6)}" stroke="${C.coverLight}" stroke-width="2" stroke-linecap="round" opacity=".9"/>`
    + `</g>`;
  return table + book;
}

// ——— The 目錄: a folded paper map of the 月亮線 ———

/** The map sheet's box in the 目錄 (CSS px; the route and stations are drawn live over it). */
export const MAP_SHEET: EnvBox = { x: 0, y: 0, w: 362, h: 430 };

/**
 * The paper map (bible § 7 目錄): a cream sheet folded in six (mountain and valley creases), its
 * corners worn, with a printed river (the 淡水河 and 基隆河, simplified), faint streets, a compass
 * rose and washi tape holding it to the table. Printed in soft inks so the live route ribbon and
 * the stations read on top.
 */
export function mapSheet(ctx: KitCtx): string {
  const { w, h } = MAP_SHEET;
  const id = ctx.id;
  const m = 8;
  const sheet = `M${m + 4} ${m}H${w - m - 3}L${w - m} ${m + 4}V${h - m - 5}L${w - m - 4} ${h - m}H${m + 3}L${m} ${h - m - 3}V${m + 5}Z`;
  const r = seeded(77);
  let streets = '';
  for (let i = 0; i < 9; i++) {
    const y = m + 20 + i * 42 + r() * 10;
    streets += `<path d="M${m} ${f1(y)}L${w - m} ${f1(y + (r() - 0.5) * 30)}" stroke="${C.mapStreet}" stroke-width="${f1(1.2 + r() * 2)}" fill="none"/>`;
  }
  for (let i = 0; i < 7; i++) {
    const x = m + 24 + i * 52 + r() * 12;
    streets += `<path d="M${f1(x)} ${m}L${f1(x + (r() - 0.5) * 40)} ${h - m}" stroke="${C.mapStreet}" stroke-width="${f1(1 + r() * 1.6)}" fill="none"/>`;
  }
  const river = `<path d="M${w - m} 40Q300 70 280 120T200 190Q150 220 120 300T40 ${h - m}" stroke="${C.mapRiver}" stroke-width="14" fill="none" stroke-linecap="round" opacity=".55"/>`
    + `<path d="M${w - m} 40Q300 70 280 120T200 190Q150 220 120 300T40 ${h - m}" stroke="${C.cutRim}" stroke-width="2" fill="none" stroke-dasharray="3 9" opacity=".5"/>`
    + `<path d="M200 190Q240 230 300 236T${w - m} 300" stroke="${C.mapRiver}" stroke-width="9" fill="none" opacity=".45"/>`;
  // Folds: two vertical (the sheet folds in three across), one horizontal (in half)
  const fold = (d: string, lit: boolean) => `<path d="${d}" stroke="${lit ? C.foldLitHigh : C.foldShade}" stroke-width="${lit ? 1.4 : 1}" opacity="${lit ? 0.9 : 0.8}"/>`;
  const third = (w - 2 * m) / 3;
  const folds = `<rect x="${f1(m + third - 9)}" y="${m}" width="18" height="${h - 2 * m}" fill="url(#${id('valley')})"/>`
    + `<rect x="${f1(m + 2 * third - 9)}" y="${m}" width="18" height="${h - 2 * m}" fill="url(#${id('mountain')})"/>`
    + `<rect x="${m}" y="${f1(h / 2 - 9)}" width="${w - 2 * m}" height="18" fill="url(#${id('valleyH')})"/>`
    + fold(`M${f1(m + third)} ${m}V${h - m}`, false) + fold(`M${f1(m + 2 * third)} ${m}V${h - m}`, true) + fold(`M${m} ${f1(h / 2)}H${w - m}`, false);
  const rose = `<g transform="translate(48 ${h - 52})" opacity=".75"><circle r="17" fill="none" stroke="${C.foldValley}" stroke-width="1"/>`
    + `<path d="M0 -22L4 0L0 22L-4 0Z" fill="${C.foldValley}"/><path d="M0 -22L4 0H-4Z" fill="${C.ribbon}"/><path d="M-22 0L0 -3L22 0L0 3Z" fill="${C.foldValley}" opacity=".7"/>`
    + `<text y="-26" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="10" fill="${C.foldValley}">N</text></g>`;
  return `<defs><linearGradient id="${id('paper')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.foldLitHigh}"/><stop offset=".6" stop-color="${C.page}"/><stop offset="1" stop-color="${C.pageDark}"/></linearGradient>`
    + `<linearGradient id="${id('valley')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.foldAo}" stop-opacity="0"/><stop offset=".5" stop-color="${C.foldAo}" stop-opacity=".16"/><stop offset="1" stop-color="${C.foldAo}" stop-opacity="0"/></linearGradient>`
    + `<linearGradient id="${id('mountain')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.cutRim}" stop-opacity="0"/><stop offset=".5" stop-color="${C.cutRim}" stop-opacity=".5"/><stop offset=".52" stop-color="${C.foldAo}" stop-opacity=".12"/><stop offset="1" stop-color="${C.foldAo}" stop-opacity="0"/></linearGradient>`
    + `<linearGradient id="${id('valleyH')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.foldAo}" stop-opacity="0"/><stop offset=".5" stop-color="${C.foldAo}" stop-opacity=".14"/><stop offset="1" stop-color="${C.foldAo}" stop-opacity="0"/></linearGradient>`
    + `<clipPath id="${id('sheet')}"><path d="${sheet}"/></clipPath></defs>`
    + softEllipse(ctx, w / 2 + 3, h / 2 + 6, w / 2 - 6, h / 2 - 8, 'shadow', 0.55, 'blur8')
    + `<path d="${sheet}" fill="url(#${id('paper')})"${ctx.filters ? ` filter="url(#${id('deckle')})"` : ''}/>`
    + `<g clip-path="url(#${id('sheet')})">${streets}${river}${folds}${rose}`
    + fibers(m, m, w - 2 * m, h - 2 * m, 90, C.pageFiber, 9, 0.18)
    + grain(ctx, w, h, 0.45) + `</g>`
    + washi(ctx, 40, 14, 56, 16, -9) + washi(ctx, w - 40, h - 12, 52, 15, -6, C.washiCeladon);
}

/** What the bake renders for the screens (box in CSS px, drawn with filters on). */
export const SCREEN_ART: Readonly<Record<string, ScreenSource>> = {
  // 430 × 932 covers every phone in portrait (the screen draws it `cover`, centred)
  quilt: { box: { x: 0, y: 0, w: 430, h: 932 }, draw: (ctx) => quilt(ctx, 430, 932) },
  'cover-scene': { box: COVER_SCENE, draw: coverScene },
  'map-sheet': { box: MAP_SHEET, draw: mapSheet },
  // 尾聲 (#135): 05:30 at home before page E, and the 土地公's shrine after the credits
  'dawn-scene': { box: SCENE_BOX, draw: dawnScene },
  'shrine-scene': { box: SCENE_BOX, draw: shrineScene },
};
