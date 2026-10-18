import { useState, type Dispatch } from 'react';
import { unlockAudio } from '../shared/audio';
import { MAPS } from './engine/maps';
import type { Follower } from './engine/progress';
import type { QuestAction, QuestState } from './engine/quest';
import { BattleScreen } from './screens/BattleScreen';
import { DefeatScreen } from './screens/DefeatScreen';
import { PartySheet } from './screens/PartySheet';
import { QuestEndingScreen } from './screens/QuestEndingScreen';
import { QuestTitleScreen } from './screens/QuestTitleScreen';
import { ShopScreen } from './screens/ShopScreen';
import { VictoryScreen } from './screens/VictoryScreen';
import { WorldScreen } from './screens/WorldScreen';

type Props = {
  state: QuestState;
  dispatch: Dispatch<QuestAction>;
  /** An old-story save was just discarded: the title explains the fresh start */
  legacyNotice?: boolean;
  onDismissNotice?: () => void;
  /** Open the party sheet on mount (the art lab's menu fixture) */
  menuOpen?: boolean;
  /** Escort table override (the art lab's follower fixture); defaults to the content's FOLLOWERS */
  followers?: readonly Follower[];
};

/**
 * The screen for the current view, wired to the reducer. No storage and no music: QuestGame adds
 * those, and the art lab renders this same component over fixture states, so its screenshots
 * always show the real wiring.
 */
export const QuestScreens = ({ state, dispatch, legacyNotice = false, onDismissNotice = () => {}, menuOpen: openOnMount = false, followers }: Props) => {
  const [menuOpen, setMenuOpen] = useState(openOnMount);
  const { view, run, sound } = state;

  switch (view.screen) {
    case 'title':
      return (
        <QuestTitleScreen
          run={run}
          legacyNotice={legacyNotice}
          onDismissNotice={onDismissNotice}
          onNew={() => {
            unlockAudio();
            dispatch({ type: 'newGame', seed: Date.now() | 0 });
          }}
          onContinue={() => {
            unlockAudio();
            dispatch({ type: 'continue' });
          }}
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
            onChoose={(index) => dispatch({ type: 'choose', index })}
            onMenu={() => setMenuOpen(true)}
            onExit={() => dispatch({ type: 'backToTitle' })}
            followers={followers}
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
