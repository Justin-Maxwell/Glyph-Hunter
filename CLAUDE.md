# Glyph-Hunter

Instruments for examining how Unicode glyphs actually behave when rendered — advance
width, itemisation, coverage, width class. **It is a general tool**, built because no
equivalent appears to exist and because the alternative was hours on Unicode websites
copying candidates around by hand.

MarkRight is the **first real-world test** of the tool, not its purpose. It needs marker
glyphs holding a consistent advance across the fonts and platforms its author uses, and it
is what the bench will first be pointed at. Do not treat it as the specification.

The practical consequence, in Justin's words: whether something serves his immediate
concern is *"a superposition of fully relevant and entirely irrelevant"*. So **"is this a
marker candidate?" is not a filter for what matters.** A finding about arrows or braille
is not less interesting than one about circles.

The author is Justin. Read `ROADMAP.md` before doing anything: it is his direction, and it
governs.

## What the tools are for

Two instruments, three questions, and they do not overlap.

- **`glyph-bench.html`** — what a *renderer* actually does. Advance as laid out,
  re-itemisation, adjacency, guides. Runs in a browser on the target device.
- **`sysfont.py`** — what a *font file* contains. fontTools over `/system/fonts` or any
  directory. Runs under Termux on Android, or anywhere with Python.
- A **TUI** is wanted eventually, and would answer a third question neither of these can:
  how many terminal cells a glyph occupies. That is the East Asian Width question, and it
  is the only width Unicode itself specifies — advance widths live in fonts, not in the
  UCD. EAW uniformity is the hard constraint in the MarkRight test case. Do not build it
  yet.

## Where truth lives

| File | Holds | Who authors it |
| --- | --- | --- |
| `ROADMAP.md` | Justin's direction. **Drives the work.** | Justin, via Claude recording |
| `PROPOSALS.md` | Claude-originated ideas. **None agreed.** | Claude |
| `DEBT.md` | Known-trivial defects, cleared opportunistically | Claude |
| `docs/` | Reasoning. Why a thing is the way it is | Claude |
| `data/config.json` | Authored data: groups, order, domains, defaults | Justin, first pass by Claude |
| `data/glyphdata.json` | Derived data. **Never hand-edit.** Regenerate. | `tools/gen_data.py` |

Keep these separate. A proposal that migrates into `ROADMAP.md` without Justin saying so
is a serious error: it turns a suggestion into an instruction.

## Working rules, learned the hard way in this project

- **Look for the standard before inventing a scheme.** A block-abbreviation scheme was
  hand-rolled, collision-patched, and then discarded when `PropertyValueAliases.txt`
  turned out to supply official aliases, all unique, one fetch away. Scheme-invention
  happens exactly where checking feels disproportionate.
- **Apply loose matching to UCD property values.** UAX #44: ignore case, whitespace,
  underscore, hyphen. A literal string compare fails on connective words — the UCD writes
  `Symbols_And_Arrows`, fontTools reports `Symbols and Arrows`.
- **Do not describe an image you have not examined.** A specimen row was described as
  uniform when it showed three distinct sizes, contradicting measurements quoted two
  paragraphs earlier.
- **Never hand-type a glyph run in prose.** Emit it from the codepoints, the same way a
  sheet is rendered. A seven-member cycle typed into chat carried U+32CB, December, in
  place of U+328B, and the wrong glyph came from the run being discussed three lines
  above. Worse, the error was then attributed to the reader's font stack, because the
  rendered diagnostic — built from the range, and correct — could not reproduce it. A
  typed glyph run is unverified data presented as evidence.
- **Do not compare apparent sizes across separately cropped screenshots.** Different
  crops, different scales, no information.
- **Flag inference as inference.** Say "I assume", "probably", "likely". Do not state a
  reconstruction as a finding.
- **Justin is the agent.** Unexplained repo or file state is his deliberate action first,
  not an anomaly to explain away. And check with `git fetch` before assuming a working
  copy is current — a clone on disk went unfetched while the files sat on `main`.

## Hard non-goals

Deferred by Justin explicitly. Building any of these is worse than doing nothing, because
the absence is a decision and will read as an oversight.

- **No two-letter property classes as table columns.** Line-break behaviour, paired-bracket
  type, and similar. Too much complexity for the current stage; the work is still human
  eye-work. When they arrive they go in the info box, not the table.
- **No tags, no overlapping group membership, no primary-group concept.** For now a glyph
  belongs to exactly one group, groups are flat, order is manual. Internals may avoid
  hard-assuming exclusivity so relaxing it stays cheap, but **nothing about that surfaces**
  in the config file or the UI.
- **No search.** Later.
- **No automated result-recording or cross-font stability analysis.** Wanted long-term.
  Do not design around it beyond the run envelope described in `docs/build-spec.md`.
- **No verdicts.** The bench is a visual explorer for glyph-hunting, not an assessor. No
  pass/fail prose, no good/bad colour coding. No candidate set works perfectly yet and
  implying a standard misleads.
- **No new functional groupings.** "Vertical delimiters" was raised as a *direction*, not
  a topic. There are on the order of 150 groupings not yet considered. Open none of them.
- **This data does not go into Tana.** Too data-driven for a personal knowledge base.

## Conventions

- UK English throughout, including in code comments and commit messages.
- Commit messages explain *why*, not just what. They are part of the record.
- Verify before claiming. A write that was not read back did not happen.
- `data/config.json` is regenerable but **Justin edits it**. `tools/gen_groups.py`
  overwrites; warn before running it over an edited file.

## Your task

`docs/build-spec.md`. Start with the verification tasks at the top of it — they settle
questions the previous session could not, because it had no browser.
