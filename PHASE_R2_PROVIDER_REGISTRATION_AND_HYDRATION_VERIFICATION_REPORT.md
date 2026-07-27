# PETATOE Phase R2 — Provider Registration & Hydration

## Baseline
- Current baseline: petatoe-pet-care-main (17).zip
- Applied on top of Phase R1 modified files.
- Release unchanged: v10.0.25.

## Confirmed root cause
Desktop consumers were present and calling Smart Reports / Payroll APIs, but the provider globals were not guaranteed to exist at call time. R1 only waited for readiness; it did not recover when the provider script itself had never registered.

Observed missing providers:
- window.smartServicesScopedData
- window.PETATOEPayroll (openTab, renderSalarySlip, exportCsv)

## Implemented changes
1. performance/mobile-startup-loading-gate.js
   - Added targeted desktop provider fallback loading for Smart Reports and Payroll.
   - Fallback starts only when the expected provider is still missing after 250ms.
   - It does not change mobile lazy loading.
   - It keeps the 6-second bounded readiness deadline.

2. smart/smart-services.js
   - Added explicit global provider registration for Smart Services public functions.
   - Added petatoe:smart-services-ready event.

3. payroll/payroll-core.js
   - Added petatoe:payroll-provider-ready event after PETATOEPayroll registration.

## Scope protected
No changes to:
- Business logic
- Calculations
- Supabase / SQL / queries
- Auth / permissions
- UI design
- Release number/name

## Verification performed
PASSED:
- JavaScript syntax checks for all modified JS files
- Mobile Enterprise UI v10 certification: 61/61
- Enterprise Localization Certification
- Production Localization Lockdown
- Runtime Translation Completion
- Smart Reports Public API
- Smart Reports Fast Runtime
- Smart Reports Fast Readiness Path
- Smart Reports Translation Stability

## Runtime note
Browser runtime must still be verified after deployment by testing Smart Reports and Payroll on desktop and reviewing Console. Static and certification checks passed, but live GitHub Pages execution was not available in the local container.
