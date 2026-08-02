# PETATOE Phase 15 — Security & Offline Verification

## Scope

Static and runtime-contract verification of the cumulative PETATOE state through Phase 14. No live Supabase writes, SQL execution, credential rotation, or user-data changes were performed.

## Confirmed findings

1. The Service Worker previously did not pre-cache the complete security-critical boot path. A newly installed PWA could therefore require a successful online application load before authentication and canonical data runtime assets became available in the runtime cache.
2. Supabase and security API traffic is cross-origin and the Service Worker correctly excludes cross-origin requests from PETATOE caches.
3. The browser client contains only the public Supabase configuration. No service-role literal was found in production client surfaces. The service-role environment variable is referenced only inside Supabase Edge Function source.
4. The persisted PWA session contains the sanitized `safeUser` session shape and does not include passwords, password hashes, salts, or private credentials. The primary active-tab session remains in `sessionStorage` and remote session validation is performed through `session_touch`.
5. Trusted-device, active-session, password-reset, audit-trail, and passkey SQL source contracts exist in the repository. Their deployed live state remains subject to the read-only Phase 0.5 verification against Supabase.
6. WebAuthn uses the browser Credentials API; private credential keys are not stored by PETATOE JavaScript.
7. Cairo remains an optional network font. The supported offline path is the existing `system-ui` / Arial / sans-serif fallback. No font files were added.

## Changes

- Expanded the Service Worker application shell to include the version manifest, primary CSS, interaction CSS contract, authentication/session modules, security hardening modules, canonical data source, and records read facade.
- Added cache-version tokens to critical security and canonical data scripts in `index.html`.
- Added `security/security-offline-contract.js`, a diagnostics-only runtime contract that exposes non-sensitive capability and policy status.
- Extended centralized version synchronization to govern security-critical assets.
- Added automated security and offline contract checks.

## Offline boundary

The secure base shell, authentication runtime, critical styles, and canonical data runtime are now install-time cached. The following remain online-only optional capabilities and are not required for base authentication or shell startup:

- Chart.js CDN functionality.
- XLSX CDN import/export functionality.
- Remote QR image generation.
- Supabase data synchronization and remote session validation.
- Google Cairo webfont download; system fallback is used offline.

## Verification

- Phase 15 security/offline contract: 31/31 passed.
- Central version single source: passed.
- JavaScript/MJS syntax: 415/415 passed.
- Phase 2–14 regression checks: passed.
- Enterprise localization certification: passed.
- Production localization lockdown: passed.
- Runtime translation completion: passed.
- All local Service Worker APP_SHELL assets exist.

## Live verification still required

After deployment:

1. Install/update the PWA while online.
2. Confirm the new Service Worker activates with the Phase 15 cache version.
3. Reload once, then disable network access.
4. Confirm the offline page and secure base shell load without missing-script errors.
5. Confirm no Supabase response or authentication API response appears in Cache Storage.
6. Re-enable the network and verify login, remote session touch, trusted devices, active sessions, OTP reset, and security audit trail.
7. Run the Phase 0.5 read-only SQL verification against the deployed Supabase project to confirm RLS, tables, RPCs, triggers, and policies.

## Limitations

This phase does not claim that live RLS policies or SQL migrations are deployed; repository source presence and client contracts were verified only. It also does not make offline data synchronization or online-only export libraries available offline.
