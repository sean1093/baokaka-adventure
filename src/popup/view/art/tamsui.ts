import { POPUP as C, POPUP_BEITOU as B, POPUP_MARKET as M, mixHex } from '../../../art/palette';
import { f1, softEllipse, type KitCtx } from '../../art';
import { HOLD, HOLD_BACK, WAVE, adult, circle, join, stand, type Cut, type Look, type Pose } from './market';
import type { RiderArt } from './riders';
import { chalk } from './ximen';

/**
 * Chapter 9's cast and riders (淡水, #131; placeholders until the chapter's art, #132), feet at the
 * origin, facing +x. Real people are never depicted (GDD § 6 risk 11): generic, friendly types.
 *
 * - **The 鐵蛋阿婆** (9-2's carrier, baked per look by `env/art/c9.ts`): chapter 5's paper-style
 *   die-cut grown-up (`adult`) with a grey bun, a plum blouse under a navy apron, 藍白拖, a little
 *   paper bag of 鐵蛋 in her hand.
 * - **9-6's net basket** (a rider on the fishing boat's derrick, `riders.ts`).
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
