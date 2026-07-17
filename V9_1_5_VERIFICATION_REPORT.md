# PETATOE v9.1.5 — Payroll Localization Foundation Pack 5

## Baseline
Cumulative PETATOE v9.1.4 workspace.

## Root Cause
Payroll runtime still generated locale-sensitive values directly from Arabic arrays and literals. This affected month names, payment methods, employee statuses, payroll approval statuses, and persistence error messages. Changing the application language did not explicitly rerender the payroll views.

## Implemented
- Added `payrollLang()` and `payrollT()` adapters routed through `PETATOE_LOCALIZATION_CENTER`.
- Routed payroll month display through `PETATOE_LOCALIZATION_CENTER.monthName()`.
- Localized payment method labels and the all-payment-methods option.
- Localized employee lifecycle statuses.
- Localized payroll approval workflow statuses.
- Localized Supabase persistence failure messages.
- Added payroll rerender on `petatoe:language-changed`.
- Added Arabic and English `payrollRuntime` dictionaries.
- Added a payroll localization regression guard.
- Synchronized release metadata and payroll cache-busting reference.

## Verification
- `node --check payroll/payroll-core.js`: passed.
- `node --check i18n/ar.js`: passed.
- `node --check i18n/en.js`: passed.
- `node scripts/payroll-localization-source-check.js`: passed.
- Full JavaScript syntax check: 237 files checked, 0 syntax errors.

## Scope Safety
No payroll calculations, approval transitions, Supabase table names, permissions, authentication, commission matching, or salary formulas were changed.

## Remaining Payroll Localization Work
The full payroll screen still contains direct Arabic templates in form labels, table headers, buttons, empty states, validation messages, and salary-slip content. Those should be migrated in follow-up packs before legacy adapter removal or final certification.
