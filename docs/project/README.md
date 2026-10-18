# 寶咖咖抓周大冒險 — Project Handbook

*Baokaka & Mocha: Midnight Across Taipei*

This folder is the project-management home for the 2026-10 redesign. It explains what we are building, where the source-of-truth documents live, how work moves from an issue to the live site, and what "done" means. Anyone (human or agent) picking up work should read this file first, then the issue they are working on.

| File | What it is |
|---|---|
| [`README.md`](README.md) | This handbook: overview, process, conventions, definition of done |
| [`roadmap.md`](roadmap.md) | Milestones, the ordered issue list with status, dependency graph |
| [`decisions.md`](decisions.md) | Decision log (append-only, dated) |
| [`process-log.md`](process-log.md) | Chronological log of what happened; every agent appends an entry when it finishes a piece of work |

---

## 1. What we are building

The site used to be a small collection: a hub, a hidden-object game (找找看, `src/find`), a picture sudoku (圖案數獨, `src/sudoku`) and an RPG (寶咖咖奇俠傳, `src/quest`). **We keep only the RPG**, and re-story and re-skin it completely:

- **Title:** 《寶咖咖抓周大冒險》 — *Baokaka & Mocha: Midnight Across Taipei*.
- **Story:** the night before Baokaka's first birthday, a baby typhoon (咻咻) blows Grandma's 抓周 treasures across Taipei. Baokaka (a baby who can't walk yet), Mocha Cat, 阿藍 (a blue magpie) and 黑糖 (a black bear) ride the secret midnight MRT, the 月亮線, to get everything back before 阿嬤 wakes at 05:30.
- **Shape:** 14 chapters across real Taipei landmarks in one night (00:00 → 05:30), about 27 maps, 5 playable MRT ride cars with a 路線圖 route map, a 集章本 stamp book, side quests, collections, a bestiary, level cap 20, an ending and a post-game. Target playtime 6–8 hours for a family.
- **Look:** art option **D "動漫 Anime Cel"**, with B's 布袋戲 stage frame for boss fights, C's neon only in 西門町 / 士林夜市 / MRT cars, and A's technical rules (sprite contract, pre-baked night grades, performance budget, visual QA).
- **Platform:** a mobile-first static web app (React 18 + TypeScript + Vite + Tailwind), deployed to GitHub Pages at `https://sean1093.github.io/baokaka-adventure/`. Portrait phones first (390×844 is the reference viewport).

### Source-of-truth documents

| Topic | Document | Notes |
|---|---|---|
| Story structure, systems, maps, flags, foes, items, balance targets | [`docs/story/story-bible.md`](../story/story-bible.md) | § 3 *Systems the story needs*, § 3.1 *月亮線*, § 3.2 *New small mechanics*, § 4 chapters, § 5 foes, § 6 items, § 7 progression, § 7b side quests, § 9 topical jokes |
| Every in-game line | [`docs/story/script.md`](../story/script.md) | One `### key` = one entry in `EVENTS`. The notation table at the top maps lines to `Step`s |
| Art direction | [`docs/art/art-direction.md`](../art/art-direction.md) | The single art source of truth for option D (finalised 2026-10-18; the art director may still refine it). Always read the latest version on `main` before any art or UI work. Issues cite its sections by number and name (e.g. **§ 4.2 Location table**); if a number has moved, go by the name |
| Art options and the chosen style | [`docs/art/options/README.md`](../art/options/README.md), [`docs/art/options/d-anime/`](../art/options/d-anime/) | D is chosen. The SVG/HTML files are references to port, not to trace |
| The current engine's design (being replaced in content, kept in architecture) | [`docs/superpowers/specs/2026-09-07-baokaka-xia-design.md`](../superpowers/specs/2026-09-07-baokaka-xia-design.md) | Pure-function engines, data-driven maps, validate + sim tests |

If the story bible and the script disagree, **the script wins for wording and the bible wins for structure** (flags, maps, stats). If a document is internally inconsistent (some are; the issues list the known cases), make the smallest sensible choice, note it in the PR description, and append it to [`decisions.md`](decisions.md).

### Architecture in one paragraph

`src/quest/engine/` is pure TypeScript with no React: `types.ts` (data contract), `maps.ts` (map data), `events.ts` (scripts), `heroes.ts`/`foes.ts` (stats, skills, items), `scene.ts` (script runner), `quest.ts` (the run reducer), `battle.ts` (battle reducer), `path.ts`/`iso.ts` (movement, projection), `save.ts`, `validate.ts` (content linter, run at dev start and in tests) and `sim.ts` (scripted playthroughs for balance). `src/quest/screens` and `src/quest/components` are dumb React views over that state; `src/quest/QuestScreens.tsx` picks the screen for the current view, and `QuestGame.tsx` adds storage and music around it. `src/artlab/` is the dev-only art lab (§ 5). `src/art/` holds all drawing code (inline SVG, no bitmaps). Keep that split: **new mechanics go into the engine as pure functions with unit tests first, then the UI renders them.** As the redesign grows, content may be split into per-chapter files (e.g. `src/quest/content/ch01.ts`) so PRs stay reviewable.

---

## 2. The process: issue → PR → self-review → merge → deploy

Work is tracked as GitHub issues on `sean1093/baokaka-adventure`, ordered in [`roadmap.md`](roadmap.md) and in the epic issue. A staff engineer agent takes **one issue at a time, in order**. Agents can disconnect at any moment, so every issue is written to be self-contained, and every step leaves the repo in a consistent state.

1. **Pick** the lowest-numbered open issue in the roadmap whose dependencies are all closed. Comment on the issue: "Picking this up" (so a reconnecting agent knows).
2. **Sync** the working branch: `git checkout claude/cool-maxwell-my8tf1 && git fetch origin && git merge --ff-only origin/main`. The branch must equal `main` before starting.
3. **Read** the issue, every doc section it links, and the code it names. Read the latest `docs/art/art-direction.md` for any art or UI work.
4. **Implement** on `claude/cool-maxwell-my8tf1`. Commit in small logical steps (see conventions). Push often (`git push -u origin claude/cool-maxwell-my8tf1`) so work survives a disconnect.
5. **Verify** locally: `npm test`, `npm run build`, `npm run sim` (when balance or content changed), and the visual check (`npm run visual`, see § 5) for anything visible.
6. **Open a PR** from `claude/cool-maxwell-my8tf1` to `main`. Title = conventional commit style summary; body = what/why, `Closes #N`, test evidence, screenshots (390×844) for UI/art work, any doc inconsistencies you resolved, and the Claude Code footer.
7. **Self-review** the diff on GitHub as if reviewing a colleague: correctness, scope creep, tests, leftover debug code, secrets, file size limits, zh-Hant text ≤ 40 characters per dialogue line. Leave a review (a `COMMENT` review is fine; GitHub does not allow approving your own PR). Fix anything found and push.
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
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`. Art and UI work use `feat(art):` / `feat(ui):`. Scopes in use: `engine`, `art`, `ui`, `content`, `ch01`…`ch14`, `mrt`, `audio`, `docs`.
- Imperative mood, subject ≤ 72 characters, a body that explains *why* when it isn't obvious.
- Every commit message ends with the two attribution lines given in the session's instructions (currently `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and a `Claude-Session:` link).
- PR descriptions end with the Claude Code footer given in the session's instructions.

### Language
- **Issues, PRs, commit messages, code comments, identifiers and docs: English.**
- **In-game text: Traditional Chinese (zh-Hant)**, copied from `docs/story/script.md`. Hokkien flavour exactly as written there. Dialogue lines are at most 40 characters.
- Dev-facing strings (validator errors, test names) are English.

### Code
- Engines stay pure (no React, no `Date.now()`, no `Math.random()`; use `shared/random.ts` seeds).
- Content is data. Prefer adding a table (e.g. `STATIONS`, `DERIVED`, `QUESTS`) over special-case code.
- `validate.ts` must know about every new content shape; add a check whenever you add a field.
- Art: inline SVG only, no bitmaps; tokens from `src/art/palette.ts` only; no runtime SVG filters on anything that moves; ids via the unique-id helper. Follow the latest `docs/art/art-direction.md`.
- Accessibility: tap targets ≥ 44px (battle buttons 70px), body text ≥ 17px (dialogue 21px), `prefers-reduced-motion` respected.
- No new runtime dependencies without a decision entry. Dev dependencies for tooling (e.g. Playwright, pixelmatch) are fine.

### Labels
`epic`, `engine`, `art`, `ui`, `content`, `chore`, `docs`, `audio`, `qa`, `balance`, `chapter-1` … `chapter-14`, `post-game`, `mrt`.

---

## 4. Definition of done

An issue is done when **all** of these are true:

- [ ] Every acceptance criterion in the issue is met (tick them in the PR description).
- [ ] `npm test` passes (unit tests, `content.test.ts` → `validateQuestContent()` returns no errors, `sim.test.ts`).
- [ ] `npm run build` passes (`tsc -b` with no errors, Vite build succeeds).
- [ ] New engine behaviour has unit tests; new content passes `validate`; balance-affecting changes keep `sim.test.ts` green and the `npm run sim` report is pasted in the PR.
- [ ] **UI or art changes:** screenshots at **390×844** (and 375×667 where layout is tight) are attached to the PR, produced by `scripts/visual-check.mjs` (from issue #4 on). New sprites show their art-lab crop at map, battle and portrait size.
- [ ] No console errors in the browser on the screens touched.
- [ ] Docs updated where behaviour changed (this folder, code comments, the roadmap status). Doc inconsistencies you resolved are written in `decisions.md`.
- [ ] The PR is merged to `main` with the "merge" method, the deploy workflow is green, the branch is fast-forwarded to `main`, and `process-log.md` has an entry.

### `main` is always playable
Every merge deploys to the public site. During the rebuild the game must always start and be playable to the end of the latest finished chapter, which ends on a 「未完待續」 card (see `decisions.md`, D-11). Never merge a PR that leaves the title screen broken.

---

## 5. Visual QA

Every UI or art PR attaches screenshots made with this tooling (issue #4; decisions D-13, D-18, D-21; art direction § 8.6 *Visual QA*).

### The art lab: `#/artlab` (dev builds only)

Run `npm run dev` and open `http://localhost:5173/baokaka-adventure/#/artlab`. In a production build the hash shows the game, and the art lab code is not in the bundle at all (`src/App.tsx` drops the lazy import when `import.meta.env.DEV` is false).

- **Tokens** (`section=tokens`): every palette token, the night clock's sky at nine times with the graded ground and characters, the web fonts with their load state, and the UI contrast table.
- **Rig** (`section=rig`, `skeleton=1` for the joint overlay, `state=attack|hurt|ko|victory|walk`): the option D rig test figure (`src/art/demo/RigDemo.tsx`) at the four LODs on night and parchment, its silhouettes, expressions and rig states, the shared `<ArtDefs/>` gradients, the placeholder sprite of each kind at battle and map size, and the § 8.2 element/byte budget per LOD.
- **Map** (`section=map`, since #13): the iso test map (`src/artlab/testMap.ts`: lamps, a lantern, a window, two neon signs on a `neon` map, a moon glint, ripples and fireflies) at 00:00 / 03:00 / 05:15 with the sky behind, the `SkyLayer` from midnight to sunrise plus the interior room, and every tile material at the three times.
- **Sprites:** every `SpriteName` at 48, 64, 124 and 300 px on light, night and brick backgrounds, plus a black silhouette row. Option D sprites are drawn at the LOD for the cell size (48 icon, 64 map, 124 battle, 300 portrait); legacy sprites ignore `lod`.
- **UI kit** (`section=ui`, since #12): every `src/components` kit piece on its own in each state: panels, buttons (pressed, disabled), chips, command buttons, bars (low, critical, lag, heal), the command panel, list rows and switches, a dialogue box frozen half typed, the departure clock and a chapter card.
- **Screens:** named fixtures (`ARTLAB_FIXTURES` in `src/artlab/fixtures.ts`): title, world, dialogue (摩卡's bust, a key term, page dots), dialogue-npc, dialogue-choice, chapter-card (00:00 with its clock), chapter-card-0515 (dawn), chapter-card-reduced (減少動態 on), battle (three heroes), battle-4-heroes, victory, shop, menu, menu-settings, party-sheet-equip (bag with signature gear picked), travel-screen (the 路線圖 with 3 lit, 1 new and 10 locked stations), defeat, ending. Each renders the real `QuestScreens` over a live reducer, so you can also play on from it. Add a fixture when you add a screen; the visual check picks it up automatically.
- **URL parameters:** `section=tokens|rig|ui|map|sprites|fixtures`, `only=<sprite names, comma separated>` or `only=<one fixture>`, `bg=light,night,brick,silhouette`, `size=48,124`, `still=1` (freezes animations). Example: `#/artlab?section=sprites&bg=night&size=124&only=baokaka`, `#/artlab?section=fixtures&only=battle&still=1`.

### Screenshots and baseline diffs: `npm run visual`

```sh
npm run visual          # start a dev server, screenshot, diff against tests/visual-baseline/
npm run visual:update   # same, but accept the new screenshots as baselines
node scripts/visual-check.mjs --serve --only title,battle   # a subset
node scripts/visual-check.mjs --serve --perf                # also measure frame times (report only)
node scripts/visual-check.mjs --serve --perf --perf-fixture world-follower --only title   # walk the park instead
node scripts/visual-check.mjs --url http://localhost:5173/baokaka-adventure/   # use a server you started
```

- Targets are listed in `scripts/visual-targets.mjs` (`title`, `artlab-sprites-night`, `artlab-tokens`, `artlab-rig`, `artlab-ui`, `artlab-map`) plus every art lab fixture. Each is shot at **390×844** and **375×667** (2× pixel ratio, mobile, touch, reduced motion) after `document.fonts.ready` and once the DOM has been still for 0.5 s.
- PNGs go to `artifacts/visual/<viewport>/<name>.png` (gitignored). Diff mode compares against `tests/visual-baseline/<viewport>/` with pixelmatch (threshold 0.1) and fails when more than 0.5 % of pixels differ, writing `<name>.diff.png` next to the screenshot. It also fails on console errors.
- **When a PR changes visuals on purpose,** run `npm run visual:update` in the same PR and say so in the PR body. Baselines will churn a lot in M2/M3; that is expected.
- **Attaching to a PR:** copy the relevant 390×844 PNGs from `artifacts/visual/390x844/` to `docs/screenshots/<issue>/`, commit them, and link them in the PR body.
- `--serve` starts a Vite **dev** server (not `vite preview`), because the art lab only exists in dev builds; `--url` pointed at a production preview runs only the non-art-lab targets.
- **Browsers:** the agent environment has Chromium preinstalled (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). Elsewhere run `npx playwright install chromium` once. `npm ci` never downloads browsers (the `playwright` package has no install script), and the deploy workflow never runs this check.
- **Fonts.** Since #10 the game uses web fonts from Google Fonts, so the check needs network access to `fonts.googleapis.com`/`fonts.gstatic.com`; without it screens fall back to system fonts and diff. Baselines were made in the agent environment (Linux Chromium); emoji and font rendering still differ slightly across OSes, so on another machine run `npm run visual:update` first and don't commit those baselines.
- **`npm run check:ui`** (`scripts/ui-check.mjs`, #12) checks in the browser that dialogue typing never changes the box height, that every visible button/link/switch/tab on every fixture is at least 44×44 px (battle commands exactly 70 px) at both viewports, and that reduced motion (the OS setting, and the 「減少動態」 toggle via `chapter-card-reduced`) leaves no looping, flipping or drawing animation running. Run it with the visual check for UI work.
- **`--perf`** walks the party around the `world` fixture (or `--perf-fixture <name>`) at 4× CPU throttle for 3 s and prints the median/p95/max rAF interval, the main-thread time per frame (CDP `TaskDuration`), the DOM node count, the number of ground SVGs and how many times the ground was mutated while walking (must be 0, #13) against art direction § 8.5. It runs on the dev build (React development mode), so numbers are pessimistic, and rAF intervals bottom out at the 16.7 ms vsync floor. It reports only; #57 makes it a gate.
