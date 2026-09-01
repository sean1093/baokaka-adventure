import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Level } from '../game/types';
import { BACKDROPS } from '../art/backdrops';
import { SPRITES } from '../art/sprites';
import { BigButton } from '../components/BigButton';
import { FoundTray } from '../components/FoundTray';
import { playTone } from '../game/audio';

/** 卡住幾秒後浮現提示光圈；再幾秒後變明顯（spec §7）。 */
const HINT_AFTER = 15;
const STRONG_HINT_AFTER = 30;
/** 找齊之後停在畫面上多久再翻到劇情頁（毫秒）。 */
const CLEARED_DELAY = 1200;

type Props = {
  level: Level;
  found: string[];
  soundOn: boolean;
  onFound: (targetId: string) => void;
  onCleared: () => void;
  onToggleSound: () => void;
};

export const SceneScreen = ({
  level,
  found,
  soundOn,
  onFound,
  onCleared,
  onToggleSound,
}: Props) => {
  const Backdrop = BACKDROPS[level.palette];
  const cleared = found.length === level.targets.length;

  const [idleSeconds, setIdleSeconds] = useState(0);
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);

  // 每找到一樣東西就重新計時；分頁在背景時不算（spec §7）
  useEffect(() => {
    setIdleSeconds(0);
    const timer = window.setInterval(() => {
      if (!document.hidden) setIdleSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [found.length, level.id]);

  const clearedHandler = useRef(onCleared);
  clearedHandler.current = onCleared;
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  useEffect(() => {
    if (!cleared) return;
    playTone('complete', soundRef.current);
    const timer = window.setTimeout(() => clearedHandler.current(), CLEARED_DELAY);
    return () => window.clearTimeout(timer);
  }, [cleared]);

  const hintStrength = cleared
    ? 0
    : idleSeconds >= STRONG_HINT_AFTER
      ? 2
      : idleSeconds >= HINT_AFTER
        ? 1
        : 0;
  const hintTargetId = level.targets.find((target) => !found.includes(target.id))?.id;

  const handleMiss = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setRipple({
      x: event.clientX - box.left,
      y: event.clientY - box.top,
      key: Date.now(),
    });
    playTone('tap', soundOn);
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col gap-2 py-2">
      <header className="flex items-center justify-between gap-3 px-3">
        <h1 className="text-body font-bold leading-tight">{level.title}</h1>
        <BigButton
          tone="quiet"
          onClick={onToggleSound}
          label={soundOn ? '關閉聲音' : '打開聲音'}
        >
          {soundOn ? '聲音 開' : '聲音 關'}
        </BigButton>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center px-3">
        <div
          className="relative mx-auto h-full max-h-[calc((100vw-1.5rem)*4/3)] w-auto overflow-hidden rounded-3xl border-4 border-ink"
          style={{ aspectRatio: '3 / 4' }}
        >
          <Backdrop />

          {/* 點到空白處：只有漣漪，沒有任何負面回饋（spec §7）。
              這一層在目標按鈕底下，所以點到目標時不會觸發。 */}
          <div className="absolute inset-0" onClick={handleMiss}>
            {ripple && (
              <span
                key={ripple.key}
                onAnimationEnd={() => setRipple(null)}
                className="ripple pointer-events-none absolute block h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                style={{ left: ripple.x, top: ripple.y }}
              />
            )}
          </div>

          {level.decor.map((placement, index) => {
            const Art = SPRITES[placement.sprite];
            return (
              <span
                key={`${placement.sprite}-${index}`}
                aria-hidden="true"
                className="pointer-events-none absolute block -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${placement.x * 100}%`,
                  top: `${placement.y * 100}%`,
                  width: `${placement.r * 200}%`,
                  aspectRatio: '1',
                  transform: `translate(-50%, -50%)${placement.flip ? ' scaleX(-1)' : ''}`,
                }}
              >
                <Art />
              </span>
            );
          })}

          {level.targets.map((target) => {
            const got = found.includes(target.id);
            const Art = SPRITES[target.sprite];
            const hinted = hintStrength > 0 && hintTargetId === target.id;
            return (
              <button
                key={target.id}
                type="button"
                aria-label={target.name}
                disabled={got}
                onClick={() => {
                  playTone('found', soundOn);
                  onFound(target.id);
                }}
                className="absolute block disabled:opacity-100"
                style={{
                  left: `${target.x * 100}%`,
                  top: `${target.y * 100}%`,
                  width: `${target.r * 200}%`,
                  aspectRatio: '1',
                  transform: `translate(-50%, -50%)${target.flip ? ' scaleX(-1)' : ''}`,
                }}
              >
                <span className={`block h-full w-full ${got ? 'pop' : ''}`}>
                  <Art />
                </span>
                {hinted && (
                  <span
                    className={[
                      'breathe pointer-events-none absolute -inset-2 rounded-full border-8',
                      hintStrength === 2 ? 'border-sun' : 'border-white',
                    ].join(' ')}
                  />
                )}
                {got && (
                  <span className="pointer-events-none absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full border-4 border-ink bg-leaf text-base font-bold text-white">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="px-3 text-center text-base font-bold">
        {cleared ? '三樣都找到了！' : '找出下面這三樣東西'}
      </p>
      <FoundTray targets={level.targets} found={found} />
    </div>
  );
};
