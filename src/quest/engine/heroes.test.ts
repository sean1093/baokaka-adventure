import { describe, expect, test } from 'vitest';
import { HEROES, MAX_LEVEL, SPELLS, XP_TABLE, heroStats, spellsFor } from './heroes';
import { freshRun } from './quest';
import { gainXp } from './scene';
import { HERO_ORDER, type HeroId, type SpellEffect, type SpellId } from './types';

/** Story bible § 2.1, one row per 才藝: hero, id, name, level, cost, effect. */
const EXPECTED: [HeroId, SpellId, string, number, number, SpellEffect][] = [
  ['baokaka', 'throwBlock', '丟積木', 1, 3, { kind: 'damage', power: 1.6, target: 'one' }],
  ['baokaka', 'bigCry', '哇哇大哭', 3, 5, { kind: 'damage', power: 1.0, target: 'all' }],
  ['baokaka', 'clapClap', '拍拍手', 6, 6, { kind: 'heal', ratio: 0.25, target: 'party' }],
  ['baokaka', 'firstStep', '勇敢的第一步', 15, 10, { kind: 'damage', power: 3.0, target: 'one' }],
  ['mocha', 'purr', '呼嚕嚕', 1, 4, { kind: 'heal', ratio: 0.4, target: 'ally' }],
  ['mocha', 'clawCombo', '喵喵連環爪', 2, 4, { kind: 'damage', power: 1.8, target: 'one' }],
  ['mocha', 'catnipFury', '貓草狂歡', 5, 7, { kind: 'damage', power: 1.2, target: 'all' }],
  ['mocha', 'nineLives', '九命回春', 11, 12, { kind: 'heal', ratio: 0.5, target: 'party', revive: true }],
  ['magpie', 'featherRain', '羽毛雨', 1, 5, { kind: 'damage', power: 1.1, target: 'all' }],
  ['magpie', 'divePeck', '俯衝啄啄', 4, 4, { kind: 'damage', power: 1.9, target: 'one' }],
  ['magpie', 'magpieBridge', '鵲橋護盾', 7, 6, { kind: 'shield' }],
  ['magpie', 'cometTail', '長尾流星', 13, 12, { kind: 'damage', power: 2.0, target: 'all' }],
  ['bear', 'pawPat', '熊掌拍拍', 1, 4, { kind: 'damage', power: 2.0, target: 'one' }],
  ['bear', 'groundPound', '大地咚咚', 8, 7, { kind: 'damage', power: 1.3, target: 'all' }],
  ['bear', 'sugarHug', '黑糖暖暖', 10, 6, { kind: 'heal', ratio: 0.65, target: 'ally' }],
  ['bear', 'moonCharge', '月牙衝擊', 17, 12, { kind: 'damage', power: 3.2, target: 'one' }],
];

describe('heroes', () => {
  test('four of them, in join order', () => {
    expect(HERO_ORDER).toEqual(['baokaka', 'mocha', 'magpie', 'bear']);
    expect(HERO_ORDER.map((hero) => HEROES[hero].name)).toEqual(['寶咖咖', '摩卡貓', '阿藍', '黑糖']);
  });

  test('base and growth stats are the bible suggestions', () => {
    expect(HEROES.baokaka.base).toEqual({ hp: 60, mp: 12, atk: 9, def: 5, spd: 6, luck: 6 });
    expect(HEROES.baokaka.growth).toEqual({ hp: 11, mp: 3, atk: 2, def: 1, spd: 1, luck: 1 });
    expect(HEROES.mocha.base).toEqual({ hp: 46, mp: 16, atk: 11, def: 3, spd: 10, luck: 9 });
    expect(HEROES.mocha.growth).toEqual({ hp: 8, mp: 4, atk: 3, def: 1, spd: 2, luck: 1 });
    expect(HEROES.magpie.base).toEqual({ hp: 40, mp: 24, atk: 7, def: 4, spd: 11, luck: 6 });
    expect(HEROES.magpie.growth).toEqual({ hp: 7, mp: 5, atk: 2, def: 1, spd: 2, luck: 1 });
    expect(HEROES.bear.base).toEqual({ hp: 80, mp: 10, atk: 12, def: 8, spd: 3, luck: 3 });
    expect(HEROES.bear.growth).toEqual({ hp: 14, mp: 2, atk: 3, def: 2, spd: 1, luck: 1 });
    expect(heroStats('bear', 10).hp).toBe(80 + 14 * 9);
  });

  test('blurbs are one short sentence each', () => {
    for (const hero of HERO_ORDER) {
      expect(HEROES[hero].blurb.length).toBeGreaterThan(0);
      expect(HEROES[hero].blurb.length).toBeLessThanOrEqual(40);
    }
  });
});

describe('才藝', () => {
  test('SPELLS matches the bible table exactly', () => {
    expect(Object.keys(SPELLS).sort()).toEqual(EXPECTED.map(([, id]) => id).sort());
    for (const [hero, id, name, level, cost, effect] of EXPECTED) {
      expect(SPELLS[id], id).toMatchObject({ id, hero, name, level, cost, effect });
      expect(SPELLS[id].effect, id).toEqual(effect);
      expect(SPELLS[id].blurb.length, id).toBeGreaterThan(0);
    }
  });

  test('each hero has four, learned in level order', () => {
    for (const hero of HERO_ORDER) {
      const levels = spellsFor(hero, MAX_LEVEL).map((spell) => spell.level);
      expect(levels).toHaveLength(4);
      expect(levels).toEqual([...levels].sort((a, b) => a - b));
    }
  });
});

describe('level cap 20', () => {
  test('the XP table has 20 rising entries ending at 6700', () => {
    expect(MAX_LEVEL).toBe(20);
    expect(XP_TABLE).toEqual([0, 22, 58, 108, 175, 265, 380, 520, 690, 900, 1150, 1450, 1800, 2200, 2700, 3300, 4000, 4800, 5700, 6700]);
  });

  test('6700 XP is level 20, and nothing past it levels further', () => {
    const run = freshRun(1);
    const almost = gainXp(run, 6699);
    expect(almost.run.level).toBe(19);
    const capped = gainXp(almost.run, 1);
    expect(capped.run.level).toBe(20);
    expect(capped.levels).toBe(1);
    const beyond = gainXp(capped.run, 100000);
    expect(beyond.run.level).toBe(20);
    expect(beyond.levels).toBe(0);
    expect(beyond.run.xp).toBe(106700);
  });

  test('a level gained teaches the skills of every hero in the party', () => {
    const run = { ...freshRun(1), party: [...HERO_ORDER], level: 14, xp: XP_TABLE[13] };
    expect(gainXp(run, XP_TABLE[14] - run.xp).learned).toEqual(['firstStep']);
    const big = gainXp(run, XP_TABLE[16] - run.xp);
    expect(big.run.level).toBe(17);
    expect(big.learned).toEqual(['firstStep', 'moonCharge']);
  });
});
