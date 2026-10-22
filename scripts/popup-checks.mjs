/**
 * 翻翻台北's audience-rule checks (#92; GDD § 1.3 R5/R6, § 2.11), run by `scripts/ui-check.mjs`
 * over every PageLab visual QA fixture (`src/popup/dev/fixtures.ts`, listed at
 * `#/pagelab?section=fixtures`):
 *
 *   R5 text size   every visible text run is ≥ 20 CSS px (≥ 24 px under `[data-text-size="big"]`,
 *                  the 大字 setting, #104). SVG text is measured on screen (font size × the CTM's scale).
 *   R5 contrast    every visible text run is ≥ 7:1 against what is behind it: the text colour comes
 *                  from computed styles (`color`, or `fill` for SVG; a stroke drawn under the fill
 *                  counts as its background), the background is read off a screenshot taken with all
 *                  text hidden, and 90 % of the pixels behind the run must meet 7:1.
 *   R6 hit areas   every touchable (`[data-hit]`, the page's grown hit shapes; a screen that is not a
 *                  page, `[data-screen]`, has none) and every button, link,
 *                  switch, tab or slider is ≥ 48×48 CSS px. At 390×844 (the reference book scale,
 *                  ≈ 0.91) no page hit shape may need growing (`[data-hit-grown]`): each touchable's
 *                  own hit area is ≥ 48 px after the book scale (popup art bible § 4.2, #140).
 *   Marks seen   Mocha's perch paws (`[data-affordance="perch"]`) and the hint halo (`[data-hint-halo]`)
 *                  are never under anything (#183, the AI playtest: 0-3's table, 1-1's rack and 1-3's
 *                  counter and its L1 glow were hidden): the topmost thing drawn at a paw's centre is
 *                  the paw (or the L2 ghost hand tapping it; a subtitle, which any tap clears, is
 *                  allowed and counted), and most points of a halo show the halo, its own target, a
 *                  paw, the ghost hand or a subtitle.
 *   Talk clear   no subtitle card or narration strip covers Baokaka's thought bubble or Baokaka himself
 *                  (#197: at 375×667 a three-line beat hid his 「要！」 cloud). `layoutTalk` lays the
 *                  beat out to keep them clear and splits a beat too big for the page; this checks
 *                  what is drawn.
 *   A11y           (#136) the document is `lang="zh-Hant"` and has a `<title>`; every control on
 *                  screen has an accessible name (aria-label, its label or its text) and every button
 *                  carries an icon (`<svg>` / `<img>`, or a `[data-icon]` picture: a page thumbnail, a
 *                  station drawn on the map under its button). A radio option is a choice, not a
 *                  command: its row carries the icon, GDD § 2.11 "icons on all buttons".
 *   Reduced motion under `prefers-reduced-motion: reduce`, with the fixture live, no running CSS or
 *                  Web Animations animation changes anything but opacity (fades are allowed).
 *   Flashing       with the fixture live and motion on, no animation flashes above 3 Hz (opacity or
 *                  luminance swings of ≥ 10 %, counted per second of the animation's run).
 *
 * Text and touchables outside an open modal dialog (`aria-modal`: the pause menu; the chapter card
 * while its lines play, #102) are out of reach under it and are not checked; the dialog's own are.
 *
 * Lettering that is part of a picture (a station's name plate, a split-flap digit, a verb seal's
 * glyph) is marked `data-art-text` in the art and is not text in the R5 sense: the game never asks
 * anyone to read it (R5: "completable without reading"). It is skipped and counted (D-53).
 *
 * WAIVERS lists the known gaps, each with the issue that closes it; waived runs are counted and
 * printed on every run so they stay visible. A detector self-test runs first, so a check that finds
 * nothing because it is broken fails instead of passing.
 */
import { PNG } from 'pngjs';

export const MIN_TEXT_PX = 20;
export const MIN_TEXT_PX_BIG = 24;
export const MIN_CONTRAST = 7;
/** Share of the pixels behind a text run that must meet MIN_CONTRAST (anti-aliasing, paper fibres). */
export const CONTRAST_COVERAGE = 0.9;
export const MIN_HIT_PX = 48;
/** The viewport whose book scale the authored hit areas must clear 48 px at (bible § 2.1, § 4.2). */
export const REFERENCE_VIEWPORT = '390x844';
export const MAX_FLASH_HZ = 3;
/**
 * Talk clear: an overlap no thicker than this (CSS px) is a card's edge, not cover: `layoutTalk`
 * places the card's box, and the drawn card bows up to 3 units past it with its die-cut shadow.
 */
export const TALK_SLACK = 4;

/**
 * Known gaps. `selector` matches the waived elements (and everything inside them); `rules` are
 * the rule ids waived there. Remove an entry in the issue it names.
 */
export const WAIVERS = [
  // None since #98 (the bubbles counter-scale their text against the book scale)
];

/** Lettering inside a picture, not text to read (see above). */
export const ART_TEXT = '[data-art-text]';

export const fixtureIndexUrl = (base) => new URL('#/pagelab?section=fixtures', base).href;
/** `UI_TEXT=big` opens every fixture with 大字 on (#104: `text=big`), so the 24 px rule covers every screen. */
const TEXT_PARAM = process.env.UI_TEXT === 'big' ? '&text=big' : '';
export const popupFixtureUrl = (base, name, still = true) =>
  new URL(`#/pagelab?fixture=${encodeURIComponent(name)}${still ? '&still=1' : ''}${TEXT_PARAM}`, base).href;

/** Popup fixture names and registered page ids, from PageLab's fixture index (null: no PageLab here). */
export async function listPopupFixtures(page, base) {
  await page.goto(fixtureIndexUrl(base), { waitUntil: 'load' });
  try {
    await page.waitForSelector('[data-popup-fixture]', { timeout: 20000 });
  } catch {
    return null;
  }
  return {
    fixtures: await page.$$eval('[data-popup-fixture]', (items) => items.map((item) => item.getAttribute('data-popup-fixture'))),
    pages: await page.$$eval('[data-popup-page-id]', (items) => items.map((item) => item.getAttribute('data-popup-page-id'))),
  };
}

/**
 * Fixtures per tab before the checks open a fresh one: a dev-server tab that has loaded dozens of
 * fixtures (hundreds of unbundled modules and font slices each) starts failing requests with
 * ERR_INSUFFICIENT_RESOURCES (#104). 15 was still too many for a full visual run (#122: one target in
 * every tab failed so), hence 8.
 */
export const FIXTURES_PER_TAB = 8;

/** Yields a page for each item, replaced by a fresh one every `FIXTURES_PER_TAB` items. */
export async function* freshPages(open, items) {
  let page = null;
  for (let i = 0; i < items.length; i++) {
    if (i % FIXTURES_PER_TAB === 0) {
      await page?.close();
      page = await open();
    }
    yield [page, items[i]];
  }
  await page?.close();
}

/**
 * Opens `url` and waits for `selector`; a wait that times out loads the page once more and waits
 * longer (#122). On a cold dev server a target's first load can outlast the first wait while Vite
 * transforms and pre-bundles its modules, which made long runs fail at random targets.
 */
export async function gotoAndWait(page, url, selector, { timeout = 20000, retryTimeout = 60000 } = {}) {
  await page.goto('about:blank');
  await page.goto(url, { waitUntil: 'load' });
  if (!selector) return;
  try {
    await page.waitForSelector(selector, { timeout });
  } catch (error) {
    if (error?.name !== 'TimeoutError') throw error;
    console.warn(`  ~ slow load, retrying once: ${url}`);
    await page.goto('about:blank');
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector(selector, { timeout: retryTimeout });
  }
}

export async function openPopupFixture(page, base, name, still = true) {
  await gotoAndWait(page, popupFixtureUrl(base, name, still), `[data-pagelab-fixture="${name}"]:not(:has([data-sprites="loading"])) :is(svg[data-page], [data-screen-ready])`);
  await page.evaluate(() => document.fonts.ready);
}

// ——— Colour maths (WCAG 2) ———

const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
export const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** The `q` quantile of the contrast between `fg` (rgba, alpha composited per pixel) and the pixels in `rect`. */
export function backgroundContrast(png, scale, rect, fg, q = 1 - CONTRAST_COVERAGE) {
  const x0 = Math.max(0, Math.floor(rect.x * scale));
  const y0 = Math.max(0, Math.floor(rect.y * scale));
  const x1 = Math.min(png.width, Math.ceil((rect.x + rect.w) * scale));
  const y1 = Math.min(png.height, Math.ceil((rect.y + rect.h) * scale));
  const ratios = [];
  const [fr, fg2, fb, fa] = fg;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * png.width + x) * 4;
      const bg = [png.data[i], png.data[i + 1], png.data[i + 2]];
      const text = [fr * fa + bg[0] * (1 - fa), fg2 * fa + bg[1] * (1 - fa), fb * fa + bg[2] * (1 - fa)];
      ratios.push(contrast(text, bg));
    }
  }
  if (ratios.length === 0) return null;
  ratios.sort((a, b) => a - b);
  return ratios[Math.min(ratios.length - 1, Math.floor(ratios.length * q))];
}

// ——— In-page collectors (run in the browser) ———

/** Every visible text run, interactive element and hit shape, measured; marks waived runs. */
function collect({ waivers, artText, minText, minTextBig }) {
  const parseColor = (value) => {
    const m = /rgba?\(([^)]+)\)/.exec(value ?? '');
    if (!m) return null;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  };
  const opacityOf = (el) => {
    let o = 1;
    for (let n = el; n instanceof Element; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden') return 0;
      o *= Number(s.opacity);
    }
    return o;
  };
  const label = (el) => (el.getAttribute('aria-label') || el.getAttribute('data-hit') || el.textContent || el.tagName).trim().slice(0, 24);
  const waivedFor = (el, rule) => waivers.find((w) => w.rules.includes(rule) && el.closest(w.selector))?.issue ?? null;

  const texts = [];
  let art = 0;
  // While a modal dialog is open (the pause menu, #97) everything outside it is inert, dimmed under
  // its scrim, and not text to read: only the dialog's own text is checked
  const modal = document.querySelector('[aria-modal="true"]');
  // Text scrolled out of a scroller (#104: a long page in 大字) is clipped away, not on screen:
  // only the part inside every clipping ancestor is measured
  const clipped = (el, rect) => {
    let left = rect.left, top = rect.top, right = rect.right, bottom = rect.bottom;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a);
      if (o.overflowX === 'visible' && o.overflowY === 'visible') continue;
      const r = a.getBoundingClientRect();
      left = Math.max(left, r.left);
      top = Math.max(top, r.top);
      right = Math.min(right, r.right);
      bottom = Math.min(bottom, r.bottom);
    }
    const width = Math.max(0, right - left), height = Math.max(0, bottom - top);
    return { left, top, right: left + width, bottom: top + height, width, height };
  };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || seen.has(el) || !node.textContent.trim()) continue;
    if (el.closest('script, style, title, desc, defs, clipPath, mask, symbol')) continue;
    seen.add(el);
    if (el.closest(artText)) {
      art += 1;
      continue;
    }
    if (modal && !modal.contains(el)) continue;
    const opacity = opacityOf(el);
    if (opacity < 0.05) continue;
    const box = clipped(el, el.getBoundingClientRect());
    if (box.width < 1 || box.height < 1) continue;
    if (box.right < 0 || box.bottom < 0 || box.left > innerWidth || box.top > innerHeight) continue;
    const style = getComputedStyle(el);
    const svg = el instanceof SVGElement;
    let px = parseFloat(style.fontSize);
    if (svg) {
      const m = el.getScreenCTM();
      if (m) px *= Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
    }
    let fg = parseColor(svg ? style.fill : style.color);
    let halo = null;
    if (svg && style.stroke !== 'none' && /^stroke/.test(style.paintOrder)) {
      const width = parseFloat(style.strokeWidth) * (px / parseFloat(style.fontSize));
      if (width >= 1.5) halo = parseColor(style.stroke);
    }
    if (fg) fg = [fg[0], fg[1], fg[2], fg[3] * opacity * (svg ? Number(style.fillOpacity) : 1)];
    const big = Boolean(el.closest('[data-text-size="big"]'));
    texts.push({
      text: node.textContent.trim().slice(0, 16),
      px: Math.round(px * 10) / 10,
      min: big ? minTextBig : minText,
      fg,
      fill: svg ? style.fill : style.color,
      halo,
      rect: { x: box.left, y: box.top, w: box.width, h: box.height },
      waivedSize: waivedFor(el, 'text-size'),
      waivedContrast: waivedFor(el, 'contrast'),
    });
  }

  const hits = [];
  for (const el of document.querySelectorAll('[data-hit], button, a[href], input, select, [role="button"], [role="link"], [role="switch"], [role="tab"], [role="slider"]')) {
    if (opacityOf(el) === 0 && !el.hasAttribute('data-hit')) continue;
    const box = el.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) continue;
    // Out of reach under an open modal (the pause menu, the chapter card's lines, #102): still counted as the page's, never measured
    const covered = modal !== null && !modal.contains(el);
    hits.push({ label: label(el), w: Math.round(box.width * 10) / 10, h: Math.round(box.height * 10) / 10, page: el.hasAttribute('data-hit'), grown: el.hasAttribute('data-hit-grown'), waived: waivedFor(el, 'hit'), covered });
  }
  // A specimen sheet with nothing to touch (the #94 sprite sheet) says so; pages never do. A screen
  // that is not a page (the cover, the 目錄, #97) has buttons, not page touchables
  const hitless = document.querySelector('[data-pagelab-fixture] [data-specimen-hitless]') !== null
    || (document.querySelector('[data-hit]') === null && document.querySelector('[data-pagelab-fixture] [data-screen]') !== null);
  return { texts, hits, art, hitless };
}

/**
 * Screen-reader basics and R5's "icons on every button" (#136; GDD § 2.11), in the browser: the
 * document is `lang="zh-Hant"` with a `<title>`; every control on screen (a button, a link, a
 * switch, a slider, a tab) has an accessible name, and every button carries an icon (an `<svg>` or
 * an `<img>` inside it, or a `[data-icon]` picture), so it reads without reading. A radio option
 * (a segmented choice: 慢 / 普通 / 快) is not a command: the row it sits in carries the icon.
 */
export function a11yAudit() {
  // On screen (a see-through tap layer, e.g. the chapter card's 「下一句」, is a control too: it needs a
  // name, but it draws nothing, so no icon)
  const present = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    for (let n = el; n instanceof Element; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
    }
    return true;
  };
  const drawn = (el) => {
    for (let n = el; n instanceof Element; n = n.parentElement) if (Number(getComputedStyle(n).opacity) === 0) return false;
    return true;
  };
  const nameOf = (el) => {
    const label = el.getAttribute('aria-label');
    if (label?.trim()) return label.trim();
    const by = el.getAttribute('aria-labelledby');
    if (by) {
      const text = by.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
      if (text) return text;
    }
    if (el.id) {
      const lab = document.querySelector(`label[for="${el.id}"]`);
      if (lab?.textContent?.trim()) return lab.textContent.trim();
    }
    const wrap = el.closest('label');
    if (wrap?.textContent?.trim()) return wrap.textContent.trim();
    const title = el.querySelector(':scope > title')?.textContent ?? el.getAttribute('title');
    if (title?.trim()) return title.trim();
    return (el.textContent ?? '').trim();
  };
  const modal = document.querySelector('[aria-modal="true"]');
  const controls = [];
  for (const el of document.querySelectorAll('button, a[href], input, select, [role="button"], [role="link"], [role="switch"], [role="tab"], [role="slider"], [role="radio"]')) {
    if (!present(el) || (modal && !modal.contains(el)) || el.closest('[data-pagelab-chrome]')) continue;
    const name = nameOf(el);
    // A command (a `<button>` with no other role); a radio option (設定's 慢 / 普通 / 快) is a choice in a row that carries the icon
    const button = el.matches('button:not([role]), [role="button"]') && drawn(el);
    const icon = el.matches('svg, img') || el.querySelector('svg, img, [data-icon]') !== null;
    controls.push({ tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), name: name.slice(0, 20), named: name.length > 0, button, icon });
  }
  return {
    lang: document.documentElement.lang,
    title: document.title.trim(),
    controls,
  };
}

/** What covers the perch paws and the hint halo (see "Marks seen" above), in the page. */
function coveredMarks() {
  if (document.querySelector('[aria-modal="true"]')) return { checked: 0, under: [], talk: 0 };
  const name = (el) => {
    const g = el.closest('[data-actor], [data-creature], [data-bubble], [data-bark], [data-part], [data-foreground], [data-attractor], [data-layer]');
    if (!g) return el.tagName;
    for (const a of ['data-actor', 'data-creature', 'data-bubble', 'data-bark', 'data-part', 'data-foreground', 'data-attractor', 'data-layer']) if (g.hasAttribute(a)) return `${a}=${g.getAttribute(a)}`;
    return el.tagName;
  };
  const top = (x, y) => document.elementsFromPoint(x, y).find((el) => el instanceof SVGElement && !el.closest('[data-layer="hit"]')) ?? null;
  // Hidden marks (a page folded flat under the sticker card hides its pop-ups) are not on screen
  const shown = (el) => {
    let o = 1;
    for (let n = el; n instanceof Element; n = n.parentElement) {
      const st = getComputedStyle(n);
      if (st.display === 'none' || st.visibility === 'hidden') return false;
      o *= Number(st.opacity);
    }
    return o > 0.05;
  };
  const under = [];
  let talk = 0;
  let checked = 0;
  for (const paw of document.querySelectorAll('svg[data-page] [data-affordance="perch"]')) {
    const r = paw.getBoundingClientRect();
    if (r.width === 0 || !shown(paw)) continue;
    checked += 1;
    const el = top(r.left + r.width / 2, r.top + r.height / 2);
    // The L2 ghost hand tapping it is meant to be over it
    // Something else over the whole page (the sticker card, a folded copy) is not this page's art
    if (el === null || paw.contains(el) || el.closest('[data-hint-hand]') || el.closest('svg[data-page]') !== paw.closest('svg[data-page]')) continue;
    if (el.closest('[data-talk]')) talk += 1;
    else under.push(`a perch paw under ${name(el)}`);
  }
  for (const halo of document.querySelectorAll('svg[data-page] [data-hint-halo][data-hint-target]')) {
    const r = halo.getBoundingClientRect();
    if (r.width === 0 || !shown(halo)) continue;
    checked += 1;
    const key = halo.getAttribute('data-hint-target') ?? '';
    const [kind, id] = key.includes(':') ? key.split(':') : ['part', key];
    const own = (el) => halo.contains(el) || el.closest('[data-marks], [data-talk], [data-hint-hand]') !== null
      || (kind === 'part' && el.closest(`[data-part="${id}"]`) !== null) || ((kind === 'mocha' || kind === 'baby') && el.closest(`[data-actor="${kind}"]`) !== null);
    const pts = [[0, 0], ...Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4) * 0.8, Math.sin((i * Math.PI) / 4) * 0.8])];
    const blockers = [];
    for (const [dx, dy] of pts) {
      const el = top(r.left + r.width / 2 + (dx * r.width) / 2, r.top + r.height / 2 + (dy * r.height) / 2);
      if (el !== null && !own(el) && el.closest('svg[data-page]') === halo.closest('svg[data-page]')) blockers.push(name(el));
    }
    if (blockers.length > pts.length / 2) under.push(`the hint halo on ${key} under ${[...new Set(blockers)].join(', ')}`);
  }
  return { checked, under, talk };
}

/**
 * What the beat's text cards cover (see "Talk clear" above), in the page: each subtitle card
 * (`[data-subtitle-card]`, its label tab included) and the narration strip against the thought
 * bubble's cloud (`[data-bubble-cloud]`) and Baokaka's frame, cut at his feet as `layoutTalk` cuts it.
 * Overlaps no thicker than `TALK_SLACK` px are a card's bowed edge, not cover.
 */
function talkCover(slack) {
  if (document.querySelector('[aria-modal="true"]')) return { cards: 0, over: [], unmarked: false };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  };
  const cover = (a, b) => {
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return w > slack && h > slack ? `${Math.round(w)}×${Math.round(h)}px` : null;
  };
  const over = [];
  let cards = 0;
  let unmarked = false;
  for (const svg of document.querySelectorAll('svg[data-page]')) {
    const talk = svg.querySelector('[data-talk]');
    if (!talk) continue;
    const mine = [...talk.querySelectorAll('[data-subtitle-card], [data-narration]')];
    // Every subtitle draws its card in a marked group, or this check would see nothing
    if (talk.querySelectorAll('[data-subtitle]').length !== talk.querySelectorAll('[data-subtitle-card]').length) unmarked = true;
    cards += mine.length;
    const cloud = svg.querySelector('[data-bubble-cloud]');
    const actor = svg.querySelector('[data-actor="baby"]');
    const frame = actor?.querySelector('[data-sprite] > g > :is(image, rect)');
    let baby = null;
    if (actor && frame) {
      baby = rect(frame);
      // His frame's padding under the feet is shadow, not him (`spriteBox` cuts it 4 units down)
      const m = actor.getScreenCTM();
      if (m) {
        const feet = new DOMPoint(0, 4).matrixTransform(m).y;
        baby.h = Math.max(0, Math.min(baby.y + baby.h, feet) - baby.y);
      }
    }
    for (const card of mine) {
      const who = card.closest('[data-subtitle]')?.getAttribute('data-subtitle') ?? 'narration';
      const text = (card.closest('[data-subtitle]') ?? card).textContent.trim().slice(0, 10);
      const r = rect(card);
      const onCloud = cloud ? cover(r, rect(cloud)) : null;
      if (onCloud) over.push(`${who} 「${text}」 over his thought bubble (${onCloud})`);
      const onBaby = baby ? cover(r, baby) : null;
      if (onBaby) over.push(`${who} 「${text}」 over Baokaka (${onBaby})`);
    }
  }
  return { cards, over, unmarked };
}

/** Hides every text run (fill, stroke, colour, shadow) so a screenshot shows only what is behind it. */
function hideText() {
  const style = document.createElement('style');
  style.setAttribute('data-ui-check', '');
  style.textContent = `text, tspan, textPath { fill-opacity: 0 !important; stroke-opacity: 0 !important; }
    body *:not(svg):not(svg *) { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; }`;
  document.head.appendChild(style);
}

/**
 * The running animations, described: what they change, and how often they flash. Runs in the
 * browser; also used by the self-test on injected elements.
 */
function describeAnimations() {
  const parseColor = (value) => {
    const m = /rgba?\(([^)]+)\)/.exec(value ?? '');
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const ch = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = (rgba) => 0.2126 * ch(rgba[0]) + 0.7152 * ch(rgba[1]) + 0.0722 * ch(rgba[2]);
  const META = new Set(['offset', 'computedOffset', 'easing', 'composite']);
  const COLOR = new Set(['color', 'fill', 'stroke', 'backgroundColor', 'background-color', 'stopColor', 'stop-color']);
  return document
    .getAnimations()
    .filter((a) => a.playState === 'running')
    .map((a) => {
      const effect = a.effect;
      const frames = effect?.getKeyframes() ?? [];
      const props = [...new Set(frames.flatMap((f) => Object.keys(f).filter((k) => !META.has(k))))];
      // A property counts as changed when its keyframe values differ
      const changed = props.filter((p) => new Set(frames.map((f) => String(f[p] ?? ''))).size > 1);
      const timing = effect?.getComputedTiming() ?? {};
      const duration = Number(timing.duration) || 0;
      const iterations = timing.iterations ?? 1;
      const alternate = /alternate/.test(effect?.getTiming().direction ?? '');
      // Flashes per iteration, from opacity, visibility or colour luminance (rgb() keyframes) swings ≥ 0.1
      let flashesPerIteration = 0;
      for (const p of changed) {
        let series = null;
        if (p === 'opacity') series = frames.map((f) => Number(f.opacity ?? 1));
        else if (p === 'visibility') series = frames.map((f) => (f.visibility === 'hidden' ? 0 : 1));
        else if (COLOR.has(p)) {
          const colours = frames.map((f) => parseColor(f[p]));
          if (colours.every(Boolean)) series = colours.map(lum);
        }
        if (!series || Math.max(...series) - Math.min(...series) < 0.1) continue;
        // Falling crossings of the mid level over one cycle (the cycle wraps: the last frame leads
        // back to the first); an alternate animation's cycle is two iterations, there and back
        const mid = (Math.max(...series) + Math.min(...series)) / 2;
        const cycle = (alternate ? [...series, ...series.slice(0, -1).reverse()] : series).map((v) => v > mid);
        let falls = 0;
        for (let i = 0; i < cycle.length; i++) if (cycle[i] && !cycle[(i + 1) % cycle.length]) falls += 1;
        flashesPerIteration = Math.max(flashesPerIteration, falls / (alternate ? 2 : 1));
      }
      const totalFlashes = flashesPerIteration * (Number.isFinite(iterations) ? iterations : 1e9);
      const hz = duration > 0 && totalFlashes >= 2 ? flashesPerIteration / (duration / 1000) : 0;
      const target = effect?.target;
      return {
        name: a.animationName ?? a.id ?? 'animation',
        target: target instanceof Element ? `${target.tagName.toLowerCase()}${target.className?.baseVal ?? target.className ? `.${String(target.className?.baseVal ?? target.className).split(' ')[0]}` : ''}` : '?',
        changed,
        hz: Math.round(hz * 10) / 10,
        selfTest: target instanceof Element && target.hasAttribute('data-ui-selftest'),
      };
    });
}

const motionOffenders = (anims) => anims.filter((a) => a.changed.some((p) => p !== 'opacity'));
const flashOffenders = (anims, max) => anims.filter((a) => a.hz > max);

/** Samples the running animations for `ms` and returns every distinct one seen. */
async function sampleAnimations(page, ms, every = 100) {
  const seen = new Map();
  for (let t = 0; t <= ms; t += every) {
    for (const a of await page.evaluate(describeAnimations)) seen.set(`${a.name}|${a.target}|${a.changed.join(',')}`, a);
    await page.waitForTimeout(every);
  }
  return [...seen.values()];
}

/** The motion detectors must catch a 5 Hz blink and a sliding element, and pass a slow fade. */
async function selfTest(page) {
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = `@keyframes ui-st-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
      @keyframes ui-st-slide { from { transform: none } to { transform: translateX(20px) } }
      @keyframes ui-st-fade { from { opacity: 0 } to { opacity: 1 } }`;
    document.head.appendChild(style);
    for (const [name, css] of [
      ['blink', 'ui-st-blink 200ms linear infinite'],
      ['slide', 'ui-st-slide 1s linear infinite'],
      ['fade', 'ui-st-fade 2s linear 1'],
    ]) {
      const el = document.createElement('div');
      el.setAttribute('data-ui-selftest', name);
      el.style.cssText = `position:fixed;left:0;top:0;width:4px;height:4px;animation:${css}`;
      document.body.appendChild(el);
    }
  });
  const anims = (await page.evaluate(describeAnimations)).filter((a) => a.selfTest);
  await page.evaluate(() => document.querySelectorAll('[data-ui-selftest]').forEach((el) => el.remove()));
  const blink = anims.find((a) => a.name === 'ui-st-blink');
  const slide = anims.find((a) => a.name === 'ui-st-slide');
  const fade = anims.find((a) => a.name === 'ui-st-fade');
  const problems = [];
  if (!blink || flashOffenders([blink], MAX_FLASH_HZ).length !== 1) problems.push(`a 5 Hz blink was not flagged (${blink?.hz ?? 'unseen'} Hz)`);
  if (!slide || motionOffenders([slide]).length !== 1) problems.push('a sliding element was not flagged as motion');
  if (!fade || motionOffenders([fade]).length !== 0 || flashOffenders([fade], MAX_FLASH_HZ).length !== 0) problems.push('a one-shot fade was flagged');
  return problems;
}

/**
 * Runs every popup check. `report` is { pass(msg), fail(msg) } from ui-check.mjs. Returns the
 * waived runs, for the summary.
 */
export async function checkPopup(browser, base, viewports, report) {
  const index = await browser.newPage();
  const listed = await listPopupFixtures(index, base);
  await index.close();
  if (!listed || listed.fixtures.length === 0) {
    report.fail('翻翻台北: no popup fixtures at #/pagelab?section=fixtures');
    return;
  }
  // `UI_ONLY=a,b` checks only these fixtures (a quick look while working on a screen)
  const only = process.env.UI_ONLY?.split(',');
  const fixtures = only ? listed.fixtures.filter((f) => only.includes(f)) : listed.fixtures;
  const waived = new Map();
  let artRuns = 0;
  const noteWaiver = (issue, what) => waived.set(issue, (waived.get(issue) ?? 0) + (what ? 1 : 0));

  console.log('翻翻台北 R5 text and R6 hit areas');
  for (const viewport of viewports) {
    const open = () => browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1, reducedMotion: 'reduce', isMobile: true, hasTouch: true });
    for await (const [page, name] of freshPages(open, fixtures)) {
      await openPopupFixture(page, base, name);
      await page.waitForTimeout(300);
      const audit = await page.evaluate(a11yAudit);
      const marks = await page.evaluate(coveredMarks);
      const talk = await page.evaluate(talkCover, TALK_SLACK);
      const { texts, hits, art, hitless } = await page.evaluate(collect, {
        waivers: WAIVERS.map(({ selector, rules, issue }) => ({ selector, rules, issue })),
        artText: ART_TEXT,
        minText: MIN_TEXT_PX,
        minTextBig: MIN_TEXT_PX_BIG,
      });
      await page.evaluate(hideText);
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
      const png = PNG.sync.read(await page.screenshot({ animations: 'disabled', caret: 'hide' }));
      const scale = png.width / viewport.width;

      const small = [];
      const faint = [];
      for (const t of texts) {
        if (t.px < t.min - 0.05) {
          if (t.waivedSize) noteWaiver(t.waivedSize, true);
          else small.push(`「${t.text}」 ${t.px}px < ${t.min}`);
        }
        let ratio = null;
        if (t.fg === null) ratio = null;
        else if (t.halo) ratio = contrast(t.fg, t.halo);
        else ratio = backgroundContrast(png, scale, t.rect, t.fg);
        if (ratio !== null && ratio < MIN_CONTRAST) {
          if (t.waivedContrast) noteWaiver(t.waivedContrast, true);
          else faint.push(`「${t.text}」 ${ratio.toFixed(1)}:1`);
        } else if (t.fg === null && !t.waivedContrast) {
          faint.push(`「${t.text}」 fill ${t.fill} is not a flat colour (cannot measure)`);
        }
      }
      const tiny = hits.filter((h) => !h.waived && !h.covered && (h.w < MIN_HIT_PX - 0.5 || h.h < MIN_HIT_PX - 0.5)).map((h) => `"${h.label}" ${h.w}×${h.h}`);
      const pageHits = hits.filter((h) => h.page).length;
      const label = `${viewport.name}/${name}`;
      artRuns += art;
      if (small.length === 0) pass(report, `${label}: ${texts.length} text runs ≥ ${MIN_TEXT_PX}px (or waived)`);
      else report.fail(`${label} text size: ${small.join('; ')}`);
      if (faint.length === 0) pass(report, `${label}: text contrast ≥ ${MIN_CONTRAST}:1 (or waived)`);
      else report.fail(`${label} contrast: ${faint.join('; ')}`);
      if (pageHits === 0 && !hitless) report.fail(`${label}: no [data-hit] touchables found (the page's hit layer is missing)`);
      else if (tiny.length === 0) pass(report, `${label}: ${hits.length} hit areas ≥ ${MIN_HIT_PX}×${MIN_HIT_PX}`);
      else report.fail(`${label} hit areas: ${tiny.join('; ')}`);
      if (marks.under.length === 0) {
        if (marks.checked > 0) pass(report, `${label}: ${marks.checked} perch paws / hint halos in sight${marks.talk > 0 ? ` (${marks.talk} under a subtitle, which any tap clears)` : ''}`);
      } else report.fail(`${label} hidden marks: ${marks.under.join('; ')}`);
      if (talk.unmarked) report.fail(`${label} talk clear: a subtitle drew no [data-subtitle-card] (the check cannot see it)`);
      else if (talk.over.length > 0) report.fail(`${label} talk clear: ${talk.over.join('; ')}`);
      else if (talk.cards > 0) pass(report, `${label}: ${talk.cards} subtitle cards clear of his thought bubble and him`);
      const unnamed = audit.controls.filter((c) => !c.named).map((c) => `<${c.tag}${c.role ? ` role=${c.role}` : ''}>`);
      const iconless = audit.controls.filter((c) => c.button && !c.icon).map((c) => `「${c.name}」`);
      const doc = [audit.lang === 'zh-Hant' ? null : `lang="${audit.lang}"`, audit.title ? null : 'no <title>'].filter(Boolean);
      if (unnamed.length === 0 && iconless.length === 0 && doc.length === 0) pass(report, `${label}: ${audit.controls.length} controls named, every button with an icon, zh-Hant, titled`);
      else report.fail(`${label} a11y: ${[...doc, ...(unnamed.length ? [`no accessible name: ${unnamed.join(', ')}`] : []), ...(iconless.length ? [`buttons without an icon: ${iconless.join(', ')}`] : [])].join('; ')}`);
      if (viewport.name === REFERENCE_VIEWPORT) {
        const grown = hits.filter((h) => h.grown && !h.waived && !h.covered).map((h) => `"${h.label}"`);
        if (grown.length === 0) pass(report, `${label}: every page hit shape is ≥ ${MIN_HIT_PX} px after the book scale (none grown)`);
        else report.fail(`${label} hit areas under ${MIN_HIT_PX} px after the book scale (grown by the hit layer): ${grown.join(', ')}`);
      }
    }
  }

  console.log('翻翻台北 motion: reduced motion and flashing');
  const probe = await browser.newPage({ viewport: viewports[0] });
  await openPopupFixture(probe, base, fixtures[0], false);
  const problems = await selfTest(probe);
  await probe.close();
  if (problems.length === 0) pass(report, 'self-test: a 5 Hz blink and a slide are caught, a slow fade passes');
  else report.fail(`self-test: ${problems.join('; ')}`);

  for (const [mode, reducedMotion] of [
    ['reduced', 'reduce'],
    ['motion', 'no-preference'],
  ]) {
    for await (const [page, name] of freshPages(() => browser.newPage({ viewport: viewports[0], reducedMotion }), fixtures)) {
      // Live: the fixture's last tick plays, then the clock runs on
      await openPopupFixture(page, base, name, false);
      const anims = await sampleAnimations(page, 1500);
      const flashing = flashOffenders(anims, MAX_FLASH_HZ).map((a) => `${a.name} on ${a.target} at ${a.hz} Hz`);
      if (mode === 'reduced') {
        const moving = motionOffenders(anims).map((a) => `${a.name} on ${a.target} (${a.changed.join(', ')})`);
        if (moving.length === 0) pass(report, `reduced motion: ${name} (${anims.length} animations seen, fades only)`);
        else report.fail(`reduced motion: ${name} still animates ${moving.join('; ')}`);
      }
      if (flashing.length === 0) pass(report, `no flashing > ${MAX_FLASH_HZ} Hz (${mode}): ${name}`);
      else report.fail(`flashing (${mode}): ${name}: ${flashing.join('; ')}`);
    }
  }

  console.log(`  ~ skipped ${artRuns} runs of lettering inside pictures (${ART_TEXT})`);
  for (const w of WAIVERS) {
    console.log(`  ~ waived until ${w.issue}: ${w.rules.join(', ')} in ${w.selector} (${waived.get(w.issue) ?? 0} runs): ${w.why}`);
  }
}

const pass = (report, message) => report.pass(message);
