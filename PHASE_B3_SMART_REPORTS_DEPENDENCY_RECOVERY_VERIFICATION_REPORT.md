# PETATOE v10.0.25 — Phase B3 Smart Reports Dependency Recovery

## Scope
Runtime dependency recovery only. No business logic, query, Supabase, payroll calculation, permission, design, or release-number changes.

## Confirmed Root Cause
`smart-reports-core.js` called `smartServicesScopedData()` as an unqualified legacy global. The current runtime can load mixed cached generations of Smart Reports files because `smart-services.js` had no cache token while the core/controller had different tokens. In the failing runtime, the controller and core were current, but the services provider contract was not reliably available to the core. This produced `ReferenceError: smartServicesScopedData is not defined`.

## Changes
- Added canonical `window.PETATOESmartServices` provider namespace with `__ready` and `scopedData` API.
- Preserved legacy globals for backward compatibility.
- Changed Smart Reports core to resolve the provider through the canonical namespace / `window` instead of an unqualified identifier.
- Updated Startup Gate readiness contract to validate the canonical provider.
- Updated runtime controller to await `ensureGroup('smartReports')` before synchronization and rendering.
- Added one unified B3 cache token to Smart Services, Smart Reports Core, and Runtime Controller.
- Updated the data-ready contract certification for the new readiness-before-sync sequence.

## Modified Files
- index.html
- performance/mobile-startup-loading-gate.js
- smart/smart-services.js
- smart/smart-reports-core.js
- smart/smart-reports-runtime-controller.js
- scripts/data-ready-screen-hydration-contract-check.js

## Verification
- JavaScript syntax: PASSED
- Startup Gate Single Source: PASSED
- Runtime Readiness Contract: PASSED (9/9)
- Data-ready Hydration Contract: PASSED (13/13)
- Smart Reports Public API: PASSED
- Smart Reports Translation Stability: PASSED (11/11)
- Mobile Enterprise UI v10: PASSED (61/61)
- Enterprise Localization Certification: PASSED
- Runtime Translation Completion: PASSED

## Live Acceptance Required
After deployment, test Smart Reports cold start, Refresh, and all tabs. The live browser must show no `smartServicesScopedData` ReferenceError.
