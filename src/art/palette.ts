/** 全遊戲共用色票。所有 sprite 只能用這裡的顏色，保證 54 個圖案風格一致。 */
export const C = {
  ink: '#3B2A20',      // 輪廓、深色細節
  cream: '#FFF7E8',    // 最亮的底色
  paper: '#F3E3C3',    // 淺色物件
  sun: '#F2A93B',      // 暖黃
  sunDeep: '#E08A22',  // 暖黃陰影
  berry: '#D9564F',    // 紅
  berryDeep: '#B23F3A',
  leaf: '#5C9E63',     // 綠
  leafDeep: '#3F7A48',
  sky: '#7FB6D9',      // 藍
  skyDeep: '#4E8FBA',
  mocha: '#A8703E',    // 摩卡貓的毛色
  mochaDeep: '#7E5029',
  plum: '#8E6E9E',     // 紫
  sand: '#E8CE9A',     // 沙、木頭
  sandDeep: '#C9A96A',
  white: '#FFFFFF',
  grey: '#B9AFA4',
} as const;
