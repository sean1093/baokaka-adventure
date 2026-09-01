/**
 * Sound is synthesised with WebAudio; no mp3 is ever loaded.
 * All three cues are short note runs, so synthesising them takes a few lines, ships no
 * binary assets, waits on no download, and still works on a flaky mobile connection.
 * The game never depends on sound: it is fully completable muted (spec §8).
 */

type Tone = 'tap' | 'found' | 'complete';

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
  // Empty tap: one low, quiet blip. Tactile feedback only, it must never sound like an error
  tap: { notes: [196], step: 0, duration: 0.07, peak: 0.05, wave: 'sine' },
  // Found one thing: two notes going up
  found: { notes: [523.25, 659.25], step: 0.1, duration: 0.2, peak: 0.16, wave: 'triangle' },
  // All three found: four notes going up
  complete: {
    notes: [523.25, 659.25, 783.99, 1046.5],
    step: 0.13,
    duration: 0.26,
    peak: 0.18,
    wave: 'triangle',
  },
};

let context: AudioContext | null = null;

/** iOS Safari only lets an AudioContext be created or resumed inside a user gesture (spec §8). */
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
