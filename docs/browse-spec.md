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

## Property filters

Curation set 15 asks for filter dropdowns on `General_Category`, `East_Asian_Width` and
`Bidi_Class` — the same three properties the info box already carries, and the only place
`CLAUDE.md` allows the two-letter classes to appear. They combine with AND, and `reset`
returns the page to exactly the state set 14 describes.

Curation set 16 then took that from three properties to **ninety**: twenty
enumerated and seventy binary, being every property the UCD publishes except the
script-specific ones and the string-valued ones, plus UTS #39's two identifier properties.
What follows describes the built result.

### Where the vocabulary comes from

Nothing about the vocabulary is written by hand. `tools/ucd_props.py` reads it, and the
division of labour is the point:

| What | Source |
| --- | --- |
| Which binary properties exist | `PropList.txt`, `DerivedCoreProperties.txt`, `emoji-data.txt`, read wholesale |
| Enumerated values per codepoint | `DerivedAge.txt`, `LineBreak.txt`, the three `auxiliary/*Break*.txt`, `DerivedNumericType.txt`, `BidiBrackets.txt`, `DerivedNormalizationProps.txt` |
| Long names for values | `PropertyValueAliases-18.0.0.txt`, UAX #44 loose matching |
| Long names for properties | `PropertyAliases.txt` |
| Script and Script_Extensions | fontTools, ISO 15924 |
| The script grouping | CLDR `scriptMetadata.txt`, field 5, UAX #31 identifier usage |
| The prose in every info popup | `data/property-notes.json` — **authored, first pass by Claude** |

Only the last row is written rather than read. Binary properties are read wholesale rather
than listed, so the next UCD version's additions arrive without an edit; an unresolved
value alias is printed at generation time rather than silently falling back.

The alias reader indexes **every** alias on a line, not just the short one, because the UCD
files disagree about which form they use — `GraphemeBreakProperty.txt` writes the long
`Regional_Indicator` where `PropertyValueAliases.txt` files it under short `RI`.

### Version matching

The property files are vendored at **UCD 16.0.0** under `data/ucd-16.0.0/`, which is what
this Python's `unicodedata` and fontTools' script data both report. Mixing a 16.0.0
inventory with an 18.0.0 property file would put values on glyphs that did not carry them.
`PropertyValueAliases-18.0.0.txt` is the deliberate exception: it supplies long names only,
and value aliases are added and never removed, so a later file resolves an earlier file's
values and resolves strictly more of them.

### The three filters that are not plain equality

- **Age is a threshold**, not an equality: "not after 3.2" keeps everything assigned in 3.2
  or earlier, and the option labels carry the cumulative count for that reason. This is the
  one property whose useful question is cumulative — a font cannot contain a character that
  did not exist when it was built.
- **Script collapses into groups.** 103 script values appear on the page and 83% of cells
  are `Zyyy`, so a flat list would be one enormous option and a long tail. The groups are
  UAX #31 identifier usage as CLDR publishes it — `RECOMMENDED`, `LIMITED_USE`, `EXCLUSION`
  — with Common and Inherited lifted out. Individual scripts stay selectable underneath.
- **Script_Extensions is a checkbox on the Script filter**, not a filter of its own. It
  widens the match rather than asking a separate question, which is what the property
  means. It changes the answer for 121 cells.
- **Identifier_Type is set-valued.** A codepoint can be restricted for several reasons at
  once — 709 cells carry more than one — so the filter asks whether a reason is among them
  rather than whether it is the value. Counted per reason for the same reason.

### Encoding

Enumerated values are stored on a cell only where they differ from the property's default,
and the page supplies the default when it filters — `Word_Break` is `Other` for 4,532 of
4,832 cells, and storing that would cost more than the glyph data. The seventy binary
properties are one hex bitmask per cell. Bit indices run past 31, so the page reads the mask
a hex digit at a time; JavaScript's bitwise operators truncate to 32 bits and would have
silently dropped every property after the thirty-second. The whole addition costs 378 KiB.

### Inert filters are drawn anyway

Twenty-one of the ninety hold for no cell on the page, for every cell, or take one
value across the whole page. They are drawn disabled, with the reason in the info popup,
because that a property is inert **here** is a finding about the inventory rather than a
reason to hide the control. `Default_Ignorable_Code_Point` matching nothing follows from an
inventory built of things that draw; `Grapheme_Base` matching everything says the inventory
is all standalone characters; `Canonical_Combining_Class` being 0 throughout says nothing in
it is a combining mark.

### Two things worth stating plainly, and the page states them

- **The filter acts on cells drawn, not on glyphs kept.** 4,832 against 6,018. A compressed
  family is represented by its exemplars, so its folded members are not filtered, and a
  family whose exemplars miss a property may still hold members that carry it. This is the
  one place compaction costs something rather than just saving space.
- **Counts follow the filter everywhere.** Set headings, leaf headings and the index all
  show the matching count, empty leaves and empty sets disappear entirely, and the
  `N of 4,832` readout is the total. The "2 of 745 shown" folding note is suppressed while
  a filter is active, because it describes the unfiltered drawing.

### Ordered by what a renderer does, not by what a font has

Set 22 orders the panel: **Rendering and presentation** first, then **Breaking and
segmentation**, then Vintage, Script, and the rest. `Line_Break` sits with the other three
break properties rather than under rendering, so "wherever break-before and break-after
live" is one place.

The split behind that ordering is the useful part. `Age` and `Script` predict **whether a
font has the glyph**. Everything above them predicts **how a renderer treats it**. At the
scanning stage those are different questions, and only the second decides whether two
characters can be used together.

### The peer set, and the two actions on it

Twelve properties answer "will a renderer treat these characters alike?" — General_Category,
East_Asian_Width, Line_Break, Grapheme_Cluster_Break, Word_Break, Bidi_Class,
Bidi_Paired_Bracket_Type, Vertical_Orientation, Emoji_Presentation, Extended_Pictographic,
Bidi_Mirrored, Default_Ignorable_Code_Point.

They are declared **once**, as `ucd_props.PEERS`, and carried into `browse.json`. The info
box renders that list and `filter to peers` applies that list, so the table you read and the
filter you get cannot drift apart. Age and Script are deliberately absent from both.

- **Clicking the glyph copies it.** Async clipboard API, with the selection-based route as
  fallback, since `file://` is a secure context in Chrome and Firefox but need not be
  wherever this page is opened.
- **`filter to peers` sets all twelve at once**, to that glyph's own values — the strict
  reading of peerhood. Each lands as a chip on the bar, so loosening is one click per
  property rather than assembling the query by hand. Inert properties are skipped, since
  they select nothing.

Both are wired by delegation on `data-copy` and `data-peers`, because `src/hover.js` owns
the popup's markup and sets it with `innerHTML`; binding at build time would have meant
changing the shared component's contract for the sake of two buttons.

### Not offered, and why

Set 17 fixes what may count as a reason. **A property is excluded for what it is, never
because it is unused on the current selection.** The inventory is a working choice — the
filters themselves make it re-openable, since a property filter can pick a candidate out of
a much larger pool — and the only durable exclusion is script writing characters. This is
why an inert filter is drawn disabled rather than dropped, and it cost one correction on the
way in: `Vertical_Orientation` had been excluded as "script-specific" on the argument that a
filter over it "would be mostly empty". It is neither script-specific nor empty here (1,922
upright against 2,771 rotated) and is now offered.

The panel says the rest on the page rather than only here, so that each absence reads as a
decision. **Script text writing** properties come out in four clusters of one kind — Indic syllable
structure, Arabic and Syriac cursive joining, Hangul composition, and the CJK
radical-to-ideograph mapping. Their values describe a role inside one script rather than
anything about the character, which makes this the *same* rule as the glyph-level exclusion
of set 17 rather than a second one beside it.

Set 18 fixes the discriminator, because the obvious one is wrong: **totality proves
nothing.** Every enumerated UCD property has a value for every codepoint —
`Indic_Syllabic_Category` defaults to `Other`, `Hangul_Syllable_Type` to `NA`,
`Joining_Type` to `Non_Joining`. What matters is what the value is a *statement about*.
Exclude where the **property** is one script's machinery; keep it where merely some of its
**values** name scripts. So `Line_Break` (Hangul, South East Asian values), `Word_Break`
(Katakana) and `Bidi_Class` (Arabic) all stay — each makes a claim about any character —
while `Joining_Type = Non_Joining` makes no claim about the character at all, only about
Arabic and Syriac.

**String-valued** properties have no finite set to choose from. `Bidi_Mirroring_Glyph` is the one that needed a ruling: it is a mapping,
so `Bidi_Mirrored` is offered as the filter and the mapping itself appears in the cell info
box. 542 cells are mirrored but only 416 have a partner listed, the rest being for the
renderer to flip with no other character to flip to.

`Line_Break` and `Bidi_Paired_Bracket_Type` were deferred by name in `CLAUDE.md` and are now
offered, by Justin's ruling on set 16. The deferral stands for table columns and no longer
stands for filters.

## Deliberately absent

No controls beyond the filters above, per set 14. The other navigation aid is an index of
set names at the top, which selects nothing and changes nothing about what is drawn.
Flagged here because it is a judgement call.

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
