# Root Cause Report — Phase 2B.3

## Confirmed root cause

The commission engine stored aggregate results per employee and vehicle, but did not persist the invoice and invoice-line contributions that produced each result. The eligibility classifier could determine whether a row contributed, and the identity layer could resolve employee and vehicle IDs, yet no canonical trace record linked those decisions to the calculated commission or the locked snapshot.

## Impact

- A commission amount could not be reconciled to its contributing invoice lines.
- Excluded rows did not have a persisted exclusion reason inside the snapshot.
- Payroll and later audit screens had no stable reference to request trace details.
- Historical snapshots contained totals but lacked financial evidence at invoice-line level.

## Limited fix

A canonical `PETATOECommissionTraceability` API was added inside the existing commission engine. It creates deterministic trace IDs, resolves invoice and line references, stores eligibility decisions, links stable employee and vehicle identities, calculates each line's commission contribution, and persists traceability in newly locked snapshots.

No commission tier, eligibility, payroll, Operations, UI layout, or Supabase schema was changed.
