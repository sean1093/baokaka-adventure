import { afterEach, describe, expect, test, vi } from 'vitest';
import { fallbackHint, nextHint } from '../core/hint';
import { initialState } from '../core/state';
import { step } from '../core/step';
import type { PageDef } from '../core/types';
import { registry } from '../pages';
import { HintClient, HINT_WORKER_TIMEOUT_MS, type WorkerLike } from './hintClient';
import { answerHint, type HintReply, type HintRequest } from './protocol';

const c1p2 = registry.pageById('c1p2')!;
const clock = () => performance.now();

/** A fake worker running the real job (`answerHint`) a microtask later, or misbehaving on cue. */
function fakeWorker(mode: 'answer' | 'silent' | 'error' | 'throwOnPost' = 'answer') {
  const sent: HintRequest[] = [];
  let terminated = false;
  const w: WorkerLike = {
    onmessage: null,
    onerror: null,
    postMessage(req) {
      if (mode === 'throwOnPost') throw new Error('DataCloneError');
      sent.push(req);
      queueMicrotask(() => {
        if (mode === 'error') return w.onerror?.(new Error('boom'));
        if (mode === 'silent') return;
        let reply: HintReply;
        try {
          reply = answerHint(req, registry.pageById, clock);
        } catch {
          reply = { id: req.id, failed: true };
        }
        w.onmessage?.({ data: reply });
      });
    },
    terminate() {
      terminated = true;
    },
  };
  return { w, sent, terminated: () => terminated };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('the worker job (answerHint)', () => {
  test('answers a registered page by id: the solver\'s next action', () => {
    const state = initialState(c1p2);
    const reply = answerHint({ id: 7, pageId: 'c1p2', state }, registry.pageById, clock);
    expect(reply).toEqual({ id: 7, ...nextHint(c1p2, state, { clock }) });
    expect(reply).toMatchObject({ source: 'solver' });
  });

  test('answers a page sent as data (a lab stage, an edited copy)', () => {
    const def: PageDef = { ...c1p2, id: 'lab-copy' };
    const reply = answerHint({ id: 1, pageId: def.id, state: initialState(def), def }, registry.pageById, clock);
    expect(reply).toMatchObject({ id: 1, source: 'solver' });
  });

  test('throws for an unknown page (the worker answers `failed`)', () => {
    expect(() => answerHint({ id: 1, pageId: 'nope', state: initialState(c1p2) }, registry.pageById, clock)).toThrow(/no page/);
  });
});

describe('HintClient: never fails (requirement 2)', () => {
  test('the worker\'s answer', async () => {
    const fake = fakeWorker();
    const client = new HintClient({ createWorker: () => fake.w });
    const state = initialState(c1p2);
    await expect(client.ask(c1p2, state)).resolves.toEqual(nextHint(c1p2, state, { clock }));
    // The registered page goes by id only
    expect(fake.sent[0]).toEqual({ id: 1, pageId: 'c1p2', state });
  });

  test('a page the registry doesn\'t hold is sent as data', async () => {
    const fake = fakeWorker();
    const client = new HintClient({ createWorker: () => fake.w });
    const def: PageDef = { ...c1p2, id: 'lab-copy' };
    await client.ask(def, initialState(def));
    expect(fake.sent[0].def).toBe(def);
  });

  test('no worker at all (no `Worker` here): the fallback', async () => {
    const client = new HintClient({ createWorker: () => null });
    const state = initialState(c1p2);
    await expect(client.ask(c1p2, state)).resolves.toEqual(fallbackHint(c1p2, state));
  });

  test('a worker that fails to start: the fallback', async () => {
    const client = new HintClient({
      createWorker: () => {
        throw new Error('blocked');
      },
    });
    await expect(client.ask(c1p2, initialState(c1p2))).resolves.toMatchObject({ source: 'solution' });
  });

  test('a worker that errors: the fallback, and it isn\'t tried again', async () => {
    const fake = fakeWorker('error');
    let starts = 0;
    const client = new HintClient({ createWorker: () => (starts++, fake.w) });
    const state = initialState(c1p2);
    await expect(client.ask(c1p2, state)).resolves.toEqual(fallbackHint(c1p2, state));
    expect(fake.terminated()).toBe(true);
    await expect(client.ask(c1p2, state)).resolves.toEqual(fallbackHint(c1p2, state));
    expect(starts).toBe(1);
  });

  test('a message that can\'t be cloned: the fallback', async () => {
    const client = new HintClient({ createWorker: () => fakeWorker('throwOnPost').w });
    await expect(client.ask(c1p2, initialState(c1p2))).resolves.toMatchObject({ source: 'solution' });
  });

  test('a worker that answers `failed` (an unknown page): the fallback', async () => {
    const client = new HintClient({ createWorker: () => fakeWorker().w, registered: () => true });
    const def: PageDef = { ...c1p2, id: 'unknown' };
    await expect(client.ask(def, initialState(def))).resolves.toMatchObject({ source: 'solution' });
  });

  test('a worker that doesn\'t answer in time: the fallback', async () => {
    vi.useFakeTimers();
    const client = new HintClient({ createWorker: () => fakeWorker('silent').w });
    const state = step(c1p2, initialState(c1p2), { t: 'set', part: 'train', to: 'half' }).state;
    const answer = client.ask(c1p2, state);
    vi.advanceTimersByTime(HINT_WORKER_TIMEOUT_MS);
    await expect(answer).resolves.toEqual(fallbackHint(c1p2, state));
  });

  test('a done page: nothing to hint, no worker needed', async () => {
    let started = false;
    const client = new HintClient({ createWorker: () => ((started = true), fakeWorker().w) });
    const done = { ...initialState(c1p2), done: true };
    await expect(client.ask(c1p2, done)).resolves.toEqual({ action: null, source: 'solver' });
    expect(started).toBe(false);
  });

  test('dispose: waiting asks get the fallback; a later ask starts a worker again (React\'s double mount)', async () => {
    let starts = 0;
    const client = new HintClient({ createWorker: () => (starts++, fakeWorker(starts === 1 ? 'silent' : 'answer').w) });
    const answer = client.ask(c1p2, initialState(c1p2));
    client.dispose();
    await expect(answer).resolves.toMatchObject({ source: 'solution' });
    await expect(client.ask(c1p2, initialState(c1p2))).resolves.toMatchObject({ source: 'solver' });
    expect(starts).toBe(2);
  });
});
