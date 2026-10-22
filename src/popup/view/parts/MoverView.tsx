import { useMemo } from 'react';
import { PRESET_ART } from '../../art';
import { holds } from '../../core/cond';
import { nodePos } from '../../core/graph';
import type { PageDef, PartDef, SimState } from '../../core/types';
import { partEntry } from '../../env/loader';
import { partArt, partBitmap } from '../art/registry';
import { liveArt } from '../art/creatures';
import type { Pt } from '../geometry';
import { artOpts, bakedImage, hitBox, r2, squashFor, stateAt, tweened, type PartViewProps } from './common';

/**
 * Parts that travel between places per state (GDD § 2.1): a `lift` between floors, a `pushable`
 * knocked down its fall path, a `carrier` walking its route. The view slides the art from where
 * the old state puts it to where the new one does (`translate`), with the part tween.
 */

export interface MoverProps extends PartViewProps {
  readonly def: PageDef;
  readonly prev: SimState;
  readonly state: SimState;
}

/** Where a travelling part stands in a state, in page units (its art anchor). */
export function moverPoint(def: PageDef, part: PartDef, state: string, sim: SimState): Pt {
  const hb = hitBox(part);
  if (part.preset === 'pushable') {
    const path = part.fall?.path ?? [];
    if (path.length === 0) return [hb.cx, hb.cy];
    if (state === 'onPerch') return path[0];
    if (state === 'landed') return path[path.length - 1];
    return path[Math.floor(path.length / 2)];
  }
  if (part.preset === 'carrier') {
    const route = part.route ?? [];
    const k = state === 'idle' ? 0 : state === 'done' ? route.length - 1 : Number(state.split('@')[1] ?? 0);
    const node = route[Math.max(0, Math.min(route.length - 1, k))];
    return (node === undefined ? undefined : nodePos(def, sim, node)) ?? [hb.cx, hb.y + hb.h];
  }
  // lift: the platform rides with its first attached node; else floors spread up the hit area
  const rider = def.nodes.find((n) => n.attach?.part === part.id);
  const at = rider?.attach?.pos[state];
  if (at !== undefined) return at;
  const { t } = stateAt(part, state);
  return [hb.cx, hb.y + hb.h - t * hb.h];
}

/**
 * Which drawing a carrier shows (#122, D-85): her baked art has one bitmap per *look*, not per route
 * index — `carrying` for every `carrying@k` (`back` while she carries him back along the route), and
 * `away` while she can't be called (`lockedWhen` holds: 5-3's 老闆 in the back, frying). A look her
 * art doesn't draw falls back to the state itself. Other parts show their state.
 */
export function carrierLook(def: PageDef, part: PartDef, state: string, sim: SimState): string {
  if (part.preset !== 'carrier') return state;
  const has = (look: string) => partEntry(part.art)?.states[look] !== undefined;
  const by = sim.baby.carriedBy;
  if (state.startsWith('carrying@')) {
    if (by?.id === part.id && by.back && has('back')) return 'back';
    return has('carrying') ? 'carrying' : state;
  }
  if (state === 'idle' && part.lockedWhen !== undefined && holds(def, sim, part.lockedWhen) && has('away')) return 'away';
  return state;
}

export function MoverView(props: MoverProps) {
  const { def, part, ctx, from, to, ms, reduced, prev, state } = props;
  const art = partArt(part.art, part.preset);
  const look = carrierLook(def, part, to, state);
  // Its baked bitmap for the state (#96; a carrier's look), else the live kit art
  const html = useMemo(() => {
    const img = partBitmap(part.art, look);
    return img ? bakedImage(img) : liveArt(() => art.draw(ctx, artOpts(part, to)));
  }, [art, ctx, part, to, look]);
  const a = moverPoint(def, part, from, prev);
  const b = moverPoint(def, part, to, state);
  const x = tweened(a[0], b[0], ms, reduced);
  const y = tweened(a[1], b[1], ms, reduced);
  const sq = squashFor(props);
  return (
    <g data-part={part.id} data-preset={part.preset}>
      <g data-anim="" transform={`translate(${r2(x)} ${r2(y)}) scale(${r2(sq)})`} dangerouslySetInnerHTML={{ __html: html }} />
    </g>
  );
}

/** Elevators, steam vents, balloon baskets. */
export const LiftView = MoverView;
/** A pigeon, a 悠遊卡, a bead, a lantern that Mocha knocks off its perch. */
export const PushableView = MoverView;
/** 夜市阿姨, a bear, the 101 cleaning 阿伯, walking their route while carrying him. */
export const CarrierView = MoverView;

/** The box a mover's art occupies (for layout and tests). */
export const moverBox = (part: PartDef) => PRESET_ART[part.preset].box;
