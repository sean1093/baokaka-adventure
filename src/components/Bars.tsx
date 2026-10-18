import { useEffect, useRef, useState } from 'react';
import { Alert } from './icons';

/**
 * HP and MP bars (art direction § 7.3, § 3.3). A hit eases the fill down over 300ms and a pale
 * lag band catches up 400ms later; a heal grows the fill with a sparkle riding its end. HP under
 * 40% turns orange and recolours its number; under 20% it pulses and shows a ❗ mark, so status
 * reads by shape as well as colour.
 */

export type HpState = 'ok' | 'low' | 'critical';

/** Thresholds of § 3.3, as fractions of max HP. */
export const HP_LOW = 0.4;
export const HP_CRITICAL = 0.2;

/** The fill ratio in [0, 1]; a max of 0 reads as empty. */
export const ratioOf = (value: number, max: number): number => (max > 0 ? Math.max(0, Math.min(1, value / max)) : 0);

/** Which HP state a value is in. Zero HP (knocked out) is critical too. */
export function hpState(value: number, max: number): HpState {
  const ratio = ratioOf(value, max);
  if (ratio < HP_CRITICAL) return 'critical';
  if (ratio < HP_LOW) return 'low';
  return 'ok';
}

/** The Tailwind text colour for an HP number in each state (§ 3.3 "the number recolours"). */
export const HP_NUMBER: Readonly<Record<HpState, string>> = {
  ok: 'text-inkOnDark',
  low: 'text-hp-lowTo',
  critical: 'text-hp-critTo',
};

type BarProps = {
  value: number;
  max: number;
  kind: 'hp' | 'mp';
  className?: string;
};

/**
 * One bar. The lag band and the sparkle are driven by the previous value: lower → the band waits
 * and catches up; higher → the band jumps and a sparkle plays at the new end.
 */
export const Bar = ({ value, max, kind, className = '' }: BarProps) => {
  const ratio = ratioOf(value, max);
  const previous = useRef(ratio);
  const [spark, setSpark] = useState(0);
  const grew = ratio > previous.current;

  useEffect(() => {
    if (ratio > previous.current) setSpark((count) => count + 1);
    previous.current = ratio;
  }, [ratio]);

  const state = kind === 'hp' ? hpState(value, max) : 'ok';
  const width = `${ratio * 100}%`;
  return (
    <span
      className={`kit-bar ${kind === 'mp' ? 'kit-bar--mp' : ''} ${state === 'low' ? 'kit-bar--low' : state === 'critical' ? 'kit-bar--crit' : ''} ${className}`}
      data-state={state}
    >
      <span className="kit-bar__track">
        {/* Jumps up with a heal (no transition), waits and catches up after a hit */}
        <span className="kit-bar__lag" style={{ width }} data-instant={grew ? '' : undefined} />
        <span className="kit-bar__fill" style={{ width }} />
      </span>
      {spark > 0 && <span key={spark} aria-hidden="true" className="kit-bar__spark" style={{ left: width }} />}
    </span>
  );
};

type StatsProps = {
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  /** Show the 體力 / 元氣 words before the numbers (off in the narrowest cards) */
  words?: boolean;
  className?: string;
};

/**
 * Both bars and the numbers line under them: 「體力 84/100  元氣 9」 in Fredoka 12px, the HP
 * number recoloured (and marked ❗ when critical).
 */
export const StatBars = ({ hp, hpMax, mp, mpMax, words = true, className = '' }: StatsProps) => {
  const state = hpState(hp, hpMax);
  return (
    <span className={`block ${className}`}>
      <Bar value={hp} max={hpMax} kind="hp" />
      <Bar value={mp} max={mpMax} kind="mp" className="mt-[3px]" />
      <span className="mt-1 flex items-center gap-1 overflow-hidden whitespace-nowrap font-num text-[12px] font-semibold leading-none text-mutedOnDark">
        <span className={`inline-flex shrink-0 items-center gap-px ${HP_NUMBER[state]}`} data-hp-state={state}>
          {words && <span className="font-body">體力</span>}
          <span className="tabular-nums">
            {hp}/{hpMax}
          </span>
          {state === 'critical' && <Alert size={12} aria-label="體力危險" role="img" aria-hidden={undefined} />}
        </span>
        <span className="inline-flex min-w-0 items-center gap-px">
          {words && <span className="font-body">元氣</span>}
          <span className="tabular-nums">{mp}</span>
        </span>
      </span>
    </span>
  );
};
