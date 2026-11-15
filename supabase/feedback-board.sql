-- Bug reports and feature requests board for movage.co.uk/feedback.html (added 15 Nov 2026).
-- People sign in with the same email code as the app's Community. Everything goes through the
-- functions below, which only ever return nicknames, never emails or other people's ids.
-- New posts email info@movage.co.uk through the notify-feedback Edge Function.

create extension if not exists pg_net with schema extensions;

create table if not exists public.feedback_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.feedback_items (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('bug', 'feature')),
  title       text not null check (char_length(btrim(title)) between 4 and 120),
  body        text not null check (char_length(btrim(body)) between 10 and 4000),
  device      text check (device is null or char_length(device) <= 200),
  status      text not null default 'open' check (status in ('open', 'planned', 'in_progress', 'done', 'wont_fix')),
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  notified_at timestamptz
);
create index if not exists feedback_items_created on public.feedback_items (created_at desc);

create table if not exists public.feedback_votes (
  item_id bigint not null references public.feedback_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (item_id, user_id)
);

create table if not exists public.feedback_comments (
  id         bigint generated always as identity primary key,
  item_id    bigint not null references public.feedback_items(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  team       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists feedback_comments_item on public.feedback_comments (item_id, created_at);

-- No direct table access at all: the functions are the only way in.
alter table public.feedback_admins   enable row level security;
alter table public.feedback_items    enable row level security;
alter table public.feedback_votes    enable row level security;
alter table public.feedback_comments enable row level security;
revoke all on public.feedback_admins, public.feedback_items, public.feedback_votes, public.feedback_comments from anon, authenticated;

create or replace function public.fb_name(p_user uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select nickname from public.profiles where id = p_user), 'Movage member');
$$;
revoke all on function public.fb_name(uuid) from public, anon, authenticated;

create or replace function public.fb_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.feedback_admins where user_id = auth.uid());
$$;

create or replace function public.fb_list()
returns table (id bigint, kind text, title text, body text, device text, status text, created_at timestamptz,
               author text, votes int, my_vote boolean, comments int, mine boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  return query
    select i.id, i.kind, i.title, i.body,
           case when i.user_id = auth.uid() or public.fb_is_admin() then i.device end,
           i.status, i.created_at, public.fb_name(i.user_id),
           (select count(*)::int from public.feedback_votes v where v.item_id = i.id),
           exists (select 1 from public.feedback_votes v where v.item_id = i.id and v.user_id = auth.uid()),
           (select count(*)::int from public.feedback_comments c where c.item_id = i.id),
           i.user_id = auth.uid()
    from public.feedback_items i
    order by i.created_at desc
    limit 500;
end $$;

create or replace function public.fb_create(p_kind text, p_title text, p_body text, p_device text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if (select count(*) from public.feedback_items where user_id = auth.uid() and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You have posted a lot today. Please try again tomorrow.';
  end if;
  insert into public.feedback_items (kind, title, body, device, user_id)
  values (p_kind, btrim(p_title), btrim(p_body), nullif(btrim(coalesce(p_device, '')), ''), auth.uid())
  returning feedback_items.id into v_id;
  insert into public.feedback_votes (item_id, user_id) values (v_id, auth.uid()) on conflict do nothing;
  return v_id;
end $$;

create or replace function public.fb_vote(p_id bigint, p_on boolean)
returns int language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if p_on then
    insert into public.feedback_votes (item_id, user_id) values (p_id, auth.uid()) on conflict do nothing;
  else
    delete from public.feedback_votes where item_id = p_id and user_id = auth.uid();
  end if;
  return (select count(*)::int from public.feedback_votes where item_id = p_id);
end $$;

create or replace function public.fb_comments(p_id bigint)
returns table (id bigint, body text, created_at timestamptz, author text, team boolean, mine boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  return query
    select c.id, c.body, c.created_at, case when c.team then 'Movage team' else public.fb_name(c.user_id) end,
           c.team, c.user_id = auth.uid()
    from public.feedback_comments c where c.item_id = p_id order by c.created_at;
end $$;

create or replace function public.fb_comment(p_id bigint, p_body text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if (select count(*) from public.feedback_comments where user_id = auth.uid() and created_at > now() - interval '1 day') >= 50 then
    raise exception 'You have commented a lot today. Please try again tomorrow.';
  end if;
  insert into public.feedback_comments (item_id, user_id, body, team)
  values (p_id, auth.uid(), btrim(p_body), public.fb_is_admin())
  returning feedback_comments.id into v_id;
  return v_id;
end $$;

create or replace function public.fb_set_status(p_id bigint, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.fb_is_admin() then raise exception 'Only the Movage team can change the status'; end if;
  update public.feedback_items set status = p_status, updated_at = now() where id = p_id;
end $$;

create or replace function public.fb_delete(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  delete from public.feedback_items where id = p_id and (user_id = auth.uid() or public.fb_is_admin());
end $$;

revoke all on function public.fb_is_admin(), public.fb_list(), public.fb_create(text, text, text, text),
  public.fb_vote(bigint, boolean), public.fb_comments(bigint), public.fb_comment(bigint, text),
  public.fb_set_status(bigint, text), public.fb_delete(bigint) from public, anon;
grant execute on function public.fb_is_admin(), public.fb_list(), public.fb_create(text, text, text, text),
  public.fb_vote(bigint, boolean), public.fb_comments(bigint), public.fb_comment(bigint, text),
  public.fb_set_status(bigint, text), public.fb_delete(bigint) to authenticated;

-- Email the team about each new post.
create or replace function public.feedback_notify()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://atmoejivzryboipwvwdv.supabase.co/functions/v1/notify-feedback',
    body := jsonb_build_object('id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  return new;
end $$;
revoke all on function public.feedback_notify() from public, anon, authenticated;

drop trigger if exists feedback_notify on public.feedback_items;
create trigger feedback_notify after insert on public.feedback_items
  for each row execute function public.feedback_notify();

-- Admins by email (added 15 Nov 2026): whoever signs in with one of these addresses gets the
-- status dropdown and "Movage team" comments, even if they create their account later.
create table if not exists public.feedback_admin_emails (email text primary key check (email = lower(email)));
alter table public.feedback_admin_emails enable row level security;
revoke all on public.feedback_admin_emails from anon, authenticated;
insert into public.feedback_admin_emails (email) values ('support@movage.co.uk') on conflict do nothing;

create or replace function public.fb_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.feedback_admins where user_id = auth.uid())
      or exists (select 1 from public.feedback_admin_emails a join auth.users u on lower(u.email) = a.email where u.id = auth.uid());
$$;

-- Sections (added 15 Nov 2026): each post says which part of the app it's about.
-- Applied as migration feedback_sections, which also replaced fb_list (now returns area),
-- fb_create (new p_area argument) and added fb_set_area for the team to move posts.
alter table public.feedback_items add column if not exists area text not null default 'general'
  check (area in ('today', 'routines', 'test', 'history', 'community', 'general'));
