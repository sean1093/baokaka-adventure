import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 3-1 「綠線」 (a 松山新店線 car pulling in at 公館) · difficulty 2 · par 2. Chapter 3's
 * ride page: a warm-up that reviews 掰掰 and 嗶！ (GDD § 4.2 page 1). The bead lies on the platform
 * past the car's shut doors, but a backpacker dozes against his huge backpack across the aisle:
 * Baokaka crawls up to it and reaches. 掰掰: he wakes, waves back, sits up on a seat and asks
 * — 「Excuse me… where is 101?」 (his second time, § 5.3), and Mocha translates. Baokaka crawls on to
 * the doors and reaches again; his 嗶！ opens them (they stay open). The 淘氣: 掰掰 to the ad poster
 * on the platform wall — the poster person waves back. It is out of reach until the backpacker
 * has gone, so the solution's 掰掰 never earns it.
 *
 * ```
 *   strap (Mocha)                            poster (waves back to 掰掰)
 *   C1 ── C2 ── aisle ── C3 ── door ── P1 ── P2 (bead)
 *              (backpacker)  (gate: 嗶！)
 * ```
 */
export default definePage({
  id: 'c3p1', chapter: 3, index: 1, title: '綠線', difficulty: 2, backdrop: 'c3/green-car',
  nodes: [
    // The car (left) and its doorway
    { id: 'C1', x: 32, y: 470, height: 0 }, { id: 'C2', x: 86, y: 470, height: 0 },
    { id: 'aisle', x: 140, y: 470, height: 0 },     // where the backpacker dozes against his backpack
    { id: 'C3', x: 194, y: 470, height: 0 },
    { id: 'door', x: 250, y: 470, height: 0, attach: { part: 'doors', pos: { closed: [250, 470], open: [250, 470] } } },
    // The platform (right)
    { id: 'P1', x: 306, y: 470, height: 0 }, { id: 'P2', x: 360, y: 470, height: 0 },
    { id: 'packSeat', x: 158, y: 420, height: 0 },  // unconnected: he sits up on a seat, his backpack on his lap
    { id: 'poster', x: 300, y: 362, height: 1 },    // unconnected: the ad poster on the platform wall
    // Mocha's perch: a hand strap
    { id: 'strapTop', x: 96, y: 226, height: 2 },
  ],
  edges: [
    { a: 'C1', b: 'C2', kind: 'crawl' }, { a: 'C2', b: 'aisle', kind: 'crawl' }, { a: 'aisle', b: 'C3', kind: 'crawl' },
    { a: 'C3', b: 'door', kind: 'crawl' }, { a: 'door', b: 'P1', kind: 'crawl' }, { a: 'P1', b: 'P2', kind: 'crawl' },
  ],
  parts: [
    // The car's doors: 嗶！ opens them, and they stay open
    { id: 'doors', preset: 'gate', hit: { x: 222, y: 372, w: 56, h: 116 }, react: [{ on: { type: 'beep', within: 120 }, to: 'open' }], art: 'c3/doors' },
  ],
  perches: [{ id: 'strap', node: 'strapTop', reachNode: 'C2' }],
  creatures: [
    // 1-1's backpacker again, dozing against his backpack across the aisle; 掰掰 wakes him and he sits up
    { id: 'backpacker', positions: { sleep: 'aisle', tucked: 'packSeat' }, initial: 'sleep',
      react: [{ on: 'wave', to: 'tucked' }], art: 'c1/backpacker' },
    // The poster person on the platform's ad: waves back to 掰掰 (and stops at the next)
    { id: 'poster', positions: { still: 'poster', waving: 'poster' }, initial: 'still', blocks: false,
      react: [{ on: 'wave', when: { creature: 'poster', at: 'still' }, to: 'waving' }, { on: 'wave', to: 'still' }], art: 'c3/poster' },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'P2', goal: true }],
  baby: { start: 'C1', facing: 'r' },
  mocha: { start: 'strap' },
  mischief: { text: '對廣告看板說「掰掰」', when: { type: 'wave', when: { creature: 'poster', at: 'waving' } } },
  // On the 公館 station sign, seen once the doors slide open
  tudigong: { x: 336, y: 296, visibleWhen: { part: 'doors', in: ['open'] }, hat: '藍色校工帽' },
  solution: [{ wait: 'settle' }, { say: 'bye' }, { wait: 'settle' }, { say: 'beep' }, { wait: 'goal' }],
  lines: {
    // 廣播姊姊's next ride line (§ 5.3, cycling on from 2-1's)
    intro: ['rec.pa.ride.1'],
    // The backpacker sits up: his question, and Mocha's translation (§ 5.3, 3-1)
    onEvent: [
      { when: { type: 'wave', when: { creature: 'backpacker', at: 'tucked' } }, line: 'c3p1.pack.1' },
      { when: { type: 'wave', when: { creature: 'backpacker', at: 'tucked' } }, line: 'c3p1.pack.2' },
    ],
  },
});
