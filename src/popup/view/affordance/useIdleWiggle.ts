import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Id, PageDef } from '../../core/types';
import type { WigglePhase } from './look';
import { marigoldParts } from './look';
import { WiggleScheduler } from './wiggle';

/**
 * The idle wiggle on a real clock (bible § 4.1, § 8): the scheduler's `nextAt` becomes one
 * `setTimeout` at a time, and each due part flips its wiggle run (`a` ↔ `b`), which restarts its
 * one-shot CSS animation (`affordance.css`). Off under reduced motion, in a still, and while
 * `quiet` (a finger is down or a drag is live: the world is paused and he is watching the finger).
 * `excluded` parts (locked ones) are skipped when their turn comes.
 *
 * `poke(id)` wiggles one part now: a prop answering a tap (bible § 4 props).
 */
export function useIdleWiggle(def: Pick<PageDef, 'id' | 'parts'>, { enabled, quiet = false, excluded = [] }: { enabled: boolean; quiet?: boolean; excluded?: readonly Id[] }) {
  const ids = useMemo(() => marigoldParts(def.parts), [def]);
  const [runs, setRuns] = useState<Readonly<Record<Id, WigglePhase>>>({});
  const skip = excluded.join(' ');

  const flip = useCallback((list: readonly Id[]) => {
    if (list.length === 0) return;
    setRuns((r) => {
      const next = { ...r };
      for (const id of list) next[id] = r[id] === 'a' ? 'b' : 'a';
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled || ids.length === 0) return undefined;
    // A seed per page, so each page has its own rhythm and keeps it between visits
    const seed = [...def.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    const t0 = performance.now();
    const scheduler = new WiggleScheduler(ids, { seed, startMs: 1200 });
    const skipped = new Set(skip.split(' '));
    let timer: ReturnType<typeof setTimeout> | null = null;
    const arm = () => {
      const wait = Math.max(16, scheduler.nextAt() - (performance.now() - t0));
      timer = setTimeout(() => {
        const due = scheduler.due(performance.now() - t0).filter((id) => !skipped.has(id));
        if (!quiet) flip(due);
        arm();
      }, wait);
    };
    arm();
    return () => {
      if (timer !== null) clearTimeout(timer);
    };
  }, [enabled, quiet, ids, def.id, skip, flip]);

  const poke = useCallback((id: Id) => flip([id]), [flip]);
  return { wiggle: runs, poke };
}
