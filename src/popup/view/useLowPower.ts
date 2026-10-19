import { useEffect, useState } from 'react';
import { FrameWatch } from '../game/settings';

/**
 * Low power (popup art bible § 9.3; #104): watches the frame rate with one rAF callback a frame
 * and turns on, for the rest of the session, once frames have stayed over 20 ms for 2 s
 * (`FrameWatch`). Then the shell drops the tilt and the confetti and halves the sparkles. Off
 * (and not watching) while `enabled` is false, e.g. in a screenshot still.
 */
export function useLowPower(enabled: boolean): boolean {
  const [low, setLow] = useState(false);
  useEffect(() => {
    if (!enabled || low || typeof requestAnimationFrame === 'undefined') return undefined;
    const watch = new FrameWatch();
    let last = -1;
    let raf = 0;
    const frame = (now: number) => {
      if (last >= 0 && watch.push(now - last)) {
        setLow(true);
        return;
      }
      last = now;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [enabled, low]);
  return low;
}
