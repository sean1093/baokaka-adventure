import { describe, expect, test } from 'vitest';
import type { StorageLike } from '../../shared/storage';
import { freshRun } from './quest';
import { DEFAULT_SETTINGS, LEGACY_QUEST_KEY, QUEST_KEY, SAVE_VERSION, discardLegacyQuest, loadQuest, saveQuest, type QuestSave } from './save';
import type { Run } from './types';

const fakeStorage = (seed: Record<string, string> = {}): StorageLike & { cells: Record<string, string> } => {
  const cells: Record<string, string> = { ...seed };
  return {
    cells,
    getItem: (key) => cells[key] ?? null,
    setItem: (key, value) => {
      cells[key] = value;
    },
    removeItem: (key) => {
      delete cells[key];
    },
  };
};

/** A v2 record as it sits in storage, with one part of the run overridden. */
const stored = (run: Partial<Run>, extra: Record<string, unknown> = {}): Record<string, string> => ({
  [QUEST_KEY]: JSON.stringify({ version: 2, run: { ...freshRun(1), ...run }, sound: true, settings: { skipRides: false }, ...extra }),
});

const loadRun = (cells: Record<string, string>): Run => loadQuest(fakeStorage(cells)).save.run;

/** What the old 寶咖咖奇俠傳 wrote under `baokaka.quest`: note `stickers`, not `coins`. */
const LEGACY_RECORD = JSON.stringify({ run: { map: 'park', stickers: 42, level: 6 }, sound: true });

describe('loadQuest', () => {
  test('a v2 save round-trips identically', () => {
    const storage = fakeStorage();
    const run: Run = { ...freshRun(5), map: 'park', pos: { c: 3, r: 4 }, level: 6, xp: 300, coins: 42, flags: ['mochaJoined'] };
    const save: QuestSave = { run, sound: false, settings: { skipRides: true } };
    saveQuest(save, storage);
    expect(loadQuest(storage)).toEqual({ save, legacyReset: false });
  });

  test('writes a versioned record under the v2 key', () => {
    const storage = fakeStorage();
    saveQuest({ run: freshRun(1), sound: true, settings: DEFAULT_SETTINGS }, storage);
    expect(SAVE_VERSION).toBe(2);
    expect(Object.keys(storage.cells)).toEqual(['baokaka.quest.v2']);
    expect(JSON.parse(storage.cells[QUEST_KEY])).toMatchObject({ version: 2, sound: true, settings: { skipRides: false } });
  });

  test('falls back to a fresh run when nothing is saved', () => {
    const loaded = loadQuest(fakeStorage());
    expect(loaded.save.run.map).toBe('home');
    expect(loaded.save.settings).toEqual({ skipRides: false });
    expect(loaded.legacyReset).toBe(false);
  });

  test('a legacy save gives a fresh run with the notice, and is gone once discarded', () => {
    const storage = fakeStorage({ [LEGACY_QUEST_KEY]: LEGACY_RECORD });
    const first = loadQuest(storage);
    expect(first.legacyReset).toBe(true);
    expect(first.save.run).toMatchObject({ map: 'home', level: 1, coins: 0, flags: [] });
    discardLegacyQuest(storage);
    expect(storage.cells[LEGACY_QUEST_KEY]).toBeUndefined();
    expect(loadQuest(storage).legacyReset).toBe(false);
  });

  test('loading twice before the discard reports the reset both times (React StrictMode)', () => {
    const storage = fakeStorage({ [LEGACY_QUEST_KEY]: LEGACY_RECORD });
    expect(loadQuest(storage).legacyReset).toBe(true);
    expect(loadQuest(storage).legacyReset).toBe(true);
  });

  test('any content under the legacy key counts, even garbage', () => {
    expect(loadQuest(fakeStorage({ [LEGACY_QUEST_KEY]: '{not json' })).legacyReset).toBe(true);
  });

  test('a valid v2 save wins over a leftover legacy key', () => {
    const storage = fakeStorage({ ...stored({ level: 4 }), [LEGACY_QUEST_KEY]: LEGACY_RECORD });
    const loaded = loadQuest(storage);
    expect(loaded.legacyReset).toBe(false);
    expect(loaded.save.run.level).toBe(4);
  });

  test('a corrupt v2 save yields a fresh run without the notice', () => {
    const loaded = loadQuest(fakeStorage({ [QUEST_KEY]: '{not json' }));
    expect(loaded.legacyReset).toBe(false);
    expect(loaded.save.run.map).toBe('home');
  });

  test('rejects a record with the wrong version', () => {
    expect(loadRun(stored({ level: 4 }, { version: 1 })).level).toBe(1);
    expect(loadRun(stored({ level: 4 }, { version: undefined })).level).toBe(1);
  });

  test('rejects a record without valid settings', () => {
    expect(loadRun(stored({ level: 4 }, { settings: undefined })).level).toBe(1);
    expect(loadRun(stored({ level: 4 }, { settings: { skipRides: 'yes' } })).level).toBe(1);
  });

  test('rejects a run that still counts stickers', () => {
    const { coins: _coins, ...old } = freshRun(1);
    const cells = { [QUEST_KEY]: JSON.stringify({ version: 2, run: { ...old, level: 4, stickers: 10 }, sound: true, settings: DEFAULT_SETTINGS }) };
    expect(loadRun(cells).level).toBe(1);
  });

  test('rejects negative or fractional coins', () => {
    expect(loadRun(stored({ level: 4, coins: -1 })).level).toBe(1);
    expect(loadRun(stored({ level: 4, coins: 2.5 })).level).toBe(1);
  });

  test('rejects a position outside the map', () => {
    expect(loadRun(stored({ pos: { c: 99, r: 99 } })).pos).toEqual(freshRun(1).pos);
  });

  test('rejects an unknown map', () => {
    expect(loadRun(stored({ map: 'atlantis' as never })).flags).toEqual([]);
  });

  test('rejects a level past the cap', () => {
    expect(loadRun(stored({ level: 99 })).level).toBe(1);
  });

  test('rejects an empty party', () => {
    expect(loadRun(stored({ party: [] })).party).toEqual(['baokaka']);
  });

  test('rejects a consumable in an equipment slot', () => {
    expect(loadRun(stored({ equip: { baokaka: 'cookie', mocha: null, duck: null } as never })).equip.baokaka).toBeNull();
  });

  test('rejects an item count past the carry limit', () => {
    expect(loadRun(stored({ items: { cookie: 99 } })).items).toEqual({ cookie: 2 });
  });

  test('rejects an unknown item id', () => {
    expect(loadRun(stored({ items: { moonRock: 1 } as never })).items).toEqual({ cookie: 2 });
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
      coins: 210,
      flags: ['mochaJoined', 'duckJoined', 'octopusDone'],
      chapter: 7,
      cleared: true,
    };
    expect(loadRun(stored(far))).toEqual(far);
  });

  test('a storage that throws on every call gives a fresh run and no crash', () => {
    const angry: StorageLike = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('SecurityError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    const loaded = loadQuest(angry);
    expect(loaded.save.run.map).toBe('home');
    expect(loaded.legacyReset).toBe(false);
  });

  test('discarding never throws, even when storage refuses', () => {
    const stubborn: StorageLike = {
      getItem: () => LEGACY_RECORD,
      setItem: () => {},
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(() => discardLegacyQuest(stubborn)).not.toThrow();
    expect(() => discardLegacyQuest(null)).not.toThrow();
  });
});

describe('saveQuest', () => {
  test('never throws when storage refuses to write', () => {
    const angry: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };
    expect(() => saveQuest({ run: freshRun(1), sound: true, settings: DEFAULT_SETTINGS }, angry)).not.toThrow();
  });

  test('never throws when there is no storage at all', () => {
    expect(() => saveQuest({ run: freshRun(1), sound: true, settings: DEFAULT_SETTINGS }, null)).not.toThrow();
    expect(loadQuest(null).save.run.map).toBe('home');
  });
});
