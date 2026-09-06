import { SPRITES } from '../../art/sprites';
import { BigButton } from '../../components/BigButton';
import { SIZE_LABELS } from '../engine/symbols';
import { SIZES, type Play, type Size, type Stats, type Symbols } from '../engine/types';
import { Symbol } from '../components/Symbol';

const MochaCat = SPRITES.mochaCat;
const Baokaka = SPRITES.baokaka;

export const formatTime = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

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
  <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center gap-5 px-5 py-8 text-center">
    <p className="text-base font-bold text-ink/60">圖案數獨</p>
    <h1 className="text-huge font-bold leading-tight">
      摩卡貓的
      <br />
      收納挑戰
    </h1>

    <div className="flex items-end justify-center gap-1">
      <span className="block h-28 w-28">
        <Baokaka />
      </span>
      <span className="block h-20 w-20">
        <MochaCat />
      </span>
      <span className="ml-2 grid grid-cols-2 gap-1 rounded-2xl border-4 border-ink bg-white p-1">
        {[1, 2, 3, 4].map((value) => (
          <span key={value} className="block h-9 w-9">
            <Symbol value={value} symbols={symbols} className="text-body" />
          </span>
        ))}
      </span>
    </div>

    <p className="text-body leading-relaxed">
      摩卡貓把玩具櫃弄亂了！
      <br />
      每一橫列、每一直行、每一區
      <br />
      都要剛好各有一個玩具。
    </p>

    {resumable && (
      <BigButton onClick={onResume}>
        繼續上次的（{SIZE_LABELS[resumable.puzzle.size].name} · {formatTime(resumable.elapsed)}）
      </BigButton>
    )}

    <div className="flex w-full flex-col gap-3">
      {SIZES.map((size) => {
        const { solved, best, stars } = stats[size];
        return (
          <button
            key={size}
            type="button"
            onClick={() => onStart(size)}
            className="flex min-h-touch items-center gap-4 rounded-3xl border-4 border-ink bg-white px-4 py-3 text-left shadow-[0_5px_0_#3B2A20] transition-transform active:translate-y-1"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-4 border-ink bg-sun text-body font-bold">
              {size}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-body font-bold leading-tight">{SIZE_LABELS[size].name}</span>
              <span className="text-base text-ink/70">{SIZE_LABELS[size].blurb}</span>
              <span className="text-sm font-bold text-leaf">
                {solved === 0 ? '還沒收過' : `收好 ${solved} 次 · 最快 ${formatTime(best ?? 0)} · ★ ${stars}`}
              </span>
            </span>
          </button>
        );
      })}
    </div>

    <div className="flex flex-wrap justify-center gap-3">
      <BigButton tone="quiet" onClick={onToggleSymbols}>
        {symbols === 'pictures' ? '顯示：圖案' : '顯示：數字'}
      </BigButton>
      <BigButton tone="quiet" onClick={onExit}>
        回遊戲選單
      </BigButton>
    </div>

    <p className="text-sm text-ink/60">每一題都用邏輯就能解，不用猜；卡住就按提示，摩卡貓會說明為什麼。</p>
  </div>
);
