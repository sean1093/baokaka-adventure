import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page E 「抓周」 (家, 10:00) · the interactive ending · 尾聲 (chapter 11, #135). The
 * living room in daylight on the birthday: the red 抓周盤 on the play-mat with all nine treasures
 * round the 金鎖片 (shiny, visible, reachable: drawn on the tray in the backdrop), 阿嬤, 媽媽 and
 * 爸爸 (his phone up) behind the mat, the lane's little 土地公 shrine through the window.
 *
 * For 64 pages the player learned that shiny beats cat. Here, for the only time, the rule breaks:
 * `priorityOverride: { mocha: 0 }` and **Mocha is the goal** (`mochaGoal`). The family cheers for
 * their pick (each line held), and wherever Mocha is put, Baokaka crawls **past every treasure** —
 * 「……經過了書。」「……經過了算盤。」「……經過了雞腿？」 — and grabs his tail. The photo moment
 * frames them; then his first word, 「……摩卡。」, and his second (the end lines, `END_LINES[11]`).
 *
 * Trivially solvable (`allowTrivial`): with no input Mocha is on the sofa's arm, visible, and he
 * crawls the length of the mat to him. No words (一起 would link them, and linked he never grabs).
 * The 淘氣: Mocha sat on the 抓周盤 (he still gets his tail grabbed). The 土地公: the statue in the
 * shrine across the lane, through the window.
 *
 * ```
 *        window: the lane, the shrine (土地公)    sill (Mocha, in the sun)
 *   阿嬤   媽媽   爸爸                                    sofa ┐ sofaArm (Mocha's start)
 *   B0 ── T1 ── T2 ── T3 ── R          (the play-mat: he crawls left to right)
 *     [ 抓周盤: 書 畫筆 麥克風 · 算盤 金鎖片 印章 蔥 · 雞腿 聽診器 芹菜 ]   tray (Mocha: the 淘氣)
 * ```
 */
/** The treasures on the 抓周盤, where he passes them (all drawn on the tray in the backdrop). */
const TREASURES: readonly (readonly [string, string])[] = [
  ['book', 'T1'], ['brush', 'T1'], ['mic', 'T1'],
  ['abacus', 'T2'], ['lock', 'T2'], ['stamp', 'T2'], ['scallion', 'T2'],
  ['drumstick', 'T3'], ['stethoscope', 'T3'], ['celery', 'T3'],
];

export default definePage({
  id: 'c11p1', chapter: 11, index: 1, title: '抓周', difficulty: 1, backdrop: 'end/zhuazhou-day',
  spread: true,
  // The end of the mat and the sofa: where he takes Mocha's tail, whatever perch Mocha is on
  photoRect: { x: 150, y: 280, w: 240, h: 230 },
  nodes: [
    // The play-mat behind the tray: 阿嬤 set him down at its left end
    { id: 'B0', x: 40, y: 462, height: 0 }, { id: 'T1', x: 112, y: 462, height: 0 }, { id: 'T2', x: 184, y: 462, height: 0 },
    { id: 'T3', x: 256, y: 462, height: 0 }, { id: 'R', x: 328, y: 462, height: 0 },
    // Mocha's perches: the sofa's arm, the sunny windowsill, the 抓周盤 itself
    { id: 'sofaArm', x: 354, y: 384, height: 1 }, { id: 'sill', x: 300, y: 258, height: 2 }, { id: 'trayTop', x: 198, y: 556, height: 1 },
  ],
  edges: [
    { a: 'B0', b: 'T1', kind: 'crawl' }, { a: 'T1', b: 'T2', kind: 'crawl' }, { a: 'T2', b: 'T3', kind: 'crawl' }, { a: 'T3', b: 'R', kind: 'crawl' },
    { a: 'sofaArm', b: 'sill', kind: 'jump' }, { a: 'sofaArm', b: 'trayTop', kind: 'jump' }, { a: 'sill', b: 'trayTop', kind: 'jump' },
  ],
  parts: [],
  perches: [
    { id: 'sofaArm', node: 'sofaArm', reachNode: 'R' },
    { id: 'sill', node: 'sill', reachNode: 'T3' },
    { id: 'tray', node: 'trayTop', reachNode: 'T2' },
  ],
  creatures: [],
  attractors: TREASURES.map(([id, node]) => ({ id, kind: 'shiny' as const, node, art: 'baked' })),
  baby: { start: 'B0', facing: 'r' },
  mocha: { start: 'sofaArm' },
  mochaGoal: true,
  priorityOverride: { mocha: 0 },
  allowTrivial: true,
  words: [],
  mischief: { text: '讓摩卡坐在抓周盤上', when: { type: 'catArrive', id: 'tray' } },
  // The statue in the lane's shrine, through the window: he winks when tapped
  tudigong: { x: 236, y: 150, hat: '' },
  lines: {
    // § 5.5: the family cheers for their pick; the world waits while they do
    intro: ['e.cheer.1', 'e.cheer.2', 'e.cheer.3'],
    introPause: true,
    // He crawls past every treasure (not the one he stops at: Mocha's place), each line held
    onEvent: [
      { when: { type: 'babyEnter', id: 'T1' }, line: 'e.pass.1', pause: true },
      { when: { type: 'babyEnter', id: 'T2', when: { not: { mochaAt: 'tray' } } }, line: 'e.pass.2', pause: true },
      { when: { type: 'babyEnter', id: 'T3', when: { not: { mochaAt: 'sill' } } }, line: 'e.pass.3', pause: true },
    ],
  },
  solution: [{ wait: 'goal' }],
});
