import { useEffect, useMemo, useState } from 'react';
import { FrameWatch } from '../game/settings';

/**
 * Low power (popup art bible § 9.3; #104): watches the frame rate with one rAF callback a frame
 * and turns on once frames have stayed over 20 ms for 2 s (`FrameWatch`). Then the shell drops the
 * tilt and the confetti and halves the sparkles. It turns off again after 10 s of smooth frames,
 * once a session (#136); after that it stays on and the watching stops. Off (and not watching)
 * while `enabled` is false, e.g. in a screenshot still.
 */
export function useLowPower(enabled: boolean): boolean {
  const [low, setLow] = useState(false);
  const watch = useMemo(() => new FrameWatch(), []);
  useEffect(() => {
    if (!enabled || typeof requestAnimationFrame === 'undefined') return undefined;
    let last = -1;
    let raf = 0;
    let was = watch.low;
    const frame = (now: number) => {
      if (last >= 0 && watch.push(now - last) !== was) {
        was = watch.low;
        setLow(was);
      }
      // On for good: nothing more to watch
      if (watch.latched) return;
      last = now;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [enabled, watch]);
  return low;
}
