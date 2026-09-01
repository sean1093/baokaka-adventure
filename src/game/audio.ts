/**
 * 音效用 WebAudio 直接合成，不載入任何 mp3。
 * 理由：三個音效都是簡單的音階，合成出來只要幾行程式，
 * 省掉二進位素材、省掉載入等待，而且行動網路斷線也還有聲音。
 * 遊戲不依賴聲音——全靜音也能完整通關（spec §8）。
 */

type Tone = 'tap' | 'found' | 'complete';

type ToneSpec = {
  /** 依序播放的音高（Hz） */
  notes: number[];
  /** 每個音之間的間隔（秒） */
  step: number;
  /** 單音長度（秒） */
  duration: number;
  peak: number;
  wave: OscillatorType;
};

const TONES: Record<Tone, ToneSpec> = {
  // 點到空白：低而輕的一下，只是觸感回饋，不能像「錯誤」音
  tap: { notes: [196], step: 0, duration: 0.07, peak: 0.05, wave: 'sine' },
  // 找到一樣東西：往上兩個音
  found: { notes: [523.25, 659.25], step: 0.1, duration: 0.2, peak: 0.16, wave: 'triangle' },
  // 三樣都找到：往上四個音
  complete: {
    notes: [523.25, 659.25, 783.99, 1046.5],
    step: 0.13,
    duration: 0.26,
    peak: 0.18,
    wave: 'triangle',
  },
};

let context: AudioContext | null = null;

/** iOS Safari 必須在使用者手勢裡建立／恢復 AudioContext（spec §8）。 */
export function unlockAudio(): void {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
  } catch {
    context = null; // 沒有音訊也要能玩
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
    // 起音 20ms、之後指數收尾，避免爆音
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(spec.peak, at + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + spec.duration);

    oscillator.connect(envelope).connect(audio.destination);
    oscillator.start(at);
    oscillator.stop(at + spec.duration + 0.02);
  });
}
