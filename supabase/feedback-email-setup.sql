alter table todak_feedback.inbox add column email_state text not null default 'pending' check (email_state in ('pending','sending','sent'));
alter table todak_feedback.inbox add column email_lease_until timestamptz;
alter table todak_feedback.inbox add column email_sent_at timestamptz;
grant update on todak_feedback.inbox to service_role;

create function public.todak_feedback_mail_claim(p_request_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_row todak_feedback.inbox%rowtype;
begin
  select * into strict v_row from todak_feedback.inbox where id=p_request_id for update;
  if v_row.email_state='sent' then return jsonb_build_object('state','sent');end if;
  if v_row.email_lease_until>now() then return jsonb_build_object('state','busy');end if;
  update todak_feedback.inbox set email_state='sending',email_lease_until=now()+interval '45 seconds' where id=p_request_id;
  return jsonb_build_object('state','send','category',v_row.category,'message',v_row.message,'page',v_row.page,'width',v_row.viewport_width,'height',v_row.viewport_height);
end;
$$;
create function public.todak_feedback_mail_result(p_request_id uuid,p_sent boolean)
returns void language plpgsql security invoker set search_path='' as $$
begin
  update todak_feedback.inbox set email_state=case when p_sent then 'sent' else 'pending' end,
    email_sent_at=case when p_sent then now() else null end,
    email_lease_until=case when p_sent then null else email_lease_until end where id=p_request_id;
end;
$$;
revoke all on function public.todak_feedback_mail_claim(uuid) from public,anon,authenticated;
revoke all on function public.todak_feedback_mail_result(uuid,boolean) from public,anon,authenticated;
grant execute on function public.todak_feedback_mail_claim(uuid) to service_role;
grant execute on function public.todak_feedback_mail_result(uuid,boolean) to service_role;
