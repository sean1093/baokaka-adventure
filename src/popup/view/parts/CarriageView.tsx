import { useMemo } from 'react';
import type { KitCtx } from '../../art';
import type { PageDef, SimState } from '../../core/types';
import { carriage } from '../art/placeholders';
import { drawnNodePos } from '../interp';
import { CARRIAGE_REACH, type Carriage } from '../stage';
import { ArtG, r2 } from './common';

/**
 * The carriage a part moves (bible § 4 linked parts: the train a tab moves): a card under the nodes
 * that ride the part, sliding exactly as they do, so a baby riding it lerps with it (GDD § 3.9
 * rides). It wears the linked brad that matches the one on its tab.
 */

export interface CarriageViewProps {
  readonly def: PageDef;
  readonly prev: SimState;
  readonly state: SimState;
  readonly carriage: Carriage;
  readonly ctx: KitCtx;
  readonly ms: number;
  readonly reduced: boolean;
}

export function CarriageView({ def, prev, state, carriage: c, ctx, ms, reduced }: CarriageViewProps) {
  const lead = c.nodes[0];
  const leadPos = drawnNodePos(def, prev, state, lead, ms, reduced) ?? [c.x0, c.y];
  // The card's span: the riders' spread (constant: they move together) plus a margin each side
  const spread = useMemo(() => {
    const xs = c.nodes.map((id) => def.nodes.find((n) => n.id === id)!).map((n) => Object.values(n.attach!.pos)[0][0]);
    return { min: Math.min(...xs), max: Math.max(...xs), lead: xs[0] };
  }, [c, def]);
  const w = spread.max - spread.min + 2 * CARRIAGE_REACH;
  const html = useMemo(() => carriage(ctx, w, 1, true), [ctx, w]);
  const x = leadPos[0] - (spread.lead - spread.min) - CARRIAGE_REACH;
  return (
    <g data-carriage={c.part} data-anim="" transform={`translate(${r2(x)} ${r2(leadPos[1])})`}>
      <ArtG html={html} />
    </g>
  );
}
