#!/usr/bin/env python3
"""Stage a few local font files plus fontTools' answers, so the JS sfnt reader can be
checked against something that is known to be right.

    python3 tools/make_font_fixtures.py

Writes tests/fixtures/*.ttf and tests/fixtures/expected.json. The font binaries are
gitignored — they are someone else's copyright and they are reproducible from any machine
with the fonts installed. `expected.json` is committed, and records which face produced it,
so a mismatch on another machine is legible rather than mysterious.

Without the fixtures the corresponding browser tests skip, and say that they skipped.
"""
import glob
import json
import os
import shutil
import sys

from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FIXTURES = os.path.join(ROOT, "tests", "fixtures")

# One face with a format 4 cmap and one with format 12 above the BMP, because the reader
# has a separate path for each and the astral path is the one this project actually needs.
WANTED = ["NotoSansMath-Regular.ttf", "NotoSansSymbols2-Regular.ttf",
          "LiberationSans-Regular.ttf", "Symbola.ttf"]

# Codepoints spanning both paths: geometric shapes, the U+29Bx run, and astral shapes.
PROBES = [0x0078, 0x0048, 0x25CB, 0x25D0, 0x25F7, 0x29B5, 0x2B24, 0x1F78A, 0x1D990, 0x10F59]


def find(name):
    for root in ("/usr/share/fonts", "/usr/local/share/fonts",
                 os.path.expanduser("~/.local/share/fonts")):
        hits = glob.glob(f"{root}/**/{name}", recursive=True)
        if hits:
            return hits[0]
    return None


def main():
    os.makedirs(FIXTURES, exist_ok=True)
    expected = {}
    staged = 0

    for name in WANTED:
        path = find(name)
        if not path:
            print(f"  skip   {name}: not installed", file=sys.stderr)
            continue
        shutil.copy2(path, os.path.join(FIXTURES, name))
        staged += 1

        font = TTFont(path, fontNumber=0, lazy=True)
        cmap = font.getBestCmap()
        upem = font["head"].unitsPerEm
        hmtx = font["hmtx"]
        rec = {"upem": upem, "source_path": path, "glyphs": {}}
        for cp in PROBES:
            key = f"{cp:04X}"
            if cp in cmap:
                adv = hmtx[cmap[cp]][0] / upem * 1000
                rec["glyphs"][key] = round(adv, 2)
            else:
                rec["glyphs"][key] = None
        expected[name] = rec
        font.close()
        print(f"  staged {name}")

    if not staged:
        print("no fonts staged; nothing to compare against", file=sys.stderr)
        return 1

    with open(os.path.join(FIXTURES, "expected.json"), "w") as fh:
        json.dump(expected, fh, indent=1, sort_keys=True)
        fh.write("\n")
    print(f"{staged} face(s) staged in tests/fixtures/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
