import type { StorageLike } from './storage';

/**
 * Storage keys of the mini-games removed in the 2026-10 redesign (decisions.md D-01):
 * 找找看's progress and 圖案數獨's save. The RPG's own key (`baokaka.quest`) is not touched here.
 */
export const LEGACY_KEYS: readonly string[] = ['baokaka.progress', 'baokaka.sudoku'];

/** Deletes the retired keys. Never throws: private browsing may refuse any storage access. */
export function cleanupLegacyStorage(storage: StorageLike | null): void {
  for (const key of LEGACY_KEYS) {
    try {
      storage?.removeItem(key);
    } catch {
      // Nothing to do: the key stays behind and is harmless
    }
  }
}
