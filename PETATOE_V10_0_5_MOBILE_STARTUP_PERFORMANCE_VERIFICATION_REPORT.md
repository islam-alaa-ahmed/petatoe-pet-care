# PETATOE v10.0.5 — Mobile Startup Performance Verification

## Implemented
1. Mobile session validation now runs remote session validation and existing identity hydration in parallel.
2. Mobile no longer invalidates and repeats the boot-time identity load during restore.
3. Added a mobile-only, text-free branded startup veil to prevent incomplete legacy UI from flashing.
4. The veil is removed after login UI or validated authenticated session is ready.
5. Mobile drawer and identity MutationObserver updates are coalesced into one animation frame.
6. Release version synchronized to `v10.0.5` in release-related files.

## Static Verification
- `node --check security/auth-session.js`: PASS
- `node --check mobile/mobile-enterprise-v10-shell.js`: PASS
- `node --check i18n/localization-center/runtime.js`: PASS
- `node --check smart/smart-language-runtime.js`: PASS
- Startup Localization First Paint: PASS
- Startup Permission Guard: PASS
- Native iOS Static Certification: PASS (27/27)

## Regression Boundaries
- Desktop uses the original sequential validation branch.
- Security still validates the remote enterprise session and active user before completing restore.
- No schema, SQL, payroll, commissions, operating, reports, calculations, or permissions logic was changed.

## Device Verification Required
After GitHub deployment, verify on the same mobile device:
- No incomplete/strange screen before login/session restoration.
- Session message does not appear during a valid restore.
- Dashboard reaches stable state faster.
- Menu and screen transitions feel smoother.
