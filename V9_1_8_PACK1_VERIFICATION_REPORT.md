# PETATOE v9.1.8 — Legacy Localization Cleanup Pack 1

## Baseline

- `petatoe-pet-care(13).zip`
- PETATOE v9.1.7 Business Localization Pack 1
- PETATOE v9.1.7 Business Localization Pack 2

## Root Cause

The unified localization center was already available, but several feature modules still depended on global compatibility adapters. `businessDataT` was declared twice, and external modules called the global `smartReportT` helper owned by Smart Reports Core. This kept cross-module coupling and made later adapter removal unsafe.

## Implemented Cleanup

- Removed both global `businessDataT` adapter declarations.
- Migrated New Customers service rendering directly to `PETATOE_LOCALIZATION_CENTER.business()`.
- Migrated Smart Vehicles translation directly to `PETATOE_LOCALIZATION_CENTER.t()`.
- Migrated Sales Invoice tab localization directly to the unified center.
- Migrated Contract Candidates sales-invoice tab localization directly to the unified center.
- Preserved the internal `smartReportT()` helper inside Smart Reports Core because it is still the local module helper used extensively by that module.
- Preserved `PETATOE_I18N` because it remains the low-level dictionary/runtime engine used by the localization center; removing it is not yet safe.

## Verification

```text
Legacy Localization Cleanup Pack 1 Check: Passed
Removed global businessDataT adapters: 2
Migrated external smartReportT dependencies: 3
Migrated external businessDataT dependencies: 1
JavaScript Files Checked: 240
JavaScript Syntax Errors: 0
```

## Unchanged

- Database and Supabase schema
- Authentication and permissions
- Business calculations
- Smart Reports formulas and filters
- Payroll calculations and workflow
- Stored canonical business values
- DOM observer strategy and data loading behavior

## Remaining Cleanup

- Internal Smart Reports helper consolidation, after verifying all module-local calls.
- Review low-level `PETATOE_I18N` consumers and route feature-level callers through the localization center.
- Remove only demonstrably unused legacy translation utilities during the next cleanup pack.
