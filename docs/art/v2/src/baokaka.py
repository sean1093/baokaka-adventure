"""baokaka.py - 寶咖咖 (12-month-old Taiwanese boy) in the v2 TV-anime style.

Likeness targets (from the owner's photo, described - the photo is never
embedded): fine straight jet-black hair swept down-left from a crown whorl at
the upper right, high forehead, thin wispy sides; very round full face with
big cheeks and a soft chin roll; narrow dark almond monolid eyes; short soft
straight brows; small wide button nose; small pouty lips; fair warm skin with
rosy cheeks.

Head space: face centre x=200, chin ~y418.  Functions return SVG fragments.
"""
import math
import numpy as np
from geom import *

# ---------------------------------------------------------------- palette
SKIN = "#FFEADF"; SKIN_SH = "#F3C3B0"; SKIN_SH2 = "#E6A08C"; SKIN_LN = "#A85B4A"; SKIN_HL = "#FFF8F2"
BLUSH = "#F4978C"
HAIR = "#25222A"; HAIR_DK = "#16131A"; HAIR_DK2 = "#0B090D"; HAIR_HL = "#5C6276"; HAIR_HL2 = "#9AA2BA"; HAIR_LN = "#08070A"
IRIS_D = "#0C090B"; IRIS_M = "#251A1A"; IRIS_L = "#4E3A33"; IRIS_R = "#7C6152"
LASH = "#121014"; WHITE_SH = "#D9D0DC"
MOUTH = "#9A3E38"; TONGUE = "#F08C84"; LIP = "#EE9E94"; LIP_DK = "#D27A72"
CX = 200
TURN = 0.0      # head turn in radians (+ = face turns toward viewer-left)
RCYL = 176.0
LOOK = (0.0, 0.0)   # gaze offset in head units, set by head(look=...)


def tx(x):
    """cylindrical remap of an x coordinate for the current head turn"""
    if not TURN:
        return x
    u = max(-1.0, min(1.0, (x - CX) / RCYL))
    return CX + RCYL * math.sin(math.asin(u) - TURN)


def tk(x):
    if not TURN:
        return 1.0
    u = max(-.999, min(.999, (x - CX) / RCYL))
    th = math.asin(u)
    return max(.05, math.cos(th - TURN) / math.cos(th))


def feat(x, inner):
    """wrap a feature centred at x so it slides and foreshortens with TURN"""
    if not TURN:
        return inner
    return f'<g transform="translate({tx(x):.2f},0) scale({tk(x):.3f},1) translate({-x},0)">{inner}</g>'


# ------------------------------------------------------------------ face
def face_pts():
    # very round and full: widest at the cheeks (below the eyes), soft full chin
    R = [(200, 58), (262, 66), (312, 100), (338, 156), (346, 218), (358, 280),
         (362, 326), (350, 366), (318, 398), (266, 418), (200, 424)]
    L = mirror(R[1:-1], CX)[::-1]
    pts = R + L
    if TURN:
        sh = -RCYL * math.sin(TURN) * .40
        out = []
        for x, y in pts:
            w = max(0.0, min(1.0, (y - 170) / 230)) ** 1.2
            far = (x < CX) == (TURN > 0)
            bul = (9 if far else -4) * math.sin(math.pi * max(0, min(1, (y - 240) / 160))) * abs(TURN) / .35
            out.append((x + sh * w + (-bul if x < CX else bul), y))
        pts = out
    return pts


def ear(doc, side=1):
    """ears sit low (eye-to-nose level) and only peek out of the round face"""
    s = side

    def X(x): return CX + s * (x - CX)
    pts = [(X(338), 254), (X(354), 240), (X(374), 246), (X(384), 270), (X(380), 300),
           (X(364), 322), (X(346), 328), (X(336), 316)]
    d = smooth(pts)
    o = P(d, SKIN)
    o += cel(doc, d, SKIN_SH, shift=(-10 * s, 4))
    o += clipped(doc, d, f'<ellipse cx="{X(340)}" cy="284" rx="14" ry="40" fill="{SKIN_SH2}" opacity=".45" filter="{doc.blur(5)}"/>')
    o += P(taper([(X(352), 258), (X(370), 262), (X(372), 284), (X(362), 306), (X(348), 312)], 2.0, .3, .3), SKIN_LN, opacity=.75)
    o += P(smooth([(X(352), 272), (X(362), 278), (X(360), 298), (X(350), 304), (X(346), 288)]), "#EBA392", opacity=.6)
    o += P(outline(pts, 2.0, 1.3, gaps=[(.86, 1.0)]), SKIN_LN)
    return o


# ------------------------------------------------------------------ eyes
def eye(doc, mode="open", side=-1, tear=False):
    """Narrow almond monolid eye with a very dark iris, anime-stylised:
    larger and glossier than life but keeping the almond shape."""
    cx = CX + side * 66
    s = -side   # +1: toward the nose

    def X(x): return cx + s * x
    out = ""
    if mode in ("open", "teary", "wide"):
        wide = mode == "wide"
        # inner corner low, outer corner slightly higher; gentle upper arc
        upper = [(X(33), 272), (X(24), 258), (X(6), 248 - 5 * wide), (X(-14), 246 - 6 * wide), (X(-30), 252), (X(-37), 260)]
        lower = [(X(-37), 262), (X(-26), 276 + 3 * wide), (X(-6), 283 + 4 * wide), (X(14), 282 + 4 * wide), (X(28), 277)]
        shape = upper + lower
        d = smooth(shape)
        clip = doc.clip(d)
        ix, iy = cx - s * 1 + LOOK[0], 266 + LOOK[1]
        rx, ry = 19.5, 22 + 2 * wide
        o = P(d, "#FBFAFC")
        o += f'<g clip-path="{clip}">'
        o += P(smooth(upper + [(X(-44), 236), (X(44), 236)]), WHITE_SH, opacity=.9, transform="translate(0,7)", filter=doc.blur(2.2))
        ig = doc.lin([(0, IRIS_D), (.5, IRIS_M), (.82, IRIS_L), (1, IRIS_R)], 0, iy - ry, 0, iy + ry, "userSpaceOnUse")
        o += f'<ellipse cx="{ix}" cy="{iy}" rx="{rx}" ry="{ry}" fill="{ig}"/>'
        for k in range(12):
            a = math.pi * 2 * k / 12 + .3
            p0 = (ix + math.cos(a) * 9, iy + math.sin(a) * 10)
            p1 = (ix + math.cos(a) * rx * .9, iy + math.sin(a) * ry * .9)
            o += P(taper([p0, p1], 1.2, .3, .5), "#000", opacity=.25)
        o += f'<ellipse cx="{ix}" cy="{iy + ry*.5}" rx="{rx*.7}" ry="{ry*.3}" fill="{IRIS_R}" opacity=".55" filter="{doc.blur(3)}"/>'
        o += f'<ellipse cx="{ix}" cy="{iy+1}" rx="9" ry="10.5" fill="#050405"/>'
        # lid shadow over the top of the eye (monolid: deep and soft)
        o += P(smooth(upper + [(X(-46), 210), (X(46), 210)]), "#1A1012", opacity=.55, transform="translate(0,8)", filter=doc.blur(3))
        # glossy catchlights: large tilted oval, small round, wet line
        o += f'<ellipse cx="{ix - s*7}" cy="{iy - 8}" rx="7" ry="8.5" fill="#fff" transform="rotate({-25*s} {ix - s*7} {iy-8})"/>'
        o += f'<circle cx="{ix + s*8}" cy="{iy + 9}" r="3" fill="#fff" opacity=".9"/>'
        o += f'<ellipse cx="{ix + s*2}" cy="{iy + 14}" rx="9" ry="2.2" fill="#B8C4E0" opacity=".22"/>'
        if tear or mode == "teary":
            o += P(taper([(X(-30), 276), (X(-8), 284), (X(14), 283), (X(26), 277)], 3.4, .3, .3), "#fff", opacity=.95)
            o += f'<circle cx="{ix + s*10}" cy="{iy + 3}" r="2.4" fill="#fff"/><circle cx="{ix - s*12}" cy="{iy + 6}" r="1.8" fill="#fff"/>'
        o += "</g>"
        # upper lid: one strong lash mass, thick toward the outer corner, tiny flick
        o += P(taper(upper, 6.2, .14, .04, prof=lambda t: .6 + .6 * t), LASH)
        o += P(taper([(X(-34), 256), (X(-40), 255)], 2.0, 0, .9), LASH)
        # inner-corner fold (epicanthic) + puffy monolid suggested by a soft shadow, no crease
        o += P(taper([(X(36), 276), (X(31), 268), (X(26), 262)], 1.8, .2, .6), SKIN_LN, opacity=.7)
        o += P(smooth([(X(30), 252), (X(8), 238), (X(-18), 236), (X(-36), 246), (X(-14), 244), (X(10), 244)]), SKIN_SH, opacity=.55, filter=doc.blur(2.5))
        # lower lid: soft, thin, broken
        o += P(taper([(X(-34), 266), (X(-22), 279), (X(-6), 284)], 1.8, .2, .6), LASH, opacity=.75)
        o += P(taper([(X(4), 285), (X(18), 282), (X(26), 278)], 1.3, .5, .5), SKIN_LN, opacity=.55)
        # puffy under-eye (baby fat)
        o += P(smooth([(X(-28), 290), (X(0), 298), (X(26), 290), (X(0), 294)]), SKIN_SH, opacity=.45, filter=doc.blur(2))
        out += o
    elif mode == "smile":     # happy closed arcs, narrow
        arc = [(X(32), 272), (X(16), 260), (X(-6), 256), (X(-26), 261), (X(-38), 270)]
        out += P(taper(arc, 6.2, .2, .2, prof=lambda t: .7 + .5 * t), LASH)
        out += P(taper([(X(-20), 280), (X(0), 286), (X(20), 281)], 1.4, .4, .4), SKIN_LN, opacity=.55)
    elif mode == "squeeze":   # crying > <
        out += P(taper([(X(34), 258), (X(4), 268), (X(-30), 272)], 5.5, .2, .4), LASH)
        out += P(taper([(X(30), 286), (X(4), 274), (X(-28), 276)], 4.0, .2, .5), LASH)
    elif mode == "closed":    # asleep: soft downward lid lines with lashes
        out += P(taper([(X(32), 270), (X(10), 278), (X(-14), 279), (X(-36), 272)], 5, .2, .15), LASH)
        for k in range(3):
            x0 = X(-6 - k * 11)
            out += P(taper([(x0, 278), (x0 - s * 3, 286)], 1.6, .1, .6), LASH, opacity=.8)
    elif mode == "sleepy":
        out += P(taper([(X(32), 272), (X(4), 278), (X(-36), 270)], 5.5, .2, .2), LASH)
    return out


def brows(doc, mode="soft", only=None):
    """short, soft, straight - drawn as feathered strokes on the forehead"""
    o = ""
    for side in ((-1, 1) if only is None else (only,)):
        cx = CX + side * 66
        s = -side

        def X(x): return cx + s * x
        if mode == "soft":
            pts = [(X(28), 220), (X(8), 216), (X(-18), 217)]
        elif mode == "worried":
            pts = [(X(30), 210), (X(8), 216), (X(-18), 222)]
        elif mode == "up":
            pts = [(X(28), 206), (X(6), 200), (X(-18), 203)]
        else:
            pts = [(X(28), 224), (X(6), 220), (X(-18), 220)]
        o += P(taper(pts, 7.5, .35, .5), HAIR, opacity=.32, filter=doc.blur(1.2))
        o += P(taper(pts, 3.6, .3, .6), HAIR, opacity=.75)
        for k in range(4):   # feathered hairs
            t = .2 + k * .2
            px = pts[0][0] + (pts[2][0] - pts[0][0]) * t
            py = pts[0][1] + (pts[2][1] - pts[0][1]) * t
            o += P(taper([(px, py + 3), (px - s * 6, py - 3)], 1.2, .3, .5), HAIR, opacity=.6)
    return o


def nose(doc):
    """small, wide button nose: soft underside shadow, two tiny nostrils, a
    glossy tip highlight"""
    o = f'<ellipse cx="203" cy="318" rx="22" ry="8" fill="{SKIN_SH}" opacity=".85" filter="{doc.blur(3)}"/>'
    o += P(taper([(184, 314), (190, 318), (196, 317)], 2.2, .4, .4), SKIN_LN, opacity=.7)
    o += P(taper([(204, 317), (210, 318), (216, 314)], 2.4, .4, .4), SKIN_LN, opacity=.8)
    o += P(taper([(214, 298), (220, 308), (218, 316)], 2.0, .4, .5), SKIN_LN, opacity=.35)
    o += f'<ellipse cx="198" cy="304" rx="4.5" ry="3" fill="#FFF6EE" opacity=".55" filter="{doc.blur(1.4)}"/>'
    return o


def mouth(doc, mode="pout"):
    o = ""
    if mode == "pout":       # the photo's small pouty lips
        lower = [(186, 352), (200, 350), (214, 352), (210, 362), (200, 365), (190, 362)]
        o += P(smooth(lower), LIP)
        o += P(smooth([(184, 350), (192, 345), (200, 347), (208, 345), (216, 350), (200, 352)]), LIP_DK)
        o += P(taper([(182, 351), (192, 347), (200, 349), (208, 347), (218, 351)], 2.4, .3, .3), SKIN_LN)
        o += f'<ellipse cx="198" cy="356" rx="6" ry="2" fill="#fff" opacity=".7"/>'
        o += P(taper([(190, 370), (200, 372), (210, 370)], 1.3, .4, .4), SKIN_LN, opacity=.35)
    elif mode == "smile":
        sh = [(182, 346), (200, 349), (218, 346), (213, 359), (200, 364), (187, 359)]
        d = smooth(sh)
        o += P(d, MOUTH)
        o += clipped(doc, d, f'<ellipse cx="200" cy="366" rx="14" ry="8" fill="{TONGUE}"/>')
        o += P(taper([(178, 343), (190, 348), (200, 349), (210, 348), (222, 343)], 2.4, .3, .3), SKIN_LN)
        o += P(smooth([(188, 364), (200, 368), (212, 364), (200, 372)]), LIP, opacity=.7)
    elif mode == "laugh":
        sh = [(174, 340), (200, 344), (226, 340), (222, 362), (210, 376), (200, 379), (190, 376), (178, 362)]
        d = smooth(sh)
        o += P(d, MOUTH)
        o += clipped(doc, d, f'<ellipse cx="200" cy="382" rx="20" ry="13" fill="{TONGUE}"/>'
                     f'<ellipse cx="200" cy="354" rx="16" ry="7" fill="#5E211B" opacity=".6" filter="{doc.blur(3)}"/>')
        o += P(taper([(170, 336), (186, 343), (200, 344), (214, 343), (230, 336)], 2.6, .25, .25), SKIN_LN)
        o += P(outline(sh, 1.6, .8), SKIN_LN, opacity=.85)
    elif mode == "o":
        sh = ellipse_pts(200, 356, 8, 10, 10)
        d = smooth(sh)
        o += P(d, MOUTH) + clipped(doc, d, f'<ellipse cx="200" cy="365" rx="7" ry="5" fill="{TONGUE}"/>')
        o += P(outline(sh, 1.8, 1), SKIN_LN)
        o += P(smooth([(190, 366), (200, 370), (210, 366), (200, 373)]), LIP, opacity=.7)
    elif mode == "cry":
        sh = [(178, 352), (190, 344), (200, 343), (210, 344), (222, 352), (218, 372), (200, 380), (182, 372)]
        d = smooth(sh)
        o += P(d, MOUTH)
        o += clipped(doc, d, f'<ellipse cx="200" cy="380" rx="16" ry="10" fill="{TONGUE}"/>')
        o += P(outline(sh, 2.0, 1), SKIN_LN)
    elif mode == "frown":
        o += P(taper([(186, 356), (194, 350), (200, 350), (206, 350), (214, 356)], 2.4, .3, .3), SKIN_LN)
        o += P(smooth([(190, 357), (200, 355), (210, 357), (200, 363)]), LIP, opacity=.8)
    return o


# ------------------------------------------------------------------ hair
WHORL = (300, 34)        # crown whorl at the upper right
# skull dome kept close to the head: fine, straight, not voluminous
DOME = [(46, 246), (36, 214), (30, 176), (34, 132), (50, 92), (80, 56), (130, 28), (196, 14), (260, 16),
        (316, 36), (352, 74), (372, 124), (378, 180), (374, 226), (366, 250)]
# side-swept fringe, right -> left: tips lean down-left, the hairline rises
# toward the right so the high forehead shows.  (x, y, kind)
FRINGE = [
    (358, 258, "t"), (350, 200, "n"), (334, 152, "t"), (322, 108, "n"), (278, 142, "t"),
    (266, 104, "n"), (214, 158, "t"), (206, 118, "n"), (148, 178, "t"), (142, 140, "n"),
    (90, 200, "t"), (84, 168, "n"), (58, 236, "t"), (54, 206, "n"), (50, 262, "t"),
]


def _fr():
    return [(tx(x) if 40 < x < 360 else x, y, k) for x, y, k in FRINGE]


def _seg_ctrl(prev, x, y, k):
    mx, my = (prev[0] + x) / 2, (prev[1] + y) / 2
    if k == "t":   # notch -> tip: outer edge of a clump, bowed so it sweeps left
        return (mx + 14, my - 10)
    return (mx - 6, my + 8)


def _fringe_path():
    d = smooth(DOME, closed=False)
    prev = DOME[-1]
    for x, y, k in _fr():
        c = _seg_ctrl(prev, x, y, k)
        d += f" Q{f(c[0])},{f(c[1])} {f(x)},{f(y)}"
        prev = (x, y)
    mx, my = (prev[0] + DOME[0][0]) / 2, (prev[1] + DOME[0][1]) / 2
    d += f" Q{f(mx - 4)},{f(my)} {f(DOME[0][0])},{f(DOME[0][1])}Z"
    return d


def hair(doc, layer="front"):
    o = ""
    whole = _fringe_path()
    if layer == "back":
        return o
    gH = doc.lin([(0, "#3A3744"), (.3, HAIR), (.75, HAIR), (1, HAIR_DK)], 0, 0, 0, 260, "userSpaceOnUse")
    # fine wisps escaping at the temples and over the ears (thin hairline)
    wisps = [([(40, 214), (30, 240), (30, 268)], 7), ([(52, 236), (46, 258), (50, 280)], 5),
             ([(370, 214), (378, 240), (376, 266)], 7), ([(360, 240), (364, 262), (360, 282)], 5),
             ([(320, 22), (340, 6), (356, 2)], 6), ([(306, 22), (316, 0), (330, -10)], 7)]
    if TURN < -.2:      # face turned right: the right temple is behind the cheek
        wisps = [w for w in wisps if not (w[0][0][0] > 340 and w[0][0][1] > 200)]
    if TURN > .2:
        wisps = [w for w in wisps if not (w[0][0][0] < 60 and w[0][0][1] > 200)]
    for pts, w in wisps:
        o += P(strand(pts, w, bulge=.2), HAIR)
        o += P(taper(pts, 1.4, .1, .6), HAIR_LN, opacity=.8)
    o += P(whole, gH)
    inner = ""
    # sphere form shadow (lit from the upper left)
    inner += P(whole, HAIR_DK2, opacity=.7, mask=doc.mask(
        f'<path d="{whole}" fill="#fff"/><ellipse cx="170" cy="96" rx="214" ry="140" fill="#000"/>'))
    # separation lines from each notch toward the whorl + soft wedges
    notches = [(x, y) for x, y, k in _fr() if k == "n"]
    for i, (x, y) in enumerate(notches):
        dx, dy = WHORL[0] - x, WHORL[1] - y
        reach = .38 + .2 * ((i * 7) % 3) / 2
        p0 = (x, y)
        p2 = (x + dx * reach, y + dy * reach)
        p1 = ((p0[0] + p2[0]) / 2 - 10, (p0[1] + p2[1]) / 2 + 4)
        inner += P(strand([p0, p1, p2], 12, bulge=.2, tip=1.3), "#000", opacity=.5, transform="translate(-4,2)", filter=doc.blur(1.6))
        inner += P(taper([p0, p1, p2], 2.0, .02, .6), HAIR_LN, opacity=.9)
        q0 = (x + 14, y + 18)
        q2 = (q0[0] + dx * .2, q0[1] + dy * .2)
        inner += P(taper([q0, ((q0[0] + q2[0]) / 2 - 4, (q0[1] + q2[1]) / 2), q2], 1.2, .1, .6), "#4A4C5C", opacity=.6)
    # fine strand texture: thin cool-grey lines flowing from the whorl
    for k in range(22):
        a = math.pi * (.62 + .9 * k / 21)
        r0, r1 = 40 + (k % 3) * 12, 150 + (k % 4) * 18
        p0 = (WHORL[0] + math.cos(a) * r0, WHORL[1] + math.sin(a) * r0 * .9)
        p1 = (WHORL[0] + math.cos(a) * r1, WHORL[1] + math.sin(a) * r1 * .9)
        pm = ((p0[0] + p1[0]) / 2 + 8, (p0[1] + p1[1]) / 2 - 6)
        inner += P(taper([p0, pm, p1], 1.1, .3, .4), "#555A6C", opacity=.45)
    # tips darken where the fringe lies on the forehead
    for x, y, k in _fr():
        if k == "t":
            inner += f'<ellipse cx="{x+6}" cy="{y-8}" rx="16" ry="18" fill="#000" opacity=".35" filter="{doc.blur(6)}"/>'
    # angel ring: black hair needs a crisp cool highlight to read
    up, lo, lo2 = [], [], []
    N = 34
    rnd = [0.9, 0.35, 1.0, 0.5, 0.75, 0.3, 0.95, 0.45, 0.8, 0.4]
    for k in range(N + 1):
        t = k / N
        a = math.pi * (1.08 + .84 * t)
        cx_, cy_ = tx(204) + 166 * math.cos(a), 168 + 104 * math.sin(a)
        dx, dy = cx_ - WHORL[0], cy_ - WHORL[1]
        L = math.hypot(dx, dy) or 1
        dx, dy = dx / L, dy / L
        fade = math.sin(math.pi * t) ** .45
        up.append((cx_ - dx * 8 * fade, cy_ - dy * 8 * fade))
        h = (10 + 26 * rnd[(k // 2) % len(rnd)]) * fade if k % 2 == 0 else 4 * fade
        lo.append((cx_ + dx * h, cy_ + dy * h))
        lo2.append((cx_ + dx * h * .45, cy_ + dy * h * .45))
    band = smooth(up, closed=False) + " L" + " L".join(f"{f(x)},{f(y)}" for x, y in lo[::-1]) + "Z"
    gR = doc.lin([(0, HAIR_HL, 0), (.12, HAIR_HL, 1), (.5, HAIR_HL, .95), (.8, HAIR_HL, .45), (1, HAIR_HL, 0)], 0, 0, 1, 0)
    gR2 = doc.lin([(0, HAIR_HL2, 0), (.14, HAIR_HL2, .95), (.45, HAIR_HL2, .7), (.66, HAIR_HL2, 0)], 0, 0, 1, 0)
    inner += P(band, gR)
    inner += P(smooth(up, closed=False) + " L" + " L".join(f"{f(x)},{f(y)}" for x, y in lo2[::-1]) + "Z", gR2)
    # cool rim sheen on the lit edge of the dome
    inner += P(taper([(40, 200), (36, 140), (60, 80), (110, 36)], 7, .2, .3), "#6E7488", opacity=.55, filter=doc.blur(2))
    o += clipped(doc, whole, inner)
    # silhouette ink
    o += P(outline(DOME[:8], 2.8, 1.5, closed=False), HAIR_LN)
    o += P(outline(DOME[7:], 2.8, 1.5, closed=False), HAIR_LN)
    prev = DOME[-1]
    for x, y, k in _fr():
        c = _seg_ctrl(prev, x, y, k)
        if k == "t":
            o += P(taper([prev, c, (x, y)], 2.4, .5, .03), HAIR_LN)
        else:
            o += P(taper([prev, c, (x, y)], 2.0, .03, .55), HAIR_LN)
        prev = (x, y)
    o += P(taper([prev, DOME[0]], 2.2, .05, .5), HAIR_LN)
    # fine, translucent baby hairs lying on the forehead past the clump tips
    for (x, y), dx, dy in [((214, 156), -16, 12), ((278, 140), -14, 12), ((148, 176), -14, 10), ((334, 150), -10, 14)]:
        x = tx(x)
        o += P(taper([(x + 6, y - 10), (x, y), (x + dx, y + dy)], 1.6, .2, .9), HAIR, opacity=.7)
    return o


def forehead_shadow(doc, fd):
    d = _fringe_path()
    inner = P(d, SKIN_SH, transform="translate(5,12)") + P(d, "#EBA894", opacity=.35, transform="translate(3,5)", filter=doc.blur(3))
    return clipped(doc, fd, inner)


# ------------------------------------------------------------------ head
EXPR = {
    "neutral": dict(eyes="open", brows="soft", mouth="pout", blush=.6),     # the photo
    "happy": dict(eyes="open", brows="soft", mouth="smile", blush=.6),
    "laugh": dict(eyes="smile", brows="up", mouth="laugh", blush=.75),
    "teary": dict(eyes="teary", brows="worried", mouth="frown", blush=.85, tears=True),
    "surprised": dict(eyes="wide", brows="up", mouth="o", blush=.5),
    "cry": dict(eyes="squeeze", brows="worried", mouth="cry", blush=.95, tears=True),
    "sleep": dict(eyes="sleepy", brows="soft", mouth="pout", blush=.6),
    "asleep": dict(eyes="closed", brows="soft", mouth="pout", blush=.65),
    "wonder": dict(eyes="wide", brows="up", mouth="o", blush=.6),
    "say": dict(eyes="open", brows="up", mouth="smile", blush=.65),
    "refuse": dict(eyes="squeeze", brows="worried", mouth="frown", blush=.85),
    "wail": dict(eyes="squeeze", brows="worried", mouth="cry", blush=.95, tears=True),
    "chew": dict(eyes="smile", brows="soft", mouth="pout", blush=.75),
}


def head(doc, expr="happy", turn=0.0, tilt=0.0, look=(0, 0)):
    global TURN, LOOK
    TURN = turn
    LOOK = look
    E = EXPR[expr]
    o = ""
    fp = face_pts()
    fd = smooth(fp)
    gS = doc.rad([(0, "#FFF2E9"), (.55, SKIN), (1, "#FCDDCC")], .42 - turn * .3, .4, .64)
    o += P(fd, gS)
    o += cel(doc, fd, SKIN_SH, shift=(22, 4), opacity=.85,
             soft=("#E8A48E", 14, smooth([(320, 210), (366, 310), (310, 400), (250, 418), (336, 330)]), .35))
    o += forehead_shadow(doc, fd)
    # forehead sheen (the photo's glossy baby forehead) + full-cheek volume
    # forehead apex: small, warm, soft, low-opacity (a pale patch reads as a bald spot)
    o += clipped(doc, fd, f'<ellipse cx="{tx(178)}" cy="196" rx="20" ry="10" fill="#FFF5EC" opacity=".28" filter="{doc.blur(6)}"/>')
    b = E["blush"]
    for cx in (110, 290):
        bl = f'<ellipse cx="{cx}" cy="330" rx="48" ry="30" fill="{BLUSH}" opacity="{b}" filter="{doc.blur(11)}"/>'
        bl += f'<ellipse cx="{cx - 8}" cy="318" rx="9" ry="5" fill="#FFF3EA" opacity=".3" filter="{doc.blur(3)}"/>'
        if expr in ("teary", "cry", "laugh"):
            for k in range(3):
                x = cx - 14 + k * 11
                bl += P(taper([(x + 5, 320), (x - 3, 334)], 1.6, .3, .3), "#E07A6E", opacity=.7)
        o += clipped(doc, fd, feat(cx, bl))
    # chin roll: soft crease under the lower lip + occlusion along the jaw
    o += clipped(doc, fd, feat(200, P(taper([(176, 394), (200, 400), (224, 394)], 2.0, .4, .4), SKIN_LN, opacity=.35)
                               + f'<ellipse cx="200" cy="412" rx="70" ry="12" fill="{SKIN_SH}" opacity=".7" filter="{doc.blur(5)}"/>'))
    o += P(outline(fp, 2.4, 1.5, gaps=[(.0, .06), (.94, 1.0)]), SKIN_LN)
    o += feat(200, nose(doc))
    for side in (-1, 1):
        o += feat(200 + side * 66, eye(doc, E["eyes"], side, tear=E.get("tears", False)))
    o += feat(200, mouth(doc, E["mouth"]))
    for side in (-1, 1):
        if turn and ((side < 0) == (turn > 0)) and abs(turn) > .2:
            continue
        dx = -side * RCYL * (1 - math.cos(turn)) * 1.5
        o += f'<g transform="translate({dx:.1f},0)">{ear(doc, side)}</g>'
    o += hair(doc, "front")
    for side in (-1, 1):
        o += feat(200 + side * 66, brows(doc, E["brows"], only=side))
    if E.get("tears"):
        for side in (-1, 1):
            x = 200 + side * 92
            t = [(x, 290), (x + side * 4, 314), (x + side * 2, 338), (x - side * 3, 350)]
            tr = P(strand(t, 10, tip=.2, bulge=.6), "#CDEBFF", opacity=.9)
            tr += P(taper(t, 1.6, .2, .2), "#6FA9D6", opacity=.8)
            tr += f'<circle cx="{x}" cy="300" r="2.2" fill="#fff"/>'
            o += feat(x, tr)
    TURN = 0.0
    LOOK = (0.0, 0.0)
    if tilt:
        o = f'<g transform="rotate({tilt} 200 300)">{o}</g>'
    return o


if __name__ == "__main__":
    import sys
    arg = sys.argv[1] if len(sys.argv) > 1 else "neutral"
    if arg == "all":
        d = Doc(2100, 480, "-10 -30 2100 480")
        for i, (e, t, tl) in enumerate([("neutral", 0, 0), ("happy", .3, -4), ("laugh", -.28, 5), ("teary", .22, 6), ("surprised", -.3, -3)]):
            d.add(f'<g transform="translate({i*420},0)">{head(d, e, t, tl)}</g>')
    else:
        d = Doc(420, 480, "-10 -30 420 480")
        d.add(head(d, arg))
    print(d.svg())
