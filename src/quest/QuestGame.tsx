import { useEffect, useReducer } from 'react';
import { unlockAudio } from '../shared/audio';
import { CHAPTERS, PROLOGUE } from './engine/chapters';
import { initialState, questReducer } from './engine/quest';
import { loadQuest, saveQuest } from './engine/save';
import { validateQuestContent } from './engine/validate';
import { BattleScreen } from './screens/BattleScreen';
import { CampScreen } from './screens/CampScreen';
import { ChapterScreen } from './screens/ChapterScreen';
import { DefeatScreen } from './screens/DefeatScreen';
import { QuestEndingScreen } from './screens/QuestEndingScreen';
import { QuestStoryScreen } from './screens/QuestStoryScreen';
import { QuestTitleScreen } from './screens/QuestTitleScreen';
import { VictoryScreen } from './screens/VictoryScreen';

// Content mistakes (unknown foe, empty chapter, skill unlock past max level) fail loudly in development
if (import.meta.env.DEV) {
  const errors = validateQuestContent();
  if (errors.length > 0) throw new Error(`Invalid quest content:\n${errors.join('\n')}`);
}

type Props = { onExit: () => void };

/** 寶咖咖勇者團: the run state machine lives in engine/quest.ts, battles in engine/battle.ts. */
export const QuestGame = ({ onExit }: Props) => {
  const [state, dispatch] = useReducer(questReducer, undefined, () => {
    const saved = loadQuest();
    return initialState(saved.run, saved.sound);
  });
  const { view, run, sound } = state;

  useEffect(() => {
    saveQuest({ run, sound });
  }, [run, sound]);

  const chapter = CHAPTERS[run.chapter - 1];

  switch (view.screen) {
    case 'title':
      return (
        <QuestTitleScreen
          run={run}
          onNew={() => {
            unlockAudio(); // iOS only unlocks audio inside a user gesture
            dispatch({ type: 'newGame' });
          }}
          onContinue={() => {
            unlockAudio();
            dispatch({ type: 'continue' });
          }}
          onExit={onExit}
        />
      );

    case 'story': {
      const isPrologue = view.kind === 'prologue';
      const told = CHAPTERS[view.chapter - 1];
      return (
        <QuestStoryScreen
          heading={isPrologue ? '故事開始' : `第 ${told.id} 章完成！`}
          title={isPrologue ? '安撫娃娃不見了' : told.title}
          text={isPrologue ? PROLOGUE : told.story}
          buttonLabel={isPrologue ? '出發' : view.chapter >= CHAPTERS.length ? '看結局' : '下一章'}
          onContinue={() => dispatch({ type: 'storyContinue' })}
        />
      );
    }

    case 'chapter':
      return (
        <ChapterScreen
          chapter={chapter}
          run={run}
          soundOn={sound}
          onBegin={() => dispatch({ type: 'beginNode', seed: Date.now() })}
          onToggleSound={() => dispatch({ type: 'toggleSound' })}
          onBackToTitle={() => dispatch({ type: 'backToTitle' })}
        />
      );

    case 'battle':
      return (
        <BattleScreen
          chapter={chapter}
          battle={view.battle}
          soundOn={sound}
          onAction={(action) => dispatch({ type: 'battle', action })}
          onWon={() => dispatch({ type: 'battleWon' })}
          onLost={() => dispatch({ type: 'battleLost' })}
          onToggleSound={() => dispatch({ type: 'toggleSound' })}
        />
      );

    case 'camp':
      return (
        <CampScreen
          run={run}
          result={view.result}
          onChoose={(choice) => dispatch({ type: 'camp', choice })}
          onContinue={() => dispatch({ type: 'campContinue' })}
        />
      );

    case 'victory':
      return (
        <VictoryScreen
          summary={view.summary}
          soundOn={sound}
          onContinue={() => dispatch({ type: 'victoryContinue' })}
        />
      );

    case 'defeat':
      return <DefeatScreen onRetry={() => dispatch({ type: 'retry' })} />;

    case 'ending':
      return <QuestEndingScreen onContinue={() => dispatch({ type: 'endingContinue' })} />;
  }
};
