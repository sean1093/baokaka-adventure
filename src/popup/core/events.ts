import type { EventType, Growth, Id, Word } from './types';

/**
 * Events the simulation emits (GDD § 3.2 `EventType`, § 3.3), and the single list of their names:
 * PageLab's event log and the audio map import `EVENT_TYPES` / `UI_EVENT_TYPES` from here. The
 * tick (`step.ts`) logs every event in order; the cascade reacts to the § 3.2 ones (`isSimEvent`);
 * the game layer listens to all of them (barks, sounds, mischief, learning). Decisions in D-43,
 * D-44 and D-45.
 */

/** Every § 3.2 `EventType`, in the GDD's order. Reactions and mischief predicates name these. */
export const EVENT_TYPES = [
  'beep',
  'wave',
  'wow',
  'hug',
  'sky',
  'whoosh',
  'together',
  'cry',
  'catArrive',
  'catLeave',
  'push',
  'land',
  'babyEnter',
  'ride',
  'grab',
  'eat',
  'partEnter',
] as const satisfies readonly EventType[];

// Compile-time check that EVENT_TYPES lists every EventType (and nothing else).
type Missing = Exclude<EventType, (typeof EVENT_TYPES)[number]>;
const _complete: Missing extends never ? true : never = true;
void _complete;

/**
 * Events with no simulation effect; only the view, audio and game layer react to them:
 * - `bark`: one of Baokaka's flavour lines (`bark`, D-43).
 * - `mochaNope`: a tapped perch Mocha can't get to — no path, glass (C8), `blockedWhen`, or not a
 *   perch at all (C1). He looks at it, flicks his tail, 「喵？」; the marker wiggles (D-44).
 * - `mochaPuff`: a tapped perch that is wet or steamy (C7). His fur puffs up: 「不要。」
 * - `mochaStare`: the eye-contact beat before a push (C3), with a slow 「……」. `id` = the pushable.
 * - `jam`: a `set` or tap toward a stop whose `stateWhen` doesn't hold (§ 3.3 phase 1). The part
 *   (`id`) stops at `state`, the furthest allowed stop, and does its "jammed" wobble.
 * - `locked`: a `set` or tap on a locked part (`lockedWhen`, or Mocha sitting on a `lockedByCat`
 *   part: he glares, § 2.6). Nothing moves.
 * - `learn`: the page's `learns` fired (§ 3.2): `word` and/or `growth` is learned (the game layer
 *   plays the learn lines and saves it). Emitted once per page.
 * - `hugNobody`: 抱抱 with no carrier in reach (§ 2.4, #120): he raises his arms, and Mocha purrs.
 */
export const UI_EVENT_TYPES = ['bark', 'mochaNope', 'mochaPuff', 'mochaStare', 'jam', 'locked', 'learn', 'hugNobody'] as const;
export type UiEventType = (typeof UI_EVENT_TYPES)[number];

const SIM_EVENT_SET: ReadonlySet<string> = new Set(EVENT_TYPES);

/** True for the § 3.2 events the cascade reacts to (false for UI events). */
export function isSimEvent(type: EventType | UiEventType): type is EventType {
  return SIM_EVENT_SET.has(type);
}

/**
 * Default radius of each event with one, in page units from its origin (GDD § 2.4 words table,
 * § 2.2.5 crying). `Infinity` = the whole page (飛機！). A reaction's own `within` replaces it;
 * events without a radius reach every listener.
 */
export const EVENT_RADIUS: Readonly<Partial<Record<EventType, number>>> = {
  beep: 120,
  wave: 160,
  wow: 160,
  sky: Infinity,
  whoosh: 140,
  cry: 220,
};

/**
 * Baokaka's automatic flavour lines (GDD § 2.2.1, § 2.2.3). The zh-Hant text lives with all the
 * game's text, in `content/barks.ts` (`BABY_BARKS`).
 */
export type Bark = 'want' | 'meow' | 'milk' | 'pretty' | 'wantWant';

export interface SimEvent {
  type: EventType | UiEventType;
  /** The node, attractor, part, perch or creature the event is about. */
  id?: Id;
  /** Origin in page units, for events with a radius (words, `cry`, a part's `emit`). */
  at?: readonly [number, number];
  /** Radius in page units, measured from `at`. */
  within?: number;
  /** For `whoosh`: the 90° cone opens this way from `at` (GDD § 2.4). */
  facing?: 'l' | 'r';
  /** For `bark`. */
  bark?: Bark;
  /**
   * For `partEnter`: the state the part (`id`) entered — or entered again, for a re-press (D-44).
   * For `jam`: the stop the part jammed at.
   */
  state?: string;
  /** For `learn`. */
  word?: Word;
  /** For `learn`. */
  growth?: Growth;
}
