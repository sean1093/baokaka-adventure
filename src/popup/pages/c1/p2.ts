import { definePage } from '../../core/define';

/**
 * GDD § 3.4 / § 4.3, page 1-2 「月台的縫」 (the platform gap) · difficulty 2 · par 2. The train tab
 * jams at `half` while the pigeon sits in the track slot; Mocha on the pillar scares it away, and
 * Baokaka rides the train across to the bead. Data as in § 3.4, plus the split-flap departure board
 * (`board`, a `prop`, states `times`/`flip` from § 4.3) that hides the 土地公.
 */
export default definePage({
  id: 'c1p2', chapter: 1, index: 2, title: '月台的縫', difficulty: 2, backdrop: 'c1/hall-night',
  nodes: [
    { id: 'L1', x: 40, y: 430, height: 0 }, { id: 'L2', x: 90, y: 430, height: 0 }, { id: 'L3', x: 140, y: 430, height: 0 },
    { id: 'T1', x: 0, y: 0, height: 0, attach: { part: 'train', pos: { out: [60, 430], half: [150, 430], full: [190, 430] } } },
    { id: 'T2', x: 0, y: 0, height: 0, attach: { part: 'train', pos: { out: [100, 430], half: [190, 430], full: [230, 430] } } },
    { id: 'R1', x: 260, y: 430, height: 0 }, { id: 'R2', x: 320, y: 430, height: 0 },
    { id: 'pillarTop', x: 280, y: 240, height: 2 }, { id: 'bench', x: 340, y: 380, height: 1 },
    { id: 'gapSlot', x: 245, y: 470, height: 0 },   // unconnected: where the pigeon sits in the track slot
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' }, { a: 'L2', b: 'L3', kind: 'crawl' },
    { a: 'L3', b: 'T1', kind: 'crawl', when: { part: 'train', in: ['half', 'full'] } },
    { a: 'T1', b: 'T2', kind: 'crawl' },
    { a: 'T2', b: 'R1', kind: 'crawl', when: { part: 'train', in: ['full'] } },
    { a: 'R1', b: 'R2', kind: 'crawl' },
    { a: 'bench', b: 'pillarTop', kind: 'jump' },
  ],
  parts: [
    { id: 'train', preset: 'tab', states: ['out', 'half', 'full'], initial: 'out', input: 'drag-linear',
      track: { from: [80, 610], to: [200, 610] }, hit: { x: 56, y: 590, w: 150, h: 56 },
      stateWhen: { full: { creature: 'pigeon', at: 'away' } },   // the pigeon on the track jams the tab at 'half'
      art: 'c1/train-blue' },
    { id: 'board', preset: 'prop', states: ['times', 'flip'], hit: { x: 90, y: 120, w: 96, h: 64 },
      art: 'c1/departure-board' },   // the split-flap board; tapping it flips and shows the 土地公
  ],
  perches: [
    { id: 'bench', node: 'bench', reachNode: 'R2' },
    { id: 'pillar', node: 'pillarTop', reachNode: 'R1' },
  ],
  creatures: [
    { id: 'pigeon', positions: { onTrack: 'gapSlot', away: 'offpage' }, initial: 'onTrack', blocks: false, winged: true,
      fleesFromCat: { nearPerches: ['pillar'], to: 'away' }, art: 'common/pigeon' },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'R2', goal: true }],
  baby: { start: 'L1', facing: 'r' },
  mocha: { start: 'bench' },
  mischief: { text: '讓寶咖咖坐火車來回兩次', when: { type: 'ride', count: 4 } },
  tudigong: { x: 120, y: 160, visibleWhen: { part: 'board', in: ['flip'] }, hat: '站務帽' },
  solution: [{ set: 'train', to: 'half' }, { wait: 'settle' }, { mocha: 'pillar' }, { set: 'train', to: 'full' }, { wait: 'goal' }],
});
