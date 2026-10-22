/**
 * `src/popup/content/`: all in-game text, zh-Hant, copied from GDD § 5 (≤ 30 characters a line).
 * `script.ts` (LineKey → { who, text }, the § 5.1 speaker table and the line loader; #98, filled by
 * #102), `barks.ts` (the bark bubbles' lines; #98), `chapters.ts` (chapter titles, landmarks,
 * stations and page titles, § 4.2–4.3; #97), `ui.ts` (the UI strings, § 5.7; #97) and `words.ts`
 * (word labels, learn beats and word cards, § 2.4 / § 5.4; #99; the icons are art, in
 * `view/words/icons.ts`), `hints.ts` (the hint lines, § 2.7 / § 5.3; #100), `album.ts` (the treasures, words and § 5.6 notes of the album; #103). Pages and the view refer
 * to text by key, never by literal.
 */
export { SCRIPT, SPEAKERS, loadLine, loadLines, type ScriptLine, type Speaker, type SpeakerAnchor, type TalkLine } from './script';
export { BABY_BARKS, MOCHA_BARKS, type BabyBark, type MochaBark } from './barks';
export { BONUS_CHAPTER, CHAPTERS, ENDING_CHAPTER, EXTRA_CHAPTERS, SOON_LINES, cardLines, chapterInfo, chapterLine, chapterName, endGroups, endLines, hasNextChapter, stickersIn, type ChapterInfo } from './chapters';
export { UI } from './ui';
export { HINT_LINES, HINT_LINE_MAX, type HintLineKey } from './hints';
export { GROWTH_KEY, LEARN_BEATS, WORD_LABEL, cardLine, learnLineKeys, type GrowthKey, type LearnBeat, type LearnKey } from './words';
export { ALBUM_CHAPTERS, CHAPTER_NOTES, ENDING_LEAF_CHAPTER, ENDING_NOTES, NOTE_NAME, NOTE_POOL, NOTE_SPEAKERS, albumChapter, type AlbumChapter, type ChapterNotes, type NoteSpeaker } from './album';
export { CAMEO_ROLE, CREDITS, CREDITS_DEDICATION, CREDITS_TITLE, DAWN_BEATS, POST_BEATS, type Credit } from './credits';
