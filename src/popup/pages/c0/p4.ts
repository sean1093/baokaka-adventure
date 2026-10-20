import { definePage } from '../../core/define';

/**
 * GDD § 4.3, page 0-4 「窗外的月亮線」 (the Moon Line at the window) · difficulty 2 · par 2. The
 * curtain is closed and Mocha sits on the windowsill, so Baokaka crawls to him and cuddles. Hide
 * Mocha in the laundry basket and nothing is left to want: Baokaka looks 「？」, then cries 「哇——」
 * (§ 2.2.5, crying is a tool). The cry opens the balcony door (it stays open) and wakes the paper
 * 月亮線 train outside (its lights come on, 廣播姊姊 speaks), and in their light the bead glints on
 * the train's step: with the curtain open he crawls out to it. The two moves go in either order
 * (#183, the AI playtest's order trap): opened first, the curtain shows a dark train and no bead,
 * so there is still nothing to want once Mocha hides. Every action is reversible, and an open door
 * is harmless (dead-end check, § 3.7). The 淘氣: close the curtain while Mocha sits on the curtain
 * rod — he is rolled into a 春捲.
 */
export default definePage({
  id: 'c0p4', chapter: 0, index: 4, title: '窗外的月亮線', difficulty: 2, backdrop: 'c0/home-window',
  nodes: [
    { id: 'rug1', x: 84, y: 486, height: 0 }, { id: 'rug2', x: 146, y: 486, height: 0 }, { id: 'rug3', x: 204, y: 486, height: 0 },
    { id: 'door', x: 262, y: 486, height: 0, attach: { part: 'balconyDoor', pos: { closed: [262, 486], open: [262, 486] } } },
    { id: 'trainStep', x: 334, y: 486, height: 0 },   // on the balcony: the paper train's step
    // Mocha's perches
    { id: 'sillTop', x: 140, y: 318, height: 1 },     // the windowsill
    { id: 'basketRim', x: 34, y: 420, height: 1 },    // the laundry basket: its rim at the node, Mocha inside
    { id: 'rodTop', x: 300, y: 164, height: 2 },      // the curtain rod, over the balcony window
    { id: 'roofTop', x: 340, y: 330, height: 2 },     // the train's roof, beyond the door
  ],
  edges: [
    { a: 'rug1', b: 'rug2', kind: 'crawl' }, { a: 'rug2', b: 'rug3', kind: 'crawl' }, { a: 'rug3', b: 'door', kind: 'crawl' },
    { a: 'door', b: 'trainStep', kind: 'crawl' },
    { a: 'sillTop', b: 'basketRim', kind: 'jump' }, { a: 'sillTop', b: 'rodTop', kind: 'jump' },
    { a: 'rodTop', b: 'roofTop', kind: 'jump', when: { part: 'balconyDoor', in: ['open'] } },
  ],
  parts: [
    // The paper 月亮線 train outside: the cry wakes it (it is further away than the cry's 220 units).
    // Listed first so the curtain's grip ear draws over its roof (#108)
    { id: 'train', preset: 'light', hit: { x: 300, y: 372, w: 84, h: 82 }, react: [{ on: { type: 'cry', within: 400 }, to: 'on' }], art: 'c0/moon-train' },
    // The curtain over the balcony window: closed, it hides the train and the bead
    { id: 'curtain', preset: 'flap', hit: { x: 226, y: 180, w: 148, h: 166 }, art: 'c0/curtain' },
    // The balcony door: only his cry opens it, and it stays open
    { id: 'balconyDoor', preset: 'gate', hit: { x: 234, y: 392, w: 56, h: 100 }, react: [{ on: 'cry', to: 'open' }], art: 'c0/balcony-door' },
  ],
  perches: [
    { id: 'sill', node: 'sillTop', reachNode: 'rug2' },
    { id: 'basket', node: 'basketRim', reachNode: 'rug1', hidesMocha: true },
    { id: 'rod', node: 'rodTop', reachNode: 'rug3' },
    { id: 'trainRoof', node: 'roofTop', reachNode: 'trainStep' },
  ],
  creatures: [],
  // The bead glints on the train's step only once the train's lights are on (#183): opening the
  // curtain first shows a dark train and nothing to want, never a bead he reaches at forever
  attractors: [{ id: 'bead', kind: 'shiny', node: 'trainStep', goal: true, visibleWhen: { all: [{ part: 'curtain', in: ['open'] }, { part: 'train', in: ['on'] }] } }],
  baby: { start: 'rug1', facing: 'r' },
  mocha: { start: 'sill' },
  mischief: {
    text: '把摩卡捲進窗簾',
    when: { type: 'partEnter', id: 'curtain', when: { all: [{ part: 'curtain', in: ['closed'] }, { mochaAt: 'rod' }] } },
  },
  tudigong: { x: 300, y: 122, visibleWhen: { part: 'curtain', in: ['open'] }, hat: '' },   // outside on the street, seen once the curtain is open
  solution: [{ mocha: 'basket' }, { wait: 'settle' }, { tap: 'curtain' }, { wait: 'goal' }],
  lines: {
    // GDD § 5.2 P: the cry wakes the train, and 廣播姊姊 announces it
    onEvent: [
      { when: { type: 'partEnter', id: 'train', when: { part: 'train', in: ['on'] } }, line: 'c0p4.train.1' },
      { when: { type: 'partEnter', id: 'train', when: { part: 'train', in: ['on'] } }, line: 'c0p4.train.2' },
      { when: { type: 'partEnter', id: 'train', when: { part: 'train', in: ['on'] } }, line: 'c0p4.train.3' },
    ],
  },
});
