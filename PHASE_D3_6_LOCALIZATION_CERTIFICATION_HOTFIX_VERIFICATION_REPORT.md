# PETATOE v10.0.25 — Phase D3.6 Localization Certification Hotfix

## Confirmed Root Cause
The Mobile Enterprise UI v10 certification counts literal occurrences of `mobile/mobile-enterprise-v10-shell.js` in `index.html` and requires exactly one.

Phase D3.6 used the same full asset path as diagnostic span labels before and after the real script tag, producing three literal occurrences even though only one script asset was loaded.

## Fix
Changed the diagnostic span labels from the full asset path to the neutral identifier `mobile-enterprise-v10-shell`.

The real runtime script reference remains unchanged and appears exactly once.

## Modified File
- `index.html`

## Verification
- Enterprise localization certification: PASSED
- Production localization lockdown: PASSED
- Runtime translation completion: PASSED
- Smart Reports fast runtime: PASSED
- Smart Reports fast readiness path: PASSED
- Smart Reports public API: PASSED
- Smart Reports translation stability: PASSED
- Mobile Enterprise UI v10 certification: PASSED — 61 checks, 0 failures
- JavaScript syntax validation: PASSED

## Scope Protection
No changes were made to business logic, Supabase, authentication, permissions, UI design, desktop/tablet behavior, release version, or release name.
