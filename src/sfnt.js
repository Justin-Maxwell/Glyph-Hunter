// A very small sfnt reader: enough to answer "does this face have this codepoint, and at
// what advance". Nothing else.
//
// It exists because queryLocalFonts() hands back the actual font file, and parsing the
// cmap in the page turns a guess into a reading — on the browsers that have that API. The
// browser-agnostic constraint in ROADMAP.md means this is an enhancement over the
// metric-signature path, never a replacement for it.

(function (root) {
  "use strict";

  var GH = root.GH || (root.GH = {});
  var sfnt = GH.sfnt = {};

  function tag(view, off) {
    return String.fromCharCode(view.getUint8(off), view.getUint8(off + 1),
                               view.getUint8(off + 2), view.getUint8(off + 3));
  }

  // Returns { tables, upem, numGlyphs, numberOfHMetrics } or throws.
  function directory(view) {
    var version = view.getUint32(0);
    if (version === 0x74746366) throw new Error("font collection, not a single face");
    if (version !== 0x00010000 && tag(view, 0) !== "OTTO") throw new Error("not an sfnt");

    var numTables = view.getUint16(4);
    var tables = {};
    for (var i = 0; i < numTables; i++) {
      var rec = 12 + i * 16;
      tables[tag(view, rec)] = { offset: view.getUint32(rec + 8), length: view.getUint32(rec + 12) };
    }
    if (!tables.head || !tables.cmap) throw new Error("missing head or cmap");
    return {
      tables: tables,
      upem: view.getUint16(tables.head.offset + 18),
      numGlyphs: tables.maxp ? view.getUint16(tables.maxp.offset + 4) : 0,
      numberOfHMetrics: tables.hhea ? view.getUint16(tables.hhea.offset + 34) : 0,
    };
  }

  // Pick the best cmap subtable: a full-repertoire format 12 before a BMP-only format 4,
  // because half these glyphs live above U+FFFF.
  function bestCmap(view, cmapOffset) {
    var n = view.getUint16(cmapOffset + 2);
    var best = null, bestScore = -1;
    for (var i = 0; i < n; i++) {
      var rec = cmapOffset + 4 + i * 8;
      var platform = view.getUint16(rec), encoding = view.getUint16(rec + 2);
      var sub = cmapOffset + view.getUint32(rec + 4);
      var format = view.getUint16(sub);
      var score = -1;
      if (format === 12 && platform === 3 && encoding === 10) score = 5;
      else if (format === 12) score = 4;
      else if (format === 4 && platform === 3 && encoding === 1) score = 3;
      else if (format === 4) score = 2;
      else if (format === 6) score = 1;
      if (score > bestScore) { bestScore = score; best = { offset: sub, format: format }; }
    }
    if (!best) throw new Error("no usable cmap subtable");
    return best;
  }

  function lookupFormat4(view, off, cp) {
    if (cp > 0xFFFF) return 0;
    var segCountX2 = view.getUint16(off + 6);
    var segCount = segCountX2 / 2;
    var endBase = off + 14;
    var startBase = endBase + segCountX2 + 2;
    var deltaBase = startBase + segCountX2;
    var rangeBase = deltaBase + segCountX2;

    // binary search over the ordered end codes
    var lo = 0, hi = segCount - 1, seg = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (view.getUint16(endBase + mid * 2) >= cp) { seg = mid; hi = mid - 1; }
      else lo = mid + 1;
    }
    if (seg < 0) return 0;
    var start = view.getUint16(startBase + seg * 2);
    if (cp < start) return 0;
    var delta = view.getInt16(deltaBase + seg * 2);
    var rangeOffset = view.getUint16(rangeBase + seg * 2);
    if (rangeOffset === 0) return (cp + delta) & 0xFFFF;
    var gidAddr = rangeBase + seg * 2 + rangeOffset + (cp - start) * 2;
    var gid = view.getUint16(gidAddr);
    return gid === 0 ? 0 : (gid + delta) & 0xFFFF;
  }

  function lookupFormat12(view, off, cp) {
    var nGroups = view.getUint32(off + 12);
    var lo = 0, hi = nGroups - 1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      var g = off + 16 + mid * 12;
      var startCode = view.getUint32(g), endCode = view.getUint32(g + 4);
      if (cp < startCode) hi = mid - 1;
      else if (cp > endCode) lo = mid + 1;
      else return view.getUint32(g + 8) + (cp - startCode);
    }
    return 0;
  }

  function lookupFormat6(view, off, cp) {
    var first = view.getUint16(off + 6), count = view.getUint16(off + 8);
    if (cp < first || cp >= first + count) return 0;
    return view.getUint16(off + 10 + (cp - first) * 2);
  }

  // face.glyphId(cp) -> gid or 0; face.advance(cp) -> per 1000 em, or null
  sfnt.parse = function (arrayBuffer) {
    var view = new DataView(arrayBuffer);
    var dir = directory(view);
    var cmap = bestCmap(view, dir.tables.cmap.offset);

    function glyphId(cp) {
      if (cmap.format === 12) return lookupFormat12(view, cmap.offset, cp);
      if (cmap.format === 4) return lookupFormat4(view, cmap.offset, cp);
      if (cmap.format === 6) return lookupFormat6(view, cmap.offset, cp);
      return 0;
    }

    function advance(cp) {
      var gid = glyphId(cp);
      if (!gid || !dir.tables.hmtx || !dir.numberOfHMetrics) return null;
      var i = Math.min(gid, dir.numberOfHMetrics - 1);
      var raw = view.getUint16(dir.tables.hmtx.offset + i * 4);
      return Math.round(raw / dir.upem * 1000 * 100) / 100;
    }

    return {
      upem: dir.upem,
      numGlyphs: dir.numGlyphs,
      cmapFormat: cmap.format,
      glyphId: glyphId,
      has: function (cp) { return glyphId(cp) !== 0; },
      advance: advance,
    };
  };

  if (typeof module === "object" && module.exports) module.exports = GH;
})(typeof globalThis !== "undefined" ? globalThis : this);
