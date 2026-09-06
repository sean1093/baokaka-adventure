import { useEffect } from 'react';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Chip, Screen } from '../../components/Screen';
import { ChevronRight } from '../../components/icons';
import { playTone } from '../../shared/audio';
import { ITEMS, SKILLS } from '../engine/heroes';
import type { VictorySummary } from '../engine/quest';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;
const Star = SPRITES.star;

type Props = { summary: VictorySummary; soundOn: boolean; onContinue: () => void };

export const VictoryScreen = ({ summary, soundOn, onContinue }: Props) => {
  const leveled = summary.toLevel > summary.fromLevel;

  useEffect(() => {
    if (leveled) playTone('levelUp', soundOn);
  }, [leveled, soundOn]);

  return (
    <Screen center>
      <section className="overflow-hidden rounded-4xl bg-surface shadow-card">
        <div className="relative flex flex-col items-center bg-gradient-to-b from-sun/40 to-transparent px-6 pb-2 pt-7">
          <div className="flex gap-1">
            {[0, 1, 2].map((index) => (
              <span key={index} className="pop block h-9 w-9" style={{ animationDelay: `${index * 120}ms` }}>
                <Star />
              </span>
            ))}
          </div>
          <h1 className="mt-2 text-display font-extrabold">勝利！</h1>
          <div className="mt-2 flex items-end justify-center gap-1">
            <span className="block h-28 w-28">
              <Baokaka />
            </span>
            <span className="block h-20 w-20">
              <MochaCat />
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6 pt-3">
          <div className="flex items-center justify-between rounded-2xl bg-ink/[0.05] px-4 py-3">
            <span className="text-label font-bold text-muted">經驗值</span>
            <span className="text-heading font-extrabold">+{summary.xp}</span>
          </div>

          {leveled && (
            <div className="rounded-2xl bg-gradient-to-br from-sun/40 to-sun/10 px-4 py-3">
              <p className="text-heading font-extrabold">
                升級！等級 {summary.fromLevel} → {summary.toLevel}
              </p>
              <p className="text-label text-muted">體力全滿，攻擊變強了</p>
              {summary.unlocked.length > 0 && (
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-label font-bold">
                  學會新招式
                  {summary.unlocked.map((skill) => (
                    <Chip key={skill} tone="ink">
                      {SKILLS[skill].name}
                    </Chip>
                  ))}
                </p>
              )}
            </div>
          )}

          {summary.drops.length > 0 && (
            <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.05] px-4 py-3">
              <span className="text-label font-bold text-muted">拿到了</span>
              <span className="flex flex-wrap gap-2">
                {summary.drops.map((item, index) => {
                  const Art = SPRITES[ITEMS[item].sprite];
                  return (
                    <span key={index} className="inline-flex items-center gap-1 rounded-full bg-surface py-1 pl-1 pr-2.5 text-label font-bold shadow-card">
                      <span className="block h-7 w-7">
                        <Art />
                      </span>
                      {ITEMS[item].name}
                    </span>
                  );
                })}
              </span>
            </div>
          )}
        </div>
      </section>

      <Button size="lg" full icon={<ChevronRight size={22} />} onClick={onContinue}>
        繼續
      </Button>
    </Screen>
  );
};
