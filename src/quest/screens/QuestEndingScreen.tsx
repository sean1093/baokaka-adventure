import { useEffect } from 'react';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { Screen } from '../../components/Screen';
import { playTone } from '../../shared/audio';
import { UI } from '../engine/strings';
import type { Run } from '../engine/types';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;
const ComfortDoll = SPRITES.comfortDoll;
const SnoreKing = SPRITES.snoreKing;
const Star = SPRITES.star;

type Props = { run: Run; soundOn: boolean; onContinue: () => void };

export const QuestEndingScreen = ({ run, soundOn, onContinue }: Props) => {
  useEffect(() => {
    playTone('levelUp', soundOn);
  }, [soundOn]);

  return (
    <Screen center className="gap-4">
      <div className="flex justify-center gap-3">
        {[0, 1, 2].map((index) => (
          <span key={index} className="pop block h-7 w-7 opacity-70" style={{ animationDelay: `${index * 160}ms`, animationDuration: '900ms', animationFillMode: 'both' }}>
            <Star lod="battle" />
          </span>
        ))}
      </div>

      <h1 className="text-center font-serif text-title tracking-[0.12em] text-gold-light [text-shadow:0_0_18px_theme(colors.gold.DEFAULT/45%)]">娃娃回家了</h1>

      <section className="flex items-end justify-center gap-1">
        <span className="block h-24 w-24">
          <Baokaka lod="battle" pose="stand" expr="laugh" />
        </span>
        <span className="block h-14 w-14">
          <ComfortDoll lod="battle" />
        </span>
        <span className="block h-20 w-20">
          <MochaCat lod="battle" expr="happy" />
        </span>
        <span className="block h-20 w-20 opacity-90">
          <SnoreKing lod="battle" />
        </span>
      </section>

      <Panel diamonds className="px-5 py-5">
        <p className="relative text-body leading-loose">
          寶咖咖抱著娃娃，摩卡貓蜷在腳邊，阿藍和黑糖靠在一起打瞌睡，
          打呼嚕大王在旁邊打呼嚕——這次沒有人覺得吵。
          <br />
          <br />
          晚安，勇者團。
        </p>
      </Panel>

      <p className="text-center text-label text-mutedOnDark">
        等級 {run.level} · 走過 7 個地方 · 收集 {UI.coinCount(run.coins)}
      </p>

      <Button size="lg" full onClick={onContinue}>
        回到標題
      </Button>
    </Screen>
  );
};
