import { shuffle } from '../../shared/random';
import { bit, bitsToValues, grid } from './grid';
import type { Cells, Hint, Puzzle, Size } from './types';

/** Per-cell candidate masks from the current board: 0 for filled cells. */
export function candidateMasks(size: Size, cells: Cells): number[] {
  const { full, peers } = grid(size);
  return cells.map((value, cell) => {
    if (value !== 0) return 0;
    let used = 0;
    for (const peer of peers[cell]) if (cells[peer] !== 0) used |= bit(cells[peer]);
    return full & ~used;
  });
}

const isSingleBit = (mask: number): boolean => mask !== 0 && (mask & (mask - 1)) === 0;

const valueOfBit = (mask: number): number => 31 - Math.clz32(mask) + 1;

/**
 * Solves as far as naked singles (one candidate left in a cell) and hidden singles (one cell
 * left for a symbol in a unit) can go. Puzzles are generated so this is always enough, which
 * means no guessing is ever needed and every hint can be explained.
 */
export function solveSingles(size: Size, start: Cells): { cells: Cells; solved: boolean } {
  const { units } = grid(size);
  const cells = [...start];

  for (;;) {
    const masks = candidateMasks(size, cells);
    let progress = false;

    for (let cell = 0; cell < cells.length; cell += 1) {
      if (cells[cell] !== 0) continue;
      if (masks[cell] === 0) return { cells, solved: false };
      if (isSingleBit(masks[cell])) {
        cells[cell] = valueOfBit(masks[cell]);
        progress = true;
      }
    }
    if (progress) continue;

    // One hidden single per pass, so every placement is made against fresh candidates
    hidden: for (const unit of units) {
      let placed = 0;
      for (const cell of unit.cells) if (cells[cell] !== 0) placed |= bit(cells[cell]);
      for (let value = 1; value <= size; value += 1) {
        if (placed & bit(value)) continue;
        const spots = unit.cells.filter((cell) => cells[cell] === 0 && masks[cell] & bit(value));
        if (spots.length === 0) return { cells, solved: false };
        if (spots.length === 1) {
          cells[spots[0]] = value;
          progress = true;
          break hidden;
        }
      }
    }
    if (!progress) break;
  }

  return { cells, solved: cells.every((value) => value !== 0) };
}

/** A complete valid board, built by backtracking over the emptiest cell first with shuffled values. */
export function fillSolution(size: Size, random: () => number): Cells {
  const { full, peers } = grid(size);
  const cells: Cells = new Array(size * size).fill(0);

  const search = (): boolean => {
    let best = -1;
    let bestMask = 0;
    let bestCount = size + 1;
    for (let cell = 0; cell < cells.length; cell += 1) {
      if (cells[cell] !== 0) continue;
      let used = 0;
      for (const peer of peers[cell]) if (cells[peer] !== 0) used |= bit(cells[peer]);
      const mask = full & ~used;
      const count = bitsToValues(mask, size).length;
      if (count === 0) return false;
      if (count < bestCount) {
        best = cell;
        bestMask = mask;
        bestCount = count;
        if (count === 1) break;
      }
    }
    if (best === -1) return true;
    for (const value of shuffle(bitsToValues(bestMask, size), random)) {
      cells[best] = value;
      if (search()) return true;
    }
    cells[best] = 0;
    return false;
  };

  search();
  return cells;
}

/** True for every filled cell that shares its symbol with a peer. */
export function conflicts(size: Size, cells: Cells): boolean[] {
  const { peers } = grid(size);
  return cells.map((value, cell) => value !== 0 && peers[cell].some((peer) => cells[peer] === value));
}

/** Indices (into grid(size).units) of units that are completely and correctly filled. */
export function completedUnits(size: Size, cells: Cells): number[] {
  const { units, full } = grid(size);
  const done: number[] = [];
  units.forEach((unit, index) => {
    let mask = 0;
    for (const cell of unit.cells) {
      if (cells[cell] === 0) return;
      mask |= bit(cells[cell]);
    }
    if (mask === full) done.push(index);
  });
  return done;
}

/** The board the player sees: givens where present, otherwise entries. */
export const merge = (puzzle: Puzzle, entries: Cells): Cells =>
  puzzle.givens.map((given, cell) => given || entries[cell]);

/**
 * The next thing worth telling the player: a wrong entry first, then the easiest logical step.
 * Puzzles are singles-solvable and correct entries only add information, so a single always
 * exists; `reveal` is a safety net.
 */
export function findHint(puzzle: Puzzle, entries: Cells): Hint {
  const { size, solution } = puzzle;
  const wrong = entries.findIndex((value, cell) => value !== 0 && value !== solution[cell]);
  if (wrong !== -1) return { kind: 'wrong', cell: wrong };

  const cells = merge(puzzle, entries);
  const masks = candidateMasks(size, cells);

  const naked = cells.findIndex((value, cell) => value === 0 && isSingleBit(masks[cell]));
  if (naked !== -1) return { kind: 'naked', cell: naked, value: valueOfBit(masks[naked]) };

  for (const unit of grid(size).units) {
    let placed = 0;
    for (const cell of unit.cells) if (cells[cell] !== 0) placed |= bit(cells[cell]);
    for (let value = 1; value <= size; value += 1) {
      if (placed & bit(value)) continue;
      const spots = unit.cells.filter((cell) => cells[cell] === 0 && masks[cell] & bit(value));
      if (spots.length === 1) return { kind: 'hidden', cell: spots[0], value, unit: unit.kind };
    }
  }

  const empty = cells.findIndex((value) => value === 0);
  return { kind: 'reveal', cell: empty, value: solution[empty] };
}
