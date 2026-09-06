import type { Foe, FoeId } from './types';

/**
 * The 18 搗蛋鬼. Numbers are tuned against the hero curve in heroes.ts by the headless
 * simulation in quest.sim.test.ts: every chapter must be beatable by a plain strategy, and
 * every boss must be able to knock a hero down when the player ignores its telegraphed hit.
 */
export const FOES: Record<FoeId, Foe> = {
  // Chapter 1 客廳
  dustBunny: {
    id: 'dustBunny',
    name: '灰塵球',
    sprite: 'dustBunny',
    maxHp: 40,
    atk: 6,
    xp: 6,
    moves: [
      { kind: 'attack', name: '滾過來', power: 1, target: 'one' },
      { kind: 'attack', name: '滾過來', power: 1, target: 'one' },
      { kind: 'guard', name: '縮成一團' },
    ],
  },
  sockMonster: {
    id: 'sockMonster',
    name: '髒襪子怪',
    sprite: 'sockMonster',
    maxHp: 55,
    atk: 7,
    xp: 8,
    moves: [
      { kind: 'attack', name: '甩襪子', power: 1, target: 'one' },
      { kind: 'attack', name: '臭臭攻擊', power: 0.7, target: 'all' },
      { kind: 'attack', name: '甩襪子', power: 1, target: 'one' },
    ],
  },
  blockGolem: {
    id: 'blockGolem',
    name: '積木巨人',
    sprite: 'blockGolem',
    maxHp: 150,
    atk: 12,
    xp: 25,
    boss: true,
    taunt: '誰敢亂動我的積木！',
    moves: [
      { kind: 'attack', name: '積木拳', power: 1, target: 'one' },
      { kind: 'guard', name: '疊高高' },
      { kind: 'charge', name: '舉起巨拳' },
      { kind: 'attack', name: '積木重擊', power: 2.2, target: 'one' },
      { kind: 'attack', name: '積木雨', power: 0.8, target: 'all' },
    ],
  },

  // Chapter 2 院子
  mosquito: {
    id: 'mosquito',
    name: '蚊子',
    sprite: 'mosquito',
    maxHp: 36,
    atk: 8,
    xp: 7,
    moves: [
      { kind: 'attack', name: '叮一口', power: 1, target: 'one' },
      { kind: 'attack', name: '叮一口', power: 1, target: 'one' },
      { kind: 'heal', name: '吸飽飽', ratio: 0.3 },
    ],
  },
  snail: {
    id: 'snail',
    name: '蝸牛',
    sprite: 'snail',
    maxHp: 70,
    atk: 7,
    xp: 8,
    moves: [
      { kind: 'guard', name: '縮進殼裡' },
      { kind: 'attack', name: '黏液攻擊', power: 1.3, target: 'one' },
      { kind: 'guard', name: '縮進殼裡' },
      { kind: 'attack', name: '殼殼撞', power: 1.3, target: 'one' },
    ],
  },
  moleKing: {
    id: 'moleKing',
    name: '地鼠大王',
    sprite: 'moleKing',
    maxHp: 210,
    atk: 15,
    xp: 30,
    boss: true,
    taunt: '這個院子的土都是我的！',
    moves: [
      { kind: 'attack', name: '挖土攻擊', power: 1, target: 'one' },
      { kind: 'guard', name: '鑽進洞裡' },
      { kind: 'attack', name: '從地底突襲', power: 1.8, target: 'one' },
      { kind: 'attack', name: '丟泥巴', power: 0.8, target: 'all' },
      { kind: 'heal', name: '吃蚯蚓', ratio: 0.2 },
    ],
  },

  // Chapter 3 公園
  pigeon: {
    id: 'pigeon',
    name: '搶食鴿子',
    sprite: 'pigeon',
    maxHp: 58,
    atk: 11,
    xp: 9,
    moves: [
      { kind: 'attack', name: '啄一下', power: 1, target: 'one' },
      { kind: 'attack', name: '拍翅膀', power: 0.7, target: 'all' },
      { kind: 'attack', name: '啄一下', power: 1, target: 'one' },
    ],
  },
  kiteGhost: {
    id: 'kiteGhost',
    name: '風箏怪',
    sprite: 'kiteGhost',
    maxHp: 65,
    atk: 11,
    xp: 10,
    moves: [
      { kind: 'attack', name: '尾巴掃', power: 1, target: 'one' },
      { kind: 'charge', name: '飛高高' },
      { kind: 'attack', name: '俯衝', power: 2, target: 'one' },
    ],
  },
  crowBoss: {
    id: 'crowBoss',
    name: '烏鴉老大',
    sprite: 'crowBoss',
    maxHp: 270,
    atk: 20,
    xp: 35,
    boss: true,
    taunt: '嘎嘎！亮晶晶的東西都歸我！',
    moves: [
      { kind: 'attack', name: '啄擊', power: 1, target: 'one' },
      { kind: 'attack', name: '黑羽風暴', power: 0.9, target: 'all' },
      { kind: 'charge', name: '盤旋' },
      { kind: 'attack', name: '大俯衝', power: 2.2, target: 'one' },
      { kind: 'heal', name: '整理羽毛', ratio: 0.15 },
    ],
  },

  // Chapter 4 市場
  crab: {
    id: 'crab',
    name: '螃蟹',
    sprite: 'crab',
    maxHp: 85,
    atk: 13,
    xp: 11,
    moves: [
      { kind: 'guard', name: '舉起鉗子' },
      { kind: 'attack', name: '鉗擊', power: 1.4, target: 'one' },
      { kind: 'attack', name: '橫著走撞', power: 1, target: 'one' },
    ],
  },
  rollingApple: {
    id: 'rollingApple',
    name: '蘋果滾滾',
    sprite: 'rollingApple',
    maxHp: 68,
    atk: 14,
    xp: 11,
    moves: [
      { kind: 'attack', name: '滾撞', power: 1, target: 'one' },
      { kind: 'attack', name: '蘋果雨', power: 0.8, target: 'all' },
      { kind: 'attack', name: '滾撞', power: 1, target: 'one' },
    ],
  },
  bigFish: {
    id: 'bigFish',
    name: '大魚王',
    sprite: 'bigFish',
    maxHp: 330,
    atk: 22,
    xp: 40,
    boss: true,
    taunt: '小魚乾？想都別想！',
    moves: [
      { kind: 'attack', name: '魚尾巴打', power: 1.1, target: 'one' },
      { kind: 'attack', name: '大水花', power: 0.9, target: 'all' },
      { kind: 'guard', name: '躲進水桶' },
      { kind: 'charge', name: '深呼吸' },
      { kind: 'attack', name: '超級甩尾', power: 2.4, target: 'one' },
    ],
  },

  // Chapter 5 海邊
  greedyGull: {
    id: 'greedyGull',
    name: '搶食海鷗',
    sprite: 'greedyGull',
    maxHp: 90,
    atk: 16,
    xp: 13,
    moves: [
      { kind: 'attack', name: '搶東西', power: 1, target: 'one' },
      { kind: 'attack', name: '翅膀掃', power: 0.8, target: 'all' },
      { kind: 'attack', name: '啄啄啄', power: 1.2, target: 'one' },
    ],
  },
  jellyfish: {
    id: 'jellyfish',
    name: '水母',
    sprite: 'jellyfish',
    maxHp: 100,
    atk: 16,
    xp: 13,
    moves: [
      { kind: 'attack', name: '電一下', power: 1, target: 'one' },
      { kind: 'guard', name: '飄來飄去' },
      { kind: 'attack', name: '觸手纏', power: 1.3, target: 'one' },
    ],
  },
  octopus: {
    id: 'octopus',
    name: '大章魚',
    sprite: 'octopus',
    maxHp: 360,
    atk: 24,
    xp: 45,
    boss: true,
    taunt: '八隻手打你們兩個，太簡單了！',
    moves: [
      { kind: 'attack', name: '八爪拍', power: 0.9, target: 'all' },
      { kind: 'attack', name: '觸手甩', power: 1.2, target: 'one' },
      { kind: 'guard', name: '噴墨汁' },
      { kind: 'charge', name: '捲起觸手' },
      { kind: 'attack', name: '八爪亂打', power: 1.4, target: 'all' },
      { kind: 'heal', name: '泡泡浴', ratio: 0.15 },
    ],
  },

  // Chapter 6 夢境
  sleepySprite: {
    id: 'sleepySprite',
    name: '小睡魔',
    sprite: 'sleepySprite',
    maxHp: 95,
    atk: 19,
    xp: 15,
    moves: [
      { kind: 'attack', name: '撒瞌睡粉', power: 1, target: 'one' },
      { kind: 'attack', name: '枕頭打', power: 1, target: 'one' },
      { kind: 'heal', name: '打個盹', ratio: 0.25 },
    ],
  },
  nightmareCloud: {
    id: 'nightmareCloud',
    name: '惡夢雲',
    sprite: 'nightmareCloud',
    maxHp: 100,
    atk: 20,
    xp: 16,
    moves: [
      { kind: 'attack', name: '下雨雨', power: 0.8, target: 'all' },
      { kind: 'charge', name: '轟隆隆' },
      { kind: 'attack', name: '打雷', power: 2, target: 'one' },
    ],
  },
  snoreKing: {
    id: 'snoreKing',
    name: '打呼嚕大王',
    sprite: 'snoreKing',
    maxHp: 430,
    atk: 28,
    xp: 60,
    boss: true,
    taunt: '呼嚕——這個娃娃……是我的了……呼嚕——',
    moves: [
      { kind: 'attack', name: '枕頭砸', power: 1.1, target: 'one' },
      { kind: 'attack', name: '大打呼', power: 1, target: 'all' },
      { kind: 'guard', name: '蓋棉被' },
      { kind: 'charge', name: '深深吸氣' },
      { kind: 'attack', name: '震天呼嚕', power: 1.8, target: 'all' },
      { kind: 'heal', name: '翻個身', ratio: 0.12 },
    ],
  },
};
