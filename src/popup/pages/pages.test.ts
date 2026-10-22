import { describe, expect, test } from 'vitest';
import { SCRIPT } from '../content/script';
import { lintPage, type LintResult } from '../core/lint';
import { replay } from '../core/replay';
import { solve, toSolutionSteps, type SolveResult } from '../core/solver';
import type { PageDef } from '../core/types';
import { PAGES } from './index';
import { CI_BUDGET_MS, formatDetails, formatTable, judge, PAR_BAND } from './report';

/**
 * Every registered page must pass this (GDD § 3.7, issue #87): the lint has no errors; replaying
 * its `solution` reaches `done`; the solver finds it solvable with no dead ends, no soft traps
 * (#183), no cascade overflow, not trivial (unless `allowTrivial`), and the 淘氣 and 土地公 reachable. Par outside
 * the difficulty band is a warning. Content issues add pages to the registry, never to this file.
 * On a failure the assertion message carries the `npm run solve` report table (`./report.ts`).
 */

interface Row {
  readonly def: PageDef;
  readonly lint: LintResult;
  readonly solved: SolveResult;
}

/**
 * The budget counts the solver's own CPU time (#133, D-98): vitest runs the test files in parallel
 * worker processes, and on a 4-vCPU CI runner the wall clock of this file's solves was ≈ 2.9× this
 * machine's while the hint tests solved every page beside it. `process.cpuUsage` is this worker's
 * alone, so the 60 s budget measures the pages, not the neighbours.
 */
const clock = () => {
  const { user, system } = process.cpuUsage();
  return (user + system) / 1000;
};
const rows: Row[] = PAGES.map((def) => ({ def, lint: lintPage(def, SCRIPT), solved: solve(def, undefined, { clock }) }));

/** The report designers read when a page fails: `npm run solve`'s table (replay is checked by its own test). */
function table(): string {
  const report = rows.map(({ def, lint, solved }) => judge(def, lint, solved, { replayOk: true }));
  return ['', formatTable(report), formatDetails(report)].join('\n');
}

describe('the page registry', () => {
  test('has pages', () => {
    expect(PAGES.length).toBeGreaterThan(0);
  });

  test('solves within the CI budget (GDD § 3.7: all 65 pages in under 60 s)', () => {
    const ms = rows.reduce((sum, { solved }) => sum + (solved.ms ?? 0), 0);
    expect(ms, table()).toBeLessThan(CI_BUDGET_MS);
  });
});

describe.each(rows.map((row) => [row.def.id, row] as const))('page %s', (_id, { def, lint, solved: r }) => {
  test('lints clean', () => {
    if (lint.warnings.length > 0) console.warn(`${def.id} lint warnings:\n  ${lint.warnings.map((w) => w.message).join('\n  ')}`);
    expect(lint.errors.map((e) => e.message), table()).toEqual([]);
  });

  test('replaying the solution reaches done', () => {
    let done = false;
    let failure = '';
    try {
      done = replay(def, def.solution).state.done;
    } catch (e) {
      failure = String(e);
    }
    expect({ done, failure }, table()).toEqual({ done: true, failure: '' });
  });

  test('the solver: solvable, complete, no dead ends, no cascade overflow', () => {
    const deadEnds = r.deadEnds.slice(0, 3).map((d) => toSolutionSteps(d.path));
    expect({ solvable: r.solvable, stop: r.stop, error: r.error, deadEndCount: r.deadEndCount, deadEnds }, table()).toEqual({
      solvable: true,
      stop: null,
      error: null,
      deadEndCount: 0,
      deadEnds: [],
    });
  });

  test('no soft traps: no first move has to be undone (#183)', () => {
    const traps = r.softTraps().slice(0, 3).map((t) => ({ after: toSolutionSteps(t.path), move: toSolutionSteps([t.move]), regret: t.regret }));
    expect(traps, table()).toEqual([]);
  });

  test('no walkable decoy: every decoy stays out of his reach in every reachable state (#112)', () => {
    const decoys = r.decoysReachable.map((d) => ({ decoy: d.id, at: d.node, after: toSolutionSteps(d.path) }));
    expect(decoys, table()).toEqual([]);
  });

  test('no visible ties in reachable states (GDD § 3.6 rule 14; warning only)', () => {
    for (const t of r.visibleTies) console.warn(`${def.id}: '${t.ids[0]}' and '${t.ids[1]}' tie (only distance or id decides) after ${JSON.stringify(toSolutionSteps(t.path))}`);
  });

  test(def.allowTrivial ? 'trivial is allowed' : 'not trivial', () => {
    if (!def.allowTrivial) expect(r.trivial, table()).toBe(false);
  });

  test('the 淘氣 and the 土地公 are reachable', () => {
    expect({ mischief: r.mischiefReachable, tudigong: r.tudigongReachable }, table()).toEqual({ mischief: true, tudigong: true });
  });

  test('par is within the difficulty band (warning only)', () => {
    const [lo, hi] = PAR_BAND[def.difficulty];
    if (r.par === null || r.par < lo || r.par > hi) {
      console.warn(`${def.id}: par ${r.par ?? '-'} is outside difficulty ${def.difficulty}'s band ${lo}–${hi}${table()}`);
    }
  });
});
