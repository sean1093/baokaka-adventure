import { browserStorage, loadJson, saveJson, type StorageLike } from '../../shared/storage';
import { CHAPTERS } from './chapters';
import { ITEM_ORDER, MAX_LEVEL } from './heroes';
import { freshRun } from './quest';
import { HERO_ORDER, type Run } from './types';

export const QUEST_KEY = 'baokaka.quest';

export type QuestSave = { run: Run; sound: boolean };

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

function isRun(value: unknown): value is Run {
  if (typeof value !== 'object' || value === null) return false;
  const run = value as Partial<Run>;
  const chapter = CHAPTERS[(run.chapter ?? 0) - 1];
  return (
    chapter !== undefined &&
    isCount(run.node) &&
    run.node < chapter.nodes.length &&
    Number.isInteger(run.level) &&
    (run.level as number) >= 1 &&
    (run.level as number) <= MAX_LEVEL &&
    isCount(run.xp) &&
    typeof run.hp === 'object' &&
    run.hp !== null &&
    HERO_ORDER.every((hero) => isCount(run.hp?.[hero])) &&
    typeof run.items === 'object' &&
    run.items !== null &&
    ITEM_ORDER.every((item) => isCount(run.items?.[item])) &&
    typeof run.cleared === 'boolean'
  );
}

function isQuestSave(value: unknown): value is QuestSave {
  if (typeof value !== 'object' || value === null) return false;
  const save = value as Partial<QuestSave>;
  return typeof save.sound === 'boolean' && isRun(save.run);
}

/** Anything unreadable comes back as a fresh run; the player is never shown an error. */
export function loadQuest(storage: StorageLike | null = browserStorage()): QuestSave {
  return loadJson(QUEST_KEY, isQuestSave, storage) ?? { run: freshRun(), sound: true };
}

export function saveQuest(save: QuestSave, storage: StorageLike | null = browserStorage()): void {
  saveJson(QUEST_KEY, save, storage);
}
