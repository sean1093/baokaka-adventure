import { POPUP as C } from '../../../art/palette';
import { GUTTER_Y, PAGE_VIEW_BOX } from '../geometry';
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
 * (1.4 s), the chapter card dropping in on two strings and swinging, then the camera dollies back in.
 *
 * **Reduced motion:** a 0.25 s cross-fade plus a single 4 px rise of the new layers: no camera, no
 * leaf, no confetti.
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

export type TurnKind = 'fold' | 'chapter';

/** The bible § 2.4 timing table, in ms from the start of the turn. */
export const FOLD_MS = { settle: 150, foldEnd: 600, leafEnd: 900, end: 1500 } as const;
export const CHAPTER_MS = { dolly: 450, leafStart: 450 + 450, leaf: 1400, end: 2400 } as const;
export const REDUCED_MS = 250;
/** The chapter card starts dropping this long after the leaf starts to lift (#101). */
export const CARD_AFTER_LEAF_MS = 60;

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
  readonly camera: { readonly outEnd: number; readonly inStart: number } | null;
  readonly card: { readonly start: number; readonly leave: number } | null;
  readonly end: number;
}

/** The turn's timeline (pure; the unit tests pin it to bible § 2.4). */
export function turnPlan(kind: TurnKind, reduced: boolean): TurnPlan {
  if (reduced) {
    return { kind, reduced, swapAt: 0, fold: null, leaf: null, rise: { start: 0, each: REDUCED_MS, stagger: 0 }, camera: null, card: null, end: REDUCED_MS };
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
  return {
    kind,
    reduced,
    swapAt: leafStart,
    fold: { start: CHAPTER_MS.dolly - 150, each: FOLD_EACH_MS, stagger: FOLD_STAGGER_MS },
    leaf: { start: leafStart, duration: leafEnd - leafStart },
    rise: { start: leafEnd, each: RISE_EACH_MS, stagger: STAGGER_MS },
    camera: { outEnd: CHAPTER_MS.dolly, inStart: CHAPTER_MS.end - CHAPTER_MS.dolly },
    // The card drops in as the leaf lifts, after any interlude (the sticker card, #101)
    card: { start: leafStart + CARD_AFTER_LEAF_MS, leave: CHAPTER_MS.end - CHAPTER_MS.dolly - 150 },
    end: CHAPTER_MS.end,
  };
}

/** What the driver needs from the screen. */
export interface TurnTargets {
  /** The book (the camera moves it in a chapter turn) */
  readonly book: HTMLElement;
  /** Where the temporary DOM goes: a full-screen layer over the book, inside the camera's transform */
  readonly overlay: HTMLElement;
  /** Above the camera (the chapter card hangs here, never tilted) */
  readonly top: HTMLElement;
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
  /** The new chapter, for the card */
  readonly card?: { readonly chapter: string; readonly title: string; readonly landmark: string; readonly time: string };
}

/** Something played over the folded page before the leaf turns (the sticker card, #101). */
export interface TurnInterlude {
  /** Resolves when the turn may go on */
  run(): Promise<void>;
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
export function playTurn(plan: TurnPlan, targets: TurnTargets, pages: TurnPages, swap: () => void, interlude?: TurnInterlude): TurnRun {
  const anims: Animation[] = [];
  const temp: HTMLElement[] = [];
  const s = targets.scale;
  let swapped = false;
  let done = false;
  let resolve!: () => void;
  const finished = new Promise<void>((r) => (resolve = r));

  const add = (a: Animation) => {
    anims.push(a);
    return a;
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
  if (interlude) {
    // Registered first: at `swapAt` it runs before the steps due at the same time (the leaf, the swap)
    later(plan.swapAt, () => {
      if (done) return;
      const now = plan.swapAt;
      const running = anims.filter((a) => a.playState === 'running');
      running.forEach((a) => a.pause());
      for (const st of steps) if (!st.fired) window.clearTimeout(st.handle);
      held = { at: now, anims: running };
      void interlude.run().then(() => {
        const h = held;
        held = null;
        if (done || h === null) return;
        h.anims.forEach((a) => a.play());
        for (const st of steps) if (!st.fired) arm(st, h.at);
      });
    });
  }
  const doSwap = () => {
    if (swapped) return;
    swapped = true;
    swap();
  };

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
    const { scale, rotateX, rotateY, rotateZ, lift } = CAMERA;
    const away = `perspective(1250px) translateY(${lift}%) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`;
    const home = 'perspective(1250px) translateY(0) rotateX(0) rotateY(0) rotateZ(0) scale(1)';
    targets.book.style.transformOrigin = '50% 55%';
    add(targets.book.animate(
      [{ transform: home, offset: 0 }, { transform: away, offset: plan.camera.outEnd / plan.end }, { transform: away, offset: plan.camera.inStart / plan.end }, { transform: home, offset: 1 }],
      { duration: plan.end, easing: 'cubic-bezier(.45,0,.25,1)' },
    ));
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
    add(shade.animate([{ opacity: 0 }, { opacity: 0.55, offset: 0.55 }, { opacity: 0.1 }], { duration: plan.leaf.duration, delay: plan.leaf.start, fill: 'both' }));
    // The hinge at the gutter; the leaf shrinks to the floor's depth as it lands
    const hinge = el('div', { position: 'absolute', left: '0', right: '0', top: px(LEAF_H * s), height: '0', transformStyle: 'preserve-3d', transformOrigin: '50% 0' }, stage);
    add(hinge.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(1)', offset: 0.5 }, { transform: `scaleY(${LAND.toFixed(3)})` }], { duration: plan.leaf.duration, delay: plan.leaf.start, fill: 'both', easing: 'linear' }));
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
    add(strips[0].animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-180deg)' }], leafTiming));
    add(strips[1].animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-26deg)', offset: 0.45 }, { transform: 'rotateX(8deg)', offset: 0.85 }, { transform: 'rotateX(0deg)' }], leafTiming));
    add(strips[2].animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-22deg)', offset: 0.5 }, { transform: 'rotateX(10deg)', offset: 0.88 }, { transform: 'rotateX(0deg)' }], leafTiming));
    later(plan.leaf.start + plan.leaf.duration, () => stage.remove());
    // Confetti: 14 paper flecks in the chapter palette thrown off the leaf's free edge
    const tones = [C.goldLight, C.washiPink, C.moonRim, C.page];
    for (let i = 0; i < 14; i++) {
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
      add(fleck.animate(
        [{ opacity: 0, transform: 'translate(0,0) rotate(0deg)' }, { opacity: 0.95, offset: 0.1 }, { opacity: 0.9, transform: `translate(${px(dx)}, ${px(dy * 0.7)}) rotate(${200 + i * 40}deg)`, offset: 0.8 }, { opacity: 0, transform: `translate(${px(dx * 1.2)}, ${px(dy)}) rotate(${300 + i * 50}deg)` }],
        { duration: 900, delay: plan.leaf.start + 80 + (i % 7) * 25, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'both' },
      ));
    }
  } else {
    // Reduced motion: the old page's backdrop fades over the new page
    later(0, () => {
      const fade = el('div', { position: 'absolute', ...box, ...paint(pages.fromBackdrop, s, 0) }, targets.overlay, { 'data-turn': 'fade' });
      temp.push(fade);
      add(fade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: REDUCED_MS, easing: 'ease-out', fill: 'forwards' }));
      doSwap();
    });
  }

  // ——— The chapter card on two strings ———
  if (plan.card && pages.card) {
    const card = buildCard(pages.card, targets.top);
    temp.push(card);
    const swing = [
      { transform: 'translateY(-115%) rotate(-4deg)', offset: 0 },
      { transform: 'translateY(4%) rotate(3.5deg)', offset: 0.22 },
      { transform: 'translateY(0) rotate(-2.2deg)', offset: 0.36 },
      { transform: 'translateY(0) rotate(1.2deg)', offset: 0.5 },
      { transform: 'translateY(0) rotate(0deg)', offset: 0.62 },
      { transform: 'translateY(0) rotate(0deg)', offset: 0.86 },
      { transform: 'translateY(-115%) rotate(2deg)', offset: 1 },
    ];
    add(card.animate(swing, { duration: plan.end - plan.card.start, delay: plan.card.start, easing: 'ease-in-out', fill: 'both' }));
  }

  // ——— The new page rises, z1 → z5, the standees last ———
  const raise = () => {
    groupsOf(targets.pageBox(), RISE_GROUPS).forEach((group, i) => group.forEach((g) => {
      based(g);
      const delay = Math.max(0, plan.rise.start - plan.swapAt) + i * plan.rise.stagger;
      const frames = plan.reduced
        ? [{ transform: 'translateY(4px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }]
        : [{ transform: 'scaleY(.03)', opacity: 0 }, { transform: 'scaleY(.2)', opacity: 1, offset: 0.12 }, { transform: 'scaleY(1.07)', offset: 0.7 }, { transform: 'scaleY(1)' }];
      add(g.animate(frames, { duration: plan.rise.each, delay, easing: plan.reduced ? 'ease-out' : 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' }));
    }));
  };
  // The new page mounts on the swap: raise it on the next frame (it is under the leaf until then)
  later(plan.swapAt + 1, () => requestAnimationFrame(() => raise()));

  const finish = () => {
    if (done) return;
    done = true;
    doSwap();
    for (const st of steps) window.clearTimeout(st.handle);
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

/** The chapter card (bible § 7): a deckled paper card on two strings, a red spine bar, 「第N章 · title」, the landmark, the time chip, the 翻 seal. */
function buildCard(info: NonNullable<TurnPages['card']>, parent: HTMLElement): HTMLElement {
  const wrap = el('div', { position: 'absolute', left: '50%', top: '0', width: '300px', marginLeft: '-150px', pointerEvents: 'none', transformOrigin: '50% 0' }, parent, { 'data-turn-card': '' });
  wrap.innerHTML = `<svg width="300" height="190" viewBox="0 0 300 190" aria-hidden="true" style="display:block;overflow:visible">
    <path d="M70 0V74M230 0V68" stroke="${C.standeeCard}" stroke-width="1.4" opacity=".85"/>
    <g transform="translate(150 118) rotate(-2.5)">
      <rect x="-133" y="-46" width="270" height="100" rx="4" fill="${C.shadow}" opacity=".45" transform="translate(3 6)"/>
      <rect x="-136" y="-50" width="272" height="100" rx="4" fill="${C.page}"/>
      <rect x="-136" y="-50" width="272" height="100" rx="4" fill="none" stroke="${C.cutRim}" stroke-opacity=".6"/>
      <rect x="-136" y="-50" width="15" height="100" fill="${C.seal}"/>
      <text x="-108" y="-17" font-family="'Chiron GoRound TC'" font-weight="700" font-size="20" fill="${C.inkSoft}" letter-spacing="1">${info.chapter} · ${info.title}</text>
      <text x="-109" y="32" font-family="'Noto Serif TC'" font-weight="900" font-size="36" fill="${C.ink}" letter-spacing="2" textLength="${Math.min(160, info.landmark.length * 38)}" lengthAdjust="spacingAndGlyphs">${info.landmark}</text>
      <g transform="translate(62 8)"><rect width="66" height="30" rx="15" fill="${C.cover}"/><text x="33" y="22" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="20" fill="${C.goldLight}">${info.time}</text></g>
      <g transform="translate(110 -26)"><rect x="-15" y="-15" width="30" height="30" rx="6" fill="${C.seal}"/><text y="7" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="18" fill="${C.sealGlyph}">翻</text></g>
    </g></svg>`;
  return wrap;
}
