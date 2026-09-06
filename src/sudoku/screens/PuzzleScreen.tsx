import { useEffect, useRef, useState } from 'react';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { AppBar, Card, Chip, Screen, SoundToggle } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { Bulb, Clock, Eraser, Pencil, Refresh, Shuffle } from '../../components/icons';
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

/** Palette symbol size per board, so a 9x9 tray still fits five across */
const PALETTE_SIZE: Record<number, string> = { 4: 'text-display', 6: 'text-headline', 9: 'text-heading' };

/** What Mocha says while nothing else is going on */
const IDLE_TIPS = [
  '先點一格，再點下面的玩具。',
  '先點玩具，再一格一格放進去也可以。',
  '同一橫列、直行、區裡，每種只能有一個。',
  '卡住了就按提示，我會告訴你為什麼。',
];

/** The two irreversible choices, each asked in a sheet before it happens */
const ASK = { restart: '這一題重新開始？', new: '放棄這一題，換新的？' } as const;

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
  const [ask, setAsk] = useState<'restart' | 'new' | null>(null);

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
  const eraserLabel = armed !== null && !canErase ? '放下' : '清除';

  return (
    <Screen>
      <AppBar
        title={`${SIZE_LABELS[size].name} ${size}×${size}`}
        kicker="摩卡貓的收納挑戰"
        onBack={onQuit}
        backLabel="回選單"
        right={<SoundToggle on={soundOn} onToggle={onToggleSound} />}
      />

      <div className="flex items-center gap-2">
        <Chip>
          <Clock size={14} />
          {formatTime(elapsed)}
        </Chip>
        <Chip>
          <Bulb size={14} />
          提示 {hints}
        </Chip>
        {notesMode && <Chip tone="sky">筆記中</Chip>}
      </div>

      <div className="rounded-3xl bg-surface p-2 shadow-card">
        <Board play={play} symbols={symbols} onSelect={onSelect} />
      </div>

      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="block h-14 w-14 shrink-0">
          <MochaCat />
        </span>
        <p
          key={message?.key ?? 0}
          className={`flex-1 rounded-2xl bg-surface px-4 py-2 text-copy font-bold shadow-card ${message ? 'pop' : 'text-muted'}`}
        >
          {message?.text ?? idleTip}
        </p>
      </div>

      {solved ? (
        <Card tone="accent" className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex gap-1">
            {[1, 2, 3].map((star) => (
              <span
                key={star}
                aria-hidden="true"
                className={`block h-11 w-11 ${star <= starsFor(hints) ? 'pop' : 'opacity-25 grayscale'}`}
                style={{ animationDelay: `${star * 120}ms` }}
              >
                <Star />
              </span>
            ))}
          </div>
          <p className="text-display font-extrabold">全部收好了！</p>
          <p className="text-copy">
            用時 {formatTime(elapsed)} · 提示 {hints} 次
          </p>
          <div className="mt-1 flex w-full flex-col gap-2">
            <Button full size="lg" onClick={onNew}>
              再來一題
            </Button>
            <Button full variant="ghost" onClick={onQuit}>
              回選單
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className={`grid gap-2 rounded-3xl bg-ink/[0.05] p-2 ${PALETTE_COLUMNS[size]}`}>
            {remaining.map((left, index) => {
              const value = index + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onPick(value)}
                  aria-label={`放${value}`}
                  aria-pressed={armed === value}
                  className={[
                    'relative aspect-square rounded-2xl shadow-card transition-transform duration-150 active:scale-95',
                    armed === value ? 'bg-sun/30 ring-2 ring-sun' : 'bg-surface',
                    left === 0 ? 'opacity-35' : '',
                  ].join(' ')}
                >
                  <Symbol value={value} symbols={symbols} className={PALETTE_SIZE[size]} />
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-caption font-bold leading-none text-cream">
                    {left}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={onErase}
              aria-label={eraserLabel}
              className={[
                'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl bg-surface shadow-card',
                'transition-transform duration-150 active:scale-95',
                canErase || armed !== null ? '' : 'opacity-35',
              ].join(' ')}
            >
              <Eraser size={20} />
              <span className="text-caption font-bold">{eraserLabel}</span>
            </button>
          </div>

          {/* Three equal actions. `!` beats the Button variant's own colour and padding utilities. */}
          <div className="grid grid-cols-3 gap-2">
            <Button full onClick={onHint} icon={<Bulb size={18} />} className="!px-3">
              提示
            </Button>
            <Button
              full
              variant="tonal"
              onClick={onToggleNotes}
              icon={<Pencil size={18} />}
              className={notesMode ? '!bg-ink !px-3 !text-cream' : '!px-3'}
            >
              筆記
            </Button>
            <Button full variant="tonal" onClick={() => setAsk('restart')} icon={<Refresh size={18} />} className="!px-3">
              重來
            </Button>
          </div>

          <Button full variant="ghost" onClick={() => setAsk('new')} icon={<Shuffle size={18} />}>
            換一題
          </Button>

          <Sheet open={ask !== null} onClose={() => setAsk(null)} title={ask ? ASK[ask] : undefined}>
            <div className="flex flex-col gap-2">
              <Button
                full
                size="lg"
                onClick={() => {
                  setAsk(null);
                  if (ask === 'restart') onRestart();
                  else onNew();
                }}
              >
                確定
              </Button>
              <Button full size="lg" variant="tonal" onClick={() => setAsk(null)}>
                取消
              </Button>
            </div>
          </Sheet>
        </>
      )}
    </Screen>
  );
};
