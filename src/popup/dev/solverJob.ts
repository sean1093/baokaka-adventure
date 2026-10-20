import { solve, type SolveResult } from '../core/solver';
import type { Id, Input, PageDef, SimState } from '../core/types';
import { reportPage, type PageReport } from '../pages/report';
import { LAB_PAGES, labPageById } from './labPages';

/**
 * PageLab's solver jobs (GDD § 3.10, #91), run off the main thread by `solver.worker.ts`: a full
 * solve of one page (from its start or from any state) for the solver panel, and the per-page
 * report (`pages/report.ts`, the same judge as `pages.test.ts` and `npm run solve`) for the page
 * list's badges. Results cross the worker boundary by structured clone, so `LabSolve` is
 * `SolveResult` without its `nextAction` function. Pure apart from the clock passed in.
 */

export interface LabDeadEnd {
  /** Inputs from the solve's start state (waits as `none`). */
  readonly path: Input[];
  readonly state: SimState;
}

export type LabSolve = Omit<SolveResult, 'nextAction' | 'softTraps' | 'deadEnds'> & { readonly deadEnds: readonly LabDeadEnd[] };

export type SolverRequest =
  /** Solve `def` (an edited copy) or the lab page `page`, from `from` or its start. */
  | { readonly kind: 'solve'; readonly id: number; readonly page: Id; readonly def?: PageDef; readonly from?: SimState }
  /** The solver report of every page the lab lists (`LAB_PAGES`), one reply each, in order. */
  | { readonly kind: 'reports'; readonly id: number };

export type SolverReply =
  | { readonly kind: 'solve'; readonly id: number; readonly result: LabSolve }
  | { readonly kind: 'report'; readonly id: number; readonly page: Id; readonly report: PageReport }
  | { readonly kind: 'error'; readonly id: number; readonly message: string };

/** A solve result as plain data. */
export function summarise(r: SolveResult): LabSolve {
  const { nextAction: _next, softTraps: _traps, deadEnds, ...rest } = r;
  void _next;
  void _traps;
  return { ...rest, deadEnds: deadEnds.map((d) => ({ path: d.path, state: d.state })) };
}

/** Answers one request through `post` (a report request posts once per page). */
export function handleRequest(req: SolverRequest, post: (reply: SolverReply) => void, clock: () => number): void {
  try {
    if (req.kind === 'reports') {
      for (const def of LAB_PAGES) post({ kind: 'report', id: req.id, page: def.id, report: reportPage(def, { clock }) });
      return;
    }
    const def = req.def ?? labPageById(req.page);
    if (def === undefined) throw new Error(`no page '${req.page}'`);
    post({ kind: 'solve', id: req.id, result: summarise(solve(def, req.from, { clock })) });
  } catch (e) {
    post({ kind: 'error', id: req.id, message: e instanceof Error ? e.message : String(e) });
  }
}
