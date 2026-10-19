import { registry } from '../pages';
import { answerHint, type HintReply, type HintRequest } from './protocol';

/**
 * The hint worker (GDD § 2.7, § 3.7; #100): runs the solver from the player's current state off the
 * main thread — `solve(def, state, { cap: 200_000, timeMs: 300, clock, stopAtGoal: true })`, then
 * `nextAction` — and posts back the next useful action and where it came from. Thin on purpose:
 * the logic is `core/hint.ts` (tested in-process). A request it can't answer is answered `failed`,
 * and the client falls back.
 */
// The worker's global, typed narrowly (the project's lib is DOM, not WebWorker)
const scope = self as unknown as {
  onmessage: ((e: MessageEvent<HintRequest>) => void) | null;
  postMessage(message: HintReply): void;
};

scope.onmessage = (e) => {
  try {
    scope.postMessage(answerHint(e.data, registry.pageById, () => performance.now()));
  } catch {
    // An unknown page: the client falls back (§ 2.7 requirement 2)
    scope.postMessage({ id: e.data.id, failed: true });
  }
};
