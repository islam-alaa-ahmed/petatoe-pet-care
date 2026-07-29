# PETATOE Phase P1.2 — Enterprise Startup Decomposition

## Baseline
- Full source: `petatoe-pet-care-main (20).zip`
- P1.1.1 instrumentation overlay applied before this phase.

## Root Cause
The desktop startup path called `registerOrWrite()` for every feature group and the gate immediately emitted all registered scripts with `document.write()`. The same gate already had demand-loading behavior for mobile, but desktop bypassed it through `waitForDesktopGroup()`. As a result, cold modules such as Operations, Smart Reports, Payroll, Treasury, Warehouses, Children, Settings, Diagnostics and XLSX entered the initial resource waterfall even when the user opened only the dashboard.

## Implementation
- Added an explicit desktop lazy-group policy.
- Reused the existing ordered group loader rather than adding a second runtime.
- Enabled the existing pointer/click/tab hydration triggers on desktop.
- Kept dashboard/report UI critical ownership unchanged.
- Converted direct non-critical Settings, Children and Sales script tags to the canonical gate.
- Updated only the gate cache token; release version and release name were not changed.

## Modified Files
- `index.html`
- `performance/mobile-startup-loading-gate.js`
- `scripts/startup-decomposition-check.js`

## Verification
- JavaScript syntax: PASSED
- Startup decomposition static contract: 12/12 PASSED
- Mobile Enterprise UI v10 certification: 61/61 PASSED
- Enterprise Localization Certification: PASSED
- Runtime Translation Completion: PASSED

## Runtime Safety
No changes were made to business calculations, Supabase queries, SQL, authentication, permissions data, report formulas, payroll calculations, or localization text.

## Required Runtime Acceptance Test
After publishing, collect a new cold-start profiler report and compare:
- resourceCount
- FCP/LCP
- longTaskCount and totalLongTaskMs
- shellReadyMs/sessionReadyMs/dataReadyMs
- first opening of Operations, Smart Reports, Payroll, Treasury, Warehouses, Children and Settings
