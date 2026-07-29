# Phase SR2 — Smart Reports Single Controller Verification

## Scope
Unified Smart Reports lifecycle ownership without changing report calculations, queries, Supabase, permissions, or UI.

## Root cause addressed
Open, readiness, render, refresh and records-changed handling were split across the runtime controller, tab subscribers, filters and router. Multiple owners could trigger duplicate or out-of-order renders.

## Changes
- `PETATOESmartReportsRuntime` is now the canonical lifecycle API.
- The runtime controller exclusively owns `petatoe:tabchange` and `petatoe:records-changed`.
- Tab render subscribers no longer render Smart Reports.
- Filters delegate render/refresh to the canonical runtime.
- Router remains a navigation/render-routing compatibility layer and delegates open requests when the runtime is available.
- Added CI certification preventing multiple lifecycle owners.

## Expected runtime flow
`Open -> Ensure Runtime -> Sync Canonical Data -> Render -> Activate Tab`

## Modified files
- index.html
- smart/smart-reports-runtime-controller.js
- smart/smart-router.js
- components/tab-render-subscribers.js
- components/filters-finalization.js
- scripts/smart-reports-single-controller-check.js
- .github/workflows/localization-lockdown.yml
