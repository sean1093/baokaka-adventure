import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { Refresh } from '../../components/icons';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

type Props = { onRetry: () => void };

export const DefeatScreen = ({ onRetry }: Props) => (
  <Screen center>
    <section className="overflow-hidden rounded-4xl bg-surface shadow-card">
      <div className="flex items-end justify-center gap-1 bg-gradient-to-b from-plum/25 to-transparent px-6 pt-8 opacity-80 grayscale">
        <span className="block h-28 w-28">
          <Baokaka />
        </span>
        <span className="block h-20 w-20">
          <MochaCat />
        </span>
      </div>
      <div className="px-6 pb-6 pt-3 text-center">
        <h1 className="text-display font-extrabold">哎呀，被打敗了</h1>
        <p className="mt-3 text-copy leading-relaxed text-ink/85">
          寶咖咖哭著跑回家，摩卡貓舔舔他的臉。睡一覺就沒事了！從這一章的開頭再來一次，經驗值和道具都還在。
        </p>
        <p className="mt-4 rounded-2xl bg-ink/[0.05] px-4 py-3 text-label text-muted">小提示：看敵人頭上的動作，蓄力之後要記得防禦。</p>
      </div>
    </section>
    <Button size="lg" full icon={<Refresh size={22} />} onClick={onRetry}>
      再試一次
    </Button>
  </Screen>
);
