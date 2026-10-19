import { PRESET_ART, isNearMarigold, kitCtx, marigoldDistance, presetSvg, type PartPreset } from '../../art';
import type { LintIssue, LintResult } from '../../core/lint';
import { compilePart } from '../../core/presets';
import { initialState } from '../../core/state';
import type { Id, PageDef, PartDef } from '../../core/types';
import { bookLayout } from '../geometry';
import { BABY_BOX, MIN_HIT_PX, MOCHA_BOX, PERCH_R, TUDIGONG_R, targetsOf } from '../gestures';
import { wearsMarigold } from './look';

/**
 * The affordance lint (popup art bible § 4, § 4.2, § 10 item 4; #140): the grandparent rule,
 * checked on what a page actually draws. It reads SVG markup (a page rendered by `PageView`, or a
 * preset's kit art) and the page data, runs in tests (`affordance.test.ts`, every registered page
 * and every preset) and live in PageLab.
 *
 * | Code | Severity | What fires it |
 * |---|---|---|
 * | `A01-near-marigold` | error | a decorative fill, stroke or gradient stop within ΔE < 12 of marigold (`color.ts`), anywhere but a touchable part or a marked affordance (`data-affordance`: perch paws, linked brads, hint halos) |
 * | `A02-missing-seal` | error | a touchable (it wears marigold: `wearsMarigold`) draws no verb seal (`data-seal`) |
 * | `A03-missing-grip` | error | … no grip texture (`data-grip`: ridges, rim, ear, knob) |
 * | `A04-missing-cue` | error | … no printed direction cue (`data-cue`: track, arrow, turn, curl) |
 * | `A05-not-marigold` | error | … no marigold anywhere in its art |
 * | `A06-hit-small` | error | a touch target's own hit shape is under 48 × 48 CSS px after the reference book scale (390 × 844, ≈ 0.91); the hit layer grows it for hit testing, but the bible wants it drawn that big (§ 4.2) |
 * | `A07-touchable-count` | warning | more than 3 touchables plus perches at once on pages 1–3 of a chapter (§ 4.2; checked at the page's start) |
 *
 * The kit side (`lintPresetArt`) holds every preset to the same rule: the touchable presets show
 * all four cues; the printed ones carry no marigold.
 */

/** The book scale the hit-area rule is checked at: a 390 × 844 phone (bible § 2.1: ≈ 0.91). */
export const REFERENCE_SCALE = bookLayout(390, 844).scale;
/** The smallest own hit side, in page units, that is 48 CSS px at the reference scale. */
export const MIN_HIT_UNITS = MIN_HIT_PX / REFERENCE_SCALE;
/** Bible § 4.2: at most this many touchables plus perches at once on a chapter's first three pages. */
export const EARLY_PAGE_TOUCHABLES = 3;

const PAINT_ATTRS = ['fill', 'stroke', 'stop-color'] as const;

interface Tag {
  readonly close: boolean;
  readonly name: string;
  readonly attrs: Readonly<Record<string, string>>;
  readonly selfClose: boolean;
}

const unescape = (v: string) => v.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');

/** The tags in a chunk of SVG markup, in order (text is skipped). */
export function tags(markup: string): Tag[] {
  const out: Tag[] = [];
  for (const m of markup.matchAll(/<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g)) {
    const attrs: Record<string, string> = {};
    for (const a of m[3].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = unescape(a[2] ?? a[3] ?? '');
    // Bare attributes (no value), looked for outside the quoted values
    for (const a of m[3].replace(/"[^"]*"|'[^']*'/g, '""').matchAll(/(?:^|\s)([a-zA-Z][\w:-]*)(?=\s|$)/g)) if (!(a[1] in attrs)) attrs[a[1]] = '';
    out.push({ close: m[1] === '/', name: m[2], attrs, selfClose: m[4] === '/' });
  }
  return out;
}

/** The paint values on one element: its fill / stroke / stop-color attributes and `style` declarations. */
function paints(attrs: Readonly<Record<string, string>>): string[] {
  const out: string[] = [];
  for (const a of PAINT_ATTRS) if (attrs[a]) out.push(attrs[a]);
  for (const d of (attrs.style ?? '').split(';')) {
    const [k, v] = d.split(':').map((x) => x?.trim());
    if (v && (PAINT_ATTRS as readonly string[]).includes(k)) out.push(v);
  }
  return out;
}

/** Each gradient's or pattern's colours, by id (what a `url(#id)` paints with). */
function paintServers(list: readonly Tag[]): Map<string, string[]> {
  const servers = new Map<string, string[]>();
  const stack: (string | null)[] = [];
  for (const t of list) {
    if (t.close) {
      stack.pop();
      continue;
    }
    const isServer = /^(linearGradient|radialGradient|pattern)$/.test(t.name) && t.attrs.id;
    const owner = isServer ? t.attrs.id : stack[stack.length - 1] ?? null;
    if (owner !== null) {
      const colours = servers.get(owner) ?? [];
      colours.push(...paints(t.attrs).filter((p) => p.startsWith('#')));
      servers.set(owner, colours);
    }
    if (!t.selfClose) stack.push(owner);
  }
  return servers;
}

/** The hex colours a paint value resolves to (a literal, or a paint server's colours). */
function resolve(paint: string, servers: ReadonlyMap<string, string[]>): string[] {
  const url = /url\(#([^)]+)\)/.exec(paint);
  if (url) return servers.get(url[1]) ?? [];
  return paint.startsWith('#') ? [paint] : [];
}

/** What one touchable part's markup shows (the four cues). */
interface PartCues {
  seal: boolean;
  grip: boolean;
  cue: boolean;
  marigold: boolean;
}

interface Frame {
  readonly defs: boolean;
  /** Inside a marked affordance or a touchable part: marigold is allowed */
  readonly allowed: boolean;
  readonly part: Id | null;
  readonly layer: string | null;
}

const issue = (page: Id, code: string, severity: LintIssue['severity'], ids: readonly Id[], message: string): LintIssue => ({ code, severity, page, ids, message });

/**
 * Lints drawn markup. `touchable(id)` says whether a `data-part` group is a marigold touchable;
 * `expected` lists the touchables that must show all four cues. `where` names the source in messages.
 */
export function lintMarkup(markup: string, { page, touchable, expected, where }: { page: Id; touchable: (id: Id) => boolean; expected: readonly Id[]; where: string }): LintIssue[] {
  const list = tags(markup);
  const servers = paintServers(list);
  const out: LintIssue[] = [];
  const cues = new Map<Id, PartCues>();
  const flagged = new Set<string>();
  const stack: Frame[] = [];
  for (const t of list) {
    if (t.close) {
      stack.pop();
      continue;
    }
    const up: Frame = stack[stack.length - 1] ?? { defs: false, allowed: false, part: null, layer: null };
    const partId = t.attrs['data-part'] ?? null;
    const frame: Frame = {
      defs: up.defs || t.name === 'defs',
      allowed: up.allowed || 'data-affordance' in t.attrs || (partId !== null && touchable(partId)),
      part: partId ?? up.part,
      layer: t.attrs['data-layer'] ?? up.layer,
    };
    if (!frame.defs) {
      const c = frame.part === null ? undefined : cues.get(frame.part) ?? { seal: false, grip: false, cue: false, marigold: false };
      if (c && frame.part !== null) {
        if ('data-seal' in t.attrs) c.seal = true;
        if ('data-grip' in t.attrs) c.grip = true;
        if ('data-cue' in t.attrs) c.cue = true;
        cues.set(frame.part, c);
      }
      const hidden = t.attrs.opacity === '0' || t.attrs['fill-opacity'] === '0';
      for (const paint of paints(t.attrs)) {
        const near = resolve(paint, servers).filter((hex) => isNearMarigold(hex));
        if (near.length === 0) continue;
        if (c) c.marigold = true;
        if (frame.allowed || hidden) continue;
        const what = `${frame.layer ?? where}${frame.part ? ` · part '${frame.part}'` : ''} <${t.name}> ${paint === near[0] ? paint : `${paint} (${near[0]})`}`;
        if (flagged.has(what)) continue;
        flagged.add(what);
        out.push(issue(page, 'A01-near-marigold', 'error', frame.part ? [frame.part] : [], `${page}: decoration in ${what} is ΔE ${marigoldDistance(near[0]).toFixed(1)} from the reserved marigold (< 12): use desaturated ochre or foil, or mark a real affordance`));
      }
    }
    if (!t.selfClose) stack.push(frame);
  }
  for (const id of expected) {
    const c = cues.get(id);
    if (c === undefined) continue;
    const miss = (code: string, cue: string) => out.push(issue(page, code, 'error', [id], `${page}: touchable '${id}' (${where}) has no ${cue}; every touchable shows all four cues (bible § 4)`));
    if (!c.marigold) miss('A05-not-marigold', 'marigold card');
    if (!c.seal) miss('A02-missing-seal', 'red verb seal (data-seal)');
    if (!c.grip) miss('A03-missing-grip', 'grip texture (data-grip)');
    if (!c.cue) miss('A04-missing-cue', 'direction cue (data-cue)');
  }
  return out;
}

const hitSide = (hit: PartDef['hit']) => ('r' in hit ? { w: hit.r * 2, h: hit.r * 2 } : { w: hit.w, h: hit.h });

/** The page-data rules: hit areas after the book scale (A06) and the early-page count (A07). */
export function lintAffordanceData(def: PageDef): LintIssue[] {
  const out: LintIssue[] = [];
  const min = MIN_HIT_UNITS;
  const small = (ids: Id[], what: string, w: number, h: number) =>
    out.push(issue(def.id, 'A06-hit-small', 'error', ids, `${def.id}: ${what}'s hit area is ${Math.round(w * REFERENCE_SCALE)}×${Math.round(h * REFERENCE_SCALE)} CSS px at the 390×844 book scale (${REFERENCE_SCALE.toFixed(2)}); it must be ≥ ${MIN_HIT_PX}×${MIN_HIT_PX} (${min.toFixed(1)} units)`));
  for (const part of def.parts) {
    if (compilePart(part).input === 'none') continue;
    const { w, h } = hitSide(part.hit);
    if (w < min - 1e-6 || h < min - 1e-6) small([part.id], `part '${part.id}'`, w, h);
  }
  // The fixed targets (gestures.ts): perch paws, the 土地公, Mocha and Baokaka
  const fixed: [string, number, number][] = [['a perch paw', PERCH_R * 2, PERCH_R * 2], ['the 土地公', TUDIGONG_R * 2, TUDIGONG_R * 2], ['Mocha', MOCHA_BOX.w, MOCHA_BOX.h], ['Baokaka', BABY_BOX.w, BABY_BOX.h]];
  for (const [what, w, h] of fixed) if (w < min - 1e-6 || h < min - 1e-6) small([], what, w, h);
  if (def.index <= 3) {
    const targets = targetsOf(def, initialState(def));
    const n = targets.filter((t) => t.kind === 'part' || t.kind === 'perch').length;
    if (n > EARLY_PAGE_TOUCHABLES) {
      out.push(issue(def.id, 'A07-touchable-count', 'warning', [], `${def.id}: ${n} touchables plus perches at the start of page ${def.chapter}-${def.index}; the first three pages of a chapter show at most ${EARLY_PAGE_TOUCHABLES} (bible § 4.2)`));
    }
  }
  return out;
}

/** A page's touchables (the parts that must show the four cues). */
export const touchablesOf = (def: PageDef): Id[] => def.parts.filter(wearsMarigold).map((p) => p.id);

/**
 * Lints a page: its drawn markup (`PageView` rendered for some state) plus the data rules.
 * Errors and warnings, like `lintPage`.
 */
export function lintAffordance(def: PageDef, markup: string): LintResult {
  const marigold = new Set(touchablesOf(def));
  const issues = [
    ...lintMarkup(markup, { page: def.id, touchable: (id) => marigold.has(id), expected: [...marigold], where: 'page' }),
    ...lintAffordanceData(def),
  ];
  return { errors: issues.filter((i) => i.severity === 'error'), warnings: issues.filter((i) => i.severity === 'warning') };
}

/** Every preset's default kit art, held to the rule: touchables show all four cues; printed parts no marigold. */
export function lintPresetArt(preset: PartPreset, opts: { touchable?: boolean } = {}): LintIssue[] {
  const art = PRESET_ART[preset];
  const touchable = art.touchable === true || (art.touchable === 'optional' && opts.touchable !== false);
  const markup = `<g data-part="${preset}">${presetSvg(kitCtx(`lint-${preset}`), preset, { touchable })}</g>`;
  return lintMarkup(markup, { page: `kit:${preset}`, touchable: () => touchable, expected: touchable ? [preset] : [], where: 'kit preset' });
}
