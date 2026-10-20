import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 5-6 「蔥抓餅」 · difficulty 4 · par 4 · treasure 蔥: chapter 5's spread (§ 2.9). A
 * 蔥抓餅 stall: the lane in front (left page), the counter and the stall behind it, upstage (right
 * page). The big round griddle on the counter shines — a **decoy**: he crawls under its end of the
 * counter and reaches up. The 蔥 sits on a tall stack of trays at the back of the stall, so high
 * nobody can see it; Mocha's weight on the stack sinks it (a **counterweight lift**). The vendor
 * stands behind the counter at the griddle's other end.
 *
 * Send Mocha up onto the stall's sign over the vendor, and say 不要！ to the griddle: he crawls
 * along the counter toward Mocha and reaches up — right in front of the vendor. 抱抱: she leans over
 * and lifts him across the counter (a `carrier`, #120), and sets him down inside. He still wants
 * Mocha, up on the sign. Mocha jumps onto the tray stack: it sinks under him (*Mocha is a weight*),
 * and there on the bottom tray is the 蔥 — he crawls to it. **Photo moment** (Mocha on the trays,
 * inside `photoRect`, +M). The 淘氣: tap the pancake on the griddle three times — she flips it.
 *
 * ```
 *              griddle (decoy, on the counter)   sign (Mocha, over the vendor)     trays (Mocha: down)
 *   lantern (Mocha) ─jump─ sign ─jump─ trays
 *                     V (vendor) ── S1 ── S2 ══(trays down)══ T (蔥, seen from inside once it's down)
 *   F1 ── F2 ── F3 ── F4 ┘ (over the counter: she lifts him)
 * ```
 */
const INSIDE = { any: [{ babyAt: 'V' }, { babyAt: 'S1' }, { babyAt: 'S2' }, { babyAt: 'S3' }, { babyAt: 'T' }] };
const TRAYS_DOWN = { part: 'trays', in: ['down'] };

export default definePage({
  id: 'c5p6', chapter: 5, index: 6, title: '蔥抓餅', difficulty: 4, backdrop: 'c5/scallion-spread',
  spread: true,
  // The back of the stall: the tray stack, Mocha on it, the 蔥
  photoRect: { x: 196, y: 220, w: 194, h: 300 },
  nodes: [
    // The lane in front of the counter
    { id: 'F1', x: 30, y: 500, height: 0 }, { id: 'F2', x: 92, y: 500, height: 0 },
    { id: 'F3', x: 154, y: 500, height: 0 }, { id: 'F4', x: 216, y: 500, height: 0 },
    { id: 'F5', x: 290, y: 500, height: 0 },
    // Inside the stall, upstage behind the counter: where the vendor stands (left), the trays (right)
    { id: 'V', x: 64, y: 392, height: 0 }, { id: 'S1', x: 138, y: 392, height: 0 },
    { id: 'S2', x: 212, y: 392, height: 0 }, { id: 'S3', x: 286, y: 392, height: 0 },
    { id: 'T', x: 356, y: 392, height: 0, attach: { part: 'trays', pos: { up: [356, 236], down: [356, 392] } } },
    { id: 'griddleTop', x: 240, y: 410, height: 2 }, // unconnected: the griddle on the counter
    { id: 'signFoot', x: 44, y: 330, height: 1 },   // unconnected: under the sign, behind the counter
    { id: 'lanternFoot', x: 160, y: 330, height: 1 },// unconnected: under the lantern, on the counter
    // Mocha's perches: a lantern over the lane, the stall's sign, the top of the tray stack
    { id: 'lanternTop', x: 160, y: 236, height: 2 }, { id: 'signTop', x: 54, y: 226, height: 2 },
    { id: 'traysTop', x: 346, y: 360, height: 1, attach: { part: 'trays', pos: { up: [346, 204], down: [346, 360] } } },
  ],
  edges: [
    { a: 'F1', b: 'F2', kind: 'crawl' }, { a: 'F2', b: 'F3', kind: 'crawl' }, { a: 'F3', b: 'F4', kind: 'crawl' },
    { a: 'F4', b: 'F5', kind: 'crawl' },
    // Over the counter: a grown-up's reach (the vendor lifts him across)
    { a: 'F1', b: 'V', kind: 'climb' },
    { a: 'V', b: 'S1', kind: 'crawl' }, { a: 'S1', b: 'S2', kind: 'crawl' }, { a: 'S2', b: 'S3', kind: 'crawl' },
    { a: 'S3', b: 'T', kind: 'crawl', when: TRAYS_DOWN },
    { a: 'lanternTop', b: 'signTop', kind: 'jump' }, { a: 'lanternTop', b: 'traysTop', kind: 'jump' },
    { a: 'signTop', b: 'traysTop', kind: 'jump' },
  ],
  parts: [
    // The vendor: she lifts him over the counter and puts him down inside the stall
    { id: 'vendor', preset: 'carrier', route: ['V', 'S1'], hit: { x: 36, y: 290, w: 56, h: 102 }, art: 'c5/scallion-vendor' },
    // The tray stack: so tall the 蔥 on it is out of sight; Mocha's weight sinks it
    { id: 'trays', preset: 'lift', states: ['up', 'down'], initial: 'up', counterweight: { on: 'down', off: 'up' },
      hit: { x: 332, y: 236, w: 56, h: 156 }, art: 'c5/tray-stack' },
    // The pancake on the griddle: a discovery (the 淘氣); tap it and the vendor flips it
    { id: 'pancake', preset: 'prop', states: ['up', 'flipped'], hit: { x: 196, y: 404, w: 56, h: 56 }, art: 'c5/pancake' },
  ],
  perches: [
    { id: 'lantern', node: 'lanternTop', reachNode: 'lanternFoot' },
    // Over the vendor: from the lane he gets as near as F4, from inside as near as V, and reaches up
    { id: 'sign', node: 'signTop', reachNode: 'signFoot' },
    // On the tray stack: his weight sinks it (C4)
    { id: 'trays', node: 'traysTop', reachNode: 'T', onPart: 'trays' },
  ],
  creatures: [],
  attractors: [
    // The griddle shines on the counter (never grabbable: it's hot)
    { id: 'griddle', kind: 'shiny', node: 'griddleTop', decoy: true, art: 'c5/griddle' },
    // The 蔥, on the bottom tray: seen from inside the stall once the stack is down
    { id: 'scallion', kind: 'shiny', node: 'T', goal: true, visibleWhen: { all: [TRAYS_DOWN, INSIDE] } },
  ],
  baby: { start: 'F3', facing: 'l' },
  mocha: { start: 'lantern' },
  mischief: { text: '讓阿姨把蔥抓餅翻三次', when: { type: 'partEnter', id: 'pancake', count: 3 } },
  // Printed on the stall's paper bags, seen once the tray stack is down
  tudigong: { x: 300, y: 340, visibleWhen: TRAYS_DOWN, hat: '鴨舌帽' },
  solution: [
    { mocha: 'sign' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'settle' },
    { mocha: 'trays' }, { wait: 'goal' },
  ],
  lines: {
    onEvent: [
      // She lifts him over the counter (§ 5.2 5-6)
      { when: { type: 'partEnter', id: 'vendor', when: { part: 'vendor', in: ['carrying@0'] } }, line: 'c5p6.vendor.1' },
      { when: { type: 'partEnter', id: 'vendor', when: { part: 'vendor', in: ['carrying@0'] } }, line: 'c5p6.vendor.2' },
    ],
  },
});
