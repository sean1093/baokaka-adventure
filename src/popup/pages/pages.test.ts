import { describe, expect, test } from 'vitest';
import { SCRIPT } from '../content/script';
import { lintPage, type LintResult } from '../core/lint';
import { replay } from '../core/replay';
import { solve, toSolutionSteps, type SolveResult } from '../core/solver';
import type { PageDef } from '../core/types';
import { PAGES } from './index';

/**
 * Every registered page must pass this (GDD § 3.7, issue #87): the lint has no errors; replaying
 * its `solution` reaches `done`; the solver finds it solvable with no dead ends, no cascade
 * overflow, not trivial (unless `allowTrivial`), and the 淘氣 and 土地公 reachable. Par outside
 * the difficulty band is a warning. Content issues add pages to the registry, never to this file.
 * On a failure the assertion message carries a compact report table (page, par, states, ms).
 */

/** GDD § 3.7: difficulty → par band. */
const PAR_BAND: Record<PageDef['difficulty'], [number, number]> = { 1: [1, 2], 2: [2, 3], 3: [3, 4], 4: [4, 5], 5: [5, 7] };

interface Row {
  readonly def: PageDef;
  readonly lint: LintResult;
  readonly solved: SolveResult;
}

const clock = () => performance.now();
const rows: Row[] = PAGES.map((def) => ({ def, lint: lintPage(def, SCRIPT), solved: solve(def, undefined, { clock }) }));

const pad = (s: string | number, n: number) => String(s).padEnd(n);
/** The report designers read when a page fails: one line per page. */
function table(): string {
  const head = `${pad('page', 8)}${pad('diff', 6)}${pad('par', 6)}${pad('states', 10)}${pad('dead', 7)}${pad('ms', 8)}lint`;
  const lines = rows.map(({ def, lint, solved: r }) =>
    `${pad(def.id, 8)}${pad(def.difficulty, 6)}${pad(r.par ?? '-', 6)}${pad(r.statesExplored, 10)}${pad(r.deadEndCount ?? '?', 7)}${pad(Math.round(r.ms ?? 0), 8)}` +
    `${lint.errors.length}E ${lint.warnings.length}W${r.error ? ` ${r.error.kind}` : ''}${r.stop ? ` stop:${r.stop}` : ''}`,
  );
  return ['', head, ...lines].join('\n');
}

describe('the page registry', () => {
  test('has pages', () => {
    expect(PAGES.length).toBeGreaterThan(0);
  });

  test('solves within the CI budget (GDD § 3.7: all 65 pages in under 60 s)', () => {
    const ms = rows.reduce((sum, { solved }) => sum + (solved.ms ?? 0), 0);
    expect(ms, table()).toBeLessThan(60_000);
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
