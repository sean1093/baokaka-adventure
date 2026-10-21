import { definePage, loopAttach } from '../../core/define';

/**
 * GDD § 4.4, page 8-4 「北投圖書館」 (the wooden 北投 library) · difficulty 4 · par 4. Two floors: the
 * stacks on the ground floor, the reading room upstairs with its balcony at the left end. Between
 * them runs the library's book lift — a belt (a **loop**, four slots: the ground floor, up the left
 * side, the reading room, down the right) carrying a book tray, a step up off the floor and a step
 * under the reading room. Nothing turns the belt but the pinwheel in the window box outside the
 * ground floor's left window (a **blowable**, four states, `coupled` to the belt: each turn of the
 * pinwheel moves the tray a slot). The window is shut: no wind gets through until it's open (a
 * **flap**; the pinwheel is `lockedWhen` it's closed).
 *
 * Mocha is on the bookcase by the door, and Baokaka cuddles him there; the bead lies in the reading
 * room's stacks, out of sight from downstairs. Mocha onto the balcony rail: Baokaka climbs onto the
 * book tray (the nearest he can get) and reaches up and left for him — **facing the pinwheel**. Open
 * the window and 咻—— twice: the pinwheel spins and the belt carries him up to the reading room. He
 * climbs onto the balcony to Mocha, sees the bead in the stacks and climbs back across the tray to it.
 * Said while he faces the door (cuddling Mocha on the bookcase), 咻—— blows the other way: facing
 * matters. The 淘氣: spin the pinwheel eight times (he rides round and round).
 *
 * ```
 *   rail (Mocha, on the balcony)                                         bookcase (Mocha)
 *   BAL ═climb═ T@2 (the reading room) ═climb═ U1 ── U2 ── U3 (bead, seen upstairs)
 *   pinwheel (window box)   T@1 ╱  ╲ T@3   (belt: 0 ground · 1 up · 2 reading room · 3 down)
 *   [window]                    T@0 ═climb═ G3 ── G2 ── G1 (start)
 * ```
 */
const BELT = ['0', '1', '2', '3'];
/** The belt's slots: the ground floor, up the left side, the reading room, down the right side. */
const SLOTS: [number, number][] = [[190, 464], [154, 398], [190, 332], [226, 398]];
const AT = (state: string) => ({ part: 'belt', in: [state] });
/** Upstairs: on the balcony, in the reading room, or on the tray when it's there. */
const UPSTAIRS = { any: [...['BAL', 'U1', 'U2', 'U3'].map((id) => ({ babyAt: id })), { all: [{ babyAt: 'T' }, AT('2')] }] };

export default definePage({
  id: 'c8p4', chapter: 8, index: 4, title: '北投圖書館', difficulty: 4, backdrop: 'c8/library',
  nodes: [
    // The ground floor's stacks, from the door (right) to the book lift
    { id: 'G1', x: 350, y: 486, height: 0 }, { id: 'G2', x: 295, y: 486, height: 0 }, { id: 'G3', x: 240, y: 486, height: 0 },
    // The book tray on the belt
    { id: 'T', x: 190, y: 464, height: 1, attach: loopAttach('belt', BELT, SLOTS, 0) },
    // Upstairs: the balcony (left), the reading room's stacks (right)
    { id: 'BAL', x: 60, y: 310, height: 1 },
    { id: 'U1', x: 260, y: 310, height: 1 }, { id: 'U2', x: 310, y: 310, height: 1 }, { id: 'U3', x: 360, y: 310, height: 1 },
    // Mocha's perches: the bookcase by the door, the balcony rail
    { id: 'caseTop', x: 366, y: 404, height: 2 }, { id: 'railTop', x: 40, y: 262, height: 2 },
  ],
  edges: [
    { a: 'G1', b: 'G2', kind: 'crawl' }, { a: 'G2', b: 'G3', kind: 'crawl' },
    // Onto the tray at the ground floor; off it in the reading room
    { a: 'G3', b: 'T', kind: 'climb', when: AT('0') },
    { a: 'T', b: 'BAL', kind: 'climb', when: AT('2') }, { a: 'T', b: 'U1', kind: 'climb', when: AT('2') },
    { a: 'U1', b: 'U2', kind: 'crawl' }, { a: 'U2', b: 'U3', kind: 'crawl' },
    { a: 'caseTop', b: 'railTop', kind: 'jump' },
  ],
  parts: [
    // The ground floor's left window: open it, and the wind of 咻—— reaches the pinwheel
    { id: 'window', preset: 'flap', hit: { x: 20, y: 424, w: 56, h: 56 }, art: 'c8/library-window' },
    // The pinwheel in the window box: 咻—— turns it a quarter, and the belt a slot with it. In his
    // cone from every slot of the tray facing left (≤ 138 units), from nowhere on either floor
    { id: 'pinwheel', preset: 'blowable', states: BELT, coupled: ['belt'], lockedWhen: { part: 'window', in: ['closed'] },
      hit: { x: 62, y: 372, w: 56, h: 56 }, art: 'c8/pinwheel' },
    // The book lift's belt: only the pinwheel drives it
    { id: 'belt', preset: 'loop', states: BELT, input: 'none', hit: { x: 130, y: 320, w: 120, h: 160 }, art: 'c8/book-belt' },
  ],
  perches: [
    { id: 'bookcase', node: 'caseTop', reachNode: 'G1' },
    // Up on the balcony: from downstairs he gets no nearer than the tray
    { id: 'rail', node: 'railTop', reachNode: 'BAL' },
  ],
  creatures: [],
  // The bead in the reading room's stacks, seen upstairs
  attractors: [{ id: 'bead', kind: 'shiny', node: 'U3', goal: true, visibleWhen: UPSTAIRS }],
  baby: { start: 'G1', facing: 'r' },
  mocha: { start: 'bookcase' },
  mischief: { text: '把風車吹轉八次', when: { type: 'partEnter', id: 'pinwheel', count: 8 } },
  // Out on the balcony, seen once the window below is open (the wind's way in)
  tudigong: { x: 112, y: 272, visibleWhen: { part: 'window', in: ['open'] }, hat: '毛巾' },
  solution: [
    { mocha: 'rail' }, { tap: 'window' }, { wait: 'settle' }, { say: 'whoosh' }, { say: 'whoosh' }, { wait: 'goal' },
  ],
});
