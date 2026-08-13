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

Cleared by the rebuild of 2026-08-13. Kept, struck through, so the same defects are not
reintroduced and so the record of what the old build got wrong survives.

- ~~**Verdict is binary**~~ — verdicts are gone entirely (ROADMAP set 3). The
  largest-uniform-subset it lacked exists as `core.largestUniformSubset` and is tested, but
  is deliberately **not surfaced**: nothing in the build spec asks for it on screen.
- ~~**Ruler tick labels collide**~~ — labels stagger downward on collision, ticks keep
  their true positions, and the depth of the stagger sets the ruler height.
- ~~**Zero and single-value advances break a log scale**~~ — both guarded in
  `core.logPosition`, both tested.
- ~~**No Bidi_Mirrored data**~~ / ~~**No General_Category data**~~ — both in the info box,
  with Bidi_Class and East Asian Width beside them.
- ~~**`chars()` is dead code**~~ / ~~**`CSS.escape ? fam : fam`**~~ — neither survives the
  rebuild.
- ~~**Unquoted family names silently drop one preset**~~ — quoting happens in
  `core.cssFamily`, in the reader, so the authored config never has to know. The test
  asserts both that a quoted family applies and that an unquoted one is still dropped.
- ~~**Adjacency shift is measured with the wrong instrument**~~ — measured in the DOM with
  a Range per character. Settled in `docs/findings.md` 0.1.

Still open:

- **notdef detection is heuristic**
  - Compares each advance against the advance of U+10FFFD.
  - A glyph legitimately sharing that advance reads as missing.
  - Not fixed, but no longer silent: the flag reads `notdef?` and its tooltip says it is a
    guess and why. There is no better test available in a browser.
- **Width groups shatter on sub-pixel noise if advances are not rounded**
  - Found during the rebuild: measuring to two decimals turned 576 width groups into 662,
    with `151.02` and `151.03` reading as distinct widths.
  - Fixed by rounding to whole units per 1000 em, which is 0.2px at the default size.
  - Recorded because the fix is one `Math.round` and its absence is invisible — the display
    looks precise rather than wrong.

## Both

- **No export**
  - Cross-platform comparison `[FKOJuVo1r5JH]` is done by eye.
- **Candidate sets drift between the two tools**
  - `glyph-bench.html` now reads `data/config.json`; `sysfont.py` still carries its own
    hardcoded default. The drift is now one-sided rather than mutual.
- **No supplying-font fingerprint data**
  - The browser-independent arm of the font guesser needs a committed advance table from
    `sysfont.py`, which does not emit one. Until it does, that evidence source reports
    itself unavailable — correctly, but it is the arm that has to carry every browser
    without the Local Font Access API.
