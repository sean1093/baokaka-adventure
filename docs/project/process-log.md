# Process Log

Chronological record of the redesign. **Append** a new entry at the bottom whenever you finish a unit of work (an issue, a doc pass, a review round, an owner decision). Keep entries short: date, who, what happened, links (issue/PR/commit), anything the next person must know.

Format:

```
### YYYY-MM-DD · <who> · <what>
- bullet points
```

---

### Before 2026-10-18 · Background
- 2026-09-01 → 09-02: the site started as one hidden-object game (找找看) with Baokaka and Mocha Cat drawn from photos.
- 2026-09-06: a turn-based quest game, a hub and a picture sudoku were added; a shared design system (`docs/superpowers/specs/2026-09-06-design-system.md`) unified the collection.
- 2026-09-07: the RPG was rebuilt as 寶咖咖奇俠傳, a 仙劍-style isometric adventure (spec `docs/superpowers/specs/2026-09-07-baokaka-xia-design.md`), then its art was raised to 仙劍-era 2D with battle effects (commit `326e6e3`).

### 2026-10-18 · Owner · Redesign kick-off
- Decided to keep only the RPG and to re-story and re-skin it completely (decisions D-01, D-02).

### 2026-10-18 · Story agent · Story bible and script v1
- Wrote `docs/story/story-bible.md` and `docs/story/script.md` for 《寶咖咖抓周大冒險》: 抓周 premise, 咻咻 the baby typhoon, 10 chapters, four heroes, the 月亮線 (commit `0d045af`).

### 2026-10-18 · Owner → Story agent · Airport, 淡水, playable MRT, topical jokes
- Owner asked for a 松山機場 chapter, a bigger 淡水 (漁人碼頭, the new 淡江大橋), MRT rides that are actually playable, and some topical jokes under strict rules (D-04, D-07).
- Story agent added Ch8 松山機場, the ride-car system (bible § 3.1), the 淡江大橋 backdrop with accuracy notes (verified by web search), and the topical-joke registry (bible § 9) (commit `50d073c`).

### 2026-10-18 · Art agent · Art direction draft and options A–C
- Wrote `docs/art/art-direction.md` (v1, for option A "Taipei picture-book diorama") and rendered three comparison options on the same set (characters at 48px, an iso patch with 101, a 390×844 battle mock): A Picture-Book Diorama, B Paper-Cut Night, C Neon-Sign Taipei (`docs/art/options/`). Earlier picture-book drafts moved to `docs/art/archive/`.

### 2026-10-18 · Owner → Art agent · Option D (anime) requested and chosen
- Owner feedback: 「精緻一點，像是日本動漫風格」. Art agent added option D "動漫 Anime Cel" (cel shading, tinted two-pass line art, glossy eyes, Shinkai-style night skies, navy-glass + gold JRPG UI) with expressions and a dialogue mock (commit `19f0433`).
- Owner approved D with a mix: B's 布袋戲 stage frame for boss fights, C's neon only in 西門町 / 士林夜市 / MRT cars, A's technical rules (D-08).

### 2026-10-18 · Owner → Art agent · Anatomy feedback
- Owner asked for anatomy fixes on the D characters. Art agent produced an anatomy sheet and new standing/walking references (`docs/art/options/d-anime/anatomy-sheet.*`, `baokaka-stand.svg`, `mocha-walk.svg`, generator `_gen/anime2.py`, `_gen/anat.py`) (commit `fad8087`, work in progress) (D-09).

### 2026-10-18 · Owner → Story agent · Expansion to 6–8 hours
- Owner asked for a longer game. Story agent expanded to 14 chapters (added 龍山寺/剝皮寮 with the stolen-ticket twist, 碧潭, 陽明山), sub-maps with gate puzzles, hero side stories with signature gear, cross-chapter side quests, collections, bestiary, `choice` step, derived flags, level cap 20, and a post-game (象山 superboss, boss rush, quiz) (commit `d5f6a51`) (D-03, D-05, D-06).

### 2026-10-18 · Art agent · Art direction finalised
- `docs/art/art-direction.md` rewritten as the single D source of truth, matching the 14-chapter bible: style spec (anatomy-first construction, two-pass line, cel), colour tokens and the night clock (00:00 → 05:29 sunrise), a location table for every map, the neon policy, character specs (heroes, 咻咻 ×4 forms, recurring NPCs), a 34-foe table and a boss table, the UI/UX system, and implementation rules (file layout, sprite contract, LODs, layers, performance budget, visual QA, build order).
- Updated the Baokaka and Mocha design sheets and added a cast sheet (`docs/art/options/d-anime/cast-sheet.*`, `cast/*.svg`, generators `_gen/cast_d.py`, `_gen/cast_page.py`).

### 2026-10-18 · Director · Bible boss-table fix
- Corrected stale chapter numbers in the story bible's boss table (舞布龍 Ch6, 超級大雞排 Ch7, 風向袋 Ch8, 茶壺爺 Ch9, 溫泉蛋 Ch11, 招潮蟹將軍 Ch13, the 101 bosses Ch14).

### 2026-10-18 · PM/TPM agent · Project plan
- Read the story bible, script, art options, the in-progress art direction and the whole engine (`src/quest/**`, `src/art/**`, `src/App.tsx`, `src/shared/**`).
- Wrote this folder: `README.md` (process, conventions, definition of done), `roadmap.md`, `decisions.md` (D-01…D-18, including routes, save reset, placeholder sprites, WIP ending card and the known doc inconsistencies), and this log.
- Created the epic #1 and 57 ordered implementation issues #2–#58 on GitHub (see `roadmap.md`), then opened and merged docs PR #59 (story bible, script, art direction and options, project plan) to `main` with the "merge" method.
- While writing the issues, added a conditional `include` step to #6 (the script has optional inserts such as `ending.party.lily` and the 小白機 at sunrise).
- Note for the next agent: start with issue #2. `docs/art/` may receive a follow-up PR from the art agent; always read the latest `art-direction.md` before art/UI work.

### 2026-10-18 · Staff engineer · #2 RPG only (PR #60)
- Deleted `src/hub`, `src/find`, `src/sudoku` (code and tests). `App` now renders `OrientationGuard` + `QuestGame`; `QuestGame` lost `onExit`, and the title screen lost its 回遊戲選單 button (no layout gap; `stopMusic` still runs on unmount).
- `src/shared/route.ts` reduced to D-13: `parseRoute` returns `game` or `legacy`; `installRouteRedirect()` (called in `main.tsx`) rewrites `#/find` / `#/sudoku` to `#/` with `replaceState` on boot and on `hashchange`. Unit-tested.
- `src/shared/legacy.ts` `cleanupLegacyStorage()` removes `baokaka.progress` and `baokaka.sudoku` on boot (never touches `baokaka.quest`); `StorageLike` gained `removeItem`. Unit-tested with fake and throwing storages.
- Removed unreferenced art and dead shared code (list in D-19); `sprites/targets.tsx` → `sprites/items.tsx`. A first pass wrongly dropped `comfortDoll` (the ending screen uses `SPRITES.comfortDoll`); `tsc` caught it and it was restored — grep for `SPRITES.` accesses as well as `sprite: '…'` when pruning art.
- `index.html` and `manifest.webmanifest` carry the new title and description; `.gitignore` ignores Python bytecode.
- Verified: `npm test` (91 tests), `npm run build`, and a Playwright smoke run at 390×844 (title, redirects incl. back button, new game, intro, first battle won, no console errors). Screenshots in `docs/screenshots/2/`.
- Follow-ups: none new. The world screen's home button still says 回遊戲選單 although it now returns to the RPG title; it gets re-labelled with the UI re-skin (M2).

### 2026-10-18 · Staff engineer · #3 Run v2: 銅板, new terms, save v2 (PR #61)
- Engine rename: `Run.stickers`/`Foe.stickers` → `coins`, `{ do: 'stickers' }` → `{ do: 'coins', amount }` (negative amounts floor at 0), `battleStickers` → `battleCoins`, `VictorySummary.stickers` → `coins`, plus `VictorySummary.boss`. `validate.ts` checks that a `coins` step amount and every foe's `coins` are whole numbers. `quest.ts`'s inn answer now reuses `innLines` instead of duplicating its strings.
- New `src/quest/engine/strings.ts` (`UI`) holds the renamed vocabulary (銅板, 才藝, 元氣, 武力, 身手), the battle command labels and every line from script § *Battle UI strings* and `system.defeat`; battle log, victory, defeat, shop, inn, party sheet/panel, title and ending screens read from it. Item blurbs and the old story's dialogue were updated for the new words only. `grep stickers|貼紙|真氣|仙術|武術|身法 src` is clean except for `save.test.ts`, which asserts legacy-shaped records are rejected.
- Save v2 (`save.ts`): `SAVE_VERSION = 2`, key `baokaka.quest.v2`, record `{ version, run, sound, settings: { skipRides } }`. An old `baokaka.quest` record gives a fresh run plus a one-time title notice (「冒險重新開始囉！」 / 「舊的存檔是上一個故事的，已經收進回憶裡了。」, 「好」); the key is deleted after mount (D-20 explains why the load itself doesn't delete). Verified in the browser with Playwright: the notice shows once, the key is gone, a reload shows no notice.
- Fixed the follow-up from #2: the world screen's home button is now 回到標題.
- Verified: `npm test` (114 tests), `npm run build`, `npm run sim` identical to before. Screenshots in `docs/screenshots/3/`.
- Follow-ups: the old story's remaining tone words (e.g. 「暴擊」, 打/倒下 in older dialogue) are replaced when the content is rewritten (M1+); the two-line battle log can be cut off when several foes faint in one action — the battle UI is redone in M2 (#12).
