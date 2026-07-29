# Phase SR4 — Smart Reports Canonical Data Provider

## Scope
Read and synchronization ownership only. No Smart Reports calculations, Supabase queries, SQL, permissions, or UI layout were changed.

## Root cause addressed
Smart Reports modules read two different runtime stores: the canonical `PETATOEDataSource` and the legacy lexical `records` array. This allowed readiness and tabs to see rows while `renderSmartReports()` saw an empty legacy array.

## Implementation
- Added `smart/smart-reports-data-provider.js` as the single Smart Reports row contract.
- `smartData()` now reads the provider with a legacy fallback.
- Runtime controller and Smart Tabs use the same provider.
- Remote refresh commits canonical rows to the legacy bridge before render.
- Added a static contract certification.

## Modified files
- index.html
- smart/smart-reports-data-provider.js
- inline-extracted/legacy-application-core.js
- smart/smart-reports-runtime-controller.js
- smart/smart-tabs.js
- scripts/smart-reports-data-provider-check.js
