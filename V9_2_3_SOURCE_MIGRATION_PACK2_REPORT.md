# PETATOE v9.2.3 — Source Migration Pack 2

## Scope

This pack migrates the Smart Reports export and print engine away from Arabic source-level fallback text.

## Root cause addressed

`smart/smart-reports-export-engine.js` still contained Arabic fallback strings inside `smartExportT(...)` calls and two direct Arabic table headers. When an export key was unavailable temporarily, or during an early loading state, those source fallbacks could appear inside English PDF, print, copy, and Excel output.

## Changes

- Replaced Arabic `smartExportT(...)` fallback values with verified English fallback values.
- Removed the two direct Arabic average-column headers.
- Preserved Arabic output through the Arabic Smart Reports dictionary.
- Preserved English output through the English Smart Reports dictionary.
- Added a regression guard that checks:
  - no Arabic source text remains in the export engine;
  - every export key used by the engine exists in both Arabic and English dictionaries;
  - English export values contain no Arabic characters;
  - the index cache token matches v9.2.3.
- Synchronized release metadata and the export engine cache token.

## Verification

- Source Migration Pack 2 Check: Passed
- Export localization keys covered: 99
- Arabic source strings remaining in export engine: 0
- Automated checks: 14 passed / 0 failed
- JavaScript files checked: 248
- JavaScript syntax errors: 0

## Files modified

- `smart/smart-reports-export-engine.js`
- `scripts/source-migration-pack2-check.js`
- `index.html`
- `RELEASE_VERSION.txt`
- `V9_2_3_SOURCE_MIGRATION_PACK2_REPORT.md`

## Excluded from this pack

No changes were made to report calculations, report filters, business data, Supabase, authentication, permissions, payroll calculations, database schema, or workflows.
