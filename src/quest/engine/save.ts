import { browserStorage, loadJson, saveJson, type StorageLike } from '../../shared/storage';
import { ITEMS, MAX_ITEM_COUNT, MAX_LEVEL, isEquip } from './heroes';
import { MAPS } from './maps';
import { freshRun } from './quest';
import { HERO_ORDER, type HeroId, type ItemId, type Run } from './types';

export const QUEST_KEY = 'baokaka.quest';

export type QuestSave = { run: Run; sound: boolean };

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;
const isItem = (value: unknown): value is ItemId => typeof value === 'string' && value in ITEMS;

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
    isCount(run.stickers) &&
    Array.isArray(run.flags) &&
    run.flags.every((flag) => typeof flag === 'string') &&
    isCount(run.steps) &&
    Number.isFinite(run.seed) &&
    Number.isInteger(run.chapter) &&
    (run.chapter as number) >= 1 &&
    typeof run.cleared === 'boolean'
  );
}

function isSave(value: unknown): value is QuestSave {
  if (typeof value !== 'object' || value === null) return false;
  const save = value as Partial<QuestSave>;
  return typeof save.sound === 'boolean' && isRun(save.run);
}

/** Anything unreadable comes back as a fresh run; the player is never shown an error. */
export function loadQuest(storage: StorageLike | null = browserStorage()): QuestSave {
  const stored = loadJson(QUEST_KEY, isSave, storage);
  return stored ?? { run: freshRun(Date.now() | 0), sound: true };
}

export function saveQuest(save: QuestSave, storage: StorageLike | null = browserStorage()): void {
  saveJson(QUEST_KEY, save, storage);
}
