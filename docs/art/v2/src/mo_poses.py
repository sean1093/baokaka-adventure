"""mo_poses.py - 摩卡貓 gameplay poses (3/4 side view, facing right).

A digitigrade cat rig: a spine (rump -> chest) drawn as one barrel, front
legs shoulder-elbow-wrist-paw (elbow bends back), hind legs hip-knee-hock-
paw (knee forward, hock back), a chained tail, and the head from mocha.py
turned 3/4.  Paws are placed by IK so they stay planted on the ground.

Units = mocha head units.  Ground y = 0, anchor (0, 0) under the body.
"""
import math
import random
from geom import *
from rig import *
import mocha as Mo

FUR, FUR_SH, FUR_SH2, FUR_HL, STRIPE, LN = Mo.FUR, Mo.FUR_SH, Mo.FUR_SH2, Mo.FUR_HL, Mo.STRIPE, Mo.FUR_LN
FAR = "#241E1A"
HEAD_PIV = (300, 292)
TURN = -0.5
FU, FF, FP = 92, 96, 34        # front: upper arm, forearm, pastern
HT, HS, HM = 112, 108, 64       # hind: thigh, shin, metatarsal


# ------------------------------------------------------------- leg builders
def front_leg(S, paw, past=12, bend=-1):
    """past: pastern angle (0 = vertical, + = paw ahead of wrist)"""
    W = pt(paw, 180 + past, FP)
    E = ik2(S, W, FU, FF, bend)
    return [S, E, W, paw]


def hind_leg(Hp, paw, meta=-18, bend=1):
    """meta: angle of hock->paw (0 = vertical, - = hock behind the paw)"""
    Hk = pt(paw, 180 + meta, HM)
    K = ik2(Hp, Hk, HT, HS, bend)
    return [Hp, K, Hk, paw]


# ------------------------------------------------------------- drawing
def stripes_on(doc, d, C, W, every=34, w=12, seed=1, skip_end=1):
    """bands across a limb/spine centre line C (list of pts)"""
    D = dense(C, False, 12)
    N = normals(D)
    o = ""
    seg = np.linalg.norm(np.diff(D, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    rnd = random.Random(seed)
    k = every * .6
    while k < s[-1] - every * skip_end * .3:
        i = int(np.searchsorted(s, k))
        i = min(i, len(D) - 1)
        p, n = D[i], N[i]
        ww = W * 1.1
        q0 = (p[0] - n[0] * ww / 2, p[1] - n[1] * ww / 2)
        q1 = (p[0] + n[0] * ww / 2, p[1] + n[1] * ww / 2)
        mid = (p[0] + rnd.uniform(-4, 4), p[1] + rnd.uniform(-4, 4))
        o += P(strand([q0, mid, q1], w * rnd.uniform(.8, 1.15), bulge=.35, tip=.6), STRIPE, opacity=.85)
        k += every * rnd.uniform(.85, 1.15)
    return o


def fur_part(doc, loop, far=False, extra="", lw=2.3, grad=None, shift=(10, 6)):
    d = poly(loop) if not isinstance(loop, str) else loop
    pts = loop if not isinstance(loop, str) else None
    o = P(d, grad or FUR)
    o += cel(doc, d, FUR_SH, shift=shift, extra=extra)
    if far:
        o += P(d, FAR, opacity=.28)
    if pts is not None:
        o += P(outline(pts, lw, 1.4, n=2), LN)
    return o


def leg_draw(doc, J, widths, far=False, front=True):
    S, E, W, paw = J
    loop = limb([S, E, W], widths[:3], 10)
    d = poly(loop)
    ex = stripes_on(doc, d, [E, W], widths[1], every=40, w=11, seed=int(abs(S[0]) + 3))
    if not front:
        ex += stripes_on(doc, d, [S, E], widths[0] * .9, every=46, w=15, seed=7)
    o = P(d, FUR) + cel(doc, d, FUR_SH, shift=(10, 6), extra=ex)
    if far:
        o += P(d, FAR, opacity=.28)
    o += P(outline(loop, 2.3, 1.4, n=2, gaps=[(.0, .06), (.9, 1.0)] if front else [(.0, .3), (.78, 1.0)]), LN)
    # pastern / metatarsal + paw
    pl = limb([W, paw], [widths[2], widths[3]], 6)
    pd = poly(pl)
    o += P(pd, FUR) + cel(doc, pd, FUR_SH, shift=(6, 4))
    if far:
        o += P(pd, FAR, opacity=.28)
    o += P(outline(pl, 2.0, 1.2, n=2, gaps=[(0, .06), (.94, 1)]), LN)
    a = ang(W, paw)
    F = Frame(paw, a)
    pw = F.pts(ellipse_pts(4, 6, 24, 30, 12))
    o += P(poly(pw), "#A89680") + cel(doc, poly(pw), FUR_SH, shift=(4, 4))
    if far:
        o += P(poly(pw), FAR, opacity=.28)
    o += P(outline(pw, 1.8, 1.2, n=2), LN)
    for t_ in (-8, 6):
        q = F((t_, 30))
        o += P(taper([F((t_, 20)), q], 1.4, .3, .2), LN, opacity=.75)
    return o


def body_draw(doc, C, widths, puff=1.0):
    loop = limb(C, [w * puff for w in widths], 14)
    d = poly(loop)
    g = doc.lin([(0, FUR_HL), (.35, FUR), (1, FUR_SH)], 0, min(p[1] for p in C) - 90, 0, max(p[1] for p in C) + 90, "userSpaceOnUse")
    ex = fur_tex(doc, loop)
    ex += stripes_on(doc, d, C, max(widths) * puff * .9, every=50, w=13, seed=11, skip_end=2)
    # dark dorsal line + lighter belly
    D = dense(C, False, 10)
    N = normals(D)
    top = [(x - nx * max(widths) * puff * .44, y - ny * max(widths) * puff * .44) for (x, y), (nx, ny) in zip(D, N)]
    if np.mean([q[1] for q in top]) > np.mean(D[:, 1]):
        top = [(x + nx * max(widths) * puff * .44, y + ny * max(widths) * puff * .44) for (x, y), (nx, ny) in zip(D, N)]
    ex += P(taper(top, 22 * puff, .1, .1), STRIPE, opacity=.55)
    bot = [(2 * x - tx_, 2 * y - ty_) for (x, y), (tx_, ty_) in zip(D, top)]
    ex += P(taper(bot, 50 * puff, .2, .2), "#B5A38B", opacity=.55, filter=doc.blur(8))
    o = P(d, g) + cel(doc, d, FUR_SH, shift=(12, 8), extra=ex)
    o += P(outline(loop, 2.6, 1.4, n=2), LN)
    if puff > 1.05:   # bristling fur along the back
        for i in range(2, len(top) - 2, 3):
            x, y = top[i]
            o += P(strand([(x, y + 6), (x + 4, y - 16 * puff)], 12, bulge=.2), FUR)
            o += P(taper([(x - 5, y + 2), (x + 4, y - 16 * puff), (x + 8, y + 2)], 1.6, .1, .1), LN)
    return o


def fur_tex(doc, loop):
    xs = [p[0] for p in loop]
    ys = [p[1] for p in loop]
    return Mo.fur_tex(doc, (min(xs), min(ys), max(xs), max(ys)), int(min(xs)) % 97 + 5, 90, op=.32)


def tail_draw(doc, C, w0=52, w1=34, puff=1.0):
    n = len(C)
    W = [(w0 + (w1 - w0) * i / (n - 1)) * puff for i in range(n)]
    loop = limb(C, W, 10)
    d = poly(loop)
    D = dense(C, False, 10)
    ex = stripes_on(doc, d, C, w0 * puff, every=44, w=12, seed=5, skip_end=2)
    ex += P(poly(limb([tuple(D[-14]), tuple(D[-7]), tuple(D[-1])], [W[-1] * 1.1, W[-1] * 1.05, W[-1]], 6)), STRIPE)
    o = P(d, FUR) + cel(doc, d, FUR_SH, shift=(4, 8), extra=ex)
    o += P(outline(loop, 2.2, 1.3, n=2), LN)
    if puff > 1.05:
        for i in range(0, len(loop), 4):
            x, y = loop[i]
            o += P(taper([(x, y), (x + random.Random(i).uniform(-8, 8), y - 8)], 2, .1, .5), LN, opacity=.7)
    return o


def tail_chain(base, a0, curl, seg=36, n=9, wave=0.0, t=0.0):
    pts = [base]
    a = a0
    for i in range(n):
        a += curl + wave * math.sin(2 * math.pi * t + i * .6)
        pts.append(pt(pts[-1], a, seg))
    return pts


def headg(doc, at, p):
    hs = p.get("scale", 1.05)
    g = Mo.head(doc, p.get("expr", "content"), p.get("turn", TURN), 0)
    return f'<g transform="translate({at[0]:.1f},{at[1]:.1f}) rotate({p.get("rot", 0)}) scale({hs}) translate({-HEAD_PIV[0]},{-HEAD_PIV[1]})">{g}</g>'


def chest_patch(doc, C, wid):
    """dark 'necklace' bands on the chest front"""
    x, y = C
    o = ""
    for k in range(3):
        o += P(strand([(x + 6, y - 40 + k * 26), (x + 28, y - 30 + k * 26), (x + 40, y - 14 + k * 26)], 10, bulge=.3, tip=.5), STRIPE, opacity=.8)
    return o


def figure(doc, p):
    L = {}
    puff = p.get("puff", 1.0)
    C = p["spine"]
    L["body"] = body_draw(doc, C, p.get("widths", [176, 180, 200]), puff)
    lw_f = [70, 54, 46, 44]
    lw_h = [150, 80, 50, 44]
    for k in ("ff", "hf", "fn", "hn"):
        if k in p:
            L[k] = leg_draw(doc, p[k], lw_f if k[0] == "f" else lw_h, far=k.endswith("f"), front=k[0] == "f")
    if "tail" in p:
        L["tail"] = tail_draw(doc, p["tail"], puff=p.get("tpuff", 1.0))
    if p.get("necklace", True):
        L["neck"] = chest_patch(doc, C[-1], 160)
    L["head"] = headg(doc, p["neckp"], p.get("head", {}))
    for k, v in p.get("extra", {}).items():
        L[k] = v(doc) if callable(v) else v
    order = p.get("order", ["tail", "ff", "hf", "body", "neck", "hn", "fn", "head"])
    o = ""
    if p.get("shadow", True):
        o += f'<ellipse cx="{p.get("shadow_x", 0)}" cy="4" rx="{p.get("shadow_w", 240)}" ry="20" fill="#2A2030" opacity=".22" filter="{doc.blur(7)}"/>'
    for k in order:
        o += L.get(k, "")
    return o


# ------------------------------------------------------------- poses
REST_F, REST_H = 150, -150


def stand(fn=REST_F + 10, ff=REST_F - 20, hn=REST_H - 10, hf=REST_H + 16, lift=None, bob=0.0, head=None, tail=None, y0=-262):
    lift = lift or {}
    rump = (-190, y0 + 10 + bob)
    mid = (-20, y0 + bob)
    chest = (150, y0 - 14 + bob)
    p = dict(spine=[rump, mid, chest])
    S_n, S_f = (chest[0] - 10, chest[1] + 20), (chest[0] + 4, chest[1] + 8)
    H_n, H_f = (rump[0] + 30, rump[1] + 10), (rump[0] + 44, rump[1])
    p["fn"] = front_leg(S_n, (fn, -lift.get("fn", 0)), 12 - lift.get("fn", 0) * .4)
    p["ff"] = front_leg(S_f, (ff, -lift.get("ff", 0) - 4), 12 - lift.get("ff", 0) * .4)
    p["hn"] = hind_leg(H_n, (hn, -lift.get("hn", 0)), -18 - lift.get("hn", 0) * .5)
    p["hf"] = hind_leg(H_f, (hf, -lift.get("hf", 0) - 4), -18 - lift.get("hf", 0) * .5)
    p["tail"] = tail or tail_chain((rump[0] - 14, rump[1] - 30), -150, 9, 34, 9)
    p["neckp"] = (chest[0] + 30, chest[1] - 40)
    p["head"] = head or dict(expr="content", rot=-4)
    return p


def walk(t):
    """lateral-sequence walk: LH, LF, RH, RF a quarter cycle apart."""
    def step(ph, amp=62, lift=34):
        u = (t + ph) % 1.0
        if u < .62:
            return amp - 2 * amp * (u / .62), 0
        v = (u - .62) / .38
        return -amp + 2 * amp * ease(v), lift * math.sin(math.pi * v)
    hn = step(0.0)
    fn = step(.25)
    hf = step(.5)
    ff = step(.75)
    bob = 6 * math.cos(4 * math.pi * t)
    p = stand(REST_F + fn[0], REST_F + ff[0], REST_H + hn[0], REST_H + hf[0],
              dict(fn=fn[1], ff=ff[1], hn=hn[1], hf=hf[1]), bob,
              dict(expr="content", rot=-4 - bob * .4),
              tail_chain((-204, -280 + bob), -160, 11, 34, 9, wave=3, t=t))
    return p


def sit(head=None, tail_t=None, paw_up=0, paw_fwd=0):
    rump = (-100, -100)
    chest = (56, -330)
    mid = (-34, -226)
    p = dict(spine=[rump, mid, chest], widths=[210, 186, 190])
    S_n, S_f = (chest[0] + 10, chest[1] + 30), (chest[0] + 26, chest[1] + 20)
    p["fn"] = front_leg(S_n, (90 + paw_fwd, -paw_up), 6 + paw_up * .5)
    p["ff"] = front_leg(S_f, (112, -4), 6)
    # folded hind leg: thigh forward, hock on the ground behind, paw forward
    Hp = (rump[0] + 4, rump[1] - 40)
    K = (Hp[0] + 80, Hp[1] + 56)
    Hk = (-150, -24)
    paw = (-56, -4)
    p["hn"] = [Hp, K, Hk, paw]
    p["hf"] = [(Hp[0] + 14, Hp[1] - 6), (K[0] + 20, K[1] - 4), (Hk[0] + 20, -28), (paw[0] + 30, -6)]
    p["tail"] = tail_t or [(rump[0] - 60, rump[1] + 50), (-196, -34), (-160, -20), (-80, -16), (10, -16), (90, -22), (140, -36)]
    p["neckp"] = (chest[0] + 34, chest[1] - 44)
    p["head"] = head or dict(expr="content", rot=-2)
    p["order"] = ["ff", "hf", "body", "neck", "hn", "fn", "tail", "head"]
    p["shadow_w"] = 210
    return p


def P_sit():
    return sit()


def P_perch():
    p = sit(head=dict(expr="content", rot=26, turn=-.55))
    return p


def P_push(k):
    if k == 0:   # paw on the object, eye contact with the camera (the signature beat)
        return sit(head=dict(expr="smug", rot=-2, turn=-.08), paw_up=70, paw_fwd=50)
    return sit(head=dict(expr="content", rot=8, turn=-.55), paw_up=40, paw_fwd=150)


def P_lure(k):
    a = [(-160, -60), (-230, -150), (-250, -260), (-220, -340), (-170 + 40 * k, -380 + 10 * k), (-120 + 80 * k, -370 + 40 * k)]
    return sit(head=dict(expr="smug", rot=-4, turn=-.4), tail_t=a)


def P_loaf():
    rump = (-170, -110)
    mid = (-20, -128)
    chest = (130, -120)
    p = dict(spine=[rump, mid, chest], widths=[200, 214, 200], shadow_w=260)
    p["tail"] = [(rump[0] - 30, rump[1] + 50), (-230, -20), (-150, -12), (-40, -10), (60, -10), (130, -18)]
    # front paws tucked: just the tips peeking
    p["fn"] = [(110, -60), (130, -40), (150, -26), (176, -6)]
    p["neckp"] = (chest[0] + 50, chest[1] - 70)
    p["head"] = dict(expr="content", rot=0, turn=-.4)
    p["order"] = ["body", "neck", "fn", "tail", "head"]
    p["necklace"] = False
    return p


def P_sleep():
    p = P_loaf()
    p["spine"] = [(-150, -86), (-10, -100), (110, -86)]
    p["widths"] = [190, 200, 186]
    p["tail"] = [(-180, -40), (-200, -6), (-110, -4), (0, -4), (110, -6), (190, -14)]
    p["neckp"] = (120, -40)
    p["head"] = dict(expr="sleep", rot=14, turn=-.3, scale=.95)
    p["order"] = ["body", "fn", "head", "tail"]
    return p


def P_crouch():
    p = stand(REST_F + 30, REST_F + 10, REST_H + 60, REST_H + 80, y0=-200,
              head=dict(expr="content", rot=-14, turn=-.5))
    return p


def P_air():
    rump = (-170, -470)
    mid = (0, -500)
    chest = (170, -530)
    p = dict(spine=[rump, mid, chest], widths=[140, 156, 160], shadow_w=150, shadow_x=0)
    p["fn"] = front_leg((chest[0] - 4, chest[1] + 26), (330, -470), 60)
    p["ff"] = front_leg((chest[0] + 10, chest[1] + 16), (350, -490), 60)
    p["hn"] = hind_leg((rump[0] + 30, rump[1] + 20), (-370, -360), -110, bend=1)
    p["hf"] = hind_leg((rump[0] + 44, rump[1] + 10), (-350, -380), -110, bend=1)
    p["tail"] = tail_chain((rump[0] - 14, rump[1] - 20), -110, 6, 36, 9)
    p["neckp"] = (chest[0] + 40, chest[1] - 30)
    p["head"] = dict(expr="surprised", rot=-10, turn=-.5)
    return p


def P_land():
    p = stand(REST_F + 50, REST_F + 30, REST_H - 30, REST_H - 10, dict(hn=60, hf=50), y0=-250,
              head=dict(expr="content", rot=4, turn=-.5))
    rump, mid, chest = p["spine"]
    p["spine"] = [(rump[0], rump[1] - 70), (mid[0], mid[1] - 20), chest]
    p["hn"] = hind_leg((rump[0] + 30, rump[1] - 60), (rump[0] - 150, rump[1] + 30), -120)
    p["hf"] = hind_leg((rump[0] + 44, rump[1] - 70), (rump[0] - 120, rump[1] + 10), -120)
    p["tail"] = tail_chain((rump[0] - 14, rump[1] - 100), -140, 4, 36, 9)
    return p


def P_squeeze():
    rump = (-230, -150)
    mid = (-30, -136)
    chest = (170, -130)
    p = dict(spine=[rump, mid, chest], widths=[124, 130, 128], shadow_w=290)
    p["fn"] = front_leg((chest[0] - 6, chest[1] + 20), (250, 0), 70)
    p["ff"] = front_leg((chest[0] + 6, chest[1] + 10), (200, -4), 60)
    p["hn"] = hind_leg((rump[0] + 30, rump[1] + 16), (-120, 0), -70)
    p["hf"] = hind_leg((rump[0] + 44, rump[1] + 6), (-170, -4), -70)
    p["tail"] = tail_chain((rump[0] - 14, rump[1]), -96, 1, 36, 9)
    p["neckp"] = (chest[0] + 60, chest[1] + 10)
    p["head"] = dict(expr="content", rot=6, turn=-.5, scale=.86)
    return p


def P_stretch():
    rump = (-170, -330)
    mid = (-20, -230)
    chest = (140, -150)
    p = dict(spine=[rump, mid, chest], widths=[150, 150, 150])
    p["fn"] = front_leg((chest[0], chest[1] + 30), (350, 0), 70)
    p["ff"] = front_leg((chest[0] + 14, chest[1] + 20), (320, -4), 70)
    p["hn"] = hind_leg((rump[0] + 30, rump[1] + 10), (-150, 0), -14)
    p["hf"] = hind_leg((rump[0] + 44, rump[1]), (-126, -4), -14)
    p["tail"] = tail_chain((rump[0] - 14, rump[1] - 30), -170, 6, 36, 9)
    p["neckp"] = (chest[0] + 60, chest[1] - 10)
    p["head"] = dict(expr="happy", rot=10, turn=-.5)
    p["shadow_w"] = 300
    return p


def P_puff():
    p = stand(REST_F - 10, REST_F - 30, REST_H + 10, REST_H + 30, y0=-320,
              head=dict(expr="surprised", rot=4, turn=-.45),
              tail=tail_chain((-204, -380), -178, 2, 34, 9))
    rump, mid, chest = p["spine"]
    p["spine"] = [rump, (mid[0], mid[1] - 80), chest]
    p["puff"] = 1.15
    p["tpuff"] = 1.7
    return p


def P_rub():
    p = stand(head=dict(expr="happy", rot=24, turn=-.55),
              tail=tail_chain((-204, -340), -176, 4, 38, 9) [:-2] + [(-250, -650), (-220, -680)])
    p["neckp"] = (p["neckp"][0] + 10, p["neckp"][1] + 40)
    return p


POSES = {
    "walk": (walk, 8, "走路循環（側對角步態）", [0, 2, 4, 6]),
    "sit": (lambda k: P_sit(), 1, "坐", None),
    "loaf": (lambda k: P_loaf(), 1, "母雞蹲（吐司）", None),
    "sleep": (lambda k: P_sleep(), 1, "蜷著睡", None),
    "jump": (lambda k: [P_crouch, P_air, P_land][k](), 3, "跳：蹲／空中／落地", None),
    "perch": (lambda k: P_perch(), 1, "高處往下看", None),
    "squeeze": (lambda k: P_squeeze(), 1, "鑽過縫", None),
    "push": (P_push, 2, "推下去（先對鏡頭）", None),
    "lure": (P_lure, 2, "甩尾巴引誘", None),
    "stretch": (lambda k: P_stretch(), 1, "伸懶腰", None),
    "puff": (lambda k: P_puff(), 1, "嚇到炸毛", None),
    "rub": (lambda k: P_rub(), 1, "磨蹭寶咖咖", None),
}


def frame_pose(name, i):
    fn, n, _, _ = POSES[name]
    if name == "walk":
        return fn(i / n)
    return fn(i)


VB = (-560, -900, 1120, 960)


def frame_svg(name, i, guides=False):
    d = Doc(0, 0, " ".join(map(str, VB)))
    if name == "album":
        d.add(f'<g transform="translate(-300,-724)">{Mo.figure(d, "content")}</g>')
    else:
        d.add(figure(d, frame_pose(name, i)))
    if guides:
        d.add(f'<path d="M-560,0 L560,0" stroke="#c33" stroke-width="2"/><circle cx="0" cy="0" r="6" fill="#c33"/>')
    return d.svg()


POSES["album"] = (None, 1, "合照（陪寶咖咖坐）", None)


if __name__ == "__main__":
    import sys
    print(frame_svg(sys.argv[1] if len(sys.argv) > 1 else "walk", int(sys.argv[2]) if len(sys.argv) > 2 else 0, True))
