import { POPUP as C, POPUP_FOIL, type GradientStop } from '../../art/palette';
import { f2, type KitCtx } from './svg';

/**
 * Shared defs: the depth filters, grain and mottle, the standee filter, and the gradients and
 * patterns for every paper stock (popup art bible § 2.2, § 3.1, § 5; kit.js `defs()`).
 *
 * Filters (`FILTER_DEFS`) are **bake-time and PageLab-only** (GDD § 3.9, bible § 9.1): `kitDefs`
 * leaves them out unless `ctx.filters` is set, so the in-game path cannot reference one.
 */

const stops = (list: readonly GradientStop[], opacity?: number): string =>
  list.map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"${opacity === undefined ? '' : ` stop-opacity="${opacity}"`}/>`).join('');

/**
 * The depth filter for tunnel-book layer `z` (bible § 2.2): a tight contact shadow, a wide soft
 * drop shadow, a 1 px cut-edge rim (top-left, `cutRim` at 42 %) and a 1 px cut-edge shade
 * (bottom-right, the shadow tint at 35 %). Higher z = closer to the reader = more lift.
 */
export function depthFilter(id: string, z: number, tint: string = C.shadow): string {
  const cdx = f2(0.5 + z * 0.25), cdy = f2(0.8 + z * 0.45);
  const sdx = f2(1 + z * 1.1), sdy = f2(2 + z * 2.2), sb = f2(1.5 + z * 1.6);
  return `<filter id="${id}" x="-25%" y="-25%" width="150%" height="170%" color-interpolation-filters="sRGB">`
    + `<feGaussianBlur in="SourceAlpha" stdDeviation="${sb}" result="b1"/><feOffset in="b1" dx="${sdx}" dy="${sdy}" result="o1"/>`
    + `<feFlood flood-color="${tint}" flood-opacity="${f2(0.22 + z * 0.03)}"/><feComposite in2="o1" operator="in" result="soft"/>`
    + `<feGaussianBlur in="SourceAlpha" stdDeviation="${f2(0.5 + z * 0.15)}" result="b2"/><feOffset in="b2" dx="${cdx}" dy="${cdy}" result="o2"/>`
    + `<feFlood flood-color="${tint}" flood-opacity=".55"/><feComposite in2="o2" operator="in" result="contact"/>`
    + `<feOffset in="SourceAlpha" dx="1.1" dy="1.1" result="sh1"/><feComposite in="SourceAlpha" in2="sh1" operator="out" result="rimA"/>`
    + `<feFlood flood-color="${C.cutRim}" flood-opacity=".42"/><feComposite in2="rimA" operator="in" result="rim"/>`
    + `<feOffset in="SourceAlpha" dx="-1" dy="-1" result="sh2"/><feComposite in="SourceAlpha" in2="sh2" operator="out" result="shA"/>`
    + `<feFlood flood-color="${tint}" flood-opacity=".35"/><feComposite in2="shA" operator="in" result="shade"/>`
    + `<feMerge><feMergeNode in="soft"/><feMergeNode in="contact"/><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="rim"/></feMerge>`
    + `</filter>`;
}

/** Card-stock grain (fractal noise .9, 3 octaves) as a filter that paints noise into its rect. */
export const grainFilter = (id: string): string =>
  `<filter id="${id}" x="0" y="0" width="100%" height="100%">`
  + `<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="7" stitchTiles="stitch"/>`
  + `<feColorMatrix type="matrix" values="0 0 0 0 .5  0 0 0 0 .46  0 0 0 0 .42  .9 .9 .9 0 -1.05"/></filter>`;

/** Low-frequency mottle (noise .018, 2 octaves). */
export const mottleFilter = (id: string): string =>
  `<filter id="${id}" x="0" y="0" width="100%" height="100%">`
  + `<feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="2" seed="3"/>`
  + `<feColorMatrix type="matrix" values="0 0 0 0 .3  0 0 0 0 .25  0 0 0 0 .4  1.2 0 0 0 -.45"/></filter>`;

const displace = (id: string, freq: number, seed: number, scale: number, box: string) =>
  `<filter id="${id}" ${box}><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" result="t"/>`
  + `<feDisplacementMap in="SourceGraphic" in2="t" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`;

const blur = (id: string, sd: number, pad: number) =>
  `<filter id="${id}" x="-${pad}%" y="-${pad}%" width="${100 + 2 * pad}%" height="${100 + 2 * pad}%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

/**
 * The die-cut standee (bible § 5): the printed sprite plus a 3.2 px warm-white card border dilated
 * from its alpha, a 0.6 px mauve-grey cut line, and a stacked contact + soft shadow. Applied at
 * bake time to every character frame, so the game never runs it.
 */
export const standeeFilter = (id: string): string =>
  `<filter id="${id}" x="-30%" y="-15%" width="160%" height="135%" color-interpolation-filters="sRGB">`
  + `<feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="d"/>`
  + `<feGaussianBlur in="d" stdDeviation=".5" result="d2"/>`
  + `<feComponentTransfer in="d2" result="border"><feFuncA type="linear" slope="3" intercept="-.6"/></feComponentTransfer>`
  + `<feFlood flood-color="${C.standeeCard}"/><feComposite in2="border" operator="in" result="white"/>`
  + `<feMorphology in="border" operator="dilate" radius=".6" result="cut0"/><feComposite in="cut0" in2="border" operator="out" result="cutA"/>`
  + `<feFlood flood-color="${C.standeeCut}" flood-opacity=".9"/><feComposite in2="cutA" operator="in" result="cut"/>`
  + `<feGaussianBlur in="border" stdDeviation="3.5" result="sb"/><feOffset in="sb" dx="3" dy="5" result="so"/>`
  + `<feFlood flood-color="${C.shadow}" flood-opacity=".45"/><feComposite in2="so" operator="in" result="soft"/>`
  + `<feGaussianBlur in="border" stdDeviation=".8" result="cb"/><feOffset in="cb" dx="1" dy="1.6" result="co"/>`
  + `<feFlood flood-color="${C.shadow}" flood-opacity=".6"/><feComposite in2="co" operator="in" result="contact"/>`
  + `<feMerge><feMergeNode in="soft"/><feMergeNode in="contact"/><feMergeNode in="white"/><feMergeNode in="cut"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

/** The tunnel-book depths (bible § 2.2 table). */
export const DEPTHS = [0, 1, 2, 3, 4, 5] as const;
export type Depth = (typeof DEPTHS)[number];

/** Filter defs, by local name. Emitted only when `ctx.filters` is set. */
export const FILTER_DEFS = {
  z0: (id: string) => depthFilter(id, 0),
  z1: (id: string) => depthFilter(id, 1),
  z2: (id: string) => depthFilter(id, 2),
  z3: (id: string) => depthFilter(id, 3),
  z4: (id: string) => depthFilter(id, 4),
  z5: (id: string) => depthFilter(id, 5),
  grain: grainFilter,
  mottle: mottleFilter,
  deckle: (id: string) => displace(id, 0.45, 11, 3.2, 'x="-5%" y="-5%" width="110%" height="110%"'),
  torn: (id: string) => displace(id, 0.6, 5, 5, 'x="-5%" y="-10%" width="110%" height="120%"'),
  glow: (id: string) =>
    `<filter id="${id}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
  glowS: (id: string) =>
    `<filter id="${id}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.6" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
  blur3: (id: string) => blur(id, 3, 50),
  blur8: (id: string) => blur(id, 8, 50),
  blur18: (id: string) => blur(id, 18, 80),
  standee: standeeFilter,
} as const satisfies Record<string, (id: string) => string>;

/** A soft radial blob for a colour: the filter-free stand-in for a blurred ellipse. */
const soft = (id: string, color: string) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}"/><stop offset=".45" stop-color="${color}" stop-opacity=".75"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;

const linear = (id: string, list: readonly GradientStop[], dir = 'x1="0" y1="0" x2="0" y2="1"') => `<linearGradient id="${id}" ${dir}>${stops(list)}</linearGradient>`;
const DIAGONAL = 'x1="0" y1="0" x2="1" y2="1"';
const HORIZONTAL = 'x1="0" y1="0" x2="1" y2="0"';

/** Gradient and pattern defs, by local name. Always allowed (no filters). */
export const PAINT_DEFS = {
  vign: (id: string) =>
    `<radialGradient id="${id}" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="${C.vignette}" stop-opacity="0"/><stop offset="1" stop-color="${C.vignette}" stop-opacity=".55"/></radialGradient>`,
  tabG: (id: string) => linear(id, [[0, C.marigoldLight], [0.45, C.marigold], [1, C.marigoldDeep]]),
  tabR: (id: string) =>
    `<radialGradient id="${id}" cx=".38" cy=".32" r=".75">${stops([[0, C.marigoldLight], [0.55, C.marigold], [1, C.marigoldDeep]])}</radialGradient>`,
  foil: (id: string) => linear(id, POPUP_FOIL.gold, DIAGONAL),
  foilH: (id: string) => linear(id, POPUP_FOIL.goldH, HORIZONTAL),
  coin: (id: string) => `<radialGradient id="${id}" cx=".35" cy=".3" r=".8">${stops(POPUP_FOIL.coin)}</radialGradient>`,
  silver: (id: string) => linear(id, POPUP_FOIL.silver, DIAGONAL),
  linen: (id: string) =>
    `<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="${C.cover}"/>`
    + `<path d="M0 .5H4M0 2.5H4" stroke="${C.coverLight}" stroke-width=".7" opacity=".55"/>`
    + `<path d="M.5 0V4M2.5 0V4" stroke="${C.coverDark}" stroke-width=".7" opacity=".6"/></pattern>`,
  ridges: (id: string) =>
    `<pattern id="${id}" width="4" height="10" patternUnits="userSpaceOnUse"><rect width="2" height="10" fill="${C.marigoldEdge}" opacity=".45"/>`
    + `<rect x="2" width="1" height="10" fill="${C.ridgeLight}" opacity=".6"/></pattern>`,
  hatch: (id: string) =>
    `<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" stroke="${C.shadow}" stroke-width="1.2" opacity=".18"/></pattern>`,
  // Paper stocks (bible § 3.1)
  kraft: (id: string) => linear(id, [[0, C.kraft], [1, C.kraftDark]], DIAGONAL),
  nightCard: (id: string) => linear(id, [[0, C.nightCard], [1, C.nightCardDeep]]),
  window: (id: string) => linear(id, [[0, C.windowTop], [0.6, C.windowMid], [1, C.lampAmber]]),
  glassine: (id: string) =>
    `<linearGradient id="${id}" ${DIAGONAL}><stop offset="0" stop-color="${C.standeeCard}" stop-opacity=".55"/><stop offset=".4" stop-color="${C.glassine}" stop-opacity=".25"/>`
    + `<stop offset=".55" stop-color="${C.standeeCard}" stop-opacity=".6"/><stop offset="1" stop-color="${C.glassineDeep}" stop-opacity=".3"/></linearGradient>`,
  foldL: (id: string) => linear(id, [[0, C.foldLit], [1, C.foldLitHigh]], HORIZONTAL),
  foldR: (id: string) => linear(id, [[0, C.foldShade], [1, C.foldShadeHigh]], HORIZONTAL),
  lampPool: (id: string) =>
    `<radialGradient id="${id}" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="${C.lamp}" stop-opacity=".8"/><stop offset="1" stop-color="${C.lampAmber}" stop-opacity="0"/></radialGradient>`,
  tiles: (id: string) =>
    `<pattern id="${id}" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="${C.tile}"/>`
    + `<path d="M15 3l12 12l-12 12l-12 -12z" fill="none" stroke="${C.gold}" stroke-width="1" opacity=".7"/><circle cx="15" cy="15" r="3.5" fill="${C.gold}" opacity=".6"/>`
    + [[0, 0], [30, 0], [0, 30], [30, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${C.tileRose}" opacity=".6"/>`).join('')
    + `</pattern>`,
  corr: (id: string) =>
    `<pattern id="${id}" width="6" height="40" patternUnits="userSpaceOnUse"><rect width="6" height="40" fill="${C.corrugated}"/>`
    + `<rect width="3" height="40" fill="${C.corrugatedDark}"/><rect x="3" width="1" height="40" fill="${C.corrugatedLight}"/></pattern>`,
  // Filter-free soft blobs (shadows, halos, glows) for `filters: false`
  softShadow: (id: string) => soft(id, C.shadow),
  softMarigold: (id: string) => soft(id, C.marigold),
  softLamp: (id: string) => soft(id, C.lamp),
  softFoil: (id: string) => soft(id, C.windowMid),
} as const satisfies Record<string, (id: string) => string>;

export type FilterName = keyof typeof FILTER_DEFS;
export type PaintName = keyof typeof PAINT_DEFS;
export type DefName = FilterName | PaintName;

const isFilter = (name: DefName): name is FilterName => name in FILTER_DEFS;

/**
 * The `<defs>` block for one document: the named defs (all of them by default) with ids scoped by
 * `ctx`. Filter defs are dropped unless `ctx.filters` is set. `extra` is appended inside.
 */
export function kitDefs(ctx: KitCtx, names?: readonly DefName[], extra = ''): string {
  const wanted = names ?? ([...Object.keys(FILTER_DEFS), ...Object.keys(PAINT_DEFS)] as DefName[]);
  const body = wanted
    .filter((name) => ctx.filters || !isFilter(name))
    .map((name) => (isFilter(name) ? FILTER_DEFS[name] : PAINT_DEFS[name])(ctx.id(name)))
    .join('');
  return `<defs>${body}${extra}</defs>`;
}
