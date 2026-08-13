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

### games — 324 → 149, nothing dropped

Almost entirely enumerable runs, so compression alone removes 175.

| compressed set | members | range | exemplars |
| --- | --- | --- | --- |
| playing cards | 56 | U+1F0A1–U+1F0DE | U+1F0D1, U+1F0BE |
| mahjong numbered suits | 27 | U+1F007–U+1F021 | U+1F007, U+1F021 |
| domino horizontal | 50 | U+1F030–U+1F061 | U+1F030, U+1F061 |
| domino vertical | 50 | U+1F062–U+1F093 | U+1F062, U+1F093 |

Everything else stays intact: chess rotated (23 neutral, 23 white, 23 black), card trumps 21,
xiangqi red 7 and black 7, chess upright neutral 7, white 4, black 4, mahjong winds 4,
dragons 3, flowers 4, seasons 4, joker and back 2, card joker, fool and back 5. Every one is
already inside the size band.

Two defects found while building it:

- The **nine mahjong circle tiles are in the `circles` group, not `games`**, because the shape
  rule matches CIRCLE in the name. Same failure mode as the arrows precedence rule.
- **Xiangqi pieces are circled Han characters** — red outlined, black knocked out of a filled
  circle. They belong visually with `circled ideograph` and `negative circled`.

## Exemplars are not range bounds

Established on the playing cards. "First and last" had silently meant *first and last by
codepoint*, because that was mechanical and unarguable. Cards broke it: the block runs spades,
hearts, diamonds, clubs, so the codepoint endpoints are ace of spades and king of clubs —
**both black**. A pair that hides half the deck being red is a bad representative of the family.

So the exemplars are ace of clubs and king of hearts, which are the wrong way round in
codepoint terms: U+1F0BE sits 19 codepoints before U+1F0D1.

The rule that follows:

- **Exemplars are chosen for visual coverage of the family**, not as bounds. They should span
  whatever dimension actually varies — colour here, weight or fill elsewhere.
- **The range and count are recorded separately**, and they are what makes inventory-level
  compression lossless and regenerable.
- A compressed set must therefore state both, and must not assume the exemplars delimit it.

Mahjong keeps codepoint order, where the run is already characters, bamboos, circles.

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

## Exemplars: four, seeded-random

Supersedes first-and-last. Endpoints turned out to be a poor sample: they are systematically
the *degenerate* members. The first hexagram is all-solid, the first domino is the tile back,
the first tetragram is all-solid. A pair of extremes tells you the family's bounds and hides
everything between them.

- **Four exemplars per compressed set, drawn at random**, plus the total count. The count is
  what implies the permutation space; the four show what a typical member looks like.
- **Seeded on the family name**, so the same four come back on every regeneration. An unseeded
  draw would churn the config on every run and make diffs meaningless.
- The **range and count remain recorded separately**. Random exemplars delimit nothing, so this
  is now load-bearing rather than a nicety.
- **Hand-picked overrides stay available** and are recorded as such.

Known weakness, worth stating rather than discovering later: random samples the typical, and a
visually distinct minority can be missed entirely. Four random playing cards drew four pip
cards and no court card — and the court cards are the interesting ones. Roughly a one-in-three
chance of that happening. Where a family has a distinct minority, either override by hand or
stratify the draw.

### Consequence for pooling

Compressed exemplars were to pool into one shared leaf. At two per set that landed at 22, just
inside the band. At four it does not:

- enclosed-set sequences: 11 sets, 44 exemplars
- styled alphanumerics: 11 subgroups, 44 exemplars

Both now need two leaves rather than one.
