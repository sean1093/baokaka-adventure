import { definePage } from '../define';

/**
 * The M4 engine's toy pages (#127; GDD § 7 M4 item 33): one small, complete page per new
 * behaviour, each solver-green exactly as a real page must be (`m4.test.ts`). They are the engine's
 * proofs, not chapter pages (#129, #131, #133 write those); PageLab lists them as lab stages
 * (`dev/labPages.ts`) with placeholder art.
 *
 * - `toy-steam` (after 8-3 呼呼): steam hides the bath's boardwalk. He learns 咻—— watching the
 *   溫泉阿嬤 blow on her egg; said, the steam cloud ahead of him (a `blowable`) clears — and her
 *   hat blows off with it (the 淘氣: blow it back on).
 * - `toy-pinwheel` (after 8-4 北投圖書館): a balcony pinwheel lowers the book lift with the bead.
 *   **Facing matters**: 咻—— blows a 90° cone his way, so it only spins the pinwheel once Mocha
 *   has drawn him round to face it.
 * - `toy-ferry` (after 9-3 渡輪): reaching up to Mocha on the ferry's railing he pulls himself up
 *   and learns 扶著站 — `cruise` edges past the coil of rope, and `reachHigh` for the bead on the
 *   bench, which only a cat's hop joins to the deck.
 * - `toy-101` (after 10-3 八節): three stacked sections of 101, **coupled**: the bottom and top
 *   dials each turn the middle section too. Their ledges line up for the climb only if Mocha sits
 *   on the middle one (`lockedByCat`), so it holds while the top turns.
 */

/** 咻——: the steam over the boardwalk clears, and the 阿嬤's hat blows off with it. */
export const toySteam = definePage({
  id: 'toy-steam', chapter: 8, index: 3, title: '呼呼', difficulty: 1, backdrop: 'toy/bath',
  nodes: [
    { id: 'S1', x: 40, y: 430, height: 0 }, { id: 'S2', x: 120, y: 430, height: 0 },
    { id: 'S3', x: 200, y: 430, height: 0 }, { id: 'S4', x: 280, y: 430, height: 0 },
    { id: 'S5', x: 350, y: 430, height: 0 },
    // The 溫泉阿嬤 on the bath's rim, past the steam, off his path
    { id: 'rim', x: 330, y: 330, height: 1 },
  ],
  edges: [
    { a: 'S1', b: 'S2', kind: 'crawl' }, { a: 'S2', b: 'S3', kind: 'crawl' },
    // The boardwalk under the steam: he won't crawl into what he can't see
    { a: 'S3', b: 'S4', kind: 'crawl', when: { part: 'steam', in: ['clear'] } },
    { a: 'S4', b: 'S5', kind: 'crawl' },
  ],
  parts: [
    // In his cone from S3 (dx 50, dy −20) — a second 咻—— brings it back (blowables wrap)
    { id: 'steam', preset: 'blowable', states: ['fog', 'clear'], hit: { x: 210, y: 380, w: 80, h: 60 }, art: 'toy/steam' },
    // Her hat, in his cone from S3 and from S4: blown off with the steam, blown back on from past it
    { id: 'hat', preset: 'blowable', states: ['on', 'off'], hit: { x: 296, y: 376, w: 48, h: 48 }, art: 'toy/hat' },
  ],
  perches: [],
  creatures: [{ id: 'granny', positions: { rim: 'rim' }, initial: 'rim', blocks: false, art: 'toy/granny' }],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'S5', goal: true }],
  baby: { start: 'S1', facing: 'r' },
  mocha: { start: null },
  words: [],
  // He watches her blow on the egg across the steam, at its edge
  learns: { word: 'whoosh', when: { babyAt: 'S3' } },
  mischief: { text: '把阿嬤的帽子吹回去', when: { type: 'partEnter', id: 'hat', count: 2 } },
  tudigong: { x: 60, y: 300, visibleWhen: { part: 'steam', in: ['clear'] }, hat: '' },
  solution: [{ wait: 'settle' }, { say: 'whoosh' }, { wait: 'goal' }],
});

const PINWHEEL = ['0', '1', '2', '3'];

/** Facing matters: 咻—— spins the pinwheel only when he faces it, and the book lift comes down. */
export const toyPinwheel = definePage({
  id: 'toy-pinwheel', chapter: 8, index: 4, title: '風車書架', difficulty: 1, backdrop: 'toy/library',
  nodes: [
    { id: 'P1', x: 100, y: 430, height: 0 }, { id: 'P2', x: 170, y: 430, height: 0 },
    { id: 'P3', x: 240, y: 430, height: 0 }, { id: 'P4', x: 310, y: 430, height: 0 },
    // The book lift's basket: up in the stacks, or down on the floor with the bead in it
    { id: 'B', x: 360, y: 430, height: 0, attach: { part: 'books', pos: { up: [360, 250], down: [360, 430] } } },
    // Mocha's perches: the balcony post by the pinwheel, the top of the shelf
    { id: 'post', x: 80, y: 340, height: 2 }, { id: 'shelf', x: 300, y: 340, height: 2 },
  ],
  edges: [
    { a: 'P1', b: 'P2', kind: 'crawl' }, { a: 'P2', b: 'P3', kind: 'crawl' },
    { a: 'P3', b: 'P4', kind: 'crawl' }, { a: 'P4', b: 'B', kind: 'crawl', when: { part: 'books', in: ['down'] } },
    { a: 'post', b: 'shelf', kind: 'jump' },
  ],
  parts: [
    // Left of everything: in his cone from P1 and P2 facing left (dx −60 / −130, dy −30), never facing right
    { id: 'pinwheel', preset: 'blowable', states: PINWHEEL, hit: { x: 16, y: 376, w: 48, h: 48 }, art: 'toy/pinwheel' },
    { id: 'books', preset: 'lift', states: ['up', 'down'], react: [{ on: { type: 'partEnter', id: 'pinwheel' }, to: 'down' }], hit: { x: 330, y: 380, w: 60, h: 60 }, art: 'toy/books' },
  ],
  perches: [
    { id: 'post', node: 'post', reachNode: 'P1' },
    { id: 'shelf', node: 'shelf', reachNode: 'P4' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'B', goal: true, visibleWhen: { part: 'books', in: ['down'] } }],
  baby: { start: 'P3', facing: 'r' },
  mocha: { start: 'shelf' },
  words: ['whoosh'],
  mischief: { text: '把風車吹轉四次', when: { type: 'partEnter', id: 'pinwheel', count: 4 } },
  tudigong: { x: 200, y: 280, visibleWhen: { part: 'pinwheel', in: ['2'] }, hat: '' },
  solution: [{ mocha: 'post' }, { wait: 'settle' }, { say: 'whoosh' }, { wait: 'goal' }],
});

/** 扶著站: he pulls up on the ferry's railing, cruises past the rope and grabs the bead off the bench. */
export const toyFerry = definePage({
  id: 'toy-ferry', chapter: 9, index: 3, title: '渡輪', difficulty: 1, backdrop: 'toy/ferry',
  nodes: [
    { id: 'D1', x: 40, y: 430, height: 0 }, { id: 'D2', x: 120, y: 430, height: 0 },
    { id: 'D3', x: 200, y: 430, height: 0 }, { id: 'D4', x: 280, y: 430, height: 0 },
    // The high bench at the stern: a cat's hop from the deck, the bead within a standing reach
    { id: 'bench', x: 345, y: 390, height: 1 },
    // Mocha: the cabin roof, the railing over D2
    { id: 'cabin', x: 50, y: 320, height: 2 }, { id: 'rail', x: 130, y: 350, height: 2 },
    { id: 'horn', x: 230, y: 300, height: 2 },
  ],
  edges: [
    { a: 'D1', b: 'D2', kind: 'crawl' },
    // Past the coil of rope the deck is a ledge along the railing: only standing, holding on
    { a: 'D2', b: 'D3', kind: 'cruise' },
    { a: 'D3', b: 'D4', kind: 'crawl' },
    { a: 'D4', b: 'bench', kind: 'jump' },
    { a: 'cabin', b: 'rail', kind: 'jump' }, { a: 'rail', b: 'horn', kind: 'jump' },
  ],
  parts: [
    // The ferry's horn: Mocha sitting on it honks it (the 淘氣)
    { id: 'horn', preset: 'button', hit: { x: 206, y: 290, w: 48, h: 48 }, art: 'toy/horn' },
  ],
  perches: [
    { id: 'cabin', node: 'cabin', reachNode: 'D1' },
    { id: 'rail', node: 'rail', reachNode: 'D2' },
    { id: 'horn', node: 'horn', onPart: 'horn' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'bench', height: 1, goal: true }],
  baby: { start: 'D1', facing: 'r', growth: 1 },
  mocha: { start: 'cabin' },
  words: [],
  // Mocha on the railing above him: he grabs it and stands (GDD § 4.4 9-3, a story beat)
  learns: { growth: 2, when: { all: [{ babyAt: 'D2' }, { mochaAt: 'rail' }] } },
  mischief: { text: '讓摩卡坐在汽笛上', when: { type: 'partEnter', id: 'horn', when: { mochaAt: 'horn' } } },
  tudigong: { x: 250, y: 300, visibleWhen: { mochaAt: 'rail' }, hat: '' },
  solution: [{ mocha: 'rail' }, { wait: 'goal' }],
});

/**
 * A section's three turns (a quarter of the tower's face each way). Three, not four: with four a
 * half turn of a dial before Mocha holds the middle costs two moves to undo (a soft trap, #183).
 */
const TURN = ['0', '1', '2'];
/** A ledge on a section: where it is in each of the section's turns (in line at '1', x 200). */
const ledge = (part: string, y: number): { part: string; pos: Record<string, [number, number]> } => ({
  part,
  pos: { '0': [130, y], '1': [200, y], '2': [270, y] },
});

/** Coupled sections: the dials turn the middle with them; Mocha holds it so the ledges line up. */
export const toy101 = definePage({
  id: 'toy-101', chapter: 10, index: 3, title: '八節', difficulty: 1, backdrop: 'toy/tower',
  nodes: [
    { id: 'F', x: 200, y: 460, height: 0 },
    { id: 'L', x: 130, y: 410, height: 1, attach: ledge('low', 410) },
    { id: 'M', x: 130, y: 360, height: 1, attach: ledge('mid', 360) },
    { id: 'T', x: 130, y: 310, height: 1, attach: ledge('top', 310) },
    // Mocha: the window-washer's beam, and the middle section's rim
    { id: 'beam', x: 60, y: 200, height: 2 }, { id: 'rim', x: 280, y: 330, height: 2 },
  ],
  edges: [
    { a: 'F', b: 'L', kind: 'climb', when: { part: 'low', in: ['1'] } },
    { a: 'L', b: 'M', kind: 'climb', when: { all: [{ part: 'low', in: ['1'] }, { part: 'mid', in: ['1'] }] } },
    // The last ledge only with the whole column in line (the window-washer's rope hangs straight)
    { a: 'M', b: 'T', kind: 'climb', when: { all: [{ part: 'low', in: ['1'] }, { part: 'mid', in: ['1'] }, { part: 'top', in: ['1'] }] } },
    { a: 'beam', b: 'rim', kind: 'jump' },
  ],
  parts: [
    { id: 'low', preset: 'wheel', states: TURN, coupled: ['mid'], center: [330, 440], radius: 24, hit: { cx: 330, cy: 440, r: 28 }, art: 'toy/dial' },
    // The middle section has no dial: only its neighbours turn it, unless Mocha sits on it
    { id: 'mid', preset: 'section', states: TURN, initial: '1', lockedByCat: true, hit: { x: 176, y: 336, w: 48, h: 48 }, art: 'toy/section' },
    { id: 'top', preset: 'wheel', states: TURN, coupled: ['mid'], center: [330, 260], radius: 24, hit: { cx: 330, cy: 260, r: 28 }, art: 'toy/dial' },
  ],
  perches: [
    { id: 'beam', node: 'beam' },
    { id: 'rim', node: 'rim', onPart: 'mid' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'T', goal: true }],
  baby: { start: 'F', facing: 'r', growth: 2 },
  mocha: { start: 'beam' },
  words: [],
  mischief: { text: '讓中間那節轉一整圈', when: { type: 'partEnter', id: 'mid', count: 3 } },
  tudigong: { x: 60, y: 300, visibleWhen: { part: 'top', in: ['2'] }, hat: '' },
  solution: [{ mocha: 'rim' }, { set: 'low', to: '1' }, { set: 'top', to: '1' }, { wait: 'goal' }],
});

/** The four, in GDD order. */
export const M4_TOYS = [toySteam, toyPinwheel, toyFerry, toy101] as const;
