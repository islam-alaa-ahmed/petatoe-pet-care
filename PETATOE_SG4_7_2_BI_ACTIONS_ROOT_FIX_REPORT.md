# PETATOE SG-4.7.2 — Business Intelligence Actions Root Fix

## Root Cause
The Business Intelligence tables rendered action buttons using visible text only (`Customer 360`, `فتح`, `متابعة`) without stable action attributes or customer identifiers. Their delegated handler attempted to infer the action from button text and the first table cell, then called `openPetClient360()` directly even though that function belongs to the lazy `customer360` runtime and may not yet be loaded.

The `عرض المزيد` action also triggered a render request that could be discarded while a prior idle render was still pending. No queued re-render was retained.

## Fix
- Added explicit `data-bi-customer-action` and `data-bi-client` attributes to all BI customer action buttons.
- Added a stable BI customer opener that hydrates the `customer360` group before opening the customer.
- Removed text-based action inference.
- Added queued render recovery for clicks received while BI rendering is pending.
- Invalidated the BI table cache before processing `عرض المزيد`.
- Added a dedicated cache token for the modified BI runtime file.

## Modified Files
- `index.html`
- `inline-extracted/bi-kpi-chart.js`
- `scripts/sg4-7-2-bi-actions-root-fix-check.js`

## Verification
- SG-4.7.2 BI Actions Root Fix: 9/9 passed
- Smart Reports Event Ownership: 7/7 passed
- Smart Reports Single Controller: 9/9 passed
- Runtime Translation Completion: passed, 0 missing phrases
- JavaScript syntax: passed
