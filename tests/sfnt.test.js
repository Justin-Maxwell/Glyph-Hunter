// The sfnt reader against fontTools' answers.
//
// This is the highest-value test in the suite, because a cmap bug is invisible: a wrong
// segment lookup returns *a* glyph id, the advance that comes back is plausible, and the
// font guesser then names the wrong face with confidence. fontTools is the oracle.
//
// Skips, loudly, when tests/fixtures is not staged. Run tools/make_font_fixtures.py.

(function () {
  "use strict";
  var sfnt = window.GH.sfnt;
  var expected = null, faces = {}, staged = false;

  async function load() {
    if (expected !== null) return;
    try {
      expected = await (await fetch("fixtures/expected.json")).json();
    } catch (e) {
      expected = {}; return;
    }
    for (var name in expected) {
      try {
        var buf = await (await fetch("fixtures/" + name)).arrayBuffer();
        faces[name] = sfnt.parse(buf);
        staged = true;
      } catch (e) {
        faces[name] = { error: e.message };
      }
    }
  }

  suite("sfnt reader", function () {
    test("fixtures are staged", async function () {
      await load();
      assert.ok(staged,
        "no fixtures — run `python3 tools/make_font_fixtures.py`; the reader is UNVERIFIED " +
        "until you do");
    });

    test("advances match fontTools exactly, across both cmap formats", async function () {
      await load();
      if (!staged) { assert.ok(true, "skipped"); return; }
      var mismatches = [];
      Object.keys(expected).forEach(function (name) {
        var face = faces[name];
        if (!face || face.error) { mismatches.push(name + ": " + (face && face.error)); return; }
        var glyphs = expected[name].glyphs;
        Object.keys(glyphs).forEach(function (hex) {
          var cp = parseInt(hex, 16);
          var got = face.advance(cp);
          var want = glyphs[hex];
          var same = (want == null && got == null) ||
                     (want != null && got != null && Math.abs(got - want) < 0.01);
          if (!same) mismatches.push(name + " U+" + hex + ": expected " + want + ", got " + got);
        });
      });
      assert.deep(mismatches, []);
    });

    test("coverage agrees: absent codepoints report absent, not glyph zero's advance", async function () {
      await load();
      if (!staged) { assert.ok(true, "skipped"); return; }
      var wrong = [];
      Object.keys(expected).forEach(function (name) {
        var face = faces[name];
        if (!face || face.error) return;
        var glyphs = expected[name].glyphs;
        Object.keys(glyphs).forEach(function (hex) {
          var cp = parseInt(hex, 16);
          var has = face.has(cp);
          if (has !== (glyphs[hex] != null)) {
            wrong.push(name + " U+" + hex + ": has()=" + has + " but fontTools says " +
                       (glyphs[hex] != null));
          }
        });
      });
      assert.deep(wrong, []);
    });

    test("astral codepoints resolve, which needs a format 12 subtable", async function () {
      await load();
      if (!staged) { assert.ok(true, "skipped"); return; }
      // Symbola carries astral geometric shapes; a BMP-only reader would return null and
      // the failure would look like a missing glyph rather than a missing code path.
      var sym = faces["Symbola.ttf"];
      if (!sym || sym.error) { assert.ok(true, "Symbola not staged"); return; }
      assert.ok(sym.cmapFormat === 12, "expected a format 12 cmap, got " + sym.cmapFormat);
      assert.ok(sym.advance(0x1F78A) != null, "U+1F78A should resolve above the BMP");
    });

    test("units per em is read, so advances are comparable across faces", async function () {
      await load();
      if (!staged) { assert.ok(true, "skipped"); return; }
      Object.keys(expected).forEach(function (name) {
        if (faces[name] && !faces[name].error) {
          assert.equal(faces[name].upem, expected[name].upem, name);
        }
      });
    });
  });
})();
