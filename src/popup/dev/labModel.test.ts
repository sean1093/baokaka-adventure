import { describe, expect, test } from 'vitest';
import { initialState } from '../core/state';
import { step } from '../core/step';
import { solve } from '../core/solver';
import type { Input, PageDef } from '../core/types';
import { PAGES, pageById } from '../pages';
import type { PageReport } from '../pages/report';
import { loop } from '../core/fixtures/solver';
import {
  LOG_TICKS,
  artReport,
  compactInputs,
  eventLabel,
  idleState,
  inputLabel,
  labLoad,
  labStep,
  legalInputs,
  moveNode,
  moveTrackEnd,
  overlayModel,
  pageBadge,
  touchableCount,
} from './labModel';
import { LAB_FIXTURES, LAB_PAGES, labPageById } from './labPages';

/** PageLab's model (#91): the stepper, the overlays' data, edits, readability and badges. */

const c1p2 = pageById('c1p2')!;
const c0p1 = pageById('c0p1')!;

describe('the stepper', () => {
  test('idleState matches stepping by hand, and stops at done', () => {
    let s = initialState(c1p2);
    for (let i = 0; i < 3; i++) s = step(c1p2, s, { t: 'none' }).state;
    expect(idleState(c1p2, 3)).toEqual(s);
    expect(idleState(c1p2, 0)).toEqual(initialState(c1p2));
  });

  test('labStep advances, keeps prev and logs the input and events', () => {
    const sim = labStep(c1p2, labLoad(initialState(c1p2)), { t: 'set', part: 'train', to: 'half' });
    expect(sim.prev).toEqual(initialState(c1p2));
    expect(sim.state.parts.train).toBe('half');
    expect(sim.log).toHaveLength(1);
    expect(sim.log[0].tick).toBe(0);
    expect(sim.log[0].events.some((e) => e.type === 'partEnter' && e.id === 'train')).toBe(true);
  });

  test(`the log keeps the last ${LOG_TICKS} ticks`, () => {
    let sim = labLoad(initialState(c0p1));
    for (let i = 0; i < LOG_TICKS + 5 && !sim.state.done; i++) sim = labStep(c0p1, sim, { t: 'none' });
    expect(sim.log.length).toBeLessThanOrEqual(LOG_TICKS);
    expect(sim.log.at(-1)!.tick).toBe(sim.state.tick - 1);
  });

  test("playing the solver's solution reaches done; a done page doesn't tick", () => {
    const solution = solve(c1p2).solution!;
    let sim = labLoad(initialState(c1p2));
    for (const input of solution) sim = labStep(c1p2, sim, input);
    expect(sim.state.done).toBe(true);
    expect(labStep(c1p2, sim, { t: 'none' })).toBe(sim);
  });

  test('a step that throws (a reaction loop) keeps the state and records the error', () => {
    const s0 = initialState(loop);
    const looping = solve(loop).error!.path;
    let sim = labLoad(s0);
    for (const input of looping) sim = labStep(loop, sim, input);
    expect(sim.error).toMatch(/cascade|32/i);
    expect(sim.state.done).toBe(false);
  });

  test('legalInputs is every candidate but the wait', () => {
    const inputs = legalInputs(c1p2, initialState(c1p2));
    expect(inputs.map(inputLabel)).toEqual(['train → half', 'train → full', 'tap train', 'tap board', '摩卡 → pillar', 'pet 摩卡']);
  });
});

describe('labels', () => {
  test.each<[Input, string]>([
    [{ t: 'set', part: 'train', to: 'half' }, 'train → half'],
    [{ t: 'tap', id: 'board' }, 'tap board'],
    [{ t: 'mocha', perch: 'pillar' }, '摩卡 → pillar'],
    [{ t: 'pet' }, 'pet 摩卡'],
    [{ t: 'say', word: 'beep' }, 'say beep'],
    [{ t: 'floor', node: 'a' }, 'floor a'],
    [{ t: 'none' }, 'wait'],
  ])('%j', (input, label) => {
    expect(inputLabel(input)).toBe(label);
  });

  test('compactInputs folds waits', () => {
    expect(compactInputs([{ t: 'none' }, { t: 'none' }, { t: 'tap', id: 'x' }, { t: 'none' }])).toEqual(['wait ×2', 'tap x', 'wait']);
    expect(compactInputs([])).toEqual([]);
  });

  test('eventLabel', () => {
    expect(eventLabel({ type: 'partEnter', id: 'train', state: 'half' })).toBe('partEnter train=half');
    expect(eventLabel({ type: 'bark', id: 'bead', bark: 'want' })).toBe('bark bead want');
    expect(eventLabel({ type: 'cry' })).toBe('cry');
  });
});

describe('overlayModel', () => {
  test("1-2 at the start: nodes by height, closed edges, perches, the ranking and his target path", () => {
    const s = idleState(c1p2, 3);
    const m = overlayModel(c1p2, s);
    expect(m.nodes.map((n) => n.id)).toEqual(c1p2.nodes.map((n) => n.id));
    expect(m.nodes.find((n) => n.id === 'T1')).toMatchObject({ at: [60, 430], attachedTo: 'train' });
    expect(m.nodes.find((n) => n.id === 'pillarTop')!.height).toBe(2);
    const edge = (a: string, b: string) => m.edges.find((e) => e.a === a && e.b === b)!;
    expect(edge('L3', 'T1').open).toBe(false);
    expect(edge('L1', 'L2').open).toBe(true);
    expect(edge('bench', 'pillarTop')).toMatchObject({ cat: true, kind: 'jump' });
    expect(m.perches.find((p) => p.id === 'bench')).toMatchObject({ occupied: true, reach: [320, 430] });
    expect(m.attractors.map((a) => [a.id, a.rank, a.priority])).toEqual([
      ['bead', 1, 1],
      ['mocha', 2, 2],
    ]);
    expect(m.attractors[0]).toMatchObject({ goal: true, reachable: false });
    // He can't reach the bead yet: the preview runs to the nearest node he can get to
    expect(m.target).toMatchObject({ id: 'bead', to: [320, 430] });
    expect(m.target!.path.at(0)).toEqual(m.target!.from);
    expect(m.target!.path.at(-1)).toEqual([140, 430]);
    expect(m.mochaPath).toEqual([]);
  });

  test("Mocha's trip while travelling, the Mocha target, and no target once done", () => {
    const s = step(c1p2, idleState(c1p2, 3), { t: 'mocha', perch: 'pillar' }).state;
    const travelling = overlayModel(c1p2, { ...s, mocha: { perch: null, path: ['bench', 'pillarTop'], to: 'pillar' } });
    expect(travelling.mochaPath).toEqual([
      [340, 380],
      [280, 240],
    ]);
    const mochaTarget = overlayModel(c1p2, { ...s, baby: { ...s.baby, target: 'mocha' } });
    expect(mochaTarget.target?.id).toBe('mocha');
    expect(overlayModel(c1p2, { ...s, done: true }).target).toBeNull();
    expect(overlayModel(c1p2, { ...s, baby: { ...s.baby, target: 'nope' } }).target).toBeNull();
  });

  test('attractors he cannot want now are listed unranked; consumed ones are gone', () => {
    const s = idleState(c1p2, 3);
    const refused = overlayModel(c1p2, { ...s, baby: { ...s.baby, refused: ['bead'] } });
    expect(refused.attractors.find((a) => a.id === 'bead')).toMatchObject({ rank: null, priority: 1 });
    expect(overlayModel(c1p2, { ...s, consumed: ['bead'] }).attractors.some((a) => a.id === 'bead')).toBe(false);
  });
});

describe('edits', () => {
  const s0 = initialState(c1p2);

  test('moveNode moves a free node and leaves the original alone', () => {
    const def = moveNode(c1p2, s0, 'R2', [301.6, 420.2]);
    expect(def.nodes.find((n) => n.id === 'R2')).toMatchObject({ x: 302, y: 420 });
    expect(c1p2.nodes.find((n) => n.id === 'R2')).toMatchObject({ x: 320, y: 430 });
    expect(def).not.toBe(c1p2);
  });

  test("moveNode moves a riding node's position for the part's current state only", () => {
    const half = { ...s0, parts: { ...s0.parts, train: 'half' } };
    const def = moveNode(c1p2, half, 'T2', [195, 428]);
    expect(def.nodes.find((n) => n.id === 'T2')!.attach!.pos).toEqual({ out: [100, 430], half: [195, 428], full: [230, 430] });
  });

  test('moveNode on an unknown part state or id changes nothing', () => {
    const noTrain = { ...s0, parts: { board: 'times' } };
    expect(moveNode(c1p2, noTrain, 'T1', [1, 1]).nodes).toEqual(c1p2.nodes);
    expect(moveNode(c1p2, s0, 'zzz', [1, 1]).nodes).toEqual(c1p2.nodes);
  });

  test('moveTrackEnd moves one end; parts without a track are untouched', () => {
    const def = moveTrackEnd(c1p2, 'train', 'from', [70.4, 600]);
    expect(def.parts.find((p) => p.id === 'train')!.track).toEqual({ from: [70, 600], to: [200, 610] });
    expect(moveTrackEnd(c1p2, 'board', 'to', [0, 0]).parts).toEqual(c1p2.parts);
  });
});

describe('readability and art keys', () => {
  test('touchable count: parts plus perches, capped at 3 on pages 1–3', () => {
    expect(touchableCount(c1p2, initialState(c1p2))).toEqual({ parts: 2, perches: 1, total: 3, limit: 3 });
    expect(touchableCount(c0p1, initialState(c0p1))).toMatchObject({ perches: 0, limit: 3 });
    expect(touchableCount({ ...c1p2, index: 4 }, initialState(c1p2)).limit).toBeNull();
  });

  test('the art-key report lists the backdrop, every part and every creature', () => {
    const rows = artReport(c1p2);
    expect(rows.map((r) => [r.kind, r.id, r.key])).toEqual([
      ['backdrop', 'c1p2', 'c1/hall-night'],
      ['part', 'train', 'c1/train-blue'],
      ['part', 'board', 'c1/departure-board'],
      ['creature', 'pigeon', 'common/pigeon'],
    ]);
    // #96: the backdrop and the board are baked; the train tab is a live placeholder; #108: the pigeon has its origami art
    expect(rows.map((r) => r.status)).toEqual(['baked', 'placeholder', 'baked', 'baked']);
  });
});

describe('the page list', () => {
  const report = (r: Partial<PageReport>): PageReport => ({ stop: null, deadEnds: 0, lintErrors: 0, failures: [], ...r }) as PageReport;

  test.each<[Partial<PageReport> | undefined, string]>([
    [undefined, 'pending'],
    [{}, 'ok'],
    [{ stop: 'cap', deadEnds: null, failures: ['cap'] }, 'over cap'],
    [{ deadEnds: 3, lintErrors: 1, failures: ['x'] }, 'dead-end'],
    [{ lintErrors: 2, failures: ['x'] }, 'lint'],
    [{ failures: ['not solvable'] }, 'fail'],
  ])('%j → %s', (r, badge) => {
    expect(pageBadge(r === undefined ? undefined : report(r))).toBe(badge);
  });

  test('the lab lists every registered page, then the broken fixture', () => {
    expect(LAB_PAGES.slice(0, PAGES.length)).toEqual(PAGES);
    expect(LAB_FIXTURES.map((p) => p.id)).toEqual(['c1p2-broken', 'lab-words']);
    expect(labPageById('c1p2')).toBe(c1p2);
    expect(labPageById('c1p2-broken')).toBe(LAB_FIXTURES[0]);
    expect(labPageById('nope')).toBeUndefined();
  });

  test('the broken 1-2 differs from 1-2 only in the train lock', () => {
    const broken: PageDef = LAB_FIXTURES[0];
    expect({ ...broken, id: c1p2.id, title: c1p2.title, parts: c1p2.parts }).toEqual(c1p2);
    expect(broken.parts.find((p) => p.id === 'train')!.lockedWhen).toBeDefined();
  });
});
