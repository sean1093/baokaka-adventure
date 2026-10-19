import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HintAnswer } from '../../core/hint';
import { solverKey } from '../../core/solver';
import type { Input, PageDef, SimState } from '../../core/types';
import type { PageSession } from '../../game/session';
import { HintClient } from '../../workers/hintClient';
import {
  hintDisplay,
  NO_HINT,
  NUDGE_MS,
  pressHint,
  SHOW_ME_LEAD_MS,
  SHOW_ME_LEAD_REDUCED_MS,
  SHOW_ME_TAIL_MS,
  WAIT_MS,
  WHERE_MS,
  type HintDisplay,
  type HintLevel,
} from './ladder';

/**
 * The hint ladder on a page (GDD § 2.7; #100; the rules are `ladder.ts`): 提示 climbs 1 → 2 → 3
 * (and 3 again), each press asking the hint worker (`HintClient`) for the next useful action from
 * the state *now*; the player's own move (`acted`) drops it back to 0. Level 3 shows the hand,
 * then plays the action as a real input (after 重來 for a `restart` answer). The auto nudge (level
 * 0) comes after `autoMs` with no state change (the solver's key: the clock and the reach beat
 * don't count), while nothing holds the page and the ladder is at rest, and again after each
 * further `autoMs` of stillness.
 */

export interface HintLadderOptions {
  readonly def: PageDef;
  readonly session: PageSession;
  readonly state: SimState;
  /** Off in a still (screenshots) */
  readonly enabled: boolean;
  /** The auto nudge's delay (`autoHintMs`), or null when off */
  readonly autoMs: number | null;
  /** A layer is over the page: no auto nudge */
  readonly held: boolean;
  readonly reduced: boolean;
  /** Level 3 is about to play `action` (the page closes the word ring for a `say`) */
  readonly onPlay?: (action: Input) => void;
}

export interface HintLadder {
  readonly level: HintLevel;
  readonly display: HintDisplay;
  /** Bumps whenever a hint is shown (so the same line shows again on the next press) */
  readonly serial: number;
  /** The answer behind the display (dev: `data-hint-source`) */
  readonly answer: HintAnswer | null;
  /** 提示 */
  readonly press: () => void;
  /** The player moved: back to 0 */
  readonly acted: () => void;
}

export function useHintLadder({ def, session, state, enabled, autoMs, held, reduced, onPlay }: HintLadderOptions): HintLadder {
  const client = useMemo(() => new HintClient(), []);
  useEffect(() => {
    if (enabled) client.warm();
    return undefined;
  }, [client, enabled]);
  useEffect(() => () => client.dispose(), [client]);

  const [level, setLevel] = useState<HintLevel>(0);
  const [shown, setShown] = useState<{ display: HintDisplay; serial: number; answer: HintAnswer | null }>({ display: NO_HINT, serial: 0, answer: null });
  const levelRef = useRef<HintLevel>(0);
  const request = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const clearTimers = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  }, []);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  const hide = useCallback(() => setShown((s) => (s.display === NO_HINT ? s : { display: NO_HINT, serial: s.serial, answer: null })), []);

  const setLadder = useCallback((next: HintLevel) => {
    levelRef.current = next;
    setLevel(next);
  }, []);

  /** Shows an answer at a level, and for level 3 plays it. */
  const show = useCallback(
    (answer: HintAnswer, at: HintLevel) => {
      clearTimers();
      const display = hintDisplay(def, answer, at);
      setShown((s) => ({ display, serial: s.serial + 1, answer }));
      const { action } = answer;
      if (action === null) return;
      if (at === 3) {
        const lead = reducedRef.current ? SHOW_ME_LEAD_REDUCED_MS : SHOW_ME_LEAD_MS;
        later(() => {
          onPlayRef.current?.(action);
          if (answer.source === 'restart') session.reset();
          if (action.t !== 'none') session.input(action);
        }, lead);
        later(hide, lead + SHOW_ME_TAIL_MS);
      } else if (at === 0) later(hide, NUDGE_MS);
      else if (at === 1 || action.t === 'none') later(hide, action.t === 'none' ? WAIT_MS : WHERE_MS);
      // Level 2's hand stays until the player moves or presses again
    },
    [def, session, clearTimers, later, hide],
  );

  const press = useCallback(() => {
    if (!enabled) return;
    const now = session.frame().state;
    if (now.done) return;
    const next = pressHint(levelRef.current);
    setLadder(next);
    const id = ++request.current;
    void client.ask(def, now).then((answer) => {
      if (id === request.current) show(answer, next);
    });
  }, [enabled, session, def, client, show, setLadder]);

  const acted = useCallback(() => {
    request.current++;
    clearTimers();
    setLadder(0);
    hide();
  }, [clearTimers, setLadder, hide]);

  // A new session (重來, another page) or the page done: back to rest
  useEffect(() => acted, [session, acted]);
  useEffect(() => {
    if (state.done) acted();
  }, [state.done, acted]);
  useEffect(() => () => clearTimers(), [clearTimers]);

  // The auto nudge: `autoMs` of stillness (the solver's key unchanged), the ladder at rest
  const key = useMemo(() => solverKey(def, state), [def, state]);
  const [nudges, setNudges] = useState(0);
  useEffect(() => {
    if (!enabled || autoMs === null || held || level !== 0 || state.done) return undefined;
    const t = setTimeout(() => {
      const id = ++request.current;
      void client.ask(def, session.frame().state).then((answer) => {
        if (id !== request.current || levelRef.current !== 0) return;
        // A lost page (重來) is the player's call: the nudge stays quiet
        if (answer.source !== 'restart') show(answer, 0);
        setNudges((n) => n + 1);
      });
    }, autoMs);
    return () => clearTimeout(t);
  }, [enabled, autoMs, held, level, state.done, key, nudges, client, def, session, show]);

  return { level, display: shown.display, serial: shown.serial, answer: shown.answer, press, acted };
}
