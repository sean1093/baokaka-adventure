import { describe, expect, test } from 'vitest';
import type { LintIssue, LintResult } from '../core/lint';
import type { SolveResult } from '../core/solver';
import type { PageDef } from '../core/types';
import { PAGES, pageById } from './index';
import {
  CI_BUDGET_MS,
  CI_BUDGET_STATES,
  displayWidth,
  formatCurve,
  formatDetails,
  formatSummary,
  formatTable,
  judge,
  pageLabel,
  PAR_BAND,
  parseArgs,
  reportFailed,
  reportPage,
  selectPages,
  type PageReport,
} from './report';

const c1p2 = pageById('c1p2') as PageDef;
const CLEAN: LintResult = { errors: [], warnings: [] };

/** A complete, green solve result; override fields per test. */
function solved(over: Partial<SolveResult> = {}): SolveResult {
  return {
    solvable: true,
    complete: true,
    stop: null,
    par: 2,
    solution: [],
    deadEnds: [],
    deadEndCount: 0,
    trivial: false,
    mischiefReachable: true,
    tudigongReachable: true,
    statesExplored: 182,
    edges: 400,
    ms: 25.04,
    error: null,
    nextAction: () => null,
    softTraps: () => [],
    decoysReachable: [],
    visibleTies: [],
    ...over,
  };
}

const issue = (severity: 'error' | 'warning', code: string): LintIssue => ({
  code,
  severity,
  page: 'c1p2',
  ids: [],
  message: `c1p2: ${code} happened`,
});

describe('the budget as work (D-98)', () => {
  test('60 s at the calibrated 7,000 states a second', () => {
    expect(CI_BUDGET_STATES).toBe(420_000);
  });
});

describe('judge', () => {
  test('a green page has no failures and par in band', () => {
    const r = judge(c1p2, CLEAN, solved(), { replayOk: true });
    expect(r).toMatchObject({ id: 'c1p2', title: '月台的縫', par: 2, band: [2, 3], parInBand: true, states: 182, ms: 25, deadEnds: 0 });
    expect(r.failures).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  test.each<[string, Partial<SolveResult>, boolean, RegExp]>([
    ['dead ends', { deadEndCount: 3 }, true, /3 dead-end states/],
    ['trivial', { trivial: true, par: 0 }, true, /trivial/],
    ['淘氣', { mischiefReachable: false }, true, /淘氣 is not reachable/],
    ['土地公', { tudigongReachable: false }, true, /土地公 is not reachable/],
    ['unsolvable', { solvable: false, par: null }, true, /not solvable/],
    ['cap', { complete: false, stop: 'cap', deadEndCount: null }, true, /exceeded the state cap \(2,000,000 states\)/],
    ['time', { complete: false, stop: 'time', deadEndCount: null }, true, /stopped early \(time\)/],
    ['cascade', { complete: false, stop: 'error', error: { kind: 'cascadeOverflow', message: 'loop', path: [] } }, true, /^cascadeOverflow: loop$/],
    ['replay', {}, false, /authored solution does not reach done/],
    ['a soft trap', { softTraps: () => [{ path: [], move: { t: 'tap', id: 'curtain' }, regret: 2 }] }, true, /^1 soft trap: a move that must be undone \(first: \[\{"tap":"curtain"\}\] after \[\], \+2 moves\)$/],
    ['a walkable decoy', { decoysReachable: [{ id: 'moon', node: 'L3', path: [{ t: 'none' }] }] }, true, /^decoy 'moon' is walkable at 'L3' \(first: \[\{"wait":1\}\]\)$/],
  ])('fails on %s', (_name, over, replayOk, re) => {
    const r = judge(c1p2, CLEAN, solved(over), { replayOk });
    expect(r.failures.some((f) => re.test(f)), r.failures.join('\n')).toBe(true);
  });

  test('a capped search reports only the cap, not "not found" reachability', () => {
    const r = judge(c1p2, CLEAN, solved({ complete: false, stop: 'cap', solvable: false, par: null, mischiefReachable: false, tudigongReachable: false, deadEndCount: null }), {
      replayOk: true,
      cap: 50,
    });
    expect(r.failures).toEqual(['exceeded the state cap (50 states): simplify the page']);
  });

  test('a visible tie in a reachable state only warns (GDD § 3.6 rule 14, #112)', () => {
    const r = judge(c1p2, CLEAN, solved({ visibleTies: [{ ids: ['lampA', 'lampB'], path: [{ t: 'set', part: 'spot', to: '1' }] }] }), { replayOk: true });
    expect(r.failures).toEqual([]);
    expect(r.warnings).toEqual([`visible tie: 'lampA' and 'lampB' only by distance or id (first: [{"set":"spot","to":"1"}])`]);
  });

  test('allowTrivial makes a trivial page pass', () => {
    const r = judge({ ...c1p2, allowTrivial: true }, CLEAN, solved({ trivial: true, par: 0 }), { replayOk: true });
    expect(r.failures).toEqual([]);
    // Par 0 is what a trivial page has (page E, #135): no band warning
    expect(r.warnings).toEqual([]);
  });

  test('lint errors fail, lint warnings and par out of band only warn', () => {
    const lint: LintResult = { errors: [issue('error', 'L01-unknown-ref')], warnings: [issue('warning', 'L14-visible-tie')] };
    const r = judge(c1p2, lint, solved({ par: 5 }), { replayOk: true });
    expect(r).toMatchObject({ lintErrors: 1, lintWarnings: 1, parInBand: false });
    expect(r.failures).toEqual(['lint c1p2: L01-unknown-ref happened']);
    expect(r.warnings).toEqual(['lint c1p2: L14-visible-tie happened', "par 5 is outside difficulty 2's band 2–3"]);
  });

  test('PAR_BAND follows GDD § 3.7', () => {
    expect(PAR_BAND).toEqual({ 1: [1, 2], 2: [2, 3], 3: [3, 4], 4: [4, 5], 5: [5, 7] });
  });
});

describe('formatTable', () => {
  const green = judge(c1p2, CLEAN, solved(), { replayOk: true });
  const bad = judge({ ...c1p2, id: 'c9p9', title: '壞', difficulty: 1 }, { errors: [issue('error', 'L01')], warnings: [] }, solved({ par: 4, deadEndCount: 2, mischiefReachable: false, statesExplored: 12345 }), {
    replayOk: true,
  });
  const capped = judge({ ...c1p2, id: 'c9p8' }, CLEAN, solved({ complete: false, stop: 'cap', deadEndCount: null, par: null, solvable: false, mischiefReachable: false, tudigongReachable: false }), { replayOk: true });

  test('renders the header, a rule and one aligned row per page', () => {
    expect(formatTable([green, bad, capped])).toMatchInlineSnapshot(`
      "page  title     diff  par      states  ms  dead  traps  trivial  淘氣  土地公  lint   result
      ────  ────────  ────  ───────  ──────  ──  ────  ─────  ───────  ────  ──────  ─────  ────────
      c1p2  月台的縫  2     2 ✓      182     25  0     0      no       ✓     ✓       0E 0W  ok
      c9p9  壞        1     4 ! 1–2  12,345  25  2     0      no       ✗     ✓       1E 0W  FAIL
      c9p8  月台的縫  2     -        182     25  ?     ?      no       ?     ?       0E 0W  FAIL cap"
    `);
  });

  test('every row has the same display width up to the last column', () => {
    const lines = formatTable([green, bad, capped]).split('\n');
    const lastCol = (l: string) => displayWidth(l) - displayWidth(l.slice(l.lastIndexOf('  ') + 2));
    expect(new Set(lines.map(lastCol)).size).toBe(1);
  });

  test('marks an allowed trivial page', () => {
    const r = judge({ ...c1p2, allowTrivial: true }, CLEAN, solved({ trivial: true, par: 0 }), { replayOk: true });
    expect(formatTable([r])).toContain('yes (ok)');
    expect(formatTable([judge(c1p2, CLEAN, solved({ trivial: true, par: 0 }), { replayOk: true })])).toContain('YES');
  });

  test('details list failures, then warnings, per page', () => {
    expect(formatDetails([green])).toBe('');
    expect(formatDetails([bad]).split('\n')).toEqual([
      '✗ c9p9: lint c1p2: L01 happened',
      '✗ c9p9: 2 dead-end states',
      '✗ c9p9: the 淘氣 is not reachable',
      "! c9p9: par 4 is outside difficulty 1's band 1–2",
    ]);
  });
});

describe('summary and exit status', () => {
  const green: PageReport = judge(c1p2, CLEAN, solved(), { replayOk: true });
  const bad: PageReport = judge(c1p2, CLEAN, solved({ deadEndCount: 1 }), { replayOk: true });

  test('prints the total runtime against the 60 s budget', () => {
    expect(formatSummary([green, green], 1234)).toBe('OK: 2 pages, 0 failing · total 1.23 s of the 60 s budget (2.1 %)');
    expect(formatSummary([green, bad], 500)).toBe('FAIL: 2 pages, 1 failing · total 0.50 s of the 60 s budget (0.8 %)');
    expect(formatSummary([green], CI_BUDGET_MS + 1)).toMatch(/^FAIL: 1 page, 0 failing · total 60\.00 s of the 60 s budget \(100\.0 %\) — over budget$/);
  });

  test('fails on a failing page or on the budget', () => {
    expect(reportFailed([green], 10)).toBe(false);
    expect(reportFailed([green, bad], 10)).toBe(true);
    expect(reportFailed([green], CI_BUDGET_MS)).toBe(true);
  });
});

describe('the difficulty curve (#137)', () => {
  const row = (id: string, par: number | null, states = 100) => {
    const def = pageById(id) as PageDef;
    return judge(def, CLEAN, solved({ par, statesExplored: states, solvable: par !== null }), { replayOk: true });
  };

  test('labels pages in play order, page E and the bonus page by letter', () => {
    expect([row('c0p3', 1), row('c10p6', 3), row('c11p1', 0), row('c12p1', 2)].map(pageLabel)).toEqual(['0-3', '10-6', 'E', 'B']);
  });

  test('charts par against difficulty per page and per chapter, then tabulates both', () => {
    const md = formatCurve([row('c0p3', 1, 23), row('c1p1', 1, 73), row('c1p2', 2, 182)]);
    expect(md).toContain('x-axis ["0-3", "1-1", "1-2"]');
    expect(md).toContain('bar [1, 1, 2]');
    expect(md).toContain('line [2, 1, 2]');
    expect(md).toContain('x-axis ["P", "1"]');
    expect(md).toContain('bar [1.00, 1.50]');
    expect(md).toContain('| P | 1 | 2.00 | 1.00 | 1 | 23 |');
    expect(md).toContain('| 1 | 2 | 1.50 | 1.50 | 1 · 2 | 255 |');
    expect(md).toContain('| 0-3 | 摩卡起床 | 2 | 2–3 | **1** (out of band) | 23 |');
    expect(md).toContain('| 1-2 | 月台的縫 | 2 | 2–3 | 2 | 182 |');
    expect(md).toContain(`Total: 3 pages, 278 states of the ${CI_BUDGET_STATES.toLocaleString('en-US')} budget.`);
  });
});

describe('parseArgs and selectPages', () => {
  test.each<[string[], object]>([
    [[], { json: false, curve: false }],
    [['--json'], { json: true, curve: false }],
    [['--curve'], { json: false, curve: true }],
    [['--page', 'c1p2'], { page: 'c1p2', json: false, curve: false }],
    [['--page=c1p2', '--json'], { page: 'c1p2', json: true, curve: false }],
    [['--chapter', '1'], { chapter: 1, json: false, curve: false }],
    [['--chapter=0', '--cap', '5000'], { chapter: 0, cap: 5000, json: false, curve: false }],
  ])('%j', (argv, expected) => {
    expect(JSON.parse(JSON.stringify(parseArgs(argv)))).toEqual(expected);
  });

  test.each([[['--chapter']], [['--chapter', 'one']], [['--cap', '0']], [['--page']], [['--page', '--json']], [['--json=1']], [['--curve=1']], [['c1p2']], [['--verbose']]])(
    'rejects %j',
    (argv) => {
      expect(() => parseArgs(argv)).toThrow();
    },
  );

  test('filters by page id and chapter', () => {
    expect(selectPages(PAGES, {}).map((p) => p.id)).toEqual(PAGES.map((p) => p.id));
    expect(selectPages(PAGES, { page: 'c1p2' }).map((p) => p.id)).toEqual(['c1p2']);
    expect(selectPages(PAGES, { chapter: 0 }).map((p) => p.id)).toEqual(['c0p1', 'c0p2', 'c0p3', 'c0p4']);
    expect(selectPages(PAGES, { page: 'c1p2', chapter: 0 })).toEqual([]);
    expect(selectPages(PAGES, { page: 'nope' })).toEqual([]);
  });
});

describe('displayWidth', () => {
  test.each([
    ['', 0],
    ['c1p2', 4],
    ['月台的縫', 8],
    ['土地公 ✓', 8],
    ['ＡＢ', 4],
  ])('%j → %i', (s, w) => {
    expect(displayWidth(s)).toBe(w);
  });
});

describe('reportPage on the registered pages', () => {
  test.each(PAGES.map((p) => [p.id, p] as const))('%s is green', (_id, def) => {
    const r = reportPage(def, { clock: () => performance.now() });
    expect(r.failures).toEqual([]);
    expect(r.replayOk).toBe(true);
  });

  test('a tiny cap stops the page with a cap failure', () => {
    const r = reportPage(c1p2, { cap: 10 });
    expect(r.stop).toBe('cap');
    expect(r.failures[0]).toBe('exceeded the state cap (10 states): simplify the page');
    expect(r.ms).toBe(0);
  });
});

test('reportPage reports a solution that does not reach done', () => {
  const r = reportPage({ ...c1p2, solution: [{ wait: 1 }] });
  expect(r.replayOk).toBe(false);
  expect(r.failures.filter((f) => f.startsWith('the authored solution does not reach done'))).toHaveLength(1);
});
