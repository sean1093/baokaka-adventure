import { definePage } from '../../core/define';

/** Where the disk's two aisle seats sit, per floor state (0/2 east–west, 1/3 north–south; clockwise). */
const WEST: [number, number] = [115, 495];
const NORTH: [number, number] = [195, 450];
const EAST: [number, number] = [275, 495];
const SOUTH: [number, number] = [195, 540];

/**
 * GDD § 4.3, page 1-4 「大廳的棋盤」 (the checkerboard hall) · difficulty 3 · par 3. The hall floor is
 * a big checkered turntable (`floor`, a wheel: 0 and 2 run its aisle east–west, 1 and 3 north–south;
 * seated travellers printed on it form the aisle). Its centre `C` is fixed; the two aisle seats `d1`
 * and `d2` turn with it, and Baokaka on one rides round. The bead lies north, past gate N. The floor
 * starts north–south, so the west entry is cut off and he reaches there. Turn it east–west: he
 * crawls in to the centre and reaches north. Turn it back while he is on it, and the aisle points
 * him at the gate; 嗶！ opens it. Turned too early he is left at the entry (every turn reverses).
 * There is no timer: he waits at `C` for ever. Mocha's perches (the hall clock, the lightbox over the
 * gate) are decoration: the page is about timing, not Mocha.
 */
export default definePage({
  id: 'c1p4', chapter: 1, index: 4, title: '大廳的棋盤', difficulty: 3, backdrop: 'c1/hall',
  nodes: [
    { id: 'W0', x: 26, y: 495, height: 0 }, { id: 'W', x: 58, y: 495, height: 0 },   // the west entry
    { id: 'C', x: 195, y: 495, height: 0 },                                           // the disk's fixed centre
    { id: 'd1', x: 0, y: 0, height: 0, attach: { part: 'floor', pos: { 0: WEST, 1: NORTH, 2: EAST, 3: SOUTH } } },
    { id: 'd2', x: 0, y: 0, height: 0, attach: { part: 'floor', pos: { 0: EAST, 1: SOUTH, 2: WEST, 3: NORTH } } },
    { id: 'G', x: 195, y: 410, height: 0, attach: { part: 'gateN', pos: { closed: [195, 410], open: [195, 410] } } },
    { id: 'B', x: 210, y: 374, height: 0 },                                           // just past the gate, at the foot of the back wall
    // Mocha's perches (decorative): the big hall clock and the lightbox sign over the gate
    { id: 'clockTop', x: 330, y: 214, height: 2 }, { id: 'lightboxTop', x: 195, y: 268, height: 2 },
  ],
  edges: [
    { a: 'W0', b: 'W', kind: 'crawl' },
    { a: 'W', b: 'd1', kind: 'crawl', when: { part: 'floor', in: ['0'] } },
    { a: 'W', b: 'd2', kind: 'crawl', when: { part: 'floor', in: ['2'] } },
    { a: 'd1', b: 'C', kind: 'crawl' }, { a: 'd2', b: 'C', kind: 'crawl' },
    { a: 'd1', b: 'G', kind: 'crawl', when: { part: 'floor', in: ['1'] } },
    { a: 'd2', b: 'G', kind: 'crawl', when: { part: 'floor', in: ['3'] } },
    { a: 'G', b: 'B', kind: 'crawl' },
    { a: 'clockTop', b: 'lightboxTop', kind: 'jump' },
  ],
  parts: [
    { id: 'floor', preset: 'wheel', states: ['0', '1', '2', '3'], initial: '1', input: 'drag-rotary',
      center: [195, 495], hit: { cx: 195, cy: 495, r: 84 }, art: 'c1/turntable' },
    { id: 'gateN', preset: 'gate', hit: { x: 167, y: 352, w: 56, h: 100 }, react: [{ on: { type: 'beep', within: 120 }, to: 'open' }], art: 'c1/gate' },
  ],
  perches: [
    { id: 'clock', node: 'clockTop', reachNode: 'W' },
    { id: 'lightbox', node: 'lightboxTop', reachNode: 'C' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'B', goal: true }],
  baby: { start: 'W0', facing: 'r' },
  mocha: { start: 'clock' },
  mischief: {
    text: '轉四圈，轉到頭暈暈',
    // Four turns of the floor with him on it (on the centre or riding an aisle seat)
    when: { type: 'partEnter', id: 'floor', count: 4, when: { any: [{ babyAt: 'C' }, { babyAt: 'd1' }, { babyAt: 'd2' }] } },
  },
  tudigong: { x: 248, y: 528, visibleWhen: { part: 'floor', in: ['2'] }, hat: '站務帽' },   // a seated traveller on the disk: his face shows in state 2
  // 嗶！ before the turn back, so each gesture starts from its own part states (the hint fallback, #100)
  solution: [{ set: 'floor', to: '0' }, { wait: 'settle' }, { say: 'beep' }, { set: 'floor', to: '1' }, { wait: 'goal' }],
});
