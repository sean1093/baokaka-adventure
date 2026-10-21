"""bk_poses.py - 寶咖咖 gameplay poses (3/4 side view, facing right).

A small FK/IK rig drawn with the same inking + cel toolkit as the sheets:
torso (top + gingham pants), two arms (sleeve, cuff, hand), two legs (pants,
gathered cuff, sock), and the shared head from baokaka.py turned 3/4.

World units = head units (head ~ 414 tall).  Ground y = 0, anchor (0, 0) is
the foot point under the body's support centre.  The game mirrors for left.
"""
import math
from geom import *
from rig import *
import baokaka as H
import baokaka_body as B

# ------------------------------------------------------------- dimensions
TORSO_L = 400          # neck -> hip joint
UA, FA = 148, 132      # upper arm, forearm
TH, SH = 165, 150      # thigh, shin
ANK = 40               # ankle height above the sole
HEAD_PIV = (200, 412)  # neck point in head space
TURN = -0.62           # default 3/4 head turn (face to the right)
SHN, SHF = (-24, 72), (36, 60)   # near shoulder sits back (ear side), far one forward

SKIN, SKIN_SH, SKIN_LN = H.SKIN, H.SKIN_SH, H.SKIN_LN
FAR = "#2E2A44"        # far-side darkening

# torso outline in its local frame: origin = neck, +y toward the hips,
# +x = front (belly).  A 12-month pear: small chest, big belly, padded bum.
TOP_L = [(34, -4), (80, 14), (112, 58), (134, 126), (152, 206), (162, 284), (158, 340),
         (90, 356), (10, 358), (-70, 352), (-124, 340), (-120, 250), (-112, 160), (-100, 82), (-76, 22), (-32, -8)]
PANTS_L = [(160, 318), (152, 372), (122, 424), (64, 458), (-6, 466), (-74, 454), (-114, 414),
           (-128, 340), (-60, 326), (40, 326), (110, 322)]


def torso_frame(hip, a):
    ax = (math.sin(math.radians(a)), math.cos(math.radians(a)))
    neck = (hip[0] - TORSO_L * ax[0], hip[1] - TORSO_L * ax[1])
    return Frame(neck, a)


# ------------------------------------------------------------- parts
def part(doc, loop, fill, shade, line, far=False, extra="", lw=2.4, shift=(12, 6), gaps=None):
    d = poly(loop)
    o = P(d, fill)
    o += cel(doc, d, shade, shift=shift, extra=extra)
    if far:
        o += P(d, FAR, opacity=.2)
    o += P(outline(loop, lw, 1.3, n=2, gaps=gaps), line)
    return o


def hand(doc, W, a, kind="open", far=False):
    """chubby toddler hand; local +y = toward the fingertips, +x = thumb side"""
    F = Frame(W, a)
    shapes = []
    det = ""
    if kind in ("open", "wave", "clap"):
        shapes.append(poly(F.pts(ellipse_pts(0, 30, 25, 27, 14))))
        for bx, tx_ in [(-15, -22), (-5, -6), (5, 8), (14, 20)]:
            shapes.append(poly(F.pts(limb([(bx, 44), ((bx + tx_) / 2, 58), (tx_, 70)], [13, 12, 11], 6))))
        shapes.append(poly(F.pts(limb([(16, 16), (28, 30), (36, 44)], [16, 14, 12], 6))))
        for bx in (-10, 0, 10):
            det += P(taper(F.pts([(bx, 50), (bx + 1, 60)]), 1.2, .2, .4), SKIN_LN, opacity=.7)
    elif kind in ("fist", "grab", "hold"):
        shapes.append(poly(F.pts(ellipse_pts(0, 32, 27, 27, 14))))
        shapes.append(poly(F.pts(limb([(16, 18), (26, 34), (20, 48)], [15, 13, 12], 6))))
        for k in range(3):
            y = 40 + k * 8
            det += P(taper(F.pts([(-22, y), (-8, y + 2), (4, y)]), 1.3, .3, .3), SKIN_LN, opacity=.65)
    elif kind == "point":
        shapes.append(poly(F.pts(ellipse_pts(0, 30, 25, 25, 14))))
        shapes.append(poly(F.pts(limb([(8, 44), (10, 70), (12, 92)], [13, 12, 11], 6))))
        shapes.append(poly(F.pts(limb([(18, 20), (28, 32), (26, 44)], [14, 12, 11], 6))))
        for k in range(2):
            y = 44 + k * 8
            det += P(taper(F.pts([(-20, y), (-8, y + 2), (0, y)]), 1.3, .3, .3), SKIN_LN, opacity=.65)
    o = union_ink(shapes, SKIN, SKIN_LN, .95)
    o += P(poly(F.pts(ellipse_pts(-8, 34, 14, 22, 10))), SKIN_SH, opacity=.55)
    o += det
    if far:
        o += "".join(P(s_, FAR, opacity=.18) for s_ in shapes)
    return o


def foot(doc, A, a, far=False):
    """cream sock; local +y = toward the toes, local +x = instep (top)"""
    F = Frame(A, a)
    loc = [(-36, -32), (-44, 4), (-46, 52), (-38, 92), (-14, 108), (8, 102), (20, 74), (30, 34), (34, 0),
           (26, -28), (2, -42), (-22, -42)]
    loop = F.pts(loc)
    sole = poly(F.pts([(-50, -40), (-34, -36), (-34, 110), (-50, 110)]))
    ex = f'<path d="{sole}" fill="#D8D0C2"/>'
    ex += P(taper(F.pts([(26, -20), (30, 10), (22, 50)]), 8, .3, .3), "#fff", opacity=.7)
    return part(doc, loop, B.SOCK, B.SOCK_SH, B.SOCK_LN, far, ex, lw=2.2)


def arm(doc, S, spec, far=False):
    """spec: dict(a1, a2) angles, or dict(ik=target_wrist, bend=+1/-1);
    hand kind 'hand', hand angle offset 'ha'"""
    if "ik" in spec:
        E = ik2(S, spec["ik"], UA, FA, spec.get("bend", -1))
        W = pt(E, ang(E, spec["ik"]), FA)
    else:
        E = pt(S, spec["a1"], UA)
        W = pt(E, spec["a2"], FA)
    fa = ang(E, W)
    o = ""
    ha = fa + spec.get("ha", 0)
    hW = pt(W, fa, 8)
    hand_svg = hand(doc, hW, ha, spec.get("hand", "open"), far)
    # sleeve
    loop = limb([S, E, W], [74, 64, 58], 10)
    ex = ""
    # elbow creases on the inner side
    n = (math.cos(math.radians(fa)), -math.sin(math.radians(fa)))
    for k, (o1, l) in enumerate([(-6, 18), (8, 14)]):
        c = pt(E, fa, o1)
        ex += P(taper([(c[0] + n[0] * 4, c[1] + n[1] * 4), (c[0] + n[0] * (4 + l), c[1] + n[1] * (4 + l))], 1.6, .2, .6), B.TOP_LN, opacity=.6)
    o += part(doc, loop, B.TOP, B.TOP_SH, B.TOP_LN, far, ex)
    # ribbed cream cuff
    c0, c1 = pt(W, fa, -14), pt(W, fa, 8)
    cl = limb([c0, c1], [60, 56], 6)
    rib = ""
    for k in range(-24, 28, 6):
        rib += P(taper([(c0[0] + n[0] * k, c0[1] + n[1] * k), (c1[0] + n[0] * k, c1[1] + n[1] * k)], 1.2, .1, .1), B.CREAM_SH)
    o += part(doc, cl, B.CREAM, B.CREAM_SH, B.CREAM_LN, far, rib, lw=2.0)
    return o, hand_svg, W, fa


def leg(doc, Hp, spec, far=False):
    """spec: dict(a1, a2) or dict(ik=ankle_target, bend=+1); 'fa' foot angle
    (90 = toes forward/flat, 0 = toes down, 180 = toes up)"""
    if "ik" in spec:
        K = ik2(Hp, spec["ik"], TH, SH, spec.get("bend", 1))
        A = pt(K, ang(K, spec["ik"]), SH)
    else:
        K = pt(Hp, spec["a1"], TH)
        A = pt(K, spec["a2"], SH)
    sa = ang(K, A)
    o = foot(doc, A, spec.get("fa", 90), far)
    loop = limb([Hp, K, A], [124, 104, 92], 10)
    rot = -ang(Hp, K)
    ex = ""
    n = (math.cos(math.radians(sa)), -math.sin(math.radians(sa)))
    for o1 in (-10, 6):
        c = pt(K, sa, o1)
        ex += P(taper([(c[0] - n[0] * 40, c[1] - n[1] * 40), (c[0] - n[0] * 8, c[1] - n[1] * 8)], 1.5, .3, .5), B.PANTS_LN, opacity=.55)
    d = poly(loop)
    o += P(d, B.gingham(doc, rot, 18))
    o += cel(doc, d, B.PANTS_SH, shift=(12, 6), extra=ex, opacity=.42)
    if far:
        o += P(d, FAR, opacity=.22)
    o += P(outline(loop, 2.4, 1.3, n=2, gaps=[(.95, 1), (0, .05)]), B.PANTS_LN)
    # gathered ankle cuff
    c0, c1 = pt(A, sa, -26), pt(A, sa, 4)
    cl = limb([c0, c1], [98, 90], 6)
    cd = poly(cl)
    o += P(cd, B.gingham(doc, -sa, 14))
    g = ""
    for k in range(-40, 44, 8):
        g += P(taper([(c0[0] + n[0] * k, c0[1] + n[1] * k), (c1[0] + n[0] * k, c1[1] + n[1] * k)], 1.3, .2, .2), B.PANTS_LN, opacity=.45)
    o += clipped(doc, cd, g) + cel(doc, cd, B.PANTS_SH, shift=(8, 4), opacity=.4)
    if far:
        o += P(cd, FAR, opacity=.22)
    o += P(outline(cl, 2.0, 1.2, n=2), B.PANTS_LN)
    return o


def torso(doc, F, rot_deg):
    o = ""
    # gingham seat / hips
    pl = F.pts(PANTS_L)
    pd = smooth(pl)
    o += P(pd, B.gingham(doc, -rot_deg, 18))
    ex = P(smooth(F.pts([(150, 380), (60, 450), (-60, 450), (-110, 400), (0, 420)])), B.PANTS_SH, opacity=.5, filter=doc.blur(8))
    o += cel(doc, pd, B.PANTS_SH, shift=(14, 6), extra=ex, opacity=.42)
    o += P(outline(pl, 2.4, 1.3), B.PANTS_LN)
    # mustard top
    tl = F.pts(TOP_L)
    td = smooth(tl)
    o += P(td, B.fabric_grad(doc, F.o[0] - 140, F.o[1] - 40, F.o[0] + 160, F.o[1] + 380))
    ex = f'<ellipse cx="{F((60,180))[0]}" cy="{F((60,180))[1]}" rx="60" ry="80" fill="{B.TOP_HL}" opacity=".55" filter="{doc.blur(16)}"/>'
    ex += P(smooth(F.pts([(150, 230), (166, 300), (150, 350), (60, 352), (110, 300)])), B.TOP_SH, opacity=.6, filter=doc.blur(8))
    # belly-underside and back folds
    for pts_ in ([(120, 300), (90, 318), (50, 326)], [(-100, 120), (-86, 160), (-84, 200)], [(140, 170), (126, 200)]):
        ex += P(taper(F.pts(pts_), 1.6, .3, .5), B.TOP_LN, opacity=.55)
    # ribbed hem
    hem = F.pts([(158, 330), (90, 344), (10, 346), (-70, 340), (-124, 330), (-124, 344), (-70, 354), (10, 358), (90, 356), (158, 342)])
    ex += P(poly(hem), B.TOP_SH, opacity=.45)
    for k in range(-120, 160, 10):
        ex += P(taper(F.pts([(k, 334 + abs(k) * .05), (k, 352)]), 1.1, .2, .2), B.TOP_SH2, opacity=.45)
    o += cel(doc, td, B.TOP_SH, shift=(14, 6), extra=ex)
    o += P(outline(tl, 2.5, 1.4), B.TOP_LN)
    # small embroidered moon on the chest + shoulder buttons
    c = F((92, 120))
    o += f'<g transform="translate({c[0]},{c[1]}) rotate({-rot_deg}) scale(.9) translate(-262,-548)">{B.motif(doc, 262, 548, 1)}</g>'
    for p_ in ((-20, 18), (-34, 30)):
        q = F(p_)
        o += f'<circle cx="{q[0]}" cy="{q[1]}" r="5" fill="{B.CREAM}" stroke="{B.CREAM_LN}" stroke-width="1.3"/>'
    # Peter Pan collar flap at the neck front
    col = F.pts([(-6, -6), (40, -8), (86, 8), (96, 30), (70, 46), (30, 44), (0, 30)])
    o += part(doc, col, B.CREAM, B.CREAM_SH, B.CREAM_LN, extra="", lw=2.0)
    return o


def headg(doc, neck, p):
    """p: rot (deg, clockwise), expr, turn, look, off (local offset)"""
    hs = p.get("scale", 1.0)
    x, y = neck[0] + p.get("dx", 14), neck[1] + p.get("dy", 8)
    g = H.head(doc, p.get("expr", "happy"), p.get("turn", TURN), 0, p.get("look", (0, 0)))
    return f'<g transform="translate({x:.1f},{y:.1f}) rotate({p.get("rot", 0)}) scale({hs}) translate({-HEAD_PIV[0]},{-HEAD_PIV[1]})">{g}</g>'


# ------------------------------------------------------------- props
def block(doc, c, s=1.0, rot=0, col=("#E8473B", "#B32A24", "#F7D9A0")):
    o = ""
    f, sd, tp = col
    h = 34 * s
    sq = [(-h, -h), (h, -h), (h, h), (-h, h)]
    T = Frame(c, 180 + rot)
    o += P(poly(T.pts([(-h, -h), (h, -h), (h + 14 * s, -h - 12 * s), (-h + 14 * s, -h - 12 * s)])), tp)
    o += P(poly(T.pts([(h, -h), (h + 14 * s, -h - 12 * s), (h + 14 * s, h - 12 * s), (h, h)])), sd)
    o += P(poly(T.pts(sq)), f)
    st = T.pts([(0, -14 * s), (4, -4), (14, -4), (6, 3), (9, 14), (0, 7), (-9, 14), (-6, 3), (-14, -4), (-4, -4)])
    o += P(poly([(c[0] + (x - c[0]) * s, c[1] + (y - c[1]) * s) for x, y in st]), "#FFF4D6")
    o += P(outline(T.pts([(-h, -h), (h + 14 * s, -h - 12 * s)][:1] + [(h, -h), (h + 14 * s, -h - 12 * s), (h + 14 * s, h - 12 * s), (h, h), (-h, h), (-h, -h), (-h + 14 * s, -h - 12 * s), (h + 14 * s, -h - 12 * s)]), 2.2, 1.2, closed=False, n=2), "#5A2A18")
    return o


def ingot(doc, c, s=1.0):
    """gold 元寶 - the 抓周 treasure"""
    x, y = c
    body = [(x - 46 * s, y - 8 * s), (x - 30 * s, y + 20 * s), (x, y + 26 * s), (x + 30 * s, y + 20 * s), (x + 46 * s, y - 8 * s),
            (x + 28 * s, y - 2 * s), (x, y + 2 * s), (x - 28 * s, y - 2 * s)]
    g = doc.lin([(0, "#FFF2B0"), (.45, "#F4CD55"), (1, "#B8841C")], 0, 0, .3, 1)
    o = P(smooth(body), g) + P(outline(body, 2.2, 1.2), "#7A5410")
    hump = ellipse_pts(x, y - 8 * s, 20 * s, 16 * s, 12)
    o += P(smooth(hump), g) + P(outline(hump, 2, 1.2), "#7A5410")
    o += f'<ellipse cx="{x-6*s}" cy="{y-14*s}" rx="{7*s}" ry="{4*s}" fill="#fff" opacity=".85"/>'
    for k in range(5):   # sparkle
        a = k * math.pi * 2 / 5
        o += P(taper([(x + 58 * s * math.cos(a), y - 10 * s + 50 * s * math.sin(a)), (x + 72 * s * math.cos(a), y - 10 * s + 62 * s * math.sin(a))], 3, .2, .2), "#FFE58A")
    return o


# ------------------------------------------------------------- figure
def figure(doc, p):
    F = torso_frame(p["hip"], p.get("torso", 0))
    rot = p.get("torso", 0)
    S_n, S_f = F(SHN), F(SHF)
    H_n, H_f = F((10, 392)), F((-14, 386))
    arms = p.get("arms", {})
    legs = p.get("legs", {})
    L = {}
    if "f" in legs:
        L["leg_f"] = leg(doc, H_f, legs["f"], far=True)
    if "n" in legs:
        L["leg_n"] = leg(doc, H_n, legs["n"])
    hand_n = hand_f = ""
    if "f" in arms:
        a, hand_f, Wf, _ = arm(doc, S_f, arms["f"], far=True)
        L["arm_f"] = a + hand_f
    if "n" in arms:
        a, hand_n, Wn, _ = arm(doc, S_n, arms["n"])
        L["arm_n"] = a + hand_n
    L["torso"] = torso(doc, F, rot)
    L["head"] = headg(doc, F.o, p.get("head", {}))
    for k, v in p.get("extra", {}).items():
        L[k] = v(doc) if callable(v) else v
    order = p.get("order", ["arm_f", "leg_f", "torso", "leg_n", "head", "arm_n"])
    o = ""
    if p.get("shadow", True):
        sw = p.get("shadow_w", 170)
        o += f'<ellipse cx="{p.get("shadow_x", 0)}" cy="{4 + p.get("shadow_y", 0)}" rx="{sw}" ry="22" fill="#2A2030" opacity=".22" filter="{doc.blur(7)}"/>'
    for k in order:
        o += L.get(k, "")
    return o


# ------------------------------------------------------------- pose library
def stand_legs(lift_n=0, lift_f=0, xn=30, xf=-40, bendn=1):
    return {"n": dict(ik=(xn, -ANK - lift_n), bend=bendn, fa=90),
            "f": dict(ik=(xf, -ANK - lift_f), bend=1, fa=90)}


def sit_base(hip_x=0, torso=-4):
    hip = (hip_x, -66)
    legs = {"n": dict(a1=78, a2=88, fa=150), "f": dict(a1=70, a2=84, fa=140)}
    return hip, legs


def crawl(t):
    """diagonal crawl: near hand + far knee move together.  t in [0,1)."""
    def step(ph, amp=46, lift=36):
        u = (t + ph) % 1.0
        if u < .6:        # stance: contact slides back (body moves forward)
            x = amp - 2 * amp * (u / .6)
            y = 0
        else:             # swing: lift and bring forward
            v = (u - .6) / .4
            x = -amp + 2 * amp * ease(v)
            y = -lift * math.sin(math.pi * v)
        return x, y
    bob = 6 * math.cos(4 * math.pi * t)
    hip = (-206, -196 + bob)
    ta = -68 + 2 * math.sin(2 * math.pi * t)
    F = torso_frame(hip, ta)
    S_n, S_f = F(SHN), F(SHF)
    hn, hny = step(0.0)
    hf, hfy = step(0.5)
    kn, kny = step(0.5, 40, 26)
    kf, kfy = step(0.0, 40, 26)
    arms = {"n": dict(ik=(S_n[0] + 26 + hn, -34 + hny), bend=-1, hand="open", ha=-70),
            "f": dict(ik=(S_f[0] + 20 + hf, -34 + hfy), bend=-1, hand="open", ha=-70)}
    # knees on the ground, shins trailing backward, soles up
    def kneel(Hp, kx, ky):
        K = (Hp[0] + 34 + kx, -34 + ky)
        a1 = ang(Hp, K)
        return dict(a1=a1, a2=-86 + ky * .3, fa=-150)
    H_n, H_f = F((10, 392)), F((-14, 386))
    legs = {"n": kneel(H_n, kn, kny), "f": kneel(H_f, kf, kfy)}
    return dict(hip=hip, torso=ta, arms=arms, legs=legs, shadow_w=260, shadow_x=-40,
                head=dict(expr="happy", rot=-28 + 2 * math.sin(2 * math.pi * t), dx=40, dy=30, look=(6, -4)),
                order=["arm_f", "leg_f", "torso", "leg_n", "arm_n", "head"])


def walk(t):
    """first wobbly steps: short steps, wide flat feet, arms up in high guard,
    torso sway.  t in [0,1)."""
    def step(ph, amp=46, lift=30):
        u = (t + ph) % 1.0
        if u < .62:
            x = amp - 2 * amp * (u / .62)
            y = 0
        else:
            v = (u - .62) / .38
            x = -amp + 2 * amp * ease(v)
            y = lift * math.sin(math.pi * v)
        return x, y
    nx, ny = step(0)
    fx, fy = step(.5)
    bob = 10 * math.cos(4 * math.pi * t)
    sway = 4 * math.sin(2 * math.pi * t)
    hip = (6, -ANK - 302 + bob)
    legs = {"n": dict(ik=(16 + nx, -ANK - ny), bend=1, fa=90 + ny * .3),
            "f": dict(ik=(-10 + fx, -ANK - fy), bend=1, fa=90 + fy * .3)}
    sw = 10 * math.sin(2 * math.pi * t)
    arms = {"n": dict(a1=14 - sw, a2=112 - sw, hand="open", ha=20),
            "f": dict(a1=44 + sw, a2=124 + sw, hand="open", ha=20)}
    return dict(hip=hip, torso=8 + sway, arms=arms, legs=legs,
                head=dict(expr="happy" if t < .5 else "say", rot=-6 - sway, look=(4, 0)))


def P_sit():
    hip, legs = sit_base()
    return dict(hip=hip, torso=-4, legs=legs, shadow_w=230, shadow_x=60,
                arms={"n": dict(a1=18, a2=60, hand="open", ha=-20), "f": dict(a1=14, a2=54, hand="open", ha=-20)},
                head=dict(expr="neutral", rot=-2))


def P_clap(k):
    hip, legs = sit_base()
    gap = 30 if k == 0 else 0
    return dict(hip=hip, torso=-2, legs=legs, shadow_w=230, shadow_x=60,
                arms={"n": dict(ik=(140, -400 - gap / 2), bend=-1, hand="clap", ha=-100),
                      "f": dict(ik=(150 + gap, -410 + gap / 2), bend=-1, hand="clap", ha=-80)},
                head=dict(expr="laugh" if k else "happy", rot=-4 - 3 * k))


def P_reach():
    # high-kneel, near arm stretched up to grab
    hip = (-10, -186)
    legs = {"n": dict(a1=-6, a2=-92, fa=-150), "f": dict(a1=-12, a2=-94, fa=-150)}
    return dict(hip=hip, torso=4, legs=legs, shadow_w=200,
                arms={"n": dict(a1=206, a2=192, hand="open", ha=0), "f": dict(a1=156, a2=158, hand="open", ha=0)},
                head=dict(expr="wonder", rot=-20, look=(6, -10)), order=["arm_f", "arm_n", "leg_f", "torso", "leg_n", "head"])


def P_hold():
    hip, legs = sit_base()
    blk = lambda d: block(d, (150, -330), 1.7, 6)
    return dict(hip=hip, torso=-4, legs=legs, shadow_w=230, shadow_x=60, extra={"prop": blk},
                arms={"n": dict(ik=(98, -300), bend=-1, hand="hold", ha=-60),
                      "f": dict(ik=(196, -350), bend=-1, hand="hold", ha=-100)},
                head=dict(expr="happy", rot=6, look=(2, 6)),
                order=["arm_f", "leg_f", "torso", "leg_n", "head", "prop", "arm_n"])


def P_point():
    hip, legs = sit_base()
    return dict(hip=hip, torso=2, legs=legs, shadow_w=230, shadow_x=60,
                arms={"n": dict(a1=96, a2=92, hand="point", ha=0), "f": dict(a1=20, a2=50, hand="open", ha=-20)},
                head=dict(expr="say", rot=-6, look=(6, -2)))


def P_wave(k):
    hip, legs = sit_base()
    w = -14 if k == 0 else 14
    return dict(hip=hip, torso=-2, legs=legs, shadow_w=230, shadow_x=60,
                arms={"n": dict(a1=-150, a2=-176 + w, hand="wave", ha=w), "f": dict(a1=14, a2=50, hand="open", ha=-20)},
                head=dict(expr="happy" if k == 0 else "laugh", rot=-4, turn=-.45))


def P_hug():
    hip, legs = sit_base()
    return dict(hip=hip, torso=-6, legs=legs, shadow_w=230, shadow_x=60,
                arms={"n": dict(a1=224, a2=206, hand="open", ha=0), "f": dict(a1=150, a2=150, hand="open", ha=0)},
                head=dict(expr="laugh", rot=-14, look=(4, -8), turn=-.5), order=["arm_f", "arm_n", "leg_f", "torso", "leg_n", "head"])


def P_cry(k):
    hip, legs = sit_base()
    return dict(hip=hip, torso=-8 - 3 * k, legs=legs, shadow_w=230, shadow_x=60,
                arms={"n": dict(a1=8 - 4 * k, a2=20, hand="fist", ha=-10), "f": dict(a1=4, a2=16, hand="fist", ha=-10)},
                head=dict(expr="wail", rot=-14 - 6 * k, turn=-.42 + .06 * k, dy=8 + 4 * k))


def P_refuse(k):
    hip, legs = sit_base()
    turn = .35 if k == 0 else -.78
    return dict(hip=hip, torso=-10, legs=legs, shadow_w=230, shadow_x=60,
                arms={"n": dict(a1=40, a2=96, hand="open", ha=-60), "f": dict(a1=8, a2=20, hand="fist", ha=-10)},
                head=dict(expr="refuse", rot=8 if k == 0 else -6, turn=turn))


def P_wonder():
    hip, legs = sit_base()
    return dict(hip=hip, torso=-12, legs=legs, shadow_w=230, shadow_x=60,
                arms={"f": dict(a1=166, a2=164, hand="point", ha=0), "n": dict(a1=10, a2=30, hand="open", ha=-30)},
                head=dict(expr="wonder", rot=-30, look=(6, -12), dx=4, dy=12))


def P_sleepy(k):
    hip, legs = sit_base()
    if k == 0:
        return dict(hip=hip, torso=8, legs=legs, shadow_w=230, shadow_x=60,
                    arms={"n": dict(a1=20, a2=50, hand="fist", ha=-20), "f": dict(a1=14, a2=46, hand="fist", ha=-20)},
                    head=dict(expr="sleep", rot=16, dy=16))
    return dict(hip=(hip[0], hip[1] + 6), torso=30, legs=legs, shadow_w=240, shadow_x=60,
                arms={"n": dict(a1=40, a2=60, hand="open", ha=-30), "f": dict(a1=36, a2=56, hand="open", ha=-30)},
                head=dict(expr="asleep", rot=26, dx=24, dy=26, turn=-.5))


def P_pull():
    # one knee down, other foot planted, both hands up gripping a ledge
    hip = (-30, -236)
    legs = {"n": dict(ik=(70, -ANK), bend=1, fa=90), "f": dict(a1=-4, a2=-90, fa=-150)}
    return dict(hip=hip, torso=14, legs=legs, shadow_w=200,
                arms={"n": dict(ik=(150, -720), bend=-1, hand="grab", ha=-90),
                      "f": dict(ik=(180, -730), bend=-1, hand="grab", ha=-90)},
                head=dict(expr="say", rot=-12, look=(6, -8)))


def P_wobble(k):
    s = 1 if k == 0 else -1
    hip = (0, -ANK - 300)
    return dict(hip=hip, torso=4 + 5 * s, legs=stand_legs(xn=40, xf=-40),
                arms={"n": dict(a1=84 + 12 * s, a2=150 + 10 * s, hand="open", ha=0),
                      "f": dict(a1=-84 + 12 * s, a2=-150 + 10 * s, hand="open", ha=0)},
                head=dict(expr="surprised" if k == 0 else "happy", rot=-6 * s, look=(2, 0)))


def P_bounce(k):
    hip, legs = sit_base()
    up = 0 if k == 0 else -26
    legs2 = {"n": dict(a1=78 - 6 * k, a2=96 + 10 * k, fa=150), "f": dict(a1=70 - 6 * k, a2=92 + 10 * k, fa=140)}
    return dict(hip=(hip[0], hip[1] + up), torso=-6, legs=legs2, shadow_w=230 - 20 * k, shadow_x=60,
                arms={"n": dict(a1=222 - 8 * k, a2=212 - 14 * k, hand="open", ha=0),
                      "f": dict(a1=140 + 10 * k, a2=136 + 16 * k, hand="open", ha=0)},
                head=dict(expr="laugh", rot=-10 - 4 * k, turn=-.45), order=["arm_f", "arm_n", "leg_f", "torso", "leg_n", "head"])


def P_zhuazhou():
    hip, legs = sit_base()
    ing = lambda d: ingot(d, (150, -372), 2.3)
    return dict(hip=hip, torso=-4, legs=legs, shadow_w=230, shadow_x=60, extra={"prop": ing},
                arms={"n": dict(ik=(80, -320), bend=-1, hand="hold", ha=-60), "f": dict(ik=(214, -330), bend=-1, hand="hold", ha=-110)},
                head=dict(expr="laugh", rot=2, turn=-.3, look=(-4, 4)),
                order=["arm_f", "leg_f", "torso", "leg_n", "head", "prop", "arm_n"])


def P_eat():
    hip, legs = sit_base()
    blk = lambda d: block(d, (120, -496), .95, -16, ("#3E86D8", "#22508F", "#F7D9A0"))
    return dict(hip=hip, torso=-2, legs=legs, shadow_w=230, shadow_x=60, extra={"prop": blk},
                arms={"f": dict(ik=(150, -470), bend=-1, hand="hold", ha=-120), "n": dict(a1=14, a2=50, hand="open", ha=-20)},
                head=dict(expr="chew", rot=6),
                order=["arm_f", "leg_f", "torso", "leg_n", "head", "prop", "arm_n"])


# ------------------------------------------------------------- #141 extras
# GDD § 3.9 frames that #141 adds.  The sitting ones are expression / head-turn
# variants of `sit`; carried and climb are new body poses.

def P_reach2():
    """reach, frame 2: up on his knees a little higher, both hands stretched"""
    hip = (-4, -196)
    legs = {"n": dict(a1=-4, a2=-90, fa=-150), "f": dict(a1=-10, a2=-92, fa=-150)}
    return dict(hip=hip, torso=0, legs=legs, shadow_w=200,
                arms={"n": dict(a1=186, a2=180, hand="open", ha=-6), "f": dict(a1=164, a2=166, hand="open", ha=0)},
                head=dict(expr="say", rot=-26, look=(6, -12)), order=["arm_f", "leg_f", "torso", "leg_n", "head", "arm_n"])


def P_look(k):
    """look L/R: nothing to want, he looks around.  Frame 1 looks back over
    his shoulder (away from where he faces), frame 2 far ahead."""
    hip, legs = sit_base()
    if k == 0:
        return dict(hip=hip, torso=-8, legs=legs, shadow_w=230, shadow_x=60,
                    arms={"n": dict(a1=4, a2=14, hand="open", ha=-40), "f": dict(a1=16, a2=48, hand="open", ha=-20)},
                    head=dict(expr="neutral", rot=8, turn=.6, look=(-16, -2), dx=0))
    return dict(hip=hip, torso=2, legs=legs, shadow_w=230, shadow_x=60,
                arms={"n": dict(a1=24, a2=64, hand="open", ha=-20), "f": dict(a1=18, a2=56, hand="open", ha=-20)},
                head=dict(expr="neutral", rot=-8, turn=-.74, look=(14, -4), dx=18))


def P_watch(k):
    """watch-sway: sat at a lit lamp, rocking gently as he watches it glow"""
    hip, legs = sit_base()
    s = -1 if k == 0 else 1
    return dict(hip=(hip[0] + 4 * s, hip[1]), torso=-4 + 6 * s, legs=legs, shadow_w=230, shadow_x=60,
                arms={"n": dict(a1=20 + 4 * s, a2=66, hand="open", ha=-24), "f": dict(a1=14 + 4 * s, a2=58, hand="open", ha=-24)},
                head=dict(expr="happy" if k == 0 else "wonder", rot=-12 - 4 * s, turn=-.55, look=(6, -10)))


def P_giggle():
    """ride-giggle: carried along by a part, leaning back, laughing, feet up"""
    hip = (0, -70)
    legs = {"n": dict(a1=100, a2=128, fa=170), "f": dict(a1=92, a2=120, fa=160)}
    return dict(hip=hip, torso=-22, legs=legs, shadow_w=230, shadow_x=60,
                arms={"n": dict(a1=30, a2=10, hand="open", ha=-60), "f": dict(a1=120, a2=150, hand="open", ha=0)},
                head=dict(expr="laugh", rot=-18, turn=-.5, dx=4, dy=4), order=["arm_f", "leg_f", "torso", "leg_n", "arm_n", "head"])


def P_touchwatch():
    """touch-watch: a finger is on the page; he looks up at it, curious"""
    hip, legs = sit_base()
    return dict(hip=hip, torso=-10, legs=legs, shadow_w=230, shadow_x=60,
                arms={"n": dict(a1=22, a2=70, hand="open", ha=-30), "f": dict(a1=16, a2=60, hand="open", ha=-30)},
                head=dict(expr="wonder", rot=-24, turn=-.3, look=(4, -14), dx=6, dy=10))


def P_carried():
    """carried: lifted under the arms (the carrier's hands are theirs to draw);
    arms up and out, legs dangling, toes pointing down"""
    hip = (0, -ANK - 330)
    legs = {"n": dict(a1=12, a2=-4, fa=30), "f": dict(a1=-6, a2=-16, fa=24)}
    return dict(hip=hip, torso=2, legs=legs, shadow=False,
                arms={"n": dict(a1=108, a2=92, hand="open", ha=10), "f": dict(a1=124, a2=112, hand="open", ha=10)},
                head=dict(expr="happy", rot=-6, turn=-.5, dy=14), order=["arm_f", "leg_f", "torso", "leg_n", "head", "arm_n"])


STEP = 240     # the riser a climb edge goes up (≈ 22 pt): the page draws it, not the frame


def P_climb(k):
    """climb (3): onto a step one riser high, ahead of him.  The anchor moves
    up the edge as he climbs, so each frame stands on its own point:
    1 pull-up (knees on the lower floor, hands on the step top),
    2 knee-over (near knee up on the step, the anchor halfway),
    3 up (on all fours on top, the far foot still trailing over the edge)."""
    if k == 0:
        hip = (-60, -196)
        legs = {"n": dict(a1=-2, a2=-90, fa=-150), "f": dict(a1=-8, a2=-92, fa=-150)}
        return dict(hip=hip, torso=22, legs=legs, shadow_w=200, shadow_x=-20,
                    arms={"n": dict(ik=(120, -STEP - 6), bend=-1, hand="grab", ha=-80),
                          "f": dict(ik=(150, -STEP - 14), bend=-1, hand="grab", ha=-80)},
                    head=dict(expr="say", rot=-24, look=(6, -8), dx=20, dy=14),
                    order=["arm_f", "leg_f", "torso", "leg_n", "head", "arm_n"])
    if k == 1:
        # the riser is just behind x = 0: the lower floor is y = +h, the step top y = -h
        h = STEP / 2
        hip = (16, -40)
        legs = {"n": dict(a1=ang((10, -30), (150, -h - 30)), a2=-96, fa=-40),
                "f": dict(a1=ang((-14, -26), (-60, h - 34)), a2=-88, fa=-150)}
        return dict(hip=hip, torso=-55, legs=legs, shadow_w=150, shadow_x=-80, shadow_y=h,
                    arms={"n": dict(ik=(360, -h - 30), bend=-1, hand="open", ha=-70),
                          "f": dict(ik=(392, -h - 36), bend=-1, hand="open", ha=-70)},
                    head=dict(expr="say", rot=-30, look=(6, -4), dx=40, dy=30),
                    order=["arm_f", "leg_f", "torso", "leg_n", "arm_n", "head"])
    p = crawl(0.0)
    hip = p["hip"]
    F = torso_frame(hip, p["torso"])
    H_f = F((-14, 386))
    # the far leg trails back over the edge, the shin hanging down the riser
    p["legs"]["f"] = dict(a1=ang(H_f, (H_f[0] - 80, 20)), a2=-6, fa=40)
    p["head"] = dict(expr="happy", rot=-24, dx=40, dy=30, look=(6, -4))
    return p


RAIL = 540    # the rail a cruise edge runs along (≈ 50 pt up): the page draws it, not the frame


def P_cruise(k):
    """stand-cruise's sidestep (#127): standing, both hands on a rail at chest
    height ahead of him, stepping along it.  1 the near foot reaches out along
    the rail, weight still back; 2 the far foot closes up, weight over it.
    With `pull` (pulling up to stand) and `wobble` (2) it makes stand-cruise's 4+."""
    if k == 0:
        hip = (8, -ANK - 286)
        legs = {"n": dict(ik=(112, -ANK - 4), bend=1, fa=100), "f": dict(ik=(-58, -ANK), bend=1, fa=88)}
        torso_a, head = 10, dict(expr="say", rot=-4, look=(8, 2), dx=6)
    else:
        hip = (18, -ANK - 304)
        legs = {"n": dict(ik=(56, -ANK), bend=1, fa=90), "f": dict(ik=(6, -ANK - 18), bend=1, fa=84)}
        torso_a, head = 6, dict(expr="happy", rot=-8, look=(6, 0), dx=4)
    return dict(hip=hip, torso=torso_a, legs=legs, shadow_w=190, shadow_x=10,
                arms={"n": dict(ik=(196, -RAIL), bend=1, hand="grab", ha=-70),
                      "f": dict(ik=(232, -RAIL - 8), bend=1, hand="grab", ha=-70)},
                head=head, order=["arm_f", "leg_f", "torso", "leg_n", "head", "arm_n"])


POSES = {
    # name: (builder(k) or builder, frames, label, keyframes)
    "crawl": (crawl, 8, "爬行循環", [0, 2, 4, 6]),
    "sit": (lambda k: P_sit(), 1, "坐著待機", None),
    "clap": (P_clap, 2, "拍手", None),
    "reach": (lambda k: [P_reach, P_reach2][k](), 2, "伸手抓高處", None),
    "hold": (lambda k: P_hold(), 1, "抓著東西", None),
    "eat": (lambda k: P_eat(), 1, "咬咬（吃）", None),
    "point": (lambda k: P_point(), 1, "指「這個！」", None),
    "wave": (P_wave, 2, "掰掰", None),
    "hug": (lambda k: P_hug(), 1, "抱抱（手舉高）", None),
    "cry": (P_cry, 2, "哇哇大哭", None),
    "refuse": (P_refuse, 2, "「不要！」搖頭", None),
    "wonder": (lambda k: P_wonder(), 1, "「飛機！」抬頭看", None),
    "sleep": (P_sleepy, 2, "想睡／睡著", None),
    "pull": (lambda k: P_pull(), 1, "扶著站起來", None),
    "wobble": (P_wobble, 2, "搖搖晃晃站", None),
    "walk": (walk, 8, "第一步走路循環", [0, 2, 4, 6]),
    "bounce": (P_bounce, 2, "開心彈跳", None),
    "zhuazhou": (lambda k: P_zhuazhou(), 1, "抓周拍照", None),
    # #141: the GDD § 3.9 frames the first delivery left out
    "look": (P_look, 2, "左看右看", None),
    "watch": (P_watch, 2, "看燈搖搖", None),
    "giggle": (lambda k: P_giggle(), 1, "搭便車咯咯笑", None),
    "touchwatch": (lambda k: P_touchwatch(), 1, "抬頭看手指", None),
    "carried": (lambda k: P_carried(), 1, "被抱起來", None),
    "climb": (P_climb, 3, "爬上台階", None),
    # #127: stand-cruise's sidestep along a rail (with pull + wobble, stand-cruise is complete)
    "cruise": (P_cruise, 2, "扶著橫著走", None),
}


def frame_pose(name, i):
    fn, n, _, _ = POSES[name]
    if name in ("crawl", "walk"):
        return fn(i / n)
    return fn(i)


VB = (-560, -1500, 1120, 1560)   # x, y, w, h around the anchor


def frame_svg(name, i, guides=False):
    d = Doc(0, 0, " ".join(map(str, VB)))
    d.add(figure(d, frame_pose(name, i)))
    if guides:
        d.add(f'<path d="M-560,0 L560,0" stroke="#c33" stroke-width="2"/><circle cx="0" cy="0" r="6" fill="#c33"/>')
    return d.svg()


if __name__ == "__main__":
    import sys
    print(frame_svg(sys.argv[1] if len(sys.argv) > 1 else "sit", int(sys.argv[2]) if len(sys.argv) > 2 else 0, True))
