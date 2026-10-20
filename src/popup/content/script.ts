import type { LineKey } from '../core/types';

/**
 * The script (GDD § 5), zh-Hant: `LineKey → { who, text }`, every line ≤ 30 characters (§ 5.1).
 * Lint rule 10 checks every page's line keys against `SCRIPT` (`pages.test.ts`, `npm run solve`,
 * PageLab); the subtitle queue (`game/talk.ts`) loads a page's `lines` through `loadLine`.
 *
 * Keys follow the § 5 headings: `p.intro.3` (the prologue, § 5.2 P), `c1.intro.2` (chapter 1's
 * card lines), `c0p3.join.4` / `c1p5.clerk.1` (a page's beat), `rec.pa.ride.1` (§ 5.3 recurring
 * lines), `learn.beep.mocha` (§ 5.4). Speech is stored without its outer 「」 (the bubble is the
 * quote); narration as written. #98 brought the speaker table, the loader and the lines its
 * fixtures play; #102 copied every line of the prologue and chapter 1 (§ 5.2) and the § 5.3 lines
 * they use. Chapters 2–10 come with their content issues. Which lines a chapter card plays is
 * `chapters.ts` (`cardLines`).
 */

/** § 5.1 speakers: who a line belongs to (its subtitle label, colour and anchor). */
export type Speaker = 'nar' | 'baby' | 'mocha' | 'grandma' | 'mom' | 'dad' | 'pa' | 'uncle' | 'clerk' | 'pack' | 'shushu' | 'npc';

/**
 * Where a speaker's subtitle bubble hangs (§ 5.1 *Bubble anchored to*): narration goes on the paper
 * strip at the top; Baokaka, Mocha and the 土地公 get a bubble on a spring from their heads; 廣播姊姊
 * speaks from a paper loudspeaker in the page's top corner; everyone else (off-page voices) gets a
 * bubble with no spring, under the strip.
 */
export type SpeakerAnchor = 'strip' | 'baby' | 'mocha' | 'speaker' | 'tudigong' | 'none';

export interface SpeakerInfo {
  /** The bubble's label (null for narration and for 寶咖咖 and 摩卡, whose bubbles hang from them) */
  readonly label: string | null;
  readonly anchor: SpeakerAnchor;
}

export const SPEAKERS: Readonly<Record<Speaker, SpeakerInfo>> = {
  nar: { label: null, anchor: 'strip' },
  baby: { label: null, anchor: 'baby' },
  mocha: { label: null, anchor: 'mocha' },
  grandma: { label: '阿嬤', anchor: 'none' },
  mom: { label: '媽媽', anchor: 'none' },
  dad: { label: '爸爸', anchor: 'none' },
  pa: { label: '廣播姊姊', anchor: 'speaker' },
  uncle: { label: '阿伯', anchor: 'tudigong' },
  clerk: { label: '店員小哥', anchor: 'none' },
  pack: { label: '背包客', anchor: 'none' },
  // 咻咻 is shown as 「小小的雲」 until 9-5 (§ 5.1): a line carries that label itself
  shushu: { label: '咻咻', anchor: 'none' },
  // Named per page (跑步阿姨, 鵝, 溫泉阿嬤 …): the line carries its label
  npc: { label: null, anchor: 'none' },
};

export interface ScriptLine {
  readonly who: Speaker;
  readonly text: string;
  /** The label for this line, over the speaker's (an `npc`'s name, 咻咻 as 「小小的雲」) */
  readonly label?: string;
}

export const SCRIPT: Readonly<Record<LineKey, ScriptLine>> = {
  // § 5.2 P 序章「度晬前一晚」 00:00: the card plays 1–5 (`CARD_LINES`), page 0-1 opens on 6–12
  'p.intro.1': { who: 'nar', text: '明天，是寶咖咖一歲的生日。' },
  'p.intro.2': { who: 'nar', text: '台灣話，叫做「度晬」。' },
  'p.intro.3': { who: 'grandma', text: '九樣寶物，長長久久。' },
  'p.intro.4': { who: 'grandma', text: '摩卡，今暗顧好喔。' },
  'p.intro.5': { who: 'nar', text: '……然後，摩卡就睡著了。' },
  'p.intro.6': { who: 'nar', text: '半夜十二點，窗戶喀啦喀啦響。' },
  'p.intro.7': { who: 'shushu', label: '小小的雲', text: '嘻……生日？什麼是生日？' },
  'p.intro.8': { who: 'nar', text: '小小的雲轉了一圈——呼！' },
  'p.intro.9': { who: 'nar', text: '寶物全部飛出了窗外。' },
  'p.intro.10': { who: 'shushu', label: '小小的雲', text: '對、對不起——！' },
  'p.intro.11': { who: 'nar', text: '阿嬤送的立體書，也被吹開了。' },
  'p.intro.12': { who: 'baby', text: '……哇。' },
  // § 4.3 0-2: Dad sleep-talks under his newspaper (the 淘氣, 0-2's `lines.onEvent`)
  'c0p2.dad.1': { who: 'dad', text: '叫……爸爸……' },
  // § 5.2 0-3 Mocha joins (on page open: 0-3's `lines.intro`, #106)
  'c0p3.join.1': { who: 'mocha', text: '……喵？盤子……空的？' },
  'c0p3.join.2': { who: 'mocha', text: '完了完了完了。' },
  'c0p3.join.3': { who: 'mocha', text: '阿嬤五點半就起床了。' },
  'c0p3.join.4': { who: 'mocha', text: '我自己去找。你乖乖睡覺。' },
  'c0p3.join.5': { who: 'baby', text: '不要！' },
  'c0p3.join.6': { who: 'mocha', text: '你連走路都還不會。' },
  'c0p3.join.7': { who: 'baby', text: '要！' },
  'c0p3.join.8': { who: 'mocha', text: '他說：『我也要去。這是我的生日。』' },
  'c0p3.join.9': { who: 'mocha', text: '……我在跟誰翻譯？' },
  'c0p3.join.10': { who: 'mocha', text: '……好啦。跟緊我。' },
  // § 4.3 0-3: the 紅包 lands beside him and he pats it (the 淘氣's flavour, 0-3's `lines.onEvent`)
  'c0p3.envelope.1': { who: 'baby', text: '這個！' },
  // § 5.2 0-4 The train wakes (on the cry → `train: on`: 0-4's `lines.onEvent`, #106)
  'c0p4.train.1': { who: 'pa', text: '月亮線列車，即將進站。' },
  'c0p4.train.2': { who: 'pa', text: '本列車，只載還沒睡的人。' },
  'c0p4.train.3': { who: 'mocha', text: '……還有沒睡的貓。' },
  // § 5.2 Ch1 「便當的味道」 00:20 (the chapter card)
  'c1.intro.1': { who: 'pa', text: '下一站，台北車站。Next station…' },
  'c1.intro.2': { who: 'mocha', text: '台北最大的車站。也最好迷路。' },
  'c1.intro.3': { who: 'nar', text: '大廳的地板，黑白黑白，像棋盤。' },
  'c1.intro.4': { who: 'mocha', text: '聞到了嗎？……是便當。' },
  // § 5.2 1-1 背包客 (#107 wires them to the backpacker waking: § 5.3's lines for 1-1)
  'c1p1.pack.1': { who: 'pack', text: 'Excuse me… where is 101?' },
  'c1p1.pack.2': { who: 'mocha', text: '往前走，看到最高的就是。' },
  // § 5.2 1-5 店員小哥 (his chapter cameo, § 5.3)
  'c1p5.clerk.1': { who: 'clerk', text: '叮咚～歡迎光臨！' },
  'c1p5.clerk.2': { who: 'mocha', text: '……你怎麼在這裡？' },
  'c1p5.clerk.3': { who: 'clerk', text: '我們是連鎖的。' },
  // § 5.2 1-6 end (the treasure found; 阿嬤's line is also the album's, #103)
  'c1p6.end.1': { who: 'nar', text: '找到了！抓周寶物——雞腿。' },
  'c1p6.end.2': { who: 'grandma', text: '雞腿，一世人呷好料。' },
  'c1p6.end.3': { who: 'baby', text: '好吃！' },
  'c1p6.end.4': { who: 'mocha', text: '那是阿嬤的，不能吃。' },
  // § 5.3 recurring lines (those chapters 0–1 use; the hint lines are `hints.ts`, the barks
  // `barks.ts`, the sticker pops and 「下一頁！」 `ui.ts`)
  'rec.pa.ride.1': { who: 'pa', text: '請緊握扶手。' },
  'rec.pa.ride.2': { who: 'pa', text: '請讓座給需要的人。' },
  'rec.pa.ride.3': { who: 'pa', text: '車門即將關閉。' },
  'rec.uncle.tap': { who: 'uncle', text: '呵呵，囡仔，慢慢仔來。' },
  'rec.mocha.squint': { who: 'mocha', text: '……我是不是在哪裡看過你？' },
  // Under the next chapter's card while that chapter is still being made (#107, D-70)
  'rec.soon.1': { who: 'nar', text: '下一站還在畫……未完待續。' },
  // § 5.4 word learning: the source line, Baokaka's word, Mocha's translation (and its follow-up);
  // `content/words.ts` strings them into learn beats (#99). Sources that make no sound have no line.
  'learn.beep.src': { who: 'npc', label: '讀卡機', text: '嗶！' },
  'learn.beep.baby': { who: 'baby', text: '嗶！' },
  'learn.beep.mocha': { who: 'mocha', text: '他說：『芝麻開門。』' },
  'learn.beep.then': { who: 'mocha', text: '……閘門真的開了。' },
  'learn.bye.src': { who: 'npc', label: '跑步阿姨', text: '掰掰～小寶貝！' },
  'learn.bye.baby': { who: 'baby', text: '掰掰！' },
  'learn.bye.mocha': { who: 'mocha', text: '他說：『請讓一讓，謝謝。』' },
  'learn.no.src': { who: 'npc', label: '鵝', text: '嘎！不要過來！' },
  'learn.no.baby': { who: 'baby', text: '不要！' },
  'learn.no.mocha': { who: 'mocha', text: '他學會了人生最重要的詞。' },
  'learn.wow.baby': { who: 'baby', text: '哇！' },
  'learn.wow.mocha': { who: 'mocha', text: '他說：『開燈。』……電費誰付？' },
  'learn.hug.src': { who: 'npc', label: '夜市阿姨', text: '來，阿姨抱！' },
  'learn.hug.baby': { who: 'baby', text: '抱抱！' },
  'learn.hug.mocha': { who: 'mocha', text: '他說：『載我一程。』' },
  'learn.plane.baby': { who: 'baby', text: '飛……飛機！' },
  'learn.plane.mocha': { who: 'mocha', text: '不會說爸爸，先會說飛機。' },
  'learn.climb.mocha': { who: 'mocha', text: '……你什麼時候學會的？' },
  'learn.whoosh.src': { who: 'npc', label: '溫泉阿嬤', text: '蛋很燙，呼呼再吃。' },
  'learn.whoosh.baby': { who: 'baby', text: '咻——！' },
  'learn.whoosh.mocha': { who: 'mocha', text: '他說：『我是颱風。』……別鬧。' },
  'learn.cruise.mocha': { who: 'mocha', text: '站、站起來了！……我沒有哭。' },
  'learn.together.baby': { who: 'baby', text: '……一起。' },
  'learn.together.mocha': { who: 'mocha', text: '他說：『我們一起去。』' },
};

/** A line ready to show: its key, speaker, label and text. */
export interface TalkLine {
  readonly key: LineKey;
  readonly who: Speaker;
  /** The bubble's label, or null (narration, 寶咖咖, 摩卡) */
  readonly label: string | null;
  readonly text: string;
}

/**
 * The loader pages' `lines` go through: a key → the line to show, or null when the key isn't in the
 * table (lint rule 10 makes that an error, so a shipped page never hits it).
 */
export function loadLine(key: LineKey, table: Readonly<Record<LineKey, ScriptLine>> = SCRIPT): TalkLine | null {
  const line = table[key];
  if (line === undefined) return null;
  return { key, who: line.who, label: line.label ?? SPEAKERS[line.who].label, text: line.text };
}

/** Loads a list of keys, dropping unknown ones. */
export function loadLines(keys: readonly LineKey[], table?: Readonly<Record<LineKey, ScriptLine>>): TalkLine[] {
  return keys.map((k) => loadLine(k, table)).filter((l): l is TalkLine => l !== null);
}
