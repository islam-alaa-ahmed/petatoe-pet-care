# PETATOE v10.0.25 — Phase SR4.1 Regression Rollback

## Baseline
Current cumulative runtime through SR4.

## Confirmed regression
After SR4, runtime diagnostics showed:
- renderSmartReports: false
- smartServices: true
- smartTabs: true
- setSmartTab: true

SR4 inserted the canonical data provider into the critical Smart Reports path and modified the legacy data reader and tabs before runtime registration had completed. The last user-verified state where reports opened was SR3.

## Applied rollback
Restored the following files exactly to their cumulative SR3 state:
- index.html
- smart/smart-reports-runtime-controller.js
- smart/smart-tabs.js
- inline-extracted/legacy-application-core.js

Removed the SR4 data-provider reference from the critical runtime sequence by restoring SR3 index.html.

## Files to delete
- smart/smart-reports-data-provider.js
- scripts/smart-reports-data-provider-check.js

## Verification
- JavaScript syntax checks passed for all restored JavaScript files.
- index.html contains no smart-reports-data-provider.js reference.
- Critical order is restored:
  smart-reports-core.js → smart-tabs.js → smart-runtime-registration.js → smart-reports-runtime-controller.js
- No Business Logic, Supabase query, SQL, permission, payroll, or UI design changes were made.
