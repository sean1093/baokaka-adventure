import { handleRequest, type SolverReply, type SolverRequest } from './solverJob';

/**
 * PageLab's solver worker (GDD § 3.10 requirement 1, #91): runs `solverJob.ts` off the main thread
 * so a big solve never freezes the lab. Dev builds only (PageLab is its only importer). #100's
 * `workers/hint.worker.ts` is the in-game counterpart; PageLab may switch to it later.
 */
// The worker's global, typed narrowly (the project's lib is DOM, not WebWorker)
const scope = self as unknown as {
  onmessage: ((e: MessageEvent<SolverRequest>) => void) | null;
  postMessage(message: SolverReply): void;
};

scope.onmessage = (e) => {
  handleRequest(e.data, (reply) => scope.postMessage(reply), () => performance.now());
};
