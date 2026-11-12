/* Strava connection: logs finished mobility sessions as Strava activities.
   Platform adapter (see the App Store plan): the app only calls STRAVA.*, so a native version can swap this file out.
   Uses the athlete's own Strava API application (Client ID and Secret are kept on this phone only, in their own storage key).
   A public App Store release should move the token exchange to a small server so no secret ships in the app. */
(function () {
  var KEY = "signal-mobility-strava", API = "https://www.strava.com";
  var st = load(), log = function () {};
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function redirectUri() { return location.origin + location.pathname; }
  function configured() { return !!(st.id && st.secret); }
  function connected() { return !!(st.refresh); }

  function authorizeUrl() {
    return API + "/oauth/authorize?client_id=" + encodeURIComponent(st.id) + "&response_type=code&approval_prompt=auto&scope=activity:write&redirect_uri=" + encodeURIComponent(redirectUri()) + "&state=sm";
  }
  function tokenCall(params) {
    params.client_id = st.id; params.client_secret = st.secret;
    return fetch(API + "/oauth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params).toString() })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error((j && j.message) || ("HTTP " + r.status)); return j; }); })
      .then(function (j) {
        st.access = j.access_token; st.refresh = j.refresh_token || st.refresh; st.exp = j.expires_at;
        if (j.athlete) st.athlete = [j.athlete.firstname, j.athlete.lastname].filter(Boolean).join(" ");
        save(); return j;
      });
  }
  function exchange(code) { return tokenCall({ code: code, grant_type: "authorization_code" }); }
  function token() {
    if (!connected()) return Promise.reject(new Error("not connected"));
    if (st.access && st.exp && st.exp * 1000 > Date.now() + 120000) return Promise.resolve(st.access);
    return tokenCall({ grant_type: "refresh_token", refresh_token: st.refresh }).then(function () { return st.access; });
  }
  /* Strava sends the athlete back to the app with ?code=...; returns "connected", "code-only" (approved but this copy of the app has no Client ID, e.g. it opened in Safari instead of the home-screen app) or null. */
  function handleRedirect() {
    var q = new URLSearchParams(location.search), code = q.get("code");
    if (!code || q.get("state") !== "sm") return Promise.resolve(null);
    try { history.replaceState(null, "", redirectUri()); } catch (e) {}
    if (q.get("error")) return Promise.resolve(null);
    if (!configured()) { st.pendingCode = code; save(); return Promise.resolve({ status: "code-only", code: code }); }
    return exchange(code).then(function () { return { status: "connected" }; });
  }
  function upload(a) {
    return token().then(function (t) {
      var body = new URLSearchParams({ name: a.name, sport_type: st.type || "Yoga", start_date_local: a.startLocal, elapsed_time: String(Math.max(60, Math.round(a.secs))), description: a.description || "" });
      return fetch(API + "/api/v3/activities", { method: "POST", headers: { Authorization: "Bearer " + t, "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error((j && j.message) || ("HTTP " + r.status)); return j.id; }); });
  }
  /* Queue so a session finished with no signal is sent next time. */
  function logSession(a) {
    st.queue = (st.queue || []).concat([a]); save(); return flush();
  }
  var busy = false;
  function flush() {
    if (busy || !connected() || !(st.queue || []).length) return Promise.resolve(0);
    busy = true; var sent = 0;
    var next = function () {
      var a = (st.queue || [])[0]; if (!a) { busy = false; return sent; }
      return upload(a).then(function (id) { st.queue.shift(); st.last = { id: id, name: a.name, at: Date.now() }; save(); sent++; log("strava: logged " + a.name + " (" + id + ")"); return next(); })
        .catch(function (e) { busy = false; log("strava: upload failed, will retry (" + e.message + ")"); throw e; });
    };
    return next();
  }
  function localISO(ms) { var d = new Date(ms), p = function (n) { return (n < 10 ? "0" : "") + n; }; return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()); }
  window.STRAVA = {
    get: function () { return { id: st.id || "", secret: st.secret || "", auto: st.auto !== false, type: st.type || "Yoga", connected: connected(), athlete: st.athlete || "", queued: (st.queue || []).length, last: st.last || null, pendingCode: st.pendingCode || "" }; },
    setConfig: function (c) { ["id", "secret", "auto", "type"].forEach(function (k) { if (c[k] !== undefined) st[k] = typeof c[k] === "string" ? c[k].trim() : c[k]; }); save(); },
    configured: configured, connected: connected, authorizeUrl: authorizeUrl, redirectUri: redirectUri, handleRedirect: handleRedirect,
    useCode: function (code) { st.pendingCode = ""; save(); return exchange(String(code).trim()); },
    disconnect: function () { var t = st.access; st.access = st.refresh = st.exp = st.athlete = null; st.queue = []; save(); if (t) fetch(API + "/oauth/deauthorize", { method: "POST", headers: { Authorization: "Bearer " + t } }).catch(function () {}); },
    logSession: logSession, flush: flush, localISO: localISO,
    onLog: function (f) { log = f; }
  };
})();
