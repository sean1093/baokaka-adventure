# 翻翻台北 Pop-Up Taipei: environment art bible

**Status:** v1 (2026-10-19). This is the environment, UI-frame and motion bible for concept A, aligned with `docs/design/gdd.md`.
- **Chapters:** prologue (4 pages) plus 10 chapters of 6 pages each.
- **Page space:** 390×560.
- **Layering:** follows GDD §3.9.
- **Bottom bar and stickers:** follow GDD §2.1 and §2.8.

**Supersedes:** the background, location and UI sections of `docs/art/art-direction.md` (§2.7, §4, §7) for this game.
**Still applies:**
- the night colour clock (§3.2), re-keyed below to the GDD chapter times;
- the contrast rules (§3.3);
- the font stack (§7.1).

**Characters:** the character look belongs to `docs/art/v2/`. This document only defines how characters sit *inside* the paper world.

| Proof (390×844 @2x) | What it proves |
|---|---|
| `proof-a-station.png` | In-play page **1-2 「月台的縫」** at 00:20. It shows the paper materials, the night lighting, a single touchable (the tab, jammed at `half` by the pigeon), the perch marker, die-cut standees, the bubble on a spring, the HUD and the bottom bar. |
| `proof-b-taipei101.png` | Page **10-3 「八節」** at 05:10 (dawn). Three coupled wheel sections with marigold knurled rings sit between printed sections. One section is mid-turn, with a halo, a 3D arrow and onion-skin facets. Mocha locks the section above (paw badge). Baokaka stands holding a rail (扶著站). The chalk intention line runs up the solved ramps. |
| `proof-c-page-turn.png` | A chapter turn mid-animation (Ch3 台大 → Ch4 西門町). The camera has pulled back to a 3/4 view of the book on 阿嬤's 花布 quilt. The leaf bends as it falls, the old pieces fold flat, the new pop-ups rise behind it, and the chapter card drops in on strings. This is real CSS 3D. |
| `proof-d-swatches.png` | The material and affordance swatch sheet: 8 paper stocks, stacked depth z0–z4, mountain/valley creases, three night-light recipes, the 4 touchable presets plus the perch and linked brad, five tab states, printed vs touchable, raw sprite vs standee, and the chapter colour-clock strip. |

**Sources:** `src/`.
- `kit.js` holds every helper as SVG-string functions, and is the reference for the TS port.
- There is one HTML file per proof.
- `render.mjs` renders the proofs.
- `sprites/` is a frozen snapshot of `docs/art/v2/baked/` taken during this work. Swap in the final frames when the pose manifest lands.

**Re-render:** run `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node docs/art/popup/src/render.mjs` from the repo root. Fonts load from Google Fonts.

---

## 1. Vision

> **阿嬤's old pop-up book, read by lamplight at midnight.**
> Every page is a little stage made of real paper you want to touch. Paper you can play with is golden and stamped with a red verb. Everything else is quiet, printed and lovely.

**Five feelings, in priority order:**
1. **Tactile.** You can almost feel the tooth of the card, the soft fibres of washi, the crisp cut edge and the slight lift of a layer off the page.
2. **Readable from the sofa.** A 70-year-old knows in one glance what to press, and a 5-year-old knows where the baby is going.
3. **Cozy midnight Taipei.** Indigo paper, warm lamps behind tracing paper, foil moons and neon ink. The palette walks toward dawn as the night goes on (00:00 → 05:30).
4. **Recognisable landmarks, lovingly simplified:**
   - the station's 重簷 roof;
   - the checkered hall floor;
   - 101's eight flared sections;
   - 紅樓's octagon;
   - the 傅鐘;
   - the single tower of 淡江大橋.
   No brands, no photo-copying.
5. **A book that is alive.** Pages fold, pieces pop, tabs wiggle and bubbles bob on springs. The book never feels like a flat screen.

**References (in words, nothing traced):**
- **Tearaway:** papercraft that treats the player as part of the world, crisp folded geometry and confetti-paper particles.
- **Paper Mario: The Origami King:** flat characters living in a fold-and-pop world, and the idea that paper is the physics.
- **Monument Valley:** a calm palette, one interactive handle per idea, and rotating architecture as the puzzle (our 101 and 紅樓).
- **Lumino City:** real handmade-diorama lighting, warm bulbs inside paper buildings, and depth you can feel.
- **Pop-Up Pilgrims:** layered parallel pop-up planes, tiny characters walking on paper ledges, and dioramas you read at a glance.
- **Fe:** a few strong hues per area with luminous accents that tell you "this is alive".
- **Robert Sabuda and Matthew Reinhart pop-up books:** V-folds, box folds, floating layers, pull-tabs with a slot and arrow, and volvelles with a brass split pin.
- **Taiwanese material culture:**
  - 花磚 majolica tiles (endpapers);
  - 客家花布 peony quilt (the world outside the book);
  - red 印章 seal stamps (verbs);
  - 紅包 gold foil (treasures and the moon);
  - the 台鐵便當 paper sleeve and split-flap departure boards (UI furniture).

---

## 2. The book and the camera

### 2.1 A top-bound book, opened to 90°

Each spread stands like a little theatre.
- The **upper page stands vertical**: the backdrop, sky and skyline.
- The **lower page lies flat**: the floor.
- They meet at the **gutter**.

This orientation fits a portrait phone naturally. It is also how real "theatre" pop-ups work, and it makes every page side-view, which suits GDD §2.1.

```
  ┌ cover (navy linen, gold-foil corners) ──────────────┐
  │ HUD label (paper, washi tape)                       │ 0–96
  │ ┌ backdrop page (vertical) ───────────────────────┐ │
  │ │ sky · pinholes · foil moon · cloud cut-outs     │ │
  │ │ far skyline (z1) → landmark pop-up (z2–z3)      │ │
  │ ├──────────── gutter (AO + lit crease) ───────────┤ │
  │ │ floor page (flat, gentle perspective, widens)   │ │
  │ │ platforms / ledges (z4) · parts · characters    │ │
  │ └─ page-block edges (5 lines = a thick old book) ─┘ │ ≈694–708
  │ bottom bar on the cover                             │ ≈720–844
  └─────────────────────────────────────────────────────┘
```

**Mapping to GDD page space:**
- The page area is **390×560 units**.
- The book frame draws a 6–18 px cover margin left and right, so the page renders at **≈0.91 scale** (354 px wide).
- On tall phones the extra height goes to the cover (more linen and gold corner), never to the page.
- Hit areas are computed in page units, then scaled, so the GDD's ≥48 px rule is checked **after** scaling.

**Floor perspective:**
- It is a fake, gentle perspective: the page widens about 6% toward the reader over about 250 px.
- The vanishing point is high above centre (`VP = (195, −360)` in the proof).
- Box tops recede toward VP by 2% (`tv = .02`). This makes ledges read as surfaces without breaking the side-view gameplay.
- **Never** foreshorten the walk graph. Nodes stay in page units; only the art cheats.

### 2.2 Depth model: tunnel-book layers

Every page is built from parallel paper planes at fixed depths (`z`).
- Higher z means closer to the reader: a bigger stacked shadow, a stronger cut-edge rim, and more parallax.
- The z level drives the **depth filter**, `kit.js depthFilter(z)`, which bakes three things:
  - a **tight contact shadow** (blur 0.5 + 0.15z, offset 0.5 + 0.25z / 0.8 + 0.45z, opacity .55);
  - a **soft drop shadow** (blur 1.5 + 1.6z, offset 1 + 1.1z / 2 + 2.2z, opacity .22 + .03z);
  - a 1 px **cut-edge rim** (light on the top-left, `#FFF8E8` at 42%) and a 1 px **cut-edge shade** (bottom-right, shadow tint at 35%).
- Shadows are **indigo `#140C34`, never black**.

| z | Layer (GDD §3.9 order) | Examples | Parallax (tilt) |
|---|---|---|---|
| 0 | Backdrop page print | sky gradient, pinhole stars, painted haze | 0 |
| 1 | Backdrop cut-outs (baked with 1) | cloud bands, far skyline, foil moon, vellum clouds | 0.15 |
| 2 | Standing cut-outs, far | the landmark (station facade, mountains), hanging boards | 0.3 |
| 3 | Floor + parts, mid | roofs, pillars, the train, 101's sections, lamp posts | 0.5 |
| 4 | Gameplay ledges + parts, near | platform boxes, rings, benches, treasures | 0.7 |
| 5 | Foreground frame | trees and benches in the near corners, number plates | 1.0 |
| — | Characters (standees) | their own stacked shadow (see §5) | as their ledge |
| — | Bubbles and FX | bubbles on springs, sparkles, chalk lines | as their owner |

**Composition rules:**
- Draw the light from the **upper left**, matching the v2 key light.
- Keep a **quiet band around the play path**: no high-contrast print behind Baokaka's route.
- Put one **foreground card** in a near corner to frame the stage, but never over a touchable or the walk graph.
- The **gutter** always has its ambient-occlusion band (18 px, dark at 55% in the middle) and a 0.6 px lit crease. This one detail sells "book".
- Each landmark pop-up gets a **V-fold crease** down its centre: lit left half, the right half 20–26% darker, and a 0.8 px light ridge. This is the most "pop-up" read you can give a flat facade (proof A).

### 2.3 Tilt parallax

The book tilts very slightly, never enough to affect readability. Two optional sources:
- the **device gyro**, behind a setting, off in 長輩模式;
- the **drag** of the finger while it is pausing the world (GDD §2.6), so the page "leans" toward the touch.

**How it works:**
- Max ±3° rotateX/rotateY on the page container, with `translate` per layer = `tilt × parallax(z) × 6 px`.
- Layers are separate composited bitmaps, so the cost is near zero.
- The gutter AO and contact shadows **do not move**: they are baked into the layer they belong to.

### 2.4 Page open, fold and turn

**Page complete → next page** (GDD: fold 0.9 s):

| t (ms) | What happens |
|---|---|
| 0–150 | All parts settle. Standees do a tiny hop. |
| 150–600 | Pop-ups **fold flat** in reverse z order (near first). Each one is a `rotateX` toward the floor around its base, with the shadow shrinking as it lands. |
| 600–900 | The backdrop leaf falls toward the reader (`rotateX` 0 → −90° about the gutter) and **bends**: three hinged strips, the lower one leading. The new spread is revealed behind it. |
| 900–1500 | The new pop-ups **rise** with an overshoot, z1 → z5 staggered by 60 ms. Each one does `rotateX(70°→−6°→0)`, its shadow grows, and it lands with a soft paper "fwump". The characters' standees rise last. |

**Chapter turn** (proof C):
- The camera **dollies back** to a 3/4 view, about 0.8 scale, `rotateX(-31°) rotateY(-17°)`, so the whole book on 阿嬤's quilt is visible. The same leaf animation then runs, slower (1.4 s).
- The **chapter card** (GDD §2.13, the departure-board card) drops in on two strings, swings twice and settles.
- The camera dollies back in.
- Total ≈ 2.4 s. Tap skips it.

**Reduced motion** (`prefers-reduced-motion` or the in-game setting):
- All of the above becomes a **0.25 s cross-fade plus a single 4 px rise** of the new layers.
- No camera move, no bending leaf, no confetti, no idle wiggle (it is replaced by a static double outline; see §4.3).

---

## 3. Paper material system

### 3.1 Stocks

Every surface in the game is one of these. The proof is `proof-d-swatches.png`, row 1.

| Stock | Used for | Recipe (build time) |
|---|---|---|
| **卡紙 card stock** | Everything structural: sky, buildings, ledges, floors | Flat colour or a 2-stop vertical gradient, plus **grain** (fractal noise `baseFrequency .9`, 3 octaves, soft-light at 30–55%) and **mottle** (noise `.018`, 2 octaves, soft-light at 18%). Matte, no specular. |
| **牛皮紙 kraft** | The back sides of flaps and leaves, cardboard props, the album's back cover | Warm tan gradient `#C49A6C → #A97E52`, plus dense dark **fibres** (`fibers()`: 4–18 px curved hairlines, 0.55 px, 45%), plus grain multiplied at 50% |
| **和紙 washi** | The HUD label tape, soft surfaces, 阿嬤's things | Off-white or tinted, plus long pale fibres (`fibers` at 55%). **Torn** edges (displacement `scale 5`), never cut. Semi-translucent tapes at 78%. |
| **描圖紙 tracing paper / vellum** | Lit windows (backed), clouds over the moon, hint hands, mist, steam, water surfaces | A white/lilac fill at 45–72% opacity, so whatever is behind shows through. A white 1.5 px edge. It **never** has a hard drop shadow (only a soft one, z ≤ 2). |
| **燙金 gold foil** | The moon ring, treasures, 金珠珠, brass split pins, coins, HUD trim | A multi-stop diagonal gradient (`#8A5E1E/#FFE9A8/#C9963A/#FFF6D2/#B8822A`) plus one hot specular dot. Foil is the **only** thing allowed to sparkle. |
| **銀箔 silver foil** | Microphone heads, 101's spire, metal | The same structure in cool blue-white |
| **玻璃紙 glassine** | Glossy wet things: the river, 醉月湖, the airport glass, the 101 curtain wall at dawn, rain | Translucent white with two diagonal sheen streaks. It shows the pattern under it. |
| **瓦楞紙 corrugated** | Cardboard props, boxes, the night-market stalls | 6 px vertical flutes in three tones |
| **花磚 endpaper** | The page-turn underside, the album lining, the menu background | Navy tile pattern with a gold diamond and rose dots (Taiwanese majolica) |
| **花布 quilt** | The world outside the book (cover screen, chapter turns) | Big peonies in red and pink on a plum base with green leaves and gold dots. **Night-graded** (indigo 55% overlay plus a warm night-light radial). |

### 3.2 Edges, cuts, folds

- **Cut edge:** every die-cut piece gets the 1 px top-left rim (paper core catching light) and the 1 px bottom-right shade. This is the single most important "it's paper" cue, so it is never omitted, even on tiny pieces.
- **Deckled or torn edge** (washi, labels): a displacement map at scale 3–5. Use it only on non-structural pieces such as labels and tape.
- **Mountain fold:** a lit side, a darker side (×0.8) and a 1.4 px light ridge line beside a 0.8 px dark one.
- **Valley fold:** both faces slightly darker toward the crease, plus a blurred AO strip (16 px, 18%) and a dark crease line.
- **Score lines:** a 0.6 px darker line where a pop-up hinges on the floor (the base of every standing piece).
- **Pinholes:** stars are holes in the backdrop with light behind them. They are small, warm-white and glowing, with a 5 px cross glint on about 12% of them.

### 3.3 Lighting at night

The paper doesn't emit light, except where light is *behind* it.

| Light | How it shows on paper |
|---|---|
| **Moonlight** (key, upper left) | The cool rim on cut edges, long soft shadows down-right, and a slight lilac lift on top faces. The moon itself is a backlit vellum disc with embossed crater circles and a foil ring. It has two halos (blur 8 at 16%, blur 18 at 12%). |
| **Warm lamps and windows** | **Cut holes backed with glowing vellum** (`#FFF1C4 → #FFD27A → #FFB45A`) with a small bloom. They pour a **light pool painted onto the floor page** (a radial gradient, 55% at the centre) and a warm gradient up the facade from below (proof A). Paper lamp posts have vellum lanterns. |
| **Neon** (西門町, 士林, 月亮線 cars, signage) | **Luminous ink:** strokes plus text with a 1.6 px glow, and a 12% coloured spill rectangle behind the sign. A sleeping sign (Ch4 「霓虹燈睡著了」) is grey ink plus "zz". |
| **Dawn** (Ch9–10) | A warm radial from the lower right. Right-facing facets take peach (`#E6A89A`), left facets stay indigo, the sky walks to `#F4B49A`, and the stars thin out. |
| **Shadow tint** | Always indigo `#140C34`. In dawn chapters lift it toward `#3A2860`. |

**Colour clock** (from art-direction §3.2, re-keyed to GDD chapter times; sky top → horizon):

| Ch | Place | Time | Sky top → horizon | Feeling |
|---|---|---|---|---|
| 序 | 家 Home | 00:00 | `#0A1034 → #3A3A86` | warm lamp interior, cool window |
| 1 | 台北車站 | 00:20 | `#0B1238 → #40408E` | deep navy, amber windows |
| 2 | 大安森林公園 | 00:50 | `#0B1238 → #4A4A96` | green-black canopies, fireflies |
| 3 | 台灣大學 | 01:20 | `#0C1440 → #5A4E9C` | cool lake, warm library |
| 4 | 西門町 | 01:50 | `#0C1440 → #6A5AA4` | magenta and cyan neon spill |
| 5 | 士林夜市 | 02:20 | `#0E1644 → #7A62AA` | the hottest, warmest page: bulbs and steam |
| 6 | 松山機場 | 02:50 | `#101848 → #8A6AB0` | runway blues, amber taxi lights |
| 7 | 貓空 | 03:30 | `#141C50 → #9A70B4` | mountain mist (vellum layers), gondola lights |
| 8 | 北投 | 04:00 | `#16205A → #A878B8` | steam vellum, wooden warmth |
| 9 | 淡水 / 淡江大橋 | 04:40 | `#1E2A66 → #C88AB8` | the first violet light, sea glassine |
| 10 | 台北101 | 05:10 | `#3A3A80 → #F4B49A` | dawn peach, gold rim |
| E | 家 (抓周) | 10:00 | daylight `#8EC8E8 → #FFF0C8` | the only daytime page |

**Grading:**
- Bake the environment grade into each layer's colours at build time (`gradeTokens(time)`, as art-direction §3.2 specifies). It is never a runtime filter.
- **Touchables and characters are not graded**, or only half-graded for characters (§4, §5). This is the point: they glow against the night.

---

## 4. Interactive affordance language (the grandparent rule)

**One rule:** *if it's marigold and stamped with a red verb, you can move it. If it isn't, you can't.*

Each touchable carries **four redundant cues**, so colour-blind players, low-vision players and grandparents all get it.

| Cue | Spec |
|---|---|
| **1. Reserved colour** | **Marigold card** `#FFE38C → #FFC23A → #E39A17`, with an edge of `#A9650C`. It is never night-graded, so it is the brightest saturated warm colour on any page. **Reserved:** decorative yellows (taxis, signage, the yellow tactile strip, foil) must be desaturated ochre or foil. The swatch sheet's "printed taxi" shows the rule. |
| **2. Red verb seal** | A **印章** with the action character: 拉 pull, 轉 turn, 翻 lift, 推 slide. It is `#D8342A` with a slightly torn edge, an inner hairline and a white serif glyph. It is ≥ 22 px, sits on or next to the grip, and is readable as a word for those who read and as a red stamp for those who don't. |
| **3. Grip texture** | Where the finger goes, by preset:<br>• **Tab:** ridged end (vertical ribs).<br>• **Wheel:** scalloped or knurled rim.<br>• **Flap:** lifted dog-ear corner showing the kraft back, plus a finger notch.<br>• **Slider:** a ridged knob in a dark slot. |
| **4. Motion and direction** | A printed **direction cue**:<br>• **Tab:** arrow plus dotted track to the end stop.<br>• **Wheel:** curved arrow; for drums, a 3D ring arrow (back half dashed).<br>• **Flap:** curl arrow.<br>• **Slider:** dotted track.<br>And an **idle wiggle** (below). |

**Mocha perches** (GDD: "a faint paw print while Mocha is available"):
- a chalk-white paw print with a soft marigold halo;
- no seal, because the action belongs to Mocha, not the player's finger.

**Linked parts** (the train a tab moves, the shelf a wheel cranks):
- a gold brad with a **dashed marigold ring**, matching a brad on the touchable;
- during hint L1/L2, a dotted thread connects them.

**Props** (tap-only toys such as the split-flap board, TVs and mobiles):
- No seal or marigold, so they stay discoveries and don't add noise.
- They react to a tap with a wiggle.
- They show up in the **hold-to-reveal** outline (GDD §2.6).

### 4.1 States (proof D row 5)

| State | Look |
|---|---|
| **Idle** | Three short marigold tick marks at the grip end. A **wiggle every 4 s**: ±2° for tabs, ±4° for wheels, a 3 px corner lift for flaps. The wiggle is staggered per part so the page never pulses in unison. |
| **Hint L1** ("where") | A soft marigold halo (blur 3, 55%) pulsing for 3 s, plus Mocha looking at it |
| **Hint L2** ("how") | A **vellum ghost hand** (translucent lilac-white, white edge) performs the gesture |
| **Dragging** | The part lifts to the next z: shadow grows, 1.04 scale, a 5 px rise. Paper swish sound. |
| **Locked** (lockedByCat, lockedWhen) | Darkened 35% with a paw badge. It wobbles on touch, Mocha glares, and a "boop" plays. |
| **Done** (optional, per page) | A small green check knot on solved wheels (101) |
| **Hold-to-reveal** | Every interactive part and prop gets a 2 px dashed outline in `#FFF7E0` |
| **Reduced motion** | No wiggle. Instead, a permanent 1 px light double outline. |

### 4.2 Readability checks (every page, in PageLab)

- **Squint test** at 25% scale: the marigold parts and the two standees must be the only things you see.
- **Grey test** (greyscale screenshot): the touchables are still findable by their seal and grip.
- **Count:** at most 3 touchables plus perches visible at once on pages 1–3 of a chapter (GDD: early pages have one).
- **Hit areas** are ≥ 48×48 CSS px after the 0.91 book scale. Draw them in the hit layer, never infer them from art.

**For engineers (#140, D-54).** The rule is code and a lint:
- The kit marks every cue in its markup: `data-seal` on a seal, `data-grip` (ridges, rim, ear, knob), `data-cue` (track, arrow, turn, curl), and `data-affordance` on marigold that isn't a touchable (perch paws, linked brads, hint halos and threads).
- **The affordance lint** (`src/popup/view/affordance/lint.ts`) reads a drawn page: any fill, stroke or gradient stop within **ΔE (CIE76) < 12** of the card's saturated body (`marigold`, `marigoldDeep`) outside a touchable or a marked affordance is an error; so is a touchable without its marigold, seal, grip or cue; a hit area under 48 px at the 390×844 book scale; and (a warning) more than 3 touchables plus perches at the start of pages 1–3. It runs on every page and every preset in the tests, and live in PageLab.
- **States** (`src/popup/view/affordance/`, the part views' `look`): the idle wiggle scheduler (4 s ± 0.8 s per part, staggered, `useIdleWiggle`), the L1 halo (a radial-gradient glow pulsing in opacity; at L0 it fades in and out once) and the L2 vellum hand (`Hints.tsx`; #100's ladder, `ladder.ts`, decides what to hint and has Mocha yawn, look or tap his paw), the drag's lift over a dropped shadow, the 35 % veil and paw badge, the done knot, and the reduced-motion double outline. No runtime filters anywhere.
- Seals on a page are ≥ 25 units (≥ 22 CSS px after the book scale), 31 in 長輩模式.
- PageLab fixture `affordance-states` shows every state side by side.

---

## 5. Characters in a paper world: die-cut standees

The anime-rendered characters (v2) are **printed illustrations mounted on card**, like a premium pop-up book's character pieces. The white die-cut border says "this is a printed piece glued into the book". That is why a painterly anime figure belongs in a world of flat card. Paper Mario's flatness, but with the shading of a lithograph.

**Standee spec** (`kit.js standee()` / `#standee` filter; bake it at build time into the sprite frames, see §8):
- **Border:** 3.2 px (at 1×) **warm white card** `#FBF6EC`, dilated from the sprite alpha and slightly softened. It is never pure white; at night pure white glares.
- **Cut line:** a 0.6 px mauve-grey `#8F8296` outline outside the border, for definition on light floors.
- **Shadows:**
  - a stacked shadow: contact (1/1.6 px offset, 60%) plus soft (3/5 px offset, blur 3.5, 45%);
  - a separate **floor contact ellipse** (blur 3, 50%) at the feet, so the figure sits on the ledge.
- **Easel tab:** a small kraft-grey fold-back trapezoid behind the feet (visible on standing poses). It is the "it stands up" cue.
- **Grade:** characters get **half** the environment grade.
- **Lamp glow:** a soft warm glow behind Baokaka (blur 18, 18%) when he is near a lamp or in focus.
- **Rim:** the v2 composite-time rim (moon or local light) is applied on the bitmap, never in the SVG.
- **Size** (GDD §3.9): Baokaka is **~70 px tall crawling** at 390 width (70 px in proof A, 72 px standing in proof B). Mocha is 56–66 px sitting.
- **Growth stage per chapter** (GDD §2.5), so art never shows a pose he can't do yet:
  - Ch0–Ch8: **crawl / sit**.
  - Ch7 onward: **climb** (one step).
  - From 9-3: **stand holding a rail** (always draw the rail).
  - Only 10-6: **walk**.
  - The proofs use the v2 pose frame `baokaka-crawl-0` (from `docs/art/v2/baked/poses/`) through `crawlBaby()`. The pose set (crawl ×8, reach, sit, cry, wave, refuse, walk ×7, wobble…) should be baked with the standee border, so the game never runs the filter.
- **Motion of standees:** they move as rigid cards. Each tick is a short hop-lerp (2 px up), with a 3–5° lean in the travel direction and a tiny wobble on landing. Turning around is a **card flip** (`scaleX` 1 → 0 → −1 over 120 ms): the classic paper-character turn, and cheaper than drawing back views.
- **Touch-watch** (GDD: he watches your finger): swap the head frame to the curious face, and tilt the whole standee 3° toward the finger.

**Engineers' note (#95, D-57).** The standee motion is `src/popup/view/actors/standee.ts`: the step finishes 120 ms before the tick ends so the ±2° landing wobble has its time, the card leans 4° into the travel direction at mid-step, look L/R is drawn frames since #141 (no card flip), and under reduced motion a step is a short fade-slide. The lamp glow is a radial gradient (no filter on a mover) within 110 units of a lit light.

**Thought bubble:**
- A die-cut cloud (`#FBF6EC`, z3) on a **coiled wire spring** from his head.
- The spring wobbles when the target changes; the bubble pops and re-inflates, matching GDD §2.2.6.
- The icon is drawn in the same paper style: a foil bead, a Mocha head, a bottle.
- 「要！」 is in red serif at 20 px.

**Engineers' note (#98, D-61).** The bubbles are live SVG with flat fills (`src/popup/view/talk/`): a warm-white die-cut card, a mauve cut line and an offset shadow, with no filters. 「要！」 is `sealInk` at 22 units. Bubbles grow against the book scale so their text is ≥ 20 screen px. Subtitles are labelled speech cards on wire springs, narration is an italic serif washi strip, and 廣播姊姊 speaks from a paper loudspeaker.

**Creatures** (pigeons, geese, the magpie 藍教授):
- They are **origami**: folded faceted paper in 2–3 tones with a crease line.
- They sit between the standees and the scenery, belonging to the paper world while still feeling alive.

---

## 6. Landmarks: palette and motif sheet

Each chapter has **2 dominant hues + 1 accent**, a **signature material**, and a **paper trick** that makes it memorable. Times and pages follow GDD §4.2.

| Ch | Place, time | Palette (dominant / accent) | Signature material | Motifs and paper tricks |
|---|---|---|---|---|
| 序 | 家 Home, 00:00 | warm wood `#8A5A3A` + indigo window / lamp amber | kraft, washi, 花布 | Crib rail tab, curtain flaps, a 土地公 shrine across the street as a tiny lit window. The book itself lies on the 花布 quilt. |
| 1 | 台北車站, 00:20 | navy `#1A2464` + sandstone `#C9A983` / amber windows | card stock, foil sign | 重簷 two-tier roof with a gold ridge; lit vellum windows; the **checkered hall floor** printed on the floor page (and the 1-4 turntable); the split-flap board on cords; brick platforms with a yellow tactile strip; a blue 板南線 train; origami pigeons; the bento-shop cross-section (1-5) as a cut-away box fold |
| 2 | 大安森林公園, 00:50 | deep green `#1E4A44` + indigo / firefly lime `#D8F27A` | layered leaf cut-outs (4–5 depths) | The amphitheatre shell as a white V-fold; pond glassine with lily pads; the squirrel as origami; fireflies as pinholes that drift (the only moving pinholes in the game); 斗笠 土地公 in a hedge |
| 3 | 台灣大學, 01:20 | lake blue `#2C3C7A` + palm green / warm library amber | glassine lake, kraft books | 椰林大道 palms as tall thin flats in rows (strong parallax); the 傅鐘 as a small tower with a brass bell; 醉月湖 with a **decoy moon reflection** (foil under glassine); the goose as origami; library shelves as sliders; the 3-6 giant book's pages as flaps |
| 4 | 西門町, 01:50 | plum `#2A2266` + 紅樓 brick `#B04A44` / neon pink `#FF6FAE` and cyan `#7FF3FF` | neon ink, brick card | The 紅樓 octagon as a wheel with three doorways; vertical sign boards that are asleep (grey plus zz) until 哇！; a claw machine of glassine and chrome; street-paint crossing stripes; a karaoke stage with foil shutters |
| 5 | 士林夜市, 02:20 | hot vermilion `#C8402E` + bulb amber / steam white | corrugated stalls, vellum steam | Strings of bulb pinholes; stall awnings as striped flaps; steam vellum rising in loops; a balloon-dart board of foil dots; 蔥抓餅 as layered paper rounds; the busiest page, so keep the play path on a calm dark band |
| 6 | 松山機場, 02:50 | runway blue `#1E2E66` + white / taxi-light amber and wing-tip red | glassine terminal glass, silver foil | A paper jet as a sharp origami fold; the baggage carousel as a loop of kraft cards; a jet bridge slider; the 塔台 as a lit drum; a passport stamp (印章) treasure that literally reuses the seal style |
| 7 | 貓空, 03:30 | tea green `#2E5A4A` + mist lilac / gondola amber | vellum mist layers (3) | Terraces as stepped box folds (he learns to climb); gondolas on a cranked **loop**; the moon is bigger here; mist flaps hide and reveal the path |
| 8 | 北投, 04:00 | cedar brown `#6A4A3A` + teal water / steam white | wood-grain card, vellum steam | The hot-spring museum's wooden balcony; steam clouds as blowable vellum puffs (咻——); the green-roofed library as a V-fold; Mocha refuses the water (a glassine puddle that wobbles) |
| 9 | 淡水・漁人碼頭・淡江大橋, 04:40 | violet `#4A3A7A` + sea teal / first-light peach | glassine sea, foil sun | **淡江大橋:** a single tower with harp-string cables, tapped like strings (9-5). The ferry railing (he stands). The 情人橋 arch in the backdrop. A sun-dial wheel setting the tide. The sunset-gold trick: as tide or sun states change, the backdrop paper warms. |
| 10 | 台北101, 05:10 | dawn violet `#4A4592` + teal glass `#4E8E96` / peach `#E6A89A` and gold | teal card facets, gold rings | Eight flared sections, each with **three visible facets** (left indigo, front teal, right peach), floor mullions, a cyan rim and ruyi ornaments. Rotating sections are **marigold knurled rings**; fixed ones are grey-lilac bands. Vellum clouds wrap the tower. The damper sphere is gold foil (10-4). The roof party at sunrise is 10-6. |
| E | 家 抓周, 10:00 | daylight cream + red 紅包 / gold | 花布, foil | The 抓周 tray as a foil-trimmed red board; the family as standees at the edge; the only page with daylight and no grade |
| — | 月亮線 cars (page 1 of every chapter) | the car colour of each line (板南 blue, 信義 red, 松山新店 green, 文湖 brown) + interior cream / neon route strip | silver foil poles, glassine windows | A **side cut-away car** (a box fold with the front wall removed). Hand straps are perches. The 博愛座 is printed teal. The window shows the chapter's skyline sliding by as a looping backdrop strip (the only scrolling backdrop). An overhead neon route map lights each station. |
| ★ | 龍山寺 (suggested bonus, or a 月亮線 window cameo; it is not in the GDD chapter list) | temple red `#9A2A2A` + jade roof / lantern gold | layered roof cut-outs with dragon ridges | 交趾陶 dragons as faceted cut paper, incense smoke as vellum curls, 筊杯 as two red half-moons that flip (a prop). It would make a strong 「倒著讀」 post-game page. |
| ★ | 象山的日出 (GDD bonus page) | gold sunrise + city indigo | foil sun, many skyline layers | The view back at 101 from the trail: 6 parallax skyline layers and the sun rising as a foil disc on a slider |
| ★ | Others to consider: 中正紀念堂 (white-blue gate, plaza tiles), 北門 (a brick gate at night), 迪化街 (Lunar New Year lanterns) | | | Only if content grows. Each fits the same recipe. |

*Engineers' note (#108, D-71):* the slice's art is in `src/popup/env/art/c0.ts` (序) and `c1.ts` (1). Backdrops carry the room or station, its furniture and its lights; the walk-graph stage stays live but is dressed per backdrop (`src/popup/view/art/dress.ts`): 巧拼 play-mat and crib ledges at home; the car body, granite walkways, the shop's cut floor and brick platforms at the station; furniture the art draws itself; and the corner cards (ㄅㄆㄇ blocks, a suitcase). The pigeon is origami, and the backpacker and 店員小哥 are paper-style die-cut figures (`view/art/creatures.ts`). Baked flaps and the 1-4 turntable keep their marigold grip in the source, with their seal and cue live. The squint test made the play-mat dusky, kept the moon small and veiled, and darkened the station's sandstone toward night. Screenshots: `docs/screenshots/108/`.

---

## 7. UI framing: the book is the UI

**Rule:** every UI element is a physical object belonging to the book. Text sits on paper or on the navy cover, never floating on art (art-direction §3.3 contrast rules).

**The cover (screen background):**
- Navy linen `#1B2052` with a weave pattern.
- Gold-foil corner brackets and a vignette.
- This is option D's navy/gold UI, made into a real hardcover.

**HUD (top, 96 px):**
- A cream deckled **paper label** taped on with two washi strips (pink and celadon), rotated −0.6°. It shows:
  - the landmark name in serif 900, 27 px;
  - the page title 「…」 in red serif, 15 px;
  - "第N章 · 第 n 頁 / 6" in 14 px;
  - a **moon clock chip** (navy pill, foil moon or sun, Fredoka 19 px);
  - the **9-slot 抓周 tray** as foil coins (filled) and blind-embossed paper dimples (empty).

**Bottom bar (GDD §2.1), on the cover:**
- **[寶咖咖 portrait → word ring]**: the only marigold ring in the bar, because it is a touchable. It has a dashed marigold halo.
- **[提示] [重來] [選單]**: cream card discs with a foil ring and a 15 px label.
- **Stickers 解開 · 淘氣 · 土地公**: blind-embossed navy dimples with a dashed gold ring when empty, and foil discs with an icon when earned (✓, 嘿, a 土地公 hat).
- All discs are ≥ 56 px.

**Word ring:**
- Learned words appear as **64 px paper discs** fanning out from the portrait like a volvelle.
- Each disc has a word icon and a serif glyph, and is stamped with its own seal colour.
- The simulation pauses (GDD); the page dims 30%.

*Engineers' note (#99, D-62):* the ring is drawn round Baokaka (a tap on him or on the portrait opens the same ring): a kraft volvelle wheel with a printed scale and a dotted gold track, 72 px cream discs with the word's icon on a torn-edge seal in its own colour (palette `word*` tokens) and a 20 px serif glyph, 「好了」 under him. The discs swing round from 「好了」 as it opens. The new word wears the marigold halo until first said. The page dims 30 % except a pool of light on him. The word card is a taped cream index card with the seal, the word in 52 px red serif and its effect.

**Chapter card** (GDD §2.13):
- A paper card hung from two strings that **drops and swings in**, as in proof C.
- A red spine bar, 「第N章 · title」, the landmark in 36 px serif, the time chip and a 翻 seal.
- For the final version, add a **split-flap row** reading 「下一站 ○○」 to honour the departure-board idea. Narration lines are tap-through subtitles below it.

*Engineers' note (#102, D-65):* `src/popup/view/hud/ChapterBoard.tsx` is a cream card on two strings of twine with foil eyelets. It hangs from above the screen's top edge and is tilted −1.2°. The chapter is set vertically in 22 px cream serif on a deep seal-red spine, with a bright red band along the fold. Next come the title in 22 px red serif, the time on a navy chip (Fredoka 20 px), the landmark in 36 px serif (smaller only for a six-character name) and the 翻 seal. The board is a navy panel with a gold frame. 「下一站」 is in cream, with one split-flap tile per character: gold glyphs on two-tone navy halves with a hinge line. The turn drops the card (overshoot, two swings, ≈ 0.8 s) and flips the tiles in 70 ms apart while it swings. The lines hang under it: narration on a washi strip, speech on a die-cut card with the speaker's tab (寶咖咖 and 摩卡 are named here, as they hang from no one). Under reduced motion it fades. Proofs: `docs/screenshots/102/`.

**Subtitles:** small die-cut speech bubbles on springs, ≤ 30 chars, 18–21 px (GDD).

**Sticker card** (after the page fold): a little kraft card where the three stickers **slap on** with a squash, one at a time, 200 ms apart.

*Engineers' note (#101, D-64):* `src/popup/view/hud/StickerCard.tsx`, shown in the turn's interlude over the folded page: kraft stock with a fibre pattern and two washi tapes, the page title on a cream label in red serif, the stickers as 60 px foil discs on pressed dimples (an unearned one shows its icon's silhouette in the kraft), names and 「下一頁！」 on cream tags (kraft fails 7:1 for text). Earning 淘氣 or 土地公 mid-page pops a kraft tag over the bottom bar's tray and slaps the tray's disc on.

**Album** (GDD §2.9): 「寶咖咖一歲的相簿」.
- A linen album opening on 花磚 endpapers.
- Photos are **instant prints** (white border, slight rotation, washi corners).
- The four family notes are coloured sticky notes with handwritten-style text, popping in 0.6 s apart.
- The chapter's word is big in red serif, with a 6×3 sticker grid.
- The shutter moment uses a paper camera frame sliding over the page and a big round 咔嚓 button in marigold (it is a touchable).

*Engineers' note (#103, D-66):* `src/popup/view/photo/`. The camera is black card with a cream band (a foil-ringed lens, a vellum flash, the 翻 seal) and a cut viewfinder with chalk corner marks. Beside the viewfinder hangs the 「哇！」 thermometer: magenta word ink rising to a foil star. Under it is the 108 px marigold 咔嚓 disc ringed in the camera's black and gold. One flash is a 360 ms white fade. The album is a cream leaf on the 花磚 endpaper (the kit's `tiles`) with the linen cover down the binding. The instant print has a warm-white border, a −2.5° tilt and celadon and pink washi corners, with the treasure's name under the picture. The word is in 44 px red serif on its seal, and the sticker grid has a foil disc per sticker. The notes are pink, mint, sky and lilac sticky notes, each with a strip of tape and the speaker's name in red serif. A spread's spine is a valley fold down x = 195. Proofs: `docs/screenshots/103/`.

**目錄:** the 月亮線 route as a **paper map**. Stations are chapters (foil when complete); the line is a ribbon.

**Cover screen:** the closed book 《翻翻台北》 on 阿嬤's low table and 花布, with Baokaka and Mocha standees and a gold-foil title.

**Engineers' note (#97, D-60).** The HUD and bottom bar are live (`src/popup/view/hud/`) with every word ≥ 20 px: the landmark 25 px serif, the page title, chapter line, clock and disc labels 20 px; the tray's 「抓周」 and the stickers' names are accessible names only. The cover scene (table, closed book, debossed foil title), the quilt and the 目錄's folded map are baked (`src/popup/env/art/screens.ts`); the cover's standees are the live sprites. The pause menu is a cream paper sheet. The page fold and chapter turn (§ 2.4) are `src/popup/view/transitions/pageTurn.ts`: the pop-ups fold and rise as a `scaleY` about each layer's base in five depth groups, the leaf is three nested strips textured with the two pages' baked backdrops, the chapter turn moves the whole book with one transform over the quilt and hangs the chapter card (#102: the departure board, below).

---

## 8. Motion and sound feel

Paper moves **quickly and settles softly**. Nothing floats or tweens linearly.

| Motion | Spec |
|---|---|
| Part to new state | 250 ms (GDD), ease-out with a 6% overshoot, then a 2 px settle. Snap stops add a 60 ms squash (0.97). |
| Pop-up rising | rotateX 70° → −6° → 0, 320 ms, staggered 60 ms by z |
| Fold flat | rotateX 0 → 85° plus fade of the shadow, 220 ms, ease-in |
| Standee step | A hop-lerp over the tick (0.5 s default), 2 px arc, 3–5° lean, landing wobble ±2° for 120 ms |
| Standee turn | Card flip `scaleX` over 120 ms |
| Bubble change | Old icon pops (scale 1 → 1.2 → 0, 100 ms), new one inflates (0 → 1.1 → 1, 200 ms), and the spring wobbles (a damped 3-cycle sine) |
| Idle wiggle | Every 4 s ± 0.8 s random, 300 ms |
| Sparkles on foil | One at a time, 600 ms, max 3 per treasure. They never loop in sync. |
| Neon wake (哇！) | A flicker sequence on, off, on-on, steady over 450 ms. Its spill fades in over 300 ms. |
| Confetti | Only on page turn and treasure grab: 12–16 paper flecks in the chapter palette, tumbling, 900 ms, then removed |

**Sound pairing** (GDD §2.12, WebAudio): every visual has a **paper-matched sound**.
- Paper swish for drag, a wooden click for a snap, a ratchet for wheel steps, a two-note flop for flaps.
- A "fwump" (low filtered noise plus a soft thump) when a pop-up lands.
- A bright chime on the fold.

Keep sounds **dry and close**, like paper on a table, with no reverb tails. The music box sits under everything.

*Engineers' note (#105, D-68):* the cues are `SFX` in `src/shared/audio.ts`, each under a second with a plain exponential tail. The fold sounds as the pop-ups fold, the leaf's whoosh and chime as it turns, and the fwump as the new pop-ups land (their overshoot). The chapter card thunks as it drops, rattles its split-flap row and swishes away. The music box is two sine partials per tine, plucked, at half the effects' level.

---

## 9. Performance budget and implementation architecture

**Target** (GDD §3.9): 60 fps on a 2021 mid-range Android, ≤ 150 animated nodes, page art ≤ 350 KB, first load ≤ 2.5 MB.

### 9.1 What is baked vs live

| Layer | Authoring | Runtime |
|---|---|---|
| Backdrop, z0–z2 (sky, skyline, landmark, grain, gutter AO, light pools) | SVG (`kit.js` style) per page | **One WebP @2x** per page, ≈ 120–200 KB. All filters, grain and shadows are baked. |
| Static standing cut-outs and the floor | SVG | Merged into the backdrop bitmap, or a second WebP if a part must pass in front of something animated |
| **Parts** (tabs, wheels, flaps, sliders, trains, rings) | SVG per part, **with its cut-edge rim and stacked shadow baked into the part bitmap** (padding for the shadow) | `<img>` or `<image>` in a transformed group. **Only transforms** (translate / rotate / scaleY). No runtime filters (GDD §3.9). The drag "lift" swaps to a pre-baked **lifted-shadow** variant, or scales a separate pre-blurred shadow image. |
| Characters | v2 pipeline frames | The die-cut border, cut line and contact shadow are **baked into each frame** at build time (the `#standee` filter applied in the bake step). The floor ellipse is a shared tiny WebP. |
| Bubbles, seals, sparkles, chalk lines | SVG | Live SVG (cheap: flat fills, no filters). The sparkles' glow is a baked sprite. |
| Grain | Live in the proofs | **Baked into every bitmap.** Never a full-screen live noise layer at runtime. |

**Engineers' note (#94, D-56).** Character frames are baked by `npm run sync:sprites` with `standeeFilter(id, { bake: true })`: the shadows have no x offset (frames are mirrored for facing left; the floor ellipse, outside the frame, carries the light), the card is cut from a softened silhouette, and the print is trimmed to it. The half grade is baked per chapter since #96 (below).

**Bake step:** add `scripts/bake-popup.mjs`, mirroring `docs/art/v2/tools/bake.py` and `render.mjs`.

**Engineers' note (#96, D-59).** The bake step is `npm run bake:popup` (`scripts/bake-popup.ts`, vite-node, so it reads the TS sources directly). Sources are in `src/popup/env/sources.ts`; outputs in `src/popup/assets/env/` and `src/popup/env/env.gen.ts`. Readings: backdrops cover the page SVG's whole view box (the page, the floor page's widening and the page block; extra height on tall phones stays cover, § 2.1), are graded with `envGrade(chapter)` (relative to 00:00 as D-27, so identity for chapters 0–2) applied to every colour but lights, foil, touchables, chalk, the indigo shadow, the cut-edge rim and the chapter's sky, and carry the grain clipped to the paper. Parts are not graded. Touchables without their own drawing stay live kit SVG so the affordance lint keeps reading their cues; a baked touchable marks its marigold for the lint (`data-baked-marigold`) and its source is linted in `env.test.ts`. Characters' half grade is `1 − (1 − g)/2` of the table's grade, baked into the print only (the card, cut line and shadows keep their night colours): ×(0.775, 0.785, 0.86) for chapters 0–2.
- Playwright renders each page's SVG layers and each part to WebP @2x (@3x optional), with a manifest of sizes and anchor points.
- The kit functions port to `src/popup/art/` as TS returning SVG strings, so PageLab can preview un-baked art live.
- The game loads the baked bitmaps.

### 9.2 3D

- **In play:** each page container gets `perspective: 1200px` only for the tilt parallax (§2.3). Layers are flat composited bitmaps with `translate3d`. **No `preserve-3d` in play.**
- **Page fold and turn:** a temporary DOM built for the transition (proof C is the reference implementation):
  - planes hinged at the gutter (`transform-origin` at the hinge, `rotateX`);
  - the leaf as **3 nested strips** for the bend;
  - `backface-visibility: hidden` front and back faces;
  - textures are the same baked page bitmaps.
  Drive it with the Web Animations API, then tear it down. It is about 20 planes for 1.5 s, well within budget.
- **Chapter turn camera:** one transform on the book container (scale plus rotateX/Y). The quilt is a static WebP behind it.

### 9.3 Modes

- **Reduced motion** (OS or setting): cross-fade turns, no tilt, no idle wiggle (static outline instead), no confetti, sparkles reduced to a static glint.
- **長輩模式:** all of the above stays available, plus bigger seals (28 px), a stronger halo on hint L1 and a slower tick (GDD).
- **Low-power** (auto when frame time > 20 ms for 2 s): drop tilt parallax and confetti, and halve the sparkles.

*Engineers' note (#104, D-67):*
- 長輩模式 (`affordance.elder`) also keeps the hold-to-reveal outlines on all the time and draws Mocha's perch markers bolder: a 1.4× paw with an ink edge on a stronger halo.
- The tilt is the 書本傾斜 setting, off by default. `useTilt` leans the page box by up to ±3°; per-layer parallax is #136's.
- Low power (`useLowPower`) latches for the session when the frames of the last 2 s average over 20 ms and most of them are over it.
- Proofs: `docs/screenshots/104/`.

---

## 10. Prioritised build list

1. **Port `kit.js` to TS** (`src/popup/art/`). The pieces are the palette tokens, `depthFilter`, grain and mottle, `fibers`, `scallopBand`, `skyline`, `pinholes`, the `standee` filter, the four part presets (tab, wheel, flap, slider), perch, brad, seal, bubble on a spring, HUD, bottom bar and cover.
   - Wire the presets as the **default placeholder art for every GDD part preset**. This unblocks M0/M1 with art that already looks like the game.
2. **Bake pipeline** (`scripts/bake-popup.mjs`): page backdrop → WebP, parts with baked rim and shadow → WebP plus a manifest, character frames with a baked standee border. Add a CI size check against the 350 KB per page budget.
3. **Page renderer layering** (GDD §3.9) with the z table from §2.2: gutter AO, V-fold crease helper, floor perspective, foreground card slot, hit layer separate from art.
4. **Affordance system:** the reserved marigold token plus a lint that flags any decorative fill within ΔE < 12 of marigold, plus seals, idle wiggle scheduler, hint L1/L2 visuals (halo, vellum hand), locked and dragging states, and hold-to-reveal. Do this before content: it is the core readability promise.
5. **Standee integration:** half grade, floor ellipse, hop-lerp, card-flip turn, touch-watch tilt, bubble pop/inflate. Bake the v2 pose frames (crawl, reach, sit, walk…) with the standee border.
6. **Vertical slice art: prologue + 台北車站 (Ch1, 10 pages).** Proof A is page 1-2. Next come the 板南線 car (1-1), fare gates (1-3), the checker turntable (1-4), the bento-shop cut-away (1-5) and the bento spread (1-6).
7. **Page fold and chapter turn** (proof C → WAAPI implementation, plus the reduced-motion fallback), the chapter card and the sticker card.
8. **Album and photo moment UI** (instant prints, sticky notes, shutter frame), the cover screen and the 目錄 paper map.
9. Per-chapter **palette kits** (§6) as token sets plus 3–5 reusable cut-outs each, built in chapter order. Then 101 (proof B is page 10-3) and its dawn grade.
10. Polish: tilt parallax, neon wake sequences, confetti, low-power mode, the 龍山寺 bonus page idea.

---

## 11. Proof self-critique and known gaps

- **Characters are snapshots of v2 work in progress** (`src/sprites/`, copied from `docs/art/v2/baked/` and `poses/` on 2026-10-19). Proofs A, C and D use the real `baokaka-crawl-0` frame. Proof B uses `baokaka-stand` behind a rail, because no cruise frame exists yet; swap it for a stand-cruise frame when one exists. Re-copy and re-render when v2 is final.
- **Proof A:** the split-flap board and 土地公 are shown at the same time. In the real 1-2, the 土地公 appears only when the board is flipped (GDD); he is visible here to demo the hidden-character scale. The floor is still fairly busy for grandparents; consider dropping the checker contrast another 15% in production.
- **Proof B:** the eight sections use simple flat facets. Production should add a soft cylindrical gradient per facet and the ruyi ornaments on every section. The coupled-wheel linkage strips are a first idea; playtest whether grandparents read "these move together".
- **Proof C:** this is a still of a motion idea. The final timing and bend need a WAAPI prototype. The old 台大 facade on the leaf is under-detailed because it is only on screen for about 300 ms.
- **Proof D:** labels are 9–11 px because it is a reference sheet. They are not game UI sizes.
