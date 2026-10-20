import { M2_TOYS, toyMoon } from '../core/fixtures/m2';
import type { Id, PageDef } from '../core/types';
import { PAGES, pageById } from '../pages';

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
 * 1-3 with every word at once (no `words` restriction): the full word ring, eight words and
 * 「好了」 (#99's `word-ring-full`). The real 1-3 offers only 嗶！.
 */
const c1p3 = pageById('c1p3');
const words: PageDef[] = c1p3 === undefined ? [] : [{ ...c1p3, id: 'lab-words', title: '八個字', words: undefined }];

/**
 * The M2 engine's toy pages (#112, `core/fixtures/m2.ts`): the spotlight, the squirrel and the moon
 * decoy, solver-green, with placeholder art; and the moon with M2's four words at once (嗶！ 掰掰
 * 不要！ 哇！, no learn beat), the ring as chapter 4 on will show it (`word-ring-4`).
 */
const ring4: PageDef = { ...toyMoon, id: 'lab-ring4', title: '四個字', words: ['beep', 'bye', 'no', 'wow'], learns: undefined };

/** Lab-only fixture pages (not in the registry). */
export const LAB_FIXTURES: readonly PageDef[] = [...brokenC1p2, ...words, ...M2_TOYS, ring4];

/** Every page the lab lists, registered pages first. */
export const LAB_PAGES: readonly PageDef[] = [...PAGES, ...LAB_FIXTURES];

/** A registered page or a lab fixture by id. */
export function labPageById(id: Id): PageDef | undefined {
  return pageById(id) ?? LAB_FIXTURES.find((p) => p.id === id);
}

