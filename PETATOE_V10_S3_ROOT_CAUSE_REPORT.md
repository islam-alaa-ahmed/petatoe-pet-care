# PETATOE v10-S3 — Passkey Enrollment Recovery

## Confirmed Root Cause

The iPhone completes the native Apple passkey creation prompt before PETATOE finishes the server-side registration verification and database save.

The previous client wrote `petatoe_passkey_device_v10` only after all of these steps succeeded:

1. Apple creates/saves the passkey.
2. Edge Function verifies the WebAuthn attestation.
3. `passkey_credentials` is saved in Supabase.
4. The successful response reaches the browser.

If step 2, 3, or 4 fails or the response is interrupted, Apple may already show the passkey as created, while PETATOE has no local enrollment marker. On the next launch, the application therefore starts enrollment from the beginning.

## Fix

- Persist a pending enrollment marker before opening the Apple passkey dialog.
- Update it immediately after the credential is created.
- Add `passkey_status` to the Edge Function.
- On the next launch, reconcile pending enrollment with Supabase.
- Recover the local marker automatically when the credential exists server-side.
- Preserve the exact last registration error when the server did not complete the save.
- Clear pending enrollment only after confirmed success or explicit user cancellation.
