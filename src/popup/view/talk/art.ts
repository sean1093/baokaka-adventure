import { POPUP as C } from '../../../art/palette';
import { bubbleCloud, f1, wireSpring } from '../../art';
import type { Pt } from '../geometry';
import type { Box } from './place';

/**
 * The bubbles' paper (popup art bible § 5, § 7; #98), as SVG strings in page units. Live SVG with
 * flat fills and no filters (bible § 9.1: bubbles are cheap live pieces): a die-cut card in the
 * standee's warm white (`standeeCard`) with its mauve cut line and a stacked offset shadow, the wire
 * springs, the speaker labels, 廣播姊姊's paper loudspeaker and the narration strip.
 */

/** A die-cut shape: its dropped shadow (no blur), the warm-white card and the cut line. */
function dieCut(d: string, lift = 2): string {
  return `<path d="${d}" fill="${C.shadow}" opacity=".22" transform="translate(${f1(lift * 0.6)} ${f1(lift)})"/>`
    + `<path d="${d}" fill="${C.standeeCard}" stroke="${C.standeeCut}" stroke-width=".8"/>`;
}

/** The thought bubble's cloud of `w × h` centred on the origin, die-cut. */
export const cloudCard = (w: number, h: number): string => dieCut(bubbleCloud(0, 0, w, h), 2.5);

/** A speech card: a rounded box with softly bowed sides (cut by hand, not a CSS rectangle). */
export function speechCard(b: Box, r = 12): string {
  const { x, y, w, h } = b;
  const bow = Math.min(3, w * 0.02);
  const d = `M${f1(x + r)} ${f1(y)}Q${f1(x + w / 2)} ${f1(y - bow)} ${f1(x + w - r)} ${f1(y)}Q${f1(x + w)} ${f1(y)} ${f1(x + w)} ${f1(y + r)}`
    + `Q${f1(x + w + bow)} ${f1(y + h / 2)} ${f1(x + w)} ${f1(y + h - r)}Q${f1(x + w)} ${f1(y + h)} ${f1(x + w - r)} ${f1(y + h)}`
    + `Q${f1(x + w / 2)} ${f1(y + h + bow)} ${f1(x + r)} ${f1(y + h)}Q${f1(x)} ${f1(y + h)} ${f1(x)} ${f1(y + h - r)}`
    + `Q${f1(x - bow)} ${f1(y + h / 2)} ${f1(x)} ${f1(y + r)}Q${f1(x)} ${f1(y)} ${f1(x + r)} ${f1(y)}Z`;
  return dieCut(d);
}

/** A bark's bubble: a speech card with a short tail toward the speaker's head at `to`. */
export function barkCard(b: Box, to: Pt): string {
  const cx = Math.max(b.x + 10, Math.min(b.x + b.w - 10, to[0]));
  const below = to[1] > b.y + b.h / 2;
  const edge = below ? b.y + b.h - 1 : b.y + 1;
  const tip: Pt = [cx + (to[0] - cx) * 0.5, below ? edge + 9 : edge - 9];
  const tail = `M${f1(cx - 6)} ${f1(edge)}L${f1(tip[0])} ${f1(tip[1])}L${f1(cx + 6)} ${f1(edge)}Z`;
  return `<path d="${tail}" fill="${C.standeeCard}" stroke="${C.standeeCut}" stroke-width=".8"/>` + speechCard(b, Math.min(12, b.h / 2.4))
    + `<path d="M${f1(cx - 5)} ${f1(edge)}H${f1(cx + 5)}" stroke="${C.standeeCard}" stroke-width="2"/>`;
}

/** Where a spring from `from` meets the bubble `b`: its bottom (or top) edge, near `from`'s x. */
export function springEnd(b: Box, from: Pt): Pt {
  const x = Math.max(b.x + 16, Math.min(b.x + b.w - 16, from[0]));
  return from[1] > b.y + b.h / 2 ? [x, b.y + b.h - 2] : [x, b.y + 2];
}

/** A subtitle's or the thought bubble's wire spring, coils scaled to its length. */
export function talkSpring(from: Pt, to: Pt, k = 1): string {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const n = Math.max(3, Math.min(9, Math.round(len / 9)));
  return wireSpring(from[0], from[1], to[0], to[1], n, 3.6 * k, 1.6 * k);
}

/** 廣播姊姊's anchor (GDD § 5.1: a speaker icon): a little paper loudspeaker on a bracket, its mouth at the origin, facing −x. */
export function paHorn(): string {
  const horn = 'M2 -7L18 -14V14L2 7Z';
  return `<path d="M18 -2h10v-14" stroke="${C.wire}" stroke-width="2" fill="none" stroke-linecap="round"/>`
    + dieCut(horn, 1.5)
    + `<rect x="-4" y="-7" width="7" height="14" rx="2" fill="${C.printLilacDeep}"/>`
    + `<path d="M-8 -6q-4 6 0 12M-13 -10q-7 10 0 20" stroke="${C.inkSoft}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
}

/**
 * The narration strip (bible § 7, GDD § 5.1): a strip of warm paper with deckled ends, taped on
 * with two washi bits, slightly turned.
 */
export function stripCard(b: Box): string {
  const { x, y, w, h } = b;
  const teeth = Math.max(3, Math.round(h / 7));
  let left = '';
  let right = '';
  for (let i = 1; i <= teeth; i++) {
    const t = i / teeth;
    left = `L${f1(x + (i % 2 ? -2.5 : 1))} ${f1(y + h - t * h)}` + left;
    right += `L${f1(x + w + (i % 2 ? 2.5 : -1))} ${f1(y + t * h)}`;
  }
  const d = `M${f1(x)} ${f1(y)}H${f1(x + w)}${right}H${f1(x)}${left}Z`;
  const tape = (tx: number, rot: number, fill: string) =>
    `<rect x="${f1(tx - 16)}" y="${f1(y - 7)}" width="32" height="13" fill="${fill}" opacity=".85" transform="rotate(${rot} ${f1(tx)} ${f1(y)})"/>`;
  return `<path d="${d}" fill="${C.shadow}" opacity=".2" transform="translate(1.5 2.5)"/>`
    + `<path d="${d}" fill="${C.washi}" stroke="${C.standeeCut}" stroke-width=".8"/>`
    + tape(x + 26, -8, C.washiPink) + tape(x + w - 26, 7, C.washiCeladon);
}

/** A speaker's label tab over a subtitle card's top-left corner. */
export function labelTab(x: number, y: number, w: number, h: number, fill: string): string {
  return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h * 0.22)}" fill="${fill}"/>`
    + `<rect x="${f1(x + 2)}" y="${f1(y + 2)}" width="${f1(w - 4)}" height="${f1(h - 4)}" rx="${f1(h * 0.18)}" fill="none" stroke="${C.sealHairline}" stroke-width=".6" opacity=".6"/>`;
}
