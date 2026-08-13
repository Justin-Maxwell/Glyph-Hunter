# Curation record

Justin's trim rulings, set by set, with the counts they were made against. This file
records **decisions already taken**, never proposals. Proposals live in `PROPOSALS.md`;
direction lives in `ROADMAP.md`.

Every number here is generated from `data/config.json` and `data/glyphdata.json`, not
typed by hand. Regenerate rather than edit.

## Method

Trimming is interactive, set by set, after a rendered show-and-tell sheet. Three states:

- **keep** — all members stay
- **compress** — the family collapses to a few representatives, its total count retained
- **drop** — removed from the inventory entirely, as Latin alphabetics already are

Sampling rules that emerged:

- A **sequence family** varies only in one enumerable position, so first and last suffice
  regardless of size. Losslessly described by range plus style plus count, so it compresses
  at **inventory level**.
- A **heterogeneous family** varies unpredictably, so the sample must grow with the family,
  and around six is the working figure. The sample is a judgement, so it compresses at
  **group level** and stays reversible.
- Compressed exemplars from sibling subgroups **pool into one shared leaf** rather than each
  becoming a leaf of two.

## Tally

| | count |
| --- | --- |
| Starting inventory | 9800 |
| Dropped so far | 3817 |
| Remaining | 5983 |
| Styled alphanumerics pulled in | 247 |
| **Projected** | **6230** |

## Dropped entire

| set | count | reason |
| --- | --- | --- |
| braille | 256 | a script |
| emoji and pictographs | 1275 | not appropriate here |
| sign writing | 490 | a script notation |
| script numerals | 894 | script digits; no other script's general numerics were kept |

Cuneiform numerals went with `script numerals`. They were considered separately on their
looks and dropped on consistency. Worth recording why keeping them would not have opened a
door: Egyptian Hieroglyphs (1072), Anatolian Hieroglyphs (583), Cuneiform signs proper (922)
and Early Dynastic Cuneiform (196) are **all General_Category Lo** and so were never in the
inventory at all. The boundary is category, not taste.

## Dropped in part

### cjk radicals and strokes — 382 dropped

Kangxi radical, CJK radical and Yi radical go. Kept:

- **CJK stroke**, 36 members — bare line primitives: a diagonal, a hook, a corner, a
  right angle, an ellipse. Not script content in the ordinary sense.
- **ideographic annotation**, 16 members.

### music — 520 dropped, 88 kept

Byzantine Musical Symbols, Ancient Greek Musical Notation and Znamenny Musical Notation go
entire. Within Musical Symbols, dropped: clefs and tablature, notes with stems, rests,
mensural note values, accidentals, octave and directives, and the unclassified remainder
(mostly Gregorian and Kievan neume names).

The first music ruling was made against a sheet covering only the twelve largest families,
which was two thirds of the set. Justin caught it. The unseen third held barlines, staff
lines and noteheads — geometric, not notational. **Show the whole set or state the coverage
plainly.**

Grouping here is **functional**, not by name stem, block or codepoint run. It is the first
case where the leaves fell inside the 20–25 band with no further splitting:

| family | count |
| --- | --- |
| barlines and repeats | 16 |
| ornaments | 15 |
| time signatures | 10 |
| noteheads | 10 |
| dynamics and hairpins | 7 |
| articulations | 6 |
| staff and system lines | 6 |
| pedals | 5 |
| analytics | 4 |
| stems, flags, beams, dots | 3 |
| braces and brackets | 2 |
| wavy and glissando | 2 |
| kievan notation | 2 |

## Compressed

### enclosed sets

- **CJK months** stay, compressed to first and last. Telegraph day and hour follow the same
  rule as the same construction.
- **Latin digit and alphabetic sequences** compress to first and last.
- **Syllabary sequences** — circled katakana, circled hangul, parenthesized hangul — compress
  the same way. They read as "label" by name but are the syllabary in script order.
- **Weekday cycles** — exactly two exist in the whole inventory, both in Enclosed CJK Letters
  and Months. Compressed to first and last.
- **Tortoise shell** and **rounded symbol** keep every member.
- Heterogeneous remainders — circled ideograph, parenthesized ideograph, squared CJK — take a
  representative sample.

## Pulled back in

Five styled alphanumeric families from Mathematical Alphanumeric Symbols: **script, bold
script, fraktur, bold fraktur, double-struck**. Subgroups are capitals, lowercase, and digits
where digits exist — only double-struck has digits.

This revises the inventory rule, which excludes letters and digits of every script. The
exception is warranted because first and last make a full alphabet run cost two exemplars.

Two findings attached to it:

- The odd member counts (41, 47, 52, 52, 55) are not an error. The missing members were
  already encoded in **Letterlike Symbols** before the maths block existed, so Unicode did
  not encode them twice. Script caps lack B E F H I L M R; script smalls lack e g o;
  double-struck caps lack C H N P Q R Z; fraktur caps lack C H I R Z — and those five are
  named **BLACK-LETTER**, not FRAKTUR, which is why a naive stem match misses them.
- So three compressed pairs **straddle two blocks**: double-struck capitals run U+1D538 to
  U+2124, fraktur capitals U+1D504 to U+2128. A leaf built this way cannot assume block
  contiguity.

## Standing rules from Justin

- **Obscure punctuation stays in; everyday punctuation goes.** This cuts within sets, not
  between them, so the tractable form is to enumerate the *everyday* set explicitly — the
  short list — and keep the rest.
- Blocks are a hint for grouping only. Proved twice: by the Letterlike borrowing above, and
  by cuneiform numerals showing 69 distinct advance widths from 0.43 em to 4.64 em within one
  block.

## Open

- The everyday-punctuation exclusion list is not yet enumerated.
- `script punctuation` (426) needs that enumeration plus a harvest of its bare vertical
  bars and dandas, not a yes/no ruling.
- `unsorted` (243) is a **defect, not a set**: those glyphs fell through every rule in
  `gen_groups.py`.
- Unruled candidates: games, divination, alchemy and astrology, historic and religious,
  legacy computing, cjk punctuation, fullwidth and halfwidth, standalone accents.
- Arabic Mathematical Alphabetic Symbols (143, 2 currently in) poses the same question as the
  styled Latin families.
