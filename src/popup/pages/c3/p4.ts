import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 3-4 「傅鐘」 · difficulty 3 · par 3. The brass 傅鐘 hangs high in its little tower:
 * a **decoy** shiny, so Baokaka crawls to the tower's foot and reaches up for it forever. The bead is
 * behind the garden gate, unseen; the gate opens when someone steps on its plate — but pigeons sit on
 * the plate. Pull the bell-rope tab: the bell rings and the pigeons scatter (they react to the rope's
 * `partEnter`). Send Mocha to the gate's pillar, then say 不要！ to the bell: he gives it up, crawls
 * toward Mocha, steps on the plate — the gate swings open — and the bead shines behind it. Any
 * order works. The 淘氣: ring the bell twenty-one times (傅鐘二十一響).
 *
 * ```
 *               bell (decoy, high in the tower)
 *   palm (Mocha) ─jump─ pillar (on the gate)
 *   S1 ── S2 ── T ── P ── D ── Q (bead, behind the gate)
 *        (tower foot) (plate: pigeons) (gate)
 * ```
 */
export default definePage({
  id: 'c3p4', chapter: 3, index: 4, title: '傅鐘', difficulty: 3, backdrop: 'c3/fu-bell',
  nodes: [
    { id: 'S1', x: 36, y: 484, height: 0 }, { id: 'S2', x: 98, y: 484, height: 0 },
    { id: 'T', x: 158, y: 484, height: 0 },          // the tower's foot, right under the bell
    { id: 'P', x: 220, y: 484, height: 0, attach: { part: 'plate', pos: { up: [220, 484], down: [220, 484] } } },
    { id: 'D', x: 282, y: 484, height: 0, attach: { part: 'gate', pos: { closed: [282, 484], open: [282, 484] } } },
    { id: 'Q', x: 346, y: 484, height: 0 },          // the garden behind the gate
    { id: 'bellTop', x: 158, y: 196, height: 2 },    // unconnected: the brass bell in its tower
    { id: 'eaves', x: 248, y: 150, height: 2 },      // unconnected: where the pigeons flutter up to
    // Mocha's perches: a palm tree, the gate's pillar
    { id: 'palmTop', x: 44, y: 280, height: 2 }, { id: 'pillarTop', x: 318, y: 350, height: 1 },
  ],
  edges: [
    { a: 'S1', b: 'S2', kind: 'crawl' }, { a: 'S2', b: 'T', kind: 'crawl' }, { a: 'T', b: 'P', kind: 'crawl' },
    { a: 'P', b: 'D', kind: 'crawl' }, { a: 'D', b: 'Q', kind: 'crawl' },
    { a: 'palmTop', b: 'pillarTop', kind: 'jump' },
  ],
  parts: [
    // The bell-rope: pull it and the 傅鐘 rings
    { id: 'rope', preset: 'tab', states: ['up', 'down'], initial: 'up', input: 'drag-linear',
      track: { from: [108, 300], to: [108, 380] }, hit: { x: 80, y: 284, w: 56, h: 112 }, art: 'c3/bell-rope' },
    // The garden gate's plate, pressed by his weight
    { id: 'plate', preset: 'button', hit: { x: 192, y: 470, w: 56, h: 56 }, art: 'c3/plate' },
    // The garden gate: it opens on the plate's press and stays open
    { id: 'gate', preset: 'gate', hit: { x: 254, y: 386, w: 56, h: 110 },
      react: [{ on: { type: 'partEnter', id: 'plate', state: 'down' }, to: 'open' }], art: 'c3/garden-gate' },
  ],
  perches: [
    { id: 'palm', node: 'palmTop', reachNode: 'S1' },
    { id: 'pillar', node: 'pillarTop', reachNode: 'Q' },
  ],
  creatures: [
    // Pecking on the gate's plate; the bell scatters them up to the eaves
    { id: 'pigeons', positions: { plate: 'P', eaves: 'eaves' }, initial: 'plate',
      react: [{ on: { type: 'partEnter', id: 'rope' }, to: 'eaves' }], art: 'common/pigeon' },
  ],
  attractors: [
    { id: 'bell', kind: 'shiny', node: 'bellTop', decoy: true, art: 'c3/bell' },
    { id: 'bead', kind: 'shiny', node: 'Q', goal: true, visibleWhen: { part: 'gate', in: ['open'] } },
  ],
  baby: { start: 'S1', facing: 'r' },
  mocha: { start: 'palm' },
  mischief: { text: '讓傅鐘響二十一聲', when: { type: 'partEnter', id: 'rope', count: 21 } },
  // In the tower's arch, seen once the pigeons have gone
  tudigong: { x: 200, y: 300, visibleWhen: { creature: 'pigeons', at: 'eaves' }, hat: '藍色校工帽' },
  solution: [{ set: 'rope', to: 'down' }, { mocha: 'pillar' }, { wait: 'settle' }, { say: 'no' }, { wait: 'goal' }],
});
