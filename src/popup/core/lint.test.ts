import { describe, expect, test } from 'vitest';
import c0p4 from './fixtures/c0p4';
import c1p2 from './fixtures/c1p2';
import c1p3 from './fixtures/c1p3';
import { loop } from './fixtures/solver';
import { hitOverlap, hitOverlapArea, LINT_BUDGET, lintPage, solutionPushables, textLength, type LineTable, type LintResult } from './lint';
import type { CreatureDef, NodeDef, PageDef, PartDef } from './types';

/** A deep copy of `base` changed by `edit` (fixtures stay untouched). */
function variant(edit: (d: PageDef) => void, base: PageDef = c1p2): PageDef {
  const d = structuredClone(base);
  edit(d);
  return d;
}

const codes = (r: LintResult) => [...r.errors, ...r.warnings].map((i) => i.code).sort();

const gate = (id: string, x: number, more: Partial<PartDef> = {}): PartDef => ({ id, preset: 'gate', hit: { x, y: 300, w: 48, h: 48 }, art: `t/${id}`, ...more });
const section = (id: string, x: number, more: Partial<PartDef> = {}): PartDef => ({
  id,
  preset: 'section',
  states: ['0', '1'],
  hit: { x, y: 300, w: 48, h: 48 },
  art: `t/${id}`,
  ...more,
});
const prop = (id: string, x: number, y: number): PartDef => ({ id, preset: 'prop', states: ['a', 'b'], hit: { x, y, w: 48, h: 48 }, art: `t/${id}` });
const node = (id: string, x: number, y: number, more: Partial<NodeDef> = {}): NodeDef => ({ id, x, y, height: 0, ...more });
const critter = (id: string, more: Partial<CreatureDef> = {}): CreatureDef => ({ id, positions: { p: 'gapSlot' }, initial: 'p', blocks: false, art: `t/${id}`, ...more });

/**
 * One negative fixture per check (GDD § 3.6 rules 1–12 as errors, 13–16 as warnings): each edits the
 * lint-clean 1-2 page (or 1-3) so that exactly the listed codes fire.
 */
const NEGATIVE: [name: string, expected: string[], page: PageDef][] = [
  // Rule 1: ids and references.
  ['two nodes share an id', ['L01-duplicate-id'], variant((d) => d.nodes.push(node('L1', 50, 430)))],
  ['two parts share an id', ['L01-duplicate-id'], variant((d) => d.parts.push(gate('board', 300)))],
  ['an attractor is called mocha', ['L01-reserved-id'], variant((d) => d.attractors.push({ id: 'mocha', kind: 'snack', node: 'L2' }))],
  ['an edge to a missing node', ['L01-unknown-ref'], variant((d) => d.edges.push({ a: 'L3', b: 'nowhere', kind: 'crawl' }))],
  ['a condition on a missing part', ['L01-unknown-ref'], variant((d) => (d.tudigong.visibleWhen = { part: 'sign', in: ['on'] }))],
  ['a condition on a missing perch', ['L01-unknown-ref'], variant((d) => (d.tudigong.visibleWhen = { mochaAt: 'roof' }))],
  ['a condition on a missing node', ['L01-unknown-ref'], variant((d) => (d.tudigong.visibleWhen = { babyAt: 'roof' }))],
  ['a part riding a missing node', ['L01-unknown-ref'], variant((d) => (d.parts[0].ridesOn = 'roof'))],
  ['a condition on a missing creature', ['L01-unknown-ref'], variant((d) => (d.tudigong.visibleWhen = { creature: 'goose', at: 'away' }))],
  ['a condition on a missing attractor', ['L01-unknown-ref'], variant((d) => (d.tudigong.visibleWhen = { consumed: 'snack' }))],
  ['a flag no reaction sets', ['L01-unknown-ref'], variant((d) => (d.tudigong.visibleWhen = { any: [{ flag: 'rang' }] }))],
  ['a mischief predicate about nothing', ['L01-unknown-ref'], variant((d) => (d.mischief.when = { type: 'ride', id: 'bus' }))],
  ['a perch reachNode that is no node', ['L01-unknown-ref'], variant((d) => (d.perches[0].reachNode = 'R9'))],
  ['mocha starts on no perch', ['L01-unknown-ref'], variant((d) => (d.mocha.start = 'roof'))],
  ['baby starts on no node', ['L01-unknown-ref'], variant((d) => (d.baby.start = 'roof'))],
  ['a creature position on no node', ['L01-unknown-ref'], variant((d) => (d.creatures[0].positions.onTrack = 'slot'))],
  ['a solution taps no part', ['L01-unknown-ref'], variant((d) => d.solution.push({ tap: 'bell' }))],
  ['a solution sends Mocha to no perch', ['L01-unknown-ref'], variant((d) => d.solution.unshift({ mocha: 'roof' }))],
  ['a carrier route through no node', ['L01-unknown-ref'], variant((d) => d.parts.push({ id: 'auntie', preset: 'carrier', route: ['R1', 'Q'], hit: { x: 0, y: 0, w: 48, h: 48 }, art: 't' }))],
  ['an attractor heldBy no creature', ['L01-unknown-ref'], variant((d) => (d.attractors[0].heldBy = 'squirrel'))],
  ['a reaction about nothing', ['L01-unknown-ref'], variant((d) => (d.parts[1].react = [{ on: { type: 'ride', id: 'bus' }, to: 'flip' }]))],
  ['a line key missing from the script', ['L01-unknown-ref'], variant((d) => (d.lines = { intro: ['c1.p2.9'] }))],
  ['a perch pushes a tab', ['L01-wrong-kind'], variant((d) => (d.perches[0].push = 'train'))],
  ['a landed condition on a tab', ['L01-wrong-kind'], variant((d) => (d.tudigong.visibleWhen = { landed: 'train' }))],
  [
    'a light owns a shiny',
    ['L01-wrong-kind'],
    variant((d) => d.parts.push({ id: 'lamp', preset: 'light', attractor: 'bead', hit: { x: 0, y: 0, w: 48, h: 48 }, art: 't' })),
  ],
  [
    'a creature drops what it does not hold',
    ['L01-wrong-kind'],
    variant((d) => (d.creatures[0].react = [{ on: 'wave', to: 'away', drop: 'bead' }])),
  ],
  ['an unknown edge kind', ['L01-invalid-value'], variant((d) => (d.edges[0].kind = 'fly' as never))],
  ['an unknown preset', ['L01-invalid-value'], variant((d) => (d.parts[1].preset = 'spinner' as never))],
  ['an unknown input', ['L01-invalid-value'], variant((d) => (d.parts[1].input = 'swipe' as never))],
  ['an unknown event type', ['L01-invalid-value'], variant((d) => (d.parts[1].emit = [{ onEnter: 'flip', event: 'ding' as never }]))],
  ['a reaction to an unknown event', ['L01-invalid-value'], variant((d) => (d.parts[1].react = [{ on: 'ding' as never, to: 'flip' }]))],
  ['a learn condition on a missing state', ['L02-unknown-state'], variant((d) => (d.learns = { word: 'beep', when: { part: 'board', in: ['flop'] } }))],
  ['an attractor following a tab', ['L01-wrong-kind'], variant((d) => (d.attractors[0].followsPushable = 'train'))],
  ['an unknown word', ['L01-invalid-value'], variant((d) => (d.words = ['hello' as never]))],
  ['a solution says an unknown word', ['L01-invalid-value'], variant((d) => d.solution.push({ say: 'hello' as never }))],
  ['an unknown learn event', ['L01-invalid-value'], variant((d) => (d.learns = { word: 'beep', when: { event: 'ding' as never } }))],
  ['a malformed condition', ['L01-invalid-value'], variant((d) => (d.tudigong.visibleWhen = { colour: 'red' } as never))],
  ['a missing condition', ['L01-invalid-value'], variant((d) => (d.tudigong.visibleWhen = { not: null } as never))],
  ['a state filter on a cry', ['L01-invalid-filter'], variant((d) => (d.parts[1].react = [{ on: { type: 'cry', state: 'out' }, to: 'flip' }]))],
  ['two perches on one node', ['L01-shared-perch-node'], variant((d) => d.perches.push({ id: 'bench2', node: 'bench' }))],
  ['a winged creature that cannot fly off', ['L01-winged-no-sky'], variant((d) => d.creatures.push(critter('crow', { winged: true })))],
  // Rule 2: states.
  ['a condition on a missing state', ['L02-unknown-state'], variant((d) => (d.tudigong.visibleWhen = { part: 'board', in: ['flop'] }))],
  ['a condition on a missing position', ['L02-unknown-state'], variant((d) => (d.parts[0].stateWhen = { full: { creature: 'pigeon', at: 'gone' } }))],
  ['a stateWhen for a missing state', ['L02-unknown-state'], variant((d) => (d.parts[0].stateWhen = { gone: { creature: 'pigeon', at: 'away' } }))],
  ['a reaction to a missing state', ['L02-unknown-state'], variant((d) => (d.parts[1].react = [{ on: 'cry', to: 'flop' }]))],
  ['a partEnter filter on a missing state', ['L02-unknown-state'], variant((d) => (d.parts[1].react = [{ on: { type: 'partEnter', id: 'train', state: 'gone' }, to: 'flip' }]))],
  ['an emit on a missing state', ['L02-unknown-state'], variant((d) => (d.parts[1].emit = [{ onEnter: 'flop', event: 'beep' }]))],
  ['an attach position for a missing state', ['L02-unknown-state'], variant((d) => (d.nodes[3].attach!.pos.gone = [0, 0]))],
  ['a perch set to a missing state', ['L02-unknown-state'], variant((d) => (d.perches[0].set = { part: 'board', to: 'flop' }))],
  ['a solution set to a missing state', ['L02-unknown-state'], variant((d) => (d.solution[0] = { set: 'train', to: 'gone' }))],
  ['a creature reaction to a missing position', ['L02-unknown-state'], variant((d) => (d.creatures[0].react = [{ on: 'wave', to: 'gone' }]))],
  ['a flee to a missing position', ['L02-unknown-state'], variant((d) => (d.creatures[0].fleesFromCat!.to = 'gone'))],
  [
    'a nodeBy map for a missing state',
    ['L02-unknown-state'],
    variant((d) => (d.attractors[0].nodeBy = { part: 'board', map: { still: 'R2', flop: 'R1' } })),
  ],
  // Rule 3: presets, states, inputs.
  ['a prop without states', ['L03-missing-states'], variant((d) => delete d.parts[1].states)],
  ['an initial outside the states', ['L03-initial-not-in-states'], variant((d) => (d.parts[0].initial = 'gone'))],
  ['a creature starting at no position', ['L03-initial-not-in-states'], variant((d) => (d.creatures[0].initial = 'gone'))],
  ['a duplicate state', ['L03-bad-states'], variant((d) => (d.parts[1].states = ['still', 'flip', 'still']))],
  ['a tab with one stop', ['L03-bad-states'], variant((d) => d.parts.push({ id: 'drawer', preset: 'tab', states: ['shut'], input: 'none', hit: { x: 0, y: 0, w: 48, h: 48 }, art: 't' }))],
  ['a prop dragged like a tab', ['L03-invalid-input'], variant((d) => (d.parts[1].input = 'drag-linear'))],
  ['a carrier without a route', ['L03-preset-field'], variant((d) => d.parts.push({ id: 'auntie', preset: 'carrier', hit: { x: 0, y: 0, w: 48, h: 48 }, art: 't' }))],
  [
    'a pushable without a fall',
    ['L03-preset-field'],
    variant((d) => {
      d.parts.push({ id: 'cup', preset: 'pushable', hit: { x: 0, y: 0, w: 48, h: 48 }, art: 't' });
      d.perches[1].push = 'cup';
    }),
  ],
  [
    'a pushable with other states',
    ['L03-bad-states'],
    variant((d) => {
      d.parts.push({ id: 'cup', preset: 'pushable', states: ['up', 'down'], fall: { path: [], fallTo: 'gapSlot' }, hit: { x: 0, y: 0, w: 48, h: 48 }, art: 't' });
      d.perches[1].push = 'cup';
    }),
  ],
  // Rule 4: attached nodes.
  ['an attached node missing a state', ['L04-attach-missing-state'], variant((d) => delete d.nodes[3].attach!.pos.full)],
  [
    'a doorway that moves with its gate',
    ['L04-gate-node-moves'],
    variant((d) => {
      d.parts.push(gate('g', 300));
      d.nodes.push(node('G', 0, 0, { attach: { part: 'g', pos: { closed: [200, 300], open: [210, 300] } } }));
    }),
  ],
  // Rule 5: vanishing ground.
  ['a walkable node off the page', ['L05-vanishing-ground'], variant((d) => (d.nodes[6].x = 400))],
  ['a train stop off the page', ['L05-vanishing-ground'], variant((d) => (d.nodes[3].attach!.pos.out = [-20, 430]))],
  [
    'ground that rides a pushable',
    ['L05-vanishing-ground', 'L06-dropping-baby'],
    variant((d) => {
      d.parts.push({ id: 'crate', preset: 'pushable', fall: { path: [], fallTo: 'gapSlot' }, hit: { x: 0, y: 0, w: 48, h: 48 }, art: 't' });
      d.perches[1].push = 'crate';
      d.nodes.push(node('C', 0, 0, { attach: { part: 'crate', pos: { onPerch: [300, 430], falling: [300, 450], landed: [300, 470] } } }));
      d.edges.push({ a: 'R2', b: 'C', kind: 'crawl' });
    }),
  ],
  // Rule 6: dropping the baby.
  [
    'a floor node attached to a carrier',
    ['L06-dropping-baby'],
    variant((d) => {
      d.parts.push({ id: 'auntie', preset: 'carrier', route: ['R1', 'R2'], hit: { x: 0, y: 0, w: 48, h: 48 }, art: 't' });
      const pos: Record<string, [number, number]> = { idle: [300, 430], 'carrying@0': [300, 430], 'carrying@1': [300, 430], done: [300, 430] };
      d.nodes.push(node('A', 0, 0, { attach: { part: 'auntie', pos } }));
      d.edges.push({ a: 'R2', b: 'A', kind: 'crawl' });
    }),
  ],
  // Rule 7: pushables.
  [
    'a pushable nobody pushes',
    ['L07-pushable-unpushed'],
    variant((d) => d.parts.push({ id: 'cup', preset: 'pushable', fall: { path: [], fallTo: 'gapSlot' }, hit: { x: 0, y: 0, w: 48, h: 48 }, art: 't' })),
  ],
  ['a reaction that lands a pushable', ['L07-pushable-reaction'], variant((d) => (d.parts[0].react = [{ on: 'cry', to: 'landed' }]), c1p3)],
  // Rule 8: budget.
  ['41 nodes', ['L08-budget-nodes'], variant((d) => d.nodes.push(...Array.from({ length: 31 }, (_, i) => node(`x${i}`, i * 10, 100))))],
  ['13 parts', ['L08-budget-parts'], variant((d) => d.parts.push(...Array.from({ length: 11 }, (_, i) => gate(`g${i}`, i * 30))))],
  [
    '9 interactive parts',
    ['L08-budget-interactive'],
    variant((d) => d.parts.push(...Array.from({ length: 7 }, (_, i) => prop(`p${i}`, (i % 4) * 90, 200 + Math.floor(i / 4) * 60)))),
  ],
  ['7 creatures', ['L08-budget-creatures'], variant((d) => d.creatures.push(...Array.from({ length: 6 }, (_, i) => critter(`c${i}`))))],
  // Rule 9: hit areas.
  ['a 40-wide hit area', ['L09-hit-too-small'], variant((d) => (d.parts[1].hit = { x: 90, y: 120, w: 40, h: 64 }))],
  ['a hit circle of radius 20', ['L09-hit-too-small'], variant((d) => (d.parts[1].hit = { cx: 120, cy: 150, r: 20 }))],
  ['two hit areas overlapping by 80 %', ['L09-hit-overlap'], variant((d) => (d.parts[1].hit = { x: 60, y: 595, w: 96, h: 64 }))],
  // Rule 10: text.
  ['an 11-character title', ['L10-title-too-long'], variant((d) => (d.title = '月台的縫月台的縫月台的'))],
  ['a 31-character mischief', ['L10-text-too-long'], variant((d) => (d.mischief.text = '讓寶咖咖坐火車來回兩次，'.repeat(2) + '再來一次吧！！'))],
  ['a 31-character line', ['L10-text-too-long'], variant((d) => (d.lines = { onEvent: [{ when: { type: 'ride' }, line: 'c1.p2.long' }] }))],
  // Rule 11: goal, 土地公, 淘氣.
  ['no goal', ['L11-goal-count'], variant((d) => (d.attractors[0].goal = false))],
  ['two goals', ['L11-goal-count'], variant((d) => d.attractors.push({ id: 'coin', kind: 'shiny', node: 'L2', goal: true }))],
  ['a decoy goal', ['L11-bad-goal'], variant((d) => (d.attractors[0].decoy = true))],
  ['a snack goal', ['L11-bad-goal'], variant((d) => (d.attractors[0].kind = 'snack'))],
  ['no 土地公', ['L11-no-tudigong'], variant((d) => delete (d as Partial<PageDef>).tudigong)],
  ['no 淘氣 text', ['L11-no-mischief'], variant((d) => (d.mischief.text = ' '))],
  ['no 淘氣 at all', ['L11-no-mischief'], variant((d) => delete (d as Partial<PageDef>).mischief)],
  // Rule 12: cascades.
  [
    'two sections stepping each other',
    ['L12-cascade-loop'],
    variant((d) =>
      d.parts.push(
        section('s1', 0, { react: [{ on: { type: 'partEnter', id: 's2' }, to: 'next' }] }),
        section('s2', 100, { react: [{ on: { type: 'partEnter', id: 's1' }, to: 'prev' }] }),
      ),
    ),
  ],
  ['a section stepping itself', ['L12-cascade-loop'], variant((d) => d.parts.push(section('s1', 0, { react: [{ on: 'partEnter', to: 'toggle' }] })))],
  [
    'a part that answers its own beep',
    ['L12-cascade-loop'],
    variant((d) => d.parts.push(section('s1', 0, { emit: [{ onEnter: '0', event: 'beep' }, { onEnter: '1', event: 'beep' }], react: [{ on: 'partEnter', to: 'next' }] }))),
  ],
  [
    'a guarded cycle',
    ['L12-cascade-cycle'],
    variant((d) =>
      d.parts.push(
        section('s1', 0, { react: [{ on: { type: 'partEnter', id: 's2' }, to: 'next', when: { flag: 'f' } }] }),
        section('s2', 100, { react: [{ on: { type: 'partEnter', id: 's1' }, to: '1', setFlag: 'f' }] }),
      ),
    ),
  ],
  [
    'a beep that reaches back',
    ['L12-cascade-cycle'],
    variant((d) =>
      d.parts.push(
        section('s1', 0, { emit: [{ onEnter: '1', event: 'beep' }], react: [{ on: { type: 'partEnter', id: 's2', state: '1' }, to: 'next' }] }),
        section('s2', 100, { react: [{ on: 'beep', to: 'next' }] }),
      ),
    ),
  ],
  // Warnings 13–16.
  ['a custom reaction function', ['L13-custom-reaction'], variant((d) => Object.assign(d.parts[1], { custom: () => 'flip' }))],
  ['two unreachable beads', ['L14-visible-tie'], variant((d) => d.attractors.push({ id: 'coin', kind: 'shiny', node: 'R1' }))],
  [
    'a lock that reads a part changed by the same event',
    ['L15-lock-order'],
    variant((d) => d.parts.push(gate('g1', 0, { react: [{ on: 'cry', to: 'open' }] }), gate('g2', 100, { react: [{ on: 'cry', to: 'open' }], lockedWhen: { not: { part: 'g1', in: ['open'] } } }))),
  ],
  ['a wet perch with no way to dry', ['L16-always-wet-perch'], variant((d) => (d.nodes[8].tags = ['wet']))],
  ['a steamy perch with no way to clear', ['L16-always-wet-perch'], variant((d) => (d.nodes[7].tags = ['steam']))],
];

const SCRIPT: LineTable = { 'c1.p2.long': { text: '一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一' }, 'c1.p2.ok': '火車來了！' };

describe('lintPage', () => {
  test.each([c1p2, c1p3, c0p4])('the $id fixture lints clean', (def) => {
    expect(lintPage(def, SCRIPT)).toEqual({ errors: [], warnings: [] });
  });

  test.each(NEGATIVE)('%s → %j', (_, expected, def) => {
    const r = lintPage(def, SCRIPT);
    expect(codes(r)).toEqual([...expected].sort());
    for (const issue of [...r.errors, ...r.warnings]) {
      expect(issue.page).toBe(def.id);
      expect(issue.message.startsWith(`${def.id}: `)).toBe(true);
      expect(issue.ids.length).toBeGreaterThan(0);
    }
  });

  test('every documented code has a negative fixture', () => {
    const covered = new Set(NEGATIVE.flatMap(([, c]) => c));
    const documented = [
      'L01-duplicate-id', 'L01-reserved-id', 'L01-unknown-ref', 'L01-wrong-kind', 'L01-invalid-value', 'L01-invalid-filter',
      'L01-shared-perch-node', 'L01-winged-no-sky', 'L02-unknown-state', 'L03-missing-states', 'L03-initial-not-in-states',
      'L03-bad-states', 'L03-invalid-input', 'L03-preset-field', 'L04-attach-missing-state', 'L04-gate-node-moves',
      'L05-vanishing-ground', 'L06-dropping-baby', 'L07-pushable-unpushed', 'L07-pushable-reaction', 'L08-budget-nodes',
      'L08-budget-parts', 'L08-budget-interactive', 'L08-budget-creatures', 'L09-hit-too-small', 'L09-hit-overlap',
      'L10-title-too-long', 'L10-text-too-long', 'L11-goal-count', 'L11-bad-goal', 'L11-no-tudigong', 'L11-no-mischief',
      'L12-cascade-loop', 'L12-cascade-cycle', 'L13-custom-reaction', 'L14-visible-tie', 'L15-lock-order', 'L16-always-wet-perch',
    ];
    expect([...covered].sort()).toEqual([...documented].sort());
  });

  test('severities: rules 1–12 are errors except the cycle warning; 13–16 are warnings', () => {
    for (const [, , def] of NEGATIVE) {
      const r = lintPage(def, SCRIPT);
      for (const e of r.errors) expect(e.code === 'L12-cascade-cycle' || Number(e.code.slice(1, 3)) > 12).toBe(false);
      for (const w of r.warnings) expect(w.code === 'L12-cascade-cycle' || Number(w.code.slice(1, 3)) >= 13).toBe(true);
    }
  });

  test('messages name the page and the ids', () => {
    const r = lintPage(variant((d) => (d.nodes[6].x = 400)));
    expect(r.errors).toEqual([
      { code: 'L05-vanishing-ground', severity: 'error', page: 'c1p2', ids: ['R2'], message: "c1p2: node 'R2' has edges but sits off the page (400, 430)" },
    ]);
    const tie = lintPage(variant((d) => d.attractors.push({ id: 'coin', kind: 'shiny', node: 'R1' }))).warnings[0];
    expect(tie.ids).toEqual(['coin', 'bead']);
    expect(tie.message).toContain('both unreachable');
  });

  test('a reachable tie names the path length', () => {
    const def = variant((d) => {
      d.attractors[0].node = 'L3';
      d.attractors.push({ id: 'coin', kind: 'shiny', node: 'L3' });
    });
    expect(lintPage(def).warnings.map((w) => w.message)).toEqual([expect.stringContaining('both 2 edges away')]);
  });

  test('line keys are checked only with a script; good lines pass', () => {
    const def = variant((d) => (d.lines = { intro: ['c1.p2.ok', 'c1.p2.missing'] }));
    expect(codes(lintPage(def))).toEqual([]);
    expect(codes(lintPage(def, SCRIPT))).toEqual(['L01-unknown-ref']);
  });

  test('the solver fixture with a reaction loop is a certain loop', () => {
    expect(lintPage(loop).errors.filter((e) => e.code.startsWith('L12')).map((e) => [e.code, e.ids])).toEqual([['L12-cascade-loop', ['ping', 'pong']]]);
  });

  test('a page that only partly reaches is no cycle: within radius limits the graph', () => {
    const def = variant((d) =>
      d.parts.push(
        section('s1', 0, { emit: [{ onEnter: '1', event: 'beep' }], react: [{ on: { type: 'partEnter', id: 's2' }, to: 'next' }] }),
        section('s2', 300, { react: [{ on: 'beep', to: 'next' }] }),
      ),
    );
    expect(codes(lintPage(def))).toEqual([]);
  });

  test('locks on later parts and on non-shared events are not order-dependent', () => {
    const def = variant((d) =>
      d.parts.push(
        gate('g2', 100, { react: [{ on: 'cry', to: 'open' }], lockedWhen: { part: 'g1', in: ['closed'] } }),
        gate('g1', 0, { react: [{ on: 'cry', to: 'open' }] }),
        gate('g3', 200, { react: [{ on: 'beep', to: 'open' }], stateWhen: { open: { all: [{ any: [{ part: 'g1', in: ['open'] }] }, { landed: 'nothing' }] } } }),
      ),
    );
    expect(codes(lintPage(def))).toEqual(['L01-unknown-ref']);
  });

  test('custom functions anywhere in the data are found once each', () => {
    const fn = () => 0;
    const def = variant((d) => d.parts.push(gate('g', 0)));
    Object.assign(def.parts[2], { hook: fn });
    Object.assign(def, { onTick: fn });
    expect(lintPage(def).warnings.map((w) => w.ids[0])).toEqual(['parts[2].hook', 'onTick']);
  });

  test('never throws on broken data', () => {
    const broken = [
      { id: 'x' },
      {},
      variant((d) => {
        Object.assign(d.nodes[3], { attach: { part: 'train' } });
        Object.assign(d.parts[1], { lockedWhen: null });
        d.tudigong.visibleWhen = { part: 'board' } as never;
        Object.assign(d.attractors[0], { nodeBy: { part: 'board' } });
        Object.assign(d.creatures[0], { positions: undefined, fleesFromCat: { to: 'away' } });
      }),
      { id: 'y', nodes: 'nope', parts: [{ id: 'p', preset: 'tab', hit: null }], attractors: [{ id: 'a', kind: 'shiny', node: 'n', goal: true }] },
      variant((d) => ((d.parts[0] as { hit: unknown }).hit = undefined)),
    ] as unknown as PageDef[];
    for (const def of broken) expect(() => lintPage(def)).not.toThrow();
    expect(lintPage(broken[1]).errors[0].page).toBe('?');
    expect(codes(lintPage(broken[0]))).toEqual(['L11-goal-count', 'L11-no-mischief', 'L11-no-tudigong']);
  });

  test('is fast: well under 5 ms per page', () => {
    const runs = 200;
    const t0 = performance.now();
    for (let i = 0; i < runs; i++) lintPage(c1p2, SCRIPT);
    expect((performance.now() - t0) / runs).toBeLessThan(5);
  });

  test('the budget follows GDD § 3.6 rule 8', () => {
    expect(LINT_BUDGET).toEqual({ nodes: 40, parts: 12, interactive: 8, creatures: 6 });
  });
});

describe('hit overlap', () => {
  test.each([
    ['disjoint rectangles', { x: 0, y: 0, w: 48, h: 48 }, { x: 60, y: 0, w: 48, h: 48 }, 0],
    ['touching rectangles', { x: 0, y: 0, w: 48, h: 48 }, { x: 48, y: 0, w: 48, h: 48 }, 0],
    ['half-overlapping rectangles', { x: 0, y: 0, w: 48, h: 48 }, { x: 24, y: 0, w: 48, h: 48 }, 0.5],
    ['a small rectangle inside a big one', { x: 0, y: 0, w: 200, h: 200 }, { x: 10, y: 10, w: 48, h: 48 }, 1],
    ['a circle inside a rectangle', { x: 0, y: 0, w: 200, h: 200 }, { cx: 100, cy: 100, r: 30 }, 1],
    ['disjoint circles', { cx: 0, cy: 0, r: 24 }, { cx: 100, cy: 0, r: 24 }, 0],
    ['a circle half over a rectangle edge', { x: 100, y: 0, w: 100, h: 200 }, { cx: 100, cy: 100, r: 30 }, 0.5],
  ] as const)('%s', (_, a, b, share) => {
    expect(hitOverlap(a, b)).toBeCloseTo(share, 3);
    expect(hitOverlap(b, a)).toBeCloseTo(share, 3);
  });

  test('two equal circles a radius apart share the lens area', () => {
    const r = 30;
    const lens = 2 * r * r * Math.acos(0.5) - (r / 2) * Math.sqrt(4 * r * r - r * r);
    expect(Math.abs(hitOverlapArea({ cx: 0, cy: 0, r }, { cx: r, cy: 0, r }) - lens) / lens).toBeLessThan(1e-3);
  });

  test('a degenerate shape overlaps nothing', () => {
    expect(hitOverlap({ x: 0, y: 0, w: 0, h: 0 }, { x: 0, y: 0, w: 48, h: 48 })).toBe(0);
  });
});

describe('helpers', () => {
  test('textLength counts code points, 「」 and punctuation included', () => {
    expect(textLength('「要！」')).toBe(4);
    expect(textLength('月台的縫')).toBe(4);
    expect(textLength('𠮷野家')).toBe(3);
  });

  test('solutionPushables: the pushables a solution knocks off', () => {
    expect(solutionPushables(c1p3)).toEqual(['card']);
    expect(solutionPushables(c1p2)).toEqual([]);
    expect(solutionPushables(variant((d) => (d.solution = [{ pet: true }]), c1p3))).toEqual([]);
    expect(solutionPushables(variant((d) => ((d.mocha.start = 'counter'), (d.solution = [{ pet: true }])), c1p3))).toEqual(['card']);
    expect(solutionPushables({ id: 'x' } as unknown as PageDef)).toEqual([]);
  });
});
