import { definePage, loopAttach } from '../define';

/**
 * The M3 engine's toy pages (#120; GDD § 7 M3 items 30–31): one small, complete page per new
 * behaviour, each solver-green exactly as a real page must be (`m3.test.ts`). They are the engine's
 * proofs, not chapter pages (#121, #123, #125 write those); PageLab lists them as lab stages
 * (`dev/labPages.ts`) with placeholder art.
 *
 * - `toy-hug` (after 5-3 抱抱): a crowd of legs blocks the night-market lane. He learns 抱抱 beside
 *   the 夜市阿姨 (a `carrier`); said, she picks him up and walks him over the crowd to the bead.
 * - `toy-balloon` (after 5-2 射氣球攤): a balloon basket is a **counterweight lift**. Mocha sits in
 *   it and holds it down; when he jumps out, the basket rises with Baokaka to the ledge.
 * - `toy-carousel` (after 6-2 行李轉盤 and 7-2 纜車站): a baggage belt is a **loop** with a crank.
 *   He sits on a suitcase; turn the crank and the suitcase carries him round to the far side.
 * - `toy-plane` (after 6-3 看飛機): pigeons sit in the way on the observation deck. He learns
 *   飛機！ watching the sleeping plane; said, the pigeons fly up (`winged`) and the runway lights
 *   answer (`sky` reaction).
 * - `toy-climb` (after 7-3 茶園階梯): the tea farmer stands on the terrace step. 掰掰 sends him up
 *   to the next terrace; he copies the farmer and learns 爬樓梯 (`climb` edges), then climbs the
 *   22-unit riser the climb frames are drawn for (#141, D-58).
 */

/** 抱抱: the 夜市阿姨 carries him over the crowd of legs. */
export const toyHug = definePage({
  id: 'toy-hug', chapter: 5, index: 3, title: '抱抱', difficulty: 1, backdrop: 'toy/market',
  nodes: [
    { id: 'L1', x: 40, y: 430, height: 0 }, { id: 'L2', x: 110, y: 430, height: 0 },
    { id: 'L3', x: 190, y: 430, height: 0 }, { id: 'L4', x: 270, y: 430, height: 0 },
    { id: 'L5', x: 345, y: 430, height: 0 },
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' }, { a: 'L2', b: 'L3', kind: 'crawl' },
    { a: 'L3', b: 'L4', kind: 'crawl' }, { a: 'L4', b: 'L5', kind: 'crawl' },
  ],
  parts: [
    // She stands at the lane's mouth and walks it over the crowd (route = where her feet go)
    { id: 'auntie', preset: 'carrier', route: ['L2', 'L3', 'L4'], hit: { x: 86, y: 340, w: 48, h: 90 }, art: 'toy/auntie' },
  ],
  perches: [],
  creatures: [{ id: 'legs', positions: { crowd: 'L3' }, initial: 'crowd', art: 'toy/legs' }],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'L5', goal: true }],
  baby: { start: 'L1', facing: 'r' },
  mocha: { start: null },
  words: [],
  learns: { word: 'hug', when: { babyAt: 'L2' } },
  mischief: { text: '抱抱阿姨兩次', when: { type: 'hug', count: 2 } },
  tudigong: { x: 330, y: 300, visibleWhen: { part: 'auntie', in: ['done'] }, hat: '' },
  solution: [{ wait: 'settle' }, { say: 'hug' }, { wait: 'goal' }],
});

/** The balloon basket is a counterweight: it rises with him when Mocha jumps out. */
export const toyBalloon = definePage({
  id: 'toy-balloon', chapter: 5, index: 2, title: '氣球籃', difficulty: 1, backdrop: 'toy/stall',
  nodes: [
    { id: 'F1', x: 60, y: 430, height: 0 },
    // The basket: on the ground with Mocha's weight in it, up at the ledge without
    { id: 'B', x: 170, y: 430, height: 0, attach: { part: 'basket', pos: { down: [170, 430], up: [170, 300] } } },
    { id: 'H1', x: 250, y: 300, height: 1 }, { id: 'H2', x: 330, y: 300, height: 1 },
    // The basket's rim (Mocha's seat, riding it) and the balloon stall's post
    { id: 'rim', x: 205, y: 410, height: 1, attach: { part: 'basket', pos: { down: [205, 410], up: [205, 280] } } },
    { id: 'post', x: 50, y: 330, height: 1 },
  ],
  edges: [
    { a: 'F1', b: 'B', kind: 'crawl', when: { part: 'basket', in: ['down'] } },
    { a: 'B', b: 'H1', kind: 'crawl', when: { part: 'basket', in: ['up'] } },
    { a: 'H1', b: 'H2', kind: 'crawl' },
    { a: 'rim', b: 'post', kind: 'jump' },
  ],
  parts: [
    { id: 'basket', preset: 'lift', states: ['down', 'up'], counterweight: { on: 'down', off: 'up' }, hit: { x: 130, y: 400, w: 80, h: 50 }, art: 'toy/basket' },
  ],
  perches: [
    { id: 'rim', node: 'rim', reachNode: 'B', onPart: 'basket' },
    { id: 'post', node: 'post', reachNode: 'F1' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'H2', goal: true }],
  baby: { start: 'B', facing: 'r' },
  mocha: { start: 'rim' },
  words: [],
  mischief: { text: '讓摩卡再坐回籃子裡', when: { type: 'catArrive', id: 'rim' } },
  tudigong: { x: 330, y: 200, visibleWhen: { part: 'basket', in: ['up'] }, hat: '' },
  solution: [{ mocha: 'post' }, { wait: 'goal' }],
});

const BELT = ['0', '1', '2', '3'];
const SLOTS: [number, number][] = [[110, 430], [170, 430], [230, 430], [290, 430]];

/** The baggage belt is a loop with a crank: turn it and the suitcase carries him round. */
export const toyCarousel = definePage({
  id: 'toy-carousel', chapter: 6, index: 2, title: '行李轉盤', difficulty: 1, backdrop: 'toy/hall',
  nodes: [
    { id: 'F1', x: 40, y: 430, height: 0 },
    // The suitcase on the belt: one slot along per crank step, round and round
    { id: 'S', x: 110, y: 430, height: 0, attach: loopAttach('belt', BELT, SLOTS, 0) },
    { id: 'F2', x: 350, y: 430, height: 0 },
  ],
  edges: [
    { a: 'F1', b: 'S', kind: 'crawl', when: { part: 'belt', in: ['0'] } },
    { a: 'S', b: 'F2', kind: 'crawl', when: { part: 'belt', in: ['3'] } },
  ],
  parts: [
    { id: 'belt', preset: 'loop', states: BELT, input: 'drag-rotary', center: [200, 490], radius: 40,
      hit: { x: 90, y: 446, w: 220, h: 90 }, art: 'toy/belt' },
  ],
  perches: [],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'F2', goal: true }],
  baby: { start: 'S', facing: 'r' },
  mocha: { start: null },
  words: [],
  mischief: { text: '坐行李轉三格', when: { type: 'ride', count: 3 } },
  tudigong: { x: 50, y: 300, visibleWhen: { part: 'belt', in: ['2'] }, hat: '' },
  solution: [{ set: 'belt', to: '3' }, { wait: 'goal' }],
});

/** 飛機！: the pigeons fly up off the deck, and the runway lights blink back. */
export const toyPlane = definePage({
  id: 'toy-plane', chapter: 6, index: 3, title: '看飛機', difficulty: 1, backdrop: 'toy/deck',
  nodes: [
    { id: 'D1', x: 40, y: 430, height: 0 }, { id: 'D2', x: 120, y: 430, height: 0 },
    { id: 'D3', x: 200, y: 430, height: 0 }, { id: 'D4', x: 280, y: 430, height: 0 },
    { id: 'D5', x: 350, y: 430, height: 0 },
  ],
  edges: [
    { a: 'D1', b: 'D2', kind: 'crawl' }, { a: 'D2', b: 'D3', kind: 'crawl' },
    { a: 'D3', b: 'D4', kind: 'crawl' }, { a: 'D4', b: 'D5', kind: 'crawl' },
  ],
  parts: [
    // The runway lights answer every 飛機！ (on, off, on …): event-driven, nothing to tap
    { id: 'runway', preset: 'light', react: [{ on: 'sky', to: 'toggle' }], hit: { x: 240, y: 230, w: 120, h: 50 }, art: 'toy/runway' },
  ],
  perches: [],
  creatures: [{ id: 'pigeons', positions: { deck: 'D3', sky: 'offpage' }, initial: 'deck', winged: true, art: 'common/pigeon' }],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'D5', goal: true }],
  baby: { start: 'D1', facing: 'r' },
  mocha: { start: null },
  words: [],
  learns: { word: 'plane', when: { babyAt: 'D2' } },
  mischief: { text: '說三次飛機！', when: { type: 'sky', count: 3 } },
  tudigong: { x: 60, y: 260, visibleWhen: { part: 'runway', in: ['on'] }, hat: '' },
  solution: [{ wait: 'settle' }, { say: 'plane' }, { wait: 'goal' }],
});

/** 爬樓梯: 掰掰 sends the tea farmer up a terrace; he copies him and climbs the step. */
export const toyClimb = definePage({
  id: 'toy-climb', chapter: 7, index: 3, title: '茶園階梯', difficulty: 1, backdrop: 'toy/terrace',
  nodes: [
    { id: 'T0', x: 40, y: 430, height: 0 }, { id: 'T1', x: 110, y: 430, height: 0 },
    // One terrace up: a 22-unit riser, the height the climb frames are drawn for (D-58)
    { id: 'T2', x: 185, y: 408, height: 1 }, { id: 'T3', x: 260, y: 408, height: 1 },
    { id: 'T4', x: 335, y: 408, height: 1 },
    // Where the farmer goes: the next terrace up, past the page's paths
    { id: 'upper', x: 300, y: 300, height: 1 },
  ],
  edges: [
    { a: 'T0', b: 'T1', kind: 'crawl' }, { a: 'T1', b: 'T2', kind: 'climb' },
    { a: 'T2', b: 'T3', kind: 'crawl' }, { a: 'T3', b: 'T4', kind: 'crawl' },
  ],
  parts: [],
  perches: [],
  creatures: [
    {
      id: 'farmer', positions: { step: 'T2', up: 'upper' }, initial: 'step',
      react: [{ on: 'wave', when: { creature: 'farmer', at: 'step' }, to: 'up' }],
      art: 'toy/farmer',
    },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'T4', goal: true }],
  baby: { start: 'T0', facing: 'r' },
  mocha: { start: null },
  words: ['bye'],
  learns: { growth: 1, when: { creature: 'farmer', at: 'up' } },
  mischief: { text: '對採茶阿伯揮手兩次', when: { type: 'wave', count: 2 } },
  tudigong: { x: 60, y: 300, visibleWhen: { creature: 'farmer', at: 'up' }, hat: '' },
  solution: [{ wait: 'settle' }, { say: 'bye' }, { wait: 'goal' }],
});

/** The five, in GDD order. */
export const M3_TOYS = [toyBalloon, toyHug, toyCarousel, toyPlane, toyClimb] as const;
