import { useEffect, useReducer } from 'react';
import { unlockAudio } from '../shared/audio';
import { generatePuzzle } from './engine/generate';
import { loadSudoku, saveSudoku } from './engine/save';
import { initialState, sudokuReducer } from './engine/sudoku';
import { PuzzleScreen } from './screens/PuzzleScreen';
import { SudokuTitleScreen } from './screens/SudokuTitleScreen';

type Props = { onExit: () => void };

/** 摩卡貓的收納挑戰: picture sudoku. Puzzles are generated on the spot from a time seed. */
export const SudokuGame = ({ onExit }: Props) => {
  const [state, dispatch] = useReducer(sudokuReducer, undefined, () => initialState(loadSudoku()));
  const { view, play, stats, symbols, sound } = state;

  useEffect(() => {
    saveSudoku({ play, stats, symbols, sound });
  }, [play, stats, symbols, sound]);

  if (view === 'play' && play) {
    return (
      <PuzzleScreen
        play={play}
        symbols={symbols}
        soundOn={sound}
        onSelect={(cell) => dispatch({ type: 'select', cell })}
        onPick={(value) => dispatch({ type: 'pick', value })}
        onErase={() => dispatch({ type: 'erase' })}
        onToggleNotes={() => dispatch({ type: 'toggleNotesMode' })}
        onHint={() => dispatch({ type: 'hint' })}
        onRestart={() => dispatch({ type: 'restart' })}
        onNew={() => dispatch({ type: 'start', puzzle: generatePuzzle(play.puzzle.size, Date.now()) })}
        onTick={() => dispatch({ type: 'tick' })}
        onToggleSound={() => dispatch({ type: 'toggleSound' })}
        onQuit={() => dispatch({ type: 'quit' })}
      />
    );
  }

  return (
    <SudokuTitleScreen
      stats={stats}
      symbols={symbols}
      resumable={play && !play.solved ? play : null}
      onStart={(size) => {
        unlockAudio(); // iOS only unlocks audio inside a user gesture
        dispatch({ type: 'start', puzzle: generatePuzzle(size, Date.now()) });
      }}
      onResume={() => {
        unlockAudio();
        dispatch({ type: 'resume' });
      }}
      onToggleSymbols={() => dispatch({ type: 'toggleSymbols' })}
      onExit={onExit}
    />
  );
};
