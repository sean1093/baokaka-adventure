import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 3-6 「藍教授的書」 · difficulty 4 · par 4 · treasure 書: chapter 3's spread (§ 2.9).
 * A giant open book lies across the centrefold, its pages flaps that pop up into bridges. On a stack
 * of books on the right page sits 藍教授, a Taiwan blue magpie in reading glasses — on the 書. Her
 * glasses are a **decoy**: Baokaka, already sitting on the giant book's right-hand page, reaches for
 * them. 掰掰 doesn't budge her (「根據我的研究——」); she hops off only when Mocha lands beside her,
 * and the only way over for Mocha is that very page — which won't turn while a baby sits on it.
 * Say 不要！ to the glasses: he crawls back to reach up for Mocha on the lamp, off the page. Turn it
 * (`flapB`): it stands up as Mocha's bridge. Mocha hops over, 藍教授 flaps off with her glasses
 * (「我學富五車……腳踏車。」), and the 書 is there. The bookmark page (`flapA`) bridges the gap to the
 * stack; with it open he crawls over — **photo moment** — and grabs the 書. The 淘氣: open the page
 * with a cat in it (`flapC`) and let Mocha sit on it.
 *
 * ```
 *   lamp (Mocha) ─jump (flapB open)─ near (beside 藍教授)
 *        └─jump (flapC open)─ catPage
 *   L1 ── L2 ── B1 ── B2 ══(flapA open)══ T (藍教授 on the 書, glasses on her nose)
 *                    (he starts here, pinning flapB)
 * ```
 */
export default definePage({
  id: 'c3p6', chapter: 3, index: 6, title: '藍教授的書', difficulty: 4, backdrop: 'c3/book-spread',
  spread: true,
  // The right page round the stack, 藍教授's perch beside it (Mocha's +M) and the bookmark bridge
  photoRect: { x: 196, y: 300, w: 194, h: 226 },
  nodes: [
    // The desk (left page), the giant book's two pages, the stack of books (right page)
    { id: 'L1', x: 36, y: 484, height: 0 }, { id: 'L2', x: 96, y: 484, height: 0 },
    { id: 'B1', x: 160, y: 484, height: 0 }, { id: 'B2', x: 226, y: 484, height: 0 },
    { id: 'T', x: 334, y: 484, height: 0 },             // the top of the stack, where she sits on the 書
    { id: 'lampFoot', x: 22, y: 410, height: 1 },       // unconnected: the lamp's foot, up on the desk
    // Mocha's perches: the desk lamp, the cat page, the stack beside 藍教授
    { id: 'lampTop', x: 44, y: 286, height: 2 }, { id: 'catPageTop', x: 146, y: 360, height: 1 },
    { id: 'nearTop', x: 296, y: 380, height: 1 },
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' }, { a: 'L2', b: 'B1', kind: 'crawl' }, { a: 'B1', b: 'B2', kind: 'crawl' },
    { a: 'B2', b: 'T', kind: 'crawl', when: { part: 'flapA', in: ['open'] } },
    { a: 'lampTop', b: 'nearTop', kind: 'jump', when: { part: 'flapB', in: ['open'] } },
    { a: 'lampTop', b: 'catPageTop', kind: 'jump', when: { part: 'flapC', in: ['open'] } },
  ],
  parts: [
    // The bookmark page: folds out over the gap to the stack, a bridge for him
    { id: 'flapA', preset: 'flap', hit: { x: 266, y: 448, w: 56, h: 56 }, art: 'c3/page-bookmark' },
    // The page he sits on: turned, it stands up as Mocha's bridge; it won't turn under him
    { id: 'flapB', preset: 'flap', hit: { x: 198, y: 384, w: 56, h: 56 }, art: 'c3/page-bridge',
      stateWhen: { open: { not: { babyAt: 'B2' } } } },
    // The page with a cat in it
    { id: 'flapC', preset: 'flap', hit: { x: 118, y: 384, w: 56, h: 56 }, art: 'c3/page-cat' },
  ],
  perches: [
    { id: 'lamp', node: 'lampTop', reachNode: 'lampFoot' },
    { id: 'catPage', node: 'catPageTop', reachNode: 'B1' },
    { id: 'near', node: 'nearTop', reachNode: 'B2' },
  ],
  creatures: [
    // On the 書; 掰掰 doesn't budge her, Mocha landing beside her does: she flaps off the page
    { id: 'prof', positions: { book: 'T', away: 'offpage' }, initial: 'book',
      fleesFromCat: { nearPerches: ['near'], to: 'away' }, art: 'c3/magpie' },
  ],
  attractors: [
    // Her reading glasses, on her nose wherever she is
    { id: 'glasses', kind: 'shiny', node: 'T', decoy: true, heldBy: 'prof', art: 'c3/glasses' },
    { id: 'book', kind: 'shiny', node: 'T', goal: true, visibleWhen: { creature: 'prof', at: 'away' } },
  ],
  baby: { start: 'B2', facing: 'r' },
  mocha: { start: 'lamp' },
  mischief: { text: '翻到有貓的那一頁，讓摩卡坐上去', when: { type: 'catArrive', id: 'catPage' } },
  // Printed on the turned page
  tudigong: { x: 226, y: 330, visibleWhen: { part: 'flapB', in: ['open'] }, hat: '藍色校工帽' },
  solution: [{ tap: 'flapA' }, { say: 'no' }, { wait: 'settle' }, { tap: 'flapB' }, { mocha: 'near' }, { wait: 'goal' }],
  lines: {
    onEvent: [
      // 掰掰 doesn't budge her
      { when: { type: 'wave', when: { creature: 'prof', at: 'book' } }, line: 'c3p6.prof.1' },
      // Mocha lands beside her: she flaps off, with an idiom
      { when: { type: 'catArrive', id: 'near' }, line: 'c3p6.prof.2' },
      { when: { type: 'catArrive', id: 'near' }, line: 'c3p6.prof.3' },
    ],
  },
});
