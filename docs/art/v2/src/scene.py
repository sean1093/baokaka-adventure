"""scene.py - style proof: both characters in a small night scene at phone
size (390 x 844 pt, authored at 2x = 780 x 1688 units).

Characters are night-graded with an SVG filter (cool multiply) plus a warm
rim light computed from their own alpha - the same treatment the baked game
sprites can get per scene.
"""
import random
from geom import *
import baokaka_body as B
import mocha as Mo

VW, VH = 780, 1688


def night_filter(doc, rim="#FFD7A0", dx=-5, dy=-2, grade=(.80, .80, .95)):
    i = doc.id("nf")
    r, g, b = grade
    doc.defs.append(
        f'<filter id="{i}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">'
        f'<feColorMatrix in="SourceGraphic" type="matrix" values="{r} 0 0 0 0.01  0 {g} 0 0 0.015  0 0 {b} 0 0.05  0 0 0 1 0" result="gr"/>'
        f'<feOffset in="SourceAlpha" dx="{-dx}" dy="{-dy}" result="off"/>'
        f'<feComposite in="SourceAlpha" in2="off" operator="out" result="edge"/>'
        f'<feGaussianBlur in="edge" stdDeviation="1.2" result="eb"/>'
        f'<feFlood flood-color="{rim}" flood-opacity=".9"/><feComposite in2="eb" operator="in" result="rim"/>'
        f'<feMerge><feMergeNode in="gr"/><feMergeNode in="rim"/></feMerge></filter>')
    return f"url(#{i})"


def taipei101(doc, x, base, s=1.0):
    """Taipei 101: podium, tapering base, eight flared 8-storey segments,
    crown and spire.  Two-sided shading (lit left), thin window bands,
    the segment lips catch the cyan night lighting."""
    o = f'<ellipse cx="{x}" cy="{base - 560*s}" rx="{120*s}" ry="{460*s}" fill="#6FC9B8" opacity=".12" filter="{doc.blur(34)}"/>'
    L = doc.lin([(0, "#3E6378"), (1, "#24405A")], 0, 0, 1, 0)
    R = "#132338"
    def block(pts_l, pts_r):
        return P(poly(pts_l), L) + P(poly(pts_r), R)
    # podium + tapering trunk
    o += block([(x - 78 * s, base), (x - 70 * s, base - 70 * s), (x + 8 * s, base - 70 * s), (x + 8 * s, base)],
               [(x + 8 * s, base), (x + 8 * s, base - 70 * s), (x + 70 * s, base - 70 * s), (x + 78 * s, base)])
    y = base - 70 * s
    o += block([(x - 50 * s, y), (x - 38 * s, y - 150 * s), (x + 6 * s, y - 150 * s), (x + 6 * s, y)],
               [(x + 6 * s, y), (x + 6 * s, y - 150 * s), (x + 38 * s, y - 150 * s), (x + 50 * s, y)])
    for r in range(10):
        yy = y - 10 * s - r * 14 * s
        o += f'<rect x="{x - 44*s + r*1.1*s}" y="{yy}" width="{50*s - r*1.1*s}" height="{1.6*s}" fill="#FFE1A0" opacity=".35"/>'
    y -= 150 * s
    for k in range(8):
        h = 60 * s
        bw, tw = 33 * s, 46 * s
        o += block([(x - bw, y), (x - tw, y - h), (x + 6 * s, y - h), (x + 6 * s, y)],
                   [(x + 6 * s, y), (x + 6 * s, y - h), (x + tw, y - h), (x + bw, y)])
        for r in range(7):
            yy = y - 6 * s - r * 7.6 * s
            ww = bw + (tw - bw) * (6 + r * 7.6) / 60
            o += f'<rect x="{x - ww + 3*s}" y="{yy}" width="{ww + 3*s}" height="{1.5*s}" fill="#FFE1A0" opacity="{.28 + .12*((k+r)%3)}"/>'
            o += f'<rect x="{x + 6*s}" y="{yy}" width="{ww - 9*s}" height="{1.5*s}" fill="#FFD27A" opacity=".18"/>'
        o += P(taper([(x - tw - 2 * s, y - h), (x + tw + 2 * s, y - h)], 2.6 * s, .05, .05), "#8FF0D6", opacity=.85)
        o += f'<circle cx="{x - tw}" cy="{y - h + 4*s}" r="{2.4*s}" fill="#8FF0D6"/>'
        y -= h
    o += block([(x - 30 * s, y), (x - 22 * s, y - 46 * s), (x + 4 * s, y - 46 * s), (x + 4 * s, y)],
               [(x + 4 * s, y), (x + 4 * s, y - 46 * s), (x + 22 * s, y - 46 * s), (x + 30 * s, y)])
    o += block([(x - 13 * s, y - 46 * s), (x - 9 * s, y - 76 * s), (x + 2 * s, y - 76 * s), (x + 2 * s, y - 46 * s)],
               [(x + 2 * s, y - 46 * s), (x + 2 * s, y - 76 * s), (x + 9 * s, y - 76 * s), (x + 13 * s, y - 46 * s)])
    o += P(taper([(x, y - 76 * s), (x, y - 190 * s)], 4.5 * s, 0, .95), "#3E6378")
    o += f'<circle cx="{x}" cy="{y - 190*s}" r="{3.5*s}" fill="#FF6B5A"/><circle cx="{x}" cy="{y - 190*s}" r="{14*s}" fill="#FF6B5A" opacity=".35" filter="{doc.blur(5)}"/>'
    return o


def skyline(doc, base, seed, col, lit, hmin, hmax, wmin=40, wmax=110):
    rnd = random.Random(seed)
    o = ""
    x = -20
    while x < VW + 20:
        w = rnd.uniform(wmin, wmax)
        h = rnd.uniform(hmin, hmax)
        o += f'<rect x="{x}" y="{base - h}" width="{w}" height="{h + 400}" fill="{col}"/>'
        for wy in range(int(base - h + 14), int(base), 18):
            for wx in range(int(x + 8), int(x + w - 8), 14):
                if rnd.random() < lit:
                    o += f'<rect x="{wx}" y="{wy}" width="6" height="8" fill="{rnd.choice(["#FFD98A", "#FFE9B8", "#9FD8FF"])}" opacity="{rnd.uniform(.35, .85):.2f}"/>'
        x += w + rnd.uniform(-6, 10)
    return o


def build():
    d = Doc(VW, VH)
    o = ""
    sky = d.lin([(0, "#0B1033"), (.45, "#1F2160"), (.72, "#4A3878"), (.86, "#8A5A86")], 0, 0, 0, 1)
    o += f'<rect width="{VW}" height="{VH}" fill="{sky}"/>'
    rnd = random.Random(7)
    for _ in range(90):
        x, y, r = rnd.uniform(0, VW), rnd.uniform(0, 700), rnd.uniform(.6, 2.2)
        o += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="#fff" opacity="{rnd.uniform(.3, .9):.2f}"/>'
    # moon
    o += f'<circle cx="690" cy="330" r="120" fill="#FFF1C4" opacity=".18" filter="{d.blur(30)}"/>'
    o += f'<circle cx="690" cy="330" r="46" fill="#FFF4D2"/><circle cx="710" cy="316" r="42" fill="#1C1E55"/>'
    # far city, 101, near city
    hz = 1040
    o += P(smooth([(-20, hz), (80, hz - 150), (200, hz - 210), (300, hz - 170), (420, hz - 90), (800, hz - 40), (800, hz + 40), (-20, hz + 40)]), "#25234F")
    o += skyline(d, hz, 3, "#2A2758", .10, 60, 180)
    o += f'<rect x="0" y="{hz-60}" width="{VW}" height="200" fill="#8A5A86" opacity=".25" filter="{d.blur(20)}"/>'
    o += taipei101(d, 590, hz + 30, 1.0)
    o += skyline(d, hz + 70, 9, "#1A1A3E", .16, 40, 140, 60, 140)
    # elevated MRT platform: canopy edge, glass barrier, sign
    o += f'<rect x="0" y="0" width="{VW}" height="86" fill="#141530"/>'
    o += f'<rect x="0" y="86" width="{VW}" height="10" fill="#2B2D55"/>'
    for x in range(60, VW, 220):
        o += f'<rect x="{x}" y="96" width="120" height="14" rx="6" fill="#FFF3D6"/>'
        o += f'<ellipse cx="{x+60}" cy="120" rx="140" ry="40" fill="#FFE7B0" opacity=".10" filter="{d.blur(14)}"/>'
    # platform floor
    fl = d.lin([(0, "#3B3A66"), (1, "#24234A")], 0, 0, 0, 1)
    o += f'<path d="M0,1150 L{VW},1150 L{VW},{VH} L0,{VH}Z" fill="{fl}"/>'
    for k in range(9):
        y = 1150 + k * k * 9 + k * 14
        o += f'<path d="M0,{y} L{VW},{y}" stroke="#4A4980" stroke-width="2" opacity=".5"/>'
    for k in range(-6, 14):
        o += f'<path d="M{390 + k*20},1150 L{390 + k*120},{VH}" stroke="#4A4980" stroke-width="2" opacity=".35"/>'
    # tactile yellow strip at the platform edge
    o += f'<path d="M0,1170 L{VW},1170 L{VW},1204 L0,1204Z" fill="#E8B83A"/>'
    for x in range(8, VW, 22):
        o += f'<rect x="{x}" y="1176" width="14" height="4" rx="2" fill="#B88A1E"/><rect x="{x}" y="1188" width="14" height="4" rx="2" fill="#B88A1E"/>'
    # glass barrier with railing (behind the characters)
    o += f'<rect x="0" y="1010" width="{VW}" height="150" fill="#9FC8FF" opacity=".10"/>'
    o += f'<rect x="0" y="1004" width="{VW}" height="8" fill="#C9D6F0" opacity=".7"/>'
    for x in range(0, VW, 160):
        o += f'<rect x="{x}" y="1004" width="6" height="156" fill="#C9D6F0" opacity=".55"/>'
    o += P(poly([(40, 1016), (140, 1016), (60, 1150), (0, 1150), (0, 1080)]), "#fff", opacity=".07")
    # station sign (generic, no logos)
    o += f'<rect x="40" y="150" width="270" height="92" rx="10" fill="#F4F4F0"/>'
    o += f'<rect x="40" y="150" width="20" height="92" rx="4" fill="#D9372E"/>'
    o += f'<text x="80" y="198" font-size="38" font-weight="900" fill="#1C1C30" font-family="Noto Sans TC, WenQuanYi Zen Hei, sans-serif">象山站</text>'
    o += f'<text x="82" y="228" font-size="17" font-weight="600" fill="#55556A" font-family="Fredoka, sans-serif">Xiangshan · 往 淡水</text>'
    o += f'<rect x="120" y="110" width="8" height="40" fill="#555872"/><rect x="230" y="110" width="8" height="40" fill="#555872"/>'
    o += f'<ellipse cx="254" cy="1494" rx="96" ry="18" fill="#05051A" opacity=".6" filter="{d.blur(8)}"/>'
    o += f'<ellipse cx="513" cy="1490" rx="110" ry="16" fill="#05051A" opacity=".6" filter="{d.blur(8)}"/>'
    # warm lamp pool on the floor
    o += f'<ellipse cx="380" cy="1380" rx="380" ry="150" fill="#FFD9A0" opacity=".16" filter="{d.blur(30)}"/>'
    d.add(o)
    bg = d.svg()
    d2 = Doc(VW, VH)
    o2 = ""
    # foreground bokeh + light vignette
    for x, y, r, c in [(60, 1600, 46, "#FFD98A"), (720, 1560, 60, "#9FD8FF"), (680, 340, 30, "#FFD98A"), (40, 520, 26, "#FFB0C0")]:
        o2 += f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" opacity=".18" filter="{d2.blur(6)}"/>'
    vg = d2.rad([(0, "#000", 0), (.7, "#000", 0), (1, "#05051A", .55)], .5, .5, .75)
    o2 += f'<rect width="{VW}" height="{VH}" fill="{vg}"/>'
    d2.add(o2)
    return bg, d2.svg()


# character placements in scene px (2x): (module, expr, svg viewBox, target x, y, w, h)
def char_layers():
    import baokaka_body as Bm
    out = []
    s = 540 / 1400
    vb = (-140, -40, 680, 1420)
    w, h = round(vb[2] * s), round(vb[3] * s)
    d = Doc(0, 0, " ".join(map(str, vb)))
    d.add(Bm.figure(d, "happy", shadow=False))
    out.append(("bk", d.svg(), 142, 1492 - round((1336 + 40) * s), w, h, (200 * s + 150 - 0, 1494, 240 * s)))
    m = 360 / 660
    vbm = (130, -30, 360, 730)
    w2, h2 = round(vbm[2] * m), round(vbm[3] * m)
    d = Doc(0, 0, " ".join(map(str, vbm)))
    d.add(Mo.figure(d, "smug", shadow=False))
    out.append(("mo", d.svg(), 420, 1488 - round((690 + 30) * m), w2, h2, (420 + (300 - 130) * m, 1490, 200 * m)))
    return out


if __name__ == "__main__":
    print(build()[0])
