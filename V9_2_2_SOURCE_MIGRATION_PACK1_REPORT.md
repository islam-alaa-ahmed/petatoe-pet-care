# PETATOE v9.2.2 — Source Migration Pack 1

## Scope

This phase addresses Smart Reports source-level localization gaps after the runtime stabilization phase. It does not change report calculations, filters, database access, authentication, permissions, or business workflows.

## Root cause confirmed

`smart/smart-reports-core.js` uses literal localization keys with Arabic fallbacks. Seventy key patterns were not present in the dedicated Smart Reports dictionary. Four are dynamic prefixes (`calendar.days.`, `calendar.months.`, `risk.`, and `recovery.`); the remaining literal keys could fall back to Arabic in English mode.

## Implemented

- Added the missing Arabic and English entries for every literal localization key used by `smart/smart-reports-core.js`.
- Covered AI forecasting, empty states, comparison controls, customer statuses, export labels, heatmap messages, metric labels, and summary labels.
- Kept Arabic and English dictionaries structurally synchronized.
- Added a regression guard that extracts literal Smart Reports keys from the source and fails when:
  - an Arabic key is missing;
  - an English key is missing;
  - an English value contains Arabic characters;
  - Arabic and English dictionary structures differ.
- Updated the Smart Reports localization cache token and release metadata.

## Verification

- Source Migration Pack 1 guard: Passed.
- Literal Smart Reports keys covered: 422.
- Smart Reports dictionary keys: 642 Arabic / 642 English.
- Existing automated source checks: 13 passed / 0 failed.
- JavaScript syntax: 247 files checked / 0 errors.

## Files modified

- `i18n/smart-reports-source.js`
- `scripts/source-migration-pack1-check.js`
- `index.html`
- `RELEASE_VERSION.txt`
- `V9_2_2_SOURCE_MIGRATION_PACK1_REPORT.md`

## Remaining scope

The next source-migration pack should audit direct Arabic UI strings outside Smart Reports, prioritizing operations, maintenance, payroll, exports, settings, warehouses, and security modules. Arabic business-data values must remain canonical internally and be localized only at display boundaries.
