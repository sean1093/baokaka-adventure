import { POPUP as C, POPUP_101 as K, POPUP_STATION as T, mixHex } from '../../../art/palette';
import { f1, softEllipse, type KitCtx } from '../../art';
import { adult, join, scaled, type Cut, type Look, type Pose } from './market';
import { chalk, figure } from './ximen';

/**
 * 尾聲's live cast (#135): the 背包客's cameo in the credits — 「I found it!」 (GDD § 4.1, § 5.3) —
 * at the foot of 台北101 at last, his huge backpack on, his map up in both hands, beaming. Paper-style
 * die-cut (`adult`), flat fills; feet at the origin. Real people are never depicted (GDD § 6 risk 11).
 */

/** His navy cap, peak forward, over sandy hair. */
const packerCap = (hx: number, hy: number): Cut => {
  const cap = `M${f1(hx - 10)} ${f1(hy - 1.6)}q0 -11 10 -11q10 0 10 11z`;
  const peak = `M${f1(hx + 7)} ${f1(hy - 3)}h9q2 0 1 2.6h-10z`;
  const hair = `M${f1(hx - 10.4)} ${f1(hy - 1)}q-1 6 2 9l2 -1q-2 -3 -1.6 -8z`;
  return { outline: `<path d="${cap}${peak}${hair}"/>`, print: `<path d="${hair}" fill="${T.packerHair}"/><path d="${cap}" fill="${T.packerCap}"/><path d="${peak}" fill="${mixHex(T.packerCap, C.printDark, 0.4)}"/>` };
};

const PACKER: Look = { top: T.packer, topDeep: T.packerDeep, bottom: C.printLilacDeep, shoes: C.printDark, shorts: true, shortSleeves: true, hair: packerCap };

/** Both arms up, the map held high over his head. */
const FOUND: Pose = { footB: [-7, 0], footF: [7, 0], elbowB: [-14, -66], handB: [-10, -88], elbowF: [16, -66], handF: [14, -89], eyes: 'happy', mouth: 'open' };

/** The huge backpack behind him (drawn first: under his arms). */
const pack: Cut = {
  outline: `<path d="M-18 -60q0 -12 12 -12h12q12 0 12 12v34h-36z"/>`,
  print: `<path d="M-18 -60q0 -12 12 -12h12q12 0 12 12v34h-36z" fill="${T.backpack}"/><path d="M-16 -62q0 -8 10 -8h12q10 0 10 8v8h-32z" fill="${T.backpackDeep}"/>`
    + `<rect x="-14" y="-74" width="28" height="7" rx="3.5" fill="${T.packer}"/>`,
};

/** The map, unfolded over his head (upside down no more). */
const map: Cut = {
  outline: `<path d="M-16 -104h34v18h-34z"/>`,
  print: `<path d="M-16 -104h34v18h-34z" fill="${C.page}"/><path d="M-5 -104v18M6 -104v18" stroke="${C.pageEdge}" stroke-width="1"/>`
    + `<path d="M-14 -93q8 -6 14 0t14 -2" stroke="${C.mapRiver}" stroke-width="1.6" fill="none"/><circle cx="10" cy="-98" r="2.6" fill="${C.seal}"/>`,
};

/**
 * The cameo: 101 rising behind him (a small paper cut-out, teal and peach), and him at its foot,
 * map up. About 220 × 200 units, his feet at (0, 0).
 */
export function backpackerFound(ctx: KitCtx): string {
  // 101 behind, small: podium, eight flared sections, crown, spire
  let tower = '';
  const [cx, ground, height] = [70, -6, 196];
  const y = (f: number) => f1(ground - height * f);
  const sh = 0.53 / 8;
  tower += `<path d="M${f1(cx - 18)} ${ground}L${f1(cx - 13)} ${y(0.2)}H${f1(cx + 13)}L${f1(cx + 18)} ${ground}Z" fill="${K.indigo}"/>`;
  for (let i = 0; i < 8; i++) {
    const [b, t] = [0.2 + sh * i, 0.2 + sh * (i + 1)];
    tower += `<path d="M${f1(cx - 11)} ${y(b)}L${f1(cx - 15)} ${y(t)}H${f1(cx + 15)}L${f1(cx + 11)} ${y(b)}Z" fill="${K.teal}"/>`
      + `<path d="M${f1(cx + 4)} ${y(b)}L${f1(cx + 5.5)} ${y(t)}H${f1(cx + 15)}L${f1(cx + 11)} ${y(b)}Z" fill="${K.peach}"/>`
      + `<path d="M${f1(cx - 15.6)} ${y(t)}H${f1(cx + 15.6)}" stroke="${K.cyanRim}" stroke-width="1.6"/>`;
  }
  tower += `<path d="M${f1(cx - 8)} ${y(0.73)}V${y(0.86)}H${f1(cx + 8)}V${y(0.73)}Z" fill="${K.teal}"/><path d="M${cx - 1} ${y(0.86)}L${cx} ${y(1)}L${cx + 1} ${y(0.86)}Z" fill="${K.steelLight}"/>`
    + `<circle cx="${cx}" cy="${y(1)}" r="1.8" fill="${C.neonPink}"/>`;
  const me = scaled(join(pack, adult(PACKER, FOUND), map), 1.7);
  return softEllipse(ctx, cx, ground + 1, 26, 3, 'shadow', 0.3) + tower
    + softEllipse(ctx, 0, 1, 26, 4, 'shadow', 0.42) + figure(me.outline, me.print)
    + chalk(-58, -150, '！', 18, -8) + chalk(40, -160, '！', 14, 10);
}
