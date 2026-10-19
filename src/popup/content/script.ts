import type { LineTable } from '../core/lint';

/**
 * The line table (GDD § 5): `LineKey` → zh-Hant text, ≤ 30 characters a line. Lint rule 10 checks
 * every page's line keys against it (`pages.test.ts`). Empty until #102 copies the script in; until
 * then pages carry no `lines`.
 */
export const SCRIPT: LineTable = {};
