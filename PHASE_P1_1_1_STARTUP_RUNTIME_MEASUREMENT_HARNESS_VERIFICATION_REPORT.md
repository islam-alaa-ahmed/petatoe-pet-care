# PETATOE Phase P1.1.1 — Startup Runtime Measurement Harness

## Baseline

`petatoe-pet-care-main (20).zip`

## Scope

Instrumentation only. No business logic, Supabase query, SQL, authentication, permissions, report calculation, payroll calculation, layout, or localization behavior was changed.

## Root Cause

The existing startup profiler finalized about 1.2 seconds after the `load` event. Earlier field evidence showed important milestones could occur near 10 seconds, so the stored report could omit the actual data-ready, dashboard-ready, and Smart Reports-ready timings. It also lacked explicit LCP, canonical data-commit, session, Smart Reports readiness, and ranked resource-bottleneck fields.

## Implemented Changes

### `performance/startup-clean-profiler.js`

- Added explicit measurements for First Paint, FCP, LCP, DOM Interactive, shell readiness, session/auth readiness, identity readiness, canonical sales-data commit, dashboard readiness, and Smart Reports readiness.
- Added Long Task observation and aggregate totals.
- Added resource rankings for slowest resources, largest transfers, largest decoded resources, and resources spanning FCP.
- Replaced the early fixed finalization with:
  - snapshots 3 and 7 seconds after `load`;
  - finalization after core readiness settles; or
  - a 15-second fallback after `load`.
- Added non-UI APIs for retrieving, copying, downloading, persisting, and clearing the report.

### `index.html`

- Updated only the profiler cache token so browsers load the new instrumentation file.
- Script order was not changed.

## Runtime Use

After a cold start, the latest report is available through:

```js
PETATOEStartupDiagnostics.getReport()
```

Download it through:

```js
PETATOEStartupDiagnostics.downloadReport()
```

The latest persisted report is stored under:

```text
petatoe_startup_diagnostics_latest
```

## Verification

- JavaScript syntax: PASSED
- Startup Runtime Measurement Harness: 16/16 PASSED
- Startup Gate Single Source: PASSED
- Mobile Enterprise UI v10: 61/61 PASSED
- Enterprise Localization Certification: PASSED
- Runtime Translation Completion: PASSED

## Important Limitation

This phase installs and certifies the measurement harness. It does not invent browser timing numbers. Real performance values must be collected by running the deployed app from a cold start on the target device and exporting the generated JSON report.
