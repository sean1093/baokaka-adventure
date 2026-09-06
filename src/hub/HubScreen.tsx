import type { ReactNode } from 'react';
import { SPRITES } from '../art/sprites';
import { Chip, Screen } from '../components/Screen';
import { ChevronRight } from '../components/icons';
import { LEVELS } from '../find/game/levels';
import { loadProgress } from '../find/game/progress';
import { runStarted } from '../quest/engine/quest';
import { loadQuest } from '../quest/engine/save';
import type { Route } from '../shared/route';
import { loadSudoku } from '../sudoku/engine/save';
import { SIZES } from '../sudoku/engine/types';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;
const Bottle = SPRITES.bottle;
const Ball = SPRITES.ball;
const Cookie = SPRITES.cookie;
const ToyBoat = SPRITES.toyBoat;
const BlockGolem = SPRITES.blockGolem;

type Props = { onOpen: (route: Exclude<Route, 'hub'>) => void };

const GameTile = ({
  kicker,
  title,
  blurb,
  status,
  gradient,
  art,
  fresh,
  onClick,
}: {
  kicker: string;
  title: string;
  blurb: string;
  status: string;
  gradient: string;
  art: ReactNode;
  fresh?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative w-full overflow-hidden rounded-4xl bg-gradient-to-br text-left shadow-card transition-transform duration-150 active:scale-[0.98] ${gradient}`}
  >
    <span className="flex items-stretch gap-3 p-5">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <Chip tone="ink">{kicker}</Chip>
          {fresh && <Chip tone="berry">新</Chip>}
        </span>
        <span className="mt-2 text-headline font-extrabold leading-tight">{title}</span>
        <span className="mt-1 text-label leading-snug text-ink/70">{blurb}</span>
        <span className="mt-3">
          <Chip tone="sun">{status}</Chip>
        </span>
        <span className="mt-4 flex justify-end">
          <span className="inline-flex h-10 shrink-0 items-center gap-0.5 rounded-full bg-ink pl-4 pr-2 text-label font-bold text-cream">
            開始
            <ChevronRight size={18} />
          </span>
        </span>
      </span>
      <span className="relative w-28 shrink-0">{art}</span>
    </span>
  </button>
);

/** The front door: one tile per game, each showing where that game's save is up to. */
export const HubScreen = ({ onOpen }: Props) => {
  const find = loadProgress();
  const quest = loadQuest().run;
  const sudoku = loadSudoku();
  const tidied = SIZES.reduce((sum, size) => sum + sudoku.stats[size].solved, 0);
  const stars = SIZES.reduce((sum, size) => sum + sudoku.stats[size].stars, 0);

  const findStatus =
    find.completed.length === 0
      ? '還沒開始'
      : find.completed.length >= LEVELS.length
        ? '六個地方都完成了'
        : `完成 ${find.completed.length} / ${LEVELS.length} 個地方`;

  const questStatus = runStarted(quest)
    ? `第 ${quest.chapter} 章 · 等級 ${quest.level}`
    : quest.cleared
      ? '已通關，再來一次？'
      : '還沒開始';

  const sudokuStatus = sudoku.play
    ? `收到一半 · ${sudoku.play.puzzle.size}×${sudoku.play.puzzle.size}`
    : tidied === 0
      ? '還沒開始'
      : `收好 ${tidied} 題 · ★ ${stars}`;

  return (
    <Screen>
      <section className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-sun/45 via-cream to-sky/40 px-6 pb-7 pt-8 shadow-card">
        <p className="text-caption font-bold text-muted">寶咖咖與摩卡貓的小遊戲</p>
        <h1 className="mt-1 text-hero font-extrabold">
          寶咖咖
          <br />
          與摩卡貓
        </h1>
        <p className="mt-3 max-w-[9.5rem] text-copy text-ink/70">三個小遊戲，隨時開一局。</p>
        <span aria-hidden="true" className="absolute bottom-0 right-1 flex items-end">
          <span className="block h-28 w-28">
            <Baokaka />
          </span>
          <span className="-ml-3 mb-1 block h-20 w-20">
            <MochaCat />
          </span>
        </span>
      </section>

      <GameTile
        kicker="圖案數獨"
        title="摩卡貓的收納挑戰"
        blurb="每一橫列、直行、區都要剛好一個玩具。4×4 到 9×9，看圖案或數字都行。"
        status={sudokuStatus}
        gradient="from-sky/50 via-cream to-sand/70"
        fresh
        art={
          <>
            <span className="absolute right-0 top-0 grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1.5 shadow-card">
              <span className="block h-8 w-8">
                <Ball />
              </span>
              <span className="block h-8 w-8">
                <Bottle />
              </span>
              <span className="block h-8 w-8">
                <Cookie />
              </span>
              <span className="block h-8 w-8">
                <ToyBoat />
              </span>
            </span>
            <span className="absolute -bottom-1 left-0 block h-16 w-16">
              <MochaCat />
            </span>
          </>
        }
        onClick={() => onOpen('sudoku')}
      />

      <GameTile
        kicker="回合制冒險"
        title="寶咖咖勇者團"
        blurb="操控寶咖咖走過六個場景，和摩卡貓並肩打敗搗蛋鬼，把安撫娃娃搶回來。"
        status={questStatus}
        gradient="from-plum/45 via-cream to-sky/40"
        art={
          <>
            <span className="absolute left-0 top-0 block h-20 w-20">
              <Baokaka />
            </span>
            <span className="absolute -right-1 bottom-0 block h-16 w-16 -scale-x-100">
              <BlockGolem />
            </span>
          </>
        }
        onClick={() => onOpen('quest')}
      />

      <GameTile
        kicker="找找看"
        title="寶咖咖與摩卡貓的冒險"
        blurb="摩卡貓把東西藏起來了，一樣一樣找回來。慢慢玩，沒有時間限制。"
        status={findStatus}
        gradient="from-leaf/40 via-cream to-sun/40"
        art={
          <>
            <span className="absolute left-0 top-2 block h-24 w-24">
              <MochaCat />
            </span>
            <span className="absolute -right-1 bottom-0 block h-12 w-12 rotate-12">
              <Bottle />
            </span>
          </>
        }
        onClick={() => onOpen('find')}
      />

      <p className="text-center text-caption text-muted">加到主畫面，下次點一下就開。</p>
    </Screen>
  );
};
