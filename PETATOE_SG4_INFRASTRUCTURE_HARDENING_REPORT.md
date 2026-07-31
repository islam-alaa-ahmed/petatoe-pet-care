# PETATOE SG-4 — Infrastructure Hardening Foundation

## Baseline
`petatoe-pet-care-main (30).zip`

## Confirmed Root Causes

1. The Startup Gate was requested by `index.html` with a versioned URL while the Service Worker precached the unversioned URL, so the exact critical request was absent from APP_SHELL.
2. Payroll registration and desktop fallback still used `?v=9.1.5`, allowing an obsolete cached asset to be selected after deployment.
3. Five Smart Reports runtime files and two critical head utilities had no cache-busting token.
4. `security/auth-session.js` still wrote module/session metadata as `9.0`; no strict consumer comparison was found, so aligning it to `10.0.25` does not invalidate existing sessions.
5. Several certification scripts coupled their expected Startup Gate or Service Worker token to the previous SG-3 build and required synchronization.

## Applied Scope

Only cache/version infrastructure and the directly coupled certification locks were changed. No route ownership, runtime controller, UI, localization text, business logic, SQL, or permission behavior was modified.

## Verification

- JavaScript syntax: passed for all modified JavaScript files.
- Mobile Enterprise v10 certification: 61/61 passed.
- Startup decomposition: 12/12 passed.
- Startup Gate single-source certification: passed.
- Startup Gate stabilization contract: 31/31 passed.
- SG-3 Commission ownership: 11/11 passed.
- SG-2 route/group runtime contract: 8/8 passed.
- Enterprise localization certification: passed, zero missing counterparts.
- Runtime translation completion: passed, zero missing runtime phrases.
- Navigation/Operations deep cache verification: passed after separating the unchanged Route Registry token from the new Service Worker build token.

## Existing Unrelated Failure

`reference-data-runtime-readiness-check.js` still has one pre-existing failure:
`operations preserves pending sub-route before fallback`.

This was present before SG-4 and was not changed because it belongs to the Reference Data/Operations behavior scope rather than infrastructure hardening.
