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
  test('沒有存過就給預設進度', () => {
    expect(loadProgress(fakeStorage())).toEqual(DEFAULT_PROGRESS);
  });

  test('讀回先前存的進度', () => {
    const storage = fakeStorage();
    const saved: Progress = { unlockedLevel: 4, completed: [1, 2, 3], sound: false };
    saveProgress(saved, storage);
    expect(loadProgress(storage)).toEqual(saved);
  });

  test('JSON 壞掉就給預設進度，不拋錯', () => {
    expect(loadProgress(fakeStorage('{壞掉的 json'))).toEqual(DEFAULT_PROGRESS);
  });

  test('欄位型別不對就給預設進度', () => {
    const bad = JSON.stringify({ unlockedLevel: '3', completed: [1], sound: true });
    expect(loadProgress(fakeStorage(bad))).toEqual(DEFAULT_PROGRESS);
  });

  test('completed 不是數字陣列就給預設進度', () => {
    const bad = JSON.stringify({ unlockedLevel: 3, completed: ['1'], sound: true });
    expect(loadProgress(fakeStorage(bad))).toEqual(DEFAULT_PROGRESS);
  });

  test('unlockedLevel 小於 1 就給預設進度', () => {
    const bad = JSON.stringify({ unlockedLevel: 0, completed: [], sound: true });
    expect(loadProgress(fakeStorage(bad))).toEqual(DEFAULT_PROGRESS);
  });

  test('讀取本身拋錯（隱私模式）就給預設進度', () => {
    const hostile = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => undefined,
    };
    expect(loadProgress(hostile)).toEqual(DEFAULT_PROGRESS);
  });

  test('沒有 storage 可用時給預設進度', () => {
    expect(loadProgress(null)).toEqual(DEFAULT_PROGRESS);
  });
});

describe('saveProgress', () => {
  test('寫入失敗（配額滿）不會讓遊戲掛掉', () => {
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(() => saveProgress(DEFAULT_PROGRESS, full)).not.toThrow();
  });

  test('沒有 storage 可用時不會拋錯', () => {
    expect(() => saveProgress(DEFAULT_PROGRESS, null)).not.toThrow();
  });
});

describe('completeLevel', () => {
  test('完成第 1 關會解鎖第 2 關', () => {
    expect(completeLevel(DEFAULT_PROGRESS, 1, 6)).toEqual({
      unlockedLevel: 2,
      completed: [1],
      sound: true,
    });
  });

  test('重玩已完成的關卡不會讓進度倒退', () => {
    const ahead: Progress = { unlockedLevel: 4, completed: [1, 2, 3], sound: true };
    expect(completeLevel(ahead, 1, 6)).toEqual(ahead);
  });

  test('completed 保持升冪且不重複', () => {
    const p: Progress = { unlockedLevel: 4, completed: [3, 1], sound: true };
    expect(completeLevel(p, 2, 6).completed).toEqual([1, 2, 3]);
  });

  test('完成最後一關不會解鎖不存在的關卡', () => {
    const p: Progress = { unlockedLevel: 6, completed: [1, 2, 3, 4, 5], sound: true };
    expect(completeLevel(p, 6, 6).unlockedLevel).toBe(6);
  });

  test('不會修改傳入的進度物件', () => {
    const p: Progress = { unlockedLevel: 1, completed: [], sound: true };
    completeLevel(p, 1, 6);
    expect(p).toEqual({ unlockedLevel: 1, completed: [], sound: true });
  });
});
