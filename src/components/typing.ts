/**
 * The dialogue typewriter (art direction § 7.5), as pure functions so the timing is unit-tested.
 *
 * Script text may mark key terms as `【詞】`: they show in gold and the brackets are dropped.
 * Typing runs over the visible text (brackets stripped): one character every 30ms, plus a 120ms
 * breath after 「，。！？」.
 */

/** Milliseconds per character. */
export const TYPE_MS = 30;
/** The extra pause after a phrase-ending mark. */
export const PAUSE_MS = 120;
/** Marks that earn the pause. */
export const PAUSE_AFTER = '，。！？';

/** A run of visible text; `key` runs are key terms (gold). */
export type Segment = { readonly text: string; readonly key: boolean };

const KEY_TERM = /【([^【】]+)】/g;

/**
 * Splits script text into plain and key-term runs. `【詞】` becomes a key run without its
 * brackets; an unmatched or empty bracket stays as literal text.
 */
export function parseMarkup(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(KEY_TERM)) {
    const at = match.index ?? 0;
    if (at > last) segments.push({ text: text.slice(last, at), key: false });
    segments.push({ text: match[1], key: true });
    last = at + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), key: false });
  return segments;
}

/** The visible text: the markup with key-term brackets removed. */
export const plainText = (text: string): string =>
  parseMarkup(text)
    .map((segment) => segment.text)
    .join('');

/** Characters are counted as code points, so a character outside the BMP never splits. */
const chars = (text: string): string[] => Array.from(text);

/**
 * How many characters of `text` (visible text, no markup) are showing `elapsedMs` after the line
 * started. Character `i` appears at `(i + 1) × 30ms` plus 120ms for every pause mark before it.
 */
export function typedChars(text: string, elapsedMs: number): number {
  const list = chars(text);
  let at = 0;
  for (let index = 0; index < list.length; index += 1) {
    at += TYPE_MS;
    if (at > elapsedMs) return index;
    if (PAUSE_AFTER.includes(list[index])) at += PAUSE_MS;
  }
  return list.length;
}

/** When the last character of `text` appears (ms): the time `typedChars` reaches the end. */
export function typingDuration(text: string): number {
  const list = chars(text);
  const pauses = list.slice(0, -1).filter((char) => PAUSE_AFTER.includes(char)).length;
  return list.length * TYPE_MS + pauses * PAUSE_MS;
}

/**
 * The segments cut at `shown` visible characters: each run splits into its typed part and its
 * ghost (untyped) part, so the whole line is always laid out and typing never reflows.
 */
export function splitTyped(segments: readonly Segment[], shown: number): { text: string; key: boolean; ghost: boolean }[] {
  const out: { text: string; key: boolean; ghost: boolean }[] = [];
  let left = shown;
  for (const segment of segments) {
    const list = chars(segment.text);
    const typed = Math.max(0, Math.min(list.length, left));
    if (typed > 0) out.push({ text: list.slice(0, typed).join(''), key: segment.key, ghost: false });
    if (typed < list.length) out.push({ text: list.slice(typed).join(''), key: segment.key, ghost: true });
    left -= list.length;
  }
  return out;
}

/** Character count of visible text, in code points (what `typedChars` counts up to). */
export const charCount = (text: string): number => chars(text).length;
