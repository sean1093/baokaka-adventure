import type { Chapter } from './types';

export const PROLOGUE =
  '睡覺時間到了，可是寶咖咖最愛的安撫娃娃不見了！窗外傳來「呼嚕——呼嚕——」的聲音，一群搗蛋鬼抬著娃娃跑進夜色裡。摩卡貓豎起尾巴：「走，我們去把它搶回來！」';

/**
 * Where the four stops of every chapter stand in the walkable world (screen-widths).
 * Baokaka starts at x 0.2; the camera shows one screen-width at a time out of WORLD_WIDTH.
 */
const STOPS = [0.78, 1.5, 2.1, 2.72];

/**
 * Six chapters, four stops each: two fights, a camp, then the boss.
 * `decor` dresses the SQUARE battle box (foes stand around y 0.32, heroes around y 0.8).
 * `world.decor` dresses the side-scrolling map; sprites are anchored by their feet on a ground
 * line, so `foot` is the bottom edge as a fraction of the scene height (0.82 = standing on the
 * ground, smaller = further back or in the air) and `depth` < 1 scrolls slower for parallax.
 */
export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: '客廳大騷動',
    palette: 'living',
    decor: [
      { sprite: 'rug', x: 0.5, y: 0.93, r: 0.36 },
      { sprite: 'wallClock', x: 0.5, y: 0.11, r: 0.09 },
      { sprite: 'floorLamp', x: 0.9, y: 0.34, r: 0.13 },
      { sprite: 'pottedPlant', x: 0.1, y: 0.38, r: 0.12 },
    ],
    nodes: [
      { kind: 'battle', foes: ['dustBunny'] },
      { kind: 'battle', foes: ['dustBunny', 'sockMonster'], drops: ['cookie'] },
      { kind: 'camp' },
      { kind: 'boss', foes: ['blockGolem'], drops: ['bottle', 'bottle'] },
    ],
    world: {
      decor: [
        { sprite: 'wallClock', x: 0.45, foot: 0.34, r: 0.08, depth: 0.6 },
        { sprite: 'sofa', x: 0.35, foot: 0.78, r: 0.26, depth: 0.85 },
        { sprite: 'rug', x: 1.15, foot: 0.96, r: 0.3 },
        { sprite: 'coffeeTable', x: 1.15, foot: 0.8, r: 0.15, depth: 0.85 },
        { sprite: 'pottedPlant', x: 1.8, foot: 0.78, r: 0.12, depth: 0.85 },
        { sprite: 'floorLamp', x: 2.4, foot: 0.76, r: 0.14, depth: 0.85 },
        { sprite: 'rug', x: 2.65, foot: 0.96, r: 0.3 },
      ],
      stops: STOPS,
      pickups: [{ id: 'c1-cookie', item: 'cookie', x: 1.14 }],
    },
    story:
      '積木巨人嘩啦一聲倒下，變回一堆積木。灰塵球們急急忙忙躲回沙發底下。寶咖咖在積木堆裡撿到一張紙條：「娃娃在院子——打呼嚕大王 留」。',
  },
  {
    id: 2,
    title: '院子的地底下',
    palette: 'yard',
    decor: [
      { sprite: 'fence', x: 0.16, y: 0.13, r: 0.16 },
      { sprite: 'fence', x: 0.5, y: 0.13, r: 0.16, flip: true },
      { sprite: 'fence', x: 0.84, y: 0.13, r: 0.16 },
      { sprite: 'tree', x: 0.1, y: 0.42, r: 0.18 },
      { sprite: 'butterfly', x: 0.9, y: 0.52, r: 0.08 },
    ],
    nodes: [
      { kind: 'battle', foes: ['mosquito', 'mosquito'] },
      { kind: 'battle', foes: ['snail', 'mosquito'], drops: ['bottle'] },
      { kind: 'camp' },
      { kind: 'boss', foes: ['moleKing'], drops: ['cookie', 'driedFish'] },
    ],
    world: {
      decor: [
        { sprite: 'fence', x: 0.2, foot: 0.7, r: 0.16, depth: 0.7 },
        { sprite: 'fence', x: 0.52, foot: 0.7, r: 0.16, depth: 0.7, flip: true },
        { sprite: 'fence', x: 0.84, foot: 0.7, r: 0.16, depth: 0.7 },
        { sprite: 'fence', x: 1.16, foot: 0.7, r: 0.16, depth: 0.7, flip: true },
        { sprite: 'fence', x: 1.48, foot: 0.7, r: 0.16, depth: 0.7 },
        { sprite: 'fence', x: 1.8, foot: 0.7, r: 0.16, depth: 0.7, flip: true },
        { sprite: 'fence', x: 2.12, foot: 0.7, r: 0.16, depth: 0.7 },
        { sprite: 'fence', x: 2.44, foot: 0.7, r: 0.16, depth: 0.7, flip: true },
        { sprite: 'fence', x: 2.76, foot: 0.7, r: 0.16, depth: 0.7 },
        { sprite: 'tree', x: 0.05, foot: 0.74, r: 0.2, depth: 0.85 },
        { sprite: 'tree', x: 1.85, foot: 0.74, r: 0.2, depth: 0.85, flip: true },
        { sprite: 'flowerPot', x: 1.15, foot: 0.84, r: 0.1 },
        { sprite: 'stone', x: 2.4, foot: 0.86, r: 0.11 },
        { sprite: 'butterfly', x: 0.6, foot: 0.4, r: 0.07, depth: 0.5 },
        { sprite: 'butterfly', x: 2.55, foot: 0.36, r: 0.06, depth: 0.5, flip: true },
      ],
      stops: STOPS,
      pickups: [
        { id: 'c2-bottle', item: 'bottle', x: 1.85 },
        // Behind the starting point: a reward for the curious who walk left first
        { id: 'c2-fish', item: 'driedFish', x: 0.04 },
      ],
    },
    story:
      '地鼠大王把頭縮回洞裡，小小聲說以後再也不亂挖花圃了。一朵蒲公英的絨毛飛過圍籬，飄向公園的方向。摩卡貓追著絨毛跑，寶咖咖搖搖晃晃跟在後面。',
  },
  {
    id: 3,
    title: '公園的天空',
    palette: 'park',
    decor: [
      { sprite: 'cloud', x: 0.2, y: 0.08, r: 0.12 },
      { sprite: 'cloud', x: 0.8, y: 0.13, r: 0.1, flip: true },
      { sprite: 'slide', x: 0.88, y: 0.44, r: 0.16 },
      { sprite: 'bench', x: 0.12, y: 0.48, r: 0.15 },
    ],
    nodes: [
      { kind: 'battle', foes: ['pigeon', 'pigeon'] },
      { kind: 'battle', foes: ['kiteGhost', 'pigeon'], drops: ['cookie'] },
      { kind: 'camp' },
      { kind: 'boss', foes: ['crowBoss'], drops: ['bottle', 'bottle'] },
    ],
    world: {
      decor: [
        { sprite: 'cloud', x: 0.3, foot: 0.22, r: 0.13, depth: 0.3 },
        { sprite: 'cloud', x: 1.3, foot: 0.16, r: 0.1, depth: 0.3, flip: true },
        { sprite: 'cloud', x: 2.3, foot: 0.24, r: 0.12, depth: 0.3 },
        { sprite: 'kite', x: 1.0, foot: 0.42, r: 0.09, depth: 0.5 },
        { sprite: 'bird', x: 2.0, foot: 0.32, r: 0.06, depth: 0.5 },
        { sprite: 'tree', x: 0.4, foot: 0.74, r: 0.2, depth: 0.85 },
        { sprite: 'bench', x: 1.15, foot: 0.8, r: 0.15, depth: 0.85 },
        { sprite: 'slide', x: 1.85, foot: 0.78, r: 0.17, depth: 0.85 },
        { sprite: 'tree', x: 2.5, foot: 0.74, r: 0.2, depth: 0.85, flip: true },
      ],
      stops: STOPS,
      pickups: [{ id: 'c3-fish', item: 'driedFish', x: 1.15 }],
    },
    story:
      '烏鴉老大掉下三根黑羽毛，飛走的時候還嘎嘎叫著：「大王在市場等你們！」摩卡貓把羽毛插在寶咖咖的遮陽帽上，看起來像個小勇者。',
  },
  {
    id: 4,
    title: '熱鬧市場保衛戰',
    palette: 'market',
    decor: [
      { sprite: 'awning', x: 0.5, y: 0.08, r: 0.34 },
      { sprite: 'lantern', x: 0.09, y: 0.3, r: 0.08 },
      { sprite: 'lantern', x: 0.91, y: 0.3, r: 0.08, flip: true },
      { sprite: 'crate', x: 0.1, y: 0.6, r: 0.12 },
    ],
    nodes: [
      { kind: 'battle', foes: ['crab', 'rollingApple'] },
      { kind: 'battle', foes: ['rollingApple', 'crab', 'rollingApple'], drops: ['bottle'] },
      { kind: 'camp' },
      { kind: 'boss', foes: ['bigFish'], drops: ['driedFish', 'driedFish', 'cookie'] },
    ],
    world: {
      decor: [
        { sprite: 'awning', x: 0.5, foot: 0.3, r: 0.32, depth: 0.7 },
        { sprite: 'awning', x: 1.5, foot: 0.3, r: 0.32, depth: 0.7 },
        { sprite: 'awning', x: 2.5, foot: 0.3, r: 0.32, depth: 0.7 },
        { sprite: 'lantern', x: 1.0, foot: 0.44, r: 0.07, depth: 0.7 },
        { sprite: 'lantern', x: 2.0, foot: 0.44, r: 0.07, depth: 0.7, flip: true },
        { sprite: 'fishStall', x: 0.35, foot: 0.78, r: 0.22, depth: 0.85 },
        { sprite: 'crate', x: 1.15, foot: 0.84, r: 0.11 },
        { sprite: 'scale', x: 1.8, foot: 0.78, r: 0.12, depth: 0.85 },
        { sprite: 'crate', x: 2.4, foot: 0.84, r: 0.11, flip: true },
        { sprite: 'apple', x: 2.48, foot: 0.7, r: 0.05 },
      ],
      stops: STOPS,
      pickups: [{ id: 'c4-bottle', item: 'bottle', x: 0.4 }],
    },
    story:
      '大魚王撲通一聲跳回水桶。魚攤老闆送了一大包小魚乾當謝禮，摩卡貓開心到尾巴打了一個結。遠遠的，傳來海浪的聲音。',
  },
  {
    id: 5,
    title: '海邊的八爪大戰',
    palette: 'beach',
    decor: [
      { sprite: 'sunDisc', x: 0.86, y: 0.1, r: 0.1 },
      { sprite: 'beachUmbrella', x: 0.12, y: 0.4, r: 0.17 },
      { sprite: 'sandcastle', x: 0.9, y: 0.64, r: 0.12 },
    ],
    nodes: [
      { kind: 'battle', foes: ['greedyGull', 'greedyGull'] },
      { kind: 'battle', foes: ['jellyfish', 'greedyGull', 'jellyfish'], drops: ['cookie'] },
      { kind: 'camp' },
      { kind: 'boss', foes: ['octopus', 'greedyGull'], drops: ['bottle', 'bottle', 'driedFish'] },
    ],
    world: {
      decor: [
        { sprite: 'sunDisc', x: 0.8, foot: 0.26, r: 0.1, depth: 0.2 },
        { sprite: 'seagull', x: 1.6, foot: 0.3, r: 0.07, depth: 0.4 },
        { sprite: 'wave', x: 0.3, foot: 0.6, r: 0.16, depth: 0.7 },
        { sprite: 'wave', x: 1.0, foot: 0.6, r: 0.16, depth: 0.7, flip: true },
        { sprite: 'wave', x: 1.7, foot: 0.6, r: 0.16, depth: 0.7 },
        { sprite: 'wave', x: 2.4, foot: 0.6, r: 0.16, depth: 0.7, flip: true },
        { sprite: 'beachUmbrella', x: 0.4, foot: 0.76, r: 0.18, depth: 0.85 },
        { sprite: 'sandcastle', x: 1.15, foot: 0.84, r: 0.12 },
        { sprite: 'starfish', x: 1.8, foot: 0.9, r: 0.06 },
        { sprite: 'shell', x: 2.4, foot: 0.9, r: 0.05 },
      ],
      stops: STOPS,
      pickups: [
        { id: 'c5-cookie', item: 'cookie', x: 1.85 },
        { id: 'c5-bottle', item: 'bottle', x: 0.04 },
      ],
    },
    story:
      '大章魚噗地吐出一團墨汁，害羞地鑽回海裡。沙灘上留下一排小小的腳印，一直延伸到月亮升起的地方。今天晚上，要去夢裡走一趟了。',
  },
  {
    id: 6,
    title: '夢境的盡頭',
    palette: 'night',
    decor: [
      { sprite: 'moonWindow', x: 0.5, y: 0.1, r: 0.14 },
      { sprite: 'star', x: 0.12, y: 0.1, r: 0.06 },
      { sprite: 'star', x: 0.88, y: 0.18, r: 0.05 },
      { sprite: 'nightLight', x: 0.9, y: 0.46, r: 0.09 },
    ],
    nodes: [
      { kind: 'battle', foes: ['sleepySprite', 'nightmareCloud'] },
      { kind: 'battle', foes: ['nightmareCloud', 'sleepySprite', 'nightmareCloud'], drops: ['bottle'] },
      { kind: 'camp' },
      { kind: 'boss', foes: ['snoreKing'] },
    ],
    world: {
      decor: [
        { sprite: 'star', x: 0.2, foot: 0.18, r: 0.05, depth: 0.3 },
        { sprite: 'star', x: 0.9, foot: 0.3, r: 0.04, depth: 0.3 },
        { sprite: 'star', x: 1.7, foot: 0.14, r: 0.06, depth: 0.3 },
        { sprite: 'star', x: 2.5, foot: 0.26, r: 0.04, depth: 0.3 },
        { sprite: 'moonWindow', x: 1.3, foot: 0.44, r: 0.15, depth: 0.6 },
        { sprite: 'bed', x: 0.4, foot: 0.8, r: 0.24, depth: 0.85 },
        { sprite: 'pillow', x: 1.15, foot: 0.86, r: 0.1 },
        { sprite: 'slipper', x: 1.85, foot: 0.9, r: 0.07 },
        { sprite: 'nightLight', x: 2.45, foot: 0.8, r: 0.1, depth: 0.85 },
      ],
      stops: STOPS,
      pickups: [{ id: 'c6-fish', item: 'driedFish', x: 1.15 }],
    },
    story:
      '打呼嚕大王打了一個大大的哈欠：「我只是……想找人一起睡覺嘛。」寶咖咖把安撫娃娃抱回懷裡，拍拍大王的頭。大家一起躺下來，呼嚕——呼嚕——晚安。',
  },
];
