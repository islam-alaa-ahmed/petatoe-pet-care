# PETATOE Phase P1.3 — Long Task & Runtime Readiness Reduction

## Baseline
- Full source baseline inspected: `petatoe-pet-care-main (22).zip`
- P1.2.2 Desktop Smart Reports lazy-load hotfix was merged for cumulative verification only.

## Root Cause
The post-data-commit path performed filter population, dashboard KPI/chart/report rendering, and active records rendering synchronously inside the same canonical sales commit task. With 3,033 sales rows, the measured run showed one main-thread Long Task of 1,868 ms beginning immediately after authentication and around the canonical sales commit.

The diagnostics also kept `dashboardReadyMs` and `smartReportsReadyMs` as `null` because the actual successful render functions did not emit the readiness events consumed by the profiler.

## Production changes
1. `inline-extracted/legacy-application-core.js`
   - Defers the first dashboard UI commit to the next animation frame/task.
   - Keeps canonical rows, revision, status and committed event ownership unchanged.
   - Emits `petatoe:dashboard-rendered` after successful dashboard rendering.
2. `smart/smart-reports-runtime-controller.js`
   - Emits `petatoe:smart-reports-ready` only after a successful canonical Smart Reports render.

## Explicitly unchanged
- Supabase queries and SQL
- Authentication and permissions
- Report calculations and filters
- Payroll and treasury calculations
- Localization dictionary and visible UI text
- Desktop/mobile visual design
- Release version and release name

## Verification
- JavaScript syntax: PASSED
- P1.3 targeted contract: 5/5 PASSED
- Startup Gate single-source certification: PASSED
- Startup Runtime Measurement Harness: 16/16 PASSED
- Mobile Enterprise UI v10: 61/61 PASSED
- Enterprise Localization Certification: PASSED
- Runtime Translation Completion: PASSED
- Smart Reports single-controller certification: 9/9 PASSED
- Smart Reports event ownership certification: 7/7 PASSED
- Data-ready hydration contract: 13/13 PASSED

## Runtime verification required after deployment
Run a cold start and export a new diagnostics report. Expected validation:
- `dashboardReadyMs` is no longer `null`.
- After opening Smart Reports, `smartReportsReadyMs` is no longer `null`.
- Largest Long Task decreases from the measured 1,596–1,868 ms range.
