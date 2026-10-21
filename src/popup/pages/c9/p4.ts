import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 9-4 「漁人碼頭」 (Fisherman's Wharf, the 情人橋 in the backdrop) · difficulty 4 ·
 * par 4. The wharf's boardwalk runs out over the tidal flat; past its lamp it is shut for repairs but
 * for a plank along the railing (a `cruise` edge: he stands and sidesteps along it). Across the flat is
 * the far pier, with the 店員小哥's ice-cream kiosk and a mooring bollard. A big sun dial on the
 * boardwalk (a **wheel**: `dawn` · `noon` · `sunset`) sets the tide (a **lift**, the water) and the
 * dinghy moored below (a **lift** whose node drifts with it): at dawn the tide is out, the dinghy sits
 * on the mud and the stepping stones show; at noon it floats a step under the boardwalk's end; at sunset
 * the flood drifts it across to the far pier.
 *
 * He cuddles Mocha on the boardwalk's lamp. Turn the sun to dawn: the stones come out and Mocha can
 * cross (they're `wet` unless the tide is out, C7). Mocha onto the kiosk's awning — the 店員小哥's
 * chapter 9 cameo (「叮咚～歡迎光臨！」「……碼頭也是你們的？」「我們是連鎖的。」): Baokaka stands and
 * cruises along the railing to the boardwalk's end and reaches. Noon: the dinghy floats up to him and
 * he climbs in. Sunset: it drifts across with him; he crawls onto the pier, sees the bead hanging on the
 * bollard and reaches up for it (`reachHigh`). The 淘氣: turn the sun to sunset and back three times.
 *
 * ```
 *   lamp (Mocha) ─jump─ stone (Mocha; wet unless dawn) ─jump─ kiosk (Mocha, the 店員小哥's ice-cream kiosk)
 *   W1 (start) ── W2 ═cruise═ W3 (the boardwalk's end) ═(noon: climb)═ D (dinghy) ═(sunset: crawl)═ P1 ·jump· post (bead, height 1)
 *   dial: dawn (dinghy on the mud, stones out) · noon (dinghy at W3) · sunset (dinghy at P1)
 * ```
 */
const TIDE = ['dawn', 'noon', 'sunset'];
const SUN = (...states: string[]) => ({ part: 'dial', in: states });
/** A part that follows the sun dial's tide. */
const follows = (id: string, art: string, hit: { x: number; y: number; w: number; h: number }) => ({
  id, preset: 'lift' as const, states: TIDE, initial: 'noon', hit, art,
  react: TIDE.map((s) => ({ on: { type: 'partEnter' as const, id: 'dial', state: s }, to: s })),
});

export default definePage({
  id: 'c9p4', chapter: 9, index: 4, title: '漁人碼頭', difficulty: 4, backdrop: 'c9/fishermans-wharf',
  nodes: [
    // The boardwalk, out to its end over the flat
    { id: 'W1', x: 36, y: 420, height: 1 }, { id: 'W2', x: 92, y: 420, height: 1 }, { id: 'W3', x: 164, y: 420, height: 1 },
    // The dinghy, riding the tide
    { id: 'D', x: 212, y: 442, height: 1, attach: { part: 'dinghy', pos: { dawn: [196, 512], noon: [212, 442], sunset: [290, 434] } } },
    // The far pier, and the mooring bollard the bead hangs on
    { id: 'P1', x: 336, y: 434, height: 1 }, { id: 'post', x: 370, y: 392, height: 1 },
    // Mocha's perches: the boardwalk's lamp, the stepping stone on the flat, the ice-cream kiosk's awning
    { id: 'lampTop', x: 52, y: 340, height: 2 }, { id: 'stoneTop', x: 258, y: 500, height: 2, tags: ['wet'] },
    { id: 'kioskTop', x: 340, y: 352, height: 2 },
  ],
  edges: [
    { a: 'W1', b: 'W2', kind: 'crawl' },
    // The boardwalk shut for repairs: the plank along the railing, standing and holding on
    { a: 'W2', b: 'W3', kind: 'cruise' },
    // Into the dinghy when it floats a step under the boardwalk's end
    { a: 'W3', b: 'D', kind: 'climb', when: SUN('noon') },
    // Out of it onto the far pier when the flood has drifted it across
    { a: 'D', b: 'P1', kind: 'crawl', when: SUN('sunset') },
    // The bollard: a cat's hop (standing beside it, he can reach the bead)
    { a: 'P1', b: 'post', kind: 'jump' },
    { a: 'lampTop', b: 'stoneTop', kind: 'jump' }, { a: 'stoneTop', b: 'kioskTop', kind: 'jump' },
  ],
  parts: [
    // The sun dial: turn the sun, and the tide follows
    { id: 'dial', preset: 'wheel', states: TIDE, initial: 'noon', center: [112, 286], radius: 32, hit: { cx: 112, cy: 286, r: 32 }, art: 'c9/sun-dial' },
    // The water over the flat, and the dinghy on it
    follows('tide', 'c9/tide', { x: 120, y: 460, w: 270, h: 60 }),
    follows('dinghy', 'c9/dinghy', { x: 184, y: 414, w: 56, h: 56 }),
  ],
  perches: [
    { id: 'lamp', node: 'lampTop', reachNode: 'W1' },
    // The stepping stone: under water unless the tide is out (C7)
    { id: 'stone', node: 'stoneTop', blockedWhen: SUN('noon', 'sunset') },
    { id: 'kiosk', node: 'kioskTop', reachNode: 'P1' },
  ],
  creatures: [],
  // The bead on the bollard, seen from the far pier
  attractors: [{ id: 'bead', kind: 'shiny', node: 'post', height: 1, goal: true, visibleWhen: { babyAt: 'P1' } }],
  baby: { start: 'W1', facing: 'r' },
  mocha: { start: 'lamp' },
  mischief: { text: '把太陽轉到黃昏又轉回來三次', when: { type: 'partEnter', id: 'dial', count: 3, when: SUN('sunset') } },
  // On the 情人橋 in the backdrop, in the sunset light
  tudigong: { x: 236, y: 250, visibleWhen: SUN('sunset'), hat: '船長帽' },
  solution: [
    { set: 'dial', to: 'dawn' }, { mocha: 'kiosk' }, { wait: 'settle' }, { set: 'dial', to: 'noon' }, { wait: 'settle' },
    { set: 'dial', to: 'sunset' }, { wait: 'goal' },
  ],
  lines: {
    onEvent: [
      // The 店員小哥's chapter 9 cameo (§ 5.3): Mocha hops onto his ice-cream kiosk
      { when: { type: 'catArrive', id: 'kiosk' }, line: 'c9p4.clerk.1' },
      { when: { type: 'catArrive', id: 'kiosk' }, line: 'c9p4.clerk.2' },
      { when: { type: 'catArrive', id: 'kiosk' }, line: 'c9p4.clerk.3' },
    ],
  },
});
