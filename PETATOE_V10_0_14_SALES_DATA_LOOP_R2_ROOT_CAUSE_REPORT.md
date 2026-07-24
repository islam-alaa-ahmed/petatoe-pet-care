# PETATOE v10.0.14 — Phase R2 Root Cause Report

## Confirmed Root Cause

The mobile sales data path contained a closed refresh loop:

1. `data/data-source.js` loaded all rows from Supabase.
2. `setRuntimeRecords()` emitted `petatoe:records-changed`.
3. `index.html` handled that event by calling `petatoeSyncSalesRecordsFromDataSource()`.
4. That function performed another complete `readSalesRecords()` request.
5. It committed the result back through `setRuntimeRecords()`, emitting the same event again.

The same application also started a second independent full read from `window.load`, creating duplicate startup requests before the loop was considered.

## Additional Confirmed Cost

The canonical DataSource refresh used all columns and allowed concurrent callers. This increased transfer size and allowed overlapping requests after CRUD/import/manual operations.

## Scope of Fix

- Removed the second `window.load` startup read.
- Changed `petatoe:records-changed` handling to render from the already committed runtime cache only.
- Prevented runtime-cache application from committing back into DataSource and re-emitting the event.
- Added one shared in-flight Supabase sales request.
- Added a 3-second freshness guard for non-forced duplicate reads.
- Limited the canonical sales query to the fields required by the mapper and reports.
- Preserved explicit forced refresh for manual, save, import, delete, replace and CRUD flows.

## Files Responsible

- `data/data-source.js`
- `index.html`

## Not Changed

- Supabase schema or SQL
- Sales calculations
- Dashboard KPI formulas
- CRUD semantics
- Import semantics
- Permissions or security
- Desktop/mobile visual design
