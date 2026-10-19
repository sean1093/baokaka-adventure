"""proof.py - composites the style-proof scene from baked layers, the way
the game would: background bitmap + character sprites (baked once) +
per-scene night grade and rim light done on the bitmaps.

usage: python3 proof.py <out.png>
"""
import os, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter
import scene

HERE = os.path.dirname(os.path.abspath(__file__))
RENDER = os.path.join(HERE, "..", "tools", "render.mjs")


def render(svg, w, h, tmp, name):
    p = os.path.join(tmp, name + ".svg")
    open(p, "w").write(svg)
    out = os.path.join(tmp, name + ".png")
    subprocess.run(["node", RENDER, p, out, str(w), str(h), "1"], check=True, capture_output=True)
    return Image.open(out).convert("RGBA")


def shift(a, dx, dy):
    b = np.zeros_like(a)
    H, W = a.shape
    xs, xd = (slice(0, W - dx), slice(dx, W)) if dx >= 0 else (slice(-dx, W), slice(0, W + dx))
    ys, yd = (slice(0, H - dy), slice(dy, H)) if dy >= 0 else (slice(-dy, H), slice(0, H + dy))
    b[yd, xd] = a[ys, xs]
    return b


def night(img, grade=(.93, .92, .99), sat=1.08, warm=(255, 214, 150), cool=(140, 190, 255)):
    a = np.asarray(img).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3] / 255
    lum = (rgb * np.array([.299, .587, .114])).sum(-1, keepdims=True)
    rgb = lum + (rgb - lum) * sat          # keep anime colours saturated at night
    rgb = rgb * np.array(grade)
    # warm key rim from the platform lamps (upper left), cool city bounce (right)
    # rim sits just inside the ink line: compute it on an eroded silhouette
    ae = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5))) / 255
    rk = np.clip(ae - shift(ae, 5, 4), 0, 1)
    rc = np.clip(ae - shift(ae, -4, 0), 0, 1)
    rk = np.asarray(Image.fromarray((rk * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))) / 255 * al
    rc = np.asarray(Image.fromarray((rc * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))) / 255 * al
    rgb = rgb + rk[..., None] * (np.array(warm) - rgb) * .75
    rgb = rgb + rc[..., None] * (np.array(cool) - rgb) * .45
    a[..., :3] = np.clip(rgb, 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def main(out):
    bg_svg, fg_svg = scene.build()
    with tempfile.TemporaryDirectory() as tmp:
        bg = render(bg_svg, scene.VW // 2, scene.VH // 2, tmp, "bg") if False else None
        # background rendered at 2x of the 390x844 phone viewport
        p = os.path.join(tmp, "bg.svg"); open(p, "w").write(bg_svg)
        subprocess.run(["node", RENDER, p, os.path.join(tmp, "bg.png"), "390", "844", "2"], check=True, capture_output=True)
        canvas = Image.open(os.path.join(tmp, "bg.png")).convert("RGBA")
        for name, svg, x, y, w, h, _ in scene.char_layers():
            spr = render(svg, w, h, tmp, name)
            canvas.alpha_composite(night(spr), (int(x), int(y)))
        p = os.path.join(tmp, "fg.svg"); open(p, "w").write(fg_svg)
        subprocess.run(["node", RENDER, p, os.path.join(tmp, "fg.png"), "390", "844", "2"], check=True, capture_output=True)
        canvas.alpha_composite(Image.open(os.path.join(tmp, "fg.png")).convert("RGBA"))
        canvas.convert("RGB").save(out)
    print("wrote", out)


if __name__ == "__main__":
    main(sys.argv[1])
