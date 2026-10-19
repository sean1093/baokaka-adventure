import type { Growth, Id, PageDef, Word } from '../core/types';
import c0p1 from './c0/p1';
import c1p2 from './c1/p2';

/**
 * `src/popup/pages/`: the pages, as data (GDD § 2.1, § 3.4). One folder per chapter (`c0/` …
 * `c10/`, `end/`) with one file per page built from part presets — no per-page code beyond at
 * most one custom reaction, which lint flags. This file is the ordered page registry;
 * `pages.test.ts` lints, replays and solves every registered page in CI.
 *
 * **Adding a page:** create `cN/pK.ts` (`export default definePage({ … })`), import it here and put
 * it in `AUTHORED` in play order. Nothing else — `pages.test.ts` picks it up.
 * `npm run solve` (`report.ts`, `scripts/solve-pages.ts`) prints the per-page solver report.
 *
 * The prologue is chapter 0. `buildRegistry` fills in the defaults that depend on the order
 * (GDD § 3.2): `words` = the words learned (`learns.word`) on earlier pages, and `baby.growth` =
 * the highest growth learned (`learns.growth`) on earlier pages, else 0. A page's own `learns`
 * takes effect while it is played (the step applies it), so it is not in its own defaults.
 * A page that sets either field keeps its value.
 */
export { definePage } from '../core/define';

/** The pages in play order, as authored. */
const AUTHORED: readonly PageDef[] = [c0p1, c1p2];

export interface PageRegistry {
  /** Every page in play order, with the order-dependent defaults filled in. */
  readonly pages: readonly PageDef[];
  /** The page with this id, or undefined. */
  pageById(id: Id): PageDef | undefined;
  /** The page after this one in play order (across chapters), or null after the last or for an unknown id. */
  nextPage(id: Id): PageDef | null;
  /** The chapter this page belongs to (0 = the prologue), or undefined for an unknown id. */
  chapterOf(id: Id): number | undefined;
}

/** The highest of two growth stages. */
const maxGrowth = (a: Growth, b: Growth): Growth => (a >= b ? a : b);

/**
 * Builds a registry from pages in play order. Throws when two pages share an id or the order isn't
 * strictly increasing by (chapter, index) — authoring mistakes `pages.test.ts` reports at once.
 */
export function buildRegistry(authored: readonly PageDef[]): PageRegistry {
  const byId = new Map<Id, number>();
  const pages: PageDef[] = [];
  const words: Word[] = [];
  let growth: Growth = 0;
  authored.forEach((def, i) => {
    if (byId.has(def.id)) throw new Error(`page registry: duplicate page id '${def.id}'`);
    const prev = authored[i - 1];
    if (prev !== undefined && (def.chapter < prev.chapter || (def.chapter === prev.chapter && def.index <= prev.index))) {
      throw new Error(`page registry: '${def.id}' (${def.chapter}-${def.index}) comes after '${prev.id}' (${prev.chapter}-${prev.index}) but isn't later`);
    }
    byId.set(def.id, i);
    pages.push({
      ...def,
      words: def.words ?? [...words],
      baby: { ...def.baby, growth: def.baby.growth ?? growth },
    });
    const learned = def.learns;
    if (learned?.word !== undefined && !words.includes(learned.word)) words.push(learned.word);
    if (learned?.growth !== undefined) growth = maxGrowth(growth, learned.growth);
  });

  return {
    pages,
    pageById: (id) => {
      const i = byId.get(id);
      return i === undefined ? undefined : pages[i];
    },
    nextPage: (id) => {
      const i = byId.get(id);
      return i === undefined ? null : (pages[i + 1] ?? null);
    },
    chapterOf: (id) => {
      const i = byId.get(id);
      return i === undefined ? undefined : pages[i].chapter;
    },
  };
}

const REGISTRY = buildRegistry(AUTHORED);

/** The game's registry, for code that takes one as a parameter (`game/progress.ts`). */
export const registry: PageRegistry = REGISTRY;

/** Every page in play order (prologue first), defaults filled in. */
export const PAGES: readonly PageDef[] = REGISTRY.pages;
export const pageById = REGISTRY.pageById;
export const nextPage = REGISTRY.nextPage;
export const chapterOf = REGISTRY.chapterOf;
