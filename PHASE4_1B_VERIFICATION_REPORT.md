# PETATOE v9 — Phase 4.1B Core Reports Runtime Migration

## Scope
- Advanced recommendations panel title, description, and category controls.
- Two-year customer comparison core headings, KPI labels, selected table columns, and lost-customer summary labels.
- Cache-busting and release-name synchronization.

## Files Modified
- `index.html`
- `i18n/smart-reports-source.js`
- `smart/smart-reports-core.js`

## Verification
- `node --check smart/smart-reports-core.js`: Passed
- `node --check i18n/smart-reports-source.js`: Passed
- Existing business calculations, data filters, exports, and Supabase logic were not changed.
- New Arabic and English keys were added without removing previous localization packs.

## Release
- Version: `v9.0.0`
- Release name: `ELC_PHASE8B_CORE_REPORTS_RUNTIME_MIGRATION`
