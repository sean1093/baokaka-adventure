"""ph_poses.py - the album photo frames (GDD § 2.9, #193).

For every chapter with a spread, three frames of 寶咖咖 with the chapter's treasure drawn in
his hands or mouth, as the character art (tapered ink, three-layer shading), not laid over a
generic pose:

  A  the 「哇！」 face: the treasure lifted high in both hands, eyes wide, mouth open;
  B  crawling the last stretch, his near hand out to the treasure on the floor ahead;
  C  sat with it in his mouth, chewing, eyes shut in glee (the funny face).

Chapter 10 is the photo of his first steps (10-6): B walks in, A stands holding the 金鎖片 up,
C has plopped down to chew it.

Each chapter's frames are one pose, `photo<N>` (frames 0 A, 1 B, 2 C), composed in *photo
space*: the anchor (0, 0) is the photo's floor line at its centre (`PhotoScene` puts it at the
crop's (150, 200)), the box is wide enough for B's crawl and the treasure ahead of him, and the
print scale is the photo's (×1.45 of the gameplay frames), so the viewfinder draws them 1 : 1.
摩卡's photo frames (+M) are in mo_poses.py.
"""
import math
from geom import *
from rig import *
import bk_poses as BK

# The photo's print scale over the gameplay frames, and the photo-space box (art units)
PHOTO_PT = 1.45
PHOTO_VB = (-1150, -1600, 2300, 1700)


# ------------------------------------------------------------- shading helpers
def grp(c, rot, inner, s=1.0):
    return f'<g transform="translate({c[0]:.1f},{c[1]:.1f}) rotate({rot:.1f}) scale({s})">{inner}</g>'


def lshift(rot, k=10):
    """the key light's cel shift (toward the lower right) in a group rotated by `rot`"""
    return rotv((k, k * .6), -rot)


def solid(doc, rot, loop, fill, shade, line, lw=2.4, extra="", k=10, gaps=None, op=1):
    d = smooth(loop)
    return (P(d, fill) + cel(doc, d, shade, shift=lshift(rot, k), extra=extra, opacity=op)
            + P(outline(loop, lw, 1.2, gaps=gaps), line))


def boxy(pts, step=14, corner=4):
    """a polygon resampled so the spline tools (smooth, outline) keep its edges straight and its
    corners only slightly rounded: points every `step` units, two close to each corner"""
    out = []
    n = len(pts)
    for i in range(n):
        a, b = pts[i], pts[(i + 1) % n]
        L = dist(a, b)
        k = max(2, int(L / step))
        c = min(corner, L / 3)
        out.append(lerp(a, b, c / L))
        for j in range(1, k):
            t = j / k
            if c / L < t < 1 - c / L:
                out.append(lerp(a, b, t))
        out.append(lerp(a, b, 1 - c / L))
    return out


def glint(x, y, r=10, col="#FFFFFF", op=.95):
    """a four-point star glint"""
    d = (f"M{x},{y - r}Q{x + r * .16},{y - r * .16} {x + r},{y}Q{x + r * .16},{y + r * .16} {x},{y + r}"
         f"Q{x - r * .16},{y + r * .16} {x - r},{y}Q{x - r * .16},{y - r * .16} {x},{y - r}Z")
    return P(d, col, opacity=op)


def drop_shadow(doc, w, y=0, x=0, op=.24):
    return f'<ellipse cx="{x}" cy="{y}" rx="{w}" ry="{w * .14:.1f}" fill="#2A2030" opacity="{op}" filter="{doc.blur(6)}"/>'


# Gold foil (the treasures' stock, bible § 3.1): a warm metallic ramp
GOLD = [(0, "#FFF6C8"), (.35, "#F6D36A"), (.7, "#D9A23A"), (1, "#A8741E")]
GOLD_LN = "#7A5410"


# ------------------------------------------------------------- the treasures
# Each is drawn in local units centred on its grip point (0, 0), its long axis along +x, at the
# size it has in his hands (a hand is ≈ 60 units across; 阿嬤: 「雞腿比臉還大！」). `rot` is the
# rotation the caller will put it under (for the light). `bite` marks a chewed end.

def drumstick(doc, rot, bite=False):
    """雞腿: a glazed drumstick, the bone to +x with its knuckles and a gold paper frill"""
    o = ""
    # the bone
    bone = [(20, -22), (150, -16), (172, -34), (196, -30), (204, -8), (196, 12), (204, 30), (190, 46), (166, 40), (150, 18), (20, 22)]
    o += solid(doc, rot, bone, doc.lin([(0, "#FFFBF0"), (1, "#E9DCC2")], 0, 0, 0, 1), "#D6C4A2", "#9C8460", lw=2.2)
    o += P(taper([(40, -10), (140, -8)], 5, .3, .3), "#fff", opacity=.7)
    # the frill: zigzag paper ruff in gold
    fr = []
    for k in range(9):
        y = -40 + k * 10
        fr += [(36 if k % 2 == 0 else 58, y)]
    fr = [(30, -36)] + fr + [(30, 44)]
    o += P(poly(fr), doc.lin(GOLD, 0, 0, 1, 0)) + P(outline(fr, 1.8, 1, n=4), GOLD_LN)
    # the meat: a fat teardrop toward -x, crust darker underneath
    meat = [(40, -30), (6, -62), (-60, -92), (-140, -96), (-206, -66), (-232, -6), (-212, 56), (-150, 92), (-70, 94), (0, 62), (40, 30)]
    if bite:
        meat = [(40, -30), (6, -62), (-60, -92), (-140, -96), (-176, -74), (-168, -50), (-190, -40), (-184, -14), (-208, -2),
                (-212, 56), (-150, 92), (-70, 94), (0, 62), (40, 30)]
    g = doc.rad([(0, "#F7C27A"), (.45, "#D2843A"), (1, "#8E4A1C")], .38, .3, .75)
    ex = P(smooth([(-210, 30), (-150, 86), (-60, 92), (10, 56), (-80, 70)]), "#6E3414", opacity=.55, filter=doc.blur(10))
    for (x, y, r) in [(-120, 20, 7), (-80, -30, 5), (-160, -20, 6), (-40, 30, 5), (-150, 50, 4), (-60, -60, 4), (-190, 10, 4)]:
        ex += f'<circle cx="{x}" cy="{y}" r="{r}" fill="#7A3A16" opacity=".55"/>'
    o += solid(doc, rot, meat, g, "#8E4A1C", "#5A2A10", lw=2.8, extra=ex, k=14)
    # glaze highlights
    o += P(taper([(-196, -40), (-150, -80), (-90, -82)], 14, .3, .4), "#FFE3B0", opacity=.8)
    o += P(taper([(-60, -66), (-20, -50)], 8, .3, .4), "#FFE3B0", opacity=.6)
    if bite:
        o += P(smooth([(-176, -74), (-168, -50), (-190, -40), (-184, -14), (-198, -8), (-172, -30), (-160, -56)]), "#F3D9B8", opacity=.9)
    return o


def paintbrush(doc, rot, bite=False):
    """畫筆: a fat child's brush — red lacquer handle with a cream end, a gold ferrule, bristles
    dipped in the park's green"""
    o = ""
    h = [(-30, -16), (180, -12), (204, -10), (212, 0), (204, 10), (180, 12), (-30, 16)]
    o += solid(doc, rot, h, doc.lin([(0, "#F06A5A"), (.5, "#C8342C"), (1, "#8A1E1A")], 0, 0, 0, 1), "#8A1E1A", "#5E1410", lw=2.2)
    o += solid(doc, rot, [(170, -12), (204, -10), (212, 0), (204, 10), (170, 12)], "#F6EEDC", "#D8C8A8", "#9C8460", lw=1.8)
    o += P(taper([(-20, -8), (160, -6)], 4, .2, .3), "#FFC7B8", opacity=.8)
    # ferrule
    fe = boxy([(-74, -20), (-28, -18), (-28, 18), (-74, 20)])
    o += solid(doc, rot, fe, doc.lin(GOLD, 0, 0, 0, 1), "#B8841C", GOLD_LN, lw=2)
    for x in (-62, -48, -38):
        o += P(taper([(x, -18), (x, 18)], 2, .1, .1), GOLD_LN, opacity=.6)
    # bristles: cream root, green belly, a pointed wet tip
    br = [(-74, -20), (-120, -24), (-170, -12), (-200, 2), (-168, 12), (-118, 22), (-74, 20)]
    if bite:
        br = [(-74, -20), (-120, -26), (-150, -20), (-160, 0), (-150, 18), (-118, 24), (-74, 20)]
    o += solid(doc, rot, br, doc.lin([(0, "#2E6A5A"), (.55, "#4E9A6A"), (1, "#F2E8CC")], 0, 0, 1, 0), "#1F4A3E", "#173A30", lw=2.2)
    for k in range(5):
        y = -14 + k * 7
        o += P(taper([(-80, y), (-150, y * .6)], 1.4, .2, .5), "#173A30", opacity=.5)
    if not bite:
        o += f'<ellipse cx="-206" cy="12" rx="9" ry="11" fill="#4E9A6A"/><ellipse cx="-209" cy="8" rx="3" ry="4" fill="#fff" opacity=".8"/>'
    return o


def book(doc, rot, bite=False):
    """書: a small clothbound book, closed — lake-blue cloth, gold-foil corners and a foil seal on
    the cover, the cream page block, a red ribbon"""
    o = ""
    W, H_ = 150, 190
    # page block (seen on the right and bottom edges), then the back board
    o += solid(doc, rot, boxy([(-W / 2 + 10, -H_ / 2 + 12), (W / 2 + 14, -H_ / 2 + 12), (W / 2 + 14, H_ / 2 + 10), (-W / 2 + 10, H_ / 2 + 10)]),
               "#F3EAD2", "#D8C8A4", "#9C8A64", lw=2)
    for k in range(5):
        x = W / 2 + 3 + k * 2.4
        o += P(taper([(x, -H_ / 2 + 16), (x, H_ / 2 + 6)], 1, .1, .1), "#C8B890", opacity=.8)
    # ribbon
    o += solid(doc, rot, [(30, H_ / 2 + 4), (46, H_ / 2 + 4), (46, H_ / 2 + 48), (38, H_ / 2 + 40), (30, H_ / 2 + 48)], "#B8394A", "#7E2030", "#5E1820", lw=1.6)
    # the front board
    cov = boxy([(-W / 2, -H_ / 2), (W / 2, -H_ / 2), (W / 2, H_ / 2), (-W / 2, H_ / 2)], corner=8)
    o += P(smooth(cov), doc.lin([(0, "#5A82CC"), (.5, "#2E56A8"), (1, "#1E3A78")], 0, 0, 1, 1))
    o += cel(doc, smooth(cov), "#1E3A78", shift=lshift(rot, 12), opacity=.8)
    o += P(poly([(-W / 2, -H_ / 2), (-W / 2 + 24, -H_ / 2), (-W / 2 + 24, H_ / 2), (-W / 2, H_ / 2)]), "#1C2E60", opacity=.7)
    # gold corners and a gold seal with a little moon
    for sx, sy in ((1, -1), (1, 1)):
        cx, cy = sx * W / 2, sy * H_ / 2
        o += P(poly([(cx, cy), (cx - 32, cy), (cx, cy - sy * 32)]), doc.lin(GOLD, 0, 0, 1, 1))
    o += f'<rect x="-34" y="-50" width="76" height="76" rx="8" fill="none" stroke="#F6D36A" stroke-width="4"/>'
    o += f'<circle cx="4" cy="-12" r="22" fill="{doc.lin(GOLD, 0, 0, 1, 1)}"/><circle cx="14" cy="-18" r="18" fill="#2E56A8"/>'
    o += P(outline(cov, 2.6, 1.2), "#14244E")
    o += P(taper([(-W / 2 + 30, -H_ / 2 + 8), (W / 2 - 8, -H_ / 2 + 8)], 4, .2, .3), "#9AB8F0", opacity=.7)
    if bite:
        o += P(smooth([(W / 2 - 30, -H_ / 2), (W / 2 - 18, -H_ / 2 + 12), (W / 2 - 6, -H_ / 2 + 8), (W / 2, -H_ / 2 + 22), (W / 2 + 8, -H_ / 2 - 6)]), "#F3EAD2")
    return o


def microphone(doc, rot, bite=False):
    """麥克風: a hand-held mic — a silver mesh ball head on a gold band, the dark handle with a neon
    pink stripe and its switch. The head is at -x."""
    o = ""
    hd = [(-30, -16), (150, -11), (168, 0), (150, 11), (-30, 16)]
    o += solid(doc, rot, hd, doc.lin([(0, "#4A4466"), (.45, "#2A2346"), (1, "#14102A")], 0, 0, 0, 1), "#0E0A1E", "#0A0614", lw=2.2)
    o += P(poly([(60, -14), (78, -14), (78, 14), (60, 14)]), "#FF5FA2")
    o += f'<rect x="100" y="-6" width="22" height="12" rx="4" fill="#9A96C0"/>'
    o += P(taper([(-20, -9), (140, -6)], 3.4, .2, .3), "#8C86B0", opacity=.7)
    o += solid(doc, rot, boxy([(-58, -24), (-26, -20), (-26, 20), (-58, 24)]), doc.lin(GOLD, 0, 0, 0, 1), "#B8841C", GOLD_LN, lw=2)
    c = (-112, 0)
    R = 60
    ball = ellipse_pts(c[0], c[1], R, R, 20)
    if bite:
        ball = [p for p in ball]
    g = doc.rad([(0, "#FFFFFF"), (.35, "#D8D6EC"), (.8, "#8E8AB4"), (1, "#5E5A84")], .36, .32, .7)
    mesh = ""
    for k in range(-5, 6):
        mesh += P(taper([(c[0] + k * 11, c[1] - R), (c[0] + k * 11, c[1] + R)], 1.2, 0, 0), "#5E5A84", opacity=.45)
        mesh += P(taper([(c[0] - R, c[1] + k * 11), (c[0] + R, c[1] + k * 11)], 1.2, 0, 0), "#5E5A84", opacity=.45)
    o += solid(doc, rot, ball, g, "#6E6A9C", "#3E3A64", lw=2.4, extra=mesh, k=14)
    o += f'<ellipse cx="{c[0] - 22}" cy="{c[1] - 24}" rx="16" ry="11" fill="#fff" opacity=".9" transform="rotate(-30 {c[0] - 22} {c[1] - 24})"/>'
    return o


def scallion(doc, rot, bite=False):
    """蔥: two fresh scallions tied with a gold band — white bulbs and roots at -x, greening up to
    hollow leaves at +x, one leaf folded over"""
    o = ""
    roots = ""
    for k in range(7):
        a = -40 + k * 13
        roots += P(taper([(-170, -4 + k * 3), (-170 - 26 * math.cos(math.radians(a)), -4 + k * 3 + 26 * math.sin(math.radians(a)))], 2.2, .1, .8), "#C8B48C")
    o += roots
    for dy, lean, dark in ((-20, -10, True), (20, 12, False)):
        stalk = [(-170, dy - 20), (-60, dy - 19), (60, dy - 16 + lean * .3), (200, dy - 12 + lean), (218, dy + lean), (200, dy + 12 + lean), (60, dy + 16 + lean * .3), (-60, dy + 19), (-170, dy + 20), (-180, dy)]
        if bite and not dark:
            stalk = [(-170, dy - 20), (-60, dy - 19), (60, dy - 16 + lean * .3), (120, dy - 14 + lean * .6), (110, dy + 2), (124, dy + 14 + lean * .6), (60, dy + 16 + lean * .3), (-60, dy + 19), (-170, dy + 20), (-180, dy)]
        g = doc.lin([(0, "#FBF8EC"), (.3, "#F0F2D8"), (.5, "#B8D890"), (.75, "#5E9A3E" if not dark else "#4A863A"), (1, "#3A6A2A")], -180, 0, 210, 0, "userSpaceOnUse")
        o += solid(doc, rot, stalk, g, "#3A6A2A", "#2A4E1E", lw=2.2, k=6, op=.6)
        o += P(taper([(-150, dy - 6), (40, dy - 5)], 3, .2, .4), "#fff", opacity=.7)
    # the folded leaf
    leaf = [(150, -28), (210, -84), (262, -104), (244, -66), (190, -16)]
    o += solid(doc, rot, leaf, doc.lin([(0, "#8CC266"), (1, "#3A6A2A")], 0, 0, 1, 0), "#3A6A2A", "#2A4E1E", lw=2)
    o += solid(doc, rot, boxy([(-118, -42), (-84, -42), (-84, 46), (-118, 46)]), doc.lin(GOLD, 0, 0, 1, 0), "#B8841C", GOLD_LN, lw=2)
    return o


def stamp(doc, rot, bite=False):
    """印章: the customs officer's passport stamp — a turned wooden handle with its knob at +x, a gold
    collar, the red seal base at -x"""
    o = ""
    hd = [(-30, -26), (60, -22), (110, -30), (150, -34), (178, -18), (182, 0), (178, 18), (150, 34), (110, 30), (60, 22), (-30, 26)]
    o += solid(doc, rot, hd, doc.lin([(0, "#D8A878"), (.5, "#A8744A"), (1, "#6E4426")], 0, 0, 0, 1), "#6E4426", "#4A2A16", lw=2.4)
    o += P(taper([(-20, -14), (60, -12), (150, -20)], 4, .2, .3), "#F2D2A8", opacity=.8)
    for x in (20, 40, 100):
        o += P(taper([(x, -22), (x + 2, 22)], 1.4, .2, .2), "#4A2A16", opacity=.4)
    o += solid(doc, rot, boxy([(-60, -34), (-28, -30), (-28, 30), (-60, 34)]), doc.lin(GOLD, 0, 0, 0, 1), "#B8841C", GOLD_LN, lw=2)
    base = boxy([(-140, -58), (-60, -56), (-60, 56), (-140, 58)], corner=10)
    o += solid(doc, rot, base, doc.lin([(0, "#F0584C"), (.5, "#D8342A"), (1, "#9E1F18")], 0, 0, 0, 1), "#9E1F18", "#6E140E", lw=2.4)
    o += P(taper([(-140, -50), (-140, 50)], 7, .1, .1), "#6E140E", opacity=.8)
    o += P(taper([(-130, -48), (-68, -48)], 4, .2, .3), "#FF9A8A", opacity=.7)
    return o


def celery(doc, rot, bite=False):
    """芹菜: a bunch of fresh celery — pale ribbed stalks from the cut ends at -x greening up into a
    spray of leaves at +x, tied with a gold band"""
    o = ""
    def leafy(x, y, a, s):
        pts = [(0, 0), (14, -20), (8, -42), (30, -38), (42, -56), (58, -34), (82, -30), (70, -10), (84, 10), (58, 14), (46, 34), (24, 22), (10, 12)]
        return [(x + q[0], y + q[1]) for q in (rotv((px * s, py * s), a) for px, py in pts)]
    for x, y, a, s in [(140, -40, -30, 1.1), (170, 0, 0, 1.2), (150, 40, 30, 1.0), (190, -20, -12, .9), (190, 30, 20, .9)]:
        loop = leafy(x, y, a, s)
        o += solid(doc, rot, loop, doc.lin([(0, "#9CD06A"), (1, "#4E8A2E")], 0, 0, 1, 1), "#3E7024", "#2A4E1A", lw=1.8, k=6)
    for dy, col, w in ((-20, "#A8CC7A", 22), (2, "#C2DC92", 24), (24, "#B4D486", 22)):
        stalk = [(-190, dy - w / 2), (40, dy - w / 2 + 2), (150, dy * .6 - w / 3), (160, dy * .6), (150, dy * .6 + w / 3), (40, dy + w / 2 - 2), (-190, dy + w / 2)]
        if bite and dy == 2:
            stalk = [(-120, dy - w / 2), (40, dy - w / 2 + 2), (150, dy * .6 - w / 3), (160, dy * .6), (150, dy * .6 + w / 3), (40, dy + w / 2 - 2), (-120, dy + w / 2), (-110, dy + 4), (-124, dy - 2)]
        g = doc.lin([(0, "#EEF4D8"), (.5, col), (1, "#6EA444")], -190, 0, 160, 0, "userSpaceOnUse")
        o += solid(doc, rot, stalk, g, "#6E9A44", "#3E6A24", lw=2, k=5, op=.6)
        for r in (-5, 3):
            o += P(taper([(-170, dy + r), (120, dy * .6 + r * .5)], 1.4, .1, .4), "#6E9A44", opacity=.5)
        o += P(taper([(-180, dy - w / 2 + 4), (60, dy - w / 2 + 5)], 3, .2, .4), "#fff", opacity=.6)
    o += solid(doc, rot, boxy([(-110, -38), (-80, -38), (-80, 40), (-110, 40)]), doc.lin(GOLD, 0, 0, 1, 0), "#B8841C", GOLD_LN, lw=2)
    return o


def abacus(doc, rot, bite=False):
    """算盤: the bathhouse cashier's old abacus — a rosewood frame with gold corners, the beam, seven
    brass rods of ebony beads (two above the beam, five below), a few pushed up as if counting"""
    o = ""
    W, H_ = 300, 170
    beam = -H_ / 2 + 52
    fr = boxy([(-W / 2 - 14, -H_ / 2 - 14), (W / 2 + 14, -H_ / 2 - 14), (W / 2 + 14, H_ / 2 + 14), (-W / 2 - 14, H_ / 2 + 14)], corner=8)
    inner = [(-W / 2, -H_ / 2), (W / 2, -H_ / 2), (W / 2, H_ / 2), (-W / 2, H_ / 2)]
    o += P(poly(inner), "#3A2418", opacity=.35)
    rods = [-W / 2 + 22 + i * ((W - 44) / 6) for i in range(7)]
    for x in rods:
        o += P(taper([(x, -H_ / 2), (x, H_ / 2)], 3, 0, 0), "#C9A04A")
    bead = lambda x, y: (P(smooth([(x - 19, y), (x, y - 11), (x + 19, y), (x, y + 11)]), doc.lin([(0, "#6A4A3A"), (.5, "#2A1810"), (1, "#120A06")], 0, 0, 0, 1))
                         + P(taper([(x - 10, y - 4), (x + 6, y - 6)], 2.4, .3, .3), "#B89078", opacity=.8))
    for i, x in enumerate(rods):
        up = i in (1, 4)
        o += bead(x, beam - 14 if up else -H_ / 2 + 12) + bead(x, beam - 36 if up else -H_ / 2 + 34)
        counted = i in (2, 5)
        for k in range(4):
            y = H_ / 2 - 12 - k * 22
            if counted and k == 3:
                y = beam + 16
            o += bead(x, y)
    # the frame card with its beam, over the rods' ends
    frame = f'<path d="{smooth(fr)} {poly([(-W / 2, -H_ / 2), (-W / 2, beam - 6), (W / 2, beam - 6), (W / 2, -H_ / 2)])} {poly([(-W / 2, beam + 6), (-W / 2, H_ / 2), (W / 2, H_ / 2), (W / 2, beam + 6)])}" fill-rule="evenodd" fill="{doc.lin([(0, "#9A5A3A"), (.5, "#6E3A22"), (1, "#3E1E10")], 0, 0, 1, 1)}"/>'
    o += frame
    o += P(outline(fr, 2.6, 1.2), "#2A140A")
    o += P(taper([(-W / 2 - 8, -H_ / 2 - 8), (W / 2 + 4, -H_ / 2 - 8)], 4, .1, .3), "#D8A07A", opacity=.7)
    for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        cx, cy = sx * (W / 2 + 7), sy * (H_ / 2 + 7)
        o += f'<rect x="{cx - 13}" y="{cy - 13}" width="26" height="26" rx="3" fill="{doc.lin(GOLD, 0, 0, 1, 1)}" stroke="{GOLD_LN}" stroke-width="1.6"/>'
    return o


def stethoscope(doc, rot, bite=False):
    """聽診器: a stethoscope hung by its Y — the silver ear tubes and tips at the top (-y), the dark
    tube looping down, the gold chest piece with its pale face at the bottom. Grip = the Y."""
    o = ""
    tube = [(0, 10), (4, 90), (-30, 160), (-20, 220), (40, 236), (80, 200)]
    o += P(taper(tube, 22, 0, 0, n=20), "#1C1830")
    o += P(taper(tube, 16, 0, 0, n=20), doc.lin([(0, "#4A4466"), (1, "#2A2346")], 0, 0, 1, 0))
    o += P(taper([(p[0] - 4, p[1]) for p in tube[:4]], 4, .2, .3), "#8C86B0", opacity=.8)
    for side in (-1, 1):
        ear = [(0, 10), (side * 26, -40), (side * 46, -110), (side * 40, -150)]
        o += P(taper(ear, 13, 0, 0), "#5E5A84") + P(taper(ear, 9, 0, 0), doc.lin([(0, "#F4F4FA"), (1, "#9A96C0")], 0, 0, 1, 0))
        o += f'<circle cx="{side * 40}" cy="-156" r="12" fill="#2A2346"/><circle cx="{side * 40 - 3}" cy="-159" r="4" fill="#8C86B0"/>'
    o += f'<circle cx="0" cy="12" r="12" fill="{doc.lin(GOLD, 0, 0, 1, 1)}" stroke="{GOLD_LN}" stroke-width="1.6"/>'
    c = (92, 186)
    ch = ellipse_pts(c[0], c[1], 44, 44, 18)
    o += solid(doc, rot, ch, doc.rad(GOLD, .35, .3, .7), "#B8841C", GOLD_LN, lw=2.2)
    o += f'<circle cx="{c[0]}" cy="{c[1]}" r="28" fill="{doc.rad([(0, "#FFFFFF"), (1, "#C8C4E4")], .35, .3, .7)}" stroke="#9A96C0" stroke-width="2"/>'
    o += glint(c[0] - 12, c[1] - 12, 9)
    return o


def gold_lock(doc, rot, bite=False):
    """金鎖片: a gold 長命鎖 on its red cord — the 如意-cloud lock plate in foil with a raised rim and a
    little peach in relief, three gold bells at its foot. Grip = the cord's top; the plate hangs
    at +y."""
    o = ""
    cord = [(-50, 90), (-56, 30), (-30, -6), (0, -12), (30, -6), (56, 30), (50, 90)]
    o += P(taper(cord, 10, 0, 0), "#8E1E18") + P(taper(cord, 6, 0, 0), "#D83A2E")
    for k in range(6):
        p = cord[k]
        o += f'<circle cx="{p[0]}" cy="{p[1]}" r="2.6" fill="#FF8A70" opacity=".8"/>'
    oy = 150
    plate = [(-96, oy - 40), (-120, oy - 34), (-124, oy - 6), (-104, oy + 18), (-80, oy + 22), (-74, oy + 52), (-40, oy + 62), (0, oy + 46),
             (40, oy + 62), (74, oy + 52), (80, oy + 22), (104, oy + 18), (124, oy - 6), (120, oy - 34), (96, oy - 40), (60, oy - 70), (0, oy - 76), (-60, oy - 70)]
    if bite:
        plate = plate[:15] + [(96, oy - 40), (78, oy - 56), (70, oy - 48), (56, oy - 66), (0, oy - 76), (-60, oy - 70)]
    o += solid(doc, rot, plate, doc.lin(GOLD, 0, 0, 1, 1), "#B8841C", GOLD_LN, lw=2.6, k=12)
    rim = [(x * .78, oy + (y - oy) * .78) for x, y in plate]
    o += P(outline(rim, 2.2, 1), "#C8962E", opacity=.9)
    # a peach in relief
    pc = (0, oy - 6)
    pe = [(pc[0], pc[1] - 30), (pc[0] + 22, pc[1] - 12), (pc[0] + 18, pc[1] + 14), (pc[0], pc[1] + 22), (pc[0] - 18, pc[1] + 14), (pc[0] - 22, pc[1] - 12)]
    o += P(smooth(pe), doc.lin([(0, "#FFF6C8"), (1, "#E0AA44")], 0, 0, 1, 1)) + P(outline(pe, 1.6, 1), GOLD_LN)
    o += P(smooth([(pc[0] - 4, pc[1] - 26), (pc[0] - 22, pc[1] - 32), (pc[0] - 14, pc[1] - 20)]), "#7A9A3A")
    for bx in (-50, 0, 50):
        by = oy + 70 + (12 if bx == 0 else 0)
        o += P(taper([(bx, by - 18), (bx, by - 4)], 2, 0, 0), GOLD_LN)
        bell = [(bx - 13, by + 10), (bx - 10, by - 4), (bx, by - 9), (bx + 10, by - 4), (bx + 13, by + 10)]
        o += solid(doc, rot, bell, doc.lin(GOLD, 0, 0, 1, 1), "#B8841C", GOLD_LN, lw=1.6, k=4)
    o += glint(-60, oy - 40, 12) + glint(70, oy + 30, 7)
    return o


TREASURES = {1: drumstick, 2: paintbrush, 3: book, 4: microphone, 5: scallion, 6: stamp, 7: celery, 8: abacus, 9: stethoscope, 10: gold_lock}


# ------------------------------------------------------------- the frames
# Per treasure (local units): the point that goes in his mouth (C) and where his near and far
# hands grip it.
HOLD = {
    1: dict(tip=(-222, -6), n=(96, 2), f=(150, 6)),
    2: dict(tip=(208, 0), n=(30, 0), f=(110, 0)),
    3: dict(tip=(70, -92), n=(-70, 40), f=(70, 30), cf=(30, 60), one=True),
    4: dict(tip=(-160, 0), n=(50, 0), f=(110, 0)),
    5: dict(tip=(124, 20), n=(-100, 2), f=(-30, 0)),
    6: dict(tip=(180, 0), n=(30, 0), f=(100, 0)),
    7: dict(tip=(-120, 2), n=(-70, 0), f=(0, 0)),
    8: dict(tip=(160, -90), n=(-168, 10), f=(20, 70), cf=(40, 80), one=True),
    9: dict(tip=(92, 160), n=(0, 14), f=(-10, 120)),
    10: dict(tip=(96, 110), n=(0, -12), f=(-52, 70)),
}
# Per chapter: A — where the treasure is held up (centre, rotation, scale); C — its rotation and
# scale at his mouth; B — where it lies on the floor ahead of him.
SPEC = {
    1: dict(A=dict(at=(250, -650), rot=95, s=1.3), C=dict(rot=50, s=.8), B=dict(c=(140, -40), rot=-8, s=.9)),
    2: dict(A=dict(at=(250, -660), rot=95, s=1.15), C=dict(rot=200, s=.9), B=dict(c=(140, -24), rot=-6, s=1.0)),
    3: dict(A=dict(at=(230, -650), rot=-8, s=1.0), C=dict(rot=18, s=.85), B=dict(c=(140, -60), rot=-80, s=.9)),
    4: dict(A=dict(at=(250, -660), rot=95, s=1.15), C=dict(rot=50, s=.85), B=dict(c=(140, -30), rot=-6, s=1.0)),
    5: dict(A=dict(at=(250, -660), rot=-80, s=1.15), C=dict(rot=170, s=.9), B=dict(c=(140, -44), rot=-6, s=1.0)),
    6: dict(A=dict(at=(250, -660), rot=95, s=1.15), C=dict(rot=200, s=.9), B=dict(c=(140, -60), rot=-90, s=1.0)),
    7: dict(A=dict(at=(250, -660), rot=-80, s=1.15), C=dict(rot=-20, s=.9), B=dict(c=(140, -40), rot=-6, s=1.0)),
    8: dict(A=dict(at=(220, -640), rot=-12, s=.8), C=dict(rot=16, s=.75), B=dict(c=(140, -100), rot=0, s=.85)),
    9: dict(A=dict(at=(250, -700), rot=-8, s=1.0), C=dict(rot=-150, s=.9), B=dict(c=(140, -40), rot=-90, s=1.0)),
    10: dict(A=dict(at=(270, -1000), rot=-24, s=.9), C=dict(rot=-150, s=.9), B=dict(c=(90, -60), rot=-70, s=.85)),
}


def place(t, q):
    """a treasure's local point in photo space"""
    v = rotv((q[0] * t["s"], q[1] * t["s"]), t["rot"])
    return (t["c"][0] + v[0], t["c"][1] + v[1])


def treasure(doc, ch, t):
    return grp(t["c"], t["rot"], TREASURES[ch](doc, t["rot"], t.get("bite", False)), t["s"])


def mouth(p):
    """where his mouth is, in the pose's space (the head's mouth at x 200 slides with the turn)"""
    F = BK.torso_frame(p["hip"], p.get("torso", 0))
    h = p["head"]
    piv = (F.o[0] + h.get("dx", 14), F.o[1] + h.get("dy", 8))
    v = rotv((176 * math.sin(-h.get("turn", BK.TURN)) * h.get("scale", 1), -60 * h.get("scale", 1)), h.get("rot", 0))
    return (piv[0] + v[0], piv[1] + v[1])


def holding(p, ch, t, frame):
    """his hands on the treasure's grips (the arms are IK'd to them)"""
    hd = dict(HOLD[ch])
    if frame == "C":
        hd["n"], hd["f"] = hd.get("cn", hd["n"]), hd.get("cf", hd["f"])
    F = BK.torso_frame(p["hip"], p.get("torso", 0))
    for side, S in (("n", F(BK.SHN)), ("f", F(BK.SHF))):
        g = place(t, hd[side])
        # the IK target is the wrist: the palm's middle is ≈ 40 units on, toward the grip
        L = dist(S, g) or 1
        w = (g[0] - 40 * (g[0] - S[0]) / L, g[1] - 40 * (g[1] - S[1]) / L)
        spec = p["arms"][side]
        if "ik" not in spec and "a1" in spec:
            continue            # this hand rests: it holds nothing
        reach = (BK.UA + BK.FA) * spec.get("reach", 1.0)
        if dist(S, w) > reach + 1:
            print(f"  photo{ch} {frame} {side}: grip {dist(S, w) - reach:.0f} units out of reach")
        spec["ik"] = w
    p.setdefault("extra", {})["prop"] = lambda d: treasure(d, ch, t)
    return p


def anchored(t, ch, side="n"):
    """a spec that gives where his `side` hand grips (`at`) instead of the treasure's centre"""
    if "at" in t:
        g = rotv((HOLD[ch][side][0] * t["s"], HOLD[ch][side][1] * t["s"]), t["rot"])
        t["c"] = (t["at"][0] - g[0], t["at"][1] - g[1])
    return t


STANDING = {10}     # the photo of the first steps (10-6): he is on his feet in A and B


def frame_A(ch):
    t = anchored(dict(SPEC[ch]["A"]), ch)
    hip, legs = BK.sit_base()
    if ch in STANDING:
        hip, legs = (0, -BK.ANK - 300), BK.stand_legs(xn=40, xf=-40)
    p = dict(hip=hip, torso=-8, legs=legs, shadow_w=230 if ch not in STANDING else 190, shadow_x=60 if ch not in STANDING else 0,
             arms={"n": dict(bend=-1, hand="hold", ha=-90, reach=1.25), "f": dict(bend=-1, hand="hold", ha=-90, reach=1.25)},
             head=dict(expr="wow", rot=-14, turn=-.38, look=(10, -10), dx=6, dy=8),
             order=["arm_f", "leg_f", "torso", "leg_n", "sleeve_n", "head", "prop", "hand_n"])
    p = holding(p, ch, t, "A")
    # two glints off it: the treasure caught in the flash
    gl = place(t, HOLD[ch]["tip"])
    p["extra"]["glints"] = glint(gl[0] + 40, gl[1] - 60, 26) + glint(gl[0] - 50, gl[1] - 20, 15, op=.85)
    p["order"] = p["order"] + ["glints"]
    return p


def frame_C(ch):
    t = dict(SPEC[ch]["C"], bite=True)
    hip, legs = BK.sit_base()
    p = dict(hip=hip, torso=-2, legs=legs, shadow_w=230, shadow_x=60,
             arms={"n": dict(bend=-1, hand="hold", ha=-100), "f": dict(bend=-1, hand="hold", ha=-100)},
             head=dict(expr="chomp", rot=6, turn=-.5, dx=14, dy=8),
             order=["arm_f", "leg_f", "torso", "leg_n", "head", "prop", "sleeve_n", "hand_n"])
    # the bitten end in his mouth
    if HOLD[ch].get("one"):
        # a wide treasure held to his mouth by the far hand; the near hand rests in his lap
        p["arms"]["n"] = dict(a1=14, a2=50, hand="open", ha=-20)
    m = mouth(p)
    tip = rotv((HOLD[ch]["tip"][0] * t["s"], HOLD[ch]["tip"][1] * t["s"]), t["rot"])
    t["c"] = (m[0] - tip[0], m[1] - tip[1])
    return holding(p, ch, t, "C")


BABY_B = -330      # B: where he crawls in, left of the photo's centre


def frame_B(ch):
    t = SPEC[ch]["B"]
    if ch in STANDING:
        # his first steps: a wobbly walking step toward it, arms out for balance, beaming
        p = BK.walk(0.3)
        p["arms"] = {"n": dict(a1=70, a2=110, hand="open", ha=10), "f": dict(a1=110, a2=140, hand="open", ha=10)}
        p["head"] = dict(expr="laugh", rot=-8, look=(6, 0))
    else:
        p = BK.crawl(0.25)
        F = BK.torso_frame(p["hip"], p["torso"])
        S_n = F(BK.SHN)
        # the near hand stretched out toward the treasure, lifted off the floor
        p["arms"]["n"] = dict(ik=(S_n[0] + 200, -110), bend=-1, hand="open", ha=-80)
        p["head"] = dict(expr="happy", rot=-24, dx=40, dy=30, look=(10, 2))

    def build(doc):
        return (drop_shadow(doc, 110 * t["s"], y=4, x=t["c"][0]) + treasure(doc, ch, t)
                + grp((BABY_B, 0), 0, BK.figure(doc, p)))
    return build


def register(poses, vb, pt):
    for ch in SPEC:
        poses[f"photo{ch}"] = ((lambda ch: lambda k: [frame_A, frame_B, frame_C][k](ch))(ch), 3, f"第{ch}章 合照 A／B／C", None)
        vb[f"photo{ch}"] = PHOTO_VB
        pt[f"photo{ch}"] = PHOTO_PT
