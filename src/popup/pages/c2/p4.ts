import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 2-4 「松鼠的樹」 · difficulty 3 · par 3. A squirrel holds the bead (`heldBy`) up on
 * the tree's east branch, and Baokaka follows it round the roots, reaching. It flees from Mocha to
 * the branch farthest from him: Mocha on the east fork sends it to the west branch, Mocha on the
 * west fork sends it down to the low branch over the roots, right by Baokaka. There 掰掰 makes it
 * wave back and drop the bead (`drop`), and he grabs it. Whenever Mocha settles anywhere else while
 * it sits low, it dashes back up to the east branch. → *Herd, then wave.*
 * The 淘氣: herd it all the way round three times (three laps round the trunk).
 *
 * ```
 *              westBranch ←(Mocha on eastFork)── eastBranch (start, holding the bead)
 *   stump ─jump─ westFork ─jump─ eastFork
 *   G1 ── G2 ── G3 ── G4 ── roots (the low branch: Mocha on westFork sends it here)
 * ```
 */
export default definePage({
  id: 'c2p4', chapter: 2, index: 4, title: '松鼠的樹', difficulty: 3, backdrop: 'c2/tree',
  nodes: [
    { id: 'G1', x: 36, y: 484, height: 0 }, { id: 'G2', x: 104, y: 484, height: 0 },
    { id: 'G3', x: 172, y: 484, height: 0 }, { id: 'G4', x: 240, y: 484, height: 0 },
    // The low branch bends down over the roots: the squirrel sits here when herded, the bead falls here
    { id: 'roots', x: 308, y: 484, height: 0 },
    // The squirrel's high branches (unconnected)
    { id: 'westBranch', x: 96, y: 214, height: 2 }, { id: 'eastBranch', x: 318, y: 188, height: 2 },
    // Mocha's perches: the stump, the trunk's west and east forks
    { id: 'stumpTop', x: 40, y: 392, height: 1 }, { id: 'westForkTop', x: 162, y: 270, height: 2 },
    { id: 'eastForkTop', x: 248, y: 250, height: 2 },
  ],
  edges: [
    { a: 'G1', b: 'G2', kind: 'crawl' }, { a: 'G2', b: 'G3', kind: 'crawl' }, { a: 'G3', b: 'G4', kind: 'crawl' },
    { a: 'G4', b: 'roots', kind: 'crawl' },
    { a: 'stumpTop', b: 'westForkTop', kind: 'jump' }, { a: 'westForkTop', b: 'eastForkTop', kind: 'jump' },
  ],
  parts: [],
  perches: [
    { id: 'stump', node: 'stumpTop', reachNode: 'G1' },
    { id: 'westFork', node: 'westForkTop', reachNode: 'G2' },
    { id: 'eastFork', node: 'eastForkTop', reachNode: 'G4' },
  ],
  creatures: [
    {
      id: 'squirrel', positions: { east: 'eastBranch', west: 'westBranch', low: 'roots', away: 'offpage' }, initial: 'east',
      react: [
        // It flees to the branch farthest from Mocha, but only when he lands next to it
        { on: { type: 'catArrive', id: 'eastFork' }, when: { creature: 'squirrel', at: 'east' }, to: 'west' },
        { on: { type: 'catArrive', id: 'westFork' }, when: { creature: 'squirrel', at: 'west' }, to: 'low' },
        // Down low, it bolts back up the moment Mocha settles anywhere
        { on: 'catArrive', when: { creature: 'squirrel', at: 'low' }, to: 'east' },
        // 掰掰 within reach: it waves back, drops the bead and scampers off
        { on: 'wave', when: { creature: 'squirrel', at: 'low' }, to: 'away', drop: 'bead' },
      ],
      art: 'c2/squirrel',
    },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'eastBranch', goal: true, heldBy: 'squirrel' }],
  baby: { start: 'G1', facing: 'r' },
  mocha: { start: 'stump' },
  mischief: { text: '讓松鼠繞著樹幹跑三圈', when: { type: 'catArrive', id: 'westFork', count: 3, when: { creature: 'squirrel', at: 'low' } } },
  // In a knot-hole of the trunk, peeking out while the squirrel is away on the west branch
  tudigong: { x: 226, y: 340, visibleWhen: { creature: 'squirrel', at: 'west' }, hat: '斗笠' },
  solution: [{ mocha: 'eastFork' }, { wait: 'settle' }, { mocha: 'westFork' }, { wait: 'settle' }, { say: 'bye' }, { wait: 'goal' }],
});
