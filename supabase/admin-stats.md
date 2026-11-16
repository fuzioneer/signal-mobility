# admin_stats (migration admin_stats, 16 Nov 2026)

`public.admin_stats(p_days int)` returns one JSON object of usage totals for movage.co.uk/admin.html:
accounts (total, new, signed in, per day), guided sessions (count, time, people, per day, by weekday),
mobility scores (count, average, verified, by zone, spread), Community (members, clubs, biggest clubs),
bugs and ideas, and early access sign-ups by source.

It is security definer and raises "Only the Movage team can see this" unless `fb_is_admin()` is true
(support@movage.co.uk, or anyone added to feedback_admin_emails). It never returns emails.
Execute is revoked from anon. The full SQL is in the Supabase migration history.
