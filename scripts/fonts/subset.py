#!/usr/bin/env python3
"""
Step 2 of `npm run fonts` (#68, D-105): cut the game's web fonts down to the characters it prints.

Reads `src/fonts/charset.json` (step 1, `scripts/fonts/charset.ts`) and, for every face the game
uses, writes one WOFF2 file per slice into `src/fonts/files/`, the `@font-face` rules for them
(`src/fonts/fonts.css`, the game; `src/fonts/dev.css`, the dev tools' extra characters) and
`src/fonts/fonts.json` (what each file covers, and the characters a family never drew).

    pip install fonttools brotli        # once (fonttools 4.x)
    python3 scripts/fonts/subset.py

The sources are the variable fonts Google Fonts serves (the google/fonts repository at a pinned
commit, checked by SHA-256), cached in `node_modules/.cache/font-sources/`. Each weight the old
Google Fonts link loaded is instanced from them (`wght`, and `wdth` 100 for Fredoka), as Google
does for its static files, and keeps the layout features the browser applies, so the text looks
the same. All three families are under the SIL Open Font License 1.1, which allows subsetting and
self-hosting; none declares a Reserved Font Name. Their licenses are copied to `public/fonts/`.

CI has no Python: the output is committed, and `src/fonts/fonts.test.ts` fails when the source
prints a character no file covers (run `npm run fonts` then).
"""

import hashlib
import io
import json
import os
import shutil
import sys
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
FONTS = os.path.join(ROOT, "src", "fonts")
FILES = os.path.join(FONTS, "files")
PUBLIC = os.path.join(ROOT, "public", "fonts")
CACHE = os.path.join(ROOT, "node_modules", ".cache", "font-sources")

GOOGLE_FONTS = "https://raw.githubusercontent.com/google/fonts/45e3d5269e4a17d823f6d84470bc084dc5ae46f6/ofl/"

# family, file stem, source path in google/fonts, its SHA-256, the license, weights, sliced, fixed axes
FACES = [
    {
        "family": "Chiron GoRound TC",
        "id": "chiron",
        "source": ("chirongoroundtc/ChironGoRoundTC%5Bwght%5D.ttf", "47cd5ff5153799d4c0d05bcc64da849e13b8eb842e46728a66bf2d52c480231f"),
        "license": ("chirongoroundtc/OFL.txt", "7b9cc84fe1935d1418de4af57b4106038fb836b3a162e1b86507c7fc8543a759"),
        "weights": [700, 900],
        "sliced": True,
        "axes": {},
    },
    {
        "family": "Noto Serif TC",
        "id": "noto-serif",
        "source": ("notoseriftc/NotoSerifTC%5Bwght%5D.ttf", "0077e18f57c6908f4a000969880940bdb0dad057c0e8d98b49dc364c3d1b09c6"),
        "license": ("notoseriftc/OFL.txt", "5e0da210fb04058a8c0087985d2d456b931c2579811a49655721d3cf0c36b6d6"),
        "weights": [700, 900],
        "sliced": True,
        "axes": {},
    },
    {
        "family": "Fredoka",
        "id": "fredoka",
        "source": ("fredoka/Fredoka%5Bwdth,wght%5D.ttf", "2ba02e68b152868aef9ba28e24b3648c7d457fe6f25c761f2c2c53fb61a73fc8"),
        "license": ("fredoka/OFL.txt", "5c9e7eee5c6b25f4b05b8d53b2e470ea4962f9ced742d044a98f7d95d1375bab"),
        "weights": [500, 600, 700],
        "sliced": False,
        "axes": {"wdth": 100},
    },
]


def fetch(path, sha256):
    """A google/fonts file, downloaded once into the cache and checked against its hash."""
    os.makedirs(CACHE, exist_ok=True)
    local = os.path.join(CACHE, sha256 + "-" + os.path.basename(path).replace("%5B", "[").replace("%5D", "]"))
    if not os.path.exists(local):
        print(f"  downloading {path}")
        with urllib.request.urlopen(GOOGLE_FONTS + path) as r, open(local + ".part", "wb") as out:
            shutil.copyfileobj(r, out)
        os.replace(local + ".part", local)
    with open(local, "rb") as f:
        digest = hashlib.sha256(f.read()).hexdigest()
    if digest != sha256:
        os.remove(local)
        sys.exit(f"{path}: SHA-256 {digest}, expected {sha256}")
    return local


def options():
    o = subset.Options()
    # The features a browser applies on its own (fontTools' default list: kerning, ligatures, local
    # forms, vertical forms …), the ones the game asks for (`tabular-nums`) and the ones Chrome uses to
    # trim the space between CJK punctuation (`text-spacing-trim`). Stylistic sets and alternates stay
    # out: they would pull hundreds of glyphs no screen shows.
    o.layout_features += ["tnum", "halt", "chws", "vhal", "vchw"]
    o.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]  # copyright, names, version, license and its URL
    o.name_languages = [0x409]
    o.notdef_outline = True
    o.drop_tables += ["STAT"]
    return o


def cut(font_bytes, chars):
    """A WOFF2 of `font_bytes` holding only `chars`, and the characters it really covers."""
    font = TTFont(io.BytesIO(font_bytes))
    s = subset.Subsetter(options())
    s.populate(text="".join(chars))
    s.subset(font)
    covered = {chr(u) for u in font.getBestCmap()} & set(chars)
    font.flavor = "woff2"
    font.recalcTimestamp = False  # keep the source's date, so a re-run writes the same bytes
    out = io.BytesIO()
    font.save(out)
    return out.getvalue(), covered


def static_instance(face, weight, chars):
    """The face at one weight, already cut to every character the game and the dev tools print."""
    font = TTFont(fetch(*face["source"]))
    s = subset.Subsetter(options())
    s.populate(text="".join(chars))
    s.subset(font)
    font = instancer.instantiateVariableFont(font, {"wght": weight, **face["axes"]}, updateFontNames=False)
    font.recalcTimestamp = False
    out = io.BytesIO()
    font.save(out)
    return out.getvalue()


def unicode_range(chars):
    """`U+20-7E, U+B7, …` for a set of characters."""
    points = sorted(ord(c) for c in chars)
    runs = []
    for p in points:
        if runs and runs[-1][1] == p - 1:
            runs[-1][1] = p
        else:
            runs.append([p, p])
    return ", ".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in runs)


def css_rule(face, weight, name, covered):
    return (
        "@font-face {\n"
        f"  font-family: '{face['family']}';\n"
        "  font-style: normal;\n"
        f"  font-weight: {weight};\n"
        "  font-display: swap;\n"
        f"  src: url('./files/{name}') format('woff2');\n"
        f"  unicode-range: {unicode_range(covered)};\n"
        "}\n"
    )


HEADER = """/*
 * Generated by `npm run fonts` (scripts/fonts/subset.py, #68, D-105). Do not edit.
 * {what}
 * Fonts: Chiron GoRound TC, Noto Serif TC and Fredoka, SIL Open Font License 1.1
 * (public/fonts/OFL-*.txt).
 */
"""


def main():
    with open(os.path.join(FONTS, "charset.json"), encoding="utf8") as f:
        charset = json.load(f)
    slices = charset["slices"]
    dev = list(charset["dev"])
    game = [c for s in slices for c in s]

    if os.path.isdir(FILES):
        shutil.rmtree(FILES)
    os.makedirs(FILES)
    os.makedirs(PUBLIC, exist_ok=True)

    game_css, dev_css = [], []
    manifest = {"generatedBy": "npm run fonts (scripts/fonts/subset.py)", "families": {}}
    for face in FACES:
        shutil.copyfile(fetch(*face["license"]), os.path.join(PUBLIC, f"OFL-{face['family'].replace(' ', '')}.txt"))
        entry = {"weights": face["weights"], "files": [], "missing": None}
        missing = None
        for weight in face["weights"]:
            print(f"{face['family']} {weight}")
            base = static_instance(face, weight, game + dev)
            parts = [(str(i), list(s)) for i, s in enumerate(slices)] if face["sliced"] else [("0", game)]
            parts.append(("dev", dev))
            not_drawn = set()
            for label, chars in parts:
                data, covered = cut(base, chars)
                not_drawn |= set(chars) - covered
                if not covered:
                    continue
                name = f"{face['id']}-{weight}-{label}.woff2"
                with open(os.path.join(FILES, name), "wb") as f:
                    f.write(data)
                (dev_css if label == "dev" else game_css).append(css_rule(face, weight, name, covered))
                entry["files"].append({"file": name, "weight": weight, "dev": label == "dev", "bytes": len(data)})
                print(f"  {name}: {len(covered)} characters, {len(data) / 1024:.1f} KB")
            missing = not_drawn if missing is None else missing & not_drawn
        # Fredoka draws Latin only and falls back to Chiron GoRound TC (tailwind.config.ts `num`)
        entry["missing"] = "".join(sorted(missing)) if face["sliced"] else None
        manifest["families"][face["family"]] = entry

    with open(os.path.join(FONTS, "fonts.css"), "w", encoding="utf8") as f:
        f.write(HEADER.format(what="The game's faces: one file per weight and slice of src/fonts/charset.json, fetched only when a\n * character of its unicode-range is on screen.") + "\n".join(game_css))
    with open(os.path.join(FONTS, "dev.css"), "w", encoding="utf8") as f:
        f.write(HEADER.format(what="The characters only the dev tools print (art lab, PageLab): imported by them, never in the build.") + "\n".join(dev_css))
    with open(os.path.join(FONTS, "fonts.json"), "w", encoding="utf8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main()
