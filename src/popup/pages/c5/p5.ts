import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 5-5 「按摩椅」 (the night market's coin massage chairs) · difficulty 4 · par 4. The
 * bead sits on the top shelf over two coin massage chairs; he crawls to the foot of the chairs and
 * reaches up — right beside the sleepy 阿伯 who minds them (a `carrier`, #120). 抱抱 now and the
 * 阿伯 only snores: his way up isn't clear (*抱抱 a carrier only once its route is clear*). Mocha
 * knocks a coin off each chair's coin box into its slot: the chair hums and reclines (a **lift**),
 * its back a step. A stray dog naps on the second chair — 掰掰, and it pads off. Now 抱抱: the 阿伯
 * carries him up the reclined chairs, step by step, to the bead. The 淘氣: Mocha in the first
 * chair while it hums (a vibrating cat).
 *
 * ```
 *   sign (Mocha) ─jump─ box1 (pushes coin 1) ─jump─ box2 (pushes coin 2)        H (bead)
 *                         └─jump─ seat (in chair 1)              step2 (chair 2; the dog naps) ┘
 *                                                    step1 (chair 1) ┘
 *   F1 ── F2 ── F3 ── A0 (the 阿伯) ┘   阿伯: A0 → step1 → step2 → H (抱抱, once all are clear)
 * ```
 */
const FLAT = (chair: string) => ({ part: chair, in: ['flat'] });

export default definePage({
  id: 'c5p5', chapter: 5, index: 5, title: '按摩椅', difficulty: 4, backdrop: 'c5/massage-chairs',
  nodes: [
    { id: 'F1', x: 34, y: 486, height: 0 }, { id: 'F2', x: 96, y: 486, height: 0 },
    { id: 'F3', x: 158, y: 486, height: 0 },
    { id: 'A0', x: 220, y: 486, height: 0 },          // the foot of the chairs: the 阿伯 dozes here
    // The chairs' backs, steps once reclined (a grown-up's steps: he can't climb yet)
    { id: 'step1', x: 270, y: 444, height: 1, attach: { part: 'chair1', pos: { up: [262, 452], flat: [270, 430] } } },
    { id: 'step2', x: 318, y: 384, height: 1, attach: { part: 'chair2', pos: { up: [310, 400], flat: [318, 374] } } },
    // The top shelf over the chairs
    { id: 'H', x: 362, y: 316, height: 1 },
    // Unconnected: where the coins land (the slots), where the dog goes
    { id: 'slot1', x: 250, y: 410, height: 1 }, { id: 'slot2', x: 300, y: 350, height: 1 },
    { id: 'dogAway', x: 380, y: 520, height: 0 },
    // Mocha's perches: the shop's sign, each chair's coin box, the seat of chair 1
    { id: 'signTop', x: 60, y: 250, height: 2 }, { id: 'box1Top', x: 236, y: 330, height: 2 },
    { id: 'box2Top', x: 290, y: 270, height: 2 },
    { id: 'seatTop', x: 290, y: 460, height: 1, attach: { part: 'chair1', pos: { up: [282, 466], flat: [290, 452] } } },
  ],
  edges: [
    { a: 'F1', b: 'F2', kind: 'crawl' }, { a: 'F2', b: 'F3', kind: 'crawl' }, { a: 'F3', b: 'A0', kind: 'crawl' },
    { a: 'A0', b: 'step1', kind: 'climb', when: FLAT('chair1') },
    { a: 'step1', b: 'step2', kind: 'climb', when: { all: [FLAT('chair2'), { creature: 'dog', at: 'away' }] } },
    { a: 'step2', b: 'H', kind: 'climb', when: FLAT('chair2') },
    { a: 'signTop', b: 'box1Top', kind: 'jump' }, { a: 'box1Top', b: 'box2Top', kind: 'jump' },
    { a: 'box1Top', b: 'seatTop', kind: 'jump' },
  ],
  parts: [
    // The sleepy 阿伯: he carries him up the reclined chairs — once every step of the way is clear
    { id: 'abe', preset: 'carrier', route: ['A0', 'step1', 'step2', 'H'], hit: { x: 192, y: 380, w: 56, h: 106 }, art: 'c5/massage-abe' },
    // The two coin chairs: a coin in the slot and the chair hums and reclines
    { id: 'chair1', preset: 'lift', states: ['up', 'flat'], hit: { x: 240, y: 400, w: 64, h: 80 }, art: 'c5/massage-chair-1' },
    { id: 'chair2', preset: 'lift', states: ['up', 'flat'], hit: { x: 288, y: 340, w: 64, h: 80 }, art: 'c5/massage-chair-2' },
    // A coin on each chair's coin box: Mocha knocks it into the slot
    { id: 'coin1', preset: 'pushable', hit: { x: 212, y: 312, w: 56, h: 56 }, art: 'c5/coin',
      fall: { path: [[244, 360], [250, 410]], fallTo: 'slot1', landSets: { part: 'chair1', to: 'flat' } } },
    { id: 'coin2', preset: 'pushable', hit: { x: 266, y: 252, w: 56, h: 56 }, art: 'c5/coin',
      fall: { path: [[296, 300], [300, 350]], fallTo: 'slot2', landSets: { part: 'chair2', to: 'flat' } } },
  ],
  perches: [
    { id: 'sign', node: 'signTop', reachNode: 'F1' },
    { id: 'box1', node: 'box1Top', reachNode: 'A0', push: 'coin1' },
    { id: 'box2', node: 'box2Top', reachNode: 'A0', push: 'coin2' },
    { id: 'seat', node: 'seatTop', reachNode: 'A0' },
  ],
  creatures: [
    // A stray dog napping on the second chair's warm seat: 掰掰, and it pads off
    { id: 'dog', positions: { nap: 'step2', away: 'dogAway' }, initial: 'nap', blocks: false,
      react: [{ on: 'wave', when: { creature: 'dog', at: 'nap' }, to: 'away' }], art: 'c5/stray-dog' },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'H', goal: true }],
  baby: { start: 'F1', facing: 'r' },
  mocha: { start: 'sign' },
  mischief: { text: '讓摩卡坐上會震動的按摩椅', when: { type: 'catArrive', id: 'seat', when: FLAT('chair1') } },
  // A 土地公 figurine on the top shelf, seen once the second chair reclines
  tudigong: { x: 330, y: 290, visibleWhen: FLAT('chair2'), hat: '鴨舌帽' },
  solution: [
    { mocha: 'box1' }, { wait: 'settle' }, { mocha: 'box2' }, { wait: 'settle' }, { say: 'bye' }, { wait: 'settle' },
    { say: 'hug' }, { wait: 'goal' },
  ],
});
