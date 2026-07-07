-- PETATOE v8.0.3 Console Fix — system_settings RLS policy
-- Run this once in Supabase SQL Editor if Console still shows:
-- "new row violates row-level security policy for table system_settings"
-- This is non-destructive and does not DROP/DELETE/TRUNCATE data.

alter table if exists public.system_settings enable row level security;

-- Allow the browser client to read system settings used by PETATOE UI.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'system_settings'
      and policyname = 'petatoe_system_settings_select_client'
  ) then
    create policy petatoe_system_settings_select_client
      on public.system_settings
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;

-- Allow PETATOE app client to upsert system settings.
-- Keep this only if PETATOE is an app-level-auth GitHub Pages frontend using the publishable key.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'system_settings'
      and policyname = 'petatoe_system_settings_write_client'
  ) then
    create policy petatoe_system_settings_write_client
      on public.system_settings
      for all
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;
