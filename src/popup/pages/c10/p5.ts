import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 10-5 「咻咻的派對」 · difficulty 4 · par 5 · **learn 一起**. 101's roof terrace
 * before dawn: 咻咻's sad party, made of everything it ever blew away (balloons, a paper banner, a
 * birthday cake on a little table, a string of paper lanterns). 咻咻 sits in its cloud over the table
 * and cries rain: puddles on the floor, and both of Mocha's perches are `wet` (C7), so he can't move.
 * Built on #128's `toy-party`.
 *
 * He cuddles Mocha on the party lamp at the near end. 不要！: he wants the lanterns instead, and
 * crawls under them to watch; 不要！ again (or 哇！, the lanterns off): nothing left to want, and he
 * cries — the cloud is crying too — and says 「……一起。」 (learns 一起 on the cry). Say 一起: Mocha
 * hops down beside him, and they are linked. Tap the floor past the puddle: Mocha walks **through the
 * puddle for him** (C7 suspended), Baokaka following, and 咻咻 — `lonely` — comes down off its cloud
 * to them. 抱抱: it lets go of the bead (it held it) and floats up toward the deck (10-6), and he
 * picks the bead up. The 淘氣: lead them round 咻咻's table, all four corners: the cake's candles light.
 *
 * ```
 *   lamp (Mocha; wet while 咻咻 rains) ─────────────jump───────────── gift (Mocha; wet)
 *                                          cloud (咻咻, the bead held)        Q2 ──── Q3
 *   A (start) ── B (under the lanterns) ── P (puddle) ── Q1 ─ (table) ─ Q4    (the ring round the table)
 * ```
 */
const RAINING = { creature: 'shushu', at: 'cloud' };
const RING = ['Q1', 'Q2', 'Q3', 'Q4'];
/** The hug that reached 咻咻: it has let go of the bead and floated up (any other 抱抱 is just his arms up) */
const LET_GO = { type: 'hug' as const, when: { creature: 'shushu', at: 'up' } };

export default definePage({
  id: 'c10p5', chapter: 10, index: 5, title: '咻咻的派對', difficulty: 4, backdrop: 'c10/roof-party',
  nodes: [
    // The terrace's floor, left to right; the puddle under the cloud's edge
    { id: 'A', x: 40, y: 486, height: 0 }, { id: 'B', x: 100, y: 486, height: 0 },
    { id: 'P', x: 160, y: 486, height: 0, tags: ['wet'] },
    // The ring round 咻咻's party table: front left, back left, back right, front right
    { id: 'Q1', x: 218, y: 494, height: 0 }, { id: 'Q2', x: 236, y: 420, height: 0 },
    { id: 'Q3', x: 330, y: 420, height: 0 }, { id: 'Q4', x: 348, y: 494, height: 0 },
    // 咻咻's rain cloud over the table (unconnected)
    { id: 'cloud', x: 284, y: 214, height: 2 },
    // Mocha's perches under the rain: the party lamp, the gift table's stack of presents
    { id: 'lampTop', x: 52, y: 352, height: 2, tags: ['wet'] }, { id: 'giftTop', x: 370, y: 352, height: 2, tags: ['wet'] },
  ],
  edges: [
    { a: 'A', b: 'B', kind: 'crawl' }, { a: 'B', b: 'P', kind: 'crawl' }, { a: 'P', b: 'Q1', kind: 'crawl' },
    { a: 'Q1', b: 'Q2', kind: 'crawl' }, { a: 'Q2', b: 'Q3', kind: 'crawl' }, { a: 'Q3', b: 'Q4', kind: 'crawl' },
    { a: 'Q4', b: 'Q1', kind: 'crawl' },
    { a: 'lampTop', b: 'giftTop', kind: 'jump' },
  ],
  parts: [
    // 咻咻's birthday cake: a candle lights at each corner of the table they are led to (the 淘氣)
    { id: 'cake', preset: 'section', states: ['0', '1', '2', '3', '4'], hit: { x: 256, y: 428, w: 56, h: 56 }, art: 'c10/cake',
      react: RING.map((id) => ({ on: { type: 'lead' as const, id }, when: { not: { flag: id } }, to: 'next', setFlag: id })) },
  ],
  perches: [
    // Wet while 咻咻 rains overhead (C7): Mocha's fur puffs up, 「不要。」
    { id: 'lamp', node: 'lampTop', reachNode: 'A', blockedWhen: RAINING },
    { id: 'gift', node: 'giftTop', reachNode: 'Q3', blockedWhen: RAINING },
  ],
  creatures: [
    // 咻咻: lonely — linked, it comes down off its cloud and follows the pair round its table
    {
      id: 'shushu', positions: { cloud: 'cloud', q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4', up: 'offpage' }, initial: 'cloud',
      blocks: false, lonely: true,
      // Hugged (within a step and a half), it lets go of the bead and floats up toward the deck
      react: [{ on: { type: 'hug', within: 90 }, to: 'up', drop: 'bead' }],
      art: 'common/shushu',
    },
  ],
  attractors: [
    // Up in the rain cloud nobody sees it; down at its party 咻咻 holds it tight
    { id: 'bead', kind: 'shiny', node: 'cloud', heldBy: 'shushu', goal: true, visibleWhen: { not: RAINING } },
  ],
  baby: { start: 'A', facing: 'r' },
  mocha: { start: 'lamp' },
  // Both crying (§ 4.4 10-5): he says 「……一起。」
  learns: { word: 'together', when: { event: 'cry' } },
  mischief: { text: '帶他們繞咻咻的桌子一圈', when: { type: 'partEnter', id: 'cake', when: { part: 'cake', in: ['4'] } } },
  // On the party banner, seen once 咻咻 has come down off its cloud
  tudigong: { x: 196, y: 300, visibleWhen: { not: RAINING }, hat: '清潔帽' },
  solution: [
    { wait: 1 }, { say: 'no' }, { wait: 3 }, { say: 'together' },
    { floor: 'P' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'goal' },
  ],
  lines: {
    intro: ['c10p5.party.1', 'c10p5.party.2', 'c10p5.party.3'],
    onEvent: [
      // The hug that reached 咻咻 (it has let go and floats up): each line held, read before he picks the bead up
      { when: LET_GO, line: 'c10p5.hug.1', pause: true },
      { when: LET_GO, line: 'c10p5.hug.2', pause: true },
      { when: { type: 'partEnter', id: 'cake', when: { part: 'cake', in: ['4'] } }, line: 'c10p5.mocha.1' },
    ],
  },
});
