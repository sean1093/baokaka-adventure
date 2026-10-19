import { fallbackHint, type HintAnswer } from '../core/hint';
import type { PageDef, SimState } from '../core/types';
import { registry } from '../pages';
import type { HintReply, HintRequest } from './protocol';

/**
 * The page's side of the hint worker (GDD § 2.7; #100): `ask(def, state)` resolves with the next
 * useful action — the worker's (the solver within its 300 ms budget, else its fallback) — and
 * **never fails**: a worker that can't start, errors, can't take the message or doesn't answer in
 * `HINT_WORKER_TIMEOUT_MS` degrades silently to the stored-solution fallback computed here
 * (`fallbackHint`: cheap, no search). Once a worker has errored it isn't tried again on this page.
 */

/** How long the client waits for the worker (its own search stops at 300 ms; this covers its start-up). */
export const HINT_WORKER_TIMEOUT_MS = 2000;

/** The part of `Worker` the client uses (tests pass a fake). */
export interface WorkerLike {
  postMessage(message: HintRequest): void;
  terminate(): void;
  onmessage: ((e: { readonly data: HintReply }) => void) | null;
  onerror: ((e: unknown) => void) | null;
}

export interface HintClientOptions {
  /** Starts the worker (default: `workers/hint.worker.ts`; none where `Worker` doesn't exist) */
  readonly createWorker?: () => WorkerLike | null;
  readonly timeoutMs?: number;
  /** Whether the worker knows the page by id (the registered page); otherwise its data is sent */
  readonly registered?: (def: PageDef) => boolean;
}

const defaultWorker = (): WorkerLike | null =>
  typeof Worker === 'undefined' ? null : (new Worker(new URL('./hint.worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike);

const isRegistered = (def: PageDef) => registry.pageById(def.id) === def;

interface Pending {
  readonly def: PageDef;
  readonly state: SimState;
  readonly resolve: (answer: HintAnswer) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

export class HintClient {
  private worker: WorkerLike | null = null;
  private broken = false;
  private seq = 0;
  private readonly pending = new Map<number, Pending>();
  private readonly create: () => WorkerLike | null;
  private readonly timeoutMs: number;
  private readonly registered: (def: PageDef) => boolean;

  constructor({ createWorker = defaultWorker, timeoutMs = HINT_WORKER_TIMEOUT_MS, registered = isRegistered }: HintClientOptions = {}) {
    this.create = createWorker;
    this.timeoutMs = timeoutMs;
    this.registered = registered;
  }

  /** Starts the worker ahead of the first hint (its script loads while the player looks at the page). */
  warm(): void {
    this.ensure();
  }

  /** The next useful action from `state`. Always resolves. */
  ask(def: PageDef, state: SimState): Promise<HintAnswer> {
    if (state.done) return Promise.resolve({ action: null, source: 'solver' });
    const worker = this.ensure();
    if (worker === null) return Promise.resolve(fallbackHint(def, state));
    const id = ++this.seq;
    return new Promise<HintAnswer>((resolve) => {
      const timer = setTimeout(() => this.settle(id, null), this.timeoutMs);
      this.pending.set(id, { def, state, resolve, timer });
      const req: HintRequest = this.registered(def) ? { id, pageId: def.id, state } : { id, pageId: def.id, state, def };
      try {
        worker.postMessage(req);
      } catch {
        // Data that can't be cloned (a custom reaction function): the fallback
        this.settle(id, null);
      }
    });
  }

  /**
   * Stops the worker; anything still waiting gets the fallback. A later `ask` starts it again (React's
   * development double mount disposes and re-uses the same client).
   */
  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    for (const id of [...this.pending.keys()]) this.settle(id, null);
  }

  private ensure(): WorkerLike | null {
    if (this.broken) return null;
    if (this.worker !== null) return this.worker;
    let worker: WorkerLike | null = null;
    try {
      worker = this.create();
    } catch {
      worker = null;
    }
    if (worker === null) {
      this.broken = true;
      return null;
    }
    worker.onmessage = (e) => this.settle(e.data.id, e.data);
    worker.onerror = () => {
      // A worker that errored is done for this page: everything falls back from now on
      this.broken = true;
      this.dispose();
    };
    this.worker = worker;
    return worker;
  }

  private settle(id: number, reply: HintReply | null): void {
    const p = this.pending.get(id);
    if (p === undefined) return;
    this.pending.delete(id);
    clearTimeout(p.timer);
    p.resolve(reply !== null && !('failed' in reply) ? { action: reply.action, source: reply.source } : fallbackHint(p.def, p.state));
  }
}
