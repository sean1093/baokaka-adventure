import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { POPUP as C } from '../../../art/palette';
import { clock, pageLabel, report, summarize, type PlaytestLog } from '../../game/playtest';

/**
 * The playtest log's overlay (#110; `#/?debug=metrics`, `docs/playtest/README.md`): a small
 * chip in the top corner with the open page and its live time, a ★ for the observer to mark a
 * moment, and the log as copyable text. It is the observer's tool, not the player's: it stays small
 * and quiet, and while the log is open the page is held (the shell counts that time as not live).
 * Nothing is sent anywhere; 「複製」 puts the text on the clipboard, 「下載」 saves a .txt.
 */

export interface PlaytestPanelProps {
  readonly log: PlaytestLog;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

function deviceLine(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent.replace(/\s+/g, ' ').slice(0, 160);
}

const viewport = () => (typeof window === 'undefined' ? '' : `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`);

/** Copies with the async clipboard, falling back to a hidden textarea (older iOS, http) */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function download(text: string, now: number): void {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `popup-playtest-${new Date(now).toISOString().slice(0, 16).replace(/[:T]/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // Nothing to do: 「複製」 still works
  }
}

export function PlaytestPanel({ log, open, onOpenChange }: PlaytestPanelProps) {
  const events = useSyncExternalStore(log.subscribe, log.get);
  // The chip's clock ticks once a second
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const current = useMemo(() => {
    const all = summarize(events, now);
    return all.length > 0 ? all[all.length - 1] : null;
  }, [events, now]);
  const text = useMemo(() => (open ? report(events, { now, device: deviceLine(), viewport: viewport() }) : ''), [open, events, now]);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    if (!open) setConfirmClear(false);
  }, [open]);
  const flash = (s: string) => {
    setStatus(s);
    window.setTimeout(() => setStatus(null), 1600);
  };
  const mark = () => {
    log.add({ t: 'mark', at: Date.now() });
    flash('★');
  };

  const chipStyle = { backgroundColor: C.ink, color: C.sealGlyph };
  const button = 'rounded-md px-3 py-2 text-[15px] font-bold';
  return (
    <>
      <div className="fixed left-1/2 z-[70] flex -translate-x-1/2 gap-1 opacity-80" style={{ top: 'env(safe-area-inset-top)' }} data-playtest-chip="">
        <button
          type="button"
          className="flex h-[22px] items-center gap-1.5 rounded-b-lg px-2.5 font-num text-[12px] font-semibold tabular-nums"
          style={chipStyle}
          onClick={() => onOpenChange(!open)}
          aria-label="Playtest log"
          data-playtest-toggle=""
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.seal }} aria-hidden={true} />
          {current ? `${pageLabel(current.page)} ${clock(current.activeMs)}${current.done ? ' ✓' : ''}` : 'log'}
        </button>
        <button type="button" className="h-[22px] w-8 rounded-b-lg text-[13px]" style={chipStyle} onClick={mark} aria-label="Mark this moment" data-playtest-mark="">
          {status === '★' ? '✓' : '★'}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-[69] flex items-end justify-center p-3" style={{ backgroundColor: 'rgba(20, 12, 24, 0.55)' }} onClick={() => onOpenChange(false)} data-playtest-panel="">
          <div
            className="flex max-h-[78vh] w-full max-w-[560px] flex-col gap-2 rounded-xl p-3 shadow-xl"
            style={{ backgroundColor: C.page, color: C.ink }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal={true}
            aria-label="Playtest log"
          >
            <div className="flex items-baseline justify-between">
              <strong className="text-[16px]">Playtest log · {events.length} events</strong>
              <span className="text-[13px]">{status && status !== '★' ? status : 'on this phone only'}</span>
            </div>
            <pre className="min-h-0 flex-1 overflow-auto whitespace-pre rounded-md bg-white/70 p-2 font-mono text-[11px] leading-snug" data-playtest-report="">
              {text}
            </pre>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} style={{ backgroundColor: C.marigold, color: C.ink }} onClick={() => void copyText(text).then((ok) => flash(ok ? '已複製 Copied' : '複製失敗 Copy failed'))} data-playtest-copy="">
                複製 Copy
              </button>
              <button type="button" className={button} style={{ outline: `1px solid ${C.ink}` }} onClick={() => download(text, now)}>
                下載 Save
              </button>
              <button type="button" className={button} style={{ outline: `1px solid ${C.ink}` }} onClick={mark}>
                ★ 標記 Mark
              </button>
              <button
                type="button"
                className={button}
                style={{ outline: `1px solid ${confirmClear ? C.sealInk : C.ink}`, color: confirmClear ? C.sealInk : C.ink }}
                onClick={() => {
                  if (!confirmClear) return setConfirmClear(true);
                  log.clear();
                  setConfirmClear(false);
                  flash('已清除 Cleared');
                }}
                data-playtest-clear=""
              >
                {confirmClear ? '再按一次清除 Tap again' : '清除 Clear'}
              </button>
              <button type="button" className={`${button} ml-auto`} style={{ outline: `1px solid ${C.ink}` }} onClick={() => onOpenChange(false)}>
                關閉 Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
