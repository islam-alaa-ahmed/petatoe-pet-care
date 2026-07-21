# PETATOE V10-S4 — WebAuthn State Machine Root Cause Report

## Confirmed root cause

The Face ID enrollment flow treated `InvalidStateError` as a fatal enrollment failure.

On iOS, this error is returned when `navigator.credentials.create()` is called for a user whose platform authenticator already owns a credential included in `excludeCredentials`. This occurs when the Passkey was previously created in iCloud Keychain/Supabase, while PETATOE's browser-local enrollment marker was missing or stale.

The previous recovery code also defined `reconcileBiometricEnrollment()` but did not invoke it before automatic login, and the delivered S3 patch did not include the Edge Function implementation for the `passkey_status` action. Therefore the app repeatedly attempted to create the same Passkey and showed: `The object is in an invalid state`.

## Files responsible

- `security/auth-session.js`
  - Repeated `navigator.credentials.create()` without a server-side status preflight.
  - `InvalidStateError` was displayed as a failure.
  - Enrollment reconciliation was not wired into startup.
- `supabase/functions/petatoe-security-email/index.ts`
  - Missing deployed `passkey_status` action required by recovery logic.

## Impact

- Existing Passkeys could not restore PETATOE's local biometric state.
- Users were prompted to save a Passkey repeatedly.
- Face ID appeared to fail despite a credential already existing.
