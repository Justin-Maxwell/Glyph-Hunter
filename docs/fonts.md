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
| `Noto Sans Symbols 2` | Named as the likely Android supplier for the symbol coverage being hit. (established) |
| `Noto Sans Symbols` | On-device measurement traced the run to `NotoSansSymbols-Regular-Subsetted.ttf`, a device-specific subsetted build. (established) |

Gap: **Noto Sans Math** is absent. It was the original attribution for the run at 836,
later retracted in favour of the subsetted Symbols build. Worth keeping in the panel to
make that retraction re-checkable rather than only recorded. (inferred)

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
