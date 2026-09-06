import { useEffect, useRef, useState } from 'react';
import { SPRITES } from '../../art/sprites';
import { BigButton } from '../../components/BigButton';
import { playTone } from '../../shared/audio';
import { Board } from '../components/Board';
import { Symbol } from '../components/Symbol';
import { starsFor } from '../engine/sudoku';
import { SIZE_LABELS } from '../engine/symbols';
import type { Play, Symbols } from '../engine/types';
import { formatTime } from './SudokuTitleScreen';

const MochaCat = SPRITES.mochaCat;
const Star = SPRITES.star;

/** Palette columns: every symbol plus the eraser; literal strings so Tailwind can see them */
const PALETTE_COLUMNS: Record<number, string> = { 4: 'grid-cols-5', 6: 'grid-cols-7', 9: 'grid-cols-5' };

/** What Mocha says while nothing else is going on */
const IDLE_TIPS = [
  '先點一格，再點下面的玩具。',
  '先點玩具，再一格一格放進去也可以。',
  '同一橫列、直行、區裡，每種只能有一個。',
  '卡住了就按提示，我會告訴你為什麼。',
];

type Props = {
  play: Play;
  symbols: Symbols;
  soundOn: boolean;
  onSelect: (cell: number) => void;
  onPick: (value: number) => void;
  onErase: () => void;
  onToggleNotes: () => void;
  onHint: () => void;
  onRestart: () => void;
  onNew: () => void;
  onTick: () => void;
  onToggleSound: () => void;
  onQuit: () => void;
};

export const PuzzleScreen = ({
  play,
  symbols,
  soundOn,
  onSelect,
  onPick,
  onErase,
  onToggleNotes,
  onHint,
  onRestart,
  onNew,
  onTick,
  onToggleSound,
  onQuit,
}: Props) => {
  const { puzzle, entries, solved, message, hints, elapsed, notesMode, armed, selected } = play;
  const { size } = puzzle;
  const [confirm, setConfirm] = useState<'restart' | 'new' | null>(null);

  const callbacks = useRef({ onTick, soundOn });
  callbacks.current = { onTick, soundOn };

  // The clock only runs while the board is on screen and the tab is visible
  useEffect(() => {
    if (solved) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) callbacks.current.onTick();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [solved]);

  useEffect(() => {
    if (!message) return;
    playTone(solved ? 'levelUp' : message.text.includes('哎呀') || message.text.includes('放錯') ? 'tap' : 'heal', callbacks.current.soundOn);
  }, [message, solved]);

  const remaining = Array.from({ length: size }, (_, index) => {
    const value = index + 1;
    const placed = puzzle.givens.filter((given) => given === value).length + entries.filter((entry) => entry === value).length;
    return size - placed;
  });
  const idleTip = IDLE_TIPS[Math.floor(elapsed / 20) % IDLE_TIPS.length];
  const canErase = selected !== null && puzzle.givens[selected] === 0 && (entries[selected] !== 0 || play.notes[selected] !== 0);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-3 px-4 py-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-ink/60">摩卡貓的收納挑戰</p>
          <h1 className="text-body font-bold leading-tight">
            {SIZE_LABELS[size].name} {size}×{size}
          </h1>
        </div>
        <BigButton tone="quiet" onClick={onToggleSound} label={soundOn ? '關閉聲音' : '打開聲音'}>
          {soundOn ? '聲音 開' : '聲音 關'}
        </BigButton>
      </header>

      <div className="flex items-center justify-between text-base font-bold text-ink/70">
        <span>用時 {formatTime(elapsed)}</span>
        <span>提示 {hints} 次</span>
        <span>{notesMode ? '筆記中' : '\u00a0'}</span>
      </div>

      <Board play={play} symbols={symbols} onSelect={onSelect} />

      <div className="flex items-center gap-3">
        <span className="block h-14 w-14 shrink-0">
          <MochaCat />
        </span>
        <p key={message?.key ?? 0} className={`flex-1 rounded-2xl border-4 border-ink bg-white px-3 py-2 text-base font-bold leading-snug ${message ? 'pop' : 'text-ink/70'}`}>
          {message?.text ?? idleTip}
        </p>
      </div>

      {solved ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border-4 border-ink bg-sun/30 p-5 text-center">
          <div className="flex gap-1">
            {[1, 2, 3].map((star) => (
              <span key={star} className={`block h-10 w-10 ${star <= starsFor(hints) ? 'pop' : 'opacity-25 grayscale'}`} style={{ animationDelay: `${star * 120}ms` }}>
                <Star />
              </span>
            ))}
          </div>
          <p className="text-title font-bold">全部收好了！</p>
          <p className="text-base">
            用時 {formatTime(elapsed)} · 提示 {hints} 次
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <BigButton onClick={onNew}>再來一題</BigButton>
            <BigButton tone="quiet" onClick={onQuit}>
              回選單
            </BigButton>
          </div>
        </div>
      ) : (
        <>
          <div className={`grid gap-2 ${PALETTE_COLUMNS[size]}`}>
            {remaining.map((left, index) => {
              const value = index + 1;
              const isArmed = armed === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onPick(value)}
                  aria-label={`放${value}`}
                  className={[
                    'relative aspect-square rounded-2xl border-4 border-ink shadow-[0_3px_0_#3B2A20] transition-transform active:translate-y-0.5',
                    isArmed ? 'bg-sun ring-4 ring-sun/50' : left === 0 ? 'bg-white opacity-40' : 'bg-cream',
                  ].join(' ')}
                >
                  <Symbol value={value} symbols={symbols} className={size === 9 ? 'text-title' : 'text-huge'} />
                  <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full border-2 border-ink bg-white px-1 text-xs font-bold">
                    {left}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={onErase}
              aria-label="清除"
              className={`aspect-square whitespace-nowrap rounded-2xl border-4 border-ink font-bold shadow-[0_3px_0_#3B2A20] transition-transform active:translate-y-0.5 ${size === 6 ? 'text-sm' : 'text-base'} ${canErase || armed !== null ? 'bg-white' : 'bg-white opacity-40'}`}
            >
              {armed !== null && !canErase ? '放下' : '清除'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <BigButton onClick={onHint}>提示</BigButton>
            <BigButton tone={notesMode ? 'primary' : 'quiet'} onClick={onToggleNotes}>
              筆記
            </BigButton>
            <BigButton tone="quiet" onClick={() => setConfirm(confirm === 'restart' ? null : 'restart')}>
              重來
            </BigButton>
          </div>

          {confirm && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border-4 border-berry bg-white px-4 py-3">
              <span className="text-base font-bold">{confirm === 'restart' ? '這一題重新開始？' : '放棄這一題，換新的？'}</span>
              <div className="flex gap-2">
                <BigButton
                  onClick={() => {
                    setConfirm(null);
                    if (confirm === 'restart') onRestart();
                    else onNew();
                  }}
                >
                  確定
                </BigButton>
                <BigButton tone="quiet" onClick={() => setConfirm(null)}>
                  取消
                </BigButton>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <BigButton tone="quiet" onClick={() => setConfirm(confirm === 'new' ? null : 'new')}>
              換一題
            </BigButton>
            <BigButton tone="quiet" onClick={onQuit}>
              回選單
            </BigButton>
          </div>
        </>
      )}
    </div>
  );
};
