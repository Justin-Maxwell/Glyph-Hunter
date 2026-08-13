# Roadmap

Justin's direction. **This drives the work.** Claude-originated ideas live in
`PROPOSALS.md` and do not compete with anything here.

Status vocabulary: `stated` · `assessed` · `in progress` · `done`.

---

## Standing design constraint: keep a TUI viable

- Status: stated, 2026-08-13
- Not a deliverable. A constraint on how everything else is built.

A terminal implementation is wanted eventually. Decisions taken now should not have to
be unpicked to get there.

What that implies, for assessment:

- Measurement logic separated from presentation, so a third front end is a new view
  rather than a rewrite.
- One shared record shape for a measured glyph, used by every front end.
- No decision logic living inside DOM manipulation.

## Standing design constraint: stay browser agnostic

- Status: stated, 2026-08-13
- Not a deliverable. A constraint on how everything else is built.
- Explicitly in the same vein as keeping a TUI viable.

Chrome is where the work is being done, not what the tool is for. Anything that only Chrome
can do is an enhancement over a path that works without it, never the path itself.

What that implies, for the font guesser of set 13:

- **Both are built, together.** The Chrome-specific route — `queryLocalFonts()` — and the
  browser-independent fallback of metric fingerprinting. The fallback is not a later
  retrofit for browsers that turn out to lack the good API.
- Capability is decided by feature detection, never by sniffing the user agent.
- Safari, Firefox, Chrome for Android and the rest are **later**. The constraint is that
  reaching them should not require unpicking anything, not that they are addressed now.

Claude's assessment, following: the fallback path is the one that must be trusted furthest
from where it can be checked, so it is the one that needs the evidence. That is what makes
the DevTools-protocol oracle in `docs/findings.md` worth having — Chrome can be made to
report which face it actually used, so the browser-independent guesser can be scored
against ground truth here before it is relied on somewhere that offers none.

## Set 1, 2026-08-13

### Vertical space

- Status: stated

Using the tool means heavy up-and-down scrolling. Layout should be adjusted to reduce
it, and selectors kept small.

### Adjacency anchor does nothing

- Status: stated
- Justin reports the control has no observable effect.
- Considered fairly important to have working.

### Font selectors: categorise and group

- Status: stated
- The flat list of fifteen is the main consumer of vertical space.
- Grouping is wanted, not merely compaction.

### Font justification list

- Status: stated
- A separate markdown file recording why each font in the panel is there.
- Lives at `docs/fonts.md`.

## Set 2, 2026-08-13

### Glyph-class selectors become toggles

- Status: stated
- Mixed and matched, so sets combine rather than replace.
- Consequence: `everything` is no longer needed and goes.

### Glyph-class selectors visually grouped

- Status: stated
- By shape family: circles, squares, and so on.

### In-use Unicode blocks, listed

- Status: stated
- For whatever is currently in the glyphs-under-test box.

### Glyphs-under-test box shrinks

- Status: stated

### Specimen shows glyph placement within the rendering box

- Status: stated
- Baseline and glyph centre-lines, or an equivalent Claude judges better.
- Guides carry a visibility toggle.

### Specimen gets copy-to-clipboard

- Status: stated

### Glyph info box on tap or hover

- Status: stated
- Described as desirable rather than required.

## Set 3, 2026-08-13

### The tool is a visual explorer, not an assessor

- Status: stated
- Reframing, and it governs the rest.

No candidate set is going to work perfectly at this stage. Pass-or-fail judgement is
premature, and misleads by implying a standard the work has not reached.

- The bench is for humans going glyph-hunting.
- Verdict prose comes out.
- Judgement is deferred, and conditional on user-tagging ever being added. Not near.

### Width groups: details on tap or hover

- Status: stated
- Same affordance as the specimen and the info box.

### Width groups: drop the verdict line

- Status: stated
- The trailing sentence about column-alignment and mixed width classes goes.

### Glyph ordering

- Status: raised, deliberately unresolved
- Justin leans group order, with an unstated exception.
- To be returned to in a few prompts. Do not settle it before then.

## Set 4, 2026-08-13

### The scale becomes logarithmic

- Status: stated
- Advance divergence is multiplicative, so equal ratios should get equal distance.

### Tick labels stagger vertically on collision

- Status: stated
- Only as much vertical space as needed. Labels may almost touch.

### Colour is a spectrum across the scale, left to right

- Status: stated
- Ties ruler tick, group card and table row into one instrument.
- Intended to make the 836-against-838 pair separable by eye.

### Row colour tags roughly triple width

- Status: stated
- Currently a 3px left border.

### Hue maps to value on the log axis. Settled

- Status: assessed, 2026-08-13

Near-identical hues for 836 and 838 are the point, not a defect.

- Separate rows already make the two groups distinct.
- What the rows lack is any signal that the two widths are effectively the same.
- Bold `836` above bold `838` reads as two facts. It is close to one.
- A shared hue says *same width* across rows that grouping has forced apart.

Rejected: hue by group rank.

- It would render a 0.24% difference as maximal separation.
- Worse than no colour, because it asserts a distinction that is not there.
- Recorded so it is not reintroduced.

Consequences that follow:

- Hue distance is read as ratio distance, so the ramp must be perceptually uniform.
  A naive HSL rainbow is badly non-uniform and would make equal ratios look unequal
  depending on where they land. This promotes `oklch()` from nicety to load-bearing.
- The wide tag is functional. A near-identical hue is unreadable as a 3px stripe and
  legible as a 10px swatch. Width is what makes sameness visible.
- Grouping over-separates. That is the weakness the colour repairs. The grouping itself
  was never the weak part.

## Set 5, 2026-08-13

### Hue domain is pinned and static

- Status: assessed
- Default 350 to 1800. Revised from 250 to 1700.
- Expansive on purpose. Empty space is preferred over overflow at this stage.
- A given advance then draws the same colour on every device, in every set, so two
  screenshots compare by eye directly. That serves the Fedora-against-Android thread.

### Configuration moves into a data file

- Status: stated
- Driven by how much of the tool is now data rather than logic.
- Glyph grouping is the first case. The hue domain is the second.
- A user sets their own range for their own purposes.

Scope for review, not yet agreed:

- Hue domain, and the ramp used across it.
- Glyph groups: name, shape family, members.
- Font panel: category and the families under each.
- Default glyph set, default measuring size, default anchor.
- Guide visibility defaults.

Members should be authored as codepoints and ranges rather than literal glyphs, so the
file diffs and greps without depending on anything rendering.

### Three kinds of data, kept apart

- Status: proposed by Claude, follows from the above
- **Derived** — name, category, East Asian Width, mirrored, block. Objective, from the
  UCD, generated not authored.
- **Configured** — everything in the scope list above. Opinionated, user-owned, authored.
- **Documented** — why each entry earns its place. Prose, in `docs/`, already the pattern
  set by the font justification list.

## Set 6, 2026-08-13

### Served page is the target for browsers

- Status: stated
- GitHub Pages. Settles the `fetch` question, since a served origin can load config.

### JS shim alongside the JSON config

- Status: agreed
- Keeps behaviour identical when the page is opened as a local file.
- One authored source, two emitted forms, from the same generator as the derived data.

### JSON now, keyboard-friendly format later

- Status: agreed for now, revisit
- JSON is fine for the medium term.
- A more keyboard-friendly authoring format is wanted eventually.
- TOML is the obvious successor: Python parses it without a dependency, and it is far
  kinder to hand-edit. The browser would read the generated JSON, so the shim pattern
  already covers it.

### Recording results across font tests

- Status: stated, long-term desire

Knowing **which glyphs stayed grouped across font tests** is the goal.

- This is the design question itself, not a reporting convenience.
- A set that never splits across any tested font is a safe marker set.
- A set that always splits somewhere is the evidence that the patch font is necessary.

Shape of it:

- Each run records a glyph-to-advance mapping, plus what produced it.
- Across runs, count how often each pair of glyphs shared an advance.
- Subsets that co-grouped in *every* run are the candidates.
- Largest such subset is the answer being hunted.

Consequence for work happening now:

- A measurement needs a **run envelope** from the outset: font family as requested and as
  resolved, platform, device, measuring size, timestamp.
- Retrofitting provenance onto records that lack it is the rework this constraint exists
  to avoid.

### Recorded observations are a fourth kind of data

- Status: proposed by Claude
- **Derived** — objective, from the UCD, generated.
- **Configured** — opinions, authored.
- **Documented** — reasoning, prose, in `docs/`.
- **Observed** — timestamped facts about one environment. Committed to the repo so the
  evidence base diffs, greps, and travels between devices.

### On the TUI, and what it is actually for

- Status: Claude's assessment, for Justin's review
- Python, and the natural route is `sysfont.py` growing a front end rather than a new
  project. `textual` if mouse and rich layout are wanted, `curses` if not.
- Worth being clear that it cannot replicate the browser. A terminal has cells, not
  advances, so itemisation and adjacency findings are out of reach there.
- That is not a shortfall. The three front ends answer three different questions:
  - Browser: what a renderer actually does, including re-itemisation.
  - Python and fontTools: what a font file contains.
  - Terminal: how many cells a glyph occupies, which is the East Asian Width question,
    and the one neither of the others can test.

## Set 7, 2026-08-13

### Per-glyph table

- Status: stated
- Block identified by a **colour identicon**, jdenticon, nothing else in the cell.
  - Column sits toward the right, away from the advance colour tags. Separation keeps the
    two colour languages from being read as one.
  - Details on hover. No initials, no codepoint, no text in the cell.
  - Claude's hand-rolled initials scheme is dead. Unicode publishes official short
    aliases, all 354 unique, and they are better: `Misc_Math_Symbols_B`,
    `Sup_Punctuation`, `Geometric_Shapes_Ext`, `Misc_Arrows`.
- `CLASS` gets an explicit title. It is East Asian Width and says so nowhere.
- `FLAG` is opaque. It is a notdef-width guess.
- `ALONE` and `IN RUN` only earn two columns if they can differ. They cannot until the
  anchor works. Collapse to one, with a delta that appears only when non-zero.
- Horizontal space matters. Glyphs are too small.

### Not now, and not designed around. Justin's direction

- Status: deferred by instruction, 2026-08-13

Two-letter property classes came up: line-break behaviour, whether a glyph is paired,
and others of that shape.

**These are not to be built now, and the design is not to accommodate them.**

- Too much complexity at this stage.
- The work is still mostly human eye-work.
- Designing for automation of something not yet seen repeatedly and directly is the thing
  being avoided.

Recorded so the question is not lost, and so a later session does not read the absence as
an oversight and helpfully build it.

Where they will belong when they arrive: the info box, not the table. Properties are
per-glyph detail on demand, and the table is short of horizontal space.

### TUI, correction

- Justin has used TUIs and is aware of the limitations. The explanation was unnecessary.
- For now the workflow is copy-paste out of the glyphs-under-test box, which works.

## Set 8, 2026-08-13

### Hover is a defined term. Standing specification

- Status: stated
- Applies wherever this document says hover. One component, used everywhere.

- Opens on a delay, not instantly.
- Autocloses after a period outside.
- Carries a close button.
- Escape closes it.
- Tap opens it on mobile.
- Tap outside closes it, as well as the close button.

### Block identicons are coloured

- Status: stated
- Colour, not greyscale. Claude proposed desaturating to avoid clashing with the advance
  hues; Justin's answer is spatial separation instead. Column goes to the right.

### Normalisation follows the Unicode Consortium

- Status: stated, and the specification exists

Justin's suspicion was correct.

- `PropertyValueAliases.txt` gives official short and long aliases for all 354 blocks.
  Short aliases are unique. Vendored at `data/PropertyValueAliases-18.0.0.txt`.
- The file directs that **loose matching** be applied to all property names and values,
  excepting String Property values. Loose matching ignores case, whitespace, underscores
  and hyphens.
- So the hash input is the official long alias in its canonical underscored form, for
  example `Miscellaneous_Mathematical_Symbols_B`, rather than a display string mangled by
  hand.
- Consequence, and the point behind the joke: any other tool hashing the same canonical
  alias with jdenticon produces the same icon. The identicon is portable by construction,
  with no agreement needed between implementations.
- Note the vendored file is UCD 18.0.0 while local `unicodedata` is 15.0.0. Version skew
  to keep an eye on.

## Set 9, 2026-08-13

### The info box carries the official abbreviation

- Status: stated
- Both aliases shown: the official short form and the canonical long form.
- Reason is propagation, not Justin's own use.
- Anyone else using the tool learns that an official abbreviation already exists.
- The tool surfaces the standard rather than only consuming it. That is how a standard
  spreads without anyone having to be evangelised at.

### Identicons exist because recognition beats recall

- Status: Justin's rationale, recorded
- Remembering a glyph sat beside the orange pointy thing is cheaper than recalling a
  block name.
- Unicode block names are unusually hostile to recall. Of 354 blocks:
  - 81 names are a strict prefix of another name.
  - 23% end in a trailing qualifier that is the only thing distinguishing them.
  - 18 begin `CJK_`, 9 `Latin_`, 9 `Old_`, 8 `Arabic_`, 8 `Miscellaneous_`.
- So the names are near-minimal-pairs at scale, which is exactly the case where verbal
  recall fails and visual recognition does not.

Consequence, and the two decisions reinforce each other:

- Recognition memory only works if the icon is stable across sessions, devices and tools.
- Hashing the canonical alias is what guarantees that stability.
- So the normalisation decision is not tidiness. It is what makes the identicon
  learnable at all.
- Follows: the identicon must appear everywhere a block appears, so the association gets
  reinforced rather than taught once.

## Set 10, 2026-08-13

### Grouping and ordering are authored, not derived

- Status: assessed
- The file is hand-editable. Claude drafts; Justin moves things around.
- No classifier, no runtime derivation from features.

### For today: one group per glyph, flat, manually ordered

- Status: stated, 2026-08-13
- Glyphs belong to exactly one group.
- Groups are flat. No nesting, no families-of-families.
- Order within a group is manual.
- This is the model the authored file and the UI both use. Nothing more.

### Flexibility lives behind the scenes only

- Status: stated
- The reader must not hard-assume exclusivity, so relaxing it later stays cheap.
  Concretely: internal lookup of a glyph's grouping returns a collection, which today
  always holds one entry.
- Nothing about that surfaces. Not in the authored file, not in the UI.
- No tags. No overlap affordance. No primary-group concept, which would itself be
  premature structure.
- Complexity belongs in the reader, never in the file Justin edits.

### Groupings are peers, all of them

- Status: Justin's correction to Claude, 2026-08-13
- `horizontal half-circle` and `vertical delimiter` are peer terms.
- Neither is a base layer the other decorates.
- Claude had treated the name-parseable grouping as primary and the functional one as an
  overlay. That is a fact about what a parser can draft, not about the glyphs.
- There are on the order of a hundred and fifty groupings not yet considered. None of them
  is being opened today.

### This data does not go to Tana

- Status: stated
- Too data-driven, and unfriendly to an everyday human reader.
- Lives in the repository with the tools that consume it.

### Name morphology drafts the easy cases only

- Status: Claude's assessment, with its own limit established

Unicode names encode **construction**, not **function**.

- Construction parses well. Circle names yield shape, partition, axis and ink fraction
  directly, and the half-circle set splits vertical from horizontal on the name alone.
- It also surfaced members the current presets miss: `◖ ◗` vertical half-circles, `◚ ◛`
  inverse-white horizontals, and `◠ ◡` as members of the horizontal set rather than orphans.
- It also showed `◔` is a quarter and `◕` a three-quarter, so they are not a pair, though the
  current grouping pairs them.

Function does not parse at all, and this is the limit:

- Vertical space definers span **seven blocks**: Geometric Shapes, Miscellaneous
  Technical, General Punctuation, Basic Latin, CJK Compatibility Forms, Supplemental
  Mathematical Operators, Combining Diacritical Marks.
- `LOWER HALF CIRCLE`, `BOTTOM PARENTHESIS` and `LOW LINE` share no morpheme and do the
  same job.
- So a name parser cannot reach a functional family, by construction rather than by
  needing more work.

## Set 11, 2026-08-13

### Show every guide that can be measured

- Status: stated
- Baseline, x-height, cap-height, ink box, ink centre, advance.
- Do not pre-tune the hierarchy. Show it, then tweak once seen in operation.

### Opacity slider for the guides

- Status: stated
- Answers the seven-overlapping-layers problem by handing the tuning to the user rather
  than Claude guessing at a hierarchy up front.

### Guide convention

- No specification exists, unlike the block-alias case. Only convergent practice in
  type-design tools.
- Baseline strongest and solid; other vertical metrics lighter or dashed; horizontal
  extents visually distinct from vertical metrics.
- Light green per Justin. FontForge's guide layer is green, from Claude's recollection
  rather than verified.
- x-height and cap-height are not reported by any browser API. They must be measured by
  rendering `x` and `H` and taking the ink ascent.
- Consequence: a symbol face may carry neither `x` nor `H`, in which case the measurement
  silently returns another font's metrics. Those guides must then be **omitted with a
  visible reason**, never drawn from whatever answered.

## Set 12, 2026-08-13

### Handover to Claude Code

- Status: stated
- Claude Code builds the bench rebuild, with tests.
- Justin snapshots this session's chat alongside the repo spec.
- Spec at `docs/build-spec.md`. Entry point at `CLAUDE.md`.
- Rationale: Claude Code can run a headless browser, so it can settle three questions this
  session could not — canvas additivity behind the dead adjacency anchor, identicon
  legibility at table size, and whether x-height probing survives a symbol font.

## Set 13, 2026-08-13

Justin's responses to the verification findings in `docs/findings.md`.

### Identicons are 20px

- Status: stated
- Settles build-spec 0.2.

### The DOM is definitive

- Status: stated
- Where the two measurement paths disagree about which face drew a glyph, the DOM is the
  answer. It is what is on screen.
- Justin's premise when saying this was that the canvas drew the specimen and the DOM drew
  the width groups. It does not: the canvas in `glyph-bench.html` is never displayed, and
  everything visible is DOM. The direction stands regardless, and on stronger ground —
  Chrome's own `CSS.getPlatformFontsForNode` agrees with the DOM.

### The large specimen glyphs stay

- Status: stated
- Described as very helpful. They are DOM text at the measuring size, not a canvas
  rendering, so nothing about the measurement change threatens them.

### Build a best-guesser for the supplying font, and say that it is a guess

- Status: stated, conditional and the condition holds
- Justin: if there is no browser-accessible character-to-font detection outside DevTools,
  then build a best guesser and **acknowledge that to the user**.
- There is none. A page cannot learn which face rendered a character.
- So the guesser is wanted. The acknowledgement is not a caveat to bury: it is part of the
  instruction, and it follows the standing rule that the bench does not assert what it has
  not established.
- Three inputs are available to it, none sufficient alone: `queryLocalFonts()` on desktop
  behind a permission and a click, advance fingerprinting against `sysfont.py`, and the
  metric-signature test from build-spec 0.3.
- Superseded in part by the browser-agnostic constraint above: both routes get built
  regardless, so no coverage question decides *whether* to build the fallback. Which
  browsers expose `queryLocalFonts()` now only decides how often the enhanced path is the
  one actually taken.

## Set 14, 2026-08-13

### A group split needs a reason, or it gets combined

- Status: stated, and it is a standing rule rather than a one-off
- Justin on the `plain circles` / `black-part circles` split: there was no reason for it,
  and the session that inherited it could not find the reason the session before had.
- So: **combine any group split for which no reason can be found.** The burden is on the
  split to justify itself, not on the merge.
- Applies to the whole grouping, not only to circles.

Applied on the day it was stated:

- `plain circles` / `black-part circles` had already dissolved: the regrouping put all
  eleven into one `circles` group, so nothing was needed.
- `geometric shapes, unshaped names` dissolved. Two members with nothing in common —
  `ROUND TARGET` went to `circles`, `HEAVY EQUALS SIGN` to `unsorted`. It was the residue
  of a name parser, not a grouping.
- The Yijing family rejoined. Trigrams, digrams and monograms sat in `misc symbols` and the
  hexagrams and tetragrams in `divination`, split only because Unicode puts them in
  different blocks. Sixteen glyphs moved.

Flagged, not acted on, because they are placements rather than splits:

- `alchemy and astrology` promises astrology its rule does not deliver: the astrological
  symbols are in Miscellaneous Symbols and went to `misc symbols`. Either the name is
  wrong or the group is incomplete.
- Counting Rod Numerals are in `historic and religious`. They are historic, so there is a
  reason; they are also numerals, and there are three numeral groups.

### Block boundaries are a weak reason, and they are still a reason

- Status: Claude's assessment, following from the above
- Thirty-five of the groups are cut on Unicode block. A block boundary is a fact about
  committee history, not about glyph shape or width.
- It is kept as a reason because it is stable, greppable and reproducible, and because the
  identicon work makes blocks a recognisable unit in their own right.
- But it is the weakest reason in the file, and it is where the next unjustified split will
  be found. `misc math symbols` against `math operators` is the clearest candidate.
