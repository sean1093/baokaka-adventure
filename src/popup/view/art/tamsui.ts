import { POPUP as C, POPUP_BEITOU as B, POPUP_MARKET as M, POPUP_TAMSUI as W, mixHex } from '../../../art/palette';
import { depth, f1, softEllipse, type KitCtx } from '../../art';
import { HOLD, HOLD_BACK, WAVE, adult, circle, join, stand, type Cut, type Look, type Pose } from './market';
import type { RiderArt } from './riders';
import { chalk } from './ximen';

/**
 * Chapter 9's cast and riders (淡水, #131; drawn in the chapter's kit by #132), feet at the origin,
 * facing +x. Real people are never depicted (GDD § 6 risk 11): generic, friendly types.
 *
 * - **The 鐵蛋阿婆** (9-2's carrier, baked per look by `env/art/c9.ts`): chapter 5's paper-style
 *   die-cut grown-up (`adult`) with a grey bun, a plum blouse under a navy apron, 藍白拖, a little
 *   paper bag of 鐵蛋 in her hand.
 * - **9-6's net basket** (a rider on the fishing boat's derrick, `riders.ts`).
 * - **The gulls** (9-5 on the bridge's stay cables, 9-6 on the fishing boat's deck) and **9-1's
 *   sparrows** on the car's window sill: origami (bible § 5), folded paper in three tones with a crease
 *   line, one path per tone for the whole flock (the animated budget); `sky`, the flock up and away.
 */

/** Her grey hair pulled back into a bun. */
const greyBun = (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 10)} ${f1(hy + 3)}q-1.4 -13 10 -13q11.4 0 10 13q-2 -7 -10 -7.4q-8 .4 -10 7.4z`;
  const bun = circle(hx - 9, hy - 4, 4.4);
  return { outline: `<path d="${d}${bun}"/>`, print: `<path d="${bun}${d}" fill="${mixHex(C.printLilac, C.washi, 0.3)}"/>` };
};

const GRANNY: Look = {
  top: B.blouse, topDeep: B.blouseDeep, bottom: C.printDark, shoes: M.slipperBlue, sole: M.undershirt, girth: 1.1,
  hair: greyBun,
  // Her navy apron, its pocket
  over: `<path d="M-10 -28Q-11 -40 -8 -46H8Q11 -40 10 -28Z" fill="${M.apron}"/><rect x="-5" y="-40" width="10" height="6" rx="1" fill="${M.apronDeep}"/>`,
};

/** A little brown paper bag of 鐵蛋 hung from her hand at (x, y). */
function eggBag(x: number, y: number): Cut {
  const d = `M${f1(x - 5)} ${f1(y)}h10l-1 11h-8z`;
  return { outline: `<path d="${d}"/>`, print: `<path d="${d}" fill="${C.kraft}"/><path d="M${f1(x - 5)} ${f1(y + 2.4)}h10" stroke="${C.kraftDark}" stroke-width=".8"/>` };
}

/**
 * The 鐵蛋阿婆 (9-2; a carrier, about 140 tall). `idle`: dozing on her feet at her counter, chin down,
 * chalk 「Zzz」; `carrying`: lifting him onto the counter; `back`; `done`: waving, 「乖孫～」.
 */
export function ironEggGrannyArt(ctx: KitCtx, look: 'idle' | 'carrying' | 'back' | 'done'): string {
  const k = 1.84;
  if (look === 'idle') {
    const pose: Pose = { footB: [-5, 0], footF: [5, 0], elbowB: [-11, -40], handB: [-8, -30], elbowF: [11, -40], handF: [8, -30], eyes: 'shut', mouth: 'o', lean: 5 };
    return stand(ctx, join(eggBag(-8, -30), adult(GRANNY, pose)), k, false, 22) + chalk(14, -146, 'z', 11) + chalk(24, -160, 'Z', 15);
  }
  if (look === 'done') return stand(ctx, adult(GRANNY, WAVE), k, false, 22) + chalk(24, -150, '乖孫～', 11);
  return stand(ctx, adult(GRANNY, look === 'carrying' ? HOLD : HOLD_BACK), k, false, 22);
}

// ——— Creatures ———

/** A unit path moved to (x, y), scaled by `s`, mirrored when `flip`. */
function placed(d: string, x: number, y: number, s: number, flip = false): string {
  return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, a: string, b: string) => `${f1(x + Number(a) * s * (flip ? -1 : 1))} ${f1(y + Number(b) * s)}`);
}

/** An origami gull standing, facing +x, feet at (0, 0): white folded body and head, a grey back, a dark wing tip. */
const GULL = {
  body: 'M-15 -10L-3 -16L9 -14L12 -8L4 -2L-10 -3Z',
  back: 'M-15 -10L-3 -16L4 -9L-6 -6Z',
  tip: 'M-15 -10L-22 -12L-17 -7Z',
  head: 'M7 -14L9 -22L15 -22L17 -16L12 -10Z',
  bill: 'M16.4 -18.6L22 -17.4L16.6 -16Z',
  crease: 'M-3 -16L4 -9',
} as const;

/** A gull in flight, wings up (origami), centred on (0, 0). */
const FLYING_GULL = 'M-2 0L-14 -10L-4 -4L0 -6L4 -4L14 -10L2 0Z';

/** Where the gulls stand at each roost: 9-5's on the three stay cables (on their 45° lines), 9-6's along the deck. */
const GULL_ROOSTS: Readonly<Record<string, readonly (readonly [number, number, number, boolean])[]>> = {
  // From the roost node (196, 238): one on Sol (x + y = 368), one on La (406), one on Do (444)
  cables: [[-70, 4, 0.95, false], [-20, -8, 1, true], [30, -20, 0.9, false]],
  rail: [[-18, 0, 1, false], [2, -2, 1.06, true], [20, 0, 0.94, false]],
};

/**
 * The gulls (9-5 `cables`, 9-6 `rail`): three origami gulls dozing, heads tucked a little, chalk 「zz」 —
 * on 9-5 one on each of the stay cables they mute; `sky`, the flock wheeling up and away.
 */
export function gulls(ctx: KitCtx, pos = 'rail'): string {
  if (pos === 'sky') {
    const flyers = [[-14, -46, 1], [8, -58, 0.85], [24, -40, 0.7]].map(([x, y, k]) => placed(FLYING_GULL, x, y, k)).join('');
    return depth(ctx, 4, `<path d="${flyers}" fill="${W.gull}"/><path d="${[[-14, -46, 1], [8, -58, 0.85], [24, -40, 0.7]].map(([x, y, k]) => placed('M-14 -10L-11 -8L-12 -11Z M14 -10L11 -8L12 -11Z', x, y, k)).join('')}" fill="${W.gullWing}"/>`, `<rect x="-30" y="-72" width="66" height="40"/>`);
  }
  const flock = GULL_ROOSTS[pos] ?? GULL_ROOSTS.rail;
  const all = (d: string) => flock.map(([x, y, k, flip]) => placed(d, x, y, k, flip)).join('');
  const eyes = flock.map(([x, y, k, flip]) => `M${f1(x + 12.5 * k * (flip ? -1 : 1) - 1)} ${f1(y - 18 * k)}h2`).join('');
  const legs = flock.map(([x, y]) => `M${f1(x - 1)} ${f1(y - 3)}v3M${f1(x + 3)} ${f1(y - 3)}v3`).join('');
  return softEllipse(ctx, 2, 1, pos === 'cables' ? 8 : 28, 2.4, 'shadow', pos === 'cables' ? 0 : 0.35)
    + depth(ctx, 4, `<path d="${all(GULL.body)}${all(GULL.head)}" fill="${W.gull}"/><path d="${all(GULL.back)}" fill="${W.gullGrey}"/><path d="${all(GULL.tip)}" fill="${W.gullWing}"/>`
      + `<path d="${all(GULL.bill)}" fill="${W.gullBill}"/><path d="${legs}" stroke="${W.gullBill}" stroke-width="1.2"/>`
      + `<path d="${eyes}" stroke="${C.ink}" stroke-width="1" stroke-linecap="round"/><path d="${all(GULL.crease)}" stroke="${C.cutRim}" stroke-width=".6" opacity=".7"/>`, `<path d="${all(GULL.body)}${all(GULL.head)}"/>`)
    + chalk(flock[2][0] + 6, flock[2][1] - 28, 'zz', 9);
}

/** An origami sparrow sitting, facing +x, feet at (0, 0): a brown folded body, a darker cap and wing, a pale cheek. */
const SPARROW = {
  body: 'M-9 -4L-3 -11L5 -10L8 -5L4 0L-6 0Z',
  wing: 'M-3 -11L-9 -4L-2 -3L2 -9Z',
  head: 'M3 -10L5 -15L10 -15L11 -10L7 -7Z',
  tail: 'M-9 -4L-15 -8L-13 -2Z',
  cheek: 'M6 -11L10 -11L9 -9Z',
  beak: 'M10.6 -12.6L13.4 -12L10.8 -11Z',
} as const;

/** 9-1's sparrows on the window sill (`sill`), asleep in a row; `sky`, flown out of the window. */
export function sparrows(ctx: KitCtx, pos = 'sill'): string {
  if (pos === 'sky') {
    const d = [[-10, -40, 0.8], [6, -50, 0.7], [18, -36, 0.6]].map(([x, y, k]) => placed(FLYING_GULL, x, y, k)).join('');
    return depth(ctx, 4, `<path d="${d}" fill="${W.sparrow}"/>`, `<rect x="-24" y="-60" width="52" height="34"/>`);
  }
  const flock: readonly (readonly [number, number, number, boolean])[] = [[-16, 0, 1, false], [0, 0, 1.1, true], [15, 0, 0.92, false]];
  const all = (d: string) => flock.map(([x, y, k, flip]) => placed(d, x, y, k, flip)).join('');
  return softEllipse(ctx, 0, 1, 24, 2.2, 'shadow', 0.35)
    + depth(ctx, 4, `<path d="${all(SPARROW.body)}${all(SPARROW.tail)}" fill="${W.sparrow}"/><path d="${all(SPARROW.wing)}${all(SPARROW.head)}" fill="${W.sparrowDeep}"/>`
      + `<path d="${all(SPARROW.cheek)}" fill="${W.sparrowBelly}"/><path d="${all(SPARROW.beak)}" fill="${C.printDark}"/>`
      + `<path d="${all('M-3 -11L2 -9')}" stroke="${C.cutRim}" stroke-width=".6" opacity=".6"/>`, `<path d="${all(SPARROW.body)}${all(SPARROW.head)}"/>`)
    + chalk(20, -22, 'zz', 8);
}

// ——— Riders ———

/**
 * 9-6's net basket on the fishing boat's derrick (a rider, drawn at its node: origin at the basket's
 * floor, where Baokaka sits): a round fish basket of netting hung on four ropes from the boom's hook.
 * Live, flat fills (it moves: no filters, GDD § 3.9).
 */
function netBasket(ctx: KitCtx): string {
  const basket = 'M-24 -10H24L19 8H-19Z';
  let mesh = '';
  for (let x = -20; x <= 20; x += 8) mesh += `M${x} -10L${f1(x * 0.8)} 8`;
  return softEllipse(ctx, 0, 10, 22, 3, 'shadow', 0.3)
    + `<path d="M-22 -10L0 -40L22 -10M-8 -10L0 -40L8 -10" stroke="${C.kraftDark}" stroke-width="1.2" fill="none"/><circle cy="-42" r="3" fill="${C.printDark}"/>`
    + `<path d="${basket}" fill="${C.kraft}"/><path d="${mesh}M-23 -4H23M-21 2H21" stroke="${C.kraftDark}" stroke-width="1" fill="none"/>`
    + `<path d="M-24 -10H24" stroke="${C.woodDeep}" stroke-width="2.2"/>`;
}

export const TAMSUI_RIDERS: Readonly<Record<string, RiderArt>> = {
  'c9/derrick:B': netBasket,
};
