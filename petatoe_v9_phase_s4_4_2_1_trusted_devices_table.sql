-- PETATOE v9.0 Phase S4.4.2.1
-- Trusted Devices persistence table verification/creation.
-- Run this in Supabase SQL Editor before testing the Trusted Devices screen.

begin;

create or replace function public.petatoe_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  device_fingerprint_hash text not null,
  device_name text,
  platform text,
  browser text,
  trusted_until timestamptz not null,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  created_ip inet,
  last_ip inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trusted_devices_unique_fingerprint_per_user unique (user_id, device_fingerprint_hash)
);

alter table public.trusted_devices
  add column if not exists device_name text,
  add column if not exists platform text,
  add column if not exists browser text,
  add column if not exists trusted_until timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_reason text,
  add column if not exists created_ip inet,
  add column if not exists last_ip inet,
  add column if not exists user_agent text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists trusted_devices_user_fingerprint_uidx
  on public.trusted_devices(user_id, device_fingerprint_hash);

create index if not exists idx_trusted_devices_user_id on public.trusted_devices(user_id);
create index if not exists idx_trusted_devices_fingerprint_hash on public.trusted_devices(device_fingerprint_hash);
create index if not exists idx_trusted_devices_trusted_until on public.trusted_devices(trusted_until);
create index if not exists idx_trusted_devices_active on public.trusted_devices(user_id, trusted_until)
where revoked_at is null;

drop trigger if exists trg_trusted_devices_updated_at on public.trusted_devices;
create trigger trg_trusted_devices_updated_at
before update on public.trusted_devices
for each row
execute function public.petatoe_set_updated_at();

alter table public.trusted_devices enable row level security;
alter table public.trusted_devices force row level security;

drop policy if exists trusted_devices_deny_direct_client_access on public.trusted_devices;
create policy trusted_devices_deny_direct_client_access
on public.trusted_devices
for all
to anon, authenticated
using (false)
with check (false);

grant all on table public.trusted_devices to service_role;

comment on table public.trusted_devices is 'PETATOE v9 S4.4.2.1: trusted devices used by Edge Functions only; no direct frontend access.';

commit;
