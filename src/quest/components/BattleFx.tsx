import { FxAnticipation, FxDefsProvider, FxImpact, FxWash } from '../../art/fx/BattleFxArt';
import { IMPACT_AT, planFx, type Emblem, type FxPlan, type Spot } from '../../art/fx/battleFx';
import type { Battle, BattleEvent, HeroId, Who } from '../engine/types';

export type { Spot };

/**
 * Battle effects (art direction § 7.10, issue #15), in three layers: a casting hero's gold glyph
 * ring and emblem (anticipation), the element's shape, ring and particles on each target at the
 * strike (impact), then BattleScreen's damage number (resolution). The drawings and motion live in
 * art/fx/; this reads the step's events and stages them.
 *
 * Positions arrive as fractions of the stage box, so this layer never needs the battle layout. The
 * caller mounts it with `key={battle.step}` so every action restarts its animations cleanly.
 */

/** The emblem in each hero's glyph ring: 寶咖咖's block, 摩卡's paw, 阿藍's feather, 黑糖's moon. */
export const HERO_EMBLEM: Readonly<Record<HeroId, Emblem>> = {
  baokaka: 'block',
  mocha: 'paw',
  magpie: 'feather',
  bear: 'moon',
};

const whoKey = (who: Who) => (who.side === 'hero' ? `h${who.hero}` : `f${who.slot}`);

/** The plan for one step's action, or null when nothing is drawn (guard, flee, a miss with no look). */
export function fxPlanFor(battle: Pick<Battle, 'events' | 'party' | 'heroes' | 'step'>, spot: (who: Who) => Spot | null, flash: boolean): FxPlan | null {
  const act = battle.events.find((event): event is Extract<BattleEvent, { kind: 'act' }> => event.kind === 'act');
  if (!act || !act.fx) return null;

  // The effect lands on whoever the step touched; a shield covers the standing party; a move that
  // only missed draws nothing; one that touched nobody lands on the actor
  const shield = battle.events.some((event) => event.kind === 'shield');
  const landed: Who[] = shield
    ? battle.party.filter((hero) => battle.heroes[hero].hp > 0).map((hero) => ({ side: 'hero', hero }))
    : battle.events.flatMap((event) => (event.kind === 'hit' || event.kind === 'heal' || event.kind === 'revive' ? [event.who] : []));
  if (landed.length === 0 && battle.events.some((event) => event.kind === 'miss')) return null;
  const targets = landed.length > 0 ? landed : [act.who];

  const seen = new Set<string>();
  const spots: Spot[] = [];
  for (const who of targets) {
    if (seen.has(whoKey(who))) continue;
    seen.add(whoKey(who));
    const where = spot(who);
    if (where) spots.push(where);
  }

  const casterSpot = act.arcane && act.who.side === 'hero' ? spot(act.who) : null;
  return planFx({
    kind: act.fx,
    accent: act.accent,
    caster: casterSpot && act.who.side === 'hero' ? { spot: casterSpot, emblem: HERO_EMBLEM[act.who.hero] } : null,
    spots,
    flash,
    seed: battle.step,
  });
}

type Props = {
  battle: Battle;
  /** Where a combatant stands (its sprite's middle), in fractions of the stage box */
  spot: (who: Who) => Spot | null;
  /** Whether this step may flash (the two-flashes-a-second limit, tracked by BattleScreen) */
  flash: boolean;
};

export const BattleFx = ({ battle, spot, flash }: Props) => {
  const plan = fxPlanFor(battle, spot, flash);
  if (!plan) return null;
  return (
    <span aria-hidden="true" data-fx-layer={plan.kind} data-fx-nodes={plan.nodes} className="pointer-events-none absolute inset-0 overflow-hidden">
      <FxDefsProvider>
        {plan.anticipation && <FxAnticipation spot={plan.anticipation.spot} emblem={plan.anticipation.emblem} />}
        {plan.wash && <FxWash colour={plan.wash} delay={IMPACT_AT} />}
        {plan.targets.map((target, index) => (
          <FxImpact key={index} kind={plan.kind} accent={plan.accent} target={target} />
        ))}
      </FxDefsProvider>
    </span>
  );
};
