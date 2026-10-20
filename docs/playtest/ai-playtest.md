# Automated first-time playthrough (AI playtest), 2026-10-20

Before the family session, the engineer on #110 played the whole slice on the **production build** (`npm run build`, `vite preview`), at **390 × 844** (2× DPR, touch through CDP, Chromium), from a **fresh save**, with the log on (`#/?debug=metrics`). It played the way a first-timer would: the cover's 「開始」, the cards, then each page by looking at the screenshot and touching what looked touchable, with **no hints first**. 提示 was used only when stuck. A second pass then played every page with **hints only** (提示 pressed until the page was done) to check the ladder on the production build.

**Read this with its limits.** The player had read the GDD and the page specs before playing, so it knows the rules a real first-timer doesn't. It played silently (no sound check). Its time per step includes a model's thinking time of 10–20 s, so its times are not comparable with the § 8 targets. Its findings are **things to watch** in the human session, not results. The gates are decided by [`m1-results.md`](m1-results.md).

Screenshots: [`docs/screenshots/110/`](../screenshots/110/).

## Results

**No-hint pass:** all 10 pages, the photo, the album, the chapter's end and the 目錄 completed without a crash or a console error. Four 淘氣 were found by accident: 0-2's newspaper, 0-3's 紅包, 0-4's 「把摩卡捲進窗簾」 (Mocha on the rod as the curtain closed) and 1-1's sway tab. Hints were used on 1-4 (L1 + L2, to see the turn hint) and 1-5 (L1, stuck after the lift went down).

| Page | Touches | 提示 | What happened |
|---|---|---|---|
| 0-1 | 1 | — | The 拉 tab is the loudest thing on the page; one pull solved it. |
| 0-2 | 2 | — | Tapped the newspaper first (淘氣, Dad's 「叫……爸爸……」), then the cushion. |
| 0-3 | 3 | — | Tapping Mocha did nothing visible. The shelf's 紅包 paw print → 淘氣. The table's paw print was found only via the 4 s ghost hand. |
| 0-4 | 6 | — | Opened the curtain first: he reached for the bead behind the closed door and never cried. Closing the curtain again was the fix; one tap meant for the curtain sent Mocha to the rod, so the close rolled her up in it (淘氣). |
| 1-1 | 3 | — | The 拉 sway tab: 淘氣, no progress. Tapped the decorative third strap (no response). The rack's paw print was not visible under the map. |
| 1-2 | 4 | — | Tab to half (the pigeon blocks), tapped the pigeon (nothing), Mocha to the pillar, tab to full. |
| 1-3 | 3 | — | Mocha to the robot first (no progress); the counter's paw print is under his thought bubble. Word card and 說話 tutorial clear. |
| 1-4 | 3 | L1, L2 | First turn and 嗶！ fine; the second turn (with him on it) after looking at L2. |
| 1-5 | 3 | L1 | After the lift went down, stuck; the bell paw print (unreachable) gave no response. L1 glowed on Mocha: tap Mocha solved it. |
| 1-6 | 4 | — | Lid → pigeon on the cart, 嗶！, cart left, Mocha to the awning → photo. |

**Hints-only pass:** every page reached `done` by 提示 alone. Presses to done: 0-1 3, 0-2 3, 0-3 3, 0-4 4, 1-1 3, 1-2 4, 1-3 4, 1-4 5, 1-5 4, 1-6 8 (the spread). On 1-3 the player must still tap the learn lines and the word card themselves.

**The log** (`debug=metrics`) recorded all 10 attempts, hints by level, auto nudges, touches and stickers, and its gate readings matched what happened ([screenshot](../screenshots/110/17-metrics-log.jpg)).

## Friction found (watch these first)

Severity is a guess at how much it might cost a real first-timer.

| # | Where | What | Severity | Screenshot |
|---|---|---|---|---|
| 1 | All pages | **Lines advance only when the line itself is tapped.** A tap elsewhere on the page does nothing to them (or touches the page). The page plays on under them. | Medium | [02](../screenshots/110/02-c0p1-intro-over-page.jpg) |
| 2 | Start | **Reading load:** the prologue card's 5 lines, then 0-1's 7 intro lines over the page (narration strip + 小小的雲's bubble over his thought bubble) before the first puzzle. 0-3 opens with 10 lines in 4 beats, three bubbles at once. | Medium | [01](../screenshots/110/01-prologue-card.jpg), [02](../screenshots/110/02-c0p1-intro-over-page.jpg) |
| 3 | Chapter cards, word card | No visible "tap to continue" mark; they wait for a tap. | Low–medium | [01](../screenshots/110/01-prologue-card.jpg), [10](../screenshots/110/10-c1p3-word-card.jpg) |
| 4 | 0-3 | The table's paw print (the solution) sits under the bead and his 「要！要！」 bark; only the ghost hand reveals it. Tapping Mocha herself gives no feedback. | Medium (first play has the tutorial) | [03](../screenshots/110/03-c0p3-table-perch-under-bark.jpg) |
| 5 | 0-4 | **Order trap:** curtain first → he reaches for the bead behind the closed door forever (no cry). The rolled curtain's 翻 seal sits beside the rod's paw print, so taps can go to the rod (that is how the 淘氣 happened by accident). | Medium–high | [04](../screenshots/110/04-c0p4-curtain-vs-rod-perch.jpg) |
| 6 | 1-1 | The two 廣播姊姊 intro bubbles cover the right strap and the rack until tapped away. The third strap looks like the perch straps but is decoration. The rack's paw print is not visible under the map. The 拉 sway tab is the most prominent control and only gives 淘氣. | Medium | [06](../screenshots/110/06-c1p1-lines-cover-perches.jpg), [07](../screenshots/110/07-c1p1-decoy-strap-rack-under-map.jpg), [08](../screenshots/110/08-c1p1-sway-mischief.jpg) |
| 7 | 1-1 | The backpacker's punchline (「Excuse me… where is 101?」 / Mocha's answer) appears as the page completes and folds; easy to miss. | Low | — |
| 8 | 1-3 | The counter's paw print, and the L1 glow on it, are under his thought bubble. | Medium | [09](../screenshots/110/09-c1p3-counter-under-bubble.jpg), [18](../screenshots/110/18-hint-ladder-l1-l2.jpg) |
| 9 | 1-4 | The L2 ghost hand swipes across the runner, with a dashed arc above; the turn itself is a drag along the rim. Watch whether players copy the swipe. | Low | [12](../screenshots/110/12-c1p4-hint-l2.jpg) |
| 10 | 1-5 | Once the lift is down there is no visible next step; a tap on a paw print Mocha can't reach (the bell) gives no response at all. L1 (glow on Mocha) solves it at once. | Medium (the issue's watch-point) | [13](../screenshots/110/13-c1p5-stuck-in-car.jpg), [14](../screenshots/110/14-c1p5-hint-l1-mocha.jpg) |
| 11 | 1-6 | The pigeon lands beside the 雞腿 when the lid opens, but nothing says it wants it (no peck, no look). | Low (the issue's watch-point) | [15](../screenshots/110/15-c1p6-pigeon-and-drumstick.jpg) |
| 12 | 1-6 | During the photo moment a subtitle bubble (「他說：『芝麻開門。』」) was left under the HUD, clipped at the left edge, its spring across the top. Visual bug. | Low | [16](../screenshots/110/16-c1p6-photo-stray-bubble.jpg) |

What worked well: the 拉 / 翻 / 推 / 轉 seals read at once; the thought bubble always says what he wants; the change-of-mind on 0-2 and the 淘氣 pops are clear; the cry on 0-4 looks soft (tears in the bubble, the train lights up); the 嗶！ learn beat and the 說話 tutorial hand are clear; L1 hints point at the right thing everywhere except 1-3 (#8).

None of these was fixed in #110. The sheet's part C has a line for each.

## Status after #183 (before the family playtest)

[#183](https://github.com/sean1093/baokaka-adventure/issues/183) fixed the clear ones before the family session, so the people test the design and not these bugs (D-74; screenshots in [`docs/screenshots/183/`](../screenshots/183/)). Still watch every point in the session: a fix is a guess until a person plays it.

| # | Status | What changed |
|---|---|---|
| 1 | **Fixed** | A tap anywhere on the page reads the lines on. A tap made while a line is up never acts on the page; a drag still plays under the line. |
| 2 | Left for the playtest | The reading load is unchanged (lines are quicker to clear now, #1). Watch it. |
| 3 | **Fixed** | The chapter card's lines and the word card show a small bobbing ▼. |
| 4 | **Fixed** | Perch paws draw over the bead, the barks, the thought bubble and the standees, with an ink edge; the bubbles keep off them. Tapping Mocha herself still does nothing (by design). |
| 5 | **Fixed** | 0-4 solves in either order: the bead glints on the train's step only once the cry lights the train, so curtain-first shows a dark train and nothing to want. The solver now fails any page with such a "soft trap". The 翻 seal and the rod's paw are unchanged (the accidental 淘氣 is a happy accident). |
| 6 | **Fixed** | 廣播姊姊's lines keep off the straps and the rack; the third strap is looped up with no ring; the rack's paw shows on the map. The sway tab is still the most prominent control (it is the 淘氣): watch it. |
| 7 | Left for the playtest | The punchline still plays as the page completes. |
| 8 | **Fixed** | The counter's paw and its L1 halo draw over the thought bubble, which now keeps off them. |
| 9 | Left for the playtest | The L2 turn hint is unchanged. |
| 10 | **Fixed** | A tap on a perch Mocha can't reach shakes the paw, and Mocha turns to it and says 「喵？」. On first play, 4 s after the car comes down, Mocha taps his paw on the panel, shimmers once and asks 「再按一次？」. |
| 11 | **Fixed** (cheap) | The pigeon faces the 雞腿 once it lands beside it. Whether that reads as "wants it" is still a watch-point. |
| 12 | **Fixed** | No line shows under the photo moment, and a bubble riding a character never leaves the page. |
