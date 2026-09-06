import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { AppBar, Card, Chip, Screen } from '../../components/Screen';
import { ChevronRight } from '../../components/icons';
import { SIZE_LABELS } from '../engine/symbols';
import { SIZES, type Play, type Size, type Stats, type Symbols } from '../engine/types';
import { Symbol } from '../components/Symbol';

const MochaCat = SPRITES.mochaCat;

export const formatTime = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** One tint per cabinet size, so the three tiles read apart at a glance */
const BADGE: Record<Size, string> = { 4: 'bg-sky/25', 6: 'bg-sun/30', 9: 'bg-berry/15' };

type Props = {
  stats: Stats;
  symbols: Symbols;
  resumable: Play | null;
  onStart: (size: Size) => void;
  onResume: () => void;
  onToggleSymbols: () => void;
  onExit: () => void;
};

export const SudokuTitleScreen = ({ stats, symbols, resumable, onStart, onResume, onToggleSymbols, onExit }: Props) => (
  <Screen>
    <AppBar title="摩卡貓的收納挑戰" kicker="圖案數獨" onBack={onExit} backLabel="回遊戲選單" />

    <Card tone="accent" className="p-5">
      <div className="flex items-end justify-center gap-3">
        <span aria-hidden="true" className="block h-20 w-20">
          <MochaCat />
        </span>
        <span aria-hidden="true" className="grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1.5 shadow-card">
          {[1, 2, 3, 4].map((value) => (
            <span key={value} className="block h-9 w-9">
              <Symbol value={value} symbols={symbols} className="text-heading" />
            </span>
          ))}
        </span>
      </div>
      <p className="mt-4 text-center text-copy text-ink/70">
        摩卡貓把玩具櫃弄亂了！
        <br />
        每一橫列、每一直行、每一區
        <br />
        都要剛好各有一個玩具。
      </p>
    </Card>

    {resumable && (
      <Button full size="lg" onClick={onResume}>
        繼續上次的（{SIZE_LABELS[resumable.puzzle.size].name} · {formatTime(resumable.elapsed)}）
      </Button>
    )}

    {SIZES.map((size) => {
      const { solved, best, stars } = stats[size];
      return (
        <button
          key={size}
          type="button"
          onClick={() => onStart(size)}
          className="flex w-full items-center gap-4 rounded-3xl bg-surface p-4 text-left shadow-card transition-transform duration-150 active:scale-[0.98]"
        >
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-headline font-extrabold ${BADGE[size]}`}>{size}</span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="text-heading font-extrabold leading-tight">{SIZE_LABELS[size].name}</span>
            <span className="text-label text-muted">{SIZE_LABELS[size].blurb}</span>
            {solved === 0 ? (
              <Chip>還沒收過</Chip>
            ) : (
              <Chip tone="leaf">{`收好 ${solved} 次 · 最快 ${formatTime(best ?? 0)} · ★ ${stars}`}</Chip>
            )}
          </span>
          <ChevronRight aria-hidden="true" className="shrink-0 text-muted" />
        </button>
      );
    })}

    {/* 圖案 / 數字: two radio halves sliding over one tonal track */}
    <div role="radiogroup" aria-label="顯示方式" className="flex rounded-full bg-ink/[0.06] p-1">
      {(['pictures', 'digits'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={symbols === mode}
          onClick={() => {
            if (symbols !== mode) onToggleSymbols();
          }}
          className={[
            'h-11 flex-1 rounded-full text-label font-bold transition-[background-color,color] duration-150',
            symbols === mode ? 'bg-surface text-ink shadow-card' : 'text-muted',
          ].join(' ')}
        >
          {mode === 'pictures' ? '圖案' : '數字'}
        </button>
      ))}
    </div>

    <p className="text-center text-caption text-muted">每一題都用邏輯就能解，不用猜；卡住就按提示，摩卡貓會說明為什麼。</p>
  </Screen>
);
