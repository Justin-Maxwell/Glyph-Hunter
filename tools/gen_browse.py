#!/usr/bin/env python3
"""
gen_browse — fold the curation rulings into the inventory and emit the browse view's data.

    python tools/gen_browse.py            # writes data/browse.json and data/browse.js
    python tools/gen_browse.py --report   # summary to stdout, writes nothing

Three inputs, three different kinds of authority, and the point of this script is to keep
them apart:

    data/config.json     authored grouping. Justin's, edited by hand.
    data/glyphdata.json  derived properties. gen_data.py's.
    data/curation.json   authored judgement. The rulings in docs/curation.md, as data.

The mechanical pass proposes; the overlay wins. That is roadmap curation set 13, and it is
why a leaf carries its provenance all the way to the page: a family Justin ruled on and a
family this script guessed at look different on screen, deliberately.

Compression is not deletion. Every compressed family states its range and its full count,
so what is folded away can still be found - see docs/curation.md, "Exemplars are not range
bounds", for why the exemplars themselves are chosen rather than taken from the ends.
"""

import argparse
import json
import os
import random
import re
import sys
import unicodedata as u

try:
    from fontTools.unicodedata import block as ucd_block
except ImportError:
    sys.exit("fontTools is missing.  pip install fonttools")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

# A run of consecutive codepoints whose names share a word-boundary prefix this long is
# taken to be one family. Both figures were set by looking at what they produce on
# enclosed alphanumerics, where 757 members fall into 27 families and a remainder.
MIN_PREFIX = 8
MAX_GAP = 2         # codepoints may skip a hole this wide and stay one run
MIN_SEQUENCE = 5    # shorter than this is not a sequence, it is a few similar glyphs
# Naming a family and folding it are different bargains. Folding 5 members into 2 hides
# three distinct glyphs to save three cells, which is a bad trade on a page built for
# looking. Naming those 5 costs nothing, so the two thresholds are not the same number.
MIN_COMPRESS = 8


# ---------------------------------------------------------------- selectors

def parse_cps(spec):
    """"1F0A1-1F0DE" or "2460" -> set of ints."""
    out = set()
    for item in spec:
        if "-" in item:
            lo, hi = item.split("-", 1)
            out.update(range(int(lo, 16), int(hi, 16) + 1))
        else:
            out.add(int(item, 16))
    return out


def matches(sel, rec):
    """One selector against one glyph. Keys within a selector are ANDed."""
    if "block" in sel and rec["block"] != sel["block"]:
        return False
    if "blocks" in sel and rec["block"] not in sel["blocks"]:
        return False
    if "name" in sel and not re.search(sel["name"], rec["name"]):
        return False
    if "not_name" in sel and re.search(sel["not_name"], rec["name"]):
        return False
    if "cps" in sel and rec["cp"] not in parse_cps(sel["cps"]):
        return False
    if "gc" in sel and rec["gc"] != sel["gc"]:
        return False
    return True


def select(sels, pool):
    """Union over a list of selectors, preserving pool order."""
    return [r for r in pool if any(matches(s, r) for s in sels)]


# ---------------------------------------------------------------- family detection

def word_prefix(a, b):
    """Longest common prefix of two names, cut back to a word boundary."""
    n = 0
    for x, y in zip(a, b):
        if x != y:
            break
        n += 1
    p = a[:n]
    if n < len(a) and n < len(b) and not p.endswith(" "):
        p = p.rsplit(" ", 1)[0] if " " in p else ""
    return p.strip()


def detect_runs(pool):
    """Split a codepoint-ordered pool into runs that vary in one enumerable position.

    This is the mechanical first pass, and roadmap curation set 13 is explicit that name
    morphology is a guide and not an authority. Everything it produces is marked
    provenance "rule" so the page can say so.
    """
    runs, cur = [], None
    for rec in sorted(pool, key=lambda r: r["cp"]):
        if cur is None:
            cur = {"recs": [rec], "stem": rec["name"], "last": rec["cp"]}
            continue
        gap = rec["cp"] - cur["last"]
        p = word_prefix(cur["stem"], rec["name"])
        if 0 < gap <= MAX_GAP and len(p) >= MIN_PREFIX:
            cur["recs"].append(rec)
            cur["stem"] = p
            cur["last"] = rec["cp"]
        else:
            runs.append(cur)
            cur = {"recs": [rec], "stem": rec["name"], "last": rec["cp"]}
    if cur:
        runs.append(cur)
    return runs


def tidy_stem(stem, group):
    """A run's shared prefix, made readable as a leaf name."""
    s = stem.strip().lower()
    for noise in ("musical symbol ", "modifier letter ", "combining "):
        if s.startswith(noise):
            s = s[len(noise):]
    return s or group


# A leftover pool that name morphology could not carve up falls back to block, which
# Justin calls a hint for grouping and not an authority. As a subheading a block name is
# at least honest about where it came from, and it beats one undifferentiated slab of 325.
MIN_BLOCK_LEAF = 6


def split_by_block(recs):
    """Secondary axis for whatever the run detector could not place."""
    byblk = {}
    for r in recs:
        byblk.setdefault(r["block"], []).append(r)
    named, rest = [], []
    for blk, rs in sorted(byblk.items(), key=lambda kv: -len(kv[1])):
        if len(rs) >= MIN_BLOCK_LEAF:
            named.append((blk, rs))
        else:
            rest.extend(rs)
    return named, rest


# ---------------------------------------------------------------- exemplars

def exemplars(recs, mode, seed, n):
    """Which members of a compressed family are shown.

    "ends" is the general rule. "random" is scoped to combination enumerations, whose
    endpoints are the degenerate corners of the space and describe nothing - the seed is
    the family name so the same draw returns on every regeneration.
    """
    if mode == "random":
        rng = random.Random(seed)
        picked = rng.sample(recs, min(n, len(recs)))
        return sorted(picked, key=lambda r: r["cp"])
    if mode == "ends":
        return [recs[0], recs[-1]] if len(recs) > 1 else recs[:]
    raise SystemExit(f"unknown exemplar mode {mode!r}")


# ---------------------------------------------------------------- leaf assembly

def make_leaf(name, recs, *, disposition, provenance, unsure=False, note=None,
              exemplar_mode="ends", exemplar_cps=None, exemplar_n=4):
    """One subheading on the page. Compressed leaves keep range and count regardless."""
    recs = sorted(recs, key=lambda r: r["cp"])
    leaf = {
        "name": name,
        "disposition": disposition,
        "provenance": provenance,
        "n": len(recs),
        "range": [f"{recs[0]['cp']:04X}", f"{recs[-1]['cp']:04X}"] if recs else None,
    }
    if unsure:
        leaf["unsure"] = True
    if note:
        leaf["note"] = note

    if disposition == "compress":
        if exemplar_cps:
            want = parse_cps(exemplar_cps)
            shown = [r for r in recs if r["cp"] in want]
        else:
            shown = exemplars(recs, exemplar_mode, name, exemplar_n)
    else:
        shown = recs
    leaf["cells"] = [cell(r) for r in shown]
    leaf["shown"] = len(shown)
    return leaf


def cell(rec):
    # block_canonical is the identicon's hash input, and roadmap set 8 is the reason it is
    # carried rather than derived from the display name: the icon is portable only because
    # every tool hashes the same official long alias.
    return {
        "cp": f"{rec['cp']:04X}",
        "c": chr(rec["cp"]),
        "name": rec["name"],
        "gc": rec["gc"],
        "eaw": rec["eaw"],
        "bidi": rec.get("bidi", ""),
        "block": rec["block"],
        "block_short": rec.get("block_short", rec["block"]),
        "block_canonical": rec.get("block_canonical", ""),
    }


# ---------------------------------------------------------------- the pass

def build(config, glyphdata, curation, warn):
    by_cp = {}
    for g in glyphdata["glyphs"]:
        cp = int(g["cp"], 16)
        by_cp[cp] = {"cp": cp, "name": g["name"], "gc": g["gc"], "eaw": g["eaw"],
                     "bidi": g.get("bidi", ""), "block": g["block"],
                     "block_short": g.get("block_short", g["block"]),
                     "block_canonical": g.get("block_canonical", "")}

    # Display name -> the official aliases, so a glyph pulled in below gets the same
    # canonical hash input as one that came through gen_data.py.
    alias = {b["display"]: b for b in glyphdata["blocks"].values()}

    group_of = {}
    order = []
    for grp in config["groups"]:
        order.append(grp["name"])
        for h in grp["members"]:
            group_of[int(h, 16)] = grp["name"]

    # -- glyphs pulled back into the inventory. The inventory rule excludes letters and
    # digits of every script, so the styled alphanumerics were never in glyphdata.json.
    # Their properties are computed here rather than by widening that rule.
    for pull in curation.get("pull_in", []):
        target = pull["group"]
        if target not in order:
            order.insert(order.index(pull.get("after", order[-1])) + 1, target)
        for cp in sorted(parse_cps(pull["cps"])):
            ch = chr(cp)
            try:
                name = u.name(ch)
            except ValueError:
                continue
            if cp not in by_cp:
                blk = ucd_block(ch)
                a = alias.get(blk, {})
                by_cp[cp] = {"cp": cp, "name": name, "gc": u.category(ch),
                             "eaw": u.east_asian_width(ch), "bidi": u.bidirectional(ch),
                             "block": blk,
                             "block_short": a.get("short", blk),
                             "block_canonical": a.get("canonical", blk.replace(" ", "_"))}
            group_of[cp] = target

    # -- regroups. docs/curation.md records these as defects found while looking: a shape
    # rule claimed a glyph that belongs with its family. The overlay wins.
    for rg in curation.get("regroup", []):
        for cp in sorted(parse_cps(rg["cps"])):
            if cp in group_of:
                group_of[cp] = rg["to"]

    # -- leakage. A shape rule claims glyphs by name, so SignWriting circles and emoji
    # circles sit in `circles` while their own group is dropped entire. docs/curation.md
    # is explicit that dropped means dropped from the inventory, not merely deselected,
    # so the block goes wherever it landed. The count is reported separately because the
    # tally in that file was taken group by group and does not include these.
    leak_blocks = set(curation.get("drop_blocks", []))
    drop_names = {d["group"] for d in curation.get("drop_groups", [])}
    leaked = 0
    for cp in list(group_of):
        rec = by_cp.get(cp)
        # Members sitting in their own dropped group are left alone, so that group's
        # count still reconciles against docs/curation.md. Only strays are removed here.
        if rec and rec["block"] in leak_blocks and group_of[cp] not in drop_names:
            leaked += 1
            del group_of[cp]

    members = {}
    for cp, grp in group_of.items():
        if cp in by_cp:
            members.setdefault(grp, []).append(by_cp[cp])
    for v in members.values():
        v.sort(key=lambda r: r["cp"])

    dropped_groups = {d["group"]: d for d in curation.get("drop_groups", [])}
    rulings = {r["group"]: r for r in curation.get("rulings", [])}
    auto_compress = set(curation.get("auto_compress", []))

    out_groups, dropped_record = [], []
    for name in order:
        pool = members.get(name, [])
        if not pool:
            continue
        if name in dropped_groups:
            d = dropped_groups[name]
            check(warn, f"drop {name}", len(pool), d.get("expect"))
            dropped_record.append({"group": name, "n": len(pool),
                                   "reason": d.get("reason", "")})
            continue

        leaves, taken, n_dropped = [], set(), 0
        for rule in rulings.get(name, {}).get("leaves", []):
            hit = [r for r in select(rule["select"], pool) if r["cp"] not in taken]
            if not hit:
                warn(f"{name}: leaf {rule.get('leaf', rule['disposition'])!r} matched nothing")
                continue
            taken.update(r["cp"] for r in hit)
            check(warn, f"{name}/{rule.get('leaf', rule['disposition'])}",
                  len(hit), rule.get("expect"))
            if rule["disposition"] == "drop":
                n_dropped += len(hit)
                continue
            leaves.append(make_leaf(
                rule.get("leaf") or rule["disposition"], hit,
                disposition=rule["disposition"],
                provenance=rule.get("provenance", "justin"),
                unsure=rule.get("unsure", False),
                note=rule.get("note"),
                exemplar_mode=rule.get("exemplars", "ends"),
                exemplar_cps=rule.get("exemplar_cps"),
                exemplar_n=rule.get("exemplar_n", 4)))

        rest = [r for r in pool if r["cp"] not in taken]
        compress_rest = name in auto_compress
        unplaced = []
        for run in detect_runs(rest):
            if len(run["recs"]) >= MIN_SEQUENCE:
                leaves.append(make_leaf(
                    tidy_stem(run["stem"], name), run["recs"],
                    disposition=("compress"
                                 if compress_rest and len(run["recs"]) >= MIN_COMPRESS
                                 else "keep"),
                    provenance="rule"))
            else:
                unplaced.extend(run["recs"])
        if unplaced:
            named, rest = split_by_block(unplaced)
            for blk, rs in named:
                leaf = make_leaf(blk.lower(), rs,
                                 disposition="keep", provenance="rule",
                                 note="grouped by block only - no shape rule and "
                                      "no name run reached these")
                # Set 9: the identicon must appear everywhere a block appears, so the
                # association gets reinforced rather than taught once. A leaf that *is* a
                # block is one of those places.
                leaf["block_canonical"] = rs[0].get("block_canonical", "")
                leaf["block_short"] = rs[0].get("block_short", "")
                leaves.append(leaf)
            if rest:
                leaves.append(make_leaf("unplaced", rest,
                                        disposition="keep", provenance="rule"))

        expect_kept = rulings.get(name, {}).get("expect_kept")
        kept = sum(l["n"] for l in leaves)
        check(warn, f"{name} kept", kept, expect_kept)

        out_groups.append({
            "name": name,
            "n": len(pool),
            "kept": kept,
            "dropped": n_dropped,
            "shown": sum(l["shown"] for l in leaves),
            "leaves": leaves,
        })

    return out_groups, dropped_record, leaked


def check(warn, what, got, expect):
    if expect is not None and got != expect:
        warn(f"{what}: expected {expect}, got {got}")


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true", help="summarise, write nothing")
    args = ap.parse_args()

    def load(fn):
        with open(os.path.join(DATA, fn), encoding="utf-8") as fh:
            return json.load(fh)

    config, glyphdata, curation = load("config.json"), load("glyphdata.json"), load("curation.json")

    warnings = []
    groups, dropped, leaked = build(config, glyphdata, curation, warnings.append)

    total = sum(g["n"] for g in groups) + sum(d["n"] for d in dropped) + leaked
    kept = sum(g["kept"] for g in groups)
    shown = sum(g["shown"] for g in groups)
    print(f"{total} in inventory, {sum(d['n'] for d in dropped)} in dropped groups, "
          f"{leaked} strays from those blocks removed from other groups, "
          f"{kept} kept, {shown} cells shown\n")
    print(f"{'group':38}{'n':>6}{'kept':>6}{'cells':>7}  leaves")
    print("-" * 78)
    for g in groups:
        print(f"{g['name']:38}{g['n']:>6}{g['kept']:>6}{g['shown']:>7}  {len(g['leaves'])}")
    if dropped:
        print("\ndropped entire:")
        for d in dropped:
            print(f"  {d['n']:>6}  {d['group']} - {d['reason']}")

    if warnings:
        print(f"\n{len(warnings)} count mismatches against docs/curation.md:")
        for w in warnings:
            print(f"  ! {w}")

    if args.report:
        return

    out = {
        "_note": "Derived data. Do not hand-edit; regenerate with tools/gen_browse.py.",
        "provenance": {
            "from": ["data/config.json", "data/glyphdata.json", "data/curation.json"],
            "rulings_source": curation.get("_source", "docs/curation.md"),
            "ucd": glyphdata["provenance"]["ucd_unicodedata"],
            "totals": {"inventory": total, "kept": kept, "cells": shown,
                       "strays_removed": leaked},
            "mismatches": warnings,
        },
        "dropped_groups": dropped,
        "groups": groups,
    }
    path = os.path.join(DATA, "browse.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print(f"\nwrote {os.path.relpath(path, ROOT)}")

    # The shim exists so the page opens over file:// as well as from a server, which is
    # the same reason data/config.js sits beside data/config.json.
    shim = os.path.join(DATA, "browse.js")
    with open(shim, "w", encoding="utf-8") as fh:
        fh.write("// Generated by tools/gen_browse.py. Do not edit.\n")
        fh.write("window.BROWSE_DATA = ")
        json.dump(out, fh, ensure_ascii=False)
        fh.write(";\n")
    print(f"wrote {os.path.relpath(shim, ROOT)}")


if __name__ == "__main__":
    main()
