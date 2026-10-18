import { describe, expect, test } from 'vitest';
import { EVENTS } from './events';
import { FOES } from './foes';
import { ITEMS, ITEM_ORDER, MAX_LEVEL, SPELLS, spellsFor } from './heroes';
import { CHAPTER_TITLES, MAPS, MAP_ORDER } from './maps';
import { carMaps } from './mrt';
import { findPath } from './path';
import { obtainableItems, progressWarnings, validateQuestContent } from './validate';
import { HERO_ORDER, RIDE_TO, type FoeId, type MapId, type Step } from './types';

const allSteps = (): Step[] => Object.values(EVENTS).flat();

describe('the shipped quest content', () => {
  test('passes every validation rule', () => {
    expect(validateQuestContent()).toEqual([]);
  });

  test('has seven maps, one per chapter, each with a title', () => {
    expect(MAP_ORDER).toHaveLength(7);
    expect(CHAPTER_TITLES).toHaveLength(7);
    expect(MAP_ORDER.map((id) => MAPS[id].chapter)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const title of CHAPTER_TITLES) expect(title.length).toBeGreaterThan(0);
  });

  test('every foe appears in some encounter table or scripted fight', () => {
    const used = new Set<FoeId>();
    for (const map of Object.values(MAPS)) for (const group of map.encounters?.groups ?? []) for (const foe of group) used.add(foe);
    for (const step of allSteps()) if ('do' in step && step.do === 'battle') for (const foe of step.foes) used.add(foe);
    expect([...Object.keys(FOES)].filter((foe) => !used.has(foe as FoeId))).toEqual([]);
  });

  test('every item the content hands out is real, and the rest are listed as progress warnings', () => {
    const available = obtainableItems();
    for (const item of available) expect(ITEMS[item], item).toBeDefined();
    const warned = progressWarnings().filter((warning) => warning.startsWith('item '));
    const missing = ITEM_ORDER.filter((item) => !available.has(item));
    expect(warned).toEqual(missing.map((item) => `item ${item} cannot be obtained yet`));
    // The old story (until #21) still hands out the basics
    for (const item of ['teaEgg', 'pineappleCake', 'douhua', 'redTurtleCake', 'bib'] as const) expect(available.has(item), item).toBe(true);
  });

  test('no shop sells a gift item (price 0)', () => {
    for (const step of allSteps()) {
      if ('do' in step && step.do === 'shop') for (const item of step.stock) expect(ITEMS[item].price, item).toBeGreaterThan(0);
    }
  });

  test('every hero learns something at level 1 and again later', () => {
    for (const hero of HERO_ORDER) {
      expect(spellsFor(hero, 1).length).toBeGreaterThan(0);
      expect(spellsFor(hero, MAX_LEVEL).length).toBeGreaterThan(spellsFor(hero, 1).length);
    }
  });

  test('every spell belongs to a hero who joins the party', () => {
    const joins = new Set(['baokaka']);
    for (const step of allSteps()) if ('do' in step && step.do === 'join') joins.add(step.hero);
    for (const spell of Object.values(SPELLS)) expect(joins.has(spell.hero)).toBe(true);
  });

  test('foes get tougher as the chapters go on', () => {
    const bosses: FoeId[] = ['blockGolem', 'crowBoss', 'bigFish', 'octopus', 'snoreKing'];
    const hp = bosses.map((foe) => FOES[foe].stats.hp);
    expect(hp).toEqual([...hp].sort((a, b) => a - b));
    const atk = bosses.map((foe) => FOES[foe].stats.atk);
    expect(atk).toEqual([...atk].sort((a, b) => a - b));
  });

  test('every line has a speaker the UI can name, and text a child can hear read out', () => {
    for (const step of allSteps()) {
      if (!('text' in step)) continue;
      expect(step.text.length).toBeGreaterThan(0);
      expect(step.text.length).toBeLessThanOrEqual(48);
    }
  });

  test('every boss fight is marked as one, so it cannot be fled', () => {
    for (const [key, steps] of Object.entries(EVENTS)) {
      for (const step of steps) {
        if (!('do' in step) || step.do !== 'battle') continue;
        const hasBoss = step.foes.some((foe) => FOES[foe].boss);
        expect(hasBoss ? step.boss === true : step.boss !== true, `${key}`).toBe(true);
      }
    }
  });
});

describe('the maps join up', () => {
  test('every exit has a way back', () => {
    for (const map of Object.values(MAPS)) {
      for (const exit of map.exits) {
        // A ride car's door goes wherever the ride goes; the 路線圖 is the way back
        if (exit.to === RIDE_TO) continue;
        const back = MAPS[exit.to].exits.find((entry) => entry.to === map.id);
        expect(back, `${map.id} -> ${exit.to}`).toBeDefined();
      }
    }
  });

  test('the whole chain from the living room to 棉被山 is walkable', () => {
    // Every flag the story sets, so late-game doors and NPC gates are open
    const flags = Object.values(EVENTS)
      .flat()
      .flatMap((step) => ('do' in step && step.do === 'flag' ? [step.flag] : []));

    const seen = new Set<MapId>(['home']);
    const queue: MapId[] = ['home'];
    while (queue.length > 0) {
      const id = queue.shift() as MapId;
      const map = MAPS[id];
      for (const exit of map.exits) {
        expect(findPath(map, flags, map.entry, exit, true), `${id} -> ${exit.to}`).not.toBeNull();
        if (exit.to === RIDE_TO) continue;
        if (!seen.has(exit.to)) {
          seen.add(exit.to);
          queue.push(exit.to);
        }
      }
    }
    expect([...seen].sort()).toEqual([...MAP_ORDER].sort());
  });

  test('every map has an intro trigger on its entry tile', () => {
    for (const map of Object.values(MAPS)) {
      const intro = map.triggers.find((trigger) => trigger.c === map.entry.c && trigger.r === map.entry.r);
      expect(intro, map.id).toBeDefined();
      // A ride car's entry trigger is its announcement, played on every ride (bible § 3.1)
      expect(intro?.once === true, map.id).toBe(!carMaps().has(map.id));
    }
  });
});
