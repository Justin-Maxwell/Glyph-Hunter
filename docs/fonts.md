# Font panel

Why each face is offered in the bench's family selector.

A face earns its place by answering a question no other face in the panel answers. Any
entry that cannot be given a reason should be removed rather than kept for completeness.

Marked **(established)** where a prior measurement session recorded the figure or the
coverage fact. Marked **(inferred)** where the reason is Claude's reconstruction and
wants Justin's confirmation or correction.

---

## Generic CSS families

What the browser actually resolves to on this device. The default path a reader hits, and
the only entries whose answer differs per platform without the font list changing.

| Family | Reason |
| --- | --- |
| `monospace` | The terminal-alignment case as the browser sees it. (inferred) |
| `sans-serif` | The common-prose case. (inferred) |
| `serif` | Second prose case; serif faces sometimes carry different symbol coverage. (inferred) |
| `system-ui` | Platform default, which on Android is not the same as `sans-serif`. (inferred) |

## Symbol suppliers

The faces that actually carry the U+29Bx circled run. These are the ones that decide
whether the candidate marker set renders at all.

| Family | Reason |
| --- | --- |
| `Noto Sans Symbols` | The confirmed Android supplier. On-device experiment, 2026-08-12 evening, traced the U+29Bx run to `NotoSansSymbols-Regular-Subsetted.ttf`, Android's reduced build of this family. (established) |
| `Noto Sans Symbols 2` | A distinct family, not the supplier. Kept as the near-miss that has to be ruled out by measurement rather than by name. (established that it is not the supplier) |

Two attributions have been made and retracted for this run. Both are recorded so neither
is re-derived:

- **Noto Sans Math** — retracted. Gave eleven of twelve at 836, which looked conclusive
  and was not the face in use.
- **Noto Sans Symbols 2** — retracted. Inferred from the family name; the subsetted build
  belongs to Noto Sans Symbols, without the 2.

### The advance is the discriminator

The candidate faces do not agree on the run's advance. Noto Sans Math gives 836; the
on-device measurement is 796. (established)

So the measured number identifies the supplier without DevTools, on a platform where
per-glyph font readout is otherwise only reachable over USB. That the 796 belongs to the
subsetted Symbols build specifically is (inferred) — it follows from the retraction rather
than from a direct file measurement.

This is the strongest argument for the bench existing at all: naming a font by measuring
it, on a device that will not tell you.

## Reference desktop faces

Where the advance figures in the design history came from. Their value is reproducibility
of prior measurements.

| Family | Reason |
| --- | --- |
| `DejaVu Sans` | Circles at 873, ⬤ at 1119, • and ◦ at 590, circled operators at 838. The most-cited reference. (established) |
| `FreeSerif` | FreeSerif Bold lacks ◔ and ◕, which was one of the coverage findings. (established) |

Gaps, each blocking reproduction of a recorded figure:

- **FreeSans** — the 1000-against-800 oversize figure for ⬤ came from FreeSans, not
  FreeSerif. The panel cannot currently reproduce it. (established)
- **Liberation Sans**, **Liberation Mono** — the Liberation family carries ◒◓◔◕ only,
  which was the finding that reversed an earlier coverage recommendation. (established)
- **Unifont** — grouped with FreeSans as lifting ⬤ ◯ ⭕ ⬛ ⬜ ⨀ ⨁ ⨂ above the circle
  base. (established)

## Terminal and monospace faces

East Asian Width matters only in fixed-cell renderers, so these are the faces where the
width-class question has consequences.

| Family | Reason |
| --- | --- |
| `DejaVu Sans Mono` | Monospaced counterpart to the primary reference face. (inferred) |
| `Cascadia Code` | Common terminal face. (inferred) |
| `JetBrains Mono` | Common terminal face. (inferred) |
| `Hack` | Common terminal face. (inferred) |
| `Iosevka` | Narrow-advance terminal face, so a different cell ratio from the others. (inferred) |

Note: monospaced faces were found not to lift any glyph above the circle base, and to be
unaffected by the cross-family advance divergence. (established) That makes them a
control group rather than a risk case — which is a reason to keep them, but arguably
fewer than four of them.

## CJK

| Family | Reason |
| --- | --- |
| `Noto Sans CJK JP` | Carries the plain circles but lacks the quadrant circles; draws ◦ at 1000. The coverage-gap case that decided the all-Ambiguous route. (established) |

## Platform UI

| Family | Reason |
| --- | --- |
| `Roboto` | Android's UI face. (inferred) |

---

## Open questions for Justin

- Are the four terminal faces all pulling their weight, or is the list padded?
- Should the missing reference faces be added, given they block reproducing recorded
  figures?
- Is `Roboto` there as the Android UI face, or for some other reason?
