-- PETATOE v9.0 Enterprise Security Suite
-- Phase S3.6 — Password Reset RPC Persistence Fix
-- Scope: Add a server-side RPC that updates legacy_payload.passwordHash exactly.
-- Safety: Non-destructive. Does not change existing login workflow or table schema.

begin;

create or replace function public.petatoe_reset_user_password_legacy(
  p_user_id uuid,
  p_password_hash jsonb,
  p_password_updated_at timestamptz default now()
)
returns table (
  user_id uuid,
  username text,
  saved_hash text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_password_hash is null or coalesce(p_password_hash ->> 'hash', '') = '' then
    raise exception 'p_password_hash.hash is required';
  end if;

  select coalesce(legacy_payload, '{}'::jsonb)
    into v_payload
  from public.app_users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'app user not found';
  end if;

  v_payload := jsonb_set(v_payload, '{passwordHash}', p_password_hash, true);
  v_payload := jsonb_set(v_payload, '{passwordUpdatedAt}', to_jsonb(p_password_updated_at::text), true);
  v_payload := jsonb_set(v_payload, '{passwordPolicy}', to_jsonb('reset_by_email_otp'::text), true);
  v_payload := jsonb_set(v_payload, '{passwordResetAt}', to_jsonb(p_password_updated_at::text), true);
  v_payload := jsonb_set(v_payload, '{mustChangePassword}', 'false'::jsonb, true);
  v_payload := jsonb_set(v_payload, '{bootstrapCredential}', 'false'::jsonb, true);
  v_payload := v_payload - 'password' - 'passwordPlain';

  update public.app_users au
     set legacy_payload = v_payload,
         updated_at = p_password_updated_at
   where au.id = p_user_id
   returning au.id, au.username, au.legacy_payload -> 'passwordHash' ->> 'hash', au.updated_at
      into user_id, username, saved_hash, updated_at;

  return next;
end;
$$;

revoke all on function public.petatoe_reset_user_password_legacy(uuid, jsonb, timestamptz) from public;
grant execute on function public.petatoe_reset_user_password_legacy(uuid, jsonb, timestamptz) to service_role;

comment on function public.petatoe_reset_user_password_legacy(uuid, jsonb, timestamptz)
is 'PETATOE v9 S3.6: server-side password reset persistence for legacy_payload.passwordHash.';

commit;
