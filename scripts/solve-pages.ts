// Solver report for every page (issue #88, GDD § 3.7): `npm run solve [-- --page c1p2 | --chapter 1] [--json | --curve] [--cap N]`.
// `--curve` prints the difficulty curve as Markdown (#137: docs/project/difficulty.md).
// Lints, replays and solves each registered page and prints one row per page plus the total runtime
// against the 60 s CI budget. Exits 1 on any failing page, on a page over its state cap (at once,
// naming the page) or when the total is over budget. The logic lives in src/popup/pages/report.ts.
import { ALL_PAGES as PAGES } from '../src/popup/pages';
import {
  CI_BUDGET_MS,
  formatCurve,
  formatDetails,
  formatSummary,
  formatTable,
  parseArgs,
  reportFailed,
  reportPage,
  selectPages,
  type CliArgs,
  type PageReport,
} from '../src/popup/pages/report';

let args: CliArgs;
try {
  args = parseArgs(process.argv.slice(2));
} catch (e) {
  console.error(`solve-pages: ${(e as Error).message}`);
  process.exit(2);
}

const pages = selectPages(PAGES, args);
if (pages.length === 0) {
  const what = [args.page !== undefined && `page '${args.page}'`, args.chapter !== undefined && `chapter ${args.chapter}`].filter(Boolean).join(' in ');
  console.error(`solve-pages: no ${what || 'pages'} in the registry (pages: ${PAGES.map((p) => p.id).join(', ')})`);
  process.exit(2);
}

const clock = () => performance.now();
const started = clock();
const rows: PageReport[] = [];

function finish(code: number, note?: string): never {
  const totalMs = clock() - started;
  if (args.json) {
    console.log(JSON.stringify({ pages: rows, totalMs: Math.round(totalMs), budgetMs: CI_BUDGET_MS, ok: code === 0, note: note ?? null }, null, 2));
  } else if (args.curve) {
    console.log(formatCurve(rows));
    console.log(`\n${formatSummary(rows, totalMs)}`);
  } else {
    console.log(formatTable(rows));
    const details = formatDetails(rows);
    if (details) console.log(`\n${details}`);
    if (note) console.log(`\n${note}`);
    console.log(`\n${formatSummary(rows, totalMs)}`);
  }
  process.exit(code);
}

const progress = !args.json && !args.curve && process.stderr.isTTY;
for (const def of pages) {
  if (progress) process.stderr.write(`solving ${def.id}…\r`);
  const row = reportPage(def, { clock, cap: args.cap });
  rows.push(row);
  if (row.stop === 'cap') {
    const skipped = pages.length - rows.length;
    finish(1, `✗ ${def.id} exceeded its state cap — stopped here${skipped > 0 ? ` (${skipped} page${skipped === 1 ? '' : 's'} not solved)` : ''}.`);
  }
}
if (progress) process.stderr.write(' '.repeat(40) + '\r');

finish(reportFailed(rows, clock() - started) ? 1 : 0);
