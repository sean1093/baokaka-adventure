/**
 * Player-facing system and battle strings, in one place so later issues edit one file.
 * Wording comes from docs/story/script.md § *Battle UI strings* and `### system.defeat`.
 * Story dialogue stays in events.ts; this is only what the engine and screens say themselves.
 */
export const UI = {
  /** Vocabulary: the currency, the MP pool and the stats that were renamed for the new story */
  coins: '銅板',
  skill: '才藝',
  mp: '元氣',
  hp: '體力',
  atk: '武力',
  def: '防禦',
  spd: '身手',
  luck: '幸運',

  /** Battle command labels, in menu order */
  commands: { attack: '攻擊', skill: '才藝', item: '道具', guard: '防禦', flee: '逃跑' },

  victory: '大家都冷靜下來了！',
  bossVictory: (boss: string) => `${boss}不暈了！`,
  /** Battle log when a party shield (鵲橋護盾) goes up */
  shielded: '全隊被護盾保護住了',
  fleeOk: '溜走了！',
  fleeFail: '被擋住了！',
  heroKo: (name: string) => `${name}累倒了……`,
  foeKo: (name: string) => `${name}頭暈暈，跑走了！`,
  levelUp: (level: number) => `大家長大了一點！（Lv${level}）`,
  newSkill: (name: string, skill: string) => `${name}學會了才藝：${skill}！`,

  /** `### system.defeat`, one entry per line */
  defeat: ['大家累倒了……', '在入口醒了過來。'] as const,

  /** A count of coins, e.g. a price tag or the wallet chip */
  coinCount: (count: number) => `${count} 個銅板`,
  innAsk: (price: number, held: number) => `睡一下要 ${price} 個銅板。（現在有 ${held} 個）`,
  innShort: (missing: number) => `銅板不夠，還差 ${missing} 個。`,
  innRested: '呼……睡了一覺，體力和元氣都滿了。',
  innDeclined: '「那下次再來喔。」',

  /** The one-time title notice after an old-story save was discarded (decisions.md D-12) */
  legacyReset: ['冒險重新開始囉！', '舊的存檔是上一個故事的，已經收進回憶裡了。'] as const,
  ok: '好',
} as const;
