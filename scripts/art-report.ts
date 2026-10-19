/**
 * `npm run art:report` (#96): prints each page's art payload against the GDD § 3.9 budget (350 KB
 * per page, 2.5 MB first load) from the committed manifests, without baking. Exits 1 when a
 * budget is blown, so it can gate a script; `src/popup/env/env.test.ts` checks the same in CI.
 */
import { ENV_MANIFEST } from '../src/popup/env/env.gen';
import { FIRST_LOAD_BUDGET, PAGE_ART_BUDGET, firstLoad, formatReport, pageArt } from '../src/popup/env/report';
import { PAGES } from '../src/popup/pages';

console.log(formatReport(PAGES, ENV_MANIFEST));
const over = PAGES.some((p) => pageArt(p, ENV_MANIFEST).bytes > PAGE_ART_BUDGET) || firstLoad(PAGES, ENV_MANIFEST).bytes > FIRST_LOAD_BUDGET;
if (over) process.exitCode = 1;
