-- PETATOE v9 ELC Phase 4D
-- Secure localization backup/export and audited batch import.
-- Run after Phase 4B.2 and Phase 4C.
begin;

create or replace function public.export_localization_package(
  p_actor_user_id text,
  p_session_token text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_actor uuid;
begin
  v_actor := public.petatoe_localization_actor_id(p_actor_user_id,p_session_token);
  v_role := public.petatoe_localization_actor_role(p_actor_user_id,p_session_token);
  if v_actor is null or v_role not in ('superadmin','admin') then
    raise exception 'Localization export permission denied' using errcode='42501';
  end if;

  return jsonb_build_object(
    'schema','petatoe.localization.package',
    'schema_version',1,
    'generated_at',now(),
    'generated_by',v_actor,
    'languages',coalesce((
      select jsonb_agg(jsonb_build_object(
        'code',code,'name',name,'english_name',english_name,'direction',direction,
        'locale',locale,'is_enabled',is_enabled,'is_default',is_default,'sort_order',sort_order
      ) order by sort_order,code)
      from public.localization_languages
    ),'[]'::jsonb),
    'entries',coalesce((
      select jsonb_agg(jsonb_build_object(
        'translation_key',k.translation_key,
        'module',k.module,
        'source_text',k.source_text,
        'description',k.description,
        'is_system',k.is_system,
        'is_active',k.is_active,
        'language_code',v.language_code,
        'translated_text',v.translated_text,
        'status',v.status,
        'version',v.version,
        'approved_at',v.approved_at,
        'updated_at',v.updated_at
      ) order by k.translation_key,v.language_code)
      from public.localization_values v
      join public.localization_keys k on k.id=v.key_id
    ),'[]'::jsonb)
  );
end;
$$;

create or replace function public.import_localization_package_batch(
  p_entries jsonb,
  p_import_mode text default 'draft',
  p_source_name text default 'browser_import',
  p_actor_user_id text default null,
  p_session_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_mode text := lower(btrim(coalesce(p_import_mode,'draft')));
  v_source text := left(coalesce(nullif(btrim(p_source_name),''),'browser_import'),180);
  v_item jsonb;
  v_key text;
  v_module text;
  v_source_text text;
  v_language text;
  v_text text;
  v_key_id bigint;
  v_value_id bigint;
  v_old_text text;
  v_old_status text;
  v_processed integer := 0;
  v_created integer := 0;
  v_updated integer := 0;
  v_skipped integer := 0;
begin
  v_actor := public.petatoe_localization_actor_id(p_actor_user_id,p_session_token);
  if v_actor is null or public.petatoe_localization_actor_role(p_actor_user_id,p_session_token) <> 'superadmin' then
    raise exception 'Super Admin authorization is required for localization import' using errcode='42501';
  end if;
  if v_mode not in ('draft','approved') then
    raise exception 'Invalid import mode';
  end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' then
    raise exception 'Import entries must be a JSON array';
  end if;
  if jsonb_array_length(p_entries) > 200 then
    raise exception 'A single import batch cannot exceed 200 records';
  end if;

  for v_item in select value from jsonb_array_elements(p_entries)
  loop
    v_key := left(btrim(coalesce(v_item->>'translation_key','')),500);
    v_module := left(coalesce(nullif(btrim(v_item->>'module'),''),'global'),120);
    v_source_text := left(coalesce(v_item->>'source_text',''),12000);
    v_language := lower(left(btrim(coalesce(v_item->>'language_code','')),16));
    v_text := left(btrim(coalesce(v_item->>'translated_text','')),12000);

    if v_key='' or v_language='' or v_text='' or not exists(select 1 from public.localization_languages where code=v_language) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    insert into public.localization_keys(translation_key,module,source_text,is_system,is_active,created_at,updated_at)
    values(v_key,v_module,nullif(v_source_text,''),true,true,now(),now())
    on conflict (translation_key) do update set
      module=case when public.localization_keys.module='global' then excluded.module else public.localization_keys.module end,
      source_text=coalesce(public.localization_keys.source_text,excluded.source_text),
      updated_at=now()
    returning id into v_key_id;

    select id,translated_text,status
      into v_value_id,v_old_text,v_old_status
    from public.localization_values
    where key_id=v_key_id and language_code=v_language
    for update;

    if v_value_id is null then
      insert into public.localization_values(
        key_id,language_code,translated_text,status,version,approved_by,approved_at,created_at,updated_at
      ) values(
        v_key_id,v_language,v_text,v_mode,1,
        case when v_mode='approved' then v_actor else null end,
        case when v_mode='approved' then now() else null end,
        now(),now()
      ) returning id into v_value_id;
      v_created := v_created + 1;
    elsif v_old_text is not distinct from v_text and v_old_status = v_mode then
      v_skipped := v_skipped + 1;
      continue;
    else
      update public.localization_values set
        translated_text=v_text,
        status=v_mode,
        version=version+1,
        approved_by=case when v_mode='approved' then v_actor else null end,
        approved_at=case when v_mode='approved' then now() else null end,
        updated_at=now()
      where id=v_value_id;
      v_updated := v_updated + 1;
    end if;

    insert into public.localization_history(
      value_id,translation_key,language_code,old_text,new_text,action,changed_by,changed_at
    ) values(
      v_value_id,v_key,v_language,v_old_text,v_text,
      'import_'||v_mode||' ['||v_source||']',v_actor,now()
    );

    update public.localization_queue set
      suggested_text=v_text,
      status=case when v_mode='approved' then 'approved' else 'reviewed' end,
      reviewed_by=v_actor,
      reviewed_at=now(),
      last_seen_at=now()
    where translation_key=v_key and target_language=v_language;

    v_processed := v_processed + 1;
  end loop;

  return jsonb_build_object(
    'ok',true,
    'processed',v_processed,
    'created',v_created,
    'updated',v_updated,
    'skipped',v_skipped,
    'mode',v_mode,
    'source_name',v_source
  );
end;
$$;

revoke all on function public.export_localization_package(text,text) from public;
revoke all on function public.import_localization_package_batch(jsonb,text,text,text,text) from public;
grant execute on function public.export_localization_package(text,text) to anon,authenticated,service_role;
grant execute on function public.import_localization_package_batch(jsonb,text,text,text,text) to anon,authenticated,service_role;

commit;
