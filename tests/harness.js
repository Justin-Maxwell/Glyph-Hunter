// Minimal test harness. Runs in a browser, because that is where the thing under test
// runs and there is no build step to introduce.
//
// Results land in #results as text and in window.__RESULTS__ as data, so a headless run
// can read either. Exit status comes from the summary line.

(function (root) {
  "use strict";

  var suites = [];
  var current = null;

  root.suite = function (name, fn) {
    current = { name: name, tests: [] };
    suites.push(current);
    fn();
    current = null;
  };

  root.test = function (name, fn) {
    current.tests.push({ name: name, fn: fn });
  };

  function fail(msg) { var e = new Error(msg); e.assertion = true; throw e; }

  root.assert = {
    ok: function (v, msg) { if (!v) fail(msg || "expected truthy, got " + v); },
    equal: function (a, b, msg) {
      if (a !== b) fail((msg ? msg + ": " : "") + "expected " + JSON.stringify(b) + ", got " + JSON.stringify(a));
    },
    close: function (a, b, tol, msg) {
      if (!(Math.abs(a - b) <= tol)) {
        fail((msg ? msg + ": " : "") + "expected " + b + " ±" + tol + ", got " + a);
      }
    },
    deep: function (a, b, msg) {
      var x = JSON.stringify(a), y = JSON.stringify(b);
      if (x !== y) fail((msg ? msg + ": " : "") + "expected " + y + ", got " + x);
    },
    throws: function (fn, msg) {
      try { fn(); } catch (e) { return; }
      fail(msg || "expected a throw");
    },
  };

  root.runAll = async function () {
    var results = [], passed = 0, failed = 0;
    for (var s = 0; s < suites.length; s++) {
      var suite = suites[s];
      for (var t = 0; t < suite.tests.length; t++) {
        var tc = suite.tests[t];
        var rec = { suite: suite.name, test: tc.name, ok: true, error: null };
        try {
          await tc.fn();
          passed++;
        } catch (e) {
          rec.ok = false;
          rec.error = e && e.message ? e.message : String(e);
          if (e && !e.assertion && e.stack) rec.stack = e.stack.split("\n").slice(0, 3).join(" | ");
          failed++;
        }
        results.push(rec);
      }
    }
    var lines = results.map(function (r) {
      return (r.ok ? "  pass  " : "  FAIL  ") + r.suite + " :: " + r.test +
        (r.ok ? "" : "\n          " + r.error + (r.stack ? "\n          " + r.stack : ""));
    });
    var summary = (failed === 0 ? "ALL PASS" : "FAILURES") + "  " + passed + " passed, " + failed + " failed";
    root.__RESULTS__ = { passed: passed, failed: failed, results: results };
    var el = document.getElementById("results");
    if (el) el.textContent = lines.join("\n") + "\n\n" + summary;
    return root.__RESULTS__;
  };
})(window);
