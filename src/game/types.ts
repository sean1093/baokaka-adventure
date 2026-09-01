/**
 * Level data contract.
 *
 * Coordinate system (spec §6): the scene box is always 3:4 portrait.
 *   x, y  hotspot CENTRE; x relative to box width, y relative to box height, both 0..1
 *   r     hotspot half-edge, relative to box width (square, kept square by aspect-ratio)
 * Because box height = width * 4/3, a hotspot covers r * 3/4 of the box height.
 */

export type SpriteName =
  // Target objects (the 18 hidden objects)
  | 'bottle'
  | 'sock'
  | 'clothBook'
  | 'bucket'
  | 'spade'
  | 'dandelion'
  | 'ball'
  | 'sunHat'
  | 'cookie'
  | 'banana'
  | 'driedFish'
  | 'coinPurse'
  | 'shell'
  | 'flask'
  | 'toyBoat'
  | 'comfortDoll'
  | 'nightLight'
  // Characters
  | 'mochaCat'
  | 'baokaka'
  // Living room
  | 'sofa'
  | 'coffeeTable'
  | 'floorLamp'
  | 'pottedPlant'
  | 'wallClock'
  | 'rug'
  // Bedtime
  | 'bed'
  | 'moonWindow'
  | 'star'
  | 'blanket'
  | 'pillow'
  | 'slipper'
  // Yard
  | 'tree'
  | 'fence'
  | 'flowerPot'
  | 'wateringCan'
  | 'butterfly'
  | 'stone'
  // Park
  | 'bench'
  | 'slide'
  | 'cloud'
  | 'kite'
  | 'bird'
  // Market
  | 'crate'
  | 'fishStall'
  | 'lantern'
  | 'awning'
  | 'scale'
  | 'apple'
  // Beach
  | 'sunDisc'
  | 'wave'
  | 'sandcastle'
  | 'beachUmbrella'
  | 'starfish'
  | 'seagull';

export type Placement = {
  sprite: SpriteName;
  x: number;
  y: number;
  r: number;
  /** Mirror horizontally so a repeated sprite does not look stamped out */
  flip?: boolean;
};

/** A tappable hidden-object target. */
export type Target = Placement & {
  /** Unique within the level */
  id: string;
  /** Display name shown to the player, e.g. 奶瓶 */
  name: string;
};

export type PaletteName = 'living' | 'yard' | 'park' | 'market' | 'beach' | 'night';

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
