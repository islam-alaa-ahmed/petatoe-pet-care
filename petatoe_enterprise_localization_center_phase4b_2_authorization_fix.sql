-- PETATOE v9 ELC Phase 4B.2
-- Fixes actor identity resolution for PETATOE custom sessions and Localization Center RPCs.
-- Safe to run after Phase 4B.
begin;

create extension if not exists pgcrypto;

create or replace function public.petatoe_localization_actor_id(
  p_actor_identity text,
  p_session_token text
)
returns uuid
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_identity text := btrim(coalesce(p_actor_identity,''));
  v_expected_hash text;
begin
  if v_identity = '' or nullif(btrim(coalesce(p_session_token,'')),'') is null then
    return null;
  end if;

  begin
    v_user_id := v_identity::uuid;
  exception when others then
    select au.id into v_user_id
    from public.app_users au
    where lower(coalesce(au.username,'')) = lower(v_identity)
       or lower(coalesce(au.email, au.legacy_payload->>'email','')) = lower(v_identity)
    order by au.id
    limit 1;
  end;

  if v_user_id is null then return null; end if;

  v_expected_hash := encode(
    digest(p_session_token || ':' || v_user_id::text || ':enterprise-session:v1', 'sha256'),
    'hex'
  );

  if exists (
    select 1 from public.user_sessions us
    join public.app_users au on au.id = us.user_id
    where us.user_id = v_user_id
      and us.session_token_hash = v_expected_hash
      and us.revoked_at is null
      and us.expires_at > now()
      and lower(coalesce(au.status,'active')) = 'active'
  ) then
    return v_user_id;
  end if;
  return null;
end;
$$;

create or replace function public.petatoe_localization_actor_role(
  p_actor_user_id text,
  p_session_token text
)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_role text;
begin
  v_user_id := public.petatoe_localization_actor_id(p_actor_user_id,p_session_token);
  if v_user_id is null then return 'viewer'; end if;

  select lower(coalesce(au.role_code, au.legacy_payload->>'role_code', au.legacy_payload->>'role', 'viewer'))
    into v_role
  from public.app_users au
  where au.id = v_user_id;

  v_role := coalesce(nullif(v_role,''), 'viewer');
  if v_role in ('super_admin','super-admin') then v_role := 'superadmin'; end if;
  return v_role;
end;
$$;

create or replace function public.petatoe_localization_can_edit(
  p_actor_user_id text,
  p_session_token text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.petatoe_localization_actor_role(p_actor_user_id,p_session_token) in ('superadmin','admin');
$$;

create or replace function public.petatoe_localization_can_approve(
  p_actor_user_id text,
  p_session_token text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.petatoe_localization_actor_role(p_actor_user_id,p_session_token) = 'superadmin';
$$;

create or replace function public.get_localization_dashboard(
  p_actor_user_id text,
  p_session_token text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_role text;
begin
  v_role := public.petatoe_localization_actor_role(p_actor_user_id,p_session_token);
  if v_role = 'viewer' then
    raise exception 'Localization session is invalid or expired' using errcode='42501';
  end if;
  return jsonb_build_object(
    'total_keys', (select count(*) from public.localization_keys where is_active = true),
    'approved_values', (select count(*) from public.localization_values where status = 'approved'),
    'pending_queue', (select count(*) from public.localization_queue where status = 'pending'),
    'actor_role', v_role,
    'can_edit', v_role in ('superadmin','admin'),
    'can_approve', v_role='superadmin',
    'languages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', l.code,'name', l.name,'english_name', l.english_name,
        'direction', l.direction,'locale', l.locale,'is_enabled', l.is_enabled,
        'is_default', l.is_default,'approved_count', coalesce(v.approved_count,0),
        'pending_count', coalesce(q.pending_count,0)
      ) order by l.sort_order, l.code)
      from public.localization_languages l
      left join (
        select language_code, count(*) approved_count
        from public.localization_values where status='approved' group by language_code
      ) v on v.language_code=l.code
      left join (
        select target_language language_code, count(*) pending_count
        from public.localization_queue where status='pending' group by target_language
      ) q on q.language_code=l.code
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.search_localization_entries(
  p_query text default null,
  p_language_code text default null,
  p_status text default null,
  p_limit integer default 50,
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
  with languages as (
    select code from public.localization_languages
    where p_language_code is null or code=p_language_code
  ), base as (
    select k.translation_key,k.module,k.source_text,k.description,l.code language_code,
           v.id value_id,v.translated_text,v.version,v.updated_at,
           case when v.id is null then 'missing' else v.status end status,
           q.id queue_id,q.suggested_text,q.status queue_status
    from public.localization_keys k
    cross join languages l
    left join public.localization_values v on v.key_id=k.id and v.language_code=l.code
    left join lateral (
      select q1.id,q1.suggested_text,q1.status
      from public.localization_queue q1
      where q1.translation_key=k.translation_key and q1.target_language=l.code
      order by q1.last_seen_at desc limit 1
    ) q on true
    where k.is_active=true
      and (p_query is null or btrim(p_query)='' or k.translation_key ilike '%'||p_query||'%' or coalesce(k.source_text,'') ilike '%'||p_query||'%' or coalesce(v.translated_text,'') ilike '%'||p_query||'%')
      and (p_status is null or p_status='' or (p_status='missing' and v.id is null) or (p_status<>'missing' and v.status=p_status))
  ), counted as (select count(*) total from base), paged as (
    select * from base order by translation_key,language_code
    limit greatest(1,least(coalesce(p_limit,50),200)) offset greatest(coalesce(p_offset,0),0)
  )
  select jsonb_build_object('total',(select total from counted),'rows',coalesce((select jsonb_agg(to_jsonb(paged)) from paged),'[]'::jsonb)) into v_result;
  return v_result;
end;
$$;

create or replace function public.get_localization_entry(
  p_translation_key text,
  p_language_code text,
  p_actor_user_id text,
  p_session_token text
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare v_result jsonb;
begin
  if not public.petatoe_localization_can_edit(p_actor_user_id,p_session_token) then
    raise exception 'Localization edit permission denied' using errcode='42501';
  end if;
  select jsonb_build_object(
    'translation_key',k.translation_key,'module',k.module,'source_text',k.source_text,'description',k.description,
    'language_code',l.code,'language_name',l.name,'direction',l.direction,
    'value_id',v.id,'translated_text',v.translated_text,'status',coalesce(v.status,'missing'),'version',coalesce(v.version,0),
    'suggested_text',q.suggested_text,
    'history',coalesce((select jsonb_agg(jsonb_build_object('action',h.action,'old_text',h.old_text,'new_text',h.new_text,'changed_at',h.changed_at,'changed_by',h.changed_by) order by h.changed_at desc) from public.localization_history h where h.translation_key=k.translation_key and h.language_code=l.code),'[]'::jsonb)
  ) into v_result
  from public.localization_keys k
  join public.localization_languages l on l.code=p_language_code
  left join public.localization_values v on v.key_id=k.id and v.language_code=l.code
  left join lateral (select suggested_text from public.localization_queue where translation_key=k.translation_key and target_language=l.code order by last_seen_at desc limit 1) q on true
  where k.translation_key=p_translation_key and k.is_active=true;
  if v_result is null then raise exception 'Translation entry not found'; end if;
  return v_result;
end;
$$;

create or replace function public.save_localization_draft(
  p_translation_key text,p_language_code text,p_translated_text text,p_submit boolean default false,
  p_actor_user_id text default null,p_session_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_key_id bigint; v_value_id bigint; v_old text; v_new_status text; v_actor uuid;
begin
  if not public.petatoe_localization_can_edit(p_actor_user_id,p_session_token) then raise exception 'Localization edit permission denied' using errcode='42501'; end if;
  v_actor:=public.petatoe_localization_actor_id(p_actor_user_id,p_session_token);
  if nullif(btrim(p_translated_text),'') is null then raise exception 'Translation text is required'; end if;
  select id into v_key_id from public.localization_keys where translation_key=p_translation_key and is_active=true;
  if v_key_id is null then raise exception 'Translation key not found'; end if;
  if not exists(select 1 from public.localization_languages where code=p_language_code) then raise exception 'Language not found'; end if;
  select id,translated_text into v_value_id,v_old from public.localization_values where key_id=v_key_id and language_code=p_language_code for update;
  v_new_status:=case when p_submit then 'pending' else 'draft' end;
  if v_value_id is null then
    insert into public.localization_values(key_id,language_code,translated_text,status,version,created_at,updated_at)
    values(v_key_id,p_language_code,btrim(p_translated_text),v_new_status,1,now(),now()) returning id into v_value_id;
  else
    update public.localization_values set translated_text=btrim(p_translated_text),status=v_new_status,version=version+1,approved_by=null,approved_at=null,updated_at=now() where id=v_value_id;
  end if;
  insert into public.localization_history(value_id,translation_key,language_code,old_text,new_text,action,changed_by)
  values(v_value_id,p_translation_key,p_language_code,v_old,btrim(p_translated_text),case when p_submit then 'submitted' else 'draft_saved' end,v_actor);
  update public.localization_queue set suggested_text=btrim(p_translated_text),status=case when p_submit then 'reviewed' else status end,reviewed_by=v_actor,reviewed_at=case when p_submit then now() else reviewed_at end,last_seen_at=now()
  where translation_key=p_translation_key and target_language=p_language_code;
  return jsonb_build_object('ok',true,'value_id',v_value_id,'status',v_new_status);
end;
$$;

create or replace function public.approve_localization_value(
  p_translation_key text,p_language_code text,p_translated_text text default null,
  p_actor_user_id text default null,p_session_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_key_id bigint; v_value_id bigint; v_old text; v_text text; v_actor uuid;
begin
  if not public.petatoe_localization_can_approve(p_actor_user_id,p_session_token) then raise exception 'Localization approval permission denied' using errcode='42501'; end if;
  v_actor:=public.petatoe_localization_actor_id(p_actor_user_id,p_session_token);
  select id into v_key_id from public.localization_keys where translation_key=p_translation_key and is_active=true;
  if v_key_id is null then raise exception 'Translation key not found'; end if;
  select id,translated_text into v_value_id,v_old from public.localization_values where key_id=v_key_id and language_code=p_language_code for update;
  v_text:=coalesce(nullif(btrim(p_translated_text),''),v_old);
  if v_text is null then raise exception 'Translation text is required'; end if;
  if v_value_id is null then
    insert into public.localization_values(key_id,language_code,translated_text,status,version,approved_by,approved_at,created_at,updated_at)
    values(v_key_id,p_language_code,v_text,'approved',1,v_actor,now(),now(),now()) returning id into v_value_id;
  else
    update public.localization_values set translated_text=v_text,status='approved',version=version+1,approved_by=v_actor,approved_at=now(),updated_at=now() where id=v_value_id;
  end if;
  insert into public.localization_history(value_id,translation_key,language_code,old_text,new_text,action,changed_by)
  values(v_value_id,p_translation_key,p_language_code,v_old,v_text,'approved',v_actor);
  update public.localization_queue set suggested_text=v_text,status='approved',reviewed_by=v_actor,reviewed_at=now(),last_seen_at=now() where translation_key=p_translation_key and target_language=p_language_code;
  return jsonb_build_object('ok',true,'value_id',v_value_id,'status','approved');
end;
$$;

create or replace function public.reject_localization_value(
  p_translation_key text,p_language_code text,p_reason text default null,
  p_actor_user_id text default null,p_session_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_key_id bigint; v_value_id bigint; v_old text; v_actor uuid;
begin
  if not public.petatoe_localization_can_approve(p_actor_user_id,p_session_token) then raise exception 'Localization approval permission denied' using errcode='42501'; end if;
  v_actor:=public.petatoe_localization_actor_id(p_actor_user_id,p_session_token);
  select id into v_key_id from public.localization_keys where translation_key=p_translation_key and is_active=true;
  if v_key_id is null then raise exception 'Translation key not found'; end if;
  select id,translated_text into v_value_id,v_old from public.localization_values where key_id=v_key_id and language_code=p_language_code for update;
  if v_value_id is not null then update public.localization_values set status='rejected',approved_by=null,approved_at=null,version=version+1,updated_at=now() where id=v_value_id; end if;
  insert into public.localization_history(value_id,translation_key,language_code,old_text,new_text,action,changed_by)
  values(v_value_id,p_translation_key,p_language_code,v_old,v_old,'rejected'||case when nullif(btrim(p_reason),'') is null then '' else ': '||btrim(p_reason) end,v_actor);
  update public.localization_queue set status='rejected',reviewed_by=v_actor,reviewed_at=now(),last_seen_at=now() where translation_key=p_translation_key and target_language=p_language_code;
  return jsonb_build_object('ok',true,'value_id',v_value_id,'status','rejected');
end;
$$;

revoke all on function public.petatoe_localization_actor_id(text,text) from public;
revoke all on function public.petatoe_localization_actor_role(text,text) from public;
revoke all on function public.petatoe_localization_can_edit(text,text) from public;
revoke all on function public.petatoe_localization_can_approve(text,text) from public;
revoke all on function public.get_localization_dashboard(text,text) from public;
revoke all on function public.search_localization_entries(text,text,text,integer,integer,text,text) from public;
revoke all on function public.get_localization_entry(text,text,text,text) from public;
revoke all on function public.save_localization_draft(text,text,text,boolean,text,text) from public;
revoke all on function public.approve_localization_value(text,text,text,text,text) from public;
revoke all on function public.reject_localization_value(text,text,text,text,text) from public;

grant execute on function public.get_localization_dashboard(text,text) to anon,authenticated;
grant execute on function public.search_localization_entries(text,text,text,integer,integer,text,text) to anon,authenticated;
grant execute on function public.get_localization_entry(text,text,text,text) to anon,authenticated;
grant execute on function public.save_localization_draft(text,text,text,boolean,text,text) to anon,authenticated;
grant execute on function public.approve_localization_value(text,text,text,text,text) to anon,authenticated;
grant execute on function public.reject_localization_value(text,text,text,text,text) to anon,authenticated;

commit;
