import { useMemo, useRef, type MouseEvent } from 'react';
import { POPUP as C, withAlpha } from '../../../art/palette';
import { UI } from '../../content';
import { LEARN_BEATS, type LearnKey } from '../../content/words';
import { ArtG, r2 } from '../parts/common';
import { wordSeal } from './icons';
import './words.css';

/**
 * The word card (GDD § 5.4; popup art bible § 7; #99): the end of a learn beat — a cream index card
 * taped to the page with two washi strips, the word's seal stamp, the word big in red serif and its
 * short effect (「嗶！：閘門開開」 as § 5.4 prints it). It drops in and swings to rest (a fade under
 * reduced motion). The world waits while it is up; a tap anywhere puts it away (`onDone`).
 *
 * Screen px, centred over the page; every glyph ≥ 20 px (R5), ink and seal ink on cream (≥ 7:1).
 */

export const CARD_W = 300;
export const CARD_H = 246;

const SERIF = "'Noto Serif TC', serif";

/** The card's paper: a kraft back peeking out, the cream face with a deckled foot, two washi strips. */
function cardArt(w: number, h: number): string {
  let foot = '';
  const teeth = 18;
  for (let i = teeth - 1; i >= 0; i--) foot += `L${r2((i / teeth) * w)} ${r2(h + (i % 2 ? 2.6 : -0.6))}`;
  const face = `M0 0H${w}V${h}${foot}Z`;
  const tape = (x: number, rot: number, fill: string) => `<rect x="${x - 34}" y="-12" width="68" height="22" fill="${fill}" opacity=".88" transform="rotate(${rot} ${x} 0)"/>`;
  return `<path d="${face}" fill="${C.shadow}" opacity=".32" transform="translate(4 8)"/>`
    + `<path d="${face}" fill="${C.kraft}" transform="translate(-3 3) rotate(-1.6 ${w / 2} ${h / 2})"/>`
    + `<path d="${face}" fill="${C.page}" stroke="${C.standeeCut}" stroke-width=".8"/>`
    + `<rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="4" fill="none" stroke="${C.pageDark}" stroke-width="1.2" stroke-dasharray="1 5" stroke-linecap="round"/>`
    + tape(52, -9, C.washiPink) + tape(w - 52, 8, C.washiCeladon);
}

export interface WordCardProps {
  readonly learn: LearnKey;
  /** Screen width and the vertical centre to hang the card at */
  readonly vw: number;
  readonly cy: number;
  readonly reduced: boolean;
  readonly onDone: () => void;
}

export function WordCard({ learn, vw, cy, reduced, onDone }: WordCardProps) {
  const beat = LEARN_BEATS[learn];
  const art = useMemo(() => cardArt(CARD_W, CARD_H), []);
  const seal = useMemo(() => wordSeal(learn, 64), [learn]);
  // Only a tap that starts on the card puts it away: the click a touch synthesizes after the tap
  // that brought the card up (on the last subtitle) must not dismiss it unseen. Keys still work.
  const pressed = useRef(false);
  const click = (e: MouseEvent) => {
    if (pressed.current || e.detail === 0) onDone();
    pressed.current = false;
  };
  const left = (vw - CARD_W) / 2;
  const top = cy - CARD_H / 2;
  return (
    <button
      type="button"
      className="absolute inset-0 block cursor-default"
      style={{ background: withAlpha(C.shadow, 0.3), WebkitTapHighlightColor: 'transparent' }}
      aria-label={`${UI.ring.card}：${beat.title}`}
      data-word-card={learn}
      onPointerDown={(e) => {
        e.stopPropagation();
        pressed.current = true;
      }}
      onClick={click}
    >
      <svg
        className={`absolute overflow-visible ${reduced ? 'wr-fade' : 'wc-drop'}`}
        style={{ left: r2(left), top: r2(top) }}
        width={CARD_W}
        height={CARD_H}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        aria-hidden="true"
      >
        <g transform={`rotate(-1.2 ${CARD_W / 2} ${CARD_H / 2})`}>
          <ArtG html={art} />
          <g transform={`translate(${CARD_W / 2} 62) rotate(-4)`}>
            <ArtG html={seal} />
          </g>
          <text x={CARD_W / 2} y={beat.effect === null ? 178 : 160} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={52} fill={C.sealInk}>
            {beat.title}
          </text>
          {beat.effect !== null && (
            <>
              <path d={`M${CARD_W / 2 - 92} 180H${CARD_W / 2 + 92}`} stroke={C.sealInk} strokeOpacity={0.35} strokeWidth={1.4} strokeDasharray="5 5" />
              <text x={CARD_W / 2} y={214} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={24} fill={C.ink}>
                {beat.effect}
              </text>
            </>
          )}
        </g>
      </svg>
    </button>
  );
}
