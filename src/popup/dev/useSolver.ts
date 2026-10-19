import { useCallback, useEffect, useRef, useState } from 'react';
import type { Id, PageDef, SimState } from '../core/types';
import type { PageReport } from '../pages/report';
import type { LabSolve, SolverReply, SolverRequest } from './solverJob';

/**
 * PageLab's link to `solver.worker.ts` (GDD § 3.10 requirement 1: the solver runs off the main
 * thread). On mount it asks for every registered page's report (the page list's badges); `solve`
 * asks for one page — edited or not, from its start or from any state — and a newer request
 * supersedes an older one's answer.
 */

export interface SolveRun {
  readonly status: 'running' | 'done' | 'error';
  /** The page id the run is for. */
  readonly page: Id;
  /** The state the search started from (the solution and dead-end paths start here). */
  readonly from: SimState;
  readonly result?: LabSolve;
  readonly error?: string;
}

export function useSolver() {
  const worker = useRef<Worker | null>(null);
  const latest = useRef(0);
  const [reports, setReports] = useState<Readonly<Record<Id, PageReport>>>({});
  const [run, setRun] = useState<SolveRun | null>(null);

  useEffect(() => {
    const w = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    w.onmessage = (e: MessageEvent<SolverReply>) => {
      const reply = e.data;
      if (reply.kind === 'report') {
        setReports((r) => ({ ...r, [reply.page]: reply.report }));
        return;
      }
      if (reply.id !== latest.current) return;
      setRun((r) => (r === null ? r : reply.kind === 'solve' ? { ...r, status: 'done', result: reply.result } : { ...r, status: 'error', error: reply.message }));
    };
    const reportsReq: SolverRequest = { kind: 'reports', id: 0 };
    w.postMessage(reportsReq);
    return () => {
      w.terminate();
      worker.current = null;
    };
  }, []);

  /** Solves `def` from `from`. `edited` sends the page data itself (positions changed in edit mode). */
  const solve = useCallback((def: PageDef, from: SimState, edited: boolean, fromStart: boolean) => {
    const w = worker.current;
    if (!w) return;
    const id = ++latest.current;
    setRun({ status: 'running', page: def.id, from });
    const req: SolverRequest = { kind: 'solve', id, page: def.id, def: edited ? def : undefined, from: fromStart ? undefined : from };
    try {
      w.postMessage(req);
    } catch {
      // Page data that can't be cloned (a custom reaction function): solve the registered page instead
      w.postMessage({ ...req, def: undefined });
    }
  }, []);

  const clear = useCallback(() => {
    latest.current++;
    setRun(null);
  }, []);

  return { reports, run, solve, clear };
}
