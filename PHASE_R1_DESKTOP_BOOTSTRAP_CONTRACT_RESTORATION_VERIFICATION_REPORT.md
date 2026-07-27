# PETATOE v10.0.25 — Phase R1 Desktop Bootstrap Contract Restoration

## Baseline
- `petatoe-pet-care-main (17).zip`

## Confirmed Root Cause
The shared startup gate registered business modules only for mobile lazy loading and returned immediate success for desktop calls. Desktop callers could therefore invoke Smart Reports or Payroll while their deferred/global dependencies were not ready. The affected call sites did not share a readiness contract.

## Changes
1. `performance/mobile-startup-loading-gate.js`
   - Registers group metadata on both desktop and mobile.
   - Adds desktop readiness checks for Payroll, Smart Reports, Reports UI, Sales and Printing.
   - `ensureGroup()` now waits for required desktop globals instead of resolving immediately.
   - Mobile loading order and sequential dependency loading remain unchanged.

2. `components/inline-handler-adapter.js`
   - `moduleCall()` now uses `ensureGroup()` on both desktop and mobile.
   - A handler is called only after the relevant module reports ready.

3. `components/tab-render-subscribers.js`
   - Smart Reports rendering is gated by `ensureGroup('smartReports')`.
   - Prevents `renderSmartReports()` from running before `smartServicesScopedData` exists.

4. `components/filters-finalization.js`
   - Smart Reports filters and refresh action use the same readiness contract.
   - Prevents repeated secondary ReferenceErrors from filter-triggered renders.

## Scope Protection
No changes were made to:
- Business logic
- Smart Reports calculations
- Payroll calculations
- Supabase queries or SQL
- Auth or permissions
- Desktop/mobile visual design
- Release version or release name

## Verification
- JavaScript syntax: PASSED for all 4 modified JS files.
- Enterprise Localization Certification: PASSED.
- Production Localization Lockdown: PASSED.
- Runtime Translation Completion: PASSED.
- Mobile Enterprise UI v10 Certification: PASSED (61/61).

## Runtime Acceptance Test Required
After deployment, verify in desktop Chrome:
- Dashboard opens without raw i18n keys.
- Payroll Management opens and renders content.
- Payroll Statement opens and renders content.
- Smart Reports renders cards/tables and Refresh works.
- Console contains no `smartServicesScopedData is not defined` and no payroll `handler not found` warning.
