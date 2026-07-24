# PETATOE v10.0.1 — Phase F1 Root Cause Report

## Baseline
`petatoe-pet-care-main (10).zip`

## Confirmed Root Causes

### 1. False success when Supabase is unavailable — High
Several payroll persistence functions returned `{ok:false, skipped:true}` when the Supabase repository/client was unavailable. Callers awaited a resolved promise and continued to display success or keep the optimistic cache state.

**Affected boundary:** `payroll/payroll-core.js`

**Fix:** A single `requirePayrollRepo()` persistence gate now rejects immediately with `PAYROLL_PERSISTENCE_UNAVAILABLE`. Financial mutations therefore enter the existing catch/rollback paths instead of reporting success.

### 2. Two operational sources for payroll slips — High
Payroll slips were read from both `payroll_slips` and `payroll_master_data.payrollSlips`, then merged. The legacy master copy could overwrite a newer canonical row or revive stale/deleted data.

**Fix:** `payroll_slips` is now the only operational source of truth. `master.payrollSlips` is ignored during load, and payroll slips are removed from the master payload.

### 3. Non-transactional dual writes — High
A single slip save/delete updated `payroll_master_data` and `payroll_slips` sequentially. A partial failure could leave the two sources inconsistent.

**Fix:** Slip create/update/delete now writes only to `payroll_slips`. `payroll_master_data` remains limited to payroll configuration (`jobTypes`, `employeeConfig`).

### 4. Release metadata drift — Medium
The baseline used different version identities across `package.json`, `RELEASE_VERSION.txt`, runtime metadata, README, and payroll module metadata.

**Fix:** The current release identity is synchronized to:

- Version: `10.0.1`
- Release name: `PETATOE_V10_0_1_CANONICAL_PAYROLL_PERSISTENCE`
