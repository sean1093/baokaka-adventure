/**
 * `src/popup/workers/`: Web Workers. `hint.worker.ts` (#100) runs the solver from the current state
 * off the main thread and posts back the next action (GDD § 2.7, § 3.7); `protocol.ts` is its
 * message protocol and job, `hintClient.ts` the page's side (timeouts and failures fall back).
 */
export { HintClient, HINT_WORKER_TIMEOUT_MS, type WorkerLike } from './hintClient';
export { answerHint, type HintReply, type HintRequest } from './protocol';
