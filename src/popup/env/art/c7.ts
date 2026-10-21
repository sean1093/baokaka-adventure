import { POPUP as C } from '../../../art/palette';
import { depth, f1, softEllipse } from '../../art';
import type { KitCtx } from '../../art';
import type { CutoutSource, PartSource } from '../sources';
import { bakedFlap, flapSize, kraftBack } from './common';

/**
 * Chapter 7 (貓空, 03:30) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#125) draws only the placeholders whose preset art
 * would mislead (D-77, D-81, D-84, D-86): 7-2's cable (the loop preset draws only its crank, and
 * the cabins hang from nothing), 7-4's clouds under the glass floor (the flap preset would draw three
 * blank paper tabs, and live they cost the page its animated-node budget) and 7-5's pool of tea with
 * its floating cups (the lift preset draws a bare platform: the cups would be invisible). The cabins
 * themselves are riders (`view/art/gondola.ts`). The chapter's art issue (#126) draws the palette
 * kit, the six backdrops and every other part.
 */

// ——— 7-2's cable ———

/** 7-2's slots' hangers on the cable (the cabins' nodes 60 units under them, `c7/p2.ts`). */
const UP_CABLE: readonly [number, number][] = [[118, 442], [150, 410], [318, 240], [344, 214]];
const DOWN_CABLE: readonly [number, number][] = [[93, 417], [125, 385], [293, 215], [319, 189]];

/**
 * 7-2's cable (a cut-out at the page's origin, drawn in page units): the two runs of steel cable
 * between the bottom station's bullwheel and the top station's, a pylon half way up. The cabins
 * ride its slots (the up run: the bottom station, over the zoo, the top station; the down run).
 */
const cable: CutoutSource = {
  chapter: 7,
  box: { x: 60, y: 160, w: 300, h: 300 },
  draw(ctx) {
    const line = (pts: readonly [number, number][]) => pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join('');
    const wheel = (x: number, y: number) => depth(ctx, 2, `<circle cx="${x}" cy="${y}" r="20" fill="${C.printDark}"/><circle cx="${x}" cy="${y}" r="13" fill="${C.nightCard}"/>`
      + `<path d="M${x - 13} ${y}h26M${x} ${y - 13}v26" stroke="${C.printDark}" stroke-width="2.4"/><circle cx="${x}" cy="${y}" r="3" fill="${C.printDark}"/>`, `<circle cx="${x}" cy="${y}" r="20"/>`);
    const pylon = `<path d="M222 470L236 316H244L258 470Z" fill="${C.printDark}" opacity=".85"/><path d="M226 318h28" stroke="${C.printDark}" stroke-width="4"/>`;
    return pylon + wheel(132, 400) + wheel(306, 226)
      + `<path d="${line(UP_CABLE)}${line(DOWN_CABLE)}" stroke="${C.printDark}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
      + `<path d="${line(UP_CABLE)}" stroke="${C.vellum}" stroke-width=".8" fill="none" opacity=".5"/>`;
  },
};

// ——— 7-5's pool of tea ———

/** A floating teacup, its node (where he sits) at the origin: white porcelain, a celadon band, a tall handle on the right (Mocha's perch, 22 right and 30 up). */
function teacup(ctx: KitCtx): string {
  const cup = 'M-24 -2H24Q24 24 0 26Q-24 24 -24 -2Z';
  return depth(ctx, 4, `<path d="M20 2C40 0 40 -30 22 -28" stroke="${C.washi}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    + `<path d="${cup}" fill="${C.washi}"/><path d="M-23 8H23" stroke="${C.washiCeladon}" stroke-width="4"/>`
    + `<ellipse cx="0" cy="-2" rx="24" ry="4" fill="${C.kraftDark}"/><path d="M-16 -3q8 -2 16 0" stroke="${C.kraft}" stroke-width="1" fill="none" opacity=".8"/>`,
  `<path d="${cup}"/>`);
}

/**
 * 7-5's pool (a `lift`: `low` / `mid` / `high`), drawn where the first floating cup is (`C1`; the
 * second floats 124 to its right): the tea's surface under the cups' rims and the two cups. Drained
 * (`low`), the cups sit on the bottom and there is no tea.
 */
const teaPool: PartSource = {
  preset: 'lift',
  states: ['low', 'mid', 'high'],
  box: { x: -44, y: -40, w: 216, h: 84 },
  draw(ctx, state) {
    const tea = state === 'low' ? ''
      : `<rect x="-40" y="10" width="208" height="30" fill="${C.kraftDark}" opacity=".9"/>`
        + `<path d="M-36 12q10 -3 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke="${C.kraft}" stroke-width="1.4" fill="none" opacity=".7"/>`;
    return tea + softEllipse(ctx, 0, 26, 22, 3, 'shadow', 0.3) + teacup(ctx) + `<g transform="translate(124 0)">${teacup(ctx)}</g>`;
  },
};

// ——— 7-4's clouds under the glass floor ———

/**
 * 7-4's cloud (a `flap`, 翻): closed, a night-blue card with a paper cloud drifting over it (what is
 * under it is hidden); blown aside (`open`), the card folds up and its kraft back shows. Local space:
 * the card's top-left at the origin (`bakedFlap`), its marigold dog-ear the grip.
 */
const cloud = (() => {
  const { w, h } = flapSize(56, 56);
  const face = (_ctx: KitCtx) => {
    const puffs = [[w * 0.28, h * 0.6, 9], [w * 0.5, h * 0.46, 11.5], [w * 0.72, h * 0.6, 9], [w * 0.5, h * 0.68, 10]] as const;
    return `<rect width="${w}" height="${h}" fill="${C.nightCardDeep}"/>`
      + `<g fill="${C.vellum}">${puffs.map(([x, y, r]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}"/>`).join('')}</g>`
      + `<path d="M${f1(w * 0.18)} ${f1(h * 0.74)}H${f1(w * 0.82)}" stroke="${C.chalk}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`
      + `<circle cx="${f1(w * 0.84)}" cy="${f1(h * 0.2)}" r="1.4" fill="${C.chalk}" opacity=".8"/>`;
  };
  return bakedFlap(w, h, face, kraftBack(w, h, 77));
})();

export const C7_PARTS: Readonly<Record<string, PartSource>> = {
  'c7/cloud': cloud,
  'c7/tea-pool': teaPool,
};

export const C7_CUTOUTS: Readonly<Record<string, CutoutSource>> = {
  'c7/cable': cable,
};
