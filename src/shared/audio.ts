/**
 * Sound is synthesised with WebAudio; no mp3 is ever loaded.
 * Every cue is a short run of oscillator notes and filtered-noise bursts, so synthesising takes a
 * few lines, ships no binary assets, waits on no download, and still works on a flaky mobile
 * connection. Nothing depends on sound: both games are fully completable muted.
 *
 * Two buses sit before the speakers: sound effects and music, each with its own volume
 * (`setVolumes`, the 翻翻台北 settings' 音效 / 音樂, GDD § 2.11). The RPG never sets them, so they
 * stay at full volume there.
 *
 * - The RPG's tones (`playTone`) and loops (`playMusic` of its tracks) are kept as they were until
 *   #111 retires it.
 * - 翻翻台北 (GDD § 2.12, bible § 8; #105): the `SFX` cue table (paper swish, wooden click, ratchet,
 *   flap flop, fwump, chime …), the word motifs (`motifVoices`), Baokaka's barks as pitched voice
 *   blips (`voiceVoices`) and a music-box loop per chapter (`chapter0`, `chapter1`). Dry and close,
 *   like paper on a table: short envelopes, no reverb.
 */

// -------------------------------------------------------------------------------------------
// The context and its buses

let context: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
const volume = { sfx: 1, music: 1 };

/**
 * iOS Safari only lets an AudioContext be created or resumed inside a user gesture: call this from
 * one (a pointerdown). `make` builds the context (tests pass a fake). True once there is a context.
 */
export function unlockAudio(make: () => AudioContext = () => new AudioContext()): boolean {
  try {
    if (context === null) {
      const audio = make();
      sfxBus = audio.createGain();
      musicBus = audio.createGain();
      sfxBus.gain.value = volume.sfx;
      musicBus.gain.value = volume.music;
      sfxBus.connect(audio.destination);
      musicBus.connect(audio.destination);
      context = audio;
    }
    if (context.state === 'suspended') void context.resume();
    return true;
  } catch {
    context = null; // The game must stay playable with no audio at all
    return false;
  }
}

/** True once a gesture has unlocked audio. */
export const audioUnlocked = (): boolean => context !== null;

/** The page went to the background (or came back): the context sleeps meanwhile. */
export function suspendAudio(hidden: boolean): void {
  const audio = context;
  if (audio === null) return;
  try {
    if (hidden && audio.state === 'running') void audio.suspend();
    else if (!hidden && audio.state === 'suspended') void audio.resume();
  } catch {
    // Nothing: sound is never load-bearing
  }
}

/** A 0–100 setting as a gain: squared, so the slider's middle sounds like the middle. */
export const volumeGain = (v: number): number => Math.max(0, Math.min(100, v)) ** 2 / 10000;

/** The settings' 音效 / 音樂 volumes, 0–100 each (GDD § 2.11). 0 is silent. */
export function setVolumes(sfx: number, music: number): void {
  volume.sfx = volumeGain(sfx);
  volume.music = volumeGain(music);
  const audio = context;
  if (audio === null) return;
  for (const [bus, v] of [[sfxBus, volume.sfx], [musicBus, volume.music]] as const) {
    if (bus === null) continue;
    bus.gain.cancelScheduledValues(audio.currentTime);
    bus.gain.setValueAtTime(bus.gain.value, audio.currentTime);
    bus.gain.linearRampToValueAtTime(v, audio.currentTime + 0.05);
  }
}

/** Tests: forget the context (and the loop playing on it). */
export function resetAudioForTest(): void {
  stopMusic();
  context = sfxBus = musicBus = null;
  noiseBuffer = null;
  volume.sfx = volume.music = 1;
}

// -------------------------------------------------------------------------------------------
// Voices: the two things every cue is made of

/** One oscillator note, optionally gliding from `f` to `to` (Hz). Times in seconds from the cue's start. */
export interface ToneVoice {
  readonly f: number;
  readonly to?: number;
  readonly at?: number;
  readonly dur: number;
  readonly peak: number;
  readonly wave?: OscillatorType;
  /** Attack (s); 0.01 by default */
  readonly a?: number;
}

/** A burst of white noise through one filter, its centre optionally sweeping from `f` to `to`. */
export interface NoiseVoice extends Omit<ToneVoice, 'wave'> {
  readonly noise: BiquadFilterType;
  readonly q?: number;
}

export type Voice = ToneVoice | NoiseVoice;

const isNoise = (v: Voice): v is NoiseVoice => 'noise' in v;

function noise(audio: AudioContext): AudioBuffer {
  if (noiseBuffer === null) {
    noiseBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.5), audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/** A click-free envelope: from silence to `peak` in `a`, then an exponential fall to silence at `end`. */
function envelope(audio: AudioContext, at: number, a: number, peak: number, end: number): GainNode {
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + a);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  return g;
}

/**
 * Plays voices on a bus, starting `delay` s from now, every pitch × `pitch` and every peak × `gain`.
 * Returns how to stop them (a skipped animation's sounds stop with it).
 */
function sound(voices: readonly Voice[], out: GainNode | null, delay: number, pitch: number, gain: number): () => void {
  const audio = context;
  if (audio === null || out === null || voices.length === 0) return () => undefined;
  const t0 = audio.currentTime + Math.max(0, delay) + 0.005;
  const sources: AudioScheduledSourceNode[] = [];
  for (const v of voices) {
    const at = t0 + (v.at ?? 0);
    const end = at + v.dur;
    const env = envelope(audio, at, Math.min(v.a ?? 0.01, v.dur / 2), v.peak * gain, end);
    let src: AudioScheduledSourceNode;
    if (isNoise(v)) {
      const n = audio.createBufferSource();
      n.buffer = noise(audio);
      n.loop = true;
      const filter = audio.createBiquadFilter();
      filter.type = v.noise;
      filter.Q.value = v.q ?? 1;
      filter.frequency.setValueAtTime(v.f * pitch, at);
      if (v.to !== undefined) filter.frequency.exponentialRampToValueAtTime(v.to * pitch, end);
      n.connect(filter).connect(env);
      src = n;
    } else {
      const o = audio.createOscillator();
      o.type = v.wave ?? 'sine';
      o.frequency.setValueAtTime(v.f * pitch, at);
      if (v.to !== undefined) o.frequency.exponentialRampToValueAtTime(v.to * pitch, end);
      o.connect(env);
      src = o;
    }
    env.connect(out);
    src.start(at);
    src.stop(end + 0.03);
    sources.push(src);
  }
  return () => {
    for (const s of sources) {
      try {
        s.stop();
      } catch {
        // Already stopped
      }
    }
  };
}

export interface PlayOptions {
  /** Seconds from now */
  readonly delay?: number;
  /** Pitch multiplier (1 = as written) */
  readonly pitch?: number;
  /** Peak multiplier */
  readonly gain?: number;
}

/** Plays voices on the sound-effects bus (nothing before the unlock, nothing at volume 0). */
export function playVoices(voices: readonly Voice[], { delay = 0, pitch = 1, gain = 1 }: PlayOptions = {}): () => void {
  if (volume.sfx <= 0) return () => undefined;
  return sound(voices, sfxBus, delay, pitch, gain);
}

// -------------------------------------------------------------------------------------------
// The RPG's tones (kept until #111)

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
  complete: { notes: [523.25, 659.25, 783.99, 1046.5], step: 0.13, duration: 0.26, peak: 0.18, wave: 'triangle' },
  // A hero got hit: a short low thud
  hit: { notes: [146.83, 110], step: 0.04, duration: 0.12, peak: 0.09, wave: 'square' },
  // Healing: three soft notes going up
  heal: { notes: [659.25, 783.99, 987.77], step: 0.09, duration: 0.22, peak: 0.12, wave: 'triangle' },
  // Level up: a five-note fanfare
  levelUp: { notes: [523.25, 659.25, 783.99, 1046.5, 1318.5], step: 0.11, duration: 0.3, peak: 0.16, wave: 'triangle' },
  // Battle lost: three notes going down, slow and gentle, never a buzzer
  defeat: { notes: [392, 329.63, 261.63], step: 0.22, duration: 0.4, peak: 0.1, wave: 'sine' },
};

export function playTone(tone: Tone, enabled: boolean): void {
  if (!enabled) return;
  const spec = TONES[tone];
  // 20 ms attack then an exponential tail, so nothing clicks
  sound(spec.notes.map((f, i) => ({ f, at: i * spec.step, dur: spec.duration, peak: spec.peak, wave: spec.wave, a: 0.02 })), sfxBus, 0, 1, 1);
}

// -------------------------------------------------------------------------------------------
// 翻翻台北's cues (GDD § 2.12, bible § 8)

/** Every sound effect of 翻翻台北 (GDD § 2.12 rows; `popup/game/sound.ts` maps the game's events to them). */
export const SFX_CUES = [
  'swish', // a tab or slider drag starts: soft paper swish
  'click', // a snap to a stop, a tapped switch: wooden click
  'ratchet', // a wheel step: ratchet tick
  'flop', // a flap opens or closes: two-note paper flop
  'boop', // a locked part: low boop
  'patpat', // Baokaka crawls a step: alternating soft blips
  'ding', // he wants something new: rising two-note ding
  'want', // 「要！要！」: blip-blip
  'look', // looking around: questioning up-glide
  'cry', // crying: soft, wobbly descending glide (comical, never distressing)
  'thump', // Mocha hops or lands: soft thump
  'mew', // Mocha can't get there: 「喵？」
  'puff', // Mocha's fur puffs (wet, steam): 「不要。」
  'scrape', // Mocha pushes: slow scrape
  'dropPaper', // what he pushed lands: paper flutter
  'dropCoin', // … coin clink
  'dropFlap', // … pigeon flap
  'coo', // a pigeon reacts
  'chitter', // a small animal reacts
  'honk', // a goose reacts
  'chirp', // any other creature reacts
  'sparkle', // the goal grabbed: sparkle arpeggio
  'fold', // the old pop-ups fold flat
  'leaf', // the page turns: paper whoosh plus chime
  'fwump', // a pop-up lands: low filtered noise plus a soft thump
  'cardDrop', // the chapter card drops in on its strings
  'flaps', // its split-flap row flips in
  'cardLift', // it lifts away
  'slap', // a sticker slaps on
  'pop', // a sticker pops over the tray
  'hehe', // 淘氣: 「嘿嘿」
  'bell', // 土地公: a temple bell
  'shutter', // the paper camera's click
  'note', // an album note pops on
  'hint', // 提示 / the nudge: soft bell
] as const;
export type SfxCue = (typeof SFX_CUES)[number];

/** A run of short noise ticks, `gap` s apart (the ratchet's teeth, the split-flap row). */
const ticks = (n: number, gap: number, f: number, peak: number): Voice[] =>
  Array.from({ length: n }, (_, i) => ({ noise: 'bandpass' as const, f: f * (1 + (i % 2) * 0.12), q: 5, at: i * gap, dur: 0.025, peak }));

export const SFX: Readonly<Record<SfxCue, readonly Voice[]>> = {
  swish: [{ noise: 'bandpass', f: 1900, to: 900, q: 0.8, dur: 0.2, peak: 0.2, a: 0.06 }],
  click: [
    { f: 820, to: 640, dur: 0.05, peak: 0.16, wave: 'triangle', a: 0.002 },
    { f: 300, dur: 0.06, peak: 0.07, a: 0.002 },
    { noise: 'highpass', f: 2600, dur: 0.025, peak: 0.06, a: 0.002 },
  ],
  ratchet: [{ noise: 'bandpass', f: 3200, q: 4, dur: 0.025, peak: 0.25, a: 0.002 }, { f: 1500, dur: 0.018, peak: 0.025, wave: 'square', a: 0.002 }],
  flop: [
    { noise: 'lowpass', f: 1100, dur: 0.08, peak: 0.1, a: 0.005 },
    { f: 330, dur: 0.1, peak: 0.08, wave: 'triangle', a: 0.005 },
    { noise: 'lowpass', f: 700, at: 0.09, dur: 0.09, peak: 0.1, a: 0.005 },
    { f: 247, at: 0.09, dur: 0.13, peak: 0.08, wave: 'triangle', a: 0.005 },
  ],
  boop: [{ f: 220, to: 175, dur: 0.24, peak: 0.12, a: 0.015 }],
  patpat: [
    { f: 520, to: 470, dur: 0.05, peak: 0.05, a: 0.004 },
    { noise: 'lowpass', f: 500, dur: 0.04, peak: 0.05, a: 0.004 },
    { f: 440, to: 400, at: 0.15, dur: 0.05, peak: 0.045, a: 0.004 },
    { noise: 'lowpass', f: 450, at: 0.15, dur: 0.04, peak: 0.045, a: 0.004 },
  ],
  ding: [{ f: 880, dur: 0.22, peak: 0.07, wave: 'triangle', a: 0.004 }, { f: 1318.5, at: 0.09, dur: 0.32, peak: 0.07, wave: 'triangle', a: 0.004 }],
  want: [{ f: 600, to: 720, dur: 0.09, peak: 0.08, wave: 'triangle' }, { f: 620, to: 760, at: 0.16, dur: 0.1, peak: 0.08, wave: 'triangle' }],
  look: [{ f: 440, to: 720, dur: 0.3, peak: 0.07, wave: 'triangle', a: 0.03 }],
  cry: [
    { f: 680, to: 600, dur: 0.2, peak: 0.05, wave: 'triangle', a: 0.03 },
    { f: 640, to: 540, at: 0.22, dur: 0.22, peak: 0.05, wave: 'triangle', a: 0.03 },
    { f: 580, to: 430, at: 0.46, dur: 0.36, peak: 0.045, wave: 'triangle', a: 0.03 },
  ],
  thump: [{ noise: 'lowpass', f: 420, dur: 0.06, peak: 0.1, a: 0.003 }, { f: 170, to: 110, dur: 0.09, peak: 0.12, a: 0.003 }],
  mew: [{ f: 720, to: 980, dur: 0.18, peak: 0.06, wave: 'triangle', a: 0.02 }],
  puff: [{ noise: 'lowpass', f: 1400, to: 600, dur: 0.16, peak: 0.14, a: 0.01 }],
  scrape: [{ noise: 'bandpass', f: 700, to: 480, q: 2, dur: 0.45, peak: 0.28, a: 0.12 }],
  dropPaper: [0, 0.07, 0.13, 0.2].map((at, i) => ({ noise: 'bandpass' as const, f: 1600 - i * 200, q: 1.5, at, dur: 0.06, peak: 0.2, a: 0.01 })),
  dropCoin: [
    { f: 2093, dur: 0.18, peak: 0.06, a: 0.002 },
    { f: 3136, dur: 0.12, peak: 0.03, a: 0.002 },
    { f: 2349, at: 0.11, dur: 0.2, peak: 0.05, a: 0.002 },
    { f: 3520, at: 0.11, dur: 0.12, peak: 0.025, a: 0.002 },
  ],
  dropFlap: [0, 0.08, 0.16].map((at) => ({ noise: 'lowpass' as const, f: 900, at, dur: 0.06, peak: 0.2, a: 0.008 })),
  coo: [{ f: 380, to: 330, dur: 0.16, peak: 0.06, a: 0.03 }, { f: 410, to: 340, at: 0.2, dur: 0.22, peak: 0.06, a: 0.03 }],
  chitter: [0, 0.05, 0.1, 0.15, 0.2].map((at, i) => ({ f: 2200 + (i % 2) * 300, at, dur: 0.03, peak: 0.045, wave: 'square' as const, a: 0.003 })),
  honk: [{ f: 290, to: 260, dur: 0.16, peak: 0.05, wave: 'sawtooth', a: 0.01 }, { f: 300, to: 250, at: 0.2, dur: 0.2, peak: 0.05, wave: 'sawtooth', a: 0.01 }],
  chirp: [{ f: 2600, to: 3400, dur: 0.06, peak: 0.04, a: 0.004 }, { f: 2700, to: 3600, at: 0.09, dur: 0.06, peak: 0.04, a: 0.004 }],
  sparkle: [
    ...[1046.5, 1318.5, 1568, 2093].map((f, i) => ({ f, at: i * 0.06, dur: 0.3, peak: 0.065, wave: 'triangle' as const, a: 0.003 })),
    { f: 2637, at: 0.24, dur: 0.4, peak: 0.03, a: 0.003 },
  ],
  fold: [{ noise: 'bandpass', f: 1300, to: 600, q: 0.9, dur: 0.32, peak: 0.18, a: 0.08 }],
  leaf: [
    { noise: 'bandpass', f: 450, to: 2200, q: 0.8, dur: 0.32, peak: 0.22, a: 0.1 },
    { f: 1568, at: 0.2, dur: 0.5, peak: 0.05, a: 0.003 },
    { f: 2349, at: 0.27, dur: 0.45, peak: 0.035, a: 0.003 },
  ],
  fwump: [{ noise: 'lowpass', f: 280, dur: 0.15, peak: 0.16, a: 0.01 }, { f: 120, to: 70, dur: 0.15, peak: 0.13, a: 0.008 }],
  cardDrop: [
    { noise: 'lowpass', f: 700, dur: 0.07, peak: 0.1, a: 0.003 },
    { f: 210, to: 150, dur: 0.12, peak: 0.1, wave: 'triangle', a: 0.003 },
    { f: 196, to: 192, at: 0.02, dur: 0.3, peak: 0.02, wave: 'triangle', a: 0.003 },
  ],
  flaps: ticks(7, 0.07, 2600, 0.3),
  cardLift: [{ noise: 'bandpass', f: 600, to: 1700, q: 0.9, dur: 0.26, peak: 0.16, a: 0.08 }],
  slap: [{ noise: 'lowpass', f: 1800, dur: 0.05, peak: 0.14, a: 0.002 }, { f: 300, to: 180, dur: 0.07, peak: 0.09, a: 0.002 }],
  pop: [{ f: 600, to: 1250, dur: 0.08, peak: 0.08, a: 0.004 }],
  hehe: [{ f: 880, to: 820, dur: 0.07, peak: 0.06, wave: 'triangle', a: 0.006 }, { f: 940, to: 860, at: 0.12, dur: 0.08, peak: 0.06, wave: 'triangle', a: 0.006 }],
  bell: [
    { f: 1046.5, dur: 0.7, peak: 0.07, a: 0.003 },
    { f: 2637, dur: 0.35, peak: 0.025, a: 0.003 },
    { f: 1568, at: 0.18, dur: 0.6, peak: 0.04, a: 0.003 },
  ],
  shutter: [
    { noise: 'highpass', f: 3000, dur: 0.03, peak: 0.16, a: 0.001 },
    { f: 95, dur: 0.03, peak: 0.08, wave: 'square', a: 0.001 },
    { noise: 'bandpass', f: 1500, q: 2, at: 0.07, dur: 0.045, peak: 0.12, a: 0.001 },
  ],
  note: [{ f: 1046.5, to: 1318.5, dur: 0.07, peak: 0.06, a: 0.004 }, { noise: 'highpass', f: 2000, dur: 0.02, peak: 0.03, a: 0.002 }],
  hint: [{ f: 1760, dur: 0.45, peak: 0.045, a: 0.003 }, { f: 2637, dur: 0.25, peak: 0.018, a: 0.003 }],
};

/** Plays a cue (see `SFX`). */
export const playSfx = (cue: SfxCue, options?: PlayOptions): (() => void) => playVoices(SFX[cue], options);

/** The word motifs' root (G4): `WORD_MOTIF` steps are semitones above it. */
export const MOTIF_ROOT = 392;

/** How a word's motif is voiced (GDD § 2.12 word row). */
export type MotifStyle = 'beep' | 'wave' | 'stomp' | 'sweep' | 'warm' | 'whooshUp' | 'whoosh' | 'chord';

/**
 * A word's motif (semitone steps above `MOTIF_ROOT`) as voices: 嗶 two square beeps, 掰掰 a waving
 * pair, 不要 two low stomps an octave down, 哇 a big gliding sweep, 抱抱 a warm, slow third, 飛機 a run
 * with a whoosh up under it, 咻 a noise sweep over its notes, 一起 all its notes at once (a chord).
 */
export function motifVoices(steps: readonly number[], style: MotifStyle): Voice[] {
  const hz = (s: number) => MOTIF_ROOT * 2 ** (s / 12);
  switch (style) {
    case 'chord':
      return steps.map((s) => ({ f: hz(s), dur: 0.7, peak: 0.035, wave: 'triangle' as const, a: 0.02 }));
    case 'stomp':
      return steps.flatMap((s, i) => [
        { f: hz(s) / 2, to: hz(s) / 2.4, at: i * 0.2, dur: 0.16, peak: 0.12, wave: 'triangle' as const, a: 0.004 },
        { noise: 'lowpass' as const, f: 380, at: i * 0.2, dur: 0.07, peak: 0.08, a: 0.003 },
      ]);
    case 'sweep':
      return steps.map((s, i) => ({ f: hz(s) * 0.94, to: hz(s), at: i * 0.09, dur: i === steps.length - 1 ? 0.45 : 0.14, peak: 0.07, wave: 'triangle' as const }));
    case 'whooshUp':
    case 'whoosh': {
      const up = style === 'whooshUp';
      const notes = steps.map((s, i) => ({ f: hz(s), at: i * 0.07, dur: 0.16, peak: 0.05, wave: 'triangle' as const, a: 0.005 }));
      return [...notes, { noise: 'bandpass', f: up ? 500 : 3200, to: up ? 3200 : 600, q: 1.2, dur: 0.07 * steps.length + 0.12, peak: 0.2, a: 0.06 }];
    }
    default: {
      const gap = style === 'warm' ? 0.16 : style === 'beep' ? 0.13 : 0.12;
      const wave: OscillatorType = style === 'beep' ? 'square' : 'triangle';
      return steps.map((s, i) => ({
        f: hz(s) * (style === 'wave' ? 1.03 : 1),
        to: style === 'wave' ? hz(s) * 0.97 : undefined,
        at: i * gap,
        dur: style === 'warm' ? 0.4 : 0.11,
        peak: style === 'beep' ? 0.05 : 0.07,
        wave,
        a: style === 'warm' ? 0.03 : 0.005,
      }));
    }
  }
}

/**
 * Baokaka's barks as pitched voice blips (GDD § 2.12: no recorded voices): one rounded blip per
 * syllable, up a little then down at the end, `pitch` × his baby range.
 */
export function voiceVoices(syllables: number, pitch = 1): Voice[] {
  const n = Math.max(1, Math.min(6, syllables));
  return Array.from({ length: n }, (_, i) => {
    const f = (640 + (i % 2) * 70 - (i === n - 1 && n > 1 ? 60 : 0)) * pitch;
    return { f, to: f * (i === n - 1 ? 0.9 : 1.08), at: i * 0.12, dur: 0.09, peak: 0.07, wave: 'triangle' as const, a: 0.008 };
  });
}

// -------------------------------------------------------------------------------------------
// Music
//
// Loops are written as scale degrees over a pentatonic scale (宮商角徵羽, the interval set behind
// most Chinese and Taiwanese folk melody) and scheduled a little ahead at a time, so nothing is
// downloaded and nothing drifts. The RPG has a theme per place; 翻翻台北 has a music box per
// chapter (GDD § 2.12: "one 8–16 bar loop per chapter in a pentatonic key").

export type Track = 'field' | 'night' | 'battle' | 'boss' | 'ending' | 'chapter0' | 'chapter1' | 'chapter2' | 'chapter3' | 'chapter4';

/** 宮商角徵羽 across three octaves, as semitone offsets from the root. */
export const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

/** Steps in a bar (one bass note each) */
export const BAR = 4;

export interface TrackSpec {
  /** Root pitch (Hz) */
  readonly root: number;
  /** Seconds per step */
  readonly step: number;
  /** Melody as indices into PENTATONIC; -1 is a rest */
  readonly melody: readonly number[];
  /** Bass, one note per bar of four steps */
  readonly bass: readonly number[];
  readonly wave: OscillatorType;
  readonly peak: number;
  /** A music box (翻翻台北): plucked comb tines with a soft overtone that ring and fade, not held notes */
  readonly box?: boolean;
}

export const TRACKS: Readonly<Record<Track, TrackSpec>> = {
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
  night: { root: 196, step: 0.42, melody: [3, 5, 4, 3, 2, -1, 3, 2, 0, 2, 3, -1, 2, 0, -1, -1], bass: [0, 0, 2, 2], wave: 'sine', peak: 0.05 },
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
  ending: { root: 261.63, step: 0.5, melody: [7, 8, 7, 5, 6, 5, 3, 2, 3, 5, 3, 2, 0, -1, -1, -1], bass: [0, 3, 2, 0], wave: 'triangle', peak: 0.05 },
  // 序章 (the night before 度晬, the crib under its mobile): a slow lullaby in G that turns like the mobile, 8 bars
  chapter0: {
    root: 392,
    step: 0.42,
    melody: [5, -1, 7, 5, 4, -1, 3, -1, 2, 3, 4, 3, 2, -1, -1, -1, 5, -1, 7, 8, 7, -1, 5, -1, 4, 3, 2, 3, 0, -1, -1, -1],
    bass: [0, 4, 2, 3, 0, 4, 3, 0],
    wave: 'sine',
    peak: 0.06,
    box: true,
  },
  // 第一章 台北車站: brighter and walking, the station's arrival chime turned into a tune, 12 bars in C
  chapter1: {
    root: 523.25,
    step: 0.28,
    melody: [
      0, 2, 3, 5, 3, -1, 2, -1, 3, 4, 3, 2, 0, -1, -1, -1,
      2, 3, 5, 3, 6, -1, 5, -1, 3, 5, 3, 2, 1, -1, -1, -1,
      5, 6, 7, 6, 5, 3, 2, 3, 1, 2, 3, 1, 0, -1, -1, -1,
    ],
    bass: [0, 3, 2, 0, 1, 4, 3, 1, 3, 2, 1, 0],
    wave: 'sine',
    peak: 0.055,
    box: true,
  },
  // 第二章 大安森林公園 (#114): a slow stroll under the trees at night, leaves swaying, 8 bars in D
  chapter2: {
    root: 587.33,
    step: 0.34,
    melody: [
      2, -1, 4, 3, 2, -1, 1, -1, 0, 1, 2, -1, 4, -1, -1, -1,
      5, -1, 4, 3, 2, 3, 4, -1, 3, 2, 1, -1, 2, -1, -1, -1,
    ],
    bass: [0, 3, 1, 3, 0, 2, 4, 0],
    wave: 'sine',
    peak: 0.05,
    box: true,
  },
  // 第三章 台灣大學 (#116): the campus at night, a lake rippling under the moon and a bell far off, 8 bars in A
  chapter3: {
    root: 440,
    step: 0.36,
    melody: [
      5, -1, 3, 4, 5, -1, 7, -1, 6, 5, 3, -1, 4, -1, -1, -1,
      3, -1, 4, 5, 7, 5, 4, -1, 2, 3, 1, -1, 0, -1, -1, -1,
    ],
    bass: [0, 2, 3, 1, 0, 3, 1, 0],
    wave: 'sine',
    peak: 0.05,
    box: true,
  },
  // 第四章 西門町 (#118): the neon street after closing, signs blinking awake one by one and a
  // karaoke tune drifting out of a door, 8 bars in E (a little syncopated)
  chapter4: {
    root: 329.63,
    step: 0.3,
    melody: [
      0, 2, -1, 4, 5, -1, 4, -1, 2, -1, 4, 2, 0, -1, -1, -1,
      5, -1, 7, 5, 4, 5, -1, 4, 2, 4, 2, -1, 1, 2, 0, -1,
    ],
    bass: [0, 3, 1, 2, 0, 3, 2, 0],
    wave: 'sine',
    peak: 0.05,
    box: true,
  },
};

/** 翻翻台北's music box for a chapter, or null where its loop isn't written yet (chapters 5–10 bring theirs). */
export function chapterTrack(chapter: number): Track | null {
  const tracks: readonly Track[] = ['chapter0', 'chapter1', 'chapter2', 'chapter3', 'chapter4'];
  return tracks[chapter] ?? null;
}

export const pitch = (root: number, degree: number): number => root * 2 ** (PENTATONIC[degree] / 12);

/** One scheduled note of a loop. */
export interface LoopNote {
  readonly f: number;
  readonly at: number;
  readonly dur: number;
  readonly peak: number;
  readonly wave: OscillatorType;
}

/** The notes of step `cursor` of a loop, played at `at` (s): the melody's, and a bass note on each bar's first step. */
export function stepNotes(spec: TrackSpec, cursor: number, at: number): LoopNote[] {
  const out: LoopNote[] = [];
  const index = cursor % spec.melody.length;
  const degree = spec.melody[index];
  // A music box's tine rings on past the next note; a held note is a step and a half
  if (degree >= 0) out.push({ f: pitch(spec.root, degree), at, dur: spec.step * (spec.box ? 3.2 : 1.6), peak: spec.peak, wave: spec.wave });
  // One bass note per bar, an octave down and softer (two, for the box: its low comb is quiet)
  if (index % BAR === 0) {
    const bar = Math.floor(index / BAR) % spec.bass.length;
    out.push({ f: pitch(spec.root, spec.bass[bar]) / 2, at, dur: spec.step * (spec.box ? 4.2 : 3.4), peak: spec.peak * (spec.box ? 0.7 : 1.5), wave: 'sine' });
  }
  return out;
}

let music: { track: Track; gain: GainNode; timer: ReturnType<typeof setInterval>; at: number; cursor: number } | null = null;

/** How far ahead notes are scheduled, and how often the scheduler wakes up (seconds / ms). */
const LOOKAHEAD = 0.4;
const TICK_MS = 120;

function play(audio: AudioContext, out: GainNode, n: LoopNote, box: boolean): void {
  const voices: Voice[] = box
    ? // A plucked tine: an instant attack, a quick fall to a ringing tail, and a faint metallic overtone
      [
        { f: n.f, dur: n.dur, peak: n.peak, wave: n.wave, a: 0.004 },
        { f: n.f * 3.01, dur: n.dur * 0.3, peak: n.peak * 0.18, a: 0.002 },
      ]
    : [{ f: n.f, dur: n.dur, peak: n.peak, wave: n.wave, a: 0.03 }];
  sound(voices.map((v) => ({ ...v, at: n.at - audio.currentTime - 0.005 })), out, 0, 1, 1);
}

/** Starts a loop, or does nothing when it is already the one playing (or there is no context yet). */
export function playMusic(track: Track): void {
  const audio = context;
  if (!audio || musicBus === null) return;
  if (music?.track === track) return;
  stopMusic();

  const spec = TRACKS[track];
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(1, audio.currentTime + 0.6);
  gain.connect(musicBus);

  const state = { track, gain, timer: undefined as unknown as ReturnType<typeof setInterval>, at: audio.currentTime + 0.1, cursor: 0 };
  music = state;

  const pump = () => {
    if (music !== state) return;
    while (state.at < audio.currentTime + LOOKAHEAD) {
      for (const n of stepNotes(spec, state.cursor, state.at)) play(audio, gain, n, spec.box === true);
      state.at += spec.step;
      state.cursor += 1;
    }
  };

  pump();
  state.timer = setInterval(pump, TICK_MS);
}

/** The loop playing now, if any. */
export const playingMusic = (): Track | null => music?.track ?? null;

export function stopMusic(): void {
  const audio = context;
  const state = music;
  music = null;
  if (!state) return;
  clearInterval(state.timer);
  if (!audio) return;
  // Fade out rather than cut, so leaving a screen never clicks
  const now = audio.currentTime;
  state.gain.gain.cancelScheduledValues(now);
  state.gain.gain.setValueAtTime(Math.max(0.0001, state.gain.gain.value), now);
  state.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  setTimeout(() => state.gain.disconnect(), 500);
}
