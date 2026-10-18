import { browserStorage, loadJson, saveJson, type StorageLike } from '../../shared/storage';
import { FOES } from './foes';
import { ITEMS, MAX_ITEM_COUNT, MAX_LEVEL, isEquip } from './heroes';
import { MAPS } from './maps';
import { freshRun } from './quest';
import { HERO_ORDER, type FoeId, type HeroId, type ItemId, type Run } from './types';

/**
 * The save format. Bump the version and the key for any incompatible Run change; never migrate
 * across stories (decisions.md D-12): an older record is discarded and the title says so once.
 */
export const SAVE_VERSION = 4;
export const QUEST_KEY = 'baokaka.quest.v4';
/** The 寶咖咖奇俠傳 save from before the 抓周 redesign. Any content under it means "reset". */
export const LEGACY_QUEST_KEY = 'baokaka.quest';
/**
 * Every key an older save may sit under: the pre-redesign one, then each earlier version
 * (v2 had three heroes, issue #5 made it four; v3 had no 圖鑑 `seenFoes`, issue #7 added it).
 * Any content under any of them means "reset".
 */
export const LEGACY_QUEST_KEYS: readonly string[] = [LEGACY_QUEST_KEY, 'baokaka.quest.v2', 'baokaka.quest.v3'];

/** Player preferences that live beside the run. */
export type QuestSettings = {
  /** Skip the MRT ride cutscenes (issue #9) */
  skipRides: boolean;
};

export const DEFAULT_SETTINGS: QuestSettings = { skipRides: false };

export type QuestSave = { run: Run; sound: boolean; settings: QuestSettings };

/** What the title screen needs from a load: the save, and whether an old-story save was just discarded. */
export type LoadedQuest = { save: QuestSave; legacyReset: boolean };

/** The record as stored: the save plus its version stamp. */
type StoredSave = QuestSave & { version: typeof SAVE_VERSION };

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;
const isItem = (value: unknown): value is ItemId => typeof value === 'string' && value in ITEMS;
const isFoe = (value: unknown): value is FoeId => typeof value === 'string' && Object.prototype.hasOwnProperty.call(FOES, value);

function isNumberMap(value: unknown): value is Record<HeroId, number> {
  return typeof value === 'object' && value !== null && HERO_ORDER.every((hero) => isCount((value as Record<string, unknown>)[hero]));
}

function isRun(value: unknown): value is Run {
  if (typeof value !== 'object' || value === null) return false;
  const run = value as Partial<Run>;
  const map = run.map && MAPS[run.map];
  if (!map) return false;

  const inBounds =
    typeof run.pos === 'object' &&
    run.pos !== null &&
    isCount(run.pos.r) &&
    isCount(run.pos.c) &&
    run.pos.r < map.grid.length &&
    run.pos.c < map.grid[0].length;

  const equipOk =
    typeof run.equip === 'object' &&
    run.equip !== null &&
    HERO_ORDER.every((hero) => {
      const worn = (run.equip as Record<string, unknown>)[hero];
      return worn === null || (isItem(worn) && isEquip(worn));
    });

  const itemsOk =
    typeof run.items === 'object' &&
    run.items !== null &&
    Object.entries(run.items).every(([item, count]) => isItem(item) && isCount(count) && (count as number) <= MAX_ITEM_COUNT);

  return (
    inBounds &&
    equipOk &&
    itemsOk &&
    (run.facing === 'left' || run.facing === 'right') &&
    Array.isArray(run.party) &&
    run.party.length > 0 &&
    run.party.every((hero) => HERO_ORDER.includes(hero)) &&
    Number.isInteger(run.level) &&
    (run.level as number) >= 1 &&
    (run.level as number) <= MAX_LEVEL &&
    isCount(run.xp) &&
    isNumberMap(run.hp) &&
    isNumberMap(run.mp) &&
    isCount(run.coins) &&
    Array.isArray(run.flags) &&
    run.flags.every((flag) => typeof flag === 'string') &&
    Array.isArray(run.seenFoes) &&
    run.seenFoes.every(isFoe) &&
    new Set(run.seenFoes).size === run.seenFoes.length &&
    isCount(run.steps) &&
    Number.isFinite(run.seed) &&
    Number.isInteger(run.chapter) &&
    (run.chapter as number) >= 1 &&
    typeof run.cleared === 'boolean'
  );
}

function isSettings(value: unknown): value is QuestSettings {
  if (typeof value !== 'object' || value === null) return false;
  return typeof (value as Partial<QuestSettings>).skipRides === 'boolean';
}

function isStoredSave(value: unknown): value is StoredSave {
  if (typeof value !== 'object' || value === null) return false;
  const save = value as Partial<StoredSave>;
  return save.version === SAVE_VERSION && typeof save.sound === 'boolean' && isSettings(save.settings) && isRun(save.run);
}

/** True when any older key is present with any content at all. Never throws. */
function hasLegacy(storage: StorageLike | null): boolean {
  try {
    return LEGACY_QUEST_KEYS.some((key) => storage?.getItem(key) != null);
  } catch {
    return false;
  }
}

const freshSave = (): QuestSave => ({ run: freshRun(Date.now() | 0), sound: true, settings: { ...DEFAULT_SETTINGS } });

/**
 * A valid current save is loaded as is. Otherwise, if an older save is present, the result is a
 * fresh run with `legacyReset` so the title can explain the fresh start once; the caller then
 * deletes it with `discardLegacyQuest`. Anything else unreadable (a corrupt current record, no storage,
 * a throwing storage) quietly becomes a fresh run: the player never sees an error.
 *
 * Reading never writes: React may call a state initializer twice (StrictMode), and a load that
 * deleted the old key would answer the second call with `legacyReset: false`.
 */
export function loadQuest(storage: StorageLike | null = browserStorage()): LoadedQuest {
  const stored = loadJson(QUEST_KEY, isStoredSave, storage);
  if (stored) return { save: { run: stored.run, sound: stored.sound, settings: stored.settings }, legacyReset: false };
  return { save: freshSave(), legacyReset: hasLegacy(storage) };
}

/** Deletes every older save. Never throws; if storage refuses, the current save written next still wins. */
export function discardLegacyQuest(storage: StorageLike | null = browserStorage()): void {
  for (const key of LEGACY_QUEST_KEYS) {
    try {
      storage?.removeItem(key);
    } catch {
      // The key stays behind; once a current save exists it is never read again
    }
  }
}

export function saveQuest(save: QuestSave, storage: StorageLike | null = browserStorage()): void {
  const record: StoredSave = { version: SAVE_VERSION, run: save.run, sound: save.sound, settings: save.settings };
  saveJson(QUEST_KEY, record, storage);
}
