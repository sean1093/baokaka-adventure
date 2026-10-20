# 《翻翻台北》 Pop-Up Taipei — Project Handbook

*You can't steer a baby. You can only rearrange the city.* 寶寶不聽指揮——你只能改變台北。

This folder is the project-management home for the game. It explains what we are building, where the source-of-truth documents live, how work moves from an issue to the live site, and what "done" means. Anyone (human or agent) picking up work should read this file first, then the issue they are working on.

| File | What it is |
|---|---|
| [`README.md`](README.md) | This handbook: overview, process, conventions, definition of done |
| [`roadmap.md`](roadmap.md) | Milestones, the ordered issue list with status, dependency graph (and the superseded RPG plan) |
| [`decisions.md`](decisions.md) | Decision log (append-only, dated) |
| [`process-log.md`](process-log.md) | Chronological log of what happened; every agent appends an entry when it finishes a piece of work |

> **2026-10-19 pivot.** Until 2026-10-19 this project was the RPG 《寶咖咖抓周大冒險》 (epic #1). The owner then judged the character art poor and the game still too shaped by the old design, and pivoted to concept A of [`docs/design/concepts.md`](../design/concepts.md), 《翻翻台北》 (decisions D-34–D-38, tracking epic [#78](https://github.com/sean1093/baokaka-adventure/issues/78)). The RPG code stays in the repo, unrouted after #109, until the M1 playtest sign-off; then #111 deletes it.

---

## 1. What we are building

- **Title:** 《翻翻台北》 Pop-Up Taipei.
- **Fiction:** the night before 寶咖咖's first birthday (度晬), a baby typhoon named 咻咻 blows the nine 抓周 treasures out of the window and blows open 阿嬤's pop-up book 《台北》. A crawling baby and his guilty big-brother cat 摩卡 ride the paper 月亮線 train through the book's pages (Taipei's landmarks) to bring everything home before 阿嬤 wakes at 05:30.
- **Play:** each page is a small side-view paper diorama. 寶咖咖 crawls by himself toward whatever he wants most that he can see (shiny > cat > snack > lights). The player pulls tabs, turns wheels, lifts flaps, places 摩卡 on perches and uses baby words (嗶！, 掰掰, 不要！ …) to change the world around him. No failure, no timers, one thumb, readable for grandparents.
- **Size:** prologue (4 pages) + 10 chapters × 6 pages + the interactive 抓周 ending = 65 pages, about 3–4 hours; a bonus page post-game.
- **Look:** characters are anime-style illustrations redrawn from the owner's photos (art v2), baked to WebP and shown as **die-cut standees** in a **pop-up paper-craft** book (the popup art bible).
- **Platform:** a mobile-first static web app (React 18 + TypeScript + Vite + Tailwind), deployed to GitHub Pages at `https://sean1093.github.io/baokaka-adventure/`. Portrait phones first (390×844 is the reference viewport).

### Source-of-truth documents

| Topic | Document | Notes |
|---|---|---|
| **Game design** (rules, systems, data model, engine architecture, content plan, script, milestones, metrics) | [`docs/design/gdd.md`](../design/gdd.md) | **The** source of truth. Issues cite sections by number and name (e.g. **§2.2.2 Target selection**); if a number has moved, go by the name. §5 holds every in-game line; §7 is the basis of the roadmap |
| Why concept A | [`docs/design/concepts.md`](../design/concepts.md), mocks in [`docs/design/mocks/`](../design/mocks/) | The three concepts the owner chose from |
| **Character art v2** (寶咖咖, 摩卡) | [`docs/art/v2/README.md`](../art/v2/README.md) + [`likeness-check.md`](../art/v2/likeness-check.md) | Anime style from the owner's photos (two-piece outfit, black hair; grey-brown tabby). Authored as code-drawn SVG (`src/*.py`), baked to WebP (`tools/bake.py`, `tools/bake_poses.py`); gameplay frames + `baked/poses.json` (§5). Supersedes the character parts of `docs/art/art-direction.md` |
| **Environment, UI frame and motion** (pop-up paper-craft) | [`docs/art/popup/README.md`](../art/popup/README.md) + proofs A–D and `src/kit.js` | The art bible: book and camera, tunnel-book z layers, paper stocks, the marigold affordance rule, standees, chapter palettes, UI framing, motion, performance architecture, build list (§10). Supersedes the background, location and UI sections of `docs/art/art-direction.md` |
| Story resource | [`docs/story/story-bible.md`](../story/story-bible.md), [`docs/story/script.md`](../story/script.md) | The GDD reuses the premise (抓周, 咻咻, 05:30, 土地公, first word 「摩卡」). Where they differ, **the GDD wins** |
| Old art direction | [`docs/art/art-direction.md`](../art/art-direction.md) | Still applies for the night colour clock (§3.2), contrast rules (§3.3) and the font stack (§7.1), as the popup bible says |
| Old RPG design (history) | [`docs/superpowers/specs/2026-09-07-baokaka-xia-design.md`](../superpowers/specs/2026-09-07-baokaka-xia-design.md) | Replaced by the GDD; kept for history |

If the GDD and an art document disagree on gameplay, **the GDD wins**; on looks, the art documents win. If a document is internally inconsistent, make the smallest sensible choice, note it in the PR description, update the document in the same PR when it is the GDD, and append it to [`decisions.md`](decisions.md).

### Architecture in one paragraph

The new game lives entirely in `src/popup/` (GDD §3.5). `core/` is pure TypeScript with no React or DOM: types, conditions, part presets, the walk graph, Baokaka's decision loop, Mocha, words, creatures, `step()` (the tick, GDD §3.3), the **solver** (BFS over `step`, proving every page solvable with no dead ends, measuring par, and producing hints) and the page lint. `pages/` holds one data file per page plus the ordered registry; `pages.test.ts` lints, replays and solves every page in CI. `content/` holds all zh-Hant text. `game/` holds save/progress (`popup.save.v1`) and the session runner. `view/` is a thin React layer (book frame, layered page renderer, part views, standee actors, HUD, screens) that never mutates sim state; `art/` is the TS port of the popup kit; baked bitmaps (characters, backdrops, parts) live in `src/popup/assets/`. `dev/PageLab.tsx` (`#/pagelab`, dev builds only) is the designer's tool and the host of visual QA fixtures. Shared code: `src/shared/` (storage, audio, routes) and selected `src/components/` kit pieces and `src/art/palette.ts` tokens. **New mechanics go into `core/` as pure functions with unit tests first, then the view renders them; new pages must be solver-green.**

---

## 2. The process: issue → PR → self-review → merge → deploy

Work is tracked as GitHub issues on `sean1093/baokaka-adventure`, ordered in [`roadmap.md`](roadmap.md) and in the epic issue ([#78](https://github.com/sean1093/baokaka-adventure/issues/78)). A staff engineer agent takes **one issue at a time, in order**. Agents can disconnect at any moment, so every issue is written to be self-contained, and every step leaves the repo in a consistent state.

1. **Pick** the first open issue in the roadmap's order whose dependencies are all closed (the order is not strictly numeric since the pivot). Comment on the issue: "Picking this up" (so a reconnecting agent knows).
2. **Sync** the working branch: `git checkout claude/cool-maxwell-my8tf1 && git fetch origin && git merge --ff-only origin/main`. The branch must equal `main` before starting.
3. **Read** the issue, every doc section it links, and the code it names. Read the latest `docs/design/gdd.md`, and for any art or UI work the latest `docs/art/popup/README.md` and `docs/art/v2/README.md`.
4. **Implement** on `claude/cool-maxwell-my8tf1`. Commit in small logical steps (see conventions). Push often (`git push -u origin claude/cool-maxwell-my8tf1`) so work survives a disconnect.
5. **Verify** locally: `npm test` (includes the page solver proofs), `npm run build`, `npm run solve` (when pages changed; see § 6), and the visual check (`npm run visual`, see § 5) for anything visible.
6. **Open a PR** from `claude/cool-maxwell-my8tf1` to `main`. Title = conventional commit style summary; body = what/why, `Closes #N`, test evidence, screenshots (390×844) for UI/art work, any doc inconsistencies you resolved, and the Claude Code footer.
7. **Self-review** the diff on GitHub as if reviewing a colleague: correctness, scope creep, tests, leftover debug code, secrets, file size limits, zh-Hant text ≤ 30 characters per line (GDD §5.1). Leave a review (a `COMMENT` review is fine; GitHub does not allow approving your own PR). Fix anything found and push.
8. **Merge** with merge method **"merge"** (not squash or rebase, so the branch stays fast-forwardable). Then `git fetch origin main && git merge --ff-only origin/main && git push` so the branch equals `main` again.
9. **Deploy** happens automatically: a push to `main` runs `.github/workflows/deploy.yml` (`npm ci && npm test && npm run build`, then GitHub Pages). Check the Actions run is green. If it fails, fix forward immediately with a new PR.
10. **Close out:** make sure the issue closed (via `Closes #N`), tick it in the epic's checklist, update the status column in [`roadmap.md`](roadmap.md) (in the same PR, or a tiny follow-up), and append an entry to [`process-log.md`](process-log.md).

**If you find work that doesn't belong in your issue**, don't widen the PR: open a new issue (English, same template), add it to the roadmap and the epic, and link it.

**If you pick up a half-done issue** (a previous agent disconnected): read the issue comments, `git log origin/claude/cool-maxwell-my8tf1`, and any open PR. Continue from there instead of starting over.

---

## 3. Conventions

### Branch
- All work happens on **`claude/cool-maxwell-my8tf1`**, one PR at a time. Never push directly to `main`.

### Commits
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`. Art and UI work use `feat(art):` / `feat(ui):`. Scopes in use: `engine`, `solver`, `art`, `ui`, `content`, `c0`…`c10`, `audio`, `docs`.
- Imperative mood, subject ≤ 72 characters, a body that explains *why* when it isn't obvious.
- Every commit message ends with the two attribution lines given in the session's instructions (currently `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and a `Claude-Session:` link).
- PR descriptions end with the Claude Code footer given in the session's instructions.

### Language
- **Issues, PRs, commit messages, code comments, identifiers and docs: English.**
- **In-game text: Traditional Chinese (zh-Hant)**, copied from `docs/design/gdd.md` §5. Hokkien flavour exactly as written there. Every line is at most 30 characters (lint enforces it).
- Dev-facing strings (validator errors, test names) are English.

### Code
- `src/popup/core/` stays pure and deterministic (no React/DOM, no `Date.now()`, no `Math.random()`, sorted iteration; GDD §3.3). The old RPG engine rule is the same.
- Pages are data built from presets; no per-page code (a custom reaction is a lint warning). The lint (`core/lint.ts`) must know about every new field; every page passes `pages.test.ts` (lint, solution replay, solver: solvable, 0 dead ends, not trivial, 淘氣 and 土地公 reachable).
- Art: the game shows **baked bitmaps** (WebP @2x/@3x) for characters, backdrops and parts, produced by the art pipelines (`docs/art/v2/tools/`, `scripts/bake-popup.mjs` from #96) and committed (CI cannot bake); live SVG only for cheap flat pieces (seals, bubbles, chalk lines). Colours from `src/art/palette.ts` only; marigold is reserved for touchables; no runtime SVG filters on anything that moves; page art ≤ 350 KB. Follow the latest popup art bible and art v2 README. (This supersedes the RPG-era "inline SVG only, no bitmaps" rule; D-36.)
- Accessibility (GDD §1.3): hit areas ≥ 48×48 CSS px after the book scale, text ≥ 20 px (≥ 24 px with 大字), contrast ≥ 7:1, an icon with every instruction, playable muted, `prefers-reduced-motion` and the 減少動態 setting respected.
- No new runtime dependencies without a decision entry. Dev dependencies for tooling (e.g. Playwright, pixelmatch) are fine.

### Labels
`epic`, `engine`, `art`, `ui`, `content`, `chore`, `docs`, `audio`, `qa`, and the milestone labels `m0` … `m5`. (The RPG-era `balance`, `chapter-1` … `chapter-14`, `post-game` and `mrt` labels are historical.)

---

## 4. Definition of done

An issue is done when **all** of these are true:

- [ ] Every acceptance criterion in the issue is met (tick them in the PR description).
- [ ] `npm test` passes (unit tests, `pages.test.ts` solver proofs for every page; until #111 also the RPG's `content.test.ts` and `sim.test.ts`).
- [ ] `npm run build` passes (`tsc -b` with no errors, Vite build succeeds).
- [ ] New engine behaviour has unit tests (table-driven where the GDD gives rules); new pages are lint-clean and solver-green, and the `npm run solve` table is pasted in the PR.
- [ ] **UI or art changes:** screenshots at **390×844** (and 375×667 where layout is tight) are attached to the PR, produced by `scripts/visual-check.mjs`; new screens and states add a PageLab fixture (from #92 on). Art PRs include the payload report.
- [ ] No console errors in the browser on the screens touched.
- [ ] Docs updated where behaviour changed (this folder, code comments, the roadmap status). Doc inconsistencies you resolved are written in `decisions.md`.
- [ ] The PR is merged to `main` with the "merge" method, the deploy workflow is green, the branch is fast-forwarded to `main`, and `process-log.md` has an entry.

### `main` is always playable
Every merge deploys to the public site. Since the routing switch (#109, D-72) `#/` serves 翻翻台北 (`#/popup`, `#/quest` and unknown hashes too), playable to the end of the latest finished chapter, which ends on a 「未完待續」 card (D-11 still applies). The RPG under `src/quest/` is in no route and no production chunk until #111 deletes it. Never merge a PR that leaves the cover broken: `npm run check:prod` (below) builds the site and smoke-tests it.

---

## 5. Visual QA

Every UI or art PR attaches screenshots made with this tooling (issue #4; decisions D-13, D-18, D-21). **For 翻翻台北,** PageLab fixtures (below, #92) are both the screenshot list and the audience-rule list. For UI work, run **`npm run qa`**: the visual check, then `check:ui`, then `check:play`. The RPG art lab and its targets below stay until #111 removes them.

### 翻翻台北 visual QA fixtures (#92, D-53)

- **What a fixture is.** `POPUP_FIXTURES` in `src/popup/dev/fixtures.ts` is a list of named, deterministic game states. Each fixture is a page id plus a list in the solution-step language: inputs like `{ set: 'train', to: 'half' }` and `wait`s. The list is replayed through `core/step` from the page's initial state, so a fixture never drifts from the engine.
  - Each fixture pins what it shows with `expect: { mode?, event? }`.
  - `fixtures.test.ts` fails if a fixture stops showing it. When that happens, fix the steps, not the expectation.
  - **Screens (#97):** a fixture can be a game-shell screen instead of a bare page: `screen: { nav, save }` renders `GameShell` at that navigation state over a seeded in-memory save (`fixtureStore`; the real save is never touched): `cover-first`, `cover-continue`, `contents-ch1`, `contents-locked`, `page-hud`, `page-hud-left`, `page-menu`. Screens that are not pages mark themselves `data-screen` and `data-screen-ready` once their bitmaps are decoded; the QA scripts wait for that.
  - Today's fixtures: `c0p1-start`, `c1p2-reaching` (on the jammed train at the gap) and `c1p2-riding` (the train carries him back: a `ride`); from #140, `affordance-states` (a specimen sheet: one touchable in every bible § 4.1 state), `c1p2-hold-reveal`, `c1p2-dragging`, `c1p2-reduced-motion` and `c0p1-hint-how` (the L2 ghost hand); from #98, `bubble-reaching`, `lab-change-of-mind` (now `c0p2-change-of-mind`, #106) and `subtitle-3`; from #99, `word-poke`, `word-card-beep`, `word-ring-open`, `word-ring-full` and `word-say-beep` (on 1-3 since #107, `word-ring-full` on the lab stage `lab-words`; `show.words` opens the ring, puts a card up or shows the 「要！」 poke). From #100, `hint-nudge`, `hint-level1`, `hint-ghost-hand` and `hint-wait` (`show.hint`). From #101, `c1p2-grab` (「這個！」 and the sparkle burst), `sticker-card` (a screen fixture with `screen.card`: the page folded flat, `[data-folded]`, under its sticker card), `sticker-mischief` and `sticker-tudigong` (`show.sticker`: the pop over the tray) and `contents-mischief` (the 目錄's 淘氣 list). From #102, `chapter-card-p` and `chapter-card-c1` (`screen.chapterCard`: the departure board hanging over the book pulled back on the quilt, its first beat of lines under it). From #103, `spread-c1`, `photo-moment` (`show.photo`), `album-c1`, `album-c1-retake` (`screen.albumAfter`) and `spread-shell` (on 1-6 since #107). From #104, `settings`, `settings-elder`, `page-big`, `page-elder` (screen fixtures whose saves set the settings) and `subtitle-big` (`big: true` on a page fixture). From #106, the prologue pages: `c0p2-start`, `c0p2-watching`, `c0p2-bubble-tutorial` (`show.affordance.bubble`), `c0p3-join`, `c0p3-tutorial`, `c0p3-eye-contact`, `c0p3-envelope`, `c0p4-start`, `c0p4-mocha-inbox`, `c0p4-crying` and `c0p4-train`; they replace the lab stages `lab-push`, `lab-cry`, `lab-lamp` and `lab-box`. `check:play` plays each prologue page, plus `tutorial-c0p1`…`tutorial-c0p3` (`#/popup?page=…&tutorial=1`: the scripted tutorials). From #107, chapter 1: `c1p1-start`, `c1p1-awake`, `c1p3-robot`, `c1p4-turntable`, `c1p4-riding`, `c1p5-start`, `c1p5-car-down`, `c1p5-clerk`, `c1p6-spread`, and the chapter's end: `chapter-end-c1` (`screen.endLinesOf`: the end lines over the spread, the tray's coin held back) and `chapter-soon-c2` (`screen.soonCard`: the next chapter's card with 「未完待續」). `check:play` plays `c1p1`, `c1p3`, `c1p4`, `c1p5`, `c1p6` and, in the shell, `photo-spread` through to the 目錄. A fixture passes its last tick's events to the page (its barks show in the still), and `show: { talk: [lineKeys] }` puts a subtitle beat on it.
  - A fixture can also `show` gesture flags (as if a finger were doing them: `reveal`, `dragging`…) and affordance flags (a `hint`, `done` knots, `elder`), pin its still's motion `look` (`motion`, the default, or `reduced`: the screenshot browser always runs reduced, so the still decides which idle cues it shows), or draw a `sheet` instead of the page.
- **Viewing a fixture.**
  - `#/pagelab?fixture=<name>&still=1` shows the fixture full screen as a player sees it, with no lab chrome. The clock is held, the frame is drawn at its tick's end, and `[data-still]` turns off every CSS animation and transition. **Idle loops must be CSS animations** (not rAF or `element.animate()`) so that stills stop them.
  - Without `still`, the fixture opens playing its last tick (`PagePlayer`/`PageSession` `prev`) and can be played on from there.
  - `#/pagelab?section=fixtures` lists every fixture with still and live links, plus the registered pages.
- **Add a fixture for every new screen or state.** Later issues add theirs: cover, word ring, hint hand, sticker card, photo, album, settings, chapter card. If a screen is not a page state, give the fixture what it needs (e.g. a screen id) in the same file.
  - `visual-check.mjs` picks every fixture up as a target named after it, at 390×844 and 375×667. Run `npm run visual:update` and commit the new baselines.
  - `ui-check.mjs` runs the rules below on every fixture.
- **`npm run check:ui` rules for 翻翻台北** (`scripts/popup-checks.mjs`; `node scripts/ui-check.mjs --serve --popup` runs only these). All rules run on every fixture, at both viewports:
  - **R5 text size.** Every visible text run is ≥ 20 CSS px, or ≥ 24 px inside `[data-text-size="big"]` (大字, which #104 sets). SVG text is measured on screen: its font size × the CTM's scale.
  - **R5 contrast.** Every visible text run is ≥ 7:1. The text colour comes from computed styles. The background is read off a screenshot taken with all text hidden, and 90 % of the pixels behind the run must pass.
  - **R6 hit areas.** Every `[data-hit]` (the page's grown hit shapes) and every button, link, input, switch, tab or slider is ≥ 48×48 CSS px. A fixture without `[data-hit]` fails. At 390×844 no page hit shape may be grown (`[data-hit-grown]`): each touchable's own hit area must be ≥ 48 px after the ≈ 0.91 book scale (bible § 4.2, #140). Text and touchables under an open modal (`aria-modal`: the pause menu, the chapter card while its lines play) are out of reach and are not measured (#102).
  - **Reduced motion.** With the fixture live under `prefers-reduced-motion: reduce`, no running animation may change anything but opacity (fades are allowed).
  - **Flashing.** With motion on, nothing may flash above 3 Hz.
  - **Self-test.** Before the motion rules run, a self-test injects a 5 Hz blink, a slide and a slow fade, and checks that the detectors judge them correctly.
- **Exceptions.**
  - **Lettering inside a picture** (a station's name plate, a split-flap digit, a verb seal's glyph) carries `data-art-text` in the art and is skipped. Never mark UI text this way.
  - **Known gaps** are listed in `WAIVERS`, each with the issue that removes it. Waivers are printed on every run. None today: #97 removed the HUD and bottom-bar waiver, #98 the bubble's (bubbles grow by `talkScale` against the book scale, so their text is ≥ 20 px at 375×667).
- **大字 (#104, D-67).** `npm run check:ui:big` (`UI_TEXT=big`) runs the 翻翻台北 rules on every fixture with 大字 on, so the 24 px rule covers every screen; `#/pagelab?fixture=<name>&text=big` shows any fixture that way. New screens must pass it: size text in code with `useTextScale()`, or with Tailwind `text-[Npx]` classes (`view/textSize.css` grows them). Text clipped away by a scroller is not measured.
- **`npm run check:play`** also fails when a registered page has no scenario in `SCENARIOS`.
- **`npm run check:prod`** (`scripts/prod-check.mjs`, #109) builds the site and checks it under `vite preview` the way a visitor gets it: every route (`#/`, `#/popup`, `#/quest`, unknown, the dev routes) opens the cover and `#/find` / `#/sudoku` are rewritten to `#/`; a fresh visitor's 「開始」 opens 0-1 with its characters; a returning player's 「繼續」 opens their page; an old RPG save is deleted and the farewell shows exactly once; no console errors. It prints a load report on throttled 4G (WebPageTest "4G": 9 Mbps, 170 ms RTT): bytes to the cover against the 2.5 MB first-load budget and the time to an interactive cover against 3 s (report only). `node scripts/prod-check.mjs --url https://sean1093.github.io/baokaka-adventure/` checks the live site after a deploy. Run it before merging anything that touches boot, routing, the build or `index.html`.

### Character sprites: `npm run sync:sprites` (#94, D-56)

The game draws 寶咖咖 and 摩卡 only as baked bitmaps (Art v2 § 2.3). The character artist bakes the frames into `docs/art/v2/baked/` (`poses.json`, `manifest.json`); the game's copy, with the die-cut standee look baked in, is made by:

```
npm run sync:sprites           # bake what changed into src/popup/assets/sprites/ + src/popup/sprites/sprites.gen.ts
npm run sync:sprites -- --force   # re-bake everything
```

- It needs Playwright's Chromium (`PLAYWRIGHT_BROWSERS_PATH`) and Python 3 with Pillow; CI needs neither, because the output is committed.
- It is **idempotent**: a sprite whose sources, `src/popup/sprites/config.ts` entry and bake settings are unchanged is skipped, and a second run reports `0 sprite(s) baked … unchanged`. It prints the payload (core set and all, @2x and @3x).
- `src/popup/sprites/config.ts` holds the game's readings of the poses: lazy-load group (chapter), play mode, held key frame, events, easel tab, `noMirror`, hand-placed head/hand points.
- `src/popup/sprites/sprites.test.ts` fails when an animation references a frame missing at either scale, when the committed files and `sprites.gen.ts` disagree (names, bytes, pixel sizes), when they drift from the artist's manifests, or when the core set passes 400 KB @3x.
- In code: `<SpriteAnim sprite="baokaka.crawl" facing="l" playing reduced x y />` (`src/popup/sprites/`), positioned by its foot anchor; `spriteHead()` gives the bubble anchor; `usePagePreload(chapter)` preloads a page's frames (`PagePlayer` marks the page `data-sprites="ready"`, which the screenshot targets wait for).
- **Half grade (#96, D-59):** gameplay poses carry a baked variant per character grade a registered chapter shows (`g/<grade key>/…`, `SpriteManifest.grades`); a page draws its chapter's variant through the `SpriteGrade` context, and a sync bakes the variants for any newly registered chapter.
- PageLab: the fixture `sprites-anchors` shows the sprites at map scale with their box, foot anchor, head and footprint; the lab's `anchors` overlay marks the actors on a page.
- **Animations (#95, D-57):** `src/popup/view/actors/animMap.ts` maps every sim mode and Mocha state to a pose and how its frame is chosen (clock, held, stride-synced, step sequence), with a fallback for any GDD frame not drawn (none since #141, D-58); `standee.ts` holds the card motion. When the artist adds a frame, sync, then wire it in `animMap.ts` (and give it a preload group in `sprites/config.ts`: `0` only if the prologue shows it, else the first chapter that does). **`#/pagelab?section=sprites`** is the missing-frame report: every GDD § 3.9 frame ✓ / ✗ / later (visual target `pagelab-sprites`).

### Environment art: `npm run bake:popup` and `npm run art:report` (#96, D-59)

Backdrops, part art and standing cut-outs reach the game as baked WebP bitmaps (bible § 9.1), never as live filtered SVG:

```
npm run bake:popup             # bake what changed into src/popup/assets/env/ + src/popup/env/env.gen.ts, then print the payload report
npm run bake:popup -- --force  # re-bake everything
npm run art:report             # the per-page payload report from the committed manifests (exits 1 over budget)
```

- **Sources** live in `src/popup/env/sources.ts` (kit-style SVG drawn with filters on): `BACKDROP_ART` (a key without one bakes its chapter's placeholder stage, so every page ships a baked backdrop), `PART_SOURCES` (one drawing per state, local origin at the part's hit centre, `pivot` for rotary parts, `hinge` for flaps), `CUTOUT_SOURCES` (placed by a page's `cutouts`). Chapter art goes in `src/popup/env/art/cN.ts`. Touchables without a source keep their live kit art.
- The bake grades backdrops and cut-outs with the chapter's environment grade (`src/popup/env/grade.ts`; lights, foil, touchables and the sky are never graded), crops parts to what was drawn, adds a lifted variant for dragged presets, encodes with Pillow and is **idempotent** (a source whose SVG is unchanged is skipped; a forced re-bake of unchanged sources is byte-identical).
- `src/popup/env/env.test.ts` fails when files and `env.gen.ts` disagree, when a source changed without a re-bake (the source hashes), when a page's art passes **350 KB**, or when the first load passes **2.5 MB**.
- The characters' half grade is baked by `npm run sync:sprites` per graded chapter (`g/<grade>/` variants); re-run it when a page in a new chapter is registered.
- Needs Playwright's Chromium and Python 3 with Pillow, like `sync:sprites`; CI needs neither.
- **Dressing the live stage** (#108, D-71). The ledges, perch furniture and corner card stay live (drawn from the walk graph); `src/popup/view/art/dress.ts` says, per backdrop key, what they are made of (`ledge`, `ledgeSplit`), which perches' furniture the backdrop draws itself (`ownPosts`) and which corner card it uses (`foreground`). Carriage art per part key is in `view/art/carriages.ts`; creatures (origami) and the paper-style cast in `view/art/creatures.ts` (drawn per position). A **baked flap** draws its face and back in the card's shape with the marigold dog-ear (local origin at the card's top-left, `hinge: 0`); its seal and curl cue stay live.

### Bubbles and subtitles: `view/talk/` (#98, D-61)

Everything said on the page: the thought bubble (change of mind: pop, inflate, wobble), bark bubbles (`barks.ts`), subtitle bubbles and the narration strip. Lines come from `content/script.ts` (`SCRIPT`, `SPEAKERS`, `loadLine`) and are queued by `game/talk.ts` (beats of ≤ 3, tap to advance). `layoutTalk` places them all so none covers Baokaka or the goal, and `talkScale` grows them so their text is ≥ 20 screen px at every viewport. Animations are CSS (`talk.css`), so stills stop them, and they are fades under reduced motion.

### Words: `view/words/` and `game/words.ts` (#99, D-62)

The word ring (a volvelle of 72 px discs round Baokaka, 「好了」 under him, the words from the thumb's side; `ringLayout.ts`), the word card, the say effect ring, each word's icon and seal colour, and the 「要！」 poke for a tap before any word. `game/words.ts` holds the logic: `ringWords` (exactly what the engine accepts as a `say`), the learn beat (`learnLines`, then the card), the one-time translation (`firstUseLine`), the first-use tutorial (`tutorialShow`) and the word motifs for audio. Text is `content/words.ts` and the `learn.*` lines in `content/script.ts`. `npm run check:play` plays the 1-3 word flow end to end (scenario `c1p3`).

### Hints: `core/hint.ts`, `workers/` and the ladder (#100, D-63)

提示 climbs GDD § 2.7's ladder on every page: where (the halo, Mocha looks, his § 5.3 line), how (the ghost hand), show me (the hand, then the step played for real — again on every press). The next action is the solver's from the state now, in `workers/hint.worker.ts`; any failure or timeout falls back to the stored solution step, then to 重來 + step 1 (重來 glows). The auto nudge (Mocha yawns toward it, it shimmers once) comes after the 自動提示 delay without a change. Logic: `core/hint.ts` (pure), `view/affordance/ladder.ts` (pure), `useHintLadder.ts` (timers, the worker client). `pages/hints.test.ts` presses "show me" until `done` on every registered page — new pages get it for free. Fixtures: `hint-nudge`, `hint-level1`, `hint-ghost-hand`, `hint-wait`; `check:play` plays 1-2 with 提示 alone.

### The game shell: `#/` (#97, D-60; `#/` since #109)

`#/` (no `page=`; `#/popup` is an alias) is the whole game: `GameShell` (`src/popup/view/screens/`) on one `ProgressStore` and the navigation state machine (`src/popup/game/nav.ts`). The cover (「開始」 on first launch, else 「繼續」 + 目錄 / 相簿 / 設定), a page in the book frame with the live HUD (`view/hud/TopHud.tsx`) and bottom bar (`view/hud/BottomBar.tsx`, mirrored in 左手模式), the pause menu (the kit `Sheet` in `tone="paper"`), the 目錄 (`Contents.tsx`), and the page fold / chapter turn (`view/transitions/pageTurn.ts`, WAAPI). The screens' art (quilt, cover scene, 目錄 map) is baked by `npm run bake:popup` (`src/popup/env/art/screens.ts`). To start over in a browser, clear `popup.save.v1` from localStorage. At boot `main.tsx` calls `retireRpgSave()`: when it deleted an old RPG save, the cover shows `RPG_FAREWELL` on a taped note above the buttons until the player first opens a page (fixture `cover-farewell`, #109).

**The chapter card (#102, D-65).** `view/hud/ChapterBoard.tsx` draws the departure board (the shell renders it in the layer above the camera; the turn drops it, swings it and flips its `[data-flap]` tiles) and `CardTalk` its lines. Which lines a card plays is `cardLines(chapter)` in `content/chapters.ts`; its 下一站 is `ChapterInfo.next`. A chapter turn holds at the card's `settle` while the lines play (`TurnHooks.card`); a chapter's first page opened from the cover or the 目錄 plays an `'open'` turn first (`opensChapter`). While the lines are up the card is a modal (`aria-modal`), and a page held at its start keeps its own intro until the turn ends. `check:play` runs `prologue-card` from a fresh save.

### The spread, the photo and the album: `view/photo/` and `game/photo.ts` (#103, D-66)

A page with `spread: true` is drawn as a centrefold (the spine's valley fold) and its goal as the chapter's treasure (`photo/treasureArt.ts`). `game/photo.ts` is the pure part: `photoReady` (2 edges from the treasure on an open path), `photoFrameAt` / `wowMeter` / `approachAt` (the 3 s loop, A at 1.4–2.2 s), `mochaInFrame` (+M: Mocha's perch inside `photoRect`) and `albumNotes` (§ 5.6). `PagePlayer` pauses the session for the moment and hands the shot to `onPhoto`; the shell saves it (`store.keepPhoto`) and opens the album page (`photo/Album.tsx`, `AlbumPage.tsx`) after the grab, with 「再拍一次」 and 「放進相簿」; the cover's 相簿 shows it too. The photo is re-drawn from `{ frame, mocha }` by `PhotoScene` (placeholder composites until the photo frames are drawn). Text: `content/album.ts`. Fixtures: `spread-c1`, `photo-moment` (`show.photo`), `album-c1`, `album-c1-retake` (`screen.albumAfter`) and `spread-shell` (`screen.spread`: the lab spread registered as 1-6). `check:play` runs `photo-spread` (`--only <ids>` runs a few scenarios).

### Settings, 長輩模式 and 大字: `game/settings.ts` and `screens/Settings.tsx` (#104, D-67)

The settings are the player's own values in the save (`popup.save.v1`, `store.updateSettings`). The game reads them through `effectiveSettings`, which applies 長輩模式 over them: 慢, 大字, 15 秒, plus its extras on the page. It never writes them, so turning it off restores what the player had. The shell (`GameShell`) applies everything live:
- the tick speed;
- 大字: `TextScaleContext` and `[data-text-size="big"]` on its root and on `<html>`;
- the 自動提示 delay, 左手模式, and 減少動態 (null follows the OS);
- 震動 (`pulse`: snap, push, sticker);
- the gyro tilt (`useTilt`);
- low power (`useLowPower`: no confetti, half the sparkles, no tilt).

`effectiveSettings` and `pulse` are in `game/settings.ts`. 「重新開始」 needs a 3-second hold; it calls `store.reset()` (the settings are kept) and opens the cover.

### Sound: `shared/audio.ts` and `view/sound.ts` (#105, D-68)

Everything is synthesised (no audio files). `src/shared/audio.ts` is the synth: `unlockAudio` (on a gesture; iOS), `setVolumes` (音效 / 音樂, 0–100), the `SFX` cue table, the word motifs and voice blips, and the music box (`playMusic`, `chapterTrack`); the RPG's `playTone` / tracks are kept until #111. `src/popup/view/sound.ts` maps play to cues — `tickSounds`, `gestureSounds`, `stickerSounds`, all pure and tested in `sound.test.ts` against GDD § 2.12 — and holds `SoundContext`. Only `GameShell` provides the live sink, so the art lab, PageLab, `#/popup?page=` and stills are silent. A screen sounds through `useSound()`; time a sound with the animation's own timer so a skip stops it. In dev, `window.__popupSounds = []` (set before the page loads) collects every sound played, for QA scripts. To add a chapter's loop: a `chapterN` track in `TRACKS` (8–16 bars of four steps, pentatonic degrees, `box: true`) and a line in `chapterTrack`.

### PageLab sections (dev builds only)

### Pages in the book: `#/?page=<id>` (every build)

Since #89, `#/popup?page=c0p1` (or `#/?page=c0p1` since #109) (any registered page id) plays one page in the book frame on the session clock. Dev parameters:
- `tick=N` starts N idle ticks in;
- `paused=1` holds the clock (screenshots);
- `speed=slow|normal|fast` sets the tick length;
- `demo=1` plays three idle ticks, then the page's authored solution.

Since #90 the page is played by touch or mouse (GDD § 2.6): taps and one-finger drags on the page, a finger down anywhere pauses the world, holding 600 ms on empty space outlines every touchable, and tapping Baokaka opens the word ring (#99).

The visual targets are `popup-c0p1` and `popup-c1p2`, each paused with Baokaka reaching.

**`npm run check:play`** (`scripts/play-check.mjs`, #90) plays 0-1 and 1-2 to completion through real pointer input — the mouse and CDP touch emulation, at 390×844 and 375×667 — dragging the tabs along their tracks and tapping the pillar perch, and fails if a page does not reach `data-done`, if the world ticks while a finger is down (or under the word ring or a word card), or on console errors. A scenario can start from a live PageLab fixture (`SCENARIO_URLS`): `photo-spread` plays 1-6 in the game shell (#103, #107). A `drag` through more than two points follows them in turn (1-4's turntable is turned along an arc of its rim). One that starts on a screen, not a page, names its ready selector in `SCENARIO_READY` (`prologue-card`, #102, starts on the cover with `{ fresh: true }`); `{ readTalk: true }` taps a page's opening lines away, `{ absent }` checks something is gone. `--shots <dir>` writes a PNG per step. Add a scenario when you add a page (the check fails without one); `npm run qa` runs it after the visual and UI checks.

- **The lab** (`#/pagelab`, since #91; GDD § 3.10). Desktop-first; on a phone the columns stack.
  - **Left:** every registered page with its solver badge (`ok` / `dead-end` / `over cap` / `lint` / `fail`, from `pages/report.ts`, the same judge as `npm run solve`), then lab-only fixtures that are broken on purpose (`c1p2-broken`: the train locks for good if Mocha scares the pigeon first), so the dead-end tools can be tried on real data.
  - **Centre:** the page (`PageView`) with overlay checkboxes — nodes by height, Baokaka's edges by kind (dashed while closed), perches and cat edges, attractors with their rank and priority, hit areas (data shape solid, the grown 48 px shape dashed), his target line and path preview plus Mocha's trip.
  - **Controls:** reset, play/pause, +1 tick, speed, and the input palette (every legal input as a button; while playing, clicks queue).
  - **Solver** (in a worker, `dev/solver.worker.ts`): run from the start or from the current state → par, states, time, 淘氣/土地公 reachability, the shortest solution with 「▶ play it」, and the dead ends (click one to load its state).
  - **Lint** re-runs on every edit. **Affordance lint** (#140, `view/affordance/lint.ts`) re-reads what the stage drew after every state: near-marigold decoration, the four cues on every touchable, hit areas ≥ 48 px at 390×844, the early-page count. **Readability:** greyscale, the 25 % squint thumbnail, the touchable count (≤ 3 on pages 1–3) and the art-key report (placeholder vs own art per backdrop, part and creature).
  - **Edit:** tick `edit`, drag nodes (a node riding a part moves its position for the part's current state) and track ends; 「Copy TS」 copies the `nodes` block and the `track` lines to paste into the page file (a text box shows the same when the clipboard is blocked).
  - **State:** the event log of the last 20 ticks and the `SimState` JSON.
  - **QA fixtures** (`section=fixtures`, `fixture=<name>`, `still=1`): see *翻翻台北 visual QA fixtures* above.
  - **URL:** `page`, `overlay` (comma list of `nodes,edges,perches,attractors,hits,target`; absent = `nodes,edges,target`, empty = none), `tick` (start N idle ticks in), `speed`, `edit=1`, `view=grey,squint`. Every checkbox rewrites the hash in place, so the address bar is always a reproducible link, e.g. `#/pagelab?page=c1p2&overlay=nodes,edges&tick=12`.
- **Kit** (`#/pagelab?section=kit`, since #139): proof D rebuilt from the TS kit port (`src/popup/art/`, with filters), every GDD part preset's default art in its idle state (with filters, as PageLab and the bake show it, and without, as the game draws it until bitmaps are baked), and the artist's `proof-d-swatches.png` below for comparison. Visual target `kit-swatches`.

### The art lab: `#/artlab` (dev builds only)

Run `npm run dev` and open `http://localhost:5173/baokaka-adventure/#/artlab`. In a production build the hash shows the game, and the art lab code is not in the bundle at all (`src/App.tsx` drops the lazy import when `import.meta.env.DEV` is false).

- **Tokens** (`section=tokens`): every palette token, the night clock's sky at nine times with the graded ground and characters, the web fonts with their load state, and the UI contrast table.
- **Rig** (`section=rig`, `skeleton=1` for the joint overlay, `state=attack|hurt|ko|victory|walk`): the option D rig test figure (`src/art/demo/RigDemo.tsx`) at the four LODs on night and parchment, its silhouettes, expressions and rig states, the shared `<ArtDefs/>` gradients, the placeholder sprite of each kind at battle and map size, and the § 8.2 element/byte budget per LOD.
- **Map** (`section=map`, since #13): the iso test map (`src/artlab/testMap.ts`: lamps, a lantern, a window, two neon signs on a `neon` map, a moon glint, ripples and fireflies) at 00:00 / 03:00 / 05:15 with the sky behind, the `SkyLayer` from midnight to sunrise plus the interior room, and every tile material at the three times.
- **Stage** (`section=stage`, since #14): every battle backdrop over its whole painted width with the 390×500 frame marked, the generic stages at 00:00 / 03:00 / 05:15, and the two 布袋戲 frames (boss valance, final proscenium) over the 大安 template.
- **Heroes** (`section=heroes`, since #16; `skeleton=1`, `only=baokaka|mocha`): 寶咖咖 and 摩卡貓 at the four LODs on parchment, night and 大安's brick walk, the 48px map test on night floors and black silhouettes, every pose with its skeleton, every expression, 摩卡's tail moods, every state and action pose, and the § 8.2 budget per pose (per drawing: the map LOD stacks two walk frames).
- **FX** (`section=fx`, since #15): every battle FX kind and skill accent on a little night stage over a stand-in target (its node count and the moves that use it in the caption), the four heroes' glyph rings with their emblems, and 哇哇大哭/claws landing on three foes. With `still=1` every effect is frozen at its impact frame (the resting style of each FX node); 「全部播放」 replays everything and tapping a card replays that one.
- **Sprites:** every `SpriteName` at 48, 64, 124 and 300 px on light, night and brick backgrounds, plus a black silhouette row. Option D sprites are drawn at the LOD for the cell size (48 icon, 64 map, 124 battle, 300 portrait); legacy sprites ignore `lod`.
- **UI kit** (`section=ui`, since #12): every `src/components` kit piece on its own in each state: panels, buttons (pressed, disabled), chips, command buttons, bars (low, critical, lag, heal), the command panel, list rows and switches, a dialogue box frozen half typed, the departure clock and a chapter card.
- **Screens:** named fixtures (`ARTLAB_FIXTURES` in `src/artlab/fixtures.ts`): title, world, dialogue (摩卡's bust, a key term, page dots), dialogue-npc, dialogue-choice, chapter-card (00:00 with its clock), chapter-card-0515 (dawn), chapter-card-reduced (減少動態 on), battle (three heroes), battle-4-heroes, battle-4v3 (the 大安 band-shell stage), battle-boss (the 布袋戲 valance), battle-final (the full proscenium), battle-fx (寶咖咖's 哇哇大哭 landing on three foes; with `still=1` the impact frame with its damage numbers), battle-375 (the 4v3 fight inside a 375×667 box at any viewport; fixtures can set `phone`), victory, shop, menu, menu-settings, party-sheet-equip (bag with signature gear picked), travel-screen (the 路線圖 with 3 lit, 1 new and 10 locked stations), defeat, ending. Each renders the real `QuestScreens` over a live reducer, so you can also play on from it. Add a fixture when you add a screen; the visual check picks it up automatically.
- **URL parameters:** `section=tokens|rig|heroes|ui|map|stage|fx|sprites|fixtures`, `only=<sprite names, comma separated>` or `only=<one fixture>`, `bg=light,night,brick,silhouette`, `size=48,124`, `still=1` (freezes animations; battle FX show their impact frame and damage numbers their peak). Example: `#/artlab?section=sprites&bg=night&size=124&only=baokaka`, `#/artlab?section=fixtures&only=battle&still=1`.

### Screenshots and baseline diffs: `npm run visual`

```sh
npm run visual          # start a dev server, screenshot, diff against tests/visual-baseline/
npm run visual:update   # same, but accept the new screenshots as baselines
node scripts/visual-check.mjs --serve --only title,battle   # a subset
node scripts/visual-check.mjs --serve --perf                # also measure frame times (report only)
node scripts/visual-check.mjs --serve --perf --perf-fixture world-follower --only title   # walk the park instead
node scripts/visual-check.mjs --url http://localhost:5173/baokaka-adventure/   # use a server you started
```

- Targets are listed in `scripts/visual-targets.mjs` (`title`, `artlab-sprites-night`, `artlab-tokens`, `artlab-rig`, `artlab-heroes`, `artlab-ui`, `artlab-map`, `artlab-stage`, `artlab-fx`, `kit-swatches`, `pagelab-sprites`, `popup-c0p1`, `popup-c1p2`) plus every art lab fixture and every 翻翻台北 PageLab fixture. Each is shot at **390×844** and **375×667** (2× pixel ratio, mobile, touch, reduced motion) after `document.fonts.ready` and once the DOM has been still for 0.5 s.
- PNGs go to `artifacts/visual/<viewport>/<name>.png` (gitignored). Diff mode compares against `tests/visual-baseline/<viewport>/` with pixelmatch (threshold 0.1) and fails when more than 0.5 % of pixels differ, writing `<name>.diff.png` next to the screenshot. It also fails on console errors.
- **When a PR changes visuals on purpose,** run `npm run visual:update` in the same PR and say so in the PR body. Baselines will churn a lot in M2/M3; that is expected.
- **Attaching to a PR:** copy the relevant 390×844 PNGs from `artifacts/visual/390x844/` to `docs/screenshots/<issue>/`, commit them, and link them in the PR body.
- `--serve` starts a Vite **dev** server (not `vite preview`), because the art lab only exists in dev builds; `--url` pointed at a production preview runs only the non-art-lab targets.
- **Browsers:** the agent environment has Chromium preinstalled (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). Elsewhere run `npx playwright install chromium` once. `npm ci` never downloads browsers (the `playwright` package has no install script), and the deploy workflow never runs this check.
- **Fonts.** Since #10 the game uses web fonts from Google Fonts, so the check needs network access to `fonts.googleapis.com`/`fonts.gstatic.com`; without it screens fall back to system fonts and diff. Baselines were made in the agent environment (Linux Chromium); emoji and font rendering still differ slightly across OSes, so on another machine run `npm run visual:update` first and don't commit those baselines.
- **`npm run check:ui`** (`scripts/ui-check.mjs`, #12) checks in the browser that dialogue typing never changes the box height, that every visible button/link/switch/tab on every fixture is at least 44×44 px (battle commands exactly 70 px) at both viewports, and that reduced motion (the OS setting, and the 「減少動態」 toggle via `chapter-card-reduced`) leaves no looping, flipping or drawing animation running. Since #14 it also plays three turns of `battle-4v3` and fails if the static backdrop (`[data-stage-static]`) is mutated or remounted, or if any animating element in the battle has a CSS filter, and checks the 布袋戲 frame shows on `battle-boss`/`battle-final` only. Since #15 it plays `battle-fx` (an all-target skill on three foes) and fails if more than 40 FX nodes are in flight, and, under reduced motion, if anything in the battle moves (a running animation whose keyframes change `transform`) or flashes (a blink, a wash or a `steps()` timing), or if the effects play anything but the `fx-still` fade. Since #92 it also runs the 翻翻台北 rules (see *翻翻台北 visual QA fixtures* above). Run it with the visual check for UI work (`npm run qa`).
- **`--perf`** walks the party around the `world` fixture (or `--perf-fixture <name>`) at 4× CPU throttle for 3 s and prints the median/p95/max rAF interval, the main-thread time per frame (CDP `TaskDuration`), the DOM node count, the number of ground SVGs and how many times the ground was mutated while walking (must be 0, #13) against art direction § 8.5. It runs on the dev build (React development mode), so numbers are pessimistic, and rAF intervals bottom out at the 16.7 ms vsync floor. It reports only; #57 makes it a gate.

---

## 6. Solver: `npm run solve`

The one-command overview of every page (issue #88; GDD § 3.7). For each registered page (`src/popup/pages/index.ts`, play order) it runs the lint, replays the authored solution and runs a complete solve, judges the page by the same rules as `pages.test.ts`, and prints one row per page plus the total runtime against the 60 s CI budget.

```sh
npm run solve                       # every page
npm run solve -- --page c1p2        # one page (by id)
npm run solve -- --chapter 1        # one chapter (0 = the prologue)
npm run solve -- --json             # the same report as JSON (for tools)
npm run solve -- --cap 50000        # a lower state cap than the default 2,000,000
```

```
page  title     diff  par  states  ms  dead  trivial  淘氣  土地公  lint   result
────  ────────  ────  ───  ──────  ──  ────  ───────  ────  ──────  ─────  ──────
c0p1  嬰兒床    1     1 ✓  22      4   0     no       ✓     ✓       0E 0W  ok
c1p2  月台的縫  2     2 ✓  182     25  0     no       ✓     ✓       0E 0W  ok

OK: 2 pages, 0 failing · total 0.04 s of the 60 s budget (0.1 %)
```

- **Columns:** page id, title, difficulty, par with the band check (`✓` inside the § 3.7 band, `! lo–hi` outside: a warning; `-` unsolved), states explored, solver ms, dead-end count (`?` when the search stopped early), trivial (`YES` fails; `yes (ok)` with `allowTrivial`), 淘氣 and 土地公 reachable (✓/✗; `?` when a capped search didn't find them), lint errors/warnings, result.
- **Below the table:** one `✗` line per failure (lint errors, a solution that doesn't reach `done`, the state cap, a cascade overflow, unsolvable, dead ends with the first one's input path, trivial, 淘氣/土地公 unreachable) and one `!` line per warning (lint warnings, par out of band).
- **Exit code:** 0 when every page is green and the total is under 60 s; 1 on any failure or over budget; 2 on bad arguments or a filter that matches no page. A page that exceeds its state cap **stops the run at once**, naming the page (simplify it, GDD § 3.7).
- The logic is `src/popup/pages/report.ts` (unit-tested in `report.test.ts`; `pages.test.ts` prints the same table when a page fails); `scripts/solve-pages.ts` is the thin CLI, run with `vite-node` like `npm run sim`. Paste the table into PRs that add or change pages (§ 4).
