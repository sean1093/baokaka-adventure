import { useEffect, useState, type Dispatch, type ReactNode } from 'react';
import { REDUCE_MOTION_CLASS, ReducedMotionContext } from '../components/motion';
import { unlockAudio } from '../shared/audio';
import { mapClock } from './engine/clock';
import { MAPS } from './engine/maps';
import type { Follower } from './engine/progress';
import type { QuestAction, QuestState } from './engine/quest';
import { BattleScreen } from './screens/BattleScreen';
import { DefeatScreen } from './screens/DefeatScreen';
import { PartySheet, type SheetStart } from './screens/PartySheet';
import { QuestEndingScreen } from './screens/QuestEndingScreen';
import { QuestTitleScreen } from './screens/QuestTitleScreen';
import { ShopScreen } from './screens/ShopScreen';
import { TravelScreen } from './screens/TravelScreen';
import { VictoryScreen } from './screens/VictoryScreen';
import { WorldScreen } from './screens/WorldScreen';

type Props = {
  state: QuestState;
  dispatch: Dispatch<QuestAction>;
  /** An old-story save was just discarded: the title explains the fresh start */
  legacyNotice?: boolean;
  onDismissNotice?: () => void;
  /** Open the party sheet on mount (the art lab's menu fixtures), optionally on a tab with an item picked */
  menuOpen?: boolean | SheetStart;
  /** Escort table override (the art lab's follower fixture); defaults to the content's FOLLOWERS */
  followers?: readonly Follower[];
  /** The 路線圖's 「你在這裡」 station override (the art lab's travel fixture, until station maps exist) */
  travelHere?: string;
};

/**
 * The screen for the current view, wired to the reducer. No storage and no music: QuestGame adds
 * those, and the art lab renders this same component over fixture states, so its screenshots
 * always show the real wiring.
 */
export const QuestScreens = (props: Props) => {
  const reduced = props.state.settings.reducedMotion;

  // 減少動態 reaches CSS through a class on <html>, so portalled sheets follow it too
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(REDUCE_MOTION_CLASS, reduced);
    return () => root.classList.remove(REDUCE_MOTION_CLASS);
  }, [reduced]);

  return (
    <ReducedMotionContext.Provider value={reduced}>
      <CurrentScreen {...props} />
    </ReducedMotionContext.Provider>
  );
};

const CurrentScreen = ({ state, dispatch, legacyNotice = false, onDismissNotice = () => {}, menuOpen: openOnMount = false, followers, travelHere }: Props): ReactNode => {
  const [menuOpen, setMenuOpen] = useState(openOnMount !== false);
  const sheetStart = typeof openOnMount === 'object' ? openOnMount : undefined;
  const { view, run, sound, settings } = state;

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
            start={sheetStart}
            run={run}
            sound={sound}
            reducedMotion={settings.reducedMotion}
            onClose={() => setMenuOpen(false)}
            onUseItem={(item, hero) => dispatch({ type: 'useItem', item, hero })}
            onEquip={(item, hero) => dispatch({ type: 'equip', item, hero })}
            onToggleSound={() => dispatch({ type: 'toggleSound' })}
            onReducedMotion={(on) => dispatch({ type: 'setReducedMotion', on })}
          />
        </>
      );

    case 'battle':
      return (
        <BattleScreen
          battle={view.battle}
          palette={MAPS[run.map].palette}
          place={{ title: MAPS[run.map].title, time: mapClock(MAPS[run.map]) }}
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

    case 'travel':
      return (
        <TravelScreen
          run={run}
          fresh={view.fresh}
          note={view.note}
          skipRides={settings.skipRides}
          here={travelHere}
          onRide={(station) => dispatch({ type: 'ride', station })}
          onClose={() => dispatch({ type: 'closeTravel' })}
          onAdvance={() => dispatch({ type: 'advance' })}
          onSkipRides={(on) => dispatch({ type: 'setSkipRides', on })}
        />
      );

    case 'ending':
      return <QuestEndingScreen run={run} soundOn={sound} onContinue={() => dispatch({ type: 'endingContinue' })} />;
  }
};
