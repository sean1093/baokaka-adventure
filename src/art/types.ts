/**
 * Art contract for the RPG: every sprite key the game can draw, and the palette (setting) names
 * that pick a battle backdrop and map ground colours. `SPRITES` in ./sprites is typed against
 * `SpriteName`, so a missing or extra drawing fails the build.
 */
export type SpriteName =
  // Items (inventory, chests, shop)
  | 'bottle'
  | 'clothBook'
  | 'bucket'
  | 'sunHat'
  | 'cookie'
  | 'banana'
  | 'driedFish'
  | 'coinPurse'
  | 'shell'
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
  // Bedtime
  | 'bed'
  | 'moonWindow'
  | 'star'
  | 'blanket'
  | 'pillow'
  | 'slipper'
  // Yard
  | 'tree'
  | 'flowerPot'
  | 'wateringCan'
  | 'butterfly'
  | 'stone'
  // Park
  | 'bench'
  | 'slide'
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
