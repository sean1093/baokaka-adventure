/**
 * Data contract for 寶咖咖奇俠傳, the 仙劍-style RPG: isometric maps to explore, NPCs to talk to,
 * a party that grows, and turn-based command battles (攻擊 / 仙術 / 道具 / 防禦 / 逃跑).
 * Everything here is plain data. The engines (battle.ts, scene.ts, quest.ts) are pure functions
 * over these types; the UI never mutates them.
 */

import type { PaletteName, SpriteName } from '../../art/types';

// ---------------------------------------------------------------------------------------------
// Party

export type HeroId = 'baokaka' | 'mocha' | 'duck';

/** Every hero, in the order they join and the order they stand in battle. */
export const HERO_ORDER: readonly HeroId[] = ['baokaka', 'mocha', 'duck'];

/** 體力 / 真氣 / 武術 / 防禦 / 身法 / 幸運: the classic six. */
export type Stats = { hp: number; mp: number; atk: number; def: number; spd: number; luck: number };

export type SpellId =
  | 'throwBlock'
  | 'bigCry'
  | 'clapClap'
  | 'crawlDash'
  | 'purr'
  | 'pounce'
  | 'catnipFury'
  | 'nineLives'
  | 'splash'
  | 'waterGun'
  | 'bubbleShield'
  | 'bigWave';

export type SpellEffect =
  /** power multiplies the caster's spell strength */
  | { kind: 'damage'; power: number; target: 'one' | 'all' }
  /** ratio of the target's max HP; `party` also revives the fallen when `revive` is set */
  | { kind: 'heal'; ratio: number; target: 'ally' | 'party'; revive?: boolean }
  /** Every hero takes half damage until their next turn */
  | { kind: 'shield' };

export type Spell = {
  id: SpellId;
  name: string;
  hero: HeroId;
  /** 真氣 spent */
  cost: number;
  /** Party level at which the hero learns it */
  level: number;
  effect: SpellEffect;
  blurb: string;
};

// ---------------------------------------------------------------------------------------------
// Items

export type ItemId =
  | 'cookie'
  | 'bottle'
  | 'banana'
  | 'driedFish'
  | 'apple'
  | 'shell'
  | 'clothBook'
  | 'coinPurse'
  | 'sunHat'
  | 'blanket'
  | 'toyBoat'
  | 'star'
  | 'nightLight';

export type ItemUse =
  | { kind: 'hp'; amount: number }
  | { kind: 'hpAll'; amount: number }
  | { kind: 'mp'; amount: number }
  | { kind: 'full' }
  | { kind: 'revive'; ratio: number }
  /** Worn in the hero's single 裝備 slot */
  | { kind: 'equip'; bonus: Partial<Stats> };

export type Item = {
  id: ItemId;
  name: string;
  sprite: SpriteName;
  blurb: string;
  /** Price in 貼紙 when a shop stocks it */
  price: number;
  use: ItemUse;
};

export type Inventory = Partial<Record<ItemId, number>>;

// ---------------------------------------------------------------------------------------------
// Foes

export type FoeId =
  | 'dustBunny'
  | 'sockMonster'
  | 'blockGolem'
  | 'mosquito'
  | 'snail'
  | 'moleKing'
  | 'pigeon'
  | 'kiteGhost'
  | 'crowBoss'
  | 'crab'
  | 'rollingApple'
  | 'bigFish'
  | 'greedyGull'
  | 'jellyfish'
  | 'octopus'
  | 'sleepySprite'
  | 'nightmareCloud'
  | 'snoreKing';

export type FoeMove =
  | { kind: 'attack'; name: string; power: number; target: 'one' | 'all' }
  | { kind: 'guard'; name: string }
  | { kind: 'heal'; name: string; ratio: number };

export type Foe = {
  id: FoeId;
  name: string;
  sprite: SpriteName;
  stats: Stats;
  xp: number;
  /** 貼紙 dropped */
  stickers: number;
  /** Chance of dropping the item, 0..1 */
  drop?: { item: ItemId; chance: number };
  /** Bosses cannot be fled from and shout their taunt on round 1 */
  boss?: boolean;
  taunt?: string;
  /** Used in order, looping */
  moves: FoeMove[];
};

// ---------------------------------------------------------------------------------------------
// World

export type MapId = 'home' | 'yard' | 'park' | 'market' | 'bath' | 'beach' | 'night';

export type Terrain =
  | 'floor'
  | 'rug'
  | 'tile'
  | 'grass'
  | 'path'
  | 'sand'
  | 'cobble'
  | 'dark'
  | 'blanket'
  | 'door'
  | 'water'
  | 'wall'
  | 'fence'
  | 'void';

export type Tile = { c: number; r: number };

/** A condition on story flags: `when` must be set, `not` must be unset. Both optional. */
export type Condition = { when?: string; not?: string };

export type Decor = {
  sprite: SpriteName;
  c: number;
  r: number;
  /** Footprint in tiles; default 1x1 */
  w?: number;
  h?: number;
  /** Drawn height in tiles (trees are tall); default 1.4 */
  size?: number;
  /** Solid decor blocks walking; default true */
  solid?: boolean;
  flip?: boolean;
};

export type Npc = Condition & {
  id: string;
  name: string;
  sprite: SpriteName;
  c: number;
  r: number;
  flip?: boolean;
  /** First matching rule wins */
  talk: (Condition & { event: string })[];
};

export type Chest = { id: string; c: number; r: number; item: ItemId; count?: number };

export type Exit = Condition & {
  c: number;
  r: number;
  to: MapId;
  at: Tile;
  /** Event to run instead when the condition fails (the closed-door line) */
  blocked?: string;
};

export type Trigger = Condition & { id: string; c: number; r: number; event: string; once?: boolean };

export type Encounters = {
  /** Groups of foes; one is picked per fight */
  groups: FoeId[][];
  /** Chance per step once `min` steps have passed since the last fight */
  rate: number;
  min: number;
  /** Only these rows and columns are dangerous (inclusive); everything else is safe ground */
  zone?: { c0: number; r0: number; c1: number; r1: number };
};

export type GameMap = {
  id: MapId;
  chapter: number;
  title: string;
  palette: PaletteName;
  /** Row strings; every row the same length. Characters are looked up in `legend`. */
  grid: string[];
  legend: Record<string, Terrain>;
  /** Where the party respawns after a defeat */
  entry: Tile;
  decor: Decor[];
  npcs: Npc[];
  chests: Chest[];
  exits: Exit[];
  triggers: Trigger[];
  encounters?: Encounters;
};

// ---------------------------------------------------------------------------------------------
// Scripts: dialogue and cutscenes

/** A line spoken by a hero, an NPC (by id), or nobody (system narration). */
export type Line = { who: HeroId | string | null; text: string };

export type Step =
  | Line
  | { do: 'chapter'; n: number; title: string }
  | { do: 'join'; hero: HeroId }
  | { do: 'flag'; flag: string }
  | { do: 'give'; item: ItemId; count?: number }
  | { do: 'stickers'; amount: number }
  | { do: 'heal' }
  | { do: 'battle'; foes: FoeId[]; boss?: boolean }
  | { do: 'goto'; map: MapId; c: number; r: number }
  | { do: 'shop'; stock: ItemId[] }
  /** Sleep for the night: asks first, charges, then heals */
  | { do: 'inn'; price: number }
  | { do: 'ending' };

// ---------------------------------------------------------------------------------------------
// Run: everything that persists

export type Run = {
  map: MapId;
  pos: Tile;
  facing: 'left' | 'right';
  party: HeroId[];
  level: number;
  xp: number;
  hp: Record<HeroId, number>;
  mp: Record<HeroId, number>;
  equip: Record<HeroId, ItemId | null>;
  items: Inventory;
  stickers: number;
  flags: string[];
  /** Steps walked since the last random encounter */
  steps: number;
  /** Rolling seed for encounters and drops, so the reducer stays pure */
  seed: number;
  /** Highest chapter reached */
  chapter: number;
  cleared: boolean;
};

// ---------------------------------------------------------------------------------------------
// Battle

export type Who = { side: 'hero'; hero: HeroId } | { side: 'foe'; slot: number };

export type HeroState = { hp: number; mp: number; guard: boolean; shield: boolean };

export type FoeState = {
  foe: FoeId;
  hp: number;
  guard: boolean;
  /** Index of the next move (modulo length) */
  move: number;
};

export type Phase =
  | { kind: 'hero'; hero: HeroId }
  | { kind: 'foe'; slot: number }
  | { kind: 'won' }
  | { kind: 'lost' }
  | { kind: 'fled' };

/** What happened during one step; the UI turns these into floating numbers and log lines. */
export type BattleEvent =
  | { kind: 'act'; who: Who; name: string }
  | { kind: 'hit'; who: Who; amount: number; crit: boolean }
  | { kind: 'heal'; who: Who; amount: number }
  | { kind: 'mp'; who: Who; amount: number }
  | { kind: 'guard'; who: Who }
  | { kind: 'shield' }
  | { kind: 'revive'; who: Who }
  | { kind: 'miss'; who: Who }
  | { kind: 'flee'; ok: boolean }
  | { kind: 'ko'; who: Who };

export type Battle = {
  seed: number;
  boss: boolean;
  level: number;
  party: HeroId[];
  heroes: Record<HeroId, HeroState>;
  stats: Record<HeroId, Stats>;
  foes: FoeState[];
  items: Inventory;
  round: number;
  /** Everyone acting this round, fastest first */
  order: Who[];
  /** Index into `order` of the actor about to move */
  turn: number;
  phase: Phase;
  /** Increments every step; the UI keys one-shot animations on it */
  step: number;
  events: BattleEvent[];
};

export type BattleAction =
  | { type: 'attack'; target: number }
  | { type: 'spell'; spell: SpellId; target?: number | HeroId }
  | { type: 'item'; item: ItemId; target: HeroId }
  | { type: 'guard' }
  | { type: 'flee' }
  /** Let the foe whose turn it is act; the UI sends these on a timer */
  | { type: 'tick' };
