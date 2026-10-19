import type { Growth, LineKey, Word } from '../core/types';

/**
 * Baokaka's words and growth stages as the screens name them (GDD § 2.4, § 2.5, § 5.4), zh-Hant:
 * each word's label (the word ring's discs, the big speech bubble), and every learn beat — the
 * source line, Baokaka's word, Mocha's translation (and its follow-up) and the word card (big word
 * plus a short effect text, ≤ 14 characters in all). The lines themselves live in `script.ts`
 * (`learn.*` keys); this file strings them together. Data for all 11 entries of § 5.4, so a later
 * chapter's learn page only sets its `learns` (#99).
 */

/** A growth stage as a learn beat names it (GDD § 2.5: 1 爬樓梯, 2 扶著站, 3 第一步). */
export type GrowthKey = 'climb' | 'cruise' | 'walk';
/** What a learn beat teaches: a word, or a growth stage. */
export type LearnKey = Word | GrowthKey;

export const GROWTH_KEY: Readonly<Record<Exclude<Growth, 0>, GrowthKey>> = { 1: 'climb', 2: 'cruise', 3: 'walk' };

/** Each word as Baokaka says it (§ 2.4 schedule; § 5.1 vocabulary). */
export const WORD_LABEL: Readonly<Record<Word, string>> = {
  beep: '嗶！',
  bye: '掰掰',
  no: '不要！',
  wow: '哇！',
  hug: '抱抱',
  plane: '飛機！',
  whoosh: '咻——',
  together: '一起',
};

export interface LearnBeat {
  /** The big word on the card */
  readonly title: string;
  /** The card's short effect text (`title：effect` ≤ 14 characters), or null (第一步！ alone) */
  readonly effect: string | null;
  /** The source's line (null when the source makes no sound: the neon, the plane, the farmer) */
  readonly source: LineKey | null;
  /** Baokaka's word (null for a growth stage: he grunts or just stands, a star bubble) */
  readonly baby: LineKey | null;
  /** Mocha's translation joke (null for 第一步: its page has its own lines) */
  readonly mocha: LineKey | null;
  /** Mocha's follow-up the first time the word works on its learn page (嗶！: 「……閘門真的開了。」) */
  readonly then: LineKey | null;
}

const beat = (title: string, effect: string | null, key: LearnKey, has: { source?: boolean; baby?: boolean; mocha?: boolean; then?: boolean }): LearnBeat => ({
  title,
  effect,
  source: has.source ? `learn.${key}.src` : null,
  baby: has.baby ? `learn.${key}.baby` : null,
  mocha: has.mocha === false ? null : `learn.${key}.mocha`,
  then: has.then ? `learn.${key}.then` : null,
});

/** GDD § 5.4, in its order. */
export const LEARN_BEATS: Readonly<Record<LearnKey, LearnBeat>> = {
  beep: beat('嗶！', '閘門開開', 'beep', { source: true, baby: true, then: true }),
  bye: beat('掰掰', '請讓一讓', 'bye', { source: true, baby: true }),
  no: beat('不要！', '換一個想要的', 'no', { source: true, baby: true }),
  wow: beat('哇！', '燈亮起來', 'wow', { baby: true }),
  hug: beat('抱抱', '大人載你走', 'hug', { source: true, baby: true }),
  plane: beat('飛機！', '鳥都飛起來', 'plane', { baby: true }),
  climb: beat('爬樓梯', '爬上一階', 'climb', {}),
  whoosh: beat('咻——', '吹動輕的東西', 'whoosh', { source: true, baby: true }),
  cruise: beat('扶著站', '搆到高的地方', 'cruise', {}),
  together: beat('一起', '摩卡帶你走', 'together', { baby: true }),
  walk: beat('第一步！', null, 'walk', { mocha: false }),
};

/** The word card's one line, as § 5.4 prints it (e.g. 「嗶！：閘門開開」). */
export const cardLine = (b: LearnBeat): string => (b.effect === null ? b.title : `${b.title}：${b.effect}`);

/** The learn beat's lines in order: source → Baokaka → Mocha (the word card follows them). */
export const learnLineKeys = (b: LearnBeat): LineKey[] => [b.source, b.baby, b.mocha].filter((k): k is LineKey => k !== null);
