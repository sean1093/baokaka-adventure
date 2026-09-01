import type { Level } from './types';

/**
 * 六關的關卡資料（spec §10）。
 *
 * 目標一律 r = 0.11（在 375px 寬的螢幕上邊長 ≈ 82px），
 * 三個目標分散在畫面上中下，彼此的 Chebyshev 距離都留足 r+r 以上，
 * 由 levels.test.ts 跑 validateLevels 把關。
 * decor 不可點擊、畫在目標下層，所以不受幾何規則限制。
 */
export const LEVELS: Level[] = [
  {
    id: 1,
    title: '摩卡貓躲在客廳',
    palette: 'living',
    decor: [
      { sprite: 'rug', x: 0.5, y: 0.86, r: 0.34 },
      { sprite: 'sofa', x: 0.52, y: 0.56, r: 0.3 },
      { sprite: 'coffeeTable', x: 0.22, y: 0.74, r: 0.18 },
      { sprite: 'floorLamp', x: 0.87, y: 0.4, r: 0.13 },
      { sprite: 'wallClock', x: 0.5, y: 0.13, r: 0.1 },
      { sprite: 'pottedPlant', x: 0.11, y: 0.46, r: 0.12 },
      { sprite: 'baokaka', x: 0.62, y: 0.28, r: 0.15 },
      { sprite: 'mochaCat', x: 0.86, y: 0.74, r: 0.14, flip: true },
    ],
    targets: [
      { id: 'bottle', name: '奶瓶', sprite: 'bottle', x: 0.24, y: 0.34, r: 0.11 },
      { id: 'sock', name: '小襪子', sprite: 'sock', x: 0.72, y: 0.62, r: 0.11 },
      { id: 'clothBook', name: '布繪本', sprite: 'clothBook', x: 0.44, y: 0.8, r: 0.11 },
    ],
    story:
      '寶咖咖睡醒，發現奶瓶、小襪子和最愛的布繪本都不見了。沙發後面伸出一條摩卡色的尾巴，正在偷偷笑。',
  },
  {
    id: 2,
    title: '院子裡的秘密',
    palette: 'yard',
    decor: [
      { sprite: 'fence', x: 0.16, y: 0.24, r: 0.18 },
      { sprite: 'fence', x: 0.5, y: 0.24, r: 0.18, flip: true },
      { sprite: 'fence', x: 0.84, y: 0.24, r: 0.18 },
      { sprite: 'tree', x: 0.14, y: 0.52, r: 0.2 },
      { sprite: 'stone', x: 0.88, y: 0.6, r: 0.13 },
      { sprite: 'flowerPot', x: 0.4, y: 0.56, r: 0.13 },
      { sprite: 'wateringCan', x: 0.66, y: 0.52, r: 0.13 },
      { sprite: 'butterfly', x: 0.5, y: 0.12, r: 0.1 },
      { sprite: 'baokaka', x: 0.5, y: 0.68, r: 0.15 },
      { sprite: 'mochaCat', x: 0.88, y: 0.84, r: 0.13, flip: true },
    ],
    targets: [
      { id: 'bucket', name: '小水桶', sprite: 'bucket', x: 0.2, y: 0.72, r: 0.11 },
      { id: 'spade', name: '紅色小鏟子', sprite: 'spade', x: 0.62, y: 0.8, r: 0.11 },
      { id: 'dandelion', name: '蒲公英', sprite: 'dandelion', x: 0.78, y: 0.34, r: 0.11 },
    ],
    story:
      '兩個人在院子裡挖了一個小洞，說要種一棵糖果樹。摩卡貓一頭撞進蒲公英，白色的絨毛飛得滿天都是。',
  },
  {
    id: 3,
    title: '公園的下午',
    palette: 'park',
    decor: [
      { sprite: 'cloud', x: 0.2, y: 0.09, r: 0.14 },
      { sprite: 'cloud', x: 0.74, y: 0.14, r: 0.11, flip: true },
      { sprite: 'slide', x: 0.8, y: 0.3, r: 0.19 },
      { sprite: 'bench', x: 0.3, y: 0.58, r: 0.24 },
      { sprite: 'tree', x: 0.1, y: 0.28, r: 0.17 },
      { sprite: 'kite', x: 0.5, y: 0.14, r: 0.12 },
      { sprite: 'bird', x: 0.9, y: 0.62, r: 0.09 },
      { sprite: 'baokaka', x: 0.56, y: 0.68, r: 0.15 },
      { sprite: 'mochaCat', x: 0.84, y: 0.85, r: 0.13 },
    ],
    targets: [
      { id: 'ball', name: '皮球', sprite: 'ball', x: 0.3, y: 0.78, r: 0.11 },
      { id: 'sunHat', name: '遮陽帽', sprite: 'sunHat', x: 0.7, y: 0.5, r: 0.11 },
      { id: 'cookie', name: '小餅乾', sprite: 'cookie', x: 0.22, y: 0.42, r: 0.11 },
    ],
    story:
      '公園的下午風很涼，皮球一路滾進草叢裡。摩卡貓第一個衝過去，整隻貓撲在球上不肯起來。',
  },
  {
    id: 4,
    title: '熱鬧的市場',
    palette: 'market',
    decor: [
      { sprite: 'awning', x: 0.5, y: 0.12, r: 0.44 },
      { sprite: 'lantern', x: 0.18, y: 0.28, r: 0.09 },
      { sprite: 'lantern', x: 0.82, y: 0.28, r: 0.09 },
      { sprite: 'crate', x: 0.14, y: 0.66, r: 0.17 },
      { sprite: 'crate', x: 0.88, y: 0.5, r: 0.15, flip: true },
      { sprite: 'fishStall', x: 0.38, y: 0.62, r: 0.2 },
      { sprite: 'scale', x: 0.64, y: 0.36, r: 0.13 },
      { sprite: 'apple', x: 0.26, y: 0.6, r: 0.08 },
      { sprite: 'baokaka', x: 0.36, y: 0.86, r: 0.15 },
      { sprite: 'mochaCat', x: 0.84, y: 0.86, r: 0.13, flip: true },
    ],
    targets: [
      { id: 'banana', name: '香蕉', sprite: 'banana', x: 0.26, y: 0.46, r: 0.11 },
      { id: 'driedFish', name: '小魚乾', sprite: 'driedFish', x: 0.68, y: 0.74, r: 0.11 },
      { id: 'coinPurse', name: '零錢包', sprite: 'coinPurse', x: 0.5, y: 0.24, r: 0.11 },
    ],
    story:
      '市場好熱鬧，寶咖咖坐在推車裡東看西看。摩卡貓盯著小魚乾不肯走，最後寶咖咖幫牠買了一包。',
  },
  {
    id: 5,
    title: '第一次看海',
    palette: 'beach',
    decor: [
      { sprite: 'sunDisc', x: 0.85, y: 0.11, r: 0.13 },
      { sprite: 'cloud', x: 0.28, y: 0.12, r: 0.13 },
      { sprite: 'seagull', x: 0.5, y: 0.2, r: 0.09 },
      { sprite: 'wave', x: 0.5, y: 0.32, r: 0.5 },
      { sprite: 'beachUmbrella', x: 0.16, y: 0.54, r: 0.19 },
      { sprite: 'sandcastle', x: 0.68, y: 0.86, r: 0.17 },
      { sprite: 'starfish', x: 0.9, y: 0.52, r: 0.09 },
      { sprite: 'baokaka', x: 0.38, y: 0.62, r: 0.15 },
      { sprite: 'mochaCat', x: 0.14, y: 0.84, r: 0.13 },
    ],
    targets: [
      { id: 'shell', name: '貝殼', sprite: 'shell', x: 0.24, y: 0.8, r: 0.11 },
      { id: 'flask', name: '小水壺', sprite: 'flask', x: 0.76, y: 0.66, r: 0.11 },
      { id: 'toyBoat', name: '玩具船', sprite: 'toyBoat', x: 0.46, y: 0.44, r: 0.11 },
    ],
    story:
      '第一次看海，浪打到腳上涼涼的，寶咖咖嚇了一大跳。摩卡貓早就躲到遮陽帽後面去了。',
  },
  {
    id: 6,
    title: '晚安，摩卡貓',
    palette: 'night',
    decor: [
      { sprite: 'moonWindow', x: 0.78, y: 0.18, r: 0.2 },
      { sprite: 'star', x: 0.22, y: 0.1, r: 0.07 },
      { sprite: 'star', x: 0.42, y: 0.16, r: 0.05 },
      { sprite: 'star', x: 0.56, y: 0.08, r: 0.06 },
      { sprite: 'bed', x: 0.44, y: 0.64, r: 0.42 },
      { sprite: 'pillow', x: 0.22, y: 0.54, r: 0.14 },
      { sprite: 'blanket', x: 0.74, y: 0.86, r: 0.18 },
      { sprite: 'slipper', x: 0.14, y: 0.88, r: 0.11 },
      { sprite: 'baokaka', x: 0.36, y: 0.56, r: 0.15 },
    ],
    targets: [
      { id: 'comfortDoll', name: '安撫娃娃', sprite: 'comfortDoll', x: 0.28, y: 0.44, r: 0.11 },
      { id: 'nightLight', name: '小夜燈', sprite: 'nightLight', x: 0.76, y: 0.3, r: 0.11 },
      { id: 'mochaCat', name: '摩卡貓', sprite: 'mochaCat', x: 0.52, y: 0.74, r: 0.11 },
    ],
    story:
      '找到的最後一樣東西，是摩卡貓自己。牠已經在寶咖咖的枕頭邊睡著了，今天的冒險到這裡。晚安。',
  },
];
