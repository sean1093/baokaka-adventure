import { compilePart } from './presets';
import type { PageDef, SimState } from './types';

/**
 * The state a page starts in (GDD § 3.2 `SimState`): every part at its initial state, every
 * creature at its initial position, Mocha settled on `mocha.start`, Baokaka idle on `baby.start`.
 * Pushable parts live in `pushables` (not `parts`), starting at their initial state, `onPerch`
 * unless the page says otherwise (D-41).
 */
export function initialState(def: PageDef): SimState {
  const parts: SimState['parts'] = {};
  const pushables: SimState['pushables'] = {};
  for (const part of def.parts) {
    const { initial } = compilePart(part);
    if (part.preset === 'pushable') pushables[part.id] = initial as SimState['pushables'][string];
    else parts[part.id] = initial;
  }
  const creatures: SimState['creatures'] = {};
  for (const creature of def.creatures) creatures[creature.id] = creature.initial;
  return {
    tick: 0,
    parts,
    baby: { node: def.baby.start, mode: 'idle', facing: def.baby.facing, refused: [], lookCount: 0, linked: false },
    mocha: { perch: def.mocha.start, path: [] },
    creatures,
    pushables,
    consumed: [],
    flags: [],
    counters: {},
    done: false,
  };
}

/**
 * JSON with object keys sorted at every level and `undefined` members dropped, so equal
 * structures give equal strings whatever the insertion order. Arrays keep their order.
 */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : stableStringify(v))).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const members = Object.keys(record)
      .sort()
      .filter((k) => record[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`);
    return `{${members.join(',')}}`;
  }
  return JSON.stringify(value);
}

const sorted = (ids: readonly string[]) => [...ids].sort();

/**
 * The solver's key for a state (GDD § 3.7): `stableStringify` with the sets whose order means
 * nothing (`baby.refused`, `consumed`, `flags`) sorted. Mocha's `path` stays ordered.
 */
export function canonicalKey(state: SimState): string {
  return stableStringify({
    ...state,
    baby: { ...state.baby, refused: sorted(state.baby.refused) },
    consumed: sorted(state.consumed),
    flags: sorted(state.flags),
  });
}
