# PETATOE v9.4.16 — Smart Reports Public API Restoration

## Root Cause

`smart/smart-reports-open-refresh-guard.js` previously exported `window.PETATOEOpenSmartReports`. The v9.4.15 fast-runtime restoration intentionally stopped loading that guard, but `index.html` still called the removed global function from the Reports header button. This produced `ReferenceError` before navigation could complete.

## Fix

- Restored the stable public API in `smart/smart-router.js`.
- Routed the API through the canonical application router.
- Restored the header button to the direct router call used by the earlier fast baseline.
- Did not restore the removed readiness guard, retry loop, delayed tab restoration, or 30-second waiting path.

## Verification

- Smart Reports Public API: 6/6 passed.
- Enterprise Localization Certification: passed.
- Production Localization Lockdown: passed.
- Runtime Translation Completion: passed.
- JavaScript syntax: 282 passed, 0 failed.
