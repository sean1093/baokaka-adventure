import type { Foe, FoeId } from './types';

/**
 * The 18 搗蛋鬼. Numbers are tuned against the hero curve in heroes.ts by the headless
 * simulation in sim.test.ts: every boss must fall to a player who heals and rests, and the
 * later ones must punish a player who never does.
 */
export const FOES: Record<FoeId, Foe> = {
  // 第一章 客廳 (level 1-2)
  dustBunny: {
    id: 'dustBunny',
    name: '灰塵球',
    sprite: 'dustBunny',
    stats: { hp: 26, mp: 0, atk: 7, def: 1, spd: 4, luck: 2 },
    xp: 6,
    stickers: 3,
    moves: [
      { kind: 'attack', name: '滾過來', power: 1, target: 'one', fx: 'thud' },
      { kind: 'attack', name: '滾過來', power: 1, target: 'one', fx: 'thud' },
      { kind: 'guard', name: '縮成一團' },
    ],
  },
  sockMonster: {
    id: 'sockMonster',
    name: '髒襪子怪',
    sprite: 'sockMonster',
    stats: { hp: 40, mp: 0, atk: 9, def: 2, spd: 3, luck: 2 },
    xp: 9,
    stickers: 5,
    drop: { item: 'cookie', chance: 0.3 },
    moves: [
      { kind: 'attack', name: '甩襪子', power: 1, target: 'one', fx: 'thud' },
      { kind: 'attack', name: '臭臭攻擊', power: 0.7, target: 'all', fx: 'dust' },
    ],
  },
  blockGolem: {
    id: 'blockGolem',
    name: '積木巨人',
    sprite: 'blockGolem',
    stats: { hp: 250, mp: 0, atk: 15, def: 5, spd: 3, luck: 3 },
    xp: 40,
    stickers: 30,
    boss: true,
    taunt: '誰敢亂動我的積木！',
    moves: [
      { kind: 'attack', name: '積木拳', power: 1, target: 'one', fx: 'blocks' },
      { kind: 'guard', name: '疊高高' },
      { kind: 'attack', name: '積木雨', power: 0.7, target: 'all', fx: 'blocks' },
      { kind: 'attack', name: '積木重擊', power: 1.8, target: 'one', fx: 'impact' },
    ],
  },

  // 第二章 院子 (level 2-3)
  mosquito: {
    id: 'mosquito',
    name: '蚊子',
    sprite: 'mosquito',
    stats: { hp: 28, mp: 0, atk: 11, def: 1, spd: 12, luck: 6 },
    xp: 8,
    stickers: 4,
    moves: [
      { kind: 'attack', name: '叮一口', power: 1, target: 'one', fx: 'jet' },
      { kind: 'attack', name: '叮一口', power: 1, target: 'one', fx: 'jet' },
      { kind: 'heal', name: '吸飽飽', ratio: 0.3 },
    ],
  },
  snail: {
    id: 'snail',
    name: '蝸牛',
    sprite: 'snail',
    stats: { hp: 60, mp: 0, atk: 10, def: 6, spd: 2, luck: 1 },
    xp: 10,
    stickers: 5,
    drop: { item: 'cookie', chance: 0.3 },
    moves: [
      { kind: 'guard', name: '縮進殼裡' },
      { kind: 'attack', name: '黏液攻擊', power: 1.3, target: 'one', fx: 'splash' },
      { kind: 'attack', name: '殼殼撞', power: 1.3, target: 'one', fx: 'impact' },
    ],
  },

  // 第三章 公園 (level 3-5)
  pigeon: {
    id: 'pigeon',
    name: '鴿子',
    sprite: 'pigeon',
    stats: { hp: 58, mp: 0, atk: 13, def: 3, spd: 8, luck: 4 },
    xp: 12,
    stickers: 6,
    moves: [
      { kind: 'attack', name: '啄一下', power: 1, target: 'one', fx: 'slash' },
      { kind: 'attack', name: '拍翅膀', power: 0.7, target: 'all', fx: 'dust' },
      { kind: 'attack', name: '啄一下', power: 1, target: 'one', fx: 'slash' },
    ],
  },
  kiteGhost: {
    id: 'kiteGhost',
    name: '風箏幽靈',
    sprite: 'kiteGhost',
    stats: { hp: 54, mp: 0, atk: 14, def: 2, spd: 11, luck: 5 },
    xp: 13,
    stickers: 6,
    drop: { item: 'driedFish', chance: 0.25 },
    moves: [
      { kind: 'attack', name: '飄過來', power: 1, target: 'one', fx: 'dust' },
      { kind: 'attack', name: '線線纏繞', power: 1.4, target: 'one', fx: 'slash' },
    ],
  },
  moleKing: {
    id: 'moleKing',
    name: '鼴鼠王',
    sprite: 'moleKing',
    stats: { hp: 130, mp: 0, atk: 17, def: 5, spd: 5, luck: 3 },
    xp: 25,
    stickers: 14,
    drop: { item: 'bottle', chance: 0.5 },
    moves: [
      { kind: 'attack', name: '挖洞', power: 1, target: 'one', fx: 'dust' },
      { kind: 'guard', name: '躲進土裡' },
      { kind: 'attack', name: '土石流', power: 0.9, target: 'all', fx: 'dust' },
    ],
  },
  crowBoss: {
    id: 'crowBoss',
    name: '烏鴉老大',
    sprite: 'crowBoss',
    stats: { hp: 450, mp: 0, atk: 20, def: 6, spd: 9, luck: 5 },
    xp: 60,
    stickers: 45,
    boss: true,
    taunt: '嘎！亮晶晶的東西都是我的！',
    moves: [
      { kind: 'attack', name: '俯衝啄擊', power: 1.2, target: 'one', fx: 'slash' },
      { kind: 'attack', name: '黑羽狂風', power: 0.8, target: 'all', fx: 'dust' },
      { kind: 'attack', name: '俯衝啄擊', power: 1.2, target: 'one', fx: 'slash' },
      { kind: 'attack', name: '嘎嘎嘎', power: 1.7, target: 'one', fx: 'shout' },
    ],
  },

  // 第四章 市場 (level 5-6)
  crab: {
    id: 'crab',
    name: '螃蟹',
    sprite: 'crab',
    stats: { hp: 90, mp: 0, atk: 18, def: 8, spd: 4, luck: 3 },
    xp: 16,
    stickers: 8,
    moves: [
      { kind: 'attack', name: '夾一下', power: 1.1, target: 'one', fx: 'slash' },
      { kind: 'guard', name: '舉起大螯' },
      { kind: 'attack', name: '橫著走', power: 0.8, target: 'all', fx: 'impact' },
    ],
  },
  rollingApple: {
    id: 'rollingApple',
    name: '滾滾蘋果',
    sprite: 'rollingApple',
    stats: { hp: 74, mp: 0, atk: 20, def: 3, spd: 10, luck: 5 },
    xp: 15,
    stickers: 8,
    drop: { item: 'apple', chance: 0.15 },
    moves: [
      { kind: 'attack', name: '蘋果滾滾', power: 1, target: 'one', fx: 'thud' },
      { kind: 'attack', name: '蘋果滾滾', power: 1, target: 'one', fx: 'thud' },
      { kind: 'attack', name: '滾撞', power: 1.5, target: 'one', fx: 'impact' },
    ],
  },
  bigFish: {
    id: 'bigFish',
    name: '大魚',
    sprite: 'bigFish',
    stats: { hp: 560, mp: 0, atk: 23, def: 7, spd: 6, luck: 4 },
    xp: 90,
    stickers: 60,
    boss: true,
    taunt: '噗嚕噗嚕，誰在偷看我的魚攤？',
    moves: [
      { kind: 'attack', name: '尾巴拍', power: 1.1, target: 'one', fx: 'thud' },
      { kind: 'attack', name: '噴水柱', power: 0.9, target: 'all', fx: 'jet' },
      { kind: 'guard', name: '鱗片閃亮' },
      { kind: 'attack', name: '大魚翻身', power: 1.8, target: 'one', fx: 'wave' },
    ],
  },

  // 第六章 海邊 (level 6-8)
  greedyGull: {
    id: 'greedyGull',
    name: '貪食海鷗',
    sprite: 'greedyGull',
    stats: { hp: 110, mp: 0, atk: 23, def: 4, spd: 12, luck: 6 },
    xp: 22,
    stickers: 10,
    drop: { item: 'cookie', chance: 0.4 },
    moves: [
      { kind: 'attack', name: '搶食物', power: 1.1, target: 'one', fx: 'slash' },
      { kind: 'attack', name: '俯衝', power: 1.4, target: 'one', fx: 'impact' },
      { kind: 'attack', name: '海鷗合唱', power: 0.7, target: 'all', fx: 'shout' },
    ],
  },
  jellyfish: {
    id: 'jellyfish',
    name: '水母',
    sprite: 'jellyfish',
    stats: { hp: 125, mp: 0, atk: 21, def: 6, spd: 5, luck: 4 },
    xp: 20,
    stickers: 10,
    moves: [
      { kind: 'attack', name: '電一下', power: 1.2, target: 'one', fx: 'bolt' },
      { kind: 'heal', name: '漂一漂', ratio: 0.25 },
      { kind: 'attack', name: '觸手掃', power: 0.8, target: 'all', fx: 'slash' },
    ],
  },
  octopus: {
    id: 'octopus',
    name: '大章魚',
    sprite: 'octopus',
    stats: { hp: 980, mp: 0, atk: 30, def: 9, spd: 6, luck: 5 },
    xp: 130,
    stickers: 80,
    boss: true,
    taunt: '八隻手一起來！',
    moves: [
      { kind: 'attack', name: '觸手拍', power: 1.1, target: 'one', fx: 'thud' },
      { kind: 'attack', name: '墨汁噴射', power: 0.9, target: 'all', fx: 'splash' },
      { kind: 'attack', name: '觸手拍', power: 1.1, target: 'one', fx: 'thud' },
      { kind: 'attack', name: '八爪纏繞', power: 1.9, target: 'one', fx: 'impact' },
    ],
  },

  // 第七章 棉被山 (level 8-10)
  sleepySprite: {
    id: 'sleepySprite',
    name: '小睡魔',
    sprite: 'sleepySprite',
    stats: { hp: 145, mp: 0, atk: 26, def: 6, spd: 11, luck: 6 },
    xp: 26,
    stickers: 12,
    drop: { item: 'driedFish', chance: 0.3 },
    moves: [
      { kind: 'attack', name: '撒瞌睡粉', power: 0.8, target: 'all', fx: 'sparkle' },
      { kind: 'attack', name: '枕頭砸', power: 1.3, target: 'one', fx: 'thud' },
    ],
  },
  nightmareCloud: {
    id: 'nightmareCloud',
    name: '惡夢雲',
    sprite: 'nightmareCloud',
    stats: { hp: 168, mp: 0, atk: 28, def: 5, spd: 8, luck: 4 },
    xp: 30,
    stickers: 14,
    drop: { item: 'bottle', chance: 0.3 },
    moves: [
      { kind: 'attack', name: '雷聲隆隆', power: 1, target: 'all', fx: 'shout' },
      { kind: 'attack', name: '閃電', power: 1.5, target: 'one', fx: 'bolt' },
      { kind: 'heal', name: '吸收水氣', ratio: 0.2 },
    ],
  },
  snoreKing: {
    id: 'snoreKing',
    name: '打呼嚕大王',
    sprite: 'snoreKing',
    stats: { hp: 1300, mp: 0, atk: 33, def: 10, spd: 5, luck: 5 },
    xp: 200,
    stickers: 100,
    boss: true,
    taunt: '呼……嚕……誰吵我……',
    moves: [
      { kind: 'attack', name: '呼嚕音波', power: 0.9, target: 'all', fx: 'shout' },
      { kind: 'attack', name: '翻身壓', power: 1.4, target: 'one', fx: 'impact' },
      { kind: 'guard', name: '翻進棉被' },
      { kind: 'attack', name: '超級大鼾', power: 1.2, target: 'all', fx: 'shout' },
      { kind: 'attack', name: '夢遊拳', power: 2.0, target: 'one', fx: 'impact' },
    ],
  },
};
