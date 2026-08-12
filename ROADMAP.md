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
- Default 250 to 1700.
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
