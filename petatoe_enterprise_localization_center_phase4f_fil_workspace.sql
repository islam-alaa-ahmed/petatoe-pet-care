-- PETATOE v9 ELC Phase 4F — Filipino Translation Workspace
-- Safe to run after Phase 4B.2 and Phase 4C.
begin;

create or replace function public.get_fil_translation_workspace(
  p_query text default null,
  p_limit integer default 25,
  p_offset integer default 0,
  p_actor_user_id text default null,
  p_session_token text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_result jsonb;
begin
  if public.petatoe_localization_actor_role(p_actor_user_id,p_session_token) = 'viewer' then
    raise exception 'Localization session is invalid or expired' using errcode='42501';
  end if;

  with base as (
    select k.translation_key,k.module,k.source_text,
           v.translated_text,v.status,
           q.suggested_text,
           coalesce(v.status,case when q.status='pending' then 'pending' else 'missing' end) effective_status
    from public.localization_keys k
    left join public.localization_values v on v.key_id=k.id and v.language_code='fil'
    left join lateral (
      select q1.suggested_text,q1.status
      from public.localization_queue q1
      where q1.translation_key=k.translation_key and q1.target_language='fil'
      order by q1.last_seen_at desc limit 1
    ) q on true
    where k.is_active=true
      and coalesce(v.status,'missing') <> 'approved'
      and (p_query is null or btrim(p_query)='' or k.translation_key ilike '%'||p_query||'%' or coalesce(k.source_text,'') ilike '%'||p_query||'%' or coalesce(v.translated_text,'') ilike '%'||p_query||'%')
  ), counted as (select count(*) total from base), paged as (
    select * from base order by module,translation_key
    limit greatest(1,least(coalesce(p_limit,25),50)) offset greatest(coalesce(p_offset,0),0)
  )
  select jsonb_build_object(
    'total',(select total from counted),
    'total_keys',(select count(*) from public.localization_keys where is_active=true),
    'approved_count',(select count(*) from public.localization_values v join public.localization_keys k on k.id=v.key_id where k.is_active=true and v.language_code='fil' and v.status='approved'),
    'rows',coalesce((select jsonb_agg(to_jsonb(paged)) from paged),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.save_fil_translation_batch(
  p_entries jsonb,
  p_action text default 'draft',
  p_actor_user_id text default null,
  p_session_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_key text;
  v_text text;
  v_action text:=lower(coalesce(p_action,'draft'));
  v_processed integer:=0;
begin
  if not public.petatoe_localization_can_edit(p_actor_user_id,p_session_token) then
    raise exception 'Localization edit permission denied' using errcode='42501';
  end if;
  if v_action not in ('draft','submit','approve') then raise exception 'Unsupported batch action'; end if;
  if v_action='approve' and not public.petatoe_localization_can_approve(p_actor_user_id,p_session_token) then
    raise exception 'Localization approval permission denied' using errcode='42501';
  end if;
  if jsonb_typeof(p_entries)<>'array' or jsonb_array_length(p_entries)>50 then raise exception 'Batch must contain 1 to 50 entries'; end if;

  for v_item in select value from jsonb_array_elements(p_entries)
  loop
    v_key:=btrim(coalesce(v_item->>'translation_key',''));
    v_text:=btrim(coalesce(v_item->>'translated_text',''));
    if v_key='' or v_text='' then continue; end if;
    if v_action='approve' then
      perform public.approve_localization_value(v_key,'fil',v_text,p_actor_user_id,p_session_token);
    else
      perform public.save_localization_draft(v_key,'fil',v_text,v_action='submit',p_actor_user_id,p_session_token);
    end if;
    v_processed:=v_processed+1;
  end loop;
  return jsonb_build_object('ok',true,'processed',v_processed,'action',v_action);
end;
$$;

revoke all on function public.get_fil_translation_workspace(text,integer,integer,text,text) from public;
revoke all on function public.save_fil_translation_batch(jsonb,text,text,text) from public;
grant execute on function public.get_fil_translation_workspace(text,integer,integer,text,text) to anon,authenticated;
grant execute on function public.save_fil_translation_batch(jsonb,text,text,text) to anon,authenticated;

commit;
