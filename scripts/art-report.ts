/**
 * `npm run art:report` (#96): prints each page's art payload against the GDD § 3.9 budget (350 KB
 * per page, 2.5 MB first load) from the committed manifests, without baking, then the release's
 * art-gap gate (#138: a backdrop, part, cut-out, carriage or creature drawing a stand-in). Exits 1
 * when a budget is blown or a gap is left, so it can gate a script; `src/popup/env/env.test.ts`
 * checks the same in CI.
 */
import { ENV_MANIFEST } from '../src/popup/env/env.gen';
import { FIRST_LOAD_BUDGET, PAGE_ART_BUDGET, firstLoad, formatReport, pageArt } from '../src/popup/env/report';
import { ALL_PAGES as PAGES } from '../src/popup/pages';
import { artGaps } from '../src/popup/view/art/gaps';

console.log(formatReport(PAGES, ENV_MANIFEST));
const gaps = PAGES.flatMap((p) => artGaps(p, ENV_MANIFEST));
console.log(`\nArt gaps (#138: keys drawing a stand-in; the kit's pull tabs and drawn carriages are live on purpose): ${gaps.length === 0 ? '0 ok' : gaps.length}`);
for (const g of gaps) console.log(`  ✗ ${g.page} ${g.kind} ${g.key}`);
const over = PAGES.some((p) => pageArt(p, ENV_MANIFEST).bytes > PAGE_ART_BUDGET) || firstLoad(PAGES, ENV_MANIFEST).bytes > FIRST_LOAD_BUDGET;
if (over || gaps.length > 0) process.exitCode = 1;
