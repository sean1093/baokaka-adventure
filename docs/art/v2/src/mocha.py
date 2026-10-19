"""mocha.py - 摩卡貓 in the v2 TV-anime style.

Likeness targets (from the owner's photo, described - never embedded): a
cool grey-brown tabby with a warm fawn undertone and strong black markings;
forehead M with vertical bars running to the crown; dark lines from the eye
corners across the cheeks; black-spotted whisker pads; cream chin and
muzzle; pink nose with a dark rim; large round green-yellow eyes with big
pupils; big tall ears with pale inner fur; a big round broad head; long
white whiskers; dense plush fur; dark 'necklace' bands across the chest;
banded legs and paws.  Not orange, no white socks, no cream bib.

Space: centre x=300.  Head ~ y 20..306, sitting body to y~690.
"""
import math
from geom import *

FUR = "#9A8A76"; FUR_HL = "#CBBBA2"; FUR_SH = "#6C5F51"; FUR_SH2 = "#4C4238"
FAWN = "#BFA07C"; STRIPE = "#1F1A17"; FUR_LN = "#1A1613"
CREAM = "#F1E8D8"; CREAM_SH = "#D7C8B0"; CREAM_LN = "#7E7060"
PINK = "#E9A79A"; PINK_DK = "#C98478"; EAR_IN = "#E9DCCD"
IR_C = "#DCD688"; IR_M = "#B4BE6C"; IR_O = "#748E48"; IR_RIM = "#2E3A1C"
BLUE = "#4A8BDA"; BLUE_SH = "#2F64AE"; BLUE_LN = "#1E3D6C"; GOLD = "#F1C24A"; GOLD_DK = "#9C7015"
CX = 300
TURN = 0.0
RCYL = 132.0


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


def feat(x, inner):
    if not TURN:
        return inner
    return f'<g transform="translate({tx(x):.2f},0) scale({tk(x):.3f},1) translate({-x},0)">{inner}</g>'


def M(pts):
    return pts + mirror(pts[1:-1], CX)[::-1]


def fur_tex(doc, box, seed, n=120, col=None, ang=1.57, L=(8, 16), op=.45):
    """short plush-fur strokes inside a box (caller clips)"""
    import random
    rnd = random.Random(seed)
    x0, y0, x1, y1 = box
    o = ""
    for _ in range(n):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        l = rnd.uniform(*L)
        a = ang + rnd.uniform(-.35, .35)
        c = col or rnd.choice([FUR_HL, FUR_SH, "#857563", FAWN])
        o += P(taper([(x, y), (x + math.cos(a) * l, y + math.sin(a) * l)], 2.0, .2, .9), c, opacity=op)
    return o


# ------------------------------------------------------------------ head
# big, round, broad head with plush cheek ruffs
HEAD_R = [(300, 94), (346, 96), (382, 110), (408, 136), (422, 168), (430, 198), (450, 210), (434, 220),
          (448, 236), (428, 244), (436, 258), (414, 266), (396, 284), (360, 300), (326, 308), (300, 310)]
EAR_R = [(336, 112), (354, 80), (378, 44), (402, 14), (414, 36), (420, 82), (418, 140), (400, 138), (374, 122)]
EAR_IN_R = [(352, 110), (372, 80), (394, 44), (404, 50), (408, 92), (406, 128), (384, 120)]


def ear(doc, side):
    def X(p): return [(CX + side * (x - CX), y) for x, y in p]
    pts = X(EAR_R)
    d = smooth(pts)
    o = P(d, FUR)
    o += cel(doc, d, FUR_SH, shift=(10 if side > 0 else -6, 6))
    ip = X(EAR_IN_R)
    di = smooth(ip)
    gi = doc.lin([(0, "#F4EBE0"), (.6, EAR_IN), (1, "#CDAE9E")], 0, 30, 0, 130, "userSpaceOnUse")
    o += P(di, gi)
    o += clipped(doc, di, f'<ellipse cx="{CX + side*(400-CX)}" cy="100" rx="14" ry="36" fill="#B79484" opacity=".45" filter="{doc.blur(5)}"/>')
    # dense pale ear furnishings
    for (x0, y0), (x1, y1) in [((358, 120), (372, 70)), ((368, 124), (384, 60)), ((378, 126), (394, 72)),
                               ((388, 126), (400, 88)), ((350, 114), (362, 84)), ((372, 126), (390, 46))]:
        o += P(taper([(CX + side * (x0 - CX), y0), (CX + side * ((x0 + x1) / 2 - CX + 2), (y0 + y1) / 2), (CX + side * (x1 - CX), y1)], 2.4, .2, .8), "#FFFDF6", opacity=.95)
    o += P(outline(pts, 2.4, 1.4, gaps=[(.86, 1.0)]), FUR_LN)
    # dark tip / back-of-ear rim
    o += P(taper(X([(392, 26), (402, 14), (414, 36)]), 4, .2, .5), FUR_SH2, opacity=.8)
    return o


def eye(doc, side, mode="open"):
    """large, round, green-yellow eyes with big pupils"""
    def X(x): return CX + side * (x - CX)
    out = ""
    if mode in ("open", "wide", "smug", "glare"):
        if mode == "glare":   # narrowed and slanted down toward the nose
            upper = [(X(318), 197), (X(330), 184), (X(350), 172), (X(370), 166), (X(382), 172)]
        elif mode == "smug":
            upper = [(X(318), 196), (X(330), 186), (X(350), 181), (X(370), 184), (X(382), 190)]
        elif mode == "wide":
            upper = [(X(316), 192), (X(322), 164), (X(348), 150), (X(372), 156), (X(384), 180)]
        else:
            upper = [(X(318), 194), (X(326), 168), (X(349), 156), (X(372), 162), (X(382), 184)]
        lower = [(X(382), 188), (X(373), 208), (X(350), 216), (X(328), 210)]
        if mode == "glare":
            lower = [(X(382), 186), (X(373), 206), (X(350), 213), (X(328), 208)]
        shape = upper + lower
        d = smooth(shape)
        clip = doc.clip(d)
        ix, iy = X(350), 186
        r = 24 if mode != "wide" else 26
        gI = doc.rad([(0, "#E8DC8C"), (.35, IR_C), (.68, IR_M), (1, IR_O)], .5, .5, .5)
        o = P(d, "#EDEBDF")
        o += f'<g clip-path="{clip}">'
        o += f'<circle cx="{ix}" cy="{iy}" r="{r}" fill="{gI}"/>'
        for k in range(18):
            a = 2 * math.pi * k / 18
            o += P(taper([(ix + math.cos(a) * 9, iy + math.sin(a) * 9), (ix + math.cos(a) * r * .95, iy + math.sin(a) * r * .95)], 1.2, .3, .5), IR_O, opacity=.35)
        o += f'<circle cx="{ix}" cy="{iy}" r="{r}" fill="none" stroke="{IR_RIM}" stroke-width="2.6"/>'
        if mode == "wide":
            o += f'<circle cx="{ix}" cy="{iy}" r="15" fill="#0E0B08"/>'
        elif mode in ("smug", "glare"):
            o += f'<ellipse cx="{ix}" cy="{iy}" rx="{4 if mode == "glare" else 5}" ry="15" fill="#0E0B08"/>'
        else:   # the photo: big, softly dilated vertical pupils
            o += f'<ellipse cx="{ix}" cy="{iy}" rx="9" ry="17" fill="#0E0B08"/>'
        o += P(smooth(upper + [(X(386), 140), (X(314), 140)]), "#1E1A10", opacity=.55, transform="translate(0,8)", filter=doc.blur(3))
        o += f'<ellipse cx="{ix}" cy="{iy+12}" rx="{r*.7}" ry="{r*.32}" fill="#FAF2A8" opacity=".5" filter="{doc.blur(3)}"/>'
        o += f'<ellipse cx="{ix - side*8}" cy="{iy - 9}" rx="6.5" ry="7.5" fill="#fff" transform="rotate({-20*side} {ix - side*8} {iy-9})"/>'
        o += f'<circle cx="{ix + side*9}" cy="{iy + 10}" r="2.8" fill="#fff" opacity=".9"/>'
        o += "</g>"
        o += P(taper(upper, 5.4, .1, .15, prof=lambda t: .7 + .5 * math.sin(math.pi * t)), FUR_LN)
        o += P(taper(lower + [upper[0]], 3.0, .1, .3), FUR_LN, opacity=.9)
        # pale fur rim around the eye, then the tear line toward the nose
        o += P(taper([(X(326), 214), (X(350), 222), (X(376), 212)], 4, .3, .3), "#E6DAC4", opacity=.8)
        o += P(taper([(X(319), 198), (X(314), 212), (X(310), 226)], 3.4, .1, .8), FUR_LN, opacity=.85)
        if mode == "glare":   # the furrowed fur above the eye
            o += P(taper([(X(312), 184), (X(342), 164), (X(380), 154)], 5.2, .2, .6), FUR_LN, opacity=.85)
        if mode == "smug":
            o += P(taper([(X(324), 176), (X(350), 172), (X(376), 178)], 1.6, .3, .3), FUR_LN, opacity=.6)
        out += o
    elif mode == "closed":
        arc = [(X(318), 194), (X(332), 180), (X(350), 176), (X(368), 180), (X(382), 192)]
        out += P(taper(arc, 5, .15, .15), FUR_LN)
    elif mode == "sleep":      # peaceful closed lids, curving down
        arc = [(X(318), 186), (X(334), 196), (X(352), 198), (X(370), 194), (X(382), 184)]
        out += P(taper(arc, 4.6, .15, .15), FUR_LN)
        out += P(taper([(X(322), 204), (X(350), 210), (X(376), 202)], 3, .3, .3), "#E6DAC4", opacity=.7)
    return out


def mouth(doc, mode="content"):
    o = ""
    nose = [(300, 240), (284, 224), (282, 216), (300, 213), (318, 216), (316, 224)]
    nd = smooth(nose)
    gN = doc.lin([(0, "#F4BCB0"), (1, PINK_DK)], 0, 212, 0, 242, "userSpaceOnUse")
    o += P(nd, gN) + P(outline(nose, 2.6, 1.3), "#2A1E1A")
    o += f'<ellipse cx="293" cy="219" rx="5" ry="2.2" fill="#fff" opacity=".8"/>'
    if mode == "open":
        sh = [(286, 252), (300, 250), (314, 252), (310, 268), (300, 274), (290, 268)]
        d = smooth(sh)
        o += P(d, "#6A2A26") + clipped(doc, d, f'<ellipse cx="300" cy="274" rx="11" ry="7" fill="{PINK}"/>')
        o += P(outline(sh, 1.6, 1), FUR_LN)
    if mode == "o":
        sh = ellipse_pts(300, 262, 6, 8, 10)
        o += P(smooth(sh), "#6A2A26") + P(outline(sh, 1.6, 1), FUR_LN)
    o += P(taper([(300, 240), (300, 251)], 2.2, .1, .1), FUR_LN)
    o += P(taper([(300, 250), (292, 257), (282, 256), (276, 251)], 2.2, .1, .5), FUR_LN)
    o += P(taper([(300, 250), (308, 257), (318, 256), (324, 251)], 2.2, .1, .5), FUR_LN)
    return o


def whiskers(doc, side):
    o = ""
    # black-spotted whisker pads (rows of dots)
    for r_, (y0, n) in enumerate([(238, 4), (246, 5), (254, 4)]):
        for k in range(n):
            o += f'<ellipse cx="{CX + side*(16 + k*6.5 + r_*2)}" cy="{y0 + k*1.2}" rx="1.8" ry="1.6" fill="{STRIPE}" opacity=".85"/>'
    for k, (y0, x1, y1) in enumerate([(238, 470, 206), (243, 482, 228), (248, 486, 250), (253, 478, 274), (258, 462, 296)]):
        pts = [(CX + side * 40, y0), (CX + side * 110, y0 - 2 + (y1 - y0) * .4), (CX + side * (x1 - CX), y1)]
        o += P(taper(pts, 2.4, .05, .9), FUR_SH2, opacity=.5, transform="translate(.8,1)")
        o += P(taper(pts, 2.0, .05, .9), "#FFFEF8")
    return o


EXPR = {"sleep": ("sleep", "content"), "content": ("open", "content"), "smug": ("smug", "content"), "happy": ("closed", "open"),
        "surprised": ("wide", "o"),
        # #141: glare (narrowed eyes, ears flattened back) and purr (eyes closed, content)
        "glare": ("glare", "content", "back"), "purr": ("closed", "content")}


def head(doc, expr="content", turn=0.0, tilt=0.0):
    global TURN
    TURN = turn
    E = EXPR[expr]
    o = ""
    for side in (-1, 1):
        dx = -side * RCYL * (1 - math.cos(turn)) * .9 + (-RCYL * math.sin(turn) * .45)
        far = (side > 0) == (turn < 0)
        sx = 1 - (.25 * min(1, abs(turn) / .5) if far and abs(turn) > .1 else 0)
        ex_ = CX + side * 90
        flat = ""
        if len(E) > 2 and E[2] == "back":   # ears flattened out and back (cross)
            bx = CX + side * 80
            flat = f" translate({bx},132) rotate({side * 38}) scale(1,.78) translate({-bx},-132)"
        o += f'<g transform="translate({dx:.1f},0) translate({ex_},0) scale({sx:.3f},1) translate({-ex_},0){flat}">{ear(doc, side)}</g>'
    pts = M(HEAD_R)
    if turn:
        sh = -RCYL * math.sin(turn) * .35
        pts = [(x + sh * max(0, min(1, (y - 150) / 150)), y) for x, y in pts]
    d = smooth(pts)
    gF = doc.rad([(0, FUR_HL), (.55, FUR), (1, "#8E7E6A")], .4 - turn * .3, .35, .7)
    o += P(d, gF)
    inner = fur_tex(doc, (160, 90, 440, 310), 3, 140, op=.35)
    # warm fawn undertone around the eyes and on the cheeks
    fw = ""
    for side in (-1, 1):
        fw += f'<ellipse cx="{CX + side*52}" cy="196" rx="44" ry="30" fill="{FAWN}" opacity=".7" filter="{doc.blur(8)}"/>'
        fw += f'<ellipse cx="{CX + side*80}" cy="250" rx="40" ry="26" fill="{FAWN}" opacity=".5" filter="{doc.blur(10)}"/>'
    inner += feat(300, fw)
    S = STRIPE
    mk = ""
    # forehead M plus the vertical bars running up to the crown
    for pts_, w in [
        ([(270, 168), (276, 142), (286, 124)], 9), ([(286, 126), (293, 140), (300, 154)], 7),
        ([(330, 168), (324, 142), (314, 124)], 9), ([(314, 126), (307, 140), (300, 154)], 7),
        ([(300, 140), (300, 116), (300, 90)], 12), ([(284, 118), (282, 100), (282, 86)], 11), ([(316, 118), (318, 100), (318, 86)], 11),
        ([(266, 130), (262, 110), (262, 92)], 9), ([(334, 130), (338, 110), (338, 92)], 9),
        ([(250, 132), (242, 116), (238, 104)], 7), ([(350, 132), (358, 116), (362, 104)], 7),
    ]:
        mk += P(strand(pts_, w, bulge=.25), S, opacity=.92)
    inner += feat(300, mk)
    for side in (-1, 1):
        def X(x): return CX + side * (x - CX)
        ck = P(strand([(X(380), 190), (X(400), 196), (X(428), 210)], 9, bulge=.15), S, opacity=.9)
        ck += P(strand([(X(372), 218), (X(396), 228), (X(428), 246)], 10, bulge=.2), S, opacity=.88)
        ck += P(strand([(X(384), 160), (X(400), 166), (X(414), 182)], 7, bulge=.1), S, opacity=.75)
        ck += P(strand([(X(404), 268), (X(380), 280), (X(356), 290)], 8, bulge=.2), S, opacity=.6)
        inner += feat(X(396), ck)
    # cream muzzle and chin (small, as in the photo)
    muz = [(300, 222), (320, 230), (338, 240), (344, 256), (334, 274), (316, 290), (300, 298), (284, 290),
           (266, 274), (256, 256), (262, 240), (280, 230)]
    mz = P(smooth(muz), CREAM, filter=doc.blur(1.6))
    mz += P(smooth([(300, 160), (309, 190), (306, 214), (294, 214), (291, 190)]), FUR_HL, opacity=.6, filter=doc.blur(3))
    inner += feat(300, mz)
    if abs(turn) > .15:
        # the side of the head comes into view: temple + cheek stripes
        k = min(1.0, abs(turn) / .5)
        sd = -1 if turn < 0 else 1
        side_m = ""
        for pts_, w in [([(232, 120), (222, 150), (220, 180)], 10), ([(206, 150), (198, 176), (200, 200)], 9),
                        ([(194, 210), (210, 222), (236, 230)], 9), ([(186, 238), (206, 250), (234, 256)], 8),
                        ([(258, 108), (250, 128), (248, 146)], 8)]:
            q = [(x if sd < 0 else 2 * CX - x, y) for x, y in pts_]
            side_m += P(strand(q, w, bulge=.25), STRIPE, opacity=.85)
        inner += f'<g opacity="{k:.2f}">{side_m}</g>'
    inner += P(d, FUR_SH, opacity=.8, mask=doc.mask(f'<path d="{d}" fill="#fff"/><path d="{d}" fill="#000" transform="translate(-20,-8)"/>'))
    inner += f'<ellipse cx="300" cy="306" rx="80" ry="16" fill="{FUR_SH2}" opacity=".5" filter="{doc.blur(5)}"/>'
    o += clipped(doc, d, inner)
    o += feat(300, "".join(f'<ellipse cx="{CX + s*20}" cy="256" rx="18" ry="10" fill="{CREAM_SH}" opacity=".55" filter="{doc.blur(3)}"/>' for s in (-1, 1)))
    o += P(outline(pts, 2.6, 1.5, gaps=[(.0, .015), (.985, 1.0)]), FUR_LN)
    for side in (-1, 1):
        o += feat(CX + side * 50, eye(doc, side, E[0]))
    o += feat(300, mouth(doc, E[1]))
    for side in (-1, 1):
        o += feat(CX + side * 20, whiskers(doc, side))
    if expr == "smug":
        o += feat(300, "".join(P(taper([(CX + s * 30, 158), (CX + s * 50, 154), (CX + s * 68, 158)], 2.4, .3, .3), FUR_LN, opacity=.6) for s in (-1, 1)))
    TURN = 0.0
    if tilt:
        o = f'<g transform="rotate({tilt} 300 200)">{o}</g>'
    return o


# ------------------------------------------------------------------ body
BODY = [(234, 286), (210, 332), (198, 392), (184, 462), (170, 540), (178, 612), (222, 650), (300, 658),
        (378, 650), (422, 612), (430, 540), (416, 462), (402, 392), (390, 332), (366, 286)]
HAUNCH_L = [(206, 440), (164, 476), (144, 540), (148, 604), (174, 646), (224, 662), (266, 648), (274, 590),
            (264, 520), (240, 460)]


def tail(doc):
    C = [(404, 594), (450, 622), (452, 660), (414, 680), (330, 686), (252, 680), (206, 664), (188, 640)]
    W = [48, 44, 42, 40, 38, 34, 30, 26]
    loop = limb(C, W, 14)
    d = poly(loop)
    o = P(d, FUR)
    D = dense(C, False, 14)
    N = normals(D)
    inner = fur_tex(doc, (180, 590, 470, 700), 21, 70, op=.35)
    for k in range(10, len(D) - 4, 11):
        p, n = D[k], N[k]
        inner += P(strand([(p[0] - n[0] * 28, p[1] - n[1] * 28), (p[0] + n[0] * 28, p[1] + n[1] * 28)], 11, bulge=.3, tip=.6), STRIPE, opacity=.9)
    inner += P(d, FUR_SH, opacity=.8, mask=doc.mask(f'<path d="{d}" fill="#fff"/><path d="{d}" fill="#000" transform="translate(-4,-10)"/>'))
    inner += P(poly(limb([tuple(D[-14]), tuple(D[-7]), tuple(D[-1])], [32, 30, 28], 6)), STRIPE)
    inner += P(taper([tuple(D[-12] + N[-12] * 6), tuple(D[-5] + N[-5] * 6), tuple(D[-1] + N[-1] * 2)], 4, .3, .4), "#6A6056", opacity=.9)
    o += clipped(doc, d, inner)
    o += P(outline(loop, 2.4, 1.4, n=2), FUR_LN)
    return o


def leg(doc, side):
    def X(x): return CX + side * (x - CX)
    C = [(X(334), 380), (X(337), 450), (X(338), 520), (X(336), 572), (X(334), 604)]
    loop = limb(C, [68, 58, 50, 44, 48], 12)
    d = poly(loop)
    gL = doc.lin([(0, FUR_HL), (.45, FUR), (1, FUR_SH)], 0, 0, 1, 0) if side < 0 else doc.lin([(0, FUR), (.55, FUR), (1, FUR_SH2)], 0, 0, 1, 0)
    o = P(d, gL)
    inner = fur_tex(doc, (X(300) if side < 0 else X(372), 380, X(372) if side < 0 else X(300), 620), 30 + side, 50, op=.35)
    # banded legs (tabby bars)
    for y in (452, 482, 512, 542, 572):
        inner += P(strand([(X(304), y), (X(320), y - 4), (X(338), y - 2), (X(366), y + 5)], 9, bulge=.4, tip=.7), STRIPE, opacity=.88)
    inner += P(d, FUR_SH, opacity=.75, mask=doc.mask(f'<path d="{d}" fill="#fff"/><path d="{d}" fill="#000" transform="translate(-12,-2)"/>'))
    inner += f'<ellipse cx="{X(334)}" cy="380" rx="30" ry="40" fill="{FUR_SH2}" opacity=".5" filter="{doc.blur(8)}"/>'
    inner += f'<ellipse cx="{X(326)}" cy="470" rx="8" ry="60" fill="#fff" opacity=".18" filter="{doc.blur(5)}"/>'
    o += clipped(doc, d, inner)
    o += P(outline(loop, 2.4, 1.4, n=2, gaps=[(.9, 1), (0, .1)]), FUR_LN)
    # plush paw (fur coloured, lighter fawn tips), toes seen from the front
    shapes = [smooth(ellipse_pts(X(334), 608, 30, 19, 12))]
    for k, dx in enumerate((-20, -7, 7, 20)):
        shapes.append(smooth(ellipse_pts(X(334) + dx * side, 623 - (2 if 0 < k < 3 else 0), 10, 11, 10)))
    o += union_ink(shapes, "#A89680", FUR_LN, 1.1)
    o += f'<ellipse cx="{X(330)}" cy="604" rx="20" ry="7" fill="{FUR_HL}" opacity=".7" filter="{doc.blur(3)}"/>'
    o += f'<ellipse cx="{X(338)}" cy="626" rx="26" ry="8" fill="{FUR_SH}" opacity=".7" filter="{doc.blur(2.5)}"/>'
    for dx in (-13, 0, 13):
        x = X(334) + dx * side
        o += P(taper([(x, 614), (x + .5, 632)], 1.6, .3, .2), FUR_LN, opacity=.85)
    return o


def haunch(doc, side):
    pts = HAUNCH_L if side < 0 else mirror(HAUNCH_L, CX)[::-1]
    d = smooth(pts)
    o = P(d, FUR)

    def X(x): return x if side < 0 else 2 * CX - x
    inner = fur_tex(doc, (X(140) if side < 0 else X(280), 430, X(280) if side < 0 else X(140), 670), 40 + side, 80, op=.35)
    # classic-tabby swirl bands on the thigh
    for (a, b, c), w in [(((180, 500), (214, 482), (246, 490)), 13), (((166, 540), (204, 522), (250, 530)), 14),
                         (((168, 584), (208, 566), (256, 574)), 14), (((182, 622), (216, 610), (258, 616)), 11)]:
        inner += P(strand([(X(a[0]), a[1]), (X(b[0]), b[1]), (X(c[0]), c[1])], w, bulge=.4, tip=.8), STRIPE, opacity=.88)
    inner += P(d, FUR_SH, opacity=.75, mask=doc.mask(f'<path d="{d}" fill="#fff"/><path d="{d}" fill="#000" transform="translate(-14,-10)"/>'))
    inner += f'<ellipse cx="{X(214)}" cy="520" rx="34" ry="30" fill="{FUR_HL}" opacity=".45" filter="{doc.blur(9)}"/>'
    o += clipped(doc, d, inner)
    o += P(outline(pts, 2.4, 1.4, gaps=[(.55, .8)]), FUR_LN)
    paw = [(X(176), 642), (X(194), 626), (X(232), 628), (X(250), 642), (X(236), 658), (X(194), 660)]
    pd = smooth(paw)
    o += P(pd, "#A89680") + cel(doc, pd, FUR_SH, shift=(6, 4))
    o += clipped(doc, pd, "".join(P(taper([(X(x), 632), (X(x + 2), 650)], 7, .3, .3), STRIPE, opacity=.6) for x in (204, 222)))
    o += P(outline(paw, 2.0, 1.2), FUR_LN)
    return o


def chest(doc):
    """lighter fawn chest with the dark 'necklace' bands of the photo, drawn
    between the front legs and under the chin"""
    sh = [(246, 290), (300, 304), (354, 290), (364, 340), (352, 400), (334, 450), (300, 480), (266, 450), (248, 400), (236, 340)]
    d = smooth(sh)
    o = P(d, "#AE9B84", filter=doc.blur(2))
    inner = fur_tex(doc, (230, 290, 370, 480), 51, 70, op=.4)
    for y, w in ((352, 12), (392, 12), (432, 10)):
        inner += P(strand([(246, y - 8), (272, y + 6), (300, y + 12), (328, y + 6), (354, y - 8)][::1], w, bulge=.3, tip=.4), STRIPE, opacity=.85)
    inner += f'<ellipse cx="300" cy="306" rx="70" ry="14" fill="{FUR_SH2}" opacity=".6" filter="{doc.blur(5)}"/>'
    o += clipped(doc, d, inner)
    # plush tufts at the chest edge
    for x, y, a in [(248, 340, 2.6), (244, 370, 2.4), (352, 340, .55), (356, 372, .7), (270, 452, 2.0), (330, 452, 1.1), (300, 474, 1.57)]:
        o += P(strand([(x, y), (x + math.cos(a) * 14, y + math.sin(a) * 14)], 9, bulge=.3), "#AE9B84")
    return o


def collar(doc):
    """slim MRT-blue collar with the gold fish tag (keeps his game identity
    without hiding the chest necklace stripes)"""
    band = [(232, 314), (270, 326), (300, 329), (330, 326), (368, 314), (368, 326), (330, 338), (300, 341), (270, 338), (232, 326)]
    d = smooth(band)
    o = P(d, BLUE) + cel(doc, d, BLUE_SH, shift=(8, -4))
    o += "".join(f'<circle cx="{x}" cy="{y}" r="2.2" fill="#fff"/>' for x, y in [(250, 324), (276, 332), (324, 332), (350, 324)])
    o += P(outline(band, 1.8, 1.2), BLUE_LN)
    o += f'<circle cx="300" cy="344" r="4.5" fill="none" stroke="{GOLD_DK}" stroke-width="2.2"/>'
    tag = ellipse_pts(300, 362, 14, 14, 14)
    td = smooth(tag)
    gG = doc.rad([(0, "#FFF2B0"), (.5, GOLD), (1, "#C9921E")], .35, .3, .75)
    o += P(td, gG) + P(outline(tag, 2, 1.2), GOLD_DK)
    o += P(smooth([(291, 362), (300, 356), (308, 360), (313, 356), (313, 368), (308, 364), (300, 368)]), "#C9921E")
    o += f'<circle cx="296" cy="361" r="1.3" fill="#7A5410"/>'
    o += P(taper([(291, 354), (297, 351)], 2, .2, .2), "#fff", opacity=.9)
    return o


def figure(doc, expr="content", shadow=True):
    o = ""
    if shadow:
        o += f'<ellipse cx="300" cy="676" rx="200" ry="22" fill="#3A3028" opacity=".22" filter="{doc.blur(8)}"/>'
    d = smooth(BODY)
    gB = doc.lin([(0, FUR_HL), (.4, FUR), (1, FUR_SH)], 0, 280, 0, 660, "userSpaceOnUse")
    o += P(d, gB)
    inner = fur_tex(doc, (170, 280, 430, 660), 61, 160, op=.35)
    for side in (-1, 1):
        for k in range(5):
            x0 = 300 + side * (80 + k * 10)
            y0 = 318 + k * 26
            pts_ = [(x0, y0), (x0 + side * 10, y0 + 40), (x0 + side * 12, y0 + 84)]
            inner += P(strand(pts_[::-1], 13 - k, bulge=.4, tip=.9), STRIPE, opacity=.82)
    inner += P(d, FUR_SH, opacity=.8, mask=doc.mask(f'<path d="{d}" fill="#fff"/><path d="{d}" fill="#000" transform="translate(-22,-6)"/>'))
    o += clipped(doc, d, inner)
    o += P(outline(BODY, 2.6, 1.4, gaps=[(.0, .06), (.94, 1.0)]), FUR_LN)
    o += haunch(doc, -1) + haunch(doc, 1)
    o += leg(doc, -1) + leg(doc, 1)
    o += chest(doc)
    o += tail(doc)
    o += collar(doc)
    o += f'<g transform="translate(300,306) scale(1.12) translate(-300,-300)">{head(doc, expr)}</g>'
    return o


if __name__ == "__main__":
    import sys
    arg = sys.argv[1] if len(sys.argv) > 1 else "content"
    if arg == "heads":
        d = Doc(1280, 330, "0 0 1280 330")
        for i, (e, t, tl) in enumerate([("content", 0, 0), ("smug", .3, -5), ("happy", -.25, 6), ("surprised", .18, 3)]):
            d.add(f'<g transform="translate({i*320 - 140},0)">{head(d, e, t, tl)}</g>')
    else:
        d = Doc(600, 760, "0 -30 600 760")
        d.add(figure(d, arg))
    print(d.svg())
