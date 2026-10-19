import { useMemo, type ReactNode } from 'react';
import { POPUP } from '../../art/palette';
import { useSvgIds } from '../../art/useSvgIds';
import { useReducedMotion } from '../../components/motion';
import { checkKnot, kitCtx, pawBadge, type KitCtx } from '../art';
import { attractorNode } from '../core/baby';
import { holds, partState } from '../core/cond';
import { partLocked, stepGrowth } from '../core/step';
import type { SimEvent } from '../core/events';
import { nodePos } from '../core/graph';
import { mochaNode, perchHidesMocha } from '../core/mocha';
import type { CreatureDef, Id, PageDef, PerchDef, SimState } from '../core/types';
import { spriteHead } from '../sprites';
import {
  Baby,
  Bubble,
  Creature,
  LAMP_GLOW_R,
  MOCHA_STATE_ANIM,
  Mocha,
  babyAnim,
  bubbleShow,
  chooseFrame,
  edgeKind,
  fadeSlide,
  flipScale,
  lookFacing,
  mochaAnim,
  noteFrameFallback,
  sayingWord,
  standeeTilt,
  stepT,
  travelDir,
} from './actors';
import './affordance/affordance.css';
import { haloShape, handGesture, linkThread } from './affordance/hints';
import { GhostHand, HintHalo, LinkThread } from './affordance/Hints';
import { NO_AFFORDANCE, wearsMarigold, type AffordanceFlags, type PartLook } from './affordance/look';
import { attractorArt, chapterSky, ledge, perchMark, perchPost, pottedPlant, rail, ramp, stageDefs, themeOf, trackPit, tudigong } from './art/placeholders';
import { backdropArt } from './art/registry';
import { BOOK_EXTENT, PAGE_W, type Hit, type Pt } from './geometry';
import { NO_GESTURE, minHit, targetsOf, type GestureFlags } from './gestures';
import { clamp01, drawnNodePos, easeInOut, lerpPt, offpagePoint, partProgress, stepPose } from './interp';
import { PRESET_Z, type LayerId } from './layers';
import { ArtG, r2 } from './parts/common';
import { CarriageView, MOVERS, PART_VIEWS, type MoverProps, type PartViewProps } from './parts';
import { foregroundSlot, stageOf } from './stage';

/**
 * The page renderer (GDD § 3.9; popup art bible § 2): one SVG in page units, layer by layer (see
 * `layers.ts`), drawn as a pure function of `(def, prev, state, ms)`: the state before and after
 * the latest tick and the time since it started. It never mutates the simulation, so PageLab can
 * scrub ticks and the session (`game/session.ts`) just hands it frames.
 *
 * Static layers (the backdrop, the ledges, the foreground card) are built once per page; moving
 * pieces are `data-anim` groups moved by `transform` only, with no filters (GDD § 3.9). The SVG's
 * own size is the caller's: it scales uniformly (`width`), and so do the hit areas inside it.
 *
 * Gestures (#90, `gestures.ts`) reach it as `gesture` flags: a part held between stops by a drag
 * (its riders follow), the dragged and the locked part (`data-dragging`, `data-locked` and a
 * wobble; their looks are below), Mocha's glare, Baokaka watching the finger, and
 * hold-to-reveal outlines. The hit layer draws every touchable's hit shape grown to 48 screen px
 * (`minHit`), the same shapes `hitTest` uses; a grown one is marked `data-hit-grown` (its own shape
 * is under 48 px at this scale; `npm run check:ui` forbids that at 390 × 844).
 *
 * Touchable states (#140, popup art bible § 4.1) come through `affordance` and the gesture: each
 * part view gets a `look` (its idle wiggle run, the drag's lift, the locked veil, the reduced-motion
 * double outline, 長輩模式 seals); a dragged part is drawn last in its layer (the next z); a locked
 * touchable wears the paw badge and a solved one the done knot; a hint draws the L1 halo behind
 * its target and, at L2, the vellum ghost hand over the page.
 */

/** The SVG's view box in page units: the page plus room for the floor page's widening and the page block. */
export const VIEW_BOX = { x: -30, y: BOOK_EXTENT.top - 12, w: PAGE_W + 60, h: BOOK_EXTENT.bottom - BOOK_EXTENT.top + 24 } as const;

export interface PageViewProps {
  readonly def: PageDef;
  /** The state before the latest tick (equal to `state` before the first tick) */
  readonly prev: SimState;
  readonly state: SimState;
  /** ms since the latest tick started (stands still while paused) */
  readonly ms: number;
  /** The tick's length in ms */
  readonly tickMs: number;
  /** Rendered width of the page (390 units) in CSS px; the default is 1:1 */
  readonly scale?: number;
  /** Override the reduced-motion setting (tests, PageLab); defaults to `useReducedMotion()` */
  readonly reduced?: boolean;
  /** What the finger is doing (#90) */
  readonly gesture?: GestureFlags;
  /** Hints, idle wiggles, done knots, 長輩模式 (#140; the hint ladder is #100's) */
  readonly affordance?: AffordanceFlags;
  /** A still (screenshots, #92): the character sprites hold their key frames */
  readonly still?: boolean;
  /** The latest tick's events (#95: what Mocha reacts to, the word being said) */
  readonly events?: readonly SimEvent[];
}

const NO_EVENTS: readonly SimEvent[] = [];

function Layer({ id, children, html }: { id: LayerId; children?: ReactNode; html?: string }) {
  if (html !== undefined) return <g data-layer={id} dangerouslySetInnerHTML={{ __html: html }} />;
  return <g data-layer={id}>{children}</g>;
}

/** Where a creature is in a state: its node's drawn position, or off the page beside its last spot. */
function creaturePoint(def: PageDef, creature: CreatureDef, state: SimState, other: SimState): Pt | null {
  const at = (s: SimState): Id | 'offpage' | undefined => creature.positions[s.creatures[creature.id] ?? creature.initial];
  const here = at(state);
  if (here !== undefined && here !== 'offpage') return nodePos(def, state, here) ?? null;
  const there = at(other);
  const near = there !== undefined && there !== 'offpage' ? nodePos(def, other, there) : undefined;
  const any = Object.values(creature.positions).find((p): p is Id => p !== 'offpage');
  const anchor = near ?? (any === undefined ? undefined : nodePos(def, state, any));
  return anchor === undefined ? null : offpagePoint(anchor);
}

export function PageView({ def, prev, state, ms, tickMs, scale = 1, reduced: reducedProp, gesture = NO_GESTURE, affordance = NO_AFFORDANCE, still = false, events = NO_EVENTS }: PageViewProps) {
  const osReduced = useReducedMotion();
  const reduced = reducedProp ?? osReduced;
  const ids = useSvgIds(`pg-${def.id}`);
  const ctx: KitCtx = useMemo(() => ({ ...kitCtx('pg'), id: ids }), [ids]);
  const theme = themeOf(def);
  const stage = stageOf(def);
  const t = clamp01(ms / Math.max(1, tickMs));
  const preview = gesture.preview;
  const locked = gesture.locked;

  // ——— The hit layer: every touchable's shape, grown to 48 screen px (what hitTest uses) ———
  const targets = targetsOf(def, state);

  // ——— Static layers, built once per page ———
  const statics = useMemo(() => {
    const defs = stageDefs(ctx, chapterSky(def.chapter));
    const backdrop = defs + backdropArt(def.backdrop)(ctx, def);
    const cutouts = stage.carriages.map(trackPit).join('');
    const floor = stage.slopes.map((s) => ramp(ctx, s, theme)).join('')
      + stage.runs.map((run) => ledge(ctx, run, theme)).join('')
      + [...stage.posts].sort((a, b) => a.foot - b.foot).map((p) => perchPost(ctx, p)).join('');
    const slot = foregroundSlot(def);
    const foreground = slot === null ? '' : `<g transform="translate(${slot.x} ${slot.foot})">${pottedPlant(ctx)}</g>`;
    const crossing = stage.crossings.map((c) => ({ c, rail: rail(ctx, theme, c.part !== undefined), ramp: c.from[1] === c.to[1] ? '' : ramp(ctx, c, theme) }));
    return { backdrop, cutouts, floor, foreground, crossing };
  }, [ctx, def, stage, theme]);

  // ——— Parts, split around the ledges by depth ———
  const riders = useMemo(() => new Set(def.nodes.filter((n) => n.attach).map((n) => n.attach!.part)), [def]);
  const lookOf = (part: PageDef['parts'][number]): PartLook | undefined => {
    const marigold = wearsMarigold(part);
    const input = targets.some((tg) => tg.kind === 'part' && tg.id === part.id);
    const look: PartLook = {
      wiggle: reduced ? undefined : affordance.wiggle?.[part.id],
      lifted: gesture.dragging === part.id,
      locked: input && partLocked(def, state, part.id),
      outline: reduced && marigold,
      elder: affordance.elder,
    };
    return look.wiggle || look.lifted || look.locked || look.outline || look.elder ? look : undefined;
  };
  const partEls = (z: 'mid' | 'near') =>
    def.parts
      .filter((p) => (PRESET_Z[p.preset] <= 3 ? 'mid' : 'near') === z)
      // The dragged part lifts to the next z: drawn last in its layer (bible § 4.1)
      .sort((a, b) => Number(a.id === gesture.dragging) - Number(b.id === gesture.dragging))
      .map((part) => {
        const from = partState(prev, part.id) ?? partState(state, part.id) ?? '';
        const to = partState(state, part.id) ?? from;
        const View = PART_VIEWS[part.preset];
        const held = preview?.part === part.id ? preview.index : undefined;
        const look = lookOf(part);
        const base: PartViewProps = { part, ctx, from, to, ms, reduced, linked: riders.has(part.id), preview: held, look };
        let el: JSX.Element;
        if (MOVERS.has(part.preset)) {
          const Mover = View as (p: MoverProps) => JSX.Element;
          el = <Mover key={part.id} {...base} def={def} prev={prev} state={state} />;
        } else {
          const Plain = View as (p: PartViewProps) => JSX.Element;
          el = <Plain key={part.id} {...base} />;
        }
        const dragging = gesture.dragging === part.id;
        const wobble = locked?.part === part.id;
        const badge = look?.locked ? 'locked' : affordance.done?.includes(part.id) ? 'done' : null;
        if (!dragging && !wobble && badge === null) return el;
        // Bible § 4.1 states: the drag's lift and the locked veil are the view's (`look`); here the
        // flags, the wobble on a locked touch (replays per touch) and the badge at the hit's corner
        return (
          <g
            key={wobble ? `${part.id}:${locked.serial}` : part.id}
            data-dragging={dragging ? '' : undefined}
            data-locked={wobble || look?.locked ? '' : undefined}
            className={wobble && !reduced ? 'gx-wobble' : undefined}
          >
            {el}
            {badge && <PartBadge hit={part.hit} kind={badge} />}
          </g>
        );
      });

  // ——— Crossings: the rail folds flat and the ramp appears as the condition opens ———
  const crossings = statics.crossing.map(({ c, rail: railSvg, ramp: rampSvg }, i) => {
    const was = holds(def, prev, c.when);
    const open = holds(def, state, c.when);
    const k = was === open ? 1 : partProgress(ms, reduced);
    const openness = was === open ? (open ? 1 : 0) : open ? k : 1 - k;
    const sy = Math.max(0.12, 1 - openness * 0.88);
    return (
      <g key={i} data-crossing={`${c.a}-${c.b}`}>
        {rampSvg && (
          <g data-anim="" opacity={r2(clamp01(openness))}>
            <ArtG html={rampSvg} />
          </g>
        )}
        <g data-anim="" transform={`translate(${c.rail[0]} ${c.rail[1]}) scale(1 ${r2(sy)})`}>
          <ArtG html={railSvg} />
        </g>
      </g>
    );
  });

  // ——— Attractors where they lie, and Mocha's empty perches ———
  const mochaOn = state.mocha.perch !== null || state.mocha.path.length > 0;
  const attractors = def.attractors.map((a) => {
    if (state.consumed.includes(a.id) || (a.goal && state.done)) return null;
    if (!holds(def, state, a.visibleWhen)) return null;
    const node = attractorNode(def, state, a);
    const p = node === null ? undefined : drawnNodePos(def, prev, state, node, ms, reduced, preview);
    if (p === undefined) return null;
    return <AttractorItem key={a.id} ctx={ctx} id={a.id} kind={a.kind} x={p[0]} y={p[1]} />;
  });
  const marks = mochaOn
    ? def.perches.filter((p) => p.id !== state.mocha.perch).map((p) => <PerchMarkItem key={p.id} ctx={ctx} perch={p} def={def} state={state} />)
    : [];

  // ——— Creatures ———
  const creatures = def.creatures.map((c) => {
    const a = creaturePoint(def, c, prev, state);
    const b = creaturePoint(def, c, state, prev);
    if (a === null || b === null) return null;
    const k = reduced ? 1 : clamp01(t);
    const [x, y] = lerpPt(a, b, k);
    return <Creature key={c.id} ctx={ctx} id={c.id} art={c.art} x={x} y={y} flip={b[0] < a[0]} />;
  });

  // ——— Mocha and Baokaka (#95): standees on the tick, each mode mapped to its frames (`actors/animMap.ts`) ———
  // A step finishes LAND_MS before the tick ends (the landing wobble's time); stills hold every key frame
  const tStep = stepT(ms, tickMs);
  const kStep = easeInOut(tStep);
  const held = reduced || still;
  const finger = gesture.finger;

  const babyFrom = prev.baby.node;
  const babyTo = state.baby.node;
  const babyStart = nodePos(def, prev, babyFrom);
  const babyEnd = nodePos(def, state, babyTo);
  const babyEdge = babyFrom === babyTo ? null : edgeKind(def, babyFrom, babyTo);
  const riding = babyFrom === babyTo && babyStart !== undefined && babyEnd !== undefined && (babyStart[0] !== babyEnd[0] || babyStart[1] !== babyEnd[1]);
  const bAnim = babyAnim({ mode: state.baby.mode, edge: babyEdge, riding, growth: stepGrowth(def, state), watching: finger !== null, word: sayingWord(prev, state, events) });
  const babyDist = babyEdge !== null && babyStart && babyEnd ? Math.hypot(babyEnd[0] - babyStart[0], babyEnd[1] - babyStart[1]) : 0;
  const bFrame = chooseFrame(bAnim, { k: kStep, dist: babyDist, tickMs, hold: held });
  let babyPose = stepPose(def, prev, state, babyFrom, babyTo, tStep, ms, { reduced, preview });
  let babyOpacity = 1;
  if (reduced && !still && babyEdge !== null && babyStart && babyPose) {
    const f = fadeSlide(babyStart, [babyPose.x, babyPose.y], ms);
    babyPose = { x: f.x, y: f.y, moving: f.opacity < 1 };
    babyOpacity = f.opacity;
  }
  const babyDir = babyEdge !== null && babyStart && babyEnd ? travelDir(babyStart, babyEnd) : 0;
  const babyTilt = still ? 0 : standeeTilt(ms, tickMs, babyDir, reduced);
  const watch = finger === null || babyPose === null ? undefined : finger[0] < babyPose.x ? -1 : 1;
  const look = bAnim.lookAround && !held ? lookFacing(state.baby.facing, ms, tickMs) : null;
  const sx = look ? flipScale(look.from, look.to, look.ms, false) : flipScale(prev.baby.facing, state.baby.facing, ms, reduced);
  const show = bubbleShow(def, state);
  const head = spriteHead(bAnim.sprite, state.baby.facing);
  // The lamp glow (bible § 5): near a lit light attractor
  const glow =
    babyPose !== null &&
    def.attractors.some((a) => {
      if (a.kind !== 'light' || state.consumed.includes(a.id) || !holds(def, state, a.visibleWhen) || !holds(def, state, a.activeWhen)) return false;
      const node = attractorNode(def, state, a);
      const p = node === null ? undefined : nodePos(def, state, node);
      return p !== undefined && Math.hypot(p[0] - babyPose!.x, p[1] - babyPose!.y) <= LAMP_GLOW_R;
    })
      ? `url(#${ctx.id('standeeGlow')})`
      : undefined;

  const mochaFrom = mochaNode(def, prev);
  const mochaTo = mochaNode(def, state);
  const perch = def.perches.find((p) => p.id === state.mocha.perch);
  const mochaHidden = perch !== undefined && perchHidesMocha(def, perch) && state.mocha.path.length === 0;
  if (mochaHidden) noteFrameFallback(MOCHA_STATE_ANIM.inBox);
  const mochaTravel = mochaFrom !== null && mochaTo !== null && mochaFrom !== mochaTo;
  const mochaStart = mochaFrom === null ? undefined : nodePos(def, prev, mochaFrom);
  const mochaEnd = mochaTo === null ? undefined : nodePos(def, state, mochaTo);
  const stared = prev.mocha.stare;
  const mAnim = mochaAnim({
    travelling: mochaTravel,
    landed: tStep >= 1 || held,
    edge: mochaTravel ? edgeKind(def, mochaFrom!, mochaTo!) : null,
    hidden: mochaHidden,
    staring: state.mocha.stare !== undefined,
    pushing: stared !== undefined && state.mocha.stare === undefined && state.pushables[stared] === 'falling',
    // The glare pose holds while the finger is still on the locked part (the lean replays per touch)
    glare: locked !== null && finger !== null,
    puff: events.some((e) => e.type === 'mochaPuff'),
    nope: events.some((e) => e.type === 'mochaNope'),
    cuddled: state.baby.mode === 'cuddling' && state.baby.target === 'mocha',
    onPart: perch?.onPart !== undefined,
  });
  const mFrame = chooseFrame(mAnim, { k: tStep, dist: 0, tickMs, hold: held });
  let mochaPose = mochaHidden ? null : stepPose(def, prev, state, mochaFrom, mochaTo, tStep, ms, { reduced, hop: 24, preview });
  let mochaOpacity = 1;
  if (reduced && !still && mochaTravel && mochaStart && mochaPose) {
    const f = fadeSlide(mochaStart, [mochaPose.x, mochaPose.y], ms);
    mochaPose = { x: f.x, y: f.y, moving: f.opacity < 1 };
    mochaOpacity = f.opacity;
  }
  const mochaDir = mochaTravel && mochaStart && mochaEnd ? travelDir(mochaStart, mochaEnd) : 0;
  const mochaTilt = still ? 0 : standeeTilt(ms, tickMs, mochaDir, reduced);
  // At rest he sits turned toward 寶咖咖; travelling, toward where he is going (frames face right)
  const mochaFacing = mochaDir !== 0 ? (mochaDir < 0 ? 'l' : 'r') : mochaPose && babyPose && babyPose.x < mochaPose.x - 4 ? 'l' : 'r';

  // ——— 土地公, when his condition shows him ———
  const tdg = def.tudigong;
  const tudigongShown = holds(def, state, tdg.visibleWhen);

  // ——— Hints (bible § 4.1 L1/L2): a halo behind the target, the ghost hand over the page ———
  const hint = affordance.hint ?? null;
  const hinted = hint === null ? undefined : targets.find((tg) => tg.key === hint.key);
  const halo = hinted && <HintHalo key={`halo:${hinted.key}`} ctx={ctx} shape={haloShape(def, state, hinted)} reduced={reduced} strong={affordance.elder} />;
  const haloMid = hinted !== undefined && hinted.layer <= 3;
  const thread = hinted === undefined ? null : linkThread(def, state, hinted);
  const hand = hinted !== undefined && hint?.level === 2 ? handGesture(def, state, hinted, hint) : null;

  return (
    <svg
      viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.w} ${VIEW_BOX.h}`}
      width={r2(VIEW_BOX.w * scale)}
      height={r2(VIEW_BOX.h * scale)}
      overflow="visible"
      className="block font-body"
      data-page={def.id}
      data-tick={state.tick}
      data-done={state.done ? '' : undefined}
      data-parts={Object.entries(state.parts).sort(([a], [b]) => (a < b ? -1 : 1)).map(([id, v]) => `${id}=${v}`).join(' ')}
      role="img"
      aria-label={def.title}
    >
      <Layer id="backdrop" html={statics.backdrop} />
      <Layer id="cutouts">
        <ArtG html={statics.cutouts} />
        {tudigongShown && <TudigongItem ctx={ctx} x={tdg.x} y={tdg.y} />}
      </Layer>
      <Layer id="parts-mid">
        {haloMid && halo}
        {stage.carriages.map((c) => (
          <CarriageView key={c.part} def={def} prev={prev} state={state} carriage={c} ctx={ctx} ms={ms} reduced={reduced} preview={preview} />
        ))}
        {partEls('mid')}
      </Layer>
      <Layer id="floor">
        <ArtG html={statics.floor} />
        {crossings}
      </Layer>
      <Layer id="parts-near">
        {!haloMid && halo}
        {partEls('near')}
        {attractors}
        {marks}
      </Layer>
      <Layer id="creatures">{creatures}</Layer>
      <Layer id="actors">
        {mochaPose && (
          <Mocha x={mochaPose.x} y={mochaPose.y} anim={mAnim} frame={mFrame} glare={locked?.serial} facing={mochaFacing} tilt={mochaTilt} opacity={mochaOpacity} reduced={reduced} still={still} />
        )}
        {babyPose && (
          <Baby x={babyPose.x} y={babyPose.y} mode={state.baby.mode} anim={bAnim} frame={bFrame} sx={sx} tilt={babyTilt} opacity={babyOpacity} watch={watch} glow={glow} reduced={reduced} still={still} />
        )}
      </Layer>
      <Layer id="fx">
        {babyPose && show && <Bubble ctx={ctx} show={show} x={babyPose.x} y={babyPose.y} head={head} />}
        {thread && <LinkThread from={thread[0]} to={thread[1]} />}
        {hand && <GhostHand gesture={hand} reduced={reduced} />}
      </Layer>
      <Layer id="foreground" html={statics.foreground} />
      <Layer id="hit">
        {targets.map((tg) => {
          const grown = minHit(tg.hit, scale);
          return <HitShape key={tg.key} hit={grown} data-hit={tg.key} data-hit-grown={grown === tg.hit ? undefined : ''} fill="transparent" />;
        })}
        {gesture.reveal && (
          <g data-reveal="" fill="none" stroke={POPUP.chalk} strokeWidth={2} strokeDasharray="6 4" strokeLinecap="round">
            {targets.map((tg) => (
              <HitShape key={tg.key} hit={tg.hit} rx={8} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        )}
      </Layer>
    </svg>
  );
}

/** A hit shape as a circle or a rectangle; never takes pointer events (`gestures.ts` hit-tests). */
function HitShape({ hit, rx, ...rest }: { hit: Hit; rx?: number; fill?: string; vectorEffect?: 'non-scaling-stroke'; 'data-hit'?: string; 'data-hit-grown'?: string }) {
  return 'r' in hit ? (
    <circle cx={r2(hit.cx)} cy={r2(hit.cy)} r={r2(hit.r)} pointerEvents="none" {...rest} />
  ) : (
    <rect x={r2(hit.x)} y={r2(hit.y)} width={r2(hit.w)} height={r2(hit.h)} rx={rx} pointerEvents="none" {...rest} />
  );
}

/** The locked paw badge or the done knot, upright at the hit area's top-right corner (bible § 4.1). */
function PartBadge({ hit, kind }: { hit: Hit; kind: 'locked' | 'done' }) {
  const [x, y] = 'r' in hit ? [hit.cx + hit.r * 0.72, hit.cy - hit.r * 0.72] : [hit.x + hit.w - 8, hit.y + 8];
  const html = useMemo(() => (kind === 'locked' ? pawBadge(x, y) : checkKnot(x, y)), [kind, x, y]);
  return <ArtG html={html} />;
}

function AttractorItem({ ctx, id, kind, x, y }: { ctx: KitCtx; id: string; kind: PageDef['attractors'][number]['kind']; x: number; y: number }) {
  const html = useMemo(() => attractorArt(ctx, kind), [ctx, kind]);
  // Shinies hover a little above the ledge, in their cup of light
  return (
    <g data-attractor={id} transform={`translate(${r2(x)} ${r2(y - 14)})`}>
      <ArtG html={html} />
    </g>
  );
}

function PerchMarkItem({ ctx, perch, def, state }: { ctx: KitCtx; perch: PerchDef; def: PageDef; state: SimState }) {
  const p = nodePos(def, state, perch.node);
  const html = useMemo(() => (p ? perchMark(ctx, p[0], p[1]) : ''), [ctx, p?.[0], p?.[1]]);
  return <ArtG html={html} className="perch-mark" />;
}

function TudigongItem({ ctx, x, y }: { ctx: KitCtx; x: number; y: number }) {
  const html = useMemo(() => `<g transform="translate(${x} ${y}) rotate(14) scale(1.2)">${tudigong(ctx)}</g>`, [ctx, x, y]);
  return <ArtG html={html} />;
}
