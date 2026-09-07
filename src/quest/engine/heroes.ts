import type { HeroId, Inventory, Item, ItemId, Run, Spell, SpellId, Stats } from './types';
import { HERO_ORDER } from './types';

export const MAX_LEVEL = 12;

/** Cumulative XP needed to BE level index+1. Tuned by sim.test.ts against the foe tables. */
export const XP_TABLE: readonly number[] = [0, 22, 58, 108, 175, 265, 380, 520, 690, 900, 1150, 1450];

export const HEROES: Record<HeroId, { name: string; base: Stats; growth: Stats; blurb: string }> = {
  // Sturdy and even: the one who is always standing
  baokaka: {
    name: '寶咖咖',
    base: { hp: 60, mp: 12, atk: 9, def: 4, spd: 6, luck: 5 },
    growth: { hp: 11, mp: 3, atk: 2, def: 1, spd: 1, luck: 1 },
    blurb: '一歲的勇者。哭聲很大，抱抱很暖。',
  },
  // Quick, lucky, hits hard, and the party's healer
  mocha: {
    name: '摩卡貓',
    base: { hp: 46, mp: 16, atk: 11, def: 3, spd: 10, luck: 9 },
    growth: { hp: 8, mp: 4, atk: 3, def: 1, spd: 2, luck: 1 },
    blurb: '虎斑貓。動作快，爪子利，呼嚕聲能治病。',
  },
  // Fragile, deep 真氣, the party's storm caller
  duck: {
    name: '小鴨鴨',
    base: { hp: 40, mp: 24, atk: 6, def: 5, spd: 8, luck: 6 },
    growth: { hp: 7, mp: 5, atk: 1, def: 1, spd: 1, luck: 1 },
    blurb: '浴缸島的黃色小鴨。真氣很足，很吵。',
  },
};

const STAT_KEYS: readonly (keyof Stats)[] = ['hp', 'mp', 'atk', 'def', 'spd', 'luck'];

/** Level stats plus whatever the hero wears. */
export function heroStats(hero: HeroId, level: number, equip: ItemId | null = null): Stats {
  const { base, growth } = HEROES[hero];
  const bonus = equip ? ITEMS[equip].use : null;
  const stats = {} as Stats;
  for (const key of STAT_KEYS) {
    const worn = bonus?.kind === 'equip' ? (bonus.bonus[key] ?? 0) : 0;
    stats[key] = base[key] + growth[key] * (level - 1) + worn;
  }
  return stats;
}

export const SPELLS: Record<SpellId, Spell> = {
  throwBlock: {
    id: 'throwBlock',
    name: '丟積木',
    hero: 'baokaka',
    cost: 3,
    level: 1,
    effect: { kind: 'damage', power: 1.6, target: 'one' },
    fx: 'blocks',
    blurb: '用力丟一塊積木。',
  },
  bigCry: {
    id: 'bigCry',
    name: '哇哇大哭',
    hero: 'baokaka',
    cost: 5,
    level: 3,
    effect: { kind: 'damage', power: 1.0, target: 'all' },
    fx: 'shout',
    blurb: '哭聲震動整個房間，打到所有敵人。',
  },
  clapClap: {
    id: 'clapClap',
    name: '拍拍手',
    hero: 'baokaka',
    cost: 6,
    level: 5,
    effect: { kind: 'heal', ratio: 0.25, target: 'party' },
    fx: 'heal',
    blurb: '拍手鼓勵大家，全隊恢復體力。',
  },
  crawlDash: {
    id: 'crawlDash',
    name: '爬爬衝刺',
    hero: 'baokaka',
    cost: 8,
    level: 7,
    effect: { kind: 'damage', power: 2.6, target: 'one' },
    fx: 'impact',
    blurb: '用最快的速度爬過去撞一下。',
  },
  purr: {
    id: 'purr',
    name: '呼嚕嚕',
    hero: 'mocha',
    cost: 4,
    level: 1,
    effect: { kind: 'heal', ratio: 0.4, target: 'ally' },
    fx: 'heal',
    blurb: '靠著一個人呼嚕，恢復體力。',
  },
  pounce: {
    id: 'pounce',
    name: '撲擊',
    hero: 'mocha',
    cost: 4,
    level: 2,
    effect: { kind: 'damage', power: 1.8, target: 'one' },
    fx: 'claw',
    blurb: '壓低身子，撲上去。',
  },
  catnipFury: {
    id: 'catnipFury',
    name: '貓草狂暴',
    hero: 'mocha',
    cost: 7,
    level: 5,
    effect: { kind: 'damage', power: 1.2, target: 'all' },
    fx: 'claw',
    blurb: '聞了貓草之後亂抓一通，打到所有敵人。',
  },
  nineLives: {
    id: 'nineLives',
    name: '九命回春',
    hero: 'mocha',
    cost: 12,
    level: 8,
    effect: { kind: 'heal', ratio: 0.5, target: 'party', revive: true },
    fx: 'sparkle',
    blurb: '全隊恢復一半體力，倒下的人也站起來。',
  },
  splash: {
    id: 'splash',
    name: '水花四濺',
    hero: 'duck',
    cost: 5,
    level: 1,
    effect: { kind: 'damage', power: 1.1, target: 'all' },
    fx: 'splash',
    blurb: '拍打水面，水花潑到所有敵人。',
  },
  waterGun: {
    id: 'waterGun',
    name: '水槍',
    hero: 'duck',
    cost: 4,
    level: 3,
    effect: { kind: 'damage', power: 1.7, target: 'one' },
    fx: 'jet',
    blurb: '對準一個敵人噴一道水柱。',
  },
  bubbleShield: {
    id: 'bubbleShield',
    name: '泡泡護盾',
    hero: 'duck',
    cost: 6,
    level: 6,
    effect: { kind: 'shield' },
    fx: 'bubble',
    blurb: '吹出大泡泡包住全隊，這回合受到的傷害減半。',
  },
  bigWave: {
    id: 'bigWave',
    name: '大浪',
    hero: 'duck',
    cost: 12,
    level: 8,
    effect: { kind: 'damage', power: 2.0, target: 'all' },
    fx: 'wave',
    blurb: '整個浴缸的水一起湧過去。',
  },
};

/** The spells one hero knows at one party level, in learning order. */
export function spellsFor(hero: HeroId, level: number): Spell[] {
  return Object.values(SPELLS).filter((spell) => spell.hero === hero && spell.level <= level);
}

export const ITEMS: Record<ItemId, Item> = {
  cookie: { id: 'cookie', name: '小餅乾', sprite: 'cookie', blurb: '體力恢復 25。', price: 5, use: { kind: 'hp', amount: 25 } },
  bottle: { id: 'bottle', name: '奶瓶', sprite: 'bottle', blurb: '體力恢復 60。', price: 12, use: { kind: 'hp', amount: 60 } },
  banana: { id: 'banana', name: '香蕉', sprite: 'banana', blurb: '全隊體力恢復 40。', price: 25, use: { kind: 'hpAll', amount: 40 } },
  driedFish: { id: 'driedFish', name: '小魚乾', sprite: 'driedFish', blurb: '真氣恢復 20。', price: 10, use: { kind: 'mp', amount: 20 } },
  apple: { id: 'apple', name: '蘋果', sprite: 'apple', blurb: '一個人體力和真氣全滿。', price: 40, use: { kind: 'full' } },
  shell: { id: 'shell', name: '貝殼', sprite: 'shell', blurb: '聽聽海的聲音，倒下的人醒過來（一半體力）。', price: 30, use: { kind: 'revive', ratio: 0.5 } },
  clothBook: { id: 'clothBook', name: '布書', sprite: 'clothBook', blurb: '裝備：真氣 +15。', price: 50, use: { kind: 'equip', bonus: { mp: 15 } } },
  coinPurse: { id: 'coinPurse', name: '小錢包', sprite: 'coinPurse', blurb: '裝備：幸運 +8。', price: 50, use: { kind: 'equip', bonus: { luck: 8 } } },
  sunHat: { id: 'sunHat', name: '遮陽帽', sprite: 'sunHat', blurb: '裝備：防禦 +4。', price: 45, use: { kind: 'equip', bonus: { def: 4 } } },
  blanket: { id: 'blanket', name: '小被被', sprite: 'blanket', blurb: '裝備：體力 +25。', price: 60, use: { kind: 'equip', bonus: { hp: 25 } } },
  toyBoat: { id: 'toyBoat', name: '小船', sprite: 'toyBoat', blurb: '裝備：武術 +5。', price: 60, use: { kind: 'equip', bonus: { atk: 5 } } },
  star: { id: 'star', name: '星星髮夾', sprite: 'star', blurb: '裝備：身法 +6。', price: 60, use: { kind: 'equip', bonus: { spd: 6 } } },
  nightLight: { id: 'nightLight', name: '小夜燈', sprite: 'nightLight', blurb: '裝備：防禦 +8。', price: 80, use: { kind: 'equip', bonus: { def: 8 } } },
};

/** Inventory display order: consumables first, then things to wear. */
export const ITEM_ORDER: readonly ItemId[] = [
  'cookie',
  'bottle',
  'banana',
  'driedFish',
  'apple',
  'shell',
  'clothBook',
  'coinPurse',
  'sunHat',
  'blanket',
  'toyBoat',
  'star',
  'nightLight',
];

export const MAX_ITEM_COUNT = 9;

export const STARTING_ITEMS: Inventory = { cookie: 2 };

export const isEquip = (item: ItemId): boolean => ITEMS[item].use.kind === 'equip';

export function addItem(items: Inventory, item: ItemId, count = 1): Inventory {
  return { ...items, [item]: Math.min(MAX_ITEM_COUNT, (items[item] ?? 0) + count) };
}

export function removeItem(items: Inventory, item: ItemId): Inventory {
  const left = (items[item] ?? 0) - 1;
  const next = { ...items };
  if (left > 0) next[item] = left;
  else delete next[item];
  return next;
}

/** Stats of every hero in the party, as the battle and the menu show them. */
export function partyStats(run: Pick<Run, 'party' | 'level' | 'equip'>): Record<HeroId, Stats> {
  const stats = {} as Record<HeroId, Stats>;
  for (const hero of HERO_ORDER) stats[hero] = heroStats(hero, run.level, run.equip[hero]);
  return stats;
}
