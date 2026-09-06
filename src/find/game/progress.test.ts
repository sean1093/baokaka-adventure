import { describe, expect, test } from 'vitest';
import type { Progress } from './types';
import {
  DEFAULT_PROGRESS,
  PROGRESS_KEY,
  completeLevel,
  loadProgress,
  saveProgress,
} from './progress';

const fakeStorage = (seed?: string) => {
  const cells = new Map<string, string>();
  if (seed !== undefined) cells.set(PROGRESS_KEY, seed);
  return {
    cells,
    getItem: (key: string) => cells.get(key) ?? null,
    setItem: (key: string, value: string) => void cells.set(key, value),
  };
};

describe('loadProgress', () => {
  test('returns the default progress when nothing was saved', () => {
    expect(loadProgress(fakeStorage())).toEqual(DEFAULT_PROGRESS);
  });

  test('reads back previously saved progress', () => {
    const storage = fakeStorage();
    const saved: Progress = { unlockedLevel: 4, completed: [1, 2, 3], sound: false };
    saveProgress(saved, storage);
    expect(loadProgress(storage)).toEqual(saved);
  });

  test('falls back to defaults on malformed JSON without throwing', () => {
    expect(loadProgress(fakeStorage('{not json'))).toEqual(DEFAULT_PROGRESS);
  });

  test('falls back to defaults when a field has the wrong type', () => {
    const bad = JSON.stringify({ unlockedLevel: '3', completed: [1], sound: true });
    expect(loadProgress(fakeStorage(bad))).toEqual(DEFAULT_PROGRESS);
  });

  test('falls back to defaults when completed is not an array of numbers', () => {
    const bad = JSON.stringify({ unlockedLevel: 3, completed: ['1'], sound: true });
    expect(loadProgress(fakeStorage(bad))).toEqual(DEFAULT_PROGRESS);
  });

  test('falls back to defaults when unlockedLevel is below 1', () => {
    const bad = JSON.stringify({ unlockedLevel: 0, completed: [], sound: true });
    expect(loadProgress(fakeStorage(bad))).toEqual(DEFAULT_PROGRESS);
  });

  test('falls back to defaults when reading throws, as in private browsing', () => {
    const hostile = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => undefined,
    };
    expect(loadProgress(hostile)).toEqual(DEFAULT_PROGRESS);
  });

  test('returns defaults when no storage is available', () => {
    expect(loadProgress(null)).toEqual(DEFAULT_PROGRESS);
  });
});

describe('saveProgress', () => {
  test('a failed write from a full quota does not crash the game', () => {
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(() => saveProgress(DEFAULT_PROGRESS, full)).not.toThrow();
  });

  test('does not throw when no storage is available', () => {
    expect(() => saveProgress(DEFAULT_PROGRESS, null)).not.toThrow();
  });
});

describe('completeLevel', () => {
  test('completing level 1 unlocks level 2', () => {
    expect(completeLevel(DEFAULT_PROGRESS, 1, 6)).toEqual({
      unlockedLevel: 2,
      completed: [1],
      sound: true,
    });
  });

  test('replaying a finished level never rewinds progress', () => {
    const ahead: Progress = { unlockedLevel: 4, completed: [1, 2, 3], sound: true };
    expect(completeLevel(ahead, 1, 6)).toEqual(ahead);
  });

  test('keeps completed sorted and free of duplicates', () => {
    const p: Progress = { unlockedLevel: 4, completed: [3, 1], sound: true };
    expect(completeLevel(p, 2, 6).completed).toEqual([1, 2, 3]);
  });

  test('completing the last level does not unlock one that does not exist', () => {
    const p: Progress = { unlockedLevel: 6, completed: [1, 2, 3, 4, 5], sound: true };
    expect(completeLevel(p, 6, 6).unlockedLevel).toBe(6);
  });

  test('does not mutate the progress it was given', () => {
    const p: Progress = { unlockedLevel: 1, completed: [], sound: true };
    completeLevel(p, 1, 6);
    expect(p).toEqual({ unlockedLevel: 1, completed: [], sound: true });
  });
});
