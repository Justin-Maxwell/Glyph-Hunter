// Glyph-Hunter core. Pure logic, no DOM, no browser API.
//
// Everything here is a function of its arguments. That is the standing TUI constraint in
// ROADMAP.md doing its work: a terminal front end needs the scale, the grouping and the
// toggle derivation, and none of those should have to be extracted from a DOM handler
// first. Classic script rather than an ES module, because a module script cannot be loaded
// from a file:// page.

(function (root) {
  "use strict";

  var GH = root.GH || (root.GH = {});
  var core = GH.core = {};

  // ---------------------------------------------------------------- scale

  // Advance divergence is multiplicative: 594 against 604 is 1.7%, 1000 against 1390 is
  // 39%. A linear axis makes those look comparable. A log axis makes equal ratios equal
  // distances, which is the only reading that means anything here.
  //
  // Two guards, both from DEBT.md. A missing glyph can report a zero advance and log(0) is
  // -Infinity; a domain with no span divides by zero.
  core.logPosition = function (advance, domain) {
    var min = domain && domain.min, max = domain && domain.max;
    if (!(min > 0) || !(max > 0)) return 0;
    var lo = Math.log(min), hi = Math.log(max);
    var span = hi - lo;
    if (!(span > 0)) return 0;              // single-value domain
    if (!(advance > 0)) return 0;           // zero or missing advance
    var t = (Math.log(advance) - lo) / span;
    return t < 0 ? 0 : t > 1 ? 1 : t;       // clamp; the domain is deliberately expansive
  };

  // True when the value sits outside the pinned domain and has been clamped. The domain is
  // static so two screenshots compare directly, which means overflow is possible and must
  // be visible rather than silently pinned to an end stop.
  core.isClamped = function (advance, domain) {
    if (!(advance > 0)) return true;
    return advance < domain.min || advance > domain.max;
  };

  // ---------------------------------------------------------------- colour

  // Hue maps to value, that is to position on the log axis — never to group rank. 836 and
  // 838 land 0.1% apart and get near-identical hues, and that is the point: separate rows
  // already make the two groups look distinct, and the shared hue is the only thing saying
  // *same width*. Rank would render a 0.24% difference as maximal separation.
  //
  // oklch because hue distance is read as ratio distance, so equal ratios must look equally
  // different wherever they land. A naive HSL rainbow has large perceptual jumps around
  // green and cyan and small ones elsewhere, which would corrupt exactly that reading.
  var RAMP = {
    hueFrom: 260,   // blue
    hueTo: 25,      // red, sweeping down through cyan, green, yellow, orange
    chroma: 0.13,   // conservative enough to stay in sRGB across the whole sweep
    lightFrom: 0.52,
    lightTo: 0.78,  // lightness rises monotonically, which keeps bands separable under CVD
  };
  core.RAMP = RAMP;

  core.rampAt = function (t) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return {
      l: RAMP.lightFrom + (RAMP.lightTo - RAMP.lightFrom) * t,
      c: RAMP.chroma,
      h: RAMP.hueFrom + (RAMP.hueTo - RAMP.hueFrom) * t,
    };
  };

  core.colourFor = function (advance, domain, opts) {
    var stop = core.rampAt(core.logPosition(advance, domain));
    var alpha = opts && opts.alpha;
    if (opts && opts.fallback) {
      // Only for a browser without oklch(). Deliberately not the primary path: the whole
      // reason for oklch is that this approximation is perceptually uneven.
      var l = Math.round(stop.l * 100);
      return alpha == null
        ? "hsl(" + Math.round(stop.h) + " 70% " + l + "%)"
        : "hsl(" + Math.round(stop.h) + " 70% " + l + "% / " + alpha + ")";
    }
    var base = stop.l.toFixed(4) + " " + stop.c.toFixed(4) + " " + stop.h.toFixed(2);
    return alpha == null ? "oklch(" + base + ")" : "oklch(" + base + " / " + alpha + ")";
  };

  // ---------------------------------------------------------------- width groups

  // Records in, width groups out. One group per distinct advance, ordered by advance.
  // No verdict, no pass or fail: the bench is a visual explorer, not an assessor.
  core.widthGroups = function (records) {
    var byAdvance = new Map();
    (records || []).forEach(function (r) {
      var key = r.advance;
      if (!byAdvance.has(key)) byAdvance.set(key, []);
      byAdvance.get(key).push(r);
    });
    var out = [];
    byAdvance.forEach(function (members, advance) {
      out.push({ advance: advance, members: members, count: members.length });
    });
    out.sort(function (a, b) { return a.advance - b.advance; });
    return out;
  };

  // The largest set of glyphs sharing one advance. Named because the question the whole
  // project asks is which glyphs stay grouped, and DEBT.md records both tools reporting
  // only a binary uniform / not-uniform where this is what was wanted.
  core.largestUniformSubset = function (records) {
    var groups = core.widthGroups(records);
    if (!groups.length) return { advance: null, members: [] };
    var best = groups[0];
    groups.forEach(function (g) { if (g.count > best.count) best = g; });
    return { advance: best.advance, members: best.members.slice() };
  };

  // ---------------------------------------------------------------- glyph set text

  // Codepoints out of an authored string. Whitespace is not a glyph under test.
  core.codepointsOf = function (text) {
    var out = [];
    for (var i = 0, chars = Array.from(text || ""); i < chars.length; i++) {
      var cp = chars[i].codePointAt(0);
      if (cp > 32) out.push(cp);
    }
    return out;
  };

  core.hex = function (cp) {
    var s = cp.toString(16).toUpperCase();
    return s.length < 4 ? "0000".slice(s.length) + s : s;
  };

  core.fromHex = function (s) { return parseInt(s, 16); };

  core.charOf = function (cp) { return String.fromCodePoint(cp); };

  // ---------------------------------------------------------------- group toggles

  // Toggle state is *derived from the content*, never stored. A stored flag desyncs the
  // moment the textarea is hand-edited, and then the buttons lie about what is on screen.
  //
  // Three states, and `some` will be common, so it needs a look of its own rather than
  // being rounded to on or off.
  core.groupState = function (text, groups) {
    var present = new Set(core.codepointsOf(text));
    var state = new Map();
    (groups || []).forEach(function (g) {
      var members = g.members || [];
      if (!members.length) { state.set(g.name, "none"); return; }
      var hits = 0;
      for (var i = 0; i < members.length; i++) {
        if (present.has(core.fromHex(members[i]))) hits++;
      }
      state.set(g.name, hits === 0 ? "none" : hits === members.length ? "all" : "some");
    });
    return state;
  };

  // Toggling is additive: sets combine rather than replace. `some` and `none` both mean
  // *turn it on*, because the useful move from a partial state is to complete it.
  core.applyToggle = function (text, group, state) {
    var cps = core.codepointsOf(text);
    var members = (group.members || []).map(core.fromHex);
    if (state === "all") {
      var drop = new Set(members);
      return cps.filter(function (cp) { return !drop.has(cp); }).map(core.charOf).join("");
    }
    var have = new Set(cps);
    members.forEach(function (cp) { if (!have.has(cp)) { cps.push(cp); have.add(cp); } });
    return cps.map(core.charOf).join("");
  };

  // Which groups a codepoint belongs to. Returns a collection that today always holds one
  // entry: ROADMAP.md set 10 says one group per glyph and says the reader must not
  // hard-assume it, so that relaxing it later stays cheap. Nothing about this surfaces.
  core.groupsOf = function (cp, groups) {
    var hex = core.hex(cp);
    var out = [];
    (groups || []).forEach(function (g) {
      if ((g.members || []).indexOf(hex) !== -1) out.push(g.name);
    });
    return out;
  };

  // ---------------------------------------------------------------- ruler labels

  // Ticks stay at their true positions; labels stagger downward when they would collide.
  // Not cosmetic: 594/604 and 836/838 overprint in the old build, and near-equal advances
  // are the interesting case. Depth of stagger sets the ruler height, so it is returned
  // rather than fixed.
  core.staggerLabels = function (items, minGapPct) {
    var gap = minGapPct == null ? 4 : minGapPct;
    var sorted = (items || []).slice().sort(function (a, b) { return a.pos - b.pos; });
    var rowEnds = [];   // right-hand edge, in percent, of the last label placed on each row
    var out = sorted.map(function (it) {
      var row = 0;
      while (rowEnds[row] != null && it.pos - rowEnds[row] < gap) row++;
      rowEnds[row] = it.pos;
      return { ref: it.ref, pos: it.pos, row: row };
    });
    var depth = rowEnds.length;
    return { placed: out, rows: depth };
  };

  // ---------------------------------------------------------------- css families

  // `Noto Sans Symbols 2` is invalid CSS unquoted: an identifier may not begin with a
  // digit, so the whole declaration is dropped and the previously set font silently
  // stands. That is a live bug in the old build, verified in docs/findings.md.
  //
  // Quoting happens here, in the reader. The authored config must not have to know.
  var GENERIC = ["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui",
    "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded", "math", "emoji", "fangsong"];

  core.cssFamily = function (spec) {
    return String(spec || "").split(",").map(function (s) {
      return s.trim();
    }).filter(Boolean).map(function (f) {
      if (GENERIC.indexOf(f) !== -1) return f;
      if (/^"|^'/.test(f)) return f;                       // already quoted by the author
      return '"' + f.replace(/(["\\])/g, "\\$1") + '"';
    }).join(", ");
  };

  // The stack minus its head, used to build a fallback baseline that exercises the same
  // chain. See docs/findings.md 0.3: a baseline that ignores the tail misses every stacked
  // case.
  core.familyTail = function (spec) {
    var parts = String(spec || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    return parts.slice(1).join(", ");
  };

  if (typeof module === "object" && module.exports) module.exports = GH;
})(typeof globalThis !== "undefined" ? globalThis : this);
