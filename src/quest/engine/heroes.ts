import type { HeroId, Inventory, Item, ItemId, Skill, SkillId } from './types';

export const MAX_LEVEL = 6;
export const MAX_ENERGY = 5;
/** Energy at the start of every battle: enough for one 撲擊 straight away */
export const START_ENERGY = 2;

/** Cumulative XP needed to BE level index+1. Level 6 lands around the middle of chapter 5. */
export const XP_TABLE: readonly number[] = [0, 30, 80, 150, 240, 360];

export const HEROES: Record<HeroId, { name: string; hp: number; hpPerLevel: number; atk: number; atkPerLevel: number }> = {
  // The tank and support: more HP, softer hits
  baokaka: { name: '寶咖咖', hp: 60, hpPerLevel: 10, atk: 8, atkPerLevel: 2 },
  // The striker: fragile, hits hard, crits often
  mocha: { name: '摩卡貓', hp: 45, hpPerLevel: 8, atk: 11, atkPerLevel: 3 },
};

export function heroStats(hero: HeroId, level: number): { maxHp: number; atk: number } {
  const base = HEROES[hero];
  return {
    maxHp: base.hp + base.hpPerLevel * (level - 1),
    atk: base.atk + base.atkPerLevel * (level - 1),
  };
}

export const SKILLS: Record<SkillId, Skill> = {
  throwBlock: {
    id: 'throwBlock',
    name: '丟積木',
    hero: 'baokaka',
    cost: 0,
    gain: 1,
    unlockLevel: 1,
    effect: { kind: 'attack', power: 1, target: 'one', hits: 1, crit: 0.1, stun: 0 },
    blurb: '單體攻擊，元氣 +1',
  },
  bigCry: {
    id: 'bigCry',
    name: '大哭',
    hero: 'baokaka',
    cost: 2,
    gain: 0,
    unlockLevel: 1,
    effect: { kind: 'attack', power: 0.8, target: 'all', hits: 1, crit: 0, stun: 0.5 },
    blurb: '全體攻擊，一半機會嚇到敵人',
  },
  hug: {
    id: 'hug',
    name: '抱抱',
    hero: 'baokaka',
    cost: 1,
    gain: 0,
    unlockLevel: 3,
    effect: { kind: 'heal', ratio: 0.4, target: 'ally' },
    blurb: '一個夥伴回復 40%，倒下也能扶起',
  },
  superScream: {
    id: 'superScream',
    name: '無敵尖叫',
    hero: 'baokaka',
    cost: 3,
    gain: 0,
    unlockLevel: 5,
    effect: { kind: 'attack', power: 1.5, target: 'all', hits: 1, crit: 0, stun: 1 },
    blurb: '全體大攻擊，敵人一定嚇到',
  },
  scratch: {
    id: 'scratch',
    name: '貓抓',
    hero: 'mocha',
    cost: 0,
    gain: 1,
    unlockLevel: 1,
    effect: { kind: 'attack', power: 1, target: 'one', hits: 1, crit: 0.25, stun: 0 },
    blurb: '單體攻擊，元氣 +1，常常暴擊',
  },
  pounce: {
    id: 'pounce',
    name: '撲擊',
    hero: 'mocha',
    cost: 1,
    gain: 0,
    unlockLevel: 1,
    effect: { kind: 'attack', power: 1.8, target: 'one', hits: 1, crit: 0.3, stun: 0 },
    blurb: '單體重擊',
  },
  purr: {
    id: 'purr',
    name: '呼嚕嚕',
    hero: 'mocha',
    cost: 0,
    gain: 2,
    unlockLevel: 2,
    effect: { kind: 'heal', ratio: 0.12, target: 'party' },
    blurb: '兩個人回復 12%，元氣 +2',
  },
  frenzy: {
    id: 'frenzy',
    name: '貓草狂暴',
    hero: 'mocha',
    cost: 3,
    gain: 0,
    unlockLevel: 4,
    effect: { kind: 'attack', power: 0.75, target: 'random', hits: 4, crit: 0.3, stun: 0 },
    blurb: '亂抓 4 下，目標隨機',
  },
  guard: {
    id: 'guard',
    name: '防禦',
    hero: 'both',
    cost: 0,
    gain: 1,
    unlockLevel: 1,
    effect: { kind: 'guard' },
    blurb: '這回合受傷減半，元氣 +1',
  },
};

/** Skills in button order for one hero at one level. */
export function skillsFor(hero: HeroId, level: number): Skill[] {
  return Object.values(SKILLS).filter(
    (skill) => (skill.hero === hero || skill.hero === 'both') && skill.unlockLevel <= level,
  );
}

export const ITEMS: Record<ItemId, Item> = {
  bottle: {
    id: 'bottle',
    name: '奶瓶',
    sprite: 'bottle',
    blurb: '一個夥伴回復 50%',
    effect: { kind: 'heal', ratio: 0.5, target: 'ally' },
  },
  cookie: {
    id: 'cookie',
    name: '小餅乾',
    sprite: 'cookie',
    blurb: '兩個人都回復 30%',
    effect: { kind: 'heal', ratio: 0.3, target: 'party' },
  },
  driedFish: {
    id: 'driedFish',
    name: '小魚乾',
    sprite: 'driedFish',
    blurb: '元氣立刻全滿',
    effect: { kind: 'energy' },
  },
};

export const ITEM_ORDER: readonly ItemId[] = ['bottle', 'cookie', 'driedFish'];
export const MAX_ITEM_COUNT = 9;

export const STARTING_ITEMS: Inventory = { bottle: 2, cookie: 1, driedFish: 1 };
