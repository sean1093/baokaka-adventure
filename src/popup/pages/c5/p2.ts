import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 5-2 「射氣球攤」 (the balloon-dart stall) · difficulty 3 · par 3. A balloon basket
 * hangs from a bunch of balloons beside the stall: empty, it floats up level with the prize shelf;
 * with Mocha's weight in it, it sinks to the ground — a **counterweight lift** (C4, #120). The prize
 * shelf is dark (the stall's bulbs are off at 02:20), so all he wants is Mocha, on the stall's pole.
 * Send Mocha into the basket: it sinks — the 店員小哥 runs this stall too (the chapter's cameo) — and
 * he crawls in after Mocha. Mocha jumps out onto the awning: without his weight the basket floats up
 * with Baokaka in it, to the shelf (*Mocha is a weight*). Up there the bulbs are in reach of his 哇！:
 * they light, and the bead shines among the prizes. The 淘氣: tap the knot and let the balloons go.
 *
 * ```
 *                 bulbs (哇！ from the basket up, or the shelf)     awning (Mocha) ─ reaches H1
 *   pole (Mocha) ─jump─ rim (Mocha in the basket: down) ─jump─ awning
 *                            B (basket: up) ── H1 ── H2 (bead, seen with the bulbs on)
 *   F1 ── F2 ── B (basket: down)
 * ```
 */
const BULBS_ON = { part: 'bulbs', in: ['on'] };

export default definePage({
  id: 'c5p2', chapter: 5, index: 2, title: '射氣球攤', difficulty: 3, backdrop: 'c5/balloon-stall',
  nodes: [
    // The lane in front of the stall
    { id: 'F1', x: 40, y: 486, height: 0 }, { id: 'F2', x: 110, y: 486, height: 0 },
    // The balloon basket: on the ground with Mocha's weight in it, up at the shelf without
    { id: 'B', x: 186, y: 486, height: 0, attach: { part: 'basket', pos: { down: [186, 486], up: [186, 326] } } },
    // The prize shelf, behind the dart counter
    { id: 'H1', x: 262, y: 326, height: 1 }, { id: 'H2', x: 336, y: 326, height: 1 },
    // Mocha's perches: the stall's pole, the basket's rim (riding it), the awning over the shelf
    { id: 'poleTop', x: 44, y: 300, height: 2 },
    { id: 'rimTop', x: 214, y: 450, height: 1, attach: { part: 'basket', pos: { down: [214, 450], up: [214, 290] } } },
    { id: 'awningTop', x: 290, y: 214, height: 2 },
  ],
  edges: [
    { a: 'F1', b: 'F2', kind: 'crawl' },
    { a: 'F2', b: 'B', kind: 'crawl', when: { part: 'basket', in: ['down'] } },
    { a: 'B', b: 'H1', kind: 'crawl', when: { part: 'basket', in: ['up'] } },
    { a: 'H1', b: 'H2', kind: 'crawl' },
    // Off the pole into the basket (a long leap down: there's no leaping back up), and from the
    // basket up onto the awning and back
    { a: 'poleTop', b: 'rimTop', kind: 'jump', oneWay: true }, { a: 'rimTop', b: 'awningTop', kind: 'jump' },
  ],
  parts: [
    // The balloon basket: Mocha's weight holds it down; without it, it floats up to the shelf
    { id: 'basket', preset: 'lift', states: ['down', 'up'], initial: 'up', counterweight: { on: 'down', off: 'up' },
      hit: { x: 156, y: 290, w: 64, h: 56 }, art: 'c5/balloon-basket' },
    // The string of bulbs over the prize shelf: 哇！ only reaches them from up there (≤ 160 units)
    { id: 'bulbs', preset: 'light', hit: { x: 250, y: 212, w: 120, h: 56 }, art: 'c5/stall-bulbs',
      react: [{ on: 'wow', to: 'toggle' }] },
    // The knot of the stall's balloon bunch: a discovery (the 淘氣); tap it and they all float off
    { id: 'knot', preset: 'prop', states: ['tied', 'loose'], hit: { x: 70, y: 380, w: 56, h: 56 }, art: 'c5/balloon-knot' },
  ],
  perches: [
    { id: 'pole', node: 'poleTop', reachNode: 'F1' },
    // In the basket: his weight sinks it (C4)
    { id: 'rim', node: 'rimTop', reachNode: 'B', onPart: 'basket' },
    { id: 'awning', node: 'awningTop', reachNode: 'H1' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'H2', goal: true, visibleWhen: BULBS_ON }],
  baby: { start: 'F2', facing: 'l' },
  mocha: { start: 'pole' },
  mischief: { text: '解開繩結，讓氣球全部飛走', when: { type: 'partEnter', id: 'knot', when: { part: 'knot', in: ['loose'] } } },
  // A plush 土地公 among the prizes, seen once the bulbs light
  tudigong: { x: 300, y: 290, visibleWhen: BULBS_ON, hat: '鴨舌帽' },
  solution: [{ mocha: 'rim' }, { wait: 'settle' }, { mocha: 'awning' }, { wait: 'settle' }, { say: 'wow' }, { wait: 'goal' }],
  lines: {
    onEvent: [
      // The 店員小哥's chapter 5 cameo (§ 5.3): Mocha lands in his balloon basket
      { when: { type: 'catArrive', id: 'rim' }, line: 'c5p2.clerk.1' },
      { when: { type: 'catArrive', id: 'rim' }, line: 'c5p2.clerk.2' },
      { when: { type: 'catArrive', id: 'rim' }, line: 'c5p2.clerk.3' },
    ],
  },
});
