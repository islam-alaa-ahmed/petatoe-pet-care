# PETATOE v9.2.5 — Source Migration Pack 4

## Baseline
`petatoe-pet-care(15).zip`

## Scope implemented
This pack migrates high-risk runtime text in the Operations and Vehicle Operations engine from direct Arabic source strings to a dedicated Arabic/English source dictionary.

## Root cause addressed
The Operations engine was creating Arabic alerts, confirmations, toast messages, Google Maps validation messages, appointment validation messages, import messages, vehicle assignment messages, and session lifecycle messages directly from JavaScript. Every re-render could therefore restore Arabic text while the interface was in English.

## Changes
- Added `i18n/operations-source.js` as the dedicated Operations source dictionary.
- Added `opT()` source-localization helper to `operations/operations-legacy-engine.js`.
- Migrated 73 runtime localization keys.
- Removed direct Arabic `alert()`, `toast()`, and `confirm()` calls from the Operations engine.
- Localized Google Maps direction validation and error states.
- Localized customer/service import validation and success messages.
- Localized appointment create/delete/status messages and conflict alerts.
- Localized vehicle, driver, groomer assignment messages.
- Localized payment proof and session close/reopen/confirm/collection messages.
- Loaded the Operations dictionary before the Operations engine.
- Synchronized release metadata to v9.2.5.

## Verification
- Source Migration Pack 4 guard: Passed.
- Operations runtime keys covered: 73.
- Direct Arabic alert/toast/confirm calls remaining in Operations engine: 0.
- Automated source checks: 16 passed / 0 failed.
- JavaScript files checked: 252.
- JavaScript syntax errors: 0.

## Not changed
- Appointment calculations.
- Status workflow values stored in existing data.
- Vehicle assignment data model.
- Payroll.
- Authentication or permissions.
- Supabase schema or RPCs.
- Maintenance Center diagnostic content.

## Remaining localization scope
Operations still contains Arabic canonical business data and legacy HTML templates that require display-layer migration without changing stored values. Maintenance Center diagnostic and certification text remains for the next pack.
