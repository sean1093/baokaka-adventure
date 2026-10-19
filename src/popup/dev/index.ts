/**
 * `src/popup/dev/`: developer tools that never ship. `PageLab.tsx` is `#/pagelab` (GDD § 3.10):
 * App lazy-loads it only when `import.meta.env.DEV` is true, so production builds drop it, and with
 * it `solver.worker.ts`, PageLab's solver worker. Do not import anything from this folder outside
 * that lazy import.
 */
export {};
