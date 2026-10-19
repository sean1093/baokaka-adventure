import type { SimEvent } from '../../core/events';
import type { BabyMode, EdgeKind, Growth, Id, PageDef, SimState, Word } from '../../core/types';
import type { SpriteId } from '../../sprites';

/**
 * Which animation each simulation mode shows (#95; GDD § 3.9 sprite needs, § 2.2.7 modes, § 2.3
 * Mocha; Art v2 § 5 coverage). Pure tables and functions: `Baby.tsx` / `Mocha.tsx` draw what these
 * return, `PageView` feeds them the tick, PageLab's sprite report (`#/pagelab?section=sprites`)
 * reads `FRAME_REPORT`.
 *
 * - **Names.** The GDD's frame names map onto the delivered poses through Art v2 § 5: grab →
 *   `hold`, cuddle → `hug`, say → `point`, stand-cruise → `pull`/`wobble`, Mocha hop/land →
 *   `jump`, eye contact → `push` frame 1 (looking at the camera).
 * - **Cycles** are 8 frames (crawl, walk, Mocha walk), not the GDD's 6.
 * - **Fallbacks** stand in for frames not drawn yet (#141): look L/R → `sit` with a card flip away
 *   and back; touch-watch → `sit` tilted toward the finger; watch-sway → `sit` rocking ±3°;
 *   ride-giggle → `bounce`; Mocha glare → `sit` with the stiff lean; purr → `loaf`; in-box → the
 *   standee hidden behind the box art. Each one is logged once in dev (`noteFrameFallback`).
 * - **Growth guard** (bible § 5): art never shows a pose he can't do yet. Standing poses need the
 *   growth stage that allows them (cruise 2, walk 3); otherwise he crawls.
 */

/** A frame (or set) of GDD § 3.9's sprite needs. */
export type BabyFrame =
  | 'crawl'
  | 'sit'
  | 'reach'
  | 'look'
  | 'cry'
  | 'grab'
  | 'eat'
  | 'watchSway'
  | 'cuddle'
  | 'say'
  | 'rideGiggle'
  | 'touchWatch'
  | 'carried'
  | 'climb'
  | 'standCruise'
  | 'walk';
export type MochaFrame = 'sit' | 'loaf' | 'hop' | 'land' | 'eyeContact' | 'push' | 'glare' | 'puff' | 'purr' | 'inBox' | 'walk';

/** How the shown frame is chosen. */
export type FramePlay =
  /** One frame held (`frame`: an index into the animation's frames; default its key frame) */
  | { readonly kind: 'hold'; readonly frame?: number }
  /** The sprite's own clock (its play mode: loop, pingpong, once) */
  | { readonly kind: 'clock' }
  /** A cycle synced to the step's lerp: whole strides per edge (crawl, walk) */
  | { readonly kind: 'stride' }
  /** Frames switched at fractions of the step's progress (`at[i]`: where frame i starts) */
  | { readonly kind: 'step'; readonly at: readonly number[] };

/** What an actor shows this tick. */
export interface ActorAnim {
  readonly sprite: SpriteId;
  readonly play: FramePlay;
  /** The GDD § 3.9 frame this is (null: a delivered extra with no GDD row, e.g. the done clap) */
  readonly gdd: string | null;
  /** Watch-sway fallback: the standee rocks ±3° (a CSS loop) */
  readonly sway?: boolean;
  /** Look L/R fallback: a card flip away and back over the tick */
  readonly lookAround?: boolean;
  /** Mocha in a box: the standee is hidden behind the box art */
  readonly hidden?: boolean;
  /** Mocha's glare: the stiff lean (`.gx-glare`) */
  readonly glare?: boolean;
  /** A stand-in for a frame not drawn yet (#141): what it is, for the dev log and the report */
  readonly fallback?: string;
}

// ——— Baokaka ———

/** The frame clock's crouch → air → land split of Mocha's hop over a step (bible § 8). */
export const HOP_AT = [0, 0.18, 0.82] as const;

/** Lowest growth stage (GDD § 2.5) each standing pose needs; anything else shows from stage 0. */
export const GROWTH_NEEDS: Readonly<Partial<Record<SpriteId, Growth>>> = {
  'baokaka.pull': 2,
  'baokaka.wobble': 2,
  'baokaka.walk': 3,
};

/** What a page's growth stage may show (bible § 5): a standing pose too early becomes the crawl. */
export function guardGrowth(anim: ActorAnim, growth: Growth): ActorAnim {
  const needs = GROWTH_NEEDS[anim.sprite];
  if (needs === undefined || growth >= needs) return anim;
  return { ...anim, sprite: 'baokaka.crawl', play: anim.play.kind === 'stride' ? anim.play : { kind: 'hold' }, gdd: 'crawl' };
}

const hold = (sprite: SpriteId, gdd: string | null, frame?: number): ActorAnim => ({ sprite, play: frame === undefined ? { kind: 'hold' } : { kind: 'hold', frame }, gdd });
const clock = (sprite: SpriteId, gdd: string | null): ActorAnim => ({ sprite, play: { kind: 'clock' }, gdd });

/**
 * Each mode's animation when nothing else applies (no step, no ride, no finger). The unit test
 * insists on an entry per `BabyMode`.
 */
export const BABY_MODE_ANIM: Readonly<Record<BabyMode, ActorAnim>> = {
  idle: hold('baokaka.sit', 'sit'),
  moving: { sprite: 'baokaka.crawl', play: { kind: 'stride' }, gdd: 'crawl' },
  reaching: hold('baokaka.reach', 'reach'),
  looking: { ...hold('baokaka.sit', 'look'), lookAround: true, fallback: 'look L/R → sit + card flip away and back' },
  crying: clock('baokaka.cry', 'cry'),
  watching: { ...hold('baokaka.sit', 'watchSway'), sway: true, fallback: 'watch-sway → sit + ±3° rock' },
  cuddling: hold('baokaka.hug', 'cuddle'),
  eating: hold('baokaka.eat', 'eat'),
  grabbing: hold('baokaka.hold', 'grab'),
  saying: hold('baokaka.point', 'say'),
  carried: { ...hold('baokaka.sit', 'carried'), fallback: 'carried → sit' },
  linked: { sprite: 'baokaka.crawl', play: { kind: 'stride' }, gdd: 'crawl' },
  done: clock('baokaka.clap', null),
};

/** Words with their own pose (Art v2 § 5); the rest say with `point` (mouth open). */
export const WORD_POSE: Readonly<Partial<Record<Word, SpriteId>>> = {
  bye: 'baokaka.wave',
  no: 'baokaka.refuse',
  hug: 'baokaka.hug',
  plane: 'baokaka.wonder',
};

export interface BabyAnimInput {
  readonly mode: BabyMode;
  /** The kind of the edge he stepped along this tick, or null (no step) */
  readonly edge: EdgeKind | null;
  /** He sits on a node a part carried this tick (GDD § 2.2.3 riding) */
  readonly riding?: boolean;
  /** The page's growth stage now */
  readonly growth: Growth;
  /** A finger is down: the world is paused and he watches it (touch-watch, GDD § 2.6) */
  readonly watching?: boolean;
  /** The word he is saying (`saying` mode), when known */
  readonly word?: Word | null;
}

/** Modes a ride doesn't interrupt: they have their own, stronger pose. */
const RIDE_KEEPS: ReadonlySet<BabyMode> = new Set(['crying', 'saying', 'eating', 'grabbing', 'done']);

/** 寶咖咖's animation this tick. */
export function babyAnim({ mode, edge, riding = false, growth, watching = false, word = null }: BabyAnimInput): ActorAnim {
  let anim: ActorAnim;
  if (watching) {
    anim = { ...hold('baokaka.sit', 'touchWatch'), fallback: 'touch-watch → sit + 3° tilt toward the finger' };
  } else if (edge !== null && (mode === 'moving' || mode === 'linked')) {
    anim = moveAnim(edge);
  } else if (riding && !RIDE_KEEPS.has(mode)) {
    anim = { ...clock('baokaka.bounce', 'rideGiggle'), fallback: 'ride-giggle → bounce' };
  } else if (mode === 'saying' && word !== null && WORD_POSE[word] !== undefined) {
    const sprite = WORD_POSE[word]!;
    anim = sprite === 'baokaka.wave' || sprite === 'baokaka.refuse' ? clock(sprite, 'say') : hold(sprite, 'say');
  } else if ((mode === 'moving' || mode === 'linked') && edge === null) {
    // Between steps (a held still, a tick he didn't step): the cycle's key frame
    anim = hold('baokaka.crawl', 'crawl');
  } else {
    anim = BABY_MODE_ANIM[mode];
  }
  return guardGrowth(anim, growth);
}

/** The step along one edge, by the edge's kind. */
function moveAnim(edge: EdgeKind): ActorAnim {
  switch (edge) {
    case 'cruise':
      return clock('baokaka.wobble', 'standCruise');
    case 'walk':
      return { sprite: 'baokaka.walk', play: { kind: 'stride' }, gdd: 'walk' };
    case 'climb':
      return { sprite: 'baokaka.crawl', play: { kind: 'stride' }, gdd: 'climb', fallback: 'climb → crawl' };
    default:
      return { sprite: 'baokaka.crawl', play: { kind: 'stride' }, gdd: 'crawl' };
  }
}

// ——— 摩卡 ———

/** Mocha's states for the view (GDD § 2.3). The unit test insists on an animation per state. */
export const MOCHA_STATES = ['sit', 'onPart', 'hop', 'squeeze', 'eyeContact', 'push', 'glare', 'puff', 'nope', 'purr', 'inBox'] as const;
export type MochaState = (typeof MOCHA_STATES)[number];

export const MOCHA_STATE_ANIM: Readonly<Record<MochaState, ActorAnim>> = {
  sit: hold('mocha.sit', 'sit'),
  // C4: sitting on a part (a held button, a locked tab) he settles into a loaf
  onPart: hold('mocha.loaf', 'loaf'),
  // Crouch, air, land (the land is `jump` frame 3)
  hop: { sprite: 'mocha.jump', play: { kind: 'step', at: HOP_AT }, gdd: 'hop' },
  squeeze: hold('mocha.squeeze', null),
  // C3: the signature beat, a whole tick looking at the camera (`push` frame 1)
  eyeContact: hold('mocha.push', 'eyeContact', 0),
  // The tick after the stare: the shove (`push` frame 2) while the pushable starts its fall
  push: hold('mocha.push', 'push', 1),
  glare: { ...hold('mocha.sit', 'glare'), glare: true, fallback: 'glare → sit + stiff lean' },
  puff: hold('mocha.puff', 'puff'),
  // 「喵？」 at an unreachable perch: he flicks his tail
  nope: clock('mocha.lure', null),
  purr: { ...hold('mocha.loaf', 'purr'), fallback: 'purr → loaf' },
  inBox: { ...hold('mocha.sit', 'inBox'), hidden: true, fallback: 'in-box → standee hidden behind the box' },
};

export interface MochaAnimInput {
  /** He hopped (or squeezed) from one node to another this tick */
  readonly travelling: boolean;
  /** …and has landed (the step's progress reached 1) */
  readonly landed?: boolean;
  /** The kind of that edge (`jump` or `squeeze`) */
  readonly edge?: EdgeKind | null;
  /** He sits in a box perch (C9) */
  readonly hidden?: boolean;
  /** The eye-contact tick before a push (C3, `mocha.stare`) */
  readonly staring?: boolean;
  /** The tick the stare became a push */
  readonly pushing?: boolean;
  /** A touch on a part he locks (GDD § 2.6) */
  readonly glare?: boolean;
  /** This tick's `mochaPuff` (C7) / `mochaNope` */
  readonly puff?: boolean;
  readonly nope?: boolean;
  /** 寶咖咖 is cuddling him */
  readonly cuddled?: boolean;
  /** His perch sits on a part (C4) */
  readonly onPart?: boolean;
}

/** Mocha's state this tick, by precedence: hidden, travelling, the push beat, reactions, at rest. */
export function mochaState(i: MochaAnimInput): MochaState {
  if (i.hidden) return 'inBox';
  // The eye contact is the tick that ends with `stare` (D-44): arriving that tick, it starts as he lands
  if (i.travelling && !(i.landed && i.staring)) return i.edge === 'squeeze' ? 'squeeze' : 'hop';
  if (i.staring) return 'eyeContact';
  if (i.pushing) return 'push';
  if (i.glare) return 'glare';
  if (i.puff) return 'puff';
  if (i.nope) return 'nope';
  if (i.cuddled) return 'purr';
  if (i.onPart) return 'onPart';
  return 'sit';
}

export const mochaAnim = (i: MochaAnimInput): ActorAnim => MOCHA_STATE_ANIM[mochaState(i)];

// ——— Frames over the tick ———

/** Page units one crawl (or walk) cycle covers: whole strides per edge, so hands plant once per stride. */
export const STRIDE_UNITS = 44;
/** Above this many frames a second the cycle switches to its 4-frame `key` version. */
export const MAX_STRIDE_FPS = 24;

export interface FrameChoice {
  /** The animation (`key`: the cheaper keyframe cycle) */
  readonly anim: 'main' | 'key';
  /** The frame to show (an index into the animation's frames), or undefined for the sprite's own (clock or key frame) */
  readonly frame?: number;
  /** Run the sprite's clock */
  readonly playing: boolean;
}

/** Whole strides along an edge `dist` long (at least one). */
export const strideCycles = (dist: number): number => Math.max(1, Math.round(dist / STRIDE_UNITS));

/**
 * The frame for `anim` `k` (eased progress, 0–1) through a step `dist` long in a `tickMs` tick.
 * Reduced motion and stills hold: a step sequence its last frame (landed), a cycle its key frame.
 */
export function chooseFrame(anim: ActorAnim, { k, dist, tickMs, hold: held }: { k: number; dist: number; tickMs: number; hold: boolean }): FrameChoice {
  const play = anim.play;
  switch (play.kind) {
    case 'hold':
      return { anim: 'main', frame: play.frame, playing: false };
    case 'clock':
      return { anim: 'main', playing: !held };
    case 'step': {
      if (held || k >= 1) return { anim: 'main', frame: play.at.length - 1, playing: false };
      let i = 0;
      while (i + 1 < play.at.length && k >= play.at[i + 1]) i++;
      return { anim: 'main', frame: i, playing: false };
    }
    case 'stride': {
      if (held || k >= 1 || k <= 0) return { anim: 'main', playing: false };
      const cycles = strideCycles(dist);
      const fps = (cycles * 8) / (Math.max(1, tickMs) / 1000);
      const key = fps > MAX_STRIDE_FPS;
      const n = key ? 4 : 8;
      return { anim: key ? 'key' : 'main', frame: Math.floor(k * cycles * n) % n, playing: false };
    }
  }
}

// ——— Dev: fallbacks logged once ———

const logged = new Set<string>();

/** Logs a fallback frame the first time it shows (dev builds only), so the gap is never silent. */
export function noteFrameFallback(anim: ActorAnim): void {
  if (anim.fallback === undefined || logged.has(anim.fallback)) return;
  logged.add(anim.fallback);
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') console.info(`[sprites] fallback frame (#141): ${anim.fallback}`);
}

// ——— The missing-frame report (GDD § 3.9) ———

export interface FrameNeed {
  readonly char: 'baokaka' | 'mocha';
  /** `BabyFrame` / `MochaFrame` */
  readonly id: string;
  /** The GDD's name */
  readonly label: string;
  /** Frames the GDD asks for (cycles: 8, Art v2 § 5) */
  readonly frames: number;
  /** `later`: first needed in M3/M4, not required for M1 */
  readonly when: 'M1' | 'later';
  /** What is delivered for it: a pose and its frames (indices into the pose's frames) */
  readonly delivered: readonly { readonly sprite: SpriteId; readonly frames: readonly number[] }[];
  /** What the game shows instead while frames are missing */
  readonly fallback?: string;
}

const d = (sprite: SpriteId, ...frames: number[]) => ({ sprite, frames });

/** GDD § 3.9's sprite needs, one row per frame set, against Art v2 § 5's delivered poses. */
export const FRAME_REPORT: readonly FrameNeed[] = [
  { char: 'baokaka', id: 'crawl', label: 'crawl cycle', frames: 8, when: 'M1', delivered: [d('baokaka.crawl', 0, 1, 2, 3, 4, 5, 6, 7)] },
  { char: 'baokaka', id: 'sit', label: 'sit', frames: 1, when: 'M1', delivered: [d('baokaka.sit', 0)] },
  { char: 'baokaka', id: 'reach', label: 'reach', frames: 2, when: 'M1', delivered: [d('baokaka.reach', 0)], fallback: 'the one frame held' },
  { char: 'baokaka', id: 'look', label: 'look L/R', frames: 2, when: 'M1', delivered: [], fallback: BABY_MODE_ANIM.looking.fallback },
  { char: 'baokaka', id: 'cry', label: 'cry', frames: 2, when: 'M1', delivered: [d('baokaka.cry', 0, 1)] },
  { char: 'baokaka', id: 'grab', label: 'grab', frames: 1, when: 'M1', delivered: [d('baokaka.hold', 0)] },
  { char: 'baokaka', id: 'eat', label: 'eat', frames: 1, when: 'M1', delivered: [d('baokaka.eat', 0)] },
  { char: 'baokaka', id: 'watchSway', label: 'watch-sway', frames: 2, when: 'M1', delivered: [], fallback: BABY_MODE_ANIM.watching.fallback },
  { char: 'baokaka', id: 'cuddle', label: 'cuddle', frames: 1, when: 'M1', delivered: [d('baokaka.hug', 0)] },
  { char: 'baokaka', id: 'say', label: 'say (mouth open)', frames: 1, when: 'M1', delivered: [d('baokaka.point', 0)] },
  { char: 'baokaka', id: 'rideGiggle', label: 'ride-giggle', frames: 1, when: 'M1', delivered: [], fallback: 'ride-giggle → bounce' },
  { char: 'baokaka', id: 'touchWatch', label: 'touch-watch head turn', frames: 1, when: 'M1', delivered: [], fallback: 'touch-watch → sit + 3° tilt toward the finger' },
  { char: 'baokaka', id: 'carried', label: 'carried', frames: 1, when: 'later', delivered: [], fallback: BABY_MODE_ANIM.carried.fallback },
  { char: 'baokaka', id: 'climb', label: 'climb', frames: 3, when: 'later', delivered: [], fallback: 'climb → crawl' },
  { char: 'baokaka', id: 'standCruise', label: 'stand-cruise', frames: 4, when: 'later', delivered: [d('baokaka.pull', 0), d('baokaka.wobble', 0, 1)] },
  { char: 'baokaka', id: 'walk', label: 'walk (wobbly)', frames: 8, when: 'later', delivered: [d('baokaka.walk', 0, 1, 2, 3, 4, 5, 6, 7)] },
  { char: 'mocha', id: 'sit', label: 'sit', frames: 1, when: 'M1', delivered: [d('mocha.sit', 0)] },
  { char: 'mocha', id: 'loaf', label: 'loaf', frames: 1, when: 'M1', delivered: [d('mocha.loaf', 0)] },
  { char: 'mocha', id: 'hop', label: 'hop', frames: 3, when: 'M1', delivered: [d('mocha.jump', 0, 1, 2)] },
  { char: 'mocha', id: 'land', label: 'land', frames: 1, when: 'M1', delivered: [d('mocha.jump', 2)] },
  { char: 'mocha', id: 'eyeContact', label: 'eye-contact', frames: 1, when: 'M1', delivered: [d('mocha.push', 0)] },
  { char: 'mocha', id: 'push', label: 'push', frames: 2, when: 'M1', delivered: [d('mocha.push', 0, 1)] },
  { char: 'mocha', id: 'glare', label: 'glare', frames: 1, when: 'M1', delivered: [], fallback: MOCHA_STATE_ANIM.glare.fallback },
  { char: 'mocha', id: 'puff', label: 'puff (wet)', frames: 1, when: 'M1', delivered: [d('mocha.puff', 0)] },
  { char: 'mocha', id: 'purr', label: 'purr', frames: 1, when: 'M1', delivered: [], fallback: MOCHA_STATE_ANIM.purr.fallback },
  { char: 'mocha', id: 'inBox', label: 'in-box', frames: 1, when: 'M1', delivered: [], fallback: MOCHA_STATE_ANIM.inBox.fallback },
  { char: 'mocha', id: 'walk', label: 'walk (linked)', frames: 8, when: 'later', delivered: [d('mocha.walk', 0, 1, 2, 3, 4, 5, 6, 7)] },
];

export type FrameStatus = 'ok' | 'missing' | 'later';

/** ✓ when every frame the GDD asks for is delivered; `later` rows are not required for M1. */
export function frameStatus(need: FrameNeed): FrameStatus {
  if (need.when === 'later') return 'later';
  const have = need.delivered.reduce((n, x) => n + x.frames.length, 0);
  return have >= need.frames ? 'ok' : 'missing';
}

// ——— Reading the tick ———

/** The kind of the edge between two nodes (either direction unless one-way), or null. */
export function edgeKind(def: Pick<PageDef, 'edges'>, from: Id, to: Id): EdgeKind | null {
  const e = def.edges.find((x) => (x.a === from && x.b === to) || (!x.oneWay && x.a === to && x.b === from));
  return e?.kind ?? null;
}

/** The event each word emits (GDD § 2.4); 不要！ emits none, it refuses. */
const WORD_EVENT: Readonly<Partial<Record<SimEvent['type'], Word>>> = {
  beep: 'beep',
  wave: 'bye',
  wow: 'wow',
  hug: 'hug',
  sky: 'plane',
  whoosh: 'whoosh',
  together: 'together',
};

/** The word he is saying this tick (`saying` mode): from its event, or 不要！ when his refused set grew. */
export function sayingWord(prev: SimState, state: SimState, events: readonly SimEvent[]): Word | null {
  if (state.baby.mode !== 'saying') return null;
  for (const e of events) {
    const w = WORD_EVENT[e.type];
    if (w !== undefined) return w;
  }
  return state.baby.refused.length > prev.baby.refused.length ? 'no' : null;
}
