import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 5-3 「抱抱」 · difficulty 2 · par 3 · **learn 抱抱**. A crowded lane of 士林夜市:
 * a wall of legs between him and the 雞排 stall, where the bead shines behind the counter. He
 * crawls up to the crowd and stops beside the 夜市阿姨 at the lane's mouth — 「來，阿姨抱！」 —
 * and learns 抱抱 (`learns`: the § 5.4 learn beat and word card). Said, she picks him up and walks
 * him over the legs (a `carrier`, #120), and sets him down by the stall. Behind the counter the
 * 雞排老闆 is in the back, frying: Mocha rings the counter's bell (his weight on it) — 「來了！」 — and
 * the 老闆 comes to the counter. 抱抱 again: he lifts Baokaka over the counter, to the bead.
 * The 淘氣: 抱抱 the 阿姨 a second time — say it at the counter before the 老闆 is called, and she
 * carries him back, with a twirl.
 *
 * ```
 *   lantern (Mocha) ─jump─ bell (Mocha on the counter's bell: the 老闆 comes out)
 *   L1 ── L2 ── L3 (crowd of legs) ── L4 ── K1 ═(over the counter)═ Kb ── G (bead)
 *         阿姨: L2 → L3 → L4 (抱抱)              老闆: Kb → G (抱抱, while called)
 * ```
 */
const AUNTIE_CARRYING = { part: 'auntie', in: ['carrying@0', 'carrying@1', 'carrying@2'] };

export default definePage({
  id: 'c5p3', chapter: 5, index: 3, title: '抱抱', difficulty: 2, backdrop: 'c5/market-lane',
  nodes: [
    // The lane: the mouth (left), the crowd, the 雞排 stall's counter (right)
    { id: 'L1', x: 30, y: 486, height: 0 }, { id: 'L2', x: 88, y: 486, height: 0 },
    { id: 'L3', x: 150, y: 486, height: 0 },          // the crowd of legs
    { id: 'L4', x: 210, y: 486, height: 0 }, { id: 'K1', x: 266, y: 486, height: 0 },
    // Behind the counter: where the 老闆 stands, and the bead
    { id: 'Kb', x: 326, y: 486, height: 0 }, { id: 'G', x: 368, y: 486, height: 0 },
    // Mocha's perches: the lantern over the lane's mouth, the bell on the counter
    { id: 'lanternTop', x: 60, y: 264, height: 2 }, { id: 'bellTop', x: 296, y: 404, height: 1 },
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' }, { a: 'L2', b: 'L3', kind: 'crawl' }, { a: 'L3', b: 'L4', kind: 'crawl' },
    { a: 'L4', b: 'K1', kind: 'crawl' },
    // Over the counter: a grown-up's step (he can't climb yet; the 老闆 lifts him over)
    { a: 'K1', b: 'Kb', kind: 'climb' },
    { a: 'Kb', b: 'G', kind: 'crawl' },
    { a: 'lanternTop', b: 'bellTop', kind: 'jump' },
  ],
  parts: [
    // The 雞排老闆 (listed first: at the counter he answers 抱抱 before the 阿姨): out of reach in the
    // back, frying, until the bell calls him to the counter
    { id: 'boss', preset: 'carrier', route: ['Kb', 'G'], lockedWhen: { part: 'bell', in: ['up'] },
      hit: { x: 302, y: 380, w: 56, h: 106 }, art: 'c5/chicken-boss' },
    // The 夜市阿姨: she walks the lane over the crowd's feet
    { id: 'auntie', preset: 'carrier', route: ['L2', 'L3', 'L4'], hit: { x: 60, y: 380, w: 56, h: 106 }, art: 'c5/auntie' },
    // The counter's bell: Mocha's weight rings it
    { id: 'bell', preset: 'button', hit: { x: 268, y: 392, w: 56, h: 56 }, art: 'c5/counter-bell' },
  ],
  perches: [
    { id: 'lantern', node: 'lanternTop', reachNode: 'L1' },
    { id: 'bell', node: 'bellTop', reachNode: 'K1', onPart: 'bell' },
  ],
  creatures: [{ id: 'legs', positions: { crowd: 'L3' }, initial: 'crowd', art: 'c5/crowd-legs' }],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'G', goal: true }],
  baby: { start: 'L1', facing: 'r' },
  mocha: { start: 'lantern' },
  learns: { word: 'hug', when: { babyAt: 'L2' } },
  // The 阿姨 picks him up a second time (carrying him back, with a twirl)
  mischief: { text: '再抱抱阿姨一次', when: { type: 'hug', count: 2, when: AUNTIE_CARRYING } },
  // On the 雞排 stall's menu board, seen while the 老闆 is at the counter
  tudigong: { x: 340, y: 300, visibleWhen: { part: 'bell', in: ['down'] }, hat: '鴨舌帽' },
  solution: [{ wait: 'settle' }, { say: 'hug' }, { wait: 'settle' }, { mocha: 'bell' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'goal' }],
  lines: {
    onEvent: [
      // The bell rings: the 雞排老闆 comes to the counter
      { when: { type: 'catArrive', id: 'bell' }, line: 'c5p3.boss.1' },
      { when: { type: 'catArrive', id: 'bell' }, line: 'c5p3.boss.2' },
    ],
  },
});
