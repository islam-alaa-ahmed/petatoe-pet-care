# PETATOE v9.4.12 — Runtime Translation Completion

## Scope
Completed the remaining runtime localization linkage against the canonical `PETATOE_LOCALIZATION_CENTER_STORE`.

## Root cause
66 Arabic runtime phrases were called through `translateRuntime()` but were not present in `runtimeSource`. In English mode those calls fell back to Arabic. Several dynamic confirmation/error messages also used ternary expressions that dropped the dynamic suffix whenever the Localization Center was available.

## Changes
- Added 66 Arabic/English runtime mappings to the canonical store.
- Increased canonical parity from 3,361 to 3,427 entries per language.
- Linked 229 runtime phrases used by the application with zero missing runtime phrases.
- Fixed dynamic message composition for child expenses, child budgets, invoice deletion, setup required-name validation, user save/delete failures, and appointment conflict details.
- Added `scripts/runtime-translation-completion-check.js`.
- Added the runtime completion validator to GitHub Actions Localization Lockdown.
- Synchronized release metadata and cache tokens to v9.4.12.

## Verification
- Runtime Translation Completion: PASSED
- Used runtime phrases: 229
- Stored runtime phrases: 231
- Missing runtime phrases: 0
- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Smart Reports Key Resolution: PASSED
- Arabic entries: 3,427
- English entries: 3,427
- Missing counterparts: 0
- Legacy direct calls: 0
- JavaScript syntax: 279 passed / 0 failed
