#!/usr/bin/env python3
"""
gen_groups — first-pass grouping and ordering over the glyph inventory.

Authored data is what this *produces*, not what it is. The output is a starting point for
Justin to move around by hand; this script exists so the first pass is fast and, more
importantly, **auditable**. Every glyph records the rule that placed it, so a wrong
placement can be traced to a rule rather than argued about glyph by glyph.

    python tools/gen_groups.py            # writes data/config.json
    python tools/gen_groups.py --report   # summary to stdout, writes nothing

Inventory rule, per Justin, 2026-08-13
    In:  Sm Sc Sk So No Nl, all punctuation, and the Spacing Modifier Letters block.
    Out: letters of every script, precomposed accented letters, combining marks,
         decimal digits, spaces, controls.
    Bias: include rather than exclude.

Grouping is by name morphology first, since Unicode names for shapes are compositional,
then by block for everything whose name carries no shape. Ordering within a group is by
the features the name states - partition, axis, ink fraction - then codepoint.

Known limits, deliberately not worked around
    Names encode construction, not function. A grouping like "vertical delimiters" spans
    seven blocks and shares no morpheme, so nothing here can find it. Those groupings are
    Justin's to author.
    All groupings are peers. Nothing here is a base taxonomy that others decorate.
"""

import argparse
import json
import os
import re
import sys
import unicodedata as u

try:
    from fontTools.unicodedata import block as ucd_block
except ImportError:
    sys.exit("fontTools is missing.  pip install fonttools")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

IN_CATEGORIES = {"Sm", "Sc", "Sk", "So", "No", "Nl",
                 "Ps", "Pe", "Pi", "Pf", "Pd", "Pc", "Po"}
SPACING_MODIFIERS = (0x02B0, 0x02FF)      # Lm lives here too; accents are wanted


def inventory():
    out = []
    for cp in range(0x110000):
        if 0xD800 <= cp <= 0xDFFF:
            continue
        c = chr(cp)
        g = u.category(c)
        if g in IN_CATEGORIES:
            out.append(cp)
        elif g == "Lm" and SPACING_MODIFIERS[0] <= cp <= SPACING_MODIFIERS[1]:
            out.append(cp)
    return out


# ---------------------------------------------------------------- ordering features

FILL_WORDS = [
    (r"\bALL BUT\b|\bTHREE QUARTERS?\b", 0.75),
    (r"\bHALF\b", 0.50),
    (r"\bQUADRANT\b|\bQUARTER\b", 0.25),
]


def features(name, cp):
    """Whatever the name states about construction. Absent is None, never guessed."""
    f = {"ink": None, "part": None, "axis": None, "size": None}
    if not name:
        return f
    for pat, frac in FILL_WORDS:
        if re.search(pat, name):
            f["ink"] = frac
            f["part"] = {0.75: "three-quarter", 0.50: "half", 0.25: "quarter"}[frac]
            break
    if f["ink"] is None:
        if re.search(r"\bDOTTED\b|\bDASHED\b", name):
            f["ink"] = 0.05
        elif re.search(r"\bBLACK\b", name) and not re.search(r"\bWHITE\b", name):
            f["ink"] = 1.0
        elif re.search(r"\bWHITE\b", name):
            f["ink"] = 0.0
    if re.search(r"\b(LEFT|RIGHT) HALF\b", name):
        f["axis"] = "vertical"
    elif re.search(r"\b(UPPER|LOWER|TOP|BOTTOM) HALF\b", name):
        f["axis"] = "horizontal"
    elif re.search(r"\b(UPPER|LOWER)[- ](LEFT|RIGHT)\b", name):
        f["axis"] = "diagonal"
    for word, tag in (("LARGE", "large"), ("MEDIUM", "medium"),
                      ("SMALL", "small"), ("TINY", "tiny")):
        if re.search(rf"\b{word}\b", name):
            f["size"] = tag
            break
    return f


ORDER_PART = {None: 0, "quarter": 1, "half": 2, "three-quarter": 3}
ORDER_AXIS = {None: 0, "vertical": 1, "horizontal": 2, "diagonal": 3}
ORDER_SIZE = {"tiny": 0, "small": 1, None: 2, "medium": 3, "large": 4}


def sort_key(rec):
    f = rec["f"]
    return (f["ink"] if f["ink"] is not None else 9,
            ORDER_PART[f["part"]],
            ORDER_AXIS[f["axis"]],
            ORDER_SIZE[f["size"]],
            rec["cp"])


# ---------------------------------------------------------------- the ruleset
# Ordered. First match wins. Each entry: (group name, test, rule id)
# Shape rules come before block rules, because a shape family is what Justin is hunting
# and it cuts across blocks. Enclosed-alphanumeric rules come before shape rules, so
# CIRCLED DIGIT ONE lands with its siblings rather than with the circles.

def _n(cp):
    try:
        return u.name(chr(cp))
    except ValueError:
        return ""


# Arrows are tested before shapes: RIGHTWARDS ARROW WITH SMALL CIRCLE is an arrow that
# happens to mention a circle, and the shape rules would otherwise claim it.
PRECEDENCE = [
    ("arrows", r"\bARROW\b|\bARROWHEAD\b|\bHARPOON\b"),
]

SHAPES = [
    ("circles",            r"\bCIRCLE|\bBULLSEYE\b|\bFISHEYE\b"),
    ("squares",            r"\bSQUARE\b"),
    ("rectangles",         r"\bRECTANGLE\b|\bPARALLELOGRAM\b"),
    ("diamonds, lozenges", r"\bDIAMOND\b|\bLOZENGE\b|\bRHOMBUS\b"),
    ("triangles",          r"\bTRIANGLE\b|\bPOINTER\b"),
    ("polygons",           r"\bPENTAGON\b|\bHEXAGON\b|\bHEPTAGON\b|\bOCTAGON\b|\bTRAPEZIUM\b"),
    ("stars, asterisks",   r"\bSTAR\b|\bASTERISK\b|\bSPARKLE\b|\bSNOWFLAKE\b"),
    ("bullets, dots",      r"\bBULLET\b|\bMIDDLE DOT\b|\bONE DOT\b|\bTWO DOT\b|\bDOT ABOVE\b|\bPERIOD CENTERED\b"),
    ("arcs, half shapes",  r"\bARC\b|\bFROWN\b|\bSMILE\b|\bSEMICIRCLE\b"),
    ("crosses, saltires",  r"\bCROSS\b|\bSALTIRE\b|\bMULTIPLICATION X\b"),
]

ENCLOSED = r"\bCIRCLED\b|\bPARENTHESIZED\b|\bSQUARED\b|\bNEGATIVE CIRCLED\b|\bNEGATIVE SQUARED\b|\bENCLOSING\b|\bDINGBAT\b"

BLOCK_GROUPS = {
    "Basic Latin":                              "common latin punctuation",
    "Latin-1 Supplement":                       "common latin punctuation",
    "General Punctuation":                      "general punctuation",
    "Supplemental Punctuation":                 "supplemental punctuation",
    "CJK Symbols and Punctuation":              "cjk punctuation",
    "Vertical Forms":                           "cjk punctuation",
    "CJK Compatibility Forms":                  "cjk punctuation",
    "Small Form Variants":                      "cjk punctuation",
    "Halfwidth and Fullwidth Forms":            "fullwidth and halfwidth",
    "Arrows":                                   "arrows",
    "Supplemental Arrows-A":                    "arrows",
    "Supplemental Arrows-B":                    "arrows",
    "Supplemental Arrows-C":                    "arrows",
    "Miscellaneous Symbols and Arrows":         "misc symbols and arrows",
    "Mathematical Operators":                   "math operators",
    "Supplemental Mathematical Operators":      "math operators",
    "Miscellaneous Mathematical Symbols-A":     "misc math symbols",
    "Miscellaneous Mathematical Symbols-B":     "misc math symbols",
    "Miscellaneous Technical":                  "technical",
    "Control Pictures":                         "technical",
    "Optical Character Recognition":            "technical",
    "Box Drawing":                              "box drawing",
    "Block Elements":                           "block elements",
    "Geometric Shapes":                         "geometric shapes, unshaped names",
    "Geometric Shapes Extended":                "geometric shapes, unshaped names",
    "Dingbats":                                 "dingbats",
    "Ornamental Dingbats":                      "dingbats",
    "Braille Patterns":                         "braille",
    "Currency Symbols":                         "currency",
    "Letterlike Symbols":                       "letterlike",
    "Number Forms":                             "number forms",
    "Enclosed Alphanumerics":                   "enclosed alphanumerics",
    "Enclosed Alphanumeric Supplement":         "enclosed alphanumerics",
    "Enclosed CJK Letters and Months":          "enclosed cjk",
    "Enclosed Ideographic Supplement":          "enclosed cjk",
    "Superscripts and Subscripts":              "superscripts and subscripts",
    "Spacing Modifier Letters":                 "standalone accents",
    "Modifier Tone Letters":                    "standalone accents",
    "Musical Symbols":                          "music",
    "Byzantine Musical Symbols":                "music",
    "Ancient Greek Musical Notation":           "music",
    "Miscellaneous Symbols":                    "misc symbols",
    "Emoticons":                                "emoji and pictographs",
    "Miscellaneous Symbols and Pictographs":    "emoji and pictographs",
    "Supplemental Symbols and Pictographs":     "emoji and pictographs",
    "Symbols and Pictographs Extended-A":       "emoji and pictographs",
    "Transport and Map Symbols":                "emoji and pictographs",
    "Mahjong Tiles":                            "games",
    "Domino Tiles":                             "games",
    "Playing Cards":                            "games",
    "Chess Symbols":                            "games",
    "Alchemical Symbols":                       "alchemy and astrology",
    "Ancient Symbols":                          "historic and religious",
    "Coptic Epact Numbers":                     "historic and religious",
    "Counting Rod Numerals":                    "historic and religious",
    "Tai Xuan Jing Symbols":                    "divination",
    "Yijing Hexagram Symbols":                  "divination",
    "Symbols for Legacy Computing":             "legacy computing",
    "Symbols for Legacy Computing Supplement":  "legacy computing",
    "Mathematical Alphanumeric Symbols":        "math alphanumerics",
    "Arabic Mathematical Alphabetic Symbols":   "math alphanumerics",
    "Sutton SignWriting":                       "sign writing",
    "Znamenny Musical Notation":                "music",
    "Byzantine Musical Symbols":                "music",
    "Kangxi Radicals":                          "cjk radicals and strokes",
    "CJK Radicals Supplement":                  "cjk radicals and strokes",
    "CJK Strokes":                              "cjk radicals and strokes",
    "Yi Radicals":                              "cjk radicals and strokes",
    "Kanbun":                                   "cjk radicals and strokes",
    "CJK Compatibility":                        "cjk measures and units",
    "Phaistos Disc":                            "historic and religious",
    "Meroitic Cursive":                         "script numerals",
}

# Numeral systems from many scripts. One group, since they behave alike and none is
# a shape family. Kept together rather than scattered across 20 tiny groups.
NUMERAL_BLOCKS = {
    "Cuneiform Numbers and Punctuation", "Ancient Greek Numbers", "Indic Siyaq Numbers",
    "Ottoman Siyaq Numbers", "Aegean Numbers", "Rumi Numeral Symbols",
    "Sinhala Archaic Numbers", "Kaktovik Numerals", "Mayan Numerals",
    "Coptic Epact Numbers", "Counting Rod Numerals", "Tamil Supplement",
    "Common Indic Number Forms", "Masaram Gondi", "Nag Mundari",
}


def classify(cp, name, blk, gc):
    if re.search(ENCLOSED, name):
        return "enclosed alphanumerics", "enclosed"
    for group, pat in PRECEDENCE:
        if re.search(pat, name):
            return group, f"precedence:{group}"
    for group, pat in SHAPES:
        if re.search(pat, name):
            return group, f"shape:{group}"
    if blk in BLOCK_GROUPS:
        return BLOCK_GROUPS[blk], f"block:{blk}"
    if blk in NUMERAL_BLOCKS or gc in ("No", "Nl"):
        return "script numerals", "category:number"
    if gc.startswith("P"):
        return "script punctuation", "fallback:script-punctuation"
    return "unsorted", "fallback:unsorted"


GROUP_ORDER = [
    "circles", "arcs, half shapes", "squares", "rectangles", "diamonds, lozenges",
    "triangles", "polygons", "stars, asterisks", "crosses, saltires", "bullets, dots",
    "geometric shapes, unshaped names", "block elements", "box drawing",
    "misc math symbols", "math operators", "arrows", "misc symbols and arrows",
    "technical", "legacy computing", "braille",
    "enclosed alphanumerics", "enclosed cjk", "number forms",
    "superscripts and subscripts", "math alphanumerics", "letterlike",
    "currency", "standalone accents",
    "common latin punctuation", "general punctuation", "supplemental punctuation",
    "cjk punctuation", "fullwidth and halfwidth",
    "dingbats", "misc symbols", "emoji and pictographs", "games",
    "alchemy and astrology", "divination", "historic and religious", "music",
    "script punctuation", "script numerals", "cjk radicals and strokes",
    "cjk measures and units", "sign writing", "unsorted",
]

DESELECTED_BY_DEFAULT = {
    "common latin punctuation", "cjk punctuation", "fullwidth and halfwidth",
    "braille", "emoji and pictographs", "music", "math alphanumerics",
    "superscripts and subscripts", "enclosed cjk", "script punctuation",
    "script numerals", "cjk radicals and strokes", "cjk measures and units",
    "sign writing",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true", help="summarise, write nothing")
    args = ap.parse_args()

    groups = {}
    for cp in inventory():
        name = _n(cp)
        blk = ucd_block(chr(cp))
        gc = u.category(chr(cp))
        group, rule = classify(cp, name, blk, gc)
        groups.setdefault(group, []).append(
            {"cp": cp, "name": name, "block": blk, "gc": gc, "rule": rule,
             "f": features(name, cp)})

    for g in groups.values():
        g.sort(key=sort_key)

    ordered = [g for g in GROUP_ORDER if g in groups]
    ordered += sorted(k for k in groups if k not in GROUP_ORDER)

    total = sum(len(v) for v in groups.values())
    print(f"{total} glyphs, {len(groups)} groups\n")
    print(f"{'group':38}{'n':>6}  first few")
    print("-" * 78)
    for g in ordered:
        members = groups[g]
        sample = "".join(chr(m["cp"]) for m in members[:14])
        flag = " ·off" if g in DESELECTED_BY_DEFAULT else ""
        print(f"{g:38}{len(members):>6}  {sample}{flag}")

    if args.report:
        return

    config = {
        "_note": "Authored data. gen_groups.py writes a first pass; edit freely. "
                 "Regenerating overwrites, so copy before re-running.",
        "hue_domain": {"min": 350, "max": 1800},
        "defaults": {"font_family": "monospace", "size": 200, "anchor": "0",
                     "guide_opacity": 0.5},
        "groups": [
            {"name": g,
             "selected_by_default": g not in DESELECTED_BY_DEFAULT,
             "members": [f"{m['cp']:04X}" for m in groups[g]],
             "rules": sorted({m["rule"] for m in groups[g]})}
            for g in ordered
        ],
    }
    out = os.path.join(DATA, "config.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(config, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print(f"\nwrote {os.path.relpath(out, ROOT)}")


if __name__ == "__main__":
    main()
