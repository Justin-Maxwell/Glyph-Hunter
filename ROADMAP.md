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

---

From here the record forks. Curation set 13 below declares the two workstreams separate,
and from that point each numbers its own sets. Sets 1 to 12 above precede the split and
belong to both.

## App viewer

### Set 13, 2026-08-13

Justin's responses to the verification findings in `docs/findings.md`.

#### Identicons are 20px

- Status: stated
- Settles build-spec 0.2.

#### The DOM is definitive

- Status: stated
- Where the two measurement paths disagree about which face drew a glyph, the DOM is the
  answer. It is what is on screen.
- Justin's premise when saying this was that the canvas drew the specimen and the DOM drew
  the width groups. It does not: the canvas in `glyph-bench.html` is never displayed, and
  everything visible is DOM. The direction stands regardless, and on stronger ground —
  Chrome's own `CSS.getPlatformFontsForNode` agrees with the DOM.

#### The large specimen glyphs stay

- Status: stated
- Described as very helpful. They are DOM text at the measuring size, not a canvas
  rendering, so nothing about the measurement change threatens them.

#### Build a best-guesser for the supplying font, and say that it is a guess

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

### Set 14, 2026-08-13

#### A group split needs a reason, or it gets combined

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

#### Block boundaries are a weak reason, and they are still a reason

- Status: Claude's assessment, following from the above
- Thirty-five of the groups are cut on Unicode block. A block boundary is a fact about
  committee history, not about glyph shape or width.
- It is kept as a reason because it is stable, greppable and reproducible, and because the
  identicon work makes blocks a recognisable unit in their own right.
- But it is the weakest reason in the file, and it is where the next unjustified split will
  be found. `misc math symbols` against `math operators` is the clearest candidate.

### Set 15, 2026-08-13

#### The tool is general. MarkRight is its first test, not its purpose

- Status: stated, and it corrects how Claude had been reading the whole project
- Justin built this because no equivalent appears to exist, after many hours on Unicode
  websites looking for candidates and copying them around by hand. The intent was a simple
  tool, which became *"let's build a tool that works for my variant-human-editions around
  the world maybe"*.
- MarkRight is the first and immediate real-world test of the tool. It is not the
  specification for it.
- Consequence, in his words: whether something fits his immediate concern is *"a
  superposition of fully relevant and entirely irrelevant. So you can't win!"*
- So **"is this a marker candidate?" is not a filter for what matters.** Claude had been
  using it as one — reporting an East Asian Width change as unimportant because the
  characters were not circles. Recorded in `CLAUDE.md` so it is read first.

#### Almost nothing is selected by default

- Status: stated
- Either zero groups, or just some circle groups.
- Applied: `circles` alone, 162 glyphs. Zero would open on a blank bench, which shows
  nothing working; one shape family exercises every panel and stays readable.
- Effect: 162 glyphs, 32 width groups, 20 blocks. Every rationing mechanism added for the
  5,083-glyph default now sits dormant, which is where it belongs — those caps are for
  when something large is pasted in, not for the resting state.

#### Cross-font stability is for later, and saying otherwise is a hazard

- Status: stated, and it is a correction
- Justin told the session that wrote the build spec that this was a **for later**
  requirement. Nowhere near useful at this stage. *"One huge potential issue source."*
- Claude then described it as *the answer being hunted*, which is exactly the
  over-weighting being warned about. `ROADMAP.md` set 6 and `CLAUDE.md` both already mark
  it deferred; the error was in reading, not in the record.
- What remains sanctioned is only the run envelope, as `CLAUDE.md` says. Nothing consumes
  it and nothing should be built toward consuming it.
- `core.largestUniformSubset` exists and is tested. It is a single-run fact and clears a
  `DEBT.md` item; it is **not** cross-font machinery and nothing surfaces it.

#### Grouping returns next turn

- Status: deferred by instruction
- Set 14's merges stand. No further grouping work until Justin reopens it.

### Set 16, 2026-08-13

#### The pattern: each tool is born from the frustration of the one above it

- Status: stated
- Tana Paste frustrated Justin, so MarkRight is being born out of that. Hand-copying
  candidates off Unicode websites frustrated him, so Glyph-Hunter is being born out of
  MarkRight's needs.
- *"See the pattern?"*
- The pattern is not that each tool serves the one above. It is that **the frustration is
  only the trigger**, and what gets built each time is the general instrument underneath.
- So the reframing in set 15 is not a one-off correction about Glyph-Hunter. It applies at
  every level, and it will apply again to whatever this project turns out to sit on top of.
- Practical effect: never scope a decision to the immediate irritant. It is the least
  durable thing in the room.

#### `width group` is excised

- Status: stated, with reservation
- Justin, having flagged the term twice: *"I almost want to excise that term completely.
  I'm holding back only because maybe I'm about to see some value in it."*
- The concept is kept. The term is gone.
- Claude's assessment of why the term kept grating: **it reads as a taxonomy and it is
  nothing of the kind.** A "width group" sounds like a property glyphs have. It is the
  result of one measurement in one font, and the same glyphs regroup differently in the
  next font — which is exactly the objection Justin raised as *"it's font dependent"*.
  Worse, `group` was already spoken for by the authored glyph groups in `config.json`,
  which genuinely are a taxonomy. One word was doing two opposite jobs.
- Now: `core.advanceSets()` in code, **Glyphs sharing an advance** as the heading, and the
  panel names the font — *"5 distinct advances in monospace"* — so the font-dependence is
  stated rather than implied.
- The reservation stands. If it still earns nothing once seen in use, the panel goes and
  the per-glyph table carries the information alone.
- `ROADMAP.md` sets 3 and 4 keep the old term. They are a record of what was said at the
  time and are not rewritten.

#### Thirty glyphs, not a group

- Status: stated
- *"'hunter' not 'smörgåsbord'."* 162 was still too many.
- The opening set is now an explicit codepoint list in `defaults.glyph_set`, which set 5
  already put in config scope, rather than a whole group switched on. No group is the right
  size by accident.
- Thirty circles across six blocks: five advance sets, six block identicons, everything on
  one screen with nothing rationed.

## Glyph curation

### Set 13, 2026-08-13

#### Two workstreams, deliberately separate

- Status: stated
- **Glyph curation** — the inventory, its grouping, and the naming of groups.
- **App viewer** — the bench, its measurement, and its UI.
- These now run apart. A change in one is not a change in the other, and neither waits on
  the other.
- Consequence: `docs/build-spec.md` remains the viewer's spec. Curation gets its own.

#### Groups become a two-level hierarchy

- Status: stated
- Reverses the flat-groups non-goal in `CLAUDE.md`, and settles the "see 47 chips before
  deciding whether to nest" question left open in `docs/build-spec.md` §8. Justin has seen
  it and decided.
- Sections at the top, leaves beneath. **Target 20-25 members per leaf. Not a hard limit.**
- Measured starting point: 9,800 glyphs in 47 flat groups, median 102, largest 1,275.
  42 of the 47 exceed 25 and hold 9,748 of the glyphs.

#### Leaf names come from looking, not from name morphology

- Status: stated
- Justin's direction: leaf naming is LLM work, not hand work, and not mechanical.
- Blocks, name stems, and contiguous codepoint runs are **guides, not authorities**.
- Rationale, measured: name stems over-fragment (arrows yield 226 two-token stems),
  blocks leave whales (squares' largest block is 193), runs help unevenly.

#### Grouping is a fuzzy, multi-pass, visual process

- Status: stated
- Claude renders contact sheets, looks at the glyphs, and reallocates.
- Verified this session: 40 glyphs per sheet is comfortable; the eye finds families the
  Unicode names blur, and surfaces foreign members sitting inside a name-derived group.
- **Not single-pass.** A misfit is not a reject: it goes to a pool, and a home for it may
  only become apparent in a later shuffle.
- No leaf is closed until a confirmation sheet of that leaf alone reads as one family.

#### Judgement needs a durable layer of its own

- Status: stated
- Problem: `gen_groups.py` regenerates `config.json`, so LLM and hand judgement cannot
  live there.
- An overlay keyed by codepoint carries `leaf`, provenance (`rule` / `visual` / `justin`),
  the sheet the call was made from, and an explicit `unsure` state.
- The mechanical pass proposes; the overlay wins.
- Consequence: re-running the generator stops being destructive.

#### Inventory trims back, interactively

- Status: stated
- "Include rather than exclude" was right for completeness. That phase is over.
- Trimming happens **set by set, after show-and-tell**, never as a bulk list.
- Dropped means dropped **from the inventory entirely**, as Latin alphabetics already are —
  not merely deselected in the UI.
- Settled this session: braille is a script; emoji are not appropriate here. Both go.

#### Rendering source

- Status: stated
- Justin asked whether Noto is the right source. It is, and it is now in use for the
  sheets: Symbols2, Symbols, Math, Music, SignWriting, fetched from the notofonts repo.
- Vector coverage for the bitmap-fallback remainder is worth pursuing for resolution.
- But measure after the trim first: bitmap-only falls from 32.6% of the full inventory to
  12.1% once the drop candidates go, with nothing left uncovered. The residual concentrates
  in exactly the blocks being dropped.

### Set 14, 2026-08-14

#### A browse view: every set, scrollable, nothing else

- Status: stated
- A second page alongside the bench. It shows **all the sets, in order, to be scrolled**.
- **No font selection, no advance measurement, no spacing detail, no controls.** Those are the
  bench's job and they get in the way here.
- Purpose is **inspiration, not measurement**: seeing what exists, so a marker can be chosen
  that is not a backslash and not a hex digit.
- Rationale: MarkRight currently reaches for `\` and `0`–`F` to carry encoding information,
  which is exactly the borrowed-ASCII habit the whole project exists to escape. Nothing in the
  bench answers "what else could carry this", because the bench is built to interrogate a
  candidate you already have.
- Sits in the **glyph curation** workstream, not the app viewer one. It consumes the curated
  sets; it does not measure anything.

### Set 15, 2026-08-15

#### Filter dropdowns on the browse view

- Status: stated
- `General_Category`, `East_Asian_Width` and `Bidi_Class`, as dropdowns on `browse.html`.
- These are the same three properties the info box already carries, and set 7 confines the
  two-letter classes to the info box rather than the table. A dropdown is neither.
- **This qualifies set 14's "no controls".** That ruling was about the bench's apparatus —
  font selection, measurement, spacing — arriving on a page whose purpose is looking. A
  filter selects among what is already drawn and measures nothing, so the purpose survives.
  Recorded explicitly so a later session does not read the filters as drift from set 14.
- Claude's note on the one real cost: the filter acts on the 4,832 cells drawn, not the
  6,018 glyphs kept, because a compressed family is represented by its exemplars. A family
  whose exemplars miss a property can still hold members that carry it. Said on the page.

### Set 16, 2026-08-16

#### Filter on basically every property, not three

- Status: stated
- The three filters of set 15 become **the whole property set**, with these named
  explicitly: `Age`, the emoji properties (`Emoji`, `Emoji_Presentation`,
  `Extended_Pictographic`), `Script` and `Script_Extensions`, `Grapheme_Cluster_Break`,
  `Word_Break`, `Sentence_Break`, `Pattern_Syntax`, `Math`, `Bidi_Mirroring_Glyph`,
  `Default_Ignorable_Code_Point`, `Numeric_Type`, and the quick checks. Justin: *"you get
  the idea — basically all the properties"*.
- **Two exclusions, and they are the rule for anything added later.** No script-specific
  properties. No string-valued ones.
- `Age` filters as **"not after"** — a threshold, not an equality. It is the one property
  whose useful question is cumulative.
- `Script` and `Script_Extensions` are **collapsed into natural groups**, Justin's guess at
  the axis being *"ancient / rare / common or something???"*.
- **Every filter carries an info popup** explaining what it does, and **where the value set
  is small and finite, one per option**. The filters themselves get their own popup, the
  bar having run out of room at three.
- The criterion behind the whole set, in Justin's words: **"the issue is picking a set that
  is going to be consistently rendered."** The properties are worth having because they
  narrow towards glyphs that render the same everywhere, not because the UCD publishes them.
- Scope: **the page is the testbed.** *"Most of these ideas will migrate into the tool
  eventually, but the page is all we need right now to test ideas."*

##### Two rulings this set overturns or qualifies

- **`Line_Break` and `Bidi_Paired_Bracket_Type` are no longer deferred.** `CLAUDE.md`
  defers both by name as too complex for the current stage. Justin was shown that Line_Break
  is one of the better-spread enumerations on the page (24 live values) and ruled to
  **include both**. The deferral stands for table columns; it no longer stands for filters.
- **The emoji properties are live, not placeholders.** Justin first asked for them
  statically locked out. Measurement showed that dropping the emoji blocks did not remove
  pictographs from the page — 550 drawn cells are `Extended_Pictographic`, 201 `Emoji`, 91
  `Emoji_Presentation` — and that the last of those is the sharpest rendering-consistency
  signal available, since a colour emoji font claims those characters whatever font was
  chosen. Justin ruled to **make all three live**.

##### Claude's notes, recorded because they were decisions

- The script grouping is **read, not invented**. UAX #31 identifier usage, as published in
  CLDR's `scriptMetadata.txt`, already classifies every script as `RECOMMENDED`,
  `LIMITED_USE` or `EXCLUSION` — which is what "common, rare, ancient" resolves to. Common
  and Inherited are lifted out separately because they are not scripts anyone writes in, and
  because Common alone is four cells in five.
- An **inert filter is still drawn**, disabled, with the reason. That a property holds for
  no cell on the page (`Default_Ignorable_Code_Point`) or for every cell (`Grapheme_Base`)
  is a finding about the inventory, not a reason to hide the control. 20 of the 85 are inert.
- `Bidi_Mirroring_Glyph` is a mapping, so it cannot be a filter. `Bidi_Mirrored` is offered
  instead and the mapping appears in the cell info box. Worth knowing: 542 cells are
  `Bidi_Mirrored` but only 416 have a partner listed — the rest are to be flipped by the
  renderer with no other character to flip to.
- The properties are read from UCD **16.0.0**, vendored under `data/ucd-16.0.0/`, matching
  this Python's `unicodedata` and fontTools' script data exactly. Mixing versions would put
  values on glyphs that did not carry them.
- Four properties were added after checking the build against Justin's own catalogue,
  `ucd-properties-for-markright.md`, which is the brief behind this set: **Decomposition_Type**
  (his note: more useful than the mapping, because the tag says *why* a character is
  unstable — `<super>` is what folds an ordinal away), **Canonical_Combining_Class**,
  and UTS #39's **Identifier_Status** and **Identifier_Type**. The last two are not UCD
  properties and are vendored separately under `data/uts39-16.0.0/`. Identifier_Type is
  set-valued: 709 cells carry more than one reason.
- Not built, and named here so the absence is visible: the **section 9 adjacent data sets**
  of that catalogue — UTR #25 math class, UTS #39 confusables, `StandardizedVariants.txt`,
  `NameAliases.txt`. They are not UCD properties, each needs its own fetch, and two of them
  (math class, confusables) are assessments rather than properties. Justin's call.

### Set 17, 2026-08-16

#### Consistent rendering is not fitness, and the inventory is not the world

- Status: stated, as an observation rather than an instruction, and the second half is a
  standing rule
- **The emoji tension.** Emoji render *highly consistently* and are nonetheless **"really
  poor for this use case"** — common system and human usage, for encoding. Justin flags this
  as an open tension and notes others might disagree.
- Claude's reading of why the two can both be true, recorded because it is the distinction
  the tension turns on: emoji are consistent in **presence and metrics** and inconsistent in
  **drawing** — the same codepoint is a different picture on each platform. Add that they
  are semantically loud and already common in the content being marked up, and the very
  property that makes them reliably available makes them unfit to carry structure. So
  **"consistently rendered" is a necessary test, not a sufficient one.** Said on the page,
  in the info notes for `Emoji` and `Emoji_Presentation`.
- **The filters make the inventory provisional.** Justin's observation: with property
  filtering in place, the filters *"allow re-inclusion of basically the entire glyph set"*.
  He is explicit that he is **not heading there yet** — this is to be kept in mind, not
  acted on.
- **The standing rule that follows, and it governs.** Do not exclude a property, a glyph, or
  a group **because it is unused on the current selection**. The current selection is a
  working choice and can be reopened; a property's fitness is a fact about the property.
  *"About the only exclusion is 'script text writing characters'."*

##### What this corrected immediately

- `Vertical_Orientation` had been excluded as "script-specific". It is neither
  script-specific nor rare here — 1,922 upright against 2,771 rotated over the drawn cells —
  and the exclusion note argued from a filter being "mostly empty", which is exactly the
  reasoning this set forbids. It is now a filter, in the rendering section.
- The remaining exclusions were rewritten to argue from **what a property is** rather than
  from how much of it appears: they are out because their value is a statement about one
  script's internal structure, not because they would be sparse.
- The existing treatment of **inert filters already agreed with this set** and stays: a
  property that holds for nothing here is still drawn, disabled, with the count as the
  reason. Under set 17 that is no longer a nicety — it is the correct handling, because the
  inventory it is inert against is provisional.

### Set 18, 2026-08-16

#### The property exclusions are one rule, and `Joining_Type` is not borderline

- Status: stated, as a correction
- Justin, on Claude having called `Joining_Type` a borderline exclusion: **"Why is
  Joining-Type borderline? All those four exclusions are 'script text writing' effectively.
  Agree?"** — and yes.
- The four clusters are **Indic syllable structure**, **Arabic and Syriac cursive joining**,
  **Hangul composition**, and the **CJK radical-to-ideograph mapping**. They are one
  category, not a category plus an awkward case: each is machinery for writing running text
  in a script. That makes the property exclusion **the same rule** as the glyph exclusion
  set 17 states — script text writing — rather than a second rule that happens to sit
  alongside it.
- Claude's reason for the hedge does not survive: it was that `Joining_Type` **has a value
  for every codepoint**. So does every enumerated property in the UCD —
  `Indic_Syllabic_Category` defaults to `Other`, `Hangul_Syllable_Type` to `NA`. Totality
  discriminates nothing, so it could not have made one of them borderline.
- **The discriminator that does work**, recorded because the next property will need it:
  exclude where the **property** is one script's text-writing machinery, not where some of
  its **values** name scripts. `Line_Break` carries Hangul and South East Asian values,
  `Word_Break` carries Katakana, `Bidi_Class` carries Arabic ones — all three stay, because
  each makes a claim about *any* character. `Joining_Type = Non_Joining` makes no claim
  about the character at all; it says the character takes no part in Arabic and Syriac
  cursive joining, which is a fact about those scripts.
- The exclusion heading on the page is now **"Script text writing"**, in Justin's words,
  rather than "Script-specific".

### Set 19, 2026-08-16

#### Which dropped groups are script text writing, and the deadness test for the rest

- Status: stated, and the second half is explicitly **a later phase — not to be acted on**
- Justin, on the four groups Claude named as dropped entire: **"emoji are the obvious one
  that isn't 'text writing'."** Confirmed against the `Script` property rather than by
  judgement — braille is `Brai` throughout, sign writing `Sgnw` throughout, script numerals
  carry 40-odd real scripts, and **emoji and pictographs is `Zyyy` Common in all 1,275
  members**. Unicode gives emoji no script of its own.
- The consequence is not that emoji comes back. It is that **its exclusion changes grounds**:
  it is out on *fitness* — Justin's "really poor for this use case" — and not because it is
  a script. Under set 17 a fitness exclusion is a working choice rather than a durable one.
  The recorded reasons already said as much without anyone noticing: braille reads "a
  script", sign writing "a script notation", emoji **"not appropriate here"**.
- Two further dropped groups fall the same way and had not been named: **currency** (33) and
  **superscripts and subscripts** (27), both entirely `Zyyy`.

##### The later phase, and the test it will use

- Justin: **"With script numerals, as with 'common' script punctuation, it will eventually
  come down to whether those scripts are utterly dead outside research. But that's a later
  phase I think."**
- That test is already published and already vendored. **UAX #31 identifier usage, via
  CLDR's `scriptMetadata.txt`**, classifies every script as `RECOMMENDED`, `LIMITED_USE` or
  `EXCLUSION`, and `EXCLUSION` is defined as historic and obsolete, kept for scholarly use.
  It is the same data already grouping the `Script` filter, so the later phase is a query
  rather than new machinery, and the browse page can answer it for included glyphs today.
- The numbers, recorded now so the later phase starts with them rather than re-deriving:

  | Group | Historic/obsolete | Living, widely used | Living, small communities | Common |
  | --- | ---: | ---: | ---: | ---: |
  | `script numerals` (dropped, 894) | 388 | 259 | 11 | 236 |
  | `script punctuation` (kept, 426) | 192 | 98 | 116 | 20 |

- **The finding worth keeping: applied consistently, this test moves glyphs in both
  directions.** It is not a re-inclusion axis. `script numerals` would gain roughly 624 —
  388 from dead scripts plus 236 that carry no script at all — while `script punctuation`,
  which is already in, would lose roughly 214 belonging to living scripts. The current
  boundary is simply not drawn on this axis, so adopting the axis is a redraw and not an
  extension.
- Also flagged, not acted on, and now qualified by set 20: 236 of the dropped
  `script numerals` are `Script=Common` —
  Indic and Ottoman Siyaq, Aegean, Kaktovik, Mayan, Common Indic Number Forms. Those are
  numeral notations rather than the digits used to write running text in a script, so the
  group's own stated reason, "no other script's general numerics were kept", may not reach
  them.

### Set 20, 2026-08-16

#### What the tool is for: the exhausted ASCII punctuation pool

- Status: stated. **This is a statement of purpose and it governs.**
- Justin, on `script punctuation`: **"lots of more obscure but standard glyphs ARE fully
  appropriate. This is actually the LEGACY of projects this tool is designed to support
  (mostly, but not solely, all the encoding use of less-used 127(-33) ASCII chars)."**
- Two things follow, and the first corrects a reading this project could easily have drifted
  into:
  - **Obscurity is a qualification, not a disqualification.** A glyph nobody writes is a
    glyph free to be given a meaning. Set 19's deadness test therefore reads differently for
    punctuation than the phrasing there implied — a dead script's punctuation is *more*
    available, not less.
  - **The tool exists because a pool ran dry.** The legacy practice is encoding structure in
    the less-used printable ASCII characters. When that pool is exhausted, a project reaches
    for a character that is already carrying meaning — MarkRight reaching for `\` — and
    that is the failure this instrument is built to give an alternative to.
- Justin's open question: `/` and `?` are unavailable **"because dates I assume — although
  maybe that is just a pre-computer encoding standard — maybe ALL punctuation is?"**

##### Claude's answer, measured rather than asserted

- **Yes, and the UCD already records it.** Of the 32 printable non-alphanumeric ASCII
  characters, **15 carry a prose role the UCD states as a property** — `Sentence_Terminal`,
  `Terminal_Punctuation`, `Quotation_Mark`, `Dash`, or a bidi bracket pair:

      !  "  '  (  )  ,  -  .  :  ;  ?  [  ]  {  }

  Punctuation *is* a pre-computer encoding standard for prosody and structure, and those
  properties are Unicode's machine-readable record of it. They became filters this session,
  so the page can now select on "already carrying a load".
- **But `/` is not one of them**, and that is the interesting part. The UCD puts `/` with
  `@` and `` ` `` in the 17 with no recorded prose role:

      #  $  %  &  *  +  /  <  =  >  @  \  ^  _  `  |  ~

  So `/`'s unavailability is not pre-computer. It is a **computing-era** claim — paths,
  URLs, protocols, regex, closing tags. `?` is genuinely prose-loaded; `/` only feels that
  way.
- **Two strata of "already taken", and the UCD records only the older one.** That is a real
  gap in what this tool can currently answer.
- **The pool is provably empty.** Every one of those 17 has since been claimed by computing
  — `#` comment, `$` variable, `%` escape, `&` reference, `*` glob, `+` concatenation, `/`
  path, `<` `>` tags, `=` assignment, `@` address, `\` escape, `^` caret, `_` identifier,
  `` ` `` code span, `|` pipe, `~` home. The 15 were taken by prose, the 17 by computing,
  and nothing in ASCII is left. Claude's characterisation of the computing half, not data —
  there is no published source for it. That absence is the gap named above.

### Set 21, 2026-08-16

#### ASCII punctuation is exhausted for MarkRight, and dis-use is the criterion. Deferred.

- Status: stated, and **DEFERRED by instruction. Do not act on any of it.**
- **No ASCII punctuation is any use to MarkRight.** Justin: *"NO ascii punctuation belongs
  anywhere near our app, by now it is all overloaded a hundred times or over."* Not the 17
  computing claimed, not the 15 prose claimed — all of it. *"Our app"* is MarkRight, which
  is the need that triggered this tool and is not this tool.
- **Nor a good part of Latin Unicode punctuation**, *"regardless of properties"*. The
  properties do not decide this and cannot be made to.
- **It is a value judgement, not a deterministic test.** Recorded in those words because
  the temptation this project keeps meeting is to find a property that stands in for a
  judgement. There is none here.
- **The positive criterion, for when this is picked up: *"searching for dis-use is
  helpful."*** Not "is it a symbol", not "is it obscure by block" — is it *unused*.

##### What this does to set 20

Set 20 stands as history and as the statement of why the tool exists. It is **not a
shortlist**. The 32 ASCII characters and their two strata explain how the pool ran dry;
they do not nominate anything. Any later reading of set 20 that treats the 17 "no recorded
prose role" characters as available is wrong, and set 21 is the correction in advance.

##### The scope error this set caught, recorded because it recurred

Claude wrote set 21 up as ruling ASCII punctuation out as **"marker candidates"**, and then
raised whether that should also remove it from the browse inventory. Justin: *"'Marker
candidate' — conflating that in the context of MarkRight specifically. So not a relevant
condition anywhere here. Vast amounts of included glyphs are not suitable for the specific
marker candidates I am hunting for for MarkRight specifically."*

- **There is no candidate status in this tool.** Set 6 already records this and `CLAUDE.md`
  states it outright; it was imported again anyway, by way of a phrase rather than a
  decision. A term borrowed from MarkRight brings MarkRight's criteria with it.
- **So set 21 carries no implication for the inventory at all.** It says what MarkRight
  cannot use. `common latin punctuation` and everything else stay exactly where they are,
  and the question Claude raised about them was malformed rather than open.
- That vast amounts of the inventory are useless to MarkRight is **the expected condition**,
  not a defect to be filtered away.

### Set 22, 2026-08-16

#### Order by renderer behaviour, and act on a glyph from its info box

- Status: stated
- **Prioritise the filter panel by rendering.** *"Some prioritisation is needed - bringing
  the major rendering aspects to the top - I think that includes the 'breaking' ones
  (wherever break-before and break-after live e.g.) Script and Vintage are second-tier."*
- **The info box answers renderer treatment, not font coverage.** *"For glyph info boxes, we
  need a few more properties at least, but script and age are not them. The objective being
  to understand how renderers will treat the glyph, not which fonts will have it (at this
  first scanning for candidates stage)."*
- **The test for what goes in it**, in Justin's words: *"not every last little property, but
  all the major ones that say 'if you use these characters together, there's a decent chance
  the renderer will treat them as peers.'"*
- **Click a glyph in the popup to copy it to the clipboard.**
- **A function in the filter to apply the filters according to what was shown in the popup**
  — described by Justin as *"THEN the big one"*.

##### As built

- Sections reordered: **Rendering and presentation**, then **Breaking and segmentation**,
  then Vintage, Script, Classification, Normalisation, Identifier and case, Other.
  `Line_Break` moved out of rendering to join `Grapheme_Cluster_Break`, `Word_Break` and
  `Sentence_Break`, so "wherever break-before and break-after live" is now one place.
- The peer set is **twelve properties**, defined once in `ucd_props.PEERS` and used by both
  the info box and the filter action, so the two cannot drift apart: General_Category,
  East_Asian_Width, Line_Break, Grapheme_Cluster_Break, Word_Break, Bidi_Class,
  Bidi_Paired_Bracket_Type, Vertical_Orientation, Emoji_Presentation,
  Extended_Pictographic, Bidi_Mirrored, Default_Ignorable_Code_Point.
- Age and Script were **removed** from the info box, having been added there earlier in the
  same session. They predict coverage rather than treatment, and remain filters.
- Values now read as `AI · Ambiguous` rather than bare `AI`, since the long alias was
  already to hand from the filter definitions.
- `filter to peers` sets all twelve at once — the strict reading — and each lands as a chip
  on the bar, so loosening is one click per property rather than reassembling by hand. An
  inert property is skipped, because it selects nothing by definition.

##### Claude's notes

- Both actions are wired by **delegation from the document**, keyed on `data-copy` and
  `data-peers`. `src/hover.js` owns the popup's markup and sets it with `innerHTML`, so the
  alternative was changing the shared component's contract or rebinding on every open.
  Neither is worth it for two buttons.
- The clipboard write uses the async API with the old selection-based route as fallback,
  because `file://` is a secure context in Chrome and Firefox but need not be everywhere
  this page is opened.
