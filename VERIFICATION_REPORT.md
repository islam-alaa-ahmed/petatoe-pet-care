# Verification Report — Phase 3B

## Implemented Controls

- Removed the hard-coded salesperson fallback.
- Removed the global first-active salesperson selector.
- Added canonical `PETATOECommissionSalesAssignment` API.
- Added invoice-row salesperson identity priority when explicit salesperson fields exist.
- Added vehicle-and-period assignment registry fallback.
- Added ambiguity detection for conflicting invoice identities.
- Added ambiguity detection for overlapping registry assignments.
- Unassigned or ambiguous salesperson rows receive a zero sales commission rate.
- Added assignment source and status to result traceability and snapshots.
- Salesperson management now requires vehicle, start month, and optional end month.
- Added overlap prevention when saving employee assignments.
- Legacy global salesperson records remain visible as `legacy_unassigned` but are never used for financial calculation.

## Runtime Assignment Tests

- Vehicle-period registry assignment: PASSED
- Unassigned vehicle blocked: PASSED
- Explicit invoice salesperson priority: PASSED
- Conflicting invoice salesperson identities blocked: PASSED
- Result: 4 / 4 PASSED

## Static and Project Gates

- `node --check inline-extracted/commission-inline.js`: PASSED
- `node --check i18n/ar.js`: PASSED
- `node --check i18n/en.js`: PASSED
- `node --check i18n/localization-center/dictionary-store.js`: PASSED
- Enterprise Localization Certification: PASSED
  - missingStoredTexts: 0
  - missingCounterparts: 0
- Production Localization Lockdown: PASSED
- Mobile Enterprise UI v10 Certification: 64 / 64 PASSED

## Environment Limitation

No live Supabase write or browser end-to-end payroll cycle was executed in this environment. A staging smoke test should assign one salesperson per vehicle and period, recalculate a month, lock the snapshot, refresh, and verify the persisted `assignmentSource` and `assignmentStatus` fields.
