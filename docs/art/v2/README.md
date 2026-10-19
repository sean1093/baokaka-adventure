# Character art v2: TV-anime character style (寶咖咖 and 摩卡貓)

> **Revision 2 (likeness pass).** The owner supplied real photos of both characters and two corrections, and both designs were redrawn to match:
> - **寶咖咖:** now has straight jet-black hair, a very round face, narrow dark almond monolid eyes, and a **two-piece outfit** (mustard top and grey-white gingham pants) instead of a onesie.
> - **摩卡貓:** now a **grey-brown tabby**, not orange, with no white socks or bib.
>
> See `likeness-check.md`. Where this README still mentions the footie onesie, brown hair or an orange cat, `likeness-check.md` and the code in `src/` take precedence. Palette values in §1.2 and §1.5–1.7 are superseded by the palettes printed on the new sheets.
>
> The photos are **not** stored in the repo. They were used only as visual reference.

The owner judged the option-D character art "still quite poor" (蠻差的): flat fills, thick uniform outlines, chibi clip-art proportions. v2 follows the owner's three reference character sheets instead. Those sheets are TV-anime / light-novel illustration quality, so v2 uses:

- thin, tapered, light-weighted line art in dark tinted colours;
- believable proportions;
- hair built from clumps, with a highlight band;
- layered eyes;
- three-layer shading;
- fabric folds;
- a parchment design-sheet format.

This document **supersedes the character parts of `docs/art/art-direction.md`**: §2.2 (proportions, for these two characters), §2.3–2.6 (line art, cel shading, faces, hands and paws) and §5.1–5.2 (Baokaka and Mocha). Backgrounds, colour clock, locations and UI in that file are untouched. The other cast should be redrawn with these same rules, using the same toolkit.

| File | What |
|---|---|
| `sheet-baokaka.png`, `sheet-mocha.png` | Design sheets in the reference format, 2000×2580 (authored at 1000×1290 CSS px, rendered @2x). Each has: front full body with a head ruler, 4 turned-head expressions, outfit/accessory breakdown with arrows, 4 material close-ups, props, Chinese notes, palette. |
| `style-proof.png` | Both characters in a night scene at phone size (390×844 pt @2x): an elevated MRT platform with Taipei 101 behind. It is composited from **baked sprites** exactly as the game would do it. |
| `compare-with-reference.png` | The references, the old option-D sheet and the v2 sheets at the same height, then same-scale face and fabric crops. |
| `baked/` | Example output of the bake step: WebP @2x/@3x per sprite, plus `manifest.json` with pixel sizes and bytes. |
| `src/` | The art itself, as Python that emits SVG (see Pipeline). |
| `tools/` | `render.mjs` (Chromium rasteriser), `build_all.py` (sheets, proof and comparison), `bake.py` (game sprites). |

---

## 1. Style rules

### 1.1 Proportions and construction
- **寶咖咖: 3.3 heads.** This is a real 1-year-old, not super-deformed:
  - The cranium is big, and the eyes sit **below** the head's midline.
  - There is effectively no neck; the chin overlaps the collar.
  - The shoulders slope, and the belly is pear-round (it is widest at the belly, not the chest).
  - The legs are short (about 1 head) and slightly bowed, and the hips are wide (diaper bulk).
  - The arms reach the hips; in the design pose they are held out for balance (his first steps), one higher than the other.
  - Hands are about 0.35 head, with short fat fingers, and are inked as one silhouette.
- **摩卡貓: a real cat skeleton.**
  - The head is broad, with male jowls (cheek tufts) and large ears.
  - The eyes are almond-shaped, with slit pupils and a tear-line marking running from the inner corner.
  - When sitting: the front legs are straight with a visible wrist (pastern), and the haunches are big masses behind and beside them. The hind paws peek out in front, and the tail grows from the spine and wraps over the paws.
  - The paws have a palm mass plus 4 toe beans seen from the front.
- **Pose:** never perfectly mirrored. Add a 3–4° head tilt, a slight head turn and an asymmetric arm.

### 1.2 Line art
- Lines are **filled tapered polygons, never uniform strokes** (`geom.taper`, `geom.outline`).
- **Silhouette weight is 2.4–3.0u** (head space: face ≈ 300u wide). Interior lines are 1.2–2.0u.
- **Light-weighted:** an outline swells where its normal faces away from the key light (upper left), so the lower-right edges are heavier (`outline(k=…)`).
- **Broken lines:** leave gaps where a form turns into the light (temples, the top of the hair, shoulder tops). Every stroke tapers in and out.
- **Colour:** the line takes the darkest tint of the material it bounds. Never black.

  | Material | Line colour |
  |---|---|
  | Hair | `#26130D` |
  | Skin | `#A55A48` |
  | Pajama | `#8C5320` |
  | Cream knit | `#9C7A54` |
  | Fur | `#3B2216` |
  | Bandana | `#1E3D6C` |
  | Gold | `#7A5410` |

### 1.3 Shading layers (every part)
1. **Base fill.** A subtle gradient: a radial highlight toward the light on skin, a vertical gradient on hair and fabric.
2. **Cel shadow.** A hard edge on the far side, made as *shape minus (shape shifted toward the light)* (`geom.cel`), at about 6–10% of the part size. It follows the real volume.
3. **Occlusion and soft core.** Blurred dark shapes where forms meet: under the chin, the collar, the armpits, the inner thighs, the belly underside, under the fringe on the forehead, and where the bandana meets the neck.
4. **Highlights.** Hair angel ring; catchlights; a soft lit-side bloom on the belly, thighs and legs; nail and nose glints.
5. **Night or scene light.** This is added **at composite time on the baked bitmap**, never inside the SVG (see 2.3).

### 1.4 Hair (寶咖咖)
- **Mass:** one silhouette made of the skull dome plus a **fringe edge of sharp tips and notches**. Clumps sweep outward from the crown whorl.
- **Separation lines:** these rise from each notch toward the whorl. Each has a soft shadow wedge on its far side and a shorter secondary line inside the clump.
- **Silhouette-breaking clumps:** soft baby hair sticks out of the dome. Ink them only on their outside edge. The cowlick (ahoge) is two strands.
- **Lighting:** a big sphere form shadow (cel plus a soft core), and darker tips where the fringe curls in.
- **Angel ring:** a smooth top edge with **irregular spikes pointing down the hair flow**. It is bright on the lit side and fades out, with an inner lighter band.
- The fringe casts a cel shadow onto the forehead (the fringe path, offset (6, 13)).

### 1.5 Eyes
- **Toddler eye:**
  - Sclera with a lilac lid-shadow band.
  - Gradient iris, dark top → mid → warm bottom: `#3B1D0F` / `#7E4421` / `#C98744` / `#F3C07A`.
  - 14 faint radial fibres, a glowing lower crescent, a 2-layer pupil and a rim.
  - A lid shadow across the top of the iris (soft plus a hard band).
  - Catchlights: a large tilted oval, a small round light and a tiny third one.
- **Lashes:** one mass on the upper lid that thickens toward the outer corner, with **one** small flick (he's a boy). Add a double-lid crease, a thin broken lower lash line, and soft shadow under the eye.
- **Cat eye:**
  - Almond shape, with a gold-centre → green → dark-green-rim radial iris and radial fibres.
  - Vertical slit pupil, which goes round when surprised.
  - Lid shadow, a warm lower glow and 2 catchlights.
  - Heavy dark upper "eyeliner", plus the tear-line marking.
- **Expressions** swap eyes, brows and mouth only. Heads accept `turn` (radians) and `tilt` (degrees). The turn uses a **cylindrical remap**: features slide along a cylinder and foreshorten, the far ear hides, the chin shifts and the fringe re-projects. This gives the 3/4 expression heads of the references without redrawing.

### 1.6 Skin
- **Base and gradient:** base `#FFE8DA` with a radial `#FFF7F0` highlight. The cel shadow is `#F3BCA6`, and a deeper `#E59E88` soft core under the jaw.
- **Blush:** a blurred `#F59A8E` ellipse, with hatch lines for emotional states. Keep the nose minimal: one shadow-side stroke and a highlight.

### 1.7 Fabric (footie pajama) and fur
- **Fabric:**
  - Colours: base `#FFD660`, cel `#F0AE48`, deep `#D58C33`, sheen `#FFF3BD`.
  - **Folds** (`baokaka_body.fold`): a tapered ink line, with its shadow falling to the lower/far side and fading.
  - Where folds go: tension folds from the armpits (the arms are raised); bunching at the elbows, cuffs, knees and ankles; crotch pulls; a curved belly-underside occlusion.
  - The print (stars) has a tiny offset shadow and is clipped to each part.
  - Ribbed cream knit at the collar and cuffs, and a felt bear patch with stitching.
- **Fur:**
  - Colours: base `#C99566`, cel `#9E6A43`, stripes `#5B3522`.
  - Stripes are brush-shaped strands (thick middle, pointed ends) that bend with the form. Mackerel stripes run down the flanks; there are bars on the legs, rings on the tail and a dark tail tip.
  - The cream bib and socks have irregular, softly blurred tuft edges.
  - Whiskers are a light stroke over a soft dark offset, so they read on any background.

### 1.8 Colour
The palettes are printed on each sheet. Keep the hue family of each material and shift the hue warmer in highlights and cooler/more saturated in shadows. For night, **preserve saturation**: a cool multiply alone turns warm skin lilac and yellow grey (we hit this; see 2.3).

---

## 2. Authoring and baking pipeline

### 2.1 Authoring (code-drawn, high detail, no element budget)
`src/` is plain Python 3 plus numpy and emits SVG. The modules are:

| Module | What it holds |
|---|---|
| `geom.py` | The toolkit:<br>• Catmull-Rom splines.<br>• `taper` (pointed ink strokes) and `outline` (light-weighted, gapped contours).<br>• `strand` (hair clumps and stripes) and `limb` (centre line plus widths, giving arms, legs and tails).<br>• `cel` (masked form shadow plus clipped extras) and `union_ink` (ink the union of overlapping shapes such as fingers and toes).<br>• `Doc` (globally unique gradient, mask and filter ids, so many drawings can share one HTML page). |
| `baokaka.py` | Head: face, ears, eyes, brows, mouths, hair, expressions, the turn rig. |
| `baokaka_body.py` | Figure: torso, legs, feet, arms, hands, cuffs, collar, bracelet, bear patch, stars. Also `flat=True` for the garment flat. |
| `mocha.py` | Head with expressions and turn; sitting body with haunches, legs, paws, bib, tail and bandana with the fish tag. |
| `props.py` | Garment flats, props, material close-ups. |
| `sheets.py` | Sheet HTML. |
| `scene.py` | Proof background. |
| `proof.py` | Composites the proof. |
| `compare.py` | The comparison image. |

### 2.2 Rendering
`tools/render.mjs` uses the repo's own Playwright Chromium. It renders an SVG at an exact pixel size (transparent background) or an HTML page at a device scale, and writes PNG or WebP. WebP is encoded by the browser's canvas, so no native image libraries are needed.

```
python3 docs/art/v2/tools/build_all.py   # sheets, style-proof, comparison (about 1 min)
python3 docs/art/v2/tools/bake.py        # game sprites -> docs/art/v2/baked (add --png for PNGs)
```

### 2.3 Baking for the game (recommended)
The game should **only display bitmaps**. `bake.py` holds a sprite table: name, builder, viewBox and logical size in pt. For each sprite it renders @2x and @3x WebP and writes `manifest.json`. The current output:

| Sprite | Logical (pt) | SVG source | @2x WebP | @3x WebP |
|---|---|---|---|---|
| baokaka-stand | 96×200 | 506 KB | 192×400, 18 KB | 288×600, 30 KB |
| mocha-sit | 92×176 | 244 KB | 184×352, 19 KB | 276×528, 31 KB |
| baokaka-head-{happy, laugh, teary, surprised, cry} | 64×69 | 126–162 KB | 128×138, 5–6 KB | 192×207, 9–10 KB |
| mocha-head-{content, smug, happy, surprised} | 64×60 | 63–95 KB | 128×120, 5–6 KB | 192×180, 8–9 KB |

All 11 sprites @3x total **≈150 KB**. Add a sprite per pose or expression the game needs, such as crawl, sit with block, battle actions, walk and loaf. The other poses still have to be redrawn in v2 (see 4).

**Scene lighting is applied to the bitmap, not the SVG.** See `proof.py: night()`:
- a saturation-preserving grade;
- a warm key rim from the upper left and a cool bounce rim from the right;
- both rims computed from the sprite's **eroded** alpha, so they sit just inside the ink line, as in anime compositing.

This can run at bake time (one variant per lighting set) or at runtime in a canvas pass.

**Lessons found while doing this:**
- Chrome rasterises an SVG `filter` on a large transformed group at reduced resolution. The characters came out soft and grey.
- A plain cool multiply desaturates warm characters.

Hence the bitmap pass.

### 2.4 Performance implications
- **Sources are heavy and must not ship.** `baokaka-stand.svg` has about 720 paths, about 53 Gaussian blurs and about 22 masks. Rendering that live per frame on a phone would mean dozens of offscreen buffers per character and per frame. This is why the old art had a 220-element / 20 KB budget. Baking removes the constraint entirely. Runtime cost is one `drawImage` or `<img>` per sprite, the same as any game sprite.
- **Download:** about 150 KB for both heroes' current set @3x. Serve @2x to DPR ≤ 2 devices; @2x is about half the bytes. Prefer WebP, with PNG fallback only if a target browser lacks WebP.
- **Memory:** decoded RGBA is w×h×4. One @3x standing sprite is 288×600×4 ≈ 0.7 MB. A full cast with about 10 poses each fits comfortably. Pack small sprites (heads, FX) into an atlas to cut requests.
- **Build:**
  - Baking runs in CI or locally in seconds per sprite, with no new dependencies (Playwright is already a devDependency; Python needs numpy and Pillow only).
  - Keep the generated files out of `src/`: emit to a `public/sprites/` folder or import them via Vite.
  - Wiring the baked output into the game is a separate step. This work did not touch `src/`.

---

## 3. How this supersedes `art-direction.md`

| art-direction.md (option D) | v2 rule |
|---|---|
| §2.2: 寶咖咖 3.4 heads, chibi-leaning; Mocha "chibi-leaning head" | 寶咖咖 **3.3 heads, real toddler anatomy** (no neck, low eyes, wide hips, bowed legs). Mocha uses a **real cat head-to-body ratio**. |
| §2.3: two-pass line, 3.2u contour plus 1.0–1.2u inner, uniform strokes | **Tapered filled lines** everywhere, with silhouettes light-weighted (heavier away from the light) and broken on lit turns. Contours are much thinner relative to the figure. |
| §2.4: one hard cel band plus manual "deep" shapes | **Three layers**: gradient base → masked cel → blurred occlusion core, plus highlights. Scene rims are applied to the baked bitmap. |
| §2.4: angel ring "band with jagged lower edge" | Ring with a smooth top and **irregular** spikes along the hair flow, fading across the head, with an inner bright band. Fringe separation lines, shadow wedges and silhouette-breaking clumps. |
| §2.5: eyes | Same ingredients, plus a lid-shadow band on the sclera and iris, 14 fibres, a 2-layer pupil, 3 catchlights, a lash mass with a single flick (male) and a double-lid crease. Expression heads also take **turn/tilt** (3/4 views). |
| §2.6: hands and paws | The toddler hand is splayed palm-forward and inked as one silhouette via `union_ink`. Cat paws have a palm plus 4 toe beans and a tapered pastern. |
| §5.1/5.2: designs | Unchanged in content (pajama details, bear patch, red bracelet, gold lock as a story item, tabby markings, blue polka-dot bandana knotted on his left, gold fish tag). The **sheets in this folder replace** `options/d-anime/sheet-baokaka.png` and `sheet-mocha.png`. |
| §0/§2 element budget (≤220 elements, ≤20 KB per sprite) | **Dropped for characters.** Author at any complexity; ship baked bitmaps (§2.3–2.4 above). |

---

## 4. Honest status and next steps
- **Done in v2:** front views, 4 expressions each (turnable), garment flat, accessories, materials and props, a scene proof, and the bake pipeline.
- **Not yet redrawn in v2:** the gameplay poses — crawl (map), sit with block (battle), the battle actions, Mocha's walk, pounce and loaf — and the rest of the cast. Use the same toolkit: `limb` centre lines make new poses mostly a matter of moving joints.
- **Gap to the references:**
  - The references are hand-painted by professionals: finer strand-level hair, painterly shading and true 3/4 construction. v2 matches their *language* (line, layers, hair, eyes, folds, sheet format) but is still procedurally constructed.
  - Hair is short toddler hair with fewer strands. The turn rig is a 2.5D approximation, not a redrawn 3/4 head.
  - Fabric folds are convincing at sprite size but simpler than the references' pleats up close.

---

## 5. Gameplay poses (《翻翻台北》 Pop-Up Taipei)

| File | What |
|---|---|
| `poses-baokaka.png`, `poses-mocha.png` | Labelled pose sheets. Every frame shown is the baked bitmap. |
| `poses-cycles.png` | Contact sheet of the three cycles. Each row shows frames 1–8, then frame 1 again (green box) so the loop seam is visible, an onion skin of the last frame over the first, and the numeric loop check. |
| `preview-baokaka-crawl.gif`, `preview-baokaka-walk.gif`, `preview-mocha-walk.gif` | Animated previews of the cycles. |
| `baked/poses/<char>-<pose>-<i>@2x.webp` / `@3x.webp` | 31 poses and 63 frames (Baokaka 18 poses / 39 frames, Mocha 13 / 24). About 450 KB total @2x and 580 KB @3x. |
| `baked/poses.json` | Manifest, per pose: Chinese label, `frames`, `keyframes`, `loop`, `fps`, `size_pt`, `anchor_pt` (the foot point, measured from the top-left), file names, byte count, plus the loop-check results. |

**Rig** (`src/rig.py`, `src/bk_poses.py`, `src/mo_poses.py`):
- **Approach.** A small forward-kinematics plus 2-bone IK skeleton, drawn with the same tapered-ink and cel-shading toolkit as the sheets, with the head reused from `baokaka.py` / `mocha.py` turned 3/4 by the cylindrical turn rig.
- **Baokaka.** The torso is a pear (small chest, big belly, padded bum); legs and arms are drawn as single bending limbs. Raised arms go *behind* the head, which is the anime convention for a big-headed toddler; anatomically his raised arms barely clear the top of his head.
- **Mocha.** A digitigrade cat: shoulder–elbow–wrist–paw at the front (elbow bends back), hip–knee–hock–paw at the back (knee forward, hock back). Paws are placed by IK, so stance paws stay planted.
- **Gaits.**
  - The crawl is a diagonal crawl: near hand together with far knee.
  - The first walk is short, flat-footed steps with knees soft, arms in a low guard, and the torso swaying.
  - The cat walk is a lateral-sequence gait: left hind → left fore → right hind → right fore, a quarter cycle apart, with a duty factor of about 0.6.
- **Looping.** Cycles are periodic functions of phase *t*, so frame *n* equals frame 0 by construction. `bake_poses.py` also checks this numerically: the seam difference must be ≤ the largest difference between consecutive frames.

**Orientation and anchor:**
- All frames face right; the game mirrors them for left.
- When mirroring, `anchor_x' = size_pt[0] - anchor_x`.
- Every frame of a pose shares one box, so the anchor never jitters within a pose.

**Scale:**
- Baokaka is 0.092 pt per art unit, so he is about 70 pt tall crawling, matching GDD §3.9.
- Mocha is 0.074 pt per unit, so a standing cat is about 0.55× the crawling baby's height, which matches the real-life ratio.

**Coverage against GDD §3.9:**

| GDD frame | Delivered as |
|---|---|
| crawl | `crawl` (8 frames; keyframes 0/2/4/6 for a 4-frame version) |
| sit | `sit` |
| reach | `reach` |
| cry | `cry` (2) |
| grab | `hold` |
| eat | `eat` |
| cuddle | `hug` |
| say | `point` (mouth open) |
| stand-cruise | `pull` / `wobble` |
| walk | `walk` (8) |
| Mocha sit / loaf / hop (3) / land / push (2) | `sit` / `loaf` / `jump` (3) / `jump` frame 3 / `push` (2) |
| Mocha eye-contact | `push` frame 1 (looks at the camera) |
| Mocha puff (wet) | `puff` |
| Mocha walk (linked) | `walk` (8) |

**Not yet drawn:**
- Baokaka: look L/R, watch-sway, ride-giggle, carried, climb (3), touch-watch.
- Mocha: glare, purr, in-box.

Most of these are cheap with the rig (a head turn or expression swap on `sit`/`loaf`).

**Rebuild:** `python3 docs/art/v2/tools/bake_poses.py` (about 2 minutes).
