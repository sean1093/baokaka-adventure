/**
 * Data contract for 摩卡貓的收納挑戰, the picture sudoku.
 *
 * A board is a flat array of size*size numbers, row-major; 0 is an empty cell and 1..size is a
 * symbol (a toy in picture mode, a digit in digit mode). The engine only ever deals in numbers.
 */

export type Size = 4 | 6 | 9;

export const SIZES: readonly Size[] = [4, 6, 9];

/** Row-major board; 0 = empty */
export type Cells = number[];

export type Puzzle = {
  size: Size;
  /** The clues; 0 where the player has to fill in */
  givens: Cells;
  solution: Cells;
};

export type UnitKind = 'row' | 'col' | 'box';

export type Hint =
  /** The player put something wrong here; it is taken back out */
  | { kind: 'wrong'; cell: number }
  /** Only one symbol is still possible in this cell */
  | { kind: 'naked'; cell: number; value: number }
  /** This symbol has only one possible cell left in the unit */
  | { kind: 'hidden'; cell: number; value: number; unit: UnitKind }
  /** Fallback that should never be needed on a singles-solvable puzzle */
  | { kind: 'reveal'; cell: number; value: number };

export type Symbols = 'pictures' | 'digits';

export type SizeStats = { solved: number; best: number | null; stars: number };
export type Stats = Record<Size, SizeStats>;

/** One puzzle in progress. Saved as-is (minus transient selection) so it can be resumed. */
export type Play = {
  puzzle: Puzzle;
  /** Player entries; 0 where empty. Always 0 on given cells */
  entries: Cells;
  /** Pencil marks as bitmasks: bit (v-1) set means v is noted */
  notes: number[];
  selected: number | null;
  /** A symbol picked from the palette with no cell selected: tapping cells paints it */
  armed: number | null;
  notesMode: boolean;
  hints: number;
  /** Seconds spent, counted only while the board is on screen and the tab is visible */
  elapsed: number;
  solved: boolean;
  /** Mocha Cat's speech bubble; keyed so the same text can pop again */
  message: { text: string; key: number } | null;
  /** Cells of units that were just completed, for the one-shot flash */
  flash: { cells: number[]; key: number } | null;
};
