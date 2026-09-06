import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { Home } from '../../components/icons';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

type Props = { onStart: () => void; onExit: () => void };

/** The front page: one gradient hero card, then the single thing to do next. */
export const TitleScreen = ({ onStart, onExit }: Props) => (
  <Screen center>
    <section className="overflow-hidden rounded-4xl bg-gradient-to-br from-leaf/40 via-cream to-sun/40 px-6 pb-6 pt-8 text-center shadow-card">
      <h1 className="text-hero font-extrabold leading-tight">
        寶咖咖與摩卡貓
        <br />
        的冒險
      </h1>

      <div className="mt-4 flex items-end justify-center gap-2">
        <span className="block h-36 w-36">
          <Baokaka />
        </span>
        <span className="block h-28 w-28">
          <MochaCat />
        </span>
      </div>

      <p className="mt-3 text-heading leading-relaxed">
        摩卡貓把東西藏起來了。
        <br />
        幫寶咖咖一樣一樣找回來。
      </p>
    </section>

    <Button size="xl" full onClick={onStart}>
      開始冒險
    </Button>

    <p className="text-center text-heading text-muted">慢慢玩，沒有時間限制</p>

    <Button variant="ghost" size="xl" full icon={<Home />} onClick={onExit}>
      回遊戲選單
    </Button>
  </Screen>
);
