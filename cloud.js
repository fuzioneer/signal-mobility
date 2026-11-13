/* Platform adapter: community back end (Supabase).
   The app only talks to window.CLOUD, never to Supabase directly, so the native iOS build can swap
   this file for a Capacitor version (for example with Sign in with Apple) without touching app.js.
   The Supabase library (lib/supabase.js, MIT licence) is only loaded once someone uses the Community tab. */
(function () {
  var C = window.MOVAGE_CLOUD || {}, sb = null, loading = null, AUTH_KEY = "movage-auth";

  function configured() { return !!(C.url && C.anonKey); }
  function loadLib() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = "lib/supabase.js"; s.async = true;
      s.onload = function () { res(); };
      s.onerror = function () { loading = null; rej(new Error("network: couldn't load the community library")); };
      document.head.appendChild(s);
    });
    return loading;
  }
  function client() {
    if (!configured()) return Promise.reject(new Error("not configured"));
    return loadLib().then(function () {
      if (!sb) sb = window.supabase.createClient(C.url, C.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: AUTH_KEY } });
      return sb;
    });
  }
  function ok(r) { if (r.error) throw r.error; return r.data; }
  function one(rows) { return Array.isArray(rows) ? rows[0] || null : rows; }

  /* True if this phone has signed in before, without loading the library (keeps start-up fast for everyone else). */
  function hasSession() { try { return configured() && !!localStorage.getItem(AUTH_KEY); } catch (e) { return false; } }

  window.CLOUD = {
    configured: configured,
    hasSession: hasSession,
    user: function () { return client().then(function (c) { return c.auth.getSession(); }).then(function (r) { var s = ok(r).session; return s ? s.user : null; }); },
    sendCode: function (email) { return client().then(function (c) { return c.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true } }); }).then(ok); },
    verifyCode: function (email, code) { return client().then(function (c) { return c.auth.verifyOtp({ email: email, token: code, type: "email" }); }).then(function (r) { return ok(r).user; }); },
    signOut: function () { return client().then(function (c) { return c.auth.signOut(); }).then(function () {}, function () {}).then(function () { try { localStorage.removeItem(AUTH_KEY); } catch (e) {} }); },
    profile: function () { return client().then(function (c) { return c.from("profiles").select("nickname, share_time, share_score").maybeSingle(); }).then(ok); },
    saveProfile: function (p) {
      return client().then(function (c) {
        return c.auth.getUser().then(function (r) {
          var u = ok(r).user;
          return c.from("profiles").upsert({ id: u.id, nickname: p.nickname, share_time: !!p.share_time, share_score: !!p.share_score }).select("nickname, share_time, share_score").single();
        });
      }).then(ok);
    },
    myCommunities: function () { return client().then(function (c) { return c.rpc("my_communities"); }).then(ok); },
    createCommunity: function (name) { return client().then(function (c) { return c.rpc("create_community", { p_name: name }); }).then(ok).then(one); },
    joinCommunity: function (code) { return client().then(function (c) { return c.rpc("join_community", { p_code: code }); }).then(ok).then(one); },
    leaveCommunity: function (id) { return client().then(function (c) { return c.rpc("leave_community", { p_id: id }); }).then(ok); },
    timeBoard: function (community, from, to) { return client().then(function (c) { return c.rpc("time_board", { p_community: community || null, p_from: from, p_to: to, p_limit: 50 }); }).then(ok); },
    scoreBoard: function (community, verifiedOnly) { return client().then(function (c) { return c.rpc("score_board", { p_community: community || null, p_verified_only: !!verifiedOnly, p_limit: 50 }); }).then(ok); },
    /* Resolves when stored or already stored; rejects with e.permanent when the server refuses it for good. */
    addSession: function (s) {
      return client().then(function (c) { return c.from("sessions").insert({ id: s.id, local_date: s.local_date, secs: s.secs }); }).then(function (r) {
        if (!r.error) return;
        if (r.error.code === "23505") return;
        var e = new Error(r.error.message); if (r.error.code === "P0001" || r.error.code === "23514") e.permanent = true; throw e;
      });
    },
    setScore: function (sc) {
      return client().then(function (c) {
        return c.auth.getUser().then(function (r) {
          var u = ok(r).user;
          return c.from("scores").upsert({ user_id: u.id, overall: sc.overall, zones: sc.zones || {}, verified: !!sc.verified, tested_on: sc.tested_on });
        });
      }).then(ok);
    },
    deleteAccount: function () { return client().then(function (c) { return c.rpc("delete_account"); }).then(ok).then(function () { return window.CLOUD.signOut(); }); }
  };
})();
