import { POPUP as C, POPUP_STATION as T, mixHex } from '../../../art/palette';
import { depth, f1, softEllipse, type KitCtx } from '../../art';
import type { PartSource } from '../sources';

/**
 * Chapter 5 (士林夜市, 02:20) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#121) draws only the placeholders whose preset art
 * would mislead (D-77, D-81): 5-5's coins (a pushable's default is a bead) and 5-4's pachinko
 * board (its ball's state part would draw as a turning disc). The chapter's art issue (#122) draws
 * the palette kit, the six backdrops and every other part.
 */

// ——— 5-5's coins ———

/**
 * A NT$10 coin (a pushable, C3), local origin at its centre: standing on its edge on a massage
 * chair's coin box (`onPerch`), tumbling (`falling`), half into the slot (`landed`). Steel, never
 * gold: the gold bead is the only gold on the page.
 */
const coin: PartSource = {
  preset: 'pushable',
  states: ['onPerch', 'falling', 'landed'],
  box: { x: -20, y: -20, w: 40, h: 40 },
  draw(ctx: KitCtx, state) {
    const face = depth(ctx, 2, `<circle r="10" fill="${T.steel}"/><circle r="7.6" fill="none" stroke="${T.steelDeep}" stroke-width="1"/>`
      + `<text data-art-text="" y="3.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${T.steelDeep}">10</text>`
      + `<path d="M-6 -6.4q3 -2.4 6.4 -2.4" stroke="${C.foilShine}" stroke-width="1.4" stroke-linecap="round" fill="none"/>`, `<circle r="10"/>`);
    if (state === 'landed') {
      // Half in the slot: the slot's lips over its lower half
      return `<g transform="translate(0 -4)">${face}</g><rect x="-13" y="0" width="26" height="6" rx="2" fill="${C.printDark}"/>`
        + `<path d="M-12 .6H12" stroke="${mixHex(C.printDark, C.chalk, 0.4)}" stroke-width=".8"/>`;
    }
    const turn = state === 'falling' ? 'rotate(35) scale(.7 1)' : '';
    return softEllipse(ctx, 0, 12, 9, 2, 'shadow', 0.35) + `<g transform="${turn}">${face}</g>`;
  },
};

// ——— 5-4's pachinko board ———

/** The board's peg field: brass pins in staggered rows, skipping the lanes the ball runs down. */
function pegs(): string {
  let d = '';
  for (let row = 0; row < 9; row++) {
    const y = -150 + row * 30;
    for (let x = -96 + (row % 2) * 12; x <= 70; x += 24) {
      if (Math.abs(x - 40) < 8 && y < -40) continue;
      d += `M${f1(x)} ${f1(y)}h.01`;
    }
  }
  return `<path d="${d}" stroke="${C.goldDeep}" stroke-width="3.2" stroke-linecap="round"/>`
    + `<path d="${d}" stroke="${C.foilShine}" stroke-width="1.2" stroke-linecap="round" transform="translate(-.6 -.6)"/>`;
}

/**
 * 5-4's pachinko board (a `tab` nobody drives: the ball's state part, printed art per state), local
 * origin at the hit centre (265, 260). A cabinet in a chrome frame: glass over a lilac card face, a
 * field of brass pegs, the launch rail up the right side to the launcher at the top (where the ball
 * waits), the jackpot hole 「大獎」 in the middle (lit in `jackpot`), the out-hole at the foot, and the
 * ball tray jutting out at the bottom left, by his side (lit in `tray`). The two flippers are their
 * own tabs, drawn over it.
 */
const pachinkoBoard: PartSource = {
  preset: 'tab',
  states: ['start', 'jackpot', 'tray'],
  box: { x: -150, y: -200, w: 270, h: 410 },
  draw(ctx: KitCtx, state) {
    const cabinet = 'M-112 -186H112Q118 -186 118 -180V176Q118 182 112 182H-112Q-118 182 -118 176V-180Q-118 -186 -112 -186Z';
    const face = depth(ctx, 4, `<path d="${cabinet}" fill="${C.printDark}"/>`
      + `<rect x="-106" y="-176" width="212" height="300" rx="10" fill="${C.printLilac}"/>`
      + `<rect x="-106" y="-176" width="212" height="300" rx="10" fill="none" stroke="${T.steel}" stroke-width="3"/>`
      // The launch rail: up the right side, over the top into the field
      + `<path d="M92 120V-150Q92 -168 72 -168H-40" stroke="${T.steel}" stroke-width="2.4" fill="none"/>`
      // Lane rails under the upper flipper (left lane, right lane) and the out-hole
      + `<path d="M-40 -60L-80 40M20 -60L60 40" stroke="${C.printLilacDeep}" stroke-width="2" stroke-linecap="round"/>`
      + `<ellipse cx="20" cy="112" rx="12" ry="5" fill="${C.ink}"/>`
      // The lower panel: the cabinet's lamps and its name
      + `<rect x="-106" y="132" width="212" height="40" rx="6" fill="${C.nightCardDeep}"/>`
      + `<text data-art-text="" x="0" y="160" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="18" fill="${C.chalk}">彈珠台</text>`,
    `<path d="${cabinet}"/>`);
    // The jackpot hole (page (236, 300) → local (-29, 40)): a ringed cup, lit when the ball drops in
    const hot = state === 'jackpot';
    const jackpot = (hot ? softEllipse(ctx, -29, 40, 34, 26, 'lamp', 0.5, 'blur8') : '')
      + `<circle cx="-29" cy="40" r="15" fill="${hot ? C.lampHot : C.wordWow}" stroke="${C.goldDeep}" stroke-width="2"/>`
      + `<circle cx="-29" cy="40" r="7" fill="${C.ink}"/>`
      + `<text data-art-text="" x="-29" y="70" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="12" fill="${hot ? C.lampHot : C.chalk}">大獎</text>`;
    // The ball tray, jutting out at the bottom left by his side (page (160, 470) → local (-105, 210))
    const lit = state === 'tray';
    const tray = (lit ? softEllipse(ctx, -108, 196, 40, 14, 'lamp', 0.45, 'blur8') : '')
      + depth(ctx, 3, `<path d="M-146 184H-70L-78 204H-138Z" fill="${T.steel}"/><path d="M-142 188H-74" stroke="${C.foilShine}" stroke-width="1.4"/>`,
        `<path d="M-146 184H-70L-78 204H-138Z"/>`)
      + `<path d="M-118 168V184" stroke="${T.steelDeep}" stroke-width="5"/>`;
    // The glass over the face: a cool sheen
    const glass = `<path d="M-100 -170L-40 -170L-100 -40Z" fill="${C.glassine}" opacity=".18"/>`;
    return face + pegs() + jackpot + tray + glass;
  },
};

export const C5_PARTS: Readonly<Record<string, PartSource>> = {
  'c5/coin': coin,
  'c5/pachinko-board': pachinkoBoard,
};
