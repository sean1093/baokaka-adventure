import { GROWTH_KEY, LEARN_BEATS, learnLineKeys, type LearnKey } from '../content/words';
import type { SimEvent } from '../core/events';
import { learned } from '../core/step';
import type { BabyMode, LineKey, PageDef, SimState, Word } from '../core/types';
import { WORDS, wordAvailable } from '../core/words';

/**
 * Words on the page (GDD § 2.4, § 5.4, § 6 risk 1; #99): what the word ring offers, the learn beat,
 * the one-time Mocha translation per word per page, and the first-use tutorial. Pure; `PagePlayer`
 * holds the state and `view/words/` draws it.
 */

/** § 2.4 / § 6 risk 10: the ring shows at most eight words. */
export const MAX_RING_WORDS = 8;

/**
 * The words the ring offers now: exactly what `core/step` would accept as a `say` — the page's
 * `words` (by default those learned on earlier pages; a replayed earlier page hides words learned
 * later, § 2.10, #93) plus its own `learns` word once it has been learned — in the § 2.4 schedule
 * order (the order they are learned). Empty: tapping Baokaka shows 「要！」 instead (§ 6 risk 1).
 */
export function ringWords(def: PageDef, state: SimState): Word[] {
  const done = learned(state);
  return WORDS.filter((w) => wordAvailable(def, w, done)).slice(0, MAX_RING_WORDS);
}

/** What this tick's `learn` event taught (a word, else a growth stage), or null. */
export function learnedNow(events: readonly SimEvent[]): LearnKey | null {
  const ev = events.find((e) => e.type === 'learn');
  if (ev === undefined) return null;
  if (ev.word !== undefined) return ev.word;
  return ev.growth !== undefined && ev.growth > 0 ? GROWTH_KEY[ev.growth as 1 | 2 | 3] : null;
}

/** The learn beat's lines (source → Baokaka → Mocha); the word card comes after them. */
export const learnLines = (key: LearnKey): LineKey[] => learnLineKeys(LEARN_BEATS[key]);

/**
 * The Mocha translation shown the first time a word is said on a page (§ 2.4: one-time, per word
 * per page). On its learn page the translation was just part of the learn beat, so it is the
 * follow-up there when there is one (嗶！: 「……閘門真的開了。」), else nothing; on any other page,
 * the translation itself.
 */
export function firstUseLine(def: PageDef, word: Word): LineKey | null {
  const b = LEARN_BEATS[word];
  return def.learns?.word === word ? b.then : b.mocha;
}

/**
 * The word whose first-use tutorial this page runs (§ 2.4, GDD 1-3 notes): its `learns` word when
 * it is the player's first word (no other word available on the page). 1-3 and 嗶！ in the game.
 */
export function tutorialWord(def: PageDef): Word | null {
  const word = def.learns?.word;
  if (word === undefined) return null;
  return (def.words ?? []).some((w) => w !== word) ? null : word;
}

/** Modes in which he is stuck and waits for help: the tutorial's ghost hand points at him then. */
const STUCK: ReadonlySet<BabyMode> = new Set(['reaching', 'looking', 'crying']);

export interface TutorialInput {
  /** `tutorialWord(def)` */
  readonly word: Word | null;
  readonly state: SimState;
  /** The word has been said on this page */
  readonly used: boolean;
  /** The learn beat (its lines or its card) is still on the page */
  readonly busy: boolean;
  readonly ringOpen: boolean;
}

export interface TutorialShow {
  /** The bottom bar's portrait glows */
  readonly portrait: boolean;
  /** The ghost hand taps Baokaka (hint L2 on his target) */
  readonly baby: boolean;
  /** The ghost hand taps this word's disc in the open ring */
  readonly disc: Word | null;
}

export const NO_TUTORIAL: TutorialShow = { portrait: false, baby: false, disc: null };

/**
 * The first-use tutorial (§ 2.4; GDD 1-3: "Baokaka's portrait glows, a ghost hand taps him, then
 * 嗶！"). After the learn beat and until the word is first said: the portrait glows; once he is
 * stuck (reaching, looking, crying) the ghost hand taps him; with the ring open it taps the word.
 */
export function tutorialShow({ word, state, used, busy, ringOpen }: TutorialInput): TutorialShow {
  if (word === null || used || busy || state.done || !learned(state)) return NO_TUTORIAL;
  if (ringOpen) return { portrait: false, baby: false, disc: word };
  return { portrait: true, baby: STUCK.has(state.baby.mode), disc: null };
}

/**
 * Each word's sound motif (§ 2.12, § 6 risk 10: "each word has a distinct sound motif"), as
 * semitone steps above the music box's root, for the audio layer (#105) to play when the word is
 * said (`PagePlayer` `onSay`).
 */
export const WORD_MOTIF: Readonly<Record<Word, readonly number[]>> = {
  beep: [24, 24],
  bye: [12, 7],
  no: [5, 0],
  wow: [7, 12, 19],
  hug: [4, 7, 12],
  plane: [12, 14, 16, 19],
  whoosh: [19, 12, 7],
  together: [0, 4, 7, 12],
};
