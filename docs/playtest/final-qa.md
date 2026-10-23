# Final QA checklist (#138)

The release gate's checklist: issue [#138](https://github.com/sean1093/baokaka-adventure/issues/138) scope, GDD [§ 8](../design/gdd.md#8-success-metrics) and [§ 1.3](../design/gdd.md#13-audience-rules-hard-requirements-every-feature-must-pass-them). Part 1 is automated and was run on the release candidate on 2026-10-23 (branch `claude/cool-maxwell-my8tf1`, the #138 PR, on top of `main` at #222). Part 2 needs real phones and people; the owner runs it from [`launch-checklist.md`](launch-checklist.md) (繁體中文) and records it in [`beta-results.md`](beta-results.md). The owner signs off when both are green (`docs/project/decisions.md`).

## 1. Automated (done)

| # | Item | How | Result |
|---|---|---|---|
| 1 | Unit tests, every page's lint, solution replay and complete solve, hints | `npm test` | **Pass**: 105 files, 4,135 tests (incl. the new "level 3 at a person's pace" per page and the art-gap gate) |
| 2 | Types and production bundle | `npm run build` | **Pass**: `index.js` 1,206 KB (340 KB gzip), `index.css` 112 KB (20.5 KB gzip), hint worker 172 KB; `dist/` 31 MB in 1,685 files (28 MB WebP art, loaded page by page; 1.1 MB fonts, loaded by `unicode-range`) |
| 3 | **Every page completable without hints** (the authored solution) and **with hints** (level 3 from the start, from one move away, from 20 wandered states per chapter, and at a person's pace) | `npm run solve`, `pages.test.ts`, `hints.test.ts` | **Pass**: 66 pages green, 0 dead ends, 0 soft traps, 0 reachable decoys, 17–21 s of the 60 s budget; two band warnings kept on purpose (0-3, 1-5; D-107) |
| 4 | **Every sticker earnable**: 淘氣 and 土地公 reachable on every page | `npm run solve` (淘氣 / 土地公 columns), `check:play` (`stickers-c1p2`, `bonus-open`) | **Pass**: ✓ / ✓ on all 66 |
| 5 | **Every photo frame**: the spread, the photo moment and the album page of chapters 1–10 and page E | `check:play` `photo-spread` … `photo-spread-c10`, `ending`, `album-flip`; visual fixtures | **Pass** |
| 6 | **Zero placeholder art keys** in the production build | `npm run art:report`, `env.test.ts` (art-gap gate, D-109) | **Pass**: 0 gaps; every page ≤ 350 KB of art; first load 1,357 KB of 2,560 |
| 7 | Screens at both viewports | `npm run visual` (387 targets × 390×844 and 375×667) | **Pass**: 774 / 774 against the baselines, no console errors |
| 8 | Text size, contrast, hit areas, named controls, reduced motion and flashing | `check:ui --popup` (350 fixtures × 2 sizes) | **Pass** |
| 9 | **大字 / 長輩模式** | `UI_TEXT=big check:ui --popup` (350 fixtures × 2 sizes, ≥ 24 px) | **Pass** |
| 10 | Every page and flow played with mouse and touch at both sizes; **save / resume**, the album, the bonus page, the ending | `check:play` (92 scenarios × 4 = 368 runs) | **Pass** |
| 11 | **Frame rate and animated nodes** (production build, 4× CPU throttle) | `npm run check:perf` (25 `PERF_PAGES`) | **Pass**: 57.3–59.7 fps, worst 1 s ≥ 47.8, ≤ 149 animated nodes (budget 150: 8-6, 2-6 and 4-5 are within 3) |
| 12 | **Production smoke test**: routes, first launch, returning player, **old RPG saves on a fresh device**, upright guard, notch insets, 4G budgets | `npm run check:prod` | **Pass**: cover 1.5 s and 0-1 2.0 s on throttled 4G (≤ 3 s), first load 600 KB, no later chapter fetched, the RPG save deleted with the farewell shown once |
| 13 | **Muted play** (R9) | every headless run above plays without audio | **Pass** (by construction) |
| 14 | **Reduced motion** | `check:ui` (the OS setting and 減少動態), `check:perf` (no live grain, no `preserve-3d`) | **Pass** |
| 15 | **AI end-to-end playthrough** (cover → post-credits, production build) and a 長輩模式 + 大字 run at 375×667 | [`ai-playtest.md`](ai-playtest.md) § The whole game on hints | **Pass** after the hint fix (friction #18) |
| 16 | Open bugs labelled `bug` for the release | GitHub issues | **0** (open: #78 epic, #110, #111, #138) |
| 17 | `check:ui`'s RPG part (`src/quest/` art lab) | `check:ui` without `--popup` | **Known**: times out on the art lab's `chapter-card-reduced`, on `main` as well (#136's log). The RPG is in no route or production chunk; its checks go with #111. |

## 2. Needs phones and people (owner)

From [`launch-checklist.md`](launch-checklist.md); results in [`beta-results.md`](beta-results.md).

| # | Item | Where in the checklist |
|---|---|---|
| 1 | Frame rate with a real GPU on a 2021 mid-range Android and an iPhone | A2 · 5 |
| 2 | Low power turns on, recovers once, then stays on | A2 · 6 |
| 3 | 震動 pulses on Android (iOS Safari has none) | A3 · 8 |
| 4 | 書本傾斜 and iOS's motion permission | A3 · 9 |
| 5 | Notch: the installed app's HUD and bar inside the insets | A3 · 10 |
| 6 | Upright guard on a real phone | A3 · 11 |
| 7 | A muted chapter on a phone | A3 · 12 |
| 8 | Save / resume across app switches and the lock screen | A3 · 13 |
| 9 | **Offline after first load**: there is no PWA cache (no service worker, by design so far); a chapter already open plays offline, the next one needs the network | A3 · 14 |
| 10 | 長輩模式, 大字, 左手模式, 減少動態, volumes, 重新開始 on a phone | A4 · 15–19 |
| 11 | An old RPG save on a real phone | A4 · 20 |
| 12 | The family beta: the § 8 release signals and the watch-points | B |
| 13 | Sign-off of #110 and #138 | C |

## 3. Deployment verification

- The deploy workflow (`.github/workflows/deploy.yml`: `npm ci && npm test && npm run build`, then GitHub Pages) runs on every merge to `main`. The release candidate's run (the #223 merge, `d5b462b`): [run 105](https://github.com/sean1093/baokaka-adventure/actions/runs/39961054630), **success**.
- Live smoke test: `check:prod` runs the same checks on the identical production build; the live host (`sean1093.github.io`) is not reachable from the agent container, so the live site itself is checked by the owner's device pass (launch checklist A1).
