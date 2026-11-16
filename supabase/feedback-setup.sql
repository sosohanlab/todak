-- Private feedback inbox. Visitors have no table or RPC privileges.
create schema todak_feedback;
revoke all on schema todak_feedback from public, anon, authenticated;
grant usage on schema todak_feedback to service_role;

create table todak_feedback.inbox (
  id uuid primary key,
  created_at timestamptz not null default now(),
  category text not null check (category in ('bug','idea','other')),
  message text not null check (char_length(btrim(message)) between 5 and 2000),
  page text not null check (char_length(page) between 1 and 120 and left(page,1)='/'),
  viewport_width integer check (viewport_width between 0 and 10000),
  viewport_height integer check (viewport_height between 0 and 10000)
);
create index feedback_inbox_created_at on todak_feedback.inbox(created_at desc);
create table todak_feedback.clients (
  client_hash text primary key check (client_hash ~ '^[a-f0-9]{64}$'),
  day_key date not null,
  day_count integer not null default 0,
  last_sent timestamptz not null default '-infinity'
);
create table todak_feedback.budget (
  id boolean primary key default true check (id),
  day_key date not null default current_date,
  day_count integer not null default 0
);
insert into todak_feedback.budget(id) values(true);
alter table todak_feedback.inbox enable row level security;
alter table todak_feedback.inbox force row level security;
alter table todak_feedback.clients enable row level security;
alter table todak_feedback.clients force row level security;
alter table todak_feedback.budget enable row level security;
alter table todak_feedback.budget force row level security;
revoke all on all tables in schema todak_feedback from public, anon, authenticated;
grant select, insert on todak_feedback.inbox to service_role;
grant select, insert, update, delete on todak_feedback.clients to service_role;
grant select, update on todak_feedback.budget to service_role;

create function public.todak_feedback_submit(
  p_request_id uuid, p_client_hash text, p_category text, p_message text,
  p_page text, p_width integer, p_height integer
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_budget todak_feedback.budget%rowtype;
  v_client todak_feedback.clients%rowtype;
  today date := (now() at time zone 'UTC')::date;
begin
  if p_request_id is null or p_client_hash is null or p_client_hash !~ '^[a-f0-9]{64}$'
    or p_category is null or p_category not in ('bug','idea','other')
    or p_message is null or char_length(btrim(p_message)) not between 5 and 2000
    or p_page is null or char_length(p_page) not between 1 and 120 or left(p_page,1)<>'/'
    or p_width is null or p_width not between 0 and 10000
    or p_height is null or p_height not between 0 and 10000 then
    raise exception 'invalid feedback';
  end if;
  -- A shared lock enforces limits and idempotency across Edge instances.
  select * into strict v_budget from todak_feedback.budget where id=true for update;
  if exists(select 1 from todak_feedback.inbox where id=p_request_id) then
    return jsonb_build_object('accepted',true);
  end if;
  if v_budget.day_key<>today then v_budget.day_key:=today;v_budget.day_count:=0;end if;
  if v_budget.day_count>=300 then return jsonb_build_object('accepted',false,'reason','daily_limit');end if;
  delete from todak_feedback.clients where day_key<today-2;
  insert into todak_feedback.clients(client_hash,day_key) values(p_client_hash,today) on conflict do nothing;
  select * into strict v_client from todak_feedback.clients where client_hash=p_client_hash for update;
  if v_client.day_key<>today then v_client.day_count:=0;end if;
  if v_client.day_count>=5 or v_client.last_sent>now()-interval '30 seconds' then
    return jsonb_build_object('accepted',false,'reason','rate_limit');
  end if;
  insert into todak_feedback.inbox(id,category,message,page,viewport_width,viewport_height)
    values(p_request_id,p_category,btrim(p_message),p_page,p_width,p_height);
  update todak_feedback.clients set day_key=today,day_count=v_client.day_count+1,last_sent=now() where client_hash=p_client_hash;
  update todak_feedback.budget set day_key=today,day_count=v_budget.day_count+1 where id=true;
  return jsonb_build_object('accepted',true);
end;
$$;
revoke all on function public.todak_feedback_submit(uuid,text,text,text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.todak_feedback_submit(uuid,text,text,text,text,integer,integer) to service_role;

