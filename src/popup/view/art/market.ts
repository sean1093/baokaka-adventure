import { POPUP as C, POPUP_MARKET as M, POPUP_STAGE as S, mixHex } from '../../../art/palette';
import { depth, f1, softEllipse, type KitCtx } from '../../art';
import { chalk, face, figure, limb, ticks, type Pt } from './ximen';

/**
 * Chapter 5's cast (士林夜市, #122; bible § 5), feet at the origin, facing +x, in the paper-style
 * die-cut of the chapter 2–4 casts (`figure`: a dropped shadow, the warm-white card, the print).
 *
 * - **The grown-ups** are built on one body (`adult`): legs and arms as filled capsules (`limb`), so
 *   each figure is a handful of paths that all take the die-cut border. The four carriers (the 夜市阿姨,
 *   the 雞排老闆, the sleepy 按摩椅阿伯, the 蔥抓餅阿姨) are baked (`env/art/c5.ts`, one bitmap per
 *   look); the dozing passengers (5-1) and the 彈珠台阿伯 (5-4) are creatures, drawn live.
 * - **Carrying** (抱抱, #120): Baokaka is drawn `CARRY_LIFT` (34) above her feet and `CARRY_AHEAD`
 *   (16) in front of her (`PageView.tsx`), over her: so she holds him at her hip — the near hand
 *   under his seat, just past him, the far arm round his back. `back` (a carry back along the route)
 *   holds him on her other side, as he faces the way she walks.
 * - **Creatures** that are animals are origami (bible § 5): the stray dog (5-5). The crowd of legs
 *   (5-3) is a wall of grown-ups' legs seen at a baby's eye level.
 *
 * Real people are never depicted (GDD § 6 risk 11): these are generic, friendly market types.
 * Live drawings keep to merged flat paths (no filters on a mover, GDD § 3.9; the animated-node budget).
 */

/** A die-cut piece: its outline and its print. */
export interface Cut {
  readonly outline: string;
  readonly print: string;
}

/** Where an adult's hands and feet are (unit figure: about 76 tall, feet at y 0, facing +x). */
export interface Pose {
  readonly footB: Pt;
  readonly footF: Pt;
  readonly elbowB: Pt;
  readonly handB: Pt;
  readonly elbowF: Pt;
  readonly handF: Pt;
  /** The face: open, shut (asleep, or happy arcs) and the mouth */
  readonly eyes?: 'open' | 'shut' | 'happy';
  readonly mouth?: 'smile' | 'open' | 'o' | 'none';
  /** Knees bent (a sit): the thigh's end for each leg, else straight legs */
  readonly kneeB?: Pt;
  readonly kneeF?: Pt;
  /** The torso leans (degrees, + toward +x) about the hips */
  readonly lean?: number;
}

/** What an adult wears. */
export interface Look {
  readonly top: string;
  readonly topDeep: string;
  readonly bottom: string;
  readonly shoes: string;
  /** Shoe trim (藍白拖's white sole) */
  readonly sole?: string;
  /** Wider (a stocky 老闆, a round 阿伯) */
  readonly girth?: number;
  /** The hair (or hat) over the head: outline and print, in unit coordinates */
  readonly hair: (hx: number, hy: number) => Cut;
  /** Prints over the torso (a pattern, an apron, a towel), after the torso */
  readonly over?: string;
  /** Short sleeves: the forearms in skin */
  readonly shortSleeves?: boolean;
  /** Bare shins (shorts) */
  readonly shorts?: boolean;
}

const HIP_B: Pt = [-3, -29];
const HIP_F: Pt = [3, -29];
const SHOULDER_B: Pt = [-6, -52];
const SHOULDER_F: Pt = [6, -52];
/** The head's centre (unit figure). */
export const HEAD: Pt = [1, -65];
const HEAD_R = 9.4;

export const circle = (x: number, y: number, r: number) => `M${f1(x - r)} ${f1(y)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0Z`;
const rot = (p: Pt, deg: number, o: Pt = [0, -29]): Pt => {
  const a = (deg * Math.PI) / 180;
  const [x, y] = [p[0] - o[0], p[1] - o[1]];
  return [o[0] + x * Math.cos(a) - y * Math.sin(a), o[1] + x * Math.sin(a) + y * Math.cos(a)];
};

/**
 * A grown-up (unit figure, about 76 tall; the caller scales it): legs (straight, or bent at the
 * knees for a sit), a torso, two arms bent at the elbows, a head with the look's hair and a face.
 */
export function adult(look: Look, pose: Pose): Cut {
  const g = look.girth ?? 1;
  const lean = pose.lean ?? 0;
  const L = (p: Pt) => (lean ? rot(p, lean) : p);
  const [sb, sf, head] = [L(SHOULDER_B), L(SHOULDER_F), L(HEAD)];
  const leg = (hip: Pt, knee: Pt | undefined, foot: Pt) => (knee ? limb(hip, knee, 5) + limb(knee, foot, 4.6) : limb(hip, foot, 4.8));
  const legB = leg(HIP_B, pose.kneeB, pose.footB);
  const legF = leg(HIP_F, pose.kneeF, pose.footF);
  const armB = limb(sb, L(pose.elbowB), 3.8) + limb(L(pose.elbowB), L(pose.handB), 3.4);
  const armF = limb(sf, L(pose.elbowF), 3.8) + limb(L(pose.elbowF), L(pose.handF), 3.4);
  const w = 10.5 * g;
  const t = (x: number, y: number) => L([x, y]);
  const p = (q: Pt) => `${f1(q[0])} ${f1(q[1])}`;
  const torso = `M${p(t(-w, -23))}Q${p(t(-w - 2, -46))} ${p(t(-8, -55))}Q${p(t(0, -59))} ${p(t(8, -55))}Q${p(t(w + 2, -46))} ${p(t(w, -23))}Q${p(t(0, -21))} ${p(t(-w, -23))}Z`;
  const neck = limb(t(0.6, -56), head, 3.2);
  const headD = circle(head[0], head[1], HEAD_R);
  const hair = look.hair(head[0], head[1]);
  const hand = (q: Pt) => circle(L(q)[0], L(q)[1], 3.2);
  const shoe = (q: Pt) => `M${f1(q[0] - 4)} ${f1(q[1] + 0.6)}a6.4 3.2 0 1 0 12.8 0a6.4 3.2 0 1 0 -12.8 0Z`;
  const outline = `<path d="${legB}${legF}${armB}${armF}${torso}${neck}${headD}"/>` + hair.outline;
  // Short sleeves: the forearms in skin
  const fore = (e: Pt, h: Pt) => limb(L(e), L(h), 3.5);
  const skinArms = look.shortSleeves ? fore(pose.elbowB, pose.handB) + fore(pose.elbowF, pose.handF) : '';
  // Shins: bare under shorts
  const shin = (hip: Pt, knee: Pt | undefined, foot: Pt) => (knee ? limb(knee, foot, 4.4) : limb([(hip[0] + foot[0]) / 2, (hip[1] + foot[1]) / 2], foot, 4.4));
  const shins = look.shorts ? shin(HIP_B, pose.kneeB, pose.footB) + shin(HIP_F, pose.kneeF, pose.footF) : '';
  const print = `<path d="${legB}" fill="${mixHex(look.bottom, C.shadow, 0.25)}"/><path d="${legF}" fill="${look.bottom}"/>`
    + (shins ? `<path d="${shins}" fill="${S.skin}"/>` : '')
    + `<path d="${shoe(pose.footB)}${shoe(pose.footF)}" fill="${look.shoes}"/>`
    + (look.sole ? `<path d="M${f1(pose.footB[0] - 4)} ${f1(pose.footB[1] + 1.6)}h12.8M${f1(pose.footF[0] - 4)} ${f1(pose.footF[1] + 1.6)}h12.8" stroke="${look.sole}" stroke-width="1.4"/>` : '')
    + `<path d="${neck}" fill="${S.skin}"/>`
    + `<path d="${look.shortSleeves ? limb(sb, L(pose.elbowB), 4) : armB}" fill="${look.topDeep}"/>`
    + `<path d="${torso}" fill="${look.top}"/>` + (look.over ?? '')
    + `<path d="${look.shortSleeves ? limb(sf, L(pose.elbowF), 4) : armF}" fill="${look.top}"/>`
    + (skinArms ? `<path d="${skinArms}" fill="${S.skin}"/>` : '')
    + `<path d="${hand(pose.handB)}${hand(pose.handF)}" fill="${S.skin}"/>`
    + `<path d="${headD}" fill="${S.skin}"/>` + face(head[0] + 1.6, head[1] + 1, { eyes: pose.eyes ?? 'open', mouth: pose.mouth ?? 'smile', s: 0.8 }) + hair.print;
  return { outline, print };
}

/** A figure scaled by `k` about its feet (the origin), mirrored to face −x when `flip`. */
export const scaled = (cut: Cut, k: number, flip = false, dx = 0, dy = 0): Cut => {
  const t = `translate(${f1(dx)} ${f1(dy)}) scale(${flip ? -k : k} ${k})`;
  return { outline: `<g transform="${t}">${cut.outline}</g>`, print: `<g transform="${t}">${cut.print}</g>` };
};

// ——— Hair ———

/** The 阿姨's perm: a cloud of tight curls round the crown. */
const perm = (hx: number, hy: number): Cut => {
  const curls = [[-8, -4, 4.4], [-9, 2, 3.8], [-5, -9, 4.6], [1, -11, 4.8], [7, -9, 4.4], [10, -4, 3.6], [-7, 6, 3.4]] as const;
  const d = curls.map(([x, y, r]) => circle(hx + x, hy + y, r)).join('');
  return { outline: `<path d="${d}"/>`, print: `<path d="${d}" fill="${M.perm}"/><path d="${circle(hx - 4, hy - 10, 1.6)}${circle(hx + 3, hy - 12, 1.4)}" fill="${C.printLilac}" opacity=".35"/>` };
};

/** The 老闆's crew cut and a rolled towel round his brow. */
const crewCut = (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 9.4)} ${f1(hy - 1)}q0 -10 9.4 -10q9.4 0 9.4 10q-2 -4 -9.4 -4q-7.4 0 -9.4 4z`;
  const band = `M${f1(hx - 10)} ${f1(hy - 4.6)}q10 -3 20 0v3q-10 -3 -20 0z`;
  return { outline: `<path d="${d}${band}"/>`, print: `<path d="${d}" fill="${C.printDark}"/><path d="${band}" fill="${M.undershirt}"/><path d="M${f1(hx - 10)} ${f1(hy - 3)}q10 -3 20 0" stroke="${M.apron}" stroke-width=".8" fill="none"/>` };
};

/** The 阿伯's bald crown with grey tufts over the ears. */
const baldTufts = (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 9.8)} ${f1(hy + 1)}q-1 -6 3 -8q-1 5 1 9zM${f1(hx + 9.8)} ${f1(hy + 1)}q1 -6 -3 -8q1 5 -1 9z`;
  return { outline: `<path d="${d}"/>`, print: `<path d="${d}" fill="${C.printLilac}"/><path d="M${f1(hx - 4)} ${f1(hy - 7)}q3 -2 6 -1" stroke="${C.cutRim}" stroke-width="1.2" fill="none" opacity=".6"/>` };
};

/** The 蔥抓餅阿姨's cloth cap (a vendor's kerchief cap) over a bun. */
const clothCap = (hx: number, hy: number): Cut => {
  const cap = `M${f1(hx - 10)} ${f1(hy - 1.4)}q-1 -11 10 -11.4q11 .4 10 11.4q-3 -3 -10 -3q-7 0 -10 3z`;
  const bun = circle(hx - 9, hy + 1, 3.6);
  return {
    outline: `<path d="${cap}${bun}"/>`,
    print: `<path d="${bun}" fill="${M.perm}"/><path d="${cap}" fill="${M.awningCream}"/><path d="M${f1(hx - 10)} ${f1(hy - 3.6)}q10 -4 20 0" stroke="${M.vermilion}" stroke-width="2" fill="none"/>`,
  };
};

/** A passenger's hood up, or a bob. */
const hood = (col: string) => (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 11)} ${f1(hy + 6)}q-2 -17 11 -18q13 1 11 18q-3 -12 -11 -12q-8 0 -11 12z`;
  return { outline: `<path d="${d}"/>`, print: `<path d="${d}" fill="${col}"/>` };
};
const bob = (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 10.6)} ${f1(hy + 5)}q-2 -16 10.6 -16q12.6 0 10.6 16q-2 -9 -6 -10q-6 3 -12 1q-2 2 -3.2 9z`;
  return { outline: `<path d="${d}"/>`, print: `<path d="${d}" fill="${M.perm}"/>` };
};
/** The 彈珠台阿伯's flat cap. */
const flatCap = (hx: number, hy: number): Cut => {
  const d = `M${f1(hx - 10)} ${f1(hy - 2)}q0 -9 10 -9q8 0 10 6l6 2q-6 2 -16 1q-6 0 -10 0z`;
  return { outline: `<path d="${d}"/>`, print: `<path d="${d}" fill="${M.khaki}"/><path d="M${f1(hx - 9)} ${f1(hy - 3)}h18" stroke="${mixHex(M.khaki, C.shadow, 0.4)}" stroke-width="1"/>` };
};

// ——— Looks ———

/** The 阿姨's floral blouse: a scatter of little pale flowers. */
function blouseFlowers(seed: number): string {
  let d = '';
  for (let i = 0; i < 9; i++) {
    const x = -8 + ((i * 37 + seed) % 17), y = -52 + ((i * 23 + seed) % 22);
    d += circle(x, y, 1.3);
  }
  return `<path d="${d}" fill="${M.blouseFlower}" opacity=".85"/>`;
}

const AUNTIE: Look = {
  top: M.blouse, topDeep: M.blouseDeep, bottom: M.denimDeep, shoes: M.slipperBlue, sole: M.undershirt,
  hair: perm, over: blouseFlowers(3), girth: 1.06,
};

const BOSS: Look = {
  top: M.undershirt, topDeep: mixHex(M.undershirt, C.shadow, 0.25), bottom: M.denimDeep, shoes: C.printDark, girth: 1.22, shortSleeves: true,
  hair: crewCut,
  // His apron: navy, a pocket with tongs' handles; a towel over his shoulder
  over: `<path d="M-11 -27Q-12 -40 -9 -46H9Q12 -40 11 -27Z" fill="${M.apron}"/><path d="M-9 -46L-6 -56M9 -46L6 -56" stroke="${M.apronDeep}" stroke-width="1.4"/>`
    + `<rect x="-5" y="-40" width="10" height="7" rx="1" fill="${M.apronDeep}"/><path d="M6 -58q4 4 3 12" stroke="${M.awningCream}" stroke-width="3.4" stroke-linecap="round" fill="none"/>`,
};

const ABE: Look = {
  top: M.undershirt, topDeep: mixHex(M.undershirt, C.shadow, 0.22), bottom: M.shorts, shoes: M.slipperBlue, sole: M.undershirt, girth: 1.24, shortSleeves: true, shorts: true,
  hair: baldTufts,
  // His 汗衫's round neck and a little round belly
  over: `<path d="M-4 -56q4 4 8 0" stroke="${mixHex(M.undershirt, C.shadow, 0.3)}" stroke-width="1" fill="none"/><path d="M-8 -36q8 6 16 0" stroke="${mixHex(M.undershirt, C.shadow, 0.3)}" stroke-width=".9" fill="none"/>`,
};

const VENDOR: Look = {
  top: M.awningCream, topDeep: M.awningCreamShade, bottom: C.printDark, shoes: C.printDark, girth: 1.04,
  hair: clothCap,
  // Her vermilion apron, splashed, with 「蔥」 on its bib
  over: `<path d="M-10 -26Q-11 -40 -8 -48H8Q11 -40 10 -26Z" fill="${M.vermilion}"/><path d="M-8 -48L-5 -56M8 -48L5 -56" stroke="${M.vermilionDeep}" stroke-width="1.4"/>`
    + `<circle cx="0" cy="-42" r="3.6" fill="${M.awningCream}"/><text data-art-text="" x="0" y="-40.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="4.6" fill="${M.vermilionDeep}">蔥</text>`,
};

// ——— Poses ———

/** Standing, arms open toward +x ("come here"). */
export const OPEN: Pose = { footB: [-6, 0], footF: [6, 0], elbowB: [4, -46], handB: [14, -50], elbowF: [14, -44], handF: [22, -50], eyes: 'happy', mouth: 'open' };
/** Holding him at her hip toward +x: the near hand under his seat, the far arm round his back. */
export const HOLD: Pose = { footB: [-5, 0], footF: [7, 0], elbowB: [2, -40], handB: [16, -38], elbowF: [14, -40], handF: [20, -30], eyes: 'happy', mouth: 'smile' };
/** Holding him on her −x side (a carry back). */
export const HOLD_BACK: Pose = { footB: [-7, 0], footF: [5, 0], elbowB: [-14, -40], handB: [-20, -30], elbowF: [-2, -40], handF: [-16, -38], eyes: 'happy', mouth: 'open', lean: -6 };
/** Waving with the near hand. */
export const WAVE: Pose = { footB: [-5, 0], footF: [5, 0], elbowB: [-9, -40], handB: [-10, -28], elbowF: [15, -58], handF: [17, -72], eyes: 'happy', mouth: 'open' };

/** A shadow and the die-cut figure, the figure's art scaled by `k`. */
export function stand(ctx: KitCtx, cut: Cut, k: number, flip = false, shadowW = 20): string {
  const s = scaled(cut, k, flip);
  return softEllipse(ctx, 0, 1, shadowW * k * 0.6, 3.4, 'shadow', 0.42) + figure(s.outline, s.print);
}

// ——— The carriers (baked: `env/art/c5.ts`) ———

/** The 夜市阿姨's 茄芷袋: the red, white and blue striped market bag, hung from (x, y). */
function marketBag(x: number, y: number): Cut {
  const bag = `M${f1(x - 7)} ${f1(y + 4)}h14l-1.4 13h-11.2z`;
  const handle = `M${f1(x - 4)} ${f1(y + 4)}q4 -9 8 0`;
  return {
    outline: `<path d="${bag}"/>`,
    print: `<path d="${handle}" stroke="${M.bagBlue}" stroke-width="1.4" fill="none"/><path d="${bag}" fill="${M.undershirt}"/>`
      + `<path d="M${f1(x - 7)} ${f1(y + 7)}h14M${f1(x - 6.6)} ${f1(y + 12)}h13.2" stroke="${M.bagRed}" stroke-width="2"/><path d="M${f1(x - 6.8)} ${f1(y + 9.4)}h13.6M${f1(x - 6.4)} ${f1(y + 14.6)}h12.8" stroke="${M.bagBlue}" stroke-width="1.6"/>`,
  };
}

export const join = (...cuts: Cut[]): Cut => ({ outline: cuts.map((c) => c.outline).join(''), print: cuts.map((c) => c.print).join('') });

/**
 * The 夜市阿姨 (5-3; a carrier, 144 tall): a perm, a floral blouse, 藍白拖, the 茄芷袋 on her arm.
 * `idle`: arms open to him (「來，阿姨抱！」); `carrying`: holding him at her hip; `back`: carrying him
 * back — with a twirl (the 淘氣: chalk swirls, her bag flying out); `done`: waving him off.
 */
export function auntieArt(ctx: KitCtx, look: 'idle' | 'carrying' | 'back' | 'done'): string {
  const k = 1.9;
  if (look === 'back') {
    const body = join(marketBag(10, -46), adult(AUNTIE, HOLD_BACK));
    return softEllipse(ctx, 0, 1, 26, 3.6, 'shadow', 0.42) + figure(scaled(body, k).outline, scaled(body, k).print)
      + ticks('M-30 -150q-22 10 -10 30M34 -148q22 12 6 34M-40 -60q-10 6 -6 16M44 -70q8 8 0 16')
      + chalk(14, -156, '轉圈圈～', 12, -6);
  }
  const pose = look === 'idle' ? OPEN : look === 'carrying' ? HOLD : WAVE;
  const bag = look === 'idle' ? marketBag(-12, -34) : marketBag(-10, -36);
  return stand(ctx, join(bag, adult(AUNTIE, pose)), k);
}

/**
 * The 雞排老闆 (5-3; a carrier, 152 tall): crew cut, a towel round his brow and another over his
 * shoulder, an apron over his 汗衫. `idle` (called to the counter): leaning toward the counter on
 * his −x side, tongs up — 「來了！」; `away` (the bell not rung): in the back at the fryer, turned
 * away, frying (drawn back and to his +x side, steam rising); `carrying`, `back`, `done`.
 */
export function bossArt(ctx: KitCtx, look: 'idle' | 'away' | 'carrying' | 'back' | 'done'): string {
  const k = 2;
  if (look === 'away') {
    // Back view at the fryer: no face, the apron's bow, steam over his shoulder
    const back: Look = { ...BOSS, over: `<path d="M-6 -30l-4 3l4 1zM6 -30l4 3l-4 1z" fill="${M.apron}"/><path d="M-9 -30h18" stroke="${M.apron}" stroke-width="1.6"/>` };
    const pose: Pose = { footB: [-5, 0], footF: [5, 0], elbowB: [-12, -42], handB: [-6, -36], elbowF: [12, -42], handF: [6, -36], eyes: 'shut', mouth: 'none' };
    const cut = adult(back, pose);
    // Turn the face away: a crew cut over the whole head
    const hair = `<path d="${circle(HEAD[0], HEAD[1], HEAD_R)}" fill="${C.printDark}"/><path d="M${f1(HEAD[0] - 10)} ${f1(HEAD[1] - 4.6)}q10 -3 20 0v3q-10 -3 -20 0z" fill="${M.undershirt}"/>`;
    const s = scaled({ outline: cut.outline, print: cut.print + hair }, k * 0.9, false, 26, -8);
    return softEllipse(ctx, 26, -7, 18, 3, 'shadow', 0.35) + figure(s.outline, s.print)
      + `<path d="M8 -150q-6 -10 0 -20t0 -20M22 -154q-6 -10 0 -20t0 -20M36 -150q-6 -10 0 -20" stroke="${C.vellum}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`
      + chalk(40, -150, '滋滋…', 10);
  }
  if (look === 'idle') {
    const pose: Pose = { footB: [-5, 0], footF: [6, 0], elbowB: [10, -44], handB: [16, -54], elbowF: [14, -42], handF: [22, -46], eyes: 'happy', mouth: 'open', lean: 8 };
    const tongs = `<path d="M15 -54l10 -12M17 -53l10 -10" stroke="${M.steelWarm}" stroke-width="1.4" stroke-linecap="round"/>`;
    const cut = adult(BOSS, pose);
    return stand(ctx, { outline: cut.outline, print: cut.print + tongs }, k, true, 24) + chalk(-56, -164, '來了！', 12, -4);
  }
  const pose = look === 'carrying' ? HOLD : look === 'back' ? HOLD_BACK : { ...WAVE, eyes: 'happy' as const };
  return stand(ctx, adult(BOSS, pose), k, false, 24);
}

/** A red plastic stool (the night market's everywhere), its seat at (0, −h). */
function plasticStool(x: number, h: number): Cut {
  const d = `M${f1(x - 11)} 0l3 ${f1(-h + 4)}h16l3 ${f1(h - 4)}h-4l-2 ${f1(-h + 10)}h-10l-2 ${f1(h - 10)}z`;
  const seat = `M${f1(x - 12)} ${f1(-h)}h24v4h-24z`;
  return { outline: `<path d="${d}${seat}"/>`, print: `<path d="${d}" fill="${M.vermilionDeep}"/><path d="${seat}" fill="${M.vermilion}"/><path d="M${f1(x - 11)} ${f1(-h + 0.8)}h22" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>` };
}

/**
 * The sleepy 按摩椅阿伯 (5-5; a carrier, 141 tall): bald with grey tufts, a white 汗衫, shorts and
 * 藍白拖, a round belly. `idle`: dozing on a red plastic stool at the foot of the chairs, a paper fan
 * in his lap, chalk 「Zzz」; `carrying` / `back`: up and carrying him, eyes still half shut;
 * `done`: on the top shelf, yawning.
 */
export function abeArt(ctx: KitCtx, look: 'idle' | 'carrying' | 'back' | 'done'): string {
  const k = 1.85;
  if (look === 'idle') {
    const pose: Pose = { kneeB: [16, -28], footB: [18, -13], kneeF: [20, -28], footF: [22, -13], elbowB: [-2, -38], handB: [8, -31], elbowF: [8, -40], handF: [13, -31], eyes: 'shut', mouth: 'o', lean: 4 };
    const fan = `<path d="M12 -31l9 -8q3 4 1 10z" fill="${M.awningCream}"/><path d="M12 -31l9 -8M12 -31l10 -4M12 -31l10 0" stroke="${M.vermilion}" stroke-width=".7"/>`;
    const cut = adult(ABE, pose);
    // His hips on the stool's seat (16 up): the unit figure's hips (−29) moved there
    // Beside the foot of the chairs (to the −x of his node, where Baokaka reaches up)
    const sat = scaled({ outline: cut.outline, print: cut.print + fan }, k, false, -26, 13 * k);
    const stool = scaled(plasticStool(-1, 16), k, false, -26);
    return softEllipse(ctx, -20, 1, 26, 3.4, 'shadow', 0.42) + figure(stool.outline + sat.outline, stool.print + sat.print)
      + chalk(-8, -132, 'z', 11) + chalk(2, -146, 'Z', 15);
  }
  const pose = look === 'carrying' ? { ...HOLD, eyes: 'shut' as const, mouth: 'smile' as const } : look === 'back' ? { ...HOLD_BACK, eyes: 'shut' as const } : { ...WAVE, eyes: 'shut' as const, mouth: 'o' as const };
  return stand(ctx, adult(ABE, pose), k, false, 24) + (look === 'done' ? chalk(30, -150, '哈～欠', 10) : '');
}

/**
 * The 蔥抓餅阿姨 (5-6; a carrier, 132 tall: her cap clears the stall's sign): a cloth cap, a cream
 * blouse under a vermilion apron. `idle`: at her griddle with her spatula raised; `carrying` /
 * `back`; `done`: spatula up, cheerful.
 */
export function vendorArt(ctx: KitCtx, look: 'idle' | 'carrying' | 'back' | 'done'): string {
  const k = 1.74;
  const spatula = (x: number, y: number) => `<path d="M${x} ${y}l6 -12" stroke="${M.woodDeep}" stroke-width="1.6" stroke-linecap="round"/><path d="M${x + 5} ${y - 11}l4 -7l5 2.6l-4 7z" fill="${M.steelWarm}"/>`;
  if (look === 'idle' || look === 'done') {
    const pose: Pose = { footB: [-5, 0], footF: [6, 0], elbowB: [-8, -40], handB: [-4, -32], elbowF: [14, -46], handF: [18, -58], eyes: 'happy', mouth: look === 'done' ? 'open' : 'smile' };
    const cut = adult(VENDOR, pose);
    return stand(ctx, { outline: cut.outline, print: cut.print + spatula(17, -57) }, k);
  }
  return stand(ctx, adult(VENDOR, look === 'carrying' ? HOLD : HOLD_BACK), k);
}

// ——— Creatures (live) ———

/**
 * 5-1's dozing passengers (a creature at the bench, `paxSeat`: the origin is the seat): a young man
 * in a hoodie, head lolled back, the phone in his lap (the decoy is drawn live at (−16, −20)), and an
 * office lady asleep on his shoulder. `doze`: eyes shut, a chalk 「Zzz」; `blink`: the lights are on —
 * both wide-eyed, a hand up against the glare, chalk ticks.
 */
export function passengers(ctx: KitCtx, pos = 'doze'): string {
  const awake = pos === 'blink';
  const k = 1.9;
  // Sat on the bench: thighs forward at hip height, shins down to the car's floor (76 below the seat)
  const seat = (lean: number, elbowF: Pt, handF: Pt): Pose => ({
    kneeB: [19, -28], footB: [20, 10], kneeF: [23, -28], footF: [24, 10],
    elbowB: [-4, -40], handB: [4, -38], elbowF, handF, eyes: awake ? 'open' : 'shut', mouth: awake ? 'o' : 'none', lean,
  });
  const man: Look = { top: M.denim, topDeep: M.denimDeep, bottom: C.printDark, shoes: C.printDark, hair: hood(M.denim) };
  const lady: Look = { top: C.printLilac, topDeep: C.printLilacDeep, bottom: M.laneLight, shoes: M.vermilionDeep, hair: bob };
  const him = scaled(adult(man, awake ? seat(0, [12, -52], [9, -64]) : seat(-12, [8, -40], [3, -38])), k, false, -24, 29 * k);
  const her = scaled(adult(lady, awake ? seat(-2, [14, -50], [12, -63]) : seat(-26, [8, -40], [4, -36])), k, false, 16, 29 * k);
  const marks = awake ? ticks('M-44 -132l-6 -5M-46 -118h-8M44 -134l6 -5M46 -120h8') + chalk(-10, -142, '！？', 14) : chalk(20, -128, 'z', 10) + chalk(30, -140, 'Z', 13);
  return softEllipse(ctx, -4, 77, 46, 3.4, 'shadow', 0.4) + figure(her.outline + him.outline, her.print + him.print) + marks;
}

/**
 * 5-3's crowd of legs (a creature at `L3`): what a baby sees of a night-market crowd — a wall of
 * grown-ups' legs from the knees down (jeans, a skirt, slacks, 藍白拖, sneakers) and two dangling
 * shopping bags, edge to edge across the lane. One merged print per colour.
 */
export function crowdLegs(ctx: KitCtx): string {
  // Five grown-ups from the knees down: [x, trousers, shoes, a skirt's hem or none, step]
  const people = [[-38, M.denim, C.printDark, 0, 3], [-16, M.khaki, M.slipperBlue, 0, -4], [6, C.printDark, C.washi, 0, 5], [26, M.blouseDeep, M.vermilionDeep, 1, -3], [44, M.denimDeep, M.slipperBlue, 0, 2]] as const;
  const top = -104;
  let outline = '';
  const fills = new Map<string, string>();
  const add = (col: string, d: string) => fills.set(col, (fills.get(col) ?? '') + d);
  for (const [x, col, shoe, skirt, step] of people) {
    const legs = limb([x - 4, top], [x - 5 - step, -6], 4.6) + limb([x + 4, top], [x + 5 + step, -6], 4.6);
    const feet = `M${x - 13 - step} -1q0 -6 7 -6q6 0 7 6zM${x + 1 + step} -1q0 -6 7 -6q6 0 7 6z`;
    outline += legs + feet;
    if (skirt) {
      const hem = `M${x - 11} ${top}h22l4 34h-30z`;
      outline += hem;
      add(S.skin, legs);
      add(col, hem);
    } else add(col, legs);
    add(shoe, feet);
  }
  const bags = 'M-58 -60h16l-2 20h-12zM54 -66h14l-1.4 18h-11.2z';
  outline += bags;
  const print = [...fills].map(([c, d]) => `<path d="${d}" fill="${c}"/>`).join('')
    + `<path d="M-50 -60v-44M61 -66v-38" stroke="${C.printDark}" stroke-width="1.2"/><path d="${bags}" fill="${M.bagRed}"/>`
    + `<path d="M-57.6 -54h15.2M54.4 -60h13.2" stroke="${M.undershirt}" stroke-width="2.4"/><path d="M-57.4 -49h14.4M54.6 -55h12.6" stroke="${M.bagBlue}" stroke-width="1.8"/>`;
  return softEllipse(ctx, 0, 1, 66, 4, 'shadow', 0.42) + figure(`<path d="${outline}"/>`, print) + chalk(-26, top - 8, '人好多…', 11);
}

/**
 * 5-4's 彈珠台阿伯 (a creature on his stool at `uncleSeat`, the origin the stool's seat): a flat
 * cap, a cardigan, a cup of tea at his feet. `doze`: arms folded, chin down, 「zz」; `laugh`: both
 * arms flung up, laughing — 「哈哈哈！」.
 */
export function pachinkoUncle(ctx: KitCtx, pos = 'doze'): string {
  const laugh = pos === 'laugh';
  const k = 1.6;
  const look: Look = { top: M.khaki, topDeep: mixHex(M.khaki, C.shadow, 0.3), bottom: C.printDark, shoes: C.printDark, hair: flatCap, girth: 1.1 };
  const pose: Pose = laugh
    ? { footB: [-2, 0], footF: [4, 0], elbowB: [-14, -60], handB: [-18, -74], elbowF: [14, -62], handF: [20, -76], eyes: 'happy', mouth: 'open' }
    : { footB: [-2, 0], footF: [4, 0], elbowB: [-8, -40], handB: [6, -42], elbowF: [10, -40], handF: [-4, -42], eyes: 'shut', mouth: 'none', lean: 6 };
  // Sat on the seat: the unit figure's hips (−29) up on the origin, shins down the stool
  const fig = scaled(adult(look, { ...pose, kneeB: [17, -28], footB: [17, -1], kneeF: [21, -28], footF: [21, -1] }), k, true, 0, 29 * k);
  const stool = `<path d="M-12 0h24v4h-24zM-10 4l-2 42M10 4l2 42" stroke="${C.printDark}" stroke-width="2.4" fill="${M.woodDeep}"/>`;
  return softEllipse(ctx, 0, 46, 24, 3, 'shadow', 0.4) + stool + figure(fig.outline, fig.print)
    + (laugh ? ticks('M-40 -110l-6 -6M40 -112l6 -6M-46 -94h-8M46 -96h8') + chalk(-30, -128, '哈哈哈！', 13, -4) : chalk(16, -104, 'z', 10) + chalk(24, -116, 'Z', 13));
}

/**
 * 5-5's stray dog (an origami creature; bible § 5): a folded tan 土狗 with a black saddle, a white
 * chest, folded ears. `nap`: curled up asleep on the second chair's warm seat; `away`: trotting off
 * across the front of the page, tail up.
 */
export function strayDog(ctx: KitCtx, pos = 'nap'): string {
  if (pos === 'away') {
    const body = 'M-22 -14L-8 -22L14 -22L20 -30L28 -28L30 -18L22 -12L18 0H12L10 -10H-10L-14 0H-20L-18 -12Z';
    const saddle = 'M-8 -22L14 -22L10 -12L-10 -12Z';
    const ear = 'M20 -30L22 -38L26 -29Z';
    return softEllipse(ctx, 0, 1, 26, 3, 'shadow', 0.4)
      + depth(ctx, 4, `<path d="${body}" fill="${M.dogTan}"/><path d="${saddle}${ear}" fill="${M.dogBlack}"/><path d="M-22 -14L-30 -26" stroke="${M.dogTan}" stroke-width="3.4" stroke-linecap="round"/>`
        + `<path d="M22 -12L30 -18L28 -14Z" fill="${M.dogTanLight}"/><circle cx="25" cy="-24" r="1.1" fill="${C.ink}"/><path d="M-8 -22L-10 -12M14 -22L10 -12" stroke="${C.cutRim}" stroke-width=".6" opacity=".6"/>`, `<path d="${body}"/>`)
      + ticks('M-36 -10h-8M-34 -18h-6') + chalk(-4, -40, '掰掰～', 10);
  }
  // Curled asleep: a folded loaf, its tail round its nose
  const body = 'M-24 0L-20 -16L-6 -22L10 -20L22 -12L24 0Z';
  const head = 'M10 -6L14 -18L22 -16L26 -6L22 0H12Z';
  const fold = 'M-6 -22L-2 0M10 -20L8 0';
  return softEllipse(ctx, 0, 1, 26, 3, 'shadow', 0.42)
    + depth(ctx, 4, `<path d="${body}" fill="${M.dogTan}"/><path d="M-20 -16L-6 -22L-2 -8L-18 -6Z" fill="${M.dogBlack}"/><path d="${head}" fill="${M.dogTanLight}"/>`
      + `<path d="M14 -18L15 -25L19 -17Z" fill="${M.dogBlack}"/><path d="M17 -10q2 1.4 4 0" stroke="${C.ink}" stroke-width="1" fill="none" stroke-linecap="round"/><circle cx="25" cy="-5" r="1.4" fill="${C.ink}"/>`
      + `<path d="M-24 0Q-28 -10 -18 -12" stroke="${M.dogTan}" stroke-width="3.6" stroke-linecap="round" fill="none"/><path d="${fold}" stroke="${C.cutRim}" stroke-width=".6" opacity=".55"/>`, `<path d="${body}"/><path d="${head}"/>`)
    + chalk(18, -26, 'z', 9) + chalk(26, -34, 'Z', 11);
}
