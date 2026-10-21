import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 9-3 「渡輪」 (the 淡水 ferry at its pier) · difficulty 2 · par 2 · **learn 扶著站**.
 * The pier's boarding gate (嗶！: an 悠遊卡 reader, as in 1-3), then the ferry's open deck along its
 * railing. Half way along, a coil of mooring rope fills the deck: the only way past is the narrow strip
 * by the railing, standing and holding on (a `cruise` edge). At the stern, a high bench with the bead
 * on it: no step up (only a cat's hop joins it to the deck), but standing beside it he can reach it
 * (`reachHigh`, height 1).
 *
 * The bead glints on the bench from the start: he crawls to the gate and reaches. 嗶！: the gate
 * opens; he crawls aboard as far as the rope and reaches up and over it. Mocha onto the railing above
 * him: reaching for Mocha he grabs the rail and **stands** (the § 5.4 beat: a star bubble, Mocha 「站、
 * 站起來了！……我沒有哭。」, the card 「扶著站：搆到高的地方」; `learns: { growth: 2 }` when he is at the
 * rope with Mocha on the rail). Holding the rail he sidesteps past the rope, and at the stern he
 * reaches up and takes the bead off the bench. The 淘氣: Mocha on the ferry's horn (it honks).
 *
 * ```
 *   booth (Mocha, the pier's ticket booth) ─jump─ rail (Mocha, over the rope) ─jump─ horn (Mocha: honk!)
 *   P1 (start) ── P2 ── G (gate: 嗶！) ── D1 ── D2 (the rope: learn 扶著站) ═cruise═ D3 ·jump· bench (bead, height 1: reachHigh)
 * ```
 */
export default definePage({
  id: 'c9p3', chapter: 9, index: 3, title: '渡輪', difficulty: 2, backdrop: 'c9/ferry',
  nodes: [
    // The pier, the boarding gate, the ferry's deck
    { id: 'P1', x: 36, y: 476, height: 0 }, { id: 'P2', x: 90, y: 476, height: 0 },
    { id: 'G', x: 144, y: 476, height: 0, attach: { part: 'gate', pos: { closed: [144, 476], open: [144, 476] } } },
    { id: 'D1', x: 198, y: 476, height: 0 }, { id: 'D2', x: 250, y: 476, height: 0 },
    { id: 'D3', x: 316, y: 476, height: 0 },
    // The high bench at the stern: a cat's hop from the deck, the bead within a standing reach
    { id: 'bench', x: 364, y: 432, height: 1 },
    // Mocha's perches: the pier's ticket booth, the railing over the rope, the ferry's horn on the cabin
    { id: 'boothTop', x: 44, y: 384, height: 2 }, { id: 'railTop', x: 258, y: 404, height: 2 },
    { id: 'hornTop', x: 214, y: 330, height: 2 },
  ],
  edges: [
    { a: 'P1', b: 'P2', kind: 'crawl' }, { a: 'P2', b: 'G', kind: 'crawl' }, { a: 'G', b: 'D1', kind: 'crawl' },
    { a: 'D1', b: 'D2', kind: 'crawl' },
    // Past the coil of rope: only along the railing, standing
    { a: 'D2', b: 'D3', kind: 'cruise' },
    // The high bench: a cat's hop (so standing beside it, he can reach it)
    { a: 'D3', b: 'bench', kind: 'jump' },
    { a: 'boothTop', b: 'railTop', kind: 'jump' }, { a: 'railTop', b: 'hornTop', kind: 'jump' },
  ],
  parts: [
    // The pier's boarding gate: 嗶！ opens it, and it stays open
    { id: 'gate', preset: 'gate', hit: { x: 116, y: 380, w: 56, h: 96 }, react: [{ on: { type: 'beep', within: 120 }, to: 'open' }], art: 'c9/ferry-gate' },
    // The ferry's horn on the cabin roof: Mocha's weight honks it (the 淘氣)
    { id: 'horn', preset: 'button', hit: { x: 186, y: 302, w: 56, h: 56 }, art: 'c9/ferry-horn' },
  ],
  perches: [
    { id: 'booth', node: 'boothTop', reachNode: 'P1' },
    // On the railing right over the rope: reaching up to him, he pulls himself up
    { id: 'rail', node: 'railTop', reachNode: 'D2' },
    { id: 'horn', node: 'hornTop', onPart: 'horn' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'bench', height: 1, goal: true }],
  baby: { start: 'P1', facing: 'r' },
  mocha: { start: 'booth' },
  // Reaching for Mocha on the railing over him, he grabs it and stands (GDD § 4.4 9-3, a story beat)
  learns: { growth: 2, when: { all: [{ babyAt: 'D2' }, { mochaAt: 'rail' }] } },
  mischief: { text: '讓摩卡坐在汽笛上', when: { type: 'partEnter', id: 'horn', when: { mochaAt: 'horn' } } },
  // On the ferry's flagpole at the bow, seen once Mocha is on the railing
  tudigong: { x: 330, y: 330, visibleWhen: { mochaAt: 'rail' }, hat: '船長帽' },
  solution: [{ wait: 'settle' }, { say: 'beep' }, { mocha: 'rail' }, { wait: 'goal' }],
  lines: {
    // Mocha on the horn: it honks
    onEvent: [{ when: { type: 'partEnter', id: 'horn', when: { mochaAt: 'horn' } }, line: 'c9p3.horn.1' }],
  },
});
