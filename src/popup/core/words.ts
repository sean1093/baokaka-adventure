import { EVENT_RADIUS, type SimEvent } from './events';
import { nodePos, type Point } from './graph';
import type { EventType, PageDef, SimState, Word } from './types';

/**
 * Words: the ability system (GDD § 2.4, *Schedule and exact effects*). Saying a word puts Baokaka
 * in `saying` for one tick (§ 3.3 phase 1); at the end of that tick (phase 5) its event goes into
 * a mini-cascade from his position with the word's radius, and parts and creatures react. Decisions
 * in D-45.
 *
 * | Word | Event | Radius | Effect (reactions are page data unless noted) |
 * |---|---|---|---|
 * | 嗶！ `beep` | `beep` | 120 | parts with a `beep` reaction (gates open, readers, robots) |
 * | 掰掰 `bye` | `wave` | 160 | creatures with a `wave` reaction move (to `away`, or back) and `drop` what they hold |
 * | 不要！ `no` | — | — | his current target joins `baby.refused` (no event) |
 * | 哇！ `wow` | `wow` | 160 | lights with a `wow` reaction switch (`toggle`: on, and off again) |
 * | 抱抱 `hug` | `hug` | 1 edge | **stub**: the event only; the carrier rule is #120 |
 * | 飛機！ `plane` | `sky` | whole page | built in: `winged` creatures toggle ground ↔ sky (`creatures.ts`); parts with a `sky` reaction |
 * | 咻—— `whoosh` | `whoosh` | 140, 90° cone in his facing | built in: `blowable` parts in the cone advance one state; any `whoosh` reaction |
 * | 一起 `together` | `together` | — | **stub**: the event only; linked mode is #128 |
 *
 * "Within reach" is a straight line from Baokaka's node (`inReach`); the cone is exact integer
 * math (|dy| ≤ dx in his facing direction, so its edges at ±45° are inside).
 */

/** The event each word emits (`null`: 不要！ acts on Baokaka himself). */
export const WORD_EVENT: Readonly<Record<Word, EventType | null>> = {
  beep: 'beep',
  bye: 'wave',
  no: null,
  wow: 'wow',
  hug: 'hug',
  plane: 'sky',
  whoosh: 'whoosh',
  together: 'together',
};

/** Every word, in the order of GDD § 2.4's schedule table (the solver tries them in this order). */
export const WORDS: readonly Word[] = ['beep', 'bye', 'no', 'wow', 'hug', 'plane', 'whoosh', 'together'];

/** 咻——'s cone: 90° in total, centred on his facing (GDD § 2.4). */
export const WHOOSH_CONE_DEGREES = 90;

/**
 * Whether `event` reaches `point`: within `within` (default: the event's own radius; none = the
 * whole page) of the event's origin, and inside its cone when it has a facing (咻——). A point
 * that isn't on the page (an off-page creature) is reached only by whole-page events, and an event
 * without an origin only by whole-page radii.
 */
export function inReach(event: SimEvent, point: Point | undefined, within: number | undefined = event.within): boolean {
  const radius = within ?? Infinity;
  if (radius === Infinity) return true;
  if (event.at === undefined || point === undefined) return false;
  const dx = point[0] - event.at[0];
  const dy = point[1] - event.at[1];
  if (dx * dx + dy * dy > radius * radius) return false;
  if (event.facing === undefined) return true;
  const ahead = event.facing === 'r' ? dx : -dx;
  return Math.abs(dy) <= ahead;
}

/**
 * Whether Baokaka may say `word` on this page: every word unless the page restricts them
 * (`words`), plus the page's own `learns` word once it has been learned (`learned`).
 */
export function wordAvailable(def: PageDef, word: Word, learned: boolean): boolean {
  if (def.words === undefined) return true;
  return def.words.includes(word) || (learned && def.learns?.word === word);
}

/**
 * The event `word` emits from where Baokaka is (§ 3.3 phase 5), or null for 不要！. Radii come
 * from `EVENT_RADIUS`; 咻—— carries his facing for its cone. 抱抱 and 一起 emit their bare event
 * for now (no radius).
 */
export function wordEvent(def: PageDef, state: SimState, word: Word): SimEvent | null {
  const type = WORD_EVENT[word];
  if (type === null) return null;
  const at = nodePos(def, state, state.baby.node);
  const event: SimEvent = { type, id: state.baby.node };
  if (at !== undefined) event.at = at;
  // TODO(#120): 抱抱 reaches one edge (an adjacent idle carrier picks him up); TODO(#128): 一起 enters linked mode.
  if (type === 'hug' || type === 'together') return event;
  event.within = EVENT_RADIUS[type];
  if (type === 'whoosh') event.facing = state.baby.facing;
  return event;
}

/**
 * 不要！ (§ 2.4): his current target joins `refused`. With no target (looking, crying) nothing
 * happens. He re-targets on the next tick (the say tick itself is `saying`, D-45).
 */
export function sayNo(state: SimState): SimState {
  const { target, refused } = state.baby;
  if (target === null || refused.includes(target)) return state;
  return { ...state, baby: { ...state.baby, refused: [...refused, target] } };
}
