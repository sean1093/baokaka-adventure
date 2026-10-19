/**
 * `src/popup/content/`: all in-game text, zh-Hant, copied from GDD § 5 (≤ 30 characters a line).
 * `script.ts` (LineKey → { who, text }, the § 5.1 speaker table and the line loader; #98, filled by
 * #102), `barks.ts` (the bark bubbles' lines; #98), `chapters.ts` (chapter titles, landmarks,
 * stations and page titles, § 4.2–4.3; #97), `ui.ts` (the UI strings, § 5.7; #97) and `words.ts`
 * (word labels, learn beats and word cards, § 2.4 / § 5.4; #99; the icons are art, in
 * `view/words/icons.ts`), `hints.ts` (the hint lines, § 2.7 / § 5.3; #100); planned: `album.ts` (album comment tables). Pages and the view refer
 * to text by key, never by literal.
 */
export { SCRIPT, SPEAKERS, loadLine, loadLines, type ScriptLine, type Speaker, type SpeakerAnchor, type TalkLine } from './script';
export { BABY_BARKS, MOCHA_BARKS, type BabyBark, type MochaBark } from './barks';
export { CHAPTERS, chapterInfo, chapterLine, chapterName, stickersIn, type ChapterInfo } from './chapters';
export { UI } from './ui';
export { HINT_LINES, HINT_LINE_MAX, type HintLineKey } from './hints';
export { GROWTH_KEY, LEARN_BEATS, WORD_LABEL, cardLine, learnLineKeys, type GrowthKey, type LearnBeat, type LearnKey } from './words';
