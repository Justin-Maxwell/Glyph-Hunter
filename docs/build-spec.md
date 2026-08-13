# Build spec: glyph-bench rebuild

Written 2026-08-13 by the session that produced `ROADMAP.md` sets 1–11. That session had
no browser, so several questions below are unsettled *because they were unverifiable*, not
because they were skipped.

Read `CLAUDE.md` first, especially the hard non-goals.

The current `glyph-bench.html` works and is the reference for behaviour. Rebuild it; do
not patch it. The measurement path changes shape and the layout is built over it.

---

## 0. Verify first. Three questions a browser can settle

Do these before building. Each has a decision hanging on it, and each is cheap with a
headless browser. Record findings in `docs/findings.md` and update `DEBT.md`.

### 0.1 Is canvas `measureText` additive across a run?

The adjacency anchor currently does nothing observable. Hypothesis, unverified: the
control computes `measureText(anchor + g).width - measureText(anchor).width`, and canvas
resolves fallback per character and sums advances, so the result equals the glyph's own
advance and `shift` is always zero by construction.

- Test: pick a glyph pair known to re-itemise. `⬤` U+2B24 preceded by `◷` U+25F7 was
  observed by Justin to render smaller with that neighbour.
- Measure four ways: canvas `measureText` of each alone and of the pair; DOM layout of the
  same, using a `Range` over each character and taking `getBoundingClientRect().width`.
- **If canvas is additive and DOM is not, the anchor must be measured in the DOM.** That is
  the expected outcome and section 2 assumes it. If canvas *does* show the shift, say so —
  it simplifies everything and the hypothesis was wrong.

### 0.2 Do jdenticon icons stay distinguishable at 16px?

Block identity is shown as a coloured jdenticon and nothing else — no text in the cell.
Recognition memory is the entire mechanism, so the icons must be separable at table size.

- Render icons for the ~40 block canonical names actually present in `data/glyphdata.json`
  at 12, 16, 20 and 24px, with `padding` reduced.
- Report the smallest size at which they remain distinguishable, and whether reduced
  padding helps or hurts.
- If 16px is too small, say so rather than shipping decoration.

### 0.3 Can x-height and cap-height be probed in a symbol font?

No browser API reports them. The workaround is to render `x` and `H` and take
`actualBoundingBoxAscent`.

- Test against `Noto Sans Symbols`, which is the confirmed Android supplier for the U+29Bx
  run and may contain neither `x` nor `H`.
- Establish how to *detect* absence rather than silently receive another font's metrics.
  Comparing the probe's advance against the notdef advance is one candidate; a better
  discriminator may exist.
- **When unmeasurable those guides must be omitted with a visible reason.** Never drawn
  from whatever answered.

---

## 1. Data loading

Both files are generated. Do not hand-edit `glyphdata.json`.

- `data/config.json` — authored. Groups with ordered members, hue domain, defaults.
  **Justin edits this.** `tools/gen_groups.py` will not overwrite it without `--force`.
- `data/config.json.orig` — the pristine generated pass, always rewritten by
  `gen_groups.py`. Its purpose is to be diffed against `config.json` to see Justin's edits.
  Never read it at runtime.
- `data/glyphdata.json` — derived. Per glyph: `cp`, `name`, `gc`, `eaw`, `mirrored`,
  `bidi`, `block`, `block_canonical`, `block_short`. Absent keys mean absent or false.
- `data/glyphdata.js` and a `config.js` shim assign the same payloads to globals.

`fetch()` fails on a `file://` page: Chrome treats a sibling file as cross-origin, on
Android too. A `<script src>` does not. So:

- Try `fetch` first. On failure fall back to the globals from the shims.
- `tools/gen_data.py` emits the `.js` shim already. Extend it to emit `config.js` too.
- Show which path was used, quietly. A silent fallback that loads stale data is a trap.

`glyphdata.json` is ~1.9 MB. Acceptable over HTTPS, noticeable on mobile. If it is a
problem, split per group and load on demand — but measure before optimising.

## 2. Measurement

Two engines, two purposes. Use both; do not pick.

- **Canvas `TextMetrics`** for metrics: `width`, `actualBoundingBoxAscent/Descent/Left/Right`,
  `fontBoundingBoxAscent/Descent`. This is what the guides are drawn from.
- **DOM plus `Range`** for itemisation: render the run, walk it character by character,
  take each rect. This is what catches a glyph being drawn from a different face because
  of its neighbour, and it is what the anchor needs (pending 0.1).

Normalise all widths to units per 1000 em, so they compare directly against font tables.

### Run envelope

Every measurement set carries provenance, from the outset. Retrofitting this later is the
rework the constraint exists to avoid.

```
{ font_requested, font_resolved_hint, platform, user_agent, size_px,
  timestamp_iso, glyph_count, hue_domain }
```

`font_resolved_hint` is best-effort: no browser exposes the resolved family to script. The
advance itself is often the discriminator — Noto Sans Math gives 836 for the U+29Bx run,
the Android device gives 796 — so record enough that a later reader can identify the face.

Nothing consumes the envelope yet. That is fine. Emit it anyway.

## 3. Scale and colour

The scale and the colour are one mechanism.

- **Logarithmic**, because advance divergence is multiplicative. 594→604 is 1.7%,
  1000→1390 is 39%; linear spacing makes those look comparable when they are not.
- **Domain pinned and static**, from `config.hue_domain`, default 350 to 1800. Deliberately
  expansive: empty space is preferred over overflow. A given advance then draws the same
  colour on every device and in every set, so two screenshots compare directly.
- **Hue maps to value**, that is to position on the log axis. **Not to group rank.**
  - This is settled and the reasoning matters, because rank is the intuitive-seeming choice
    and it is wrong. 836 and 838 land 0.1% apart and therefore get near-identical hues.
    **That is the point.** Separate rows already make the two groups look distinct; bold
    `836` above bold `838` reads as two facts when it is close to one. The shared hue is
    the only thing saying *same width*.
  - Rank would render a 0.24% difference as maximal separation, asserting a distinction
    that is not there. Worse than no colour.
- **Perceptually uniform ramp**, `oklch()`. Load-bearing, not cosmetic: hue distance is
  read as ratio distance, so equal ratios must look equally different wherever they land.
  A naive HSL rainbow has large perceptual jumps around green and cyan and small ones
  elsewhere, which would corrupt exactly that reading. Vary lightness as well as hue —
  it also keeps adjacent bands separable under colour-vision deficiency.
- **Guards.** `log(0)` is negative infinity and a missing glyph can report a zero advance.
  A single width group gives a zero log span. The linear code guards the second with
  `(max-min) || 1`; the log form needs both.

### Ruler

- Ticks stay at their true positions. **Labels** stagger downward on collision, one tight
  row at a time, roughly 0.85em, so they nearly touch.
- Depth of stagger determines ruler height; do not fix it.
- A thin leader line from tick to label, **in the group's hue**, so the association holds
  when a label lands three rows down.
- Label collision is not cosmetic here: `594`/`604` and `836`/`838` overprint in the
  current build, and near-equal advances are the interesting case.

## 4. Width groups block

Mostly liked as-is. Two changes and one addition.

- **Remove the verdict line.** No "will not column-align", no mixed-width-class warning.
- **Remove the green and red edges.** `.solo` and `.many` are the same judgement in colour.
  Replace with the group's hue, which makes colour mean *identity* rather than *quality*.
- The same hue appears on the ruler tick, its leader, the group card's tag, and the
  group's rows in the per-glyph table. Three blocks read as one instrument.
- **Row colour tag** roughly triples in width, ~10px, and becomes a real element rather
  than a `border-left`. Width is functional: a near-identical hue is noise as a 3px stripe
  and legible as a 10px swatch.
- **Details on hover**, per the hover contract in section 7.

## 5. Per-glyph table

Horizontal space is short and the glyphs are too small. Net column count should fall.

| column | change |
| --- | --- |
| glyph | larger. It is the subject |
| codepoint | keep |
| EAW | header currently says `CLASS` and explains nothing. Give it an explicit title |
| advance | **collapse `ALONE` and `IN RUN` into one.** Show a delta only when non-zero |
| flag | currently opaque. It is a notdef-width guess; say so, and see `DEBT.md` |
| block | **new.** Coloured jdenticon, no text. Column toward the **right** |

The identicon column sits right specifically to keep it away from the advance hues.
Two colour languages in adjacent columns read as one and corrupt both; spatial separation
is the fix, not desaturation.

### Identicons

- Hash input is `block_canonical`, the UCD's underscored long alias, for example
  `Miscellaneous_Mathematical_Symbols_B`.
- This matters beyond tidiness. The input is a specified, stable string and jdenticon is
  deterministic, so **any other tool hashing the same alias produces the same icon.** The
  identicon is portable between implementations with no agreement needed. Do not
  normalise differently, and do not "improve" the input.
- Coloured, per Justin. `vendor/jdenticon.min.js`, MIT, vendored. Use `toSvg()`.
- Recognition memory only works if an icon is stable across sessions, devices and tools.
  The canonical hash input is what guarantees that.

## 6. Specimen

- **Copy to clipboard.** `navigator.clipboard` needs a secure context; it may fail on a
  local file. Provide a fallback and surface the failure rather than swallowing it.
- **Guides, all of them, drawn from measurement:**
  - advance cells, as alternating background shading so they recede
  - baseline, solid and strongest
  - x-height and cap-height, light green, pending 0.3
  - ink box per glyph — its gap from the advance cell is the side bearing, free
  - ink vertical centre per glyph, plus one shared line across the row. Circles sit on the
    maths axis by design, so a circle drawn from a different face at a different axis
    height makes the row ragged at identical advance. That raggedness is currently invisible
- **Opacity slider** for the guides. Do not pre-tune a hierarchy; Justin will tweak once
  he has seen it in operation.
- No convention exists for guide colours, unlike the alias case — only convergent practice
  in type tools. Baseline strongest, other vertical metrics lighter, horizontal extents
  visually distinct from vertical ones.
- **Tap or hover a glyph** opens its info box.

## 7. The hover contract

`hover` is a defined term in `ROADMAP.md`. One component, used everywhere.

- Opens on a delay, not instantly.
- Autocloses after a period outside.
- Has a close button.
- Escape closes it.
- Tap opens it on mobile.
- Tap outside closes it, as well as the close button.

### Info box contents

- The glyph, large.
- Codepoint and Unicode name.
- Block: display name, **official short alias**, and canonical form.
  - The short alias is included for propagation, not for Justin. Anyone else using the
    tool learns that an official abbreviation already exists. The tool should spread the
    standard, not merely consume it.
- `gc`, `eaw`, `mirrored`, `bidi`.
- Measured advance, and the delta beside the anchor.
- The block identicon, so the association reinforces.

## 8. Controls and layout

Vertical space is the primary complaint: using the tool means heavy scrolling.

- **Results should be reachable without scrolling past the controls.** Either results above
  controls, or the controls as a compact sticky bar. Changing a font and scrolling to see
  what changed is the loop to kill.
- **Font selectors grouped by category**, not a flat list of fifteen chips that wraps into
  a column. Categories are in `docs/fonts.md`: generic families, symbol suppliers,
  reference faces, terminal faces, CJK, platform UI. Collapsed by default with the active
  group open.
- `docs/fonts.md` lists four reference faces absent from the panel that are the source of
  recorded measurements — `FreeSans`, `Liberation Sans`, `Liberation Mono`, `Unifont` —
  and open questions for Justin. Do not add them unilaterally; ask.
- **Glyph group toggles.** Additive: toggling combines sets rather than replacing them.
  - State is **derived from the textarea**, never stored. Otherwise a hand edit desyncs the
    buttons and they lie. Compute per group: all members present, none, or **some**. The
    partial state needs a look of its own; it will be common.
  - That computation is a pure function of `(content, groups)` with no DOM in it, which is
    the shape a TUI needs later.
  - Visually grouped. 47 groups is a lot of chips; Justin has said see it before deciding
    whether collapsible sub-groups are needed. Do not pre-emptively nest.
  - `selected_by_default` in the config controls which are on at load. Bulk groups —
    script punctuation, script numerals, CJK radicals, sign writing, music, emoji,
    braille, common latin, fullwidth, enclosed CJK, superscripts — start off, so the tool
    opens on the shape families.
  - There is no `everything` group any more, and every glyph in the inventory belongs to
    exactly one group, so nothing is orphaned.
- **Glyphs-under-test box smaller.**
- **In-use Unicode blocks listed** for whatever is currently in the box. Identicon, short
  alias, full name. This is where the standard gets taught most naturally.

## 9. Tests

Justin's expectation is that this build includes tests. Prioritise the ones where a wrong
answer would be invisible.

- Log position: known advance to known axis fraction. 350→0%, 1800→100%, 836→53.2%,
  838→53.3%.
- Guards: zero advance, single group, empty set.
- Hue: equal ratios give equal perceptual distance in the chosen ramp. 836 and 838 within
  a small threshold; 1000 and 1390 well apart.
- Toggle derivation: all, none, partial. Hand-edit then recompute.
- Tick stagger: no two labels overlap for a set with adjacent advances.
- Identicon determinism: same canonical alias gives byte-identical SVG across runs.
- Alias resolution: every block in `glyphdata.json` has a `block_short`. This regressed
  once, on loose matching.
- Config round-trip: every codepoint in every group resolves in `glyphdata.json`.

## 10. Open questions for Justin. Do not decide these

- Whether the four terminal faces in the font panel all earn their place, and why `Roboto`
  is there. See the foot of `docs/fonts.md`.
- Whether the absent reference faces should be added.
- Whether 47 flat group toggles is usable, or sub-groups are needed. See it first.
- Whether the glyph info box should identify the font actually supplying a glyph. Raised
  by Justin, assessed in `PROPOSALS.md`, **not part of this spec**. Viable by metric
  fingerprinting against `sysfont.py` output; not viable by any API.
- Whether the `plain circles` / `black-part circles` split survives. It is not a
  principled boundary: `◐ ◑` and `◒ ◓` are one family by name and by construction, and
  U+25D0–25D5 is a contiguous run the split cuts after the second member. The real
  coverage cliff is inside the second group — `◔ ◕` at 46 faces against `◒ ◓` at 131.
  The grouping recorded a genuine observation and named it wrongly. Justin has not yet
  said what to do about it.
