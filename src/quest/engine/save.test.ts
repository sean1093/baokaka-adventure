import { describe, expect, test } from 'vitest';
import type { StorageLike } from '../../shared/storage';
import { freshRun } from './quest';
import { QUEST_KEY, loadQuest, saveQuest } from './save';
import type { Run } from './types';

const fakeStorage = (seed?: string): StorageLike => {
  const cells: Record<string, string> = {};
  if (seed !== undefined) cells[QUEST_KEY] = seed;
  return {
    getItem: (key) => cells[key] ?? null,
    setItem: (key, value) => {
      cells[key] = value;
    },
  };
};

const stored = (run: Partial<Run>): string => JSON.stringify({ run: { ...freshRun(1), ...run }, sound: true });

describe('loadQuest', () => {
  test('reads back what was saved', () => {
    const storage = fakeStorage();
    const run: Run = { ...freshRun(5), map: 'park', pos: { c: 3, r: 4 }, level: 6, xp: 300, stickers: 42, flags: ['mochaJoined'] };
    saveQuest({ run, sound: false }, storage);
    expect(loadQuest(storage)).toEqual({ run, sound: false });
  });

  test('falls back to a fresh run when nothing is saved', () => {
    expect(loadQuest(fakeStorage()).run.map).toBe('home');
  });

  test('survives malformed JSON', () => {
    expect(loadQuest(fakeStorage('{not json')).run.map).toBe('home');
  });

  test('rejects a position outside the map', () => {
    expect(loadQuest(fakeStorage(stored({ pos: { c: 99, r: 99 } }))).run.pos).toEqual(freshRun(1).pos);
  });

  test('rejects an unknown map', () => {
    expect(loadQuest(fakeStorage(stored({ map: 'atlantis' as never }))).run.flags).toEqual([]);
  });

  test('rejects a level past the cap', () => {
    expect(loadQuest(fakeStorage(stored({ level: 99 }))).run.level).toBe(1);
  });

  test('rejects an empty party', () => {
    expect(loadQuest(fakeStorage(stored({ party: [] }))).run.party).toEqual(['baokaka']);
  });

  test('rejects a consumable in an equipment slot', () => {
    const bad = stored({ equip: { baokaka: 'cookie', mocha: null, duck: null } as never });
    expect(loadQuest(fakeStorage(bad)).run.equip.baokaka).toBeNull();
  });

  test('rejects an item count past the carry limit', () => {
    expect(loadQuest(fakeStorage(stored({ items: { cookie: 99 } }))).run.items).toEqual({ cookie: 2 });
  });

  test('rejects an unknown item id', () => {
    expect(loadQuest(fakeStorage(stored({ items: { moonRock: 1 } as never }))).run.items).toEqual({ cookie: 2 });
  });

  test('keeps a run that is legitimately far along', () => {
    const far: Run = {
      ...freshRun(3),
      map: 'night',
      pos: { c: 7, r: 12 },
      party: ['baokaka', 'mocha', 'duck'],
      level: 11,
      xp: 1200,
      equip: { baokaka: 'blanket', mocha: 'star', duck: 'nightLight' },
      items: { bottle: 3, apple: 1 },
      stickers: 210,
      flags: ['mochaJoined', 'duckJoined', 'octopusDone'],
      chapter: 7,
      cleared: true,
    };
    expect(loadQuest(fakeStorage(JSON.stringify({ run: far, sound: true }))).run).toEqual(far);
  });
});

describe('saveQuest', () => {
  test('never throws when storage refuses to write', () => {
    const angry: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(() => saveQuest({ run: freshRun(1), sound: true }, angry)).not.toThrow();
  });

  test('never throws when there is no storage at all', () => {
    expect(() => saveQuest({ run: freshRun(1), sound: true }, null)).not.toThrow();
    expect(loadQuest(null).run.map).toBe('home');
  });
});
