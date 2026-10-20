import { POPUP as C, POPUP_CAMPUS as K, POPUP_STAGE as S } from '../../../art/palette';
import { depth, softEllipse, type KitCtx } from '../../art';

/**
 * Chapter 3's cast and creatures (台灣大學, #117; bible § 5), drawn live like the park's
 * (`park.ts`): feet at the origin, flat fills (no filters on a mover, GDD § 3.9), one drawing per
 * position. The animals are **origami** — faceted paper in two or three tones with a crease line:
 * the goose of 醉月湖 and 藍教授, a Taiwan blue magpie in a little mortarboard. The ad poster's
 * person (3-1) is a printed figure in a framed poster. Real people are never depicted (GDD § 6
 * risk 11).
 */

/** Chalk text (a honk, a 「哼」) at (x, y). */
const chalk = (x: number, y: number, text: string, size = 11) =>
  `<text data-art-text="" x="${x}" y="${y}" font-family="'Noto Serif TC'" font-weight="900" font-size="${size}" fill="${C.chalk}">${text}</text>`;

/** Short chalk motion ticks behind a mover at (x, y). */
const ticks = (x: number, y: number) => `<path d="M${x} ${y}h-9M${x + 2} ${y + 6}h-12M${x} ${y + 12}h-8" stroke="${C.chalk}" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`;

/**
 * The goose of 醉月湖 (origami, 3-3), facing +x. `nest`: sitting low on her nest, her neck up;
 * `honk`: rearing up at Mocha with her wings spread and her bill open (「嘎！」); `chase`: running
 * after him, her neck stretched out low, wings half open.
 */
export function goose(ctx: KitCtx, pos = 'nest'): string {
  const bill = K.gooseBill;
  if (pos === 'honk') {
    const body = 'M-16 -8L-10 -24L4 -28L12 -20L8 -6Z';
    const wingA = 'M-8 -24L-32 -48L-24 -50L-2 -30Z';
    const wingB = 'M0 -26L-6 -58L2 -56L8 -26Z';
    const neck = 'M6 -26L14 -46L20 -48L16 -24Z';
    const head = 'M14 -46L18 -54L26 -52L26 -46L18 -44Z';
    return softEllipse(ctx, 0, 1, 18, 3, 'shadow', 0.42)
      + `<path d="M-4 -6L-6 0M4 -6L6 0" stroke="${bill}" stroke-width="2"/>`
      + depth(ctx, 4, `<path d="${wingA}${wingB}" fill="${K.gooseShade}"/><path d="M-8 -24L-28 -46M0 -26L-4 -54" stroke="${K.gooseDeep}" stroke-width=".8"/>`
        + `<path d="${body}${neck}${head}" fill="${K.goose}"/><path d="M-10 -24L0 -8L8 -6L12 -20Z" fill="${K.gooseShade}" opacity=".5"/>`
        + `<path d="M26 -52L35 -54L27 -49ZM26 -48L34 -44L26 -46Z" fill="${bill}"/><circle cx="21" cy="-50" r="1.1" fill="${C.ink}"/>`
        + `<path d="M-10 -24L4 -28" stroke="${C.cutRim}" stroke-width=".7" opacity=".7"/>`, `<path d="${body}${neck}${head}${wingA}${wingB}"/>`)
      + `<path d="M38 -58l5 -3M39 -50h6M38 -43l5 3" stroke="${C.chalk}" stroke-width="1.4" stroke-linecap="round"/>` + chalk(30, -62, '嘎！');
  }
  if (pos === 'chase') {
    const body = 'M-22 -14L-10 -24L8 -22L14 -14L6 -8H-16Z';
    const wing = 'M-10 -24L-20 -38L-2 -24Z';
    const neck = 'M10 -20L28 -26L30 -22L12 -14Z';
    const head = 'M28 -28L36 -28L38 -23L30 -21Z';
    return softEllipse(ctx, 0, 1, 20, 3, 'shadow', 0.42)
      + `<path d="M-6 -8L-12 0M2 -8L8 0" stroke="${bill}" stroke-width="2"/>`
      + depth(ctx, 4, `<path d="${wing}" fill="${K.gooseShade}"/><path d="${body}${neck}${head}" fill="${K.goose}"/>`
        + `<path d="M-10 -24L-4 -8H6L8 -22Z" fill="${K.gooseShade}" opacity=".5"/><path d="M38 -27L45 -25L38 -23Z" fill="${bill}"/><circle cx="33" cy="-26" r="1" fill="${C.ink}"/>`
        + `<path d="M-10 -24L-4 -8" stroke="${C.cutRim}" stroke-width=".7" opacity=".7"/>`, `<path d="${body}${neck}${head}${wing}"/>`)
      + ticks(-26, -20);
  }
  // On her nest: a low loaf, the neck curving up, the bill to +x
  const body = 'M-22 -4L-14 -18L4 -20L12 -12L10 0H-18Z';
  const neck = 'M4 -18L8 -34L14 -36L13 -16Z';
  const head = 'M8 -34L12 -40L19 -39L19 -33L13 -32Z';
  return softEllipse(ctx, 0, 1, 24, 3.5, 'shadow', 0.42)
    + depth(ctx, 4, `<path d="M-22 -4L-29 -11L-20 -13Z" fill="${K.gooseShade}"/><path d="${body}${neck}${head}" fill="${K.goose}"/>`
      + `<path d="M-14 -18L-4 -4L10 -6L4 -20Z" fill="${K.gooseShade}" opacity=".7"/><path d="M19 -39L27 -36L19 -34Z" fill="${bill}"/><circle cx="19" cy="-39.6" r="1.6" fill="${bill}"/>`
      + `<circle cx="14.6" cy="-37" r="1" fill="${C.ink}"/><path d="M-14 -18L-4 -4" stroke="${C.cutRim}" stroke-width=".7" opacity=".7"/>`, `<path d="${body}${neck}${head}"/>`);
}

/**
 * 藍教授, a Taiwan blue magpie (origami, 3-6), facing −x toward Baokaka across the giant book: a
 * blue back, a black hood, a red bill and legs, the long tail with white tips, and a little
 * mortarboard with a foil tassel. Her reading glasses (the decoy, `heldBy`) are drawn by the view
 * over her eye at (−12, −30). `book`: perched on the 書; any other position (she flaps off the
 * page): in flight, wings up.
 */
export function magpie(ctx: KitCtx, pos = 'book'): string {
  const cap = `<path d="M-20 -42L-8 -46L2 -42L-10 -38Z" fill="${C.printDark}"/><path d="M-14 -40v-3h8v3" fill="${C.printDark}"/>`
    + `<path d="M-8 -42L0 -36v6" stroke="${C.goldDeep}" stroke-width="1.2" fill="none"/><circle cx="0" cy="-29" r="1.6" fill="${C.goldDeep}"/>`;
  const tail = 'M10 -14L50 -4L52 2L46 2L8 -8Z';
  const tips = `<path d="M44 -6L52 -4L52 2L46 2Z" fill="${C.cutRim}"/><path d="M34 -8L40 -6.6" stroke="${C.cutRim}" stroke-width="2" opacity=".85"/>`;
  if (pos !== 'book') {
    const body = 'M-12 -26L0 -32L14 -26L8 -18H-8Z';
    const wings = 'M-4 -30L-20 -58L4 -36ZM6 -30L24 -60L12 -30Z';
    return depth(ctx, 4, `<path d="M10 -27L46 -22L46 -16L8 -21Z" fill="${K.magpie}"/><path d="M40 -22.8L46 -22V-16L40 -17Z" fill="${C.cutRim}"/><path d="${wings}" fill="${K.magpieDeep}"/><path d="${body}" fill="${K.magpie}"/>`
      + `<path d="M-12 -26L-20 -30L-14 -36L-6 -34Z" fill="${K.magpieHood}"/><path d="M-20 -32L-28 -31L-20 -29Z" fill="${K.magpieBill}"/><circle cx="-14" cy="-32" r="1" fill="${C.cutRim}"/>`, `<path d="${body}${wings}"/>`)
      + ticks(30, -36);
  }
  const body = 'M-14 -22Q-14 -32 -4 -32L8 -28L14 -16L8 -6H-8Q-14 -10 -14 -22Z';
  const hood = 'M-14 -22Q-16 -36 -6 -38Q4 -38 4 -28L-2 -18H-12Z';
  const wing = 'M-2 -26L14 -18L8 -8L-4 -14Z';
  return softEllipse(ctx, 6, 1, 26, 3.5, 'shadow', 0.42)
    + `<path d="M-4 -6L-5 0M2 -6L3 0" stroke="${K.magpieBill}" stroke-width="1.8"/>`
    + depth(ctx, 4, `<path d="${tail}" fill="${K.magpie}"/>${tips}<path d="${body}" fill="${K.magpie}"/><path d="${wing}" fill="${K.magpieDeep}"/>`
      + `<path d="M0 -24L12 -18" stroke="${K.magpieLight}" stroke-width="1.2" opacity=".8"/><path d="${hood}" fill="${K.magpieHood}"/>`
      + `<path d="M-15 -31L-24 -28L-15 -26Z" fill="${K.magpieBill}"/><circle cx="-11" cy="-31" r="1.2" fill="${C.cutRim}"/>`
      + `<path d="M-6 -38Q4 -38 4 -28" stroke="${C.cutRim}" stroke-width=".7" fill="none" opacity=".5"/>` + cap, `<path d="${body}${hood}${tail}"/>`);
}

/**
 * 3-1's ad poster on the platform wall (a `creature` that waves back to 掰掰): a framed print of a
 * cheerful student by 椰林大道's palms, a book under her arm, the headline 「讀冊去！」. `waving`:
 * her free arm up in a wave, with motion ticks. The poster's foot (its frame's bottom) is at the origin.
 */
export function campusPoster(ctx: KitCtx, pos = 'still'): string {
  const arm = pos === 'waving'
    ? `<path d="M7 -30l9 -15" stroke="${S.skin}" stroke-width="4" stroke-linecap="round"/><path d="M18 -52l3 -4M22 -46l4 -2" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round"/>`
    : `<path d="M7 -30l6 10" stroke="${S.skin}" stroke-width="4" stroke-linecap="round"/>`;
  const palm = (x: number) => `<path d="M${x} -18V-50" stroke="${K.palmTrunk}" stroke-width="2"/><path d="M${x} -50q-6 -4 -11 3M${x} -50q6 -4 11 3M${x} -50q-4 -6 -9 -5M${x} -50q4 -6 9 -5" stroke="${K.palm}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const frame = `<rect x="-26" y="-64" width="52" height="64" rx="2"/>`;
  return depth(ctx, 2, `<rect x="-26" y="-64" width="52" height="64" rx="2" fill="${C.printLilacDeep}"/><rect x="-22" y="-60" width="44" height="56" fill="${K.posterSky}"/>`
    + `<circle cx="13" cy="-50" r="5" fill="${K.posterSun}"/>` + palm(-16) + palm(16)
    + `<path d="M-22 -18h44v14h-44z" fill="${C.washi}"/>`
    + `<text data-art-text="" x="0" y="-8" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8" fill="${K.bookRed}" letter-spacing="1">讀冊去！</text>`
    + `<path d="M-9 -18q0 -15 9 -15q9 0 9 15z" fill="${K.songshan}"/><circle cy="-39" r="6.6" fill="${S.skin}"/>`
    + `<path d="M-7 -41q1 -7 7 -7q6 0 7 7q-3 -3 -7 -3q-4 0 -7 3z" fill="${C.printDark}"/>`
    + `<circle cx="-2.4" cy="-39" r=".9" fill="${C.ink}"/><circle cx="2.4" cy="-39" r=".9" fill="${C.ink}"/><path d="M-2 -36q2 1.6 4 0" stroke="${C.ink}" stroke-width=".9" fill="none"/>`
    + `<rect x="-17" y="-29" width="9" height="11" rx="1" fill="${K.bookRed}"/><path d="M-8 -30l-5 6" stroke="${S.skin}" stroke-width="4" stroke-linecap="round"/>` + arm, frame);
}
