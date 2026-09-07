import { useState } from 'react';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Card, Screen } from '../../components/Screen';
import { Home, Play, Sparkle } from '../../components/icons';
import { Sheet } from '../../components/Sheet';
import { CHAPTER_TITLES, MAPS } from '../engine/maps';
import { runStarted } from '../engine/quest';
import type { Run } from '../engine/types';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;
const Duck = SPRITES.duck;

type Props = { run: Run; onNew: () => void; onContinue: () => void; onExit: () => void };

export const QuestTitleScreen = ({ run, onNew, onContinue, onExit }: Props) => {
  const [confirming, setConfirming] = useState(false);
  const started = runStarted(run);

  return (
    <Screen center className="gap-5">
      <section className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-plum/35 via-cream to-sun/35 px-6 pb-5 pt-7 text-center shadow-card">
        <p className="text-label font-bold tracking-[0.35em] text-mochaDeep">奇幻冒險</p>
        <h1 className="mt-1 text-hero font-extrabold leading-none">
          寶咖咖
          <br />
          奇俠傳
        </h1>
        <div className="mt-4 flex items-end justify-center gap-1">
          <span className="block h-24 w-24">
            <Baokaka />
          </span>
          <span className="block h-20 w-20">
            <MochaCat />
          </span>
          <span className="block h-16 w-16">
            <Duck />
          </span>
        </div>
        <p className="mt-3 text-copy font-bold leading-relaxed text-ink/75">
          安撫娃娃不見了。
          <br />
          走遍七個地方，把它找回來。
        </p>
      </section>

      {started ? (
        <>
          <Card className="flex items-center gap-3 p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-headline font-extrabold text-cream">{run.level}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-caption font-bold text-muted">
                第 {run.chapter} 章 · {CHAPTER_TITLES[run.chapter - 1]}
              </span>
              <span className="block truncate text-heading font-extrabold leading-tight">{MAPS[run.map].title}</span>
              <span className="block text-caption font-bold text-muted">
                隊伍 {run.party.length} 人 · 貼紙 {run.stickers}
              </span>
            </span>
          </Card>
          <Button size="lg" full icon={<Play size={22} />} onClick={onContinue}>
            繼續冒險
          </Button>
          <Button size="md" full variant="tonal" icon={<Sparkle size={20} />} onClick={() => setConfirming(true)}>
            從頭開始
          </Button>
        </>
      ) : (
        <Button size="lg" full icon={<Play size={22} />} onClick={onNew}>
          開始冒險
        </Button>
      )}

      <Button size="md" full variant="ghost" icon={<Home size={20} />} onClick={onExit}>
        回遊戲選單
      </Button>

      {run.cleared && <p className="text-center text-caption font-bold text-leafDeep">★ 已經通關過一次了</p>}

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="重新開始？">
        <p className="mb-4 text-center text-copy leading-relaxed text-ink/75">現在的進度會全部消失喔。</p>
        <div className="flex flex-col gap-2">
          <Button size="lg" full variant="danger" onClick={onNew}>
            確定，重新開始
          </Button>
          <Button size="lg" full variant="tonal" onClick={() => setConfirming(false)}>
            取消
          </Button>
        </div>
      </Sheet>
    </Screen>
  );
};
