-- PETATOE v9 ELC Phase 3 - Secure approved translation runtime bundle
-- Exposes approved UI translations only; base tables remain protected by RLS.

begin;

create or replace function public.get_localization_bundle(p_language_codes text[] default array['ar','en']::text[])
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with requested as (
    select l.code
    from public.localization_languages l
    where l.is_enabled = true
      and l.code = any(coalesce(p_language_codes,array['ar','en']::text[]))
  ), values_by_language as (
    select
      v.language_code,
      coalesce(jsonb_object_agg(k.translation_key,v.translated_text order by k.translation_key),'{}'::jsonb) as values,
      coalesce(max(v.version),1) as version
    from public.localization_values v
    join public.localization_keys k on k.id=v.key_id and k.is_active=true
    join requested r on r.code=v.language_code
    where v.status='approved'
    group by v.language_code
  )
  select coalesce(jsonb_object_agg(language_code,jsonb_build_object('version',version,'values',values)),'{}'::jsonb)
  from values_by_language;
$$;

revoke all on function public.get_localization_bundle(text[]) from public;
grant execute on function public.get_localization_bundle(text[]) to anon, authenticated;

comment on function public.get_localization_bundle(text[]) is
'ELC runtime endpoint returning enabled approved UI translations only. Safe for PETATOE public client use.';

commit;
