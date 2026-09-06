import { useState } from 'react';
import { SPRITES } from '../../art/sprites';
import { BigButton } from '../../components/BigButton';
import { runStarted } from '../engine/quest';
import type { Run } from '../engine/types';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;
const SnoreKing = SPRITES.snoreKing;

type Props = { run: Run; onNew: () => void; onContinue: () => void; onExit: () => void };

export const QuestTitleScreen = ({ run, onNew, onContinue, onExit }: Props) => {
  const [confirming, setConfirming] = useState(false);
  const started = runStarted(run);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-5 px-6 py-8 text-center">
      <p className="text-base font-bold text-ink/60">回合制冒險</p>
      <h1 className="text-huge font-bold leading-tight">寶咖咖勇者團</h1>

      <div className="flex items-end justify-center gap-1">
        <span className="block h-32 w-32">
          <Baokaka />
        </span>
        <span className="block h-24 w-24">
          <MochaCat />
        </span>
        <span className="ml-3 block h-28 w-28 -scale-x-100">
          <SnoreKing />
        </span>
      </div>

      <p className="text-body leading-relaxed">
        搗蛋鬼搶走了安撫娃娃。
        <br />
        和摩卡貓一起把它搶回來！
      </p>

      {!started && <BigButton onClick={onNew}>{run.cleared ? '再冒險一次' : '開始冒險'}</BigButton>}

      {started && !confirming && (
        <>
          <BigButton onClick={onContinue}>繼續冒險</BigButton>
          <p className="text-base text-ink/70">
            第 {run.chapter} 章 · 等級 {run.level}
          </p>
          <BigButton tone="quiet" onClick={() => setConfirming(true)}>
            重新開始
          </BigButton>
        </>
      )}

      {started && confirming && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border-4 border-berry bg-white p-4">
          <p className="text-base font-bold">要放棄目前的進度，從頭開始嗎？</p>
          <div className="flex gap-3">
            <BigButton onClick={onNew}>確定重來</BigButton>
            <BigButton tone="quiet" onClick={() => setConfirming(false)}>
              取消
            </BigButton>
          </div>
        </div>
      )}

      <BigButton tone="quiet" onClick={onExit}>
        回遊戲選單
      </BigButton>
    </div>
  );
};
