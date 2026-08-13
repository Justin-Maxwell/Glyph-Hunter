# Debt

Running list of known-trivial defects and small improvements. Fixed opportunistically,
alongside feature work, rather than as a work item of their own.

Tana node IDs in brackets point at the session record that raised the item.

## sysfont.py

- **Largest-uniform-subset not reported** `[fGCdGiHoDLZN]`
  - The final `clean` comprehension gates on `len(m) == len(cps)`.
  - So a face carrying all-but-one of the set is dropped entirely.
  - Observed: the Android run had ten of twelve uniform at 796 and reported nothing.
- **Failure message asserts an unestablished cause**
  - `"none — every face that has the whole set splits it across widths"`.
  - Reachable by two different routes: no face carries the whole set, or faces split widths.
  - On the Android run it printed the second explanation for the first situation.
- **`--match` semantics are loose**
  - Filters faces where *any* glyph in the set has that advance.
  - Reads as though it means *all*.
- **TTCollection is not closed**
  - Individual faces are closed; the collection handle is not.

## glyph-bench.html

- **Verdict is binary**
  - Uniform or not-uniform, with no largest-uniform-subset.
  - Same shape as the sysfont defect above.
- **Ruler tick labels collide**
  - Observed in Justin's screencap: `594`/`604` overprint, and `836`/`838` overprint.
  - Labels are absolutely positioned from the advance value with no collision handling.
  - Worst exactly where it matters most, since near-equal advances are the interesting case.
- **Zero and single-value advances break a log scale**
  - A missing glyph can report a zero advance, and `log(0)` is negative infinity.
  - A set with one width group gives a zero log span, so the position divides by zero.
  - The linear code guards the second case with `(max-min) || 1`; the log form needs both.
- **notdef detection is heuristic**
  - Compares each advance against the advance of U+10FFFD.
  - A glyph legitimately sharing that advance reads as missing.
- **No Bidi_Mirrored data**
  - Five members of the circled run are mirrored, which disqualifies them as
    structural markers, and no measurement surfaces it.
- **No General_Category data**
  - The Sm-versus-So question `[p198idbJ6rvc]` is not visible in the readout.
- **`chars()` is dead code**
  - Defined, never called, and its filter expression is incoherent.
- **`CSS.escape ? fam : fam`**
  - Both branches identical; the guard does nothing.
  - Family is set again via `style.fontFamily` on the next line anyway.
  - Evidently an attempt at the quoting defect below, abandoned half-written.
- **Unquoted family names silently drop one preset**
  - `Noto Sans Symbols 2` is invalid CSS unquoted: an identifier may not begin with a
    digit, so the whole declaration is dropped.
  - Affects `ctx.font` at line 266 and `style.fontFamily` at lines 262, 292 and 333.
  - Consequence: selecting that preset measures the *previously selected* font under the
    new font's label. One of fifteen presets; the rest are unaffected.
  - Verified against the bench's own assignments. See `docs/findings.md`.
- **Adjacency shift is measured with the wrong instrument**
  - `measureText(anchor + g).width - anchorW` cannot separate re-itemisation from kerning,
    and canvas resolves fallback differently from DOM layout in at least one case, so it
    can report a width the page never draws.
  - Settled in `docs/findings.md` §0.1; the rebuild measures it in the DOM.

## Both

- **No export**
  - Cross-platform comparison `[FKOJuVo1r5JH]` is done by eye.
- **Candidate sets drift between the two tools**
  - Each carries its own hardcoded default.
