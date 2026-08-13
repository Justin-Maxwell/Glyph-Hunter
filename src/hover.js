// The hover contract. ROADMAP.md set 8 defines `hover` as a term, so this is one
// component used everywhere the word appears — specimen glyph, width-group card, table
// row, block strip.
//
//   opens on a delay, not instantly      autocloses after a period outside
//   carries a close button               Escape closes it
//   tap opens it on mobile               tap outside closes it, as well as the button

(function (root) {
  "use strict";

  var GH = root.GH || (root.GH = {});
  var hover = GH.hover = {};

  var OPEN_DELAY = 350;
  var CLOSE_DELAY = 600;

  var el = null, openTimer = null, closeTimer = null, currentKey = null;

  function panel() {
    if (el) return el;
    el = document.createElement("div");
    el.className = "gh-hover";
    el.setAttribute("role", "dialog");
    el.hidden = true;
    el.innerHTML = '<button class="gh-hover-close" type="button" aria-label="Close">×</button>' +
                   '<div class="gh-hover-body"></div>';
    el.querySelector(".gh-hover-close").addEventListener("click", function (e) {
      e.stopPropagation();
      hover.close();
    });
    el.addEventListener("pointerenter", function () { clearTimeout(closeTimer); });
    el.addEventListener("pointerleave", scheduleClose);
    document.body.appendChild(el);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") hover.close();
    });
    // Tap outside closes, as well as the close button.
    document.addEventListener("pointerdown", function (e) {
      if (el.hidden) return;
      if (el.contains(e.target)) return;
      if (e.target.closest && e.target.closest("[data-hover]")) return;
      hover.close();
    });
    return el;
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(hover.close, CLOSE_DELAY);
  }

  function place(anchorEl) {
    var p = panel();
    var r = anchorEl.getBoundingClientRect();
    p.hidden = false;
    var pr = p.getBoundingClientRect();
    var top = r.bottom + 8 + window.scrollY;
    var left = r.left + window.scrollX;
    // Keep it on screen without needing a positioning library.
    if (left + pr.width > window.scrollX + document.documentElement.clientWidth - 8) {
      left = window.scrollX + document.documentElement.clientWidth - pr.width - 8;
    }
    if (left < 8) left = 8;
    if (r.bottom + pr.height + 16 > document.documentElement.clientHeight && r.top > pr.height) {
      top = r.top - pr.height - 8 + window.scrollY;
    }
    p.style.top = top + "px";
    p.style.left = left + "px";
  }

  hover.open = function (anchorEl, html, key) {
    var p = panel();
    currentKey = key == null ? anchorEl : key;
    p.querySelector(".gh-hover-body").innerHTML = html;
    place(anchorEl);
  };

  hover.close = function () {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    if (el) el.hidden = true;
    currentKey = null;
  };

  hover.isOpenFor = function (key) { return currentKey === key && el && !el.hidden; };

  // Wire an element. `content` is called lazily, so a heavy info box costs nothing until
  // it is actually wanted.
  hover.attach = function (target, content, key) {
    target.setAttribute("data-hover", "");
    target.tabIndex = target.tabIndex >= 0 ? target.tabIndex : 0;

    target.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "touch") return;   // touch is handled by the tap path
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      openTimer = setTimeout(function () { hover.open(target, content(), key); }, OPEN_DELAY);
    });
    target.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "touch") return;
      clearTimeout(openTimer);
      scheduleClose();
    });
    // Tap opens on mobile, and toggles so a second tap dismisses.
    target.addEventListener("click", function () {
      if (hover.isOpenFor(key == null ? target : key)) { hover.close(); return; }
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      hover.open(target, content(), key);
    });
    target.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        hover.open(target, content(), key);
      }
    });
  };

  if (typeof module === "object" && module.exports) module.exports = GH;
})(typeof globalThis !== "undefined" ? globalThis : this);
