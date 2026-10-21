import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 7-6 「菜園的芹菜」 · difficulty 4 · par 4 · treasure 芹菜: chapter 7's spread
 * (§ 2.9). A vegetable garden on the hill above the tea: the bottom path (left page), and on the
 * right page two tall terrace walls — too tall for him even now (a grown-up's step: `cruise`) — up
 * to the celery bed behind a little bamboo fence, one step higher (a `climb`: that one is his).
 *
 * 黑糖 the black bear is asleep on the celery bed (`sleeper`, a creature: the 芹菜 is under him and
 * out of sight). Down on the path a rain barrel holds the moon (a **decoy**): Baokaka crawls to it
 * and reaches. Nothing here wakes a bear but a baby's cry: Mocha into the bamboo basket (C9), and
 * 不要！ to the moon — nothing left to want, he looks round, and cries. The cry wakes 黑糖
 * (「歹、歹勢，我睡在芹菜上了。」「……熊也會說歹勢。」): he lumbers down to the foot of the wall and
 * drinks from the barrel (the moon's reflection breaks up), and the 芹菜 shows on its bed. 抱抱:
 * the bear (a **carrier**) carries him up both walls and sets him down by the fence; Mocha onto the
 * fence post lifts its latch, the gate swings open, and he climbs the last step to the 芹菜.
 * **Photo moment** (Mocha on the post, inside `photoRect`, +M). The 淘氣: 抱抱 the bear twice — he
 * carries him back down, humming.
 *
 * ```
 *   scarecrow (Mocha) ─jump─ basket (Mocha hides)
 *   scarecrow ─jump─ trellis (Mocha) ─jump─ post (Mocha: lifts the fence's latch)
 *                                                    T2 ── G (fence gate) ═climb═ C (the celery bed: 黑糖 asleep)
 *                                          T1 ═cruise═ T2
 *   B1 ── B2 ── B3 ── B4 ── B5 (the wall's foot; the barrel's moon) ═cruise═ T1
 *   bear: B5 → T1 → T2 (抱抱), once a cry has woken him
 * ```
 */
const AWAKE = { creature: 'sleeper', at: 'up' };

export default definePage({
  id: 'c7p6', chapter: 7, index: 6, title: '菜園的芹菜', difficulty: 4, backdrop: 'c7/celery-garden',
  spread: true,
  // The celery bed and the fence: the 芹菜, Mocha on the post
  photoRect: { x: 250, y: 260, w: 140, h: 200 },
  nodes: [
    // The bottom path, to the foot of the terrace wall
    { id: 'B1', x: 26, y: 494, height: 0 }, { id: 'B2', x: 76, y: 494, height: 0 },
    { id: 'B3', x: 126, y: 494, height: 0 }, { id: 'B4', x: 176, y: 494, height: 0 },
    { id: 'B5', x: 226, y: 494, height: 0 },
    // Two tall terrace walls up, the fence's gate, the celery bed a step higher
    { id: 'T1', x: 262, y: 450, height: 1 }, { id: 'T2', x: 298, y: 406, height: 1 },
    { id: 'G', x: 334, y: 406, height: 1, attach: { part: 'gate', pos: { closed: [334, 406], open: [334, 406] } } },
    { id: 'C', x: 370, y: 384, height: 1 },
    // Unconnected: the moon in the rain barrel at the wall's foot; under the scarecrow's hat, out of his reach
    { id: 'barrel', x: 240, y: 530, height: 0 }, { id: 'scarecrowFoot', x: 50, y: 440, height: 1 },
    // Mocha's perches: the scarecrow's hat, the bamboo basket, the fence post; the bean trellis is
    // only on his way (no perch: a stop there would undo a 不要！ to him for nothing)
    { id: 'scarecrowTop', x: 60, y: 372, height: 2 }, { id: 'basketTop', x: 118, y: 446, height: 1 },
    { id: 'trellisTop', x: 200, y: 330, height: 2 }, { id: 'postTop', x: 356, y: 334, height: 2 },
  ],
  edges: [
    { a: 'B1', b: 'B2', kind: 'crawl' }, { a: 'B2', b: 'B3', kind: 'crawl' }, { a: 'B3', b: 'B4', kind: 'crawl' },
    { a: 'B4', b: 'B5', kind: 'crawl' },
    // The terrace walls: a grown-up's step even now (爬樓梯 is one step: these are two)
    { a: 'B5', b: 'T1', kind: 'cruise' }, { a: 'T1', b: 'T2', kind: 'cruise' },
    { a: 'T2', b: 'G', kind: 'crawl' }, { a: 'G', b: 'C', kind: 'climb' },
    { a: 'scarecrowTop', b: 'basketTop', kind: 'jump' }, { a: 'scarecrowTop', b: 'trellisTop', kind: 'jump' },
    { a: 'trellisTop', b: 'postTop', kind: 'jump' },
  ],
  parts: [
    // 黑糖, once he's awake: 抱抱, and he carries him up both walls
    { id: 'bear', preset: 'carrier', route: ['B5', 'T1', 'T2'], lockedWhen: { not: AWAKE },
      hit: { x: 196, y: 380, w: 60, h: 114 }, art: 'c7/black-bear' },
    // The fence's latch on its post: Mocha's weight lifts it
    { id: 'latch', preset: 'button', hit: { x: 328, y: 306, w: 56, h: 56 }, art: 'c7/fence-latch' },
    // The bamboo fence's gate: the latch lifted, it swings open and stays open
    { id: 'gate', preset: 'gate', initial: 'closed', hit: { x: 306, y: 350, w: 56, h: 56 }, art: 'c7/fence-gate',
      react: [{ on: { type: 'partEnter', id: 'latch', state: 'down' }, to: 'open' }] },
  ],
  perches: [
    // Up on the scarecrow's hat he's out of reach: Baokaka reaches for him, never quite there, so a 不要！ holds
    { id: 'scarecrow', node: 'scarecrowTop', reachNode: 'scarecrowFoot' },
    // The bamboo basket: in it, he's out of sight (C9)
    { id: 'basket', node: 'basketTop', reachNode: 'B2', hidesMocha: true },
    // On the fence post: his weight lifts the latch (C4)
    { id: 'post', node: 'postTop', reachNode: 'T2', onPart: 'latch' },
  ],
  creatures: [
    // 黑糖 asleep on the celery bed: a cry anywhere in the garden wakes him, and he gets up off it
    { id: 'sleeper', positions: { bed: 'C', up: 'offpage' }, initial: 'bed', react: [{ on: 'cry', within: 400, to: 'up' }], art: 'c7/sleeping-bear' },
  ],
  attractors: [
    // The moon in the rain barrel: a decoy, until the bear drinks from the barrel
    { id: 'moon', kind: 'shiny', node: 'barrel', decoy: true, art: 'c3/moon', visibleWhen: { not: AWAKE } },
    // The 芹菜 on its bed, out of sight under the sleeping bear
    { id: 'celery', kind: 'shiny', node: 'C', goal: true, visibleWhen: AWAKE },
  ],
  baby: { start: 'B1', facing: 'r' },
  mocha: { start: 'scarecrow' },
  // 抱抱 him a second time: he carries him back down, humming
  mischief: {
    text: '抱抱黑糖兩次',
    when: { type: 'hug', count: 2, when: { part: 'bear', in: ['carrying@0', 'carrying@1', 'carrying@2'] } },
  },
  // A little 土地公 shrine in the corner of the fence, seen once the gate opens
  tudigong: { x: 360, y: 300, visibleWhen: { part: 'gate', in: ['open'] }, hat: '叢林帽' },
  solution: [
    { mocha: 'basket' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'settle' },
    { mocha: 'post' }, { wait: 'goal' },
  ],
  lines: {
    onEvent: [
      // The cry wakes 黑糖
      { when: { type: 'cry', when: AWAKE }, line: 'c7p6.bear.1' },
      { when: { type: 'cry', when: AWAKE }, line: 'c7p6.bear.2' },
      // Hugged again, he hums all the way down
      { when: { type: 'hug', count: 2, when: { part: 'bear', in: ['carrying@0', 'carrying@1', 'carrying@2'] } }, line: 'c7p6.bear.3' },
    ],
  },
});
