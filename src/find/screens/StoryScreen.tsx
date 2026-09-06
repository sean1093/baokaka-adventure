import type { Level } from '../game/types';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Card, Screen } from '../../components/Screen';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

type Props = { level: Level; isLast: boolean; onContinue: () => void };

export const StoryScreen = ({ level, isLast, onContinue }: Props) => (
  <Screen center>
    <Card className="px-6 pb-7 pt-6 text-center">
      <p className="text-display font-extrabold">找到了！</p>

      <div className="mt-3 flex items-end justify-center gap-1">
        <span className="block h-32 w-32">
          <Baokaka />
        </span>
        <span className="block h-24 w-24">
          <MochaCat />
        </span>
      </div>

      <h2 className="mt-3 text-headline font-extrabold">{level.title}</h2>
      <p className="mt-3 text-heading leading-loose">{level.story}</p>
    </Card>

    <Button size="xl" full onClick={onContinue}>
      {isLast ? '看結局' : '繼續'}
    </Button>
  </Screen>
);
