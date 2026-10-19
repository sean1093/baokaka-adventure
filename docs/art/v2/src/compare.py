"""compare.py - side-by-side of the owner's reference sheets, the old (v1 /
option D) sheets and the v2 sheets, plus same-scale detail crops of faces,
hair, eyes and fabric.  usage: python3 compare.py <out.png>
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
V2 = os.path.dirname(HERE)
ROOT = os.path.abspath(os.path.join(V2, "..", "..", ".."))
REF_DIR = os.environ.get("REF_DIR", "/tmp/claude-0/-home-user-baokaka-adventure/9cc42ba2-43c5-5cc1-b2da-d64373ca9aef/images")
OLD = os.path.join(ROOT, "docs", "art", "options", "d-anime")
FONT = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
BG = (244, 234, 214)
INK = (58, 36, 24)


def font(n):
    try:
        return ImageFont.truetype(FONT, n)
    except OSError:
        return ImageFont.load_default()


def fit_h(im, h):
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def fit_box(im, w, h):
    s = min(w / im.width, h / im.height)
    return im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)


def tile(canvas, im, x, y, label, sub=""):
    canvas.paste(im.convert("RGB"), (x, y))
    d = ImageDraw.Draw(canvas)
    d.rectangle([x - 2, y - 2, x + im.width + 1, y + im.height + 1], outline=INK, width=2)
    d.text((x, y + im.height + 10), label, fill=INK, font=font(26))
    if sub:
        d.text((x, y + im.height + 42), sub, fill=(122, 90, 62), font=font(20))


def main(out):
    refs = []
    for i in (1, 3, 2):
        p = os.path.join(REF_DIR, f"{i}.png")
        if os.path.exists(p):
            refs.append(Image.open(p).convert("RGB"))
    old_b = Image.open(os.path.join(OLD, "sheet-baokaka.png")).convert("RGB")
    new_b = Image.open(os.path.join(V2, "sheet-baokaka.png")).convert("RGB")
    new_m = Image.open(os.path.join(V2, "sheet-mocha.png")).convert("RGB")
    W = 3000
    H = 4200
    c = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(c)
    d.text((40, 30), "v2 角色畫風 vs 參考設定稿", fill=INK, font=font(56))
    d.text((40, 104), "上排：同高並排整張設定稿　下排：放大到同一臉寬的細節（臉、眼、頭髮、布料）", fill=(122, 90, 62), font=font(28))
    # ---- row 1: references, row 1b: old + v2 sheets, all at the same height
    y, h = 170, 820
    x = 40
    for i, r in enumerate(refs):
        im = fit_h(r, h)
        tile(c, im, x, y, f"參考 {['A', 'B', 'C'][i]}", "owner reference")
        x += im.width + 40
    proofim = Image.open(os.path.join(V2, "style-proof.png")).convert("RGB")
    tile(c, fit_h(proofim, h), x + 40, y, "v2 遊戲內樣貌（style-proof）", "手機尺寸夜景")
    y = y + h + 110
    x = 40
    for im, lab, sub in [(old_b, "舊版 (option D)", "粗線、扁平、Q 版"), (new_b, "v2 寶咖咖", "本次"), (new_m, "v2 摩卡貓", "本次")]:
        im = fit_h(im, h)
        tile(c, im, x, y, lab, sub)
        x += im.width + 40
    # ---- row 2: detail crops, scaled to the same face width (~ 360 px)
    y2 = y + h + 110
    d.text((40, y2), "細節（同臉寬）", fill=INK, font=font(36))
    y2 += 60
    crops = []
    if refs:
        r1 = refs[0]
        crops.append((r1.crop((300, 0, 479, 120)), "參考A 表情頭", "細線＋多層虹膜＋髮束高光"))
        crops.append((r1.crop((200, 40, 290, 160)), "參考A 正面臉", ""))
    if len(refs) > 1:
        r3 = refs[1]
        crops.append((r3.crop((290, 30, 479, 220)), "參考B 表情頭", ""))
    sb = new_b.width / 1000
    crops.append((new_b.crop((int(380 * sb), int(110 * sb), int(640 * sb), int(330 * sb))), "v2 寶咖咖 正面頭", ""))
    crops.append((new_b.crop((int(650 * sb), int(165 * sb), int(980 * sb), int(345 * sb))), "v2 表情頭（轉頭＋側傾）", ""))
    crops.append((new_m.crop((int(370 * sb), int(150 * sb), int(640 * sb), int(400 * sb))), "v2 摩卡貓 頭部", ""))
    so = old_b.width / 1000
    crops.append((old_b.crop((int(420 * so), int(110 * so), int(600 * so), int(250 * so))), "舊版 頭部", ""))
    x = 40
    for im, lab, sub in crops:
        im = fit_box(im, 520, 400) if im.width < 520 else fit_box(im, 520, 400)
        if x + im.width > W - 40:
            x = 40
            y2 += 500
        tile(c, im, x, y2, lab, sub)
        x += im.width + 40
    # ---- row 3: fabric / line close-ups
    y3 = y2 + 520
    x = 40
    fab = []
    if refs:
        fab.append((refs[0].crop((180, 250, 300, 380)), "參考A 布料（裙褶、雙色陰影）"))
        fab.append((refs[1].crop((180, 210, 300, 330)) if len(refs) > 1 else refs[0], "參考B 布料"))
    fab.append((new_b.crop((int(400 * sb), int(380 * sb), int(600 * sb), int(640 * sb))), "v2 睡衣（皺褶、賽璐璐影、印花）"))
    fab.append((new_m.crop((int(340 * sb), int(560 * sb), int(660 * sb), int(830 * sb))), "v2 摩卡貓 毛色與條紋"))
    fab.append((old_b.crop((int(400 * so), int(280 * so), int(600 * so), int(480 * so))), "舊版 睡衣"))
    for im, lab in fab:
        im = fit_box(im, 520, 380)
        tile(c, im, x, y3, lab)
        x += im.width + 40
    c = c.crop((0, 0, W, min(H, y3 + 470)))
    c.save(out)
    print("wrote", out)


if __name__ == "__main__":
    main(sys.argv[1])
