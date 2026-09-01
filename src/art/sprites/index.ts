import type { SpriteName } from '../../game/types';
import type { Sprite } from '../sprite';
import * as beach from './beach';
import * as characters from './characters';
import * as living from './living';
import * as market from './market';
import * as night from './night';
import * as park from './park';
import * as targets from './targets';
import * as yard from './yard';

/**
 * sprite key → 圖案。型別是 Record<SpriteName, Sprite>，
 * 所以少一個或多一個都會編譯失敗——關卡資料與美術不可能對不上。
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
};
