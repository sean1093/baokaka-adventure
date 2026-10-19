"""baokaka_body.py - 寶咖咖 full figure (front, first-steps stance).

Shares the head coordinate space of baokaka.py (face centre x=200, chin
y~405).  Total figure ~3.7 heads, soles at y~1470.
"""
import random
from geom import *
import baokaka as H

PJ = "#FFD660"; PJ_SH = "#F0AE48"; PJ_SH2 = "#D58C33"; PJ_HL = "#FFF3BD"; PJ_LN = "#8C5320"
CREAM = "#FFF6E2"; CREAM_SH = "#EBD3AE"; CREAM_LN = "#9C7A54"
SOLE = "#F2E4CC"; DOT = "#E8A23E"
BEAR = "#B9805A"; BEAR_SH = "#8F5B3C"; BEAR_LT = "#E9C9A4"
RED = "#D9372E"; RED_DK = "#8E1D19"; GOLD = "#F1C24A"; GOLD_DK = "#A87818"
SKIN, SKIN_SH, SKIN_SH2, SKIN_LN = H.SKIN, H.SKIN_SH, H.SKIN_SH2, H.SKIN_LN


def fold(pts, w=10, op=.85, ink=1.5, col=PJ_SH, inkop=.75, doc=None):
    """a fabric fold: tapered ink line on top, shadow falling to the lower /
    far side of it, fading out (soft cel)"""
    D = dense(pts, False, 8)
    N = normals(D)
    # put the shadow on the side whose normal points down (away from light)
    sgn = 1 if (N[:, 1].mean() > 0) else -1
    sh = [(x + nx * sgn * w * .45, y + ny * sgn * w * .45) for (x, y), (nx, ny) in zip(D[::3], N[::3])]
    if len(sh) < 3:
        sh = [tuple(D[0]), tuple(D[len(D)//2]), tuple(D[-1])]
    o = P(strand(sh, w, bulge=.6, tip=1.0), col, opacity=op)
    o += P(strand(sh, w * .45, bulge=.6, tip=1.0), PJ_SH2, opacity=op * .45)
    if ink:
        o += P(taper(pts, ink, .3, .5), PJ_LN, opacity=inkop)
    return o


def star(cx, cy, r, rot=0):
    pts = []
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5 + rot
        rr = r if k % 2 == 0 else r * .45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return poly(pts)


# ---------------------------------------------------------------- parts
TORSO = [(150, 400), (110, 416), (86, 446), (72, 500), (58, 580), (44, 680), (40, 770), (46, 846),
         (90, 882), (160, 904), (200, 936), (240, 904), (310, 882), (354, 846), (360, 770), (356, 680), (342, 580),
         (328, 500), (314, 446), (290, 416), (250, 400)]

LEG_C = [(126, 850), (108, 960), (94, 1042), (102, 1120), (116, 1196)]
LEG_W = [158, 156, 122, 98, 84]

FOOT_L = [(78, 1186), (56, 1218), (44, 1262), (54, 1300), (86, 1322), (128, 1322), (156, 1304), (164, 1262),
          (156, 1216), (144, 1186), (110, 1176)]

ARM_C = [(112, 466), (70, 516), (38, 568), (8, 614), (-16, 650)]
ARM_W = [92, 80, 70, 62, 56]
SOLE_Y = 1322

def part(doc, pts, fill, shade, line, shift=(18, 6), lw=2.6, k=1.4, extra="", gaps=None, soft=None):
    d = smooth(pts)
    o = P(d, fill)
    o += cel(doc, d, shade, shift=shift, extra=extra, soft=soft)
    o += P(outline(pts, lw, k, gaps=gaps), line)
    return o, d


def fabric_grad(doc, x0, y0, x1, y1):
    return doc.lin([(0, PJ_HL), (.35, PJ), (1, "#FCC94E")], x0, y0, x1, y1, "userSpaceOnUse")


def print_stars(doc, d, box, seed=3, avoid=()):
    rnd = random.Random(seed)
    x0, y0, x1, y1 = box
    o = ""
    pts = []
    for _ in range(400):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        if any(abs(x - ax) < aw and abs(y - ay) < ah for ax, ay, aw, ah in avoid):
            continue
        if all(math.hypot(x - px, y - py) > 58 for px, py in pts):
            pts.append((x, y))
    for x, y in pts:
        r = rnd.uniform(6, 10)
        rot = rnd.uniform(-.4, .4)
        o += P(star(x + 1.2, y + 1.6, r, rot), PJ_SH, opacity=.55)
        o += P(star(x, y, r, rot), "#FFF7D6")
    return clipped(doc, d, o)


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


def collar(doc):
    pts = [(124, 398), (162, 408), (200, 412), (238, 408), (276, 398), (286, 414), (280, 428),
           (240, 440), (200, 444), (160, 440), (120, 428), (114, 414)]
    d = smooth(pts)
    o = P(d, CREAM)
    rib = "".join(P(taper([(x, 412 + abs(x - 200) * -.05), (x + (x - 200) * .02, 440 - abs(x - 200) * .08)], 1.3, .2, .2), CREAM_SH)
                  for x in range(124, 280, 9))
    o += clipped(doc, d, rib + f'<ellipse cx="214" cy="408" rx="74" ry="16" fill="{CREAM_SH}" opacity=".9" filter="{doc.blur(5)}"/>')
    o += cel(doc, d, CREAM_SH, shift=(14, -4))
    o += P(outline(pts, 2.2, 1.2), CREAM_LN)
    return o


def bear_patch(doc, cx=266, cy=530, r=27):
    o = ""
    for ex in (-1, 1):
        o += f'<circle cx="{cx + ex*r*.78}" cy="{cy - r*.72}" r="{r*.36}" fill="{BEAR}" stroke="{BEAR_SH}" stroke-width="1.6"/>'
        o += f'<circle cx="{cx + ex*r*.78}" cy="{cy - r*.72}" r="{r*.17}" fill="{BEAR_LT}"/>'
    o += f'<ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{r*.9}" fill="{BEAR}" stroke="{BEAR_SH}" stroke-width="1.8"/>'
    o += f'<ellipse cx="{cx}" cy="{cy}" rx="{r-4}" ry="{r*.9-4}" fill="none" stroke="{BEAR_LT}" stroke-width="1.2" stroke-dasharray="3 3"/>'
    o += f'<ellipse cx="{cx}" cy="{cy + r*.28}" rx="{r*.42}" ry="{r*.3}" fill="{BEAR_LT}"/>'
    o += f'<ellipse cx="{cx}" cy="{cy + r*.18}" rx="{r*.14}" ry="{r*.1}" fill="#4A2A1C"/>'
    for ex in (-1, 1):
        o += f'<circle cx="{cx + ex*r*.36}" cy="{cy - r*.1}" r="{r*.09}" fill="#3A2016"/>'
    o += f'<ellipse cx="{cx+6}" cy="{cy+4}" rx="{r}" ry="{r*.9}" fill="{BEAR_SH}" opacity=".35" ' \
         f'mask="{doc.mask(f"<ellipse cx=\'{cx}\' cy=\'{cy}\' rx=\'{r}\' ry=\'{r*.9}\' fill=\'#fff\'/><ellipse cx=\'{cx-6}\' cy=\'{cy-5}\' rx=\'{r}\' ry=\'{r*.9}\' fill=\'#000\'/>")}"/>'
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


def figure(doc, expr="happy", shadow=True, flat=False):
    if flat:
        shadow = False
    o = ""
    if shadow:
        o += f'<ellipse cx="200" cy="{SOLE_Y-4}" rx="220" ry="26" fill="#5A3A28" opacity=".22" filter="{doc.blur(8)}"/>'
    gF = fabric_grad(doc, 40, 420, 360, SOLE_Y)
    # ---- legs
    for side in (-1, 1):
        def X(x): return x if side < 0 else 400 - x
        C = [(X(x), y) for x, y in LEG_C]
        loop = limb(C, LEG_W)
        d = poly(loop)
        o += P(d, gF)
        ex = ""
        ex += fold([(X(196), 930), (X(172), 962), (X(150), 1000)], 14)        # crotch pull
        ex += fold([(X(178), 990), (X(160), 1010), (X(144), 1034)], 8, ink=1.1)
        ex += fold([(X(60), 960), (X(80), 972), (X(100), 970)], 8, ink=1.2)    # thigh roll
        ex += fold([(X(58), 1040), (X(92), 1056), (X(140), 1052)], 11, ink=1.4)  # knee
        ex += fold([(X(72), 1072), (X(104), 1082), (X(134), 1076)], 7, ink=1.0)
        ex += fold([(X(72), 1148), (X(108), 1166), (X(150), 1154)], 10, ink=1.3)  # ankle bunching
        ex += fold([(X(80), 1174), (X(110), 1184), (X(146), 1176)], 7, ink=1.1)
        ex += f'<ellipse cx="{X(178)}" cy="960" rx="30" ry="80" fill="{PJ_SH2}" opacity=".45" filter="{doc.blur(10)}"/>'
        ex += f'<ellipse cx="{X(90)}" cy="1000" rx="22" ry="60" fill="{PJ_HL}" opacity=".55" filter="{doc.blur(10)}"/>'
        o += cel(doc, d, PJ_SH, shift=(16, 4), extra=ex)
        o += print_stars(doc, d, (40, 900, 360, 1230), seed=7 + side, avoid=[])
        # ink the leg, but not across the hip where it joins the torso
        n = len(loop)
        o += P(outline(loop, 2.6, 1.4, n=2, gaps=[(.0, .03), (.97, 1.0)]), PJ_LN)
        # footie foot
        FOOT = FOOT_L if side < 0 else mirror(FOOT_L, 200)[::-1]
        fd = smooth(FOOT)
        o += P(fd, gF)
        fx = f'<path d="{smooth([(X(40),1318),(X(100),1340),(X(170),1312),(X(170),1380),(X(40),1380)])}" fill="{SOLE}"/>'
        fx += "".join(f'<circle cx="{X(x)}" cy="{y}" r="3.2" fill="{DOT}"/>' for x, y in [(66, 1306), (86, 1314), (108, 1317), (130, 1314), (148, 1306)])
        fx += f'<ellipse cx="{X(98)}" cy="1258" rx="30" ry="18" fill="{PJ_HL}" opacity=".85" filter="{doc.blur(6)}"/>'
        fx += fold([(X(74), 1196), (X(106), 1206), (X(150), 1194)], 8, ink=1.2)
        o += cel(doc, fd, PJ_SH, shift=(12, 6), extra=fx)
        o += P(outline(FOOT, 2.6, 1.4), PJ_LN)
    # ---- torso (no ink along the bottom: the legs continue it)
    td = smooth(TORSO)
    o += P(td, gF)
    ex = f'<ellipse cx="150" cy="620" rx="74" ry="110" fill="{PJ_HL}" opacity=".6" filter="{doc.blur(18)}"/>'
    ex += fold([(76, 474), (96, 496), (104, 526)], 9)
    ex += fold([(324, 474), (306, 498), (300, 526)], 10)
    ex += fold([(84, 520), (112, 556), (128, 600)], 8, ink=1.2)
    ex += fold([(318, 508), (290, 540), (276, 586)], 9, ink=1.2)
    ex += fold([(70, 600), (88, 640), (94, 690)], 7, ink=1.0)
    ex += fold([(332, 610), (318, 650), (314, 700)], 8, ink=1.0)
    ex += fold([(240, 820), (262, 846), (300, 856)], 7, ink=1.0)
    ex += f'<ellipse cx="206" cy="446" rx="96" ry="22" fill="{PJ_SH}" opacity=".9" filter="{doc.blur(6)}"/>'
    # belly underside: soft occlusion where the round belly turns under
    ex += f'<path d="{smooth([(30,760),(120,826),(200,846),(280,826),(370,760),(380,980),(20,980)])}" fill="{PJ_SH}" opacity=".7" filter="{doc.blur(10)}"/>'
    ex += f'<ellipse cx="200" cy="900" rx="60" ry="30" fill="{PJ_SH2}" opacity=".35" filter="{doc.blur(10)}"/>'
    ex += fold([(100, 846), (150, 866), (190, 874)], 7, ink=1.2)
    ex += fold([(212, 874), (256, 866), (306, 846)], 8, ink=1.2)
    for sx in (-1, 1):  # armpit occlusion under the raised arms
        ex += f'<ellipse cx="{200 + sx*126}" cy="520" rx="22" ry="40" fill="{PJ_SH2}" opacity=".5" filter="{doc.blur(8)}"/>'
    o += cel(doc, td, PJ_SH, shift=(26, 6), extra=ex,
             soft=(PJ_SH2, 22, smooth([(300, 470), (352, 620), (340, 820), (284, 700)]), .35))
    o += print_stars(doc, td, (60, 440, 340, 900), seed=11, avoid=[(200, 640, 22, 300), (266, 530, 46, 46)])
    o += P(outline(TORSO[:9], 2.6, 1.4, closed=False), PJ_LN)
    o += P(outline(TORSO[12:], 2.6, 1.4, closed=False), PJ_LN)
    o += P(taper([(150, 900), (184, 914), (200, 936)], 1.8, .6, .1), PJ_LN, opacity=.8)
    o += P(taper([(200, 936), (216, 914), (250, 900)], 1.8, .1, .6), PJ_LN, opacity=.8)
    # crotch seam
    o += P(taper([(200, 900), (200, 926), (198, 960)], 1.6, .3, .5), PJ_LN, opacity=.7)
    # placket with snaps
    o += P(taper([(201, 446), (201, 640), (200, 900)], 3, 0, .1), PJ_SH, opacity=.8)
    o += P(taper([(196, 446), (196, 640), (196, 900)], 1.3, .05, .1), PJ_LN, opacity=.5)
    for y in range(476, 900, 52):
        o += f'<circle cx="208" cy="{y}" r="5.2" fill="{CREAM}" stroke="{CREAM_LN}" stroke-width="1.3"/>'
        o += f'<circle cx="206.6" cy="{y-1.6}" r="1.6" fill="#fff"/>'
    o += bear_patch(doc)
    # ---- arms (out for balance)
    for side in (-1, 1):
        def X(x): return x if side < 0 else 400 - x
        C = arm_c(side)
        loop = limb(C, ARM_W)
        d = poly(loop)
        w, v, rot = wrist_frame(side)
        if not flat:
            o += hand(doc, side, (w[0] + v[0] * 14, w[1] + v[1] * 14), rot)
        if side < 0 and not flat:
            o += f'<g transform="translate({w[0] + v[0]*16},{w[1] + v[1]*16}) rotate({rot})">{bracelet(doc)}</g>'
        o += P(d, gF)
        ex = fold([(X(52), 552), (X(40), 576), (X(24), 584)], 10)              # inner elbow
        ex += fold([(X(46), 598), (X(32), 610), (X(16), 612)], 6, ink=1.0)
        ex += fold([(X(26), 622), (X(10), 640), (X(-6), 636)], 8, ink=1.1)    # bunching at the cuff
        ex += fold([(X(98), 500), (X(84), 520), (X(78), 548)], 8)
        ex += fold([(X(64), 520), (X(54), 536), (X(40), 546)], 6, ink=1.0)
        sx, sy = C[0]
        ex = f'<g transform="rotate({ARM_RAISE[side]} {sx:.1f} {sy:.1f})">{ex}</g>'
        o += cel(doc, d, PJ_SH, shift=(14, 6), extra=ex)
        o += print_stars(doc, d, (-80, 440, 480, 680), seed=21 + side)
        o += P(outline(loop, 2.6, 1.4, n=2, gaps=[(.93, 1.0), (0, .03)] if side < 0 else [(.42, .53)]), PJ_LN)
        # ribbed cuff around the wrist
        cuff = limb([(w[0] - v[0] * 8, w[1] - v[1] * 8), (w[0] + v[0] * 12, w[1] + v[1] * 12)], [60, 56], 6)
        cd = poly(cuff)
        nx, ny = -v[1], v[0]
        rib = "".join(P(taper([(w[0] - v[0] * 10 + nx * k, w[1] - v[1] * 10 + ny * k), (w[0] + v[0] * 14 + nx * k, w[1] + v[1] * 14 + ny * k)], 1.3, .1, .1), CREAM_SH)
                      for k in range(-28, 30, 6))
        o += P(cd, CREAM) + clipped(doc, cd, rib) + cel(doc, cd, CREAM_SH, shift=(8, 4))
        o += P(outline(cuff, 2.2, 1.2, n=2), CREAM_LN)
    # ---- collar + head
    o += collar(doc)
    if flat:
        # inside of the neckline / back of the garment
        o += P(smooth([(140, 404), (200, 392), (260, 404), (250, 426), (200, 434), (150, 426)]), "#E9C27A")
        o += P(outline([(140, 404), (200, 392), (260, 404), (250, 426), (200, 434), (150, 426)], 1.8, 1), PJ_LN)
        return o
    o += f'<ellipse cx="206" cy="404" rx="64" ry="12" fill="{CREAM_SH}" opacity=".8" filter="{doc.blur(5)}"/>'
    o += f'<g transform="rotate(-3 200 400)">{H.head(doc, expr, turn=.06)}</g>'
    return o


if __name__ == "__main__":
    import sys
    d = Doc(600, 1440, "-100 -50 600 1440")
    d.add(figure(d, sys.argv[1] if len(sys.argv) > 1 else "happy"))
    print(d.svg())
