// Hand-built SVG charts. No libraries.
// Every chart has a table view in the HTML, so no value depends on hovering.
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var C = {
    work: "#0A9396",      // categorical 1 (validated)
    learn: "#3D5A98",     // categorical 2 (validated)
    baseline: "#B4C0C9",  // neutral reference bar
    grid: "#E3E9EE",
    axis: "#8A9BA8",
    ink: "#10324B",
    muted: "#5B6F7E",
    surface: "#FFFFFF"
  };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, x, y, str, attrs) {
    var t = el("text", Object.assign({ x: x, y: y, fill: C.ink, "font-size": 13 }, attrs || {}), parent);
    t.textContent = str;
    return t;
  }
  // Rounded data-end only (square at the baseline)
  function barPath(x, y, w, h, r) {
    r = Math.min(r, h / 2, w);
    return "M" + x + " " + y + "H" + (x + w - r) + "Q" + (x + w) + " " + y + " " + (x + w) + " " + (y + r) +
      "V" + (y + h - r) + "Q" + (x + w) + " " + (y + h) + " " + (x + w - r) + " " + (y + h) + "H" + x + "Z";
  }

  // ---------- Tooltip ----------
  function makeTooltip(host) {
    var tip = document.createElement("div");
    tip.className = "chart-tip";
    tip.setAttribute("role", "status");
    tip.hidden = true;
    host.appendChild(tip);
    return {
      show: function (rows, title, x, y) {
        tip.replaceChildren();
        if (title) { var h = document.createElement("p"); h.className = "chart-tip-title"; h.textContent = title; tip.appendChild(h); }
        rows.forEach(function (r) {
          var p = document.createElement("p"); p.className = "chart-tip-row";
          var key = document.createElement("span"); key.className = "chart-tip-key"; key.style.background = r.color;
          var v = document.createElement("strong"); v.textContent = r.value;
          var l = document.createElement("span"); l.textContent = r.label;
          p.append(key, v, l); tip.appendChild(p);
        });
        tip.hidden = false;
        var hw = host.clientWidth, tw = tip.offsetWidth;
        tip.style.left = Math.max(4, Math.min(x + 14, hw - tw - 4)) + "px";
        tip.style.top = Math.max(4, y - tip.offsetHeight - 10) + "px";
      },
      hide: function () { tip.hidden = true; }
    };
  }
  function pointer(host, evt) {
    var b = host.getBoundingClientRect();
    if (evt.clientX === undefined || evt.type === "focus") {
      var t = evt.target.getBoundingClientRect();
      return { x: t.left - b.left + t.width / 2, y: t.top - b.top };
    }
    return { x: evt.clientX - b.left, y: evt.clientY - b.top };
  }
  function bindTip(node, host, tip, getContent) {
    node.setAttribute("tabindex", "0");
    function on(e) { var p = pointer(host, e), c = getContent(); tip.show(c.rows, c.title, p.x, p.y); node.classList.add("is-hover"); }
    function off() { tip.hide(); node.classList.remove("is-hover"); }
    node.addEventListener("pointermove", on);
    node.addEventListener("focus", on);
    node.addEventListener("pointerleave", off);
    node.addEventListener("blur", off);
  }

  // ---------- 1. Impact chart: before vs after, indexed to baseline 100 ----------
  var impact = [
    { label: "Cross-team dependencies and bottlenecks", org: "Dell EMC", after: 35, better: "lower" },
    { label: "Dependency-related issues", org: "Dell EMC", after: 60, better: "lower" },
    { label: "UAT-to-development handoff delays", org: "J.P. Morgan", after: 70, better: "lower" },
    { label: "Defect detection", org: "Dell EMC", after: 125, better: "higher" },
    { label: "Conference planning efficiency", org: "IEEE conference", after: 125, better: "higher" }
  ];

  function drawImpact(host) {
    var svgHost = host.querySelector(".chart-svg");
    var w = svgHost.clientWidth;
    var narrow = w < 560;
    var labelW = narrow ? 0 : 320;
    var rowH = narrow ? 82 : 62, barH = 14, gap = 2;
    var top = 8, right = 48;
    var h = top + impact.length * rowH;
    var plotW = w - labelW - right;
    var x = function (v) { return labelW + (v / 130) * plotW; };

    svgHost.replaceChildren();
    var svg = el("svg", { viewBox: "0 0 " + w + " " + (h + 28), width: w, height: h + 28, role: "img",
      "aria-label": "Before and after comparison of five delivery metrics, baseline indexed to 100" }, svgHost);

    // gridlines + axis
    [0, 50, 100].forEach(function (v) {
      el("line", { x1: x(v), x2: x(v), y1: top - 4, y2: h, stroke: v === 100 ? C.axis : C.grid, "stroke-dasharray": v === 100 ? "3 3" : "" }, svg);
      text(svg, x(v), h + 18, v === 100 ? "100 = baseline" : String(v), { "text-anchor": v === 100 ? "middle" : "middle", "font-size": 11.5, fill: C.muted });
    });

    var tip = host._tip || (host._tip = makeTooltip(host));
    impact.forEach(function (d, i) {
      var y0 = top + i * rowH;
      var by = narrow ? y0 + 34 : y0 + 12;
      if (narrow) {
        text(svg, 0, y0 + 14, d.label, { "font-weight": 600, "font-size": 13 });
        text(svg, 0, y0 + 29, d.org + ", " + d.better + " is better", { "font-size": 11.5, fill: C.muted });
      } else {
        text(svg, 0, by + 10, d.label, { "font-weight": 600, "font-size": 13 });
        text(svg, 0, by + 27, d.org + ", " + d.better + " is better", { "font-size": 11.5, fill: C.muted });
      }
      var change = d.after - 100;
      var changeStr = (change > 0 ? "+" : "") + change + "%";

      var g = el("g", { class: "impact-row" }, svg);
      el("path", { d: barPath(x(0), by, x(100) - x(0), barH, 4), fill: C.baseline }, g);
      var after = el("path", { class: "impact-after", d: barPath(x(0), by + barH + gap, x(d.after) - x(0), barH, 4), fill: C.work }, g);
      if (!reduceMotion) { after.style.transformOrigin = x(0) + "px 0"; after.style.setProperty("--d", (i * 90) + "ms"); }
      text(g, x(d.after) + 8, by + barH + gap + 11, changeStr, { "font-size": 12.5, "font-weight": 600 });
      // hit area bigger than the marks
      var hit = el("rect", { x: x(0), y: by - 4, width: plotW, height: barH * 2 + gap + 8, fill: "transparent", class: "hit" }, g);
      hit.setAttribute("aria-label", d.label + ": baseline 100, after " + d.after + " (" + changeStr + ")");
      bindTip(hit, host, tip, function () {
        return { title: d.label, rows: [
          { color: C.baseline, value: "100", label: "Before (baseline)" },
          { color: C.work, value: String(d.after), label: "After, " + changeStr }
        ] };
      });
    });
    return svg;
  }

  // ---------- 2. Career so far: selectable Gantt (dates to scale) ----------
  // Each row's key matches an <li data-key> in .career-details, which holds the details.
  var career = [
    { key: "dell", label: "Dell EMC R&D", start: "2017-08", end: "2021-09", kind: "work" },
    { key: "jpmc", label: "J.P. Morgan Chase", start: "2021-09", end: "2023-10", kind: "work" },
    { key: "meng", label: "M.Eng., Emden, Germany", start: "2023-10", end: "2025-10", kind: "learn" },
    { key: "ieee", label: "IEEE conference", start: "2025-01", end: "2025-05", kind: "work" },
    { key: "dnx", label: "Digital Nexus AI", start: "2026-03", end: "2026-09", kind: "work" },
    { key: "amazon", label: "Amazon", start: "2026-09", end: "present", kind: "work" }
  ];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var NOW = new Date();
  function ym(s) {
    if (s === "present") return NOW.getFullYear() + NOW.getMonth() / 12;
    return Number(s.slice(0, 4)) + (Number(s.slice(5, 7)) - 1) / 12;
  }
  function fmt(s) { return s === "present" ? "present" : MONTHS[Number(s.slice(5, 7)) - 1] + " " + s.slice(0, 4); }
  var selectedKey = "dell";

  function selectCareer(key, host) {
    selectedKey = key;
    document.querySelectorAll(".career-item").forEach(function (li) {
      li.classList.toggle("is-selected", li.dataset.key === key);
    });
    host.querySelectorAll(".gantt-row").forEach(function (g) {
      var on = g.dataset.key === key;
      g.classList.toggle("is-selected", on);
      g.querySelector(".hit").setAttribute("aria-pressed", String(on));
    });
  }

  function drawCareer(host) {
    var svgHost = host.querySelector(".chart-svg");
    var w = svgHost.clientWidth;
    if (!w) return false;
    var narrow = w < 480;
    var labelW = narrow ? 0 : 170, right = 12, rowH = narrow ? 52 : 46, top = 28;
    var h = top + career.length * rowH;
    var x0 = 2017, x1 = 2027;
    var x = function (v) { return labelW + (v - x0) / (x1 - x0) * (w - labelW - right); };

    var section = document.getElementById("career");
    if (section) section.classList.add("js-career");

    svgHost.replaceChildren();
    var svg = el("svg", { viewBox: "0 0 " + w + " " + (h + 4), width: w, height: h + 4,
      "aria-label": "Career timeline from 2017 to 2026. Select a row to show its details.", role: "group" }, svgHost);
    for (var yr = x0; yr <= x1; yr++) {
      if (w < 640 && yr % 2) continue;
      el("line", { x1: x(yr), x2: x(yr), y1: top - 6, y2: h, stroke: C.grid }, svg);
      text(svg, x(yr), top - 12, String(yr), { "text-anchor": "middle", "font-size": 11.5, fill: C.muted });
    }
    career.forEach(function (d, i) {
      var cy = top + i * rowH + (narrow ? 36 : rowH / 2);
      var color = d.kind === "work" ? C.work : C.learn;
      var g = el("g", { class: "gantt-row", "data-key": d.key }, svg);
      el("rect", { x: 0, y: cy - rowH / 2 + (narrow ? -8 : 0), width: w, height: rowH, rx: 6, class: "gantt-band" }, g);
      if (narrow) text(g, 4, cy - 14, d.label, { "font-weight": 600, "font-size": 12.5, class: "gantt-label" });
      else text(g, 8, cy + 4, d.label, { "font-weight": 600, "font-size": 13, class: "gantt-label" });
      var bx = x(ym(d.start)), bw = Math.max(8, x(ym(d.end)) - bx);
      el("rect", { x: bx, y: cy - 8, width: bw, height: 16, rx: 4, fill: color, class: "gantt-bar" }, g);
      var when = fmt(d.start) + " to " + fmt(d.end);
      var hit = el("rect", { x: 0, y: cy - rowH / 2 + (narrow ? -8 : 0), width: w, height: rowH, fill: "transparent", class: "hit",
        role: "button", tabindex: 0, "aria-label": d.label + ", " + when + ". Show details." }, g);
      hit.addEventListener("click", function () { selectCareer(d.key, host); });
      hit.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectCareer(d.key, host); }
      });
    });
    selectCareer(selectedKey, host);
  }

  // ---------- 3. Example burndown (sample data, labelled as such) ----------
  var burn = { days: 10, scope: 40, actual: [40, 38, 36, 35, 31, 30, 27, 21, 15, 9, 3] };

  function drawBurndown(host) {
    var svgHost = host.querySelector(".chart-svg");
    var w = svgHost.clientWidth, h = 220, left = 36, right = 16, top = 12, bottom = 30;
    if (!w) return false;
    var x = function (d) { return left + d / burn.days * (w - left - right); };
    var y = function (v) { return top + (1 - v / burn.scope) * (h - top - bottom); };

    svgHost.replaceChildren();
    var svg = el("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, role: "img",
      "aria-label": "Example sprint burndown, ideal versus actual story points remaining" }, svgHost);
    [0, 10, 20, 30, 40].forEach(function (v) {
      el("line", { x1: left, x2: w - right, y1: y(v), y2: y(v), stroke: v === 0 ? C.axis : C.grid }, svg);
      text(svg, left - 8, y(v) + 4, String(v), { "text-anchor": "end", "font-size": 11, fill: C.muted });
    });
    for (var d = 0; d <= burn.days; d += 2) text(svg, x(d), h - 10, "Day " + d, { "text-anchor": "middle", "font-size": 11, fill: C.muted });

    el("line", { x1: x(0), y1: y(burn.scope), x2: x(burn.days), y2: y(0), stroke: C.axis, "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
    var pts = burn.actual.map(function (v, i) { return x(i) + "," + y(v); }).join(" ");
    var line = el("polyline", { points: pts, fill: "none", stroke: C.work, "stroke-width": 2, "stroke-linejoin": "round", class: "burn-line" }, svg);
    if (!reduceMotion) { var len = 2000; line.style.strokeDasharray = len; line.style.strokeDashoffset = len; }
    text(svg, x(6) + 8, y(burn.actual[6]) - 10, "Actual", { "font-size": 12, "font-weight": 600 });
    text(svg, x(3), y(burn.scope * (1 - 3 / burn.days)) + 20, "Ideal", { "font-size": 12, fill: C.muted });

    // crosshair
    var cross = el("line", { y1: top, y2: h - bottom, stroke: C.ink, "stroke-width": 1, opacity: 0 }, svg);
    var dot = el("circle", { r: 5, fill: C.work, stroke: C.surface, "stroke-width": 2, opacity: 0 }, svg);
    var tip = host._tip || (host._tip = makeTooltip(host));
    var overlay = el("rect", { x: left, y: top, width: w - left - right, height: h - top - bottom, fill: "transparent", tabindex: 0,
      "aria-label": "Burndown chart. Use left and right arrow keys to step through days." }, svg);
    var cur = 0;
    function showDay(day, px, py) {
      cur = day;
      var ideal = Math.round(burn.scope * (1 - day / burn.days));
      cross.setAttribute("x1", x(day)); cross.setAttribute("x2", x(day)); cross.setAttribute("opacity", 0.35);
      dot.setAttribute("cx", x(day)); dot.setAttribute("cy", y(burn.actual[day])); dot.setAttribute("opacity", 1);
      tip.show([
        { color: C.work, value: burn.actual[day] + " pts", label: "Actual remaining" },
        { color: C.axis, value: ideal + " pts", label: "Ideal remaining" }
      ], "Day " + day, px === undefined ? x(day) : px, py === undefined ? y(burn.actual[day]) : py);
    }
    function hide() { tip.hide(); cross.setAttribute("opacity", 0); dot.setAttribute("opacity", 0); }
    overlay.addEventListener("pointermove", function (e) {
      var p = pointer(host, e);
      var svgX = (e.clientX - svg.getBoundingClientRect().left);
      var day = Math.max(0, Math.min(burn.days, Math.round((svgX - left) / (w - left - right) * burn.days)));
      showDay(day, p.x, p.y);
    });
    overlay.addEventListener("pointerleave", hide);
    overlay.addEventListener("blur", hide);
    overlay.addEventListener("focus", function () { showDay(cur); });
    overlay.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { showDay(Math.min(burn.days, cur + 1)); e.preventDefault(); }
      if (e.key === "ArrowLeft") { showDay(Math.max(0, cur - 1)); e.preventDefault(); }
    });
  }

  // ---------- 4. KPI mini charts (sample data, labelled as such) ----------
  var SPRINTS = ["S1", "S2", "S3", "S4", "S5", "S6"];
  var kpiData = {
    velocity:   { type: "bar",  values: [32, 35, 30, 38, 36, 39], max: 45, unit: " pts", avg: true },
    commitment: { type: "line", values: [78, 85, 80, 92, 88, 94], min: 60, max: 100, unit: "%", target: 85, targetLabel: "Target 85%" },
    cycle:      { type: "line", values: [6.5, 6.0, 7.2, 5.4, 4.8, 4.5], min: 0, max: 8, unit: " days", target: 5, targetLabel: "Target ≤ 5 days" },
    defects:    { type: "bar",  values: [7, 5, 6, 3, 2, 2], max: 8, unit: "", target: 3, targetLabel: "Limit 3" }
  };

  function drawKpi(host) {
    var cfg = kpiData[host.closest(".kpi").dataset.kpi];
    var svgHost = host.querySelector(".chart-svg");
    var w = svgHost.clientWidth;
    if (!w) return false;
    var h = 132, left = 4, right = 4, top = 16, bottom = 22;
    var min = cfg.min || 0, n = cfg.values.length;
    var band = (w - left - right) / n;
    var y = function (v) { return top + (1 - (v - min) / (cfg.max - min)) * (h - top - bottom); };
    var cx = function (i) { return left + band * i + band / 2; };

    svgHost.replaceChildren();
    var svg = el("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, role: "img",
      "aria-label": "Sample data over six sprints: " + cfg.values.join(", ") }, svgHost);
    el("line", { x1: left, x2: w - right, y1: y(min), y2: y(min), stroke: C.axis }, svg);
    SPRINTS.forEach(function (s, i) { text(svg, cx(i), h - 6, s, { "text-anchor": "middle", "font-size": 11, fill: C.muted }); });

    var ref = cfg.target;
    var refLabel = cfg.targetLabel;
    if (cfg.avg) {
      var last3 = cfg.values.slice(-3);
      ref = Math.round(last3.reduce(function (a, b) { return a + b; }, 0) / 3);
      refLabel = "3-sprint average, " + ref + " pts";
    }
    el("line", { x1: left, x2: w - right, y1: y(ref), y2: y(ref), stroke: C.axis, "stroke-width": 1.5, "stroke-dasharray": "4 4" }, svg);
    var refEl = host.parentNode.querySelector(".kpi-ref");
    if (!refEl) {
      refEl = document.createElement("p");
      refEl.className = "kpi-ref";
      host.parentNode.insertBefore(refEl, host.nextSibling);
    }
    refEl.replaceChildren(document.createElement("i"), document.createTextNode(refLabel));

    var tip = host._tip || (host._tip = makeTooltip(host));
    var marks = [];
    if (cfg.type === "bar") {
      var bw = Math.min(28, band * 0.56);
      cfg.values.forEach(function (v, i) {
        var bar = el("path", { d: "M" + (cx(i) - bw / 2) + " " + y(min) + "V" + (y(v) + 4) + "Q" + (cx(i) - bw / 2) + " " + y(v) + " " + (cx(i) - bw / 2 + 4) + " " + y(v) +
          "H" + (cx(i) + bw / 2 - 4) + "Q" + (cx(i) + bw / 2) + " " + y(v) + " " + (cx(i) + bw / 2) + " " + (y(v) + 4) + "V" + y(min) + "Z",
          fill: C.work, class: "kpi-mark" }, svg);
        marks.push(bar);
      });
    } else {
      el("polyline", { points: cfg.values.map(function (v, i) { return cx(i) + "," + y(v); }).join(" "),
        fill: "none", stroke: C.work, "stroke-width": 2, "stroke-linejoin": "round" }, svg);
      cfg.values.forEach(function (v, i) {
        marks.push(el("circle", { cx: cx(i), cy: y(v), r: 4, fill: C.work, stroke: C.surface, "stroke-width": 2, class: "kpi-mark" }, svg));
      });
    }

    cfg.values.forEach(function (v, i) {
      var hit = el("rect", { x: left + band * i, y: top - 8, width: band, height: h - top - bottom + 8, fill: "transparent", class: "hit",
        "aria-label": SPRINTS[i] + ": " + v + cfg.unit }, svg);
      bindTip(hit, host, tip, function () {
        return { title: "Sprint " + (i + 1), rows: [{ color: C.work, value: v + cfg.unit, label: host.closest(".kpi").querySelector("h4").textContent }] };
      });
      hit.addEventListener("pointerenter", function () { marks[i].classList.add("is-hover"); });
      hit.addEventListener("pointerleave", function () { marks[i].classList.remove("is-hover"); });
    });
  }

  // ---------- Mount, animate on first view, redraw on resize / tab change ----------
  var charts = [
    { id: "impact-chart", draw: drawImpact },
    { id: "career-chart", draw: drawCareer },
    { id: "burndown-chart", draw: drawBurndown }
  ].map(function (c) { c.host = document.getElementById(c.id); return c; }).filter(function (c) { return c.host; });
  document.querySelectorAll(".kpi-chart").forEach(function (hostEl) { charts.push({ host: hostEl, draw: drawKpi }); });

  function drawAll() { charts.forEach(function (c) { c.draw(c.host); }); }
  drawAll();

  document.addEventListener("panel:shown", function (e) {
    charts.forEach(function (c) { if (e.detail.contains(c.host)) c.draw(c.host); });
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    charts.forEach(function (c) { io.observe(c.host); });
  } else {
    charts.forEach(function (c) { c.host.classList.add("is-visible"); });
  }

  var lastW = window.innerWidth, timer;
  window.addEventListener("resize", function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(timer);
    timer = setTimeout(drawAll, 150);
  });

  // ---------- Count-up for case-study figures ----------
  var figures = document.querySelectorAll(".case-figure");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        fio.unobserve(e.target);
        var node = e.target, final = node.textContent, m = final.match(/^(\d+)(.*)$/);
        if (!m) return;
        var target = Number(m[1]), suffix = m[2], t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / 900), eased = 1 - Math.pow(1 - p, 3);
          node.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step); else node.textContent = final;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    figures.forEach(function (f) { fio.observe(f); });
  }
})();
