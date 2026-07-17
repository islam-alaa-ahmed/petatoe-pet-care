# PETATOE v9.3.6 — Localization Center Consolidation

## Scope
Consolidated the active localization paths behind `PETATOE_LOCALIZATION_CENTER` while preserving backward compatibility for legacy callers.

## Implemented
- Added `i18n/localization-center/consolidation.js` as the single consolidation bridge.
- Registered Operations, Warehouse, Smart Reports, Maintenance, and Runtime dictionaries in the Localization Center.
- Converted `opT()` and `whT()` into adapters that read only from `PETATOE_LOCALIZATION_CENTER`.
- Converted legacy `PETATOE_I18N.translateRuntime()` into a backward-compatible adapter to the Center.
- Routed the global screen translator and business-data runtime fallback through the Center.
- Added 165 missing runtime translations to the Center.
- Verified coverage of all 238 direct Arabic runtime literals: 0 missing.
- Synchronized release metadata and cache tokens to v9.3.6.

## Verification
- JavaScript syntax: 264 files passed.
- Localization and regression checks: 25 passed, 0 failed.
- Runtime literals audited: 238.
- New Center runtime entries: 165.
- Missing runtime entries: 0.

## Release
- PETATOE v9.3.6
- ELC_V9_3_6_LOCALIZATION_CENTER_CONSOLIDATION
