import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 4-5 「街頭藝人」 · difficulty 4 · par 4. A street dance crew fills the middle of the
 * pedestrian street; past them a busker sits on his upturned hat — the bead is in it. On top of a
 * speaker stack, out of reach, sits a boombox. Baokaka is cuddling Mocha on the street lamp, too
 * far off for his 哇！ to reach it.
 *
 * Bring him closer: Mocha onto the amp crate by the stack. Now 哇！: the boombox starts playing (and
 * keeps playing), the dancers freeze into an arch over the street — the way is open — but the
 * boombox flashes and thumps, a **decoy**: he sits at the stack's foot reaching up for it, and
 * Mocha can't compete. Mocha hops over the dancers' arch to the bus-stop sign beyond; then 不要！ the
 * music: he wants Mocha, crawls under the arch, and as he reaches the busker the busker stands and
 * bows — the bead is in the hat. *Create a desire, then refuse it.* The 淘氣: Mocha in
 * the middle of the dancers' pose.
 *
 * ```
 *                  boombox (decoy, on the stack)     archMid (on the frozen dancers)
 *   lamp (Mocha) ─jump─ crate ─jump (arch)─ archMid ─jump (arch)─ sign
 *   S1 ── S2 ── M (dancers) ── E1 ── E2 (busker on his hat: the bead)
 * ```
 */
export default definePage({
  id: 'c4p5', chapter: 4, index: 5, title: '街頭藝人', difficulty: 4, backdrop: 'c4/street-dance',
  nodes: [
    { id: 'S1', x: 34, y: 484, height: 0 }, { id: 'S2', x: 110, y: 484, height: 0 },
    { id: 'M', x: 196, y: 484, height: 0 },            // where the dancers dance
    { id: 'E1', x: 278, y: 484, height: 0 },
    { id: 'E2', x: 352, y: 484, height: 0 },           // the busker's hat
    { id: 'stackTop', x: 130, y: 334, height: 2 },     // unconnected: the boombox on the speaker stack
    { id: 'arch', x: 196, y: 400, height: 1 },         // unconnected: the dancers, frozen into an arch
    { id: 'bowSpot', x: 330, y: 420, height: 1 },      // unconnected: the busker stands up to bow
    // Mocha's perches: the street lamp, the amp crate, the top of the arch, the bus-stop sign
    { id: 'lampTop', x: 30, y: 270, height: 2 }, { id: 'crateTop', x: 76, y: 396, height: 1 },
    { id: 'archTop', x: 196, y: 330, height: 2 }, { id: 'signTop', x: 300, y: 300, height: 2 },
  ],
  edges: [
    { a: 'S1', b: 'S2', kind: 'crawl' }, { a: 'S2', b: 'M', kind: 'crawl' }, { a: 'M', b: 'E1', kind: 'crawl' },
    { a: 'E1', b: 'E2', kind: 'crawl' },
    { a: 'lampTop', b: 'crateTop', kind: 'jump' },
    // Over the dancers, only while they hold the arch
    { a: 'crateTop', b: 'archTop', kind: 'jump', when: { creature: 'dancers', at: 'arch' } },
    { a: 'archTop', b: 'signTop', kind: 'jump', when: { creature: 'dancers', at: 'arch' } },
  ],
  parts: [
    // The boombox: 哇！ starts it (from S2, ≤ 160), and once it plays it keeps playing
    { id: 'boombox', preset: 'light', hit: { x: 102, y: 306, w: 56, h: 56 }, art: 'c4/boombox',
      react: [{ on: 'wow', to: 'on' }] },
  ],
  perches: [
    { id: 'lamp', node: 'lampTop', reachNode: 'S1' },
    { id: 'crate', node: 'crateTop', reachNode: 'S2' },
    { id: 'archMid', node: 'archTop', reachNode: 'M' },
    { id: 'sign', node: 'signTop', reachNode: 'E1' },
  ],
  creatures: [
    // The dance crew: the music freezes them into an arch, and they hold the pose
    { id: 'dancers', positions: { dance: 'M', arch: 'arch' }, initial: 'dance',
      react: [{ on: { type: 'partEnter', id: 'boombox', state: 'on' }, to: 'arch' }], art: 'c4/dancers' },
    // The busker on his upturned hat: he stands to bow when a baby comes to listen
    { id: 'busker', positions: { sit: 'E2', bow: 'bowSpot' }, initial: 'sit',
      react: [{ on: { type: 'babyEnter', id: 'E1' }, to: 'bow' }], art: 'c4/busker' },
  ],
  attractors: [
    // The playing boombox: flashing, thumping, and up on the stack where no baby can get it
    { id: 'music', kind: 'shiny', node: 'stackTop', decoy: true, visibleWhen: { part: 'boombox', in: ['on'] }, art: 'c4/boombox-shine' },
    { id: 'bead', kind: 'shiny', node: 'E2', goal: true, visibleWhen: { creature: 'busker', at: 'bow' } },
  ],
  baby: { start: 'S1', facing: 'r' },
  mocha: { start: 'lamp' },
  mischief: { text: '讓舞者擺好姿勢，摩卡站正中間', when: { type: 'catArrive', id: 'archMid' } },
  // In the crowd behind the dancers, seen once they hold their pose
  tudigong: { x: 240, y: 360, visibleWhen: { creature: 'dancers', at: 'arch' }, hat: '算命墨鏡' },
  solution: [{ mocha: 'crate' }, { wait: 'settle' }, { say: 'wow' }, { mocha: 'sign' }, { wait: 'settle' }, { say: 'no' }, { wait: 'goal' }],
});
