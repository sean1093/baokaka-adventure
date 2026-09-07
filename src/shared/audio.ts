/**
 * Sound is synthesised with WebAudio; no mp3 is ever loaded.
 * Every cue is a short note run, so synthesising takes a few lines, ships no binary assets,
 * waits on no download, and still works on a flaky mobile connection.
 * No game depends on sound: both are fully completable muted.
 */

export type Tone = 'tap' | 'found' | 'complete' | 'hit' | 'heal' | 'levelUp' | 'defeat';

type ToneSpec = {
  /** Pitches played in order (Hz) */
  notes: number[];
  /** Gap between notes (seconds) */
  step: number;
  /** Length of a single note (seconds) */
  duration: number;
  peak: number;
  wave: OscillatorType;
};

const TONES: Record<Tone, ToneSpec> = {
  // Empty tap / menu select: one low, quiet blip. Tactile feedback only, it must never sound like an error
  tap: { notes: [196], step: 0, duration: 0.07, peak: 0.05, wave: 'sine' },
  // Found one thing / landed a hit on a foe: two notes going up
  found: { notes: [523.25, 659.25], step: 0.1, duration: 0.2, peak: 0.16, wave: 'triangle' },
  // All found / battle won: four notes going up
  complete: {
    notes: [523.25, 659.25, 783.99, 1046.5],
    step: 0.13,
    duration: 0.26,
    peak: 0.18,
    wave: 'triangle',
  },
  // A hero got hit: a short low thud
  hit: { notes: [146.83, 110], step: 0.04, duration: 0.12, peak: 0.09, wave: 'square' },
  // Healing: three soft notes going up
  heal: { notes: [659.25, 783.99, 987.77], step: 0.09, duration: 0.22, peak: 0.12, wave: 'triangle' },
  // Level up: a five-note fanfare
  levelUp: {
    notes: [523.25, 659.25, 783.99, 1046.5, 1318.5],
    step: 0.11,
    duration: 0.3,
    peak: 0.16,
    wave: 'triangle',
  },
  // Battle lost: three notes going down, slow and gentle, never a buzzer
  defeat: { notes: [392, 329.63, 261.63], step: 0.22, duration: 0.4, peak: 0.1, wave: 'sine' },
};

let context: AudioContext | null = null;

/** iOS Safari only lets an AudioContext be created or resumed inside a user gesture. */
export function unlockAudio(): void {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
  } catch {
    context = null; // The game must stay playable with no audio at all
  }
}

export function playTone(tone: Tone, enabled: boolean): void {
  const audio = context;
  if (!enabled || !audio) return;
  const spec = TONES[tone];
  const startedAt = audio.currentTime;

  spec.notes.forEach((frequency, index) => {
    const at = startedAt + index * spec.step;
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();

    oscillator.type = spec.wave;
    oscillator.frequency.value = frequency;
    // 20ms attack then an exponential tail, so nothing clicks
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(spec.peak, at + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + spec.duration);

    oscillator.connect(envelope).connect(audio.destination);
    oscillator.start(at);
    oscillator.stop(at + spec.duration + 0.02);
  });
}

// -------------------------------------------------------------------------------------------
// Music
//
// The RPG needs a theme per place. Loops are written as scale degrees over a pentatonic scale
// (the interval set behind most Chinese folk melody, and the reason these read as 武俠 rather
// than as a jingle) and scheduled a bar at a time, so nothing is downloaded and nothing drifts.

export type Track = 'field' | 'night' | 'battle' | 'boss' | 'ending';

/** 宮商角徵羽 across three octaves, as semitone offsets from the root. */
const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

type TrackSpec = {
  /** Root pitch (Hz) */
  root: number;
  /** Seconds per step */
  step: number;
  /** Melody as indices into PENTATONIC; -1 is a rest */
  melody: number[];
  /** Bass, one note per bar of four steps */
  bass: number[];
  wave: OscillatorType;
  peak: number;
};

const TRACKS: Record<Track, TrackSpec> = {
  // Walking around: open, unhurried, a little pastoral
  field: {
    root: 261.63,
    step: 0.3,
    melody: [5, 7, 6, 5, 3, 5, -1, 3, 2, 3, 5, 3, 2, 0, -1, -1, 5, 7, 8, 7, 6, 5, -1, 3, 5, 3, 2, 3, 2, 0, -1, -1],
    bass: [0, 3, 2, 0, 0, 5, 3, 0],
    wave: 'triangle',
    peak: 0.055,
  },
  // 棉被山: same shape, lower and slower, with a darker bass
  night: {
    root: 196,
    step: 0.42,
    melody: [3, 5, 4, 3, 2, -1, 3, 2, 0, 2, 3, -1, 2, 0, -1, -1],
    bass: [0, 0, 2, 2],
    wave: 'sine',
    peak: 0.05,
  },
  // An ordinary fight: quick, bouncing, never frantic
  battle: {
    root: 293.66,
    step: 0.18,
    melody: [5, 5, 7, 5, 8, 7, 5, 3, 5, 5, 7, 8, 9, 8, 7, 5, 3, 3, 5, 3, 6, 5, 3, 2, 3, 5, 7, 5, 3, 2, 0, -1],
    bass: [0, 0, 3, 3, 2, 2, 0, 5],
    wave: 'square',
    peak: 0.038,
  },
  // A boss: the same tempo a step lower, with a driving bass on every step
  boss: {
    root: 220,
    step: 0.16,
    melody: [0, 3, 5, 3, 0, 3, 6, 5, 3, 5, 7, 5, 3, 2, 0, -1, 5, 7, 8, 7, 5, 3, 5, 3, 2, 3, 5, 3, 2, 0, -1, -1],
    bass: [0, 2, 0, 3, 0, 2, 5, 3],
    wave: 'sawtooth',
    peak: 0.032,
  },
  // The last page: slow, warm, resolving down to the root
  ending: {
    root: 261.63,
    step: 0.5,
    melody: [7, 8, 7, 5, 6, 5, 3, 2, 3, 5, 3, 2, 0, -1, -1, -1],
    bass: [0, 3, 2, 0],
    wave: 'triangle',
    peak: 0.05,
  },
};

const pitch = (root: number, degree: number): number => root * 2 ** (PENTATONIC[degree] / 12);

let music: { track: Track; gain: GainNode; timer: number; at: number; cursor: number } | null = null;

/** How far ahead notes are scheduled, and how often the scheduler wakes up (seconds / ms). */
const LOOKAHEAD = 0.4;
const TICK_MS = 120;

function note(audio: AudioContext, out: GainNode, frequency: number, at: number, length: number, wave: OscillatorType, peak: number): void {
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();
  oscillator.type = wave;
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(peak, at + 0.03);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + length);
  oscillator.connect(envelope).connect(out);
  oscillator.start(at);
  oscillator.stop(at + length + 0.02);
}

/** Starts a loop, or does nothing when it is already the one playing. */
export function playMusic(track: Track): void {
  const audio = context;
  if (!audio) return;
  if (music?.track === track) return;
  stopMusic();

  const spec = TRACKS[track];
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(1, audio.currentTime + 0.6);
  gain.connect(audio.destination);

  const state = { track, gain, timer: 0, at: audio.currentTime + 0.1, cursor: 0 };
  music = state;

  const pump = () => {
    if (music !== state) return;
    while (state.at < audio.currentTime + LOOKAHEAD) {
      const index = state.cursor % spec.melody.length;
      const degree = spec.melody[index];
      if (degree >= 0) note(audio, gain, pitch(spec.root, degree), state.at, spec.step * 1.6, spec.wave, spec.peak);
      // One bass note per bar, an octave down and softer
      if (index % 4 === 0) {
        const bar = Math.floor(index / 4) % spec.bass.length;
        note(audio, gain, pitch(spec.root, spec.bass[bar]) / 2, state.at, spec.step * 3.4, 'sine', spec.peak * 1.5);
      }
      state.at += spec.step;
      state.cursor += 1;
    }
  };

  pump();
  state.timer = window.setInterval(pump, TICK_MS);
}

export function stopMusic(): void {
  const audio = context;
  const state = music;
  music = null;
  if (!state) return;
  window.clearInterval(state.timer);
  if (!audio) return;
  // Fade out rather than cut, so leaving a screen never clicks
  const now = audio.currentTime;
  state.gain.gain.cancelScheduledValues(now);
  state.gain.gain.setValueAtTime(Math.max(0.0001, state.gain.gain.value), now);
  state.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  window.setTimeout(() => state.gain.disconnect(), 500);
}
