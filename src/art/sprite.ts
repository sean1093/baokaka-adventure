import type { ReactElement } from 'react';

/**
 * The sprite contract, option D (art direction § 8.2, § 8.3).
 *
 * A sprite is a React component that draws one SVG filling its own box. Callers size the box and
 * say which level of detail they need; the sprite never animates itself, it only exposes rig
 * groups and class names that `rig.css` (or a screen) moves.
 *
 *   1. **Canvas.** The root is `<svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>`
 *      (the icon LOD may crop the viewBox to the head). Figures stand on y ≈ 186 with a contact
 *      shadow (`ArtDefs`' `contact` gradient).
 *   2. **Construction.** Each pose is a `Skeleton` (joint → [x, y]) plus per-joint radii; volumes
 *      come from `limb()` / `blob()` (`geom.ts`), drawn by `Fig` in depth groups (far limbs →
 *      body → near limbs → head). Never draw a limb as a stroked line.
 *   3. **Rig.** Depth groups are rig groups named `{char}-{part}` (`baokaka-arm-near`), each with
 *      the joint it turns around as its transform origin (`transform-box: view-box`). Faces are
 *      `Head` components taking `expr`; eyes, brows and mouth are separate groups.
 *   4. **Lines.** Two passes per depth group: a thick `LINE.sil` contour (3.2u; 4u at the map LOD)
 *      under fills with thin material-tinted lines (1.0–1.2u). Interior marks are tapered fills
 *      (`crease()`), never uniform strokes.
 *   5. **Cel.** The clip + offset recipe of § 2.4 (`Fig` does it per part); `deep` occlusion shapes
 *      by hand; the rim colour from the CSS variable `--rim` via `style={{ stroke: 'var(--rim)' }}`.
 *   6. **Ids.** Every clipPath / gradient id comes from `useSvgIds(prefix)`. Shared gradients
 *      (iris, blush, contact shadow, bloom) live once in `<ArtDefs/>` (`artUrl()`).
 *   7. **No** `<filter>`, `<text>`, `<image>`, and no raw hex outside `palette.ts` (lint tests).
 *   8. **Budgets** (elements at the portrait LOD): hero ≤ 220, boss
 *      ≤ 220, foe ≤ 160, NPC / prop / item ≤ 120, tile ≤ 12; every sprite ≤ 20 KB serialised (`SPRITE_BUDGETS`).
 *
 * Legacy sprites (the pre-D 100u drawings in `./sprites`) take no props and ignore `lod`; they are
 * replaced one by one (#16–#19 and the chapter art issues).
 */

/** Level of detail (§ 8.3). The skeleton and volumes are the same at every LOD; only detail layers toggle. */
export type Lod = 'portrait' | 'battle' | 'map' | 'icon';

export const LODS: readonly Lod[] = ['portrait', 'battle', 'map', 'icon'];

/** What a sprite is doing; `rig.css` animates the rig groups for each state. */
export type SpriteState = 'idle' | 'attack' | 'hurt' | 'ko' | 'victory' | 'walk';

export type SpriteProps = {
  lod: Lod;
  /** A named pose (`sit`, `crawl`, `walk`…); each sprite documents its own, the first is the default */
  pose?: string;
  /** A named expression (`happy`, `laugh`, `teary`, `surprised`…) */
  expr?: string;
  /** Which way the figure looks; sprites mirror themselves when this differs from how they are drawn */
  facing?: 'left' | 'right';
  state?: SpriteState;
};

/** A legacy sprite: no props. Still assignable to `SpriteComponent`, which is how the registry mixes both. */
export type Sprite = () => ReactElement;

/** What a sprite is, for budgets, placeholders and the art lab. */
export type SpriteKind = 'hero' | 'npc' | 'foe' | 'boss' | 'prop' | 'item' | 'tile';

export type SpriteMeta = {
  readonly kind: SpriteKind;
  /** Set on placeholder sprites (decision D-14): the label they show */
  readonly placeholder?: { readonly name: string; readonly label: string };
  /** The rig, for the art lab's skeleton overlay (§ 2.1 step 5): joints per pose and the bones between them */
  readonly rig?: { readonly skeleton: (pose?: string) => Skeleton; readonly bones: Bones };
};

/** A sprite in the registry: a new-style component (with `meta`) or a legacy one (without). */
export type SpriteComponent = ((props: SpriteProps) => ReactElement | null) & { meta?: SpriteMeta };

/** Joints of one pose on the 200u canvas. */
export type Skeleton<Joint extends string = string> = Readonly<Record<Joint, readonly [number, number]>>;

/** Bones to draw in the skeleton overlay: pairs of joint names. */
export type Bones<Joint extends string = string> = readonly (readonly [Joint, Joint])[];

/** The 200u canvas every option D sprite draws on. */
export const CANVAS = 200;

/** Element and size budgets per kind (§ 8.2 rule 8). */
export const SPRITE_BUDGETS: Readonly<Record<SpriteKind, { readonly elements: number; readonly bytes: number }>> = {
  hero: { elements: 220, bytes: 20_000 },
  boss: { elements: 220, bytes: 20_000 },
  foe: { elements: 160, bytes: 20_000 },
  npc: { elements: 120, bytes: 20_000 },
  prop: { elements: 120, bytes: 20_000 },
  item: { elements: 120, bytes: 20_000 },
  tile: { elements: 12, bytes: 20_000 },
};

/** Tags a component as a new-style sprite. */
export function defineSprite<P extends SpriteProps>(meta: SpriteMeta, component: (props: P) => ReactElement | null): SpriteComponent {
  return Object.assign(component as (props: SpriteProps) => ReactElement | null, { meta });
}

/** The sprite's metadata, or `undefined` for a legacy sprite. */
export const spriteMeta = (sprite: SpriteComponent): SpriteMeta | undefined => sprite.meta;
