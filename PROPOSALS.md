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
