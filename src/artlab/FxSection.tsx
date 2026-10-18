import { useState, type CSSProperties, type ReactNode } from 'react';
import { FxAnticipation, FxDefsProvider, FxImpact, FxWash } from '../art/fx/BattleFxArt';
import { IMPACT_AT, planFx, type Emblem, type Spot } from '../art/fx/battleFx';
import { STAGE, STAGE_LIGHT, withAlpha } from '../art/palette';
import { SPRITES } from '../art/sprites';
import type { SpriteName } from '../art/types';
import { moveFx } from '../quest/engine/battle';
import { FOES } from '../quest/engine/foes';
import { HEROES, SPELLS } from '../quest/engine/heroes';
import { HERO_SPRITE } from '../quest/components/PartyPanel';
import { HERO_EMBLEM } from '../quest/components/BattleFx';
import { FX_KINDS, HERO_ORDER, type FxAccent, type FxKind, type HeroId } from '../quest/engine/types';

/**
 * The art lab's FX section (`#/artlab?section=fx`, issue #15; art direction § 7.10): every battle
 * FX kind and skill accent on a little night stage over a stand-in target, the four glyph rings
 * with their emblems, and an all-target cast on three foes. With `still=1` each one is frozen at its
 * impact frame (artlab.css); 「全部播放」 replays everything, and tapping a card replays that one.
 */

type Card = { kind: FxKind; accent?: FxAccent; target: 'foe' | 'hero' | 'party' };

const HERO_KINDS: ReadonlySet<FxKind> = new Set(['heal', 'sparkle']);
const CARDS: readonly Card[] = [
  ...FX_KINDS.filter((kind) => kind !== 'shield').map((kind): Card => ({ kind, target: HERO_KINDS.has(kind) ? 'hero' : 'foe' })),
  { kind: 'heal', accent: 'clap', target: 'hero' },
  { kind: 'impact', accent: 'stomp', target: 'foe' },
  { kind: 'feather', accent: 'comet', target: 'foe' },
  { kind: 'paw', accent: 'moon', target: 'foe' },
  { kind: 'shield', target: 'party' },
];

/** Who uses a look: skills, heroes' plain attacks and foe moves, for the caption. */
function usersOf(kind: FxKind, accent?: FxAccent): string[] {
  const skills = Object.values(SPELLS)
    .filter((spell) => spell.fx === kind && spell.fxAccent === accent)
    .map((spell) => spell.name);
  if (accent) return skills;
  const attacks = HERO_ORDER.filter((hero) => HEROES[hero].attackFx === kind).map((hero) => `${HEROES[hero].name}攻擊`);
  const moves = new Set<string>();
  for (const foe of Object.values(FOES)) for (const move of foe.moves) if (moveFx(move) === kind) moves.add(move.name);
  return [...skills, ...attacks, ...moves];
}

const STAGE_BG: CSSProperties = {
  background: `radial-gradient(80% 60% at 50% 30%, ${withAlpha(STAGE_LIGHT.moonShaft, 0.16)}, transparent), linear-gradient(180deg, ${STAGE_LIGHT.vignette}, ${STAGE.paveTop} 62%, ${STAGE.paveBottom})`,
};

/** A sprite standing with its middle at `spot` (fractions of the stage), `size` as a fraction of its width. */
const Stand = ({ name, spot, size, facing }: { name: SpriteName; spot: Spot; size: number; facing: 'left' | 'right' }) => {
  const Art = SPRITES[name];
  return (
    <span className="absolute block" style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%`, width: `${size * 100}%`, aspectRatio: '1', transform: 'translate(-50%, -50%)' }}>
      <span className="absolute left-[16%] top-[88%] block h-[10%] w-[68%] rounded-[50%]" style={{ background: withAlpha(STAGE.paveBottom, 0.7) }} />
      <Art lod="battle" state="idle" facing={facing} />
    </span>
  );
};

const MiniStage = ({ children, aspect = '1 / 1', onClick, label }: { children: ReactNode; aspect?: string; onClick: () => void; label: string }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`重播 ${label}`}
    className="relative block w-full overflow-hidden rounded border border-gold/30"
    style={{ ...STAGE_BG, aspectRatio: aspect }}
  >
    {children}
  </button>
);

const FX_SPOT: Spot = { x: 0.5, y: 0.52 };
const HERO_SPOTS: readonly Spot[] = [
  { x: 0.22, y: 0.76 },
  { x: 0.42, y: 0.8 },
  { x: 0.6, y: 0.66 },
  { x: 0.78, y: 0.72 },
];

const KindCard = ({ card, run }: { card: Card; run: number }) => {
  const [replay, setReplay] = useState(0);
  const party = card.target === 'party';
  const spots = party ? HERO_SPOTS : [FX_SPOT];
  const plan = planFx({ kind: card.kind, accent: card.accent, caster: null, spots, flash: false, seed: 3 });
  const users = usersOf(card.kind, card.accent);
  const title = card.accent ? `${card.kind} + ${card.accent}` : card.kind;
  return (
    <figure className={`flex flex-col gap-1 ${party ? 'col-span-2' : ''}`} data-fx-card={title}>
      <MiniStage aspect={party ? '4 / 3' : '1 / 1'} onClick={() => setReplay((n) => n + 1)} label={title}>
        {party ? (
          HERO_ORDER.map((hero, index) => <Stand key={hero} name={HERO_SPRITE[hero]} spot={HERO_SPOTS[index]} size={0.2} facing="right" />)
        ) : (
          <Stand name={card.target === 'hero' ? HERO_SPRITE.baokaka : 'dustBunny'} spot={FX_SPOT} size={0.56} facing={card.target === 'hero' ? 'right' : 'left'} />
        )}
        <span key={`${run}-${replay}`} className="pointer-events-none absolute inset-0 block">
          <FxDefsProvider>
            {plan.targets.map((target, index) => (
              <FxImpact key={index} kind={plan.kind} accent={plan.accent} target={target} unit={party ? 0.2 : 0.5} />
            ))}
          </FxDefsProvider>
        </span>
      </MiniStage>
      <figcaption className="text-caption leading-snug text-mutedOnDark">
        <span className="font-num text-label text-gold-light">{title}</span> · {plan.nodes} nodes
        <br />
        {users.length > 0 ? users.slice(0, 4).join('、') + (users.length > 4 ? ` +${users.length - 4}` : '') : '（chapter art）'}
      </figcaption>
    </figure>
  );
};

/** A hero's anticipation: the glyph ring at the feet and the emblem rising. */
const GlyphCard = ({ hero, emblem, run }: { hero: HeroId; emblem: Emblem; run: number }) => {
  const [replay, setReplay] = useState(0);
  const spot: Spot = { x: 0.5, y: 0.5 };
  return (
    <figure className="flex flex-col gap-1" data-fx-glyph-card={emblem}>
      <MiniStage onClick={() => setReplay((n) => n + 1)} label={emblem}>
        <Stand name={HERO_SPRITE[hero]} spot={spot} size={0.56} facing="right" />
        <span key={`${run}-${replay}`} className="pointer-events-none absolute inset-0 block">
          <FxDefsProvider>
            <FxAnticipation spot={spot} emblem={emblem} unit={0.56} />
          </FxDefsProvider>
        </span>
      </MiniStage>
      <figcaption className="text-caption text-mutedOnDark">
        <span className="font-num text-label text-gold-light">{emblem}</span> · {HEROES[hero].name}
      </figcaption>
    </figure>
  );
};

/** An all-target cast on three foes, the busiest case: glyph, wash and three impacts within 40 nodes. */
const FOE_SPOTS: readonly Spot[] = [
  { x: 0.56, y: 0.36 },
  { x: 0.8, y: 0.42 },
  { x: 0.68, y: 0.62 },
];
const CASTER: Spot = { x: 0.2, y: 0.66 };

const AllTargets = ({ kind, run }: { kind: FxKind; run: number }) => {
  const [replay, setReplay] = useState(0);
  const plan = planFx({ kind, caster: { spot: CASTER, emblem: HERO_EMBLEM.baokaka }, spots: FOE_SPOTS, flash: true, seed: 5 });
  return (
    <figure className="col-span-2 flex flex-col gap-1" data-fx-all={kind}>
      <MiniStage aspect="2 / 1" onClick={() => setReplay((n) => n + 1)} label={`${kind} all`}>
        <Stand name={HERO_SPRITE.baokaka} spot={CASTER} size={0.24} facing="right" />
        {FOE_SPOTS.map((spot, index) => (
          <Stand key={index} name={index === 1 ? 'sockMonster' : 'dustBunny'} spot={spot} size={0.2} facing="left" />
        ))}
        <span key={`${run}-${replay}`} className="pointer-events-none absolute inset-0 block">
          <FxDefsProvider>
            {plan.anticipation && <FxAnticipation spot={plan.anticipation.spot} emblem={plan.anticipation.emblem} unit={0.22} />}
            {plan.wash && <FxWash colour={plan.wash} delay={IMPACT_AT} />}
            {plan.targets.map((target, index) => (
              <FxImpact key={index} kind={plan.kind} accent={plan.accent} target={target} unit={0.2} />
            ))}
          </FxDefsProvider>
        </span>
      </MiniStage>
      <figcaption className="text-caption text-mutedOnDark">
        <span className="font-num text-label text-gold-light">{kind}</span> on three foes · {plan.nodes} / 40 nodes
      </figcaption>
    </figure>
  );
};

export const FxSection = () => {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col gap-4" data-artlab-fx="">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-serif text-heading text-gold-light">Battle VFX</h3>
        <span className="text-caption text-mutedOnDark">§ 7.10 · impact frame with still=1 · tap a card to replay</span>
        <button type="button" onClick={() => setRun((n) => n + 1)} className="kit-btn kit-btn--primary kit-btn--sm min-h-[44px] px-4" data-fx-play-all="">
          全部播放
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {CARDS.map((card) => (
          <KindCard key={`${card.kind}${card.accent ?? ''}`} card={card} run={run} />
        ))}
      </div>
      <h3 className="font-serif text-heading text-gold-light">Anticipation · glyph rings</h3>
      <div className="grid grid-cols-2 gap-3">
        {HERO_ORDER.map((hero) => (
          <GlyphCard key={hero} hero={hero} emblem={HERO_EMBLEM[hero]} run={run} />
        ))}
      </div>
      <h3 className="font-serif text-heading text-gold-light">All targets</h3>
      <div className="grid grid-cols-2 gap-3">
        <AllTargets kind="cry" run={run} />
        <AllTargets kind="claw" run={run} />
      </div>
    </div>
  );
};
