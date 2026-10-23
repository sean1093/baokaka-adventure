import { HINT_LINES, sayWordLine } from '../../content/hints';
import { WORD_LABEL } from '../../content/words';
import type { HintAnswer } from '../../core/hint';
import { perchHidesMocha } from '../../core/mocha';
import { compilePart } from '../../core/presets';
import type { Input, PageDef, Word } from '../../core/types';
import type { HintShow, MochaCue } from './look';

/**
 * The hint ladder (GDD § 2.7; #100), as pure functions; `useHintLadder` runs them on the page.
 *
 * | Level | Trigger | Shows |
 * |---|---|---|
 * | 0 nudge | `autoHintMs` without a state change | Mocha yawns (the stretch) and looks at it; it shimmers once |
 * | 1 where | 提示 | the halo pulses for 3 s; Mocha looks at it; the hint line |
 * | 2 how | 提示 again | the vellum ghost hand does the gesture (the ring's hand on the word) |
 * | 3 show me | 提示 a third time (and again) | the hand, then the action played for real |
 *
 * A wait (`none`) shows Mocha sitting and tapping his paw with 「等等看。」 at every level. A
 * `restart` answer glows 重來 (levels 1–2); level 3 restarts the page and plays step 1. The player's
 * own move drops the ladder back to 0. Nothing is recorded, and stickers never depend on it (R8).
 */

export type HintLevel = 0 | 1 | 2 | 3;

/** The level a press of 提示 climbs to: 1, 2, then 3 — and 3 again ("show me" repeats). */
export const pressHint = (level: HintLevel): 1 | 2 | 3 => (level >= 2 ? 3 : ((level + 1) as 1 | 2));

/** How long each look lasts (ms): the L0 shimmer and yawn, the L1 pulse (3 × 1 s) and its fade, the wait cue. */
export const NUDGE_MS = 2400;
export const WHERE_MS = 4000;
export const WAIT_MS = 3200;
/** Level 3: the hand starts its gesture this long before the action is played (reduced motion: shorter). */
export const SHOW_ME_LEAD_MS = 900;
export const SHOW_ME_LEAD_REDUCED_MS = 300;
/** …and stays this long after it. */
export const SHOW_ME_TAIL_MS = 1100;

/**
 * The auto nudge's delay (§ 2.11 自動提示: 關 / 30 秒 / 15 秒; always 15 s in 長輩模式, which holds the
 * setting, D-67), or null when off.
 */
export function autoHintMs(settings: { readonly autoHint: 0 | 15 | 30; readonly elder: boolean }): number | null {
  const seconds = settings.elder ? 15 : settings.autoHint;
  return seconds === 0 ? null : seconds * 1000;
}

/** What the page shows for a hint (`PagePlayer` hands it to `PageView` and the bottom bar). */
export interface HintDisplay {
  /** The halo / hand on the target (`HintShow.level` 0 = the nudge's single shimmer) */
  readonly show: HintShow | null;
  readonly mocha: MochaCue | null;
  /** Mocha's hint line (§ 5.3), or null */
  readonly line: string | null;
  /** 重來 glows (the fallback found no way from here: restart, then step 1) */
  readonly retry: boolean;
  /** The word ring's ghost hand taps this word (a `say` hint at level 2+ while the ring is open) */
  readonly ringWord: Word | null;
}

export const NO_HINT: HintDisplay = { show: null, mocha: null, line: null, retry: false, ringWord: null };

/** The target key (`targetsOf`) and the stop a hint's action touches, or null for a wait. */
export function hintTarget(def: PageDef, action: Input): Pick<HintShow, 'key' | 'stop'> | null {
  switch (action.t) {
    case 'set': {
      const part = def.parts.find((p) => p.id === action.part);
      const stop = part === undefined ? -1 : compilePart(part).states.indexOf(action.to);
      return stop < 0 ? { key: action.part } : { key: action.part, stop };
    }
    case 'tap':
      return { key: action.id };
    case 'mocha':
      return { key: `perch:${action.perch}` };
    case 'pet':
      return { key: 'mocha:mocha' };
    case 'floor':
      return { key: `floor:${action.node}` };
    case 'say':
      return { key: 'baby:baby' };
    default:
      return null;
  }
}

/**
 * Mocha's line for a hint's action (§ 5.3), or null when the list has none for it. A word's line
 * names the word from level 2 (#221): 「試試看說『咻——』」.
 */
export function hintLine(def: PageDef, action: Input, level: HintLevel = 1): string | null {
  switch (action.t) {
    case 'none':
      return HINT_LINES.wait;
    case 'say':
      return level >= 2 ? sayWordLine(WORD_LABEL[action.word]) : HINT_LINES.say;
    case 'mocha': {
      const perch = def.perches.find((p) => p.id === action.perch);
      return perch !== undefined && perchHidesMocha(def, perch) ? HINT_LINES.hide : HINT_LINES.perch;
    }
    case 'set':
    case 'tap': {
      const id = action.t === 'set' ? action.part : action.id;
      const part = def.parts.find((p) => p.id === id);
      if (part === undefined) return null;
      const { input } = compilePart(part);
      if (input === 'drag-linear') return HINT_LINES.drag;
      if (input === 'drag-rotary') return HINT_LINES.turn;
      if (part.preset === 'flap') return HINT_LINES.flap;
      return null;
    }
    default:
      return null;
  }
}

/**
 * What a hint shows at `level` (0 = the auto nudge). Level 3 shows level 2's hand: the action
 * itself is played by `useHintLadder`.
 */
export function hintDisplay(def: PageDef, answer: HintAnswer, level: HintLevel): HintDisplay {
  const { action } = answer;
  if (action === null) return NO_HINT;
  if (answer.source === 'restart' && level > 0) return { ...NO_HINT, retry: true };
  const target = answer.source === 'restart' ? null : hintTarget(def, action);
  if (target === null) {
    // A wait (or the nudge before a restart): Mocha sits and taps his paw — 「等等看。」 from level 1
    if (action.t !== 'none') return NO_HINT;
    return { ...NO_HINT, mocha: level === 0 ? 'yawn' : 'wait', line: level === 0 ? null : HINT_LINES.wait };
  }
  const shown = level === 0 ? 0 : level === 1 ? 1 : 2;
  return {
    show: { level: shown, ...target },
    mocha: level === 0 ? 'yawn' : 'look',
    line: level === 0 ? null : hintLine(def, action, level),
    retry: false,
    ringWord: action.t === 'say' && level >= 2 ? action.word : null,
  };
}
