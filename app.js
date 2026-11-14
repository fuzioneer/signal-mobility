/* Movage app: tests, scoring, routines, guided player, history, export. Data stays on this phone. */
(function () {
  "use strict";
  if (window.I18N) I18N.translateStatic(document.body);
  /* If the chosen language's file didn't load (for example it wasn't uploaded with the app), say so rather than silently staying in English. */
  if (window.I18N && I18N.lang !== "en" && !I18N.dict[I18N.lang]) setTimeout(function () { try { diag("language file lang-" + I18N.lang + ".js missing"); toast("Couldn't load the language file lang-" + I18N.lang + ".js. Check it was uploaded with the app."); } catch (e) {} }, 1200);
  /* Bump on every release, and keep sw.js VER in step. */
  var APP_VERSION = "1.47.2", APP_BUILD = "14 Nov 2026";
  var D = window.SMDATA, SPORTS = D.SPORTS, MUSCLES = D.MUSCLES, ZONES = D.ZONES, TESTS = D.TESTS, ST = D.STRETCH, BY = D.BY, PRESETS = D.PRESETS;
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
  var KEY = "signal-mobility-v1"; /* storage key kept from the old name so existing data is not lost */
  var TAGLINE = "Joint Venture";
  function blank() { return { v: 1, settings: { age: 40, sex: "m", height: 178, voice: true, savePhotos: true, music: "pads", musicVol: 0.5, beeps: true, prep: 5, rest: 10, sideRest: 5, theme: "auto" }, tests: [], sessions: [], routines: [], goals: [] }; }
  function load() {
    try { var x = JSON.parse(localStorage.getItem(KEY)); if (x && x.v) { var b = blank(); b.settings = Object.assign(b.settings, x.settings || {}); b.tests = x.tests || []; b.sessions = x.sessions || []; b.routines = x.routines || []; b.goals = Array.isArray(x.goals) ? x.goals : []; if (x.fb) b.fb = x.fb; if (x.cloud) b.cloud = x.cloud; return b; } } catch (e) {}
    return blank();
  }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast((T("Couldn't save. Storage may be full."))); } }
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
  function nice(s) { return parse(s).toLocaleDateString(I18N.locale, { weekday: "short", day: "numeric", month: "short" }); }
  function short(s) { return parse(s).toLocaleDateString(I18N.locale, { day: "numeric", month: "short" }); }
  function mmss(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }
  function mins(sec) { return Math.max(1, Math.round(sec / 60)) + " " + T("min"); }

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
  function ageBand() { var a = S.settings.age || 40; return a <= 33 ? (T("up to 33")) : a <= 45 ? (T("34 to 45")) : a <= 55 ? (T("46 to 55")) : (T("56 and over")); }
  function avgZone(z) { var a = avgFor(); if (!a) return null; return a[ZONES.findIndex(function (x) { return x[0] === z; })]; }
  function gaps(v) {
    var out = [];
    TESTS.forEach(function (t) { if (!t.sides || t.noScore) return; var l = pct(t, v[t.id + "_l"]), r = pct(t, v[t.id + "_r"]); if (isNum(l) && isNum(r) && Math.abs(l - r) >= 15) out.push({ t: t, side: l < r ? (T("left")) : (T("right")), d: Math.abs(l - r) }); });
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
  function holdSecs(s) { var k = (S.fb && S.fb.scale) || 1; return k === 1 ? s.d : Math.max(10, Math.round(s.d * k / 5) * 5); }
  function itemSecs(s) { return holdSecs(s) * (s.s ? 2 : 1); }
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
      .concat(S.routines.map(function (r) { return { id: r.id, n: r.n, sub: (T("Your routine")), items: r.items, custom: true }; }));
  }
  function findRoutine(id) { return allRoutines().filter(function (r) { return r.id === id; })[0]; }

  /* ---------- small UI helpers ---------- */
  var toastT;
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 2400); }
  function fig(pose, opts) { return FIG.svg(pose, opts); }
  /* Photo of a stretch (id) or test ("t_" + id) when one exists and photos are switched on, otherwise the stick figure. */
  /* Photo model: female (default) or male. Each move uses the chosen model's photos, falling back to the other model if one is missing. */
  function maleOn(key) { return S.settings.model === "m" && window.PHOTOS_M && PHOTOS_M[key]; }
  function pmain(key) { return maleOn(key) ? PHOTOS_M[key] : window.PHOTOS && PHOTOS[key]; }
  function p2(key) { return maleOn(key) ? (window.PHOTOS2_M || {})[key] : (window.PHOTOS2 || {})[key]; }
  function px(key) { return (maleOn(key) ? window.PHOTOEXTRA_M : window.PHOTOEXTRA || {}) && (maleOn(key) ? (window.PHOTOEXTRA_M || {})[key] : (window.PHOTOEXTRA || {})[key]) || {}; }
  function photoUrl(key) { return S.settings.photos !== false && pmain(key) || null; }
  /* Every photo of a move in order: start positions first, then the main photo, the second position and any later positions. */
  function photoSet(key) {
    if (S.settings.photos === false || !pmain(key)) return [];
    var x = px(key), out = (x.pre || []).slice();
    out.push(pmain(key)); if (p2(key)) out.push(p2(key));
    return out.concat(x.post || []);
  }
  /* Big photo: moves with more than one position stack their photos and slowly cross-fade from one to the next. */
  /* Looping demo clip for a stretch, matching the chosen model. Off with photos off or with Reduce Motion on. */
  function vidUrl(key) {
    if (S.settings.photos === false || reduceMotion) return null;
    var v = S.settings.model === "m" ? window.VIDEOS_M : window.VIDEOS;
    return (v && v[key]) || null;
  }
  function bigPhoto(key, cls, alt) {
    var set = photoSet(key); if (!set.length) return "";
    alt = altFor(key) || alt;
    var vu = vidUrl(key);
    if (vu) return '<div class="xfade vid" data-key="' + esc(key) + '"><video class="photo ' + cls + ' on" data-vsrc="' + esc(vu) + '" poster="' + esc(set[0]) + '" autoplay muted loop playsinline preload="auto" disablepictureinpicture aria-label="' + esc((alt || "") + ", " + T("demo video")) + '"></video></div>';
    return '<div class="xfade' + (set.length > 1 ? " multi" : "") + '" data-key="' + esc(key) + '">' + set.map(function (u, i) {
      return '<img class="photo ' + cls + (i === 0 ? " on" : "") + '" data-i="' + i + '" alt="' + esc(alt || "") + (set.length > 1 ? " (" + T("position") + " " + (i + 1) + " " + T("of") + " " + set.length + ")" : "") + '" src="' + esc(u) + '">';
    }).join("") + "</div>";
  }
  var reduceMotion = false; try { reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  /* Clips play from the offline copy when there is one (as a blob, which iPhones play reliably), otherwise straight from the web. */
  function vidHydrate(v) {
    if (v.dataset.vdone) return; v.dataset.vdone = 1; var u = v.dataset.vsrc;
    var go = function (src) { v.src = src; var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    if (!window.caches) return go(u);
    caches.open("sm-photos").then(function (c) { return c.match(u); }).then(function (r) { return r && r.type !== "opaque" ? r.blob() : null; })
      .then(function (b) { go(b ? URL.createObjectURL(b) : u); }).catch(function () { go(u); });
  }
  try { new MutationObserver(function () { document.querySelectorAll("video[data-vsrc]:not([data-vdone])").forEach(vidHydrate); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  /* iPhones pause inline videos when speech or other audio starts (the halfway call, cues). Restart any demo clip that
     stopped on its own, unless the routine itself is paused or the app is in the background. Called from the player
     tick, after each spoken cue and when a clip reports a pause. */
  var VID_KICK_AT = 0;
  function vidKick() {
    if (document.hidden) return;
    var held = typeof P !== "undefined" && P && P.paused;
    document.querySelectorAll("video[data-vdone]").forEach(function (v) {
      if (!v.paused || held || !v.src || !v.isConnected) return;
      var now = Date.now(); if (now - VID_KICK_AT < 400) return; VID_KICK_AT = now;
      var q = v.play(); if (q && q.catch) q.catch(function () {});
    });
  }
  document.addEventListener("pause", function (e) { if (e.target && e.target.tagName === "VIDEO" && e.target.dataset.vdone) setTimeout(vidKick, 250); }, true);
  setInterval(function () {
    if (reduceMotion || document.hidden) return;
    document.querySelectorAll(".xfade.multi").forEach(function (w) {
      var imgs = w.querySelectorAll("img"), cur = w.querySelector("img.on"), i = cur ? +cur.getAttribute("data-i") : 0;
      if (cur) cur.classList.remove("on"); imgs[(i + 1) % imgs.length].classList.add("on");
    });
  }, 4500);
  /* Small play badge on thumbnails of moves that have a looping demo video for the chosen model. */
  var VBADGE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11"/><path d="M10 8.2v7.6l6-3.8z"/></svg>';
  function vbadge(key) { return vidUrl(key) ? '<span class="vbadge" role="img" aria-label="' + esc(T("Video demo")) + '" title="' + esc(T("Video demo")) + '">' + VBADGE + "</span>" : ""; }
  /* Alt text for a movement or test photo: what it shows and who is demonstrating it. */
  function altFor(key) {
    var isTest = key.indexOf("t_") === 0, t = isTest ? TESTS.filter(function (x) { return x.id === key.slice(2); })[0] : null, s = isTest ? null : BY[key];
    var name = t ? t.n : s ? s.n : ""; if (!name) return "";
    var who = S.settings.model === "m" ? T("demonstrated by a man") : T("demonstrated by a woman");
    return isTest ? TF("{name} test, {who}", { name: name, who: who }) : TF("{name}, {who}", { name: name, who: who });
  }
  function art(key, pose, opts) { var u = photoUrl(key); return (u ? '<img class="photo" loading="lazy" decoding="async" alt="' + esc(altFor(key)) + '" src="' + esc(u) + '">' : fig(pose, opts)) + (opts && opts.nobadge ? "" : vbadge(key)); }
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
  /* Swipe left or right on a movement's picture to step through the list it was opened from. */
  (function () {
    var x0 = null, y0 = 0, body = $("#sheet-body");
    body.addEventListener("touchstart", function (e) { var t = e.touches[0]; x0 = e.target.closest(".bigfig") ? t.clientX : null; y0 = t.clientY; }, { passive: true });
    body.addEventListener("touchend", function (e) {
      if (x0 === null) return; var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
      if (Math.abs(dx) < 60 || Math.abs(dy) > 50) return;
      var bs = body.querySelectorAll(".snavb"); var b = bs[dx < 0 ? 1 : 0];
      if (b && !b.disabled) b.click();
    }, { passive: true });
  })();
  /* Swipe the sheet's top bar down to close it; Escape closes it too. */
  (function () {
    var bar = $("#sheet-bar"), sh = $("#sheet"), y0 = null, dy = 0;
    bar.addEventListener("touchstart", function (e) { y0 = e.touches[0].clientY; dy = 0; sh.style.transition = "none"; }, { passive: true });
    bar.addEventListener("touchmove", function (e) { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = "translateY(" + dy + "px)"; }, { passive: true });
    bar.addEventListener("touchend", function () { sh.style.transition = ""; sh.style.transform = ""; if (dy > 70) closeSheet(); y0 = null; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });
  })();

  /* ---------- navigation ---------- */
  var TAB = "home", TITLES = { home: (T("Today")), test: (T("Mobility test")), routines: (T("Routines")), history: (T("History")), community: (T("Community")) };
  function go(tab) {
    TAB = tab; stopAnims();
    $$("nav.tabs button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === tab); });
    $$(".view").forEach(function (v) { v.classList.toggle("on", v.id === "v-" + tab); });
    $("#title").textContent = TITLES[tab]; document.body.classList.toggle("on-home", tab === "home");
    render(); window.scrollTo(0, 0);
    try { sessionStorage.setItem("sm-tab", tab); } catch (e) {}
  }
  function render() { ({ home: renderHome, test: renderTest, routines: renderRoutines, history: renderHistory, community: renderCommunity })[TAB](); }
  $$("nav.tabs button").forEach(function (b) { b.addEventListener("click", function () { go(b.getAttribute("data-tab")); }); });

  /* ---------- GOALS: targets tied to test results, with a date to hit them by ---------- */
  var GOALS = [
    { id: "toes", key: "toetouch", target: 0, z: "postchain", n: "Touch your toes", sub: "Reach your toes on the standing toe touch (0 cm or past)" },
    { id: "overhead", key: "wallflex", target: 0, z: "overhead", n: "Arms fully overhead", sub: "Thumbs touch the wall on the wall overhead reach" },
    { id: "scratch", key: "backscratch", target: 0, z: "shoulders", n: "Fingers meet behind your back", sub: "Back scratch reaches 0 cm on both sides" },
    { id: "squat", key: "cam_shin", target: 35, z: "ankles", n: "Heels-down deep squat", sub: "35° of ankle bend (shin lean) on both sides" },
    { id: "slr", key: "slr", target: 80, z: "postchain", n: "Looser hamstrings", sub: "80° straight leg raise on both legs" },
    { id: "hipir", key: "hipir", target: 35, z: "hips", n: "Free-turning hips", sub: "35° hip internal rotation on both sides" },
    { id: "thomas", key: "thomas", target: 0, z: "hips", n: "Open hip flexors", sub: "Thigh level or lower on the Thomas test, both sides" },
    { id: "rotate", key: "trot", target: 45, z: "thorax", n: "Rotate further", sub: "45° seated thoracic rotation each way" }
  ];
  var GOAL_W = 8;
  function testById(id) { return TESTS.filter(function (t) { return t.id === id; })[0]; }
  function goalTpl(g) { return GOALS.filter(function (x) { return x.id === g.tpl; })[0]; }
  function goalBetterUp(g) { if (g.kind === "score") return true; var t = testById(g.key); return !t || t.hi > t.lo; }
  /* The worse side counts, so a goal is only met when both sides get there. */
  function goalVal(key, v) {
    var t = testById(key); if (!t) return null;
    if (!t.sides) return isNum(v[key]) ? v[key] : null;
    var xs = [v[key + "_l"], v[key + "_r"]].filter(isNum); if (!xs.length) return null;
    return t.hi > t.lo ? Math.min.apply(null, xs) : Math.max.apply(null, xs);
  }
  function goalNow(g) { var v = latest().v; if (g.kind === "score") { var o = score(v).overall; return isNum(o) ? Math.round(o) : null; } return goalVal(g.key, v); }
  function goalMet(g, now) { return isNum(now) && (goalBetterUp(g) ? now >= g.target : now <= g.target); }
  function goalPct(g, now) {
    if (goalMet(g, now) || g.done) return 100; if (!isNum(now)) return 0;
    var s = isNum(g.start) ? g.start : now, span = g.target - s; if (!span) return 0;
    return Math.max(0, Math.min(99, Math.round((now - s) / span * 100)));
  }
  function goalUnit(g) { if (g.kind === "score") return ""; var t = testById(g.key); return t ? (t.u === "°" ? "°" : " " + t.u) : ""; }
  function goalName(g) { if (g.kind === "score") return TF("Reach a mobility score of {n}", { n: g.target }); var t = goalTpl(g); return t ? T(t.n) : ""; }
  function goalSub(g) { if (g.kind === "score") return T("Your overall score out of 100"); var t = goalTpl(g); return t ? T(t.sub) : ""; }
  function goalWhen(g) {
    if (g.done) return TF("Reached {date}", { date: short(g.done) });
    var d = daysBetween(iso(), g.by);
    if (d < 0) return T("Past your target date. Keep going, or set a new date.");
    if (d >= 14) return TF("{n} weeks left", { n: Math.round(d / 7) });
    return d === 1 ? T("1 day left") : TF("{n} days left", { n: d });
  }
  function fmtGoal(g, x) { return isNum(x) ? (Math.round(x * 10) / 10) + goalUnit(g) : "–"; }
  function goalActive() { return (S.goals || []).filter(function (g) { return !g.done; }); }
  function goalsCard() {
    var gs = (S.goals || []).slice().sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0); });
    if (!gs.length) return '<button class="card goalnew" data-act="goal-new"><span class="goalplus" aria-hidden="true">+</span><span class="grow"><b>' + T("Set a mobility goal") + '</b><span class="small muted">' + T("Like touching your toes in 8 weeks. Your tests track it.") + "</span></span>" + ICON.chev + "</button>";
    var h = '<div class="sec"><h2>' + T("Your goals") + "</h2>" + (goalActive().length < 3 ? '<button class="btn ghost small" data-act="goal-new">' + T("+ Add") + "</button>" : "") + '</div><div class="card goals">';
    gs.forEach(function (g) {
      var now = goalNow(g), p = goalPct(g, now), met = g.done || goalMet(g, now);
      h += '<button class="goalrow' + (met ? " met" : "") + '" data-act="goal-open" data-id="' + esc(g.id) + '"><span class="grow"><b>' + esc(goalName(g)) + '</b><span class="gbar"><i style="width:' + p + '%"></i></span><span class="small muted">' + (isNum(now) ? TF("Now {now}, goal {target}", { now: fmtGoal(g, now), target: fmtGoal(g, g.target) }) : T("Take the test to see where you are")) + " · " + esc(goalWhen(g)) + "</span></span>" + (met ? '<span class="gtick" aria-label="' + esc(T("Reached")) + '">' + ICON.check + "</span>" : '<span class="gpct">' + p + "%</span>") + "</button>";
    });
    return h + "</div>";
  }
  function goalNewSheet() {
    var v = latest().v, taken = {}; (S.goals || []).forEach(function (g) { if (!g.done) taken[g.kind === "score" ? "score" : g.tpl] = 1; });
    var cur = score(v).overall, sTarget = isNum(cur) ? Math.min(100, Math.ceil((Math.round(cur) + 5) / 5) * 5) : 70;
    var h = "<h2>" + T("Set a goal") + '</h2><p class="small muted" style="margin:4px 0 10px">' + T("Pick a target and a date. Each time you test, Movage tracks how close you are. Up to 3 goals at once.") + "</p>";
    h += '<p class="small" style="margin:8px 0 6px"><b>' + T("Reach it in") + "</b></p>" + '<div class="chips">' + [4, 8, 12].map(function (w) { return '<button class="chip' + (GOAL_W === w ? " on" : "") + '" data-act="goal-weeks" data-id="' + w + '">' + TF("{n} weeks", { n: w }) + "</button>"; }).join("") + "</div>";
    var row = function (id, name, sub, now) { var dis = taken[id]; return '<button class="card goalopt"' + (dis ? " disabled" : "") + ' data-act="goal-pick" data-id="' + id + '"><span class="grow"><b>' + esc(name) + '</b><span class="small muted">' + esc(sub) + "</span>" + (now ? '<span class="small">' + esc(now) + "</span>" : "") + "</span>" + (dis ? '<span class="small muted">' + T("Set") + "</span>" : ICON.chev) + "</button>"; };
    h += row("score", TF("Reach a mobility score of {n}", { n: sTarget }), T("Your overall score out of 100"), isNum(cur) ? TF("You're at {n} now", { n: Math.round(cur) }) : "");
    GOALS.forEach(function (t) {
      var now = goalVal(t.key, v), g = { tpl: t.id, key: t.key, target: t.target };
      h += row(t.id, T(t.n), T(t.sub), isNum(now) ? (goalMet(g, now) ? T("Already there") : TF("You're at {n} now", { n: fmtGoal(g, now) })) : "");
    });
    return h;
  }
  function goalCreate(id) {
    if (goalActive().length >= 3) { toast(T("You can have 3 goals at once. Finish or remove one first.")); return; }
    var g = { id: "g" + Date.now().toString(36), set: iso(), by: addDays(iso(), GOAL_W * 7) };
    if (id === "score") { var cur = score(latest().v).overall; g.kind = "score"; g.target = isNum(cur) ? Math.min(100, Math.ceil((Math.round(cur) + 5) / 5) * 5) : 70; }
    else { var t = GOALS.filter(function (x) { return x.id === id; })[0]; if (!t) return; g.kind = "test"; g.tpl = t.id; g.key = t.key; g.target = t.target; }
    var now = goalNow(g);
    if (goalMet(g, now)) { toast(T("You're already there. Pick a bigger goal.")); return; }
    g.start = isNum(now) ? now : null;
    S.goals = (S.goals || []).concat([g]); save(); closeSheet(); render();
    toast(TF("Goal set: {name}. You've got {n} weeks.", { name: goalName(g), n: GOAL_W }));
  }
  /* A short routine for the goal's zone (score goals use your two tightest zones, like the daily 10). */
  function goalItems(g) {
    var t = goalTpl(g); if (!t) return dailyItems().items;
    var pool = seededShuffle(ST.filter(function (s) { return s.z.indexOf(t.z) >= 0 && s.id !== "breath9090" && canDo(s); }), Math.floor(Date.now() / 864e5));
    var out = [], secs = 0; pool.forEach(function (s) { if (secs < 420 && secs + itemSecs(s) <= 500) { out.push(s.id); secs += itemSecs(s); } });
    out.push("breath9090"); return out;
  }
  function goalOpen(id) {
    var g = (S.goals || []).filter(function (x) { return x.id === id; })[0]; if (!g) return;
    var now = goalNow(g), p = goalPct(g, now), met = g.done || goalMet(g, now);
    var h = "<h2>" + esc(goalName(g)) + '</h2><p class="small muted" style="margin:4px 0 12px">' + esc(goalSub(g)) + "</p>";
    h += '<div class="card"><span class="gbar big"><i style="width:' + p + '%"></i></span><div class="gstats"><div><span class="small muted">' + T("Start") + "</span><b>" + fmtGoal(g, g.start) + '</b></div><div><span class="small muted">' + T("Now") + "</span><b>" + fmtGoal(g, now) + '</b></div><div><span class="small muted">' + T("Goal") + "</span><b>" + fmtGoal(g, g.target) + '</b></div></div><p class="small muted" style="margin-top:8px">' + esc(goalWhen(g)) + (g.done ? "" : " · " + TF("Target date {date}", { date: short(g.by) })) + "</p></div>";
    if (!met) h += '<button class="btn primary block" data-act="goal-train" data-id="' + esc(g.id) + '" style="margin-top:6px">' + ICON.play.replace("<svg", '<svg width="18" height="18"') + " " + T("Train for it") + '</button><button class="btn block" data-act="goal-retest" style="margin-top:8px">' + T("Retest to check progress") + "</button>";
    h += '<button class="btn ghost block" data-act="goal-del" data-id="' + esc(g.id) + '" style="margin-top:8px">' + T("Remove goal") + "</button>";
    openSheet(h);
  }
  /* After a test: mark goals that are now met and celebrate them. */
  function goalCheck() {
    var hit = [];
    (S.goals || []).forEach(function (g) { if (!g.done && goalMet(g, goalNow(g))) { g.done = iso(); hit.push(g); } });
    if (hit.length) { save(); setTimeout(function () { toast(TF("Goal reached: {name}. Brilliant work!", { name: goalName(hit[0]) })); }, 1800); }
  }
  function goalAct(a, id) {
    switch (a) {
      case "goal-new": openSheet(goalNewSheet()); break;
      case "goal-weeks": GOAL_W = parseInt(id, 10) || 8; openSheet(goalNewSheet()); break;
      case "goal-pick": goalCreate(id); break;
      case "goal-retest": closeSheet(); go("test"); break;
      case "goal-open": goalOpen(id); break;
      case "goal-train": { var g = (S.goals || []).filter(function (x) { return x.id === id; })[0]; if (!g) return; closeSheet(); play({ id: "goal", n: TF("Goal: {name}", { name: goalName(g) }), items: goalItems(g) }); break; }
      case "goal-del": if (twice("gd" + id, T("Tap again to remove this goal"))) { S.goals = (S.goals || []).filter(function (x) { return x.id !== id; }); save(); closeSheet(); render(); } break;
    }
  }

  /* ---------- HOME ---------- */
  function renderHome() {
    var L = latest(), sc = score(L.v), last = lastTestDate(), av = avgFor(), d = dailyItems(), st = streak(), today = sessionDays()[iso()];
    var h = "", due = remDue(), snoozed = false; try { snoozed = !!localStorage.getItem("sm-nudge-" + iso()); } catch (e) {}
    if (due && due.nudge && !snoozed) { var drt = remRoutine(due); h += '<div class="card nudge remnudge"><div class="grow"><h3>' + T("Time for your mobility") + '</h3><p class="muted" style="margin-top:4px">' + esc(drt.n) + " · " + mins(routineSecs(drt.items)) + '</p><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary" data-act="play" data-id="' + esc(drt.id) + '">' + T("Start") + '</button><button class="btn" data-act="rm-later">' + T("Not today") + "</button></div></div></div>"; }
    if (!last) {
      h += ('<div class="card nudge"><div class="grow"><h3>' + T("Start with a mobility test") + '</h3><p class="muted" style="margin-top:4px">' + T("About 15 minutes. It scores six zones so the app can build your daily routine around what's tightest. Camera tracking works for 5 of the tests.") + '</p><button class="btn primary" style="margin-top:12px" data-act="go-test">' + T("Take the test") + '</button></div></div>');
    } else if (daysBetween(last, iso()) >= 28) {
      h += ('<div class="card nudge"><div class="grow"><h3>' + T("Time to retest") + '</h3><p>' + T("Your last test was") + ' ') + daysBetween(last, iso()) + (' ' + T("days ago. Retesting every 4 weeks shows what's working.") + '</p><button class="btn primary" style="margin-top:12px" data-act="go-test">' + T("Retest now") + '</button></div></div>');
    }
    if (sc.n) {
      var avO = av ? Math.round(avg(av)) : null, low = ZONES.filter(function (z) { return isNum(sc.zones[z[0]]); }).sort(function (a, b) { return sc.zones[a[0]] - sc.zones[b[0]]; })[0];
      h += '<div class="card"><div class="hero"><div class="ring">' + ringSVG(sc.overall, 128, 12) + '<div class="lbl"><div><b>' + sc.overall + ('</b><span>' + T("mobility") + '</span></div></div></div><div class="sum"><b>') + (isNum(avO) ? (sc.overall >= avO ? TF("{n} above the average", { n: sc.overall - avO }) : TF("{n} below the average", { n: avO - sc.overall })) + ("</b><p>" + T("Men") + " ") + ageBand() + " " + T("average") + " " + avO + ".</p>" : (T("Overall score") + "</b>")) + (low ? ("<p>" + T("Tightest zone:") + " ") + low[1] + ".</p>" : "") + '</div></div><div class="zbars">';
      ZONES.forEach(function (z) {
        var p = sc.zones[z[0]], a = avgZone(z[0]);
        h += '<div class="zbar"><span>' + z[1] + '</span><div class="track">' + (isNum(p) ? '<div class="fill" style="width:' + p + "%;background:" + zc(z[0]) + '"></div>' : "") + (isNum(a) ? '<div class="avg" style="left:' + a + '%"></div>' : "") + "</div><b>" + (isNum(p) ? p : "–") + "</b></div>";
      });
      h += "</div>";
      h += '<div class="legend">' + (av ? ("<span><i></i>" + T("Typical score for men your age") + "</span>") : "") + ('<span class="grow" style="text-align:right">' + T("Tested") + ' ') + short(last) + '</span></div><button class="btn block sharebtn" data-act="share-score"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg> ' + T("Share to Instagram") + "</button></div>";
    }
    h += ('<div class="sec"><h2>' + T("Your daily 10") + '</h2><span class="small muted">') + (sc.n ? (T("Focus:") + " ") + d.zones.map(function (z) { return ZN[z]; }).join((" " + T("and") + " ")) : (T("Hips and overhead until you test"))) + "</span></div>";
    h += '<div class="card"><div class="row" style="gap:6px;margin-bottom:12px">' + d.items.slice(0, 6).map(function (id) { return '<div class="thumb" style="width:calc((100% - 30px)/6);height:auto;aspect-ratio:1">' + art(id, BY[id].pose, { stroke: 9 }) + "</div>"; }).join("") + "</div>";
    h += '<p class="small muted" style="margin-bottom:12px">' + d.items.map(function (id) { return esc(BY[id].n); }).join(" · ") + "</p>";
    h += '<button class="btn primary big block" data-act="play" data-id="daily">' + ICON.play.replace("<svg", '<svg width="20" height="20"') + (today ? (" " + T("Go again")) : (" " + T("Start,") + " ") + mins(routineSecs(d.items))) + "</button></div>";
    h += '<div class="stat3"><div><b>' + st + ('</b><span>' + T("day streak") + '</span></div><div><b>') + Math.round(weekSecs() / 60) + ('</b><span>' + T("mins this week") + '</span></div><div><b>') + S.sessions.length + ("</b><span>" + T("sessions") + "</span></div></div>");
    h += goalsCard();
    h += chCard();
    var g = gaps(L.v);
    if (g.length) {
      h += ('<div class="sec"><h2>' + T("Left and right gaps") + '</h2></div><div class="card stack">');
      g.slice(0, 3).forEach(function (x) { h += '<p><b>' + esc(x.t.n) + ":</b> " + esc(TF(x.side === "left" ? "your left side is {n} points tighter. Give it an extra set." : "your right side is {n} points tighter. Give it an extra set.", { n: x.d })) + "</p>"; });
      h += "</div>";
    }
    h += qwCard();
    var sp = sportObj();
    if (sp) {
      h += ('<div class="sec"><h2>' + T("Top stretches for") + ' ') + esc(sportShort(sp)) + ('</h2><button class="btn ghost small" data-act="settings-open">' + T("Change") + '</button></div>');
      h += '<div class="picks">' + sp.top.filter(function (id) { return BY[id]; }).map(function (id) { return '<button class="pick" data-act="stretch" data-id="' + id + '"><div class="thumb">' + art(id, BY[id].pose, { stroke: 9 }) + "</div><span>" + esc(BY[id].n) + "</span></button>"; }).join("") + "</div>";
      h += ('<div class="sec"><h2>' + T("Top routines for") + ' ') + esc(sportShort(sp)) + "</h2></div>";
      sp.picks.forEach(function (id) { var r = findRoutine(id); if (r) h += routineCard(r); });
    } else {
      h += ('<div class="sec"><h2>' + T("Quick picks") + '</h2><button class="btn ghost small" data-act="settings-open">' + T("Pick your sport") + '</button></div>');
      ["warm", "cool", "desk"].forEach(function (id) { h += routineCard(findRoutine(id)); });
    }
    if (!isStandalone()) h += installCard();
    h += '<p class="small muted" style="text-align:center;margin-top:18px"><b>Movage</b> · ' + TAGLINE + "<br>v" + APP_VERSION + " · " + APP_BUILD + "</p>";
    $("#v-home").innerHTML = h; offlineUI();
  }
  function sportObj() { var id = S.settings.sport; return id ? SPORTS.filter(function (x) { return x.id === id; })[0] || null : null; }
  function sportShort(sp) { return { crossfit: (T("CrossFit")), hyrox: (T("Hyrox")), running: (T("running")), golf: (T("golf")), lifting: (T("lifting")), cycling: (T("cycling")), office: (T("everyday")) }[sp.id] || sp.n; }

  /* ---------- body map for Build your own: tap muscle groups to filter the library ---------- */
  var MG_SEL = [];
  var MG_LAST = null;
  /* Groups select several muscles at once. */
  var MGROUPS = [["post", (T("Posterior chain")), ["lb", "gl", "ham", "calf"]], ["ant", (T("Anterior chain")), ["ch", "core", "hf", "quad"]], ["hips", (T("Hips")), ["hf", "gl", "add"]],
    ["shg", (T("Shoulder girdle")), ["sh", "ch", "ub", "lat"]], ["upper", (T("Upper body")), ["sh", "ch", "ub", "lat", "fa"]], ["lower", (T("Lower body")), ["hf", "quad", "add", "gl", "ham", "calf"]]];
  function groupOn(g) { return g[2].every(function (m) { return MG_SEL.indexOf(m) >= 0; }); }
  var MDESC = { sh: (T("Deltoids, the caps of the shoulders")), ch: (T("Pecs, across the front of the chest")), ub: (T("Traps and rhomboids, between the shoulder blades")),
    lat: (T("Latissimus dorsi, the wings down the sides of the back")), lb: (T("Erector spinae, either side of the lower spine")), core: (T("Abs and obliques")),
    fa: (T("Wrist flexors and extensors along the forearm")), hf: (T("Iliopsoas and rectus femoris, at the front of the hip")), quad: (T("Quadriceps, the front of the thigh")),
    add: (T("Adductors, the inside of the thigh")), gl: (T("Gluteus maximus and medius, plus the outer hip and IT band")), ham: (T("The back of the thigh, hip to knee")),
    calf: (T("Gastrocnemius, soleus and Achilles")) };
  /* Smooth outline through points (Catmull-Rom to Bezier). */
  function smoothPath(pts) {
    var d = "M" + pts[0][0] + "," + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + "," + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + "," + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0] + "," + p2[1];
    }
    return d + " Z";
  }
  function mirrorD(d) { return d.replace(/(-?[\d.]+),(-?[\d.]+)/g, function (m, x, y) { return (200 - +x) + "," + y; }); }
  /* Figure shapes: the same muscle map is reshaped per sex. Factors scale distance from the midline at each height. */
  var MALE_F = [[0, 0.9], [300, 0.9]], FEM_F = [[0, 0.8], [80, 0.8], [112, 0.75], [138, 0.9], [162, 0.93], [200, 0.9], [240, 0.87], [300, 0.87]];
  function shapeX(x, y, fem) {
    var TT = fem ? FEM_F : MALE_F, f = 1;
    if (x <= 63 && y > 52 && y < 182) f = fem ? 0.84 : 0.9;
    else for (var i = 0; i < TT.length - 1; i++) { var a = TT[i], b = TT[i + 1]; if (y >= a[0] && y <= b[0]) { f = a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0]); break; } }
    return +(100 + (x - 100) * f).toFixed(1);
  }
  function shapeD(d, fem) { return d.replace(/(-?[\d.]+),(-?[\d.]+)/g, function (m, x, y) { return shapeX(+x, +y, fem) + "," + y; }); }
  function isFem() { return S.settings.sex === "f"; }
  var BODY_PTS = [[92, 34], [91, 44], [80, 47], [69, 50], [60, 56], [56, 68], [53, 90], [49, 110], [45, 134], [43, 154], [40, 166], [44, 176], [49, 168], [51, 154], [56, 130], [60, 112],
      [63, 92], [66, 80], [70, 96], [72, 114], [68, 136], [66, 160], [68, 190], [72, 212], [70, 234], [74, 254], [79.5, 270], [76, 281], [91, 284], [89, 270], [90, 252], [92, 232], [93, 212], [95, 182], [100, 160]];
  function bodyD(fem) {
    var L = BODY_PTS.map(function (p) { return [shapeX(p[0], p[1], fem), p[1]]; });
    var R = L.slice(0, -1).reverse().map(function (p) { return [+(200 - p[0]).toFixed(1), p[1]]; });
    return smoothPath(L.concat(R));
  }
  var BODY_D_OLD = (function () {
    var L = [[92, 34], [91, 44], [80, 47], [69, 50], [60, 56], [56, 68], [53, 90], [49, 110], [45, 134], [43, 154], [40, 166], [44, 176], [49, 168], [51, 154], [56, 130], [60, 112],
      [63, 92], [66, 80], [70, 96], [72, 114], [68, 136], [66, 160], [68, 190], [72, 212], [70, 234], [74, 254], [79.5, 270], [76, 281], [91, 284], [89, 270], [90, 252], [92, 232], [93, 212], [95, 182], [100, 160]];
    var R = L.slice(0, -1).reverse().map(function (p) { return [200 - p[0], p[1]]; });
    return smoothPath(L.concat(R));
  })();
  /* Muscle shapes drawn on the left side of the figure and mirrored. */
  var MSH = {
    front: [["sh", "M70,50 Q58,52 56,64 Q57,74 62,79 Q66,68 73,58 Z", [60, 66]],
      ["ch", "M98,53 L77,53 Q67,59 66,71 Q74,82 90,81 Q98,79 99,70 Z", [84, 68]],
      ["core", "M88,86 L98,86 L98,96 L88,96 Z M88,98 L98,98 L98,108 L88,108 Z M88,110 L98,110 L98,120 L88,120 Z M89,122 L98,122 L98,134 L90,134 Z M72,86 Q80,84 86,88 L86,128 Q79,130 73,118 Z", [100, 112], true],
      ["fa", "M51,112 Q46,126 45,140 Q46,150 48,155 Q52,148 54,136 Q57,122 59,112 Z", [44, 132]],
      ["hf", "M87,137 Q80,140 81,151 Q87,158 94,158 Q96,148 94,140 Z", [86, 150]],
      ["quad", "M71,158 Q68,182 72,206 Q80,214 88,210 Q93,190 90,166 Q84,156 77,153 Z", [80, 186]],
      ["add", "M93,160 Q90,176 92,198 Q96,192 98,173 L99,162 Z", [100, 182], true]],
    back: [["sh", "M70,50 Q58,52 56,64 Q57,74 62,79 Q66,68 73,58 Z", [60, 66]],
      ["ub", "M100,38 L89,46 L73,52 Q84,60 92,74 L100,92 L108,74 Q116,60 127,52 L111,46 Z", [100, 62], true, true],
      ["lat", "M72,64 Q66,78 70,96 Q78,111 91,118 L95,104 Q88,86 80,64 Z", [78, 92]],
      ["lb", "M92,98 L97,98 L97,132 L89,132 Q88,116 92,98 Z", [100, 120], true],
      ["gl", "M99,135 L81,135 Q71,141 70,154 Q76,168 92,166 Q99,162 99,154 Z", [86, 152]],
      ["ham", "M72,168 Q70,190 76,208 L84,212 Q92,200 94,176 Q87,168 79,166 Z", [83, 190]],
      ["calf", "M75,224 Q70,238 74,252 Q79,262 84,256 Q90,244 90,232 Q86,222 79,221 Z", [82, 240]]]
  };
  function bodyMap() {
    var sel = function (id) { return MG_SEL.indexOf(id) >= 0; };
    var mname = {}; MUSCLES.forEach(function (m) { mname[m[0]] = m[1]; });
    var fem = isFem();
    var view = function (key, lbl) {
      var shapes = "", labels = "";
      MSH[key].forEach(function (m) {
        var src = shapeD(fem && m[0] === "ch" && key === "front" ? "M98,60 L82,58 Q70,62 70,75 Q75,88 88,88 Q97,87 99,78 Z" : m[1], fem), d = src + (m[4] ? "" : " " + mirrorD(src));
        shapes += '<path class="mg' + (sel(m[0]) ? " on" : "") + '" data-act="mg" data-id="' + m[0] + '" d="' + d + '" role="button" tabindex="0" aria-pressed="' + sel(m[0]) + '" aria-label="' + esc(mname[m[0]] + ", " + (key === "front" ? T("front") : T("back"))) + '"><title>' + esc(mname[m[0]]) + "</title></path>";
        if (sel(m[0])) labels += '<text class="mlbl" x="' + (m[3] ? 100 : shapeX(m[2][0], m[2][1], fem)) + '" y="' + m[2][1] + '">' + esc(mname[m[0]].split((" " + T("and") + " "))[0]) + "</text>";
      });
      var spine = key === "back" ? '<line class="spine" x1="100" y1="44" x2="100" y2="134"/>' : '<line class="spine" x1="100" y1="84" x2="100" y2="134"/>';
      return '<figure><svg viewBox="22 -4 156 294" role="group" aria-label="' + T(key === "front" ? "Front view of the body" : "Back view of the body") + '"><path class="skin" d="' + bodyD(fem) + '"/>' + (fem ? '<ellipse class="skin" cx="100" cy="4" rx="8.5" ry="6.5"/>' : "") + '<ellipse class="skin" cx="100" cy="20" rx="' + (fem ? 14.5 : 15.5) + '" ry="18"/>' + spine + shapes + labels + "</svg><figcaption>" + lbl + "</figcaption></figure>";
    };
    var info = "", lastG = MG_LAST && MG_LAST.indexOf("g:") === 0 ? MGROUPS.filter(function (g) { return "g:" + g[0] === MG_LAST; })[0] : null;
    if (lastG && groupOn(lastG)) {
      var gn = ST.filter(function (s) { return lastG[2].some(function (m) { return s.m.indexOf(m) >= 0; }); }).length;
      var names = lastG[2].map(function (m) { return mname[m].split((" " + T("and") + " "))[0].toLowerCase(); }); names[0] = names[0].charAt(0).toUpperCase() + names[0].slice(1);
      info = '<div class="mginfo"><b>' + esc(lastG[1]) + "</b><span>" + esc(names.slice(0, -1).join(", ") + (" " + T("and") + " ") + names[names.length - 1]) + " · " + gn + " " + T("moves") + "</span></div>";
    } else if (MG_LAST && sel(MG_LAST)) {
      var n = ST.filter(function (s) { return s.m.indexOf(MG_LAST) >= 0; }).length;
      info = '<div class="mginfo"><b>' + esc(mname[MG_LAST]) + "</b><span>" + esc(MDESC[MG_LAST]) + " · " + n + " " + T("moves") + "</span></div>";
    } else if (MG_SEL.length) info = ('<div class="mginfo"><b>' + T("Selected") + '</b><span>') + MG_SEL.map(function (m) { return esc(mname[m]); }).join(", ") + "</span></div>";
    else info = ('<div class="mginfo muted"><span>' + T("Tap a muscle on the body to select it.") + '</span></div>');
    return ('<div class="card bodymap"><h3>' + T("Which muscles?") + '</h3><p class="small muted">' + T("Tap one or more muscles to see moves that stretch them.") + '</p><div class="bm-figs">') + view("front", (T("Front"))) + view("back", (T("Back"))) + "</div>" + info +
      ('<p class="small muted bm-lbl">' + T("Muscle groups") + ' <span class="swipe-hint">' + T("swipe or use the arrows") + '</span></p>') + chipRow(MGROUPS.map(function (g) { return '<button class="chip' + (groupOn(g) ? " on" : "") + '" data-act="mgg" data-id="' + g[0] + '">' + g[1] + "</button>"; }).join("")) +
      ('<p class="small muted bm-lbl">' + T("Muscles") + '</p>') + chipRow((MG_SEL.length ? ('<button class="chip clear" data-act="mg-clear">' + T("Clear") + '</button>') : "") + MUSCLES.map(function (m) { return '<button class="chip' + (sel(m[0]) ? " on" : "") + '" data-act="mg" data-id="' + m[0] + '">' + m[1] + "</button>"; }).join("")) + "</div>";
  }
  /* Sideways-scrolling chip rows with arrow buttons and edge fades, so it's obvious there's more to see. */
  function chipRow(inner) {
    return '<div class="chiprow at-start"><button class="cr-arrow cr-left" data-act="cr" data-id="-1" aria-label="' + T("Scroll left") + '">' + ICON_CHEV_L + '</button><div class="chips">' + inner +
      '</div><button class="cr-arrow cr-right" data-act="cr" data-id="1" aria-label="' + T("Scroll right") + '">' + ICON_CHEV_R + "</button></div>";
  }
  var ICON_CHEV_L = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>';
  var ICON_CHEV_R = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  function rowState(row) {
    var c = row.querySelector(".chips"); if (!c) return; var max = c.scrollWidth - c.clientWidth;
    row.classList.toggle("at-start", c.scrollLeft <= 4); row.classList.toggle("at-end", c.scrollLeft >= max - 4); row.classList.toggle("no-scroll", max <= 4);
  }
  function wireRows(root, keep) {
    [].forEach.call(root.querySelectorAll(".chiprow"), function (row, i) {
      var c = row.querySelector(".chips"); if (keep && keep[i]) c.scrollLeft = keep[i];
      c.addEventListener("scroll", function () { rowState(row); }, { passive: true }); rowState(row);
    });
  }
  function isStandalone() { return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }
  function installCard() {
    return ('<div class="card install"><h3>' + T("Add to your Home Screen") + '</h3><p class="muted" style="margin-top:4px">' + T("It then opens full screen, works offline and iOS keeps your data safe.") + '</p><ol><li>' + T("Tap the Share button in Safari") + '</li><li>' + T("Choose") + ' <b>' + T("Add to Home Screen") + '</b></li><li>' + T("Open Mobility from the new icon") + '</li></ol></div>');
  }
  function routineCard(r) {
    if (!r) return "";
    var secs = routineSecs(r.items);
    return '<div class="card rcard" data-act="routine" data-id="' + esc(r.id) + '"><div class="thumb">' + art(r.items[0], BY[r.items[0]].pose, { stroke: 8, nobadge: true }) + '</div><div class="grow"><h3>' + esc(r.n) + "</h3><p>" + esc(r.sub) + " · " + r.items.length + (" " + T("moves ·") + " ") + mins(secs) + "</p></div>" + ICON.chev + "</div>";
  }

  /* ---------- TEST ---------- */
  var draft = null;
  function draftFor(date) { var t = S.tests.filter(function (x) { return x.date === date; })[0], cam = {}; (t && t.cam || []).forEach(function (k) { cam[k] = 1; }); return { date: date, v: Object.assign({}, t ? t.v : {}), cam: cam }; }
  function fieldsFor(t) {
    if (t.id === "squat") return [["squat_knee", (T("Knee angle °"))], ["squat_shin", (T("Shin lean °"))], ["squat_torso", (T("Torso lean °"))]];
    if (t.sides) return [[t.id + "_l", (T("Left") + " ") + t.u], [t.id + "_r", (T("Right") + " ") + t.u]];
    return [[t.id, (T("Result") + " ") + t.u]];
  }
  function renderTest() {
    if (!draft) draft = draftFor(iso());
    var h = ('<p class="muted">' + T("Warm up for 5 minutes first. Tap") + ' <b>' + T("Camera") + '</b> ' + T("on any test to measure it with live body tracking, or type a result in. Distances in cm are estimated from your height (")) + (S.settings.height || 178) + (' ' + T("cm, change it in Settings).") + '</p>');
    h += '<div class="card row"><label class="field" style="flex:1">' + T("Test date") + '<input type="date" id="t-date" value="' + draft.date + '" max="' + iso() + ('"></label><div class="grow" style="text-align:right"><span class="small muted">' + T("Score so far") + '</span><div style="font-size:28px;font-weight:780" id="t-live">–</div></div></div>');
    ZONES.concat([[null, (T("Squat check"))]]).forEach(function (z) {
      var ts = TESTS.filter(function (t) { return t.z === z[0]; }); if (!ts.length) return;
      h += '<div class="sec"><h2>' + (z[0] ? '<span class="zdot" style="background:' + zc(z[0]) + '"></span>' : "") + z[1] + '</h2><span class="pctpill" data-zone="' + (z[0] || "") + '"></span></div>';
      ts.forEach(function (t) {
        h += '<div class="card tcard" data-test="' + t.id + '"><div class="thead"><div class="thumb">' + art("t_" + t.id, t.pose, { stroke: 8 }) + '</div><div><h3>' + esc(t.n) + '</h3><p class="small muted">' + (t.noScore ? (T("Not scored. A check of your squat position.")) : (t.sides ? (T("Both sides")) : (T("One result"))) + " · " + t.u + ' · <span data-tp="' + t.id + '"></span>') + "</p></div></div>";
        h += ('<details><summary>' + T("How to do it") + '</summary><div class="how"><p>') + esc(t.how) + '</p>' + (photoUrl("t_" + t.id) ? '<img class="photo howphoto" loading="lazy" alt="' + esc(altFor("t_" + t.id)) + '" src="' + esc(photoUrl("t_" + t.id)) + '">' : "") + '</div></details>';
        h += '<div class="inputs">' + fieldsFor(t).map(function (f) { return '<label class="field">' + f[1] + '<input type="number" inputmode="decimal" step="any" data-k="' + f[0] + '" value="' + (isNum(draft.v[f[0]]) ? draft.v[f[0]] : "") + '"></label>'; }).join("");
        if (t.cam) h += '<button class="btn" data-act="cam" data-id="' + t.id + '" style="flex:none">' + ICON.cam.replace("<svg", '<svg width="20" height="20"') + (" " + T("Camera") + "</button>");
        h += "</div></div>";
      });
    });
    h += ('<div class="savebar"><button class="btn primary big block" data-act="save-test">' + T("Save test") + '</button></div>');
    $("#v-test").innerHTML = h;
    $$("#v-test details").forEach(function (d) { d.addEventListener("toggle", function () { if (d.open) animateIn(d); }); });
    $("#t-date").addEventListener("change", function (e) { var keep = draft.v; draft = draftFor(e.target.value || iso()); if (!S.tests.some(function (x) { return x.date === draft.date; })) draft.v = keep; renderTest(); });
    $$("#v-test input[data-k]").forEach(function (inp) { inp.addEventListener("input", function () { var x = parseFloat(inp.value); if (isNum(x)) draft.v[inp.getAttribute("data-k")] = x; else delete draft.v[inp.getAttribute("data-k")]; if (draft.cam) delete draft.cam[inp.getAttribute("data-k")]; liveScore(); }); });
    liveScore();
  }
  function liveScore() {
    var sc = score(draft.v);
    $("#t-live").textContent = isNum(sc.overall) ? sc.overall : "–";
    $$("#v-test [data-zone]").forEach(function (el) { var z = el.getAttribute("data-zone"); el.textContent = z && isNum(sc.zones[z]) ? sc.zones[z] + "%" : ""; el.hidden = !el.textContent; });
    TESTS.forEach(function (t) { var el = $('[data-tp="' + t.id + '"]'); if (el) { var p = testPct(t, draft.v); el.textContent = isNum(p) ? p + "%" : (T("not done")); } });
  }
  function saveTest() {
    var keys = Object.keys(draft.v).filter(function (k) { return isNum(draft.v[k]); });
    if (!keys.length) { toast((T("Enter at least one result first."))); return; }
    var v = {}; keys.forEach(function (k) { v[k] = draft.v[k]; });
    var cam = keys.filter(function (k) { return draft.cam && draft.cam[k]; });
    S.tests = S.tests.filter(function (x) { return x.date !== draft.date; }); S.tests.push({ date: draft.date, v: v, t: Date.now(), cam: cam }); save(); goalCheck(); cmSync();
    var sc = score(v); toast((T("Saved.") + " ") + (isNum(sc.overall) ? (T("Score") + " ") + sc.overall + "." : ""));
    draft = null; go("home");
  }

  /* ---------- ROUTINES ---------- */
  var LIB_F = "all", LIB_Q = "", building = null, RT_G = "foryou", RT_SP = null, RT_LF = "squat";
  /* Routines are grouped: For you (daily, your sport, everyday), By sport (Activate before, Recover after) and Before a lift. */
  function routineGroups() {
    var h = '<div class="seg rseg" role="tablist">' + [["foryou", T("For you")], ["sport", T("By sport")], ["lift", T("Before a lift")]].map(function (g) { return '<button role="tab" aria-selected="' + (RT_G === g[0]) + '" class="' + (RT_G === g[0] ? "on" : "") + '" data-act="rgroup" data-id="' + g[0] + '">' + g[1] + "</button>"; }).join("") + "</div>";
    var byId = function (id) { return findRoutine(id); };
    var label = function (t, sub) { return '<p class="rlabel"><b>' + t + "</b>" + (sub ? " · " + sub : "") + "</p>"; };
    if (RT_G === "sport") {
      var sports = SPORTS.filter(function (s) { return PRESETS.some(function (p) { return p.sport === s.id; }); });
      var fav = sportObj();
      if (fav) sports.sort(function (a, b) { return (b.id === fav.id) - (a.id === fav.id); });
      if (!RT_SP || !sports.some(function (s) { return s.id === RT_SP; })) RT_SP = fav && sports.some(function (s) { return s.id === fav.id; }) ? fav.id : sports[0].id;
      h += chipRow(sports.map(function (s) { return '<button class="chip' + (RT_SP === s.id ? " on" : "") + '" data-act="rsport" data-id="' + s.id + '">' + esc(s.n) + "</button>"; }).join(""));
      var mine = PRESETS.filter(function (p) { return p.sport === RT_SP; });
      mine.filter(function (p) { return p.kind === "activate"; }).forEach(function (p) { h += label(T("Activate"), T("before you train")) + routineCard(byId(p.id)); });
      mine.filter(function (p) { return p.kind === "recover"; }).forEach(function (p) { h += label(T("Recover"), T("after you train")) + routineCard(byId(p.id)); });
      var ex = mine.filter(function (p) { return p.kind === "extra"; });
      if (ex.length) { h += label(T("More for this sport"), ""); ex.forEach(function (p) { h += routineCard(byId(p.id)); }); }
    } else if (RT_G === "lift") {
      var lifts = D.LIFTS || [];
      if (!lifts.some(function (l) { return l[0] === RT_LF; })) RT_LF = lifts[0][0];
      h += chipRow(lifts.map(function (l) { return '<button class="chip' + (RT_LF === l[0] ? " on" : "") + '" data-act="rlift" data-id="' + l[0] + '">' + esc(l[1]) + "</button>"; }).join(""));
      PRESETS.filter(function (p) { return p.lift === RT_LF; }).forEach(function (p) { h += routineCard(byId(p.id)); });
      h += '<p class="small muted rnote">' + T("Do it just before your warm-up sets. Dynamic moves first, then short holds, so you stay ready to lift.") + "</p>";
    } else {
      h += routineCard(byId("daily"));
      var fs = sportObj();
      if (fs) { var fp = PRESETS.filter(function (p) { return p.sport === fs.id && (p.kind === "activate" || p.kind === "recover"); }); if (fp.length) { h += label(esc(fs.n), ""); fp.forEach(function (p) { h += routineCard(byId(p.id)); }); } }
      var every = PRESETS.filter(function (p) { return !p.auto && !p.sport && !p.lift; });
      if (every.length) { h += label(T("Everyday"), ""); every.forEach(function (p) { h += routineCard(byId(p.id)); }); }
      if (S.routines.length) { h += label(T("Your routines"), ""); allRoutines().filter(function (r) { return r.custom; }).forEach(function (r) { h += routineCard(r); }); }
      if (!fs) h += '<p class="small muted rnote">' + T("Pick your sport in Settings to see its routines here, or browse By sport.") + "</p>";
    }
    return h;
  }
  var TAGN = { warm: T("Warm-up"), cool: T("Cool-down"), back: T("Back"), run: T("Running"), hyrox: T("Hyrox"), golf: T("Golf"), cycle: T("Cycling"), desk: T("Desk"), bed: T("On a bed"), sleep: T("Sleep") };
  function renderRoutines() {
    var h = ('<div class="sec" style="margin-top:6px"><h2>' + T("Routines") + '</h2><button class="btn ghost" data-act="build">' + T("+ Build your own") + '</button></div>') + qwCard();
    h += routineGroups();
    h += ('<div class="sec"><h2>' + T("Stretch library") + '</h2><span class="small muted">') + ST.length + " " + T("moves") + "</span></div>";
    var hasVid = ST.some(function (s) { return vidUrl(s.id); }); if (LIB_F === "video" && !hasVid) LIB_F = "all";
    var F = [["all", (T("All"))]].concat(hasVid ? [["video", '<span class="chipvid" aria-hidden="true">' + VBADGE + "</span>" + T("With video")]] : []).concat(ZONES).concat([["warm", (T("Warm-up"))], ["cool", (T("Cool-down"))], ["back", (T("Back"))], ["run", (T("Running"))], ["hyrox", (T("Hyrox"))], ["golf", (T("Golf"))], ["cycle", (T("Cycling"))], ["desk", (T("Desk"))], ["bed", (T("On a bed"))], ["sleep", (T("Sleep"))]]);
    h += '<div class="libsearch"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" class="inp" id="lib-q" placeholder="' + esc(T("Search by move name")) + '" aria-label="' + esc(T("Search the stretch library")) + '" value="' + esc(LIB_Q) + '" autocomplete="off" enterkeyhint="search"></div>';
    h += chipRow(F.map(function (f) { return '<button class="chip' + (LIB_F === f[0] ? " on" : "") + '" data-act="filter" data-id="' + f[0] + '">' + f[1] + "</button>"; }).join(""));
    if (building) h += bodyMap();
    var list = ST.filter(function (s) { return canDo(s) && (LIB_F === "all" || (LIB_F === "video" && !!vidUrl(s.id)) || s.z.indexOf(LIB_F) >= 0 || s.tags.indexOf(LIB_F) >= 0) && (!building || !MG_SEL.length || MG_SEL.some(function (m) { return s.m.indexOf(m) >= 0; })); });
    var abc = function (a, b) { return String(a.n).localeCompare(String(b.n), I18N.lang || "en", { sensitivity: "base", numeric: true }); };
    list.sort(abc);
    if (building && MG_SEL.length) list.sort(function (a, b) { var c = function (s) { return MG_SEL.filter(function (m) { return s.m.indexOf(m) >= 0; }).length; }; return (c(b) - c(a)) || abc(a, b); });
    if (ST.some(function (s) { return vidUrl(s.id); })) h += '<p class="small muted vlegend">' + VBADGE + " " + T("Moves with this badge have a video demo") + "</p>";
    h += '<p class="muted small" id="lib-none" style="margin:10px 2px"' + (list.length ? " hidden" : "") + '>' + T("No moves match. Try another area or filter.") + '</p>';
    h += '<div class="lib' + (building ? " building" : "") + '">' + list.map(function (s) {
      var sel = building && building.items.indexOf(s.id) >= 0;
      return '<button class="lcard' + (sel ? " sel" : "") + '" data-act="stretch" data-id="' + s.id + '" data-q="' + esc(libText(s)) + '"><div class="fig">' + art(s.id, s.pose, { stroke: 8 }) + '</div><span class="check">' + (sel ? building.items.indexOf(s.id) + 1 : "") + "</span><h3>" + esc(s.n) + "</h3><p>" + s.z.map(function (z) { return '<span class="zdot" style="background:' + zc(z) + '"></span>'; }).join("") + (s.reps || (s.d + "s" + (s.s ? (" " + T("each side")) : ""))) + "</p></button>";
    }).join("") + "</div>";
    if (building) h += '<div class="buildbar"><div class="grow"><b>' + building.items.length + ' ' + T("selected") + '</b><div class="small" style="opacity:.75">' + mins(routineSecs(building.items)) + ('</div></div><button class="btn" data-act="build-cancel">' + T("Cancel") + '</button><button class="btn primary" data-act="build-save"') + (building.items.length ? "" : " disabled") + ">" + T("Save") + "</button></div>";
    var keep = [].map.call(document.querySelectorAll("#v-routines .chiprow .chips"), function (c) { return c.scrollLeft; });
    $("#v-routines").innerHTML = h; wireRows($("#v-routines"), keep);
    var q = $("#lib-q"); if (q) { q.addEventListener("input", function () { LIB_Q = q.value; libSearch(); }); libSearch(); }
  }
  /* Library search: matches the move name only (and its English name in other languages), ignoring case and accents. Filters in place so typing keeps focus. */
  function fold(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function libText(s) { var en = s._en || {}; return fold([s.n, en.n || ""].join(" ")); }
  function libSearch() {
    var words = fold(LIB_Q).split(/\s+/).filter(Boolean), shown = 0;
    $$("#v-routines .lcard").forEach(function (c) { var t = c.getAttribute("data-q") || ""; var ok = words.every(function (w) { return t.indexOf(w) >= 0; }); c.hidden = !ok; if (ok) shown++; });
    var none = $("#lib-none"); if (none) none.hidden = shown > 0;
    var cnt = $("#v-routines .sec .small.muted"); if (cnt && cnt.parentNode.querySelector("h2") && cnt.parentNode.querySelector("h2").textContent === T("Stretch library")) cnt.textContent = (words.length ? shown + " / " + $$("#v-routines .lcard").length : ST.length) + " " + T("moves");
  }
  /* ---------- Quick routine: pick a time, what to work on and when, and the app builds a routine that fits ---------- */
  var QW = null, QW_TIMES = [5, 10, 20];
  var SPORT_TAG = { hyrox: "hyrox", running: "run", golf: "golf", cycling: "cycle", office: "desk" };
  function qwCard() { return '<button class="card qwcard" data-act="qw-open"><div class="qwico">' + ICON.play.replace("<svg", '<svg width="22" height="22"') + '</div><div class="grow"><h3>' + T("Make me a routine") + '</h3><p class="small muted">' + T("Pick 5, 10 or 20 minutes and what to work on") + "</p></div></button>"; }
  function qwOpen() { var sp = sportObj(); QW = { step: 1, mins: 10, groups: [], muscles: [], sport: sp ? sp.id : "", when: "any", seed: 1, items: null }; openSheet('<div id="qw"></div>'); qwRender(); }
  function qwCost(s) { return itemSecs(s) + restSecs(true) + (s.s ? restSecs(false) : 0); }
  function qwSecs(items) { return items.reduce(function (t, id) { return t + (BY[id] ? qwCost(BY[id]) : 0); }, 0); }
  function qwTargets() { var m = QW.muscles.slice(); QW.groups.forEach(function (g) { var gg = MGROUPS.filter(function (x) { return x[0] === g; })[0]; if (gg) gg[2].forEach(function (k) { if (m.indexOf(k) < 0) m.push(k); }); }); return m; }
  /* Score every move you can do, then fill the time with the best ones, spreading across body areas so it is not all one stretch. */
  function qwBuild() {
    var target = QW.mins * 60, mus = qwTargets(), sp = QW.sport ? SPORTS.filter(function (x) { return x.id === QW.sport; })[0] : null, tag = sp ? SPORT_TAG[sp.id] : null, hurt = fb().hurt;
    var rnd = seededShuffle(ST.map(function (s, i) { return i; }), QW.seed), jit = {}; ST.forEach(function (s, i) { jit[s.id] = rnd.indexOf(i) / ST.length * 1.5; });
    var pool = ST.filter(function (s) { return canDo(s) && !hurt[s.id]; }).map(function (s) {
      var hit = mus.filter(function (m) { return s.m.indexOf(m) >= 0; }).length, sc = jit[s.id];
      if (mus.length) sc += hit ? 4 + hit * 2 : -6;
      if (sp) { if (sp.top.indexOf(s.id) >= 0) sc += 6; if (tag && s.tags.indexOf(tag) >= 0) sc += 3; }
      if (QW.when === "before") { if (s.tags.indexOf("warm") >= 0) sc += 4; if (s.reps) sc += 2; if (s.tags.indexOf("cool") >= 0 || s.tags.indexOf("sleep") >= 0) sc -= 3; }
      if (QW.when === "after") { if (s.tags.indexOf("cool") >= 0) sc += 4; if (s.reps) sc -= 3; if (s.tags.indexOf("warm") >= 0 && s.tags.indexOf("cool") < 0) sc -= 1; }
      if (s.tags.indexOf("bed") >= 0 && QW.when !== "after") sc -= 2;
      return { s: s, sc: sc, hit: hit };
    });
    var out = [], used = 0, zc = {};
    while (pool.length) {
      pool.forEach(function (p) { p.eff = p.sc - p.s.z.reduce(function (t, z) { return t + (zc[z] || 0) * (mus.length || sp ? 1 : 2.5); }, 0); });
      pool.sort(function (a, b) { return b.eff - a.eff; });
      var left = target - used, k = -1;
      for (var i = 0; i < pool.length; i++) { if (qwCost(pool[i].s) <= left + 20) { k = i; break; } }
      if (k < 0) break;
      var p = pool.splice(k, 1)[0]; out.push(p.s); used += qwCost(p.s); p.s.z.forEach(function (z) { zc[z] = (zc[z] || 0) + 1; });
      if (target - used < 25) break;
    }
    /* Order: moving drills first before training, calm floor holds last after training. */
    var rank = function (s) { var r = 0; if (s.reps) r -= QW.when === "after" ? 0 : 2; if (s.tags.indexOf("sleep") >= 0) r += 2; if (s.tags.indexOf("bed") >= 0) r += 1; return r; };
    out.sort(function (a, b) { return rank(a) - rank(b); });
    QW.items = out.map(function (s) { return s.id; });
  }
  function qwName() {
    var bits = [], sp = QW.sport ? SPORTS.filter(function (x) { return x.id === QW.sport; })[0] : null;
    if (sp) bits.push(sportShort(sp));
    QW.groups.forEach(function (g) { var gg = MGROUPS.filter(function (x) { return x[0] === g; })[0]; if (gg) bits.push(gg[1]); });
    var mname = {}; MUSCLES.forEach(function (m) { mname[m[0]] = m[1]; }); QW.muscles.forEach(function (m) { bits.push(mname[m]); });
    var when = { before: T("before training"), after: T("after training") }[QW.when];
    var focus = bits.length ? listJoin(bits.slice(0, 3)) : T("Whole body");
    return TF("{n} min {focus}", { n: QW.mins, focus: focus.charAt(0).toUpperCase() + focus.slice(1) }) + (when ? " · " + when : "");
  }
  function qwRender() {
    var box = $("#qw"); if (!box || !QW) return; var h = '<p class="small muted qwstep">' + TF("Step {n} of 3", { n: Math.min(QW.step, 3) }) + "</p>";
    if (QW.step === 1) {
      h += "<h2>" + T("How long have you got?") + '</h2><div class="qwtimes">' + QW_TIMES.map(function (m) { return '<button class="qwtime' + (QW.mins === m ? " on" : "") + '" data-act="qw-time" data-id="' + m + '"><b>' + m + "</b><span>" + T("min") + "</span></button>"; }).join("") + "</div>";
    } else if (QW.step === 2) {
      var mname = MUSCLES;
      h += "<h2>" + T("What do you want to work on?") + '</h2><p class="small muted" style="margin:4px 0 10px">' + T("Pick any areas, a sport, or both. Leave it blank for a whole-body routine.") + "</p>";
      h += '<p class="small muted bm-lbl">' + T("Chains and areas") + '</p><div class="qwchips">' + MGROUPS.map(function (g) { return '<button class="chip' + (QW.groups.indexOf(g[0]) >= 0 ? " on" : "") + '" data-act="qw-group" data-id="' + g[0] + '">' + g[1] + "</button>"; }).join("") + "</div>";
      h += '<p class="small muted bm-lbl">' + T("Muscles") + '</p><div class="qwchips">' + mname.map(function (m) { return '<button class="chip' + (QW.muscles.indexOf(m[0]) >= 0 ? " on" : "") + '" data-act="qw-muscle" data-id="' + m[0] + '">' + m[1] + "</button>"; }).join("") + "</div>";
      h += '<p class="small muted bm-lbl">' + T("Sport you are training for") + '</p><div class="qwchips">' + [["", T("None")]].concat(SPORTS.map(function (s) { return [s.id, sportShort(s).charAt(0).toUpperCase() + sportShort(s).slice(1)]; })).map(function (s) { return '<button class="chip' + (QW.sport === s[0] ? " on" : "") + '" data-act="qw-sport" data-id="' + s[0] + '">' + esc(s[1]) + "</button>"; }).join("") + "</div>";
    } else if (QW.step === 3) {
      h += "<h2>" + T("When are you doing it?") + '</h2><div class="qwwhen">' + [["before", T("Before training"), T("Moving drills to warm up")], ["after", T("After training"), T("Longer holds to cool down")], ["any", T("Any time"), T("A mix of both")]].map(function (w) { return '<button class="qwopt' + (QW.when === w[0] ? " on" : "") + '" data-act="qw-when" data-id="' + w[0] + '"><b>' + w[1] + "</b><span>" + w[2] + "</span></button>"; }).join("") + "</div>";
    } else {
      if (!QW.items) qwBuild();
      var secs = qwSecs(QW.items);
      h = '<p class="small muted qwstep">' + T("Your routine") + "</p><h2>" + esc(qwName()) + '</h2><p class="muted" style="margin:4px 0 12px">' + QW.items.length + " " + T("moves") + " · " + TF("about {t}", { t: mins(secs) }) + "</p>";
      if (!QW.items.length) h += '<p class="muted">' + T("No moves fit those choices with your equipment. Try fewer areas or another sport.") + "</p>";
      else {
        h += '<button class="btn primary big block" data-act="qw-start">' + ICON.play.replace("<svg", '<svg width="20" height="20"') + " " + T("Start") + "</button>";
        h += '<div class="card flush" style="margin-top:14px">' + QW.items.map(function (sid, i) { var s = BY[sid]; return '<div class="hitem" data-act="stretch" data-id="' + sid + '" style="cursor:pointer"><div class="thumb" style="width:52px;height:52px">' + art(sid, s.pose, { stroke: 9 }) + '</div><div class="grow"><b>' + (i + 1) + ". " + esc(s.n) + '</b><div class="small muted">' + (s.reps || holdSecs(s) + "s") + (s.s ? " " + T("each side") : "") + "</div></div></div>"; }).join("") + "</div>";
        h += '<div class="row" style="margin-top:8px"><button class="btn" data-act="qw-shuffle">' + T("Shuffle") + '</button><button class="btn" data-act="qw-save">' + T("Save routine") + "</button></div>";
      }
      h += '<button class="btn ghost block" style="margin-top:6px" data-act="qw-back">' + T("Change choices") + "</button>";
      box.innerHTML = h; return;
    }
    h += '<div class="row qwnav">' + (QW.step > 1 ? '<button class="btn" data-act="qw-back">' + T("Back") + "</button>" : "") + '<button class="btn primary grow" data-act="qw-next">' + (QW.step === 3 ? T("Build my routine") : T("Next")) + "</button></div>";
    box.innerHTML = h;
  }
  function qwAct(act, id) {
    if (!QW) return false;
    var tog = function (arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); };
    switch (act) {
      case "qw-time": QW.mins = parseInt(id, 10); QW.step = 2; break;
      case "qw-group": tog(QW.groups, id); break;
      case "qw-muscle": tog(QW.muscles, id); break;
      case "qw-sport": QW.sport = id; break;
      case "qw-when": QW.when = id; QW.step = 4; QW.items = null; break;
      case "qw-next": QW.step = Math.min(4, QW.step + 1); QW.items = null; break;
      case "qw-back": QW.step = QW.step === 4 ? 3 : Math.max(1, QW.step - 1); break;
      case "qw-shuffle": QW.seed = (QW.seed * 7 + 13) % 997 || 3; QW.items = null; break;
      case "qw-start": closeSheet(); play({ id: "quick", n: qwName(), items: QW.items.slice() }); return true;
      case "qw-save": { var nm = prompt(T("Name your routine"), qwName()); if (nm == null) return true; nm = nm.trim() || qwName(); S.routines.push({ id: "u" + Date.now().toString(36), n: nm, items: QW.items.slice() }); save(); toast(T("Saved") + " " + nm); render(); return true; }
      default: return false;
    }
    qwRender(); var sh = $("#sheet"); if (sh && (act === "qw-next" || act === "qw-back" || act === "qw-time" || act === "qw-when")) sh.scrollTop = 0;
    return true;
  }
  function openRoutine(id) {
    var r = findRoutine(id); if (!r) return; var ad = adapt(r.items);
    var h = '<h2>' + esc(r.n) + '</h2><p class="muted" style="margin:4px 0 14px">' + esc(r.sub) + " · " + mins(routineSecs(ad.items)) + "</p>";
    if (ad.notes.length) h += '<div class="adnote small">' + ad.notes.map(function (n) { return "<div>" + esc(adaptNote(n)) + "</div>"; }).join("") + "</div>";
    h += '<button class="btn primary big block" data-act="play" data-id="' + esc(r.id) + '">' + ICON.play.replace("<svg", '<svg width="20" height="20"') + (" " + T("Start") + "</button>");
    h += '<div class="card flush" style="margin-top:14px">' + ad.items.map(function (sid, i) { var s = BY[sid]; return '<div class="hitem" data-act="stretch" data-id="' + sid + '" style="cursor:pointer"><div class="thumb" style="width:52px;height:52px">' + art(sid, s.pose, { stroke: 9 }) + '</div><div class="grow"><b>' + (i + 1) + ". " + esc(s.n) + '</b><div class="small muted">' + (s.reps || s.d + "s") + (s.s ? (" " + T("each side")) : "") + "</div></div></div>"; }).join("") + "</div>";
    if (r.custom) h += '<div class="row" style="margin-top:8px"><button class="btn" data-act="edit-routine" data-id="' + esc(r.id) + '">' + T("Edit") + '</button><button class="btn danger" data-act="del-routine" data-id="' + esc(r.id) + '">' + T("Delete") + '</button></div>';
    openSheet(h);
  }
  /* The list a movement was opened from, so the sheet can step to the previous or next one. */
  var SNAV = null;
  function stretchNavFrom(el) {
    var box = el && (el.closest(".lib, .picks, .card, .sec") || el.parentElement);
    if (!box) return null;
    var seen = {}, list = [];
    Array.prototype.forEach.call(box.querySelectorAll('[data-act="stretch"]'), function (b) {
      var sid = b.getAttribute("data-id");
      if (!sid || !BY[sid] || seen[sid] || b.hidden || b.offsetParent === null) return;
      seen[sid] = 1; list.push(sid);
    });
    return list.length > 1 ? list : null;
  }
  function stretchNavBar(id) {
    if (!SNAV) return "";
    var i = SNAV.indexOf(id); if (i < 0) return "";
    var prev = i > 0 ? SNAV[i - 1] : null, next = i < SNAV.length - 1 ? SNAV[i + 1] : null;
    var btn = function (dir, sid, label) {
      return '<button class="btn snavb" data-act="stretch-nav" data-id="' + (sid || "") + '"' + (sid ? "" : " disabled") + ' aria-label="' + esc(label + (sid ? ": " + BY[sid].n : "")) + '">' + (dir < 0 ? "‹" : "›") + "</button>";
    };
    return '<div class="snav">' + btn(-1, prev, T("Previous movement")) + '<span class="small muted">' + TF("{n} of {total}", { n: i + 1, total: SNAV.length }) + "</span>" + btn(1, next, T("Next movement")) + "</div>";
  }
  function openStretch(id, nav) {
    if (nav !== undefined) SNAV = nav;
    var s = BY[id];
    var pu = photoUrl(id);
    /* A demo video already shows the movement, so the drawn figure is only offered for still photos. */
    var hasVid = !!vidUrl(id);
    var h = (pu && hasVid ? '<div class="bigfig photo-wrap">' + bigPhoto(id, "", s.n) + "</div>" : pu ? '<div class="bigfig photo-wrap">' + bigPhoto(id, "", s.n) + ('</div><details class="small" style="margin:-6px 0 12px"><summary style="color:var(--brand);font-weight:600">' + T("Show the movement") + '</summary><div class="bigfig" data-anim="s:') + id + '" style="margin-top:8px"></div></details>' : '<div class="bigfig" data-anim="s:' + id + '"></div>') + stretchNavBar(id) + '<h2>' + esc(s.n) + '</h2><p style="margin:6px 0">' + s.z.map(function (z) { return '<span class="tag"><span class="zdot" style="background:' + zc(z) + '"></span>' + ZN[z] + "</span>"; }).join("") + s.tags.map(function (t) { return '<span class="tag">' + esc(TAGN[t] || t) + "</span>"; }).join("") + "</p>";
    h += '<p class="muted" style="margin-bottom:6px">' + (s.reps ? esc(s.reps) + (T(", about") + " ") : (T("Hold") + " ")) + holdSecs(s) + " " + T("seconds") + (s.s ? (" " + T("each side")) : "") + ".</p><p>" + esc(s.cues) + "</p>";
    h += '<div class="row" style="margin-top:16px"><button class="btn primary grow" data-act="play-one" data-id="' + id + '">' + ICON.play.replace("<svg", '<svg width="18" height="18"') + (" " + T("Do it now") + "</button></div>");
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
  function enVoices() { var re = new RegExp("^" + I18N.lang + "[-_]", "i"); try { return speechSynthesis.getVoices().filter(function (v) { return re.test(v.lang) && !NOVELTY.test(v.name); }); } catch (e) { return []; } }
  function voiceScore(v) { var n = v.name + " " + (v.voiceURI || ""); return (/premium/i.test(n) ? 40 : /enhanced|neural|natural/i.test(n) ? 25 : 0) + (v.lang.replace("_", "-").toLowerCase() === I18N.locale.toLowerCase() ? 8 : 0) + (NICE.test(n) ? 5 : 0) + (v.localService ? 1 : 0); }
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
  /* ---------- Accessibility: captions of what the coach says, and text size ---------- */
  var CAPT = null;
  function caption(text, ms) {
    if (S.settings.captions === false || !text) return; var c = $("#caption"); if (!c) return;
    c.textContent = text; c.hidden = false; c.classList.add("on"); clearTimeout(CAPT);
    CAPT = setTimeout(function () { c.classList.remove("on"); setTimeout(function () { if (!c.classList.contains("on")) c.hidden = true; }, 300); }, ms);
  }
  function textScale() {
    var t = S.settings.textSize || "std";
    if (t === "phone") { try { var pr = document.createElement("span"); pr.style.font = "-apple-system-body"; pr.style.position = "absolute"; pr.style.visibility = "hidden"; pr.textContent = "x"; document.body.appendChild(pr); var px = parseFloat(getComputedStyle(pr).fontSize); pr.remove(); if (px > 0) return Math.max(1, Math.min(1.6, px / 17)); } catch (e) {} return 1; }
    return { std: 1, l: 1.15, xl: 1.3, xxl: 1.45 }[t] || 1;
  }
  function applyTextSize() { document.documentElement.style.setProperty("--ts", textScale()); document.documentElement.classList.toggle("bigtext", textScale() > 1.01); }
  applyTextSize();
  var SPEAK_AT = 0;
  function speak(text, interrupt, onStart) {
    SPEAK_AT = performance.now();
    if (text) caption(String(text), Math.max(2500, String(text).split(/\s+/).length / 2.6 * 1000 / (S.settings.voiceRate || 0.95) + 1800));
    if (!S.settings.voice || !window.speechSynthesis || !text) return false;
    try {
      if (interrupt) speechSynthesis.cancel();
      var v = bestVoice(), parts = String(text).match(/[^.!?]+[.!?]*/g) || [text];
      /* Duck the music straight away for roughly as long as this will take to say (about 2.6 words a second, plus a pause per sentence). */
      if (window.MUSIC) MUSIC.duckFor(String(text).split(/\s+/).length / 2.6 * 1000 / (S.settings.voiceRate || 0.95) + parts.length * 350 + 600);
      var asked = performance.now(), first = true;
      parts = parts.map(function (p) { return p.trim(); }).filter(Boolean);
      var tok = SPK.tok = (SPK.tok || 0) + 1, utts = [];
      parts.forEach(function (p, pi) { var u = new SpeechSynthesisUtterance(p); utts.push(u);
        if (pi === parts.length - 1 && window.MUSIC) u.onend = u.onerror = function () { if (tok === SPK.tok) MUSIC.speechEnd(); setTimeout(vidKick, 150); };
        if (first) { first = false; u.onstart = function () { var t = performance.now(); if (!interrupt || t - asked < 2000) SPK.lat = Math.round(0.7 * SPK.lat + 0.3 * Math.min(1500, t - asked)); if (onStart) onStart(t); }; } if (v) { u.voice = v; u.lang = v.lang; } else u.lang = I18N.locale; u.rate = S.settings.voiceRate || 0.95; u.pitch = 1; u.volume = 1; });
      /* On iPhone the music has to stop before the coach starts, otherwise iOS cuts the coach off a second or two in. */
      var hold = window.MUSIC && MUSIC.beforeSpeech ? MUSIC.beforeSpeech() : 0;
      var go = function () { utts.forEach(function (u) { speechSynthesis.speak(u); }); };
      if (hold) setTimeout(go, hold); else go();
      return true;
    } catch (e) { return false; }
  }
  function say(text) { speak(text, true); }
  /* 3, 2, 1 countdown played from short recorded clips through Web Audio, scheduled on the audio clock so the gaps are exactly one second.
     (The phone's speech engine starts after an unpredictable delay, which made spoken numbers uneven.) Clips: Piper TTS British voices. */
  var CDBUF = {}, CDLOAD = {};
  function cdMode() { var m = S.settings.countdown; m = m == null ? "m" : m; if (I18N.lang !== "en" && (m === "m" || m === "f")) m = "voice"; return m; }
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
    if (mode === "voice") return cdSpeech();
    if (!AC) { diag("no audio context, using voice"); return cdSpeech(); }
    if (AC.state !== "running") try { AC.resume(); } catch (e) {}
    if (!CDBUF[mode] && (mode === "f" || mode === "m")) cdLoad(mode);
    var lead = 0.06, TT = AC.currentTime + lead, cd = P.cd = { t0: performance.now() + lead * 1000, nodes: [] }, bufs = CDBUF[mode];
    for (var i = 0; i < 3; i++) {
      if (bufs) { var src = AC.createBufferSource(), g = AC.createGain(); src.buffer = bufs[i]; g.gain.value = 1; src.connect(g); g.connect(AC.destination); src.start(TT + i); cd.nodes.push(src); }
      else cd.nodes.push(tone(TT + i, 880, 0.15, 0.25));
    }
    cd.nodes.push(tone(TT + 3, 660, 0.5, 0.22), tone(TT + 3, 990, 0.6, 0.12)); /* soft "done" chime exactly on zero */
    if (window.MUSIC) MUSIC.duckFor(3600);
    /* Safety net: if the audio clock isn't actually moving (iOS can leave it suspended or "interrupted",
       e.g. after the speech engine has just spoken), drop the scheduled clips and count down with the voice instead. */
    cd.check = setTimeout(function () {
      if (!P || P.cd !== cd) return;
      if (AC.state !== "running" || AC.currentTime < TT + 0.15) {
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
      [[(T("Two")), 1000], [(T("One")), 2000]].forEach(function (n) { cd.timers.push(setTimeout(function () { if (P && P.cd === cd && !P.paused) speak(n[0], false); }, Math.max(0, n[1] - SPK.lat - (performance.now() - t)))); });
    };
    speak((T("Three")), true, go);
    cd.timers.push(setTimeout(function () { go(asked + SPK.lat); }, Math.max(600, SPK.lat + 400)));
  }
  function sayQ(text, urgent) { speak(text, urgent); }
  /* Set the audio session before any AudioContext exists so music and beeps play with the silent switch on, and the context isn't interrupted by a later change. */
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
  function unlockAudio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state !== "running") AC.resume(); if (window.speechSynthesis && !unlockAudio.spoke) { unlockAudio.spoke = true; var u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {} }
  var wake = null;
  function wakeOn() { try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () {}); } catch (e) {} }
  function wakeOff() { try { if (wake) wake.release(); } catch (e) {} wake = null; }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && (P || CAM.on)) wakeOn(); });

  function steps(items) {
    var out = [];
    items.forEach(function (id) { var s = BY[id]; if (!s) return; if (s.s) { out.push({ s: s, side: "Left", first: true }); out.push({ s: s, side: "Right" }); } else out.push({ s: s, first: true }); });
    return out;
  }
  var MUSIC_STYLES = [["off", (T("Off"))], ["pads", (T("Calm pads"))], ["bowls", (T("Singing bowls"))], ["ocean", (T("Ocean waves"))]];
  function musicOn() { return S.settings.music && S.settings.music !== "off"; }
  if (window.MUSIC) { MUSIC.log = function (m) { diag(m); }; setTimeout(function () { if (musicOn()) MUSIC.preload(S.settings.music, S.settings.musicVol); }, 2500); }
  function startMusic() {
    if (!window.MUSIC || !musicOn()) return; unlockAudio(); MUSIC.arm(S.settings.music, S.settings.musicVol); MUSIC.start(AC, S.settings.music, S.settings.musicVol); if (P && P.paused) MUSIC.pause(300);
    diag("music start " + S.settings.music + " vol " + S.settings.musicVol + ", audio " + (AC ? AC.state : "none"));
    setTimeout(function () { if (MUSIC.playing()) diag("music after 4s " + JSON.stringify(MUSIC.status())); }, 4000);
  }
  function play(routine) {
    unlockAudio(); if (window.MUSIC && musicOn()) MUSIC.arm(S.settings.music, S.settings.musicVol); cdLoad(cdMode()); /* music starts with the first hold, not during the get-ready countdown */
    var ad = adapt(routine.items); if (ad.notes.length) toast(ad.notes.map(adaptNote).join(". "));
    P = { r: routine, st: steps(ad.items), moves: ad.items.slice(), i: 0, phase: "prep", left: restSecs(true), total: 0, paused: false, worked: 0, last: performance.now(), stop: null, spoke: {} };
    var el = $("#player"); el.hidden = false; document.body.style.overflow = "hidden"; wakeOn();
    el.innerHTML = '<div class="ohead"><button class="icon-btn" data-act="p-close" aria-label="' + T("End session") + '">' + ICON.close + '</button><h2>' + esc(routine.n) + '</h2><button class="icon-btn" data-act="p-music" aria-label="' + T("Background music") + '">' + (musicOn() ? ICON.music : ICON.musicOff) + '</button><button class="icon-btn" data-act="p-voice" aria-label="' + T("Voice") + '">' + (S.settings.voice ? ICON.sound : ICON.mute) + '</button></div><div class="tline" id="p-tl" role="progressbar" aria-valuemin="0"><div class="tlbar" id="p-tlbar" aria-hidden="true"></div><div class="tlmeta"><span id="p-tlstage"></span><span id="p-tltime"></span></div></div>' +
      ('<div class="player"><div class="pfig"><span class="side" id="p-side" hidden></span><div class="figwrap" id="p-fig"></div><button class="chip figbtn" id="p-figbtn" data-act="p-fig" hidden>' + T("Show movement") + '</button></div><div class="pname" id="p-name" aria-live="polite"></div><div class="pcue" id="p-cue"></div><div class="padj" id="p-adj" role="group" aria-label="' + T("Adjust this move") + '"><button class="chip" data-act="p-easier" id="p-easier">' + T("Easier") + '</button><button class="chip" data-act="p-more" aria-label="' + T("Add 15 seconds") + '">+15s</button><button class="chip" data-act="p-harder" id="p-harder">' + T("Harder") + '</button></div>') +
      '<div class="phase" id="p-phase"></div><div class="clock"><div class="tring" id="p-ring" role="timer" aria-live="off"></div></div>' +
      '<div class="ctrls"><button class="icon-btn" data-act="p-prev" aria-label="' + T("Previous") + '">' + ICON.prev + '</button><button class="icon-btn play" data-act="p-pause" id="p-pp" aria-label="' + T("Pause") + '">' + ICON.pause + '</button><button class="icon-btn" data-act="p-next" aria-label="' + T("Next") + '">' + ICON.next + '</button></div><div class="upnext" id="p-up"></div><label class="mvol"><span aria-hidden="true">' + ICON.music + '</span><input type="range" id="p-mvol" min="0" max="1" step="0.05" value="' + S.settings.musicVol + '" aria-label="' + T("Music volume") + '"></label></div>';
    $("#p-mvol").addEventListener("input", function (e) { S.settings.musicVol = parseFloat(e.target.value); if (window.MUSIC) MUSIC.setVol(S.settings.musicVol); });
    $("#p-mvol").addEventListener("change", save);
    if (window.MUSIC && !musicOn() && MUSIC.keepAlive) MUSIC.keepAlive(true); msHandlers(true);
    enterStep(); P.timer = setInterval(tick, 200);
  }
  function stepDur(st) { return holdSecs(st.s); }
  /* Kit is worked out in English (from the English instructions) and translated for display. */
  var KIT = [[/\bband\b/i, "a band, towel or belt"], [/roller/i, "a foam roller or rolled towel"], [/broomstick/i, "a broomstick or towel"], [/\bwall\b|fence/i, "a wall"], [/bench|sofa/i, "a bench, sofa or bed"], [/door frame/i, "a door frame or wall edge"], [/stair|step or sturdy box/i, "a stair or step"], [/towel|belt/i, "a towel or belt"], [/pillow/i, "a pillow or two"], [/something sturdy|chair back/i, "something sturdy to hold"]];
  var KIT_FIX = { butterfly: ["a pillow or two, if you like"], edgeflexor: ["the edge of the bed"], passthru: ["a broomstick, towel or band"], legswing: ["something sturdy to hold"], breath9090: ["a sofa, bed or chair"], hipcircle: ["something to hold, if you like"], standquad: ["something to hold, if you like"], bander: ["a band or towel"], ohshold: ["a broomstick or towel"], stickrot: [], deepsquat: [], heelsup: ["something thin under your heels"], anklerock: ["a wall"], couch: ["a wall or sofa"], latbench: ["a bench, sofa, bed or chair"], hamtowel: ["a towel or belt"], bandham: ["a band, towel or belt"], tspineroll: ["a foam roller or rolled towel"], clubhinge: ["a broomstick or towel"], clubrot: ["a broomstick or towel"] };
  function kitEn(s) { if (KIT_FIX[s.id]) return KIT_FIX[s.id]; var en = s._en || s, txt = en.n + " " + en.cues, out = []; KIT.forEach(function (k) { if (k[0].test(txt) && out.indexOf(k[1]) < 0) out.push(k[1]); }); return out; }
  function kitFor(s) { return kitEn(s).map(function (k) { return T(k); }); }
  /* Equipment: each piece of kit can be covered by any of these. Things marked "if you like" or easily found aren't required. */
  var EQ = [["band", T("Resistance band")], ["roller", T("Foam roller")], ["stick", T("Broomstick or dowel")], ["towel", T("Towel or belt")], ["wall", T("A clear wall")], ["furniture", T("Bench, sofa, bed or chair")], ["door", T("Door frame")], ["step", T("Step or stair")], ["pillow", T("Pillow or cushion")]];
  /* Small line icons for each piece of kit (24x24, drawn in the text colour). */
  var EQICON = {
    band: '<ellipse cx="12" cy="12" rx="9" ry="5"/><ellipse cx="12" cy="12" rx="6" ry="2.6"/>',
    roller: '<ellipse cx="6" cy="12" rx="3" ry="5"/><path d="M6 7h12M6 17h12"/><ellipse cx="18" cy="12" rx="3" ry="5"/>',
    stick: '<path d="M4 20L20 4"/><circle cx="4" cy="20" r="1.2"/><circle cx="20" cy="4" r="1.2"/>',
    towel: '<path d="M5 4h12v14H5z"/><path d="M17 4c2 0 2.5 1.5 2.5 3v13H8c-1.7 0-3-1-3-2"/><path d="M5 14h12"/>',
    wall: '<path d="M3 5h18v14H3z"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>',
    furniture: '<path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/><path d="M3 11a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3z"/><path d="M5 16v3M19 16v3"/>',
    door: '<path d="M6 21V4h12v17"/><path d="M4 21h16"/><circle cx="15" cy="13" r="0.9"/>',
    step: '<path d="M3 20h6v-5h6v-5h6"/><path d="M3 20h18"/>',
    pillow: '<path d="M4 8c0-2 1-3 3-3h10c2 0 3 1 3 3v8c0 2-1 3-3 3H7c-2 0-3-1-3-3z"/><path d="M8 9c2 1 6 1 8 0"/>'
  };
  function eqIcon(k) { return '<svg class="eqi" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (EQICON[k] || "") + "</svg>"; }
  var EQREQ = { "a band, towel or belt": ["band", "towel"], "a foam roller or rolled towel": ["roller", "towel"], "a broomstick or towel": ["stick", "towel"], "a wall": ["wall"], "a bench, sofa or bed": ["furniture"],
    "a door frame or wall edge": ["door", "wall"], "a stair or step": ["step"], "a towel or belt": ["towel"], "a pillow or two": ["pillow", "furniture"], "something sturdy to hold": ["wall", "door", "furniture"],
    "the edge of the bed": ["furniture"], "a broomstick, towel or band": ["stick", "towel", "band"], "a sofa, bed or chair": ["furniture"], "a band or towel": ["band", "towel"], "a wall or sofa": ["wall", "furniture"], "a bench, sofa, bed or chair": ["furniture"] };
  function eqOn() { return !!S.settings.eqOn && Array.isArray(S.settings.eq); }
  function canDo(s) { if (!eqOn()) return true; var have = S.settings.eq; return kitEn(s).every(function (k) { var need = EQREQ[k]; return !need || need.some(function (e) { return have.indexOf(e) >= 0; }); }); }
  function missingKit(s) { var have = S.settings.eq || []; return kitEn(s).filter(function (k) { var need = EQREQ[k]; return need && !need.some(function (e) { return have.indexOf(e) >= 0; }); }).map(T); }

  /* Easier and harder alternatives, used for swaps in the player, for moves that hurt and for missing equipment. */
  var ALT = { couch: ["kneelhf"], kneelhf: ["edgeflexor", "couch"], edgeflexor: [null, "kneelhf"], pigeon: ["fig4"], fig4: [null, "pigeon"], ninety: ["fig4", "pigeon"], frog: ["butterfly", "pancake"],
    pancake: ["frog"], butterfly: [null, "frog"], pike: ["hamtowel"], bandham: [null, "pike"], hamtowel: [null, "pike"], elephant: ["hamfloss", "pike"], hamfloss: [null, "elephant"], downdog: ["calfwall"],
    calfwall: [null, "downdog"], soleus: ["calfwall"], deepsquat: ["heelsup", "ohshold"], heelsup: [null, "deepsquat"], ohshold: ["deepsquat"], cossack: ["frog"], latbench: ["childreach", "passthru"],
    childreach: [null, "latbench"], doorway: ["crossbody", "passthru"], passthru: ["wallslide", "ohshold"], wallslide: ["doorway", "passthru"], sleeper: ["crossbody", "bander"], crossbody: [null, "sleeper"],
    tspineroll: ["catcow", "openbook"], openbook: ["supinetwist", "thread"], thread: ["openbook", "quadrot"], quadrot: ["thread", "stickrot"], stickrot: ["quadrot"], catcow: [null, "tspineroll"], wgs: ["lungetwist"],
    lungetwist: ["legswing", "wgs"], legswing: ["hipcircle", "askip"], hipcircle: [null, "legswing"], deadbug: ["breath9090", "birddog"], birddog: ["deadbug"], standquad: ["sidequad", "couch"], sidequad: [null, "standquad"],
    happybaby: ["kneehug", "frog"], kneehug: [null, "happybaby"], wipers: [null, "supinetwist"], supinetwist: ["wipers", "openbook"], askip: ["hipcircle"], pogo: ["anklerock"], anklerock: ["calfwall"],
    clubrot: ["stickrot"], clubhinge: ["hamtowel"], foldfwd: ["hamtowel", "pike"], bander: ["crossbody"] };
  function altOf(id, dir) { var a = ALT[id]; var x = a ? a[dir === "hard" ? 1 : 0] : null; return x && BY[x] ? x : null; }

  /* Personal adjustments from session feedback: hold length scale and moves flagged as painful. */
  function fb() { if (!S.fb) S.fb = { scale: 1, hurt: {} }; return S.fb; }
  /* Swap or drop moves that hurt last time or need kit you don't have. Returns the items to use and notes on what changed. */
  function adapt(items) {
    var out = [], notes = [], hurt = fb().hurt;
    items.forEach(function (id) {
      var s = BY[id]; if (!s) return; var why = hurt[id] ? "hurt" : !canDo(s) ? "kit" : null;
      if (!why) return out.push(id);
      var alt = [altOf(id, "easy"), altOf(id, "hard")].filter(function (a) { return a && !hurt[a] && canDo(BY[a]) && items.indexOf(a) < 0 && out.indexOf(a) < 0; })[0];
      if (alt) out.push(alt);
      notes.push({ from: id, to: alt || null, why: why });
    });
    return { items: out, notes: notes };
  }
  function adaptNote(n) {
    var a = BY[n.from].n, why = n.why === "hurt" ? T("it hurt last time") : TF("needs {kit}", { kit: listJoin(missingKit(BY[n.from])) });
    return n.to ? TF("{a} swapped for {b} ({why})", { a: a, b: BY[n.to].n, why: why }) : TF("{a} skipped ({why})", { a: a, why: why });
  }
  function listJoin(xs) { return xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " " + T("and") + " " + xs[xs.length - 1]; }
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
    var b = $("#p-figbtn"); b.hidden = !has; b.textContent = P.figMode ? (T("Show photo")) : (T("Show movement"));
  }
  function enterStep(queue) {
    var st = P.st[P.i]; if (!st) return finish();
    cdClear(); P.phase = "prep"; P.left = restSecs(st.first); P.dur = P.left; P.spoke = {}; if (window.MUSIC) MUSIC.setQuiet(true);
    showFig(st);
    var kit = kitFor(st.s); $("#p-name").textContent = st.s.n; $("#p-cue").textContent = (kit.length ? (T("You'll need") + " ") + listJoin(kit) + ". " : "") + st.s.cues;
    var sd = $("#p-side"); sd.hidden = !st.side; sd.textContent = st.side ? T(st.side + " side") : "";
    var nx = P.st[P.i + 1]; $("#p-up").textContent = nx ? (T("Up next:") + " ") + nx.s.n + (nx.side ? " (" + T(nx.side.toLowerCase()) + ")" : "") : (T("Last one"));
    P.act = P.act || []; P.act[P.i] = { p: P.dur };
    $("#p-easier").disabled = !altOf(st.s.id, "easy"); $("#p-harder").disabled = !altOf(st.s.id, "hard");
    speak(st.first ? (P.i === 0 ? pick([(T("Let's start with") + " "), (T("First up,") + " "), (T("We'll begin with") + " ")]) : pick([(T("Next up,") + " "), (T("Okay, next is") + " "), (T("Moving on to") + " "), (T("Right, now") + " ")])) + (/^(es|fr|it|pt)$/.test(I18N.lang) ? st.s.n.charAt(0).toLowerCase() + st.s.n.slice(1) : st.s.n) + "." + (kit.length ? (" " + T("You'll need") + " ") + listJoin(kit) + "." : "") + (st.side ? pick([(" " + T("Left side first.")), (" " + T("We'll start on the left.")), (" " + T("Left side to begin."))]) : "") + (st.s.reps ? (" " + T("Aim for") + " ") + st.s.reps + "." : "") : pick([(T("Lovely. Switch to the right side.")), (T("Nice. Now the right side.")), (T("Good. Swap over to the right."))]), !queue);
    draw(); msUpdate();
  }
  /* Swap the current move for its easier or harder alternative, for the rest of this session. */
  function swapMove(dir) {
    if (!P || !P.st[P.i]) return; var cur = P.st[P.i].s.id, alt = altOf(cur, dir); if (!alt) return;
    var j = P.i; while (j > 0 && P.st[j - 1].s.id === cur) j--; var k = P.i; while (k < P.st.length && P.st[k].s.id === cur) k++;
    P.st.splice.apply(P.st, [j, k - j].concat(steps([alt]))); P.i = j;
    var mi = P.moves.indexOf(cur); if (mi >= 0) P.moves[mi] = alt; else P.moves.push(alt);
    toast(TF("Swapped for {name}", { name: BY[alt].n })); enterStep();
  }
  function addTime(sec) { if (!P || !P.st[P.i]) return; if (P.cd) { cdClear(); P.cd = null; } P.left += sec; P.dur += sec; if (P.act && P.act[P.i]) P.act[P.i][P.phase === "prep" ? "p" : "h"] = P.dur; P.spoke.half = P.left <= P.dur / 2 ? 1 : P.spoke.half; draw(); msUpdate(); }
  function togglePause() { if (!P) return; P.paused = !P.paused; if (P.paused) cdClear(); if (window.MUSIC) { if (P.paused) MUSIC.pause(1500); else MUSIC.resume(2000); } var b = $("#p-pp"); if (b) { b.innerHTML = P.paused ? ICON.play : ICON.pause; b.setAttribute("aria-label", P.paused ? T("Resume") : T("Pause")); } if (P.paused) try { speechSynthesis.cancel(); } catch (x) {} document.querySelectorAll("#p-fig video").forEach(function (v) { if (P.paused) v.pause(); else { var q = v.play(); if (q && q.catch) q.catch(function () {}); } }); draw(); msUpdate(); }
  /* Lock-screen and Control Centre: current move, time left, and pause, skip and +15s controls. */
  function msUpdate() {
    if (!("mediaSession" in navigator)) return; var ms = navigator.mediaSession;
    try {
      if (!P || !P.st[P.i]) { ms.metadata = null; ms.playbackState = "none"; return; }
      var st = P.st[P.i], ph = P.phase === "prep" ? (st.first ? T("Get into position") : T("Switch sides")) : T("Hold");
      var art = photoUrl(st.s.id), abs = function (u) { return new URL(u, location.href).href; };
      ms.metadata = new MediaMetadata({ title: st.s.n + (st.side ? " · " + T(st.side + " side") : ""), artist: ph + " · " + (P.i + 1) + "/" + P.st.length, album: P.r.n,
        artwork: [{ src: abs(art || "icons/icon-512.png"), sizes: "512x512", type: art ? "image/png" : "image/png" }] });
      ms.playbackState = P.paused ? "paused" : "playing";
      if (ms.setPositionState && P.dur > 0) ms.setPositionState({ duration: P.dur, position: Math.min(P.dur, Math.max(0, P.dur - P.left)), playbackRate: 1 });
    } catch (e) {}
  }
  function msHandlers(on) {
    if (!("mediaSession" in navigator)) return; var ms = navigator.mediaSession, set = function (a, f) { try { ms.setActionHandler(a, on ? f : null); } catch (e) {} };
    /* iOS sends a "pause" here when the coach's voice interrupts the audio, which isn't the user asking to pause. Ignore pauses around speech. */
    var speaking = function () { var sp = false; try { sp = speechSynthesis.speaking || speechSynthesis.pending; } catch (e) {} return sp || performance.now() - SPEAK_AT < 4000; };
    set("play", function () { diag("lock screen: play"); if (P && P.paused) togglePause(); });
    set("pause", function () { if (speaking()) { diag("lock screen: pause ignored (coach speaking)"); return; } diag("lock screen: pause"); if (P && !P.paused) togglePause(); });
    set("nexttrack", function () { if (P) { P.i++; enterStep(); } }); set("previoustrack", function () { if (P) { P.i = Math.max(0, P.i - 1); enterStep(); } });
    set("seekforward", function () { addTime(15); });
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
      if (after === 10 && (P.dur >= 30 || (P.dur > 15 && P.dur < 24))) say((T("10 seconds.")));
    } else if (after !== before && after <= 3 && after > 0) beep(660, 120);
    if (P.phase === "work" && P.dur >= 5 && cdMode() !== "off") {
      if (!P.cd && P.left <= 3.02 && P.left > 1) {
        try { cdStart(); diag("countdown: " + (P.cd ? (P.cd.timers ? "voice" : "clips") : "skipped") + ", audio " + (AC ? AC.state : "none") + ", clips " + (CDBUF[cdMode()] ? "ready" : "not loaded")); }
        catch (err) { diag("countdown failed: " + (err && err.message || err)); if (P) { if (P.cd) (P.cd.nodes || []).forEach(function (n) { try { n.stop(); } catch (x) {} }); P.cd = null; try { cdSpeech(); } catch (x) { diag("voice countdown failed: " + x.message); } } }
      }
      if (P.cd && P.cd.t0 != null) P.left = Math.max(0, (P.cd.t0 + 3000 - now) / 1000); /* screen follows the countdown */
    }
    /* Halfway call on every hold of 24 seconds or more (shorter holds just get the countdown). */
    if (P.phase === "work" && P.dur >= 24 && !P.spoke.half && P.left <= P.dur / 2) { P.spoke.half = 1; var reps = !!P.st[P.i].s.reps; speak(reps ? pick([(T("Halfway there. Keep it smooth.")), (T("That's halfway. Nice and controlled.")), (T("Halfway. Keep breathing."))]) : pick([(T("Halfway there. Breathe out, and sink a little deeper.")), (T("That's halfway. Keep breathing slowly.")), (T("Halfway. Relax your shoulders, and let it go a bit further."))]), true); }
    if (P.left <= 0) {
      if (P.phase === "prep") { P.phase = "work"; P.left = P.dur = stepDur(P.st[P.i]); P.act[P.i].h = P.dur; msUpdate(); diag("hold " + P.st[P.i].s.id + " " + P.dur + "s, countdown " + cdMode()); beep(990, 380, 0.3); if (window.MUSIC) { if (!MUSIC.playing()) startMusic(); MUSIC.setQuiet(false); } }
      else { if (!P.cd) beep(520, 300, 0.3); P.i++; return enterStep(true); }
    }
    draw();
  }
  function draw() {
    if (!P || !P.st[P.i]) return;
    var p = P.dur ? Math.max(0, P.left) / P.dur * 100 : 0;
    $("#p-ring").innerHTML = ringSVG(p, 112, 9, P.phase === "prep" ? "var(--amber)" : "var(--brand)") + '<b aria-hidden="true">' + Math.max(0, Math.ceil(P.left)) + "</b>";
    $("#p-ring").setAttribute("aria-label", TF("{n} seconds left", { n: Math.max(0, Math.ceil(P.left)) }));
    drawTL(); vidKick();
    var ph = $("#p-phase"); ph.textContent = P.paused ? (T("Paused")) : P.phase === "prep" ? (P.st[P.i].first ? (T("Get into position")) : (T("Switch sides"))) : (T("Hold")); ph.className = "phase" + (P.phase === "prep" ? " prep" : "");
  }
  /* Routine timeline: one segment per stage (get ready, then each hold, both sides of a move), sized by its time, filled as you go. */
  function tlSegs() {
    var out = [], act = P.act || [];
    P.st.forEach(function (st, i) {
      var a = act[i] || {}, cur = i === P.i;
      var p = cur && P.phase === "prep" ? P.dur : a.p != null ? a.p : restSecs(st.first);
      var h = cur && P.phase === "work" ? P.dur : a.h != null ? a.h : stepDur(st);
      out.push({ i: i, k: "prep", d: p, move: !!st.first }, { i: i, k: "hold", d: h, half: h >= 24 });
    });
    return out;
  }
  function moveNo(i) { var n = 0; for (var j = 0; j <= i && j < P.st.length; j++) if (P.st[j].first) n++; return n; }
  function drawTL() {
    var bar = $("#p-tlbar"); if (!bar || !P) return;
    var segs = tlSegs(), sig = segs.map(function (g) { return Math.round(g.d); }).join(",") + "|" + P.i;
    if (bar.dataset.sig !== sig) {
      bar.dataset.sig = sig;
      bar.innerHTML = segs.map(function (g, n) { return '<span class="tls ' + g.k + (g.move && n ? " mv" : "") + (g.half ? " half" : "") + (g.i === P.i ? " cur" : "") + '" style="flex-grow:' + Math.max(1, g.d) + '"><i></i></span>'; }).join("");
    }
    var total = 0, done = 0, els = bar.children;
    segs.forEach(function (g, n) {
      var f = g.i < P.i ? 1 : g.i > P.i ? 0 : g.k === "prep" ? (P.phase === "prep" ? 1 - Math.max(0, P.left) / (P.dur || 1) : 1) : (P.phase === "work" ? 1 - Math.max(0, P.left) / (P.dur || 1) : 0);
      f = Math.min(1, Math.max(0, f)); total += g.d; done += g.d * f;
      if (els[n]) els[n].firstChild.style.width = (f * 100).toFixed(1) + "%";
    });
    var st = P.st[P.i], moves = P.st.filter(function (x) { return x.first; }).length;
    var stage = (P.phase === "prep" ? (st.first ? T("Get into position") : T("Switch sides")) : T("Hold")) + (st.side ? " · " + T(st.side + " side") : "");
    var txt = TF("Move {n} of {m}", { n: moveNo(P.i), m: moves }) + " · " + stage, left = Math.max(0, Math.round(total - done));
    $("#p-tlstage").textContent = txt; $("#p-tltime").textContent = TF("{t} left", { t: mmss(left) });
    var tl = $("#p-tl"); tl.setAttribute("aria-valuemax", Math.round(total)); tl.setAttribute("aria-valuenow", Math.round(done));
    tl.setAttribute("aria-valuetext", txt + ". " + TF("{t} left", { t: mmss(left) }));
  }
  function tlDone() { var bar = $("#p-tlbar"); if (!bar) return; [].forEach.call(bar.children, function (c) { c.classList.remove("cur"); c.firstChild.style.width = "100%"; }); var t = $("#p-tltime"); if (t) t.textContent = T("Done"); var g = $("#p-tlstage"); if (g) g.textContent = ""; }
  function finish() {
    var secs = Math.round(P.worked), r = P.r;
    clearInterval(P.timer); if (P.stop) P.stop();
    var mdBefore = medalFor(monthCount(ym()));
    if (secs >= 30) { S.sessions.push({ date: iso(), t: Date.now(), cid: cmUuid(), id: r.id, n: r.n, secs: secs, items: r.items.length }); save(); stravaLog(r.n, secs, P.moves && P.moves.length ? P.moves : r.items); cmSync(); }
    LASTSESS = secs >= 30 ? { n: r.n, secs: secs, moves: (P.moves && P.moves.length ? P.moves : r.items).slice(), t: Date.now() } : null;
    var mdAfter = medalFor(monthCount(ym())), newMedal = mdAfter && (!mdBefore || mdAfter[1] > mdBefore[1]) ? mdAfter : null;
    if (window.MUSIC) setTimeout(function () { if (!P) MUSIC.stop(6000); }, 4000);
    say(secs >= 30 ? pick([(T("And that's it. Great session.")), (T("All done. Nice work today.")), (T("That's the session finished. Well done."))]) : "");
    tlDone();
    $(".player").innerHTML = '<div style="flex:1;display:grid;place-items:center;text-align:center"><div><div class="ring" style="margin:0 auto 16px">' + ringSVG(100, 128, 12) + '<div class="lbl"><div><b>' + streak() + ('</b><span>' + T("day streak") + '</span></div></div></div><h2>' + T("Done") + '</h2><p class="muted" style="margin-top:6px">') + esc(r.n) + " · " + mmss(secs) + (" " + T("of stretching") + "</p></div></div>") +
      (newMedal ? '<div class="card medalwin">' + medalSVG(newMedal, 56) + '<div class="grow"><b>' + TF("{medal} for {month}!", { medal: T(newMedal[2]), month: monthName(ym()) }) + '</b><div class="small muted">' + TF("{n} sessions this month", { n: monthCount(ym()) }) + (nextMedal(monthCount(ym())) ? " · " + TF("{n} more for {medal}", { n: nextMedal(monthCount(ym()))[1] - monthCount(ym()), medal: T(nextMedal(monthCount(ym()))[2]) }) : "") + "</div></div></div>" : "") +
      (LASTSESS ? '<div class="row sessshare"><button class="btn" data-act="sess-img">' + T("Save session image") + "</button>" + (window.STRAVA && STRAVA.connected() ? '<button class="btn" data-act="sess-strava">' + T("Open in Strava") + "</button>" : "") + "</div>" : "") +
      fbBlock(P.moves) + ('<button class="btn primary big block" data-act="p-close">' + T("Finish") + '</button>');
    LASTMOVES = P.moves.slice(); P = null; msUpdate();
  }
  var LASTMOVES = [], LASTSESS = null;
  /* ---------- Session image: 1080x1350 (fits Strava and Instagram posts). Strava's API can't attach photos,
     so this is saved or shared from the finish screen and added to the activity in Strava. ---------- */
  var LOGO_HD = new Image(); LOGO_HD.src = "img/logo-h-dark-hd.png";
  var LOGO_LO = new Image(); LOGO_LO.src = "img/logo-h-dark.png";
  function wrapText(x, text, maxW) { var words = String(text).split(" "), lines = [], cur = ""; words.forEach(function (w) { var t = cur ? cur + " " + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; }
  function sessionImage(s) {
    var W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; var x = c.getContext("2d");
    var font = function (w, sz) { return w + " " + sz + 'px -apple-system, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'; };
    var TEAL = "#46b39f", INK = "#ffffff", MUTED = "rgba(255,255,255,.66)";
    x.fillStyle = "#0f1412"; x.fillRect(0, 0, W, H);
    var g = x.createRadialGradient(W * .78, H * .18, 40, W * .78, H * .18, 760); g.addColorStop(0, "rgba(70,179,159,.30)"); g.addColorStop(1, "rgba(70,179,159,0)"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = "rgba(70,179,159,.09)"; x.lineWidth = 34; x.beginPath(); x.arc(W * 1.02, H * .9, 520, Math.PI * .95, Math.PI * 1.6); x.stroke(); x.beginPath(); x.arc(-60, H * .05, 380, Math.PI * .05, Math.PI * .6); x.stroke();
    var L = 80, R = W - 80, TOP = 78, BOTTOM = 1176;
    var mm = movesAndMuscles(s.moves), st = streak();
    /* Measure every block first, then share the spare height evenly between them, so the image never looks top-heavy or cramped. */
    x.font = font(800, 72); var titleLines = wrapText(x, s.n, R - L).slice(0, 2);
    var chipFs = 30, layout;
    var lay = function (fs) { x.font = font(600, fs); var cx = L, r = 0, pos = []; mm.muscles.forEach(function (m) { var w = x.measureText(m).width + fs * 1.4; if (cx + w > R && cx > L) { cx = L; r++; } pos.push([m, cx, r, w]); cx += w + 12; }); return { pos: pos, rows: mm.muscles.length ? r + 1 : 0 }; };
    do { layout = lay(chipFs); chipFs -= 2; } while (layout.rows > 4 && chipFs > 20);
    var chipH = Math.round((chipFs + 2) * 1.6), rowH = chipH + 12;
    /* Move names without their bracketed extras, e.g. "Kneeling side bend (gate pose)" -> "Kneeling side bend". */
    var list = mm.moves.map(function (n) { return n.replace(/\s*\([^)]*\)\s*/g, " ").trim(); }), lineH = 44, cols = list.length > 5 ? 2 : 1;
    var maxRows = 6, perCol = Math.min(maxRows, Math.ceil(list.length / cols)), cap = perCol * cols, show = list.length > cap ? list.slice(0, cap - 1) : list;
    var LOGO_H = 88, hHead = 34 + titleLines.length * 82 + 50, hTiles = 176, hChips = layout.rows ? 54 + layout.rows * rowH - 12 : 0, hMoves = list.length ? 54 + perCol * lineH : 0;
    var blocks = [hHead, hTiles, hChips, hMoves].filter(function (h) { return h > 0; });
    var used = LOGO_H + blocks.reduce(function (a, b) { return a + b; }, 0), gap = Math.max(40, Math.min(110, (BOTTOM - TOP - used) / blocks.length));
    var y = TOP;
    var logo = LOGO_HD.complete && LOGO_HD.naturalWidth ? LOGO_HD : (LOGO_LO.complete && LOGO_LO.naturalWidth ? LOGO_LO : null);
    if (logo) x.drawImage(logo, L, y, LOGO_H * logo.naturalWidth / logo.naturalHeight, LOGO_H);
    else { x.font = font(800, 64); x.fillStyle = INK; x.textBaseline = "top"; x.fillText("Movage", L, y + 12); }
    x.textBaseline = "alphabetic"; y += LOGO_H + gap;
    x.fillStyle = TEAL; x.font = font(700, 30); x.fillText(T("Mobility session").toUpperCase(), L, y + 26);
    x.fillStyle = INK; x.font = font(800, 72); titleLines.forEach(function (ln, i) { x.fillText(ln, L, y + 34 + 70 + i * 82); });
    x.fillStyle = MUTED; x.font = font(500, 32);
    var d = new Date(s.t || Date.now()), loc = I18N.lang && I18N.lang !== "en" ? I18N.lang : "en-GB";
    x.fillText(d.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), L, y + hHead);
    y += hHead + gap;
    var tiles = [[mmss(s.secs), T("Time")], [String(mm.moves.length), T("Moves")]]; if (st) tiles.push([String(st), T("day streak")]);
    var tw = (R - L - 24 * (tiles.length - 1)) / tiles.length;
    x.textAlign = "center";
    tiles.forEach(function (t, i) { var tx = L + i * (tw + 24), cx = tx + tw / 2; x.fillStyle = "rgba(255,255,255,.06)"; rr(x, tx, y, tw, hTiles, 24); x.fill(); x.fillStyle = INK; x.font = font(800, 64); x.fillText(t[0], cx, y + 96); x.fillStyle = MUTED; x.font = font(600, 25); x.fillText(t[1].toUpperCase(), cx, y + 140); });
    x.textAlign = "left"; y += hTiles + gap;
    if (layout.rows) {
      x.fillStyle = TEAL; x.font = font(700, 28); x.fillText(T("Muscles stretched").toUpperCase(), L, y + 24); var cy0 = y + 54;
      x.font = font(600, chipFs + 2);
      layout.pos.forEach(function (p) { var cy = cy0 + p[2] * rowH; x.fillStyle = "rgba(70,179,159,.20)"; rr(x, p[1], cy, p[3], chipH, chipH / 2); x.fill(); x.fillStyle = INK; x.fillText(p[0], p[1] + (chipFs + 2) * .7, cy + chipH * .68); });
      y += hChips + gap;
    }
    if (list.length) {
      x.fillStyle = TEAL; x.font = font(700, 28); x.fillText(T("Moves").toUpperCase(), L, y + 24);
      var colW = (R - L) / cols; x.font = font(500, 29); x.fillStyle = "rgba(255,255,255,.88)";
      show.forEach(function (n, i) { var col = Math.floor(i / perCol), row = i % perCol, t = n; if (x.measureText("• " + t).width > colW - 24) { while (x.measureText("• " + t + "…").width > colW - 24 && t.length > 4) t = t.slice(0, -1); t = t.trim() + "…"; } x.fillText("• " + t, L + col * colW, y + 54 + 32 + row * lineH); });
      if (list.length > show.length) { var i2 = show.length; x.fillStyle = MUTED; x.fillText(TF("+{n} more", { n: list.length - show.length }), L + Math.floor(i2 / perCol) * colW, y + 54 + 32 + (i2 % perCol) * lineH); }
    }
    x.fillStyle = "rgba(255,255,255,.14)"; x.fillRect(L, 1210, R - L, 2);
    x.font = font(700, 34); x.fillStyle = INK; x.textAlign = "left"; x.fillText("@movageapp", L, 1272);
    x.textAlign = "right"; x.fillStyle = TEAL; x.fillText("www.movage.co.uk", R, 1272); x.textAlign = "left";
    return c;
  }
  function shareCanvas(c, name, title, savedMsg) {
    c.toBlob(function (blob) {
      if (!blob) return;
      var file = null; try { file = new File([blob], name, { type: "image/png" }); } catch (e) {}
      var saveImg = function () { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast(savedMsg); };
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: title }).catch(function (e) { if (e && e.name !== "AbortError") saveImg(); });
      else saveImg();
    }, "image/png");
  }
  function openStravaActivity() {
    var g = window.STRAVA && STRAVA.get(), last = g && g.last;
    if (g && g.queued) { toast(T("Still sending to Strava. Try again in a moment.")); if (STRAVA.flush) STRAVA.flush().catch(function () {}); return; }
    var url = last && last.id && Date.now() - last.at < 6 * 3600 * 1000 ? "https://www.strava.com/activities/" + last.id : "https://www.strava.com/dashboard";
    window.open(url, "_blank");
  }
  function fbBlock(moves) {
    var hurt = fb().hurt;
    return '<div class="fbbox"><p class="fbq">' + T("How did that feel?") + '</p><div class="row fbrate"><button class="chip" data-act="fb-rate" data-id="-1">' + T("Too easy") + '</button><button class="chip" data-act="fb-rate" data-id="0">' + T("About right") + '</button><button class="chip" data-act="fb-rate" data-id="1">' + T("Too much") + "</button></div>" +
      '<p class="fbq" style="margin-top:12px">' + T("Did anything hurt? Tap it and I'll swap it for an easier move next time.") + '</p><div class="chips fbhurt">' + moves.filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (id) { return '<button class="chip' + (hurt[id] ? " on" : "") + '" data-act="fb-hurt" data-id="' + id + '">' + esc(BY[id].n) + "</button>"; }).join("") + "</div></div>";
  }
  function closePlayer() {
    cdClear();
    if (P) { clearInterval(P.timer); if (P.stop) P.stop(); var secs = Math.round(P.worked); if (secs >= 60) { S.sessions.push({ date: iso(), t: Date.now(), cid: cmUuid(), id: P.r.id, n: P.r.n + " (part)", secs: secs, items: P.i }); save(); stravaLog(P.r.n, secs, P.r.items.slice(0, P.i + 1)); cmSync(); } P = null; }
    try { speechSynthesis.cancel(); } catch (e) {}
    if (window.MUSIC) { MUSIC.stop(1500); MUSIC.setQuiet(false); }
    if (window.MUSIC && MUSIC.keepAlive) MUSIC.keepAlive(false); msHandlers(false); msUpdate();
    wakeOff(); $("#player").hidden = true; $("#player").innerHTML = ""; document.body.style.overflow = ""; render();
  }

  /* ---------- CAMERA ---------- */
  var CAM = { on: false };
  var CAMHINT = {
    shflex: (T("Stand side-on, whole body in view. Raise one straight arm overhead, hold 2 seconds, lower. Turn round for the other arm.")),
    slr: (T("Lie on your back side-on to the phone, whole body in view. Raise one straight leg as high as you can, hold, lower. Then the other leg.")),
    thomas: (T("Lie back on a bench edge, hug one knee to your chest and let the other leg hang. Side-on to the phone. Hold still for 2 seconds.")),
    ankle: (T("Half-kneel side-on to the phone. Drive the front knee forward over the toes with the heel down. Hold at your furthest point. Swap legs.")),
    squat: (T("Stand side-on, whole body in view, feet shoulder-width. Squat as deep as you can, pause 2 seconds at the bottom, stand up."))
  };
  var SETUP = {
    er: (T("Put your phone on the floor, about two metres away, with the screen facing you. Lie down side-on to it.")),
    slr: (T("Put your phone on the floor, about two metres away, with the screen facing you. Lie down side-on to it.")),
    thomas: (T("Prop your phone at bench height, about two metres away, facing you. Get side-on to it.")),
    backscratch: (T("Prop your phone at chest height, about two metres away. Stand with your back to it.")),
    trot: (T("Prop your phone at chest height, about two metres away. Sit facing it.")),
    hipir: (T("Prop your phone at knee height, about two metres away. Sit facing it.")),
    pigeon: (T("Prop your phone at hip height, about two metres away. Sit facing it."))
  };
  var NEXT = { shflex: (T("Then turn round, and lift the other arm.")), slr: (T("Then lift the other leg.")), thomas: (T("Then swap legs over.")), ankle: (T("Then swap legs over.")), k2w: (T("Then swap legs over.")), er: (T("Then turn round, and do the other arm.")), backscratch: (T("Then swap hands over.")), trot: (T("Now turn the other way.")), hipir: (T("Keep holding that.")), pigeon: (T("Then switch sides.")) };
  /* What the coach says, written to be heard rather than read. */
  var SPOKEN = {
    shflex: (T("Keep your ribs down, and lift one straight arm up overhead as far as it'll go. Hold it there for a couple of seconds, then we'll do the other side.")),
    wallflex: (T("Back flat against the wall, heels, bum and head touching. Lift both arms overhead with your thumbs together, and reach back towards the wall. Hold it for a couple of seconds.")),
    backscratch: (T("Reach one hand over your shoulder, and the other up behind your back, so your fingers point at each other. Hold it for a couple of seconds.")),
    er: (T("Put your arm out to the side at shoulder height, with your elbow bent and your hand pointing at the ceiling. Then let your hand fall back towards the floor, keeping your shoulder down. Hold it at the bottom.")),
    trot: (T("Hold a stick across your shoulders. First, face me and keep still for a moment, so I can learn your shoulder width.")),
    slr: (T("Keep both legs straight. Lift one leg as high as you can, without bending the knee, and hold it there for a couple of seconds.")),
    toetouch: (T("Feet together, knees straight. Reach down as far as you can, and hold it at the bottom.")),
    hipir: (T("Keep your knees still, and swing both feet outwards as far as they'll go. Hold it there for a couple of seconds.")),
    thomas: (T("Lie back on the edge of the bench. Hug one knee to your chest, and let the other leg hang down. Then just relax and hold still.")),
    pigeon: (T("Get into your ninety ninety position, with the front shin across your body. Lean forward with a long back, and let the front knee drop. Hold it there.")),
    ankle: (T("Keep your front heel down, and drive your knee forward over your toes as far as it'll go. Hold it at the furthest point.")),
    k2w: (T("Keep your front heel down, and push your knee forward past your toes as far as it'll go. Hold it at the furthest point.")),
    squat: (T("Feet about shoulder width apart. Squat down as deep as you can, chest up, heels down. Pause at the bottom for a couple of seconds."))
  };
  function coachIntro(t) {
    var setup = SETUP[t.cam] || (T("Prop your phone at hip height, about two metres away, with the screen facing you. Then stand side-on to it."));
    return pick([(T("Okay, let's measure your") + " ") + t.n.toLowerCase() + ".", (T("Right,") + " ") + t.n.toLowerCase() + " next.", (T("Let's do your") + " ") + t.n.toLowerCase() + "."]) + " " + setup + " " + (SPOKEN[t.cam] || "") + (" " + T("I'll let you know when I can see you."));
  }
  function coachHeld(ev) {
    var t = CAM.t, k = CAM.k, n = Math.round(k === "squat" ? ev.v.knee : ev.v), unit = t.u === "cm" ? (Math.abs(n) === 1 ? " centimetre" : " centimetres") : " degrees";
    var num = (n < 0 ? "minus " + Math.abs(n) : String(n)) + unit;
    var val = k === "squat" ? pick([(T("Nice and deep.") + " "), (T("Good squat.") + " "), (T("Got it.") + " ")]) + (T("Your knee angle is") + " ") + num + (ev.v.below ? (T(", with your hips below your knees.")) : ".")
      : pick([(T("Great, hold it.") + " "), (T("Lovely.") + " "), (T("Nice one.") + " "), (T("That's it.") + " ")]) + (ev.side === "l" ? (T("Left side,") + " ") : ev.side === "r" ? (T("Right side,") + " ") : (T("That's") + " ")) + num + ".";
    CAM.done[ev.side] = true;
    var next;
    if (k === "squat" || !t.sides) next = pick([(T("Have another go if you think you can beat it, or tap Use results when you're happy.")), (T("You can go again to beat that, or tap Use results."))]);
    else if (CAM.done.l && CAM.done.r) next = pick([(T("That's both sides done. Go again if you want to beat them, or tap Use results.")), (T("Both sides recorded. Nice work. Tap Use results when you're happy."))]);
    else next = (T("Relax for a second.") + " ") + (NEXT[k] || (T("Now the other side.")));
    sayQ(val + " " + next, true);
  }
  function camTest(id) { return TESTS.filter(function (t) { return t.id === id; })[0]; }
  function openCam(id) {
    var t = camTest(id);
    CAM = { on: true, id: id, k: t.cam, t: t, facing: "user", sess: null, stream: null, file: false, lastSay: 0, seen: false, lostAt: 0, lostSaid: 0, done: {}, trotCued: false };
    var el = $("#cam"); el.hidden = false; document.body.style.overflow = "hidden"; wakeOn(); unlockAudio();
    el.innerHTML = '<div class="ohead"><button class="icon-btn" data-act="c-close" aria-label="' + T("Close") + '">' + ICON.close + "</button><h2>" + esc(t.n) + '</h2><button class="icon-btn" data-act="c-voice" aria-label="' + T("Voice") + '">' + (S.settings.voice ? ICON.sound : ICON.mute) + '</button></div>' +
      '<div class="stage" id="c-stage"><video id="c-video" playsinline muted></video><canvas id="c-canvas"></canvas><div class="guide" id="c-guide"><div><div class="fig" data-anim="t:' + id + '"></div><p style="max-width:320px">' + esc(CAMHINT[t.cam] || t.how) + '</p><p class="small" style="opacity:.7;margin-top:10px">' + (t.cam === "er" || t.cam === "slr" ? (T("Prop the phone at floor level about 2 to 3 metres away.")) : (T("Prop the phone at hip height about 2 to 3 metres away."))) + (" " + T("Good light, fitted clothes.")) + (t.u === "cm" ? (" " + T("The cm reading is an estimate scaled to your height (")) + (S.settings.height || 178) + " cm)." : "") + '</p></div></div><div class="status" id="c-status" hidden></div></div>' +
      '<div class="readout" id="c-read"></div>' +
      '<div class="camctl" id="c-ctl"><button class="btn primary" data-act="c-start">' + ICON.cam.replace("<svg", '<svg width="18" height="18"') + (' ' + T("Start camera") + '</button><label class="btn">' + T("Use a video") + '<input type="file" accept="video/*" id="c-file" hidden></label></div>');
    animateIn(el); readout();
    $("#c-file").addEventListener("change", function (e) { var f = e.target.files && e.target.files[0]; if (f) camFile(f); });
  }
  function status(msg) { var s = $("#c-status"); if (!s) return; s.hidden = !msg; s.textContent = msg || ""; }
  function readout() {
    var r = $("#c-read"); if (!r) return;
    var b = CAM.sess ? CAM.sess.best : {}, k = CAM.k;
    if (k === "squat") { var bb = bestSquat(); r.innerHTML = ('<div class="wide"><span>' + T("Deepest squat") + '</span><b>') + (bb ? POSE.label(k, bb) : "–") + "</b></div>"; return; }
    if (!CAM.t.sides) { r.innerHTML = ('<div class="wide"><span>' + T("Best") + '</span><b style="font-size:26px">') + (b.c ? POSE.label(k, b.c.v, CAM.t.u) : "–") + "</b></div>"; return; }
    r.innerHTML = ["l", "r"].map(function (sd) { return "<div><span>" + (sd === "l" ? (T("Left")) : (T("Right"))) + " " + T("best") + "</span><b>" + (b[sd] ? POSE.label(k, b[sd].v, CAM.t.u) : "–") + "</b></div>"; }).join("");
  }
  function bestSquat() { var b = CAM.sess ? CAM.sess.best : {}, o = null; ["l", "r"].forEach(function (sd) { if (b[sd] && (!o || b[sd].v.knee < o.knee)) o = b[sd].v; }); return o; }
  function camControls(running) {
    $("#c-ctl").innerHTML = running
      ? ('<button class="btn" data-act="c-flip">' + T("Flip camera") + '</button><button class="btn" data-act="c-reset">' + T("Reset") + '</button><button class="btn primary" data-act="c-use">' + T("Use results") + '</button>')
      : ('<button class="btn primary" data-act="c-start">' + T("Start camera") + '</button><label class="btn">' + T("Use a video") + '<input type="file" accept="video/*" id="c-file" hidden></label>') + (CAM.sess && CAM.sess.frames ? ('<button class="btn primary" data-act="c-use">' + T("Use results") + '</button>') : "");
    var f = $("#c-file"); if (f) f.addEventListener("change", function (e) { var x = e.target.files && e.target.files[0]; if (x) camFile(x); });
  }
  async function camStart() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { status((T("This browser can't open the camera. Open the app in Safari, or use a video instead."))); return; }
    unlockAudio(); if (!CAM.introDone) { CAM.introDone = true; sayQ(coachIntro(CAM.t), true); }
    status((T("Starting camera…")));
    try {
      camStopStream();
      CAM.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: CAM.facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      var v = $("#c-video"); v.srcObject = CAM.stream; v.muted = true; await v.play(); CAM.file = false;
      camRun();
    } catch (e) { status(e && e.name === "NotAllowedError" ? (T("Camera access was blocked. Allow it in Settings > Safari > Camera, then try again.")) : (T("Couldn't start the camera (")) + (e && e.message || e) + ")."); }
  }
  function camFile(f) {
    camStopStream();
    var v = $("#c-video"); v.srcObject = null; v.src = URL.createObjectURL(f); v.muted = true; v.playbackRate = 0.5; CAM.file = true;
    v.onloadeddata = function () { v.play().then(camRun).catch(function () { status((T("Couldn't play that video."))); }); };
  }
  async function camRun() {
    $("#c-guide").hidden = true; status((T("Loading body tracking (first time takes a few seconds)…"))); camControls(true);
    try { await POSE.load(); } catch (e) { status((T("Couldn't load body tracking. Check your connection and try again."))); camControls(false); return; }
    status((T("Step into view so your whole body is on screen.")));
    if (!CAM.sess) CAM.sess = new POSE.Session(CAM.k, $("#c-canvas"), { dir: CAM.t.noScore || CAM.t.hi >= CAM.t.lo ? 1 : -1, unit: CAM.t.u, H: S.settings.height || 178,
      caption: function (sd, v) { return CAM.t.n + (sd === "l" ? ", left" : sd === "r" ? ", right" : "") + ": " + POSE.label(CAM.k, v, CAM.t.u) + "\nMovage · " + nice(iso()); } });
    var v = $("#c-video"), cv = $("#c-canvas"), id = CAM.run = {}, lastFound = true;
    while (CAM.on && CAM.run === id) {
      if (v.readyState >= 2 && !v.paused) {
        var w = v.videoWidth, h = v.videoHeight;
        if (cv.width !== w) { cv.width = w; cv.height = h; }
        var r;
        try { r = await CAM.sess.frame(v, w, h, CAM.facing === "user" && !CAM.file); } catch (e) { r = null; }
        if (r) {
          var now = performance.now();
          if (r.found !== lastFound) { status(r.found ? "" : (T("Can't see you. Step back so your whole body is in view."))); lastFound = r.found; if (!r.found) CAM.lostAt = now; }
          if (r.found && !CAM.seen) { CAM.seen = true; sayQ(CAM.k === "trot" ? (T("I can see you. Face me, and keep still for a moment.")) : pick([(T("Okay, I can see you. Go whenever you're ready, and hold your best position for a couple of seconds.")), (T("Great, I've got you. In your own time, move into it and hold at your best point."))])); }
          if (!r.found && CAM.seen && now - CAM.lostAt > 2500 && now - CAM.lostSaid > 8000) { CAM.lostSaid = now; sayQ(pick([(T("I've lost you a bit. Can you step back so I can see all of you?")), (T("I can't quite see all of you. Take a step back.")), (T("Move back a little, so your whole body's in the picture."))]), true); }
          if (CAM.k === "trot" && r.found && (CAM.sess.st.n || 0) < 15) status((T("Face the camera and hold still…")));
          else if (CAM.k === "trot" && CAM.sess.st.n >= 15 && !CAM.trotCued) { CAM.trotCued = true; status((T("Now rotate each way and hold."))); beep(990, 200); sayQ((T("Perfect, got it. Now turn as far as you can to one side, keep your hips still, and hold it.")), true); }
          r.events.forEach(function (ev) {
            if (ev.type === "held" && performance.now() - CAM.lastSay > 2500) { CAM.lastSay = performance.now(); beep(880, 120); coachHeld(ev); }
            else if (ev.type === "best") beep(1180, 70, 0.15);
          });
          readout();
        }
      }
      if (CAM.file && v.ended) { status((T("Video finished. Tap Use results to keep the best readings."))); camControls(false); break; }
      await new Promise(function (res) { requestAnimationFrame(res); });
    }
  }
  function camStopStream() { if (CAM.stream) { CAM.stream.getTracks().forEach(function (t) { t.stop(); }); CAM.stream = null; } CAM.run = null; }
  function camUse() {
    var b = CAM.sess ? CAM.sess.best : {}, t = CAM.t, got = 0;
    if (!draft) draft = draftFor(iso());
    draft.cam = draft.cam || {};
    if (CAM.k === "squat") { var q = bestSquat(); if (q) { draft.v.squat_knee = Math.round(q.knee); draft.v.squat_shin = Math.round(q.shin); draft.v.squat_torso = Math.round(q.torso); draft.cam.squat_knee = draft.cam.squat_shin = draft.cam.squat_torso = 1; got = 1; } }
    else if (!t.sides) { if (b.c) { draft.v[t.id] = Math.round(b.c.v); draft.cam[t.id] = 1; got = 1; } }
    else ["l", "r"].forEach(function (sd) { if (b[sd]) { draft.v[t.id + "_" + sd] = Math.round(b[sd].v); draft.cam[t.id + "_" + sd] = 1; got++; } });
    var snaps = ["l", "r", "c"].filter(function (sd) { return b[sd] && b[sd].img; }).map(function (sd) { return { sd: sd, img: b[sd].img }; });
    LASTSNAPS = snaps.map(function (s) { return { img: s.img, name: "mobility-" + t.id + (s.sd === "c" ? "" : "-" + (s.sd === "l" ? (T("left")) : (T("right")))) + "-" + iso() + ".jpg" }; });
    /* Must run inside the tap so iOS allows the share sheet. */
    var shared = got && S.settings.savePhotos && LASTSNAPS.length ? savePhotos(LASTSNAPS) : false;
    closeCam();
    if (!got) { toast((T("No readings captured yet."))); return; }
    toast((T("Added to your test. Tap Save test when you're done.")));
    if (TAB !== "test") go("test"); else renderTest();
    if (snaps.length && !shared) openSheet(("<h2>" + T("Best positions") + "</h2><p class=\"muted\" style=\"margin:4px 0 12px\">" + T("Save them to Photos to keep a visual record.") + "</p><div class=\"snaps\">") + snaps.map(function (s) { return '<img alt="' + esc(s.n ? TF("Your tracked position for {name}", { name: s.n }) : T("Your tracked position")) + '" src="' + s.img + '">'; }).join("") + ('</div><button class="btn primary block" style="margin-top:12px" data-act="save-photos">' + T("Save to Photos") + '</button>'));
    var card = $('[data-test="' + t.id + '"]'); if (card) card.scrollIntoView({ block: "center" });
  }
  var LASTSNAPS = [];
  function dataFile(u, name) { var b = atob(u.split(",")[1]), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return new File([a], name, { type: "image/jpeg" }); }
  /* Opens the iOS share sheet with the captioned images; "Save Images" puts them in Photos. Returns true if the sheet was opened. */
  function savePhotos(list) {
    try {
      var files = list.map(function (s) { return dataFile(s.img, s.name); });
      if (navigator.canShare && navigator.canShare({ files: files })) {
        navigator.share({ files: files }).then(function () { toast((T("Saved"))); }).catch(function (e) { if (!e || e.name !== "AbortError") toast((T("Couldn't open the save sheet"))); });
        return true;
      }
      files.forEach(function (f) { var a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); });
      toast((T("Images downloaded")));
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
    var s = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + T("Overall mobility score over time") + '">';
    [0, 50, 100].forEach(function (g) { s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="var(--line)"/><text x="' + (pl - 6) + '" y="' + (y(g) + 4) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + g + "</text>"; });
    var av = avgFor(); if (av) { var a = Math.round(avg(av)); s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(a) + '" y2="' + y(a) + '" stroke="var(--ink)" stroke-opacity=".45" stroke-dasharray="4 4"/><text x="' + (pl + 4) + '" y="' + (y(a) + 13) + '" text-anchor="start" font-size="10" fill="var(--muted)">' + T("age average") + ' ' + a + "</text>"; }
    if (pts.length > 1) s += '<path d="M' + pts.map(function (p, i) { return x(i).toFixed(1) + " " + y(p.s).toFixed(1); }).join(" L") + '" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linejoin="round"/>';
    pts.forEach(function (p, i) { s += '<circle cx="' + x(i) + '" cy="' + y(p.s) + '" r="4" fill="var(--brand)"/>'; if (i === 0 || i === pts.length - 1 || pts.length <= 6) s += '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="' + (pts.length > 1 && i === pts.length - 1 ? "end" : pts.length > 1 && i === 0 ? "start" : "middle") + '" font-size="10" fill="var(--muted)">' + short(p.d) + "</text>"; });
    return s + "</svg>";
  }
  /* ---------- Monthly challenge: bronze, silver, gold and platinum for the number of sessions in a calendar month.
     Up to two sessions a day count (say morning and evening), so a medal cannot be earned in one afternoon. ---------- */
  var MEDALS = [["bronze", 4, "Bronze", "#c07a3a"], ["silver", 8, "Silver", "#9aa4ad"], ["gold", 12, "Gold", "#d4a21f"], ["platinum", 20, "Platinum", "#5fb4c8"]];
  function ym(d) { return (d || iso()).slice(0, 7); }
  function monthCount(m) { var per = {}; S.sessions.forEach(function (s) { if (s.date && s.date.slice(0, 7) === m) per[s.date] = Math.min(2, (per[s.date] || 0) + 1); }); return Object.keys(per).reduce(function (t, d) { return t + per[d]; }, 0); }
  function medalFor(n) { var got = null; MEDALS.forEach(function (md) { if (n >= md[1]) got = md; }); return got; }
  function nextMedal(n) { return MEDALS.filter(function (md) { return n < md[1]; })[0] || null; }
  function monthName(m, short) { var p = m.split("-"); try { return new Date(+p[0], p[1] - 1, 1).toLocaleDateString(I18N.locale, short ? { month: "short" } : { month: "long", year: undefined }); } catch (e) { return m; } }
  function medalSVG(md, size) {
    size = size || 44; var col = md ? md[3] : "var(--line)", lab = md ? T(md[2]) : T("No medal yet");
    return '<svg class="medal' + (md ? "" : " none") + '" width="' + size + '" height="' + size + '" viewBox="0 0 48 48" role="img" aria-label="' + esc(lab) + '"><path d="M15 3h7l4 13h-7zM33 3h-7l-4 13h7z" fill="' + (md ? col : "var(--line)") + '" opacity=".55"/>' +
      '<circle cx="24" cy="30" r="14" fill="' + col + '"/><circle cx="24" cy="30" r="10.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/>' +
      (md ? '<path d="M24 23.5l2 4.1 4.5.6-3.3 3.1.8 4.5-4-2.2-4 2.2.8-4.5-3.3-3.1 4.5-.6z" fill="#fff"/>' : "") + "</svg>";
  }
  function daysLeftInMonth() { var d = new Date(), end = new Date(d.getFullYear(), d.getMonth() + 1, 0); return end.getDate() - d.getDate(); }
  function chCard() {
    var m = ym(), n = monthCount(m), md = medalFor(n), nx = nextMedal(n), top = MEDALS[MEDALS.length - 1][1];
    var marks = MEDALS.map(function (x) { return '<span class="chmark' + (n >= x[1] ? " got" : "") + '" style="left:' + (x[1] / top * 100) + '%;--mc:' + x[3] + '"><i></i><em>' + x[1] + "</em></span>"; }).join("");
    var line = nx ? TF("{n} more for {medal}", { n: nx[1] - n, medal: T(nx[2]) }) + " · " + TF("{d} days left", { d: daysLeftInMonth() }) : T("Platinum reached. Top level for this month!");
    return '<div class="card chcard" data-act="challenge"><div class="row" style="gap:12px;align-items:center">' + medalSVG(md, 52) + '<div class="grow"><h3>' + TF("{month} challenge", { month: monthName(m).replace(/^./, function (c) { return c.toUpperCase(); }) }) + '</h3><p class="small muted">' + (md ? T(md[2]) + " · " : "") + TF("{n} sessions this month", { n: n }) + "</p></div></div>" +
      '<div class="chbar" role="progressbar" aria-valuemin="0" aria-valuemax="' + top + '" aria-valuenow="' + Math.min(n, top) + '" aria-valuetext="' + esc(TF("{n} sessions this month", { n: n }) + ". " + line) + '"><div class="chfill" style="width:' + Math.min(100, n / top * 100) + "%;background:" + (md ? md[3] : "var(--brand)") + '"></div>' + marks + '</div><p class="small muted" style="margin-top:22px">' + line + "</p></div>";
  }
  function openChallenge() {
    var h = "<h2>" + T("Monthly challenge") + '</h2><p class="muted" style="margin:6px 0 14px">' + T("Earn a medal each month for how often you do your mobility. Up to two sessions a day count.") + "</p>";
    h += '<div class="card flush">' + MEDALS.map(function (md) { return '<div class="hitem">' + medalSVG(md, 40) + '<div class="grow"><b>' + T(md[2]) + '</b><div class="small muted">' + TF("{n} sessions in a month", { n: md[1] }) + "</div></div></div>"; }).join("") + "</div>";
    var months = [], d = new Date(); for (var i = 0; i < 12; i++) { months.push(iso(new Date(d.getFullYear(), d.getMonth() - i, 1)).slice(0, 7)); }
    var first = S.sessions.reduce(function (a, s) { return !a || (s.date && s.date < a) ? s.date : a; }, null);
    months = months.filter(function (m) { return m === ym() || (first && m >= first.slice(0, 7)); });
    h += '<h3 style="margin:18px 0 8px">' + T("Your medals") + '</h3><div class="medalgrid">' + months.map(function (m) { var n = monthCount(m), md = medalFor(n); return '<div class="mcell' + (m === ym() ? " now" : "") + '">' + medalSVG(md, 46) + "<b>" + esc(monthName(m, true)) + "</b><span>" + n + "</span></div>"; }).join("") + "</div>";
    openSheet(h);
  }
  /* ---------- Share your score: draws a 1080x1920 Story image and opens the phone's share sheet (pick Instagram there).
     Where sharing files is not supported the image is saved instead, ready to add to a Story. ---------- */
  function cssVar(n, fb) { try { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || fb; } catch (e) { return fb; } }
  function scoreImage() {
    var L = latest(), sc = score(L.v); if (!sc.n) return null;
    var W = 1080, H = 1920, c = document.createElement("canvas"); c.width = W; c.height = H; var x = c.getContext("2d");
    var font = function (w, s) { return w + " " + s + 'px -apple-system, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'; };
    var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0f6b5c"); g.addColorStop(1, "#06302a"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.globalAlpha = .07; x.fillStyle = "#fff"; x.beginPath(); x.arc(W * .85, H * .12, 360, 0, 7); x.fill(); x.beginPath(); x.arc(W * .1, H * .9, 300, 0, 7); x.fill(); x.globalAlpha = 1;
    x.textAlign = "center"; x.fillStyle = "rgba(255,255,255,.75)"; x.font = font(700, 40);
    x.fillText(T("My mobility score").toUpperCase(), W / 2, 230);
    var cx = W / 2, cy = 560, r = 250, lw = 42;
    x.lineWidth = lw; x.lineCap = "round"; x.strokeStyle = "rgba(255,255,255,.16)"; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = "#ffffff"; x.beginPath(); x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(.01, sc.overall / 100)); x.stroke();
    x.fillStyle = "#fff"; x.font = font(800, 210); x.textBaseline = "middle"; x.fillText(String(sc.overall), cx, cy + 6); x.textBaseline = "alphabetic";
    x.font = font(600, 40); x.fillStyle = "rgba(255,255,255,.75)"; x.fillText(T("out of 100"), cx, cy + 140);
    var zs = ZONES.filter(function (z) { return isNum(sc.zones[z[0]]); }), y = 1290 - (zs.length * 118) / 2 + 40, bx = 140, bw = W - 280;
    zs.forEach(function (z) {
      var p = sc.zones[z[0]]; x.textAlign = "left"; x.fillStyle = "#fff"; x.font = font(650, 42); x.fillText(z[1], bx, y);
      x.textAlign = "right"; x.font = font(800, 42); x.fillText(isNum(p) ? p + "%" : "–", bx + bw, y);
      var ty = y + 26, th = 22; x.fillStyle = "rgba(255,255,255,.16)"; rr(x, bx, ty, bw, th, 11); x.fill();
      if (isNum(p)) { x.fillStyle = cssVar("--z-" + z[0], "#ffffff"); rr(x, bx, ty, Math.max(th, bw * p / 100), th, 11); x.fill(); }
      y += 118;
    });
    var md = medalFor(monthCount(ym())), st = streak(), bits = [];
    if (st) bits.push(TF("{n} day streak", { n: st }));
    if (md) bits.push(TF("{medal} this month", { medal: T(md[2]) }));
    x.textAlign = "center"; x.fillStyle = "#fff"; x.font = font(700, 44);
    if (bits.length) x.fillText(bits.join("  ·  "), W / 2, 1560);
    if (LOGO_W.complete && LOGO_W.naturalWidth) { var lw = 290, lh = lw * LOGO_W.naturalHeight / LOGO_W.naturalWidth; x.drawImage(LOGO_W, (W - lw) / 2, 1600, lw, lh); }
    else { x.font = font(800, 56); x.fillStyle = "#fff"; x.fillText("Movage", W / 2, 1790); x.font = font(600, 34); x.fillStyle = "rgba(255,255,255,.85)"; x.fillText(TAGLINE, W / 2, 1836); }
    x.font = font(500, 30); x.fillStyle = "rgba(255,255,255,.6)"; x.fillText("@movageapp  ·  " + T("Tested") + " " + short(lastTestDate() || iso()), W / 2, 1882);
    return c;
  }
  var LOGO_W = new Image(); LOGO_W.src = "img/logo-s-white.png";
  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function shareScore() {
    var c = scoreImage(); if (!c) { toast(T("Do a mobility test first to get a score to share.")); return; }
    c.toBlob(function (blob) {
      if (!blob) return;
      var name = "movage-score.png", file = null; try { file = new File([blob], name, { type: "image/png" }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: T("My mobility score") }).then(function () { diag("score shared"); }).catch(function (e) { if (e && e.name !== "AbortError") saveImg(); });
      } else saveImg();
      function saveImg() { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast(T("Image saved. Open Instagram and add it to your Story.")); }
    }, "image/png");
  }
  function renderHistory() {
    var tests = S.tests.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var pts = tests.slice().reverse().map(function (t) { return { d: t.date, s: score(t.v).overall }; }).filter(function (p) { return isNum(p.s); });
    var h = ('<div class="sec" style="margin-top:6px"><h2>' + T("Mobility score") + '</h2></div><div class="card">') + (pts.length ? lineChart(pts) : ('<div class="empty">' + T("Your score will chart here after your first test.") + '</div>')) + "</div>";
    var m = sessionDays(), cells = "", start = addDays(iso(), -55), dow = (parse(start).getDay() + 6) % 7; start = addDays(start, -dow);
    for (var i = 0; i < 56 + 7; i++) { var d = addDays(start, i); if (d > iso()) break; var v = m[d] || 0; cells += '<i title="' + d + '" class="' + (v >= 480 ? "l2" : v ? "l1" : "") + (d === iso() ? " today" : "") + '"></i>'; }
    h += ('<div class="sec"><h2>' + T("Stretching") + '</h2><span class="small muted">') + streak() + (" " + T("day streak") + "</span></div><div class=\"card\"><div class=\"calwrap\"><div class=\"dl\"><span>M</span><span></span><span>W</span><span></span><span>F</span><span></span><span>S</span></div><div class=\"cal\">") + cells + ('</div></div><div class="legend"><span>' + T("Last 8 weeks. Light = some stretching, dark = 8 minutes or more.") + '</span></div></div>');
    h += chCard();
    h += ('<div class="sec"><h2>' + T("Tests") + '</h2></div><div class="card flush">') + (tests.length ? tests.map(function (t) {
      var sc = score(t.v);
      return '<div class="hitem" data-act="test-detail" data-id="' + t.date + '" style="cursor:pointer"><span class="big">' + (isNum(sc.overall) ? sc.overall : "–") + '</span><div class="grow"><b>' + nice(t.date) + '</b><div class="small muted">' + sc.n + (' ' + T("of 6 zones") + '</div></div><div class="mini">') + ZONES.map(function (z) { var p = sc.zones[z[0]]; return '<i style="height:' + Math.max(3, (p || 0) / 100 * 26) + "px;background:" + (isNum(p) ? zc(z[0]) : "var(--line)") + '"></i>'; }).join("") + "</div>" + ICON.chev + "</div>";
    }).join("") : ('<div class="empty">' + T("No tests yet.") + '</div>')) + "</div>";
    var ss = S.sessions.slice().sort(function (a, b) { return b.t - a.t; }).slice(0, 30);
    h += ('<div class="sec"><h2>' + T("Sessions") + '</h2></div><div class="card flush">') + (ss.length ? ss.map(function (s) { return '<div class="hitem"><div class="grow"><b>' + esc(s.n) + '</b><div class="small muted">' + nice(s.date) + "</div></div><span class=\"num\">" + mmss(s.secs) + "</span></div>"; }).join("") : ('<div class="empty">' + T("Finish a routine and it'll show here.") + '</div>')) + "</div>";
    $("#v-history").innerHTML = h;
  }
  function testDetail(date) {
    var t = S.tests.filter(function (x) { return x.date === date; })[0]; if (!t) return;
    var sc = score(t.v), h = "<h2>" + nice(date) + ('</h2><p class="muted" style="margin:4px 0 12px">' + T("Overall") + ' ') + (isNum(sc.overall) ? sc.overall : "–") + "</p>";
    h += '<div class="zbars" style="margin-bottom:14px">' + ZONES.map(function (z) { var p = sc.zones[z[0]], a = avgZone(z[0]); return '<div class="zbar"><span>' + z[1] + '</span><div class="track">' + (isNum(p) ? '<div class="fill" style="width:' + p + "%;background:" + zc(z[0]) + '"></div>' : "") + (isNum(a) ? '<div class="avg" style="left:' + a + '%"></div>' : "") + "</div><b>" + (isNum(p) ? p : "–") + "</b></div>"; }).join("") + "</div>";
    h += '<div class="card flush"><div class="kv" style="padding-top:12px">' + TESTS.map(function (x) { return fieldsFor(x).filter(function (f) { return isNum(t.v[f[0]]); }).map(function (f) { return "<span>" + esc(x.n) + (f[0] !== x.id ? " (" + f[1].split(" ")[0].toLowerCase() + ")" : "") + "</span><span class=\"num\">" + t.v[f[0]] + " " + x.u + "</span>"; }).join(""); }).join("") + "</div></div>";
    h += '<div class="row" style="margin-top:8px"><button class="btn" data-act="edit-test" data-id="' + date + '">' + T("Edit") + '</button><button class="btn danger" data-act="del-test" data-id="' + date + '">' + T("Delete") + '</button></div>';
    openSheet(h);
  }

  /* ---------- SETTINGS, EXPORT, IMPORT ---------- */
  function exportObj() {
    return { app: "movage", version: 1, exported: new Date().toISOString(), settings: S.settings, tests: S.tests, sessions: S.sessions, routines: S.routines, goals: S.goals,
      bodySignal: { collection: (T("mobility")), docs: S.tests.map(function (t) { return { id: "m-" + t.date, data: { date: t.date, v: t.v } }; }) } };
  }
  async function doExport() {
    var json = JSON.stringify(exportObj(), null, 1), name = "movage-" + iso() + ".json";
    try {
      var file = new File([json], name, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Movage backup" }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([json], { type: "application/json" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  async function doCopy() {
    var json = JSON.stringify(exportObj());
    try { await navigator.clipboard.writeText(json); toast((T("Copied. Paste it into Body Signal or a note."))); } catch (e) { toast((T("Couldn't copy on this device. Use Export file instead."))); }
  }
  function doImport(text) {
    var x; try { x = JSON.parse(text); } catch (e) { toast((T("That isn't a valid backup file."))); return; }
    if (!x || (x.app !== "movage" && x.app !== "signal-mobility")) { toast((T("That isn't a Movage backup."))); return; }
    var byDate = {}; S.tests.forEach(function (t) { byDate[t.date] = t; }); (x.tests || []).forEach(function (t) { if (t && t.date && t.v) byDate[t.date] = t; });
    S.tests = Object.keys(byDate).map(function (k) { return byDate[k]; });
    var seen = {}; S.sessions.concat(x.sessions || []).forEach(function (s) { if (s && s.t) seen[s.t + "|" + s.id] = s; }); S.sessions = Object.keys(seen).map(function (k) { return seen[k]; });
    var rs = {}; S.routines.concat(x.routines || []).forEach(function (r) { if (r && r.id) rs[r.id] = r; }); S.routines = Object.keys(rs).map(function (k) { return rs[k]; });
    var gs = {}; S.goals.concat(Array.isArray(x.goals) ? x.goals : []).forEach(function (g) { if (g && g.id && g.target != null) gs[g.id] = g; }); S.goals = Object.keys(gs).map(function (k) { return gs[k]; });
    if (x.settings) S.settings = Object.assign(S.settings, x.settings);
    save(); applyTheme(); closeSheet(); render(); toast((T("Restored") + " ") + (x.tests || []).length + (" " + T("tests and") + " ") + (x.sessions || []).length + " sessions.");
  }
  /* ---------- Reminders ----------
     A web app can't schedule its own notifications with nothing running, so reminders work three ways:
     1. a repeating Calendar event with an alert (the phone's own notification, works even when the app is closed),
     2. a nudge card on Today, and 3. a notification when the app is open or in the background at reminder time. */
  var DAYN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function rem() { return Object.assign({ on: false, time: "07:30", days: [0, 1, 2, 3, 4, 5, 6], routine: "daily", lead: 0, nudge: true, notify: false }, S.settings.rem || {}); }
  function setRem(o) { S.settings.rem = Object.assign(rem(), o); save(); }
  function dayName(i) { return new Date(2026, 10, 8 + i).toLocaleDateString(I18N.locale, { weekday: "short" }); }
  function remDue() {
    var r = rem(); if (!r.on) return null; var now = new Date(), hm = r.time.split(":");
    if (r.days.indexOf(now.getDay()) < 0 || sessionDays()[iso()]) return null;
    var at = new Date(); at.setHours(+hm[0], +hm[1], 0, 0); return now >= at ? r : null;
  }
  function remRoutine(r) { return findRoutine(r.routine) || findRoutine("daily"); }
  function remIcs() {
    var r = rem(), rt = remRoutine(r), hm = r.time.split(":"), now = new Date(), start = new Date();
    start.setHours(+hm[0], +hm[1], 0, 0); for (var k = 0; k < 8 && (r.days.indexOf(start.getDay()) < 0 || start <= now); k++) start.setDate(start.getDate() + 1);
    var p = function (n) { return (n < 10 ? "0" : "") + n; }, loc = function (d) { return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "T" + p(d.getHours()) + p(d.getMinutes()) + "00"; };
    var by = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"], mins0 = Math.max(5, Math.round(routineSecs(rt.items) / 60));
    var url = location.origin + location.pathname + "?play=" + encodeURIComponent(rt.id), title = "Movage: " + rt.n;
    var esc2 = function (t) { return String(t).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); };
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Movage//Reminders//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      "UID:movage-reminder@" + (location.hostname || "movage"), "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, ""),
      "DTSTART:" + loc(start), "DURATION:PT" + mins0 + "M", "RRULE:FREQ=WEEKLY;BYDAY=" + r.days.map(function (d) { return by[d]; }).join(","),
      "SUMMARY:" + esc2(title), "DESCRIPTION:" + esc2(T("Time for your mobility session.") + " " + url), "URL:" + url,
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + esc2(title), "TRIGGER:-PT" + (r.lead || 0) + "M", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n") + "\r\n";
  }
  function remCard() {
    var r = rem(), opts = allRoutines().map(function (x) { return '<option value="' + esc(x.id) + '"' + (r.routine === x.id ? " selected" : "") + ">" + esc(x.n) + "</option>"; }).join("");
    var h = '<div class="card"><h3>' + T("Mobility reminders") + '</h3><label class="remcheck" style="margin-top:8px"><input type="checkbox" id="rm-on"' + (r.on ? " checked" : "") + "> " + T("Remind me to do my mobility") + "</label>";
    if (!r.on) return h + "</div>";
    h += '<div class="row" style="margin-top:10px"><label class="field">' + T("Time") + '<input type="time" id="rm-time" value="' + esc(r.time) + '"></label><label class="field">' + T("How often") + '<select id="rm-freq">' +
      [["all", T("Every day")], ["wk", T("Weekdays")], ["we", T("Weekends")], ["alt", T("Mon, Wed, Fri")], ["custom", T("Choose days")]].map(function (o) { return '<option value="' + o[0] + '"' + (remFreq(r) === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label></div>";
    h += '<div class="chips daychips" style="margin-top:8px">' + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<button class="chip' + (r.days.indexOf(d) >= 0 ? " on" : "") + '" data-act="rm-day" data-id="' + d + '">' + esc(dayName(d)) + "</button>"; }).join("") + "</div>";
    h += '<div class="row" style="margin-top:10px"><label class="field" style="flex:1.4">' + T("Routine") + '<select id="rm-routine">' + opts + '</select></label></div><div class="row" style="margin-top:10px"><label class="field">' + T("Alert") + '<select id="rm-lead">' +
      [[0, T("At the time")], [5, T("5 min before")], [15, T("15 min before")], [30, T("30 min before")]].map(function (o) { return '<option value="' + o[0] + '"' + ((r.lead || 0) === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label></div>";
    h += '<p class="small" style="margin-top:12px;font-weight:700">' + T("How to remind you") + "</p>";
    h += '<div class="remhow"><b>' + T("Calendar alert") + '</b><p class="small muted">' + T("Adds a repeating event with an alert to your phone's calendar. This is the reliable one: it notifies you even when the app is closed. Add it again after changing the time or days.") + '</p><button class="btn" data-act="rm-ics">' + T("Add to Calendar") + "</button></div>";
    h += '<label class="remcheck" style="margin-top:10px"><input type="checkbox" id="rm-nudge"' + (r.nudge ? " checked" : "") + "> " + T("Reminder card on Today when it's time") + "</label>";
    h += '<label class="remcheck" style="margin-top:8px"><input type="checkbox" id="rm-notify"' + (r.notify ? " checked" : "") + "> " + T("Notification if the app is open or in the background") + "</label>";
    h += '<p class="small muted" style="margin-top:4px">' + T("On iPhone this needs the app on your Home Screen. Notifications with the app fully closed will come with the App Store version.") + "</p>";
    return h + "</div>";
  }
  function eqCard() {
    var have = S.settings.eq || EQ.map(function (e) { return e[0]; });
    return '<div class="card"><div class="eqhead"><h3>' + T("My equipment") + '</h3><span class="eqcount" id="eq-count">' + eqCountText(have) + '</span></div><label class="remcheck" style="margin-top:8px"><input type="checkbox" id="eq-on"' + (S.settings.eqOn ? " checked" : "") + "> " + T("Only use moves I have the kit for") + '</label><p class="small muted" style="margin:6px 0 8px">' + T("Moves that need something you don't have are swapped for an alternative or skipped. Turn it off to see everything, for example when you're at the gym.") + '</p><div class="chips daychips">' +
      EQ.map(function (e) { return '<button class="chip eqchip' + (have.indexOf(e[0]) >= 0 ? " on" : "") + '" data-act="eq-item" data-id="' + e[0] + '">' + eqIcon(e[0]) + "<span>" + esc(e[1]) + "</span></button>"; }).join("") + "</div></div>";
  }
  function eqCountText(have) { return S.settings.eqOn ? esc(TF("{n} of {total} selected", { n: have.length, total: EQ.length })) : esc(T("Off, all moves shown")); }
  function paCard() {
    var f = fb(), hurt = Object.keys(f.hurt).filter(function (id) { return BY[id]; });
    var h = '<div class="card"><h3>' + T("Personal adjustments") + '</h3><p class="small muted" style="margin:6px 0 8px">' + T("Set by your feedback after each session.") + "</p>";
    h += '<p><b>' + TF("Hold times: {n}% of standard", { n: Math.round(f.scale * 100) }) + "</b>" + (f.scale !== 1 ? ' <button class="btn small" data-act="fb-reset">' + T("Reset") + "</button>" : "") + "</p>";
    h += '<p style="margin-top:10px"><b>' + T("Moves that hurt") + "</b></p>" + (hurt.length ? '<div class="chips daychips">' + hurt.map(function (id) { return '<button class="chip on" data-act="fb-unhurt" data-id="' + id + '">' + esc(BY[id].n) + " ✕</button>"; }).join("") + '</div><p class="small muted">' + T("Tap one to bring it back.") + "</p>" : '<p class="small muted">' + T("None. Nice.") + "</p>");
    return h + "</div>";
  }
  function remFreq(r) { var k = r.days.slice().sort().join(""); return k === "0123456" ? "all" : k === "12345" ? "wk" : k === "06" ? "we" : k === "135" ? "alt" : "custom"; }
  function remRefresh() { var c = $("#rem-slot"); if (c) { c.innerHTML = remCard(); remWire(); } }
  function remWire() {
    if (!$("#rm-on")) return;
    $("#rm-on").addEventListener("change", function (e) { setRem({ on: e.target.checked }); remRefresh(); render(); });
    var bind = function (id, f) { var e = $(id); if (e) e.addEventListener("change", function () { f(e); render(); }); };
    bind("#rm-time", function (e) { setRem({ time: e.value || "07:30" }); });
    bind("#rm-freq", function (e) { var m = { all: [0, 1, 2, 3, 4, 5, 6], wk: [1, 2, 3, 4, 5], we: [0, 6], alt: [1, 3, 5] }; if (m[e.value]) setRem({ days: m[e.value] }); remRefresh(); });
    bind("#rm-routine", function (e) { setRem({ routine: e.value }); });
    bind("#rm-lead", function (e) { setRem({ lead: +e.value }); });
    bind("#rm-nudge", function (e) { setRem({ nudge: e.checked }); });
    bind("#rm-notify", function (e) {
      if (!e.checked) return setRem({ notify: false });
      if (!("Notification" in window)) { e.checked = false; toast(T("This browser can't show notifications. Add the app to your Home Screen first.")); return; }
      Notification.requestPermission().then(function (p) { if (p === "granted") { setRem({ notify: true }); toast(T("Notifications on")); } else { e.checked = false; setRem({ notify: false }); toast(T("Notifications are blocked. Allow them in Settings > Notifications.")); } });
    });
  }
  /* While the app is running, check every minute whether it's reminder time. */
  function remTick() {
    var r = remDue(); if (!r || !r.notify || P) return;
    var key = "sm-rem-" + iso(); try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch (e) { return; }
    var rt = remRoutine(r), title = T("Time for your mobility"), body = rt.n + " · " + mins(routineSecs(rt.items));
    try { if (Notification.permission !== "granted") return; navigator.serviceWorker && navigator.serviceWorker.ready ? navigator.serviceWorker.ready.then(function (reg) { reg.showNotification(title, { body: body, icon: "icons/icon-192.png", tag: "sm-reminder", data: { url: "?play=" + rt.id } }); }) : new Notification(title, { body: body }); } catch (e) {}
  }
  setInterval(remTick, 60000); document.addEventListener("visibilitychange", function () { if (!document.hidden) { remTick(); if (TAB === "home") render(); } });

  /* ---------- Strava ---------- */
  /* Strava description: brand line, muscles worked (most used first), then the moves. Strava has no muscle field. */
  /* Moves (unique, in order) and muscles worked, most used first, for a list of move ids or routine items. */
  function movesAndMuscles(ids) {
    var seen = {}, moves = [], hits = {};
    (ids || []).forEach(function (x) { var id = x && x.id ? x.id : x, s = BY[id]; if (!s || seen[id]) return; seen[id] = 1; moves.push(s.n); (s.m || []).forEach(function (m) { hits[m] = (hits[m] || 0) + 1; }); });
    return { moves: moves, muscles: MUSCLES.filter(function (m) { return hits[m[0]]; }).sort(function (a, b) { return hits[b[0]] - hits[a[0]]; }).map(function (m) { return m[1]; }) };
  }
  function stravaDesc(ids, count) {
    var mm = movesAndMuscles(ids), moves = mm.moves, mus = mm.muscles;
    var lines = ["Mobility work using Movage App (@movageapp)"];
    if (mus.length) lines.push(T("Muscles") + ": " + mus.join(", "));
    var n = moves.length || count || 0;
    if (n) lines.push(n + " " + T("moves") + (moves.length ? ": " + moves.join(", ") : ""));
    return lines.join("\n");
  }
  function stravaLog(name, secs, ids) {
    if (!window.STRAVA || !STRAVA.connected() || !STRAVA.get().auto) return;
    STRAVA.logSession({ name: name, secs: secs, startLocal: STRAVA.localISO(Date.now() - secs * 1000), description: stravaDesc(ids) })
      .then(function (n) { if (n) toast(T("Logged to Strava")); })
      .catch(function () { toast(T("Couldn't reach Strava. It'll be sent next time you're online.")); });
  }
  function stravaCard() {
    if (!window.STRAVA) return "";
    var v = STRAVA.get(), host = location.hostname || "your-site.github.io";
    var h = '<div class="card"><h3>Strava</h3><p class="small muted" style="margin:4px 0 10px">' + esc(TF("Log your mobility sessions to Strava. You need your own free Strava API app: create one at strava.com/settings/api, set its Authorization Callback Domain to {host}, then copy its Client ID and Client Secret here. They stay on this phone.", { host: host })) + "</p>";
    h += '<div class="row"><label class="field">' + T("Client ID") + '<input id="sv-id" inputmode="numeric" autocomplete="off" value="' + esc(v.id) + '"></label><label class="field">' + T("Client Secret") + '<input id="sv-secret" type="password" autocomplete="off" value="' + esc(v.secret) + '"></label></div>';
    if (v.connected) {
      h += '<p style="margin-top:10px"><b>' + esc(TF("Connected as {name}", { name: v.athlete || "Strava" })) + "</b>" + (v.queued ? ' <span class="small muted">· ' + esc(TF("{n} waiting to send", { n: v.queued })) + "</span>" : "") + "</p>";
      h += '<label class="row" style="margin-top:8px"><input type="checkbox" id="sv-auto"' + (v.auto ? " checked" : "") + "> " + T("Log every finished session automatically") + "</label>";
      h += '<div class="row" style="margin-top:10px"><label class="field">' + T("Strava activity type") + '<select id="sv-type">' + [["Mobility", T("Mobility")], ["Yoga", T("Yoga")], ["Workout", T("Workout")], ["Pilates", T("Pilates")]].map(function (o) { return '<option value="' + o[0] + '"' + (v.type === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label></div>" + (v.type === "Mobility" ? '<p class="small muted" style="margin-top:6px">' + T("Strava has no Mobility type yet, so these log as a Workout titled \"Mobility: routine name\".") + "</p>" : "");
      h += '<div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap"><button class="btn" data-act="strava-last">' + T("Send last session") + '</button><button class="btn danger" data-act="strava-off">' + T("Disconnect") + "</button></div>";
      if (v.last) h += '<p class="small muted" style="margin-top:8px">' + esc(TF("Last logged: {name}", { name: v.last.name })) + "</p>";
    } else {
      h += '<button class="btn primary" style="margin-top:10px" data-act="strava-connect">' + T("Connect Strava") + "</button>";
      h += '<details style="margin-top:10px"' + (v.pendingCode ? " open" : "") + '><summary class="small" style="color:var(--brand);font-weight:600">' + T("Have a code from Strava?") + '</summary><div class="row" style="margin-top:8px"><input class="inp" id="sv-code" style="flex:1" value="' + esc(v.pendingCode) + '" placeholder="' + T("Paste the code") + '"><button class="btn" data-act="strava-code">' + T("Use code") + "</button></div></details>";
    }
    return h + "</div>";
  }
  function stravaWire() {
    if (!window.STRAVA || !$("#sv-id")) return;
    var upd = function () { STRAVA.setConfig({ id: $("#sv-id").value, secret: $("#sv-secret").value, auto: $("#sv-auto") ? $("#sv-auto").checked : undefined, type: $("#sv-type") ? $("#sv-type").value : undefined }); };
    ["#sv-id", "#sv-secret", "#sv-auto"].forEach(function (id) { var e = $(id); if (e) e.addEventListener("change", upd); });
    if ($("#sv-type")) $("#sv-type").addEventListener("change", function () { upd(); stravaRefresh(); });
  }
  /* Report a bug or suggest a feature: builds an email in the phone's Mail app, with the app details added for bugs. */
  var FEEDBACK_TO = "daveburley@gmail.com";
  function fbMailCard() {
    return '<div class="card"><h3>' + T("Report a bug or suggest an idea") + '</h3><p class="small muted" style="margin:4px 0 10px">' + T("Tell us what went wrong or what you'd like to see. This opens an email in your Mail app, ready to send.") + "</p>" +
      '<div class="row"><label class="field">' + T("Type") + '<select id="fm-type"><option value="bug">' + T("Bug") + '</option><option value="idea">' + T("New feature idea") + "</option></select></label></div>" +
      '<label class="field" style="margin-top:10px">' + T("Details") + '<textarea class="inp" id="fm-text" rows="5" style="font-size:15px;font-weight:500" placeholder="' + esc(T("What happened, or what would you like the app to do?")) + '"></textarea></label>' +
      '<label class="remcheck" style="margin-top:10px"><input type="checkbox" id="fm-info" checked> ' + T("Include app version and phone details (helps with bugs)") + "</label>" +
      '<button class="btn primary block" style="margin-top:12px" data-act="fm-send">' + T("Send by email") + '</button></div>';
  }
  function fbMailSend() {
    var type = $("#fm-type").value, text = ($("#fm-text").value || "").trim();
    if (!text) { toast(T("Add a few words first.")); $("#fm-text").focus(); return; }
    var first = text.split("\n")[0].slice(0, 60), subj = "Movage " + (type === "bug" ? "bug" : "idea") + ": " + first;
    var body = text;
    if ($("#fm-info").checked) {
      var st = window.matchMedia && matchMedia("(display-mode: standalone)").matches || navigator.standalone;
      body += "\n\n----\nApp: Movage v" + APP_VERSION + " (" + APP_BUILD + ")\nLanguage: " + I18N.lang + "\nPhoto model: " + (S.settings.model === "m" ? "male" : "female") + "\nInstalled to home screen: " + (st ? "yes" : "no") +
        "\nScreen: " + screen.width + "x" + screen.height + "\nDevice: " + navigator["user" + "Agent"];
      if (type === "bug" && DIAG.length) body += "\n\nRecent log:\n" + DIAG.slice(-8).join("\n");
    }
    location.href = "mailto:" + FEEDBACK_TO + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body.slice(0, 1800));
    diag("feedback email opened (" + type + ")");
  }
  function stravaRefresh() { var c = $("#strava-slot"); if (c) { c.innerHTML = stravaCard(); stravaWire(); } }
  function openSettings() {
    var s = S.settings;
    var h = ('<h2>' + T("Settings") + '</h2>') + '<div class="card" style="margin-top:12px"><label class="field">' + T("Language") + '<select id="s-lang">' + I18N.LANGS.map(function (o) { return '<option value="' + o[0] + '"' + (I18N.lang === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + '</select></label><p class="small muted" style="margin-top:6px">' + T("Changes the app, the coach's voice and all stretch instructions. The app restarts to apply it.") + '</p></div>' + ('<div class="card" style="margin-top:12px"><div class="row"><label class="field">' + T("Age") + '<input type="number" inputmode="numeric" id="s-age" min="14" max="99" value="') + (s.age || "") + '"></label><label class="field">' + T("Height (cm)") + '<input type="number" inputmode="numeric" id="s-height" min="120" max="230" value="' + (s.height || 178) + ('"></label><label class="field">' + T("Sex") + '<select id="s-sex"><option value="m"') + (s.sex === "m" ? " selected" : "") + '>' + T("Male") + '</option><option value="f"' + (s.sex === "f" ? " selected" : "") + ">" + T("Female") + "</option></select></label></div>" +
      ('<p class="small muted" style="margin-top:8px">' + T("Age and sex set the typical-score markers (currently available for men only). Height scales the camera's cm estimates.") + '</p></div>');
    h += ('<div class="card"><div class="row"><label class="field">' + T("Time between exercises") + '<select id="s-rest">') + [5, 10, 15, 20, 30, 45, 60].map(function (n) { return '<option value="' + n + '"' + ((s.rest == null ? 10 : s.rest) === n ? " selected" : "") + ">" + n + " " + T("seconds") + "</option>"; }).join("") + ('</select></label><label class="field">' + T("Time to switch sides") + '<select id="s-siderest">') + [3, 5, 10, 15].map(function (n) { return '<option value="' + n + '"' + ((s.sideRest == null ? 5 : s.sideRest) === n ? " selected" : "") + ">" + n + " " + T("seconds") + "</option>"; }).join("") + ('</select></label></div><div class="row" style="margin-top:10px"><label class="field">' + T("Final 3, 2, 1 countdown") + '<select id="s-cd">') + (I18N.lang === "en" ? [["m", (T("Voice (male, British)"))], ["f", (T("Voice (female, American)"))]] : [["voice", T("Coach's voice")]]).concat([["beeps", (T("Beeps"))], ["off", (T("Off"))]]).map(function (o) { return '<option value="' + o[0] + '"' + (cdMode() === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + ('</select></label><button class="btn" style="align-self:flex-end" data-act="cd-test">' + T("Hear it") + '</button></div><p class="small muted" style="margin-top:6px">' + T("Time to reposition and grab any kit (band, roller, stick) before each move. The next move and its kit are read out at the start.") + '</p><div class="row" style="margin-top:10px"><label class="field">' + T("Theme") + '<select id="s-theme">') + [["auto", (T("Match phone"))], ["light", (T("Light"))], ["dark", (T("Dark"))]].map(function (o) { return '<option value="' + o[0] + '"' + (s.theme === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label></div>" +
      ('<div class="row" style="margin-top:10px"><label class="field">' + T("Favourite sport (optional)") + '<select id="s-sport"><option value="">' + T("None") + '</option>') + SPORTS.map(function (o) { return '<option value="' + o.id + '"' + (s.sport === o.id ? " selected" : "") + ">" + esc(o.n) + "</option>"; }).join("") + ('</select></label></div><p class="small muted" style="margin-top:6px">' + T("Sets the top stretches and routines shown on Today.") + '</p>') +
      '<div class="row" style="margin-top:12px"><label class="row grow"><input type="checkbox" id="s-voice"' + (s.voice ? " checked" : "") + '> ' + T("Voice coaching") + '</label><label class="row grow"><input type="checkbox" id="s-beeps"' + (s.beeps ? " checked" : "") + "> " + T("Beeps") + "</label></div>" +
      ('<div class="row" style="margin-top:12px"><label class="field" style="flex:2">' + T("Coach voice") + '<select id="s-vname"><option value="">' + T("Best available") + '</option>') + enVoices().sort(function (x, y) { return voiceScore(y) - voiceScore(x); }).map(function (v) { return '<option value="' + esc(v.name) + '"' + (s.voiceName === v.name ? " selected" : "") + ">" + esc(v.name) + " (" + esc(v.lang) + ")</option>"; }).join("") + ('</select></label><label class="field">' + T("Speed") + '<select id="s-vrate">') + [[0.85, (T("Slower"))], [0.95, (T("Normal"))], [1.05, (T("Quicker"))]].map(function (o) { return '<option value="' + o[0] + '"' + ((s.voiceRate || 0.95) === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + ('</select></label></div><button class="btn" style="margin-top:8px" data-act="voice-test">' + T("Hear the voice") + '</button>') +
      '<p class="small muted" style="margin-top:8px">' + esc(I18N.lang === "en" ? "For the most natural voice, download one on your iPhone: open Settings, search for Voices, then go to English. Pick an Enhanced or Premium voice (Serena, Daniel or Arthur for British), then close and reopen this app and choose it here."
        : T("For the most natural voice, download one on your iPhone: open Settings, search for Voices, then pick your language and an Enhanced or Premium voice. Then close and reopen this app and choose it here.")) + '</p>' +
      ('<div class="row" style="margin-top:14px"><label class="field" style="flex:2">' + T("Routine background music") + '<select id="s-music">') + MUSIC_STYLES.map(function (o) { return '<option value="' + o[0] + '"' + ((s.music || "pads") === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + '</select></label><label class="field">' + T("Music volume") + '<input type="range" id="s-mvol" min="0" max="1" step="0.05" value="' + (s.musicVol == null ? 0.5 : s.musicVol) + ('" style="min-height:46px;padding:0;accent-color:var(--brand)"></label></div><button class="btn" style="margin-top:8px" data-act="music-preview">' + T("Preview music") + '</button><p class="small muted" style="margin-top:6px">' + T("Gentle music generated on your phone. It drops down whenever the coach speaks.") + '</p>') +
      '<label class="row" style="margin-top:10px"><input type="checkbox" id="s-showphotos"' + (s.photos !== false ? " checked" : "") + '> ' + T("Show stretch photos (instead of stick figures)") + '</label>' +
      '<div class="row" style="margin-top:10px"><label class="field">' + T("Mobility model in photos") + '<select id="s-model"><option value="f"' + (s.model !== "m" ? " selected" : "") + ">" + T("Female") + '</option><option value="m"' + (s.model === "m" ? " selected" : "") + ">" + T("Male") + "</option></select></label></div>" +
      '<label class="row" style="margin-top:10px"><input type="checkbox" id="s-photos"' + (s.savePhotos ? " checked" : "") + '> ' + T("Save camera test images to Photos") + '</label></div>';
    h += '<div class="card"><h3>' + T("Accessibility") + '</h3><div class="row" style="margin-top:8px"><label class="field">' + T("Text size") + '<select id="s-text">' +
      [["std", T("Standard")], ["l", T("Large")], ["xl", T("Extra large")], ["xxl", T("Largest")], ["phone", T("Match iPhone text size")]].map(function (o) { return '<option value="' + o[0] + '"' + ((s.textSize || "std") === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") +
      '</select></label></div><label class="remcheck" style="margin-top:12px"><input type="checkbox" id="s-capt"' + (s.captions === false ? "" : " checked") + "> " + T("Show captions of what the coach says") + "</label></div>";
    h += eqCard() + '<div id="pa-slot">' + paCard() + "</div>";
    h += '<div id="rem-slot">' + remCard() + "</div>";
    h += '<div id="strava-slot">' + stravaCard() + "</div>";
    h += ('<div class="card"><h3>' + T("Your data") + '</h3><p class="small muted" style="margin:4px 0 12px">' + T("Everything is stored on this phone only. Export a backup now and then. The file also carries your tests in Body Signal's format.") + '</p><div class="row"><button class="btn grow" data-act="export">' + T("Export file") + '</button><button class="btn grow" data-act="copy">' + T("Copy") + '</button></div><div class="row" style="margin-top:8px"><label class="btn grow">' + T("Restore from file") + '<input type="file" accept="application/json,.json" id="s-import" hidden></label></div>') +
      ('<details style="margin-top:10px"><summary class="small" style="color:var(--brand);font-weight:600">' + T("Paste a backup instead") + '</summary><textarea class="inp" id="s-paste" rows="4" style="margin-top:8px;font-size:13px"></textarea><button class="btn" style="margin-top:8px" data-act="paste-import">' + T("Restore pasted backup") + '</button></details></div>');
    h += ('<div class="card"><h3>' + T("Offline photos") + '</h3><p class="small muted" style="margin:4px 0 10px" id="off-status">' + T("Checking…") + '</p><button class="btn primary block" id="off-btn" data-act="off-save">' + T("Save all photos for offline") + '</button><p class="small muted" style="margin-top:8px">' + T("About 50 to 80 MB. Best done on Wi-Fi. After that, photos load instantly even with no signal.") + '</p></div>');
    h += fbMailCard();
    h += ('<details class="card"><summary class="small" style="color:var(--brand);font-weight:600">' + T("Diagnostics") + '</summary><pre class="small" id="s-diag" style="white-space:pre-wrap;margin:8px 0 0;font-size:11px">') + esc(DIAG.slice(-12).join("\n") || (T("Nothing logged yet."))) + ('</pre><button class="btn" style="margin-top:8px" data-act="diag-copy">' + T("Copy") + '</button></details>');
    h += ('<div class="card"><button class="btn danger block" data-act="reset">' + T("Delete all data") + '</button></div><p class="small muted" style="text-align:center"><b>Movage</b> · ' + TAGLINE + '<br>v') + APP_VERSION + ' (' + APP_BUILD + ') · ' + T("body tracking by MediaPipe") + '</p>';
    openSheet(h, function () { if (window.MUSIC && !P && MUSIC.playing()) MUSIC.stop(800); });
    offlineUI();
    var sync = function () { S.settings.age = parseInt($("#s-age").value, 10) || S.settings.age; S.settings.sex = $("#s-sex").value; S.settings.height = parseInt($("#s-height").value, 10) || S.settings.height || 178; S.settings.countdown = $("#s-cd").value; S.settings.rest = parseInt($("#s-rest").value, 10); S.settings.sideRest = parseInt($("#s-siderest").value, 10); S.settings.theme = $("#s-theme").value; S.settings.sport = $("#s-sport").value; S.settings.voice = $("#s-voice").checked; S.settings.beeps = $("#s-beeps").checked; S.settings.savePhotos = $("#s-photos").checked; S.settings.photos = $("#s-showphotos").checked; S.settings.voiceName = $("#s-vname").value; S.settings.music = $("#s-music").value; S.settings.musicVol = parseFloat($("#s-mvol").value); if (window.MUSIC && musicOn()) MUSIC.preload(S.settings.music, S.settings.musicVol); if (window.MUSIC && MUSIC.playing() && !P) { if (musicOn()) MUSIC.start(AC, S.settings.music, S.settings.musicVol); else MUSIC.stop(600); } S.settings.voiceRate = parseFloat($("#s-vrate").value) || 0.95; save(); applyTheme(); render(); };
    ["#s-age", "#s-height", "#s-sex", "#s-rest", "#s-siderest", "#s-cd", "#s-theme", "#s-sport", "#s-voice", "#s-beeps", "#s-photos", "#s-showphotos", "#s-vname", "#s-vrate", "#s-music", "#s-mvol"].forEach(function (id) { $(id).addEventListener("change", sync); });
    stravaWire(); remWire();
    $("#s-model").addEventListener("change", function (e) { S.settings.model = e.target.value; save(); render(); offlineUI(); toast(T("Photos updated. Tap Save all photos for offline to keep this model's photos on your phone.")); });
    $("#s-text").addEventListener("change", function (e) { S.settings.textSize = e.target.value; save(); applyTextSize(); });
    $("#s-capt").addEventListener("change", function (e) { S.settings.captions = e.target.checked; save(); if (e.target.checked) caption(T("Captions on. You'll see what the coach says here."), 3000); });
    $("#eq-on").addEventListener("change", function (e) { S.settings.eqOn = e.target.checked; if (!S.settings.eq) S.settings.eq = EQ.map(function (x) { return x[0]; }); save(); var ec = $("#eq-count"); if (ec) ec.innerHTML = eqCountText(S.settings.eq); render(); });
    $("#s-lang").addEventListener("change", function (e) { S.settings.lang = e.target.value; save(); setTimeout(function () { location.reload(); }, 150); });
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
    var n = lbList.length; $("#lb-img").src = lbList[lbIdx]; $("#lb-img").alt = lbCap || T("Photo");
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
  document.addEventListener("keydown", function (e) { var t = e.target; if ((e.key === "Enter" || e.key === " ") && t && t.getAttribute && t.getAttribute("role") === "button" && t.tagName !== "BUTTON") { e.preventDefault(); t.dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
  document.addEventListener("keydown", function (e) { if ($("#lightbox").hidden) return; if (e.key === "ArrowLeft") lbStep(-1); if (e.key === "ArrowRight") lbStep(1); });
  $("#lightbox").addEventListener("click", closeLightbox);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#lightbox").hidden) closeLightbox(); });
  document.addEventListener("click", function (e) {
    var big = e.target.closest(".xfade") || e.target.closest(".photo-wrap img, img.pphoto, img.howphoto, .snaps img");
    if (big && big.classList.contains("vid") && !e.target.closest("[data-act]")) { e.preventDefault(); var ps = photoSet(big.getAttribute("data-key")); if (ps.length) openLightbox(ps[0], "", ps, 0); return; }
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
      case "qw-open": qwOpen(); break;
      case "challenge": openChallenge(); break;
      case "share-score": shareScore(); break;
      case "sess-img": if (LASTSESS) shareCanvas(sessionImage(LASTSESS), "movage-session.png", "Movage", window.STRAVA && STRAVA.connected() ? T("Image saved. Open Strava and add it to your activity.") : T("Image saved.")); break;
      case "sess-strava": openStravaActivity(); break;
      case "cm-google": case "cm-send": case "cm-verify": case "cm-other-email": case "cm-savenick": case "cm-scope": case "cm-board": case "cm-period": case "cm-verified": case "cm-clubmetric": case "cm-listed": case "cm-joinsheet": case "cm-join": case "cm-create": case "cm-invite": case "cm-leave": case "cm-toggle": case "cm-nickedit": case "cm-signout": case "cm-delete": case "cm-retry": cmAct(a, id); break;
      case "qw-time": case "qw-group": case "qw-muscle": case "qw-sport": case "qw-when": case "qw-next": case "qw-back": case "qw-shuffle": case "qw-start": case "qw-save": qwAct(a, id); break;
      case "play": { var r = findRoutine(id); if (!$("#sheet").hidden) closeSheet(); if (r) play(r); break; }
      case "play-one": closeSheet(); play({ id: "single", n: BY[id].n, items: [id] }); break;
      case "stretch":
        if (building && el.classList.contains("lcard")) { var ix = building.items.indexOf(id); if (ix >= 0) building.items.splice(ix, 1); else building.items.push(id); renderRoutines(); }
        else openStretch(id, stretchNavFrom(el));
        break;
      case "stretch-nav": if (id && BY[id]) openStretch(id); break;
      case "filter": LIB_F = id; renderRoutines(); break;
      case "rgroup": RT_G = id; renderRoutines(); break;
      case "goal-new": case "goal-weeks": case "goal-pick": case "goal-retest": case "goal-open": case "goal-train": case "goal-del": goalAct(a, id); break;
      case "rsport": RT_SP = id; renderRoutines(); break;
      case "rlift": RT_LF = id; renderRoutines(); break;
      case "build": building = { items: [] }; LIB_F = "all"; MG_SEL = []; renderRoutines(); toast((T("Pick muscle areas, then tap moves in order"))); setTimeout(function () { var l = $(".bodymap") || $(".lib"); if (l) l.scrollIntoView({ behavior: "smooth" }); }, 50); break;
      case "build-cancel": building = null; MG_SEL = []; renderRoutines(); break;
      case "mg": { var mi = MG_SEL.indexOf(id); if (mi >= 0) { MG_SEL.splice(mi, 1); if (MG_LAST === id) MG_LAST = MG_SEL[MG_SEL.length - 1] || null; } else { MG_SEL.push(id); MG_LAST = id; } var y = window.scrollY; renderRoutines(); window.scrollTo(0, y); break; }
      case "cr": { var row = el.closest(".chiprow"), cc = row && row.querySelector(".chips"); if (cc) cc.scrollBy({ left: (+id) * Math.max(120, cc.clientWidth * 0.7), behavior: "smooth" }); break; }
      case "mgg": { var gg = MGROUPS.filter(function (g) { return g[0] === id; })[0]; if (!gg) break;
        if (groupOn(gg)) { MG_SEL = MG_SEL.filter(function (m) { return gg[2].indexOf(m) < 0; }); MG_LAST = MG_SEL[MG_SEL.length - 1] || null; }
        else { gg[2].forEach(function (m) { if (MG_SEL.indexOf(m) < 0) MG_SEL.push(m); }); MG_LAST = "g:" + id; }
        var y2 = window.scrollY; renderRoutines(); window.scrollTo(0, y2); break; }
      case "mg-clear": MG_SEL = []; MG_LAST = null; renderRoutines(); break;
      case "settings-open": openSettings(); break;
      case "rm-day": { var rr2 = rem(), dd = +id, ix2 = rr2.days.indexOf(dd); if (ix2 >= 0) { if (rr2.days.length > 1) rr2.days.splice(ix2, 1); } else rr2.days.push(dd); setRem({ days: rr2.days }); remRefresh(); render(); break; }
      case "rm-ics": { var blob = new Blob([remIcs()], { type: "text/calendar" }), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "movage-reminder.ics"; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 1000); toast(T("Open the file and tap Add to put it in your calendar")); break; }
      case "rm-later": { try { localStorage.setItem("sm-nudge-" + iso(), "1"); } catch (e) {} render(); break; }
      case "strava-connect": if (!$("#sv-id").value.trim() || !$("#sv-secret").value.trim()) { toast(T("Enter your Strava Client ID and Client Secret first.")); break; } STRAVA.setConfig({ id: $("#sv-id").value, secret: $("#sv-secret").value }); location.href = STRAVA.authorizeUrl(); break;
      case "strava-code": { STRAVA.setConfig({ id: $("#sv-id").value, secret: $("#sv-secret").value }); var cv = ($("#sv-code").value || "").replace(/^.*[?&]code=([^&]+).*$/, "$1"); if (!cv) break; STRAVA.useCode(cv).then(function () { toast(T("Connected to Strava")); stravaRefresh(); }).catch(function (e) { diag("strava: " + e.message); toast(TF("Couldn't connect to Strava ({error})", { error: e.message })); }); break; }
      case "strava-off": STRAVA.disconnect(); stravaRefresh(); toast(T("Disconnected from Strava")); break;
      case "strava-last": { var ls = S.sessions[S.sessions.length - 1]; if (!ls) { toast(T("Nothing logged yet.")); break; }
        var lr = /\(part\)$/.test(ls.n) ? null : PRESETS.concat(S.routines || []).filter(function (r) { return r.id === ls.id; })[0];
        STRAVA.logSession({ name: ls.n, secs: ls.secs, startLocal: STRAVA.localISO((ls.t || Date.now()) - ls.secs * 1000), description: stravaDesc(lr ? lr.items : [], ls.items) })
          .then(function () { toast(T("Logged to Strava")); stravaRefresh(); }).catch(function (e) { diag("strava: " + e.message); toast(TF("Couldn't log to Strava ({error})", { error: e.message })); stravaRefresh(); }); break; }
      case "build-save": {
        var nm = prompt((T("Name your routine")), building.n || (T("My routine"))); if (nm == null) break; nm = nm.trim() || (T("My routine"));
        if (building.id) S.routines = S.routines.map(function (r) { return r.id === building.id ? { id: r.id, n: nm, items: building.items } : r; });
        else S.routines.push({ id: "u" + Date.now().toString(36), n: nm, items: building.items });
        save(); building = null; MG_SEL = []; renderRoutines(); window.scrollTo(0, 0); toast((T("Saved") + " ") + nm); break;
      }
      case "edit-routine": { var rr = S.routines.filter(function (r) { return r.id === id; })[0]; closeSheet(); if (rr) { building = { id: rr.id, n: rr.n, items: rr.items.slice() }; go("routines"); } break; }
      case "del-routine": if (twice("dr" + id, (T("Tap Delete again to confirm")))) { S.routines = S.routines.filter(function (r) { return r.id !== id; }); save(); closeSheet(); render(); } break;
      case "save-test": saveTest(); break;
      case "cam": openCam(id); break;
      case "c-start": camStart(); break;
      case "c-close": closeCam(); break;
      case "c-flip": CAM.facing = CAM.facing === "user" ? "environment" : "user"; camStart(); break;
      case "c-reset": if (CAM.sess) { CAM.sess.best = {}; readout(); } toast((T("Best readings cleared"))); break;
      case "c-use": camUse(); break;
      case "save-photos": savePhotos(LASTSNAPS); break;
      case "off-save": saveOffline(); break;
      case "off-dismiss": S.settings.offDismiss = true; save(); offlineUI(); break;
      case "p-fig": if (P && P.st[P.i]) { P.figMode = !P.figMode; showFig(P.st[P.i]); } break;
      case "sheet-close": closeSheet(); break;
      case "fm-send": fbMailSend(); break;
      case "diag-copy": try { navigator.clipboard.writeText("v" + APP_VERSION + " " + navigator.userAgent + "\n" + DIAG.join("\n")).then(function () { toast((T("Copied"))); }); } catch (e) {} break;
      case "cd-test": { unlockAudio(); var m0 = cdMode(); cdLoad(m0).then(function () { var fake = P, mine = { cd: null }; P = mine; cdStart(); if (m0 === "voice") setTimeout(function () { if (P === mine) P = fake; }, 3200); else P = fake; }); break; }
      case "p-music": if (musicOn()) { S.settings.lastMusic = S.settings.music; S.settings.music = "off"; MUSIC.stop(1200); } else { S.settings.music = S.settings.lastMusic || "pads"; startMusic(); } save(); el.innerHTML = musicOn() ? ICON.music : ICON.musicOff; break;
      case "music-preview": if (MUSIC.playing() && !P) { MUSIC.stop(800); el.textContent = (T("Preview music")); } else if (musicOn()) { startMusic(); el.textContent = (T("Stop preview")); } else toast((T("Pick a music style first"))); break;
      case "voice-test": { unlockAudio(); var was = S.settings.voice; S.settings.voice = true; speak(pick([(T("Hi there. This is how I'll sound during your sessions. Let's get moving.")), (T("Hello. I'll be your coach for mobility tests and stretching. Ready when you are."))]), true); S.settings.voice = was; break; }
      case "c-voice": case "p-voice": S.settings.voice = !S.settings.voice; save(); el.innerHTML = S.settings.voice ? ICON.sound : ICON.mute; if (!S.settings.voice) try { speechSynthesis.cancel(); } catch (x) {} break;
      case "p-close": closePlayer(); break;
      case "p-pause": togglePause(); break;
      case "p-easier": swapMove("easy"); break;
      case "p-harder": swapMove("hard"); break;
      case "p-more": addTime(15); toast(T("15 seconds added")); break;
      case "fb-rate": { var f = fb(), d0 = +id; f.scale = Math.round(Math.max(0.7, Math.min(1.5, f.scale + (d0 < 0 ? 0.1 : d0 > 0 ? -0.1 : 0))) * 100) / 100; save();
        [].forEach.call(document.querySelectorAll(".fbrate .chip"), function (c) { c.classList.toggle("on", c === el); });
        toast(d0 < 0 ? T("Got it. Holds will be a little longer next time.") : d0 > 0 ? T("Got it. Holds will be a little shorter next time.") : T("Great, keeping it as it is.")); break; }
      case "fb-hurt": { var hh = fb().hurt; if (hh[id]) delete hh[id]; else hh[id] = iso(); save(); el.classList.toggle("on", !!hh[id]);
        if (hh[id]) toast(altOf(id, "easy") ? TF("Next time {a} will be swapped for {b}.", { a: BY[id].n, b: BY[altOf(id, "easy")].n }) : TF("Next time {a} will be skipped.", { a: BY[id].n })); break; }
      case "fb-unhurt": { delete fb().hurt[id]; save(); var pa = $("#pa-slot"); if (pa) pa.innerHTML = paCard(); break; }
      case "fb-reset": { fb().scale = 1; save(); var pb = $("#pa-slot"); if (pb) pb.innerHTML = paCard(); toast(T("Holds reset to standard")); break; }
      case "eq-item": { var have = S.settings.eq || EQ.map(function (e) { return e[0]; }), ei = have.indexOf(id); if (ei >= 0) have.splice(ei, 1); else have.push(id); S.settings.eq = have; save(); el.classList.toggle("on", ei < 0); var ec = $("#eq-count"); if (ec) ec.innerHTML = eqCountText(have); render(); break; }
      case "p-next": if (P) { P.i++; enterStep(); } break;
      case "p-prev": if (P) { if (P.phase === "work" && P.left < P.dur - 3) { /* restart current */ } else P.i = Math.max(0, P.i - 1); enterStep(); } break;
      case "test-detail": testDetail(id); break;
      case "edit-test": closeSheet(); draft = draftFor(id); go("test"); break;
      case "del-test": if (twice("dt" + id, (T("Tap Delete again to confirm")))) { S.tests = S.tests.filter(function (t) { return t.date !== id; }); save(); closeSheet(); render(); } break;
      case "export": doExport(); break;
      case "copy": doCopy(); break;
      case "paste-import": doImport($("#s-paste").value); break;
      case "reset": if (twice("reset", (T("Tap again to delete everything on this phone")))) { S = blank(); save(); closeSheet(); draft = null; go("home"); toast((T("All data deleted"))); } break;
    }
  });

  /* ---------- offline photos: save every stretch photo into the app's photo cache so routines work with no signal ---------- */
  var OFF = { busy: false, done: 0, total: 0 };
  /* Photos to keep offline: every photo of the chosen model. */
  function photoList() { var seen = {}, out = []; Object.keys(window.PHOTOS || {}).forEach(function (k) { photoSet(k).concat(vidUrl(k) || []).forEach(function (u) { if (!seen[u]) { seen[u] = 1; out.push(u); } }); }); return out; }
  function offlineCount() {
    if (!window.caches) return Promise.resolve(0);
    return caches.open("sm-photos").then(function (c) { return Promise.all(photoList().map(function (u) { return c.match(u).then(function (r) { return r ? 1 : 0; }); })); }).then(function (xs) { return xs.reduce(function (s, x) { return s + x; }, 0); }).catch(function () { return 0; });
  }
  function offlineUI() {
    var t = photoList().length, el = $("#off-status"), b = $("#off-btn"), bn = null;
    offlineCount().then(function (n) {
      OFF.done = n; OFF.total = t;
      if (el) el.textContent = OFF.busy ? (T("Saving…") + " ") + n + " " + T("of") + " " + t : n >= t ? (T("All") + " ") + t + (" " + T("photos saved on this phone. Routines work with no signal.")) : n + " " + T("of") + " " + t + (" " + T("photos saved on this phone."));
      if (b) { b.disabled = OFF.busy || n >= t; b.textContent = n >= t ? (T("All saved")) : OFF.busy ? (T("Saving…")) : (T("Save all photos for offline")); }
      if (bn) bn.hidden = n >= t || !!S.settings.offDismiss;
    });
  }
  async function saveOffline() {
    if (OFF.busy || !window.caches) { if (!window.caches) toast((T("This browser can't store photos offline."))); return; }
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
    toast(fails ? fails + (" " + T("photos couldn't be saved. Try again on Wi-Fi.")) : (T("All photos saved for offline use")));
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
  }

  /* ---------- Community: accounts, communities and leaderboards (through the CLOUD adapter, Supabase) ----------
     Opt-in. People sign in with an emailed code, pick a nickname and choose what to share. Only time from the
     guided player counts. A score gets a tick when every result in it was measured with the camera. */
  var CM = { stage: null, email: "", board: "time", period: "week", clubMetric: "week", scope: null, verifiedOnly: false, comms: [], rows: null, prof: null, busy: false, err: "", pendingJoin: null, arm: "", req: 0 };
  function cmOn() { return !!(window.CLOUD && CLOUD.configured()); }
  function cmUuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16); });
  }
  function cmErr(e) {
    var m = String((e && (e.message || e.error_description)) || e || "");
    var map = [["set a nickname first", T("Choose a nickname first.")], ["no community with that code", T("No club has that code. Check it and try again.")], ["only the club owner", T("Only the club owner can change this.")],
      ["community limit reached", T("You can create up to 10 clubs.")], ["membership limit reached", T("You can be in up to 20 clubs.")],
      ["not a member", T("You're not in that club any more.")], ["profiles_nickname_ci", T("That nickname is taken. Try another.")]];
    for (var i = 0; i < map.length; i++) if (m.indexOf(map[i][0]) >= 0) return map[i][1];
    if (/rate limit|too many|security purposes/i.test(m)) return T("Too many attempts. Wait a minute and try again.");
    if (/token|otp|expired|invalid/i.test(m)) return T("That code didn't work. Check it, or ask for a new one.");
    if (/network|fetch|load failed|offline/i.test(m)) return T("Can't reach the community right now. Check your connection.");
    return m || T("Something went wrong. Try again.");
  }
  function cmRange(p) {
    var d = new Date(), to = iso(d);
    if (p === "day") return [to, to];
    if (p === "week") { var w = new Date(d); w.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return [iso(w), to]; }
    return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), to];
  }
  function cmDaysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return iso(d); }
  function cmHm(s) { var m = Math.round((s || 0) / 60), h = Math.floor(m / 60); return h ? TF("{h} h {m} min", { h: h, m: m % 60 }) : TF("{m} min", { m: m }); }
  /* Sessions from the last 31 days count once someone joins, so the board isn't empty on day one. */
  function cmBackfill() { var cut = cmDaysAgo(31), ch = false; S.sessions.forEach(function (s) { if (!s.cid && s.date >= cut && s.secs >= 30) { s.cid = cmUuid(); ch = true; } }); if (ch) save(); }
  function cmLatestScore() {
    var v = {}, cam = {};
    S.tests.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (t) { var c = t.cam || []; Object.keys(t.v).forEach(function (k) { if (isNum(t.v[k])) { v[k] = t.v[k]; cam[k] = c.indexOf(k) >= 0; } }); });
    var sc = score(v); if (!isNum(sc.overall)) return null;
    var used = Object.keys(v).filter(function (k) { return k.indexOf("squat_") !== 0; });
    var zones = {}; Object.keys(sc.zones).forEach(function (z) { if (isNum(sc.zones[z])) zones[z] = sc.zones[z]; });
    return { overall: Math.round(sc.overall), zones: zones, verified: used.length > 0 && used.every(function (k) { return cam[k]; }), tested_on: lastTestDate() };
  }
  var CM_SYNCING = false;
  function cmSync() {
    if (!cmOn() || CM_SYNCING || !CM.prof || navigator.onLine === false) return Promise.resolve();
    CM_SYNCING = true;
    var cut = cmDaysAgo(34), job = Promise.resolve();
    if (CM.prof.share_time) S.sessions.filter(function (s) { return s.cid && !s.up && s.date >= cut && s.secs >= 30; }).forEach(function (s) {
      job = job.then(function () { return CLOUD.addSession({ id: s.cid, local_date: s.date, secs: Math.min(7200, Math.round(s.secs)) }).then(function () { s.up = 1; }, function (e) { if (e && e.permanent) s.up = -1; else throw e; }); });
    });
    if (CM.prof.share_score) {
      var sc = cmLatestScore();
      if (sc) { var sig = JSON.stringify([sc.overall, sc.verified, sc.tested_on]); if (!S.cloud || S.cloud.scoreSig !== sig) job = job.then(function () { return CLOUD.setScore(sc).then(function () { S.cloud = Object.assign(S.cloud || {}, { scoreSig: sig }); }); }); }
    }
    return job.catch(function (e) { diag("community sync: " + (e && e.message)); }).then(function () { save(); CM_SYNCING = false; });
  }
  /* At start-up, only phones that have signed in before load anything. */
  function cmBoot() {
    if (!cmOn() || !CLOUD.hasSession()) return;
    CLOUD.user().then(function (u) { if (!u) return; return CLOUD.profile().then(function (p) { if (!p) return; CM.prof = p; if (!CM.stage) { CM.stage = "main"; cmComms(); } cmBackfill(); return cmSync(); }); }).catch(function (e) { diag("community: " + (e && e.message)); });
    window.addEventListener("online", function () { cmSync(); });
  }
  function cmComms() { return CLOUD.myCommunities().then(function (c) { CM.comms = c || []; if (CM.scope && !CM.comms.some(function (x) { return x.id === CM.scope; })) CM.scope = null; }, function () {}); }
  function cmLoad() {
    if (!cmOn()) { CM.stage = "off"; return renderCommunity(); }
    CM.stage = "loading"; CM.err = ""; renderCommunity();
    (CLOUD.handleOAuthReturn ? CLOUD.handleOAuthReturn() : Promise.resolve(null)).then(function (ret) {
      if (ret && ret.error) { diag("google sign-in: " + ret.error); toast(/access_denied/i.test(ret.error) ? T("Google sign-in was cancelled.") : T("Google sign-in didn't finish. Try again.")); }
      return CLOUD.user();
    }).then(function (u) {
      if (!u) { CM.stage = "signin"; return; }
      CM.suggest = CLOUD.suggestedName ? CLOUD.suggestedName(u) : "";
      return CLOUD.profile().then(function (p) {
        CM.prof = p; if (!p) { CM.stage = "nick"; return; }
        CM.stage = "main"; cmBackfill(); return cmComms().then(function () { return cmSync(); });
      });
    }).catch(function (e) { CM.err = cmErr(e); CM.stage = "error"; }).then(cmAfterIn);
  }
  function cmAfterIn() {
    if (CM.stage === "main" && CM.pendingJoin) { var c = CM.pendingJoin; CM.pendingJoin = null; return cmJoin(c); }
    if (CM.stage === "main") return cmRefresh();
    renderCommunity();
  }
  function cmRefresh() {
    if (CM.stage !== "main") return renderCommunity();
    var my = ++CM.req; CM.rows = null; CM.err = ""; CM.inflight = true; renderCommunity();
    if (CM.board === "clubs" && CM.scope) CM.board = "time";
    var r = cmRange(CM.period), p;
    if (CM.board === "clubs") { var cr = cmRange(CM.clubMetric === "month" ? "month" : "week"); p = CLOUD.clubBoard(CM.clubMetric === "score" ? "score" : "time", cr[0], cr[1]); }
    else p = CM.board === "time" ? CLOUD.timeBoard(CM.scope, r[0], r[1]) : CLOUD.scoreBoard(CM.scope, CM.verifiedOnly);
    p.then(function (rows) { if (my !== CM.req) return; CM.rows = rows || []; }, function (e) { if (my !== CM.req) return; CM.rows = []; CM.err = cmErr(e); if (/not a member/.test(String(e && e.message))) { CM.scope = null; cmComms(); } })
      .then(function () { if (my === CM.req) { CM.inflight = false; renderCommunity(); } });
  }
  function cmJoin(code) {
    CM.busy = true; renderCommunity();
    return CLOUD.joinCommunity(code).then(function (c) {
      CM.busy = false; closeSheet(); if (!c) return;
      toast(TF("You've joined {name}.", { name: c.name }));
      CM.scope = c.id; return cmComms().then(cmRefresh);
    }, function (e) { CM.busy = false; toast(cmErr(e)); renderCommunity(); });
  }
  function cmBusy() { return CM.busy ? " disabled" : ""; }
  function cmToggle(id, on, label, sub) {
    return '<button class="cmtoggle" role="switch" aria-checked="' + (on ? "true" : "false") + '" data-act="cm-toggle" data-id="' + id + '"><span class="grow"><b>' + label + "</b>" + (sub ? '<span class="small muted">' + sub + "</span>" : "") + '</span><span class="cmsw' + (on ? " on" : "") + '"><i></i></span></button>';
  }
  function renderCommunity() {
    if (TAB !== "community") return;
    var el = $("#v-community"); if (!el) return;
    if (CM.stage === null) { cmLoad(); return; }
    /* Signed in at start-up (cmBoot) but the board hasn't been fetched yet: fetch it now. */
    if (CM.stage === "main" && CM.rows === null && !CM.inflight) { cmRefresh(); return; }
    var h = "", st = CM.stage;
    var intro = '<div class="card cmhero"><img class="lg-l" src="img/logo-s-light.png" alt="Movage"><img class="lg-d" src="img/logo-s-dark.png" alt="Movage"><h2>' + T("Move together") + '</h2><p class="muted">' + T("Start or join a club, see who's putting the time in, and compare mobility scores with friends, your gym or everyone on Movage.") + "</p></div>";
    if (st === "off") h = intro + '<div class="card"><p>' + T("Community leaderboards are coming soon.") + "</p></div>";
    else if (st === "loading") h = '<div class="card"><p class="muted">' + T("Loading the community…") + "</p></div>";
    else if (st === "error") h = '<div class="card"><p>' + esc(CM.err) + '</p><button class="btn block" data-act="cm-retry" style="margin-top:12px">' + T("Try again") + "</button></div>";
    else if (st === "signin") {
      h = intro + '<div class="card"><h3>' + T("Sign in or create an account") + "</h3>" +
        (CLOUD.signInWithGoogle ? '<button class="btn block gbtn" data-act="cm-google" style="margin-top:12px"' + cmBusy() + '><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.7 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.3 5.7c4.3-3.9 7-9.7 7-17z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg><span>' + T("Continue with Google") + '</span></button><div class="ordiv"><span>' + T("or use your email") + "</span></div>" : "") +
        '<p class="small muted" style="margin:4px 0 12px">' + T("We'll email you a 6-digit code. No password needed. Your email is never shown to anyone.") + "</p>" +
        '<input class="inp" id="cm-email" type="email" inputmode="email" autocomplete="email" placeholder="' + esc(T("Your email address")) + '" value="' + esc(CM.email) + '" style="width:100%">' +
        '<button class="btn primary block" data-act="cm-send" style="margin-top:12px"' + cmBusy() + ">" + T("Email me a code") + "</button></div>";
    } else if (st === "code") {
      h = '<div class="card"><h3>' + T("Check your email") + '</h3><p class="small muted" style="margin:4px 0 12px">' + TF("Enter the code we sent to {email}.", { email: esc(CM.email) }) + "</p>" +
        '<input class="inp cmcode" id="cm-code" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="123456" style="width:100%">' +
        '<button class="btn primary block" data-act="cm-verify" style="margin-top:12px"' + cmBusy() + ">" + T("Sign in") + '</button><button class="btn ghost block" data-act="cm-other-email" style="margin-top:6px">' + T("Use a different email") + "</button></div>";
    } else if (st === "nick") {
      var pr = CM.prof || { nickname: CM.suggest || "", share_time: true, share_score: true };
      h = '<div class="card"><h3>' + T("Choose a nickname") + '</h3><p class="small muted" style="margin:4px 0 12px">' + T("This is the only name other people will see on the leaderboards.") + "</p>" +
        '<input class="inp" id="cm-nick" maxlength="20" autocomplete="nickname" placeholder="' + esc(T("Nickname")) + '" value="' + esc(pr.nickname || "") + '" style="width:100%">' +
        '<label class="cmcheck"><input type="checkbox" id="cm-st"' + (pr.share_time !== false ? " checked" : "") + "> " + T("Show my mobility time on leaderboards") + "</label>" +
        '<label class="cmcheck"><input type="checkbox" id="cm-ss"' + (pr.share_score !== false ? " checked" : "") + "> " + T("Show my mobility score on leaderboards") + "</label>" +
        '<button class="btn primary block" data-act="cm-savenick" style="margin-top:12px"' + cmBusy() + ">" + T("Save") + "</button></div>";
    } else if (st === "main") {
      var scopeChips = '<button class="chip' + (!CM.scope ? " on" : "") + '" data-act="cm-scope" data-id="">' + T("Everyone") + "</button>" +
        CM.comms.map(function (c) { return '<button class="chip' + (CM.scope === c.id ? " on" : "") + '" data-act="cm-scope" data-id="' + c.id + '">' + esc(c.name) + "</button>"; }).join("") +
        '<button class="chip clear" data-act="cm-joinsheet">' + T("+ Club") + "</button>";
      h += chipRow(scopeChips);
      h += '<div class="seg cmseg" role="tablist"><button role="tab" aria-selected="' + (CM.board === "time") + '" class="' + (CM.board === "time" ? "on" : "") + '" data-act="cm-board" data-id="time">' + T("Time") + '</button><button role="tab" aria-selected="' + (CM.board === "score") + '" class="' + (CM.board === "score" ? "on" : "") + '" data-act="cm-board" data-id="score">' + T("Score") + "</button>" + (!CM.scope ? '<button role="tab" aria-selected="' + (CM.board === "clubs") + '" class="' + (CM.board === "clubs" ? "on" : "") + '" data-act="cm-board" data-id="clubs">' + T("Top clubs") + "</button>" : "") + "</div>";
      if (CM.board === "time") h += '<div class="chips cmsub">' + [["day", T("Today")], ["week", T("This week")], ["month", T("This month")]].map(function (p) { return '<button class="chip' + (CM.period === p[0] ? " on" : "") + '" data-act="cm-period" data-id="' + p[0] + '">' + p[1] + "</button>"; }).join("") + "</div>";
      else if (CM.board === "clubs") h += '<div class="chips cmsub">' + [["week", T("Time this week")], ["month", T("Time this month")], ["score", T("Average score")]].map(function (p) { return '<button class="chip' + (CM.clubMetric === p[0] ? " on" : "") + '" data-act="cm-clubmetric" data-id="' + p[0] + '">' + p[1] + "</button>"; }).join("") + "</div>";
      else h += '<div class="chips cmsub"><button class="chip' + (CM.verifiedOnly ? " on" : "") + '" data-act="cm-verified" aria-pressed="' + CM.verifiedOnly + '"><span class="cmtick">' + ICON.check + "</span>" + T("Camera-verified only") + "</button></div>";
      h += '<div class="card cmboard">';
      if (CM.rows === null) h += '<p class="muted">' + T("Loading…") + "</p>";
      else if (CM.err) h += "<p>" + esc(CM.err) + "</p>";
      else if (!CM.rows.length) h += '<p class="muted">' + (CM.board === "clubs" ? T("No clubs on the board yet. Start a club, invite a friend and finish a routine to get on it.") : CM.board === "time" ? T("No time logged in this period yet. Finish a guided routine to get on the board.") : (CM.verifiedOnly ? T("No camera-verified scores yet.") : T("No scores shared yet. Save a mobility test to add yours."))) + "</p>";
      else if (CM.board === "clubs") h += CM.rows.map(function (r) {
        var val = CM.clubMetric === "score" ? "<b>" + Math.round(Number(r.value)) + "</b>" : cmHm(Number(r.value));
        var open = r.id ? ' data-act="cm-scope" data-id="' + esc(r.id) + '" role="button" tabindex="0"' : "";
        return '<div class="cmrow cmclub' + (r.is_mine ? " me" : "") + '"' + open + '><span class="cmrank">' + r.rank + '</span><span class="cmname">' + esc(r.name) + (r.is_mine ? ' <span class="small muted">(' + T("your club") + ")</span>" : "") + '<span class="cmmem">' + TF("{n} members", { n: r.members }) + '</span></span><span class="cmval">' + val + "</span></div>";
      }).join("");
      else h += CM.rows.map(function (r) {
        var val = CM.board === "time" ? cmHm(r.secs) : '<b>' + r.overall + "</b>" + (r.verified ? '<span class="cmtick on" role="img" aria-label="' + esc(T("Camera verified")) + '" title="' + esc(T("Camera verified")) + '">' + ICON.check + "</span>" : '<span class="cmtick"></span>');
        return '<div class="cmrow' + (r.is_me ? " me" : "") + '"><span class="cmrank">' + r.rank + '</span><span class="cmname">' + esc(r.nickname) + (r.is_me ? ' <span class="small muted">(' + T("you") + ")</span>" : "") + '</span><span class="cmval">' + val + "</span></div>";
      }).join("");
      h += "</div>";
      h += '<p class="small muted cmnote">' + (CM.board === "clubs" ? (CM.clubMetric === "score" ? T("Clubs with 2 or more members. The average of members who show their mobility score.") : T("Clubs with 2 or more members. Adds up guided time from every member who shows their time.")) + " " + T("Only club names and member counts are shown.") : CM.board === "time" ? T("Only time from the guided player counts. Sessions from the 31 days before you joined are included.") : T("Your latest score from your most recent tests. A tick means every result in it was measured with the camera.")) + "</p>";
      var cur = CM.scope && CM.comms.filter(function (c) { return c.id === CM.scope; })[0];
      if (cur) h += '<div class="card cmcomm"><div class="grow"><h3>' + esc(cur.name) + '</h3><p class="small muted">' + (Number(cur.members) === 1 ? T("1 member") : TF("{n} members", { n: cur.members })) + " · " + T("Invite code") + ' <b class="cmcodebig">' + esc(cur.code) + '</b></p></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary" data-act="cm-invite" data-id="' + cur.id + '">' + T("Invite") + '</button><button class="btn ghost" data-act="cm-leave" data-id="' + cur.id + '">' + (CM.arm === "leave" ? T("Tap again to leave") : T("Leave")) + "</button></div>" + (cur.is_owner ? '<div style="margin-top:12px">' + cmToggle("listed", cur.listed !== false, T("Show on Top clubs"), T("Everyone on Movage can see the club name and member count.")).replace('data-act="cm-toggle" data-id="listed"', 'data-act="cm-listed" data-id="' + cur.id + '"') + "</div>" : "") + "</div>";
      var me = CM.prof || {};
      h += '<div class="sec"><h2>' + T("Your profile") + '</h2></div><div class="card cmprof"><p>' + TF("Signed in as {name}", { name: "<b>" + esc(me.nickname || "") + "</b>" }) + '</p><button class="btn ghost" data-act="cm-nickedit" style="margin:8px 0">' + T("Change nickname") + "</button>" +
        cmToggle("share_time", me.share_time, T("Show my mobility time"), "") + cmToggle("share_score", me.share_score, T("Show my mobility score"), "") +
        '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap"><button class="btn" data-act="cm-signout">' + T("Sign out") + '</button><button class="btn danger" data-act="cm-delete"' + cmBusy() + ">" + (CM.arm === "delete" ? T("Tap again to delete for good") : T("Delete my account")) + "</button></div>" +
        '<p class="small muted" style="margin-top:8px">' + T("Deleting your account removes your nickname, clubs, shared time and score from Movage's servers. Your history on this phone stays.") + "</p></div>";
    }
    var keep = [].map.call(document.querySelectorAll("#v-community .chiprow .chips"), function (c) { return c.scrollLeft; });
    el.innerHTML = h; wireRows(el, keep);
  }
  function cmAct(a, id) {
    if (a !== "cm-leave" && a !== "cm-delete") CM.arm = "";
    var val = function (sel) { var x = $(sel); return x ? x.value.trim() : ""; };
    switch (a) {
      case "cm-retry": CM.stage = null; renderCommunity(); break;
      case "cm-send": {
        var em = val("#cm-email"); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast(T("Enter a valid email address.")); return; }
        CM.email = em; CM.busy = true; renderCommunity();
        CLOUD.sendCode(em).then(function () { CM.busy = false; CM.stage = "code"; renderCommunity(); setTimeout(function () { var c = $("#cm-code"); if (c) c.focus(); }, 50); }, function (e) { CM.busy = false; toast(cmErr(e)); renderCommunity(); });
        break;
      }
      case "cm-verify": {
        var code = val("#cm-code").replace(/\D/g, ""); if (code.length < 6) { toast(T("Enter the code from the email.")); return; }
        CM.busy = true; renderCommunity();
        CLOUD.verifyCode(CM.email, code).then(function () { return CLOUD.profile(); }).then(function (p) {
          CM.busy = false; CM.prof = p;
          if (!p) { CM.stage = "nick"; return renderCommunity(); }
          CM.stage = "main"; cmBackfill(); return cmComms().then(cmSync).then(cmAfterIn);
        }, function (e) { CM.busy = false; toast(cmErr(e)); renderCommunity(); });
        break;
      }
      case "cm-other-email": CM.stage = "signin"; renderCommunity(); break;
      case "cm-google":
        CM.busy = true; renderCommunity();
        try { if (CM.pendingJoin) sessionStorage.setItem("cm-join", CM.pendingJoin); } catch (e) {}
        CLOUD.signInWithGoogle().then(function () { /* the page now leaves for Google */ }, function (e) { CM.busy = false; toast(cmErr(e)); renderCommunity(); });
        break;
      case "cm-savenick": {
        var nk = val("#cm-nick"); if (nk.length < 2 || nk.length > 20) { toast(T("Nicknames are 2 to 20 characters.")); return; }
        if (/[<>]/.test(nk)) { toast(T("Nicknames can't contain < or >.")); return; }
        var p = { nickname: nk, share_time: $("#cm-st").checked, share_score: $("#cm-ss").checked };
        CM.busy = true; renderCommunity();
        CLOUD.saveProfile(p).then(function (pr) {
          var first = !CM.prof; CM.busy = false; CM.prof = pr; CM.stage = "main";
          if (first) toast(T("Welcome to the Movage community."));
          cmBackfill(); return cmComms().then(cmSync).then(cmAfterIn);
        }, function (e) { CM.busy = false; toast(cmErr(e)); renderCommunity(); });
        break;
      }
      case "cm-scope": CM.scope = id || null; cmRefresh(); break;
      case "cm-board": CM.board = id; cmRefresh(); break;
      case "cm-period": CM.period = id; cmRefresh(); break;
      case "cm-verified": CM.verifiedOnly = !CM.verifiedOnly; cmRefresh(); break;
      case "cm-clubmetric": CM.clubMetric = id; cmRefresh(); break;
      case "cm-listed": {
        var lc = CM.comms.filter(function (x) { return x.id === id; })[0]; if (!lc) return;
        var nl = lc.listed === false; lc.listed = nl; renderCommunity();
        CLOUD.setListed(id, nl).then(function () { toast(nl ? T("Your club is on the Top clubs board.") : T("Your club is hidden from Top clubs.")); }, function (e) { lc.listed = !nl; renderCommunity(); toast(cmErr(e)); });
        break;
      }
      case "cm-joinsheet":
        openSheet('<h2>' + T("Join or create a club") + '</h2><div class="card" style="margin-top:12px"><h3>' + T("Join with a code") + '</h3><p class="small muted" style="margin:4px 0 10px">' + T("Ask a club member for their 6-letter invite code.") + '</p><input class="inp cmcode" id="cm-joincode" maxlength="6" autocapitalize="characters" autocomplete="off" placeholder="ABC234" style="width:100%"><button class="btn primary block" data-act="cm-join" style="margin-top:10px">' + T("Join") + "</button></div>" +
          '<div class="card"><h3>' + T("Start a new club") + '</h3><p class="small muted" style="margin:4px 0 10px">' + T("For your gym, run club, team or friends. You'll get an invite code to share, and your club gets its own leaderboard.") + '</p><input class="inp" id="cm-newname" maxlength="40" placeholder="' + esc(T("Club name")) + '" style="width:100%"><label class="cmcheck"><input type="checkbox" id="cm-newlisted" checked> ' + T("Show on the Top clubs leaderboard") + '</label><p class="small muted" style="margin:2px 0 0">' + T("Only the club name and member count are shown, never who's in it.") + '</p><button class="btn block" data-act="cm-create" style="margin-top:10px">' + T("Create") + "</button></div>");
        break;
      case "cm-join": { var jc = val("#cm-joincode").toUpperCase(); if (!/^[A-Z2-9]{6}$/.test(jc)) { toast(T("Invite codes are 6 letters and numbers.")); return; } cmJoin(jc); break; }
      case "cm-create": {
        var nm = val("#cm-newname"); if (nm.length < 2 || nm.length > 40 || /[<>]/.test(nm)) { toast(T("Names are 2 to 40 characters.")); return; }
        var nlst = $("#cm-newlisted"); CLOUD.createCommunity(nm, nlst ? nlst.checked : true).then(function (c) { closeSheet(); toast(TF("{name} is ready. Share the code {code} to invite people.", { name: c.name, code: c.code })); CM.scope = c.id; return cmComms().then(cmRefresh); }, function (e) { toast(cmErr(e)); });
        break;
      }
      case "cm-invite": {
        var c = CM.comms.filter(function (x) { return x.id === id; })[0]; if (!c) return;
        var link = location.origin + location.pathname + "?join=" + c.code, text = TF("Join {name} on Movage and let's see who moves most. Code: {code}", { name: c.name, code: c.code });
        if (navigator.share) navigator.share({ title: "Movage", text: text, url: link }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(text + " " + link).then(function () { toast(T("Invite copied.")); }, function () { toast(link); });
        else toast(link);
        break;
      }
      case "cm-leave":
        if (CM.arm !== "leave") { CM.arm = "leave"; renderCommunity(); return; }
        CM.arm = ""; CLOUD.leaveCommunity(id).then(function () { toast(T("You've left the club.")); CM.scope = null; return cmComms().then(cmRefresh); }, function (e) { toast(cmErr(e)); });
        break;
      case "cm-toggle": {
        var np = Object.assign({}, CM.prof); np[id] = !np[id];
        CLOUD.saveProfile(np).then(function (pr) { CM.prof = pr; if (pr[id]) cmSync().then(cmRefresh); else cmRefresh(); }, function (e) { toast(cmErr(e)); });
        break;
      }
      case "cm-nickedit": CM.stage = "nick"; renderCommunity(); break;
      case "cm-signout":
        CLOUD.signOut().then(function () { CM.prof = null; CM.comms = []; CM.scope = null; CM.rows = null; CM.stage = "signin"; renderCommunity(); toast(T("Signed out.")); });
        break;
      case "cm-delete":
        if (CM.arm !== "delete") { CM.arm = "delete"; renderCommunity(); return; }
        CM.arm = ""; CM.busy = true; renderCommunity();
        CLOUD.deleteAccount().then(function () {
          S.sessions.forEach(function (s) { delete s.up; }); delete S.cloud; save();
          CM.busy = false; CM.prof = null; CM.comms = []; CM.scope = null; CM.rows = null; CM.stage = "signin"; renderCommunity();
          toast(T("Your account and community data have been deleted."));
        }, function (e) { CM.busy = false; toast(cmErr(e)); renderCommunity(); });
        break;
    }
  }

  /* ---------- boot ---------- */
  document.addEventListener("touchend", function once() { document.removeEventListener("touchend", once); try { unlockAudio(); cdLoad(cdMode()); } catch (e) {} }, { passive: true });
  applyTheme();
  var t0 = "home"; try { t0 = sessionStorage.getItem("sm-tab") || "home"; } catch (e) {}
  (function () { var j = new URLSearchParams(location.search).get("join"); if (!j || !/^[A-Za-z2-9]{6}$/.test(j)) return; CM.pendingJoin = j.toUpperCase(); try { history.replaceState(null, "", location.pathname); } catch (e) {} t0 = "community"; })();
  if (window.CLOUD && CLOUD.configured() && CLOUD.isOAuthReturn && CLOUD.isOAuthReturn()) { t0 = "community"; try { var pj = sessionStorage.getItem("cm-join"); if (pj) { CM.pendingJoin = pj; sessionStorage.removeItem("cm-join"); } } catch (e) {} }
  cmBoot();
  go(t0);
  (function () { var sp = $("#splash"); if (!sp) return; var sv = $("#splash-ver"); if (sv) sv.textContent = "v" + APP_VERSION; setTimeout(function () { sp.classList.add("out"); setTimeout(function () { sp.remove(); }, 450); }, 700); })();
  (function () { var q = new URLSearchParams(location.search), pl = q.get("play"); if (!pl) return; try { history.replaceState(null, "", location.pathname); } catch (e) {} setTimeout(function () { if (findRoutine(pl)) openRoutine(pl); }, 300); })();
  if (window.STRAVA) {
    STRAVA.onLog(diag);
    STRAVA.handleRedirect().then(function (res) {
      if (!res) return STRAVA.flush();
      if (res.status === "connected") { toast(T("Connected to Strava")); return STRAVA.flush(); }
      if (res.status === "code-only") openSheet('<h2>Strava</h2><div class="card" style="margin-top:12px"><p>' + T("Strava approved the connection, but it came back to a browser window rather than the app. Copy this code, then open the app and paste it in Settings > Strava.") + '</p><input class="inp" readonly style="width:100%;margin-top:10px" value="' + esc(res.code) + '" onclick="this.select()"></div>');
    }).catch(function (e) { diag("strava: " + e.message); toast(TF("Couldn't connect to Strava ({error})", { error: e.message })); });
    window.addEventListener("online", function () { STRAVA.flush().catch(function () {}); });
  }
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(function (reg) {
      /* Look for a new version each time the app comes back to the front, and reload once when it takes over. */
      document.addEventListener("visibilitychange", function () { if (!document.hidden) reg.update().catch(function () {}); });
    }).catch(function () {});
    var hadSW = !!navigator.serviceWorker.controller, reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () { var pl = document.getElementById("player"); if (hadSW && !reloaded && !(pl && !pl.hidden)) { reloaded = true; location.reload(); } });
  }
  if (window.speechSynthesis) speechSynthesis.getVoices();
  window.SM = { state: function () { return S; }, score: score, dailyItems: dailyItems, cam: function () { return CAM; }, player: function () { return P; }, enterStep: function () { enterStep(); } };
})();
