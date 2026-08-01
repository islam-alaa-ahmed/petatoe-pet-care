# PETATOE Phase 9 — Inventory Count Safety

## Root Cause
The warehouse inventory report treated the computed book balance as an actual physical count:

- `actual = book balance`
- `difference = 0`
- `status = matched`

No physical count session, authoritative actual-count table, approved upload, or documented count source exists in the current frontend/schema contract. The report therefore asserted a match that was not supported by evidence.

## Implemented Safety Contract

- Book balances remain visible and unchanged.
- Actual balance and difference remain blank until an authoritative physical-count source exists.
- Every row is explicitly marked `not_counted`.
- CSV export uses the same safety state and does not output fabricated zero differences.
- `PETATOEWarehouseInventoryCount.hasAuthoritativeActualCount` is explicitly `false`.
- The screen displays a bilingual warning that no authoritative count session exists.

## Data Impact

- No warehouse transaction was changed.
- No balance was changed.
- No Supabase write or SQL migration was executed.
- No adjustment transaction was generated.

## Deferred Operational Extension
A future physical-count workflow requires a documented authoritative source containing at minimum: store, item, actual count, counted timestamp, counter identity, approval state, and notes. That extension must be delivered with a Supabase schema/RLS migration and UAT; it is intentionally not simulated in this safety phase.

## Regression Scope

- Warehouse balances and transaction calculations.
- Warehouse filters and CSV exports.
- Warehouse readiness contracts.
- Localization parity.
- Version single-source synchronization.
