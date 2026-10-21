import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 7-3 「茶園階梯」 (貓空's tea terraces) · difficulty 2 · par 2 · **learn 爬樓梯**.
 * The tea garden climbs the hill in terraces, each one a 22-unit step up (the riser the climb
 * frames are drawn for, D-58, D-83). Baokaka can't climb yet: he crawls along the bottom path and
 * cuddles Mocha on the bench there. A tea farmer picks tea on the first step.
 *
 * Mocha up to the tea shed at the top: Baokaka crawls to the foot of the first step and reaches
 * up — the farmer is in the way. 掰掰: the farmer waves back and climbs up onto the next terrace
 * (「掰掰～阿伯上去採茶囉！」); Baokaka watches him, grunts 「嘿！」, pulls himself up the step and
 * learns 爬樓梯 (`learns: { growth: 1 }`: every `climb` edge is his from now on). Up the terraces
 * after Mocha: from the second terrace the bead shows in the tea by the shed, and he climbs to it.
 * The 淘氣: up and down the same step five times (Mocha on the bench, then on the stool on the first
 * terrace, and back).
 *
 * ```
 *   bench (Mocha) ─jump─ stool (Mocha, on the first terrace) ─jump─ shed (Mocha, at the top)
 *                                                           V2 ═climb═ W1 (bead, seen from the second terrace)
 *                                        V1 ── V2
 *                       U1 ── U2 ═climb═ V1
 *   T0 ── T1 ═climb═ U1 (the farmer picks tea here; 掰掰: he climbs up out of the way)
 * ```
 */
const UP_HIGH = { any: [{ babyAt: 'V1' }, { babyAt: 'V2' }, { babyAt: 'W1' }] };

export default definePage({
  id: 'c7p3', chapter: 7, index: 3, title: '茶園階梯', difficulty: 2, backdrop: 'c7/tea-terraces',
  nodes: [
    // The bottom path, then a terrace up every 22 units
    { id: 'T0', x: 34, y: 486, height: 0 }, { id: 'T1', x: 90, y: 486, height: 0 },
    { id: 'U1', x: 146, y: 464, height: 1 }, { id: 'U2', x: 202, y: 464, height: 1 },
    { id: 'V1', x: 258, y: 442, height: 1 }, { id: 'V2', x: 314, y: 442, height: 1 },
    { id: 'W1', x: 366, y: 420, height: 1 },
    // Unconnected: where the farmer climbs to (the next terrace up, behind)
    { id: 'ridge', x: 160, y: 420, height: 1 },
    // Mocha's perches: the bench on the bottom path, the farmer's stool on the first terrace, the tea shed's roof
    { id: 'benchTop', x: 52, y: 424, height: 1 }, { id: 'stoolTop', x: 196, y: 420, height: 1 },
    { id: 'shedTop', x: 344, y: 340, height: 2 },
  ],
  edges: [
    { a: 'T0', b: 'T1', kind: 'crawl' }, { a: 'T1', b: 'U1', kind: 'climb' },
    { a: 'U1', b: 'U2', kind: 'crawl' }, { a: 'U2', b: 'V1', kind: 'climb' },
    { a: 'V1', b: 'V2', kind: 'crawl' }, { a: 'V2', b: 'W1', kind: 'climb' },
    { a: 'benchTop', b: 'stoolTop', kind: 'jump' }, { a: 'stoolTop', b: 'shedTop', kind: 'jump' },
  ],
  parts: [],
  perches: [
    { id: 'bench', node: 'benchTop', reachNode: 'T0' },
    { id: 'stool', node: 'stoolTop', reachNode: 'U1' },
    { id: 'shed', node: 'shedTop', reachNode: 'W1' },
  ],
  creatures: [
    // The tea farmer on the first step: 掰掰, and he climbs up onto the next terrace
    {
      id: 'farmer', positions: { step: 'U1', up: 'ridge' }, initial: 'step',
      react: [{ on: 'wave', when: { creature: 'farmer', at: 'step' }, to: 'up' }],
      art: 'c7/tea-farmer',
    },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'W1', goal: true, visibleWhen: UP_HIGH }],
  baby: { start: 'T0', facing: 'r' },
  mocha: { start: 'bench' },
  // He watches the farmer climb, and copies him
  learns: { growth: 1, when: { creature: 'farmer', at: 'up' } },
  mischief: { text: '同一階爬上爬下五次', when: { type: 'babyEnter', id: 'U1', count: 5 } },
  // On the tea shed's roof ridge, seen once the farmer has climbed up past it
  tudigong: { x: 286, y: 360, visibleWhen: { creature: 'farmer', at: 'up' }, hat: '叢林帽' },
  solution: [{ mocha: 'shed' }, { wait: 'settle' }, { say: 'bye' }, { wait: 'goal' }],
  lines: {
    // The farmer waves back as he climbs
    onEvent: [{ when: { type: 'wave', when: { creature: 'farmer', at: 'up' } }, line: 'c7p3.farmer.1' }],
  },
});
