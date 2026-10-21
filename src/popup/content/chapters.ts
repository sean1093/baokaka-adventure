import type { LineKey } from '../core/types';

/**
 * The chapters as the screens name them (GDD § 4.2, § 4.3, § 5.2): the 目錄's stations, the HUD's
 * landmark and the chapter card (its board and its lines). zh-Hant, copied from the GDD. Page titles are listed for the
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
  /** The card time, `HH:MM` (§ 4.2); atmosphere only, never a timer */
  readonly time: string;
  /** The chapter card's split-flap row, 「下一站 ○○」 (§ 5.2, ≤ 8 characters) */
  readonly next: string;
  /** Pages in the chapter: 4 in the prologue, 6 in every chapter (§ 4.2) */
  readonly pages: number;
  /** Page titles in page order, where § 4.3 specifies them */
  readonly pageTitles?: readonly string[];
}

export const CHAPTERS: readonly ChapterInfo[] = [
  { chapter: 0, title: '度晬前一晚', landmark: '家', station: '家', time: '00:00', next: '家', pages: 4, pageTitles: ['嬰兒床', '沙發山', '摩卡起床', '窗外的月亮線'] },
  { chapter: 1, title: '便當的味道', landmark: '台北車站', station: '台北車站', time: '00:20', next: '台北車站', pages: 6, pageTitles: ['月亮線，出發！', '月台的縫', '嗶！閘門', '大廳的棋盤', '便當店的電梯', '台鐵便當'] },
  { chapter: 2, title: '會揮手的公園', landmark: '大安森林公園', station: '大安森林', time: '00:50', next: '大安森林公園', pages: 6, pageTitles: ['信義線', '露天音樂台', '跑步的阿姨', '松鼠的樹', '生態池', '畫畫的阿伯'] },
  { chapter: 3, title: '醉月湖的鵝', landmark: '台灣大學', station: '台大', time: '01:20', next: '公館', pages: 6, pageTitles: ['綠線', '椰林大道', '醉月湖', '傅鐘', '總圖書館', '藍教授的書'] },
  { chapter: 4, title: '霓虹燈睡著了', landmark: '西門町', station: '西門町', time: '01:50', next: '西門', pages: 6, pageTitles: ['板南線往西門', '紅樓', '霓虹燈睡著了', '夾娃娃機', '街頭藝人', '走音天王'] },
  { chapter: 5, title: '夜市抱抱', landmark: '士林夜市', station: '士林', time: '02:20', next: '劍潭', pages: 6, pageTitles: ['往劍潭', '射氣球攤', '抱抱', '彈珠台', '按摩椅', '蔥抓餅'] },
  { chapter: 6, title: '飛機睡著的時候', landmark: '松山機場', station: '松山機場', time: '02:50', next: '松山機場', pages: 6, pageTitles: ['文湖線前窗', '行李轉盤', '看飛機', '空橋', '塔台', '海關的印章'] },
  { chapter: 7, title: '纜車上的月亮', landmark: '貓空', station: '貓空', time: '03:30', next: '動物園', pages: 6, pageTitles: ['往動物園', '纜車站', '茶園階梯', '水晶車廂', '大茶壺', '菜園的芹菜'] },
  { chapter: 8, title: '熱呼呼的煙', landmark: '北投', station: '北投', time: '04:00', next: '新北投', pages: 6, pageTitles: ['新北投支線', '地熱谷', '呼呼', '北投圖書館', '大浴池', '澡堂的算盤'] },
  { chapter: 9, title: '河的盡頭是海', landmark: '淡水', station: '淡水', time: '04:40', next: '淡水', pages: 6, pageTitles: ['往淡水', '淡水老街', '渡輪', '漁人碼頭', '淡江大橋', '碼頭的聽診器'] },
  { chapter: 10, title: '離天空最近的地方', landmark: '台北101', station: '101', time: '05:10', next: '台北101', pages: 6 },
];

/**
 * The lines the chapter card plays under the board, tap by tap (GDD § 5.2: "the lines below play
 * over the card or the first page"). The prologue's card plays its first five lines (the eve of
 * the birthday, 阿嬤, Mocha falls asleep); page 0-1 opens on the rest (midnight, the little cloud,
 * the book blown open: `lines.intro`). Chapter 1's four lines all play on the card. Chapters 2–10
 * add theirs with their content issues (D-65).
 */
const CARD_LINES: Readonly<Record<number, readonly LineKey[]>> = {
  0: ['p.intro.1', 'p.intro.2', 'p.intro.3', 'p.intro.4', 'p.intro.5'],
  1: ['c1.intro.1', 'c1.intro.2', 'c1.intro.3', 'c1.intro.4'],
  2: ['c2.intro.1', 'c2.intro.2', 'c2.intro.3'],
  3: ['c3.intro.1', 'c3.intro.2', 'c3.intro.3'],
  4: ['c4.intro.1', 'c4.intro.2', 'c4.intro.3'],
  5: ['c5.intro.1', 'c5.intro.2', 'c5.intro.3'],
  6: ['c6.intro.1', 'c6.intro.2', 'c6.intro.3'],
  7: ['c7.intro.1', 'c7.intro.2', 'c7.intro.3'],
  8: ['c8.intro.1', 'c8.intro.2', 'c8.intro.3'],
  9: ['c9.intro.1', 'c9.intro.2', 'c9.intro.3'],
};

/** The chapter card's lines (none for a chapter not written yet). */
export const cardLines = (chapter: number): readonly LineKey[] => CARD_LINES[chapter] ?? [];

/**
 * The chapter-end lines (GDD § 4.3 1-6 notes, § 5.2 「N-6 end」; #107): they play after the album,
 * over the finished spread, a tap a beat; then the 抓周 tray's slot fills and the next chapter's card
 * comes. Chapters 2–10 add theirs with their content issues.
 */
const END_LINES: Readonly<Record<number, readonly LineKey[]>> = {
  1: ['c1p6.end.1', 'c1p6.end.2', 'c1p6.end.3', 'c1p6.end.4'],
  2: ['c2p6.end.1', 'c2p6.end.2'],
  3: ['c3p6.end.1'],
  4: ['c4p6.end.1'],
  5: ['c5p6.end.1', 'c5p6.end.2'],
  6: ['c6p6.end.1'],
  7: ['c7p6.end.1'],
  8: ['c8p6.end.1'],
  9: ['c9p6.end.1'],
};

/** A chapter's end lines (none for a chapter not written yet). */
export const endLines = (chapter: number): readonly LineKey[] => END_LINES[chapter] ?? [];

/**
 * The lines under the next chapter's card while that chapter isn't built yet (#107, D-70): the card
 * shows the next chapter with 「未完待續」 on its split-flap row, and this line plays under it.
 */
export const SOON_LINES: readonly LineKey[] = ['rec.soon.1'];

/** Whether chapter `chapter + 1` exists in the book (the 未完待續 card can name it). */
export const hasNextChapter = (chapter: number): boolean => CHAPTERS.some((c) => c.chapter === chapter + 1);

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
