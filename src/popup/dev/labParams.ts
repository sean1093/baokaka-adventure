import { TICK_MS, type TickSpeed } from '../game/session';

/**
 * PageLab's URL (GDD § 3.10, #91): everything that decides what the lab shows lives in the hash,
 * so a screenshot or a bug report is one link, e.g.
 * `#/pagelab?page=c1p2&overlay=nodes,edges&tick=12`.
 *
 * - `page` — a registered page id (none: the first page).
 * - `overlay` — a comma list of `OVERLAYS`. Absent: `DEFAULT_OVERLAYS`; present but empty: none.
 *   Unknown names are ignored.
 * - `tick` — start this many idle ticks in (0–500), like `#/popup?tick=`.
 * - `speed` — `slow` | `normal` | `fast` for play.
 * - `edit=1` — edit mode (drag nodes and track ends).
 * - `view` — a comma list of readability views: `grey` (greyscale) and `squint` (the 25 % thumbnail).
 * - `section=kit` — the paper kit sheet (#139) instead of the lab; `section=sprites` — the
 *   missing-frame report (#95).
 *
 * Pure: no DOM, so it is unit-tested.
 */

export const OVERLAYS = ['nodes', 'edges', 'perches', 'attractors', 'hits', 'target', 'anchors'] as const;
export type Overlay = (typeof OVERLAYS)[number];
export const DEFAULT_OVERLAYS: readonly Overlay[] = ['nodes', 'edges', 'target'];

export const VIEWS = ['grey', 'squint'] as const;
export type LabView = (typeof VIEWS)[number];

/** Highest `tick=` honoured (the same cap as `#/popup`). */
export const MAX_START_TICK = 500;

export interface LabParams {
  readonly section: string | null;
  readonly page: string | null;
  readonly overlays: readonly Overlay[];
  readonly tick: number;
  readonly speed: TickSpeed;
  readonly edit: boolean;
  readonly views: readonly LabView[];
}

/** Members of `allowed` named in a comma list, in `allowed`'s order, each once. */
function pickList<T extends string>(raw: string, allowed: readonly T[]): T[] {
  const named = new Set(raw.split(',').map((s) => s.trim()));
  return allowed.filter((x) => named.has(x));
}

/** The lab's settings from the hash's parameters. */
export function parseLabParams(params: URLSearchParams): LabParams {
  const overlay = params.get('overlay');
  const tick = Math.floor(Number(params.get('tick')));
  const speed = params.get('speed');
  return {
    section: params.get('section') || null,
    page: params.get('page') || null,
    overlays: overlay === null ? [...DEFAULT_OVERLAYS] : pickList(overlay, OVERLAYS),
    tick: Number.isFinite(tick) ? Math.max(0, Math.min(MAX_START_TICK, tick)) : 0,
    speed: speed !== null && Object.hasOwn(TICK_MS, speed) ? (speed as TickSpeed) : 'normal',
    edit: params.get('edit') === '1',
    views: pickList(params.get('view') ?? '', VIEWS),
  };
}

/**
 * The hash for a set of lab settings (the inverse of `parseLabParams`): `page` and `overlay` are
 * always written (so a link keeps its overlays even if the defaults change); the rest only when
 * they differ from their defaults. Commas stay readable.
 */
export function labHash(p: LabParams): string {
  const parts: string[] = [];
  const add = (k: string, v: string) => parts.push(`${k}=${encodeURIComponent(v).replace(/%2C/g, ',')}`);
  if (p.section) add('section', p.section);
  if (p.page) add('page', p.page);
  if (!p.section) add('overlay', OVERLAYS.filter((o) => p.overlays.includes(o)).join(','));
  if (p.tick > 0) add('tick', String(p.tick));
  if (p.speed !== 'normal') add('speed', p.speed);
  if (p.edit) add('edit', '1');
  const views = VIEWS.filter((v) => p.views.includes(v));
  if (views.length > 0) add('view', views.join(','));
  return `#/pagelab${parts.length > 0 ? `?${parts.join('&')}` : ''}`;
}

/** `list` with `item` added or removed. */
export function toggle<T>(list: readonly T[], item: T, on: boolean): T[] {
  const rest = list.filter((x) => x !== item);
  return on ? [...rest, item] : rest;
}
