import { BACKLIGHT } from '../../art/palette';
import { SPRITES } from '../../art/sprites';
import type { SpriteName } from '../../art/types';
import { Button } from '../../components/Button';
import { DialogueBox, type Speaker } from '../../components/DialogueBox';
import { HEROES } from '../engine/heroes';
import { HERO_BACKLIGHT, SPEAKERS, speakerBacklight } from '../engine/events';
import { UI } from '../engine/strings';
import { HERO_ORDER, type ChoiceOption, type HeroId, type Line } from '../engine/types';
import { HERO_SPRITE } from './PartyPanel';

/**
 * The game's side of the dialogue box: who is speaking (name, backlight, bust sprite) from the
 * engine's tables, and the three things the box can hold (a line, a choice, the inn question).
 * The box itself is the dumb `components/DialogueBox`.
 */

const isHero = (who: string): who is HeroId => HERO_ORDER.includes(who as HeroId);

type Who = Speaker & { sprite: SpriteName };

/** Name, backlight and sprite for a line's speaker; null for narration (or an unknown id). */
export function speakerOf(who: Line['who']): Who | null {
  if (who === null) return null;
  if (isHero(who)) return { name: HEROES[who].name, color: BACKLIGHT[HERO_BACKLIGHT[who]], sprite: HERO_SPRITE[who] };
  const entry = SPEAKERS[who];
  return entry ? { name: entry.name, color: BACKLIGHT[speakerBacklight(entry)], sprite: entry.sprite } : null;
}

/**
 * The speaker's sprite at the portrait LOD, framed as a bust: the figure fills the square bust
 * area, set a tenth of the way down, so the head and shoulders rise above the box and the rest
 * sits behind it. Legacy sprites (until #16–#18) are full figures in the same box, so the same
 * framing works for both.
 */
export const Bust = ({ sprite, expr }: { sprite: SpriteName; expr?: string }) => {
  const Art = SPRITES[sprite];
  return (
    <span className="absolute left-[1%] top-[10%] block h-[99%] w-[99%]">
      <Art lod="portrait" expr={expr} facing="right" />
    </span>
  );
};

/** What the talk box is showing. */
export type Talk =
  | { kind: 'line'; line: Line; page?: { index: number; count: number } }
  | { kind: 'choice'; prompt?: string; options: readonly ChoiceOption[] }
  | { kind: 'inn'; price: number; coins: number };

type Props = {
  talk: Talk;
  leaving?: boolean;
  onAdvance: () => void;
  onChoose: (index: number) => void;
  onInn: (yes: boolean) => void;
};

/** The talk box over the world (and over the 路線圖): a line to read, a choice to make, or the inn's question. */
export const TalkBox = ({ talk, leaving = false, onAdvance, onChoose, onInn }: Props) => {
  if (talk.kind === 'line') {
    const who = speakerOf(talk.line.who);
    return (
      <DialogueBox
        text={talk.line.text}
        lineId={talk.line}
        speaker={who}
        portrait={who ? <Bust sprite={who.sprite} expr={talk.line.expr} /> : null}
        page={talk.page}
        leaving={leaving}
        onAdvance={onAdvance}
      />
    );
  }

  if (talk.kind === 'choice') {
    return (
      <DialogueBox
        text={talk.prompt ?? '選一個吧。'}
        lineId={talk.options}
        leaving={leaving}
        actions={talk.options.map((option, index) => (
          // All the same weight: a quiz must not hint which answer is right
          <Button key={index} full size="lg" variant="secondary" onClick={() => onChoose(index)}>
            {option.label}
          </Button>
        ))}
      />
    );
  }

  return (
    <DialogueBox
      text={UI.innAsk(talk.price, talk.coins)}
      leaving={leaving}
      actions={
        <span className="grid grid-cols-2 gap-2">
          <Button full size="lg" onClick={() => onInn(true)}>
            好，睡一下
          </Button>
          <Button full size="lg" variant="secondary" onClick={() => onInn(false)}>
            不用了
          </Button>
        </span>
      }
    />
  );
};

/** Line `at` of a scene, as a page of its run of consecutive lines (for the dialogue's page dots). */
export function linePage(steps: readonly unknown[], at: number): { index: number; count: number } {
  const isLine = (step: unknown) => typeof step === 'object' && step !== null && 'text' in step;
  let start = at;
  while (start > 0 && isLine(steps[start - 1])) start -= 1;
  let end = at;
  while (end + 1 < steps.length && isLine(steps[end + 1])) end += 1;
  return { index: at - start, count: end - start + 1 };
}
