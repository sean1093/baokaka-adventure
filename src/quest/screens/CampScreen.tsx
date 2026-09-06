import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { AppBar, Screen } from '../../components/Screen';
import { ChevronRight } from '../../components/icons';
import { PartyPanel } from '../components/PartyPanel';
import { ITEMS, SKILLS } from '../engine/heroes';
import { CAMP_PACK_ITEMS, CAMP_TRAIN_XP, type CampResult } from '../engine/quest';
import type { CampChoice, Run } from '../engine/types';

const packList = CAMP_PACK_ITEMS.map((item) => `${ITEMS[item].name} ×1`).join('、');

const OPTIONS: { choice: CampChoice; title: string; blurb: string; art: keyof typeof SPRITES; tint: string }[] = [
  { choice: 'nap', title: '睡午覺', blurb: '兩個人的體力全滿', art: 'pillow', tint: 'bg-sky/25' },
  { choice: 'pack', title: '翻翻包包', blurb: `拿到 ${packList}`, art: 'coinPurse', tint: 'bg-sun/30' },
  { choice: 'train', title: '練習丟積木', blurb: `經驗值 +${CAMP_TRAIN_XP}`, art: 'ball', tint: 'bg-leaf/20' },
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
  <Screen>
    <AppBar kicker="營地" title="休息一下，選一樣" />

    <PartyPanel run={run} />

    {result ? (
      <section className="flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-br from-sun/40 via-cream to-sky/30 p-6 text-center shadow-card">
        <p className="text-heading font-bold leading-relaxed">{resultText(result, run)}</p>
        <Button size="lg" full icon={<ChevronRight size={22} />} onClick={onContinue}>
          繼續前進
        </Button>
      </section>
    ) : (
      <div className="flex flex-col gap-3">
        {OPTIONS.map(({ choice, title, blurb, art, tint }) => {
          const Art = SPRITES[art];
          return (
            <button
              key={choice}
              type="button"
              onClick={() => onChoose(choice)}
              className="flex items-center gap-4 rounded-3xl bg-surface p-4 text-left shadow-card transition-transform duration-150 active:scale-[0.98]"
            >
              <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${tint}`}>
                <span className="block h-11 w-11">
                  <Art />
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-heading font-extrabold leading-tight">{title}</span>
                <span className="text-label text-muted">{blurb}</span>
              </span>
              <ChevronRight className="shrink-0 text-ink/40" />
            </button>
          );
        })}
      </div>
    )}
  </Screen>
);
