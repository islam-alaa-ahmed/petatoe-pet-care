# PETATOE v9.4.11 — Permissions Runtime Reference Fix

## Root Cause
`settings/permissions.js` exported `userPermStore` and `saveUserPermStore` through `window.PETATOEPermissions`, while the Phase 6.1 localized file no longer contained their runtime definitions. Browser execution therefore stopped with `ReferenceError: userPermStore is not defined`.

## Fix
- Restored the canonical identity-backed permission-store loader.
- Restored the canonical permission-store save adapter.
- Restored supporting user, escaping, and toast helpers required by the localized Permissions module.
- Kept `userPermStore` as a real API because it is used internally by permission reads, saves, reset, and vehicle-scope logic.
- Synchronized release/runtime/CI metadata to v9.4.11.

## Verification
- Permissions runtime VM load: PASSED
- `window.PETATOEPermissions.userPermStore`: function
- `window.PETATOEPermissions.saveUserPermStore`: function
- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Legacy localization calls: 0
- Missing translation counterparts: 0
- Arabic entries: 3361
- English entries: 3361
- JavaScript syntax: 277 passed / 0 failed
