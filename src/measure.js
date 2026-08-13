// Measurement. Two engines, because they answer different questions and disagree.
//
// docs/findings.md 0.1 settles which is which:
//   - DOM layout with a Range per character is *definitive*. It is what the page draws,
//     and Chrome's own DevTools protocol agrees with it.
//   - Canvas TextMetrics is the only source of actualBoundingBox*, so the guides come from
//     it — but it resolves font fallback by a separate path and can report a width the
//     page never draws. Where the two disagree, that is a fact worth surfacing, not an
//     inconsistency to average away.
//
// The output is one record shape per measured glyph, used by every front end. That is the
// standing TUI constraint: a terminal view consumes these records, not the DOM.

(function (root) {
  "use strict";

  var GH = root.GH || (root.GH = {});
  var core = GH.core;
  var measure = GH.measure = {};

  var NOTDEF = "\u{10FFFD}";

  // A hidden stage for DOM measurement. `white-space: pre` so runs are not collapsed;
  // absolutely positioned so nothing reflows the visible page.
  function stage() {
    var el = document.getElementById("gh-measure-stage");
    if (!el) {
      el = document.createElement("div");
      el.id = "gh-measure-stage";
      el.setAttribute("aria-hidden", "true");
      el.style.cssText = "position:absolute;top:0;left:-99999px;white-space:pre;" +
        "visibility:hidden;contain:layout style;";
      document.body.appendChild(el);
    }
    return el;
  }

  var canvas = null;
  function ctx2d() {
    if (!canvas) canvas = document.createElement("canvas");
    return canvas.getContext("2d");
  }

  // Advance of every character of `text`, via a Range per code point. One layout pass for
  // the whole batch, because the rects are read after all the spans are in place.
  function domAdvances(spans, sizePx) {
    return spans.map(function (span) {
      var node = span.firstChild;
      if (!node) return [];
      var text = node.nodeValue;
      var out = [];
      var i = 0;
      for (var chars = Array.from(text), k = 0; k < chars.length; k++) {
        var r = document.createRange();
        r.setStart(node, i);
        r.setEnd(node, i + chars[k].length);
        out.push(r.getBoundingClientRect().width / sizePx * 1000);
        i += chars[k].length;
      }
      return out;
    });
  }

  function buildSpans(host, texts, cssFamily, sizePx) {
    host.style.font = sizePx + "px " + cssFamily;
    var frag = document.createDocumentFragment();
    var spans = texts.map(function (t) {
      var s = document.createElement("span");
      s.textContent = t;
      frag.appendChild(s);
      frag.appendChild(document.createElement("br"));
      return s;
    });
    host.replaceChildren(frag);
    return spans;
  }

  // ---------------------------------------------------------------- run envelope

  // Provenance from the outset. ROADMAP.md set 6: retrofitting this onto records that lack
  // it is the rework the constraint exists to avoid. Nothing consumes it yet, and it is
  // emitted anyway.
  measure.envelope = function (opts, records) {
    return {
      font_requested: opts.family,
      font_resolved_hint: measure.resolvedHint(opts.family, opts.sizePx),
      platform: (navigator.userAgentData && navigator.userAgentData.platform) ||
        navigator.platform || "unknown",
      user_agent: navigator.userAgent,
      size_px: opts.sizePx,
      timestamp_iso: new Date().toISOString(),
      glyph_count: records.length,
      hue_domain: opts.hueDomain,
      anchor: opts.anchor,
      engine_divergences: records.filter(function (r) { return r.diverges; }).length,
    };
  };

  // No browser exposes the resolved family to script, so this is best effort: a handful of
  // advances that a later reader can fingerprint against sysfont.py output. Noto Sans Math
  // gives 836 for the U+29Bx run where an Android device gives 796, so the numbers
  // themselves are often the discriminator.
  measure.resolvedHint = function (family, sizePx) {
    var ctx = ctx2d();
    ctx.font = sizePx + "px " + core.cssFamily(family);
    var probes = { "x": "x", "H": "H", "0": "0", "M": "M", "notdef": NOTDEF };
    var out = {};
    Object.keys(probes).forEach(function (k) {
      out[k] = Math.round(ctx.measureText(probes[k]).width / sizePx * 1000 * 100) / 100;
    });
    return out;
  };

  // ---------------------------------------------------------------- the measurement

  // opts: { family, sizePx, anchor, codepoints, hueDomain }
  measure.run = function (opts) {
    var sizePx = opts.sizePx || 200;
    var fam = core.cssFamily(opts.family);
    var anchor = opts.anchor || "";
    var cps = opts.codepoints || [];
    var host = stage();
    var ctx = ctx2d();
    ctx.font = sizePx + "px " + fam;

    var chars = cps.map(core.charOf);

    // Pass one: each glyph alone, one span each, so no glyph can re-itemise its neighbour.
    var aloneSpans = buildSpans(host, chars, fam, sizePx);
    var alone = domAdvances(aloneSpans, sizePx);

    // Pass two: each glyph preceded by the anchor, in one text node so the run really is
    // a run. Skipped entirely when there is no anchor.
    var inRun = null;
    if (anchor) {
      var runSpans = buildSpans(host, chars.map(function (c) { return anchor + c; }), fam, sizePx);
      inRun = domAdvances(runSpans, sizePx);
    }

    var anchorAlone = 0;
    if (anchor) {
      var aSpan = buildSpans(host, [anchor], fam, sizePx)[0];
      anchorAlone = domAdvances([aSpan], sizePx)[0].reduce(function (a, b) { return a + b; }, 0);
    }
    host.replaceChildren();

    var notdefAdvance = ctx.measureText(NOTDEF).width / sizePx * 1000;

    var records = cps.map(function (cp, i) {
      var ch = chars[i];
      var rawAdvance = (alone[i] || [0])[0] || 0;
      // Advances are grouped on the integer per-1000-em value. Sub-pixel layout noise
      // makes 604.02 and 604.06 look like distinct widths, which shatters the width
      // groups the whole tool exists to find — 662 groups where there were 40. One unit
      // per 1000 em is 0.2px at the default size, well below anything meaningful, and
      // every figure in the project's history is an integer.
      var domAdvance = Math.round(rawAdvance);
      var t = ctx.measureText(ch);
      var canvasAdvance = Math.round(t.width / sizePx * 1000);

      // The anchor sits first in the run, so the glyph's own rect is the last one. Kerning
      // is attributed to the left-hand character, which is exactly why this separates
      // re-itemisation from kerning where the canvas subtraction cannot.
      var runChars = inRun ? inRun[i] : null;
      var advanceInRun = runChars && runChars.length
        ? Math.round(runChars[runChars.length - 1]) : null;

      return {
        cp: cp,
        hex: core.hex(cp),
        char: ch,
        advance: domAdvance,                        // definitive, and what groups are cut on
        advanceRaw: round2(rawAdvance),             // kept for the envelope and the info box
        advanceInRun: advanceInRun,
        shift: advanceInRun == null ? null : advanceInRun - domAdvance,
        canvasAdvance: canvasAdvance,
        // Engines disagreeing means the guides below describe a glyph that is not the one
        // on screen. Surfaced rather than smoothed over.
        diverges: Math.abs(canvasAdvance - domAdvance) > 1,
        ink: {
          ascent: round2(t.actualBoundingBoxAscent / sizePx * 1000),
          descent: round2(t.actualBoundingBoxDescent / sizePx * 1000),
          left: round2(t.actualBoundingBoxLeft / sizePx * 1000),
          right: round2(t.actualBoundingBoxRight / sizePx * 1000),
        },
        // A guess, and labelled one. DEBT.md records that a glyph legitimately sharing
        // the notdef advance reads as missing. Whether it is worth showing at all is
        // decided below, once the whole set is known.
        notdefLike: domAdvance > 0 && Math.abs(domAdvance - notdefAdvance) < 0.5,
      };
    });

    // The notdef comparison only carries information when the notdef advance is
    // distinctive. In a monospaced face every glyph has it, so the flag fires on
    // everything and means nothing — 18 of 30 glyphs in the opening set, all rendering
    // perfectly. Suppressed rather than shown as noise, and the reason is reported.
    var notdefHits = records.filter(function (r) { return r.notdefLike; }).length;
    var notdefInformative = records.length > 0 && notdefHits / records.length < 0.5;
    if (!notdefInformative) {
      records.forEach(function (r) { r.notdefLike = false; });
    }

    return {
      records: records,
      anchorAdvance: round2(anchorAlone),
      notdefAdvance: round2(notdefAdvance),
      notdefInformative: notdefInformative,
      notdefSuppressedFor: notdefInformative ? 0 : notdefHits,
      fontBox: fontBox(ctx, sizePx),
      envelope: measure.envelope({
        family: opts.family, sizePx: sizePx, anchor: anchor, hueDomain: opts.hueDomain,
      }, records),
    };
  };

  function fontBox(ctx, sizePx) {
    var t = ctx.measureText("Hxg");
    return {
      ascent: round2(t.fontBoundingBoxAscent / sizePx * 1000),
      descent: round2(t.fontBoundingBoxDescent / sizePx * 1000),
    };
  }

  function round2(n) { return Math.round(n * 100) / 100; }
  measure.round2 = round2;

  // ---------------------------------------------------------------- vertical metrics

  // x-height and cap-height are reported by no browser API. They are probed by rendering
  // `x` and `H` and taking the ink ascent — and a symbol face may carry neither, in which
  // case the probe silently returns some other font's metrics.
  //
  // docs/findings.md 0.3: the discriminator that works is comparing the probe's full ink
  // signature against the same probe with the head family replaced by one that does not
  // exist, *keeping the rest of the stack*. A baseline that ignores the tail misses every
  // stacked case.
  var ABSENT = '"__gh_no_such_family_9f3a__"';

  measure.verticalMetrics = function (family, sizePx) {
    var ctx = ctx2d();
    var tail = core.familyTail(family);
    var baselineStack = ABSENT + (tail ? ", " + core.cssFamily(tail) : "");

    function sig(fontSpec, ch) {
      ctx.font = sizePx + "px " + fontSpec;
      var t = ctx.measureText(ch);
      return {
        key: [t.width, t.actualBoundingBoxAscent, t.actualBoundingBoxDescent,
              t.actualBoundingBoxLeft, t.actualBoundingBoxRight].map(function (n) {
                return Math.round(n * 100) / 100;
              }).join("|"),
        ascent: round2(t.actualBoundingBoxAscent / sizePx * 1000),
      };
    }

    function probe(ch) {
      var real = sig(core.cssFamily(family), ch);
      var base = sig(baselineStack, ch);
      return real.key === base.key
        // True whenever the metrics are indistinguishable from what the fallback would
        // give. That includes the case where the requested family *is* what the fallback
        // resolves to, which no measurement can separate — hence "unconfirmed" rather
        // than "this font has no x-height". The first is true in both situations.
        ? { value: null, confirmed: false, reason: "indistinguishable from the fallback for this stack" }
        : { value: real.ascent, confirmed: true, reason: null };
    }

    return { xHeight: probe("x"), capHeight: probe("H") };
  };

  if (typeof module === "object" && module.exports) module.exports = GH;
})(typeof globalThis !== "undefined" ? globalThis : this);
