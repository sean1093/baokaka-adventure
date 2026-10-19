import type { LineKey } from '../core/types';

/**
 * The script (GDD § 5), zh-Hant: `LineKey → { who, text }`, every line ≤ 30 characters (§ 5.1).
 * Lint rule 10 checks every page's line keys against `SCRIPT` (`pages.test.ts`, `npm run solve`,
 * PageLab); the subtitle queue (`game/talk.ts`) loads a page's `lines` through `loadLine`.
 *
 * Keys follow the § 5 headings: `c1.intro.2` (chapter 1's card lines, § 5.2), `rec.pa.ride.1`
 * (§ 5.3 recurring lines). #98 brought the speaker table, the loader and the lines its fixtures
 * play; #102 copies the rest of § 5 in.
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
  // § 5.2 Ch1 「便當的味道」 00:20 (the chapter card and the first page)
  'c1.intro.1': { who: 'pa', text: '下一站，台北車站。Next station…' },
  'c1.intro.2': { who: 'mocha', text: '台北最大的車站。也最好迷路。' },
  'c1.intro.3': { who: 'nar', text: '大廳的地板，黑白黑白，像棋盤。' },
  'c1.intro.4': { who: 'mocha', text: '聞到了嗎？……是便當。' },
  // § 5.3 recurring lines
  'rec.pa.ride.1': { who: 'pa', text: '請緊握扶手。' },
  'rec.pa.ride.2': { who: 'pa', text: '請讓座給需要的人。' },
  'rec.pa.ride.3': { who: 'pa', text: '車門即將關閉。' },
  'rec.uncle.tap': { who: 'uncle', text: '呵呵，囡仔，慢慢仔來。' },
  'rec.mocha.squint': { who: 'mocha', text: '……我是不是在哪裡看過你？' },
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
