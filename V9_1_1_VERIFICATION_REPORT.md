# PETATOE v9.1.1 — Smart Reports Source Migration Pack 1

## Baseline

- `petatoe-pet-care(12).zip`
- Overlaid with `PETATOE v9.1 Unified Localization Center Foundation`
- No older Smart Reports file was used.

## Root Cause addressed

Customer-value classification tooltips were still assembled as complete Arabic template literals inside `smart/smart-reports-core.js`. They were translated only after rendering by the DOM safety layer. Re-rendering the report could therefore restore Arabic or mixed-language text.

The heatmap cutoff date also used the Arabic-specific date formatter directly.

## Changes

- Moved customer classification titles and explanations into the Smart Reports locale pack.
- Added independent Arabic and English parameterized templates.
- Routed VIP, At Risk, and Active classification narratives through `PETATOE_LOCALIZATION_CENTER` via the existing `smartReportT` adapter.
- Escaped localized tooltip content before HTML insertion.
- Routed the heatmap cutoff date through the unified locale-aware date formatter.
- Added a focused source-regression check for the migrated block.

## Added localization keys

- `classification.vip`
- `classification.atRisk`
- `classification.active`
- `classification.reasonTitle`
- `classification.reasonIntro`
- `classification.reasonNote`
- `classification.reason.vipVisits`
- `classification.reason.vipSpend`
- `classification.reason.vipRecency`
- `classification.reason.riskAbsence`
- `classification.reason.riskLowVisits`
- `classification.reason.riskFollowup`
- `classification.reason.activeRecency`
- `classification.reason.activeVisitsSpend`
- `classification.reason.activeConditions`

## Verification

- JavaScript files checked: **236**
- Syntax errors: **0**
- Focused Smart Reports localization source check: **Passed**
- Arabic and English values exist for every newly introduced key: **Passed**
- Parameter interpolation runtime sample: **Passed**

Runtime sample results:

```text
Customer classification reason: At Risk
The customer completed 7 visits with total spending of SAR 1,500.
```

## Regression safety

- Business calculations: unchanged
- Customer classification thresholds: unchanged
- Customer totals and visit counts: unchanged
- Filters and datasets: unchanged
- Database and Supabase: unchanged
- Authentication and permissions: unchanged
- Global translator batching and performance controls: unchanged

## Release

```text
PETATOE v9.1.1
ELC_V9_1_SMART_REPORTS_SOURCE_MIGRATION_PACK1
```
