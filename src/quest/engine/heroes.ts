import type { HeroId, Inventory, Item, ItemId, Run, Spell, SpellId, Stats } from './types';
import { HERO_ORDER } from './types';

export const MAX_LEVEL = 20;

/** Cumulative XP needed to BE level index+1 (story bible § 7). Tuned by sim.test.ts against the foe tables. */
export const XP_TABLE: readonly number[] = [
  0, 22, 58, 108, 175, 265, 380, 520, 690, 900, 1150, 1450, 1800, 2200, 2700, 3300, 4000, 4800, 5700, 6700,
];

/** Stats are the "Suggested stats" of story bible § 2.1; blurbs condense each hero's "Who" line. */
export const HEROES: Record<HeroId, { name: string; base: Stats; growth: Stats; blurb: string }> = {
  // Sturdy all-rounder: the one who is always standing
  baokaka: {
    name: '寶咖咖',
    base: { hp: 60, mp: 12, atk: 9, def: 5, spd: 6, luck: 6 },
    growth: { hp: 11, mp: 3, atk: 2, def: 1, spd: 1, luck: 1 },
    blurb: '明天就滿一歲。爬得超快，什麼都想抱抱。',
  },
  // Fast striker and the party's medic
  mocha: {
    name: '摩卡貓',
    base: { hp: 46, mp: 16, atk: 11, def: 3, spd: 10, luck: 9 },
    growth: { hp: 8, mp: 4, atk: 3, def: 1, spd: 2, luck: 1 },
    blurb: '七歲的虎斑貓，嘴巴很壞，心很軟。',
  },
  // Mage: deep 元氣, fragile, fast; hits everyone and shields the party
  magpie: {
    name: '阿藍',
    base: { hp: 40, mp: 24, atk: 7, def: 4, spd: 11, luck: 6 },
    growth: { hp: 7, mp: 5, atk: 2, def: 1, spd: 2, luck: 1 },
    blurb: '戴眼鏡的台灣藍鵲，自稱「藍教授」。',
  },
  // Tank and bruiser: huge HP, hard hits, slowest of all
  bear: {
    name: '黑糖',
    base: { hp: 80, mp: 10, atk: 12, def: 8, spd: 3, luck: 3 },
    growth: { hp: 14, mp: 2, atk: 3, def: 2, spd: 1, luck: 1 },
    blurb: '動物園的台灣黑熊，好大一隻，什麼都怕。',
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

/** 才藝: names, learn levels, costs, effects and flavour text from story bible § 2.1. */
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
    blurb: '哭聲大到整條街都醒了，打到所有敵人。',
  },
  clapClap: {
    id: 'clapClap',
    name: '拍拍手',
    hero: 'baokaka',
    cost: 6,
    level: 6,
    effect: { kind: 'heal', ratio: 0.25, target: 'party' },
    fx: 'heal',
    blurb: '拍手幫大家加油，全隊恢復體力。',
  },
  firstStep: {
    id: 'firstStep',
    name: '勇敢的第一步',
    hero: 'baokaka',
    cost: 10,
    level: 15,
    effect: { kind: 'damage', power: 3.0, target: 'one' },
    fx: 'impact',
    blurb: '站起來，往前走一步——然後撞過去。',
  },
  purr: {
    id: 'purr',
    name: '呼嚕嚕',
    hero: 'mocha',
    cost: 4,
    level: 1,
    effect: { kind: 'heal', ratio: 0.4, target: 'ally' },
    fx: 'heal',
    blurb: '靠在一個人身上呼嚕，恢復體力。',
  },
  clawCombo: {
    id: 'clawCombo',
    name: '喵喵連環爪',
    hero: 'mocha',
    cost: 4,
    level: 2,
    effect: { kind: 'damage', power: 1.8, target: 'one' },
    fx: 'claw',
    blurb: '左一爪、右一爪、再一爪。',
  },
  catnipFury: {
    id: 'catnipFury',
    name: '貓草狂歡',
    hero: 'mocha',
    cost: 7,
    level: 5,
    effect: { kind: 'damage', power: 1.2, target: 'all' },
    fx: 'claw',
    blurb: '聞了一口貓草，在敵人中間打滾亂抓。',
  },
  nineLives: {
    id: 'nineLives',
    name: '九命回春',
    hero: 'mocha',
    cost: 12,
    level: 11,
    effect: { kind: 'heal', ratio: 0.5, target: 'party', revive: true },
    fx: 'sparkle',
    blurb: '貓有九條命，分你們一條。',
  },
  featherRain: {
    id: 'featherRain',
    name: '羽毛雨',
    hero: 'magpie',
    cost: 5,
    level: 1,
    effect: { kind: 'damage', power: 1.1, target: 'all' },
    fx: 'dust',
    blurb: '抖一抖翅膀，藍色羽毛像雨一樣落下。',
  },
  divePeck: {
    id: 'divePeck',
    name: '俯衝啄啄',
    hero: 'magpie',
    cost: 4,
    level: 4,
    effect: { kind: 'damage', power: 1.9, target: 'one' },
    fx: 'jet',
    blurb: '從高處俯衝，啄一下就飛走。',
  },
  magpieBridge: {
    id: 'magpieBridge',
    name: '鵲橋護盾',
    hero: 'magpie',
    cost: 6,
    level: 7,
    effect: { kind: 'shield' },
    fx: 'bubble',
    blurb: '七夕的時候，喜鵲搭橋讓人相見；今天，藍鵲搭橋保護大家。',
  },
  cometTail: {
    id: 'cometTail',
    name: '長尾流星',
    hero: 'magpie',
    cost: 12,
    level: 13,
    effect: { kind: 'damage', power: 2.0, target: 'all' },
    fx: 'bolt',
    blurb: '長長的尾巴在空中劃出一道藍色流星。',
  },
  pawPat: {
    id: 'pawPat',
    name: '熊掌拍拍',
    hero: 'bear',
    cost: 4,
    level: 1,
    effect: { kind: 'damage', power: 2.0, target: 'one' },
    fx: 'thud',
    blurb: '很小心、很小心地拍一下。（還是很痛。）',
  },
  groundPound: {
    id: 'groundPound',
    name: '大地咚咚',
    hero: 'bear',
    cost: 7,
    level: 8,
    effect: { kind: 'damage', power: 1.3, target: 'all' },
    fx: 'impact',
    blurb: '原地跳一下，整片地板都在晃。',
  },
  sugarHug: {
    id: 'sugarHug',
    name: '黑糖暖暖',
    hero: 'bear',
    cost: 6,
    level: 10,
    effect: { kind: 'heal', ratio: 0.65, target: 'ally' },
    fx: 'heal',
    blurb: '給一個大大的熊抱，又暖又甜。',
  },
  moonCharge: {
    id: 'moonCharge',
    name: '月牙衝擊',
    hero: 'bear',
    cost: 12,
    level: 17,
    effect: { kind: 'damage', power: 3.2, target: 'one' },
    fx: 'bolt',
    blurb: '胸口的月牙發光，全力衝撞。',
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
  driedFish: { id: 'driedFish', name: '小魚乾', sprite: 'driedFish', blurb: '元氣恢復 20。', price: 10, use: { kind: 'mp', amount: 20 } },
  apple: { id: 'apple', name: '蘋果', sprite: 'apple', blurb: '一個人體力和元氣全滿。', price: 40, use: { kind: 'full' } },
  shell: { id: 'shell', name: '貝殼', sprite: 'shell', blurb: '聽聽海的聲音，倒下的人醒過來（一半體力）。', price: 30, use: { kind: 'revive', ratio: 0.5 } },
  clothBook: { id: 'clothBook', name: '布書', sprite: 'clothBook', blurb: '裝備：元氣 +15。', price: 50, use: { kind: 'equip', bonus: { mp: 15 } } },
  coinPurse: { id: 'coinPurse', name: '小錢包', sprite: 'coinPurse', blurb: '裝備：幸運 +8。', price: 50, use: { kind: 'equip', bonus: { luck: 8 } } },
  sunHat: { id: 'sunHat', name: '遮陽帽', sprite: 'sunHat', blurb: '裝備：防禦 +4。', price: 45, use: { kind: 'equip', bonus: { def: 4 } } },
  blanket: { id: 'blanket', name: '小被被', sprite: 'blanket', blurb: '裝備：體力 +25。', price: 60, use: { kind: 'equip', bonus: { hp: 25 } } },
  toyBoat: { id: 'toyBoat', name: '小船', sprite: 'toyBoat', blurb: '裝備：武力 +5。', price: 60, use: { kind: 'equip', bonus: { atk: 5 } } },
  star: { id: 'star', name: '星星髮夾', sprite: 'star', blurb: '裝備：身手 +6。', price: 60, use: { kind: 'equip', bonus: { spd: 6 } } },
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
