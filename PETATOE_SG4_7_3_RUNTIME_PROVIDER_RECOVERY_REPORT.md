# PETATOE SG-4.7.3 — Runtime Provider Recovery

## Root causes
1. `exec-alerts-block.js` called `openPetClient360()` as an undeclared direct identifier while the Customer 360 runtime is lazy-loaded. The capture-phase handler threw before later handlers could run.
2. `smartSalesInvoices` existed in the Startup Gate contract, but `index.html` still registered both invoice files under the full `sales` group. Therefore the dedicated group had an empty queue and always returned `false` readiness.
3. Sequential hotfix packages overwrote `index.html`, restoring stale cache tokens for earlier Smart Reports fixes.

## Fixes
- Added safe Customer 360 hydration before opening and removed direct undeclared calls.
- Registered invoice report and print preview under `smartSalesInvoices`.
- Made full `sales` depend on `smartSalesInvoices` to preserve the full sales contract.
- Refreshed cache tokens for the effective SG-4.7/4.7.1/4.7.2 files.

## Verification
- SG-4.7.3 check: 8/8 passed.
- Startup Gate Single Source: passed.
- Smart Reports Single Controller: 9/9 passed.
- Smart Reports Event Ownership: 7/7 passed.
- Runtime Translation Completion: passed, 0 missing.
- JavaScript syntax: passed.
