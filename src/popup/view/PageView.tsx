import { useLayoutEffect, useMemo, type ReactNode } from 'react';
import { POPUP } from '../../art/palette';
import { useSvgIds } from '../../art/useSvgIds';
import { useReducedMotion } from '../../components/motion';
import { checkKnot, kitCtx, pawBadge, type KitCtx } from '../art';
import { attractorNode } from '../core/baby';
import { holds, partState } from '../core/cond';
import { partLocked, stepGrowth } from '../core/step';
import { compilePart } from '../core/presets';
import type { SimEvent } from '../core/events';
import { nodePos } from '../core/graph';
import { mochaLinked, mochaNode, perchHidesMocha } from '../core/mocha';
import type { CreatureDef, CutoutDef, Id, PageDef, PerchDef, SimState } from '../core/types';
import { SpriteGrade, chapterGradeKey, spriteBox, spriteHead } from '../sprites';
import type { TalkLine } from '../content/script';
import {
  Baby,
  Creature,
  LAMP_GLOW_R,
  Mocha,
  babyAnim,
  reachedHigh,
  chooseFrame,
  edgeKind,
  fadeSlide,
  flipScale,
  MOCHA_CUE_ANIM,
  MOCHA_STATE_ANIM,
  mochaCueFits,
  mochaState,
  sayingWord,
  standeeTilt,
  stepT,
  strideCycles,
  travelDir,
  walkSway,
} from './actors';
import './affordance/affordance.css';
import { haloShape, handGesture, linkThread } from './affordance/hints';
import { GhostHand, HintHalo, LinkThread } from './affordance/Hints';
import { NO_AFFORDANCE, wearsMarigold, type AffordanceFlags, type PartLook } from './affordance/look';
import { treasureOnPage } from './photo/treasureArt';
import { dressOf, ledgeStyleOf, ownsPost } from './art/dress';
import { dressedLedge, foregroundCard, styledRamp } from './art/ledges';
import { Fireflies } from './Fireflies';
import { WindowStrip } from './WindowStrip';
import { attractorArt, chapterSky, decoyArt, firstFootprint, floorMark, spine, perchMark, perchPost, rail, ramp, spotPool, stageDefs, themeOf, trackPit, tudigong } from './art/placeholders';
import { backdropArt, backdropBitmap, cutoutBitmap } from './art/registry';
import { liveArt } from './art/creatures';
import { riderArt } from './art/riders';
import { puddle } from './art/creatures';
import { PAGE_VIEW_BOX, type Hit, type Pt } from './geometry';
import { FLOOR_LIFT, NO_GESTURE, floorTargets, hitCenter, minHit, rideHome, shiftHit, targetsOf, type GestureFlags } from './gestures';
import { clamp01, drawnNodePos, easeInOut, lerpPt, offpagePoint, partProgress, stepPose } from './interp';
import { PRESET_Z, type LayerId } from './layers';
import { ArtG, r2, tweened } from './parts/common';
import { moverPoint } from './parts/MoverView';
import { CarriageView, MOVERS, RiderView, partView, type MoverProps, type PartViewProps } from './parts';
import { branchArt, dialBox, driveBelts, swingPath, swingStops, trunkArt, wheelLevels } from './parts/cues';
import { foregroundSlot, stageOf } from './stage';
import { SayRing } from './words/SayFx';
import './hud/stickers.css';
import { BarkBubble, Subtitles, ThoughtBubble, barksOf, bubbleShow, goalBox, layoutTalk, showKey, talkScale, type BarkShow, type TalkActor } from './talk';

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
 *
 * Words (#99): on a say tick the word's big speech bubble is one of his barks (`barksOf`) and its
 * reach widens from him as the effect ring (`words/SayFx.tsx`) in the fx layer.
 *
 * Linked (一起, #128): the perch paws give way to floor marks (a paw and a footprint) on every
 * node a tap can lead them to; Mocha walks the floor `LINK_SIDE` ahead of him on his facing side
 * (a walk cycle, no hop) and purrs beside him, the two of them in one warm pool of light; a walk
 * step sways and leaves his first footprints, and the last one ends in the sit-down plop.
 */

/** The SVG's view box in page units: the page plus room for the floor page's widening and the page block. */
export const VIEW_BOX = PAGE_VIEW_BOX;

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
  /** The barks on the page (#98; `PagePlayer` keeps them a few ticks); defaults to this tick's */
  readonly barks?: readonly BarkShow[];
  /** The subtitle beat on the page (#98, `game/talk.ts`) and the tap that advances it */
  readonly talk?: {
    readonly beat: readonly TalkLine[] | null;
    readonly serial: number;
    readonly onAdvance?: () => void;
    /** The beat is too much for the page (#197): only its first `fit` lines lay out clean; the queue splits it there */
    readonly onCrowded?: (beat: readonly TalkLine[], fit: number) => void;
  };
  /** 大字 (#104): the bubbles' text grows by this much (1 or 1.25) */
  readonly textScale?: number;
  /** Low power (bible § 9.3, #104): the grab's sparkle burst at half its rays and glints */
  readonly lowPower?: boolean;
  /** Walk steps he took earlier this session (#128, `PagePlayer`): his first footprints stay on the floor */
  readonly trail?: readonly (readonly [Id, Id])[];
}

const NO_EVENTS: readonly SimEvent[] = [];
/** A swing's printed path lies this far under the stops its rider stands on (#221). */
const SWING_DROP = 128;
const NO_TRAIL: readonly (readonly [Id, Id])[] = [];

/** The footprints of a walk step from `a` to `b` (#128): one per `FOOTPRINTS_AT` already reached at `k`. */
function stepPrints(a: Pt, b: Pt, k: number, opacity: number): string {
  return FOOTPRINTS_AT.filter((f) => k >= f)
    // On the ledge's top, just behind its front edge (the floor marks' line, FLOOR_LIFT), left and right of his line
    .map((f, i) => firstFootprint(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f - FLOOR_LIFT + (i % 2 === 0 ? 1.8 : -1.8), i % 2 === 0, opacity))
    .join('');
}

/** A baked bitmap as an SVG `<image>` string over its box (page or local units). */
const image = (url: string, box: { x: number; y: number; w: number; h: number }, attrs = '') =>
  `<image href="${url}" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" preserveAspectRatio="none"${attrs ? ` ${attrs}` : ''}/>`;

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

/** Linked (一起, #128): how far ahead of him, on his facing side, Mocha stands and walks (page units). */
export const LINK_SIDE = 36;
/** Where along a walk step his first footprints fall (fractions of the step, #128). */
export const FOOTPRINTS_AT = [0.36, 0.7] as const;

/** How far above the carrier's feet he rides in her arms (page units; GDD § 2.4 抱抱, #120). */
export const CARRY_LIFT = 34;
/** How far in front of her (toward where she walks) he is held, so both read (page units, #120). */
export const CARRY_AHEAD = 16;

/** The carrier holding him in `s`, if he is carried. */
function carrierOf(def: PageDef, s: SimState): PageDef['parts'][number] | undefined {
  const by = s.baby.mode === 'carried' ? s.baby.carriedBy : undefined;
  return by === undefined ? undefined : def.parts.find((p) => p.id === by.id);
}

/**
 * Where he is drawn while carried (抱抱, #120): carried on both sides of the tick, he follows the
 * carrier's drawn feet (the same tween as her art, so the two never drift), `CARRY_LIFT` up and
 * `CARRY_AHEAD` in front of her; on the
 * pick-up tick he is lifted by `k` (the step's eased progress) and on the set-down tick lowered.
 * Otherwise `pose` unchanged.
 */
export function carriedPose(def: PageDef, prev: SimState, state: SimState, pose: { x: number; y: number; moving: boolean }, ms: number, reduced: boolean, k: number): { x: number; y: number; moving: boolean } {
  const now = carrierOf(def, state);
  const before = carrierOf(def, prev);
  if (now === undefined && before === undefined) return pose;
  if (now !== undefined && before !== undefined) {
    const a = moverPoint(def, now, prev.parts[now.id] ?? 'idle', prev);
    const b = moverPoint(def, now, state.parts[now.id] ?? 'idle', state);
    const ahead = state.baby.facing === 'l' ? -CARRY_AHEAD : CARRY_AHEAD;
    return { x: tweened(a[0], b[0], ms, reduced) + ahead, y: tweened(a[1], b[1], ms, reduced) - CARRY_LIFT, moving: a[0] !== b[0] || a[1] !== b[1] };
  }
  const lift = now !== undefined ? k : 1 - k;
  const ahead = (state.baby.facing === 'l' ? -CARRY_AHEAD : CARRY_AHEAD) * lift;
  return { ...pose, x: pose.x + ahead, y: pose.y - CARRY_LIFT * lift };
}

export function PageView({ def, prev, state, ms, tickMs, scale = 1, reduced: reducedProp, gesture = NO_GESTURE, affordance = NO_AFFORDANCE, still = false, events = NO_EVENTS, barks: barksProp, talk, textScale = 1, lowPower = false, trail = NO_TRAIL }: PageViewProps) {
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
  // The hinted target (#100's ladder; #140's looks), if it is on the page now
  const hint = affordance.hint ?? null;
  const hinted = hint === null ? undefined : targets.find((tg) => tg.key === hint.key);

  // ——— Static layers, built once per page ———
  const statics = useMemo(() => {
    const defs = stageDefs(ctx, chapterSky(def.chapter));
    // The baked backdrop (#96) over the whole view box, else the placeholder stage drawn live
    const baked = backdropBitmap(def.backdrop);
    const backdrop = defs + (baked ? image(baked.url, baked.box, 'data-baked="backdrop"') : backdropArt(def.backdrop)(ctx, def))
      // A spread is a centrefold (GDD § 2.9, #103): the same 390 × 560 space, with the spine's crease down its middle
      + (def.spread ? spine(ctx) : '');
    // Standing cut-outs the page places (GDD § 3.9 layer 2), then the track pits from the walk graph
    const cutouts = (def.cutouts ?? []).filter((c) => c.visibleWhen === undefined).map(cutoutSvg).join('') + (dressOf(def).trackPit === false ? '' : stage.carriages.map(trackPit).join(''));
    // The ledges in the page's material and the perch furniture its backdrop doesn't draw itself (#108, `art/dress.ts`)
    const floor = stage.slopes.map((s) => styledRamp(ctx, s, ledgeStyleOf(def, Math.max(s.from[1], s.to[1])), theme)).join('')
      + stage.runs.map((run) => dressedLedge(ctx, run, (y) => ledgeStyleOf(def, y), theme, dressOf(def).ledgeSplit)).join('')
      + stage.posts.filter((p) => !ownsPost(def, p.perch)).sort((a, b) => a.foot - b.foot).map((p) => `<g data-post="${p.perch}">${perchPost(ctx, p)}</g>`).join('');
    const card = dressOf(def).foreground;
    const slot = card === null ? null : foregroundSlot(def);
    const foreground = slot === null ? '' : `<g data-foreground="${card ?? 'plant'}" transform="translate(${slot.x} ${slot.foot})">${foregroundCard(ctx, card ?? 'plant')}</g>`;
    // A backdrop whose art is the obstacle (2-1's gap, 2-6's stream) shows no rail (#115)
    const railed = dressOf(def).crossing !== 'none';
    const crossing = stage.crossings.map((c) => ({ c, rail: railed ? rail(ctx, theme, c.part !== undefined) : '', ramp: c.from[1] === c.to[1] ? '' : ramp(ctx, c, theme) }));
    return { backdrop, cutouts, floor, foreground, crossing };
  }, [ctx, def, stage, theme]);

  // 咻咻's rain on the floor (#128): a puddle on every floor node tagged `wet` that he walks (Mocha only crosses one linked)
  const puddles = useMemo(() => {
    const walked = new Set(def.edges.filter((e) => e.kind !== 'jump' && e.kind !== 'squeeze').flatMap((e) => [e.a, e.b]));
    return def.nodes.filter((n) => n.tags?.includes('wet') && walked.has(n.id) && n.attach === undefined).map((n) => `<g transform="translate(${n.x} ${n.y})">${puddle()}</g>`).join('');
  }, [def]);

  // ——— Parts, split around the ledges by depth ———
  const riders = useMemo(() => new Set(def.nodes.filter((n) => n.attach).map((n) => n.attach!.part)), [def]);
  // Level wheels (#221): the lift level each stop leaves, for the wheel's printed dial
  const levels = useMemo(() => new Map(def.parts.flatMap((p) => {
    const l = wheelLevels(def, p);
    return l === null ? [] : [[p.id, l] as const];
  })), [def]);
  // Coupled wheels (#221): the printed drive belts to the parts they turn; a held part's hangs slack
  const drives = useMemo(() => driveBelts(def), [def]);
  const trunks = useMemo(() => drives.trunks.map(trunkArt).join(''), [drives]);
  const heldKey = drives.branches.map((b) => (partLocked(def, state, b.part) ? '1' : '0')).join('');
  const branches = useMemo(() => drives.branches.map((b, i) => branchArt(b, heldKey[i] === '1')).join(''), [drives, heldKey]);
  // Swings (#221): a blowable's stops printed under it, the next one marked (the paw: it needs Mocha's weight)
  const swings = useMemo(() => def.parts.flatMap((p) => {
    const stops = swingStops(def, p);
    return stops === null ? [] : [{ part: p, stops, states: compilePart(p).states }];
  }), [def]);
  // Each swing's stop, its next stop (a 咻—— moves it one on, wrapping) and whether that one wants Mocha aboard
  const swingKey = swings.map(({ part, states }) => {
    const at = Math.max(0, states.indexOf(partState(state, part.id) ?? ''));
    const next = (at + 1) % states.length;
    return `${at}:${next}:${holds(def, state, part.stateWhen?.[states[next]]) ? 0 : 1}`;
  }).join(',');
  const swingHtml = useMemo(() => swings.map(({ stops }, k) => {
    const [at, next, needsMocha] = swingKey.split(',')[k].split(':').map(Number);
    return swingPath(stops, SWING_DROP, at, next, needsMocha === 1);
  }).join(''), [swings, swingKey]);
  const dials = useMemo(() => def.parts.filter((p) => levels.has(p.id)).map((p) => {
    const hb = hitBox(p.hit);
    const [cx, cy] = p.center ?? [hb.x + hb.w / 2, hb.y + hb.h / 2];
    return dialBox(cx, cy, p.radius ?? Math.max(20, Math.min(hb.w, hb.h) / 2 - 8));
  }), [def, levels]);
  // What rides a loop's slots (#124: suitcases, a tray), drawn at their nodes over the belt
  const slotRiders = useMemo(() => def.parts.filter((p) => p.preset === 'loop').flatMap((p) => def.nodes.filter((n) => n.attach?.part === p.id).flatMap((n) => {
    const art = riderArt(p.art, n.id);
    return art === null ? [] : [{ node: n.id, html: liveArt(() => art(ctx)) }];
  })), [def, ctx]);
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
  // A swing that strained without Mocha's weight this tick (#221): it wobbles, and Mocha looks at it
  const strained = events.find((e) => e.type === 'strain')?.id;
  const partEls = (z: 'mid' | 'near') =>
    def.parts
      .filter((p) => (PRESET_Z[p.preset] <= 3 ? 'mid' : 'near') === z)
      // The dragged part lifts to the next z: drawn last in its layer (bible § 4.1)
      .sort((a, b) => Number(a.id === gesture.dragging) - Number(b.id === gesture.dragging))
      .map((part) => {
        const from = partState(prev, part.id) ?? partState(state, part.id) ?? '';
        const to = partState(state, part.id) ?? from;
        const View = partView(part);
        const held = preview?.part === part.id ? preview.index : undefined;
        const look = lookOf(part);
        const base: PartViewProps = { part, ctx, from, to, ms, reduced, linked: riders.has(part.id), preview: held, look, levels: levels.get(part.id) };
        let el: JSX.Element;
        if (MOVERS.has(part.preset)) {
          const Mover = View as (p: MoverProps) => JSX.Element;
          el = <Mover key={part.id} {...base} def={def} prev={prev} state={state} />;
        } else {
          const Plain = View as (p: PartViewProps) => JSX.Element;
          el = <Plain key={part.id} {...base} />;
        }
        // A part riding a node (`ridesOn`, #107) moves with it, as its carriage does
        const home = rideHome(def, part);
        const at = home === undefined || part.ridesOn === undefined ? undefined : drawnNodePos(def, prev, state, part.ridesOn, ms, reduced, preview);
        const shift: Pt = home !== undefined && at !== undefined ? [at[0] - home[0], at[1] - home[1]] : [0, 0];
        if (shift[0] !== 0 || shift[1] !== 0) {
          el = (
            <g key={part.id} data-anim="" data-rides={part.ridesOn} transform={`translate(${r2(shift[0])} ${r2(shift[1])})`}>
              {el}
            </g>
          );
        }
        const dragging = gesture.dragging === part.id;
        const wobble = locked?.part === part.id || strained === part.id;
        const badge = look?.locked ? 'locked' : affordance.done?.includes(part.id) ? 'done' : null;
        if (!dragging && !wobble && badge === null) return el;
        // Bible § 4.1 states: the drag's lift and the locked veil are the view's (`look`); here the
        // flags, the wobble on a locked touch (replays per touch) and the badge at the hit's corner
        return (
          <g
            key={wobble ? `${part.id}:${locked?.part === part.id ? locked.serial : `s${state.tick}`}` : part.id}
            data-dragging={dragging ? '' : undefined}
            data-locked={locked?.part === part.id || look?.locked ? '' : undefined}
            data-strain={strained === part.id ? '' : undefined}
            className={wobble && !reduced ? 'gx-wobble' : undefined}
          >
            {el}
            {badge && <PartBadge hit={shiftHit(part.hit, shift)} kind={badge} />}
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
        {railSvg && (
          <g data-anim="" transform={`translate(${c.rail[0]} ${c.rail[1]}) scale(1 ${r2(sy)})`}>
            <ArtG html={railSvg} />
          </g>
        )}
      </g>
    );
  });

  // ——— Attractors where they lie, and Mocha's empty perches (linked, the floor's marks) ———
  const linked = state.baby.linked;
  const mochaOn = !linked && (state.mocha.perch !== null || state.mocha.path.length > 0);
  const attractors = def.attractors.map((a) => {
    if (state.consumed.includes(a.id) || (a.goal && state.done)) return null;
    // Drawn in the backdrop (page E's treasures on the 抓周盤, #135): nothing live
    if (a.art === 'baked') return null;
    if (!holds(def, state, a.visibleWhen)) return null;
    const node = attractorNode(def, state, a);
    const p = node === null ? undefined : drawnNodePos(def, prev, state, node, ms, reduced, preview);
    if (p === undefined) return null;
    // A spotlight's light is a pool on the floor; a held item sits in its creature's paws (#114); a
    // decoy is drawn as itself (#116), on its creature's face when one holds it (her glasses)
    const held = a.heldBy !== undefined && state.dropped?.[a.id] === undefined;
    const look = a.decoy === true ? (held ? 'decoyHeld' : 'decoy') : a.kind === 'light' && a.nodeBy !== undefined ? 'pool' : held ? 'held' : undefined;
    // A spotlight's beam comes from the part that aims it (its centre)
    const lampPart = look === 'pool' ? def.parts.find((pt) => pt.id === a.nodeBy?.part) : undefined;
    const from: Pt | undefined = lampPart?.center === undefined ? undefined : [lampPart.center[0] - p[0], lampPart.center[1] - p[1]];
    return <AttractorItem key={a.id} ctx={ctx} id={a.id} kind={a.kind} art={a.art} x={p[0]} y={p[1]} look={look} from={from} treasure={a.goal && def.spread ? def.chapter : undefined} />;
  });
  // A tap on a perch he can't get to (GDD § 2.3): its paw shakes "not connected" while he looks at it and says 「喵？」 (#183)
  const nope = events.find((e) => e.type === 'mochaNope')?.id;
  const marks = mochaOn
    ? def.perches
        .filter((p) => p.id !== state.mocha.perch)
        .map((p) => <PerchMarkItem key={p.id === nope ? `${p.id}:nope:${state.tick}` : p.id} ctx={ctx} perch={p} def={def} state={state} bold={affordance.elder === true} nope={p.id === nope && !reduced} />)
    : [];
  const floors = linked && !state.done
    ? floorTargets(def, state).map((tg) => {
        const [x, y] = hitCenter(tg.hit);
        return <FloorMarkItem key={tg.id === nope ? `${tg.id}:nope:${state.tick}` : tg.id} ctx={ctx} x={x} y={y + FLOOR_LIFT} bold={affordance.elder === true} nope={tg.id === nope && !reduced} />;
      })
    : [];
  const nopePerch = nope === undefined ? undefined : def.perches.find((p) => p.id === nope);
  // A floor node he can't lead them to (#128): he looks at it too
  const nopeAt = nopePerch !== undefined ? nodePos(def, state, nopePerch.node) : nope !== undefined && linked ? nodePos(def, state, nope) : undefined;
  // A swing that strained (#221): he looks at his paw on it, 「我坐上去？」
  const strainPerch = strained === undefined ? undefined : def.perches.find((p) => def.nodes.find((n) => n.id === p.node)?.attach?.part === strained);
  const strainAt = strainPerch !== undefined ? nodePos(def, state, strainPerch.node) : undefined;

  // ——— Creatures ———
  const shinyBeside = (p: Pt): Pt | undefined => {
    for (const a of def.attractors) {
      if (a.kind !== 'shiny' || state.consumed.includes(a.id) || !holds(def, state, a.visibleWhen)) continue;
      const node = attractorNode(def, state, a);
      const q = node === null ? undefined : nodePos(def, state, node);
      if (q !== undefined && Math.abs(q[0] - p[0]) <= 90 && Math.abs(q[1] - p[1]) <= 60 && q[0] !== p[0]) return q;
    }
    return undefined;
  };
  const creatures = def.creatures.map((c) => {
    const a = creaturePoint(def, c, prev, state);
    const b = creaturePoint(def, c, state, prev);
    if (a === null || b === null) return null;
    const k = reduced ? 1 : clamp01(t);
    const [x, y] = lerpPt(a, b, k);
    // At rest beside a shiny it wants too, it faces it (#183: 1-6's pigeon by the 雞腿 looked away);
    // the art faces left
    const near = a[0] === b[0] && a[1] === b[1] ? shinyBeside(b) : undefined;
    const flip = near === undefined ? b[0] < a[0] : near[0] > b[0];
    return <Creature key={c.id} ctx={ctx} id={c.id} art={c.art} x={x} y={y} flip={flip} pos={state.creatures[c.id] ?? c.initial} />;
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
  // The word he says this tick (#99: the big speech bubble is a bark, the effect ring is below)
  const sayWord = sayingWord(prev, state, events);
  // The first walk's last step lands in a plop (#128): once the step is down, or at once in a still
  const plop = babyEdge === 'walk' && (tStep >= 1 || held);
  const bAnim = babyAnim({ mode: state.baby.mode, edge: babyEdge, riding, growth: stepGrowth(def, state), watching: finger !== null, word: sayWord, high: reachedHigh(def, state), plop });
  const babyDist = babyEdge !== null && babyStart && babyEnd ? Math.hypot(babyEnd[0] - babyStart[0], babyEnd[1] - babyStart[1]) : 0;
  const bFrame = chooseFrame(bAnim, { k: kStep, dist: babyDist, tickMs, hold: held });
  let babyPose = stepPose(def, prev, state, babyFrom, babyTo, tStep, ms, { reduced, preview });
  let babyOpacity = 1;
  if (reduced && !still && babyEdge !== null && babyStart && babyPose) {
    const f = fadeSlide(babyStart, [babyPose.x, babyPose.y], ms);
    babyPose = { x: f.x, y: f.y, moving: f.opacity < 1 };
    babyOpacity = f.opacity;
  }
  // Carried (抱抱, #120): he rides in the carrier's arms, CARRY_LIFT above her feet, moving with her
  // art (both tween the same way); lifted on the pick-up tick, lowered on the set-down tick
  if (babyPose !== null) babyPose = carriedPose(def, prev, state, babyPose, ms, reduced, reduced || still ? 1 : kStep);
  const babyDir = babyEdge !== null && babyStart && babyEnd ? travelDir(babyStart, babyEnd) : 0;
  // A walk step (第一步, #128) sways on top of the lean: he is not sure of it yet
  const sway = babyEdge === 'walk' && bAnim.gdd === 'walk' ? walkSway(tStep, strideCycles(babyDist), reduced) : 0;
  const babyTilt = still ? 0 : standeeTilt(ms, tickMs, babyDir, reduced) + sway;
  // His first footprints, chalk on the floor: those of earlier walk steps stay, this step's appear as each foot comes down
  const footprints = trail
    .filter(([a, b]) => !(a === babyFrom && b === babyTo))
    .map(([a, b]) => {
      const p = nodePos(def, state, a);
      const q = nodePos(def, state, b);
      return p && q ? stepPrints(p, q, 1, 0.45) : '';
    })
    .join('') + (babyEdge === 'walk' && babyStart && babyEnd ? stepPrints(babyStart, babyEnd, held ? 1 : tStep, 0.6) : '');
  const watch = finger === null || babyPose === null ? undefined : finger[0] < babyPose.x ? -1 : 1;
  const sx = flipScale(prev.baby.facing, state.baby.facing, ms, reduced);
  const show = bubbleShow(def, state);
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
  const mochaTravel = mochaFrom !== null && mochaTo !== null && mochaFrom !== mochaTo;
  // Linked (#128): on the floor on both sides of the tick, a step is a walk; the tick he hops down is a hop
  const mochaWalk = mochaLinked(prev) && mochaLinked(state);
  const mochaStart = mochaFrom === null ? undefined : nodePos(def, prev, mochaFrom);
  // Linked (#128) he is drawn LINK_SIDE ahead of Baokaka's node, on his facing side
  const mochaSide = mochaLinked(state) ? LINK_SIDE * (state.baby.facing === 'r' ? 1 : -1) : 0;
  const mochaNodeEnd = mochaTo === null ? undefined : nodePos(def, state, mochaTo);
  const mochaEnd: Pt | undefined = mochaNodeEnd === undefined ? undefined : [mochaNodeEnd[0] + mochaSide, mochaNodeEnd[1]];
  const stared = prev.mocha.stare;
  const mState = mochaState({
    travelling: mochaTravel,
    landed: tStep >= 1 || held,
    edge: mochaTravel ? edgeKind(def, mochaFrom!, mochaTo!) : null,
    linked: mochaWalk,
    hidden: mochaHidden,
    staring: state.mocha.stare !== undefined,
    pushing: stared !== undefined && state.mocha.stare === undefined && state.pushables[stared] === 'falling',
    // The glare pose holds while the finger is still on the locked part (the lean replays per touch)
    glare: locked !== null && finger !== null,
    puff: events.some((e) => e.type === 'mochaPuff'),
    nope: events.some((e) => e.type === 'mochaNope'),
    // Cuddled, or linked and beside him: he purrs
    cuddled: (state.baby.mode === 'cuddling' && state.baby.target === 'mocha') || (state.baby.mode === 'linked' && state.baby.node === mochaTo),
    onPart: perch?.onPart !== undefined,
  });
  // A hint's cue (#100) while he is at rest: the nudge's yawn, 「等等看。」's sit; he looks at the hinted target
  const cue = affordance.mocha && mochaCueFits(mState) ? affordance.mocha : null;
  const mAnim = cue === 'yawn' || cue === 'wait' ? MOCHA_CUE_ANIM[cue] : MOCHA_STATE_ANIM[mState];
  const mochaDist = mochaTravel && mochaStart && mochaNodeEnd ? Math.hypot(mochaNodeEnd[0] - mochaStart[0], mochaNodeEnd[1] - mochaStart[1]) : 0;
  const mFrame = chooseFrame(mAnim, { k: mochaWalk ? kStep : tStep, dist: mochaDist, tickMs, hold: held });
  // In a box (C9) he is still drawn at the perch: the `inbox` frame is only his head and paws over the rim
  let mochaPose = stepPose(def, prev, state, mochaFrom, mochaTo, tStep, ms, { reduced, hop: mochaWalk ? 0 : 24, preview });
  // Linked he stands LINK_SIDE ahead of him on his facing side (turning with his card flip); hopping down, he lands there
  if (mochaPose !== null && mochaLinked(state)) {
    const side = LINK_SIDE * sx * (mochaWalk || held ? 1 : kStep);
    mochaPose = { ...mochaPose, x: mochaPose.x + side };
  }
  let mochaOpacity = 1;
  if (reduced && !still && mochaTravel && mochaStart && mochaPose) {
    const f = fadeSlide(mochaStart, [mochaPose.x, mochaPose.y], ms);
    mochaPose = { x: f.x, y: f.y, moving: f.opacity < 1 };
    mochaOpacity = f.opacity;
  }
  const mochaDir = mochaTravel && mochaStart && mochaNodeEnd ? travelDir(mochaStart, mochaNodeEnd) : 0;
  const mochaTilt = still ? 0 : standeeTilt(ms, tickMs, mochaDir, reduced);
  // At rest he sits turned toward 寶咖咖 — or, with a hint's yawn or look, toward the hinted target;
  // travelling, toward where he is going (frames face right)
  const lookAt: Pt | null = nopeAt ?? strainAt ?? ((cue === 'yawn' || cue === 'look') && hinted !== undefined ? hitCenter(hinted.hit) : babyPose ? [babyPose.x, babyPose.y] : null);
  const mochaFacing = mochaDir !== 0 ? (mochaDir < 0 ? 'l' : 'r') : mochaPose && lookAt && lookAt[0] < mochaPose.x - 4 ? 'l' : 'r';

  // ——— What is said (#98): the thought bubble, barks, subtitles, placed off him and the goal ———
  const k = talkScale(scale, textScale);
  const babyHead = spriteHead(bAnim.sprite, state.baby.facing);
  const babyBox = spriteBox(bAnim.sprite, state.baby.facing);
  const mochaHead = spriteHead(mAnim.sprite, mochaFacing);
  const mochaBox = spriteBox(mAnim.sprite, mochaFacing);
  const goal = def.attractors.find((a) => a.goal);
  const goalNode = goal === undefined || state.done || state.consumed.includes(goal.id) ? null : attractorNode(def, state, goal);
  const goalAt = goalNode === null ? undefined : nodePos(def, state, goalNode);
  const barks = useMemo(() => barksProp ?? barksOf(prev, state, events), [barksProp, prev, state, events]);
  const beat = talk?.beat ?? null;
  // Where he is drawn at the tick's end: his node, or up on a carrier's arm (#136: a carried baby
  // was laid out at his node, so 10-2's 大字 line covered his head held high)
  const babyAt = useMemo((): Pt | undefined => {
    if (babyEnd === undefined) return undefined;
    const p = carriedPose(def, prev, state, { x: babyEnd[0], y: babyEnd[1], moving: false }, tickMs, true, 1);
    return [p.x, p.y];
  }, [def, prev, state, babyEnd?.[0], babyEnd?.[1], tickMs]);
  // Laid out at the tick's end positions: the layout changes once a tick, not every frame
  const said = useMemo(() => {
    const actor = (at: Pt | undefined, head: Pt, box: { x: number; y: number; w: number; h: number }): TalkActor | null =>
      at === undefined ? null : { at, head: [at[0] + head[0], at[1] + head[1]], box: { ...box, x: at[0] + box.x, y: at[1] + box.y } };
    return layoutTalk({
      k,
      baby: actor(babyAt, babyHead, babyBox),
      mocha: mochaHidden ? null : actor(mochaEnd, mochaHead, mochaBox),
      goal: goalAt === undefined ? null : goalBox(goalAt),
      tudigong: [def.tudigong.x, def.tudigong.y],
      thought: show,
      barks,
      beat,
      touch: beat === null ? [] : targets.map((tg) => hitBox(tg.hit)),
      // The paw prints and the hinted target: the thought bubble and the barks keep off them too (#183)
      // and the level wheels' dials (#221)
      marks: [...targets.filter((tg) => tg.kind === 'perch' || tg.key === hinted?.key).map((tg) => hitBox(tg.hit)), ...dials],
    });
  }, [k, state, def, bAnim.sprite, mAnim.sprite, mochaFacing, mochaHidden, showKey(show), barks, beat, hinted?.key, babyAt?.[0], babyAt?.[1]]);
  // A beat too big for the page (#197) is split before it is painted: the rest follow on the next tap
  const onCrowded = talk?.onCrowded;
  useLayoutEffect(() => {
    if (beat !== null && said.fit < beat.length) onCrowded?.(beat, said.fit);
  }, [beat, said.fit, onCrowded]);
  const babyOff: Pt = babyPose && babyAt ? [babyPose.x - babyAt[0], babyPose.y - babyAt[1]] : [0, 0];
  const mochaOff: Pt = mochaPose && mochaEnd ? [mochaPose.x - mochaEnd[0], mochaPose.y - mochaEnd[1]] : [0, 0];
  const mochaEl = mochaPose && (
    <Mocha x={mochaPose.x} y={mochaPose.y} anim={mAnim} frame={mFrame} glare={locked?.serial} facing={mochaFacing} tilt={mochaTilt} opacity={mochaOpacity} reduced={reduced} still={still} tapping={cue === 'wait'} />
  );
  // Linked and on one node (or about to be): the pool of light under the pair (#128)
  const together = linked && !state.done && state.baby.node === mochaTo;
  const was = still ? show : bubbleShow(def, prev);

  // ——— The grab (GDD § 2.8 step 1): 「這個！」 (a bark) and a sparkle burst where the shiny was ———
  const grab = events.find((e) => e.type === 'grab');
  const grabAt = useMemo((): Pt | null => {
    if (grab === undefined) return null;
    const a = def.attractors.find((x) => x.id === grab.id);
    const node = a === undefined ? null : attractorNode(def, prev, a);
    return (node === null ? undefined : nodePos(def, prev, node)) ?? babyEnd ?? null;
  }, [grab, def, prev, babyEnd?.[0], babyEnd?.[1]]);

  // ——— 土地公, when his condition shows him ———
  const tdg = def.tudigong;
  const tudigongShown = holds(def, state, tdg.visibleWhen);

  // ——— Hints (bible § 4.1 L0–L2): a halo behind the target, the ghost hand over the page ———
  const halo = hinted && (
    <HintHalo key={`halo:${hinted.key}:${hint?.level === 0 ? 'nudge' : 'where'}`} ctx={ctx} shape={haloShape(def, state, hinted)} target={hinted.key} reduced={reduced} strong={affordance.elder} once={hint?.level === 0} />
  );
  // A perch has no art of its own to glow behind: its halo goes up with the paw prints (fx, below)
  const haloOnTop = hinted !== undefined && hinted.kind === 'perch';
  const haloMid = hinted !== undefined && hinted.layer <= 3 && !haloOnTop;
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
      {/* A moving 月亮線 car's window strip, just over the backdrop (#193) */}
      <Layer id="strip">
        <WindowStrip def={def} reduced={reduced || lowPower} />
      </Layer>
      <Layer id="cutouts">
        <ArtG html={statics.cutouts} />
        {/* Cut-outs that appear with a state (#115: 2-6's portrait of Mocha once all three flaps are open) */}
        {(def.cutouts ?? []).filter((c) => c.visibleWhen !== undefined && holds(def, state, c.visibleWhen)).map((c) => (
          <ArtG key={c.art} html={cutoutSvg(c)} />
        ))}
        {tudigongShown && <TudigongItem ctx={ctx} x={tdg.x} y={tdg.y} hat={tdg.hat} />}
      </Layer>
      <Layer id="parts-mid">
        {haloMid && halo}
        {stage.carriages.map((c) => (
          <CarriageView key={c.part} def={def} prev={prev} state={state} carriage={c} ctx={ctx} ms={ms} reduced={reduced} preview={preview} />
        ))}
        {partEls('mid')}
        {trunks !== '' && <ArtG html={trunks + branches} />}
        {slotRiders.map((r) => (
          <RiderView key={r.node} def={def} prev={prev} state={state} node={r.node} html={r.html} ms={ms} reduced={reduced} preview={preview} />
        ))}
      </Layer>
      <Layer id="floor">
        <ArtG html={statics.floor} />
        {crossings}
        {puddles && <ArtG html={puddles} />}
        {footprints && <ArtG html={footprints} />}
        {/* Linked (#128): the floor's marks lie on the floor, under whoever stands near them */}
        {floors.length > 0 && <g data-floor-marks="">{floors}</g>}
        {/* A swing's stops printed on the floor under it (#221) */}
        {swingHtml !== '' && <ArtG html={swingHtml} />}
      </Layer>
      <Layer id="parts-near">
        {!haloMid && !haloOnTop && halo}
        {partEls('near')}
        {attractors}
      </Layer>
      <Layer id="creatures">
        {/* A park page's fireflies drift over it (#115), the page's smallest creatures */}
        {(dressOf(def).fireflies ?? 0) > 0 && <Fireflies ctx={ctx} count={dressOf(def).fireflies!} seed={def.index * 31 + def.chapter} reduced={reduced} />}
        {creatures}
      </Layer>
      <Layer id="actors">
        {/* The characters in their chapter's half grade (#96: a baked variant of each frame) */}
        <SpriteGrade.Provider value={chapterGradeKey(def.chapter)}>
        {/* 一起 (#128): side by side, the two of them stand in one warm pool of light */}
        {together && babyPose && mochaPose && (
          <ellipse data-together="" cx={r2((babyPose.x + mochaPose.x) / 2)} cy={r2((babyPose.y + mochaPose.y) / 2 - 3)} rx={r2(Math.abs(mochaPose.x - babyPose.x) / 2 + 40)} ry={16} fill={`url(#${ctx.id('standeeGlow')})`} />
        )}
        {/* Linked (#128) Mocha walks ahead of him, so he is drawn in front */}
        {!linked && mochaEl}
        {babyPose && (
          <Baby x={babyPose.x} y={babyPose.y} mode={state.baby.mode} anim={bAnim} frame={bFrame} sx={sx} tilt={babyTilt} opacity={babyOpacity} watch={watch} glow={glow} reduced={reduced} still={still} />
        )}
        {linked && mochaEl}
        </SpriteGrade.Provider>
      </Layer>
      <Layer id="fx">
        {sayWord !== null && babyEnd && <SayRing word={sayWord} at={babyEnd} facing={state.baby.facing} reduced={reduced} />}
        {babyPose && babyEnd && show && said.thought && (
          <ThoughtBubble
            ctx={ctx}
            show={show}
            was={was}
            appeared={was === null}
            placed={said.thought}
            head={[babyEnd[0] + babyHead[0], babyEnd[1] + babyHead[1]]}
            offset={babyOff}
            k={k}
            reduced={reduced}
            still={still}
            spotlight={affordance.bubble === true}
          />
        )}
        {said.barks.map((b) => (
          <BarkBubble key={b.bark.who} placed={b} offset={b.bark.who === 'baby' ? babyOff : mochaOff} k={k} reduced={reduced} />
        ))}
        {/* Mocha's perch paws and a perch's hint halo over every standee, the thought bubble and the
            barks (#183: 0-3's table, 1-3's counter and its L1 glow were hidden); only a subtitle,
            which any tap clears, may sit over one */}
        {(marks.length > 0 || haloOnTop) && (
          <g data-marks="">
            {haloOnTop && halo}
            {marks}
          </g>
        )}
        {(said.strip || said.subs.length > 0) && (
          <Subtitles strip={said.strip} subs={said.subs} horn={said.horn} k={k} ride={{ baby: babyOff, mocha: mochaOff }} serial={talk?.serial ?? 0} reduced={reduced} onAdvance={talk?.onAdvance} />
        )}
        {grabAt && <GrabBurst key={`grab:${state.tick}`} at={grabAt} reduced={reduced} sparse={lowPower} />}
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

/** A placed cut-out's baked bitmap (nothing while it has none). */
function cutoutSvg(c: CutoutDef): string {
  const img = cutoutBitmap(c.art);
  return img ? `<g data-cutout="${c.art}" transform="translate(${c.x} ${c.y})">${image(img.url, img.box)}</g>` : '';
}

/** A hit shape's bounding box. */
const hitBox = (h: Hit) => ('r' in h ? { x: h.cx - h.r, y: h.cy - h.r, w: 2 * h.r, h: 2 * h.r } : h);

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

type AttractorLook = 'pool' | 'held' | 'decoy' | 'decoyHeld';

/** Where a held decoy sits on its holder's face, from the holder's feet: 3-6's glasses on 藍教授's eye (#117, `campus.ts`). */
const HELD_DECOY_FACE = [-11, -31] as const;

function AttractorItem({ ctx, id, kind, art, x, y, treasure, look, from }: { ctx: KitCtx; id: string; kind: PageDef['attractors'][number]['kind']; art?: string; x: number; y: number; treasure?: number; look?: AttractorLook; from?: Pt }) {
  // A spread's goal is the chapter treasure (GDD § 2.9, #103), drawn as itself in its cup of light
  const html = useMemo(
    () => (look === 'pool' ? spotPool(ctx, from) : look === 'decoy' || look === 'decoyHeld' ? decoyArt(ctx, art) : treasure === undefined ? attractorArt(ctx, kind) : treasureOnPage(ctx, treasure)),
    [ctx, kind, art, treasure, look, from?.[0], from?.[1]],
  );
  // Shinies hover a little above the ledge, in their cup of light; a pool of light lies on the floor;
  // a held item is up in its creature's paws, a little smaller; a decoy lies where it is (the moon on
  // the water, the bell in its tower), or on its holder's face
  const at = look === 'pool' || look === 'decoy' ? `translate(${r2(x)} ${r2(y)})`
    : look === 'decoyHeld' ? `translate(${r2(x + HELD_DECOY_FACE[0])} ${r2(y + HELD_DECOY_FACE[1])}) scale(0.62)`
    : look === 'held' ? `translate(${r2(x + 9)} ${r2(y - 20)}) scale(0.72)` : `translate(${r2(x)} ${r2(y - 14)})`;
  return (
    <g data-attractor={id} transform={at}>
      <ArtG html={html} />
    </g>
  );
}

function PerchMarkItem({ ctx, perch, def, state, bold, nope = false }: { ctx: KitCtx; perch: PerchDef; def: PageDef; state: SimState; bold: boolean; nope?: boolean }) {
  const p = nodePos(def, state, perch.node);
  const html = useMemo(() => (p ? perchMark(ctx, p[0], p[1], bold) : ''), [ctx, p?.[0], p?.[1], bold]);
  return <ArtG html={html} className={nope ? 'perch-mark perch-nope' : 'perch-mark'} />;
}

/** Linked mode's floor mark (#128): a paw and a footprint where a tap leads them; shakes on a 「喵？」. */
function FloorMarkItem({ ctx, x, y, bold, nope = false }: { ctx: KitCtx; x: number; y: number; bold: boolean; nope?: boolean }) {
  const html = useMemo(() => floorMark(ctx, x, y, bold), [ctx, x, y, bold]);
  return <ArtG html={html} className={nope ? 'perch-mark perch-nope' : 'perch-mark'} />;
}

function TudigongItem({ ctx, x, y, hat }: { ctx: KitCtx; x: number; y: number; hat?: string }) {
  const html = useMemo(() => `<g data-tudigong="" transform="translate(${x} ${y}) rotate(14) scale(1.2)">${tudigong(ctx, hat)}</g>`, [ctx, x, y, hat]);
  return <ArtG html={html} />;
}

/**
 * The sparkle burst of a grab (GDD § 2.8 step 1; bible § 8 sparkles on foil; #101): eight foil rays
 * and three four-point glints flash out of the shiny's place once (≈ 650 ms) and are gone. Its own
 * style is the burst at its fullest, so a still shows it; reduced motion only fades it. In low
 * power (`sparse`, bible § 9.3) it has half the rays and glints.
 */
function GrabBurst({ at, reduced, sparse = false }: { at: Pt; reduced: boolean; sparse?: boolean }) {
  const html = useMemo(() => {
    let rays = '';
    const n = sparse ? 4 : 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.2;
      const r0 = i % 2 === 0 ? 16 : 19;
      const r1 = i % 2 === 0 ? 38 : 30;
      rays += `M${r2(Math.cos(a) * r0)} ${r2(Math.sin(a) * r0)}L${r2(Math.cos(a) * r1)} ${r2(Math.sin(a) * r1)}`;
    }
    const glint = (x: number, y: number, r: number) => {
      const k = r * 0.18;
      return `<path d="M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z" fill="${POPUP.goldLight}" stroke="${POPUP.goldDeep}" stroke-width=".8"/>`;
    };
    return `<circle r="13" fill="${POPUP.lampHot}" opacity=".55"/>`
      + `<path d="${rays}" stroke="${POPUP.goldLight}" stroke-width="3" stroke-linecap="round"/>`
      + `<path d="${rays}" stroke="${POPUP.goldDeep}" stroke-width="1" stroke-linecap="round" opacity=".5"/>`
      + glint(-24, -22, 8.5) + glint(27, -12, 6) + (sparse ? '' : glint(6, 29, 5.5));
  }, [sparse]);
  return (
    <g transform={`translate(${r2(at[0])} ${r2(at[1] - 16)})`} data-grab-burst="">
      <g className={reduced ? 'grab-burst-fade' : 'grab-burst'} dangerouslySetInnerHTML={{ __html: html }} />
    </g>
  );
}
