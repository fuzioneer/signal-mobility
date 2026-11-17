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
  /* Sessions with a list of moves go up as a structured workout (Strava's JSON upload: one set per hold, each with
     Strava's exercise type), so Strava fills in the activity's muscle map. Strava only accepts this for Workout-type
     activities, so other activity types, and any refusal, fall back to the plain activity below. */
  function upload(a) {
    var type = st.type || "Mobility", asWorkout = type === "Mobility" || type === "Workout";
    if (!(a.sets && a.sets.length && a.startMs && asWorkout && window.FormData && window.Blob)) return uploadPlain(a);
    return uploadSets(a).catch(function (e) {
      if (e && e.auth) throw e;
      log("strava: exercise upload didn't work (" + e.message + "), sending as a plain activity");
      return uploadPlain(a);
    });
  }
  /* Strava IDs are moving to 64-bit numbers (from 1 June 2027), which JavaScript can't hold exactly. Read replies as text and take
     IDs from the "<key>_str" field, or straight from the raw text, so they're never rounded. */
  function readJSON(r) { return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {} if (j && typeof j === "object") Object.defineProperty(j, "_raw", { value: t }); return j; }); }
  function safeId(j, key) {
    if (!j) return null;
    if (j[key + "_str"]) return String(j[key + "_str"]);
    var m = j._raw && new RegExp('"' + key + '"\\s*:\\s*"?(\\d+)').exec(j._raw);
    return m ? m[1] : (j[key] == null ? null : String(j[key]));
  }
  function title(a) { var type = st.type || "Mobility", label = window.T ? T("Mobility") : "Mobility"; return type === "Mobility" && a.name.indexOf(label) !== 0 ? label + ": " + a.name : a.name; }
  function uploadSets(a) {
    return token().then(function (t) {
      var active = a.sets.reduce(function (s, x) { return s + (x.d || 0); }, 0);
      var doc = { version: "1.0", start_time: new Date(a.startMs).toISOString(), utc_offset: -new Date(a.startMs).getTimezoneOffset() * 60,
        elapsed_time: Math.max(60, Math.round(a.secs)), active_time: Math.min(active, Math.max(60, Math.round(a.secs))), creator: { name: "Movage" },
        sets: a.sets.map(function (x) { return { exercise_type: x.e, duration: Math.max(1, Math.round(x.d || 0)) }; }) };
      var fd = new FormData();
      fd.append("file", new Blob([JSON.stringify(doc)], { type: "application/json" }), "movage.json");
      fd.append("data_type", "json"); fd.append("sport_type", "Workout"); fd.append("name", title(a)); fd.append("description", a.description || "");
      fd.append("external_id", "movage-" + a.startMs);
      return fetch(API + "/api/v3/uploads", { method: "POST", headers: { Authorization: "Bearer " + t }, body: fd })
        .then(function (r) { return readJSON(r).then(function (j) {
          if (r.status === 401) { var e = new Error("Strava sign-in expired"); e.auth = true; throw e; }
          if (!r.ok || !j || j.error) throw new Error((j && (j.error || j.message)) || ("HTTP " + r.status));
          /* Once Strava has the upload, a lost connection while checking on it must not fall back to a second, plain
             activity: retry the same upload later instead (Strava recognises it as a duplicate and returns the same activity). */
          return poll(t, safeId(j, "id"), 0).catch(function (e) { if (!e.processing) e.auth = true; throw e; });
        }); });
    }).then(function (id) {
      log("strava: logged as " + a.sets.length + " exercises, so Strava can show the muscles worked");
      return tagRecovery(id).then(function () { return id; }, function (e) { log("strava: couldn't add the Recovery tag (" + e.message + ")"); return id; });
    });
  }
  /* Strava processes uploads in the background: check every 2 seconds, for up to 40 seconds. */
  function poll(t, uploadId, n) {
    return new Promise(function (res) { setTimeout(res, 2000); }).then(function () {
      return fetch(API + "/api/v3/uploads/" + encodeURIComponent(uploadId), { headers: { Authorization: "Bearer " + t } }).then(readJSON);
    }).then(function (j) {
      if (j && j.activity_id) return safeId(j, "activity_id");
      var dup = j && j.error && (/duplicate of[^]*?activities\/(\d+)/i.exec(j.error) || /duplicate of (?:activity )?(\d+)/i.exec(j.error)); if (dup) return dup[1];
      if (j && j.error) { var pe = new Error(j.error); pe.processing = true; throw pe; } /* Strava rejected the file: safe to send it plain */
      if (n >= 19) { log("strava: still processing, it'll appear on Strava shortly"); return "upload-" + uploadId; }
      return poll(t, uploadId, n + 1);
    });
  }
  function uploadPlain(a) {
    return token().then(function (t) {
      /* Strava has no Mobility sport type, so Mobility logs as a Workout with "Mobility" in the title. */
      var type = st.type || "Mobility", mob = type === "Mobility", label = window.T ? T("Mobility") : "Mobility";
      var body = new URLSearchParams({ name: mob && a.name.indexOf(label) !== 0 ? label + ": " + a.name : a.name, sport_type: mob ? "Workout" : type, start_date_local: a.startLocal, elapsed_time: String(Math.max(60, Math.round(a.secs))), description: a.description || "" });
      /* Every Movage session is tagged Recovery on Strava. If Strava ever refuses the tag, post again without it. */
      var post = function (b) { return fetch(API + "/api/v3/activities", { method: "POST", headers: { Authorization: "Bearer " + t, "Content-Type": "application/x-www-form-urlencoded" }, body: b.toString() }).then(function (r) { return readJSON(r).then(function (j) { return { r: r, j: j }; }); }); };
      var tagged = new URLSearchParams(body); tagged.set("tags[Recovery]", "true");
      return post(tagged).then(function (x) {
        if (!x.r.ok && x.r.status >= 400 && x.r.status < 500 && x.r.status !== 401 && /tag/i.test(JSON.stringify(x.j || ""))) { log("strava: Recovery tag refused, sent without it"); return post(body); }
        return x;
      });
    }).then(function (x) {
      var r = x.r, j = x.j; if (!r.ok) throw new Error((j && j.message) || ("HTTP " + r.status));
      /* Strava's create call can quietly drop the tag, so check what came back and, if Recovery is missing,
         add it with an update (PUT /activities/{id} {"tags":{"Recovery":true}}), which the same activity:write scope allows. */
      var tags = (j && j.tags) || [];
      var id = safeId(j, "id");
      if (tags.indexOf && tags.indexOf("Recovery") >= 0) return id;
      return tagRecovery(id).then(function () { return id; }, function (e) { log("strava: couldn't add the Recovery tag (" + e.message + ")"); return id; });
    });
  }
  function tagRecovery(id) {
    if (/^upload-/.test(String(id))) return Promise.resolve();
    return token().then(function (t) {
      return fetch(API + "/api/v3/activities/" + encodeURIComponent(id), { method: "PUT", headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" }, body: JSON.stringify({ tags: { Recovery: true } }) })
        .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) {
          if (!r.ok) throw new Error((j && j.message) || ("HTTP " + r.status));
          log("strava: Recovery tag " + (j && j.tags && j.tags.indexOf("Recovery") >= 0 ? "added" : "sent, but Strava didn't show it") + " on " + id);
        }); });
    });
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
    get: function () { return { id: st.id || "", secret: st.secret || "", auto: st.auto !== false, type: st.type || "Mobility", connected: connected(), athlete: st.athlete || "", queued: (st.queue || []).length, last: st.last || null, pendingCode: st.pendingCode || "" }; },
    setConfig: function (c) { ["id", "secret", "auto", "type"].forEach(function (k) { if (c[k] !== undefined) st[k] = typeof c[k] === "string" ? c[k].trim() : c[k]; }); save(); },
    configured: configured, connected: connected, authorizeUrl: authorizeUrl, redirectUri: redirectUri, handleRedirect: handleRedirect,
    useCode: function (code) { st.pendingCode = ""; save(); return exchange(String(code).trim()); },
    disconnect: function () { var t = st.access; st.access = st.refresh = st.exp = st.athlete = null; st.queue = []; save(); if (t) fetch(API + "/oauth/deauthorize", { method: "POST", headers: { Authorization: "Bearer " + t } }).catch(function () {}); },
    logSession: logSession, flush: flush, localISO: localISO,
    onLog: function (f) { log = f; }
  };
})();
