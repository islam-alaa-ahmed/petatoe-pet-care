-- PETATOE v9.0 Enterprise Security Suite
-- Phase S4.5.1 — Enterprise Session Foundation
-- Purpose: server-side session registry for login/logout/session lifecycle.

begin;

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  session_token_hash text not null,
  device_fingerprint_hash text,
  device_name text,
  platform text,
  browser text,
  ip_hash text,
  user_agent text,
  login_source text,
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  logout_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_sessions
  add column if not exists session_token_hash text,
  add column if not exists device_fingerprint_hash text,
  add column if not exists device_name text,
  add column if not exists platform text,
  add column if not exists browser text,
  add column if not exists ip_hash text,
  add column if not exists user_agent text,
  add column if not exists login_source text,
  add column if not exists last_activity_at timestamptz not null default now(),
  add column if not exists expires_at timestamptz not null default (now() + interval '12 hours'),
  add column if not exists revoked_at timestamptz,
  add column if not exists logout_reason text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists ux_user_sessions_token_hash
  on public.user_sessions(session_token_hash);

create index if not exists idx_user_sessions_user_active
  on public.user_sessions(user_id, revoked_at, expires_at, last_activity_at desc);

create index if not exists idx_user_sessions_device_hash
  on public.user_sessions(user_id, device_fingerprint_hash);

alter table public.user_sessions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_sessions'
      and policyname = 'user_sessions_service_role_all'
  ) then
    create policy user_sessions_service_role_all
      on public.user_sessions
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

grant all on table public.user_sessions to service_role;

comment on table public.user_sessions is 'PETATOE v9 S4.5.1 Enterprise server-side session registry. Stores hashes only; no raw session tokens.';
comment on column public.user_sessions.session_token_hash is 'Hash of client session token; raw token is never stored.';
comment on column public.user_sessions.ip_hash is 'Hash of request IP when available; no raw IP persistence in this phase.';

commit;
