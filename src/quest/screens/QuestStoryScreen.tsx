import { SPRITES } from '../../art/sprites';
import { BigButton } from '../../components/BigButton';

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
  <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-8 text-center">
    <p className="text-title font-bold">{heading}</p>

    <div className="flex items-end justify-center gap-1">
      <span className="block h-32 w-32">
        <Baokaka />
      </span>
      <span className="block h-24 w-24">
        <MochaCat />
      </span>
    </div>

    <h2 className="text-body font-bold">{title}</h2>
    <p className="text-body leading-loose">{text}</p>

    <BigButton onClick={onContinue}>{buttonLabel}</BigButton>
  </div>
);
