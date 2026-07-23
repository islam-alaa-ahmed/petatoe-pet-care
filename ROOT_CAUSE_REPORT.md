# PETATOE Phase 3B — Salesperson Assignment Model

## Root Cause

The commission engine selected the first active salesperson from `employees.sales` and applied that employee to every vehicle and every month. When no record existed, the engine created a hard-coded fallback employee named `قاسم`.

This produced a financial attribution risk because the selected employee was not required to be linked to the invoice, vehicle, or commission period.

## Responsible File

- `inline-extracted/commission-inline.js`

## Responsible Logic

- Legacy `salesPerson()` global selector.
- Sales commission branch inside `buildCalcForPeriod()`.
- Sales employee form stored only a name and active flag, without vehicle or period boundaries.

## Impact

- One salesperson could receive commissions for all vehicles.
- Missing salesperson assignments still produced commission through a hard-coded fallback.
- Two overlapping assignments could not be detected.
- The snapshot could certify a financially incorrect salesperson attribution.
