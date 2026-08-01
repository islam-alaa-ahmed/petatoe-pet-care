# PETATOE Phase 5 — Sales Runtime Decomposition

## Baseline

Cumulative state through Phase 4, derived from `petatoe-pet-care-main (34).zip`.

## Confirmed root causes

1. The `sales` lazy group owned unrelated providers for entry, import, records, invoice reporting, manual invoice items, and contract candidates.
2. Every sales route could therefore wait for providers it did not use.
3. `sales/sales-invoice-report.js` and `sales/invoice-print-preview.js` exposed public globals without an explicit core/adapter ownership contract.
4. The root-level `invoice-manual-multi-items.js` was a stale duplicate capable of claiming the same delegation guards as the canonical file under `sales/`.
5. Mobile startup loading did not support dependency-only compatibility groups.

## Implemented architecture

### Scoped groups

- `salesShared`: duplicate policy.
- `salesCrud`: Supabase CRUD binding.
- `salesManualItems`: canonical manual invoice runtime.
- `salesEntry`: entry references, depending on shared, CRUD, and manual items.
- `salesImport`: import engine, depending on shared duplicate policy.
- `salesRecords`: dependency-only records readiness through the CRUD group.
- `salesContracts`: contract candidate report and its UI adapter.
- `salesAnalytics`: analytics route, depending only on reports UI.
- `smartSalesInvoices`: sales invoice core and print adapter.
- `sales`: compatibility aggregate only; no production route is mapped to it.

### Route mapping

- `entry` → `salesEntry`
- `import` → `salesImport`
- `records` → `salesRecords`
- `sales` → `salesAnalytics`
- `salesInvoices` / `salesInvoice` → `smartSalesInvoices`

### Sales invoice ownership

- Core owner: `sales/sales-invoice-report.js`
- Print/open/close adapter owner: `sales/invoice-print-preview.js`
- Compatibility globals remain delegates only.
- The invoice report mount is recovered only inside the canonical `salesInvoices` section; no tab or section is created dynamically.

### Duplicate neutralization

The root `invoice-manual-multi-items.js` is now a compatibility loader that requests `salesManualItems`. It no longer defines invoice functions or claims canonical delegation guards.

## Impact analysis

### Intentionally changed

- Lazy-load group registration.
- Sales route-to-group mapping.
- Sales readiness contracts.
- Sales invoice core and print adapter ownership metadata.
- Cache/build version through the centralized version manifest.

### Not changed

- Sales calculations.
- Import validation and duplicate rules.
- Supabase queries or writes.
- Record CRUD business rules.
- Invoice rendering calculations.
- Contract candidate calculations.
- UI styling or localization phrases.

## Regression results

- Phase 5 Sales Runtime Decomposition: 15/15 PASSED.
- Phase 4 Customer 360 Single Owner: 12/12 PASSED.
- Phase 3 Smart Reports Ownership: 12/12 PASSED.
- Phase 2 Canonical Data Ownership: 9/9 PASSED.
- Smart Reports Single Controller: PASSED.
- Smart Reports Event Ownership: PASSED.
- Read Adapter Isolation: 10/10 PASSED.
- Refresh De-duplication: 9/9 PASSED.
- Public API: PASSED.
- Startup Gate Single Source: PASSED.
- Version Single Source: PASSED.
- Enterprise Localization Certification: PASSED.
- Runtime Translation Completion: PASSED.
- JavaScript/MJS syntax: 402 files, 0 failures.

## Required browser UAT after deployment

1. Open Data Entry directly after cold reload; save, edit, and delete a test invoice.
2. Open Excel Import directly; test preview without committing production data.
3. Open Records directly; paginate, edit, and delete according to permissions.
4. Open Sales Analytics directly.
5. Open Sales Invoice Management from Smart Reports; preview, open, print, close, and reopen.
6. Open Contract Candidates from its normal route.
7. Repeat with warm cache and after service-worker update.
8. Confirm no lazy-group readiness errors in Console.

## GitHub Desktop Summary

`refactor: decompose sales runtime into route-scoped lazy groups`
