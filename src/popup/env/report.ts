import type { PageDef } from '../core/types';
import { chapterGradeKey, pageSprites, payloadBytes } from '../sprites/loader';
import type { EnvFile, EnvManifest } from './manifest';
import { stripCutouts } from './windowStrips';

/**
 * The art payload report (#96; GDD § 3.9 budget, bible § 9): what each page downloads, checked
 * against the budgets by `env.test.ts` in CI and printed by `npm run art:report` (and at the end of
 * `npm run bake:popup`).
 *
 * - **Page art** is the environment a page draws: its baked backdrop, the bitmaps of every state
 *   (and lifted state) of its baked parts, and its cut-outs. Budget: 350 KB per page.
 * - **First load** is everything the art pipeline fetches before the first chapter is playable: the
 *   screens' art (the cover is the first thing shown, #97), the first chapter's pages' environment
 *   art plus its character set at @3x (the worst device scale;
 *   the core set is pinned at ≤ 400 KB on its own by `sprites.test.ts`). Budget: 2.5 MB. Later
 *   chapters load lazily, page by page.
 */

/** GDD § 3.9: page art payload. */
export const PAGE_ART_BUDGET = 350 * 1024;
/** GDD § 3.9: first load. */
export const FIRST_LOAD_BUDGET = 2.5 * 1024 * 1024;

export interface PageArt {
  readonly page: string;
  readonly backdrop: EnvFile | null;
  readonly parts: readonly EnvFile[];
  readonly cutouts: readonly EnvFile[];
  /** Art keys the page names that have no bitmap: drawn live (a stand-in, unless `view/art/gaps.ts` says it is on purpose) */
  readonly placeholders: readonly string[];
  readonly bytes: number;
}

/** The environment bitmaps a page draws, from a manifest. */
export function pageArt(def: Pick<PageDef, 'id' | 'backdrop' | 'parts' | 'cutouts'>, m: EnvManifest): PageArt {
  const placeholders: string[] = [];
  const backdrop = m.backdrops[def.backdrop] ?? null;
  if (backdrop === null) placeholders.push(def.backdrop);
  const parts: EnvFile[] = [];
  for (const key of new Set(def.parts.map((p) => p.art))) {
    const e = m.parts[key];
    if (e === undefined) placeholders.push(key);
    else parts.push(...Object.values(e.states), ...Object.values(e.lifted ?? {}));
  }
  const cutouts: EnvFile[] = [];
  // Its cut-outs, and a moving 月亮線 car's window strip and frame (#193)
  for (const key of new Set([...(def.cutouts ?? []).map((c) => c.art), ...stripCutouts(def.backdrop)])) {
    const e = m.cutouts[key];
    if (e === undefined) placeholders.push(key);
    else cutouts.push(e);
  }
  const bytes = [backdrop, ...parts, ...cutouts].reduce((n, f) => n + (f?.bytes ?? 0), 0);
  return { page: def.id, backdrop, parts, cutouts, placeholders, bytes };
}

export interface FirstLoad {
  readonly chapter: number;
  readonly env: number;
  readonly sprites: number;
  readonly bytes: number;
}

/** The first chapter's environment art plus its characters at @3x (graded as that chapter shows them). */
export function firstLoad(pages: readonly PageDef[], m: EnvManifest): FirstLoad {
  const chapter = Math.min(...pages.map((p) => p.chapter));
  const first = pages.filter((p) => p.chapter === chapter);
  const files = new Map<string, number>();
  for (const f of Object.values(m.screens)) files.set(f.file, f.bytes);
  for (const p of first) {
    const art = pageArt(p, m);
    for (const f of [art.backdrop, ...art.parts, ...art.cutouts]) if (f) files.set(f.file, f.bytes);
  }
  const env = [...files.values()].reduce((n, b) => n + b, 0);
  const sprites = payloadBytes(pageSprites(chapter), 3, chapterGradeKey(chapter));
  return { chapter, env, sprites, bytes: env + sprites };
}

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

/** The report as text (the `art:report` script prints it). */
export function formatReport(pages: readonly PageDef[], m: EnvManifest): string {
  const rows = pages.map((p) => {
    const a = pageArt(p, m);
    const ok = a.bytes <= PAGE_ART_BUDGET ? 'ok  ' : 'OVER';
    const parts = a.parts.reduce((n, f) => n + f.bytes, 0);
    const cut = a.cutouts.reduce((n, f) => n + f.bytes, 0);
    const chars = payloadBytes(pageSprites(p.chapter), 2, chapterGradeKey(p.chapter));
    return `${ok} ${p.id.padEnd(6)} backdrop ${kb(a.backdrop?.bytes ?? 0).padStart(9)} · parts ${kb(parts).padStart(8)} · cut-outs ${kb(cut).padStart(7)} · page art ${kb(a.bytes).padStart(9)} / ${kb(PAGE_ART_BUDGET)}`
      + `  (characters @2x ${kb(chars)})`
      + (a.placeholders.length ? `\n       live (no bitmap): ${a.placeholders.join(', ')}` : '');
  });
  const f = firstLoad(pages, m);
  return [
    'Page art (environment bitmaps, @2x; GDD § 3.9 budget 350 KB per page)',
    ...rows,
    '',
    `Screens (#97): ${Object.entries(m.screens).map(([k, f]) => `${k} ${kb(f.bytes)}`).join(' · ')}`,
    '',
    `First load (the screens + chapter ${f.chapter}: environment art ${kb(f.env)} + its characters @3x ${kb(f.sprites)}) = ${kb(f.bytes)} / ${kb(FIRST_LOAD_BUDGET)} ${f.bytes <= FIRST_LOAD_BUDGET ? 'ok' : 'OVER'}`,
  ].join('\n');
}
