/**
 * UI strings (GDD § 5.7), zh-Hant. Screens refer to these, never to literals. Strings the GDD does
 * not list (the stub screens, the portrait disc's label) are marked; D-60 records them.
 */
export const UI = {
  cover: { start: '開始', resume: '繼續', contents: '目錄', album: '相簿', settings: '設定' },
  bar: { talk: '說話', hint: '提示', retry: '重來', menu: '選單' },
  /** The word ring's close disc (§ 5.7); the card's accessible name for the tap that puts it away (D-62) */
  ring: { close: '好了', card: '學會了' },
  stickers: { solved: '解開', mischief: '淘氣', tudigong: '土地公' },
  /** 選單 (the pause menu, #97): 繼續 / 目錄 / 設定 / 封面 */
  menu: { resume: '繼續', contents: '目錄', settings: '設定', cover: '封面' },
  contents: { title: '目錄', collected: '已收集', locked: '月亮線還沒開到這裡。', back: '封面' },
  /** Not in § 5.7 (D-60): the album and settings screens until #103 / #104 build them */
  stub: { soon: '這一頁，還在畫。', back: '返回' },
} as const;
