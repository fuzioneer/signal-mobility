-- Applied 16 Nov 2026 as migration early_access_flood_guard.
-- The early access form is open to anyone and every sign-up emails the team. Cap the rate so a script
-- can't flood the list or the inbox: at most 30 sign-ups in any 10 minutes across the whole site.
-- Also strips anything but letters, numbers, _ . - from the "source" tag.
create or replace function public.early_access_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.early_access where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'Too many sign-ups right now. Please try again in a few minutes.' using errcode = 'P0001';
  end if;
  new.source := left(regexp_replace(coalesce(new.source, 'website'), '[^A-Za-z0-9_.-]', '', 'g'), 40);
  if new.source = '' then new.source := 'website'; end if;
  return new;
end $$;
revoke all on function public.early_access_guard() from public, anon, authenticated;
drop trigger if exists early_access_guard on public.early_access;
create trigger early_access_guard before insert on public.early_access for each row execute function public.early_access_guard();
create index if not exists early_access_created on public.early_access (created_at desc);
