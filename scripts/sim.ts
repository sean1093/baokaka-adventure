// Balance report: `npm run sim [seeds]`. The harness itself lives next to the engine.
import { POLICIES, summarize } from '../src/quest/engine/sim';

const seeds = Number(process.argv[2] ?? 200);

for (const [name, policy] of Object.entries(POLICIES)) {
  const report = summarize(policy, seeds);
  console.log(`\n${name.toUpperCase()}: finished ${report.finished}/${seeds}, wipes ${report.wipes.toFixed(2)}/run`);
  console.log(report.rows.join('\n'));
}
