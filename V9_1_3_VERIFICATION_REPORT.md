# PETATOE v9.1.3 — Smart Reports Source Migration Pack 3

## Baseline
Cumulative implementation based on:
- `petatoe-pet-care(12).zip`
- PETATOE v9.1 Unified Localization Center Foundation
- PETATOE v9.1.1 Smart Reports Source Migration Pack 1
- PETATOE v9.1.2 Smart Reports Source Migration Pack 2

## Scope
This pack migrates remaining high-risk direct Arabic labels in customer year-comparison tables and the Advanced Reports Center into `PETATOE_LOCALIZATION_CENTER` via the Smart Reports locale source.

## Root causes addressed
- Virtualized table column definitions still contained Arabic labels directly in JavaScript.
- Fallback tables contained untranslated headers and empty-state sentences.
- Value mode labels were assembled from direct Arabic literals.
- Rank-year and total-year labels were assembled as mixed-language fragments.
- The Advanced Reports Center title and description were still hardcoded in source HTML.

## Changes
- Localized customer-comparison value mode labels.
- Localized lost-customer fallback and virtualized table headers.
- Localized last invoice, invoice number, year value, risk classification and details columns.
- Localized rank-year, change and sales-difference headers in normal and virtualized tables.
- Replaced direct empty-state sentences with dictionary keys.
- Replaced year-total and year-rank fragments with complete parameterized templates.
- Migrated the Advanced Reports Center title and description.
- Added Pack 3 regression guards.
- Updated cache-busting script versions and release metadata.

## New keys
- `customerCompare.valueForYear`
- `customerCompare.noLostCustomersInPeriod`
- `customerCompare.rankForYear`
- `customerCompare.change`
- `customerCompare.salesDifference`
- `customerCompare.noClearRankChange`
- `customerCompare.totalForYear`
- `advanced.centerTitle`
- `advanced.centerDescription`

All keys are present in Arabic and English dictionaries.

## Verification
- Smart Reports localization source regression check: Passed
- JavaScript files checked: 236
- JavaScript syntax errors: 0

## Non-functional impact
No changes were made to:
- calculations
- customer comparison logic
- ranking logic
- filters
- data loading
- Supabase
- database structures
- permissions
- authentication

The implementation uses source-level translation and does not introduce additional DOM scans or observers.
