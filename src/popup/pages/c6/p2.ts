import { definePage, loopAttach } from '../../core/define';

/**
 * GDD § 4.4, page 6-2 「行李轉盤」 (the baggage carousel) · difficulty 3 · par 3. The landmark's
 * signature mechanism: the carousel is a **loop** (#120). Its belt runs along the front past the
 * hall, round the far end and back along the back run, where it ducks through a rubber curtain in
 * the wall; a suitcase rides it, one slot along per turn. The bead lies on the hall floor beyond the carousel: he can't
 * get round, so he crawls up to its near end and reaches.
 *
 * At 02:50 the carousel is switched off (its beacon dark, the belt won't turn: `lockedWhen`). The
 * start button is behind the rubber curtain, where only a cat goes: Mocha, sitting on the
 * carousel's island, squeezes through the curtain (C2) onto the button. The beacon spins
 * amber — and the 店員小哥 runs the baggage hall too (the chapter's cameo). Now turn the belt: bring
 * the suitcase round to the near end, he crawls onto it, and turn again — it carries him round to
 * the far end, by the bead. The 淘氣: Mocha rides a suitcase three laps on his own.
 *
 * ```
 *   caseB (Mocha, riding the belt) ─jump─ island (Mocha) ═squeeze═ button (behind the curtain, far end)
 *                 slot 3 (back) ◀──── slot 2 (back)
 *                   │      the belt      ▲
 *                 slot 0 (front) ────▶ slot 1 (front)
 *   F1 ── F2 ── S (suitcase at slot 0)    S (at slot 1) ── F3 (bead)
 * ```
 */
const BELT = ['0', '1', '2', '3'];
/** The belt's four slots: the front run (near end, far end), then the back run (far end, near end). */
const SLOTS: [number, number][] = [[152, 456], [276, 456], [270, 396], [158, 396]];
const POWERED = { part: 'beacon', in: ['on'] };

export default definePage({
  id: 'c6p2', chapter: 6, index: 2, title: '行李轉盤', difficulty: 3, backdrop: 'c6/baggage-hall',
  nodes: [
    // The hall floor at the carousel's near end, and beyond its far end
    { id: 'F1', x: 36, y: 486, height: 0 }, { id: 'F2', x: 94, y: 486, height: 0 },
    { id: 'F3', x: 350, y: 486, height: 0 },
    // His suitcase on the belt: it starts on the back run (slot 2), one slot along per turn
    { id: 'S', x: 270, y: 396, height: 0, attach: loopAttach('belt', BELT, SLOTS, 2) },
    // Mocha's perches: the carousel's island, the start button behind the curtain, a second
    // suitcase riding the belt (seat 0: at the near end to begin with)
    { id: 'islandTop', x: 214, y: 420, height: 1 },
    { id: 'buttonTop', x: 344, y: 392, height: 1 },
    { id: 'caseB', x: 152, y: 440, height: 1, attach: loopAttach('belt', BELT, SLOTS.map(([x, y]) => [x, y - 16]), 0) },
  ],
  edges: [
    { a: 'F1', b: 'F2', kind: 'crawl' },
    // Onto the suitcase at the near end; off it at the far end
    { a: 'F2', b: 'S', kind: 'crawl', when: { part: 'belt', in: ['2'] } },
    { a: 'S', b: 'F3', kind: 'crawl', when: { part: 'belt', in: ['3'] } },
    // Through the rubber curtain to the start button: cats only (C2)
    { a: 'islandTop', b: 'buttonTop', kind: 'squeeze' },
    // Onto the other suitcase, wherever the belt has it (the 淘氣)
    { a: 'islandTop', b: 'caseB', kind: 'jump' },
  ],
  parts: [
    // The belt: drag it round (one slot per step); it won't turn until the carousel is switched on
    { id: 'belt', preset: 'loop', states: BELT, input: 'drag-rotary', center: [214, 470], radius: 44,
      hit: { x: 140, y: 444, w: 148, h: 58 }, lockedWhen: { part: 'beacon', in: ['off'] }, art: 'c6/carousel-belt' },
    // The start button behind the rubber curtain: Mocha's weight presses it
    { id: 'start', preset: 'button', hit: { x: 316, y: 380, w: 56, h: 56 }, art: 'c6/start-button' },
    // The carousel's beacon: it spins amber once started, and stays on (event-driven: nothing to tap)
    { id: 'beacon', preset: 'light', hit: { x: 186, y: 300, w: 56, h: 56 }, art: 'c6/carousel-beacon',
      react: [{ on: { type: 'partEnter', id: 'start', state: 'down' }, to: 'on' }] },
  ],
  perches: [
    { id: 'island', node: 'islandTop', reachNode: 'F2' },
    // Behind the curtain: his weight presses the start button (C4)
    { id: 'button', node: 'buttonTop', reachNode: 'F3', onPart: 'start' },
    { id: 'caseB', node: 'caseB', reachNode: 'F2' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'F3', goal: true }],
  baby: { start: 'F1', facing: 'r' },
  mocha: { start: 'island' },
  // Mocha round and round on a suitcase, with nobody else aboard: three laps
  mischief: {
    text: '讓摩卡自己坐行李轉三圈',
    when: { type: 'partEnter', id: 'belt', count: 3, when: { all: [{ part: 'belt', in: ['0'] }, { mochaAt: 'caseB' }, { not: { babyAt: 'S' } }] } },
  },
  // A 土地公 luggage tag on a suitcase in the lost-and-found cage, seen once the carousel starts
  tudigong: { x: 330, y: 330, visibleWhen: POWERED, hat: '機場背心' },
  solution: [{ mocha: 'button' }, { wait: 'settle' }, { set: 'belt', to: '2' }, { wait: 'settle' }, { set: 'belt', to: '3' }, { wait: 'goal' }],
  lines: {
    onEvent: [
      // The 店員小哥's chapter 6 cameo (§ 5.3): Mocha squeezes through onto his start button
      { when: { type: 'catArrive', id: 'button' }, line: 'c6p2.clerk.1' },
      { when: { type: 'catArrive', id: 'button' }, line: 'c6p2.clerk.2' },
      { when: { type: 'catArrive', id: 'button' }, line: 'c6p2.clerk.3' },
    ],
  },
});
