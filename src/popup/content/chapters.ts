/**
 * The chapters as the screens name them (GDD § 4.2, § 4.3, § 5.2): the 目錄's stations, the HUD's
 * landmark and the chapter turn's card. zh-Hant, copied from the GDD. Page titles are listed for the
 * chapters whose pages are specified in full (§ 4.3: the prologue and chapter 1); the registry
 * (`pages/`) is still the truth for what is playable.
 */

export interface ChapterInfo {
  /** 0 = the prologue, 1–10 = the chapters */
  readonly chapter: number;
  /** The chapter's title (§ 4.2 headings, § 5.2 cards) */
  readonly title: string;
  /** The landmark, as the HUD and the chapter card print it (§ 4.2) */
  readonly landmark: string;
  /** The station's name on the 月亮線 map (short enough for 20 px under a station) */
  readonly station: string;
  /** The card time, `HH:MM` (§ 4.2) */
  readonly time: string;
  /** Pages in the chapter: 4 in the prologue, 6 in every chapter (§ 4.2) */
  readonly pages: number;
  /** Page titles in page order, where § 4.3 specifies them */
  readonly pageTitles?: readonly string[];
}

export const CHAPTERS: readonly ChapterInfo[] = [
  { chapter: 0, title: '度晬前一晚', landmark: '家', station: '家', time: '00:00', pages: 4, pageTitles: ['嬰兒床', '沙發山', '摩卡起床', '窗外的月亮線'] },
  { chapter: 1, title: '便當的味道', landmark: '台北車站', station: '台北車站', time: '00:20', pages: 6, pageTitles: ['月亮線，出發！', '月台的縫', '嗶！閘門', '大廳的棋盤', '便當店的電梯', '台鐵便當'] },
  { chapter: 2, title: '會揮手的公園', landmark: '大安森林公園', station: '大安森林', time: '00:50', pages: 6 },
  { chapter: 3, title: '醉月湖的鵝', landmark: '台灣大學', station: '台大', time: '01:20', pages: 6 },
  { chapter: 4, title: '霓虹燈睡著了', landmark: '西門町', station: '西門町', time: '01:50', pages: 6 },
  { chapter: 5, title: '夜市抱抱', landmark: '士林夜市', station: '士林', time: '02:20', pages: 6 },
  { chapter: 6, title: '飛機睡著的時候', landmark: '松山機場', station: '松山機場', time: '02:50', pages: 6 },
  { chapter: 7, title: '纜車上的月亮', landmark: '貓空', station: '貓空', time: '03:30', pages: 6 },
  { chapter: 8, title: '熱呼呼的煙', landmark: '北投', station: '北投', time: '04:00', pages: 6 },
  { chapter: 9, title: '河的盡頭是海', landmark: '淡水', station: '淡水', time: '04:40', pages: 6 },
  { chapter: 10, title: '離天空最近的地方', landmark: '台北101', station: '101', time: '05:10', pages: 6 },
];

/** A chapter's info (the prologue's for an unknown chapter). */
export function chapterInfo(chapter: number): ChapterInfo {
  return CHAPTERS.find((c) => c.chapter === chapter) ?? CHAPTERS[0];
}

/** Chinese numerals for chapter names (第一章 …). */
const NUMERALS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/** 「序章」, 「第一章」 … 「第十章」 */
export function chapterName(chapter: number): string {
  return chapter === 0 ? '序章' : `第${NUMERALS[chapter] ?? chapter}章`;
}

/** The HUD's chapter line, e.g. 「第一章 · 第 2 頁 / 6」 (the prologue is 序章, 4 pages). */
export function chapterLine(chapter: number, index: number): string {
  return `${chapterName(chapter)} · 第 ${index} 頁 / ${chapterInfo(chapter).pages}`;
}

/** Stickers a chapter holds: three per page (解開, 淘氣, 土地公; § 2.8). 18 for a chapter, 12 for the prologue. */
export const stickersIn = (chapter: number): number => chapterInfo(chapter).pages * 3;
