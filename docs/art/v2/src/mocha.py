"""mocha.py - 摩卡貓 (brown mackerel tabby) in the v2 TV-anime style.

Space: 600 x 720, centre x=300.  Head ~ y 40..300, sitting body to y~690.
"""
import math
from geom import *

FUR = "#C99566"; FUR_HL = "#E7BE8E"; FUR_SH = "#9E6A43"; FUR_SH2 = "#7A4A2C"
STRIPE = "#5B3522"; FUR_LN = "#3B2216"
CREAM = "#FFF4E3"; CREAM_SH = "#E8D0B2"; CREAM_LN = "#9C7A5A"
PINK = "#EE9C98"; PINK_DK = "#C9706E"; EAR_IN = "#F2B3AA"
IR_C = "#F2CF57"; IR_M = "#A9C24A"; IR_O = "#5E8A2C"; IR_RIM = "#2F4416"
BLUE = "#4A8BDA"; BLUE_SH = "#2F64AE"; BLUE_LN = "#1E3D6C"; GOLD = "#F1C24A"; GOLD_DK = "#9C7015"
CX = 300
TURN = 0.0
RCYL = 125.0


def tx(x):
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


def feat(x, inner, y=None):
    if not TURN:
        return inner
    return f'<g transform="translate({tx(x):.2f},0) scale({tk(x):.3f},1) translate({-x},0)">{inner}</g>'


def M(pts):
    """mirror helper: right-side point list -> full symmetrical outline"""
    return pts + mirror(pts[1:-1], CX)[::-1]


# ------------------------------------------------------------------ head
HEAD_R = [(300, 98), (340, 100), (374, 112), (398, 136), (412, 166), (420, 194), (440, 212), (424, 220),
          (438, 238), (416, 244), (414, 258), (390, 276), (356, 292), (324, 300), (300, 302)]
EAR_R = [(340, 108), (360, 82), (386, 56), (410, 38), (418, 56), (420, 94), (414, 138), (398, 136), (376, 118)]
EAR_IN_R = [(356, 106), (376, 82), (400, 62), (408, 70), (408, 104), (402, 128), (384, 120)]


def ear(doc, side):
    def X(p): return [(CX + side * (x - CX), y) for x, y in p]
    pts = X(EAR_R)
    d = smooth(pts)
    o = P(d, FUR)
    o += cel(doc, d, FUR_SH, shift=(10 if side > 0 else -6, 6))
    ip = X(EAR_IN_R)
    di = smooth(ip)
    gi = doc.lin([(0, "#F7C7BE"), (1, PINK_DK)], 0, 40, 0, 130, "userSpaceOnUse")
    o += P(di, gi)
    o += clipped(doc, di, f'<ellipse cx="{CX + side*398}" cy="100" rx="16" ry="34" fill="{PINK_DK}" opacity=".45" filter="{doc.blur(5)}"/>'.replace(f'{CX + side*398}', f'{CX + side*(398-CX)}'))
    # ear furnishings: pale tufts sweeping up from the inner base
    for (x0, y0), (x1, y1) in [((362, 118), (376, 76)), ((372, 120), (390, 70)), ((380, 122), (394, 84)), ((352, 112), (364, 86))]:
        o += P(taper([(CX + side * (x0 - CX), y0), (CX + side * ((x0 + x1) / 2 - CX + 2), (y0 + y1) / 2), (CX + side * (x1 - CX), y1)], 2.2, .2, .8), CREAM, opacity=.9)
    o += P(outline(pts, 2.4, 1.4, gaps=[(.86, 1.0)]), FUR_LN)
    return o


def eye(doc, side, mode="open"):
    def X(x): return CX + side * (x - CX)
    out = ""
    if mode in ("open", "wide", "smug"):
        if mode == "smug":
            upper = [(X(322), 196), (X(334), 188), (X(350), 184), (X(366), 186), (X(376), 190)]
        elif mode == "wide":
            upper = [(X(320), 194), (X(328), 170), (X(348), 160), (X(368), 166), (X(378), 182)]
        else:
            upper = [(X(320), 196), (X(330), 176), (X(348), 167), (X(366), 171), (X(377), 184)]
        lower = [(X(377), 186), (X(368), 202), (X(348), 208), (X(330), 204)]
        shape = upper + lower
        d = smooth(shape)
        clip = doc.clip(d)
        ix, iy = X(348), 189
        r = 20 if mode != "wide" else 22
        gI = doc.rad([(0, IR_C), (.45, "#E2C94E"), (.7, IR_M), (1, IR_O)], .5, .5, .5)
        o = P(d, "#F4F1E6")
        o += f'<g clip-path="{clip}">'
        o += f'<circle cx="{ix}" cy="{iy}" r="{r}" fill="{gI}"/>'
        for k in range(16):
            a = 2 * math.pi * k / 16
            o += P(taper([(ix + math.cos(a) * 7, iy + math.sin(a) * 7), (ix + math.cos(a) * r * .95, iy + math.sin(a) * r * .95)], 1.2, .3, .5), IR_O, opacity=.35)
        o += f'<circle cx="{ix}" cy="{iy}" r="{r}" fill="none" stroke="{IR_RIM}" stroke-width="2.4"/>'
        pw, ph = (5.5, 15) if mode == "open" else ((12, 15) if mode == "wide" else (3.6, 13))
        o += f'<ellipse cx="{ix}" cy="{iy}" rx="{pw}" ry="{ph}" fill="#140C06"/>'
        # lid shadow
        o += P(smooth(upper + [(X(380), 150), (X(318), 150)]), "#2A1A0E", opacity=.55, transform="translate(0,8)", filter=doc.blur(3))
        # bottom glow
        o += f'<ellipse cx="{ix}" cy="{iy+10}" rx="{r*.7}" ry="{r*.35}" fill="#FFF0A0" opacity=".45" filter="{doc.blur(3)}"/>'
        o += f'<ellipse cx="{ix - side*7}" cy="{iy - 7}" rx="5.5" ry="6.5" fill="#fff" transform="rotate({-20*side} {ix - side*7} {iy-7})"/>'
        o += f'<circle cx="{ix + side*7}" cy="{iy + 9}" r="2.4" fill="#fff" opacity=".9"/>'
        o += "</g>"
        # dark cat 'eyeliner': heavy upper lid, thin lower lid, tear-line marking
        o += P(taper(upper, 5.2, .1, .15, prof=lambda t: .7 + .5 * math.sin(math.pi * t)), FUR_LN)
        o += P(taper(lower + [upper[0]], 2.6, .1, .3), FUR_LN, opacity=.9)
        o += P(taper([(X(321), 198), (X(316), 210), (X(312), 222)], 3.2, .1, .8), FUR_LN, opacity=.85)
        if mode == "smug":
            o += P(taper([(X(324), 178), (X(348), 174), (X(372), 180)], 1.6, .3, .3), FUR_LN, opacity=.6)
        out += o
    elif mode == "closed":   # happy ^ ^
        arc = [(X(320), 196), (X(334), 182), (X(350), 178), (X(366), 182), (X(378), 194)]
        out += P(taper(arc, 5, .15, .15), FUR_LN)
    return out


def mouth(doc, mode="content"):
    o = ""
    # nose leather
    nose = [(300, 236), (286, 222), (284, 216), (300, 214), (316, 216), (314, 222)]
    nd = smooth(nose)
    gN = doc.lin([(0, "#F6B4AE"), (1, PINK_DK)], 0, 212, 0, 238, "userSpaceOnUse")
    o += P(nd, gN) + P(outline(nose, 1.8, 1.2), "#7E3E36")
    o += f'<ellipse cx="294" cy="219" rx="5" ry="2.2" fill="#fff" opacity=".8"/>'
    if mode == "open":
        sh = [(286, 246), (300, 244), (314, 246), (310, 262), (300, 268), (290, 262)]
        d = smooth(sh)
        o += P(d, "#7A2E2A") + clipped(doc, d, f'<ellipse cx="300" cy="268" rx="11" ry="7" fill="{PINK}"/>')
        o += P(outline(sh, 1.6, 1), FUR_LN)
    if mode == "o":
        sh = ellipse_pts(300, 256, 6, 8, 10)
        o += P(smooth(sh), "#7A2E2A") + P(outline(sh, 1.6, 1), FUR_LN)
    # philtrum + omega mouth
    o += P(taper([(300, 236), (300, 246)], 2, .1, .1), FUR_LN)
    o += P(taper([(300, 245), (292, 252), (282, 251), (276, 246)], 2.2, .1, .5), FUR_LN)
    o += P(taper([(300, 245), (308, 252), (318, 251), (324, 246)], 2.2, .1, .5), FUR_LN)
    return o


def whiskers(doc, side):
    o = ""
    for k, (y0, x1, y1) in enumerate([(240, 446, 222), (247, 452, 246), (254, 442, 270)]):
        pts = [(CX + side * 24, y0), (CX + side * 80, y0 - 4 + (y1 - y0) * .4), (CX + side * (x1 - CX), y1)]
        o += P(taper(pts, 2.6, .05, .9), FUR_SH2, opacity=.55, transform="translate(.8,1)")
        o += P(taper(pts, 2.0, .05, .9), "#FFFDF6")
    for k in range(3):
        o += f'<circle cx="{CX + side*(20 + k*7)}" cy="{238 + k*5}" r="1.5" fill="{FUR_SH}"/>'
    return o


def head(doc, expr="content", turn=0.0, tilt=0.0):
    global TURN
    TURN = turn
    E = {"content": ("open", "content"), "smug": ("smug", "content"), "happy": ("closed", "open"),
         "surprised": ("wide", "o")}[expr]
    o = ""
    for side in (-1, 1):
        dx = -side * RCYL * (1 - math.cos(turn)) * .9 + (-RCYL * math.sin(turn) * .18)
        o += f'<g transform="translate({dx:.1f},0)">{ear(doc, side)}</g>'
    pts = M(HEAD_R)
    if turn:
        sh = -RCYL * math.sin(turn) * .35
        pts = [(x + sh * max(0, min(1, (y - 150) / 150)), y) for x, y in pts]
    d = smooth(pts)
    gF = doc.rad([(0, FUR_HL), (.6, FUR), (1, "#BD8558")], .4 - turn * .3, .35, .7)
    o += P(d, gF)
    inner = ""
    S = STRIPE
    mk = ""
    for pts_, w in [
        ([(272, 158), (276, 134), (284, 118)], 9), ([(284, 120), (292, 132), (300, 146)], 7),
        ([(328, 158), (324, 134), (316, 118)], 9), ([(316, 120), (308, 132), (300, 146)], 7),
        ([(300, 132), (300, 112), (300, 94)], 10), ([(284, 112), (280, 98), (278, 92)], 8), ([(316, 112), (320, 98), (322, 92)], 8),
        ([(262, 136), (252, 116), (244, 104)], 7), ([(338, 136), (348, 116), (356, 104)], 7),
    ]:
        mk += P(strand(pts_, w, bulge=.2), S, opacity=.85)
    inner += feat(300, mk)
    for side in (-1, 1):
        def X(x): return CX + side * (x - CX)
        ck = P(strand([(X(378), 186), (X(394), 190), (X(412), 200)], 8, bulge=.1), S, opacity=.85)
        ck += P(strand([(X(372), 214), (X(392), 220), (X(414), 236)], 9, bulge=.2), S, opacity=.8)
        ck += P(strand([(X(380), 160), (X(394), 168), (X(404), 182)], 7, bulge=.1), S, opacity=.7)
        inner += feat(X(392), ck)
    muz = [(300, 210), (318, 222), (340, 232), (350, 250), (338, 268), (318, 282), (300, 290), (282, 282),
           (262, 268), (250, 250), (260, 232), (282, 222)]
    mz = P(smooth(muz), CREAM, filter=doc.blur(1.2))
    for side in (-1, 1):
        mz += f'<ellipse cx="{CX + side*48}" cy="208" rx="28" ry="8" fill="{CREAM}" opacity="{.85 if E[0] != "closed" else .35}" filter="{doc.blur(3)}"/>'
    mz += P(smooth([(300, 150), (310, 190), (306, 214), (294, 214), (290, 190)]), FUR_HL, opacity=.7, filter=doc.blur(3))
    inner += feat(300, mz)
    inner += P(d, FUR_SH, opacity=.85, mask=doc.mask(f'<path d="{d}" fill="#fff"/><path d="{d}" fill="#000" transform="translate(-20,-8)"/>'))
    inner += f'<ellipse cx="300" cy="300" rx="70" ry="16" fill="{CREAM_SH}" opacity=".9" filter="{doc.blur(5)}"/>'
    o += clipped(doc, d, inner)
    pads = ""
    for side in (-1, 1):
        pads += f'<ellipse cx="{CX + side*20}" cy="252" rx="18" ry="10" fill="{CREAM_SH}" opacity=".6" filter="{doc.blur(3)}"/>'
    o += feat(300, pads)
    o += P(outline(pts, 2.6, 1.5, gaps=[(.0, .015), (.985, 1.0)]), FUR_LN)
    for side in (-1, 1):
        o += feat(CX + side * 48, eye(doc, side, E[0]))
    o += feat(300, mouth(doc, E[1]))
    for side in (-1, 1):
        o += feat(CX + side * 20, whiskers(doc, side))
    if expr == "smug":
        br = ""
        for side in (-1, 1):
            br += P(taper([(CX + side * 30, 160), (CX + side * 50, 156), (CX + side * 68, 160)], 2.4, .3, .3), FUR_LN, opacity=.6)
        o += feat(300, br)
    TURN = 0.0
    if tilt:
        o = f'<g transform="rotate({tilt} 300 200)">{o}</g>'
    return o


# ------------------------------------------------------------------ body
BODY = [(236, 284), (212, 330), (200, 392), (186, 462), (172, 540), (180, 612), (224, 648), (300, 656),
        (376, 648), (420, 612), (428, 540), (414, 462), (400, 392), (388, 330), (364, 284)]
HAUNCH_L = [(208, 440), (166, 476), (146, 540), (150, 604), (176, 646), (226, 660), (266, 646), (274, 590),
            (264, 520), (240, 460)]
BIB = [(246, 286), (300, 300), (354, 286), (366, 330), (356, 356), (370, 380), (350, 398), (358, 420), (334, 440),
       (330, 462), (312, 470), (300, 490), (288, 470), (270, 462), (266, 440), (242, 420), (250, 398), (230, 380), (244, 356), (234, 330)]


def tail(doc):
    C = [(404, 594), (450, 622), (452, 660), (414, 680), (330, 686), (252, 680), (206, 664), (188, 640)]
    W = [46, 42, 40, 38, 36, 32, 28, 24]
    loop = limb(C, W, 14)
    d = poly(loop)
    o = P(d, FUR)
    inner = ""
    # rings across the tail
    D = dense(C, False, 14)
    N = normals(D)
    for k in range(14, len(D) - 4, 13):
        p, n = D[k], N[k]
        w = 26
        inner += P(strand([(p[0] - n[0] * w, p[1] - n[1] * w), (p[0] + n[0] * w, p[1] + n[1] * w)], 10, bulge=.3, tip=.6), STRIPE, opacity=.9)
    inner += P(d, FUR_SH, opacity=.8, mask=doc.mask(f'<path d="{d}" fill="#fff"/><path d="{d}" fill="#000" transform="translate(-4,-10)"/>'))
    tipc = D[-1]
    inner += P(poly(limb([tuple(D[-14]), tuple(D[-7]), tuple(D[-1])], [30, 28, 26], 6)), STRIPE)
    inner += P(taper([tuple(D[-12] + N[-12] * 6), tuple(D[-5] + N[-5] * 6), tuple(D[-1] + N[-1] * 2)], 4, .3, .4), "#9A6A4A", opacity=.9)
    o += clipped(doc, d, inner)
    o += P(outline(loop, 2.4, 1.4, n=2), FUR_LN)
    return o


def leg(doc, side):
    def X(x): return CX + side * (x - CX)
    C = [(X(334), 380), (X(337), 450), (X(338), 520), (X(336), 572), (X(334), 604)]
    loop = limb(C, [66, 56, 48, 40, 44], 12)
    d = poly(loop)
    gL = doc.lin([(0, FUR_HL), (.45, FUR), (1, FUR_SH)], 0, 0, 1, 0) if side < 0 else doc.lin([(0, FUR), (.55, FUR), (1, FUR_SH2)], 0, 0, 1, 0)
    o = P(d, gL)
    inner = ""
    for y in (470, 502, 532):
        inner += P(strand([(X(306), y), (X(320), y - 4), (X(336), y - 2), (X(362), y + 5)], 9, bulge=.4, tip=.7), STRIPE, opacity=.85)
    # white sock with an irregular, soft fur edge
    rnd = [4, -3, 7, -1, 5, -4, 3, 6, -2]
    sock = [(X(296), 572)] + [(X(304 + k * 7), 562 + rnd[k] + (5 if k % 2 else -3)) for k in range(9)] + [(X(372), 570), (X(372), 640), (X(296), 640)]
    inner += P(smooth(sock), CREAM, filter=doc.blur(.8))
    inner += P(d, FUR_SH, opacity=.75, mask=doc.mask(f'<path d="{d}" fill="#fff"/><path d="{d}" fill="#000" transform="translate(-12,-2)"/>'))
    inner += f'<ellipse cx="{X(334)}" cy="380" rx="30" ry="40" fill="{FUR_SH}" opacity=".5" filter="{doc.blur(8)}"/>'
    inner += f'<ellipse cx="{X(326)}" cy="470" rx="8" ry="60" fill="#fff" opacity=".22" filter="{doc.blur(5)}"/>'
    o += clipped(doc, d, inner)
    o += P(outline(loop, 2.4, 1.4, n=2, gaps=[(.9, 1), (0, .1)]), FUR_LN)
    # paw: palm mass + four toe beans seen from the front, inked as one silhouette
    shapes = [smooth(ellipse_pts(X(334), 608, 28, 18, 12))]
    for k, dx in enumerate((-19, -7, 6, 18)):
        shapes.append(smooth(ellipse_pts(X(334) + dx * side, 622 - (2 if 0 < k < 3 else 0), 9, 10, 10)))
    o += union_ink(shapes, CREAM, CREAM_LN, 1.1)
    o += f'<ellipse cx="{X(338)}" cy="624" rx="24" ry="8" fill="{CREAM_SH}" opacity=".8" filter="{doc.blur(2.5)}"/>'
    for dx in (-13, 0, 12):
        x = X(334) + dx * side
        o += P(taper([(x, 614), (x + .5, 630)], 1.5, .3, .2), CREAM_LN, opacity=.85)
    o += f'<ellipse cx="{X(326)}" cy="600" rx="10" ry="4" fill="#fff" opacity=".8"/>'
    return o


def haunch(doc, side):
    pts = HAUNCH_L if side < 0 else mirror(HAUNCH_L, CX)[::-1]
    d = smooth(pts)
    o = P(d, FUR)
    inner = ""
    def X(x): return x if side < 0 else 2 * CX - x
    for k, (a, b, c) in enumerate([((182, 520), (210, 500), (236, 498)), ((172, 560), (206, 540), (244, 540)),
                                   ((176, 600), (210, 584), (250, 586))]):
        inner += P(strand([(X(a[0]), a[1]), (X(b[0]), b[1]), (X(c[0]), c[1])], 12, bulge=.4, tip=.8), STRIPE, opacity=.85)
    inner += P(d, FUR_SH, opacity=.75, mask=doc.mask(f'<path d="{d}" fill="#fff"/><path d="{d}" fill="#000" transform="translate({-14},{-10})"/>'))
    inner += f'<ellipse cx="{X(214)}" cy="520" rx="34" ry="30" fill="{FUR_HL}" opacity=".5" filter="{doc.blur(9)}"/>'
    o += clipped(doc, d, inner)
    o += P(outline(pts, 2.4, 1.4, gaps=[(.55, .8)]), FUR_LN)
    # hind paw peeking out in front
    paw = [(X(178), 640), (X(196), 626), (X(232), 628), (X(248), 642), (X(234), 656), (X(196), 658)]
    pd = smooth(paw)
    o += P(pd, CREAM) + cel(doc, pd, CREAM_SH, shift=(6, 4)) + P(outline(paw, 2.0, 1.2), CREAM_LN)
    return o


def bandana(doc):
    # triangle on the chest, knot on the cat's left (viewer right)
    tri = [(232, 286), (270, 298), (300, 300), (330, 298), (368, 286), (360, 314), (336, 350), (312, 384), (300, 392),
           (288, 380), (262, 344), (240, 312)]
    d = smooth(tri)
    o = P(d, BLUE)
    inner = ""
    for x, y in [(268, 312), (300, 318), (332, 312), (284, 344), (316, 344), (300, 368), (252, 300), (348, 300)]:
        inner += f'<circle cx="{x}" cy="{y}" r="5" fill="#fff"/>'
    inner += P(taper([(258, 304), (282, 340), (298, 380)], 6, .2, .2), BLUE_SH, opacity=.8)
    inner += P(taper([(342, 304), (322, 338), (306, 376)], 6, .2, .2), BLUE_SH, opacity=.8)
    inner += P(d, BLUE_SH, opacity=.9, mask=doc.mask(f'<path d="{d}" fill="#fff"/><path d="{d}" fill="#000" transform="translate(-10,-8)"/>'))
    inner += f'<ellipse cx="300" cy="294" rx="70" ry="10" fill="{BLUE_SH}" opacity=".8" filter="{doc.blur(4)}"/>'
    o += clipped(doc, d, inner)
    o += P(outline(tri, 2.2, 1.3), BLUE_LN)
    # knot + ends at the viewer-right side of the neck
    for pts in ([(366, 288), (386, 300), (394, 322)], [(366, 290), (390, 290), (404, 304)]):
        lp = limb(pts, [16, 13, 6], 8)
        ld = poly(lp)
        o += P(ld, BLUE) + cel(doc, ld, BLUE_SH, shift=(4, 4)) + P(outline(lp, 1.8, 1.2, n=2), BLUE_LN)
    kn = ellipse_pts(366, 290, 13, 11, 10)
    kd = smooth(kn)
    o += P(kd, BLUE) + cel(doc, kd, BLUE_SH, shift=(4, 4)) + P(outline(kn, 2, 1.2), BLUE_LN)
    # gold fish tag at the point
    o += f'<circle cx="300" cy="396" r="5" fill="none" stroke="{GOLD_DK}" stroke-width="2.4"/>'
    tag = ellipse_pts(300, 414, 15, 15, 14)
    td = smooth(tag)
    gG = doc.rad([(0, "#FFF2B0"), (.5, GOLD), (1, "#C9921E")], .35, .3, .75)
    o += P(td, gG) + P(outline(tag, 2, 1.2), GOLD_DK)
    o += P(smooth([(290, 414), (300, 408), (308, 412), (314, 408), (314, 420), (308, 416), (300, 420)]), "#C9921E")
    o += f'<circle cx="296" cy="412" r="1.3" fill="#7A5410"/>'
    o += P(taper([(290, 406), (296, 403)], 2, .2, .2), "#fff", opacity=.9)
    return o


def figure(doc, expr="content", shadow=True):
    o = ""
    if shadow:
        o += f'<ellipse cx="300" cy="676" rx="200" ry="22" fill="#5A3A28" opacity=".22" filter="{doc.blur(8)}"/>'
    d = smooth(BODY)
    gB = doc.lin([(0, FUR_HL), (.4, FUR), (1, FUR_SH)], 0, 280, 0, 660, "userSpaceOnUse")
    o += P(d, gB)
    inner = ""
    for side in (-1, 1):
        for k in range(5):
            x0 = 300 + side * (78 + k * 10)
            y0 = 318 + k * 26
            pts_ = [(x0, y0), (x0 + side * 10, y0 + 40), (x0 + side * 12, y0 + 84)]
            inner += P(strand(pts_[::-1], 11 - k, bulge=.4, tip=.9), STRIPE, opacity=.75)
    inner += P(d, FUR_SH, opacity=.8, mask=doc.mask(f'<path d="{d}" fill="#fff"/><path d="{d}" fill="#000" transform="translate(-22,-6)"/>'))
    o += clipped(doc, d, inner)
    o += P(outline(BODY, 2.6, 1.4, gaps=[(.0, .06), (.94, 1.0)]), FUR_LN)
    o += haunch(doc, -1) + haunch(doc, 1)
    o += leg(doc, -1) + leg(doc, 1)
    # cream chest bib with soft fur edge (covers the tops of the front legs)
    bd = smooth(BIB)
    o += P(bd, CREAM, filter=doc.blur(1.4))
    o += clipped(doc, bd, f'<ellipse cx="320" cy="400" rx="30" ry="90" fill="{CREAM_SH}" opacity=".8" filter="{doc.blur(10)}"/>')
    for k, (x, y) in enumerate([(270, 380), (330, 384), (286, 420), (316, 424), (300, 450), (262, 340), (338, 340)]):
        o += P(taper([(x - 8, y - 10), (x, y), (x + 6, y - 8)], 1.5, .3, .3), CREAM_SH, opacity=.9)
    o += P(outline(BIB[3:-2], 1.6, 1.2, closed=False), CREAM_LN, opacity=.55)
    o += tail(doc)
    o += bandana(doc)
    o += f'<g transform="translate(0,4)">{head(doc, expr)}</g>'
    return o


if __name__ == "__main__":
    import sys
    arg = sys.argv[1] if len(sys.argv) > 1 else "content"
    if arg == "heads":
        d = Doc(1280, 330, "0 20 1280 330")
        for i, (e, t, tl) in enumerate([("content", 0, 0), ("smug", .3, -5), ("happy", -.25, 6), ("surprised", .18, 3)]):
            d.add(f'<g transform="translate({i*320 - 140},0)">{head(d, e, t, tl)}</g>')
    else:
        d = Doc(600, 740, "0 0 600 740")
        d.add(figure(d, arg))
    print(d.svg())
