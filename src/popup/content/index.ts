/**
 * `src/popup/content/`: all in-game text, zh-Hant, copied from GDD § 5 (≤ 30 characters a line).
 * `script.ts` (LineKey → zh-Hant; empty until #102), `chapters.ts` (chapter titles, landmarks,
 * stations and page titles, § 4.2–4.3; #97) and `ui.ts` (the UI strings, § 5.7; #97); planned:
 * `album.ts` (album comment tables) and `words.ts` (word labels and icons). Pages and the view refer
 * to text by key, never by literal.
 */
export { SCRIPT } from './script';
export { CHAPTERS, chapterInfo, chapterLine, chapterName, stickersIn, type ChapterInfo } from './chapters';
export { UI } from './ui';
