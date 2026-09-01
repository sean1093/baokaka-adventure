import { SPRITES } from '../art/sprites';
import { BigButton } from '../components/BigButton';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

type Props = { onStart: () => void };

export const TitleScreen = ({ onStart }: Props) => (
  <div className="flex h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
    <h1 className="text-huge font-bold leading-tight">
      寶咖咖
      <span className="text-title">與</span>
      摩卡貓
      <br />
      的冒險
    </h1>

    <div className="flex items-end justify-center gap-2">
      <span className="block h-36 w-36">
        <Baokaka />
      </span>
      <span className="block h-28 w-28">
        <MochaCat />
      </span>
    </div>

    <p className="text-body leading-relaxed">
      摩卡貓把東西藏起來了。
      <br />
      幫寶咖咖一樣一樣找回來。
    </p>

    <BigButton onClick={onStart}>開始冒險</BigButton>

    <p className="text-base text-ink/70">慢慢玩，沒有時間限制</p>
  </div>
);
