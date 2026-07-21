-- PETATOE Mobile Enterprise UI v10 — S1 Native Biometric Passkey Login
-- Stores public-key credentials and short-lived WebAuthn challenges only.

create extension if not exists pgcrypto;

create table if not exists public.passkey_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  transports jsonb not null default '[]'::jsonb,
  device_type text,
  backed_up boolean not null default false,
  device_name text,
  user_agent text,
  last_used_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists passkey_credentials_user_active_idx
  on public.passkey_credentials(user_id, revoked_at, created_at desc);

create table if not exists public.passkey_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  purpose text not null check (purpose in ('registration', 'authentication')),
  challenge text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, purpose)
);

create index if not exists passkey_challenges_expiry_idx
  on public.passkey_challenges(expires_at);

alter table public.passkey_credentials enable row level security;
alter table public.passkey_credentials force row level security;
alter table public.passkey_challenges enable row level security;
alter table public.passkey_challenges force row level security;

drop policy if exists passkey_credentials_deny_direct_client_access on public.passkey_credentials;
create policy passkey_credentials_deny_direct_client_access
on public.passkey_credentials for all to anon, authenticated
using (false) with check (false);

drop policy if exists passkey_challenges_deny_direct_client_access on public.passkey_challenges;
create policy passkey_challenges_deny_direct_client_access
on public.passkey_challenges for all to anon, authenticated
using (false) with check (false);

grant all on table public.passkey_credentials to service_role;
grant all on table public.passkey_challenges to service_role;

-- Direct browser access is denied. Only the Edge Function service-role can read/write these tables.

comment on table public.passkey_credentials is
  'PETATOE WebAuthn public-key credentials. No passwords, Face ID images, or biometric templates are stored.';
comment on table public.passkey_challenges is
  'Short-lived one-time WebAuthn challenges used by the PETATOE security Edge Function.';
