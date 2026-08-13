# Findings

Answers to the verification tasks at the top of `docs/build-spec.md`. Written 2026-08-13 by
the first Claude Code session, which had the browser the previous session lacked.

Each section says what was measured, what it settles, and what changes in the spec as a
result. Where a spec assumption turned out to be wrong that is stated plainly, because the
spec's *expected* outcome was load-bearing for the design that follows it.

## Environment

Everything below was measured in one environment. It is a sample of one, and the
cross-platform question is exactly what the tool exists to answer, so treat the numbers as
this machine's answers rather than as the answers.

| | |
| --- | --- |
| Browser | Google Chrome 149.0.7827.200, headless, `--force-device-scale-factor=1` |
| Platform | Fedora, Linux 7.0.13-200.fc44.x86_64, X11 |
| Measuring size | 100px, normalised to units per 1000 em |
| Ground truth | fontTools 4.63.0 over `/usr/share/fonts` |

Two facts about this box that the numbers below depend on, both established by measurement
rather than assumed:

- `sans-serif` resolves to **Liberation Sans**. `A` measures 666.99 under both.
- A family that does not exist at all falls back to a serif face: `x` at 500 advance and
  460 ink ascent, `H` at 722.17 and 650.

Probe sources are not committed. They were scratch instruments, and the ones worth keeping
belong in the test suite of section 9 rather than in a probes directory.

## A note on attribution, before any of it

`ROADMAP.md` and `docs/build-spec.md` were both written by a Claude session, recording what
Justin said. That recording is the whole point of them and they are trusted here. But it
means a sentence in those files of the form *Justin observed X* is **second-hand**: it is
one agent's report of a conversation, not Justin's own words on the page.

This document therefore attributes such claims to the file that carries them — "the build
spec records", "set 9 records" — and reserves "Justin" for what he has said directly in
this session. Justin has flagged the distinction being collapsed as a real error, and it is
one: the repo's central discipline is keeping his direction separate from Claude's ideas,
and blurring who said a thing is the first step to losing that.

---

## 0.1 Canvas `measureText` is not additive — but it is not trustworthy either

**The spec's hypothesis is wrong, and the conclusion it expected is right for a different
reason.** That distinction matters, so both halves are set out.

### The hypothesis, and why it fails

`docs/build-spec.md` §0.1 supposed that canvas resolves fallback per character and sums
advances, so `measureText(anchor + g).width - measureText(anchor).width` would equal the
glyph's own advance and `shift` would be zero by construction.

It does not. Canvas *does* see re-itemisation. Under `sans-serif`, with `⬤` U+2B24:

| | alone | after `◷` U+25F7 | shift |
| --- | --- | --- | --- |
| canvas `measureText` | 1389.65 | 928 | −461.65 |
| DOM `Range` rect | 1389.69 | 928.13 | −461.56 |

Both engines catch it, and they agree to within a rounding artefact. So the anchor is not
dead by construction.

Chrome says why, when asked directly. `CSS.getPlatformFontsForNode` is the protocol call
behind the DevTools "Rendered Fonts" panel, and it reports the faces actually used per node:

| run, requested as `sans-serif` | faces Chrome used |
| --- | --- |
| `⬤` | Adwaita Sans (1 glyph) |
| `◷` | Noto Sans Math (1) |
| `◉` | Noto Sans Math (1) |
| `◷⬤` | **Noto Sans Math (2 glyphs)** |
| `◉⬤` | **Noto Sans Math (2 glyphs)** |
| `◡⬤` | **Noto Sans Math (2 glyphs)** |
| `○⬤` | Liberation Sans (1), Adwaita Sans (1) |

So the mechanism is measured, not inferred. `sans-serif` is Liberation Sans here, which has
no U+2B24, so `⬤` alone falls back to Adwaita Sans at 1389.65. When the anchor is a
character Liberation Sans also lacks, Chrome picks one fallback face for the segment and
**that face supplies the following glyph too**, so `⬤` comes from Noto Sans Math at 928 and
loses a third of its width because of its neighbour.

The `○⬤` row is the control that completes the picture. `○` U+25CB *is* in Liberation Sans,
so no fallback is triggered, `⬤` falls back on its own to Adwaita Sans, and there is no
shift. **The shift happens when the anchor itself forces a fallback** — which is why a
Latin anchor can never produce one, and why the anchor reads as dead.

### The real defect: canvas and DOM disagree about fallback

This is the finding that actually settles the design, and the spec did not anticipate it.

Canvas 2D text and DOM layout are separate paths in Chrome, and they **do not always
choose the same face**. At 100px, `sans-serif`:

| run | canvas run width | DOM run width | agree |
| --- | --- | --- | --- |
| `⬤` | 138.96px | 138.97px | yes |
| `◉⬤` | **222.76px** | **176.61px** | **no** |
| `◡⬤` | 176.60px | 176.61px | yes |
| `◷⬤` | 176.60px | 176.61px | yes |
| `○⬤` | 199.37px | 199.38px | yes |

For `◉⬤` canvas keeps `⬤` from the primary face at 138.96px while the DOM re-itemises it
to 92.81px — a 46px disagreement about the same string in the same font. Rendering both and
screenshotting them together confirms it visually: the canvas circle is plainly larger than
the DOM circle. Same page, same screenshot, so the comparison is a fair one.

The DOM is what the specimen row shows. So where the two disagree, **canvas is reporting a
width the page never draws.**

### What the current bench renders where, because this is easy to get backwards

Worth stating flatly, since the finding above is meaningless without it.

**Nothing you see in `glyph-bench.html` is canvas.** The canvas is created at line 238 and
never appended to the document — verified, there is no append site for it. It exists only
to run `measureText`. The specimen `#spec` is a `<div>`, and the width-group cards and the
per-glyph table set `style.fontFamily` on ordinary elements.

So the split is not specimen-against-groups. It is:

- **everything on screen** — specimen, group cards, table glyphs — is DOM,
- **every number on screen** is canvas.

The disagreement found above is therefore between the picture and the figures printed
beside it, on the same page, for the same glyph. That is the whole reason it matters.

The screenshot referred to above is one I generated: a purpose-built probe page that drew
each run twice, once with `fillText` into a visible `<canvas>` and once as DOM text, so the
two paths could be compared at the same scale in a single image. It is not a view of the
bench, and it is not one of Justin's screencaps.

### Kerning is the second reason the canvas formula cannot be trusted

`w(anchor + g) − w(anchor)` cannot separate *the glyph got narrower* from *the pair got
kerned closer*. Under `sans-serif` with `A` as anchor and `V` as glyph, canvas gives a
shift of −74.21, which is entirely kerning. The DOM attributes the kern to the left-hand
character, so the glyph's own rect is unchanged: 667.19 against 667.03 alone.

The current bench's note tells the reader to treat single-digit shifts as inconclusive.
That advice exists because the instrument conflates two things. The DOM does not.

### So why does the anchor look dead in practice?

Three causes stacked, none of them the hypothesised one:

1. The default family is `monospace`, where every advance is 600 and nothing can shift.
2. The default anchor is `0`, and Latin anchors do not change fallback for these glyphs.
3. Of the six `ANCH_PRESETS`, only `◉` and `◡` move `⬤` under a proportional family — and
   `◉` is precisely the case where the canvas formula returns 0 and the DOM returns
   −461.56. The one preset most likely to show something is the one the instrument misses.

### Decision

**Measure the adjacency shift in the DOM, with a `Range` per character.** Section 2 of the
spec reaches the right instrument; the reasoning under it should be replaced.

Consequence the spec should absorb, because §2 currently says "two engines, two purposes,
use both; do not pick":

- Canvas `TextMetrics` is still the only source of `actualBoundingBox*`, so the guides in
  §6 must come from it.
- But the guides are drawn over a DOM-rendered specimen, and the two can resolve different
  faces. When they do, the guides describe a glyph that is not on screen.
- The advance is the available discriminator: compare the canvas advance against the DOM
  per-character rect for the same glyph in the same run, and where they differ, say so
  rather than drawing guides that do not belong to the visible glyph. This is the same
  discipline §0.3 imposes on x-height, applied to the whole guide set.

That is a recommendation, not a settled decision. It expands what §6 has to handle and
Justin has not seen the case yet.

---

## 0.2 Identicons: padding is the variable that matters, not size

### First, a count correction

The spec says "the ~40 block canonical names actually present in `data/glyphdata.json`".
There are **212**. The inventory grew when grouping went over the full set. Everything
below is measured over all 212.

### Determinism holds

`jdenticon.toSvg()` on `Miscellaneous_Mathematical_Symbols_B` returns byte-identical SVG
across calls, 640 bytes. The path data is identical modulo the numbers when rendered at 16px
and at 64px, so the design is scale-invariant and only the coordinates change. The
portability claim in the spec stands: a tool hashing the same canonical alias gets the same
icon.

### The measurement

Each of the 212 icons was rasterised at its true pixel size — not supersampled, because the
question is what survives N device pixels — and all 22,366 pairs compared by mean absolute
RGB difference per pixel, 0 to 255.

| size | padding | min | p05 | median | pairs <5 | pairs <10 | pairs <15 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 12px | 0.08 | 0.51 | 21.11 | 40.97 | 8 | 81 | 302 |
| 12px | 0 | 1.27 | 49.86 | 93.94 | 2 | 5 | 18 |
| 16px | 0.08 | 0.71 | 28.05 | 52.84 | 5 | 25 | 111 |
| **16px** | **0** | **6.02** | **48.95** | **92.37** | **0** | **6** | **16** |
| 20px | 0.08 | 3.85 | 31.33 | 59.12 | 1 | 20 | 74 |
| **20px** | **0** | **7.89** | **52.42** | **92.39** | **0** | **3** | **11** |
| 24px | 0 | 6.85 | 48.78 | 87.50 | 0 | 3 | 12 |

Two things fall out, and the second is the useful one:

- **Reduced padding helps, substantially.** At 16px, dropping jdenticon's default 0.08
  padding takes the median pair distance from 52.84 to 92.37 and the number of effectively
  identical pairs from 25 to 6. The default padding spends about a sixth of each linear
  dimension on margin, which at 16px is the difference between a 13px design and a 16px one.
- **Above 16px, size buys little.** With padding removed, 16px and 24px are within noise of
  each other on every column. The spec's worry was the wrong one: the icons are not
  size-limited, they are margin-limited.

`padding: 0.02` and `padding: 0` measure identically, because 0.02 × 16px is 0.32px and
quantises to zero. Any padding below about 1/size is the same as none.

### What the numbers do not capture, and the eye does

I rendered all 212 at each size and looked at them, plus a mock table row at the intended
size.

- 12px is mush. Icons read as coloured texture, not shape.
- 16px with no padding: icons are reliably *different from each other*, but the internal
  geometry is hard to hold. You can see two rows differ; you cannot easily learn what the
  shape is.
- 20px is where individual forms — diamonds, crosses, concentric squares — become readable
  rather than merely distinguishable.
- 24px is comfortable and buys nothing over 20px that I could see.

That distinction is the one that matters here, because recognition memory is the whole
mechanism (`ROADMAP.md` set 9). An icon that is merely distinguishable supports *these two
rows differ*. An icon whose geometry is readable supports *that is the orange pointy one*,
which is what set 9 records as the point of having icons at all.

### Contrast is not a problem

I thought several icons looked washed out at 16px and measured it: mean distance from white
ranges from 104.5 (`Coptic`) to 211.7 (`Coptic_Epact_Numbers`), and no icon has a maximum
below 60. The impression was wrong and there is nothing to fix. Recording it so the idea
does not get reintroduced.

### Decision

**20px, padding 0.** 16px works if the column budget demands it; 12px does not.

One constraint on any further tuning: **padding is safe to change, colour configuration is
not.** Padding scales the design within its tile and leaves the design itself alone, so two
tools with different padding still draw recognisably the same icon. Changing jdenticon's
colour config would break the cross-tool visual identity that the canonical hash input
exists to guarantee. Leave the colours at defaults.

---

## 0.3 x-height probing: detectable, with one honest limit

### The spec named the wrong font

`docs/build-spec.md` §0.3 proposes testing against `Noto Sans Symbols`, "which may contain
neither `x` nor `H`". It contains both. fontTools over the installed faces:

| family | has `x` | has `H` | OS/2 `sxHeight` | OS/2 `sCapHeight` |
| --- | --- | --- | --- | --- |
| Noto Sans Symbols | yes | yes | 536 | 714 |
| **Noto Sans Symbols 2** | **no** | **no** | 536 | 945 |
| Noto Sans Math | yes | yes | 536 | 714 |
| Symbola | yes | yes | 450.7 | 657.2 |
| STIX Two Math | yes | yes | 473 | 657 |
| Liberation Sans | yes | yes | 528.3 | 688 |

`Noto Sans Symbols 2` is the real case, and it is a good one. Note that it still *declares*
`sCapHeight` 945 despite carrying no capital letters. Anyone who reaches for the OS/2 table
as a shortcut gets a confident wrong answer.

### The hazard is real

Probing `Noto Sans Symbols 2` alone returns `x` ink ascent 460 and `H` ink ascent 650 —
which are exactly the absent-family baseline. The browser answers, silently, with another
face's metrics. Precisely the trap `ROADMAP.md` set 11 anticipated.

Chrome names the impostor when asked over the protocol: both `x` and `H` requested in
`Noto Sans Symbols 2` are drawn from **Liberation Serif**. Nothing in any page-level API
says so.

### Three candidate discriminators fail

| discriminator | result |
| --- | --- |
| probe advance equals the notdef advance — the spec's candidate | **fails, 0 of 7.** Never fires, including on Symbols 2 |
| `document.fonts.check(font, "x")` | **useless.** Returns `true` for every family, present glyph or not |
| `fontBoundingBoxAscent/Descent` differ from baseline | **fails.** Reports the *requested* family's box even when the glyph fell back |

The `fontBoundingBox` result is worth keeping in mind beyond this test: it is a property of
`ctx.font`, not of the glyph measured. It cannot be used to learn anything about which face
drew a character.

### One works

Compare the probe's **full ink signature** — advance, ascent, descent, left, right —
against the same probe measured with the head family replaced by a family that does not
exist. Correct on all seven single-family cases: it fires on `Noto Sans Symbols 2` and on
nothing else.

**The baseline must mirror the rest of the stack.** A naive baseline of just
`"__absent__"` fails the moment the requested font is a stack:

| stack | naive baseline | chained baseline |
| --- | --- | --- |
| `"Noto Sans Symbols 2"` | fires | fires |
| `"Noto Sans Symbols 2", sans-serif` | **misses** | fires |
| `"Noto Sans Symbols 2", monospace` | **misses** | fires |
| `"Noto Sans Symbols 2", "Liberation Sans"` | **misses** | fires |
| `"Noto Sans Symbols", sans-serif` | correctly silent | correctly silent |
| `"Symbola", monospace` | correctly silent | correctly silent |

So: measure `x` in `<stack>`, measure `x` in `"__absent__", <tail of stack>`, compare
signatures.

### The limit, stated rather than papered over

`"Liberation Sans", sans-serif` also fires — because on this box `sans-serif` *is*
Liberation Sans, so the requested face and the fallback are the same face and no
measurement can tell them apart.

This is not a bug to fix; it is what the test can know. Two consequences:

- The failure direction is safe. It omits a guide rather than drawing a wrong one, which is
  what set 11 requires.
- But it will fire whenever Justin names the platform's default family, which is a common
  case, and the guide it suppresses would have been correct.

The honest wording for the omission is therefore *cannot confirm this is the right face*,
not *this font has no x-height*. The first is true in both situations; the second would be
false in the Liberation Sans case.

### A cross-check the browser cannot do

`sysfont.py` can read OS/2 `sxHeight` and `sCapHeight` directly, and the browser cannot. The
measured ink ascent and the declared value differ by up to about 2% where both exist —
Liberation Sans measures 540 against a declared 528.3. Not a discrepancy to resolve; ink
ascent and the declared metric are different quantities. Recorded because it is the sort of
gap that later reads as a bug.

### Decision

**Chained-baseline signature comparison, with the omission worded as "unconfirmed".**

---

---

## Font identity: what a page can and cannot know

Raised by Justin against 0.3 — is there really no browser-accessible way to tell which font
supplied a character, outside DevTools? Measured rather than recalled.

### There is no page API for "which face drew this run"

| what | result |
| --- | --- |
| `getComputedStyle().usedFont` or similar | does not exist |
| `TextMetrics.fontFamily` | does not exist |
| `document.fonts.check(font, text)` | returns `true` for every system family; only meaningful for web fonts |
| `document.fonts` entries | empty on a page with no `@font-face`; system fonts are not enumerated |

So the direct answer stands: **no.** A page cannot be told which face rendered a character.

### But three things get close, and one is new

**1. `queryLocalFonts()` — the Local Font Access API. It is present.** Chrome 149 on this
box exposes it, `FontData` and all. It is gated three ways: secure context, a `local-fonts`
permission prompt, and **user activation** — calling it without a click throws
`SecurityError: User activation is required`. Granted, it returns every installed face with
a `.blob()` giving the actual font file, which can be parsed for its `cmap` in the page.
That is real glyph coverage, not a guess.

Two limits. It tells you what is *installed*, never what Chrome *chose*, so it narrows the
candidates without identifying the winner. And *I believe* it is desktop-only — not
available on Chrome for Android — which is half the target. That belief is unverified here
and is worth one minute on Justin's device, because it decides whether this is a
Fedora-only luxury or a real mechanism.

**2. `CSS.getPlatformFontsForNode` — ground truth, for tests only.** This is the DevTools
protocol call behind the "Rendered Fonts" panel, and it works: the tables in 0.1 and 0.3
above are its output. It reports each face used and how many glyphs it supplied. A page can
never call it. **A test can**, by driving headless Chrome over the protocol, and that makes
it an oracle: any in-page guesser can be scored against Chrome's own answer on this
machine, then trusted proportionally on a device where the oracle is unavailable.

It covers DOM nodes only. There is no equivalent for canvas-drawn text, so the canvas side
of 0.1 rests on advance fingerprinting — 1389.65 is Adwaita Sans and nothing else installed
here shares it.

**3. Metric fingerprinting against `sysfont.py`.** Already assessed in `PROPOSALS.md`. The
advance is often a unique discriminator among installed faces, and fontTools supplies the
per-face table to match against.

### So the guesser is necessary, and it can be honest

None of the three is sufficient alone, and the combination is a guess rather than a
reading. Justin's direction is that the tool should therefore guess as well as it can and
say plainly that it is guessing. Recorded in `ROADMAP.md` set 13.

---

## Incidental: a live bug in `glyph-bench.html`

Found while writing probe 0.1, because the probe had it too.

`Noto Sans Symbols 2` is **not valid CSS unquoted**. A family name given as identifiers
cannot have one that starts with a digit, so the whole declaration is dropped. The bench
inserts preset names raw in three places — `ctx.font = \`${size}px ${fam}\`` at line 266,
and `style.fontFamily = fam` at lines 262, 292 and 333.

Verified by reproducing the bench's exact assignments over `FAM_PRESETS`: one of the fifteen
fails, and it fails silently in both canvas and DOM, leaving whatever font was set before.

So selecting `Noto Sans Symbols 2` in the current bench measures **the previously selected
font**, under the new font's label. Every other preset is fine.

Two things follow for the rebuild:

- Quote every family token that is not a CSS generic. The dead `CSS.escape ? fam : fam`
  guard already in `DEBT.md` sits at line 291 and was evidently an attempt at this.
- Justin's font panel is authored data now (`docs/fonts.md`, `data/config.json`), so any
  family may arrive from the config. Quoting has to happen in the reader, not be relied on
  in the authored file.
