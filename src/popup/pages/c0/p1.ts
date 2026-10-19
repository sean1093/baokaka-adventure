import { definePage } from '../../core/define';

/**
 * GDD § 4.3, page 0-1 「嬰兒床」 (the crib) · difficulty 1 · par 1. The first page of the game:
 * the bead lies on the rug beyond the crib; Baokaka crawls to the crib side nearest it and reaches
 * (「要！要！」). Pulling the crib-rail tab down from the page's bottom edge opens the pillow slope,
 * and he crawls down to the bead. Mocha is asleep in the background art, not an actor. The scripted
 * ghost hand is a view feature (#100 / #106); the data stays pure.
 */
export default definePage({
  id: 'c0p1', chapter: 0, index: 1, title: '嬰兒床', difficulty: 1, backdrop: 'c0/nursery-night',
  nodes: [
    { id: 'crib1', x: 70, y: 330, height: 0 }, { id: 'crib2', x: 150, y: 330, height: 0 },   // the mattress, inside the rail
    { id: 'pillow', x: 205, y: 390, height: 0 },                                              // the pillow slope over the lowered rail
    { id: 'rug1', x: 260, y: 440, height: 0 }, { id: 'rug2', x: 320, y: 440, height: 0 },
  ],
  edges: [
    { a: 'crib1', b: 'crib2', kind: 'crawl' },
    { a: 'crib2', b: 'pillow', kind: 'crawl', when: { part: 'crib-rail', in: ['down'] } },
    { a: 'pillow', b: 'rug1', kind: 'crawl' }, { a: 'rug1', b: 'rug2', kind: 'crawl' },
  ],
  parts: [
    { id: 'crib-rail', preset: 'tab', states: ['up', 'down'], initial: 'up', input: 'drag-linear',
      track: { from: [150, 480], to: [150, 540] }, hit: { x: 96, y: 476, w: 108, h: 64 },   // pulled downward from the bottom edge
      art: 'c0/crib-rail' },
    { id: 'mobile', preset: 'prop', states: ['still', 'spin'], hit: { cx: 110, cy: 150, r: 40 }, art: 'c0/crib-mobile' },
  ],
  perches: [],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'rug2', goal: true }],
  baby: { start: 'crib1', facing: 'r' },
  mocha: { start: null },
  mischief: { text: '讓床鈴轉起來', when: { type: 'partEnter', id: 'mobile', when: { part: 'mobile', in: ['spin'] } } },
  tudigong: { x: 330, y: 110, hat: '' },   // in the street shrine seen through the window; always visible, no hat in the prologue
  solution: [{ set: 'crib-rail', to: 'down' }, { wait: 'goal' }],
});
