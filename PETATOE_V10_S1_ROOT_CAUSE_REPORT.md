# PETATOE v10-S1 — Root Cause Report

## Reported behavior
On iPhone, opening the installed PWA displayed the PETATOE username/password form and then Apple's password AutoFill sheet. Face ID only unlocked the saved password; PETATOE itself did not authenticate with Face ID.

## Confirmed root cause
`security/auth-session.js` contained a partial WebAuthn prototype, but its persistence layer was intentionally disabled:

- `readBiometric()` always returned `null`.
- `registerBiometric()` only displayed the message that local biometric storage was disabled.
- No passkey public key, challenge, or server-side signature verification existed in Supabase.
- The focused `autocomplete="current-password"` field caused iOS Password AutoFill to appear instead.

Therefore the existing checkbox could not register a PETATOE biometric credential and automatic biometric login was impossible.

## Production fix
The disabled local prototype was replaced with a server-verified WebAuthn/Passkey flow:

1. Enrollment occurs only after a valid PETATOE session.
2. The Edge Function generates one-time WebAuthn challenges.
3. iPhone creates a platform credential protected by Face ID/Touch ID/device passcode.
4. Supabase stores only the credential public key and counter.
5. On later app launches, PETATOE automatically requests the registered passkey before focusing password fields.
6. The Edge Function verifies the signature, RP ID, origin, challenge, user verification, and counter before opening a PETATOE session.
7. Password/MFA remains available as a fallback when biometric authentication is cancelled or unavailable.

No biometric image, Face ID template, or password is stored in the new tables.
