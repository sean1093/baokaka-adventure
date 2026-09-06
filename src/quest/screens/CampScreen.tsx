import { SPRITES } from '../../art/sprites';
import { BigButton } from '../../components/BigButton';
import { PartyPanel } from '../components/PartyPanel';
import { ITEMS, SKILLS } from '../engine/heroes';
import { CAMP_PACK_ITEMS, CAMP_TRAIN_XP, type CampResult } from '../engine/quest';
import type { CampChoice, Run } from '../engine/types';

const packList = CAMP_PACK_ITEMS.map((item) => `${ITEMS[item].name} ×1`).join('、');

const OPTIONS: { choice: CampChoice; title: string; blurb: string; art: keyof typeof SPRITES }[] = [
  { choice: 'nap', title: '睡午覺', blurb: '兩個人的體力全滿', art: 'pillow' },
  { choice: 'pack', title: '翻翻包包', blurb: `拿到 ${packList}`, art: 'coinPurse' },
  { choice: 'train', title: '練習丟積木', blurb: `經驗值 +${CAMP_TRAIN_XP}`, art: 'ball' },
];

function resultText(result: CampResult, run: Run): string {
  switch (result.choice) {
    case 'nap':
      return '兩個人睡了一個香香的午覺，體力全滿！';
    case 'pack':
      return `包包最底下翻到了 ${packList}！`;
    case 'train': {
      if (!result.leveled) return `丟積木丟得越來越準了，經驗值 +${CAMP_TRAIN_XP}！`;
      const learned = result.unlocked.map((skill) => SKILLS[skill].name).join('、');
      return `練習有成，升到 ${run.level} 級！體力全滿${learned ? `，還學會了「${learned}」` : ''}。`;
    }
  }
}

type Props = {
  run: Run;
  result?: CampResult;
  onChoose: (choice: CampChoice) => void;
  onContinue: () => void;
};

/** The rest stop between the second fight and the boss: heal, restock, or grind, pick one. */
export const CampScreen = ({ run, result, onChoose, onContinue }: Props) => (
  <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-6">
    <header>
      <p className="text-base font-bold text-ink/60">營地</p>
      <h1 className="text-title font-bold leading-tight">休息一下，選一樣</h1>
    </header>

    <PartyPanel run={run} />

    {result ? (
      <div className="flex flex-col items-center gap-4 rounded-3xl border-4 border-ink bg-sun/30 p-5 text-center">
        <p className="text-body font-bold leading-relaxed">{resultText(result, run)}</p>
        <BigButton onClick={onContinue}>繼續前進</BigButton>
      </div>
    ) : (
      <div className="flex flex-col gap-3">
        {OPTIONS.map(({ choice, title, blurb, art }) => {
          const Art = SPRITES[art];
          return (
            <button
              key={choice}
              type="button"
              onClick={() => onChoose(choice)}
              className="flex min-h-touch items-center gap-4 rounded-3xl border-4 border-ink bg-white px-4 py-3 text-left shadow-[0_5px_0_#3B2A20] transition-transform active:translate-y-1"
            >
              <span className="block h-14 w-14 shrink-0">
                <Art />
              </span>
              <span className="flex flex-col">
                <span className="text-body font-bold leading-tight">{title}</span>
                <span className="text-base text-ink/70">{blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
    )}
  </div>
);
