# PETATOE Mobile — Phase P2 Critical Script Boot Split

## Baseline
- Full baseline: `petatoe-pet-care-main (6)(1).zip`
- Phase P1 overlay applied before Phase P2.
- Release preserved: `PETATOE v10.0.25`
- Runtime token preserved: `10.0.25-navigation-runtime-isolation-c2-3`

## Root Cause
The mobile parser still synchronously loaded large report, sales, commission, print, and shared report UI modules before the application reached its interactive state. These modules were not required for authentication, the critical mobile shell, or the first visible screen.

## Scope
Only the mobile startup loading path was changed. Desktop keeps the original synchronous order because `registerOrWrite()` writes the original script tags on non-mobile viewports.

## Changes
- Moved 47 non-critical scripts into demand-loaded mobile groups:
  - `smartReports`
  - `reportsUI`
  - `sales`
  - `commission`
  - `printing`
- Added dependency ordering so feature groups load their shared report UI first.
- Added pointer-down prefetch.
- Added a click capture gate that waits for the required module group, then replays the original click once.
- Added panel and control mapping for reports, sales, commission, and printing.
- Did not change authentication, Supabase, service worker, routing ownership, business logic, localization content, desktop, or tablet behavior.

## Static Performance Result
- Blocking local scripts before Phase P2: 120
- Blocking local scripts after Phase P2: 73
- Blocking local JS before: approximately 2329.3 KB
- Blocking local JS after: approximately 1282.8 KB
- Parser-blocking reduction: 47 scripts / approximately 1046.5 KB

## Verification
- JavaScript syntax: PASSED
- Lazy local references: PASSED
- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Runtime Translation Completion: PASSED
- Smart Reports Translation Stability: PASSED — 11/11
- Mobile Enterprise UI v10 Certification: PASSED — 61/61

## Runtime Note
The package passed static and project certification checks. Final iPhone verification should confirm first-open timing and first-tap behavior for Smart Reports, Sales Invoices, Commissions, and PDF/Print actions under real Safari/PWA network and cache conditions.
