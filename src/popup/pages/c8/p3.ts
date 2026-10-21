import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 8-3 「呼呼」 (the hot-spring bath's boardwalk) · difficulty 2 · par 2 · **learn 咻——**.
 * A boardwalk runs along the bath; half way along, a cloud of steam (a **blowable**: fog / clear)
 * hangs over it, and he won't crawl into what he can't see. On the bench at the near end the
 * 溫泉阿嬤 sits with her straw sun hat and a hot-spring egg, and Mocha sits on the bench's back.
 *
 * Mocha onto the rock past the steam: Baokaka crawls to the steam's edge and reaches. Behind him the
 * 阿嬤 blows on her egg — 「蛋很燙，呼呼再吃。」 — and he copies: 「咻——！」 (the § 5.4 beat; Mocha:
 * 「他說：『我是颱風。』……別鬧。」; the card 「咻——：吹動輕的東西」). Say 咻——: he blows the way he
 * faces, the steam clears, the bead shows on the boardwalk's end, and he crawls to it. The 淘氣: blow
 * the 阿嬤's hat off — she is behind him at the steam, so call Mocha back to the bench first, and
 * he'll be facing her (「哎唷！我的帽子！」; a second 咻—— blows it back on).
 *
 * ```
 *   (阿嬤 + hat)  bench (Mocha) ──────────────jump────────────── rock (Mocha, past the steam)
 *   P1 (start) ── P2 ── P3 (the steam's edge: learn 咻——) ═(steam clear)═ P4 ── P5 (bead, seen once it clears)
 *   steam: fog / clear (咻—— from P2 or P3 facing right) · hat: on / off (咻—— from P1 facing left)
 * ```
 */
const CLEAR = { part: 'steam', in: ['clear'] };
const HAT_OFF = { type: 'partEnter' as const, id: 'hat', when: { part: 'hat', in: ['off'] } };

export default definePage({
  id: 'c8p3', chapter: 8, index: 3, title: '呼呼', difficulty: 2, backdrop: 'c8/bath-boardwalk',
  nodes: [
    { id: 'P1', x: 120, y: 480, height: 0 }, { id: 'P2', x: 180, y: 480, height: 0 },
    { id: 'P3', x: 240, y: 480, height: 0 }, { id: 'P4', x: 318, y: 480, height: 0 },
    { id: 'P5', x: 368, y: 480, height: 0 },
    // Unconnected: the 溫泉阿嬤's end of the bench
    { id: 'granny', x: 50, y: 476, height: 0 },
    // Mocha's perches: the bench's back, the rock in the bath past the steam
    { id: 'benchTop', x: 108, y: 414, height: 2 }, { id: 'rockTop', x: 344, y: 412, height: 2 },
  ],
  edges: [
    { a: 'P1', b: 'P2', kind: 'crawl' }, { a: 'P2', b: 'P3', kind: 'crawl' },
    // Under the steam: he won't crawl into what he can't see
    { a: 'P3', b: 'P4', kind: 'crawl', when: CLEAR },
    { a: 'P4', b: 'P5', kind: 'crawl' },
    { a: 'benchTop', b: 'rockTop', kind: 'jump' },
  ],
  parts: [
    // The steam over the boardwalk: in his cone from P3 (and P2) facing right; a second 咻—— brings it back
    { id: 'steam', preset: 'blowable', states: ['fog', 'clear'], hit: { x: 248, y: 412, w: 64, h: 68 }, art: 'c8/steam' },
    // The 阿嬤's straw sun hat: in his cone only from P1 facing left (behind him at the steam)
    { id: 'hat', preset: 'blowable', states: ['on', 'off'], hit: { x: 22, y: 414, w: 56, h: 56 }, art: 'c8/granny-hat' },
  ],
  perches: [
    { id: 'bench', node: 'benchTop', reachNode: 'P1' },
    { id: 'rock', node: 'rockTop', reachNode: 'P5' },
  ],
  creatures: [{ id: 'granny', positions: { bench: 'granny' }, initial: 'bench', blocks: false, art: 'c8/hot-spring-granny' }],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'P5', goal: true, visibleWhen: CLEAR }],
  baby: { start: 'P1', facing: 'r' },
  mocha: { start: 'bench' },
  // He hears her blow on the egg at the steam's edge, and copies
  learns: { word: 'whoosh', when: { babyAt: 'P3' } },
  mischief: { text: '把溫泉阿嬤的帽子吹掉', when: HAT_OFF },
  // On the rock beside Mocha, seen once Mocha is there
  tudigong: { x: 316, y: 410, visibleWhen: { mochaAt: 'rock' }, hat: '毛巾' },
  solution: [{ mocha: 'rock' }, { wait: 'settle' }, { say: 'whoosh' }, { wait: 'goal' }],
  lines: {
    onEvent: [{ when: HAT_OFF, line: 'c8p3.granny.1' }],
  },
});
