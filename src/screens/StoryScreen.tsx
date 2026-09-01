import type { Level } from '../game/types';
import { SPRITES } from '../art/sprites';
import { BigButton } from '../components/BigButton';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

type Props = { level: Level; isLast: boolean; onContinue: () => void };

export const StoryScreen = ({ level, isLast, onContinue }: Props) => (
  <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-8 text-center">
    <p className="text-title font-bold">找到了！</p>

    <div className="flex items-end justify-center gap-1">
      <span className="block h-32 w-32">
        <Baokaka />
      </span>
      <span className="block h-24 w-24">
        <MochaCat />
      </span>
    </div>

    <h2 className="text-body font-bold">{level.title}</h2>
    <p className="text-body leading-loose">{level.story}</p>

    <BigButton onClick={onContinue}>{isLast ? '看結局' : '繼續'}</BigButton>
  </div>
);
