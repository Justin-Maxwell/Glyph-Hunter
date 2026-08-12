#!/usr/bin/env python3
"""
sysfont — name the font behind a glyph, on-device.

Scans a font directory (default Android's /system/fonts) and reports, for each
codepoint you ask about, every face that carries it and the advance width that
face assigns it, normalised to 1000 units per em.

Neither root nor a desktop is needed: /system/fonts and /system/etc/fonts.xml
are world-readable on Android.

    pkg install python
    pip install fonttools
    python sysfont.py

Usage
    python sysfont.py                          # the MarkRight candidate set
    python sysfont.py 29B6 29B7 29B8           # named codepoints, hex
    python sysfont.py --chars "⦶⦷⦸⦺⦼⦾⦿⧀⧁"     # or paste the glyphs
    python sysfont.py --match 796              # only faces giving that advance
    python sysfont.py --dir /system/fonts      # somewhere else
    python sysfont.py --fallback               # print the fallback order too

A caveat worth keeping in mind: this reports what each font file *contains*.
It does not report which file the system actually chose for a given run — that
depends on the fallback order in fonts.xml and on the app doing the drawing.
Matching a measured advance against this table is how you close that gap.
"""

import argparse
import glob
import os
import sys
import unicodedata

try:
    from fontTools.ttLib import TTFont, TTCollection
except ImportError:
    sys.exit("fontTools is missing.  pip install fonttools")

DEFAULT_DIR = "/system/fonts"
FALLBACK_XML = ("/system/etc/fonts.xml", "/system/etc/font_fallback.xml")

# The MarkRight marker candidates, as of this session.
DEFAULT_CPS = [
    0x29B6, 0x29B7, 0x29B8, 0x29B9, 0x29BA, 0x29BB, 0x29BC, 0x29BD,
    0x29BE, 0x29BF, 0x29C0, 0x29C1,
]


def load(path):
    """Yield (label, cmap, hmtx, unitsPerEm) for every face in a file."""
    try:
        if path.lower().endswith((".ttc", ".otc")):
            coll = TTCollection(path, lazy=True)
            for i, f in enumerate(coll.fonts):
                yield f"{os.path.basename(path)}[{i}]", f
        else:
            yield os.path.basename(path), TTFont(path, lazy=True, fontNumber=0)
    except Exception as exc:
        print(f"  ! skipped {os.path.basename(path)}: {exc}", file=sys.stderr)


def metrics(font, cps):
    """Map codepoint -> advance per 1000 em, for those the font carries."""
    try:
        cmap = font.getBestCmap()
        hmtx = font["hmtx"]
        upm = font["head"].unitsPerEm or 1000
    except Exception:
        return {}
    out = {}
    for cp in cps:
        gname = cmap.get(cp)
        if not gname:
            continue
        try:
            out[cp] = round(hmtx[gname][0] * 1000 / upm)
        except Exception:
            pass
    return out


def scan(directory, cps):
    files = []
    for ext in ("ttf", "otf", "ttc", "otc", "TTF", "OTF", "TTC", "OTC"):
        files += glob.glob(os.path.join(directory, f"*.{ext}"))
    if not files:
        sys.exit(f"No font files found in {directory}")
    results = []
    for path in sorted(set(files)):
        for label, font in load(path):
            m = metrics(font, cps)
            if m:
                results.append((label, m))
            try:
                font.close()
            except Exception:
                pass
    return results, len(set(files))


def show_fallback():
    for path in FALLBACK_XML:
        if not os.path.exists(path):
            continue
        print(f"\n=== {path} ===")
        try:
            with open(path, encoding="utf-8", errors="replace") as fh:
                for line in fh:
                    s = line.strip()
                    if s.startswith("<family") or s.startswith("<font") or s.startswith("</family"):
                        print("  " + s[:150])
        except Exception as exc:
            print(f"  ! unreadable: {exc}")


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("codepoints", nargs="*", help="hex codepoints, e.g. 29B6")
    ap.add_argument("--chars", help="literal glyphs instead of codepoints")
    ap.add_argument("--dir", default=DEFAULT_DIR, help=f"font directory (default {DEFAULT_DIR})")
    ap.add_argument("--match", type=int, help="show only faces assigning this advance")
    ap.add_argument("--fallback", action="store_true", help="also print the fallback order")
    args = ap.parse_args()

    if args.chars:
        cps = [ord(c) for c in args.chars if ord(c) > 32]
    elif args.codepoints:
        try:
            cps = [int(x, 16) for x in args.codepoints]
        except ValueError:
            sys.exit("Codepoints must be hex, without a U+ prefix.")
    else:
        cps = DEFAULT_CPS

    print(f"Scanning {args.dir} for {len(cps)} codepoints\n")
    for cp in cps:
        try:
            name = unicodedata.name(chr(cp))
        except ValueError:
            name = "(unnamed)"
        print(f"  U+{cp:04X} {chr(cp)}  {unicodedata.east_asian_width(chr(cp))}  {name}")

    results, nfiles = scan(args.dir, cps)
    print(f"\n{nfiles} font files scanned; {len(results)} faces carry at least one\n")

    header = f"{'face':34}" + "".join(f"{chr(cp):>7}" for cp in cps)
    print(header)
    print("-" * len(header))

    shown = 0
    for label, m in results:
        widths = set(m.values())
        if args.match is not None and args.match not in widths:
            continue
        shown += 1
        row = f"{label[:34]:34}"
        for cp in cps:
            row += f"{m.get(cp, '-'):>7}"
        tail = "  uniform" if len(widths) == 1 else f"  {len(widths)} widths"
        print(row + tail)

    if args.match is not None:
        print(f"\n{shown} face(s) assign an advance of {args.match} to at least one of the set.")

    print("\nFaces carrying every codepoint in the set, and uniform across it:")
    clean = [
        (label, next(iter(set(m.values()))))
        for label, m in results
        if len(m) == len(cps) and len(set(m.values())) == 1
    ]
    if clean:
        for label, w in clean:
            print(f"  {label:34} all at {w}/1000em")
    else:
        print("  none — every face that has the whole set splits it across widths")

    if args.fallback:
        show_fallback()

    print(
        "\nTo identify the face your device actually used, measure the advance on\n"
        "screen first, then look for it in the table above."
    )


if __name__ == "__main__":
    main()
