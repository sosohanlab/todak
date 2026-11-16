begin;
alter table todak_feedback.inbox add column if not exists attachment text
 check (attachment is null or (length(attachment) between 31 and 680000 and attachment ~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+=*$'));
create or replace function public.todak_feedback_submit_with_image(
 p_request_id uuid,p_client_hash text,p_category text,p_message text,p_page text,p_width integer,p_height integer,p_attachment text default null
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if p_attachment is not null and (length(p_attachment)>680000 or p_attachment !~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+=*$') then raise exception 'invalid image';end if;
 result:=public.todak_feedback_submit(p_request_id,p_client_hash,p_category,p_message,p_page,p_width,p_height);
 if result->>'accepted'='true' and p_attachment is not null then
  update todak_feedback.inbox set attachment=p_attachment where id=p_request_id and attachment is null and email_state='pending';
 end if;
 return result;
end;
$$;
create or replace function public.todak_feedback_mail_claim(p_request_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_row todak_feedback.inbox%rowtype;
begin
 select * into strict v_row from todak_feedback.inbox where id=p_request_id for update;
 if v_row.email_state='sent' then return jsonb_build_object('state','sent');end if;
 if v_row.email_lease_until>now() then return jsonb_build_object('state','busy');end if;
 update todak_feedback.inbox set email_state='sending',email_lease_until=now()+interval '45 seconds' where id=p_request_id;
 return jsonb_build_object('state','send','category',v_row.category,'message',v_row.message,'page',v_row.page,'width',v_row.viewport_width,'height',v_row.viewport_height,'attachment',v_row.attachment);
end;
$$;
revoke all on function public.todak_feedback_submit_with_image(uuid,text,text,text,text,integer,integer,text) from public,anon,authenticated;
grant execute on function public.todak_feedback_submit_with_image(uuid,text,text,text,text,integer,integer,text) to service_role;
commit;
