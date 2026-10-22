import type { PageDef } from '../core/types';
import { SCRIPT } from '../content/script';

/**
 * Font warm-up (#136). The game's fonts are self-hosted slices in play order (#68, D-105): a slice
 * is fetched the first time one of its characters is drawn. A line that brought in a new slice
 * mid-page made the browser fetch it and lay the page's text out again (on 6-2, a 45 ms frame at
 * 4× throttle as the clerk spoke; on a phone on 4G, a line drawn in a fallback face first). A page
 * now asks for the slices its lines need once its bitmaps are in.
 */

/** The faces lines are set in (`Talk.tsx`): the words in Noto Serif TC 700, a speaker's name tab in 900. */
const LINE_FACE = "700 20px 'Noto Serif TC'";
const LABEL_FACE = "900 20px 'Noto Serif TC'";

/** What a page's lines print: the words of the script lines its definition names, and their speakers' name tabs. */
export function pageText(def: Pick<PageDef, 'lines'>): { readonly words: string; readonly labels: string } {
  const keys = JSON.stringify(def.lines ?? {}).match(/"[^"]+"/g) ?? [];
  const lines = keys.map((k) => SCRIPT[k.slice(1, -1) as keyof typeof SCRIPT]).filter((l) => l !== undefined);
  const chars = (s: string) => [...new Set(s)].join('');
  return { words: chars(lines.map((l) => l.text).join('')), labels: chars(lines.map((l) => l.label ?? '').join('')) };
}

/**
 * Starts fetching the font slices a page's lines need (never throws; a no-op without the Font
 * Loading API). Called once the page's own bitmaps are in, so on 4G the fonts for later lines
 * never hold up the page's first paint.
 */
export function warmFonts({ words, labels }: { readonly words: string; readonly labels: string }): void {
  const fonts = typeof document === 'undefined' ? undefined : document.fonts;
  if (fonts === undefined || typeof fonts.load !== 'function') return;
  if (words !== '') void fonts.load(LINE_FACE, words).catch(() => undefined);
  if (labels !== '') void fonts.load(LABEL_FACE, labels).catch(() => undefined);
}
