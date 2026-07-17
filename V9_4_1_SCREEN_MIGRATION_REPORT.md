# PETATOE v9.4.1 — Screen Localization Migration

## Scope
Migrated application screen/runtime consumers to read through `PETATOE_LOCALIZATION_CENTER` instead of directly reading legacy localization objects.

## Result
- Screen/runtime JavaScript files checked: 211
- Direct legacy localization consumers outside the i18n compatibility layer: 0
- JavaScript syntax checks: 266 passed, 0 failed
- Smart Reports source migration checks: passed
- Smart Reports export migration checks: passed
- Maintenance localization source checks: passed

## Main changes
- Runtime alerts, confirmations, prompts, toasts, and validation messages now call `PETATOE_LOCALIZATION_CENTER.translateRuntime()`.
- Smart Reports export, interactions, and sales invoice report now call `PETATOE_LOCALIZATION_CENTER.t()` directly.
- Customer 360 and Smart Data Engine business-data localization now enter through the Localization Center.
- Maintenance Center no longer reads legacy dictionaries directly.
- Added `localizeBusinessRecord()` to the Localization Center compatibility API.
- Added `scripts/screen-localization-migration-check.js` to block future direct legacy consumers outside the i18n layer.

## Compatibility
Legacy localization objects remain inside the i18n compatibility layer for the next cleanup phase. Application screens no longer access them directly.
