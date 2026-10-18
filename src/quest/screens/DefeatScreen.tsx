import { useEffect } from 'react';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Refresh } from '../../components/icons';
import { Panel } from '../../components/Panel';
import { Screen } from '../../components/Screen';
import { playTone } from '../../shared/audio';
import { UI } from '../engine/strings';

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
      <section className="text-center">
        {/* Dozing, not defeated: dimmed under a cool moonlit glow */}
        <div className="relative mx-auto mb-2 flex h-28 items-end justify-center gap-1">
          <span aria-hidden="true" className="absolute bottom-0 left-1/2 block h-28 w-60 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,theme(colors.backlight.moon/30%),transparent_65%)]" />
          <span className="relative block h-24 w-24 opacity-60 grayscale-[60%]">
            <Baokaka lod="battle" />
          </span>
          <span className="relative block h-20 w-20 opacity-60 grayscale-[60%]">
            <MochaCat lod="battle" />
          </span>
        </div>
        <h1 className="font-serif text-title tracking-[0.1em] text-inkOnDark">{UI.defeat[0]}</h1>
      </section>

      <Panel diamonds className="px-5 py-4 text-center">
        <p className="relative text-body leading-relaxed">
          {UI.defeat[1]}
          <br />
          道具、{UI.coins}和經驗都還在。
        </p>
        <div className="kit-rule relative mx-auto my-3 w-40" />
        <p className="relative text-label leading-relaxed text-mutedOnDark">
          <span className="text-gold">小提示</span>：體力少的時候先「防禦」，
          <br />
          或用道具補一下。
        </p>
      </Panel>

      <Button size="lg" full icon={<Refresh size={22} />} onClick={onRetry}>
        再來一次
      </Button>
    </Screen>
  );
};
