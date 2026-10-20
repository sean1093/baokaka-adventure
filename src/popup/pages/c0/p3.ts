import { definePage } from '../../core/define';

/**
 * GDD § 4.3, page 0-3 「摩卡起床」 (Mocha wakes up) · difficulty 2 · par 1. Mocha wakes on the sofa
 * arm and joins (his lines § 5.2 P play as the page opens): the first page with perches. The bead
 * lies on the high 抓周 table, out of Baokaka's reach; he crawls under it and reaches. Tapping the
 * table's paw print sends Mocha up: he makes eye contact with the camera for a tick, then pushes
 * the bead off (C3); it lands on the rug beside the table and Baokaka grabs it. The 淘氣 is sending
 * him to the shelf instead, where he pushes 阿嬤's 紅包 down next to Baokaka (「這個！」, flavour).
 * The scripted ghost hand on `table` is a view feature (#106).
 */
export default definePage({
  id: 'c0p3', chapter: 0, index: 3, title: '摩卡起床', difficulty: 2, backdrop: 'c0/zhuazhou-corner',
  nodes: [
    { id: 'rug1', x: 90, y: 480, height: 0 }, { id: 'rug2', x: 160, y: 480, height: 0 },
    { id: 'underTable', x: 235, y: 480, height: 0 },   // under the 抓周 table's front edge: where he reaches
    { id: 'rug4', x: 315, y: 480, height: 0 },         // beside the table: where the bead lands
    // Mocha's perches: the sofa arm, the 抓周 table, the wall shelf
    { id: 'sofaArm', x: 36, y: 400, height: 1 }, { id: 'tableTop', x: 262, y: 372, height: 1 }, { id: 'shelfTop', x: 150, y: 236, height: 2 },
  ],
  edges: [
    { a: 'rug1', b: 'rug2', kind: 'crawl' }, { a: 'rug2', b: 'underTable', kind: 'crawl' }, { a: 'underTable', b: 'rug4', kind: 'crawl' },
    { a: 'sofaArm', b: 'shelfTop', kind: 'jump' }, { a: 'sofaArm', b: 'tableTop', kind: 'jump' }, { a: 'shelfTop', b: 'tableTop', kind: 'jump' },
  ],
  parts: [
    // The bead on the table's edge (C3): Mocha pushes it off, it rolls down to the rug
    { id: 'bead', preset: 'pushable', fall: { path: [[262, 360], [292, 404], [315, 470]], fallTo: 'rug4' }, hit: { cx: 262, cy: 358, r: 28 }, art: 'c0/bead-ball' },
    // 阿嬤's 紅包 on the shelf: Mocha pushes it down next to Baokaka (the 淘氣)
    { id: 'redEnvelope', preset: 'pushable', fall: { path: [[150, 224], [156, 350], [160, 470]], fallTo: 'rug2' }, hit: { cx: 150, cy: 222, r: 28 }, art: 'c0/red-envelope' },
  ],
  perches: [
    { id: 'sofaArm', node: 'sofaArm', reachNode: 'rug1' },
    { id: 'table', node: 'tableTop', reachNode: 'underTable', push: 'bead' },
    { id: 'shelf', node: 'shelfTop', reachNode: 'rug2', push: 'redEnvelope' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'tableTop', height: 1, goal: true, followsPushable: 'bead' }],
  baby: { start: 'rug1', facing: 'r' },
  mocha: { start: 'sofaArm' },
  mischief: { text: '讓摩卡把紅包推下來', when: { type: 'land', id: 'redEnvelope' } },
  tudigong: { x: 334, y: 196, hat: '' },   // on the wall calendar (農民曆); always visible
  solution: [{ mocha: 'table' }, { wait: 'goal' }],
  lines: {
    // GDD § 5.2 P: Mocha joins as the page opens
    intro: ['c0p3.join.1', 'c0p3.join.2', 'c0p3.join.3', 'c0p3.join.4', 'c0p3.join.5', 'c0p3.join.6', 'c0p3.join.7', 'c0p3.join.8', 'c0p3.join.9', 'c0p3.join.10'],
    // The 紅包 lands beside him and he pats it (flavour only: it isn't something he wants)
    onEvent: [{ when: { type: 'land', id: 'redEnvelope' }, line: 'c0p3.envelope.1' }],
  },
});
