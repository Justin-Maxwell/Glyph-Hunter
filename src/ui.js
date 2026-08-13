// Presentation. Everything decision-shaped lives in core.js, measure.js and fontguess.js;
// this module paints their output. That split is the standing TUI constraint: a terminal
// front end replaces this file and nothing else.

(function (root) {
  "use strict";

  var GH = root.GH;
  var core = GH.core, measure = GH.measure, hover = GH.hover, fontguess = GH.fontguess;
  var ui = GH.ui = {};

  var state = {
    config: null,
    data: null,
    index: null,          // hex -> derived record
    dataPath: null,       // "fetch" or "shim"
    family: "monospace",
    sizePx: 200,
    anchor: "0",
    text: "",
    guideOpacity: 0.5,
    guides: { advance: true, baseline: true, xheight: true, capheight: true, ink: true, centre: true },
    result: null,
    specimenLimit: 300,
  };
  ui.state = state;

  var $ = function (id) { return document.getElementById(id); };
  var identiconCache = new Map();

  function identicon(canonical, size) {
    var key = canonical + "@" + size;
    if (!identiconCache.has(key)) {
      // padding 0: docs/findings.md 0.2 — the default 0.08 is what makes icons
      // indistinguishable at table size, far more than the size itself does.
      identiconCache.set(key, jdenticon.toSvg(canonical, size, { padding: 0 }));
    }
    return identiconCache.get(key);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // ---------------------------------------------------------------- data loading

  // fetch() fails on a file:// page: Chrome treats a sibling file as cross-origin. A
  // <script src> does not. So try fetch, fall back to the shim globals — and say which
  // happened, because a silent fallback that loads stale data is a trap.
  ui.load = async function () {
    var viaFetch = true;
    try {
      var c = await fetch("data/config.json");
      var d = await fetch("data/glyphdata.json");
      if (!c.ok || !d.ok) throw new Error("http " + c.status + "/" + d.status);
      state.config = await c.json();
      state.data = await d.json();
    } catch (e) {
      viaFetch = false;
      state.config = root.GLYPHCONFIG;
      state.data = root.GLYPHDATA;
      if (!state.config || !state.data) {
        throw new Error("no data: fetch failed (" + e.message + ") and the shims are absent");
      }
    }
    state.dataPath = viaFetch ? "fetch" : "shim";
    // On the shim path the config on screen is a generated copy, and an edit to
    // config.json since then is invisible. Show when it was generated so the staleness is
    // at least checkable against the clock.
    state.dataGenerated = viaFetch ? null : (root.GLYPHCONFIG_GENERATED || "unknown");

    state.index = new Map();
    state.data.glyphs.forEach(function (g) { state.index.set(g.cp, g); });

    var def = state.config.defaults || {};
    state.family = def.font_family || "monospace";
    state.sizePx = def.size || 200;
    state.anchor = def.anchor == null ? "0" : def.anchor;
    state.guideOpacity = def.guide_opacity == null ? 0.5 : def.guide_opacity;
    if (def.specimen_limit) state.specimenLimit = def.specimen_limit;

    // The opening set is an explicit codepoint list when the config gives one. A whole
    // group is too much to open on — a hunter's bench, not a smörgåsbord — and no group
    // is the right size by accident. `selected_by_default` remains as the fallback, so a
    // config without a `glyph_set` still behaves.
    var cps = [];
    if (def.glyph_set && def.glyph_set.length) {
      cps = def.glyph_set.map(core.fromHex);
    } else {
      (state.config.groups || []).forEach(function (g) {
        if (g.selected_by_default) (g.members || []).forEach(function (m) { cps.push(core.fromHex(m)); });
      });
    }
    state.text = cps.map(core.charOf).join("");
  };

  // ---------------------------------------------------------------- controls

  function renderFontPanel() {
    var host = $("font-panel");
    var panel = state.config.font_panel || [];
    host.innerHTML = panel.map(function (cat) {
      var open = cat.open || cat.families.indexOf(state.family) !== -1;
      return '<details class="fontcat"' + (open ? " open" : "") + '>' +
        "<summary>" + esc(cat.category) + "</summary>" +
        '<div class="chips">' + cat.families.map(function (f) {
          return '<button type="button" class="chip' + (f === state.family ? " on" : "") +
            '" data-family="' + esc(f) + '">' + esc(f) + "</button>";
        }).join("") + "</div></details>";
    }).join("");

    host.querySelectorAll("[data-family]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.family = b.dataset.family;
        $("family-input").value = state.family;
        renderFontPanel();
        ui.refresh();
      });
    });
  }

  function renderGroupToggles() {
    var host = $("group-toggles");
    var groups = state.config.groups || [];
    var st = core.groupState(state.text, groups);
    host.innerHTML = groups.map(function (g) {
      var s = st.get(g.name);
      return '<button type="button" class="chip g-' + s + '" data-group="' + esc(g.name) +
        '" title="' + g.members.length + ' glyphs — ' + s + '">' +
        esc(g.name) + '<span class="n">' + g.members.length + "</span></button>";
    }).join("");

    host.querySelectorAll("[data-group]").forEach(function (b) {
      b.addEventListener("click", function () {
        var g = groups.find(function (x) { return x.name === b.dataset.group; });
        state.text = core.applyToggle(state.text, g, st.get(g.name));
        $("glyph-set").value = state.text;
        ui.refresh();
      });
    });
  }

  // ---------------------------------------------------------------- specimen

  // The specimen is one text node, so the run really is a run and re-itemisation is
  // visible. Guides are overlaid from Range rects taken off that same node, rather than
  // from per-glyph spans that would destroy the thing being looked at.
  function renderSpecimen(result) {
    var host = $("specimen");
    var limit = state.specimenLimit;
    var recs = result.records;
    var shown = recs.slice(0, limit);

    var note = $("specimen-note");
    note.textContent = recs.length > limit
      ? "showing " + limit + " of " + recs.length + " glyphs — the specimen is for looking at, " +
        "so it is capped. Raise it with `specimen_limit` in config defaults."
      : recs.length + " glyphs";

    host.style.font = state.sizePx + "px " + core.cssFamily(state.family);
    var text = shown.map(function (r) { return r.char; }).join("");
    host.innerHTML = '<span class="run"></span><div class="guides"></div>';
    var run = host.querySelector(".run");
    run.textContent = text;

    drawGuides(host, run, shown, result);
  }

  function drawGuides(host, run, recs, result) {
    var layer = host.querySelector(".guides");
    if (!state.guides.advance && !state.guides.baseline && !state.guides.ink) return;

    var node = run.firstChild;
    if (!node) return;
    var hostBox = host.getBoundingClientRect();
    var size = state.sizePx;

    // Where the baseline sits inside the line box. The run is a single line, so the
    // baseline is the top of the box plus the font's ascent.
    var probe = document.createElement("span");
    probe.textContent = "X";
    probe.style.cssText = "display:inline-block;width:0;overflow:hidden;";
    run.appendChild(probe);
    var baselineY = probe.getBoundingClientRect().bottom - hostBox.top;
    probe.remove();

    var vm = measure.verticalMetrics(state.family, size);
    var parts = [];
    var op = state.guideOpacity;

    // Advance cells as alternating shading, so they recede rather than compete.
    var i = 0, offset = 0;
    var rects = [];
    for (var k = 0; k < recs.length; k++) {
      var r = document.createRange();
      r.setStart(node, offset);
      r.setEnd(node, offset + recs[k].char.length);
      var b = r.getBoundingClientRect();
      rects.push({ left: b.left - hostBox.left, width: b.width, rec: recs[k] });
      offset += recs[k].char.length;
    }

    rects.forEach(function (c, n) {
      if (state.guides.advance && n % 2 === 1) {
        parts.push('<div class="g-cell" style="left:' + c.left + "px;width:" + c.width +
          "px;opacity:" + (op * 0.35) + '"></div>');
      }
      if (state.guides.ink && !c.rec.diverges) {
        // Ink box from canvas TextMetrics. Drawn only when the two engines agree on the
        // advance: where they disagree the canvas ink describes a glyph that is not the
        // one on screen (docs/findings.md 0.1).
        var ink = c.rec.ink;
        var l = c.left + ((-ink.left) / 1000 * size);
        var w = (ink.left + ink.right) / 1000 * size;
        var top = baselineY - (ink.ascent / 1000 * size);
        var h = (ink.ascent + ink.descent) / 1000 * size;
        parts.push('<div class="g-ink" style="left:' + l + "px;top:" + top + "px;width:" + w +
          "px;height:" + h + "px;opacity:" + op + '"></div>');
        if (state.guides.centre) {
          var cy = top + h / 2;
          parts.push('<div class="g-inkmid" style="left:' + c.left + "px;width:" + c.width +
            "px;top:" + cy + "px;opacity:" + op + '"></div>');
        }
      }
      if (c.rec.diverges) {
        parts.push('<div class="g-diverge" style="left:' + c.left + "px;width:" + c.width +
          'px" title="canvas and DOM disagree on this glyph’s advance — ink guides omitted"></div>');
      }
    });

    var fullWidth = host.scrollWidth;

    if (state.guides.baseline) {
      parts.push('<div class="g-base" style="top:' + baselineY + "px;width:" + fullWidth +
        "px;opacity:" + Math.min(1, op * 1.4) + '"></div>');
    }
    // x-height and cap-height are drawn only when the probe is confirmed. When it is not,
    // they are omitted with a visible reason — never drawn from whatever answered.
    [["xheight", vm.xHeight, "x-height"], ["capheight", vm.capHeight, "cap-height"]].forEach(function (p) {
      if (!state.guides[p[0]]) return;
      if (p[1].confirmed) {
        var y = baselineY - (p[1].value / 1000 * size);
        parts.push('<div class="g-vmetric" style="top:' + y + "px;width:" + fullWidth +
          "px;opacity:" + op + '" title="' + p[2] + " " + p[1].value + '/1000em"></div>');
      }
    });

    // One shared ink centre across the row. Circles sit on the maths axis by design, so a
    // circle drawn from another face at a different axis height makes the row ragged at
    // identical advance. That raggedness is otherwise invisible.
    if (state.guides.centre) {
      var mids = rects.filter(function (c) { return !c.rec.diverges; })
        .map(function (c) { return c.rec.ink.ascent - (c.rec.ink.ascent + c.rec.ink.descent) / 2; });
      if (mids.length) {
        var avg = mids.reduce(function (a, b) { return a + b; }, 0) / mids.length;
        parts.push('<div class="g-rowmid" style="top:' + (baselineY - avg / 1000 * size) +
          "px;width:" + fullWidth + "px;opacity:" + op + '"></div>');
      }
    }

    layer.innerHTML = parts.join("");

    var vmNote = $("vmetric-note");
    var omitted = [];
    if (!vm.xHeight.confirmed) omitted.push("x-height");
    if (!vm.capHeight.confirmed) omitted.push("cap-height");
    vmNote.textContent = omitted.length
      ? omitted.join(" and ") + " not drawn: " + vm.xHeight.reason
      : "x-height " + vm.xHeight.value + ", cap-height " + vm.capHeight.value + " /1000em";
    vmNote.className = omitted.length ? "note warn" : "note";
  }

  // ---------------------------------------------------------------- ruler

  var MAX_LABEL_ROWS = 6;

  function renderRuler(sets) {
    var host = $("ruler");
    var domain = state.config.hue_domain;
    var rowHeight = 15;

    // Every group gets a tick at its true position. Labels are rationed: with several
    // hundred advance sets the stagger would otherwise run to a column hundreds of rows
    // deep, and every advance below the domain floor clamps to the same x, so they pile
    // up in one place. Labelling the largest groups first keeps the ruler about the
    // groups that carry glyphs.
    var ticks = sets.map(function (g) {
      return {
        advance: g.advance, count: g.count,
        pos: core.logPosition(g.advance, domain) * 100,
        clamped: core.isClamped(g.advance, domain),
        colour: core.colourFor(g.advance, domain),
      };
    });

    // Clamped groups are never labelled. They all sit at the same x by definition, so a
    // label there says nothing about position and simply consumes the budget — which is
    // exactly what it did on the first run: a column of pinned values at the left edge.
    // The count of them is reported in the note instead.
    var byWeight = ticks.filter(function (t) { return !t.clamped; }).sort(function (a, b) {
      return b.count - a.count || a.advance - b.advance;
    });

    var chosen = [], laid = null;
    for (var i = 0; i < byWeight.length; i++) {
      var trial = chosen.concat([byWeight[i]]);
      var attempt = core.staggerLabels(trial.map(function (t) {
        return { ref: t, pos: t.pos };
      }), 5);
      if (attempt.rows > MAX_LABEL_ROWS) continue;
      chosen = trial;
      laid = attempt;
    }
    if (!laid) laid = { placed: [], rows: 0 };

    host.style.height = (26 + Math.max(1, laid.rows) * rowHeight) + "px";
    host.innerHTML =
      ticks.map(function (t) {
        return '<div class="tick' + (t.clamped ? " clamped" : "") + '" style="left:' + t.pos +
          "%;background:" + t.colour + '" title="' + t.advance + " /1000em · " + t.count +
          " glyphs" + (t.clamped ? " · outside the hue domain" : "") + '"></div>';
      }).join("") +
      laid.placed.map(function (p) {
        var t = p.ref;
        var labelTop = 20 + p.row * rowHeight;
        return '<div class="leader" style="left:' + p.pos + "%;height:" + (labelTop - 18) +
            "px;background:" + t.colour + '"></div>' +
          '<div class="tlabel" style="left:' + p.pos + "%;top:" + labelTop + "px;color:" +
            t.colour + '">' + t.advance + "</div>";
      }).join("");

    var unlabelled = byWeight.length - laid.placed.length;
    var clamped = ticks.filter(function (t) { return t.clamped; }).length;
    $("ruler-note").textContent =
      ticks.length + " advance sets, " + laid.placed.length + " labelled" +
      (unlabelled > 0 ? " (the largest; " + unlabelled + " unlabelled, hover a tick)" : "") +
      (clamped > 0 ? " · " + clamped + " outside the " + domain.min + "–" + domain.max +
        " domain, pinned to an edge and left unlabelled" : "");
  }

  // ---------------------------------------------------------------- advance sets

  var MAX_SET_CARDS = 60;

  function renderAdvanceSets(sets) {
    var host = $("advance-sets");
    var domain = state.config.hue_domain;
    host.innerHTML = "";

    // Reading order stays by advance, matching the ruler. When there are more groups than
    // can be read, the ones kept are the ones carrying the most glyphs — a wall of
    // single-glyph groups is not what this block is for.
    var shown = sets;
    if (sets.length > MAX_SET_CARDS) {
      shown = sets.slice()
        .sort(function (a, b) { return b.count - a.count || a.advance - b.advance; })
        .slice(0, MAX_SET_CARDS)
        .sort(function (a, b) { return a.advance - b.advance; });
    }
    $("aset-note").textContent = (sets.length > MAX_SET_CARDS
      ? "showing the " + MAX_SET_CARDS + " largest of " + sets.length + " sets, in advance order"
      : sets.length + " distinct advance" + (sets.length === 1 ? "" : "s")) +
      " in " + state.family;

    shown.forEach(function (g) {
      var colour = core.colourFor(g.advance, domain);
      var card = document.createElement("div");
      card.className = "aset";
      // The hue makes colour mean identity, not quality. No green and red edges: `.solo`
      // and `.many` were the same judgement in colour, and there are no verdicts here.
      card.innerHTML = '<div class="swatch" style="background:' + colour + '"></div>' +
        '<div class="wbody"><div class="wadv"><b>' + g.advance + "</b> /1000em" +
        (core.isClamped(g.advance, domain) ? ' <span class="clamped">outside the hue domain</span>' : "") +
        '</div><div class="wglyphs" style="font-family:' + esc(core.cssFamily(state.family)) + '">' +
        g.members.slice(0, 60).map(function (r) { return esc(r.char); }).join("") +
        (g.members.length > 60 ? "…" : "") + "</div>" +
        '<div class="wcount">' + g.count + " glyph" + (g.count === 1 ? "" : "s") + "</div></div>";

      hover.attach(card, function () { return advanceSetInfo(g, colour); }, "wg" + g.advance);
      host.appendChild(card);
    });
  }

  function advanceSetInfo(g, colour) {
    var rows = g.members.slice(0, 40).map(function (r) {
      var d = state.index.get(r.hex);
      return "<tr><td class=\"g\">" + esc(r.char) + "</td><td>U+" + r.hex + "</td><td>" +
        esc(d ? d.name : "?") + "</td></tr>";
    }).join("");
    return '<div class="hi-title"><span class="swatch sm" style="background:' + colour +
      '"></span><b>' + g.advance + "</b> /1000em · " + g.count + " glyphs</div>" +
      '<table class="hi-table">' + rows + "</table>" +
      (g.members.length > 40 ? '<div class="note">first 40 of ' + g.members.length + "</div>" : "");
  }

  // ---------------------------------------------------------------- table

  function renderTable(result) {
    var host = $("glyph-rows");
    var domain = state.config.hue_domain;
    var frag = document.createDocumentFragment();

    result.records.forEach(function (r) {
      var d = state.index.get(r.hex) || {};
      var colour = core.colourFor(r.advance, domain);
      var tr = document.createElement("tr");
      var delta = r.shift != null && Math.abs(r.shift) >= 1
        ? '<span class="delta">' + (r.shift > 0 ? "+" : "") + r.shift + "</span>" : "";

      tr.innerHTML =
        '<td class="tag"><span class="rowtag" style="background:' + colour + '"></span></td>' +
        '<td class="g" style="font-family:' + esc(core.cssFamily(state.family)) + '">' + esc(r.char) + "</td>" +
        "<td class=\"cp\">U+" + r.hex + "</td>" +
        '<td class="eaw" title="East Asian Width (UAX #11)">' + esc(d.eaw || "—") + "</td>" +
        '<td class="adv"><b>' + r.advance + "</b>" + delta + "</td>" +
        '<td class="flag">' + flagCell(r) + "</td>" +
        '<td class="blk">' + (d.block_canonical ? identicon(d.block_canonical, 20) : "") + "</td>";

      hover.attach(tr, function () { return glyphInfo(r, d, colour); }, "row" + r.hex);
      frag.appendChild(tr);
    });
    host.replaceChildren(frag);

    $("table-note").textContent = result.records.length + " glyphs · advance is the DOM " +
      "measurement, which is what the page draws · delta shown only when the anchor changes it" +
      (result.notdefInformative ? "" :
        " · notdef flag suppressed: " + result.notdefSuppressedFor + " glyphs share the notdef " +
        "advance of " + result.notdefAdvance + ", so the test says nothing here");
  }

  function flagCell(r) {
    var out = [];
    if (r.notdefLike) {
      out.push('<span class="f f-notdef" title="This advance equals the advance of U+10FFFD, ' +
        'so the glyph is probably missing and drawn as notdef. A guess: a glyph legitimately ' +
        'sharing that advance reads the same way.">notdef?</span>');
    }
    if (r.diverges) {
      out.push('<span class="f f-diverge" title="Canvas and DOM disagree on this advance ' +
        '(canvas ' + r.canvasAdvance + '). They resolve font fallback separately. The DOM ' +
        'figure is the one shown, because it is what the page draws.">engines differ</span>');
    }
    return out.join(" ");
  }

  function glyphInfo(r, d, colour) {
    var guess = fontguess.identify({
      family: state.family, sizePx: state.sizePx, cp: r.cp, advance: r.advance,
    });
    var ev = guess.evidence.map(function (e) {
      return "<li><b>" + esc(e.source) + "</b> — " + (e.available ? "" : "unavailable: ") +
        esc(e.why || "") + "</li>";
    }).join("");

    return '<div class="hi-glyph" style="font-family:' + esc(core.cssFamily(state.family)) + '">' +
        esc(r.char) + "</div>" +
      '<div class="hi-title">U+' + r.hex + " · " + esc(d.name || "unnamed") + "</div>" +
      '<div class="hi-block">' + (d.block_canonical ? identicon(d.block_canonical, 24) : "") +
        "<div><b>" + esc(d.block || "") + "</b><br>" +
        // The official short alias is here for propagation: anyone using the tool learns
        // that an official abbreviation exists. The tool spreads the standard rather than
        // only consuming it.
        '<code>' + esc(d.block_short || "") + "</code> · <code>" + esc(d.block_canonical || "") +
        "</code></div></div>" +
      '<table class="hi-table">' +
        "<tr><td>General_Category</td><td>" + esc(d.gc || "—") + "</td></tr>" +
        "<tr><td>East_Asian_Width</td><td>" + esc(d.eaw || "—") + "</td></tr>" +
        "<tr><td>Bidi_Class</td><td>" + esc(d.bidi || "—") + "</td></tr>" +
        "<tr><td>Bidi_Mirrored</td><td>" + (d.mirrored ? "yes" : "no") + "</td></tr>" +
        "<tr><td>advance</td><td><b>" + r.advance + "</b> /1000em</td></tr>" +
        (r.shift == null ? "" :
          "<tr><td>beside anchor</td><td>" + r.advanceInRun + " (" +
          (r.shift > 0 ? "+" : "") + r.shift + ")</td></tr>") +
        "<tr><td>ink ascent / descent</td><td>" + r.ink.ascent + " / " + r.ink.descent + "</td></tr>" +
      "</table>" +
      '<div class="hi-guess"><div class="hi-guess-head">supplying font: <b>' +
        esc(guess.summary) + "</b></div><ul>" + ev + "</ul>" +
        '<div class="caveat">' + esc(guess.caveat) + "</div></div>";
  }

  // ---------------------------------------------------------------- blocks in use

  function renderBlocks(result) {
    var seen = new Map();
    result.records.forEach(function (r) {
      var d = state.index.get(r.hex);
      if (d && d.block_canonical && !seen.has(d.block_canonical)) seen.set(d.block_canonical, d);
    });
    var host = $("blocks-in-use");
    host.innerHTML = Array.from(seen.values()).map(function (d) {
      return '<div class="blk-item">' + identicon(d.block_canonical, 20) +
        "<div><b>" + esc(d.block) + "</b><br><code>" + esc(d.block_short) + "</code></div></div>";
    }).join("");
    $("blocks-count").textContent = seen.size + " block" + (seen.size === 1 ? "" : "s") + " in use";
  }

  // ---------------------------------------------------------------- refresh

  var pending = null;
  ui.refresh = function () {
    clearTimeout(pending);
    pending = setTimeout(ui.render, 60);
  };

  ui.render = function () {
    var t0 = performance.now();
    var cps = core.codepointsOf(state.text);
    var result = measure.run({
      family: state.family, sizePx: state.sizePx, anchor: state.anchor,
      codepoints: cps, hueDomain: state.config.hue_domain,
    });
    state.result = result;

    var sets = core.advanceSets(result.records);
    renderSpecimen(result);
    renderRuler(sets);
    renderAdvanceSets(sets);
    renderTable(result);
    renderBlocks(result);
    renderGroupToggles();

    var ms = Math.round(performance.now() - t0);
    $("envelope").textContent = JSON.stringify(result.envelope, null, 1);
    $("status").textContent = cps.length + " glyphs · " + sets.length + " advance sets · " +
      ms + "ms · data via " + state.dataPath +
      (state.dataGenerated ? " generated " + state.dataGenerated : "");
  };

  ui.state = state;
  if (typeof module === "object" && module.exports) module.exports = GH;
})(typeof globalThis !== "undefined" ? globalThis : this);
