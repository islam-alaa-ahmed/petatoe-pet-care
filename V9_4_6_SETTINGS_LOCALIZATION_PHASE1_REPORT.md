# PETATOE v9.4.6 — Settings Localization Phase 1

## Root Cause
The Settings screen and its linked modules build large HTML strings containing Arabic static text. After the global translator was optimized to avoid full-page DOM rescans, those strings were no longer reliably translated when rendered or when the language changed.

## Implemented Fix
- Added a Settings-scoped HTML localization pass before insertion into the DOM.
- The scoped pass translates text nodes and translatable attributes only inside the newly generated Settings fragment.
- Uses the existing Global Screen Translator phrase index first, then Localization Center runtime translation as fallback.
- Added a language-change listener that rerenders only the active Settings screen.
- Added canonical Arabic/English translations for the Settings header, tabs, KPI labels, and system summary labels.
- No full-page DOM scan was restored.

## Files Modified
- `settings/settings.js`
- `i18n/localization-center/dictionary-store.js`
- `index.html`
- `RELEASE_VERSION.txt`

## Files Added
- `scripts/settings-localization-phase1-check.js`
- `V9_4_6_SETTINGS_LOCALIZATION_PHASE1_REPORT.md`

## Verification
- Settings localization checks: 10/10 passed.
- Modified JavaScript syntax checks: passed.
- Release and cache tokens synchronized to v9.4.6.
