/**
 * Data contract for 寶咖咖奇俠傳, the 仙劍-style RPG: isometric maps to explore, NPCs to talk to,
 * a party that grows, and turn-based command battles (攻擊 / 才藝 / 道具 / 防禦 / 逃跑).
 * Everything here is plain data. The engines (battle.ts, scene.ts, quest.ts) are pure functions
 * over these types; the UI never mutates them.
 */

import type { PaletteName, SpriteName } from '../../art/types';

// ---------------------------------------------------------------------------------------------
// Party

export type HeroId = 'baokaka' | 'mocha' | 'magpie' | 'bear';

/** Every hero, in the order they join and the order they stand in battle. */
export const HERO_ORDER: readonly HeroId[] = ['baokaka', 'mocha', 'magpie', 'bear'];

/** 體力 / 元氣 / 武力 / 防禦 / 身手 / 幸運: the classic six. */
export type Stats = { hp: number; mp: number; atk: number; def: number; spd: number; luck: number };

/** 才藝, four per hero (story bible § 2.1) */
export type SpellId =
  | 'throwBlock'
  | 'bigCry'
  | 'clapClap'
  | 'firstStep'
  | 'purr'
  | 'clawCombo'
  | 'catnipFury'
  | 'nineLives'
  | 'featherRain'
  | 'divePeck'
  | 'magpieBridge'
  | 'cometTail'
  | 'pawPat'
  | 'groundPound'
  | 'sugarHug'
  | 'moonCharge';

/**
 * What a move looks like when it lands (art direction § 7.10). Content, not layout: the drawings
 * live in art/fx/BattleFxArt.tsx, but which one a move uses is authored next to the move itself
 * (`Spell.fx`, `FoeMove.fx`, a hero's `attackFx`). Battles are tantrums, not violence: 「咚」 and
 * 「拍拍」, never blood.
 */
export const FX_KINDS = [
  /** 積木: a toy-block arc and bounce */
  'blocks',
  /** 哭聲: sound rings */
  'cry',
  /** 貓爪: three slash arcs */
  'claw',
  /** 羽毛: blue feathers */
  'feather',
  /** 熊掌: a ground shock ring with dust */
  'paw',
  /** 治療: gold four-point stars */
  'heal',
  /** 護盾: the magpie-bridge arch over the party */
  'shield',
  /** 颱風: a spiral and rain (咻咻's moves) */
  'typhoon',
  /** A generic foe hit: a soft 「咚」 burst */
  'impact',
  /** Items and little magic: gold glints */
  'sparkle',
  /** An electric zigzag (neon foes) */
  'neon',
  /** A splash (swan and river foes) */
  'water',
  /** A puff of steam (food stalls, hot springs) */
  'steam',
  /** Calmed or sleepy stars circling */
  'dizzy',
] as const;

export type FxKind = (typeof FX_KINDS)[number];

/**
 * A skill's flourish on top of its kind (art direction § 5.1–5.4 battle actions): 拍拍手's clap
 * sparkle, 勇敢的第一步's big stomp, 長尾流星's comet, 月牙衝擊's moon crescent.
 */
export const FX_ACCENTS = ['clap', 'stomp', 'comet', 'moon'] as const;

export type FxAccent = (typeof FX_ACCENTS)[number];

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
  /** 元氣 spent */
  cost: number;
  /** Party level at which the hero learns it */
  level: number;
  effect: SpellEffect;
  fx: FxKind;
  /** An extra flourish drawn with the kind */
  fxAccent?: FxAccent;
  blurb: string;
};

// ---------------------------------------------------------------------------------------------
// Items

/** Story bible § 6.1 (consumables) then § 6.2 (equipment), in table order. */
export type ItemId =
  | 'teaEgg'
  | 'pineappleCake'
  | 'chickenCutlet'
  | 'douhua'
  | 'bubbleTea'
  | 'brownSugarMilk'
  | 'braisedRice'
  | 'mangoIce'
  | 'railBento'
  | 'meatBall'
  | 'grassJellyTea'
  | 'mysteryFood'
  | 'redTurtleCake'
  | 'bib'
  | 'flipFlops'
  | 'gradCap'
  | 'helmet'
  | 'tigerShoes'
  | 'flowerVest'
  | 'amulet'
  | 'neckPillow'
  | 'raincoat'
  | 'plushCharm'
  | 'travelerHat'
  | 'deliveryBag'
  | 'luckyCat'
  | 'moonPassCharm'
  | 'bellCollar'
  | 'profGlasses'
  | 'courageScarf'
  | 'tigerHat'
  | 'pinwheel'
  | 'clerkVest'
  | 'championBelt'
  | 'goldAmulet'
  | 'earthCane';

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
  /**
   * Price in 銅板 when a shop stocks it. 0 marks a gift or quest reward ("—" in the bible's
   * tables): it can never be bought, and `validate.ts` keeps it out of every shop.
   */
  price: number;
  use: ItemUse;
  /** Signature gear (bible § 2.1b): only this hero can wear it */
  only?: HeroId;
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
  | { kind: 'attack'; name: string; power: number; target: 'one' | 'all'; fx?: FxKind }
  | { kind: 'guard'; name: string }
  | { kind: 'heal'; name: string; ratio: number };

export type Foe = {
  id: FoeId;
  name: string;
  sprite: SpriteName;
  stats: Stats;
  xp: number;
  /** 銅板 dropped */
  coins: number;
  /** Chance of dropping the item, 0..1 */
  drop?: { item: ItemId; chance: number };
  /** Bosses cannot be fled from and shout their taunt on round 1 */
  boss?: boolean;
  /**
   * A final fight (咻咻's forms, the post-game rush): the full 布袋戲 proscenium frames the stage
   * and the foe is drawn 320px+ (art direction § 6.1, § 6.3, § 7.4; decision D-31). Needs `boss`.
   */
  final?: boolean;
  taunt?: string;
  /** Used in order, looping */
  moves: FoeMove[];
  /** 圖鑑: the one-line 「冷靜下來以後」 blurb (≤ 40 characters), written with the foe's art */
  calmed?: string;
  /** 圖鑑: where it lives, a short place name (≤ 12 characters) */
  home?: string;
  /** Only met after the ending (象山): left out of BESTIARY_FOES, so 圖鑑 can be completed in the story */
  postGame?: boolean;
};

// ---------------------------------------------------------------------------------------------
// World

export type MapId = 'home' | 'yard' | 'park' | 'market' | 'bath' | 'beach' | 'night';

/**
 * Night-painted ground materials (art direction § 4.4 *Tile material list*), drawn by
 * `src/art/tiles/terrain.ts`. Walkability and wall heights live in `TERRAIN` (iso.ts).
 */
export type Material =
  | 'grass'
  | 'gravel'
  | 'brickWalk'
  | 'asphalt'
  | 'zebra'
  | 'water'
  | 'marble'
  | 'undergroundTile'
  | 'wood'
  | 'rug'
  | 'playMat'
  | 'oldBrick'
  | 'stoneSlab'
  | 'planks'
  | 'stallTile'
  | 'grate'
  | 'apron'
  | 'runway'
  | 'teaSoil'
  | 'wetStone'
  | 'deck'
  | 'jadeWater'
  | 'seawall'
  | 'polished'
  | 'carpet'
  | 'deckGrate'
  | 'granite'
  | 'carFloor';

/** Structure rather than surface: doorways, raised walls and fences, and nothing at all. */
export type Structure = 'door' | 'wall' | 'fence' | 'void';

/**
 * The pre-redesign terrain names. They keep working until the old maps go (#21), drawn as the
 * material `TERRAIN_ALIAS` (iso.ts) names for each.
 */
export type LegacyTerrain = 'floor' | 'tile' | 'path' | 'sand' | 'cobble' | 'dark' | 'blanket';

export type Terrain = Material | Structure | LegacyTerrain;

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

/**
 * The dynamic exit target of a 月亮線 ride car's door (story bible § 3.1): resolved from
 * `run.rideTo` when walked, arriving at that map's `mrtArrival` tile.
 */
export const RIDE_TO = '@rideTo';

export type Exit = Condition & {
  c: number;
  r: number;
  /** Event to run instead when the condition fails (the closed-door line) */
  blocked?: string;
} & (
    | { to: MapId; at: Tile }
    /** A ride car's door: the destination comes from `run.rideTo`, so there is no fixed landing tile */
    | { to: typeof RIDE_TO }
  );

export type Trigger = Condition & {
  id: string;
  c: number;
  r: number;
  event: string;
  once?: boolean;
  /**
   * Fires only when the party arrives on this tile (through an exit or a 月亮線 ride), never when
   * walking onto it: a ride car's announcement plays once per ride, not each time the party
   * crosses the doorway tile.
   */
  arrival?: boolean;
};

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
  /**
   * Where the party steps out after a 月亮線 ride: the walkable tile beside the map's `mrtGate`.
   * Every map with a station in `STATIONS` (mrt.ts) must have one.
   */
  mrtArrival?: Tile;
  /**
   * The map's clock (`HH:MM`): it picks the sky, the night grade and the character rim (art
   * direction § 3.2). Leave it out to use the § 4.2 location time or the chapter card's time
   * (`mapClock` in clock.ts, decision D-16).
   */
  time?: string;
  /**
   * Light sources (art direction § 4.1 *Key light sources*, § 8.4): each draws a bloom, a ground
   * pool and, on wet ground, a reflection streak in the map's `screen`-blended light layer.
   */
  lights?: MapLight[];
  /** Neon is allowed here (西門町, 士林夜市, the 月亮線 cars; § 4.3 *Neon policy*). */
  neon?: boolean;
  /** Ambient life (§ 4.1 *Ambient FX*): at most `MAX_AMBIENT_ELEMENTS` animated elements in all. */
  ambient?: AmbientKind[];
  /** Indoors: the sky shows only through windows, so the map floats over a dark room instead. */
  interior?: boolean;
  /**
   * The battle backdrop (art direction § 4.1 item 5, § 8.4): a key in `BACKDROP_CHAPTER`
   * (art/backdrops/keys.ts). Leave it out and battles here use the generic stage (open sky, or
   * the room version on `interior` maps) at the map's clock.
   */
  backdrop?: string;
};

export type LightKind = 'lamp' | 'window' | 'lantern' | 'neon' | 'screen' | 'moon';

/**
 * Lights that stand on the ground (a post, a lantern stand, a sign pole): drawn as a fixture and,
 * placed on a whole tile, solid like decor. Windows, screens and moon glints are only light.
 */
export const STANDING_LIGHTS: readonly LightKind[] = ['lamp', 'lantern', 'neon'];

/**
 * One light source on a map, at a tile (fractions allowed, to sit between tiles). `color`
 * overrides the kind's colour (`#RRGGBB`; neon signs pick pink or cyan, windows warm or cool).
 */
export type MapLight = { c: number; r: number; kind: LightKind; color?: string };

/** Ambient loops (§ 4.1): transform and opacity only, never filters. */
export type AmbientKind = 'leaves' | 'ripples' | 'fireflies' | 'steam' | 'lanternSway' | 'mist' | 'rain';

/** How many animated elements each ambient kind adds (§ 8.5: ≤ 6 ambient per map). */
export const AMBIENT_ELEMENTS: Readonly<Record<AmbientKind, number>> = {
  leaves: 2,
  ripples: 2,
  fireflies: 3,
  steam: 3,
  lanternSway: 2,
  mist: 2,
  rain: 3,
};

export const MAX_AMBIENT_ELEMENTS = 6;

// ---------------------------------------------------------------------------------------------
// Scripts: dialogue and cutscenes

/**
 * A line spoken by a hero, an NPC (by id), or nobody (system narration). `text` may mark key
 * terms as `【詞】` (shown in gold, brackets dropped). `expr` names the speaker's expression for
 * the dialogue bust (`SpriteProps.expr`); sprites that don't have it draw their default face.
 */
export type Line = { who: HeroId | string | null; text: string; expr?: string };

/** One button of a `choice` step: what it says (≤ 12 characters) and the event it branches to. */
export type ChoiceOption = { label: string; event: string };

/**
 * One instruction of a script (docs/story/script.md, *How to read this file*).
 *
 * Multi-phase bosses and their retry: consecutive `battle` steps simply play one after the
 * other, and a defeat respawns the party at the map entry with the scene cleared but every flag
 * kept. So for multi-phase bosses, set a phase flag after each phase and give the NPC a
 * `when: phaseFlag` talk rule pointing at a retry event that starts at the next phase, e.g.
 * `[boss A] [flag phase1] [heal 0.5] [boss B]` plus `{ when: 'phase1', event: 'boss.retry' }`.
 */
export type Step =
  | Line
  /**
   * The chapter card. `time` is the clock on the card (`HH:MM`, decision D-16); `label` replaces
   * 「第 n 章」 for 尾聲 / 番外 (D-15), and a labelled card does not move `run.chapter`. `next` is
   * the departure board's 「下一站：…」 line (art direction § 7.6), a station name.
   */
  | { do: 'chapter'; n: number; title: string; time?: string; label?: string; next?: string }
  | { do: 'join'; hero: HeroId }
  | { do: 'flag'; flag: string }
  | { do: 'give'; item: ItemId; count?: number }
  /** A negative amount spends; the purse floors at 0, so an event purchase always succeeds */
  | { do: 'coins'; amount: number }
  /**
   * Without a ratio: everyone back to full, the fallen too. With a ratio in (0, 1]: every hero
   * (KO'd or not) is raised to at least `ratio` of their max HP and MP, never lowered.
   */
  | { do: 'heal'; ratio?: number }
  | { do: 'battle'; foes: FoeId[]; boss?: boolean }
  | { do: 'goto'; map: MapId; c: number; r: number }
  | { do: 'shop'; stock: ItemId[] }
  /** Sleep for the night: asks first, charges, then heals. `price: 0` skips the question and just heals */
  | { do: 'inn'; price: number }
  /** 2–3 buttons; the chosen option's event replaces the rest of the scene (a branch, not a sub-call) */
  | { do: 'choice'; prompt?: string; options: ChoiceOption[] }
  /** The script's `→ key`: jump to another event, dropping the rest of this one */
  | { do: 'goEvent'; event: string }
  /**
   * An optional insert: when the condition holds right now, play `event` here, then carry on with
   * the rest of this scene (a sub-call, unlike `goEvent`). Included events must stay linear.
   */
  | ({ do: 'include'; event: string } & Condition)
  /** Open the 路線圖 (月亮線 travel screen); the scene waits there until the player rides or cancels */
  | { do: 'travel' }
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
  coins: number;
  flags: string[];
  /** 圖鑑: every foe the party has beaten at least once, in the order first beaten (no repeats) */
  seenFoes: FoeId[];
  /** Steps walked since the last random encounter */
  steps: number;
  /** Rolling seed for encounters and drops, so the reducer stays pure */
  seed: number;
  /** Highest chapter reached */
  chapter: number;
  cleared: boolean;
  /** The map a 月亮線 ride is heading to while the party is in a ride car; null otherwise */
  rideTo: MapId | null;
  /** Station keys (mrt.ts) the 路線圖 has already shown lit, so a new one plays its 「叮！」 once */
  seenStations: string[];
};

/** Player preferences that live beside the run (saved with it, kept across new games). */
export type QuestSettings = {
  /** 直接到站: a 月亮線 ride skips the car and arrives at the destination at once */
  skipRides: boolean;
  /** 減少動態: no loops, flips or draw-ons; everything a short fade (OR'd with the OS setting) */
  reducedMotion: boolean;
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
  /** `arcane` is a cast rather than a swing: the UI draws the caster's gold glyph ring under them */
  | { kind: 'act'; who: Who; name: string; fx: FxKind | null; arcane: boolean; accent?: FxAccent }
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
