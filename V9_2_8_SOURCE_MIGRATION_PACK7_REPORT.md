# PETATOE v9.2.8 — Source Migration Pack 7

## Baseline

- `petatoe-pet-care(15).zip`
- Cumulative overlays applied: v9.2.5, v9.2.6, v9.2.7

## Root Cause

The Operations module still rebuilt appointment and master-data form controls with direct Arabic UI strings. These strings were recreated after edits, data refreshes, and form resets, so English mode could temporarily or permanently return to Arabic even after the runtime translator had already translated the page.

## Implemented Changes

The following dynamic Operations UI sources now render through `opT()` and the unified localization layer:

- Animal type, size, service, breed, vehicle, driver, groomer, and time placeholders.
- Customer edit prompts and exported customer/service headers.
- Service and customer empty states.
- Vehicle assignment status, actions, and empty states.
- Appointment service and animal row actions and tooltips.
- Appointment form add/edit titles.
- Appointment creation audit note.
- Pet-name example and all-animal targeting label.

A dedicated regression check now verifies that migrated Arabic literals do not return to the Operations source.

## Verification

- Source Migration Pack 7 Check: Passed
- Dynamic Operations form keys covered: 39
- Direct Arabic UI patterns covered by this pack remaining: 0
- Automated checks: 19 passed / 0 failed
- JavaScript syntax: 256 files checked / 0 errors
- Arabic characters inside the English Operations dictionary: 0

## Scope Protection

No changes were made to:

- Appointment calculations
- Status-flow values stored in data
- Import parsing aliases
- Vehicle execution logic
- Supabase schema or RPCs
- Authentication or permissions
- Payroll calculations
- Business workflows

## Modified Files

- `i18n/operations-source.js`
- `operations/operations-legacy-engine.js`
- `scripts/source-migration-pack4-check.js`
- `scripts/source-migration-pack7-check.js`
- `index.html`
- `RELEASE_VERSION.txt`
