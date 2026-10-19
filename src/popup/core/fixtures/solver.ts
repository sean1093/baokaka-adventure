import { e, line, n, page, part } from './toy';

/**
 * Toy pages for the solver tests (#85), small enough to check by hand. Baokaka starts on `A`,
 * the goal bead lies on the last node of his line, and he crawls toward it as far as the open edges
 * let him. They know no words (`words: []`): with 不要！ he could refuse the only bead and cry
 * forever, a dead end the solver rightly reports (see `solver.test.ts`), but not what these pages test.
 */

/**
 * Three nodes, A–B–C: the B–C edge needs the latch (a flap) open. Par 1 (tap the latch); opening
 * the latch is also the 淘氣 and shows the 土地公. No dead ends: the latch closes again.
 */
export const threeNode = page({
  id: 'toy3',
  ...line('ABC'),
  words: [],
  edges: [e('A', 'B'), e('B', 'C', { when: { part: 'latch', in: ['open'] } })],
  parts: [part('latch', 'flap', 150, -80)],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'C', goal: true }],
  mischief: { text: '打開門閂', when: { type: 'partEnter', id: 'latch' } },
  tudigong: { x: 0, y: -100, hat: '帽', visibleWhen: { part: 'latch', in: ['open'] } },
});

/**
 * A jam: the bridge (a three-stop tab) can only reach `down` while the latch is open — a drag
 * before that stops at `mid`. B–C needs the bridge down. Par 2 (tap the latch, drag the bridge).
 * The 淘氣 is leaving the bridge at `mid`; the 土地公 is always visible.
 */
export const jam = page({
  id: 'toyJam',
  ...line('ABC'),
  words: [],
  edges: [e('A', 'B'), e('B', 'C', { when: { part: 'bridge', in: ['down'] } })],
  parts: [
    part('latch', 'flap', 50, -80),
    part('bridge', 'tab', 150, 80, { states: ['up', 'mid', 'down'], stateWhen: { down: { part: 'latch', in: ['open'] } } }),
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'C', goal: true }],
  mischief: { text: '把橋卡在一半', when: { type: 'partEnter', id: 'bridge', when: { part: 'bridge', in: ['mid'] } } },
  tudigong: { x: 0, y: -100, hat: '帽' },
});

/**
 * A dead end (R2 broken on purpose): Mocha can knock the plank or the rock off its shelf. The plank
 * landing opens the bridge gate — unless the rock has landed first, which jams the gate shut for
 * good (`stateWhen`), and pushables never go back on their shelves. So every state in which the
 * rock has been pushed (falling or landed) while the gate is still closed is a dead end. Par 1
 * (send Mocha to the plank's shelf).
 */
export const deadEnd = page({
  id: 'toyDead',
  words: [],
  nodes: [
    ...line('ABC').nodes,
    n('home', 0, -200, 1),
    n('shelf1', 100, -200, 1),
    n('shelf2', 200, -200, 1),
    n('pit1', 100, 100),
    n('pit2', 200, 100),
  ],
  edges: [
    e('A', 'B'),
    e('B', 'C', { when: { part: 'gate', in: ['open'] } }),
    e('home', 'shelf1', { kind: 'jump' }),
    e('home', 'shelf2', { kind: 'jump' }),
  ],
  parts: [
    part('gate', 'gate', 150, 0, { stateWhen: { open: { not: { landed: 'rock' } } } }),
    part('plank', 'pushable', 100, -170, { fall: { path: [[100, -170], [100, 100]], fallTo: 'pit1', landSets: { part: 'gate', to: 'open' } } }),
    part('rock', 'pushable', 200, -170, { fall: { path: [[200, -170], [200, 100]], fallTo: 'pit2' } }),
  ],
  perches: [
    { id: 'home', node: 'home', reachNode: 'A' },
    { id: 'shelf1', node: 'shelf1', reachNode: 'B', push: 'plank' },
    { id: 'shelf2', node: 'shelf2', reachNode: 'C', push: 'rock' },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'C', goal: true }],
  mocha: { start: 'home' },
  mischief: { text: '推掉木板', when: { type: 'land', id: 'plank' } },
  tudigong: { x: 0, y: -100, hat: '帽', visibleWhen: { landed: 'plank' } },
});

/** The bead is a few crawls away and nothing is in the way: solvable by waiting (trivial, par 0). */
export const trivial = page({
  id: 'toyTrivial',
  ...line('ABCDE'),
  words: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'E', goal: true }],
});

/** No edge ever reaches the bead: unsolvable, and every state is a dead end. */
export const unsolvable = page({
  id: 'toyNever',
  words: [],
  nodes: [...line('AB').nodes, n('C', 200)],
  edges: line('AB').edges,
  parts: [part('latch', 'flap', 50, -80)],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'C', goal: true }],
});

/** Tapping `ping` starts a reaction loop with `pong` (GDD § 3.6 rule 12): `step` throws. */
export const loop = page({
  id: 'toyLoop',
  ...line('AB'),
  words: [],
  parts: [
    part('ping', 'prop', 0, -80, { states: ['a', 'b'], react: [{ on: { type: 'partEnter', id: 'pong' }, to: 'next' }] }),
    part('pong', 'gate', 100, -80, { react: [{ on: { type: 'partEnter', id: 'ping' }, to: 'toggle' }] }),
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'B', goal: true, visibleWhen: { part: 'ping', in: ['b'] } }],
});
