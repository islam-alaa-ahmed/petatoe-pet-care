# PETATOE Phase 16 — Test Contract Consolidation

## Scope
Consolidate current CI contracts into one active manifest and runner, preserve historical tests as non-blocking, remove production-only test artifacts, and prevent stale navigation mappings from remaining in deployable output.

## Changes
- Added `scripts/test-contracts.json` as the active test contract registry.
- Added `scripts/run-active-contracts.js` as the single CI entry point.
- Updated GitHub Actions to run the active suite rather than maintaining duplicated workflow steps.
- Updated version/startup/mobile certification checks to recognize the centralized active-suite runner.
- Added `phase16-production-contract-check.js` for production artifact and active-test integrity.
- Extended version synchronization to keep governed Service Worker APP_SHELL tokens aligned.
- Removed root production test pages and the stale maintenance navigation-permissions copy.
- Registered the Phase 16 runtime contract and synchronized release/cache metadata.

## Active Suite
31 active contracts passed, including localization, startup gate, readiness, Smart Reports ownership, phases 2–15, mobile certification, security/offline, and production contract checks.

## Deleted production artifacts
- `index-css-control-test.html`
- `index-css-fontless-test.html`
- `maintenance/navigation-permissions.js`

## Runtime/business impact
No business calculations, Supabase queries, stored data, report formulas, filters, UI behavior, or permissions matrix were modified.

## Verification
- Active contract suite: 31/31 PASSED
- Phase 15 Security & Offline: 31/31 PASSED after cache token synchronization
- Version Single Source: PASSED
- Localization certification and lockdown: PASSED
- JavaScript syntax validation: PASSED through active suite and direct checks
