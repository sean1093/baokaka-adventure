import { POPUP as C, POPUP_MAOKONG as K, POPUP_STAGE as S, mixHex } from '../../../art/palette';
import { depth, f1, softEllipse, type KitCtx } from '../../art';
import { HOLD, HOLD_BACK, WAVE, adult, circle, join, scaled, stand, type Cut, type Look, type Pose } from './market';
import { chalk, figure, limb, type Pt } from './ximen';

/**
 * Chapter 7's cast (貓空, #126; bible § 5), feet at the origin, facing +x.
 *
 * - **The night-shift zookeeper** (7-1's carrier) is the paper-style die-cut grown-up of chapter 5's
 *   cast (`adult`): a khaki shirt with the zoo's green, a cap, a torch on his belt. Baked per look.
 * - **黑糖**, the Formosan black bear (7-6): a big soft die-cut figure in black card with his cream
 *   V-shaped moon mark, a tan muzzle and round ears. Asleep he is a creature curled on the celery bed
 *   (`sleepingBear`, live); awake he is a carrier, baked per look — `away` (while he sleeps up on the
 *   bed: only his big paw prints at the wall's foot), `idle` (scooping water from the rain jar, the
 *   moon's reflection broken into ripples), `carrying`, `back`, `done` (waving, humming).
 * - **The tea farmer** (7-3, a creature): a die-cut 阿伯 in indigo work clothes under a straw 斗笠,
 *   his picking basket at his hip. Live.
 * - **The pangolin** (7-1, a creature) is origami (bible § 5): a folded body of overlapping scale
 *   plates in three tones; asleep, loosely curled; 掰掰, a tight ball. Live.
 *
 * Real people are never depicted (GDD § 6 risk 11): these are generic, friendly types.
 */

// ——— The zookeeper ———

/** His cap: the zoo's green with a short peak and a little badge. */
const keeperCap = (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 9.6)} ${f1(hy - 2)}q0 -10 9.6 -10q9.6 0 9.6 10z`;
  const peak = `M${f1(hx + 6)} ${f1(hy - 3)}h9q2 0 1 2.4h-10z`;
  return {
    outline: `<path d="${d}${peak}"/>`,
    print: `<path d="${d}${peak}" fill="${K.keeperGreen}"/><circle cx="${f1(hx + 1)}" cy="${f1(hy - 7)}" r="1.8" fill="${C.ochre}"/>`
      + `<path d="M${f1(hx - 6)} ${f1(hy - 9)}q3 -2 6 -2" stroke="${C.cutRim}" stroke-width=".8" fill="none" opacity=".5"/>`,
  };
};

/** His uniform: a khaki shirt with green shoulder tabs and a pocket patch, green trousers, a torch on the belt. */
const KEEPER: Look = {
  top: K.khaki, topDeep: K.khakiDeep, bottom: K.keeperGreen, shoes: C.printDark, hair: keeperCap, girth: 1.08,
  over: `<path d="M-10 -51h5M5 -51h5" stroke="${K.keeperGreen}" stroke-width="2.4" stroke-linecap="round"/>`
    + `<rect x="2" y="-46" width="6" height="6" rx="1" fill="${K.keeperGreen}"/><path d="M3.4 -43h3.2" stroke="${C.washi}" stroke-width=".8"/>`
    + `<path d="M-11 -26h22" stroke="${K.khakiDeep}" stroke-width="2"/><rect x="6" y="-29" width="8" height="4" rx="1.6" fill="${C.printDark}"/><circle cx="14" cy="-27" r="1.4" fill="${C.lampHot}"/>`,
};

/** An upturned feed bucket (his seat at the top of the stairs), its base at (x, −h). */
function feedBucket(x: number, h: number): Cut {
  const d = `M${f1(x - 11)} 0L${f1(x - 9)} ${f1(-h)}H${f1(x + 9)}L${f1(x + 11)} 0Z`;
  return {
    outline: `<path d="${d}"/>`,
    print: `<path d="${d}" fill="${K.steel}"/><path d="M${f1(x - 10)} ${f1(-h * 0.35)}H${f1(x + 10)}M${f1(x - 9.6)} ${f1(-h * 0.7)}H${f1(x + 9.6)}" stroke="${K.steelDeep}" stroke-width="1.2"/>`
      + `<path d="M${f1(x - 6)} ${f1(-h + 2)}V-2" stroke="${C.cutRim}" stroke-width="1" opacity=".4"/>`,
  };
}

/**
 * The night-shift zookeeper (7-1; a carrier, 144 tall). `idle`: dozing on an upturned feed bucket at
 * the top of the stairs, arms folded, chin down, chalk 「Zzz」; `carrying`: holding him at his hip
 * (down the stairs); `back`; `done`: in the plaza, waving him off.
 */
export function keeperArt(ctx: KitCtx, look: 'idle' | 'carrying' | 'back' | 'done'): string {
  const k = 1.88;
  if (look === 'idle') {
    const pose: Pose = { kneeB: [14, -28], footB: [16, -11], kneeF: [18, -28], footF: [20, -11], elbowB: [10, -40], handB: [-2, -38], elbowF: [12, -38], handF: [0, -36], eyes: 'shut', mouth: 'o', lean: 10 };
    const sat = scaled(adult(KEEPER, pose), k, false, -10, 11 * k);
    const bucket = scaled(feedBucket(-10, 18), k, false, -10);
    return softEllipse(ctx, -8, 1, 30, 3.4, 'shadow', 0.42) + figure(bucket.outline + sat.outline, bucket.print + sat.print)
      + chalk(8, -128, 'z', 11) + chalk(18, -142, 'Z', 15);
  }
  if (look === 'done') return stand(ctx, adult(KEEPER, WAVE), k, false, 24) + chalk(26, -152, '掰掰～', 11);
  return stand(ctx, adult(KEEPER, look === 'carrying' ? HOLD : HOLD_BACK), k, false, 24);
}

// ——— 黑糖, the Formosan black bear ———

/** Where 黑糖's limbs go (unit space: about 64 tall, feet at y 0, facing +x). */
interface BearPose {
  readonly handB: Pt;
  readonly handF: Pt;
  readonly eyes?: 'open' | 'shut' | 'happy';
  /** The head turned down (scooping) */
  readonly nod?: number;
  /** The head moved back (−) or forward along x (carrying, so his face shows over Baokaka's shoulder) */
  readonly headX?: number;
}

/**
 * 黑糖 standing (a die-cut figure): short thick legs, a big round body, his cream V-shaped moon mark,
 * round ears, a tan muzzle with a dark nose, small kind eyes; the arms to `handB` (behind) and
 * `handF` (in front).
 */
function bear(pose: BearPose): Cut {
  const nod = pose.nod ?? 0;
  const head: Pt = [4 + (pose.headX ?? 0) + nod * 0.3, -50 + nod - Math.abs(pose.headX ?? 0) * 0.3];
  const body = 'M-15 -6Q-22 -24 -17 -38Q-10 -50 3 -50Q16 -50 21 -38Q26 -22 18 -6Q2 0 -15 -6Z';
  const legs = limb([-8, -10], [-9, -1], 6.4) + limb([10, -10], [11, -1], 6.4);
  const armB = limb([-10, -38], pose.handB, 5.6);
  const armF = limb([14, -38], pose.handF, 5.8);
  const headD = circle(head[0], head[1], 11.6);
  const ears = circle(head[0] - 8, head[1] - 9, 4.2) + circle(head[0] + 8, head[1] - 9.6, 4.2);
  const outline = `<path d="${legs}${armB}${body}${armF}${headD}${ears}"/>`;
  const fur = mixHex(K.bear, K.bearSheen, 0.25);
  const eye = (x: number) => (pose.eyes === 'shut'
    ? `<path d="M${f1(x - 1.6)} ${f1(head[1] - 2)}q1.6 1.4 3.2 0" stroke="${C.cutRim}" stroke-width=".9" fill="none" stroke-linecap="round"/>`
    : pose.eyes === 'happy'
      ? `<path d="M${f1(x - 1.6)} ${f1(head[1] - 1)}q1.6 -1.6 3.2 0" stroke="${C.cutRim}" stroke-width=".9" fill="none" stroke-linecap="round"/>`
      : `<circle cx="${f1(x)}" cy="${f1(head[1] - 2)}" r="1.3" fill="${C.ink}"/><circle cx="${f1(x + 0.4)}" cy="${f1(head[1] - 2.5)}" r=".45" fill="${C.cutRim}"/>`);
  const print = `<path d="${armB}" fill="${mixHex(K.bear, C.shadow, 0.3)}"/><path d="${legs}" fill="${K.bear}"/>`
    + `<path d="${body}" fill="${fur}"/><path d="M-10 -40Q-4 -46 4 -46" stroke="${K.bearSheen}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>`
    // The moon mark: a cream V across his chest
    + `<path d="M-9 -40Q3 -26 15 -40L13 -36Q3 -28 -7 -36Z" fill="${K.bearMoon}"/>`
    + `<path d="${ears}" fill="${K.bear}"/><path d="${circle(head[0] - 8, head[1] - 9, 2)}${circle(head[0] + 8, head[1] - 9.6, 2)}" fill="${K.bearMuzzle}" opacity=".5"/>`
    + `<path d="${headD}" fill="${fur}"/>`
    + `<ellipse cx="${f1(head[0] + 3)}" cy="${f1(head[1] + 4)}" rx="6.6" ry="5" fill="${K.bearMuzzle}"/><ellipse cx="${f1(head[0] + 4)}" cy="${f1(head[1] + 1.6)}" rx="2.6" ry="1.8" fill="${C.ink}"/>`
    + `<path d="M${f1(head[0] + 4)} ${f1(head[1] + 3.4)}v2.2q-1.6 1.6 -3.2 .4M${f1(head[0] + 4)} ${f1(head[1] + 5.6)}q1.6 1.2 3.2 -.4" stroke="${C.ink}" stroke-width=".8" fill="none" stroke-linecap="round"/>`
    + eye(head[0] - 4) + eye(head[0] + 6)
    + `<path d="${armF}" fill="${fur}"/><path d="${circle(pose.handF[0], pose.handF[1], 3)}" fill="${K.bearMuzzle}" opacity=".45"/>`;
  return { outline, print };
}

/** His paw prints on the path (dark earth, never chalk: Mocha's paws are chalk), from (x, y) along (dx, dy). */
function bearPrints(x: number, y: number, dx: number, dy: number, n: number): string {
  let d = '';
  for (let i = 0; i < n; i++) {
    const px = x + dx * i + (i % 2 ? 5 : -5), py = y + dy * i;
    d += `M${f1(px - 4)} ${f1(py)}a4 3 0 1 0 8 0a4 3 0 1 0 -8 0Z`;
    for (let t = -1; t <= 1; t++) d += circle(px + t * 3.2 + 1, py - 4.6 + Math.abs(t) * 0.8, 1.2);
  }
  return `<path d="${d}" fill="${K.soilDeep}" opacity=".75"/>`;
}

/**
 * 黑糖 awake (7-6; a carrier, 120 tall, baked per look). `away` (asleep up on his bed, so not here):
 * only his big paw prints trailing up from the rain jar to the wall. `idle`: standing by the jar,
 * scooping a drink with one paw — the moon's reflection broken into ripples, chalk 「咕嘟」; `carrying`:
 * up on his hind legs, holding Baokaka at his hip in both paws; `back`; `done`: up by the fence,
 * waving, humming 「♪」.
 */
export function blackBearArt(ctx: KitCtx, look: 'away' | 'idle' | 'carrying' | 'back' | 'done'): string {
  const k = 2.2;
  if (look === 'away') return bearPrints(-10, -2, 12, -10, 4);
  if (look === 'idle') {
    // The jar's water is 36 below his feet and 14 ahead: he stands past it by the wall, facing back
    // toward it (and toward him), and scoops with one paw
    const body = scaled(bear({ handB: [-14, -26], handF: [-14, 14], eyes: 'happy', nod: 4 }), k * 0.94, true, 46);
    return softEllipse(ctx, 46, 1, 30, 3.6, 'shadow', 0.42) + figure(body.outline, body.print)
      + `<ellipse cx="14" cy="36" rx="14" ry="3" fill="none" stroke="${C.vellum}" stroke-width="1.2" opacity=".85"/><ellipse cx="14" cy="36" rx="8" ry="1.8" fill="none" stroke="${C.vellum}" stroke-width="1" opacity=".7"/>`
      + `<path d="M8 33l-3 -5M20 33l3 -5M14 31v-6" stroke="${C.vellum}" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`
      + chalk(52, -132, '咕嘟', 11);
  }
  if (look === 'done') {
    // Stepped back to the wall's top behind him (out of the 芹菜's way), waving, humming
    const body = scaled(bear({ handB: [-16, -24], handF: [-22, -56], eyes: 'happy' }), k * 0.82, false, -26);
    return softEllipse(ctx, -26, 1, 26, 3.4, 'shadow', 0.42) + figure(body.outline, body.print)
      + chalk(-62, -132, '♪', 14) + chalk(-74, -144, '♪', 11);
  }
  // Carrying him at his hip (he is drawn 34 up and 16 ahead of the feet): both paws under and round him
  // Carried back down (the 淘氣), he faces the way he walks: the same hold, mirrored
  const body = scaled(bear({ handB: [20, -26], handF: [16, -16], eyes: 'happy', headX: -11 }), k, look === 'back');
  return softEllipse(ctx, 0, 1, 30, 3.6, 'shadow', 0.42) + figure(body.outline, body.print);
}

/**
 * 黑糖 asleep on the celery bed (7-6's `sleeper`, a creature at `C`): curled on his side facing us,
 * his head on one paw at the left, his cream moon mark showing on his chest, his round back and
 * haunch to the right, a hind paw tucked; the 芹菜's leaves peek out from under him; chalk 「Zzz」.
 * Off the page (`up`: he is awake, the carrier) he draws nothing.
 */
export function sleepingBear(ctx: KitCtx, pos = 'bed'): string {
  if (pos !== 'bed') return '';
  const body = 'M-30 0Q-38 -12 -30 -24Q-18 -38 4 -36Q24 -34 32 -20Q38 -6 30 2Z';
  const head = circle(-34, -14, 12);
  const ears = circle(-42, -24, 4) + circle(-28, -27, 4);
  const pawF = 'M-50 3q0 -7 9 -7h12q5 0 5 5v2z';
  const pawB = 'M18 3q-2 -9 8 -10q9 0 10 8v2z';
  const outline = `<path d="${body}${head}${ears}${pawF}${pawB}"/>`;
  const fur = mixHex(K.bear, K.bearSheen, 0.3);
  const print = `<path d="M-14 1q-2 -10 4 -16M-6 1q2 -12 10 -16M4 1q4 -10 12 -12" stroke="${K.celery}" stroke-width="3" stroke-linecap="round" fill="none"/>`
    + `<path d="${body}" fill="${fur}"/>`
    + `<path d="M-18 -32Q4 -40 24 -30" stroke="${K.bearSheen}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`
    + `<path d="M10 -6Q22 -26 30 -10" stroke="${mixHex(K.bear, C.shadow, 0.3)}" stroke-width="2" fill="none" opacity=".8"/>`
    // His moon mark, a cream V across his chest (he lies facing us)
    + `<path d="M-24 -18Q-14 -8 -4 -22L-6 -18Q-14 -12 -22 -16Z" fill="${K.bearMoon}"/>`
    + `<path d="${pawB}" fill="${K.bear}"/><path d="M22 0h2M27 -1h2M32 0h2" stroke="${K.bearMuzzle}" stroke-width="1" opacity=".6"/>`
    + `<path d="${ears}" fill="${K.bear}"/><path d="${circle(-42, -24, 1.8)}${circle(-28, -27, 1.8)}" fill="${K.bearMuzzle}" opacity=".5"/>`
    + `<path d="${head}" fill="${fur}"/><path d="M-42 -22q6 -6 14 -4" stroke="${K.bearSheen}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>`
    + `<ellipse cx="-40" cy="-9" rx="7" ry="5" fill="${K.bearMuzzle}"/><ellipse cx="-45" cy="-11" rx="2.4" ry="1.7" fill="${C.ink}"/>`
    + `<path d="M-38 -16q1.6 1.4 3.2 0M-30 -17q1.6 1.4 3.2 0" stroke="${C.cutRim}" stroke-width="1" fill="none" stroke-linecap="round"/>`
    + `<path d="${pawF}" fill="${K.bear}"/><path d="M-48 0h2M-44 -1h2M-40 -1h2" stroke="${K.bearMuzzle}" stroke-width="1" opacity=".6"/>`
    + `<path d="M28 -4q8 -2 10 -10M30 2q8 0 10 -8" stroke="${K.celeryLight}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
  return softEllipse(ctx, -6, 3, 44, 4, 'shadow', 0.42) + figure(outline, print)
    + chalk(-58, -34, 'z', 11) + chalk(-70, -46, 'Z', 15);
}

// ——— The tea farmer ———

/** His straw 斗笠: a wide shallow cone with a band. */
const douli = (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 17)} ${f1(hy - 3)}L${f1(hx)} ${f1(hy - 14)}L${f1(hx + 17)} ${f1(hy - 3)}Q${f1(hx)} ${f1(hy + 0.6)} ${f1(hx - 17)} ${f1(hy - 3)}Z`;
  return {
    outline: `<path d="${d}"/>`,
    print: `<path d="${d}" fill="${K.straw}"/><path d="M${f1(hx - 9)} ${f1(hy - 8)}H${f1(hx + 9)}M${f1(hx - 13)} ${f1(hy - 5.4)}H${f1(hx + 13)}" stroke="${K.strawDeep}" stroke-width=".8" opacity=".8"/>`
      + `<path d="M${f1(hx - 17)} ${f1(hy - 3)}Q${f1(hx)} ${f1(hy + 0.6)} ${f1(hx + 17)} ${f1(hy - 3)}" stroke="${K.strawDeep}" stroke-width="1.2" fill="none"/>`,
  };
};

/** His indigo work clothes, a towel round his neck. */
const FARMER: Look = {
  top: K.farmerBlue, topDeep: K.farmerBlueDeep, bottom: K.farmerBlueDeep, shoes: C.printDark, hair: douli, girth: 1.02,
  over: `<path d="M-6 -56q6 5 12 0l1 9h-2l-2 -6q-4 2 -8 0l-2 6h-2z" fill="${C.washi}"/>`,
};

/** His picking basket (a bamboo creel) at his hip, tea leaves in it. */
function creel(x: number, y: number): Cut {
  const d = `M${f1(x - 8)} ${f1(y)}h16l-2 14h-12z`;
  return {
    outline: `<path d="${d}"/>`,
    print: `<path d="${d}" fill="${K.bamboo}"/><path d="M${f1(x - 7)} ${f1(y + 5)}h14M${f1(x - 6.6)} ${f1(y + 9.6)}h13.2" stroke="${K.bambooDeep}" stroke-width=".9"/>`
      + `<path d="M${f1(x - 8)} ${f1(y)}q4 -4 8 -1q4 -3 8 1z" fill="${K.teaLit}"/>`,
  };
}

/**
 * The tea farmer (7-3, a creature): `step`, on the first terrace, bent a little over the tea, picking
 * with one hand, his creel at his hip; `up`, up on the next terrace, waving back down —
 * 「掰掰～阿伯上去採茶囉！」.
 */
export function teaFarmer(ctx: KitCtx, pos = 'step'): string {
  const k = 1.8;
  if (pos === 'up') {
    const body = join(creel(-12, -36), adult(FARMER, { ...WAVE, eyes: 'happy', mouth: 'open' }));
    return stand(ctx, body, k * 0.92, false, 22) + chalk(24, -146, '掰掰～', 11);
  }
  const pose: Pose = { footB: [-6, 0], footF: [6, 0], elbowB: [-8, -40], handB: [-12, -32], elbowF: [14, -40], handF: [22, -34], eyes: 'happy', mouth: 'smile', lean: 10 };
  const leaf = `<path d="M21 -36q4 -4 7 -1q-4 3 -7 1z" fill="${K.teaLit}"/>`;
  const cut = join(creel(-14, -34), adult(FARMER, pose));
  return stand(ctx, { outline: cut.outline, print: cut.print + leaf }, k, false, 22);
}

// ——— The pangolin ———

/**
 * The pangolin asleep in the planter under the stairs (7-1, a creature; origami, bible § 5): `asleep`,
 * loosely curled — a folded body of overlapping scale plates in three tones, a small pointed snout
 * tucked in, the long tail wrapped round; `curled` (掰掰), rolled into a tight scaly ball, chalk 「咕嚕」.
 */
export function pangolin(ctx: KitCtx, pos = 'asleep'): string {
  if (pos === 'curled') {
    const ball = circle(0, -13, 13);
    let plates = '';
    for (let ring = 0; ring < 3; ring++) {
      const r = 12 - ring * 4;
      for (let a = 0; a < 360; a += 40 + ring * 20) {
        const t = ((a + ring * 18) * Math.PI) / 180;
        const [px, py] = [Math.cos(t) * r, -13 + Math.sin(t) * r];
        plates += `M${f1(px - 3)} ${f1(py)}q3 -4 6 0q-3 3 -6 0z`;
      }
    }
    return softEllipse(ctx, 0, 1, 14, 2.6, 'shadow', 0.42)
      + depth(ctx, 4, `<path d="${ball}" fill="${K.pangolin}"/><path d="M-12 -13A12 12 0 0 1 12 -13" fill="${mixHex(K.pangolin, K.mist, 0.2)}" opacity=".5"/>`
        + `<path d="${plates}" fill="${K.pangolinDeep}"/><path d="M-10 -20q10 -10 20 0" stroke="${C.cutRim}" stroke-width=".8" fill="none" opacity=".6"/>`, `<path d="${ball}"/>`)
      + chalk(10, -28, '咕嚕', 8);
  }
  const body = 'M-22 0Q-26 -12 -14 -18Q0 -24 12 -18Q22 -12 20 0Z';
  let plates = '';
  for (let row = 0; row < 3; row++) for (let x = -18 + row * 3; x < 16 - row * 2; x += 6) plates += `M${x} ${-4 - row * 5}l3 -5l3 5z`;
  return softEllipse(ctx, 0, 1, 22, 2.8, 'shadow', 0.42)
    + depth(ctx, 4, `<path d="M18 -2Q30 0 30 -8Q30 -14 24 -14" stroke="${K.pangolinDeep}" stroke-width="5" fill="none" stroke-linecap="round"/>`
      + `<path d="${body}" fill="${K.pangolin}"/><path d="${plates}" fill="${K.pangolinDeep}"/><path d="${plates}" fill="none" stroke="${mixHex(K.pangolin, C.cutRim, 0.3)}" stroke-width=".6" opacity=".6"/>`
      + `<path d="M-20 -2Q-30 -4 -32 2Q-26 4 -20 2Z" fill="${mixHex(K.pangolin, S.skin, 0.35)}"/><path d="M-26 -1q1.4 1 2.8 0" stroke="${C.ink}" stroke-width=".8" fill="none"/>`
      + `<path d="M-14 -18Q0 -24 12 -18" stroke="${C.cutRim}" stroke-width=".8" fill="none" opacity=".5"/>`, `<path d="${body}"/>`)
    + chalk(4, -26, 'z', 8) + chalk(11, -34, 'Z', 10);
}
