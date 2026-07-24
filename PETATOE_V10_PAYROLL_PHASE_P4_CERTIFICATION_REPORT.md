# PETATOE v10 — Payroll Phase P4 Certification Report

## Scope
Phase P4 — Supabase Staging & End-to-End Payroll Certification.

Baseline assembled from `petatoe-pet-care-main (9).zip` plus the accepted cumulative hotfix overlays through Payroll Phase P3.

## Execution status

### Completed locally
- Full JavaScript/MJS syntax validation.
- Enterprise Localization Certification.
- Production Localization Lockdown.
- Runtime Translation Completion.
- Payroll localization source validation.
- Mobile Enterprise UI v10 certification.
- Native iOS static certification.

### Not executable from this environment
Live Supabase staging writes, RLS validation with real users, forced network-failure rollback, and end-to-end payment workflow transactions. No production or staging database was modified.

## Automated results

| Gate | Result |
|---|---|
| JavaScript/MJS syntax | PASS — 317/317 |
| Enterprise localization | PASS — 0 missing stored texts, 0 missing counterparts |
| Production localization lockdown | PASS |
| Runtime translation completion | PASS — 0 missing runtime phrases |
| Payroll localization source | PASS |
| Mobile Enterprise UI v10 | PASS — 64/64 |
| Native iOS static certification | PASS — 27/27 |

## Mandatory live staging scenarios

1. **Employee persistence**
   - Create an employee without a linked user.
   - Refresh and confirm the linked-user column remains “Not linked”.
   - Edit the employee and confirm the change persists.
   - Attempt to delete an employee with historical slips and confirm deletion is blocked.

2. **Authorization separation**
   - Admin/Payroll Manager can create and edit payroll records.
   - User without payroll permission cannot mutate employee, configuration, jobs, drafts, approvals, or payment status.
   - Chairman approval is accepted only by the stable role/permission path, never by display name or job title.

3. **Awaited persistence and rollback**
   - Save employee/config/job/slip while online; refresh and verify persistence.
   - Simulate a failed Supabase request; confirm no success message and the UI state returns to the previous value.

4. **Certified commission link**
   - Lock a certified commission snapshot.
   - Create/save a salary slip and record snapshot ID, hash, revision, and frozen commission amount.
   - Replace the commission snapshot with a new revision.
   - Refresh payroll; confirm the existing slip’s commission and net salary do not change.

5. **Approval audit trail**
   - Board approval, employee approval/objection, accounts approval, rejection, payment, and approval cancellation.
   - Confirm actor, timestamp, reason/reference, previous status, and new status are persisted after refresh.

6. **Payment method**
   - Confirm Arabic display is `مدد` and English display is `Mudad`.
   - Confirm legacy stored value remains compatible and reports/filters still work.

7. **RLS and direct API attempts**
   - Attempt unauthorized insert/update/delete against payroll master data and slips.
   - Confirm Supabase rejects all unauthorized mutations even when UI controls are bypassed.

## Financial reconciliation
For one certified month verify:

`Frozen commission + base salary + allowances + additions - deductions - advances = net salary`

The same values must match the payroll list, salary statement, exports, and persisted Supabase row after refresh.

## Decision
**CONDITIONAL NO-GO** for final Production certification until the mandatory live Supabase/RLS scenarios above pass.

The local static and repository gates are clean. No remaining static blocker was detected in this phase.
