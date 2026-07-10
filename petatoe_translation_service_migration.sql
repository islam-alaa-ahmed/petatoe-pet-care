-- PETATOE Enterprise Translation Service — server cache and review queue
create extension if not exists pgcrypto;

create table if not exists public.translation_cache (
  id uuid primary key default gen_random_uuid(),
  source_language text not null check (source_language in ('ar','en')),
  target_language text not null check (target_language in ('ar','en')),
  source_hash text not null,
  source_text text not null,
  translated_text text not null,
  provider text not null default 'remote',
  glossary_version text,
  status text not null default 'machine' check (status in ('machine','approved','rejected')),
  hit_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  unique(source_language,target_language,source_hash)
);

create index if not exists translation_cache_lookup_idx on public.translation_cache(source_language,target_language,source_hash);
create index if not exists translation_cache_status_idx on public.translation_cache(status,updated_at desc);

alter table public.translation_cache enable row level security;
-- No browser policies by design. Only the Edge Function service role may read/write this table.
revoke all on public.translation_cache from anon, authenticated;

create or replace function public.touch_translation_cache_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists trg_translation_cache_updated_at on public.translation_cache;
create trigger trg_translation_cache_updated_at
before update on public.translation_cache
for each row execute function public.touch_translation_cache_updated_at();
