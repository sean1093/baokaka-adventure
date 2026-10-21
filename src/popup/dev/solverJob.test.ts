import { describe, expect, test } from 'vitest';
import { initialState } from '../core/state';
import { step } from '../core/step';
import { solve } from '../core/solver';
import { pageById } from '../pages';
import { labStep, labLoad, moveNode } from './labModel';
import { LAB_PAGES } from './labPages';
import { handleRequest, summarise, type SolverReply } from './solverJob';

/**
 * PageLab's solver jobs (#91; what the worker runs): reports for the badges, a full solve with
 * dead ends whose states load and stay dead, edited pages, solving from any state, and errors.
 */

const clock = () => 0;
const run = (req: Parameters<typeof handleRequest>[0]): SolverReply[] => {
  const out: SolverReply[] = [];
  handleRequest(req, (r) => out.push(r), clock);
  return out;
};

describe('reports', () => {
  test('one report per lab page, in order; the registered pages are green and the fixture has dead ends', () => {
    const replies = run({ kind: 'reports', id: 0 });
    expect(replies.map((r) => (r.kind === 'report' ? r.page : r.kind))).toEqual(LAB_PAGES.map((p) => p.id));
    for (const r of replies) {
      if (r.kind !== 'report') throw new Error('expected reports');
      if (r.page === 'c1p2-broken') expect(r.report.deadEnds).toBeGreaterThan(0);
      // The ring demo offers all eight words on 1-3: 一起 there links them for the rest of the page,
      // so Mocha can't push the card any more — a move to undo the long way (#128: a page offers 一起
      // only where linked mode is the plan, from 10-5 on)
      else if (r.page === 'lab-words') expect(r.report.failures).toEqual([expect.stringMatching(/^1 soft trap: .*"together"/)]);
      else expect(r.report.failures).toEqual([]);
    }
  });
});

describe('solve', () => {
  test('a registered page: par, no dead ends, plain data (no functions)', () => {
    const [reply] = run({ kind: 'solve', id: 7, page: 'c1p2' });
    expect(reply.kind).toBe('solve');
    if (reply.kind !== 'solve') return;
    expect(reply.id).toBe(7);
    expect(reply.result).toMatchObject({ solvable: true, par: 2, deadEndCount: 0, mischiefReachable: true, tudigongReachable: true });
    expect(structuredClone(reply.result)).toEqual(reply.result);
    expect('nextAction' in reply.result).toBe(false);
  });

  test("the broken 1-2's dead ends load, and no way from them reaches done", () => {
    const def = LAB_PAGES.find((p) => p.id === 'c1p2-broken')!;
    const [reply] = run({ kind: 'solve', id: 1, page: def.id });
    if (reply.kind !== 'solve') throw new Error(reply.kind);
    const { result } = reply;
    expect(result.solvable).toBe(true);
    expect(result.deadEndCount).toBeGreaterThan(0);
    expect(result.deadEnds[0].path).toEqual([{ t: 'mocha', perch: 'pillar' }]);
    for (const d of result.deadEnds) {
      // The state is the path replayed from the start…
      let sim = labLoad(initialState(def));
      for (const input of d.path) sim = labStep(def, sim, input);
      expect(sim.state.parts).toEqual(d.state.parts);
      // …and a fresh solve from it finds no way out
      expect(solve(def, d.state).solvable).toBe(false);
    }
  });

  test('from a state: solves from there', () => {
    const def = pageById('c1p2')!;
    const half = step(def, initialState(def), { t: 'set', part: 'train', to: 'half' }).state;
    const [reply] = run({ kind: 'solve', id: 2, page: 'c1p2', from: half });
    if (reply.kind !== 'solve') throw new Error(reply.kind);
    expect(reply.result.par).toBe(2);
    expect(reply.result.solution![0]).not.toEqual({ t: 'set', part: 'train', to: 'half' });
  });

  test('an edited copy is solved as sent', () => {
    const def = pageById('c1p2')!;
    // A copy with an extra L3–R1 edge: he crawls to the bead unaided, so it comes back trivial
    const edited = { ...def, edges: [...def.edges, { a: 'L3', b: 'R1', kind: 'crawl' as const }] };
    const [reply] = run({ kind: 'solve', id: 3, page: 'c1p2', def: edited });
    if (reply.kind !== 'solve') throw new Error(reply.kind);
    expect(reply.result.trivial).toBe(true);
    // A position-only edit (what edit mode makes) solves like the original
    const moved = moveNode(def, initialState(def), 'R1', [262, 431]);
    const [again] = run({ kind: 'solve', id: 5, page: 'c1p2', def: moved });
    expect(again.kind === 'solve' && again.result.par).toBe(2);
  });

  test('an unknown page answers with an error', () => {
    expect(run({ kind: 'solve', id: 4, page: 'nope' })).toEqual([{ kind: 'error', id: 4, message: "no page 'nope'" }]);
  });

  test('summarise drops nextAction and keeps dead-end paths and states', () => {
    const r = solve(LAB_PAGES.find((p) => p.id === 'c1p2-broken')!);
    const s = summarise(r);
    expect(s.deadEnds).toHaveLength(r.deadEnds.length);
    expect(s.deadEnds[0]).toEqual({ path: r.deadEnds[0].path, state: r.deadEnds[0].state });
  });
});
