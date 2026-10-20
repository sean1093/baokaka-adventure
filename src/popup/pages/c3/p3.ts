import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 3-3 「醉月湖」 · difficulty 2 · par 2 · **learn 不要！**. The moon's reflection on the
 * lake is a **decoy**: a shiny he can never reach, so he crawls to the water's edge and reaches for
 * it forever. A goose sits on her nest by the path — on the bead. Send Mocha to the rock beside the
 * nest: the goose rears up and honks at him 「嘎！不要過來！」, and Baokaka copies her — 「不要！」 —
 * and Mocha translates (`learns`: 不要！, the § 5.4 learn beat and word card). Say 不要！ to the moon:
 * he gives it up and crawls toward Mocha, and as he passes the nest the goose charges off after
 * Mocha, uncovering the bead right beside him. The 淘氣: let the goose honk at Mocha twice.
 *
 * ```
 *   bench (Mocha) ─jump─ rock (by the nest: the goose honks)
 *   L1 ── L2 ── L3 ── L4
 *   (moon, in the lake)  └── nest (goose, on the bead)
 * ```
 */
export default definePage({
  id: 'c3p3', chapter: 3, index: 3, title: '醉月湖', difficulty: 2, backdrop: 'c3/lake',
  nodes: [
    { id: 'L1', x: 36, y: 462, height: 0 }, { id: 'L2', x: 110, y: 462, height: 0 },
    { id: 'L3', x: 196, y: 462, height: 0 }, { id: 'L4', x: 280, y: 462, height: 0 },
    { id: 'nest', x: 240, y: 510, height: 0 },     // the goose's nest by the path, where the bead is
    { id: 'lake', x: 130, y: 534, height: 0 },     // unconnected: the moon's reflection on the water
    { id: 'shore', x: 350, y: 452, height: 0 },    // unconnected: the goose chases Mocha to the rock's foot
    // Mocha's perches: the lakeside bench, the rock by the nest
    { id: 'benchTop', x: 60, y: 370, height: 1 }, { id: 'rockTop', x: 330, y: 376, height: 1 },
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' }, { a: 'L2', b: 'L3', kind: 'crawl' }, { a: 'L3', b: 'L4', kind: 'crawl' },
    { a: 'L3', b: 'nest', kind: 'crawl' },
    { a: 'benchTop', b: 'rockTop', kind: 'jump' },
  ],
  parts: [],
  perches: [
    { id: 'bench', node: 'benchTop', reachNode: 'L1' },
    { id: 'rock', node: 'rockTop', reachNode: 'L4' },
  ],
  creatures: [
    {
      id: 'goose', positions: { nest: 'nest', honk: 'nest', chase: 'shore' }, initial: 'nest',
      react: [
        // Mocha on the rock beside her nest: she rears up and honks 「嘎！不要過來！」
        { on: { type: 'catArrive', id: 'rock' }, when: { creature: 'goose', at: 'nest' }, to: 'honk' },
        { on: { type: 'catLeave', id: 'rock' }, when: { creature: 'goose', at: 'honk' }, to: 'nest' },
        // Baokaka crawls past her nest: she charges off after Mocha, and the bead is out
        { on: { type: 'babyEnter', id: 'L3' }, when: { not: { creature: 'goose', at: 'chase' } }, to: 'chase' },
      ],
      art: 'c3/goose',
    },
  ],
  attractors: [
    { id: 'moon', kind: 'shiny', node: 'lake', decoy: true, art: 'c3/moon' },
    { id: 'bead', kind: 'shiny', node: 'nest', goal: true, visibleWhen: { creature: 'goose', at: 'chase' } },
  ],
  baby: { start: 'L1', facing: 'r' },
  mocha: { start: 'bench' },
  learns: { word: 'no', when: { creature: 'goose', at: 'honk' } },
  mischief: { text: '讓鵝對摩卡嘎嘎叫兩次', when: { type: 'catArrive', id: 'rock', count: 2, when: { creature: 'goose', at: 'honk' } } },
  // Among the reeds by the nest, peeking while the goose honks
  tudigong: { x: 196, y: 386, visibleWhen: { creature: 'goose', at: 'honk' }, hat: '藍色校工帽' },
  solution: [{ mocha: 'rock' }, { wait: 'settle' }, { say: 'no' }, { wait: 'goal' }],
});
