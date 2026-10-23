# Family beta and device pass: results (#138)

Filled in after the owner runs [`launch-checklist.md`](launch-checklist.md) (the device pass, part A; the family beta, part B). Roles only, never names (`G1` grandparent, `C1` child, `P1`/`P2` parents). Every failed row becomes an issue linked here and fixed before the launch sign-off.

**Status:** waiting for the owner (nothing recorded yet).

## A. Device pass

| Device | Browser | Date | Tester |
|---|---|---|---|
| Android (2021 mid-range): model … | Chrome … | | |
| iPhone: model … | Safari, iOS … | | |

| # | Check (launch-checklist A) | Android | iPhone | Notes / issue |
|---|---|---|---|---|
| 1 | Cover ≤ 3 s and page 0-1 ≤ 3 s on 4G | | | |
| 2 | First tap unlocks sound | | | |
| 3 | Fonts: no missing glyphs | | | |
| 4 | 繼續 resumes in one tap | | | |
| 5 | Frame rate on the `PERF_PAGES` | | | |
| 6 | Low power turns on, recovers once, then stays on | | n/a | |
| 7 | Heat and battery over 15 min | | | |
| 8 | 震動 pulses | | n/a | |
| 9 | 書本傾斜 (iOS permission prompt) | | | |
| 10 | Home-screen app: HUD and bar inside the notch insets | | | |
| 11 | Upright guard and resume | | | |
| 12 | Muted chapter readable (R9) | | | |
| 13 | Back from another app / lock screen | | | |
| 14 | Offline within the open chapter | | | |
| 15–20 | Settings: 長輩模式, album scroll at 大字, 左手模式, 減少動態, volumes and 重新開始, the RPG farewell | | | |

## B. Family beta

| Signal (GDD § 8) | Seen? | What happened |
|---|---|---|
| The family plays together on the sofa | | |
| 阿嬤 asks to play again the next day | | |
| Someone shows the album to a relative | | |

| Watch-point (launch-checklist B2) | Result |
|---|---|
| 1 · level wheels (7-5, 8-5, 9-4) | |
| 2 · 10-4's damper | |
| 3 · 10-3's sections | |
| 4 · 「試試看說『…』」 leads to 說話 | |
| 5 · a tap during the sticker card's turn | |
| 6 · 提示 alone finishes 3-4, 4-1, 4-5, 4-6, 5-1, 7-1, 8-1 | |
| 7 · favourite page, longest page, anyone stuck > 2 min without 提示 | |

Device logs (`#/?debug=metrics` → 複製 Copy), one block per tester:

```
(paste here)
```

## C. Follow-ups

| Issue | From | Status |
|---|---|---|
| | | |

## D. Sign-off

- [ ] #110 (M1 playtest) signed off by the owner: …
- [ ] #138 (launch) signed off by the owner: … (recorded in `docs/project/decisions.md`)
