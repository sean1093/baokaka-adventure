import { useMemo } from 'react';
import { POPUP as C } from '../../../art/palette';
import { EVENT_RADIUS } from '../../core/events';
import type { Word } from '../../core/types';
import { WHOOSH_CONE_DEGREES, WORD_EVENT } from '../../core/words';
import type { Pt } from '../geometry';
import { ArtG, r2 } from '../parts/common';
import { WORD_SEAL } from './icons';
import './words.css';

/**
 * The effect ring of a word being said (GDD § 2.4: "a big speech bubble appears, the effect
 * resolves"; #99): the word's reach widening from Baokaka in its seal colour and fading, so the
 * player sees how far it carries — 嗶！'s 120, 咻——'s cone in his facing, 飛機！ the whole page. Words
 * that act on him alone (不要！) or one step away (抱抱, 一起) get a small burst. Page units, drawn
 * in the fx layer on the say tick; a still shows it settled at its full reach.
 */

/** The burst for words with no radius. */
export const BURST_R = 44;
/** 飛機！ reaches the whole page: drawn this big. */
export const PAGE_R = 300;

/** How far the ring is drawn for `word`. */
export function sayRadius(word: Word): number {
  const type = WORD_EVENT[word];
  const r = type === null ? undefined : EVENT_RADIUS[type];
  if (r === undefined) return BURST_R;
  return Number.isFinite(r) ? r : PAGE_R;
}

function sayArt(word: Word, facing: 'l' | 'r'): string {
  const r = sayRadius(word);
  const color = WORD_SEAL[word];
  if (word === 'whoosh') {
    // 咻——'s 90° cone in his facing direction
    const half = (WHOOSH_CONE_DEGREES / 2) * (Math.PI / 180);
    const s = facing === 'r' ? 1 : -1;
    const x = r2(Math.cos(half) * r * s);
    const y = r2(Math.sin(half) * r);
    const d = `M0 0L${x} ${-y}A${r} ${r} 0 0 ${facing === 'r' ? 1 : 0} ${x} ${y}Z`;
    return `<path d="${d}" fill="${color}" fill-opacity=".14" stroke="${color}" stroke-width="2.6" stroke-dasharray="7 6" stroke-linejoin="round"/>`;
  }
  const waves = [0.55, 0.78].map((k) => `<circle r="${r2(r * k)}" fill="none" stroke="${C.chalk}" stroke-opacity=".7" stroke-width="1.6" stroke-dasharray="2 7" stroke-linecap="round"/>`).join('');
  return `<circle r="${r}" fill="${color}" fill-opacity=".12" stroke="${color}" stroke-width="2.8" stroke-dasharray="8 6" stroke-linecap="round"/>` + waves;
}

export function SayRing({ word, at, facing, reduced }: { word: Word; at: Pt; facing: 'l' | 'r'; reduced: boolean }) {
  const html = useMemo(() => sayArt(word, facing), [word, facing]);
  return (
    <g data-say-ring={word} transform={`translate(${r2(at[0])} ${r2(at[1])})`} opacity={0.85}>
      <ArtG html={html} className={reduced ? 'ws-ring-fade' : 'ws-ring'} />
    </g>
  );
}
