import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 6-5 「塔台」 (the control tower's catwalk) · difficulty 4 · par 4. The combination
 * page. High up on the gallery round the tower cab, at night: a signal **searchlight** on its
 * mount (`wheel`) throws a pool of light onto the catwalk (a `light` attractor, `nodeBy`, as 2-2's
 * spotlight); a radio sits on the sill (a `prop`: 「Over。」); the runway lights are out, and the
 * bead lies at the catwalk's far end, by the door, seen only once they light it.
 *
 * Mocha on the antenna is the best thing in sight: Baokaka cuddles him at the near end. The light
 * is a leash only while Mocha is out of sight (a light is worth less than Mocha, § 2.2.1), and the
 * one place to hide is the crate of spare runway bulbs (C9) — but a flock of pigeons dozes on the
 * catwalk round it, across his way, and Mocha won't land among them (`blockedWhen`). 飛機！ lifts
 * them off; Mocha curls up in the crate (or 不要！ him: the pool lands on the railing, so he only
 * ever reaches up under it and the refusal holds); Baokaka follows the searchlight's pool. Swing it
 * to the catwalk's far end, and from there his 哇！ reaches the runway lights' switch box (≤ 160):
 * the runway lights up, the bead glints by the door, and he crawls to it. The radio's first
 * 「Over。」 plays the tower's log (§ 5.2 6-5: the cloud that asked to take off — the chapter's 咻咻
 * beat). The 淘氣: talk on the radio three times.
 *
 * ```
 *   antenna (Mocha) ─jump─ crate (Mocha hides: box; not while the pigeons doze round it)
 *   W1 ── W2 ── W3 ── W4 (pigeons) ── W5 ── W6 (bead, seen with the runway lit)
 *   searchlight (its pool on the railing): near → over W2 · mid → over W4 · far → over W5 · sky → the windsock (土地公)
 *   runway: 哇！ from W5 or W6
 * ```
 */
const RUNWAY_ON = { part: 'runway', in: ['on'] };

export default definePage({
  id: 'c6p5', chapter: 6, index: 5, title: '塔台', difficulty: 4, backdrop: 'c6/tower-catwalk',
  nodes: [
    // The catwalk round the tower cab, from the antenna mast (left) to the door (right)
    { id: 'W1', x: 36, y: 476, height: 0 }, { id: 'W2', x: 94, y: 476, height: 0 },
    { id: 'W3', x: 152, y: 476, height: 0 }, { id: 'W4', x: 210, y: 476, height: 0 },
    { id: 'W5', x: 268, y: 476, height: 0 }, { id: 'W6', x: 336, y: 476, height: 0 },
    // Unconnected: where the searchlight's pool lands — on the catwalk's railing (over W2, W4, W5;
    // he can only crawl up under it and reach) or, pointed at the sky, on the windsock
    { id: 'rail2', x: 94, y: 428, height: 1 }, { id: 'rail4', x: 210, y: 428, height: 1 },
    { id: 'rail5', x: 268, y: 428, height: 1 }, { id: 'windsock', x: 310, y: 170, height: 2 },
    // Mocha's perches: the antenna mast, the crate of spare bulbs
    { id: 'antennaTop', x: 46, y: 300, height: 2 }, { id: 'crateTop', x: 176, y: 414, height: 1 },
  ],
  edges: [
    { a: 'W1', b: 'W2', kind: 'crawl' }, { a: 'W2', b: 'W3', kind: 'crawl' }, { a: 'W3', b: 'W4', kind: 'crawl' },
    { a: 'W4', b: 'W5', kind: 'crawl' }, { a: 'W5', b: 'W6', kind: 'crawl' },
    { a: 'antennaTop', b: 'crateTop', kind: 'jump' },
  ],
  parts: [
    // The signal searchlight on its mount: turn it to aim its pool of light
    { id: 'searchlight', preset: 'wheel', states: ['near', 'mid', 'far', 'sky'], initial: 'near', input: 'drag-rotary',
      center: [190, 528], radius: 30, hit: { cx: 190, cy: 528, r: 30 }, art: 'c6/searchlight' },
    // The runway lights' switch box, out past the rail: 哇！ reaches it only from the far end (≤ 160)
    { id: 'runway', preset: 'light', hit: { x: 298, y: 302, w: 64, h: 56 }, art: 'c6/runway-lights',
      react: [{ on: 'wow', to: 'toggle' }] },
    // The tower's radio on the sill: a discovery (the 淘氣); tap it and it answers 「Over。」
    { id: 'radio', preset: 'prop', states: ['quiet', 'over'], hit: { x: 50, y: 380, w: 56, h: 56 }, art: 'c6/tower-radio' },
  ],
  perches: [
    { id: 'antenna', node: 'antennaTop', reachNode: 'W1' },
    // The crate of spare runway bulbs: Mocha curls up inside, out of sight (C9) — but not with the
    // pigeons dozing round it
    { id: 'crate', node: 'crateTop', reachNode: 'W3', hidesMocha: true, blockedWhen: { creature: 'pigeons', at: 'walk' } },
  ],
  creatures: [
    // A flock of pigeons dozing on the catwalk round the crate: they block his way and Mocha's
    // hiding place; 飛機！ lifts them off, and the next one brings them back
    { id: 'pigeons', positions: { walk: 'W4', sky: 'offpage' }, initial: 'walk', winged: true, art: 'common/pigeon' },
  ],
  attractors: [
    { id: 'glow', kind: 'light', node: 'rail2', nodeBy: { part: 'searchlight', map: { near: 'rail2', mid: 'rail4', far: 'rail5', sky: 'windsock' } } },
    { id: 'bead', kind: 'shiny', node: 'W6', goal: true, visibleWhen: RUNWAY_ON },
  ],
  baby: { start: 'W2', facing: 'l' },
  mocha: { start: 'antenna' },
  mischief: {
    text: '用無線電說三次 Over',
    when: { type: 'partEnter', id: 'radio', count: 3, when: { part: 'radio', in: ['over'] } },
  },
  // On the windsock, caught in the searchlight pointed at the sky
  tudigong: { x: 310, y: 160, visibleWhen: { part: 'searchlight', in: ['sky'] }, hat: '機場背心' },
  solution: [
    { say: 'plane' }, { mocha: 'crate' }, { wait: 'settle' }, { set: 'searchlight', to: 'far' }, { wait: 'settle' },
    { say: 'wow' }, { wait: 'goal' },
  ],
  lines: {
    // § 5.2 6-5: the tower's log, the first time the radio answers (the chapter's 咻咻 beat)
    onEvent: [
      { when: { type: 'partEnter', id: 'radio', when: { part: 'radio', in: ['over'] } }, line: 'c6p5.tower.1' },
      { when: { type: 'partEnter', id: 'radio', when: { part: 'radio', in: ['over'] } }, line: 'c6p5.tower.2' },
    ],
  },
});
