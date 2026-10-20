# M1 playtest results

> **Status: awaiting the playtest.** The kit is ready ([`README.md`](README.md)); this file is filled in after the session, then merged with the owner's go/no-go (issue [#110](https://github.com/sean1093/baokaka-adventure/issues/110)).

## Session

| | |
|---|---|
| Dry run (date, who by role, what broke) | |
| Session date | |
| Phone(s) / OS | |
| Testers (roles only) | G1 · C1 (age __) · P1 · P2 |
| Observer | |
| Sound | on / muted session: |

## § 8 gates

One row per gate; "pass" needs the target met. Each tester's numbers come from their sheet (part E) and device log.

| Gate | Target | G1 | C1 | P1 | P2 | Result |
|---|---|---|---|---|---|---|
| Grandparent completes 0-1 unaided | ≤ 90 s | | — | — | — | |
| Grandparent completes the prologue | ≤ 12 min, ≤ 2 hint uses | | — | — | — | |
| Child explains Baokaka's rule after the prologue | yes | — | | — | — | |
| Predictions on 1-2 and 1-4 | ≥ 70 % correct overall | | | | | |
| Hint level 3 on ch1 pages | ≤ 1 page per player | | | | | |
| Laughter / reaction at the first Mocha push (0-3) and the first cry (0-4) | ≥ 3 of 4 testers | | | | | |
| Voluntary replay for 淘氣 / 土地公 | ≥ 1 of 4 testers | | | | | |
| Median time per page, ch1 | 1–3 min | | | | | |
| Stuck > 2 min without hints | 0 | | | | | |

**Technical gates** (from CI and devices): every page lint / replay / solver / 0 dead ends — CI green; solver suite < 60 s — CI; ≥ 55 fps on a 2021 mid-range Android — (measure on the session phone if it is one); first interactive page on 4G ≤ 3 s — `npm run check:prod` reports; resume ≤ 2 taps — `check:prod`.

## Watch-points

Summarise what the sheets say for each watch-point ([`README.md`](README.md) § 6 and [`ai-playtest.md`](ai-playtest.md)): sound, reading load, the tutorial delay, the sticker card, the word card, 0-3's table, 0-4's order, 1-1's sway tab / bubbles / straps / backpacker style, 1-2's pigeon, 1-3's counter, 1-4's turn, 1-5's Mocha tap, 1-6's pigeon motive, landscape use, the farewell note.

| Watch-point | What we saw | Action |
|---|---|---|
| | | |

## Release-level signals

- Did the family play together on the sofa?
- Did 阿嬤 ask to play again (the next day)?
- Did anyone show the album to someone?

## Decision

- **Owner's go / no-go:**
- **Date:**
- Recorded in `docs/project/decisions.md` as D-__.

## Follow-up issues

Every failed gate becomes an issue (linked here and added to `docs/project/roadmap.md`). Fix in M1 before chapters 2–10 start.

| Issue | Gate / watch-point | Status |
|---|---|---|
| | | |
