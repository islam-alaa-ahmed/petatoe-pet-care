# PETATOE v9.1 — Unified Localization Center Foundation

## Scope
Implemented the architectural foundation that makes `PETATOE_LOCALIZATION_CENTER` the single public localization facade without deleting legacy APIs prematurely.

## Root causes addressed
- Localization runtime was loaded after Smart Reports renderers.
- Smart Reports dictionary readiness had no dedicated event.
- `smartReportT()` contained several competing fallback branches.
- Business-data, Smart Reports, core i18n, and screen translation did not share one public facade.
- English mode could return Arabic fallback text when a key was unavailable.

## Changes
- Rebuilt `PETATOE_LOCALIZATION_CENTER` as the unified facade.
- Added `t`, `translate`, `business`, `monthName`, `formatDate`, `setLanguage`, `apply`, `whenReady`, and status APIs.
- Added strict English fallback protection: Arabic fallback values are not returned by the unified center in English mode.
- Changed `businessDataT()` and `localize()` into compatibility adapters to the unified center.
- Routed `smartReportT()` through the unified center.
- Added `petatoe:smart-translations-ready` readiness event.
- Reordered localization scripts so dictionaries and the core runtime load before Smart Reports localization and the global safety translator.
- Preserved the global translator as a lightweight safety layer rather than the primary source.

## Files modified
- `index.html`
- `RELEASE_VERSION.txt`
- `i18n/localization-center/runtime.js`
- `i18n/smart-reports-source.js`
- `smart/smart-reports-core.js`

## Verification
- All JavaScript files checked with `node --check`.
- Syntax errors: 0.
- No database, Supabase, authentication, permission, calculation, or report-data changes.

## Important migration status
This is the safe architectural foundation. Legacy APIs remain as adapters to prevent regressions. Direct Arabic source strings in other modules are not deleted in this foundation package; they must be migrated module-by-module through the unified center before removal of compatibility adapters.
