import { definePage } from '../define';

/**
 * The M4 engine II's toy pages (#128; GDD § 7 M4 item 34): linked mode (一起), the first steps
 * (`walk`) and the `lonely` creature 咻咻 — each a small, complete page, solver-green exactly as a
 * real page must be (`linked.test.ts`). They are the engine's proofs, not chapter pages (#133
 * writes 10-5 and 10-6); PageLab lists them as lab stages (`dev/labPages.ts`) with placeholder art.
 *
 * - `toy-party` (after 10-5 咻咻的派對): 咻咻 rains over its party, so every perch is wet and
 *   Mocha can't move; the bead is up in its cloud, out of sight. Say 不要！ to Mocha, the only thing
 *   he wants, and he cries — and learns 一起. Linked, Mocha walks **through the puddle for him**, 咻咻 (a
 *   `lonely` creature) comes down to follow them, and 抱抱 within reach makes it let go of the
 *   bead, which he picks up.
 * - `toy-steps` (after 10-6 離天空最近的地方): the railing ends one node short of the open deck.
 *   Cruising to its end he reaches for the 金鎖片 in 咻咻's cloud. Say 一起: tapped across, Mocha
 *   walks over and waits on the other side — `walk` unlocks, and he takes **three wobbly steps**
 *   to him, a line and a held world for each (§ 5.2's beat). Then 抱抱 to 咻咻.
 */

/** 一起: both babies cry, then Mocha leads him through the puddle to 咻咻. */
export const toyParty = definePage({
  id: 'toy-party', chapter: 10, index: 5, title: '咻咻的派對', difficulty: 4, backdrop: 'toy/party',
  nodes: [
    { id: 'A', x: 30, y: 440, height: 0 }, { id: 'B', x: 85, y: 440, height: 0 },
    { id: 'C', x: 140, y: 440, height: 0 },
    // A puddle of 咻咻's rain under its cloud: he crawls through it; Mocha walks it only linked, for him (C7)
    { id: 'P', x: 195, y: 440, height: 0, tags: ['wet'] },
    { id: 'D', x: 250, y: 440, height: 0 }, { id: 'E', x: 305, y: 440, height: 0 },
    { id: 'F', x: 360, y: 440, height: 0 },
    // Mocha's perches under the rain: the party lamp and the gift shelf
    { id: 'lamp', x: 50, y: 300, height: 2, tags: ['wet'] }, { id: 'shelf', x: 330, y: 300, height: 2, tags: ['wet'] },
    // 咻咻's cloud, raining over the middle of the room
    { id: 'cloud', x: 200, y: 210, height: 2 },
  ],
  edges: [
    { a: 'A', b: 'B', kind: 'crawl' }, { a: 'B', b: 'C', kind: 'crawl' }, { a: 'C', b: 'P', kind: 'crawl' },
    { a: 'P', b: 'D', kind: 'crawl' }, { a: 'D', b: 'E', kind: 'crawl' }, { a: 'E', b: 'F', kind: 'crawl' },
    { a: 'lamp', b: 'shelf', kind: 'jump' },
  ],
  parts: [],
  perches: [
    // Wet while 咻咻 rains overhead (C7): Mocha's fur puffs up, 「不要。」
    { id: 'lamp', node: 'lamp', reachNode: 'A', blockedWhen: { creature: 'shushu', at: 'cloud' } },
    { id: 'shelf', node: 'shelf', reachNode: 'F', blockedWhen: { creature: 'shushu', at: 'cloud' } },
  ],
  creatures: [
    // Lonely: linked, it comes down and follows the pair — at the far end of its party, where it sulks
    {
      id: 'shushu', positions: { cloud: 'cloud', e: 'E', f: 'F' }, initial: 'cloud', blocks: false, lonely: true,
      // Hugged (within a step and a half), it lets go of the bead and drifts to the end of the room
      react: [{ on: { type: 'hug', within: 90 }, to: 'f', drop: 'bead' }],
      art: 'toy/shushu',
    },
  ],
  // Up in the rain cloud nobody sees it; down at its party 咻咻 holds it tight
  attractors: [{ id: 'bead', kind: 'shiny', node: 'cloud', heldBy: 'shushu', goal: true, visibleWhen: { not: { creature: 'shushu', at: 'cloud' } } }],
  baby: { start: 'A', facing: 'r', growth: 2 },
  mocha: { start: 'lamp' },
  words: ['no', 'hug'],
  // Both crying (§ 4.4 10-5): he says 「……一起。」
  learns: { word: 'together', when: { event: 'cry' } },
  mischief: { text: '帶他們走到房間的盡頭', when: { type: 'lead', id: 'F' } },
  tudigong: { x: 250, y: 330, visibleWhen: { creature: 'shushu', at: 'f' }, hat: '' },
  solution: [{ wait: 1 }, { say: 'no' }, { wait: 'settle' }, { say: 'together' }, { floor: 'D' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'goal' }],
});

/** 第一步: Mocha waits across the open deck, and he walks to him — three wobbly steps. */
export const toySteps = definePage({
  id: 'toy-steps', chapter: 10, index: 6, title: '第一步', difficulty: 3, backdrop: 'toy/roof',
  nodes: [
    { id: 'D1', x: 30, y: 440, height: 0 },
    // The observation deck's railing: he stands and cruises along it to where it ends (R2)
    { id: 'R1', x: 85, y: 420, height: 1 }, { id: 'R2', x: 140, y: 420, height: 1 },
    // The open deck past the rail's end: nothing to hold on to — three steps, walking
    { id: 'S1', x: 195, y: 440, height: 0 }, { id: 'S2', x: 250, y: 440, height: 0 },
    { id: 'G', x: 305, y: 440, height: 0 }, { id: 'E', x: 360, y: 440, height: 0 },
    // Mocha's post over the railing; 咻咻's cloud past the deck's edge
    { id: 'post', x: 110, y: 300, height: 2 }, { id: 'cloud', x: 330, y: 250, height: 2 },
  ],
  edges: [
    { a: 'D1', b: 'R1', kind: 'climb' }, { a: 'R1', b: 'R2', kind: 'cruise' },
    { a: 'R2', b: 'S1', kind: 'walk' }, { a: 'S1', b: 'S2', kind: 'walk' }, { a: 'S2', b: 'G', kind: 'walk' },
    { a: 'G', b: 'E', kind: 'crawl' },
  ],
  parts: [],
  perches: [{ id: 'post', node: 'post', reachNode: 'R1' }],
  creatures: [
    {
      id: 'shushu', positions: { cloud: 'cloud', g: 'G', e: 'E' }, initial: 'cloud', blocks: false, lonely: true,
      react: [{ on: { type: 'hug', within: 90 }, to: 'e', drop: 'lock' }],
      art: 'toy/shushu',
    },
  ],
  attractors: [{ id: 'lock', kind: 'shiny', node: 'cloud', heldBy: 'shushu', goal: true }],
  baby: { start: 'D1', facing: 'r', growth: 2 },
  mocha: { start: 'post' },
  words: ['hug', 'together'],
  // Mocha waiting on the other side (§ 4.4 10-6): he lets go of the rail
  learns: { growth: 3, when: { event: 'lead', id: 'G' } },
  lines: {
    onEvent: [
      { when: { type: 'lead', id: 'G' }, line: 'c10p6.steps.1', pause: true },
      { when: { type: 'lead', id: 'G' }, line: 'c10p6.steps.2', pause: true },
      { when: { type: 'babyEnter', id: 'S1' }, line: 'c10p6.steps.3', pause: true },
      { when: { type: 'babyEnter', id: 'S2' }, line: 'c10p6.steps.4', pause: true },
      { when: { type: 'babyEnter', id: 'G' }, line: 'c10p6.steps.5', pause: true },
      { when: { type: 'babyEnter', id: 'G' }, line: 'c10p6.steps.6', pause: true },
      // 咻咻 let go of the 金鎖片 when hugged: he has it back
      { when: { type: 'grab', id: 'lock' }, line: 'c10p6.hug.2' },
      { when: { type: 'grab', id: 'lock' }, line: 'c10p6.hug.3' },
      { when: { type: 'grab', id: 'lock' }, line: 'c10p6.hug.4' },
    ],
  },
  // A gift (§ 4.4 10-6): it fires on any second 抱抱
  mischief: { text: '抱抱咻咻兩次', when: { type: 'hug', count: 2 } },
  tudigong: { x: 40, y: 330, visibleWhen: { creature: 'shushu', at: 'g' }, hat: '' },
  solution: [{ wait: 'settle' }, { say: 'together' }, { floor: 'G' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'goal' }],
});

/** The two, in GDD order. */
export const LINKED_TOYS = [toyParty, toySteps] as const;
