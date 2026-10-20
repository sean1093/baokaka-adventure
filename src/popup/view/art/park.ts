import { POPUP as C, POPUP_PARK as P, POPUP_STAGE as S } from '../../../art/palette';
import { depth, f1, softEllipse, type KitCtx } from '../../art';
import { dieCut } from './creatures';

/**
 * Chapter 2's cast and creatures (大安森林公園, #115; bible § 5), drawn live like the slice's
 * (`creatures.ts`): feet at the origin, facing +x, flat fills (no filters on a mover, GDD § 3.9),
 * one drawing per position. The park's animals are **origami** — faceted paper in two or three
 * tones with a crease line: the shiba asleep on the path, the turtle on its rock, the squirrel, the
 * egret. The people are **paper-style die-cut figures** (`dieCut`): the sleeping commuter, the
 * 掃地阿伯, the jogging 阿姨 and the old painter. Real people are never depicted (GDD § 6 risk 11):
 * these are generic, friendly types. A held item (GDD § 3.2 `heldBy`) is drawn by the view at
 * (+9, −20) from the feet, so the squirrel's and the painter's paws are there.
 */

/** Sleeping or open eyes, a blush, an optional smile: a paper-style face centred on (x, y). */
function face(x: number, y: number, { asleep = false, s = 1, smile = false }: { asleep?: boolean; s?: number; smile?: boolean } = {}): string {
  const k = (n: number) => f1(n * s);
  const eyes = asleep
    ? `<path d="M${f1(x - k(5))} ${y}q${k(2)} ${k(1.6)} ${k(4)} 0M${f1(x + k(1.5))} ${y}q${k(2)} ${k(1.6)} ${k(4)} 0" stroke="${C.ink}" stroke-width="${k(1.1)}" stroke-linecap="round" fill="none"/>`
    : `<circle cx="${f1(x - k(3))}" cy="${y}" r="${k(1.3)}" fill="${C.ink}"/><circle cx="${f1(x + k(3.4))}" cy="${y}" r="${k(1.3)}" fill="${C.ink}"/>`;
  const mouth = smile ? `<path d="M${f1(x - k(2))} ${f1(y + k(5))}q${k(2.4)} ${k(2)} ${k(4.6)} 0" stroke="${C.ink}" stroke-width="${k(1)}" fill="none" stroke-linecap="round"/>` : '';
  return eyes + mouth + `<circle cx="${f1(x - k(6))}" cy="${f1(y + k(4))}" r="${k(1.9)}" fill="${S.blush}" opacity=".6"/><circle cx="${f1(x + k(6.5))}" cy="${f1(y + k(4))}" r="${k(1.9)}" fill="${S.blush}" opacity=".6"/>`;
}

/**
 * A paper-style figure: one dropped shadow of its silhouette under the die-cut card (`dieCut`). The
 * card's own border is the cut edge, so a figure skips `depth`'s stacked copies: a third of the
 * nodes on pages with two or three of them (the animated budget, GDD § 3.9).
 */
const figure = (outline: string, print: string) =>
  `<g fill="${C.shadow}" opacity=".3" transform="translate(1.8 2.8)">${outline}</g>` + dieCut(outline, print);

/** Chalk "z Z" over a sleeper's head at (x, y). */
const zzz = (x: number, y: number, s = 1) =>
  `<text data-art-text="" x="${x}" y="${y}" font-family="Fredoka" font-weight="700" font-size="${f1(11 * s)}" fill="${C.chalk}" opacity=".9">z</text>`
  + `<text data-art-text="" x="${f1(x + 8 * s)}" y="${f1(y - 9 * s)}" font-family="Fredoka" font-weight="700" font-size="${f1(15 * s)}" fill="${C.chalk}">Z</text>`;

// ——— People (paper style) ———

/**
 * 2-1's commuter, asleep sitting on the platform bench (his node is the seat): a grey suit, his
 * head lolled onto his shoulder, his hands folded on a briefcase on his lap, his umbrella (the
 * part) leaning beside him. Origin on the seat under his hips.
 */
export function commuter(ctx: KitCtx): string {
  const outline = `<circle cx="2" cy="-60" r="13"/><path d="M-14 0q-4 -40 12 -48q18 -2 18 20l4 28z"/><path d="M-6 -6h32v10l2 30h-14l-2 -30h-18z"/>`;
  const print = `<path d="M12 2l2 32h10l-2 -32z" fill="${C.printLilacDeep}"/><path d="M10 32h16l2 5h-18z" fill="${C.printDark}"/>`
    + `<path d="M-6 -6h32v10h-32z" fill="${C.printLilacDeep}"/>`
    + `<path d="M-14 0q-4 -40 12 -48q18 -2 18 20l4 28z" fill="${P.commuterCoat}"/>`
    + `<path d="M-2 -46l6 12l6 -12z" fill="${P.commuterShirt}"/><path d="M4 -36l-2 8l2 4l2 -4z" fill="${P.xinyiDeep}"/>`
    // The briefcase on his lap, his hands folded on it
    + `<rect x="4" y="-20" width="24" height="16" rx="2" fill="${S.benchLeg}"/><path d="M12 -20v-3h8v3" stroke="${S.benchLeg}" stroke-width="1.6" fill="none"/>`
    + `<path d="M2 -18q8 -4 16 2" stroke="${S.skin}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    // His head, lolled to his shoulder, asleep
    + `<g transform="rotate(18 2 -60)"><circle cx="2" cy="-60" r="12" fill="${S.skin}"/><path d="M-10 -62q0 -12 12 -12q12 0 12 11q-6 -5 -12 -5q-8 0 -12 6z" fill="${S.hair}"/>`
    + face(3, -58, { asleep: true, s: 0.9 }) + `<ellipse cx="3" cy="-51" rx="1.4" ry="1" fill="${C.ink}" opacity=".7"/></g>`
    + zzz(18, -78, 0.9);
  return softEllipse(ctx, 10, 34, 26, 3.5, 'shadow', 0.4) + figure(outline, print);
}

/**
 * 2-2's 掃地阿伯, napping up on the bandshell's catwalk (his node, seated): a park sweeper's orange
 * vest over a blue shirt, a bucket hat, his legs dangling, his bamboo broom across his knees.
 */
export function sweeper(): string {
  const outline = `<circle cx="0" cy="-36" r="11"/><path d="M-12 0q-2 -26 12 -28q14 2 12 28z"/><path d="M-2 -2h20v26h-8v-18h-12z"/>`;
  const print = `<path d="M4 0h12v22h-6v-16h-6z" fill="${C.printLilacDeep}"/><path d="M8 22h10v4h-10z" fill="${C.printDark}"/>`
    + `<path d="M-12 0q-2 -26 12 -28q14 2 12 28z" fill="${P.sweeperShirt}"/><path d="M-8 -2q0 -20 8 -22q8 2 8 22z" fill="${P.sweeperVest}"/>`
    + `<path d="M-6 -12h12" stroke="${C.chalk}" stroke-width="2" opacity=".85"/>`
    + `<circle cx="0" cy="-36" r="10" fill="${S.skin}"/><path d="M-13 -38q1 -11 13 -11q12 0 13 11z" fill="${P.lampPostLit}"/><path d="M-14 -38h28" stroke="${P.lampPost}" stroke-width="2"/>`
    + face(1, -33, { asleep: true, s: 0.8 })
    // The broom across his knees
    + `<path d="M-22 -6l40 -4" stroke="${P.plank}" stroke-width="2.6" stroke-linecap="round"/><path d="M18 -10l12 -6l2 10z" fill="${C.corrugatedLight}"/>`
    + zzz(8, -52, 0.8);
  return figure(outline, print);
}

/**
 * 2-3's jogging 阿姨 (paper style): a pink windbreaker, navy leggings, a visor and a short ponytail.
 * `stretch`: on the bridge, one arm up over her head, leaning into the stretch (she blocks it);
 * `away`: jogging off along the far path, smaller, looking back with a wave.
 */
export function jogger(ctx: KitCtx, pos = 'stretch'): string {
  if (pos === 'away') {
    const outline = `<circle cx="0" cy="-58" r="11"/><path d="M-12 -14q-2 -30 12 -34q14 4 12 34z"/><path d="M-12 -16l-10 16h8l8 -12l6 12h8l-10 -18z"/>`;
    const print = `<path d="M-12 -16l-10 16h7l9 -12zM2 -16l10 16h8l-12 -18z" fill="${P.joggerPants}"/>`
      + `<path d="M-12 -14q-2 -30 12 -34q14 4 12 34z" fill="${P.joggerTop}"/><path d="M0 -46v32" stroke="${P.joggerDeep}" stroke-width="1.2"/>`
      + `<path d="M10 -40q10 -10 12 -22" stroke="${P.joggerTop}" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="22" cy="-63" r="3.4" fill="${S.skin}"/>`
      + `<circle cx="0" cy="-58" r="10" fill="${S.skin}"/><path d="M-11 -60q1 -10 11 -10q10 0 10 9q-4 -4 -11 -4z" fill="${S.hair}"/><path d="M-12 -62q-8 2 -10 10q6 -2 10 -6z" fill="${S.hair}"/>`
      + `<path d="M-2 -66h16l-2 4h-14z" fill="${P.joggerDeep}"/>` + face(2, -57, { s: 0.8, smile: true });
    return `<g transform="scale(.8)">` + softEllipse(ctx, 0, 0, 16, 3, 'shadow', 0.4) + figure(outline, print) + `</g>`;
  }
  // Stretching: weight on her front foot, the near arm reaching up and over toward +x
  const outline = `<circle cx="-2" cy="-80" r="12"/><path d="M-16 -28q-4 -38 14 -42q18 4 14 42z"/><path d="M-14 -30l-10 30h10l6 -22l6 22h10l-10 -30z"/><path d="M8 -62q22 -14 22 -40l8 2q0 30 -26 46z"/>`;
  const print = `<path d="M-14 -30l-10 30h9l7 -22zM2 -30l10 30h9l-11 -30z" fill="${P.joggerPants}"/><path d="M-26 -2h12v3h-12zM10 -2h13v3h-13z" fill="${C.cutRim}"/>`
    + `<path d="M-16 -28q-4 -38 14 -42q18 4 14 42z" fill="${P.joggerTop}"/><path d="M-2 -68v38" stroke="${P.joggerDeep}" stroke-width="1.4"/>`
    + `<path d="M-14 -40h24" stroke="${C.chalk}" stroke-width="1.6" opacity=".8"/>`
    // The arm up over her head, its hand open
    + `<path d="M8 -62q22 -14 22 -40" stroke="${P.joggerTop}" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="31" cy="-104" r="4" fill="${S.skin}"/>`
    + `<path d="M-14 -56q-8 12 -2 24" stroke="${P.joggerDeep}" stroke-width="6" stroke-linecap="round" fill="none"/>`
    // Head, visor, ponytail
    + `<circle cx="-2" cy="-80" r="11" fill="${S.skin}"/><path d="M-14 -82q1 -12 12 -12q11 0 11 10q-4 -4 -12 -4z" fill="${S.hair}"/>`
    + `<path d="M-14 -84q-10 0 -12 12q6 -2 12 -8z" fill="${S.hair}"/><path d="M-4 -90h18l-3 5h-15z" fill="${P.joggerDeep}"/>`
    + face(0, -79, { s: 0.85, smile: true });
  return softEllipse(ctx, 0, 1, 22, 3.5, 'shadow', 0.42) + figure(outline, print);
}

/**
 * 2-6's old painter (paper style): a blue smock, a cream beret (the squirrel naps on it at his
 * node + (0, −80)), a white moustache. `sleep`: dozing on his stool, his chin on his chest, the 畫筆
 * loose in his hand (the view draws it at (+9, −20)); `nodding`: slumped back in his chair,
 * waving drowsily in his sleep, smiling.
 */
export function painter(ctx: KitCtx, pos = 'sleep'): string {
  const stool = `<path d="M-14 -24h28v5h-28zM-11 -19l-4 19M11 -19l4 19M0 -19v19" stroke="${P.plankDeep}" stroke-width="3" fill="${P.plank}" stroke-linejoin="round"/>`;
  if (pos === 'nodding') {
    const outline = `<circle cx="-8" cy="-60" r="13"/><path d="M-26 -14q-2 -36 16 -40q20 2 20 40z"/><path d="M-14 -16h40l4 16h-12l-2 -6h-30z"/><path d="M10 -40q16 -14 18 -30l8 2q-2 22 -22 36z"/>`;
    const print = `<path d="M-10 -16h36l4 16h-10l-3 -8h-27z" fill="${S.benchLeg}"/>`
      + `<path d="M-26 -14q-2 -36 16 -40q20 2 20 40z" fill="${P.painterSmock}"/><path d="M-18 -30q10 6 24 0" stroke="${P.painterSmockDeep}" stroke-width="1.6" fill="none"/>`
      + `<path d="M10 -40q16 -14 18 -30" stroke="${P.painterSmock}" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="29" cy="-72" r="4.4" fill="${S.skin}"/>`
      + `<path d="M24 -78l3 -4M29 -80v-5M34 -78l3 -3" stroke="${C.chalk}" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`
      + `<g transform="rotate(-14 -8 -60)"><circle cx="-8" cy="-60" r="12" fill="${S.skin}"/><path d="M-22 -66q2 -12 14 -12q14 0 16 10q-12 -4 -30 2z" fill="${P.parasolCream}"/><circle cx="-6" cy="-79" r="2" fill="${P.parasolCream}"/>`
      + face(-7, -60, { asleep: true, s: 0.9, smile: true }) + `<path d="M-14 -54q7 4 13 0" stroke="${C.standeeCard}" stroke-width="3" stroke-linecap="round" fill="none"/></g>`
      + zzz(-26, -80, 0.85);
    return softEllipse(ctx, 0, 1, 30, 4, 'shadow', 0.42) + figure(outline, print);
  }
  const outline = `<circle cx="-4" cy="-62" r="13"/><path d="M-20 -22q-4 -34 14 -38q18 2 16 38z"/><path d="M-10 -24h28v8l2 16h-10l-2 -14h-18z"/>`;
  const print = stool + `<path d="M6 -24h12v8l2 16h-9l-2 -14h-3z" fill="${S.benchLeg}"/><path d="M10 -2h12v3h-12z" fill="${C.printDark}"/>`
    + `<path d="M-20 -22q-4 -34 14 -38q18 2 16 38z" fill="${P.painterSmock}"/><path d="M-14 -36q10 6 22 0" stroke="${P.painterSmockDeep}" stroke-width="1.6" fill="none"/>`
    // His hand at (+9, −20), where the 畫筆 is drawn; paint spots on the smock
    + `<path d="M-6 -46q8 14 14 26" stroke="${P.painterSmock}" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="9" cy="-19" r="4.2" fill="${S.skin}"/>`
    + `<path d="M-11.6 -30a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M.6 -34a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0 -2.8 0" fill="${P.parasol}"/>`
    // His head, chin on his chest; the beret (the squirrel's bed)
    + `<g transform="rotate(10 -4 -62)"><circle cx="-4" cy="-62" r="12" fill="${S.skin}"/><path d="M-18 -68q2 -12 14 -12q14 0 16 10q-12 -4 -30 2z" fill="${P.parasolCream}"/><circle cx="-2" cy="-81" r="2" fill="${P.parasolCream}"/>`
    + face(-3, -61, { asleep: true, s: 0.9 }) + `<path d="M-10 -55q7 4 13 0" stroke="${C.standeeCard}" stroke-width="3" stroke-linecap="round" fill="none"/></g>`
    + zzz(10, -86, 0.85);
  return softEllipse(ctx, 0, 1, 24, 4, 'shadow', 0.42) + figure(outline, print);
}

// ——— Origami creatures ———

/**
 * The shiba (origami, 2-3): `sleep` curled round on the path, its tail over its nose; `away`
 * trotting off, its tail up.
 */
export function shiba(ctx: KitCtx, pos = 'sleep'): string {
  if (pos === 'away') {
    const body = 'M-20 -14L-6 -22L16 -20L24 -30L32 -26L30 -16L22 -10L18 0H12L10 -8H-8L-12 0H-18L-18 -10Z';
    return softEllipse(ctx, 2, 1, 22, 3, 'shadow', 0.42)
      + depth(ctx, 4, `<path d="${body}" fill="${P.dog}"/><path d="M-6 -22L-2 -10H10L16 -20Z" fill="${P.dogDeep}" opacity=".55"/>`
        + `<path d="M24 -30L26 -38L30 -30ZM28 -28L33 -35L33 -26Z" fill="${P.dogDeep}"/><path d="M26 -20L32 -18L28 -14Z" fill="${P.dogCream}"/>`
        + `<path d="M-20 -14q-8 -10 -2 -18q4 6 6 12z" fill="${P.dog}"/><path d="M-19 -22q-2 -6 1 -9" stroke="${P.dogCream}" stroke-width="1.6" fill="none"/>`
        + `<circle cx="28.4" cy="-24" r="1" fill="${C.ink}"/><path d="M-6 -22L-2 -10" stroke="${C.cutRim}" stroke-width=".7" opacity=".6"/>`, `<path d="${body}"/>`);
  }
  // Curled asleep: a folded round loaf, the head tucked on its paws, the curly tail over its nose
  const loaf = 'M-24 0Q-28 -18 -12 -24L4 -26Q20 -24 24 -10L24 0Z';
  return softEllipse(ctx, 0, 1, 28, 3.5, 'shadow', 0.42)
    + depth(ctx, 4, `<path d="${loaf}" fill="${P.dog}"/><path d="M-12 -24L-4 0H-24Q-28 -18 -12 -24Z" fill="${P.dogDeep}" opacity=".45"/>`
      + `<path d="M4 -16L22 -14L24 0H6Z" fill="${P.dogCream}"/><path d="M10 -18L14 -26L18 -17ZM16 -17L22 -24L22 -14Z" fill="${P.dogDeep}"/>`
      + `<path d="M8 -8q3 2 6 0" stroke="${C.ink}" stroke-width="1" fill="none" stroke-linecap="round"/><circle cx="22" cy="-6" r="1.4" fill="${C.ink}"/>`
      + `<path d="M-22 -4q4 -14 22 -12q4 2 2 6" stroke="${P.dogCream}" stroke-width="4.4" fill="none" stroke-linecap="round"/>`
      + `<path d="M-12 -24L-4 0" stroke="${C.cutRim}" stroke-width=".7" opacity=".6"/>`, `<path d="${loaf}"/>`)
    + zzz(18, -26, 0.7);
}

/** The turtle (origami, 2-3) on its rock: a faceted shell; `waving` lifts a front flipper and smiles. */
export function turtle(ctx: KitCtx, pos = 'rest'): string {
  const shell = 'M-16 -4L-10 -16L4 -18L14 -10L16 -4Z';
  const flipper = pos === 'waving'
    ? `<path d="M10 -8L18 -22L22 -20L14 -6Z" fill="${P.turtleLight}"/><path d="M19 -26l2 -3M23 -24l3 -2" stroke="${C.chalk}" stroke-width="1" stroke-linecap="round" opacity=".8"/>`
    : `<path d="M8 -4L16 0L10 0Z" fill="${P.turtleLight}"/>`;
  return softEllipse(ctx, 0, 0, 18, 2.6, 'shadow', 0.4)
    + depth(ctx, 4, `<path d="M-14 -4L-20 0L-12 0ZM-6 -4L-8 0H-2Z" fill="${P.turtleLight}"/><path d="M14 -10L24 -12L26 -6L16 -4Z" fill="${P.turtleLight}"/>`
      + `<path d="${shell}" fill="${P.turtle}"/><path d="M-10 -16L-4 -4L4 -18M4 -18L6 -4L14 -10" stroke="${P.turtleDeep}" stroke-width="1" fill="none"/>`
      + `<path d="M-10 -16L-4 -4L4 -18Z" fill="${P.turtleDeep}" opacity=".35"/>` + flipper
      + `<circle cx="22.6" cy="-9.6" r="1" fill="${C.ink}"/>`
      + (pos === 'waving' ? `<path d="M21 -7q2 1.4 4 0" stroke="${C.ink}" stroke-width=".8" fill="none"/>` : ''), `<path d="${shell}"/>`);
}

/**
 * The squirrel (origami, 2-4 and 2-6): a Taiwan red-bellied squirrel, its grey back, rust belly and
 * a great folded tail. Sitting up (`east`, `west`, `low`, `tree`) with its paws at (+9, −20) to
 * hold the bead; `away` scampering; `hat` curled asleep (on the painter's beret).
 */
export function squirrel(ctx: KitCtx, pos = 'east'): string {
  if (pos === 'hat') {
    const ball = 'M-12 0Q-14 -12 -2 -14Q10 -14 12 -4L12 0Z';
    return depth(ctx, 4, `<path d="M-10 -2Q-22 -14 -10 -22Q2 -24 0 -12" fill="${P.squirrel}"/><path d="${ball}" fill="${P.squirrel}"/>`
      + `<path d="M2 -10L12 -4V0H2Z" fill="${P.squirrelBelly}"/><path d="M4 -12l2 -6l3 5z" fill="${P.squirrelDeep}"/>`
      + `<path d="M5 -7q2 1.4 4 0" stroke="${C.ink}" stroke-width=".9" fill="none" stroke-linecap="round"/>`, `<path d="${ball}"/>`)
      + zzz(10, -16, 0.6);
  }
  if (pos === 'away') {
    const body = 'M-8 -6L4 -12L14 -10L18 -4L12 0H-4Z';
    return depth(ctx, 4, `<path d="M-8 -6Q-22 -6 -20 -22Q-12 -14 -4 -12Z" fill="${P.squirrel}"/><path d="${body}" fill="${P.squirrel}"/>`
      + `<path d="M4 -6L12 0H0Z" fill="${P.squirrelBelly}"/><path d="M12 -10l1 -5l3 4z" fill="${P.squirrelDeep}"/><circle cx="14.6" cy="-7" r=".9" fill="${C.ink}"/>`, `<path d="${body}"/>`);
  }
  const body = 'M-6 0L-8 -14L-2 -24L6 -26L12 -20L10 -10L6 0Z';
  const tail = 'M-6 -4Q-24 -8 -20 -28Q-16 -38 -6 -34Q-14 -26 -8 -16Z';
  // Sitting up a little larger, its paws (scaled) still at (+9, −20) for the bead
  return `<g transform="scale(1.25)">` + softEllipse(ctx, 0, 0, 12, 2.4, 'shadow', 0.4)
    + `<path d="${tail}${body}" fill="${C.shadow}" opacity=".3" transform="translate(1 1.8)"/>`
    + (`<path d="${tail}" fill="${P.squirrel}"/><path d="M-20 -28Q-16 -38 -6 -34Q-14 -26 -12 -20Z" fill="${P.squirrelDeep}" opacity=".5"/>`
      + `<path d="${body}" fill="${P.squirrel}"/><path d="M0 -20L6 -18L8 -4L2 0Z" fill="${P.squirrelBelly}"/>`
      + `<path d="M2 -26L4 -32L7 -26Z" fill="${P.squirrelDeep}"/><circle cx="8" cy="-22" r="1.1" fill="${C.ink}"/><path d="M12 -20l2 0" stroke="${C.ink}" stroke-width="1"/>`
      // Its paws held up in front (the bead sits in them)
      + `<path d="M6 -16l5 -3M6 -13l5 -2" stroke="${P.squirrelDeep}" stroke-width="2" stroke-linecap="round"/>`
      + `<path d="M-8 -14L-2 -24" stroke="${C.cutRim}" stroke-width=".7" opacity=".6"/>`) + `</g>`;
}

/** The egret (origami, 2-5): a white folded heron on long dark legs, its S-neck and black bill; in the reeds it stands at rest. */
export function egret(ctx: KitCtx, pos = 'pad'): string {
  const body = 'M-16 -30L-2 -38L10 -34L12 -28L0 -22H-12Z';
  const neck = 'M8 -34L12 -48L8 -56L14 -62L18 -58L14 -52L16 -36Z';
  const wing = pos === 'reeds' ? 'M-14 -30L-2 -36L4 -28Z' : 'M-14 -30L-4 -40L4 -30Z';
  return softEllipse(ctx, 0, 0, 14, 2.4, 'shadow', 0.4)
    + `<path d="M-4 -22L-6 0M2 -22L4 0" stroke="${C.printDark}" stroke-width="1.6"/>`
    + depth(ctx, 4, `<path d="${body}" fill="${P.egret}"/><path d="${neck}" fill="${P.egret}"/><path d="${wing}" fill="${P.egretShade}"/>`
      + `<path d="M-16 -30L-24 -26L-14 -26Z" fill="${P.egretShade}"/><path d="M14 -62L26 -60L14 -58Z" fill="${C.printDark}"/>`
      + `<path d="M12 -48L16 -36" stroke="${P.egretDeep}" stroke-width=".8" opacity=".7"/><circle cx="15" cy="-60" r=".9" fill="${C.ink}"/>`
      + `<path d="M-2 -38L0 -22" stroke="${C.cutRim}" stroke-width=".7" opacity=".7"/>`, `<path d="${body}"/><path d="${neck}"/>`);
}
