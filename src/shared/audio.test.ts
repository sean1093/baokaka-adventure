import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BAR,
  PENTATONIC,
  SFX_CUES,
  TRACKS,
  chapterTrack,
  motifVoices,
  pitch,
  playMusic,
  playSfx,
  playTone,
  playingMusic,
  resetAudioForTest,
  setVolumes,
  stepNotes,
  stopMusic,
  unlockAudio,
  voiceVoices,
  volumeGain,
} from './audio';

/** A fake AudioContext that records every source it starts: what, at which frequency, when. */
class FakeParam {
  value = 0;
  readonly calls: [string, number, number][] = [];
  setValueAtTime(v: number, t: number) {
    this.value = v;
    this.calls.push(['set', v, t]);
  }
  exponentialRampToValueAtTime(v: number, t: number) {
    this.value = v;
    this.calls.push(['exp', v, t]);
  }
  linearRampToValueAtTime(v: number, t: number) {
    this.value = v;
    this.calls.push(['lin', v, t]);
  }
  cancelScheduledValues() {}
}
class FakeNode {
  readonly gain = new FakeParam();
  readonly frequency = new FakeParam();
  readonly Q = new FakeParam();
  type = '';
  buffer: unknown = null;
  loop = false;
  out: FakeNode | null = null;
  constructor(
    readonly ctx: FakeContext,
    readonly kind: string,
  ) {}
  connect(n: FakeNode) {
    this.out = n;
    return n;
  }
  disconnect() {}
  start(at: number) {
    this.ctx.started.push({ kind: this.kind, at, f: this.frequency.calls[0]?.[1] ?? 0, node: this });
  }
  stop() {}
}
class FakeContext {
  currentTime = 0;
  state = 'running';
  sampleRate = 8000;
  readonly destination = new FakeNode(this, 'destination');
  readonly started: { kind: string; at: number; f: number; node: FakeNode }[] = [];
  createGain = () => new FakeNode(this, 'gain');
  createOscillator = () => new FakeNode(this, 'osc');
  createBiquadFilter = () => new FakeNode(this, 'filter');
  createBufferSource = () => new FakeNode(this, 'noise');
  createBuffer = (_c: number, length: number) => ({ getChannelData: () => new Float32Array(length) });
  resume = async () => {};
  suspend = async () => {};
}

/** The bus a source ends up on (follows its connections to the node before the destination). */
const busOf = (n: FakeNode): FakeNode => {
  let node = n;
  while (node.out !== null && node.out.kind !== 'destination') node = node.out;
  return node;
};

let ctx: FakeContext;
beforeEach(() => {
  resetAudioForTest();
  ctx = new FakeContext();
});
afterEach(() => {
  stopMusic();
  vi.useRealTimers();
});

describe('unlock and volumes', () => {
  it('makes nothing before a gesture unlocks it', () => {
    playSfx('click');
    playMusic('chapter0');
    expect(playingMusic()).toBeNull();
    expect(ctx.started).toHaveLength(0);
  });
  it('sound effects and music go to two buses', () => {
    unlockAudio(() => ctx as unknown as AudioContext);
    playSfx('click');
    const sfxBus = busOf(ctx.started[0].node);
    playMusic('chapter1');
    const musicBus = busOf(ctx.started[ctx.started.length - 1].node);
    expect(sfxBus).not.toBe(musicBus);
    setVolumes(80, 50);
    expect(sfxBus.gain.value).toBeCloseTo(volumeGain(80));
    expect(musicBus.gain.value).toBeCloseTo(volumeGain(50));
  });
  it('音效 0 is silent; the RPG still works', () => {
    unlockAudio(() => ctx as unknown as AudioContext);
    setVolumes(0, 50);
    playSfx('sparkle');
    expect(ctx.started).toHaveLength(0);
    setVolumes(100, 50);
    playTone('found', true);
    expect(ctx.started.map((s) => Math.round(s.f))).toEqual([523, 659]);
  });
  it('volumeGain is squared and clamped', () => {
    expect(volumeGain(0)).toBe(0);
    expect(volumeGain(50)).toBe(0.25);
    expect(volumeGain(150)).toBe(1);
  });
  it('a failing context leaves the game playable and silent', () => {
    expect(
      unlockAudio(() => {
        throw new Error('no audio');
      }),
    ).toBe(false);
    expect(() => playSfx('click')).not.toThrow();
  });
});

describe('cues', () => {
  it('every cue schedules sources from now, delayed and pitched as asked', () => {
    unlockAudio(() => ctx as unknown as AudioContext);
    for (const cue of SFX_CUES) {
      const before = ctx.started.length;
      playSfx(cue);
      expect(ctx.started.length, cue).toBeGreaterThan(before);
    }
    ctx.started.length = 0;
    ctx.currentTime = 10;
    playSfx('pop', { delay: 0.5, pitch: 2 });
    expect(ctx.started[0].at).toBeGreaterThanOrEqual(10.5);
    expect(ctx.started[0].f).toBe(1200);
  });
  it('word motifs: a chord sounds at once, a run in order', () => {
    const chord = motifVoices([0, 4, 7, 12], 'chord');
    expect(new Set(chord.map((v) => v.at ?? 0)).size).toBe(1);
    const run = motifVoices([12, 7], 'wave');
    expect(run.map((v) => v.at)).toEqual([0, 0.12]);
    expect(motifVoices([12, 14], 'whooshUp').some((v) => 'noise' in v)).toBe(true);
    expect(motifVoices([5, 0], 'stomp')[0].f).toBeLessThan(392);
  });
  it('voice blips: one per syllable, Mocha lower', () => {
    expect(voiceVoices(2)).toHaveLength(2);
    expect(voiceVoices(2, 0.6)[0].f).toBeLessThan(voiceVoices(2)[0].f);
  });
});

describe('the music box', () => {
  it('chapters 0–3 have their loops: 8–16 bars, pentatonic, bass on every bar', () => {
    expect(chapterTrack(0)).toBe('chapter0');
    expect(chapterTrack(1)).toBe('chapter1');
    expect(chapterTrack(2)).toBe('chapter2');
    expect(chapterTrack(3)).toBe('chapter3');
    expect(chapterTrack(4)).toBeNull();
    for (const t of ['chapter0', 'chapter1', 'chapter2', 'chapter3'] as const) {
      const spec = TRACKS[t];
      const bars = spec.melody.length / BAR;
      expect(Number.isInteger(bars)).toBe(true);
      expect(bars).toBeGreaterThanOrEqual(8);
      expect(bars).toBeLessThanOrEqual(16);
      expect(spec.bass).toHaveLength(bars);
      expect(spec.box).toBe(true);
      for (const d of [...spec.melody, ...spec.bass]) expect(d === -1 || (d >= 0 && d < PENTATONIC.length)).toBe(true);
    }
  });
  it('stepNotes: the melody each step, the bass an octave down on a bar line', () => {
    const spec = TRACKS.chapter0;
    expect(stepNotes(spec, 0, 1).map((n) => n.f)).toEqual([pitch(spec.root, 5), pitch(spec.root, 0) / 2]);
    expect(stepNotes(spec, 1, 1)).toEqual([]); // a rest, off the bar line
    expect(stepNotes(spec, 2, 1)).toHaveLength(1);
    // It loops
    expect(stepNotes(spec, spec.melody.length, 0)).toEqual(stepNotes(spec, 0, 0));
  });
  it('schedules a little ahead, a step apart, and keeps going as time passes', () => {
    vi.useFakeTimers();
    unlockAudio(() => ctx as unknown as AudioContext);
    playMusic('chapter1');
    expect(playingMusic()).toBe('chapter1');
    const spec = TRACKS.chapter1;
    const tines = () => ctx.started.filter((s) => s.kind === 'osc');
    const first = tines().length;
    expect(first).toBeGreaterThan(0);
    // Nothing is scheduled further than the lookahead
    expect(Math.max(...tines().map((s) => s.at))).toBeLessThan(0.1 + 0.4 + spec.step);
    // Melody tines start exactly a step apart (where there are no rests)
    const starts = [...new Set(tines().map((s) => +s.at.toFixed(4)))];
    expect(starts[1] - starts[0]).toBeCloseTo(spec.step);
    // Time passes: more notes, every pitch on the root's pentatonic scale (tines, bass an octave down, their overtones)
    ctx.currentTime = 4;
    vi.advanceTimersByTime(240);
    expect(tines().length).toBeGreaterThan(first);
    const allowed = new Set(PENTATONIC.flatMap((s) => [1, 0.5].flatMap((oct) => [1, 3.01].map((partial) => Math.round(spec.root * 2 ** (s / 12) * oct * partial)))));
    for (const s of tines()) expect(allowed.has(Math.round(s.f)), String(s.f)).toBe(true);
    // The same track again does not restart it; another one replaces it
    const count = ctx.started.length;
    playMusic('chapter1');
    expect(ctx.started.length).toBe(count);
    playMusic('chapter0');
    expect(playingMusic()).toBe('chapter0');
    stopMusic();
    expect(playingMusic()).toBeNull();
    const after = ctx.started.length;
    ctx.currentTime = 8;
    vi.advanceTimersByTime(500);
    expect(ctx.started.length).toBe(after);
  });
});
