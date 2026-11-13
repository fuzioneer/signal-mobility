-- Movage community back end (Supabase / Postgres).
-- Run once in the Supabase SQL editor. Safe to re-run: it drops and recreates the functions,
-- and only creates tables that don't exist yet.
--
-- What it holds:
--   profiles     one row per signed-in person: nickname and what they agree to share
--   communities  groups people join with a short code
--   memberships  who is in which community
--   sessions     completed guided mobility sessions (length and local date only)
--   scores       each person's latest mobility score
-- Everything else (tests, routines, settings) stays on the phone.
--
-- Security: row level security is on for every table. People can only read and write their own
-- rows directly. Leaderboards and community actions go through the functions at the bottom,
-- which only ever return nicknames and totals, never emails or ids of other people.

-- ---------- tables ----------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nickname    text not null check (char_length(btrim(nickname)) between 2 and 20 and nickname !~ '[[:cntrl:]<>]'),
  share_time  boolean not null default true,
  share_score boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists profiles_nickname_ci on public.profiles (lower(btrim(nickname)));

create table if not exists public.communities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 2 and 40 and name !~ '[[:cntrl:]<>]'),
  code       text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  owner_id   uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index if not exists memberships_user on public.memberships (user_id);

create table if not exists public.sessions (
  id         uuid primary key,                       -- made on the phone, so a retry never double counts
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  local_date date not null,                          -- the person's own calendar day
  secs       integer not null check (secs between 30 and 7200),
  source     text not null default 'player' check (source = 'player'),
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_date on public.sessions (user_id, local_date);
create index if not exists sessions_date on public.sessions (local_date);

create table if not exists public.scores (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  overall    integer not null check (overall between 0 and 100),
  zones      jsonb not null default '{}'::jsonb,
  verified   boolean not null default false,         -- camera measured every camera test in it
  tested_on  date not null,
  updated_at timestamptz not null default now()
);

-- ---------- guard rails on sessions ----------
-- Only guided-player sessions are sent. These limits stop obvious junk:
-- the date must be recent (35 days back allows the first-sign-in catch-up) and not in the future,
-- and one person can't log more than 4 hours on one day.
create or replace function public.sessions_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare day_total integer;
begin
  if new.user_id is distinct from auth.uid() then raise exception 'not your session'; end if;
  if new.local_date > current_date + 1 or new.local_date < current_date - 35 then
    raise exception 'session date out of range';
  end if;
  select coalesce(sum(secs), 0) into day_total from public.sessions
   where user_id = new.user_id and local_date = new.local_date;
  if day_total + new.secs > 4 * 3600 then raise exception 'daily limit reached'; end if;
  return new;
end $$;
drop trigger if exists sessions_guard on public.sessions;
create trigger sessions_guard before insert on public.sessions for each row execute function public.sessions_guard();

create or replace function public.scores_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is distinct from auth.uid() then raise exception 'not your score'; end if;
  if new.tested_on > current_date + 1 then raise exception 'test date in the future'; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists scores_guard on public.scores;
create trigger scores_guard before insert or update on public.scores for each row execute function public.scores_guard();

-- ---------- row level security ----------
alter table public.profiles    enable row level security;
alter table public.communities enable row level security;
alter table public.memberships enable row level security;
alter table public.sessions    enable row level security;
alter table public.scores      enable row level security;

drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile insert" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "member reads community" on public.communities;
create policy "member reads community" on public.communities for select to authenticated
  using (exists (select 1 from public.memberships m where m.community_id = id and m.user_id = auth.uid()));

drop policy if exists "own memberships read"  on public.memberships;
drop policy if exists "own memberships leave" on public.memberships;
create policy "own memberships read"  on public.memberships for select to authenticated using (user_id = auth.uid());
create policy "own memberships leave" on public.memberships for delete to authenticated using (user_id = auth.uid());

drop policy if exists "own sessions read"   on public.sessions;
drop policy if exists "own sessions insert" on public.sessions;
create policy "own sessions read"   on public.sessions for select to authenticated using (user_id = auth.uid());
create policy "own sessions insert" on public.sessions for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "own score read"   on public.scores;
drop policy if exists "own score insert" on public.scores;
drop policy if exists "own score update" on public.scores;
create policy "own score read"   on public.scores for select to authenticated using (user_id = auth.uid());
create policy "own score insert" on public.scores for insert to authenticated with check (user_id = auth.uid());
create policy "own score update" on public.scores for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.profiles, public.communities, public.memberships, public.sessions, public.scores from anon;
grant select, insert, update on public.profiles to authenticated;
grant select on public.communities to authenticated;
grant select, delete on public.memberships to authenticated;
grant select, insert on public.sessions to authenticated;
grant select, insert, update on public.scores to authenticated;

-- ---------- community actions ----------
drop function if exists public.create_community(text);
create function public.create_community(p_name text)
returns table (id uuid, name text, code text)
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c text; new_id uuid; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  if me is null or not exists (select 1 from profiles p where p.id = me) then raise exception 'set a nickname first'; end if;
  if (select count(*) from communities x where x.owner_id = me) >= 10 then raise exception 'community limit reached'; end if;
  if (select count(*) from memberships m where m.user_id = me) >= 20 then raise exception 'membership limit reached'; end if;
  loop
    c := '';
    for i in 1..6 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    exit when not exists (select 1 from communities x where x.code = c);
  end loop;
  insert into communities (name, code, owner_id) values (btrim(p_name), c, me) returning communities.id into new_id;
  insert into memberships (community_id, user_id) values (new_id, me);
  return query select new_id, btrim(p_name), c;
end $$;

drop function if exists public.join_community(text);
create function public.join_community(p_code text)
returns table (id uuid, name text, code text)
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cm communities%rowtype;
begin
  if me is null or not exists (select 1 from profiles p where p.id = me) then raise exception 'set a nickname first'; end if;
  select * into cm from communities x where x.code = upper(btrim(p_code));
  if not found then raise exception 'no community with that code'; end if;
  if not exists (select 1 from memberships m where m.community_id = cm.id and m.user_id = me) then
    if (select count(*) from memberships m where m.user_id = me) >= 20 then raise exception 'membership limit reached'; end if;
    insert into memberships (community_id, user_id) values (cm.id, me);
  end if;
  return query select cm.id, cm.name, cm.code;
end $$;

drop function if exists public.leave_community(uuid);
create function public.leave_community(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from memberships m where m.community_id = p_id and m.user_id = auth.uid();
  delete from communities x where x.id = p_id and not exists (select 1 from memberships m where m.community_id = p_id);
end $$;

drop function if exists public.my_communities();
create function public.my_communities()
returns table (id uuid, name text, code text, members bigint, is_owner boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.name, c.code,
         (select count(*) from memberships m2 where m2.community_id = c.id),
         c.owner_id = auth.uid()
    from communities c join memberships m on m.community_id = c.id
   where m.user_id = auth.uid()
   order by c.name;
$$;

-- ---------- leaderboards ----------
-- p_community null = everyone who shares. Otherwise the caller must be a member.
-- Returns the top p_limit plus the caller's own row if they are further down.
drop function if exists public.time_board(uuid, date, date, int);
create function public.time_board(p_community uuid, p_from date, p_to date, p_limit int default 50)
returns table (rank bigint, nickname text, secs bigint, sessions bigint, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  if p_community is not null and not exists (select 1 from memberships m where m.community_id = p_community and m.user_id = auth.uid()) then
    raise exception 'not a member';
  end if;
  return query
  with people as (
    select p.id, p.nickname from profiles p
     where p.share_time
       and (p_community is null or exists (select 1 from memberships m where m.community_id = p_community and m.user_id = p.id))
  ), totals as (
    select pe.id, pe.nickname, sum(s.secs)::bigint as t, count(*)::bigint as n
      from people pe join sessions s on s.user_id = pe.id
     where s.local_date between p_from and p_to
     group by pe.id, pe.nickname
  ), ranked as (
    select rank() over (order by t.t desc) as r, t.nickname, t.t, t.n, t.id = auth.uid() as me from totals t
  )
  select r.r, r.nickname, r.t, r.n, r.me from ranked r
   where r.r <= greatest(1, least(p_limit, 200)) or r.me
   order by r.r, r.nickname;
end $$;

drop function if exists public.score_board(uuid, boolean, int);
create function public.score_board(p_community uuid, p_verified_only boolean default false, p_limit int default 50)
returns table (rank bigint, nickname text, overall int, verified boolean, tested_on date, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  if p_community is not null and not exists (select 1 from memberships m where m.community_id = p_community and m.user_id = auth.uid()) then
    raise exception 'not a member';
  end if;
  return query
  with ranked as (
    select rank() over (order by sc.overall desc) as r, p.nickname, sc.overall, sc.verified, sc.tested_on, p.id = auth.uid() as me
      from profiles p join scores sc on sc.user_id = p.id
     where p.share_score
       and (not p_verified_only or sc.verified)
       and (p_community is null or exists (select 1 from memberships m where m.community_id = p_community and m.user_id = p.id))
  )
  select r.r, r.nickname, r.overall, r.verified, r.tested_on, r.me from ranked r
   where r.r <= greatest(1, least(p_limit, 200)) or r.me
   order by r.r, r.nickname;
end $$;

-- ---------- account deletion (App Store guideline 5.1.1) ----------
-- Removes the sign-in and, through the cascades, the profile, memberships, sessions and score.
drop function if exists public.delete_account();
create function public.delete_account()
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  delete from communities c where c.owner_id = auth.uid()
     and not exists (select 1 from memberships m where m.community_id = c.id and m.user_id <> auth.uid());
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.create_community(text), public.join_community(text), public.leave_community(uuid),
  public.my_communities(), public.time_board(uuid, date, date, int), public.score_board(uuid, boolean, int),
  public.delete_account() from public, anon;
grant execute on function public.create_community(text), public.join_community(text), public.leave_community(uuid),
  public.my_communities(), public.time_board(uuid, date, date, int), public.score_board(uuid, boolean, int),
  public.delete_account() to authenticated;
revoke all on function public.sessions_guard(), public.scores_guard() from public, anon, authenticated;
