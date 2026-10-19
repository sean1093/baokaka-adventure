import { useMemo, useSyncExternalStore, type CSSProperties } from 'react';
import { POPUP, withAlpha } from '../art/palette';
import { hashParams } from '../shared/route';
import { initialState, replay, step } from './core';
import type { Input, PageDef, SimState } from './core/types';
import { TICK_MS, type TickSpeed } from './game/session';
import { pageById } from './pages';
import { PagePlayer } from './view/PagePlayer';

/**
 * 翻翻台北 Pop-Up Taipei, served at `#/popup` (unlinked) until the routing switch (#109) makes it
 * `#/`. For now a placeholder (#79): one cream page on the navy linen cover, with the title and
 * 「開發中」. The real screens (cover, 目錄, chapter card, page …) arrive in `view/screens/` (GDD
 * § 2.13). App lazy-loads this module so the RPG's bundle does not carry it.
 *
 * `#/popup?page=c1p2` plays one page (#89; a dev convenience: production will open the save's
 * current page, #93). Also `tick=N` (start N idle ticks in), `paused=1` (hold the clock),
 * `speed=slow|normal|fast` and `demo=1` (after three idle ticks, play the page's authored solution
 * through the session). The page is playable by touch and mouse (#90).
 */

/** The cover: navy linen, a fine weave and a vignette (popup art bible § 7). */
const cover: CSSProperties = {
  backgroundColor: POPUP.cover,
  backgroundImage: [
    `radial-gradient(ellipse at 50% 42%, transparent 40%, ${withAlpha(POPUP.coverDark, 0.85)} 100%)`,
    `repeating-linear-gradient(0deg, ${withAlpha(POPUP.coverLight, 0.35)} 0 1px, transparent 1px 3px)`,
    `repeating-linear-gradient(90deg, ${withAlpha(POPUP.coverDark, 0.45)} 0 1px, transparent 1px 3px)`,
  ].join(','),
};

/** A cream page with its cut edge and an indigo (never black) shadow (bible § 2.2, § 3.2). */
const page: CSSProperties = {
  backgroundColor: POPUP.page,
  backgroundImage: `linear-gradient(180deg, ${POPUP.page} 0%, ${POPUP.page} 62%, ${POPUP.pageDark} 100%)`,
  color: POPUP.ink,
  boxShadow: [
    `inset 1px 1px 0 ${withAlpha(POPUP.cutRim, 0.42)}`,
    `inset -1px -1px 0 ${POPUP.pageEdge}`,
    `0 2px 3px ${withAlpha(POPUP.shadow, 0.45)}`,
    `0 18px 36px ${withAlpha(POPUP.shadow, 0.55)}`,
  ].join(','),
};

const foil: CSSProperties = { borderColor: withAlpha(POPUP.gold, 0.7) };

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};
const readHash = () => window.location.hash;

/** Three idle ticks (he sets off and reaches), then the page's authored solution, one input per tick. */
function demoScript(def: PageDef): Input[] {
  const lead: Input[] = [{ t: 'none' }, { t: 'none' }, { t: 'none' }];
  const idle = idleTicks(def, lead.length);
  return [...lead, ...replay(def, def.solution, idle).ticks.map((t) => t.input)];
}

/** The state after `ticks` idle ticks (no input). */
function idleTicks(def: PageDef, ticks: number): SimState {
  let s = initialState(def);
  for (let i = 0; i < ticks; i++) s = step(def, s, { t: 'none' }).state;
  return s;
}

export default function PopupGame() {
  const params = hashParams(useSyncExternalStore(subscribe, readHash));
  const def = pageById(params.get('page') ?? '');
  const ticks = Math.max(0, Math.min(500, Number(params.get('tick')) || 0));
  const from = useMemo(() => (def && ticks > 0 ? idleTicks(def, ticks) : undefined), [def, ticks]);
  const speedParam = params.get('speed');
  const speed: TickSpeed = speedParam !== null && speedParam in TICK_MS ? (speedParam as TickSpeed) : 'normal';
  const demo = params.get('demo') === '1';
  const script = useMemo(() => (def && demo && ticks === 0 ? demoScript(def) : undefined), [def, demo, ticks]);
  if (def) return <PagePlayer key={`${def.id}-${ticks}-${demo}`} def={def} from={from} speed={speed} paused={params.get('paused') === '1'} script={script} />;
  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center gap-8 px-6" style={cover} lang="zh-Hant">
      <div className="pointer-events-none absolute inset-3 rounded-panel border" style={foil} aria-hidden="true" />
      <section className="flex w-full max-w-[320px] -rotate-[0.6deg] flex-col items-center gap-3 rounded-[3px] px-6 py-12" style={page}>
        <h1 className="whitespace-nowrap font-serif text-chapter tracking-[0.06em]">《翻翻台北》</h1>
        <p className="font-num text-body tracking-[0.12em]">Pop-Up Taipei</p>
      </section>
      <p className="pl-[0.3em] font-serif text-title tracking-[0.3em]" style={{ color: POPUP.goldLight }}>
        開發中
      </p>
    </main>
  );
}
