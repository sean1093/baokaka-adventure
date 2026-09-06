import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Chip, Screen } from '../../components/Screen';
import { ChevronRight } from '../../components/icons';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

type Props = {
  heading: string;
  title: string;
  text: string;
  buttonLabel: string;
  onContinue: () => void;
};

/** One storybook page: used for the prologue and after every chapter's boss. */
export const QuestStoryScreen = ({ heading, title, text, buttonLabel, onContinue }: Props) => (
  <Screen center>
    <section className="overflow-hidden rounded-4xl bg-surface shadow-card">
      <div className="flex items-end justify-center gap-1 bg-gradient-to-b from-sun/30 to-transparent px-6 pt-8">
        <span className="block h-32 w-32">
          <Baokaka />
        </span>
        <span className="block h-24 w-24">
          <MochaCat />
        </span>
      </div>
      <div className="px-6 pb-7 pt-4 text-center">
        <Chip tone="sun">{heading}</Chip>
        <h1 className="mt-3 text-headline font-extrabold">{title}</h1>
        <p className="mt-4 text-left text-copy leading-loose text-ink/85">{text}</p>
      </div>
    </section>
    <Button size="lg" full icon={<ChevronRight size={22} />} onClick={onContinue}>
      {buttonLabel}
    </Button>
  </Screen>
);
