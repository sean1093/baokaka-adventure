import { SPRITES } from '../art/sprites';
import { BigButton } from '../components/BigButton';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;
const Star = SPRITES.star;

type Props = { onBackToMap: () => void };

export const EndingScreen = ({ onBackToMap }: Props) => (
  <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-8 text-center">
    <div className="flex gap-2">
      {[0, 1, 2].map((index) => (
        <span key={index} className="block h-10 w-10">
          <Star />
        </span>
      ))}
    </div>

    <h1 className="text-title font-bold leading-tight">
      六個地方
      <br />
      都冒險完了！
    </h1>

    <div className="flex items-end justify-center gap-2">
      <span className="block h-36 w-36">
        <Baokaka />
      </span>
      <span className="block h-28 w-28">
        <MochaCat />
      </span>
    </div>

    <p className="text-body leading-loose">
      寶咖咖和摩卡貓睡著了。
      <br />
      謝謝你陪他們走完這一天。
    </p>

    <BigButton onClick={onBackToMap}>再玩一次</BigButton>
  </div>
);
