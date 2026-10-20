import { POPUP as C } from '../../../art/palette';
import { depth, softEllipse, type KitCtx } from '../../art';
import type { PartSource } from '../sources';

/**
 * Chapter 4 (西門町, 01:50) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#118) draws only the pieces whose preset placeholder
 * would mislead a player (D-77): 4-2's lantern (a pushable's default is a bead — it would read as the
 * goal; 4-4's claw is a carriage drawing, `view/art/carriages.ts`). The chapter's art issue
 * (#119) draws the backdrops, the cast and the rest, and restyles these in the neon kit.
 */

// ——— 4-2's lantern ———

/**
 * A red paper lantern (a pushable, C3), local origin at its centre: hanging from the east eave on
 * its cord (`onPerch`), tumbling (`falling`), and sitting squashed on the shutter's button
 * (`landed`), its tassel splayed.
 */
const lantern: PartSource = {
  preset: 'pushable',
  states: ['onPerch', 'falling', 'landed'],
  box: { x: -30, y: -44, w: 60, h: 80 },
  draw(ctx: KitCtx, state) {
    const body = 'M-15 -11Q-17 0 -15 11Q0 15 15 11Q17 0 15 -11Q0 -15 -15 -11Z';
    const paper = depth(ctx, 3, `<path d="${body}" fill="${C.hatRed}"/>`
      + `<path d="M-8 -13Q-11 0 -8 13M0 -14V14M8 -13Q11 0 8 13" stroke="${C.peonyDeep}" stroke-width="1.1" fill="none" opacity=".8"/>`
      + `<rect x="-9" y="-16" width="18" height="4" rx="1.4" fill="${C.printDark}"/><rect x="-9" y="12" width="18" height="4" rx="1.4" fill="${C.printDark}"/>`
      + `<ellipse cx="-5" cy="-3" rx="3.4" ry="6" fill="${C.lampHot}" opacity=".35"/>`, `<path d="${body}"/>`);
    const tassel = state === 'landed'
      ? `<path d="M0 16l-7 4M0 16l7 4M0 16v5" stroke="${C.hatRed}" stroke-width="1.6" stroke-linecap="round"/>`
      : `<path d="M0 16v12M-2 20v8M2 20v8" stroke="${C.hatRed}" stroke-width="1.4" stroke-linecap="round"/>`;
    const cord = state === 'onPerch' ? `<path d="M0 -16V-40" stroke="${C.printDark}" stroke-width="1.4"/>` : '';
    const turn = state === 'falling' ? 'rotate(28)' : state === 'landed' ? 'translate(0 -2) scale(1.06 .9)' : '';
    const shadow = state === 'landed' ? softEllipse(ctx, 0, 16, 18, 2.6, 'shadow', 0.45) : '';
    return shadow + cord + `<g transform="${turn}">${tassel}${paper}</g>`;
  },
};

export const C4_PARTS: Readonly<Record<string, PartSource>> = {
  'c4/lantern': lantern,
};
