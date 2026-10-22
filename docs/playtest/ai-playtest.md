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

## Later chapters (#137), 2026-10-22

The engineer on #137 played a sample of the later chapters the same way, to look for confusing pages before the family beta (#138): the **production build** (`vite preview`) at **390 × 844** (2× DPR, touch through CDP, Chromium), each page entered from the cover's 「繼續」 with a save that had every earlier page solved, played **from screenshots**, touching what looked touchable, 提示 only when stuck. 13 pages: 7-4 → 8-5 in a row, then 9-4 → 9-6 and 10-3 → 10-4. The same limits apply as above (the player had read the GDD outlines; silent; a model's think time per step), and a few of its screenshots were lost mid-run, so the touch counts for 7-4 – 8-4 are from its command log. Screenshots: [`docs/screenshots/137/`](../screenshots/137/).

| Page | Par | Gestures | 提示 | What happened |
|---|---|---|---|---|
| 7-4 水晶車廂 | 3 | 6 | — | Opened all three clouds before the one that mattered, 哇！ the lamp, folded the seat (twice). |
| 7-5 大茶壺 | 4 | 7 | — | Sent Mocha across before the pool was drained (he won't: wet, C7), then turned the teapot both ways to find the levels. |
| 7-6 菜園的芹菜 | 4 | 5 | — | 不要！ the moon, Mocha into the basket, 抱抱 the bear, Mocha to the fence post; the photo. |
| 8-1 新北投支線 | 3 | 3 | — | Par play. |
| 8-2 地熱谷 | 4 | 5 | — | One valve the wrong way first. |
| 8-3 呼呼 | 2 | 2 | — | The learn beat and 咻—— read at once. |
| 8-4 北投圖書館 | 4 | 4 | — | Par play. |
| 8-5 大浴池 | 5 | ≈ 8 | L1, L2 | Two drags on the tap wheel did nothing (a direction it couldn't go, or too short to reach the next stop); L2's arrow showed the turn. Half → full → half again then read naturally. [01](../screenshots/137/01-c8p5-l2-turn-hint.jpg), [02](../screenshots/137/02-c8p5-full-tub-drifts.jpg) |
| 9-4 漁人碼頭 | 4 | 6 | — | Tapped the kiosk's paw at high tide first (the stones under water: Mocha can't); the dial's dawn showed the stones. [03](../screenshots/137/03-c9p4-low-tide-stones.jpg) |
| 9-5 淡江大橋 | 4 | 4 | — | 飛機！ the gulls, then Sol Sol La read straight off the 維修平台 sign. Clear. |
| 9-6 碼頭的聽診器 | 5 | ≈ 6 | L1, L2, L3 | Mocha into the basket and 咻—— swung it aboard; a second 咻—— did nothing. L2 「試試看說話」 names no word (by design: L3 shows it); L3 said 飛機！ to the gulls. [04](../screenshots/137/04-c9p6-l2-say-something.jpg), [05](../screenshots/137/05-c9p6-photo.jpg) |
| 10-3 八節 | 5 | 3 + 4 | L1, L2, L3 ×4 | Turned the crank, put Mocha on the upper rim and cranked again: a step backwards (L1 sent Mocha back to the window-washer's cradle). The sections' facets and ledges are hard to read as one machine; L3 finished it. [06](../screenshots/137/06-c10p3-hint-undo-mocha.jpg) |
| 10-4 阻尼球 | 5 | 1 + 3 | L1, L2, L3 ×3 | The first 咻—— swung the sphere (with Mocha) out to the far side, not back to him; that each 咻—— moves it one stop on, and from the far side all the way back, is only learned by trying. [07](../screenshots/137/07-c10p4-l2-say-again.jpg) |

**The pattern:** every par-5 page it played needed 提示 (8-5, 9-6, 10-3, 10-4), and no page at par ≤ 4 did. The difficulty curve ([`docs/project/difficulty.md`](../project/difficulty.md)) has 5 pages at par 5, all in chapters 8–10 (8-5, 8-6, 9-6, 10-3, 10-4); a sixth, 9-2, sat in a page-2 slot and #137 tuned it to par 4 ([08](../screenshots/137/08-c9p2-tuned-start.jpg), [09](../screenshots/137/09-c9p2-tuned-cat.jpg)).

**Friction to watch in the beta** (none was a bug; nothing cheap to fix without guessing):

| # | Where | What | Severity |
|---|---|---|---|
| 13 | 8-5, 9-4, 7-5 (wheels that set a level) | Which way the wheel turns the level up or down is learned by trying; a turn past the last stop does nothing visible. | Medium |
| 14 | 10-4 | The pendulum's rule (one stop on per 咻——, then all the way back) is discovered, not shown. | Medium |
| 15 | 10-3 | The three sections, their ledges and which one Mocha holds read as separate things; the hardest page of the book (by design, D-97). | Medium |
| 16 | 9-6 (any L2 on a word) | L2 says 「試試看說話」 without the word; L3 shows it. | Low |
| 17 | Sticker card → next page | The card turns to the next page on its own after a few seconds; a tap meant for the card that lands just after it left acts on the new page (here, on 10-4's sphere perch). A guard would need a design call on how long to ignore the first touch. | Low |
