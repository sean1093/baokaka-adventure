import { useState } from 'react';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Chip, Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { Home, Play } from '../../components/icons';
import { CHAPTERS } from '../engine/chapters';
import { runStarted } from '../engine/quest';
import type { Run } from '../engine/types';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;
const SnoreKing = SPRITES.snoreKing;

type Props = { run: Run; onNew: () => void; onContinue: () => void; onExit: () => void };

export const QuestTitleScreen = ({ run, onNew, onContinue, onExit }: Props) => {
  const [confirming, setConfirming] = useState(false);
  const started = runStarted(run);
  const chapter = CHAPTERS[run.chapter - 1];

  return (
    <Screen center>
      <section className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-plum/50 via-cream to-sky/40 px-6 pb-4 pt-8 shadow-card">
        <Chip tone="ink">回合制冒險</Chip>
        <h1 className="mt-3 text-hero font-extrabold">
          寶咖咖
          <br />
          勇者團
        </h1>
        <p className="mt-3 max-w-[10rem] text-copy text-ink/70">搗蛋鬼搶走了安撫娃娃。和摩卡貓一起把它搶回來！</p>
        <div className="mt-4 flex items-end justify-between">
          <span className="flex items-end">
            <span className="block h-28 w-28">
              <Baokaka />
            </span>
            <span className="-ml-3 mb-1 block h-20 w-20">
              <MochaCat />
            </span>
          </span>
          <span className="block h-24 w-24 -scale-x-100">
            <SnoreKing />
          </span>
        </div>
      </section>

      {started ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="flex items-center gap-4 rounded-3xl bg-surface p-4 text-left shadow-card transition-transform duration-150 active:scale-[0.98]"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-b from-sun to-sunDeep text-ink shadow-glow">
              <Play />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-caption font-bold text-muted">繼續冒險</span>
              <span className="block truncate text-heading font-extrabold">
                第 {run.chapter} 章 {chapter.title}
              </span>
              <span className="block text-label text-muted">
                等級 {run.level} · 第 {run.node + 1} / {chapter.nodes.length} 站
              </span>
            </span>
          </button>
          <div className="flex justify-center gap-2">
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              重新開始
            </Button>
            <Button variant="ghost" icon={<Home size={20} />} onClick={onExit}>
              回遊戲選單
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Button size="lg" full icon={<Play size={22} />} onClick={onNew}>
            {run.cleared ? '再冒險一次' : '開始冒險'}
          </Button>
          <Button variant="ghost" icon={<Home size={20} />} onClick={onExit}>
            回遊戲選單
          </Button>
        </div>
      )}

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="重新開始？">
        <p className="mb-5 text-center text-copy text-muted">目前的進度、等級和道具都會消失。</p>
        <div className="flex flex-col gap-2">
          <Button variant="danger" size="lg" full onClick={onNew}>
            確定重來
          </Button>
          <Button variant="tonal" size="lg" full onClick={() => setConfirming(false)}>
            取消
          </Button>
        </div>
      </Sheet>
    </Screen>
  );
};
