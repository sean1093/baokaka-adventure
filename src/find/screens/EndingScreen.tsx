import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Card, Screen } from '../../components/Screen';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;
const Star = SPRITES.star;

type Props = { onBackToMap: () => void };

export const EndingScreen = ({ onBackToMap }: Props) => (
  <Screen center>
    <Card className="px-6 pb-7 pt-6 text-center">
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map((index) => (
          <span key={index} className="block h-10 w-10">
            <Star />
          </span>
        ))}
      </div>

      <h1 className="mt-3 text-display font-extrabold leading-tight">
        六個地方
        <br />
        都冒險完了！
      </h1>

      <div className="mt-3 flex items-end justify-center gap-2">
        <span className="block h-36 w-36">
          <Baokaka />
        </span>
        <span className="block h-28 w-28">
          <MochaCat />
        </span>
      </div>

      <p className="mt-3 text-heading leading-loose">
        寶咖咖和摩卡貓睡著了。
        <br />
        謝謝你陪他們走完這一天。
      </p>
    </Card>

    <Button size="xl" full onClick={onBackToMap}>
      再玩一次
    </Button>
  </Screen>
);
