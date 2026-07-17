# PETATOE v9.1.8 — Legacy Localization Cleanup Pack 2

## Baseline
Cumulative baseline: `petatoe-pet-care(13).zip` + Business Localization Pack 1 + Business Localization Pack 2 + Legacy Cleanup Pack 1.

## Root Cause
Smart Reports still depended on the local legacy helper `smartReportT()` and its interpolation wrapper. One external filters module also attempted to call that helper by global name. This prevented the unified localization center from being the only public localization entry point.

## Changes
- Added `PETATOE_LOCALIZATION_CENTER.smart(key, fallback, params)` as the canonical Smart Reports translation API.
- Migrated all Smart Reports Core calls directly to `PETATOE_LOCALIZATION_CENTER.smart()`.
- Removed `smartReportT()` and the now-dead `smartReportInterpolate()` helper.
- Updated `smartReportHtml()` to use the unified center directly.
- Migrated the vehicle-efficiency filters helper away from the legacy global call.
- Routed Smart Reports subtree localization through `PETATOE_LOCALIZATION_CENTER.apply()`.
- Updated release metadata and cache-busting references.
- Added a regression guard that scans the project for removed legacy adapters.

## Verification
- Legacy Cleanup Pack 2 guard: **Passed**.
- Source files scanned by guard: **243**.
- JavaScript files checked with `node --check`: **241**.
- JavaScript syntax errors: **0**.
- Remaining `smartReportT` calls/adapters: **0**.
- Remaining `businessDataT` calls/adapters: **0**.
- Remaining dead `smartReportInterpolate` helper: **0**.

## Preserved by Design
`PETATOE_I18N` remains the low-level dictionary/runtime engine used internally by `PETATOE_LOCALIZATION_CENTER`. It was not removed because doing so would break dictionary loading, runtime translation, and language state management.

## Functional Scope Not Changed
- Report calculations and filters
- Payroll logic
- Database and Supabase integration
- Authentication and permissions
- Stored business values
- UI workflows
