import { describe, expect, test } from 'vitest';
import { e, line, page } from '../core/fixtures/toy';
import { pageById } from '../pages';
import { FAST_FORWARD, PageSession, RESUME_GRACE_MS, TICK_MS, fastForward, pathEdgesLeft, type Clock } from './session';

/**
 * The session clock (#89): ticks at the chosen speed, pause by reason with a frozen `elapsed()`,
 * the 150 ms resume grace, 4× fast-forward on long walks, queued inputs, and a stop at `done`.
 * Driven by a hand-cranked clock.
 */

/** A fake clock: `advance(ms)` runs due timers in time order. */
function fakeClock() {
  let now = 0;
  let seq = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  const clock: Clock = {
    now: () => now,
    setTimeout: (fn, ms) => {
      const id = ++seq;
      timers.set(id, { at: now + Math.max(0, ms), fn });
      return id;
    },
    clearTimeout: (h) => void timers.delete(h as number),
  };
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const next = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      timers.delete(next[0]);
      now = next[1].at;
      next[1].fn();
    }
    now = end;
  };
  return { clock, advance };
}

const c1p2 = pageById('c1p2')!;

describe('PageSession clock', () => {
  test('ticks once per tick length at each speed', () => {
    for (const speed of ['slow', 'normal', 'fast'] as const) {
      const { clock, advance } = fakeClock();
      const s = new PageSession(c1p2, { clock, speed });
      s.start();
      advance(TICK_MS[speed] - 1);
      expect(s.frame().state.tick).toBe(0);
      advance(1);
      expect(s.frame().state.tick).toBe(1);
      advance(TICK_MS[speed] * 3);
      expect(s.frame().state.tick).toBe(4);
    }
    expect(TICK_MS).toEqual({ slow: 750, normal: 500, fast: 330 });
  });

  test('frames carry the previous state and the events; subscribers hear every tick', () => {
    const { clock, advance } = fakeClock();
    const s = new PageSession(c1p2, { clock });
    const seen: number[] = [];
    s.subscribe((f) => seen.push(f.state.tick));
    s.start();
    advance(1000);
    const f = s.frame();
    expect(seen).toEqual([1, 2]);
    expect(f.prev.tick).toBe(1);
    expect(f.prev.baby.node).toBe('L2');
    expect(f.state.baby.node).toBe('L3');
    expect(f.events.some((ev) => ev.type === 'babyEnter')).toBe(true);
  });

  test('pause freezes elapsed and the ticks; resume waits the 150 ms grace', () => {
    const { clock, advance } = fakeClock();
    const s = new PageSession(c1p2, { clock });
    s.start();
    advance(200);
    expect(s.elapsed()).toBe(200);
    s.pause('finger');
    expect(s.paused).toBe(true);
    advance(5000);
    expect(s.elapsed()).toBe(200);
    expect(s.frame().state.tick).toBe(0);
    s.resume('finger');
    advance(RESUME_GRACE_MS - 1);
    expect(s.paused).toBe(true);
    expect(s.elapsed()).toBe(200);
    const heard: number[] = [];
    s.subscribe((f) => heard.push(f.serial));
    advance(1);
    expect(s.paused).toBe(false);
    // Subscribers hear the clock run again (same frame), so a sleeping view wakes
    expect(heard).toEqual([0]);
    // The rest of the tick (300 ms) runs, then the tick lands
    advance(299);
    expect(s.frame().state.tick).toBe(0);
    advance(1);
    expect(s.frame().state.tick).toBe(1);
    expect(s.elapsed()).toBe(0);
  });

  test('pause reasons stack: the clock waits for the last one to lift', () => {
    const { clock, advance } = fakeClock();
    const s = new PageSession(c1p2, { clock });
    s.start();
    s.pause('finger');
    s.pause('menu');
    expect(s.pauseReasons()).toEqual(['finger', 'menu']);
    s.resume('finger');
    advance(RESUME_GRACE_MS + 10);
    expect(s.paused).toBe(true);
    s.resume('menu');
    advance(RESUME_GRACE_MS);
    expect(s.paused).toBe(false);
    // A pause during the grace cancels it
    s.pause('finger');
    s.resume('finger');
    advance(100);
    s.pause('finger');
    advance(1000);
    expect(s.paused).toBe(true);
  });

  test('queued inputs apply one per tick, in order', () => {
    const { clock, advance } = fakeClock();
    const s = new PageSession(c1p2, { clock });
    s.input({ t: 'set', part: 'train', to: 'half' });
    s.input({ t: 'mocha', perch: 'pillar' });
    s.start();
    advance(500);
    expect(s.frame().state.parts.train).toBe('half');
    expect(s.frame().state.mocha.perch).toBe('bench');
    advance(500);
    expect(s.frame().state.mocha.perch).toBe('pillar'); // one jump: he lands the same tick
  });

  test('the clock stops at done and only keeps time for the last frame', () => {
    const { clock, advance } = fakeClock();
    const toy = page({ ...line('AB'), attractors: [{ id: 'bead', kind: 'shiny', node: 'B', goal: true }] });
    const s = new PageSession(toy, { clock });
    s.start();
    advance(500);
    expect(s.frame().state.done).toBe(true);
    const tick = s.frame().state.tick;
    advance(5000);
    expect(s.frame().state.tick).toBe(tick);
    expect(s.elapsed()).toBe(5000);
  });

  test('reset goes back to the start state', () => {
    const { clock, advance } = fakeClock();
    const s = new PageSession(c1p2, { clock });
    s.start();
    advance(1500);
    s.reset();
    expect(s.frame().state.tick).toBe(0);
    expect(s.frame().prev).toBe(s.frame().state);
    advance(500);
    expect(s.frame().state.tick).toBe(1);
  });
});

describe('fast-forward on long walks', () => {
  // Eight nodes in a row, the bead at the far end: seven edges to crawl
  const long = page({ ...line('ABCDEFGH'), attractors: [{ id: 'bead', kind: 'shiny', node: 'H', goal: true }] });

  test('more than 4 edges left on his path → 4× faster ticks; 4 or fewer → normal', () => {
    const { clock, advance } = fakeClock();
    const s = new PageSession(long, { clock });
    s.start();
    advance(500); // tick 1: he chooses the bead and steps to B (6 edges left)
    expect(pathEdgesLeft(long, s.frame().state)).toBe(6);
    expect(s.frame().tickMs).toBe(500 / FAST_FORWARD);
    advance(125); // C: 5 left
    expect(s.frame().tickMs).toBe(125);
    advance(125); // D: 4 left
    expect(pathEdgesLeft(long, s.frame().state)).toBe(4);
    expect(s.frame().tickMs).toBe(500);
  });

  test('a queued input ends the fast-forward at once', () => {
    const { clock, advance } = fakeClock();
    const s = new PageSession(long, { clock });
    s.start();
    advance(500);
    expect(s.frame().tickMs).toBe(125);
    s.input({ t: 'none' });
    expect(s.frame().tickMs).toBe(500);
    expect(fastForward(long, s.frame().state, 1)).toBe(false);
  });

  test('no path, no target or not moving → no fast-forward', () => {
    const gap = page({ nodes: line('ABCDEFG').nodes, edges: [e('A', 'B')], attractors: [{ id: 'bead', kind: 'shiny', node: 'G', goal: true }] });
    const { clock, advance } = fakeClock();
    const s = new PageSession(gap, { clock });
    s.start();
    advance(2000);
    expect(pathEdgesLeft(gap, s.frame().state)).toBe(0);
    expect(s.frame().tickMs).toBe(500);
  });
});
