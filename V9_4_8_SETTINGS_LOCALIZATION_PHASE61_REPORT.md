# PETATOE v9.4.8 — Phase 6.1 Settings Localization Migration

## Implemented scope

- Migrated the Permissions Management screen from embedded Arabic UI text to Localization Center keys.
- Added the canonical `settingsPhase61` module under `i18n/localization-center/settings-phase61.js`.
- Added Arabic and English entries for:
  - 25 permission screens and descriptions.
  - CRUD action labels.
  - 39 special permissions.
  - 8 permission modules and descriptions.
  - Permission controls, help text, vehicle assignment text, and runtime messages.
- Permission labels are resolved during every render, so language switching does not require a page reload.
- Removed the Permissions screen dependency on Global Screen Translator for its main rendered UI.

## Verification

- Arabic keys: 149
- English keys: 149
- Missing Arabic counterparts: 0
- Missing English counterparts: 0
- JavaScript syntax checks: passed for 275 files
- Phase 6.1 validator: passed

## Files modified

- `index.html`
- `RELEASE_VERSION.txt`
- `settings/permissions.js`

## Files added

- `i18n/localization-center/settings-phase61.js`
- `scripts/settings-localization-phase61-check.js`
- `V9_4_8_SETTINGS_LOCALIZATION_PHASE61_REPORT.md`
