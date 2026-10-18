import { createContext, useContext } from 'react';
import type { Lod } from './sprite';

/**
 * Levels of detail (art direction § 8.3). A sprite draws the same skeleton and volumes at every
 * LOD; detail layers say the lowest tier they need, and `shows()` decides:
 *
 * | tier       | shown at                  | e.g.                                                       |
 * |------------|---------------------------|------------------------------------------------------------|
 * | `map`      | every LOD                 | silhouette, simple eyes, ≤ 3 hair clumps, limb joints       |
 * | `battle`   | battle, portrait, icon    | the second specular, angel ring, main folds, finger splits |
 * | `portrait` | portrait only             | iris rays, hair strands, blush hatching, all creases       |
 *
 * `icon` is a head crop at battle detail (a 48px head is as big as a battle sprite's head). Layers
 * that only exist to simplify the map LOD (a mitten instead of a hand) use `only: ['map']`.
 */
export type Tier = 'map' | 'battle' | 'portrait';

const RANK: Record<Lod, number> = { map: 0, battle: 1, icon: 1, portrait: 2 };
const TIER_RANK: Record<Tier, number> = { map: 0, battle: 1, portrait: 2 };

/** Whether a layer that needs `tier` is drawn at `lod`. */
export const shows = (lod: Lod, tier: Tier = 'map'): boolean => RANK[lod] >= TIER_RANK[tier];

/** Contour width (pass 1) at a LOD: 3.2u, or 4u at the map LOD so the line survives 60px (§ 8.3). */
export const silWidth = (lod: Lod): number => (lod === 'map' ? 4 : 3.2);

/**
 * The LOD of the sprite being drawn. Sprites provide it (`<LodContext.Provider value={lod}>`, which
 * `Fig` does), so nested parts such as a `Head` can read it instead of threading a prop.
 */
export const LodContext = createContext<Lod>('battle');

export const useLod = (): Lod => useContext(LodContext);
