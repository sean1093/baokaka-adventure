import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 4-1 「板南線往西門」 (a 板南線 car pulling in at 西門) · difficulty 2 · par 3. Chapter 4's
 * ride page: a warm-up that reviews 不要！, Mocha's lure and 嗶！ (GDD § 4.2 page 1). A shiny ad screen
 * plays over the seats — a **decoy**: he crawls under it and reaches up for it forever. The bead
 * waits on the platform, out of sight until the doors open. Send Mocha up onto the door's header,
 * then say 不要！ to the screen: he wants Mocha, crawls as near as he can (the shut doors) and reaches
 * up. From there his 嗶！ opens the doors (they stay open), and the bead outshines everything. The
 * 淘氣: 不要！ to the screen, then to Mocha too — he has nothing left to want and bursts into tears.
 *
 * ```
 *   ad screen (decoy)        strap (Mocha)          header (above the doors)
 *   C1 ── C2 ── C3 ── C4 ── door ── P1 ── P2 (bead, seen once the doors open)
 *                          (gate: 嗶！)
 * ```
 */
export default definePage({
  id: 'c4p1', chapter: 4, index: 1, title: '板南線往西門', difficulty: 2, backdrop: 'c4/blue-car',
  nodes: [
    // The car (left) and its doorway
    { id: 'C1', x: 32, y: 470, height: 0 },           // right under the ad screen
    { id: 'C2', x: 86, y: 470, height: 0 }, { id: 'C3', x: 140, y: 470, height: 0 },
    { id: 'C4', x: 194, y: 470, height: 0 },
    { id: 'door', x: 250, y: 470, height: 0, attach: { part: 'doors', pos: { closed: [250, 470], open: [250, 470] } } },
    // The platform (right)
    { id: 'P1', x: 306, y: 470, height: 0 }, { id: 'P2', x: 360, y: 470, height: 0 },
    { id: 'adScreen', x: 40, y: 286, height: 2 },     // unconnected: the ad screen over the seats
    // Mocha's perches: a hand strap, the header over the doors (the route map)
    { id: 'strapTop', x: 96, y: 226, height: 2 }, { id: 'headerTop', x: 250, y: 330, height: 2 },
  ],
  edges: [
    { a: 'C1', b: 'C2', kind: 'crawl' }, { a: 'C2', b: 'C3', kind: 'crawl' }, { a: 'C3', b: 'C4', kind: 'crawl' },
    { a: 'C4', b: 'door', kind: 'crawl' }, { a: 'door', b: 'P1', kind: 'crawl' }, { a: 'P1', b: 'P2', kind: 'crawl' },
    { a: 'strapTop', b: 'headerTop', kind: 'jump' },
  ],
  parts: [
    // The car's doors: 嗶！ opens them, and they stay open. Only from C3 / C4 (≤ 120 units)
    { id: 'doors', preset: 'gate', hit: { x: 222, y: 372, w: 56, h: 116 }, react: [{ on: { type: 'beep', within: 120 }, to: 'open' }], art: 'c4/doors' },
  ],
  perches: [
    // A hand strap: under it he is out of his 嗶！'s reach of the doors
    { id: 'strap', node: 'strapTop', reachNode: 'C2' },
    // Over the doors: while they're shut he can only get as near as C4, and reaches up
    { id: 'header', node: 'headerTop', reachNode: 'door' },
  ],
  creatures: [],
  attractors: [
    // The ad screen: shiny, playing, and up where no baby can get it
    { id: 'ad', kind: 'shiny', node: 'adScreen', decoy: true, art: 'c4/ad-screen' },
    { id: 'bead', kind: 'shiny', node: 'P2', goal: true, visibleWhen: { part: 'doors', in: ['open'] } },
  ],
  baby: { start: 'C2', facing: 'l' },
  mocha: { start: 'strap' },
  // 不要！ to the screen, then to Mocha: nothing left to want, and the tears come
  mischief: { text: '一直說「不要！」，說到哇哇大哭', when: { type: 'cry' } },
  // On the 西門 station sign, seen once the doors slide open
  tudigong: { x: 336, y: 296, visibleWhen: { part: 'doors', in: ['open'] }, hat: '算命墨鏡' },
  solution: [{ mocha: 'header' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'beep' }, { wait: 'goal' }],
  lines: {
    // 廣播姊姊's next ride line (§ 5.3, cycling on from 3-1's)
    intro: ['rec.pa.ride.2'],
  },
});
