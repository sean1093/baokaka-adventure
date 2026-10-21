import { definePage, loopAttach } from '../../core/define';

/**
 * GDD § 4.4, page 6-6 「海關的印章」 · difficulty 4 · par 4 · treasure 印章: chapter 6's spread
 * (§ 2.9). The customs hall: the queue (left page), the X-ray machine's belt across the middle
 * (a **loop**: trays ride out of the tunnel and back over the top), and the customs officer's high
 * counter (right page), where the 印章 stands on its ink pad — high out of reach: he crawls up to the
 * belt and reaches.
 *
 * The tray at the belt's mouth is full of pigeons (`winged`, blocking it). 飛機！: they fly up into
 * the hall's rafters, and he climbs into the tray (it's nearer the stamp). The scanner is asleep
 * and the belt won't turn; from the tray he is close enough for 嗶！ (≤ 120): it wakes with a beep.
 * Turn the belt: the tray carries him through the X-ray tunnel — the screen shows his silhouette,
 * and a bottle (Mocha: 「X光說：寶寶一個，奶瓶一支。」) — and out at the far end, where he crawls off
 * under the counter and reaches up. Mocha jumps from the scanner's hood onto the counter and, after
 * his look at the camera, pushes the 印章 off (C3): it lands on the floor beside him (any time: before
 * the ride it waits there for him). **Photo moment** (Mocha on the counter, inside `photoRect`,
 * +M). The 淘氣: tap the officer's date stamper while Mocha sits on the counter — it stamps his paw.
 *
 * ```
 *   rope (Mocha) ─jump─ hood (Mocha, on the scanner) ─jump─ counter (Mocha: pushes the 印章 off)
 *                         slot 3 (back over the top) ◀── …
 *   L1 ── L2 ── T (tray at the mouth: pigeons) ▶ slot 1 (in the X-ray tunnel) ▶ slot 2 ── R1 (the 印章 lands) ── R2
 *   scanner: 嗶！ from the tray at the mouth           belt: locked until the scanner is awake
 * ```
 */
const BELT = ['0', '1', '2', '3'];
/** The belt's slots: the mouth, in the X-ray tunnel, the far end, then back over the top. */
const SLOTS: [number, number][] = [[130, 470], [200, 470], [270, 470], [200, 404]];
const AWAKE = { part: 'scanner', in: ['on'] };

export default definePage({
  id: 'c6p6', chapter: 6, index: 6, title: '海關的印章', difficulty: 4, backdrop: 'c6/customs-spread',
  spread: true,
  // The officer's counter and the floor under it: the 印章, Mocha on the counter
  photoRect: { x: 236, y: 220, w: 154, h: 300 },
  nodes: [
    // The queue in front of the X-ray machine
    { id: 'L1', x: 30, y: 494, height: 0 }, { id: 'L2', x: 86, y: 494, height: 0 },
    // The tray on the belt (seat 0: at the mouth to begin with)
    { id: 'T', x: 130, y: 470, height: 0, attach: loopAttach('belt', BELT, SLOTS, 0) },
    // Past the machine, under the officer's counter
    { id: 'R1', x: 312, y: 494, height: 0 }, { id: 'R2', x: 362, y: 494, height: 0 },
    { id: 'counterTop', x: 362, y: 330, height: 2 },  // the 印章 on the counter (unconnected for him)
    // Mocha's perches: the queue's rope post, the scanner's hood, the officer's counter
    { id: 'ropeTop', x: 40, y: 410, height: 1 }, { id: 'hoodTop', x: 200, y: 352, height: 2 },
    { id: 'counterEdge', x: 334, y: 318, height: 2 },
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' },
    // Into the tray at the belt's mouth, and out of it at the far end
    { a: 'L2', b: 'T', kind: 'crawl', when: { part: 'belt', in: ['0'] } },
    { a: 'T', b: 'R1', kind: 'crawl', when: { part: 'belt', in: ['2'] } },
    { a: 'R1', b: 'R2', kind: 'crawl' },
    { a: 'ropeTop', b: 'hoodTop', kind: 'jump' }, { a: 'hoodTop', b: 'counterEdge', kind: 'jump' },
  ],
  parts: [
    // The X-ray belt: drag it round (one slot per step) once the scanner is awake
    { id: 'belt', preset: 'loop', states: BELT, input: 'drag-rotary', center: [200, 520], radius: 30,
      hit: { cx: 200, cy: 520, r: 30 }, lockedWhen: { part: 'scanner', in: ['off'] }, art: 'c6/xray-belt' },
    // The scanner, asleep: 嗶！ wakes it (a machine answers a beep, § 2.4), and it stays awake
    { id: 'scanner', preset: 'light', hit: { x: 168, y: 400, w: 64, h: 60 }, art: 'c6/xray-scanner',
      react: [{ on: 'beep', to: 'on' }] },
    // The 印章 on its ink pad at the counter's edge (C3): Mocha pushes it off, and it lands by him
    { id: 'stamp', preset: 'pushable', fall: { path: [[362, 330], [342, 410], [312, 482]], fallTo: 'R1' },
      hit: { cx: 362, cy: 326, r: 28 }, art: 'c6/stamp' },
    // The officer's date stamper on the counter: a discovery (the 淘氣); tap it and it thumps down
    { id: 'stamper', preset: 'prop', states: ['up', 'down'], hit: { x: 250, y: 300, w: 56, h: 56 }, art: 'c6/date-stamper' },
  ],
  perches: [
    { id: 'rope', node: 'ropeTop', reachNode: 'L1' },
    { id: 'hood', node: 'hoodTop', reachNode: 'L2' },
    // On the counter: he pushes the 印章 off (after his look at the camera)
    { id: 'counter', node: 'counterEdge', reachNode: 'R2', push: 'stamp' },
  ],
  creatures: [
    // Pigeons dozing in the tray at the belt's mouth: 飛機！ sends them up into the rafters (and back)
    { id: 'pigeons', positions: { tray: 'T', sky: 'offpage' }, initial: 'tray', winged: true, art: 'common/pigeon' },
  ],
  attractors: [
    // The 印章: on the counter until Mocha pushes it, then on the floor where it lands. Out of sight
    // for the moment it tumbles (the pushable draws it falling)
    { id: 'seal', kind: 'shiny', node: 'counterTop', goal: true, followsPushable: 'stamp', visibleWhen: { not: { part: 'stamp', in: ['falling'] } } },
  ],
  baby: { start: 'L1', facing: 'r' },
  mocha: { start: 'rope' },
  mischief: {
    text: '在摩卡的腳掌蓋印章',
    when: { type: 'partEnter', id: 'stamper', when: { all: [{ part: 'stamper', in: ['down'] }, { mochaAt: 'counter' }] } },
  },
  // On the poster of the airport's passport stamps, lit once the scanner wakes
  tudigong: { x: 110, y: 300, visibleWhen: AWAKE, hat: '機場背心' },
  solution: [
    { say: 'plane' }, { wait: 'settle' }, { say: 'beep' }, { set: 'belt', to: '2' }, { wait: 'settle' },
    { mocha: 'counter' }, { wait: 'goal' },
  ],
  lines: {
    // Through the X-ray tunnel: the screen shows him, and his bottle
    onEvent: [{ when: { type: 'ride', id: 'belt', when: { all: [{ babyAt: 'T' }, { part: 'belt', in: ['1', '2'] }] } }, line: 'c6p6.xray.1' }],
  },
});
