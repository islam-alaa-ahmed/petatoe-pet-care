# PETATOE SG-4.6.10 — Smart Reports Enterprise Certification

## Baseline

- Functional baseline: SG-4.6.9 Smart Reports Soft UI Dependency Fix.
- Scope: Smart Reports lifecycle, runtime ownership, render ownership, refresh de-duplication, event ownership, load order, repeated-open safety, and lazy-loader overlap.
- No Business Logic, Supabase query, calculations, UI design, localization, or permissions were modified.

## Final status

**PASSED WITH ONE NON-BLOCKING WARNING**

The Smart Reports lifecycle is functionally and architecturally stable after SG-4.6.9. All 25 SG-4.6.10 certification contracts passed.

## Certified contracts

1. Each critical Smart Reports asset is referenced exactly once.
2. Runtime Controller, Router, and Provider Registration use singleton guards.
3. `PETATOESmartReportsRuntime` has one canonical owner.
4. `PETATOESmartReportsRenderEngine` has one canonical owner.
5. Public open and refresh APIs are owned exclusively by the Runtime Controller.
6. The historical `renderSmartReports` bridge remains owned by the Router only.
7. `reportsUI` is no longer a blocking dependency of `smartReports`.
8. `reportsUI` remains an optional parallel dependency.
9. Router-owned hydration is non-blocking.
10. Remote refresh has one shared in-flight promise.
11. Repeated refresh requests are coalesced.
12. Duplicate committed revisions do not trigger a second render.
13. Runtime subscribes once to tab-change and committed-record events.
14. Read Adapter remains read-only.
15. Lazy Loading Enterprise does not execute critical Runtime assets.
16. Smart Reports Core remains candidate-only in the secondary lazy-loader.
17. All critical assets include cache-busting tokens.

## Regression checks executed

- SG-4.6.9 Soft UI Dependency: 5/5 PASSED.
- Smart Reports Fast Runtime: 9/9 PASSED.
- Smart Reports Public API: 9/9 PASSED.
- Smart Reports Single Controller: 9/9 PASSED.
- Smart Reports Event Ownership: 7/7 PASSED.
- Smart Reports Enterprise Runtime: 14/14 PASSED WITH WARNING.
- Smart Reports Idempotent Commit: 8/8 PASSED.
- Smart Reports Read Adapter Isolation: 9/9 PASSED.
- Smart Reports Refresh De-duplication: 9/9 PASSED.
- Startup Gate Single Source: PASSED.
- Startup Gate Stabilization: 31/31 PASSED.
- Mobile Enterprise UI v10: 61/61 PASSED.

## Non-blocking warning

Critical Smart Reports assets currently use several historical cache-token families:

- `smart-reports-core.js`: `10.0.25-runtime-restoration-b3`
- `smart-router.js`: `10.0.25-sg4-6-9-smart-reports-soft-ui-dependency-1`
- `smart-runtime-registration.js`: `10.0.25-smart-reports-sr3-registration`
- `smart-reports-runtime-controller.js`: `10.0.25-sg4-6-9-smart-reports-soft-ui-dependency-1`
- `smart-reports-read-adapter.js`: `10.0.25-smart-reports-sr5-4-read-adapter`

This does not currently break loading because each URL is individually versioned, but it prevents a clean single-release cache identity. Token unification should be performed only as a dedicated release step with APP_VERSION and certification locks updated together.

## Historical test note

`scripts/smart-reports-data-provider-check.js` still fails four legacy assumptions about a Data Provider ownership model that is not used by the current certified Read Adapter architecture. This was already present before SG-4.6.10 and was not modified in this certification phase.

## Certification conclusion

Smart Reports is approved for continued use on the SG-4.6.9 baseline. No functional hotfix is required after this certification. A separate cache-token reconciliation phase is recommended before declaring a warning-free Enterprise Baseline.
