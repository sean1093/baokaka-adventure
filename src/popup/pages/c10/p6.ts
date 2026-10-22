import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 10-6 「離天空最近的地方」 · difficulty 3 · par 3 · treasure 金鎖片 · **第一步**:
 * chapter 10's spread (§ 2.9) and the book's last chapter page. 101's outdoor observation deck at
 * first light, the city under the clouds, the mountains round the basin going pink. 咻咻 hangs in
 * its cloud past the deck's far end, the 金鎖片 in it; the deck's railing runs from the door only part
 * of the way: past its end the deck is open — nothing to hold on to (three `walk` edges). Built on
 * #128's `toy-steps`.
 *
 * He sees the 金鎖片 and climbs up to the rail, cruises to its end and reaches (「要！要！」). Say 一起:
 * Mocha hops down to him. Tap the deck's far side: Mocha walks across and waits there (`lead`), and
 * 咻咻 comes down — 「沒有人說歡迎咻咻……」「寶咖咖放開了欄杆。」 — and he learns 第一步 (`learns:
 * { growth: 3, when: lead G }`): 「一步。」「兩步。」「三步。」, a held line for each wobbly step,
 * and Mocha 「走、走路了……他在走路！」. Say 抱抱 to 咻咻: it lets go of the 金鎖片 and floats up a little, calm —
 * 「……抱抱？」「小雲，慢慢變白、變軟了。」「金鎖片，回到了寶咖咖手上。」 (§ 5.2, each held) — and he
 * picks it up. **Photo of the first steps** (Mocha beside him, inside `photoRect`, +M). The
 * 淘氣 is a gift: any second 抱抱.
 *
 * ```
 *   scope (Mocha, the coin telescope)                                  cloud (咻咻, the 金鎖片)
 *   D1 (start) ═climb═ R1 ═cruise═ R2 (the rail ends) ┄walk┄ S1 ┄walk┄ S2 ┄walk┄ G ── E (the deck's end)
 * ```
 */
/** The hug that reached 咻咻: it is calm now (any other 抱抱 is just his arms up) */
const CALMED = { type: 'hug' as const, when: { creature: 'shushu', at: 'calm' } };

export default definePage({
  id: 'c10p6', chapter: 10, index: 6, title: '離天空最近的地方', difficulty: 3, backdrop: 'c10/observation-deck',
  spread: true,
  // The deck's far side: his three steps ending at Mocha, and 咻咻
  photoRect: { x: 196, y: 300, w: 194, h: 210 },
  nodes: [
    // By the deck's door, and up onto the railing's footing
    { id: 'D1', x: 28, y: 480, height: 0 },
    { id: 'R1', x: 82, y: 456, height: 1 }, { id: 'R2', x: 136, y: 456, height: 1 },
    // The open deck past the rail's end: nothing to hold on to — three steps, walking
    { id: 'S1', x: 190, y: 480, height: 0 }, { id: 'S2', x: 244, y: 480, height: 0 },
    { id: 'G', x: 298, y: 480, height: 0 }, { id: 'E', x: 352, y: 480, height: 0 },
    // Mocha's perch: the deck's coin telescope; 咻咻's cloud past the deck's far end
    { id: 'scopeTop', x: 40, y: 372, height: 2 }, { id: 'cloud', x: 318, y: 236, height: 2 },
    // Where 咻咻 floats, calm, once hugged: just over the deck's end (never nearer Mocha than the deck)
    { id: 'calmSky', x: 352, y: 380, height: 2 },
  ],
  edges: [
    { a: 'D1', b: 'R1', kind: 'climb' }, { a: 'R1', b: 'R2', kind: 'cruise' },
    { a: 'R2', b: 'S1', kind: 'walk' }, { a: 'S1', b: 'S2', kind: 'walk' }, { a: 'S2', b: 'G', kind: 'walk' },
    { a: 'G', b: 'E', kind: 'crawl' },
  ],
  parts: [],
  perches: [{ id: 'scope', node: 'scopeTop', reachNode: 'D1' }],
  creatures: [
    // 咻咻, lonely: linked, it comes down to the deck and keeps near the pair
    {
      id: 'shushu', positions: { cloud: 'cloud', g: 'G', e: 'E', calm: 'calmSky' }, initial: 'cloud', blocks: false, lonely: true,
      // Hugged, it lets go of the 金鎖片 and floats up a little, calm (white and soft)
      react: [{ on: { type: 'hug', within: 90 }, to: 'calm', drop: 'lock' }],
      art: 'common/shushu',
    },
  ],
  // The 金鎖片, in 咻咻's cloud: he sees it from everywhere and can't reach it
  attractors: [{ id: 'lock', kind: 'shiny', node: 'cloud', heldBy: 'shushu', goal: true }],
  baby: { start: 'D1', facing: 'r' },
  mocha: { start: 'scope' },
  // Mocha waiting on the other side (§ 4.4 10-6): he lets go of the rail
  learns: { growth: 3, when: { event: 'lead', id: 'G' } },
  lines: {
    onEvent: [
      // § 5.2 10-6 first steps: the world holds for each line
      { when: { type: 'lead', id: 'G' }, line: 'c10p6.steps.1', pause: true },
      { when: { type: 'lead', id: 'G' }, line: 'c10p6.steps.2', pause: true },
      { when: { type: 'babyEnter', id: 'S1' }, line: 'c10p6.steps.3', pause: true },
      { when: { type: 'babyEnter', id: 'S2' }, line: 'c10p6.steps.4', pause: true },
      { when: { type: 'babyEnter', id: 'G' }, line: 'c10p6.steps.5', pause: true },
      { when: { type: 'babyEnter', id: 'G' }, line: 'c10p6.steps.6', pause: true },
      // The hug that calms 咻咻 (his own 「抱抱。」 is his word's bubble): it lets go of the 金鎖片, the
      // world held for each line, so they are read before he picks it up and the page ends
      { when: CALMED, line: 'c10p6.hug.2', pause: true },
      { when: CALMED, line: 'c10p6.hug.3', pause: true },
      { when: CALMED, line: 'c10p6.hug.4', pause: true },
    ],
  },
  // A gift (§ 4.4 10-6): it fires on any second 抱抱
  mischief: { text: '抱抱咻咻兩次', when: { type: 'hug', count: 2 } },
  // On the deck's coin telescope's stand, seen once 咻咻 has come down
  tudigong: { x: 96, y: 330, visibleWhen: { not: { creature: 'shushu', at: 'cloud' } }, hat: '清潔帽' },
  solution: [{ wait: 'settle' }, { say: 'together' }, { floor: 'G' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'goal' }],
});
