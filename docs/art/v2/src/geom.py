"""geom.py - inking + cel-shading toolkit for the v2 anime character art.

Everything is authored as plain SVG so it can be baked to bitmaps at build
 time (see ../tools/bake.mjs).  The point of this module is to give code-drawn
art the three things the old flat vector art lacked:

  1. tapered, light-weighted line art (filled polygons, not uniform strokes)
  2. layered shading: masked cel shadow + soft ambient gradient + highlights
  3. hair clumps / strands built from a centre line with a width profile

Light comes from the upper left (LIGHT); line weight thickens on the side
facing away from it, which is how a TV-anime key animator inks.
"""
import math
import numpy as np

LIGHT = np.array([-0.55, -0.83])          # direction *towards* the light
AWAY = -LIGHT / np.linalg.norm(LIGHT)


# ----------------------------------------------------------------- splines
def _cr(p0, p1, p2, p3, n):
    t = np.linspace(0, 1, n, endpoint=False)[:, None]
    t2, t3 = t * t, t * t * t
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                  + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)


def dense(pts, closed=False, n=14):
    """Catmull-Rom sample through control points -> (N,2) array."""
    P = np.array(pts, float)
    if len(P) == 2:
        t = np.linspace(0, 1, n * 2)[:, None]
        return P[0] * (1 - t) + P[1] * t
    if closed:
        Q = np.vstack([P[-1], P, P[0], P[1]])
        segs = [_cr(Q[i], Q[i + 1], Q[i + 2], Q[i + 3], n) for i in range(len(P))]
        return np.vstack(segs)
    Q = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    segs = [_cr(Q[i], Q[i + 1], Q[i + 2], Q[i + 3], n) for i in range(len(P) - 1)]
    return np.vstack(segs + [P[-1:]])


def f(v):
    return f"{v:.1f}".rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))


def poly(D, closed=True):
    s = "M" + " L".join(f"{f(x)},{f(y)}" for x, y in D)
    return s + ("Z" if closed else "")


def smooth(pts, closed=True):
    """Cubic-bezier path through points (Catmull-Rom converted)."""
    P = np.array(pts, float)
    n = len(P)
    if closed:
        Q = np.vstack([P[-1], P, P[0], P[1]])
        rng = range(n)
    else:
        Q = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
        rng = range(n - 1)
    d = f"M{f(P[0][0])},{f(P[0][1])}"
    for i in rng:
        p0, p1, p2, p3 = Q[i], Q[i + 1], Q[i + 2], Q[i + 3]
        c1 = p1 + (p2 - p0) / 6
        c2 = p2 - (p3 - p1) / 6
        d += f" C{f(c1[0])},{f(c1[1])} {f(c2[0])},{f(c2[1])} {f(p2[0])},{f(p2[1])}"
    return d + ("Z" if closed else "")


def normals(D, closed=False):
    if closed:
        T = np.roll(D, -1, 0) - np.roll(D, 1, 0)
    else:
        T = np.gradient(D, axis=0)
    L = np.linalg.norm(T, axis=1)[:, None]
    L[L == 0] = 1
    T = T / L
    return np.stack([T[:, 1], -T[:, 0]], 1)   # right-hand normal


def _area(D):
    x, y = D[:, 0], D[:, 1]
    return 0.5 * np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y)


# ----------------------------------------------------------------- strokes
def taper(pts, w=2.0, start=0.15, end=0.15, prof=None, n=14, wobble=0.0):
    """Open tapered ink stroke through pts as a filled path.
    start/end: fraction of length used for the taper-in / taper-out.
    prof: optional callable t->multiplier."""
    D = dense(pts, False, n)
    seg = np.linalg.norm(np.diff(D, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = s / (s[-1] or 1)
    W = np.ones_like(t)
    if start > 0:
        W *= np.clip(t / start, 0, 1) ** 0.7
    if end > 0:
        W *= np.clip((1 - t) / end, 0, 1) ** 0.7
    if prof is not None:
        W *= np.array([prof(x) for x in t])
    W = np.maximum(W * w, 0.04 * w)
    N = normals(D)
    L = D + N * (W[:, None] / 2)
    R = D - N * (W[:, None] / 2)
    return poly(np.vstack([L, R[::-1]]))


def outline(pts, w=2.2, k=1.1, closed=True, n=14, gaps=None, minw=0.35):
    """Ink an outline whose weight swells on the side facing away from the
    light (k = how much).  gaps: list of (t0,t1) fractions to leave open,
    giving the 'broken line' liveliness of hand inking."""
    D = dense(pts, closed, n)
    if closed:
        D = np.vstack([D, D[:1]])
    N = normals(D)
    if closed and _area(D) < 0:   # make normals point outward
        N = -N
    face = np.clip(N @ AWAY, 0, 1)
    W = w * (minw + (1 - minw) * 0.55 + k * face * 0.6)
    seg = np.linalg.norm(np.diff(D, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = s / (s[-1] or 1)
    if not closed:
        W *= np.clip(t / 0.08, 0, 1) ** 0.6 * np.clip((1 - t) / 0.08, 0, 1) ** 0.6
    if gaps:
        for a, b in gaps:
            m = (b - a) * 0.25
            fall = np.clip(np.minimum((t - a) / max(m, 1e-6), (b - t) / max(m, 1e-6)), 0, 1)
            inside = (t > a) & (t < b)
            W = np.where(inside, W * (1 - fall) ** 1.0, W)
    W = np.maximum(W, 0.02)
    L = D + N * (W[:, None] / 2)
    R = D - N * (W[:, None] / 2)
    return poly(np.vstack([L, R[::-1]]))


def strand(pts, w, tip=1.0, root=0.0, bulge=0.35, n=12):
    """Pointed hair clump: width w at root, swelling slightly then
    tapering to a sharp tip.  Returns closed filled path."""
    D = dense(pts, False, n)
    seg = np.linalg.norm(np.diff(D, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = s / (s[-1] or 1)
    W = w * (1 + bulge * np.sin(np.pi * np.clip(t * 1.6, 0, 1))) * (1 - t) ** (0.9 * tip)
    if root:
        W *= np.clip(t / root, 0, 1) ** 0.5
    N = normals(D)
    L = D + N * (W[:, None] / 2)
    R = D - N * (W[:, None] / 2)
    return poly(np.vstack([L, R[::-1]]))


# --------------------------------------------------------------- SVG doc
_UID = 0


class Doc:
    def __init__(self, w, h, vb=None):
        self.w, self.h = w, h
        self.vb = vb or f"0 0 {w} {h}"
        self.defs = []
        self.body = []
        self.n = 0

    def id(self, p="i"):
        global _UID
        _UID += 1
        return f"{p}{_UID}"

    def add(self, s):
        self.body.append(s)

    def lin(self, stops, x1=0, y1=0, x2=0, y2=1, units=None):
        i = self.id("g")
        u = f' gradientUnits="{units}"' if units else ""
        st = "".join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{a}"' if a != 1 else "") + "/>"
                     for o, c, a in [(s + (1,))[:3] for s in stops])
        self.defs.append(f'<linearGradient id="{i}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"{u}>{st}</linearGradient>')
        return f"url(#{i})"

    def rad(self, stops, cx=.5, cy=.5, r=.5, fx=None, fy=None, units=None, tf=None):
        i = self.id("g")
        u = f' gradientUnits="{units}"' if units else ""
        ff = f' fx="{fx}" fy="{fy}"' if fx is not None else ""
        t = f' gradientTransform="{tf}"' if tf else ""
        st = "".join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{a}"' if a != 1 else "") + "/>"
                     for o, c, a in [(s + (1,))[:3] for s in stops])
        self.defs.append(f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}"{ff}{u}{t}>{st}</radialGradient>')
        return f"url(#{i})"

    def blur(self, sd):
        i = self.id("b")
        self.defs.append(f'<filter id="{i}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="{sd}"/></filter>')
        return f"url(#{i})"

    def clip(self, d):
        i = self.id("c")
        self.defs.append(f'<clipPath id="{i}"><path d="{d}"/></clipPath>')
        return f"url(#{i})"

    def mask(self, inner):
        i = self.id("m")
        self.defs.append(f'<mask id="{i}" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000">{inner}</mask>')
        return f"url(#{i})"

    def svg(self, extra_attr=""):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{self.vb}" {extra_attr}>'
                f'<defs>{"".join(self.defs)}</defs>{"".join(self.body)}</svg>')

    def inner(self):
        """defs + body, for embedding into another Doc"""
        return f'<defs>{"".join(self.defs)}</defs>{"".join(self.body)}'


def P(d, fill="none", **kw):
    a = "".join(f' {k.replace("_", "-")}="{v}"' for k, v in kw.items())
    return f'<path d="{d}" fill="{fill}"{a}/>'


def G(inner, **kw):
    a = "".join(f' {k.replace("_", "-")}="{v}"' for k, v in kw.items())
    return f"<g{a}>{inner}</g>"


def ellipse_pts(cx, cy, rx, ry, n=12, rot=0):
    out = []
    for i in range(n):
        a = 2 * math.pi * i / n
        x, y = rx * math.cos(a), ry * math.sin(a)
        c, s = math.cos(rot), math.sin(rot)
        out.append((cx + x * c - y * s, cy + x * s + y * c))
    return out


def mirror(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def translate(pts, dx, dy):
    return [(x + dx, y + dy) for x, y in pts]


def scale_about(pts, cx, cy, sx, sy=None):
    sy = sx if sy is None else sy
    return [(cx + (x - cx) * sx, cy + (y - cy) * sy) for x, y in pts]


# -------------------------------------------------------------- shading
def cel(doc, d_shape, shade, shift=(14, 10), extra="", soft=None, d_cut=None, opacity=1):
    """Cel shadow on the far side of a shape: shape minus (shape shifted
    toward the light).  Optional additional shadow paths (extra) and a soft
    blurred core (soft=(color, blur, d)) - all clipped to the shape."""
    dx, dy = shift
    cut = d_cut or d_shape
    m = doc.mask(f'<path d="{d_shape}" fill="#fff"/>'
                 f'<path d="{cut}" fill="#000" transform="translate({-dx},{-dy})"/>')
    out = f'<path d="{d_shape}" fill="{shade}" mask="{m}" opacity="{opacity}"/>'
    if extra or soft:
        c = doc.clip(d_shape)
        inner = extra
        if soft:
            col, b, dd, op = soft
            inner = f'<path d="{dd}" fill="{col}" opacity="{op}" filter="{doc.blur(b)}"/>' + inner
        out += f'<g clip-path="{c}">{inner}</g>'
    return out


def clipped(doc, d_shape, inner):
    return f'<g clip-path="{doc.clip(d_shape)}">{inner}</g>'


def limb(pts, widths, n=16):
    """Closed outline (dense point list) of a limb from a centre line and a
    width at each control point (widths interpolated along the curve).
    Ends are rounded."""
    D = dense(pts, False, n)
    seg = np.linalg.norm(np.diff(D, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = s / (s[-1] or 1)
    # control-point parameter positions (approx: by index)
    tc = np.linspace(0, 1, len(pts))
    W = np.interp(t, tc, widths)
    N = normals(D)
    Lft = D + N * (W[:, None] / 2)
    Rgt = D - N * (W[:, None] / 2)
    def cap(c, a, b, fwd):
        """arc from a to b around centre c bulging toward direction fwd"""
        r = np.linalg.norm(a - b) / 2
        a0 = math.atan2(a[1] - c[1], a[0] - c[0])
        out = []
        best = None
        for sgn in (1, -1):
            mid = a0 + sgn * math.pi / 2
            score = math.cos(mid) * fwd[0] + math.sin(mid) * fwd[1]
            if best is None or score > best[0]:
                best = (score, sgn)
        sgn = best[1]
        for k in range(1, 8):
            ang = a0 + sgn * math.pi * k / 8
            out.append(c + r * np.array([math.cos(ang), math.sin(ang)]))
        return out
    tf = D[-1] - D[-2]
    tb = D[0] - D[1]
    end = cap(D[-1], Lft[-1], Rgt[-1], tf / (np.linalg.norm(tf) or 1))
    start = cap(D[0], Rgt[0], Lft[0], tb / (np.linalg.norm(tb) or 1))
    loop = list(Lft) + end + list(Rgt[::-1]) + start
    return [tuple(p) for p in loop]


def union_ink(shapes, fill, line, lw):
    """Fill several overlapping shapes and ink only their union silhouette
    (stroke-behind trick)."""
    under = "".join(f'<path d="{d}" fill="{line}" stroke="{line}" stroke-width="{lw*2}" stroke-linejoin="round"/>' for d in shapes)
    over = "".join(f'<path d="{d}" fill="{fill}"/>' for d in shapes)
    return under + over
