# Baokaka Adventure — Art Direction v1

**Status:** Draft for **Option A** (see `docs/art/options/README.md`); the owner is still choosing between styles · **Date:** 2026-10-18 · **Owner:** Art direction

> **Note (story bible v1 landed after this draft):** The story is now 《寶咖咖抓周大冒險》, one night from 00:00 to 05:30. Baokaka is a **crawling** 1-year-old in butter footie pajamas (star print, bear patch, red string bracelet). He no longer wears the rain jacket, bubble-tea backpack or pellet drum described in §6.1. The current hero art is `reference/baokaka-crawl.svg` (map) and `reference/baokaka.svg` (seated battle pose), plus 阿藍 (`reference/alan-magpie.svg`) and 黑糖 (`reference/heitang-bear.svg`). The per-location colour scripts in §4.2 are daytime. Once a style is chosen, they'll be replaced by a midnight-to-dawn script per chapter, with per-chapter, character and foe sections added from `docs/story/story-bible.md`. The rendering, lighting, UI, performance and architecture rules below still apply as written.
**Scope:** The RPG in `src/quest/` (now the only game) and its art code: `src/art/**`, `src/quest/components/IsoMap.tsx`, `BattleFx.tsx`, `src/index.css`, `tailwind.config.js`.
**Supersedes:** §7–8 of `docs/superpowers/specs/2026-09-07-baokaka-xia-design.md` (the 仙劍 bar) and the art rules of `2026-09-06-design-system.md`. The UI component set from the design system (Screen, AppBar, Button, Sheet) stays. Only its look changes.

Reference implementations live in `docs/art/reference/`, each next to a PNG render (index in §13). Port the recipes. Don't trace the coordinates.

---

## 0. TL;DR

- **Style: "Taipei picture-book diorama."** Soft-lit vector art with a warm plum outline (no black ink), gradient-mapped form shading, cool ambient occlusion, a sky-blue rim light, and soft contact shadows. One static paper-grain layer covers the whole screen. Isometric maps are small floating dioramas of real Taipei streets. The finish target is *Monument Valley meets a Taiwanese children's picture book*.
- **Heroes:** Baokaka is a real 1-year-old: 2 heads tall, a sunflower rain jacket, a bubble-tea backpack, a 波浪鼓 pellet drum. Mocha Cat is a brown mackerel tabby in an MRT-blue bandana. Heroes own the most saturated colours on screen.
- **Light tells the story.** Every location has a colour script (sky, key, shadow tint, accents). A time-of-day grade (day, golden, dusk, night, rain) re-lights the whole scene and applies at half strength to characters, so they always pop.
- **Premium means:** consistent light direction, colour-temperature shading (warm light, cool shadow, never "add brown"), AO where forms touch, restraint in line weight, generous type and slow, confident motion.
- **Readability first:** 21px dialogue, 70px battle buttons, silhouettes tested at 48px, ≥7:1 text contrast, and shape plus colour for every status.

---

## 1. Vision and pillars

### 1.1 Vision
A toddler and his cat wander a loving, slightly magical Taipei. Every screen should feel like a page you want to frame. Grandparents should recognise 台北101, the red-brick sidewalks, the red and green post boxes and the night-market steam at a glance. Kids should laugh at a bubble tea that runs away.

### 1.2 Pillars
1. **Recognisably Taipei, gently idealised.** Real landmarks and street furniture (red-brick pavers, zebra crossings, scooters, MRT line colours, post boxes, temple lanterns), simplified into clean shapes. Never a postcard copy. Always a toy-diorama version.
2. **Light is the premium.** One key light direction per scene (upper-left), a colour-scripted time of day, and AO and rim light on every character. Flat fills only on UI.
3. **Soft, round, safe.** Rounded shapes, no sharp menace. Foes are mischievous objects and animals, not monsters. Nothing bleeds, and KOs are dizzy, not dead.
4. **Readable from the sofa.** Big type, big targets, high-contrast UI panels, strong silhouettes, colour never the only signal.
5. **Quiet confidence.** Fewer, better elements. A screen has one focal point, one primary action and one accent colour doing the work.

### 1.3 Mood references (in words)
- **Monument Valley 1/2:** floating isometric islands with a visible earth "skirt", pastel gradients, one directional light, faces lit and shaded in two clean values.
- **Alto's Odyssey:** sky gradients as storytelling, layered parallax silhouettes, atmospheric haze between layers, time-of-day shifts.
- **Sky: Children of the Light:** warm rim light on characters against cool environments, bokeh motes, emotion through light rather than detail.
- **Octopath Traveler:** dioramic depth, vignette, light pools on the battle floor, dramatic VFX with a restrained palette.
- **Ni no Kuni:** a warm Ghibli-like palette, charming chunky characters, a friendly UI with parchment warmth.
- **Taiwanese picture books (e.g. Jimmy Liao's city scenes):** urban melancholy made soft, warm windows at dusk, everyday streets as wonder.

### 1.4 What "premium" means here, concretely
| Cheap tell | Premium behaviour we require |
|---|---|
| Thick black outlines everywhere | One warm plum line (`line #3A2838`), 1.6–1.9 units on the 100-unit viewBox, thinner and coloured inside |
| Shadows by darkening toward brown | Shadows shift **cool** (toward violet or blue). Lights shift **warm**. Each material has a hand-tuned ramp |
| Objects floating on the ground | Every standing thing has a soft contact shadow, and AO where forms meet |
| Every element the same saturation | Heroes are the most saturated. NPCs sit at about 70%. Environments use lighter or hazier values |
| Random light directions | Key light always upper-left. Rim light back-right. Cast shadows fall screen lower-right |
| Flat swatch floors | Materials with drawn texture, lit edges, a single light sweep, a diorama skirt |
| UI cards that look like a web form | Tactile buttons (lip shadow, top highlight), glass name plates over art, a rounded TC typeface |
| Linear, fast, jittery motion | Eased, staged motion: anticipation → action → settle, with duration tokens |

---

## 2. Critique of the current art (as built)

I screenshotted `#/quest` at 390×844 (title, living-room map and dialogue):

1. **Identity mismatch.** Baokaka is drawn as a young wuxia swordsman with an adult face (narrow eyes, defined nose and brows, robes). He doesn't read as a 1-year-old. Mocha Cat's jade mantle and bell belong to the old 仙俠 story.
2. **Sticker look.** A 4-unit `C.ink` silhouette on every sprite plus cel shading gives "die-cut sticker", not "lit object in a world". At map scale the outlines dominate the fills.
3. **No shared light.** Sprites are cel-shaded from the upper-left, but the map floor is flat and nothing on it has a contact shadow. Characters hover. The lamp and sofa are line drawings with no volume.
4. **Scale chaos.** Map actors are 1.3 × 72 ≈ 94px boxes on 72px tiles, so a toddler is taller than a sofa and NPCs crowd the frame. The furniture scale doesn't match the characters.
5. **Broken walls.** Perimeter walls render as separate per-tile blocks, which shows as a zigzag "comb" along the map edges. That's the most visible technical-art bug.
6. **Muddy palette.** The ink-brown outline, browns, and `sand`/`paper` fills make the living room monochrome beige. There's no colour script, so every location will look the same temperature.
7. **Generic UI.** Floating white cards on cream, a dialogue box with no portrait, an off-screen name, and system rounded fonts (fallback chain). The title screen is a card with three stickers. None of it says "adventure".
8. **Backdrops are diagrams.** Battle stages are two gradient bands, hills, and window rectangles with thick ink strokes. There's depth intent, but no atmosphere (haze, bokeh, rim-lit silhouettes).

What to keep: the layered-backdrop *idea* (sky, far, floor, light pool, vignette), the event-driven FX architecture in `BattleFx.tsx` (spell data owns its FX kind), painter's sort by `c + r`, reduced-motion handling, and the design-system tokens approach.

---

## 3. Style choice: "Taipei picture-book diorama"

**Definition.** Soft-lit vector illustration:
- **Shapes:** chunky, rounded, squash-friendly. Circles and soft rounded rectangles for characters; clean prisms for architecture.
- **Line:** one warm plum line (`#3A2838`) on silhouettes, interior lines in the material's own shade tone, no black.
- **Shading:** gradient-mapped (light → base → shade), with a soft far-side form shadow and crisp AO accents. The shade tones are colour-shifted cool.
- **Light:** a warm key from the upper-left, a cool sky bounce from below, and a back-right rim (sky-blue by day, lamp-warm at night, violet on foes).
- **Texture:** vector marks only (brick courses, grass tufts, tabby stripes) plus **one** global paper-grain layer at 6–8%.
- **World:** isometric "floating diorama" islands with an earth skirt, a parallax sky and skyline behind, and haze between layers.

**Why this style:**
- It's achievable in hand-written SVG (gradients, clipPaths, strokes) without bitmaps or heavy filters. The reference files prove it.
- It scales. The same sprite reads as a 48px battle chip, a 64px map actor and a 124px dialogue portrait, because forms carry the read, not lines.
- Warm light and cool shadow plus rim light is the cheapest way to look expensive.
- The diorama framing makes small maps feel intentional (a toy world) rather than cropped.
- Taipei recognisability comes from **materials and street furniture** (bricks, crossings, post boxes, lanterns, line colours), which tile and prop systems handle well.

**Explicitly not:** pixel art, flat colouring-book fills, thick black outlines, photoreal textures, glossy 3D-render look, neon cyberpunk Taipei, or anything sharp or scary.

---

## 4. Colour system

All colours live in `src/art/palette.ts` as named tokens. Sprites and UI use only tokens. The material ramps (light, base, shade, AO) are the new unit of colour: you pick a **material**, not a hex.

### 4.1 Master palette

**Neutrals and light**
| Token | Hex | Use |
|---|---|---|
| `ink` | `#2E2235` | UI text, the darkest value |
| `line` | `#3A2838` | Every sprite outline (warm plum) |
| `ao` | `#2A1F3D` | Contact shadows, cast shadows (used with opacity) |
| `muted` | `#6E5A6A` | Secondary text (≥4.5:1 on paper) |
| `paper` | `#FBF4E6` | App background |
| `cream` | `#FFF9EE` | Cards |
| `surface` | `#FFFDF8` | Panels, dialogue box |
| `mist` | `#E9E1D3` | Dividers, empty bar tracks |
| `night` | `#1E2440` | Night UI chrome, dark glass base |
| `dusk` | `#3B3166` | Dusk sky top, foe plates |
| `keyWarm` | `#FFE9B8` | Day key-light sweep |
| `rimSky` | `#D8F0FF` | Day rim light |
| `bounceSky` | `#9CC8F0` | Ground bounce on lower forms |
| `rimLamp` | `#FFD9A0` | Night or lantern rim light |
| `rimFoe` | `#D3A8FF` | Foe rim light (family signature) |
| `aura` | `#B57BFF` | Foe and boss aura |

**Hero materials** (light / base / shade / AO)
| Material | Light | Base | Shade | AO / deep |
|---|---|---|---|---|
| `sunflower` (Baokaka jacket) | `#FFE38A` | `#FFC63F` | `#EE9A2C` | `#C4702A` |
| `skin` | `#FFF3E8` | `#FFE0CB` | `#F2B7A2` | `#E7A68E` |
| `cheek` | — | `#FF8A80` (radial, 0.75→0) | — | — |
| `hair` (Baokaka) | `#A97B63` | `#5E3C30` | `#3E2621` | — |
| `mrt` (bloomers, bandana) | `#5A9BE6` | `#3D7CC9` | `#2B5BA3` | — |
| `tomato` (shoes) | `#FF6F5E` | `#E5483E` | `#C8343A` | — |
| `strawPink` | — | `#FF7F95` | — | — |
| `milkTea` | `#F6DDBA` | `#E2B888` | `#B98258` | — |
| `pearl` (boba) | `#7A5A6E` | `#3E2638` | `#22141E` | — |
| `tabby` (Mocha fur) | `#EDB57C` | `#CC8C52` | `#9A603A` | `#7E4A2C` |
| `stripe` | — | `#7A4A2E` | — | — |
| `furCream` | `#FFF8EC` | `#FFF2DE` | `#EBCDB0` | `#D9B898` |
| `catEye` | `#E4E86A` | `#AFC64A` | `#5F7E2A` | — |
| `gold` (tag, crowns) | `#FFE27A` | `#F7CF5A` | `#C9962E` | — |
| `pupil` | — | `#2E1E2C` (never pure black) | — | — |

**Taipei world materials**
| Material | Light | Base / alt | Shade | Notes |
|---|---|---|---|---|
| `grass` (公園) | `#C9E9A4` | `#8CC46E` / `#83BC66` | `#5E9A52` | tufts in shade, flowers `#FFF3C4` `#FFB3C1` |
| `canopy` (榕樹) | `#C4E79A` | `#5FA25A` | `#3A7448` | blob clusters, darker back pass |
| `brick` (紅磚人行道) | `#F6B49A` | `#D9775F` / `#D2705A` | `#A9503F` | course lines `#B85E4A`, grey accent paver `#CFC6BE` |
| `asphalt` | `#9A9DB4` | `#6C6F86` / `#676A80` | `#4D4F63` | lane paint `#F4F1EA`, kerb `#E9E2D6` |
| `water` (池/河) | `#C6F0FF` | `#6FC2DC` / `#68BBD6` | `#3F8FB4` | ripple strokes `#E9FBFF`, rim stone `#F3E6CC` |
| `glass` (101, offices) | `#BFE4E4` | `#8CC3C8` | `#3B6479` | ledge highlight `#FFF3D6` |
| `stoneWarm` (temple, podium) | `#F4EBD9` | `#D8CDB8` | `#A99A86` | |
| `templeRed` | `#F0645A` | `#D23B30` | `#9E2A24` | |
| `templeGold` | `#FFE08A` | `#E9B949` | `#B8923A` | |
| `jadeRoof` | `#6FC2A8` | `#3E8F7A` | `#2A6656` | 龍山寺 roof ridges |
| `lantern` | `#FFD27A` | `#FF9C4A` | `#D9652E` | glow gradient to 0 |
| `neonPink` / `neonTeal` | — | `#FF5FA2` / `#4FD1C5` | — | 西門町 and night market only |
| `teaTerrace` (貓空) | `#C8E0B0` | `#7FB069` | `#4E7E46` | |
| `springJade` (北投) | `#C9F0E6` | `#8CCFC0` | `#4E9A8A` | steam `#FFFFFF` at 0.5 |
| `mailRed` / `mailGreen` | `#F0645A` / `#55B672` | `#E2483E` / `#3E9A5C` | `#B5322F` / `#2B7444` | 郵筒 pair |
| `woodDeck` | `#E2B88A` | `#B88A5E` | `#8A5A3E` | |
| `skirtSoil` | `#C79A6E` | `#9C6E4E` | `#6A4434` | diorama edge, strata `#E7C9A2` `#5A3A2C` |
| `tactile` (MRT platform strip) | — | `#F2C94C` | `#C9A23A` | |

**MRT line colours** (accents for station maps and UI wayfinding): red `#E3002C`, blue `#0070BD`, green `#008659`, orange `#F8B61C`, brown `#C48C31`. Use them only as signage accents. They're not hero colours.

### 4.2 Per-location colour scripts
Each location has a **default** time of day. The rendered board is in `reference/color-script.png`.

| Location | Default time | Sky top → horizon | Key | Shadow tint | Accents | Signature ambient |
|---|---|---|---|---|---|---|
| 大安森林公園 | Morning | `#9ED3F0 → #FFF0D2` | `#FFE9B8` | `#4E6E8C` | grass, `#FFB3C1` blossoms | pigeons, morning mist band, squirrels |
| 台北車站 | Noon | `#7FC0EC → #E6F2F7` | `#FFF6E0` | `#556A9A` | station roof `#C8A35A`, MRT blue | commuters' shadows, departure-board flicker |
| 西門町 | Afternoon | `#8EC6F0 → #FCE3C4` | `#FFE7B8` | `#5A5E96` | 紅樓 brick `#B5503A`, `#FF5FA2` signs | sign blink (slow), balloons |
| 台灣大學 | Golden hour | `#F2A672 → #FFE6B0` | `#FFC27A` | `#6A4C7C` | palm `#5E9A52`, azalea `#F08CB4`, brick | bicycles, falling petals |
| 龍山寺 | Dusk | `#4A3D7A → #F2A07A` | `#FF9C4A` | `#3A2E5C` | templeRed, templeGold, jadeRoof | lantern sway, incense smoke |
| 士林夜市 | Night | `#1E2350 → #4A3A78` | `#FFD27A` | `#1A1A3A` | `#FF5F7A`, `#4FD1C5`, lantern | steam plumes, string-light twinkle |
| 象山 · 101 | Blue hour | `#2E2A5E → #FFC89A` | `#FFD9A0` | `#2E2440` | aura violet, window gold `#FFD98A` | fireflies (bokeh), city windows turning on |
| 淡水 | Sunset | `#FF9E6E → #FFD7A0` | `#FFB06A` | `#5A4A8A` | `#E8743B`, river `#3E5E9A`, bridge white | gull silhouettes, sun glitter on water |
| 貓空 | Mist | `#B9C9CF → #E4ECE6` | `#F4F1E6` | `#5E7A80` | teaTerrace, gondola MRT blue | drifting fog bands, gondola cable motion |
| 北投 | Light rain | `#8A9AAE → #C8D2DA` | `#E6ECEF` | `#4A5A7A` | springJade, woodDeck | rising steam, rain streaks, puddle rings |
| MRT (interior/platform) | Fluorescent | `#EEF3F6` flat | `#FFFFFF` | `#6A7A9A` | line colour band, tactile yellow | door-chime light pulse |

Rule: a chapter may move a location to another time (the story writer decides). Then apply the grade from §4.3 and keep the location's accents.

### 4.3 Time-of-day grades
A grade is a set of values that every renderer reads from one context (`useGrade()`; see §11):

| Grade | Env overlay (multiply) | Light sweep | Character grade | Rim | Lights on |
|---|---|---|---|---|---|
| `day` | none | `keyWarm` at 0.32 | none | `rimSky` | 0 |
| `golden` | `#FFD2A0` at 0.22 | `#FFC27A` at 0.40 | `#FFD2A0` at 0.10 | `#FFE0B0` | 0 |
| `dusk` | `#7A5A9C` at 0.32 | `#FF9C4A` at 0.25 | `#7A5A9C` at 0.14 | `rimLamp` | 0.5 |
| `night` | `#2E3570` at 0.52 | none | `#2E3570` at 0.22 | `rimLamp` | 1.0 |
| `rain` | `#8090A8` at 0.30 + 15% desaturate (pre-baked tokens, no filter) | none | `#8090A8` at 0.12 | `#E6F2FF` | 0.3 |

- **Characters get roughly half the environment grade.** This is the core readability trick: heroes always stay brighter and warmer than their surroundings.
- **"Lights on"** scales every light source (lamps, windows, lanterns, neon). Each is a radial gradient (`lantern` → transparent) on a layer with `mix-blend-mode: screen`, above the multiply overlay.
- Implement grades as two full-screen layers (one multiply, one screen), not per-element recolouring. Exception: the `rain` desaturation uses pre-baked "rain" variants of the four floor tokens, because CSS `filter` over the map is too expensive.

### 4.4 UI palette
| Token | Value | Use |
|---|---|---|
| `primary` | gradient `#FFD45C → #FFB834`, lip `#D98A22`, top highlight `#FFF2BF` | One primary action per screen |
| `onPrimary` | `ink` | Text on primary (11:1) |
| `tonal` | `#FFFFFF`, lip `#E3D3BA` | Secondary buttons |
| `glass` | `rgba(30,24,52,.55–.62)` + `backdrop-filter: blur(6px)` | Chips and plates over art (≤2 per screen) |
| `hp` | `#6AD184 → #3FA35C` | HP bar |
| `hpLow` (<40%) | `#FFB25A → #E5833A` | Plus HP text turns `#C2582A` |
| `hpCritical` (<20%) | `#FF7A6A → #D9443C` | Plus a slow 1.2s pulse on the bar |
| `mp` | `#78AEF0 → #3F78C8` | MP bar |
| `exp` | `#C99BFF → #8E5AE0` | EXP bar |
| `foeHp` | `#FF7A6A → #D9443C`, lag bar `#FFE2A8` | Foe plates |
| `focus` | 3px `sunflower` ring + 1px `ink` outer | Keyboard and selection focus |
| `speaker colours` | Mocha `mrt`, Baokaka `sunflower`, NPCs from their outfit base | Dialogue name pill and portrait backing |

### 4.5 Contrast rules
- Dialogue and body text: `ink` on `surface` or `cream` (≈15:1). Minimum 7:1 for anything a player must read.
- Muted text ≥4.5:1 (`muted` on `paper` passes; never lighter than `muted`).
- Text over art always sits on a solid or glass plate. No text directly on an illustration.
- Status never relies on hue alone. HP low/critical also changes the numeric colour, adds a pulse, and from 20% shows a small ❗ icon (an SVG, not an emoji). Element weaknesses show an icon plus a word.
- Sprites must pass the **48px silhouette test**: filled black at 48px, the character type is identifiable (see `model-sheet.png`).
- Heroes must keep ≥3:1 luminance contrast against every floor material at the default grade. Check the sunflower jacket against `brick` and `sand`. The plum outline and the contact shadow guarantee the edge.

---

## 5. Lighting and rendering rules for sprites

### 5.1 Shape language
- **Heroes:** circles and soft ovals, big heads, no sharp corners. Squash-and-stretch friendly.
- **NPCs (Taipei folk):** soft rounded rectangles, about 2.2–2.6 heads tall, calmer poses. Reads as "grown-up" next to the toddler.
- **Foes (mischief family):** everyday objects and animals with round eyes. The silhouette is the object (cup, umbrella, helmet, pigeon), plus one exaggerated feature (straw antenna, crown, flapping wing).
- **Architecture:** clean prisms and frustums, softened by rounded cornices and lit edges.

### 5.2 Outline policy
- Silhouette: `line #3A2838`, **1.6–1.9 units** on the 100-unit viewBox (≈1.0–1.2px at 64px render). Use 1.9 on heads and 1.7–1.8 on bodies.
- Interior lines: **1.0–1.4 units** in the material's shade or AO colour (e.g. the zip is `#D27F22` on the jacket). Never `line` for interior folds.
- Facial features may use `line` at 1.0–1.5 (mouth outline, cat mouth, lids).
- Thin limbs, tails and straws use the **fat-stroke technique**: a `line` stroke `w + 3.4` under a fill stroke `w`, both with round caps (see the tail in `mocha-cat.svg`).
- Draw the silhouette outline **last**, as a separate `<use href="#shape">` with `fill="none"`, so shading passes never eat the edge.
- Environments: **no outlines** on tiles and terrain. Props get outlines only at ≥2 tiles tall when they must separate from the sky (optional, 1.2px). The heroes and foes are the only fully outlined things, which itself makes them pop.

### 5.3 Shading stack (per form, bottom → top)
1. **Material gradient fill.** Linear from upper-left: `x1=.15 y1=0 x2=.85 y2=1`, stops `light 0` → `base .42–.5` → `shade 1`. Round forms (heads) use a radial at `cx=.36 cy=.3 r=.8`.
2. **Far-side form shadow.** Clipped to the form (`clipPath` from the same shape). A crescent on the back-right in `shade` (or the material's red-shifted shade for skin) at **0.35**, plus a second smaller crescent at **0.4**. Two passes fake a soft edge without blur.
3. **AO accents** wherever forms meet: under the chin on the jacket, under arms, under hats and lids, between the legs. An ellipse in the material's AO colour at **0.45–0.6**, clipped to the receiving form. This is the single most important premium cue.
4. **Ground bounce.** The bottom ~8% of lower forms gets `bounceSky` at **0.16–0.25** (day). It switches to `rimLamp` at 0.2 under lanterns or at night.
5. **Rim light.** A 1.4–1.6 stroke along the back-right silhouette, inside the clip. `rimSky` at 0.9 by day, the grade's rim colour otherwise, `rimFoe` on foes. Heads and the far edge of the body only.
6. **Sheen and specular.** Cloth: one lighter stroke on the lit side (`#FFF4C4` at 0.7 on the jacket). Glossy objects (eyes, drum, pearls, lids): small white ellipses or circles at 0.55–0.85. Eyes always get **two** highlights (big upper-right at 1.0, small lower-left at 0.8).
7. **Outline** (§5.2).

### 5.4 Contact shadow and AO on the ground
- A `<ellipse>` at the feet, `rx ≈ 0.5 × footprint width`, `ry ≈ 0.18 × rx`, radial gradient `ao` at `0.42 → 0.16 (70%) → 0`.
- It stays put when the sprite hops. On a jump it scales to 0.75 and lightens (`opacity .7`), which sells height.
- Cast shadows (environment props only, not characters) fall screen lower-right (+c direction) as flat `ao` polygons at **0.16–0.2** (see `iso-tiles.svg`, `cast()`).

### 5.5 Texture
- No per-sprite noise filters.
- **One global grain layer** per screen: a 160×160 SVG `feTurbulence` data-URI as a CSS `background-image` on a fixed, `pointer-events: none` overlay, `mix-blend-mode: multiply`, `opacity: .06–.08`. Static and never animated, so the browser rasterises it once (snippet in `reference/battle.html`, `.grain`).
- Material texture is drawn: tabby stripes, brick courses, grass tufts, water ripples, glass window bands. Keep it to 2–6 marks per tile or form.

### 5.6 Faces (the soul of the style)
- Toddler and animal eyes sit **below** the head's midline. They're big, vertical ovals (Baokaka) or rounded almonds (Mocha). Pupils use `pupil #2E1E2C` with a warm lower-iris reflection (`#7A4A38` for Baokaka, a radial `catEye` for Mocha).
- Blush is a **radial gradient**, never a hard circle.
- Mouths are small. Open mouths show a tongue tint (`#FF8F8F`).
- Expressions swap `*-eyes` and `*-mouth` groups (§6.4). Avoid redrawing heads.

---

## 6. Characters

### 6.1 Baokaka (寶咖咖) — model sheet in words
Reference: `reference/baokaka.svg`, `reference/model-sheet.png`.

- **Age read:** a 1-year-old. A huge round head, chubby cheeks wider at the bottom, sparse soft hair, tiny mitten hands, short bowed legs, a round belly. No neck.
- **Proportions:** 2 heads tall (head ≈52% of total height). Eyes on the lower half of the face. Head width about 1.6 × body width at the shoulders. The arms just reach the belly bottom.
- **Silhouette hooks** (must survive at 48px): (1) the curly hair sprout on top, (2) the pink bubble-tea straw rising behind his right shoulder, (3) the round pellet drum (波浪鼓) on a stick.
- **Outfit (modern Taipei, rain-ready):**
  - A **sunflower-yellow hooded rain jacket**, hood down and bunched at the neck, white drawstrings with bead tips, centre zip.
  - **MRT-blue bloomer shorts.**
  - **Tomato-red squeaky shoes** with cream soles.
  - A **bubble-tea cup backpack**: milk-tea body, white lid, visible pearls, pink straw.
  - The pellet drum is his "weapon": red face, gold ring, two gold beads on strings. Attacks are rhythmic drum beats (sound-wave rings).
- **Key colours:** sunflower, skin, MRT blue, tomato, strawPink. The yellow-blue complement makes him the most visible thing in any scene.
- **Expressions set** (swap groups `bk-eyes`, `bk-mouth`, optional `bk-fx`):
  1. `happy` (default): oval eyes, open smile.
  2. `laugh`: ^^ arc eyes, wide open mouth.
  3. `surprised`: smaller pupils with big highlights, an "o" mouth.
  4. `pout`: eyes looking down, a wobbly mouth line, one tear drop (light blue `#9CD3FF`).
  5. `determined`: brows down at the inner end, a closed smile.
  6. `hurt`: >< eyes, open mouth.
  7. `sleepy`: half-lid lines, small mouth, a "z" bubble FX.
  8. `wow`: sparkle eyes (4-point star highlights).

### 6.2 Mocha Cat (摩卡貓) — model sheet in words
Reference: `reference/mocha-cat.svg`.
- **Breed read:** a brown mackerel tabby, mid-size, round-faced, slightly chubby.
- **Proportions:** sitting, ~1.8 heads tall. The head is as wide as the haunches. Big ears, about 0.45 head height.
- **Identity markers (never drop):** the forehead **M**, cheek stripes, a cream muzzle and bib, white paws, a ringed tail with an S-curve and hooked tip.
- **Accessories:** an **MRT-blue bandana** with cream polka dots, knotted on the near side, and a **round gold transit-card tag** hanging at the point.
- **Eyes:** large green-gold almonds, oval (not slit) pupils for warmth, two highlights, a top lid line.
- **Whiskers:** cream, 0.8 units, allowed to break the silhouette.
- **Personality in pose:** a confident sit, head tilted toward Baokaka, the tail tip always curling (idle tail flick).
- **Expressions set** (`mc-eyes`, `mc-mouth`, `mc-ear-l/r`): `content` (default), `smug` (half-lid eyes, one brow), `happy` (^^ eyes, ears up), `alert` (round pupils, ears forward), `annoyed` (flat lids, ears sideways), `hurt` (>< eyes, ears flattened), `sleepy` (closed eyes, loaf pose). **Ears are expression.** Rotate `mc-ear-l/r` ±25–40°.
- **Map locomotion:** a dedicated side-trot pose sprite (`mochaWalk`, 2 leg frames) is priority P2. Until then the sitting sprite hops.

### 6.3 Companions, NPCs and foes (style families)
| Family | Line | Saturation | Rim | Heads tall | Notes |
|---|---|---|---|---|---|
| **Heroes and companions** | `line` 1.7–1.9 | 100% | `rimSky` / grade rim | 1.8–2.2 | Own sunflower and MRT blue. Companions (if the story adds any) get one signature colour not used by other heroes |
| **Taipei folk (NPCs)** | `line` 1.6 | ≈70% (use `*Shade`-leaning bases) | `rimSky` at 0.6 | 2.2–2.6 | Everyday outfits: 阿嬤 with a hand fan and floral shirt, MRT staff vest, night-market vendor apron, student backpack, temple volunteer. Faces simpler: dot eyes with one highlight |
| **Mischief foes** | `line` 1.8–2.0 | 90–100% | **`rimFoe` violet** | object-shaped | Animated city things: runaway bubble tea, umbrella, scooter helmet, pigeon gang, lantern, red envelope, rice dumpling, MRT token. A white-sclera eye with an angled brow, at most one fang, blush. **Boss:** gold crown + `aura` radial behind + nameplate "頭目" |
| **Wildlife foes** | as mischief | | `rimFoe` | — | Taipei animals with mischief: macaque (壽山-style), crab (淡水), crow, stray dog pack (friendly after defeat) |

A KO is never death. Foes **pop back to a normal object** with dizzy stars and a sparkle, then hop away. Heroes faint by plopping onto their bottoms (Baokaka) or curling into a loaf (Mocha).

### 6.4 Rig and animation (CSS transforms on SVG parts)
Every hero and foe SVG exposes named groups:

| Baokaka | Mocha | Foe (min) |
|---|---|---|
| `bk-shadow`, `bk-backpack`, `bk-arm-back`, `bk-legs`, `bk-body`, `bk-head`, `bk-eyes`, `bk-mouth`, `bk-arm-front`, `bk-drum` | `mc-tail`, `mc-body`, `mc-bandana`, `mc-head`, `mc-ear-l`, `mc-ear-r`, `mc-eyes`, `mc-mouth` | `*-shadow`, `*-body`, `*-face`, `*-extra` |

**Technique** (verified in `model-sheet.html`):
```css
.rig [data-part] { transform-box: view-box; }        /* origins in viewBox units */
.bk-arm-front { transform-origin: 37px 61px; }        /* shoulder */
.bk-head      { transform-origin: 50px 56px; }        /* chin/neck */
.bk-body      { transform-origin: 50px 92px; }        /* between the feet */
.mc-tail      { transform-origin: 68px 88px; }        /* tail root */
.mc-ear-l     { transform-origin: 36px 26px; }  .mc-ear-r { transform-origin: 66px 26px; }
```
The pose is a class on the sprite root (`data-pose="idle|walk|attack|hurt|victory|ko"`). The keyframes live in `src/art/rig.css`. Animate only `transform` and `opacity`.

| Pose | Recipe (Baokaka; Mocha analogous) | Timing |
|---|---|---|
| **idle** | body `scaleY(1 → 1.02)` from the feet; head `translateY(0 → -0.6px)`; drum bead swing ±8°; blink: `bk-eyes scaleY(1 → .1 → 1)` around the eye centre, 120ms, every 3.5–5s (random `animation-delay` per instance). Mocha: tail `rotate(0 → -6°)`, ear twitch every ~6s | 2.4s ease-in-out, infinite |
| **walk** | 2 beats per tile: root `translateY(0 / -2.5px)`, body `rotate(±3°)`, arms counter-swing `±16°`, legs `skewX(±6°)`, backpack follows 60ms late (`animation-delay`) | 360ms per cycle |
| **attack** | **Anticipation** 120ms: lean back `rotate(-3°)`, arm `translate(-4px,-2px) rotate(40°)` (drum up and back). **Strike** 90ms: root `translateX(+14%)`, arm `rotate(-35°)`, head `rotate(6°)`. **Hold** 80ms (hit-stop). **Recover** 220ms ease-out | 510ms total |
| **hurt** | 0–100ms: white flash (`filter: brightness(1.8) saturate(.4)` on **this one sprite only**, for ≤2 frames). Squash `scale(1.05,.94)`, knockback `translateX(-6%)`, head `rotate(-10°)`, expression `hurt` for 500ms | 300ms + 500ms face |
| **victory** | Hop loop: root `translateY(0 → -8% → 0)` with a landing squash `scale(1.06,.94)`; drum arm `translate(-3px,-3px) rotate(25°)`, back arm `rotate(-60°)`, eyes `laugh`, shadow `scale(.75)` at apex | 700ms loop |
| **ko** | Sit plop: body `translateY(+6%) scale(1.04,.9)`, head `rotate(-8°)`, `pout` face, 3 dizzy stars orbit (`fx-orbit`) | 400ms, then hold |

**Reduced motion:** idle breathing, blink and walk bob are off. Attack and hurt become a 150ms offset plus face swap. Victory is a static pose.

---

## 7. Environment

### 7.1 Isometric tiles
Tile geometry stays 2:1, `TILE_W 72 × TILE_H 36` (`engine/iso.ts`). The look changes:

- **Render the ground as one SVG per map** (memoised on `map.id`). Each tile is a `<polygon>`, or a `<use href="#tile-grass-a">` from a shared tile `<defs>`. That replaces the 1 `div` + `clip-path` per tile. The ground doesn't change while walking, so the browser rasterises it once and the camera only translates it.
- **Per-tile recipe** (see `iso-tiles.svg`):
  1. A base or alt fill picked by a hash (`(c*7 + r*3) % 3`). That avoids checkerboards, which read as "game board".
  2. **Edge light:** the two top edges get a 1px `light` stroke at 0.55, the two bottom edges a 1px `shade` stroke at 0.45. That gives a subtle bevel and lets the grid read without lines.
  3. **Material marks** (2–6 per tile, seeded so they're stable):
     - grass: tufts and 0–2 flowers
     - brick: 3 running-bond courses along the c-axis, staggered joints, one grey accent paver
     - asphalt: a lane dash on road-centre tiles
     - zebra crossing: 4 bars parallel to traffic
     - water: 2 ripple arcs plus one specular streak per pond
     - temple stone: a big-slab grid
     - MRT platform: a tactile yellow strip
  4. **Material transitions** get a lit kerb or rim line, not a hard swatch edge: brick→road `#E9E2D6` 1.6px, grass→water `#F3E6CC` 2px stone rim.
- **One light sweep** over the whole floor (a linear gradient `keyWarm` 0.32 → 0 from the top corner), never per tile.
- **Diorama skirt:** where the map ends, draw the island's thickness: front-left face `skirtSoil` light→base, front-right face base→shade, two strata lines, and a soft `ao` ellipse under the island. That replaces perimeter walls and **fixes the zigzag wall bug**.

### 7.2 Heights, walls and props
- **Height units:** low (kerb, planter) 12–18px, wall 36px (= `TILE_H`), building facades and landmarks are **props**, not blocks.
- **Blocks:** left face lit (`light`→base), right face shade, top face base with a 1.4px lit rim on its near edges (planter in `iso-tiles.svg`).
- **Contiguous walls render as one prism per run** (merge adjacent wall tiles into a single polygon), so there are no seams. The prop budget per map is ~25 decorative props.
- **Scale:** heroes are ~0.8–0.9 tile wide, with a sprite box of `0.85 × TILE_W ≈ 60–64px` (down from 94px). Furniture and street props are sized to that toddler: a post box ≈ hero height, a bench seat at hero waist.

### 7.3 Landmark set-pieces
Large multi-tile SVG props with their own `footprint {w,h}` and an **anchor at the front-most footprint tile** (max c+r) for sorting. The current code anchors at the centre, which mis-sorts big props.

| Landmark | Footprint | Key read | Notes |
|---|---|---|---|
| **台北101** | 1×1 to 2×2 | 8 flaring "bamboo" frustum sections, podium, spire, ruyi ledges | Proven in `iso-tiles.svg`: each section has left face `glass` light, right face `glass` shade, a lit ledge rim, window bands. At night the ledges glow `#FFE2A0` |
| **台北車站** | 4×2 | Palace-style double roof, cream walls, square tower mass, big hall doors | Roof `#C8A35A`/`#9A7A3A`, walls `stoneWarm` |
| **台灣大學** | 3×2 + palm row | Main library (brick + arched windows), 椰林大道 palms | Golden-hour default. Azalea bushes as props |
| **大安森林公園** | park map | Bandshell (white shell), pond, banyan clusters | Morning mist band |
| **淡水** | river map | 情人橋 white sail bridge, red Fort San Domingo, riverside path | Sun-glitter specks animate slowly |
| **西門町** | street map | 紅樓 octagonal red-brick house, pedestrian zebra crossings, sign towers | Neon only after dusk |
| **士林夜市** | street map | Stall rows (striped awnings), lantern strings, steaming pots | Night default, steam ambient |
| **龍山寺** | 3×3 | Swallowtail roof ridges, dragons as simplified curls, red columns, lanterns | jadeRoof ridges, templeGold trim |
| **象山** | hill map | The Six Giant Rocks as soft boulders, stone steps, 101 view | Battle backdrop proven in `battle.html` |
| **貓空** | hill map | Tea terraces, gondola cabin on cable, teahouse | Mist bands |
| **北投** | valley map | Wooden Beitou library, hot-spring stream (jade), steam | Rain default |
| **MRT** | interior | Platform with tactile strip, glass doors, line-colour band | Used for travel interludes |

### 7.4 Depth sorting
- Painter's order is `c + r`, ties broken by `c`. Actors and props share one sorted list.
- Multi-tile props sort by their front-most tile. Tall props in front of the lead fade to 0.4 (existing `hides()` logic), plus a 6px feathered edge.
- Characters cast **no** cast-shadows (only the contact ellipse), so walking never needs shadow sorting.

### 7.5 Ambient life
At most 6 animated ambient elements per screen. All CSS keyframes on transform and opacity, paused with `animation-play-state` when the document is hidden.
- **Day:** pigeons pecking (2-frame head bob), a butterfly loop, leaf sway on canopies (±1.5° from the trunk base), water ripple scale.
- **Dusk/night:** lantern sway, window lights turning on (staggered opacity), bokeh/fireflies drifting (radial gradient dots), steam plumes (3 blobs rising and fading, 3s).
- **Rain:** streak layers (below), puddle rings (ellipse scale + fade).
- **Reduced motion:** ambient is off, with static poses kept.

### 7.6 Parallax sky behind the iso map
The world screen gets a `SkyLayer` behind `IsoMap`:
1. Sky gradient (from the location script).
2. Sun or moon glow (a radial gradient).
3. Clouds (2–3 soft ellipse groups).
4. Far ridge (陽明山 silhouette, haze colour).
5. Skyline (2 layers of stepped rectangles, `#B3C4D8`/`#C6D3E0` by day).
6. A haze gradient to the horizon colour.

Layers translate at 0.1 / 0.2 / 0.35 × the camera offset. Below the map the sky fades into a warm floor colour so the island floats (see `iso-tiles.png`).

### 7.7 Battle backdrops
One template, `Stage` v2, in `backdrops.tsx`. The layer stack is in `reference/battle.html`:
1. Sky gradient (4 stops) and stars at night.
2. Sun or glow radial.
3. Far ridge (0.7 opacity).
4. Skyline with lit windows (lights-on scaled).
5. **Landmark silhouette** in a tinted gradient with lit ledges.
6. Horizon haze band.
7. **Foreground framers** left and right (rocks, palms, stall awnings, temple columns): dark gradient shapes that frame the fight and give depth.
8. Floor in perspective (vanishing at ~60% height) with step and course lines in light plus dark pairs.
9. Warm light pool under the combatants.
10. Bokeh motes.
11. Vignette (`#1B1530`, 0 → 0.55).
12. Foe aura radial behind the foe.

Composition rule: **heroes lower-left facing right, foes upper-right.** The diagonal reads naturally, keeps faces visible, and leaves the top-left for the location chip and the top-right for the foe plate.

### 7.8 Weather and time FX
- **Rain:** two full-screen layers of `repeating-linear-gradient` streaks (angle 100°, 1px white at 0.25 and 0.15), translated with CSS animation at different speeds. Puddle rings on the ground. The `rain` grade.
- **Mist (貓空):** 2–3 wide horizontal gradient bands (`#FFFFFF` 0 → 0.5 → 0) drifting ±20px over 12s.
- **Steam (北投, night market):** blobs rising and fading.
- **Fireworks** (finale at 101): radial burst of 12 lines with stroke-dashoffset, `mix-blend-mode: screen`, at most 2 at once.
- **Sun glitter (淡水):** 6 tiny diamonds twinkling.

---

## 8. UI/UX visual system

### 8.1 Typography
- **Family:** **Chiron GoRound TC** (Google Fonts, OFL). A rounded Traditional Chinese face with real weights 400–900. It's friendly and highly legible for older eyes, and Google serves it as `unicode-range` slices, so only the glyphs used are downloaded.
- **Numerals and Latin:** **Fredoka** 500–700 (HP, damage numbers, round counters). Rounded and tabular-friendly.
- **Load:** `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` + `css2?family=Chiron+GoRound+TC:wght@500;700;900&family=Fredoka:wght@500;600;700&display=swap`.
- **Fallback:** `'Chiron GoRound TC', 'PingFang TC', 'Noto Sans TC', system-ui, sans-serif`.
- **Scale** (replaces `tailwind.config.js` fontSize; px / line-height / weight):

| Token | Size | LH | Weight | Use |
|---|---|---|---|---|
| `caption` | 14 | 1.4 | 700 | meta, bar labels (floor for grandparents) |
| `label` | 16 | 1.4 | 700 | chips, small buttons |
| `body` | 18 | 1.6 | 700 | menus, descriptions |
| `dialogue` | 21 | 1.62 | 700 | dialogue text |
| `button` | 21 | 1.2 | 900 | battle commands, primary CTA |
| `heading` | 22 | 1.3 | 900 | panel titles |
| `title` | 28 | 1.2 | 900 | screen titles, victory |
| `display` | 36 | 1.1 | 900 | chapter cards |
| `hero` | 52 | 1.0 | 900 | logo lockup |
| `number-xl` | 40 Fredoka | 1 | 700 | damage numbers (with 6px `line` stroke, `paint-order: stroke`) |

### 8.2 Dialogue box (reference: `dialogue.html`)
- **Layout:** a bottom sheet with 12px side margins, `surface → #FFF7EA` gradient, radius 28, min height 178, an inner 1px highlight and a soft deep shadow.
- **Speaker portrait:** a 124px rounded square (radius 34) overlapping the top-left. The backing is a radial gradient in the speaker colour with a 3px white inner ring. The portrait is the **same sprite** cropped (`width 190%`, offset) with no separate portrait art. Swap expression via props.
- **Listener portrait:** 78px at top-right, desaturated (`saturate(.55) brightness(.92)`). A static filter is fine.
- **Name pill:** speaker colour, 18px/900, white text, lip shadow in the deep tone.
- **Text:** 21px/700, typed at 30ms per char with +120ms pauses at `，。！？`. Untyped text shows at 0.18 opacity, so the line length is known and nothing reflows. Key terms (places, items) are `em`: persimmon `#C9601F` with a sunflower highlighter underlay.
- **Footer:** page dots (current = pill), "點一下繼續", a sunflower ▼ button that bounces 6px at 1.2s. A tap anywhere finishes the line, then advances (existing behaviour).
- **Choices** (if the writer adds any): up to 3 full-width tonal buttons, 60px tall, above the box. The selected one becomes primary.

### 8.3 Battle screen and command panel (reference: `battle.html`)
- **Stage** is the top ~520px, the **panel** the bottom ~344px (radius 30 top, cream gradient, upward shadow).
- **Top chips** are glass: the location and time on the left, the round counter on the right.
- **Foe plate** is glass at top-right: a 頭目 tag for bosses, name 19px/900, Fredoka HP numbers, a 12px bar with a lag bar (`#FFE2A8`) that catches up 400ms after damage.
- **Party strip:** one card per hero with a 46px circular portrait, name, HP bar (9px), MP bar (6px), and numbers. The active hero's card gets a sunflower 2.5px inset ring and `#FFF1C9` fill. On stage, a "輪到你" pill plus a sunflower ellipse ring under the active hero.
- **Prompt line:** "寶咖咖要做什麼？" (18px/700).
- **Commands:** a 2×2 grid, buttons 70px tall, radius 22, 38px icon tile with tinted backing, label 21px/900 plus a sub-label (12px Fredoka/TC) with live info (MP cost, item count). 攻擊 is the only primary. Pressed state: `translateY(3px)`, lip shadow reduced to 1px, 80ms.
- **Targeting:** foes get a pulsing sunflower ring and a bobbing ▼. Tap the foe directly, never a list.

### 8.4 HP/MP bars
- Rounded track `rgba(58,40,56,.12)` (light) or `rgba(0,0,0,.35)` (glass).
- The fill is a vertical gradient with a **3px inner highlight stripe** (`rgba(255,255,255,.45)`, inset 6px). That one detail makes bars look premium.
- Damage: the fill eases down in 300ms and the lag bar follows after 400ms.
- Heal: the fill grows with a brief sparkle at the bar end.
- Thresholds: <40% orange, <20% red + pulse + icon.

### 8.5 Menus and sheets
Keep `Screen`, `AppBar`, `Button`, `Sheet` and restyle them:
- AppBar back button: a 46px cream circle with shadow.
- The title block becomes a cream rounded plate over art (see `dialogue.html`).
- Cards use `cream` with the `card` shadow. Lists get 64px rows.
- Sheets: radius 30, backdrop `rgba(27,24,48,.45)` without blur (blur over the map is expensive).

### 8.6 Title screen
- **Full-bleed living scene:** a dawn Taipei skyline (101 centre, 陽明山 ridge), a slow parallax drift (0.5px/s), and Baokaka and Mocha on a small brick-and-grass diorama island in the lower third. Mocha's tail flicks and Baokaka blinks.
- **Logo lockup:** the game title (final name from the writer) in Chiron GoRound TC 900 at 52px. Sunflower fill with a 7px `line` stroke (`paint-order: stroke`), a soft drop shadow `0 6px 0 rgba(46,34,53,.25)`, two lines with a slight –3° tilt on line 2. The kicker above is in Fredoka caps ("A TAIPEI ADVENTURE").
- **Actions:** the primary "開始冒險" or a save card ("繼續冒險 · 第3章 西門町" with chapter thumbnail colours), and a ghost "設定".

### 8.7 Chapter title cards
- Full screen in the chapter's sky gradient.
- The landmark silhouette **draws itself** in cream line art (`stroke-dashoffset`, 900ms), then fills with a 30% tint.
- Text: kicker "第 3 章" (Fredoka/TC 16px, tracking .3em), title (36px/900), location line (18px) with a tiny MRT line-colour bullet.
- Holds 2.2s total, a tap skips. Reduced motion: no draw-on, a 300ms fade.

### 8.8 Transitions
| From → to | Transition | Duration |
|---|---|---|
| Map → battle | **MRT doors:** two MRT-blue panels with window strips slide in from the sides (ease-in), a chime-light flash, then slide out over the battle stage | 280 + 120 hold + 320ms |
| Battle → victory | Foe pops to an object + sparkle, a sunflower radial wash, the victory card slides up | 600ms |
| Map → map (exit) | Iris wipe toward the exit tile (circle `clip-path`) | 400ms |
| Any → chapter card | Crossfade via the sky colour | 300ms |
| Dialogue in/out | Sheet up 18px + fade; portrait pops with overshoot | 240ms |
| **Reduced motion** | Everything becomes a 200ms crossfade | — |

### 8.9 Iconography
- 24px grid, 2.2px stroke, round caps and joins, `currentColor`. Extend the existing `icons.tsx`; no emoji, no icon font.
- In battle commands icons sit in a 38px tinted tile (attack sunflower, skill violet `#EDE2FF`/`#6B47B8`, item green, defend blue).
- Taipei-flavoured glyphs where they fit: items as a bubble tea, a 刈包, a pineapple cake; a map pin as a tiny 101.

### 8.10 Motion principles
- **Tokens:** `instant 80ms`, `quick 160ms`, `base 240ms`, `slow 400ms`, `scene 600ms`.
- **Easings:** `out` = `cubic-bezier(.2,.8,.2,1)`, `in` = `cubic-bezier(.4,0,1,1)`, `pop` = `cubic-bezier(.34,1.56,.64,1)` (overshoot), `sway` = `ease-in-out`.
- Stage every action: **anticipation → action → follow-through**. Never move more than two things at once in UI.
- Loops (idle, ambient) are slow (≥2s) and offset per instance so nothing pulses in sync.
- **`prefers-reduced-motion: reduce`:** no loops, no parallax, no camera shake, no flashes. Pops become fades; flying FX become in-place fades (existing `fx-hold` behaviour). Also offer an in-game "減少動態" toggle that sets the same class, because grandparents may not know the OS setting.

---

## 9. Battle VFX language

Keep the 3-layer architecture of `BattleFx.tsx` (circle, wash, hit) and restyle it:

1. **Anticipation (0–120ms).** The caster's attack pose, and for skills a **glyph circle** under the caster. It's no longer a wuxia rune: an iso-flattened ring with Taipei motifs (a drum-beat ring for Baokaka, paw-print ring for Mocha), drawn with stroke-dashoffset in the element colour.
2. **Impact (at hit).**
   - **Hit-stop:** 60ms freeze on both sprites.
   - **Impact shape** per element (below), 0.9 → 1.15 → 0 scale with the `pop` easing over 260ms.
   - **Shockwave ring** (stroke scales 0.6 → 1.6, opacity 0.7 → 0).
   - **6–10 particles** (SVG shapes on transform paths).
   - The target plays `hurt`.
   - **Screen shake** only on crits, boss moves or KOs (≤4px, 180ms).
3. **Resolution.** The damage number pops (Fredoka 40, cream fill, 6px `line` stroke, a gold sub-label like "好痛!" or "效果絕佳!"). It rises 24px on an arc over 600ms and fades. Heals use green numbers with a "+".

**Element families.** Shape differs as well as colour, for colour-blind safety.
| Element | Colour | Impact shape | Particles |
|---|---|---|---|
| 鼓聲 Sound (Baokaka) | sunflower `#FFE27A` + cream | concentric rings + 12-point star | music notes, small rings |
| 貓爪 Claw (Mocha) | cream → peach `#FFC9A8` | 3 curved slash arcs | tufts of fur (soft ovals) |
| 水 Water | water `#6FC2DC` | splash crown | droplets |
| 光 Sparkle / heal | gold `#FFE27A` + white | 4-point stars | twinkles rising |
| 風 Wind | mint `#A8E6CF` | spiral swoosh | leaves |
| 雷 Thunder | `#FFF27A` + violet edge | zig-zag bolt | sparks |
| 甜 Sticky (boba foes) | milkTea + pearl | goo splat | pearls bouncing |
| 夜 Mischief (foe default) | aura `#B57BFF` | swirl | violet motes |

**Rules:**
- An element wash (full-screen `mix-blend-mode: screen`) is ≤0.35 opacity and ≤200ms.
- At most **2 flashes per second** (photosensitivity).
- Damage numbers never overlap a face. Offset them up-left of the target's head.
- All FX nodes are SVG (no canvas), at most 40 FX elements alive at once, and removed on `animationend`.

---

## 10. Performance budget (mid-range phone, e.g. a 2020 Android at 60Hz)

| Item | Budget |
|---|---|
| Frame time while walking the map | ≤12ms scripting + paint at 4× CPU throttle (Playwright CDP `Emulation.setCPUThrottlingRate`) |
| Ground layer | **1** SVG per map, memoised. No per-tile DOM nodes. ≤1,500 SVG elements for a 20×20 map with marks |
| Sprite complexity | heroes ≤120 elements, foes ≤90, NPCs ≤70, props ≤40, tiles ≤12 |
| Gradients | ≤10 per sprite, shared material gradients defined once (§11.2) |
| SVG filters | **0 at runtime inside sprites.** One static grain overlay (data-URI background). The `hurt` brightness flash is ≤2 frames on one sprite |
| `backdrop-filter` | ≤2 small elements per screen, never over animating content larger than the element |
| `mix-blend-mode` | ≤3 full-screen layers (grade multiply, lights screen, grain multiply) |
| Animated properties | `transform`, `opacity` only. `will-change: transform` only on the camera layer and FX in flight |
| Concurrent animations | ≤6 ambient + the party + ≤40 FX nodes |
| Fonts | 2 families via Google Fonts slices, ≤150KB first paint, `display=swap` |
| Total DOM on world screen | ≤3,000 nodes |
| JS bundle (art) | sprites tree-shaken per chapter if they exceed 120KB gzip (lazy-load chapter sprite packs) |

---

## 11. Implementation architecture

### 11.1 File organisation
```
src/art/
  palette.ts          tokens + MATERIALS ramps (light/base/shade/ao) + GRADES
  grade.tsx           <GradeProvider>, useGrade(): rim/key/bounce colours as CSS variables
  defs.tsx            <ArtDefs/>: one hidden <svg> with shared material gradients + contact shadow
  rig.css             transform-box/origins + pose keyframes (idle/walk/attack/hurt/victory/ko)
  sprite.ts           Sprite contract v3 (below)
  useSvgIds.ts        per-instance id prefixing for clipPaths
  characters/         baokaka.tsx, mochaCat.tsx (+ expressions), companions
  folk/               Taipei NPCs
  foes/               one file per family (mischief.tsx, wildlife.tsx, bosses.tsx)
  tiles/              tileDefs.tsx (<symbol>s per material variant), terrain.ts (material table)
  props/              street.tsx (post boxes, lamps, benches, scooters), nature.tsx, landmarks/*.tsx
  sky/                SkyLayer.tsx + per-location sky configs
  backdrops/          Stage.tsx + one config per landmark
  fx/                 shapes.tsx (impact shapes, particles), rings.tsx
  ui/                 grain.css, bars.tsx, portrait.tsx
```
Old sprites for the hidden-object and sudoku games can be removed once those games are gone. Keep `SpriteName` stable for map data where possible.

### 11.2 Shared defs and filters
- `<ArtDefs/>` is mounted once at the App root. It's an `<svg width="0" height="0" style="position:absolute">`. **Not `display:none`**, because gradients inside a `display:none` SVG fail to resolve in Chrome and Firefox.
- It defines `m-skin`, `m-sunflower`, `m-tabby`, `m-mrt`, `m-contact`, ... using `objectBoundingBox` units, so any shape can reference `fill="url(#m-skin)"`.
- Sprite-specific gradients (the 101 glass, the foe cup) stay local but use instance-prefixed ids.
- Colours that change with the grade (rim, bounce) are applied through `style={{ stroke: 'var(--rim)' }}`. CSS variables don't work in presentation attributes, only in `style`.

### 11.3 Unique ids
- Every local `id` in a sprite comes from `const id = useSvgIds('bk')` (wrapping React `useId()`, sanitised: `:` is invalid in `url(#…)` in some browsers, so replace it with `-`). Then `id('headClip')` gives `bk-r1-headClip`.
- That makes N copies (map + portrait + party card) safe on one page. The model sheet shows the string-level equivalent (`mount()` prefixes ids, `url(#)` and `href="#"`).
- A lint test (vitest) renders every sprite twice into one document and asserts no duplicate ids and no dangling `url(#…)`.

### 11.4 Sprite contract v3 (replaces `sprite.ts` comment)
1. Root `<svg viewBox="0 0 100 100">`. The subject's feet or base sit at y≈92–95, with the contact shadow drawn first.
2. Only `palette.ts` tokens or `MATERIALS` gradients. No raw hex in sprite files (lint: regex `#[0-9a-f]{3,6}` outside palette.ts fails).
3. Outline: `line`, 1.6–1.9 silhouette, interior in the material shade (§5.2).
4. Shading stack per §5.3. Every standing sprite has a contact shadow.
5. Rig groups named `{prefix}-{part}`, with pose and expression via props (`pose`, `expression`). No animation logic inside the sprite beyond class names.
6. No filters, no `<text>`, no bitmaps, ids via `useSvgIds`, no interactive attributes.
7. Element-count budget per §10, checked by a test.

### 11.5 IsoMap changes
1. **Ground** becomes one memoised `<svg>` (tiles via `<use>` of `tileDefs` symbols plus seeded marks) and a light sweep. The diorama skirt is drawn on the map's outer edges.
2. **Walls** are merged runs drawn as single prisms.
3. **Actors and props** keep the absolutely positioned boxes, sorted by `c + r` with the multi-tile anchor fix. Size drops to ≈0.85 tile width. The contact shadow is part of the sprite.
4. **Layers** (back → front): `SkyLayer` (parallax) → ground SVG → cast shadows → actors → lights (screen) → grade (multiply) → weather → grain. UI goes above.
5. The tap marker becomes a soft sunflower diamond ring with a 1.2s pulse (reduced motion: static).

### 11.6 Visual QA
- **Art lab route** (`#/artlab`, dev builds only): a grid of every sprite at 48/64/124px on day/night/brick backgrounds, a silhouette row, every tile material, every backdrop at every grade, and every FX kind frozen at its impact frame.
- **Playwright screenshot checks** (the repo already uses headless Chromium with `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`): a `scripts/visual-check.mjs` that loads the art lab and the key screens (title, world, dialogue, battle, victory, chapter card) at 390×844 and 375×667, writes PNGs, and diffs them against committed baselines with a tolerance (pixelmatch). Run it in CI on art changes.
- **Perf check:** the same script with `Emulation.setCPUThrottlingRate(4)`, walk 10 tiles, and assert the median frame time ≤16ms from `PerformanceObserver` long-task and rAF sampling.
- **Contrast check:** a vitest unit that computes WCAG ratios for every text-token pair used in UI (§4.5).
- **Human review:** every new sprite PR includes its art-lab crop at 48px and 124px.

---

## 12. Prioritised implementation plan (biggest perceived-quality jump first)

| # | Work | Why first | Size |
|---|---|---|---|
| **P0-1** | **New Baokaka and Mocha Cat** (port `reference/*.svg` to TSX with `useSvgIds`, rig groups, expressions, `rig.css` idle/blink) | The heroes are on every screen; the identity change is mandatory for the new story | M |
| **P0-2** | **Tokens and fonts:** `palette.ts` materials + grades, the Tailwind colour and type scale, Chiron GoRound TC + Fredoka, the grain overlay | Instantly lifts every screen, and it's the foundation for all other work | S |
| **P0-3** | **Dialogue box v2** (portrait from the sprite, name pill, typed text with ghosting, footer) | The story-heavy game spends most of its time here | S |
| **P0-4** | **Battle screen v2:** command panel, bars with highlight stripe, foe glass plate with lag bar, hero lower-left / foe upper-right layout, `Stage` v2 template with one landmark backdrop (象山·101) | The second most-seen screen; the mock is ready | M |
| **P1-1** | **IsoMap v2:** single-SVG ground with material tiles, edge light, light sweep, diorama skirt (fixes the wall zigzag), sprite size 0.85 tile, contact shadows | Big quality jump on exploration; also a perf win | M |
| **P1-2** | **SkyLayer + grades** (day/dusk/night/rain overlays, lights-on) | Gives each chapter its mood cheaply | S |
| **P1-3** | **Landmark props:** 101 (port `iso-tiles` generator logic to a TSX component), 台北車站, 龍山寺, 紅樓; street props (post boxes, lamp, bench, scooter, palm, banyan) | Recognisable Taipei | L |
| **P1-4** | **Foe family restyle:** mischief rules (violet rim, white-sclera eyes, crown + aura for bosses), starting with the per-chapter boss | Foes appear in every battle | M per chapter |
| **P2-1** | VFX language (element impact shapes, hit-stop, damage-number style, MRT-door battle transition) | Polish that sells "premium" in motion | M |
| **P2-2** | Title screen and chapter cards (draw-on landmark line art) | First impression, chapter rhythm | S |
| **P2-3** | Ambient life and weather (pigeons, steam, lanterns, rain streaks, mist) | Liveliness | S–M |
| **P2-4** | Mocha side-trot sprite, Baokaka walk legs, NPC folk set | Animation quality | M |
| **P3** | Art lab route, Playwright visual and perf checks in CI, sprite lint tests | Keeps quality from regressing as content grows | S |

When the writer delivers `docs/story/story-bible.md`, I'll add per-location and per-foe specs (colour script confirmations, foe roster designs, boss set-pieces) as an appendix to this document.

---

## 13. Reference files (`docs/art/reference/`)

| File | What it proves | Render |
|---|---|---|
| `baokaka.svg` / `baokaka-crawl.svg` | Hero recipe (seated battle pose / crawling map pose): plum line, gradient-mapped materials, AO under chin, rim light, radial blush, toddler proportions, rig groups `bk-*` | `baokaka.png`, `baokaka-crawl.png` |
| `alan-magpie.svg`, `heitang-bear.svg` | 阿藍 (blue magpie, glasses, long raised tail) and 黑糖 (black bear; black-on-night rule: strong cool rim + glossy highlights) | `alan-magpie.png`, `heitang-bear.png`, `party-night.png` |
| `mocha-cat.svg` | Tabby markers, fat-stroke tail with dashed rings, bandana and tag, whiskers breaking the silhouette, rig groups `mc-*` | `mocha-cat.png` |
| `model-sheet.html` (pre-bible standing design; the rig and pose technique still applies) | Proportion guides, 5 poses driven **only by CSS transforms on rig groups** + expression swaps, 48px day/night/silhouette tests, per-instance id prefixing | `model-sheet.png` |
| `iso-tiles.svg` (generator: `docs/art/options/_gen/tiles.py`; `NIGHT=1` renders the midnight grade) | Tile materials (grass, brick, asphalt + zebra, water, planter block), edge light, light sweep, cast shadows, diorama skirt, Taipei 101 frustum stack, banyan, post boxes, lamp, pigeons, parallax sky, hero scale on the map | `iso-tiles.png` |
| `battle.html` | Stage v2 backdrop (象山 blue hour + 101), foe family look (珍珠大王 bubble-tea boss with violet rim, crown, aura), impact + damage number style, active-hero ring, command panel, bars | `battle.png` |
| `dialogue.html` | Dialogue v2 over the iso map: portrait crop of the live sprite, listener portrait, name pill, ghosted typing, key-term highlight, AppBar plate | `dialogue.png` |
| `color-script.html` | The 10 location colour scripts as mini skies + swatches | `color-script.png` |

Note: `iso-tiles.svg` and `dialogue.html` load `baokaka.svg` and `mocha-cat.svg` relatively. Open them from this folder (an `<img>` tag blocks nested images, so `dialogue.html` uses `<object>`).
