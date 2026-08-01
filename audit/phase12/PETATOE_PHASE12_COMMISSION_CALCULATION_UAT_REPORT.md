# PETATOE Phase 12 — Commission Calculation UAT & Snapshot Integrity

## Scope
Read-only calculation policy review plus targeted runtime corrections. No Supabase schema changes and no live data writes were performed.

## Confirmed root causes
1. Commission rows still read directly from `PETATOEDataSource`, bypassing the canonical read facade introduced in Phase 2.
2. Month locking used the currently selected vehicle filter, allowing a period-level snapshot to contain only one vehicle.
3. Snapshot reproduction called the normal calculation path, which returned the stored snapshot when the period was locked; this made reproducibility verification circular instead of recalculating from current source rows.
4. `financialAudit.eligibleNet` read a field that the eligibility summary does not produce (`eligibleNet` instead of `eligibleAmount`).

## Implemented changes
- Commission reads now prefer `PETATOERecordsReadFacade`.
- Month locking always calculates the complete selected period with no vehicle filter and ignores an existing snapshot while building the replacement candidate.
- Snapshot reproduction recalculates live source rows with `ignoreSnapshot:true`.
- Snapshot financial audit uses `eligibilitySummary.eligibleAmount`, retaining backward compatibility with historical `eligibleNet` fields.
- Added `PETATOECommissionCalculationUAT` read-only API for deterministic audit and diagnostics.
- Documented the current payment policy as accrual-based: all eligible invoice rows are included regardless of payment status. No payment-status exclusion rule was introduced because no approved business rule in the source defines one.

## Verified calculation policy
- Explicit `totalEx`, including zero and negative values, is authoritative.
- Otherwise net sales are `totalInc - tax`.
- Final fallback is `price * quantity - absolute discount`.
- Cancelled/voided/reversed rows are excluded.
- Refunds, returns, credit notes and negative values are negative adjustments.
- Zero-value rows are excluded.
- Flat tier rate applies to the full eligible vehicle amount.
- Tier boundaries are inclusive at 40,000 and 55,000; tier 3 begins above 55,000 for the default rules.

## Live UAT still required after deployment
- Compare a controlled month invoice by invoice with known expected totals.
- Lock a month while a vehicle UI filter is selected and confirm the snapshot still includes every vehicle in the month.
- Replace a locked snapshot after changing source data and confirm revision/hash/history update.
- Run `PETATOECommissionSnapshotCertification.reproduceSnapshot(period)` and confirm it reports whether current source data reproduces the locked financial material.
- Verify cancelled, refund, zero and negative rows in both Commission System and Commission Statement exports.

## Regression boundary
No commission rates, targets, Supabase queries, permissions matrix, visual layout, export format, or historical snapshot financial material schema was changed.
