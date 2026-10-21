import { M2_TOYS, toyMoon } from '../core/fixtures/m2';
import { M3_TOYS, toyPlane } from '../core/fixtures/m3';
import { LINKED_TOYS } from '../core/fixtures/linked';
import { M4_TOYS, toyPinwheel } from '../core/fixtures/m4';
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
 * 「好了」 (#99's `word-ring-full`). The real 1-3 offers only 嗶！. Since #128 its solver badge
 * shows one soft trap: 一起 links them for the rest of the page, where Mocha can't push the card.
 */
const c1p3 = pageById('c1p3');
const words: PageDef[] = c1p3 === undefined ? [] : [{ ...c1p3, id: 'lab-words', title: '八個字', words: undefined }];

/**
 * The M2 engine's toy pages (#112, `core/fixtures/m2.ts`): the spotlight, the squirrel and the moon
 * decoy, solver-green, with placeholder art; and the moon with M2's four words at once (嗶！ 掰掰
 * 不要！ 哇！, no learn beat), the ring as chapter 4 on will show it (`word-ring-4`).
 */
const ring4: PageDef = { ...toyMoon, id: 'lab-ring4', title: '四個字', words: ['beep', 'bye', 'no', 'wow'], learns: undefined };

/**
 * The M3 engine's toy pages (#120, `core/fixtures/m3.ts`): the balloon counterweight, 抱抱 and the
 * auntie, the cranked carousel, 飛機！ and the pigeons, 爬樓梯; and the deck with M3's six words at
 * once (嗶！ 掰掰 不要！ 哇！ 抱抱 飛機！, no learn beat), the ring as chapter 7 on will show it
 * (`word-ring-6`).
 */
const ring6: PageDef = { ...toyPlane, id: 'lab-ring6', title: '六個字', words: ['beep', 'bye', 'no', 'wow', 'hug', 'plane'], learns: undefined };

/**
 * The M4 engine I's toy pages (#127, `core/fixtures/m4.ts`): the steam and 咻——, the pinwheel and
 * the facing cone, 扶著站 on the ferry (cruise and reachHigh), 101's coupled sections; and the
 * library with the seven words to chapter 9 (嗶！ 掰掰 不要！ 哇！ 抱抱 飛機！ 咻——, `word-ring-7`).
 */
const ring7: PageDef = { ...toyPinwheel, id: 'lab-ring7', title: '七個字', words: ['beep', 'bye', 'no', 'wow', 'hug', 'plane', 'whoosh'], learns: undefined };

/**
 * The M4 engine II's toy pages (#128, `core/fixtures/linked.ts`): 咻咻's party (一起 and linked mode,
 * the lonely 咻咻) and the roof (第一步: three walk steps).
 */

/** Lab-only fixture pages (not in the registry). */
export const LAB_FIXTURES: readonly PageDef[] = [...brokenC1p2, ...words, ...M2_TOYS, ring4, ...M3_TOYS, ring6, ...M4_TOYS, ring7, ...LINKED_TOYS];

/** Every page the lab lists, registered pages first. */
export const LAB_PAGES: readonly PageDef[] = [...PAGES, ...LAB_FIXTURES];

/** A registered page or a lab fixture by id. */
export function labPageById(id: Id): PageDef | undefined {
  return pageById(id) ?? LAB_FIXTURES.find((p) => p.id === id);
}

