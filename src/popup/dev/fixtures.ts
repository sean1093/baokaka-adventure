import { initialState, replay, step } from '../core';
import type { SimEvent } from '../core/events';
import type { BabyMode, Id, PageDef, SimState, SolutionStep } from '../core/types';
import { pageById } from '../pages';

/**
 * Visual QA fixtures for 翻翻台北 (#92; docs/project/README.md § 5): named, deterministic game
 * states, each rendered full screen at `#/pagelab?fixture=<name>&still=1` with no lab chrome.
 * `scripts/visual-check.mjs` screenshots every one at 390×844 and 375×667 and `scripts/ui-check.mjs`
 * runs the audience-rule checks (R5, R6, reduced motion, flashing) on each: **the fixture list is
 * the screenshot list.** Later UI issues add theirs (cover, word ring, hint hand, sticker card,
 * photo, album, settings, chapter card).
 *
 * A fixture is a page id plus a step list (the solution-step language: inputs and `wait`s),
 * replayed through `core/step` from the page's initial state, so it never drifts from the engine.
 * `expect` pins what the fixture is meant to show; `fixtures.test.ts` fails when the engine (or a
 * page edit) moves the state away from it, which is the cue to update the steps, not the
 * expectation.
 *
 * Dev only, like the rest of `dev/`.
 */

export interface PopupFixture {
  /** Kebab-case, unique among popup and art lab fixtures (it is the screenshot's file name) */
  readonly name: string;
  /** A registered page id */
  readonly page: Id;
  /** Replayed from the page's initial state; empty is the page as it opens */
  readonly steps: readonly SolutionStep[];
  /** What a reviewer should see (shown in the fixture index) */
  readonly note: string;
  /** What the final state must show: Baokaka's mode and/or an event of the last tick */
  readonly expect?: { readonly mode?: BabyMode; readonly event?: SimEvent['type'] };
}

export const POPUP_FIXTURES: readonly PopupFixture[] = [
  {
    name: 'c0p1-start',
    page: 'c0p1',
    steps: [],
    note: '0-1 as it opens: Baokaka in the crib, the rail up, the mobile still.',
    expect: { mode: 'idle' },
  },
  {
    name: 'c1p2-reaching',
    page: 'c1p2',
    steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }],
    note: '1-2: the train tab jammed at half by the pigeon; Baokaka rode it to the gap and reaches for the bead.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c1p2-riding',
    page: 'c1p2',
    steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }, { set: 'train', to: 'out' }],
    note: '1-2: the train carries Baokaka back to out (a ride, the 淘氣 counter); live, the last tick replays.',
    expect: { event: 'ride' },
  },
];

/** A fixture's page and its final frame: the state, and the state before the last tick. */
export interface FixtureFrame {
  readonly def: PageDef;
  readonly prev: SimState;
  readonly state: SimState;
  /** The last tick's events (none for an empty step list) */
  readonly events: readonly SimEvent[];
}

/** Replays a fixture. Throws on an unknown page (the unit test catches it first). */
export function fixtureFrame(fixture: PopupFixture): FixtureFrame {
  const def = pageById(fixture.page);
  if (def === undefined) throw new Error(`popup fixture '${fixture.name}': no page '${fixture.page}'`);
  // `replay` expands the waits into one input per tick; stepping them again keeps the state before the last
  const { ticks } = replay(def, fixture.steps);
  let state = initialState(def);
  let prev = state;
  let events: readonly SimEvent[] = [];
  for (const tick of ticks) {
    prev = state;
    const r = step(def, state, tick.input);
    state = r.state;
    events = r.events;
  }
  return { def, prev, state, events };
}

export function popupFixture(name: string): PopupFixture | undefined {
  return POPUP_FIXTURES.find((f) => f.name === name);
}

/** The full-screen fixture view's parameters: `fixture=<name>` and `still=1`. */
export function fixtureParams(params: URLSearchParams): { fixture: string | null; still: boolean } {
  return { fixture: params.get('fixture') || null, still: params.get('still') === '1' };
}
