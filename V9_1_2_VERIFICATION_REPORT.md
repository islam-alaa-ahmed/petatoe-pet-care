# PETATOE v9.1.2 — Smart Reports Source Migration Pack 2

## Baseline

Cumulative baseline used:

1. `petatoe-pet-care(12).zip`
2. `PETATOE_v9_1_UNIFIED_LOCALIZATION_CENTER_FOUNDATION.zip`
3. `PETATOE_v9_1_1_SMART_REPORTS_SOURCE_MIGRATION_PACK1.zip`

No older Smart Reports file was used to replace the cumulative version.

## Scope implemented

This pack continues source-level migration into `PETATOE_LOCALIZATION_CENTER` for the highest-risk mixed-language areas:

- Two-year customer comparison status values.
- Detailed and virtualized customer-comparison table headers.
- Contract-candidate KPI labels, description, table headers, recommendation narrative, and tags.
- Inactive-customer KPI notes, panel titles, sorting narrative, table headers, and recovery-opportunity content.
- Service Analysis lazy-loading placeholder.

## Root causes addressed

### Direct Arabic status values

Customer comparison rows were storing Arabic values such as `ثابت`, `مفقود`, `عميل جديد`, `نمو`, and `تراجع`. These values were later inserted directly into the table. They now resolve through localization keys at source-render time.

### Mixed sentence fragments

Contract recommendations and inactive-customer explanations were assembled from Arabic fragments and English terms such as `Score` and `Recovery Opportunities`. They are now complete parameterized templates in both AR and EN dictionaries.

### Non-localized virtual table definitions

The virtualized detailed comparison table used literal Arabic column labels. It now requests labels from the unified source dictionary, matching the standard HTML table path.

### Re-render regressions

All migrated content is generated through `smartReportT()` / `smartReportHtml()`, which are adapters to `PETATOE_LOCALIZATION_CENTER`. Rebuilding the report no longer recreates the migrated blocks from raw Arabic UI strings.

## New localization coverage

Added synchronized AR/EN keys for:

- Customer comparison statuses and year-specific invoice labels.
- Rank change, last interaction, and status columns.
- Contract candidates, potential sales, visit/invoice counts, candidate summaries, and AI recommendation narrative.
- Inactivity periods, risk labels, sorting explanation, recovery opportunities, and table fields.
- Service Analysis lazy loading state.

## Regression guard

`scripts/smart-reports-localization-source-check.js` was expanded to:

- Reject reintroduction of the migrated direct Arabic templates.
- Require all Pack 1 and Pack 2 localization keys.
- Confirm required keys exist in both Arabic and English dictionaries.

Result:

```text
Smart Reports source localization check passed.
```

## Syntax verification

```text
JavaScript files checked: 236
Syntax errors: 0
Result: Passed
```

## Preserved behavior

No changes were made to:

- Sales or customer calculations.
- Customer comparison year logic.
- Contract scoring thresholds.
- Inactive-customer formulas.
- Filters or pagination limits.
- Database or Supabase operations.
- Authentication or permissions.
- Global translator batching, caching, or DOM scan strategy.

## Modified files only

```text
index.html
RELEASE_VERSION.txt
i18n/smart-reports-source.js
smart/smart-reports-core.js
scripts/smart-reports-localization-source-check.js
```

## Release

```text
PETATOE v9.1.2
ELC_V9_1_SMART_REPORTS_SOURCE_MIGRATION_PACK2
```
