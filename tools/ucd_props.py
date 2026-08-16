#!/usr/bin/env python3
"""
ucd_props — the UCD property values a glyph carries, read from the vendored data files.

Kept apart from gen_browse.py deliberately. The browse page is where these are being tried
out, but they are glyph-level facts and not browse-level ones, so when they migrate into
the bench it should be by importing this, not by copying it.

Everything here is read from `data/ucd-16.0.0/`, at the same UCD version as this Python's
`unicodedata` and as fontTools' script data. That matching is the point: mixing a 16.0.0
inventory with an 18.0.0 property file would put values on glyphs that did not have them.
The one deliberate exception is `PropertyValueAliases-18.0.0.txt`, which supplies the long
names only - value aliases are added and never removed, so a later file resolves an earlier
file's values and resolves strictly more of them.

Script grouping does not invent an "ancient / rare / common" scheme. UAX #31, via CLDR's
`scriptMetadata.txt`, already classifies every script by identifier usage, and that is the
published answer to the same question.
"""

import bisect
import os
import re
import unicodedata as u

try:
    from fontTools.unicodedata import (script as ucd_script,
                                       script_extension as ucd_scx,
                                       script_name as _script_name)
except ImportError:  # pragma: no cover - gen_browse.py already fails loudly on this
    raise SystemExit("fontTools is missing.  pip install fonttools")


def ucd_script_name(code):
    """The ISO 15924 English name for a script code, e.g. "Zyyy" -> "Common"."""
    try:
        return _script_name(code)
    except KeyError:
        return code

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(HERE), "data")
UCD = os.path.join(DATA, "ucd-16.0.0")
CLDR = os.path.join(DATA, "cldr")
UTS39 = os.path.join(DATA, "uts39-16.0.0")
UCD_VERSION = "16.0.0"


# ---------------------------------------------------------------- UCD file reading

def loose(s):
    """UAX #44 loose matching: ignore case, whitespace, underscore and hyphen."""
    return re.sub(r"[\s_-]+", "", s).lower()


def _lines(path):
    """Data lines of a UCD file, comments and blanks removed, split on semicolons."""
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.split("#", 1)[0].strip()
            if line:
                yield [p.strip() for p in line.split(";")]


def _span(field):
    """"1F0A1..1F0DE" or "2460" -> (first, last)."""
    parts = field.split("..")
    return int(parts[0], 16), int(parts[-1], 16)


class RangeMap:
    """Codepoint -> value over sorted, non-overlapping ranges.

    A dict of every codepoint would be tens of millions of entries for files that assign
    whole planes at a time; the ranges as published are already the compact form, so they
    are kept as published and searched.
    """

    def __init__(self, default=None):
        self.starts = []
        self.ends = []
        self.vals = []
        self.default = default
        self._sorted = False

    def add(self, lo, hi, val):
        self.starts.append(lo)
        self.ends.append(hi)
        self.vals.append(val)
        self._sorted = False

    def _sort(self):
        order = sorted(range(len(self.starts)), key=lambda i: self.starts[i])
        self.starts = [self.starts[i] for i in order]
        self.ends = [self.ends[i] for i in order]
        self.vals = [self.vals[i] for i in order]
        self._sorted = True

    def get(self, cp):
        if not self._sorted:
            self._sort()
        i = bisect.bisect_right(self.starts, cp) - 1
        if i >= 0 and cp <= self.ends[i]:
            return self.vals[i]
        return self.default

    def __contains__(self, cp):
        return self.get(cp) is not None


def read_enumerated(path, default=None):
    """A file whose second field is the value: DerivedAge, LineBreak, the break files."""
    m = RangeMap(default)
    for p in _lines(path):
        if len(p) >= 2:
            lo, hi = _span(p[0])
            m.add(lo, hi, p[1])
    return m


def read_by_property(path):
    """A file whose second field is a property name: PropList, DerivedCoreProperties.

    Returns {property: RangeMap}. A third field, where present, is the value - that is how
    DerivedNormalizationProps carries the quick checks, whose value is N or M rather than
    a bare "this property applies".
    """
    out = {}
    for p in _lines(path):
        if len(p) < 2:
            continue
        lo, hi = _span(p[0])
        val = p[2] if len(p) > 2 else "Y"
        out.setdefault(p[1], RangeMap()).add(lo, hi, val)
    return out


def read_aliases(path):
    """{property abbreviation: {loose alias: long alias}} from PropertyValueAliases.txt.

    Every alias on the line is indexed, not just the short one, because the UCD files
    disagree about which form they use: GraphemeBreakProperty.txt writes the long name
    `Regional_Indicator` where PropertyValueAliases.txt files it under short `RI`. Indexing
    both means a lookup succeeds whichever form the data file happened to use.
    """
    out = {}
    for p in _lines(path):
        if len(p) < 3:
            continue
        # ccc is the one property whose lines carry the numeric value first, so its long
        # name is a field further along: "ccc; 0; NR; Not_Reordered".
        prop = p[0]
        long_name = p[3] if prop == "ccc" and len(p) > 3 else p[2]
        table = out.setdefault(prop, {})
        for alias in p[1:]:
            table.setdefault(loose(alias), long_name)
    return out


def read_property_names(path):
    """{abbreviation: long name} from PropertyAliases.txt, for the filter labels."""
    out = {}
    for p in _lines(path):
        if len(p) >= 2:
            out[p[0]] = p[1]
    return out


def decomposition_type(ch):
    """The tag on a decomposition, which is the part that says why it is unstable.

    `unicodedata.decomposition` returns "" for none, "<super> 0031" for a compatibility
    decomposition, or a bare codepoint sequence for a canonical one. The tag is the useful
    half: <super> is what makes an ordinal fold away under NFKC, <circle> and <square> what
    would fold an enclosed shape.
    """
    d = u.decomposition(ch)
    if not d:
        return "None"
    if d.startswith("<"):
        return d[1:d.index(">")]
    return "Canonical"


def read_script_meta(path):
    """{script code: {...}} from CLDR scriptMetadata.txt.

    Field 5 is the UAX #31 identifier usage - RECOMMENDED, LIMITED_USE, EXCLUSION,
    UNKNOWN - which is the published version of "common / rare / ancient". Field 8 says
    whether the script requires shaping, which bears directly on whether a glyph from it
    renders the same everywhere.
    """
    out = {}
    for p in _lines(path):
        if len(p) > 8:
            out[p[0]] = {"rank": p[1], "usage": p[5], "rtl": p[6] == "YES",
                         "shaping": p[8]}
    return out


# ---------------------------------------------------------------- the property inventory

# Enumerated properties, in the order the page offers them.
#   key      field name on a cell, and the filter's identity
#   prop     the abbreviation PropertyValueAliases.txt files the values under
#   section  which block of the filter panel it belongs to
#   default  the value carried by everything the source file does not mention; cells
#            holding the default do not store the field at all
ENUMS = [
    ("age",     "age", "vintage",        None),
    ("sc",      "sc",  "script",         None),
    ("gc",      "gc",  "classification", None),
    ("eaw",     "ea",  "rendering",      None),
    ("bidi",    "bc",  "rendering",      None),
    ("lb",      "lb",  "rendering",      "XX"),
    ("bpt",     "bpt", "rendering",      "n"),
    ("vo",      "vo",  "rendering",      "R"),
    ("dt",      "dt",  "normalisation",  "None"),
    ("ccc",     "ccc", "classification", "0"),
    ("nt",      "nt",  "classification", "None"),
    ("idst",    None,  "identifier",     "Restricted"),
    ("idt",     None,  "identifier",     "Not_Character"),
    ("gcb",     "GCB", "segmentation",   "Other"),
    ("wb",      "WB",  "segmentation",   "Other"),
    ("sb",      "SB",  "segmentation",   "Other"),
    ("nfc_qc",  "NFC_QC",  "normalisation", "Y"),
    ("nfd_qc",  "NFD_QC",  "normalisation", "Y"),
    ("nfkc_qc", "NFKC_QC", "normalisation", "Y"),
    ("nfkd_qc", "NFKD_QC", "normalisation", "Y"),
]

# Properties whose value is a set rather than one choice. Matched as "contains".
SET_VALUED = {"idt"}

# Names for the two properties that are UTS #39's rather than the UCD's, and so are not in
# PropertyAliases.txt.
LOCAL_NAMES = {"idst": "Identifier_Status", "idt": "Identifier_Type"}

# Which file each enumerated property comes from, and its default there.
ENUM_SOURCES = {
    "age": ("DerivedAge.txt", None),
    "lb": ("LineBreak.txt", "XX"),
    "gcb": ("auxiliary/GraphemeBreakProperty.txt", "Other"),
    "wb": ("auxiliary/WordBreakProperty.txt", "Other"),
    "sb": ("auxiliary/SentenceBreakProperty.txt", "Other"),
    "nt": ("extracted/DerivedNumericType.txt", "None"),
    "vo": ("VerticalOrientation.txt", "R"),
}

# Binary properties are read wholesale from these files rather than listed one by one:
# "basically all of them" was the instruction, and a hand-kept list would silently go stale
# the next time the UCD adds one.
BINARY_FILES = ["PropList.txt", "DerivedCoreProperties.txt", "emoji/emoji-data.txt"]

# From DerivedNormalizationProps.txt only these are binary; the rest of that file is
# quick-check values (handled above) or string mappings (excluded - see EXCLUDED).
BINARY_FROM_NORM = [
    "Changes_When_NFKC_Casefolded", "Full_Composition_Exclusion",
    "Expands_On_NFC", "Expands_On_NFD", "Expands_On_NFKC", "Expands_On_NFKD",
]

# Properties deliberately not offered, and why. Surfaced on the page so each absence reads
# as a decision. Justin's rule: no script text writing properties, and no string-valued ones.
#
# Set 17 sharpened what counts as a reason. A property is excluded because of what it *is*,
# never because it happens to be unused on the current selection - the inventory is a
# working choice and the only durable exclusion is script text writing. So a property that
# is inert here is still offered, disabled, with the count as the explanation.
# Vertical_Orientation was wrongly listed here on the second kind of reasoning and has been
# moved into the filters.
#
# The discriminator, per set 18: exclude where the **property** is one script's text-writing
# machinery, not where some of its **values** happen to name scripts. Line_Break has Hangul
# and South East Asian values, Word_Break has Katakana, Bidi_Class has Arabic ones - all
# stay, because each makes a claim about any character. Joining_Type = Non_Joining makes no
# claim about the character at all; it says the character takes no part in Arabic and Syriac
# cursive joining, which is a fact about those scripts.
EXCLUDED = [
    ("Script text writing", ["Indic_Syllabic_Category", "Indic_Positional_Category",
                             "Indic_Conjunct_Break", "Joining_Type", "Joining_Group",
                             "Hangul_Syllable_Type", "Jamo_Short_Name",
                             "Equivalent_Unified_Ideograph"],
     "Four clusters of one kind: Indic syllable structure, Arabic and Syriac cursive "
     "joining, Hangul composition, and the CJK radical-to-ideograph mapping. Each is "
     "machinery for writing running text in a script, so its values describe a role inside "
     "that script rather than anything about the character - which is the one exclusion "
     "this project holds to. Every one of them has a value for every codepoint, so being "
     "total says nothing; what matters is what the value is a statement about."),
    ("String-valued", ["Name", "Unicode_1_Name", "Decomposition_Mapping",
                       "Simple_Uppercase_Mapping", "Simple_Lowercase_Mapping",
                       "Simple_Titlecase_Mapping", "Simple_Case_Folding",
                       "NFKC_Casefold", "NFKC_Simple_Casefold", "FC_NFKC_Closure",
                       "Bidi_Paired_Bracket", "ISO_Comment"],
     "The value is another string or codepoint rather than a class, so there is no finite "
     "set to choose from. Bidi_Mirroring_Glyph is the exception: it is excluded as a "
     "filter but shown in the info box, and Bidi_Mirrored is offered instead."),
]

# Where each binary property sits in the panel. Anything unlisted falls to "other".
BINARY_SECTIONS = {
    "rendering": ["Emoji", "Emoji_Presentation", "Extended_Pictographic",
                  "Emoji_Modifier", "Emoji_Modifier_Base", "Emoji_Component",
                  "Regional_Indicator", "Bidi_Mirrored", "Bidi_Control",
                  "Default_Ignorable_Code_Point", "Variation_Selector", "Join_Control",
                  "Prepended_Concatenation_Mark"],
    "classification": ["Math", "Other_Math", "Pattern_Syntax", "Pattern_White_Space",
                       "Dash", "Hyphen", "Quotation_Mark", "Terminal_Punctuation",
                       "Sentence_Terminal", "Diacritic", "Extender", "Ideographic",
                       "Radical", "Unified_Ideograph", "IDS_Binary_Operator",
                       "IDS_Trinary_Operator", "IDS_Unary_Operator", "White_Space",
                       "Logical_Order_Exception", "Deprecated", "Noncharacter_Code_Point"],
    "normalisation": BINARY_FROM_NORM,
    "identifier": ["ID_Start", "ID_Continue", "XID_Start", "XID_Continue",
                   "Other_ID_Start", "Other_ID_Continue", "ID_Compat_Math_Start",
                   "ID_Compat_Math_Continue", "Alphabetic", "Other_Alphabetic",
                   "Cased", "Case_Ignorable", "Uppercase", "Lowercase",
                   "Other_Uppercase", "Other_Lowercase", "Soft_Dotted",
                   "Changes_When_Lowercased", "Changes_When_Uppercased",
                   "Changes_When_Titlecased", "Changes_When_Casefolded",
                   "Changes_When_Casemapped", "Grapheme_Base", "Grapheme_Extend",
                   "Grapheme_Link", "Other_Grapheme_Extend", "Other_Default_Ignorable_Code_Point"],
}

SECTIONS = [
    ("vintage", "Vintage",
     "How long a codepoint has existed. The strongest single predictor of whether a font "
     "will have it at all."),
    ("script", "Script",
     "Which writing system a glyph belongs to, and how widely that system is used."),
    ("rendering", "Rendering and presentation",
     "Properties that bear on what a renderer actually draws - width, direction, whether "
     "an emoji font will claim it."),
    ("classification", "Classification",
     "What kind of character it is, in the Unicode Character Database's own terms."),
    ("segmentation", "Segmentation",
     "How text-boundary algorithms treat it. Rarely visible in a specimen, but it is what "
     "decides where a cursor stops."),
    ("normalisation", "Normalisation",
     "Whether the codepoint survives normalisation unchanged. An NFKC-unstable glyph may "
     "not come back the same from a round trip through other software."),
    ("identifier", "Identifier and case",
     "Whether the codepoint may appear in a programming identifier, and how it cases."),
    ("other", "Other binary properties",
     "Everything else the UCD marks as a yes/no property of a codepoint."),
]


class Properties:
    """Every offered property, resolved for any codepoint."""

    def __init__(self, ucd=UCD, cldr=CLDR, aliases_path=None):
        self.enums = {}
        for key, (fname, default) in ENUM_SOURCES.items():
            self.enums[key] = read_enumerated(os.path.join(ucd, fname), default)

        self.brackets = RangeMap("n")
        for p in _lines(os.path.join(ucd, "BidiBrackets.txt")):
            if len(p) >= 3:
                lo, hi = _span(p[0])
                self.brackets.add(lo, hi, p[2])

        # The mirroring glyph itself is not a filter - it is a codepoint, not a class -
        # but it belongs in the info box, so it is carried.
        self.mirror = {}
        for p in _lines(os.path.join(ucd, "BidiMirroring.txt")):
            if len(p) >= 2:
                self.mirror[int(p[0], 16)] = p[1]

        norm = read_by_property(os.path.join(ucd, "DerivedNormalizationProps.txt"))
        self.qc = {k: norm.get(k, RangeMap()) for k in
                   ("NFC_QC", "NFD_QC", "NFKC_QC", "NFKD_QC")}

        self.binaries = {}
        for fname in BINARY_FILES:
            for prop, rmap in read_by_property(os.path.join(ucd, fname)).items():
                self.binaries.setdefault(prop, rmap)
        for prop in BINARY_FROM_NORM:
            if prop in norm:
                self.binaries.setdefault(prop, norm[prop])
        # Indic_Conjunct_Break rides in DerivedCoreProperties but is enumerated and
        # script-specific, so it is not a binary and not offered.
        self.binaries.pop("InCB", None)

        # UTS #39, not the UCD. Vendored separately and versioned separately, which is why
        # it sits in its own directory. Identifier_Type is set-valued: a codepoint may be
        # restricted for more than one reason at once.
        self.id_status = read_enumerated(os.path.join(UTS39, "IdentifierStatus.txt"),
                                         "Restricted")
        self.id_type = read_enumerated(os.path.join(UTS39, "IdentifierType.txt"),
                                       "Not_Character")

        self.aliases = read_aliases(
            aliases_path or os.path.join(DATA, "PropertyValueAliases-18.0.0.txt"))
        self.prop_names = read_property_names(os.path.join(ucd, "PropertyAliases.txt"))
        self.script_meta = read_script_meta(os.path.join(cldr, "scriptMetadata.txt"))

        # Bidi_Mirrored is a UnicodeData field rather than a PropList one, so it is not in
        # self.binaries yet. It is the filter that stands in for Bidi_Mirroring_Glyph.
        self.binary_names = sorted(self.binaries) + ["Bidi_Mirrored"]

    # -- per codepoint

    def enum_values(self, cp):
        """{key: value} for the enumerated properties, defaults included."""
        ch = chr(cp)
        out = {
            "age": self.enums["age"].get(cp) or "unassigned",
            "sc": ucd_script(ch),
            "gc": u.category(ch),
            "eaw": u.east_asian_width(ch),
            "bidi": u.bidirectional(ch),
            "lb": self.enums["lb"].get(cp),
            "bpt": self.brackets.get(cp),
            "nt": self.enums["nt"].get(cp),
            "gcb": self.enums["gcb"].get(cp),
            "wb": self.enums["wb"].get(cp),
            "sb": self.enums["sb"].get(cp),
            "vo": self.enums["vo"].get(cp),
            "ccc": str(u.combining(ch)),
            "dt": decomposition_type(ch),
            "idst": self.id_status.get(cp),
            # Set-valued: "Technical Limited_Use" is two reasons, not one value.
            "idt": sorted((self.id_type.get(cp) or "Not_Character").split()),
        }
        for prop, key in (("NFC_QC", "nfc_qc"), ("NFD_QC", "nfd_qc"),
                          ("NFKC_QC", "nfkc_qc"), ("NFKD_QC", "nfkd_qc")):
            out[key] = self.qc[prop].get(cp) or "Y"
        return out

    def binary_values(self, cp):
        """The set of binary property names that hold for this codepoint."""
        out = {name for name, rmap in self.binaries.items() if rmap.get(cp) is not None}
        if u.mirrored(chr(cp)):
            out.add("Bidi_Mirrored")
        return out

    def scx(self, cp):
        """Script_Extensions as a list of script codes."""
        return sorted(ucd_scx(chr(cp)))

    def mirroring_glyph(self, cp):
        return self.mirror.get(cp)

    # -- labels

    def long_value(self, prop, value):
        """The official long alias for a value, or None if the file does not have it."""
        return self.aliases.get(prop, {}).get(loose(value))

    def long_property(self, prop):
        return self.prop_names.get(prop, prop)

    def script_usage(self, code):
        """UAX #31 identifier usage for a script code, as CLDR classifies it."""
        return self.script_meta.get(code, {}).get("usage", "UNKNOWN")
