# Likeness check: drawings vs. the owner's photos

The owner sent one photo of each character: a front-facing close-up of the baby (wearing a grey-white gingham bib) and a low-angle close-up of the cat. The photos are **not** in the repo. They were only looked at; nothing was traced, sampled or embedded. This file checks the v2 drawings against them one feature at a time, so a reviewer can verify the likeness without the photos.

Each feature is rated:
- ✅ matches;
- ◐ matches, but deliberately stylised;
- ✗ deliberate deviation.

Drawings: `sheet-baokaka.png`, `sheet-mocha.png`, `style-proof.png`. Code: `src/baokaka.py`, `src/baokaka_body.py`, `src/mocha.py`.

## 寶咖咖 (one year old)

| Feature in the photo | In the drawing | |
|---|---|---|
| **Hair:** straight, fine, **jet black** | Blue-black base `#25222A`, line `#08070A`, a cool grey angel-ring highlight and fine strand lines, so black hair still reads at night | ✅ |
| Hair falls as a soft fringe **swept down to viewer-left from a crown/whorl at the upper right**; high forehead visible | `WHORL=(300,34)`. All fringe clumps lean left; the hairline rises toward the right, so a high forehead shows; a few translucent baby hairs lie on the forehead | ✅ |
| Thin, wispy hair at the sides, close to the head (not voluminous) | The dome hugs the skull; thin wisps at the temples and over the ears; two loose crown hairs at upper right | ✅ |
| Ears slightly visible, low on the head | Ears sit at eye-to-nose level and only peek out of the round face | ✅ |
| **Very round, full face**, widest at the cheeks | `face_pts` is widest below the eyes (x≈±162 at y≈326); jaw rounded | ✅ |
| Big chubby cheeks, rosy | Wide blurred blush ovals with a small sheen spot on each cheek | ◐ (anime blush is pinker than life) |
| Soft double-chin roll | A crease under the lower lip, plus occlusion along the jaw onto the collar | ✅ |
| **Narrow almond eyes, monolid with an inner fold, very dark irises** | Almond eye, wider than tall (about 70×36u), inner corner low; no lid crease; a short inner-corner fold line; a soft puffy-lid shadow; iris is near-black `#0C090B → #251A1A` with a faint warm bottom | ◐ The eyes are **larger and glossier than life** (anime). The shape and colour are kept: no round "moe" eyes and no brown iris. |
| Short, soft, straight eyebrows | Short straight brows drawn as feathered, semi-transparent strokes | ✅ |
| Small, wide button nose with a shiny tip | A wide soft underside shadow, two tiny nostril strokes and a glossy tip highlight | ✅ |
| Small, pouty lips | The default `neutral` expression is the photo's pout: a small upper lip, a fuller lower lip with a highlight, mouth corners pulled in | ✅ |
| Fair, warm skin | Skin `#FFEADF`; shadow `#F3C3B0`; glossy highlight on the forehead (as in the photo) | ✅ |
| Grey-white gingham bib | The gingham is reused for his **pants**, and the bib appears as an item on the sheet (格紋口水巾) | ◐ (moved from bib to pants) |
| Age and proportion: one year old | About 3.2 heads: big head, no visible neck, round belly, short slightly bowed legs | ✅ |
| Outfit: **two-piece** (owner correction) | Mustard long-sleeve top (cream Peter Pan collar, shoulder buttons, small moon-and-star embroidery, ribbed hem) and separate gingham pants (elastic waist, gathered ankle cuffs), plus cream socks. Mustard and grey/white were chosen to stand out against midnight-blue scenes | ✅ |
| Red-string bracelet (game canon) | Kept, on the right wrist | ✅ |

**Stays recognisable at sprite size (96pt tall) because of:**
- the black side-swept fringe with the whorl at the upper right;
- the moon-round face with big rosy cheeks;
- the narrow dark eyes;
- the tiny pout.

## 摩卡貓

| Feature in the photo | In the drawing | |
|---|---|---|
| **Grey-brown tabby, not orange**: a cool greyish-brown base with a warm fawn undertone | Base `#9A8A76`, shadow `#6C5F51`. A warm fawn `#BFA07C` glows around the eyes and cheeks; plush short-fur strokes mix grey, fawn and dark | ✅ |
| **Strong black stripes**, mackerel / classic markings | Stripes in near-black `#1F1A17`, brush-shaped: mackerel bars on the flanks, swirl bands on the thighs, bars on the legs, rings on the tail with a dark tip | ✅ |
| Forehead **M** with **vertical bars** up to the crown | The M plus three central and two side vertical bars, plus outer temple bars | ✅ |
| Dark lines from the eye corners across the cheeks | Two to three tapering black cheek lines per side, plus a dark tear line toward the nose | ✅ |
| Black-spotted whisker pads | Rows of black dots on each pad | ✅ |
| Cream/white chin and muzzle (small area) | A small cream muzzle and chin, softly blurred into the grey | ✅ |
| Pink nose with a dark outline | Pink gradient nose leather with a heavy dark rim and a highlight | ✅ |
| **Large, round, green-yellow eyes**, pupils fairly dilated | Round eyes; iris gold-yellow centre → yellow-green → olive rim; the default pupil is a broad soft vertical oval; a pale fur ring around each eye | ✅ (catchlights added for anime) |
| **Big, tall ears with pale inner fur** | Tall ears with dense white ear furnishings and a darker back rim | ✅ |
| **Big, round, broad head**; sturdy cat | A broad head with cheek ruffs, drawn at 1.12× on the figure; a heavy body with large haunches | ✅ |
| Long white whiskers | Five long white whiskers per side, with a soft dark offset so they read on any background | ✅ |
| Dense, plush fur | Short-stroke fur texture over every part; tufted cheek outline | ◐ (suggested, not painted) |
| Dark "necklace" bands across the chest | Three curved black bands on a lighter fawn chest | ✅ |
| Banded legs and paws; **no white socks** | Five bars per front leg; fur-coloured paws (no white); dark pads in the paw close-up | ✅ |
| Accessory | A slim MRT-blue collar with the gold fish tag, kept for game identity. It is thin so the chest bands stay visible (the owner made this optional) | ✗ Deliberate addition; easy to remove (`mocha.collar`) |

**Stays recognisable at sprite size because of:**
- the grey with heavy black stripe contrast;
- the bold forehead M and bars;
- the big round yellow-green eyes;
- the pink nose with its dark rim;
- the spotted whisker pads.

## Known gaps
- Both are stylised anime characters, not portraits. The baby's eyes are still about 1.5× the photo's relative size, as the owner asked for anime.
- The cat's plush fur is shown with stroke texture, not painted fur. At sheet scale it reads slightly "clean".
- Only the front sitting/standing views, expressions and the scene proof are redrawn. Gameplay poses still need the same redesign.
