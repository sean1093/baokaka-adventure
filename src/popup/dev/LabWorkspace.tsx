import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { PAGELAB, POPUP, withAlpha } from '../../art/palette';
import { SCRIPT } from '../content/script';
import { lintPage, type LintIssue, type LintResult } from '../core/lint';
import { initialState } from '../core/state';
import type { Point } from '../core/graph';
import type { Id, Input, PageDef } from '../core/types';
import { TICK_MS, type TickSpeed } from '../game/session';
import { lintAffordance } from '../view/affordance/lint';
import { PART_SETTLE_MS } from '../view/interp';
import { PageView, VIEW_BOX } from '../view/PageView';
import { copyTs } from './copyTs';
import { OVERLAYS, toggle, type LabParams, type Overlay } from './labParams';
import {
  artReport,
  compactInputs,
  eventLabel,
  idleState,
  inputLabel,
  labLoad,
  labStep,
  legalInputs,
  moveNode,
  moveTrackEnd,
  pageBadge,
  touchableCount,
  type LabSim,
  type PageBadge,
} from './labModel';
import { LAB_FIXTURES, LAB_PAGES, labPageById } from './labPages';
import { Overlays } from './Overlays';
import { useSolver } from './useSolver';

/**
 * The PageLab workspace (GDD § 3.10, #91): the page list with solver badges on the left, the page
 * with its overlays in the centre, and the panels on the right — controls and the input palette,
 * the solver, live lint, readability and art keys, edit mode with 「Copy TS」, and the state
 * inspector. Everything it shows is reproducible from the URL (`labParams.ts`). Desktop-first: on
 * a phone the columns stack.
 *
 * The lab runs its own stepper (`labModel.ts`) rather than a `PageSession`: it must load any state
 * (a dead end), step one tick at a time and keep a log. Ticks animate like the game's (`PageView`
 * with the time since the tick).
 */

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};
const readWidth = () => window.innerWidth;

/** Badge colours (the worst problem wins; `labModel.pageBadge`). */
const BADGE_COLOR: Readonly<Record<PageBadge, string>> = {
  pending: PAGELAB.badgePending,
  ok: PAGELAB.badgeOk,
  'dead-end': PAGELAB.badgeBad,
  'over cap': PAGELAB.badgeBad,
  lint: PAGELAB.badgeBad,
  fail: PAGELAB.badgeBad,
};

const OVERLAY_LABEL: Readonly<Record<Overlay, string>> = {
  nodes: 'nodes',
  edges: 'edges',
  perches: 'perches + cat edges',
  attractors: 'attractors',
  hits: 'hit areas',
  target: 'target + path',
};

/** A titled panel on the right. */
function Panel({ title, children, data }: { title: string; children: ReactNode; data?: string }) {
  return (
    <section className="rounded-panel p-3" style={{ backgroundColor: POPUP.page, color: POPUP.ink, boxShadow: `0 1px 3px ${withAlpha(POPUP.shadow, 0.35)}` }} data-panel={data}>
      <h2 className="mb-2 text-sm font-black uppercase tracking-wide" style={{ color: POPUP.inkSoft }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Btn({ onClick, children, active, disabled, data }: { onClick: () => void; children: ReactNode; active?: boolean; disabled?: boolean; data?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-[32px] rounded border px-2 py-1 text-sm font-bold disabled:opacity-40"
      style={{ borderColor: POPUP.inkSoft, backgroundColor: active ? POPUP.ink : POPUP.cutRim, color: active ? POPUP.page : POPUP.ink }}
      data-action={data}
    >
      {children}
    </button>
  );
}

function Badge({ badge }: { badge: PageBadge }) {
  return (
    <span className="whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-black" style={{ backgroundColor: BADGE_COLOR[badge], color: POPUP.cutRim }} data-badge={badge}>
      {badge}
    </span>
  );
}

function Issues({ issues }: { issues: readonly LintIssue[] }) {
  return (
    <ul className="space-y-1 text-xs">
      {issues.map((i, n) => (
        <li key={n} style={{ color: i.severity === 'error' ? PAGELAB.badgeBad : PAGELAB.badgeWarn }}>
          <b>{i.code}</b> {i.message}
        </li>
      ))}
    </ul>
  );
}

const yesNo = (b: boolean) => (b ? '✓' : '✗');

export function LabWorkspace({ params, setParams }: { params: LabParams; setParams: (p: Partial<LabParams>) => void }) {
  const base = labPageById(params.page ?? '') ?? LAB_PAGES[0];
  const [edited, setEdited] = useState<PageDef | null>(null);
  const def = edited ?? base;
  const overlays = useMemo(() => new Set(params.overlays), [params.overlays]);

  // ——— The stepper ———
  const [sim, setSimState] = useState<LabSim>(() => labLoad(idleState(base, params.tick)));
  const simRef = useRef(sim);
  const queue = useRef<Input[]>([]);
  const [queued, setQueued] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tickAt, setTickAt] = useState(-Infinity);
  const [ms, setMs] = useState(1e9);
  const tickMs = TICK_MS[params.speed];

  const setSim = useCallback((next: LabSim, animate: boolean) => {
    simRef.current = next;
    setSimState(next);
    setTickAt(animate ? performance.now() : -Infinity);
  }, []);
  const setQueue = (inputs: Input[]) => {
    queue.current = inputs;
    setQueued(inputs.length);
  };

  // A new page or start tick: a fresh load, no edits
  useEffect(() => {
    setEdited(null);
    setPlaying(false);
    setQueue([]);
    setSim(labLoad(idleState(base, params.tick)), false);
  }, [base, params.tick, setSim]);

  const advance = useCallback(
    (input?: Input) => {
      const next = input ?? queue.current[0] ?? { t: 'none' };
      if (input === undefined && queue.current.length > 0) setQueue(queue.current.slice(1));
      const after = labStep(def, simRef.current, next);
      setSim(after, true);
      if (after.state.done || after.error) setPlaying(false);
    },
    [def, setSim],
  );

  useEffect(() => {
    if (!playing) return;
    const h = window.setInterval(() => advance(), tickMs);
    return () => window.clearInterval(h);
  }, [playing, tickMs, advance]);

  // Animate a tick until its pieces land, then sleep
  useEffect(() => {
    if (tickAt === -Infinity) {
      setMs(1e9);
      return;
    }
    let raf = 0;
    const loop = () => {
      const now = performance.now() - tickAt;
      setMs(now);
      if (now < Math.max(tickMs, PART_SETTLE_MS)) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tickAt, tickMs]);

  const reset = () => {
    setPlaying(false);
    setQueue([]);
    setSim(labLoad(idleState(def, params.tick)), false);
  };
  const apply = (input: Input) => {
    if (playing) setQueue([...queue.current, input]);
    else advance(input);
  };

  // ——— Solver (off the main thread) ———
  const { reports, run, solve, clear } = useSolver();
  useEffect(clear, [base, clear]);
  const solveFromStart = () => solve(def, initialState(def), edited !== null, true);
  const solveFromHere = () => solve(def, sim.state, edited !== null, false);
  const playSolution = (inputs: readonly Input[]) => {
    if (!run) return;
    setSim(labLoad(run.from), false);
    setQueue([...inputs]);
    setPlaying(true);
  };

  // ——— Lint, live on every edit ———
  const lint = useMemo(() => lintPage(def, SCRIPT), [def]);
  // The affordance lint (#140) reads what the stage actually drew, after each state lands
  const stageRef = useRef<HTMLDivElement>(null);
  const [artLint, setArtLint] = useState<LintResult | null>(null);
  useEffect(() => {
    const svg = stageRef.current?.querySelector('svg[data-page]');
    setArtLint(svg ? lintAffordance(def, svg.outerHTML) : null);
  }, [def, sim.state]);

  // ——— Edit mode ———
  const onMoveNode = useCallback((id: Id, to: Point) => setEdited((d) => moveNode(d ?? base, simRef.current.state, id, to)), [base]);
  const onMoveTrack = useCallback((part: Id, end: 'from' | 'to', to: Point) => setEdited((d) => moveTrackEnd(d ?? base, part, end, to)), [base]);
  const ts = useMemo(() => copyTs(def), [def]);
  const [copied, setCopied] = useState('');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ts);
      setCopied('copied');
    } catch {
      setCopied('clipboard blocked: copy from the box');
    }
  };

  // ——— Layout: desktop-first, stacked on phones ———
  const vw = useSyncExternalStore(subscribeResize, readWidth, () => 1280);
  const wide = vw >= 1100;
  const stageW = wide ? Math.min(620, vw - 240 - 440 - 48) : vw - 32;
  const scale = Math.max(0.5, stageW / VIEW_BOX.w);
  const grey = params.views.includes('grey');
  const squint = params.views.includes('squint');
  const count = touchableCount(def, sim.state);
  const art = artReport(def);
  const palette = legalInputs(def, sim.state);
  const result = run?.result;

  const pageList = (
    <nav className="flex flex-col gap-1" data-pagelab-pages="">
      {LAB_PAGES.map((p) => {
        const report = reports[p.id];
        const current = p.id === def.id;
        return (
          <div key={p.id} className="contents">
            {p === LAB_FIXTURES[0] && (
              <h2 className="mt-3 px-2 text-xs font-black uppercase tracking-wide" style={{ color: POPUP.gold }}>
                lab fixtures (broken on purpose)
              </h2>
            )}
            <button
              type="button"
              onClick={() => setParams({ page: p.id, tick: 0 })}
              className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm"
              style={{ backgroundColor: current ? POPUP.page : 'transparent', color: current ? POPUP.ink : POPUP.goldLight }}
              aria-current={current ? 'page' : undefined}
              data-page-item={p.id}
            >
              <span>
                <b className="font-num">{`${p.chapter}-${p.index}`}</b> {p.title}
                {report && <span className="block text-xs opacity-75">{`par ${report.par ?? '–'} · ${report.states} st · ${report.ms} ms`}</span>}
              </span>
              <Badge badge={pageBadge(report)} />
            </button>
          </div>
        );
      })}
    </nav>
  );

  const stage = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm" style={{ color: POPUP.goldLight }} data-pagelab-overlay-toggles="">
        {OVERLAYS.map((o) => (
          <label key={o} className="flex items-center gap-1">
            <input type="checkbox" checked={overlays.has(o)} onChange={(e) => setParams({ overlays: toggle(params.overlays, o, e.target.checked) })} data-overlay-toggle={o} />
            {OVERLAY_LABEL[o]}
          </label>
        ))}
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={params.edit} onChange={(e) => setParams({ edit: e.target.checked })} data-edit-toggle="" />
          <b>edit</b>
        </label>
      </div>
      <div className="relative self-start overflow-hidden" style={{ width: VIEW_BOX.w * scale, height: VIEW_BOX.h * scale }} data-pagelab-stage={def.id} data-tick={sim.state.tick}>
        <div ref={stageRef} style={{ filter: grey ? 'grayscale(1)' : undefined }}>
          <PageView def={def} prev={sim.prev} state={sim.state} ms={ms} tickMs={tickMs} scale={scale} reduced={false} />
        </div>
        <Overlays def={def} state={sim.state} overlays={overlays} scale={scale} edit={params.edit} onMoveNode={onMoveNode} onMoveTrack={onMoveTrack} />
      </div>
      {squint && (
        <figure className="self-start" data-pagelab-squint="">
          <div style={{ filter: grey ? 'grayscale(1)' : undefined }}>
            <PageView def={def} prev={sim.state} state={sim.state} ms={1e9} tickMs={tickMs} scale={0.25} reduced />
          </div>
          <figcaption className="text-xs" style={{ color: POPUP.goldLight }}>
            squint 25 %: only the marigold parts and the two standees should read
          </figcaption>
        </figure>
      )}
    </div>
  );

  const panels = (
    <div className="flex flex-col gap-3">
      <Panel title="Controls" data="controls">
        <div className="flex flex-wrap items-center gap-2">
          <Btn onClick={reset} data="reset">
            ⟲ reset
          </Btn>
          <Btn onClick={() => setPlaying((p) => !p)} active={playing} disabled={sim.state.done} data="play">
            {playing ? '❚❚ pause' : '▶ play'}
          </Btn>
          <Btn onClick={() => advance()} disabled={playing || sim.state.done} data="tick">
            +1 tick
          </Btn>
          <select
            value={params.speed}
            onChange={(e) => setParams({ speed: e.target.value as TickSpeed })}
            className="rounded border px-1 py-1 text-sm"
            style={{ borderColor: POPUP.inkSoft, backgroundColor: POPUP.cutRim, color: POPUP.ink }}
            aria-label="speed"
          >
            {(Object.keys(TICK_MS) as TickSpeed[]).map((s) => (
              <option key={s} value={s}>{`${s} (${TICK_MS[s]} ms)`}</option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs" style={{ color: POPUP.inkSoft }}>
          {`tick ${sim.state.tick} · baby ${sim.state.baby.node} (${sim.state.baby.mode}) · queued ${queued}${sim.state.done ? ' · DONE' : ''}`}
        </p>
        {sim.error && (
          <p className="mt-1 text-xs" style={{ color: PAGELAB.badgeBad }}>
            {sim.error}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1" data-pagelab-palette="">
          {palette.length === 0 && <span className="text-xs">no legal inputs</span>}
          {palette.map((input) => (
            <Btn key={inputLabel(input)} onClick={() => apply(input)} data="input">
              {inputLabel(input)}
            </Btn>
          ))}
        </div>
      </Panel>

      <Panel title="Solver" data="solver">
        <div className="flex flex-wrap gap-2">
          <Btn onClick={solveFromStart} disabled={run?.status === 'running'} data="solve">
            run from start
          </Btn>
          <Btn onClick={solveFromHere} disabled={run?.status === 'running' || sim.state.done} data="solve-here">
            run from here
          </Btn>
        </div>
        <div className="mt-2 text-sm" data-solver-status={run?.status ?? 'idle'}>
          {run === null && <p className="text-xs">Runs in a worker. Badges on the left are the full report per page.</p>}
          {run?.status === 'running' && <p>solving…</p>}
          {run?.status === 'error' && <p style={{ color: PAGELAB.badgeBad }}>{run.error}</p>}
          {result && (
            <>
              <p data-solver-par={result.par ?? ''}>
                <b>{result.solvable ? `par ${result.par}` : 'not solvable'}</b>
                {` · ${result.statesExplored.toLocaleString('en-US')} states · ${Math.round(result.ms ?? 0)} ms`}
                {result.stop && ` · stopped: ${result.stop}`}
              </p>
              <p className="text-xs">{`淘氣 ${yesNo(result.mischiefReachable)} · 土地公 ${yesNo(result.tudigongReachable)} · trivial ${yesNo(result.trivial)}`}</p>
              {result.error && <p className="text-xs" style={{ color: PAGELAB.badgeBad }}>{result.error.message}</p>}
              {result.solution && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <b className="text-xs">shortest solution</b>
                    <Btn onClick={() => playSolution(result.solution!)} data="play-solution">
                      ▶ play it
                    </Btn>
                  </div>
                  <ol className="mt-1 flex flex-wrap gap-1 text-xs">
                    {compactInputs(result.solution).map((s, i) => (
                      <li key={i} className="rounded px-1" style={{ backgroundColor: s.startsWith('wait') ? 'transparent' : POPUP.pageDark }}>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="mt-2" data-dead-ends={result.deadEndCount ?? ''}>
                <b className="text-xs" style={{ color: result.deadEndCount ? PAGELAB.badgeBad : undefined }}>
                  {`dead ends: ${result.deadEndCount ?? 'unknown (incomplete search)'}`}
                </b>
                <ul className="mt-1 max-h-56 space-y-1 overflow-auto">
                  {result.deadEnds.map((d, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="text-left text-xs underline"
                        style={{ color: PAGELAB.badgeBad }}
                        onClick={() => {
                          setPlaying(false);
                          setQueue([]);
                          setSim(labLoad(d.state), false);
                        }}
                        data-dead-end={i}
                      >
                        {`load #${i + 1}: ${compactInputs(d.path).join(', ') || '(start)'}`}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </Panel>

      <Panel title={`Lint · ${lint.errors.length} errors · ${lint.warnings.length} warnings`} data="lint">
        {lint.errors.length + lint.warnings.length === 0 ? <p className="text-xs" style={{ color: PAGELAB.badgeOk }}>clean</p> : <Issues issues={[...lint.errors, ...lint.warnings]} />}
      </Panel>

      <Panel title={`Affordance lint · ${artLint?.errors.length ?? '–'} errors · ${artLint?.warnings.length ?? '–'} warnings`} data="affordance-lint">
        {artLint === null ? null : artLint.errors.length + artLint.warnings.length === 0 ? (
          <p className="text-xs" style={{ color: PAGELAB.badgeOk }}>
            clean: marigold reserved, four cues on every touchable, hit areas ≥ 48 px at 390×844
          </p>
        ) : (
          <Issues issues={[...artLint.errors, ...artLint.warnings]} />
        )}
      </Panel>

      <Panel title="Readability · art keys" data="readability">
        <div className="flex flex-wrap gap-3 text-sm">
          {(['grey', 'squint'] as const).map((v) => (
            <label key={v} className="flex items-center gap-1">
              <input type="checkbox" checked={params.views.includes(v)} onChange={(e) => setParams({ views: toggle(params.views, v, e.target.checked) })} data-view-toggle={v} />
              {v === 'grey' ? 'greyscale' : 'squint 25 %'}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs" data-touchables={count.total} style={{ color: count.limit !== null && count.total > count.limit ? PAGELAB.badgeBad : undefined }}>
          {`touchables now: ${count.parts} parts + ${count.perches} perches = ${count.total}${count.limit === null ? '' : ` (≤ ${count.limit} on pages 1–3)`}`}
        </p>
        <table className="mt-2 w-full text-xs">
          <tbody>
            {art.map((row) => (
              <tr key={`${row.kind}:${row.id}`} data-art-status={row.status}>
                <td className="pr-2">{row.kind}</td>
                <td className="pr-2">{row.id}</td>
                <td className="pr-2 font-mono">{row.key}</td>
                <td style={{ color: row.status === 'baked' ? PAGELAB.badgeOk : PAGELAB.badgeWarn }}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Edit" data="edit">
        <p className="text-xs">{params.edit ? 'Drag nodes and track ends on the page. Lint re-runs on every move.' : 'Tick “edit” above the page to drag nodes and track ends.'}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Btn onClick={copy} data="copy-ts">
            Copy TS
          </Btn>
          <Btn onClick={() => setEdited(null)} disabled={edited === null} data="discard-edits">
            discard edits
          </Btn>
          <span className="text-xs">{edited ? `edited${copied ? ` · ${copied}` : ''}` : copied}</span>
        </div>
        {(params.edit || edited) && <textarea readOnly value={ts} className="mt-2 h-32 w-full rounded border p-1 font-mono text-xs" style={{ borderColor: POPUP.inkSoft, backgroundColor: POPUP.cutRim }} data-copy-ts="" />}
      </Panel>

      <Panel title="State" data="state">
        <b className="text-xs">event log (last 20 ticks)</b>
        <ol className="mb-2 max-h-48 overflow-auto font-mono text-xs" data-event-log={sim.log.length}>
          {sim.log.length === 0 && <li>—</li>}
          {[...sim.log].reverse().map((t) => (
            <li key={t.tick}>
              <b>{`t${t.tick} ${inputLabel(t.input)}`}</b>
              {t.events.length > 0 && `: ${t.events.map(eventLabel).join(' · ')}`}
            </li>
          ))}
        </ol>
        <b className="text-xs">SimState</b>
        <pre className="max-h-72 overflow-auto rounded p-1 text-xs" style={{ backgroundColor: POPUP.cutRim }} data-sim-state="">
          {JSON.stringify(sim.state, null, 1)}
        </pre>
      </Panel>
    </div>
  );

  return (
    <div
      className={wide ? 'grid items-start gap-4 px-4 pb-8' : 'flex flex-col gap-4 px-4 pb-8'}
      style={wide ? { gridTemplateColumns: `220px ${stageW}px minmax(360px, 1fr)` } : undefined}
      data-pagelab-lab={def.id}
    >
      {pageList}
      {stage}
      {panels}
    </div>
  );
}
