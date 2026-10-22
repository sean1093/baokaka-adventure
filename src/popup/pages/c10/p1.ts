import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 10-1 「信義線」 (the 月亮線 on the 信義線, 05:10) · difficulty 3 · par 4. The
 * chapter's ride page and a gentle medley of the words he knows: two cars of the 月亮線, the door
 * between them shut, a commuter asleep in the next car with his legs across the aisle, and a bunch of
 * birthday balloons — blown in from somewhere, 咻咻's — bobbing against the front window (a
 * **blowable**: `down` / `up`). Behind them, the window and the bead on its sill.
 *
 * He cuddles Mocha on the luggage rack over him. Mocha along the racks to the front of the train:
 * Baokaka sets off after him and stops at the door between the cars. 嗶！: it slides open. The
 * commuter's legs are in the way: 掰掰, and he waves back in his sleep and tucks them up on the seat.
 * At the front, under Mocha, he faces the window: 咻——, and the balloons float up to the ceiling —
 * 101 is in the window, lit at the top. 「ㄅㄚ！」 「對，101。咻咻在最上面。」 (§ 5.2 Ch10, the card's
 * last two lines). The bead glints on the sill and he reaches up for it (`reachHigh`). The 淘氣: say
 * 哇！ to 101 in the window.
 *
 * ```
 *   rack1 (Mocha) ──────────────────────────jump────────────────────────── rack2 (Mocha, the front)
 *                                        seat (the commuter, waved up)        [balloons: down / up; 咻—— from F4 or F5]
 *   F1 (start) ── F2 ── D (the door: 嗶！) ── F3 ── F4 (his legs: 掰掰) ── F5 ·jump· W (sill: bead, height 1)
 * ```
 */
const UP = { part: 'balloons', in: ['up'] };

export default definePage({
  id: 'c10p1', chapter: 10, index: 1, title: '信義線', difficulty: 3, backdrop: 'c10/xinyi-line',
  nodes: [
    // The two cars' floor, the door between them, the front window's sill
    { id: 'F1', x: 36, y: 486, height: 0 }, { id: 'F2', x: 90, y: 486, height: 0 },
    { id: 'D', x: 144, y: 486, height: 0, attach: { part: 'door', pos: { closed: [144, 486], open: [144, 486] } } },
    { id: 'F3', x: 198, y: 486, height: 0 }, { id: 'F4', x: 252, y: 486, height: 0 },
    { id: 'F5', x: 306, y: 486, height: 0 },
    { id: 'W', x: 362, y: 440, height: 1 },
    // Unconnected: the seat the commuter tucks himself onto
    { id: 'seat', x: 236, y: 432, height: 1 },
    // Mocha's perches: the luggage rack over the start, the rack at the front of the train
    { id: 'rack1Top', x: 44, y: 372, height: 2 }, { id: 'rack2Top', x: 300, y: 372, height: 2 },
  ],
  edges: [
    { a: 'F1', b: 'F2', kind: 'crawl' }, { a: 'F2', b: 'D', kind: 'crawl' }, { a: 'D', b: 'F3', kind: 'crawl' },
    { a: 'F3', b: 'F4', kind: 'crawl' }, { a: 'F4', b: 'F5', kind: 'crawl' },
    // The sill: a cat's hop (standing below it, he can reach the bead)
    { a: 'F5', b: 'W', kind: 'jump' },
    { a: 'rack1Top', b: 'rack2Top', kind: 'jump' },
  ],
  parts: [
    // The door between the cars: 嗶！ opens it, and it stays open
    { id: 'door', preset: 'gate', hit: { x: 116, y: 390, w: 56, h: 96 }, react: [{ on: { type: 'beep', within: 120 }, to: 'open' }], art: 'c10/car-door' },
    // The balloons against the front window: in his cone from F4 and F5 facing right (from F3 too far)
    { id: 'balloons', preset: 'blowable', states: ['down', 'up'], hit: { x: 328, y: 418, w: 56, h: 64 }, art: 'c10/balloons' },
  ],
  perches: [
    { id: 'rack1', node: 'rack1Top', reachNode: 'F1' },
    { id: 'rack2', node: 'rack2Top', reachNode: 'F5' },
  ],
  creatures: [
    // A commuter asleep with his legs across the aisle: 掰掰, he waves in his sleep and tucks them up
    { id: 'commuter', positions: { aisle: 'F4', seat: 'seat' }, initial: 'aisle',
      react: [{ on: { type: 'wave', within: 160 }, to: 'seat' }], art: 'c10/commuter' },
  ],
  // The bead on the front window's sill, behind the balloons
  attractors: [{ id: 'bead', kind: 'shiny', node: 'W', height: 1, goal: true, visibleWhen: UP }],
  baby: { start: 'F1', facing: 'r' },
  mocha: { start: 'rack1' },
  mischief: { text: '對著窗外的101說哇！', when: { type: 'wow', when: UP } },
  // Asleep on the seat beside the commuter, his 清潔帽 over his eyes, once the legs are tucked up
  tudigong: { x: 196, y: 410, visibleWhen: { creature: 'commuter', at: 'seat' }, hat: '清潔帽' },
  solution: [{ mocha: 'rack2' }, { wait: 'settle' }, { say: 'beep' }, { wait: 'settle' }, { say: 'bye' }, { wait: 'settle' }, { say: 'whoosh' }, { wait: 'goal' }],
  lines: {
    // 廣播姊姊's next ride line (§ 5.3, cycling on from 9-1's)
    intro: ['rec.pa.ride.2'],
    onEvent: [
      // 101 in the window: the chapter card's last two lines (§ 5.2 Ch10)
      { when: { type: 'partEnter', id: 'balloons', when: UP }, line: 'c10.intro.3' },
      { when: { type: 'partEnter', id: 'balloons', when: UP }, line: 'c10.intro.4' },
      { when: { type: 'wow', when: UP }, line: 'c10p1.mocha.1' },
    ],
  },
});
