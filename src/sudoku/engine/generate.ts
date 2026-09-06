import { rng, shuffle } from '../../shared/random';
import { fillSolution, solveSingles } from './solve';
import type { Puzzle, Size } from './types';

/**
 * Digging stops once this few clues remain. Every puzzle stays solvable by singles alone, so
 * fewer clues mean a longer, not a harder, puzzle; these keep the big board comfortable.
 */
export const MIN_GIVENS: Record<Size, number> = { 4: 5, 6: 12, 9: 32 };

/**
 * A fresh puzzle from a seed: build a full board, then take clues out one at a time in random
 * order, keeping each removal only if singles can still solve the board without it.
 */
export function generatePuzzle(size: Size, seed: number): Puzzle {
  const random = rng(seed);
  const solution = fillSolution(size, random);
  const givens = [...solution];
  let remaining = givens.length;

  for (const cell of shuffle(Array.from({ length: givens.length }, (_, index) => index), random)) {
    if (remaining <= MIN_GIVENS[size]) break;
    const clue = givens[cell];
    givens[cell] = 0;
    if (solveSingles(size, givens).solved) remaining -= 1;
    else givens[cell] = clue;
  }

  return { size, givens, solution };
}
