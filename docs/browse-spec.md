# The browse view

`browse.html`, and the data path behind it. Roadmap curation set 14 asked for a second page
alongside the bench that shows **all the sets, in order, to be scrolled**, with no font
selection, no advance measurement, no spacing detail and no controls, because its purpose is
inspiration rather than measurement.

This file is the viewer half of the curation workstream's spec. `docs/build-spec.md` remains
the bench's and nothing here changes it.

## What runs

    python tools/gen_browse.py            # writes data/browse.json and data/browse.js
    python tools/gen_browse.py --report   # summary to stdout, writes nothing

Then open `browse.html`. It works over `file://` as well as from a server, which is why the
`.js` shim sits beside the `.json` — the same arrangement as `data/config.js`.

## Where the judgement lives

`docs/curation.md` records Justin's rulings in prose. Prose cannot be applied to an
inventory, so `data/curation.json` carries the same rulings as data. It is the durable
overlay curation set 13 asked for: the mechanical pass proposes, the overlay wins, and
re-running a generator stops being destructive.

| File | Holds | Authority |
| --- | --- | --- |
| `data/config.json` | grouping and order | Justin, by hand |
| `data/glyphdata.json` | UCD properties | derived, `gen_data.py` |
| `data/curation.json` | the rulings, as data | Justin, transcribed from `docs/curation.md` |
| `data/browse.json` | what the page draws | derived, `gen_browse.py` |

Every count stated in `docs/curation.md` is written into `data/curation.json` as an `expect`,
and the generator checks all of them. **They currently all pass**, including the ones that
would be easiest to get quietly wrong: cjk radicals −382, music 520 dropped and 88 kept,
games 324 → 153, divination 165 → 28, legacy computing 189 → 75. A mismatch is printed at
generation time and carried into the page footer rather than being swallowed.

## Provenance is on the page

A family Justin ruled on and a family this build guessed at must not look alike, so every
leaf carries a badge:

- **justin** — ruled on, against a rendered sheet
- **visual** — Claude ruled on it by looking, and Justin has not seen it
- **reconstructed** — `docs/curation.md` states the ruling but not its members, so the
  selector is a pattern fitted to the prose and may be wrong
- **proposed** — no ruling exists; the mechanical pass suggested it

Set 13 is explicit that leaf naming is LLM work done by looking, and that blocks, name stems
and codepoint runs are guides rather than authorities. Nothing mechanical here is presented
as a decision.

## How compaction works

Compression is not deletion. Every compressed family states its full count and its range, so
what is folded away can still be found.

- A **sequence family** varies in one enumerable position. It is detected as a run of
  consecutive codepoints (gaps up to 2) whose names share a word-boundary prefix of at least
  8 characters, and it must be at least 5 members long — below that it is a few similar
  glyphs, not a sequence.
- **Naming a family and folding it are different bargains**, so they have different
  thresholds. A run of 5 earns a subheading, which costs nothing. Folding starts at 8,
  because folding 5 members into 2 exemplars hides three distinct glyphs to save three
  cells, and that is a bad trade on a page built for looking.
- **Exemplars are chosen for visual coverage, not taken as bounds.** The playing cards
  established this: the codepoint endpoints are both black and hide half the deck.
- **Combination enumerations** — hexagrams, tetragrams, dominoes, block sextants — get four
  or six exemplars drawn at random and **seeded on the family name**, so the same draw
  returns on every regeneration and diffs stay meaningful. Their endpoints are the
  degenerate corners of the space and describe nothing.

Compaction is applied where `docs/curation.md` rules on it, and additionally across
**`enclosed alphanumerics`**, which Justin scoped. There 745 members fall into sequence
families and a block-grouped remainder, and the group draws 222 cells instead of 745.
`math alphanumerics`
compresses too, because compression is the whole reason its 270 styled glyphs were pulled
back into an inventory that otherwise excludes letters: five families cost 34 cells.

Everything else shows in full.

## Two things the mechanical pass does, and their limits

**Leaves are proposed by name run first, then by block.** A leftover pool that name
morphology cannot carve up falls back to block, which is a hint and not an authority, but as
a subheading it is at least honest about where it came from and it beats one
undifferentiated slab of 325. This is what surfaced `cjk compatibility`, 193 squared katakana
unit abbreviations sitting inside `squares` because their names begin SQUARE.

**Strays from dropped blocks are removed.** A shape rule claims glyphs by name, so
SignWriting circles and emoji circles sat in `circles` while their own groups were dropped
entire — and rendered as tofu, which is noise on a page whose purpose is looking.
`docs/curation.md` rules that dropped means dropped from the inventory and not merely
deselected, so the block goes wherever it landed. **109 strays** are removed this way.

This is the one place the totals here run below `docs/curation.md`. That file's tally was
taken group by group and never counted these, so its figures and this page's differ by
design, not by drift:

| | |
| --- | --- |
| Inventory, with the styled alphanumerics pulled in | 10,070 |
| Dropped groups | 2,975 |
| Strays from those blocks, in other groups | 109 |
| Dropped within a group (music, cjk radicals, number forms, fullwidth, legacy) | 968 |
| **Kept** | **6,018** |
| **Cells drawn** | **4,832** |

`docs/curation.md` projects 6,230. The difference reconciles exactly: it counts 247 styled
alphanumerics where this counts 270 — the same families, but its figure excludes the members
borrowed from Letterlike Symbols — and its tally predates the currency, superscripts, number
forms, fullwidth and legacy-computing rulings recorded further down the same file.

## Rendering

The cell font stack is Noto Sans Symbols 2, Noto Sans Symbols, Noto Sans Math, Noto Music,
then Segoe UI Symbol and DejaVu Sans. Those are named rather than embedded: the first three
are installed on the Fedora machine this was built against, and embedding megabytes of font
into a repo to draw a browse page is not a trade worth making yet. **On a device without
them the page will show more tofu**, and that is a real limit rather than a hidden one.

Some tofu remains regardless — Zanabazar Square is the visible case — because no installed
face covers those blocks. A coverage pass belongs with the vector-coverage work curation set
13 parked, and this page is a good instrument for spotting where it is needed.

## The info box

Hovering or tapping a cell opens the glyph's info box. This is **not a second hover
implementation**: it is `src/hover.js`, the one component roadmap set 8 defines, and only
the skin lives in `browse.html`. So it opens on a delay, autocloses after a period outside,
carries a close button, closes on Escape, opens on tap, and closes on a tap outside.

It carries:

- the glyph, large
- `U+XXXX` and the official Unicode name
- the **block identicon**, plus the block's display name and **both official aliases** —
  the short form and the canonical long form. The short alias is there for propagation:
  anyone using this learns that an official abbreviation already exists, so the tool
  spreads the standard rather than only consuming it.
- `General_Category`, `East_Asian_Width`, `Bidi_Class`. These are the two-letter property
  classes `CLAUDE.md` rules out as table columns and explicitly allows in the info box.
  East_Asian_Width earns its place here more than anywhere: it is the only width Unicode
  itself specifies, and EAW uniformity is the hard constraint in the MarkRight case.
- where the glyph sits — its set and leaf — and, if its family is compressed, that it is
  one of N with the range, so a folded family is still navigable from any member.

It deliberately carries **no advance, no ink extents and no supplying-font guess**. Those
are the bench's answers and this page measures nothing; the box says so.

The identicon hashes `block_canonical`, the official long alias in underscored form, never
a display string. That is what makes the icon portable: any other tool hashing the same
alias draws the same shape with nothing agreed between implementations. Padding is 0, per
`docs/findings.md` 0.2 — the default 0.08 is what makes small icons indistinguishable, far
more than the size does.

**Block-derived leaves carry the identicon in their heading**, at 20px, because set 9 asks
for it wherever a block appears so the association is reinforced rather than taught once.
There are 92 such headings, and the icon in the heading is the same icon that appears in
the info box of every glyph beneath it.

## A limit worth knowing about, in dark mode

The page follows the system colour scheme, and glyphs are drawn in the text colour. On a
dark background **BLACK CIRCLE renders as a filled light disc and WHITE CIRCLE as an
outline**, so filled-against-hollow survives but the ink words in the names stop matching
what is on screen. Nothing is wrong with the rendering; it is what drawing monochrome
glyphs in the foreground colour means. Forcing a permanently light cell background would
fix the names and break the page's fit with the system, and that is Justin's call rather
than one to make silently.

## Deliberately absent

No controls, per set 14. The one navigation aid is an index of set names at the top, which
is not a control in the sense that set rules out — it selects nothing and changes nothing
about what is drawn. Flagged here because it is a judgement call.

No measurement of any kind. That is the bench's job, and the two pages are linked so a
candidate found here can be taken there.

## Open

- The reconstructed selectors — music's 91 dropped and legacy computing's diagonals — hit
  their stated counts, which is evidence but not proof that they select the same members
  Justin ruled on. Only a sheet can settle it.
- Chess fragments into ten proposed six-member leaves. `docs/curation.md` describes the
  ruled families as 23 neutral, 23 white, 23 black rotated plus upright sets, and no ruling
  was encoded because that file says only that they "stay intact".
- The xiangqi pieces are recorded in `docs/curation.md` as belonging visually with
  `circled ideograph` and `negative circled`. That was written as a defect found, not as a
  ruling, so no regroup was applied.
