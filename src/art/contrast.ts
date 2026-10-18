import { UI } from './palette';

/**
 * WCAG 2 contrast for the UI's text tokens (art direction § 3.3). `TEXT_PAIRS` lists every text
 * colour on every surface the option D UI puts it on; `contrast.test.ts` holds each to its level
 * and the art lab shows the ratios. Add a pair here whenever a screen puts text on a new surface.
 */

const linear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** Relative luminance of a `#RRGGBB` colour. */
export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((at) => linear(parseInt(hex.slice(at, at + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG contrast ratio of two `#RRGGBB` colours, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** `body`: dialogue, labels, numbers (≥ 7:1). `muted`: sub-labels, hints, captions (≥ 4.5:1). */
export type TextLevel = 'body' | 'muted';
export const MIN_CONTRAST: Readonly<Record<TextLevel, number>> = { body: 7, muted: 4.5 };

export type TextPair = { readonly text: keyof typeof UI; readonly on: keyof typeof UI; readonly level: TextLevel; readonly use: string };

/** The navy surfaces text sits on: both panel stops and both command-button stops. */
const NAVY = ['panelTop', 'panelBottom', 'commandTop', 'commandBottom'] as const;
const PRIMARY = ['primaryTop', 'primaryMid', 'primaryBottom'] as const;

export const TEXT_PAIRS: readonly TextPair[] = [
  ...NAVY.map((on): TextPair => ({ text: 'inkOnDark', on, level: 'body', use: 'dialogue, labels, numbers' })),
  ...NAVY.map((on): TextPair => ({ text: 'goldLight', on, level: 'body', use: 'names, key terms, gold numbers' })),
  ...NAVY.map((on): TextPair => ({ text: 'gold', on, level: 'body', use: 'chip numbers, headings in gold' })),
  ...NAVY.map((on): TextPair => ({ text: 'mutedOnDark', on, level: 'muted', use: 'sub-labels, hints, English station names' })),
  ...PRIMARY.map((on): TextPair => ({ text: 'primaryText', on, level: 'body', use: 'primary button label' })),
  { text: 'primaryText', on: 'gold', level: 'body', use: 'name plate on the gold tab' },
  { text: 'amber', on: 'panelBottom', level: 'body', use: 'chapter-card clock digits' },
  { text: 'ink', on: 'parchment', level: 'body', use: '集章本 and sheets on parchment' },
];
