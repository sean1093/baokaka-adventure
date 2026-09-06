import { useEffect } from 'react';
import { SPRITES } from '../../art/sprites';
import { BigButton } from '../../components/BigButton';
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
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-5 px-6 py-8 text-center">
      <div className="flex gap-2">
        {[0, 1, 2].map((index) => (
          <span key={index} className="pop block h-10 w-10" style={{ animationDelay: `${index * 120}ms` }}>
            <Star />
          </span>
        ))}
      </div>
      <h1 className="text-huge font-bold">勝利！</h1>

      <div className="flex items-end justify-center gap-1">
        <span className="block h-32 w-32">
          <Baokaka />
        </span>
        <span className="block h-24 w-24">
          <MochaCat />
        </span>
      </div>

      <p className="text-body font-bold">經驗值 +{summary.xp}</p>

      {leveled && (
        <div className="flex flex-col gap-1 rounded-3xl border-4 border-ink bg-sun/40 px-6 py-4">
          <p className="text-title font-bold">
            升級！等級 {summary.fromLevel} → {summary.toLevel}
          </p>
          <p className="text-base">體力全滿，攻擊變強了</p>
          {summary.unlocked.length > 0 && (
            <p className="text-base font-bold">
              學會新招式：{summary.unlocked.map((skill) => SKILLS[skill].name).join('、')}
            </p>
          )}
        </div>
      )}

      {summary.drops.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-base font-bold text-ink/70">拿到了</p>
          <div className="flex flex-wrap justify-center gap-2">
            {summary.drops.map((item, index) => {
              const Art = SPRITES[ITEMS[item].sprite];
              return (
                <span key={index} className="flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 text-base font-bold">
                  <span className="block h-8 w-8">
                    <Art />
                  </span>
                  {ITEMS[item].name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <BigButton onClick={onContinue}>繼續</BigButton>
    </div>
  );
};
