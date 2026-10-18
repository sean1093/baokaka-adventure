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

### 2026-10-18 · Staff engineer · #4 Visual QA tooling (PR #62)
- `#/artlab` (dev only; `App` lazy-loads `src/artlab/ArtLab.tsx` behind `import.meta.env.DEV`, so production has one JS chunk and no art lab code). Sprites section: all 75 sprites at 48/64/124/300 px on light, night, brick and a mask-based silhouette row; `only`, `bg`, `size`, `section`, `still=1` parameters. Screens section: `ARTLAB_FIXTURES` (`src/artlab/fixtures.ts`): title-continue, world, dialogue, chapter, battle (3 foes, opens on a hero turn), victory, shop, menu, defeat, ending, built from `freshRun`/`startBattle`/`EVENTS` and unit-tested (`fixtures.test.ts`).
- Refactor: `src/quest/QuestScreens.tsx` holds the view switch; `QuestGame` keeps storage and music. Fixtures render through it with a live reducer.
- `parseRoute` knows `artlab` and ignores `?…`; new `hashParams()`. Unit-tested.
- `scripts/visual-check.mjs` + `scripts/visual-targets.mjs`; `npm run visual` / `visual:update`; baselines for 12 targets × 2 viewports in `tests/visual-baseline/`; `artifacts/` gitignored. Verified: update → pass with 0 px diff; changing `sun` in the palette fails title and battle with diff images; `--perf` prints stats (median 33 ms / p95 67 ms on the dev build at 4× throttle, 1,103 DOM nodes). Production `#/artlab` shows the title.
- README § 5 *Visual QA* documents usage; D-21 records the deviations (dev server for `--serve`, fixture discovery, silhouettes via mask).
- Follow-ups: #57 should measure frame work from a trace on a production build (rAF intervals are vsync-floored); #10 should regenerate baselines once web fonts land.

### 2026-10-18 · Staff engineer · #5 Four-hero party, new 才藝, level cap 20 (PR #63)
- `HeroId`/`HERO_ORDER` are `baokaka, mocha, magpie, bear`; heroes use the bible § 2.1 suggested stats (寶咖咖's def/luck went 4/5 → 5/6) and short blurbs; `SPELLS` is the 16-skill table (borrowed FX until #15); `MAX_LEVEL = 20` with the bible XP table. `freshRun` builds `equip` from `HERO_ORDER`.
- Save v3 (`baokaka.quest.v3`); v2 is a legacy key now, so an old three-hero save resets with the notice (D-22).
- Old content: 阿藍 replaces the duck in 浴缸島, 黑糖 joins in `night.intro` (both temporary until #21). The duck sprite is deleted; 阿藍/黑糖 borrow the pigeon/mole king sprites (`HERO_SPRITE`) until #17.
- Battle: four heroes stand in two staggered rows, the card row holds four; the compact world party strip hides portraits with four heroes. New art lab fixture `battle-4-heroes` (Lv10); `battle` is now the three-hero layout. Baselines regenerated (title/ending lost the duck, sprite sheet lost it, world/menu/dialogue/chapter show four heroes, victory lists the new Lv5 skill).
- Sim: careful/casual cast the shield before a party-wide hit; 阿藍 joins before 大章魚, 黑糖 before 打呼嚕大王. `npm run sim` (200 seeds): careful 200/200, casual 197/200, reckless 119/200 (before: 198, 176, 76) — the stronger roster and 黑糖 make the old final easy; balance is #54.
- Tests: new `heroes.test.ts` (stats, the exact skill table, XP cap at 6700 → Lv20), late joins (黑糖 at Lv10 knows 熊掌拍拍/大地咚咚/黑糖暖暖; 阿藍 at Lv3 only 羽毛雨), four-hero battle to a win, the shield halving an all-party hit for all four, 九命回春 revive, v2-as-legacy save. 155 tests in all.
- Follow-ups: none new beyond D-22's consequences (#14, #15, #17, #21, #54). The victory screen still draws only 寶咖咖 and 摩卡貓 (redone in M2).

### 2026-10-18 · Staff engineer · #6 Script steps v2 (PR #64)
- New/extended `Step`s in `types.ts`: `chapter` with `time`/`label`, `heal` with `ratio`, `choice`, `goEvent`, `include` (with `when`/`not`); the multi-phase boss retry pattern is documented on the `Step` type. New `QuestAction` `choose` and `QuestState.choice`; `card` carries `time`/`label`.
- `runScene` handles `goEvent`/`include` by rewriting the step list (no recursion), runs every line through `substitute()` (new `text.ts`, identity until #9), heals with `healPartyTo` for a ratio, and turns `inn 0` into an immediate heal with 「休息了一下，大家的體力和元氣都滿了。」.
- `validate.ts`: clock `HH:MM`, chapter number/label, choice 2–3 options with labels 1–12 chars and real targets, `goEvent`/`include` targets, heal ratio in (0, 1], inn price ≥ 0, include cycles / depth > 4 / branches inside includes (`validateIncludes`); events reached through choice/goEvent/include count as used. Details in D-23.
- UI: the chapter card shows the label and the clock (monospaced amber digits); `ChoicePrompt` in `Dialogue.tsx` shows the prompt and 2–3 equal 56 px buttons. Art-lab fixtures `chapter-card` (renamed from `chapter`) and `dialogue-choice`; baselines added for those, all others unchanged (0 px diff). Screenshots in `docs/screenshots/6/`.
- Tests: new `steps.test.ts` (chapter clock/label, choice branches and input locking, goEvent, include true/false/`not`/with a battle, validator errors, heal ratio, free inn, `coins -20` with 5 → 0 in an event purchase, two-phase boss win and retry keeping `phase1`), `text.test.ts`, fixture checks. 187 tests. The old story is untouched (no content uses the new steps yet), so the sim is unchanged.
- Follow-ups: none new. `sim.ts`'s `storyFights` only reads `battle` steps directly in talk events; when #21 starts using `include`/`goEvent` around fights, it should follow them (noted for #21/#54).

### 2026-10-18 · Staff engineer · #7 Derived flags, quest log, 圖鑑, escorts (PR #65)
- New `src/quest/engine/progress.ts`: `DERIVED` + `applyDerived` (fixed point; `bestiaryAll` from `seenFoes`), `addFlags`/`refreshDerived`/`recordFoes` (the single write path, used by script `flag` steps, chests, triggers and victories), the 14 `QUESTS` with `questStatus`/`questLog`, the 13-slot `TRAY` with `trayState`, the four `COLLECTIONS` copied from the script (14 stamps, 8 長輩圖, 14 回音, 8 riders) with `collectionState`, `BESTIARY_FOES`/`bestiaryState`, and `FOLLOWERS` (empty) with `activeFollower`.
- `Run.seenFoes` (appended on victory only, deduped, in order); `Foe.calmed`/`home`/`postGame`. Save v4 (`baokaka.quest.v4`), v3 is legacy.
- `validate.ts`: `validateDerived` (cycles, duplicates, `atLeast`), `validateQuests`, `validateFollowers`, tray/collection/foe-field checks; `progressWarnings()` lists 90-odd flags no event sets yet (all chapter content), printed once as a dev console warning.
- World screen: the escort walks one tile behind the last hero on the party's own path; after a map change it starts beside the party (`restingSpot`). A new map now always snaps the walk animation (it used to keep the old map's trail when the arrival tile was near the old position). Art lab fixture `world-follower` (park, a stand-in snail); baseline added, all others 0 px. Screenshots in `docs/screenshots/7/`.
- Tests: new `progress.test.ts` (all-of, atLeast, chained, idempotence, bestiaryAll, addFlags/recordFoes, questStatus states, tray, collections, validators, warnings, `activeFollower`, `restingSpot`), reducer tests for victory/flee/defeat recording, derived flags after victories, chests and flag steps, save v4 round-trip and strict `seenFoes`. 224 tests. The sim is unchanged.
- Decisions in D-24 (the `…Any` flags, `lfAll` seeded early, what each collection stores, the escort's placement).
- Follow-ups for later issues are in D-24's consequences (chapter DERIVED/FOLLOWERS entries, `calmed`/`home` per foe, `postGame` on `shushuBonus`).

