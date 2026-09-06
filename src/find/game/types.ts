/**
 * Level data contract for the hidden-object game.
 * Geometry (x, y, r) follows the shared art coordinate system in src/art/types.ts (spec §6).
 */

import type { PaletteName, Placement } from '../../art/types';

/** A tappable hidden-object target. */
export type Target = Placement & {
  /** Unique within the level */
  id: string;
  /** Display name shown to the player, e.g. 奶瓶 */
  name: string;
};

export type Level = {
  /** Starts at 1, contiguous */
  id: number;
  /** e.g. 摩卡貓躲在客廳 */
  title: string;
  palette: PaletteName;
  /** Background decor: not tappable, drawn below the targets */
  decor: Placement[];
  /** Always exactly 3 */
  targets: Target[];
  /** Storybook text shown once the level is cleared */
  story: string;
};

export type Progress = {
  /** Highest level id the player may enter; defaults to 1 */
  unlockedLevel: number;
  /** Completed level ids, ascending and unique */
  completed: number[];
  sound: boolean;
};
