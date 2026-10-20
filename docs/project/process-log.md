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
- `validate.ts`: `validateDerived` (cycles, duplicates, `atLeast`), `validateQuests`, `validateFollowers`, tray/collection/foe-field checks; `progressWarnings()` lists 114 flags no event sets yet (all chapter content), printed once as a dev console warning.
- World screen: the escort walks one tile behind the last hero on the party's own path; after a map change it starts beside the party (`restingSpot`). A new map now always snaps the walk animation (it used to keep the old map's trail when the arrival tile was near the old position). Art lab fixture `world-follower` (park, a stand-in snail); baseline added, all others 0 px. Screenshots in `docs/screenshots/7/`.
- Tests: new `progress.test.ts` (all-of, atLeast, chained, idempotence, bestiaryAll, addFlags/recordFoes, questStatus states, tray, collections, validators, warnings, `activeFollower`, `restingSpot`), reducer tests for victory/flee/defeat recording, derived flags after victories, chests and flag steps, save v4 round-trip and strict `seenFoes`. 224 tests. The sim is unchanged.
- Decisions in D-24 (the `…Any` flags, `lfAll` seeded early, what each collection stores, the escort's placement).
- Follow-ups for later issues are in D-24's consequences (chapter DERIVED/FOLLOWERS entries, `calmed`/`home` per foe, `postGame` on `shushuBonus`).


### 2026-10-18 · Staff engineer · #8 Item catalogue v2 and hero-only equipment (PR #66)
- `ItemId`/`ITEMS` are the 36 items of bible § 6 (13 consumables, 23 pieces of equipment) in table order, which is also `ITEM_ORDER`. Blurbs come from the script, the bible, or a new short line (D-25). `STARTING_ITEMS = { teaEgg: 2 }`. Borrowed icons are listed in the `TEMP icons until #19` block.
- `price: 0` = gift. `validateItems()` replaces the "item is free" check, a shop stock may not hold a gift (or the same item twice), and `buy` refuses price 0. `Item.only` + `canWear()` limit the four signature pieces in the `equip` action and in saves.
- Old content is remapped by effect (cookie→teaEgg, bottle→pineappleCake, …, full list in D-25), and the four 「拿到 …」 lines that named old items were updated. `npm run sim` is unchanged within noise (careful 200, casual 198, reckless 119 of 200). Items nothing hands out yet are listed by `progressWarnings()`.
- Save v5 (`baokaka.quest.v5`); v4 is legacy. Item ids are checked with `hasOwnProperty`.
- Party sheet: signature gear shows a 「摩卡專用」 tag, and picking it greys out the other heroes with 「只有摩卡能戴」. Blurbs wrap to two lines in the bag and the shop, and hero picker buttons are 44 px. New art lab fixture `party-sheet-equip`. Baselines were updated for menu/shop/victory and added for the new fixture. Screenshots are in `docs/screenshots/8/`.
- Tests: new `items.test.ts` (the bible table, order, `canWear`, `validateItems`, gift-in-shop validator). `quest.test.ts` uses every `ItemUse` kind with new ids, tests signature gear on all four heroes, and checks a gift can't be bought. `save.test.ts` covers v4 legacy and `only` in saves. `content.test.ts` covers no gifts in shops and the unplaced-item warnings. 239 tests in all.
- Follow-ups: none new. #19 replaces the TEMP icons; #21+ place the items (clearing the warnings); #54 may rebalance prices.

### 2026-10-18 · Staff engineer · #9 月亮線 travel and the 路線圖 (PR #67)
- New `src/quest/engine/mrt.ts`: the 14 `STATIONS` rows of bible § 3.1 (maps as strings until their chapters land), `MRT_LINES` (real colours, stylised polylines), and helpers (`stationUnlocked`, `freshStations`, `rideMaps`/`rideable`, `currentStation`).
- Engine: `{ do: 'travel' }` step → `view: { screen: 'travel', fresh, note }`; actions `ride`, `closeTravel`, `setSkipRides`; `Run.rideTo`/`seenStations`; `Exit.to: '@rideTo'` resolved at walk time to the destination's new `GameMap.mrtArrival`; `Trigger.arrival` (fires only on arrival, for the car announcement); arrival triggers honour `once`; `settings` now lives in `QuestState`; the `ending` step also sets a `cleared` flag. Save v6. `substitute()` fills `{station}`/`{stationTw}`/`{stationEn}`.
- `validate.ts`: `validateMrt` (station rows, `mrtArrival` on station maps, `@rideTo` only in cars, cars need a door + arrival-only entry trigger + no encounters, placeholder lines ≤ 40 with the longest names via `lineWidth`), `mrtArrival` layout checks in `validateMap` (now exported and table-driven), `mrtWarnings()` for the 14 stations whose maps don't exist yet.
- UI: `TravelScreen.tsx`, a navy 路線圖 that fills the panel at any phone shape (it measures itself). It has gold lit dots, a blinking ring with 寶咖咖 at "you are here", grey 「?」 locked dots, a 「叮！」 for new stations (static under reduced motion), a confirm sheet, the 直接到站 switch, and a line legend. The world screen's door chip in a car reads 「往 〈站名〉」. Art-lab fixture `travel-screen` (3 lit, 1 new, 10 locked); new baselines, all others 0 px. Screenshots in `docs/screenshots/9/`.
- Tests: `mrt.test.ts` (the table, dots on their lines, validators, `lineWidth`, the `cleared` flag), the fixture network `mrt.fixture.ts` driving the full loop in `quest.test.ts` (open, 「叮！」 once, locked, cancel, ride, announcement every ride, first-ride once, door → `mrtArrival`, skip rides, door without a ride), `text.test.ts` substitution in three languages, save v6. 268 tests. The old story is untouched, so the sim is unchanged.
- Follow-ups: see D-26 (#27 cars, chapter `mrtGate`/`mrtArrival`, #55 audio TODOs, #12/#56 restyle).

### 2026-10-18 · Staff engineer · #10 Art tokens v2 (PR #69)
- `src/art/palette.ts` rewritten on art direction § 3.1: `LINE`, `MATERIALS` (base/cel/deep/line ramps plus named extras such as the angel ring and pajama far limbs), `EYES`, `RIM`, `WORLD` (night-painted surfaces), `LIGHTS` (never graded), `UI`, `MRT`. The old sprite palette is the deprecated `C` (and `LEGACY_UI` for the old cream neutrals).
- Night clock (§ 3.2): `SKY_KEYS`, `skyAt()` (exact at keys, interpolated between, memoised, frozen), `gradeTokens()` (world, relative to 00:00) and `gradeCharacter()` (half grade), both pure and memoised. `GameMap.time` + `mapClock()` in the new engine `clock.ts` (`CHAPTER_CLOCK`, `LOCATION_CLOCK`); the validator rejects a malformed map time. Details in D-27.
- Fonts (§ 7.1): preconnect + one `css2` link (Chiron GoRound TC 700/900, Noto Serif TC 700/900, Fredoka 500/600/700, `display=swap`); Tailwind `font-body`/`font-serif`/`font-num` and the type scale. Measured: 144 KB gzip render-blocking stylesheet, 1.51 MB of woff2 slices on the title after first paint. Follow-up #68.
- `tailwind.config.ts` reads all colours from the palette (UI tokens, MRT lines, legacy colours), plus the § 7.9 motion tokens (`duration-instant…scene`, `ease-out`, `ease-pop`, CSS variables in `index.css`). The page, `theme-color` and manifest are navy; the old cream cards pin dark text and tonal controls use `tint-current`, so every screen stays readable (screenshots). `TravelScreen.tsx` and `mrt.ts` now use palette tokens.
- `src/art/contrast.ts` + `contrast.test.ts` (every UI text pair: body ≥ 7:1, muted ≥ 4.5:1; lowest is primary text on the deep gold stop at 7.06:1).
- Art lab: `#/artlab?section=tokens` with every token, the nine-time sky strip with the graded ground and half-graded materials under each, the fonts with their load state (`data-font-loaded`) and type scale, and the contrast table. The sprite lab's night swatch is the 01:00 sky (follow-up from #4). New visual target `artlab-tokens`; all baselines regenerated with the web fonts (two consecutive runs 0 px apart). Screenshots in `docs/screenshots/10/`.
- Tests: `palette.test.ts`, `contrast.test.ts`, `clock.test.ts`. 314 tests in all.
- Follow-ups: #68 (font payload); #12 drops the legacy Tailwind colours/sizes; #11/#13 use `gradeTokens(mapClock(map))`.


### 2026-10-18 · Staff engineer · #11 Sprite rig contract v4 (PR #70)
- `src/art/geom.ts`: `limb`, `blob`, `crs`, `crease`, `hand` (open/flat/grab/fist), `footie` (side/sole) and `star4` ported from `anime2.py` as pure path-data functions; `geom.test.ts` compares them with the Python output (`geom.reference.json`, generated once from the bk_stand joints) command for command within 0.01. `compactPath()` writes 0.1u relative path data for the DOM (round-trip tested).
- `Fig.tsx`: the two-pass renderer over one data array of (nestable) rig/depth groups, with the § 2.4 clip + offset cel, `deep`/`extra`/rim (`var(--rim)`) layers and LOD gating; `SpriteSvg` (root, LOD context, facing mirror, state classes, gait), `SkeletonOverlay`. `defs.tsx` `<ArtDefs/>` (iris brown/cat, blush, contact, bloom) mounted once in `App`. `useSvgIds`, `lod.ts`, `rig.css` (breathe, blink, attack 120/90/60/220, hurt + 2-frame flash, ko, victory hop, crawl and cat gaits, reduced motion).
- `sprite.ts` is the v4 contract (`SpriteProps`, `defineSprite`, budgets); `SPRITES` accepts new-style and legacy components; every call site passes `lod`. Legacy sprites now take their ids from `useSvgIds`.
- `src/art/demo/RigDemo.tsx` (測試寶寶): the anatomy sheet's standing pose with the reference head (iris gradient, rays, speculars, lash, blush, angel ring, three-clump map fringe), three expressions. Portrait 205 elements / 18.3 KB, battle 193, map 168.
- `placeholder.tsx` (`registerPlaceholder`, four footprints), `spriteWarnings()` in `validate.ts`, printed in dev.
- `sprites.lint.test.ts`: every sprite (75 legacy + demo + 4 placeholders) twice in one document at each LOD with `<ArtDefs/>` → no duplicate ids, no dangling refs; no filter/text/image/foreignObject; budgets for typed sprites; no raw hex under `src/art` outside `palette.ts` (empty allow-list that may only shrink); demo LOD and rig-naming checks.
- Art lab `section=rig` (LODs with `skeleton=1`, parchment, silhouettes, expressions, states, shared defs, placeholders, budget table); sprite cards draw new-style sprites at the LOD for their size. New visual target `artlab-rig`; `artlab-tokens` (new ramps) and `artlab-sprites-night` (header link) baselines regenerated, all other targets 0 px. Screenshots in `docs/screenshots/11/`.
- Verified: `npm test` (430 tests), `npm run build`, `npm run visual` twice (0 px), Chrome check that the shared gradients resolve and nested rig origins (blink, head turn) pivot correctly.
- Decisions in D-28. Follow-ups: none new beyond D-28's consequences (#16–#18 author on `Fig`, the reduced-motion toggle sets `.reduce-motion`, #58 errors on placeholders).

### 2026-10-18 · Staff engineer · #12 UI kit v2 (PR #71)
- New kit in `src/components/` (dumb, no engine imports): `kit.css` (panels, glass, buttons with the 80 ms press, command buttons, switches, bars, dialogue, chapter card, transitions, reduced motion), `Panel`, `Button`/`IconButton`/`CommandButton`/`Switch`, `Chip`, `Bars` (lag band, heal sparkle, low/critical with the ❗ mark), `Sheet`/`ListRow`, `DialogueBox` (bust + backlight, slanted name plate, 30 ms typing with ghosted text, `【詞】` key terms, page dots), `ChapterCard` (sky by clock, twinkling stars, self-drawing skyline, `DepartureClock` with a 5×7 dot-matrix font and split-flap flip), `CommandPanel`/`PartyCard`, `typing.ts`, `motion.tsx`.
- Applied to the title (functional restyle, new name), world HUD (glass plate with place and clock, round home/menu buttons, door chips, map over its hour's sky, iris on map change, party strip panel), dialogue/choice/inn (`TalkBox`), chapter card, battle command panel (2×2 commands, party cards, 逃跑 link; the stage keeps its layout for #14), shop, victory, defeat, ending, party sheet (three tabs, 設定 new), 路線圖 and the orientation guard. Legacy Tailwind colours, sizes and helpers are removed.
- Engine: `Line.expr`, chapter `next`, `SPEAKERS` roles/backlights, `settings.reducedMotion` + `setReducedMotion` (v6 saves without it still load); validator checks markup, `expr`, `next`, speakers.
- Art lab: `section=ui` (every component and state, a half-typed dialogue box) and fixtures `dialogue` (摩卡 with a key term and dots), `dialogue-npc`, `chapter-card` (00:00 with 下一站), `chapter-card-0515`, `chapter-card-reduced`, `menu-settings`. New visual target `artlab-ui`; all baselines regenerated (two runs, 0 px apart). Screenshots in `docs/screenshots/12/`.
- Tests: `kit.test.ts` (`typedChars`/`typingDuration`, markup, `splitTyped`, HP states, page dots, dot font), `Dialogue.test.ts`, chapter-card contrast at every clock, new `TEXT_PAIRS`, validator/engine tests in `steps.test.ts`, settings in `quest.test.ts`/`save.test.ts`, fixtures. 489 tests. New `npm run check:ui` (Playwright): box height identical half typed vs typed, every target ≥ 44 px and commands 70 px on every fixture at both viewports, nothing looping/flipping/drawing under the OS setting or the toggle — all pass.
- Decisions in D-29. Follow-ups: #14 (stage around the new panel), #19 (tab content), #56 (title art); content can now use `【詞】`, `expr` and `next`.


### 2026-10-18 · Staff engineer · #13 Iso map renderer v2 (PR #73)
- Engine: `Terrain` is now 28 night `Material`s + `door`/`wall`/`fence`/`void` + the old names, aliased by `TERRAIN_ALIAS` until #21 (iso.ts keeps only walkability and heights). `GameMap.lights` (lamp, window, lantern, neon, screen, moon; optional colour), `neon`, `ambient`, `interior`. Standing lights (lamp, lantern, neon) are solid on their tile. `validate.ts`: neon only on `neon` maps, lights in the grid, `#RRGGBB` colours, standing lights on a whole walkable tile, ≤ 24 lights, ambient ≤ 6 elements, no repeats, ripples need water.
- Art: `src/art/tiles/` (`terrain.ts` material table with seeded variants and 17 mark patterns, `ground.ts` pure geometry, `Ground.tsx` one memoised SVG: `<symbol>`/`<use>` tiles, lit edges, kerbs, water banks, merged wall runs with camera-side walls cut to a kerb, fence railings, the diorama skirt), `src/art/sky/SkyLayer.tsx` (gradient, stars, moon/sun by time, clouds lit from below, skyline with lit windows, bokeh, floor of night, 0.1/0.2/0.35 parallax, 6 blurred elements, interior room), `src/art/lights/` (specs, fixtures, one `screen`-blended layer with blooms, pools, lamp cones, wet streaks and door glows), `src/art/fx/Ambient.tsx` (registry: leaves, ripples, fireflies; reduced motion stops them), `src/art/scene.tsx` (`sceneRim`, `SceneClock`, `useCharacterTokens`). Palette: `GLOW`, `TILES`, `STRUCTURE`, `FIXTURE`, `SKY_ART`, `gradeTiles()`.
- `IsoMap`: camera and actors move by `transform`; decor sorts by its front-most tile; party/NPCs ≈ 0.9 tile wide; legacy sprites get a contact shadow; `--rim` from the clock (pink on neon maps); gold diamond tap marker (1.2 s pulse, static under reduced motion). `WorldScreen` draws `SkyLayer` behind the map and a vignette with corner bokeh; `PartyPanel` and actor sprite elements are memoised so walking re-renders less.
- Old maps got `interior`, lights and ambient so they show the system. Screenshots in `docs/screenshots/13/` (home, park, the test map at three times).
- Art lab `section=map` and visual target `artlab-map`; baselines regenerated (world, dialogue, menu-settings and the art lab pages whose header gained a link), two runs 0 px apart. `npm run check:ui` passes.
- Perf (`--perf`, dev build, 4× throttle): ground = 1 SVG, 0 mutations while walking; DOM 1,059 (home) / 1,598 (park); main-thread ≈ 18–23 ms per frame, down from ≈ 31 ms on main with the same measurement. The § 8.5 12 ms target isn't met on the dev build; noted on #57, which measures production and makes it a gate.
- Tests: `terrain.test.ts` (every Terrain covered, aliases, ramps and grading, deterministic variants, no checkerboard except marble, mark budgets, ground geometry, merged runs, cut walls, kerbs/banks, single SVG), `lights.test.ts` (placement, colours, wet streaks, light box, screen blend, ambient cap and registry, sky changes and blur count, scene rim, no filters on moving things), `maplights.test.ts` (validator rules, old maps and test map valid). 523 tests.
- Decisions in D-30. Follow-ups: chapter art registers steam/lantern sway/mist/rain and draws landmarks as props; #57 production perf gate.

### 2026-10-18 · Staff engineer · #14 Battle stage v2 (PR #74)
- `src/art/backdrops/`: `Stage` (one static, memoised SVG per config and clock: the clock's sky or a room wall, far, floor with perspective joints, wet sheen and blurred reflection streaks, mid, light blooms/pools/posts, framers, bokeh, vignette; ≤ 8 blurred elements), `keys.ts` (`BACKDROP_CHAPTER`, `backdropFor`, `isBackdrop`; React-free for the validator), `index.ts` (`CHAPTER_CHUNKS` with `import('./ch01')`, `preloadBackdrop`, `useBackdrop`), `generic.tsx` (`generic` city park, `genericRoom` interior; main bundle, map clock), `ch01.tsx` (the `daan` template: 大安's band-shell lit from below with ribs, footlights and steps, 101 tiny on the horizon with ledge lights, a park tree line, banyans with aerial roots framing, a wet plaza reflecting the shell and a lamp, fireflies), `BossFrame.tsx` (boss valance / final proscenium). Palette: `STAGE` (+ `gradeStage`), `STAGE_LIGHT`, `FRAME`, `RIM.foe`.
- Engine: `GameMap.backdrop` (validated), `Foe.final` (must be a boss), `battleFrame()`. The old `park` map carries `daan` until #21. Old `art/backdrops.tsx` (daylight palettes) is gone.
- `BattleScreen` rebuilt on stage units (layout, sizes and the 布袋戲 edges follow the measured stage box): four heroes on staggered rows with the 輪到你 tag and a gradient gold ring, foes upper right with auras, mini HP bars and the intent preview, the slanted foe plate (ENEMY/頭目, ×count of standing foes), § 7.4 damage numbers with serif sub-lines, the calmed animation instead of a KO, a gold wash on victory, the log line at the stage foot. `CommandPanel tight` + `PartyCard layout="strip"` make the 2×2 party strip fit 346 px at 390×844 (short screens drop to 34 px heads). Victory's result card rises over 600 ms. `fx-hurt` no longer uses a filter.
- `QuestScreens`: the MRT-door map → battle transition (280 + 120 + 320 ms; none under reduced motion); `WorldScreen` preloads the map's backdrop chunk.
- Art lab: `section=stage` (visual target `artlab-stage`), fixtures `battle-4v3`, `battle-boss`, `battle-final` (frame override), `battle-375` (a fixture `phone` box). `npm run check:ui` gained the battle-stage checks (0 backdrop mutations over three turns, no filter on animating elements, frames on boss fights only). Baselines regenerated (battle fixtures and new targets; the art lab headers gained a link; tokens gained `STAGE`/`FRAME`). Screenshots in `docs/screenshots/14/`.
- Build: `dist/assets/ch01-*.js` 8.6 KB (3.1 KB gzip). The main JS bundle grew from 148.5 to 159.0 KB gzip (the generic stages, the frame, the new battle screen and doors), CSS from 11.1 to 12.4 KB gzip.
- Tests: `backdrops.test.ts` (keys ↔ chunks, fallbacks, on-demand loading, blur budget/no text/deterministic at three clocks, own-clock backdrops, frames without filters, scale and grading), `battleFrame` in `battle.test.ts`, backdrop validation in `maplights.test.ts`. 536 tests.
- Decisions in D-31. Follow-ups: chapter art issues add `chNN.tsx` configs; Ch14 tunes the final foe's place (the plate can cover its head on short phones); #15 builds skill FX in the stage's FX layer.

### 2026-10-18 · Staff engineer · #15 Battle VFX refresh (PR #75)
- Engine: `FX_KINDS` (blocks, cry, claw, feather, paw, heal, shield, typhoon, impact, sparkle, neon, water, steam, dizzy) replaces the 14 仙俠-era kinds; `FX_ACCENTS` (clap, stomp, comet, moon) as `Spell.fxAccent`, carried on the `act` event; `HEROES[hero].attackFx` for each plain 攻擊 (block, claw, feather, paw). The 16 skills follow the issue table; every foe move was remapped (no attack without an explicit `fx`; the fallback is `impact`). `validateFx` runs in `validateQuestContent`.
- Art: `src/art/fx/battleFx.ts` (timing constants from § 7.9 with the strike at `IMPACT_AT` = 210 ms, `planFx` with the 40-node budget and 6–10 seeded particles per target, wash and flash rules), `BattleFxArt.tsx` (the drawings: toy blocks tumbling in, sound arcs, three claw crescents, a fan of 藍鵲 tail feathers, a stamped bear paw with a ground ring, gold four-point stars, the magpie-bridge arch with perched magpies sized to the party, 咻咻's spiral and rain, a soft 「咚」 burst, gold glints, a neon zigzag, a splash crown, steam puffs, dizzy stars; accents; the gold glyph ring with each hero's emblem), `battleFx.css` (transform/opacity keyframes; resting style = impact frame; reduced motion = `fx-still` on shapes only). Palette `FX` (tokens page group).
- `BattleFx.tsx` plans from the step's events (the shield covers the standing party); BattleScreen passes `flash` (≤ 2 flashes a second, `fx-hurt-soft` without the blink), lunges follow the 490 ms profile, hurt/quake/damage numbers start at the strike, and damage numbers moved to their own layer above the FX.
- Art lab `section=fx` (every kind and accent frozen at impact with `still=1`, glyph rings, all-target casts, 「全部播放」 and tap-to-replay), fixture `battle-fx` (寶咖咖's 哇哇大哭 on three foes via the real engine), visual target `artlab-fx`; `still=1` also holds damage numbers at their peak. Baselines: new `artlab-fx`/`battle-fx`, `artlab-tokens` (FX group) and the art lab pages whose header gained the fx link.
- `npm run check:ui`: new Battle VFX checks — 39 nodes (planned 39) at the busiest moment of an all-target skill on three foes; under reduced motion no running animation in the battle changes `transform` or blinks, and the effects play only `fx-still`.
- Tests: `src/art/fx/battleFx.test.ts` (timing, budget for every kind × accent × 1–4 targets, particles, washes and flash gap, the CSS: transform/opacity only, every class has keyframes ≤ FX_NODE_MS, wash ≤ 0.3/200 ms, the reduced-motion block; rendered node counts, no filter/text, unique gradient ids), validator and skill-table tests in `content.test.ts`, engine FX tests in `battle.test.ts`. Vitest now processes `battleFx.css` so the test can read it raw. 558 tests.
- Build: main JS 164.1 KB gzip (+5.1), CSS 13.1 KB gzip (+0.7).
- Decisions in D-32. Follow-ups: chapter art issues may add one bespoke kind each (keep the budget and the impact-frame rule); option D rig sprites already get their hurt delayed to the impact (#16–#18).

### 2026-10-18 · Staff engineer · #16 Heroes I: 寶咖咖 and 摩卡貓 (PR #76)
- `src/art/characters/baokaka/` (`skeleton.ts`, `Head.tsx`, `Baokaka.tsx`) and `src/art/characters/mocha/` ported from `_gen/anime2.py` (`bk_sit`, `bk_crawl`, `bk_stand`, `mc_sit`, `mc_walk`) and `_gen/anime.py` (`head`, `eye`, `mocha_head`, `cat_eye`) onto `geom.ts`/`Fig`; shared helpers in `kit.tsx` (folds, hands, footies, soles, paws, star print, bear patch, toy block, contact shadow); `geom.ts` gained `rotatePoints`, `rings` and a `compactPath` cache.
- Poses: 寶咖咖 sit / crawl / stand + clap, cry, lie (KO), with throw and firstStep acted on sit/stand; 摩卡 sit / walk / pounce / loaf. Expressions 開心/大笑/淚汪汪/驚訝 and 平常/得意/開心/驚訝 (+ wail, sleep, hunt). 摩卡's tail moods; the 金鎖片 as `lock`. They replace the legacy `baokaka`/`mochaCat` sprites in `SPRITES`.
- Motion: `rig.css` action animations on the 490 ms profile, KO as a resting pose, the tail flick, an idle wobble when he stands (PR #77); the map walk is a two-frame flipbook toggled by `.rig-walking` (D-33). BattleScreen picks the pose with `actionPose`, plays the victory hop; victory/defeat/ending screens set states and faces. Backlights butter/tabby.
- Perf: the first version (animated rig groups) cost +40 % main-thread time while walking; after the flipbook, inline paths and flat limbs at the map LOD it is +4 % (23.96 → 24.90 ms, dev build, 4× throttle). Fig bug fixed: a part with `sil: false` was taken for a contour-only item.
- Art lab `section=heroes` (visual target `artlab-heroes`); baselines regenerated for every screen with the heroes (two runs, 0 px apart); screenshots and side-by-sides with the approved sheets in `docs/screenshots/16/`. `npm run check:ui` passes.
- Tests: `src/art/characters/heroes.test.ts` (budgets for every pose × expression × LOD, anatomy rules, actionPose, backlights, the flipbook CSS), sprite lint per drawing and the map flipbook shape. 578 tests.
- Follow-ups: the story ending should pass `lock`; #17/#18 reuse `kit.tsx` and add their action poses to `actionPose`; main JS bundle +12.8 KB gzip (consider lazy-loading character art with #57's perf gate).

### 2026-10-19 · Owner · Pivot: from the RPG to 《翻翻台北》 Pop-Up Taipei
- After #16 (heroes I) shipped, the owner judged the option-D character art poor ("蠻差的") and the game still too shaped by the old 仙劍-style RPG design, and stopped engineering: #17 was put on hold.
- A designer wrote three fresh concepts (`docs/design/concepts.md`, mocks in `docs/design/mocks/`); the owner chose concept A, 《翻翻台北》 Pop-Up Taipei, and the designer wrote the GDD (`docs/design/gdd.md` v1.0): rules, the deterministic sim + solver architecture, 65 pages, the zh-Hant script, milestones M0–M5 and success metrics.
- A character artist redrew 寶咖咖 and 摩卡 from the owner's real photos in an anime style (`docs/art/v2/`: sheets, likeness check, author-in-SVG → bake-to-WebP pipeline, 31 gameplay poses in `baked/poses.json`).
- An environment artist wrote the pop-up paper-craft art bible (`docs/art/popup/README.md`, proofs A–D, `src/kit.js`).
- Decisions D-34–D-38.

### 2026-10-19 · PM · New plan: epic #78, 63 issues, old issues closed
- Created epic [#78](https://github.com/sean1093/baokaka-adventure/issues/78) and issues #79–#141 from GDD §7 and the art bible's §10 build list: M0 core + solver + PageLab + kit port (#79–#92, #139), M1 vertical slice with affordances, bitmap pipeline, standees, art extras, bake script, UI shell, words, hints, stickers, photo/album, settings, audio, prologue + ch1 pages and art, routing switch, playtest and RPG deletion (#93–#111, #140, #141), M2–M4 engine features plus a pages issue and an art issue per chapter and the ending (#112–#135), M5 perf/a11y, solver tuning and launch (#136–#138). Each issue is self-contained (context, linked doc sections, scope, requirements, acceptance criteria, testing plan, dependencies, notes) and is a sub-issue of #78.
- Kept #68 (font payload), rewritten for the new game and moved to M5. Closed #17–#58 as not planned with a comment each; closed epic #1 as not planned (superseded), with a banner and comment.
- Rewrote `README.md` (§1, sources, architecture, conventions, definition of done; process unchanged except "roadmap order" instead of "lowest number") and `roadmap.md` (new milestones, ordered table, dependency graph; the RPG plan collapsed under *Superseded plan*).
- Next: #79 (scaffold), then the M0 order in `roadmap.md`.

### 2026-10-19 · Staff engineer · #79 Scaffold src/popup/, #/popup and the dev-only #/pagelab
- `src/popup/` with the GDD §3.5 folders (`core/`, `pages/`, `content/`, `game/`, `view/`, `dev/`, `workers/`), each with an `index.ts` comment listing what goes there; `PopupGame.tsx` is a placeholder (a cream page with 《翻翻台北》 / Pop-Up Taipei on the navy linen cover, 「開發中」 in gold) and `dev/PageLab.tsx` a dev-only placeholder.
- Routes: `parseRoute` returns `popup` and `pagelab` (with or without a trailing slash or `?params`). App serves `PopupGame` at `#/popup` in every build (lazy chunk, 0.75 KB gzip) and `PageLab` at `#/pagelab` in dev only (dropped from the production bundle; `#/pagelab` shows the RPG there). `#/` is unchanged. Main JS 176.93 → 177.12 KB gzip.
- Palette: `POPUP` group (cover, gold, page, ink, shadow from `kit.js`), `POPUP_TEXT_PAIRS` in `contrast.ts`, all ≥ 7:1 in `contrast.test.ts`.
- Tests: route cases for the new routes; `src/popup/core/boundary.test.ts` scans every non-test file in `core/` (imports only within core or `src/shared/random.ts`; no DOM globals, timers, wall clock or `Math.random`) and tests the checker itself on good and bad samples.
- Screenshots in `docs/screenshots/79/`. Decision D-39. No visual baseline changes (the art lab is untouched).
- Follow-ups: #139 extends `POPUP` and mirrors it into Tailwind; PopupGame becomes the real cover/screens from #97 on.

### 2026-10-19 · Staff engineer · #139 Port the pop-up art kit to src/popup/art (PR #144)
- `src/popup/art/`: kit.js as pure, seeded (via `shared/random.ts`), id-scoped SVG-string helpers taking `KitCtx { id, filters }`: `svg.ts` (ctx, refs, seeded), `defs.ts` (depth filters z0–z5, grain, mottle, deckle, torn, glows, blurs, the standee filter; foil, marigold, linen, ridges and every paper-stock gradient/pattern), `paper.ts` (depth, soft ellipses, grain, fibres, scallop band, skyline, pinholes, sparkle, washi, mountain/valley folds, linen cover), `touchables.ts` (seal, brad, pull-tab, wheel, flap, slider, paw, perch), `actors.ts` (standee, spring bubble, bead), `ui.ts` (HUD label, bottom bar, page block), `swatches.ts` (proof D rebuilt), `presets.ts` (default art for all 14 GDD part presets).
- Filters only when `ctx.filters` (PageLab, the bake); in game, depth/blur become flat outline copies and gradient blobs, grain and deckle are omitted (GDD §3.9). Registry `src/popup/view/art/registry.ts`: `partArt(key, preset)` falls back to preset art; `renderPart()` returns a self-contained fragment.
- Palette: `POPUP` grown to every kit colour (Tailwind `popup-*`), `POPUP_FOIL`, `POPUP_CHAPTER_CLOCK`; contrast: new text pairs (≥ 7:1, `inkSoft` darkened, `sealInk` for red text) and `POPUP_GRAPHIC_PAIRS` (≥ 3:1, the seal glyph). Decision D-40.
- PageLab `#/pagelab?section=kit`: TS swatch sheet, every preset idle with/without filters, and the kit.js proof D; visual target `kit-swatches` (baselines at both viewports; all other targets 0 px). Screenshots in `docs/screenshots/139/`.
- Tests: `src/popup/art/kit.test.ts` (snapshots for every helper with/without filters and every preset; determinism; no filter in game; depth-filter formula; scoped ids and resolving refs; marigold only on touchables; registry fallback; palette data; no raw hex in `src/popup`). 798 tests. Main bundle unchanged.
- Follow-ups: #80 should own the preset list (art imports the core type then); #96 bakes with `kitCtx(scope, { filters: true })`; #89 renders parts through `renderPart`; #140 adds the ghost hand, idle wiggle and real state visuals (proof D's state row is static here).

### 2026-10-19 · Staff engineer · #80 Core types, conditions and part presets (PR #145)
- `src/popup/core/types.ts`: every GDD §3.2 type (plus `LineKey`, `PartPreset`/`PART_PRESETS`, `PartInput`, `DefinePage`, `BabyMode`/`BABY_MODES`). Core now owns the preset list; `src/popup/art/presets.ts` re-exports it (the D-40 follow-up).
- `cond.ts`: `evalCond(def, state, cond)` for all ten variants incl. nested `all/any/not`, `holds` for optional conds, `partState` (parts, then pushables). `presets.ts`: `PRESETS` table (default states, default and allowed inputs, tap rule; documented in the file header), `compilePart`, `tapTarget`, `nextState`. `state.ts`: `initialState(def)`, `stableStringify`, `canonicalKey` (sorted keys; `refused`, `consumed`, `flags` sorted). `define.ts`: `definePage`, re-exported by `pages/`.
- Fixture `core/fixtures/c1p2.ts` = GDD §3.4 verbatim plus the `board` prop; it type-checks as a `PageDef`.
- GDD §3.2 tweaks (optional `states`/`initial`, crank/tappable via `input`, pushables in their own record) mirrored in the GDD and recorded in D-41.
- Tests: `cond.test.ts` (table-driven, one row per variant and nesting), `presets.test.ts` (every preset), `state.test.ts`, `types.test.ts`. 100 % statements/branches/functions on `src/popup/core` (checked with `npm i --no-save @vitest/coverage-v8@2.1.9 && npx vitest run src/popup/core --coverage --coverage.include='src/popup/core/**'`; not added as a dependency). 903 tests.
- Follow-ups: #86's lint should check `input ∈ PRESETS[preset].inputs`, listed states for count-based presets and `initial ∈ states`; #84 (step) owns locks, `stateWhen` and `Reaction.to`.

### 2026-10-19 · Staff engineer · #81 Walk graph: BFS, reach sets and tie-breaks (PR #146)
- `src/popup/core/graph.ts`: `nodePos` (attached nodes take their part's state position), `openEdges(def, state, walker)` (baby kinds by growth: crawl, +climb, +cruise, +walk; cat: jump, squeeze; `when` conditions; `oneWay`), `blockedNodes` (blocking creatures; nodes attached to a closed gate), `walkGraph(...)` → `WalkGraph` with `bfs` (shortest in edges, edge-order tie-break), `reachSet` (BFS order + steps) and `nearestReachableTo` (squared distance, then path length, then id). Exported from `core/index.ts`.
- Performance: topology compiled once per def (WeakMap) into CSR typed arrays; BFS uses stamped scratch buffers owned by the compiled page and allocates only the returned path. Micro-benchmark (skipped `it.skip` in `graph.test.ts`): ~340,000 walk-graph builds + corner-to-corner BFS per second on a 40-node page (target ≥ 200k).
- Gate blocking via `attach` and the precise tie-break rule in D-42; GDD § 2.2.3 gained the data mapping.
- Tests: `graph.test.ts` (toy graphs for every rule: kinds per growth and cat, conditional and one-way edges, blocked nodes by creature/gate and detours, start node not blocked, Mocha unblocked, tie-breaks by edge order incl. reversed edges and shared prefixes, nearest-reachable ordering, unknown ids; c1p2 in each train state). 100 % coverage on `src/popup/core`. 962 tests.
- Follow-ups: #82 builds one `WalkGraph` per tick and reads `reachSet` for candidate path lengths; #83 adds perch-level rules (wet/steam/glass/blockedWhen) on top of the cat walker; #86's lint should check that gate-attached nodes have the same position in both states and that edge kinds are valid.

### 2026-10-19 · Staff engineer · #82 Baokaka's decision loop (PR #147)
- `src/popup/core/baby.ts`: `candidates` (visibleWhen, activeWhen, not consumed, not refused; Mocha as the implicit candidate `'mocha'` at the perch's `reachNode` while settled and not in a box), `attractorNode` (`nodeBy`, `heldBy`, `followsPushable`), `rankCandidates` / `selectTarget` / `compareRanked` (priority → reachable first → path length → squared distance → id), `keepRefusals`, and `babyTick(def, state, { growth, reachHigh, prev })` = § 3.3 phases 5–6: one edge toward a reachable target, toward the nearest reachable node for an unreachable one, then `reaching` (facing it, 「要！要！」 every 4 ticks); arrival effects grab (consumed; goal → `done`), eat (consumed), cuddle, watch; `looking` ×2 → `crying` with a `cry` event (radius 220) every tick; silent comfort; decoys never grabbed; `reachHigh` behind `REACH_HIGH_ENABLED` (off) and growth ≥ 2. One `WalkGraph` and one reach set per tick.
- `src/popup/core/events.ts` (first cut, #84 extends): `SimEvent`, `Bark`, `BARK_TEXT`. `SimState.baby` gained `target` and `reachTicks` (mirrored in GDD § 3.2; `initialState` sets null/0).
- Decisions in D-43 (GDD § 2.2.7 points to it).
- Tests: `baby.test.ts` — a 43-row table (one row per rule of § 2.2.1–2.2.5 and § 2.5 reachHigh: tiny page → expected target, mode, node, facing, events), arrival/refusal/bark-cadence/ranking tests, and a 50-tick scripted scenario on the c1p2 fixture run twice and snapshotted (`__snapshots__/baby.test.ts.snap`). 100 % statements/branches/functions/lines on `src/popup/core`. 1031 tests.
- Follow-ups: #84 calls `babyTick` after resolving `saying`, passes `prev`, implements 不要！ (push `baby.target` into `refused`), `drop` for `heldBy`, and `ride`; #85 may leave `reachTicks`/`target` out of its key; #86 lint: visible ties, the reserved `'mocha'` id; #127 flips `REACH_HIGH_ENABLED`.

### 2026-10-19 · Staff engineer · #83 Mocha: perch pathing, arrival actions, pet and cat rules
- `src/popup/core/mocha.ts`: `mochaCommand` (§ 3.3 phase 1 `mocha`: commit the shortest cat path, or `mochaNope` / `mochaPuff` with no state change), `mochaPet` (phase 1 `pet`: repeat press, `set`, push), `mochaTick(def, state, input)` (phase 3: falling pushables land with `land` + `landSets`, a finished stare pushes, then `catLeave` + button release, 2 edges per tick, `catArrive` + `onPart`/`set`/`fleesFromCat`/`push`), and helpers `catPath`, `perchRefusal` (glass; wet/steam while `blockedWhen`; `blockedWhen`), `perchHidesMocha` (`hidesMocha` or a `box` node), `mochaAttractorNode` (C5, now used by `baby.ts`), `catLocked` (C4), `buttonWeighed`, `mochaSettled`, `mochaNode`.
- `SimState.mocha` gained `to` and `stare` (GDD § 3.2 mirrored); `SimEvent` gained `state` (for `partEnter`) and the UI events `mochaNope`, `mochaPuff`, `mochaStare`; the cat `Walker` in `graph.ts` gained `avoid` (refused perches are not crossed). GDD § 2.3 gained an engineers' note; decisions in D-44.
- Tests: `mocha.test.ts` — a 36-row table (every cat rule C1–C9 and every arrival action, incl. pet), the C3 beat tick by tick (stare is its own tick; one-way per attempt; only a reaction resets it; landSets as weight), C4 locks and releases, C5/C9 visibility, pathing (committed paths, redirects, zero-edge trips), c1p2's pigeon, and the GDD 0-3 (push the bead) and 1-5 (button in a lift; pet re-presses while riding; hopping out releases) shapes, plus a determinism snapshot. 100 % statements/branches/functions/lines on `src/popup/core`. 1100 tests.
- Follow-ups (for #84 / #86, in D-44): cascade Mocha's events after phase 3; refuse `set` on `catLocked` parts; `buttonWeighed` when Baokaka steps off a button; lint perch-node uniqueness and perch references.

### 2026-10-19 · Staff engineer · #84 The tick: step(), cascade, creatures, words core, rides (PR #149)
- `src/popup/core/step.ts`: `step(def, state, input)` runs GDD § 3.3's seven phases — input (`set` with locks and the stop-by-stop `jam`, `tap`, `mocha`/`pet`, `say`, `floor` stub), the FIFO `cascade` (≤ 32 events, then `CascadeOverflowError` naming the page and looping parts; one reaction per part/creature per event, judged on the state before it; `partEnter` → `emit`; radii from the event origin), Mocha + his mini-cascade, Baokaka (say tick: `saying`, the word's event or 不要！; else `babyTick` with `prev`, his weight on buttons, his events' cascade), `ride`, then `learns` (`learn` UI event, learned growth) and capped predicate counters. Also `matchPredicate`, `predicateKey`, `pagePredicates`, `partLocked`, `stepGrowth`.
- `words.ts` (`WORD_EVENT`, `inReach` radius + exact 90° cone, `wordEvent`, `wordAvailable`, `sayNo`; 抱抱/一起 stubbed with skipped tests for #120/#128), `creatures.ts` (positions, `moveCreature` with `drop` into the new `SimState.dropped`, the winged `skyPosition`), `replay.ts` (`replay(def, steps)`, `toInput`, settle/goal caps), `events.ts` now the single list (`EVENT_TYPES`, `UI_EVENT_TYPES` incl. `jam`, `locked`, `learn`; `EVENT_RADIUS`). `ReactionOn` (`id`/`state` filters) and `SimState.dropped` mirrored in GDD § 3.2; engineers' notes in § 2.4 and § 3.3; decisions in D-45. `presets.ts` gained `reactionTarget`, `state.ts` `withPartState`; `baby.ts`'s `attractorNode` reads drops.
- Fixtures: `fixtures/c1p3.ts` (1-3 fare gates: push → reader `emit` beep → gate A, learn 嗶！, say 嗶！ → gate B + robot) and `fixtures/c0p4.ts` (0-4: hide Mocha, look, cry opens the door, open the curtain), plus `fixtures/toy.ts` builders.
- Tests: `step.test.ts` (phase order incl. "a cry opens the gate at the end of its tick, he walks through on the next", set/tap/locks/jams, done, weight, rides, learning, counters, and event-log snapshots of three scenarios — 1-2 shuttle + solve, 1-3, 0-4 — run twice), `events.test.ts`, `creatures.test.ts`, `words.test.ts` (radius/cone tables per word and every word through `step`), `replay.test.ts` (the § 3.4 page replays to `done`). 100 % statements/branches/functions/lines on `src/popup/core`. 1250 tests.
- Follow-ups (in D-45): #85 uses `step`, `wordAvailable` and the counters; #86 lints reaction targets, `drop` ownership, cascade loops and winged sky positions; #89 reads `jam`/`locked`/`ride`/`learn`/`saying`; #120 抱抱 + carrier, #128 一起 + `floor` + `lonely`.

### 2026-10-19 · Staff engineer · #85 Solver: BFS over step(), par, dead ends, reachability, nextAction (PR #150)
- `src/popup/core/solver.ts`: `solve(def, from?, { cap = 2,000,000, timeMs, clock, stopAtGoal })` → `solvable`, `complete`/`stop`, `par` (0-1 BFS: waits cost 0), a shortest `solution`, `deadEnds` (first 20, fewest moves first, with input paths and rebuilt states) and `deadEndCount` (reverse BFS on the explored graph), `trivial` (par 0), `mischiefReachable`/`tudigongReachable` (from states that can still reach the goal), `statesExplored`, `edges`, `ms`, `error` (a `CascadeOverflowError` is reported, not thrown) and `nextAction(state)` (fewest moves, then fewest ticks, by a lazy reverse Dijkstra; unexplored states get a fresh solve). Also `candidateInputs` (GDD § 3.7's list; taps on tabs/sliders/wheels too), `solverKey` (compact, no `tick`/`reachTicks`, compile-time exhaustiveness check), `firesMischief`, `tudigongVisible`, `toSolutionSteps`. `words.ts` gained `WORDS`; `step.ts` memoises `predicateKey` per predicate (it was stringifying every tick).
- Storage: `Map<string, number>` + growable `Int32Array`s for moves, parents, parent inputs, edge ranges and edges (input ids into a small table). Decisions in D-46; GDD § 3.7 gained an engineers' note.
- Fixtures `core/fixtures/solver.ts`: a 3-node page, a jam page, a dead-end page (two pushables; the rock first jams the gate for good), a trivial page, an unsolvable page and a reaction-loop page.
- Results: c1p2 solvable, par 2, 3,429 states, no dead ends, not trivial, 淘氣 and 土地公 reachable, ≈ 0.35–0.55 s; c1p3 par 2, 61 states; c0p4 par 2, 898 states, ≈ 0.1 s. Throughput ≈ 7,000 states/s (≈ 145 µs per state, ≈ 10 `step` calls each), so the 60 s CI budget for 65 pages is ≈ 6,000 states per page. Stress page (c1p2 + four 3-state props): 268,143 states, 2.65 M edges, 39 s, 392 MB peak RSS (≈ 150 MB of it Node/vite-node), ≈ 0.9 KB/state at peak → 2 M states ≈ 2 GB. No M1 page exists yet; #87 should re-measure on 1-2 and the largest M1 page.
- Tests: `solver.test.ts` (toy pages; the dead-end page's dead ends equal exactly the reachable "rock pushed, gate closed" states from an independent BFS; c1p2 per the acceptance criteria; `nextAction` on every state of the solver's and the authored solution is a valid first step of a shortest solution; property test: 200 seeded random reachable c1p2 states follow `nextAction` to done in par moves; options cap/time/stopAtGoal/from-state; `candidateInputs`; `solverKey` equivalence with `canonicalKey` and soundness of dropping the bark beat). 100 % statements/branches/functions/lines on `solver.ts`. 1286 tests.
- Found: with 不要！ available and a single attractor, refusing it soft-locks the page (he cries forever). Correct per GDD § 2.4, and the solver flags it; noted on #116 for chapter 3's pages.
- Follow-ups: #87 asserts the solver per page; #88 prints the report; #100 calls `solve(def, current, { cap: 200_000, timeMs: 300, clock, stopAtGoal: true })`; #137 if pages outgrow ≈ 6k states (speed up `step`).

### 2026-10-19 · Staff engineer · #86 Page lint: all GDD § 3.6 rules (PR #151)
- `src/popup/core/lint.ts`: `lintPage(def, script?) → { errors, warnings }`, each issue `{ code, severity, page, ids, message }` with a stable `Lnn-name` code (38 codes, table in the file header): rules 1–12 as errors (ids and references incl. enum values, kinds, `drop` ownership, shared perch nodes, the reserved `'mocha'` id and winged sky positions; part states and creature positions wherever named; compiled states, allowed inputs, missing states, pushable states, stop counts; attach positions and fixed gate doorways; vanishing ground = off the 390 × 560 page or riding a pushable; no standing on pushable/carrier nodes; one-way pushables; the budget; hit size and overlap with circles; text in code points; goal/土地公/淘氣; certain reaction loops), and warnings 12 (possible reaction cycles), 13 (custom functions), 14 (visible tie in the initial state), 15 (lock read mid-event) and 16 (always-wet perch). Also `solutionPushables`, `hitOverlap`/`hitOverlapArea`, `textLength`, `PAGE_SIZE`, `LINT_BUDGET`. Exported from `core/index.ts`.
- Every follow-up left on #86 by #80, #81, #82, #83 and #84 is a check. Readings in D-47; GDD § 3.6 gained warnings 14–16 and an engineers' note.
- Tests: `lint.test.ts` — 96 negative fixtures (edits of the c1p2/c1p3 fixtures), each asserting exactly its codes, plus a check that every documented code has one; c1p2, c1p3 and c0p4 lint clean; the solver's reaction-loop page is a certain loop; radius-limited triggers aren't cycles; message format; never throws on broken data; ≈ 0.1 ms per lint of c1p2 (asserted < 5 ms); overlap geometry (rectangles, circles, the lens area). 100 % statements/branches/functions/lines on `src/popup/core`. 1409 tests.
- Follow-ups: #87's `pages.test.ts` asserts `lintPage(def, SCRIPT).errors` is empty per page and runs the solver for rules 7 and 12; #91 shows lint codes in PageLab; new page fields need lint checks.

### 2026-10-19 · Staff engineer · #87 Page registry and the first pages 0-1 and 1-2 (PR #152)
- `src/popup/pages/index.ts`: the ordered registry — `PAGES`, `pageById`, `nextPage` (across chapters), `chapterOf`, built by `buildRegistry` (rejects duplicate ids and out-of-order pages) which fills in `words` (learned on earlier pages) and `baby.growth` (highest learned on earlier pages) from the `learns` fields; explicit values win. Prologue = chapter 0.
- Pages: `pages/c0/p1.ts` 「嬰兒床」 (crib-rail tab opens the pillow slope; mobile prop for the 淘氣; no Mocha; 土地公 always visible) and `pages/c1/p2.ts` 「月台的縫」 (§ 3.4 data + the `board` prop, states `times`/`flip` per § 4.3). Placeholder art keys.
- `content/script.ts`: `SCRIPT`, an empty `LineTable` until #102.
- `pages/pages.test.ts`: per registered page — lint errors empty (warnings printed), solution replays to `done`, complete solve with solvable / no dead ends / no cascade overflow / not trivial (unless `allowTrivial`) / 淘氣 and 土地公 reachable, par band as a warning; summed solver time < 60 s. Failures print a report table (page, diff, par, states, dead, ms, lint). `pages/index.test.ts`: registry order, ids, lookups, `nextPage` across chapters, words/growth defaults on a synthetic 12-page registry, error cases; 0-1 par 1 via the rail, 1-2 par 2, 1-2 equals the engine fixture apart from the board.
- Re-measured (asked by #85): 0-1 par 1, 22 states, ≈ 8 ms; 1-2 par 2, 182 states, ≈ 30 ms (the fixture's 3,429 states came from all words being available; the registry gives 1-2 `words: []`). Both pages' tests run in well under 1 s. Decision D-48; GDD § 3.5 gained an engineers' note. 1438 tests.
- Follow-ups: #88 prints the same table from `PAGES`; #91's page picker reads `PAGES`; #102 fills `SCRIPT`; #106/#107 add the other slice pages (one file + one registry line each).

### 2026-10-19 · Staff engineer · #88 `npm run solve`: solver report for all pages
- `scripts/solve-pages.ts` (`npm run solve`, `vite-node`): options `--page <id>`, `--chapter <n>`, `--json`, `--cap <n>`. Prints a table (id, title, difficulty, par with band check, states, ms, dead ends, trivial, 淘氣 ✓/✗, 土地公 ✓/✗, lint E/W, result), failure/warning lines, and the total runtime against the 60 s budget; exit 1 on any failure or over budget, 2 on usage errors. A page over its state cap stops the run at once, naming the page.
- Logic in `src/popup/pages/report.ts` (core public API only: `lintPage`, `replay`, `solve`, `toSolutionSteps`); `pages.test.ts` now shares its `PAR_BAND`, `CI_BUDGET_MS` and table, so CLI and test judge pages identically. Readings in D-49; handbook § 6 *Solver* documents the command.
- Run: c0p1 par 1, 22 states, ≈ 4 ms; c1p2 par 2, 182 states, ≈ 25 ms; total 0.04 s of 60 s; exit 0.
- Tests: `report.test.ts` (judge per failure kind, cap-only reporting, allowTrivial, lint vs warnings, table snapshot and alignment with CJK titles, details, summary/budget, exit status, argument parsing and filters, display width, the registered pages green, a tiny cap, a broken solution). 1482 tests.
- Follow-ups: #91 can reuse `reportPage` for the PageLab solver badges.

### 2026-10-19 · Staff engineer · #89 PageView: book frame, layered renderer, part views, interpolation, session (PR #154)
- **`src/popup/view/`.**
  - `PageView.tsx` (layers per `layers.ts`, a pure function of `(def, prev, state, ms)`) and `PagePlayer.tsx` (the cover, book block, page, and the kit HUD/bottom bar in their slots).
  - `geometry.ts` (0.91 book scale, floor perspective on art only), `interp.ts` (actor lerp, the 250 ms part tween with 6 % overshoot and snap squash, rides) and `stage.ts` (ledges, ramps, rails, perch furniture and carriages from the walk graph; the foreground card slot).
  - `parts/*View.tsx` for every preset (transforms only, no filters), `actors/` (Baby, Mocha, Creature, Bubble stand-in standees), `art/placeholders.ts` (city night and home stages from the kit, the `vFold` crease helper, the gutter AO) and `art/registry.ts` (fallbacks logged once in dev).
- **`src/popup/game/session.ts`:**
  - The tick clock (0.75/0.5/0.33 s), pause by reason with a 150 ms resume grace, and 4× fast-forward on walks of more than 4 edges.
  - Queued inputs, one per tick.
- **Routes.** `#/popup?page=c0p1|c1p2` plays a page. Dev parameters: `tick`, `paused`, `speed`, `demo=1` (plays the authored solution).
- **Visual QA.** Visual targets `popup-c0p1` and `popup-c1p2` with baselines. Screenshots are in `docs/screenshots/89/`.
- **Kit.** `pullTab({ sealed })`. `depth()` single-element copies are one node each (`kit-swatches` unchanged, 0 px).
- **Tests.** Session, interpolation, geometry (hit areas ≥ 48 px at 390), stage, registry, and the render test: layers, no filters, animated nodes ≤ 150; 1-2 ≤ 120 in its worst frame. Decision D-50.
- **Roadmap.** Fixed #88's row to `done (#153)`.
- **Follow-ups.**
  - At 375 × 667 the book is 0.66 scale, so tab hit areas drop under 48 px (noted on #90).
  - #94/#95 swap the stand-ins for baked frames; #96 registers baked art; #97 makes the HUD and bar live; #98 animates the bubble.

### 2026-10-19 · Staff engineer · #90 Gestures: tap, drag, magnet, snap, debounce, locks, touch pauses the world (PR #155)
- **`src/popup/view/gestures.ts`** (pure, no DOM): `targetsOf` (parts by `hit`, perch paw prints, Mocha, Baokaka, the 土地公), `minHit` (grows every hit to 48 screen px after the book scale), `hitTest` / `magnet` (direct → grown → 32 px magnet, ties to the higher layer), `projectTrack`, `rubberBand`, `snapStop`, `rotaryDelta`, `rotaryStep`, `Debouncer`, `previewNodePos`, `settlePreview`, and `GestureTracker` (8 px threshold, drag capture, palm > 3 points, second finger ignored, locked → `nope` with no input, 600 ms hold-to-reveal, tap mapping).
- **`useGestures.ts`**: Pointer Events only on the whole screen, client px → page units through the book layout, pointer capture, the hold timer; `session.pause('finger')` / `resume('finger')`, queued inputs, the word ring stub (`pause('ring')`). A released drag holds its snapped stop until its tick, then glides to the landed state.
- **View**: tab/wheel/flap views take a fractional `preview`; the carriage and its riders follow it; `data-dragging` / `data-locked` + wobble, Mocha `data-glare`, Baokaka's 3° touch-watch tilt (`data-watch`), hold-to-reveal chalk outlines; the hit layer draws the grown shapes of every touchable; the page SVG carries `data-parts` and `data-done`. `PageSession.queued`.
- **375 × 667 (the #89 note):** resolved by growing hit areas after the scale (D-51); the R6 test covers every touchable, every solution frame, both viewports.
- **Verify:** `npm run check:play` (`scripts/play-check.mjs`) plays 0-1 and 1-2 to done with mouse and touch emulation at 390×844 and 375×667, and checks the world doesn't tick under a finger: 8/8 ok. Screenshots in `docs/screenshots/90/`. Visual targets unchanged (0 px). Decision D-51; GDD § 2.6 engineers' note; handbook § 5.
- **Tests:** `gestures.test.ts` (hit shapes, magnet and ties, 375 tap under the tab, targets, R6 at both viewports, drag maths, settle, debounce, tracker taps/drags/rotary/flap/palm/second finger/locks/hold/cancel), PageView gesture flags, session `queued`.
- **Follow-ups:** #140 draws the flag states; #99 replaces the ring stub; #101 listens for `tudigong` (the 1-2 土地公 is drawn behind the board art, so he is touchable but hidden when it flips); #95 head/glare frames; #92 adopts `check:play`.

### 2026-10-19 · Staff engineer · #91 PageLab at `#/pagelab` (PR #157)
- **`src/popup/dev/`.** `LabWorkspace.tsx` (page list with solver badges · page + overlays · panels), `Overlays.tsx` (nodes by height, edges by kind dashed when closed, perches + cat edges, attractors with rank/priority, hit areas data + grown, target line + path preview, Mocha's trip; edit handles for nodes and track ends), `useSolver.ts` + `solver.worker.ts` (solver off the main thread), and the pure parts: `labParams.ts` (URL), `labModel.ts` (stepper with a 20-tick event log, overlay data, edits, touchable count, art-key report, badges), `copyTs.ts` (「Copy TS」), `solverJob.ts`, `labPages.ts` (lab-only `c1p2-broken`). `PageLab.tsx` is now the shell (lab by default, `section=kit` unchanged). `registry.ts` gained `hasBackdropArt`/`hasCreatureArt`; `palette.ts` a dev-only `PAGELAB` group.
- **Controls:** reset, play/pause, +1 tick, speed, input palette (every legal input; queued while playing). **Solver panel:** from start or from here → par, states, ms, 淘氣/土地公, trivial, shortest solution with 「▶ play it」, dead ends (click to load). **Lint** live on every edit. **Readability:** greyscale, 25 % squint thumbnail, touchable count, art keys. **State:** `SimState` JSON + last 20 ticks.
- **Verified** in Chromium: 1-2 play-it reaches `done` at tick 6; the broken 1-2 reports 27 dead ends, #1 (`摩卡 → pillar`) loads with the train locked; dragging nodes/track ends updates lint (off-page R2 → `L05-vanishing-ground`) and Copy TS. No console errors. `dist/` has no PageLab chunk and no worker. Screenshots in `docs/screenshots/91/` (1440 wide and 390×844).
- **Visual QA:** `kit-swatches` baseline updated (the shared PageLab header is one row shorter); `popup-c0p1`/`popup-c1p2` unchanged (0 px).
- **Tests:** `labParams.test.ts`, `copyTs.test.ts` (incl. evaluating the output back to the data), `labModel.test.ts`, `solverJob.test.ts` (reports, dead ends load and stay dead, from-state, edited copies, errors). Decision D-52; GDD § 3.10 engineers' note; handbook § 5.
- **Follow-ups:** #92 adds `fixture=` screenshot targets to the lab; #100 may reuse `solverJob.ts`; #140's affordance looks will show in the readability views.

### 2026-10-19 · Staff engineer · #92 Visual QA for 翻翻台北: PageLab fixtures, screenshot targets, R5/R6 UI checks (PR #159)
- **Fixtures.** `src/popup/dev/fixtures.ts` holds `POPUP_FIXTURES`. Each fixture is a page id plus a step list, replayed through `core/step`, and pins its expected mode or event. There are three so far:
  - `c0p1-start`: idle in the crib;
  - `c1p2-reaching`: on the jammed train at the gap;
  - `c1p2-riding`: the train carries him back, a `ride` event.
- **The view.** `FixtureView.tsx` shows a fixture at `#/pagelab?fixture=<name>[&still=1]`: `PagePlayer` full screen with no lab chrome. `#/pagelab?section=fixtures` is the index the scripts read.
  - `PageSession` and `PagePlayer` gained a `prev` option: the page opens playing the last tick.
  - `PagePlayer` gained a `still` option: the clock is held, the frame is drawn at its tick's end, and `[data-still]` turns off every CSS animation and transition.
- **Visual check.** Every popup fixture is a target, at 390×844 and 375×667. The six new baselines are committed, and every existing target is unchanged.
- **UI check.** The new `scripts/popup-checks.mjs`, run by `npm run check:ui` (`--popup` runs it alone), checks:
  - R5 text size (20 px, or 24 px under `[data-text-size="big"]`);
  - R5 contrast of 7:1, against a screenshot taken with all text hidden, with 90 % pixel coverage;
  - R6 hit areas of 48×48, including `[data-hit]`;
  - only fades under reduced motion;
  - no flashing above 3 Hz;
  - plus a detector self-test.

  Lettering inside pictures (`data-art-text`, added to the station name plate, the board digit and the seal glyph) is skipped. Kit snapshot lengths were updated for the attribute.
- **Waivers.** Two waivers are printed on every run: the static HUD and bottom bar until #97, and the bubble's 「要！」 at 375×667 until #98.
- **Play check.** `check:play` fails when a registered page has no scenario. `npm run qa` runs the visual, UI and play checks (the #90 note).
- **Results.** `npm run visual` passes: everything ok, with the 6 new baselines. `npm run check:ui` passes: the RPG checks, then the popup checks, with 16 art runs skipped and the waivers listed. `check:play` passes 8/8, plus the page coverage check. Tests: 1642, plus `fixtures.test.ts` and the session `prev` test. The build has no fixture code; only `data-still` ships, in `PagePlayer`.
- **Screenshots.** `docs/screenshots/92/`.
- **Decision.** D-53. Handbook § 5 has a new subsection, and GDD § 3.10 an engineers' note.
- **Follow-ups.** Each is commented on its issue:
  - #97 removes the HUD waiver;
  - #98 removes the bubble waiver;
  - #104 sets `data-text-size="big"`;
  - #111 drops the art lab half of the fixture-name test.

### 2026-10-19 · Staff engineer · #140 Touchable affordance system: reserved marigold + lint, seals, grips, idle wiggle, hint visuals, locked/drag states (PR #160)
- **Reserved marigold.** `src/popup/art/color.ts` holds the CIE76 ΔE maths and the reference stops (the card's saturated body, D-54). A unit test pins that no palette colour but the two card stops sits within ΔE 12.
- **The lint.** `src/popup/view/affordance/lint.ts` reads drawn SVG: `A01-near-marigold` (decoration within ΔE < 12 outside a touchable or `data-affordance`), `A02`–`A05` (a touchable without its seal, grip, direction cue or marigold), `A06-hit-small` (own hit area < 48 px at the 390×844 book scale), `A07-touchable-count` (warning, pages 1–3). The kit now marks every cue (`data-seal`, `data-grip`, `data-cue`) and non-touchable marigold (`data-affordance`: perch paws, linked brads). It runs on every page × every solution state × both motion looks, on every kit preset, and live in a new PageLab panel. Negative fixtures: a taxi-yellow decoration, a `tabG` paint on a cut-out, a marigold prop, a stripped seal, a bare card, a small hit, a busy early page.
- **States.** Part views take a `look` (`view/affordance/look.ts`): idle wiggle runs (±2° tabs, ±4° wheels, a flap's corner lift, a prop's shake on tap), the drag's lift (5 units, ×1.04, a dropped shadow; the dragged part drawn last), the locked veil (35 %) plus paw badge, the reduced-motion double outline, 長輩模式 seals (25 → 31 units). `PageView` draws the done knot, the L1 halo (hugging the card, pulsing in opacity) and the L2 vellum ghost hand with the gesture's printed path and the linked thread (`Hints.tsx`, `hints.ts`). The flap's seal now stays upright outside the fold, and its kraft back keeps the marigold ear.
- **Wiggle scheduler.** `WiggleScheduler` (pure, seeded, fake-clock tested: 4 s ± 0.8 s, staggered so no two overlap) and `useIdleWiggle` (one `setTimeout` at a time; off in stills, under reduced motion and while a finger is down; locked parts skipped). Each wiggle is a one-shot CSS animation restarted by alternating two identical keyframe names.
- **Hit areas.** `PERCH_R` and `TUDIGONG_R` → 27 (≥ 48 px at 0.91). `PageView` marks grown hit shapes `data-hit-grown`; `check:ui` fails any at 390×844.
- **Fixtures.** `affordance-states` (a specimen sheet, every state side by side, drawn by the real part views), `c1p2-hold-reveal`, `c1p2-dragging`, `c1p2-reduced-motion`, `c0p1-hint-how`. Fixtures gained `show` (gesture and affordance flags), `look` (the still's motion look) and `sheet`. 10 new baselines; every existing target unchanged.
- **Results.** Tests 1689 (42 new in `affordance.test.ts`). `npm run visual`, `check:ui` (with the new 390×844 own-hit rule), `check:play` and `npm run solve` pass. Build OK.
- **Readability.** 0-1 and 1-2 pass the lint, the grey test (tabs found by seal, ridges and arrow) and the count (1-2: 2 parts + 1 perch = 3). In the 25 % squint the tab and both standees read, but the placeholder backdrops' lit windows and moon stay bright too: flagged on #108, whose art replaces them.
- **Screenshots.** `docs/screenshots/140/`.
- **Decision.** D-54. Bible § 4.2 and handbook § 5 have engineers' notes.
- **Follow-ups.** #100 drives `affordance.hint` (and Mocha looking at the target); #106 uses the L2 hand for the 0-1 tutorial; #108 calms the squint-bright backdrop lights and keeps its art lint-clean; 1-2's train hit area starts right of the tab card at `out` (data, for #108's layout pass).

### 2026-10-19 · Staff engineer · #93 Save format `popup.save.v1` (PR #161)
- **`src/popup/game/progress.ts`.** `SaveV1` exactly as GDD § 3.8 (plus `Settings`, `DEFAULT_SETTINGS` from § 2.11), `SAVE_KEY = 'popup.save.v1'`, `loadSave` / `saveNow` over `loadJson` / `saveJson` / `browserStorage`, the strict guard `isStoredSave`, the migration ladder `UPGRADES` / `migrateSave`, and reconciliation with the registry (removed pages dropped, `furthest` never behind the solved point, `current` always unlocked).
- **Rules (pure):** `completePage` (stickers from the attempt, best move count, linear unlock across chapters, resume after the replayed page), `earnSticker` (淘氣 / 土地公 mid-page), `keepPhoto`, `updateSettings` (volumes clamped), `openPage`, `resetSave` (keeps settings), `isUnlocked`, `isChapterUnlocked`, `ownedAbilities` (from the furthest point) and `pageAbilities` (designed words and growth; later words only with `laterWords`).
- **`ProgressStore`:** the live save for #97 (`get` / `subscribe`), which writes on every change (page complete, sticker, photo, settings, page open) and on `visibilitychange: hidden`; no-op changes write nothing.
- **Legacy:** `src/shared/legacy.ts` gained `RPG_SAVE_KEYS` (copied, not imported from `src/quest/`), `hadRpgSave` (plus a `baokaka.quest*` prefix scan when the storage lists keys) and `cleanupLegacyStorage(storage, { rpg: true })`; `retireRpgSave` + `RPG_FAREWELL` (「寶咖咖的新冒險開始了！」) are in `progress.ts`. Boot still keeps the RPG save; #109 switches it.
- **Size:** on disk each page record is packed (`'smt12'`). A complete game (65 pages, every sticker and best, 11 photos) is ≈ 1.7 KB, against ≈ 5.2 KB written literally. A test asserts < 4096 bytes.
- **Tests:** `progress.test.ts` (65 cases, all against a synthetic 65-page registry and a fake `StorageLike`): the key, round trip, the size, packing, 24 malformed shapes, bad JSON, a newer version, a `__proto__` key, the migration ladder, unlock rules, replays, stickers, photos, settings, reset, reconciliation, abilities, the store's triggers, no or throwing storage, and the RPG saves. `legacy.test.ts` gained the RPG detection and cleanup. Tests: 1758. The build passes. No UI change, so there are no screenshots or baselines.
- **Decision:** D-55. GDD § 3.8 has an engineers' note.
- **Follow-ups (commented on the issues):** #97 wires `ProgressStore` and maps speed 0/1/2; #101 calls `completePage` / `earnSticker`; #103 `keepPhoto`; #104 `updateSettings` / `reset`; #109 calls `retireRpgSave()` at boot; #135 adds the bonus-page unlock.

### 2026-10-19 · Staff engineer · #94 Character bitmap pipeline: baked standee frames in the build, loader, player, mirroring, anchors (PR #162)
- **`npm run sync:sprites`** (`scripts/sync-sprites.ts`, vite-node): reads `docs/art/v2/baked/poses.json` + `manifest.json`, renders every frame at DPR 2 and 3 in Chromium through the kit's `standeeFilter(id, { bake: true })` (border, cut line, stacked shadow, easel tab on standing poses), crops each sprite to one shared whole-pt box, encodes WebP with Pillow, measures the head (bubble anchor) and the footprint, bakes the shared floor ellipse, and writes `src/popup/assets/sprites/**` (152 files) plus the typed `src/popup/sprites/sprites.gen.ts`. Idempotent by a per-sprite source hash (a second run: `0 sprite(s) baked, 43 unchanged … unchanged`); stale files are removed.
- **`src/popup/sprites/`**: `config.ts` (the game's readings: lazy-load group, play mode, key frame, events, easel, `noMirror`, head/hand overrides), `manifest.ts` (the contract, `validateManifest`, `pickScale`, `spriteTransform` / `toPage` mirroring maths), `clock.ts` (frame timing, events, one shared rAF clock, a manual clock), `loader.ts` (Vite `?url` glob, `SpriteLoader` with `img.decode()`, `useFramesReady`, `useSpritesPreload` / `usePagePreload`, `pageSprites`, `payloadBytes`), `SpriteAnim.tsx` (one `<image>`, placeholder card until decoded, floor ellipse, `onDone` / `onEvent`, `spriteHead`).
- **In the game:** `view/actors/Baby.tsx` and `Mocha.tsx` draw the baked standees (a first mode mapping, `babySprite`; Mocha turns toward 寶咖咖); the card flip mirrors about the foot anchor; the thought bubble's spring starts at the frame's head. `PagePlayer` preloads the page's chapter set and marks `data-sprites="ready"`; screenshot targets and `check:ui` wait for it. Actors layer on 1-2: 38 → 11 elements (37 → 10 animated).
- **PageLab:** fixture `sprites-anchors` (stills, heads and poses at map scale, mirrored pairs, box / foot / head / footprint marks; `data-specimen-hitless` lets `check:ui` skip the hit-layer rule for it) and the lab's `anchors` overlay.
- **Payload (R3):** the core set every M1 page preloads (19 寶咖咖 + 15 摩卡 frames + floor) is **383.5 KB @3x / 222.3 KB @2x**; all 75 frames 920 KB @3x. Getting there: Chromium's canvas encoder gave 740 KB; Pillow `method=6` 528 KB; alpha quality 65 (the border's smooth alpha was most of the bytes) and word poses moved to their chapters gave 383.5 KB.
- **Checks:** `npm test` 1814 (55 new in `sprites.test.ts`: files ↔ manifest ↔ the artist's manifests, WebP pixel sizes, payload, DPR, URLs, mirroring maths, timing and events on a fake clock, the shared clock, the loader, server render). `npm run build` (sprites are files, never inlined). `npm run visual`: the 8 popup targets with characters changed on purpose, baselines updated, plus the new `sprites-anchors`; everything else 0 px. `check:ui` and `check:play` (8/8) pass. Throttled images: placeholder cards, then the bitmaps in the same place.
- **Screenshots:** `docs/screenshots/94/`.
- **Decision:** D-56. Handbook § 5 (sync:sprites), GDD § 3.9, bible § 9.1 and Art v2 § 2.4 have engineers' notes.
- **Follow-ups (commented on the issues):** #95 completes the mode → sprite mapping and Mocha's hop/land/push (`onDone`/`onEvent` are ready); #96 adds the per-chapter half grade to the sync; #98 reads the bubble anchor from `spriteHead`; #141's frames arrive with a sync.

### 2026-10-19 · Staff engineer · #95 Standee integration: 寶咖咖 and 摩卡 animations wired to sim modes (PR #163)
- **`src/popup/view/actors/animMap.ts`.** The table: `babyAnim` (mode + the edge stepped + ride + growth + finger + word) and `mochaAnim` (hop, squeeze, eye contact, push, glare, puff, nope, purr, loaf on a part, in-box) return the pose and how its frame is chosen; `chooseFrame` turns it into a frame for the time into the tick. GDD names → Art v2 § 5 poses (grab `hold`, cuddle `hug`, say `point`, stand-cruise `pull`/`wobble`, hop/land `jump`, eye contact `push` frame 1). Word poses from the tick's events (`wave`, `refuse`, `hug`, `wonder`; `point` otherwise). Growth guard: no standing pose before its stage.
- **Frames on the tick.** The crawl/walk cycle runs whole strides per edge (44 units each) read from the eased step, so hands never slide; above 24 fps it uses the 4-frame `key` cycle. Mocha's `jump` crouch / air / land at 0 / 18 / 82 % of his step. The eye contact is the tick that ends with `mocha.stare` (from his landing on); the next tick shows the shove. `SpriteAnim` gained a `frame` prop for these.
- **Standee motion (`standee.ts`).** The step lands 120 ms before the tick ends; 4° lean into the travel direction at mid-step; ±2° damped landing wobble; look L/R card-flips away and back; reduced motion: a 180 ms fade-slide, held key frames, no lean, wobble, flips or sway. Lamp glow: a radial gradient behind him within 110 units of a lit light.
- **Fallbacks (#141's frames):** look L/R, touch-watch (3° tilt), watch-sway (±3° CSS rock), ride-giggle (`bounce`), carried, climb, Mocha glare, purr (`loaf`), in-box (hidden). Each logs once in dev (`console.info`).
- **Missing-frame report:** `#/pagelab?section=sprites` (visual target `pagelab-sprites`): M1 14 of 22 ✓; ✗ reach (1/2), look L/R, watch-sway, ride-giggle, touch-watch, Mocha glare, purr, in-box; later: carried, climb, stand-cruise (3/4), walk, Mocha walk. GDD § 3.9 table now says 8-frame cycles.
- **Fixtures.** `lab-eye-contact` and `lab-crying` on lab-only stages (`lab-push`: 1-2 with a cup on the pillar; `lab-cry`: 0-1 with the bead hidden until the mobile spins), since 0-3 and 0-4 don't exist yet; `c1p2-reaching` already existed. `fixtureFrame` resolves lab stages.
- **Payload.** `hug` (the cuddle frame) joined the core set: 396.6 KB @3x (≤ 400 KB).
- **Results.** Tests 1843 (new `animMap.test.ts`, PageView animation tests). `npm run build` OK. `npm run visual:update`: idle → sit and touch-watch changed 5 popup fixtures on purpose, kit-swatches by the new nav link; new baselines `pagelab-sprites`, `lab-eye-contact`, `lab-crying`; everything else 0 px. `check:ui` and `check:play` (8/8) pass. No console errors; fallbacks log as `console.info` in dev only.
- **Screenshots.** `docs/screenshots/95/`.
- **Decision.** D-57. GDD § 3.9, bible § 5, Art v2 § 5 and handbook § 5 have engineers' notes.
- **Follow-ups (commented on the issues):** #141 replaces the fallbacks and adds `reach`'s second frame (the report shows what's left); #106 adds `c0p3-eye-contact` / `c0p4-crying` on the real pages; #98 keeps reading the bubble anchor from the shown pose.

### 2026-10-19 · Staff engineer (technical artist) · #141 Character art extras: the missing GDD § 3.9 frames (PR #164)
- **Art (`docs/art/v2/src/`, Art v2 § 5).** Drawn with the existing rig, heads and toolkit, so they match the delivered style and the photo likeness, then compared side by side with `sit` / `loaf` / `crawl` / `bounce` at bake scale and in the game and iterated. 寶咖咖: `reach` frame 2, `look` (2), `watch` (2), `giggle`, `touchwatch`, `carried`, `climb` (3: pull-up, knee-over, up on all fours). 摩卡: `glare` (a new head expression: narrowed, slanted eyes, a furrow, ears flattened back; widened once after it read as "content" at game scale), `purr` (new head expression on the loaf), `inbox` (head, shoulders and paws, cut flat at the rim). Pose sheets regenerated.
- **Bake.** `bake_poses.py` now re-renders only poses whose drawing changed (per-pose SVG hash in `baked/poses-src.json`, ids renumbered): the first full re-bake showed Chromium's blurs churn up to 5 % of the pixels of untouched poses. Delivered frames stay byte-identical; only `reach` frame 1 was re-cropped (its pose gained a frame). `--force`, `--adopt`.
- **Game.** `npm run sync:sprites`; `animMap.ts` wires every frame (looking, watching, reaching, touch-watch, ride, carried, climb edges with `CLIMB_AT`, Mocha glare / purr / in-box). Mocha in a box perch is now drawn (head and paws in front of the box art) instead of hidden. Fallback-only code removed (`lookFacing`, the sway CSS, the `sway` / `lookAround` / `hidden` / `glare` flags). Report: M1 22 of 22.
- **Payload.** Adding the frames to the core set would have made it 446 KB. `pageSprites(ch)` now preloads every group ≤ ch (it used to skip earlier chapters' groups); poses the prologue never shows moved to chapter 1 (`point`, `eat`, `giggle`, Mocha `glare`, `squeeze`, `puff`) and drawn-but-unused poses to `'ui'` (`bounce`, Mocha `perch`, `stretch`, `sleep`, `rub`); `carried` is chapter 5, `climb` chapter 7. Core **381.1 KB @3x / 220.3 KB @2x**; chapter 1 adds 66 KB (test ≤ 100 KB).
- **Fixtures.** `lab-looking`, `lab-watching` (lab stage `lab-lamp`: 0-1 with a night light), `c0p1-touch-watch`, `c1p2-mocha-glare`, `lab-mocha-inbox` (lab stage `lab-box`: 1-2's bench as a box perch). The issue's `c0p2-watching` / `c0p4-mocha-inbox` need #106's pages; `c1p2-riding` is a still, which draws no ride, so ride-giggle is covered by a PageView test instead.
- **Checks.** `npm test` (1860), `npm run build`, `npm run visual` (new baselines for the 5 fixtures and `pagelab-sprites`; everything else 0 px or sub-0.3 % noise), `check:ui`, `check:play` 8/8.
- **Screenshots.** `docs/screenshots/141/`.
- **Decision.** D-58. Art v2 § 5, GDD § 3.9, bible § 5 and handbook § 5 updated.
- **Follow-ups.** #106: move the lab fixtures onto 0-2 / 0-4. #120: check `carried` and `climb` on real pages (the climb assumes a riser ≈ 22 pt). Stand-cruise's 4th frame is still undrawn (later row, not M1).

### 2026-10-19 · Staff engineer · #96 Paper environment renderer: baked backdrops, standing cut-outs, part art registry and the env bake step (PR #165)
- **`npm run bake:popup`** (`scripts/bake-popup.ts`, vite-node; D-59): renders every registered page's backdrop (its drawing, or its chapter's placeholder stage, with the kit's filters on: depth shadows, blurs, glows, grain and mottle clipped to the paper) over the page's whole view box, every part art key with a drawing per state (cropped to what was drawn; a lifted variant for dragged presets; pivots and hinges), and cut-outs, at DPR 2 in Chromium, encodes with Pillow `method=6`, writes `src/popup/assets/env/**` and `src/popup/env/env.gen.ts`, and prints the payload report. Idempotent by source hash (second run: `0 item(s) baked, 3 unchanged`); a `--force` re-bake was byte-identical.
- **`src/popup/env/`**: `manifest.ts` (contract, validation), `sources.ts` (what to bake), `art/c1.ts` (1-2's split-flap board from proof A, `times` / `flip`), `bake.ts` (the SVGs and hashes, shared with the test), `grade.ts` (`envGrade`, `standeeGrade`, `gradeSvg`, the never-graded colours), `loader.ts` (URLs, per-state resolution with lifted variants, `pageArtUrls`, `usePageArt` with the next page's backdrop preload), `report.ts` (page art and first load against the budgets).
- **Runtime:** the registry draws a baked bitmap when there is one, else the live placeholder (unknown keys never error). `PageView` draws the baked backdrop (layer 1) and `PageDef.cutouts` (layer 2, new field, GDD § 3.2); `StateArtView` / `MoverView` draw part bitmaps per state; `WheelView` / `FlapView` support baked discs and cards (pivot, hinge, lifted variant). `PagePlayer` preloads the page's bitmaps and marks `data-sprites="ready"` only when characters and environment are decoded. Backdrop layer on 1-2: 345 → 134 elements (the rest is shared defs); parts-near animated 37 → 29.
- **Half grade** (the #94 follow-up): `sync:sprites` bakes a per-grade variant of each gameplay pose a registered chapter preloads, into the print only (×0.775/0.785/0.86 for chapters 0–2; one shared variant), `SpriteGrade` context in `PageView`, `chapterGradeKey`, graded `payloadBytes`. Graded core 367.9 KB @3x.
- **1-2 layout:** the board's hit is now the board (52, 40, 176 × 64) and the 土地公 (236, 98) peeks from behind its corner; gesture and hint tests moved with it.
- **Payload** (`npm run art:report`): c0p1 160.4 KB, c1p2 173.1 KB (≤ 350 KB); first load 528.3 KB (≤ 2.5 MB).
- **Results.** `npm test` 1890 (new `env.test.ts`: files ↔ manifest ↔ source hashes, WebP sizes, budgets, per-state resolution, fallbacks, the report, the grade, the board's lint; new grade tests in `sprites.test.ts`). `npm run build` (sources are not in the bundle). `npm run visual`: every popup page target changed on purpose (baked backdrop, board, graded characters), new `c1p2-env`; everything else 0 px. `check:ui`, `check:play` 8/8 and `npm run solve` pass.
- **Screenshots.** `docs/screenshots/96/`.
- **Decision.** D-59. GDD § 3.2 / § 3.9, bible § 9.1 and handbook § 5 updated.
- **Follow-ups.** #108 draws the chapter 0–1 art into `src/popup/env/art/` and re-bakes (the placeholder backdrops are baked meanwhile); a page in a new chapter needs `sync:sprites` + `bake:popup`.

### 2026-10-19 · Staff engineer · #97 UI shell: cover, book frame, HUD, bottom bar, 目錄, page fold and chapter turn, 左手模式 (PR #166)
- **Flow (`src/popup/game/nav.ts`).** A pure state machine: a base (the cover or a page, with a `run` count for 重來 / replays) and one layer over it (選單, 目錄, 相簿, 設定). Resume is one tap (the cover's 「繼續」 → `save.current`); first launch shows only 「開始」. A layer over a page and a turn in progress hold the session (`PagePlayer` `hold`). `GameShell` (`view/screens/`) renders it on one `ProgressStore` (#93's save: opening a page makes it current, completing it records the solve; speed, 左手模式 and 減少動態 read from the settings). `#/popup` is now the game; `?page=` still plays one page.
- **HUD and bottom bar (`view/hud/`).** Live and at R5: landmark 25 px serif, 「page title」, 「第一章 · 第 2 頁 / 6」, the moon clock and the 9-slot tray at 20 px / ≥ 7:1, so the #92 waiver is deleted from `scripts/popup-checks.mjs`. The bar: the portrait (the only marigold ring; it opens the word ring stub), 提示, 重來, 選單 as 56 px discs in ≥ 48 px buttons with 20 px labels, and the page's stickers; 左手模式 mirrors it.
- **Screens.** The cover (the closed book on 阿嬤's low table on the 花布 quilt, Baokaka clapping and Mocha as standees, 「繼續」 with where it resumes, 目錄 / 相簿 / 設定 as paper cards); the 目錄 (the 月亮線 as a folded paper map with eleven stations, n/18 per open station, Baokaka's head on the chapter to resume, a page strip of baked-backdrop thumbnails with ✓ / 淘氣 / 土地公, a bookmark and padlocks, 「月亮線還沒開到這裡。」 on a locked station); the pause menu (the kit `Sheet` in a new `tone="paper"`); album / settings stubs for #103 / #104.
- **Art.** The quilt, the cover scene and the map sheet are baked by `npm run bake:popup` (new `screens` in the env manifest; 151 KB together, first load now 679 KB / 2.5 MB). New palette tokens for the quilt, the table, the ribbon and the map.
- **Page fold and chapter turn (`view/transitions/pageTurn.ts`).** WAAPI over a temporary DOM (bible § 2.4, proof C): the page's layers fold flat near-first and rise with an overshoot (a `scaleY` about each layer's base, five depth groups), a three-strip leaf textured with the two pages' baked backdrops falls toward the reader, confetti; the chapter turn dollies the whole book back over the quilt, slows the leaf and hangs a chapter card on strings; tap skips; reduced motion is a 250 ms cross-fade + 4 px rise. 0-1 → 1-2 plays as a chapter turn.
- **Fixtures.** Screen fixtures (`screen: { nav, save }`, seeded in-memory store): `cover-first`, `cover-continue`, `contents-ch1`, `contents-locked`, `page-hud`, `page-hud-left`, `page-menu`. The QA scripts wait for `[data-screen-ready]` on non-page screens.
- **Tests.** `nav.test.ts` (cover → page → menu → contents, resume target, first launch, locks, retry, next), `pageTurn.test.ts` (the § 2.4 timings), `screens.test.ts` (cover, HUD, bar, 左手模式, 目錄, R5 sizes in markup), fixture and env tests extended.
- **Decision.** D-60. Handbook § 5, GDD § 2.13 and bible § 7 have engineers' notes.
- **Follow-ups.** #100 wires 提示; #101 puts the sticker card between the fold and the next page and fills the bar's stickers live; #102 replaces the turn's card with the departure board; #103 / #104 replace the stubs; #109 points `#/` at the shell and calls `retireRpgSave`; a same-chapter fold becomes visible with #106's pages.

### 2026-10-19 · Staff engineer · #98 Thought bubble with change-of-mind animation, barks, subtitle bubbles and narration strips (PR #167)
- **Thought bubble (`view/talk/Talk.tsx`).** It is a die-cut cloud on a wire spring from the shown frame's head. When the target changes, the old icon pops, the new one inflates 100 ms later and the spring wobbles (a damped 3-cycle sine). 「要！」 is red serif and pulses while he reaches. Reduced motion uses fades only, and stills show only the settled bubble. Icons are shapes: a foil bead with a sparkle, Mocha's head, a bottle, a music note, tears, a heart.
- **Placement (`view/talk/place.ts`, `layout.ts`).** Candidate boxes are tried in order (preferred side, other side, then raised). Baokaka and the goal are hard avoids; Mocha, earlier bubbles and, for subtitles, the touchables are soft avoids. Bubbles stay below the HUD edge. Placement uses tick-end positions, and bubbles ride with their speaker between ticks.
- **R5:** every bubble grows by `talkScale(book scale)`, so its text is ≥ 20 screen px (× 1.39 at 375 × 667). The `[data-bubble]` waiver is deleted from `scripts/popup-checks.mjs`.
- **Barks (`view/talk/barks.ts`, `content/barks.ts`).** Barks come from events and mode changes, for Baokaka and Mocha, at most one per speaker per tick, and stay 3 ticks (pop, hold, fade). `PagePlayer` keeps a bark log. The bark text moved out of `core/`.
- **Subtitles and narration.** The queue is `game/talk.ts`: beats of ≤ 3, tap to advance, intro on a fresh page, event lines once. The view draws the narration strip (washi strip, italic serif), labelled subtitle cards on springs from 寶咖咖 / 摩卡 / the 土地公 / 廣播姊姊's paper loudspeaker, and off-page voices under the strip. Rows wrap at clause ends and are balanced.
- **Script infrastructure (`content/script.ts`).** `SCRIPT` (`LineKey → { who, text, label? }`), `SPEAKERS` (§ 5.1 labels and anchors), `loadLine(s)`. It is seeded with § 5.2 Ch1 intro and § 5.3 recurring lines. Lint rule 10 reads it (now tested).
- **Fixtures.** Added `bubble-reaching`, `lab-change-of-mind` (lab stage until 0-2 exists) and `subtitle-3`. Fixtures pass their last tick's events to the page, and `show.talk` puts lines on it. Baselines for pages that bark changed on purpose.
- **Tests.** `place.test.ts` (scale at 5 viewports, flip, fallback, raise, HUD edge, wrapping), `layout.test.ts` (a full beat at both viewports never covers him or the goal), `barks.test.ts`, `game/talk.test.ts` (max 3, advance, event lines once), `content/script.test.ts` (lengths, speakers, label contrast, lint rule 10), and PageView change-of-mind classes (motion, reduced, still, growth).
- **Decision.** D-61. Handbook § 5, GDD § 2.2.6 / § 2.13 and the bible § 5 have engineers' notes.
- **Follow-ups.** #102 fills `SCRIPT` and plays intros through the queue. #106 adds `c0p2-change-of-mind` on the real 0-2. #99 can reuse `barkCard` / `layoutTalk` for word bubbles.

### 2026-10-19 · Staff engineer · #99 Word ring, word cards, learn beat, Mocha's translations and the 嗶！ first-use tutorial (PR #168)
- **Word ring (`view/words/`).**
  - A kraft volvelle wheel round Baokaka with 72 px cream discs. Each disc has the word's icon on a torn-edge seal in its own colour (palette `word*`) and a 20 px serif glyph.
  - 「好了」 sits under him. The words start beside it on the thumb's side, mirrored in 左手模式, and close the circle at eight. The ring slides in from screen edges, and on a 320 px phone a full ring closes its gaps.
  - Opening it: the discs swing round from 「好了」, the page dims 30 % with a pool of light on him, and the world holds (`ring`).
  - It is an `aria-modal` dialog. Tapping off the discs, 「好了」 or Escape closes it.
  - Saying a word queues a `say`. On the say tick he shows a 1.6× speech bubble and the word's reach widens in its seal colour. `onSay(word, motif)` and `WORD_MOTIF` are the audio hook.
- **Logic (`game/words.ts`).**
  - `ringWords` returns exactly what step accepts, so a replay hides later words.
  - The learn beat runs the source, Baokaka and Mocha lines through the subtitle queue, then shows the **word card** (the world holds until it is tapped; the card ignores the ghost click a touch synthesizes).
  - `firstUseLine` gives the one-time translation per word per page; on the learn page it is the follow-up line.
  - The tutorial runs on the first word's page: the portrait glows, the ghost hand taps him once he is stuck, then the word's disc.
  - Text: `content/words.ts` holds all 11 § 5.4 beats and cards, and the `learn.*` lines are in `content/script.ts`.
- **Before any word**, tapping him shows 「要！」 with a chalk pointer to his target (`poke.ts`). It holds 3 ticks over his own barks.
- **Lab stages and fixtures.**
  - `lab-gates` is 1-3 as the engine tests lay it out, with the robot hit grown to 56 for R6. `lab-words` makes every word available.
  - Fixtures: `word-poke`, `word-card-beep`, `word-ring-open`, `word-ring-full`, `word-say-beep`.
  - `check:play` plays the 1-3 word flow end to end (`SCENARIO_URLS`, `tapEl`, `expect`, and checks that the world holds under the card and the ring).
- **Checks.** `npm test` (2091), `npm run build`, `npm run visual` (existing targets 0 px, 10 new baselines), `check:ui --popup` and `check:play` 12/12 all pass.
- **Screenshots.** `docs/screenshots/99/`.
- **Decision.** D-62. The handbook § 5, GDD § 2.4 and bible § 7 have engineers' notes.
- **Follow-ups.**
  - #107: register 1-3, then move the `word-*` fixtures and the play scenario onto `c1p3`.
  - #105: play the word motifs.
  - Learn lines advance only on a tap (as all subtitles do), so the card waits for that tap. Playtest (#110) should check that players find it.

### 2026-10-19 · Staff engineer · #100 Hint system via the solver: levels 0–3, hint worker, ghost hand, 「等等看」 (PR #169)
- **Source (`core/hint.ts`, pure).**
  - `nextHint`: the solver from the current state (`cap 200_000`, `timeMs 300`, `stopAtGoal`) and its `nextAction`.
  - The fallback, `solutionAction`: the stored solution step whose part states match (exactly, then on the parts the solution drives), waiting first where the solution settled. Failing that, `restart` (重來 + step 1).
  - `applyHint` plays an answer.
- **Worker (`workers/`).** `hint.worker.ts` is thin over `protocol.ts` (`{ id, pageId, state, def? } → { id, action, source }`). `HintClient` never fails: no worker, an error, an uncloneable message or a 2 s silence all fall back on the main thread.
- **Ladder (`view/affordance/ladder.ts`, `useHintLadder.ts`).**
  - 提示 climbs where → how → show me, and "show me" repeats. The player's own move resets it.
  - The auto nudge comes after the 自動提示 delay (`autoHintMs`; 15 s in 長輩模式), when nothing has changed.
  - Mocha's cues (`affordance.mocha`): the nudge's yawn is the `mocha.stretch` pose (now preloaded from chapter 1, re-synced). He looks at the target, and taps his paw for 「等等看。」.
  - The § 5.3 lines are his bark (`content/hints.ts`). A lost page glows 重來 (`BottomBar retryGlow`). The L0 shimmer is `aff-halo-once`.
  - `PagePlayer` runs it all; `GameShell` passes the setting. `PageChrome.onHint` now only listens.
- **Tests.**
  - `core/hint.test.ts`: solver and fallback loops from the start and from wandered states, timeout, page error, restart.
  - `pages/hints.test.ts`: the acceptance test, "show me" to `done` on every registered page with the solver and with the fallback alone.
  - `workers/hint.test.ts`: the job, and every client failure path.
  - `ladder.test.ts`, plus hint fixture checks in `fixtures.test.ts`.
- **Fixtures.** `hint-nudge`, `hint-level1`, `hint-ghost-hand`, `hint-wait`. `check:play` gains `hints-c1p2`, which plays 1-2 with 提示 alone.
- **Decision.** D-63. GDD § 2.7 has an engineers' note; the handbook § 5 and bible § 4.1 are updated.
- **Follow-ups.** #106 reuses `GhostHand`/`HintShow` for the scripted tutorials. #104's settings screen sets `autoHint`/`elder`. #105 can sound on `onHint`.

### 2026-10-19 · Staff engineer · #101 Page completion, sticker card, 淘氣 detection and 土地公 tap (PR #170)
- **Stickers, pure (`game/stickers.ts`).** `mischiefFired` matches the page's 淘氣 predicate against the tick's events and counters (it holds now, not before; `count` respected). `Attempt` / `earnInAttempt` / `attemptResult` carry an attempt's stickers and moves to `completePage`. `rewardFlags` derives the § 2.8 rewards (every 土地公 → the bonus page, every 淘氣 → the 淘氣大王 cover) over all 65 pages (`GAME_PAGES`). `PageSession.moves` counts applied non-wait inputs (for `bestPar`).
- **Completion sequence.** The grab barks 「這個！」 and flashes a foil sparkle burst (`PageView` `GrabBurst`). `playTurn` gained an **interlude** at `swapAt`: it holds every running animation and pending step while the sticker card is up over the folded page, then turns the leaf. Steps are now all timed from one 0 so a step due with the interlude can't overtake it. The chapter card drops after the leaf lifts (`CARD_AFTER_LEAF_MS`). Reduced motion: the card shows before the cross-fade.
- **Sticker card (`view/hud/StickerCard.tsx`).** A kraft card taped over the folded page: the title on a cream label, 解開 / 淘氣 / 土地公 slapping onto dimples with a squash 200 ms apart (an unearned one is its silhouette pressed in the kraft), 「下一頁！」. It stays 1.5 s after the last sticker lands, or until a tap (the shell's full-screen tap layer ends the card first, then skips the turn as before).
- **Mid-page stickers.** `PagePlayer` awards 淘氣 the tick it fires and 土地公 on a tap (his 「呵呵，囡仔，慢慢仔來。」 bubble through the subtitle queue; Mocha's squint on chapters 4/7/10), once per attempt; `onSticker` → `store.earnSticker` saves at once; `onDone` passes `{ mischief, tudigong, moves }` to `completePage`. The bar's tray disc slaps on and a kraft tag pops 「嘿嘿，淘氣！」 / 「找到土地公！」 over it (`BottomBar` `pop`). Sticker icons moved to `hud/stickerArt.ts` (bar, pop, card).
- **目錄.** Each solved page's 淘氣 is listed under the page strip: its 嘿 sticker (foil, or a pressed silhouette) and its text. Never before the first completion.
- **土地公 behind the board (#90's note).** Already fixed by #96 (he sits at the board's corner, 236, 98, and peeks out once it flips); verified in the `sticker-tudigong` still and in `check:play`.
- **QA.** Fixtures `c1p2-grab`, `sticker-card` (`screen.card`: the page folded flat via `[data-folded]`), `sticker-mischief`, `sticker-tudigong`, `contents-mischief`; 10 new baselines, existing targets unchanged (0 px). `check:play` gained `stickers-c1p2`: in the shell, four rides → 淘氣, the board flipped and the 土地公 tapped → 土地公, the solve, the card with all three, then the 目錄's 淘氣 line (mouse and touch, both viewports). `npm test`, `npm run build`, `check:ui --popup` (the list's page number moved to ink for 7:1) all pass.
- **Decision.** D-64. GDD § 2.8, the bible § 7 and the handbook § 5 have engineers' notes.
- **Follow-ups.** #103: the album reads `rewardFlags(save).mischiefCover`. #105: sounds for the slap, the pop, 「這個！」 and the burst. #110 playtest: the card adds ≈ 2.4 s between pages (tap to skip) — check it doesn't drag.

### 2026-10-19 · Staff engineer · #102 Chapter card (departure board) and all prologue + chapter 1 lines (PR #171)
- **Script (`content/script.ts`).**
  - Every § 5.2 line of P (12 lines), 0-3 (10), 0-4 (3), the ch1 intro (kept from #98), 1-1, 1-5 and 1-6. 咻咻 is labelled 「小小的雲」. Hokkien and wording are exactly as in the GDD; speech is stored without its outer 「」.
  - `chapters.ts` gains `next` (下一站) for all 11 chapters and `cardLines(chapter)` (P 1–5, ch1 1–4). 0-1's `lines.intro` is P 6–12.
  - `ui.ts` gains the § 5.7 photo, settings and bonus strings and the card's 「下一站」.
- **Card (`view/hud/ChapterBoard.tsx`, `chapterBoard.css`).**
  - A cream card on two strings: 第N章 set vertically on a deep red spine, the title, the time chip, the landmark in 36 px serif, the 翻 seal.
  - The split-flap 「下一站」 row: a tile per character, its flaps animated by the turn.
  - `CardTalk` draws the lines under it: a washi strip for narration, die-cut cards with the speaker's tab for speech.
- **Turn (`transitions/pageTurn.ts`).**
  - The card is now the shell's element (`TurnPages.card` getter); `buildCard` is gone.
  - New plan fields: `card.settle` and `camera.inEnd`. `TurnHooks.card` holds at the settle. Only non-free animations pause: the leaf, confetti and a chapter turn's rise finish.
  - A new `'open'` kind: the book on the quilt from the start, its pop-ups flat until the camera comes in. Reduced motion fades the card in and out.
- **Shell (`GameShell.tsx`).**
  - `startTurn` serves the fold, chapter and open turns.
  - The card's lines run through `game/talk.ts`. Taps are the next beat while the lines are up: a modal layer with its own button.
  - A chapter's first page opened from the cover or the 目錄 plays the open turn (`opensChapter` in `nav.ts`) and is held from its first frame.
  - `PagePlayer` defers a held page's intro until it is released.
- **QA.**
  - Fixtures `chapter-card-p` and `chapter-card-c1` (`screen.chapterCard`): 4 new baselines; every other target is 0 px.
  - `check:ui`: covered touchables under a modal are not measured. The card's lettering got tight run boxes and dark-red grounds for 7:1.
  - `check:play`: the `prologue-card` scenario (fresh save → 開始 → card → two taps → 0-1's intro), plus `readTalk` on c0p1. At 375×667 the intro's 小小的雲 bubble covers the crib-rail tab until it is tapped away.
  - `npm test` (2204), `npm run build`, `npm run visual`, `check:ui --popup` and `check:play` (20/20) all pass.
- **Screenshots.** `docs/screenshots/102/`.
- **Decision.** D-65. GDD § 2.13 and § 5.2, bible § 7 and the handbook § 5 have engineers' notes.
- **Follow-ups.**
  - #106 and #107 wire the 0-3, 0-4, 1-1, 1-5 and 1-6 beats into their pages' `lines`.
  - #105: sounds for the drop and the flaps.
  - #110: watch the reading load at the start (the card plus 0-1's intro).

### 2026-10-19 · Staff engineer · #103 Chapter spread, photo moment and the album page (PR #172)
- **Rules (`game/photo.ts`, pure).**
  - `photoReady`: on a `spread`, the goal is his target, reachable, 1–2 edges away.
  - The 3 s loop: `photoFrameAt` (A within ±0.4 s of the 1.8 s peak, B before, C after), `wowMeter`, `approachAt`; the auto snap (B) at 6 s.
  - `mochaInFrame` (+M: Mocha settled on a perch inside `photoRect`).
  - `albumNotes`: Frame A takes the chapter row, B and C the pools at `(chapter × 7 + frame) mod size` with A = 0, B = 1, C = 2; Mocha's pool is in or out by +M.
  - `spreadPage`, `albumHome`, and `chapterStickers` in `nav.ts`.
- **Text (`content/album.ts`).** All of § 5.6: the 10 chapter rows, the ending's row and the pools, plus each chapter's treasure and word. `UI.album` holds 「寶咖咖一歲的相簿」 and the labels.
- **View (`view/photo/`).**
  - `PhotoScene`: the photo re-drawn from `{ frame, mocha }`, a 4 : 3 crop of the spread's backdrop with placeholder composites (B `reach`, A `bounce` with the 雞腿 held up, C `eat`, +M `mocha.album`).
  - `PhotoMoment`: the paper camera with the slow-motion viewfinder, the 「哇！」 meter, the marigold 咔嚓 and the flash.
  - `AlbumPage` / `Album`: the album leaf, the retake and the choice of shot.
  - `treasureArt` draws 雞腿; the spine crease is `placeholders.ts` `spine`.
- **Wiring.** `PagePlayer` pauses for the moment and `onDone` waits for the shot. `GameShell` saves each shot (`keepPhoto`), then after the grab opens the album, and on 「放進相簿」 shows the sticker card and turns. The cover's 相簿 replaces the stub (the settings stub stays for #104).
- **QA.**
  - Lab stage `lab-spread` (1-2 as a centrefold) and `SPREAD_REGISTRY`.
  - Fixtures: `spread-c1`, `photo-moment`, `album-c1`, `album-c1-retake`, `spread-shell`. 10 new baselines; every other target is 0 px.
  - `check:play`: `photo-spread` (the moment holds the world, the shot, the album's notes, a retake, the choice, 放進相簿, the sticker card, the 目錄). It gained `--only <ids>`, and `check:ui` gained `UI_ONLY=`.
  - `check:ui`: the album is a modal; the notes' names are ink with a red underline (seal ink on pink is 6.4 : 1).
  - `npm test` (2237), `npm run build`, `npm run visual`, `check:ui --popup` and `check:play` all pass.
- **Screenshots.** `docs/screenshots/103/`.
- **Decision.** D-66. GDD § 2.9, bible § 7 and the handbook § 5 have engineers' notes.
- **Follow-ups.**
  - #107: register 1-6 with `spread` / `photoRect`, move the photo fixtures and `photo-spread` onto `c1p6`, and play `c1p6.end.*` after the album.
  - Character artist: the real photo frames (A/B/C, +M) replace the composites in `PhotoScene`.
  - #113: album navigation and the 淘氣大王 cover.
  - #105: shutter and note sounds.
  - The thought bubble still shows the bead icon for a spread's treasure. It is minor, and #107/#108 can draw a treasure icon.

### 2026-10-19 · Staff engineer · #104 Settings, 長輩模式 and 大字 (PR #173)
- **Rules (`game/settings.ts`, pure).**
  - `effectiveSettings` applies 長輩模式 (慢, 大字, 15 秒 and its extras) over the player's own values and never writes them, so turning it off restores them. `elderPatch` drops changes to the settings it holds while it is on.
  - It also resolves 減少動態 against the OS, and the tilt and low power.
  - `FrameWatch` turns on low power when frames stay over 20 ms for 2 s (sustained). `pulse` / `HAPTICS` are the vibrations.
  - `Settings.tilt` is optional, so old saves load. `autoHintMs` is always 15 s in 長輩模式.
- **Screen (`screens/Settings.tsx`).**
  - Index cards on the endpaper, with 長輩模式 first. Paper radio groups mark the chosen option navy with a ✓.
  - Rows held by 長輩模式 are locked with 「長輩模式幫你設好了」.
  - Volume sliders; 減少動態 shows 「跟著手機的設定」 until chosen; 書本傾斜 asks for the gyro.
  - 「重新開始（按住三秒）」 has a countdown and a bar, then `store.reset()` and the cover. The stub screen is gone.
- **Shell and page.**
  - 大字 is `TextScaleContext` plus `[data-text-size="big"]` on the shell and on `<html>`.
  - The elder extras: reveal outlines always on, bolder perch markers, 28 px seals, the strong halo.
  - Vibration pulses; `useTilt` (±3° page lean); `useLowPower` (no confetti, half the sparkles, no tilt).
- **大字 everywhere.**
  - HUD: the clock chip scales with its digits, and the chapter line is condensed.
  - Bar labels and bubbles grow. A small book plays one line a beat; the chapter card two.
  - The chapter card scales to the width and holds its words at 24 px.
  - Word ring, sticker card, 「哇！」 meter and album grow; headers stay on one line. `textSize.css` grows Tailwind sizes.
- **QA.**
  - Fixtures `settings`, `settings-elder`, `page-big`, `page-elder` and `subtitle-big`: 10 new baselines; every other target is 0 px.
  - `npm run check:ui:big` (`UI_TEXT=big`, or `&text=big` on a fixture URL) runs every popup fixture with 大字: all pass. `check:ui` skips text clipped by a scroller.
  - `npm test` (2264), `npm run build`, `npm run visual`, `check:ui`, `check:ui:big` and `check:play` all pass.
  - With five more fixtures, a long-lived dev tab started failing requests (ERR_INSUFFICIENT_RESOURCES), and fixtures timed out at random. `check:ui` and `visual` now open a fresh tab every 15 targets (`freshPages` in `scripts/popup-checks.mjs`).
- **Screenshots.** `docs/screenshots/104/`.
- **Decision.** D-67. GDD § 2.11, bible § 9.3 and the handbook § 5 have notes.
- **Follow-ups.**
  - #105 reads `settings.sfx` / `settings.music` (0–100) for its volumes.
  - #136: per-layer tilt parallax, and a device check of low power and vibration.
  - New screens should pass `check:ui:big`.

### 2026-10-19 · Staff engineer · #105 Audio: the § 2.12 cues and the music box (PR #174)
- **Synth (`src/shared/audio.ts`).**
  - Voices: an oscillator note (optionally gliding) or a filtered white-noise burst (optionally sweeping), each with a click-free exponential envelope. Two buses, 音效 and 音樂, with squared 0–100 volumes (`setVolumes`).
  - The `SFX` table: 35 cues, every § 2.12 row plus the bible § 8 fwump / fold chime, the chapter card's drop / flaps / lift, the album's note pop. All under a second, dry.
  - `motifVoices` voices `WORD_MOTIF` eight ways (嗶 square beeps, 掰掰 waving, 不要 low stomps, 哇 sweep, 抱抱 warm third, 飛機 run + whoosh up, 咻 noise sweep, 一起 a chord). `voiceVoices`: a blip per syllable (Mocha lower).
  - Music box: `chapter0` (8-bar lullaby in G) and `chapter1` (12 bars in C) on the pentatonic sequencer; plucked two-partial tines. `stepNotes` is the pure scheduling step.
  - `unlockAudio(make?)` takes a factory (tests pass a fake context); `suspendAudio` sleeps it while the tab is hidden. The RPG's `playTone` / tracks are unchanged in behaviour.
- **Map (`src/popup/view/sound.ts`, pure).** `tickSounds` (word, ding + bark blips, 要！要！, look, cry, pat-pat, Mocha's thumps, scrape + drop by material, creature voices, sparkle, world-moved parts, boop), `gestureSounds` (swish, click / ratchet / flop on release, boop), `stickerSounds` (pop + 嘿嘿 / bell). `SoundContext` defaults to silence.
- **Wiring.** `GameShell` unlocks on the first touch / click / key, sets the volumes live (a 音效 change clicks), plays the chapter's loop (the prologue's on the cover) and provides the live sink. `PagePlayer` sounds ticks, gestures, wheel steps under the finger, stickers and every hint shown. `playTurn` takes a `sound` hook (fold, leaf, fwump, card drop / flaps / lift on its own clock). The sticker card's slaps, the shutter and the album's print and notes sound on their own timers.
- **QA.**
  - `audio.test.ts` (fake AudioContext: buses, volumes, mute, every cue schedules, loops 8–16 bars pentatonic, the sequencer schedules ahead and keeps going, stop) and `sound.test.ts` (every § 2.12 row; both shipped pages' solutions crawl, want, grab with sound).
  - `check:play`'s `prologue-card` now also checks the shell played the card's and the turn's sounds (`{ heard }`, dev-only `window.__popupSounds`).
  - Rendered every cue offline in Chromium to balance levels (filtered noise needed ~3× the peak of tones). Played 0-1 → 1-2 in the shell with a probe: the chapter card, crawl, ding, blips, swish + click, sparkle, fold, slap, leaf, the chapter card again, Mocha's thump, the pigeon's coo — no console errors.
  - Visuals are unchanged (no baselines touched). Bundle: +4.5 KB gzip over all JS chunks (budget 6 KB).
  - Not done here: a listen on a real phone (iOS unlock, levels on a phone speaker) — for #110's playtest.
- **Decision.** D-68. GDD § 2.12, bible § 8 and the handbook have notes.
- **Follow-ups.**
  - Chapters 2–10: each adds its `chapterN` loop (`TRACKS`, `chapterTrack`).
  - New creatures / pushables: check `creatureCue` / `dropCue` keywords.
  - #110 playtest: listen on a phone; check 「要！要！」 every 4 ticks while he reaches isn't tiring.
  - #111: prune the RPG's tones and tracks (and the RPG's `TODO(#55)` notes go with it).

### 2026-10-19 · Staff engineer · #106 Prologue pages 0-2, 0-3, 0-4 and the scripted tutorials (PR #175)
- **Pages (`pages/c0/p2.ts`–`p4.ts`)**, registered in play order (0-1 → 0-4 → 1-2), exactly as GDD § 4.3 describes them:
  - 0-2 「沙發山」: the TV's standby light wins until the cushion shows the bead. Dad's newspaper is the 淘氣, and he sleep-talks 「叫……爸爸……」 (`c0p2.dad.1`).
  - 0-3 「摩卡起床」: Mocha's ten join lines are the page's intro. The bead `followsPushable` from the table to the rug. The 紅包 on the shelf is the 淘氣, and it lands with 「這個！」 (`c0p3.envelope.1`).
  - 0-4 「窗外的月亮線」: the basket box perch, the cry opens the door and wakes the train, and 廣播姊姊's lines play on `train on`.
  - `npm run solve`: all green, no dead ends. 0-3's par 1 at difficulty 2 is a warning only, as the GDD has it.
- **Scripted tutorials (`game/tutorial.ts`, D-69).** Run on first play (until the save marks the page solved), after their cue has held for its delay while the page is live and nothing is said:
  - 0-1: the ghost hand pulls the rail after 4 s of reaching.
  - 0-2: a moonlight spotlight on his thought bubble (`affordance.bubble`; not marigold).
  - 0-3: the hand taps `table` after 4 s of reaching.
  - `#/popup?page=…&tutorial=1` turns them on outside the shell.
- **Placeholder stage.**
  - A gate's doorway node is floor, not a carriage. This also fixes the lab 1-3, whose gates were drawn as trains.
  - Indoors, a perch above the gutter is a wall shelf.
  - A box perch is a woven laundry basket whose rim is the perch node, with Mocha's in-box frame on it.
  - New backdrop keys `c0/living-room` and `c0/home-window` bake the placeholder until #108.
- **QA.**
  - The lab stages `lab-push`, `lab-cry`, `lab-lamp` and `lab-box` and their six fixtures are gone. They are replaced by 12 real prologue fixtures (`c0p2-*`, `c0p3-*`, `c0p4-*`).
  - Baselines changed: word-* (the gate fix), contents-* (the "played" saves now solve the prologue before 1-2).
  - `check:play` has c0p2, c0p3 and c0p4, plus `tutorial-c0p1`…`tutorial-c0p3`: all pass, mouse and touch, 390 and 375.
  - New tests: `tutorial.test.ts`, and the spotlight in `PageView.test.ts`. Registry, nav, sticker and screen tests now go through the whole prologue.
- **Follow-ups.**
  - #108: the prologue art (living room with the sleeping Dad, the sofa, the family photo, the calendar; the balcony window, the curtain and the paper train; the basket rim at 0-4's `basket` node (34, 420)).
  - #107: 1-2 is now reached after 0-4.
  - #110: watch whether 4 s is right for grandparents.

### 2026-10-19 · Staff engineer · #107 Chapter 1 pages 1-1, 1-3, 1-4, 1-5, 1-6 and the chapter's end (PR #176)
- **Pages (`pages/c1/p1.ts`, `p3.ts`–`p6.ts`)**, registered in play order: the slice is now 0-1 → 0-4 → 1-1 → 1-6.
  - 1-1 「月亮線，出發！」: the map pushed onto the sleeping backpacker wakes him (his line, Mocha's translation) and he tucks his backpack in. Two straps (bible § 4.2's three touchables), the `sway` tab, 廣播姊姊's ride lines as the intro.
  - 1-3 「嗶！閘門」: the engine fixture's layout plus the robot's perch; the 淘氣 is 嗶！ while Mocha rides the robot.
  - 1-4 「大廳的棋盤」: the turntable as a wheel with two riding aisle seats round a fixed centre.
  - 1-5 「便當店的電梯」: the lift toggled by the panel Mocha sits on, re-pressed by `pet`; the shop counter's 叮咚 bell (the 店員小哥 cameo, three rings the 淘氣).
  - 1-6 「台鐵便當」: the spread — lid, pigeon, exit gate, cart slider, awning perch; `photoRect` round the platform.
- **Solver** (`npm run solve`): all 10 pages green, no dead ends, 淘氣 and 土地公 reachable; total ≈ 0.25 s of the 60 s budget. Par: 1-1 1 (d1), 1-2 2 (d2), 1-3 2 (d2), 1-4 3 (d3), 1-5 2 (d3: a warning, written back to the GDD), 1-6 4 (d3); 0-3 keeps its par-1 warning.
- **Engine-adjacent.** `PartDef.ridesOn` (view only): a part drawn and touched where a node has gone — 1-6's lid on its cart, 1-5's panel in its car (`gestures.ts` `rideOffset` / `rideHome`, `PageView`, the flap hints). The stage draws no post for a riding perch and carries only Baokaka's nodes on a carriage.
- **The chapter's end (`GameShell`).** Album → `endLines` as a modal over the dimmed spread → the HUD's held-back coin drops into the tray (`TopHud` `fill`, coin + sparkle sounds) → the sticker card → the chapter turn to chapter 2's card with 「未完待續」 and `rec.soon.1` → the 目錄. The thought bubble shows the treasure on a spread.
- **QA.**
  - The lab stages `lab-gates`, `lab-spread` and `SPREAD_REGISTRY` are gone: the `word-*` fixtures run on `c1p3`, `spread-c1` / `photo-moment` / `spread-shell` on `c1p6`. New fixtures: `c1p1-start`, `c1p1-awake`, `c1p3-robot`, `c1p4-turntable`, `c1p4-riding`, `c1p5-start`, `c1p5-car-down`, `c1p5-clerk`, `c1p6-spread`, `chapter-end-c1`, `chapter-soon-c2`.
  - `check:play`: `c1p1`, `c1p3` (the old `lab-gates` steps on the real page), `c1p4` (arc drags on the turntable's rim), `c1p5`, `c1p6`, and `photo-spread` now plays 1-6 in the shell through the end lines, the tray, the 未完待續 card and the 目錄. `stickers-c1p2` ends on 1-3 now.
  - Saves that put a player "at 1-2" (fixtures, nav / sticker / screen tests) solve 1-1 first.
  - New tests: riding hits and drawing, the treasure bubble, the tray fill, the 未完待續 board, end/soon lines, stage posts and carriages, the `ridesOn` lint.
- **Decision.** D-70 (deviations written back to GDD § 4.3's chapter 1 note and § 3.2).
- **Follow-ups.**
  - #108: chapter 1's art for the new keys (D-70 lists them), including the cart's awning and the car's panel on their parts.
  - #110: playtest whether 1-4's "turn it while he's on it" reads without the hint ladder, and the 1-5 bell's discoverability.
  - § 5.3's "every ride page" 廣播姊姊 lines are only on 1-1's intro for now (no cycling picker yet).

### 2026-10-20 · Staff engineer · #108 Slice art, part 1: the prologue (PR A)
- **Backdrops (`env/art/c0.ts`, helpers in `env/art/common.ts`).** 0-1 the nursery (the crib's head post and slatted rail, the mobile's arm, a 花布 quilt, the birthday bunting, the lane window with the 土地公 shrine lit at (330, 110) and 咻咻 peeking, Mocha asleep on the dresser by a washi lamp, moonlight on the boards, a duck and a ball); 0-2 the living room (爸爸 asleep on the teal sofa, his face under the newspaper flap, the family photo the 土地公 photobombs, a midnight clock, 春, Mocha asleep on the 抓周 table, the TV cabinet, the remote and slippers); 0-3 a new key `c0/zhuazhou-corner` (the sofa arm, the shelf, the 農民曆 with the 土地公, the 度晬 banner, the 抓周 table with its empty nine-slot tray); 0-4 the balcony window (the transom shrine, the curtain rod, the moon-line rail in the sky, the iron grille and the balcony's terrazzo).
- **Parts baked:** the mobile, the TV, the moon train, the balcony door, the 紅包, the bead, and three flaps (newspaper, cushion, curtain) whose sources carry the marigold ear.
- **Live stage dress (D-71):** `view/art/dress.ts` + `ledges.ts` — 巧拼 play-mat ledges, the crib's mattress, a pillow for the single-node slope, the balcony split on 0-4, owned perch furniture, the ㄅㄆㄇ blocks and the suitcase corner cards. Creatures (`creatures.ts`: origami pigeon, the paper-style backpacker per position), carriages (`carriages.ts`: the 台鐵 train, the bento cart), the 土地公's hats.
- **Readability.** Squint and grey sheets for the four pages: the play-mat pastels were too bright at 25 %, now dusky; the moon is small and veiled; 0-4 lists the train before the curtain so the curtain's grip ear stays on top. The animated budget: 1-6 is at 150 with the cart and pigeon (paths merged per colour).
- **QA.** `npm test` (new: `dress.test.ts`, source lints in `env.test.ts`, the creature registry), `npm run build`, visual baselines updated (prologue fixtures, plus 1-1, 1-2, 1-6 for the backpacker, pigeon, train, cart, cap and suitcase), `check:ui`. Payload (page art of 350 KB): c0p1 163, c0p2 194, c0p3 153, c0p4 216.
- **Next (PR B):** chapter 1's backdrops (`c1/car`, `c1/hall-night`, `c1/gates`, `c1/hall`, `c1/bento-shop`, `c1/bento-spread`), its parts, its dress entries, the cover polish.

### 2026-10-20 · Staff engineer · #108 Slice art, part 2: 台北車站 (PR B) and a deploy fix (#178)
- **Deploy fix first (#178).** #177's merge failed CI: the suitcase card gained a wrapping group after the 1-2 layer-count snapshot was taken. #178 refreshed the snapshot (21 → 22 static foreground elements). Lesson: run the whole suite after the last visual tweak, right before committing.
- **Backdrops (`env/art/c1.ts`):**
  - 1-1 `c1/car`: the 板南線 car in cut-away. The ceiling strips, the route map lit at 台北車站, the strap rail with the two perch straps, and the 「請讓座」 poster whose picture is the 土地公. Windows show the night city with a tiny 101. There is a blue bench and a teal 博愛座 with the rack over it, and the track under the car.
  - 1-2 `c1/hall-night`: proof A's station, hand-drawn. Its windows are dimmed, the moon is small and veiled, and the checker is about 15 % calmer.
  - 1-3 `c1/gates`: a coffered concourse with hanging signs. The 詢問處 booth frames the capped 土地公. There is a 服務台 counter, a ticket machine, a station map and terrazzo underfoot.
  - 1-4 `c1/hall`: moonlight through the skylight's lattice, the big departure board, the hall clock, the 北 lightbox and the checker.
  - 1-5 `c1/bento-shop`: a cross-section. 1F is the shop: noren, a menu board with the 土地公, the 店員小哥 behind the counter, steaming rice. It sits beside the corridor. The slab is cut, the shaft has its cables, and B1 has its tiles, its rice rack, floor arrows and 便當 crates.
  - 1-6 `c1/bento-spread`: the concourse with its hanging clock and 出口 sign on the left; the platform canopy, the 台鐵 train (the 土地公's window) and a 便當 lantern on the right.
- **Parts:**
  - the map, the card, the reader and the gate (shared by 1-3, 1-4 and 1-6);
  - the robot (happy when spinning);
  - **the turntable**: a checker disk with the aisle runner and travellers printed on it, inside a marigold knurled rim. The 土地公 is printed upside down in state 2, so he reads upright once the disk is turned. Before this he was hidden under the disk;
  - the elevator car, its panel, the 叮咚 bell and the bento lid (a baked flap). The halo fix also covers the chapter card's line cards (「好吃！」 on chapter-end-c1).
- **Dress:** car body ledges and owned straps and rack on 1-1; granite walkways; the shop floor's cut slab on 1-5; 1-6 split from granite to brick at the spine; owned posts for the counter, the ticket machine, the robot lid, the clock, the lightbox and the B1 rack.
- **Notes from the issue thread:**
  - **The train's hit area on 1-2** now starts at the tab card's left end: x 28, w 178. The engine fixture and GDD § 3.4 are updated, along with the hint-thread test and the step snapshot's event origins.
  - **The 土地公 wears the 站務帽** on every chapter 1 page (1-1 and 1-5 had none).
  - The squint test darkened the station's sandstone and terrazzo toward night.
  - `check:ui` caught two runs whose glyphs overhang their card onto the now-lighter page art: the speaker tab's name (「背包客」 on 1-1) and a bark (「好吃！」). The tab name now has a halo in the tab's ink, and bark text has one in the card's warm white (paint-order stroke), so both read at ≥ 7:1 over any art.
- **QA.** `npm test` and `npm run build` pass. The solver passes all 10 pages. Visual baselines are updated; `check:ui` and `check:play` pass. The squint and grey sheet is `docs/screenshots/108/squint-grey-c1.png`.
- **Payload** (page art, KB of 350): c1p1 147, c1p2 174, c1p3 127, c1p4 278 (the turntable's four 180-unit states), c1p5 127, c1p6 141; first load 1244 KB of 2560.
- **Cover.** The book on 阿嬤's low table (#97) already matches the bible; it is unchanged here.
- **Follow-ups.**
  - #110 playtest: whether 1-4's printed travellers read as a turnable floor without the hint ladder.
  - Whether the 1-1 backpacker's paper style sits well beside the anime standees, or whether he wants a v2 frame.


### 2026-10-20 · Staff engineer · #109 The routing switch: `#/` boots into 翻翻台北
- **Routes (`shared/route.ts`, `App.tsx`).** `#/`, `#/popup`, `#/quest` and unknown hashes show 翻翻台北; `#/find` / `#/sudoku` still rewrite to `#/`; `#/artlab` and `#/pagelab` stay dev-only. `App` imports `PopupGame` statically and no longer imports `QuestGame`; `<ArtDefs/>` mounts only around the art lab. The RPG still compiles and its tests run (`tsc -b` covers `src/`), but it is in no production chunk.
- **Bundle.** One main chunk, 584 KB (191 KB gzip), plus the hint worker (52 KB) and CSS (73 KB). A module listing of the production build finds 0 `src/quest/` modules among 513. Before: `index` 630 KB (the RPG) + `PopupGame` 420 KB.
- **Boot housekeeping (`main.tsx`).** `cleanupLegacyStorage` then `retireRpgSave()`. The result goes `App` → `PopupGame` → `GameShell` → `Cover`: a cream index card taped with pink washi above 「開始」 / 「繼續」 says 「寶咖咖的新冒險開始了！」 until the player first opens a page. New fixture `cover-farewell`; a unit test on the note.
- **Metadata.** Title, description, OG and manifest now say 《翻翻台北》 Pop-Up Taipei; theme and background colours are the quilt's plum. New share card `public/icons/og.jpg` (1200 × 630, rendered with Playwright from the cover scene and standees); the old `og.png` is deleted. Icons unchanged.
- **Deployment checks (`npm run check:prod`, new).** Builds, previews `dist/`, checks every route, 「開始」 → 0-1, 「繼續」 → 0-2 for a returning save, the RPG farewell once, no console errors; prints a throttled-4G load report. This run: CI-equivalent timings here: `npm test` 21 s, `npm run build` 18 s (`npm ci` not timed, node_modules were present); first load to the cover 684 KB of 2.5 MB; cover interactive 1.5 s of 3 s; 「開始」 → 0-1 interactive 2.0 s more, with 1.7 MB more transferred. Most of that is the Google web-font slices (D-17) for the page's CJK glyphs, about 1.2 MB of Chiron GoRound TC and 0.5 MB of Noto Serif TC; 0-1's backdrops and the character frames are about 0.5 MB.
- **QA.** `npm test`, `npm run build`, `npm run visual` (the `title` target is the new cover; baselines updated for `title` and `cover-farewell`), `check:ui --popup` on the cover fixtures (also with 大字, which first caught the note's text overflowing its card, now as wide as the buttons), `check:play` (all scenarios, `prologue-card` now from `#/`), `check:prod`.
- **Decision.** D-72 (D-13 marked superseded in part).
- **Follow-ups.**
  - #110: the playtest runs on the live site; watch whether the farewell note is noticed by old players.
  - #111: delete `src/quest/`, the art lab and its baselines, and the RPG utilities Tailwind still generates.
  - A pop-up-style "turn the phone upright" notice, if the playtest shows landscape use (the RPG's guard was not carried over).

### 2026-10-20 · Staff engineer · #110 Playtest kit, the on-device log and an automated first-time run
- **Kit (`docs/playtest/`).**
  - `README.md` is the observer's guide: who plays, the phone and sound set-up (an iPhone's silent switch mutes web audio), a fresh save per tester (設定 → 「重新開始」), the one sentence said at hand-over, when to step in (2 min / 4 min), consent and roles-only notes, what to do afterwards, and the log's columns.
  - Its § 6 collects every watch-point the slice's engineers left on #110 and in this log: sound, the iOS unlock, 「要！要！」, the cry and loops (#105); the reading load at the start (#102); the sticker card (#101); the 4 s tutorial delay (#106); the word card (#99); 1-1's sway tab, 1-4's turn, 1-5's Mocha tap and 1-6's pigeon (#107); the printed travellers and the paper backpacker (#108); the farewell note and landscape use (#109).
  - `sheet.md` is the per-tester observation sheet: time, first touch, hints and help per page; the 1-2 and 1-4 prediction questions and the child's rule question word for word; a tick list per watch-point; the device log; the § 8 gates.
  - `guide-zh.md` is the testers' one page in 繁體中文. `owner-guide.md` is the owner's summary: how to play, what to watch, how to report.
  - `m1-results.md` is the results template (go/no-go, follow-up issues).
- **The log (`#/?debug=metrics`, D-73).**
  - `game/playtest.ts` holds the event log (`popup.playtest.v1`), the fold into attempts (active time while the page is live, 重來 continuing the attempt, the longest still stretch), the § 8 readings and the Markdown report.
  - `GameShell` records opens, live on/off (layers, turns, the card, the album, the panel, a hidden tab), 重來, stickers and the solve.
  - `PagePlayer`'s new `chrome.onTrace` reports the player's moves, nope taps, taps on him and each hint shown with its level.
  - `view/hud/PlaytestPanel.tsx` is the chip (page + live time, ★) and the panel (copy, save `.md`, clear twice).
  - Off without the parameter. Nothing is sent.
- **AI playtest (`docs/playtest/ai-playtest.md`).** The whole slice played on the production build at 390×844 from a fresh save, through an interactive Playwright driver.
  - No-hint pass: all 10 pages, the photo, the album and the 目錄. Hints were used on 1-4 (L1, L2) and 1-5 (L1). There were no console errors.
  - Hints-only pass: every page reached done by 提示 alone (3–8 presses).
  - It found 12 friction points to watch, each with a screenshot in `docs/screenshots/110/`. The main ones:
    - lines advance only on a tap on the line itself;
    - perches are hidden under barks, bubbles or art (0-3's table, 1-1's rack, 1-3's counter);
    - 0-4's curtain-first order trap;
    - 1-1's intro bubbles cover the straps, and the third strap is decoration;
    - after 1-5's lift goes down there is no cue, and a tap on an unreachable perch gives no feedback;
    - a subtitle bubble is stranded under the HUD during 1-6's photo moment.
- **QA.** `npm test` (2459, new `playtest.test.ts`) and `npm run build` pass, and so do `npm run visual` (every target 0 px; the chip only shows with the parameter), `check:play` (every scenario, run in three chunks) and `check:prod`.
  - `check:ui --popup` failed once in the full run, on `chapter-end-c1`: 「寶咖咖」 and 「好吃！」 measured 18.7 px. That fixture passes alone, both on this branch and on `main`, so it looks like a mid-animation capture. Watch it.
  - The full `check:ui` (RPG plus popup) runs longer than 10 minutes here, so run `--popup` on its own.
- **Decision.** D-73. GDD § 8 and the handbook § 5 have notes.
- **Not done (needs people).** The dry run, the family session, `m1-results.md`, the follow-up issues and the owner's sign-off. #110 stays open for them.
- **Follow-ups.**
  - After the session: an issue per failed gate.
  - The AI run's friction list is input for those decisions.

### 2026-10-20 · Staff engineer · #183 M1 polish: the AI playtest's friction fixed before the family session
- **Why.** #110's automated first-time run (`docs/playtest/ai-playtest.md`) found twelve friction points. The clear ones are fixed before the owner's family playtest so the people test the design (D-74). The issue was filed under epic #78 and slotted before #111.
- **Lines (finding 1).** A tap anywhere on the page reads the subtitle beat on (`PagePlayer`): a pointer that lands while a beat is up and lifts as a tap is cancelled through the gesture tracker (no input, the world resumes); a drag still plays under the line. `check:play` scenarios that tapped on through a line now read it first (1-6's 嗶！ translation, 1-2's 土地公 line).
- **Paws and halos (4, 6, 8).** Perch paws, and a perch's hint halo, moved from `parts-near` to the `fx` layer, above the standees, the thought bubble and the barks. The paw has an ink hairline and a stronger halo. `layoutTalk` takes `marks` (the paws and the hinted target) as a soft avoid for every bubble, and 廣播姊姊 may drop down the page. Guards: affordance lint **A08** (drawing order; every page over its solution with the L1 hint) and a `check:ui` hit test of every paw and halo on every fixture (it skips specimens, hidden folded pages, and allows the ghost hand and subtitles).
- **Soft traps (5).** `solve().softTraps()`: a first move of a part or of Mocha from an on-track state that costs ≥ 2 more moves (it must be undone); undoing progress doesn't count. It found exactly 0-4's curtain-first trap. `pages.test.ts` fails on any; `npm run solve` has a `traps` column; PageLab's worker strips the function.
- **0-4.** The bead's `visibleWhen` is curtain open **and** train on: curtain-first shows a dark train, hiding Mocha still makes him cry. Par 2 either way; new fixtures `c0p4-curtain-first(-cry)` and a `check:play` scenario.
- **1-1.** The third strap is looped up (no ring; `env/art/c1.ts`, re-baked `c1/car`).
- **1-5 (10).** An unreachable perch tap shakes its paw (`perch-nope`) and Mocha turns to it, with his 「喵？」. A first-play `nudge` tutorial (new kind in `game/tutorial.ts`): 4 s after the car is down with them in it, Mocha taps his paw on the panel, shimmers once and asks 「再按一次？」 (`NUDGE_LINES`).
- **1-6 (11, 12).** No subtitle under the photo moment; riding bubbles are cut at the page's edges (`rideWithin`). A creature at rest beside a shiny faces it (the pigeon).
- **Cards (3).** A bobbing ▼ (`hud/TapMark.tsx`) on the chapter card's lines and the word card.
- **QA.** `npm test` (2494) and `npm run build` pass; `npm run solve` green with 0 traps; visual baselines updated for the changed fixtures only, plus six new fixtures (`c0p4-curtain-first`, `c0p4-curtain-first-cry`, `c1p5-nope`, `c1p5-nudge`, `c1p3-hint-counter`, `c1p1-intro`); `check:ui --popup` (four chunks of ~20 fixtures, ≈ 3 min each against a running dev server) and `check:play` (all 21 scenarios, three chunks) pass.
- **Left for the playtest:** the reading load at the start (#2), the backpacker's punchline (#7), the L2 turn hint (#9); the pigeon's motive and the sway tab are still watch-points.
- **Follow-ups.** None filed. If the family session still shows 1-5 stuck, the nudge's line could repeat; if lines still get in the way, a beat could auto-clear when the player acts twice under it.

### 2026-10-20 · Staff engineer · #112 M2 engine: spotlights, held items, decoys, 掰掰 / 不要！ / 哇！
- **Started before #110's sign-off** on the owner's instruction (build on while the family playtest runs); #111 still waits for it.
- **What was already there.** `nodeBy`, `heldBy`, `followsPushable`, decoys, `drop`, 掰掰/哇！ as page reactions and 不要！'s refusal were in the core since #82–#86, with unit tests; the learn beats, word cards and translations for all § 5.4 words since #99. This issue closed the gaps and proved the mechanics on pages.
- **不要！ can't strand him (D-75).** Refusing the only thing he wants made him cry forever (D-46 (11)'s soft-lock). Now, crying over his own refusals, he forgets them after two cries (`FORGET_AFTER_CRIES`; `lookCount` counts the cries) and wants the thing again. Crying with nothing refused is unchanged.
- **Solver.** `decoysReachable` (a decoy he can walk to, in any explored state: fails the page in `judge` and `pages.test.ts`) and `visibleTies` (rule 14 in every reachable state: a warning). `visibleTie()` is shared with the lint's L14. The slice's 10 pages: no decoys, no ties, same 0.3 s.
- **Toy pages (`core/fixtures/m2.ts`, `core/m2.test.ts`).** `toy-spotlight` (par 1), `toy-squirrel` (par 2), `toy-moon` (par 2, learns 不要！): lint clean with no warnings, complete solves with no dead ends, soft traps, walkable decoys or ties, 淘氣 and 土地公 reachable; each also proves its key move is necessary.
- **View.** `sayingWord` reads a say tick without a word event as 不要！ (it missed 不要！ said while crying, and in stills).
- **Lab and QA.** PageLab stages `toy-spotlight`, `toy-squirrel`, `toy-moon`, `lab-ring4`. Fixtures `word-ring-4`, `word-card-no`, `word-say-no`, `m2-spotlight`, `m2-squirrel-herded`, `m2-squirrel-bye`, `m2-moon-decoy` (baselines added; every other target unchanged). `check:play` gained `m2-moon-no` (learn beat, card, ring, 不要！ through real input) and `m2-squirrel-bye`. Tests: the four-word ring layout (both hands), the M2 learn beats and first-use translations.
- **QA.** `npm test` and `npm run build` pass; `npm run solve` green; `npm run visual` (only the new fixtures had no baseline); `check:ui --popup` on the new and word fixtures; `check:play`, all 23 scenarios in three chunks.
- **Decision.** D-75. GDD § 2.2.5, § 2.4, § 3.2, § 3.6 rule 14 and § 3.7 updated; the handbook's page checks too.
- **Follow-ups (for #114/#116/#118, noted in D-75).** A pressure plate needs its own look (a node attached to a button draws as a carriage); a light attractor would read better as a pool of light; a held item should sit in its creature's paws; a decoy draws as an ordinary bead.

### 2026-10-20 · Staff engineer · #113 Album complete (multi-chapter, retake, 淘氣大王 cover) and 目錄 for all chapters
- **Started before #110's sign-off** on the owner's instruction (keep building while the family playtest runs).
- **Album model.** `game/album.ts` reads the album off the save as leaves: the cover (`coverLeaf`; 「淘氣大王」 from `rewardFlags`), then chapters 1–10 (`chapterLeaf`: `photo` / `open` / `locked`). `albumHome` moved there from `photo.ts`; with no photo it now opens the album's cover instead of chapter 1's empty page. `flipLeaf` turns one leaf a turn, with no wrap-around.
- **View.**
  - `AlbumBook` (in `Album.tsx`) is what 相簿 opens. `AlbumScreen` (in `AlbumPage.tsx`) is the frame every leaf shares: endpapers, the swipe, a fixed row of arrows and dots, and buttons mirrored in 左手模式. The swipe is `photo/swipe.ts`: one finger, `touch-action: pan-y`.
  - `AlbumCover.tsx` draws the linen board with the latest photo in a round window, or the crowned 淘氣大王 version.
  - A chapter the line hasn't reached is a placeholder: name, title and time, a padlocked print, 「？」 and the locked line.
  - The album page's chapter title now wraps instead of truncating.
- **目錄.** It already drew the eleven stations. New: the 「象山的日出」 postcard on the map's free corner past 101 once every 土地公 is found, and its panel with the 未完待續 line until #135. Nav action `bonus`.
- **Rewards in fixtures.** GameShell takes `rewardTotal` (fixture `screen.rewardTotal`), so the 淘氣大王 cover and the postcard can be shown with today's 10-page registry. The game keeps 65.
- **QA.**
  - New fixtures: `album-multi`, `album-locked`, `album-cover`, `album-cover-unlocked`, `album-left-big`, `contents-all`, `contents-bonus`. Baselines added. `album-c1` changed on purpose (the arrows row), and `album-c1-retake` moved about 2 px (the title's line height).
  - New `check:play` scenario `album-flip`, driven by a new play step `swipe`.
  - `npm test` (2585) and `npm run build` pass. `npm run visual` passes.
  - `check:ui --popup` passes on all fixtures, run in five chunks. `chapter-end-c1`'s known 18.7 px mid-animation capture showed once and passes alone, so it is still worth watching.
  - `check:ui:big` passes on the album and 目錄 fixtures. `check:play` passes on all 24 scenarios, in three chunks.
- **Decision.** D-76. GDD § 2.8 / § 2.9, bible § 7 and handbook § 5 have notes.
- **Follow-ups for #135** (in D-76): the ending's photo as leaf 11, credits over the album photos, and the 象山 postcard opening the bonus page. Each chapter issue gets its album page for free; its treasure art replaces the foil token in `treasureArt.ts`.

### 2026-10-20 · Staff engineer · #114 Chapter 2 pages: 「會揮手的公園」 大安森林公園
- **Started before #110's sign-off** on the owner's instruction (keep building while the family playtest runs).
- **Spec first.** `docs/design/pages/c2.md` (linked from GDD § 4.4): every page in the § 4.3 format with a node/edge sketch and the solver's numbers; § 4.4's rows and § 5.2's chapter 2 lines updated where the spec changed them. Committed before the data.
- **Pages (`pages/c2/p1.ts` … `p6.ts`)**, registered after chapter 1: 2-1 信義線 (嗶！ the doors, Mocha knocks the umbrella across the gap; 淘氣 the 博愛座 with 廣播姊姊's 「請讓座。……貓也算嗎？」), 2-2 露天音樂台 (hide Mocha in the 店員小哥's crate — the cameo — then the spotlight leads him onto the trap door that raises the curtain), 2-3 跑步的阿姨 (Mocha on the railing, the jogger waves and he learns 掰掰; 掰掰 the dog off the bead), 2-4 松鼠的樹 (herd the squirrel down with Mocha, 掰掰 drops the bead), 2-5 生態池 (掰掰 the egret off the lily-pad ferry; the wet stone puffs Mocha), 2-6 畫畫的阿伯 (the spread: canvas flaps for a bridge and a branch, Mocha shoos the squirrel off the painter's hat, 掰掰 drops the 畫筆, photo).
- **Solver** (`npm run solve`): all 16 pages green, 0 dead ends, 0 traps, no decoys or ties; chapter 2 par 2/2/2/3/3/4 (all in band), 59–420 states each; the whole suite 0.5 s of the 60 s budget.
- **Content.** Chapter 2's card lines (all three on the card), end lines (one beat), the 2-2 clerk cameo (Mocha's new 「……又是你？」), `rec.pa.priority`; album notes were already in. A chapter 2 music-box loop.
- **Engine-adjacent.** The hint fallback matches creature positions first (2-4 has no parts; it looped otherwise). Placeholder visuals for #112's gaps: no carriage for a pressure plate, the spotlight's light as a floor pool under a beam, a held item in its creature's paws, the 土地公's 斗笠. Baked drawings where the preset placeholder misled: umbrella, curtain, trap-door plate, lily-pad wheel (`env/art/c2.ts`).
- **QA.** `npm test` (2704) and `npm run build` pass. Fixtures `c2p1-start` … `c2p6-bridges` (incl. `c2p3-learn`, `c2p6-spread`), `spread-shell-c2`, `chapter-end-c2`, `chapter-soon-c3` (was `-c2`); baselines added, and refreshed for `album-multi`, `contents-all`, `contents-bonus` and the M2 toys. `check:ui --popup` on the new fixtures; `check:play` gained `c2p1` … `c2p6` and `photo-spread-c2`; `photo-spread` now runs into chapter 2's card. Payload: c2p5 296 KB (the lily-pad wheel), the rest 154–166 KB of 350.
- **Decision.** D-77.
- **Follow-ups (for #115).** Creatures are still origami birds (jogger, dog, turtle, squirrel, egret, painter, commuter, sweeper) and every backdrop is the chapter's placeholder stage; the doors, spotlight and canvas flaps keep their preset art; 2-6's treasure is the foil token; the 土地公's 掃把. The decoy look is #116's.

### 2026-10-20 · Staff engineer (environment technical artist) · #115 Chapter 2 art: 大安森林公園
- **Started before #110's sign-off** on the owner's instruction (keep building while the family playtest runs).
- **Palette kit first.** `POPUP_PARK` (deep green + indigo, firefly lime accent; added to the ΔE-from-marigold palette test) and the kit's cut-outs in `env/art/c2.ts`: layered leaf canopies and crowns, trunks, the park lamp, hedges, baked fireflies, the lawn floor, benches, water (glassine), reeds.
- **Backdrops.** 2-1 `c2/xinyi-car`: the 信義線 car in cut-away (red band, route strip lit at 大安森林公園, Mocha's strap, the open window, the teal 博愛座) beside the platform (the station's name board, the glass atrium onto the sunken garden, the bench, the poster that becomes the 土地公). 2-2 `c2/bandshell`: the white shell as a V-fold with its back-row benches, the 掃地阿伯's catwalk, the 店員小哥's drinks cart and crate, the spotlight's tripod. 2-3 `c2/bridge`: the joggers' path, the red-railed bridge, the stream into the pond, the turtle's rock. 2-4 `c2/tree`: a great camphor with its two forks, branches, the low branch, the knot-hole, the stump, 咻咻 rustling the leaves. 2-5 `c2/pond`: the pavilion, the pond with the moon's reflection, lilies, the stepping stone, reeds. 2-6 `c2/painter-spread`: the easel and its painted canvas, the stream, the parasol, the paint box, the tree.
- **Parts.** The doors (gate), the spotlight (wheel; each state's lamp aims at its pool, and the pool's beam now comes from the lamp), three pop-up painted flaps (D-78), the lily pad restyled to the pond's water (one bitmap). **Cast** (`view/art/park.ts`): commuter, 掃地阿伯, jogger (stretch / away), painter (sleep / nodding), shiba, turtle (rest / waving), squirrel (sitting / away / asleep on the hat), egret. **土地公's 掃把**; **畫筆** treasure (spread, photo, album); **portrait of Mocha** cut-out (2-6's 淘氣).
- **Stage.** Park ledge styles, plank ramps, the arched bridge, `crossing: 'none'`, `shrub` card, live fireflies, the `ledgeSplit` fix (D-78).
- **QA.** `npm test` and `npm run build` pass; `npm run solve` unchanged. Art-key report: 0 placeholders on chapter 2 (`env.test.ts`). Visual baselines updated for the chapter 2 fixtures, `album-multi`, `chapter-end-c2`, `chapter-soon-c3`, `spread-shell-c2` (every other target 0 px). `check:ui --popup` on the chapter 2 fixtures and `check:play` (`c2p1`…`c2p6`, `photo-spread-c2`) pass. Perf spot-check (PageLab, 390×844 @3x, 4× CPU throttle): 2-6 58–60 fps like 1-6; 149 animated nodes at its busiest tick (≤ 150). The legacy `visual --perf` walks the RPG map, so the spot-check used a PageLab rAF sampler.
- **Payload** (page art, KB of 350): c2p1 165, c2p2 240, c2p3 208, c2p4 210, c2p5 250, c2p6 320.
- **Screenshots.** `docs/screenshots/115/` (six pages and key states at 390×844, the squint and grey sheet).
- **Follow-ups.** The photo frames are still #103's composites for every chapter (character artist); a chapter-card landmark vignette would be one issue for all chapters; backdrops are ≈ 210 KB, above the bible's 120–200 KB guide but well within the budget.


### 2026-10-20 · Staff engineer · #116 Chapter 3 pages: 「醉月湖的鵝」 台灣大學
- **Started before #110's sign-off** on the owner's instruction (keep building while the family playtest runs).
- **Spec first.** `docs/design/pages/c3.md` (linked from GDD § 4.4): every page in the § 4.3 format with a node/edge sketch and the solver's numbers; § 4.4's rows, § 5.2's chapter 3 lines and § 3.2's `AttractorDef.art` updated. Committed before the data.
- **Pages (`pages/c3/p1.ts` … `p6.ts`)**, registered after chapter 2: 3-1 綠線 (掰掰 wakes 1-1's backpacker — 「Where is 101?」 #2 — then 嗶！ the doors; 淘氣: 掰掰 to the ad poster), 3-2 椰林大道 (the outer bikes shove the 店員小哥's delivery bike across the path; Mocha on its seat rolls it back and holds it — the cameo), 3-3 醉月湖 (the moon decoy; the goose honks at Mocha and he learns 不要！; passing her nest sends her after Mocha), 3-4 傅鐘 (the bell decoy; the rope scatters the pigeons off the gate's plate; 不要！ and Mocha on the pillar lead him over it), 3-5 總圖書館 (two coupled pairs of shelves: hold the follower, crank the leader; in by aisle 1, out by aisle 3), 3-6 藍教授的書 (the spread: he sits on the page that becomes Mocha's bridge, reaching for her glasses; 不要！ frees it; Mocha beside her and she flies off the 書; photo).
- **Solver** (`npm run solve`): all 22 pages green, 0 dead ends, 0 traps, no decoys reachable, no ties, 0 lint warnings; chapter 3 par 2/3/2/3/4/4 (all in band), 36–4,939 states; the whole suite ≈ 1.8 s of the 60 s budget. A one-off check proved each page's key move (word, perch, rope) necessary.
- **Engine-adjacent / view.** Decoys drawn as themselves (`AttractorDef.art`, `decoyArt`: moon, bell, glasses) on the page and in his bubble; a tab/slider nobody drives is printed art (`partView`), and a tab's or slider's baked bitmap per state is drawn under its knob; baked placeholder bikes and shelves (`env/art/c3.ts`); the 土地公's 藍色校工帽; a placeholder ad poster; the stored-solution hint's 不要！ matches on his target (`sameRefusal`, it looped on 3-6). Chapter 3's music box, card and end lines; graded sprites for chapter 3.
- **QA.** `npm test` and `npm run build` pass. Fixtures `c3p1-start` … `c3p6-turned` (incl. `c3p3-learn`, `c3p6-spread`), `spread-shell-c3`, `chapter-end-c3`, `chapter-soon-c4` (was `-c3`); baselines added/refreshed. `check:play` gained `c3p1` … `c3p6` and `photo-spread-c3`; `photo-spread-c2` now runs into chapter 3's card. Payload: c3p1–c3p6 152–221 KB of 350.
- **Decision.** D-79.
- **Follow-ups (for #117).** Every backdrop is the chapter's placeholder stage; the goose, magpie and pigeons are origami birds, the poster a placeholder; the bikes, shelves and decoys are placeholder drawings (restyle in the campus kit); the doors, bell-rope, garden gate and the giant book's flaps keep their preset art (3-4's plate borrows 2-2's); 3-5's Mocha squeezing out on top of the shelves (the 淘氣) has no art; 3-6's treasure is the foil token.

### 2026-10-20 · Staff engineer (environment technical artist) · #117 Chapter 3 art: 台灣大學
- **Started before #110's sign-off** on the owner's instruction (keep building while the family playtest runs).
- **Palette kit first.** `POPUP_CAMPUS` (lake blue + palm green, the library's warm amber the one accent; added to the ΔE-from-marigold palette test) and the kit's cut-outs in `env/art/c3.ts`: royal palms as tall thin flats with serrated paper fronds, the campus lamp, the 1930s hall with its arcade, azalea hedges, the glassine lake, book rows, stacks and bookcases, arched windows, green reading lamps.
- **Backdrops.** 3-1 `c3/green-car`: a 松山新店線 car at 公館 (green band, route strip lit at 公館, Mocha's strap, the 博愛座 and the bench the backpacker sits up on), the platform's palm mosaic, 「出口 台灣大學」 and the 公館 board. 3-2 `c3/palm-avenue`: 椰林大道 receding to the main library's lit portico, palm rows both sides, the bike park, azaleas. 3-3 `c3/lake`: 醉月湖 — the far shore's halls and pavilion mirrored in the water, 咻咻 skimming the lake (the chapter's cameo ripple), a willow over the bench, the rock, reeds, the lake wrapping round the promenade's front. 3-4 `c3/fu-bell`: 傅鐘's pavilion on its plinth, the hall whose eaves the pigeons fly to, the garden wall, gate posts and garden. 3-5 `c3/stacks`: the stack room — the great lunette, the clock at 01:20, the gallery, the returns desk 「還書」, the book cart in aisle 2, the reading table. 3-6 `c3/book-spread`: 藍教授's corner — bookcases, the window, the campus map, the globe, the desk, the brass lamp, the giant open book, the tall stack.
- **Parts.** The doors (`carDoors`, 2-1's factored out, its bitmaps unchanged), the bikes and the 外送 delivery bike, the bell-rope (taut and 「噹！」 when pulled), the bronze gate plate (`c3/plate`, was 2-2's), the wrought-iron garden gate, the shelves and crank shelves, the giant book's three pop-up pages (`popFlap`, moved to `common.ts`). **Cast** (`view/art/campus.ts`): the goose (nest / honk / chase), 藍教授 (perched in a mortarboard / flying off), the poster's student (still / waving). **Decoys** restyled (the moon's foil slivers, 傅鐘's bell, the glasses on 藍教授's eye: `HELD_DECOY_FACE`). **書** treasure. 3-5's 淘氣 cut-out `c3/squeeze`.
- **Stage.** Campus ledge styles (car, walks, promenade, gallery, reading-room floor, desk, book block), the nest hummock and the book pile for single-node runs, stone steps, `azalea` foreground card; `crossing: 'none'` on 3-2, 3-5, 3-6.
- **QA.** `npm test` and `npm run build` pass; `npm run solve` unchanged (22 pages green). Art-key report: 0 placeholders on chapter 3 (`env.test.ts`). Visual baselines updated for the chapter 3 fixtures (and the ones that show chapter 3). Perf spot-check (PageLab, 390×844 @3x, 4× CPU throttle, rAF sampler): 3-6 ≈ 56 fps, 2-6 ≈ 50 fps on the same machine; animated nodes at the busiest tick ≤ 128 (c3p1; c3p6 99) of 150.
- **Payload** (page art, KB of 350): c3p1 133, c3p2 282, c3p3 215, c3p4 210, c3p5 236, c3p6 308.
- **Screenshots.** `docs/screenshots/117/` (six pages and key states at 390×844, the squint and grey sheet, the cast and treasure sheet).
- **Decision.** D-80.
- **Follow-ups.** The photo frames are still #103's composites (character artist); a chapter-card landmark vignette and a scrolling 月亮線 window strip stay one issue for all chapters (D-78); `HELD_DECOY_FACE` is a single offset until a second held decoy needs a per-creature anchor.
