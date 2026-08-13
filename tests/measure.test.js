// Measurement tests. These need a browser and real fonts, so they assert what must hold
// regardless of which faces are installed, and skip the face-specific cases when the face
// is absent rather than failing on someone else's machine.

(function () {
  "use strict";
  var core = window.GH.core, measure = window.GH.measure;
  var DOMAIN = { min: 350, max: 1800 };

  function run(family, chars, anchor) {
    return measure.run({
      family: family, sizePx: 200, anchor: anchor || "",
      codepoints: core.codepointsOf(chars), hueDomain: DOMAIN,
    });
  }

  // Is this family actually resolvable here? Compare against a family that cannot exist.
  function haveFamily(name) {
    var c = document.createElement("canvas").getContext("2d");
    c.font = '100px "__gh_absent__"';
    var base = c.measureText("○Hx").width;
    c.font = '100px ' + core.cssFamily(name);
    return c.measureText("○Hx").width !== base;
  }

  suite("measurement", function () {
    test("advances are whole units per 1000 em", function () {
      // The regression this guards: measuring to two decimals let sub-pixel layout noise
      // split one width into many. 5083 glyphs produced 662 width groups where rounding
      // gives 576, and near-identical values like 151.02 and 151.03 read as distinct.
      var r = run("sans-serif", "○●◐◑◎◉◌⬤⦵⦶⦷");
      r.records.forEach(function (rec) {
        assert.equal(rec.advance, Math.round(rec.advance), "U+" + rec.hex + " advance");
      });
    });

    test("identical glyphs in one width group do not shatter", function () {
      var r = run("monospace", "○●◐◑◎◉◌");
      var groups = core.widthGroups(r.records);
      assert.equal(groups.length, 1, "a monospaced face must give exactly one width group");
    });

    test("every record carries the shared shape a front end consumes", function () {
      var r = run("sans-serif", "○●");
      r.records.forEach(function (rec) {
        ["cp", "hex", "char", "advance", "canvasAdvance", "ink", "diverges", "notdefLike"]
          .forEach(function (k) {
            assert.ok(k in rec, "missing " + k);
          });
        ["ascent", "descent", "left", "right"].forEach(function (k) {
          assert.ok(k in rec.ink, "missing ink." + k);
        });
      });
    });

    test("the run envelope is emitted with provenance, even though nothing consumes it", function () {
      var r = run("sans-serif", "○●");
      ["font_requested", "font_resolved_hint", "platform", "user_agent", "size_px",
       "timestamp_iso", "glyph_count", "hue_domain"].forEach(function (k) {
        assert.ok(r.envelope[k] != null, "envelope missing " + k);
      });
      assert.equal(r.envelope.glyph_count, 2);
      assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(r.envelope.timestamp_iso));
    });

    test("no anchor means no shift, rather than a shift of zero", function () {
      var r = run("sans-serif", "⬤");
      assert.equal(r.records[0].shift, null);
      assert.equal(r.records[0].advanceInRun, null);
    });

    test("an empty set measures cleanly", function () {
      var r = run("sans-serif", "");
      assert.deep(r.records, []);
      assert.equal(r.envelope.glyph_count, 0);
      assert.deep(core.widthGroups(r.records), []);
    });

    test("the anchor changes an advance when it forces a fallback", function () {
      // docs/findings.md 0.1. Machine-dependent, so it asserts the mechanism only where
      // the fallback chain actually produces it.
      var plain = run("sans-serif", "⬤");
      var anchored = run("sans-serif", "⬤", "◉");
      var a = plain.records[0].advance, b = anchored.records[0].advanceInRun;
      if (a === b) { assert.ok(true, "no re-itemisation in this font stack — skipped"); return; }
      assert.ok(Math.abs(b - a) > 10, "a re-itemisation shift should be large, not kerning-sized");
      assert.equal(anchored.records[0].shift, b - a);
    });
  });

  suite("vertical metrics", function () {
    test("a face carrying x and H reports confirmed heights", function () {
      if (!haveFamily("Liberation Sans")) { assert.ok(true, "Liberation Sans absent — skipped"); return; }
      var vm = measure.verticalMetrics("Liberation Sans", 200);
      assert.ok(vm.xHeight.confirmed, "x-height should be confirmed: " + vm.xHeight.reason);
      assert.ok(vm.xHeight.value > 300 && vm.xHeight.value < 700, "plausible x-height");
      assert.ok(vm.capHeight.value > vm.xHeight.value, "cap-height above x-height");
    });

    test("a symbol face carrying neither is refused, not answered from the fallback", function () {
      if (!haveFamily("Noto Sans Symbols 2")) {
        assert.ok(true, "Noto Sans Symbols 2 absent — skipped"); return;
      }
      var vm = measure.verticalMetrics("Noto Sans Symbols 2", 200);
      assert.ok(!vm.xHeight.confirmed, "must not report another font's x-height");
      assert.equal(vm.xHeight.value, null);
      assert.ok(vm.xHeight.reason && vm.xHeight.reason.length > 0, "must give a visible reason");
    });

    test("the baseline mirrors the whole stack, not just the head family", function () {
      if (!haveFamily("Noto Sans Symbols 2")) {
        assert.ok(true, "Noto Sans Symbols 2 absent — skipped"); return;
      }
      // A baseline ignoring the tail misses every stacked case. This is the exact
      // regression docs/findings.md 0.3 records.
      ["Noto Sans Symbols 2, sans-serif", "Noto Sans Symbols 2, monospace"].forEach(function (stack) {
        var vm = measure.verticalMetrics(stack, 200);
        assert.ok(!vm.xHeight.confirmed, "should stay unconfirmed for: " + stack);
      });
    });
  });

  suite("font guesser", function () {
    test("it always says it is guessing", function () {
      var g = window.GH.fontguess.identify({
        family: "sans-serif", sizePx: 200, cp: 0x25CB, advance: 604,
      });
      assert.ok(g.is_guess === true);
      assert.ok(/No browser reports which face/.test(g.caveat));
    });

    test("every evidence source reports availability and a reason", function () {
      var g = window.GH.fontguess.identify({
        family: "sans-serif", sizePx: 200, cp: 0x25CB, advance: 604,
      });
      assert.equal(g.evidence.length, 3);
      g.evidence.forEach(function (e) {
        assert.ok(typeof e.available === "boolean", e.source + " must state availability");
        assert.ok(e.why && e.why.length > 0, e.source + " must give a reason");
      });
    });

    test("the browser-independent source is available with no permission at all", function () {
      // The browser-agnostic constraint: this one must never depend on a Chrome-only API.
      var g = window.GH.fontguess.identify({
        family: "sans-serif", sizePx: 200, cp: 0x25CB, advance: 604,
      });
      var sig = g.evidence.find(function (e) { return e.source === "metric-signature"; });
      assert.ok(sig.available, "metric-signature must work everywhere");
    });
  });
})();
