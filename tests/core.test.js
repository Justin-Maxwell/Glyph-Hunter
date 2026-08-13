// Tests for src/core.js, plus the data invariants from docs/build-spec.md section 9.
//
// Prioritised the way the spec asks: the ones where a wrong answer would be invisible.
// A mis-shaped log axis or a silently dropped block alias looks exactly like a correct
// one on screen.

(function () {
  "use strict";
  var core = window.GH.core;
  var DOMAIN = { min: 350, max: 1800 };

  // oklab distance, for asserting the ramp is perceptually even. Test-side only: the
  // application never needs to measure its own colours.
  function deltaE(t1, t2) {
    var a = core.rampAt(t1), b = core.rampAt(t2);
    var ar = a.h * Math.PI / 180, br = b.h * Math.PI / 180;
    var dL = a.l - b.l;
    var da = a.c * Math.cos(ar) - b.c * Math.cos(br);
    var db = a.c * Math.sin(ar) - b.c * Math.sin(br);
    return Math.sqrt(dL * dL + da * da + db * db);
  }
  function posOf(adv) { return core.logPosition(adv, DOMAIN); }

  suite("log scale", function () {
    test("domain ends anchor the axis", function () {
      assert.close(posOf(350), 0, 1e-9, "350 is the left edge");
      assert.close(posOf(1800), 1, 1e-9, "1800 is the right edge");
    });

    test("the near-identical pair lands where the spec says", function () {
      assert.close(posOf(836) * 100, 53.2, 0.05);
      assert.close(posOf(838) * 100, 53.3, 0.05);
    });

    test("equal ratios are equal distances — the whole reason for a log axis", function () {
      var a = posOf(800) - posOf(400);     // ratio 2
      var b = posOf(1600) - posOf(800);    // ratio 2
      assert.close(a, b, 1e-12, "two doublings should measure the same");
    });

    test("a 1.7% difference is not comparable to a 39% one", function () {
      var small = posOf(604) - posOf(594);
      var large = posOf(1390) - posOf(1000);
      assert.ok(large > small * 15, "expected the big ratio to dwarf the small one");
    });

    test("guard: zero and negative advances do not produce -Infinity", function () {
      assert.equal(posOf(0), 0);
      assert.equal(posOf(-5), 0);
      assert.equal(posOf(NaN), 0);
    });

    test("guard: a domain with no span does not divide by zero", function () {
      assert.equal(core.logPosition(500, { min: 500, max: 500 }), 0);
      assert.equal(core.logPosition(500, { min: 0, max: 0 }), 0);
    });

    test("out-of-domain values clamp, and say that they clamped", function () {
      assert.equal(posOf(100), 0);
      assert.equal(posOf(5000), 1);
      assert.ok(core.isClamped(100, DOMAIN));
      assert.ok(core.isClamped(5000, DOMAIN));
      assert.ok(!core.isClamped(836, DOMAIN));
      assert.ok(core.isClamped(0, DOMAIN), "a missing glyph is not silently in-domain");
    });
  });

  suite("colour ramp", function () {
    test("836 and 838 are the same colour to the eye — this is the point", function () {
      assert.ok(deltaE(posOf(836), posOf(838)) < 0.01,
        "a 0.24% width difference must not read as a different colour");
    });

    test("1000 and 1390 are plainly different", function () {
      assert.ok(deltaE(posOf(1000), posOf(1390)) > 0.08);
    });

    test("equal ratios give equal perceptual distance across the whole ramp", function () {
      var low = deltaE(posOf(400), posOf(800));
      var mid = deltaE(posOf(600), posOf(1200));
      var high = deltaE(posOf(850), posOf(1700));
      assert.close(low, mid, 0.02, "low against mid");
      assert.close(mid, high, 0.02, "mid against high");
    });

    test("lightness rises monotonically, so bands separate under colour-vision deficiency", function () {
      var prev = -1;
      for (var t = 0; t <= 1.0001; t += 0.05) {
        var l = core.rampAt(t).l;
        assert.ok(l > prev, "lightness should increase at t=" + t.toFixed(2));
        prev = l;
      }
    });

    test("emits oklch by default and hsl only when asked", function () {
      assert.ok(core.colourFor(836, DOMAIN).indexOf("oklch(") === 0);
      assert.ok(core.colourFor(836, DOMAIN, { fallback: true }).indexOf("hsl(") === 0);
      assert.ok(core.colourFor(836, DOMAIN, { alpha: 0.3 }).indexOf("/ 0.3") > 0);
    });
  });

  suite("advance sets", function () {
    var recs = [
      { cp: 0x25D0, advance: 604 }, { cp: 0x25D1, advance: 604 },
      { cp: 0x29B5, advance: 836 }, { cp: 0x2B24, advance: 928 },
      { cp: 0x25F7, advance: 836 }, { cp: 0x25CB, advance: 836 },
    ];

    test("one set per distinct advance, ordered by advance", function () {
      var g = core.advanceSets(recs);
      assert.deep(g.map(function (x) { return x.advance; }), [604, 836, 928]);
      assert.deep(g.map(function (x) { return x.count; }), [2, 3, 1]);
    });

    test("largest uniform subset is reported, not a binary verdict", function () {
      var best = core.largestUniformSubset(recs);
      assert.equal(best.advance, 836);
      assert.equal(best.members.length, 3);
    });

    test("guard: empty set", function () {
      assert.deep(core.advanceSets([]), []);
      assert.deep(core.largestUniformSubset([]), { advance: null, members: [] });
    });

    test("guard: a single advance set", function () {
      var one = [{ cp: 1, advance: 500 }, { cp: 2, advance: 500 }];
      assert.equal(core.advanceSets(one).length, 1);
      assert.equal(core.largestUniformSubset(one).advance, 500);
    });
  });

  suite("group toggles", function () {
    var groups = [
      { name: "pair", members: ["25D0", "25D1"] },
      { name: "solo", members: ["2B24"] },
      { name: "empty", members: [] },
    ];

    test("all, none and partial are derived from the content", function () {
      var s = core.groupState("◐◑⬤", groups);
      assert.equal(s.get("pair"), "all");
      assert.equal(s.get("solo"), "all");
      s = core.groupState("", groups);
      assert.equal(s.get("pair"), "none");
      s = core.groupState("◐", groups);
      assert.equal(s.get("pair"), "some", "partial must be its own state, not rounded");
      assert.equal(s.get("empty"), "none");
    });

    test("a hand edit changes the derived state — no stored flag can desync", function () {
      var text = core.applyToggle("", groups[0], "none");
      assert.equal(core.groupState(text, groups).get("pair"), "all");
      var edited = Array.from(text).filter(function (c) { return c !== "◑"; }).join("");
      assert.equal(core.groupState(edited, groups).get("pair"), "some");
    });

    test("toggling is additive: sets combine rather than replace", function () {
      var text = core.applyToggle("⬤", groups[0], "none");
      assert.equal(core.codepointsOf(text).length, 3, "⬤ should survive turning on `pair`");
    });

    test("completing a partial set adds only what is missing", function () {
      var text = core.applyToggle("◐", groups[0], "some");
      assert.equal(text, "◐◑", "no duplicate, and existing order kept");
    });

    test("turning a full group off removes exactly its members", function () {
      var text = core.applyToggle("◐◑⬤", groups[0], "all");
      assert.equal(text, "⬤");
    });

    test("whitespace is never a glyph under test", function () {
      assert.deep(core.codepointsOf(" ◐\n\t◑ "), [0x25D0, 0x25D1]);
    });

    test("group lookup returns a collection, today always of one", function () {
      var g = core.groupsOf(0x25D0, groups);
      assert.ok(Array.isArray(g), "must not hard-assume exclusivity");
      assert.deep(g, ["pair"]);
      assert.deep(core.groupsOf(0x0041, groups), []);
    });
  });

  suite("ruler label stagger", function () {
    test("adjacent advances do not overprint", function () {
      var items = [594, 604, 836, 838, 1000].map(function (a) {
        return { ref: a, pos: posOf(a) * 100 };
      });
      var out = core.staggerLabels(items, 4);
      var byRow = {};
      out.placed.forEach(function (p) { (byRow[p.row] = byRow[p.row] || []).push(p); });
      Object.keys(byRow).forEach(function (row) {
        var xs = byRow[row].map(function (p) { return p.pos; }).sort(function (a, b) { return a - b; });
        for (var i = 1; i < xs.length; i++) {
          assert.ok(xs[i] - xs[i - 1] >= 4, "labels on row " + row + " collide");
        }
      });
    });

    test("ticks keep their true positions — only labels move", function () {
      var items = [836, 838].map(function (a) { return { ref: a, pos: posOf(a) * 100 }; });
      var out = core.staggerLabels(items, 4);
      out.placed.forEach(function (p) {
        assert.close(p.pos, posOf(p.ref) * 100, 1e-12);
      });
    });

    test("stagger depth is reported, so ruler height is not fixed", function () {
      var tight = [836, 837, 838, 839].map(function (a) { return { ref: a, pos: posOf(a) * 100 }; });
      assert.ok(core.staggerLabels(tight, 4).rows >= 4, "four near-identical advances need four rows");
      var spread = [400, 800, 1600].map(function (a) { return { ref: a, pos: posOf(a) * 100 }; });
      assert.equal(core.staggerLabels(spread, 4).rows, 1, "well-separated labels stay on one row");
    });
  });

  suite("css family quoting", function () {
    // The live bug in the old build. Verified in docs/findings.md.
    test("a family whose last token starts with a digit gets quoted", function () {
      assert.equal(core.cssFamily("Noto Sans Symbols 2"), '"Noto Sans Symbols 2"');
    });

    test("generics are never quoted", function () {
      assert.equal(core.cssFamily("monospace"), "monospace");
      assert.equal(core.cssFamily("sans-serif"), "sans-serif");
    });

    test("stacks quote per token", function () {
      assert.equal(core.cssFamily("Noto Sans Symbols 2, sans-serif"),
        '"Noto Sans Symbols 2", sans-serif');
    });

    test("an already-quoted family is left alone", function () {
      assert.equal(core.cssFamily('"Liberation Sans"'), '"Liberation Sans"');
    });

    test("the tail of a stack is recoverable, for the fallback baseline", function () {
      assert.equal(core.familyTail("A, B, monospace"), "B, monospace");
      assert.equal(core.familyTail("monospace"), "");
    });

    test("the declaration a quoted family produces is actually valid", function () {
      // The real proof: the browser must accept it. An invalid declaration is dropped and
      // the previous value stands, which is exactly how the old bug hid.
      var el = document.createElement("span");
      el.style.fontFamily = "monospace";
      el.style.fontFamily = core.cssFamily("Noto Sans Symbols 2");
      assert.ok(el.style.fontFamily !== "monospace", "quoted family must apply");

      var raw = document.createElement("span");
      raw.style.fontFamily = "monospace";
      raw.style.fontFamily = "Noto Sans Symbols 2";
      assert.equal(raw.style.fontFamily, "monospace", "unquoted must still be dropped — regression guard");
    });
  });

  suite("data invariants", function () {
    var data = null, config = null;

    async function load() {
      if (data) return;
      data = await (await fetch("../data/glyphdata.json")).json();
      config = await (await fetch("../data/config.json")).json();
    }

    test("every block resolves to an official short alias", async function () {
      await load();
      var missing = Object.keys(data.blocks).filter(function (k) {
        return !data.blocks[k].short;
      });
      assert.deep(missing, [], "this regressed once, on loose matching");
    });

    test("every glyph carries the canonical block name used as the identicon hash input", async function () {
      await load();
      var bad = data.glyphs.filter(function (g) {
        return !g.block_canonical || !data.blocks[g.block_canonical];
      });
      assert.equal(bad.length, 0, "unresolved: " + bad.slice(0, 3).map(function (g) { return g.cp; }));
    });

    test("config round-trip: every configured codepoint exists in the derived data", async function () {
      await load();
      var known = new Set(data.glyphs.map(function (g) { return g.cp; }));
      var orphans = [];
      config.groups.forEach(function (g) {
        (g.members || []).forEach(function (cp) {
          if (!known.has(cp)) orphans.push(g.name + ":" + cp);
        });
      });
      assert.deep(orphans.slice(0, 5), [], orphans.length + " configured codepoints have no derived record");
    });

    test("one group per glyph, and nothing orphaned", async function () {
      await load();
      var seen = new Map();
      config.groups.forEach(function (g) {
        (g.members || []).forEach(function (cp) {
          seen.set(cp, (seen.get(cp) || 0) + 1);
        });
      });
      var dupes = [];
      seen.forEach(function (n, cp) { if (n > 1) dupes.push(cp); });
      assert.deep(dupes.slice(0, 5), [], dupes.length + " codepoints are in more than one group");
      assert.equal(seen.size, data.glyphs.length, "every glyph in the inventory belongs to a group");
    });

    test("the hue domain is present and expansive", async function () {
      await load();
      assert.ok(config.hue_domain.min > 0);
      assert.ok(config.hue_domain.max > config.hue_domain.min);
    });
  });

  suite("identicons", function () {
    test("the same canonical alias gives byte-identical SVG", function () {
      var a = jdenticon.toSvg("Miscellaneous_Mathematical_Symbols_B", 20, { padding: 0 });
      var b = jdenticon.toSvg("Miscellaneous_Mathematical_Symbols_B", 20, { padding: 0 });
      assert.equal(a, b);
    });

    test("a different alias gives a different icon", function () {
      var a = jdenticon.toSvg("Geometric_Shapes", 20, { padding: 0 });
      var b = jdenticon.toSvg("Geometric_Shapes_Extended", 20, { padding: 0 });
      assert.ok(a !== b);
    });

    test("the hash input is the canonical alias, not the display name", function () {
      // Portability rests on this exact string. If the input ever becomes the display
      // form, every icon changes and every other tool disagrees with us.
      var canonical = jdenticon.toSvg("Miscellaneous_Mathematical_Symbols_B", 20, { padding: 0 });
      var display = jdenticon.toSvg("Miscellaneous Mathematical Symbols-B", 20, { padding: 0 });
      assert.ok(canonical !== display, "these must not be conflated");
    });
  });
})();
