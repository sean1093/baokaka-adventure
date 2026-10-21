import { definePage } from '../define';

/**
 * GDD § 4.3, page 0-4 「窗外的月亮線」, laid out for the engine tests: hide Mocha in the laundry
 * basket so nothing is visible, Baokaka looks, then cries; the cry opens the balcony door and wakes
 * the train (its reaction reaches further than the cry's 220 units); open the curtain and he crawls
 * out to the bead. The 淘氣 is closing the curtain while Mocha sits on the rod.
 */
export default definePage({
  id: 'c0p4', chapter: 0, index: 4, title: '窗外的月亮線', difficulty: 2, backdrop: 'c0/home-window',
  nodes: [
    { id: 'R1', x: 60, y: 430, height: 0 }, { id: 'R2', x: 130, y: 430, height: 0 }, { id: 'R3', x: 200, y: 430, height: 0 },
    { id: 'door', x: 260, y: 430, height: 0, attach: { part: 'balconyDoor', pos: { closed: [260, 430], open: [260, 430] } } },
    { id: 'trainStep', x: 330, y: 430, height: 0 },
    { id: 'sillTop', x: 150, y: 300, height: 1 }, { id: 'basketTop', x: 60, y: 360, height: 1 },
    { id: 'rodTop', x: 200, y: 180, height: 2 }, { id: 'roofTop', x: 330, y: 330, height: 2 },
  ],
  edges: [
    { a: 'R1', b: 'R2', kind: 'crawl' }, { a: 'R2', b: 'R3', kind: 'crawl' }, { a: 'R3', b: 'door', kind: 'crawl' },
    { a: 'door', b: 'trainStep', kind: 'crawl' },
    { a: 'sillTop', b: 'basketTop', kind: 'jump' }, { a: 'sillTop', b: 'rodTop', kind: 'jump' },
    { a: 'rodTop', b: 'roofTop', kind: 'jump', when: { part: 'balconyDoor', in: ['open'] } },
  ],
  parts: [
    { id: 'curtain', preset: 'flap', hit: { x: 200, y: 200, w: 60, h: 160 }, art: 'c0/curtain' },
    { id: 'balconyDoor', preset: 'gate', hit: { x: 236, y: 330, w: 48, h: 120 }, react: [{ on: 'cry', to: 'open' }], art: 'c0/balcony-door' },
    { id: 'train', preset: 'light', hit: { x: 290, y: 340, w: 90, h: 80 }, react: [{ on: { type: 'cry', within: 400 }, to: 'on' }], art: 'c0/moon-train' },
  ],
  perches: [
    { id: 'sill', node: 'sillTop', reachNode: 'R2' },
    { id: 'basket', node: 'basketTop', reachNode: 'R1', hidesMocha: true },
    { id: 'rod', node: 'rodTop', reachNode: 'R3' },
    { id: 'trainRoof', node: 'roofTop', reachNode: 'trainStep' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'trainStep', goal: true, visibleWhen: { part: 'curtain', in: ['open'] } }],
  baby: { start: 'R1', facing: 'r' },
  mocha: { start: 'sill' },
  // The engine fixture knows every word but 一起 (#128): linked for the rest of the page, Mocha
  // could no longer perch, and the curtain is pulled from a perch (the page itself offers none)
  words: ['beep', 'bye', 'no', 'wow', 'hug', 'plane', 'whoosh'],
  mischief: {
    text: '把摩卡捲進窗簾',
    when: { type: 'partEnter', id: 'curtain', when: { all: [{ part: 'curtain', in: ['closed'] }, { mochaAt: 'rod' }] } },
  },
  tudigong: { x: 340, y: 120, visibleWhen: { part: 'curtain', in: ['open'] }, hat: '斗笠' },
  solution: [{ mocha: 'basket' }, { wait: 'settle' }, { tap: 'curtain' }, { wait: 'goal' }],
});
