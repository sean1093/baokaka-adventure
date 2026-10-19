"""Build every v2 deliverable.

  python3 docs/art/v2/tools/build_all.py

writes docs/art/v2/{sheet-baokaka,sheet-mocha,style-proof,compare-with-reference}.png
(generated HTML/SVG land in docs/art/v2/src/build/).  Reference images for the
comparison are read from $REF_DIR (the owner's three sheets) when present.
"""
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
V2 = os.path.dirname(HERE)
SRC = os.path.join(V2, "src")
BUILD = os.path.join(SRC, "build")
sys.path.insert(0, SRC)
os.makedirs(BUILD, exist_ok=True)
RENDER = os.path.join(HERE, "render.mjs")


def render(inp, out, w, h, s):
    subprocess.run(["node", RENDER, inp, out, str(w), str(h), str(s)], check=True, capture_output=True)
    print("wrote", os.path.relpath(out, V2))


def main():
    import sheets, proof
    open(os.path.join(BUILD, "sheet-baokaka.html"), "w").write(sheets.sheet_baokaka())
    open(os.path.join(BUILD, "sheet-mocha.html"), "w").write(sheets.sheet_mocha())
    for n in ("baokaka", "mocha"):
        render(os.path.join(BUILD, f"sheet-{n}.html"), os.path.join(V2, f"sheet-{n}.png"), sheets.W, sheets.HT, 2)
    proof.main(os.path.join(V2, "style-proof.png"))
    import compare
    compare.main(os.path.join(V2, "compare-with-reference.png"))


if __name__ == "__main__":
    main()
