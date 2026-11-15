// Emails info@movage.co.uk when someone posts on the bug and feature board (movage.co.uk/feedback.html).
// Called by a database trigger with {"id": <item id>}. It claims the row first, so each post is
// emailed once and a stray call can't send spam. Reply-To is the poster, so Reply goes to them.
// Secrets: SMTP2GO_API_KEY (required), NOTIFY_TO and NOTIFY_FROM (optional).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const TO = Deno.env.get("NOTIFY_TO") || "info@movage.co.uk";
const FROM = Deno.env.get("NOTIFY_FROM") || "Movage <noreply@movage.co.uk>";
const BOARD = "https://www.movage.co.uk/feedback.html";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const okEmail = (e: string) => /^[^\s@<>",;:]+@[^\s@<>",;:]+\.[^\s@<>",;:]+$/.test(e);

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const key = Deno.env.get("SMTP2GO_API_KEY");
  if (!key) return json({ error: "SMTP2GO_API_KEY is not set" }, 500);
  let id: number;
  try { id = Number((await req.json()).id); } catch { return json({ error: "bad body" }, 400); }
  if (!Number.isFinite(id)) return json({ error: "bad id" }, 400);

  const { data: rows, error } = await db.from("feedback_items").update({ notified_at: new Date().toISOString() })
    .eq("id", id).is("notified_at", null).select("kind, title, body, device, user_id, created_at");
  if (error) return json({ error: error.message }, 500);
  if (!rows || !rows.length) return json({ skipped: true });
  const r = rows[0];

  const { data: u } = await db.auth.admin.getUserById(r.user_id);
  const email = u?.user?.email || "";
  const { data: p } = await db.from("profiles").select("nickname").eq("id", r.user_id).maybeSingle();
  const who = p?.nickname ? `${p.nickname} (${email || "no email"})` : (email || "unknown");

  const label = r.kind === "bug" ? "Bug report" : "Feature request";
  const when = new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "full", timeStyle: "short" });
  const subject = `${label}: ${r.title}`;
  const text = `${label} on the Movage board.\n\nTitle: ${r.title}\nFrom: ${who}\nWhen: ${when}\n${r.device ? `Device: ${r.device}\n` : ""}\n${r.body}\n\nSee it on the board: ${BOARD}\n`;
  const row = (k: string, v: string) => `<tr><td style="color:#5d6b66;vertical-align:top">${k}</td><td>${v}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#14201c"><p><b>${label} on the Movage board.</b></p>` +
    `<table cellpadding="4" style="border-collapse:collapse">${row("Title", `<b>${esc(r.title)}</b>`)}${row("From", esc(who))}${row("When", esc(when))}${r.device ? row("Device", esc(r.device)) : ""}</table>` +
    `<p style="white-space:pre-wrap;border-left:3px solid #46b39f;padding-left:12px">${esc(r.body)}</p><p><a href="${BOARD}">See it on the board</a></p></div>`;

  const res = await fetch("https://api.smtp2go.com/v3/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Smtp2go-Api-Key": key, "accept": "application/json" },
    body: JSON.stringify({ sender: FROM, to: [TO], subject, text_body: text, html_body: html,
      ...(okEmail(email) ? { custom_headers: [{ header: "Reply-To", value: email }] } : {}) }),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || (out?.data?.succeeded ?? 0) < 1) {
    await db.from("feedback_items").update({ notified_at: null }).eq("id", id);
    return json({ error: "email failed", detail: out }, 502);
  }
  return json({ sent: true });
});
