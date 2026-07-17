# PETATOE v9.1.6 — Enterprise UI Localization Pack 8

## Baseline
- `petatoe-pet-care(13).zip`
- cumulative Pack 6 and Pack 7 payroll localization changes

## Root Cause
Payroll configuration, archive, monthly report, employee self-service salary slip, objections log, and several remaining workflow messages still rendered Arabic literals directly from `payroll/payroll-core.js`. These strings bypassed `PETATOE_LOCALIZATION_CENTER`, so English mode could still display Arabic or mixed-language content.

## Implemented Scope
- Employee-code configuration labels, actions, and status messages.
- Job-type configuration tabs, forms, table headings, empty states, and validation.
- Payroll configuration shell title.
- Archive filters, labels, current/archive titles, table headings, actions, totals, and empty states.
- Monthly payroll report title, employee/total labels, filters, and empty state.
- Employee self-service salary-slip title, KPIs, details, additions/deductions, metadata, actions, objections log, and empty states.
- Locale-aware salary-slip creation date (`ar-SA` / `en-US`).
- Remaining employee approval, objection, deletion, and cancel-approval workflow messages.
- Arabic and English dictionary parity for Pack 8 keys.
- Cache-busting reference updated to `v=9.1.6-pack8`.

## Verification
- `node scripts/payroll-ui-localization-pack8-check.js`: Passed.
- JavaScript files checked: 240.
- JavaScript syntax errors: 0.
- No new `MutationObserver`.
- No full DOM scan.
- No additional data reload.

## Functional Areas Not Modified
- Salary calculations.
- Net salary formula.
- Approval-state transition rules.
- Supabase schema or queries.
- Authentication and permissions.
- Employee/payroll persistence logic.

## Modified Files
- `index.html`
- `RELEASE_VERSION.txt`
- `payroll/payroll-core.js`
- `i18n/ar.js`
- `i18n/en.js`
- `scripts/payroll-ui-localization-pack8-check.js`
