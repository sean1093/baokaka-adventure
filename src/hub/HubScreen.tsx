import type { ReactNode } from 'react';
import { SPRITES } from '../art/sprites';
import { LEVELS } from '../find/game/levels';
import { loadProgress } from '../find/game/progress';
import { CHAPTERS } from '../quest/engine/chapters';
import { runStarted } from '../quest/engine/quest';
import { loadQuest } from '../quest/engine/save';
import type { Route } from '../shared/route';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;
const Bottle = SPRITES.bottle;
const BlockGolem = SPRITES.blockGolem;

type Props = { onOpen: (route: Exclude<Route, 'hub'>) => void };

const GameCard = ({
  kicker,
  title,
  blurb,
  status,
  art,
  fresh,
  onClick,
}: {
  kicker: string;
  title: string;
  blurb: string;
  status: string;
  art: ReactNode;
  fresh?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="relative flex w-full items-center gap-4 rounded-3xl border-4 border-ink bg-white p-4 text-left shadow-[0_6px_0_#3B2A20] transition-transform active:translate-y-1"
  >
    {fresh && (
      <span className="absolute -right-2 -top-3 rounded-full border-4 border-ink bg-berry px-3 py-1 text-base font-bold text-white">
        新遊戲
      </span>
    )}
    <span className="relative block h-28 w-28 shrink-0">{art}</span>
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-base font-bold text-ink/60">{kicker}</span>
      <span className="text-body font-bold leading-tight">{title}</span>
      <span className="text-base leading-snug">{blurb}</span>
      <span className="text-base font-bold text-leaf">{status}</span>
    </span>
  </button>
);

/** The front door: one card per game, each showing where that game's save is up to. */
export const HubScreen = ({ onOpen }: Props) => {
  const find = loadProgress();
  const quest = loadQuest().run;

  const findStatus =
    find.completed.length === 0
      ? '還沒開始'
      : find.completed.length >= LEVELS.length
        ? '六個地方都完成了！'
        : `已完成 ${find.completed.length} / ${LEVELS.length} 個地方`;

  const questStatus = runStarted(quest)
    ? `第 ${quest.chapter} 章 · 等級 ${quest.level}`
    : quest.cleared
      ? '已經通關！再冒險一次？'
      : '還沒開始';

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-end justify-center gap-1">
          <span className="block h-28 w-28">
            <Baokaka />
          </span>
          <span className="block h-20 w-20">
            <MochaCat />
          </span>
        </div>
        <h1 className="text-huge font-bold leading-tight">寶咖咖與摩卡貓</h1>
        <p className="text-body text-ink/70">選一個遊戲來玩</p>
      </header>

      <GameCard
        kicker="回合制冒險"
        title="寶咖咖勇者團"
        blurb="操控寶咖咖走過六個場景，和摩卡貓並肩打敗搗蛋鬼，把安撫娃娃搶回來。"
        status={questStatus}
        fresh
        art={
          <>
            <span className="absolute left-0 top-4 block h-20 w-20">
              <Baokaka />
            </span>
            <span className="absolute -right-1 bottom-0 block h-16 w-16 -scale-x-100">
              <BlockGolem />
            </span>
          </>
        }
        onClick={() => onOpen('quest')}
      />

      <GameCard
        kicker="找找看"
        title="寶咖咖與摩卡貓的冒險"
        blurb="摩卡貓把東西藏起來了，一樣一樣找回來。慢慢玩，沒有時間限制。"
        status={findStatus}
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

      <p className="mt-auto text-center text-base text-ink/60">
        共 {CHAPTERS.length} 章冒險與 {LEVELS.length} 個尋物場景。進度會自動記在這支手機裡。
      </p>
    </div>
  );
};
