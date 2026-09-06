import { SPRITES } from '../../art/sprites';
import { BigButton } from '../../components/BigButton';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

type Props = { onRetry: () => void };

export const DefeatScreen = ({ onRetry }: Props) => (
  <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-8 text-center">
    <h1 className="text-title font-bold leading-tight">哎呀，被打敗了…</h1>

    <div className="flex items-end justify-center gap-1 opacity-70 grayscale">
      <span className="block h-32 w-32">
        <Baokaka />
      </span>
      <span className="block h-24 w-24">
        <MochaCat />
      </span>
    </div>

    <p className="text-body leading-loose">
      寶咖咖哭著跑回家，摩卡貓舔舔他的臉。
      <br />
      睡一覺就沒事了！從這一章的開頭再來一次，
      <br />
      經驗值和道具都還在。
    </p>

    <p className="text-base text-ink/70">小提示：看敵人頭上的動作，蓄力之後要記得防禦。</p>

    <BigButton onClick={onRetry}>再試一次</BigButton>
  </div>
);
