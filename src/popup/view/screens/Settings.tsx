import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { POPUP as C, withAlpha } from '../../../art/palette';
import { UI } from '../../content';
import type { Settings as SettingsValue } from '../../game/progress';
import { effectiveSettings, heldByElder } from '../../game/settings';
import { useTextScale } from '../textSize';
import { askTiltPermission } from '../useTilt';
import { Endpaper } from './Contents';
import {
  AutoHintIcon,
  BackIcon,
  CheckIcon,
  ElderIcon,
  LeftHandIcon,
  LockIcon,
  MotionIcon,
  MusicIcon,
  ResetIcon,
  SoundIcon,
  SpeedIcon,
  TextSizeIcon,
  TiltIcon,
  VibrateIcon,
} from './icons';
import { CREAM_CARD, cardShadow } from './paper';
import './settings.css';

/**
 * 設定 (GDD § 2.11, § 5.7; popup art bible § 7, § 9.3; #104, D-67): every setting on cream index
 * cards over the 花磚 endpaper, opened from the cover's 設定 and the pause menu's.
 *
 * - **長輩模式 leads**, on its own card with a one-line summary. On, it holds 速度, 字的大小 and
 *   自動提示 at 慢, 大字 and 15 秒: those rows show the held value with a padlock and
 *   「長輩模式幫你設好了」, and the player's own values come back when it is turned off
 *   (`game/settings.ts`).
 * - **Every choice is a row of paper buttons** (a radio group): the chosen one is navy with a ✓,
 *   the others cream (a shape as well as a colour). The volumes are sliders with their % beside them.
 *   Every control is ≥ 48 px tall with its icon and words (R5, R6); 大字 grows every word here by
 *   25 % (`useTextScale`).
 * - **減少動態** shows what is in effect: the system's choice (「跟著手機的設定」) until the player
 *   picks one.
 * - **書本傾斜** (the gyro tilt, bible § 2.3) asks the phone for the gyro on the tap that turns it on
 *   (iOS), and is held off in 長輩模式.
 * - **「重新開始（按住三秒）」** starts over only after a 3-second hold (a countdown and a red bar
 *   fill while held; letting go cancels). The settings are kept (D-55).
 *
 * Changes apply live: the shell writes them through `store.updateSettings`, and the screen itself
 * is drawn with them (大字 here at once).
 */

export interface SettingsProps {
  /** The stored settings (the player's own values; 長輩模式 is applied here when shown) */
  readonly settings: SettingsValue;
  /** The system asks for less motion (what 減少動態 shows while the player hasn't chosen) */
  readonly osReduced: boolean;
  readonly onChange: (patch: Partial<SettingsValue>) => void;
  /** 「重新開始」 held for 3 s */
  readonly onReset: () => void;
  readonly onBack: () => void;
  /** A still for screenshots */
  readonly still?: boolean;
}

/** How long 「重新開始」 must be held (§ 5.7 「按住三秒」). */
export const RESET_HOLD_MS = 3000;

/** A row of choices: a radio group of paper buttons. */
export interface ChoiceOption<T> {
  readonly value: T;
  readonly text: string;
}

function Choice<T extends string | number | boolean>({ label, options, value, onPick, locked = false, testId }: { label: string; options: readonly ChoiceOption<T>[]; value: T; onPick: (value: T) => void; locked?: boolean; testId: string }) {
  const k = useTextScale();
  return (
    <div role="radiogroup" aria-label={label} aria-disabled={locked || undefined} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} data-choice={testId}>
      {options.map((o) => {
        const on = o.value === value;
        const style: CSSProperties = on
          ? { backgroundColor: C.cover, color: C.page, boxShadow: `inset 0 0 0 2px ${C.gold}, ${cardShadow(0.5)}` }
          : locked
            ? { backgroundColor: withAlpha(C.page, 0.6), color: C.inkSoft, outline: `2px dashed ${C.pageEdge}`, outlineOffset: -2 }
            : { ...CREAM_CARD, boxShadow: `inset 0 0 0 1.5px ${C.pageEdge}, ${cardShadow(0.6)}` };
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={locked}
            onClick={() => !on && onPick(o.value)}
            data-option={String(o.value)}
            className={`flex min-h-[52px] items-center justify-center gap-1 rounded-[10px] px-1 font-black tracking-[0.06em] ${locked ? '' : 'kit-press'}`}
            style={{ ...style, fontSize: 20 * k, lineHeight: 1.2, WebkitTapHighlightColor: 'transparent' }}
          >
            {on && (locked ? <LockIcon size={18} color={C.goldLight} /> : <CheckIcon size={18} />)}
            <span className="whitespace-nowrap">{o.text}</span>
          </button>
        );
      })}
    </div>
  );
}

const ON_OFF: readonly ChoiceOption<boolean>[] = [
  { value: false, text: UI.settings.onOff[0] },
  { value: true, text: UI.settings.onOff[1] },
];

/** One setting: its icon and name, an optional note, and its control under them. */
function Row({ icon, label, note, children, testId }: { icon: ReactNode; label: string; note?: ReactNode; children: ReactNode; testId: string }) {
  const k = useTextScale();
  return (
    <div className="flex flex-col gap-2 py-3" data-setting={testId}>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex shrink-0">
          {icon}
        </span>
        <span className="font-black tracking-[0.1em]" style={{ fontSize: 22 * k, lineHeight: 1.2 }}>
          {label}
        </span>
      </div>
      {note}
      {children}
    </div>
  );
}

/** A quiet line under a row's name. */
function Note({ children, held = false }: { children: ReactNode; held?: boolean }) {
  const k = useTextScale();
  return (
    <p className="flex items-center gap-2 font-bold" style={{ fontSize: 20 * k, lineHeight: 1.25, color: C.inkSoft }} data-held={held ? '' : undefined}>
      {children}
    </p>
  );
}

/** The note on a row 長輩模式 holds. */
function HeldNote() {
  return (
    <Note held>
      <LockIcon size={20} />
      {UI.settings.elderHeld}
    </Note>
  );
}

/** The slider's palette (`settings.css` reads these). */
const RANGE_VARS = {
  '--done': C.seal,
  '--track': C.pageDark,
  '--groove': withAlpha(C.shadow, 0.35),
  '--thumb': C.page,
  '--thumbLit': C.cutRim,
  '--ring': C.gold,
  '--edge': C.ink,
  '--focus': C.cover,
} as CSSProperties;

function Volume({ label, value, onChange, testId }: { label: string; value: number; onChange: (v: number) => void; testId: string }) {
  const k = useTextScale();
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={100}
        step={10}
        value={value}
        aria-label={label}
        aria-valuetext={`${value}${UI.settings.percent}`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="settings-range min-w-0 flex-1"
        style={{ ...RANGE_VARS, '--fill': `${value}%` } as CSSProperties}
        data-volume={testId}
      />
      <span className="shrink-0 text-right font-num font-semibold" style={{ fontSize: 20 * k, minWidth: `${2.6 * k}em`, color: C.ink }} aria-hidden="true">
        {value}
        {UI.settings.percent}
      </span>
    </div>
  );
}

/** 「重新開始（按住三秒）」: a countdown and a red bar while held; done after `RESET_HOLD_MS`. */
function HoldToReset({ onDone }: { onDone: () => void }) {
  const k = useTextScale();
  const [progress, setProgress] = useState(0);
  const start = useRef<number | null>(null);
  const raf = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const stop = useCallback(() => {
    start.current = null;
    cancelAnimationFrame(raf.current);
    setProgress(0);
  }, []);
  const begin = useCallback(() => {
    if (start.current !== null) return;
    start.current = performance.now();
    const tick = (now: number) => {
      if (start.current === null) return;
      const p = Math.min(1, (now - start.current) / RESET_HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        start.current = null;
        doneRef.current();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const left = Math.ceil((1 - progress) * (RESET_HOLD_MS / 1000));
  return (
    <button
      type="button"
      className="relative flex min-h-[64px] w-full items-center gap-3 overflow-hidden rounded-[12px] px-4 py-2 text-left"
      style={{ ...CREAM_CARD, boxShadow: `inset 0 0 0 2px ${withAlpha(C.seal, 0.55)}, ${cardShadow()}`, WebkitTapHighlightColor: 'transparent', touchAction: 'none' }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        begin();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && stop()}
      onBlur={stop}
      onContextMenu={(e) => e.preventDefault()}
      data-button="reset"
      data-holding={progress > 0 ? '' : undefined}
    >
      <span aria-hidden="true" className="flex shrink-0">
        <ResetIcon />
      </span>
      <span className="min-w-0 flex-1 font-black tracking-[0.04em]" style={{ fontSize: 20 * k, lineHeight: 1.25, color: C.sealInk }}>
        {UI.settings.reset}
      </span>
      {progress > 0 && (
        <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full font-num font-semibold" style={{ backgroundColor: C.seal, color: C.sealGlyph, fontSize: 24 * k }} aria-live="polite">
          {left}
        </span>
      )}
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[6px] origin-left" style={{ backgroundColor: C.seal, transform: `scaleX(${progress})` }} data-reset-bar="" />
    </button>
  );
}

/** A cream index card holding a group of rows. */
function Card({ children, tilt = 0, className = '', style }: { children: ReactNode; tilt?: number; className?: string; style?: CSSProperties }) {
  return (
    <section className={`relative w-full rounded-[8px] px-4 py-1 ${className}`} style={{ ...CREAM_CARD, transform: tilt ? `rotate(${tilt}deg)` : undefined, ...style }}>
      {children}
    </section>
  );
}

const rule = { borderTop: `1.5px dashed ${withAlpha(C.pageEdge, 0.9)}` };

export function Settings({ settings: s, osReduced, onChange, onReset, onBack, still = false }: SettingsProps) {
  const k = useTextScale();
  const shown = effectiveSettings(s, { osReduced });
  const held = (key: keyof SettingsValue) => heldByElder(s, key);
  const speeds = UI.settings.speeds.map((text, i) => ({ value: i as 0 | 1 | 2, text }));
  const sizes = UI.settings.textSizes.map((text, i) => ({ value: i === 1, text }));
  const hints: readonly ChoiceOption<0 | 15 | 30>[] = [
    { value: 0, text: UI.settings.autoHints[0] },
    { value: 30, text: UI.settings.autoHints[1] },
    { value: 15, text: UI.settings.autoHints[2] },
  ];
  const turnTilt = (on: boolean) => {
    if (!on) return onChange({ tilt: false });
    // iOS shares the gyro only when asked from a tap
    void askTiltPermission().then((ok) => ok && onChange({ tilt: true }));
  };

  return (
    <main
      className="fixed inset-0 select-none overflow-y-auto overflow-x-hidden font-body"
      lang="zh-Hant"
      style={{ backgroundColor: C.coverDark, color: C.ink }}
      data-screen="settings"
      data-screen-ready=""
      data-still={still ? '' : undefined}
      data-elder={s.elder ? '' : undefined}
    >
      {/* The endpaper stays put while the cards scroll over it */}
      <div className="fixed inset-0">
        <Endpaper />
      </div>
      <div className="relative mx-auto flex w-full max-w-[390px] flex-col items-center gap-4 px-[14px] pb-10 pt-3">
        <header className="flex w-full items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            data-button="back"
            className="kit-press flex min-h-[56px] items-center gap-1 rounded-[12px] pl-1 pr-3"
            style={{ ...CREAM_CARD, WebkitTapHighlightColor: 'transparent' }}
          >
            <BackIcon />
            <span className="whitespace-nowrap font-black tracking-[0.1em]" style={{ fontSize: 20 * k }}>
              {UI.settings.back}
            </span>
          </button>
          <h1 className={`ml-auto mr-auto -rotate-[0.8deg] whitespace-nowrap rounded-[3px] py-1 font-serif font-black ${k > 1 ? 'px-5 tracking-[0.25em]' : 'px-7 tracking-[0.4em]'}`} style={{ ...CREAM_CARD, boxShadow: cardShadow(0.8), fontSize: 30 * k }}>
            {UI.settings.title}
          </h1>
          <span className="w-[56px]" aria-hidden="true" />
        </header>

        {/* 長輩模式: one switch for several things */}
        <Card tilt={-0.5} className="pb-4 pt-3" style={{ boxShadow: `inset 5px 0 0 ${C.seal}, ${cardShadow()}` }}>
          <span aria-hidden="true" className="absolute -top-[9px] left-[18px] h-[18px] w-[64px] -rotate-[4deg]" style={{ backgroundColor: withAlpha(C.washiPink, 0.85) }} />
          <span aria-hidden="true" className="absolute -top-[8px] right-[22px] h-[18px] w-[56px] rotate-[5deg]" style={{ backgroundColor: withAlpha(C.washiCeladon, 0.85) }} />
          <div className="flex items-start gap-3 pb-1 pt-2" data-setting="elder">
            <span aria-hidden="true" className="flex shrink-0 pt-1">
              <ElderIcon />
            </span>
            <div className="flex min-w-0 flex-col">
              <h2 className="font-serif font-black tracking-[0.12em]" style={{ fontSize: 26 * k, lineHeight: 1.2, color: C.sealInk }}>
                {UI.settings.elder}
              </h2>
              <p className="font-bold" style={{ fontSize: 20 * k, lineHeight: 1.25, color: C.inkSoft }}>
                {UI.settings.elderSummary}
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Choice label={UI.settings.elder} options={ON_OFF} value={s.elder} onPick={(elder) => onChange({ elder })} testId="elder" />
          </div>
        </Card>

        <Card tilt={0.3}>
          <Row icon={<SpeedIcon />} label={UI.settings.speed} note={held('speed') && <HeldNote />} testId="speed">
            <Choice label={UI.settings.speed} options={speeds} value={shown.speed} onPick={(speed) => onChange({ speed })} locked={held('speed')} testId="speed" />
          </Row>
          <div style={rule} />
          <Row icon={<TextSizeIcon />} label={UI.settings.textSize} note={held('bigText') && <HeldNote />} testId="text-size">
            <Choice label={UI.settings.textSize} options={sizes} value={shown.bigText} onPick={(bigText) => onChange({ bigText })} locked={held('bigText')} testId="text-size" />
          </Row>
          <div style={rule} />
          <Row icon={<AutoHintIcon />} label={UI.settings.autoHint} note={held('autoHint') && <HeldNote />} testId="auto-hint">
            <Choice label={UI.settings.autoHint} options={hints} value={shown.autoHint} onPick={(autoHint) => onChange({ autoHint })} locked={held('autoHint')} testId="auto-hint" />
          </Row>
        </Card>

        <Card tilt={-0.3}>
          <Row icon={<SoundIcon />} label={UI.settings.sound} testId="sfx">
            <Volume label={UI.settings.sound} value={s.sfx} onChange={(sfx) => onChange({ sfx })} testId="sfx" />
          </Row>
          <div style={rule} />
          <Row icon={<MusicIcon />} label={UI.settings.music} testId="music">
            <Volume label={UI.settings.music} value={s.music} onChange={(music) => onChange({ music })} testId="music" />
          </Row>
        </Card>

        <Card tilt={0.25}>
          <Row icon={<VibrateIcon />} label={UI.settings.vibration} testId="vibrate">
            <Choice label={UI.settings.vibration} options={ON_OFF} value={s.vibrate} onPick={(vibrate) => onChange({ vibrate })} testId="vibrate" />
          </Row>
          <div style={rule} />
          <Row icon={<MotionIcon />} label={UI.settings.reduceMotion} note={s.reduceMotion === null && <Note>{UI.settings.followsSystem}</Note>} testId="reduce-motion">
            <Choice label={UI.settings.reduceMotion} options={ON_OFF} value={shown.reduceMotion} onPick={(reduceMotion) => onChange({ reduceMotion })} testId="reduce-motion" />
          </Row>
          <div style={rule} />
          <Row icon={<LeftHandIcon />} label={UI.settings.leftHand} testId="left-hand">
            <Choice label={UI.settings.leftHand} options={ON_OFF} value={s.leftHand} onPick={(leftHand) => onChange({ leftHand })} testId="left-hand" />
          </Row>
          <div style={rule} />
          <Row icon={<TiltIcon />} label={UI.settings.tilt} note={s.elder && <HeldNote />} testId="tilt">
            <Choice label={UI.settings.tilt} options={ON_OFF} value={s.elder ? false : s.tilt === true} onPick={turnTilt} locked={s.elder} testId="tilt" />
          </Row>
        </Card>

        <HoldToReset onDone={onReset} />
      </div>
    </main>
  );
}
