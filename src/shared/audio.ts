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
