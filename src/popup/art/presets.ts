import { POPUP as C } from '../../art/palette';
import type { PartPreset } from '../core/types';
import { kitDefs, type DefName } from './defs';
import { depth, scallopBand, softEllipse } from './paper';
import { f1, ref, type KitCtx } from './svg';
import { brad, flap, pullTab, seal, slider, wheel, wheelRim, VERBS } from './touchables';

/**
 * Default kit art for every GDD part preset (GDD § 2.1 Part presets; popup art bible § 4, § 10
 * item 1): the placeholder every page shows until a part has its own art key and baked bitmap.
 *
 * Only the player-driven presets (tab, slider, wheel, flap, and a loop with a crank) are marigold
 * with a verb seal; everything event-driven or weight-driven is printed card, so the grandparent
 * rule holds from the first page (bible § 4). Each drawing is in the part's local space (anchors
 * in `PRESET_ART`) and shows its idle look; `state` only changes what a single bitmap would show
 * differently (a flap's lifted corner, a light on or off), since the view moves parts by transform.
 */

/** The preset list is owned by core (`PartDef['preset']`, #80); art only re-exports it (D-40). */
export { PART_PRESETS, type PartPreset } from '../core/types';

export type PartArtOptions = {
  /** The part's current state (defaults to the first) */
  state?: string;
  /** All of the part's states, in order */
  states?: readonly string[];
  /** Whether the player can drive it (a loop's crank is marigold only when it is) */
  touchable?: boolean;
};

export type Box = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

export type PresetArt = {
  readonly preset: PartPreset;
  /** Marigold + seal: the player moves it with a finger (bible § 4) */
  readonly touchable: boolean | 'optional';
  /** The verb on its seal, for touchables */
  readonly verb?: string;
  /** Where the drawing's origin sits on the part */
  readonly anchor: string;
  /** The drawing's bounds in local space (including cues and shadow), for layout */
  readonly box: Box;
  readonly draw: (ctx: KitCtx, opts: PartArtOptions) => string;
};

/** The defs any preset drawing may reference. */
export const PRESET_DEFS: readonly DefName[] = ['z3', 'z4', 'deckle', 'blur3', 'blur8', 'tabG', 'tabR', 'foil', 'coin', 'ridges', 'kraft', 'nightCard', 'window', 'corr', 'softShadow', 'softMarigold', 'softLamp'];

/** The state's index in `states` (0 when unknown) and its fraction along them (0–1). */
export function stateIndex({ state, states }: PartArtOptions): { index: number; count: number; t: number } {
  const count = Math.max(1, states?.length ?? 1);
  const index = Math.max(0, state && states ? states.indexOf(state) : 0);
  return { index, count, t: count > 1 ? index / (count - 1) : 0 };
}

/** A printed (non-touchable) disc: grey-lilac card, a scalloped rim, spokes and a pointer. */
function printedDisc(ctx: KitCtx, r: number, rot: number): string {
  const rim = wheelRim(r, 12);
  const spokes = [0, 45, 90, 135].map((a) => `<path d="M${f1(-r * 0.62)} 0H${f1(r * 0.62)}" transform="rotate(${a})"/>`).join('');
  const body = `<g transform="rotate(${f1(rot)})"><path d="${rim}" fill="${C.printLilac}"/>`
    + `<circle r="${f1(r * 0.72)}" fill="none" stroke="${C.printLilacDeep}" stroke-width="1.4"/>`
    + `<g stroke="${C.printLilacDeep}" stroke-width="1.2" opacity=".7">${spokes}</g>`
    + `<path d="M0 ${f1(-r * 0.95)}l5 9h-10z" fill="${C.cover}"/></g>`;
  return depth(ctx, 3, body, `<path d="${rim}" transform="rotate(${f1(rot)})"/>`) + brad(ctx, 0, 0, r * 0.16);
}

/** A die-cut placeholder figure: card silhouette, warm-white border, cut line, easel, floor shadow. */
function figure(ctx: KitCtx, h: number): string {
  const head = h * 0.2;
  const shape = `<circle cy="${f1(-h + head)}" r="${f1(head)}"/><path d="M${f1(-h * 0.24)} 0Q${f1(-h * 0.28)} ${f1(-h * 0.62)} 0 ${f1(-h * 0.62)}Q${f1(h * 0.28)} ${f1(-h * 0.62)} ${f1(h * 0.24)} 0Z"/>`;
  return softEllipse(ctx, 4, 2, h * 0.26, 3, 'shadow', 0.5)
    + `<path d="M${f1(-h * 0.08)} 1L${f1(-h * 0.05)} ${f1(-h * 0.2)}H${f1(h * 0.05)}L${f1(h * 0.14)} 3Z" fill="${C.easel}" opacity=".9"/>`
    + `<g fill="${C.standeeCard}" stroke="${C.standeeCut}" stroke-width="7.6" stroke-linejoin="round">${shape}</g>`
    + `<g fill="${C.standeeCard}" stroke="${C.standeeCard}" stroke-width="6.4" stroke-linejoin="round">${shape}</g>`
    + `<g fill="${C.kraft}">${shape}</g>`
    + `<path d="M${f1(-h * 0.12)} ${f1(-h * 0.36)}h${f1(h * 0.24)}" stroke="${C.kraftDark}" stroke-width="2" stroke-linecap="round"/>`;
}

const card = (ctx: KitCtx, z: 3 | 4, x: number, y: number, w: number, h: number, fill: string, rx = 3) =>
  depth(ctx, z, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`);

/** The default art for each preset. */
export const PRESET_ART: Readonly<Record<PartPreset, PresetArt>> = {
  tab: {
    preset: 'tab',
    touchable: true,
    verb: VERBS.tab,
    anchor: 'the card’s top-left; the track runs +x',
    box: { x: -18, y: -6, w: 178, h: 60 },
    draw: (ctx) => pullTab(ctx, 0, 0, { w: 96, h: 40, track: 60 }),
  },
  slider: {
    preset: 'slider',
    touchable: true,
    verb: VERBS.slider,
    anchor: 'the slot’s left end; the slot runs +x for 120',
    box: { x: -38, y: -36, w: 166, h: 60 },
    draw: (ctx, opts) => slider(ctx, 0, 0, 120, 0.1 + stateIndex(opts).t * 0.8),
  },
  wheel: {
    preset: 'wheel',
    touchable: true,
    verb: VERBS.wheel,
    anchor: 'the pivot (brad)',
    box: { x: -40, y: -46, w: 88, h: 96 },
    draw: (ctx, opts) => {
      const { index, count } = stateIndex(opts);
      const face = `<path d="M0 -22l6 10h-12z" fill="${C.marigoldEdge}" opacity=".7"/>`;
      return wheel(ctx, 0, 0, 32, { teeth: 18, rot: count > 1 ? (index * 360) / count : 0, face });
    },
  },
  flap: {
    preset: 'flap',
    touchable: true,
    verb: VERBS.flap,
    anchor: 'the card’s top-left (the hinge is its top edge)',
    box: { x: -2, y: -2, w: 92, h: 92 },
    draw: (ctx, opts) => flap(ctx, 0, 0, 70, 56, { open: opts.state === 'open' ? 1 : 0 }),
  },
  section: {
    preset: 'section',
    touchable: false,
    anchor: 'the pivot',
    box: { x: -40, y: -40, w: 86, h: 88 },
    draw: (ctx, opts) => {
      const { index, count } = stateIndex(opts);
      return printedDisc(ctx, 32, count > 1 ? (index * 360) / count : 0);
    },
  },
  gate: {
    preset: 'gate',
    touchable: false,
    anchor: 'the left post’s foot; the gate spans 80 × 64 upward',
    box: { x: -2, y: -66, w: 92, h: 76 },
    draw: (ctx, opts) => {
      const open = opts.state === 'open';
      const leaf = (x: number, w: number) => card(ctx, 3, x, -42, w, 24, `${ref(ctx, 'nightCard')}`, 4);
      const leaves = open ? leaf(12, 7) + leaf(61, 7) : leaf(12, 27) + leaf(41, 27);
      return card(ctx, 3, 0, -64, 12, 64, ref(ctx, 'kraft'), 2) + card(ctx, 3, 68, -64, 12, 64, ref(ctx, 'kraft'), 2) + leaves
        + `<circle cx="6" cy="-56" r="3" fill="${open ? C.lamp : C.printDark}"/><circle cx="74" cy="-56" r="3" fill="${open ? C.lamp : C.printDark}"/>`;
    },
  },
  button: {
    preset: 'button',
    touchable: false,
    anchor: 'the plate’s centre on the floor',
    box: { x: -32, y: -16, w: 66, h: 26 },
    draw: (ctx, opts) => {
      const down = opts.state === 'down';
      const top = down ? -4 : -11;
      return `<ellipse cy="2" rx="30" ry="7" fill="${C.kraftDark}"/>`
        + card(ctx, 3, -22, top, 44, down ? 6 : 13, C.printLilac, 5)
        + `<path d="M-12 ${top + 3}h24" stroke="${C.printLilacDeep}" stroke-width="1.4" stroke-linecap="round"/>`
        + (down ? '' : `<path d="M-4 -24l4 5l4 -5" fill="none" stroke="${C.chalk}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`);
    },
  },
  lift: {
    preset: 'lift',
    touchable: false,
    anchor: 'the platform’s top centre (stand here); cords rise 60',
    box: { x: -40, y: -66, w: 84, h: 88 },
    draw: (ctx) =>
      `<path d="M-30 -60V0M30 -60V0" stroke="${C.kraftDark}" stroke-width="1.6"/>`
      + brad(ctx, -30, -60, 4) + brad(ctx, 30, -60, 4)
      + depth(ctx, 3, `<rect x="-36" y="0" width="72" height="16" rx="2" fill="${ref(ctx, 'kraft')}"/><rect x="-36" y="0" width="72" height="5" fill="${ref(ctx, 'corr')}"/>`, `<rect x="-36" y="0" width="72" height="16" rx="2"/>`),
  },
  loop: {
    preset: 'loop',
    touchable: 'optional',
    verb: VERBS.wheel,
    anchor: 'the belt’s top-left; the belt is 120 × 40, the crank sits on its right end',
    box: { x: -4, y: -22, w: 162, h: 72 },
    draw: (ctx, opts) => {
      const { count, index } = stateIndex(opts);
      const n = Math.max(3, count);
      const slots = Array.from({ length: n }, (_, i) => {
        const x = 12 + ((i + index) % n) * (96 / (n - 1 || 1));
        return `<rect x="${f1(x - 7)}" y="-6" width="14" height="10" rx="2" fill="${C.standeeCard}"/>`;
      }).join('');
      const belt = card(ctx, 3, 0, 0, 120, 40, ref(ctx, 'kraft'), 20)
        + `<rect x="10" y="10" width="100" height="20" rx="10" fill="${C.kraftDark}"/>${slots}`;
      const crank = opts.touchable === false
        ? brad(ctx, 120, 20, 6)
        : wheel(ctx, 128, 20, 14, { teeth: 10, label: '' }) + seal(ctx, 140, 34, VERBS.wheel, 11);
      return belt + crank;
    },
  },
  pushable: {
    preset: 'pushable',
    touchable: false,
    anchor: 'the object’s centre',
    box: { x: -16, y: -16, w: 34, h: 34 },
    draw: (ctx) =>
      softEllipse(ctx, 2, 13, 11, 3, 'shadow', 0.45)
      + depth(ctx, 4, `<circle r="12" fill="${ref(ctx, 'coin')}"/>`, `<circle r="12"/>`)
      + `<circle r="8.5" fill="none" stroke="${C.coinRing}" stroke-width=".9" opacity=".6"/><circle cx="-4" cy="-4" r="3" fill="${C.brassShine}" opacity=".85"/>`,
  },
  light: {
    preset: 'light',
    touchable: false,
    anchor: 'the lantern’s centre',
    box: { x: -34, y: -34, w: 68, h: 68 },
    draw: (ctx, opts) => {
      const on = opts.state === 'on';
      return (on ? softEllipse(ctx, 0, 0, 22, 24, 'lamp', 0.5, 'blur8') : '')
        + card(ctx, 3, -17, -22, 34, 44, C.lampFacade, 4)
        + `<rect x="-12" y="-17" width="24" height="34" rx="2" fill="${on ? ref(ctx, 'window') : C.vellum}"${on ? '' : ' opacity=".55"'}/>`
        + `<path d="M0 -17V17M-12 0H12" stroke="${C.lampFacade}" stroke-width="1.6"/>`;
    },
  },
  blowable: {
    preset: 'blowable',
    touchable: false,
    anchor: 'the cloud’s bottom-left',
    box: { x: -4, y: -44, w: 96, h: 50 },
    draw: (ctx, opts) => {
      const { t } = stateIndex(opts);
      const d = scallopBand(0, 84, -22 - t * 6, 0, 31, 8, 22);
      return depth(ctx, 3, `<path d="${d}" fill="${C.vellum}" opacity=".72"/><path d="${d}" fill="none" stroke="${C.standeeCard}" stroke-width="1.5"/>`, `<path d="${d}"/>`);
    },
  },
  carrier: {
    preset: 'carrier',
    touchable: false,
    anchor: 'the feet (ground line)',
    box: { x: -26, y: -76, w: 56, h: 82 },
    draw: (ctx) => figure(ctx, 70),
  },
  prop: {
    preset: 'prop',
    touchable: false,
    anchor: 'the board’s top-left; 52 × 40',
    box: { x: -2, y: -10, w: 62, h: 60 },
    draw: (ctx, opts) => {
      const { index } = stateIndex(opts);
      const glyph = String(index + 1);
      return card(ctx, 3, 0, 0, 52, 40, C.tile, 4)
        + `<rect x="6" y="6" width="40" height="28" rx="2" fill="${C.page}"/><path d="M6 20H46" stroke="${C.tile}" stroke-width="1.6"/>`
        + `<text x="26" y="29" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="22" fill="${C.ink}">${glyph}</text>`
        + `<path d="M14 0V-8M38 0V-8" stroke="${C.kraftDark}" stroke-width="1.2"/>`;
    },
  },
};

/** One preset's art as a self-contained fragment: its scoped defs plus the drawing. */
export function presetSvg(ctx: KitCtx, preset: PartPreset, opts: PartArtOptions = {}): string {
  return kitDefs(ctx, PRESET_DEFS) + PRESET_ART[preset].draw(ctx, opts);
}
