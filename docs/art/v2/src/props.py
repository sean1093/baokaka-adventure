"""props.py - props, garment flats and material close-ups for the v2 sheets.
Every function returns (svg_inner, viewBox) so the sheet builder can place it.
"""
import random
from geom import *
import baokaka as H
import baokaka_body as B
import mocha as Mo

INK = "#3A2418"


def _doc_wrap(fn, vb):
    d = Doc(0, 0, vb)
    d.add(fn(d))
    return d.inner(), vb


# ------------------------------------------------------------ Baokaka
def top_flat(doc):
    return B.figure(doc, flat="top")


def pants_flat(doc):
    return B.figure(doc, flat="pants")


def blocks(doc):
    """three wooden toy blocks (his weapon: 丟積木)"""
    o = f'<ellipse cx="200" cy="262" rx="170" ry="18" fill="#5A3A28" opacity=".2" filter="{doc.blur(6)}"/>'
    def cube(x, y, s, top, front, side, glyph, rot=0):
        h = s * .5
        T = [(x, y), (x + s, y - h * .55), (x + s * 1.75, y), (x + s * .75, y + h * .55)]
        F = [(x, y), (x + s * .75, y + h * .55), (x + s * .75, y + h * .55 + s * .95), (x, y + s * .95)]
        S = [(x + s * .75, y + h * .55), (x + s * 1.75, y), (x + s * 1.75, y + s * .95), (x + s * .75, y + h * .55 + s * .95)]
        g = ""
        gw = doc.lin([(0, front[0]), (1, front[1])], 0, 0, 0, 1)
        g += P(poly(T), top) + P(poly(F), gw) + P(poly(S), side)
        # rounded-edge highlights + wood grain on top
        g += P(taper([T[0], T[1]], 2.4, .2, .2), "#fff", opacity=.6)
        g += P(taper([T[0], T[3]], 2.0, .2, .2), "#fff", opacity=.45)
        for k in range(3):
            a = (T[0][0] + (T[1][0] - T[0][0]) * (.3 + k * .2), T[0][1] + (T[1][1] - T[0][1]) * (.3 + k * .2))
            b = (a[0] + (T[3][0] - T[0][0]) * .8, a[1] + (T[3][1] - T[0][1]) * .8)
            g += P(taper([a, b], 1.2, .3, .3), "#B87A3A", opacity=.35)
        # glyph on the front face (skewed)
        cx, cy = x + s * .38, y + h * .28 + s * .5
        g += f'<g transform="translate({cx},{cy}) skewY(36) scale(.62,1)">{glyph}</g>'
        for poly_ in (T, F, S):
            g += P(outline(poly_ + [poly_[0]], 2.2, 1.2, closed=False, n=2), INK)
        return g
    o += cube(40, 150, 80, "#F7D9A0", ("#E8473B", "#C22F28"), "#A9241F",
              P(B.star(0, 0, 24, 0), "#FFF4D6"))
    o += cube(206, 166, 74, "#F7D9A0", ("#3E86D8", "#2B63B0"), "#22508F",
              f'<text x="0" y="12" font-size="40" font-weight="900" text-anchor="middle" fill="#FFF4D6" font-family="Fredoka, sans-serif">B</text>')
    o += cube(122, 60, 70, "#F7D9A0", ("#F2C14A", "#D99A2A"), "#B97C1C",
              f'<text x="0" y="12" font-size="38" font-weight="900" text-anchor="middle" fill="#8A4A12" font-family="Fredoka, sans-serif">寶</text>')
    return o


def bib(doc):
    """grey-white gingham bib (the one in his photo) - equipment, not worn on the sprite"""
    pts = [(60, 40), (100, 60), (200, 92), (300, 60), (340, 40), (356, 90), (344, 160), (300, 218), (200, 246), (100, 218),
           (56, 160), (44, 90)]
    neck = [(110, 66), (200, 100), (290, 66), (270, 120), (200, 140), (130, 120)]
    d = smooth(pts)
    o = P(d, B.gingham(doc, 0, 34))
    o += cel(doc, d, B.PANTS_SH, shift=(14, 8), opacity=.4)
    o += P(smooth(neck), "#F5F3EE") + P(outline(neck, 1.8, 1), B.PANTS_LN)
    o += P(smooth([(64, 52), (200, 104), (336, 52), (344, 90), (334, 158), (292, 210), (200, 236), (108, 210), (66, 158), (56, 90)]),
           "none", stroke="#FFFFFF", stroke_width="5", opacity=".8")
    o += P(outline(pts, 2.4, 1.4), B.PANTS_LN)
    o += f'<circle cx="74" cy="58" r="7" fill="#F2F2EE" stroke="#7A8088" stroke-width="1.6"/>'
    return o


def bracelet_big(doc):
    o = f'<ellipse cx="200" cy="200" rx="150" ry="70" fill="none" stroke="{B.RED}" stroke-width="16"/>'
    # braid texture: alternating diagonal ticks around the loop
    for k in range(64):
        a = 2 * math.pi * k / 64
        x, y = 200 + 150 * math.cos(a), 200 + 70 * math.sin(a)
        nx, ny = math.cos(a), math.sin(a) * 2.1
        L = math.hypot(nx, ny)
        nx, ny = nx / L, ny / L
        o += P(taper([(x - nx * 7 - ny * 3, y - ny * 7 + nx * 3), (x + nx * 7 + ny * 3, y + ny * 7 - nx * 3)], 2.2, .2, .2), B.RED_DK, opacity=.75)
    o += f'<ellipse cx="200" cy="196" rx="150" ry="70" fill="none" stroke="#FF8A7A" stroke-width="3" opacity=".6" stroke-dasharray="40 30"/>'
    o += f'<ellipse cx="200" cy="270" rx="26" ry="26" fill="{doc.rad([(0, "#FFF6C0"), (.5, B.GOLD), (1, "#B98516")], .35, .3, .7)}" stroke="{B.GOLD_DK}" stroke-width="2.4"/>'
    o += f'<ellipse cx="192" cy="262" rx="7" ry="5" fill="#fff" opacity=".85"/>'
    return o


def gold_lock(doc):
    # traditional longevity lock 長命百歲 on a red cord
    o = P(taper([(110, 20), (140, 80), (170, 120)], 6, 0, 0), B.RED) + P(taper([(290, 20), (260, 80), (230, 120)], 6, 0, 0), B.RED)
    pts = [(200, 120), (250, 104), (300, 112), (330, 150), (318, 200), (280, 240), (200, 270), (120, 240), (82, 200), (70, 150),
           (100, 112), (150, 104)]
    d = smooth(pts)
    g = doc.lin([(0, "#FFF2B0"), (.3, "#F4CD55"), (.7, "#D9A12B"), (1, "#A8761A")], 0, 0, .3, 1)
    o += P(d, g)
    o += cel(doc, d, "#B8841C", shift=(12, 10), opacity=.7)
    inner = [(200, 140), (240, 132), (280, 142), (294, 170), (280, 204), (244, 226), (200, 240), (156, 226), (120, 204),
             (106, 170), (120, 142), (160, 132)]
    o += P(outline(inner, 2.2, 1.2), "#A8761A", opacity=.8)
    o += f'<text x="200" y="182" font-size="34" font-weight="900" text-anchor="middle" fill="#9C6A12" font-family="Noto Serif TC, serif">長命</text>'
    o += f'<text x="200" y="222" font-size="34" font-weight="900" text-anchor="middle" fill="#9C6A12" font-family="Noto Serif TC, serif">百歲</text>'
    o += P(strand([(120, 130), (160, 116), (210, 114)], 10, bulge=.2), "#fff", opacity=.7)
    o += P(outline(pts, 2.6, 1.4), "#7A5410")
    return o


def stamp_book(doc):
    o = f'<ellipse cx="200" cy="300" rx="130" ry="14" fill="#5A3A28" opacity=".2" filter="{doc.blur(5)}"/>'
    back = [(96, 70), (300, 50), (318, 270), (114, 296)]
    o += P(poly(translate(back, 10, 6)), "#7E1F1A")
    pages = [(100, 72), (304, 52), (314, 272), (110, 294)]
    o += P(poly(translate(pages, 6, 4)), "#F7EFDD") + P(outline(translate(pages, 6, 4) + [translate(pages, 6, 4)[0]], 1.6, 1, closed=False, n=2), "#A08060")
    g = doc.lin([(0, "#E5443A"), (1, "#B32821")], 0, 0, 1, 1)
    o += P(poly(back), g)
    o += P(poly(back), "#8E1D19", opacity=.5, mask=doc.mask(f'<path d="{poly(back)}" fill="#fff"/><path d="{poly(back)}" fill="#000" transform="translate(-14,-10)"/>'))
    o += P(poly([(118, 92), (282, 74), (296, 248), (132, 268)]), "none", stroke="#F2C14A", stroke_width="3")
    o += f'<g transform="rotate(-5 205 170)"><text x="205" y="138" font-size="34" font-weight="900" text-anchor="middle" fill="#F7D46A" font-family="Noto Serif TC, serif">集章本</text>'
    o += f'<circle cx="205" cy="196" r="34" fill="none" stroke="#F7D46A" stroke-width="3"/><text x="205" y="208" font-size="26" font-weight="900" text-anchor="middle" fill="#F7D46A" font-family="Noto Serif TC, serif">台北</text></g>'
    o += P(outline(back + [back[0]], 2.6, 1.3, closed=False, n=2), "#5A1410")
    return o


def ticket(doc):
    o = ""
    card = [(40, 80), (360, 80), (360, 260), (40, 260)]
    g = doc.lin([(0, "#2A3B86"), (1, "#141B44")], 0, 0, 0, 1)
    o += f'<rect x="40" y="80" width="320" height="180" rx="18" fill="{g}"/>'
    o += f'<rect x="40" y="226" width="320" height="34" fill="#0E1230"/>'
    o += f'<circle cx="296" cy="146" r="40" fill="#FFE9A0"/><circle cx="314" cy="134" r="38" fill="{g}"/>'
    for x, y, r in [(90, 120, 8), (140, 104, 5), (210, 130, 6), (250, 100, 4)]:
        o += P(B.star(x, y, r, 0), "#FFE9A0")
    o += f'<text x="70" y="200" font-size="40" font-weight="900" fill="#FFE9A0" font-family="Noto Serif TC, serif">月亮票</text>'
    o += f'<text x="236" y="198" font-size="14" font-weight="700" fill="#FFE9A0" font-family="Fredoka, sans-serif">MOON LINE</text>'
    o += f'<rect x="40" y="80" width="320" height="180" rx="18" fill="none" stroke="#0A0D24" stroke-width="3"/>'
    o += f'<path d="M58 92 L300 92" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>'
    return o


# ------------------------------------------------------------ swatches
def sw_fleece(doc):
    """mustard cotton jersey with the embroidered moon"""
    W, Hh = 300, 220
    o = f'<rect width="{W}" height="{Hh}" fill="{B.TOP}"/>'
    for y in range(4, Hh, 9):          # jersey knit: rows of tiny Vs
        for x in range(0, W, 8):
            o += P(taper([(x, y), (x + 4, y + 6), (x + 8, y)], 1.1, .2, .2), B.TOP_SH, opacity=.45)
    o += P(smooth([(-10, 150), (80, 120), (180, 150), (310, 120), (310, 200), (180, 220), (80, 190), (-10, 220)]), B.TOP_SH, opacity=.6, filter=doc.blur(10))
    o += P(smooth([(0, 20), (120, 0), (300, 30), (300, 70), (120, 50), (0, 70)]), B.TOP_HL, opacity=.7, filter=doc.blur(12))
    o += f'<g transform="translate(-112,-440) scale(1.9)">{B.motif(doc, 140, 280, 1)}</g>'
    return o


def sw_rib(doc):
    W, Hh = 300, 220
    o = f'<rect width="{W}" height="{Hh}" fill="{B.CREAM}"/>'
    for x in range(0, W, 14):
        o += f'<rect x="{x}" y="0" width="7" height="{Hh}" fill="{B.CREAM_SH}" opacity=".75"/>'
        o += f'<rect x="{x+8}" y="0" width="3" height="{Hh}" fill="#fff" opacity=".8"/>'
    o += f'<rect width="{W}" height="{Hh}" fill="{doc.lin([(0, "#fff", .4), (.5, "#fff", 0), (1, "#B89A70", .35)], 0, 0, 0, 1)}"/>'
    o += P(smooth([(-10, 150), (150, 120), (310, 150), (310, 230), (-10, 230)]), B.CREAM_SH, opacity=.6, filter=doc.blur(8))
    return o


def sw_felt(doc):
    """grey-white gingham (pants)"""
    W, Hh = 300, 220
    o = f'<rect width="{W}" height="{Hh}" fill="{B.gingham(doc, 0, 44)}"/>'
    o += P(smooth([(-10, 120), (100, 96), (200, 130), (310, 104), (310, 170), (200, 196), (100, 160), (-10, 190)]), B.PANTS_SH, opacity=.35, filter=doc.blur(10))
    o += P(taper([(-10, 118), (100, 98), (200, 128), (310, 106)], 2, 0, 0), B.PANTS_LN, opacity=.3)
    return o


def sw_cord(doc):
    W, Hh = 300, 220
    o = f'<rect width="{W}" height="{Hh}" fill="#F6E8D2"/>'
    for row in range(3):
        y0 = 40 + row * 70
        o += f'<rect x="-10" y="{y0-18}" width="{W+20}" height="36" rx="18" fill="{B.RED}"/>'
        for k in range(-2, 24):
            x = k * 14
            o += P(strand([(x, y0 - 16), (x + 9, y0), (x + 16, y0 + 16)], 9, bulge=.3, tip=.4), B.RED_DK, opacity=.6)
            o += P(taper([(x + 2, y0 - 12), (x + 8, y0 - 2)], 2.2, .3, .3), "#FF9A8A", opacity=.8)
        o += f'<rect x="-10" y="{y0+8}" width="{W+20}" height="10" fill="#6A1410" opacity=".35" filter="{doc.blur(3)}"/>'
    return o


# ------------------------------------------------------------ Mocha
def bandana_flat(doc):
    """slim MRT-blue collar laid flat, with buckle and the fish-tag ring"""
    o = f'<rect x="30" y="110" width="340" height="34" rx="17" fill="{Mo.BLUE}"/>'
    o += f'<rect x="30" y="128" width="340" height="16" rx="8" fill="{Mo.BLUE_SH}" opacity=".6"/>'
    o += "".join(f'<circle cx="{x}" cy="124" r="4" fill="#fff"/>' for x in range(70, 330, 30))
    o += f'<rect x="300" y="104" width="34" height="46" rx="6" fill="none" stroke="#C9CED6" stroke-width="5"/>'
    o += f'<rect x="30" y="110" width="340" height="34" rx="17" fill="none" stroke="{Mo.BLUE_LN}" stroke-width="2.4"/>'
    o += f'<circle cx="200" cy="158" r="8" fill="none" stroke="{Mo.GOLD_DK}" stroke-width="3.4"/>'
    return o


def fish_tag(doc):
    o = f'<circle cx="200" cy="40" r="12" fill="none" stroke="{Mo.GOLD_DK}" stroke-width="5"/>'
    tag = ellipse_pts(200, 140, 90, 90, 18)
    d = smooth(tag)
    g = doc.rad([(0, "#FFF4B8"), (.45, Mo.GOLD), (1, "#B98516")], .35, .3, .75)
    o += P(d, g) + cel(doc, d, "#C08C1E", shift=(14, 12), opacity=.7)
    o += P(outline(ellipse_pts(200, 140, 72, 72, 18), 2, 1), "#B98516", opacity=.8)
    fish = [(140, 140), (170, 116), (214, 112), (246, 128), (270, 112), (266, 140), (270, 168), (246, 152), (214, 168), (170, 164)]
    o += P(smooth(fish), "#C9921E") + P(outline(fish, 2.2, 1.2), "#7A5410")
    o += f'<circle cx="168" cy="134" r="5" fill="#7A5410"/>'
    o += P(taper([(196, 124), (206, 140), (198, 156)], 2, .2, .2), "#7A5410")
    o += P(strand([(140, 90), (170, 70), (210, 64)], 14, bulge=.2), "#fff", opacity=.7)
    o += P(outline(tag, 2.6, 1.4), "#7A5410")
    return o


def fish_snack(doc):
    body = [(40, 150), (90, 112), (170, 100), (250, 112), (300, 140), (350, 100), (360, 150), (350, 200), (300, 160), (250, 190), (170, 200), (90, 188)]
    d = smooth(body)
    g = doc.lin([(0, "#E9C79A"), (.5, "#C99A62"), (1, "#8E6236")], 0, 0, 0, 1)
    o = P(d, g)
    inner = ""
    for x in range(110, 300, 22):
        inner += P(taper([(x, 110), (x + 10, 150), (x, 190)], 2, .3, .3), "#7A5230", opacity=.5)
    inner += P(smooth([(60, 140), (170, 112), (290, 130), (170, 128)]), "#FFF4DC", opacity=.7)
    o += clipped(doc, d, inner)
    o += f'<circle cx="80" cy="146" r="8" fill="#3A2418"/><circle cx="78" cy="144" r="2.5" fill="#fff"/>'
    o += P(outline(body, 2.4, 1.4), "#5A3A20")
    return o


def catnip(doc):
    o = P(taper([(200, 290), (196, 200), (204, 100), (200, 30)], 6, 0, .2), "#4F8A3A")
    for k, (y, sd) in enumerate([(240, -1), (210, 1), (170, -1), (140, 1), (100, -1), (70, 1), (44, -1)]):
        sz = 1 - k * .08
        leaf = [(200, y), (200 + sd * 40 * sz, y - 30 * sz), (200 + sd * 86 * sz, y - 24 * sz), (200 + sd * 60 * sz, y + 4)]
        d = smooth(leaf)
        g = doc.lin([(0, "#8CCB64"), (1, "#3F7A2E")], 0, 0, 1, 1)
        o += P(d, g) + P(taper([(200, y), (200 + sd * 70 * sz, y - 20 * sz)], 1.6, .1, .5), "#2E5A22", opacity=.6)
        o += P(outline(leaf, 1.8, 1.2), "#2E5A22")
    return o


def bowl(doc):
    o = f'<ellipse cx="200" cy="230" rx="150" ry="22" fill="#5A3A28" opacity=".2" filter="{doc.blur(6)}"/>'
    body = [(60, 120), (340, 120), (310, 220), (90, 220)]
    g = doc.lin([(0, "#F7F2E8"), (1, "#C9BFAE")], 0, 0, 1, 0)
    o += P(smooth([(60, 120), (200, 140), (340, 120), (318, 200), (200, 228), (82, 200)]), g)
    o += P(smooth([(64, 148), (200, 170), (336, 148), (330, 170), (200, 192), (70, 170)]), Mo.BLUE)
    for x in range(90, 320, 34):
        o += f'<circle cx="{x}" cy="{168 + (abs(x-200)*-.05)}" r="4" fill="#fff"/>'
    o += f'<ellipse cx="200" cy="120" rx="140" ry="28" fill="#E8DFCF" stroke="{INK}" stroke-width="2.2"/>'
    o += f'<ellipse cx="200" cy="124" rx="118" ry="20" fill="#8E5A30"/>'
    rnd = random.Random(3)
    for _ in range(40):
        x, y = rnd.uniform(100, 300), rnd.uniform(112, 136)
        o += f'<ellipse cx="{x}" cy="{y}" rx="9" ry="6" fill="{rnd.choice(["#A86A3A", "#C98A50", "#7A4A24"])}" stroke="#5A3418" stroke-width="1"/>'
    o += P(outline([(60, 120), (82, 200), (200, 228), (318, 200), (340, 120)], 2.4, 1.3, closed=False), INK)
    return o


def sw_mfur(doc):
    """forehead M close-up"""
    W, Hh = 300, 220
    o = f'<rect width="{W}" height="{Hh}" fill="{Mo.FUR}"/>'
    o += fur_tex(doc, W, Hh, 11)
    for pts_, w in [([(80, 200), (96, 110), (120, 50)], 26), ([(120, 54), (136, 100), (150, 150)], 20),
                    ([(220, 200), (204, 110), (180, 50)], 26), ([(180, 54), (164, 100), (150, 150)], 20),
                    ([(150, 110), (150, 50), (150, -10)], 26), ([(118, 40), (116, 10), (116, -10)], 20), ([(182, 40), (184, 10), (184, -10)], 20)]:
        o += P(strand(pts_, w, bulge=.2), Mo.STRIPE, opacity=.9)
    return o


def fur_tex(doc, W, Hh, seed, col=None, n=160, ang=-1.45):
    rnd = random.Random(seed)
    o = ""
    for _ in range(n):
        x, y = rnd.uniform(-10, W + 10), rnd.uniform(-10, Hh + 10)
        L = rnd.uniform(10, 22)
        a = ang + rnd.uniform(-.25, .25)
        c = col or rnd.choice([Mo.FUR_HL, Mo.FUR_SH, "#B27E52"])
        o += P(taper([(x, y), (x + math.cos(a) * L, y + math.sin(a) * L)], 2.4, .2, .9), c, opacity=.55)
    return o


def sw_stripes(doc):
    W, Hh = 300, 220
    o = f'<rect width="{W}" height="{Hh}" fill="{Mo.FUR}"/>'
    o += fur_tex(doc, W, Hh, 12)
    for k in range(6):
        x = 20 + k * 52
        o += P(strand([(x + 10, Hh + 10), (x + 4, Hh / 2), (x, -10)], 22, bulge=.3, tip=.3), Mo.STRIPE, opacity=.85)
    o += f'<rect y="150" width="{W}" height="80" fill="#AE9B84"/>'
    for y in (168, 200):
        o += P(strand([(-10, y - 6), (150, y + 10), (310, y - 6)], 14, bulge=.2, tip=.2), Mo.STRIPE, opacity=.9)
    return o


def sw_tail(doc):
    W, Hh = 300, 220
    o = f'<rect width="{W}" height="{Hh}" fill="#F3E4CC"/>'
    C = [(-20, 140), (100, 100), (200, 110), (320, 70)]
    loop = limb(C, [90, 86, 80, 76], 14)
    d = poly(loop)
    o += P(d, Mo.FUR)
    D = dense(C, False, 14)
    N = normals(D)
    inner = ""
    for k in range(4, len(D), 9):
        p, n = D[k], N[k]
        inner += P(strand([(p[0] - n[0] * 48, p[1] - n[1] * 48), (p[0] + n[0] * 48, p[1] + n[1] * 48)], 16, bulge=.3, tip=.5), Mo.STRIPE, opacity=.9)
    inner += P(d, Mo.FUR_SH, opacity=.7, mask=doc.mask(f'<path d="{d}" fill="#fff"/><path d="{d}" fill="#000" transform="translate(-4,-16)"/>'))
    o += clipped(doc, d, inner) + P(outline(loop, 2.6, 1.4, n=2), Mo.FUR_LN)
    return o


def sw_beans(doc):
    """grey tabby paw: banded fur, dark brown-black pads"""
    W, Hh = 300, 220
    o = f'<rect width="{W}" height="{Hh}" fill="{Mo.FUR}"/>'
    o += fur_tex(doc, W, Hh, 14, n=120)
    for y in (24, 52):
        o += P(strand([(-10, y), (150, y + 8), (310, y)], 12, bulge=.2, tip=.3), Mo.STRIPE, opacity=.85)
    g = doc.rad([(0, "#5A4640"), (1, "#2A201C")], .4, .35, .7)
    main = [(150, 120), (196, 138), (204, 176), (170, 200), (130, 200), (96, 176), (104, 138)]
    o += P(smooth(main), g) + P(outline(main, 2, 1.2), "#140E0C")
    for cx, cy in [(92, 104), (130, 80), (172, 80), (210, 104)]:
        t = ellipse_pts(cx, cy, 19, 22, 10)
        o += P(smooth(t), g) + P(outline(t, 2, 1.2), "#140E0C")
        o += f'<ellipse cx="{cx-5}" cy="{cy-8}" rx="5" ry="3.5" fill="#fff" opacity=".35"/>'
    o += f'<ellipse cx="138" cy="148" rx="14" ry="7" fill="#fff" opacity=".25"/>'
    return o
