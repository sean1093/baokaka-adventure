import { useEffect } from 'react';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Card, Chip, Screen } from '../../components/Screen';
import { ChevronRight, Sparkle, Star } from '../../components/icons';
import { playTone } from '../../shared/audio';
import { HEROES, ITEMS, SPELLS } from '../engine/heroes';
import type { VictorySummary } from '../engine/quest';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

type Props = { summary: VictorySummary; soundOn: boolean; onContinue: () => void };

export const VictoryScreen = ({ summary, soundOn, onContinue }: Props) => {
  const levelled = summary.levels > 0;

  useEffect(() => {
    playTone(levelled ? 'levelUp' : 'complete', soundOn);
  }, [levelled, soundOn]);

  return (
    <Screen center className="gap-4">
      <section className="pop text-center">
        <div className="mb-2 flex items-end justify-center gap-1">
          <span className="block h-20 w-20">
            <Baokaka />
          </span>
          <span className="block h-16 w-16">
            <MochaCat />
          </span>
        </div>
        <h1 className="text-display font-extrabold">打贏了！</h1>
      </section>

      <Card className="flex flex-col gap-2 p-4">
        <Row label="經驗" value={`+${summary.xp}`} tone="sky" />
        <Row label="貼紙" value={`+${summary.stickers}`} tone="sun" />
        {summary.drops.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-label font-bold text-muted">掉落</span>
            <span className="flex flex-wrap justify-end gap-1">
              {summary.drops.map((item, index) => (
                <Chip key={`${item}${index}`} tone="leaf">
                  {ITEMS[item].name}
                </Chip>
              ))}
            </span>
          </div>
        )}
      </Card>

      {levelled && (
        <Card tone="accent" className="p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-headline font-extrabold">
            <Star size={22} />
            等級 {summary.level}
          </p>
          <p className="mt-1 text-label font-bold text-mochaDeep">體力和真氣都補滿了</p>
          {summary.learned.length > 0 && (
            <p className="mt-2 flex flex-wrap items-center justify-center gap-1">
              <Sparkle size={18} className="text-mochaDeep" />
              {summary.learned.map((spell) => (
                <span key={spell} className="rounded-full bg-surface px-2 py-0.5 text-label font-extrabold shadow-card">
                  學會 {SPELLS[spell].name}
                </span>
              ))}
            </p>
          )}
          {summary.learned.length === 0 && <p className="mt-1 text-caption text-mochaDeep">{HEROES.baokaka.name}他們變強了一點。</p>}
        </Card>
      )}

      <Button size="lg" full icon={<ChevronRight size={22} />} onClick={onContinue}>
        繼續
      </Button>
    </Screen>
  );
};

const Row = ({ label, value, tone }: { label: string; value: string; tone: 'sky' | 'sun' }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-label font-bold text-muted">{label}</span>
    <Chip tone={tone}>{value}</Chip>
  </div>
);
