import { definePage } from '../../core/define';

/**
 * GDD § 4.3, page 0-2 「沙發山」 (sofa mountain) · difficulty 1 · par 1. No shiny is in sight, so the
 * TV's standby light (priority 4) wins: Baokaka crawls over to the TV and watches it, swaying
 * (「好看！」, his bubble a music note). The bead is hidden behind the floor cushion at the sofa's
 * foot; tapping the cushion open shows it, his bubble flips from the note to the bead (the first
 * change of mind, § 2.2.6), and he turns round and crawls back for it. Dad is asleep on the sofa
 * under his newspaper: opening it is the 淘氣 (he sleep-talks 「叫……爸爸……」). Mocha is asleep in
 * the background art, not an actor. The scripted bubble highlight is a view feature (#106).
 */
export default definePage({
  id: 'c0p2', chapter: 0, index: 2, title: '沙發山', difficulty: 1, backdrop: 'c0/living-room',
  nodes: [
    { id: 'sofaFoot', x: 62, y: 470, height: 0 },   // behind the floor cushion, at the sofa's foot
    { id: 'rug1', x: 128, y: 470, height: 0 }, { id: 'rug2', x: 194, y: 470, height: 0 }, { id: 'rug3', x: 260, y: 470, height: 0 },
    { id: 'tvFront', x: 326, y: 470, height: 0 },   // nose to the screen
  ],
  edges: [
    { a: 'sofaFoot', b: 'rug1', kind: 'crawl' }, { a: 'rug1', b: 'rug2', kind: 'crawl' },
    { a: 'rug2', b: 'rug3', kind: 'crawl' }, { a: 'rug3', b: 'tvFront', kind: 'crawl' },
  ],
  parts: [
    // The floor cushion leaning on the sofa's foot: closed, it hides the bead
    { id: 'cushion', preset: 'flap', hit: { x: 24, y: 412, w: 78, h: 70 }, art: 'c0/sofa-cushion' },
    // The TV's red standby light: always on, not a touchable (it is what he wants until something better shows)
    { id: 'tv', preset: 'light', initial: 'on', attractor: 'tvGlow', hit: { x: 292, y: 286, w: 80, h: 62 }, art: 'c0/tv' },
    // Dad's newspaper, over his face on the sofa back (a toy: the 淘氣)
    { id: 'newspaper', preset: 'flap', hit: { x: 76, y: 270, w: 84, h: 60 }, art: 'c0/newspaper' },
  ],
  perches: [],
  creatures: [],
  attractors: [
    { id: 'bead', kind: 'shiny', node: 'sofaFoot', goal: true, visibleWhen: { part: 'cushion', in: ['open'] } },
    { id: 'tvGlow', kind: 'light', node: 'tvFront', activeWhen: { part: 'tv', in: ['on'] } },
  ],
  baby: { start: 'rug2', facing: 'r' },
  mocha: { start: null },
  mischief: { text: '掀開爸爸的報紙', when: { type: 'partEnter', id: 'newspaper', when: { part: 'newspaper', in: ['open'] } } },
  tudigong: { x: 214, y: 168, hat: '' },   // in the family photo on the wall; always visible
  solution: [{ tap: 'cushion' }, { wait: 'goal' }],
  lines: {
    onEvent: [{ when: { type: 'partEnter', id: 'newspaper', when: { part: 'newspaper', in: ['open'] } }, line: 'c0p2.dad.1' }],
  },
});
