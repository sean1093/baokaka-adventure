import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 6-4 「空橋」 (the jet bridge) · difficulty 4 · par 4. Apply 飛機！ with the
 * landmark's mechanism. From the gate lounge a jet bridge runs out over the apron toward a
 * sleeping A321, the bead shining in its open door. The bridge telescopes out (`extend`, a **tab**)
 * and its cab swings on its wheels (`swing`, a **wheel**): pulled back along the terminal, at the
 * A321's door, or at the 貨機 parked behind it (the wrong plane, the 淘氣).
 *
 * The cab's gangplank is a **seesaw**: a flock of roosting birds sits on its inner end, so its outer
 * end tips down. Stowed, that end drags on the apron, and the cab can't swing (`lockedWhen` the
 * birds roost). 飛機！: the birds fly up, the plank tips up and the cab swings free — but now the
 * plank's end is in the air over the gap. Swing the cab to the A321 and say it again: the birds
 * come back to roost, the plank tips down onto the door's sill, and he crawls across.
 * → *Birds are a weight: send them off, then call them back.*
 *
 * ```
 *   roof (Mocha) ─jump─ bridgeTop (Mocha)                          cargo (the 貨機's door, upstage)
 *   G1 ── G2 ── B1 ── B2 (extend: in / out) ══(out)══ cab (swing: stow / jet / cargo)
 *                                                    cab ══(jet, plank down)══ P (plank) ── door (bead)
 *   birds: roost (on the plank's inner end: down) ⇄ sky (飛機！); the swing is locked while they roost
 * ```
 */
const ROOSTING = { creature: 'birds', at: 'roost' };

export default definePage({
  id: 'c6p4', chapter: 6, index: 4, title: '空橋', difficulty: 4, backdrop: 'c6/jet-bridge',
  nodes: [
    // The gate lounge, then the bridge's fixed tunnel and its telescoping end
    { id: 'G1', x: 30, y: 440, height: 0 }, { id: 'G2', x: 88, y: 440, height: 0 },
    { id: 'B1', x: 146, y: 440, height: 0 },
    { id: 'B2', x: 190, y: 440, height: 0, attach: { part: 'extend', pos: { in: [190, 440], out: [236, 440] } } },
    // The cab, where its wheels have swung it (meaningful with the bridge out)
    { id: 'cab', x: 252, y: 470, height: 0, attach: { part: 'swing', pos: { stow: [252, 470], jet: [286, 440], cargo: [282, 372] } } },
    // The gangplank's end (riding the seesaw): on the A321's sill while down
    { id: 'P', x: 324, y: 440, height: 0, attach: { part: 'plank', pos: { down: [324, 440], up: [320, 412] } } },
    // In the A321's open door
    { id: 'door', x: 362, y: 440, height: 0 },
    // Where the birds roost: the plank's inner end, wherever the cab has swung
    { id: 'roost', x: 268, y: 492, height: 1, attach: { part: 'swing', pos: { stow: [268, 492], jet: [300, 430], cargo: [296, 362] } } },
    // Mocha's perches: the terminal's roof edge, the bridge's roof
    { id: 'roofTop', x: 60, y: 300, height: 2 }, { id: 'bridgeTop', x: 170, y: 384, height: 2 },
  ],
  edges: [
    { a: 'G1', b: 'G2', kind: 'crawl' }, { a: 'G2', b: 'B1', kind: 'crawl' }, { a: 'B1', b: 'B2', kind: 'crawl' },
    { a: 'B2', b: 'cab', kind: 'crawl', when: { part: 'extend', in: ['out'] } },
    { a: 'cab', b: 'P', kind: 'crawl', when: { all: [{ part: 'swing', in: ['jet'] }, { part: 'plank', in: ['down'] }] } },
    { a: 'P', b: 'door', kind: 'crawl' },
    { a: 'roofTop', b: 'bridgeTop', kind: 'jump' },
  ],
  parts: [
    // The bridge telescopes out over the apron; it won't pull in with him in the cab or on the plank
    { id: 'extend', preset: 'tab', states: ['in', 'out'], initial: 'in', input: 'drag-linear',
      track: { from: [70, 536], to: [170, 536] }, hit: { x: 30, y: 504, w: 180, h: 56 },
      lockedWhen: { any: [{ babyAt: 'cab' }, { babyAt: 'P' }] }, art: 'c6/bridge-extend' },
    // The cab's wheels: stowed along the terminal, at the A321's door, or at the 貨機 behind it. It
    // can't swing while the birds weigh the plank down onto the apron, or with him on the plank
    { id: 'swing', preset: 'wheel', states: ['stow', 'jet', 'cargo'], initial: 'stow', input: 'drag-rotary',
      center: [300, 528], radius: 30, hit: { cx: 300, cy: 528, r: 30 },
      lockedWhen: { any: [ROOSTING, { babyAt: 'P' }] }, art: 'c6/bridge-wheels' },
    // The gangplank, a seesaw: the roosting birds tip its end down; without them it tips up
    { id: 'plank', preset: 'lift', states: ['down', 'up'], initial: 'down', hit: { x: 290, y: 404, w: 56, h: 56 },
      ridesOn: 'cab', react: [{ on: 'sky', to: 'toggle' }], art: 'c6/bridge-plank' },
  ],
  perches: [
    { id: 'roof', node: 'roofTop', reachNode: 'G1' },
    { id: 'bridgeTop', node: 'bridgeTop', reachNode: 'B1' },
  ],
  creatures: [
    // A flock of night birds roosting on the plank: 飛機！ sends them up, the next one brings them back
    { id: 'birds', positions: { roost: 'roost', sky: 'offpage' }, initial: 'roost', blocks: false, winged: true, art: 'c6/night-birds' },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'door', goal: true }],
  baby: { start: 'G2', facing: 'r' },
  mocha: { start: 'roof' },
  // The bridge out and swung to the 貨機
  mischief: {
    text: '把空橋接到另一架飛機',
    when: { type: 'partEnter', id: 'swing', when: { all: [{ part: 'swing', in: ['cargo'] }, { part: 'extend', in: ['out'] }] } },
  },
  // In a window of the 貨機, seen with the cab swung to it
  tudigong: { x: 250, y: 330, visibleWhen: { part: 'swing', in: ['cargo'] }, hat: '機場背心' },
  solution: [
    { set: 'extend', to: 'out' }, { wait: 'settle' }, { say: 'plane' }, { set: 'swing', to: 'jet' }, { wait: 'settle' },
    { say: 'plane' }, { wait: 'goal' },
  ],
});
