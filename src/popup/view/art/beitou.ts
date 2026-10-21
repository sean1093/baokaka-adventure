import { POPUP as C, POPUP_BEITOU as B, POPUP_MARKET as M, mixHex } from '../../../art/palette';
import { depth, f1, softEllipse, type KitCtx } from '../../art';
import { HOLD, HOLD_BACK, WAVE, adult, circle, scaled, stand, type Cut, type Look, type Pose } from './market';
import type { RiderArt } from './riders';
import { chalk, figure } from './ximen';

/**
 * Chapter 8's cast and riders (北投, #130; bible § 5), feet at the origin, facing +x. Real people are
 * never depicted (GDD § 6 risk 11): these are generic, friendly types.
 *
 * - **The 泡湯阿伯** (8-1's carrier, baked per look by `env/art/c8.ts`): the paper-style die-cut
 *   grown-up of chapter 5's cast (`adult`) in a white 汗衫, shorts and 藍白拖, a bath towel folded on
 *   his head the way the hot-spring 阿伯 wear it (like the 土地公's this chapter), his little basin
 *   under his arm.
 * - **The 溫泉阿嬤** (8-3): sitting on the bench in a flowered blouse with a towel round her neck, her
 *   grey bun under the straw sun hat, blowing on a hot-spring egg — 「蛋很燙，呼呼再吃。」. She is
 *   drawn with her hat by the hat's part (`c8/granny-hat`, baked: a part lies under the creatures, and
 *   the hat must sit on her head); her creature is the basket of eggs at her feet (`eggBasket`, live).
 * - **8-4's book tray** (a rider on the library's book lift, `riders.ts`).
 */

// ——— Hair ———

/** The 阿伯's bath towel folded flat on top of his head, its blue stripe at the end; his grey tufts over the ears. */
const towelHead = (hx: number, hy: number): Cut => {
  const tufts = `M${f1(hx - 9.8)} ${f1(hy + 2)}q-1 -6 2 -8q0 5 1.6 8zM${f1(hx + 9.8)} ${f1(hy + 2)}q1 -6 -2 -8q0 5 -1.6 8z`;
  const towel = `M${f1(hx - 8.6)} ${f1(hy - 7.4)}Q${f1(hx - 8)} ${f1(hy - 11.6)} ${f1(hx)} ${f1(hy - 11.8)}Q${f1(hx + 8)} ${f1(hy - 11.6)} ${f1(hx + 8.6)} ${f1(hy - 7.4)}Z`;
  return {
    outline: `<path d="${tufts}${towel}"/>`,
    print: `<path d="${tufts}" fill="${C.printLilac}"/><path d="${towel}" fill="${mixHex(C.washi, B.towelStripe, 0.3)}"/>`
      + `<path d="M${f1(hx - 8.6)} ${f1(hy - 7.6)}H${f1(hx + 8.6)}" stroke="${mixHex(B.towelStripe, C.shadow, 0.2)}" stroke-width="1"/>`
      + `<path d="M${f1(hx + 3.4)} ${f1(hy - 11.4)}V${f1(hy - 7.6)}M${f1(hx + 6)} ${f1(hy - 11)}V${f1(hy - 7.6)}" stroke="${C.washi}" stroke-width="1.1"/>`
      + `<path d="M${f1(hx - 5)} ${f1(hy - 10.4)}q3 -1 6 -1" stroke="${C.cutRim}" stroke-width=".7" fill="none" opacity=".7"/>`,
  };
};

/** The 阿嬤's grey hair in a bun at the nape (her hat covers the crown). */
const greyBun = (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 10)} ${f1(hy + 3)}q-1.4 -12 10 -12.4q11.4 .4 10 12.4q-2 -6 -10 -6.6q-8 .6 -10 6.6z`;
  const bun = circle(hx - 9.6, hy + 1, 4);
  return { outline: `<path d="${d}${bun}"/>`, print: `<path d="${bun}" fill="${C.printLilac}"/><path d="${d}" fill="${mixHex(C.printLilac, C.washi, 0.35)}"/><path d="M${f1(hx - 12)} ${f1(hy + 0.4)}l-3 -3" stroke="${B.lacquer}" stroke-width="1.2"/>` };
};

// ——— Looks ———

const UNCLE: Look = {
  top: M.undershirt, topDeep: mixHex(M.undershirt, C.shadow, 0.22), bottom: B.towelStripe, shoes: M.slipperBlue, sole: M.undershirt, girth: 1.2, shortSleeves: true, shorts: true,
  hair: towelHead,
  // His 汗衫's round neck, a little round belly
  over: `<path d="M-4 -56q4 4 8 0" stroke="${mixHex(M.undershirt, C.shadow, 0.3)}" stroke-width="1" fill="none"/><path d="M-8 -36q8 6 16 0" stroke="${mixHex(M.undershirt, C.shadow, 0.3)}" stroke-width=".9" fill="none"/>`,
};

/** Her flowered blouse: little pale flowers; a towel round her neck. */
function blouse(): string {
  let d = '';
  for (let i = 0; i < 9; i++) d += circle(-8 + ((i * 37 + 5) % 17), -52 + ((i * 23 + 5) % 22), 1.3);
  return `<path d="${d}" fill="${C.washiPink}" opacity=".85"/>`
    + `<path d="M-7 -56q7 6 14 0l1 6q-8 4 -16 0z" fill="${C.washi}"/><path d="M5 -51v6" stroke="${B.towelStripe}" stroke-width="1.4"/>`;
}

const GRANNY: Look = {
  top: B.blouse, topDeep: B.blouseDeep, bottom: C.printDark, shoes: M.slipperBlue, sole: M.undershirt, girth: 1.08,
  hair: greyBun, over: blouse(),
};

// ——— The 泡湯阿伯 ———

/** His little plastic basin (臉盆) under his arm, its rim at (x, y). */
function basin(x: number, y: number): Cut {
  const d = `M${f1(x - 8)} ${f1(y)}h16l-2.4 6h-11.2z`;
  return { outline: `<path d="${d}"/>`, print: `<path d="${d}" fill="${B.tealLight}"/><path d="M${f1(x - 8)} ${f1(y + 0.6)}h16" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>` };
}

/**
 * The 泡湯阿伯 (8-1; a carrier, about 145 tall). `idle`: dozing on his feet by his bath bucket, one hand
 * on its rim, his basin under the other arm, chin down, chalk 「Zzz」; `carrying`: awake, holding him at
 * his hip over the bucket; `back`; `done`: past the bucket, waving, towel still on his head.
 */
export function bathUncleArt(ctx: KitCtx, look: 'idle' | 'carrying' | 'back' | 'done'): string {
  const k = 1.88;
  if (look === 'idle') {
    const pose: Pose = { footB: [-6, 0], footF: [5, 0], elbowB: [-12, -40], handB: [-8, -30], elbowF: [12, -40], handF: [17, -26], eyes: 'shut', mouth: 'o', lean: 6 };
    const body = adult(UNCLE, pose);
    const cut = { outline: body.outline + basin(-9, -32).outline, print: body.print + basin(-9, -32).print };
    return stand(ctx, cut, k, false, 24) + chalk(14, -150, 'z', 11) + chalk(24, -164, 'Z', 15);
  }
  if (look === 'done') return stand(ctx, adult(UNCLE, WAVE), k, false, 24) + chalk(26, -156, '呵呵～', 11);
  return stand(ctx, adult(UNCLE, look === 'carrying' ? HOLD : HOLD_BACK), k, false, 24);
}

// ——— The 溫泉阿嬤 ———

/** A hot-spring egg in her fingers at (x, y), a curl of its steam. */
const egg = (x: number, y: number) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="2.6" ry="3.2" fill="${B.egg}"/><path d="M${f1(x - 1)} ${f1(y - 1.4)}q.8 -.8 1.8 -.6" stroke="${C.cutRim}" stroke-width=".6" fill="none"/>`
  + `<path d="M${f1(x)} ${f1(y - 4)}q-1.6 -2 0 -4t0 -4" stroke="${B.steam}" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".9"/>`;

/**
 * The 溫泉阿嬤 (8-3) sitting at the bench's end (its seat 20 above the boardwalk), knees together,
 * blowing on the hot-spring egg in her fingers, her slippers dangling; `surprised` (her hat just blew
 * off: 「哎唷！我的帽子！」), eyes wide and mouth open, the egg held still. Feet at the origin. Her straw
 * hat goes over her bun: she and it are drawn by the hat's part (`c8/granny-hat`, baked), because a
 * part is drawn under the creatures and the hat must sit on her head.
 */
export function grannyFigure(ctx: KitCtx, surprised = false): string {
  const k = 1.45;
  const pose: Pose = {
    kneeB: [12, -29], footB: [13, -14], kneeF: [15, -29], footF: [16, -14],
    elbowB: [10, -42], handB: [6, -56], elbowF: [13, -44], handF: [8, -58],
    eyes: surprised ? 'open' : 'happy', mouth: surprised ? 'open' : 'o',
  };
  const body = adult(GRANNY, pose);
  const sat = scaled({ outline: body.outline, print: body.print + egg(9, -61) }, k, false, 0, 29 * k - 20);
  return softEllipse(ctx, 10, 1, 22, 3, 'shadow', 0.4) + figure(sat.outline, sat.print)
    + (surprised ? '' : `<path d="M22 -84q5 -1 9 2M22 -80q6 0 10 3" stroke="${C.chalk}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/>`);
}

/**
 * The 溫泉阿嬤's basket of hot-spring eggs (8-3's creature at `granny`, live): a little bamboo basket
 * on the boardwalk at her feet, four eggs in it and a curl of their steam. She herself sits on the
 * bench in the hat's part (`grannyFigure`).
 */
export function eggBasket(ctx: KitCtx): string {
  const basket = 'M-34 -1H-14L-16 -12H-32Z';
  return softEllipse(ctx, -24, 0, 12, 2, 'shadow', 0.4)
    + depth(ctx, 4, `<path d="${basket}" fill="${B.straw}"/><path d="M-33 -8H-15M-32.4 -4H-15.6" stroke="${B.strawDeep}" stroke-width=".9"/>`
      + `<ellipse cx="-28" cy="-13" rx="2.6" ry="3.2" fill="${B.egg}"/><ellipse cx="-23" cy="-14" rx="2.6" ry="3.2" fill="${B.egg}"/><ellipse cx="-19" cy="-12.6" rx="2.4" ry="3" fill="${B.egg}"/>`
      + `<path d="M-32 -12Q-24 -24 -16 -12" stroke="${B.strawDeep}" stroke-width="1.4" fill="none"/>`, `<path d="${basket}"/>`)
    + `<path d="M-24 -18q-2 -3 0 -6t0 -6" stroke="${B.steam}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/>`;
}

// ——— Riders ———

/**
 * 8-4's book tray on the library's book lift (a rider, drawn at its node: origin at the tray's
 * floor, where Baokaka sits): a hinoki tray with low sides and brass corners hung from the belt by a
 * steel bracket, a few books stacked at its back. Live, flat fills (it moves: no filters, GDD § 3.9).
 */
function bookTray(ctx: KitCtx): string {
  const box = 'M-25 -6H25L23 8H-23Z';
  return softEllipse(ctx, 0, 10, 24, 3, 'shadow', 0.3)
    + `<path d="M-14 -6L0 -24L14 -6" stroke="${B.steelDeep}" stroke-width="2" fill="none"/><circle cy="-26" r="3" fill="${B.steelDeep}"/><circle cy="-26" r="1.2" fill="${B.steel}"/>`
    + `<rect x="-21" y="-17" width="7" height="11" fill="${B.roofGreen}"/><rect x="-13" y="-14" width="6" height="8" fill="${B.lacquer}"/><rect x="15" y="-13" width="7" height="7" fill="${B.noren}"/>`
    + `<path d="M-21 -14h7M15 -10h7" stroke="${C.goldDeep}" stroke-width=".7"/>`
    + depth(ctx, 3, `<path d="${box}" fill="${B.hinoki}"/><path d="M-25 -6H25" stroke="${B.hinokiLight}" stroke-width="1.4"/>`
      + `<path d="M-24 2H24" stroke="${B.hinokiDeep}" stroke-width="1" opacity=".7"/><path d="M-25 -6v5h4M25 -6v5h-4" stroke="${B.brass}" stroke-width="1.6" fill="none"/>`, `<path d="${box}"/>`);
}

export const BEITOU_RIDERS: Readonly<Record<string, RiderArt>> = {
  'c8/book-belt:T': bookTray,
};
