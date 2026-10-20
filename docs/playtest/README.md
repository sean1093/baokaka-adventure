# M1 playtest kit: 翻翻台北, prologue + 台北車站

How to run the M1 playtest (issue [#110](https://github.com/sean1093/baokaka-adventure/issues/110); GDD [§ 8](../design/gdd.md#8-success-metrics), [§ M1](../design/gdd.md#m1-vertical-slice-prologue--台北車站--4-w-10-pages--a-spread-photo)). The slice is the go/no-go point for M2–M5. The owner signs off after the session, and the sign-off is recorded in `docs/project/decisions.md`.

| File | For whom | What |
|---|---|---|
| `README.md` (this page) | The observer | How to run a session, what to watch, when to step in |
| [`sheet.md`](sheet.md) | The observer, one copy per tester | The observation sheet: every § 8 gate, the prediction questions, laughs, hints and time per page, the watch-points |
| [`guide-zh.md`](guide-zh.md) | The family testers | One page in 繁體中文: what this is, what we ask of them, what we don't record |
| [`owner-guide.md`](owner-guide.md) | The owner | A short summary in 繁體中文: how to play, what to watch, how to report |
| [`ai-playtest.md`](ai-playtest.md) | Everyone | The automated first-time run (2026-10-20) and the friction it found: things to watch first |
| [`m1-results.md`](m1-results.md) | The owner | The results: filled in after the session, with the go/no-go and the follow-up issues |

## 1. Who and what

- **Testers.** At least **1 grandparent, 1 child aged 4–8, 2 parents** (GDD § 7 M1). They are recorded by **role only**: `G1`, `C1`, `P1`, `P2` (add `G2`, `C2` … as needed). **No names, no faces, no voices** go into any file in this repo.
- **What they play.** The live site, from a fresh save: the cover, the prologue's chapter card, 0-1 → 0-4, chapter 1's card, 1-1 → 1-6, the photo and album, the chapter's end and the 目錄. About 10–20 minutes per tester.
- **Observer.** One adult who is not playing, with this page, a printed or open copy of [`sheet.md`](sheet.md) per tester, and a clock. The observer sits beside or behind the player and watches the screen.

## 2. Before the session

1. **Dry run.** One adult plays the whole slice once with the observer, on the same phone, a day or more before. Fix anything that breaks the session (sound, the log, the phone's settings), not the puzzles. Note the dry run in [`m1-results.md`](m1-results.md).
2. **The phone.** A phone the testers are used to holding, if possible (the § 8 frame-rate gate names a 2021 mid-range Android; an iPhone is fine for the observed gates). Charged, brightness up, **Do Not Disturb on**, auto-lock off or long.
3. **Sound.** Volume at about 70 %. **On an iPhone the ring/silent switch must be on ring:** iOS mutes web audio when it is on silent. The first tap on the page unlocks sound (the cover's 「開始」 counts). The default levels are 音效 80 / 音樂 50.
4. **Open the game with the log on:** `https://sean1093.github.io/baokaka-adventure/#/?debug=metrics`. A small dark tab at the top centre shows the page and its time (for example `● 0-3 1:12`), with a ★ beside it. Only the observer uses it. Keep this address for the whole session (a bookmark or a home-screen shortcut opened from it); a reload keeps the log.
5. **A fresh save for each tester.** Before each tester: in the game, 設定 → 「重新開始」 (hold for 3 seconds). This clears progress only (the settings stay at their defaults unless someone changed them, so check 設定 shows 速度 普通, 自動提示 30 秒, 長輩模式 關). Then open the log (tap the dark tab), **複製 Copy** the previous tester's report into their sheet, and **清除 Clear** (tap twice).
6. **Landscape.** The game is portrait only and has no "turn your phone" notice (D-72 left it to this playtest). Lock the phone's rotation, and note if anyone turns the phone.

## 3. Running a session (per tester)

1. **Consent, in one sentence** (see [`guide-zh.md`](guide-zh.md)): we are testing the game, not them; they can stop at any time; we write notes with a role (not their name); nothing on the phone is sent anywhere. With a child, ask the parent first, then the child.
2. **Hand over the phone on the cover. Say only:** 「這是寶咖咖的新遊戲，你玩玩看。」 Then say nothing about how to play. Do **not** say "drag", "tap the cat", "the baby goes to what he wants", "press 提示", or read the screen aloud for them (a child who cannot read yet may ask an adult to read a line: read it as written, and note it).
3. **Watch and write.** Fill the sheet as you go: the time a page opens, the first touch, laughs, questions, wrong guesses, where they tap. Tap **★** on the log tab at any moment worth finding again (a laugh, a frown, a question); the report lists each ★ with its time and page.
4. **The prediction questions** (GDD § 6 risk 4; § 8 "≥ 70 % correct"): ask exactly as written on the sheet, on **1-2** (before their first touch, and before they pull the train tab) and on **1-4** (after the floor first turns). Write down the answer before they act, then whether it matched.
5. **The child's rule question** (§ 8): after the prologue's last page (0-4) folds and before chapter 1 starts, ask the child: 「寶咖咖都會往哪裡爬？為什麼？」 Write their words.
6. **Stop** at the 目錄 after chapter 2's 「未完待續」 card, or when they want to stop. If they ask, they may replay a page for its stickers: that is a § 8 signal, note it.
7. **After play, three questions** (on the sheet): what was fun, what was confusing, would they play again. Then copy the log.

### When to step in

The § 8 gate counts "stuck with no idea for > 2 minutes without using hints". So:

| Situation | What the observer does |
|---|---|
| Thinking, trying things, under 2 min without progress | Nothing. Silence is part of the test. |
| **2 min** with no progress and no 提示 press | Note the time on the sheet (this **fails the gate** for that page). Say only: 「下面的按鈕都可以按按看。」 |
| **4 min**, still stuck | Say: 「可以按『提示』喔。」 and note it. |
| Upset, bored, wants to stop | Stop the page or the session; never push. Note why. |
| Something breaks (a crash, no sound, the page frozen) | Help at once; note it as a bug, with the time and page. |

Hints, 重來 and the 選單 are part of the game: a tester using them on their own is **not** an intervention.

## 4. After the session

1. For each tester, paste the log report into part D of their sheet (or attach the downloaded `.md` file). The log only measures; the sheet holds what you saw and heard.
2. Fill [`m1-results.md`](m1-results.md): every gate across testers, the watch-points, the owner's go/no-go.
3. **Every failed gate becomes an issue** (GDD § 8; issue #110 requirement 2), linked from `m1-results.md` and added to `docs/project/roadmap.md`. Fix failures in M1 before chapters 2–10 start.
4. The owner records the sign-off in `docs/project/decisions.md`. That unblocks #111 (delete the RPG), #112 and #113.
5. Clear the log on the phone (**清除 Clear**). Sheets in this repo keep roles only; paper notes with names stay with the family.

## 5. The device log (`debug=metrics`)

What it records, on the phone only (`localStorage` key `popup.playtest.v1`; `src/popup/game/playtest.ts`, shell wiring in `GameShell`). Nothing is sent anywhere, and without `debug=metrics` in the address nothing is recorded.

| Column | Meaning |
|---|---|
| Active | Time the page was live: open and playable. The page's own intro lines count; the chapter card, the page turn, the sticker card, the album, the 選單 / 目錄 / 設定, the log panel and a hidden tab don't. |
| Solved | The goal was grabbed. An attempt ends at the solve or when another page opens; 重來 continues the same attempt. |
| 提示 L1/L2/L3 | Hints shown by pressing 提示: where (glow), how (ghost hand), show me (it plays the step). |
| Auto nudges | Level 0: Mocha's automatic nudge after 30 s of no change (15 s in 長輩模式). Not a press. |
| 重來 | Presses of 重來. |
| Touches | Taps and drags on something that can move (a part, a perch, Mocha), and words said. |
| Nope taps | Taps on a part that is locked right now (it shakes its head). |
| Taps on him | Taps on Baokaka (the word ring, or 「要！」 before any word). |
| Longest still | The longest stretch of active time with no touch and no 提示 press. Over 2:00 with no 提示 on that page fails the "stuck" gate. |
| Stickers | 淘氣 / 土地公 earned mid-page (解開 is the solve). |
| ★ | The observer's marks on that page. |

Below the table the report reads the gates the device can measure (first attempts): 0-1's time, the prologue's total time and 提示 presses, chapter 1 pages that reached hint level 3, chapter 1's median page time, "stuck" pages and replays. The rest (unaided, laughs, predictions, the child's rule) are observed.

**Caveat.** Active time includes reading the page's lines and the photo moment on 1-6; wall-clock time with a stopwatch can be noted on the sheet if a number looks odd.

## 6. Watch-points from the build

Things the engineers who built the slice asked the playtest to check (from issue #110's comments and `docs/project/process-log.md`), plus what the automated run found ([`ai-playtest.md`](ai-playtest.md)). Each has a line on the sheet (part C).

**Sound** (#105, D-68)
- Listen on the real phone: the iOS unlock on the first tap, the levels at 音效 80 / 音樂 50 on a phone speaker.
- 「要！要！」 blips every 4 ticks while he reaches: tiring?
- The cry (0-4) reads soft and comical, never distressing (GDD § 6 risk 5).
- The music-box loops (`chapter0` 8 bars, `chapter1` 12 bars) don't grate over 10 pages.
- One session (the dry run or a parent) played **muted**: everything still readable (R9).

**Reading load and pacing** (#98, #101, #102, #106)
- The start: the prologue's chapter card (5 lines) then 0-1's intro (7 lines) before the first puzzle. Do people read, skim or get lost? Do they find that a line moves on only when **the line itself** is tapped?
- The chapter card has no visible "tap to continue" mark: do people tap it?
- The sticker card between pages (≈ 2.4 s, tap to skip): does it drag by the 10th page?
- The prologue's tutorials start after **4 s** of reaching (0-1's ghost hand, 0-2's spotlight, 0-3's hand): right for grandparents, or too soon / too late?
- The word card on 1-3 (「嗶！ 閘門開開」) waits for a tap: do they find it, and do they then find the 說話 portrait?
- The RPG farewell note on the cover (「寶咖咖的新冒險開始了！」): noticed by anyone who played the old game? (#109)

**Pages**
- **0-3:** the table's paw print sits under the bead and his 「要！要！」 bark; without the 4 s ghost hand, is it found?
- **0-4:** opening the curtain first makes him reach for the bead behind the closed door, and he never cries; do they think of closing it again? The rolled-up curtain's seal sits next to the rod's paw print (a tap can send Mocha to the rod instead). And the cry: laugh, or worry?
- **1-1:** do they read the 拉 sway tab as a toy (it earns 淘氣 but doesn't solve)? The intro's two 廣播姊姊 bubbles cover the right-hand strap and the rack until tapped away; the third strap is decoration, not a perch; the rack's paw print is hard to see under the map. And does the paper-style backpacker sit well beside the anime standees, or does he want a v2 frame?
- **1-2:** prediction question (sheet). Do they see that the pigeon stops the train?
- **1-3:** the counter's paw print is under his thought bubble (the hint's glow is too).
- **1-4:** without hints, do they work out that the floor must be turned **while he is on it**? Do the printed travellers read as a turnable floor? Prediction question (sheet). If they use 提示 level 2, do they copy the ghost hand's drag along the rim?
- **1-5:** do they find that tapping Mocha in the lift presses the button again? The 叮咚 bell (the 淘氣) teaches the same idea, but only if someone taps Mocha first. A tap on a paw print Mocha can't reach gives no visible response.
- **1-6:** is it clear the pigeon wants the 雞腿 too? A subtitle bubble can be left clipped at the screen's left edge during the photo moment.

**Gates the log can't see:** laughter at Mocha's first push (0-3) and the first deliberate cry (0-4); the child's rule; predictions; voluntary replays for 淘氣 / 土地公; sofa behaviour (do others lean in, point, take the phone?).
