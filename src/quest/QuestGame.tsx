import { useEffect, useReducer, useState } from 'react';
import { stopMusic, playMusic, unlockAudio } from '../shared/audio';
import { MAPS } from './engine/maps';
import { initialState, questReducer } from './engine/quest';
import { loadQuest, saveQuest } from './engine/save';
import { validateQuestContent } from './engine/validate';
import { BattleScreen } from './screens/BattleScreen';
import { DefeatScreen } from './screens/DefeatScreen';
import { PartySheet } from './screens/PartySheet';
import { QuestEndingScreen } from './screens/QuestEndingScreen';
import { QuestTitleScreen } from './screens/QuestTitleScreen';
import { ShopScreen } from './screens/ShopScreen';
import { VictoryScreen } from './screens/VictoryScreen';
import { WorldScreen } from './screens/WorldScreen';

// Content mistakes (unknown foe, unreachable chest, missing event) fail loudly in development
if (import.meta.env.DEV) {
  const errors = validateQuestContent();
  if (errors.length > 0) throw new Error(`Invalid quest content:\n${errors.join('\n')}`);
}

type Props = { onExit: () => void };

/** 寶咖咖奇俠傳: the run state machine lives in engine/quest.ts, battles in engine/battle.ts. */
export const QuestGame = ({ onExit }: Props) => {
  const [state, dispatch] = useReducer(questReducer, undefined, () => {
    const saved = loadQuest();
    return initialState(saved.run, saved.sound);
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const { view, run, sound } = state;

  useEffect(() => {
    saveQuest({ run, sound });
  }, [run, sound]);

  // One theme per place; battles get their own. Silence when muted or on the title.
  useEffect(() => {
    if (!sound) {
      stopMusic();
      return;
    }
    if (view.screen === 'battle') playMusic(view.battle.boss ? 'boss' : 'battle');
    else if (view.screen === 'world' || view.screen === 'shop') playMusic(MAPS[run.map].palette === 'night' ? 'night' : 'field');
    else if (view.screen === 'ending') playMusic('ending');
    else stopMusic();
  }, [view.screen, view.screen === 'battle' ? view.battle.boss : false, run.map, sound]);

  useEffect(() => () => stopMusic(), []);

  const leave = () => {
    stopMusic();
    onExit();
  };

  switch (view.screen) {
    case 'title':
      return (
        <QuestTitleScreen
          run={run}
          onNew={() => {
            unlockAudio();
            dispatch({ type: 'newGame', seed: Date.now() | 0 });
          }}
          onContinue={() => {
            unlockAudio();
            dispatch({ type: 'continue' });
          }}
          onExit={leave}
        />
      );

    case 'world':
      return (
        <>
          <WorldScreen
            state={state}
            onStep={(tile, facing) => dispatch({ type: 'step', tile, facing })}
            onInteract={(id) => dispatch({ type: 'interact', id })}
            onAdvance={() => dispatch({ type: 'advance' })}
            onInn={(yes) => dispatch({ type: 'innAnswer', yes })}
            onMenu={() => setMenuOpen(true)}
            onExit={() => dispatch({ type: 'backToTitle' })}
          />
          <PartySheet
            open={menuOpen}
            run={run}
            onClose={() => setMenuOpen(false)}
            onUseItem={(item, hero) => dispatch({ type: 'useItem', item, hero })}
            onEquip={(item, hero) => dispatch({ type: 'equip', item, hero })}
          />
        </>
      );

    case 'battle':
      return (
        <BattleScreen
          battle={view.battle}
          palette={MAPS[run.map].palette}
          soundOn={sound}
          onAction={(action) => dispatch({ type: 'battle', action })}
          onEnd={() => dispatch({ type: 'battleEnd' })}
          onToggleSound={() => dispatch({ type: 'toggleSound' })}
        />
      );

    case 'victory':
      return <VictoryScreen summary={view.summary} soundOn={sound} onContinue={() => dispatch({ type: 'victoryContinue' })} />;

    case 'defeat':
      return <DefeatScreen soundOn={sound} onRetry={() => dispatch({ type: 'retry' })} />;

    case 'shop':
      return (
        <ShopScreen
          stock={view.stock}
          run={run}
          onBuy={(item) => dispatch({ type: 'buy', item })}
          onClose={() => dispatch({ type: 'closeShop' })}
        />
      );

    case 'ending':
      return <QuestEndingScreen run={run} soundOn={sound} onContinue={() => dispatch({ type: 'endingContinue' })} />;
  }
};
