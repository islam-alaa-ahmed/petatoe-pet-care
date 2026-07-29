# PETATOE v10.0.25 — Phase SR5.1 Event Ownership Cleanup

## Scope

Isolate ownership of the sales data lifecycle without changing Smart Reports calculations, Supabase queries, bootstrap order, permissions, or visual design.

## Confirmed root cause addressed

The raw `petatoe:records-changed` event had two owners:

1. `inline-extracted/legacy-application-core.js` scheduled the canonical commit into the lexical `records` array.
2. `smart/smart-reports-runtime-controller.js` committed the same runtime rows immediately and requested a render.

This allowed one DataSource event to cause an immediate commit/render followed by another delayed commit, creating duplicate work and unstable timing.

## Implementation

### Canonical bridge

`petatoeApplyCanonicalSalesRows()` now emits:

`petatoe:sales-records-committed`

only after the canonical legacy `records` array and source status have been updated.

The event includes:

- `reason`
- `source`
- committed row count
- canonical source status

### Smart Reports controller

The controller no longer listens to raw `petatoe:records-changed`.

It listens only to `petatoe:sales-records-committed`, and when Smart Reports is open it requests a render using a sync-bypass path. This prevents the post-commit render from committing the same rows again.

A committed event received while another Smart Reports lifecycle request is active is ignored because that active request will perform its own final render.

## Files modified

- `inline-extracted/legacy-application-core.js`
- `smart/smart-reports-runtime-controller.js`
- `scripts/smart-reports-single-controller-check.js`
- `scripts/data-ready-screen-hydration-contract-check.js`
- `scripts/smart-reports-event-ownership-check.js` (new)
- `.github/workflows/localization-lockdown.yml`

## Verification

- Smart Reports event ownership certification: PASSED (7/7)
- Smart Reports single-controller certification: PASSED (9/9)
- Data-ready hydration contract: PASSED (13/13)
- Startup Gate Single Source: PASSED
- Runtime Readiness Contract: PASSED (9/9)
- Smart Reports Public API: PASSED
- Smart Reports Translation Stability: PASSED (11/11)
- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Runtime Translation Completion: PASSED
- Mobile Enterprise UI v10: PASSED (61/61)
- JavaScript syntax validation: PASSED for all JavaScript files

## Explicit non-changes

No changes were made to:

- Smart Reports calculations
- Supabase tables, SQL, RPCs, or queries
- Payroll
- Authentication or permissions
- Desktop or mobile visual design
- Official release number or release name
- Bootstrap script order

## Runtime acceptance checks

1. Open Smart Reports from a cold start.
2. Keep Smart Reports open while sales data refreshes.
3. Confirm one post-commit render occurs after canonical rows are ready.
4. Press Smart Reports Refresh once and confirm only one visible refresh lifecycle.
5. Confirm no `ReferenceError`, readiness failure, or duplicate render loop appears in Console.
