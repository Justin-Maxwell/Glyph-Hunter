# Proposals

Claude-originated feature ideas. **None of these is agreed.** They are parked here so
they survive a session without competing with Justin's own direction, which is what
drives the work.

Mirrors the `From Claude` convention used in the Tana memos: raised, not adopted.

Status vocabulary: `unassessed` · `accepted` · `declined` · `superseded`.

---

## Bidi_Mirrored and General_Category columns

- Status: declined as columns, deferred as content, 2026-08-13
- Raised: 2026-08-13

Declined in the form proposed. The table is short of horizontal space, and Justin has
deferred property classes generally until the need is seen repeatedly and directly.

If they arrive they belong in the info box as detail on demand, not as columns.

A conforming renderer swaps mirrored characters in an RTL paragraph, which is fatal for
a structural marker. Five members of the circled run carry the property, and it
eliminated three candidates. No measurement surfaces it.

- Adds two columns to the bench's per-glyph table.
- Two small static tables, no dependency.
- Would also make the Sm-versus-So question `[p198idbJ6rvc]` visible per glyph.

## Largest uniform subset

- Status: superseded, 2026-08-13
- Raised: 2026-08-13

Superseded twice over. The bench's width-groups block already shows the clusters
visually, so the bench needs nothing. And the meaningful version is not *uniform within
one font* but *co-grouped across every font tested*, which is now Justin's own recording
item in `ROADMAP.md`.

What survives is narrow: `sysfont.py` should present the same cluster model the bench
does, which is convergence rather than a feature.

Both tools answer *is this set uniform*. The decision needs *what is the largest subset
that is uniform, and how big*.

- Replaces the binary verdict with a ranked subset report.
- Shared logic across `sysfont.py` and `glyph-bench.html`.
- Clears the `sysfont.py` defect `[fGCdGiHoDLZN]` as a side effect.

## Pairwise adjacency matrix

- Status: unassessed
- Raised: 2026-08-13

Adjacency changes which font supplies a glyph `[_dIZLPJuzdij]`. The bench measures each
glyph against one shared anchor, so a shift caused by a *neighbour within the set* is
invisible.

- Measures every glyph beside every other in the set.
- Flags pairs whose advance changes.
- Instruments a discovery that was made by hand.

## Export and cross-platform diff

- Status: subsumed, 2026-08-13
- Raised: 2026-08-13

Subsumed by Justin's recording item in `ROADMAP.md`, which is the same machinery with a
better purpose: not diffing two runs by eye, but accumulating runs and asking which
glyphs never split.

Comparing Android against Fedora `[FKOJuVo1r5JH]` is currently done by eye.

- JSON out, JSON back in, diff two runs.
- Makes the patch-font decision `[2mxhJ-jYB0t3]` evidentiable rather than remembered.

## Parked raw material

- Status: parked, not proposed, 2026-08-13

A byproduct of demonstrating that name morphology cannot reach a functional grouping.
Recorded so it is not re-derived. **Not queued, and not to be acted on.**

- Glyphs that share a role with `◡` across seven blocks, found by role rather than by name.
  Retrievable from session `DP1Wkr1y32iS` if ever wanted.

## Font-in-use in the glyph info box

- Status: unassessed, raised by Justin as a question 2026-08-13
- Not in `docs/build-spec.md`. Do not build it as part of that spec.

Justin asked whether showing the font actually supplying a glyph is viable in the browser
popup. Short answer: not by any API, but by measurement yes — and most of the machinery
already exists.

### No API reports it

- `getComputedStyle().fontFamily` returns the **declared** list, not what was used.
- `document.fonts.check()` covers loaded `@font-face` faces only, not system fallback, and
  answers liberally.
- There is no `renderedFont` property in any browser. DevTools has the information and does
  not expose it to script.

### Metric fingerprinting does work, and the pieces are already here

- `sysfont.py` already measures every face on the device and reports the advance each
  assigns each codepoint. That is a lookup table.
- The bench already measures what the renderer produced.
- The current footer even describes the manual version: measure on screen, then find the
  number in the table.
- So the gap is only that the table lives in stdout rather than in a file the bench can
  load. Have `sysfont.py` emit JSON and the lookup becomes automatic.

**Strengthen it by fingerprinting on the vector, not one number.** A single advance is not
unique — many faces use 1000 or 604. But `TextMetrics` gives five numbers per glyph:
`width`, `actualBoundingBoxAscent`, `Descent`, `Left`, `Right`. Across ten glyphs that is
fifty numbers, which should be near-unique among the hundred-odd faces on a device.

Honest limits:

- Requires `sysfont.py` to have been run on that device first. Device-local, two-step, not
  automatic on a fresh machine.
- Produces a **candidate set** where metrics collide, not a single answer. Say so in the
  popup rather than picking one.
- A subsetted system build may not match its upstream namesake. The confirmed Android
  supplier is `NotoSansSymbols-Regular-Subsetted.ttf`, whose metrics need not equal any
  distributable Noto Sans Symbols — which is precisely why measuring beats naming.

### `queryLocalFonts()` is a second route, probably not on the platform that matters

- Chromium's Local Font Access API returns installed families and can hand back the font
  **blob**, so the browser could parse tables directly and do sysfont's job in-page.
- Requires a permission prompt and a secure context.
- Believed unavailable on Android Chrome, which is the platform this question matters most
  for. **Unverified** — worth a check, since if it works the whole problem collapses.

### Why this is more interesting than it looks

On Android, per-glyph font readout otherwise needs a USB cable and desktop DevTools. An
in-page identification would make the bench the only font-naming instrument available on
the device — which is a stronger justification for the tool than metrology alone.
