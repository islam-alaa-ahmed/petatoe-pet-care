# PETATOE v9.1.6 — Enterprise UI Localization Pack 9

## Baseline

- `petatoe-pet-care(13).zip`
- Cumulative payroll localization through Pack 8

## Root Cause

Several payroll screens had already adopted `payrollT()`, but the Chairman approval table, Accounts table, commission-link status narratives, payroll table headers, and PDF/CSV export templates still contained direct Arabic source strings. Export documents also forced `lang="ar"`, `dir="rtl"`, and `ar-SA`, so English mode could still produce Arabic headings and Arabic date formatting.

## Implemented

- Localized Chairman approval title, description, actions, headers, and empty state.
- Localized Accounts screen title, actions, headers, employee-note column, and empty state.
- Localized commission snapshot/matching status narratives with parameterized templates.
- Localized current/archive payroll table headers.
- Localized monthly report employee-total column.
- Localized monthly payroll CSV column labels and total row.
- Made monthly-report and archive PDF documents language-aware for `lang`, `dir`, title, headings, and export date.
- Made PDF date formatting use `en-US` or `ar-SA` according to the active language.
- Localized archive PDF headers, all-years fallback, and slip-count text.
- Added Pack 9 source regression guard.

## Verification

```text
Payroll UI Localization Pack 9 Check: Passed
Required bilingual keys checked: 18
JavaScript files checked: 239
JavaScript syntax errors: 0
```

## Functional Boundaries Preserved

No changes were made to:

- Payroll calculations or net salary formula.
- Approval-state transition rules.
- Commission calculation/matching logic.
- Supabase persistence schema or calls.
- Authentication or permissions.
- Employee visibility rules.

No new `MutationObserver`, full DOM scan, or additional data reload was added.

## Modified Files

```text
index.html
RELEASE_VERSION.txt
payroll/payroll-core.js
i18n/ar.js
i18n/en.js
scripts/payroll-ui-localization-pack9-check.js
V9_1_6_PACK9_VERIFICATION_REPORT.md
```
