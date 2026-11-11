-- Run once in Supabase SQL Editor, or apply with `supabase db push`.
-- Private tables; only Edge Functions using service_role may invoke these RPCs.
begin;
create schema if not exists todak_private;
revoke all on schema todak_private from public, anon, authenticated;

create table if not exists todak_private.search_budget (
  id integer primary key check (id = 1),
  month_key text not null default '', month_count integer not null default 0,
  day_key date not null default '1970-01-01', day_count integer not null default 0
);
insert into todak_private.search_budget(id) values (1) on conflict do nothing;

create table if not exists todak_private.search_clients (
  client_hash text primary key,
  day_key date not null, day_count integer not null default 0,
  minute_key timestamptz not null, minute_count integer not null default 0,
  last_seen timestamptz not null default now()
);
create table if not exists todak_private.search_cache (
  digest text primary key, result jsonb not null, expires_at timestamptz not null
);
alter table todak_private.search_budget enable row level security;
alter table todak_private.search_clients enable row level security;
alter table todak_private.search_cache enable row level security;
revoke all on all tables in schema todak_private from public, anon, authenticated;

create or replace function public.todak_search_reserve(
  p_client_hash text, p_month_limit integer default 200,
  p_day_limit integer default 20, p_client_day_limit integer default 5
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  month_id text := to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM');
  minute_id timestamptz := date_trunc('minute', now());
  budget todak_private.search_budget%rowtype;
  client todak_private.search_clients%rowtype;
begin
  if p_client_hash is null or p_client_hash !~ '^[a-f0-9]{64}$'
    or p_month_limit is null or p_month_limit < 1 or p_month_limit > 10000
    or p_day_limit is null or p_day_limit < 1 or p_day_limit > 1000
    or p_client_day_limit is null or p_client_day_limit < 1 or p_client_day_limit > 50 then
    raise exception 'invalid limits';
  end if;
  -- One global row lock serializes reservations from ALL concurrent Edge instances.
  select * into strict budget from todak_private.search_budget where id = 1 for update;
  if budget.month_key <> month_id then budget.month_key := month_id; budget.month_count := 0; end if;
  if budget.day_key <> today then budget.day_key := today; budget.day_count := 0; end if;
  if budget.month_count >= p_month_limit then return jsonb_build_object('allowed',false,'reason','monthly_limit'); end if;
  if budget.day_count >= p_day_limit then return jsonb_build_object('allowed',false,'reason','daily_limit'); end if;

  delete from todak_private.search_clients where last_seen < now() - interval '2 days';
  delete from todak_private.search_cache where expires_at <= now();
  insert into todak_private.search_clients(client_hash,day_key,minute_key)
    values(p_client_hash,today,minute_id) on conflict do nothing;
  select * into strict client from todak_private.search_clients where client_hash = p_client_hash for update;
  if client.day_key <> today then client.day_key := today; client.day_count := 0; end if;
  if client.minute_key <> minute_id then client.minute_key := minute_id; client.minute_count := 0; end if;
  if client.day_count >= p_client_day_limit or client.minute_count >= 3 then
    return jsonb_build_object('allowed',false,'reason','client_limit');
  end if;
  update todak_private.search_clients set day_key=today,day_count=client.day_count+1,
    minute_key=minute_id,minute_count=client.minute_count+1,last_seen=now() where client_hash=p_client_hash;
  update todak_private.search_budget set month_key=month_id,month_count=budget.month_count+1,
    day_key=today,day_count=budget.day_count+1 where id=1;
  return jsonb_build_object('allowed',true);
end $$;

create or replace function public.todak_search_cache_get(p_digest text)
returns jsonb language sql security definer set search_path = '' as $$
  select result from todak_private.search_cache where digest=p_digest and expires_at>now();
$$;

create or replace function public.todak_search_cache_put(p_digest text,p_result jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_digest is null or p_digest !~ '^[a-f0-9]{64}$' or p_result is null
    or jsonb_typeof(p_result->'matches') is distinct from 'array'
    or octet_length(p_result::text)>100000 then raise exception 'invalid cache'; end if;
  delete from todak_private.search_cache where expires_at<=now();
  insert into todak_private.search_cache(digest,result,expires_at)
    values(p_digest,p_result,now()+interval '10 minutes')
    on conflict(digest) do update set result=excluded.result,expires_at=excluded.expires_at;
end $$;

revoke all on function public.todak_search_reserve(text,integer,integer,integer) from public,anon,authenticated;
revoke all on function public.todak_search_cache_get(text) from public,anon,authenticated;
revoke all on function public.todak_search_cache_put(text,jsonb) from public,anon,authenticated;
grant execute on function public.todak_search_reserve(text,integer,integer,integer) to service_role;
grant execute on function public.todak_search_cache_get(text) to service_role;
grant execute on function public.todak_search_cache_put(text,jsonb) to service_role;
commit;
