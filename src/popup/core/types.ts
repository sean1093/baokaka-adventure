/**
 * The data contract of 《翻翻台北》 (GDD § 3.2). Pages are data; every part is a finite state
 * machine compiled from a preset (`presets.ts`). These types follow GDD § 3.2 verbatim, with the
 * tweaks recorded in decisions.md D-41 (and mirrored in the GDD): `PartDef.states` / `initial`
 * may be omitted where the preset has defaults, and `LineKey` / `BabyMode` / `PartInput` are
 * named here because the GDD uses them without spelling them out.
 *
 * Pure types plus one constant (`PART_PRESETS`): no behaviour lives in this file.
 */

export type Id = string;
export type Kind = 'shiny' | 'mocha' | 'snack' | 'light';
/** 嗶 掰掰 不要 哇 抱抱 飛機 咻 一起 */
export type Word = 'beep' | 'bye' | 'no' | 'wow' | 'hug' | 'plane' | 'whoosh' | 'together';
/** 0 crawl, 1 climb, 2 cruise (stand), 3 walk */
export type Growth = 0 | 1 | 2 | 3;
export type EdgeKind = 'crawl' | 'climb' | 'cruise' | 'walk' | 'jump' | 'squeeze';

/** A script line key, e.g. `c1.intro.2` (GDD § 5.1). `content/script.ts` narrows it later. */
export type LineKey = string;

export type Cond =
  /** part state is one of */
  | { part: Id; in: string[] }
  /** Mocha is settled on perch */
  | { mochaAt: Id }
  | { babyAt: Id }
  /** pushable has landed */
  | { landed: Id }
  /** creature at named position */
  | { creature: Id; at: string }
  | { consumed: Id }
  /** page-local flag set by reactions */
  | { flag: Id }
  | { all: Cond[] }
  | { any: Cond[] }
  | { not: Cond };

export interface NodeDef {
  id: Id;
  x: number;
  y: number;
  height: 0 | 1 | 2;
  /** position per part state */
  attach?: { part: Id; pos: Record<string, [number, number]> };
  tags?: ('wet' | 'steam' | 'glass' | 'box')[];
}

export interface EdgeDef {
  a: Id;
  b: Id;
  kind: EdgeKind;
  when?: Cond;
  oneWay?: boolean;
}

export interface PerchDef {
  id: Id;
  /** cat-graph node (height ≥ 1 or cat-only) */
  node: Id;
  /** where Baokaka goes when Mocha here is his target */
  reachNode?: Id;
  /** sitting on a part (C4): presses buttons, locks lockedByCat parts */
  onPart?: Id;
  /** pushable to knock off on arrival (C3) */
  push?: Id;
  /** arrival sets a part state ("pull the cord") */
  set?: { part: Id; to: string };
  /** box perch (C9) */
  hidesMocha?: boolean;
  /** e.g. water present (C7) */
  blockedWhen?: Cond;
}

/**
 * Which events a reaction listens to: a type, or a type narrowed by radius (`within`: units from
 * the event origin, default per event, GDD § 2.4), by the event's subject (`id`: the part, node,
 * perch, creature or attractor it is about) and, for `partEnter`, by the state entered (D-45).
 */
export type ReactionOn = EventType | { type: EventType; within?: number; id?: Id; state?: string };

export type Reaction = {
  on: ReactionOn;
  when?: Cond;
  to: string | 'next' | 'prev' | 'toggle';
  setFlag?: Id;
};

/** The 14 part presets of GDD § 2.1. Core owns this list; the art layer imports it (D-40). */
export const PART_PRESETS = [
  'tab',
  'slider',
  'wheel',
  'flap',
  'section',
  'gate',
  'button',
  'lift',
  'loop',
  'pushable',
  'light',
  'blowable',
  'carrier',
  'prop',
] as const;
export type PartPreset = (typeof PART_PRESETS)[number];

/** How the player drives a part. `none` = event- or weight-driven only. */
export type PartInput = 'drag-linear' | 'drag-rotary' | 'tap-toggle' | 'tap-cycle' | 'none';

export interface PartDef {
  id: Id;
  preset: PartPreset;
  /** Optional where the preset has defaults (`presets.ts`); count-based presets must list them. */
  states?: string[];
  /** Defaults to the first state. */
  initial?: string;
  /** Defaults per preset (`presets.ts`); a loop's crank is `drag-rotary`, a tappable light `tap-toggle`. */
  input?: PartInput;
  /** linear parts: stop i is evenly spaced */
  track?: { from: [number, number]; to: [number, number] };
  /** rotary parts */
  center?: [number, number];
  radius?: number;
  hit: { x: number; y: number; w: number; h: number } | { cx: number; cy: number; r: number };
  /** C4 */
  lockedByCat?: boolean;
  /** whole part can't move */
  lockedWhen?: Cond;
  /** a state can only be entered while its cond holds; drags snap to the furthest allowed stop */
  stateWhen?: Record<string, Cond>;
  react?: Reaction[];
  /** e.g. reader 'down' emits 'beep' */
  emit?: { onEnter: string; event: EventType }[];
  // preset-specific:
  /** pushable */
  fall?: { path: [number, number][]; fallTo: Id; landSets?: { part: Id; to: string } };
  /** carrier */
  route?: Id[];
  /** light owns a light attractor */
  attractor?: Id;
  /** art registry key, e.g. 'c1/train-blue' */
  art: string;
  /**
   * A node the part sits on (#107: 1-6's bento lid on its cart, 1-5's panel in the car): its `hit`
   * and art are authored where the node is in the initial state, and the view moves both with the
   * node. View only: the simulation reads the authored `hit` (event origins).
   */
  ridesOn?: Id;
}

export interface AttractorDef {
  id: Id;
  kind: Kind;
  node: Id;
  /** height 1 needs reachHigh (stage 2) or adjacency rules */
  height?: 0 | 1;
  visibleWhen?: Cond;
  activeWhen?: Cond;
  /** never grabbable (node unreachable by design); lint checks it isn't a goal */
  decoy?: boolean;
  goal?: boolean;
  /** a creature holds it (stays at the creature's node) until a reaction with `drop` */
  heldBy?: Id;
  /** node follows a part's state (spotlight aim) */
  nodeBy?: { part: Id; map: Record<string, Id> };
  /** at `node` while onPerch, at the pushable's fallTo once landed */
  followsPushable?: Id;
  /**
   * Art registry key for how it looks, when not the kind's default (#116: a decoy's moon
   * reflection, brass bell or reading glasses). View only: the simulation never reads it.
   */
  art?: string;
}

export interface CreatureDef {
  id: Id;
  positions: Record<string, Id | 'offpage'>;
  initial: string;
  /** occupied node is not traversable (default true) */
  blocks?: boolean;
  winged?: boolean;
  lonely?: boolean;
  fleesFromCat?: { nearPerches: Id[]; to: string };
  /** `to` is a position name; `drop` releases a `heldBy` attractor at the creature's node first. */
  react?: { on: ReactionOn; within?: number; when?: Cond; to: string; drop?: Id }[];
  art: string;
}

/** A standing cut-out on a page (GDD § 3.9 layer 2): an art key and where its origin goes, in page units. */
export interface CutoutDef {
  art: string;
  x: number;
  y: number;
  /** Shown only while this holds (a drawing that appears with a state, #115: 2-6's portrait of Mocha); always, if absent */
  visibleWhen?: Cond;
}

export interface PageDef {
  /** 'c1p2' */
  id: Id;
  /** 0..10 (prologue uses chapter 0) */
  chapter: number;
  /** 1..6 */
  index: number;
  /** zh-Hant, ≤ 10 chars */
  title: string;
  spread?: boolean;
  photoRect?: { x: number; y: number; w: number; h: number };
  difficulty: 1 | 2 | 3 | 4 | 5;
  nodes: NodeDef[];
  edges: EdgeDef[];
  parts: PartDef[];
  perches: PerchDef[];
  attractors: AttractorDef[];
  creatures: CreatureDef[];
  /** growth defaults to "learned by this page" */
  baby: { start: Id; facing: 'l' | 'r'; growth?: Growth };
  /** perch id, or null = not on page */
  mocha: { start: Id | null };
  /** defaults to words learned before this page */
  words?: Word[];
  learns?: { word?: Word; growth?: Growth; when: Cond | { event: EventType } };
  mischief: { text: string; when: EventPredicate };
  tudigong: { x: number; y: number; visibleWhen?: Cond; hat: string };
  /** intended solution, replayed in tests */
  solution: SolutionStep[];
  /** tutorial beats / page E only */
  allowTrivial?: boolean;
  /** page E only */
  priorityOverride?: Partial<Record<Kind, number>>;
  lines?: { intro?: LineKey[]; onEvent?: { when: EventPredicate; line: LineKey }[] };
  /** baked art key */
  backdrop: string;
  /**
   * Standing cut-outs (GDD § 3.9 layer 2; #96): static art placed at (x, y), the cut-out's own
   * origin; drawn over the backdrop and under every part. Pure art: the simulation never reads it.
   */
  cutouts?: CutoutDef[];
}

/** The identity helper every page file uses (`core/define.ts`, re-exported by `pages/`). */
export type DefinePage = (def: PageDef) => PageDef;

export type SolutionStep =
  /** gesture result */
  | { set: Id; to: string }
  | { mocha: Id }
  /** pet = tap Mocha (repeat perch action) */
  | { pet: true }
  | { say: Word }
  | { tap: Id }
  | { wait: number | 'settle' | 'goal' };

export type EventType =
  | 'beep'
  | 'wave'
  | 'wow'
  | 'hug'
  | 'sky'
  | 'whoosh'
  | 'together'
  | 'cry'
  | 'catArrive'
  | 'catLeave'
  | 'push'
  | 'land'
  | 'babyEnter'
  | 'ride'
  | 'grab'
  | 'eat'
  | 'partEnter';

export type EventPredicate = { type: EventType; id?: Id; count?: number; when?: Cond };

/**
 * Baokaka's modes (GDD § 2.2.7). The GDD's parameters live elsewhere in `SimState.baby`:
 * `looking(n)` → `lookCount`, `carried(by, k)` → `carriedBy`; `saying(word)` lasts one tick and
 * its word travels as the queued event (§ 3.3 phases 1 and 5).
 */
export const BABY_MODES = [
  'idle',
  'moving',
  'reaching',
  'looking',
  'crying',
  'watching',
  'cuddling',
  'eating',
  'grabbing',
  'saying',
  'carried',
  'linked',
  'done',
] as const;
export type BabyMode = (typeof BABY_MODES)[number];

/** Runtime state: plain JSON, structurally comparable; `canonicalKey` hashes it for the solver. */
export interface SimState {
  tick: number;
  parts: Record<Id, string>;
  baby: {
    node: Id;
    mode: BabyMode;
    facing: 'l' | 'r';
    refused: Id[];
    /** Ticks of `looking` (1–2); while `crying` over refusals, the cries so far (1, D-75); else 0. */
    lookCount: number;
    /** The attractor he is after (`'mocha'` for Mocha), or null (D-43). The view's bubble reads it. */
    target: Id | null;
    /** Ticks spent reaching for `target`, mod 4: he barks 「要！要！」 when it is 0 (D-43). */
    reachTicks: number;
    carriedBy?: { id: Id; k: number };
    linked: boolean;
  };
  /**
   * Mocha (GDD § 2.3, D-44). Settled: `perch` is where he sits and `path` is empty. Travelling:
   * `perch` is null, `path` is the rest of his trip with his current node first, and `to` is the
   * perch he is heading for (between a `mocha` input and the tick's Mocha phase, `perch` is still
   * the one he's about to leave). `stare` is the pushable he is making eye contact over (C3): he pushes
   * it next tick. `floorNode` is for linked mode (#128).
   */
  mocha: { perch: Id | null; path: Id[]; to?: Id; stare?: Id; floorNode?: Id };
  creatures: Record<Id, string>;
  pushables: Record<Id, 'onPerch' | 'falling' | 'landed'>;
  consumed: Id[];
  flags: Id[];
  /**
   * Attractors a creature has dropped (`drop`, § 2.4 掰掰) → the node they lie on. Absent until
   * something drops (D-45).
   */
  dropped?: Record<Id, Id>;
  /**
   * For mischief and line predicates (`predicateKey` → matching events so far, capped at the
   * predicate's count, so the state space stays finite), plus `LEARNED_KEY` once `learns` fired (D-45).
   */
  counters: Record<string, number>;
  done: boolean;
}

export type Input =
  /** from a drag release / tap */
  | { t: 'set'; part: Id; to: string }
  | { t: 'mocha'; perch: Id }
  | { t: 'pet' }
  | { t: 'say'; word: Word }
  | { t: 'tap'; id: Id }
  /** floor = linked mode */
  | { t: 'floor'; node: Id }
  | { t: 'none' };
