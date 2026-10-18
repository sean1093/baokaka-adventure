import { useEffect, useState } from 'react';
import { UI, skyAt, withAlpha } from '../art/palette';
import { CARD_SCRIM } from '../art/contrast';
import { DepartureClock } from './DepartureClock';
import { useReducedMotion } from './motion';

/**
 * The chapter title card (art direction § 7.6). Full screen in the sky of the chapter's clock
 * (§ 3.2) with a slow star twinkle; the landmark draws itself in gold line art (900ms) and fills to
 * 25%; the departure-board clock flips its digits in; kicker, title and an optional 「下一站」.
 *
 * The card plays for 2.4s. A tap while it plays jumps to the end; a tap after that (or any tap with
 * reduced motion, where the card simply fades in over 300ms) moves on.
 */

/** How long the card plays before a tap moves on instead of finishing it. */
export const CARD_PLAY_MS = 2400;

/**
 * A generic Taipei-ish skyline (390 × 160 units): blocks of towers around one tall stepped spire.
 * Chapters pass their own landmark outline through `landmark` once their art exists.
 */
export const GENERIC_SKYLINE =
  'M0 160V118H18V104H34V122H46V92H58V86H70V112H84V98H96V70H104V64H112V100H126V116H140V88H150V80H160V108H170V62H174V46H178V30H182V14H185V2H187V14H190V30H194V46H198V62H202V96H214V84H226V76H236V104H250V90H262V72H270V66H278V94H292V110H304V86H316V80H328V100H340V114H352V94H364V102H378V120H390V160Z';

/** A fixed star field (fractions of the sky), so screenshots never change. */
const STARS = Array.from({ length: 26 }, (_, index) => ({
  x: ((index * 7919 + 13) % 997) / 997,
  y: (((index * 104729 + 7) % 991) / 991) * 0.5,
  r: index % 6 === 0 ? 1.5 : index % 3 === 0 ? 1.1 : 0.8,
}));

type Props = {
  /** 「第 2 章」, or the label that replaces it (尾聲 / 番外) */
  kicker: string;
  title: string;
  /** `HH:MM`: picks the sky and shows on the board; no clock without it */
  time?: string;
  /** 「下一站：…」 on the board */
  next?: string;
  /** The landmark's outline as path data in a 390 × 160 box; defaults to a generic skyline */
  landmark?: string;
  onDismiss: () => void;
};

export const ChapterCard = ({ kicker, title, time, next, landmark = GENERIC_SKYLINE, onDismiss }: Props) => {
  const reduced = useReducedMotion();
  const [played, setPlayed] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const sky = skyAt(time ?? '00:00');

  useEffect(() => {
    const timer = window.setTimeout(() => setPlayed(true), CARD_PLAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const done = played || skipped || reduced;
  const moonTop = sky.moon > 0 ? 8 + (1 - sky.moon) * 34 : null;
  const starOpacity = Math.max(0, 1 - sky.dawn * 1.2);

  return (
    <button
      type="button"
      onClick={() => (done ? onDismiss() : setSkipped(true))}
      aria-label={`${kicker} ${title}${time ? `，${time}` : ''}（點一下繼續）`}
      data-chapter-card={time ?? ''}
      className={`kit-fade-in absolute inset-0 z-40 block h-full w-full overflow-hidden text-center ${skipped ? 'kit-card--done' : ''}`}
      style={{ background: `linear-gradient(180deg, ${sky.top} 0%, ${sky.mid} 58%, ${sky.horizon} 100%)` }}
    >
      {/* Dawn: a warm glow rising from the horizon */}
      {sky.dawn > 0 && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 block h-2/3"
          style={{ background: `radial-gradient(70% 60% at 50% 100%, ${sky.horizon}, transparent 72%)`, opacity: sky.dawn }}
        />
      )}

      <span aria-hidden="true" className="absolute inset-0 block" style={{ opacity: starOpacity }}>
        {STARS.map((star, index) => (
          <span
            key={index}
            className="kit-star absolute block rounded-full bg-inkOnDark"
            style={{ left: `${star.x * 100}%`, top: `${star.y * 100}%`, width: star.r * 2, height: star.r * 2, ['--i' as string]: index }}
          />
        ))}
      </span>

      {moonTop !== null && (
        <span
          aria-hidden="true"
          className="absolute right-[14%] block h-14 w-14 rounded-full"
          style={{
            top: `${moonTop}%`,
            background: `radial-gradient(circle at 40% 38%, ${UI.inkOnDark}, ${sky.rim} 70%)`,
            boxShadow: `0 0 24px 6px ${sky.rim}55, 0 0 80px 24px ${sky.rim}22`,
          }}
        />
      )}

      {/* The landmark draws itself in gold, then fills to 25% */}
      <svg aria-hidden="true" viewBox="0 0 390 160" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 block h-[27%] w-full">
        {/* A night silhouette under the gold, so the 25% fill reads as warm dark, not as a grey veil */}
        <path d={landmark} fill={UI.panelBottom} opacity={0.82} />
        <path d={landmark} className="kit-draw-fill" fill={UI.gold} />
        <path d={landmark} pathLength={1} className="kit-draw" fill="none" stroke={UI.goldLight} strokeWidth={1.4} strokeLinejoin="round" />
      </svg>

      {/* The text sits on a soft navy scrim so it reads at any hour (contrast.test checks CARD_SCRIM) */}
      <span
        aria-hidden="true"
        className="absolute inset-0 block"
        style={{ background: `radial-gradient(85% 34% at 50% 44%, ${withAlpha(UI.scrim, CARD_SCRIM)} 0%, ${withAlpha(UI.scrim, CARD_SCRIM)} 45%, transparent 100%)` }}
      />

      <span className="absolute inset-x-0 top-[28%] flex flex-col items-center px-8">
        <span className="kit-card-rise block font-serif text-label tracking-[0.3em] text-gold-light" style={{ ['--delay' as string]: '100ms' }}>
          {kicker}
        </span>
        <span className="kit-card-rise mt-2 block font-serif text-chapter tracking-[0.08em] text-inkOnDark [text-shadow:0_2px_12px_rgb(0_0_0/0.45)]" style={{ ['--delay' as string]: '250ms' }}>
          {title}
        </span>
        <span className="kit-card-rise kit-rule mt-4 block w-44" style={{ ['--delay' as string]: '400ms' }} />
        {time && <DepartureClock time={time} next={next} className="mt-7" />}
      </span>

      <span className="kit-card-hint absolute inset-x-0 bottom-[max(env(safe-area-inset-bottom),22px)] flex justify-center">
        <span className="kit-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-caption text-mutedOnDark">
          點一下繼續
          <span aria-hidden="true" className="kit-next h-2.5 w-2.5" />
        </span>
      </span>
    </button>
  );
};
