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
import { SpriteGrade, chapterGradeKey, spriteBox, spriteHead } from '../sprites';
import type { TalkLine } from '../content/script';
import {
  Baby,
  Creature,
  LAMP_GLOW_R,
  Mocha,
  babyAnim,
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
  travelDir,
} from './actors';
import './affordance/affordance.css';
import { haloShape, handGesture, linkThread } from './affordance/hints';
import { GhostHand, HintHalo, LinkThread } from './affordance/Hints';
import { NO_AFFORDANCE, wearsMarigold, type AffordanceFlags, type PartLook } from './affordance/look';
import { treasureOnPage } from './photo/treasureArt';
import { dressOf, ledgeStyleOf, ownsPost } from './art/dress';
import { dressedLedge, foregroundCard } from './art/ledges';
import { attractorArt, chapterSky, spine, perchMark, perchPost, rail, ramp, stageDefs, themeOf, trackPit, tudigong } from './art/placeholders';
import { backdropArt, backdropBitmap, cutoutBitmap } from './art/registry';
import { PAGE_VIEW_BOX, type Hit, type Pt } from './geometry';
import { NO_GESTURE, hitCenter, minHit, rideHome, shiftHit, targetsOf, type GestureFlags } from './gestures';
import { clamp01, drawnNodePos, easeInOut, lerpPt, offpagePoint, partProgress, stepPose } from './interp';
import { PRESET_Z, type LayerId } from './layers';
import { ArtG, r2 } from './parts/common';
import { CarriageView, MOVERS, PART_VIEWS, type MoverProps, type PartViewProps } from './parts';
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
  readonly talk?: { readonly beat: readonly TalkLine[] | null; readonly serial: number; readonly onAdvance?: () => void };
  /** 大字 (#104): the bubbles' text grows by this much (1 or 1.25) */
  readonly textScale?: number;
  /** Low power (bible § 9.3, #104): the grab's sparkle burst at half its rays and glints */
  readonly lowPower?: boolean;
}

const NO_EVENTS: readonly SimEvent[] = [];

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

export function PageView({ def, prev, state, ms, tickMs, scale = 1, reduced: reducedProp, gesture = NO_GESTURE, affordance = NO_AFFORDANCE, still = false, events = NO_EVENTS, barks: barksProp, talk, textScale = 1, lowPower = false }: PageViewProps) {
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
    const cutouts = (def.cutouts ?? []).map((c) => {
      const img = cutoutBitmap(c.art);
      return img ? `<g data-cutout="${c.art}" transform="translate(${c.x} ${c.y})">${image(img.url, img.box)}</g>` : '';
    }).join('') + stage.carriages.map(trackPit).join('');
    // The ledges in the page's material and the perch furniture its backdrop doesn't draw itself (#108, `art/dress.ts`)
    const floor = stage.slopes.map((s) => ramp(ctx, s, theme)).join('')
      + stage.runs.map((run) => dressedLedge(ctx, run, (y) => ledgeStyleOf(def, y), theme, dressOf(def).ledgeSplit)).join('')
      + stage.posts.filter((p) => !ownsPost(def, p.perch)).sort((a, b) => a.foot - b.foot).map((p) => `<g data-post="${p.perch}">${perchPost(ctx, p)}</g>`).join('');
    const card = dressOf(def).foreground;
    const slot = card === null ? null : foregroundSlot(def);
    const foreground = slot === null ? '' : `<g data-foreground="${card ?? 'plant'}" transform="translate(${slot.x} ${slot.foot})">${foregroundCard(ctx, card ?? 'plant')}</g>`;
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
    return <AttractorItem key={a.id} ctx={ctx} id={a.id} kind={a.kind} x={p[0]} y={p[1]} treasure={a.goal && def.spread ? def.chapter : undefined} />;
  });
  const marks = mochaOn
    ? def.perches.filter((p) => p.id !== state.mocha.perch).map((p) => <PerchMarkItem key={p.id} ctx={ctx} perch={p} def={def} state={state} bold={affordance.elder === true} />)
    : [];

  // ——— Creatures ———
  const creatures = def.creatures.map((c) => {
    const a = creaturePoint(def, c, prev, state);
    const b = creaturePoint(def, c, state, prev);
    if (a === null || b === null) return null;
    const k = reduced ? 1 : clamp01(t);
    const [x, y] = lerpPt(a, b, k);
    return <Creature key={c.id} ctx={ctx} id={c.id} art={c.art} x={x} y={y} flip={b[0] < a[0]} pos={state.creatures[c.id] ?? c.initial} />;
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
  const bAnim = babyAnim({ mode: state.baby.mode, edge: babyEdge, riding, growth: stepGrowth(def, state), watching: finger !== null, word: sayWord });
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
  const mochaStart = mochaFrom === null ? undefined : nodePos(def, prev, mochaFrom);
  const mochaEnd = mochaTo === null ? undefined : nodePos(def, state, mochaTo);
  const stared = prev.mocha.stare;
  const mState = mochaState({
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
  // A hint's cue (#100) while he is at rest: the nudge's yawn, 「等等看。」's sit; he looks at the hinted target
  const cue = affordance.mocha && mochaCueFits(mState) ? affordance.mocha : null;
  const mAnim = cue === 'yawn' || cue === 'wait' ? MOCHA_CUE_ANIM[cue] : MOCHA_STATE_ANIM[mState];
  const mFrame = chooseFrame(mAnim, { k: tStep, dist: 0, tickMs, hold: held });
  // In a box (C9) he is still drawn at the perch: the `inbox` frame is only his head and paws over the rim
  let mochaPose = stepPose(def, prev, state, mochaFrom, mochaTo, tStep, ms, { reduced, hop: 24, preview });
  let mochaOpacity = 1;
  if (reduced && !still && mochaTravel && mochaStart && mochaPose) {
    const f = fadeSlide(mochaStart, [mochaPose.x, mochaPose.y], ms);
    mochaPose = { x: f.x, y: f.y, moving: f.opacity < 1 };
    mochaOpacity = f.opacity;
  }
  const mochaDir = mochaTravel && mochaStart && mochaEnd ? travelDir(mochaStart, mochaEnd) : 0;
  const mochaTilt = still ? 0 : standeeTilt(ms, tickMs, mochaDir, reduced);
  // At rest he sits turned toward 寶咖咖 — or, with a hint's yawn or look, toward the hinted target;
  // travelling, toward where he is going (frames face right)
  const lookAt: Pt | null = (cue === 'yawn' || cue === 'look') && hinted !== undefined ? hitCenter(hinted.hit) : babyPose ? [babyPose.x, babyPose.y] : null;
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
  // Laid out at the tick's end positions: the layout changes once a tick, not every frame
  const said = useMemo(() => {
    const actor = (at: Pt | undefined, head: Pt, box: { x: number; y: number; w: number; h: number }): TalkActor | null =>
      at === undefined ? null : { at, head: [at[0] + head[0], at[1] + head[1]], box: { ...box, x: at[0] + box.x, y: at[1] + box.y } };
    return layoutTalk({
      k,
      baby: actor(babyEnd, babyHead, babyBox),
      mocha: mochaHidden ? null : actor(mochaEnd, mochaHead, mochaBox),
      goal: goalAt === undefined ? null : goalBox(goalAt),
      tudigong: [def.tudigong.x, def.tudigong.y],
      thought: show,
      barks,
      beat,
      touch: beat === null ? [] : targets.map((tg) => hitBox(tg.hit)),
    });
  }, [k, state, def, bAnim.sprite, mAnim.sprite, mochaFacing, mochaHidden, showKey(show), barks, beat]);
  const babyOff: Pt = babyPose && babyEnd ? [babyPose.x - babyEnd[0], babyPose.y - babyEnd[1]] : [0, 0];
  const mochaOff: Pt = mochaPose && mochaEnd ? [mochaPose.x - mochaEnd[0], mochaPose.y - mochaEnd[1]] : [0, 0];
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
    <HintHalo key={`halo:${hinted.key}:${hint?.level === 0 ? 'nudge' : 'where'}`} ctx={ctx} shape={haloShape(def, state, hinted)} reduced={reduced} strong={affordance.elder} once={hint?.level === 0} />
  );
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
        {tudigongShown && <TudigongItem ctx={ctx} x={tdg.x} y={tdg.y} hat={tdg.hat} />}
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
        {/* The characters in their chapter's half grade (#96: a baked variant of each frame) */}
        <SpriteGrade.Provider value={chapterGradeKey(def.chapter)}>
        {mochaPose && (
          <Mocha x={mochaPose.x} y={mochaPose.y} anim={mAnim} frame={mFrame} glare={locked?.serial} facing={mochaFacing} tilt={mochaTilt} opacity={mochaOpacity} reduced={reduced} still={still} tapping={cue === 'wait'} />
        )}
        {babyPose && (
          <Baby x={babyPose.x} y={babyPose.y} mode={state.baby.mode} anim={bAnim} frame={bFrame} sx={sx} tilt={babyTilt} opacity={babyOpacity} watch={watch} glow={glow} reduced={reduced} still={still} />
        )}
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

function AttractorItem({ ctx, id, kind, x, y, treasure }: { ctx: KitCtx; id: string; kind: PageDef['attractors'][number]['kind']; x: number; y: number; treasure?: number }) {
  // A spread's goal is the chapter treasure (GDD § 2.9, #103), drawn as itself in its cup of light
  const html = useMemo(() => (treasure === undefined ? attractorArt(ctx, kind) : treasureOnPage(ctx, treasure)), [ctx, kind, treasure]);
  // Shinies hover a little above the ledge, in their cup of light
  return (
    <g data-attractor={id} transform={`translate(${r2(x)} ${r2(y - 14)})`}>
      <ArtG html={html} />
    </g>
  );
}

function PerchMarkItem({ ctx, perch, def, state, bold }: { ctx: KitCtx; perch: PerchDef; def: PageDef; state: SimState; bold: boolean }) {
  const p = nodePos(def, state, perch.node);
  const html = useMemo(() => (p ? perchMark(ctx, p[0], p[1], bold) : ''), [ctx, p?.[0], p?.[1], bold]);
  return <ArtG html={html} className="perch-mark" />;
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
