#!/usr/bin/env node
/**
 * UI kit checks (issue #12 acceptance criteria), run in a real browser over the art lab fixtures:
 *
 *   1. Typing never reflows: the dialogue box is the same height half typed and fully typed.
 *   2. Tap targets: every visible button, link, switch and tab is at least 44×44px, and the battle
 *      commands are 70px tall (art direction § 7.2, docs/project/README.md § Code).
 *   3. Reduced motion (the OS setting, and the in-game 「減少動態」 toggle) leaves no looping,
 *      flipping or drawing animation running on any screen.
 *
 *   node scripts/ui-check.mjs [--serve] [--url <base>]     (npm run check:ui)
 *
 * Local only, like the visual check (Chromium from PLAYWRIGHT_BROWSERS_PATH); exits 1 on a failure.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { VIEWPORTS } from './visual-targets.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({
  options: {
    serve: { type: 'boolean', default: false },
    url: { type: 'string', default: 'http://localhost:5173/baokaka-adventure/' },
  },
});

const MIN_TARGET = 44;
const COMMAND_HEIGHT = 70;
/** Animations that must not run under reduced motion, besides anything that loops forever. */
const FORBIDDEN = /^(kit-flap|kit-draw|kit-fill|kit-twinkle|kit-next|kit-pulse|kit-iris|kit-spark)$/;

async function startDevServer() {
  const { createServer } = await import('vite');
  const server = await createServer({ root: ROOT, logLevel: 'warn', server: { port: 5173, strictPort: false } });
  await server.listen();
  return { server, url: server.resolvedUrls.local[0] };
}

const fixtureUrl = (base, name, still = true) => new URL(`#/artlab?section=fixtures&only=${name}${still ? '&still=1' : ''}`, base).href;

async function open(page, url, name) {
  await page.goto('about:blank');
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector(`[data-artlab-fixture="${name}"] main, [data-artlab-fixture="${name}"] [data-chapter-card]`, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
}

const failures = [];
const fail = (message) => {
  failures.push(message);
  console.log(`  ✗ ${message}`);
};
const pass = (message) => console.log(`  ✓ ${message}`);

/** 1. The box is measured while the line is still typing (ghost text present) and once it is done. */
async function checkTyping(browser, base) {
  console.log('Dialogue typing reflow');
  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    await page.goto(fixtureUrl(base, 'dialogue', false), { waitUntil: 'load' });
    await page.waitForSelector('[data-dialogue-box] .kit-ghost', { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    const measure = () =>
      page.evaluate(() => ({
        box: document.querySelector('[data-dialogue-box]').getBoundingClientRect().height,
        text: document.querySelector('[data-dialogue-text]').getBoundingClientRect().height,
        ghosts: document.querySelectorAll('[data-dialogue-box] .kit-ghost').length,
      }));
    const typing = await measure();
    await page.waitForFunction(() => document.querySelectorAll('[data-dialogue-box] .kit-ghost').length === 0, null, { timeout: 10000 });
    const typed = await measure();
    const label = `${viewport.name}: box ${typing.box}px while typing (${typing.ghosts} ghost runs) → ${typed.box}px typed`;
    if (typing.ghosts > 0 && typing.box === typed.box && typing.text === typed.text) pass(label);
    else fail(label);
    await page.close();
  }
}

/** 2. Every interactive element on every fixture, at both viewports. */
async function checkTargets(browser, base, fixtures) {
  console.log('Tap targets');
  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
    for (const name of fixtures) {
      await open(page, fixtureUrl(base, name), name);
      await page.waitForTimeout(400);
      const report = await page.evaluate(
        ({ min, command }) => {
          const small = [];
          let commands = 0;
          const nodes = document.querySelectorAll('button, a[href], [role="button"], [role="switch"], [role="tab"]');
          for (const node of nodes) {
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            if (rect.width === 0 || rect.height === 0 || style.visibility === 'hidden' || style.display === 'none') continue;
            // Off screen (scrolled lists inside sheets) are measured all the same: they scroll into view
            const label = (node.getAttribute('aria-label') || node.textContent || node.tagName).trim().slice(0, 24);
            if (node.classList.contains('kit-cmd')) {
              commands += 1;
              if (Math.round(rect.height) !== command) small.push(`command "${label}" is ${Math.round(rect.height)}px tall`);
            }
            if (rect.width < min - 0.5 || rect.height < min - 0.5) small.push(`"${label}" ${Math.round(rect.width)}×${Math.round(rect.height)}`);
          }
          return { small, commands, total: nodes.length };
        },
        { min: MIN_TARGET, command: COMMAND_HEIGHT },
      );
      const label = `${viewport.name}/${name}: ${report.total} targets${report.commands ? `, ${report.commands} commands` : ''}`;
      if (report.small.length === 0) pass(label);
      else fail(`${label}: ${report.small.join('; ')}`);
    }
    await page.close();
  }
}

/** The animations still running that reduced motion should have removed. */
const runningMotion = (page) =>
  page.evaluate((forbidden) => {
    const pattern = new RegExp(forbidden);
    return document
      .getAnimations()
      .filter((animation) => animation.playState === 'running')
      .filter((animation) => animation.effect?.getTiming().iterations === Infinity || pattern.test(animation.animationName ?? ''))
      .map((animation) => `${animation.animationName ?? 'animation'} on ${animation.effect?.target?.className?.toString().slice(0, 40) ?? '?'}`);
  }, FORBIDDEN.source);

/** 3. No loops, flips or draw-ons under the OS setting (every fixture) or the toggle (its own fixture). */
async function checkReducedMotion(browser, base, fixtures) {
  console.log('Reduced motion');
  const viewport = VIEWPORTS[0];
  const normal = await browser.newPage({ viewport, reducedMotion: 'no-preference' });
  await open(normal, fixtureUrl(base, 'chapter-card', false), 'chapter-card');
  await normal.waitForTimeout(300);
  const playing = await runningMotion(normal);
  if (playing.length > 0) pass(`sanity: without reduced motion the chapter card plays ${playing.length} animations`);
  else fail('sanity: the chapter card plays no animation even without reduced motion');
  await open(normal, fixtureUrl(base, 'chapter-card-reduced', false), 'chapter-card-reduced');
  await normal.waitForTimeout(300);
  const toggled = await runningMotion(normal);
  if (toggled.length === 0) pass('減少動態 toggle: the chapter card has nothing looping, flipping or drawing');
  else fail(`減少動態 toggle: still running ${toggled.join(', ')}`);
  await normal.close();

  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  for (const name of fixtures) {
    await open(page, fixtureUrl(base, name, false), name);
    await page.waitForTimeout(300);
    const running = await runningMotion(page);
    if (running.length === 0) pass(`OS setting: ${name}`);
    else fail(`OS setting: ${name} still runs ${running.join(', ')}`);
  }
  await page.close();
}

const dev = args.serve ? await startDevServer() : null;
const base = dev ? dev.url : args.url;
const browser = await chromium.launch();
try {
  const index = await browser.newPage();
  await index.goto(new URL('#/artlab?section=fixtures', base).href, { waitUntil: 'load' });
  await index.waitForSelector('[data-fixture]', { timeout: 20000 });
  const fixtures = await index.$$eval('[data-fixture]', (items) => items.map((item) => item.getAttribute('data-fixture')));
  await index.close();

  await checkTyping(browser, base);
  await checkTargets(browser, base, fixtures);
  await checkReducedMotion(browser, base, fixtures);
} finally {
  await browser.close();
  await dev?.server.close();
}

if (failures.length > 0) {
  console.error(`\nUI check failed (${failures.length}):\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('\nUI check passed.');
