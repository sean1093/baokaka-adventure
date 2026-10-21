import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 8-6 「澡堂的算盤」 · difficulty 5 · par 5 · treasure 算盤: chapter 8's spread
 * (§ 2.9). The old bathhouse's front hall: on the right the 番台 — the high counter where the
 * cashier sits behind her little window — and the 算盤 behind it, glinting through the steam off the
 * hot-water urn on the counter. Leaning against the counter stands a giant abacus, its three bead rods
 * stacked a step apart. Each rod's block of beads slides along it (a **slider**, three stops: left,
 * middle, right; each pulled by the bead on a string under the abacus, so the three handles sit apart
 * at the bottom of the page). A bead block is a step he can climb onto, and the next rod's block is
 * the next step only if it sits one stop further right: slide them into a **staircase** — the bottom
 * rod left, the middle one in the middle, the top one right — and it climbs from the floor to the
 * counter.
 *
 * The 算盤 glints from the start: he crawls to the foot of the abacus and reaches. Slide the rods
 * (three moves, any order): he climbs as each step appears. On the top rods he faces the counter, and
 * the steam is in his way: 咻—— blows it off (from the middle or top rod; from the floor it's too
 * far). He climbs onto the counter, but the 番台's window is shut. The bell on the 番台's raised desk is
 * in the steam too, so only now can Mocha jump onto it (C7): he rings it with his weight, the cashier opens
 * her window (「歡迎光臨！大人五十，囡仔免錢。」「……貓呢？」), and he crawls through to the 算盤.
 * **Photo moment** (Mocha on the bell, inside `photoRect`, +M). The 淘氣: spell 「1」 on the abacus —
 * one bead on the bottom rod and none on the others — for his first birthday.
 *
 * ```
 *   buckets (Mocha) ───────────────jump─────────────── bell (Mocha, on the 番台's desk; in the steam until 咻——)
 *                                         R3 (top rod: stop 2) ═(steam clear)═ C1 ── G (番台 window) ── T (算盤)
 *                              R2 (middle rod: stop 1)
 *                  R1 (bottom rod: stop 0)
 *   F1 (start) ── F2 ── F3 ═climb═ R1 ═climb═ R2 ═climb═ R3     (rod k at stop i ↔ rod k+1 at stop i+1: climb)
 * ```
 */
const STOPS = ['0', '1', '2'];
const ROD_X = [176, 216, 256];
/** A bead block's place on its rod at each stop. */
const ROD = (part: string, y: number) => ({ part, pos: Object.fromEntries(STOPS.map((s, i) => [s, [ROD_X[i], y] as [number, number]])) });
/** The rods `lo` and `hi` make a step: `hi`'s block one stop right of `lo`'s. */
const STEP = (lo: string, hi: string) => ({
  any: [0, 1].map((i) => ({ all: [{ part: lo, in: [STOPS[i]] }, { part: hi, in: [STOPS[i + 1]] }] })),
});
const CLEAR = { part: 'steam', in: ['clear'] };
/** A rod: its handle (the bead on a string) at the bottom of the page, under the abacus. */
const rod = (id: string, x: number, initial: string) => ({
  id, preset: 'slider' as const, states: STOPS, initial, input: 'drag-linear' as const,
  track: { from: [x + 10, 532] as [number, number], to: [x + 46, 532] as [number, number] }, hit: { x, y: 504, w: 56, h: 56 }, art: 'c8/abacus-rod',
});
const ONE = { all: [{ part: 'rodLow', in: ['1'] }, { part: 'rodMid', in: ['0'] }, { part: 'rodTop', in: ['0'] }] };

export default definePage({
  id: 'c8p6', chapter: 8, index: 6, title: '澡堂的算盤', difficulty: 5, backdrop: 'c8/bathhouse-hall',
  spread: true,
  // The counter: the 算盤 behind the 番台's window, Mocha on the bell
  photoRect: { x: 250, y: 300, w: 140, h: 180 },
  nodes: [
    // The hall's floor, to the foot of the abacus
    { id: 'F1', x: 36, y: 494, height: 0 }, { id: 'F2', x: 86, y: 494, height: 0 }, { id: 'F3', x: 136, y: 494, height: 0 },
    // The three bead blocks, one per rod, a step apart
    { id: 'R1', x: 256, y: 472, height: 1, attach: ROD('rodLow', 472) },
    { id: 'R2', x: 176, y: 450, height: 1, attach: ROD('rodMid', 450) },
    { id: 'R3', x: 176, y: 428, height: 1, attach: ROD('rodTop', 428) },
    // The counter: its top, the 番台's window, the 算盤 behind it
    { id: 'C1', x: 300, y: 406, height: 1 },
    { id: 'G', x: 336, y: 406, height: 1, attach: { part: 'window', pos: { closed: [336, 406], open: [336, 406] } } },
    { id: 'T', x: 372, y: 406, height: 1 },
    // Mocha's perches: the stack of wooden buckets in the hall, the bell on the 番台's raised desk (in
    // the steam), clear of him on the counter below
    { id: 'bucketsTop', x: 60, y: 430, height: 2 }, { id: 'bellTop', x: 340, y: 318, height: 2, tags: ['steam'] },
  ],
  edges: [
    { a: 'F1', b: 'F2', kind: 'crawl' }, { a: 'F2', b: 'F3', kind: 'crawl' },
    { a: 'F3', b: 'R1', kind: 'climb', when: { part: 'rodLow', in: ['0'] } },
    { a: 'R1', b: 'R2', kind: 'climb', when: STEP('rodLow', 'rodMid') },
    { a: 'R2', b: 'R3', kind: 'climb', when: STEP('rodMid', 'rodTop') },
    // Onto the counter: the top rod at its right stop, and the steam blown off
    { a: 'R3', b: 'C1', kind: 'climb', when: { all: [{ part: 'rodTop', in: ['2'] }, CLEAR] } },
    { a: 'C1', b: 'G', kind: 'crawl' }, { a: 'G', b: 'T', kind: 'crawl' },
    { a: 'bucketsTop', b: 'bellTop', kind: 'jump' },
  ],
  parts: [
    // The abacus's rods, bottom to top (their handles left to right)
    rod('rodLow', 96, '2'), rod('rodMid', 176, '0'), rod('rodTop', 256, '0'),
    // The steam off the hot-water urn on the counter: 咻—— from the middle or top rod, facing right
    { id: 'steam', preset: 'blowable', states: ['fog', 'clear'], hit: { x: 280, y: 370, w: 60, h: 60 }, art: 'c8/steam' },
    // The bell on the 番台's raised desk: Mocha's weight rings it
    { id: 'bell', preset: 'button', hit: { x: 312, y: 290, w: 56, h: 56 }, art: 'c8/counter-bell' },
    // The 番台's little window: the bell rung, the cashier opens it (and it stays open)
    { id: 'window', preset: 'gate', initial: 'closed', hit: { x: 308, y: 354, w: 56, h: 56 }, art: 'c8/bantai-window',
      react: [{ on: { type: 'partEnter', id: 'bell', state: 'down' }, to: 'open' }] },
  ],
  perches: [
    { id: 'buckets', node: 'bucketsTop', reachNode: 'F1' },
    // On the 番台's bell: in the steam until 咻—— blows it off (C7); his weight rings it (C4)
    { id: 'bell', node: 'bellTop', reachNode: 'C1', onPart: 'bell', blockedWhen: { part: 'steam', in: ['fog'] } },
  ],
  creatures: [],
  // The 算盤 behind the 番台's window, glinting through the steam
  attractors: [{ id: 'abacus', kind: 'shiny', node: 'T', goal: true }],
  baby: { start: 'F1', facing: 'r' },
  mocha: { start: 'buckets' },
  // 「1」 on the abacus: one bead on the bottom rod, none on the others
  mischief: { text: '在算盤上撥出「1」：一歲！', when: { type: 'partEnter', when: ONE } },
  // On the hot-water urn, seen once the steam is blown off
  tudigong: { x: 354, y: 336, visibleWhen: CLEAR, hat: '毛巾' },
  solution: [
    { set: 'rodLow', to: '0' }, { set: 'rodMid', to: '1' }, { set: 'rodTop', to: '2' }, { wait: 'settle' },
    { say: 'whoosh' }, { mocha: 'bell' }, { wait: 'goal' },
  ],
  lines: {
    onEvent: [
      // The bell rung: the cashier opens her window
      { when: { type: 'partEnter', id: 'window', when: { part: 'window', in: ['open'] } }, line: 'c8p6.cashier.1' },
      { when: { type: 'partEnter', id: 'window', when: { part: 'window', in: ['open'] } }, line: 'c8p6.cashier.2' },
      { when: { type: 'partEnter', when: ONE }, line: 'c8p6.mocha.1' },
    ],
  },
});
