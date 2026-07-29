# Phase SR6.1 — Certification Lock Hotfix

## Root Cause
`service-worker.js` intentionally moved to the SR6.1 canonical cache token, while `scripts/mobile-enterprise-v10-certification-check.js` still locked the previous Service Worker APP_VERSION. The production change was valid, but the certification expectation was stale.

## Modified File
- `scripts/mobile-enterprise-v10-certification-check.js`

## Change
Updated the expected Service Worker APP_VERSION from:

`10.0.25-navigation-runtime-isolation-c2-3`

to:

`10.0.25-smart-reports-sr6-1-cache-reconciliation`

## Verification
- Mobile Enterprise UI v10 certification: PASSED
- Smart Reports cache token reconciliation: PASSED
- JavaScript syntax validation: PASSED

No production runtime, business logic, Supabase, SQL, reports calculations, localization text, layout, release version, or loading order was changed.
