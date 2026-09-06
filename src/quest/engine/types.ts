/**
 * Data contract for 寶咖咖勇者團, the turn-based RPG.
 *
 * Everything here is plain data. The battle engine (battle.ts) and the run reducer
 * (quest.ts) are pure functions over these types; the UI never mutates them.
 */

import type { PaletteName, Placement, SpriteName } from '../../art/types';

export type HeroId = 'baokaka' | 'mocha';

/** Heroes always act in this order within a round. */
export const HERO_ORDER: readonly HeroId[] = ['baokaka', 'mocha'];

export type SkillId =
  | 'throwBlock'
  | 'bigCry'
  | 'hug'
  | 'superScream'
  | 'scratch'
  | 'pounce'
  | 'purr'
  | 'frenzy'
  | 'guard';

export type SkillEffect =
  | {
      kind: 'attack';
      /** Multiplier on the hero's atk */
      power: number;
      /** one = pick a foe; all = every living foe; random = each hit picks a living foe */
      target: 'one' | 'all' | 'random';
      hits: number;
      /** Chance per hit of a x1.5 critical */
      crit: number;
      /** Chance per hit that a surviving foe skips its next action */
      stun: number;
    }
  | { kind: 'heal'; ratio: number; target: 'ally' | 'party' }
  | { kind: 'guard' };

export type Skill = {
  id: SkillId;
  name: string;
  /** Which hero has it; guard belongs to both */
  hero: HeroId | 'both';
  /** Energy spent before the effect */
  cost: number;
  /** Energy gained after the effect */
  gain: number;
  unlockLevel: number;
  effect: SkillEffect;
  /** One short line under the button, e.g. 單體攻擊，元氣 +1 */
  blurb: string;
};

export type ItemId = 'bottle' | 'cookie' | 'driedFish';

export type Item = {
  id: ItemId;
  name: string;
  sprite: SpriteName;
  blurb: string;
  effect: { kind: 'heal'; ratio: number; target: 'ally' | 'party' } | { kind: 'energy' };
};

export type Inventory = Record<ItemId, number>;

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
  /** Does nothing this turn; exists so the following big attack is telegraphed a turn early */
  | { kind: 'charge'; name: string }
  | { kind: 'heal'; name: string; ratio: number };

export type Foe = {
  id: FoeId;
  name: string;
  sprite: SpriteName;
  maxHp: number;
  atk: number;
  /** Cycled in order; the next one is always shown to the player as the foe's intent */
  moves: FoeMove[];
  xp: number;
  boss?: boolean;
  /** Boss line shown in a speech bubble on round 1 */
  taunt?: string;
};

export type Node =
  | { kind: 'battle'; foes: FoeId[]; drops?: ItemId[] }
  | { kind: 'boss'; foes: FoeId[]; drops?: ItemId[] }
  | { kind: 'camp' };

/** How many screen-widths wide every chapter's walkable world is */
export const WORLD_WIDTH = 3;

/**
 * A sprite standing in the side-scrolling world.
 *   x     centre, in screen-widths (0..WORLD_WIDTH); the camera shows one screen-width at a time
 *   foot  bottom edge, as a fraction of the scene height (0.82 is the ground line)
 *   r     half-width, as a fraction of the scene (screen) width
 * Anchoring by the feet keeps things standing on the ground whatever the scene's aspect ratio.
 */
export type WorldDecor = {
  sprite: SpriteName;
  x: number;
  foot: number;
  r: number;
  flip?: boolean;
  /** Scroll factor for parallax: 1 = the ground plane, smaller = further away. Defaults to 1 */
  depth?: number;
};

/** An item lying on the ground; walking over it picks it up, once per run */
export type Pickup = { id: string; item: ItemId; x: number };

export type World = {
  decor: WorldDecor[];
  /** x where each node's foes (or the camp) stand, in the same order as Chapter.nodes */
  stops: number[];
  pickups: Pickup[];
};

export type Chapter = {
  /** Starts at 1, contiguous */
  id: number;
  title: string;
  palette: PaletteName;
  /** Battle backdrop decor, placed in a SQUARE box (x and y are both fractions of the width) */
  decor: Placement[];
  nodes: Node[];
  world: World;
  /** Storybook text shown once the chapter's boss is beaten */
  story: string;
};

export type CampChoice = 'nap' | 'pack' | 'train';

/** Everything that persists between battles. Saved after every node. */
export type Run = {
  chapter: number;
  /** Index of the next node to play within the chapter */
  node: number;
  level: number;
  xp: number;
  hp: Record<HeroId, number>;
  items: Inventory;
  /** Ids of the ground pickups already collected, across all chapters */
  picked: string[];
  /** The whole quest has been finished at least once */
  cleared: boolean;
};

export type HeroState = { hp: number; guard: boolean };

export type FoeState = {
  foe: FoeId;
  hp: number;
  guard: boolean;
  stunned: boolean;
  /** Index of the NEXT move in foe.moves (modulo length) */
  move: number;
  /** Hero the next single-target attack is aimed at; rolled ahead of time so the intent can show it */
  aim: HeroId;
};

export type Phase =
  | { kind: 'hero'; hero: HeroId }
  | { kind: 'foe'; index: number }
  | { kind: 'won' }
  | { kind: 'lost' };

export type Who = { side: 'hero'; hero: HeroId } | { side: 'foe'; slot: number };

/** What happened during one step; the UI turns these into floating numbers and log lines. */
export type BattleEvent =
  | { kind: 'act'; who: Who; name: string }
  | { kind: 'hit'; who: Who; amount: number; crit: boolean }
  | { kind: 'heal'; who: Who; amount: number }
  | { kind: 'guard'; who: Who }
  | { kind: 'stun'; who: Who }
  | { kind: 'skip'; who: Who }
  | { kind: 'charge'; who: Who }
  | { kind: 'ko'; who: Who }
  | { kind: 'energy'; delta: number };

export type Battle = {
  level: number;
  heroes: Record<HeroId, HeroState>;
  foes: FoeState[];
  items: Inventory;
  energy: number;
  round: number;
  phase: Phase;
  boss: boolean;
  /** PRNG state; every roll advances it, so a battle replays identically from its seed */
  seed: number;
  /** Increments every step; the UI keys one-shot animations on it */
  step: number;
  /** Events of the latest step only */
  events: BattleEvent[];
};

export type BattleAction =
  | { type: 'skill'; skill: SkillId; target?: number | HeroId }
  | { type: 'item'; item: ItemId; target?: HeroId }
  /** Advance the foe phase by one foe; the UI sends these on a timer */
  | { type: 'tick' };
