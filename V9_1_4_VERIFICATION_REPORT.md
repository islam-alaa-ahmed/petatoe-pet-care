# PETATOE v9.1.4 — Smart Reports Locale Formatting Pack 4

## Baseline
Cumulative implementation based on `petatoe-pet-care(12).zip` plus PETATOE v9.1.0, v9.1.1, v9.1.2 and v9.1.3 localization patches.

## Confirmed root causes addressed
1. Smart Reports still called the Arabic-only `fmtDateAr()` formatter throughout runtime tables, KPI tooltips, comparisons, heatmaps and exports.
2. Dynamic list values used the Arabic comma separator directly (`، `), producing Arabic punctuation in English mode.
3. Several dynamic empty states were returned as raw Arabic HTML strings instead of using the unified localization center.
4. A comparison period caption assembled the Arabic fragment `حتى` and `نهاية السنة` directly in the source.

## Implementation
- Added `smartFormatDate()` as the only Smart Reports date-display entry point. It uses `PETATOE_LOCALIZATION_CENTER.formatDate()` and keeps `fmtDateAr()` only as a compatibility fallback.
- Migrated every Smart Reports date display in `smart-reports-core.js` to `smartFormatDate()`.
- Added `smartListJoin()` with locale-specific separators.
- Replaced direct Arabic recovery and inactive-customer empty states with unified dictionary keys.
- Replaced the direct comparison-period fragments with parameterized keys.
- Added Arabic and English entries for all Pack 4 keys.
- Extended the source regression check to prevent direct Arabic date formatting, Arabic list separators and migrated raw HTML strings from returning.

## New keys
- `format.listSeparator`
- `period.throughDate`
- `period.yearEnd`
- `customers.noRecoveryOpportunities`
- `customers.noInactiveCustomersByRule`

## Verification
- Smart Reports localization source check: PASSED
- JavaScript files checked with `node --check`: 236
- JavaScript syntax errors: 0
- Direct `fmtDateAr()` calls remaining in Smart Reports: 1 compatibility fallback only
- New MutationObserver: none
- Full DOM scan: none
- Additional data reload: none
- Calculation, filter, Supabase, authentication and permissions logic: unchanged

## Modified files
- `index.html`
- `RELEASE_VERSION.txt`
- `i18n/smart-reports-source.js`
- `smart/smart-reports-core.js`
- `scripts/smart-reports-localization-source-check.js`
