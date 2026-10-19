import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { CHAPTERS, chapterLine, chapterName, stickersIn } from '../../content';
import { completePage, earnSticker, freshSave } from '../../game/progress';
import { registry } from '../../pages';
import { BottomBar } from '../hud/BottomBar';
import { TopHud, runWidth } from '../hud/TopHud';
import { Contents, ROUTE, STATIONS, chapterComplete, collected, pageIdOf, routeLength } from './Contents';
import { Cover } from './Cover';
import { StubScreen } from './StubScreen';

/**
 * The UI shell's screens, rendered to static markup (#97): what each shows for a save, the R5 text
 * sizes the markup asks for, 左手模式's mirror, and the 目錄's map and counts.
 */

const noop = () => undefined;
const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);
const fresh = freshSave(registry);
const played = earnSticker(completePage(fresh, 'c0p1', { mischief: true, tudigong: true }), 'c1p2', 'mischief');

/** Every font size the markup sets (SVG attributes, inline styles and Tailwind `text-[Npx]`). */
function fontSizes(markup: string): number[] {
  return [...markup.matchAll(/font-size="([\d.]+)"|font-size:\s*([\d.]+)px|text-\[(\d+)px\]/g)].map((m) => Number(m[1] ?? m[2] ?? m[3]));
}
/** Font sizes outside `data-art-text` lettering. */
const uiSizes = (markup: string) => fontSizes(markup.replace(/<text data-art-text[^>]*>[^<]*<\/text>/g, ''));

describe('content', () => {
  test('chapters 0–10, the prologue has 4 pages and the rest 6; § 4.3 titles for 0–1', () => {
    expect(CHAPTERS.map((c) => c.chapter)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(stickersIn(0)).toBe(12);
    expect(stickersIn(1)).toBe(18);
    expect(CHAPTERS[1].pageTitles?.[1]).toBe(registry.pageById('c1p2')!.title);
    expect(CHAPTERS[0].pageTitles?.[0]).toBe(registry.pageById('c0p1')!.title);
    expect(chapterName(0)).toBe('序章');
    expect(chapterName(10)).toBe('第十章');
    expect(chapterLine(1, 2)).toBe('第一章 · 第 2 頁 / 6');
    expect(chapterLine(0, 1)).toBe('序章 · 第 1 頁 / 4');
  });
});

describe('Cover', () => {
  test('first launch shows only 「開始」', () => {
    const m = html(createElement(Cover, { first: true, resume: { chapter: 0, title: '嬰兒床' }, onResume: noop, onContents: noop, onAlbum: noop, onSettings: noop }));
    expect(m).toContain('data-button="start"');
    expect(m).toContain('開始');
    expect(m).not.toContain('data-button="resume"');
    expect(m).not.toContain('data-button="contents"');
  });

  test('with a save: 「繼續」 (where it resumes), 目錄, 相簿, 設定; every UI text ≥ 20 px', () => {
    const m = html(createElement(Cover, { first: false, resume: { chapter: 1, title: '月台的縫' }, onResume: noop, onContents: noop, onAlbum: noop, onSettings: noop }));
    for (const b of ['resume', 'contents', 'album', 'settings']) expect(m).toContain(`data-button="${b}"`);
    expect(m).toContain('第一章「月台的縫」');
    expect(m).not.toContain('data-button="start"');
    for (const px of uiSizes(m)) expect(px).toBeGreaterThanOrEqual(20);
  });
});

describe('TopHud', () => {
  test('the landmark, the page title, the chapter line, the clock and the tray, all ≥ 20 px', () => {
    const m = html(createElement(TopHud, { landmark: '台北車站', title: '月台的縫', chapter: 1, index: 2, time: '00:20', coins: 3 }));
    expect(m).toContain('台北車站');
    expect(m).toContain('「月台的縫」');
    expect(m).toContain('第一章 · 第 2 頁 / 6');
    expect(m).toContain('00:20');
    expect(m).toContain('data-tray="3"');
    expect(m).toContain('data-slot="hud"');
    // The kit proof's 12–19 px labels are gone (the #92 waiver): every text run is ≥ 20 px
    for (const px of uiSizes(m)) expect(px).toBeGreaterThanOrEqual(20);
  });

  test('a row too long for the label is condensed, never shrunk', () => {
    const short = html(createElement(TopHud, { landmark: '家', title: '嬰兒床', chapter: 0, index: 1, time: '00:00', coins: 0 }));
    expect(short).not.toContain('textLength');
    const long = html(createElement(TopHud, { landmark: '台北車站', title: '月亮線，出發！', chapter: 1, index: 1, time: '00:20', coins: 0 }));
    expect(long).toMatch(/textLength="230"/);
    expect(runWidth('台北', 20)).toBe(40);
    expect(runWidth('00:20', 20)).toBe(60);
  });
});

describe('BottomBar', () => {
  test('the portrait, 提示, 重來, 選單 as ≥ 48 px buttons with icon and a 20 px label, and the stickers', () => {
    const m = html(createElement(BottomBar, { stickers: [true, true, false] }));
    for (const b of ['talk', 'hint', 'retry', 'menu']) expect(m).toContain(`data-bar="${b}"`);
    for (const w of ['說話', '提示', '重來', '選單']) expect(m).toContain(`>${w}</span>`);
    expect(m).toContain('data-stickers="110"');
    expect(m).toMatch(/w-\[62px\]/);
    expect(m).toMatch(/min-height:96px/);
    for (const px of uiSizes(m)) expect(px).toBeGreaterThanOrEqual(20);
    expect(m).not.toContain('data-left-hand');
  });

  test('左手模式 mirrors the bar', () => {
    const m = html(createElement(BottomBar, { leftHand: true }));
    expect(m).toContain('data-left-hand');
    expect(m.match(/flex-direction:row-reverse/g)).toHaveLength(2);
  });
});

describe('Contents (目錄)', () => {
  test('eleven stations on the route; the route length reaches each in order', () => {
    expect(STATIONS).toHaveLength(11);
    expect(ROUTE.startsWith(`M${STATIONS[0][0]} ${STATIONS[0][1]}`)).toBe(true);
    for (let i = 1; i < STATIONS.length; i++) expect(routeLength(i)).toBeGreaterThan(routeLength(i - 1));
    expect(routeLength(1)).toBe(119);
  });

  test('stickers collected per chapter and completeness', () => {
    expect(collected(played, 0)).toBe(3);
    expect(collected(played, 1)).toBe(1);
    expect(collected(fresh, 0)).toBe(0);
    expect(chapterComplete(played, 0)).toBe(false); // 0-2…0-4 are not solved (nor built) yet
    expect(pageIdOf(1, 6)).toBe('c1p6');
  });

  test('chapter 1: open stations with counts, locked ones with a padlock, the strip with the bookmark on 1-2', () => {
    const m = html(createElement(Contents, { save: played, registry, chapter: 1, resumeId: 'c1p2', backLabel: '封面', onBack: noop, onStation: noop, onPlay: noop }));
    expect(m).toContain('data-screen="contents"');
    expect(m.match(/data-station="\d+" data-open=""/g)).toHaveLength(2);
    expect(m).toContain('3/12');
    expect(m).toContain('1/18');
    expect(m).toContain('第一章');
    expect(m).toContain('已收集 <span class="font-num font-semibold">1／18</span>');
    // Six page cards; only 1-2 is playable (the rest are not built yet), and it carries the bookmark
    expect(m.match(/data-page-card="c1p\d"/g)).toHaveLength(6);
    expect(m).toMatch(/data-page-card="c1p2"[^>]*data-current=""/);
    expect(m.match(/<button[^>]*disabled=""[^>]*data-page-card/g)).toHaveLength(5);
    expect(m).not.toContain('data-locked-line');
    for (const px of uiSizes(m)) expect(px).toBeGreaterThanOrEqual(20);
  });

  test('the prologue: 0-1 solved with both stickers', () => {
    const m = html(createElement(Contents, { save: played, registry, chapter: 0, resumeId: 'c1p2', backLabel: '封面', onBack: noop, onStation: noop, onPlay: noop }));
    expect(m.match(/data-page-card="c0p\d"/g)).toHaveLength(4);
    expect(m).toMatch(/data-page-card="c0p1"[^>]*data-solved=""/);
  });

  test('a locked station answers 「月亮線還沒開到這裡。」', () => {
    const m = html(createElement(Contents, { save: played, registry, chapter: 1, locked: 4, resumeId: 'c1p2', backLabel: '封面', onBack: noop, onStation: noop, onPlay: noop }));
    expect(m).toContain('data-locked-line');
    expect(m).toContain('月亮線還沒開到這裡。');
    expect(m).toContain('霓虹燈睡著了');
    expect(m).not.toContain('data-strip');
  });
});

test('the album and settings stubs lead back', () => {
  for (const kind of ['album', 'settings'] as const) {
    const m = html(createElement(StubScreen, { kind, onBack: noop }));
    expect(m).toContain(`data-screen="${kind}"`);
    expect(m).toContain('data-button="back"');
  }
});
