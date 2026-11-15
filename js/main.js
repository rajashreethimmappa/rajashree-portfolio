// Small, dependency-free enhancements. The page works fully without JavaScript.
(function () {
  "use strict";

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Mobile menu ----------
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Menu";
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && links.classList.contains("is-open")) toggle.click();
    });
  }

  // ---------- Copy email ----------
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.dataset.copy;
      var done = function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, function () { window.location.href = "mailto:" + value; });
      } else {
        window.location.href = "mailto:" + value;
      }
    });
  });

  // ---------- Certificate links: hide until a real link is added ----------
  document.querySelectorAll(".cert-link").forEach(function (a) {
    if (a.getAttribute("href").indexOf("REPLACE_") === 0) a.hidden = true;
  });

  // ---------- Case study filters ----------
  var filters = document.querySelectorAll(".filter");
  var cases = document.querySelectorAll(".case");
  var empty = document.querySelector(".filter-empty");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tag = btn.dataset.filter;
      var shown = 0;
      filters.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      cases.forEach(function (c) {
        var match = tag === "all" || c.dataset.tags.split(" ").indexOf(tag) !== -1;
        c.hidden = !match;
        if (match) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    });
  });

  // ---------- Tabs (WAI-ARIA tabs pattern) ----------
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !on;
      if (on) document.dispatchEvent(new CustomEvent("panel:shown", { detail: panel }));
    });
    if (focus) tab.focus();
  }
  if (tabs.length) {
    document.querySelector(".toolkit").classList.add("has-tabs");
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { selectTab(t); });
      t.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); selectTab(next, true); }
      });
    });
    selectTab(tabs[0]);
  }

  // ---------- Risk matrix (probability × impact) built from the table ----------
  var matrix = document.getElementById("risk-matrix");
  var rows = document.querySelectorAll("#risk-table tbody tr");
  if (matrix && rows.length) {
    var band = function (s) { return s >= 15 ? "high" : s >= 8 ? "med" : "low"; };
    var cells = {};
    // y-axis label
    var yLab = document.createElement("span");
    yLab.className = "rm-axis rm-axis-y";
    yLab.textContent = "Probability";
    matrix.appendChild(yLab);
    for (var p = 5; p >= 1; p--) {
      var tick = document.createElement("span");
      tick.className = "rm-tick";
      tick.textContent = String(p);
      matrix.appendChild(tick);
      for (var i = 1; i <= 5; i++) {
        var cell = document.createElement("div");
        cell.className = "rm-cell band-" + band(p * i);
        matrix.appendChild(cell);
        cells[p + "-" + i] = cell;
      }
    }
    for (var k = 0; k < 2; k++) {
      var corner = document.createElement("span");
      corner.className = "rm-tick";
      matrix.appendChild(corner);
    }
    for (var j = 1; j <= 5; j++) {
      var xt = document.createElement("span");
      xt.className = "rm-tick rm-tick-x";
      xt.textContent = String(j);
      matrix.appendChild(xt);
    }
    var xLab = document.createElement("span");
    xLab.className = "rm-axis rm-axis-x";
    xLab.textContent = "Impact";
    matrix.appendChild(xLab);

    rows.forEach(function (row) {
      var id = row.dataset.risk;
      var chip = document.createElement("span");
      chip.className = "rm-chip";
      chip.textContent = id;
      chip.dataset.risk = id;
      cells[row.dataset.p + "-" + row.dataset.i].appendChild(chip);

      function on() {
        row.classList.add("is-hover");
        chip.classList.add("is-hover");
      }
      function off() {
        row.classList.remove("is-hover");
        chip.classList.remove("is-hover");
      }
      row.tabIndex = 0;
      row.addEventListener("pointerenter", on);
      row.addEventListener("pointerleave", off);
      row.addEventListener("focus", on);
      row.addEventListener("blur", off);
      chip.addEventListener("pointerenter", on);
      chip.addEventListener("pointerleave", off);
    });
  }

  // ---------- Highlight the nav link for the section in view ----------
  var navLinks = document.querySelectorAll(".nav-links a");
  if ("IntersectionObserver" in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove("is-current"); });
        var link = byId[entry.target.id];
        if (link) link.classList.add("is-current");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }
})();
