"""bake_poses.py - bake every gameplay pose frame, write the manifest, the
pose sheets, the cycle contact sheet, GIF previews and a loop check.

    python3 docs/art/v2/tools/bake_poses.py

Outputs (docs/art/v2/):
  baked/poses/<char>-<pose>-<i>@2x.webp, @3x.webp
  baked/poses.json             manifest (frames, size, anchor/foot point, fps)
  poses-baokaka.png, poses-mocha.png   labelled pose sheets
  poses-cycles.png             contact sheet of the cycles + loop check
  preview-*.gif                animated previews of the cycles

Only poses whose drawing changed are re-rendered (#141): Chromium's blurs are
not bit-exact from run to run, so re-rendering an unchanged pose would churn
its files.  `baked/poses-src.json` keeps a hash of each pose's SVG (ids
normalised) and box; a pose with the same hash, a manifest entry and its
files keeps them.  `--force` re-renders everything; `--adopt` only records
the hashes of the current drawing for the files already baked (no render).
"""
import hashlib, io, json, os, re, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
V2 = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(V2, "src"))
import bk_poses, mo_poses

RENDER = os.path.join(HERE, "render.mjs")
OUT = os.path.join(V2, "baked", "poses")
FONT = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
# points per art unit (390-pt-wide phone; Baokaka crawling ~ 70 pt tall)
CHARS = {
    "baokaka": dict(mod=bk_poses, pt=0.092, fps={"crawl": 8, "walk": 7}),
    "mocha": dict(mod=mo_poses, pt=0.074, fps={"walk": 9}),
}
DEFAULT_FPS = 4
PAD = 6
SRC_HASH = os.path.join(V2, "baked", "poses-src.json")
FORCE = "--force" in sys.argv


def svg_key(svgs, *extra):
    """hash of a pose's frames with the global gradient/mask/filter ids
    renumbered in order of appearance, so it only changes with the drawing"""
    h = hashlib.sha1(repr(extra).encode())
    for svg in svgs:
        names = {}
        for m in re.finditer(r'id="([^"]+)"', svg):
            names.setdefault(m.group(1), f"_{len(names)}")
        h.update(re.sub(r"[A-Za-z]+\d+", lambda m: names.get(m.group(), m.group()), svg).encode())
    return h.hexdigest()[:16]


def font(n):
    return ImageFont.truetype(FONT, n)


def render_svg(svg, w, h, tmp, name):
    p = os.path.join(tmp, name + ".svg")
    open(p, "w").write(svg)
    out = os.path.join(tmp, name + ".png")
    subprocess.run(["node", RENDER, p, out, str(w), str(h), "1"], check=True, capture_output=True)
    return Image.open(out).convert("RGBA")


def bake_char(cname, cfg, tmp, prev_man, prev_src, src):
    mod = cfg["mod"]
    vb = mod.VB
    s3 = cfg["pt"] * 3                      # px per unit @3x
    W3, H3 = round(vb[2] * s3), round(vb[3] * s3)
    jobs = []
    svgs = {}
    man = {}
    for pose, (_, n, label, keys) in mod.POSES.items():
        svgs.update({(pose, i): mod.frame_svg(pose, i) for i in range(n)})
        key = f"{cname}-{pose}"
        src[key] = svg_key([svgs[(pose, i)] for i in range(n)], vb, cfg["pt"], PAD, label, keys, cfg["fps"].get(pose, DEFAULT_FPS))
        old = prev_man.get(pose)
        if not FORCE and old and prev_src.get(key) == src[key] and all(
                os.path.exists(os.path.join(OUT, f.replace("@{2x,3x}.webp", "") + x)) for f in old["files"] for x in ("@2x.webp", "@3x.webp")):
            man[pose] = dict(old)          # unchanged drawing: keep the delivered files
            man[pose]["_imgs"] = [Image.open(os.path.join(OUT, f.replace("@{2x,3x}.webp", "@3x.webp"))).convert("RGBA") for f in old["files"]]
            man[pose]["_new"] = False
            continue
        for i in range(n):
            jobs.append((pose, i))
    print(cname, "re-rendering", sorted({p for p, _ in jobs}) or "nothing")

    def work(job):
        pose, i = job
        return job, render_svg(svgs[job], W3, H3, tmp, f"{cname}-{pose}-{i}")
    with ThreadPoolExecutor(4) as ex:
        imgs = dict(ex.map(work, jobs))
    ax3 = (-vb[0]) * s3                     # anchor (0,0) in canvas px @3x
    ay3 = (-vb[1]) * s3
    for pose, (_, n, label, keys) in mod.POSES.items():
        if pose in man:
            continue
        frames = [imgs[(pose, i)] for i in range(n)]
        bb = None
        for im in frames:
            b = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
            bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
        x0, y0 = max(0, bb[0] - PAD), max(0, bb[1] - PAD)
        x1, y1 = min(W3, bb[2] + PAD), min(H3, bb[3] + PAD)
        # keep @3x dims divisible by 3 so @2x is exact
        x1 = x0 + ((x1 - x0 + 2) // 3) * 3
        y1 = y0 + ((y1 - y0 + 2) // 3) * 3
        files = []
        for i, im in enumerate(frames):
            c3 = Image.new("RGBA", (x1 - x0, y1 - y0))
            c3.alpha_composite(im.crop((x0, y0, min(x1, W3), min(y1, H3))))
            c2 = c3.resize(((x1 - x0) * 2 // 3, (y1 - y0) * 2 // 3), Image.LANCZOS)
            base = f"{cname}-{pose}-{i}"
            c3.save(os.path.join(OUT, base + "@3x.webp"), "WEBP", quality=88, method=6)
            c2.save(os.path.join(OUT, base + "@2x.webp"), "WEBP", quality=88, method=6)
            files.append(base)
            frames[i] = c3
        w_pt, h_pt = (x1 - x0) / 3, (y1 - y0) / 3
        man[pose] = dict(label=label, frames=n, keyframes=keys, loop=pose in cfg["fps"],
                         fps=cfg["fps"].get(pose, DEFAULT_FPS),
                         size_pt=[round(w_pt, 2), round(h_pt, 2)],
                         anchor_pt=[round((ax3 - x0) / 3, 2), round((ay3 - y0) / 3, 2)],
                         files=[f + "@{2x,3x}.webp" for f in files],
                         bytes_3x=sum(os.path.getsize(os.path.join(OUT, f + "@3x.webp")) for f in files))
        man[pose]["_imgs"] = frames
        man[pose]["_new"] = True
    # keep the table's order
    return {pose: man[pose] for pose in mod.POSES}


def loop_check(frames):
    """mean abs alpha+rgb difference between consecutive frames, and for the
    wrap (last -> first); a smooth loop has wrap ~ the consecutive mean"""
    arr = [np.asarray(f.convert("RGBA")).astype(np.float32) for f in frames]
    diffs = [np.abs(arr[(i + 1) % len(arr)] - arr[i]).mean() for i in range(len(arr))]
    return diffs[:-1], diffs[-1]


def parchment(w, h):
    rng = np.random.default_rng(3)
    y, x = np.mgrid[0:h, 0:w]
    r = np.sqrt(((x - w * .45) / w) ** 2 + ((y - h * .4) / h) ** 2)
    base = np.array([251, 244, 228]) * (1 - r[..., None] * .35) + np.array([231, 212, 178]) * (r[..., None] * .35)
    base += rng.normal(0, 3.5, (h, w, 1))
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert("RGBA")


def pose_sheet(cname, title, sub, man, out, cols=6):
    tile_w = 330
    order = list(man.keys())
    rows_spec = []
    for pose in order:
        rows_spec.append(pose)
    # each pose gets a box wide enough for its frames
    boxes = []
    for pose in order:
        m = man[pose]
        n = m["frames"]
        show = m["keyframes"] or list(range(n))
        boxes.append((pose, show))
    # layout with flowing rows
    W = 2400
    x, y = 60, 230
    rowh = 0
    placed = []
    for pose, show in boxes:
        imgs = man[pose]["_imgs"]
        sc = min(1.0, 300 / max(im.height for im in imgs))
        m_ = man[pose]
        lab_ = m_["label"] + ("（00 格循環）" if m_["frames"] > 1 else "")
        lw_ = ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(lab_, font=font(30)) + ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(pose, font=font(20)) + 56
        bw = max(sum(int(imgs[i].width * sc) + 16 for i in show) + 30, int(lw_))
        bh = int(max(imgs[i].height for i in show) * sc) + 80
        if x + bw > W - 40:
            x = 60
            y += rowh + 30
            rowh = 0
        placed.append((pose, show, x, y, sc, bw, bh))
        x += bw + 24
        rowh = max(rowh, bh)
    H = y + rowh + 120
    c = parchment(W, H)
    d = ImageDraw.Draw(c)
    d.text((60, 40), title, fill=(58, 36, 24), font=font(84))
    d.text((64, 150), sub, fill=(110, 80, 56), font=font(30))
    for pose, show, x, y, sc, bw, bh in placed:
        m = man[pose]
        imgs = m["_imgs"]
        d.rounded_rectangle([x, y, x + bw, y + bh], 14, outline=(58, 36, 24), width=3, fill=(255, 251, 240, 120))
        gy = y + bh - 64        # ground line inside the box
        cx = x + 20
        for i in show:
            im = imgs[i]
            w2, h2 = int(im.width * sc), int(im.height * sc)
            im2 = im.resize((w2, h2), Image.LANCZOS)
            ay = m["anchor_pt"][1] * 3 * sc
            c.alpha_composite(im2, (cx, int(gy - ay)))
            if len(show) > 1:
                d.text((cx + 4, y + 8), str(i + 1), fill=(140, 110, 80), font=font(22))
            cx += w2 + 16
        d.line([(x + 12, gy), (x + bw - 12, gy)], fill=(190, 160, 120), width=2)
        lab = m["label"] + (f"（{m['frames']} 格" + ("循環" if m["loop"] else "") + "）" if m["frames"] > 1 else "")
        d.text((x + 16, gy + 12), lab, fill=(58, 36, 24), font=font(30))
        d.text((x + bw - 16 - d.textlength(pose, font=font(20)), gy + 20), pose, fill=(140, 110, 80), font=font(20))
    c.convert("RGB").save(out, optimize=True)
    print("wrote", out)


def cycles_sheet(allman, out):
    cyc = [("baokaka", "crawl"), ("baokaka", "walk"), ("mocha", "walk")]
    W = 2600
    rows = []
    for cn, pose in cyc:
        m = allman[cn][pose]
        rows.append((cn, pose, m))
    H = 160 + len(rows) * 420
    c = parchment(W, H)
    d = ImageDraw.Draw(c)
    d.text((50, 30), "循環動畫檢查  Cycle contact sheet + loop check", fill=(58, 36, 24), font=font(54))
    d.text((52, 100), "每列：第 1–8 格，接著再一次第 1 格（綠框）＝循環接縫；最右：最後一格與第一格疊影。數值：相鄰格平均差 vs 接縫差。", fill=(110, 80, 56), font=font(24))
    report = {}
    for r, (cn, pose, m) in enumerate(rows):
        imgs = m["_imgs"]
        y = 160 + r * 420
        sc = min(1.0, 300 / imgs[0].height)
        x = 40
        for i, im in enumerate(imgs + [imgs[0]]):
            im2 = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
            c.alpha_composite(im2, (x, y + 20))
            if i == len(imgs):
                d.rectangle([x - 4, y + 16, x + im2.width + 4, y + 24 + im2.height], outline=(60, 150, 70), width=4)
            d.text((x + 4, y + 26 + im2.height), str(i % len(imgs) + 1), fill=(120, 90, 60), font=font(20))
            x += im2.width + 8
        # onion skin last + first
        a = imgs[-1].copy()
        a.putalpha(a.getchannel("A").point(lambda v: v * .45))
        b = imgs[0].copy()
        on = Image.new("RGBA", b.size)
        on.alpha_composite(b)
        on.alpha_composite(a)
        on2 = on.resize((int(on.width * sc), int(on.height * sc)), Image.LANCZOS)
        c.alpha_composite(on2, (W - on2.width - 60, y + 20))
        cons, wrap = loop_check(imgs)
        mean = float(np.mean(cons))
        ok = wrap <= max(cons) * 1.05
        report[f"{cn}-{pose}"] = dict(consecutive_mean=round(mean, 2), consecutive_max=round(float(max(cons)), 2), wrap=round(float(wrap), 2), smooth=bool(ok))
        d.text((40, y + 360), f"{cn} · {pose} · {m['frames']} 格 @ {m['fps']} fps　相鄰差 平均 {mean:.2f} / 最大 {max(cons):.2f}　接縫差 {wrap:.2f}　→ {'循環順暢（OK）' if ok else '接縫跳動（NG）'}",
               fill=(58, 36, 24), font=font(26))
    c.convert("RGB").save(out, optimize=True)
    print("wrote", out)
    return report


def gif(frames, fps, out, bg=(26, 30, 74)):
    sc = 1.0
    g = []
    w = max(f.width for f in frames)
    h = max(f.height for f in frames)
    for f in frames:
        c = Image.new("RGBA", (w, h), bg + (255,))
        c.alpha_composite(f, (0, 0))
        g.append(c.convert("RGB").convert("P", palette=Image.ADAPTIVE, colors=128))
    g[0].save(out, save_all=True, append_images=g[1:], duration=int(1000 / fps), loop=0, disposal=2)
    print("wrote", out)


def adopt():
    src = {}
    for cn, cfg in CHARS.items():
        mod = cfg["mod"]
        for pose, (_, n, label, keys) in mod.POSES.items():
            src[f"{cn}-{pose}"] = svg_key([mod.frame_svg(pose, i) for i in range(n)], mod.VB, cfg["pt"], PAD, label, keys, cfg["fps"].get(pose, DEFAULT_FPS))
    json.dump(src, open(SRC_HASH, "w"), indent=1)
    print("wrote", SRC_HASH)


def main():
    if "--adopt" in sys.argv:
        return adopt()
    os.makedirs(OUT, exist_ok=True)
    prev_path = os.path.join(V2, "baked", "poses.json")
    prev = json.load(open(prev_path)) if os.path.exists(prev_path) else {}
    prev_src = json.load(open(SRC_HASH)) if os.path.exists(SRC_HASH) else {}
    src = {}
    allman = {}
    with tempfile.TemporaryDirectory() as tmp:
        for cn, cfg in CHARS.items():
            allman[cn] = bake_char(cn, cfg, tmp, prev.get("characters", {}).get(cn, {}), prev_src, src)
    pose_sheet("baokaka", "寶咖咖　動作表", "《翻翻台北》遊戲動作｜3/4 側面朝右（遊戲左右翻轉）｜每格都是烘焙好的 WebP，錨點＝腳底接地點",
               allman["baokaka"], os.path.join(V2, "poses-baokaka.png"))
    pose_sheet("mocha", "摩卡貓　動作表", "《翻翻台北》遊戲動作｜3/4 側面朝右｜貓的側對角步態（左後→左前→右後→右前）",
               allman["mocha"], os.path.join(V2, "poses-mocha.png"))
    cycles = [("baokaka", "crawl"), ("baokaka", "walk"), ("mocha", "walk")]
    old_report = prev.get("loop_check", {})
    if any(allman[cn][pose]["_new"] for cn, pose in cycles) or any(f"{cn}-{pose}" not in old_report for cn, pose in cycles):
        report = cycles_sheet(allman, os.path.join(V2, "poses-cycles.png"))
        for cn, pose in cycles:
            m = allman[cn][pose]
            gif(m["_imgs"], m["fps"], os.path.join(V2, f"preview-{cn}-{pose}.gif"))
    else:
        report = {f"{cn}-{pose}": old_report[f"{cn}-{pose}"] for cn, pose in cycles}   # the cycles are untouched
    for cn in allman:
        for pose in allman[cn]:
            allman[cn][pose].pop("_imgs")
            allman[cn][pose].pop("_new")
    json.dump(src, open(SRC_HASH, "w"), indent=1)
    man = dict(
        note="Baked gameplay frames. Facing right; mirror horizontally for left (anchor x -> size_pt[0]-anchor_x). "
             "anchor_pt = foot point (ground contact under the body) in points from the frame's top-left. "
             "All frames of one pose share one box, so the anchor is constant within a pose.",
        scale_pt_per_unit={k: v["pt"] for k, v in CHARS.items()},
        files_dir="baked/poses/", loop_check=report, characters=allman)
    json.dump(man, open(os.path.join(V2, "baked", "poses.json"), "w"), indent=1, ensure_ascii=False)
    tot = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.endswith("@3x.webp"))
    tot2 = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.endswith("@2x.webp"))
    print("frames:", sum(len(v) for v in allman.values()), "poses;", "bytes @3x", tot, "@2x", tot2)
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
