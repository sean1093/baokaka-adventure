import { POPUP as C, POPUP_AIRPORT as A, mixHex } from '../../../art/palette';
import { brad, depth, f1, ref, softEllipse, type KitCtx } from '../../art';
import { LEDGE_DEPTH } from '../stage';
import { HOLD, HOLD_BACK, WAVE, adult, circle, join, scaled, stand, type Cut, type Look, type Pose } from './market';
import { C7_RIDERS } from './gondola';
import { chalk, figure, ticks } from './ximen';

/**
 * Chapter 6's cast and riders (松山機場, #124; bible § 5), feet (or decks) at the origin, facing +x.
 *
 * - **The cabin-crew 姊姊** (6-1's carrier) is the paper-style die-cut grown-up of chapter 5's cast
 *   (`adult`), in a navy uniform and a red scarf — no airline's (GDD § 6 risk 11) — with her little
 *   rolling suitcase. She is baked per look (`env/art/c6.ts`, D-85).
 * - **The night herons** (夜鷺, 6-4's flock that roosts on the gangplank) are origami (bible § 5):
 *   hunched grey birds with black caps, the night birds of Taipei's rivers and airfields. Live.
 * - **The riders**: what rides a loop's slots (`riderArt`): 6-2's suitcases on the carousel and
 *   6-6's grey tray on the X-ray belt; and the carriage 6-4's tab telescopes (`bridgeSection`). Live,
 *   flat fills (they move: no filters, GDD § 3.9).
 */

// ——— The cabin-crew 姊姊 ———

/** Her hair: a neat low bun, a side parting. */
const bun = (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 9.8)} ${f1(hy + 2)}q-1.6 -13 9.8 -13q11.4 0 9.8 13q-2 -7 -8 -8.6q-6 2.4 -11.6 8.6z`;
  const knot = circle(hx - 9, hy - 3, 4.4);
  return { outline: `<path d="${d}${knot}"/>`, print: `<path d="${d}${knot}" fill="${C.printDark}"/><path d="M${f1(hx - 4)} ${f1(hy - 9)}q3 -1.6 6 -1" stroke="${C.printLilac}" stroke-width="1" fill="none" opacity=".5"/>` };
};

/** Her uniform: a navy jacket with a red scarf knotted at the neck and a little silver wings pin. */
const CREW: Look = {
  top: A.crew, topDeep: A.crewDeep, bottom: A.crewDeep, shoes: C.printDark, hair: bun, girth: 0.96,
  over: `<path d="M-4 -55l4 6l4 -6l-1 -3h-6z" fill="${A.scarf}"/><path d="M0 -49l-3 7l3 -2l3 2z" fill="${A.scarf}"/>`
    + `<path d="M-10 -26h20" stroke="${A.crewDeep}" stroke-width="1.4"/><path d="M5 -46h6" stroke="${A.steelLight}" stroke-width="1.6" stroke-linecap="round"/>`
    + `<circle cx="-3" cy="-38" r=".9" fill="${A.steelLight}"/><circle cx="-3" cy="-32" r=".9" fill="${A.steelLight}"/>`,
};

/** Her rolling suitcase (unit space): a navy case on two wheels, its handle up or down, the top at −h. */
function trolleyBag(x: number, h: number, handle: boolean): Cut {
  const d = `M${f1(x - 9)} ${f1(-2)}V${f1(-h + 2)}q0 -2 2 -2h14q2 0 2 2V-2z`;
  const grip = handle ? `M${f1(x - 4)} ${f1(-h)}v-12h8v12` : '';
  return {
    outline: `<path d="${d}"/>${handle ? `<path d="M${f1(x - 5)} ${f1(-h - 13)}h10v13h-10z"/>` : ''}`,
    print: (handle ? `<path d="${grip}" stroke="${A.steelDeep}" stroke-width="1.6" fill="none"/>` : '')
      + `<path d="${d}" fill="${A.tail}"/><path d="M${f1(x - 9)} ${f1(-h / 2)}h18" stroke="${A.tailDeep}" stroke-width="1.2"/>`
      + `<path d="M${f1(x - 6)} ${f1(-h + 4)}v${f1(h - 8)}" stroke="${C.cutRim}" stroke-width=".8" opacity=".4"/>`
      + `<path d="${circle(x - 6, 0, 1.8)}${circle(x + 6, 0, 1.8)}" fill="${C.printDark}"/>`,
  };
}

/**
 * The cabin-crew 姊姊 (6-1; a carrier, 141 tall), on her way to work. `idle`: dozing sat on her
 * rolling suitcase by the doors, head nodding, chalk 「Zzz」; `carrying`: holding him at her hip, the
 * suitcase's handle in her other hand (she carries him off the train); `back`: carrying him back;
 * `done`: standing on the platform, waving him off, her case beside her.
 */
export function crewArt(ctx: KitCtx, look: 'idle' | 'carrying' | 'back' | 'done'): string {
  const k = 1.86;
  if (look === 'idle') {
    // Sat on the case: thighs forward at its top (18 up), shins down, hands in her lap, chin down
    const pose: Pose = { kneeB: [14, -28], footB: [16, -11], kneeF: [18, -28], footF: [20, -11], elbowB: [-2, -38], handB: [8, -31], elbowF: [6, -40], handF: [12, -31], eyes: 'shut', mouth: 'none', lean: 8 };
    const sat = scaled(adult(CREW, pose), k, false, -12, 11 * k);
    const bag = scaled(trolleyBag(-6, 18, false), k, false, -12);
    return softEllipse(ctx, -8, 1, 30, 3.4, 'shadow', 0.42) + figure(bag.outline + sat.outline, bag.print + sat.print)
      + chalk(4, -136, 'z', 11) + chalk(14, -150, 'Z', 15);
  }
  if (look === 'done') {
    const body = join(trolleyBag(-18, 22, true), adult(CREW, WAVE));
    return stand(ctx, body, k, false, 24) + chalk(26, -158, '掰掰～', 11);
  }
  const pose = look === 'carrying' ? HOLD : HOLD_BACK;
  return stand(ctx, join(trolleyBag(look === 'carrying' ? -18 : 18, 22, true), adult(CREW, pose)), k, false, 24);
}

// ——— The night herons ———

/** The unit heron's pieces (facing +x, feet at the origin): one path per colour across the flock. */
const HERON = {
  body: 'M-14 -8L-4 -18L8 -16L12 -10L6 -2L-8 0Z',
  wing: 'M-4 -18L0 -2L6 -2L8 -16Z',
  head: 'M6 -16L8 -24L15 -24L17 -18L12 -12Z',
  cap: 'M8 -24L15 -24L14 -21L8 -20Z',
  tail: 'M-14 -8L-20 -6L-15 -4Z',
  beak: 'M17 -19L23 -18L17 -16.4Z',
} as const;

/** A unit path moved to (x, y), scaled by `s`, mirrored when `flip`. */
function placed(d: string, x: number, y: number, s: number, flip: boolean): string {
  return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, a: string, b: string) => `${f1(x + Number(a) * s * (flip ? -1 : 1))} ${f1(y + Number(b) * s)}`);
}

/**
 * 6-4's flock of night herons (夜鷺; a creature at `roost`, the gangplank's inner end): three hunched
 * origami herons in a row — grey folded bodies, darker wings, white faces under black caps, a red
 * eye — asleep on the plank, chalk 「zz」; `sky`, the flock up and away, wings spread. One path per
 * colour for the whole flock (the animated budget).
 */
export function nightHerons(ctx: KitCtx, pos = 'roost'): string {
  if (pos === 'sky') {
    const flyer = (x: number, y: number, s: number) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-10 0L0 -4L12 -2L0 2Z" fill="${A.heron}"/><path d="M-2 -2L-10 -14L4 -3ZM0 0L-6 10L6 1Z" fill="${A.heronDeep}"/><path d="M12 -2l5 0l-5 1.4z" fill="${C.printDark}"/></g>`;
    return depth(ctx, 4, flyer(-14, -40, 1) + flyer(8, -52, 0.9) + flyer(24, -34, 0.8), `<rect x="-26" y="-66" width="60" height="44"/>`) + ticks('M-30 -30l-6 -2M-28 -22h-6');
  }
  const flock: [number, number, number, boolean][] = [[-16, 0, 1, true], [2, -1, 1.06, false], [20, 0, 0.94, false]];
  const all = (d: string) => flock.map(([x, y, k, flip]) => placed(d, x, y, k, flip)).join('');
  const eyes = flock.map(([x, y, k, flip]) => circle(x + 13 * k * (flip ? -1 : 1), y - 20 * k, 1)).join('');
  const legs = flock.map(([x, y]) => `M${x - 1} ${y}v4M${x + 3} ${y}v4`).join('');
  const outline = `<path d="${all(HERON.body)}${all(HERON.head)}"/>`;
  return softEllipse(ctx, 2, 1, 30, 3, 'shadow', 0.4)
    + depth(ctx, 4, `<path d="${all(HERON.body)}" fill="${A.heron}"/><path d="${all(HERON.wing)}${all(HERON.tail)}" fill="${A.heronDeep}"/>`
      + `<path d="${all(HERON.head)}" fill="${A.white}"/><path d="${all(HERON.cap)}${all(HERON.beak)}" fill="${A.heronCap}"/><path d="${eyes}" fill="${A.wingRed}"/>`
      + `<path d="${legs}" stroke="${C.printDark}" stroke-width="1.2"/><path d="${all('M-4 -18L0 -2')}" stroke="${C.cutRim}" stroke-width=".6" opacity=".6"/>`, outline)
    + chalk(18, -32, 'zz', 9);
}

// ——— Riders and the bridge's section ———

/**
 * A rider on a loop's slot, its origin where the rider's node is (the top it carries Baokaka or
 * Mocha on). 6-2: `S` his suitcase (a big blue hard case lying flat, its handle and a luggage tag),
 * `caseB` Mocha's (a smaller red soft bag, 16 higher: its node is its top); 6-6: `T` the grey
 * X-ray tray.
 */
export type RiderArt = (ctx: KitCtx) => string;

function suitcase(ctx: KitCtx, w: number, h: number, fill: string, deep: string, tag: string): string {
  const body = `M${-w / 2} ${h}V3q0 -3 3 -3h${w - 6}q3 0 3 3V${h}z`;
  return softEllipse(ctx, 0, h + 1, w * 0.55, 3, 'shadow', 0.4)
    + depth(ctx, 4, `<path d="${body}" fill="${fill}"/><path d="M${-w / 2} ${f1(h * 0.45)}h${w}" stroke="${deep}" stroke-width="1.4"/>`
      + `<path d="M${-w / 2 + 6} 1.6h${w - 12}" stroke="${C.cutRim}" stroke-width=".8" opacity=".45"/>`
      + `<path d="M-6 0v-4h12v4" stroke="${C.printDark}" stroke-width="2" fill="none"/>`
      + `<path d="M${w / 2 - 6} 4l5 7h-6z" fill="${tag}"/>`, `<path d="${body}"/>`);
}

const RIDERS: Readonly<Record<string, RiderArt>> = {
  'c6/carousel-belt:S': (ctx) => suitcase(ctx, 44, 14, A.tail, A.tailDeep, C.washi),
  'c6/carousel-belt:caseB': (ctx) => suitcase(ctx, 34, 16, A.scarf, mixHex(A.scarf, C.shadow, 0.35), A.white),
  'c6/xray-belt:T': (ctx) => softEllipse(ctx, 0, 6, 26, 3, 'shadow', 0.4)
    + depth(ctx, 4, `<path d="M-24 -2H24L20 6H-20Z" fill="${A.steel}"/><path d="M-24 -2H24" stroke="${A.steelLight}" stroke-width="1.4"/><path d="M-18 2H18" stroke="${A.steelDeep}" stroke-width=".8"/>`, `<path d="M-24 -2H24L20 6H-20Z"/>`),
  // Chapter 7's gondola cabins (#125; placeholders until #126)
  ...C7_RIDERS,
};

/** The rider drawn on loop `key`'s node `node`, or null. */
export const riderArt = (key: string, node: string): RiderArt | null => RIDERS[`${key}:${node}`] ?? null;

/**
 * 6-4's telescoping section (the carriage the `extend` tab moves): a slimmer steel tunnel sliding out
 * of the fixed one — its back wall with a window, the ribbed roof, the floor plate at the deck —
 * drawn from the card's top-left (its deck at y 0), `w` wide, and the linked brad.
 */
export function bridgeSection(ctx: KitCtx, w: number, linked: boolean): string {
  const h = LEDGE_DEPTH - 4;
  return depth(ctx, 3, `<rect x="0" y="-52" width="${w}" height="52" fill="${mixHex(A.steel, A.steelDeep, 0.25)}"/>`
    + `<rect x="-2" y="-58" width="${w + 4}" height="7" rx="2" fill="${A.steelLight}"/><path d="M-2 -57.2H${w + 2}" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`
    + `<rect x="8" y="-44" width="${w - 16}" height="18" rx="3" fill="${A.glassDeep}"/><path d="M${f1(w / 2)} -44v18" stroke="${A.steelDeep}" stroke-width="2"/>`
    + `<rect x="0" y="0" width="${w}" height="${h}" fill="${A.steelDeep}"/><path d="M0 0.6H${w}" stroke="${A.steelLight}" stroke-width="1.2"/>`
    + `<path d="M0 -52V${h}M${w} -52V${h}" stroke="${A.steelDeep}" stroke-width="2"/>`, `<rect x="-2" y="-58" width="${w + 4}" height="${58 + h}"/>`)
    + `<rect x="2" y="-8" width="${w - 4}" height="8" fill="${ref(ctx, 'window')}" opacity=".18"/>`
    + (linked ? brad(ctx, w / 2, h - 7, 4, true) : '');
}
