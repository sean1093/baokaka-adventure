import { POPUP as C, POPUP_101 as K, POPUP_STAGE as S, mixHex } from '../../../art/palette';
import { brad, f1, softEllipse, type KitCtx } from '../../art';
import { HOLD, HOLD_BACK, WAVE, adult, circle, join, scaled, stand, type Cut, type Look, type Pose } from './market';
import { chalk, figure } from './ximen';

/**
 * Chapter 10's cast and riders (台北101, #133; drawn in the chapter's kit by #134), feet at the
 * origin, facing +x. Real people are never depicted (GDD § 6 risk 11): generic, friendly types, in
 * chapter 5's paper-style die-cut grown-up (`adult`).
 *
 * - **The 清潔阿伯** (10-2's carrier, baked per look by `env/art/c10.ts`): a pale-blue cleaner's
 *   uniform and the 清潔帽 (a pale-blue cotton cap with a short peak, like the 土地公's this chapter),
 *   grey sideburns, his mop.
 * - **The 上班族** (10-1's sleeping commuter, a creature, live): a grey suit and a red tie, his
 *   briefcase; `aisle` slumped asleep on the seat with his legs out across the aisle, `seat` curled
 *   up on it, still asleep, waving 掰掰 back.
 * - **The sections' ledges** (10-3, carriages riding the sections): a balcony slab of the section's
 *   lip with a gold-rimmed glass balustrade (`sectionLedge`).
 */

/** His grey sideburns under the pale-blue 清潔帽 (its short peak forward). */
const cleanerCap = (hx: number, hy: number): Cut => {
  const cap = `M${f1(hx - 10)} ${f1(hy - 2)}q0 -12 10 -12q10 0 10 12z`;
  const peak = `M${f1(hx + 7)} ${f1(hy - 3.4)}h8q2 0 1 2.4h-9z`;
  const side = `M${f1(hx - 9.6)} ${f1(hy - 2)}q-1 6 2 9l2 -1q-2 -3 -1.4 -8z`;
  return {
    outline: `<path d="${cap}${peak}"/>`,
    print: `<path d="${side}" fill="${mixHex(C.printLilac, C.washi, 0.4)}"/><path d="${cap}" fill="${K.cap}"/><path d="${peak}" fill="${K.uniformDeep}"/>`
      + `<path d="M${f1(hx - 10)} ${f1(hy - 2.6)}h20" stroke="${K.uniformDeep}" stroke-width="1.4"/><path d="M${f1(hx - 6)} ${f1(hy - 10)}q4 -3 9 -1" stroke="${C.cutRim}" stroke-width=".8" fill="none" opacity=".7"/>`,
  };
};

const CLEANER: Look = {
  top: K.uniform, topDeep: K.uniformDeep, bottom: mixHex(K.uniformDeep, K.violetDeep, 0.3), shoes: C.printDark, girth: 1.05,
  hair: cleanerCap,
  // The uniform's pocket and its name tag
  over: `<rect x="2" y="-48" width="6" height="5" rx=".8" fill="${K.uniformDeep}"/><rect x="-7" y="-47" width="5" height="2" fill="${C.washi}"/>`,
};

/** His mop, its head on the floor at (x, 0), the handle up to (hx, hy). */
function mop(x: number, hx: number, hy: number): Cut {
  const head = `M${f1(x - 9)} 0q0 -5 9 -5q9 0 9 5z`;
  const handle = `M${f1(x)} -4L${f1(hx)} ${f1(hy)}`;
  let strands = '';
  for (let i = -7; i <= 7; i += 2.4) strands += `M${f1(x + i * 0.7)} -4l${f1(i * 0.2)} 4`;
  return {
    outline: `<path d="${head}"/><path d="${handle}" stroke-width="2.6"/>`,
    print: `<path d="${handle}" stroke="${K.woodLight}" stroke-width="2" stroke-linecap="round"/><path d="${head}" fill="${K.mop}"/><path d="${strands}" stroke="${mixHex(K.mop, C.shadow, 0.3)}" stroke-width=".6"/>`,
  };
}

/** His teal bucket on its wheels at (x, 0). */
function bucket(x: number): Cut {
  const d = `M${f1(x - 8)} -14h16l-2 12h-12z`;
  return {
    outline: `<path d="${d}"/>`,
    print: `<path d="${d}" fill="${K.bucket}"/><path d="M${f1(x - 8)} -14h16" stroke="${mixHex(K.bucket, C.cutRim, 0.4)}" stroke-width="1.2"/>`
      + `<path d="M${f1(x - 6)} -14q6 -7 12 0" stroke="${K.steelDeep}" stroke-width=".8" fill="none"/><path d="${circle(x - 5, -1, 1.6)}${circle(x + 5, -1, 1.6)}" fill="${C.printDark}"/>`,
  };
}

/**
 * The 清潔阿伯 (10-2; a carrier, about 140 tall). `idle`: mopping the observatory's floor by the
 * window, his bucket beside him, 「唰唰」; `carrying`: lifting him (「來，阿伯抱你去窗邊看。」);
 * `back`; `done`: at the window with him gone, waving.
 */
export function cleanerUncleArt(ctx: KitCtx, look: 'idle' | 'carrying' | 'back' | 'done'): string {
  const k = 1.84;
  if (look === 'idle') {
    const pose: Pose = { footB: [-5, 0], footF: [6, 0], elbowB: [4, -40], handB: [10, -46], elbowF: [12, -38], handF: [14, -34], eyes: 'happy', mouth: 'smile', lean: 6 };
    return stand(ctx, join(bucket(-14), mop(22, 9, -50), adult(CLEANER, pose)), k, false, 24) + chalk(46, -24, '唰唰', 9, -6);
  }
  if (look === 'done') return stand(ctx, join(mop(-14, -9, -48), adult(CLEANER, WAVE)), k, false, 22);
  return stand(ctx, adult(CLEANER, look === 'carrying' ? HOLD : HOLD_BACK), k, false, 22);
}

// ——— 10-1's commuter ———

/** His short black hair, combed. */
const officeHair = (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 9.6)} ${f1(hy + 1)}q-1 -12 10 -12q10 0 10 9q-5 -4 -11 -3q-6 1 -9 6z`;
  return { outline: `<path d="${d}"/>`, print: `<path d="${d}" fill="${S.hair}"/>` };
};

const SUIT: Look = {
  top: K.suit, topDeep: K.suitDeep, bottom: K.suitDeep, shoes: C.printDark,
  hair: officeHair,
  // The shirt's V and the red tie
  over: `<path d="M-3 -54l4 9l4 -9z" fill="${K.shirt}"/><path d="M1 -46l-1.6 8l1.6 3l1.6 -3z" fill="${K.tie}"/>`,
};

/** His briefcase at (x, y), its handle up. */
function briefcase(x: number, y: number): Cut {
  const d = `M${f1(x - 9)} ${f1(y)}h18v12h-18z`;
  return { outline: `<path d="${d}"/>`, print: `<path d="${d}" fill="${K.woodDeep}"/><path d="M${f1(x - 3)} ${f1(y)}v-2.4h6v2.4" stroke="${K.woodDeep}" stroke-width="1.2" fill="none"/><path d="M${f1(x - 9)} ${f1(y + 4)}h18" stroke="${K.wood}" stroke-width=".8"/>` };
}

/**
 * 10-1's 上班族, asleep on the night's last 月亮線 (a creature: `aisle` at F4, `seat` on the seat).
 * `aisle`: slumped on the long seat (its top 54 above the floor), head lolled, his briefcase beside
 * him, legs stretched out across the aisle (what stops Baokaka); `seat` (掰掰): curled up on the seat,
 * knees tucked, still asleep, a drowsy hand waving back.
 */
export function sleepyCommuter(ctx: KitCtx, pos = 'aisle'): string {
  const k = 1.86;
  if (pos === 'seat') {
    const pose: Pose = { kneeB: [10, -50], footB: [16, -29], kneeF: [13, -48], footF: [19, -29], elbowB: [8, -44], handB: [11, -50], elbowF: [14, -60], handF: [12, -73], eyes: 'shut', mouth: 'o', lean: -6 };
    const cut = scaled(join(briefcase(-16, -41), adult(SUIT, pose)), k, false, 0, 29 * k);
    return softEllipse(ctx, 6, 1, 30, 3, 'shadow', 0.38) + figure(cut.outline, cut.print)
      + `<path d="M18 -110q8 2 10 10M24 -116q10 4 12 14" stroke="${C.chalk}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/>`
      + chalk(-18, -96, 'z', 10) + chalk(-8, -108, 'Z', 13);
  }
  // On the seat to his −x, his hips at its top (54 up), legs out along the floor to his +x
  const pose: Pose = { kneeB: [14, -24], footB: [28, -2], kneeF: [17, -23], footF: [32, -1], elbowB: [-6, -40], handB: [4, -32], elbowF: [6, -40], handF: [12, -32], eyes: 'shut', mouth: 'o', lean: -14 };
  const body = scaled(join(briefcase(-22, -41), adult(SUIT, pose)), k, false, -36, 0);
  return softEllipse(ctx, 6, 1, 40, 3.4, 'shadow', 0.4) + figure(body.outline, body.print)
    + chalk(-58, -150, 'z', 11) + chalk(-46, -162, 'Z', 15);
}

// ——— 10-3's ledges ———

/**
 * A section's balcony ledge (10-3; a carriage riding the section, its deck at y 0, `w` wide): a slab
 * of the section's lip — teal glass edge with the cyan rim — under a low glass balustrade with a
 * gold top rail, so the ledge reads as part of the tower turning with it. Flat fills (it moves).
 */
export function sectionLedge(ctx: KitCtx, w: number, linked: boolean): string {
  const slab = `M-4 0H${w + 4}L${w - 2} 14H2Z`;
  let posts = '';
  for (let x = 6; x < w - 2; x += 10) posts += `M${x} -12V0`;
  return softEllipse(ctx, w / 2, 16, w * 0.46, 4, 'shadow', 0.35)
    // The glass balustrade behind (gold top rail, slim posts)
    + `<rect x="0" y="-12" width="${w}" height="12" fill="${K.tealLit}" opacity=".35"/><path d="${posts}" stroke="${K.tealDeep}" stroke-width=".8"/>`
    + `<path d="M-1 -12.5H${w + 1}" stroke="${C.gold}" stroke-width="2.2" stroke-linecap="round"/>`
    // The slab: its lit top, its teal face, the cyan rim, a peach underlight
    + `<path d="${slab}" fill="${K.tealDeep}"/><path d="M-4 0H${w + 4}V5H-4Z" fill="${mixHex(K.stone, K.peachLight, 0.4)}"/>`
    + `<path d="M-4 5.4H${w + 4}" stroke="${K.cyanRim}" stroke-width="1.6"/><path d="M4 11H${w - 4}" stroke="${K.peach}" stroke-width="1.2" opacity=".6"/>`
    + (linked ? brad(ctx, w / 2, 9, 3.5, true) : '');
}

