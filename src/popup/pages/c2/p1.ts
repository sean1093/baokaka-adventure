import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 2-1 「信義線」 (a 信義線 car pulling in at 大安森林公園) · difficulty 2 · par 2.
 * Chapter 2's ride page: a warm-up that reviews 嗶！ and Mocha's push (GDD § 4.2 page 1). The car's
 * doors are shut 「車門即將關閉。」 and between the car and the platform yawns the gap; the bead lies
 * at the far end of the platform. Baokaka crawls to the doors and reaches. His 嗶！ opens them (they
 * stay open); Mocha squeezes out through the open window to the bench where a commuter sleeps, and
 * knocks his long umbrella over: it lands across the gap (`landed: umbrella` makes the edge), a
 * bridge. The two moves work in either order. The 淘氣: Mocha sits on the 博愛座 and 廣播姊姊
 * says 「請讓座。……貓也算嗎？」 (§ 5.3).
 *
 * ```
 *   strap ─jump─ priority (博愛座)       bench (push: umbrella)
 *     └──────────── squeeze ─────────────┘
 *   C1 ── C2 ── door ══(umbrella landed)══ P1 ── P2 (bead)
 *               (gate: 嗶！)
 * ```
 */
export default definePage({
  id: 'c2p1', chapter: 2, index: 1, title: '信義線', difficulty: 2, backdrop: 'c2/xinyi-car',
  nodes: [
    // The car (left) and its doorway
    { id: 'C1', x: 40, y: 470, height: 0 }, { id: 'C2', x: 100, y: 470, height: 0 },
    { id: 'door', x: 160, y: 470, height: 0, attach: { part: 'doors', pos: { closed: [160, 470], open: [160, 470] } } },
    // The platform (right), past the gap
    { id: 'P1', x: 252, y: 470, height: 0 }, { id: 'P2', x: 336, y: 470, height: 0 },
    { id: 'gap', x: 206, y: 482, height: 0 },        // unconnected: where the umbrella lands across the gap
    { id: 'benchSeat', x: 300, y: 428, height: 0 },  // unconnected: the sleeping commuter on the platform bench
    // Mocha's perches: a hand strap, the 博愛座 under it, the platform bench's back
    { id: 'strapTop', x: 96, y: 226, height: 2 }, { id: 'seatTop', x: 48, y: 392, height: 1 },
    { id: 'benchTop', x: 272, y: 372, height: 1 },
  ],
  edges: [
    { a: 'C1', b: 'C2', kind: 'crawl' }, { a: 'C2', b: 'door', kind: 'crawl' },
    { a: 'door', b: 'P1', kind: 'crawl', when: { landed: 'umbrella' } }, { a: 'P1', b: 'P2', kind: 'crawl' },
    { a: 'strapTop', b: 'seatTop', kind: 'jump' },
    // Out through the car's open window (C2: cats squeeze through gaps)
    { a: 'strapTop', b: 'benchTop', kind: 'squeeze' },
  ],
  parts: [
    // The car's doors: 嗶！ opens them, and they stay open
    { id: 'doors', preset: 'gate', hit: { x: 132, y: 372, w: 56, h: 116 }, react: [{ on: { type: 'beep', within: 120 }, to: 'open' }], art: 'c2/doors' },
    // The commuter's long umbrella, leaning on the bench by the platform edge (C3)
    { id: 'umbrella', preset: 'pushable', hit: { x: 212, y: 372, w: 56, h: 72 }, art: 'c2/umbrella',
      fall: { path: [[240, 380], [226, 440], [206, 482]], fallTo: 'gap' } },
  ],
  perches: [
    { id: 'strap', node: 'strapTop', reachNode: 'C2' },
    { id: 'priority', node: 'seatTop', reachNode: 'C1' },
    { id: 'bench', node: 'benchTop', reachNode: 'P1', push: 'umbrella' },
  ],
  creatures: [
    // Asleep on the bench, his umbrella beside him; he sleeps through everything
    { id: 'commuter', positions: { sleep: 'benchSeat' }, initial: 'sleep', blocks: false, art: 'c2/commuter' },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'P2', goal: true }],
  baby: { start: 'C1', facing: 'r' },
  mocha: { start: 'strap' },
  mischief: { text: '讓摩卡坐博愛座', when: { type: 'catArrive', id: 'priority' } },
  // On the platform's poster, seen once the doors slide open
  tudigong: { x: 332, y: 300, visibleWhen: { part: 'doors', in: ['open'] }, hat: '斗笠' },
  solution: [{ wait: 'settle' }, { say: 'beep' }, { mocha: 'bench' }, { wait: 'goal' }],
  lines: {
    // 廣播姊姊's next ride line (§ 5.3, cycling on from 1-1's two): the doors are shut
    intro: ['rec.pa.ride.3'],
    onEvent: [{ when: { type: 'catArrive', id: 'priority' }, line: 'rec.pa.priority' }],
  },
});
