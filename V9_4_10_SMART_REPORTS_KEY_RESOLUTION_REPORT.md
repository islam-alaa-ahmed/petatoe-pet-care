# PETATOE v9.4.10 — Smart Reports Key Resolution

## Confirmed Root Cause
The canonical `smartReportsSource` dictionary contains 642 entries per language stored as flat dotted keys such as `tabs.overview` and `vehicleEfficiency.title`. The Localization Center `getPath()` function only traversed nested objects, so requests such as `smartReportsSource.tabs.overview` returned `undefined` and the runtime displayed the translation key itself.

## Fix
- Updated the canonical store resolver to support both nested objects and flat dotted keys.
- Preserved `PETATOE_LOCALIZATION_CENTER_STORE` as the only translation-data owner.
- Synchronized runtime, release metadata, cache tokens, and CI validators to v9.4.10.
- Added a regression check covering the Smart Reports keys visible in Overview, Vehicles, filters, KPI cards, tables, and vehicle-efficiency controls.

## Verification
- Smart Reports Key Resolution: PASSED
- Required visible keys: 22 × 2 languages
- Smart Reports entries: 642 per language
- Visible key fallbacks: 0
- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Arabic entries: 3361
- English entries: 3361
- Missing counterparts: 0
- Legacy localization calls: 0
