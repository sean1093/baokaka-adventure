import { useEffect, type ReactNode } from 'react';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Num, Tag } from '../../components/Chip';
import { ChevronRight, Sparkle, Star } from '../../components/icons';
import { Panel } from '../../components/Panel';
import { Screen } from '../../components/Screen';
import { playTone } from '../../shared/audio';
import { FOES } from '../engine/foes';
import { HEROES, ITEMS, SPELLS } from '../engine/heroes';
import type { VictorySummary } from '../engine/quest';
import { UI } from '../engine/strings';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

type Props = { summary: VictorySummary; soundOn: boolean; onContinue: () => void };

/** The result card (§ 7.9 *Battle → victory*): a gold wash, the heroes, what was won, a level gained. */
export const VictoryScreen = ({ summary, soundOn, onContinue }: Props) => {
  const levelled = summary.levels > 0;

  useEffect(() => {
    playTone(levelled ? 'levelUp' : 'complete', soundOn);
  }, [levelled, soundOn]);

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      {/* The gold radial wash behind the result */}
      <span aria-hidden="true" className="kit-fade-in pointer-events-none absolute inset-x-0 top-0 block h-[60%] bg-[radial-gradient(60%_55%_at_50%_30%,theme(colors.gold.light/18%),transparent_70%)]" />
      <Screen center className="relative gap-4">
        <section className="text-center">
          <div className="relative mx-auto mb-2 flex h-28 items-end justify-center gap-1">
            <span aria-hidden="true" className="absolute bottom-0 left-1/2 block h-6 w-48 -translate-x-1/2 rounded-[50%] bg-gold/20" />
            <span className="relative block h-28 w-28">
              <Baokaka lod="battle" />
            </span>
            <span className="relative block h-24 w-24">
              <MochaCat lod="battle" />
            </span>
          </div>
          <p className="font-num text-[12px] font-semibold tracking-[0.4em] text-gold">VICTORY</p>
          <h1 className="mt-1 font-serif text-title tracking-[0.08em] text-gold-light [text-shadow:0_0_18px_theme(colors.gold.DEFAULT/45%)]">
            {summary.boss ? UI.bossVictory(FOES[summary.boss].name) : UI.victory}
          </h1>
        </section>

        {/* The result card slides up over 600ms (§ 7.9 Battle → victory; a 200ms fade under reduced motion) */}
        <Panel diamonds className="kit-sheet-in kit-scene flex flex-col gap-1 px-5 py-4">
          <Row label="經驗">
            <Num className="text-[20px]">+{summary.xp}</Num>
          </Row>
          <Row label={UI.coins}>
            <Num className="text-[20px]">+{summary.coins}</Num>
          </Row>
          {summary.drops.length > 0 && (
            <Row label="掉落">
              <span className="flex flex-wrap justify-end gap-1.5">
                {summary.drops.map((item, index) => (
                  <Tag key={`${item}${index}`} className="!text-[14px]">
                    {ITEMS[item].name}
                  </Tag>
                ))}
              </span>
            </Row>
          )}

          {levelled && (
            <div className="relative mt-2 border-t border-gold/30 pt-3 text-center">
              <p className="flex items-center justify-center gap-1.5 font-serif text-heading tracking-[0.06em] text-gold-light">
                <Star size={20} />
                {UI.levelUp(summary.level)}
              </p>
              <p className="mt-1 text-label text-mutedOnDark">體力和{UI.mp}都補滿了</p>
              {summary.learned.length > 0 ? (
                <div className="mt-2 flex flex-col items-center gap-1.5">
                  {summary.learned.map((spell) => (
                    <p key={spell} className="kit-inset flex items-center gap-1.5 px-3 py-1 text-label">
                      <Sparkle size={16} className="shrink-0 text-gold" />
                      {UI.newSkill(HEROES[SPELLS[spell].hero].name, SPELLS[spell].name)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-caption text-mutedOnDark">{HEROES.baokaka.name}他們變強了一點。</p>
              )}
            </div>
          )}
        </Panel>

        <Button size="lg" full icon={<ChevronRight size={22} />} onClick={onContinue}>
          繼續
        </Button>
      </Screen>
    </div>
  );
};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="relative flex min-h-[40px] items-center justify-between gap-3">
    <span className="font-serif text-label tracking-[0.12em] text-mutedOnDark">{label}</span>
    {children}
  </div>
);
