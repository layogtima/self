/* political.design — shared behaviour. Classic script, no modules: works on file:// too. */
(function () {
  "use strict";

  var root = document.documentElement;
  var slug = root.getAttribute("data-slug") || "";
  var base = slug ? "../../" : "";
  var M = window.MOVEMENTS || [];
  var idx = -1;
  for (var i = 0; i < M.length; i++) { if (M[i].slug === slug) { idx = i; } }
  var current = idx > -1 ? M[idx] : null;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (html != null) { n.innerHTML = html; }
    return n;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function href(m) { return base + "m/" + m.slug + "/"; }

  /* ---------------- progress bar ---------------- */
  var bar = el("div", "progress");
  document.body.appendChild(bar);

  /* ---------------- nav ---------------- */
  var nav = el("header", "site-nav");
  nav.innerHTML =
    '<a class="site-nav__mark" href="' + base + 'index.html">POLITICAL<span>.</span>DESIGN</a>' +
    '<span class="site-nav__here">' + (current ? esc(current.short) + " &nbsp;·&nbsp; " + esc(current.years) : "The Atlas") + "</span>" +
    '<button class="site-nav__btn" type="button" aria-haspopup="dialog" aria-expanded="false">Index<span aria-hidden="true"> ↗</span></button>';
  document.body.insertBefore(nav, document.body.firstChild);
  var navBtn = nav.querySelector("button");

  /* ---------------- index overlay ---------------- */
  var ov = el("div", "atlas-overlay");
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", "Index of movements");
  var rows = M.map(function (m, n) {
    var num = (n + 1) < 10 ? "0" + (n + 1) : String(n + 1);
    return '<li><a href="' + href(m) + '"' + (m.slug === slug ? ' aria-current="page"' : "") + ">" +
      '<span class="n">' + num + "</span>" +
      '<span class="t"><span class="dot" style="background:' + m.accent + '"></span>' + esc(m.title) +
      "<i>" + esc(m.place) + " — " + esc(m.blurb.split(".")[0]) + ".</i></span>" +
      '<span class="y">' + esc(m.years) + "</span></a></li>";
  }).join("");
  ov.innerHTML =
    '<button class="atlas-overlay__close" type="button">Close ✕</button>' +
    '<ul class="atlas-list">' + rows + "</ul>";
  document.body.appendChild(ov);
  var ovClose = ov.querySelector(".atlas-overlay__close");

  function setOverlay(open) {
    ov.setAttribute("data-open", open ? "true" : "false");
    navBtn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { ovClose.focus(); } else { navBtn.focus(); }
  }
  navBtn.addEventListener("click", function () { setOverlay(ov.getAttribute("data-open") !== "true"); });
  ovClose.addEventListener("click", function () { setOverlay(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && ov.getAttribute("data-open") === "true") { setOverlay(false); }
  });

  /* ---------------- pagination + footer ---------------- */
  var mount = document.querySelector('[data-site="foot"]');
  if (!mount) { mount = el("div"); document.body.appendChild(mount); }

  if (current) {
    var prev = idx > 0 ? M[idx - 1] : null;
    var next = idx < M.length - 1 ? M[idx + 1] : null;
    var pag = el("nav", "pagination");
    pag.setAttribute("aria-label", "Movements");
    var html = "";
    if (prev) {
      html += '<a href="' + href(prev) + '" style="--pg-accent:' + prev.accent + '">' +
        "<small>← Previous · " + esc(prev.years.split("–")[0]) + "</small><strong>" + esc(prev.title) + "</strong></a>";
    }
    if (next) {
      html += '<a href="' + href(next) + '" style="--pg-accent:' + next.accent + '">' +
        "<small>Next · " + esc(next.years.split("–")[0]) + " →</small><strong>" + esc(next.title) + "</strong></a>";
    }
    pag.innerHTML = html;
    mount.appendChild(pag);
  }

  var foot = el("footer", "site-foot");
  foot.innerHTML =
    '<span>POLITICAL.DESIGN — an atlas of how movements looked</span>' +
    '<span>Recreations are drawn in code, not reproduced. <a href="' + base + 'index.html#ethics">On method →</a></span>' +
    '<span>By <a href="https://layogtima.com">Amit</a></span>';
  mount.appendChild(foot);

  /* ---------------- scroll behaviour ---------------- */
  var lastY = window.scrollY;
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    nav.setAttribute("data-hidden", y > 400 && y > lastY ? "true" : "false");
    lastY = y;
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------------- reveals ---------------- */
  var targets = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (var j = 0; j < targets.length; j++) { targets[j].classList.add("is-in"); }
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
    for (var k = 0; k < targets.length; k++) { io.observe(targets[k]); }
  }

  /* ---------------- lineage helper ----------------
     <div class="lineage" data-lineage="panthers,constructivism"></div>
     renders cross-links straight from MOVEMENTS. The "why" comes from
     data-why="reason one|reason two" in matching order.                   */
  var lineages = document.querySelectorAll("[data-lineage]");
  for (var L = 0; L < lineages.length; L++) {
    (function (box) {
      var slugs = box.getAttribute("data-lineage").split(",");
      var whys = (box.getAttribute("data-why") || "").split("|");
      box.innerHTML = slugs.map(function (s, n) {
        var m = window.getMovement(s.trim());
        if (!m) { return ""; }
        return '<a href="' + href(m) + '" style="--lin-accent:' + m.accent + '">' +
          '<span class="lineage-yr">' + esc(m.years) + " · " + esc(m.place) + "</span>" +
          '<span class="lineage-name">' + esc(m.title) + "</span>" +
          '<span class="lineage-why">' + esc(whys[n] || m.blurb.split(".")[0] + ".") + "</span></a>";
      }).join("");
    })(lineages[L]);
  }
})();
