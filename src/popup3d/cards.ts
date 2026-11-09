/**
 * The paper cards of a 3D page (#225): what `npm run bake:3d` writes to `cards.gen.ts`.
 *
 * - `back`: the standing page (z = 0), `box` in page units.
 * - `stand`: a card standing on the floor, `box` in page units (its drawing on the 2D page); the
 *   page's 3D config (`pages3d.ts`) says at which foot it stands.
 * - `lie`: printed on the floor page (the track pit, the tab and its slot), `box` in page units.
 * - `floor`: the floor page itself, drawn flat; `box` in floor units (x 0–390, y 0 at the gutter).
 */
export type CardKind = 'back' | 'stand' | 'lie' | 'floor';

export interface CardDef {
  readonly id: string;
  readonly kind: CardKind;
  /** Stem under `src/popup3d/assets/` (add `@2x.webp`) */
  readonly file: string;
  readonly bytes: number;
  readonly box: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
}
