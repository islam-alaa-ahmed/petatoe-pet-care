-- PETATOE v9 ELC Phase 4C
-- Safe language activation workflow. A non-default language can only be enabled
-- by a verified Super Admin after 100% of active keys have approved values.
begin;

create or replace function public.set_localization_language_enabled(
  p_language_code text,
  p_enabled boolean,
  p_actor_user_id text,
  p_session_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := lower(btrim(coalesce(p_language_code,'')));
  v_actor uuid;
  v_total bigint;
  v_approved bigint;
  v_is_default boolean;
begin
  v_actor := public.petatoe_localization_actor_id(p_actor_user_id,p_session_token);
  if v_actor is null or public.petatoe_localization_actor_role(p_actor_user_id,p_session_token) <> 'superadmin' then
    raise exception 'Super Admin authorization is required' using errcode='42501';
  end if;

  select is_default into v_is_default
  from public.localization_languages
  where code=v_code;
  if not found then raise exception 'Language not found'; end if;
  if v_is_default and not p_enabled then raise exception 'The default language cannot be disabled'; end if;

  select count(*) into v_total from public.localization_keys where is_active=true;
  select count(*) into v_approved
  from public.localization_values v
  join public.localization_keys k on k.id=v.key_id and k.is_active=true
  where v.language_code=v_code and v.status='approved' and nullif(btrim(v.translated_text),'') is not null;

  if p_enabled and v_total>0 and v_approved<v_total then
    raise exception 'Language activation requires 100%% approved coverage (%/% approved)',v_approved,v_total using errcode='check_violation';
  end if;

  update public.localization_languages
  set is_enabled=p_enabled,updated_at=now()
  where code=v_code;

  return jsonb_build_object(
    'language_code',v_code,
    'is_enabled',p_enabled,
    'approved_count',v_approved,
    'total_keys',v_total,
    'coverage_percent',case when v_total=0 then 0 else round((v_approved::numeric/v_total::numeric)*100,2) end,
    'updated_by',v_actor
  );
end;
$$;

revoke all on function public.set_localization_language_enabled(text,boolean,text,text) from public;
grant execute on function public.set_localization_language_enabled(text,boolean,text,text) to anon, authenticated, service_role;

commit;
