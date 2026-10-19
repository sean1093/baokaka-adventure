import { SCRIPT } from '../content/script';
import { lintPage, type LintResult } from '../core/lint';
import { replay } from '../core/replay';
import { DEFAULT_CAP, solve, toSolutionSteps, type SolveResult } from '../core/solver';
import type { PageDef } from '../core/types';

/**
 * The solver report (issue #88, GDD § 3.7): lint + replay + solve per page, judged by the same
 * rules as `pages.test.ts`, and formatted as the table `npm run solve` (`scripts/solve-pages.ts`)
 * prints. Pure apart from the clock the caller passes; uses the core's public API only.
 */

/** GDD § 3.7: difficulty → par band (inclusive). Outside it is a warning, not a failure. */
export const PAR_BAND: Readonly<Record<PageDef['difficulty'], readonly [number, number]>> = {
  1: [1, 2],
  2: [2, 3],
  3: [3, 4],
  4: [4, 5],
  5: [5, 7],
};

/** GDD § 3.7 / § 8: the whole solver suite must run in under 60 s. */
export const CI_BUDGET_MS = 60_000;

/** One page's line in the report. */
export interface PageReport {
  readonly id: string;
  readonly title: string;
  readonly chapter: number;
  readonly difficulty: PageDef['difficulty'];
  readonly par: number | null;
  readonly band: readonly [number, number];
  readonly parInBand: boolean;
  readonly states: number;
  /** Solver wall time in ms (0 without a clock). */
  readonly ms: number;
  /** Dead-end count, or null when the search was incomplete. */
  readonly deadEnds: number | null;
  readonly trivial: boolean;
  readonly allowTrivial: boolean;
  readonly mischief: boolean;
  readonly tudigong: boolean;
  readonly lintErrors: number;
  readonly lintWarnings: number;
  /** Replaying the page's authored `solution` reaches `done`. */
  readonly replayOk: boolean;
  /** Why the search stopped early (`'cap'`: over the state cap), or null. */
  readonly stop: SolveResult['stop'];
  /** Everything that fails the page (empty = green), one human-readable line each. */
  readonly failures: readonly string[];
  /** Things worth a look that don't fail the page (lint warnings, par outside its band). */
  readonly warnings: readonly string[];
}

export interface ReportOptions {
  /** A millisecond clock for the solver's `ms` (e.g. `() => performance.now()`). */
  readonly clock?: () => number;
  /** State cap per page (default the solver's `DEFAULT_CAP`). */
  readonly cap?: number;
}

/** Lints, replays and solves one page and judges it (the same checks as `pages.test.ts`). */
export function reportPage(def: PageDef, opts: ReportOptions = {}): PageReport {
  const cap = opts.cap ?? DEFAULT_CAP;
  const lint = lintPage(def, SCRIPT);
  let replayOk = false;
  let replayError = '';
  try {
    replayOk = replay(def, def.solution).state.done;
  } catch (e) {
    replayError = String(e);
  }
  const solved = solve(def, undefined, { cap, clock: opts.clock });
  return judge(def, lint, solved, { replayOk, replayError, cap });
}

/** Builds a report line from finished lint/solve results. Exported for tests. */
export function judge(
  def: PageDef,
  lint: LintResult,
  r: SolveResult,
  extra: { readonly replayOk: boolean; readonly replayError?: string; readonly cap?: number },
): PageReport {
  const band = PAR_BAND[def.difficulty];
  const parInBand = r.par !== null && r.par >= band[0] && r.par <= band[1];
  const allowTrivial = def.allowTrivial === true;
  const failures: string[] = [];
  for (const e of lint.errors) failures.push(`lint ${e.message}`);
  if (!extra.replayOk) failures.push(`the authored solution does not reach done${extra.replayError ? `: ${extra.replayError}` : ''}`);
  if (r.stop === 'cap') failures.push(`exceeded the state cap (${(extra.cap ?? DEFAULT_CAP).toLocaleString('en-US')} states): simplify the page`);
  else if (r.stop !== null && r.stop !== 'error') failures.push(`search stopped early (${r.stop})`);
  if (r.error) failures.push(`${r.error.kind}: ${r.error.message}`);
  if (!r.solvable && r.complete) failures.push('not solvable');
  if (r.deadEndCount !== null && r.deadEndCount > 0) {
    const first = r.deadEnds[0];
    const path = first ? ` (first: ${JSON.stringify(toSolutionSteps(first.path))})` : '';
    failures.push(`${r.deadEndCount} dead-end state${r.deadEndCount === 1 ? '' : 's'}${path}`);
  }
  if (r.trivial && !allowTrivial) failures.push('trivial (solvable by waiting) without allowTrivial');
  // On an incomplete search `false` only means "not found"; the stop reason already fails the page.
  if (r.complete && !r.mischiefReachable) failures.push('the 淘氣 is not reachable');
  if (r.complete && !r.tudigongReachable) failures.push('the 土地公 is not reachable');
  const warnings = lint.warnings.map((w) => `lint ${w.message}`);
  if (!parInBand && r.solvable) warnings.push(`par ${r.par ?? '-'} is outside difficulty ${def.difficulty}'s band ${band[0]}–${band[1]}`);
  return {
    id: def.id,
    title: def.title,
    chapter: def.chapter,
    difficulty: def.difficulty,
    par: r.par,
    band,
    parInBand,
    states: r.statesExplored,
    ms: Math.round((r.ms ?? 0) * 10) / 10,
    deadEnds: r.deadEndCount,
    trivial: r.trivial,
    allowTrivial,
    mischief: r.mischiefReachable,
    tudigong: r.tudigongReachable,
    lintErrors: lint.errors.length,
    lintWarnings: lint.warnings.length,
    replayOk: extra.replayOk,
    stop: r.stop,
    failures,
    warnings,
  };
}

/** Pages a filter selects: `page` matches an id, `chapter` a chapter number (0 = the prologue). */
export function selectPages(pages: readonly PageDef[], filter: { readonly page?: string; readonly chapter?: number }): PageDef[] {
  return pages.filter((p) => (filter.page === undefined || p.id === filter.page) && (filter.chapter === undefined || p.chapter === filter.chapter));
}

export interface CliArgs {
  readonly page?: string;
  readonly chapter?: number;
  readonly json: boolean;
  readonly cap?: number;
}

/** Parses `--page <id>`, `--chapter <n>`, `--json` and `--cap <n>` (also as `--flag=value`). Throws on anything else. */
export function parseArgs(argv: readonly string[]): CliArgs {
  let page: string | undefined;
  let chapter: number | undefined;
  let cap: number | undefined;
  let json = false;
  const int = (flag: string, v: string | undefined, min: number): number => {
    if (v === undefined || !/^\d+$/.test(v) || Number(v) < min) throw new Error(`${flag} needs an integer ≥ ${min}, got ${v ?? 'nothing'}`);
    return Number(v);
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const eq = arg.indexOf('=');
    const flag = eq >= 0 ? arg.slice(0, eq) : arg;
    const value = (): string | undefined => (eq >= 0 ? arg.slice(eq + 1) : argv[++i]);
    switch (flag) {
      case '--page': {
        const v = value();
        if (!v || v.startsWith('--')) throw new Error('--page needs a page id, e.g. --page c1p2');
        page = v;
        break;
      }
      case '--chapter':
        chapter = int('--chapter', value(), 0);
        break;
      case '--cap':
        cap = int('--cap', value(), 1);
        break;
      case '--json':
        if (eq >= 0) throw new Error('--json takes no value');
        json = true;
        break;
      default:
        throw new Error(`unknown argument '${arg}' (options: --page <id>, --chapter <n>, --json, --cap <n>)`);
    }
  }
  return { page, chapter, json, cap };
}

/** Terminal columns a string takes: East Asian wide/fullwidth characters count 2. */
export function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    const wide =
      (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0x303e) ||
      (c >= 0x3041 && c <= 0x33ff) ||
      (c >= 0x3400 && c <= 0x4dbf) ||
      (c >= 0x4e00 && c <= 0x9fff) ||
      (c >= 0xa000 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe4f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) ||
      (c >= 0x20000 && c <= 0x3fffd);
    w += wide ? 2 : 1;
  }
  return w;
}

const padTo = (s: string, n: number) => s + ' '.repeat(Math.max(0, n - displayWidth(s)));
/** ✓ reachable, ✗ not, `?` not found by an incomplete search. */
const found = (r: PageReport, ok: boolean) => (ok ? '✓' : r.stop === null ? '✗' : '?');

const COLUMNS = ['page', 'title', 'diff', 'par', 'states', 'ms', 'dead', 'trivial', '淘氣', '土地公', 'lint', 'result'] as const;

/** One row's cells, in `COLUMNS` order. */
function cells(r: PageReport): string[] {
  return [
    r.id,
    r.title,
    String(r.difficulty),
    r.par === null ? '-' : `${r.par} ${r.parInBand ? '✓' : `! ${r.band[0]}–${r.band[1]}`}`,
    r.states.toLocaleString('en-US'),
    String(Math.round(r.ms)),
    r.deadEnds === null ? '?' : String(r.deadEnds),
    r.trivial ? (r.allowTrivial ? 'yes (ok)' : 'YES') : 'no',
    found(r, r.mischief),
    found(r, r.tudigong),
    `${r.lintErrors}E ${r.lintWarnings}W`,
    r.failures.length === 0 ? 'ok' : r.stop === 'cap' ? 'FAIL cap' : 'FAIL',
  ];
}

/**
 * The report table: a header, a rule and one aligned row per page (columns: id, title, difficulty,
 * par with its band check — `✓` in band, `! lo–hi` outside, `-` unsolved —, states, solver ms,
 * dead ends, trivial, 淘氣 and 土地公 ✓/✗ (`?` = not found by an incomplete search), lint errors/warnings, result).
 */
export function formatTable(rows: readonly PageReport[]): string {
  const body = rows.map(cells);
  const widths = COLUMNS.map((h, i) => Math.max(displayWidth(h), ...body.map((c) => displayWidth(c[i]))));
  const line = (c: readonly string[]) => c.map((s, i) => (i === c.length - 1 ? s : padTo(s, widths[i]))).join('  ');
  return [line(COLUMNS), widths.map((w) => '─'.repeat(w)).join('  '), ...body.map(line)].join('\n');
}

/** Failure and warning lines under the table, grouped by page (empty when there are none). */
export function formatDetails(rows: readonly PageReport[]): string {
  const out: string[] = [];
  for (const r of rows) {
    for (const f of r.failures) out.push(`✗ ${r.id}: ${f}`);
    for (const w of r.warnings) out.push(`! ${r.id}: ${w}`);
  }
  return out.join('\n');
}

/** The closing line: page count, failures and total runtime against the 60 s budget. */
export function formatSummary(rows: readonly PageReport[], totalMs: number, budgetMs = CI_BUDGET_MS): string {
  const failed = rows.filter((r) => r.failures.length > 0).length;
  const time = `${(totalMs / 1000).toFixed(2)} s of the ${budgetMs / 1000} s budget (${((100 * totalMs) / budgetMs).toFixed(1)} %)`;
  const verdict = failed === 0 && totalMs < budgetMs ? 'OK' : 'FAIL';
  const over = totalMs >= budgetMs ? ' — over budget' : '';
  return `${verdict}: ${rows.length} page${rows.length === 1 ? '' : 's'}, ${failed} failing · total ${time}${over}`;
}

/** True when the run should exit 1: any failing page, or the total over the budget. */
export function reportFailed(rows: readonly PageReport[], totalMs: number, budgetMs = CI_BUDGET_MS): boolean {
  return totalMs >= budgetMs || rows.some((r) => r.failures.length > 0);
}
