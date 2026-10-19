import { POPUP, UI } from './palette';

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

/** WCAG 1.4.11: graphical objects and UI components need ≥ 3:1 against what is next to them. */
export const MIN_GRAPHIC_CONTRAST = 3;

export type TextPair = { readonly text: keyof typeof UI; readonly on: keyof typeof UI; readonly level: TextLevel; readonly use: string };

/** The navy surfaces text sits on: both panel stops and both command-button stops. */
const NAVY = ['panelTop', 'panelBottom', 'commandTop', 'commandBottom'] as const;
const PRIMARY = ['primaryTop', 'primaryMid', 'primaryBottom'] as const;
const PANEL = ['panelTop', 'panelBottom'] as const;

/**
 * The navy scrim behind the chapter card's text (its alpha over the sky's `mid` colour), so the
 * title reads at every hour of the night, dawn included. `contrast.test.ts` checks every chapter clock.
 */
export const CARD_SCRIM = 0.62;

export const TEXT_PAIRS: readonly TextPair[] = [
  ...NAVY.map((on): TextPair => ({ text: 'inkOnDark', on, level: 'body', use: 'dialogue, labels, numbers' })),
  ...NAVY.map((on): TextPair => ({ text: 'goldLight', on, level: 'body', use: 'names, key terms, gold numbers' })),
  ...NAVY.map((on): TextPair => ({ text: 'gold', on, level: 'body', use: 'chip numbers, headings in gold' })),
  ...NAVY.map((on): TextPair => ({ text: 'mutedOnDark', on, level: 'muted', use: 'sub-labels, hints, English station names' })),
  ...PRIMARY.map((on): TextPair => ({ text: 'primaryText', on, level: 'body', use: 'primary button label' })),
  { text: 'primaryText', on: 'gold', level: 'body', use: 'name plate on the gold tab' },
  { text: 'amber', on: 'panelBottom', level: 'body', use: 'chapter-card clock digits' },
  // UI kit v2 (#12)
  ...PRIMARY.map((on): TextPair => ({ text: 'primarySub', on, level: 'muted', use: 'primary command sub-label (MP, count)' })),
  { text: 'primaryText', on: 'diamondLight', level: 'body', use: 'name plate, gold tags (top stop)' },
  { text: 'primaryText', on: 'goldDeep', level: 'body', use: 'name plate (bottom stop)' },
  { text: 'amber', on: 'board', level: 'body', use: 'departure board digits and 「下一站」' },
  { text: 'gold', on: 'board', level: 'body', use: 'departure board header' },
  // HP numbers sit on party cards over the panel, never on a command button
  ...PANEL.map((on): TextPair => ({ text: 'hpLowTo', on, level: 'body', use: 'HP number under 40%' })),
  ...PANEL.map((on): TextPair => ({ text: 'hpCritTo', on, level: 'body', use: 'HP number under 20%, with the ❗ mark' })),
  { text: 'inkOnDark', on: 'scrim', level: 'body', use: 'chapter title on its scrim, text over the dialogue scrim' },
  { text: 'ink', on: 'parchment', level: 'body', use: '集章本 and sheets on parchment' },
];

export type PopupTextPair = { readonly text: keyof typeof POPUP; readonly on: keyof typeof POPUP; readonly use: string };

/**
 * 翻翻台北's text pairs (GDD § 1.3: contrast ≥ 7:1 for every text, no muted level). Text sits on
 * paper or on the navy cover, never on art (popup art bible § 7). Add a pair whenever a popup
 * screen puts a text colour on a new surface; `contrast.test.ts` holds each to 7:1.
 */
export const POPUP_TEXT_PAIRS: readonly PopupTextPair[] = [
  { text: 'ink', on: 'page', use: 'text printed on the page, labels and cards' },
  { text: 'ink', on: 'pageDark', use: 'text on the shaded band of a page or card' },
  { text: 'goldLight', on: 'cover', use: 'titles in gold foil on the cover' },
  { text: 'gold', on: 'cover', use: 'captions in gold on the cover' },
  { text: 'goldLight', on: 'coverDark', use: 'titles on the cover vignette' },
  { text: 'page', on: 'cover', use: 'cream labels under the bottom-bar discs' },
  // The kit port (issue 139)
  { text: 'inkSoft', on: 'page', use: 'secondary text on paper: the HUD label\'s 第N章 line, swatch captions' },
  { text: 'sealInk', on: 'page', use: 'red text on paper: the HUD\'s 「page title」' },
  { text: 'barLabel', on: 'cover', use: 'labels under the bottom-bar discs (提示 · 重來 · 選單)' },
  { text: 'stickerLabel', on: 'cover', use: 'sticker labels (解開 · 淘氣 · 土地公)' },
  { text: 'chalk', on: 'nightCardDeep', use: 'captions printed on night card' },
  { text: 'goldLight', on: 'nightCardDeep', use: 'gold captions on night card' },
];

/**
 * Non-text pairs (WCAG 1.4.11, ≥ 3:1): the parts of the touchable language that must stay findable
 * by contrast. The verb seal's glyph is one of them: it is a stamp read as a symbol as much as a
 * word, one of four redundant cues (bible § 4), drawn ≥ 22 px bold; the bible's seal red cannot carry
 * a 7:1 glyph, so it is held to the non-text level (decisions D-40). Text never uses these.
 */
export const POPUP_GRAPHIC_PAIRS: readonly PopupTextPair[] = [
  { text: 'sealGlyph', on: 'seal', use: 'the verb glyph stamped on a seal' },
  { text: 'seal', on: 'page', use: 'a seal on a cream page or card' },
  { text: 'marigold', on: 'nightCardDeep', use: 'a touchable on night card' },
  { text: 'marigold', on: 'nightCard', use: 'a touchable on the lighter night card' },
  { text: 'marigold', on: 'cover', use: 'the word-ring touchable in the bottom bar' },
  { text: 'chalk', on: 'nightCardDeep', use: 'the perch paw print' },
];
