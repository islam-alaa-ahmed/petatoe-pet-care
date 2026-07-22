# PETATOE v10 Commissions Phase 1A — Localization Hotfix

## Root Cause
Phase 1A introduced two user-facing Arabic persistence-error messages in `inline-extracted/commission-inline.js` through `translateRuntime()`, but the exact source phrases had not been registered in the canonical Localization Center runtime dictionary.

This caused:
- Enterprise Localization Certification: `missingStoredTexts = 2`
- Runtime Translation Completion: `missingRuntimePhrases = 2`

## Fix
Registered both Arabic source phrases and their English counterparts in:
- `i18n/localization-center/dictionary-store.js`

The commission runtime/business logic was not changed.
