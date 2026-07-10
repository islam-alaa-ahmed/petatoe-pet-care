-- PETATOE v9.0 Enterprise Security Suite
-- Phase S4.5.7 — Security Audit Trail Event Compatibility
-- Purpose: allow Enterprise session/MFA/trusted-device events to be persisted in login_history.
-- Safety: non-destructive; does not delete or update existing rows.

begin;

alter table if exists public.login_history
  drop constraint if exists login_history_event_type_check;

alter table if exists public.login_history
  add constraint login_history_event_type_check check (
    event_type in (
      'login',
      'logout',
      'failed_login',
      'mfa_challenge',
      'mfa_verify',
      'password_reset_requested',
      'password_reset_verified',
      'password_reset_completed',
      'trusted_device_added',
      'trusted_device_used',
      'trusted_device_revoked',
      'account_locked',
      'account_unlocked',
      'session_started',
      'session_ended',
      'session_revoked',
      'sessions_revoked_all',
      'sessions_force_revoked',
      'session_expired',
      'session_idle_timeout',
      'security_activity_viewed'
    )
  );

create index if not exists idx_login_history_user_event_created
  on public.login_history(user_id, event_type, created_at desc);

comment on table public.login_history is 'PETATOE v9: Enterprise authentication, MFA, trusted-device and session audit trail.';

commit;
