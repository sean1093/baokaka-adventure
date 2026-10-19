import type { DefinePage } from './types';

/**
 * The identity helper every page file wraps its data in (GDD § 3.4): it returns `def` unchanged
 * and exists so the object literal is checked against `PageDef` with full inference. Re-exported
 * by `src/popup/pages/`.
 */
export const definePage: DefinePage = (def) => def;
