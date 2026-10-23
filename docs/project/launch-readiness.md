# Launch readiness — 《翻翻台北》 Pop-Up Taipei

**Status (2026-10-23): ready for the owner's device pass and family beta.** Everything that can be checked without real phones and people is done and green on the release candidate. Launch waits on three things only the owner can do: the device pass, the family beta, and the sign-off of #110 and #138. Then #111 deletes the old RPG and #138 and the epic #78 close.

Live site: <https://sean1093.github.io/baokaka-adventure/> · Issue: [#138](https://github.com/sean1093/baokaka-adventure/issues/138) · Epic: [#78](https://github.com/sean1093/baokaka-adventure/issues/78)

## 1. What ships

- **The whole book:** the prologue (4 pages), chapters 1–10 (6 pages each), page E (抓周), the credits and the post-credits, plus the bonus page 「象山的日出」 once every 土地公 is found: 66 registered pages.
- **Systems:** Baokaka's autonomous AI and Mocha; 8 words and the growth stages through the first steps; tabs, wheels, flaps, sliders, cranks, carriers, linked mode; the three-step hint ladder (solver in a worker); stickers (解開 / 淘氣 / 土地公); the chapter spreads, photo moment and album with the family's notes; save and resume; settings (長輩模式, 速度, 大字, 自動提示, 音效, 音樂, 震動, 減少動態, 左手模式, 書本傾斜); synthesised sound; the upright guard, safe-area insets and low power; the old RPG's saves cleared with a farewell note.
- **Art:** v2 anime character bitmaps from the family's photos and pop-up paper environments baked to WebP, every key its own (0 placeholder art keys).

## 2. Release gates

| Gate (GDD § 8, § M5; #138) | Status | Evidence |
|---|---|---|
| Every page: lint, replay, solvable, 0 dead ends, 淘氣 and 土地公 reachable | ✅ 66 / 66 | `npm run solve`: 0 dead ends, 0 soft traps, 0 reachable decoys |
| Full solver suite < 60 s | ✅ 17–21 s | `npm run solve` |
| Hint level 3 finishes every page (from the start, wandered states, and at a person's pace) | ✅ | `hints.test.ts` (the pace test is new: D-109) |
| Zero placeholder art keys | ✅ 0 | `npm run art:report`, `env.test.ts` art-gap gate (D-109) |
| Page art ≤ 350 KB, first load ≤ 2.5 MB | ✅ largest page 326 KB (5-1); first load 1,357 KB (art report), 600 KB transferred to the cover (`check:prod`) | `art:report`, `check:prod` |
| First interactive page on 4G ≤ 3 s | ✅ cover 1.5 s, 開始 → 0-1 2.0 s (throttled 4G) | `check:prod` |
| ≥ 55 fps on each chapter's heaviest pages | ✅ 57.3–59.7 fps headless at 4× CPU throttle (a floor) · ⏳ real 2021 Android | `check:perf` · owner's device pass |
| ≤ 150 animated nodes | ✅ max 149 (8-6) | `check:perf` |
| Text ≥ 20 px (≥ 24 px 大字), contrast, hit areas ≥ 48 px, named controls | ✅ 350 fixtures × 2 sizes × (standard, 大字) | `check:ui --popup`, `check:ui:big` |
| Reduced motion, no flashing > 3 Hz | ✅ | `check:ui` |
| Resume to the current page ≤ 2 taps | ✅ one tap (「繼續」) | `check:prod`, `check:play` |
| Every screen at 390×844 and 375×667 | ✅ 774 / 774 | `npm run visual` |
| Every page and flow plays (mouse, touch, both sizes) | ✅ 368 / 368 runs | `check:play` |
| An AI first-time playthrough of the whole game | ✅ cover → post-credits on the production build; 長輩模式 + 大字 at 375×667 for the prologue and chapter 1 | `docs/playtest/ai-playtest.md` |
| Deploy of the release candidate | ✅ [run 105](https://github.com/sean1093/baokaka-adventure/actions/runs/39961054630) (the #223 merge) | GitHub Actions |
| Zero open bugs for the release | ✅ 0 open issues labelled `bug` | GitHub |
| Device pass (Android + iPhone) | ⏳ owner | `docs/playtest/launch-checklist.md` A |
| Family beta: sofa play, 阿嬤 asks again, the album shown to a relative | ⏳ owner | `launch-checklist.md` B → `docs/playtest/beta-results.md` |
| Owner sign-off of #110 (M1) and #138 (launch) | ⏳ owner | `launch-checklist.md` C → `decisions.md` |

The full checklist with commands and numbers is [`docs/playtest/final-qa.md`](../playtest/final-qa.md).

## 3. Fixed in #138

| What | Why it mattered | Decision |
|---|---|---|
| **Hints that survive a person's pause.** Level 3 looped forever on 4-1 (and 3-4, 4-5, 4-6, 5-1, 7-1, 8-1): the solver's first move gained something for a single tick, and only a second move within that tick kept it. A hint's move is now checked after a 4-tick pause and replaced when its gain doesn't last. | The hint ladder is the grandparents' safety net; it must finish every page for a person, not only for a test. | D-109 |
| **The art-gap gate.** A test and `art:report` fail on any backdrop, part, cut-out, carriage or creature drawing a stand-in; the two intended live drawings (the kit's pull tabs, the drawn carriages) are named. | Turns M5's "zero placeholder art keys" into CI. | D-109 |
| **`chapter-end-c1`'s flaky text size.** The end layer stopped animating in stills; `check:ui` waits for one-shot entrances before measuring. | A flaky gate erodes trust in every gate. | D-109 |

## 4. Known limits (accepted for launch)

- **No offline cache.** There is no service worker: a chapter already open keeps working offline; the next chapter's art needs the network. The manifest makes it installable to the home screen.
- **No vibration on iPhone** (iOS Safari has no `navigator.vibrate`).
- **Portrait only**; turning the phone shows 「請把手機轉直，再繼續玩喔」.
- **The main JS chunk is 1.2 MB** (340 KB gzip). It loads in budget on 4G (`check:prod`); splitting it is a post-launch nicety.
- **The old RPG stays in the repo** (`src/quest/`, in no route and no production chunk) until #111 after the sign-off; its `check:ui` part times out on one art-lab fixture and goes with it.
- **Close to budget:** 8-6 runs 149 of 150 animated nodes; 2-6 and 4-5 run 147.

## 5. What the owner does next

1. **Device pass** (≈ 1–1.5 h): [`docs/playtest/launch-checklist.md`](../playtest/launch-checklist.md) part A, on a 2021 mid-range Android and an iPhone.
2. **Family beta** (a relaxed weekend): part B; results into [`docs/playtest/beta-results.md`](../playtest/beta-results.md) or a comment on #138.
3. **Sign off** #110 and #138 (part C). An engineer then records the sign-off in `decisions.md`, runs #111 (delete the RPG), and closes #138 and #78.

The release note for the owner, in 繁體中文: [`docs/playtest/release-notes-zh.md`](../playtest/release-notes-zh.md).
