# PETATOE Commissions — Phase 2B.4 Root Cause Report

## Baseline
`petatoe-pet-care-main (8).zip`, with the cumulative Phase 2B.3 commission file applied before this phase.

## Confirmed Root Cause
Commission snapshots stored financial totals and traceability, but had no cryptographic integrity proof, revision chain, actor metadata, or reproducibility API. Replacing a locked month overwrote the active snapshot without a verifiable link to the previous revision.

## Impact
- A stored snapshot could not be independently checked for later mutation.
- Re-locking a month had no revision number or previous-hash chain.
- Auditors could not prove that the current invoice data reproduces the locked result.
- Financial metadata was incomplete for certification purposes.

## Scope Implemented
Only `inline-extracted/commission-inline.js` was changed. Commission formulas, tiers, eligibility policy, employee/vehicle identity logic, traceability logic, payroll formulas, Operations, UI layout, and Supabase schema were not changed.
