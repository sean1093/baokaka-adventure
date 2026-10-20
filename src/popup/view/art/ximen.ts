import { POPUP as C, POPUP_NEON as N, POPUP_STAGE as S, mixHex } from '../../../art/palette';
import { depth, f1, softEllipse, type KitCtx } from '../../art';
import { dieCut } from './creatures';

/**
 * Chapter 4's cast (西門町, #119; bible § 5), drawn live like the park's and the campus's: feet at
 * the origin, facing +x, flat fills (no filters on a mover, GDD § 3.9), one drawing per position.
 * They are **paper-style die-cut figures** (`dieCut`): the street dance crew (4-5), the busker
 * with his guitar (4-5) and 走音天王, the karaoke king (4-6). Real people are never depicted (GDD
 * § 6 risk 11): these are generic, friendly types.
 */

type Pt = readonly [number, number];

/** A capsule (a limb) from `a` to `b`, `r` thick each side: a filled path, so it takes the die-cut border. */
function limb(a: Pt, b: Pt, r: number): string {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const l = Math.hypot(dx, dy) || 1;
  const [nx, ny] = [(-dy / l) * r, (dx / l) * r];
  const p = (x: number, y: number) => `${f1(x)} ${f1(y)}`;
  return `M${p(a[0] + nx, a[1] + ny)}L${p(b[0] + nx, b[1] + ny)}A${f1(r)} ${f1(r)} 0 0 1 ${p(b[0] - nx, b[1] - ny)}L${p(a[0] - nx, a[1] - ny)}A${f1(r)} ${f1(r)} 0 0 1 ${p(a[0] + nx, a[1] + ny)}Z`;
}

/** The end of a limb from `a`, `len` long at bearing `deg` (clockwise from up). */
const reach = (a: Pt, deg: number, len: number): Pt => [a[0] + Math.sin((deg * Math.PI) / 180) * len, a[1] - Math.cos((deg * Math.PI) / 180) * len];

/** Open eyes (or shut, or singing arcs), a blush, a mouth: a paper-style face centred on (x, y). */
function face(x: number, y: number, { eyes = 'open' as 'open' | 'shut' | 'happy', mouth = 'smile' as 'smile' | 'open' | 'o' | 'none', s = 1 } = {}): string {
  const k = (n: number) => f1(n * s);
  const dot = (cx: number, cy: number, r: number) => `M${f1(cx - r)} ${f1(cy)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0Z`;
  const eye = eyes === 'open'
    ? `<path d="${dot(x - 3 * s, y, 1.2 * s)}${dot(x + 3.2 * s, y, 1.2 * s)}" fill="${C.ink}"/>`
    : `<path d="M${f1(x - 5 * s)} ${y}q${k(2)} ${eyes === 'happy' ? k(-2) : k(1.6)} ${k(4)} 0M${f1(x + 1.4 * s)} ${y}q${k(2)} ${eyes === 'happy' ? k(-2) : k(1.6)} ${k(4)} 0" stroke="${C.ink}" stroke-width="${k(1.1)}" stroke-linecap="round" fill="none"/>`;
  const m = mouth === 'smile' ? `<path d="M${f1(x - 2 * s)} ${f1(y + 4.6 * s)}q${k(2.2)} ${k(2)} ${k(4.4)} 0" stroke="${C.ink}" stroke-width="${k(1)}" fill="none" stroke-linecap="round"/>`
    : mouth === 'open' ? `<path d="M${f1(x - 2.6 * s)} ${f1(y + 4 * s)}h${k(5.2)}q0 ${k(4)} ${k(-2.6)} ${k(4)}q${k(-2.6)} 0 ${k(-2.6)} ${k(-4)}z" fill="${C.ink}"/>`
    : mouth === 'o' ? `<ellipse cx="${x}" cy="${f1(y + 5 * s)}" rx="${k(1.6)}" ry="${k(2)}" fill="${C.ink}"/>` : '';
  return eye + m + `<path d="${dot(x - 6 * s, y + 3.6 * s, 1.8 * s)}${dot(x + 6.4 * s, y + 3.6 * s, 1.8 * s)}" fill="${S.blush}" opacity=".6"/>`;
}

/** A die-cut figure: a dropped shadow of its silhouette under the card (`dieCut`). */
const figure = (outline: string, print: string) =>
  `<g fill="${C.shadow}" opacity=".3" transform="translate(1.8 2.8)">${outline}</g>` + dieCut(outline, print);

/** Chalk motion ticks round a mover. */
const ticks = (d: string) => `<path d="${d}" stroke="${C.chalk}" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".85"/>`;

/** Chalk text. */
const chalk = (x: number, y: number, text: string, size = 10, rotate = 0) =>
  `<text data-art-text="" x="${x}" y="${y}" font-family="'Noto Serif TC'" font-weight="900" font-size="${size}" fill="${C.chalk}"${rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : ''}>${text}</text>`;

interface Pose {
  /** Arm bearings (degrees clockwise from up) from the shoulders */
  readonly armL: number;
  readonly armR: number;
  /** Leg bearings from the hips (180 is straight down) */
  readonly legL: number;
  readonly legR: number;
}

/**
 * A street dancer: a hoodie in `hood`, baggy trousers in `pants`, sneakers, a cap or a bun; posed by
 * `pose`. Returns the outline and the print, feet near the origin, standing about 66 tall.
 */
function dancer(hood: string, pants: string, pose: Pose, { cap = true, eyes = 'happy' as 'open' | 'happy' | 'shut' } = {}): { outline: string; print: string } {
  const hip: Pt = [0, -28];
  const shoulderL: Pt = [-6, -50], shoulderR: Pt = [6, -50];
  const footL = reach(hip, pose.legL, 27), footR = reach(hip, pose.legR, 27);
  const handL = reach(shoulderL, pose.armL, 22), handR = reach(shoulderR, pose.armR, 22);
  const torso = 'M-11 -27Q-13 -44 -8 -53Q0 -57 8 -53Q13 -44 11 -27Z';
  const legs = limb(hip, footL, 5.4) + limb(hip, footR, 5.4);
  const arms = limb(shoulderL, handL, 4) + limb(shoulderR, handR, 4);
  const head = 'M-9 -62a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0Z';
  const outline = `<path d="${legs}${arms}${torso}${head}"/>`;
  const shoe = (p: Pt) => `M${f1(p[0] - 4)} ${f1(p[1])}a6 3.4 0 1 0 12 0a6 3.4 0 1 0 -12 0Z`;
  const hand = (p: Pt) => `M${f1(p[0] - 3.4)} ${f1(p[1])}a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0Z`;
  const hair = cap
    ? `<path d="M-9.6 -64q0 -10 9.6 -10q9.6 0 9.6 10zM6 -66q8 0 11 3h-12z" fill="${C.printDark}"/>`
    : `<path d="M-9.6 -62q0 -11 9.6 -11q9.6 0 9.6 11q-4 -5 -9.6 -5q-5.6 0 -9.6 5zM-8.4 -74a4.4 4.4 0 1 0 8.8 0a4.4 4.4 0 1 0 -8.8 0z" fill="${S.hair}"/>`;
  const print = `<path d="${legs}" fill="${pants}"/><path d="${shoe(footL)}${shoe(footR)}" fill="${C.washi}"/>`
    + `<path d="${torso}" fill="${hood}"/>`
    + `<path d="${arms}" fill="${hood}"/><path d="${hand(handL)}${hand(handR)}" fill="${S.skin}"/>`
    + `<path d="${head}" fill="${S.skin}"/>` + hair + face(0.6, -61, { eyes, mouth: 'smile', s: 0.82 });
  return { outline, print };
}

/** A figure translated and turned about its feet. */
const place = (f: { outline: string; print: string }, x: number, y: number, rot = 0, flip = false) => {
  const t = `translate(${f1(x)} ${f1(y)})${rot ? ` rotate(${rot})` : ''}${flip ? ' scale(-1 1)' : ''}`;
  return { outline: `<g transform="${t}">${f.outline}</g>`, print: `<g transform="${t}">${f.print}</g>` };
};

/**
 * 4-5's dance crew (a creature; the music freezes them). `dance`: three dancers mid-routine across
 * the street at `M` — one arm high, one in a step, one spinning — with chalk motion ticks. `arch`:
 * frozen into an arch over the street (its origin the unconnected `arch` node, 84 above the street):
 * two dancers leaning in from either side with their hands joined at the top (Mocha's `archMid`, 70
 * above the origin), the third frozen in a one-hand pose beside them.
 */
export function dancers(ctx: KitCtx, pos = 'dance'): string {
  const k = 1.35;
  if (pos === 'arch') {
    // Two dancers stand with their arms up and lift the third, who sits on their hands (hips 13 above
    // the origin) with his arms in a V: the top of his cap is Mocha's seat (70 above the origin)
    const left = place(dancer(N.danceCyan, N.danceDenim, { armL: 10, armR: 24, legL: 192, legR: 168 }, { cap: true, eyes: 'shut' }), -26, 84, 0);
    const right = place(dancer(N.dancePink, C.printDark, { armL: 10, armR: 24, legL: 192, legR: 168 }, { cap: false, eyes: 'shut' }), 26, 84, 0, true);
    // (before the group's scale about the feet line: his hips 28 above his own feet)
    const topLifted = place(dancer(N.danceDenim, N.danceCyan, { armL: -50, armR: 50, legL: 110, legR: 128 }, { cap: true, eyes: 'happy' }), 0, 84 + (-13 - 84) / k + 28);
    return softEllipse(ctx, 0, 85, 50, 4, 'shadow', 0.4)
      + `<g transform="translate(0 84) scale(${k}) translate(0 -84)">${figure(left.outline + right.outline + topLifted.outline, left.print + right.print + topLifted.print)}</g>`
      + ticks('M-40 -40l-6 -4M40 -40l6 -4M-44 -30h-8M44 -30h8') + chalk(26, -60, '定格！', 9);
  }
  const a = dancer(N.danceCyan, N.danceDenim, { armL: -30, armR: 20, legL: 200, legR: 160 }, { cap: true });
  const b = place(dancer(N.dancePink, C.printDark, { armL: -60, armR: 60, legL: 210, legR: 170 }, { cap: false }), 30, 0, -8, true);
  const c = place(dancer(N.danceDenim, N.danceCyan, { armL: -100, armR: 150, legL: 190, legR: 130 }, { cap: true }), -32, 0, 10);
  const mid = place(a, 0, 0);
  return softEllipse(ctx, 0, 1, 64, 4, 'shadow', 0.4)
    + `<g transform="scale(${k})">${figure(c.outline + b.outline + mid.outline, c.print + b.print + mid.print)}</g>`
    + ticks('M-78 -54h-8M-78 -42h-10M70 -72l6 -4M72 -60h8') + chalk(-18, -112, '♪', 13) + chalk(14, -106, '♫', 11);
}

/**
 * 4-5's busker (a creature): a young guitarist in a green beanie. `sit`: on a folding stool behind
 * his upturned hat (the hat at the origin, `E2`, where the bead shows), strumming, a note or two;
 * `bow`: standing up at `bowSpot` (22 left of and 64 above the hat) in a deep bow, his guitar on
 * his back, the hat still upturned on the street.
 */
export function busker(ctx: KitCtx, pos = 'sit'): string {
  const hat = (x: number, y: number) => `<path d="M${x - 12} ${y}q0 -8 12 -8q12 0 12 8z" fill="${C.printDark}"/><ellipse cx="${x}" cy="${y}" rx="15" ry="3.4" fill="${C.printDark}"/><ellipse cx="${x}" cy="${y - 1}" rx="10" ry="2" fill="${N.plumDeep}"/>`;
  const head = (x: number, y: number) => `M${f1(x - 9)} ${y}a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z`;
  const beanie = (x: number, y: number) => `<path d="M${f1(x - 9.4)} ${f1(y - 2)}q0 -11 9.4 -11q9.4 0 9.4 11z" fill="${N.beanie}"/><path d="M${f1(x - 9.4)} ${f1(y - 2.6)}h18.8" stroke="${mixHex(N.beanie, C.cutRim, 0.3)}" stroke-width="2"/>`;
  const guitar = (x: number, y: number, rot: number) => `<g transform="translate(${x} ${y}) rotate(${rot})"><ellipse cx="-12" cy="2" rx="9" ry="7.4" fill="${N.guitar}"/><ellipse cx="-3" cy="0" rx="6.4" ry="5.4" fill="${N.guitar}"/><circle cx="-6" cy="1" r="2.2" fill="${N.guitarDeep}"/>`
    + `<rect x="0" y="-1.4" width="26" height="2.8" fill="${N.guitarDeep}"/><rect x="25" y="-2.6" width="6" height="5.2" rx="1" fill="${N.guitarDeep}"/></g>`;
  if (pos === 'bow') {
    // Standing, bent at the waist toward +x, one hand on his chest
    const body = 'M-8 -2V-28Q-10 -40 2 -46L14 -40Q12 -30 8 -26V-2Z';
    const legs = limb([-4, -26], [-6, 0], 4.6) + limb([4, -26], [5, 0], 4.6);
    const arm = limb([4, -40], [10, -26], 3.6);
    const outline = `<path d="${legs}${body}${arm}${head(16, -46)}"/>`;
    const print = `<path d="${legs}" fill="${N.danceDenim}"/>` + guitar(-6, -36, -60)
      + `<path d="${body}" fill="${C.printLilacDeep}"/><path d="${arm}" fill="${C.printLilacDeep}"/><circle cx="10" cy="-26" r="3" fill="${S.skin}"/>`
      + `<path d="${head(16, -46)}" fill="${S.skin}"/>` + beanie(16, -46)
      + `<g transform="rotate(30 17 -44)">${face(17, -44, { eyes: 'happy', mouth: 'smile', s: 0.76 })}</g>`;
    return hat(22, 64) + softEllipse(ctx, 2, 1, 20, 3, 'shadow', 0.4) + figure(outline, print) + chalk(26, -64, '謝謝！', 9);
  }
  // Sitting on a folding stool (behind the hat), strumming
  const sx = 16;
  const stool = `<path d="M${sx - 10} 0l18 -16M${sx + 8} 0l-18 -16" stroke="${C.printDark}" stroke-width="2"/><rect x="${sx - 12}" y="-19" width="24" height="4" rx="1" fill="${C.printDark}"/>`;
  const body = `M${sx - 9} -18V-42Q${sx} -50 ${sx + 9} -42V-18Z`;
  const legs = limb([sx - 4, -18], [sx - 16, -16], 4.6) + limb([sx - 16, -16], [sx - 16, 0], 4.4) + limb([sx + 2, -18], [sx - 8, -12], 4.6) + limb([sx - 8, -12], [sx - 6, 0], 4.4);
  const arms = limb([sx - 4, -38], [sx - 14, -24], 3.6) + limb([sx + 6, -38], [sx - 4, -30], 3.6);
  const outline = `<path d="${legs}${body}${arms}${head(sx, -56)}"/>`;
  const print = `<path d="${legs}" fill="${N.danceDenim}"/><path d="${body}" fill="${C.printLilacDeep}"/>`
    + guitar(sx + 2, -26, -24) + `<path d="${arms}" fill="${C.printLilacDeep}"/><circle cx="${sx - 14}" cy="-24" r="3" fill="${S.skin}"/><circle cx="${sx - 4}" cy="-30" r="3" fill="${S.skin}"/>`
    + `<path d="${head(sx, -56)}" fill="${S.skin}"/>` + beanie(sx, -56) + face(sx - 1, -54, { eyes: 'shut', mouth: 'smile', s: 0.76 });
  return stool + softEllipse(ctx, sx, 1, 20, 3, 'shadow', 0.4) + figure(outline, print) + hat(0, 0)
    + chalk(sx - 30, -66, '♪', 11) + chalk(sx + 14, -74, '♩', 9);
}


/**
 * 4-6's 走音天王, the karaoke king (a creature): a sequinned magenta jacket, a towering pompadour,
 * a wireless 麥克風 of his own. `wings`: waiting by the curtain, eyes shut, humming; `sing`: at the
 * stand, belting it out, an arm flung wide, his notes wobbling off-key in chalk (「啦～」).
 */
export function karaokeKing(ctx: KitCtx, pos = 'wings'): string {
  const singing = pos === 'sing';
  const body = 'M-12 -26Q-14 -50 -9 -56Q0 -60 9 -56Q14 -50 12 -26Z';
  const legs = limb([-5, -28], [-7, 0], 5) + limb([5, -28], [7, 0], 5);
  const armMic: [Pt, Pt] = singing ? [[7, -52], [12, -64]] : [[7, -52], [10, -38]];
  const armFree: [Pt, Pt] = singing ? [[-7, -52], [-28, -64]] : [[-7, -52], [-8, -32]];
  const arms = limb(armMic[0], armMic[1], 4) + limb(armFree[0], armFree[1], 4);
  const head = 'M-9 -66a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0Z';
  const pomp = 'M-10 -68Q-12 -84 4 -86Q18 -86 16 -74Q12 -78 6 -76Q0 -72 -10 -68Z';
  const outline = `<path d="${legs}${body}${arms}${head}${pomp}"/>`;
  let sequins = '';
  for (let i = 0; i < 14; i++) sequins += `<circle cx="${f1(-9 + (i % 5) * 4.4)}" cy="${f1(-52 + Math.floor(i / 5) * 8 + (i % 2) * 2)}" r=".9" fill="${C.foilShine}" opacity=".85"/>`;
  const mic = `<g transform="translate(${armMic[1][0]} ${armMic[1][1]}) rotate(${singing ? -30 : 10})"><rect x="-1.6" y="0" width="3.2" height="10" rx="1" fill="${C.printDark}"/><circle r="3.4" fill="${N.chrome}"/></g>`;
  const print = `<path d="${legs}" fill="${C.printDark}"/><path d="M-12 0h9M3 0h11" stroke="${C.washi}" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="${body}" fill="${N.jacket}"/><path d="M-3 -56L0 -40L3 -56Z" fill="${C.washi}"/><path d="M-12 -40h24" stroke="${N.jacketDeep}" stroke-width="1.4"/>` + sequins
    + `<path d="${arms}" fill="${N.jacket}"/><circle cx="${armFree[1][0]}" cy="${armFree[1][1]}" r="3.2" fill="${S.skin}"/><circle cx="${armMic[1][0]}" cy="${armMic[1][1]}" r="3.2" fill="${S.skin}"/>`
    + `<path d="${head}" fill="${S.skin}"/><path d="${pomp}" fill="${N.pompadour}"/><path d="M-6 -78q8 -6 16 -4" stroke="${C.printLilac}" stroke-width="1" fill="none" opacity=".6"/>`
    + face(0.6, -64, { eyes: singing ? 'shut' : 'shut', mouth: singing ? 'open' : 'o', s: 0.84 }) + mic;
  const notes = singing
    ? chalk(18, -84, '♪', 13, -14) + chalk(30, -70, '♫', 11, 18) + chalk(-36, -82, '啦～', 10, -8) + ticks('M-34 -64l-6 -2M-34 -58h-7')
    : chalk(14, -88, '♪', 10) + chalk(-20, -92, '嗯～', 8);
  const stand = singing ? `<path d="M14 -60L22 0M14 0h16" stroke="${C.printDark}" stroke-width="1.8"/>` : '';
  return softEllipse(ctx, 0, 1, 18, 3, 'shadow', 0.4) + stand + figure(outline, print) + notes;
}

/** The boombox (4-5's, and its decoy): about 36 across, its handle up, two cones, a tape window. Shared by the baked part (`env/art/c4.ts`) and the live decoy (`decoyArt`). */
export function boomboxBody(ctx: KitCtx, playing: boolean): string {
  const body = 'M-17 -8H17Q19 -8 19 -6V10Q19 12 17 12H-17Q-19 12 -19 10V-6Q-19 -8 -17 -8Z';
  return depth(ctx, 3, `<path d="M-10 -8V-13H10V-8" stroke="${C.printDark}" stroke-width="2.2" fill="none"/><path d="${body}" fill="${N.speaker}"/>`
    + `<circle cx="-10" cy="3" r="5.6" fill="${C.printDark}" stroke="${N.chrome}" stroke-width="1"/><circle cx="10" cy="3" r="5.6" fill="${C.printDark}" stroke="${N.chrome}" stroke-width="1"/>`
    + `<circle cx="-10" cy="3" r="1.8" fill="${playing ? C.neonCyan : N.speakerCone}"/><circle cx="10" cy="3" r="1.8" fill="${playing ? C.neonCyan : N.speakerCone}"/>`
    + `<rect x="-4" y="-5" width="8" height="5" rx="1" fill="${playing ? C.neonPink : N.sleepInkDeep}"/>`
    + `<path d="M-17 -7.2H17" stroke="${C.cutRim}" stroke-width=".7" opacity=".4"/>`, `<path d="${body}"/>`);
}

