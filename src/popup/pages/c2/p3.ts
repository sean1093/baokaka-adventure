import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 2-3 「跑步的阿姨」 · difficulty 2 · par 2 · **learn 掰掰**. Nothing shiny shows at
 * first: Mocha on the bench by the pond is the best thing on the page, so Baokaka crawls to him.
 * A jogger stretches on the little bridge, blocking it. Send Mocha to the bridge's far railing:
 * she sees him, laughs, waves 「掰掰～小寶貝！」 and jogs off (`learns`: 掰掰, the § 5.4 learn beat
 * and word card); Baokaka crosses to Mocha. On the path beyond, a dog sleeps curled round the bead:
 * say 掰掰 and it wags, gets up and trots off, and the bead shines. The 淘氣: 掰掰 to the turtle on
 * its rock in the pond (it waves back… slowly) — it is out of reach from the path beyond the
 * bridge, so it takes bringing him back across with Mocha.
 *
 * ```
 *   bench ─jump─ railing
 *   (turtle)
 *   A1 ── A2 ── bridge ── B1 ── B2 (dog, curled round the bead)
 *               (jogger)
 * ```
 */
export default definePage({
  id: 'c2p3', chapter: 2, index: 3, title: '跑步的阿姨', difficulty: 2, backdrop: 'c2/bridge',
  nodes: [
    { id: 'A1', x: 36, y: 476, height: 0 }, { id: 'A2', x: 96, y: 476, height: 0 },
    { id: 'bridge', x: 166, y: 452, height: 0 },   // the little arched bridge over the stream
    { id: 'B1', x: 240, y: 476, height: 0 }, { id: 'B2', x: 314, y: 476, height: 0 },
    // Unconnected: the turtle's rock in the pond, where the jogger runs off to, the dog's spot by the lamp
    { id: 'turtleRock', x: 52, y: 532, height: 0 }, { id: 'track', x: 370, y: 400, height: 0 },
    { id: 'doghouse', x: 360, y: 520, height: 0 },
    // Mocha's perches: the pond-side bench, the bridge's far railing
    { id: 'benchTop', x: 60, y: 384, height: 1 }, { id: 'railTop', x: 206, y: 390, height: 1 },
  ],
  edges: [
    { a: 'A1', b: 'A2', kind: 'crawl' }, { a: 'A2', b: 'bridge', kind: 'crawl' }, { a: 'bridge', b: 'B1', kind: 'crawl' },
    { a: 'B1', b: 'B2', kind: 'crawl' },
    { a: 'benchTop', b: 'railTop', kind: 'jump' },
  ],
  parts: [],
  perches: [
    { id: 'bench', node: 'benchTop', reachNode: 'A2' },
    { id: 'railing', node: 'railTop', reachNode: 'B1' },
  ],
  creatures: [
    // Stretching on the bridge; Mocha on the railing makes her laugh, wave and jog off
    { id: 'jogger', positions: { stretch: 'bridge', away: 'track' }, initial: 'stretch',
      react: [{ on: { type: 'catArrive', id: 'railing' }, to: 'away' }], art: 'c2/jogger' },
    // Asleep on the path, curled round the bead; 掰掰 wakes it and it trots off
    { id: 'dog', positions: { sleep: 'B2', away: 'doghouse' }, initial: 'sleep',
      react: [{ on: 'wave', to: 'away' }], art: 'c2/dog' },
    // On its rock in the pond; it waves back to 掰掰 (and stops at the next)
    { id: 'turtle', positions: { rest: 'turtleRock', waving: 'turtleRock' }, initial: 'rest', blocks: false,
      react: [{ on: 'wave', when: { creature: 'turtle', at: 'rest' }, to: 'waving' }, { on: 'wave', to: 'rest' }], art: 'c2/turtle' },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'B2', goal: true, visibleWhen: { creature: 'dog', at: 'away' } }],
  baby: { start: 'A1', facing: 'r' },
  mocha: { start: 'bench' },
  learns: { word: 'bye', when: { creature: 'jogger', at: 'away' } },
  mischief: { text: '對池塘裡的烏龜說「掰掰」', when: { type: 'wave', when: { creature: 'turtle', at: 'waving' } } },
  // Sweeping the bridge behind the jogger: seen once she has gone
  tudigong: { x: 168, y: 372, visibleWhen: { creature: 'jogger', at: 'away' }, hat: '斗笠' },
  solution: [{ mocha: 'railing' }, { wait: 'settle' }, { say: 'bye' }, { wait: 'goal' }],
});
