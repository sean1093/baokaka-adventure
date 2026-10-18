/**
 * Sprite markup measurements for the § 8.2 budgets, shared by the lint tests and the art lab.
 * Works on serialised markup (`renderToStaticMarkup`), so it counts exactly what the DOM gets.
 */

/** Elements in the markup (every opening tag, self-closing or not). */
export const countElements = (markup: string): number => (markup.match(/<[a-zA-Z]/g) ?? []).length;

/** Serialised size in bytes (UTF-8). */
export const markupBytes = (markup: string): number => new TextEncoder().encode(markup).length;

/** Every `id="…"` in the markup, in order. */
export const markupIds = (markup: string): string[] => [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);

/** Every `#id` the markup references (`url(#…)`, `href="#…"`). */
export const markupRefs = (markup: string): string[] => [
  ...[...markup.matchAll(/url\(#([^)]+)\)/g)].map((match) => match[1]),
  ...[...markup.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]),
];

/** Elements a sprite must never contain (§ 8.2 rule 7). */
export const BANNED_ELEMENTS = ['filter', 'text', 'image', 'foreignObject'] as const;

export const bannedElements = (markup: string): string[] => BANNED_ELEMENTS.filter((tag) => new RegExp(`<${tag}[\\s>/]`).test(markup));
