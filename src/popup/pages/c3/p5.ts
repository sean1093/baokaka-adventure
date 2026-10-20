import { definePage } from '../../core/define';
import type { Cond } from '../../core/types';

/** Aisle 1 (between shelves A and B) is open when A is rolled west and B east, */
const AISLE_1: Cond = { all: [{ part: 'shelfA', in: ['w'] }, { part: 'shelfB', in: ['e'] }] };
/** aisle 2 (B and C, where the book cart stands) when B is west and C east, */
const AISLE_2: Cond = { all: [{ part: 'shelfB', in: ['w'] }, { part: 'shelfC', in: ['e'] }] };
/** and aisle 3 (C and D) when C is west and D east. */
const AISLE_3: Cond = { all: [{ part: 'shelfC', in: ['w'] }, { part: 'shelfD', in: ['e'] }] };

/** Each shelf's top (Mocha's perch on the two inner ones), west and east. */
const TOP_B: Record<string, [number, number]> = { w: [126, 268], e: [150, 268] };
const TOP_C: Record<string, [number, number]> = { w: [186, 268], e: [210, 268] };

/**
 * GDD § 4.4, page 3-5 「總圖書館」 · difficulty 4 · par 4. Mobile compact shelving: four shelves on
 * rails, the bead at the far end of the reading room. The returns desk splits the front aisle, so
 * he has to go *through* the stacks: in by aisle 1, along the back, out by aisle 3. Only the end
 * shelves have crank wheels (`shelfA`, `shelfD`, sliders); each is coupled to its inner neighbour,
 * which rolls along with it (`shelfB` follows A, `shelfC` follows D) — unless Mocha sits on top of
 * it (a reaction guard): then it stays put. An aisle opens only when its two shelves roll apart.
 * Mocha starts asleep on shelf C, holding it: roll D east and aisle 3 opens. Aisle 1 needs B east
 * and A west: roll A east (B comes along), send Mocha across onto B (its top is in jumping reach
 * only once it has rolled east), and roll A back west without it — aisle 1 opens, and he crawls in,
 * along the back and out to the bead. Roll D after Mocha has left C, and C rolls too: Mocha goes
 * back to C and D is rolled again. The 淘氣: shut Mocha in aisle 2's book cart between two shelves
 * (he squeezes out on top, unimpressed: art, #117).
 *
 * ```
 *   topB ─jump (B east)─ topC (Mocha, asleep)    cart (in aisle 2, while it is open)
 *   K1 ── K2 ── K3                               (the back of the stacks)
 *   ║a1         ║a3
 *   F0 ── F1  [desk]  F3 ── F4 (bead)
 *   shelves: A | B | C | D  (A drags B, D drags C; Mocha on B or C holds it)
 * ```
 */
export default definePage({
  id: 'c3p5', chapter: 3, index: 5, title: '總圖書館', difficulty: 4, backdrop: 'c3/stacks',
  nodes: [
    // The front of the stacks, split by the returns desk in front of aisle 2
    { id: 'F0', x: 32, y: 500, height: 0 }, { id: 'F1', x: 108, y: 500, height: 0 },
    { id: 'F3', x: 228, y: 500, height: 0 }, { id: 'F4', x: 350, y: 500, height: 0 },
    // The back of the stacks, behind the shelves
    { id: 'K1', x: 108, y: 300, height: 0 }, { id: 'K2', x: 168, y: 300, height: 0 }, { id: 'K3', x: 228, y: 300, height: 0 },
    // Mocha's perches: the tops of shelves B and C, the book cart in aisle 2
    { id: 'topB', x: 0, y: 0, height: 2, attach: { part: 'shelfB', pos: TOP_B } },
    { id: 'topC', x: 0, y: 0, height: 2, attach: { part: 'shelfC', pos: TOP_C } },
    { id: 'cartTop', x: 168, y: 420, height: 1 },
  ],
  edges: [
    { a: 'F0', b: 'F1', kind: 'crawl' }, { a: 'F3', b: 'F4', kind: 'crawl' },
    { a: 'F1', b: 'K1', kind: 'crawl', when: AISLE_1 },
    { a: 'K1', b: 'K2', kind: 'crawl' }, { a: 'K2', b: 'K3', kind: 'crawl' },
    { a: 'K3', b: 'F3', kind: 'crawl', when: AISLE_3 },
    // B's top is in jumping reach of C's only once B has rolled east, beside it
    { a: 'topC', b: 'topB', kind: 'jump', when: { part: 'shelfB', in: ['e'] } },
    { a: 'topB', b: 'cartTop', kind: 'jump', when: AISLE_2 }, { a: 'topC', b: 'cartTop', kind: 'jump', when: AISLE_2 },
  ],
  parts: [
    // The end shelves: crank them west and east
    { id: 'shelfA', preset: 'slider', states: ['w', 'e'], initial: 'w', input: 'drag-linear',
      track: { from: [66, 544], to: [90, 544] }, hit: { x: 50, y: 516, w: 56, h: 56 }, art: 'c3/shelf-crank' },
    // The inner shelves: no crank of their own; each rolls with its outer neighbour unless Mocha sits on it
    { id: 'shelfB', preset: 'slider', states: ['w', 'e'], initial: 'w', input: 'none',
      track: { from: [126, 544], to: [150, 544] }, hit: { x: 110, y: 300, w: 56, h: 170 }, art: 'c3/shelf',
      react: [
        { on: { type: 'partEnter', id: 'shelfA', state: 'w' }, when: { not: { mochaAt: 'topB' } }, to: 'w' },
        { on: { type: 'partEnter', id: 'shelfA', state: 'e' }, when: { not: { mochaAt: 'topB' } }, to: 'e' },
      ] },
    { id: 'shelfC', preset: 'slider', states: ['w', 'e'], initial: 'w', input: 'none',
      track: { from: [186, 544], to: [210, 544] }, hit: { x: 170, y: 300, w: 56, h: 170 }, art: 'c3/shelf',
      react: [
        { on: { type: 'partEnter', id: 'shelfD', state: 'w' }, when: { not: { mochaAt: 'topC' } }, to: 'w' },
        { on: { type: 'partEnter', id: 'shelfD', state: 'e' }, when: { not: { mochaAt: 'topC' } }, to: 'e' },
      ] },
    { id: 'shelfD', preset: 'slider', states: ['w', 'e'], initial: 'w', input: 'drag-linear',
      track: { from: [246, 544], to: [270, 544] }, hit: { x: 230, y: 516, w: 56, h: 56 }, art: 'c3/shelf-crank' },
  ],
  perches: [
    { id: 'topB', node: 'topB', reachNode: 'K2', onPart: 'shelfB' },
    { id: 'topC', node: 'topC', reachNode: 'K2', onPart: 'shelfC' },
    { id: 'cart', node: 'cartTop', reachNode: 'K2' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'F4', goal: true }],
  baby: { start: 'F0', facing: 'r' },
  mocha: { start: 'topC' },
  mischief: { text: '把摩卡關在兩排書架中間', when: { type: 'partEnter', when: { all: [{ mochaAt: 'cart' }, { not: AISLE_2 }] } } },
  // Reading on the floor of aisle 1, seen when it opens
  tudigong: { x: 108, y: 400, visibleWhen: AISLE_1, hat: '藍色校工帽' },
  solution: [{ set: 'shelfD', to: 'e' }, { set: 'shelfA', to: 'e' }, { mocha: 'topB' }, { wait: 'settle' }, { set: 'shelfA', to: 'w' }, { wait: 'goal' }],
});
