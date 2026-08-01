# PETATOE Phase 6 — Navigation & Lazy Route Integrity

## Baseline

Cumulative state through Phase 5, originating from `petatoe-pet-care-main (34).zip`.

## Confirmed root causes

1. `navigation/navigation.js` preserved `appointmentsSubTab` but did not forward the clicked button's `data-pet-nav-screen` to the router.
2. Mobile navigation schema direct activation also dropped the functional screen identity.
3. Navigation-state restoration stored the panel and sub-tab, but not the canonical functional screen identity.
4. Router permission checks used `tabId` rather than the functional permission screen.
5. Router-owned hydration only covered `smart`; programmatic/restored routes depended on a later `tabchange` side effect.
6. Startup Gate had no explicit mappings for `executive`, `vans`, and `services`.
7. Smart Reports menu active-state matching could activate both Smart Reports buttons when `smartOpen` was empty.

## Changes

- Forward `navigationScreen` from canonical desktop navigation and mobile schema.
- Persist and restore `navigationScreen` in navigation state.
- Apply permission checks using the normalized functional screen identity.
- Reset route intent safely when permission fallback opens Dashboard.
- Export `groupForRoute()` and `ensureRoute()` from Startup Gate.
- Make Router request non-blocking hydration for every route through Startup Gate.
- Add mappings:
  - `entry -> salesEntry`
  - `import -> salesImport`
  - `records -> salesRecords`
  - `executive -> smartReports`
  - `vans -> reportsUI`
  - `services -> reportsUI`
- Make Smart Reports navigation active-state use exact `smartOpen` matching.
- Add navigation assets to centralized cache-version synchronization.

## Explicitly unchanged

- Screen business logic and calculations.
- Supabase reads and writes.
- Report datasets and filters.
- CSS and screen layout.
- Permissions matrices and role definitions.
- Runtime contracts other than the recorded navigation intent contract.

## Verification

- Phase 6 Navigation & Lazy Route Integrity: 14/14 PASSED.
- Version Single Source: PASSED.
- Startup Gate Single Source: PASSED.
- Phase 5 Sales Runtime Decomposition: 15/15 PASSED.
- Phase 4 Customer 360 Single Owner: 12/12 PASSED.
- Phase 3 Smart Reports Ownership: 12/12 PASSED.
- Phase 2 Canonical Data Ownership: 9/9 PASSED.
- JavaScript/MJS syntax: 403 files, 0 failures.
- Runtime Translation Completion: PASSED, 0 missing runtime phrases.

## Browser UAT still required after deployment

1. Open each Operations screen and confirm panel, title, active menu, and sub-tab match.
2. Open `entry`, `import`, `records`, `executive`, `vans`, and `services` from menu and programmatic links.
3. Refresh each route and confirm last-screen restoration.
4. Test mobile navigation schema activation.
5. Test unauthorized route fallback without loading or displaying the blocked screen.
6. Test cold cache, warm cache, and Service Worker update.
