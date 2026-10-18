import { useState } from 'react';
import { RIM, UI as TOKENS, skyAt } from '../../art/palette';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Num } from '../../components/Chip';
import { Play, Refresh } from '../../components/icons';
import { Panel } from '../../components/Panel';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { CHAPTER_TITLES, MAPS } from '../engine/maps';
import { runStarted } from '../engine/quest';
import { UI } from '../engine/strings';
import type { Run } from '../engine/types';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

/** The midnight behind the title: the 00:00 sky (§ 3.2). Final title art is #56. */
const SKY = skyAt('00:00');

/** A fixed scatter of stars over the top half (fractions), so screenshots never change. */
const STARS = Array.from({ length: 22 }, (_, index) => ({
  x: ((index * 7919 + 211) % 997) / 997,
  y: (((index * 104729 + 31) % 991) / 991) * 0.55,
  big: index % 5 === 0,
}));

type Props = {
  run: Run;
  /** An old-story save was just discarded: explain the fresh start (decisions.md D-12) */
  legacyNotice: boolean;
  onDismissNotice: () => void;
  onNew: () => void;
  onContinue: () => void;
};

export const QuestTitleScreen = ({ run, legacyNotice, onDismissNotice, onNew, onContinue }: Props) => {
  const [confirming, setConfirming] = useState(false);
  const started = runStarted(run);

  return (
    <div className="relative min-h-dvh w-full overflow-hidden" style={{ background: `linear-gradient(180deg, ${SKY.top} 0%, ${SKY.mid} 55%, ${TOKENS.panelBottom} 100%)` }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {STARS.map((star, index) => (
          <span
            key={index}
            className="kit-star absolute block rounded-full bg-inkOnDark"
            style={{ left: `${star.x * 100}%`, top: `${star.y * 100}%`, width: star.big ? 3 : 2, height: star.big ? 3 : 2, ['--i' as string]: index }}
          />
        ))}
        <span
          className="absolute right-[10%] top-[4%] block h-14 w-14 rounded-full"
          style={{ background: `radial-gradient(circle at 40% 38%, ${TOKENS.inkOnDark}, ${RIM.moon} 72%)`, boxShadow: `0 0 30px 8px ${RIM.moon}44, 0 0 90px 30px ${RIM.moon}1A` }}
        />
      </div>

      <Screen center className="relative gap-5">
        <header className="text-center">
          <p className="font-num text-[12px] font-semibold tracking-[0.3em] text-gold/90">MIDNIGHT ACROSS TAIPEI</p>
          <h1 className="mt-2 font-serif font-black leading-[1.05] [text-shadow:0_4px_24px_rgb(0_0_0/0.5)]">
            <span className="block bg-gradient-to-b from-gold-diamond via-gold-light to-gold bg-clip-text text-logo tracking-[0.12em] text-transparent drop-shadow-[0_3px_14px_rgb(0_0_0/0.45)] [text-shadow:none]">寶咖咖</span>
            <span className="mt-1 block text-title tracking-[0.3em] text-inkOnDark">抓周大冒險</span>
          </h1>
          <div className="kit-rule mx-auto mt-3 w-48" />
        </header>

        <div className="relative mx-auto flex h-36 items-end justify-center gap-1">
          <span aria-hidden="true" className="absolute bottom-0 left-1/2 block h-8 w-56 -translate-x-1/2 rounded-[50%] bg-gold/15 shadow-[0_0_30px_theme(colors.gold.DEFAULT/30%)]" />
          <span className="relative block h-32 w-32">
            <Baokaka lod="battle" />
          </span>
          <span className="relative block h-28 w-28">
            <MochaCat lod="battle" />
          </span>
        </div>

        <p className="text-center text-body leading-relaxed text-mutedOnDark">
          安撫娃娃不見了。
          <br />
          走遍七個地方，把它找回來。
        </p>

        {started ? (
          <>
            <Panel className="flex items-center gap-3 px-4 py-3.5">
              <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full border border-gold bg-[radial-gradient(circle_at_50%_35%,theme(colors.command.top),theme(colors.panel.deep))] shadow-[0_0_14px_theme(colors.gold.DEFAULT/35%)]">
                <span className="text-center leading-none">
                  <span className="block font-num text-[10px] font-semibold tracking-[0.12em] text-gold">LV</span>
                  <Num className="text-[22px]">{run.level}</Num>
                </span>
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="block truncate text-caption text-mutedOnDark">
                  第 {run.chapter} 章 · {CHAPTER_TITLES[run.chapter - 1]}
                </span>
                <span className="block truncate font-serif text-heading tracking-[0.1em]">{MAPS[run.map].title}</span>
                <span className="block text-caption text-mutedOnDark">
                  隊伍 <Num>{run.party.length}</Num> 人 · {UI.coins} <Num>{run.coins}</Num>
                </span>
              </span>
            </Panel>
            <div className="flex flex-col gap-2.5">
              <Button size="lg" full icon={<Play size={22} />} onClick={onContinue}>
                繼續冒險
              </Button>
              <Button size="md" full variant="secondary" icon={<Refresh size={20} />} onClick={() => setConfirming(true)}>
                從頭開始
              </Button>
            </div>
          </>
        ) : (
          <Button size="lg" full icon={<Play size={22} />} onClick={onNew}>
            開始冒險
          </Button>
        )}

        {run.cleared && <p className="text-center text-caption text-gold-light">★ 已經通關過一次了</p>}
      </Screen>

      <Sheet open={legacyNotice} onClose={onDismissNotice} title={UI.legacyReset[0]}>
        <p className="mb-4 text-center text-body leading-relaxed text-mutedOnDark">
          {/* Wrap only between phrases, never mid-phrase (no regex lookbehind: older iOS Safari lacks it) */}
          {UI.legacyReset[1].split('，').map((phrase, index, phrases) => (
            <span key={phrase} className="inline-block">
              {index < phrases.length - 1 ? `${phrase}，` : phrase}
            </span>
          ))}
        </p>
        <Button size="lg" full onClick={onDismissNotice}>
          {UI.ok}
        </Button>
      </Sheet>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="重新開始？">
        <p className="mb-4 text-center text-body leading-relaxed text-mutedOnDark">現在的進度會全部消失喔。</p>
        <div className="flex flex-col gap-2.5">
          {/* The safe answer is the gold one */}
          <Button size="lg" full onClick={() => setConfirming(false)}>
            取消
          </Button>
          <Button size="lg" full variant="secondary" onClick={onNew}>
            確定，重新開始
          </Button>
        </div>
      </Sheet>
    </div>
  );
};
