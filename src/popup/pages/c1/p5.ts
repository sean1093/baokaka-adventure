import { definePage } from '../../core/define';

/**
 * GDD § 4.3, page 1-5 「便當店的電梯」 (the bento-shop elevator) · difficulty 3 · par 3. A cross-section:
 * B1 below, the 便當店 on 1F above, joined by an elevator whose car (`E`) rides with it. The bead
 * lies on the shop floor upstairs; the car starts at 1F, so Baokaka reaches at the B1 door. Mocha
 * jumps from the shop counter into the car and sits on its panel (`onPart`): the press sends the
 * car **down**. Baokaka crawls in (now the node nearest the bead). **Tap Mocha** to press again
 * (`pet`): the car goes up with both of them, and he crawls out to the bead. The aha introduces pet.
 *
 * The shop counter's 叮咚 bell is Mocha's seat there (`onPart`); petting him rings it, and the
 * 店員小哥 cameo answers (§ 5.2 ch1). Ringing it three times is the 淘氣 (§ 4.3's 「讓摩卡自己搭電梯上
 * 下三次」 can't happen: Baokaka boards the car the tick it reaches B1, and the next ride up ends the
 * page; D-70).
 */
export default definePage({
  id: 'c1p5', chapter: 1, index: 5, title: '便當店的電梯', difficulty: 3, backdrop: 'c1/bento-shop',
  nodes: [
    // B1, on the floor page
    { id: 'b1', x: 36, y: 492, height: 0 }, { id: 'b2', x: 96, y: 492, height: 0 }, { id: 'b1Door', x: 156, y: 492, height: 0 },
    // The car: at B1 beside the door, at 1F beside the shop
    { id: 'E', x: 0, y: 0, height: 0, attach: { part: 'elevator', pos: { B1: [218, 492], '1F': [218, 300] } } },
    // 1F, the shop floor on the standing page
    { id: 'f1Door', x: 280, y: 300, height: 0 }, { id: 'shop', x: 344, y: 300, height: 0 },
    // Mocha's perches: the shop counter (its bell), the car's panel, a shelf in B1
    { id: 'counterTop', x: 330, y: 226, height: 1 },
    { id: 'panelTop', x: 0, y: 0, height: 1, attach: { part: 'elevator', pos: { B1: [244, 440], '1F': [244, 248] } } },
    { id: 'b1ShelfTop', x: 318, y: 430, height: 1 },
  ],
  edges: [
    { a: 'b1', b: 'b2', kind: 'crawl' }, { a: 'b2', b: 'b1Door', kind: 'crawl' },
    { a: 'b1Door', b: 'E', kind: 'crawl', when: { part: 'elevator', in: ['B1'] } },
    { a: 'E', b: 'f1Door', kind: 'crawl', when: { part: 'elevator', in: ['1F'] } },
    { a: 'f1Door', b: 'shop', kind: 'crawl' },
    { a: 'counterTop', b: 'panelTop', kind: 'jump', when: { part: 'elevator', in: ['1F'] } },
    { a: 'b1ShelfTop', b: 'panelTop', kind: 'jump', when: { part: 'elevator', in: ['B1'] } },
  ],
  parts: [
    // Every press of the panel moves the car to the other floor
    { id: 'elevator', preset: 'lift', states: ['B1', '1F'], initial: '1F', hit: { x: 190, y: 250, w: 60, h: 262 },
      react: [{ on: { type: 'partEnter', id: 'panel', state: 'down' }, to: 'toggle' }], art: 'c1/elevator' },
    // The car's panel rides with the car (`ridesOn`), under Mocha's seat
    { id: 'panel', preset: 'button', ridesOn: 'E', hit: { x: 216, y: 220, w: 56, h: 56 }, art: 'c1/elevator-panel' },
    // The shop counter's call bell: Mocha sits on it from the start
    { id: 'bell', preset: 'button', initial: 'down', hit: { x: 302, y: 200, w: 56, h: 56 }, art: 'c1/counter-bell' },
  ],
  perches: [
    { id: 'counter', node: 'counterTop', reachNode: 'shop', onPart: 'bell' },
    { id: 'carPanel', node: 'panelTop', reachNode: 'E', onPart: 'panel' },
    { id: 'b1Shelf', node: 'b1ShelfTop', reachNode: 'b1Door' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'shop', goal: true }],
  baby: { start: 'b1', facing: 'r' },
  mocha: { start: 'counter' },
  mischief: { text: '讓摩卡按三次叮咚鈴', when: { type: 'partEnter', id: 'bell', count: 3, when: { part: 'bell', in: ['down'] } } },
  tudigong: { x: 296, y: 152, hat: '站務帽' },   // on the shop's menu board, among the dish pictures; always visible
  solution: [{ mocha: 'carPanel' }, { wait: 'settle' }, { pet: true }, { wait: 'goal' }],
  lines: {
    // The 店員小哥 cameo (§ 5.2 ch1): the bell's first 叮咚
    onEvent: [
      { when: { type: 'partEnter', id: 'bell', when: { part: 'bell', in: ['down'] } }, line: 'c1p5.clerk.1' },
      { when: { type: 'partEnter', id: 'bell', when: { part: 'bell', in: ['down'] } }, line: 'c1p5.clerk.2' },
      { when: { type: 'partEnter', id: 'bell', when: { part: 'bell', in: ['down'] } }, line: 'c1p5.clerk.3' },
    ],
  },
});
