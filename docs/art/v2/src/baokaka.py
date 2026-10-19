"""baokaka.py - 寶咖咖 in the v2 TV-anime style.

Head space: 400 x 420, face centre x=200.  Body space continues below
(see body()).  All functions return SVG fragments for a geom.Doc.
"""
import math
import numpy as np
from geom import *

# ---------------------------------------------------------------- palette
SKIN = "#FFE8DA"; SKIN_SH = "#F3BCA6"; SKIN_SH2 = "#E59E88"; SKIN_LN = "#A55A48"; SKIN_HL = "#FFF7F0"
BLUSH = "#F59A8E"
HAIR = "#6B4231"; HAIR_DK = "#43271C"; HAIR_DK2 = "#2E1912"; HAIR_HL = "#B4866A"; HAIR_HL2 = "#E2BCA2"; HAIR_LN = "#26130D"
IRIS_D = "#3B1D0F"; IRIS_M = "#7E4421"; IRIS_L = "#C98744"; IRIS_R = "#F3C07A"
LASH = "#24120B"; WHITE_SH = "#D6CBD8"
MOUTH = "#8E3A30"; TONGUE = "#F08A80"
CX = 200
TURN = 0.0      # head turn in radians (+ = face turns toward viewer-left)
RCYL = 172.0


def tx(x):
    """cylindrical remap of an x coordinate for the current head turn"""
    if not TURN:
        return x
    u = max(-1.0, min(1.0, (x - CX) / RCYL))
    th = math.asin(u) - TURN
    return CX + RCYL * math.sin(th)


def tk(x):
    """horizontal foreshortening factor at x"""
    if not TURN:
        return 1.0
    u = max(-.999, min(.999, (x - CX) / RCYL))
    th = math.asin(u)
    return max(.05, math.cos(th - TURN) / math.cos(th))


def feat(x, inner):
    """wrap a feature centred at x so it slides and foreshortens"""
    if not TURN:
        return inner
    return f'<g transform="translate({tx(x):.2f},0) scale({tk(x):.3f},1) translate({-x},0)">{inner}</g>'


def face_pts():
    R = [(200, 60), (262, 68), (314, 104), (338, 160), (342, 220), (348, 276),
         (348, 318), (330, 356), (292, 386), (244, 401), (200, 405)]
    L = mirror(R[1:-1], CX)[::-1]
    pts = R + L
    if TURN:
        sh = -RCYL * math.sin(TURN) * .42
        out = []
        for x, y in pts:
            w = max(0.0, min(1.0, (y - 170) / 230)) ** 1.2
            far = (x < CX) == (TURN > 0)      # far-side cheek gets a slight bulge outward
            bul = (8 if far else -4) * math.sin(math.pi * max(0, min(1, (y - 230) / 150))) * abs(TURN) / .35
            out.append((x + sh * w + (-bul if x < CX else bul), y))
        pts = out
    return pts


def ear(doc, side=1):
    s = side
    def X(x): return CX + s * (x - CX)
    pts = [(X(334), 224), (X(352), 208), (X(374), 214), (X(386), 240), (X(382), 270),
           (X(366), 294), (X(346), 302), (X(332), 292)]
    d = smooth(pts)
    o = P(d, SKIN)
    o += cel(doc, d, SKIN_SH, shift=(-10 * s, 4))
    o += clipped(doc, d, f'<ellipse cx="{X(338)}" cy="250" rx="14" ry="40" fill="{SKIN_SH2}" opacity=".5" filter="{doc.blur(5)}"/>')
    # helix / concha
    o += P(taper([(X(352), 226), (X(370), 230), (X(374), 254), (X(364), 278), (X(350), 286)], 2.0, .3, .3), SKIN_LN, opacity=.8)
    o += P(smooth([(X(352), 240), (X(364), 246), (X(362), 268), (X(350), 276), (X(346), 256)]), "#EBA392", opacity=.6)
    o += P(outline(pts, 2.0, 1.3, gaps=[(.86, 1.0)]), SKIN_LN)
    return o


# ----------------------------------------------------------------- eyes
def eye(doc, mode="open", side=-1, look=(0, 0), tear=False):
    """side=-1 -> viewer-left eye. Built for the left eye, mirrored."""
    cx = CX + side * 68
    s = -side   # +1 for left eye: inner corner is toward +x
    def X(x):   # x offset from eye centre, positive toward the nose
        return cx + s * x
    out = ""
    if mode in ("open", "wide", "teary", "smug"):
        wide = mode == "wide"
        top = 226 if not wide else 220
        upper = [(X(33), 268), (X(30), 248), (X(16), 232 if not wide else 226), (X(-6), top + 1), (X(-25), 234), (X(-35), 250)]
        lower = [(X(-35), 252), (X(-31), 276), (X(-14), 293 if not wide else 295), (X(10), 295 if not wide else 297), (X(27), 284), (X(33), 268)]
        if mode == "smug":
            upper = [(X(34), 266), (X(28), 254), (X(10), 247), (X(-10), 246), (X(-28), 250), (X(-38), 258)]
            lower = [(X(-38), 259), (X(-30), 276), (X(-12), 288), (X(10), 289), (X(28), 279), (X(34), 266)]
        shape = upper + lower[1:-1]
        d = smooth(shape)
        clip = doc.clip(d)
        ix, iy = cx + look[0], 265 + look[1]
        rx, ry = 26, 31
        if wide:
            rx, ry = 19, 23
        # sclera
        o = P(d, "#FFFFFF")
        o += f'<g clip-path="{clip}">'
        o += P(smooth(upper + [(X(-40), 230), (X(40), 230)]), WHITE_SH, opacity=.9,
               transform="translate(0,9)", filter=doc.blur(2.5))
        # iris
        ig = doc.lin([(0, IRIS_D), (.42, IRIS_M), (.78, IRIS_L), (1, IRIS_R)], 0, iy - ry, 0, iy + ry, "userSpaceOnUse")
        o += f'<ellipse cx="{ix}" cy="{iy}" rx="{rx}" ry="{ry}" fill="{ig}"/>'
        # radial fibres
        for k in range(14):
            a = math.pi * 2 * k / 14 + .2
            r0, r1 = 11 if not wide else 8, rx * .92
            p0 = (ix + math.cos(a) * r0, iy + math.sin(a) * r0 * ry / rx)
            p1 = (ix + math.cos(a) * r1, iy + math.sin(a) * r1 * ry / rx)
            o += P(taper([p0, p1], 1.3, .3, .5), IRIS_D, opacity=.28)
        # lower glow crescent
        o += f'<ellipse cx="{ix + s*2}" cy="{iy + ry*.48}" rx="{rx*.72}" ry="{ry*.36}" fill="{IRIS_R}" opacity=".75" filter="{doc.blur(3)}"/>'
        # pupil
        pr = 10.5 if not wide else 6.5
        o += f'<ellipse cx="{ix}" cy="{iy+1}" rx="{pr}" ry="{pr*1.22}" fill="{IRIS_D}"/>'
        o += f'<ellipse cx="{ix}" cy="{iy+1}" rx="{pr*.62}" ry="{pr*.8}" fill="#1A0A05"/>'
        # iris rim
        o += f'<ellipse cx="{ix}" cy="{iy}" rx="{rx}" ry="{ry}" fill="none" stroke="{IRIS_D}" stroke-width="2.2" opacity=".85"/>'
        # lid shadow across top of iris + sclera
        o += P(smooth(upper + [(X(-44), 200), (X(44), 200)]), "#2A1410", opacity=.5,
               transform="translate(0,11)", filter=doc.blur(3.5))
        o += P(smooth(upper + [(X(-44), 200), (X(44), 200)]), "#4A2418", opacity=.35, transform="translate(0,5)")
        # catchlights
        o += f'<ellipse cx="{ix - s*9}" cy="{iy - 12}" rx="8.5" ry="10.5" fill="#fff" transform="rotate({-25*s} {ix - s*9} {iy-12})"/>'
        o += f'<circle cx="{ix + s*10}" cy="{iy + 15}" r="3.6" fill="#fff" opacity=".95"/>'
        o += f'<circle cx="{ix - s*12}" cy="{iy + 10}" r="1.8" fill="#fff" opacity=".8"/>'
        if tear or mode == "teary":
            # wet lower lid: glassy water line + extra lights
            o += P(taper([(X(-30), 284), (X(-12), 291), (X(12), 291), (X(28), 282)], 3.2, .3, .3), "#FFFFFF", opacity=.9)
            o += f'<circle cx="{ix + s*12}" cy="{iy + 8}" r="2.6" fill="#fff"/>'
            o += f'<circle cx="{ix + s*4}" cy="{iy - 18}" r="2.4" fill="#fff"/>'
        o += "</g>"
        # upper lash mass: thick, swelling to the outer corner, with flicks
        lash = upper[:]
        o += P(taper(lash, 7.5 if mode != "smug" else 6.5, .12, .02, prof=lambda t: .55 + .75 * t), LASH)
        o += P(taper([(X(-31), 242), (X(-40), 241), (X(-45), 237)], 3.0, .0, .9), LASH)
        o += P(taper([(X(26), 240), (X(32), 236)], 2.0, .0, .9), LASH, opacity=.7)
        # double-lid crease
        if mode != "smug":
            o += P(taper([(X(26), 226), (X(8), 216), (X(-16), 216), (X(-32), 226)], 1.6, .4, .4), SKIN_LN, opacity=.75)
        else:
            o += P(taper([(X(30), 246), (X(8), 238), (X(-16), 238), (X(-34), 245)], 1.6, .4, .4), SKIN_LN, opacity=.75)
        # lower lash line (thin, broken)
        o += P(taper([(X(-34), 260), (X(-26), 278), (X(-10), 289)], 2.2, .2, .6), LASH, opacity=.85)
        o += P(taper([(X(2), 291), (X(16), 288), (X(26), 281)], 1.4, .5, .5), SKIN_LN, opacity=.7)
        # lid shadow on skin under the eye (soft)
        o += P(smooth([(X(-28), 290), (X(0), 300), (X(26), 290), (X(0), 296)]), SKIN_SH, opacity=.5, filter=doc.blur(2))
        out += o
    elif mode == "smile":   # closed happy arcs ^ ^
        arc = [(X(32), 268), (X(16), 252), (X(-6), 248), (X(-26), 256), (X(-36), 268)]
        out += P(taper(arc, 6.5, .2, .2, prof=lambda t: .7 + .5 * t), LASH)
        out += P(taper([(X(-30), 258), (X(-44), 254)], 3.2, 0, .9), LASH)
        out += P(taper([(X(-20), 274), (X(0), 280), (X(20), 274)], 1.4, .4, .4), SKIN_LN, opacity=.6)
    elif mode == "squeeze":   # crying, eyes squeezed shut  > <
        out += P(taper([(X(34), 252), (X(4), 264), (X(-30), 270)], 5.5, .2, .4), LASH)
        out += P(taper([(X(30), 284), (X(4), 270), (X(-28), 272)], 4.0, .2, .5), LASH)
        out += P(taper([(X(-26), 244), (X(-8), 238)], 2, .4, .4), SKIN_LN, opacity=.6)
    return out


def brows(doc, mode="soft", only=None):
    o = ""
    for side in ((-1, 1) if only is None else (only,)):
        cx = CX + side * 68
        s = -side
        def X(x): return cx + s * x
        if mode == "soft":
            pts = [(X(26), 206), (X(8), 200), (X(-14), 201)]
        elif mode == "worried":
            pts = [(X(30), 196), (X(8), 202), (X(-22), 210)]
        elif mode == "up":
            pts = [(X(28), 192), (X(4), 184), (X(-24), 188)]
        elif mode == "smug":
            pts = [(X(28), 212), (X(4), 206), (X(-24), 206)]
        o += P(taper(pts, 5.0, .3, .7), HAIR, opacity=.7)
    return o


def mouth(doc, mode="smile"):
    o = ""
    if mode == "smile":
        sh = [(181, 324), (200, 327), (219, 324), (214, 338), (200, 344), (186, 338)]
        d = smooth(sh)
        o += P(d, MOUTH)
        o += clipped(doc, d, f'<ellipse cx="200" cy="346" rx="15" ry="9" fill="{TONGUE}"/>'
                     f'<path d="{smooth([(184,322),(200,330),(216,322),(216,320),(184,320)])}" fill="#fff" opacity=".9"/>')
        o += P(taper([(178, 321), (190, 326), (200, 327), (210, 326), (222, 321)], 2.4, .3, .3), SKIN_LN)
        o += P(taper([(190, 342), (200, 345), (210, 342)], 1.6, .4, .4), SKIN_LN, opacity=.6)
    elif mode == "laugh":
        sh = [(172, 318), (200, 322), (228, 318), (224, 342), (212, 358), (200, 362), (188, 358), (176, 342)]
        d = smooth(sh)
        o += P(d, MOUTH)
        o += clipped(doc, d, f'<ellipse cx="200" cy="364" rx="22" ry="14" fill="{TONGUE}"/>'
                     f'<ellipse cx="200" cy="334" rx="18" ry="8" fill="#5E211B" opacity=".6" filter="{doc.blur(3)}"/>')
        o += P(taper([(168, 314), (184, 321), (200, 322), (216, 321), (232, 314)], 2.6, .25, .25), SKIN_LN)
        o += P(outline(sh, 1.6, .8), SKIN_LN, opacity=.85)
    elif mode == "pout":
        o += P(taper([(186, 334), (194, 329), (200, 330), (206, 329), (214, 334)], 2.4, .3, .3), SKIN_LN)
        o += P(taper([(192, 340), (200, 342), (208, 340)], 1.6, .4, .4), SKIN_LN, opacity=.55)
    elif mode == "o":
        sh = ellipse_pts(200, 334, 9, 11, 10)
        d = smooth(sh)
        o += P(d, MOUTH)
        o += clipped(doc, d, f'<ellipse cx="200" cy="344" rx="8" ry="5" fill="{TONGUE}"/>')
        o += P(outline(sh, 1.8, 1), SKIN_LN)
    elif mode == "cry":
        sh = [(176, 330), (190, 322), (200, 321), (210, 322), (224, 330), (220, 352), (200, 360), (180, 352)]
        d = smooth(sh)
        o += P(d, MOUTH)
        o += clipped(doc, d, f'<ellipse cx="200" cy="360" rx="18" ry="10" fill="{TONGUE}"/>'
                     f'<path d="{smooth([(182,326),(200,324),(218,326),(216,322),(184,322)])}" fill="#fff" opacity=".85"/>')
        o += P(outline(sh, 2.0, 1), SKIN_LN)
    return o


# ----------------------------------------------------------------- hair
WHORL = (236, 40)
# dome, left-bottom -> over the top -> right-bottom
DOME = [(30, 226), (16, 196), (8, 166), (16, 132), (28, 100), (52, 64), (80, 40), (146, 6), (212, -4), (276, 6),
        (334, 40), (366, 74), (380, 100), (394, 140), (392, 172), (384, 196), (374, 226)]
# fringe from right to left: alternating tip / notch.  (x, y, kind)
FRINGE = [
    (338, 254, "t"), (340, 200, "n"), (338, 226, "t"), (322, 166, "n"), (304, 196, "t"),
    (282, 156, "n"), (266, 190, "t"), (246, 150, "n"), (226, 186, "t"), (210, 148, "n"),
    (188, 184, "t"), (166, 150, "n"), (144, 186, "t"), (124, 156, "n"), (100, 194, "t"),
    (80, 168, "n"), (62, 218, "t"), (60, 194, "n"), (64, 254, "t"),
]


def _fr():
    return [(tx(x) if 40 < x < 360 else x, y, k) for x, y, k in FRINGE]


def _fringe_path():
    d = smooth(DOME, closed=False)
    prev = DOME[-1]
    for x, y, k in _fr():
        mx, my = (prev[0] + x) / 2, (prev[1] + y) / 2
        # bulge outwards from the whorl so every clump sweeps
        side = 1 if mx > WHORL[0] else -1
        if k == "t":   # notch -> tip: convex outer edge of the clump
            c = (mx + side * 9, my - 2)
        else:          # tip -> notch: the clump's inner edge, slightly hollow
            c = (mx + side * 4, my + 4)
        d += f" Q{f(c[0])},{f(c[1])} {f(x)},{f(y)}"
        prev = (x, y)
    mx, my = (prev[0] + DOME[0][0]) / 2, (prev[1] + DOME[0][1]) / 2
    d += f" Q{f(mx-6)},{f(my)} {f(DOME[0][0])},{f(DOME[0][1])}Z"
    return d


HAIR_D = None


def hair(doc, layer="front"):
    global HAIR_D
    o = ""
    whole = HAIR_D = _fringe_path()
    if layer == "back":
        return o
    gH = doc.lin([(0, HAIR_HL), (.25, HAIR), (.72, HAIR), (1, HAIR_DK)], 0, -4, 0, 260, "userSpaceOnUse")
    # clumps that break the silhouette (soft baby hair sticking out)
    for pts, w, col in [
        ([(40, 120), (16, 140), (2, 168)], 30, HAIR),
        ([(30, 176), (12, 200), (8, 226)], 26, HAIR_DK),
        ([(60, 70), (34, 80), (18, 100)], 26, HAIR),
        ([(120, 22), (92, 20), (70, 30)], 24, HAIR),
        ([(360, 116), (386, 132), (402, 158)], 30, HAIR_DK),
        ([(372, 172), (392, 194), (396, 222)], 26, HAIR_DK),
        ([(320, 44), (348, 52), (368, 72)], 24, HAIR_DK),
    ]:
        dd = strand(pts, w, bulge=.35, tip=1.1)
        o += P(dd, col)
        o += P(dd, HAIR_DK2, opacity=.35, mask=doc.mask(f'<path d="{dd}" fill="#fff"/><path d="{dd}" fill="#000" transform="translate(-5,-4)"/>'))
        o += P(outline(dense(pts, False, 4).tolist() and [(x, y) for x, y in pts], 2.0, 1.2, closed=False), "none")
        # ink the outer edge only (normal points away from the head centre)
        D = dense(pts, False, 10)
        N = normals(D)
        sgn = 1 if (N[len(N)//2] @ (D[len(D)//2] - [200, 160])) > 0 else -1
        ww = w * (1 + .35 * np.sin(np.pi * np.clip(np.linspace(0, 1, len(D)) * 1.6, 0, 1))) * (1 - np.linspace(0, 1, len(D))) ** 1.0
        edge = [(x + nx * sgn * wi / 2, y + ny * sgn * wi / 2) for (x, y), (nx, ny), wi in zip(D, N, ww)]
        o += P(taper(edge[::2] + [edge[-1]], 2.6, .3, .05, n=3), HAIR_LN)
    o += P(whole, gH)
    inner = ""
    # big form shadow: sphere lit from the upper left (cel edge + soft core)
    inner += P(whole, HAIR_DK, opacity=.75, mask=doc.mask(
        f'<path d="{whole}" fill="#fff"/><ellipse cx="170" cy="92" rx="210" ry="128" fill="#000"/>'))
    inner += f'<ellipse cx="330" cy="200" rx="90" ry="80" fill="{HAIR_DK2}" opacity=".35" filter="{doc.blur(18)}"/>'
    # separation lines from each notch up toward the whorl + shadow wedges
    notches = [(x, y) for x, y, k in _fr() if k == "n"]
    for i, (x, y) in enumerate(notches):
        dx, dy = WHORL[0] - x, WHORL[1] - y
        L = math.hypot(dx, dy)
        ux, uy = dx / L, dy / L
        reach = .42 + .18 * ((i * 7) % 3) / 2
        p0 = (x, y)
        p2 = (x + dx * reach, y + dy * reach)
        side = 1 if x > WHORL[0] else -1
        p1 = ((p0[0] + p2[0]) / 2 + side * 8, (p0[1] + p2[1]) / 2)
        # shadow wedge on the far side of the separation
        wedge = strand([p0, p1, p2], 13, bulge=.2, tip=1.3)
        inner += P(wedge, HAIR_DK2, opacity=.5, transform=f"translate({side*5},2)", filter=doc.blur(1.6))
        inner += P(taper([p0, p1, p2], 2.4, .02, .6), HAIR_LN, opacity=.85)
        # a shorter secondary line inside the clump, for layering
        q0 = (x + (12 if side > 0 else -12) , y + 22)
        q2 = (q0[0] + dx * .22, q0[1] + dy * .22)
        inner += P(taper([q0, ((q0[0]+q2[0])/2 + side*4, (q0[1]+q2[1])/2), q2], 1.5, .1, .6), HAIR_DK2, opacity=.6)
    # tip occlusion: the fringe darkens slightly where it curls toward the face
    for x, y, k in _fr():
        if k == "t":
            inner += f'<ellipse cx="{x}" cy="{y-6}" rx="16" ry="20" fill="{HAIR_DK}" opacity=".35" filter="{doc.blur(6)}"/>'
    # angel-ring highlight: smooth upper edge, spiky lower edge pointing down
    # the hair flow; bright on the lit (left) side, fading to the right
    up, lo, lo2 = [], [], []
    N = 34
    rnd = [0.9, 0.35, 1.0, 0.5, 0.75, 0.3, 0.95, 0.45, 0.8, 0.4]
    for k in range(N + 1):
        t = k / N
        a = math.pi * (1.08 + .84 * t)
        cx_, cy_ = tx(206) + 168 * math.cos(a), 176 + 108 * math.sin(a)
        dx, dy = cx_ - WHORL[0], cy_ - WHORL[1]
        L = math.hypot(dx, dy) or 1
        dx, dy = dx / L, dy / L
        fade = math.sin(math.pi * t) ** .45
        up.append((cx_ - dx * 9 * fade, cy_ - dy * 9 * fade))
        if k % 2 == 0:
            h = (10 + 28 * rnd[(k // 2) % len(rnd)]) * fade
        else:
            h = 4 * fade
        lo.append((cx_ + dx * h, cy_ + dy * h))
        lo2.append((cx_ + dx * h * .45, cy_ + dy * h * .45))
    band = smooth(up, closed=False).replace("M", "M", 1) + " L" + " L".join(f"{f(x)},{f(y)}" for x, y in lo[::-1]) + "Z"
    gR = doc.lin([(0, HAIR_HL, 0), (.12, HAIR_HL, 1), (.5, HAIR_HL, .95), (.78, HAIR_HL, .5), (1, HAIR_HL, 0)], 0, 0, 1, 0)
    gR2 = doc.lin([(0, HAIR_HL2, 0), (.14, HAIR_HL2, .95), (.45, HAIR_HL2, .7), (.65, HAIR_HL2, 0)], 0, 0, 1, 0)
    inner += P(band, gR)
    inner += P(smooth(up, closed=False) + " L" + " L".join(f"{f(x)},{f(y)}" for x, y in lo2[::-1]) + "Z", gR2)
    o += clipped(doc, whole, inner)
    # silhouette ink: heavier on the far side, broken near the top (light side)
    o += P(outline(DOME[:9], 3.0, 1.5, closed=False), HAIR_LN)
    o += P(outline(DOME[8:], 3.0, 1.5, closed=False), HAIR_LN)
    prev = DOME[-1]
    for x, y, k in _fr():
        mx, my = (prev[0] + x) / 2, (prev[1] + y) / 2
        side = 1 if mx > WHORL[0] else -1
        c = (mx + side * 9, my - 2) if k == "t" else (mx + side * 4, my + 4)
        if k == "t":
            o += P(taper([prev, (c[0], c[1] + (y - prev[1]) * .1), (x, y)], 2.6, .5, .03), HAIR_LN)
        else:
            o += P(taper([prev, c, (x, y)], 2.2, .03, .55), HAIR_LN)
        prev = (x, y)
    o += P(taper([prev, DOME[0]], 2.4, .05, .5), HAIR_LN)
    # cowlick (ahoge)
    ah = [(228, 4), (232, -18), (250, -30), (268, -24), (262, -10)]
    o += P(strand(ah, 11, bulge=.4), HAIR)
    o += P(taper(ah, 2.4, .1, .4), HAIR_LN)
    ah2 = [(216, 2), (210, -12), (196, -20)]
    o += P(strand(ah2, 7), HAIR)
    o += P(taper(ah2, 1.8, .1, .5), HAIR_LN)
    return o


def forehead_shadow(doc, fd):
    """the fringe casts a cel shadow onto the forehead / temples"""
    if HAIR_D is None:
        _ = _fringe_path()
    d = _fringe_path()
    inner = P(d, SKIN_SH, transform="translate(6,13)") + P(d, "#EBA894", opacity=.35, transform="translate(4,6)", filter=doc.blur(3))
    return clipped(doc, fd, inner)


# ----------------------------------------------------------------- head
def head(doc, expr="happy", turn=0.0, tilt=0.0):
    global TURN
    TURN = turn
    E = {
        "happy": dict(eyes="open", brows="soft", mouth="smile", blush=.55),
        "laugh": dict(eyes="smile", brows="up", mouth="laugh", blush=.75),
        "teary": dict(eyes="teary", brows="worried", mouth="pout", blush=.8, tears=True),
        "surprised": dict(eyes="wide", brows="up", mouth="o", blush=.45),
        "cry": dict(eyes="squeeze", brows="worried", mouth="cry", blush=.9, tears=True),
        "sleep": dict(eyes="smile", brows="soft", mouth="pout", blush=.6),
    }[expr]
    o = hair(doc, "back")
    fp = face_pts()
    fd = smooth(fp)
    gS = doc.rad([(0, SKIN_HL), (.55, SKIN), (1, "#FCDCCB")], .42 - turn * .3, .42, .62)
    o += P(fd, gS)
    # cel shadow on the far side + under the jaw, soft core
    o += cel(doc, fd, SKIN_SH, shift=(22, 4), opacity=.85,
             soft=("#E8A48E", 14, smooth([(320, 200), (360, 300), (300, 390), (250, 400), (330, 320)]), .35))
    o += forehead_shadow(doc, fd)
    # blush
    b = E["blush"]
    for cx in (112, 288):
        bl = f'<ellipse cx="{cx}" cy="{312}" rx="40" ry="22" fill="{BLUSH}" opacity="{b}" filter="{doc.blur(9)}"/>'
        if expr in ("teary", "cry", "laugh"):
            for k in range(3):
                x = cx - 14 + k * 11
                bl += P(taper([(x + 5, 302), (x - 3, 316)], 1.6, .3, .3), "#E07A6E", opacity=.7)
        o += clipped(doc, fd, feat(cx, bl))
    # face outline - thin, swelling at the jaw (far side), broken at the temples
    o += P(outline(fp, 2.4, 1.5, gaps=[(.0, .06), (.94, 1.0)]), SKIN_LN)
    # nose: a single soft stroke on the shadow side + highlight
    nose = P(taper([(206, 290), (209, 300), (204, 305)], 2.4, .4, .4), SKIN_LN, opacity=.6)
    nose += f'<ellipse cx="196" cy="294" rx="5" ry="3.5" fill="#fff" opacity=".7" filter="{doc.blur(1.2)}"/>'
    o += feat(200, nose)
    for side in (-1, 1):
        o += feat(200 + side * 68, eye(doc, E["eyes"], side, tear=E.get("tears", False)))
    o += feat(200, mouth(doc, E["mouth"]))
    for side in (-1, 1):
        hidden = turn and ((side < 0) == (turn > 0)) and abs(turn) > .2
        if hidden:
            continue
        dx = -side * RCYL * (1 - math.cos(turn)) * .8
        o += f'<g transform="translate({dx:.1f},0)">{ear(doc, side)}</g>'
    o += hair(doc, "front")
    for side in (-1, 1):
        o += feat(200 + side * 68, brows(doc, E["brows"], only=side))
    if E.get("tears"):
        for side in (-1, 1):
            x = 200 + side * 90
            t = [(x, 290), (x + side * 4, 312), (x + side * 2, 334), (x - side * 3, 344)]
            tr = P(strand(t, 10, tip=.2, bulge=.6), "#CDEBFF", opacity=.9)
            tr += P(taper(t, 1.6, .2, .2), "#6FA9D6", opacity=.8)
            tr += f'<circle cx="{x}" cy="{300}" r="2.2" fill="#fff"/>'
            o += feat(x, tr)
    TURN = 0.0
    if tilt:
        o = f'<g transform="rotate({tilt} 200 300)">{o}</g>'
    return o


if __name__ == "__main__":
    import sys
    arg = sys.argv[1] if len(sys.argv) > 1 else "happy"
    if arg == "all":
        d = Doc(1680, 470, "-10 -40 1680 470")
        for i, (e, t, tl) in enumerate([("happy", .32, -4), ("laugh", -.28, 5), ("teary", .22, 6), ("surprised", -.34, -3)]):
            d.add(f'<g transform="translate({i*420},0)">{head(d, e, t, tl)}</g>')
    else:
        d = Doc(420, 470, "-10 -40 420 470")
        d.add(head(d, arg))
    print(d.svg())
