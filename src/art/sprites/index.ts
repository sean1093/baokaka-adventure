import type { SpriteName } from '../types';
import type { Sprite } from '../sprite';
import * as beach from './beach';
import * as characters from './characters';
import * as foesBeach from './foesBeach';
import * as foesLiving from './foesLiving';
import * as foesMarket from './foesMarket';
import * as foesNight from './foesNight';
import * as foesPark from './foesPark';
import * as foesYard from './foesYard';
import * as folk from './folk';
import * as town from './town';
import * as living from './living';
import * as market from './market';
import * as night from './night';
import * as park from './park';
import * as targets from './targets';
import * as yard from './yard';

/**
 * sprite key -> drawing. Typed as Record<SpriteName, Sprite>, so a missing or extra
 * entry fails the build: level data and art cannot drift apart.
 */
export const SPRITES: Record<SpriteName, Sprite> = {
  bottle: targets.Bottle,
  sock: targets.Sock,
  clothBook: targets.ClothBook,
  bucket: targets.Bucket,
  spade: targets.Spade,
  dandelion: targets.Dandelion,
  ball: targets.Ball,
  sunHat: targets.SunHat,
  cookie: targets.Cookie,
  banana: targets.Banana,
  driedFish: targets.DriedFish,
  coinPurse: targets.CoinPurse,
  shell: targets.Shell,
  flask: targets.Flask,
  toyBoat: targets.ToyBoat,
  comfortDoll: targets.ComfortDoll,
  nightLight: targets.NightLight,

  mochaCat: characters.MochaCat,
  baokaka: characters.Baokaka,

  sofa: living.Sofa,
  coffeeTable: living.CoffeeTable,
  floorLamp: living.FloorLamp,
  pottedPlant: living.PottedPlant,
  wallClock: living.WallClock,
  rug: living.Rug,

  bed: night.Bed,
  moonWindow: night.MoonWindow,
  star: night.Star,
  blanket: night.Blanket,
  pillow: night.Pillow,
  slipper: night.Slipper,

  tree: yard.Tree,
  fence: yard.Fence,
  flowerPot: yard.FlowerPot,
  wateringCan: yard.WateringCan,
  butterfly: yard.Butterfly,
  stone: yard.Stone,

  bench: park.Bench,
  slide: park.Slide,
  cloud: park.Cloud,
  kite: park.Kite,
  bird: park.Bird,

  crate: market.Crate,
  fishStall: market.FishStall,
  lantern: market.Lantern,
  awning: market.Awning,
  scale: market.Scale,
  apple: market.Apple,

  sunDisc: beach.SunDisc,
  wave: beach.Wave,
  sandcastle: beach.Sandcastle,
  beachUmbrella: beach.BeachUmbrella,
  starfish: beach.Starfish,
  seagull: beach.Seagull,

  dustBunny: foesLiving.DustBunny,
  sockMonster: foesLiving.SockMonster,
  blockGolem: foesLiving.BlockGolem,

  mosquito: foesYard.Mosquito,
  snail: foesYard.Snail,
  moleKing: foesYard.MoleKing,

  pigeon: foesPark.Pigeon,
  kiteGhost: foesPark.KiteGhost,
  crowBoss: foesPark.CrowBoss,

  crab: foesMarket.Crab,
  rollingApple: foesMarket.RollingApple,
  bigFish: foesMarket.BigFish,

  greedyGull: foesBeach.GreedyGull,
  jellyfish: foesBeach.Jellyfish,
  octopus: foesBeach.Octopus,

  sleepySprite: foesNight.SleepySprite,
  nightmareCloud: foesNight.NightmareCloud,
  snoreKing: foesNight.SnoreKing,

  duck: folk.Duck,
  mom: folk.Mom,
  dad: folk.Dad,
  grandma: folk.Grandma,
  kid: folk.Kid,
  dog: folk.Dog,

  vendor: town.Vendor,
  uncle: town.Uncle,
  toyBox: town.ToyBox,
  toyBoxOpen: town.ToyBoxOpen,
  signpost: town.Signpost,
  napMat: town.NapMat,
  bathtub: town.Bathtub,
};
