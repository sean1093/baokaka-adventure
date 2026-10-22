import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS, ProgressStore, freshSave, isStoredSave, encodeSave, loadSave, updateSettings, type Settings } from './progress';
import { BIG_TEXT_SCALE, ELDER, FrameWatch, HAPTICS, LOW_POWER, effectiveSettings, elderPatch, heldByElder, pulse } from './settings';
import { registry } from '../pages';
import type { StorageLike } from '../../shared/storage';

/** GDD § 2.11 settings (#104, D-67): 長輩模式's derivation and restore, the reducer, low power, 震動. */

const OS = { osReduced: false };
const settings = (patch: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...patch });

function memoryStorage(): StorageLike & { cells: Record<string, string> } {
  const cells: Record<string, string> = {};
  return {
    cells,
    getItem: (k) => (k in cells ? cells[k] : null),
    setItem: (k, v) => void (cells[k] = v),
    removeItem: (k) => void delete cells[k],
  };
}

describe('長輩模式 derivation', () => {
  test('off: the player\'s own settings, as chosen', () => {
    const e = effectiveSettings(settings({ speed: 2, bigText: false, autoHint: 0 }), OS);
    expect(e).toMatchObject({ speed: 2, bigText: false, textScale: 1, autoHint: 0, elder: false });
  });

  test.each<[string, Partial<Settings>]>([
    ['the defaults', {}],
    ['fast, small text, no hints', { speed: 2, bigText: false, autoHint: 0 }],
    ['normal, big text, 30 s', { speed: 1, bigText: true, autoHint: 30 }],
  ])('on over %s: 慢, 大字, 15 秒, plus the elder extras', (_, own) => {
    const e = effectiveSettings(settings({ ...own, elder: true }), OS);
    expect(e).toMatchObject({ speed: ELDER.speed, bigText: true, textScale: BIG_TEXT_SCALE, autoHint: 15, elder: true });
    expect(ELDER).toEqual({ speed: 0, bigText: true, autoHint: 15 });
  });

  test('on: the other settings stay the player\'s', () => {
    const own = settings({ sfx: 30, music: 10, vibrate: false, leftHand: true, reduceMotion: true });
    expect(effectiveSettings({ ...own, elder: true }, OS)).toMatchObject({ sfx: 30, music: 10, vibrate: false, leftHand: true, reduceMotion: true });
  });

  test('大字 scales text by 25 %: the 20 px floor becomes 25 px (R5 asks ≥ 24)', () => {
    expect(20 * BIG_TEXT_SCALE).toBeGreaterThanOrEqual(24);
    expect(effectiveSettings(settings({ bigText: true }), OS).textScale).toBe(1.25);
  });

  test('turning it off restores exactly the settings the player had', () => {
    const own = { speed: 2, bigText: false, autoHint: 0 } as const;
    let save = updateSettings(freshSave(registry), own);
    const before = effectiveSettings(save.settings, OS);
    save = updateSettings(save, { elder: true });
    expect(effectiveSettings(save.settings, OS)).toMatchObject({ speed: 0, bigText: true, autoHint: 15 });
    // The stored choices are untouched while it is on
    expect(save.settings).toMatchObject(own);
    save = updateSettings(save, { elder: false });
    expect(effectiveSettings(save.settings, OS)).toEqual(before);
  });

  test('while on, changes to the settings it holds are dropped; the rest apply', () => {
    let save = updateSettings(freshSave(registry), { speed: 2, elder: true });
    const held = updateSettings(save, { speed: 1, bigText: false, autoHint: 30 });
    expect(held).toBe(save);
    save = updateSettings(save, { speed: 1, sfx: 20, leftHand: true });
    expect(save.settings).toMatchObject({ speed: 2, sfx: 20, leftHand: true, elder: true });
    // Turning it off in the same patch lets the held settings through
    save = updateSettings(save, { elder: false, speed: 1 });
    expect(save.settings).toMatchObject({ speed: 1, elder: false });
  });

  test('elderPatch and heldByElder', () => {
    expect(elderPatch(settings(), { speed: 2 })).toEqual({ speed: 2 });
    expect(elderPatch(settings({ elder: true }), { speed: 2, music: 4 })).toEqual({ music: 4 });
    expect(elderPatch(settings({ elder: true }), { speed: 2, elder: false })).toEqual({ speed: 2, elder: false });
    expect(heldByElder(settings({ elder: true }), 'bigText')).toBe(true);
    expect(heldByElder(settings({ elder: true }), 'vibrate')).toBe(false);
    expect(heldByElder(settings(), 'speed')).toBe(false);
  });

  test('persists through the store and a reload; reset keeps it (D-55)', () => {
    const storage = memoryStorage();
    const store = new ProgressStore({ storage, visibility: null });
    store.updateSettings({ speed: 2 });
    store.updateSettings({ elder: true });
    store.reset();
    const again = new ProgressStore({ storage, visibility: null });
    expect(again.get().settings).toMatchObject({ speed: 2, elder: true });
    again.updateSettings({ elder: false });
    expect(effectiveSettings(again.get().settings, OS).speed).toBe(2);
  });
});

describe('減少動態, the gyro tilt and low power', () => {
  test('減少動態 follows the system until set', () => {
    expect(effectiveSettings(settings(), { osReduced: true }).reduceMotion).toBe(true);
    expect(effectiveSettings(settings(), { osReduced: false }).reduceMotion).toBe(false);
    expect(effectiveSettings(settings({ reduceMotion: false }), { osReduced: true }).reduceMotion).toBe(false);
    expect(effectiveSettings(settings({ reduceMotion: true }), { osReduced: false }).reduceMotion).toBe(true);
  });

  test('the tilt: off by default; on only when asked, and never in 長輩模式, reduced motion or low power', () => {
    expect(effectiveSettings(settings(), OS).tilt).toBe(false);
    expect(effectiveSettings(settings({ tilt: true }), OS).tilt).toBe(true);
    expect(effectiveSettings(settings({ tilt: true, elder: true }), OS).tilt).toBe(false);
    expect(effectiveSettings(settings({ tilt: true }), { osReduced: true }).tilt).toBe(false);
    expect(effectiveSettings(settings({ tilt: true }), { osReduced: false, lowPower: true }).tilt).toBe(false);
  });

  test('a save from before #104 (no tilt) still loads', () => {
    const storage = memoryStorage();
    const { tilt: _tilt, ...old } = DEFAULT_SETTINGS;
    const stored = { ...encodeSave(freshSave(registry)), settings: { ...old, speed: 2 } };
    expect(isStoredSave(stored)).toBe(true);
    storage.setItem('popup.save.v1', JSON.stringify(stored));
    expect(loadSave(storage, registry).settings.speed).toBe(2);
    expect(isStoredSave({ ...stored, settings: { ...old, tilt: 'yes' } })).toBe(false);
  });

  const feed = (watch: FrameWatch, dt: number, ms: number) => {
    let on = false;
    for (let t = 0; t < ms; t += dt) on = watch.push(dt);
    return on;
  };

  test('low power latches after 2 s of frames over 20 ms', () => {
    const watch = new FrameWatch();
    expect(feed(watch, 25, LOW_POWER.windowMs - 50)).toBe(false);
    expect(feed(watch, 25, 100)).toBe(true);
    // It stays on
    expect(feed(watch, 16, 5000)).toBe(true);
    expect(watch.low).toBe(true);
  });

  test('smooth frames, short stalls and gaps never latch it', () => {
    const watch = new FrameWatch();
    expect(feed(watch, 16.7, 10_000)).toBe(false);
    // A burst of slow frames shorter than the window, then smooth again
    expect(feed(watch, 40, 800)).toBe(false);
    expect(feed(watch, 16.7, 4000)).toBe(false);
    // Slow frames broken by a background-tab gap start over
    const gappy = new FrameWatch();
    for (let i = 0; i < 6; i++) {
      feed(gappy, 30, 1500);
      gappy.push(LOW_POWER.gapMs + 1);
    }
    expect(gappy.low).toBe(false);
    expect(gappy.push(Number.NaN)).toBe(false);
  });

  test('it recovers once after 10 s of smooth frames, and the second time stays on (#136)', () => {
    const watch = new FrameWatch();
    expect(feed(watch, 25, LOW_POWER.windowMs + 50)).toBe(true);
    // Smooth, but not for long enough yet
    expect(feed(watch, 16.7, LOW_POWER.recoverMs - 500)).toBe(true);
    expect(feed(watch, 16.7, 1000)).toBe(false);
    expect(watch.latched).toBe(false);
    // Still slow-ish with low power on: no recovery (frames over 17.5 ms on average)
    const edge = new FrameWatch();
    feed(edge, 25, LOW_POWER.windowMs + 50);
    expect(feed(edge, 18.5, 30_000)).toBe(true);
    // The second slowdown keeps it on for good
    expect(feed(watch, 25, LOW_POWER.windowMs + 50)).toBe(true);
    expect(watch.latched).toBe(true);
    expect(feed(watch, 16.7, 60_000)).toBe(true);
  });

  test('a stall while on does not end it early, and a gap starts the recovery over', () => {
    const watch = new FrameWatch();
    feed(watch, 25, LOW_POWER.windowMs + 50);
    feed(watch, 16.7, LOW_POWER.recoverMs - 2000);
    watch.push(LOW_POWER.gapMs + 1);
    expect(feed(watch, 16.7, LOW_POWER.recoverMs - 500)).toBe(true);
    expect(feed(watch, 16.7, 1000)).toBe(false);
  });

  test('mostly slow frames averaging over 20 ms latch; a mix averaging under does not', () => {
    const over = new FrameWatch();
    const under = new FrameWatch();
    for (let i = 0; i < 400; i++) {
      over.push(i % 4 === 0 ? 16 : 26);
      under.push(i % 2 === 0 ? 16 : 23);
    }
    expect(over.low).toBe(true);
    expect(under.low).toBe(false);
  });
});

describe('震動', () => {
  const fake = () => {
    const calls: (number | number[])[] = [];
    return { calls, vibrate: (p: number | number[]) => (calls.push(p), true) };
  };

  test('a short pulse on snap, push and sticker when on', () => {
    const device = fake();
    expect(pulse('snap', true, device)).toBe(true);
    expect(pulse('push', true, device)).toBe(true);
    expect(pulse('sticker', true, device)).toBe(true);
    expect(device.calls).toEqual([HAPTICS.snap, HAPTICS.push, [...(HAPTICS.sticker as number[])]]);
    // Short: no pulse over 60 ms
    for (const p of Object.values(HAPTICS)) for (const ms of [p].flat()) expect(ms).toBeLessThanOrEqual(60);
  });

  test('off, no device, or a throwing one: nothing, and no error', () => {
    const device = fake();
    expect(pulse('snap', false, device)).toBe(false);
    expect(device.calls).toEqual([]);
    expect(pulse('snap', true, null)).toBe(false);
    expect(pulse('snap', true, {})).toBe(false);
    expect(pulse('snap', true, { vibrate: () => { throw new Error('nope'); } })).toBe(false);
  });
});
