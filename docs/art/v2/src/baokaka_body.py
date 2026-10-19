"""baokaka_body.py - 寶咖咖 full figure (front, first-steps stance).

Outfit (owner correction: a TWO-PIECE set, not a onesie): mustard long-sleeve
cotton top with a cream Peter Pan collar, shoulder buttons and a small
embroidered crescent-moon-and-star; grey-white gingham pants (the gingham of
his bib in the photo) with gathered ankle cuffs; cream socks; red-string
bracelet on the right wrist.  Mustard + grey/white read clearly against the
game's midnight-blue scenes.

Shares the head coordinate space of baokaka.py; ~3.3 heads, soles y~1336.
"""
import math
import random
from geom import *
import baokaka as H

TOP = "#F6C24E"; TOP_SH = "#E09E3A"; TOP_SH2 = "#C5812A"; TOP_HL = "#FFE7A2"; TOP_LN = "#8A561C"
CREAM = "#FFF6E6"; CREAM_SH = "#EAD5B4"; CREAM_LN = "#9C7A54"
GING_W = "#F7F7F4"; GING_B = "#8E959D"; PANTS_SH = "#4E5660"; PANTS_LN = "#4A5058"
SOCK = "#FBF8F0"; SOCK_SH = "#E2DACB"; SOCK_LN = "#8E8476"
RED = "#D9372E"; RED_DK = "#8E1D19"; GOLD = "#F1C24A"; GOLD_DK = "#A87818"
SKIN, SKIN_SH, SKIN_SH2, SKIN_LN = H.SKIN, H.SKIN_SH, H.SKIN_SH2, H.SKIN_LN
# legacy names used by props.py swatches
PJ, PJ_SH, PJ_SH2, PJ_HL, PJ_LN = TOP, TOP_SH, TOP_SH2, TOP_HL, TOP_LN
BEAR, BEAR_SH, BEAR_LT = "#B9805A", "#8F5B3C", "#E9C9A4"
DY = 14          # the body sits a little lower under the fuller v2 face


def fold(pts, w=10, op=.85, ink=1.5, col=TOP_SH, inkop=.75, ln=TOP_LN, deep=TOP_SH2):
    """fabric fold: tapered ink line, shadow falling to the lower/far side"""
    D = dense(pts, False, 8)
    N = normals(D)
    sgn = 1 if (N[:, 1].mean() > 0) else -1
    sh = [(x + nx * sgn * w * .45, y + ny * sgn * w * .45) for (x, y), (nx, ny) in zip(D[::3], N[::3])]
    if len(sh) < 3:
        sh = [tuple(D[0]), tuple(D[len(D) // 2]), tuple(D[-1])]
    o = P(strand(sh, w, bulge=.6, tip=1.0), col, opacity=op)
    o += P(strand(sh, w * .45, bulge=.6, tip=1.0), deep, opacity=op * .45)
    if ink:
        o += P(taper(pts, ink, .3, .5), ln, opacity=inkop)
    return o


def pfold(pts, w=10, ink=1.4):
    return fold(pts, w, op=.45, ink=ink, col=PANTS_SH, ln=PANTS_LN, deep="#2E343C", inkop=.7)


def star(cx, cy, r, rot=0):
    pts = []
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5 + rot
        rr = r if k % 2 == 0 else r * .45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return poly(pts)


def gingham(doc, rot=0, size=20):
    i = doc.id("pt")
    h = size / 2
    doc.defs.append(f'<pattern id="{i}" patternUnits="userSpaceOnUse" width="{size}" height="{size}" patternTransform="rotate({rot})">'
                    f'<rect width="{size}" height="{size}" fill="{GING_W}"/>'
                    f'<rect width="{h}" height="{size}" fill="{GING_B}" opacity=".42"/>'
                    f'<rect width="{size}" height="{h}" fill="{GING_B}" opacity=".42"/></pattern>')
    return f"url(#{i})"


def fabric_grad(doc, x0, y0, x1, y1):
    return doc.lin([(0, TOP_HL), (.35, TOP), (1, "#F0B442")], x0, y0, x1, y1, "userSpaceOnUse")


# ---------------------------------------------------------------- shapes
TOPS = [(150, 400), (110, 416), (86, 446), (72, 500), (58, 580), (46, 680), (42, 770), (46, 836),
        (120, 856), (200, 864), (280, 856), (354, 836), (358, 770), (354, 680), (342, 580),
        (328, 500), (314, 446), (290, 416), (250, 400)]
HIPS = [(56, 790), (344, 790), (352, 860), (350, 900), (290, 912), (232, 920), (200, 948), (168, 920), (110, 912), (50, 900), (48, 860)]
LEG_C = [(126, 860), (110, 960), (98, 1042), (104, 1120), (114, 1180)]
LEG_W = [166, 160, 130, 114, 104]
FOOT_L = [(84, 1190), (66, 1218), (56, 1258), (64, 1296), (92, 1318), (128, 1318), (152, 1302), (158, 1262),
          (152, 1220), (140, 1192), (112, 1184)]
ARM_C = [(112, 466), (70, 516), (38, 568), (8, 614), (-16, 650)]
ARM_W = [92, 80, 70, 62, 56]
SOLE_Y = 1322 + DY


def hand_shapes():
    """palm-forward splayed toddler hand, local frame: wrist at 0,0, fingers
    toward +y, thumb toward -x.  returns list of path d's + detail lines"""
    palm = [(-18, -4), (18, -4), (22, 18), (21, 36), (8, 44), (-10, 44), (-22, 34), (-22, 14)]
    fingers = [  # base, tip, width
        ((14, 32), (21, 47), 11.5),
        ((5, 36), (8, 55), 12),
        ((-4, 37), (-5, 57), 12.5),
        ((-13, 34), (-19, 52), 12),
    ]
    shapes = [smooth(palm)]
    for (bx, by), (tx, ty), w in fingers:
        shapes.append(poly(limb([(bx, by), ((bx + tx) / 2, (by + ty) / 2 + 1), (tx, ty)], [w * 1.05, w, w * .92], 8)))
    thumb = poly(limb([(-14, 14), (-24, 24), (-30, 34)], [16, 13.5, 12], 8))
    shapes.append(thumb)
    return shapes, fingers


def hand(doc, side, at, rot):
    shapes, fingers = hand_shapes()
    tf = f"translate({at[0]},{at[1]}) rotate({rot}) scale({1.45 if side < 0 else -1.45},1.45)"
    o = union_ink(shapes, SKIN, SKIN_LN, .9)
    # shading: far side of the palm, finger undersides, palm crease
    sh = ""
    for (bx, by), (tx, ty), w in fingers:
        sh += P(taper([(bx + 3, by + 6), (tx + 2.5, ty - 4)], w * .3, .4, .5), SKIN_SH, opacity=.55)
        sh += f'<ellipse cx="{tx}" cy="{ty-3}" rx="3.2" ry="2.4" fill="#fff" opacity=".55"/>'  # nail sheen
    sh += P(taper([(14, 4), (20, 20), (18, 38)], 9, .2, .3), SKIN_SH, opacity=.85)
    sh += P(taper([(-16, 24), (-4, 28), (10, 24)], 1.4, .3, .3), SKIN_SH2, opacity=.8)
    sh += f'<ellipse cx="-2" cy="14" rx="12" ry="9" fill="#fff" opacity=".4" filter="{doc.blur(3)}"/>'
    o += sh
    # finger separation inks at the bases
    for (bx, by), (tx, ty), w in fingers[:3]:
        o += P(taper([(bx - w * .48, by + 6), (bx - w * .5 + (tx - bx) * .2, by + 14)], 1.3, .2, .5), SKIN_LN, opacity=.8)
    o += P(taper([(-20, 24), (-15, 30)], 1.2, .3, .3), SKIN_LN, opacity=.7)
    return f'<g transform="{tf}">{o}</g>'


def bracelet(doc):
    """red string bracelet, local frame (wrist centre at 0,0, arm along y)"""
    pts = [(-23, -2), (-10, 3), (8, 3), (22, -2)]
    o = P(taper(pts, 6.5, .05, .05), RED)
    o += P(taper(pts, 2, .1, .1), "#FF7A6A", opacity=.8, transform="translate(-1,-1.5)")
    o += P(taper(pts, 1.2, .05, .05), RED_DK, opacity=.8, transform="translate(0,2.6)")
    for t in range(6):
        x = -20 + t * 7.5
        o += P(taper([(x, -1), (x + 3, 4)], 1.1, .3, .3), RED_DK, opacity=.7)
    o += f'<circle cx="0" cy="6" r="6" fill="{GOLD}" stroke="{GOLD_DK}" stroke-width="1.4"/>'
    o += f'<circle cx="-2" cy="4" r="2" fill="#FFF6C8"/>'
    return o


ARM_RAISE = {-1: 4.0, 1: -11.0}   # degrees; asymmetric balance pose


def arm_c(side):
    sx, sy = (ARM_C[0][0] if side < 0 else 400 - ARM_C[0][0]), ARM_C[0][1]
    a = math.radians(ARM_RAISE[side])
    out = []
    for x, y in ARM_C:
        x = x if side < 0 else 400 - x
        dx, dy = x - sx, y - sy
        out.append((sx + dx * math.cos(a) - dy * math.sin(a), sy + dx * math.sin(a) + dy * math.cos(a)))
    return out


def wrist_frame(side):
    c = arm_c(side)
    w = c[-1]
    v = (c[-1][0] - c[-2][0], c[-1][1] - c[-2][1])
    L = math.hypot(*v)
    v = (v[0] / L, v[1] / L)
    rot = math.degrees(math.atan2(-v[0], v[1]))
    return w, v, rot


def collar(doc):
    """cream Peter Pan collar: two rounded flaps meeting under the chin"""
    o = ""
    for side in (-1, 1):
        def X(x): return 200 + side * (x - 200)
        pts = [(X(200), 410), (X(170), 404), (X(132), 400), (X(110), 410), (X(114), 432), (X(140), 448), (X(176), 452), (X(198), 440)]
        d = smooth(pts)
        o += P(d, CREAM) + cel(doc, d, CREAM_SH, shift=(10, -6) if side < 0 else (12, -4))
        o += P(smooth([(X(120), 420), (X(150), 438), (X(190), 440)], closed=False), "none", stroke="#D8BE95", stroke_width="1.4", stroke_dasharray="4 4")
        o += P(outline(pts, 2.0, 1.2), CREAM_LN)
    return o


def motif(doc, cx=262, cy=548, k=1.5):
    """small embroidered crescent moon + star (his Moon Line ticket theme)"""
    moon = f'<path d="M{cx-14},{cy-16} A20,20 0 1,0 {cx+12},{cy+14} A15,15 0 1,1 {cx-14},{cy-16}Z" fill="#FFF0C2" stroke="#B9862E" stroke-width="1.6"/>'
    o = moon + P(star(cx + 16, cy - 14, 9, .2), "#FFF0C2") + P(star(cx + 16, cy - 14, 9, .2), "none", stroke="#B9862E", stroke_width="1.4")
    o += f'<path d="M{cx-12},{cy-10} A16,16 0 0,0 {cx+4},{cy+12}" fill="none" stroke="#E8C77A" stroke-width="1.2" stroke-dasharray="2.5 2.5"/>'
    return f'<g transform="translate({cx},{cy}) scale({k}) translate({-cx},{-cy})">{o}</g>'


def pants(doc, flat=False):
    o = ""
    for side in (-1, 1):
        def X(x): return x if side < 0 else 400 - x
        C = [(X(x), y) for x, y in LEG_C]
        loop = limb(C, LEG_W)
        d = poly(loop)
        o += P(d, gingham(doc, 0))
        ex = pfold([(X(196), 930), (X(172), 962), (X(150), 1000)], 14)
        ex += pfold([(X(178), 990), (X(160), 1010), (X(144), 1034)], 8, 1.1)
        ex += pfold([(X(58), 1040), (X(92), 1056), (X(140), 1052)], 11)
        ex += pfold([(X(70), 1080), (X(104), 1090), (X(134), 1084)], 7, 1.0)
        ex += pfold([(X(62), 1130), (X(100), 1146), (X(150), 1138)], 10)
        ex += pfold([(X(66), 1158), (X(104), 1170), (X(150), 1162)], 8, 1.0)
        ex += f'<ellipse cx="{X(178)}" cy="960" rx="30" ry="80" fill="{PANTS_SH}" opacity=".35" filter="{doc.blur(10)}"/>'
        ex += f'<ellipse cx="{X(90)}" cy="1000" rx="22" ry="60" fill="#fff" opacity=".45" filter="{doc.blur(10)}"/>'
        o += cel(doc, d, PANTS_SH, shift=(16, 4), extra=ex, opacity=.42)
        o += P(outline(loop, 2.5, 1.4, n=2, gaps=[(.0, .03), (.97, 1.0)]), PANTS_LN)
        # gathered elastic ankle cuff
        cuff = limb([(X(106), 1166), (X(114), 1190)], [100, 92], 6)
        cd = poly(cuff)
        o += P(cd, gingham(doc, 0, 16))
        o += clipped(doc, cd, "".join(P(taper([(X(64 + k * 9), 1168), (X(66 + k * 9), 1192)], 1.4, .2, .2), PANTS_LN, opacity=.5) for k in range(11)))
        o += cel(doc, cd, PANTS_SH, shift=(8, 4), opacity=.4) + P(outline(cuff, 2.2, 1.2, n=2), PANTS_LN)
    hd = smooth(HIPS)
    o += P(hd, gingham(doc, 0))
    ex = f'<ellipse cx="200" cy="920" rx="70" ry="30" fill="{PANTS_SH}" opacity=".4" filter="{doc.blur(10)}"/>'
    ex += pfold([(150, 900), (180, 920), (200, 948)], 10)
    ex += pfold([(250, 900), (222, 918), (202, 946)], 10)
    o += cel(doc, hd, PANTS_SH, shift=(22, 4), extra=ex, opacity=.42)
    if flat:
        o += P(outline(HIPS, 2.5, 1.4), PANTS_LN)
    else:   # ink only the outer hips and the crotch V; the legs continue the form
        o += P(outline([(56, 820), (48, 860), (52, 904)], 2.5, 1.4, closed=False), PANTS_LN)
        o += P(outline([(344, 820), (352, 860), (348, 904)], 2.5, 1.4, closed=False), PANTS_LN)
        o += P(taper([(160, 920), (186, 930), (200, 948)], 1.8, .6, .1), PANTS_LN, opacity=.85)
        o += P(taper([(200, 948), (214, 930), (240, 920)], 1.8, .1, .6), PANTS_LN, opacity=.85)
    if flat:   # elastic waistband
        wb = [(54, 790), (346, 790), (348, 812), (52, 812)]
        o += P(poly(wb), gingham(doc, 0, 20)) + "".join(P(taper([(x, 792), (x, 810)], 1.3, .1, .1), PANTS_LN, opacity=.5) for x in range(62, 344, 10))
        o += P(outline(wb + [wb[0]], 2.2, 1.2, closed=False, n=2), PANTS_LN)
    return o


def socks(doc):
    o = ""
    for side in (-1, 1):
        def X(x): return x if side < 0 else 400 - x
        FOOT = FOOT_L if side < 0 else mirror(FOOT_L, 200)[::-1]
        fd = smooth(FOOT)
        o += P(fd, SOCK)
        fx = f'<path d="{smooth([(X(40),1302),(X(100),1322),(X(170),1296),(X(170),1360),(X(40),1360)])}" fill="#D8D0C2"/>'
        fx += f'<ellipse cx="{X(98)}" cy="1248" rx="30" ry="18" fill="#fff" opacity=".9" filter="{doc.blur(6)}"/>'
        fx += fold([(X(74), 1206), (X(106), 1216), (X(150), 1204)], 8, ink=1.2, col=SOCK_SH, ln=SOCK_LN, deep="#C9BFAE")
        fx += "".join(P(taper([(X(74 + k * 10), 1186), (X(74 + k * 10), 1204)], 1.2, .2, .2), SOCK_SH) for k in range(8))
        o += cel(doc, fd, SOCK_SH, shift=(12, 6), extra=fx)
        o += P(outline(FOOT, 2.4, 1.4), SOCK_LN)
    return o


def top(doc, flat=False):
    o = ""
    gF = fabric_grad(doc, 40, 420, 360, 860)
    td = smooth(TOPS)
    o += P(td, gF)
    ex = f'<ellipse cx="150" cy="620" rx="74" ry="110" fill="{TOP_HL}" opacity=".6" filter="{doc.blur(18)}"/>'
    ex += fold([(76, 474), (96, 496), (104, 526)], 9)
    ex += fold([(324, 474), (306, 498), (300, 526)], 10)
    ex += fold([(84, 520), (112, 556), (128, 600)], 8, ink=1.2)
    ex += fold([(318, 508), (290, 540), (276, 586)], 9, ink=1.2)
    ex += fold([(70, 610), (88, 650), (94, 700)], 7, ink=1.0)
    ex += fold([(332, 620), (318, 660), (314, 710)], 8, ink=1.0)
    ex += f'<ellipse cx="206" cy="446" rx="96" ry="22" fill="{TOP_SH}" opacity=".9" filter="{doc.blur(6)}"/>'
    ex += f'<path d="{smooth([(30,740),(120,800),(200,816),(280,800),(370,740),(380,900),(20,900)])}" fill="{TOP_SH}" opacity=".55" filter="{doc.blur(10)}"/>'
    # ribbed hem band
    hem = [(44, 812), (120, 832), (200, 840), (280, 832), (356, 812), (356, 840), (280, 858), (200, 866), (120, 858), (44, 840)]
    ex += P(smooth(hem), TOP_SH, opacity=.45)
    ex += "".join(P(taper([(x, 816 + abs(x - 200) * -.12 + 22), (x, 860 + abs(x - 200) * -.12)], 1.2, .2, .2), TOP_SH2, opacity=.5) for x in range(50, 352, 9))
    ex += P(taper([(46, 814), (120, 834), (200, 842), (280, 834), (356, 814)], 1.4, .1, .1), TOP_LN, opacity=.6)
    if not flat:
        for sx in (-1, 1):
            ex += f'<ellipse cx="{200 + sx*126}" cy="520" rx="22" ry="40" fill="{TOP_SH2}" opacity=".5" filter="{doc.blur(8)}"/>'
    o += cel(doc, td, TOP_SH, shift=(26, 6), extra=ex,
             soft=(TOP_SH2, 22, smooth([(300, 470), (352, 620), (340, 800), (284, 700)]), .35))
    o += motif(doc)
    # shoulder buttons (toddler tops open at the shoulder)
    for x, y in [(146, 428), (128, 440)]:
        o += f'<circle cx="{x}" cy="{y}" r="5" fill="{CREAM}" stroke="{CREAM_LN}" stroke-width="1.3"/><circle cx="{x-1.3}" cy="{y-1.4}" r="1.5" fill="#fff"/>'
    o += P(outline(TOPS, 2.6, 1.4, gaps=[(.0, .02), (.98, 1)]), TOP_LN)
    return o


def sleeves(doc, flat=False):
    o = ""
    gF = fabric_grad(doc, -60, 420, 460, 700)
    for side in (-1, 1):
        def X(x): return x if side < 0 else 400 - x
        C = arm_c(side) if not flat else [(X(x), y + 60 * (i / 4) ** 1.2) for i, (x, y) in enumerate(arm_c(side))]
        loop = limb(C, ARM_W)
        d = poly(loop)
        w, v, rot = wrist_frame(side)
        if flat:
            w = C[-1]
            vv = (C[-1][0] - C[-2][0], C[-1][1] - C[-2][1]); L = math.hypot(*vv); v = (vv[0] / L, vv[1] / L)
        if not flat:
            o += hand(doc, side, (w[0] + v[0] * 14, w[1] + v[1] * 14), rot)
            if side < 0:
                o += f'<g transform="translate({w[0] + v[0]*16},{w[1] + v[1]*16}) rotate({rot})">{bracelet(doc)}</g>'
        o += P(d, gF)
        ex = fold([(X(52), 552), (X(40), 576), (X(24), 584)], 10)
        ex += fold([(X(46), 598), (X(32), 610), (X(16), 612)], 6, ink=1.0)
        ex += fold([(X(26), 622), (X(10), 640), (X(-6), 636)], 8, ink=1.1)
        ex += fold([(X(98), 500), (X(84), 520), (X(78), 548)], 8)
        ex += fold([(X(64), 520), (X(54), 536), (X(40), 546)], 6, ink=1.0)
        if not flat:
            sx, sy = C[0]
            ex = f'<g transform="rotate({ARM_RAISE[side]} {sx:.1f} {sy:.1f})">{ex}</g>'
        o += cel(doc, d, TOP_SH, shift=(14, 6), extra=ex)
        o += P(outline(loop, 2.6, 1.4, n=2, gaps=[(.93, 1.0), (0, .03)] if side < 0 else [(.42, .53)]), TOP_LN)
        cuff = limb([(w[0] - v[0] * 8, w[1] - v[1] * 8), (w[0] + v[0] * 12, w[1] + v[1] * 12)], [60, 56], 6)
        cd = poly(cuff)
        nx, ny = -v[1], v[0]
        rib = "".join(P(taper([(w[0] - v[0] * 10 + nx * k, w[1] - v[1] * 10 + ny * k), (w[0] + v[0] * 14 + nx * k, w[1] + v[1] * 14 + ny * k)], 1.3, .1, .1), CREAM_SH)
                      for k in range(-28, 30, 6))
        o += P(cd, CREAM) + clipped(doc, cd, rib) + cel(doc, cd, CREAM_SH, shift=(8, 4))
        o += P(outline(cuff, 2.2, 1.2, n=2), CREAM_LN)
    return o


def figure(doc, expr="happy", shadow=True, flat=None):
    """flat: None (full figure), 'top' or 'pants' (garment flats for the sheet)"""
    if flat == "top":
        return top(doc, True) + sleeves(doc, True) + collar(doc) + \
            P(smooth([(140, 404), (200, 394), (260, 404), (250, 420), (200, 428), (150, 420)]), "#C99A3A", opacity=.6)
    if flat == "pants":
        return pants(doc, True)
    o = ""
    if shadow:
        o += f'<ellipse cx="200" cy="{SOLE_Y-4}" rx="220" ry="26" fill="#3A2A30" opacity=".22" filter="{doc.blur(8)}"/>'
    body = pants(doc) + socks(doc) + top(doc) + sleeves(doc) + collar(doc)
    body += f'<ellipse cx="206" cy="410" rx="64" ry="12" fill="{CREAM_SH}" opacity=".8" filter="{doc.blur(5)}"/>'
    o += f'<g transform="translate(0,{DY})">{body}</g>'
    o += f'<g transform="rotate(-3 200 400)">{H.head(doc, expr, turn=.06)}</g>'
    return o


if __name__ == "__main__":
    import sys
    a = sys.argv[1] if len(sys.argv) > 1 else "happy"
    d = Doc(680, 1440, "-140 -50 680 1440")
    if a in ("top", "pants"):
        d.add(figure(d, flat=a))
    else:
        d.add(figure(d, a))
    print(d.svg())
