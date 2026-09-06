import { SPRITES } from '../../art/sprites';
import { BigButton } from '../../components/BigButton';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;
const ComfortDoll = SPRITES.comfortDoll;
const Star = SPRITES.star;

type Props = { onContinue: () => void };

export const QuestEndingScreen = ({ onContinue }: Props) => (
  <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-8 text-center">
    <div className="flex gap-2">
      {[0, 1, 2].map((index) => (
        <span key={index} className="block h-10 w-10">
          <Star />
        </span>
      ))}
    </div>

    <h1 className="text-title font-bold leading-tight">
      安撫娃娃
      <br />
      回來了！
    </h1>

    <div className="flex items-end justify-center gap-1">
      <span className="block h-32 w-32">
        <Baokaka />
      </span>
      <span className="block h-20 w-20">
        <ComfortDoll />
      </span>
      <span className="block h-24 w-24">
        <MochaCat />
      </span>
    </div>

    <p className="text-body leading-loose">
      寶咖咖抱著娃娃，摩卡貓蜷在腳邊，
      <br />
      打呼嚕大王在旁邊打呼嚕。
      <br />
      勇者團全員，晚安。
    </p>

    <BigButton onClick={onContinue}>回到標題</BigButton>
  </div>
);
