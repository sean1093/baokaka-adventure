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

/**
 * The item catalogue: story bible § 6.1 *Consumables* and § 6.2 *Equipment* (effects and prices),
 * blurbs from script § *Items: in-game names & blurbs* (the bible's for the three consumables the
 * script leaves out; the equipment it leaves out got a short line in the same voice, decisions D-25).
 * `price: 0` is a gift or quest reward ("—" in the tables): never sold, never bought.
 *
 * TEMP icons until #19 (item art). Each item borrows the closest existing sprite:
 *   teaEgg → stone          pineappleCake → cookie     chickenCutlet → driedFish
 *   douhua → bucket         bubbleTea → bottle         brownSugarMilk → bottle
 *   braisedRice → bucket    mangoIce → banana          railBento → crate
 *   meatBall → apple        grassJellyTea → bottle     mysteryFood → toyBox
 *   redTurtleCake → shell   bib → blanket              flipFlops → slipper
 *   gradCap → clothBook     helmet → sunHat            tigerShoes → slipper
 *   flowerVest → blanket    amulet → coinPurse         neckPillow → pillow
 *   raincoat → beachUmbrella plushCharm → comfortDoll  travelerHat → sunHat
 *   deliveryBag → crate     luckyCat → coinPurse       moonPassCharm → star
 *   bellCollar → lantern    profGlasses → clothBook    courageScarf → blanket
 *   tigerHat → sunHat       pinwheel → kite            clerkVest → blanket
 *   championBelt → star     goldAmulet → coinPurse     earthCane → signpost
 */
export const ITEMS: Record<ItemId, Item> = {
  // § 6.1 Consumables
  teaEgg: { id: 'teaEgg', name: '茶葉蛋', sprite: 'stone', blurb: '便利商店的電鍋裡，永遠有一顆在等你。體力 +30。', price: 8, use: { kind: 'hp', amount: 30 } },
  pineappleCake: { id: 'pineappleCake', name: '鳳梨酥', sprite: 'cookie', blurb: '外皮酥酥，內餡酸甜。體力 +70。', price: 20, use: { kind: 'hp', amount: 70 } },
  chickenCutlet: { id: 'chickenCutlet', name: '雞排', sprite: 'driedFish', blurb: '比臉還大。體力 +160。', price: 45, use: { kind: 'hp', amount: 160 } },
  douhua: { id: 'douhua', name: '豆花', sprite: 'bucket', blurb: '滑滑嫩嫩。元氣 +20。', price: 15, use: { kind: 'mp', amount: 20 } },
  bubbleTea: { id: 'bubbleTea', name: '珍珠奶茶', sprite: 'bottle', blurb: '台灣之光。元氣 +45。', price: 35, use: { kind: 'mp', amount: 45 } },
  // "Full MP, one hero": the reducer and the battle cap MP at the hero's maximum
  brownSugarMilk: { id: 'brownSugarMilk', name: '黑糖珍奶', sprite: 'bottle', blurb: '黑糖最喜歡的。元氣全滿。', price: 80, use: { kind: 'mp', amount: 999 } },
  braisedRice: { id: 'braisedRice', name: '滷肉飯', sprite: 'bucket', blurb: '一人一碗。全隊體力 +50。', price: 40, use: { kind: 'hpAll', amount: 50 } },
  mangoIce: { id: 'mangoIce', name: '芒果冰', sprite: 'banana', blurb: '夏天的味道。全隊體力 +130。', price: 90, use: { kind: 'hpAll', amount: 130 } },
  railBento: { id: 'railBento', name: '鐵路便當', sprite: 'crate', blurb: '排骨、滷蛋、醃黃瓜。一人體力和元氣全滿。', price: 60, use: { kind: 'full' } },
  meatBall: { id: 'meatBall', name: '肉圓', sprite: 'apple', blurb: 'Q彈的皮，香香的肉。體力 +110。', price: 35, use: { kind: 'hp', amount: 110 } },
  grassJellyTea: { id: 'grassJellyTea', name: '仙草茶', sprite: 'bottle', blurb: '涼涼的，黑黑的。元氣 +30。', price: 25, use: { kind: 'mp', amount: 30 } },
  mysteryFood: { id: 'mysteryFood', name: '神秘排隊美食', sprite: 'toyBox', blurb: '排了兩個小時。不知道是什麼，可是全隊體力全滿。', price: 0, use: { kind: 'hpAll', amount: 999 } },
  redTurtleCake: { id: 'redTurtleCake', name: '紅龜粿', sprite: 'shell', blurb: '生日要吃紅龜粿，呷百二。倒下的人醒過來。', price: 40, use: { kind: 'revive', ratio: 0.5 } },

  // § 6.2 Equipment (one slot per hero)
  bib: { id: 'bib', name: '口水巾', sprite: 'blanket', blurb: '阿嬤縫的。裝備：防禦 +3。', price: 25, use: { kind: 'equip', bonus: { def: 3 } } },
  flipFlops: { id: 'flipFlops', name: '藍白拖', sprite: 'slipper', blurb: '爸爸的。台灣人的戰鬥鞋。裝備：武力 +5。', price: 40, use: { kind: 'equip', bonus: { atk: 5 } } },
  gradCap: { id: 'gradCap', name: '學士帽', sprite: 'clothBook', blurb: '圖書館台階上撿到的。裝備：元氣 +15。', price: 60, use: { kind: 'equip', bonus: { mp: 15 } } },
  helmet: { id: 'helmet', name: '安全帽', sprite: 'sunHat', blurb: '騎車要戴，走路也可以戴。裝備：防禦 +8。', price: 80, use: { kind: 'equip', bonus: { def: 8 } } },
  tigerShoes: { id: 'tigerShoes', name: '虎頭鞋', sprite: 'slipper', blurb: '鞋頭有老虎，走路有力氣。裝備：身手 +6。', price: 90, use: { kind: 'equip', bonus: { spd: 6 } } },
  flowerVest: { id: 'flowerVest', name: '花布背心', sprite: 'blanket', blurb: '紅紅的花布，阿姨親手做。裝備：體力 +45。', price: 100, use: { kind: 'equip', bonus: { hp: 45 } } },
  amulet: { id: 'amulet', name: '平安符', sprite: 'coinPurse', blurb: '保平安。裝備：幸運 +10。', price: 0, use: { kind: 'equip', bonus: { luck: 10 } } },
  neckPillow: { id: 'neckPillow', name: '旅行頸枕', sprite: 'pillow', blurb: '推車阿伯送的，軟軟的。裝備：體力 +30、防禦 +5。', price: 85, use: { kind: 'equip', bonus: { hp: 30, def: 5 } } },
  raincoat: { id: 'raincoat', name: '機車雨衣', sprite: 'beachUmbrella', blurb: '颱風天的好朋友。裝備：防禦 +12、體力 +25。', price: 180, use: { kind: 'equip', bonus: { def: 12, hp: 25 } } },
  plushCharm: { id: 'plushCharm', name: '小熊吊飾', sprite: 'comfortDoll', blurb: '娃娃機夾到的小熊。裝備：幸運 +8、防禦 +4。', price: 0, use: { kind: 'equip', bonus: { luck: 8, def: 4 } } },
  travelerHat: { id: 'travelerHat', name: '旅行者的帽子', sprite: 'sunHat', blurb: '背包客哥哥的帽子。裝備：身手 +8、防禦 +6。', price: 0, use: { kind: 'equip', bonus: { spd: 8, def: 6 } } },
  deliveryBag: { id: 'deliveryBag', name: '外送保溫袋', sprite: 'crate', blurb: '月亮外送的大袋子。裝備：體力 +40、防禦 +6。', price: 0, use: { kind: 'equip', bonus: { hp: 40, def: 6 } } },
  luckyCat: { id: 'luckyCat', name: '招財貓', sprite: 'coinPurse', blurb: '一直招手的貓。裝備：幸運 +20。', price: 0, use: { kind: 'equip', bonus: { luck: 20 } } },
  moonPassCharm: { id: 'moonPassCharm', name: '月亮線紀念票', sprite: 'star', blurb: '月亮線乘客的紀念。裝備：身手 +6、元氣 +20。', price: 0, use: { kind: 'equip', bonus: { spd: 6, mp: 20 } } },
  bellCollar: { id: 'bellCollar', name: '摩卡的鈴鐺項圈', sprite: 'lantern', blurb: '小時候的鈴鐺。裝備：身手 +10、幸運 +12。', price: 0, only: 'mocha', use: { kind: 'equip', bonus: { spd: 10, luck: 12 } } },
  profGlasses: { id: 'profGlasses', name: '藍教授的眼鏡', sprite: 'clothBook', blurb: '畢業的證明。裝備：元氣 +35、武力 +6。', price: 0, only: 'magpie', use: { kind: 'equip', bonus: { mp: 35, atk: 6 } } },
  courageScarf: { id: 'courageScarf', name: '勇氣圍巾', sprite: 'blanket', blurb: '爬上山頂的勇氣。裝備：體力 +80、防禦 +10。', price: 0, only: 'bear', use: { kind: 'equip', bonus: { hp: 80, def: 10 } } },
  tigerHat: { id: 'tigerHat', name: '阿嬤的虎頭帽', sprite: 'sunHat', blurb: '阿嬤一針一線縫的。裝備：體力 +60、防禦 +8、幸運 +8。', price: 0, only: 'baokaka', use: { kind: 'equip', bonus: { hp: 60, def: 8, luck: 8 } } },
  pinwheel: { id: 'pinwheel', name: '小風車', sprite: 'kite', blurb: '咻咻送的，一吹就轉。裝備：身手 +10、幸運 +6。', price: 0, use: { kind: 'equip', bonus: { spd: 10, luck: 6 } } },
  clerkVest: { id: 'clerkVest', name: '店員背心', sprite: 'blanket', blurb: '歡迎光臨！裝備：幸運 +15、身手 +8。', price: 0, use: { kind: 'equip', bonus: { luck: 15, spd: 8 } } },
  championBelt: { id: 'championBelt', name: '冠軍腰帶', sprite: 'star', blurb: '老朋友擂台的冠軍。裝備：武力 +12、體力 +60。', price: 0, use: { kind: 'equip', bonus: { atk: 12, hp: 60 } } },
  goldAmulet: { id: 'goldAmulet', name: '金平安符', sprite: 'coinPurse', blurb: '土地公的獎品。裝備：幸運 +25、防禦 +6。', price: 0, use: { kind: 'equip', bonus: { luck: 25, def: 6 } } },
  earthCane: { id: 'earthCane', name: '土地公的拐杖', sprite: 'signpost', blurb: '一直在旁邊守護你的那個人的拐杖。全能力提升。', price: 0, use: { kind: 'equip', bonus: { atk: 8, def: 8, spd: 5, luck: 10 } } },
};

/** Inventory display order: consumables first, then things to wear (both in bible table order). */
export const ITEM_ORDER: readonly ItemId[] = Object.keys(ITEMS) as ItemId[];

/** True when this hero may wear this item: anything that isn't signature gear, or their own. */
export const canWear = (hero: HeroId, item: ItemId): boolean => isEquip(item) && (ITEMS[item].only ?? hero) === hero;

export const MAX_ITEM_COUNT = 9;

/** The 紅包's coins come from an event in Ch1; the bag starts with two tea eggs. */
export const STARTING_ITEMS: Inventory = { teaEgg: 2 };

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
