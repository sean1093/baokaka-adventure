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
  /** § 5.3: the pops when 淘氣 / 土地公 is earned (#101) */
  stickerPop: { mischief: '嘿嘿，淘氣！', tudigong: '找到土地公！' },
  /** § 5.3 「下一頁！」 on the sticker card (#101); the 目錄's 淘氣 line (#101, not in § 5.7: D-64) */
  card: { next: '下一頁！' },
  /** 選單 (the pause menu, #97): 繼續 / 目錄 / 設定 / 封面 */
  menu: { resume: '繼續', contents: '目錄', settings: '設定', cover: '封面' },
  contents: { title: '目錄', collected: '已收集', locked: '月亮線還沒開到這裡。', back: '封面', mischief: '淘氣' },
  /**
   * The chapter card (§ 2.13, § 5.2; #102): the split-flap row's label. Not in § 5.7 (D-65): the
   * accessible names of the tap layer while a turn plays (跳過) and while the card's lines play (下一句)
   */
  chapterCard: { next: '下一站', skip: '跳過', more: '下一句' },
  /** § 5.7 Photo (#103) */
  photo: { shutter: '咔嚓', retake: '再拍一次', keep: '放進相簿' },
  /**
   * The album (§ 2.9; #103): its name (「寶咖咖一歲的相簿」, § 2.9 step 6), the word's label (the
   * word card's 學會了, D-62) and 返回. Not in § 5.7 (D-66): the sticker count's accessible name.
   */
  album: { title: '寶咖咖一歲的相簿', learned: '學會了', back: '返回', stickers: '已收集' },
  /** § 5.7 Settings (#104) */
  settings: {
    speed: '速度', speeds: ['慢', '普通', '快'],
    textSize: '字的大小', textSizes: ['標準', '大字'],
    elder: '長輩模式',
    autoHint: '自動提示', autoHints: ['關', '30秒', '15秒'],
    sound: '音效', music: '音樂', vibration: '震動', reduceMotion: '減少動態', leftHand: '左手模式',
    reset: '重新開始（按住三秒）',
  },
  /** § 5.7 Bonus (#135) */
  bonus: '象山的日出',
  /** Not in § 5.7 (D-60): the album and settings screens until #103 / #104 build them */
  stub: { soon: '這一頁，還在畫。', back: '返回' },
} as const;
