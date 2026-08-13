#!/usr/bin/env python3
"""
gen_data — emit the derived glyph data the bench and sysfont both read.

Derived data only. Nothing here is authored, and nothing here is opinion: every field
comes from the Unicode Character Database or from Unicode's own alias table. Opinions
live in config.json; reasoning lives in docs/.

    python tools/gen_data.py

Reads
    data/PropertyValueAliases-*.txt   official block short and long aliases
    data/config.json                  to know which codepoints are wanted

Writes
    data/glyphdata.json               the data
    data/glyphdata.js                 same content as a global assignment

The .js shim exists because a page opened as file:// cannot fetch a sibling file, while
a script tag loads fine. One authored source, two emitted forms.

Block aliases come from Unicode's PropertyValueAliases.txt rather than being abbreviated
by hand. The long alias, in its canonical underscored form, is the string to hash for a
block identicon: it is specified, stable, and identical for anyone else who uses it, so
identicons agree between implementations without any agreement being needed.
"""

import json
import os
import re
import sys
import unicodedata

try:
    from fontTools.unicodedata import block as ucd_block
except ImportError:
    sys.exit("fontTools is missing.  pip install fonttools")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")


def loose(s):
    """UAX #44 loose matching: ignore case, whitespace, underscore and hyphen.

    The alias file itself directs that this be applied to all property values. Skipping
    it fails on exactly the connective words - the UCD writes Symbols_And_Arrows while
    fontTools reports Symbols and Arrows, so a literal compare misses on the capital A.
    """
    return re.sub(r"[\s_-]+", "", s).casefold()


def load_block_aliases():
    """Map loose-matched long block alias -> official short alias."""
    paths = [f for f in os.listdir(DATA) if f.startswith("PropertyValueAliases")]
    if not paths:
        sys.exit(f"No PropertyValueAliases file in {DATA}")
    path = os.path.join(DATA, sorted(paths)[-1])
    short_by_long = {}
    for line in open(path, encoding="utf-8"):
        if not line.startswith("blk;"):
            continue
        parts = [p.strip() for p in line.split("#")[0].split(";")]
        if len(parts) >= 3:
            short_by_long[loose(parts[2])] = parts[1]
    ver = re.search(r"PropertyValueAliases-([\d.]+)\.txt", os.path.basename(path))
    return short_by_long, (ver.group(1) if ver else "unknown"), os.path.basename(path)


def canonical(block_name):
    """Block name as the UCD writes it: underscored. This is the identicon hash input."""
    return block_name.replace(" ", "_").replace("-", "_")


def expand(spec):
    """'29B5-29C3' or '25CB' -> list of ints."""
    out = []
    for token in spec if isinstance(spec, list) else [spec]:
        token = token.strip()
        if "-" in token:
            lo, hi = token.split("-", 1)
            out.extend(range(int(lo, 16), int(hi, 16) + 1))
        else:
            out.append(int(token, 16))
    return out


def wanted_codepoints(config):
    cps = []
    for group in config.get("groups", []):
        cps.extend(expand(group.get("members", [])))
    seen = set()
    return [c for c in cps if not (c in seen or seen.add(c))]


def record(cp, short_by_long):
    ch = chr(cp)
    blk = ucd_block(ch)
    canon = canonical(blk)
    try:
        name = unicodedata.name(ch)
    except ValueError:
        name = None
    rec = {
        "cp": f"{cp:04X}",
        "name": name,
        "gc": unicodedata.category(ch),
        "eaw": unicodedata.east_asian_width(ch),
        "mirrored": bool(unicodedata.mirrored(ch)),
        "bidi": unicodedata.bidirectional(ch) or None,
        "block": blk,
        "block_canonical": canon,
        "block_short": short_by_long.get(loose(canon)),
    }
    return {k: v for k, v in rec.items() if v is not None and v is not False}


def main():
    short_by_long, pva_version, pva_file = load_block_aliases()

    config_path = os.path.join(DATA, "config.json")
    if not os.path.exists(config_path):
        sys.exit(f"No config.json in {DATA}. Authored data must exist before derived data.")
    config = json.load(open(config_path, encoding="utf-8"))

    cps = wanted_codepoints(config)
    if not cps:
        sys.exit("config.json lists no group members, so there is nothing to derive.")

    glyphs = [record(cp, short_by_long) for cp in cps]

    missing = [g["cp"] for g in glyphs if g["block_short"] is None]
    unnamed = [g["cp"] for g in glyphs if g["name"] is None]

    blocks = {}
    for g in glyphs:
        blocks.setdefault(g["block_canonical"], {
            "display": g["block"],
            "short": g["block_short"],
            "canonical": g["block_canonical"],
        })

    payload = {
        "provenance": {
            "ucd_unicodedata": unicodedata.unidata_version,
            "block_aliases_from": pva_file,
            "block_aliases_version": pva_version,
            "identicon_hash_input": "block_canonical",
            "note": "Derived data. Do not hand-edit; regenerate with tools/gen_data.py.",
        },
        "blocks": blocks,
        "glyphs": glyphs,
    }

    out_json = os.path.join(DATA, "glyphdata.json")
    with open(out_json, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")

    out_js = os.path.join(DATA, "glyphdata.js")
    with open(out_js, "w", encoding="utf-8") as fh:
        fh.write("// Generated by tools/gen_data.py. Do not edit.\n")
        fh.write("// Shim so a file:// page can load this without fetch().\n")
        fh.write("window.GLYPHDATA = ")
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")

    # The authored config needs the same treatment, for the same reason: a file:// page
    # cannot fetch a sibling but can load a <script src>. This shim is emitted from the
    # config Justin edits, never from config.json.orig.
    out_config_js = os.path.join(DATA, "config.js")
    with open(out_config_js, "w", encoding="utf-8") as fh:
        fh.write("// Generated by tools/gen_data.py from config.json. Do not edit.\n")
        fh.write("// Edit data/config.json and re-run the generator.\n")
        fh.write("window.GLYPHCONFIG = ")
        json.dump(config, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")

    print(f"{len(glyphs)} glyphs across {len(blocks)} blocks")
    print(f"  unicodedata UCD {unicodedata.unidata_version}")
    print(f"  block aliases   {pva_file}")
    if unicodedata.unidata_version.split(".")[0] != pva_version.split(".")[0]:
        print(f"  ! version skew: unicodedata {unicodedata.unidata_version} "
              f"against aliases {pva_version}")
    if missing:
        blocks_missing = sorted({ucd_block(chr(int(c, 16))) for c in missing})
        print(f"  ! no official short alias for {len(blocks_missing)} block(s): "
              f"{', '.join(blocks_missing[:6])}")
    if unnamed:
        print(f"  ! unnamed codepoints: {', '.join(unnamed)}")
    print(f"wrote {os.path.relpath(out_json, ROOT)}, {os.path.relpath(out_js, ROOT)} "
          f"and {os.path.relpath(out_config_js, ROOT)}")


if __name__ == "__main__":
    main()
