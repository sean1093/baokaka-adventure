import { POPUP as C, POPUP_HOME as H, POPUP_STAGE as S, mixHex } from '../../../art/palette';
import { depth, f1, ref, seeded, softEllipse, type KitCtx } from '../../art';
import { gutter } from '../../view/art/placeholders';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorOutline, floorWiden } from '../../view/geometry';

/**
 * Shared drawing for the slice's page art (#108; bible § 2–3): gradients scoped to the bake's
 * context, the standing page's and floor page's clips, the calm moon, lit vellum, a paper-style
 * figure and the sleeping cat. Every helper returns an SVG string in page units, drawn with the
 * kit's filters on (the bake, `env/bake.ts`): these drawings never run in game.
 */

export type Stop = readonly [offset: number, color: string, opacity?: number];

const stopsOf = (stops: readonly Stop[]) =>
  stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('');

/** A linear gradient def (vertical by default; `h` horizontal, `d` diagonal) under `ctx.id(name)`. */
export function lin(ctx: KitCtx, name: string, stops: readonly Stop[], dir: 'v' | 'h' | 'd' = 'v'): string {
  const [x2, y2] = dir === 'v' ? [0, 1] : dir === 'h' ? [1, 0] : [1, 1];
  return `<linearGradient id="${ctx.id(name)}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stopsOf(stops)}</linearGradient>`;
}

/** A radial gradient def under `ctx.id(name)`. */
export function rad(ctx: KitCtx, name: string, stops: readonly Stop[], cx = 0.5, cy = 0.5, r = 0.5): string {
  return `<radialGradient id="${ctx.id(name)}" cx="${cx}" cy="${cy}" r="${r}">${stopsOf(stops)}</radialGradient>`;
}

/** The standing (backdrop) page, clipped to its card with the rounded top corners. */
export function standingPage(ctx: KitCtx, body: string): string {
  const id = ctx.id('standClip');
  return `<clipPath id="${id}"><rect x="0" y="0" width="${PAGE_W}" height="${GUTTER_Y}" rx="5"/></clipPath><g clip-path="url(#${id})">${body}</g>`;
}

/** The floor page, clipped to its widening outline. */
export function floorPage(ctx: KitCtx, body: string): string {
  const id = ctx.id('floorClipArt');
  return `<clipPath id="${id}"><path d="${floorOutline()}"/></clipPath><g clip-path="url(#${id})">${body}</g>`;
}

/** The floor page's full extent (a rect covering the widened trapezoid). */
export const FLOOR_RECT = (() => {
  const w = floorWiden(FLOOR_BOTTOM);
  return { x: -w, y: GUTTER_Y, w: PAGE_W + 2 * w, h: FLOOR_BOTTOM - GUTTER_Y };
})();

/** The book's fold and the floor page's lit front edge. */
export function bookCues(ctx: KitCtx): string {
  const w = floorWiden(FLOOR_BOTTOM);
  return gutter(ctx) + `<path d="M${f1(-w)} ${FLOOR_BOTTOM - 0.5}H${f1(PAGE_W + w)}" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`;
}

/**
 * The moon, kept calm for the squint test (#140's note; bible § 4.2): a backlit vellum disc with
 * embossed craters and a foil ring, one small halo, and a vellum cloud drifting over its lower half.
 */
export function calmMoon(ctx: KitCtx, x: number, y: number, r: number, { cloud = true, halo = 0.1 }: { cloud?: boolean; halo?: number } = {}): string {
  const id = ctx.id(`moonG${f1(x)}${f1(y)}`.replace(/\./g, '_'));
  return `<defs>${`<radialGradient id="${id}" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="${C.foilShine}"/><stop offset=".7" stop-color="${mixHex(C.moon, C.pageDark, 0.25)}"/><stop offset="1" stop-color="${mixHex(C.moon, C.gold, 0.45)}"/></radialGradient>`}</defs>`
    + softEllipse(ctx, x, y, r * 1.6, r * 1.6, 'lamp', halo, 'blur8')
    + depth(ctx, 2, `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})"/>`, `<circle cx="${x}" cy="${y}" r="${r}"/>`)
    + `<g fill="${mixHex(C.moon, C.ochre, 0.4)}"><circle cx="${f1(x - r * 0.3)}" cy="${f1(y - r * 0.25)}" r="${f1(r * 0.22)}" opacity=".55"/><circle cx="${f1(x + r * 0.32)}" cy="${f1(y + r * 0.3)}" r="${f1(r * 0.16)}" opacity=".5"/><circle cx="${f1(x + r * 0.3)}" cy="${f1(y - r * 0.38)}" r="${f1(r * 0.1)}" opacity=".45"/></g>`
    + `<circle cx="${x}" cy="${y}" r="${f1(r + 3)}" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width=".9" opacity=".55"/>`
    + (cloud ? `<path d="M${f1(x - r * 1.5)} ${f1(y + r * 0.7)}q${f1(r * 0.3)} ${f1(-r * 0.6)} ${f1(r * 0.9)} ${f1(-r * 0.3)}q${f1(r * 0.4)} ${f1(-r * 0.55)} ${f1(r * 1.1)} ${f1(-r * 0.1)}q${f1(r * 0.6)} ${f1(-r * 0.2)} ${f1(r * 0.9)} ${f1(r * 0.35)}q${f1(r * 0.7)} 0 ${f1(r * 0.6)} ${f1(r * 0.5)}H${f1(x - r * 1.6)}z" fill="${C.vellum}" opacity=".55"${ctx.filters ? ` filter="url(#${ctx.id('z1')})"` : ''}/>` : '');
}

/** A cut hole backed with glowing vellum (bible § 3.3), with a mullion cross, at low bloom. */
export function vellumWindow(ctx: KitCtx, x: number, y: number, w: number, h: number, { mullion = true, frame = C.printDark, bloom = 0.12 }: { mullion?: boolean; frame?: string; bloom?: number } = {}): string {
  return (bloom > 0 ? softEllipse(ctx, x + w / 2, y + h / 2, w * 0.7, h * 0.6, 'lamp', bloom, 'blur3') : '')
    + `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="1" fill="${ref(ctx, 'window')}"/>`
    + (mullion ? `<path d="M${f1(x + w / 2)} ${f1(y)}V${f1(y + h)}M${f1(x)} ${f1(y + h * 0.42)}H${f1(x + w)}" stroke="${frame}" stroke-width="1" opacity=".55"/>` : '');
}

/** Washi wallpaper: the wall's gradient and a small cream print (four-petal flowers and dots), at low contrast. */
export function wallpaper(ctx: KitCtx, x: number, y: number, w: number, h: number, seed = 3): string {
  const pid = ctx.id(`wallPrint${seed}`);
  const flower = (cx: number, cy: number, s: number) =>
    `<g transform="translate(${cx} ${cy})"><circle cy="${-s}" r="${s * 0.8}"/><circle cy="${s}" r="${s * 0.8}"/><circle cx="${-s}" r="${s * 0.8}"/><circle cx="${s}" r="${s * 0.8}"/></g>`;
  return `<defs><pattern id="${pid}" width="34" height="34" patternUnits="userSpaceOnUse"><g fill="${H.wallPrint}">${flower(8.5, 8.5, 2)}${flower(25.5, 25.5, 2)}<circle cx="25.5" cy="8.5" r=".9"/><circle cx="8.5" cy="25.5" r=".9"/></g></pattern></defs>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'homeWall')}"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${pid})" opacity=".14"/>`
    + paperFibres(x, y, w, h, 60, H.wallPrint, seed, 0.12);
}

/** Long pale paper fibres (washi; bible § 3.1) as one path. */
export function paperFibres(x: number, y: number, w: number, h: number, n: number, color: string, seed: number, opacity: number): string {
  const r = seeded(seed);
  let d = '';
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h, a = r() * Math.PI, len = 8 + r() * 22;
    d += `M${f1(px)} ${f1(py)}q${f1(Math.cos(a) * len * 0.5 + (r() - 0.5) * 6)} ${f1(Math.sin(a) * len * 0.5 + (r() - 0.5) * 6)} ${f1(Math.cos(a) * len)} ${f1(Math.sin(a) * len)}`;
  }
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width=".5" stroke-linecap="round" opacity="${opacity}"/>`;
}

/** The home's wood wainscot from `y0` down to the gutter: a lit cap, panel insets and a skirting board. */
export function wainscot(ctx: KitCtx, y0: number, x0 = -20, x1 = PAGE_W + 20): string {
  const h = GUTTER_Y - y0;
  let panels = '';
  for (let x = x0 + 22; x < x1 - 30; x += 64) panels += `M${x} ${y0 + 14}h50v${h - 34}h-50Z`;
  return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${h}" fill="${ref(ctx, 'wainscotG')}"/>`
    + `<path d="${panels}" fill="${H.wainscotDeep}" opacity=".28"/><path d="${panels}" fill="none" stroke="${H.wainscotLit}" stroke-width="1" opacity=".35" transform="translate(-.8 -.8)"/>`
    + `<rect x="${x0}" y="${y0 - 4}" width="${x1 - x0}" height="7" fill="${H.wainscotLit}"/><path d="M${x0} ${y0 - 3.5}H${x1}" stroke="${C.cutRim}" stroke-width="1" opacity=".35"/>`
    + `<rect x="${x0}" y="${GUTTER_Y - 9}" width="${x1 - x0}" height="9" fill="${H.skirting}"/>`;
}

/** The home's gradient defs (wall, wainscot, floorboards), shared by the prologue backdrops. */
export function homeDefs(ctx: KitCtx): string {
  return `<defs>`
    + lin(ctx, 'homeWall', [[0, H.wallTop], [0.55, H.wallMid], [1, H.wallLow]])
    + lin(ctx, 'wainscotG', [[0, H.wainscotLit], [0.25, H.wainscot], [1, H.wainscotDeep]])
    + lin(ctx, 'boards', [[0, mixHex(H.board, H.wainscotDeep, 0.45)], [0.35, H.board], [1, H.boardLight]])
    + rad(ctx, 'warmPool', [[0, C.lamp, 0.5], [0.55, C.lampAmber, 0.16], [1, C.lampAmber, 0]])
    + rad(ctx, 'coolPool', [[0, H.moonSpill, 0.32], [1, H.moonSpill, 0]])
    + lin(ctx, 'sofaG', [[0, H.sofaLight], [1, H.sofaDeep]])
    + lin(ctx, 'pineG', [[0, H.pine], [1, H.pineDeep]])
    + lin(ctx, 'teakG', [[0, H.teak], [1, H.teakDeep]])
    + lin(ctx, 'lampWash', [[0, C.lampAmber, 0], [1, C.lampAmber, 0.14]])
    + `</defs>`;
}

/** The home floor page: honey floorboards converging on the vanishing point, lamp pools, a shade toward the gutter. */
export function homeFloor(ctx: KitCtx, pools: readonly (readonly [number, number, number, number, 'warm' | 'cool'])[]): string {
  const { x, y, w, h } = FLOOR_RECT;
  const k = (FLOOR_BOTTOM - GUTTER_Y) / (GUTTER_Y + 360);
  const r = seeded(17);
  let seams = '';
  let joints = '';
  for (let bx = -100; bx <= PAGE_W + 100; bx += 28) {
    seams += `M${f1(bx)} ${GUTTER_Y}L${f1(bx + (bx - 195) * k)} ${FLOOR_BOTTOM}`;
    for (let j = 0; j < 3; j++) {
      const t = 0.08 + r() * 0.9;
      const yy = GUTTER_Y + (FLOOR_BOTTOM - GUTTER_Y) * t;
      const xa = bx + (bx - 195) * k * t;
      const ww = 28 + 28 * k * t * 2;
      joints += `M${f1(xa)} ${f1(yy)}h${f1(ww * 0.98)}`;
    }
  }
  return floorPage(ctx, `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'boards')}"/>`
    + `<path d="${seams}" stroke="${H.boardSeam}" stroke-width="1.1" opacity=".5" fill="none"/>`
    + `<path d="${joints}" stroke="${H.boardSeam}" stroke-width=".9" opacity=".4" fill="none"/>`
    + `<path d="${seams}" stroke="${C.cutRim}" stroke-width=".5" opacity=".12" fill="none" transform="translate(1.2 0)"/>`
    + pools.map(([cx, cy, rx, ry, tone]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ref(ctx, tone === 'warm' ? 'warmPool' : 'coolPool')}"/>`).join('')
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'hatch')}" opacity=".14"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="30" fill="${C.shadow}" opacity=".18"/>`);
}

/**
 * Mocha asleep (GDD § 4.3: in the background art on 0-1 and 0-2), as a printed paper cat: a
 * curled grey tabby loaf with his stripes, his tail wrapped round, his blue collar and closed
 * eyes, and a little chalk 「呼」. `s` scales him; he lies on (x, y).
 */
export function sleepingCat(ctx: KitCtx, x: number, y: number, s = 1): string {
  const body = 'M-24 0q-4 -20 14 -24q14 -4 26 4q10 8 6 20z';
  const head = 'M10 -2q-2 -14 9 -16l2 -8l5 7q6 0 9 5l5 -6l1 9q4 6 0 11z';
  const tail = 'M-22 -1q4 7 24 6q8 -1 12 -5';
  const stripes = 'M-14 -21q3 6 1 12M-4 -24q3 7 1 13M6 -22q3 6 1 11M-20 -14q4 3 6 9';
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})">`
    + softEllipse(ctx, 4, 1, 34, 4, 'shadow', 0.35)
    + depth(ctx, 3, `<path d="${body}" fill="${S.catFur}"/><path d="${stripes}" stroke="${S.catFurDark}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`
      + `<path d="${head}" fill="${S.catFur}"/><path d="M19 -16l2 -7l3 6zM33 -13l3 -6l1 7z" fill="${S.catNose}" opacity=".6"/>`
      + `<path d="M22 -11q2 -6 2 -9M30 -12q1 -4 4 -6" stroke="${S.catFurDark}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`
      + `<path d="M17 -8q2 1.6 4 0M27 -8q2 1.6 4 0" stroke="${C.ink}" stroke-width="1" stroke-linecap="round" fill="none"/>`
      + `<path d="M23 -5l1.2 1.4l1.2 -1.4z" fill="${S.catNose}"/><path d="M13 -2q12 3 26 -1" stroke="${S.catCollar}" stroke-width="2.4" fill="none"/>`
      + `<path d="${tail}" stroke="${S.catFurDark}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="${tail}" stroke="${S.catFur}" stroke-width="3" stroke-linecap="round" fill="none"/>`
      + `<path d="M-20 -6q10 -14 30 -14" stroke="${C.cutRim}" stroke-width="1" opacity=".3" fill="none"/>`, `<path d="${body}"/><path d="${head}"/>`)
    + `<text data-art-text="" x="40" y="-24" font-family="'Noto Serif TC'" font-weight="700" font-size="9" fill="${C.chalk}" opacity=".75">呼…</text>`
    + `</g>`;
}

/**
 * 咻咻 peeking (the baby typhoon, shown as 小小的雲 before 9-5; GDD § 5.1): a little vellum cloud
 * with a swirl, two dot eyes and a blush, peeking round an edge. Facing +x; `s` scales it.
 */
export function shushuPeek(ctx: KitCtx, x: number, y: number, s = 1): string {
  const cloud = 'M-14 6q-8 0 -8 -7q0 -7 8 -7q1 -9 11 -9q8 0 11 7q8 -1 9 7q1 9 -8 9z';
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})">`
    + depth(ctx, 2, `<path d="${cloud}" fill="${C.vellum}"/><path d="M-6 0q0 -6 6 -6q5 0 5 4q0 3 -3 3q-2 0 -2 -2" stroke="${C.printLilac}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
      + `<circle cx="7" cy="-4" r="1.3" fill="${C.ink}"/><circle cx="12" cy="-3.4" r="1.3" fill="${C.ink}"/><circle cx="9.6" cy="0" r="1.6" fill="${S.blush}" opacity=".6"/>`, `<path d="${cloud}"/>`)
    + `<path d="M-24 -2h-6M-24 3h-9M-22 -7h-4" stroke="${C.vellum}" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>`
    + `</g>`;
}

/** A paper-style face (closed or open eyes, a blush) centred on (x, y), for the backdrop's cast. */
export function paperFace(x: number, y: number, { asleep = false, s = 1 }: { asleep?: boolean; s?: number } = {}): string {
  const k = (n: number) => f1(n * s);
  const eyes = asleep
    ? `<path d="M${f1(x - k(5))} ${y}q${k(2)} ${k(1.6)} ${k(4)} 0M${f1(x + k(1.5))} ${y}q${k(2)} ${k(1.6)} ${k(4)} 0" stroke="${C.ink}" stroke-width="${k(1.1)}" stroke-linecap="round" fill="none"/>`
    : `<circle cx="${f1(x - k(3))}" cy="${y}" r="${k(1.3)}" fill="${C.ink}"/><circle cx="${f1(x + k(3.4))}" cy="${y}" r="${k(1.3)}" fill="${C.ink}"/>`;
  return eyes + `<circle cx="${f1(x - k(6))}" cy="${f1(y + k(4))}" r="${k(1.9)}" fill="${S.blush}" opacity=".6"/><circle cx="${f1(x + k(6.5))}" cy="${f1(y + k(4))}" r="${k(1.9)}" fill="${S.blush}" opacity=".6"/>`;
}

/** Bunting: a string of pastel paper triangles sagging between two points (the birthday eve). */
export function bunting(ctx: KitCtx, x0: number, y0: number, x1: number, y1: number, sag: number, colours: readonly string[]): string {
  const n = Math.max(3, Math.round((x1 - x0) / 22));
  const pt = (t: number): [number, number] => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + sag * 4 * t * (1 - t)];
  let flags = '';
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pt((i + 0.15) / n);
    const [bx, by] = pt((i + 0.85) / n);
    const [mx, my] = pt((i + 0.5) / n);
    flags += `<path d="M${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}L${f1(mx)} ${f1(my + 15)}Z" fill="${colours[i % colours.length]}"/>`;
  }
  const [mx, my] = pt(0.5);
  return `<path d="M${x0} ${y0}Q${f1(mx)} ${f1(my + sag)} ${x1} ${y1}" stroke="${C.pageEdge}" stroke-width=".8" fill="none" opacity=".7"/>`
    + depth(ctx, 1, flags, flags.replace(/ fill="[^"]*"/g, ''));
}
