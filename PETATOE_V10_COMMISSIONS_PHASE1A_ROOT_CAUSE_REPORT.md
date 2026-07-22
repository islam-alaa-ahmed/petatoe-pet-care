# PETATOE v10 — Commissions Phase 1A Root Cause Report

## Baseline
`petatoe-pet-care-main (7).zip`

## Scope
Single Commission Snapshot Source only. No commission formulas, invoice logic, UI design, Supabase schema, Operations, or payroll approval workflow changes.

## Confirmed Root Cause
The commissions module wrote monthly snapshots to:

- Table: `payroll_master_data`
- Row ID: `commission_monthly_snapshots`

Payroll loaded snapshots from a different payload:

- Table: `payroll_master_data`
- Row ID: `payroll_master`
- Property: `commissionSnapshots`

Therefore the commission archive and payroll could read different versions of the same month. Payroll master saves could also overwrite their embedded snapshot copy independently.

## Implemented Boundary
The canonical source is now:

- Table: `payroll_master_data`
- Row ID: `commission_monthly_snapshots`

The commission archive, payroll core, payroll read facade, and computed payroll facade now converge on that source. The computed facade continues to consume the read facade cache, which is hydrated from the canonical row.

## Legacy Migration
When the canonical row is empty and the old `payroll_master.commissionSnapshots` payload contains data, payroll migrates that payload once into the canonical row before using it. This protects existing historical months without keeping the old field as an active source.

## Persistence Safety
Month lock and unlock now wait for the Supabase save result before displaying success. On failure, the runtime cache is restored and an error is shown.

## Snapshot Metadata
Newly locked months include:

- `schemaVersion: commission-snapshot-v1`
- `status: locked`
- `lockedAt` as ISO timestamp
- existing historical calculation rows and totals
