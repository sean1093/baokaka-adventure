import type { Run } from './types';

/**
 * Fills placeholders in a script line before it is shown. Every `Line.text` (and a choice's
 * prompt) passes through here in `runScene`, so content can say 「下一站，{station}」 once the
 * 月亮線 lands. For now there is nothing to fill: issue #9 adds `{station}`, `{stationTw}` and
 * `{stationEn}`. Pure, like the rest of the engine.
 */
export function substitute(text: string, _run: Run): string {
  return text;
}
