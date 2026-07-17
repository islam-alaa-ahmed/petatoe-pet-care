# PETATOE v9.2.9 — Source Migration Pack 8

## Baseline

- `petatoe-pet-care(15).zip`
- Cumulative localization baseline through PETATOE v9.2.8 Pack 7

## Root Cause

The Operations dashboards, appointment details popover, vehicle execution reports, and Operations KPI dashboard were still rebuilding Arabic UI literals directly during runtime. Any filter change, report refresh, KPI refresh, or appointment-table rerender could therefore replace previously translated English content with Arabic.

## Implemented Changes

- Routed appointment KPI cards and dynamic filter labels through `opT()`.
- Added source-level status display localization while preserving Arabic status values internally for workflow compatibility.
- Localized appointment details popover sections, labels, notes, footer, and action buttons.
- Localized vehicle report filters, summary cards, table headers, empty states, totals, payment distribution, and delay report.
- Localized Operations KPI summary cards, KPI cards, payment distribution, quality indicators, performance tables, and empty states.
- Added locale-aware minute/hour duration labels.
- Extended the Arabic and English Operations dictionaries with 125 dashboard/report/KPI keys.
- Added Pack 8 regression coverage and made the Pack 7 cache-token guard forward-compatible.

## Verification

```text
Source Migration Pack 8 Check: Passed
Operations dashboard/report/KPI keys covered: 125
Operations runtime keys currently used: 224
Arabic characters in English Operations dictionary: 0
Automated source checks: 20 passed / 0 failed
JavaScript files checked: 257
JavaScript syntax errors: 0
```

## Safety Boundary

No changes were made to:

- appointment workflow status values
- financial calculations
- vehicle execution calculations
- storage schema
- Supabase or database logic
- authentication or permissions
- payroll or report calculation formulas
