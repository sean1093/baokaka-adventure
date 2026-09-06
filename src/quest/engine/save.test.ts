import { describe, expect, test } from 'vitest';
import { freshRun } from './quest';
import { QUEST_KEY, loadQuest, saveQuest } from './save';

const fakeStorage = (seed?: string) => {
  const cells: Record<string, string> = {};
  if (seed !== undefined) cells[QUEST_KEY] = seed;
  return {
    getItem: (key: string) => cells[key] ?? null,
    setItem: (key: string, value: string) => {
      cells[key] = value;
    },
  };
};

const fresh = { run: freshRun(), sound: true };

describe('loadQuest', () => {
  test('returns a fresh run when nothing was saved', () => {
    expect(loadQuest(fakeStorage())).toEqual(fresh);
  });

  test('reads back a saved run', () => {
    const storage = fakeStorage();
    const saved = { run: { ...freshRun(), chapter: 3, node: 2, level: 4, xp: 150, cleared: true }, sound: false };
    saveQuest(saved, storage);
    expect(loadQuest(storage)).toEqual(saved);
  });

  test('falls back on malformed JSON', () => {
    expect(loadQuest(fakeStorage('{nope'))).toEqual(fresh);
  });

  test('fills in an empty picked list for saves written before pickups existed', () => {
    const { picked: _picked, ...legacy } = freshRun();
    const loaded = loadQuest(fakeStorage(JSON.stringify({ run: { ...legacy, chapter: 2, node: 1 }, sound: true })));
    expect(loaded.run.picked).toEqual([]);
    expect(loaded.run.chapter).toBe(2);
  });

  test('rejects a picked list that is not a list of strings', () => {
    expect(loadQuest(fakeStorage(JSON.stringify({ run: { ...freshRun(), picked: [1] }, sound: true })))).toEqual(fresh);
  });

  test('falls back when the chapter or node does not exist', () => {
    expect(loadQuest(fakeStorage(JSON.stringify({ run: { ...freshRun(), chapter: 99 }, sound: true })))).toEqual(fresh);
    expect(loadQuest(fakeStorage(JSON.stringify({ run: { ...freshRun(), node: 40 }, sound: true })))).toEqual(fresh);
  });

  test('falls back when a field has the wrong type', () => {
    expect(loadQuest(fakeStorage(JSON.stringify({ run: { ...freshRun(), level: '2' }, sound: true })))).toEqual(fresh);
    expect(loadQuest(fakeStorage(JSON.stringify({ run: { ...freshRun(), items: { bottle: 1 } }, sound: true })))).toEqual(fresh);
    expect(loadQuest(fakeStorage(JSON.stringify({ run: freshRun(), sound: 'yes' })))).toEqual(fresh);
  });

  test('falls back when reading throws, as in private browsing', () => {
    const storage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {},
    };
    expect(loadQuest(storage)).toEqual(fresh);
  });

  test('returns a fresh run with no storage at all', () => {
    expect(loadQuest(null)).toEqual(fresh);
  });
});

describe('saveQuest', () => {
  test('swallows a throwing storage', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(() => saveQuest(fresh, storage)).not.toThrow();
  });
});
