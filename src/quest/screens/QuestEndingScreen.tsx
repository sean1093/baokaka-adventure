import { useEffect } from 'react';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Card, Screen } from '../../components/Screen';
import { playTone } from '../../shared/audio';
import type { Run } from '../engine/types';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;
const Duck = SPRITES.duck;
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
          <span key={index} className="block h-7 w-7 opacity-70" style={{ animation: `pop 900ms ease-out ${index * 160}ms both` }}>
            <Star />
          </span>
        ))}
      </div>

      <h1 className="text-center text-display font-extrabold leading-tight">娃娃回家了</h1>

      <section className="flex items-end justify-center gap-1">
        <span className="block h-24 w-24">
          <Baokaka />
        </span>
        <span className="block h-14 w-14">
          <ComfortDoll />
        </span>
        <span className="block h-20 w-20">
          <MochaCat />
        </span>
        <span className="block h-16 w-16">
          <Duck />
        </span>
        <span className="block h-20 w-20 opacity-90">
          <SnoreKing />
        </span>
      </section>

      <Card className="p-5">
        <p className="text-copy leading-loose text-ink/85">
          寶咖咖抱著娃娃，摩卡貓蜷在腳邊，小鴨鴨浮在洗澡水裡，
          打呼嚕大王在旁邊打呼嚕——這次沒有人覺得吵。
          <br />
          <br />
          晚安，勇者團。
        </p>
      </Card>

      <p className="text-center text-label font-bold text-muted">
        等級 {run.level} · 走過 7 個地方 · 收集 {run.stickers} 張貼紙
      </p>

      <Button size="lg" full onClick={onContinue}>
        回到標題
      </Button>
    </Screen>
  );
};
