import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 5-1 「往劍潭」 (a 淡水信義線 car in the tunnel before 劍潭) · difficulty 2 · par 3.
 * Chapter 5's ride page: a warm-up that reviews 哇！, 不要！ and Mocha's lure (GDD § 4.2 page 1).
 * The car's lights are out in the tunnel. In the dark the brightest thing is a dozing passenger's
 * phone, glowing in his lap — a **decoy**: he crawls under it and reaches up forever. The bead is
 * somewhere in the dark car, seen only with the lights on, and the lights hang at the far end, out
 * of his 哇！'s reach from the phone. Send Mocha up onto the luggage rack at the far end, then say
 * 不要！ to the phone: he wants Mocha, crawls as near as he can (the end of the car) and reaches up.
 * From there his 哇！ switches the lights on — the phone fades into the light, the bead shines by
 * the door. The 淘氣: the lights off and on, five switches: the passengers blink.
 *
 * ```
 *   phone (decoy, in the dark)  strap (Mocha)                  rack (Mocha; reaches from C6)
 *   C1 ── C2 ── C3 ── C4 ── C5 ── C6 ── C7 (bead, seen with the lights on)
 *                               lights (哇！ from C5 … C7)
 * ```
 */
const LIGHTS_ON = { part: 'lights', in: ['on'] };

export default definePage({
  id: 'c5p1', chapter: 5, index: 1, title: '往劍潭', difficulty: 2, backdrop: 'c5/red-car',
  nodes: [
    // The car's floor, from the dozing passenger's seat (left) to the doors (right)
    { id: 'C1', x: 34, y: 476, height: 0 },           // right under the phone
    { id: 'C2', x: 90, y: 476, height: 0 }, { id: 'C3', x: 146, y: 476, height: 0 },
    { id: 'C4', x: 202, y: 476, height: 0 }, { id: 'C5', x: 258, y: 476, height: 0 },
    { id: 'C6', x: 314, y: 476, height: 0 }, { id: 'C7', x: 362, y: 476, height: 0 },
    { id: 'phoneLap', x: 44, y: 380, height: 2 },     // unconnected: the phone in the passenger's lap
    { id: 'paxSeat', x: 60, y: 400, height: 1 },      // unconnected: the dozing passengers' seat
    { id: 'seatEnd', x: 318, y: 420, height: 1 },     // unconnected: the 博愛座 under the rack
    // Mocha's perches: a hand strap, the luggage rack over the end seat
    { id: 'strapTop', x: 96, y: 230, height: 2 }, { id: 'rackTop', x: 318, y: 270, height: 2 },
  ],
  edges: [
    { a: 'C1', b: 'C2', kind: 'crawl' }, { a: 'C2', b: 'C3', kind: 'crawl' }, { a: 'C3', b: 'C4', kind: 'crawl' },
    { a: 'C4', b: 'C5', kind: 'crawl' }, { a: 'C5', b: 'C6', kind: 'crawl' }, { a: 'C6', b: 'C7', kind: 'crawl' },
    { a: 'strapTop', b: 'rackTop', kind: 'jump' },
  ],
  parts: [
    // The car's lights, out in the tunnel: 哇！ from the far end (≤ 160 units: C5 … C7) switches them
    { id: 'lights', preset: 'light', hit: { x: 262, y: 300, w: 96, h: 56 }, art: 'c5/car-lights',
      react: [{ on: 'wow', to: 'toggle' }] },
  ],
  perches: [
    // A hand strap: under it he is out of 哇！'s reach of the lights
    { id: 'strap', node: 'strapTop', reachNode: 'C2' },
    // The rack over the end seat: he can only get as near as C6, and reaches up
    { id: 'rack', node: 'rackTop', reachNode: 'seatEnd' },
  ],
  creatures: [
    // The dozing passengers: they blink when the lights come on
    { id: 'passengers', positions: { doze: 'paxSeat', blink: 'paxSeat' }, initial: 'doze', blocks: false,
      react: [
        { on: { type: 'partEnter', id: 'lights', state: 'on' }, to: 'blink' },
        { on: { type: 'partEnter', id: 'lights', state: 'off' }, to: 'doze' },
      ], art: 'c5/passengers' },
  ],
  attractors: [
    // The phone glows in the dark — and fades into the light
    { id: 'phone', kind: 'shiny', node: 'phoneLap', decoy: true, visibleWhen: { part: 'lights', in: ['off'] }, art: 'c5/phone' },
    { id: 'bead', kind: 'shiny', node: 'C7', goal: true, visibleWhen: LIGHTS_ON },
  ],
  baby: { start: 'C3', facing: 'l' },
  mocha: { start: 'strap' },
  // Lights off, on, off, on, off … five switches: the passengers blink
  mischief: { text: '把車廂的燈開開關關五次', when: { type: 'partEnter', id: 'lights', count: 5 } },
  // On the route map over the doors, seen once the lights are on
  tudigong: { x: 250, y: 250, visibleWhen: LIGHTS_ON, hat: '鴨舌帽' },
  solution: [{ mocha: 'rack' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'wow' }, { wait: 'goal' }],
  lines: {
    // 廣播姊姊's next ride line (§ 5.3, cycling on from 4-1's)
    intro: ['rec.pa.ride.3'],
  },
});
