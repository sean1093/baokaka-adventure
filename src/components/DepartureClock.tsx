import { UI } from '../art/palette';

/**
 * The departure-board clock of the chapter card (art direction § 7.6): a dark board with a gold
 * frame, amber dot-matrix digits (a drawn 5×7 font) on split-flap tiles that flip in one after
 * another, 60ms apart. Reduced motion: no flip (kit.css).
 */

/** The 5×7 dot-matrix digits, row by row (1 = lit). */
export const DOT_FONT: Readonly<Record<string, readonly string[]>> = {
  '0': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
};

const Digit = ({ char, index }: { char: string; index: number }) => {
  const rows = DOT_FONT[char] ?? DOT_FONT['0'];
  return (
    <span
      className="kit-flap relative block h-[62px] w-[46px] overflow-hidden rounded-[4px] border border-black/60 bg-gradient-to-b from-board-dot/70 via-board to-board-dot/60 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_2px_4px_rgb(0_0_0/0.6)]"
      style={{ ['--i' as string]: index }}
      data-digit={char}
    >
      <svg viewBox="0 0 6 8" className="absolute inset-[5px_4px] h-[calc(100%-10px)] w-[calc(100%-8px)]" aria-hidden="true">
        {rows.map((row, y) =>
          [...row].map((bit, x) =>
            bit === '1' ? (
              <g key={`${x}-${y}`}>
                <circle cx={x + 0.5 + 0.5} cy={y + 0.5 + 0.5} r={0.62} fill={UI.amber} opacity={0.22} />
                <circle cx={x + 0.5 + 0.5} cy={y + 0.5 + 0.5} r={0.38} fill={UI.amber} />
              </g>
            ) : (
              <circle key={`${x}-${y}`} cx={x + 0.5 + 0.5} cy={y + 0.5 + 0.5} r={0.3} fill={UI.boardDot} />
            ),
          ),
        )}
      </svg>
      {/* The split of the flap, with a faint lip below it */}
      <span aria-hidden="true" className="absolute inset-x-0 top-1/2 block h-px bg-black/80" />
      <span aria-hidden="true" className="absolute inset-x-0 top-[calc(50%+1px)] block h-px bg-white/[0.06]" />
    </span>
  );
};

const Colon = () => (
  <span aria-hidden="true" className="flex h-[62px] flex-col justify-center gap-3 px-1">
    {[0, 1].map((dot) => (
      <span key={dot} className="block h-[7px] w-[7px] rounded-full bg-amber shadow-[0_0_8px_theme(colors.amber/70%)]" />
    ))}
  </span>
);

type Props = {
  /** `HH:MM` */
  time: string;
  /** 「下一站：…」 under the digits, station-board style */
  next?: string;
  className?: string;
};

export const DepartureClock = ({ time, next, className = '' }: Props) => {
  const [hh = '00', mm = '00'] = time.split(':');
  return (
    <div
      role="img"
      aria-label={`時間 ${time}${next ? `，下一站：${next}` : ''}`}
      className={`relative inline-flex flex-col items-center rounded-[6px] border border-gold bg-board px-4 pb-3 pt-2.5 shadow-[0_18px_36px_-14px_rgb(0_0_0/0.9),inset_0_0_0_4px_theme(colors.board),inset_0_0_0_5px_theme(colors.gold.DEFAULT/30%)] ${className}`}
      data-clock={time}
    >
      <span aria-hidden="true" className="mb-2 flex w-full items-center justify-between gap-6 font-num text-[11px] font-semibold tracking-[0.24em] text-gold/80">
        <span>MOON LINE</span>
        <span className="font-body tracking-[0.3em]">月亮線</span>
      </span>
      <span className="flex items-center gap-1.5" aria-hidden="true">
        <Digit char={hh[0]} index={0} />
        <Digit char={hh[1]} index={1} />
        <Colon />
        <Digit char={mm[0]} index={2} />
        <Digit char={mm[1]} index={3} />
      </span>
      {next && (
        <span aria-hidden="true" className="mt-2.5 block w-full border-t border-gold/25 pt-2 text-center font-serif text-label tracking-[0.16em] text-amber">
          下一站：{next}
        </span>
      )}
    </div>
  );
};
