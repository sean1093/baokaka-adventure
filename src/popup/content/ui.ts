/**
 * UI strings (GDD § 5.7), zh-Hant. Screens refer to these, never to literals. Strings the GDD does
 * not list (the portrait disc's label, the settings' extras…) are marked; D-60 and D-67 record them.
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
  chapterCard: { next: '下一站', skip: '跳過', more: '下一句', soon: '未完待續' },
  /** § 5.7 Photo (#103) */
  photo: { shutter: '咔嚓', retake: '再拍一次', keep: '放進相簿' },
  /**
   * The album (§ 2.9; #103): its name (「寶咖咖一歲的相簿」, § 2.9 step 6), the word's label (the
   * word card's 學會了, D-62) and 返回. Not in § 5.7 (D-66): the sticker count's accessible name.
   * #113 (D-76): the 「淘氣大王」 cover's ribbon (§ 2.8 names it); not in § 5.7, accessible names only:
   * the page arrows (上一頁 / 下一頁) and the cover leaf's name (封面).
   */
  album: { title: '寶咖咖一歲的相簿', learned: '學會了', firstWord: '第一個字', back: '返回', stickers: '已收集', mischiefKing: '淘氣大王', prev: '上一頁', next: '下一頁', cover: '封面' },
  /**
   * § 5.7 Settings (#104). Not in § 5.7 (D-67): the gyro tilt's name (書本傾斜), the switches'
   * 關／開 (§ 2.11's options), 長輩模式's one-line summary, the note on the rows it holds, 減少動態's
   * note while it follows the phone, 返回, and the volume's unit.
   */
  settings: {
    title: '設定', back: '返回',
    speed: '速度', speeds: ['慢', '普通', '快'],
    textSize: '字的大小', textSizes: ['標準', '大字'],
    elder: '長輩模式', elderSummary: '慢一點、字大一點、提示快一點', elderHeld: '長輩模式幫你設好了',
    autoHint: '自動提示', autoHints: ['關', '30秒', '15秒'],
    sound: '音效', music: '音樂', vibration: '震動', reduceMotion: '減少動態', leftHand: '左手模式', tilt: '書本傾斜',
    onOff: ['關', '開'], percent: '%', followsSystem: '跟著手機的設定',
    reset: '重新開始（按住三秒）',
  },
  /** § 5.7 Bonus (#135) */
  bonus: '象山的日出',
  /**
   * 尾聲 (#135; not in § 5.7, D-100): the credits' skip, and the accessible names of the story
   * scenes before page E and after the credits
   */
  ending: { skip: '跳過', dawn: '清晨五點半', post: '巷口的小廟', credits: '謝謝收看', next: '下一句' },
} as const;
