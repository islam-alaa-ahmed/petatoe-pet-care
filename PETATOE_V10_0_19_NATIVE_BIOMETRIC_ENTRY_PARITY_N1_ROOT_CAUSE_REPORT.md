# PETATOE v10.0.19 — Native Biometric Entry Parity N1

## Confirmed Root Cause

The native iOS Face ID bridge was injected with `defer` immediately before the non-deferred web authentication script. The web authentication runtime therefore executed first and scheduled the WebAuthn/Passkey automatic prompt before the native LocalAuthentication bridge could claim ownership of biometric startup. This produced the extra visible “Use Passkey” interaction.

The native pending state also hid the entire document with `visibility:hidden` while Capacitor used a dark native background, producing the black startup screen.

## Implemented Scope

- Inject the native biometric runtime synchronously before `security/auth-session.js` in native builds.
- Publish an explicit native biometric ownership marker before web authentication initializes.
- Prevent the browser WebAuthn automatic login flow from running when native iOS Face ID owns startup authentication.
- Keep manual browser Passkey behavior unchanged outside the native iOS wrapper.
- Replace the black hidden startup state with a lightweight neutral loading surface and spinner.
- Change the Capacitor/native web-view startup background from black to a neutral light surface.
- Preserve manual login fallback when Face ID is unavailable, cancelled, or no protected native session exists.

## Not Changed

- User/password validation.
- MFA and Edge Function rules.
- Passkey enrollment and browser/PWA behavior.
- Supabase schema, RLS, or security policies.
- Dashboard, navigation, menus, calculations, or business logic.
