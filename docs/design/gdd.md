# 《翻翻台北》 Pop-Up Taipei — Game Design Document

**Status:** v1.0 (2026-10-19). The owner chose concept A from `docs/design/concepts.md`. This document **replaces** the 仙劍-style RPG design (`docs/superpowers/specs/2026-09-07-baokaka-xia-design.md`, `src/quest/`) as the plan for the game.
**Audience:** a PM, who can turn §7 (milestones) and §3 (architecture) into engineering issues, and engineers, who can build from §2–§4 without asking further questions.
**Language:** the document is in English. All in-game text is Traditional Chinese (Taiwan). The script is in §5. Each line is at most 30 characters.
**Art:** character art is being redrawn by a separate artist (see `docs/art/v2/`). 寶咖咖 is 1 year old, has black straight hair and wears a **two-piece outfit (top + pants), not a footie onesie**. 摩卡 is a **grey-brown tabby**, not orange. A second artist will define the pop-up/paper-craft environment style. This document fixes only what gameplay needs from art (§3.9).

---

## Table of contents

0. One-page summary
1. Pillars, target experience, audience rules
2. Core systems
   - 2.1 The page model
   - 2.2 Baokaka's autonomous AI
   - 2.3 Mocha: controls and cat rules
   - 2.4 Words: the ability system
   - 2.5 Growth stages
   - 2.6 Interaction grammar and gestures
   - 2.7 Hints
   - 2.8 Page completion, stickers, 淘氣
   - 2.9 Chapter spread and the album photo
   - 2.10 Save and progress
   - 2.11 Settings and accessibility
   - 2.12 Audio cues
   - 2.13 Screens and flow
3. Data model and engine architecture
4. Content plan: story frame, chapters, pages
5. Script (zh-Hant)
6. Risks and mitigations
7. Milestones and issue breakdown
8. Success metrics
9. Glossary

---

## 0. One-page summary

- **Hook:** You can't steer a baby. You can only rearrange the city. 寶寶不聽指揮——你只能改變台北。
- **Fiction:** It's the night before 寶咖咖's first birthday (度晬). A baby typhoon named 咻咻 blows the nine 抓周 treasures out of the window and blows open 阿嬤's pop-up book 《台北》. A crawling baby and his guilty big-brother cat ride the paper 月亮線 train through the book's pages (Taipei's landmarks) to bring everything home before 阿嬤 wakes at 05:30.
- **Play:** each **page** is a small side-view paper diorama.
  - 寶咖咖 crawls **by himself** toward whatever he wants most that he can see.
  - You **pull tabs, turn wheels, lift flaps**, and **place 摩卡** on high perches to change the world around him.
  - He reaches the page's 金珠珠 (golden bead), and the page folds into the next.
- **Growth:** a new **word** every chapter (嗶！, 掰掰, 不要！, 哇！, 抱抱, 飛機！, 咻——, 一起) and new **motor skills** (climb a step, stand while holding on, then the **first steps** on the roof of 101).
- **No failure:**
  - He never falls.
  - Nothing breaks.
  - There is no timer.
  - Crying is a puzzle tool, not a loss.
  - Every page is proven solvable from every reachable state by an automated solver in CI.
- **Size:**
  - Prologue (4 pages) + 10 chapters × 6 pages + interactive ending (1) = **65 pages**.
  - About **3–4 hours** in total, at **1–3 minutes per page**.
- **Collectibles per page:**
  - **解開** (solved).
  - **淘氣** (an optional mischief goal).
  - **土地公** (a tiny hidden 阿伯 to tap).
- **Collectibles per chapter:** one **album photo** taken at the moment he grabs the treasure, with handwritten comments from the family.

---

## 1. Pillars, target experience, audience rules

### 1.1 Pillars

1. **The baby has a mind of his own.** The core rule set is a toddler's real logic: shiny > cat > snack > lights. Players solve puzzles by understanding him, never by controlling him.
2. **The city is a toy.** Every landmark is a paper mechanism (101's sections turn, 台北車站's floor spins, the 總圖 shelves crank open). If you touch something, it responds.
3. **Nobody fails, everybody laughs.** Wrong moves produce funny, harmless results. The worst case is a baby sitting on his bottom going 「要！要！」.
4. **One thumb, a sofa, three generations.** It's playable one-handed in portrait, readable without reading, and best enjoyed with everyone pointing at the screen.
5. **Small, warm, Taiwanese.** The jokes and details belong to Taipei families (便當 at the station, 夜市, the 101 damper, 擲筊, 阿嬤's Hokkien).

### 1.2 Target experience (what a session feels like)

- Open the game, and you are back on your page within **two taps**.
- Look at the page. His thought bubble tells you what he wants.
- Touch something. He stops and watches your finger. Let go, and he reacts: changes course, giggles, reaches.
- Within 30–90 seconds comes the "aha": *"Oh! If I hide the bead, he'll cry, and the cry wakes the train!"*
- The page folds up with a paper *fwump*, a sticker pops, and the next page opens.
- After 5–15 minutes you've finished a chapter. He grabs the treasure, you snap the photo, and the family's comments appear.

### 1.3 Audience rules (hard requirements; every feature must pass them)

| Rule | Requirement | How it is verified |
|---|---|---|
| **R1 No fail states** | Baokaka never falls, gets hurt or "dies". No lives, no score loss, no game over. | Lint: no part may remove a node he can stand on (§3.6). |
| **R2 No soft-locks** | From every reachable state of every page, the goal is still reachable. | Solver test in CI (§3.7). The 重來 button exists anyway. |
| **R3 No timers** | Nothing in the simulation depends on wall-clock time. Nothing expires or "runs out". Waiting is always safe. | The simulation is tick-based. Ticks pause while a finger is down (§2.6). |
| **R4 One thumb** | Every interaction is a tap or a one-finger drag reachable in portrait. No pinch, no multi-touch, no tilt. | UI review; the gesture list in §2.6 is closed. |
| **R5 Readable for grandparents** | Text is ≥ 20 px (≥ 24 px at the 大字 setting). Contrast is ≥ 7:1. Every instruction also has an icon or animation. The game is completable without reading. | `scripts/ui-check.mjs` contrast check, plus a playtest. |
| **R6 Generous touch** | Hit areas are ≥ 48×48 CSS px. Missed taps snap to the nearest part within 32 px. Drags snap to stops. | Unit tests on hit testing (§2.6). |
| **R7 Short sessions** | Any page can be finished in ≤ 3 minutes by an adult who knows the solution, and in ≤ 6 minutes by a first-timer using hints. Progress saves after every page. | Solver-measured "par" plus a playtest. |
| **R8 Gentle tone** | No scary content, no peril to the family, no shaming. Nothing is a "wrong answer". Hints are offered, never forced. | Script review. |
| **R9 Sound optional** | Every audio cue has a visual counterpart. The game is fully playable muted. | Muted playtest. |

---

## 2. Core systems

### 2.1 The page model

A **page** is one puzzle: a side-view paper diorama that fills the play area. It is a **scene graph of paper parts** over a **walk graph**.

**Coordinates:**
- The page space is **390 × 560 units**, with the origin at the top-left. One unit is one CSS px on a 390-wide phone. The view scales uniformly to fit.
- The play area sits between the top HUD (96 px) and the bottom bar (≈120 px). On tall phones the page centres, and the background art fills the extra height.

**Building blocks:**

| Concept | What it is |
|---|---|
| **Node** | A spot Baokaka (or Mocha) can stand on: `{id, x, y, height}`. `height` is 0 (floor), 1 (shelf/seat, reachable by climbing or cruising) or 2 (high perch, Mocha only). A node may be **attached to a part**, so its position depends on that part's state (it moves with the train, the lift or the turntable). |
| **Edge** | A connection between two nodes, with a **kind**. Baby kinds: `crawl` (always usable), `climb` (from the 爬樓梯 stage), `cruise` (from the 扶著站 stage), `walk` (gap-crossing, from the 第一步 stage). Cat kinds: `jump`, `squeeze`. An edge may have a **condition**, for example "train tab is at stop 2". |
| **Part** | An interactive or reactive paper mechanism. Every part is a **finite state machine** with named states. Presets are listed below. |
| **Perch** | A spot only Mocha can occupy (height 2, or a cat-only node). It has a `reachNode`, the floor node where Baokaka goes when Mocha is his target, and optional **perch actions** (push something off, press, sit on). |
| **Attractor** | Something Baokaka wants. It has a kind (`shiny` / `mocha` / `snack` / `light`), a node where he can grab or enjoy it, and visibility and activity conditions. |
| **Creature** | A small NPC (pigeon, squirrel, goose, jogger, sleeping traveller). It occupies a node, which **blocks** it. It moves between named positions when triggered by events (Mocha arriving nearby, 掰掰, crying, 飛機！…). |
| **Goal** | Normally the page's **金珠珠** (a `shiny` attractor). On a chapter spread it is the treasure. The page is complete when Baokaka grabs it. |

#### Part presets

Each preset compiles to the generic FSM in §3.2 and has a matching view component.

| Preset | States | Player input | Typical use |
|---|---|---|---|
| `tab` (pull-tab) | `stop0 … stopN` along a straight track (2–4 stops) | Drag along the track, or tap to advance one stop (cycling back at the end) | A train slides across a gap. A crib rail lowers. A drawer opens. |
| `slider` | Like `tab`, but the handle sits inside the scene, not at the page edge | Same as `tab` | Mobile library shelves, a bento cart, a jet bridge |
| `wheel` (dial) | `0 … N-1` orientations (N = 2–8) | Circular drag snapping to steps, or tap to rotate one step clockwise | The station turntable floor, 101's sections, 紅樓's octagon, the sun dial |
| `flap` | `closed` / `open` | Tap to toggle (a drag also works) | Cushions, curtains, a bento lid, cloud fog, book pages that become bridges |
| `section` | Like `wheel`, but **not** player-driven; it is turned by events | None | A pinwheel turned by 咻——, a bell swing |
| `gate` | `closed` / `open` | None (event-driven) | Fare gates (嗶！), the balcony door (crying), shop shutters |
| `button` | `up` / `down` | None; pressed by weight (Baokaka or Mocha on its node or perch), or by a landed pushable | Elevator calls, a card reader, a pressure plate |
| `lift` | `floor0 … floorN` | None; driven by a button, a perch action or an event | Elevators, steam vents, balloon baskets, 101's elevator |
| `loop` (conveyor) | `0 … N-1`; attached nodes rotate around N positions | Tap or drag on a crank (if it has one: `input: 'drag-rotary'` or `'tap-cycle'`), or event-driven | The baggage carousel, gondolas, a lazy susan |
| `pushable` | `onPerch` / `falling` / `landed` (one-way per page, see §3.6) | None; Mocha pushes it | A pigeon, a 悠遊卡, a bead, a coin, a lantern |
| `light` | `off` / `on` | Tap (if tappable: `input: 'tap-toggle'`), or event (哇！) | Neon, lamps, a TV standby light, a music box. It owns a `light` attractor. |
| `blowable` | `0 … N-1` | None; advanced by 咻—— | Steam clouds, paper boats, pinwheels, sails |
| `carrier` | `idle` / `carrying@k` / `done`; walks a fixed route | None; triggered by 抱抱 within reach | 夜市阿姨, a bear, the 101 cleaning 阿伯 |
| `prop` | Any named states; tap cycles through them | Tap | Purely for fun, 淘氣 or 土地公 (a mobile, a TV, a split-flap board) |

**Visual rule:** every interactive part shows an affordance in its idle state:
- tabs show a 「拉」 label and an arrow;
- wheels show a ridged rim and a curved arrow;
- flaps show a lifted corner;
- perches show a faint paw print while Mocha is available. It is never hidden: it draws over the standees, his thought bubble and barks (only a subtitle, which any tap clears, may cover it), and the bubbles keep off it (#183).

Non-interactive parts show none of these.

#### Page anatomy

```
┌───────────── HUD (96px) ─────────────┐  chapter · page n/6 · moon clock · 9-slot 抓周 tray
│                                      │
│   page: 390×560 units                │  backdrop (baked) → standing cut-outs → floor → parts
│   Baokaka · Mocha · creatures        │  → characters → bubbles/FX
│                                      │
├──────────── bottom bar (≈120px) ─────┤  [寶咖咖 portrait → word ring] [提示] [重來] [選單]
└──────────────────────────────────────┘  stickers: 解開 · 淘氣 · 土地公
```

### 2.2 Baokaka's autonomous AI

Baokaka is never controlled directly. He runs a **deterministic** decision loop once per simulation **tick** (§3.3).

#### 2.2.1 Desires

Attractors have a fixed **priority** (lower number = wants it more):

| Priority | Kind | Examples | Bubble icon | Bark on choosing it | On arrival |
|---|---|---|---|---|---|
| 1 | `shiny` | 金珠珠, chapter treasure, decoys (a coin, a shiny ad) | sparkle | 「要！」 | **Grab.** If it's the goal, the page completes. **Decoys** (a moon reflection, a brass bell, an ad screen) can never be grabbed, because their node is unreachable by design. He fixates on a decoy and reaches forever, until 不要！ or until it's hidden. |
| 2 | `mocha` | Mocha on a perch, whenever Mocha is visible and not mid-jump | cat face | 「喵喵！」 | **Cuddle:** he sits at the perch's `reachNode`, pats and giggles. He stays until his target changes. |
| 3 | `snack` | Milk bottle, 小饅頭, a dropped 雞蛋糕 | bottle | 「ㄋㄟㄋㄟ」 | **Eat:** 「好吃！」, one tick. The snack is `consumed`. |
| 4 | `light` | A switched-on lamp, neon, TV, music box | music note | 「好看！」 | **Watch:** he sits and sways. He stays until his target changes. |

**Visibility.** An attractor is a candidate when all of these hold:
- its `visibleWhen` condition is true (for example, its covering flap is open);
- its `activeWhen` condition is true (a light is `on`; Mocha is sitting on a perch, not mid-jump);
- it is not `consumed`;
- it is not in the `refused` set (see 不要！ in §2.4).

There is no line-of-sight geometry. Hiding is always expressed explicitly in data, so it is predictable and testable.

#### 2.2.2 Target selection (the core rule)

Each tick, sort the candidates by:
1. **priority**, ascending;
2. **reachable before unreachable**;
3. **path length**, in edges;
4. **straight-line distance**;
5. **id**, alphabetically (the deterministic tie-break).

The first candidate is the **target**.

> **The puzzle rule:** a higher-priority attractor always wins, *even if he can't reach it*. A visible but unreachable 金珠珠 beats a reachable Mocha. To lure him with Mocha, you must first **hide** the bead (a flap), **refuse** it (不要！), or make it unavailable.

#### 2.2.3 Movement

- **If the target is reachable:** he takes one edge of the shortest path per tick (BFS over the baby-traversable edges whose conditions are currently true, at his current growth stage). Equal-length paths are broken by edge order in the data.
- **If the target is unreachable:** he moves toward the reachable node that minimises straight-line distance to the target (ties go to the shorter path, then to the node id). When he's already there, he enters **reaching**: he sits facing the target, stretches his arms, and barks 「要！要！」 every 4 ticks. This state is the visual heart of most puzzles. It says "help me across."
- **Riding:** if he stands on a node attached to a part and the part changes state, he moves with it. That's not an action, he just sits there delighted (「哇！」 the first time on each page).
- **Blocked nodes:** a node occupied by a creature or a closed gate (as data conditions) is not traversable. He never steps through a creature. In data: a creature blocks the node of its current position unless it sets `blocks: false`; a gate blocks the node attached to it (`attach: { part: <gate> }`, same position in both states) while it is `closed` (D-42). Blocking applies to Baokaka only; his own node never counts as blocked.

#### 2.2.4 Edge behaviour: never falls

- He only ever moves along edges, and edges only exist where it is safe. There is no "falling" in the model.
- At a drop-off, he **sits and reaches**, as above.
- Data lint forbids an edge into a node that can disappear (§3.6).

#### 2.2.5 Nothing to want → looking → crying (crying is a tool)

- **No candidates:** he enters **looking** for 2 ticks. The bubble shows 「？」 and he turns his head left and right.
- **Still none:** he enters **crying**: 「哇——」. Each tick while crying, he emits a `cry` event (radius **220 units**, measured from his position). Parts and creatures with `onCry` reactions respond:
  - sleeping things wake;
  - pigeons scatter to their away positions;
  - 「哭了就會有人來」: a gate with `opensOn: cry` opens (the balcony door, a guard booth window).
- **Comfort:** crying stops the moment any candidate appears (for example, a woken creature turns out to be Mocha). He says nothing; the bubble pops.
- **Crying over a refusal** (不要！ said to the only thing he wanted): after two cries he forgets the refusal and wants it again (D-75). The cries still go out, so crying on demand works, but a refusal never strands him.
- **Cry presentation:** a gentle wobbly wail with small tears and a soft visual "sound ring". It never sounds distressing. It lasts until something appears, but the view loops a calm 2-second animation, so it never feels like an alarm.

**Design use:** many puzzles ask you to *make him cry on purpose*: close the flap, send Mocha out of sight, or say 不要！ to the only thing he wants.

#### 2.2.6 Thought bubble

- The bubble always shows the current target's icon, plus his state:
  - moving: icon;
  - reaching: icon + 「要！」 pulse;
  - looking: 「？」;
  - crying: tears icon;
  - watching: music note;
  - cuddling: heart.
- It sits above his head and flips side to stay on screen.
- When the target changes, the old icon pops and the new one inflates (200 ms), so the player *sees* every change of mind. This is the main teaching device.

**For engineers (#98, D-61).** `src/popup/view/talk/` draws the bubble, barks and subtitles; `layoutTalk` keeps every bubble off Baokaka and the goal (the other side, then higher, never above the HUD's edge). Barks come from events (`view/talk/barks.ts`, text in `content/barks.ts`), and the subtitle queue is `game/talk.ts`.

#### 2.2.7 Mode list (for engineers)

`idle` · `moving` · `reaching` · `looking(n)` · `crying` · `watching` · `cuddling` · `eating` · `grabbing` · `saying(word)` · `carried(by, k)` · `linked` (一起) · `done`

All are deterministic functions of the state (§3.3). `core/baby.ts` (#82) implements §2.2.1–2.2.5 as `babyTick(def, state, { prev })`; the precise readings (Mocha as the candidate `'mocha'` at the perch's `reachNode`, decoys always unreachable, unreachable candidates tie on path length, arrival on the same tick as the move, `reaching` the tick after he gets as close as he can, silent comfort, `refused` cleared on the first arrival or when the refused attractor's place or availability changes) are in D-43. The view-only "touch-watch" pose (§2.6) is *not* a mode; the simulation is simply paused.

### 2.3 Mocha: controls and cat rules

Mocha is the player's one movable "piece". He is a cat, so he only goes where cats go.

**Controls:**
- **Move:** tap a **perch** (a paw-print marker). Mocha computes the shortest path over the cat graph (`jump` + `squeeze` edges whose conditions are true) and travels **2 edges per tick**, with a hop arc animation. On arrival he performs the perch's actions.
- **Again:** tap **Mocha himself** to repeat the current perch's action ("knead"): press the button again, or pull the cord again.
- **Unreachable perch:** Mocha looks at it, flicks his tail and says 「喵？」. Nothing changes. The perch marker wiggles to show it's not connected.
- **Not yet joined / not on this page:** perch markers are hidden. (In the prologue, perches appear on page 0-3.)

**Cat rules** (every one is a mechanic):

| # | Rule | Mechanic |
|---|---|---|
| C1 | **Likes high places.** | Mocha can only occupy perches (height ≥ 1 or cat-only nodes). He never stands in the middle of the floor, except in `linked` mode (一起, §2.4). |
| C2 | **Squeezes through gaps.** | `squeeze` edges (bars, fences, a gap under a door) are cat-only. Mocha reaches perches that are walled off for Baokaka. |
| C3 | **Knocks things off.** | A perch with `push: <pushableId>`: on arrival Mocha makes 1 tick of eye contact with the camera (the signature beat), then pushes. The pushable falls along its scripted path to `fallTo` and lands, which can fill a gap, press a button, become an attractor, wake a creature or land on a reader. One-way per attempt; data rules in §3.6. |
| C4 | **Sits on things.** | A perch can be **on** a part. While Mocha sits there: `button` parts are held down; `tab`/`slider`/`wheel` parts with `lockedByCat` cannot be moved (the handle is shown "sat on", and dragging it makes Mocha glare); `lift` counterweights get his weight (a lift's `counterweight: { on, off }`: `on` while he sits on a perch with `onPart` on it, `off` when he leaves; #120, D-83). |
| C5 | **Is irresistible.** | A visible, settled Mocha is a priority-2 attractor at the perch's `reachNode`. Placing Mocha steers Baokaka, unless something shinier is visible. |
| C6 | **Scares birds and small creatures.** | Creatures with `fleesFromCat` move to their away position when Mocha arrives at an adjacent perch (listed in data as `nearPerches`). |
| C7 | **Hates water and steam.** | Perches tagged `wet` or `steam` are unreachable while the tag's condition is true. Tapping one: Mocha's fur puffs up — 「不要。」 (a cat line, not Baokaka's word). |
| C8 | **Won't step on glass.** | Perches tagged `glass` are unreachable (used in 貓空's crystal gondola). |
| C9 | **Is curious about boxes.** | A perch tagged `box` (a basket, a bento box): Mocha sits in it and is **hidden**, so he's not an attractor. This is the main way to take Mocha out of Baokaka's sight. |

**Mocha's lines** (bark bubbles, no dialogue box): 「喵。」 on arrival; a slow 「……」 before a push; 「喵？」 at an unreachable perch; 「不要。」 at water; purring 「呼嚕嚕」 while cuddled.

**For engineers.** `core/mocha.ts` (#83) implements this section as `mochaCommand` (§ 3.3 phase 1, input `mocha`), `mochaPet` (phase 1, input `pet`) and `mochaTick` (phase 3), plus `catLocked`, `catPath`, `perchRefusal` and `mochaAttractorNode` (C5/C9, read by `baby.ts`). The precise readings — the path is committed when tapped, the eye contact is a tick of its own (`mocha.stare`), push → `falling` the next tick → `landed` the tick after, a press or `set` always emits `partEnter` (so `pet` re-presses a held button), `wet`/`steam` perches use `blockedWhen` as the tag's condition (always, without one), refused perches are avoided en route, and the UI events `mochaNope` / `mochaPuff` / `mochaStare` — are in D-44.

### 2.4 Words: the ability system

Baokaka knows about 12 words (`docs/story/script.md` vocabulary). Some are **barks** (automatic flavour lines): 要！, 喵喵！, ㄋㄟㄋㄟ, 好吃！, 好看！, 這個！, 哇——, ㄅㄚ！. Eight become **abilities** the player triggers.

**How to say a word (one thumb):**
- Tap Baokaka, or his portrait in the bottom bar. A **word ring** opens around him with the learned words as big round buttons (64 px, icon + text).
- Tap a word. Baokaka enters `saying(word)` for **1 tick**. A big speech bubble appears, the effect resolves at the end of that tick, and the ring closes.
- Tapping outside the ring closes it with no effect. The simulation is paused while the ring is open.

**Rules common to all words:**
- Unlimited uses.
- No cooldown beyond the 1-tick say.
- A page can restrict available words (`words: [...]`) for teaching. Normally all learned words are available.
- **"Within reach"** means within the word's radius of Baokaka's current position, in units, as a straight line.
- Facing is the direction of his last move (left/right). Some words use it.

#### Schedule and exact effects

| Word | Learned (page) | Event emitted | Radius | Exact effect | Typical puzzle use |
|---|---|---|---|---|---|
| **嗶！** | 1-3 台北車站 fare gates (imitating the card reader) | `beep` | 120 | Parts with `onBeep` react: fare gates toggle to `open` (they stay open); elevator card readers call the lift; robots start or stop. | Open gates and call lifts without a card. |
| **掰掰** | 2-3 大安森林公園 (a jogger waves at him) | `wave` | 160 | Creatures with `onWave` wave back, then move to their `away` position. If they hold an item, they drop it at their node (it becomes an attractor or a pushable on the floor). Saying it again near the away position brings them back (reversibility). | Clear blockers. Make the squirrel drop the bead. |
| **不要！** | 3-3 台大 醉月湖 (the goose honks it; he copies) | none (self) | — | Adds his **current target** to `refused`. He immediately re-targets. `refused` clears when he **arrives at his new target**, or when the refused attractor changes state (moves, or is revealed again). If nothing else is a candidate, he goes looking → crying; after **two cries** he forgets the refusals and wants the refused thing again, so 不要！ can never strand him (D-75). | Ignore decoys. Pick Mocha over a visible bead. Trigger crying on demand. |
| **哇！** | 4-3 西門町 (the neon sign flickers on as he gasps) | `wow` | 160 | `light` parts with `onWow` switch `on`, and their `light` attractors become active. Flowers with `onWow` open. Saying it again turns them back `off`. | Lay a trail of lights as stepping-stones of desire. |
| **抱抱** | 5-3 士林夜市 (a vendor 阿姨 picks him up) | `hug` | 1 edge (adjacent node) | If an idle `carrier` is on an adjacent node, it picks him up (`carried`) and walks its route 1 edge per tick, then sets him down at the end. If there's no carrier, he raises his arms and Mocha purrs (no effect). | Cross crowds, counters, steps. Ride an adult. |
| **飛機！** | 6-3 松山機場 observation deck (a sleeping plane's lights blink) | `sky` | whole page | All creatures tagged `winged` toggle between ground and sky positions (fly away, or come back). Parts with `onSky` react (runway lights, a taxiing plane advances one stop). | Clear birds off perches, nodes and buttons, or bring them back as weights. |
| **咻——** | 8-3 北投 (溫泉阿嬤 says 「呼呼再吃」) | `whoosh` | 140, in a 90° cone in his facing direction | `blowable` parts in the cone advance one state (pinwheel +1, boat +1 stop, steam cloud `clear`, sail `full`). | Move light objects, clear steam, spin pinwheel-driven lifts. |
| **一起** | 10-5 台北101 | `together` | — | Enters `linked` mode for the rest of the page. Mocha hops down to Baokaka's node, and cat rule C1 is suspended. **Tapping any floor node walks Mocha there** (over crawl/climb/cruise/walk edges), and Baokaka **follows Mocha**: in `linked` mode Mocha has priority 0, above shiny. Creatures tagged `lonely` (咻咻) follow the pair. In linked mode, cat rules C1, C7 and C8 are suspended: Mocha walks the floor, **even through puddles, for him**. | The finale: the first time you lead him, because he trusts you. |

**For engineers.** `core/words.ts` (#84): `wordEvent`, `inReach` (the radius, and 咻——'s cone as exact integer math: |dy| ≤ dx in his facing, edges included), `wordAvailable` (a page's `words`, plus its `learns` word once learned) and `sayNo`. 嗶！, 哇！ and 掰掰 act only through page reactions (a `toggle` reaction makes 哇！ reversible; two `when`-guarded reactions make 掰掰 send a creature away and back). Built in: 飛機！ toggles each `winged` creature with no `sky` reaction between `initial` and `sky` (else `away`), and 咻—— advances `blowable` parts with no `whoosh` reaction (wrapping). 一起 (#128) emits its event only for now (D-45). M2 (#112, D-75): a refusal is forgotten after two cries (`FORGET_AFTER_CRIES`, `baby.ts`); the toy pages `core/fixtures/m2.ts` prove the spotlight (`nodeBy`), the squirrel (`heldBy`, `fleesFromCat`, 掰掰's `drop`) and the moon decoy with 不要！ solver-green, and PageLab lists them as stages. M3 (#120, D-83): 抱抱 is built in (`core/carrier.ts`): the first carrier within one edge (her node, or one a baby edge with an open `when` joins to his), `idle` or `done`, not locked and with her whole route clear, lifts him onto her node (`carried`) and walks the route one edge a tick (waiting at a step that has closed), then sets him down `idle`; hugged again at the far end (`done`) she walks him back. No carrier: `hugNobody` (arms up, Mocha purrs). Words wait while he is carried. The toy pages `core/fixtures/m3.ts` prove 抱抱, 飛機！, 爬樓梯, the counterweight lift and the cranked loop solver-green.

Each word's first use on a page shows a one-time **Mocha translation** joke (§5.4). The word ring button for a newly learned word glows until it is first used.

**For engineers (#99, D-62).** `view/words/` draws the ring (a volvelle round him: 72 px discs, 「好了」 under him, the words from the thumb's side and mirrored in 左手模式, sliding in from screen edges), the word card, the say effect ring (the word's reach in its seal colour) and the 「要！」 poke; `game/words.ts` holds `ringWords` (what `core/step` accepts as a `say`), the learn beat, `firstUseLine` (on the learn page the follow-up, 「……閘門真的開了。」; elsewhere the translation) and the first-use tutorial (on the page of the player's first word). Text: `content/words.ts`, `learn.*` lines in `content/script.ts`.

### 2.5 Growth stages

Growth stages unlock **edge kinds**. They're learned in story moments and never lost.

| Stage | Learned | Unlocks | Visual |
|---|---|---|---|
| **爬 Crawl** | Start | `crawl` edges | Crawl cycle |
| **爬樓梯 Climb a step** | 7-3 貓空 tea terraces (he copies the tea farmer) | `climb` edges (one height level up/down between adjacent nodes: steps, a seat, a ledge ≤ 1 level) | Pull-up, then knee-over |
| **扶著站 Stand holding on** | 9-3 淡水 ferry railing | `cruise` edges (sideways along rails and furniture at height 1). He can **grab attractors at height 1 from an adjacent node** (`reachHigh`). | Stands, sidesteps holding the rail |
| **第一步 First steps** | 10-6 台北101 roof (the finale) | `walk` edges (crossing a 1-node gap with no rail, at 1 edge per tick) | Wobbly walk, arms out, a sit-down "plop" at the end |

Movement speed is 1 edge per tick at every stage. Walking is not faster; it is *new places*.

### 2.6 Interaction grammar and gestures

The closed list of gestures:

| Gesture | On | Result |
|---|---|---|
| **Tap** | flap · prop · light (if tappable) · perch marker · Mocha · Baokaka / portrait · word button · 土地公 · tab/slider (advance one stop) · wheel (rotate one step clockwise) · HUD buttons | As described in each section |
| **Drag (one finger)** | tab, slider: along the track · wheel, crank: around the centre · flap: lift its corner | Live preview follows the finger, clamped to the track. **On release it snaps to the nearest stop**, and the state change commits at the next tick boundary. |
| **Hold** | Nothing in the core loop. Holding on empty page space for 600 ms shows *all* interactive parts with a soft outline ("what can I touch?"), as an accessibility aid. | — |

**Tolerance rules:**
- **Hit areas** are at least 48×48 CSS px, even when the art is smaller (hit shapes are separate from art).
- **Magnet:** a tap that hits nothing selects the nearest interactive element whose hit area is within **32 px**. If two are equally near, the one on the higher layer wins.
- **Drag threshold:** 8 px. Below it, the gesture is a tap.
- **Drag capture:** once a drag starts on a part, it keeps that part even if the finger leaves its hit area.
- **Over-drag** stretches rubber-band style, then snaps.
- **Second finger:** ignored. Palm touches over 3 simultaneous points are ignored entirely.
- **Double-tap debounce:** 250 ms on the same element (so shaky taps don't toggle a flap twice).
- **Locked part** (Mocha sitting on it, or `lockedWhen` true): it wobbles, Mocha glares, and a soft "nope" sound plays. No state change.

**Touch pauses the world.**
- While any finger is down on the page (or the word ring or a menu is open), **the simulation does not tick**.
- In the view, Baokaka *stops and watches your finger* (head turn, curious face), and creatures freeze mid-idle.
- This makes every page turn-based in practice, removes all dexterity, and is a cute toddler behaviour.
- When you release, ticks resume after a 150 ms grace period.

**For engineers.** `view/gestures.ts` (#90) is the pure rule set: `targetsOf` (player-driven parts by their `hit`, perch paw prints while Mocha is on the page, Mocha, Baokaka, the 土地公 while he shows), `hitTest` (topmost direct hit → a hit grown to 48 screen px → the 32 px magnet), `snapStop`, `rubberBand`, `rotaryDelta` / `rotaryStep`, `Debouncer` and `GestureTracker` (threshold, capture, palm, locks, hold-to-reveal). `view/useGestures.ts` wires it to Pointer Events and the session (`pause('finger')`). Readings in D-51: hit areas are grown to 48 px *after* the book scale, so R6 holds on short phones; a tap on Baokaka opens the word ring and a tap on the 土地公 is a game event, neither is a sim input; a locked part answers at once in the view and queues nothing; drags commit as `set` (a flap's as `tap`).

**Tick speed** (setting): 慢 0.75 s · 普通 0.5 s (default) · 快 0.33 s. A **fast-forward button** appears while Baokaka is walking a long path with nothing for the player to do (more than 4 edges, no input possible); holding it runs at 4× speed.

### 2.7 Hints (gentle, never punishing)

Hints are a **ladder**. Using them costs nothing: no sticker is withheld and nothing is recorded against the player.

| Level | Trigger | What happens |
|---|---|---|
| **0 Nudge** | Automatic after **30 s** with no state change (setting: 關 / 30 s / 15 s; 15 s is the default in 長輩模式) | Mocha yawns and **looks** at the next useful element, which shimmers softly once. |
| **1 Where** | Tap 提示 | The next useful element glows and pulses for 3 s. |
| **2 How** | Tap 提示 again | A **ghost hand** performs the gesture on that element: drag the tab to stop 2, tap the perch, or the word ring with the word highlighted. |
| **3 Show me** | Tap 提示 a third time | Plays the next solver step for real. The simulation applies the action, the hand animates it, and the player watches. |

**Hint source:** the next useful action is computed by running the **solver** (§3.7) from the *current* state, in a Web Worker, capped at 300 ms. If the cap is hit, the fallback is the stored `solution` step that matches the current part states, and failing that, an offer of 重來 followed by step 1 of the stored solution.

**Waiting as an action:** if the best next action is "wait" (for example, let him cry), the hint shows a little clock-free "等一下" animation: Mocha sits down and taps his paw, 「等等看。」

**Hint text:** at most one short line (≤ 12 chars), always optional, for example 「拉拉看這裡」「讓摩卡上去」「試試看『嗶！』」.

**For engineers.** #100 built it: `core/hint.ts` (`nextHint`: the solver from the current state with `stopAtGoal`, else `solutionAction`, the stored solution step whose part states (and creature positions, first; #114, D-77) match, else 重來 + step 1; `applyHint` plays an answer), `workers/hint.worker.ts` over `workers/protocol.ts` (`{ id, pageId, state, def? } → { id, action, source }`), `workers/hintClient.ts` (every failure or a 2 s silence falls back on the main thread), and the ladder in `view/affordance/ladder.ts` + `useHintLadder.ts`, run by `PagePlayer` from the bottom bar's 提示 and the 自動提示 timer (`autoHintMs`). Mocha's cues (`affordance.mocha`: the stretch as the yawn, a look, the paw tap) and the lines (`content/hints.ts`, his bark) are in the view. `pages/hints.test.ts` presses "show me" to `done` on every registered page. Readings in D-63.

### 2.8 Page completion, stickers, 淘氣

**Completion:**
1. Baokaka grabs the goal: 「這個！」, a sparkle burst.
2. The simulation stops.
3. The page **folds** (0.9 s paper animation and sound).
4. A small sticker card shows the three page stickers.
5. After 1.5 s or a tap, the next page unfolds.

**Stickers per page** (stored per page, earned once, kept forever):

| Sticker | How | Notes |
|---|---|---|
| **解開** (solved) | Complete the page | Required for progress |
| **淘氣** (mischief) | An optional event predicate fires during any attempt (§3.4 `mischief`), for example "Mocha pushes the 便當 off the counter". The sticker is awarded **immediately** with a 「嘿嘿」 pop, even if the page isn't finished. | Each page's mischief is shown as a silhouette and text on the page-select screen after first completion, never during the first play (no clutter). It must be achievable in a state from which the goal is still reachable (solver-checked). |
| **土地公** | Tap the tiny hidden 阿伯 (a different hat each chapter). He may be behind a flap or visible only in some part state. | 「呵呵，囡仔，慢慢仔來。」 bubble. Checked as reachable and visible by the solver. |

**Rewards:**
- 10 chapter photos + the 抓周 photo in the album.
- All 65 土地公 unlock the bonus page 「象山的日出」 (post-game).
- All 淘氣 stickers unlock the album's 「淘氣大王」 cover.

*Engineers' note (#101, D-64):* the card shows in the page turn's interlude, over the folded page (with reduced motion, over the page before the fade); the 1.5 s count from its last sticker landing, and a tap ends it. 淘氣 is `game/stickers.ts` `mischiefFired`, matched every tick of every attempt; 淘氣 and 土地公 pop 「嘿嘿，淘氣！」 / 「找到土地公！」 over the bar's tray and are saved at once. The rewards are read off the save (`rewardFlags`, over all 65 pages), not stored. Page select is the 目錄: each solved page's 淘氣 is listed under the page strip. *(#113, D-76)* Once every 土地公 is found, a 「象山的日出」 postcard is taped onto the 目錄's map past 101; #135 makes it open the bonus page.

### 2.9 Chapter spread and the album photo (borrowed from concept B)

**Page 6 of every chapter is a two-page spread.** It has a wider page (rendered at 390×560 like the others, but drawn as a centrefold with a visible spine crease) and a richer puzzle. The goal is the **chapter treasure**.

**Photo moment:**
1. When Baokaka is **2 edges** from the treasure with a clear path, the simulation pauses, the camera frame slides in, and a big shutter button appears.
2. The baby animates his final approach in **slow motion (3 s loop)**. A **「哇！」 meter** beside the frame rises as his face lights up, peaks at the grab, then eases.
3. The player taps 咔嚓 at any time:
   - At the peak (±0.4 s): **Frame A**, the 「哇！」 face.
   - Earlier: **Frame B**, reaching and smiling.
   - Later: **Frame C**, already chewing the treasure, a funny face.
   - If Mocha is inside the frame rect (his perch is in the spread's `photoRect`): **+M** variant, Mocha in the photo.
   - If there's no tap within 6 s: auto-snap Frame B. Nobody is ever "late".
4. This is a pure UI moment on top of the paused simulation. There is no sim impact, and it does not affect solvability.
5. Flash, then the photo flies into the **album**. The album page opens with the photo and **four handwritten sticky notes** from 阿嬤, 媽媽, 爸爸 and 摩卡. The comment keys are chosen by `(chapter, frame, mochaInFrame)` (§5.6). Each note pops in with a small sound (0.6 s apart).
6. Diegetic note: the album is 「寶咖咖一歲的相簿」. The family's notes are written at the birthday party; the game doesn't explain the time travel, and nobody minds.
7. **Retake:** from the album, 「再拍一次」 replays only the 3-second photo moment (no puzzle). The last photo taken is kept, and the player chooses which to keep.

**Album screen:**
- Each chapter page shows: photo, chapter title, clock time, the word learned (big), four notes, and that chapter's sticker grid (6 pages × 3 stickers).
- Swipe or tap arrows to flip pages.

*Engineers' note (#103, D-66):* the moment starts on the first tick a spread's goal is its target and 1–2 edges away on an open path (`game/photo.ts` `photoReady`; after the grab if he skipped that point), and pauses the session. The slow motion is the camera's viewfinder: the photo it would take now, composed from the baked frames (B `reach` crawling in, A `bounce` with the treasure held up, C `eat`, +M `mocha.album` bottom left) over the spread's backdrop, creeping in over the 3 s loop. The grab is at 1.8 s, so A is 1.4–2.2 s. Frame A takes the chapter's § 5.6 row for all four notes; B and C the pools with A = 0, B = 1, C = 2. Every shot is saved when taken. After a retake both shots lie under the print and the tapped one is kept. The album page opens over the book after the grab, before the sticker card. The cover's 相簿 opens the latest chapter with a photo (#113 adds the rest).

*Engineers' note (#113, D-76):* the album is a book of leaves (`game/album.ts`): its cover, then a page per chapter — the photo, an empty print (reached, not photographed) or a placeholder for a chapter the 月亮線 hasn't reached (name, title and time; a padlocked print, 「？」 for the word, 「月亮線還沒開到這裡。」). 相簿 opens at the latest chapter with a photo, else at the cover. The page arrows and dots sit in a fixed row above the buttons; a one-finger horizontal swipe across the leaf or ← / → turns it too (no wrap-around). The cover is the navy linen board with the latest photo in a round window; with every 淘氣 earned it is the 「淘氣大王」 cover (a crown, a ring of 嘿 stickers, 寶咖咖 and 摩卡 in the window, the ribbon).

### 2.10 Save and progress

- **Storage:** `localStorage` key `popup.save.v1`, via the existing `src/shared/storage.ts` (`loadJson` / `browserStorage`). It must work when storage is unavailable (private mode); the session just doesn't persist.
- **Saved when:**
  - a page completes;
  - a sticker is earned;
  - a photo is taken;
  - settings change;
  - on `visibilitychange: hidden`.
- **Mid-page state is not saved.** Pages are short; resuming restarts the current page from its initial state. This is acceptable by R7, and it keeps saves tiny and robust.
- **Progression:**
  - Pages unlock linearly within a chapter. Chapters unlock linearly.
  - Any completed page can be replayed from the 目錄 (table of contents).
  - Words and growth stages come from the furthest learned point, **not** from the page being replayed. On a replayed earlier page, words learned later are **hidden** by default (`words` defaults to "learned by this page"), so old puzzles stay as designed. 淘氣 and 土地公 can still be earned on replay.
- **Schema:** §3.8.
- **Reset:** 設定 → 「重新開始」, behind a 3-second hold (not a "parent lock", just accident-proof).

### 2.11 Settings and accessibility

| Setting | Options | Default |
|---|---|---|
| 速度 (tick speed) | 慢 / 普通 / 快 | 普通 |
| 字的大小 | 標準 / 大字 (+25 %) | 標準 |
| 長輩模式 (one switch that sets several things) | 開 / 關 | 關. When on: speed 慢, 大字, auto-hint at 15 s, hold-to-show-parts always on, perch markers bolder. |
| 自動提示 | 關 / 30 秒 / 15 秒 | 30 秒 |
| 音效 / 音樂 | Volume 0–100 % each | 80 / 50 |
| 震動 | 開 / 關 (via `navigator.vibrate`, short pulses on snap, push, sticker) | 開 |
| 減少動態 | 開 / 關 (page fold becomes a crossfade; no screen shake; no parallax) | follows `prefers-reduced-motion` |
| 左手模式 | 開 / 關 (mirrors the bottom bar) | 關 |

**Always on:**
- Shapes plus colours for every state (open/closed lock icons, not only colour).
- Text contrast ≥ 7:1.
- Icons on all buttons.
- No flashing above 3 Hz.
- All text in Traditional Chinese; numbers in Arabic digits; clock times in HH:MM.

**For engineers.** #104 built it (D-67). `game/settings.ts` holds the rules: `effectiveSettings` applies 長輩模式 over the player's own values and never writes them, so turning it off restores them; while it is on, changes to the settings it holds are dropped. It also has the low-power `FrameWatch` and the `pulse` vibrations. The screen is `view/screens/Settings.tsx` (設定 from the cover and the pause menu). 大字 is `TextScaleContext` plus `[data-text-size="big"]`, and every screen passes `npm run check:ui:big`. The extras of 長輩模式 are the reveal outlines always on, bolder perch markers, 28 px seals and a stronger L1 halo. It always sets the auto-hint to 15 s, even over 關. The optional gyro tilt (bible § 2.3) is the 書本傾斜 row, `Settings.tilt`. 「重新開始」 keeps the settings (D-55).

### 2.12 Audio cues

All sound is **synthesised with WebAudio**, extending `src/shared/audio.ts` (no mp3s). Music is a tiny music-box sequencer, one 8–16 bar loop per chapter in a pentatonic key. Baby barks are pitched "voice blips" plus a bubble; there are no recorded voices.

> Stretch idea, flagged for the owner: a parent-only setting to **record their own baby's** words for the barks.

| Cue | Sound | Paired visual |
|---|---|---|
| Tab/slider drag | Soft paper swish (filtered noise) | Part moves |
| Snap to stop | Wooden click | Small bounce |
| Wheel step | Ratchet tick | Rim ridges pass |
| Flap open/close | Paper flop (two-note) | Flap animates |
| Locked part | Low "boop" plus Mocha's 「……」 | Wobble, glare |
| Baby crawl | Pat-pat (alternating soft blips) | Crawl cycle |
| Target change | Rising two-note "ding" | Bubble pop/inflate |
| Reaching | 「要！要！」 blip-blip | Arms stretch, bubble pulse |
| Looking | Questioning up-glide | 「？」 |
| Crying | Wobbly descending glide, soft | Tears, sound ring |
| Word said | A 2–3 note motif per word (嗶 = beep-beep, 掰掰 = waving down-up, 不要 = two low stomps, 哇 = big up-sweep, 抱抱 = warm major third, 飛機 = whoosh up, 咻 = noise sweep, 一起 = harmony chord) | Speech bubble, effect ring |
| Mocha hop / land | Soft thump | Hop arc |
| Mocha push | Slow scrape, then a drop sound by material (paper flutter, coin clink, pigeon flap) | Eye-contact beat, fall |
| Creature reacts | Coo, chitter, honk… (short synths) | Animation |
| Goal grab | Sparkle arpeggio | Burst |
| Page fold | Paper whoosh plus chime | Fold |
| Sticker | Pop plus 「嘿嘿」 blip (淘氣) / bell (土地公) | Sticker slaps on |
| Shutter | Click plus flash | White flash |
| Hint | Soft bell | Shimmer |

**For engineers.** #105 built it (D-68). The synth is `src/shared/audio.ts`: two buses (音效, 音樂) with the settings' volumes, the `SFX` cue table (one row per cue, each a few oscillator notes and filtered-noise bursts), `motifVoices` for the word motifs (`WORD_MOTIF` × `MOTIF_STYLE`), `voiceVoices` for the barks (one blip per syllable) and the music-box loops `chapter0` (an 8-bar lullaby in G) and `chapter1` (12 bars in C). The map from play to cues is `src/popup/view/sound.ts`, pure and tested row by row: `tickSounds` (a tick's events and change of state), `gestureSounds`, `stickerSounds`. The shell unlocks audio on the first pointer or key, plays the chapter's loop and is the `SoundContext` for every screen; the page turn, the chapter card, the sticker card, the shutter and the album's notes sound on their own animation clocks. The art lab, PageLab, `#/popup?page=` and every still are silent. Chapters 2–10 add their loop to `TRACKS` and `chapterTrack`; new creatures and pushables get their voice from their art key (`creatureCue`, `dropCue`).

### 2.13 Screens and flow

1. **Cover**: the book 《翻翻台北》 on 阿嬤's low table, with Baokaka and Mocha. Buttons: 「繼續」 (big), 「目錄」, 「相簿」, 「設定」. First launch shows only 「開始」.
2. **目錄 (chapter select)**: a 月亮線 route map drawn as a paper map. Stations are chapters with stickers collected (n/18). Tap a station to see its page strip (6 thumbnails) and replay.
3. **Chapter card**: the departure-board card: 第N章｜title｜HH:MM｜下一站, plus 2–4 narration lines (§5.2). Tap to skip.
4. **Page**: the play screen (§2.1).
5. **Spread + photo**: §2.9.
6. **Album**: §2.9.
7. **Settings**: §2.11.
8. **Ending**: the interactive 抓周 (page E, §4.4), then credits over album photos, then the 土地公 post-credits.

**For engineers (#97, D-60).** `src/popup/game/nav.ts` is the flow as a pure state machine (a base: the cover or a page; one layer over it: the menu, the 目錄, the album, the settings; a layer over a page holds its session). `GameShell` renders it on one `ProgressStore`. The cover's 「繼續」 opens `save.current` in one tap; the page fold and the chapter turn are `view/transitions/pageTurn.ts`.

Dialogue appears in **short subtitle bubbles over the page** (≤ 30 chars, max 3 per beat, tap to advance). There is no dialogue box covering the play.

**For engineers (#102, D-65).** The chapter card is `view/hud/ChapterBoard.tsx`: the chapter on the red spine (「第一章」, set vertically), the title, the time chip, the landmark, the 翻 seal and the split-flap 「下一站」 row (`ChapterInfo.next`). It hangs in every chapter turn, and before a chapter's first page when that page is opened from the cover or the 目錄 (「開始」 included). Once it settles, its lines (`cardLines`) play under it a tap a beat. A tap before then skips the whole turn. The page's own intro plays after the turn.

**For engineers (#98, D-61).** A beat is ≤ 3 lines, narration included. A tap on a bubble or the strip advances it and never reaches the page. Since #183 (D-74) a tap **anywhere** on the page does the same: a pointer that lands while a beat is up and lifts as a tap is cancelled (no input) and reads the beat on; a drag still plays under the line. Nothing advances on a timer. The chapter card's lines and the word card show a small bobbing ▼ (tap to go on).

---

## 3. Data model and engine architecture

### 3.1 Principles

- **The simulation is pure TypeScript with no DOM**: `step(state, input) → { state, events }`. It is deterministic, with no randomness and no wall-clock time. Everything the game does can be replayed from `(pageDef, inputs[])`.
- **Pages are data**: TypeScript objects checked by types plus a lint pass. Part behaviour is generic (FSMs compiled from presets), so most pages need **no custom code**. A page may register at most one small custom reaction function (an escape hatch), and lint flags it.
- **The view is a thin React layer**:
  - It renders the state as layered SVG plus baked bitmaps.
  - It interpolates positions between ticks.
  - It translates gestures into `Input`s.
  - It never mutates simulation state.
- **The solver** is a breadth-first search (BFS) over the same `step` function. It runs in CI to prove that every page is solvable and free of soft-locks, measures par, and generates hints at runtime.
- **Reuse:**
  - `src/shared/storage.ts` (save),
  - `src/shared/audio.ts` (extended with the new cues),
  - `src/shared/route.ts` (add the routes),
  - the art bake pipeline from `docs/art/v2/tools/` (characters).
- **Retire** `src/quest/` when M1 ships (§7).

### 3.2 Types (the contract)

```ts
// src/popup/core/types.ts
export type Id = string;
export type Kind = 'shiny' | 'mocha' | 'snack' | 'light';
export type Word = 'beep' | 'bye' | 'no' | 'wow' | 'hug' | 'plane' | 'whoosh' | 'together';   // 嗶 掰掰 不要 哇 抱抱 飛機 咻 一起
export type Growth = 0 | 1 | 2 | 3;                  // crawl, climb, cruise(stand), walk
export type EdgeKind = 'crawl' | 'climb' | 'cruise' | 'walk' | 'jump' | 'squeeze';
export type LineKey = string;                        // e.g. 'c1.intro.2' (§5.1); content/script.ts narrows it

export type Cond =
  | { part: Id; in: string[] }              // part state is one of
  | { mochaAt: Id }                         // Mocha is settled on perch
  | { babyAt: Id }
  | { landed: Id }                          // pushable has landed
  | { creature: Id; at: string }            // creature at named position
  | { consumed: Id }
  | { flag: Id }                            // page-local flag set by reactions
  | { all: Cond[] } | { any: Cond[] } | { not: Cond };

export interface NodeDef {
  id: Id; x: number; y: number; height: 0 | 1 | 2;
  attach?: { part: Id; pos: Record<string, [number, number]> };   // position per part state
  tags?: ('wet' | 'steam' | 'glass' | 'box')[];
}
export interface EdgeDef { a: Id; b: Id; kind: EdgeKind; when?: Cond; oneWay?: boolean }

export interface PerchDef {
  id: Id; node: Id;                 // cat-graph node (height ≥ 1 or cat-only)
  reachNode?: Id;                   // where Baokaka goes when Mocha here is his target
  onPart?: Id;                      // sitting on a part (C4): presses buttons, locks lockedByCat parts
  push?: Id;                        // pushable to knock off on arrival (C3)
  set?: { part: Id; to: string };   // arrival sets a part state ("pull the cord")
  hidesMocha?: boolean;             // box perch (C9)
  blockedWhen?: Cond;               // e.g. water present (C7)
}

export type ReactionOn = EventType | { type: EventType; within?: number; id?: Id; state?: string };
  // within: units from event origin (default per event); id: the event's subject (e.g. 'panel'); state: for partEnter (D-45)
export type Reaction = {
  on: ReactionOn;
  when?: Cond;
  to: string | 'next' | 'prev' | 'toggle';
  setFlag?: Id;
};

export const PART_PRESETS = ['tab', 'slider', 'wheel', 'flap', 'section', 'gate', 'button', 'lift', 'loop',
  'pushable', 'light', 'blowable', 'carrier', 'prop'] as const;               // core owns the list; art imports it
export type PartPreset = (typeof PART_PRESETS)[number];
export type PartInput = 'drag-linear' | 'drag-rotary' | 'tap-toggle' | 'tap-cycle' | 'none';

export interface PartDef {
  id: Id;
  preset: PartPreset;
  states?: string[];                // omit only where the preset has defaults (core/presets.ts)
  initial?: string;                 // defaults to the first state
  input?: PartInput;                // defaults per preset; a loop's crank / a tappable light opt in here
  track?: { from: [number, number]; to: [number, number] };   // linear parts: stop i is evenly spaced
  center?: [number, number]; radius?: number;                 // rotary parts
  hit: { x: number; y: number; w: number; h: number } | { cx: number; cy: number; r: number };
  lockedByCat?: boolean;            // C4
  lockedWhen?: Cond;                // whole part can't move
  stateWhen?: Record<string, Cond>; // a state can only be entered while its cond holds; drags snap to the furthest allowed stop
  react?: Reaction[];
  emit?: { onEnter: string; event: EventType }[];             // e.g. reader 'down' emits 'beep'
  // preset-specific:
  fall?: { path: [number, number][]; fallTo: Id; landSets?: { part: Id; to: string } }; // pushable
  route?: Id[];                     // carrier: walked one edge per tick; consecutive nodes joined by a baby edge (lint)
  counterweight?: { on: string; off: string };   // lift: its state while Mocha's weight is on it / off it (C4, #120)
  attractor?: Id;                   // light owns a light attractor
  art: string;                      // art registry key, e.g. 'c1/train-blue'
  ridesOn?: Id;                     // view only: hit and art move with this node (a lid on a cart; #107, D-70)
}

export interface AttractorDef {
  id: Id; kind: Kind; node: Id; height?: 0 | 1;   // height 1 needs reachHigh (stage 2) or adjacency rules
  visibleWhen?: Cond; activeWhen?: Cond;
  decoy?: boolean;                  // never grabbable (node unreachable by design); lint checks it isn't a goal
  goal?: boolean;
  heldBy?: Id;                      // a creature holds it (stays at the creature's node) until a reaction with `drop`
  nodeBy?: { part: Id; map: Record<string, Id> };   // node follows a part's state (spotlight aim)
  followsPushable?: Id;             // at `node` while onPerch, at the pushable's fallTo once landed
  art?: string;                     // its look, when not the kind's default (a decoy's moon, bell, glasses; #116); view only
}

export interface CreatureDef {
  id: Id; positions: Record<string, Id | 'offpage'>; initial: string;
  blocks?: boolean;                 // occupied node is not traversable (default true)
  winged?: boolean; lonely?: boolean;
  fleesFromCat?: { nearPerches: Id[]; to: string };
  react?: { on: ReactionOn; within?: number; when?: Cond; to: string; drop?: Id }[];
  art: string;
}

export interface PageDef {
  id: Id;                     // 'c1p2'
  chapter: number; index: number;      // 0..10, 1..6 (prologue uses chapter 0)
  title: string;              // zh-Hant, ≤ 10 chars
  spread?: boolean; photoRect?: { x: number; y: number; w: number; h: number };
  difficulty: 1 | 2 | 3 | 4 | 5;
  nodes: NodeDef[]; edges: EdgeDef[]; parts: PartDef[]; perches: PerchDef[];
  attractors: AttractorDef[]; creatures: CreatureDef[];
  baby: { start: Id; facing: 'l' | 'r'; growth?: Growth };   // growth defaults to "learned by this page"
  mocha: { start: Id | null };          // perch id, or null = not on page
  words?: Word[];                       // defaults to words learned before this page
  learns?: { word?: Word; growth?: Growth; when: Cond | { event: EventType } };
  mischief: { text: string; when: EventPredicate };
  tudigong: { x: number; y: number; visibleWhen?: Cond; hat: string };
  solution: SolutionStep[];             // intended solution, replayed in tests
  allowTrivial?: boolean;               // tutorial beats / page E only
  priorityOverride?: Partial<Record<Kind, number>>;   // page E only
  lines?: { intro?: LineKey[]; onEvent?: { when: EventPredicate; line: LineKey }[] };
  backdrop: string;                     // baked art key
  cutouts?: { art: string; x: number; y: number; visibleWhen?: Cond }[];   // standing cut-outs (§ 3.9 layer 2), placed by their origin (#96); shown only while `visibleWhen` holds (#115)
}

export type SolutionStep =
  | { set: Id; to: string }            // gesture result
  | { mocha: Id } | { pet: true }      // pet = tap Mocha (repeat perch action)
  | { say: Word } | { tap: Id }
  | { wait: number | 'settle' | 'goal' };

export type EventType = 'beep' | 'wave' | 'wow' | 'hug' | 'sky' | 'whoosh' | 'together' | 'cry'
  | 'catArrive' | 'catLeave' | 'push' | 'land' | 'babyEnter' | 'ride' | 'grab' | 'eat' | 'partEnter';
export type EventPredicate = { type: EventType; id?: Id; count?: number; when?: Cond };
export type DefinePage = (def: PageDef) => PageDef;   // core/define.ts, re-exported by pages/

// §2.2.7; looking(n) → baby.lookCount, carried(by, k) → baby.carriedBy, saying(word) is a 1-tick mode
export type BabyMode = 'idle' | 'moving' | 'reaching' | 'looking' | 'crying' | 'watching' | 'cuddling'
  | 'eating' | 'grabbing' | 'saying' | 'carried' | 'linked' | 'done';
```

**Preset defaults** (`core/presets.ts`): `flap`/`gate` default to `closed`/`open`, `button` to `up`/`down`, `pushable` to `onPerch`/`falling`/`landed`, `light` to `off`/`on`, `carrier` to `idle`, `carrying@0 … carrying@(route length − 1)`, `done`; the count-based presets (`tab`, `slider`, `wheel`, `section`, `lift`, `loop`, `blowable`) and `prop` must list their states. Default inputs: `tab`/`slider` `drag-linear`, `wheel` `drag-rotary`, `flap` `tap-toggle`, `prop` `tap-cycle`, everything else `none`. A tap advances a tab or slider one stop (cycling), rotates a wheel one step clockwise (states are listed clockwise), toggles a flap or tappable light, and cycles a prop or a loop's crank. The table with each preset's allowed inputs is in the header of `core/presets.ts`.

**Runtime state** (plain JSON, structurally comparable; it hashes to a string key for the solver):

```ts
export interface SimState {
  tick: number;
  parts: Record<Id, string>;
  baby: { node: Id; mode: BabyMode; facing: 'l' | 'r'; refused: Id[]; lookCount: number;   // looking ticks; cries over refusals (D-75)
          target: Id | null; reachTicks: number;   // current target ('mocha' = Mocha) and reach beat 0–3 (D-43)
          carriedBy?: { id: Id; k: number; back?: true }; linked: boolean };   // back: walking the route back (D-83)
  mocha: { perch: Id | null; path: Id[]; to?: Id; stare?: Id; floorNode?: Id };
      // settled: perch set, path []; travelling: perch null, path = [current node, …, perch node], to = target perch;
      // stare = the pushable of the eye-contact beat (pushes next tick, D-44); floorNode in linked mode
  creatures: Record<Id, string>;
  pushables: Record<Id, 'onPerch' | 'falling' | 'landed'>;   // pushable parts live here, not in `parts`
  consumed: Id[]; flags: Id[];          // refused, consumed and flags are sets: canonicalKey sorts them
  dropped?: Record<Id, Id>;             // heldBy attractors a creature dropped → their node (absent until one drops, D-45)
  counters: Record<string, number>;     // mischief/line predicates (predicateKey → count, capped) + '!learned' (D-45)
  done: boolean;
}
export type Input =
  | { t: 'set'; part: Id; to: string }  // from a drag release / tap
  | { t: 'mocha'; perch: Id } | { t: 'pet' }
  | { t: 'say'; word: Word } | { t: 'tap'; id: Id } | { t: 'floor'; node: Id }  // floor = linked mode
  | { t: 'none' };
```

### 3.3 The tick (exact order)

`step(def, state, input)` performs these phases in order:

1. **Input.**
   - `set`: if the part isn't locked and `to` is a legal state (and its `stateWhen`, if any, holds), set it and emit `partEnter`. A drag toward a disallowed stop stops at the furthest allowed one, and the part does its "jammed" wobble.
   - `mocha`: compute the cat path. If there's none, emit a `mochaNope` UI event and make no state change.
   - `say`: Baokaka enters `saying`, and the word's event is queued for phase 5.
   - `tap`: props, flaps, lights.
   - `floor`: linked mode only.
2. **Cascade.** Process queued events FIFO. For each event, collect matching reactions (`within` is measured from the event origin; default radii are in §2.4), apply transitions, and queue any `emit` events from parts entering states. This is bounded to **32 iterations**; exceeding it throws, and lint and tests catch it.
3. **Mocha.**
   - If he has a path, advance 2 edges.
   - On arrival: emit `catArrive(perch)`, apply `onPart`, `set` and `fleesFromCat`; if the perch has `push`, set the pushable to `falling` (it lands next tick, emits `land`, applies `landSets`).
   - On leaving: emit `catLeave`, which releases buttons and locks.
4. **Creatures.** Apply queued creature moves. Creatures with a `drop` place their held attractor on their node.
5. **Baby.**
   - Resolve `saying`: emit the word event into a mini-cascade (as in phase 2).
   - Then:
     - if `carried`: advance along the carrier route;
     - else if `linked`: target is Mocha;
     - else: the decision loop of §2.2.
   - Move at most **one edge**. Emit `babyEnter(node)`.
   - If he ends on a node attached to a part that changed this tick, emit `ride`.
6. **Arrival effects.** grab / eat / cuddle / watch. Grabbing the goal sets `done`.
7. **Counters** for mischief predicates. The mischief check happens outside the simulation (the game layer listens to events).

**For engineers.** `core/step.ts` (#84) implements this as `step`, with `cascade`, `matchPredicate` and `predicateKey`; `core/words.ts`, `core/creatures.ts` and `core/replay.ts` hold the words, the creatures and `replay(def, steps)`. The readings the order above leaves open are in D-45: a cascade processes at most 32 § 3.2 events, and each event fires at most one reaction per part and per creature (the first that matches, judged on the state before that event); a reaction's `to` of `next`/`prev` wraps; only real state changes queue `partEnter` (Mocha's presses always do, D-44); radii are measured to a part's hit-area centre or a creature's node; Mocha's events cascade right after phase 3, and Baokaka's (his `cry`, `babyEnter`, his weight on a button) right after phase 6, so a cry opens a gate in its own tick but he walks through on the next; creature moves and drops happen inside the cascades (phase 4 has nothing left until #128's `lonely`); on a say tick he stays `saying` and doesn't move; `ride` needs his node to have moved with the part; a growth `learns` takes effect once it fires; counters exist only for the page's predicates, capped at their count.

**Determinism contract:**
- No `Math.random`. No iteration over unordered collections (`Object.keys` is sorted).
- Everything is in integer ticks.
- Tests snapshot event logs.

### 3.4 Authoring a page (example: 1-2 「月台的縫」)

This is the full data shape. Art keys are placeholders.

```ts
// src/popup/pages/c1/p2.ts
export default definePage({
  id: 'c1p2', chapter: 1, index: 2, title: '月台的縫', difficulty: 2, backdrop: 'c1/hall-night',
  nodes: [
    { id: 'L1', x: 40, y: 430, height: 0 }, { id: 'L2', x: 90, y: 430, height: 0 }, { id: 'L3', x: 140, y: 430, height: 0 },
    { id: 'T1', x: 0, y: 0, height: 0, attach: { part: 'train', pos: { out: [60, 430], half: [150, 430], full: [190, 430] } } },
    { id: 'T2', x: 0, y: 0, height: 0, attach: { part: 'train', pos: { out: [100, 430], half: [190, 430], full: [230, 430] } } },
    { id: 'R1', x: 260, y: 430, height: 0 }, { id: 'R2', x: 320, y: 430, height: 0 },
    { id: 'pillarTop', x: 280, y: 240, height: 2 }, { id: 'bench', x: 340, y: 380, height: 1 },
    { id: 'gapSlot', x: 245, y: 470, height: 0 },   // unconnected: where the pigeon sits in the track slot
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' }, { a: 'L2', b: 'L3', kind: 'crawl' },
    { a: 'L3', b: 'T1', kind: 'crawl', when: { part: 'train', in: ['half', 'full'] } },
    { a: 'T1', b: 'T2', kind: 'crawl' },
    { a: 'T2', b: 'R1', kind: 'crawl', when: { part: 'train', in: ['full'] } },
    { a: 'R1', b: 'R2', kind: 'crawl' },
    { a: 'bench', b: 'pillarTop', kind: 'jump' },
  ],
  parts: [
    { id: 'train', preset: 'tab', states: ['out', 'half', 'full'], initial: 'out', input: 'drag-linear',
      track: { from: [80, 610], to: [200, 610] }, hit: { x: 28, y: 590, w: 178, h: 56 },
      stateWhen: { full: { creature: 'pigeon', at: 'away' } },   // the pigeon on the track jams the tab at 'half'
      art: 'c1/train-blue' },
  ],
  perches: [
    { id: 'bench', node: 'bench', reachNode: 'R2' },
    { id: 'pillar', node: 'pillarTop', reachNode: 'R1' },
  ],
  creatures: [
    { id: 'pigeon', positions: { onTrack: 'gapSlot', away: 'offpage' }, initial: 'onTrack', blocks: false, winged: true,
      fleesFromCat: { nearPerches: ['pillar'], to: 'away' }, art: 'common/pigeon' },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'R2', goal: true }],
  baby: { start: 'L1', facing: 'r' },
  mocha: { start: 'bench' },
  mischief: { text: '讓寶咖咖坐火車來回兩次', when: { type: 'ride', count: 4 } },
  tudigong: { x: 120, y: 160, visibleWhen: { part: 'board', in: ['flip'] }, hat: '站務帽' },
  solution: [{ set: 'train', to: 'half' }, { wait: 'settle' }, { mocha: 'pillar' }, { set: 'train', to: 'full' }, { wait: 'goal' }],
});
```

(The page also has a `prop` part `board`, the split-flap departure board, which hides the 土地公. It is omitted above for brevity.)

### 3.5 Module layout

```
src/popup/
  core/                    pure TS, no React/DOM — 100% unit-tested
    types.ts  cond.ts  presets.ts (preset → FSM defaults)  graph.ts (BFS, reach sets)
    baby.ts (decision loop)  mocha.ts  words.ts  creatures.ts  step.ts  events.ts
    solver.ts (BFS, dead-end analysis, par, hint)  lint.ts  replay.ts
  pages/                   c0/ … c10/, end/ — one file per page + index.ts (ordered registry)
  content/                 script.ts (LineKey → zh-Hant), album.ts (comment tables), words.ts (labels/icons)
  game/                    progress.ts (save/load/migrate), session.ts (current page runner, tick clock, pause-on-touch)
  view/
    PageView.tsx           layers, scaling, hit-testing, gesture capture
    parts/                 TabView WheelView FlapView GateView LiftView LoopView LightView PushableView CarrierView PropView
    actors/                Baby.tsx  Mocha.tsx  Creature.tsx  Bubble.tsx  (sprite slots; placeholder shapes until art lands)
    hud/                   TopHud  BottomBar  WordRing  HintLayer  StickerCard
    screens/               Cover  Contents(目錄)  ChapterCard  Spread+PhotoMoment  Album  Settings  Ending
    art/                   registry.ts (art key → component/bitmap), placeholder paper styles
  dev/
    PageLab.tsx            `#/pagelab` (dev builds only): page picker, overlays, step/play, solver panel, editor
  workers/
    hint.worker.ts         runs solver from a state, posts next action
scripts/
  solve-pages.ts           `npm run solve` — solver report table for all pages (par, states, dead-ends, mischief/土地公 reachable)
```

**For engineers.** `pages/index.ts` (#87) is the ordered registry: `PAGES` (play order, the prologue as chapter 0), `pageById`, `nextPage` (across chapters; null after the last page) and `chapterOf`, built by `buildRegistry`, which rejects duplicate ids and pages out of (chapter, index) order. It fills in the § 3.2 defaults that depend on the order: `words` = the words learned (`learns.word`) on earlier pages, `baby.growth` = the highest growth learned on earlier pages (else 0); a page's own `learns` is not in its own defaults, and explicit fields win. Adding a page = a file under `pages/cN/` plus one line in the registry; `pages/pages.test.ts` lints (with `content/script.ts`'s table), replays and solves every registered page and prints a report table (page, difficulty, par, states, dead ends, ms, lint) on failure. Readings in D-48.

**Routes** (`src/shared/route.ts`): add `pagelab` (dev only). `#/` becomes the new game when M1 ships. Until then, `#/popup` serves it, behind no flag; it's just unlinked. **Done in #109 (D-72):** `#/`, `#/popup`, `#/quest` and unknown hashes show the game; the RPG is unrouted and out of the production bundle until #111.

### 3.6 Lint (runs in tests and in PageLab on every edit)

Each of the following is an error:

1. Ids are unique per category. All references resolve.
2. Every part state used in a `Cond` exists.
3. `initial` is in `states`.
4. Nodes with `attach` have a position for **every** state of the part.
5. **No vanishing ground:** no edge may lead to a node whose existence is conditional. Nodes always exist; only edges are conditional.
6. **No dropping the baby:** a part may not change state while Baokaka stands on a node attached to it, *unless* all states are valid positions (always true by rule 4). Rides are fine.
7. **Pushables are one-way per attempt.** Any page whose solution uses a pushable must pass the dead-end solver check. Designers either make it non-critical, make the landing reversible (a `landed` reaction that resets it to `onPerch` when Mocha taps it again), or provide a second copy.
8. Budget: ≤ 40 nodes, ≤ 8 player-interactive parts, ≤ 12 parts total, ≤ 6 creatures.
9. Every interactive part's hit area is ≥ 48×48 units. No two hit areas overlap by more than 30 %.
10. Text: `title` ≤ 10 chars. Every `LineKey` resolves, and every line is ≤ 30 chars.
11. Exactly one `goal` attractor. `tudigong` is present. `mischief` is present.
12. The cascade never exceeds 32 iterations (fuzzed by running the solver).
13. Warning only: a custom reaction function is present.
14. Warning only: in the initial state, Baokaka's target ties with another candidate on priority, reachability and path length, so only distance or id decides (§ 6 risk 4). The solver repeats the check in every reachable state (`visibleTies`, #112), since a spotlight or a dropped bead can make a tie mid-page.
15. Warning only: a part's `lockedWhen`/`stateWhen` reads a part that reacts to the same event earlier in data order, so it sees that event's new state while reaction `when`s see the old one (D-45).
16. Warning only: a perch on a `wet`/`steam` node has no `blockedWhen`, so Mocha refuses it forever (C7).
17. A carrier's route steps only between nodes a baby edge joins and never through a height-2 node; a carrier starts `idle` or `done` and only 抱抱 moves it; a counterweighted lift has a perch on it and starts in the state Mocha's start puts it in (#120, D-83).

**For engineers.** `core/lint.ts` (#86) implements this as `lintPage(def, script?) → { errors, warnings }`; every issue has a stable code (`L01-unknown-ref`, `L05-vanishing-ground`, `L09-hit-overlap` …; the table is in the file header), the page id and the ids it is about. The readings this list leaves open are in D-47. In short: rule 1 also covers enum values (presets, inputs, edge kinds, events, words), `drop`/`push`/`followsPushable` kinds, perch-node sharing, the reserved attractor id `'mocha'` and a `winged` creature's sky position; rule 3 checks the **compiled** states (`compilePart`'s defaults), `input ∈ PRESETS[preset].inputs`, pushable states, and the 2–4 / 2–8 stop counts; rule 4 also requires a gate's doorway node to stay put; rule 5 = a node an edge leads to never leaves the 390 × 560 page and never rides a pushable; rule 6 = a node Baokaka can stand on is never attached to a pushable or a carrier; rule 7's static half = every pushable is pushed by a perch and reactions may only put it back `onPerch` (`solutionPushables` names the ones a solution relies on; the dead-end half is the solver's); rule 9 measures interactive parts only (input not `none`), circles by radius, overlap as a share of the smaller area; text counts code points; rule 12's static half errors on cycles of unconditional `next`/`prev`/`toggle` reactions and warns (`L12-cascade-cycle`) on any other reaction cycle; rule 13 flags any function value in the page data. Line keys are checked only when a `script` table is passed. The lint never throws and takes ≈ 0.1 ms per page.

### 3.7 Solver (solvability as a test)

`solve(def, fromState?, opts)`:

- **Search:** BFS over `SimState`, keyed by a canonical JSON string. From each state, the candidate inputs are:
  - `none` (wait one tick);
  - every legal `set` for each unlocked interactive part (every other state; drags can reach any stop);
  - `mocha` for each reachable perch;
  - `pet`;
  - `say` for each available word;
  - `tap` for each tappable prop, flap or light;
  - in linked mode, `floor` for each floor node.
- **Pruning:** inputs that produce an identical next state as `none` are dropped. Cap: 2,000,000 states (configurable per page). Exceeding it is a test failure, which tells the designer to simplify the page.
- **Outputs:**
  - `solvable` and `par`, the minimum number of **non-wait inputs** (the "number of moves"). It is shown in PageLab and used for the difficulty sanity check: difficulty 1 → par 1–2, 2 → 2–3, 3 → 3–4, 4 → 4–5, 5 → 5–7.
  - `deadEnds`: reachable states from which no goal state is reachable, computed by reverse reachability on the explored graph. **Must be empty (R2).**
  - `trivial`: solvable with only waits. This must be false unless the page sets `allowTrivial` (tutorial beats only).
  - `mischiefReachable`: some reachable state, *from which the goal is still reachable*, fires the mischief predicate.
  - `tudigongReachable`: likewise for the 土地公's `visibleWhen`.
  - `nextAction(state)`: the first input on a shortest path to the goal (used by hints).
  - `softTraps()` (#183): first moves of a part or of Mocha, made from a state on a shortest way to the goal, after which the goal costs at least two more moves (the move must be undone; undoing progress is not counted). The page looks alive but never progresses until the player thinks to reverse it. **Must be empty.**
  - `decoysReachable` (#112): decoys whose node Baokaka can walk to in some reachable state. A decoy is unreachable by design (§ 2.2.1); the engine never lets him grab one, but a walkable one reads as a bug. **Must be empty.**
  - `visibleTies` (#112): states where his target is decided only by distance or id (rule 14 over every reachable state). A warning.
- **Tests** (`src/popup/pages/pages.test.ts`):
  - for every page: lint passes; replaying `solution` reaches `done`; `solve()` reports solvable, no dead ends, no soft traps, no walkable decoy, not trivial, and mischief and 土地公 reachable (visible ties only warn);
  - par is within the difficulty band (a warning, not a failure).
- **CI cost target:** all 65 pages in under 60 s.
- **Hints at runtime:** `hint.worker.ts` runs `solve(def, current, {cap: 200_000, timeMs: 300})` and returns `nextAction`.

**For engineers.** `core/solver.ts` (#85) implements this as `solve(def, from?, { cap, timeMs, clock, stopAtGoal })` with `candidateInputs`, `solverKey` and `toSolutionSteps`; the readings this section leaves open are in D-46. In short: the key drops `tick` and `baby.reachTicks`; drags are offered to every stop of a drag part and taps to every tappable part (tabs, sliders and wheels included, since a tap cycles); par comes from a 0-1 BFS (waits cost 0); `deadEnds` lists the first 20 (fewest moves first) with their input paths and `deadEndCount` counts them all; `trivial` is par 0; a reaction loop comes back as `error: { kind: 'cascadeOverflow', path }`, not a throw; the core may not read the clock, so `timeMs` needs `clock` (the worker passes `() => performance.now()`); and `nextAction` picks the fewest moves, then the fewest ticks, so following it never waits in a loop. Throughput is about 7,000 states/s (c1p2 fixture: 3,429 states in ≈ 0.4 s), so the 60 s budget for 65 pages is roughly 6,000 states per page on average; the 2,000,000 cap is a memory guard (≈ 1 KB per state at peak), not a time budget. `npm run solve` (#88, `scripts/solve-pages.ts` over `pages/report.ts`) prints the per-page report (par and band, states, ms, dead ends, trivial, 淘氣/土地公, lint) and the total against the 60 s budget, judging pages exactly as `pages.test.ts` does; readings in D-49.

### 3.8 Save format

```ts
interface SaveV1 {
  v: 1;
  pages: Record<Id, { solved?: true; mischief?: true; tudigong?: true; bestPar?: number }>;
  photos: Record<number, { frame: 'A' | 'B' | 'C'; mocha: boolean; at: number }>;   // chapter → kept photo
  furthest: Id;            // last unlocked page id
  current: Id;             // page to resume
  settings: { speed: 0 | 1 | 2; bigText: boolean; elder: boolean; autoHint: 0 | 15 | 30;
              sfx: number; music: number; vibrate: boolean; reduceMotion: boolean | null; leftHand: boolean };
}
```

Validated with a type guard on load. A bad or missing save means a fresh save, and the game goes on (the same pattern as `loadJson`). There is a migration hook for `v: 2`.

**For engineers.** `src/popup/game/progress.ts` (#93) implements this: `loadSave` / `saveNow`, the guard `isStoredSave`, the migration ladder `UPGRADES`, the pure rules (`completePage`, `earnSticker`, `keepPhoto`, `updateSettings`, `openPage`, `resetSave`, `isUnlocked`, `isChapterUnlocked`, `ownedAbilities`, `pageAbilities`) and the live `ProgressStore`, which writes on every change and on `visibilitychange: hidden`. On disk each page record is packed into a short code (`'smt12'`), so a complete game is about 1.7 KB, not 5.2 KB. Reset keeps the settings. A replayed page keeps its designed growth as well as its words. The RPG saves are detected and retired by `hadRpgSave` / `retireRpgSave` (`src/shared/legacy.ts`); #109 calls them. Readings in D-55.

### 3.9 Rendering and art integration

**Layers per page:**
1. Baked backdrop bitmap (WebP @2x, from the environment artist's SVG at build time).
2. Standing cut-outs (SVG, static).
3. Floor plane.
4. **Parts** (SVG groups; transforms only: `translate` / `rotate` / `scaleY` for flaps), ordered by `z`.
5. Creatures.
6. Baokaka and Mocha (baked sprite frames from the `docs/art/v2` pipeline, as `<image>` or CSS sprites).
7. Bubbles and effects.
8. Hit layer (invisible SVG shapes from `hit`).

**Paper look** (pending the environment artist's spec):
- Each part has an off-white cut edge and a soft drop shadow **baked into its art**.
- No runtime SVG filters on moving elements (performance rule carried over from `docs/art/art-direction.md` §0.5).

**Animation:** the view lerps each actor from the previous tick's node position to the new one over the tick duration (ease-in-out). Parts tween to their new state's transform over 250 ms. Rides lerp with the part.

**Placeholder art (M0–M1):** every preset has a default paper-craft placeholder (coloured card with a cut edge and a label), so engineers never wait for art.

**Sprite needs** (for the character artist):

| Character | Frames needed |
|---|---|
| **Baokaka** | crawl cycle (8) · sit · reach (2) · look L/R · cry (2) · grab · eat · watch-sway (2) · cuddle · say (mouth open) · ride-giggle · carried · climb (3) · stand-cruise (4) · walk (8, wobbly) · touch-watch head turn |
| **Mocha** | sit · loaf · hop (3) · land · eye-contact · push (2) · glare · puff (wet) · purr · in-box · walk (linked mode, 8) |

All frames are at map scale (~70 px tall for Baokaka crawling, at 390-wide).

**For engineers.** #89 built the renderer:
- **Code.** `view/PageView.tsx` (layers in `view/layers.ts`: the bible § 2.2 z table mapped onto the order above, with mid parts (z3, the train) behind the near ledges) and `view/PagePlayer.tsx` (book frame at ≈ 0.91, HUD and bottom-bar slots), driven by `game/session.ts` (tick clock, pause, 150 ms resume grace, fast-forward). `view/interp.ts` holds the tweens; `view/stage.ts` and `view/art/placeholders.ts` draw a placeholder stage from the walk graph.
- **Budget.** Moving pieces are `data-anim` groups (transforms only). The ≤ 150 budget below is counted as every element inside them.
- **Readings** in D-50.

**For engineers.** #94 put the baked frames in the build (D-56): `npm run sync:sprites` bakes `docs/art/v2/baked` with the standee look into `src/popup/assets/sprites/` and the typed `src/popup/sprites/sprites.gen.ts`; `src/popup/sprites/` holds the loader (@2x for DPR ≤ 2, else @3x; `img.decode()`; a placeholder card until decoded; per-chapter groups) and `<SpriteAnim>` (one `<image>`, one shared rAF clock, `once` reports done, reduced motion holds the key frame, mirrored about the foot anchor). `view/actors/` draws 寶咖咖 and 摩卡 with it (a first mode mapping; #95 completes it). The core set every page preloads is 383.5 KB @3x.

**For engineers.** #95 mapped every mode to its frames (D-57): `view/actors/animMap.ts` holds the table (Art v2 § 5 names: grab → `hold`, cuddle → `hug`, say → `point`, stand-cruise → `pull`/`wobble`, Mocha hop/land → `jump`, eye contact → `push` frame 1), the fallbacks for frames #141 still draws, the growth guard and the missing-frame report (`#/pagelab?section=sprites`); `view/actors/standee.ts` the card motion (lean, landing wobble, look flips, reduced motion's fade-slide). Cycles are 8 frames (the table above says so since #95). The crawl stride is synced to the step's lerp (whole strides per edge; the 4-frame `key` cycle above 24 fps). Frames needed only from M3/M4 (carried, climb, stand-cruise, walk, Mocha's linked walk) are `later` in the report. The core set is now 396.6 KB @3x (`hug` joined it as the cuddle frame).

**For engineers.** #141 drew the missing frames (D-58): reach's second, look L/R, watch-sway, ride-giggle, touch-watch, carried, climb (pull-up, knee-over, up on all fours), and Mocha's glare, purr and in-box (head and paws over the rim, drawn at the box perch). No M1 fallback is left; stand-cruise has 3 of its 4 frames. Preload groups now mean "this chapter and every later one", and the core set is the prologue's: 381.1 KB @3x, with chapter 1 adding 66 KB.

**For engineers.** #96 baked the environment (D-59): `npm run bake:popup` renders each page's backdrop (its art, or its chapter's placeholder stage, with filters, grain and the chapter grade) and each part art key with a drawing (a bitmap per state, a lifted variant for dragged presets, `pivot` / `hinge`) to WebP @2x in `src/popup/assets/env/`, with the manifest `src/popup/env/env.gen.ts`. The registry (`view/art/registry.ts`) draws a key's bitmap when baked and the live placeholder otherwise. `PageDef.cutouts` places standing cut-outs (layer 2). A page preloads its bitmaps and, once they are in, the next page's backdrop. `env.test.ts` holds every page to 350 KB and the first load (the prologue's art plus its characters @3x) to 2.5 MB; `npm run art:report` prints the report. The characters get the chapter's half grade as baked sprite variants. 1-2's split-flap board is the first real part art (proof A); its hit area and the 土地公 moved to fit it (§ 3.4's numbers are the original layout).

**Performance budget:**
- 60 fps on a mid-range phone (2021 Android).
- ≤ 150 animated DOM/SVG nodes per page.
- Page art payload ≤ 350 KB.
- First load ≤ 2.5 MB, then lazy-load chapters.
- Time to the first interactive page ≤ 3 s on 4G.

### 3.10 PageLab (dev editor/viewer, `#/pagelab`)

- **Left:** a page list with solver status badges (ok / dead-end / over cap).
- **Centre:** the page rendered with overlays, toggled by checkboxes:
  - nodes (dots coloured by height);
  - edges (coloured by kind; dashed when the condition is false);
  - perches and cat edges;
  - attractors with priority numbers;
  - hit areas;
  - Baokaka's current target line and path preview.
- **Controls:** reset · play/pause · one tick · speed · "apply input" palette (every legal input as a button).
- **Solver panel:** run → par, states explored, time, dead-end count (click one to load that state), the shortest solution with a "play it" button, and mischief/土地公 reachability.
- **Edit mode:** drag nodes and part tracks, then "Copy TS" copies the updated `nodes` and `track` blocks to the clipboard for pasting into the page file. Structural edits stay in code (simple, reviewable).
- **State inspector:** the JSON of `SimState`, plus the event log of the last 20 ticks.

**For engineers.** #91 built it in `src/popup/dev/`: `PageLab.tsx` (shell, `section=kit` stays), `LabWorkspace.tsx` (the three columns), `Overlays.tsx`, and the pure, tested parts — `labParams.ts` (the URL: `page`, `overlay`, `tick`, `speed`, `edit`, `view`), `labModel.ts` (the lab's own stepper with a 20-tick log, the overlay data, `moveNode`/`moveTrackEnd`, the touchable count, the art-key report, badges), `copyTs.ts` and `solverJob.ts`, which `solver.worker.ts` runs off the main thread. The page list also shows lab-only broken fixtures (`labPages.ts`). Dev builds only: `dist/` has no PageLab chunk or worker. Readings in D-52. #92 added the visual QA fixtures (`dev/fixtures.ts`): `#/pagelab?fixture=<name>&still=1` renders a named, engine-replayed state full screen for screenshots, and `scripts/ui-check.mjs` checks R5 (text size, contrast), R6 (hit areas), reduced motion and flashing on every fixture. Readings in D-53.

---

## 4. Content plan

### 4.1 Story frame

The frame is adapted from `docs/story/story-bible.md`. It keeps the 抓周, 咻咻, 05:30, 土地公 and the first word 「摩卡」. It drops the party members, battles, shops and the coin economy.

- **The night before 度晬:**
  - 阿嬤 sets out the 抓周盤: nine treasures around a 金鎖片, each a wish.
  - Next to it lies her birthday present for the baby: a pop-up book called 《台北》.
  - She tells 摩卡 to guard the tray 「今暗顧好喔」. Mocha falls asleep.
- **00:00:**
  - A pillow-sized baby typhoon, **咻咻**, squeezes in through the window crack. It was born the same stormy night as Baokaka, and it wants to see what a "birthday" is.
  - It gets excited and spins. The treasures fly out of the window, and the pop-up book flaps open.
  - 咻咻 flees with the 金鎖片 tangled in its swirl. As it goes, it sheds tiny **金珠珠** (golden beads from the lock's tassel), one on every page.
- **The rules of the night:**
  - The book's pages *are* Taipei tonight, folded in paper.
  - A paper train, the **月亮線**, runs between the pages for everyone who isn't asleep.
  - 寶咖咖 saw everything from his crib. Mocha wakes up guilty.
  - They have until **05:30**, when 阿嬤 wakes.
  - The clock on each chapter card is atmosphere only (R3).
- **Mocha's arc:** he was the family's baby before Baokaka (「你來了以後，大家手機裡都是你的照片」). Over the night he goes from "babysitting the kid" to "my little brother". It is told through his translations and photo comments, and paid off in the ending.
- **咻咻's arc:**
  - It is glimpsed in the corner of every chapter spread, as a little cloud peeking.
  - At 淡水 (9-5) it is found circling the 淡江大橋 tower, trying to leave the basin (台北是盆地).
  - It flies to 101, 「離天空最近的地方」, and builds a sad birthday party out of things it blew away.
  - Baokaka's 「一起」 and his **first steps** reach it.
  - It gives back the lock, and the 金珠珠 thread back onto the red string.
- **Ending:**
  - 05:30: the tray is complete, and Mocha is asleep on it. 阿嬤: 「摩卡真乖，顧規暝。」
  - 10:00: the **抓周**, an interactive page. The rules of the game break once: he crawls past every treasure and grabs Mocha's tail.
  - His first word is 「摩卡」, then 「咻咻」. Dad loses twice.
  - Post-credits: the 阿伯 hidden on every page was the neighbourhood **土地公**.
- **Recurring cast:**

| Who | Role |
|---|---|
| **土地公** (as 阿伯 in different hats) | Hidden sticker on every page |
| **廣播姊姊** | Every 月亮線 page |
| **背包客** (「Where is 101?」) | 1-1, 3-1, 9-2, and the 101 roof |
| **店員小哥** | Background cameo in a shop on 1 page per chapter: 「我們是連鎖的。」 |
| **藍教授** (台灣藍鵲) | Cameo creature, 3-6 |
| **黑糖** (台灣黑熊) | Cameo creature, 7-6 |

### 4.2 Chapter list

| # | Landmark (page set) | Card time | 月亮線 line (page 1) | Treasure (meaning) | New word / growth (page 3) | 土地公's hat | 咻咻 beat |
|---|---|---|---|---|---|---|---|
| 0 | 家 Home (4 pages) | 00:00 | — (the train arrives at the balcony) | — | (要！ innate); tutorial: tab, flap, Mocha, crying | none (shrine across the street) | Blows the treasures away |
| 1 | 台北車站 | 00:20 | 板南線 (blue) | 雞腿, 台鐵便當 (有口福) | **嗶！** | 站務帽 | Peeks from the departure board |
| 2 | 大安森林公園 | 00:50 | 信義線 (red) | 畫筆 (藝術天分) | **掰掰** | 斗笠 + 掃把 | Rustles the leaves |
| 3 | 台灣大學 | 01:20 | 松山新店線 (green), 公館 | 書 (會讀冊) | **不要！** | 藍色校工帽 | A ripple across 醉月湖 |
| 4 | 西門町 | 01:50 | 板南線 (blue), 西門 | 麥克風 (會唱歌) | **哇！** | 算命墨鏡 | Flickers a neon sign |
| 5 | 士林夜市 | 02:20 | 淡水信義線 (red), 劍潭 | 蔥, 蔥抓餅 (聰明) | **抱抱** | 鴨舌帽 | Blows a balloon loose |
| 6 | 松山機場 | 02:50 | 文湖線 (brown, driverless) | 印章, passport stamp (做頭家) | **飛機！** | 機場背心 | 塔台 log: 「咻咻可以起飛嗎？」 |
| 7 | 貓空 (動物園 → 纜車 → 茶園) | 03:30 | 文湖線 → 貓空纜車 | 芹菜 (勤勞) | **爬樓梯** (climb) | 叢林帽 | A shape crossing the moon |
| 8 | 北投 | 04:00 | 新北投支線 | 算盤 (會做生意) | **咻——** | 頭上一條毛巾 | Steam swirls the wrong way |
| 9 | 淡水・漁人碼頭・淡江大橋 | 04:40 | 淡水信義線, end of line | 聽診器 (照顧別人) | **扶著站** (stand/cruise) | 船長帽 | **Met in person** at the bridge tower (9-5) |
| 10 | 台北101 | 05:10 | 信義線, 台北101/世貿 | 金鎖片 | **一起** (10-5) + **第一步** (10-6) | 清潔帽 | The party on the roof |
| E | 家: 抓周 | 10:00 | — | (Mocha) | His first word | 土地公 statue winks | A breeze through the window |

**Structure of every chapter:**

| Page | Purpose | Typical difficulty |
|---|---|---|
| 1 | 月亮線 ride: a warm-up that reviews earlier words | 1–3 |
| 2 | The landmark's signature mechanism | 2–4 |
| 3 | Learn the new word or growth stage, in a story beat, then use it once | 2 |
| 4 | Apply the new word with the landmark mechanism | 3–4 |
| 5 | Combination puzzle | 3–5 |
| 6 | Treasure **spread** + photo | 3–5 |

**Totals:** prologue 4 + 10 × 6 + ending 1 = **65 pages**, plus a post-game bonus page. The difficulty climbs across chapters (average ≈ 1.5 in the prologue, ≈ 2.3 in chapter 1, ≈ 3.8 by chapter 8), with a breather at every page 3. The 101 finale lowers difficulty at the end (10-6 is 3), so the emotional climax is never blocked by a hard puzzle.

**Data-model fields the pages rely on** (already in the §3.2 types):
- `AttractorDef.nodeBy?: { part: Id; map: Record<string, Id> }`: the attractor's node follows a part's state (a spotlight aim).
- `AttractorDef.followsPushable?: Id`: while the pushable is `onPerch`, the attractor sits at `node`; once it has `landed`, it sits at the pushable's `fallTo` node. This is the "Mocha knocks the bead down" pattern.
- `AttractorDef.heldBy?: Id`: a creature holds it. It is visible but stays at the creature's node, and it drops when the creature's reaction has `drop`.
- `PageDef.priorityOverride?: Partial<Record<Kind, number>>`: used **only** on page E.
- **Decoys** are shinies that can never be grabbed: a moon reflection, a brass bell, an ad screen, reading glasses. Their node is unreachable by design. Baokaka fixates on them and reaches forever, until 不要！ or until they're hidden. (See §2.2.1.)

### 4.3 Prologue and chapter 1, in full

Each page lists the same fields:
- **Goal**
- **Parts**
- **Baokaka's desire** (what he sees and wants at the start)
- **Mocha's role**
- **Solution** (the intended, shortest one)
- **The aha**
- **淘氣** (mischief)
- **土地公** (where he hides)
- **Notes** (tutorial, script, edge cases)

#### Prologue 序章「度晬前一晚」 (家, 00:00)

The chapter opens with the intro card and lines (§5.2 P). There is no Mocha on pages 0-1 and 0-2: he is asleep in the background art, on the 抓周 table.

**0-1 「嬰兒床」 (The crib)** · difficulty 1 · par 1

| | |
|---|---|
| Goal | 金珠珠 on the rug, beyond the crib |
| Parts | `crib-rail` **tab** (`up`, `down`), pulled downward from the page's bottom edge. `mobile`: **prop** (`still`, `spin`). |
| Desire | The bead is visible but unreachable. He crawls to the crib side nearest the bead and **reaches**: 「要！要！」 |
| Mocha | Asleep in the background (not an actor) |
| Solution | Pull the rail down. He crawls down the pillow slope and grabs the bead. |
| Aha | "I move the world, not the baby." |
| 淘氣 | 「讓床鈴轉起來」: tap the mobile (`partEnter mobile spin`) |
| 土地公 | A tiny figure in the street shrine, seen through the window (always visible) |
| Notes | Scripted tutorial: after 4 s of reaching, a ghost hand demonstrates the tab. This is not the hint ladder; it shows on the first play only. Line: Mocha snoring 「呼……嚕……」 |

**0-2 「沙發山」 (Sofa mountain)** · difficulty 1 · par 1

| | |
|---|---|
| Goal | 金珠珠 behind the sofa cushion |
| Parts | `cushion`: **flap** (`closed` hides the bead). `tv`: **light** (`on`, standby LED; not tappable). `newspaper`: **flap** over sleeping Dad's face (a prop for mischief). |
| Desire | No shiny is visible, so the TV light (priority 4) wins. He crawls to the TV and **watches**: 「好看！」, swaying. |
| Mocha | Background |
| Solution | Tap the cushion flap. The bead appears, his bubble flips from the music note to the sparkle, and he turns around and grabs it. |
| Aha | "His bubble shows what he wants, and showing him something better changes his mind." |
| 淘氣 | 「掀開爸爸的報紙」: open the newspaper. Dad sleep-talks 「叫……爸爸……」 |
| 土地公 | In the family photo on the wall |
| Notes | First appearance of the bubble-change animation. The tutorial highlights the bubble. |

**0-3 「摩卡起床」 (Mocha wakes up)** · difficulty 2 · par 1

| | |
|---|---|
| Goal | 金珠珠 lying on the high 抓周 table (`followsPushable: bead`, `fallTo` the rug node beside the table) |
| Parts | `bead`: **pushable** on the `table` perch. `redEnvelope`: **pushable** (阿嬤's 紅包) on the `shelf` perch. |
| Desire | The bead is visible on the table, which is height 1 and unreachable. He reaches under the table. |
| Mocha | Wakes on the sofa arm (perch `sofaArm`); join scene §5.2 P. Perches: `sofaArm`, `table` (`push: bead`), `shelf` (`push: redEnvelope`). |
| Solution | Tap the `table` paw print. Mocha hops up, makes **eye contact** with the camera, pushes the bead off; it lands on the rug and he grabs it. |
| Aha | "Cats knock things off tables, and that's a superpower." |
| 淘氣 | 「讓摩卡把紅包推下來」: the envelope lands next to Baokaka, who pats it: 「這個！」 (flavour only) |
| 土地公 | On the wall calendar (農民曆) |
| Notes | First use of perch markers; a ghost hand on `table` after 4 s. Mocha's join lines play when the page opens. |

**0-4 「窗外的月亮線」 (The Moon Line at the window)** · difficulty 2 · par 2

| | |
|---|---|
| Goal | 金珠珠 on the step of the paper 月亮線 train outside the balcony |
| Parts | `curtain`: **flap** (`closed` hides the train and bead). `balconyDoor`: **gate** (`closed`; `react: cry → open`; it then stays open). `train`: **light** (`off`; `react: cry → on`): the bead on its step glints only once its lights are on (`visibleWhen`: curtain open **and** train on; #183). |
| Desire | At the start the curtain is closed, and Mocha sits visible on the windowsill. He crawls to Mocha and **cuddles**. |
| Mocha | Perches: `sill` (visible), `basket` (laundry basket, **hidesMocha**), `rod` (curtain rod), `trainRoof` (reachable only when the door is open). |
| Solution | Tap `basket`. Mocha hides in the laundry, and nothing is visible. Baokaka **looks** 「？」, then **cries** 「哇——」. The cry opens the balcony door and wakes the train (lights on, 廣播姊姊's line), and the bead glints on its step. Tap the curtain open: he crawls out onto the train step. The two moves work in either order: opened first, the curtain shows a dark train and no bead, so hiding Mocha still leaves nothing to want. (Mocha boards automatically during the page fold.) |
| Aha | "Make him cry on purpose. Crying is a tool." *(Before #183, opening the curtain first showed the bead behind the shut door and he reached at it forever without crying: the AI playtest's order trap. The solver now fails any such "soft trap", § 3.7.)* |
| 淘氣 | 「把摩卡捲進窗簾」: close the curtain while Mocha is on `rod` (event `partEnter curtain closed` with `mochaAt rod`). Mocha becomes a 春捲. |
| 土地公 | Outside on the street, visible when the curtain is open |
| Notes | The hint ladder's first real use (auto-nudge at 30 s). Dead-end check: every action is reversible. Leaving the door open is harmless. |

**For engineers (#106, D-69).** The four prologue pages are `src/popup/pages/c0/p1.ts`–`p4.ts`, as specified above; `npm run solve` proves each (no dead ends; 淘氣 and 土地公 reachable). 0-3 keeps par 1 at difficulty 2 as written (the solver warns that par 1 is under difficulty 2's band; the difficulty is the push's novelty, not its length). Additions:
- 0-2's newspaper plays Dad's 「叫……爸爸……」 (`c0p2.dad.1`) and 0-3's 紅包 landing plays 寶咖咖's 「這個！」 (`c0p3.envelope.1`), both through `lines.onEvent`.
- The scripted tutorials (`game/tutorial.ts`) run until the save marks the page solved. 0-1: the ghost hand pulls the tab after 4 s of reaching with the rail up. 0-2: a moonlight spotlight (not marigold, because the bubble isn't a touchable) circles his thought bubble once he watches the TV, and stays through the flip until he has the bead. 0-3: the ghost hand taps `table` after 4 s of reaching, after Mocha's join lines.
- Indoors, a perch up on the standing page is drawn as a wall shelf, and a box perch is drawn as a laundry basket whose rim is the perch node. Until #108 these are the placeholder stage's furniture.

#### Chapter 1 「便當的味道」 (台北車站, 00:20)

Chapter card and lines: §5.2 ch1.

**1-1 「月亮線，出發！」 (板南線 car)** · difficulty 1 · par 1

| | |
|---|---|
| Goal | 金珠珠 under the 博愛座 at the far end of the car |
| Parts | `backpacker`: **creature** asleep, whose huge backpack blocks the aisle node (`sleep` → `tucked` on `land: map`). `map`: **pushable** on the luggage-rack perch above him (falls onto his face). `sway`: **prop** pull-tab (`left`, `level`, `right`) that tilts the car, a pure toy. |
| Desire | The bead is visible but blocked by the backpack. He reaches at the backpack. |
| Mocha | Perches: hand straps ×3 (cat-jump chain), `rack` (`push: map`) |
| Solution | Tap `rack`. Mocha strap-hops over, pushes the map, and it lands on the backpacker. He wakes — 「Excuse me… where is 101?」 — and pulls his backpack in. Baokaka crawls to the bead. |
| Aha | "What Mocha pushes can wake people up." (A review of 0-3, in a new place.) |
| 淘氣 | 「讓摩卡吊在拉環上盪鞦韆」: Mocha on any strap perch while `sway` enters `left` or `right` |
| 土地公 | In the car's advertising frame, as a 「請讓座」 poster character |
| Notes | 廣播姊姊's opening lines. Mocha's translation line for 「Where is 101?」 (§5.3). |

**1-2 「月台的縫」 (The platform gap)** · difficulty 2 · par 2 · *(full data example in §3.4; mock: `docs/design/mocks/pop-up-taipei.png`)*

| | |
|---|---|
| Goal | 金珠珠 on the right-hand platform |
| Parts | `train`: **tab** (`out`, `half`, `full`). The `full` state requires the pigeon `away` (it's sitting in the track slot); otherwise the tab **jams** at `half`. `board`: **prop** split-flap departure board (`times`, `flip`). |
| Desire | The bead is visible and unreachable. He reaches at the platform edge. |
| Mocha | Starts on `bench` (right platform). Perch `pillar` is next to the pigeon (`fleesFromCat`). |
| Solution | Pull the tab: it jams at `half`. He crawls onto the train car and reaches from its end. Tap `pillar`: Mocha hops up, and the pigeon flaps away. Pull the tab to `full`: he **rides** across, 「哇！」, and grabs the bead. (Mocha first, then the tab, also works; par 2.) |
| Aha | "The jam is a pigeon, and pigeons are scared of cats." |
| 淘氣 | 「坐火車來回兩次」: Baokaka `ride` count ≥ 4 |
| 土地公 | Revealed on the departure board when it is flipped (`board: flip`) |
| Notes | First **ride**. Lint: the train nodes have positions in all states. |

**1-3 「嗶！閘門」 (Fare gates)** · difficulty 2 · par 2 · **learn 嗶！**

| | |
|---|---|
| Goal | 金珠珠 beyond the second gate (B, the exit gates) |
| Parts | `card`: **pushable** (a 悠遊卡-like card, unbranded) on the 服務台 counter perch, falling onto the `reader`. `reader`: **button** (`up`, `down`; `emit: down → beep`). `gateA`: **gate** (`react: beep within 120 → open`; the reader sits beside it). `gateB`: **gate** (`react: beep within 120 → open`); it is far from the reader, so only Baokaka's own 嗶！ opens it. `robot`: **prop** floor-cleaning robot (`idle`, `spin`; `react: beep within 120 → spin`). |
| Desire | The bead is visible. He reaches at gate A. |
| Mocha | Perches: `counter` (`push: card`), `ticketMachine` |
| Solution | Tap `counter`. Mocha pushes the card onto the reader: 「嗶！」, and gate A opens. He crawls through and **learns 嗶！** (`learns: { word: 'beep', when: { event: 'beep' } }`; the learn lines play, and the word ring tutorial runs). He reaches at gate B. Tap Baokaka, then 嗶！: gate B opens, and he grabs the bead. |
| Aha | "He copies sounds, and his words are tools." |
| 淘氣 | 「對掃地機器人說『嗶！』」: the robot spins in circles, and Baokaka giggles |
| 土地公 | In the 詢問處 booth window, wearing a station cap |
| Notes | The card stays on the reader (one-way, non-blocking). Word ring first-use tutorial: Baokaka's portrait glows, a ghost hand taps him, then 嗶！. |

**1-4 「大廳的棋盤」 (The checkerboard hall)** · difficulty 3 · par 3

| | |
|---|---|
| Goal | 金珠珠 north of the hall, past a fare gate |
| Parts | `floor`: **wheel**, a big checkered turntable (states `0`–`3`; 0 and 2 = aisle east–west, 1 and 3 = aisle north–south). Seated travellers are printed on the disk and form the aisle. The centre node `C` is fixed; Baokaka visibly turns with the disk. `gateN`: **gate** (`beep`). |
| Desire | The bead is visible. The start state is `1` (N–S), so the west entry `W` is disconnected; he reaches at `W`. |
| Mocha | Perch `clock` (the big hall clock; decorative). Perch `lightbox` (a sign above gateN). Decorative only; the page is about timing, not Mocha. |
| Solution | Turn the floor to E–W (`0` or `2`). He crawls into the centre and reaches north. Turn the floor to N–S while he sits on it (he rides). He crawls to gateN. Say 嗶！; the gate opens, and he grabs the bead. |
| Aha | "Turn it *while he's on it*." Turning too early leaves him stranded at the entry; the hint ladder teaches the order. |
| 淘氣 | 「轉四圈，轉到頭暈暈」: four `partEnter floor` events while `babyAt C` |
| 土地公 | Among the seated travellers printed on the disk; his face shows only in state `2` |
| Notes | First page where waiting at the right moment matters. There's still no timer: he waits at `C` forever. |

**1-5 「便當店的電梯」 (The bento-shop elevator)** · difficulty 3 · par 2 *(par 3 before #107: the crawl in is his own move)*

| | |
|---|---|
| Goal | 金珠珠 on the floor of the 便當店 on 1F (a cross-section page: B1 below, 1F above) |
| Parts | `elevator`: **lift** (`B1`, `1F`; `react: partEnter panel down → toggle`). Car node `E` is attached to it. `panel`: **button** inside the car, pressed by Mocha's perch `panel` (`onPart`). Petting Mocha re-presses it. |
| Desire | The bead is visible upstairs. The car starts at 1F, so he reaches at the B1 door (the reachable node nearest the bead). |
| Mocha | Starts on 1F perch `counter`. The cat edge `counter ↔ panel` exists when the car is at 1F; `b1Shelf ↔ panel` exists when it is at B1. |
| Solution | Tap `panel`: Mocha jumps into the car and presses, and the car goes **down**. Baokaka crawls in (the car is now the node nearest the bead). **Tap Mocha** to press again: the car goes up with both of them, and he grabs the bead. |
| Aha | "Mocha is the elevator operator. Tap him to press again." (Introduces `pet`.) |
| 淘氣 | 「讓摩卡自己搭電梯上下三次」: three `elevator` round trips while Baokaka isn't in the car |
| 土地公 | On the shop's menu board, among the dish pictures |
| Notes | The 店員小哥 cameo works the 便當 counter: 「叮咚～歡迎光臨！」 First play only (#183): 4 s after the car comes down with him in it, Mocha taps his paw on the panel, shimmers once and says 「再按一次？」. |

**1-6 「台鐵便當」 (Spread: the railway bento)** · difficulty 3 · par 4 · **treasure 雞腿**

| | |
|---|---|
| Goal | 雞腿 inside the giant 台鐵-style bento (unbranded) on the bento cart |
| Parts | `cart`: **slider** (`kitchen`, `middle`, `platform`); the cart node is attached. `lid`: **flap** on the cart (`closed` hides the 雞腿). `pigeon`: **creature** (`roof` / `cart`; `react: partEnter lid open → cart`, `lid closed → roof`; `fleesFromCat` from perch `canopy` → `roof`). It blocks the cart node while at `cart`. `exitGate`: **gate** (`beep`). |
| Desire | The lid is closed, so the 雞腿 is hidden. Mocha is visible on the station clock, so he crawls toward Mocha's reach node by the gate. |
| Mocha | Perches: `clock`, `canopy` (the cart's awning; reachable only when the cart is at `platform`) |
| Solution | Open the lid: the 雞腿 appears, the pigeon swoops onto the cart, and he reaches at the closed gate. Say 嗶！; the gate opens. Slide the cart to `platform`. Tap `canopy`: Mocha jumps onto the awning, and the pigeon flees. He crawls onto the cart. **Photo moment**, and he grabs the 雞腿: 「好吃！」 |
| Aha | Everything from the chapter in one picture. The pigeon is attracted by *the same thing* the baby is. |
| 淘氣 | 「讓鴿子白跑三趟」: open the lid 3 times |
| 土地公 | Visible through the window of the train behind the cart, but only when the cart is at `kitchen` |
| Notes | Photo: §2.9, comments §5.6 ch1. After the album, the chapter-end lines play, the 抓周 tray's first slot fills, and the next chapter card appears. |

**For engineers (#107, D-70).** Chapter 1's pages are `src/popup/pages/c1/p1.ts`–`p6.ts`; with the prologue they are the 10-page slice, and `npm run solve` proves each (no dead ends; 淘氣 and 土地公 reachable; the slice solves in ≈ 0.25 s). Par per page: 1-1 1, 1-2 2, 1-3 2, 1-4 3, 1-5 **2**, 1-6 4. Where the data differs from the tables above:
- **1-1.** Two hand straps, not three: a chapter's first three pages show at most three touchables plus perches (bible § 4.2), and the sway tab is one of them. `sway` is a `tab` (a pull-tab; a `prop` can only be tapped). The page opens on 廣播姊姊's ride lines (`rec.pa.ride.1`, `.2`); the map's landing plays the backpacker's question and Mocha's translation.
- **1-3.** His 嗶！ at gate B always reaches the robot, so the plain 淘氣 would come free with the solution. The 淘氣 is 「對載著摩卡的掃地機器人說『嗶！』」: 嗶！ heard while Mocha rides the spinning robot (a new perch, `robotLid`). The card stays on the reader, and the solver's dead-end check covers it.
- **1-4.** The 淘氣 counts four turns with him anywhere on the disk (its centre or riding an aisle seat), not only at `C`. The bead sits just past gate N, so the centre is his nearest spot while the aisle runs east–west.
- **1-5.** Par is 2 (tap `carPanel`, tap Mocha): the crawl in is his own. The 淘氣 「讓摩卡自己搭電梯上下三次」 can never happen, because he boards the car the tick it reaches B1 and the next ride up ends the page. Instead Mocha sits on the shop counter's 叮咚 bell: tapping him rings it, the first ring plays the 店員小哥 cameo (`c1p5.clerk.*`), and three rings are the 淘氣 「讓摩卡按三次叮咚鈴」. The car's panel rides the car (`ridesOn`).
- **1-6.** The cart starts at `middle`, so the 土地公 (only at `kitchen`) is a find. It carries a step and the bento; the pigeon lands on the step, two edges from the 雞腿, so the photo moment catches his approach once it flees. While Mocha sits on the awning the pigeon stays on the roof when the lid opens. The lid rides the cart (`PartDef.ridesOn`, a view-only field: hit and art move with a node).
- **The chapter's end** (`GameShell`): the album → the end lines (`endLines(1)`, over the dimmed spread, a tap a beat) → the tray's first coin drops into its slot → the sticker card → the chapter turn to chapter 2's card with 「未完待續」 on its split-flap row and `rec.soon.1` 「下一站還在畫……未完待續。」 under it → the 目錄. The thought bubble shows the treasure itself on a spread.

### 4.4 Chapters 2–10 and the ending: outline

Each row gives the page's key mechanic and its aha. Full specs (in the §4.3 format) are written per milestone (§7). Every page has a 土地公 (in the chapter's hat) and a 淘氣.

#### Chapter 2 「會揮手的公園」 (大安森林公園, 00:50) · treasure 畫筆 · word 掰掰

**Specified in full** (the § 4.3 format, node/edge sketches, the solver's numbers): [`docs/design/pages/c2.md`](pages/c2.md) (#114, D-77). The rows below are the outline, updated where the full spec changed it.

| Page | Title | Key mechanic → aha | 淘氣 | Diff |
|---|---|---|---|---|
| 2-1 | 信義線 | 嗶！ opens the car doors. Mocha pushes a sleeping commuter's umbrella, which lands across the platform gap (a pushable that enables an edge). | Mocha sits on the 博愛座, and 廣播姊姊 says 「請讓座」 | 2 |
| 2-2 | 露天音樂台 | A spotlight **wheel** moves a light attractor (`nodeBy`). Mocha on the lamp beats any light, so first he hides in the 店員小哥's crate (C9, the chapter's cameo); then steer Baokaka with the light while the bead is hidden behind the curtain. His weight on the trap-door plate raises the curtain. → *Light is a leash.* | Shine the spotlight on the sleeping 掃地阿伯 | 2 |
| 2-3 | 跑步的阿姨 | **Learn 掰掰**: a stretching jogger blocks the bridge; she sees Mocha on the railing, laughs and waves 「掰掰～」, and jogs off. He copies. Then 掰掰 a dog sleeping on the path, curled round the bead. | 掰掰 to the pond turtle (it waves back… slowly) | 2 |
| 2-4 | 松鼠的樹 | A squirrel holds the bead (`heldBy`) and flees to the branch farthest from Mocha when he lands next to it. Herd it to the low branch with Mocha, then 掰掰 so it waves and drops the bead. → *Herd, then wave.* | Make the squirrel run three laps around the trunk | 3 |
| 2-5 | 生態池 | A lily-pad **wheel** ferries him across. 掰掰 an egret off the pad. Mocha **won't** go near the water (C7), so he's no help. → *Not every problem needs the cat.* | Give the egret four rides on the turning pad (D-77: a puff is not a page event) | 3 |
| 2-6 | 畫畫的阿伯 (spread) | The painter's canvas has three painted **flaps** that pop up into real paper: a bridge for him, a branch for Mocha, a portrait corner (pop-up inside a pop-up). The sleeping painter holds the 畫筆 and drops it on 掰掰, but only once a squirrel is shooed off his hat by Mocha. | Open all three canvas flaps: the painting becomes a portrait of Mocha | 3 |

#### Chapter 3 「醉月湖的鵝」 (台灣大學, 01:20) · treasure 書 · word 不要！

**Specified in full** (the § 4.3 format, node/edge sketches, the solver's numbers): [`docs/design/pages/c3.md`](pages/c3.md) (#116, D-79). The rows below are the outline, updated where the full spec changed it.

| Page | Title | Key mechanic → aha | 淘氣 | Diff |
|---|---|---|---|---|
| 3-1 | 綠線 | Review: 嗶！ the doors, 掰掰 the 背包客 out of the aisle (「Where is 101?」 #2). | 掰掰 to the ad poster: the poster person waves back | 2 |
| 3-2 | 椰林大道 | Three parked-bike **sliders** block the path between palm trees. Pulling an outer bike back into the rack shoves the middle one (the 店員小哥's delivery bike, the chapter's cameo; nothing to pull) out across the path. Mocha sits on its seat to **hold** it: shoves don't move it, and his landing rolls it back. → *Sometimes Mocha's job is to stay still.* | Ring a bike bell five times | 3 |
| 3-3 | 醉月湖 | **Learn 不要！**: the moon's reflection is a **decoy** shiny he fixates on. The goose honks 「嘎！不要過來！」 at Mocha, and he copies. Say 不要！ to the moon, and he follows Mocha past the goose, which chases Mocha and uncovers the bead. | Let the goose honk at Mocha twice (D-79: the chase is the reveal) | 2 |
| 3-4 | 傅鐘 | The brass bell is a decoy (shiny!). Pull the bell-rope **tab** to ring it: the pigeons' reaction to the rope's `partEnter` scatters them off the gate's plate. Then 不要！ the bell, and he follows Mocha (on the gate's pillar) over the plate: the gate opens. | Ring the bell 21 times (傅鐘二十一響) | 3 |
| 3-5 | 總圖書館 | Mobile compact shelving: four **sliders**, the end two cranked by wheels; each inner shelf rolls with its outer neighbour. An aisle opens only when its shelves roll apart, and the way is *through* the stacks (in by one aisle, out by another). Mocha holds an inner shelf while you crank its neighbour. | Shut Mocha between two shelves (he squeezes out on top, unimpressed) | 4 |
| 3-6 | 藍教授的書 (spread) | A giant book whose pages are **flaps** that become bridges. 藍教授 (a magpie creature) sits on the 書 and won't budge for 掰掰 (「根據我的研究——」); she hops off only when Mocha lands next to her. Her shiny reading glasses are a decoy: he sits on the very page that turns into Mocha's bridge, reaching for them, and the page won't turn under him until 不要！ moves him. | Open the book to the page with a cat in it; Mocha sits on it | 4 |

#### Chapter 4 「霓虹燈睡著了」 (西門町, 01:50) · treasure 麥克風 · word 哇！

**Specified in full** (the § 4.3 format, node/edge sketches, the solver's numbers): [`docs/design/pages/c4.md`](pages/c4.md) (#118). The rows below are the outline, updated where the full spec changed it.

| Page | Title | Key mechanic → aha | 淘氣 | Diff |
|---|---|---|---|---|
| 4-1 | 板南線往西門 | A shiny ad screen in the car is a decoy. Mocha onto the header over the doors, 不要！ the screen (he crawls to the doors, reaching for Mocha), then 嗶！. | Keep saying 不要！ — to the screen, then to Mocha — until he bursts into tears (a dramatic tantrum) | 2 |
| 4-2 | 紅樓 | The octagonal 紅樓 is an 8-step **wheel** with three doorways and a roof lantern window. Turn it so the window faces the street lamp: Mocha jumps in, squeezes along the roof and knocks a lantern onto the shop shutter's button. Turn it again until two doorways line up, and he crawls straight through. | Spin 紅樓 a full turn with Mocha on the roof | 3 |
| 4-3 | 霓虹燈睡著了 | **Learn 哇！**: a dark alley with nothing visible, so he cries, and the cry flickers a neon sign: 「哇！」. Then 哇！ wakes the next sign down the alley (and the last one sleeps) twice, a **trail of lights** leading him around the corner. → *Make your own leash.* | Hide Mocha behind a sign, then light it: Mocha's shadow becomes enormous | 2 |
| 4-4 | 夾娃娃機 | Claw machine: the claw's cart **tab** plus a drop **lever** (a second tab). Mocha sits on the coin slot to start it (the 店員小哥 cameo). The claw comes down, he crawls in, and it picks up **Baokaka** and carries him home over the chute, by the bead. Running joke: the claw only works for 寶咖咖. | Grab Mocha with the claw (「……」) | 3 |
| 4-5 | 街頭藝人 | Bring him near the speaker stack with Mocha; 哇！ turns on the boombox. The dancers freeze into an arch, opening a path, but the flashing boombox is now a decoy he wants forever: Mocha hops over the arch, 不要！ the music, and he follows Mocha through. → *Create a desire, then refuse it.* | Get the dancers to pose with Mocha in the middle | 4 |
| 4-6 | 走音天王 (spread) | Karaoke stage behind a shop shutter (a flap): rolling it up reveals a decoy disco ball. Mocha onto the amp and 不要！ the disco ball, and he waits at the stage front; 哇！ the stage lights, and the karaoke king sings (off-key), raising the stage **lift** that holds the 麥克風. | Make him sing three songs (the lights come on three times) | 4 |

#### Chapter 5 「夜市抱抱」 (士林夜市, 02:20) · treasure 蔥 · word 抱抱

| Page | Title | Key mechanic → aha | 淘氣 | Diff |
|---|---|---|---|---|
| 5-1 | 往劍潭 | A dark tunnel: 哇！ the car lights. 不要！ a decoy. Review. | Turn the lights off and on 5 times (the passengers blink) | 2 |
| 5-2 | 射氣球攤 | A balloon-basket **lift** with a counterweight. Baokaka in the basket rises only when Mocha jumps *out*. → *Mocha is a weight.* | Let all the balloons go (tap the knot) | 3 |
| 5-3 | 抱抱 | **Learn 抱抱**: in a crowded lane of legs, a 夜市阿姨 (a scripted carrier) picks him up and carries him across. He copies. Then 抱抱 the 雞排老闆 to cross his counter. | 抱抱 the 阿姨 a second time (she does a twirl) | 2 |
| 5-4 | 彈珠台 | A pachinko board: Mocha pushes the start ball, and two flipper **tabs** route the bead through the pegs to his side. | Send the ball into the jackpot hole; 彈珠台阿伯 laughs | 3 |
| 5-5 | 按摩椅 | Coin massage chairs as **lifts**: Mocha pushes coins into the slots, and the chairs recline into steps for a **carrier** (a sleepy 阿伯) to walk. → *抱抱 a carrier only once its route is clear.* | Mocha sits in a vibrating massage chair | 4 |
| 5-6 | 蔥抓餅 (spread) | The 蔥 sits on a stack of trays (a **lift**) behind the griddle counter. 抱抱 the vendor, use Mocha as a counterweight, and say 不要！ to the shiny griddle. | Make the vendor flip the pancake 3 times | 4 |

#### Chapter 6 「飛機睡著的時候」 (松山機場, 02:50) · treasure 印章 · word 飛機！

| Page | Title | Key mechanic → aha | 淘氣 | Diff |
|---|---|---|---|---|
| 6-1 | 文湖線前窗 | Driverless front window: track-switch **tabs** choose a branch (the scene re-folds); 抱抱 a sleeping passenger. | Take the loop branch three times | 3 |
| 6-2 | 行李轉盤 | The baggage carousel is a **loop**: ride a suitcase round to the bead. Mocha squeezes through the rubber curtain to press the start button. | Mocha rides three laps alone | 3 |
| 6-3 | 看飛機 | **Learn 飛機！**: on the observation deck a sleeping plane's lights blink; he points: 「飛……飛機！」. Pigeons sitting on the gate button fly up, and the gate opens. | Say 飛機！ five times (the plane winks its lights) | 2 |
| 6-4 | 空橋 | The jet bridge extends (**tab**) and swings (**wheel**) to the plane door. Roosting birds weigh down a seesaw; 飛機！ toggles them off and on. | Park the jet bridge at the wrong plane | 4 |
| 6-5 | 塔台 | A searchlight **wheel** moves a light attractor. A radio prop: 「Over。」. Birds on the window ledges block perches (飛機！), and 哇！ powers the runway lights. | Talk on the radio three times: 「Over。」 | 4 |
| 6-6 | 海關的印章 (spread) | Baokaka rides the X-ray **loop** conveyor (the screen shows his silhouette with a bottle). The stamp sits on the high counter (Mocha pushes it). 飛機！ the pigeons off the belt. | Stamp Mocha's paw (he glares) | 4 |

#### Chapter 7 「纜車上的月亮」 (貓空, 03:30) · treasure 芹菜 · growth 爬樓梯

| Page | Title | Key mechanic → aha | 淘氣 | Diff |
|---|---|---|---|---|
| 7-1 | 往動物園 | Review: 飛機！ night herons, 抱抱 a zookeeper, and 不要！ a shiny exhibit sign. | Wave 掰掰 at a sleeping pangolin | 3 |
| 7-2 | 纜車站 | Gondolas on a cranked **loop**. Choose which cabin to ride; Mocha refuses the glass-floor cabin (C8). | Send the glass cabin round with nobody in it | 3 |
| 7-3 | 茶園階梯 | **Learn 爬樓梯**: he watches the tea farmer climb a terrace, pulls himself up one step, and **climb** edges unlock. Then a terrace route. | Climb up and down the same step 5 times | 2 |
| 7-4 | 水晶車廂 | Inside a glass-floor gondola: cloud **flaps** below reveal and hide things on the ground (attractor visibility from below). Climb the seats; Mocha stays on the bench. | Open every cloud: Mocha looks down and loafs in protest | 3 |
| 7-5 | 大茶壺 | A giant teapot **wheel** tilts and pours tea, setting the water level (a lift-like state) under floating teacups, which become stepping-stones. Mocha avoids wet perches. | Fill a teacup with Mocha watching (「……」) | 4 |
| 7-6 | 菜園的芹菜 (spread) | 黑糖 the black bear sleeps on the celery bed. A cry wakes him (「歹、歹勢」). 抱抱 the bear, and he carries Baokaka up the terraces. Climb plus Mocha. | 抱抱 the bear twice (he hums) | 4 |

#### Chapter 8 「熱呼呼的煙」 (北投, 04:00) · treasure 算盤 · word 咻——

| Page | Title | Key mechanic → aha | 淘氣 | Diff |
|---|---|---|---|---|
| 8-1 | 新北投支線 | The themed car: climb the seats, 抱抱, and 不要！ a shiny window. | Climb onto every seat | 3 |
| 8-2 | 地熱谷 | Steam-vent valves (**wheels**) lift paper clouds as **lifts**. Steam perches block Mocha while the vents are on (C7). | Make Mocha's fur puff three times | 3 |
| 8-3 | 呼呼 | **Learn 咻——**: 溫泉阿嬤 blows on a hot egg (「呼呼再吃」), and he copies. 咻—— clears a steam cloud (**blowable**) that hides the bead path. | Blow the 溫泉阿嬤's hat off | 2 |
| 8-4 | 北投圖書館 | A balcony pinwheel (**blowable**, 4 states) drives a book-lift belt. Facing matters: he must face the pinwheel. Climb. | Spin the pinwheel 8 times | 4 |
| 8-5 | 大浴池 | A water-level **wheel** (drain/fill) moves floating wooden tubs as platforms. Mocha can cross only when the pool is drained. Sequence it. | Float Mocha's empty tub across | 4 |
| 8-6 | 澡堂的算盤 (spread) | A giant abacus: bead rows are **sliders** that you slide into a **staircase** (climb). 咻—— the steam off the counter. Mocha rings the bell. | Spell "1" on the abacus (his birthday) | 5 |

#### Chapter 9 「河的盡頭是海」 (淡水・漁人碼頭・淡江大橋, 04:40) · treasure 聽診器 · growth 扶著站

| Page | Title | Key mechanic → aha | 淘氣 | Diff |
|---|---|---|---|---|
| 9-1 | 往淡水 | The car comes above ground at dawn. 咻—— the curtain, climb, then 飛機！. | Blow the curtain 5 times | 3 |
| 9-2 | 淡水老街 | Shop shutters (**flaps**) of 阿給/鐵蛋 shops change visibility. Climb, and 抱抱 a shopkeeper. The 背包客 asks again (#3). | Open every shutter at once | 4 |
| 9-3 | 渡輪 | **Learn 扶著站**: on the ferry he grabs the railing and **stands** (a story beat). **Cruise** edges and `reachHigh` unlock; grab the bead from the high bench. | Make the ferry horn honk with Mocha on the horn | 3 |
| 9-4 | 漁人碼頭 | A sun-dial **wheel** sets the tide (water level), revealing stepping stones. Cruise along the boardwalk rail; the 情人橋 is in the backdrop. | Set the sun to sunset and back 3 times | 4 |
| 9-5 | 淡江大橋 | The single tower's cables are **props** you tap like harp strings; the right three-note order lowers a maintenance **lift**. 咻咻 circles the tower (story beat, §5.2 ch9) and flees toward 101. 飛機！ sends the gulls. | Play the 生日快樂 opening notes | 4 |
| 9-6 | 碼頭的聽診器 (spread) | The 聽診器 hangs on a fishing-boat mast. 咻—— fills the sail (the boat is a **loop** stop), then cruise the deck rail and reachHigh to grab it. | Blow the sail until the boat does a full circle | 5 |

#### Chapter 10 「離天空最近的地方」 (台北101, 05:10) · treasure 金鎖片 · word 一起 · growth 第一步

| Page | Title | Key mechanic → aha | 淘氣 | Diff |
|---|---|---|---|---|
| 10-1 | 信義線 | An all-words medley, gentle and celebratory. He says 「ㄅㄚ！」 at the 101 view. | Use every word once | 3 |
| 10-2 | 37秒電梯 | Callback to 1-5: Mocha operates a **lift**, and an altitude **wheel** prop counts up. 抱抱 the 清潔阿伯. | Ride the elevator with Mocha alone 3 times | 3 |
| 10-3 | 八節 | 101's sections as three stacked **wheels**, coupled: turning one turns its neighbour. Mocha locks one section (lockedByCat) so the ledges align for a climb path. The hardest pure puzzle. | Align every section so the 101 "smiles" | 5 |
| 10-4 | 阻尼球 | The tuned-mass-damper pendulum (**slider** `left` / `centre` / `right`, also **blowable**): ride the damper sphere across the atrium. Mocha's weight lets it reach the far side. | Swing it 5 times with him on it | 4 |
| 10-5 | 咻咻的派對 | **Learn 一起.** 咻咻's sad party made of blown-away things. 咻咻 cries rain: puddles make every perch `wet`, so Mocha can't move. Nothing works; say 不要！ to everything, and **both babies cry**. He says 「一起」, and linked mode starts: tap floor nodes, Mocha walks **through the puddles for him** (C7 suspended), and Baokaka follows. | Lead them around 咻咻 in a full circle | 4 |
| 10-6 | 離天空最近的地方 (spread) | **First steps.** The observation-deck railing ends one node short of 咻咻. Cruise to the rail's end and say 一起: Mocha waits on the other side, `walk` unlocks, and he takes three wobbly steps. Say 抱抱 to 咻咻 (a `lonely` creature), and it calms: the 金鎖片 drops. **Photo of the first steps.** | 「抱抱咻咻兩次」 (a gift: it fires on any second 抱抱, so nearly everyone earns it) | 3 |

#### Page E 「抓周」 (家, 10:00): the interactive ending

| | |
|---|---|
| Goal | **Mocha** (a `mocha` attractor marked `goal`) |
| Setup | The 抓周盤 is on the floor mat, with all nine treasures + 金鎖片 (shiny, visible, reachable). `priorityOverride: { mocha: 0 }`. Perches all around the room (no box perches). Family figures stand around. |
| What happens | The family cheers for their pick (§5.5). Place Mocha anywhere: Baokaka crawls **past every treasure** to Mocha and grabs his tail. Then the photo moment, his first word, and the ending lines. |
| Why it works | For 64 pages the player learned that shiny beats cat. Here, for the only time, the rule breaks. That *is* the story. |
| 淘氣 | 「讓摩卡坐在抓周盤上」: Mocha on the `tray` perch (he still gets his tail grabbed) |
| 土地公 | The street-shrine statue outside the window winks when tapped |
| Solvability | Trivially solvable (`allowTrivial: true`): even with no input, Mocha starts visible on `sofaArm`. |

#### Bonus page 「象山的日出」

Unlocked by collecting all 65 土地公 stickers. It's a gentle sunrise page on the 象山 trail, with 咻咻 as a playful breeze to ride (blowable leaves). 土地公 gives the 「台北走透透」 stamp: 「呵呵，囡仔，慢慢仔大。」

---

## 5. Script (zh-Hant)

### 5.1 Conventions

- **Line length:** every line is **≤ 30 characters**, including 「」 and punctuation. Lint enforces this (§3.6 rule 10).
- **Keys:** `content/script.ts` maps `LineKey → { who, text }`. Keys follow the headings below, for example `c1.intro.2`, `c1.learn.3`, `album.c1.grandma.A`.
- **Speakers** (subtitle bubble label and colour):

| id | Label | Bubble anchored to |
|---|---|---|
| `nar` | (none; narration, italic, on a paper strip at the top) | — |
| `baby` | 寶咖咖 | Baokaka |
| `mocha` | 摩卡 | Mocha |
| `grandma`, `mom`, `dad` | 阿嬤 / 媽媽 / 爸爸 | — |
| `pa` | 廣播姊姊 | A speaker icon |
| `uncle` | 阿伯 | The 土地公 |
| `clerk` | 店員小哥 | — |
| `pack` | 背包客 | — |
| `shushu` | 咻咻 (shown as 小小的雲 before 9-5) | — |
| `npc` | Named per page (跑步阿姨, 鵝, 溫泉阿嬤 …) | — |

- **Baokaka's vocabulary** (do not add words): 要！／不要！／抱抱／ㄋㄟㄋㄟ／喵喵／哇！／這個！／好吃！／好看！／掰掰／一起／ㄅㄚ！／嗶！／飛機！／咻——, then 摩卡 and 咻咻 only in the ending.
- **Hokkien seasoning** for 阿嬤 and 阿伯 is light, never a full sentence a Mandarin-only child can't follow (from `docs/story/story-bible.md`).

### 5.2 Chapter intros and story beats

The chapter card shows: 第N章｜title｜HH:MM｜下一站 (≤ 8 chars). The lines below play over the card or the first page. They are all skippable with a tap.

**For engineers (#102, D-65).** These lines are `content/script.ts` (keys `p.intro.N`, `c0p3.join.N`, `c0p4.train.N`, `c1.intro.N`, `c1p1.pack.N`, `c1p5.clerk.N`, `c1p6.end.N`). Speech is stored without its outer 「」. The prologue's card plays P lines 1–5 and 0-1 opens on lines 6–12; chapter 1's card plays all four of its lines (`content/chapters.ts` `cardLines`). The prologue's 下一站 is 家. #106 and #107 wire the page beats (0-3, 0-4, 1-1, 1-5, 1-6) into their pages' `lines`. #114 adds chapter 2's (`c2.intro.N`, `c2p2.clerk.N`, `c2p6.end.N`, and § 5.3's `rec.pa.priority` on 2-1's 淘氣); its card plays all three intro lines. #116 adds chapter 3's (`c3.intro.N`, `c3p1.pack.N`, `c3p2.clerk.N`, `c3p6.prof.N`, `c3p6.end.1`); its card plays all three intro lines. #118 adds chapter 4's (`c4.intro.N`, `c4p4.clerk.N`, `c4p4.claw.N`, `c4p6.king.N`, `c4p6.end.1`); its card plays all three intro lines.

**P · 序章「度晬前一晚」 00:00** (card, then 0-1)

```
nar：明天，是寶咖咖一歲的生日。
nar：台灣話，叫做「度晬」。
grandma：「九樣寶物，長長久久。」
grandma：「摩卡，今暗顧好喔。」
nar：……然後，摩卡就睡著了。
nar：半夜十二點，窗戶喀啦喀啦響。
shushu：「嘻……生日？什麼是生日？」
nar：小小的雲轉了一圈——呼！
nar：寶物全部飛出了窗外。
shushu：「對、對不起——！」
nar：阿嬤送的立體書，也被吹開了。
baby：「……哇。」
```

**0-3 Mocha joins** (on page open)

```
mocha：「……喵？盤子……空的？」
mocha：「完了完了完了。」
mocha：「阿嬤五點半就起床了。」
mocha：「我自己去找。你乖乖睡覺。」
baby：「不要！」
mocha：「你連走路都還不會。」
baby：「要！」
mocha：「他說：『我也要去。這是我的生日。』」
mocha：「……我在跟誰翻譯？」
mocha：「……好啦。跟緊我。」
```

**0-4 The train wakes** (on the cry → `train: on`)

```
pa：「月亮線列車，即將進站。」
pa：「本列車，只載還沒睡的人。」
mocha：「……還有沒睡的貓。」
```

**Ch1 「便當的味道」 00:20 · 下一站 台北車站**

```
pa：「下一站，台北車站。Next station…」
mocha：「台北最大的車站。也最好迷路。」
nar：大廳的地板，黑白黑白，像棋盤。
mocha：「聞到了嗎？……是便當。」
```

- **1-1 背包客:** `pack：「Excuse me… where is 101?」`, `mocha：「往前走，看到最高的就是。」`
- **1-5 店員小哥:** `clerk：「叮咚～歡迎光臨！」`, `mocha：「……你怎麼在這裡？」`, `clerk：「我們是連鎖的。」`
- **1-6 end:** `nar：找到了！抓周寶物——雞腿。`, `grandma(album)：「雞腿，一世人呷好料。」`, `baby：「好吃！」`, `mocha：「那是阿嬤的，不能吃。」`

**Ch2 「會揮手的公園」 00:50 · 下一站 大安森林公園**

```
pa：「大安森林公園站，到了。」
nar：半夜的公園，還有人在跑步。
mocha：「松鼠晚上不是該睡覺嗎？」
```

- **2-2 店員小哥** (Mocha climbs into his drinks stall's crate; #114): `clerk：「叮咚～歡迎光臨！」`, `mocha：「……又是你？」`, `clerk：「我們是連鎖的。」`
- **2-6 end:** `nar：找到了！抓周寶物——畫筆。`, `mocha：「他說：『我要畫摩卡。』……好吧。」`

**Ch3 「醉月湖的鵝」 01:20 · 下一站 公館**

```
pa：「公館站，到了。」
nar：椰林大道上，椰子樹排排站。
mocha：「這裡的鵝，比警衛還兇。」
```

- **3-1 背包客** (掰掰 moves him out of the aisle; #116): `pack：「Excuse me… where is 101?」`, `mocha：「一直走，抬頭就看到了。」`
- **3-2 店員小哥** (Mocha sits on his delivery bike; #116): `clerk：「叮咚～歡迎光臨！」`, `mocha：「……連腳踏車也是你的？」`, `clerk：「我們是連鎖的。」`
- **3-6 藍教授:** `npc(藍教授)：「根據我的研究——」`, `npc(藍教授)：「我學富五車……腳踏車。」`, `mocha：「成語不是這樣用的。」`
- **3-6 end:** `nar：找到了！抓周寶物——書。`

**Ch4 「霓虹燈睡著了」 01:50 · 下一站 西門**

```
pa：「西門站，到了。」
nar：紅樓旁的招牌，一個一個暗了。
mocha：「連霓虹燈都想睡覺。」
```

- **4-4 店員小哥** (Mocha sits on his claw machine's coin slot; #118): `clerk：「叮咚～歡迎光臨！」`, `mocha：「……夾娃娃機也是你們的？」`, `clerk：「我們是連鎖的。」`; when the claw grabs him, `mocha：「這台機器，只夾得起寶咖咖。」`; when it drops on Mocha (the 淘氣), `mocha：「……」`
- **4-6 走音天王:** `npc(走音天王)：「這首歌，獻給一歲的你！」`, `mocha：「……耳朵。我的耳朵。」`
- **4-6 end:** `nar：找到了！抓周寶物——麥克風。`

**Ch5 「夜市抱抱」 02:20 · 下一站 劍潭**

```
pa：「劍潭站，到了。」
nar：士林夜市，半夜還是好香。
mocha：「不准吃。我們是來工作的。」
```

**5-6 end:** `nar：找到了！抓周寶物——蔥。`, `mocha：「蔥抓餅……加蛋。……我什麼都沒說。」`

**Ch6 「飛機睡著的時候」 02:50 · 下一站 松山機場**

```
pa：「松山機場站，到了。」
nar：晚上十一點以後，飛機都在睡覺。
npc(塔台)：「這裡是塔台，請保持安靜。Over。」
```

**6-5 塔台:** `npc(塔台)：「剛剛有朵雲問：可以起飛嗎？」`, `npc(塔台)：「我說不行。Over。」`

**6-6 end:** `nar：找到了！抓周寶物——印章。`

**Ch7 「纜車上的月亮」 03:30 · 下一站 動物園**

```
pa：「動物園站，到了。請轉乘纜車。」
nar：纜車一格一格，往山上爬。
mocha：「貓喜歡高的地方。不是這種高。」
```

- **7-6 黑糖:** `npc(黑糖)：「歹、歹勢，我睡在芹菜上了。」`, `mocha：「……熊也會說歹勢。」`
- **7-6 end:** `nar：找到了！抓周寶物——芹菜。`

**Ch8 「熱呼呼的煙」 04:00 · 下一站 新北投**

```
pa：「新北投站，到了。」
nar：地熱谷，冒著白白的煙。
mocha：「有水。熱水。兩個我都不要。」
```

**8-6 end:** `nar：找到了！抓周寶物——算盤。`

**Ch9 「河的盡頭是海」 04:40 · 下一站 淡水**

```
pa：「終點站，淡水。」
nar：天空，開始有一點點亮了。
mocha：「快點。阿嬤五點半起床。」
```

**9-5 meeting 咻咻** (on reaching the tower base)

```
nar：橋塔旁邊，一朵小雲在繞圈圈。
shushu：「咻咻想飛出去……飛不出去。」
mocha：「台北是盆地。四邊都是山。」
shushu：「大家都說：颱風，快走！」
shushu：「咻咻……也一歲了。」
baby：「一起！」
shushu：「……不要！」
nar：小雲哭著，往101飛走了。
mocha：「……追。」
```

(Baokaka shouts 「一起！」 here as a bark before he has learned it as an ability. 咻咻 refuses; that sets up 10-5.)

**9-6 end:** `nar：找到了！抓周寶物——聽診器。`

**Ch10 「離天空最近的地方」 05:10 · 下一站 台北101**

```
pa：「下一站，台北101。」
nar：101，是台北最高的地方。
baby：「ㄅㄚ！」
mocha：「對，101。咻咻在最上面。」
```

**10-6 first steps** (as the rail ends; the simulation is paused for the beat)

```
shushu：「沒有人說歡迎咻咻……」
nar：寶咖咖放開了欄杆。
nar：一步。
nar：兩步。
nar：三步。
mocha：「走、走路了……他在走路！」
baby：「抱抱。」
shushu：「……抱抱？」
nar：小雲，慢慢變白、變軟了。
nar：金鎖片，回到了寶咖咖手上。
baby：「一起。」
mocha：「他說：『一起過生日。』」
nar：太陽，從山的後面出來了。
pa：「本列車直達：寶咖咖的家。」
```

(Mocha's translation is, for the only time, short and exact. This is the bible's payoff.)

### 5.3 Recurring lines

| Who | When | Lines (one is picked in order, cycling) |
|---|---|---|
| 廣播姊姊 | Every ride page, after the arrival line | 「請緊握扶手。」「請讓座給需要的人。」「車門即將關閉。」 |
| 廣播姊姊 | When Mocha sits on a 博愛座 (淘氣 2-1) | 「請讓座。……貓也算嗎？」 |
| 背包客 | 1-1, 3-1, 9-2 | 「Excuse me… where is 101?」 |
| 摩卡 (translating 背包客) | 1-1 / 3-1 / 9-2 | 「往前走，看到最高的就是。」／「一直走，抬頭就看到了。」／「你從淡水走過去？……加油。」 |
| 背包客 | Ending credits | 「I found it!」 |
| 店員小哥 | One cameo per chapter | 「叮咚～歡迎光臨！」 then 「我們是連鎖的。」 (ch7: 「行動分店。」; ch10: 「我們在101也有分店。」) |
| 土地公 (on tap) | Every page | 「呵呵，囡仔，慢慢仔來。」 |
| 摩卡 (squinting at 土地公) | 4-x, 7-x, 10-x first tap | 「……我是不是在哪裡看過你？」 |
| 摩卡 bark | Arrival / unreachable / water / cuddled | 「喵。」／「喵？」／「不要。」／「呼嚕嚕……」 |
| Hint lines (≤ 12 chars) | §2.7 | 「拉拉看這裡」「讓摩卡上去」「試試看說話」「藏起來看看？」「等等看。」「轉轉看」「翻開看看」 |
| 淘氣 pop | Sticker earned | 「嘿嘿，淘氣！」 |
| 土地公 sticker | Sticker earned | 「找到土地公！」 |
| Page fold | Completion | 「下一頁！」 |

### 5.4 Word learning: lines and Mocha's translations

Each learn beat: the source line, then Baokaka's word, then Mocha's translation joke, then a one-line word card (big word, icon, a short effect text).

| Word | Source | Baokaka | Mocha translates | Word card (≤ 14 chars) |
|---|---|---|---|---|
| 嗶！ | Card reader: 「嗶！」 | 「嗶！」 | 「他說：『芝麻開門。』」 / then: 「……閘門真的開了。」 | 嗶！：閘門開開 |
| 掰掰 | 跑步阿姨：「掰掰～小寶貝！」 | 「掰掰！」 | 「他說：『請讓一讓，謝謝。』」 | 掰掰：請讓一讓 |
| 不要！ | 鵝：「嘎！不要過來！」 | 「不要！」 | 「他學會了人生最重要的詞。」 | 不要！：換一個想要的 |
| 哇！ | The neon flickers on | 「哇！」 | 「他說：『開燈。』……電費誰付？」 | 哇！：燈亮起來 |
| 抱抱 | 夜市阿姨：「來，阿姨抱！」 | 「抱抱！」 | 「他說：『載我一程。』」 | 抱抱：大人載你走 |
| 飛機！ | The sleeping plane blinks | 「飛……飛機！」 | 「不會說爸爸，先會說飛機。」 | 飛機！：鳥都飛起來 |
| 爬樓梯 | The tea farmer climbs | (grunt) 「嘿！」 is not a word, so the bubble shows a star only | 「……你什麼時候學會的？」 | 爬樓梯：爬上一階 |
| 咻—— | 溫泉阿嬤：「蛋很燙，呼呼再吃。」 | 「咻——！」 | 「他說：『我是颱風。』……別鬧。」 | 咻——：吹動輕的東西 |
| 扶著站 | Grabs the ferry rail | (stands; a star bubble) | 「站、站起來了！……我沒有哭。」 | 扶著站：搆到高的地方 |
| 一起 | 10-5, both crying | 「……一起。」 | 「他說：『我們一起去。』」 | 一起：摩卡帶你走 |
| 第一步 | 10-6 | (walks) | (the 10-6 lines) | 第一步！ |

### 5.5 Ending (page E and credits)

**05:30, home**

```
nar：清晨五點半。阿嬤起床了。
grandma：「哎唷，摩卡真乖，顧規暝。」
nar：摩卡睜開一隻眼睛。
mocha：「……喵。」
```

**10:00, page E 「抓周」**

```
nar：早上十點，抓周開始了！
dad：「書！拿書！」
grandma：「算盤啦，會賺錢！」
mom：「拿什麼都好，慢慢來。」
```

(The player places Mocha. Baokaka crawls past every treasure.)

```
dad：「……經過了書。」
grandma：「……經過了算盤。」
mom：「……經過了雞腿？」
nar：寶咖咖抓住了——摩卡的尾巴。
baby：「……摩卡。」
nar：全家人，都叫了起來！
dad：「第一個字……不是爸爸。」
mocha：「眼睛……進沙子了。」
nar：窗外，一陣小小的風吹過。
baby：「咻咻！」
dad：「第二個字，也不是爸爸！」
nar：生日快樂，寶咖咖。
nar：生日快樂，咻咻。
```

**Post-credits** (after the credits roll over the album photos)

```
nar：巷口的小廟裡，土地公的手指上，
nar：沾著一點點，蓋章的印泥。
uncle：「呵呵，囡仔，慢慢仔大。」
nar：每年夏天的午後，台北會下一場西北雨。
nar：那是咻咻，回來玩了。
pa：「下一站：兩歲。」
```

### 5.6 Album comments

**Selection:**
- **Frame A** (the 「哇！」 peak) uses the chapter lines below.
- **Frames B and C** use the shared pool, picked deterministically by `(chapter × 7 + frame) mod poolSize` per speaker.
- **摩卡** always uses `mocha.in` if Mocha is in the frame, otherwise `mocha.out`. Chapter-specific Mocha lines replace these for Frame A.
- 爸爸's running gag: every chapter he finds a way to hope for 「爸爸」.

| Ch | 阿嬤 | 媽媽 | 爸爸 | 摩卡 |
|---|---|---|---|---|
| 1 雞腿 | 「嘴巴開開，雞腿比臉還大！」 | 「第一次搭捷運，就這麼開心。」 | 「這個手勢……是在說『爸』吧？」 | 「我在左下角。很帥。」 |
| 2 畫筆 | 「會畫圖喔，以後當畫家！」 | 「大安森林公園，我們常去散步。」 | 「這個嘴型，很接近『爸爸』了。」 | 「松鼠搶鏡頭。不予置評。」 |
| 3 書 | 「拿書，會讀冊！好！」 | 「書拿反了，好可愛。」 | 「爸爸也念過台大……旁聽過。」 | 「那隻鵝，我記住牠了。」 |
| 4 麥克風 | 「跟阿嬤一樣，愛唱歌！」 | 「霓虹燈照得臉紅紅的。」 | 「下一首，點〈爸爸〉好嗎？」 | 「太吵了。照片還可以。」 |
| 5 蔥 | 「蔥，聰明！乖孫最聰明。」 | 「怎麼有蔥抓餅的味道？」 | 「阿姨抱，笑那麼開心……」 | 「我沒偷吃。照片可以作證。」 |
| 6 印章 | 「拿印章，以後做頭家！」 | 「他看飛機，眼睛好亮。」 | 「那是A321！爸爸教的！」 | 「塔台說要安靜。他沒有。」 |
| 7 芹菜 | 「芹菜，勤勞。這張要洗大張！」 | 「他會爬樓梯了？什麼時候？」 | 「下次，要爬向爸爸喔。」 | 「背景那隻熊，不用問。」 |
| 8 算盤 | 「算盤！會算錢，好！」 | 「臉被溫泉蒸得紅通通。」 | 「一、二、三……算到爸爸了嗎？」 | 「我的腳沒碰到水。重點。」 |
| 9 聽診器 | 「當醫生，照顧別人，好囡仔。」 | 「他站起來了！站起來了！」 | 「站起來，是要走向爸爸吧？」 | 「我扶著他。照片沒拍到。」 |
| 10 金鎖片 | 「金鎖片戴上，平平安安。」 | 「第一步……我哭了。」 | 「走向……一朵雲？」 | 「他說『一起』。我翻譯的。」 |
| E 抓周 | 「抓周抓到貓，是什麼意思？」 | 「意思是，他很愛摩卡。」 | 「……第三個字一定是爸爸。」 | 「……喵。」 |

**Shared pool (Frames B and C):**

| Speaker | Lines |
|---|---|
| 阿嬤 | 「怎麼拍，乖孫都古錐。」／「眼睛瞇瞇，也很可愛。」／「這張要放在客廳。」 |
| 媽媽 | 「有點糊，可是好有感覺。」／「他在打哈欠，好想睡喔。」／「這個表情，跟爸爸一模一樣。」 |
| 爸爸 | 「構圖不錯，爸爸給九十分。」／「再一張！再一張！」／「這張，我要設成手機桌布。」 |
| 摩卡 (`mocha.in`) | 「我入鏡了。這張可以。」／「我的尾巴，很上相。」 |
| 摩卡 (`mocha.out`) | 「又沒有我。……喔。」／「大家手機裡，都是你的照片。」 |

### 5.7 UI strings

| Key | Text |
|---|---|
| Cover | 開始／繼續／目錄／相簿／設定 |
| Bottom bar | 提示／重來／選單 |
| Word ring close | 好了 |
| Stickers | 解開／淘氣／土地公 |
| Photo | 咔嚓／再拍一次／放進相簿 |
| Settings | 速度：慢／普通／快 · 字的大小：標準／大字 · 長輩模式 · 自動提示：關／30秒／15秒 · 音效 · 音樂 · 震動 · 減少動態 · 左手模式 · 重新開始（按住三秒） |
| Contents | 第N章 · 已收集 n／18 |
| Locked chapter | 「月亮線還沒開到這裡。」 |
| Bonus | 「象山的日出」 |

---

## 6. Risks and mitigations

| # | Risk | Likelihood / impact | Mitigation |
|---|---|---|---|
| 1 | **Indirect control confuses or frustrates** first-time players, especially kids, who want to drag the baby. | High / high | The first 4 pages have ≤ 2 interactive things each. The thought bubble is always visible, and the change-of-mind animation is the core teaching device. Touch-to-pause makes him *look at your finger*, so dragging him is never needed. Tapping Baokaka opens the word ring (or, before any words, shows a 「要！」 bubble pointing at his target). Hint level 0 starts at 30 s. |
| 2 | **Puzzle authoring cost** (65 hand-made pages) | High / high | PageLab from M0. Presets mean no per-page code. The solver gives instant feedback on soft-locks and par. Every page has a written §4.3-style spec before it's built. Budget ~1 day per page after the tools are done. |
| 3 | **Solver state explosion** on complex pages | Medium / medium | Lint budgets (≤ 8 interactive parts, ≤ 40 nodes). Canonical state hashing, and pruning of no-op inputs. A 2M-state cap per page fails CI with a clear message, so designers simplify. |
| 4 | **AI feels random** ("why did he go there?") | Medium / high | Strict, explainable rules (§2.2.2) with no randomness. PageLab shows the target line. Playtest question: "Can you predict where he'll go?" Tie-breaks must never be visible in shipped pages (lint warns when two candidates tie on priority, reachability and path length). |
| 5 | **Crying is distressing** for some parents or kids | Low / high | A soft, comical wail with no screaming. The visual is small tears and a gentle ring. Crying ends instantly when anything appears. Copy calls it 「討救兵」 in hints. Playtest with parents. |
| 6 | **Art pipeline delay** (two separate artists) | Medium / medium | Placeholder paper art per preset from day 1; gameplay never waits for art. Art keys are decoupled through the registry. Sprites are baked by the existing v2 pipeline. |
| 7 | **Performance** on older phones (SVG plus animation) | Medium / medium | Baked backdrops. Transform-only animation on parts. No runtime filters on moving elements. ≤ 150 animated nodes. A profiling page in PageLab. |
| 8 | **Too easy for adults** | Medium / low | 淘氣 and 土地公 add optional depth. Difficulty-5 pages in chapters 8–10. Hints are never forced. |
| 9 | **Scope creep** back toward the RPG (inventory, currency, battles) | Medium / high | This GDD's §1.3 rules and pillars are the scope gate. Anything needing a menu deeper than one level, or a number the player must manage, is out. |
| 10 | **Words feel like menus** rather than toddler magic | Medium / medium | One tap to open the ring, one tap to say. The ring shows only learned words (max 8). Each word has a distinct sound motif and a big bubble. Mocha's translation jokes make each one memorable. |
| 11 | **Real-place sensitivities** (temple, airport, brands) | Low / medium | Landmarks are drawn with affection, never mocked. No brand logos (the bento, card and shops are unbranded). 龍山寺 is not used for physical comedy. Real people are never depicted (no 馬偕 statue). |
| 12 | **Old code and new code tangle** | Medium / medium | The new game lives entirely in `src/popup/` and reuses only `src/shared/`. The old `src/quest/` is deleted when M1 ships and the owner signs off (§7). |

---

## 7. Milestones and issue breakdown

Estimates assume one engineer with AI assistance, plus art arriving in parallel. "w" = weeks.

### M0: Core and tools (≈ 2 w)

Exit criterion: the two sample pages (0-1 and 1-2) are playable with placeholder art, and the solver runs in CI.

1. `core/types.ts` + `cond.ts` + `presets.ts` (FSM compile of all presets) — tests.
2. `core/graph.ts`: BFS, reach sets, distance tie-breaks — tests.
3. `core/baby.ts`: decision loop (§2.2), modes, looking/crying — table-driven tests per rule.
4. `core/mocha.ts`: perch pathing, arrival actions (push, onPart, set, flee), pet — tests.
5. `core/step.ts` + `events.ts`: tick order (§3.3), cascade bound, ride detection — determinism tests (event-log snapshots).
6. `core/solver.ts`: BFS, par, dead-end analysis, mischief and 土地公 reachability, nextAction — tests on toy pages.
7. `core/lint.ts`: all §3.6 rules — tests.
8. `pages/` registry, `definePage`, and pages 0-1 and 1-2 as data, plus `pages.test.ts` (lint + solution replay + solver).
9. `view/PageView` + placeholder part views + Baby/Mocha placeholder actors + interpolation.
10. Gestures: tap, drag, magnet, snap, pause-on-touch (§2.6) — hit-test unit tests.
11. `dev/PageLab.tsx` at `#/pagelab` (overlays, step, solver panel).
12. `scripts/solve-pages.ts` (`npm run solve`).

### M1: Vertical slice, prologue + 台北車站 (≈ 4 w; 10 pages + a spread photo)

Exit criterion: a playtest with **at least 1 grandparent, 1 child aged 4–8, and 2 parents**, plus the §8 metrics recorded.

13. Pages 0-1…0-4 and 1-1…1-6 as data (from §4.3), all green in the solver.
14. Words: word ring UI, 嗶！ (learn beat, first-use tutorial).
15. Thought bubble with change-of-mind animation. Barks.
16. Hint system: levels 0–3, the hint worker, ghost hand.
17. Page fold transition, sticker card, 淘氣 detection, 土地公 tap.
18. Chapter card (departure-board style) and narration strips. `content/script.ts` with all prologue and ch1 lines (§5).
19. Spread + photo moment + album page (ch1 comments).
20. Save/progress (`popup.save.v1`), resume within 2 taps, cover screen, 目錄 (ch0–1).
21. Audio: extend `src/shared/audio.ts` with the §2.12 cues; a music-box loop for ch0–1.
22. Settings (all of §2.11).
23. Art integration: first character sprites from the v2 pipeline; the environment artist's style applied to 2 pages (the rest stay placeholder).
24. Route: `#/` serves the new game. The old `src/quest/` is kept in the repo, unrouted, until owner sign-off. Then delete it (separate issue).
25. Playtest kit: a checklist, observation sheet and metric capture (§8).

### M2: Chapters 2–4 (≈ 4 w)

26. Presets: `light` with `nodeBy`, the creature `heldBy`/drop, and decoys.
27. Words 掰掰, 不要！, 哇！.
28. Pages 2-1…4-6 (18 pages): full specs written first (§4.3 format), then data, then art.
29. Album UI complete (multi-chapter, retake).

### M3: Chapters 5–7 (≈ 4 w)

30. Presets: `carrier`, `loop` (crank), counterweight lift.
31. Word 抱抱, word 飛機！ (`winged`), growth 爬樓梯 (`climb` edges + sprites).
32. Pages 5-1…7-6 (18 pages).

### M4: Chapters 8–10 + ending (≈ 5 w)

33. Preset `blowable` with facing cone, word 咻——; growth 扶著站 (`cruise`, `reachHigh`); coupled wheels (10-3).
34. Linked mode (一起), first steps (`walk`), the `lonely` creature 咻咻.
35. Pages 8-1…10-6, page E, post-credits, bonus page.
36. Credits.

### M5: Polish and release (≈ 2 w)

37. Performance pass, reduced-motion pass, and an accessibility audit (`scripts/ui-check.mjs`).
38. Full-game solver run, a difficulty-curve review and par tuning.
39. Family beta, then fixes.

**Total ≈ 21 weeks.** The slice (M0 + M1) takes ≈ 6 weeks and is the go/no-go point for the rest.

---

## 8. Success metrics

**M1 playtest gates** (the M1 exit criteria; observed, not instrumented):

| Metric | Target |
|---|---|
| A **grandparent completes page 0-1 unaided** (no explanation, no help) | ≤ 90 s |
| The same grandparent completes the prologue | ≤ 12 min, using the hint ladder at most twice |
| A child (4–8) explains Baokaka's rule after the prologue ("他會去他想要的東西那邊") | Yes, in their own words |
| Players **predict where he'll go** before acting (asked on 1-2 and 1-4) | ≥ 70 % correct |
| Hint level 3 used on ch1 pages | ≤ 1 page per player |
| Laughter or a verbal reaction at the first Mocha push (0-3) and the first deliberate cry (0-4) | Observed in ≥ 3 of 4 testers |
| A player voluntarily replays a page for 淘氣 or 土地公 | ≥ 1 of 4 testers |
| Median time per page (ch1) | 1–3 min |
| Soft-locks or "stuck with no idea" moments longer than 2 min without using hints | 0 |

**Technical gates** (CI and devices):

| Metric | Target |
|---|---|
| Every page: lint OK, solution replay OK, solver solvable, **0 dead-end states**, mischief and 土地公 reachable | 100 % |
| Full solver suite runtime | < 60 s |
| Frame rate on a 2021 mid-range Android | ≥ 55 fps sustained |
| First interactive page on 4G | ≤ 3 s |
| Resume to the current page | ≤ 2 taps |

**Release-level signals** (the owner's family, informally):
- The family plays together on the sofa.
- 阿嬤 asks to play again the next day.
- Someone shows the album to a relative.

**For engineers.** #110 built the playtest kit in `docs/playtest/`: the run guide, the observation sheet (every gate above, the prediction and rule questions, the build's watch-points), a one-page guide in 繁體中文 for the family testers, an owner's summary, the automated first-time run, and `m1-results.md` for the outcome. The gates stay observed, as above; `#/?debug=metrics` adds an on-device log (time per page, hints per level, 重來; copy as text, never sent anywhere; D-73) so the observer can check numbers afterwards.

---

## 9. Glossary

| Term | Meaning |
|---|---|
| **Page** | One puzzle diorama (§2.1) |
| **Spread** | The chapter's final, two-page-style puzzle with the treasure and photo |
| **金珠珠** | Golden bead: the normal page goal |
| **Attractor** | Something Baokaka wants (shiny, Mocha, snack, light) |
| **Decoy** | A shiny he can never get; he fixates on it |
| **Reaching** | Baokaka sitting at the nearest point to an unreachable target, arms out: 「要！要！」 |
| **Perch** | A spot Mocha can occupy |
| **Pet** | Tapping Mocha to repeat his perch action |
| **Tick** | One simulation step (0.33–0.75 s by setting). Paused while touching. |
| **Par** | The minimum number of non-wait player inputs to solve a page (solver-computed) |
| **Dead end** | A reachable state from which the goal is unreachable. Forbidden. |
| **淘氣 / 土地公 / 解開** | The three page stickers (§2.8) |
| **Linked mode** | After 一起: Mocha walks the floor where you tap, and Baokaka follows |
| **PageLab** | The dev page viewer, editor and solver UI at `#/pagelab` |
