/* Generated ambient background music for routines (Web Audio, nothing downloaded, no licensing).
   Styles: "pads" (warm slow chords with soft chimes), "bowls" (drone and singing-bowl strikes), "ocean" (waves over a soft pad). */
(function () {
  var ctx = null, out = null, duckG = null, verb = null, dry = null, timer = null, style = null, vol = 0.5, nextChord = 0, chordIdx = 0, nextBell = 0, live = [], noiseBuf = null, waveNode = null;
  var CHORDS = [[50, 57, 62, 64, 69], [47, 54, 59, 62, 66], [43, 50, 59, 62, 66], [45, 52, 57, 59, 64]];
  var PENTA = [74, 76, 78, 81, 83, 86, 88, 90];
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function impulse(sec) {
    var len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    return b;
  }
  function noise() {
    if (noiseBuf) return noiseBuf; var len = ctx.sampleRate * 4; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate); var d = noiseBuf.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } /* brown noise */
    return noiseBuf;
  }
  function build(c) {
    ctx = c; out = ctx.createGain(); out.gain.value = 0; duckG = ctx.createGain(); duckG.gain.value = 1;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    verb = ctx.createConvolver(); verb.buffer = impulse(5); var wet = ctx.createGain(); wet.gain.value = 0.55; dry = ctx.createGain(); dry.gain.value = 0.6;
    verb.connect(wet); wet.connect(out); dry.connect(out); out.connect(duckG); duckG.connect(comp); comp.connect(ctx.destination);
  }
  function send(node, wetAmt) { node.connect(dry); var s = ctx.createGain(); s.gain.value = wetAmt == null ? 1 : wetAmt; node.connect(s); s.connect(verb); }
  function padNote(m, t, len, level) {
    var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700 + Math.random() * 400; f.Q.value = 0.4;
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.05 + Math.random() * 0.06; lg.gain.value = 250; lfo.connect(lg); lg.connect(f.frequency);
    [["sine", 0], ["triangle", -6], ["sine", 5]].forEach(function (o) { var osc = ctx.createOscillator(); osc.type = o[0]; osc.frequency.value = hz(m); osc.detune.value = o[1]; osc.connect(f); osc.start(t); osc.stop(t + len + 0.2); live.push(osc); });
    lfo.start(t); lfo.stop(t + len + 0.2);
    var a = Math.min(5, len * 0.35), r = Math.min(6, len * 0.45);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + a); g.gain.setValueAtTime(level, t + len - r); g.gain.linearRampToValueAtTime(0, t + len);
    f.connect(g); send(g, 0.8);
  }
  function bell(m, t, level, partials, decay) {
    var g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    (partials || [[1, 1], [2.0, 0.25], [3.01, 0.08]]).forEach(function (p) {
      var o = ctx.createOscillator(), pg = ctx.createGain(); o.type = "sine"; o.frequency.value = hz(m) * p[0]; pg.gain.value = p[1]; o.connect(pg); pg.connect(g); o.start(t); o.stop(t + decay + 0.1); live.push(o);
      if (p[2]) { var o2 = ctx.createOscillator(); o2.frequency.value = hz(m) * p[0] + p[2]; o2.connect(pg); o2.start(t); o2.stop(t + decay + 0.1); live.push(o2); }
    });
    send(g, 1.2);
  }
  function drone(t, len) { [38, 45, 50].forEach(function (m, i) { padNote(m, t, len, i === 0 ? 0.11 : 0.06); }); }
  function waves() {
    if (waveNode) return; var src = ctx.createBufferSource(); src.buffer = noise(); src.loop = true;
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 500; var g = ctx.createGain(); g.gain.value = 0.0;
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 0.16; lfo.connect(lg); lg.connect(g.gain);
    var lfo2 = ctx.createOscillator(), lg2 = ctx.createGain(); lfo2.frequency.value = 0.11; lg2.gain.value = 350; lfo2.connect(lg2); lg2.connect(f.frequency);
    var base = ctx.createConstantSource ? ctx.createConstantSource() : null; if (base) { base.offset.value = 0.18; base.connect(g.gain); base.start(); }
    src.connect(f); f.connect(g); send(g, 0.4); src.start(); lfo.start(); lfo2.start();
    waveNode = { stop: function () { try { src.stop(); lfo.stop(); lfo2.stop(); if (base) base.stop(); } catch (e) {} } };
  }
  function tick() {
    if (!ctx || !style) return;
    if (mode === "el") return;
    if (ctx.state !== "running") wake();
    else watch();
    if (mode === "el") return;
    schedule(ctx.currentTime + 2);
  }
  function schedule(ahead) {
    while (nextChord < ahead) {
      var len = style === "bowls" ? 20 : 14;
      if (style === "bowls") drone(nextChord, len + 4);
      else CHORDS[chordIdx % CHORDS.length].forEach(function (m, i) { padNote(m, nextChord, len + 5, (i === 0 ? 0.07 : 0.045) * (style === "ocean" ? 0.6 : 1)); });
      chordIdx++; nextChord += len;
    }
    while (nextBell < ahead) {
      if (style === "bowls") { bell(pick([50, 57, 62, 45]), nextBell, 0.16, [[1, 1, 1.3], [2.76, 0.35, 0.9], [5.4, 0.12], [8.9, 0.04]], 11); nextBell += 7 + Math.random() * 6; }
      else if (style === "pads") { if (Math.random() < 0.75) bell(pick(PENTA), nextBell, 0.045 + Math.random() * 0.03, null, 5); nextBell += 2.5 + Math.random() * 4.5; }
      else { if (Math.random() < 0.4) bell(pick(PENTA) - 12, nextBell, 0.035, null, 6); nextBell += 5 + Math.random() * 6; }
    }
    if (live.length > 600) live = live.slice(-300);
  }

  /* ---- iPhone fallback ----
     On some iPhones (seen in Firefox on iOS) the Web Audio clock freezes while still reporting "running", so nothing plays.
     If that happens we render a 48-second seamless loop of the same music offline and play it through a normal audio element. */
  var mode = "wa", useEl = false, lastT = -1, stuck = 0, el = null, elUrl = {}, elWant = null;
  function log(msg) { try { if (window.MUSIC && MUSIC.log) MUSIC.log(msg); } catch (e) {} }
  function watch() {
    var t = ctx.currentTime;
    if (t === lastT) stuck++; else { stuck = 0; lastT = t; return; }
    if (stuck === 2) { log("music: audio clock frozen at " + t.toFixed(1) + "s, nudging"); try { ctx.suspend().then(function () { return ctx.resume(); }).catch(function () {}); } catch (e) {} }
    if (stuck >= 4) { log("music: clock still frozen, switching to audio-file playback"); useEl = true; toEl(); }
  }
  function silentWav() { return "data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA"; }
  /* Call from a tap so iOS lets us start the element later without one. */
  function prime() {
    try { if (!el) { el = new Audio(); el.setAttribute("playsinline", ""); el.loop = true; el.preload = "auto"; }
      if (el.paused && !el.__primed) { el.src = silentWav(); var p = el.play(); el.__primed = true; if (p && p.then) p.then(function () { if (!elWant) el.pause(); }).catch(function () {}); } } catch (e) {}
  }
  function toEl() {
    mode = "el"; clearInterval(timer); timer = null; live.forEach(function (o) { try { o.stop(); } catch (e) {} }); live = []; if (waveNode) { waveNode.stop(); waveNode = null; }
    elPlay(style, vol);
  }
  function elPlay(s, v) {
    elWant = s; if (!el) prime();
    var key = s + ":" + Math.round(v * 20);
    var go = function (url) { if (elWant !== s || paused) return; try { el.src = url; el.loop = true; el.volume = 1; var p = el.play(); if (p && p.catch) p.catch(function (e) { log("music: audio file blocked (" + (e && e.name) + ")"); }); log("music: playing audio file"); } catch (e) { log("music: audio file error " + e.message); } };
    if (elUrl[key]) return go(elUrl[key]);
    renderLoop(s, v, function (url) { elUrl[key] = url; go(url); });
  }
  function elStop() { elWant = null; try { if (el) el.pause(); } catch (e) {} }
  function renderLoop(s, v, cb) {
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OC) { log("music: no offline audio"); return; }
    var SR = 22050, L = 48, X = 6, oc = new OC(2, SR * (L + X), SR);
    var saved = [ctx, out, duckG, verb, dry, noiseBuf, waveNode, live, style, nextChord, nextBell, chordIdx, vol];
    try {
      noiseBuf = null; waveNode = null; live = []; build(oc); vol = v; out.gain.value = level() * 0.85; style = s; chordIdx = 0; nextChord = 0.05; nextBell = 2;
      if (s === "ocean") waves(); schedule(L + X);
    } catch (e) { log("music: render setup failed " + e.message); }
    ctx = saved[0]; out = saved[1]; duckG = saved[2]; verb = saved[3]; dry = saved[4]; noiseBuf = saved[5]; waveNode = saved[6]; live = saved[7]; style = saved[8]; nextChord = saved[9]; nextBell = saved[10]; chordIdx = saved[11]; vol = saved[12];
    var done = function (buf) {
      var n = SR * L, xs = SR * X, chans = [buf.getChannelData(0), buf.getChannelData(1)];
      /* Fold the last few seconds over the start so the loop has no seam, and fade the opening in from the tail. */
      var mix = chans.map(function (d) { var o = new Float32Array(n); for (var i = 0; i < n; i++) { o[i] = d[i]; if (i < xs) { var a = i / xs; o[i] = d[i] * a + d[n + i] * (1 - a); } } return o; });
      var bytes = new DataView(new ArrayBuffer(44 + n * 4)), w = function (o, str) { for (var i = 0; i < str.length; i++) bytes.setUint8(o + i, str.charCodeAt(i)); };
      w(0, "RIFF"); bytes.setUint32(4, 36 + n * 4, true); w(8, "WAVEfmt "); bytes.setUint32(16, 16, true); bytes.setUint16(20, 1, true); bytes.setUint16(22, 2, true);
      bytes.setUint32(24, SR, true); bytes.setUint32(28, SR * 4, true); bytes.setUint16(32, 4, true); bytes.setUint16(34, 16, true); w(36, "data"); bytes.setUint32(40, n * 4, true);
      for (var i = 0, p = 44; i < n; i++) for (var c = 0; c < 2; c++, p += 2) { var x = Math.max(-1, Math.min(1, mix[c][i])); bytes.setInt16(p, x < 0 ? x * 0x8000 : x * 0x7fff, true); }
      cb(URL.createObjectURL(new Blob([bytes], { type: "audio/wav" })));
    };
    try { var pr = oc.startRendering(); if (pr && pr.then) pr.then(done).catch(function (e) { log("music: render failed " + e); }); else oc.oncomplete = function (e) { done(e.renderedBuffer); }; } catch (e) { log("music: render failed " + e.message); }
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function start(c, s, v) {
    if (!c || !s || s === "off") return stop();
    if (!ctx) build(c);
    wake();
    if (style === s && (timer || (mode === "el" && elWant === s && !paused))) { setVol(v); return; }
    if (style) hardStop();
    if (useEl) { paused = false; style = s; vol = v == null ? vol : v; mode = "el"; prime(); elPlay(s, vol); return; }
    mode = "wa"; stuck = 0; lastT = -1;
    paused = false; style = s; vol = v == null ? vol : v; chordIdx = Math.floor(Math.random() * 4);
    nextChord = ctx.currentTime + 0.1; nextBell = ctx.currentTime + 3;
    out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setValueAtTime(out.gain.value, ctx.currentTime); out.gain.linearRampToValueAtTime(level(), ctx.currentTime + 4);
    if (s === "ocean") waves();
    tick(); timer = setInterval(tick, 1000);
  }
  /* iOS can leave a new context "suspended" or "interrupted" (e.g. right after the audio session changes). Keep nudging it until it runs. */
  function wake() {
    if (!ctx) return;
    if (ctx.state !== "running") { try { ctx.resume().then(catchUp).catch(function () {}); } catch (e) {} }
    if (!ctx.__watch) { ctx.__watch = true; ctx.addEventListener("statechange", function () { if (style && ctx.state !== "running" && ctx.state !== "closed") setTimeout(wake, 300); else catchUp(); }); }
  }
  /* If time stood still while suspended, make sure the next notes start now rather than in the past. */
  function catchUp() { if (!ctx || !style) return; var t = ctx.currentTime; if (nextChord < t) nextChord = t + 0.05; if (nextBell < t) nextBell = t + 2; tick(); }
  function level() { return 1.5 * vol * vol + 0.1 * vol; }
  function hardStop() { elStop(); clearInterval(timer); timer = null; live.forEach(function (o) { try { o.stop(); } catch (e) {} }); live = []; if (waveNode) { waveNode.stop(); waveNode = null; } }
  function stop(ms) {
    if (!ctx || !style) { style = null; return; }
    var t = ctx.currentTime, f = (ms == null ? 2500 : ms) / 1000;
    out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + f);
    var was = style; style = null; paused = false; clearInterval(timer); timer = null; if (mode === "el") elStop();
    setTimeout(function () { if (!style) hardStop(); }, f * 1000 + 100);
    return was;
  }
  /* Pause: fade the music down to silence, then stop scheduling new notes. Resume: carry on and fade back up. */
  var paused = false;
  function pause(ms) {
    if (!ctx || !style || paused) return; paused = true; if (mode === "el") { try { el.pause(); } catch (e) {} return; } var t = ctx.currentTime, f = (ms || 1500) / 1000;
    out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + f);
    clearInterval(timer); timer = null;
  }
  function resume(ms) {
    if (!ctx || !style || !paused) return; paused = false; if (mode === "el") { if (el && elWant) { try { el.play().catch(function () {}); } catch (e) {} } else elPlay(style, vol); return; } wake(); var t = ctx.currentTime, f = (ms || 2000) / 1000;
    if (nextChord < t) nextChord = t + 0.05; if (nextBell < t) nextBell = t + 2; tick(); timer = setInterval(tick, 1000);
    out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(level(), t + f);
  }
  function setVol(v) { var before = vol; vol = Math.max(0, Math.min(1, v)); if (mode === "el" && style && !paused && Math.abs(before - vol) > 0.1) { elPlay(style, vol); return; } if (ctx && style) { var t = ctx.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(level(), t + 0.4); } }
  /* Lower the music while the coach is speaking. Polls speechSynthesis because iOS doesn't reliably fire end events after cancel(). */
  /* Ducking. The music drops right down while the coach speaks (signalled by the app, with speechSynthesis polled as a backup)
     and sits lower during the get-ready gaps between moves. */
  var duckUntil = 0, quiet = false, lastTarget = 1;
  function duckFor(ms) { duckUntil = Math.max(duckUntil, performance.now() + ms); apply(true); }
  function setQuiet(on) { quiet = !!on; apply(); }
  function apply(fast) {
    if (!ctx || !duckG) return; var speaking = performance.now() < duckUntil;
    /* iOS can leave speechSynthesis.speaking stuck on true (for example after a silent unlock utterance), which kept the music ducked
       to near silence. Only trust it for a short while after the app actually asked the coach to speak. */
    try { if (performance.now() < duckUntil + 6000) speaking = speaking || !!(window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)); } catch (e) {}
    var target = speaking ? 0.12 : quiet ? 0.4 : 1; if (target === lastTarget) return; var down = target < lastTarget; lastTarget = target;
    var t = ctx.currentTime; duckG.gain.cancelScheduledValues(t); duckG.gain.setValueAtTime(duckG.gain.value, t); duckG.gain.linearRampToValueAtTime(target, t + (down ? (fast ? 0.15 : 0.3) : 1.5));
  }
  setInterval(function () { if (ctx && style) apply(); }, 150);
  function status() { return ctx ? { mode: mode, file: el && mode === "el" ? (el.paused ? "paused" : "playing") + " " + Math.round(el.duration || 0) + "s" : undefined, state: ctx.state, t: +ctx.currentTime.toFixed(1), out: +out.gain.value.toFixed(2), duck: +duckG.gain.value.toFixed(2), style: style, paused: paused, notes: live.length } : { state: "none" }; }
  window.MUSIC = { prime: prime, status: status, start: start, stop: stop, setVol: setVol, pause: pause, resume: resume, duckFor: duckFor, setQuiet: setQuiet, playing: function () { return !!style; } };
})();
