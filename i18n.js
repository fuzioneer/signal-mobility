/* Languages. English is written in the code; every user-facing string goes through T("English text"), which looks it up in
   the current language's file (lang/xx.js). Stretch, routine and test content is swapped in by I18N.applyContent.
   Changing language in Settings saves it and reloads the app. */
(function () {
  var LANGS = [["en", "English"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"], ["it", "Italiano"], ["pt", "Português"]];
  var LOCALE = { en: "en-GB", es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-PT" };
  var lang = "en", pseudo = /[?&]pseudo=1/.test(location.search);
  try {
    var x = JSON.parse(localStorage.getItem("signal-mobility-v1")), l = x && x.settings && x.settings.lang;
    if (!l) { var nl = (navigator.language || "en").slice(0, 2).toLowerCase(); l = LOCALE[nl] ? nl : "en"; }
    lang = LOCALE[l] ? l : "en";
  } catch (e) {}
  var I = window.I18N = { LANGS: LANGS, lang: lang, locale: LOCALE[lang], dict: {}, content: {}, pseudo: pseudo };
  I.add = function (l, ui, content) { I.dict[l] = ui || {}; I.content[l] = content || {}; };
  var miss = {};
  window.T = function (s) {
    if (s == null) return s; s = String(s);
    if (pseudo) return "⟦" + s + "⟧";
    if (lang === "en") return s;
    var r = (I.dict[lang] || {})[s];
    if (r == null) { miss[s] = 1; return s; }
    return r;
  };
  /* Template with {name} placeholders, translated as a whole so word order can change per language. */
  window.TF = function (s, vars) { return T(s).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; }); };
  I.missing = function () { return Object.keys(miss); };
  /* Swap in translated names, instructions and reps. The English originals are kept on _en for kit detection. */
  I.applyContent = function (D) {
    var C = pseudo ? null : I.content[lang]; if (lang === "en" && !pseudo) return;
    var tr = function (v) { return pseudo ? "⟦" + v + "⟧" : v; };
    D.STRETCH.forEach(function (s) {
      s._en = { n: s.n, cues: s.cues, reps: s.reps }; var c = C ? (C.stretch || {})[s.id] : null;
      if (pseudo) { s.n = tr(s.n); s.cues = tr(s.cues); if (s.reps) s.reps = tr(s.reps); return; }
      if (c) { if (c.n) s.n = c.n; if (c.cues) s.cues = c.cues; if (c.reps && s.reps) s.reps = c.reps; }
    });
    D.PRESETS.forEach(function (p) { var c = C ? (C.preset || {})[p.id] : null; if (pseudo) { p.n = tr(p.n); p.sub = tr(p.sub); } else if (c) { if (c.n) p.n = c.n; if (c.sub) p.sub = c.sub; } });
    D.TESTS.forEach(function (t) {
      var c = C ? (C.test || {})[t.id] : null;
      Object.keys(t).forEach(function (k) { if (k === "n" || k === "how" || k === "note") { if (pseudo && typeof t[k] === "string") t[k] = tr(t[k]); else if (c && c[k]) t[k] = c[k]; } });
    });
    D.ZONES.forEach(function (z) { var c = C ? (C.zone || {})[z[0]] : null; if (pseudo) z[1] = tr(z[1]); else if (c) z[1] = c; });
    (D.MUSCLES || []).forEach(function (m) { var c = C ? (C.muscle || {})[m[0]] : null; if (pseudo) m[1] = tr(m[1]); else if (c) m[1] = c; });
    (D.SPORTS || []).forEach(function (s) { var c = C ? (C.sport || {})[s.id] : null; if (pseudo) s.n = tr(s.n); else if (c) s.n = c; });
  };
  /* Translate the fixed text in index.html (tab names, buttons, labels) once the page has loaded. */
  I.translateStatic = function (root) {
    if (lang === "en" && !pseudo) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) if (n.nodeValue.trim()) list.push(n);
    list.forEach(function (n) { var t = n.nodeValue, s = t.trim(); n.nodeValue = t.replace(s, T(s)); });
    [].forEach.call(root.querySelectorAll("[aria-label]"), function (e) { e.setAttribute("aria-label", T(e.getAttribute("aria-label"))); });
  };
  document.documentElement.lang = lang;
  if (lang !== "en") document.write('<script src="lang/' + lang + '.js"><\/script>');
})();
