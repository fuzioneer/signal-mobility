-- v1.43.0: clubs on the Top clubs board
alter table public.communities add column if not exists listed boolean not null default true;

drop function if exists public.create_community(text);
drop function if exists public.create_community(text, boolean);
create function public.create_community(p_name text, p_listed boolean default true)
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
  insert into communities (name, code, owner_id, listed) values (btrim(p_name), c, me, coalesce(p_listed, true)) returning communities.id into new_id;
  insert into memberships (community_id, user_id) values (new_id, me);
  return query select new_id, btrim(p_name), c;
end $$;


drop function if exists public.my_communities();
create function public.my_communities()
returns table (id uuid, name text, code text, members bigint, is_owner boolean, listed boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.name, c.code,
         (select count(*) from memberships m2 where m2.community_id = c.id),
         c.owner_id = auth.uid(), c.listed
    from communities c join memberships m on m.community_id = c.id
   where m.user_id = auth.uid()
   order by c.name;
$$;


-- Only the club's owner can choose whether it appears on the Top clubs board.
drop function if exists public.set_community_listed(uuid, boolean);
create function public.set_community_listed(p_id uuid, p_listed boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  update communities x set listed = coalesce(p_listed, true) where x.id = p_id and x.owner_id = auth.uid();
  if not found then raise exception 'only the club owner can change this'; end if;
end $$;

-- Top clubs. Listed clubs with at least 2 members.
-- 'time': total guided time in the period from members who share their time.
-- 'score': average latest score of members who share it (at least 2 scores).
-- A club's id comes back only to its members, so a non-member can't open its board; the code is never returned.
drop function if exists public.club_board(text, date, date, int);
create function public.club_board(p_metric text, p_from date, p_to date, p_limit int default 50)
returns table (rank bigint, id uuid, name text, members bigint, value numeric, counted bigint, is_mine boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  return query
  with clubs as (
    select c.id, c.name, count(m.user_id)::bigint as n,
           bool_or(m.user_id = auth.uid()) as mine
      from communities c join memberships m on m.community_id = c.id
     where c.listed
     group by c.id, c.name
    having count(m.user_id) >= 2
  ), vals as (
    select cl.id, cl.name, cl.n, cl.mine,
      case when p_metric = 'score' then
        (select round(avg(sc.overall)::numeric, 1) from memberships m join profiles p on p.id = m.user_id join scores sc on sc.user_id = m.user_id
          where m.community_id = cl.id and p.share_score)
      else
        (select coalesce(sum(s.secs), 0)::numeric from memberships m join profiles p on p.id = m.user_id join sessions s on s.user_id = m.user_id
          where m.community_id = cl.id and p.share_time and s.local_date between p_from and p_to)
      end as v,
      case when p_metric = 'score' then
        (select count(*) from memberships m join profiles p on p.id = m.user_id join scores sc on sc.user_id = m.user_id
          where m.community_id = cl.id and p.share_score)
      else
        (select count(distinct s.user_id) from memberships m join profiles p on p.id = m.user_id join sessions s on s.user_id = m.user_id
          where m.community_id = cl.id and p.share_time and s.local_date between p_from and p_to)
      end::bigint as k
      from clubs cl
  ), ranked as (
    select rank() over (order by v.v desc) as r, v.* from vals v
     where (p_metric = 'score' and v.k >= 2) or (p_metric <> 'score' and v.v > 0)
  )
  select r.r, case when r.mine then r.id end, r.name, r.n, r.v, r.k, r.mine from ranked r
   where r.r <= greatest(1, least(p_limit, 100)) or r.mine
   order by r.r, r.name;
end $$;


revoke all on function public.create_community(text, boolean), public.join_community(text), public.leave_community(uuid),
  public.my_communities(), public.time_board(uuid, date, date, int), public.score_board(uuid, boolean, int),
  public.set_community_listed(uuid, boolean), public.club_board(text, date, date, int),
  public.delete_account() from public, anon;
grant execute on function public.create_community(text, boolean), public.join_community(text), public.leave_community(uuid),
  public.my_communities(), public.time_board(uuid, date, date, int), public.score_board(uuid, boolean, int),
  public.set_community_listed(uuid, boolean), public.club_board(text, date, date, int),
  public.delete_account() to authenticated;
