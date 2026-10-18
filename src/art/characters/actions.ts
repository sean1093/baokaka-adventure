import type { FxAccent, FxKind } from '../../quest/engine/types';

/**
 * Which pose a hero acts out for a move (art direction § 5.1, § 5.2), from what the move looks like
 * (its FX kind and accent, carried on the battle's `act` event). Sprites that don't know the pose
 * draw their default and play the generic attack lunge.
 *
 *   寶咖咖: 丟積木 / 攻擊 (blocks) → throw · 哇哇大哭 (cry) → cry · 拍拍手 (clap) → clap ·
 *           勇敢的第一步 (stomp) → firstStep
 *   摩卡貓: claws (攻擊, 喵喵連環爪, 貓草狂歡) → pounce
 */
export function actionPose(fx: FxKind | null, accent?: FxAccent): string | undefined {
  if (accent === 'stomp') return 'firstStep';
  if (accent === 'clap') return 'clap';
  if (fx === 'blocks') return 'throw';
  if (fx === 'cry') return 'cry';
  if (fx === 'claw') return 'pounce';
  return undefined;
}
