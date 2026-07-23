# Phase 3A — Payroll ID Integration

## Baseline
- `petatoe-pet-care-main (8).zip`
- Prerequisite overlay: `PETATOE_V10_COMMISSIONS_SNAPSHOT_CERTIFICATION_PHASE2B4.zip`

## Root Cause
Payroll commission calculation matched commission snapshot rows through display names, `commissionEmployeeName`, and textual aliases. Names are mutable and non-unique, so renaming an employee or creating two employees with the same name could link commission to the wrong payroll employee.

## Fix
- Added identity-key collection for payroll employees.
- Payroll now matches modern commission snapshots by `employeeId` / `personId` only.
- Accepts the payroll employee ID, linked user ID, Supabase ID, or an explicit `commissionEmployeeId` as stable identities.
- Modern identity-aware snapshots reject unresolved/name-only rows rather than falling back to names.
- Name matching remains available only for old snapshots that predate identity metadata.
- Commission details now expose the matched employee and vehicle IDs for auditability.

## Scope Boundary
No payroll formulas, approval workflow, Supabase schema, commission tier logic, Operations logic, or UI layout was changed.
