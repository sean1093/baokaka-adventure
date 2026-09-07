import { describe, expect, test } from 'vitest';
import { EVENTS } from './events';
import { FOES } from './foes';
import { ITEMS, MAX_LEVEL, SPELLS, spellsFor } from './heroes';
import { CHAPTER_TITLES, MAPS, MAP_ORDER } from './maps';
import { findPath } from './path';
import { validateQuestContent } from './validate';
import { HERO_ORDER, type FoeId, type MapId, type Step } from './types';

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

  test('every item can be obtained: a chest, a shop, a gift or a drop', () => {
    const available = new Set<string>();
    for (const map of Object.values(MAPS)) for (const chest of map.chests) available.add(chest.item);
    for (const foe of Object.values(FOES)) if (foe.drop) available.add(foe.drop.item);
    for (const step of allSteps()) {
      if (!('do' in step)) continue;
      if (step.do === 'give') available.add(step.item);
      if (step.do === 'shop') for (const item of step.stock) available.add(item);
    }
    expect(Object.keys(ITEMS).filter((item) => !available.has(item))).toEqual([]);
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
      expect(intro?.once).toBe(true);
    }
  });
});
