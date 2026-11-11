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
  function px(p, w, h) { return { x: p.x * w, y: p.y * h, z: (p.z || 0) * w, v: p.visibility == null ? 1 : p.visibility }; }
  function angBetween(a1, a2, b1, b2) { var u = { x: a2.x - a1.x, y: a2.y - a1.y }, v = { x: b2.x - b1.x, y: b2.y - b1.y }; return Math.abs(Math.atan2(u.x * v.y - u.y * v.x, u.x * v.x + u.y * v.y) * 180 / Math.PI); }
  function angAt(a, b, c) { return angBetween(b, a, b, c); }
  function fromVert(a, b) { return Math.atan2(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 180 / Math.PI; }
  function sideOK(P, sd) { var ids = sd === "l" ? [11, 23, 25, 27] : [12, 24, 26, 28]; return ids.every(function (i) { return P[i].v > 0.5; }); }
  function parts(P, sd) { return sd === "l" ? { s: P[11], e: P[13], w: P[15], f: P[19], h: P[23], k: P[25], a: P[27], he: P[29], t: P[31], oh: P[24], ok: P[26], oa: P[28] } : { s: P[12], e: P[14], w: P[16], f: P[20], h: P[24], k: P[26], a: P[28], he: P[30], t: P[32], oh: P[23], ok: P[25], oa: P[27] }; }
  var dist = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }, mid = function (a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: Math.min(a.v, b.v) }; }, vis = function () { for (var i = 0; i < arguments.length; i++) if (!arguments[i] || arguments[i].v < .5) return false; return true; };
  /* Body proportions as a fraction of standing height (Winter, Biomechanics of Human Movement). Used to turn pixels into cm. */
  var PROP = { torso: 0.288, shin: 0.246, leg: 0.491, arm: 0.332 };
  function cmPer(px, seg, H) { return px / (PROP[seg] * H); }
  /* Per-frame measurement. Returns {l, r} for two-sided tests, {c} for one-result tests, objects for squat.
     st is per-session memory (e.g. trunk rotation baseline). H = standing height in cm for cm estimates. */
  function measure(k, P, st, H) {
    var out = {}; st = st || {}; H = H || 178;
    var sh = mid(P[11], P[12]), hp = mid(P[23], P[24]), torsoPx = dist(sh, hp);
    if (k === "trot") {
      if (!vis(P[11], P[12], P[23], P[24])) return out;
      var sw = dist(P[11], P[12]), hw = dist(P[23], P[24]);
      st.sw0 = Math.max(st.sw0 || 0, sw); st.hw0 = Math.max(st.hw0 || 0, hw); st.n = (st.n || 0) + 1;
      if (st.n < 15) return out;
      var ts = Math.acos(Math.min(1, sw / st.sw0)) * 180 / Math.PI, th = Math.acos(Math.min(1, hw / st.hw0)) * 180 / Math.PI, rot = ts - th;
      if (rot > 6) out[P[12].z < P[11].z ? "l" : "r"] = rot;
      return out;
    }
    if (k === "backscratch") {
      if (!vis(P[11], P[12], P[15], P[16], P[23], P[24])) return out;
      var top = P[15].y < P[16].y ? 15 : 16, bot = top === 15 ? 16 : 15, tf = P[top + 4], bf = P[bot + 4];
      if (!(P[top].y < sh.y && P[bot].y > sh.y)) return out;
      var cpx = cmPer(torsoPx, "torso", H), side = P[top].x > sh.x ? "r" : "l";
      out[side] = tf.y >= bf.y ? (tf.y - bf.y) / cpx : -dist(tf, bf) / cpx;
      return out;
    }
    if (k === "wallflex") {
      /* side-on, back to the wall: how far the hands sit in front of the line through hip and shoulder, plus the shoulder joint's depth from the wall (about 7 cm) */
      if (!vis(sh, hp, P[0])) return out;
      var ear = P[7].v > P[8].v ? P[7] : P[8], face = P[0].x >= ear.x ? 1 : -1, ux = (sh.x - hp.x) / torsoPx, uy = (sh.y - hp.y) / torsoPx, cpw = cmPer(torsoPx, "torso", H), ds = [];
      [15, 16].forEach(function (i) { var w = P[i]; if (w.v < .5 || w.y > sh.y) return; ds.push(((w.x - sh.x) * -uy + (w.y - sh.y) * ux) * face); });
      if (!ds.length) return out;
      out.c = Math.max(0, Math.min.apply(null, ds) / cpw + 7);
      return out;
    }
    if (k === "toetouch") {
      var bestF = P[19].v >= P[20].v ? 19 : 20, bestT = P[31].v >= P[32].v ? 31 : 32, sd2 = bestF === 19 ? "l" : "r", Q2 = parts(P, sd2);
      if (!vis(P[bestF], P[bestT], Q2.h, Q2.a) || P[bestF].y < hp.y) return out;
      out.c = (P[bestF].y - P[bestT].y) / cmPer(dist(Q2.h, Q2.a), "leg", H);
      return out;
    }
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
      else if (k === "er") {
        /* lying side-on: forearm angle back from vertical, towards the head. Upper arm points at the camera so the elbow sits near the shoulder. */
        if (!vis(Q.s, Q.e, Q.w, P[0], Q.h)) return;
        var fa = dist(Q.e, Q.w); if (fa < 10 || dist(Q.s, Q.e) > fa * 0.8) return;
        var head = P[0].x > Q.h.x ? 1 : -1, ang = Math.atan2((Q.w.x - Q.e.x) * head, Q.e.y - Q.w.y) * 180 / Math.PI;
        if (ang >= 0 && ang <= 135) out[sd] = ang;
      }
      else if (k === "hipir") {
        /* seated facing the camera: shin angle from vertical while the foot swings out past the knee */
        if (!vis(Q.k, Q.a, hp) || Q.a.y < Q.k.y) return;
        if (Math.abs(Q.a.x - hp.x) > Math.abs(Q.k.x - hp.x)) out[sd] = fromVert(Q.k, Q.a);
      }
      else if (k === "pigeon") {
        /* front leg = the one whose ankle has crossed the body's midline. Gap = front knee height above the floor, less the knee's own radius (about 5 cm). */
        if (!vis(Q.k, Q.a, Q.h, sh, hp)) return;
        var crossed = (Q.a.x - hp.x) * (Q.h.x - hp.x) < 0; if (!crossed) return;
        var floor = Math.max(P[27].y, P[28].y, P[31].v > .4 ? P[31].y : 0, P[32].v > .4 ? P[32].y : 0);
        out[sd] = Math.max(0, (floor - Q.k.y) / cmPer(torsoPx, "torso", H) - 5);
      }
      else if (k === "k2w") {
        /* front leg = the higher knee. Heel must stay down. Reading = how far the front of the knee travels past the toes. */
        if (!vis(Q.k, Q.a, Q.t, Q.he) || Q.k.y > P[sd === "l" ? 26 : 25].y) return;
        var cps = cmPer(dist(Q.k, Q.a), "shin", H), dir = Q.t.x > Q.he.x ? 1 : -1;
        if (Math.abs(Q.he.y - Q.t.y) / cps > 3) return;
        var v = (Q.k.x - Q.t.x) * dir / cps + 5; if (v > -5) out[sd] = Math.max(0, v);
      }
    });
    return out;
  }
  function better(k, a, b, dir) { if (b == null) return true; if (k === "squat") return a.knee < b.knee; return dir < 0 ? a < b : a > b; }
  function label(k, v, unit) {
    if (v == null) return "–";
    if (k === "squat") return "Knee " + Math.round(v.knee) + "°, shin " + Math.round(v.shin) + "°, torso " + Math.round(v.torso) + "°" + (v.below ? ", hips below knees" : "");
    unit = unit || "°"; var r = Math.round(v);
    return (r > 0 && (k === "thomas" || k === "backscratch" || k === "toetouch") ? "+" : "") + r + (unit === "cm" ? " cm" : "°");
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
    this.k = k; this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.best = {}; this.frames = 0; this.opts = opts || {}; this.hold = {}; this.st = {};
    this.dir = this.opts.dir || 1; this.H = this.opts.H || 178; this.thr = this.opts.unit === "cm" ? 2 : 4;
  }
  Session.prototype.frame = async function (src, w, h, mirror) {
    var pose = await load(), self = this;
    var r = await new Promise(function (res) { pose.onResults(res); pose.send({ image: src }).catch(function () { res(null); }); });
    var P = r && r.poseLandmarks ? r.poseLandmarks.map(function (p) { return px(p, w, h); }) : null;
    draw(this.ctx, src, P, w, h, mirror); this.frames++;
    var now = P ? measure(this.k, P, this.st, this.H) : {}, events = [];
    ["l", "r", "c"].forEach(function (sd) {
      var v = now[sd]; if (v == null) { self.hold[sd] = null; return; }
      var b = self.best[sd];
      if (better(self.k, v, b ? b.v : null, self.dir)) {
        var improved = !b || (self.k === "squat" ? b.v.knee - v.knee >= 3 : Math.abs(v - b.v) >= self.thr * 0.75);
        self.best[sd] = { v: v, img: self.canvas.toDataURL("image/jpeg", 0.75) };
        if (improved && b) events.push({ type: "best", side: sd, v: v });
      }
      var key = self.k === "squat" ? v.knee : v, hd = self.hold[sd];
      if (hd && Math.abs(hd.v - key) < self.thr) { if (!hd.fired && performance.now() - hd.t > 1500) { hd.fired = true; events.push({ type: "held", side: sd, v: v }); } }
      else self.hold[sd] = { v: key, t: performance.now(), fired: false };
    });
    return { found: !!P, now: now, events: events, P: P };
  };
  window.POSE = { load: load, Session: Session, label: label, better: better, measure: measure };
})();
