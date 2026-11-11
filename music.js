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
    var now = ctx.currentTime, ahead = now + 2;
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
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function start(c, s, v) {
    if (!c || !s || s === "off") return stop();
    if (!ctx) build(c);
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {} /* keep playing with the ring/silent switch on */
    if (style === s && timer) { setVol(v); return; }
    if (style) hardStop();
    style = s; vol = v == null ? vol : v; chordIdx = Math.floor(Math.random() * 4);
    nextChord = ctx.currentTime + 0.1; nextBell = ctx.currentTime + 3;
    out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setValueAtTime(out.gain.value, ctx.currentTime); out.gain.linearRampToValueAtTime(level(), ctx.currentTime + 4);
    if (s === "ocean") waves();
    tick(); timer = setInterval(tick, 1000);
  }
  function level() { return 1.5 * vol * vol + 0.1 * vol; }
  function hardStop() { clearInterval(timer); timer = null; live.forEach(function (o) { try { o.stop(); } catch (e) {} }); live = []; if (waveNode) { waveNode.stop(); waveNode = null; } }
  function stop(ms) {
    if (!ctx || !style) { style = null; return; }
    var t = ctx.currentTime, f = (ms == null ? 2500 : ms) / 1000;
    out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + f);
    var was = style; style = null; clearInterval(timer); timer = null;
    setTimeout(function () { if (!style) hardStop(); }, f * 1000 + 100);
    return was;
  }
  function setVol(v) { vol = Math.max(0, Math.min(1, v)); if (ctx && style) { var t = ctx.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(level(), t + 0.4); } }
  /* Lower the music while the coach is speaking. Polls speechSynthesis because iOS doesn't reliably fire end events after cancel(). */
  var ducked = false;
  setInterval(function () {
    if (!ctx || !style) return; var on = false; try { on = !!(window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)); } catch (e) {}
    if (on === ducked) return; ducked = on; var t = ctx.currentTime; duckG.gain.cancelScheduledValues(t); duckG.gain.setValueAtTime(duckG.gain.value, t); duckG.gain.linearRampToValueAtTime(on ? 0.35 : 1, t + (on ? 0.25 : 1.2));
  }, 200);
  window.MUSIC = { start: start, stop: stop, setVol: setVol, playing: function () { return !!style; } };
})();
