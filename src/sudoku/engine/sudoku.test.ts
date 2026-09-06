import { describe, expect, test } from 'vitest';
import { MIN_GIVENS, generatePuzzle } from './generate';
import { bit, grid } from './grid';
import { loadSudoku, saveSudoku, SUDOKU_KEY } from './save';
import { completedUnits, conflicts, findHint, merge, solveSingles } from './solve';
import { emptyStats, initialState, newPlay, starsFor, sudokuReducer, type SudokuAction, type SudokuState } from './sudoku';
import { SIZES, type Puzzle } from './types';

describe('grid geometry', () => {
  test('6x6 boxes are two rows by three columns', () => {
    const { boxOf, units, peers } = grid(6);
    expect(boxOf.slice(0, 6)).toEqual([0, 0, 0, 1, 1, 1]);
    expect(boxOf.slice(12, 18)).toEqual([2, 2, 2, 3, 3, 3]);
    expect(units).toHaveLength(18);
    expect(units.filter((unit) => unit.kind === 'box')[0].cells).toEqual([0, 1, 2, 6, 7, 8]);
    // 5 row peers + 5 column peers + 2 box peers not already counted
    expect(peers[0]).toHaveLength(12);
  });

  test('every cell of every size sits in exactly one row, one column and one box', () => {
    for (const size of SIZES) {
      const { units } = grid(size);
      for (let cell = 0; cell < size * size; cell += 1) {
        expect(units.filter((unit) => unit.cells.includes(cell)).map((unit) => unit.kind).sort()).toEqual(['box', 'col', 'row']);
      }
    }
  });
});

describe('generatePuzzle', () => {
  test('is deterministic for a seed and different across seeds', () => {
    expect(generatePuzzle(9, 12)).toEqual(generatePuzzle(9, 12));
    expect(generatePuzzle(9, 12).givens).not.toEqual(generatePuzzle(9, 13).givens);
  });

  test('every size and seed yields a conflict-free solution that singles alone can reach from the clues', () => {
    for (const size of SIZES) {
      for (let seed = 1; seed <= 12; seed += 1) {
        const puzzle = generatePuzzle(size, seed);
        expect(conflicts(size, puzzle.solution).some(Boolean)).toBe(false);
        expect(puzzle.givens.every((given, cell) => given === 0 || given === puzzle.solution[cell])).toBe(true);
        expect(puzzle.givens.filter(Boolean).length).toBeGreaterThanOrEqual(MIN_GIVENS[size]);
        const solved = solveSingles(size, puzzle.givens);
        expect(solved.solved).toBe(true);
        expect(solved.cells).toEqual(puzzle.solution);
      }
    }
  });
});

describe('solve helpers', () => {
  const puzzle = generatePuzzle(4, 3);

  test('conflicts flags both cells of a duplicate in a unit', () => {
    const cells = [...puzzle.solution];
    cells[1] = cells[0];
    const flagged = conflicts(4, cells);
    expect(flagged[0]).toBe(true);
    expect(flagged[1]).toBe(true);
    expect(flagged.filter(Boolean).length).toBeGreaterThanOrEqual(2);
  });

  test('completedUnits lists only full, valid units', () => {
    const cells = new Array(16).fill(0);
    for (let col = 0; col < 4; col += 1) cells[col] = puzzle.solution[col];
    expect(completedUnits(4, cells)).toEqual([0]);
    cells[3] = cells[2];
    expect(completedUnits(4, cells)).toEqual([]);
  });

  test('findHint reports a wrong entry before anything else', () => {
    const entries = new Array(16).fill(0);
    const empty = puzzle.givens.findIndex((given) => given === 0);
    entries[empty] = puzzle.solution[empty] === 1 ? 2 : 1;
    expect(findHint(puzzle, entries)).toEqual({ kind: 'wrong', cell: empty });
  });

  test('findHint always names a correct symbol for an empty cell, all the way to the end', () => {
    const entries = new Array(16).fill(0);
    for (let guard = 0; guard < 16; guard += 1) {
      if (merge(puzzle, entries).every((value) => value !== 0)) break;
      const hint = findHint(puzzle, entries);
      expect(hint.kind === 'naked' || hint.kind === 'hidden').toBe(true);
      if (hint.kind === 'wrong') return;
      expect(puzzle.givens[hint.cell]).toBe(0);
      expect(hint.value).toBe(puzzle.solution[hint.cell]);
      entries[hint.cell] = hint.value;
    }
    expect(merge(puzzle, entries)).toEqual(puzzle.solution);
  });
});

describe('sudokuReducer', () => {
  const puzzle: Puzzle = generatePuzzle(4, 5);
  const start = sudokuReducer(initialState(), { type: 'start', puzzle });
  const play = (state: SudokuState, ...actions: SudokuAction[]) => actions.reduce(sudokuReducer, state);
  const firstEmpty = puzzle.givens.findIndex((given) => given === 0);
  const firstGiven = puzzle.givens.findIndex((given) => given !== 0);
  const right = puzzle.solution[firstEmpty];
  const wrong = right === 1 ? 2 : 1;

  test('start opens a fresh board on the play view', () => {
    expect(start.view).toBe('play');
    expect(start.play).toEqual(newPlay(puzzle));
  });

  test('selecting a cell then picking a symbol fills it; picking it again clears it', () => {
    const filled = play(start, { type: 'select', cell: firstEmpty }, { type: 'pick', value: right });
    expect(filled.play?.entries[firstEmpty]).toBe(right);
    expect(filled.play?.selected).toBe(firstEmpty);
    const cleared = sudokuReducer(filled, { type: 'pick', value: right });
    expect(cleared.play?.entries[firstEmpty]).toBe(0);
  });

  test('givens cannot be written over', () => {
    const attempt = play(start, { type: 'select', cell: firstGiven }, { type: 'pick', value: 1 });
    expect(attempt.play?.entries[firstGiven]).toBe(0);
    // with nothing editable selected the pick arms the symbol instead
    expect(attempt.play?.armed).toBe(1);
  });

  test('an armed symbol paints into tapped cells and stays armed', () => {
    const painted = play(start, { type: 'pick', value: right }, { type: 'select', cell: firstEmpty });
    expect(painted.play?.entries[firstEmpty]).toBe(right);
    expect(painted.play?.armed).toBe(right);
    expect(painted.play?.selected).toBeNull();
  });

  test('a clashing entry is kept but Mocha points it out', () => {
    // Put the value that already sits in this row somewhere else in the row
    const row = Math.floor(firstEmpty / 4);
    const clash = puzzle.givens.slice(row * 4, row * 4 + 4).find((given) => given !== 0) ?? 0;
    const clashed = play(start, { type: 'select', cell: firstEmpty }, { type: 'pick', value: clash });
    expect(conflicts(4, merge(puzzle, clashed.play?.entries ?? []))[firstEmpty]).toBe(true);
    expect(clashed.play?.message?.text).toContain('已經有一個');
  });

  test('notes mode toggles pencil marks and a real entry wipes them from peers', () => {
    const noted = play(start, { type: 'toggleNotesMode' }, { type: 'select', cell: firstEmpty }, { type: 'pick', value: right }, { type: 'pick', value: wrong });
    expect(noted.play?.notes[firstEmpty]).toBe(bit(right) | bit(wrong));
    expect(noted.play?.entries[firstEmpty]).toBe(0);
    const peer = grid(4).peers[firstEmpty].find((cell) => puzzle.givens[cell] === 0 && cell !== firstEmpty);
    if (peer === undefined) return;
    const written = play(noted, { type: 'toggleNotesMode' }, { type: 'select', cell: peer }, { type: 'pick', value: right });
    expect((written.play?.notes[firstEmpty] ?? 0) & bit(right)).toBe(0);
  });

  test('a hint takes back a wrong entry first, then fills a correct cell, and counts each time', () => {
    const mistaken = play(start, { type: 'select', cell: firstEmpty }, { type: 'pick', value: wrong });
    const corrected = sudokuReducer(mistaken, { type: 'hint' });
    expect(corrected.play?.entries[firstEmpty]).toBe(0);
    expect(corrected.play?.hints).toBe(1);
    const filled = sudokuReducer(corrected, { type: 'hint' });
    const entries = filled.play?.entries ?? [];
    const cell = entries.findIndex((value) => value !== 0);
    expect(entries[cell]).toBe(puzzle.solution[cell]);
    expect(filled.play?.hints).toBe(2);
  });

  test('filling every cell correctly solves the board and books the stats once', () => {
    let state = play(start, { type: 'tick' }, { type: 'tick' });
    puzzle.givens.forEach((given, cell) => {
      if (given === 0) state = play(state, { type: 'select', cell }, { type: 'pick', value: puzzle.solution[cell] });
    });
    expect(state.play?.solved).toBe(true);
    expect(state.stats[4]).toEqual({ solved: 1, best: 2, stars: 3 });
    expect(sudokuReducer(state, { type: 'tick' }).play?.elapsed).toBe(2);
    expect(sudokuReducer(state, { type: 'pick', value: 1 })).toBe(state);
    // Quitting a solved board leaves nothing to resume
    const quit = sudokuReducer(state, { type: 'quit' });
    expect(quit.play).toBeNull();
    expect(sudokuReducer(quit, { type: 'resume' }).view).toBe('title');
  });

  test('quitting mid-puzzle keeps it for resume; restart wipes entries and the clock', () => {
    const mid = play(start, { type: 'select', cell: firstEmpty }, { type: 'pick', value: right }, { type: 'tick' });
    const quit = sudokuReducer(mid, { type: 'quit' });
    expect(quit.view).toBe('title');
    expect(quit.play?.entries[firstEmpty]).toBe(right);
    expect(sudokuReducer(quit, { type: 'resume' }).view).toBe('play');
    const restarted = sudokuReducer(mid, { type: 'restart' });
    expect(restarted.play?.entries.every((value) => value === 0)).toBe(true);
    expect(restarted.play?.elapsed).toBe(0);
  });

  test('stars reward fewer hints', () => {
    expect([starsFor(0), starsFor(1), starsFor(2), starsFor(3), starsFor(9)]).toEqual([3, 2, 2, 1, 1]);
  });
});

describe('save', () => {
  const fakeStorage = (seed?: string) => {
    const cells: Record<string, string> = {};
    if (seed !== undefined) cells[SUDOKU_KEY] = seed;
    return { getItem: (key: string) => cells[key] ?? null, setItem: (key: string, value: string) => void (cells[key] = value) };
  };
  const fresh = { play: null, stats: emptyStats(), symbols: 'pictures' as const, sound: true };

  test('round-trips a board in progress without its transient selection', () => {
    const storage = fakeStorage();
    const playing = { ...newPlay(generatePuzzle(6, 2)), selected: 3, armed: 2, message: { text: 'hi', key: 1 } };
    saveSudoku({ play: playing, stats: emptyStats(), symbols: 'digits', sound: false }, storage);
    const loaded = loadSudoku(storage);
    expect(loaded.symbols).toBe('digits');
    expect(loaded.play?.puzzle).toEqual(playing.puzzle);
    expect(loaded.play?.selected).toBeNull();
    expect(loaded.play?.armed).toBeNull();
    expect(loaded.play?.message).toBeNull();
  });

  test('never resumes a solved board', () => {
    const storage = fakeStorage();
    saveSudoku({ play: { ...newPlay(generatePuzzle(4, 2)), solved: true }, stats: emptyStats(), symbols: 'pictures', sound: true }, storage);
    expect(loadSudoku(storage).play).toBeNull();
  });

  test('falls back on malformed or mis-shaped data', () => {
    expect(loadSudoku(fakeStorage('{nope'))).toEqual(fresh);
    expect(loadSudoku(fakeStorage(JSON.stringify({ ...fresh, stats: { 4: { solved: 1 } } })))).toEqual(fresh);
    const bad = { ...newPlay(generatePuzzle(4, 2)), entries: [9] };
    expect(loadSudoku(fakeStorage(JSON.stringify({ ...fresh, play: bad })))).toEqual(fresh);
    expect(loadSudoku(null)).toEqual(fresh);
  });
});
