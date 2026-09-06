import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;
const ComfortDoll = SPRITES.comfortDoll;
const Star = SPRITES.star;

type Props = { onContinue: () => void };

export const QuestEndingScreen = ({ onContinue }: Props) => (
  <Screen center>
    <section className="overflow-hidden rounded-4xl bg-surface shadow-card">
      <div className="flex flex-col items-center bg-gradient-to-b from-plum/30 via-sky/20 to-transparent px-6 pb-2 pt-7">
        <div className="flex gap-1">
          {[0, 1, 2].map((index) => (
            <span key={index} className="pop block h-9 w-9" style={{ animationDelay: `${index * 120}ms` }}>
              <Star />
            </span>
          ))}
        </div>
        <h1 className="mt-2 text-center text-display font-extrabold">
          安撫娃娃
          <br />
          回來了！
        </h1>
        <div className="mt-2 flex items-end justify-center gap-1">
          <span className="block h-28 w-28">
            <Baokaka />
          </span>
          <span className="block h-16 w-16">
            <ComfortDoll />
          </span>
          <span className="block h-20 w-20">
            <MochaCat />
          </span>
        </div>
      </div>
      <p className="px-6 pb-7 pt-3 text-center text-copy leading-loose text-ink/85">
        寶咖咖抱著娃娃，摩卡貓蜷在腳邊，打呼嚕大王在旁邊打呼嚕。勇者團全員，晚安。
      </p>
    </section>
    <Button size="lg" full onClick={onContinue}>
      回到標題
    </Button>
  </Screen>
);
