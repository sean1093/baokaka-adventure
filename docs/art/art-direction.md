# 寶咖咖抓周大冒險 — Art Direction (single source of truth)

**Status:** Approved direction: **Option D 動漫 Anime Cel** (owner decision, 2026-10-18), with three borrowed elements: B's 布袋戲 stage frame for boss fights, C's neon only where the story is literally neon (西門町, 士林夜市, 月亮線 cars), and A's technical rules.
**Story source:** `docs/story/story-bible.md` (the bible wins on content; this file wins on look).
**Canonical reference art:** `docs/art/options/d-anime/`. Older drafts are in `docs/art/archive/` (superseded).

| Look at first | File |
|---|---|
| Character design sheets (format benchmark) | `options/d-anime/sheet-baokaka.png`, `options/d-anime/sheet-mocha.png` |
| Anatomy and pose sheet (skeleton overlays, silhouette and 60px checks) | `options/d-anime/anatomy-sheet.png` |
| Cast sheet: 阿藍, 黑糖, 咻咻 ×4 forms, recurring NPCs | `options/d-anime/cast-sheet.png` |
| Overview: characters, iso patch, battle, dialogue | `options/d-anime/overview.png` |
| The four options compared | `options/comparison.png` |

---

## 0. TL;DR for engineers

1. **Look:** modern TV-anime cel art.
   - Hard-edged 2–3-tone shading.
   - Two-pass line art: a thick dark-warm contour (3.2u) under thin interior lines tinted from each material (1.0–1.2u).
   - Big layered glossy eyes, clumped hair with an angel-ring highlight.
   - Backgrounds in the anime-film manner (Shinkai/Ghibli): luminous night skies, bloom, wet-ground reflections.
2. **Anatomy first:** every character is built from a joint skeleton and tapered limb volumes, then clothing, then cel, then lines. The geometry helpers already exist (`limb()`, `blob()`, `hand()`, `footie()`, the `Fig` two-pass renderer in `options/_gen/anime2.py`). Port them to `src/art/geom.ts` and author sprites as joint data.
3. **One night, 00:00 → 05:30:** every location has a fixed clock time and a colour script. The sky walks deep navy → indigo → violet → gold, and city lights stay warm all night.
4. **Three levels of detail** per character: portrait (~300px), battle (~160–190px), map (~60px, a simplified variant).
5. **Performance:** characters use no filters. Blur, bloom and soft clouds are allowed only on static background layers that are rasterised once.

---

## 1. Pillars

1. **Anime polish, toddler warmth.** The finish of a Kyoto Animation or Ghibli production, scaled to a chibi-leaning toddler and a cat. The anatomy must be believable: owner feedback rejected blob bodies and stick limbs.
2. **Cozy-magic midnight Taipei.** Night is safe and glowing, never spooky. Every scene has warm light sources: lamps, windows, lanterns, neon, the moon.
3. **Recognisable and loving.** Real landmarks and street details (red-brick sidewalks, post boxes, the checkered Main Station floor, 紅樓, 101's eight sections, 淡江大橋), simplified, never a photo copy, no real brands.
4. **Readable from the sofa.** Big faces, thick contours, 21px dialogue, 70px buttons, ≥7:1 text contrast, and shape plus colour for status.
5. **One recipe.** Every new sprite follows the same construction, shading and line rules, so 40+ foes look like one production.

**References** (described in words; nothing is traced):
- **Character construction:** *Yotsuba&!* (Yotsuba), *Spy×Family* (Anya), *My Neighbor Totoro* (Mei), *Bunny Drop* (Rin), *Barakamon* (Naru).
- **Cats:** Jiji, Moon (*Whisper of the Heart*), *Chi's Sweet Home*, Nyanko-sensei's cat form.
- **Night backgrounds:** *Your Name* and *Weathering With You* (a weather-spirit story in a big city, close to our theme).
- **Sheet format:** Japanese 設定資料 / キャラクターデザインシート on parchment, with an outfit breakdown, an expression set, material close-ups and props (owner reference images).

---

## 2. Style specification (D)

### 2.1 Construction (mandatory for every character)

The order is gesture line → skeleton → volumes → clothing → cel → lines.

1. **Gesture line:** one curve through head, spine and weight-bearing limb. Decide the pose's weight first: on the bottom when seated, on palms and knees when crawling, on paws.
2. **Skeleton:** head centre, neck, shoulder girdle (two points, sloping for a toddler), spine, pelvis (two hip points), elbows, wrists, knees, ankles. For cats: shoulder blades, elbows, wrists, hip, knee, **hock** (the backward "heel"), paw.
3. **Volumes:** limbs are tapered capsules along the joints, with radii per joint (`limb(points, radii)`). Torsos and heads are closed smooth shapes (`blob(points)`). Toddler limbs are chubby but **jointed**: the radius dips at the elbow, wrist, knee and ankle, and bulges at the calf and forearm.
4. **Clothing:** drapes over the volumes. Put fold marks (`crease()`, tapered) where joints bend: inner elbow, behind the knee, the belly line, shoulder slope, wrist cuffs.
5. **Validate:** render the skeleton overlay, the silhouette and the 60px view for every new pose (as in `anatomy-sheet.png`).

### 2.2 Proportions

| Character | Heads tall | Notes |
|---|---|---|
| 寶咖咖 | **3.4** (a real 1-year-old is ~4) | Big cranium; eyes below the head's midline; short neck; sloping shoulders; round belly; arms reach the hips; legs ≈ 1 head; hands ≈ 0.3 head long with short fat fingers |
| 摩卡貓 | sit ≈ 2.1, walk length ≈ 2.6 heads | The chibi-leaning head is ~0.8 of the body width; real cat skeleton (see 2.6) |
| 阿藍 | ≈ 2 (body), tail 1.5× body | Head 45% of body height; bird legs short |
| 黑糖 | ≈ 2.6, 3× Baokaka's height | Heavy, pear-shaped, short legs, big paws |
| 咻咻 | 1 (it *is* a head) | Pillow-sized cloud; wisps for arms |
| Adult NPCs | 4–5 | Lighter chibi; simpler eyes (see 5.6) |

### 2.3 Line art (two-pass)

- **Pass 1, contour:** every part's shape filled and stroked in `SIL #5A2C34` at **3.2u** (on a 200u canvas), drawn below all fills. Only the outer half shows, so silhouettes read thick and overlaps read thin.
- **Pass 2, fills:** each part is drawn with a **1.0–1.2u** stroke in that material's line tint (e.g. skin `#C9786A`, pajama `#B06A28`, fur `#6E3A22`). Interior details use **tapered** fills (pointed ends), never uniform strokes: folds, finger splits, stripes, lashes.
- **Depth groups:** flush the two passes per depth group (far limbs → body → near limbs → head), so near-limb contours sit on top of the body.
- **Never** black lines; never a single uniform brown for everything.

### 2.4 Cel shading

- **Automatic form shadow:** clip to the part, fill with the cel-shade colour, then redraw the part's base colour shifted **up-left** by (dx, dy). A hard-edged shadow band remains on the lower-right, following the actual volume. Use dx/dy ≈ 25–35% of the part's radius (torso 4/3.4u, limbs 2/1.8u, fingers 1.3/1.1u).
- **Third tone (occlusion):** a manual `deep` shape where forms meet: under the chin, under the collar, the inner thigh, under the haunch.
- **Highlights:** hair gets an angel ring (a band following the skull with a jagged lower edge, plus 3 bright streaks). Cloth gets one light sheen stroke on the lit side. Skin gets a warm rim (`#FFF6EE`) on the lit cheek. All characters get a cool rim (`#CFEAFF`) on the back-right edge.
- **Light:** key from the upper-left. At night, characters also receive the **local light colour** as a rim: lamp `#FFC890`, neon pink or cyan in 西門町/士林, moon `#CFEAFF` (see 4.1).

### 2.5 Faces

- **Eyes (people):** sclera, a gradient iris (dark top → mid → warm bottom) with a darker ring, 6 fine iris rays, an eyelid shadow crescent, the pupil, a lower reflected-light arc, a big upper speculars plus a small lower one, and a tapered upper lash thicker at the outer corner with a flick. Lower lid: a short thin line.
- **Eyes (cats):** an almond shape, a green-gold gradient iris, a slit pupil (round when surprised), the same speculars and reflected light.
- **Blush:** a radial gradient plus 3 hatch strokes. **Mouths:** small; open mouths show a tongue tint.
- **Expression system:** heads are functions with `expr`. Swap eyes, brows and mouth groups, never whole heads. Baokaka has 開心 / 大笑 / 淚汪汪 / 驚訝 (plus 害羞, 睏 later). Mocha has 平常 / 得意 / 開心 / 驚訝.

### 2.6 Hands, feet, paws

- **Toddler hand:** **one clean contour** with a chubby palm, 4 short fat fingers and a thumb. Finger splits are short tapered creases (`hand()` poses: `open`, `flat` (crawl, palm down), `grab` (holding a block), `fist`).
- **Footie feet:** a rounded heel, the instep rising to the ankle, a flat sole with a cream grip strip, a toe cap with a big-toe bump. In sole view, a cream sole with orange grip dots.
- **Cat:** straight front legs with a visible wrist; round paws with 3 toe splits. Sitting: the hind thigh is a big mass behind, with the hind paw tucked in front beside the front paws. Walking: digitigrade, with the hock folding backwards and diagonal legs in sync. The tail grows out of the end of the spine. Pink toe beans show in sole views.

### 2.7 Backgrounds (anime-film night)

- **Sky:** a 4–5-stop gradient (top navy → mid → city-glow horizon). Stars are dots plus 3–4 cross sparkles with a soft halo. There's a faint milky band. The moon has a radial bloom.
- **Clouds:** dark bodies with a lighter inner lobe (moonlit), a **lit underside rim** in city-glow pink and a bright upper edge. Vary each silhouette (mirror and stretch); never repeat one shape. Softened with a 0.9u blur.
- **City:** two layers of skyline with lit windows (warm plus a few cool) and blurred bokeh dots along the horizon, over a blurred city-glow band.
- **Ground:** night-painted tile materials, wet-ground reflections (soft vertical streaks under lamps, neon and 101), puddle and pond moon reflections.
- **Light sources:** each has a bloom (radial gradient) plus an optional soft cone. Windows are warm. Neon only where allowed (4.3).
- **Depth:** atmospheric haze toward the horizon; foreground bokeh at the screen corners; a vignette in battle.

---

## 3. Colour system

### 3.1 Master tokens (all in `src/art/palette.ts`; UI tokens mirrored in `tailwind.config.js`)

**Line and neutrals:** `sil #5A2C34` · `ink #2E2235` (UI text on light) · `inkOnDark #F4F2FF` · `mutedOnDark #BFC2EA` · `parchment #F3E6CC` · `contactShadow #1E1430`

**Characters** (base / cel / deep / line):
| Material | Base | Cel | Deep | Line |
|---|---|---|---|---|
| skin | `#FFE7D6` | `#F6C0AA` | `#E89E8C` | `#C9786A` |
| hair (Baokaka) | `#6A4234` | `#46281F` | `#2E1913` | `#2A1612` · angel ring `#8E5A46` / `#F0C4AC` |
| pajama | `#FFD86A` | `#EFA846` | `#D6863A` | `#B06A28` · far limbs `#F4C458` |
| cream (collar, soles) | `#FFF6E6` | `#EBD3B4` | `#D6B48E` | `#A8825E` |
| bear patch | `#B98058` | `#93603E` | `#744628` | `#5A3420` |
| red string | `#E5483E` | `#9E2A2A` | — | — |
| gold (lock, tag) | `#FFD66A` | `#E0A83A` | `#B8822A` | `#8A5E1E` |
| tabby fur | `#D7975E` | `#AE6C3E` | `#8A5232` | `#6E3A22` · stripes `#7A4628` |
| fur cream | `#FFF5E8` | `#EAD2B8` | `#D6B898` | `#A8866A` |
| bandana | `#4A8BDA` | `#2F62B0` | `#234A8A` | `#1E3E78` |
| eyes | brown iris `#2E1A12→#7A4628→#D99A56` / cat `#2E4A12→#86AE2A→#ECEC72` | | | |

**World (night-painted):** grass `#2E5A58`/`#2A5452` · brick `#6E3A4E`/`#683648` · asphalt `#2A2E58` · water `#24407E` · glass `#3E5A9A→#2A3E78` (lit side) / `#1C2858→#141C44` · lit window `#FFD98A`/`#FFE9C0`/`#9AE0FF` · lamp bloom `#FFE6B0→#FFC27A→0` · 101 rim `#8AF0E0` · city glow `#E88E8A` / `#FF9A7A`

**UI (anime-JRPG):** `panel rgba(22,26,78,.96)→rgba(10,11,34,.99)` · `gold #E8C77A` · `goldLight #FFE9B0` · `goldDeep #C9A04A` · primary button `#FFEFC0→#F0C060→#D89A3A` with text `#1A1440` · HP `#3FC88A→#9AF0B8` · HP low `#F08A3A→#FFC27A` · HP critical `#FF5A8A→#FF9AB8` · MP `#4A8AF0→#9AC8FF` · damage text `#FFFFFF` with a `#C2185B` stroke

### 3.2 The night clock (sky script by time)

The sky gradient is defined by the clock time on the chapter card. It interpolates between these keys:

| Time | Sky top | Mid | Horizon | Moon / sun | Grade on env (pre-baked) | Character rim |
|---|---|---|---|---|---|---|
| 00:00 | `#0A1034` | `#1A2A6A` | `#3A3A86` | moon high, white | ×(0.55, 0.57, 0.72) | moon `#CFEAFF` |
| 01:00 | `#0B1238` | `#1E2E70` | `#4A4A96` | moon high | same | moon |
| 02:00 | `#0C1440` | `#26307A` | `#6A5AA4` | moon mid | ×(0.58, 0.58, 0.74) | moon / local |
| 03:00 | `#101848` | `#2E3684` | `#8A6AB0` (city-glow pink rises) | moon low | ×(0.6, 0.6, 0.75) | local |
| 04:00 | `#16205A` | `#3A3F92` | `#A878B8` | moon setting | ×(0.64, 0.63, 0.78) | local |
| 04:30 | `#1E2A66` | `#4A4A9E` | `#C88AB8` | — | ×(0.7, 0.68, 0.8) | violet `#D8C8FF` |
| 05:00 | `#2A3274` | `#6A5AA8` | `#E8A0A8` | first dawn glow | ×(0.78, 0.74, 0.84) | violet |
| 05:15 | `#3A3A80` | `#8A6AAE` | `#F4B49A` | — | ×(0.86, 0.8, 0.86) | dawn `#FFD0B0` |
| 05:29 | `#4A5AA0` | `#E8A0A0` | `#FFD27A` | **sun breaks** (gold) | none | gold `#FFE09A` |
| 10:00 (party) | daytime interior | — | — | sunlit window | none (day palette) | warm |

**Chapter clock** (from the bible): Ch1 00:00 · Ch2 00:40 · Ch3 01:10 · Ch4 01:35 · Ch5 02:00 · Ch6 02:25 · Ch7 02:50 · Ch8 03:15 · Ch9 03:40 · Ch10 04:05 · Ch11 04:25 · Ch12 04:45 · Ch13 05:00 · Ch14 05:10–05:29 · ending 05:30 / 10:00 · post-game sunrise. Sub-maps and MRT rides use their chapter's time. Interpolate the keys above for in-between minutes (e.g. Ch7 02:50 ≈ the 03:00 row; Ch12 04:45 sits between 04:30 and 05:00, plus fog).

The **grade** is a per-channel multiplier baked into each tile and prop colour token at build time (`gradeTokens(time)`). It is not a runtime CSS filter or blend layer on the map. Characters get **half** the grade, so they always pop.

### 3.3 Contrast rules

- Dialogue and body text: ≥7:1 (white `#F4F2FF` on panel navy ≈ 14:1). Muted text ≥4.5:1 (`#BFC2EA` on the panel).
- Text over art always sits on a panel or glass plate.
- Status uses shape plus colour: HP <40% turns orange **and** the number recolours; <20% adds a pulse **and** a ❗ icon (SVG).
- Heroes must pass the 48px silhouette test and keep ≥3:1 luminance contrast against every floor material at that location's grade. The rim light and contour guarantee the edge.

---

## 4. Locations: per-chapter specs

### 4.1 Generic recipe (use this to spec any new location)

For each location, fill in these fields:

1. **Clock time:** this sets the sky via 3.2, the environment grade and the character rim.
2. **Key light sources:** 2–4 named warm or cool sources (street lamps, windows, lanterns, neon, screens). Each gets a bloom, a ground pool and a wet reflection.
3. **Signature set-piece:** one landmark as a multi-tile iso prop (anchor at its front-most tile), plus 3–6 supporting props.
4. **Tile materials:** 3–5 from the material list (4.4), each in its night-painted values.
5. **Battle backdrop:** sky (by time) → far silhouette (landmark) → mid layer (architecture) → **foreground framers** left and right → perspective floor with a reflection streak → light pool → bokeh → vignette.
6. **Ambient FX:** at most 6 animated elements (CSS transform/opacity loops).
7. **Neon allowed?** Only 西門町, 士林夜市 and 月亮線 cars.
8. **Accuracy notes:** no real brands or liveries; keep sensitive sites generic.

All 14 chapters, their sub-maps, the MRT cars, the 月亮公車 and the post-game are specced in 4.2. Use this recipe for anything added later.

### 4.2 Location table (every map in the bible, chapters numbered as in the bible)

| Ch · time | Location (map) | Sky / light | Iso set-pieces & props | Tile materials | Battle backdrop composition | Ambient FX | Notes |
|---|---|---|---|---|---|---|---|
| 1 · 00:00 | **家** `home` (living room) | Moonlight through the big window (a cool shaft on the floor), a warm TV-standby glow, a night-light by the crib | The **抓周盤** on the low table (faint gold glow), sofa with 爸爸, crib, shoe rack (藍白拖), wall calendar with a red circle, front door | wood floor, rug, play mat | Living room at night: window with city lights and moon, the tray glowing, a sofa silhouette as a foreground framer | Curtain sway, the tray's twinkle, 咻咻's swirl at the window (cutscene) | Interior; sky only through the window |
| 1 · 00:15 | **大安森林公園** `daan` | Navy sky, moon high; warm park lamps | **露天音樂台** (white band-shell, boss stage), 生態池 with reeds and a night-heron post, 溜滑梯 playground, jogging loop, the sunken MRT plaza, banyan clusters, convenience-store edge | grass, path gravel, pond water, red-brick sidewalk | Band-shell lit from below, banyan silhouettes framing, wet path reflecting lamps, 101 tiny on the horizon | Spinning leaf whirls, pond ripples, fireflies | Proven in `options/d-anime/iso.png` |
| 2 · 00:40 | **台灣大學** `ntu` | Navy; lamp-lit **椰林大道** | Palm avenue, **傅鐘** on its pillar, **總圖書館** (brick, arched windows, steps), **文學院** ledge, **醉月湖** with **湖心亭** and bridge, bike racks, toppled bike pile, azalea hedges, 正門 | brick paving, lawn, lake water, asphalt | Library façade with lit windows, palms as framers, the lake reflecting the pavilion | Azalea petals drifting, lake shimmer | Generic university signage |
| 2 · sub | **總圖閱覽室** `ntuLibrary` (12×10) | Interior: green-shaded reading lamps (warm pools), moon through tall arched windows | Long reading tables with lamps, tall shelves, 3 book piles to re-shelve, 安靜精 (a hush-sprite), back door to the lake | parquet, carpet runner | (no battles) | Lamp glow pulse, dust motes in moonbeams | Quiet: the palette is desaturated warm brown and green |
| 3 · 01:10 | **台北車站** `station` | Interior: a cool fluorescent wash plus warm shop light | **Black-and-white checkered hall floor** (the identity), departure board (amber dot-matrix glow), 服務台, the 閘門 turnstile row, a 便當 stand, a 「施工中」 barrier | checkered marble, shutter metal | Great hall with ceiling lights in perspective, the departure board glowing, turnstiles as foreground | The departure board flickers, spirit-folk sit on the floor | Generic station signage only |
| 3 · sub | **地下街** `underground` (20×14) | Low ceilings, cool tubes, **3 lit shop signs** (warm) as the guiding light, everything else shuttered | Corridors of shuttered shops, confusing direction signs, dead-end chests, the **指標大王** dead end | underground tile, shutter metal | Low corridor in perspective, a wall of arrows behind 指標大王, shutters as framers | Sign flicker, a slow ventilation-fan shadow | The "follow the lit signs" puzzle needs a strong warm-vs-cold contrast |
| — | **月亮線 cars** `carRed/Blue/Green/Orange/Brown` | Car interior: cool white plus the line-colour stripe; windows stream stars | Silver poles, hand-straps, 博愛座, a **路線圖 display**, moon-shaped windows, doors with a station sign. The brown car has a **full front window** | car floor (grey rubber with a yellow edge), seats in the line colour | Side view inside a car: poles as framers, a starfield streaming past, the line-colour stripe | Starfield parallax, hand-straps swaying, door-chime light pulse | **Neon allowed** (subtle line-colour strip). Red `#E3002C`, blue `#0070BD`, green `#008659`, orange `#F8B61C`, brown `#C48C31` |
| — | **路線圖** travel screen | — | A stylised 5-line network, gold station dots, a blinking "you are here" ring, grey locked dots with "?" | — | — | New-station 「叮！」 light-up | See 7.7 |
| — | **月亮公車** (bus scene, 北投 → 陽明山) | Cool interior, warm reading lights; mist and city lights sliding past the windows | Bus seats, hanging straps, a fare box that accepts the 月亮票 (「嗶」), a destination sign 「陽明山」 | bus floor | (no battles) | Window fog, a winding-road sway | Generic bus, no operator branding |
| 4 · 01:35 | **西門町** `ximen` | Indigo; **neon** pink and cyan dominate; warm shop windows | **西門紅樓** (octagonal red-brick hall with cross wing; boss stage), painted pedestrian zone, **6號出口**, Movie Street billboards (generic art), claw-machine booth, scooter row, 麵線 stall | painted pedestrian paving, red brick, asphalt | 紅樓 lit by floodlights, neon signs as framers, wet street reflecting neon streaks | Neon flicker (≤1 element at a time, slow), dancers' sparkle | Neon on; character rim = local pink/cyan |
| 5 · 02:00 | **龍山寺・艋舺公園・青草巷** `longshan` | Indigo; **red lanterns** dominate, warm temple floodlight, incense haze catching light | 艋舺公園 plaza (benches, sleeping pigeons, MRT exit), **龍山寺 front** (gate, lantern rows, sweeping swallowtail roof with 剪黏 porcelain dragons and jade-green ridges), 玉蘭花 sellers, **青草巷** herb-stall alley, old eaves, 阿花's roof | granite paving, red temple tiles, park lawn, alley stone | Temple roofline with dragons against the night sky, lantern strings as framers, incense haze, warm floor pool (**battles only in the park lawns and alley**) | Lantern sway, incense ribbons, pigeons' head bobs | **Respect:** no deities depicted, no fighting on temple ground. The 擲筊 moon blocks are red crescents |
| 5 · sub | **剝皮寮** `bopiliao` (18×12) | Indigo; dim warm lamps under arcades | **Red-brick arcades**, old shop signs (generic), wooden shutters, a rooftop at the end with **咕咕's glittering nest** | old red brick, arcade tile, rooftop tiles | Brick arcade in perspective, the rooftop nest catching moonlight, glittering junk (bottle caps, foil) | Shiny-junk twinkles, feathers drifting | Historic street; keep signage invented |
| 6 · 02:25 | **大稻埕・迪化街** `dadaocheng` | Indigo; warm lantern and shopfront light | **牌樓 façades** (baroque pediments in rows), 南北貨 baskets, 中藥行 百子櫃 wall, 茶行 tins, 布行 bolts, **霞海城隍廟** front (lanterns; no deity shown), **大稻埕碼頭** wharf with river | old red brick, stone slabs, wharf planks, river water | A street of 牌樓 façades in perspective, lanterns strung across, the river and wharf lights at the end | Lantern sway, fabric fluttering, river shimmer | Calm, historic; no neon |
| 6 · sub | **永樂市場 布市** `yongle` (18×12) | Interior: bare bulbs on cords (warm), deep shadows between stalls | A **fabric maze**: walls of hanging 花布 bolts (peony red, indigo, gingham, pastel florals), cutting tables, rulers, 3 hidden bolts to find | market concrete, cloth-covered tables | Hanging fabric curtains as layered framers, a bulb-lit cutting table | Bulbs swinging gently, fabric rippling | Pattern-heavy: keep patterns at low contrast behind characters |
| 7 · 02:50 | **士林夜市** `shilin` | Indigo with city-glow pink; **stall lights plus neon** | Night-market gate arch, stall rows (striped awnings, glowing interiors), signs 雞排/珍奶/臭豆腐/大腸包小腸/蚵仔煎, game area (balloons, goldfish, 彈珠台), **劍潭站** boat-shaped roof, massage chairs | wet asphalt, stall tile, steel grates | Proven in `options/d-anime/battle.png`: stall row with bloom, lantern string, signs, steam, reflections | Steam plumes, lantern sway, sign twinkle | Neon on |
| 7 · sub | **地下美食區** `foodcourt` (18×12) | Interior: warm fluorescent plus steam glow from kitchens | Rows of counters, plastic stools, steamer stacks (蒸籠媽媽), the boss kitchen at the back | food-court tile, kitchen steel | Kitchen pass-through with fryers glowing orange, steamers as framers | Steam columns, a fryer shimmer | The escort 小籠包 is a tiny dumpling NPC with a face |
| 8 · 03:15 | **松山機場** `airport` | Indigo; **blue runway edge lights**, green threshold lights, the warm terminal, the tower cab glow | Terminal front with MRT entrance, apron with 3 generic white planes (blue stripe, unbranded), **control tower**, runway strip, **windsock** on a pole (boss), 飛機巷 grass verge | apron concrete with painted lines, runway asphalt, grass verge | Runway in perspective with converging blue lights, a sleeping plane silhouette, the tower as framer, the windsock against the sky | Runway lights pulse in sequence, windsock flutter, a slow beacon | **Civilian and generic only**: no military, no real liveries |
| 8 · sub | **航廈頂樓觀景台** `terminalDeck` (12×8, optional) | Open sky (indigo), the runway lights spread below | Railing, coin binoculars, benches, a plane-spotter's notebook (阿藍's note 3) | deck boards, railing | (no battles) | Runway-light sequence below, a distant beacon | A quiet look-out composition |
| 9 · 03:40 | **動物園** `zoo` | Moon setting; warm path lamps | Entrance plaza and sign, 台灣動物區 rocks and trees, **empty black-bear enclosure** with a 黑糖 plaque, macaque rock, pangolin burrow, signposts, **纜車動物園站** with a docked gondola, bamboo | path paving, soil, rock, bamboo grove floor | Gondola station with a lit cabin, bamboo framers, rocky habitat silhouette | Bamboo sway, gondola cable glint | — |
| 9 · 03:55 | **貓空** `maokong` | Violet-indigo; tea-house lanterns; **the city sea of lights below**; 101 wrapped in a swirling cloud | Terraced tea rows, **茶館** veranda with lanterns (boss), 纜車貓空站, view platform with the **storm around 101** (big backdrop decor), stone path | tea-terrace soil and bushes, stone path, wooden deck | Tea terraces stepping down, lantern-lit veranda, the glowing basin below, 101 in a spiral of cloud | Mist bands, lantern sway, the storm swirl rotating slowly | The "first sight of the storm" set-piece |
| 10 · 04:05 | **碧潭** `bitan` | Violet; still lake **mirroring** the bridge lights and moon; cliff face (和美山) dark against the sky | **碧潭吊橋** (long white suspension bridge with cable catenaries, walkable, sways), riverside steps and promenade, boat dock with a fleet of sleeping **swan boats**, a pavilion under the bridge, a **floating platform** mid-lake with the glowing 「1」 birthday candle (the "lighthouse"), 新店站 exit | promenade stone, wooden dock, lake water (mirror-calm, strong reflections) | Lake at night: the bridge arc across the top as a framer, swan boats in silhouette, the candle's warm glow on the water, perfect reflections | Bridge sway, candle flicker and ripple rings, a slow reflection shimmer | The calmest, most mirror-like scene: reflections are the identity |
| 11 · 04:25 | **北投溫泉** `beitou` | Violet; steam catches lamp light; light rain optional | **新北投站** (old wooden station), steaming creek, **北投溫泉博物館**, **北投圖書館** (green timber, planted roof), public footbath, **地熱谷** jade pond behind a railing (boss), the **月亮公車** stop | wet stone, wooden deck, jade spring water, creek water | 地熱谷: jade pool glowing, steam columns lit warm, railing framers, the library silhouette | Steam rising (3 blobs), optional rain streaks, ripple rings | Steam is the identity |
| 12 · 04:45 | **陽明山・竹子湖・小油坑** `yangming` | Pre-dawn violet in **dense cold fog** (low contrast, desaturated); warm farmhouse window; sulphur vents glowing faintly yellow | Bus stop (arrival), **竹子湖 terraced calla-lily fields** (white lilies that *glow* softly), a farmhouse (inn) with a 「自己採」 sign, **小油坑** steaming yellow rocks and vents (the calf hides here), the misty path to 擎天崗 | wet terrace mud, lily-field water, yellow sulphur rock, stone path | Calla fields glowing white in the fog, steaming vents as framers, the farmhouse light | Rolling fog bands (2–3 layers), vent steam, lily glow pulse | Fog lowers contrast, so lean on rim light and glowing lilies for readability |
| 12 · sub | **擎天崗** `qingtiangang` (18×14) | Fog thinning to violet; the first faint dawn line on the far horizon | Rolling grassland, **silver 芒草**, cattle silhouettes, a stone trail, a wooden marker on a small knoll (黑糖's climb), the summit meadow (boss) | grass, silver pampas, stone trail | Open grass under a wide sky, a buffalo silhouette in fog, pampas as foreground framers, a distant sea glint (咻咻 seen far off) | Pampas waving, fog drifting, a calf bell | Gentle and pastoral; 阿哞 must look sleepy and kind |
| 13 · 05:00 | **淡水** `tamsui` (3 zones) | Violet → first dawn on the horizon; harbour lights | Zone 1: 淡水站, 老街 (阿給/魚丸/鐵蛋 shops), **紅毛城** on a hill. Zone 2: 河岸步道, banyans, 渡船頭. Zone 3: 漁人碼頭 boardwalk, fishing boats, **情人橋** (white sail bridge; boss), seawall. **Backdrop: 淡江大橋** (one tall pylon on the 八里 side, cable fans, a long curving deck) with 觀音山 behind | old-street stone, boardwalk planks, river water, seawall concrete | River mouth at dawn-violet, 淡江大橋's pylon and cables backlit, 情人橋 as a near framer, gold glints on the water | A small grey swirl circling the pylon (until `metShushu`), sun glitter, gulls | Bridge non-walkable; no light-rail train drawn on it |
| 14 · 05:10 | **信義廣場** `xinyi` (18×12) | Dawn-blue; 101 towering overhead with ledge lights; plaza lamps | The plaza at the foot of 101: paving grid, planters, an art-installation silhouette (generic), the elevator-lobby doors, wind streaks | plaza granite, planters | Looking up at 101 from its foot (extreme perspective), storm cloud wrapped around the top, wind debris | Wind streaks, flipped umbrellas tumbling | The chapter card plays here; gate fight 旋風小子 ×3 |
| 14 · 05:15 | **台北101 89F** `tower` | Interior; dawn-blue city through floor-to-ceiling glass | The golden **阻尼器** sphere in its pit behind a railing (mini-boss), souvenir shop, store counter, elevator doors, stairs to 91F, coin telescopes, flipped umbrellas and balloons against the glass | polished stone floor, carpet, glass | The damper ball glowing gold, window walls with the dawn city, railing framers | City lights below twinkle, the damper sways | — |
| 14 · 05:20→05:29 | **101 91F 戶外** `summit` | Violet → **gold sunrise** at the end | Open deck with high railings, wind streaks, the spire behind, **咻咻's sad party** (crooked 生日快樂 banner, flipped umbrellas, 雞排-bag hat, popped balloons, one candle) | deck grating, railing steel | **Boss frame: 布袋戲 proscenium**; sky filling the stage, storm spiral behind the railing | Wind streaks, the candle flickering out, the sunrise light sweep | The game's emotional peak; the 小白機 waggles its wings past 101 at first light |
| End · 05:30 | **家** at dawn | First blue-gold light through the window | Tray complete, Mocha asleep on it | (home) | — | Dust motes in the sun shaft | — |
| End · 10:00 | **度晬 party** | Bright day interior | 紅龜粿, 油飯, 紅蛋, birthday decorations, the family | (home) | — | Candle smoke curling into a tiny swirl (咻咻 cameo) | The only fully daytime scene |
| Post | **象山 sunrise** `xiangshan` | Gold sunrise; 101 framed | Stone stairs, the **六巨石** boulders, photo platform with 101, 阿嬤 doing morning exercises, lounging former bosses | stone steps, rock, grass | Boulders as framers, 101 against the gold sun, sun rays | Sun rays, birds, 咻咻 (bonus form) bobbing | — |
| Post | **老朋友擂台** (boss rush, 101 summit at night) | Night (00:00 script) with stage spotlights | The summit deck dressed as a stage; 卡拉OK大王 as MC | deck grating | 布袋戲 frame plus spotlight cones | Spotlight sweep, confetti | Reuses summit art |

### 4.3 Neon policy

- Neon (bright pink, cyan or violet tubes with bloom) is allowed only in **西門町**, **士林夜市** and the **月亮線 cars** (the line-colour strip).
- Elsewhere, light is warm lamps, windows, lanterns or moonlight. Neon light also tints the character rim in those maps.

### 4.4 Tile material list (night-painted, iso 72×36)

grass · path gravel · red-brick sidewalk (running bond plus a grey accent paver) · asphalt (wet; lane paint) · zebra crossing · pond and river water (ripples plus moon reflection) · checkered marble (台北車站) · underground tile · wood floor · tatami-ish play mat · old red brick and stone slab (大稻埕) · wharf planks and boardwalk · stall tile and steel grate · apron concrete with painted lines · runway asphalt with edge-light props · tea-terrace soil · wet stone and wooden deck (北投) · jade spring water · seawall concrete · polished stone and carpet (101 interior) · deck grating (91F) · granite (象山 stairs)

**Tile rules:**
- Base and alt colour picked by a hash (no checkerboards except the station floor, which *is* a checkerboard).
- A 1px lit top-left edge.
- 2–6 seeded material marks per tile.
- Material transitions get a lit kerb or rim.
- Map edges show the diorama skirt.
- The whole ground is **one memoised SVG per map**.

---

## 5. Characters

Design sheets in the owner's reference format exist for **寶咖咖** and **摩卡貓** (`sheet-baokaka.png`, `sheet-mocha.png`). **阿藍, 黑糖, 咻咻 (4 forms) and the recurring NPCs** have D-style front views and expressions on `cast-sheet.png` (sources in `options/d-anime/cast/`). Produce the same format for every character below before it goes into the game: front view, a 4-expression set, an outfit or accessory breakdown, material swatches and props, annotated in Chinese on parchment.

### 5.1 寶咖咖 (hero)

- 1 year old (tomorrow), **3.4 heads**.
- **Outfit:** butter-yellow **star-print footie pajamas** (fleece, front snap placket, cream ribbed collar and cuffs, grip-dot soles), a **bear patch** on the chest, a **red string bracelet** with a gold bead on the right wrist. **口水巾** (bib) is equipment, shown in menus, not on the sprite.
- **金鎖片:** a story key item, worn only in the ending.
- **Poses:**
  - **crawl** (map): palms flat under the shoulders, thighs vertical under the hips, flat back, head lifted, one hand forward.
  - **sit** (battle idle): weight on the bottom, one leg extended, one knee up, holding up a toy block.
  - **first steps** (Ch14 finale only): wide stance, arms out for balance, knees soft.
- **Battle actions:**
  - 丟積木: arm wind-up, then a block arc FX.
  - 哇哇大哭: mouth open, sound rings.
  - 拍拍手: a clap with sparkles.
  - 勇敢的第一步: stands up, wobbles, charges.
- **Silhouette hooks:** the hair sprout (ahoge), the big round head, the footie feet.

### 5.2 摩卡貓 (hero)

- 7-year-old brown mackerel tabby (male): forehead **M**, cheek stripes, ringed tail, **white socks on all four feet**, cream bib fur.
- Wears an **MRT-blue polka-dot bandana** knotted on the left, with a **gold fish tag** at its point (silent, not a bell).
- **Poses:** sit (battle), walk (map), pounce (attack), loaf (KO), and a smug half-lidded "translating" face.
- **Tail acting:** up and curled = happy; puffed = surprised; low flick = annoyed.

### 5.3 阿藍 (藍教授, hero, joins Ch2)

- A **台灣藍鵲**: black hood (head and throat), cobalt body, pale blue belly, a **coral-red beak and legs**, a yellow eye ring, and a **very long tail** (1.5× body) with black-and-white tips, carried raised behind.
- **Props:** round gold reading glasses; a pencil stub tucked under the wing.
- **Anatomy:** a compact bird body, the wing folded with layered primaries (3 visible feather tips, white-tipped), short legs with 3 front toes and 1 back toe.
- **Expressions:** 自信 (glasses glint, chest out), 說教 (wing raised like a pointer), 慌張 (glasses askew, feathers puffed), 坦白「我不知道」 (soft eyes, wing over beak).
- **Battle:** hovers slightly. 羽毛雨: wing spread with blue feather FX. 鵲橋護盾: a bridge-arch shield.
- D-style art: `options/d-anime/cast/alan-{happy,laugh,teary}.svg`. A full design sheet in the 5.1 format is still to do.

### 5.4 黑糖 (hero, joins Ch9)

- A young **台灣黑熊**: glossy blue-black fur, a **cream V-moon** on the chest, a tan muzzle, small round ears, and a **red knitted scarf** (ribbing marks plus a fringe tail). 3× Baokaka's height.
- **Pose language:** shoulders hunched, paws held together at chest height, toes slightly in (shy). In battle: protective, arms spread in front of the party.
- **Expressions:** 害怕 (sweat drop, brows up, eyes wet), 歹勢 (sheepish, paw behind head), 勇敢 (brows set, moon glowing), 開心 (eyes closed, big smile).
- **Black-on-night rule:** a strong cool rim `#9CC8FF`, glossy sky-tinted highlights, and a lighter muzzle and moon, so he never disappears at 00:00.
- D-style art: `options/d-anime/cast/heitang-{scared,brave,laugh}.svg`.

### 5.5 咻咻 (antagonist → friend), four forms

D-style art: `options/d-anime/cast/shushu-{normal,storm,cry,bonus}.svg`.

| Form | Where | Shape | Colours | Key features |
|---|---|---|---|---|
| **咻咻** (normal) | cutscenes, Ch13 meeting, ending | A pillow-sized cloud swirl, round, with 2–3 wisp "arms"; a darker eye-hollow holding two huge glossy eyes | `#C8D4E8` body, `#8A9AC0` swirl lines, eye-hollow `#5A6A9A` | The **金鎖片** tangled in the swirl (a gold glint with a tiny bloom); teary speculars |
| **暴風咻咻** (final phase 1) | 101 91F | Fills the sky behind the railing: a spiral storm with a dark eye | `#3A4A7A→#1E2A4E`, lightning `#FFE27A` | Glaring watery eyes, cute zigzag lightning, debris (umbrellas, leaves) orbiting, the gold lock glinting in the eye. The **布袋戲 frame** goes around the battle |
| **哭哭咻咻** (final phase 2) | 101 91F | Smaller and softer; drooping wisps | `#9AB8E8` light blue, rain streaks `#CFEAFF` | Rain falling from the eyes, a flickering rainbow fragment, sniffle bubbles |
| **生日加碼・咻咻** (superboss) | 象山 post-game | Fluffy, cumulus-white, bouncy | `#FFFFFF` / `#E8EEFF`, confetti in all colours | A **雞排-bag party hat**, confetti swirl, a happy face |

### 5.6 Recurring NPCs

Adults use the lighter chibi (4–5 heads), simpler eyes (iris + one highlight) and ~70% saturation, so heroes pop. One shared template (`adult(cfg)` in `options/_gen/cast_d.py`) sets the skeleton, torso and limbs; each NPC is a config for hair, outfit, eyes and props. Art: `options/d-anime/cast/npc-*.svg`.

| NPC | Design |
|---|---|
| **阿伯 → 土地公** | Small and round. **White eyebrows that hide his eyes**, a white beard, a gnarled walking stick. The same face and stick every time; only the hat and outfit change per chapter (table below). Revealed as 土地公 in the post-credits: the same face in a gold-trimmed robe and official's hat, with a soft golden halo; the statue has stamp ink on one finger |
| **店員小哥** | Lanky young man, **green-and-orange striped vest** (unbranded), name badge, tired half-lidded eyes with a perfect smile, a scanner gun. Variants: a portable cart (貓空), delivery cap with a cake box (ending) |
| **廣播姊姊** | A soft, glowing translucent figure (light-blue to white gradient, bloom) in a **conductor's cap made of light**, holding a small microphone. Only appears in the MRT, the station and the ending |
| **迷路的背包客** | Tall foreign traveller, huge backpack, a big map held **upside down**, sun hat, hiking sandals. Friendly, confused. Ending: on the roof with the map the right way up |
| **媽媽** | Gentle, tired; long hair in a loose bun; pastel pajamas; asleep for most of the game (eyes closed, soft smile) |
| **爸爸** | Glasses, stubble, T-shirt and shorts, asleep on the sofa with the TV remote on his belly; in the ending, a crushed expression (comic despair lines) |
| **阿嬤** | Short perm, grey hair, floral blouse and cardigan, reading glasses on a chain, a hand fan. Snoring behind her door at night; at 05:30, awake, warm and twinkly |
| Chapter-local NPCs | 夜跑大哥, 池塘烏龜, 爆肝大學生, 清潔阿姨, 便當阿姨, 街舞少年, 麵線阿姨, 布行阿姨, 廟口阿姨, 南北貨老闆娘, 中藥行阿公, 撈金魚小妹, 雞排阿姨, 塔台 (talks from the tower base), 地勤姊姊 (light wands), 小白機 (sleepy plane face), 狐獴哨兵, 茶館老闆娘, 書蟲, 溫泉阿嬤, 街頭畫家, 阿給阿婆, 貓頭鷹奶奶. Light-chibi rules, one signature prop each |

**阿伯's disguises (×14):** 掃地阿伯 (straw hat, bamboo broom) · 校工阿伯 (cap, tool belt) · 站務阿伯 (station cap, vest) · 算命阿伯 (round sunglasses, a folding table with a lamp) · 擲筊阿伯 (temple-volunteer vest, red 筊 blocks) · 茶行阿伯 (apron, teacup) · 彈珠台阿伯 (visor, coin pouch) · 推車阿伯 (hi-vis vest, luggage cart) · 管理員阿伯 (zookeeper hat, bucket) · 租船阿伯 (life vest, oar) · 澡堂阿伯 (towel on his head, wooden pail) · 海芋田阿伯 (rain boots, a bunch of calla lilies) · 渡輪阿伯 (sailor cap, rope) · 清潔阿伯 (cleaner's cap, mop)

---

## 6. Foes and bosses

### 6.1 Family rules

- **Mischief objects and animals:** the object's real silhouette plus one exaggerated feature. Anime eyes have white sclera, a gradient iris (magenta-violet for "dizzy from the wind") and an angled brow; at most one fang; hatched blush.
- **Foe rim light:** violet `#D3A8FF`, plus a faint violet aura in battle. Bosses add a gold accent and an **aura bloom**.
- **Calmed state:** on defeat, swirl-eyes → a soft smile, then they hop away or give the item back (FX: dizzy stars, then a sparkle). Nothing dies.
- **Sizes:** regular foe 90–110px on the battle stage (up to 3); boss 170–220px; final 320px+.

### 6.2 Regular foes (34)

| # | Foe | Where | Silhouette | Palette | Key features / animation |
|---|---|---|---|---|---|
| 1 | 灰塵球 | home | Round fuzzball with a jagged fur edge | grey `#B8B4C4`/`#8A869A` | Dot eyes, one stray hair; rolls (rotate), squashes on guard |
| 2 | 落葉精 | daan | Pinwheel of three leaves around an acorn | green `#6AAE72`, gold `#E8B84A`, acorn `#9A6A48` | Smiling acorn face; constant spin |
| 3 | 暗光鳥 | daan, ntu | Hunched night heron, an egg-shaped body | grey `#8A90A8`, black cap, red eyes `#E5483E` | Two white head plumes, a coffee cup in one wing, cartoon stare (not scary) |
| 4 | 暴衝腳踏車 | ntu | Side-view campus bike, front wheel raised | rust red `#B8584A`, chrome | Handlebar eyes, bell mouth, a basket of textbooks; wheelie bounce |
| 5 | 杜鵑花精 | ntu | Five-petal blossom with leaf arms | pink `#F08CB4`, leaf `#5E9A52` | Rosy cheeks, pollen puff cloud on sneeze |
| 6 | 指標小鬼 | station, underground, ximen, bopiliao | Rectangular sign on stick legs | green `#2E8A5A`, white | Arrow arms pointing opposite ways, a grinning panel face |
| 7 | 滾滾行李箱 | station, airport | Hard-shell case, handle up like an antenna | teal `#3E8F88`, travel stickers | Wheel feet, the lid opens as a mouth (guard) |
| 8 | 霓虹招牌精 | ximen | Cat-face neon sign | neon pink `#FF5FA2` / cyan `#4FD1C5` | **Neon tube** rendering; one letter flickers |
| 9 | 夾娃娃爪 | ximen | Three-prong claw on a short cable | silver `#C8CCE0`, plush in its grip | Hopeful face on the hub; swings |
| 10 | 中藥抽屜怪 | dadaocheng | Cabinet of small drawers | wood `#9A6A48`, brass pulls | Drawers labelled 當歸/枸杞/紅棗 pop open as mouths; spectacles |
| 11 | 布匹蛇 | dadaocheng | Long S-curve of unrolled fabric | red peony 花布 `#D23B30` with pink/green print | Button eyes, a pinking-shear tongue |
| 12 | 珍珠粉圓 | shilin | Glossy sphere | black-plum `#2A1630` with white highlights, pink straw | A straw stub as its "hat"; bounce squash; groups of 3 (proven in the battle mock) |
| 13 | 臭豆腐精 | shilin | Golden cube | fried gold `#E8B04A`, cabbage `#B8D88A` | Pickled-cabbage hair, wavy green stink lines |
| 14 | 大腸包小腸 | shilin | A bun hugging a small sausage | sausage red-brown `#A8483A`, rice bun cream | Two faces; the small one talks |
| 15 | 台灣獼猴 | zoo, maokong | Crouching macaque | brown-grey `#8A7A6A`, pink face | Stuffed cheeks, stolen 鳳梨酥; jumpy |
| 16 | 穿山甲 | zoo, maokong | Half-rolled pangolin | bronze scales `#B8864A` | Pinecone-plate scales, a small nose; rolls into a ball on guard |
| 17 | 山嵐 | maokong, bitan | Wispy fog cloud | pale green `#D8F0E0` | Sleepy face, a tea-leaf cowlick; soft blur edge (static bloom ok) |
| 18 | 硫磺煙 | beitou, yangming (小油坑) | Steam puff | yellow-white `#F4F0C8` | Egg-shaped face, smell lines, apologetic brows |
| 19 | 啪噠木屐 | beitou | A pair of geta | wood `#C89A6A`, red straps | Faces on the toes; hop out of step |
| 20 | 鐵蛋 | tamsui | Small dark glossy egg | `#4A2E22` with gloss | Stern face, a tiny headband; rock-solid guard |
| 21 | 招潮蟹小兵 | tamsui | Small crab, one huge claw raised | blue `#3A6AB8`, orange claw `#F08A3A` | Paper helmet; salute |
| 22 | 翻花雨傘 | tower, summit | Transparent umbrella flipped inside out | clear `#DDE6FF` at 0.6 opacity, metal ribs | Pouty eyes on the canopy; the classic typhoon image |
| 23 | 天價高麗菜 | tower | Plump cabbage | green `#8AC86A`/`#5E9A52` | A **$150** price tag, an outer-leaf crown; smug |
| 24 | 旋風小子 | tower, summit | Small white whirlwind | white `#F4F6FF`, speed lines | A candy wrapper caught in it; giggly spin |
| 25 | 跑道燈精 | airport, brown car | Blue glass dome on a metal stub | blue glass `#5A9AFF`, steel | Face in the glass, light rays; blink loop |
| 26 | 行李拖車 | airport | Tiny baggage tractor with two empty carts | yellow `#F2C24A`, grey carts | Headlight eyes, honking horn (sound marks) |
| 27 | 迷路的交通卡 | ride cars | Flat card, floating | generic pastel card with a moon sticker | A cute face, 「嗶」 marks; **not** a real card design |
| 28 | 鴿子 | longshan, bopiliao | Plump round city pigeon, chest out | grey `#9A9EB4`, iridescent neck `#5AC8A0`/`#B87AD8` (hard-edged cel bands), coral feet | A bottle-cap "badge" on the chest, orange eye; head-bob loop; gang of 3 |
| 29 | 青草精 | longshan, bopiliao | Bundle of fresh herbs tied with a red string | herb greens `#5E9A52`/`#8AC86A`, red string `#E5483E` | Leafy face, a tiny teacup hat; sways like a bouquet |
| 30 | 小天鵝船 | bitan | Small white swan pedal boat (side 3/4) | white `#F4F6FF`, red beak `#E5483E`, pastel hull trim | A cute face on the swan head; bobs on ripple rings; groups of 3 |
| 31 | 水漂石 | bitan | Flat oval pebble mid-hop | slate grey `#8A90A0` with a wet highlight | Grin, speed lines, ripple rings under it; skips across the stage |
| 32 | 芒草精 | qingtiangang | Tuft of silver 芒草 with a feathery plume | silver `#DCD8E8`, straw stems `#C8B47A` | Plume "hairdo", sleepy face; waves in the wind |
| 33 | 濃霧團 | yangming, qingtiangang | Big soft fog blob | white `#F0F2F8` at 0.85 opacity, soft edge (static blur ok in backdrop, not on the sprite: use a feathered gradient edge instead) | Only two round eyes show; drifts |
| 34 | 海芋精 | yangming | White calla lily standing on its stem | white spathe `#FFFFFF` with green shading, yellow spadix `#FFD25A` | The spadix is a "nose", leaf skirt; glows softly in fog |

### 6.3 Bosses

All bosses get a gold accent, an aura bloom and a name plate with a 「頭目」 tag. Chapter bosses use the standard stage; the **final fights use the 布袋戲 proscenium**.

| Boss | Ch / where | Silhouette | Palette | Key features / staging |
|---|---|---|---|---|
| 松鼠大王 | 1 · 大安 band-shell | Chubby squirrel, a tail bigger than his body | red belly `#C8583A`, grey-brown back | Bottle-cap crown, the **scallion** held like a sceptre; on the band-shell stage |
| 鵝霸 | 2 · 醉月湖 | Big white goose, long S-neck | white `#F4F2EA`, orange beak `#F08A3A` | Tiny graduation cap, the **book upside down** under its wing; lake-pavilion backdrop |
| 閘門巨人「嗶嗶」 | 3 · 台北車站 | Robot made of 3 fused turnstiles | steel `#B8BCC8`, red/green LEDs | Flap-gate arms, a card-reader face with a red ✕ that turns green when calmed, an LED mouth |
| 指標大王 (optional mini) | 3 · 地下街 dead end | A giant signpost bristling with ~30 arrows in every direction | sign green `#2E8A5A`, white arrows, yellow "you are here" dot | Arrows rotate independently (CSS), a big panel face; the arrow-wall backdrop |
| 卡拉OK大王 | 4 · 紅樓 | Karaoke cabinet body, disco-ball head | wood grain `#8A5A3A`, mirror ball, red bow tie | Speaker cheeks, a lyrics screen with original lyrics, the **gold mic**; neon stage light |
| 鴿子老大「咕咕」 | 5 · 剝皮寮 rooftop | A huge round pigeon on a nest of glittering junk | grey `#9A9EB4`, iridescent neck bands, gold bottle-cap crown | The **月亮票** tucked under one wing (gold glint), puffed chest, a nest of foil, caps and buttons; moonlit rooftop |
| 舞布龍 | 6 · 大稻埕碼頭 | Long dragon of patchwork 花布 | peony red, indigo `#2E4A8A`, gingham | Lion-dance head, pom-pom whiskers, the **abacus** in its jaws; flowing S-curve across the stage |
| 超級大雞排 | 7 · 士林 (地下美食區 kitchen) | Huge irregular golden slab | fried gold `#E8A848` with a crumb texture | Paper-bag cape, a pepper-shaker hat, the **drumstick** as a sword; kitchen backdrop with fryer glow |
| 風向袋小姐 | 8 · 松山機場 runway end | Orange-and-white windsock on a tall pole | `#F08A3A` / `#FFFFFF` stripes | A sweet face at the sock's mouth, swirl eyes, the **red string** wound round her; spins like a top |
| 茶壺爺 | 9 · 貓空 茶館 | Huge round clay teapot | clay `#8A4A32`, steam white | A scholar's-hat lid, steam beard and eyebrows, teacup hands, **celery** in the spout |
| 天鵝船大姊 | 10 · 碧潭 floating platform | A large white swan pedal boat, regal S-neck | white `#F8F8FF`, red beak, pink heart canopy `#F4A0B8`, warm candle glow | A heart-shaped canopy, the **「1」 birthday candle** glowing on her head like a lighthouse lamp; mirror-lake backdrop with the suspension bridge |
| 溫泉蛋爺爺 | 11 · 地熱谷 | Giant cracked egg | shell `#F4E6C8`, crack lines | Folded towel on his head, a bushy white moustache, the **stethoscope**; steam |
| 大水牛「阿哞」 | 12 · 擎天崗 summit meadow | A big gentle water buffalo, wide curved horns | slate `#5A5A6A` with a blue sheen, cream muzzle, brass bell | Sleepy, kind eyes (never menacing), mist curling round the horns, the **red invitation card** on one horn; fog backdrop with pampas framers |
| 招潮蟹將軍 | 13 · 情人橋 | Large fiddler crab, one huge claw | orange claw `#F07A3A`, blue body | Beret, paint-splattered cape, an easel on his back, the **paintbrush** in his claw; 淡江大橋 behind |
| 定心球「阿穩」 | 14 · 101 89F (mini) | Giant golden sphere on cables | gold `#F2C24A` with metallic bands | A gentle face, swirl eyes when dizzy; rocking pendulum motion |
| 暴風咻咻 / 哭哭咻咻 / 生日加碼・咻咻 | 14 · 91F / post-game | See 5.5 | — | 布袋戲 frame (final); a sunrise lighting change between phases |

---

## 7. UI and UX system (anime-JRPG, grandparent-readable)

### 7.1 Typography and font loading

- **Body and dialogue:** **Chiron GoRound TC** 500/700/900 (rounded Traditional Chinese). **Names, titles and command labels:** **Noto Serif TC** 700/900 (elegant anime-JRPG feel). **Numbers and Latin:** **Fredoka** 500/600/700. All three are on Google Fonts with zh-Hant coverage. Do not use Zen Maru Gothic or M PLUS Rounded: they lack many Traditional characters (咖, 寶 forms).
- **Loading (superseded by D-105, #68):** the faces are self-hosted WOFF2 subsets of the game's own text, sliced by play order with exact `unicode-range`s (`src/fonts/`, `npm run fonts`); the cover and page 0-1 pull ≈ 160 KB of fonts and no external stylesheet. The original text: `<link rel="preconnect" href="https://fonts.googleapis.com">` + `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` + one `css2?family=Chiron+GoRound+TC:wght@500;700;900&family=Noto+Serif+TC:wght@700;900&family=Fredoka:wght@500;600;700&display=swap`. Google's unicode-range slicing downloads only the glyphs used. Budget ≤250KB on first paint. Fallback stack: `'PingFang TC','Noto Sans TC',system-ui`.
- **Scale (px / weight):** caption 14/700 · label 16/700 · body 18/700 · **dialogue 21/700, line-height 1.7** · button 21/900 serif · heading 22/900 serif · title 28/900 serif · chapter title 36/900 serif · logo 52/900 serif.

### 7.2 Panels and buttons

- **Panel:** vertical gradient `rgba(22,26,78,.96)→rgba(10,11,34,.99)`, a **1px gold border** `#E8C77A`, an inner 1px gold line at 30% inset by 4px, radius 6. Corners on major panels get **gold diamond ornaments** (10px, rotated 45°, gradient `#FFF2C8→#C9A04A`, glow).
- **Command button:** 70px tall, navy gradient `#262E74→#161B4C`, gold hairline border plus an inner hairline, a 36px icon in a gold-ring circle, serif 21px label with 0.1em tracking, and a 12px sub-label with live info (MP cost, item count).
- **Primary button** (one per screen): gold gradient `#FFEFC0→#F0C060→#D89A3A`, navy text, soft gold glow.
- **Pressed state:** translateY(2px), glow off, 80ms.
- **Glass chips** (location / time, round): navy translucent, gold hairline, serif text, Fredoka numbers in gold.

### 7.3 HP and MP bars

- 7px HP bar and 5px MP bar, square ends, dark track with a 1px gold-at-35% frame, horizontal gradient fills (3.1).
- On damage: the fill eases down over 300ms and a pale lag bar catches up after 400ms. On heal: it grows with a sparkle at the end.
- Numbers in Fredoka 12px on one line ("體力 84/100  元氣 9", with a 6px gap).

### 7.4 Battle screen (portrait, 4 heroes)

- **Stage:** top 500px. **Panel:** bottom 346px.
- **Heroes** lower-left facing right, staggered on a diagonal. With 4 heroes, use two rows, 黑糖 at the back. **Foes** upper-right, up to 3.
- **Party strip:** 2×2 cards, each with a 48px gold-ringed **head portrait** (from the head-expression assets), a serif name and two bars.
- **Active hero:** a gold-bordered card with glow, a 「輪到你」 gold tag above the sprite, and a blurred gold light ring under the sprite.
- **Foe plate:** a slanted ribbon at top-right with gold top and bottom rules, an "ENEMY" or "頭目" kicker, a serif name and ×count. Per-foe mini HP bars sit under the sprites.
- **Damage numbers:** Fredoka 44 italic, white with a deep-pink stroke and pink glow, plus a serif sub-line (好痛！／效果絕佳！). Rise 24px and fade over 600ms.
- **Boss fights:** a **布袋戲 proscenium** around the stage (vermilion `#B5322F` frame, scalloped valance with gold studs, gold inner rules). It slides down on boss intro (400ms).
- Commands: 攻擊（primary）/ 才藝 / 道具 / 防禦, with 逃跑 as a text link on the prompt row.

### 7.5 Dialogue box with bust portrait

- Bottom box: 12px margins, min height 172px, panel style plus 4 corner diamonds.
- **Bust portrait:** ~300×300, rising from behind the box's top-left (head and shoulders above the box edge), with a soft radial backlight in the speaker's colour.
- **Name plate:** a slanted gold tab, serif 19px, 0.18em tracking.
- **Text:** 21px, typed at 30ms per character (+120ms after `，。！？`). Untyped text is ghosted at 20% so nothing reflows. Key terms in gold with a soft glow.
- **Footer:** diamond page dots, 「點一下繼續」, a pulsing gold diamond. Tap finishes the line, then advances.
- **Background:** the map with a dark gradient scrim. Use a cheap pre-blurred snapshot on high-end devices only.
- **Expressions:** the script line can specify `expr`; portraits swap face groups.

### 7.6 Chapter title card with clock

- Full screen in the chapter's sky colours (3.2), with a slow star twinkle.
- The landmark silhouette **draws itself** in gold line art (stroke-dashoffset, 900ms), then fills to 25%.
- **Departure-board clock:** a dark board with gold frame and amber dot-matrix digits (`#FFB84A`, Fredoka or a drawn segment font). The time flips in with split-flap animation (each digit rotateX, 60ms stagger). Station-board style line: 「下一站：台灣大學」.
- **Text:** kicker 「第 2 章」 (serif 16px, tracking .3em) · title (serif 36px) · location plus an MRT line-colour dot.
- 2.4s total; tap skips. Reduced motion: no flip, no draw-on, 300ms fade.

### 7.7 路線圖 (MRT travel screen)

- Navy panel, full screen. Five line colours drawn as 6px rounded paths in a stylised (not official) layout. Station dots are gold rings.
  - **Unlocked:** filled gold with a glow.
  - **Current:** a blinking double ring plus a mini Baokaka head icon.
  - **Locked:** grey with 「?」.
  - **New:** a 「叮！」 gold burst (500ms).
- Tap a dot → a confirm sheet (panel plus primary 「搭乘」) → the door-close transition.
- Labels in serif 16px with English below in Fredoka 11px. Dots and labels have a ≥44px hit area.

### 7.8 Menus, 集章本, 抓周盤

- **集章本:** a parchment book spread with **14 stamp circles**. Each stamp is the location's landmark in vermilion ink (an ink-stamp texture: a slightly rough edge from a static mask).
- **抓周盤 screen:** a red lacquer round tray (as drawn on the Mocha sheet), 9 slots around a centre 金鎖片 slot. Obtained items appear with a gold sparkle; missing ones are faint outlines.
- **Lists:** 64px rows; selection uses a gold border plus glow.

### 7.9 Transitions and motion

| Event | Transition | Duration |
|---|---|---|
| Map → battle | **MRT doors close** (two navy panels with line-colour stripe and window), chime-light flash, doors open on the battle | 280 + 120 + 320ms |
| Boss intro | 布袋戲 curtain frame drops in, name plate slides | 400ms |
| Battle → victory | Foe calms (swirl → smile, sparkle), gold radial wash, result card slides up | 600ms |
| Map → map | Iris wipe toward the exit | 400ms |
| Ride car → station | Door chime, doors open to white, then fade into the map | 500ms |
| Dialogue in/out | Box slides up 18px plus fade; bust rises 24px with slight overshoot | 240ms |

- **Tokens:** instant 80 · quick 160 · base 240 · slow 400 · scene 600ms. **Easings:** out `cubic-bezier(.2,.8,.2,1)`, pop `cubic-bezier(.34,1.56,.64,1)`.
- **Character motion:** CSS transforms on rig parts (`transform-box: view-box`, origins at joints).
  - idle: breathe 2.4s, blink every 3.5–5s.
  - crawl cycle: 2 beats per tile, alternating diagonal limbs.
  - cat walk: diagonal gait, tail sway.
  - On the map both are a two-frame flipbook of static key poses (opacity steps, no animated rig groups), so walking never repaints a sprite (decision D-33).
  - attack: anticipation 120ms → strike 90ms → hit-stop 60ms → recover 220ms.
  - hurt: squash plus a 2-frame flash.
  - victory: hop loop.
- **Reduced motion** (OS setting or the in-game 「減少動態」 toggle): no loops, parallax, shake or flashes; everything becomes a 200ms fade.

### 7.10 Battle VFX

Keep the 3-layer architecture in `BattleFx.tsx`:
1. **Anticipation:** a glyph circle under the caster.
2. **Impact:** hit-stop, an element impact shape, a ring, 6–10 particles.
3. **Resolution:** the damage number.

| Element | Shapes |
|---|---|
| 積木 | toy-block arc and bounce |
| 哭聲 | sound rings |
| 貓爪 | 3 slash arcs |
| 羽毛 | blue feathers |
| 熊掌 | ground shock ring with dust |
| 治療 | gold 4-point stars |
| 護盾 | magpie-bridge arch |
| 颱風 | spiral and rain |

A full-screen wash is ≤0.35 opacity and ≤200ms; at most 2 flashes per second.

---

## 8. Implementation (for engineers)

### 8.1 File organisation

```
src/art/
  palette.ts        tokens (3.1) + gradeTokens(time) (3.2)
  geom.ts           port of limb(), blob(), crs(), crease(), hand(), footie() from options/_gen/anime2.py
  Fig.tsx           two-pass renderer: collects <Part> contours (pass 1) and fills/cel/lines (pass 2) per depth group
  defs.tsx          <ArtDefs/>: shared gradients (iris, blush, contact shadow, bloom), mounted once
  rig.css           pose keyframes + joint origins
  characters/       baokaka/{skeleton.ts, Baokaka.tsx, Head.tsx}, mocha/…, magpie/…, bear/…, shushu/…
  npcs/  foes/  props/  landmarks/  tiles/  sky/  backdrops/  fx/  ui/
```

The Python generators in `docs/art/options/_gen/` (`anime.py`, `anime2.py`, `iso_d.py`, `ui_d.py`, `sheet_assets.py`, `sheet_page.py`, `anat.py`) are the **reference implementation**. They show the exact numbers. Port the logic; don't ship SVG strings.

### 8.2 Sprite contract (D)

1. **Skeleton data:** each pose is a `Record<Joint, [x, y]>` on a 200u canvas, plus per-joint radii. Volumes come from `limb()` and `blob()`.
2. **Parts and rig:** named groups `{char}-{part}` (head, hair-back, hair-front, torso, arm-near, arm-far, hand-near, leg-near, foot-near, tail…). Animation transforms parts around joint origins.
3. **Faces:** `Head` takes `expr`. Eyes, brows and mouth are separate groups.
4. **Line system:** the two-pass contour (3.2u `sil`) plus thin material-tinted lines (2.3). Tapered detail marks via `crease()`.
5. **Cel:** the clip + offset recipe (2.4); deep tones manual; the rim colour from a CSS variable `--rim` (set per location) via `style={{stroke:'var(--rim)'}}`.
6. **Unique ids:** every clipPath and gradient id comes from `useSvgIds(prefix)` (React `useId`, colons replaced). Shared gradients live in `<ArtDefs>`, a 0×0 absolutely positioned SVG (**not** `display:none`).
7. **No filters and no `<text>` in character sprites.** No raw hex outside `palette.ts` (lint).
8. **Budgets:** hero ≤220 elements and ≤20KB serialised; foe ≤160; NPC ≤120; tile ≤12.

### 8.3 Levels of detail

| LOD | Size | Use | Keep | Drop or simplify |
|---|---|---|---|---|
| **portrait** | 260–320px | dialogue bust, sheets | everything: iris rays, hair strands, blush hatching, fold creases | — |
| **battle** | 150–200px | battle stage | eyes with 2 speculars, angel ring, main folds, finger splits | iris rays (optional), star print reduced to 4 stars |
| **map** | 56–66px | iso map actors | silhouette, eyes (iris + 1 highlight), hair clumps (3 max), limb joints | iris rays, hatching, finger splits (mitten contour OK at this size), star print, creases, thin material lines, cel on parts thinner than 3u; contour width 4u so lines survive |
| **icon** | 46–48px | party cards, menus | head-only crop from the expression heads | body |

Implement as `lod` props on the same components (not separate art). The skeleton and volumes stay identical; only detail layers toggle.

### 8.4 Backgrounds and layers

- **Map stack** (back → front): `SkyLayer` (time-driven gradient, stars, moon, clouds, skyline, bokeh; parallax 0.1/0.2/0.35×) → ground SVG (memoised, graded tokens) → cast shadows → actors (painter's sort `c+r`; multi-tile props anchor at the front-most tile) → light sources (bloom gradients, `mix-blend-mode: screen`) → weather → UI.
- **Filters:** `feGaussianBlur` is allowed for bloom, cloud softening and reflections **only inside static layers** (sky, skyline, backdrop, iso ground). Those layers never animate; the camera translates them. ≤8 blurred elements per layer. Characters, FX and moving things never use filters.
- **Battle backdrops:** one `Stage` component per location config (4.2 columns), lazy-loaded per chapter (≈30–80KB each).

### 8.5 Performance budget (mid-range phone)

| Item | Budget |
|---|---|
| Map frame time | ≤12ms at 4× CPU throttle while walking |
| DOM (world screen) | ≤3,000 nodes; ground is 1 SVG |
| Animated elements | ≤6 ambient + party + ≤40 FX nodes; transform and opacity only |
| Blend layers | ≤3 full-screen (`screen` light layer, optional weather, grain) |
| `backdrop-filter` | ≤2 small elements, never over animating content |
| Fonts | ≤250KB first paint |
| Per-chapter art chunk | ≤120KB gzip (backdrop + chapter foes + props) |

### 8.6 Visual QA

- **`#/artlab` dev route:** every character at every LOD on light, night and the location's floor; silhouettes; skeleton overlays; every expression; every tile material at 3 clock times; every backdrop; FX frozen at impact.
- **Playwright** (`scripts/visual-check.mjs`, global Playwright with `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`): screenshot the art lab and the key screens (title, chapter card, map, dialogue, battle, boss battle, travel screen, 集章本, 抓周盤) at 390×844 and 375×667. Diff against baselines (pixelmatch, threshold). Run in CI for art PRs.
- **Perf:** the same script with `Emulation.setCPUThrottlingRate(4)`; walk 10 tiles and assert the median frame ≤16ms.
- **Lint tests (vitest):** no duplicate ids across two mounted copies; no raw hex in sprites; element counts within budget; text-token contrast ratios.
- **Human review:** every character PR includes its skeleton overlay and its sheet.

### 8.7 Build order

1. **Foundations:** `palette.ts` tokens and `gradeTokens`, fonts, `geom.ts` + `Fig.tsx` port, `<ArtDefs>`, `useSvgIds`, art lab route.
2. **Heroes:** 寶咖咖 (crawl / sit / first-steps, 4 expressions) and 摩卡貓 (sit / walk, 4 expressions) at all LODs, plus rig animations.
3. **UI kit:** panels, buttons, bars, dialogue with bust, chapter card with clock, battle layout (4 heroes), MRT door transition.
4. **Ch1–2 environments:** home, 大安 (sky layer, tiles, band-shell, banyans), NTU (palms, library, lake); foes 1–5; bosses 松鼠大王 and 鵝霸; 阿藍 sheet and sprite.
5. **MRT and Ch3–5:** ride cars (5 palettes), 路線圖 screen, 台北車站 (checkered hall) + 地下街, 嗶嗶, 指標大王, 迷路的交通卡, 廣播姊姊; 西門町 (neon); 龍山寺/剝皮寮 with 鴿子 and 咕咕.
6. **Chapters 6–8:** 大稻埕 + 永樂市場, 士林 + 地下美食區, 松山機場 (+ deck), with their foes and bosses.
7. **Chapters 9–13:** 黑糖 (sheet and sprite), 動物園/貓空 storm view, 碧潭 (mirror lake, suspension bridge, swan boats), 北投 steam, 月亮公車, 陽明山 fog + 擎天崗, 淡水 with 淡江大橋.
8. **Finale:** 信義 plaza, 101 interior and summit, 咻咻 four forms, 布袋戲 frame, sunrise lighting, ending scenes; post-game 象山.
9. **Polish:** ambient life, VFX pass, reduced-motion audit, Playwright baselines.

---

## 9. Reference index

| File (under `docs/art/options/`) | What it shows |
|---|---|
| `d-anime/sheet-baokaka.png`, `sheet-mocha.png` (+ `.html`) | **Character design sheets** in the target format |
| `d-anime/anatomy-sheet.png` | Pose construction with skeleton overlays, silhouettes and 60px checks |
| `d-anime/cast-sheet.png` (`cast/*.svg`) | 阿藍, 黑糖, 咻咻 ×4, 阿伯/土地公, 店員小哥, 廣播姊姊, 背包客, 媽媽, 爸爸, 阿嬤 |
| `d-anime/characters.png` | Expressions, LOD tests, palette |
| `d-anime/iso.png` (`iso.svg`) | Midnight iso patch: 大安-style street, 101 with lit windows, bloom, reflections |
| `d-anime/battle.png`, `dialogue.png` | Battle (士林夜市 03:40) and dialogue with bust portrait |
| `d-anime/overview.png` | All of the above on one board |
| `d-anime/*.svg` | Sprites: `baokaka` (sit), `baokaka-crawl`, `baokaka-stand`, expression variants, `mocha-cat` (sit), `mocha-walk`, expression variants; `sheet/` holds heads, garments, props and swatches |
| `_gen/*.py` | Reference generators (the exact geometry and colour numbers) |
| `comparison.png`, `README.md` | Options A–D as presented to the owner |
| `../archive/` | Superseded v0 drafts (option A, pre-bible) |
