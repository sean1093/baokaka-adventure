import { useEffect } from 'react';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Card, Screen } from '../../components/Screen';
import { Refresh } from '../../components/icons';
import { playTone } from '../../shared/audio';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

type Props = { soundOn: boolean; onRetry: () => void };

/** Losing costs nothing but the walk back: no items lost, no experience lost, no scolding. */
export const DefeatScreen = ({ soundOn, onRetry }: Props) => {
  useEffect(() => {
    playTone('defeat', soundOn);
  }, [soundOn]);

  return (
    <Screen center className="gap-4">
      <section className="text-center opacity-80">
        <div className="mb-2 flex items-end justify-center gap-1 grayscale">
          <span className="block h-20 w-20">
            <Baokaka />
          </span>
          <span className="block h-16 w-16">
            <MochaCat />
          </span>
        </div>
        <h1 className="text-display font-extrabold">大家累倒了</h1>
      </section>

      <Card className="p-4 text-center">
        <p className="text-copy leading-relaxed text-ink/80">
          睡一下就好了。
          <br />
          從這一張地圖的入口重新來，
          <br />
          道具、貼紙和經驗都還在。
        </p>
        <p className="mt-3 text-label font-bold text-muted">小提示：血少的時候先「防禦」，或用道具補一下。</p>
      </Card>

      <Button size="lg" full icon={<Refresh size={22} />} onClick={onRetry}>
        再來一次
      </Button>
    </Screen>
  );
};
