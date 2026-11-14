// Emails info@movage.co.uk when someone joins the early access list.
// Called by a database trigger with {"id": <row id>}. It checks the row itself and only emails
// for a real sign-up that hasn't been notified yet, so a stray call can't send spam.
// Secrets: SMTP2GO_API_KEY (required), NOTIFY_TO and NOTIFY_FROM (optional).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const TO = Deno.env.get("NOTIFY_TO") || "info@movage.co.uk";
const FROM = Deno.env.get("NOTIFY_FROM") || "Movage <noreply@movage.co.uk>";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const key = Deno.env.get("SMTP2GO_API_KEY");
  if (!key) return json({ error: "SMTP2GO_API_KEY is not set" }, 500);
  let id: number;
  try { id = Number((await req.json()).id); } catch { return json({ error: "bad body" }, 400); }
  if (!Number.isFinite(id)) return json({ error: "bad id" }, 400);

  // Claim the row: only one call can mark it as notified.
  const { data: rows, error } = await db.from("early_access").update({ notified_at: new Date().toISOString() })
    .eq("id", id).is("notified_at", null).select("email, source, created_at");
  if (error) return json({ error: error.message }, 500);
  if (!rows || !rows.length) return json({ skipped: true });
  const r = rows[0];
  const { count } = await db.from("early_access").select("id", { count: "exact", head: true });

  const when = new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "full", timeStyle: "short" });
  const subject = `New early access sign-up: ${r.email}`;
  const text = `Someone just joined the Movage early access list.\n\nEmail: ${r.email}\nSigned up from: ${r.source || "website"}\nWhen: ${when}\nTotal on the list: ${count ?? "?"}\n`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#14201c"><p><b>Someone just joined the Movage early access list.</b></p><table cellpadding="4" style="border-collapse:collapse"><tr><td style="color:#5d6b66">Email</td><td><b>${esc(r.email)}</b></td></tr><tr><td style="color:#5d6b66">Signed up from</td><td>${esc(r.source || "website")}</td></tr><tr><td style="color:#5d6b66">When</td><td>${esc(when)}</td></tr><tr><td style="color:#5d6b66">Total on the list</td><td>${count ?? "?"}</td></tr></table></div>`;

  const res = await fetch("https://api.smtp2go.com/v3/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Smtp2go-Api-Key": key, "accept": "application/json" },
    body: JSON.stringify({ sender: FROM, to: [TO], subject, text_body: text, html_body: html }),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || (out?.data?.succeeded ?? 0) < 1) {
    // Let a later call try again.
    await db.from("early_access").update({ notified_at: null }).eq("id", id);
    return json({ error: "email failed", detail: out }, 502);
  }
  return json({ sent: true });
});
