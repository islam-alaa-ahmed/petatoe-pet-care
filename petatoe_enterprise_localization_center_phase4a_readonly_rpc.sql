-- PETATOE v9 ELC Phase 4A - Read-only dashboard RPCs
begin;

create or replace function public.get_localization_dashboard()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total_keys', (select count(*) from public.localization_keys where is_active = true),
    'approved_values', (select count(*) from public.localization_values where status = 'approved'),
    'pending_queue', (select count(*) from public.localization_queue where status = 'pending'),
    'languages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', l.code,
        'name', l.name,
        'english_name', l.english_name,
        'direction', l.direction,
        'locale', l.locale,
        'is_enabled', l.is_enabled,
        'is_default', l.is_default,
        'approved_count', coalesce(v.approved_count,0),
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
$$;

create or replace function public.search_localization_entries(
  p_query text default null,
  p_language_code text default null,
  p_status text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with languages as (
    select code from public.localization_languages
    where p_language_code is null or code=p_language_code
  ), base as (
    select k.translation_key,k.module,k.source_text,l.code language_code,
           v.translated_text,
           case when v.id is null then 'missing' else v.status end status
    from public.localization_keys k
    cross join languages l
    left join public.localization_values v on v.key_id=k.id and v.language_code=l.code
    where k.is_active=true
      and (p_query is null or btrim(p_query)='' or k.translation_key ilike '%'||p_query||'%' or coalesce(k.source_text,'') ilike '%'||p_query||'%' or coalesce(v.translated_text,'') ilike '%'||p_query||'%')
      and (p_status is null or p_status='' or (p_status='missing' and v.id is null) or (p_status<>'missing' and v.status=p_status))
  ), counted as (select count(*) total from base), paged as (
    select * from base order by translation_key,language_code limit greatest(1,least(coalesce(p_limit,50),200)) offset greatest(coalesce(p_offset,0),0)
  )
  select jsonb_build_object('total',(select total from counted),'rows',coalesce((select jsonb_agg(to_jsonb(paged)) from paged),'[]'::jsonb));
$$;

revoke all on function public.get_localization_dashboard() from public, anon;
revoke all on function public.search_localization_entries(text,text,text,integer,integer) from public, anon;
grant execute on function public.get_localization_dashboard() to authenticated;
grant execute on function public.search_localization_entries(text,text,text,integer,integer) to authenticated;

commit;
