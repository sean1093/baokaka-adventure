import type { Id } from '../popup/core/types';

/**
 * A page's 3D staging (#225): at which depth each paper card stands, as the page y of its foot
 * (`camera.ts`: a card stands where its foot's ray meets the floor). The cards themselves and their
 * boxes come from the bake (`cards.gen.ts`); everything else (where Baokaka is, which board card
 * shows) comes from the simulation, as on the 2D page.
 *
 * Only 1-2 is staged: the spike. A page converted for real would get this table from its stage
 * (`view/stage.ts`: runs, posts, carriages) with a few overrides; see the spike doc's estimate.
 */
export interface Page3D {
  /** Standing cards and their feet (page y ≥ 360); cards not listed are drawn by the stage's own logic */
  readonly stands: Readonly<Record<string, number>>;
  /** The plane the characters, the bead and the paw marks stand on: just in front of the platforms */
  readonly playFoot: number;
  /** Where a part is touched: on the floor (a pull tab) or on a standing card */
  readonly partPlane: Readonly<Record<Id, 'floor' | number>>;
  /** Warm lamps: page points of their lanterns, for the point lights */
  readonly lamps: readonly (readonly [number, number, number])[];
}

export const PAGES_3D: Readonly<Record<Id, Page3D>> = {
  c1p2: {
    stands: {
      station: 380,
      lampL: 378,
      lampR: 382,
      board: 404,
      tudigong: 403,
      carriage: 470,
      ledgeL: 482,
      ledgeR: 482,
      pillar: 483,
      bench: 483,
      pigeon: 488,
      bead: 486,
      'paw.pillar': 486,
      'paw.bench': 486,
      luggage: 640,
    },
    playFoot: 487,
    partPlane: { train: 'floor', board: 404 },
    // [x, y, foot]: the two street lamps' lanterns
    lamps: [[18, 296, 378], [372, 290, 382]],
  },
};
