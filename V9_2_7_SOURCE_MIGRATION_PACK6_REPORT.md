# PETATOE v9.2.7 — Source Migration Pack 6

## Baseline

`petatoe-pet-care(15).zip` with the cumulative v9.2.5 and v9.2.6 modified-file packs applied before this phase.

## Root Cause

The Maintenance Center shell had already been localized, but the deep diagnostic renderers still embedded Arabic directly in generated HTML, table headings, status notes, recommendations, certification sections, security diagnostics, and runtime hardening sections. Every refresh or re-render could therefore recreate Arabic while English was active.

## Implemented

- Migrated the deep Maintenance Center render range to `PETATOE_LOCALIZATION_CENTER` through the existing `mt()` adapter.
- Added aligned Arabic and English dictionary entries for deep diagnostics.
- Removed direct Arabic from the renderer range beginning at `statusBadge()` and ending before the main `render()` function.
- Covered performance, lazy loading, silent catch, innerHTML risk, structural cleanup, runtime hardening, regression, Golden Baseline, LTS, vehicle permissions, and security sections.
- Kept diagnostic calculations, stored data, scores, permissions, and workflows unchanged.
- Updated cache tokens and release metadata to v9.2.7.
- Added a Pack 6 regression guard.
- Updated the older Pack 5 guard to accept valid future cache-busting tokens instead of one exact version string.

## Verification

- Source Migration Pack 6 Check: Passed
- Maintenance dictionary keys: 205
- Maintenance runtime keys used: 197
- Direct Arabic lines in deep render range: 0
- Automated checks: 18 passed / 0 failed
- JavaScript files checked: 255
- JavaScript syntax errors: 0

## Files Modified

- `i18n/maintenance-source.js`
- `maintenance/maintenance-center.js`
- `scripts/source-migration-pack5-check.js`
- `scripts/source-migration-pack6-check.js`
- `index.html`
- `RELEASE_VERSION.txt`
- `V9_2_7_SOURCE_MIGRATION_PACK6_REPORT.md`

## Not Changed

- Diagnostic calculations
- Router behavior
- Storage behavior
- Authentication
- Permissions logic
- Supabase schema or data
- Payroll calculations
- Report calculations
- Business workflows
