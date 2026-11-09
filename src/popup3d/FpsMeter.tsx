import { useEffect, useRef } from 'react';
import type { Stage3D } from './stage';

/**
 * The on-screen frame meter (`&fps=1`, #225): frames per second and frame times over the last
 * second (mean and worst), draw calls, triangles and texture memory. For the owner to measure the
 * 3D page on a real phone; it writes its text directly (no re-render a frame).
 */
export function FpsMeter({ bind }: { readonly bind: (fn: (now: number, stage: Stage3D) => void) => void }) {
  const el = useRef<HTMLPreElement>(null);
  useEffect(() => {
    let last = 0;
    let since = 0;
    const times: number[] = [];
    bind((now, stage) => {
      if (last !== 0) times.push(now - last);
      last = now;
      if (since === 0) since = now;
      if (now - since < 1000 || el.current === null) return;
      const n = times.length;
      const mean = times.reduce((a, b) => a + b, 0) / Math.max(1, n);
      const worst = Math.max(0, ...times);
      const s = stage.stats();
      el.current.textContent = `${((n * 1000) / (now - since)).toFixed(0)} fps\n${mean.toFixed(1)} ms · max ${worst.toFixed(0)}\n${s.calls} calls · ${(s.triangles / 1000).toFixed(1)}k tris\ntex ${s.textureMB} MB · js ${s.updateMs.p50}+${s.renderMs.p50} ms`;
      times.length = 0;
      since = now;
    });
  }, [bind]);
  return <pre ref={el} className="p3d-fps" data-fps="" aria-hidden="true">…</pre>;
}
