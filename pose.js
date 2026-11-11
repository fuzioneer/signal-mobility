/* Live body tracking with MediaPipe Pose: wireframe overlay and joint-angle measurement. */
(function () {
  var PV = "0.5.1675469404", BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@" + PV + "/";
  var EDGES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [27, 29], [28, 30], [29, 31], [30, 32]];
  var poseP = null;
  function load() {
    if (poseP) return poseP;
    poseP = new Promise(function (res, rej) {
      var sc = document.createElement("script"); sc.src = BASE + "pose.js"; sc.crossOrigin = "anonymous";
      sc.onload = function () {
        try {
          var p = new window.Pose({ locateFile: function (f) { return BASE + f; } });
          p.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
          p.initialize().then(function () { res(p); }).catch(function (e) { poseP = null; rej(e); });
        } catch (e) { poseP = null; rej(e); }
      };
      sc.onerror = function () { poseP = null; rej(new Error("Couldn't download the tracking model")); };
      document.head.appendChild(sc);
    });
    return poseP;
  }
  function px(p, w, h) { return { x: p.x * w, y: p.y * h, v: p.visibility == null ? 1 : p.visibility }; }
  function angBetween(a1, a2, b1, b2) { var u = { x: a2.x - a1.x, y: a2.y - a1.y }, v = { x: b2.x - b1.x, y: b2.y - b1.y }; return Math.abs(Math.atan2(u.x * v.y - u.y * v.x, u.x * v.x + u.y * v.y) * 180 / Math.PI); }
  function angAt(a, b, c) { return angBetween(b, a, b, c); }
  function fromVert(a, b) { return Math.atan2(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 180 / Math.PI; }
  function sideOK(P, sd) { var ids = sd === "l" ? [11, 23, 25, 27] : [12, 24, 26, 28]; return ids.every(function (i) { return P[i].v > 0.5; }); }
  function parts(P, sd) { return sd === "l" ? { s: P[11], e: P[13], w: P[15], h: P[23], k: P[25], a: P[27], oh: P[24], ok: P[26], oa: P[28] } : { s: P[12], e: P[14], w: P[16], h: P[24], k: P[26], a: P[28], oh: P[23], ok: P[25], oa: P[27] }; }
  /* Per-frame measurement for each side. Returns {l, r} values (or objects for squat). */
  function measure(k, P) {
    var out = {};
    ["l", "r"].forEach(function (sd) {
      var Q = parts(P, sd);
      if (k === "shflex") { if (Q.s.v > .5 && Q.w.v > .5 && Q.h.v > .5) out[sd] = angBetween(Q.s, Q.h, Q.s, Q.w); }
      else if (k === "slr") { if (sideOK(P, sd) && Q.oa.v > .4 && Q.a.y < Q.oa.y - 10) out[sd] = angBetween(Q.h, Q.a, Q.oh, Q.oa); }
      else if (k === "thomas") {
        if (Q.h.v > .5 && Q.k.v > .5) {
          var dK = Math.hypot(Q.k.x - Q.s.x, Q.k.y - Q.s.y), dO = Math.hypot(Q.ok.x - Q.s.x, Q.ok.y - Q.s.y);
          if (dK > dO * 1.2) out[sd] = Math.atan2(Q.h.y - Q.k.y, Math.abs(Q.k.x - Q.h.x)) * 180 / Math.PI;
        }
      }
      else if (k === "ankle") { if (Q.k.v > .5 && Q.a.v > .5 && Q.k.y < Q.a.y && Q.k.y < Q.ok.y + 5) out[sd] = fromVert(Q.a, Q.k); }
      else if (k === "squat") { if (sideOK(P, sd)) out[sd] = { knee: angAt(Q.h, Q.k, Q.a), shin: fromVert(Q.a, Q.k), torso: fromVert(Q.h, Q.s), below: Q.h.y > Q.k.y }; }
    });
    return out;
  }
  function better(k, a, b) { if (b == null) return true; if (k === "thomas") return a < b; if (k === "squat") return a.knee < b.knee; return a > b; }
  function label(k, v) {
    if (v == null) return "–";
    if (k === "squat") return "Knee " + Math.round(v.knee) + "°, shin " + Math.round(v.shin) + "°, torso " + Math.round(v.torso) + "°" + (v.below ? ", hips below knees" : "");
    return (k === "thomas" && v > 0 ? "+" : "") + Math.round(v) + "°";
  }
  function draw(ctx, img, P, w, h, mirror) {
    ctx.save(); if (mirror) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(img, 0, 0, w, h);
    if (P) {
      ctx.lineWidth = Math.max(4, w / 160); ctx.lineCap = "round";
      EDGES.forEach(function (e) {
        var a = P[e[0]], b = P[e[1]]; if (a.v < .4 || b.v < .4) return;
        ctx.strokeStyle = e[0] % 2 === 1 && e[1] % 2 === 1 ? "#46b39f" : e[0] % 2 === 0 && e[1] % 2 === 0 ? "#e3a24c" : "#ffffff";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      P.forEach(function (p, i) { if (i < 11 || p.v < .4) return; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(4, w / 200), 0, 7); ctx.fill(); });
    }
    ctx.restore();
  }
  /* A session: feed frames, get readings and best values. */
  function Session(k, canvas, opts) {
    this.k = k; this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.best = {}; this.frames = 0; this.opts = opts || {}; this.hold = {};
  }
  Session.prototype.frame = async function (src, w, h, mirror) {
    var pose = await load(), self = this;
    var r = await new Promise(function (res) { pose.onResults(res); pose.send({ image: src }).catch(function () { res(null); }); });
    var P = r && r.poseLandmarks ? r.poseLandmarks.map(function (p) { return px(p, w, h); }) : null;
    draw(this.ctx, src, P, w, h, mirror); this.frames++;
    var now = P ? measure(this.k, P) : {}, events = [];
    ["l", "r"].forEach(function (sd) {
      var v = now[sd]; if (v == null) { self.hold[sd] = null; return; }
      var b = self.best[sd];
      if (better(self.k, v, b ? b.v : null)) {
        var improved = !b || (self.k === "squat" ? b.v.knee - v.knee >= 3 : Math.abs(v - b.v) >= 3);
        self.best[sd] = { v: v, img: self.canvas.toDataURL("image/jpeg", 0.75) };
        if (improved && b) events.push({ type: "best", side: sd, v: v });
      }
      var key = self.k === "squat" ? v.knee : v, hd = self.hold[sd];
      if (hd && Math.abs(hd.v - key) < 4) { if (!hd.fired && performance.now() - hd.t > 1500) { hd.fired = true; events.push({ type: "held", side: sd, v: v }); } }
      else self.hold[sd] = { v: key, t: performance.now(), fired: false };
    });
    return { found: !!P, now: now, events: events };
  };
  window.POSE = { load: load, Session: Session, label: label, better: better, measure: measure };
})();
