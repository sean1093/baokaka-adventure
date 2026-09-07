/**
 * Art contract shared by every game in the collection.
 *
 * Coordinate system: a scene box is 3:4 portrait unless a screen says otherwise.
 *   x, y  placement CENTRE; x relative to box width, y relative to box height, both 0..1
 *   r     half-edge, relative to box width (square, kept square by aspect-ratio)
 * Because a 3:4 box has height = width * 4/3, a placement covers r * 3/4 of the box height.
 */

export type SpriteName =
  // Hidden-object targets (the 18 hidden objects)
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
  | 'seagull'
  // Quest foes: living room
  | 'dustBunny'
  | 'sockMonster'
  | 'blockGolem'
  // Quest foes: yard
  | 'mosquito'
  | 'snail'
  | 'moleKing'
  // Quest foes: park
  | 'pigeon'
  | 'kiteGhost'
  | 'crowBoss'
  // Quest foes: market
  | 'crab'
  | 'rollingApple'
  | 'bigFish'
  // Quest foes: beach
  | 'greedyGull'
  | 'jellyfish'
  | 'octopus'
  // Quest foes: dreamland
  | 'sleepySprite'
  | 'nightmareCloud'
  | 'snoreKing'
  // Quest people and places
  | 'duck'
  | 'mom'
  | 'dad'
  | 'grandma'
  | 'kid'
  | 'dog'
  | 'vendor'
  | 'uncle'
  | 'toyBox'
  | 'toyBoxOpen'
  | 'signpost'
  | 'napMat'
  | 'bathtub';

export type PaletteName = 'living' | 'yard' | 'park' | 'market' | 'beach' | 'night';

export type Placement = {
  sprite: SpriteName;
  x: number;
  y: number;
  r: number;
  /** Mirror horizontally so a repeated sprite does not look stamped out */
  flip?: boolean;
};
