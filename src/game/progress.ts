import type { Progress } from './types';

export const PROGRESS_KEY = 'baokaka.progress';

export const DEFAULT_PROGRESS: Progress = { unlockedLevel: 1, completed: [], sound: true };

/** 只用得到這兩個方法，注入假 storage 就能測，不需要 jsdom。 */
export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/** 隱私瀏覽模式下，光是碰 `window.localStorage` 就可能拋 SecurityError。 */
function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

const fresh = (): Progress => ({ ...DEFAULT_PROGRESS, completed: [] });

function isProgress(value: unknown): value is Progress {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Progress>;
  return (
    Number.isInteger(candidate.unlockedLevel) &&
    (candidate.unlockedLevel as number) >= 1 &&
    Array.isArray(candidate.completed) &&
    candidate.completed.every(Number.isInteger) &&
    typeof candidate.sound === 'boolean'
  );
}

export function loadProgress(storage: StorageLike | null = browserStorage()): Progress {
  try {
    const raw = storage?.getItem(PROGRESS_KEY);
    if (!raw) return fresh();
    const parsed: unknown = JSON.parse(raw);
    if (!isProgress(parsed)) return fresh();
    return { ...parsed, completed: [...parsed.completed].sort((a, b) => a - b) };
  } catch {
    return fresh();
  }
}

export function saveProgress(progress: Progress, storage: StorageLike | null = browserStorage()): void {
  try {
    storage?.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // 隱私瀏覽或配額不足：進度只活在記憶體，遊戲繼續可玩（spec §9）
  }
}

/** spec §9：unlockedLevel = max(舊值, min(n + 1, 最後一關))，重玩舊關卡不會讓進度倒退。 */
export function completeLevel(progress: Progress, levelId: number, lastLevelId: number): Progress {
  return {
    ...progress,
    completed: [...new Set([...progress.completed, levelId])].sort((a, b) => a - b),
    unlockedLevel: Math.max(progress.unlockedLevel, Math.min(levelId + 1, lastLevelId)),
  };
}
