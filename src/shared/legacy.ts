import type { StorageLike } from './storage';

/**
 * Storage keys of the mini-games removed in the 2026-10 redesign (decisions.md D-01):
 * 找找看's progress and 圖案數獨's save. Deleted at every boot (`main.tsx`).
 */
export const LEGACY_KEYS: readonly string[] = ['baokaka.progress', 'baokaka.sudoku'];

/**
 * Every key the retired RPG 寶咖咖奇俠傳 ever saved under: the pre-redesign `baokaka.quest`, then
 * `.v2`–`.v6` (the list `src/quest/engine/save.ts` keeps, copied here so nothing outside
 * `src/quest/` imports it before #111 deletes it). 翻翻台北 cannot migrate them (GDD § 2.10);
 * the routing switch (#109) deletes them with `cleanupLegacyStorage(storage, { rpg: true })`
 * and the cover says one gentle line instead. Until then the still-routed RPG keeps using them.
 */
export const RPG_SAVE_KEYS: readonly string[] = [
  'baokaka.quest',
  'baokaka.quest.v2',
  'baokaka.quest.v3',
  'baokaka.quest.v4',
  'baokaka.quest.v5',
  'baokaka.quest.v6',
];

/** Any key under this prefix is an RPG save, including versions the list above doesn't know. */
export const RPG_KEY_PREFIX = 'baokaka.quest';

/** A real `Storage` can also list its keys; the fakes in tests may not. */
type ListableStorage = StorageLike & { readonly length: number; key(index: number): string | null };

const isListable = (storage: StorageLike): storage is ListableStorage =>
  typeof (storage as Partial<ListableStorage>).key === 'function' && typeof (storage as Partial<ListableStorage>).length === 'number';

/** The RPG keys present: the known list, plus any other `baokaka.quest*` key a real storage lists. */
function rpgKeysIn(storage: StorageLike): string[] {
  const found = new Set<string>();
  for (const key of RPG_SAVE_KEYS) {
    try {
      if (storage.getItem(key) !== null) found.add(key);
    } catch {
      // A storage that refuses one read may still answer the next
    }
  }
  try {
    if (isListable(storage)) {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(RPG_KEY_PREFIX)) found.add(key);
      }
    }
  } catch {
    // Listing is a bonus; the known list above already ran
  }
  return [...found];
}

/**
 * Whether this browser holds an old RPG save (any `baokaka.quest*` key). Never throws: no storage,
 * or one that refuses every access, reads as "no".
 */
export function hadRpgSave(storage: StorageLike | null): boolean {
  return storage !== null && rpgKeysIn(storage).length > 0;
}

/**
 * Deletes the retired keys. With `rpg: true` (the routing switch, #109) the RPG saves go too;
 * by default they stay, so the RPG that is still routed keeps its save. Never throws: private
 * browsing may refuse any storage access.
 */
export function cleanupLegacyStorage(storage: StorageLike | null, options: { rpg?: boolean } = {}): void {
  if (storage === null) return;
  const keys = options.rpg ? [...LEGACY_KEYS, ...rpgKeysIn(storage)] : LEGACY_KEYS;
  for (const key of keys) {
    try {
      storage.removeItem(key);
    } catch {
      // Nothing to do: the key stays behind and is harmless
    }
  }
}
