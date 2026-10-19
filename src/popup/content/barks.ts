import type { Bark } from '../core/events';

/**
 * Bark bubbles (GDD § 2.2.1, § 2.3, § 2.4, § 5.3), zh-Hant: the automatic flavour lines, shown in a
 * small die-cut bubble beside the speaker's head for a beat, never in the subtitle queue.
 *
 * Baokaka's barks are his vocabulary (§ 5.1): the ones the engine emits as `bark` events
 * (`core/events.ts` `Bark`: on choosing a target, and 「要！要！」 every 4 ticks while reaching),
 * plus 好吃！ (eating), 哇—— (starting to cry), and 這個！ / ㄅㄚ！ for pages' own lines. Mocha's are
 * his cat lines (§ 2.3): arrival, the stare before a push, an unreachable perch, water, cuddled.
 */

/** Every bark Baokaka has (the engine's `Bark` ids and the view's own). */
export type BabyBark = Bark | 'yum' | 'cry' | 'this' | 'papa';
export type MochaBark = 'arrive' | 'stare' | 'nope' | 'puff' | 'purr';

export const BABY_BARKS: Readonly<Record<BabyBark, string>> = {
  want: '要！',
  wantWant: '要！要！',
  meow: '喵喵！',
  milk: 'ㄋㄟㄋㄟ',
  pretty: '好看！',
  yum: '好吃！',
  cry: '哇——',
  this: '這個！',
  papa: 'ㄅㄚ！',
};

export const MOCHA_BARKS: Readonly<Record<MochaBark, string>> = {
  arrive: '喵。',
  stare: '……',
  nope: '喵？',
  puff: '不要。',
  purr: '呼嚕嚕……',
};
