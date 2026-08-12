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

### Open question raised by the above

- Hue mapped to *value* leaves 836 and 838 near-identical, since they sit 0.25% apart
  on the axis. Hue mapped to *group rank* separates them fully.
- Rank is what delivers the stated intent. Awaiting Justin's call.
