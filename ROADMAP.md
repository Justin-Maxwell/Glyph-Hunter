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
