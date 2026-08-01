# PETATOE Phase 1A — Version Single Source Audit

Generated: 2026-08-01T01:03:30.050Z

## Summary

- Files scanned: 780
- Version occurrences: 445
- Unique version tokens: 83
- Aligned checks: 8
- Drift checks: 1

## Canonical values

- Release: v10.0.25
- Release name: PETATOE_V10_0_25_NAVIGATION_RUNTIME_ISOLATION_C2_3
- Build: 10.0.25-sg4-7-6-smart-reports-consolidated-regression-1
- Cache: 10.0.25-sg4-7-6-smart-reports-consolidated-regression-1
- Startup Gate contract: 10.0.25-sg4-6-9-smart-reports-soft-ui-dependency-1

## Alignment checks

| Check | Expected | Actual | Result |
|---|---|---|---|
| manifest.release.index | v10.0.25 | v10.0.25 | PASS |
| manifest.release.name.index | PETATOE_V10_0_25_NAVIGATION_RUNTIME_ISOLATION_C2_3 | PETATOE_V10_0_25_NAVIGATION_RUNTIME_ISOLATION_C2_3 | PASS |
| manifest.release.file | PETATOE v10.0.25 | PETATOE v10.0.25 | PASS |
| manifest.cache.serviceWorker | 10.0.25-sg4-7-6-smart-reports-consolidated-regression-1 | 10.0.25-sg4-6-9-smart-reports-soft-ui-dependency-1 | DRIFT |
| manifest.cache.startupGateUrl | 10.0.25-sg4-7-6-smart-reports-consolidated-regression-1 | 10.0.25-sg4-7-6-smart-reports-consolidated-regression-1 | PASS |
| manifest.contract.startupGate | 10.0.25-sg4-6-9-smart-reports-soft-ui-dependency-1 | null | PASS |
| manifest.native.latest | 10.0.0 | 10.0.0 | PASS |
| manifest.native.minimum | 10.0.0 | 10.0.0 | PASS |
| runtime.manifest.generated | generated from canonical JSON | 03649b1ee6b48533d85b43315ac50d841370f71bbe4209f434c2c97d1c8a1739 | PASS |

## Phase 1A decision

Phase 1A is audit-only. Detected drift is documented and intentionally not rewritten. Phase 1B will perform controlled synchronization after regression verification.
