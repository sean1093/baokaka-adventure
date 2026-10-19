"""bake.py - bake the v2 character art to bitmaps at the sizes the game needs.

    python3 docs/art/v2/tools/bake.py [out_dir] [--png]   (default docs/art/v2/baked)

For every sprite in SPRITES it writes the authored SVG (out/svg/) and a WebP
+ PNG per device scale (@2x, @3x), plus manifest.json with pixel sizes and
byte counts.  The game then only ever draws bitmaps: zero filter/mask/blur
cost at runtime, and the SVG complexity (thousands of nodes, Gaussian blurs)
never reaches the phone.
"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
V2 = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(V2, "src"))
from geom import Doc
import baokaka as H, baokaka_body as B, mocha as Mo

RENDER = os.path.join(HERE, "render.mjs")
# name -> (builder, viewBox, logical width in CSS px / pt; height follows the viewBox)
SPRITES = {
    "baokaka-stand":        (lambda d: B.figure(d, "happy"), "-140 -60 680 1420", 96),
    "mocha-sit":            (lambda d: Mo.figure(d, "content"), "130 20 360 690", 92),
    **{f"baokaka-head-{e}": (lambda d, e=e, t=t: H.head(d, e, t), "-14 -44 428 460", 64)
       for e, t in [("happy", .2), ("laugh", -.2), ("teary", .2), ("surprised", -.25), ("cry", .1)]},
    **{f"mocha-head-{e}":   (lambda d, e=e, t=t: Mo.head(d, e, t), "140 20 320 300", 64)
       for e, t in [("content", .12), ("smug", .3), ("happy", -.25), ("surprised", .18)]},
}
SCALES = (2, 3)


def main(out):
    os.makedirs(os.path.join(out, "svg"), exist_ok=True)
    man = {}
    for name, (fn, vb, lw) in SPRITES.items():
        d = Doc(0, 0, vb)
        d.add(fn(d))
        svg = d.svg()
        sp = os.path.join(out, "svg", name + ".svg")
        open(sp, "w").write(svg)
        vw, vh = [float(v) for v in vb.split()[2:]]
        lh = round(lw * vh / vw)
        man[name] = {"logical": [lw, lh], "svg_bytes": len(svg.encode()), "files": {}}
        for s in SCALES:
            for ext in (("webp", "png") if "--png" in sys.argv else ("webp",)):
                f = os.path.join(out, f"{name}@{s}x.{ext}")
                subprocess.run(["node", RENDER, sp, f, str(lw * s), str(lh * s), "1"], check=True, capture_output=True)
                man[name]["files"][f"@{s}x.{ext}"] = {"px": [lw * s, lh * s], "bytes": os.path.getsize(f)}
        print(name, man[name]["files"][f"@{SCALES[-1]}x.webp"])
    json.dump(man, open(os.path.join(out, "manifest.json"), "w"), indent=1)


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    main(args[0] if args else os.path.join(V2, "baked"))
