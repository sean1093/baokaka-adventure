import { bit, grid } from './grid';
import { completedUnits, conflicts, findHint, merge } from './solve';
import { UNIT_LABELS, symbolName } from './symbols';
import { SIZES, type Cells, type Play, type Puzzle, type Size, type Stats, type Symbols } from './types';

export type SudokuState = {
  view: 'title' | 'play';
  /** The puzzle in progress (or just solved); null when there is none to resume */
  play: Play | null;
  stats: Stats;
  symbols: Symbols;
  sound: boolean;
};

export type SudokuAction =
  | { type: 'start'; puzzle: Puzzle }
  | { type: 'resume' }
  | { type: 'quit' }
  | { type: 'select'; cell: number }
  /** A palette tap: fills the selected cell, or arms the symbol when nothing is selected */
  | { type: 'pick'; value: number }
  | { type: 'erase' }
  | { type: 'toggleNotesMode' }
  | { type: 'hint' }
  | { type: 'restart' }
  | { type: 'tick' }
  | { type: 'toggleSymbols' }
  | { type: 'toggleSound' };

const CHEERS = ['一排收好了，喵～', '整整齊齊！', '寶咖咖拍拍手！', '好棒，繼續！'];

export const starsFor = (hints: number): number => (hints === 0 ? 3 : hints <= 2 ? 2 : 1);

export const emptyStats = (): Stats => ({
  4: { solved: 0, best: null, stars: 0 },
  6: { solved: 0, best: null, stars: 0 },
  9: { solved: 0, best: null, stars: 0 },
});

export const initialState = (saved: Partial<Omit<SudokuState, 'view'>> = {}): SudokuState => ({
  view: 'title',
  play: saved.play ?? null,
  stats: saved.stats ?? emptyStats(),
  symbols: saved.symbols ?? 'pictures',
  sound: saved.sound ?? true,
});

export function newPlay(puzzle: Puzzle): Play {
  return {
    puzzle,
    entries: new Array(puzzle.givens.length).fill(0),
    notes: new Array(puzzle.givens.length).fill(0),
    selected: null,
    armed: null,
    notesMode: false,
    hints: 0,
    elapsed: 0,
    solved: false,
    message: null,
    flash: null,
  };
}

const say = (play: Play, text: string): Play => ({ ...play, message: { text, key: (play.message?.key ?? 0) + 1 } });

const editable = (play: Play, cell: number): boolean => play.puzzle.givens[cell] === 0;

/**
 * Puts `value` in `cell` (or takes it out again when it is already there), then reports what
 * that did: a clash, a finished row/column/box, or the whole cabinet.
 */
function place(state: SudokuState, play: Play, cell: number, value: number): Play {
  const { size } = play.puzzle;
  if (play.notesMode) {
    if (play.entries[cell] !== 0) return play;
    const notes = [...play.notes];
    notes[cell] ^= bit(value);
    return { ...play, notes, selected: cell };
  }

  const entries: Cells = [...play.entries];
  const notes = [...play.notes];
  const before = completedUnits(size, merge(play.puzzle, entries));
  const removing = entries[cell] === value;
  entries[cell] = removing ? 0 : value;
  notes[cell] = 0;
  if (!removing) for (const peer of grid(size).peers[cell]) notes[peer] &= ~bit(value);

  let next: Play = { ...play, entries, notes, selected: cell };
  if (removing) return next;

  const board = merge(play.puzzle, entries);
  if (board.every((entry, index) => entry === play.puzzle.solution[index])) {
    return say({ ...next, solved: true, flash: { cells: board.map((_, index) => index), key: (play.flash?.key ?? 0) + 1 } }, '全部收好了！寶咖咖好開心！');
  }
  if (conflicts(size, board)[cell]) {
    return say(next, `哎呀，這附近已經有一個${symbolName(state.symbols, value)}了`);
  }
  const fresh = completedUnits(size, board).filter((unit) => !before.includes(unit));
  if (fresh.length > 0) {
    const cells = [...new Set(fresh.flatMap((unit) => grid(size).units[unit].cells))];
    next = say({ ...next, flash: { cells, key: (play.flash?.key ?? 0) + 1 } }, CHEERS[fresh[0] % CHEERS.length]);
  }
  return next;
}

function applyHint(state: SudokuState, play: Play): Play {
  const hint = findHint(play.puzzle, play.entries);
  const counted = { ...play, hints: play.hints + 1, armed: null };
  // Hints always write a value, never a pencil mark, whatever mode the player is in
  const fill = (cell: number, value: number): Play => ({
    ...place(state, { ...counted, notesMode: false }, cell, value),
    notesMode: play.notesMode,
  });
  switch (hint.kind) {
    case 'wrong': {
      const entries = [...play.entries];
      entries[hint.cell] = 0;
      return say({ ...counted, entries, selected: hint.cell }, '這一格放錯了，先拿起來，再想想看');
    }
    case 'naked':
      return say(fill(hint.cell, hint.value), `這一格只剩${symbolName(state.symbols, hint.value)}能放：其他的在同一橫列、直行或區裡都出現過了`);
    case 'hidden':
      return say(fill(hint.cell, hint.value), `${UNIT_LABELS[hint.unit]}裡，${symbolName(state.symbols, hint.value)}只剩這一格能放`);
    case 'reveal':
      return say(fill(hint.cell, hint.value), `這一格是${symbolName(state.symbols, hint.value)}`);
  }
}

function recordSolve(stats: Stats, size: Size, play: Play): Stats {
  const current = stats[size];
  return {
    ...stats,
    [size]: {
      solved: current.solved + 1,
      best: current.best === null ? play.elapsed : Math.min(current.best, play.elapsed),
      stars: current.stars + starsFor(play.hints),
    },
  };
}

export function sudokuReducer(state: SudokuState, action: SudokuAction): SudokuState {
  const { play } = state;

  switch (action.type) {
    case 'start':
      return { ...state, view: 'play', play: newPlay(action.puzzle) };

    case 'resume':
      return play && !play.solved ? { ...state, view: 'play' } : state;

    case 'quit':
      return { ...state, view: 'title', play: play?.solved ? null : play };

    case 'toggleSymbols':
      return { ...state, symbols: state.symbols === 'pictures' ? 'digits' : 'pictures' };

    case 'toggleSound':
      return { ...state, sound: !state.sound };
  }

  if (!play || state.view !== 'play') return state;

  switch (action.type) {
    case 'tick':
      return play.solved ? state : { ...state, play: { ...play, elapsed: play.elapsed + 1 } };

    case 'select': {
      if (play.solved) return state;
      if (play.armed !== null && editable(play, action.cell)) {
        const next = place(state, play, action.cell, play.armed);
        return finish(state, { ...next, selected: null });
      }
      return { ...state, play: { ...play, selected: action.cell, armed: null } };
    }

    case 'pick': {
      if (play.solved) return state;
      if (play.selected !== null && editable(play, play.selected)) {
        return finish(state, place(state, play, play.selected, action.value));
      }
      return { ...state, play: { ...play, selected: null, armed: play.armed === action.value ? null : action.value } };
    }

    case 'erase': {
      if (play.solved) return state;
      if (play.selected !== null && editable(play, play.selected)) {
        const entries = [...play.entries];
        const notes = [...play.notes];
        entries[play.selected] = 0;
        notes[play.selected] = 0;
        return { ...state, play: { ...play, entries, notes } };
      }
      return { ...state, play: { ...play, armed: null } };
    }

    case 'toggleNotesMode':
      return { ...state, play: { ...play, notesMode: !play.notesMode } };

    case 'hint':
      return play.solved ? state : finish(state, applyHint(state, play));

    case 'restart':
      return { ...state, play: { ...newPlay(play.puzzle), message: { text: '重新來過，慢慢收。', key: 1 } } };
  }
}

/** Books the solve into the stats the moment it happens, so a closed tab still counts it. */
function finish(state: SudokuState, play: Play): SudokuState {
  if (play.solved && !state.play?.solved) {
    return { ...state, play, stats: recordSolve(state.stats, play.puzzle.size, play) };
  }
  return { ...state, play };
}

export const isSize = (value: unknown): value is Size => SIZES.includes(value as Size);
