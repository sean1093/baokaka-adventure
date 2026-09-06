/** Only these two methods are used, so a fake storage makes save code testable without jsdom. */
export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/** In private browsing, merely touching `window.localStorage` can throw SecurityError. */
export function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Reads and validates a JSON record. Malformed JSON, a wrong shape, a throwing storage or no
 * storage at all every return `undefined`; callers substitute a fresh default and the game goes on.
 */
export function loadJson<T>(key: string, isValid: (value: unknown) => value is T, storage: StorageLike | null): T | undefined {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function saveJson(key: string, value: unknown, storage: StorageLike | null): void {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing or a full quota: state lives in memory only and the game stays playable
  }
}
