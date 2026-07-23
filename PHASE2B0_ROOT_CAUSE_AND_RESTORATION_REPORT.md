# PETATOE v10 Commissions — Phase 2B.0
## Cumulative Baseline Restoration

## Root Cause
The Phase 1B.5 cumulative work tree retained the invoice-safety changes, but three Phase 1A snapshot-source changes had regressed:

1. `commission-inline.js` wrote snapshot state to the runtime cache and started the Supabase write without awaiting its result.
2. `payroll/payroll-core.js` embedded `commissionSnapshots` again inside the `payroll_master` singleton.
3. `payroll/payroll-read-facade.js` read snapshots again from the embedded payroll master payload.

This recreated two active snapshot sources and allowed lock/unlock success to appear before Supabase persistence was confirmed.

## Restored Architecture
Canonical snapshot source:

`payroll_master_data / commission_monthly_snapshots`

The active payroll master payload no longer stores `commissionSnapshots`. Payroll core and the read facade load the canonical singleton. A one-time legacy migration remains: when the canonical singleton is empty and legacy embedded snapshots exist, they are copied to the canonical singleton.

## Restored Persistence Safety
- Snapshot writes are awaited.
- Runtime snapshot cache is updated only after Supabase success.
- Previous cache is retained when persistence fails.
- Month lock/unlock report success only after confirmed persistence.
- Unlock restores the removed runtime snapshot when persistence fails.
- Snapshot update events refresh the payroll read facade.
- New snapshots include `schemaVersion`, `status`, and `lockedAt` metadata.

## Preserved Later Phases
The restoration was merged into the Phase 1B.5 cumulative tree without replacing later invoice-safety files. Confirmed present:

- Phase 1B.1 awaited manual create and double-submit guard.
- Phase 1B.2 atomic invoice replacement RPC path.
- Phase 1B.3 shared duplicate policy.
- Phase 1B.4 commission locked-period guard and Data Layer defense.
- Phase 1B.5 transactional full replace import RPC path.

## Modified Runtime Files
- `inline-extracted/commission-inline.js`
- `payroll/payroll-core.js`
- `payroll/payroll-read-facade.js`

No commission formulas, invoice calculations, payroll formulas, Operations logic, layout, or Supabase schema were changed.
