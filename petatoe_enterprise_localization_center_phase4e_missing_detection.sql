-- PETATOE v9 Enterprise Localization Center - Phase 4E
-- Safe manual discovery of missing UI translations. No business data is read or changed.

begin;

alter table public.localization_queue
  add column if not exists context jsonb not null default '{}'::jsonb,
  add column if not exists discovered_by uuid;

create or replace function public.register_localization_discoveries(
  p_items jsonb,
  p_actor_user_id text,
  p_session_token text
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid;
  v_role text;
  v_item jsonb;
  v_key text;
  v_source_language text;
  v_source_text text;
  v_module text;
  v_context jsonb;
  v_key_id bigint;
  v_language record;
  v_processed integer := 0;
  v_keys_created integer := 0;
  v_queue_created integer := 0;
  v_queue_updated integer := 0;
  v_inserted boolean;
begin
  v_role := public.petatoe_localization_actor_role(p_actor_user_id,p_session_token);
  if v_role not in ('superadmin','admin') then
    raise exception 'Localization discovery permission denied' using errcode='42501';
  end if;
  v_actor := public.petatoe_localization_actor_id(p_actor_user_id,p_session_token);
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 200 then
    raise exception 'Discovery payload must be an array of at most 200 entries' using errcode='22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_key := left(btrim(coalesce(v_item->>'translation_key','')),180);
    v_source_language := lower(btrim(coalesce(v_item->>'source_language','')));
    v_source_text := btrim(coalesce(v_item->>'source_text',''));
    v_module := left(regexp_replace(lower(btrim(coalesce(v_item->>'module','runtime'))),'[^a-z0-9_-]+','-','g'),80);
    v_context := coalesce(v_item->'context','{}'::jsonb);
    if v_key='' or v_source_language not in ('ar','en','fil') or char_length(v_source_text)<2 or char_length(v_source_text)>240 then
      continue;
    end if;
    if v_source_text ~* '^(https?://|www\.)' or v_source_text ~ '^[0-9[:space:].,:/+-]+$' then
      continue;
    end if;
    v_processed := v_processed + 1;

    insert into public.localization_keys(translation_key,module,source_text,description,is_system,is_active,updated_at)
    values(v_key,coalesce(nullif(v_module,''),'runtime'),v_source_text,'Discovered from PETATOE runtime UI',true,true,now())
    on conflict(translation_key) do update set
      module=coalesce(nullif(public.localization_keys.module,''),excluded.module),
      source_text=coalesce(public.localization_keys.source_text,excluded.source_text),
      updated_at=now()
    returning id into v_key_id;
    if found then v_keys_created := v_keys_created + 1; end if;

    insert into public.localization_values(key_id,language_code,translated_text,status,version,approved_by,approved_at,updated_at)
    select v_key_id,v_source_language,v_source_text,'approved',1,v_actor,now(),now()
    where exists(select 1 from public.localization_languages where code=v_source_language)
    on conflict(key_id,language_code) do nothing;

    for v_language in
      select code from public.localization_languages where code<>v_source_language
    loop
      insert into public.localization_queue(translation_key,source_language,source_text,target_language,module,status,occurrence_count,last_seen_at,context,discovered_by)
      values(v_key,v_source_language,v_source_text,v_language.code,coalesce(nullif(v_module,''),'runtime'),'pending',1,now(),v_context,v_actor)
      on conflict(source_text,source_language,target_language,module) do update set
        translation_key=coalesce(public.localization_queue.translation_key,excluded.translation_key),
        occurrence_count=public.localization_queue.occurrence_count+1,
        last_seen_at=now(),
        context=public.localization_queue.context||excluded.context,
        discovered_by=coalesce(public.localization_queue.discovered_by,excluded.discovered_by)
      returning (xmax=0) into v_inserted;
      if v_inserted then v_queue_created:=v_queue_created+1; else v_queue_updated:=v_queue_updated+1; end if;
    end loop;
  end loop;

  return jsonb_build_object('processed',v_processed,'keys_created_or_seen',v_keys_created,'queue_created',v_queue_created,'queue_updated',v_queue_updated);
end;
$$;

revoke all on function public.register_localization_discoveries(jsonb,text,text) from public;
grant execute on function public.register_localization_discoveries(jsonb,text,text) to anon, authenticated;

commit;
