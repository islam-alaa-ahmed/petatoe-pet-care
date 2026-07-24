# PETATOE Payroll — Pending Board Delete Hotfix

## Root Cause
The delete handler in `payroll/payroll-core.js` allowed permanent deletion only when `status === 'draft'`.

A salary slip sent to the Board but not yet approved has status `pending_board`. The UI correctly displays it as "بانتظار اعتماد رئيس مجلس الإدارة", but the delete handler treated every non-draft status as already approved and blocked deletion.

## Responsible Code
- File: `payroll/payroll-core.js`
- Function: `PETATOEPayroll.deleteSlip(id)`

## Impact
Unapproved salary slips could not be removed, even though no Board approval, employee approval, accounts approval, or payment had occurred.

## Fix
Allow deletion only for the two pre-approval statuses:
- `draft`
- `pending_board`

All genuinely approved or financial states remain protected.
