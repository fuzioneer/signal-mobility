/* Signal Mobility app: tests, scoring, routines, guided player, history, export. Data stays on this phone. */
(function () {
  "use strict";
  /* Bump on every release, and keep sw.js VER in step. */
  var APP_VERSION = "1.15.0", APP_BUILD = "12 Nov 2026";
  var D = window.SMDATA, ZONES = D.ZONES, TESTS = D.TESTS, ST = D.STRETCH, BY = D.BY, PRESETS = D.PRESETS;
  var ZN = {}; ZONES.forEach(function (z) { ZN[z[0]] = z[1]; });
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var isNum = function (x) { return typeof x === "number" && isFinite(x); };
  var avg = function (a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; };
  var zc = function (z) { return "var(--z-" + z + ")"; };
  var ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4.5" height="16" rx="1.2"/><rect x="13.5" y="4" width="4.5" height="16" rx="1.2"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5l9 7-9 7z"/><path d="M19 5v14"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5l-9 7 9 7z"/><path d="M5 5v14"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6a8 8 0 0 1 0 12"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
    musicOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/><path d="M3 3l18 18"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 5M22 9l-5 5"/></svg>'
  };

  /* ---------- storage ---------- */
  var KEY = "signal-mobility-v1";
  function blank() { return { v: 1, settings: { age: 40, sex: "m", height: 178, voice: true, savePhotos: true, music: "pads", musicVol: 0.5, beeps: true, prep: 5, rest: 10, sideRest: 5, theme: "auto" }, tests: [], sessions: [], routines: [] }; }
  function load() {
    try { var x = JSON.parse(localStorage.getItem(KEY)); if (x && x.v) { var b = blank(); b.settings = Object.assign(b.settings, x.settings || {}); b.tests = x.tests || []; b.sessions = x.sessions || []; b.routines = x.routines || []; return b; } } catch (e) {}
    return blank();
  }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Couldn't save. Storage may be full."); } }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});

  /* ---------- diagnostics: keep the last few errors and countdown events so problems on the phone can be reported ---------- */
  var DIAG = []; try { DIAG = JSON.parse(localStorage.getItem("sm-diag") || "[]"); } catch (e) {}
  function diag(msg) { try { var d = new Date(); DIAG.push(d.toTimeString().slice(0, 8) + " " + msg); DIAG = DIAG.slice(-25); localStorage.setItem("sm-diag", JSON.stringify(DIAG)); } catch (e) {} }
  window.addEventListener("error", function (e) { if (/^Script error\.?$/.test(e.message || "")) return; /* opaque errors from the browser's own injected scripts (e.g. Firefox on iOS) */ diag("ERROR " + (e.message || e) + " @" + (e.filename || "").split("/").pop() + ":" + (e.lineno || "?")); });
  window.addEventListener("unhandledrejection", function (e) { diag("REJECT " + (e.reason && (e.reason.message || e.reason))); });

  /* ---------- dates ---------- */
  function iso(d) { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function parse(s) { var p = s.split("-"); return new Date(+p[0], p[1] - 1, +p[2]); }
  function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 864e5); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function nice(s) { return parse(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }
  function short(s) { return parse(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }
  function mmss(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }
  function mins(sec) { return Math.max(1, Math.round(sec / 60)) + " min"; }

  /* ---------- scoring (same maths as Body Signal) ---------- */
  function pct(t, v) { if (!isNum(v)) return null; var x = (v - t.lo) / (t.hi - t.lo); return Math.max(0, Math.min(100, Math.round(x * 100))); }
  function testPct(t, v) {
    if (t.noScore) return null;
    var ps = (t.sides ? [v[t.id + "_l"], v[t.id + "_r"]] : [v[t.id]]).map(function (x) { return pct(t, x); }).filter(isNum);
    return ps.length ? Math.round(avg(ps)) : null;
  }
  function score(v) {
    var zones = {}; v = v || {};
    ZONES.forEach(function (z) { var ps = TESTS.filter(function (t) { return t.z === z[0]; }).map(function (t) { return testPct(t, v); }).filter(isNum); zones[z[0]] = ps.length ? Math.round(avg(ps)) : null; });
    var zs = ZONES.map(function (z) { return zones[z[0]]; }).filter(isNum);
    return { zones: zones, overall: zs.length ? Math.round(avg(zs)) : null, n: zs.length };
  }
  /* Latest value for every key across all tests (newest wins). */
  function latest() {
    var v = {}, when = {};
    S.tests.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (t) { Object.keys(t.v).forEach(function (k) { if (isNum(t.v[k])) { v[k] = t.v[k]; when[k] = t.date; } }); });
    return { v: v, when: when };
  }
  function lastTestDate() { return S.tests.reduce(function (m, t) { return !m || t.date > m ? t.date : m; }, null); }
  function avgFor() {
    if (S.settings.sex !== "m") return null;
    var a = S.settings.age || 40; for (var i = 0; i < D.AVG_M.length; i++) if (a <= D.AVG_M[i][0]) return D.AVG_M[i][1]; return null;
  }
  function ageBand() { var a = S.settings.age || 40; return a <= 33 ? "up to 33" : a <= 45 ? "34 to 45" : a <= 55 ? "46 to 55" : "56 and over"; }
  function avgZone(z) { var a = avgFor(); if (!a) return null; return a[ZONES.findIndex(function (x) { return x[0] === z; })]; }
  function gaps(v) {
    var out = [];
    TESTS.forEach(function (t) { if (!t.sides || t.noScore) return; var l = pct(t, v[t.id + "_l"]), r = pct(t, v[t.id + "_r"]); if (isNum(l) && isNum(r) && Math.abs(l - r) >= 15) out.push({ t: t, side: l < r ? "left" : "right", d: Math.abs(l - r) }); });
    return out.sort(function (a, b) { return b.d - a.d; });
  }

  /* ---------- sessions and streak ---------- */
  function sessionDays() { var m = {}; S.sessions.forEach(function (s) { m[s.date] = (m[s.date] || 0) + (s.secs || 0); }); return m; }
  function streak() {
    var m = sessionDays(), d = iso(), n = 0;
    if (!m[d]) d = addDays(d, -1);
    while (m[d]) { n++; d = addDays(d, -1); }
    return n;
  }
  function weekSecs() { var m = sessionDays(), t = 0; for (var i = 0; i < 7; i++) t += m[addDays(iso(), -i)] || 0; return t; }

  /* ---------- routines ---------- */
  function itemSecs(s) { return s.d * (s.s ? 2 : 1); }
  function routineSecs(ids) { return ids.reduce(function (t, id) { return t + (BY[id] ? itemSecs(BY[id]) : 0); }, 0); }
  function seededShuffle(arr, seed) { var a = arr.slice(), x = seed || 1; for (var i = a.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; var j = Math.floor(x / 233280 * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function tightest() {
    var sc = score(latest().v), zs = ZONES.map(function (z) { return z[0]; }).filter(function (z) { return isNum(sc.zones[z]); });
    zs.sort(function (a, b) { var aa = avgZone(a), bb = avgZone(b); return (sc.zones[a] - (aa || 0)) - (sc.zones[b] - (bb || 0)); });
    if (zs.length < 2) return ["hips", "overhead"];
    return zs.slice(0, 2);
  }
  function dailyItems() {
    var pick = tightest(), seed = Math.floor(Date.now() / 864e5);
    var pool = seededShuffle(ST.filter(function (s) { return s.z.some(function (z) { return pick.indexOf(z) >= 0; }) && s.id !== "breath9090"; }), seed);
    pool.sort(function (a, b) { return (a.z.indexOf(pick[0]) >= 0 ? 0 : 1) - (b.z.indexOf(pick[0]) >= 0 ? 0 : 1); });
    var out = [], t = 0, used = {};
    var a = pool.filter(function (s) { return s.z.indexOf(pick[0]) >= 0; }), b = pool.filter(function (s) { return s.z.indexOf(pick[0]) < 0; });
    var mix = []; while (a.length || b.length) { if (a.length) mix.push(a.shift()); if (a.length) mix.push(a.shift()); if (b.length) mix.push(b.shift()); }
    mix.forEach(function (s) { if (t < 540 && !used[s.id] && t + itemSecs(s) <= 620) { out.push(s.id); used[s.id] = 1; t += itemSecs(s); } });
    out.push("breath9090");
    return { items: out, zones: pick };
  }
  function presetItems(p) { if (p.auto) return dailyItems().items; return p.items; }
  function allRoutines() {
    return PRESETS.map(function (p) { return { id: p.id, n: p.n, sub: p.sub, items: presetItems(p), auto: p.auto }; })
      .concat(S.routines.map(function (r) { return { id: r.id, n: r.n, sub: "Your routine", items: r.items, custom: true }; }));
  }
  function findRoutine(id) { return allRoutines().filter(function (r) { return r.id === id; })[0]; }

  /* ---------- small UI helpers ---------- */
  var toastT;
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 2400); }
  function fig(pose, opts) { return FIG.svg(pose, opts); }
  /* Photo of a stretch (id) or test ("t_" + id) when one exists and photos are switched on, otherwise the stick figure. */
  function photoUrl(key) { return S.settings.photos !== false && window.PHOTOS && PHOTOS[key] || null; }
  /* Every photo of a move in order: start positions first, then the main photo, the second position and any later positions. */
  function photoSet(key) {
    if (S.settings.photos === false || !window.PHOTOS || !PHOTOS[key]) return [];
    var x = (window.PHOTOEXTRA || {})[key] || {}, out = (x.pre || []).slice();
    out.push(PHOTOS[key]); if (window.PHOTOS2 && PHOTOS2[key]) out.push(PHOTOS2[key]);
    return out.concat(x.post || []);
  }
  /* Big photo: moves with more than one position stack their photos and slowly cross-fade from one to the next. */
  function bigPhoto(key, cls, alt) {
    var set = photoSet(key); if (!set.length) return "";
    return '<div class="xfade' + (set.length > 1 ? " multi" : "") + '" data-key="' + esc(key) + '">' + set.map(function (u, i) {
      return '<img class="photo ' + cls + (i === 0 ? " on" : "") + '" data-i="' + i + '" alt="' + esc(alt || "") + (set.length > 1 ? " (position " + (i + 1) + " of " + set.length + ")" : "") + '" src="' + esc(u) + '">';
    }).join("") + "</div>";
  }
  var reduceMotion = false; try { reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  setInterval(function () {
    if (reduceMotion || document.hidden) return;
    document.querySelectorAll(".xfade.multi").forEach(function (w) {
      var imgs = w.querySelectorAll("img"), cur = w.querySelector("img.on"), i = cur ? +cur.getAttribute("data-i") : 0;
      if (cur) cur.classList.remove("on"); imgs[(i + 1) % imgs.length].classList.add("on");
    });
  }, 4500);
  function art(key, pose, opts) { var u = photoUrl(key); return u ? '<img class="photo" loading="lazy" decoding="async" alt="" src="' + esc(u) + '">' : fig(pose, opts); }
  var stops = [];
  function stopAnims() { stops.forEach(function (f) { f(); }); stops = []; }
  function animateIn(root) { $$("[data-anim]", root).forEach(function (el) { var s = el.getAttribute("data-anim").split(":"), src = s[0] === "t" ? TESTS.filter(function (t) { return t.id === s[1]; })[0] : BY[s[1]]; if (src) stops.push(FIG.animate(el, src.pose, src.pose2, 1500)); }); }
  function ringSVG(p, size, stroke, col) {
    var r = (size - stroke) / 2, c = 2 * Math.PI * r, f = isNum(p) ? c * (1 - p / 100) : c;
    return '<svg viewBox="0 0 ' + size + " " + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--soft)" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (col || "var(--brand)") + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + f.toFixed(1) + '"/></svg>';
  }

  /* ---------- sheet ---------- */
  var sheetClose = null;
  function openSheet(html, onClose) {
    var sh = $("#sheet"), sc = $("#scrim");
    $("#sheet-body").innerHTML = html; sh.hidden = false; sc.hidden = false; sh.scrollTop = 0;
    requestAnimationFrame(function () { sh.classList.add("on"); sc.classList.add("on"); });
    sheetClose = onClose || null; animateIn(sh);
  }
  function closeSheet() {
    var sh = $("#sheet"), sc = $("#scrim"); sh.classList.remove("on"); sc.classList.remove("on");
    setTimeout(function () { sh.hidden = true; sc.hidden = true; $("#sheet-body").innerHTML = ""; }, 260);
    if (sheetClose) { var f = sheetClose; sheetClose = null; f(); }
  }
  $("#scrim").addEventListener("click", closeSheet);
  /* Swipe the sheet's top bar down to close it; Escape closes it too. */
  (function () {
    var bar = $("#sheet-bar"), sh = $("#sheet"), y0 = null, dy = 0;
    bar.addEventListener("touchstart", function (e) { y0 = e.touches[0].clientY; dy = 0; sh.style.transition = "none"; }, { passive: true });
    bar.addEventListener("touchmove", function (e) { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = "translateY(" + dy + "px)"; }, { passive: true });
    bar.addEventListener("touchend", function () { sh.style.transition = ""; sh.style.transform = ""; if (dy > 70) closeSheet(); y0 = null; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });
  })();

  /* ---------- navigation ---------- */
  var TAB = "home", TITLES = { home: "Today", test: "Mobility test", routines: "Routines", history: "History" };
  function go(tab) {
    TAB = tab; stopAnims();
    $$("nav.tabs button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === tab); });
    $$(".view").forEach(function (v) { v.classList.toggle("on", v.id === "v-" + tab); });
    $("#title").textContent = TITLES[tab];
    render(); window.scrollTo(0, 0);
    try { sessionStorage.setItem("sm-tab", tab); } catch (e) {}
  }
  function render() { ({ home: renderHome, test: renderTest, routines: renderRoutines, history: renderHistory })[TAB](); }
  $$("nav.tabs button").forEach(function (b) { b.addEventListener("click", function () { go(b.getAttribute("data-tab")); }); });

  /* ---------- HOME ---------- */
  function renderHome() {
    var L = latest(), sc = score(L.v), last = lastTestDate(), av = avgFor(), d = dailyItems(), st = streak(), today = sessionDays()[iso()];
    var h = "";
    if (!last) {
      h += '<div class="card nudge"><div class="grow"><h3>Start with a mobility test</h3><p class="muted" style="margin-top:4px">About 15 minutes. It scores six zones so the app can build your daily routine around what\'s tightest. Camera tracking works for 5 of the tests.</p><button class="btn primary" style="margin-top:12px" data-act="go-test">Take the test</button></div></div>';
    } else if (daysBetween(last, iso()) >= 28) {
      h += '<div class="card nudge"><div class="grow"><h3>Time to retest</h3><p>Your last test was ' + daysBetween(last, iso()) + ' days ago. Retesting every 4 weeks shows what\'s working.</p><button class="btn primary" style="margin-top:12px" data-act="go-test">Retest now</button></div></div>';
    }
    if (sc.n) {
      var avO = av ? Math.round(avg(av)) : null, low = ZONES.filter(function (z) { return isNum(sc.zones[z[0]]); }).sort(function (a, b) { return sc.zones[a[0]] - sc.zones[b[0]]; })[0];
      h += '<div class="card"><div class="hero"><div class="ring">' + ringSVG(sc.overall, 128, 12) + '<div class="lbl"><div><b>' + sc.overall + '</b><span>mobility</span></div></div></div><div class="sum"><b>' + (isNum(avO) ? (sc.overall >= avO ? (sc.overall - avO) + " above" : (avO - sc.overall) + " below") + " the average</b><p>Men " + ageBand() + " average " + avO + ".</p>" : "Overall score</b>") + (low ? "<p>Tightest zone: " + low[1] + ".</p>" : "") + '</div></div><div class="zbars">';
      ZONES.forEach(function (z) {
        var p = sc.zones[z[0]], a = avgZone(z[0]);
        h += '<div class="zbar"><span>' + z[1] + '</span><div class="track">' + (isNum(p) ? '<div class="fill" style="width:' + p + "%;background:" + zc(z[0]) + '"></div>' : "") + (isNum(a) ? '<div class="avg" style="left:' + a + '%"></div>' : "") + "</div><b>" + (isNum(p) ? p : "–") + "</b></div>";
      });
      h += "</div>";
      h += '<div class="legend">' + (av ? "<span><i></i>Average for men your age (GOWOD)</span>" : "") + '<span class="grow" style="text-align:right">Tested ' + short(last) + "</span></div></div>";
    }
    h += '<div class="sec"><h2>Your daily 10</h2><span class="small muted">' + (sc.n ? "Focus: " + d.zones.map(function (z) { return ZN[z]; }).join(" and ") : "Hips and overhead until you test") + "</span></div>";
    h += '<div class="card"><div class="row" style="gap:6px;margin-bottom:12px">' + d.items.slice(0, 6).map(function (id) { return '<div class="thumb" style="width:calc((100% - 30px)/6);height:auto;aspect-ratio:1">' + art(id, BY[id].pose, { stroke: 9 }) + "</div>"; }).join("") + "</div>";
    h += '<p class="small muted" style="margin-bottom:12px">' + d.items.map(function (id) { return esc(BY[id].n); }).join(" · ") + "</p>";
    h += '<button class="btn primary big block" data-act="play" data-id="daily">' + ICON.play.replace("<svg", '<svg width="20" height="20"') + (today ? " Go again" : " Start, " + mins(routineSecs(d.items))) + "</button></div>";
    h += '<div class="stat3"><div><b>' + st + '</b><span>day streak</span></div><div><b>' + Math.round(weekSecs() / 60) + '</b><span>mins this week</span></div><div><b>' + S.sessions.length + "</b><span>sessions</span></div></div>";
    var g = gaps(L.v);
    if (g.length) {
      h += '<div class="sec"><h2>Left and right gaps</h2></div><div class="card stack">';
      g.slice(0, 3).forEach(function (x) { h += '<p><b>' + esc(x.t.n) + ":</b> your " + x.side + " side is " + x.d + " points tighter. Give it an extra set.</p>"; });
      h += "</div>";
    }
    h += '<div class="sec"><h2>Quick picks</h2></div>';
    ["warm", "cool", "desk"].forEach(function (id) { h += routineCard(findRoutine(id)); });
    if (!isStandalone()) h += installCard();
    h += '<p class="small muted" style="text-align:center;margin-top:18px">Signal Mobility v' + APP_VERSION + " · " + APP_BUILD + "</p>";
    $("#v-home").innerHTML = h; offlineUI();
  }
  function isStandalone() { return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }
  function installCard() {
    return '<div class="card install"><h3>Add to your Home Screen</h3><p class="muted" style="margin-top:4px">It then opens full screen, works offline and iOS keeps your data safe.</p><ol><li>Tap the Share button in Safari</li><li>Choose <b>Add to Home Screen</b></li><li>Open Mobility from the new icon</li></ol></div>';
  }
  function routineCard(r) {
    if (!r) return "";
    var secs = routineSecs(r.items);
    return '<div class="card rcard" data-act="routine" data-id="' + esc(r.id) + '"><div class="thumb">' + art(r.items[0], BY[r.items[0]].pose, { stroke: 8 }) + '</div><div class="grow"><h3>' + esc(r.n) + "</h3><p>" + esc(r.sub) + " · " + r.items.length + " moves · " + mins(secs) + "</p></div>" + ICON.chev + "</div>";
  }

  /* ---------- TEST ---------- */
  var draft = null;
  function draftFor(date) { var t = S.tests.filter(function (x) { return x.date === date; })[0]; return { date: date, v: Object.assign({}, t ? t.v : {}) }; }
  function fieldsFor(t) {
    if (t.id === "squat") return [["squat_knee", "Knee angle °"], ["squat_shin", "Shin lean °"], ["squat_torso", "Torso lean °"]];
    if (t.sides) return [[t.id + "_l", "Left " + t.u], [t.id + "_r", "Right " + t.u]];
    return [[t.id, "Result " + t.u]];
  }
  function renderTest() {
    if (!draft) draft = draftFor(iso());
    var h = '<p class="muted">Warm up for 5 minutes first. Tap <b>Camera</b> on any test to measure it with live body tracking, or type a result in. Distances in cm are estimated from your height (' + (S.settings.height || 178) + ' cm, change it in Settings).</p>';
    h += '<div class="card row"><label class="field" style="flex:1">Test date<input type="date" id="t-date" value="' + draft.date + '" max="' + iso() + '"></label><div class="grow" style="text-align:right"><span class="small muted">Score so far</span><div style="font-size:28px;font-weight:780" id="t-live">–</div></div></div>';
    ZONES.concat([[null, "Squat check"]]).forEach(function (z) {
      var ts = TESTS.filter(function (t) { return t.z === z[0]; }); if (!ts.length) return;
      h += '<div class="sec"><h2>' + (z[0] ? '<span class="zdot" style="background:' + zc(z[0]) + '"></span>' : "") + z[1] + '</h2><span class="pctpill" data-zone="' + (z[0] || "") + '"></span></div>';
      ts.forEach(function (t) {
        h += '<div class="card tcard" data-test="' + t.id + '"><div class="thead"><div class="thumb">' + art("t_" + t.id, t.pose, { stroke: 8 }) + '</div><div><h3>' + esc(t.n) + '</h3><p class="small muted">' + (t.noScore ? "Not scored. A check of your squat position." : (t.sides ? "Both sides" : "One result") + " · " + t.u + ' · <span data-tp="' + t.id + '"></span>') + "</p></div></div>";
        h += '<details><summary>How to do it</summary><div class="how"><p>' + esc(t.how) + '</p><div class="fig" data-anim="t:' + t.id + '"></div>' + (photoUrl("t_" + t.id) ? '<img class="photo howphoto" loading="lazy" alt="' + esc(t.n) + '" src="' + esc(photoUrl("t_" + t.id)) + '">' : "") + '</div></details>';
        h += '<div class="inputs">' + fieldsFor(t).map(function (f) { return '<label class="field">' + f[1] + '<input type="number" inputmode="decimal" step="any" data-k="' + f[0] + '" value="' + (isNum(draft.v[f[0]]) ? draft.v[f[0]] : "") + '"></label>'; }).join("");
        if (t.cam) h += '<button class="btn" data-act="cam" data-id="' + t.id + '" style="flex:none">' + ICON.cam.replace("<svg", '<svg width="20" height="20"') + " Camera</button>";
        h += "</div></div>";
      });
    });
    h += '<div class="savebar"><button class="btn primary big block" data-act="save-test">Save test</button></div>';
    $("#v-test").innerHTML = h;
    $$("#v-test details").forEach(function (d) { d.addEventListener("toggle", function () { if (d.open) animateIn(d); }); });
    $("#t-date").addEventListener("change", function (e) { var keep = draft.v; draft = draftFor(e.target.value || iso()); if (!S.tests.some(function (x) { return x.date === draft.date; })) draft.v = keep; renderTest(); });
    $$("#v-test input[data-k]").forEach(function (inp) { inp.addEventListener("input", function () { var x = parseFloat(inp.value); if (isNum(x)) draft.v[inp.getAttribute("data-k")] = x; else delete draft.v[inp.getAttribute("data-k")]; liveScore(); }); });
    liveScore();
  }
  function liveScore() {
    var sc = score(draft.v);
    $("#t-live").textContent = isNum(sc.overall) ? sc.overall : "–";
    $$("#v-test [data-zone]").forEach(function (el) { var z = el.getAttribute("data-zone"); el.textContent = z && isNum(sc.zones[z]) ? sc.zones[z] + "%" : ""; el.hidden = !el.textContent; });
    TESTS.forEach(function (t) { var el = $('[data-tp="' + t.id + '"]'); if (el) { var p = testPct(t, draft.v); el.textContent = isNum(p) ? p + "%" : "not done"; } });
  }
  function saveTest() {
    var keys = Object.keys(draft.v).filter(function (k) { return isNum(draft.v[k]); });
    if (!keys.length) { toast("Enter at least one result first."); return; }
    var v = {}; keys.forEach(function (k) { v[k] = draft.v[k]; });
    S.tests = S.tests.filter(function (x) { return x.date !== draft.date; }); S.tests.push({ date: draft.date, v: v, t: Date.now() }); save();
    var sc = score(v); toast("Saved. " + (isNum(sc.overall) ? "Score " + sc.overall + "." : ""));
    draft = null; go("home");
  }

  /* ---------- ROUTINES ---------- */
  var LIB_F = "all", building = null;
  function renderRoutines() {
    var h = '<div class="sec" style="margin-top:6px"><h2>Routines</h2><button class="btn ghost" data-act="build">+ Build your own</button></div>';
    allRoutines().forEach(function (r) { h += routineCard(r); });
    h += '<div class="sec"><h2>Stretch library</h2><span class="small muted">' + ST.length + " moves</span></div>";
    var F = [["all", "All"]].concat(ZONES).concat([["warm", "Warm-up"], ["cool", "Cool-down"], ["back", "Back"], ["run", "Running"], ["desk", "Desk"], ["bed", "On a bed"], ["sleep", "Sleep"]]);
    h += '<div class="chips">' + F.map(function (f) { return '<button class="chip' + (LIB_F === f[0] ? " on" : "") + '" data-act="filter" data-id="' + f[0] + '">' + f[1] + "</button>"; }).join("") + "</div>";
    var list = ST.filter(function (s) { return LIB_F === "all" || s.z.indexOf(LIB_F) >= 0 || s.tags.indexOf(LIB_F) >= 0; });
    h += '<div class="lib' + (building ? " building" : "") + '">' + list.map(function (s) {
      var sel = building && building.items.indexOf(s.id) >= 0;
      return '<button class="lcard' + (sel ? " sel" : "") + '" data-act="stretch" data-id="' + s.id + '"><div class="fig">' + art(s.id, s.pose, { stroke: 8 }) + '</div><span class="check">' + (sel ? building.items.indexOf(s.id) + 1 : "") + "</span><h3>" + esc(s.n) + "</h3><p>" + s.z.map(function (z) { return '<span class="zdot" style="background:' + zc(z) + '"></span>'; }).join("") + (s.reps || (s.d + "s" + (s.s ? " each side" : ""))) + "</p></button>";
    }).join("") + "</div>";
    if (building) h += '<div class="buildbar"><div class="grow"><b>' + building.items.length + ' selected</b><div class="small" style="opacity:.75">' + mins(routineSecs(building.items)) + '</div></div><button class="btn" data-act="build-cancel">Cancel</button><button class="btn primary" data-act="build-save"' + (building.items.length ? "" : " disabled") + ">Save</button></div>";
    $("#v-routines").innerHTML = h;
  }
  function openRoutine(id) {
    var r = findRoutine(id); if (!r) return;
    var h = '<h2>' + esc(r.n) + '</h2><p class="muted" style="margin:4px 0 14px">' + esc(r.sub) + " · " + mins(routineSecs(r.items)) + "</p>";
    h += '<button class="btn primary big block" data-act="play" data-id="' + esc(r.id) + '">' + ICON.play.replace("<svg", '<svg width="20" height="20"') + " Start</button>";
    h += '<div class="card flush" style="margin-top:14px">' + r.items.map(function (sid, i) { var s = BY[sid]; return '<div class="hitem" data-act="stretch" data-id="' + sid + '" style="cursor:pointer"><div class="thumb" style="width:52px;height:52px">' + art(sid, s.pose, { stroke: 9 }) + '</div><div class="grow"><b>' + (i + 1) + ". " + esc(s.n) + '</b><div class="small muted">' + (s.reps || s.d + "s") + (s.s ? " each side" : "") + "</div></div></div>"; }).join("") + "</div>";
    if (r.custom) h += '<div class="row" style="margin-top:8px"><button class="btn" data-act="edit-routine" data-id="' + esc(r.id) + '">Edit</button><button class="btn danger" data-act="del-routine" data-id="' + esc(r.id) + '">Delete</button></div>';
    openSheet(h);
  }
  function openStretch(id) {
    var s = BY[id];
    var pu = photoUrl(id);
    var h = (pu ? '<div class="bigfig photo-wrap">' + bigPhoto(id, "", s.n) + '</div><details class="small" style="margin:-6px 0 12px"><summary style="color:var(--brand);font-weight:600">Show the movement</summary><div class="bigfig" data-anim="s:' + id + '" style="margin-top:8px"></div></details>' : '<div class="bigfig" data-anim="s:' + id + '"></div>') + '<h2>' + esc(s.n) + '</h2><p style="margin:6px 0">' + s.z.map(function (z) { return '<span class="tag"><span class="zdot" style="background:' + zc(z) + '"></span>' + ZN[z] + "</span>"; }).join("") + s.tags.map(function (t) { return '<span class="tag">' + t + "</span>"; }).join("") + "</p>";
    h += '<p class="muted" style="margin-bottom:6px">' + (s.reps ? esc(s.reps) + ", about " : "Hold ") + s.d + " seconds" + (s.s ? " each side" : "") + ".</p><p>" + esc(s.cues) + "</p>";
    h += '<div class="row" style="margin-top:16px"><button class="btn primary grow" data-act="play-one" data-id="' + id + '">' + ICON.play.replace("<svg", '<svg width="18" height="18"') + " Do it now</button></div>";
    openSheet(h);
  }

  /* ---------- PLAYER ---------- */
  var P = null, AC = null;
  function beep(f, ms, vol) {
    if (!S.settings.beeps) return;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); var o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; o.type = "sine"; g.gain.setValueAtTime(vol || 0.25, AC.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + ms / 1000); o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + ms / 1000 + 0.02); } catch (e) {}
  }
  /* ---------- voice: pick the most natural voice the phone has, speak conversationally ---------- */
  var NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|fred|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley|google/i;
  var NICE = /serena|daniel|kate|arthur|martha|stephanie|jamie|oliver|malcolm|ava|zoe|evan|nathan|noelle|joelle|samantha|karen|moira|tessa|libby|sonia|ryan|thomas/i;
  function enVoices() { try { return speechSynthesis.getVoices().filter(function (v) { return /^en[-_]/i.test(v.lang) && !NOVELTY.test(v.name); }); } catch (e) { return []; } }
  function voiceScore(v) { var n = v.name + " " + (v.voiceURI || ""); return (/premium/i.test(n) ? 40 : /enhanced|neural|natural/i.test(n) ? 25 : 0) + (/en[-_]GB/i.test(v.lang) ? 8 : 0) + (NICE.test(n) ? 5 : 0) + (v.localService ? 1 : 0); }
  function bestVoice() {
    var vs = enVoices(); if (!vs.length) return null;
    if (S.settings.voiceName) { var m = vs.filter(function (v) { return v.name === S.settings.voiceName; })[0]; if (m) return m; }
    return vs.slice().sort(function (x, y) { return voiceScore(y) - voiceScore(x); })[0];
  }
  if (window.speechSynthesis) { try { speechSynthesis.onvoiceschanged = function () {}; } catch (e) {} }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  /* Speaks sentence by sentence so there are natural breaths between them. */
  /* Measured delay between asking the phone to speak and the voice actually starting (ms), used to time the countdown. */
  var SPK = { lat: 300 };
  function speak(text, interrupt, onStart) {
    if (!S.settings.voice || !window.speechSynthesis || !text) return false;
    try {
      if (interrupt) speechSynthesis.cancel();
      var v = bestVoice(), parts = String(text).match(/[^.!?]+[.!?]*/g) || [text];
      /* Duck the music straight away for roughly as long as this will take to say (about 2.6 words a second, plus a pause per sentence). */
      if (window.MUSIC) MUSIC.duckFor(String(text).split(/\s+/).length / 2.6 * 1000 / (S.settings.voiceRate || 0.95) + parts.length * 350 + 600);
      var asked = performance.now(), first = true;
      parts.forEach(function (p) { p = p.trim(); if (!p) return; var u = new SpeechSynthesisUtterance(p);
        if (first) { first = false; u.onstart = function () { var t = performance.now(); if (!interrupt || t - asked < 2000) SPK.lat = Math.round(0.7 * SPK.lat + 0.3 * Math.min(1500, t - asked)); if (onStart) onStart(t); }; } if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB"; u.rate = S.settings.voiceRate || 0.95; u.pitch = 1; u.volume = 1; speechSynthesis.speak(u); });
      return true;
    } catch (e) { return false; }
  }
  function say(text) { speak(text, true); }
  /* 3, 2, 1 countdown played from short recorded clips through Web Audio, scheduled on the audio clock so the gaps are exactly one second.
     (The phone's speech engine starts after an unpredictable delay, which made spoken numbers uneven.) Clips: Piper TTS British voices. */
  var CDBUF = {}, CDLOAD = {};
  function cdMode() { var m = S.settings.countdown; return m == null ? "m" : m; }
  function b64buf(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
  /* Works with both the promise and the older callback form of decodeAudioData (Safari). */
  function decode(buf) { return new Promise(function (res, rej) { try { var p = AC.decodeAudioData(buf, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } }); }
  function cdLoad(v) {
    if (v !== "f" && v !== "m") return Promise.resolve(null);
    if (CDBUF[v]) return Promise.resolve(CDBUF[v]); if (CDLOAD[v]) return CDLOAD[v];
    unlockAudio();
    var embedded = function () { if (!window.CDCLIPS || !CDCLIPS[v]) return Promise.reject(new Error("no embedded clips")); return Promise.all(CDCLIPS[v].map(function (s) { return decode(b64buf(s)); })); };
    var files = function () { return Promise.all([3, 2, 1].map(function (n) { return fetch("audio/cd-" + v + "-" + n + ".wav").then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); }).then(decode); })); };
    CDLOAD[v] = embedded().catch(function (e) { diag("embedded clips failed: " + (e && e.message || e)); return files(); })
      .then(function (bs) { CDBUF[v] = bs; diag("countdown clips ready (" + v + ")"); return bs; })
      .catch(function (e) { diag("countdown clips failed to load: " + (e && e.message || e)); CDLOAD[v] = null; return null; });
    return CDLOAD[v];
  }
  function tone(t, f, dur, vol) { var o = AC.createOscillator(), g = AC.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.05); return o; }
  function cdClear() { if (P && P.cd) { P.cd.nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); (P.cd.timers || []).forEach(clearTimeout); clearTimeout(P.cd.check); P.cd = null; } }
  function cdStart() {
    var mode = cdMode(); if (mode === "off") return;
    if (!AC) { try { unlockAudio(); } catch (e) {} }
    if (!AC) { diag("no audio context, using voice"); return cdSpeech(); }
    if (AC.state !== "running") try { AC.resume(); } catch (e) {}
    if (!CDBUF[mode] && (mode === "f" || mode === "m")) cdLoad(mode);
    var lead = 0.06, T = AC.currentTime + lead, cd = P.cd = { t0: performance.now() + lead * 1000, nodes: [] }, bufs = CDBUF[mode];
    for (var i = 0; i < 3; i++) {
      if (bufs) { var src = AC.createBufferSource(), g = AC.createGain(); src.buffer = bufs[i]; g.gain.value = 1; src.connect(g); g.connect(AC.destination); src.start(T + i); cd.nodes.push(src); }
      else cd.nodes.push(tone(T + i, 880, 0.15, 0.25));
    }
    cd.nodes.push(tone(T + 3, 660, 0.5, 0.22), tone(T + 3, 990, 0.6, 0.12)); /* soft "done" chime exactly on zero */
    if (window.MUSIC) MUSIC.duckFor(3600);
    /* Safety net: if the audio clock isn't actually moving (iOS can leave it suspended or "interrupted",
       e.g. after the speech engine has just spoken), drop the scheduled clips and count down with the voice instead. */
    cd.check = setTimeout(function () {
      if (!P || P.cd !== cd) return;
      if (AC.state !== "running" || AC.currentTime < T + 0.15) {
        diag("audio stalled (" + AC.state + "), using voice");
        cd.nodes.forEach(function (n) { try { n.stop(); } catch (e) {} });
        P.cd = null; cdSpeech();
      }
    }, 400);
  }
  /* Fallback countdown with the phone's voice, timed from when "Three" is actually heard. */
  function cdSpeech() {
    if (!S.settings.voice || !window.speechSynthesis) { P.cd = { t0: performance.now(), nodes: [], timers: [] }; return; }
    var cd = P.cd = { t0: null, nodes: [], timers: [] }, asked = performance.now();
    var go = function (t) {
      if (!P || P.cd !== cd || cd.t0 != null) return; cd.t0 = t;
      [["Two", 1000], ["One", 2000]].forEach(function (n) { cd.timers.push(setTimeout(function () { if (P && P.cd === cd && !P.paused) speak(n[0], false); }, Math.max(0, n[1] - SPK.lat - (performance.now() - t)))); });
    };
    speak("Three", true, go);
    cd.timers.push(setTimeout(function () { go(asked + SPK.lat); }, Math.max(600, SPK.lat + 400)));
  }
  function sayQ(text, urgent) { speak(text, urgent); }
  /* Set the audio session before any AudioContext exists so music and beeps play with the silent switch on, and the context isn't interrupted by a later change. */
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
  function unlockAudio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state !== "running") AC.resume(); if (window.speechSynthesis) { var u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {} }
  var wake = null;
  function wakeOn() { try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () {}); } catch (e) {} }
  function wakeOff() { try { if (wake) wake.release(); } catch (e) {} wake = null; }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && (P || CAM.on)) wakeOn(); });

  function steps(items) {
    var out = [];
    items.forEach(function (id) { var s = BY[id]; if (!s) return; if (s.s) { out.push({ s: s, side: "Left", first: true }); out.push({ s: s, side: "Right" }); } else out.push({ s: s, first: true }); });
    return out;
  }
  var MUSIC_STYLES = [["off", "Off"], ["pads", "Calm pads"], ["bowls", "Singing bowls"], ["ocean", "Ocean waves"]];
  function musicOn() { return S.settings.music && S.settings.music !== "off"; }
  function startMusic() { if (window.MUSIC && musicOn()) { unlockAudio(); MUSIC.start(AC, S.settings.music, S.settings.musicVol); if (P && P.paused) MUSIC.pause(300); } }
  function play(routine) {
    unlockAudio(); cdLoad(cdMode()); /* music starts with the first hold, not during the get-ready countdown */
    P = { r: routine, st: steps(routine.items), i: 0, phase: "prep", left: restSecs(true), total: 0, paused: false, worked: 0, last: performance.now(), stop: null, spoke: {} };
    var el = $("#player"); el.hidden = false; document.body.style.overflow = "hidden"; wakeOn();
    el.innerHTML = '<div class="ohead"><button class="icon-btn" data-act="p-close" aria-label="End session">' + ICON.close + '</button><h2>' + esc(routine.n) + '</h2><button class="icon-btn" data-act="p-music" aria-label="Background music">' + (musicOn() ? ICON.music : ICON.musicOff) + '</button><button class="icon-btn" data-act="p-voice" aria-label="Voice">' + (S.settings.voice ? ICON.sound : ICON.mute) + '</button></div><div class="pbar"><i id="p-bar"></i></div>' +
      '<div class="player"><div class="pfig"><span class="side" id="p-side" hidden></span><div class="figwrap" id="p-fig"></div><button class="chip figbtn" id="p-figbtn" data-act="p-fig" hidden>Show movement</button></div><div class="pname" id="p-name"></div><div class="pcue" id="p-cue"></div>' +
      '<div class="phase" id="p-phase"></div><div class="clock"><div class="tring" id="p-ring"></div></div>' +
      '<div class="ctrls"><button class="icon-btn" data-act="p-prev" aria-label="Previous">' + ICON.prev + '</button><button class="icon-btn play" data-act="p-pause" id="p-pp" aria-label="Pause">' + ICON.pause + '</button><button class="icon-btn" data-act="p-next" aria-label="Next">' + ICON.next + '</button></div><div class="upnext" id="p-up"></div><label class="mvol"><span aria-hidden="true">' + ICON.music + '</span><input type="range" id="p-mvol" min="0" max="1" step="0.05" value="' + S.settings.musicVol + '" aria-label="Music volume"></label></div>';
    $("#p-mvol").addEventListener("input", function (e) { S.settings.musicVol = parseFloat(e.target.value); if (window.MUSIC) MUSIC.setVol(S.settings.musicVol); });
    $("#p-mvol").addEventListener("change", save);
    enterStep(); P.timer = setInterval(tick, 200);
  }
  function stepDur(st) { return st.s.d; }
  var KIT = [[/\bband\b/i, "a band, towel or belt"], [/roller/i, "a foam roller or rolled towel"], [/broomstick/i, "a broomstick or towel"], [/\bwall\b|fence/i, "a wall"], [/bench|sofa/i, "a bench, sofa or bed"], [/door frame/i, "a door frame or wall edge"], [/stair|step or sturdy box/i, "a stair or step"], [/towel|belt/i, "a towel or belt"], [/pillow/i, "a pillow or two"], [/something sturdy|chair back/i, "something sturdy to hold"]];
  var KIT_FIX = { butterfly: ["a pillow or two, if you like"], edgeflexor: ["the edge of the bed"], passthru: ["a broomstick, towel or band"], legswing: ["something sturdy to hold"], breath9090: ["a sofa, bed or chair"], hipcircle: ["something to hold, if you like"], standquad: ["something to hold, if you like"], bander: ["a band or towel"], ohshold: ["a broomstick or towel"], stickrot: [], deepsquat: [], heelsup: ["something thin under your heels"], anklerock: ["a wall"], couch: ["a wall or sofa"], latbench: ["a bench, sofa, bed or chair"], hamtowel: ["a towel or belt"], bandham: ["a band, towel or belt"], tspineroll: ["a foam roller or rolled towel"] };
  function kitFor(s) { if (KIT_FIX[s.id]) return KIT_FIX[s.id]; var txt = s.n + " " + s.cues, out = []; KIT.forEach(function (k) { if (k[0].test(txt) && out.indexOf(k[1]) < 0) out.push(k[1]); }); return out; }
  function listJoin(xs) { return xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1]; }
  /* Time to reposition and grab kit between exercises, and a shorter pause to switch sides. Both set in Settings. */
  function restSecs(newExercise) { var s = S.settings; return newExercise ? (s.rest == null ? 10 : s.rest) : (s.sideRest == null ? 5 : s.sideRest); }
  /* queue: true when we arrive here naturally at the end of a hold, so the "one" of the countdown is allowed to finish. */
  /* Player picture: the stretch photo, or the animated figure if there's no photo or "Show movement" is on. */
  function showFig(st) {
    if (P.stop) P.stop(); P.stop = null;
    var has = photoUrl(st.s.id), pu = P.figMode ? null : has, w = $("#p-fig");
    w.classList.toggle("flip", st.side === "Right" && !pu);
    if (pu) w.innerHTML = bigPhoto(st.s.id, "pphoto", st.s.n);
    else P.stop = FIG.animate(w, st.s.pose, st.s.pose2, 1500, { stroke: 7 });
    var b = $("#p-figbtn"); b.hidden = !has; b.textContent = P.figMode ? "Show photo" : "Show movement";
  }
  function enterStep(queue) {
    var st = P.st[P.i]; if (!st) return finish();
    cdClear(); P.phase = "prep"; P.left = restSecs(st.first); P.dur = P.left; P.spoke = {}; if (window.MUSIC) MUSIC.setQuiet(true);
    showFig(st);
    var kit = kitFor(st.s); $("#p-name").textContent = st.s.n; $("#p-cue").textContent = (kit.length ? "You'll need " + listJoin(kit) + ". " : "") + st.s.cues;
    var sd = $("#p-side"); sd.hidden = !st.side; sd.textContent = st.side ? st.side + " side" : "";
    var nx = P.st[P.i + 1]; $("#p-up").textContent = nx ? "Up next: " + nx.s.n + (nx.side ? " (" + nx.side.toLowerCase() + ")" : "") : "Last one";
    $("#p-bar").style.width = (P.i / P.st.length * 100) + "%";
    speak(st.first ? (P.i === 0 ? pick(["Let's start with ", "First up, ", "We'll begin with "]) : pick(["Next up, ", "Okay, next is ", "Moving on to ", "Right, now "])) + st.s.n + "." + (kit.length ? " You'll need " + listJoin(kit) + "." : "") + (st.side ? pick([" Left side first.", " We'll start on the left.", " Left side to begin."]) : "") + (st.s.reps ? " Aim for " + st.s.reps + "." : "") : pick(["Lovely. Switch to the right side.", "Nice. Now the right side.", "Good. Swap over to the right."]), !queue);
    draw();
  }
  function tick() {
    if (!P) return;
    var now = performance.now(), dt = (now - P.last) / 1000; P.last = now;
    if (P.paused) return;
    var before = Math.ceil(P.left);
    P.left -= dt; if (P.phase === "work") P.worked += dt;
    var after = Math.ceil(P.left);
    if (after !== before && P.phase === "work") {
      /* 10 seconds to go reminder, then a spoken 3, 2, 1 (beeps instead if the voice is off) */
      if (after === 10 && (P.dur >= 30 || (P.dur > 15 && P.dur < 24))) say("10 seconds.");
    } else if (after !== before && after <= 3 && after > 0) beep(660, 120);
    if (P.phase === "work" && P.dur >= 5 && cdMode() !== "off") {
      if (!P.cd && P.left <= 3.02 && P.left > 1) {
        try { cdStart(); diag("countdown: " + (P.cd ? (P.cd.timers ? "voice" : "clips") : "skipped") + ", audio " + (AC ? AC.state : "none") + ", clips " + (CDBUF[cdMode()] ? "ready" : "not loaded")); }
        catch (err) { diag("countdown failed: " + (err && err.message || err)); if (P) { if (P.cd) (P.cd.nodes || []).forEach(function (n) { try { n.stop(); } catch (x) {} }); P.cd = null; try { cdSpeech(); } catch (x) { diag("voice countdown failed: " + x.message); } } }
      }
      if (P.cd && P.cd.t0 != null) P.left = Math.max(0, (P.cd.t0 + 3000 - now) / 1000); /* screen follows the countdown */
    }
    /* Halfway call on every hold of 24 seconds or more (shorter holds just get the countdown). */
    if (P.phase === "work" && P.dur >= 24 && !P.spoke.half && P.left <= P.dur / 2) { P.spoke.half = 1; var reps = !!P.st[P.i].s.reps; speak(reps ? pick(["Halfway there. Keep it smooth.", "That's halfway. Nice and controlled.", "Halfway. Keep breathing."]) : pick(["Halfway there. Breathe out, and sink a little deeper.", "That's halfway. Keep breathing slowly.", "Halfway. Relax your shoulders, and let it go a bit further."]), true); }
    if (P.left <= 0) {
      if (P.phase === "prep") { P.phase = "work"; P.left = P.dur = stepDur(P.st[P.i]); diag("hold " + P.st[P.i].s.id + " " + P.dur + "s, countdown " + cdMode()); beep(990, 380, 0.3); if (window.MUSIC) { if (!MUSIC.playing()) startMusic(); MUSIC.setQuiet(false); } }
      else { if (!P.cd) beep(520, 300, 0.3); P.i++; return enterStep(true); }
    }
    draw();
  }
  function draw() {
    if (!P || !P.st[P.i]) return;
    var p = P.dur ? Math.max(0, P.left) / P.dur * 100 : 0;
    $("#p-ring").innerHTML = ringSVG(p, 112, 9, P.phase === "prep" ? "var(--amber)" : "var(--brand)") + "<b>" + Math.max(0, Math.ceil(P.left)) + "</b>";
    var ph = $("#p-phase"); ph.textContent = P.paused ? "Paused" : P.phase === "prep" ? (P.st[P.i].first ? "Get into position" : "Switch sides") : "Hold"; ph.className = "phase" + (P.phase === "prep" ? " prep" : "");
  }
  function finish() {
    var secs = Math.round(P.worked), r = P.r;
    clearInterval(P.timer); if (P.stop) P.stop();
    if (secs >= 30) { S.sessions.push({ date: iso(), t: Date.now(), id: r.id, n: r.n, secs: secs, items: r.items.length }); save(); }
    if (window.MUSIC) setTimeout(function () { if (!P) MUSIC.stop(6000); }, 4000);
    say(secs >= 30 ? pick(["And that's it. Great session.", "All done. Nice work today.", "That's the session finished. Well done."]) : "");
    $("#p-bar").style.width = "100%";
    $(".player").innerHTML = '<div style="flex:1;display:grid;place-items:center;text-align:center"><div><div class="ring" style="margin:0 auto 16px">' + ringSVG(100, 128, 12) + '<div class="lbl"><div><b>' + streak() + '</b><span>day streak</span></div></div></div><h2>Done</h2><p class="muted" style="margin-top:6px">' + esc(r.n) + " · " + mmss(secs) + " of stretching</p></div></div>" +
      '<button class="btn primary big block" data-act="p-close">Finish</button>';
    P = null;
  }
  function closePlayer() {
    cdClear();
    if (P) { clearInterval(P.timer); if (P.stop) P.stop(); var secs = Math.round(P.worked); if (secs >= 60) { S.sessions.push({ date: iso(), t: Date.now(), id: P.r.id, n: P.r.n + " (part)", secs: secs, items: P.i }); save(); } P = null; }
    try { speechSynthesis.cancel(); } catch (e) {}
    if (window.MUSIC) { MUSIC.stop(1500); MUSIC.setQuiet(false); }
    wakeOff(); $("#player").hidden = true; $("#player").innerHTML = ""; document.body.style.overflow = ""; render();
  }

  /* ---------- CAMERA ---------- */
  var CAM = { on: false };
  var CAMHINT = {
    shflex: "Stand side-on, whole body in view. Raise one straight arm overhead, hold 2 seconds, lower. Turn round for the other arm.",
    slr: "Lie on your back side-on to the phone, whole body in view. Raise one straight leg as high as you can, hold, lower. Then the other leg.",
    thomas: "Lie back on a bench edge, hug one knee to your chest and let the other leg hang. Side-on to the phone. Hold still for 2 seconds.",
    ankle: "Half-kneel side-on to the phone. Drive the front knee forward over the toes with the heel down. Hold at your furthest point. Swap legs.",
    squat: "Stand side-on, whole body in view, feet shoulder-width. Squat as deep as you can, pause 2 seconds at the bottom, stand up."
  };
  var SETUP = {
    er: "Put your phone on the floor, about two metres away, with the screen facing you. Lie down side-on to it.",
    slr: "Put your phone on the floor, about two metres away, with the screen facing you. Lie down side-on to it.",
    thomas: "Prop your phone at bench height, about two metres away, facing you. Get side-on to it.",
    backscratch: "Prop your phone at chest height, about two metres away. Stand with your back to it.",
    trot: "Prop your phone at chest height, about two metres away. Sit facing it.",
    hipir: "Prop your phone at knee height, about two metres away. Sit facing it.",
    pigeon: "Prop your phone at hip height, about two metres away. Sit facing it."
  };
  var NEXT = { shflex: "Then turn round, and lift the other arm.", slr: "Then lift the other leg.", thomas: "Then swap legs over.", ankle: "Then swap legs over.", k2w: "Then swap legs over.", er: "Then turn round, and do the other arm.", backscratch: "Then swap hands over.", trot: "Now turn the other way.", hipir: "Keep holding that.", pigeon: "Then switch sides." };
  /* What the coach says, written to be heard rather than read. */
  var SPOKEN = {
    shflex: "Keep your ribs down, and lift one straight arm up overhead as far as it'll go. Hold it there for a couple of seconds, then we'll do the other side.",
    wallflex: "Back flat against the wall, heels, bum and head touching. Lift both arms overhead with your thumbs together, and reach back towards the wall. Hold it for a couple of seconds.",
    backscratch: "Reach one hand over your shoulder, and the other up behind your back, so your fingers point at each other. Hold it for a couple of seconds.",
    er: "Put your arm out to the side at shoulder height, with your elbow bent and your hand pointing at the ceiling. Then let your hand fall back towards the floor, keeping your shoulder down. Hold it at the bottom.",
    trot: "Hold a stick across your shoulders. First, face me and keep still for a moment, so I can learn your shoulder width.",
    slr: "Keep both legs straight. Lift one leg as high as you can, without bending the knee, and hold it there for a couple of seconds.",
    toetouch: "Feet together, knees straight. Reach down as far as you can, and hold it at the bottom.",
    hipir: "Keep your knees still, and swing both feet outwards as far as they'll go. Hold it there for a couple of seconds.",
    thomas: "Lie back on the edge of the bench. Hug one knee to your chest, and let the other leg hang down. Then just relax and hold still.",
    pigeon: "Get into your ninety ninety position, with the front shin across your body. Lean forward with a long back, and let the front knee drop. Hold it there.",
    ankle: "Keep your front heel down, and drive your knee forward over your toes as far as it'll go. Hold it at the furthest point.",
    k2w: "Keep your front heel down, and push your knee forward past your toes as far as it'll go. Hold it at the furthest point.",
    squat: "Feet about shoulder width apart. Squat down as deep as you can, chest up, heels down. Pause at the bottom for a couple of seconds."
  };
  function coachIntro(t) {
    var setup = SETUP[t.cam] || "Prop your phone at hip height, about two metres away, with the screen facing you. Then stand side-on to it.";
    return pick(["Okay, let's measure your " + t.n.toLowerCase() + ".", "Right, " + t.n.toLowerCase() + " next.", "Let's do your " + t.n.toLowerCase() + "."]) + " " + setup + " " + (SPOKEN[t.cam] || "") + " I'll let you know when I can see you.";
  }
  function coachHeld(ev) {
    var t = CAM.t, k = CAM.k, n = Math.round(k === "squat" ? ev.v.knee : ev.v), unit = t.u === "cm" ? (Math.abs(n) === 1 ? " centimetre" : " centimetres") : " degrees";
    var num = (n < 0 ? "minus " + Math.abs(n) : String(n)) + unit;
    var val = k === "squat" ? pick(["Nice and deep. ", "Good squat. ", "Got it. "]) + "Your knee angle is " + num + (ev.v.below ? ", with your hips below your knees." : ".")
      : pick(["Great, hold it. ", "Lovely. ", "Nice one. ", "That's it. "]) + (ev.side === "l" ? "Left side, " : ev.side === "r" ? "Right side, " : "That's ") + num + ".";
    CAM.done[ev.side] = true;
    var next;
    if (k === "squat" || !t.sides) next = pick(["Have another go if you think you can beat it, or tap Use results when you're happy.", "You can go again to beat that, or tap Use results."]);
    else if (CAM.done.l && CAM.done.r) next = pick(["That's both sides done. Go again if you want to beat them, or tap Use results.", "Both sides recorded. Nice work. Tap Use results when you're happy."]);
    else next = "Relax for a second. " + (NEXT[k] || "Now the other side.");
    sayQ(val + " " + next, true);
  }
  function camTest(id) { return TESTS.filter(function (t) { return t.id === id; })[0]; }
  function openCam(id) {
    var t = camTest(id);
    CAM = { on: true, id: id, k: t.cam, t: t, facing: "user", sess: null, stream: null, file: false, lastSay: 0, seen: false, lostAt: 0, lostSaid: 0, done: {}, trotCued: false };
    var el = $("#cam"); el.hidden = false; document.body.style.overflow = "hidden"; wakeOn(); unlockAudio();
    el.innerHTML = '<div class="ohead"><button class="icon-btn" data-act="c-close" aria-label="Close">' + ICON.close + "</button><h2>" + esc(t.n) + '</h2><button class="icon-btn" data-act="c-voice" aria-label="Voice">' + (S.settings.voice ? ICON.sound : ICON.mute) + '</button></div>' +
      '<div class="stage" id="c-stage"><video id="c-video" playsinline muted></video><canvas id="c-canvas"></canvas><div class="guide" id="c-guide"><div><div class="fig" data-anim="t:' + id + '"></div><p style="max-width:320px">' + esc(CAMHINT[t.cam] || t.how) + '</p><p class="small" style="opacity:.7;margin-top:10px">' + (t.cam === "er" || t.cam === "slr" ? "Prop the phone at floor level about 2 to 3 metres away." : "Prop the phone at hip height about 2 to 3 metres away.") + " Good light, fitted clothes." + (t.u === "cm" ? " The cm reading is an estimate scaled to your height (" + (S.settings.height || 178) + " cm)." : "") + '</p></div></div><div class="status" id="c-status" hidden></div></div>' +
      '<div class="readout" id="c-read"></div>' +
      '<div class="camctl" id="c-ctl"><button class="btn primary" data-act="c-start">' + ICON.cam.replace("<svg", '<svg width="18" height="18"') + ' Start camera</button><label class="btn">Use a video<input type="file" accept="video/*" id="c-file" hidden></label></div>';
    animateIn(el); readout();
    $("#c-file").addEventListener("change", function (e) { var f = e.target.files && e.target.files[0]; if (f) camFile(f); });
  }
  function status(msg) { var s = $("#c-status"); if (!s) return; s.hidden = !msg; s.textContent = msg || ""; }
  function readout() {
    var r = $("#c-read"); if (!r) return;
    var b = CAM.sess ? CAM.sess.best : {}, k = CAM.k;
    if (k === "squat") { var bb = bestSquat(); r.innerHTML = '<div class="wide"><span>Deepest squat</span><b>' + (bb ? POSE.label(k, bb) : "–") + "</b></div>"; return; }
    if (!CAM.t.sides) { r.innerHTML = '<div class="wide"><span>Best</span><b style="font-size:26px">' + (b.c ? POSE.label(k, b.c.v, CAM.t.u) : "–") + "</b></div>"; return; }
    r.innerHTML = ["l", "r"].map(function (sd) { return "<div><span>" + (sd === "l" ? "Left" : "Right") + " best</span><b>" + (b[sd] ? POSE.label(k, b[sd].v, CAM.t.u) : "–") + "</b></div>"; }).join("");
  }
  function bestSquat() { var b = CAM.sess ? CAM.sess.best : {}, o = null; ["l", "r"].forEach(function (sd) { if (b[sd] && (!o || b[sd].v.knee < o.knee)) o = b[sd].v; }); return o; }
  function camControls(running) {
    $("#c-ctl").innerHTML = running
      ? '<button class="btn" data-act="c-flip">Flip camera</button><button class="btn" data-act="c-reset">Reset</button><button class="btn primary" data-act="c-use">Use results</button>'
      : '<button class="btn primary" data-act="c-start">Start camera</button><label class="btn">Use a video<input type="file" accept="video/*" id="c-file" hidden></label>' + (CAM.sess && CAM.sess.frames ? '<button class="btn primary" data-act="c-use">Use results</button>' : "");
    var f = $("#c-file"); if (f) f.addEventListener("change", function (e) { var x = e.target.files && e.target.files[0]; if (x) camFile(x); });
  }
  async function camStart() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { status("This browser can't open the camera. Open the app in Safari, or use a video instead."); return; }
    unlockAudio(); if (!CAM.introDone) { CAM.introDone = true; sayQ(coachIntro(CAM.t), true); }
    status("Starting camera…");
    try {
      camStopStream();
      CAM.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: CAM.facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      var v = $("#c-video"); v.srcObject = CAM.stream; v.muted = true; await v.play(); CAM.file = false;
      camRun();
    } catch (e) { status(e && e.name === "NotAllowedError" ? "Camera access was blocked. Allow it in Settings > Safari > Camera, then try again." : "Couldn't start the camera (" + (e && e.message || e) + ")."); }
  }
  function camFile(f) {
    camStopStream();
    var v = $("#c-video"); v.srcObject = null; v.src = URL.createObjectURL(f); v.muted = true; v.playbackRate = 0.5; CAM.file = true;
    v.onloadeddata = function () { v.play().then(camRun).catch(function () { status("Couldn't play that video."); }); };
  }
  async function camRun() {
    $("#c-guide").hidden = true; status("Loading body tracking (first time takes a few seconds)…"); camControls(true);
    try { await POSE.load(); } catch (e) { status("Couldn't load body tracking. Check your connection and try again."); camControls(false); return; }
    status("Step into view so your whole body is on screen.");
    if (!CAM.sess) CAM.sess = new POSE.Session(CAM.k, $("#c-canvas"), { dir: CAM.t.noScore || CAM.t.hi >= CAM.t.lo ? 1 : -1, unit: CAM.t.u, H: S.settings.height || 178,
      caption: function (sd, v) { return CAM.t.n + (sd === "l" ? ", left" : sd === "r" ? ", right" : "") + ": " + POSE.label(CAM.k, v, CAM.t.u) + "\nSignal Mobility · " + nice(iso()); } });
    var v = $("#c-video"), cv = $("#c-canvas"), id = CAM.run = {}, lastFound = true;
    while (CAM.on && CAM.run === id) {
      if (v.readyState >= 2 && !v.paused) {
        var w = v.videoWidth, h = v.videoHeight;
        if (cv.width !== w) { cv.width = w; cv.height = h; }
        var r;
        try { r = await CAM.sess.frame(v, w, h, CAM.facing === "user" && !CAM.file); } catch (e) { r = null; }
        if (r) {
          var now = performance.now();
          if (r.found !== lastFound) { status(r.found ? "" : "Can't see you. Step back so your whole body is in view."); lastFound = r.found; if (!r.found) CAM.lostAt = now; }
          if (r.found && !CAM.seen) { CAM.seen = true; sayQ(CAM.k === "trot" ? "I can see you. Face me, and keep still for a moment." : pick(["Okay, I can see you. Go whenever you're ready, and hold your best position for a couple of seconds.", "Great, I've got you. In your own time, move into it and hold at your best point."])); }
          if (!r.found && CAM.seen && now - CAM.lostAt > 2500 && now - CAM.lostSaid > 8000) { CAM.lostSaid = now; sayQ(pick(["I've lost you a bit. Can you step back so I can see all of you?", "I can't quite see all of you. Take a step back.", "Move back a little, so your whole body's in the picture."]), true); }
          if (CAM.k === "trot" && r.found && (CAM.sess.st.n || 0) < 15) status("Face the camera and hold still…");
          else if (CAM.k === "trot" && CAM.sess.st.n >= 15 && !CAM.trotCued) { CAM.trotCued = true; status("Now rotate each way and hold."); beep(990, 200); sayQ("Perfect, got it. Now turn as far as you can to one side, keep your hips still, and hold it.", true); }
          r.events.forEach(function (ev) {
            if (ev.type === "held" && performance.now() - CAM.lastSay > 2500) { CAM.lastSay = performance.now(); beep(880, 120); coachHeld(ev); }
            else if (ev.type === "best") beep(1180, 70, 0.15);
          });
          readout();
        }
      }
      if (CAM.file && v.ended) { status("Video finished. Tap Use results to keep the best readings."); camControls(false); break; }
      await new Promise(function (res) { requestAnimationFrame(res); });
    }
  }
  function camStopStream() { if (CAM.stream) { CAM.stream.getTracks().forEach(function (t) { t.stop(); }); CAM.stream = null; } CAM.run = null; }
  function camUse() {
    var b = CAM.sess ? CAM.sess.best : {}, t = CAM.t, got = 0;
    if (!draft) draft = draftFor(iso());
    if (CAM.k === "squat") { var q = bestSquat(); if (q) { draft.v.squat_knee = Math.round(q.knee); draft.v.squat_shin = Math.round(q.shin); draft.v.squat_torso = Math.round(q.torso); got = 1; } }
    else if (!t.sides) { if (b.c) { draft.v[t.id] = Math.round(b.c.v); got = 1; } }
    else ["l", "r"].forEach(function (sd) { if (b[sd]) { draft.v[t.id + "_" + sd] = Math.round(b[sd].v); got++; } });
    var snaps = ["l", "r", "c"].filter(function (sd) { return b[sd] && b[sd].img; }).map(function (sd) { return { sd: sd, img: b[sd].img }; });
    LASTSNAPS = snaps.map(function (s) { return { img: s.img, name: "mobility-" + t.id + (s.sd === "c" ? "" : "-" + (s.sd === "l" ? "left" : "right")) + "-" + iso() + ".jpg" }; });
    /* Must run inside the tap so iOS allows the share sheet. */
    var shared = got && S.settings.savePhotos && LASTSNAPS.length ? savePhotos(LASTSNAPS) : false;
    closeCam();
    if (!got) { toast("No readings captured yet."); return; }
    toast("Added to your test. Tap Save test when you're done.");
    if (TAB !== "test") go("test"); else renderTest();
    if (snaps.length && !shared) openSheet("<h2>Best positions</h2><p class=\"muted\" style=\"margin:4px 0 12px\">Save them to Photos to keep a visual record.</p><div class=\"snaps\">" + snaps.map(function (s) { return '<img alt="Tracked position" src="' + s.img + '">'; }).join("") + '</div><button class="btn primary block" style="margin-top:12px" data-act="save-photos">Save to Photos</button>');
    var card = $('[data-test="' + t.id + '"]'); if (card) card.scrollIntoView({ block: "center" });
  }
  var LASTSNAPS = [];
  function dataFile(u, name) { var b = atob(u.split(",")[1]), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return new File([a], name, { type: "image/jpeg" }); }
  /* Opens the iOS share sheet with the captioned images; "Save Images" puts them in Photos. Returns true if the sheet was opened. */
  function savePhotos(list) {
    try {
      var files = list.map(function (s) { return dataFile(s.img, s.name); });
      if (navigator.canShare && navigator.canShare({ files: files })) {
        navigator.share({ files: files }).then(function () { toast("Saved"); }).catch(function (e) { if (!e || e.name !== "AbortError") toast("Couldn't open the save sheet"); });
        return true;
      }
      files.forEach(function (f) { var a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); });
      toast("Images downloaded");
      return true;
    } catch (e) { return false; }
  }
  function closeCam() {
    CAM.on = false; camStopStream(); var v = $("#c-video"); if (v) { v.pause(); if (v.src) URL.revokeObjectURL(v.src); }
    try { speechSynthesis.cancel(); } catch (e) {}
    if (!P) wakeOff(); stopAnims(); $("#cam").hidden = true; $("#cam").innerHTML = ""; document.body.style.overflow = "";
  }

  /* ---------- HISTORY ---------- */
  function lineChart(pts) {
    var W = 340, H = 150, pl = 28, pr = 10, pt = 12, pb = 24;
    var x = function (i) { return pl + (pts.length < 2 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (pts.length - 1)); }, y = function (v) { return pt + (100 - v) * (H - pt - pb) / 100; };
    var s = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Overall mobility score over time">';
    [0, 50, 100].forEach(function (g) { s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="var(--line)"/><text x="' + (pl - 6) + '" y="' + (y(g) + 4) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + g + "</text>"; });
    var av = avgFor(); if (av) { var a = Math.round(avg(av)); s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(a) + '" y2="' + y(a) + '" stroke="var(--ink)" stroke-opacity=".45" stroke-dasharray="4 4"/><text x="' + (pl + 4) + '" y="' + (y(a) + 13) + '" text-anchor="start" font-size="10" fill="var(--muted)">age average ' + a + "</text>"; }
    if (pts.length > 1) s += '<path d="M' + pts.map(function (p, i) { return x(i).toFixed(1) + " " + y(p.s).toFixed(1); }).join(" L") + '" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linejoin="round"/>';
    pts.forEach(function (p, i) { s += '<circle cx="' + x(i) + '" cy="' + y(p.s) + '" r="4" fill="var(--brand)"/>'; if (i === 0 || i === pts.length - 1 || pts.length <= 6) s += '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="' + (pts.length > 1 && i === pts.length - 1 ? "end" : pts.length > 1 && i === 0 ? "start" : "middle") + '" font-size="10" fill="var(--muted)">' + short(p.d) + "</text>"; });
    return s + "</svg>";
  }
  function renderHistory() {
    var tests = S.tests.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var pts = tests.slice().reverse().map(function (t) { return { d: t.date, s: score(t.v).overall }; }).filter(function (p) { return isNum(p.s); });
    var h = '<div class="sec" style="margin-top:6px"><h2>Mobility score</h2></div><div class="card">' + (pts.length ? lineChart(pts) : '<div class="empty">Your score will chart here after your first test.</div>') + "</div>";
    var m = sessionDays(), cells = "", start = addDays(iso(), -55), dow = (parse(start).getDay() + 6) % 7; start = addDays(start, -dow);
    for (var i = 0; i < 56 + 7; i++) { var d = addDays(start, i); if (d > iso()) break; var v = m[d] || 0; cells += '<i title="' + d + '" class="' + (v >= 480 ? "l2" : v ? "l1" : "") + (d === iso() ? " today" : "") + '"></i>'; }
    h += '<div class="sec"><h2>Stretching</h2><span class="small muted">' + streak() + " day streak</span></div><div class=\"card\"><div class=\"calwrap\"><div class=\"dl\"><span>M</span><span></span><span>W</span><span></span><span>F</span><span></span><span>S</span></div><div class=\"cal\">" + cells + '</div></div><div class="legend"><span>Last 8 weeks. Light = some stretching, dark = 8 minutes or more.</span></div></div>';
    h += '<div class="sec"><h2>Tests</h2></div><div class="card flush">' + (tests.length ? tests.map(function (t) {
      var sc = score(t.v);
      return '<div class="hitem" data-act="test-detail" data-id="' + t.date + '" style="cursor:pointer"><span class="big">' + (isNum(sc.overall) ? sc.overall : "–") + '</span><div class="grow"><b>' + nice(t.date) + '</b><div class="small muted">' + sc.n + ' of 6 zones</div></div><div class="mini">' + ZONES.map(function (z) { var p = sc.zones[z[0]]; return '<i style="height:' + Math.max(3, (p || 0) / 100 * 26) + "px;background:" + (isNum(p) ? zc(z[0]) : "var(--line)") + '"></i>'; }).join("") + "</div>" + ICON.chev + "</div>";
    }).join("") : '<div class="empty">No tests yet.</div>') + "</div>";
    var ss = S.sessions.slice().sort(function (a, b) { return b.t - a.t; }).slice(0, 30);
    h += '<div class="sec"><h2>Sessions</h2></div><div class="card flush">' + (ss.length ? ss.map(function (s) { return '<div class="hitem"><div class="grow"><b>' + esc(s.n) + '</b><div class="small muted">' + nice(s.date) + "</div></div><span class=\"num\">" + mmss(s.secs) + "</span></div>"; }).join("") : '<div class="empty">Finish a routine and it\'ll show here.</div>') + "</div>";
    $("#v-history").innerHTML = h;
  }
  function testDetail(date) {
    var t = S.tests.filter(function (x) { return x.date === date; })[0]; if (!t) return;
    var sc = score(t.v), h = "<h2>" + nice(date) + '</h2><p class="muted" style="margin:4px 0 12px">Overall ' + (isNum(sc.overall) ? sc.overall : "–") + "</p>";
    h += '<div class="zbars" style="margin-bottom:14px">' + ZONES.map(function (z) { var p = sc.zones[z[0]], a = avgZone(z[0]); return '<div class="zbar"><span>' + z[1] + '</span><div class="track">' + (isNum(p) ? '<div class="fill" style="width:' + p + "%;background:" + zc(z[0]) + '"></div>' : "") + (isNum(a) ? '<div class="avg" style="left:' + a + '%"></div>' : "") + "</div><b>" + (isNum(p) ? p : "–") + "</b></div>"; }).join("") + "</div>";
    h += '<div class="card flush"><div class="kv" style="padding-top:12px">' + TESTS.map(function (x) { return fieldsFor(x).filter(function (f) { return isNum(t.v[f[0]]); }).map(function (f) { return "<span>" + esc(x.n) + (f[0] !== x.id ? " (" + f[1].split(" ")[0].toLowerCase() + ")" : "") + "</span><span class=\"num\">" + t.v[f[0]] + " " + x.u + "</span>"; }).join(""); }).join("") + "</div></div>";
    h += '<div class="row" style="margin-top:8px"><button class="btn" data-act="edit-test" data-id="' + date + '">Edit</button><button class="btn danger" data-act="del-test" data-id="' + date + '">Delete</button></div>';
    openSheet(h);
  }

  /* ---------- SETTINGS, EXPORT, IMPORT ---------- */
  function exportObj() {
    return { app: "signal-mobility", version: 1, exported: new Date().toISOString(), settings: S.settings, tests: S.tests, sessions: S.sessions, routines: S.routines,
      bodySignal: { collection: "mobility", docs: S.tests.map(function (t) { return { id: "m-" + t.date, data: { date: t.date, v: t.v } }; }) } };
  }
  async function doExport() {
    var json = JSON.stringify(exportObj(), null, 1), name = "signal-mobility-" + iso() + ".json";
    try {
      var file = new File([json], name, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Signal Mobility backup" }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([json], { type: "application/json" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  async function doCopy() {
    var json = JSON.stringify(exportObj());
    try { await navigator.clipboard.writeText(json); toast("Copied. Paste it into Body Signal or a note."); } catch (e) { toast("Couldn't copy on this device. Use Export file instead."); }
  }
  function doImport(text) {
    var x; try { x = JSON.parse(text); } catch (e) { toast("That isn't a valid backup file."); return; }
    if (!x || x.app !== "signal-mobility") { toast("That isn't a Signal Mobility backup."); return; }
    var byDate = {}; S.tests.forEach(function (t) { byDate[t.date] = t; }); (x.tests || []).forEach(function (t) { if (t && t.date && t.v) byDate[t.date] = t; });
    S.tests = Object.keys(byDate).map(function (k) { return byDate[k]; });
    var seen = {}; S.sessions.concat(x.sessions || []).forEach(function (s) { if (s && s.t) seen[s.t + "|" + s.id] = s; }); S.sessions = Object.keys(seen).map(function (k) { return seen[k]; });
    var rs = {}; S.routines.concat(x.routines || []).forEach(function (r) { if (r && r.id) rs[r.id] = r; }); S.routines = Object.keys(rs).map(function (k) { return rs[k]; });
    if (x.settings) S.settings = Object.assign(S.settings, x.settings);
    save(); applyTheme(); closeSheet(); render(); toast("Restored " + (x.tests || []).length + " tests and " + (x.sessions || []).length + " sessions.");
  }
  function openSettings() {
    var s = S.settings;
    var h = '<h2>Settings</h2><div class="card" style="margin-top:12px"><div class="row"><label class="field">Age<input type="number" inputmode="numeric" id="s-age" min="14" max="99" value="' + (s.age || "") + '"></label><label class="field">Height (cm)<input type="number" inputmode="numeric" id="s-height" min="120" max="230" value="' + (s.height || 178) + '"></label><label class="field">Sex<select id="s-sex"><option value="m"' + (s.sex === "m" ? " selected" : "") + '>Male</option><option value="f"' + (s.sex === "f" ? " selected" : "") + ">Female</option></select></label></div>" +
      '<p class="small muted" style="margin-top:8px">Age and sex set the GOWOD average markers (GOWOD only publishes averages for men). Height scales the camera\'s cm estimates.</p></div>';
    h += '<div class="card"><div class="row"><label class="field">Time between exercises<select id="s-rest">' + [5, 10, 15, 20, 30, 45, 60].map(function (n) { return '<option value="' + n + '"' + ((s.rest == null ? 10 : s.rest) === n ? " selected" : "") + ">" + n + " seconds</option>"; }).join("") + '</select></label><label class="field">Time to switch sides<select id="s-siderest">' + [3, 5, 10, 15].map(function (n) { return '<option value="' + n + '"' + ((s.sideRest == null ? 5 : s.sideRest) === n ? " selected" : "") + ">" + n + " seconds</option>"; }).join("") + '</select></label></div><div class="row" style="margin-top:10px"><label class="field">Final 3, 2, 1 countdown<select id="s-cd">' + [["m", "Voice (male, British)"], ["f", "Voice (female, American)"], ["beeps", "Beeps"], ["off", "Off"]].map(function (o) { return '<option value="' + o[0] + '"' + (cdMode() === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + '</select></label><button class="btn" style="align-self:flex-end" data-act="cd-test">Hear it</button></div><p class="small muted" style="margin-top:6px">Time to reposition and grab any kit (band, roller, stick) before each move. The next move and its kit are read out at the start.</p><div class="row" style="margin-top:10px"><label class="field">Theme<select id="s-theme">' + [["auto", "Match phone"], ["light", "Light"], ["dark", "Dark"]].map(function (o) { return '<option value="' + o[0] + '"' + (s.theme === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label></div>" +
      '<div class="row" style="margin-top:12px"><label class="row grow"><input type="checkbox" id="s-voice"' + (s.voice ? " checked" : "") + '> Voice coaching</label><label class="row grow"><input type="checkbox" id="s-beeps"' + (s.beeps ? " checked" : "") + "> Beeps</label></div>" +
      '<div class="row" style="margin-top:12px"><label class="field" style="flex:2">Coach voice<select id="s-vname"><option value="">Best available</option>' + enVoices().sort(function (x, y) { return voiceScore(y) - voiceScore(x); }).map(function (v) { return '<option value="' + esc(v.name) + '"' + (s.voiceName === v.name ? " selected" : "") + ">" + esc(v.name) + " (" + esc(v.lang) + ")</option>"; }).join("") + '</select></label><label class="field">Speed<select id="s-vrate">' + [[0.85, "Slower"], [0.95, "Normal"], [1.05, "Quicker"]].map(function (o) { return '<option value="' + o[0] + '"' + ((s.voiceRate || 0.95) === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + '</select></label></div><button class="btn" style="margin-top:8px" data-act="voice-test">Hear the voice</button>' +
      '<p class="small muted" style="margin-top:8px">For the most natural voice, download one on your iPhone: open Settings, search for <b>Voices</b>, then go to English. Pick an <b>Enhanced</b> or <b>Premium</b> voice (Serena, Daniel or Arthur for British), then close and reopen this app and choose it here.</p>' +
      '<div class="row" style="margin-top:14px"><label class="field" style="flex:2">Routine background music<select id="s-music">' + MUSIC_STYLES.map(function (o) { return '<option value="' + o[0] + '"' + ((s.music || "pads") === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + '</select></label><label class="field">Music volume<input type="range" id="s-mvol" min="0" max="1" step="0.05" value="' + (s.musicVol == null ? 0.5 : s.musicVol) + '" style="min-height:46px;padding:0;accent-color:var(--brand)"></label></div><button class="btn" style="margin-top:8px" data-act="music-preview">Preview music</button><p class="small muted" style="margin-top:6px">Gentle music generated on your phone. It drops down whenever the coach speaks.</p>' +
      '<label class="row" style="margin-top:10px"><input type="checkbox" id="s-showphotos"' + (s.photos !== false ? " checked" : "") + '> Show stretch photos (instead of stick figures)</label>' +
      '<label class="row" style="margin-top:10px"><input type="checkbox" id="s-photos"' + (s.savePhotos ? " checked" : "") + '> Save camera test images to Photos</label></div>';
    h += '<div class="card"><h3>Your data</h3><p class="small muted" style="margin:4px 0 12px">Everything is stored on this phone only. Export a backup now and then. The file also carries your tests in Body Signal\'s format.</p><div class="row"><button class="btn grow" data-act="export">Export file</button><button class="btn grow" data-act="copy">Copy</button></div><div class="row" style="margin-top:8px"><label class="btn grow">Restore from file<input type="file" accept="application/json,.json" id="s-import" hidden></label></div>' +
      '<details style="margin-top:10px"><summary class="small" style="color:var(--brand);font-weight:600">Paste a backup instead</summary><textarea class="inp" id="s-paste" rows="4" style="margin-top:8px;font-size:13px"></textarea><button class="btn" style="margin-top:8px" data-act="paste-import">Restore pasted backup</button></details></div>';
    h += '<div class="card"><h3>Offline photos</h3><p class="small muted" style="margin:4px 0 10px" id="off-status">Checking…</p><button class="btn primary block" id="off-btn" data-act="off-save">Save all photos for offline</button><p class="small muted" style="margin-top:8px">About 50 to 80 MB. Best done on Wi-Fi. After that, photos load instantly even with no signal.</p></div>';
    h += '<details class="card"><summary class="small" style="color:var(--brand);font-weight:600">Diagnostics</summary><pre class="small" id="s-diag" style="white-space:pre-wrap;margin:8px 0 0;font-size:11px">' + esc(DIAG.slice(-12).join("\n") || "Nothing logged yet.") + '</pre><button class="btn" style="margin-top:8px" data-act="diag-copy">Copy</button></details>';
    h += '<div class="card"><button class="btn danger block" data-act="reset">Delete all data</button></div><p class="small muted" style="text-align:center">Signal Mobility v' + APP_VERSION + ' (' + APP_BUILD + ') · body tracking by MediaPipe</p>';
    openSheet(h, function () { if (window.MUSIC && !P && MUSIC.playing()) MUSIC.stop(800); });
    offlineUI();
    var sync = function () { S.settings.age = parseInt($("#s-age").value, 10) || S.settings.age; S.settings.sex = $("#s-sex").value; S.settings.height = parseInt($("#s-height").value, 10) || S.settings.height || 178; S.settings.countdown = $("#s-cd").value; S.settings.rest = parseInt($("#s-rest").value, 10); S.settings.sideRest = parseInt($("#s-siderest").value, 10); S.settings.theme = $("#s-theme").value; S.settings.voice = $("#s-voice").checked; S.settings.beeps = $("#s-beeps").checked; S.settings.savePhotos = $("#s-photos").checked; S.settings.photos = $("#s-showphotos").checked; S.settings.voiceName = $("#s-vname").value; S.settings.music = $("#s-music").value; S.settings.musicVol = parseFloat($("#s-mvol").value); if (window.MUSIC && MUSIC.playing() && !P) { if (musicOn()) MUSIC.start(AC, S.settings.music, S.settings.musicVol); else MUSIC.stop(600); } S.settings.voiceRate = parseFloat($("#s-vrate").value) || 0.95; save(); applyTheme(); render(); };
    ["#s-age", "#s-height", "#s-sex", "#s-rest", "#s-siderest", "#s-cd", "#s-theme", "#s-voice", "#s-beeps", "#s-photos", "#s-showphotos", "#s-vname", "#s-vrate", "#s-music", "#s-mvol"].forEach(function (id) { $(id).addEventListener("change", sync); });
    $("#s-import").addEventListener("change", function (e) { var f = e.target.files && e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { doImport(r.result); }; r.readAsText(f); });
  }
  function applyTheme() { var t = S.settings.theme; if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme"); var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = getComputedStyle(document.body).backgroundColor || "#0f6b5c"; }
  $("#btn-settings").addEventListener("click", openSettings);

  /* ---------- actions ---------- */
  var confirmAt = {};
  function twice(key, msg) { if (confirmAt[key] && Date.now() - confirmAt[key] < 3000) { confirmAt[key] = 0; return true; } confirmAt[key] = Date.now(); toast(msg); return false; }
  /* Tap a large photo to see it full screen; tap anywhere (or the cross) to close. Moves with several photos get arrows and swipe. */
  var lbList = [], lbIdx = 0, lbCap = "";
  function lbShow() {
    var n = lbList.length; $("#lb-img").src = lbList[lbIdx];
    $("#lb-cap").textContent = lbCap + (n > 1 ? "  (" + (lbIdx + 1) + " of " + n + ")" : "");
    $("#lb-prev").hidden = $("#lb-next").hidden = n < 2;
  }
  function lbStep(d) { if (lbList.length < 2) return; lbIdx = (lbIdx + d + lbList.length) % lbList.length; lbShow(); }
  function openLightbox(src, cap, list, idx) { lbList = list && list.length ? list : [src]; lbIdx = idx || 0; lbCap = cap || ""; lbShow(); $("#lightbox").hidden = false; }
  function closeLightbox() { var lb = $("#lightbox"); lb.hidden = true; $("#lb-img").removeAttribute("src"); lbList = []; }
  $("#lb-prev").addEventListener("click", function (e) { e.stopPropagation(); lbStep(-1); });
  $("#lb-next").addEventListener("click", function (e) { e.stopPropagation(); lbStep(1); });
  (function () {
    var x0 = null, y0 = 0, swiped = false, lb = $("#lightbox");
    lb.addEventListener("touchstart", function (e) { swiped = false; x0 = e.touches.length === 1 ? e.touches[0].clientX : null; y0 = e.touches.length === 1 ? e.touches[0].clientY : 0; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (x0 == null || lbList.length < 2) return; var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped = true; lbStep(dx < 0 ? 1 : -1); }
    });
    lb.addEventListener("click", function (e) { if (swiped) { swiped = false; e.stopImmediatePropagation(); } }, true);
  })();
  document.addEventListener("keydown", function (e) { if ($("#lightbox").hidden) return; if (e.key === "ArrowLeft") lbStep(-1); if (e.key === "ArrowRight") lbStep(1); });
  $("#lightbox").addEventListener("click", closeLightbox);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#lightbox").hidden) closeLightbox(); });
  document.addEventListener("click", function (e) {
    var big = e.target.closest(".xfade") || e.target.closest(".photo-wrap img, img.pphoto, img.howphoto, .snaps img");
    if (big && big.classList.contains("xfade") && !e.target.closest("[data-act]")) {
      e.preventDefault(); var all = [].slice.call(big.querySelectorAll("img")), on = big.querySelector("img.on") || all[0];
      openLightbox(on.src, (on.getAttribute("alt") || "").replace(/ \(position.*\)$/, ""), all.map(function (im) { return im.src; }), all.indexOf(on)); return;
    }
    if (big && !e.target.closest("[data-act]")) { e.preventDefault(); openLightbox(big.currentSrc || big.src, big.getAttribute("alt")); return; }
    var el = e.target.closest("[data-act]"); if (!el) return;
    var a = el.getAttribute("data-act"), id = el.getAttribute("data-id");
    switch (a) {
      case "go-test": go("test"); break;
      case "routine": openRoutine(id); break;
      case "play": { var r = findRoutine(id); if (!$("#sheet").hidden) closeSheet(); if (r) play(r); break; }
      case "play-one": closeSheet(); play({ id: "single", n: BY[id].n, items: [id] }); break;
      case "stretch":
        if (building && el.classList.contains("lcard")) { var ix = building.items.indexOf(id); if (ix >= 0) building.items.splice(ix, 1); else building.items.push(id); renderRoutines(); }
        else openStretch(id);
        break;
      case "filter": LIB_F = id; renderRoutines(); break;
      case "build": building = { items: [] }; LIB_F = "all"; renderRoutines(); toast("Tap moves in the order you want them"); setTimeout(function () { var l = $(".lib"); if (l) l.scrollIntoView({ behavior: "smooth" }); }, 50); break;
      case "build-cancel": building = null; renderRoutines(); break;
      case "build-save": {
        var nm = prompt("Name your routine", building.n || "My routine"); if (nm == null) break; nm = nm.trim() || "My routine";
        if (building.id) S.routines = S.routines.map(function (r) { return r.id === building.id ? { id: r.id, n: nm, items: building.items } : r; });
        else S.routines.push({ id: "u" + Date.now().toString(36), n: nm, items: building.items });
        save(); building = null; renderRoutines(); window.scrollTo(0, 0); toast("Saved " + nm); break;
      }
      case "edit-routine": { var rr = S.routines.filter(function (r) { return r.id === id; })[0]; closeSheet(); if (rr) { building = { id: rr.id, n: rr.n, items: rr.items.slice() }; go("routines"); } break; }
      case "del-routine": if (twice("dr" + id, "Tap Delete again to confirm")) { S.routines = S.routines.filter(function (r) { return r.id !== id; }); save(); closeSheet(); render(); } break;
      case "save-test": saveTest(); break;
      case "cam": openCam(id); break;
      case "c-start": camStart(); break;
      case "c-close": closeCam(); break;
      case "c-flip": CAM.facing = CAM.facing === "user" ? "environment" : "user"; camStart(); break;
      case "c-reset": if (CAM.sess) { CAM.sess.best = {}; readout(); } toast("Best readings cleared"); break;
      case "c-use": camUse(); break;
      case "save-photos": savePhotos(LASTSNAPS); break;
      case "off-save": saveOffline(); break;
      case "off-dismiss": S.settings.offDismiss = true; save(); offlineUI(); break;
      case "p-fig": if (P && P.st[P.i]) { P.figMode = !P.figMode; showFig(P.st[P.i]); } break;
      case "sheet-close": closeSheet(); break;
      case "diag-copy": try { navigator.clipboard.writeText("v" + APP_VERSION + " " + navigator.userAgent + "\n" + DIAG.join("\n")).then(function () { toast("Copied"); }); } catch (e) {} break;
      case "cd-test": { unlockAudio(); var m0 = cdMode(); cdLoad(m0).then(function () { var fake = P; P = { cd: null }; cdStart(); P = fake; }); break; }
      case "p-music": if (musicOn()) { S.settings.lastMusic = S.settings.music; S.settings.music = "off"; MUSIC.stop(1200); } else { S.settings.music = S.settings.lastMusic || "pads"; startMusic(); } save(); el.innerHTML = musicOn() ? ICON.music : ICON.musicOff; break;
      case "music-preview": if (MUSIC.playing() && !P) { MUSIC.stop(800); el.textContent = "Preview music"; } else if (musicOn()) { startMusic(); el.textContent = "Stop preview"; } else toast("Pick a music style first"); break;
      case "voice-test": { unlockAudio(); var was = S.settings.voice; S.settings.voice = true; speak(pick(["Hi there. This is how I'll sound during your sessions. Let's get moving.", "Hello. I'll be your coach for mobility tests and stretching. Ready when you are."]), true); S.settings.voice = was; break; }
      case "c-voice": case "p-voice": S.settings.voice = !S.settings.voice; save(); el.innerHTML = S.settings.voice ? ICON.sound : ICON.mute; if (!S.settings.voice) try { speechSynthesis.cancel(); } catch (x) {} break;
      case "p-close": closePlayer(); break;
      case "p-pause": if (P) { P.paused = !P.paused; if (P.paused) cdClear(); if (window.MUSIC) { if (P.paused) MUSIC.pause(1500); else MUSIC.resume(2000); } el.innerHTML = P.paused ? ICON.play : ICON.pause; if (P.paused) try { speechSynthesis.cancel(); } catch (x) {} draw(); } break;
      case "p-next": if (P) { P.i++; enterStep(); } break;
      case "p-prev": if (P) { if (P.phase === "work" && P.left < P.dur - 3) { /* restart current */ } else P.i = Math.max(0, P.i - 1); enterStep(); } break;
      case "test-detail": testDetail(id); break;
      case "edit-test": closeSheet(); draft = draftFor(id); go("test"); break;
      case "del-test": if (twice("dt" + id, "Tap Delete again to confirm")) { S.tests = S.tests.filter(function (t) { return t.date !== id; }); save(); closeSheet(); render(); } break;
      case "export": doExport(); break;
      case "copy": doCopy(); break;
      case "paste-import": doImport($("#s-paste").value); break;
      case "reset": if (twice("reset", "Tap again to delete everything on this phone")) { S = blank(); save(); closeSheet(); draft = null; go("home"); toast("All data deleted"); } break;
    }
  });

  /* ---------- offline photos: save every stretch photo into the app's photo cache so routines work with no signal ---------- */
  var OFF = { busy: false, done: 0, total: 0 };
  function photoList() { var seen = {}, out = []; var ex = window.PHOTOEXTRA || {}, xm = {}; Object.keys(ex).forEach(function (k) { (ex[k].pre || []).concat(ex[k].post || []).forEach(function (u, i) { xm[k + "#" + i] = u; }); });
    [window.PHOTOS || {}, window.PHOTOS2 || {}, xm].forEach(function (m) { Object.keys(m).forEach(function (k) { var u = m[k]; if (!seen[u]) { seen[u] = 1; out.push(u); } }); }); return out; }
  function offlineCount() {
    if (!window.caches) return Promise.resolve(0);
    return caches.open("sm-photos").then(function (c) { return Promise.all(photoList().map(function (u) { return c.match(u).then(function (r) { return r ? 1 : 0; }); })); }).then(function (xs) { return xs.reduce(function (s, x) { return s + x; }, 0); }).catch(function () { return 0; });
  }
  function offlineUI() {
    var t = photoList().length, el = $("#off-status"), b = $("#off-btn"), bn = null;
    offlineCount().then(function (n) {
      OFF.done = n; OFF.total = t;
      if (el) el.textContent = OFF.busy ? "Saving… " + n + " of " + t : n >= t ? "All " + t + " photos saved on this phone. Routines work with no signal." : n + " of " + t + " photos saved on this phone.";
      if (b) { b.disabled = OFF.busy || n >= t; b.textContent = n >= t ? "All saved" : OFF.busy ? "Saving…" : "Save all photos for offline"; }
      if (bn) bn.hidden = n >= t || !!S.settings.offDismiss;
    });
  }
  async function saveOffline() {
    if (OFF.busy || !window.caches) { if (!window.caches) toast("This browser can't store photos offline."); return; }
    OFF.busy = true; offlineUI();
    var c = await caches.open("sm-photos"), list = photoList(), fails = 0;
    for (var i = 0; i < list.length; i++) {
      var u = list[i];
      try {
        if (!(await c.match(u))) {
          var r; try { r = await fetch(u, { mode: "cors" }); if (!r.ok) throw 0; } catch (e) { r = await fetch(u, { mode: "no-cors" }); }
          await c.put(u, r);
        }
      } catch (e) { fails++; }
      if (i % 3 === 2) offlineUI();
    }
    OFF.busy = false; offlineUI();
    toast(fails ? fails + " photos couldn't be saved. Try again on Wi-Fi." : "All photos saved for offline use");
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
  }

  /* ---------- boot ---------- */
  document.addEventListener("touchend", function once() { document.removeEventListener("touchend", once); try { unlockAudio(); cdLoad(cdMode()); } catch (e) {} }, { passive: true });
  applyTheme();
  var t0 = "home"; try { t0 = sessionStorage.getItem("sm-tab") || "home"; } catch (e) {}
  go(t0);
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {});
  if (window.speechSynthesis) speechSynthesis.getVoices();
  window.SM = { state: function () { return S; }, score: score, dailyItems: dailyItems, cam: function () { return CAM; } };
})();
