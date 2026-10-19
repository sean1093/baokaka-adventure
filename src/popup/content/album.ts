import type { LearnKey } from './words';

/**
 * The album (GDD § 2.9, § 5.6), zh-Hant: each chapter's treasure and word, the four family members'
 * handwritten notes for its photo, and the shared pool that Frames B and C draw from. Lines are
 * stored without their outer 「」 (the note is the quote), exactly as § 5.6 writes them. Which note a
 * photo gets is `game/photo.ts` (`albumNotes`).
 */

/** The four notes on an album page, in the order they pop in (§ 2.9 step 5). */
export type NoteSpeaker = 'grandma' | 'mom' | 'dad' | 'mocha';
export const NOTE_SPEAKERS: readonly NoteSpeaker[] = ['grandma', 'mom', 'dad', 'mocha'];

/** The name on each note's tab. */
export const NOTE_NAME: Readonly<Record<NoteSpeaker, string>> = { grandma: '阿嬤', mom: '媽媽', dad: '爸爸', mocha: '摩卡' };

export type ChapterNotes = Readonly<Record<NoteSpeaker, string>>;

/** § 5.6: the Frame A notes per chapter (1–10), and the ending's photo (`ENDING_NOTES`). */
export const CHAPTER_NOTES: Readonly<Record<number, ChapterNotes>> = {
  1: { grandma: '嘴巴開開，雞腿比臉還大！', mom: '第一次搭捷運，就這麼開心。', dad: '這個手勢……是在說『爸』吧？', mocha: '我在左下角。很帥。' },
  2: { grandma: '會畫圖喔，以後當畫家！', mom: '大安森林公園，我們常去散步。', dad: '這個嘴型，很接近『爸爸』了。', mocha: '松鼠搶鏡頭。不予置評。' },
  3: { grandma: '拿書，會讀冊！好！', mom: '書拿反了，好可愛。', dad: '爸爸也念過台大……旁聽過。', mocha: '那隻鵝，我記住牠了。' },
  4: { grandma: '跟阿嬤一樣，愛唱歌！', mom: '霓虹燈照得臉紅紅的。', dad: '下一首，點〈爸爸〉好嗎？', mocha: '太吵了。照片還可以。' },
  5: { grandma: '蔥，聰明！乖孫最聰明。', mom: '怎麼有蔥抓餅的味道？', dad: '阿姨抱，笑那麼開心……', mocha: '我沒偷吃。照片可以作證。' },
  6: { grandma: '拿印章，以後做頭家！', mom: '他看飛機，眼睛好亮。', dad: '那是A321！爸爸教的！', mocha: '塔台說要安靜。他沒有。' },
  7: { grandma: '芹菜，勤勞。這張要洗大張！', mom: '他會爬樓梯了？什麼時候？', dad: '下次，要爬向爸爸喔。', mocha: '背景那隻熊，不用問。' },
  8: { grandma: '算盤！會算錢，好！', mom: '臉被溫泉蒸得紅通通。', dad: '一、二、三……算到爸爸了嗎？', mocha: '我的腳沒碰到水。重點。' },
  9: { grandma: '當醫生，照顧別人，好囡仔。', mom: '他站起來了！站起來了！', dad: '站起來，是要走向爸爸吧？', mocha: '我扶著他。照片沒拍到。' },
  10: { grandma: '金鎖片戴上，平平安安。', mom: '第一步……我哭了。', dad: '走向……一朵雲？', mocha: '他說『一起』。我翻譯的。' },
};

/** § 5.6 row E: the 抓周 photo's notes (#135 shows them). */
export const ENDING_NOTES: ChapterNotes = { grandma: '抓周抓到貓，是什麼意思？', mom: '意思是，他很愛摩卡。', dad: '……第三個字一定是爸爸。', mocha: '……喵。' };

/** § 5.6 shared pool (Frames B and C): 阿嬤, 媽媽, 爸爸, and 摩卡 in (`mochaIn`) or out of (`mochaOut`) the frame. */
export const NOTE_POOL = {
  grandma: ['怎麼拍，乖孫都古錐。', '眼睛瞇瞇，也很可愛。', '這張要放在客廳。'],
  mom: ['有點糊，可是好有感覺。', '他在打哈欠，好想睡喔。', '這個表情，跟爸爸一模一樣。'],
  dad: ['構圖不錯，爸爸給九十分。', '再一張！再一張！', '這張，我要設成手機桌布。'],
  mochaIn: ['我入鏡了。這張可以。', '我的尾巴，很上相。'],
  mochaOut: ['又沒有我。……喔。', '大家手機裡，都是你的照片。'],
} as const satisfies Readonly<Record<string, readonly string[]>>;

/** What a chapter's album page names (§ 2.9 album screen, § 4.2): its treasure and the word (or growth stage) learned. */
export interface AlbumChapter {
  /** The 抓周 treasure the spread's photo is taken with */
  readonly treasure: string;
  /** The word or growth stage learned in the chapter, printed big (`LEARN_BEATS[word].title`) */
  readonly word: LearnKey;
}

/** § 4.2: chapters 1–10. Chapter 10 learns 一起 and takes 第一步; the album prints the word. */
export const ALBUM_CHAPTERS: Readonly<Record<number, AlbumChapter>> = {
  1: { treasure: '雞腿', word: 'beep' },
  2: { treasure: '畫筆', word: 'bye' },
  3: { treasure: '書', word: 'no' },
  4: { treasure: '麥克風', word: 'wow' },
  5: { treasure: '蔥', word: 'hug' },
  6: { treasure: '印章', word: 'plane' },
  7: { treasure: '芹菜', word: 'climb' },
  8: { treasure: '算盤', word: 'whoosh' },
  9: { treasure: '聽診器', word: 'cruise' },
  10: { treasure: '金鎖片', word: 'together' },
};

/** A chapter's album entry (chapter 1's for one without a photo page). */
export const albumChapter = (chapter: number): AlbumChapter => ALBUM_CHAPTERS[chapter] ?? ALBUM_CHAPTERS[1];
