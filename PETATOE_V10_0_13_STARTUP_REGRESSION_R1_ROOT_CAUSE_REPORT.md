# PETATOE v10.0.13 — Startup Regression R1 Root Cause Report

## Scope
Mobile PWA startup and the unexpected screen shown before PETATOE becomes visible.

## Evidence
The supplied iPhone recording shows the iOS passkey authentication sheet appearing while the phone wallpaper is still visually behind it. PETATOE later opens successfully, proving that the app is not crashing and that the delay is inside the authentication startup sequence.

## Confirmed Root Cause
`security/auth-session.js` called automatic WebAuthn/passkey login only 90 ms after creating the PETATOE authentication overlay.

The previous sequence was:

1. Create the PETATOE authentication DOM.
2. Add the biometric-first state.
3. Wait 90 ms.
4. Call `navigator.credentials.get()`.

On iOS PWA/Safari, the system passkey UI can take control before the newly-created PETATOE view has completed its first rendered frame. Therefore, the native sheet appeared over the previous iOS visual surface or wallpaper instead of a stable PETATOE screen.

## Responsible File and Function
- File: `security/auth-session.js`
- Function: `scheduleAutomaticBiometricLogin()`
- Previous trigger delay: 90 ms

## Impact
- The user sees an unrelated-looking screen during startup.
- The application appears frozen or outside PETATOE.
- The Face ID/passkey flow feels slower and visually broken even when authentication succeeds.

## Fix
Added a first-paint barrier that waits for two animation frames and a short stabilization delay before starting automatic biometric authentication.

The new flow also:

- Confirms the PETATOE authentication overlay still exists.
- Avoids starting WebAuthn while the document is hidden.
- Retries automatically when the PWA becomes visible again.
- Preserves automatic Face ID behavior.

## Scope Protection
No changes were made to Supabase, SQL, password validation, MFA verification, session security, user permissions, business modules, desktop UI, or tablet UI.
