import { describe, expect, test } from 'vitest';
import { cleanupLegacyStorage } from './legacy';
import type { StorageLike } from './storage';

const fakeStorage = (cells: Record<string, string>): StorageLike => ({
  getItem: (key) => cells[key] ?? null,
  setItem: (key, value) => {
    cells[key] = value;
  },
  removeItem: (key) => {
    delete cells[key];
  },
});

describe('cleanupLegacyStorage', () => {
  test('removes the find and sudoku keys and keeps the RPG save', () => {
    const cells = { 'baokaka.progress': '{}', 'baokaka.sudoku': '{}', 'baokaka.quest': '{"run":1}', other: 'x' };
    cleanupLegacyStorage(fakeStorage(cells));
    expect(cells).toEqual({ 'baokaka.quest': '{"run":1}', other: 'x' });
  });

  test('is a no-op when the keys are already gone', () => {
    const cells = { 'baokaka.quest': '{}' };
    cleanupLegacyStorage(fakeStorage(cells));
    expect(cells).toEqual({ 'baokaka.quest': '{}' });
  });

  test('tolerates a storage that throws, and still tries every key', () => {
    const tried: string[] = [];
    const angry: StorageLike = {
      getItem: () => null,
      setItem: () => {},
      removeItem: (key) => {
        tried.push(key);
        throw new Error('SecurityError');
      },
    };
    expect(() => cleanupLegacyStorage(angry)).not.toThrow();
    expect(tried).toEqual(['baokaka.progress', 'baokaka.sudoku']);
  });

  test('tolerates no storage at all', () => {
    expect(() => cleanupLegacyStorage(null)).not.toThrow();
  });
});
