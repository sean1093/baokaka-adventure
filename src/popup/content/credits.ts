import type { LineKey } from '../core/types';

/**
 * 尾聲's screens (GDD § 2.13 item 8, § 5.5; #135), zh-Hant: the 05:30 scene before page E, the
 * credits over the album's photos, and the 土地公 after them. Every line ≤ 30 characters. The
 * credits are not in § 5 (D-100 records them): the cast as the book met them, then who made it.
 */

/** 05:30, home (§ 5.5): two beats — 阿嬤 up, and Mocha's one eye. */
export const DAWN_BEATS: readonly (readonly LineKey[])[] = [['e.dawn.1', 'e.dawn.2'], ['e.dawn.3', 'e.dawn.4']];

/** Post-credits (§ 5.5): the 土地公's ink, his line, the summer rain, and 廣播姊姊's next stop. */
export const POST_BEATS: readonly (readonly LineKey[])[] = [['e.post.1', 'e.post.2'], ['e.post.3'], ['e.post.4', 'e.post.5'], ['e.post.6']];

/** One credit: a role and its names. */
export interface Credit {
  readonly role: string;
  readonly names: readonly string[];
}

/** The credits roll's title card. */
export const CREDITS_TITLE = { title: '翻翻台北', sub: 'Pop-Up Taipei' } as const;

/** The cast, as the night met them; then who made the book. */
export const CREDITS: readonly Credit[] = [
  { role: '主演', names: ['寶咖咖'] },
  { role: '哥哥，兼翻譯', names: ['摩卡'] },
  { role: '小小的雲', names: ['咻咻'] },
  { role: '家人', names: ['阿嬤', '媽媽', '爸爸'] },
  { role: '月亮線', names: ['廣播姊姊'] },
  { role: '我們是連鎖的', names: ['店員小哥'] },
  { role: '找了一整晚的101', names: ['背包客'] },
  { role: '動物朋友', names: ['藍教授', '黑糖'] },
  { role: '每一頁都在', names: ['戴不同帽子的阿伯'] },
  { role: '製作', names: ['寶咖咖的爸爸', 'Claude'] },
];

/** The credit the 背包客's cameo goes with (「I found it!」, § 4.1). */
export const CAMEO_ROLE = '找了一整晚的101';

/** The last card, over the 抓周 photo. */
export const CREDITS_DEDICATION = '寶咖咖，一歲生日快樂。';
