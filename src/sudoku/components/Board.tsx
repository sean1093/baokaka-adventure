import type { CSSProperties } from 'react';
import { bitsToValues, colOf, grid, rowOf } from '../engine/grid';
import { conflicts, merge } from '../engine/solve';
import { symbolName } from '../engine/symbols';
import type { Play, Symbols } from '../engine/types';
import { Symbol } from './Symbol';

/** Digit size per board so a 9x9 cell still reads on a 375px phone */
const DIGIT_SIZE: Record<number, string> = { 4: 'text-hero', 6: 'text-display', 9: 'text-heading' };

/** Hairlines split cells; the heavier line marks a box edge */
const CELL_LINE = 'rgba(59,42,32,0.12)';
const BOX_LINE = 'rgba(59,42,32,0.55)';

type Props = { play: Play; symbols: Symbols; onSelect: (cell: number) => void };

/**
 * The cabinet. Thick lines mark the boxes; the selected cell, its peers and every cell holding
 * the same symbol are tinted so the player can see what a placement would clash with.
 */
export const Board = ({ play, symbols, onSelect }: Props) => {
  const { puzzle, entries, notes, selected, armed, flash } = play;
  const { size } = puzzle;
  const geometry = grid(size);
  const board = merge(puzzle, entries);
  const clash = conflicts(size, board);
  const focusValue = armed ?? (selected !== null ? board[selected] : 0);
  const peers = selected !== null ? geometry.peers[selected] : [];

  return (
    <div
      role="grid"
      aria-label="收納櫃"
      className="grid w-full overflow-hidden rounded-2xl bg-surface ring-1 ring-ink/10"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, aspectRatio: '1' }}
    >
      {board.map((value, cell) => {
        const row = rowOf(size, cell);
        const col = colOf(size, cell);
        const given = puzzle.givens[cell] !== 0;
        const isSelected = selected === cell;
        const sameValue = focusValue !== 0 && value === focusValue;
        const flashing = flash?.cells.includes(cell) ?? false;
        const boxRight = (col + 1) % geometry.boxCols === 0;
        const boxBottom = (row + 1) % geometry.boxRows === 0;
        const tint = isSelected
          ? 'bg-sun/60'
          : clash[cell]
            ? 'bg-berry/20'
            : sameValue
              ? 'bg-sky/30'
              : peers.includes(cell)
                ? 'bg-sun/10'
                : given
                  ? 'bg-cream'
                  : 'bg-surface';
        const border: CSSProperties = {
          borderRightWidth: col === size - 1 ? 0 : boxRight ? 2 : 1,
          borderBottomWidth: row === size - 1 ? 0 : boxBottom ? 2 : 1,
          borderRightColor: boxRight ? BOX_LINE : CELL_LINE,
          borderBottomColor: boxBottom ? BOX_LINE : CELL_LINE,
        };
        const label = `第 ${row + 1} 列第 ${col + 1} 行${value ? `，${symbolName(symbols, value)}` : '，空的'}`;
        return (
          <button
            key={cell}
            type="button"
            role="gridcell"
            aria-label={label}
            onClick={() => onSelect(cell)}
            className={`relative aspect-square border-solid p-0 transition-colors ${tint}`}
            style={border}
          >
            {value !== 0 ? (
              <span key={flashing ? flash?.key : -1} className={`absolute inset-0 ${flashing ? 'pop' : ''} ${clash[cell] ? 'text-berry' : given ? 'text-ink' : 'text-skyDeep'}`}>
                <Symbol value={value} symbols={symbols} className={`${DIGIT_SIZE[size]} font-extrabold`} />
              </span>
            ) : (
              notes[cell] !== 0 && (
                <span
                  className="absolute inset-0.5 grid"
                  style={{ gridTemplateColumns: `repeat(${geometry.boxCols}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: size }, (_, index) => index + 1).map((mark) => (
                    <span key={mark} className="grid place-items-center text-[10px] font-bold leading-none text-ink/70">
                      {bitsToValues(notes[cell], size).includes(mark) &&
                        (symbols === 'digits' ? mark : <span className="block h-3 w-3"><Symbol value={mark} symbols={symbols} /></span>)}
                    </span>
                  ))}
                </span>
              )
            )}
          </button>
        );
      })}
    </div>
  );
};
