// Balance report: `npm run sim [seeds]`. The harness itself lives next to the engine.
import { POLICIES, summarize } from '../src/quest/engine/sim';

const seeds = Number(process.argv[2] ?? 300);
for (const [name, policy] of Object.entries(POLICIES)) {
  const report = summarize(policy, seeds);
  console.log(`\n${name.toUpperCase()}: finished ${report.finished}/${seeds}, avg defeats ${report.averageDefeats.toFixed(2)}`);
  console.log(report.rows.join('\n'));
}
