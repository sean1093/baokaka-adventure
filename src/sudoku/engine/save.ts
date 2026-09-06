import { browserStorage, loadJson, saveJson, type StorageLike } from '../../shared/storage';
import { emptyStats, isSize, type SudokuState } from './sudoku';
import { SIZES, type Play, type Stats } from './types';

export const SUDOKU_KEY = 'baokaka.sudoku';

export type SudokuSave = Omit<SudokuState, 'view'>;

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

const isBoard = (value: unknown, length: number, min: number, max: number): value is number[] =>
  Array.isArray(value) &&
  value.length === length &&
  value.every((entry) => Number.isInteger(entry) && entry >= min && entry <= max);

function isPlay(value: unknown): value is Play {
  if (typeof value !== 'object' || value === null) return false;
  const play = value as Partial<Play>;
  const puzzle = play.puzzle;
  if (typeof puzzle !== 'object' || puzzle === null || !isSize(puzzle.size)) return false;
  const length = puzzle.size * puzzle.size;
  return (
    isBoard(puzzle.givens, length, 0, puzzle.size) &&
    isBoard(puzzle.solution, length, 1, puzzle.size) &&
    isBoard(play.entries, length, 0, puzzle.size) &&
    isBoard(play.notes, length, 0, (1 << puzzle.size) - 1) &&
    typeof play.notesMode === 'boolean' &&
    isCount(play.hints) &&
    isCount(play.elapsed) &&
    typeof play.solved === 'boolean'
  );
}

function isStats(value: unknown): value is Stats {
  if (typeof value !== 'object' || value === null) return false;
  const stats = value as Partial<Stats>;
  return SIZES.every((size) => {
    const entry = stats[size];
    return (
      typeof entry === 'object' &&
      entry !== null &&
      isCount(entry.solved) &&
      (entry.best === null || isCount(entry.best)) &&
      isCount(entry.stars)
    );
  });
}

function isSave(value: unknown): value is SudokuSave {
  if (typeof value !== 'object' || value === null) return false;
  const save = value as Partial<SudokuSave>;
  return (
    isStats(save.stats) &&
    (save.symbols === 'pictures' || save.symbols === 'digits') &&
    typeof save.sound === 'boolean' &&
    (save.play === null || isPlay(save.play))
  );
}

/** Anything unreadable comes back as a fresh slate; a solved board is never resumed. */
export function loadSudoku(storage: StorageLike | null = browserStorage()): SudokuSave {
  const saved = loadJson(SUDOKU_KEY, isSave, storage);
  if (!saved) return { play: null, stats: emptyStats(), symbols: 'pictures', sound: true };
  const play = saved.play && !saved.play.solved ? saved.play : null;
  // Selection, speech bubble and flashes are moments, not progress
  return { ...saved, play: play && { ...play, selected: null, armed: null, message: null, flash: null } };
}

export function saveSudoku(save: SudokuSave, storage: StorageLike | null = browserStorage()): void {
  saveJson(SUDOKU_KEY, save, storage);
}
