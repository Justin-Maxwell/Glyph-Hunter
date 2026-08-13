// Which face actually supplied this glyph?
//
// No browser can tell you (docs/findings.md, "Font identity"). So this guesses, and the
// contract is that it says so: ROADMAP.md set 13 makes the acknowledgement part of the
// instruction, not a caveat to bury.
//
// Structured as evidence sources because of the browser-agnostic constraint. Each source
// reports whether it is available here, what it found, and how it knows. The
// browser-independent sources are the path; queryLocalFonts() is an enhancement over them.
// Nothing is built on the assumption that the good API exists.

(function (root) {
  "use strict";

  var GH = root.GH || (root.GH = {});
  var core = GH.core;
  var fontguess = GH.fontguess = {};

  var ABSENT = '"__gh_no_such_family_9f3a__"';
  var TOLERANCE = 0.75;   // per 1000 em; hinting and rounding move advances by less

  // ------------------------------------------------------- source: metric signature
  //
  // Available everywhere, no permission, no API. Answers a narrower question than "which
  // face" — it answers "did the requested family supply this, or did fallback?" — but it
  // answers it on every browser, which is why it is the path rather than the enhancement.

  var sigCanvas = null;
  function sigCtx() {
    if (!sigCanvas) sigCanvas = document.createElement("canvas");
    return sigCanvas.getContext("2d");
  }

  function signature(fontSpec, sizePx, ch) {
    var ctx = sigCtx();
    ctx.font = sizePx + "px " + fontSpec;
    var t = ctx.measureText(ch);
    return [t.width, t.actualBoundingBoxAscent, t.actualBoundingBoxDescent,
            t.actualBoundingBoxLeft, t.actualBoundingBoxRight]
      .map(function (n) { return Math.round(n * 100) / 100; }).join("|");
  }

  fontguess.metricSignature = function (family, sizePx, ch) {
    var tail = core.familyTail(family);
    var baseline = ABSENT + (tail ? ", " + core.cssFamily(tail) : "");
    var same = signature(core.cssFamily(family), sizePx, ch) === signature(baseline, sizePx, ch);
    return {
      source: "metric-signature",
      available: true,
      supplied_by_head_family: !same,
      // The ambiguity is real and unresolvable: when the requested family *is* what the
      // fallback resolves to, the two are the same face and no measurement separates them.
      certain: !same,
      why: same
        ? "metrics are indistinguishable from this stack's fallback — either the family " +
          "lacks the glyph, or the family is itself the fallback"
        : "metrics differ from this stack's fallback, so the named family supplied it",
    };
  };

  // ------------------------------------------------------- source: local fonts
  //
  // Chrome desktop only, and only after a user gesture plus a permission grant. Returns
  // the actual font files, so the cmap and hmtx can be read and the answer stops being a
  // guess for any face whose advance is unique.

  var localIndex = null;      // [{ family, postscriptName, face }]
  var localState = { tried: false, granted: false, error: null, count: 0 };

  fontguess.localFontsState = function () {
    return {
      api_present: typeof root.queryLocalFonts === "function",
      tried: localState.tried,
      granted: localState.granted,
      error: localState.error,
      faces_indexed: localState.count,
    };
  };

  // Must be called from a user gesture. Without one it throws
  // `SecurityError: User activation is required`.
  fontguess.enableLocalFonts = async function (onProgress) {
    localState.tried = true;
    if (typeof root.queryLocalFonts !== "function") {
      localState.error = "queryLocalFonts is not available in this browser";
      return fontguess.localFontsState();
    }
    var fonts;
    try {
      fonts = await root.queryLocalFonts();
    } catch (e) {
      localState.error = e.name + ": " + e.message;
      return fontguess.localFontsState();
    }
    localState.granted = true;
    localIndex = [];
    for (var i = 0; i < fonts.length; i++) {
      if (onProgress && i % 25 === 0) onProgress(i, fonts.length);
      try {
        var buf = await (await fonts[i].blob()).arrayBuffer();
        localIndex.push({
          family: fonts[i].family,
          postscriptName: fonts[i].postscriptName,
          style: fonts[i].style,
          face: GH.sfnt.parse(buf),
        });
      } catch (e) {
        // Collections and CFF oddities are skipped rather than aborting the index.
      }
    }
    localState.count = localIndex.length;
    return fontguess.localFontsState();
  };

  // Faces that carry this codepoint at this advance. When exactly one matches, the guess
  // has become a reading.
  fontguess.localFontCandidates = function (cp, advance) {
    if (!localIndex) {
      return {
        source: "local-fonts",
        available: false,
        why: localState.error ||
          (typeof root.queryLocalFonts === "function"
            ? "not yet granted — needs a click and a permission prompt"
            : "queryLocalFonts is not available in this browser"),
        candidates: [],
      };
    }
    var carrying = [], matching = [];
    localIndex.forEach(function (f) {
      var a;
      try { a = f.face.advance(cp); } catch (e) { return; }
      if (a == null) return;
      carrying.push({ family: f.family, postscriptName: f.postscriptName, advance: a });
      if (Math.abs(a - advance) <= TOLERANCE) {
        matching.push({ family: f.family, postscriptName: f.postscriptName, advance: a });
      }
    });
    return {
      source: "local-fonts",
      available: true,
      candidates: matching,
      carrying_count: carrying.length,
      why: matching.length === 0
        ? "no installed face carries U+" + core.hex(cp) + " at " + advance + "/1000em"
        : matching.length === 1
          ? "exactly one installed face matches both the codepoint and the advance"
          : matching.length + " installed faces share this advance, so the advance alone " +
            "cannot separate them",
      certain: matching.length === 1,
    };
  };

  // ------------------------------------------------------- source: sysfont fingerprint
  //
  // Browser-independent, and the one that will carry the guesser on platforms without the
  // Local Font Access API. It needs a committed advance table produced by sysfont.py,
  // which does not exist yet, so the source reports itself unavailable rather than
  // pretending.

  var fingerprints = null;
  fontguess.loadFingerprints = function (data) { fingerprints = data; };

  fontguess.fingerprintCandidates = function (cp, advance) {
    if (!fingerprints) {
      return {
        source: "sysfont-fingerprint",
        available: false,
        why: "no committed advance table yet — sysfont.py does not emit one",
        candidates: [],
      };
    }
    var hex = core.hex(cp);
    var matches = [];
    Object.keys(fingerprints).forEach(function (family) {
      var a = fingerprints[family][hex];
      if (a != null && Math.abs(a - advance) <= TOLERANCE) {
        matches.push({ family: family, advance: a });
      }
    });
    return {
      source: "sysfont-fingerprint",
      available: true,
      candidates: matches,
      certain: matches.length === 1,
      why: matches.length + " recorded face(s) match this advance",
    };
  };

  // ------------------------------------------------------- combine

  // Always returns `is_guess`. Even a single local-fonts match is an inference: it says
  // which face *could* have drawn the glyph at that advance, not which one the engine
  // chose. Only the DevTools protocol knows that, and a page cannot call it.
  fontguess.identify = function (opts) {
    var evidence = [
      fontguess.metricSignature(opts.family, opts.sizePx, core.charOf(opts.cp)),
      fontguess.localFontCandidates(opts.cp, opts.advance),
      fontguess.fingerprintCandidates(opts.cp, opts.advance),
    ];

    var names = new Map();
    evidence.forEach(function (e) {
      (e.candidates || []).forEach(function (c) {
        var entry = names.get(c.family) || { family: c.family, sources: [], advance: c.advance };
        if (entry.sources.indexOf(e.source) === -1) entry.sources.push(e.source);
        names.set(c.family, entry);
      });
    });

    var candidates = Array.from(names.values()).sort(function (a, b) {
      return b.sources.length - a.sources.length;
    });

    var sig = evidence[0];
    var narrowed = candidates.length === 1;

    return {
      cp: opts.cp,
      is_guess: true,
      candidates: candidates,
      // What can be said without qualification, separated from what cannot.
      settled: {
        supplied_by_named_family: sig.certain ? true : null,
      },
      summary: narrowed
        ? "probably " + candidates[0].family
        : candidates.length > 1
          ? candidates.length + " faces are consistent with this advance"
          : sig.certain
            ? "the named family supplied it; which file, unknown"
            : "unknown — no evidence source could narrow it",
      evidence: evidence,
      // Shown verbatim in the UI. The acknowledgement is part of the instruction.
      caveat: "No browser reports which face rendered a character. This is inference from " +
              "advance widths and metric comparison, not a reading.",
    };
  };

  if (typeof module === "object" && module.exports) module.exports = GH;
})(typeof globalThis !== "undefined" ? globalThis : this);
