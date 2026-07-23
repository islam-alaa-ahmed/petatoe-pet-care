# PETATOE v10 — Commissions Phase 2B.1
## Commission Eligibility Classifier — Root Cause Report

## Baseline
`petatoe-pet-care-main (8).zip`

## Confirmed root causes

1. `rowNetSales()` treated an explicit `totalEx = 0` as if the field were missing, then fell back to `totalInc - tax` or `price × qty - discount`. The same invoice line could therefore produce a different commission amount depending on which fields were populated.
2. The fallback formula forced negative values to zero using `Math.max(0, ...)`, so a return/credit represented through price, quantity, and discount could disappear instead of reducing eligible sales.
3. Commission aggregation accepted every monthly sales row without an explicit eligibility decision for cancelled, voided, reversed, refunded, returned, or credit-note records.
4. There was no canonical API shared by live calculation and snapshot creation to explain why a row was included, excluded, or treated as a negative adjustment.

## File responsible
`inline-extracted/commission-inline.js`

## Functions affected
- `rowNetSales()`
- `sumNetByCar()`
- `buildCalcForPeriod()`
- `commissionLockMonth()` snapshot payload

## Impact before the fix
- Cancelled or voided invoices could contribute to commission sales.
- Refunds and credit notes could be added as positive sales or ignored depending on their stored amount sign.
- Explicit zero values could be replaced by a fallback amount.
- Negative fallback values could be silently clamped to zero.
- The monthly snapshot did not retain a summary of included/excluded commission source rows.
