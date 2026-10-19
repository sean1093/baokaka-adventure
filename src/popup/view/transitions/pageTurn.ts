import { POPUP as C } from '../../../art/palette';
import { GUTTER_Y, PAGE_VIEW_BOX } from '../geometry';
import type { SfxCue } from '../../../shared/audio';
import type { LayerId } from '../layers';

/**
 * The page fold and the chapter turn (popup art bible § 2.4, § 9.2; proof C; #97), built as a
 * temporary DOM driven by the Web Animations API and torn down after.
 *
 * **Page fold** (page complete → next page, ≈ 1.5 s):
 * | t (ms)     | what happens                                                                     |
 * |------------|----------------------------------------------------------------------------------|
 * | 0–150      | the old page settles; the standees do a tiny hop                                  |
 * | 150–600    | the old pop-ups fold flat in reverse z (near first), 220 ms each, 55 ms apart       |
 * | 600–900    | the backdrop leaf falls toward the reader about the gutter and bends in 3 strips,   |
 * |            | the lower strip leading; behind it the new page's backdrop; its back is the new floor |
 * | 900–1500   | the new pop-ups rise with an overshoot (70° → −6° → 0, read as a scaleY), z1 → z5   |
 * |            | 60 ms apart, the standees last                                                    |
 *
 * **Chapter turn** (a new chapter, ≈ 2.4 s, tap to skip): the camera dollies back to a 3/4 view of
 * the open book on 阿嬤's quilt (one transform on the book), the same fold with a slower leaf
 * (1.4 s), the chapter card (the departure board, `hud/ChapterBoard.tsx`, #102) dropping in on two
 * strings and swinging twice while its split-flap row flips in, then the camera dollies back in.
 *
 * **Chapter open** (#102: a chapter's first page opened from the cover or the 目錄, ≈ 1.9 s): the
 * same without an old page — the book already lies on the quilt in the 3/4 view with its pop-ups
 * flat, the card drops in and swings, lifts away, the camera dollies in and the pop-ups rise.
 *
 * **The card's lines** (#102, GDD § 5.2): once the card has settled the turn can hold again, as for
 * the interlude, while the card's narration plays under it tap by tap. Only the camera, the card
 * and what has not started yet are held: what is already moving (the leaf, the confetti, the new
 * page rising under the card in a chapter turn) finishes.
 *
 * **Reduced motion:** a 0.25 s cross-fade plus a single 4 px rise of the new layers: no camera, no
 * leaf, no confetti, no flaps. The chapter card fades in, holds for its lines and fades out.
 *
 * **The interlude** (#101, GDD § 2.8): a turn can stop at `swapAt` — the old pop-ups folded flat,
 * the leaf not yet lifted (with reduced motion: before the fade) — and wait for something to happen
 * over the flat page (the sticker card) before it goes on. Every running animation and pending step
 * is held meanwhile; the chapter card only starts dropping after it.
 *
 * The pop-ups are the page's own layers (`data-layer` groups of `PageView`), folded and raised with
 * a `scaleY` about their base (an SVG group takes 2D transforms only; the cosine of the bible's
 * rotateX is the same silhouette). The leaf's faces are the pages' baked backdrops (bible § 9.2:
 * "textures are the same baked page bitmaps"). Nothing here touches the simulation: the session is
 * held for the whole turn and the new page starts when it ends.
 */

export type TurnKind = 'fold' | 'chapter' | 'open';

/** The bible § 2.4 timing table, in ms from the start of the turn. */
export const FOLD_MS = { settle: 150, foldEnd: 600, leafEnd: 900, end: 1500 } as const;
export const CHAPTER_MS = { dolly: 450, leafStart: 450 + 450, leaf: 1400, end: 2400 } as const;
/** The chapter open (#102): the card drops at once over the book on the quilt; the camera comes in after it lifts. */
export const OPEN_MS = { card: 200, dollyIn: 1200, end: 1900 } as const;
export const REDUCED_MS = 250;
/** The chapter card starts dropping this long after the leaf starts to lift (#101). */
export const CARD_AFTER_LEAF_MS = 60;
/**
 * The chapter card's motion (bible § 2.4 "drops in on two strings, swings twice and settles"): the
 * drop and swings, the pause before it lifts away, the lift; its split-flap tiles flip in one after
 * another (each 2 × 110 ms, 70 ms apart) while it swings. Reduced motion: fades of `fade`.
 */
export const CARD_MS = { drop: 820, stay: 150, lift: 300, flip: 220, flipGap: 70, flipAt: 380, fade: 200 } as const;

/** Per pop-up timing (bible § 8: fold 220 ms ease-in; rise 320 ms, staggered 60 ms by z). */
export const FOLD_EACH_MS = 220;
export const RISE_EACH_MS = 320;
export const STAGGER_MS = 60;
/** The fold's stagger: five depths inside the table's 150–600 ms */
export const FOLD_STAGGER_MS = 55;

/**
 * The page's layers that fold and rise, grouped by depth, near first (the fold's order): z5 the
 * foreground card, the standees and creatures, z4 the ledges and near parts, z3 the mid parts, z2
 * the cut-outs. The rise runs z2 → z5 with the standees last (`RISE_GROUPS`).
 */
export const FOLD_GROUPS: readonly (readonly LayerId[])[] = [['foreground'], ['actors', 'creatures'], ['parts-near', 'floor'], ['parts-mid'], ['cutouts']];
export const RISE_GROUPS: readonly (readonly LayerId[])[] = [['cutouts'], ['parts-mid'], ['floor', 'parts-near'], ['foreground'], ['creatures', 'actors']];
export const POPUP_LAYERS: readonly LayerId[] = FOLD_GROUPS.flat();

/** The camera's 3/4 view in a chapter turn (bible § 2.4: ≈ 0.8 scale, rotateX −31°, rotateY −17°, softened for a phone). */
export const CAMERA = { scale: 0.74, rotateX: 24, rotateY: -14, rotateZ: -1.5, lift: -6 } as const;

/** One step of a turn's plan: when the old page folds, when the leaf falls, when the new page swaps in and rises. */
export interface TurnPlan {
  readonly kind: TurnKind;
  readonly reduced: boolean;
  /** When the new page replaces the old one under the leaf (or the fade) */
  readonly swapAt: number;
  readonly fold: { readonly start: number; readonly each: number; readonly stagger: number } | null;
  readonly leaf: { readonly start: number; readonly duration: number } | null;
  readonly rise: { readonly start: number; readonly each: number; readonly stagger: number };
  /** The camera: away by `outEnd` (0: it starts away), back in from `inStart` to `inEnd` */
  readonly camera: { readonly outEnd: number; readonly inStart: number; readonly inEnd: number } | null;
  /** The chapter card: drops from `start`, has settled at `settle` (its lines hold the turn there), lifts away at `leave` */
  readonly card: { readonly start: number; readonly settle: number; readonly leave: number } | null;
  readonly end: number;
}

/** The turn's timeline (pure; the unit tests pin it to bible § 2.4). */
export function turnPlan(kind: TurnKind, reduced: boolean): TurnPlan {
  if (reduced) {
    // The card (a chapter): fades in over the cross-fade, holds for its lines, fades out
    const card = kind === 'fold' ? null : { start: 0, settle: CARD_MS.fade, leave: CARD_MS.fade };
    return { kind, reduced, swapAt: 0, fold: null, leaf: null, rise: { start: 0, each: REDUCED_MS, stagger: 0 }, camera: null, card, end: card ? card.leave + CARD_MS.fade + 50 : REDUCED_MS };
  }
  if (kind === 'open') {
    // No old page: the book is on the quilt from the start, its pop-ups flat until the camera comes in
    const settle = OPEN_MS.card + CARD_MS.drop;
    return {
      kind,
      reduced,
      swapAt: 0,
      fold: null,
      leaf: null,
      rise: { start: OPEN_MS.dollyIn + 100, each: RISE_EACH_MS, stagger: STAGGER_MS },
      camera: { outEnd: 0, inStart: OPEN_MS.dollyIn, inEnd: OPEN_MS.dollyIn + CHAPTER_MS.dolly },
      card: { start: OPEN_MS.card, settle, leave: settle + CARD_MS.stay },
      end: OPEN_MS.end,
    };
  }
  if (kind === 'fold') {
    return {
      kind,
      reduced,
      swapAt: FOLD_MS.foldEnd,
      fold: { start: FOLD_MS.settle, each: FOLD_EACH_MS, stagger: FOLD_STAGGER_MS },
      leaf: { start: FOLD_MS.foldEnd, duration: FOLD_MS.leafEnd - FOLD_MS.foldEnd },
      rise: { start: FOLD_MS.leafEnd, each: RISE_EACH_MS, stagger: STAGGER_MS },
      camera: null,
      card: null,
      end: FOLD_MS.end,
    };
  }
  // The chapter turn: dolly out, fold, a slow leaf, rise, dolly in, inside ≈ 2.4 s
  const leafStart = CHAPTER_MS.dolly + FOLD_MS.foldEnd - FOLD_MS.settle; // the fold runs while the camera settles
  const leafEnd = leafStart + CHAPTER_MS.leaf * 0.6;
  const cardStart = leafStart + CARD_AFTER_LEAF_MS;
  return {
    kind,
    reduced,
    swapAt: leafStart,
    fold: { start: CHAPTER_MS.dolly - 150, each: FOLD_EACH_MS, stagger: FOLD_STAGGER_MS },
    leaf: { start: leafStart, duration: leafEnd - leafStart },
    rise: { start: leafEnd, each: RISE_EACH_MS, stagger: STAGGER_MS },
    camera: { outEnd: CHAPTER_MS.dolly, inStart: CHAPTER_MS.end - CHAPTER_MS.dolly, inEnd: CHAPTER_MS.end },
    // The card drops in as the leaf lifts, after any interlude (the sticker card, #101)
    card: { start: cardStart, settle: cardStart + CARD_MS.drop, leave: cardStart + CARD_MS.drop + CARD_MS.stay },
    end: CHAPTER_MS.end,
  };
}

/** The camera's 3/4 view of the book on the quilt (and home), as the book's transform. */
export function cameraTransform(away: boolean): string {
  const { scale, rotateX, rotateY, rotateZ, lift } = CAMERA;
  return away
    ? `perspective(1250px) translateY(${lift}%) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`
    : 'perspective(1250px) translateY(0) rotateX(0) rotateY(0) rotateZ(0) scale(1)';
}
/** The camera's pivot on the book. */
export const CAMERA_ORIGIN = '50% 55%';

/** What the driver needs from the screen. */
export interface TurnTargets {
  /** The book (the camera moves it in a chapter turn) */
  readonly book: HTMLElement;
  /** Where the temporary DOM goes: a full-screen layer over the book, inside the camera's transform */
  readonly overlay: HTMLElement;
  /** The page box (`data-page-box`) of the page shown now; read again after the swap */
  readonly pageBox: () => HTMLElement | null;
  /** Page units → CSS px */
  readonly scale: number;
  /** The page box's screen position (its top-left is the view box origin) */
  readonly at: { readonly x: number; readonly y: number };
}

export interface TurnPages {
  /** The old page's baked backdrop (the leaf's front, the old floor) */
  readonly fromBackdrop: string | null;
  /** The new page's baked backdrop (the leaf's back: the new floor) */
  readonly toBackdrop: string | null;
  /**
   * The chapter card (#102): the shell renders the departure board above the camera, hidden; the
   * turn shows it when it drops (read then: it may mount after the turn starts) and hides it again
   * at the end. Its split-flap tiles are its `[data-flap]` halves.
   */
  readonly card?: () => HTMLElement | null;
}

/** Something played while the turn holds (the sticker card over the folded page, #101; the chapter card's lines, #102). */
export interface TurnInterlude {
  /** Resolves when the turn may go on */
  run(): Promise<void>;
}

export interface TurnHooks {
  /** At `swapAt`, over the folded page, before the leaf turns (the sticker card) */
  readonly interlude?: TurnInterlude;
  /** At the card's `settle`, while it hangs (its narration lines) */
  readonly card?: TurnInterlude;
  /** Throw confetti off the leaf (default); low power drops it (bible § 9.3, #104) */
  readonly confetti?: boolean;
  /**
   * Its sounds (#105, GDD § 2.12, bible § 8), each as its motion starts: the old pop-ups fold
   * (`fold`), the leaf turns (`leaf`: paper whoosh plus the chime), the new ones land (`fwump`), the
   * chapter card drops (`cardDrop`), flips its row (`flaps`) and lifts (`cardLift`). Timed by the
   * turn's own steps, so they wait out a hold and stop with a skip — except the new page's `fwump`
   * in a fold or a chapter turn, which, like its rise, goes on under the card: it is set off at the
   * swap, `delayMs` ahead.
   */
  readonly sound?: (cue: SfxCue, delayMs?: number) => void;
}

export interface TurnRun {
  /** Resolves when the turn is over and the temporary DOM is gone */
  readonly finished: Promise<void>;
  /** Jump to the end (tap to skip) */
  skip(): void;
}

const VB = PAGE_VIEW_BOX;
/** The leaf: the standing page from the view box's top to the gutter (page units). */
const LEAF_H = GUTTER_Y - VB.y;
/** The floor below the gutter to the view box's bottom. */
const FLOOR_H = VB.y + VB.h - GUTTER_Y;
/** The leaf shrinks to the floor's depth as it lands. */
const LAND = FLOOR_H / LEAF_H;

const px = (n: number) => `${Math.round(n * 100) / 100}px`;

function el(tag: string, style: Partial<CSSStyleDeclaration>, parent?: HTMLElement, attrs: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent?.appendChild(node);
  return node;
}

/** A slice of a backdrop bitmap as a paint: the view box drawn from page unit `top` (× `stretch`). */
function paint(url: string | null, s: number, top: number, stretch = 1, back = false): Partial<CSSStyleDeclaration> {
  return {
    backfaceVisibility: 'hidden',
    backgroundColor: back ? C.pageDark : C.nightCard,
    backgroundImage: url ? `url(${url})` : '',
    backgroundSize: `${px(VB.w * s)} ${px(VB.h * s * stretch)}`,
    backgroundPosition: `0 ${px(-top * s)}`,
    backgroundRepeat: 'no-repeat',
    transform: back ? 'rotateX(180deg)' : '',
  };
}

/** The page's layer groups in the page box, by depth (missing layers skipped). */
function groupsOf(box: HTMLElement | null, groups: readonly (readonly LayerId[])[]): SVGGElement[][] {
  if (box === null) return [];
  return groups.map((ids) => ids.map((id) => box.querySelector<SVGGElement>(`[data-layer="${id}"]`)).filter((g): g is SVGGElement => g !== null));
}

const based = (g: SVGGElement) => {
  g.style.transformBox = 'fill-box';
  g.style.transformOrigin = '50% 100%';
};

/** Builds and plays a turn. `swap` replaces the old page with the new one (the shell's state change). */
export function playTurn(plan: TurnPlan, targets: TurnTargets, pages: TurnPages, swap: () => void, hooks: TurnHooks = {}): TurnRun {
  const anims: Animation[] = [];
  /** What the card's hold lets finish (#102): what is already moving in a chapter turn */
  const free = new Set<Animation>();
  const temp: HTMLElement[] = [];
  let cardNode: HTMLElement | null = null;
  const s = targets.scale;
  let swapped = false;
  let done = false;
  let resolve!: () => void;
  const finished = new Promise<void>((r) => (resolve = r));

  const add = (a: Animation) => {
    anims.push(a);
    return a;
  };
  const addFree = (a: Animation) => {
    free.add(a);
    return add(a);
  };
  // Steps at a time from the turn's start; held, with the running animations, during the interlude
  const steps: { at: number; fn: () => void; handle: number; fired: boolean }[] = [];
  let held: { at: number; anims: Animation[] } | null = null;
  const arm = (st: (typeof steps)[number], from: number) => {
    st.handle = window.setTimeout(() => {
      st.fired = true;
      st.fn();
    }, Math.max(0, st.at - from));
  };
  // Every step is set while the turn is built, so all count from the same 0 and steps due at the same
  // time keep their order (the interlude first)
  const later = (at: number, fn: () => void) => {
    const st = { at, fn, handle: 0, fired: false };
    steps.push(st);
    arm(st, 0);
  };
  /** Holds the turn at `at` while `run` plays: the pending steps and the running animations `pick` chooses. */
  const holdAt = (at: number, run: () => Promise<void>, pick: (a: Animation) => boolean) =>
    later(at, () => {
      if (done) return;
      const running = anims.filter((a) => a.playState === 'running' && pick(a));
      running.forEach((a) => a.pause());
      for (const st of steps) if (!st.fired) window.clearTimeout(st.handle);
      held = { at, anims: running };
      void run().then(() => {
        const h = held;
        held = null;
        if (done || h === null) return;
        h.anims.forEach((a) => a.play());
        for (const st of steps) if (!st.fired) arm(st, h.at);
      });
    });
  // Registered first: at `swapAt` it runs before the steps due at the same time (the leaf, the swap)
  if (hooks.interlude) holdAt(plan.swapAt, () => hooks.interlude!.run(), () => true);
  const doSwap = () => {
    if (swapped) return;
    swapped = true;
    swap();
  };

  // ——— Its sounds, on the turn's clock ———
  const sfx = hooks.sound;
  if (sfx) {
    const at = (t: number, cue: SfxCue) => later(t, () => !done && sfx(cue));
    if (plan.reduced) {
      // The cross-fade: one turn of the page
      if (plan.kind !== 'open') at(0, 'leaf');
    } else {
      if (plan.fold) at(plan.fold.start, 'fold');
      if (plan.leaf) at(plan.leaf.start, 'leaf');
      // The new pop-ups land (their overshoot's peak, 70 % in)
      const land = plan.rise.start + plan.rise.each * 0.7;
      if (plan.kind === 'open') at(land, 'fwump');
      else later(plan.swapAt + 1, () => !done && sfx('fwump', land - plan.swapAt));
      if (plan.card && pages.card) {
        at(plan.card.start + (plan.card.settle - plan.card.start) * 0.3, 'cardDrop');
        at(plan.card.start + CARD_MS.flipAt, 'flaps');
        at(plan.card.leave, 'cardLift');
      }
    }
  }

  // ——— The old page: settle hop, then fold flat, near first ———
  const oldGroups = groupsOf(targets.pageBox(), FOLD_GROUPS);
  const old = oldGroups.flat();
  if (plan.fold) {
    const actors = targets.pageBox()?.querySelector<SVGGElement>('[data-layer="actors"]');
    if (actors) add(actors.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-5px)', offset: 0.45 }, { transform: 'translateY(0)' }], { duration: FOLD_MS.settle, easing: 'ease-out' }));
    const fx = targets.pageBox()?.querySelector<SVGGElement>('[data-layer="fx"]');
    if (fx) add(fx.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, delay: plan.fold.start, fill: 'forwards' }));
    oldGroups.forEach((group, i) => group.forEach((g) => {
      based(g);
      add(g.animate([{ transform: 'scaleY(1)', opacity: 1 }, { transform: 'scaleY(.06)', opacity: 1, offset: 0.85 }, { transform: 'scaleY(.02)', opacity: 0 }], {
        duration: plan.fold!.each,
        delay: plan.fold!.start + i * plan.fold!.stagger,
        easing: 'cubic-bezier(.5,0,.9,.5)',
        fill: 'forwards',
      }));
    }));
  }

  // ——— The camera (chapter turn): the whole book dollies back onto the quilt and in again ———
  if (plan.camera) {
    const away = cameraTransform(true);
    const home = cameraTransform(false);
    const { outEnd, inStart, inEnd } = plan.camera;
    const ease = 'cubic-bezier(.45,0,.25,1)';
    targets.book.style.transformOrigin = CAMERA_ORIGIN;
    // Each move eases on its own; the plateau between them holds still
    const frames: Keyframe[] = outEnd > 0 ? [{ transform: home, offset: 0, easing: ease }] : [];
    frames.push({ transform: away, offset: outEnd / plan.end }, { transform: away, offset: inStart / plan.end, easing: ease }, { transform: home, offset: inEnd / plan.end });
    if (inEnd < plan.end) frames.push({ transform: home, offset: 1 });
    add(targets.book.animate(frames, { duration: plan.end, fill: 'both' }));
  }

  // ——— The leaf, the old floor under it, confetti off its edge ———
  const box = { left: px(targets.at.x), top: px(targets.at.y), width: px(VB.w * s), height: px(VB.h * s) };
  if (plan.leaf) {
    const stage = el('div', { position: 'absolute', ...box, perspective: px(1200), perspectiveOrigin: `50% ${px((GUTTER_Y - VB.y) * s)}`, pointerEvents: 'none' }, targets.overlay, { 'data-turn': plan.kind });
    temp.push(stage);
    stage.style.visibility = 'hidden';
    later(plan.leaf.start, () => {
      stage.style.visibility = 'visible';
      doSwap();
    });
    const floor = el('div', { position: 'absolute', left: '0', right: '0', top: px(LEAF_H * s), height: px(FLOOR_H * s), ...paint(pages.fromBackdrop, s, LEAF_H) }, stage, { 'data-turn-floor': '' });
    const shade = el('div', { position: 'absolute', inset: '0', background: `linear-gradient(180deg, ${C.shadow}, transparent)`, opacity: '0' }, floor);
    addFree(shade.animate([{ opacity: 0 }, { opacity: 0.55, offset: 0.55 }, { opacity: 0.1 }], { duration: plan.leaf.duration, delay: plan.leaf.start, fill: 'both' }));
    // The hinge at the gutter; the leaf shrinks to the floor's depth as it lands
    const hinge = el('div', { position: 'absolute', left: '0', right: '0', top: px(LEAF_H * s), height: '0', transformStyle: 'preserve-3d', transformOrigin: '50% 0' }, stage);
    addFree(hinge.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(1)', offset: 0.5 }, { transform: `scaleY(${LAND.toFixed(3)})` }], { duration: plan.leaf.duration, delay: plan.leaf.start, fill: 'both', easing: 'linear' }));
    const strip = LEAF_H / 3;
    let parent = hinge;
    const strips: HTMLElement[] = [];
    for (let k = 0; k < 3; k++) {
      const st = el('div', { position: 'absolute', left: '0', right: '0', top: px(-strip * s), height: px(strip * s), transformStyle: 'preserve-3d', transformOrigin: '50% 100%' }, parent);
      // Front: the old standing page, bottom strip first; back: the new floor, stretched to the leaf
      el('div', { position: 'absolute', inset: '0', ...paint(pages.fromBackdrop, s, LEAF_H - (k + 1) * strip) }, st);
      el('div', { position: 'absolute', inset: '0', ...paint(pages.toBackdrop, s, LEAF_H / LAND + k * strip, 1 / LAND, true) }, st);
      strips.push(st);
      parent = st;
    }
    // The paper's lit edge on the free end
    el('div', { position: 'absolute', left: '0', right: '0', top: '0', height: '2px', background: C.foldLitHigh, transform: 'translateZ(.5px)' }, strips[2]);
    const leafTiming = { duration: plan.leaf.duration, delay: plan.leaf.start, fill: 'both' as const, easing: 'cubic-bezier(.55,.05,.45,1)' };
    addFree(strips[0].animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-180deg)' }], leafTiming));
    addFree(strips[1].animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-26deg)', offset: 0.45 }, { transform: 'rotateX(8deg)', offset: 0.85 }, { transform: 'rotateX(0deg)' }], leafTiming));
    addFree(strips[2].animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-22deg)', offset: 0.5 }, { transform: 'rotateX(10deg)', offset: 0.88 }, { transform: 'rotateX(0deg)' }], leafTiming));
    later(plan.leaf.start + plan.leaf.duration, () => stage.remove());
    // Confetti: 14 paper flecks in the chapter palette thrown off the leaf's free edge (none in low power)
    const tones = [C.goldLight, C.washiPink, C.moonRim, C.page];
    for (let i = 0; i < (hooks.confetti === false ? 0 : 14); i++) {
      const fx0 = ((i * 37) % 100) / 100;
      const fleck = el('div', {
        position: 'absolute',
        left: px(targets.at.x + VB.w * s * (0.1 + fx0 * 0.8)),
        top: px(targets.at.y + 30 * s),
        width: px(4 + (i % 3) * 1.5),
        height: px(3 + (i % 2) * 1.5),
        background: tones[i % tones.length],
        borderRadius: '1px',
        opacity: '0',
        pointerEvents: 'none',
      }, targets.overlay, { 'data-confetti': '' });
      temp.push(fleck);
      const dx = (fx0 - 0.5) * 120;
      const dy = (VB.h * 0.75 + (i % 5) * 18) * s;
      addFree(fleck.animate(
        [{ opacity: 0, transform: 'translate(0,0) rotate(0deg)' }, { opacity: 0.95, offset: 0.1 }, { opacity: 0.9, transform: `translate(${px(dx)}, ${px(dy * 0.7)}) rotate(${200 + i * 40}deg)`, offset: 0.8 }, { opacity: 0, transform: `translate(${px(dx * 1.2)}, ${px(dy)}) rotate(${300 + i * 50}deg)` }],
        { duration: 900, delay: plan.leaf.start + 80 + (i % 7) * 25, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'both' },
      ));
    }
  } else if (plan.reduced) {
    // Reduced motion: the old page's backdrop (a chapter open: the night) fades over the new page
    later(0, () => {
      const fade = el('div', { position: 'absolute', ...box, ...paint(pages.fromBackdrop, s, 0) }, targets.overlay, { 'data-turn': 'fade' });
      temp.push(fade);
      addFree(fade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: REDUCED_MS, easing: 'ease-out', fill: 'forwards' }));
      doSwap();
    });
  } else {
    // A chapter open: no old page to turn away
    later(plan.swapAt, doSwap);
  }

  // ——— The chapter card on two strings (#102: the departure board) ———
  if (plan.card && pages.card) {
    const { start, settle, leave } = plan.card;
    later(start, () => {
      cardNode = pages.card?.() ?? null;
      if (cardNode === null) return;
      cardNode.style.visibility = 'visible';
      if (plan.reduced) {
        add(cardNode.animate([{ opacity: 0 }, { opacity: 1 }], { duration: settle - start, easing: 'ease-out', fill: 'both' }));
        return;
      }
      add(cardNode.animate(CARD_DROP, { duration: settle - start, fill: 'both' }));
      // The split-flap row flips in while it swings: each tile's blank top half falls, its new bottom half lands
      cardNode.querySelectorAll<HTMLElement>('[data-flap]').forEach((flap) => {
        const i = Number(flap.dataset.flapIndex ?? 0);
        const top = flap.dataset.flap === 'top';
        const half = CARD_MS.flip / 2;
        const delay = CARD_MS.flipAt + i * CARD_MS.flipGap + (top ? 0 : half);
        const frames = top ? [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }] : [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }];
        addFree(flap.animate(frames, { duration: half, delay, easing: top ? 'ease-in' : 'cubic-bezier(.2,.7,.4,1.3)', fill: 'both' }));
      });
    });
    // Its lines (#102): the turn holds with the card hanging; what already moves in a chapter turn finishes
    if (hooks.card) holdAt(settle, () => hooks.card!.run(), (a) => !free.has(a));
    later(leave, () => {
      if (cardNode === null) return;
      const frames = plan.reduced ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(4%) rotate(-1deg)', offset: 0.2 }, { transform: 'translateY(-115%) rotate(2deg)' }];
      add(cardNode.animate(frames, { duration: plan.reduced ? CARD_MS.fade : CARD_MS.lift, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
    });
  }

  // ——— The new page rises, z1 → z5, the standees last ———
  const raise = () => {
    groupsOf(targets.pageBox(), RISE_GROUPS).forEach((group, i) => group.forEach((g) => {
      based(g);
      const delay = Math.max(0, plan.rise.start - plan.swapAt) + i * plan.rise.stagger;
      const frames = plan.reduced
        ? [{ transform: 'translateY(4px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }]
        : [{ transform: 'scaleY(.03)', opacity: 0 }, { transform: 'scaleY(.2)', opacity: 1, offset: 0.12 }, { transform: 'scaleY(1.07)', offset: 0.7 }, { transform: 'scaleY(1)' }];
      // In a chapter turn the page rises under the hanging card and finishes while its lines play;
      // in a chapter open it waits, flat, for the camera
      const a = g.animate(frames, { duration: plan.rise.each, delay, easing: plan.reduced ? 'ease-out' : 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' });
      if (plan.kind === 'open' && !plan.reduced) add(a);
      else addFree(a);
    }));
  };
  // The new page mounts on the swap: raise it on the next frame (it is under the leaf until then).
  // A chapter open's page is already there: flatten it at once, so it never shows standing first
  if (plan.kind === 'open' && !plan.reduced) raise();
  else later(plan.swapAt + 1, () => requestAnimationFrame(() => raise()));

  const finish = () => {
    if (done) return;
    done = true;
    doSwap();
    for (const st of steps) window.clearTimeout(st.handle);
    // The card is the shell's: hidden before its animations let go of it
    if (cardNode) cardNode.style.visibility = 'hidden';
    for (const a of anims) a.cancel();
    for (const node of temp) node.remove();
    targets.overlay.querySelectorAll('[data-turn],[data-confetti]').forEach((n) => n.remove());
    for (const g of [...old, ...groupsOf(targets.pageBox(), RISE_GROUPS).flat()]) {
      g.style.transformBox = '';
      g.style.transformOrigin = '';
    }
    targets.book.style.transformOrigin = '';
    resolve();
  };
  later(plan.end + 40, finish);
  return { finished, skip: finish };
}

/**
 * The card's drop (bible § 2.4, proof C): it falls from above the screen on its two strings,
 * overshoots, swings twice, smaller each time, and settles. Its pivot is the strings' top.
 */
const CARD_DROP: Keyframe[] = [
  { transform: 'translateY(-115%) rotate(-4deg)', offset: 0, easing: 'cubic-bezier(.4,0,.8,.6)' },
  { transform: 'translateY(3%) rotate(3.2deg)', offset: 0.3, easing: 'ease-in-out' },
  { transform: 'translateY(-0.5%) rotate(-2deg)', offset: 0.5, easing: 'ease-in-out' },
  { transform: 'translateY(0) rotate(1.1deg)', offset: 0.68, easing: 'ease-in-out' },
  { transform: 'translateY(0) rotate(-0.4deg)', offset: 0.84, easing: 'ease-in-out' },
  { transform: 'translateY(0) rotate(0deg)', offset: 1 },
];
