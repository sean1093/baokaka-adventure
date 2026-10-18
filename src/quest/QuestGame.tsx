import { useEffect, useReducer, useState } from 'react';
import { stopMusic, playMusic } from '../shared/audio';
import { MAPS } from './engine/maps';
import { initialState, questReducer } from './engine/quest';
import { discardLegacyQuest, loadQuest, saveQuest } from './engine/save';
import { progressWarnings, validateQuestContent } from './engine/validate';
import { QuestScreens } from './QuestScreens';

// Content mistakes (unknown foe, unreachable chest, missing event) fail loudly in development
if (import.meta.env.DEV) {
  const errors = validateQuestContent();
  if (errors.length > 0) throw new Error(`Invalid quest content:\n${errors.join('\n')}`);
  // Side quests, collections and the item catalogue run ahead of the chapters that place them; listed, not fatal yet
  const warnings = progressWarnings();
  if (warnings.length > 0) console.warn(`Quest content: ${warnings.length} flags or items are not placed by any content yet\n${warnings.join('\n')}`);
}

/** The RPG: the run state machine lives in engine/quest.ts, battles in engine/battle.ts. */
export const QuestGame = () => {
  // Read storage once: the reducer, the settings and the old-save notice all start from this load
  const [loaded] = useState(() => loadQuest());
  const [state, dispatch] = useReducer(questReducer, undefined, () => initialState(loaded.save.run, loaded.save.sound, loaded.save.settings));
  // The old key is deleted right after mount, so the notice lives in memory only and shows once
  const [legacyNotice, setLegacyNotice] = useState(loaded.legacyReset);
  const { view, run, sound, settings } = state;

  useEffect(() => {
    if (loaded.legacyReset) discardLegacyQuest();
  }, [loaded]);

  useEffect(() => {
    saveQuest({ run, sound, settings });
  }, [run, sound, settings]);

  // One theme per place; battles get their own. Silence when muted or on the title.
  useEffect(() => {
    if (!sound) {
      stopMusic();
      return;
    }
    if (view.screen === 'battle') playMusic(view.battle.boss ? 'boss' : 'battle');
    else if (view.screen === 'world' || view.screen === 'shop' || view.screen === 'travel') playMusic(MAPS[run.map].palette === 'night' ? 'night' : 'field');
    else if (view.screen === 'ending') playMusic('ending');
    else stopMusic();
  }, [view.screen, view.screen === 'battle' ? view.battle.boss : false, run.map, sound]);

  useEffect(() => () => stopMusic(), []);

  return (
    <QuestScreens state={state} dispatch={dispatch} legacyNotice={legacyNotice} onDismissNotice={() => setLegacyNotice(false)} />
  );
};
