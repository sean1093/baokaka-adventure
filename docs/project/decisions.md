# Decision Log

Append-only. Each entry: id, date, decision, why, consequences. To change a decision, add a new entry that supersedes the old one (and mark the old one "Superseded by D-xx"). Decisions D-01 to D-10 were made by the owner; D-11 onward were made by the project/program manager while planning the work (2026-10-18) and can be revisited by the owner.

---

### D-01 · 2026-10-18 · Keep only the RPG
**Decision.** The site stops being a collection. The hub, 找找看 (`src/find`) and 圖案數獨 (`src/sudoku`) are removed. The RPG (`src/quest`) becomes the single game and the site boots straight into its title screen.
**Why.** Owner decision: one deep, polished game instead of three small ones.
**Consequences.** Hub/find/sudoku code, tests, routes, sprites used only by them, and their storage keys (`baokaka.progress`, `baokaka.sudoku`) go away (issue #2). Shared utilities still used by the RPG (`shared/storage.ts`, `shared/random.ts`, `shared/audio.ts`, `components/*`) stay.

### D-02 · 2026-10-18 · Full story rewrite and new title
**Decision.** The 寶咖咖奇俠傳 / 仙劍 setting is replaced entirely by 《寶咖咖抓周大冒險》 — *Baokaka & Mocha: Midnight Across Taipei* (`docs/story/story-bible.md`, `docs/story/script.md`). 抓周 (the first-birthday grab ceremony) is the spine: nine treasures plus the gold lock, the red string, the 「1」 candle and the blank invitation.
**Why.** Owner request for a warm, family story rooted in Taipei that grandparents and kids both understand.
**Consequences.** Every map, event, foe, item and most sprites are new content. Terminology changes: 銅板 (coins, was 貼紙), 元氣 (MP, was 真氣), 才藝 (skills, was 仙術), 武力/身手 (was 武術/身法). Battle tone: tantrums, not violence (no 殺/死/血).

### D-03 · 2026-10-18 · 14 chapters in one night
**Decision.** 14 chapters across Taipei landmarks from 00:00 to 05:30, each chapter card shows a clock. Ending at 05:30 (阿嬤 wakes) and 10:00 (the party). Locations: home/大安森林公園, 台大, 台北車站, 西門町, 龍山寺/剝皮寮, 大稻埕, 士林夜市, 松山機場, 動物園/貓空, 碧潭, 北投, 陽明山, 淡水, 台北101; post-game 象山.
**Why.** "The night is the timer" gives a readable sense of progress and a natural colour script (navy → indigo → violet → gold).

### D-04 · 2026-10-18 · Airport, expanded 淡水, playable MRT
**Decision.** Owner-requested additions: a 松山機場 chapter (Ch8, planes asleep 23:00–05:00, the 「飛機！」 word), 淡水 expanded with 漁人碼頭 and the new 淡江大橋 (opened 2026-05-12; drawn as a non-walkable backdrop), and MRT rides as **playable** moments (the 月亮線: route-map screen + 5 walkable ride cars themed after real lines) rather than a menu.
**Consequences.** Engine work for travel (issue #9) and a ride-car content issue (#27). Accuracy rules: civilian, unbranded airport; no light rail drawn on the bridge; no designer named.

### D-05 · 2026-10-18 · Expand to 6–8 hours
**Decision.** Grow the game from ~2 h to 6–8 h with sub-maps and gate puzzles per chapter, cross-chapter side quests (lost & found, deliveries, clerk points, 長輩圖, echoes, MRT riders), hero side stories with signature gear, collections, a bestiary and a post-game (象山 superboss, boss rush, quiz).
**Consequences.** Content volume roughly ×4. Each chapter is split into a content issue and an art issue so PRs stay reviewable.

### D-06 · 2026-10-18 · Level cap 20
**Decision.** Cap raised from 12 to 20. XP table per story bible § 7. Main story ends around Lv 16–17; post-game targets 17 → 20.
**Consequences.** `MAX_LEVEL`, `XP_TABLE`, skill unlocks, foe stats from Ch6 on scaled ~×1.15 per chapter shift and settled by `sim.test.ts` (issues #5, #54).

### D-07 · 2026-10-18 · Topical-joke rules
**Decision.** Mostly evergreen Taiwanese life memes. Recent (2025–2026) memes only if verified by web search and light-hearted, each with a 12-month review date. No politics, no politicians, no real celebrities or brands, nothing mean or scary. Every joke must work for a grandparent and be harmless to a 6-year-old. Jokes sit only on optional NPCs/variants and never gate progress; each is removable by deleting one talk rule.
**Consequences.** The registry is story bible § 9. The only recent joke at the time of writing is `gag.ch13.newBridge` (review 2027-10). QA checks the registry in issue #58.

### D-08 · 2026-10-18 · Art option D, with B and C accents and A's rules
**Decision.** After comparing four options (A Picture-Book Diorama, B Paper-Cut Night, C Neon-Sign Taipei, D 動漫 Anime Cel), the owner chose **D** ("精緻一點，像是日本動漫風格"). Mix: B's 布袋戲 proscenium frames **boss** battles; C's neon is used **only** in 西門町, 士林夜市 and inside MRT cars; A's technical spine applies everywhere (sprite contract, rig groups, unique ids, pre-baked grade tokens, performance budget, Playwright visual QA).
**Consequences.** `docs/art/art-direction.md` was rewritten for D as the single art source of truth (finalised 2026-10-18: per-chapter colour scripts and the night clock, character specs, 34-foe and boss tables, UI system, implementation rules). Art issues reference its sections by name and require reading the latest version.

### D-09 · 2026-10-18 · Anatomy fix
**Decision.** On reviewing the first D renders, the owner asked for correct anatomy (proportions, limbs attaching properly, a believable crawling baby and a cat that reads as a cat). The art director produced an anatomy sheet (`docs/art/options/d-anime/anatomy-sheet.*`) and standing/walking references (`baokaka-stand.svg`, `mocha-walk.svg`).
**Consequences.** Character art issues (#16–#18) must match the anatomy sheet; reviewers check silhouettes at map size and joints at battle/portrait size.

### D-10 · 2026-10-18 · Baokaka can't walk until the finale
**Decision.** Baokaka crawls (map) and sits (battle) for the whole game; he stands only in Ch14 (first steps) and the ending. He speaks only from a fixed toddler vocabulary.
**Consequences.** The hero rig needs crawl, sit and a one-off stand pose; the script's vocabulary list is a QA check.

---

### D-11 · 2026-10-18 · Build the new story in place; `main` always playable
**Decision.** The new game is built inside `src/quest/` (reusing the engine), not as a parallel app. Engine and art foundations land first while the old 6-chapter content keeps working (old content is minimally adapted when types change). The Ch1 content issue (#21) deletes the old story content and ships Ch1. From then on, the last implemented chapter's exit leads to a 「未完待續」 event (key `wip.toBeContinued`), moved forward by each chapter issue and removed by the ending issue (#50).
**Why.** Every merge auto-deploys; the public site must never be broken, and incremental chapters are reviewable.

### D-12 · 2026-10-18 · Old saves are discarded with a friendly message
**Decision.** The save format changes (new heroes, maps, items, `coins`). Instead of migrating, the save key moves to `baokaka.quest.v2` (with a `version: 2` field). If an old `baokaka.quest` record exists, the title screen shows a one-time friendly notice (zh-Hant, e.g. 「冒險重新開始囉！舊的存檔是上一個故事的，已經收進回憶裡了。」) and the old key is removed. Find/sudoku keys are removed too. Any future incompatible change bumps the version the same way.
**Why.** A migration from a different story is meaningless; a silent reset would confuse returning players.
**Consequences.** Issue #3.

### D-13 · 2026-10-18 · Routes
**Decision.** The app has one game. `#/` (and any unknown hash) shows the RPG title screen. `#/quest` keeps working as an alias (old shared links). `#/find` and `#/sudoku` redirect to `#/`. A dev-only `#/artlab` route hosts the art lab (issue #4). No router library.

### D-14 · 2026-10-18 · Placeholder sprites during content work
**Decision.** Chapter content issues come before chapter art issues. Content may register new `SpriteName`s backed by a shared, clearly labelled placeholder drawing (from issue #11). `validate.ts` reports placeholders as warnings (not errors) and the final QA issue (#58) requires zero placeholders.
**Why.** Content and art can be reviewed separately and the game stays playable between them.

### D-15 · 2026-10-18 · Chapter cards accept labels
**Decision.** The script uses `[chapter 尾聲｜度晬｜05:30]` and `[chapter 番外｜象山看日出｜05:30]`. The `chapter` step gets `n: number` plus an optional `label?: string` (shown instead of 「第 n 章」); `run.chapter` only tracks numeric chapters.

### D-16 · 2026-10-18 · Known doc inconsistencies and how to resolve them
Resolved by the planner; issues repeat the relevant ones.
- **Chapter clock.** The chapter headings in the bible are authoritative: Ch3 is **01:10** (the script's `[chapter 3｜…｜02:00]` and the notation example are typos). Times: 00:00, 00:40, 01:10, 01:35, 02:00, 02:25, 02:50, 03:15, 03:40, 04:05, 04:25, 04:45, 05:00, 05:15, ending 05:30.
- **Levels.** The progression table in bible § 7 (*Level curve (cap 20)*) is authoritative over the per-chapter "Levels:" lines (those are from v1 numbering). The boss table's "Where (Ch)" column was corrected by the director on 2026-10-18 and now matches the chapters.
- **Map clock vs chapter card.** The chapter card shows the chapter time above. Each map's sky/grade time follows the art-direction § 4.2 *Location table* (e.g. 大安 00:15, 貓空 03:55, 信義 05:10); sub-maps and ride cars use their chapter's time (art-direction § 3.2).
- **Stamps.** There are **14** stamps (`stamp_<map>` for daan, ntu, station, ximen, longshan, dadaocheng, shilin, airport, maokong, bitan, beitou, yangming, tamsui, tower); `allStamps` needs all 14. Mentions of "11" are stale.
- **`stickers` step.** Renamed `coins` (D-02). Negative amounts floor at 0.
- **Baokaka's 勇敢的第一步** is learned at Lv15 (skill table), not Lv12 (running-jokes table).

### D-17 · 2026-10-18 · Fonts are the only external runtime resource
**Decision.** Google Fonts (Chiron GoRound TC body, Noto Serif TC for names/titles only, Fredoka numerals) with `display=swap` and subsetting where possible; everything else is bundled. Exact families and weights follow the latest `art-direction.md`.

### D-18 · 2026-10-18 · Visual QA tooling uses Playwright as a dev dependency
**Decision.** Add `playwright` (or `@playwright/test`) and `pixelmatch`/`pngjs` as dev dependencies, using the preinstalled Chromium at `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` locally. Screenshots are attached to PRs. Baseline diffs run locally and are **never** part of the deploy workflow (keeps deploys fast and deterministic). The art direction (§ 8.6 *Visual QA*) asks for the check to run in CI for art PRs; that can be added later as a separate, non-blocking workflow once baselines are stable (after M3).

### D-19 · 2026-10-18 · Removing the mini-games: what went and how old links behave
**Decision.** (Issue #2.) A sprite is kept only if the RPG references it by name (`sprite: '…'` in content, `SPRITES.x`, `HERO_SPRITE`, the chest/toy-box sprites). Removed: `sock`, `spade`, `dandelion`, `ball`, `flask` (find targets), `cloud`, `sunDisc` (find/sudoku decor), and `fence`, `rug`, `wave` (decor sprites the RPG never drew: its `fence`/`rug` are terrain, its `wave` is a battle effect). `art/Scene.tsx` and the `Placement` type (find's scene layout) went too, and `sprites/targets.tsx` was renamed `sprites/items.tsx` because what remains are RPG items. Dead shared code that only the removed games used was deleted (13 icons, `rng`/`shuffle`, `Screen`'s `fixed` prop, `Button` size `xl`, the `touch` spacing token and the `ripple`/`breathe`/`no-scrollbar` CSS). `#/find` and `#/sudoku` are rewritten to `#/` with `history.replaceState` both on boot and on `hashchange`, so neither an old link nor an in-app hash edit leaves a dead history entry; the `artlab` route is left for issue #4. The title screen's 回遊戲選單 button is gone; the world screen's home button (which returns to the RPG title) keeps its label for now and is re-skinned with the rest of the UI in M2.
**Why.** The issue's acceptance criteria require no unreferenced art; keeping the leftovers would mislead art work in M2.
**Consequences.** If later content wants a cloud or wave decor sprite, it is drawn new in the option-D style anyway (art-direction), not restored.
