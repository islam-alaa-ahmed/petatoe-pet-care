# PETATOE V10-S2 Root Cause Report

## Confirmed root cause
The S1 passkey implementation was already launching WebAuthn automatically, but the normal username/password form remained visible underneath the native iOS passkey sheet. This made startup look like a manual login flow and allowed password-field focus/AutoFill UI to compete with the biometric-first flow.

The iOS WebAuthn system sheet itself cannot be bypassed or styled by a PWA. The application can only control what is shown behind it and when the fallback login form becomes available.

## Files responsible
- `security/auth-session.js`: startup rendering and automatic passkey attempt.
- `service-worker.js`: cached release identity.
- `scripts/mobile-enterprise-v10-certification-check.js`: intentional Service Worker version lock.

## Implemented fix
- Added a dedicated biometric-first startup state.
- Hide the username/password form and footer while the automatic passkey request is active.
- Show only a neutral Face ID progress surface behind the native iOS sheet.
- Reveal and focus the normal login form only after cancellation or a real verification failure.
- Preserve manual passkey and password fallback paths.
