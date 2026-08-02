# PETATOE Phase 13 — Payroll, Treasury & Obligations Enterprise UAT

## Baseline
Cumulative state through Phase 12.

## Confirmed root causes

1. Obligations mutations updated the in-memory cache, started Supabase persistence without awaiting the result, rendered success immediately, and had no rollback when persistence failed. Multiple rapid writes could race against the same singleton payload.
2. Permanent obligation deletion was exposed without the stronger `hard_delete` permission contract.
3. Treasury financial movements were durable before local commit, but audit persistence was fire-and-forget and could race or fail silently. Treasury report-derived rows still read sales data directly from `PETATOEDataSource` instead of the canonical records facade.
4. Payroll registered duplicate refresh listeners for the same identity and permission events on both `window` and `document`, allowing repeated renders. Payroll calculations, status transitions, deletion rules, rollback behavior, and filtered reports were otherwise internally consistent in the reviewed code.

## Implemented remediation

- Added a serialized obligations persistence queue and atomic mutation helper.
- Obligations now await Supabase success before displaying success, and restore the previous runtime snapshot on failure.
- Obligation data and movement audit entries are persisted in one singleton snapshot.
- Permanent obligation deletion now requires the existing `hard_delete` special permission and is hidden when unavailable.
- Treasury audit writes are serialized and awaited as part of each financial action's completion path. A committed financial transaction is not rolled back solely because the secondary audit write fails; the failure is logged for diagnostics.
- Treasury sales-derived data now reads through `PETATOERecordsReadFacade`, with the previous source retained only as compatibility fallback.
- Removed duplicate payroll document-level identity/permission refresh listeners.
- Added `PETATOEPayrollEnterpriseUAT` for deterministic calculation, reporting, deletion, and transition checks.

## Preserved contracts

- Payroll gross/net formula and commission snapshot linkage were not changed.
- Payroll deletion remains limited to `draft` and `pending_board`.
- Treasury invoice-generated movements remain non-editable and non-deletable.
- Treasury filter/export parity from Phase 8 remains intact.
- Obligations soft delete, restore, payment renewal, and filtered Excel export remain intact.
- No Supabase schema, RLS, CSS, or UI layout changes were made.

## Verification

- Phase 13 check: 15/15 passed.
- Phase 2–12 regression checks: all passed.
- JavaScript/MJS syntax: 411/411 passed.
- Enterprise Localization Certification: passed; 3,567 Arabic and 3,567 English entries; zero missing counterparts.
- Runtime Translation Completion: passed; zero missing runtime phrases.

## Live UAT still required

1. Save, edit, pay, unpay, pause, delete, restore, and permanently delete an obligation while online.
2. Repeat one obligation write with the network blocked and confirm rollback and no false success.
3. Create, edit, and delete treasury manual movements and verify the audit record after reload.
4. Verify invoice treasury movements remain protected.
5. Exercise the complete payroll workflow and verify state persistence after reload.
