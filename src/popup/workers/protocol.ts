import { nextHint, type HintAnswer, type HintSource } from '../core/hint';
import type { Id, Input, PageDef, SimState } from '../core/types';

/**
 * The hint worker's message protocol (GDD § 2.7, § 3.7; #100): `{ pageId, state } → { action | null,
 * source }`, plus a request id (a newer request supersedes an older one's answer) and, for a page
 * the registry doesn't hold (PageLab's stages, an edited copy), the page data itself.
 */
export interface HintRequest {
  readonly id: number;
  readonly pageId: Id;
  readonly state: SimState;
  /** The page itself, when it isn't the registered page with that id */
  readonly def?: PageDef;
}

export type HintReply =
  | { readonly id: number; readonly action: Input | null; readonly source: HintSource }
  /** The worker couldn't answer (an unknown page): the client falls back at once */
  | { readonly id: number; readonly failed: true };

/**
 * Answers one request: the solver from `state` within the § 3.7 budget, else the fallback
 * (`nextHint`). Throws only for an unknown page (the client then falls back itself).
 */
export function answerHint(req: HintRequest, pageById: (id: Id) => PageDef | undefined, clock: () => number): HintReply {
  const def = req.def ?? pageById(req.pageId);
  if (def === undefined) throw new Error(`hint worker: no page '${req.pageId}'`);
  const answer: HintAnswer = nextHint(def, req.state, { clock });
  return { id: req.id, action: answer.action, source: answer.source };
}
