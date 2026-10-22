import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 10-2 「37秒電梯」 · difficulty 3 · par 3. A callback to 1-5: 101's express elevator
 * in cross-section, the 5F ticket hall below and the 89F observatory above, the car (a **lift**,
 * `5F` / `89F`) riding the shaft between them and an altitude dial over the shaft (a `section` the
 * car turns: it counts 5 … 89 as they rise). The car's panel is a button: Mocha sitting on it sends
 * the car to the other floor, and a tap on him presses it again (`pet`). Across the observatory's open
 * floor, the bead on the window ledge: nothing to hold on to on the way (a `walk` edge — not yet his),
 * so the 清潔阿伯 mopping by the window carries him (a **carrier**, 抱抱).
 *
 * He reaches for Mocha up the shaft from the 5F door (Mocha is on the 89F gift shop's shelf). Mocha
 * into the car: it takes him down; Baokaka crawls in to cuddle him. Tap Mocha: the car goes up —
 * 「三十七秒，從五樓到八十九樓。」 — and the 店員小哥 greets them at 89F (§ 5.3, chapter 10's cameo:
 * 「我們在101也有分店。」). The bead glints across the floor and he crawls out after it, as far as
 * the floor's rope. 抱抱: the 清潔阿伯 lifts him (「來，阿伯抱你去窗邊看。」) and carries him to the
 * window. The 淘氣: send Mocha up and down alone three times.
 *
 * ```
 *                                  shelf (Mocha, 89F gift shop)
 *                         panel (Mocha, in the car) ─ (car at 89F: jump)
 *            89F:   E@89F ── O1 ── O2 (the 清潔阿伯) ┄walk┄ W (window ledge: bead)
 *            5F:    L1 (start) ── L2 ── L3 (door) ═(car at 5F)═ E@5F
 *                  counter (Mocha, 5F ticket counter) ─ (car at 5F: jump) ─ panel
 * ```
 */
const AT_89 = { part: 'elevator', in: ['89F'] };
const AT_5 = { part: 'elevator', in: ['5F'] };
/** At 89F at last: his first crawl out of the car (the car's arrival and his step are one tick) */
const UP_WITH_HIM = { type: 'babyEnter' as const, id: 'O1' };

export default definePage({
  id: 'c10p2', chapter: 10, index: 2, title: '37秒電梯', difficulty: 3, backdrop: 'c10/elevator',
  nodes: [
    // 5F, the ticket hall on the floor page
    { id: 'L1', x: 36, y: 486, height: 0 }, { id: 'L2', x: 92, y: 486, height: 0 }, { id: 'L3', x: 148, y: 486, height: 0 },
    // The car: at 5F beside the door, at 89F beside the observatory
    { id: 'E', x: 210, y: 486, height: 0, attach: { part: 'elevator', pos: { '5F': [210, 486], '89F': [210, 262] } } },
    // 89F: the observatory's floor, and across its open stretch the window ledge
    { id: 'O1', x: 266, y: 262, height: 0 }, { id: 'O2', x: 316, y: 262, height: 0 },
    { id: 'W', x: 368, y: 262, height: 0 },
    // Mocha's perches: the gift shop's shelf at 89F, the car's panel, the 5F ticket counter
    { id: 'shelfTop', x: 294, y: 180, height: 2 },
    { id: 'panelTop', x: 236, y: 422, height: 2, attach: { part: 'elevator', pos: { '5F': [236, 422], '89F': [236, 198] } } },
    { id: 'counterTop', x: 120, y: 410, height: 2 },
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' }, { a: 'L2', b: 'L3', kind: 'crawl' },
    { a: 'L3', b: 'E', kind: 'crawl', when: AT_5 },
    { a: 'E', b: 'O1', kind: 'crawl', when: AT_89 },
    { a: 'O1', b: 'O2', kind: 'crawl' },
    // The open floor to the window: nothing to hold on to (he can't walk yet)
    { a: 'O2', b: 'W', kind: 'walk' },
    { a: 'shelfTop', b: 'panelTop', kind: 'jump', when: AT_89 },
    { a: 'counterTop', b: 'panelTop', kind: 'jump', when: AT_5 },
  ],
  parts: [
    // Every press of the panel sends the car to the other floor
    { id: 'elevator', preset: 'lift', states: ['5F', '89F'], initial: '89F', hit: { x: 180, y: 200, w: 60, h: 300 },
      react: [{ on: { type: 'partEnter', id: 'panel', state: 'down' }, to: 'toggle' }], art: 'c10/elevator' },
    // The car's panel rides with the car, under Mocha's seat (its hit authored where the car starts,
    // at 89F, as a riding part's is: #134 moved it from the 5F place, where it drew 224 below the car)
    { id: 'panel', preset: 'button', ridesOn: 'E', hit: { x: 208, y: 170, w: 56, h: 56 }, art: 'c10/elevator-panel' },
    // The altitude dial over the shaft: the car turns it (5 … 89), nobody else
    { id: 'altimeter', preset: 'section', states: ['5F', '89F'], initial: '89F', hit: { x: 182, y: 120, w: 56, h: 56 }, art: 'c10/altimeter',
      react: [
        { on: { type: 'partEnter', id: 'elevator', state: '5F' }, to: '5F' },
        { on: { type: 'partEnter', id: 'elevator', state: '89F' }, to: '89F' },
      ] },
    // The 清潔阿伯, mopping by the window: 抱抱 and he carries him across the open floor
    { id: 'uncle', preset: 'carrier', route: ['O2', 'W'], hit: { x: 290, y: 190, w: 56, h: 72 }, art: 'c10/cleaner-uncle' },
  ],
  perches: [
    { id: 'shelf', node: 'shelfTop', reachNode: 'O1' },
    { id: 'carPanel', node: 'panelTop', reachNode: 'E', onPart: 'panel' },
    { id: 'counter', node: 'counterTop', reachNode: 'L3' },
  ],
  creatures: [],
  // The bead on the window ledge, seen from 89F
  attractors: [{
    id: 'bead', kind: 'shiny', node: 'W', goal: true,
    visibleWhen: { any: [{ babyAt: 'O1' }, { babyAt: 'O2' }, { babyAt: 'W' }, { all: [{ babyAt: 'E' }, AT_89] }] },
  }],
  baby: { start: 'L1', facing: 'r' },
  mocha: { start: 'shelf' },
  // Mocha rides alone (§ 4.4 10-2): three trips without him
  mischief: { text: '讓摩卡自己搭電梯三次', when: { type: 'partEnter', id: 'elevator', count: 3, when: { not: { babyAt: 'E' } } } },
  // In the 89F gift shop's window, his 清潔帽 among the souvenir hats, seen from 89F
  tudigong: { x: 340, y: 176, visibleWhen: { any: [{ babyAt: 'O1' }, { babyAt: 'O2' }] }, hat: '清潔帽' },
  solution: [{ mocha: 'carPanel' }, { wait: 'settle' }, { pet: true }, { wait: 'settle' }, { say: 'hug' }, { wait: 'goal' }],
  lines: {
    onEvent: [
      // The first ride up with him: the 37 seconds, then the 店員小哥 at 89F (§ 5.3, chapter 10)
      { when: UP_WITH_HIM, line: 'c10p2.ride.1' },
      { when: UP_WITH_HIM, line: 'c10p2.clerk.1' },
      { when: UP_WITH_HIM, line: 'c10p2.clerk.2' },
      { when: UP_WITH_HIM, line: 'c10p2.clerk.3' },
      // The 清潔阿伯 picks him up
      { when: { type: 'partEnter', id: 'uncle', when: { part: 'uncle', in: ['carrying@0'] } }, line: 'c10p2.uncle.1' },
    ],
  },
});
