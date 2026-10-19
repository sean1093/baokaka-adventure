import { CHAPTERS } from '../content/chapters';
import type { SimEvent } from '../core/events';
import { matchPredicate } from '../core/step';
import type { Input, PageDef, SimState } from '../core/types';
import { registry as gameRegistry, type PageRegistry } from '../pages';
import type { PageResult, SaveV1, Sticker } from './progress';

/**
 * Page stickers (GDD § 2.8; #101): 解開 for completing the page, 淘氣 for its optional mischief, 土地公
 * for tapping the hidden 阿伯. The pure half of the sticker flow; `PagePlayer` and `GameShell` run it.
 *
 * - **淘氣** is matched by the game layer against the tick's events (§ 3.3 phase 7): the page's
 *   `mischief.when` predicate, counted by the tick in `counters` with its `count`, holds after a
 *   tick and did not before (`mischiefFired`). It is awarded at once, even when the page is never
 *   finished, and saved at once (`ProgressStore.earnSticker`).
 * - **土地公** is a tap on him while his `visibleWhen` holds (`view/gestures.ts` emits the gesture
 *   event `tudigong`); also saved at once.
 * - **An attempt** (one run of a page, until 重來 or leaving it) remembers what it earned and the
 *   moves it took (`Attempt`), and the completion passes them on to `completePage` (the best move
 *   count, `bestPar`). The save keeps a sticker once earned: nothing — a hint, a replay, a 重來 —
 *   ever takes one away (§ 2.8 "kept forever"; `progress.ts` only ever sets them).
 * - **Rewards** (§ 2.8): every 土地公 of the game unlocks the bonus page 「象山的日出」, every 淘氣
 *   the album's 「淘氣大王」 cover. They are read off the save (`rewardFlags`), not stored (D-64).
 */

/** Whether the page's 淘氣 predicate came true on this tick: it holds now and did not before. */
export function mischiefFired(def: PageDef, prev: SimState, state: SimState, events: readonly SimEvent[]): boolean {
  const pred = def.mischief.when;
  return matchPredicate(events, pred, state.counters) && !matchPredicate([], pred, prev.counters);
}

/** A move (§ 3.7 par): an input that is not a wait. */
export const isMove = (input: Input): boolean => input.t !== 'none';

/** What one attempt at a page earned, and how many moves it took. */
export interface Attempt {
  readonly mischief: boolean;
  readonly tudigong: boolean;
  readonly moves: number;
}

export const FRESH_ATTEMPT: Attempt = { mischief: false, tudigong: false, moves: 0 };

/** The attempt with a sticker earned (the same object when it already had it). */
export function earnInAttempt(attempt: Attempt, sticker: Sticker): Attempt {
  return attempt[sticker] ? attempt : { ...attempt, [sticker]: true };
}

/** What `completePage` records for the attempt (§ 2.8, D-55). */
export function attemptResult(attempt: Attempt): PageResult {
  return { mischief: attempt.mischief, tudigong: attempt.tudigong, moves: attempt.moves };
}

/** The pages of the whole game (§ 4.2: the prologue's 4, 6 per chapter, and page E): 65. */
export const GAME_PAGES = CHAPTERS.reduce((n, c) => n + c.pages, 0) + 1;

/** The § 2.8 rewards, read off the save. */
export interface RewardFlags {
  /** Every 土地公 found: the bonus page 「象山的日出」 is open */
  readonly bonusPage: boolean;
  /** Every 淘氣 done: the album's 「淘氣大王」 cover */
  readonly mischiefCover: boolean;
  readonly tudigong: number;
  readonly mischief: number;
  /** Out of */
  readonly total: number;
}

/**
 * The rewards: a sticker counts on a registered page only, and a reward needs one on every page of
 * the game (`total`, 65; tests pass a smaller book) — so a half-built registry never unlocks them.
 */
export function rewardFlags(save: SaveV1, reg: PageRegistry = gameRegistry, total: number = GAME_PAGES): RewardFlags {
  let tudigong = 0;
  let mischief = 0;
  for (const def of reg.pages) {
    const r = save.pages[def.id];
    if (r?.tudigong) tudigong++;
    if (r?.mischief) mischief++;
  }
  const full = reg.pages.length >= total;
  return { bonusPage: full && tudigong >= total, mischiefCover: full && mischief >= total, tudigong, mischief, total };
}
