-- PETATOE Phase 0.5 — READ-ONLY live Supabase verification
-- Safe: SELECT statements only. Run in Supabase SQL Editor and export results.

-- 1) Expected application tables and whether they exist.
with expected(name) as (
  values
    ('app_user_permissions'),('app_users'),('audit_logs'),('payroll_employees'),
    ('roles'),('sales_records'),('system_settings'),('translation_cache'),
    ('warehouse_items'),('warehouse_settings'),('warehouse_transactions'),
    ('localization_history'),('localization_keys'),('localization_languages'),
    ('localization_queue'),('localization_values'),('passkey_challenges'),
    ('passkey_credentials'),('trusted_devices'),('user_sessions')
)
select e.name as expected_table,
       (t.table_name is not null) as exists_in_public
from expected e
left join information_schema.tables t
  on t.table_schema='public' and t.table_name=e.name
order by e.name;

-- 2) RLS status for all public application tables.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
order by c.relname;

-- 3) Policies currently applied.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public'
order by tablename, policyname;

-- 4) Expected RPCs and whether they exist.
with expected(name) as (
  values
    ('approve_localization_value'),('export_localization_package'),
    ('get_fil_translation_workspace'),('get_localization_bundle'),
    ('get_localization_dashboard'),('get_localization_entry'),
    ('import_localization_package_batch'),('petatoe_replace_all_sales_records'),
    ('petatoe_replace_sales_invoice'),('register_localization_discoveries'),
    ('reject_localization_value'),('save_fil_translation_batch'),
    ('save_localization_draft'),('search_localization_entries'),
    ('set_localization_language_enabled'),('petatoe_reset_user_password_legacy')
)
select e.name as expected_rpc,
       exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname=e.name) as exists_in_public
from expected e
order by e.name;

-- 5) Triggers on application tables.
select event_object_table as table_name, trigger_name, event_manipulation, action_timing
from information_schema.triggers
where trigger_schema='public'
order by event_object_table, trigger_name;
