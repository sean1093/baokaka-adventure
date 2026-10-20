import { definePage } from '../../core/define';

/**
 * GDD § 4.3, page 1-3 「嗶！閘門」 (the fare gates) · difficulty 2 · par 2 · learn 嗶！. The bead lies
 * beyond the exit gates (B). Mocha pushes the card off the 服務台 counter onto the reader: 「嗶！」,
 * gate A opens and Baokaka learns 嗶！ (`learns`; the learn beat, the word card and the first-use
 * tutorial come from `content/words.ts` and `game/words.ts`). Gate B is too far from the reader:
 * only his own 嗶！ opens it. The card stays on the reader (one-way, non-blocking: the solver's
 * dead-end check covers it). His 嗶！ at gate B also sets the floor-cleaning robot spinning; the 淘氣
 * is to say it while Mocha rides the robot (a deliberate variant of § 4.3's 淘氣, D-70).
 *
 * The engine tests keep their own copy of this layout (`core/fixtures/c1p3.ts`); this page adds the
 * robot's perch and grows its hit area to stay ≥ 48 px at the book scale (R6).
 */
export default definePage({
  id: 'c1p3', chapter: 1, index: 3, title: '嗶！閘門', difficulty: 2, backdrop: 'c1/gates',
  nodes: [
    { id: 'A1', x: 30, y: 430, height: 0 }, { id: 'A2', x: 90, y: 430, height: 0 },
    { id: 'gA', x: 150, y: 430, height: 0, attach: { part: 'gateA', pos: { closed: [150, 430], open: [150, 430] } } },
    { id: 'M1', x: 200, y: 430, height: 0 }, { id: 'M2', x: 250, y: 430, height: 0 },
    { id: 'gB', x: 300, y: 430, height: 0, attach: { part: 'gateB', pos: { closed: [300, 430], open: [300, 430] } } },
    { id: 'B1', x: 350, y: 430, height: 0 },
    // Mocha's perches: the ticket machine, the 服務台 counter, and the cleaning robot's lid
    { id: 'counterTop', x: 100, y: 300, height: 1 }, { id: 'machineTop', x: 30, y: 320, height: 1 },
    { id: 'robotTop', x: 226, y: 488, height: 1 },
    { id: 'readerSlot', x: 120, y: 390, height: 0 },   // unconnected: where the card lands
  ],
  edges: [
    { a: 'A1', b: 'A2', kind: 'crawl' }, { a: 'A2', b: 'gA', kind: 'crawl' }, { a: 'gA', b: 'M1', kind: 'crawl' },
    { a: 'M1', b: 'M2', kind: 'crawl' }, { a: 'M2', b: 'gB', kind: 'crawl' }, { a: 'gB', b: 'B1', kind: 'crawl' },
    { a: 'machineTop', b: 'counterTop', kind: 'jump' }, { a: 'counterTop', b: 'robotTop', kind: 'jump' },
  ],
  parts: [
    { id: 'card', preset: 'pushable', hit: { x: 72, y: 272, w: 56, h: 56 }, art: 'c1/card',
      fall: { path: [[100, 300], [120, 390]], fallTo: 'readerSlot', landSets: { part: 'reader', to: 'down' } } },
    { id: 'reader', preset: 'button', hit: { x: 92, y: 362, w: 56, h: 56 }, emit: [{ onEnter: 'down', event: 'beep' }], art: 'c1/reader' },
    { id: 'gateA', preset: 'gate', hit: { x: 122, y: 380, w: 56, h: 100 }, react: [{ on: { type: 'beep', within: 120 }, to: 'open' }], art: 'c1/gate' },
    { id: 'gateB', preset: 'gate', hit: { x: 272, y: 380, w: 56, h: 100 }, react: [{ on: { type: 'beep', within: 120 }, to: 'open' }], art: 'c1/gate' },
    // The robot is out of the reader's reach (176 units) but within his 嗶！ at gate B (100 units)
    { id: 'robot', preset: 'prop', states: ['idle', 'spin'], hit: { x: 198, y: 500, w: 64, h: 56 },
      react: [{ on: { type: 'beep', within: 120 }, to: 'spin' }], art: 'c1/robot' },
  ],
  perches: [
    { id: 'counter', node: 'counterTop', reachNode: 'A2', push: 'card' },
    { id: 'ticketMachine', node: 'machineTop', reachNode: 'A1' },
    { id: 'robotLid', node: 'robotTop', reachNode: 'M2' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'B1', goal: true }],
  baby: { start: 'A1', facing: 'r' },
  mocha: { start: 'ticketMachine' },
  learns: { word: 'beep', when: { event: 'beep' } },
  // 嗶！ heard while Mocha rides the spinning robot (D-70)
  mischief: { text: '對載著摩卡的掃地機器人說『嗶！』', when: { type: 'beep', when: { all: [{ part: 'robot', in: ['spin'] }, { mochaAt: 'robotLid' }] } } },
  tudigong: { x: 214, y: 214, hat: '站務帽' },   // in the 詢問處 booth window, wearing a station cap; always visible
  solution: [{ mocha: 'counter' }, { wait: 'settle' }, { say: 'beep' }, { wait: 'goal' }],
});
