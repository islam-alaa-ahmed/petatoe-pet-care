# PETATOE Phase P1.2.2 — Desktop Smart Reports Lazy-Load Hotfix

## Root Cause
Phase P1.2 deferred the `smartReports` group on desktop. The CI compatibility hotfix then required `ensureGroup()` to delegate desktop calls to `waitForDesktopGroup(name)`. However, `waitForDesktopGroup()` only waited for providers that were never loaded, so the Smart Reports screen remained empty and refresh could not render reports.

## Fix
Updated `waitForDesktopGroup()` to:
- load registered deferred scripts sequentially on desktop;
- resolve declared dependencies first;
- wait for the provider readiness contract;
- emit the existing lazy-group readiness event;
- refresh the active module after successful loading;
- preserve retry/error state behavior.

The exact CI-required branch and SR1 runtime version remain intact.

## Modified File
- `performance/mobile-startup-loading-gate.js`

## Verification
- JavaScript syntax: PASSED
- Startup Gate Single Source Certification: PASSED
- Enterprise Localization Certification: PASSED
- Runtime Translation Completion: PASSED
- Smart Reports Public API: PASSED
- Smart Reports Translation Stability: PASSED
- Runtime Readiness Contract: PASSED
- Smart Reports Single Controller: PASSED
- Smart Reports Event Ownership: PASSED

## Scope Protection
No changes to business logic, report calculations, Supabase, SQL, authentication, permissions, visible text, localization dictionaries, release version, or UI design.
