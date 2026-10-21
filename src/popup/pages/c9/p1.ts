import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 9-1 「往淡水」 (the 淡水信義線 to the end of the line, above ground at dawn) ·
 * difficulty 3 · par 3. The chapter's ride page: past 圓山 the 月亮線 comes up out of the tunnel, and
 * the first violet light is behind the window blind. A bench at the near end of the car, a seat under
 * the window at the far end, each a 22-unit step up off the floor (climbs), and the window's sill a step
 * above the seat. The blind is down (a **blowable**: `closed` / `open`), and a row of sparrows that came
 * in through the open top of the window sleeps along the sill (`winged`).
 *
 * He cuddles Mocha on the luggage rack over the bench. Mocha onto the far rack, over the window seat:
 * Baokaka crawls along the car and climbs onto the seat, facing the window. 咻——: the blind flies up
 * on the dawn (the river, the 關渡 bridge) and the bead shines on the sill — but the sparrows sit on
 * it. 飛機！: they fly out of the window, and he climbs onto the sill to the bead. Said from the bench
 * (facing the other way) or from the middle of the car (too far), 咻—— doesn't reach the blind. The
 * 淘氣: blow the blind up and down five times.
 *
 * ```
 *   rack1 (Mocha, over the bench) ─────────────────jump───────────────── rack2 (Mocha, over the window seat)
 *                                                          [blind: closed / open; 咻—— from F4 or S2 facing right]
 *   S1 (bench) ═climb═ F1 (start) ── F2 ── F3 ── F4 ═climb═ S2 (seat) ═climb═ W (sill: bead, seen once the blind is up)
 *                                                                          sparrows on the sill (飛機！)
 * ```
 */
const OPEN = { part: 'blind', in: ['open'] };

export default definePage({
  id: 'c9p1', chapter: 9, index: 1, title: '往淡水', difficulty: 3, backdrop: 'c9/tamsui-line',
  nodes: [
    // The car, left to right: the bench, the floor, the seat under the window, the window's sill
    { id: 'S1', x: 32, y: 464, height: 1 }, { id: 'F1', x: 88, y: 486, height: 0 },
    { id: 'F2', x: 146, y: 486, height: 0 }, { id: 'F3', x: 204, y: 486, height: 0 },
    { id: 'F4', x: 262, y: 486, height: 0 }, { id: 'S2', x: 316, y: 464, height: 1 },
    { id: 'W', x: 362, y: 442, height: 1 },
    // Mocha's perches: the luggage rack over the bench, the rack over the window seat
    { id: 'rack1Top', x: 48, y: 384, height: 2 }, { id: 'rack2Top', x: 270, y: 384, height: 2 },
  ],
  edges: [
    { a: 'S1', b: 'F1', kind: 'climb' }, { a: 'F1', b: 'F2', kind: 'crawl' }, { a: 'F2', b: 'F3', kind: 'crawl' },
    { a: 'F3', b: 'F4', kind: 'crawl' }, { a: 'F4', b: 'S2', kind: 'climb' }, { a: 'S2', b: 'W', kind: 'climb' },
    { a: 'rack1Top', b: 'rack2Top', kind: 'jump' },
  ],
  parts: [
    // The window blind: in his cone from F4 and from the seat, facing right (from F3 it's too far)
    { id: 'blind', preset: 'blowable', states: ['closed', 'open'], hit: { x: 322, y: 396, w: 56, h: 72 }, art: 'c9/window-blind' },
  ],
  perches: [
    { id: 'rack1', node: 'rack1Top', reachNode: 'S1' },
    { id: 'rack2', node: 'rack2Top', reachNode: 'S2' },
  ],
  creatures: [
    // Sparrows asleep along the sill: 飛機！ and they fly out of the window (the next brings them back)
    { id: 'sparrows', positions: { sill: 'W', sky: 'offpage' }, initial: 'sill', winged: true, art: 'c9/sparrows' },
  ],
  // The bead on the sill, behind the blind
  attractors: [{ id: 'bead', kind: 'shiny', node: 'W', goal: true, visibleWhen: OPEN }],
  baby: { start: 'F1', facing: 'l' },
  mocha: { start: 'rack1' },
  mischief: { text: '把窗簾吹開又吹下五次', when: { type: 'partEnter', id: 'blind', count: 5 } },
  // Out of the window on the 關渡 bridge's red arch, seen once the blind is up
  tudigong: { x: 312, y: 330, visibleWhen: OPEN, hat: '船長帽' },
  solution: [{ mocha: 'rack2' }, { wait: 'settle' }, { say: 'whoosh' }, { say: 'plane' }, { wait: 'goal' }],
  lines: {
    // 廣播姊姊's next ride line (§ 5.3, cycling on from 8-1's)
    intro: ['rec.pa.ride.1'],
  },
});
