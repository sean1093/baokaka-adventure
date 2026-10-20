import { definePage } from '../../core/define';

/** The bento cart per slider stop (back by the kitchen, half out, at the platform edge): its step, */
const STEP: Record<string, [number, number]> = { kitchen: [318, 480], middle: [282, 480], platform: [246, 480] };
/** the giant bento on it, */
const BENTO: Record<string, [number, number]> = { kitchen: [358, 480], middle: [322, 480], platform: [286, 480] };
/** and its awning (Mocha's `canopy` perch). */
const AWNING: Record<string, [number, number]> = { kitchen: [342, 392], middle: [306, 392], platform: [270, 392] };

/**
 * GDD § 4.3, page 1-6 「台鐵便當」 · difficulty 3 · par 4 · treasure 雞腿: chapter 1's spread (§ 2.9),
 * drawn as a centrefold — the concourse and its exit gate on the left page, the platform and the
 * giant railway bento (unbranded) on its cart on the right. The lid is closed, so nothing shiny
 * shows: Mocha on the station clock is the best thing on the page, and Baokaka crawls to him, by
 * the gate. Open the lid: the 雞腿 appears — and the pigeon swoops down onto the cart for it (it
 * wants the same thing he does). He reaches at the closed gate: 嗶！ opens it. Slide the cart to the
 * platform and send Mocha onto its awning (`canopy`, reachable only there): the pigeon flees, the
 * way is clear, he climbs onto the cart's step and the photo moment begins (two edges out, so it
 * catches his approach), and he grabs the 雞腿: 「好吃！」 After the album, the shell
 * plays the chapter-end lines (`content/chapters.ts` `endLines`).
 *
 * The lid rides the cart (`ridesOn: 'K'`, drawn and touched where the cart is). With Mocha on the
 * awning the pigeon stays on the roof when the lid opens again.
 */
export default definePage({
  id: 'c1p6', chapter: 1, index: 6, title: '台鐵便當', difficulty: 3, backdrop: 'c1/bento-spread',
  spread: true,
  // The right page round the platform edge and the cart's stops, the awning (Mocha's +M) included
  photoRect: { x: 196, y: 330, w: 194, h: 196 },
  nodes: [
    // The concourse (left page) and its exit gate
    { id: 'L1', x: 36, y: 480, height: 0 }, { id: 'L2', x: 96, y: 480, height: 0 },
    { id: 'g', x: 152, y: 480, height: 0, attach: { part: 'exitGate', pos: { closed: [152, 480], open: [152, 480] } } },
    // The platform (right page) and the bento cart
    { id: 'P1', x: 206, y: 480, height: 0 },
    { id: 'cartStep', x: 0, y: 0, height: 0, attach: { part: 'cart', pos: STEP } },   // where the pigeon lands
    { id: 'K', x: 0, y: 0, height: 0, attach: { part: 'cart', pos: BENTO } },          // the 雞腿 in the bento
    // Mocha's perches: the station clock over the gate, the cart's awning
    { id: 'clockTop', x: 120, y: 226, height: 2 },
    { id: 'canopyTop', x: 0, y: 0, height: 1, attach: { part: 'cart', pos: AWNING } },
    { id: 'roofBeam', x: 300, y: 196, height: 2 },   // unconnected: the pigeon's roof beam
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' }, { a: 'L2', b: 'g', kind: 'crawl' }, { a: 'g', b: 'P1', kind: 'crawl' },
    { a: 'P1', b: 'cartStep', kind: 'crawl', when: { part: 'cart', in: ['platform'] } }, { a: 'cartStep', b: 'K', kind: 'crawl' },
    { a: 'clockTop', b: 'canopyTop', kind: 'jump', when: { part: 'cart', in: ['platform'] } },
  ],
  parts: [
    { id: 'cart', preset: 'slider', states: ['kitchen', 'middle', 'platform'], initial: 'middle', input: 'drag-linear',
      track: { from: [344, 604], to: [264, 604] }, hit: { x: 228, y: 578, w: 150, h: 56 }, art: 'c1/bento-cart' },
    // The giant bento's lid, on the cart: closed, it hides the 雞腿
    { id: 'lid', preset: 'flap', ridesOn: 'K', hit: { x: 294, y: 428, w: 56, h: 56 }, art: 'c1/bento-lid' },
    { id: 'exitGate', preset: 'gate', hit: { x: 124, y: 430, w: 56, h: 100 }, react: [{ on: { type: 'beep', within: 120 }, to: 'open' }], art: 'c1/gate' },
  ],
  perches: [
    { id: 'clock', node: 'clockTop', reachNode: 'L2' },
    { id: 'canopy', node: 'canopyTop', reachNode: 'P1' },
  ],
  creatures: [
    // Drawn by the open lid (unless Mocha is on the awning), scared off by Mocha (C6), gone when it shuts
    { id: 'pigeon', positions: { roof: 'roofBeam', cart: 'cartStep' }, initial: 'roof',
      fleesFromCat: { nearPerches: ['canopy'], to: 'roof' },
      react: [
        { on: { type: 'partEnter', id: 'lid', state: 'open' }, when: { not: { mochaAt: 'canopy' } }, to: 'cart' },
        { on: { type: 'partEnter', id: 'lid', state: 'closed' }, to: 'roof' },
      ],
      art: 'common/pigeon' },
  ],
  attractors: [{ id: 'drumstick', kind: 'shiny', node: 'K', goal: true, visibleWhen: { part: 'lid', in: ['open'] } }],
  baby: { start: 'L1', facing: 'r' },
  mocha: { start: 'clock' },
  mischief: { text: '讓鴿子白跑三趟', when: { type: 'partEnter', id: 'lid', count: 3, when: { part: 'lid', in: ['open'] } } },
  tudigong: { x: 300, y: 330, visibleWhen: { part: 'cart', in: ['kitchen'] }, hat: '站務帽' },   // through the train's window behind the cart, once it is back at the kitchen
  solution: [{ tap: 'lid' }, { wait: 'settle' }, { say: 'beep' }, { set: 'cart', to: 'platform' }, { mocha: 'canopy' }, { wait: 'goal' }],
});
