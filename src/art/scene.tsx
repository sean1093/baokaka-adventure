import { createContext, useContext } from 'react';
import { GLOW, MATERIALS, RIM, gradeCharacter, skyAt, type MaterialTokens } from './palette';

/**
 * The light a scene casts on its characters (art direction § 2.4, § 3.2): the rim colour (the
 * CSS variable `--rim` that `Fig` strokes with) and the half-strength night grade on character
 * materials. A map provides its clock through `SceneClock`; sprites that paint with
 * `useCharacterTokens()` pick up the grade, and every rim stroke picks up `--rim`.
 */

/** The rim on characters at a clock time: neon maps tint it pink (§ 4.3), "local" hours take the lamps' warm rim. */
export function sceneRim(time: string, neon = false): string {
  if (neon) return GLOW.neonPink;
  const sky = skyAt(time);
  return sky.localRim ? RIM.lamp : sky.rim;
}

/** The clock of the scene being drawn; `null` outside any map (menus, the art lab's sheets). */
export const SceneClock = createContext<string | null>(null);

/** Character materials for the current scene: half-graded on a map, as authored elsewhere. */
export function useCharacterTokens(): MaterialTokens {
  const time = useContext(SceneClock);
  return time ? gradeCharacter(time) : (MATERIALS as unknown as MaterialTokens);
}
