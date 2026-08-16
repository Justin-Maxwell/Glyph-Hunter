# UCD properties, complete catalogue with assessment

- Scope: every Unicode Character Database property, plus the adjacent non-UCD data sets that behave like properties.
- Purpose: candidate selection and validation for MarkRight structural markers.
- `Have` column: whether glyph-hunter currently carries it.
- `Thoughts` is my read, not a recommendation you have to take.
- UCD 15.0.0 unless a property is noted as later.

---

## 1. Catalog properties

| Property | What it is | Source | Have | Thoughts |
|---|---|---|:---:|---|
| **Name** | The formal, immutable character name. Unique across the standard. | `UnicodeData.txt` | ✓ | Already your annex key. Worth knowing the name is normative and frozen — a wrong name stays wrong (`U+FE18` is misspelt "BRAKCET" forever), which is what Name_Alias exists to patch. |
| **Name_Alias** | Corrections, abbreviations, control-code names, and alternates. Typed: `correction`, `control`, `alternate`, `figment`, `abbreviation`. | `NameAliases.txt` | ✗ | Low value for symbols, which rarely have aliases. Matters if you ever document C0 controls — your header uses SOH, US and CR, and their only real names are aliases. That's a genuine hit for the header spec. |
| **Age** | The Unicode version that assigned the codepoint. | `DerivedAge.txt` | ✗ | The single cheapest coverage proxy you can get. Font vendors add glyphs years after assignment, so Age is a lower bound on how long anyone has had to implement it. Anything ≤ 3.2 is broadly present; 5.x–6.x is patchy; 13.0+ is Symbola-and-Noto-only in practice. This would let you pre-filter the 491 before touching a font file. |
| **Block** | The fixed named range. Allocation convenience, not a semantic grouping. | `Blocks.txt` | ✓ | Weak as a semantic signal, strong as a coverage signal — font vendors subset by block, so co-residency correlates with block far more than with category. Your Geometric-Shapes-versus-Sm result is really a block-coverage result. |
| **Script** | The writing system. `Common` (Zyyy) for script-neutral, `Inherited` (Zinh) for marks that take their neighbour's. | `Scripts.txt` | ✗ | **Bears directly on adjacency.** Shaping itemises by script *before* font, so a marker with a real script value forces a run boundary that no separator space can heal. Nearly every symbol is Common, so this is a cheap pass/fail rather than a sift — but a candidate that isn't Common should be disqualified outright. |
| **Script_Extensions** | For Common/Inherited characters, the set of scripts that actually use them. | `ScriptExtensions.txt` | ✗ | Refines Script. A Common character with a narrow scx (say `{Arab}`) can still trigger script-specific font selection. Rare among Sm; worth checking rather than assuming. |

---

## 2. Enumerated properties

| Property | What it is | Source | Have | Thoughts |
|---|---|---|:---:|---|
| **General_Category** | The two-letter class. `Sm` math symbol, `So` other symbol, `Po` other punctuation, and so on. | `UnicodeData.txt` | ✓ | You know its limits. Worth holding in mind that for symbols the Sm/So line is acknowledged as rough, and the stability policy means it will never be revisited. Treat it as a historical accident with downstream consequences, not as a statement about the character. |
| **Canonical_Combining_Class** | Reordering weight for combining marks, 0–254. | `UnicodeData.txt` | partial | 0 for everything you'll ever consider. Only useful as an assertion — a non-zero ccc would mean the character reorders under normalisation, which for a structural marker is disqualifying. Cheap sanity check. |
| **Bidi_Class** | Directional class: `ON`, `L`, `R`, `AL`, `ES`, `ET`, `CS`, `WS`, `B`, `S`, and the explicit-format controls. | `UnicodeData.txt` | ✓ | You've measured it. The value to hold onto: `ON` means the character takes its direction from context, which is what a structural marker wants. `ES`/`ET`/`CS` are the number-handling classes and behave oddly next to digits — relevant if a marker ever sits adjacent to an ordinal. |
| **Bidi_Paired_Bracket_Type** | `Open`, `Close`, or `None`. Drives the BD16 bracket-pairing pass. | `BidiBrackets.txt` | ✗ | Directly relevant to your inline bracket set. A character declared a bracket gets matched and mirrored as a *pair* by the bidi algorithm — so if your open and close aren't a declared pair, RTL handling of the enclosed span is undefined rather than merely imperfect. Worth checking ⸉/⸊. |
| **Decomposition_Type** | Canonical, or one of seventeen compatibility tags: `<font>`, `<noBreak>`, `<initial>`, `<medial>`, `<final>`, `<isolated>`, `<circle>`, `<super>`, `<sub>`, `<vertical>`, `<wide>`, `<narrow>`, `<small>`, `<square>`, `<fraction>`, `<compat>`. | `UnicodeData.txt` | partial | More useful than the raw mapping, because the *tag* tells you why it's unstable. `<super>` is what kills your ordinals; `<noBreak>` is what kills your separator; `<circle>` and `<square>` would kill any enclosed-shape candidate under NFKC. A single-column view of this over the 491 would be quick and informative. |
| **Numeric_Type** | `Decimal`, `Digit`, `Numeric`, or `None`. | `UnicodeData.txt` | partial | Assertion only. A marker with a numeric value would be parsed as a number by naive tooling. |
| **Joining_Type / Joining_Group** | Arabic and Syriac cursive joining behaviour. `U` non-joining, `T` transparent, `D` dual, `R` right, `L` left, `C` join-causing. | `ArabicShaping.txt` | ✗ | Nearly irrelevant — except `T` (transparent) is worth knowing about, since a transparent character sits inside a cursive join without breaking it. Symbols are `U`. Skip unless you care about MarkRight inside Arabic text. |
| **Line_Break** | Wrapping class. ~48 values; the ones that matter are `AL` alphabetic, `BA` break-after, `BB` break-before, `GL` glue/non-breaking, `SP` space, `ID` ideographic, `EX` exclamation, `OP`/`CL` open/close punctuation, `QU` quotation, `CM` combining. | `LineBreak.txt` | ✓ | Just added, and it earned its place immediately. Beyond the separator question: a marker with class `ID` gets a break opportunity on *both* sides, `AL` doesn't. If a depth run can wrap mid-run, the whole column concept fails. Worth auditing the marker set, not just the space. |
| **East_Asian_Width** | `N` neutral, `Na` narrow, `A` ambiguous, `W` wide, `F` fullwidth, `H` halfwidth. | `EastAsianWidth.txt` | ✓ | Your existing uniformity rule. The subtlety worth keeping: `A` is *context-dependent* — one cell in a Western locale, two in a CJK one — so an Ambiguous set is self-consistent only if the whole set is Ambiguous. Mixed A/N is the failure, not A itself. |
| **Grapheme_Cluster_Break** | UAX #29. `Control`, `CR`, `LF`, `Extend`, `ZWJ`, `Regional_Indicator`, `Prepend`, `SpacingMark`, `L`/`V`/`T`/`LV`/`LVT`, `Other`. | `GraphemeBreakProperty.txt` | ✗ | Defines one user-perceived character — which is what arrow-key movement and backspace operate on. Symbols are `Other`, meaning each marker is its own cluster. That's what you want, but it also means a depth-6 run costs six keypresses to cross. Relevant to hand-authoring ergonomics, not to correctness. |
| **Word_Break** | UAX #29. `ALetter`, `MidLetter`, `MidNum`, `Numeric`, `ExtendNumLet`, `Katakana`, `WSegSpace`, `Extend`, `Format`, and others. | `WordBreakProperty.txt` | ✗ | Governs double-click selection and word-wise cursor movement. Symbols are unassigned (`Other`), so each marker is its own word — meaning a double-click on node text won't drag the markers in. Good default; worth confirming rather than assuming, because it's the property an author actually feels. |
| **Sentence_Break** | UAX #29. `STerm`, `ATerm`, `Close`, `SContinue`, `Sp`, `Lower`, `Upper`, `Numeric`, and others. | `SentenceBreakProperty.txt` | ✗ | Marginal. Only bites if a marker is classed `STerm`/`ATerm` and thereby ends sentences in text-analysis tooling. Symbols aren't. |
| **Vertical_Orientation** | UAX #50. `U` upright, `R` rotated 90°, `Tu`/`Tr` transformed. | `VerticalOrientation.txt` | ✗ | Only matters in vertical CJK layout. If MarkRight is ever set vertically, an `R` marker rotates and a `U` one doesn't — a mixed set would look broken. Genuinely low priority unless vertical typesetting is on your horizon. |
| **Hangul_Syllable_Type** | `L`, `V`, `T`, `LV`, `LVT`, `NA`. | `HangulSyllableType.txt` | ✗ | Korean-only. Ignore. |
| **Indic_Syllabic_Category** | Brahmic structural roles: `Consonant`, `Vowel_Dependent`, `Virama`, `Nukta`, and ~35 others. | `IndicSyllabicCategory.txt` | ✗ | Ignore. |
| **Indic_Positional_Category** | Where a mark sits: `Top`, `Bottom`, `Left`, `Right`, and combinations. | `IndicPositionalCategory.txt` | ✗ | Ignore. |
| **Indic_Conjunct_Break** | Added 15.1, for the extended grapheme cluster rules. `Linker`, `Consonant`, `Extend`, `None`. | `DerivedCoreProperties.txt` | ✗ | Ignore. |
| **NFC_Quick_Check** | `Yes`, `No`, `Maybe`. Whether the character can appear in NFC. | `DerivedNormalizationProps.txt` | partial | You currently test by round-tripping, which is equivalent and arguably better. The QC properties exist for fast bulk scanning; at 491 candidates you don't need the optimisation. |
| **NFD_QC / NFKC_QC / NFKD_QC** | Same for the other three forms. | `DerivedNormalizationProps.txt` | partial | As above. The `Maybe` value is the interesting one — it means composition depends on context, which for standalone markers never applies. |
| **Identifier_Status** | UTS #39. `Allowed` or `Restricted`. | `IdentifierStatus.txt` | ✗ | Whether the character is safe in security-sensitive identifiers. Symbols are almost all `Restricted`, which is fine and expected — you're not writing identifiers. Useful only as a cross-check that a candidate isn't secretly a letter. |
| **Identifier_Type** | UTS #39. The *reason* for restriction: `Not_XID`, `Obsolete`, `Technical`, `Limited_Use`, `Exclusion`, `Uncommon_Use`, `Deprecated`, `Not_NFKC`, `Default_Ignorable`, `Recommended`, `Inclusion`. | `IdentifierType.txt` | ✗ | More interesting than Identifier_Status. `Obsolete`, `Deprecated` and `Technical` are quiet warnings about a character's standing that no other property surfaces. `Technical` in particular flags characters that exist for legacy systems rather than for text — worth avoiding for a format you intend to last. |
| **Equivalent_Unified_Ideograph** | Maps a radical or stroke to its CJK ideograph. | `EquivalentUnifiedIdeograph.txt` | ✗ | Ignore. |

---

## 3. String-valued properties

| Property | What it is | Source | Have | Thoughts |
|---|---|---|:---:|---|
| **Decomposition_Mapping** | The sequence a character decomposes to. | `UnicodeData.txt` | ✓ | You have it. Pair it with Decomposition_Type for the readable version. |
| **Simple_Uppercase / Lowercase / Titlecase_Mapping** | Single-character case mappings. | `UnicodeData.txt` | partial | Assertion only: a marker with a case mapping is a letter in disguise and will be mangled by any case-folding pass. Rare but real — some Letterlike Symbols in your 491 (`U+2118`, `U+214B`) sit near characters that do case-map. |
| **Case_Folding / Simple_Case_Folding** | The fold used for caseless comparison. | `CaseFolding.txt` | ✗ | Same assertion. If a marker folds to something else, caseless document comparison breaks. |
| **NFKC_Casefold** | The combined compatibility-decompose, casefold, remove-default-ignorables mapping. | `DerivedNormalizationProps.txt` | ✗ | This is the aggressive fold used by IDN and identifier comparison. Strictly harsher than NFKC alone, so if a character survives NFKC it may still not survive this. Worth testing if MarkRight will ever pass through URL, filename or identifier machinery. |
| **NFKC_Simple_Casefold** | Added 13.0. Same, using simple rather than full case folding. | `DerivedNormalizationProps.txt` | ✗ | Marginal variant of the above. |
| **Bidi_Mirroring_Glyph** | The codepoint a mirrored character becomes in RTL. | `BidiMirroring.txt` | ✗ | You have the *flag*; this is the *target*. The distinction matters: knowing `⦵` mirrors tells you there's a hazard, knowing what it mirrors *into* tells you whether the hazard is cosmetic or catastrophic. A character mirroring into another member of your own marker set is the worst case — the line changes meaning rather than merely looking odd. That specific check is impossible without this property. |
| **Bidi_Paired_Bracket** | The matching bracket's codepoint. | `BidiBrackets.txt` | ✗ | Companion to Bidi_Paired_Bracket_Type, above. Same relevance to your inline brackets. |
| **Jamo_Short_Name** | Korean transliteration component. | `Jamo.txt` | ✗ | Ignore. |
| **Unicode_1_Name** | The name from Unicode 1.0, where it differs. | `UnicodeData.txt` | ✗ | Deprecated. Occasionally reveals a character's original intent before it was repurposed — mildly interesting given your view on re-application, useless operationally. |
| **ISO_Comment** | Now always empty. | `UnicodeData.txt` | ✗ | Dead field. |

---

## 4. Binary properties — normalisation and composition

| Property | What it is | Source | Have | Thoughts |
|---|---|---|:---:|---|
| **Full_Composition_Exclusion** | The character never recomposes under NFC, even though it has a canonical decomposition. | `DerivedNormalizationProps.txt` | ✗ | Irrelevant for symbols, which have no canonical decompositions. Assertion only. |
| **Changes_When_NFKC_Casefolded** | True if NFKC_Casefold alters the character. | `DerivedNormalizationProps.txt` | ✗ | The single boolean that summarises "compatibility processing will damage this". If you want one column rather than four, this is it. Your ordinals and every candidate space are True. |
| **Expands_On_NFC / NFD / NFKC / NFKD** | Whether normalisation lengthens the string. | — | ✗ | Deprecated and removed. Ignore. |

## 5. Binary properties — identifiers and formal syntax

| Property | What it is | Source | Have | Thoughts |
|---|---|---|:---:|---|
| **ID_Start / ID_Continue** | Legal to start / continue a programming identifier. | `DerivedCoreProperties.txt` | ✗ | Inverse check. A marker that is identifier-legal will be swallowed by tokenisers that scan for words. Symbols are excluded by construction, so this is an assertion rather than a filter. |
| **XID_Start / XID_Continue** | The NFKC-closed variants. Standard for modern languages. | `DerivedCoreProperties.txt` | ✗ | As above. |
| **Other_ID_Start / Other_ID_Continue** | Small backward-compatibility additions. | `PropList.txt` | ✗ | Ignore. |
| **ID_Compat_Math_Start / ID_Compat_Math_Continue** | Added 15.1. Math characters explicitly permitted in identifiers — `∇`, `∂`, the math alphanumerics. | `PropList.txt` | ✗ | Narrow but pointed: these are the Sm characters most likely to be treated as *words* by tooling. If a candidate carries this, it's the one Sm that behaves like a letter. Worth excluding on principle. |
| **Pattern_Syntax** | UAX #31. Reserved for syntactic use in formal languages. Guaranteed stable, guaranteed never identifier-legal. | `PropList.txt` | ✗ | **The property that exists for what you're doing.** It's a fixed set, immutable by policy, comprising most of the ASCII punctuation plus large swathes of the symbol blocks. A candidate carrying Pattern_Syntax has a standing invitation from the standard to be used as a delimiter — which is about as close as Unicode comes to endorsing re-application. If you want a principled first filter on the 491, this is a better one than category. |
| **Pattern_White_Space** | UAX #31. The fixed whitespace set for formal syntax: `U+0009`–`U+000D`, `U+0020`, `U+0085`, `U+200E`, `U+200F`, `U+2028`, `U+2029`. | `PropList.txt` | ✗ | Directly relevant to your separator decision, and it's bad news for the candidates — `U+202F`, `U+2009` and `U+2007` are all *outside* this set. A formal-syntax-conformant parser is not obliged to treat any of them as whitespace. If MarkRight wants a separator that every conforming tool recognises, the set is small and boring. |

## 6. Binary properties — emoji

All from `emoji-data.txt`, which ships with UTS #51 rather than the core UCD.

| Property | What it is | Have | Thoughts |
|---|---|:---:|---|
| **Emoji** | The character has emoji semantics. | ✗ | The one to check first. A flagged codepoint can be pulled into an emoji font irrespective of your family choice, at that font's metrics — the adjacency problem in its most aggressive form, and unfixable by a separator. |
| **Emoji_Presentation** | Renders as emoji *by default*, without VS16. | ✗ | Strictly worse than Emoji alone. `Emoji=Yes, Emoji_Presentation=No` means you get text presentation by default and can force it with VS15; `Emoji_Presentation=Yes` means colour is the default and you're fighting the renderer. |
| **Emoji_Component** | Used only inside emoji sequences — skin tones, regional indicators, tag characters. | ✗ | Disqualifying if present. Never standalone. |
| **Emoji_Modifier** | The five skin-tone modifiers. | ✗ | Ignore. |
| **Emoji_Modifier_Base** | Accepts a skin-tone modifier. | ✗ | Ignore. |
| **Extended_Pictographic** | The broadest pictographic set. Used by the grapheme-cluster rules, so it affects segmentation as well as rendering. | ✗ | The widest net, and the one that catches surprises. Geometric Shapes overlaps it substantially — `U+25AA`, `U+25AB`, `U+25FB`–`U+25FE` and others. Since your candidate pool includes `U+25F8`–`U+25FF`, this needs checking before any of them survives. |

## 7. Binary properties — rendering and invisibility

| Property | What it is | Source | Have | Thoughts |
|---|---|---|:---:|---|
| **Default_Ignorable_Code_Point** | Should render as nothing if unsupported, rather than as tofu. | `DerivedCoreProperties.txt` | ✗ | Must be False. A default-ignorable marker vanishes silently in a font that lacks it — which converts a visible failure into an invisible corruption. Given your fallback exposure, this is the assertion I'd want loudest. |
| **Other_Default_Ignorable_Code_Point** | The derivation's exception list. | `PropList.txt` | ✗ | Internal to the derivation. Ignore. |
| **Variation_Selector** | The character is a VS. | `PropList.txt` | ✗ | Assertion. Relevant obliquely: if a marker has *defined* variation sequences (see `StandardizedVariants.txt` below), a stray VS can change its rendering. |
| **Join_Control** | ZWJ and ZWNJ. | `PropList.txt` | ✗ | Assertion. |
| **Bidi_Control** | The explicit bidi formatting controls. | `PropList.txt` | ✗ | Assertion. |
| **Prepended_Concatenation_Mark** | Arabic number signs that prefix a following sequence. | `PropList.txt` | ✗ | Assertion. |
| **Logical_Order_Exception** | Displayed out of logical order. A handful of Thai and Lao vowels. | `PropList.txt` | ✗ | Ignore. |
| **Noncharacter_Code_Point** | Permanently reserved, never assigned. | `PropList.txt` | ✗ | Assertion. |
| **Deprecated** | Discouraged; use is strongly advised against. | `PropList.txt` | ✗ | Cheap and worth having. Only a handful of characters, but committing a format to one would be an avoidable embarrassment. |

## 8. Binary properties — character class flags

| Property | What it is | Source | Have | Thoughts |
|---|---|---|:---:|---|
| **Math** | Used in mathematical notation. Broader than `gc=Sm` — includes some `So`, `Sk` and `Pd` characters. | `DerivedCoreProperties.txt` | ✗ | The honest answer to "is this a maths character", where General_Category is the accidental one. If your objection to Sm is semantic rather than mechanical, this is the property you actually mean. Note some `So` characters are `Math=Yes`, so avoiding Sm doesn't avoid Math. |
| **Other_Math** | The additions that make Math broader than Sm. | `PropList.txt` | ✗ | Only interesting as the diff. Reveals which non-Sm characters the standard nonetheless regards as mathematical. |
| **Bidi_Mirrored** | Mirrors under RTL. | `UnicodeData.txt` | ✓ | You have it, and you've used it well. Pair it with Bidi_Mirroring_Glyph for the full picture. |
| **White_Space** | Treated as whitespace by general text processing. | `PropList.txt` | ✗ | Directly relevant to the separator. Note it's *broader* than Pattern_White_Space — `U+202F` and `U+2009` are `White_Space=Yes` but not Pattern_White_Space. So general tooling treats them as space and formal-syntax tooling doesn't, which is the worst combination for predictability. |
| **Dash** | A dash character. | `PropList.txt` | ✗ | Assertion. Avoid — dashes attract line-break and hyphenation handling. |
| **Hyphen** | Deprecated subset of Dash. | `PropList.txt` | ✗ | Ignore. |
| **Quotation_Mark** | A quotation mark. | `PropList.txt` | ✗ | Assertion. Avoid; smart-quote substitution in editors is aggressive and would rewrite your markers. |
| **Terminal_Punctuation** | Terminates a sentence or clause. | `PropList.txt` | ✗ | Assertion. Affects sentence segmentation in text analysis. |
| **Sentence_Terminal** | The narrower subset that ends sentences. | `PropList.txt` | ✗ | Assertion. |
| **Diacritic** | Modifies another character. | `PropList.txt` | ✗ | Assertion. Disqualifying. |
| **Extender** | Extends the preceding character. | `PropList.txt` | ✗ | Assertion. Disqualifying — an extender binds to its neighbour. |
| **Soft_Dotted** | Loses its dot under a combining mark. | `PropList.txt` | ✗ | Ignore. |
| **Modifier_Combining_Mark** | Added 15.1. Arabic modifier marks with special ordering. | `PropList.txt` | ✗ | Ignore. |
| **Alphabetic / Other_Alphabetic** | Letters plus letter-like characters. | `DerivedCoreProperties.txt` | ✗ | Assertion. A marker classed Alphabetic will be treated as text by word-boundary and spellcheck machinery. Some Letterlike Symbols in your 491 are close to this line. |
| **Lowercase / Uppercase / Other_Lowercase / Other_Uppercase** | Case classification. | `DerivedCoreProperties.txt` | ✗ | Assertion. |
| **Cased / Case_Ignorable** | Participates in case operations. | `DerivedCoreProperties.txt` | ✗ | Assertion. `Case_Ignorable` is mildly interesting — such characters are *skipped* when determining context for case mapping, meaning they sit invisibly inside a word from the caser's point of view. |
| **Changes_When_Lowercased / Uppercased / Titlecased / Casefolded / Casemapped** | Whether the operation alters the character. | `DerivedCoreProperties.txt` | ✗ | Five booleans, all should be False. `Changes_When_Casemapped` is the union, so one column covers them. |
| **Hex_Digit / ASCII_Hex_Digit** | Usable as a hex digit, including fullwidth forms. | `PropList.txt` | ✗ | Ignore. |
| **Grapheme_Base** | Can stand alone as a cluster base. | `DerivedCoreProperties.txt` | ✗ | Should be True. A marker that isn't a grapheme base can't stand on its own. Assertion, but a meaningful one. |
| **Grapheme_Extend** | Extends the preceding cluster. | `DerivedCoreProperties.txt` | ✗ | Must be False. Disqualifying. |
| **Grapheme_Link** | Deprecated. | `DerivedCoreProperties.txt` | ✗ | Ignore. |
| **Ideographic** | A CJK ideograph. | `PropList.txt` | ✗ | Assertion. |
| **Unified_Ideograph** | In the URO or an extension. | `PropList.txt` | ✗ | Ignore. |
| **Radical** | A CJK radical character. | `PropList.txt` | ✗ | Ignore. |
| **IDS_Unary_Operator / IDS_Binary_Operator / IDS_Trinary_Operator** | Ideographic Description Sequence operators — `⿰`, `⿱` and the rest. | `PropList.txt` | ✗ | Worth one glance rather than dismissal. These are the closest existing analogue to what MarkRight is doing: visual composition operators with defined structural semantics, in a fixed block, all Common script. They are *taken*, so unusable — but the block is worth looking at for how the standard handles a structural notation. |
| **Regional_Indicator** | The 26 flag letters. | `PropList.txt` | ✗ | Ignore. |

---

## 9. Adjacent data sets, not UCD properties

| Data set | What it is | Source | Have | Thoughts |
|---|---|---|:---:|---|
| **UTR #25 math class** | Per-character math role: `N` normal, `A` alphabetic, `B` binary, `R` relation, `L` large, `O` opening, `C` closing, `P` punctuation, `D` diacritic, `F` fence, `G` glyph-part, `V` over, `U` under, `X` special. | `MathClass-15.txt` | ✗ | This, not General_Category, is what governs math spacing. Informative rather than normative, but it's what TeX and MathML implementations actually consult. If you keep Sm markers, prefer class `N` — those get no inter-atom spacing and behave as ordinary symbols even inside math. It's the property that would let you take Sm without taking its main mechanical cost. |
| **UTS #39 confusables** | The skeleton mapping — which characters are visually confusable with which. | `confusables.txt` | ✗ | Two uses. First, checking your marker set is internally distinguishable — a dark/light pair that shares a skeleton is a warning that readers won't reliably tell them apart. Second, checking a marker isn't confusable with something common in content, which would make MarkRight source ambiguous to a human. |
| **UTS #39 intentional confusables** | Pairs confusable *by design*, across scripts. | `intentional.txt` | ✗ | Narrower. Mostly cross-script letter lookalikes. Low relevance. |
| **Standardized_Variants** | Defined variation sequences for a codepoint. | `StandardizedVariants.txt` | ✗ | Tells you whether VS15/VS16 or a shape variant is *defined* for a character. Relevant if you ever want to pin text-versus-emoji presentation explicitly — you can only do that where a sequence is defined. |
| **Emoji sequences** | ZWJ sequences, keycaps, flags. | `emoji-sequences.txt`, `emoji-zwj-sequences.txt` | ✗ | Only matters if a marker could be the first element of a defined sequence and thereby get absorbed. Unlikely; cheap to rule out. |
| **Unihan** | Several hundred CJK-only fields — readings, variants, dictionary indices. | `Unihan.zip` | ✗ | Ignore. |

---

## 10. Acquisition

- One fetch of `UCD.zip` from the Unicode site covers sections 1–8 entirely.
- `MathClass-15.txt` (UTR #25) is a separate download.
- `confusables.txt` and `intentional.txt` (UTS #39) are a separate download.
- `emoji-data.txt` ships inside `UCD.zip` under `emoji/` in recent versions, but has historically been separate — check rather than assume.
- Already available without any fetch: General_Category, Bidi_Class, East_Asian_Width, Decomposition_Mapping, the case mappings and normalisation round-trips (stdlib `unicodedata`); Script, Script_Extensions, Block (`fontTools.unicodedata`); Line_Break, Grapheme_Cluster_Break, Word_Break, Sentence_Break (`uniseg`).
