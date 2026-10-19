import { describe, expect, test } from 'vitest';
import { RPG_SAVE_KEYS, cleanupLegacyStorage, hadRpgSave } from './legacy';
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

describe('the RPG saves', () => {
  const listable = (cells: Record<string, string>): StorageLike & { length: number; key(i: number): string | null } => ({
    ...fakeStorage(cells),
    get length() {
      return Object.keys(cells).length;
    },
    key: (i) => Object.keys(cells)[i] ?? null,
  });

  test('hadRpgSave finds every known RPG key', () => {
    for (const key of RPG_SAVE_KEYS) expect(hadRpgSave(fakeStorage({ [key]: '{}' }))).toBe(true);
    expect(RPG_SAVE_KEYS).toEqual(['baokaka.quest', 'baokaka.quest.v2', 'baokaka.quest.v3', 'baokaka.quest.v4', 'baokaka.quest.v5', 'baokaka.quest.v6']);
  });

  test('hadRpgSave finds unknown baokaka.quest* keys when the storage can list keys', () => {
    expect(hadRpgSave(fakeStorage({ 'baokaka.quest.v7': '{}' }))).toBe(false);
    expect(hadRpgSave(listable({ 'baokaka.quest.v7': '{}' }))).toBe(true);
  });

  test('hadRpgSave is false for a new player, other keys, no storage or a throwing one', () => {
    expect(hadRpgSave(fakeStorage({}))).toBe(false);
    expect(hadRpgSave(listable({ 'popup.save.v1': '{}', 'baokaka.progress': '{}' }))).toBe(false);
    expect(hadRpgSave(null)).toBe(false);
    const angry: StorageLike & { length: number; key(i: number): string | null } = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {},
      removeItem: () => {},
      get length(): number {
        throw new Error('SecurityError');
      },
      key: () => null,
    };
    expect(hadRpgSave(angry)).toBe(false);
  });

  test('cleanupLegacyStorage with rpg removes the RPG saves too, listed or not', () => {
    const cells = { 'baokaka.progress': '{}', 'baokaka.quest': '{}', 'baokaka.quest.v6': '{}', 'baokaka.quest.v9': '{}', 'popup.save.v1': '{}' };
    cleanupLegacyStorage(listable(cells), { rpg: true });
    expect(cells).toEqual({ 'popup.save.v1': '{}' });
    expect(() => cleanupLegacyStorage(null, { rpg: true })).not.toThrow();
  });
});
