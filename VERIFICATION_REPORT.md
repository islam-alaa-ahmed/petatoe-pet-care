# Verification Report — Phase 2B.1

## Implemented behavior

A canonical runtime API is now exposed as:

`window.PETATOECommissionEligibility`

It provides:
- `classify(row)`
- `eligibleRows(rows)`
- `summary(rows)`
- `netAmount(row)`

## Deterministic policy

- Normal positive sale: included as positive commission sales.
- Explicit zero amount: excluded; no fallback amount is substituted.
- Cancelled / void / reversed row: excluded with amount zero.
- Refund / return / credit note: included as a negative adjustment using `-abs(net amount)`.
- Unlabelled negative value: included as a negative adjustment.
- Missing `totalEx`: falls back to `totalInc - tax`, then `price × qty - abs(discount)` without clamping negatives.

Status detection is limited to status/type fields and explicit boolean flags; item names and customer names are not inspected, preventing false exclusions caused by ordinary descriptive text.

## Integration

- Live monthly calculations aggregate only classified eligible rows.
- Invoice counts use only contributing rows.
- Net sales per vehicle are rounded to two decimals after aggregation.
- Locked snapshots retain `eligibilitySummary` for reproducibility and audit context.
- Existing locked snapshot amounts are not recalculated or modified.

## Automated checks

- JavaScript syntax: PASSED.
- Eligibility classifier scenarios: 8 / 8 PASSED.
- Positive sale: PASSED.
- Explicit-zero preservation: PASSED.
- English cancellation: PASSED.
- Arabic cancellation: PASSED.
- Positive refund converted to negative adjustment: PASSED.
- Negative credit note remains negative: PASSED.
- Unlabelled negative value: PASSED.
- Negative fallback formula: PASSED.
- Eligibility summary totals: PASSED.
- Enterprise Localization Certification: PASSED (`missingStoredTexts: 0`, `missingCounterparts: 0`).
- Production Localization Lockdown: PASSED.
- Mobile Enterprise UI v10: 64 / 64 PASSED.

## Scope exclusions

This phase does not change:
- commission tiers or rates;
- employee/vehicle assignment logic;
- payroll formulas;
- invoice persistence;
- Supabase schema;
- Operations;
- UI layout.

A live Supabase write was not required because this phase changes only deterministic in-browser commission classification and snapshot metadata creation.
