# PETATOE Phase 11 — Operations Data Policy

## Scope
Establish one explicit vehicle-data policy for current operations, historical reports, and administrative selectors without deleting or rewriting historical records.

## Root Cause
The operations runtime built vehicle filter options by merging active master/fleet vehicles with vehicle names extracted from historical sales and appointment rows. This allowed stopped or historical vehicles to appear in current-operation selectors and made current screens and historical reports follow the same data policy despite serving different purposes.

## Implemented Policy
- Current operations: active master vehicles only.
- Current-operation rows: rows assigned to inactive/historical vehicles are excluded when an authoritative active master list exists; unassigned rows remain visible.
- Historical operations reports and KPI filters: vehicle names come from the selected period's document dataset, including vehicles later stopped.
- Administrative assignment selectors: active master vehicles only.
- Permission vehicle scope remains applied after the policy selection.
- No historical appointment, invoice, or vehicle value was deleted or mutated.

## Canonical Owner
`operations/operations-vehicle-policy.js` exports `window.PETATOEOperationsVehiclePolicy` and owns the policy contract.

## Regression Protection
The operations readiness contract now requires the policy provider before the operations screen is considered ready. The module loads before `operations-legacy-engine.js`.

## Verification
- Phase 11 Operations Data Policy: 12/12 PASSED
- Phase 10 Permission Key Integrity: 14/14 PASSED
- Phase 9 Inventory Count Safety: 12/12 PASSED
- Phase 8 Filter / Export Parity: 12/12 PASSED
- Phase 7 Readiness Contract Hardening: 12/12 PASSED
- Phase 6 Navigation & Lazy Route Integrity: 14/14 PASSED
- Phase 5 Sales Runtime Decomposition: 15/15 PASSED
- Phase 4 Customer 360 Single Owner: 12/12 PASSED
- Phase 3 Smart Reports Runtime & Event Ownership: 12/12 PASSED
- Phase 2 Canonical Data Ownership: 9/9 PASSED
- Version Single Source: PASSED
- Startup Gate Single Source: PASSED
- JavaScript/MJS syntax: 409 files PASSED

## Live UAT Required
After deployment, verify that stopped vehicles do not appear in the current vehicle-operations screen, while the same stopped vehicle remains selectable in a historical report period containing its appointments.
