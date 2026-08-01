# PETATOE Phase 7 — Readiness Contract Hardening

## Baseline

- PETATOE `petatoe-pet-care-main (34)`
- Phase 0, Phase 1A, Phase 1B, Phase 0.5, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6 merged in order.

## Root cause

Several lazy groups used a single Boolean readiness contract that mixed first-render requirements with shadow bridges, diagnostics, and later enhancements. In payroll, treasury, and warehouses, the previous contracts could report ready when the core renderer existed although the read/computed/view-model facades used by the first screen were still loading. Conversely, making all diagnostic providers mandatory would unnecessarily block the route.

The dashboard also performed its first visual render without a bounded localization readiness check, allowing a short first-paint window before localization completion.

## Changes

### Required / optional / deferred contract tiers

`performance/mobile-startup-loading-gate.js` now separates readiness into:

- **Required**: blocks first render and includes only providers needed for the initial screen.
- **Optional**: enhancement providers reported in diagnostics but not route-blocking.
- **Deferred**: audit, event bridge, validation, and shadow providers that never hold the route hostage.

The public diagnostics API now exposes:

```js
PETATOEMobileStartupGate.getReadinessProfile(group)
```

and readiness snapshots include the three-tier profile.

### First-render contracts strengthened

- Payroll requires core API + Read Facade + Computed Facade + View Model Facade.
- Treasury requires core API + Read Facade + Computed Facade + View Model Facade.
- Warehouses require core UI + Read Facade + Computed Facade + View Model Facade.
- Existing Smart Reports, Operations, Children Expenses, Settings, Customer 360, Sales, and Commission required contracts remain scoped to their actual first-render APIs.

### Dashboard localization first paint

`core/dashboard-critical-boot.js` waits for localization readiness only at the final render boundary, with a maximum wait of 900 ms. Data loading and form construction continue in parallel. Both localization readiness events are supported, and a diagnostic event is emitted:

```text
petatoe:dashboard-localization-readiness
```

This avoids an unbounded startup dependency while reducing raw-key first paint.

## Impact boundaries

No changes were made to:

- Supabase queries or writes
- report calculations
- filter logic
- navigation routes
- CSS or visual design
- permissions
- payroll, treasury, warehouse, operations, or Smart Reports business logic
- runtime compatibility contract versions

## Verification

- Phase 7 Readiness Contract Hardening: 12/12 PASSED
- Startup Gate Single Source: PASSED
- Version Single Source: PASSED
- Runtime Readiness Contract: 9/9 PASSED
- Smart Reports Single Controller: 9/9 PASSED
- Smart Reports Event Ownership: 7/7 PASSED
- Phase 6 Navigation: 14/14 PASSED
- Phase 5 Sales Runtime: 15/15 PASSED
- Phase 4 Customer 360: 12/12 PASSED
- Phase 3 Smart Reports Ownership: 12/12 PASSED
- Phase 2 Canonical Data Ownership: 9/9 PASSED
- Enterprise Localization Certification: PASSED
- Runtime Translation Completion: PASSED
- JavaScript/MJS syntax: 404/404 PASSED

## Browser UAT still required after deployment

- Cold-cache first open for Dashboard, Payroll, Treasury, Warehouses, Operations, Settings, Children Expenses, and Smart Reports.
- Warm-cache reopen.
- Slow-network test to confirm optional/deferred providers do not block routes.
- Verify dashboard displays translated labels on first visual render.
- Inspect `PETATOEMobileStartupGate.getReadinessProfile(group)` for the active route.
