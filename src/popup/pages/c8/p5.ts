import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 8-5 「大浴池」 (the big bath of the old bathhouse) · difficulty 4 · par 5. A big
 * tiled bath between the near deck and the far side, where a stone step leads up to the bathhouse's
 * shop counter. The water tap on the wall is a **wheel** with three stops (`low`: drained · `mid` ·
 * `high`: full; it starts full), and two wooden tubs float on the water (each a **lift** that follows
 * the tap; a node rides in each). The tap's current pushes them about: half full, the near tub floats
 * a step under the near deck and the far tub by the far step; full, the near tub drifts out into the
 * middle beside the far one, level with it; drained, both sit on the bottom, too deep to climb into.
 *
 * Mocha starts on the stack of bath stools by the deck, and Baokaka cuddles him. Mocha crosses only
 * over the stepping stone on the bath's bottom, which is under water unless the bath is drained (C7).
 * Drain it; Mocha hops across to the shop counter — the 店員小哥's chapter 8 cameo (「叮咚～歡迎光臨！」
 * 「……澡堂也是你們的？」「我們是連鎖的。」) — and Baokaka reaches for him from the end of the deck.
 * Then **sequence it**: half full, and the near tub comes to him (he climbs in); full, and it drifts
 * out beside the far tub (he crawls across into it); half full again, and the far tub drifts to the
 * far step with him (he crawls out, climbs to Mocha and sees the bead on the counter's step). The
 * 淘氣: float the near tub — Mocha's, the one with a paw print — out empty to Mocha (「……我不坐。」).
 *
 * ```
 *   stools (Mocha) ─jump─ stone (Mocha; under water unless drained) ─jump─ counter (Mocha, the 店員小哥's shop)
 *   N1 ── N2 ═(mid: climb)═ A                  B ═(mid: crawl)═ F1 ═climb═ F2 (bead, seen from the far side)
 *                     A (high: in the middle) ══(high: crawl)══ B (high)
 *   tap: low (both tubs on the bottom) · mid (A at the near deck, B at the far step) · high (A beside B)
 * ```
 */
const LEVELS = ['low', 'mid', 'high'];
const TAP = (...states: string[]) => ({ part: 'tap', in: states });
const FAR_SIDE = { any: [{ babyAt: 'F1' }, { babyAt: 'F2' }] };
/** A tub's lift: it follows the tap's level. */
const tub = (id: string, hitX: number) => ({
  id, preset: 'lift' as const, states: LEVELS, initial: 'high', hit: { x: hitX, y: 440, w: 60, h: 72 }, art: 'c8/wooden-tub',
  react: LEVELS.map((s) => ({ on: { type: 'partEnter' as const, id: 'tap', state: s }, to: s })),
});
/** Mocha's tub drifts out to him empty: he's in neither tub (read at the tick's end, so crawling across from it counts as in). */
const EMPTY_TUB = {
  type: 'partEnter' as const, id: 'tubA',
  when: { all: [{ part: 'tubA', in: ['high'] }, { not: { any: [{ babyAt: 'A' }, { babyAt: 'B' }] } }, { mochaAt: 'counter' }] },
};

export default definePage({
  id: 'c8p5', chapter: 8, index: 5, title: '大浴池', difficulty: 4, backdrop: 'c8/big-bath',
  nodes: [
    // The near deck
    { id: 'N1', x: 36, y: 446, height: 1 }, { id: 'N2', x: 90, y: 446, height: 1 },
    // The two wooden tubs, riding the water
    { id: 'A', x: 196, y: 446, height: 1, attach: { part: 'tubA', pos: { low: [140, 512], mid: [124, 468], high: [196, 446] } } },
    { id: 'B', x: 252, y: 446, height: 1, attach: { part: 'tubB', pos: { low: [256, 512], mid: [292, 468], high: [252, 446] } } },
    // The far side: the stone step, the shop counter's step
    { id: 'F1', x: 334, y: 468, height: 1 }, { id: 'F2', x: 372, y: 446, height: 1 },
    // Mocha's perches: the stack of bath stools, the stepping stone on the bath's bottom, the shop counter
    { id: 'stoolsTop', x: 52, y: 388, height: 2 }, { id: 'stoneTop', x: 196, y: 500, height: 2, tags: ['wet'] },
    { id: 'counterTop', x: 352, y: 382, height: 2 },
  ],
  edges: [
    { a: 'N1', b: 'N2', kind: 'crawl' },
    // Into the near tub when it floats a step under the deck
    { a: 'N2', b: 'A', kind: 'climb', when: TAP('mid') },
    // Tub to tub when they float side by side, full
    { a: 'A', b: 'B', kind: 'crawl', when: TAP('high') },
    // Out of the far tub onto the far step when it floats beside it, half full
    { a: 'B', b: 'F1', kind: 'crawl', when: TAP('mid') },
    { a: 'F1', b: 'F2', kind: 'climb' },
    { a: 'stoolsTop', b: 'stoneTop', kind: 'jump' }, { a: 'stoneTop', b: 'counterTop', kind: 'jump' },
  ],
  parts: [
    // The bath's tap: drain, half fill, fill
    { id: 'tap', preset: 'wheel', states: LEVELS, initial: 'high', center: [72, 290], radius: 32,
      hit: { cx: 72, cy: 290, r: 32 }, art: 'c8/bath-tap' },
    // The water itself: its level follows the tap (drawn under the tubs)
    { id: 'water', preset: 'lift', states: LEVELS, initial: 'high', hit: { x: 104, y: 446, w: 216, h: 66 }, art: 'c8/bath-water',
      react: LEVELS.map((s) => ({ on: { type: 'partEnter' as const, id: 'tap', state: s }, to: s })) },
    tub('tubA', 166), tub('tubB', 222),
  ],
  perches: [
    { id: 'stools', node: 'stoolsTop', reachNode: 'N1' },
    // The stepping stone: under water unless the bath is drained (C7)
    { id: 'stone', node: 'stoneTop', blockedWhen: TAP('mid', 'high') },
    { id: 'counter', node: 'counterTop', reachNode: 'F2' },
  ],
  creatures: [],
  // The bead on the counter's step, seen from the far side
  attractors: [{ id: 'bead', kind: 'shiny', node: 'F2', goal: true, visibleWhen: FAR_SIDE }],
  baby: { start: 'N1', facing: 'r' },
  mocha: { start: 'stools' },
  mischief: { text: '讓摩卡的澡盆空空漂過去', when: EMPTY_TUB },
  // Soaking in the far corner of the bath up to his chin, towel on his head, while it's full
  tudigong: { x: 318, y: 430, visibleWhen: TAP('high'), hat: '毛巾' },
  solution: [
    { set: 'tap', to: 'low' }, { mocha: 'counter' }, { wait: 'settle' }, { set: 'tap', to: 'mid' }, { wait: 'settle' },
    { set: 'tap', to: 'high' }, { wait: 'settle' }, { set: 'tap', to: 'mid' }, { wait: 'goal' },
  ],
  lines: {
    onEvent: [
      // The 店員小哥's chapter 8 cameo (§ 5.3): Mocha hops onto his shop counter
      { when: { type: 'catArrive', id: 'counter' }, line: 'c8p5.clerk.1' },
      { when: { type: 'catArrive', id: 'counter' }, line: 'c8p5.clerk.2' },
      { when: { type: 'catArrive', id: 'counter' }, line: 'c8p5.clerk.3' },
      { when: EMPTY_TUB, line: 'c8p5.mocha.1' },
    ],
  },
});
