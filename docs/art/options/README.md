# Art Direction Options — 寶咖咖抓周大冒險

**Status:** **Decided: option D** (owner, 2026-10-18), with B's 布袋戲 boss frame and C's neon limited to 西門町/士林/月亮線. `../art-direction.md` is now the single source of truth. A–C are kept for history.

Four style directions (D was added after the owner asked for 「精緻一點，像是日本動漫風格」), each rendered on the **same comparison set**, so the owner can judge them side by side:

1. **Characters:** Baokaka (a crawling 1-year-old in footie pajamas, per the story bible) and Mocha Cat. Each is tested at 48px on light, night and silhouette.
2. **Isometric patch at midnight:** a 5×5 street (park grass, red-brick sidewalk, road with zebra crossing, pond, planter), with **Taipei 101** as a multi-tile landmark, a banyan, the red/green post boxes and a street lamp.
3. **Battle mock** (390×844): 士林夜市 at 03:40 against three 珍珠粉圓, with the full command panel (攻擊/才藝/道具/防禦 + 逃跑).

**Overview: [`comparison.png`](comparison.png)**

| | Characters | Iso patch | Battle |
|---|---|---|---|
| **A** Picture-Book Diorama | [png](a-picture-book-diorama/characters.png) | [png](a-picture-book-diorama/iso.png) | [png](a-picture-book-diorama/battle.png) |
| **B** Paper-Cut Night | [png](b-paper-cut-night/characters.png) | [png](b-paper-cut-night/iso.png) | [png](b-paper-cut-night/battle.png) |
| **C** Neon-Sign Taipei | [png](c-neon-sign-taipei/characters.png) | [png](c-neon-sign-taipei/iso.png) | [png](c-neon-sign-taipei/battle.png) |
| **D** 動漫 Anime Cel | [png](d-anime/characters.png) | [png](d-anime/iso.png) | [png](d-anime/battle.png) · dialogue [png](d-anime/dialogue.png) · overview [png](d-anime/overview.png) |

Each folder holds the source SVG/HTML next to the PNGs. The generators are in `_gen/` (D: `anime.py`, `iso_d.py`, `ui_d.py`, `sheet_d.py`); they write to absolute paths under `docs/art/options/`.

---

## A · 繪本立體 Picture-Book Diorama

**Pitch.** A soft-lit children's picture book built as tiny floating dioramas of Taipei. Characters have a warm plum outline (never black), gradient-mapped form shading, ambient occlusion where forms touch, and a cool rim light. Midnight is shown with a colour grade plus warm light sources (lamps, 101's ledges, windows). Characters stay brighter than the world, so they always pop.

**Mood references:** Monument Valley's floating islands; Sky's warm rim light against cool scenes; Ni no Kuni's friendly warmth; Jimmy Liao's lit windows on a night street.

**Palette:** night `#141A44` · indigo `#2E2F6E` · pajama butter `#FFD05A` · tabby `#CC8C52` · MRT blue `#3D7CC9` · lamp `#FFD9A0` · rim `#D8F0FF` · line `#3A2838`.

| | |
|---|---|
| **Premium feel** | ★★★★★ Lighting, depth and material richness. Reads as a polished commercial mobile game |
| **Readability (grandparents/kids)** | ★★★★★ Outlines, contact shadows and the half-strength grade on characters keep heroes clear on every floor. Light UI panel with dark text has the highest legibility |
| **Cost / performance** | ★★★☆☆ The most work per sprite (~80–120 SVG elements, 5–10 gradients, clipPaths). The night grade must ship as pre-baked night colour tokens, not a runtime filter. Fine on mid-range phones within the budget in `../art-direction.md` §10 |
| **Risks** | Needs discipline (the shading recipe on every new foe), or quality drifts between sprites |

Extra work already done in this direction: the full party (阿藍 the blue magpie, 黑糖 the black bear, a seated battle Baokaka) is in `../archive/v0-picture-book-draft/` and `a-picture-book-diorama/party-night.png`. `../art-direction.md` is the detailed bible written for this direction (it predates the story bible; see the note there).

## B · 剪紙夜燈 Paper-Cut Night

**Pitch.** Taipei made of cut paper, like a family craft project or a lantern-festival display. No outlines and no gradients on characters: flat paper colours stacked in layers, each casting a small hard drop shadow on the layer below. Battles play on a **布袋戲 puppet-theatre stage** (vermilion proscenium, scalloped valance), and UI elements are paper tags with offset shadows.

**Mood references:** Tearaway and Paper Mario's papercraft; Taiwanese 剪紙 and lantern festivals; 布袋戲 stages; Eric Carle collage warmth; risograph zines.

**Palette:** night paper `#22246A` · indigo `#30338A` · moon `#FFF1C9` · butter `#FFCB4F` · vermilion `#E8553D` · teal `#2FA39A` · kraft `#C8925A` · shadow `#0E0B26`.

| | |
|---|---|
| **Premium feel** | ★★★★☆ Distinctive and crafted, very "indie darling". It looks handmade and cultural rather than generic. Less depth and lighting drama than A |
| **Readability** | ★★★★☆ Flat shapes and limited colours give very clean silhouettes and big readable faces. Without outlines, heroes rely on value contrast, so some floor and character pairs need checking (yellow pajamas on kraft floor) |
| **Cost / performance** | ★★★★★ Cheapest. Flat fills plus one offset shadow copy per piece (~40–60 elements per sprite), almost no gradients. New foes are fast to make and hard to get "wrong". The night is simply darker paper colours, with no grade needed |
| **Risks** | Can look simple or childish if detail is cut too far. The paper-fibre grain is part of the identity (a static overlay, cheap) |

## C · 霓虹夜光 Neon-Sign Taipei

**Pitch.** The whole city becomes the glowing signage of 西門町 and the night markets. Dark streets, with every character and landmark traced by neon tubes: each hero has a signature tube colour (Baokaka warm yellow, Mocha orange), foes glow violet, and 101 is outlined in green light. The glow uses stacked strokes, not filters. The UI is dark glass with neon-bordered buttons.

**Mood references:** Taipei's neon street signs and night markets; Hotline-Miami-meets-Animal-Crossing night scenes; synthwave grid floors, softened and cozy; Kowloon neon photography.

**Palette:** void `#090A20` · street `#1C2050` · warm tube `#FFC94A` · pink `#FF4D8D` · cyan `#4DE3FF` · green `#4DFFB0` · violet `#B57BFF` · tube core `#FFF6D6`.

| | |
|---|---|
| **Premium feel** | ★★★★☆ Instantly striking and very "midnight". Screenshots pop. Can read as trendy rather than warm |
| **Readability** | ★★★☆☆ Faces are clear and the glowing outlines separate characters well. But a full game on near-black backgrounds is tiring for older eyes. Mid-detail (materials, floor types) gets lost, and the colour-coded neon UI needs care for colour-blind players. Tone risk: the bible says "cozy, never spooky", and dark plus neon trends toward edgy |
| **Cost / performance** | ★★★☆☆ Simple fills, but each glowing line is 3 stacked strokes, so node counts climb fast on maps (every tile edge, every prop). It needs a cap on glowing elements per screen. No filters, so it's still feasible |
| **Risks** | The 05:00–05:30 dawn chapters and the sunrise ending fight the style (neon loses its point in daylight). Monotony across 10 chapters |

## D · 動漫 Anime Cel (CHOSEN)

**Revision 2 (anatomy pass):** the bodies were rebuilt anatomy-first (joint skeleton → tapered limb volumes → clothing → cel → lines) after the owner said the hands, feet and body looked wrong. See `d-anime/anatomy-sheet.png` and the design sheets `d-anime/sheet-baokaka.png` and `d-anime/sheet-mocha.png` (format matches the owner's reference sheets), plus `d-anime/cast-sheet.png`.

**Pitch.** Modern TV-anime character art on anime-film night backgrounds.
- **Characters:** hard-edged 2–3-tone cel shading (base, cel shadow, occlusion), tinted line art (a thick dark-warm contour plus thin interior lines tinted from each material), big glossy eyes, hair in pointed clumps with an angel-ring highlight band, tapered fold lines and hatched blush.
- **Backgrounds:** Shinkai/Ghibli-style midnight: luminous clouds lit from below by the city, stars with sparkles, city-window bokeh, bloom on lamps and 101, wet-ground reflections.
- **UI:** an elegant anime-JRPG layout: navy glass panels, gold hairlines and diamond ornaments, Noto Serif TC for names and titles, Chiron GoRound TC for body text, and a large bust portrait in dialogue.

**Mood references:** Kyoto Animation and Ghibli character polish scaled to a chibi; Makoto Shinkai night skies (*Your Name*, *Weathering With You*: also a story about weather and Tokyo/Taipei-like cities); Atelier and Persona-lite menus with grandparent-sized type.

**Palette:** night `#0B1238` · sky `#26307A` · city glow `#E88E8A` · pajama `#FFD86A`/cel `#F2AE4A` · skin `#FFE7D6` · tabby `#D7975E` · cat iris `#86AE2A` · bandana `#4A8BDA` · UI gold `#E8C77A` · 101 rim `#8AF0E0` · line `#5A2C34`.

**Expressions shipped:** Baokaka 開心 / 大笑 / 淚汪汪; Mocha 平常 / 得意 / 開心 (the `*-laugh`, `*-teary`, `*-smug`, `*-happy` SVGs). The head is one function with an `expr` parameter. In code that becomes swappable `eyes`, `brows` and `mouth` groups.

| | |
|---|---|
| **Premium feel** | ★★★★★+ The most refined of the four, and what the owner asked for. Reads as "a real anime game" |
| **Readability** | ★★★★☆ Big expressive faces and a thick contour read at 48px. Gold-on-navy UI keeps text ≥10:1 at 21px. The dark night scenes are lifted by bloom and warm light sources. The light/silhouette tests pass (see `d-anime/characters.png`) |
| **Cost / performance** | ★★☆☆☆ The most expensive to author and to render: |

**Cost and performance notes (D):**
- **Character SVGs are 14–20KB** each on a 200-unit canvas, about 150–220 elements with ~4 gradients (iris ×2, blush, contact shadow). Within the <40KB budget. Cost is roughly 2× option A per sprite in authoring time.
- **The two-pass line system** (thick contour pass, then fills with thin tinted strokes) doubles path count but needs no filters. In code: render the part list twice from one data array (`parts.map(p => <path … stroke={SIL} strokeWidth={3.4}/>)`, then the fills).
- **Sprite parts:** head (with `expr`), hair-front, hair-back, body, arm-near and arm-far are separate components, so expressions and poses swap groups instead of whole sprites. Eye and iris gradients go in a shared `<ArtDefs>`, with instance-prefixed ids via `useId`.
- **Bloom, soft clouds and reflections use `feGaussianBlur`.** Allowed **only on static layers** (sky, skyline, iso ground, battle backdrop): render each once and never animate it (`contain: paint`; the camera translates the already-rasterised layer). Never put blur on characters, FX or anything that moves. Budget: ≤8 blurred elements per static layer. The iso patch SVG is 84KB, so ship backdrops per chapter as lazy-loaded modules.
- **Dialogue depth of field** (blurred map behind the box) should be a cheap pre-blurred snapshot or a dim scrim on low-end devices, not a live CSS `filter` on the map.
- **Fonts:** Noto Serif TC adds about 100–200KB of glyph slices for names and titles. Use it only for short labels.
- **Map scale:** at 60–66px on the map, fine detail (iris rays, hair strands) disappears. That's fine: it's built for the battle (156px) and portrait (300px) sizes, where it shines.

---

## Recommendation

**Updated after the owner's 「精緻一點，像是日本動漫風格」 feedback: go with D (動漫 Anime Cel), built on A's systems.**

- **D** delivers the refinement the owner asked for: anime eyes and hair, cel shading, anime-film night skies and an elegant JRPG UI. It still keeps the readability rules (big faces, thick contours, 21px text on high-contrast panels). The midnight→dawn colour script suits Shinkai-style skies especially well: navy → indigo → violet → a gold sunrise over 101.
- **Keep A's technical spine** (`../art-direction.md`): sprite contract, rig groups, unique ids, pre-baked grade tokens, performance budget and QA. Swap A's rendering recipe (soft gradients + rim) for D's (hard cel tones + two-pass tinted line + layered eyes).
- **Borrow from B:** the 布袋戲 proscenium could frame boss battles. **Borrow from C:** neon signs as light sources in 西門町, 士林 and on the 月亮線.
- **Fallback if authoring time is the constraint:** A, at about half the per-sprite cost of D and still premium.

Next step once the owner confirms D: port Baokaka, Mocha, 阿藍 and 黑糖 into the D recipe, write the per-chapter colour script (00:00 → 05:30), and add the foe style table from the story bible.

## Shared across all options (already decided)
- **Characters per the story bible:** Baokaka crawls (map pose) and sits (battle pose) in butter footie pajamas with a star print, a bear patch, a red string bracelet and grip-dot soles. Mocha is a brown tabby with white socks and an MRT-blue bandana.
- **Typography:** Chiron GoRound TC (rounded Traditional Chinese, Google Fonts) + Fredoka for numerals. Battle buttons are 70px tall, body text ≥17px.
- **Battle layout:** heroes lower-left facing right, foes upper-right, glass/paper/neon plate for foe names, 2×2 command grid with live sub-labels, 逃跑 as a secondary link.
- **Code-drawn constraints honoured:** inline SVG only, no bitmaps; one static grain overlay at most; no runtime SVG filters in sprites (option A's night grade must ship as pre-baked night tokens).
