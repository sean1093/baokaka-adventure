import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 2-6 「畫畫的阿伯」 · difficulty 3 · par 4 · treasure 畫筆: chapter 2's spread (§ 2.9),
 * a pop-up inside a pop-up. On the left page an old painter's canvas stands on its easel by a
 * stream; on the right he dozes on his stool under a parasol, the 畫筆 in his hand, a squirrel
 * asleep on his hat. Three painted **flaps** on the canvas pop up into real paper: a bridge over the
 * stream (`flapA`, Baokaka's way across), a branch from the easel to the parasol (`flapB`, Mocha's
 * way over) and a little portrait corner (`flapC`, where the 土地公 is painted in). Mocha on the
 * parasol shoos the squirrel up the tree (C6); only then does Baokaka's 掰掰 reach the painter, who
 * waves back in his sleep and drops the 畫筆 (`drop`), one edge from Baokaka: the photo moment.
 * The 淘氣: open all three flaps and the painting becomes a portrait of Mocha.
 *
 * ```
 *   lamp ─jump─ easel ─jump (flapB open)─ parasol            tree (squirrel, shooed)
 *   L1 ── L2 ══(flapA open)══ C1 ── R1 ── P (painter asleep, holding the 畫筆)
 * ```
 */
export default definePage({
  id: 'c2p6', chapter: 2, index: 6, title: '畫畫的阿伯', difficulty: 3, backdrop: 'c2/painter-spread',
  spread: true,
  // The right page round the painter, his parasol (Mocha's +M) and the path up to him
  photoRect: { x: 196, y: 300, w: 194, h: 226 },
  nodes: [
    // The meadow (left page), the stream, and the path to the painter (right page)
    { id: 'L1', x: 36, y: 484, height: 0 }, { id: 'L2', x: 96, y: 484, height: 0 },
    { id: 'C1', x: 200, y: 484, height: 0 }, { id: 'R1', x: 262, y: 484, height: 0 },
    { id: 'P', x: 326, y: 484, height: 0 },             // the painter's stool, where the 畫筆 falls
    { id: 'chair', x: 362, y: 440, height: 0 },         // unconnected: he slumps back in his chair
    { id: 'hat', x: 326, y: 404, height: 1 },           // unconnected: the squirrel asleep on his hat
    { id: 'treeTop', x: 372, y: 226, height: 2 },       // unconnected: where the squirrel is shooed to
    // Mocha's perches: the lamp, the easel's top, the painter's parasol
    { id: 'lampTop', x: 40, y: 300, height: 2 }, { id: 'easelTop', x: 150, y: 262, height: 2 },
    { id: 'parasolTop', x: 300, y: 320, height: 2 },
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' },
    { a: 'L2', b: 'C1', kind: 'crawl', when: { part: 'flapA', in: ['open'] } },
    { a: 'C1', b: 'R1', kind: 'crawl' }, { a: 'R1', b: 'P', kind: 'crawl' },
    { a: 'lampTop', b: 'easelTop', kind: 'jump' },
    { a: 'easelTop', b: 'parasolTop', kind: 'jump', when: { part: 'flapB', in: ['open'] } },
  ],
  parts: [
    // The painted bridge, over the stream
    { id: 'flapA', preset: 'flap', hit: { x: 120, y: 444, w: 56, h: 56 }, art: 'c2/canvas-bridge' },
    // The painted branch, between the easel and the parasol
    { id: 'flapB', preset: 'flap', hit: { x: 196, y: 262, w: 56, h: 56 }, art: 'c2/canvas-branch' },
    // The painted portrait corner on the canvas
    { id: 'flapC', preset: 'flap', hit: { x: 108, y: 330, w: 56, h: 56 }, art: 'c2/canvas-portrait' },
  ],
  perches: [
    { id: 'lamp', node: 'lampTop', reachNode: 'L1' },
    { id: 'easel', node: 'easelTop', reachNode: 'L2' },
    { id: 'parasol', node: 'parasolTop', reachNode: 'R1' },
  ],
  creatures: [
    // Asleep on the painter's hat; Mocha on the parasol shoos it up the tree
    { id: 'squirrel', positions: { hat: 'hat', tree: 'treeTop' }, initial: 'hat', blocks: false,
      fleesFromCat: { nearPerches: ['parasol'], to: 'tree' }, art: 'c2/squirrel' },
    // Asleep with the 畫筆 in his hand; with the squirrel gone, 掰掰 makes him wave and drop it
    { id: 'painter', positions: { sleep: 'P', nodding: 'chair' }, initial: 'sleep',
      react: [{ on: 'wave', when: { creature: 'squirrel', at: 'tree' }, to: 'nodding', drop: 'brush' }], art: 'c2/painter' },
  ],
  attractors: [{ id: 'brush', kind: 'shiny', node: 'P', goal: true, heldBy: 'painter' }],
  baby: { start: 'L1', facing: 'r' },
  mocha: { start: 'lamp' },
  mischief: {
    text: '把三片畫都翻開，畫出摩卡',
    when: { type: 'partEnter', when: { all: [{ part: 'flapA', in: ['open'] }, { part: 'flapB', in: ['open'] }, { part: 'flapC', in: ['open'] }] } },
  },
  // Painted into the portrait corner, sweeping the painted path
  tudigong: { x: 194, y: 372, visibleWhen: { part: 'flapC', in: ['open'] }, hat: '斗笠' },
  solution: [{ tap: 'flapA' }, { tap: 'flapB' }, { mocha: 'parasol' }, { wait: 'settle' }, { say: 'bye' }, { wait: 'goal' }],
});
