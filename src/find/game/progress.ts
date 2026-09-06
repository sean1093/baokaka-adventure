import type { Progress } from './types';
import { browserStorage, loadJson, saveJson, type StorageLike } from '../../shared/storage';

export const PROGRESS_KEY = 'baokaka.progress';

export const DEFAULT_PROGRESS: Progress = { unlockedLevel: 1, completed: [], sound: true };

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
  const saved = loadJson(PROGRESS_KEY, isProgress, storage);
  if (!saved) return fresh();
  return { ...saved, completed: [...saved.completed].sort((a, b) => a - b) };
}

export function saveProgress(progress: Progress, storage: StorageLike | null = browserStorage()): void {
  saveJson(PROGRESS_KEY, progress, storage);
}

/** spec §9: unlockedLevel = max(previous, min(n + 1, last level)), so replaying an old level never rewinds. */
export function completeLevel(progress: Progress, levelId: number, lastLevelId: number): Progress {
  return {
    ...progress,
    completed: [...new Set([...progress.completed, levelId])].sort((a, b) => a - b),
    unlockedLevel: Math.max(progress.unlockedLevel, Math.min(levelId + 1, lastLevelId)),
  };
}
