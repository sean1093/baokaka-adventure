import { definePage } from '../define';

/**
 * GDD § 4.3, page 1-3 「嗶！閘門」 (fare gates), laid out for the engine tests: Mocha pushes the card
 * onto the reader, whose `beep` (an `emit`) opens gate A; Baokaka crawls through and learns 嗶！;
 * his own 嗶！ opens gate B (the reader is too far) and makes the robot spin (the 淘氣). The real
 * page, with art and lines, lands with the chapter 1 pages.
 */
export default definePage({
  id: 'c1p3', chapter: 1, index: 3, title: '嗶！閘門', difficulty: 2, backdrop: 'c1/gates',
  nodes: [
    { id: 'A1', x: 30, y: 430, height: 0 }, { id: 'A2', x: 90, y: 430, height: 0 },
    { id: 'gA', x: 150, y: 430, height: 0, attach: { part: 'gateA', pos: { closed: [150, 430], open: [150, 430] } } },
    { id: 'M1', x: 200, y: 430, height: 0 }, { id: 'M2', x: 250, y: 430, height: 0 },
    { id: 'gB', x: 300, y: 430, height: 0, attach: { part: 'gateB', pos: { closed: [300, 430], open: [300, 430] } } },
    { id: 'B1', x: 350, y: 430, height: 0 },
    { id: 'counterTop', x: 100, y: 300, height: 1 }, { id: 'machineTop', x: 30, y: 320, height: 1 },
    { id: 'readerSlot', x: 120, y: 390, height: 0 },   // unconnected: where the card lands
  ],
  edges: [
    { a: 'A1', b: 'A2', kind: 'crawl' }, { a: 'A2', b: 'gA', kind: 'crawl' }, { a: 'gA', b: 'M1', kind: 'crawl' },
    { a: 'M1', b: 'M2', kind: 'crawl' }, { a: 'M2', b: 'gB', kind: 'crawl' }, { a: 'gB', b: 'B1', kind: 'crawl' },
    { a: 'machineTop', b: 'counterTop', kind: 'jump' },
  ],
  parts: [
    { id: 'card', preset: 'pushable', hit: { x: 84, y: 284, w: 48, h: 48 }, art: 'c1/card',
      fall: { path: [[100, 300], [120, 390]], fallTo: 'readerSlot', landSets: { part: 'reader', to: 'down' } } },
    { id: 'reader', preset: 'button', hit: { x: 96, y: 366, w: 48, h: 48 }, emit: [{ onEnter: 'down', event: 'beep' }], art: 'c1/reader' },
    { id: 'gateA', preset: 'gate', hit: { x: 126, y: 380, w: 48, h: 100 }, react: [{ on: { type: 'beep', within: 120 }, to: 'open' }], art: 'c1/gate' },
    { id: 'gateB', preset: 'gate', hit: { x: 276, y: 380, w: 48, h: 100 }, react: [{ on: { type: 'beep', within: 120 }, to: 'open' }], art: 'c1/gate' },
    { id: 'robot', preset: 'prop', states: ['idle', 'spin'], hit: { x: 206, y: 496, w: 48, h: 48 },
      react: [{ on: { type: 'beep', within: 120 }, to: 'spin' }], art: 'c1/robot' },
  ],
  perches: [
    { id: 'counter', node: 'counterTop', reachNode: 'A2', push: 'card' },
    { id: 'ticketMachine', node: 'machineTop', reachNode: 'A1' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'B1', goal: true }],
  baby: { start: 'A1', facing: 'r' },
  mocha: { start: 'ticketMachine' },
  words: [],
  learns: { word: 'beep', when: { event: 'beep' } },
  mischief: { text: '對掃地機器人說「嗶！」', when: { type: 'partEnter', id: 'robot', when: { part: 'robot', in: ['spin'] } } },
  tudigong: { x: 200, y: 200, hat: '站務帽' },
  solution: [{ mocha: 'counter' }, { wait: 'settle' }, { say: 'beep' }, { wait: 'goal' }],
});
