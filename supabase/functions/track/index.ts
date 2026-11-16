// Movage website visitor counter. Cookie free: no cookies or local storage on the visitor's device.
// The raw IP address and browser string are never stored. The database hashes them with a random salt
// that is replaced every day (site_log), so visits can be counted but nobody can be followed across days.
// Screen width is only used to tell laptops from large monitors and is never stored.
import { TZ } from "./tz.ts";
const ORIGINS = ["https://www.movage.co.uk", "https://movage.co.uk", "http://localhost:8766"];
const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|httpclient|java\/|go-http/i;

function cors(origin: string | null) {
  const o = origin && ORIGINS.includes(origin) ? origin : ORIGINS[0];
  return { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "content-type", "Vary": "Origin" };
}
function clean(s: unknown, n: number, re: RegExp) { const v = typeof s === "string" ? s.slice(0, n) : ""; return re.test(v) ? v : ""; }
function device(ua: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}
function browser(ua: string) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/instagram/i.test(ua)) return "Instagram app";
  if (/fban|fbav/i.test(ua)) return "Facebook app";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/crios|chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}
function os(ua: string) {
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os x|macintosh/i.test(ua)) return "macOS";
  if (/cros/i.test(ua)) return "ChromeOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: h });
  const origin = req.headers.get("origin") || "";
  if (origin && !ORIGINS.includes(origin)) return new Response(null, { status: 204, headers: h });
  const ua = (req.headers.get("user-agent") || "").slice(0, 400);
  if (!ua || BOTS.test(ua)) return new Response(null, { status: 204, headers: h });
  let b: Record<string, unknown> = {};
  try { const t = await req.text(); if (t.length > 2000) throw 0; b = JSON.parse(t); } catch { return new Response(null, { status: 400, headers: h }); }
  const path = clean(b.p, 200, /^\/[\w\-./]*$/);
  if (!path || /statsinfo/.test(path)) return new Response(null, { status: 204, headers: h });
  let ref = clean(b.r, 100, /^[a-z0-9.\-]+$/i).toLowerCase().replace(/^www\./, "").replace(/^(l|lm|m)\.facebook\.com$/, "facebook.com").replace(/^l\.instagram\.com$/, "instagram.com");
  if (/(^|\.)movage\.co\.uk$/.test(ref)) ref = "";
  const tz = clean(b.tz, 60, /^[A-Za-z_\/\-+0-9]+$/);
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  const country = (req.headers.get("cf-ipcountry") || "").toUpperCase();
  const payload = {
    kind: b.k === "time" ? "time" : "view", path, ref,
    src: clean(b.s, 60, /^[\w\-. ]+$/).toLowerCase(),
    country: /^[A-Z]{2}$/.test(country) && country !== "XX" ? country : (TZ[tz] || ""),
    dev: device(ua), w: clean(String(b.w ?? ""), 5, /^\d{3,5}$/), br: browser(ua), os: os(ua),
    secs: b.k === "time" ? Math.max(0, Math.min(3600, Math.round(Number(b.t) || 0))) : null,
  };
  const url = Deno.env.get("SUPABASE_URL")!, key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  try {
    await fetch(url + "/rest/v1/rpc/site_log", { method: "POST", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify({ p_ip: ip, p_ua: ua, p: payload }) });
  } catch (_) { /* never break the page */ }
  return new Response(null, { status: 204, headers: h });
});
