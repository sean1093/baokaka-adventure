import { POPUP as C } from '../../../art/palette';
import type { LearnKey } from '../../content/words';

/**
 * Each word's icon and seal colour (GDD § 2.4 "icon + text"; popup art bible § 7: "each disc has a
 * word icon and a serif glyph, and is stamped with its own seal colour"; #99). The icons are cream
 * line drawings for a seal stamp, in a ±13 box about the origin; flat SVG, no filters (bible § 9.1).
 */

export const WORD_SEAL: Readonly<Record<LearnKey, string>> = {
  beep: C.wordBeep,
  bye: C.wordBye,
  no: C.wordNo,
  wow: C.wordWow,
  hug: C.wordHug,
  plane: C.wordPlane,
  whoosh: C.wordWhoosh,
  together: C.wordTogether,
  climb: C.wordGrowth,
  cruise: C.wordGrowth,
  walk: C.wordGrowth,
};

const ink = C.sealGlyph;
const line = (d: string, w = 2.2) => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const fill = (d: string) => `<path d="${d}" fill="${ink}"/>`;

export const WORD_ICON: Readonly<Record<LearnKey, string>> = {
  // 嗶！: a fare card with the reader's sound waves
  beep: `<rect x="-12" y="-5" width="13" height="17" rx="2" fill="${ink}" transform="rotate(-14 -5 3)"/>`
    + `<rect x="-9.5" y="-1" width="7" height="2.4" rx="1" fill="${C.wordBeep}" transform="rotate(-14 -5 3)"/>`
    + line('M4 -6q3.5 3.5 0 7M7.5 -9.5q6 7 0 14M11 -13q8.5 10.5 0 21', 2),
  // 掰掰: a waving hand
  bye: fill('M-6 12c-3-3-6-8-6-11c0-1.6 2-2 3-.6l2 3V-8c0-1.6 2.6-1.6 2.6 0v6V-11c0-1.6 2.6-1.6 2.6 0v9V-10c0-1.6 2.6-1.6 2.6 0v8V-7c0-1.6 2.5-1.6 2.5 0v9c0 5-2.5 10-6.3 10z')
    + line('M8.5 -12q3 1.5 3.8 4.5M10 -15.5q4.5 2 5.6 6.5', 1.8),
  // 不要！: a palm held up, a stop bar
  no: `<circle r="11.5" fill="none" stroke="${ink}" stroke-width="2.6"/>` + line('M-8 8L8 -8', 2.8),
  // 哇！: a light bulb waking up
  wow: fill('M0 -12a8 8 0 0 1 5 14.2V5h-10V2.2A8 8 0 0 1 0 -12z') + line('M-3.6 8.5h7.2M-2.4 11.5h4.8', 2)
    + line('M-12.5 -6l-2.6 -1.5M12.5 -6l2.6 -1.5M-11 3h-3M11 3h3M0 -15.5v-1', 1.8),
  // 抱抱: two arms round a heart
  hug: fill('M0 8c-5-3.4-8.5-6.6-8.5-10.3c0-2.6 2-4.4 4.2-4.4c1.8 0 3.4 1.1 4.3 2.8c.9-1.7 2.5-2.8 4.3-2.8c2.2 0 4.2 1.8 4.2 4.4C8.5 1.4 5 4.6 0 8z')
    + line('M-13 -4q-2 9 6 14M13 -4q2 9 -6 14', 2),
  // 飛機！: a little plane climbing
  plane: fill('M-13 4l3-1.6l5 1.4l5.6-7.2l-2.4-6.2l2.4-.8l5.6 5.6l5.2-1.6c2-.6 3.4 1.6 1.8 2.8l-4.6 2.6l-.8 7.8l-2.2.8l-2.2-6.4l-6.6 3.6l.4 3.4l-1.6.8l-2.6-3.2l-4.2-.6z'),
  // 咻——: a gust in three strokes
  whoosh: line('M-13 -5h14a4 4 0 1 0 -4 -4M-13 1h20a4.5 4.5 0 1 1 -4.5 4.5M-10 7h7', 2.3),
  // 一起: a small hand in a paw
  together: `<circle cx="-5" cy="1" r="6.5" fill="${ink}"/>` + `<circle cx="6" cy="2" r="5.5" fill="none" stroke="${ink}" stroke-width="2"/>`
    + `<circle cx="2" cy="-7.5" r="1.9" fill="${ink}"/><circle cx="6.5" cy="-9" r="1.9" fill="${ink}"/><circle cx="11" cy="-6.5" r="1.9" fill="${ink}"/>`,
  // 爬樓梯: steps
  climb: line('M-12 11H-5V4H2V-3H9V-10H13', 2.6),
  // 扶著站: a figure at a rail
  cruise: `<circle cx="-2" cy="-9.5" r="3.6" fill="${ink}"/>` + line('M-2 -5v9M-2 4l-3.5 8M-2 4l3.5 8M-2 -2l9 1.5M-13 -0.5h26', 2.3),
  // 第一步！: two footprints
  walk: fill('M-6 12a3.4 5 -12 1 1 .1 0zM-7.6 3.6a1.3 1.6 0 1 1 .1 0z') + fill('M6 3a3.4 5 12 1 1 .1 0zM7.6 -5.4a1.3 1.6 0 1 1 .1 0z'),
};

/**
 * A word's seal stamp (bible § 4 seals, § 7): a rounded square in its seal colour with a slightly
 * torn edge, an inner hairline and the cream icon, centred on the origin, `size` across.
 */
export function wordSeal(key: LearnKey, size = 30): string {
  const s = size / 2;
  const k = size / 30;
  const color = WORD_SEAL[key];
  // A torn edge: the square's sides wander a little
  const d = `M${-s + 2} ${-s}L${-s * 0.2} ${-s - 0.6}L${s - 2} ${-s}Q${s} ${-s} ${s} ${-s + 2}L${s + 0.5} ${s * 0.3}L${s} ${s - 2}Q${s} ${s} ${s - 2} ${s}L${s * 0.1} ${s + 0.6}L${-s + 2} ${s}Q${-s} ${s} ${-s} ${s - 2}L${-s - 0.5} ${-s * 0.2}L${-s} ${-s + 2}Q${-s} ${-s} ${-s + 2} ${-s}Z`;
  return `<path d="${d}" fill="${color}"/>`
    + `<rect x="${-s + 2.4}" y="${-s + 2.4}" width="${size - 4.8}" height="${size - 4.8}" rx="${2.4}" fill="none" stroke="${C.sealHairline}" stroke-width=".7" opacity=".55"/>`
    + `<g transform="scale(${k * 0.92})">${WORD_ICON[key]}</g>`;
}
