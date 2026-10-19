import c1p3 from '../core/fixtures/c1p3';
import type { Id, PageDef } from '../core/types';
import { PAGES, buildRegistry, pageById, type PageRegistry } from '../pages';

/**
 * The pages PageLab lists: every registered page, then lab-only fixtures that are deliberately
 * wrong, so the solver panel's red paths (dead ends, loading one) can be tried on real data.
 * Fixtures never enter the registry, `pages.test.ts` or the game.
 */

const c1p2 = pageById('c1p2');

/**
 * 1-2 broken on purpose (#91's testing plan): the train tab locks for good once the pigeon has
 * flown while the train is still `out`. Sending Mocha to the pillar first is a dead end; moving the
 * train to `half` first still solves it.
 */
const brokenC1p2: PageDef[] =
  c1p2 === undefined
    ? []
    : [
        {
          ...c1p2,
          id: 'c1p2-broken',
          title: '月台的縫（壞）',
          parts: c1p2.parts.map((p) =>
            p.id === 'train' ? { ...p, lockedWhen: { all: [{ creature: 'pigeon', at: 'away' }, { part: 'train', in: ['out'] }] } } : p,
          ),
        },
      ];

/**
 * 1-3 「嗶！閘門」 as the engine tests lay it out (`core/fixtures/c1p3.ts`), so the word ring, the
 * learn beat and the 嗶！ tutorial (#99) can be played end to end before #107 builds the real page
 * (with its art and lines); then the `word-*` fixtures move onto `c1p3`. Placeholder art.
 */
// The engine tests' robot hit (48 units) is under 48 px at the book scale (R6): grown for the stage
const gatesPage: PageDef = { ...c1p3, id: 'lab-gates', parts: c1p3.parts.map((p) => (p.id === 'robot' ? { ...p, hit: { x: 202, y: 492, w: 56, h: 56 } } : p)) };
const gates: PageDef[] = [
  gatesPage,
  // Every word at once (no `words` restriction): the full word ring, eight words and 「好了」
  { ...gatesPage, id: 'lab-words', title: '八個字', words: undefined },
];

/**
 * A chapter spread (GDD § 2.9, #103) before #107 builds 1-6 「台鐵便當」: 1-2's platforms drawn as a
 * centrefold, the bead swapped for chapter 1's treasure (雞腿), and a `photoRect` round the right
 * platform. When the train carries him to 2 edges from the treasure the photo moment begins. 摩卡
 * on the bench is in the frame (+M); on the pillar (to scare the pigeon) he is out of it, unless he
 * is sent back to the bench before the last pull. Then #107 moves the photo fixtures and the
 * play scenario onto `c1p6`.
 */
const spread: PageDef[] =
  c1p2 === undefined
    ? []
    : [
        {
          ...c1p2,
          id: 'lab-spread',
          index: 6,
          title: '台鐵便當',
          spread: true,
          photoRect: { x: 200, y: 300, w: 190, h: 200 },
          attractors: c1p2.attractors.map((a) => (a.goal ? { ...a, id: 'drumstick' } : a)),
        },
      ];

/** Lab-only fixture pages (not in the registry). */
export const LAB_FIXTURES: readonly PageDef[] = [...brokenC1p2, ...gates, ...spread];

/** Every page the lab lists, registered pages first. */
export const LAB_PAGES: readonly PageDef[] = [...PAGES, ...LAB_FIXTURES];

/** A registered page or a lab fixture by id. */
export function labPageById(id: Id): PageDef | undefined {
  return pageById(id) ?? LAB_FIXTURES.find((p) => p.id === id);
}

/**
 * The game's pages with the lab spread as chapter 1's page 6 (#103): a screen fixture plays the
 * spread in the game shell (the photo, the album, the sticker card) on this registry.
 */
export const SPREAD_REGISTRY: PageRegistry = buildRegistry([...PAGES, ...spread]);
