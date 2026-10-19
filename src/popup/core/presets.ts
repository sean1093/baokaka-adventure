import type { PartDef, PartInput, PartPreset } from './types';

/**
 * Part presets → generic FSM defaults (GDD § 2.1 *Part presets*, § 3.2). Every part is a finite
 * state machine; the preset decides its default states, its default and allowed `input` kinds,
 * and what a tap does. Locks (`lockedByCat`, `lockedWhen`) and `stateWhen` are the tick's job
 * (§ 3.3 phase 1), not the preset's.
 *
 * | Preset     | Default states                         | Default input | Allowed inputs                       | Tap                         |
 * |------------|----------------------------------------|---------------|--------------------------------------|-----------------------------|
 * | `tab`      | — (list `stop0 … stopN`, 2–4)          | `drag-linear` | `drag-linear`, `none`                | advance one stop, cycling   |
 * | `slider`   | — (as `tab`)                           | `drag-linear` | `drag-linear`, `none`                | advance one stop, cycling   |
 * | `wheel`    | — (list `0 … N-1` clockwise, N = 2–8)  | `drag-rotary` | `drag-rotary`, `none`                | rotate one step clockwise   |
 * | `flap`     | `closed`, `open`                       | `tap-toggle`  | `tap-toggle`, `none`                 | toggle                      |
 * | `section`  | — (as `wheel`)                         | `none`        | `none`                               | —                           |
 * | `gate`     | `closed`, `open`                       | `none`        | `none`                               | —                           |
 * | `button`   | `up`, `down`                           | `none`        | `none`                               | —                           |
 * | `lift`     | — (list `floor0 … floorN`)             | `none`        | `none`                               | —                           |
 * | `loop`     | — (list `0 … N-1`)                     | `none`        | `none`, `drag-rotary` (crank), `tap-cycle` (crank) | advance one, cycling (crank only) |
 * | `pushable` | `onPerch`, `falling`, `landed`         | `none`        | `none`                               | —                           |
 * | `light`    | `off`, `on`                            | `none`        | `none`, `tap-toggle` (tappable)      | toggle (tappable only)      |
 * | `blowable` | — (list `0 … N-1`)                     | `none`        | `none`                               | —                           |
 * | `carrier`  | `idle`, `carrying@0 … carrying@k`, `done` (k = route length − 1) | `none` | `none`             | —                           |
 * | `prop`     | — (any named states)                   | `tap-cycle`   | `tap-cycle`                          | cycle                       |
 *
 * "—" in *Default states* means the part must list its states; `compilePart` throws otherwise.
 * A tab or slider's drag and a wheel's circular drag also arrive as plain `set` inputs (§ 3.2
 * `Input`); the tap rule is what a single tap on the part means.
 */

/** What one tap does to a part. */
export type TapRule =
  /** Next state, wrapping to the first after the last (tab, slider) */
  | 'advance'
  /** Next orientation, wrapping (wheel; states are listed clockwise) */
  | 'rotate-cw'
  /** First ↔ second state; any other state goes to the first (flap, light) */
  | 'toggle'
  /** Next state, wrapping (prop, loop crank) */
  | 'cycle'
  /** Taps do nothing */
  | 'none';

export interface PresetSpec {
  readonly preset: PartPreset;
  /** Default states, or null when the part must list them */
  readonly states: ((part: PartDef) => string[]) | null;
  readonly input: PartInput;
  /** The `input` values a part of this preset may declare (lint, #86, enforces it) */
  readonly inputs: readonly PartInput[];
  /** The tap rule while the part's input isn't `none` */
  readonly tap: TapRule;
}

const fixed = (...states: string[]) => () => [...states];
const NONE_ONLY: readonly PartInput[] = ['none'];

/** The preset table (see the file comment). */
export const PRESETS: Readonly<Record<PartPreset, PresetSpec>> = {
  tab: { preset: 'tab', states: null, input: 'drag-linear', inputs: ['drag-linear', 'none'], tap: 'advance' },
  slider: { preset: 'slider', states: null, input: 'drag-linear', inputs: ['drag-linear', 'none'], tap: 'advance' },
  wheel: { preset: 'wheel', states: null, input: 'drag-rotary', inputs: ['drag-rotary', 'none'], tap: 'rotate-cw' },
  flap: { preset: 'flap', states: fixed('closed', 'open'), input: 'tap-toggle', inputs: ['tap-toggle', 'none'], tap: 'toggle' },
  section: { preset: 'section', states: null, input: 'none', inputs: NONE_ONLY, tap: 'none' },
  gate: { preset: 'gate', states: fixed('closed', 'open'), input: 'none', inputs: NONE_ONLY, tap: 'none' },
  button: { preset: 'button', states: fixed('up', 'down'), input: 'none', inputs: NONE_ONLY, tap: 'none' },
  lift: { preset: 'lift', states: null, input: 'none', inputs: NONE_ONLY, tap: 'none' },
  loop: { preset: 'loop', states: null, input: 'none', inputs: ['none', 'drag-rotary', 'tap-cycle'], tap: 'cycle' },
  pushable: { preset: 'pushable', states: fixed('onPerch', 'falling', 'landed'), input: 'none', inputs: NONE_ONLY, tap: 'none' },
  light: { preset: 'light', states: fixed('off', 'on'), input: 'none', inputs: ['none', 'tap-toggle'], tap: 'toggle' },
  blowable: { preset: 'blowable', states: null, input: 'none', inputs: NONE_ONLY, tap: 'none' },
  carrier: {
    preset: 'carrier',
    states: (part) => ['idle', ...(part.route ?? []).map((_, k) => `carrying@${k}`), 'done'],
    input: 'none',
    inputs: NONE_ONLY,
    tap: 'none',
  },
  prop: { preset: 'prop', states: null, input: 'tap-cycle', inputs: ['tap-cycle'], tap: 'cycle' },
};

/** A part with every preset default filled in. */
export interface CompiledPart {
  readonly def: PartDef;
  readonly id: string;
  readonly preset: PartPreset;
  readonly states: readonly string[];
  readonly initial: string;
  readonly input: PartInput;
  /** The effective tap rule: `none` when the part's input is `none` */
  readonly tap: TapRule;
}

/** Fills in a part's preset defaults. Throws when the preset has no default states and none are listed. */
export function compilePart(part: PartDef): CompiledPart {
  const spec = PRESETS[part.preset];
  const states = part.states ?? spec.states?.(part);
  if (!states || states.length === 0) throw new Error(`part '${part.id}' (${part.preset}) must list its states`);
  const input = part.input ?? spec.input;
  return {
    def: part,
    id: part.id,
    preset: part.preset,
    states,
    initial: part.initial ?? states[0],
    input,
    tap: input === 'none' ? 'none' : spec.tap,
  };
}

/** The state after `current` in `states`, wrapping; an unknown `current` goes to the first. */
export function nextState(states: readonly string[], current: string): string {
  return states[(states.indexOf(current) + 1) % states.length];
}

/** The state one tap on the part leads to from `current`, or null when taps do nothing. */
export function tapTarget(part: CompiledPart, current: string): string | null {
  switch (part.tap) {
    case 'none':
      return null;
    case 'toggle':
      return current === part.states[0] ? (part.states[1] ?? current) : part.states[0];
    default:
      return nextState(part.states, current);
  }
}

