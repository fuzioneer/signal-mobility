-- Email info@movage.co.uk for each early access sign-up (applied 14 Nov 2026).
-- Needs the notify-signup Edge Function and its SMTP2GO_API_KEY secret.
create extension if not exists pg_net with schema extensions;
alter table public.early_access add column if not exists notified_at timestamptz;

create or replace function public.early_access_notify()
returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://atmoejivzryboipwvwdv.supabase.co/functions/v1/notify-signup',
    body := jsonb_build_object('id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  return new;
end $$;
revoke all on function public.early_access_notify() from public, anon, authenticated;

drop trigger if exists early_access_notify on public.early_access;
create trigger early_access_notify after insert on public.early_access
  for each row execute function public.early_access_notify();
