import { definePage } from '../define';

/**
 * The M2 engine's toy pages (#112; GDD § 7 M2 items 26–27): one small, complete page per new
 * behaviour, each solver-green exactly as a real page must be (`m2.test.ts`). They are the engine's
 * proofs, not chapter pages (#114, #116, #118 write those); PageLab lists them as lab stages
 * (`dev/labPages.ts`) with placeholder art.
 *
 * - `toy-spotlight` (after 2-2 露天音樂台): a spotlight **wheel** moves a light attractor
 *   (`nodeBy`). Light is a leash: aim it at the trap-door plate, his weight raises the curtain, and
 *   the bead behind it outranks the light.
 * - `toy-squirrel` (after 2-4 松鼠的樹): the squirrel holds the bead (`heldBy`) up on its branch.
 *   Mocha on the upper branch scares it down to the low branch (`fleesFromCat`), where it blocks
 *   the bead; 掰掰 makes it wave and run, dropping the bead (`drop`). Herd, then wave.
 * - `toy-moon` (after 3-3 醉月湖): the moon's reflection is a **decoy** he reaches for forever.
 *   Mocha on the rock makes the goose honk 「嘎！不要過來！」 and he learns 不要！; said to the moon,
 *   he turns to Mocha, and passing the goose sends it after Mocha, uncovering the bead.
 */

/** Light is a leash: steer him with the spotlight onto the plate that raises the curtain. */
export const toySpotlight = definePage({
  id: 'toy-spotlight', chapter: 2, index: 2, title: '聚光燈', difficulty: 1, backdrop: 'toy/stage',
  nodes: [
    { id: 'S1', x: 50, y: 430, height: 0 }, { id: 'S2', x: 130, y: 430, height: 0 },
    { id: 'S3', x: 210, y: 430, height: 0 }, { id: 'S4', x: 300, y: 430, height: 0 },
    // The trap-door plate, a step down from the stage in front of S2
    { id: 'T', x: 140, y: 500, height: 0, attach: { part: 'plate', pos: { up: [140, 500], down: [140, 500] } } },
    // Where the sweeper naps, up in the wings: the light can find him, Baokaka can't
    { id: 'wings', x: 330, y: 250, height: 1 },
  ],
  edges: [
    { a: 'S1', b: 'S2', kind: 'crawl' }, { a: 'S2', b: 'S3', kind: 'crawl' }, { a: 'S3', b: 'S4', kind: 'crawl' },
    { a: 'S2', b: 'T', kind: 'crawl' },
  ],
  parts: [
    { id: 'spot', preset: 'wheel', states: ['home', 'trap', 'stage', 'nap'], center: [345, 505], radius: 30,
      hit: { cx: 345, cy: 505, r: 30 }, art: 'toy/spotlight' },
    { id: 'plate', preset: 'button', hit: { x: 116, y: 486, w: 48, h: 28 }, art: 'toy/plate' },
    // The stage curtain rises on the plate's press (event-driven: no affordance, nothing to tap)
    { id: 'curtain', preset: 'lift', states: ['down', 'up'], hit: { x: 260, y: 300, w: 90, h: 150 },
      react: [{ on: { type: 'partEnter', id: 'plate', state: 'down' }, to: 'up' }], art: 'toy/curtain' },
  ],
  perches: [],
  creatures: [{ id: 'sweeper', positions: { nap: 'wings' }, initial: 'nap', blocks: false, art: 'toy/sweeper' }],
  attractors: [
    { id: 'glow', kind: 'light', node: 'S1', nodeBy: { part: 'spot', map: { home: 'S1', trap: 'T', stage: 'S3', nap: 'wings' } } },
    { id: 'bead', kind: 'shiny', node: 'S4', goal: true, visibleWhen: { part: 'curtain', in: ['up'] } },
  ],
  baby: { start: 'S1', facing: 'r' },
  mocha: { start: null },
  words: [],
  mischief: { text: '把聚光燈照在睡覺的掃地阿伯身上', when: { type: 'partEnter', id: 'spot', when: { part: 'spot', in: ['nap'] } } },
  tudigong: { x: 40, y: 300, visibleWhen: { part: 'spot', in: ['stage'] }, hat: '' },
  solution: [{ set: 'spot', to: 'trap' }, { wait: 'goal' }],
});

/** Herd, then wave: Mocha brings the squirrel down, 掰掰 makes it drop the bead. */
export const toySquirrel = definePage({
  id: 'toy-squirrel', chapter: 2, index: 4, title: '松鼠的樹', difficulty: 2, backdrop: 'toy/tree',
  nodes: [
    { id: 'G1', x: 40, y: 430, height: 0 }, { id: 'G2', x: 120, y: 430, height: 0 },
    { id: 'G3', x: 200, y: 430, height: 0 },
    // The low branch over the roots: the squirrel's spot when scared down, where the bead falls
    { id: 'low', x: 260, y: 430, height: 0 },
    // The high branch (the squirrel's home) and the stump and fork Mocha uses
    { id: 'high', x: 190, y: 180, height: 2 }, { id: 'stump', x: 70, y: 340, height: 1 },
    { id: 'fork', x: 330, y: 250, height: 2 },
  ],
  edges: [
    { a: 'G1', b: 'G2', kind: 'crawl' }, { a: 'G2', b: 'G3', kind: 'crawl' }, { a: 'G3', b: 'low', kind: 'crawl' },
    { a: 'stump', b: 'fork', kind: 'jump' },
  ],
  parts: [],
  perches: [
    { id: 'stump', node: 'stump', reachNode: 'G1' },
    { id: 'fork', node: 'fork', reachNode: 'G3' },
  ],
  creatures: [
    {
      id: 'squirrel', positions: { high: 'high', low: 'low', away: 'offpage' }, initial: 'high',
      fleesFromCat: { nearPerches: ['fork'], to: 'low' },
      react: [
        { on: 'wave', when: { creature: 'squirrel', at: 'low' }, to: 'away', drop: 'bead' },
        // Mocha back on the stump: the squirrel dashes up again (the 淘氣's laps)
        { on: { type: 'catArrive', id: 'stump' }, when: { creature: 'squirrel', at: 'low' }, to: 'high' },
      ],
      art: 'toy/squirrel',
    },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'high', goal: true, heldBy: 'squirrel' }],
  baby: { start: 'G1', facing: 'r' },
  mocha: { start: 'stump' },
  words: ['bye'],
  mischief: { text: '讓松鼠在樹上跑上跑下兩次', when: { type: 'catArrive', id: 'stump', count: 2, when: { creature: 'squirrel', at: 'high' } } },
  tudigong: { x: 50, y: 250, visibleWhen: { creature: 'squirrel', at: 'low' }, hat: '' },
  solution: [{ mocha: 'fork' }, { wait: 'settle' }, { say: 'bye' }, { wait: 'goal' }],
});

/** The moon is a decoy: learn 不要！ from the goose, refuse the moon, follow Mocha past the goose. */
export const toyMoon = definePage({
  id: 'toy-moon', chapter: 3, index: 3, title: '醉月湖', difficulty: 2, backdrop: 'toy/lake',
  nodes: [
    { id: 'L1', x: 40, y: 430, height: 0 }, { id: 'L2', x: 120, y: 430, height: 0 },
    { id: 'L3', x: 200, y: 430, height: 0 }, { id: 'L4', x: 300, y: 430, height: 0 },
    // The moon's reflection on the water: no edge goes there, ever
    { id: 'lake', x: 130, y: 520, height: 0 },
    // The goose's nest beside the path (the bead is under her), and where she chases Mocha to
    { id: 'nest', x: 230, y: 490, height: 0 }, { id: 'shore', x: 360, y: 500, height: 0 },
    { id: 'bench', x: 60, y: 340, height: 1 }, { id: 'rock', x: 330, y: 350, height: 1 },
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' }, { a: 'L2', b: 'L3', kind: 'crawl' }, { a: 'L3', b: 'L4', kind: 'crawl' },
    { a: 'L3', b: 'nest', kind: 'crawl' },
    { a: 'bench', b: 'rock', kind: 'jump' },
  ],
  parts: [],
  perches: [
    { id: 'bench', node: 'bench', reachNode: 'L1' },
    { id: 'rock', node: 'rock', reachNode: 'L4' },
  ],
  creatures: [
    {
      id: 'goose', positions: { nest: 'nest', chase: 'shore' }, initial: 'nest',
      // He crawls past her nest: she waddles off after Mocha, and the bead is out
      react: [{ on: { type: 'babyEnter', id: 'L3' }, when: { creature: 'goose', at: 'nest' }, to: 'chase' }],
      art: 'toy/goose',
    },
  ],
  attractors: [
    { id: 'moon', kind: 'shiny', node: 'lake', decoy: true },
    { id: 'bead', kind: 'shiny', node: 'nest', goal: true, visibleWhen: { creature: 'goose', at: 'chase' } },
  ],
  baby: { start: 'L1', facing: 'r' },
  mocha: { start: 'bench' },
  words: ['beep', 'bye'],
  learns: { word: 'no', when: { mochaAt: 'rock' } },
  mischief: { text: '讓鵝對摩卡叫兩次', when: { type: 'catArrive', id: 'rock', count: 2 } },
  tudigong: { x: 40, y: 240, visibleWhen: { mochaAt: 'rock' }, hat: '' },
  solution: [{ mocha: 'rock' }, { wait: 'settle' }, { say: 'no' }, { wait: 'goal' }],
});

/** The three, in GDD order. */
export const M2_TOYS = [toySpotlight, toySquirrel, toyMoon] as const;
