/* Stick-figure renderer for stretch illustrations.
   A pose is a set of segment directions in degrees (0 = right/forward, 90 = up, 180 = back, 270 = down),
   drawn side-on facing right. "n" = near side (drawn strong), "f" = far side (drawn faint). */
(function () {
  var L = { torso: 56, neck: 7, head: 10, ua: 28, fa: 26, th: 44, sh: 42, ft: 11 };
  var FLOOR = 188;
  function pt(p, deg, len) { var r = deg * Math.PI / 180; return [p[0] + len * Math.cos(r), p[1] - len * Math.sin(r)]; }
  function limb(start, a, b, c, l1, l2, l3) { var j = pt(start, a, l1), e = pt(j, b, l2), out = [start, j, e]; if (c != null) out.push(pt(e, c, l3)); return out; }
  function solve(P) {
    var hip = P.hip || [100, 110], t = P.t == null ? 90 : P.t;
    var sh = pt(hip, t, L.torso), nk = pt(sh, P.nk == null ? t : P.nk, L.neck), hd = pt(nk, P.nk == null ? t : P.nk, L.head);
    var d = function (v, x) { return v == null ? x : v; };
    var arm = function (a) { a = a || [270, 270]; return limb(sh, a[0], d(a[1], a[0]), null, L.ua, L.fa); };
    var leg = function (g) { g = g || [270, 270, 0]; return limb(hip, g[0], d(g[1], g[0]), d(g[2], 0), L.th, L.sh, L.ft); };
    return { hip: hip, sh: sh, nk: nk, hd: hd, na: arm(P.na), fa: arm(P.fa), nl: leg(P.nl), fl: leg(P.fl) };
  }
  function lerp(a, b, k) {
    if (a == null || b == null) return b == null ? a : b;
    if (Array.isArray(a)) return a.map(function (v, i) { return lerp(v, b[i], k); });
    var d = ((b - a + 540) % 360) - 180; return a + d * k;
  }
  function lerpPose(a, b, k) { var o = {}; Object.keys(Object.assign({}, a, b)).forEach(function (key) { if (key === "hip") o.hip = [a.hip[0] + (b.hip[0] - a.hip[0]) * k, a.hip[1] + (b.hip[1] - a.hip[1]) * k]; else if (key === "prop") o.prop = a.prop; else o[key] = lerp(a[key], b[key], k); }); return o; }
  function path(pts) { return "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L"); }
  function svgFor(P, opts) {
    opts = opts || {}; var s = solve(P), near = opts.near || "#0f6b5c", far = opts.far || "#9aa6a1", w = opts.stroke || 7;
    var props = (P.prop || []).map(function (pr) {
      if (pr.t === "wall") return '<rect x="' + pr.x + '" y="20" width="8" height="' + (FLOOR - 20) + '" fill="#d8dfdb"/>';
      if (pr.t === "box") return '<rect x="' + pr.x + '" y="' + pr.y + '" width="' + pr.w + '" height="' + (FLOOR - pr.y) + '" rx="3" fill="#d8dfdb"/>';
      if (pr.t === "roller") return '<circle cx="' + pr.x + '" cy="' + (FLOOR - 9) + '" r="9" fill="#c9d3ce"/>';
      if (pr.t === "stick") { var a = pt(pr.from === "f" ? s.fa[2] : s.na[2], pr.d || 0, -40), b = pt(pr.from === "f" ? s.fa[2] : s.na[2], pr.d || 0, 40); return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="#b07c2e" stroke-width="4" stroke-linecap="round"/>'; }
      if (pr.t === "band") return '<path d="' + path([s.na[2], [pr.x, pr.y]]) + '" stroke="#c27512" stroke-width="3" fill="none" stroke-dasharray="4 3"/>';
      return "";
    }).join("");
    var g = function (pts, col, wd) { return '<path d="' + path(pts) + '" stroke="' + col + '" stroke-width="' + wd + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; };
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<line x1="6" y1="' + (FLOOR + 4) + '" x2="194" y2="' + (FLOOR + 4) + '" stroke="#d8dfdb" stroke-width="3" stroke-linecap="round"/>' + props +
      g(s.fl, far, w) + g(s.fa, far, w) + g([s.hip, s.sh, s.nk], near, w + 2) + g(s.nl, near, w) + g(s.na, near, w) +
      '<circle cx="' + s.hd[0].toFixed(1) + '" cy="' + s.hd[1].toFixed(1) + '" r="' + L.head + '" fill="' + near + '"/></svg>';
  }
  /* Animate between two poses inside an element; returns a stop function. */
  function animate(el, a, b, ms, opts) {
    if (!b) { el.innerHTML = svgFor(a, opts); return function () {}; }
    var t0 = performance.now(), on = true, reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.innerHTML = svgFor(b, opts); return function () {}; }
    (function f(now) { if (!on) return; var k = ((now - t0) % (ms * 2)) / ms; k = k > 1 ? 2 - k : k; k = k * k * (3 - 2 * k); el.innerHTML = svgFor(lerpPose(a, b, k), opts); requestAnimationFrame(f); })(t0);
    return function () { on = false; };
  }
  /* Base poses */
  var B = {
    stand: { hip: [100, 102], t: 90, na: [270, 270], fa: [270, 270], nl: [270, 270, 0], fl: [270, 270, 0] },
    squat: { hip: [80, 140], t: 65, na: [0, 0], fa: [0, 0], nl: [350, 255, 0], fl: [350, 255, 0] },
    quad: { hip: [70, 144], t: 10, nk: 0, na: [270, 270], fa: [270, 270], nl: [270, 180, 180], fl: [270, 180, 180] },
    supine: { hip: [92, 182], t: 180, nk: 180, na: [0, 0], fa: [0, 0], nl: [0, 0, 90], fl: [0, 0, 90] },
    seated: { hip: [62, 182], t: 90, na: [290, 300], fa: [290, 300], nl: [0, 0, 90], fl: [0, 0, 90] },
    halfkneel: { hip: [96, 146], t: 90, na: [270, 270], fa: [270, 270], nl: [0, 270, 0], fl: [253, 180, 270] }
  };
  function mk(base, over) { return Object.assign(JSON.parse(JSON.stringify(B[base])), over || {}); }
  window.FIG = { svg: svgFor, animate: animate, mk: mk, base: B };
})();
