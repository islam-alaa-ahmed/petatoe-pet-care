# PETATOE v9.1.7 — Enterprise Business Localization Pack 2

## Baseline

- `petatoe-pet-care(13).zip`
- Overlaid with the previously delivered `PETATOE v9.1.7 Business Localization Pack 1`

## Root Cause

Customer 360 read service, vehicle, customer, and payment labels directly from runtime records. Therefore those values bypassed the unified business localization layer and could remain Arabic after switching to English. The business localization runtime also lacked shared renderer methods and explicit mappings for vehicle statuses, vehicle types, and customer categories.

## Implemented

- Added shared business renderer APIs: `render`, `renderRecord`, and `renderList`.
- Added English mappings for vehicle statuses and vehicle types.
- Added English mappings for customer categories and lifecycle classifications.
- Extended `localizeRecord()` to localize appointment status, vehicle status, vehicle type, and customer category fields without changing canonical stored values.
- Routed Customer 360 customer, service, vehicle, and payment display values through `PETATOE_LOCALIZATION_CENTER.business()` with runtime fallback.
- Added Customer 360 rerender on `petatoe:language-changed`.
- Updated cache-busting references and release metadata.

## Verification

- `Business Localization Pack 2 Check: Passed`
- JavaScript files checked: **239**
- JavaScript syntax errors: **0**

## Unchanged

- Database and Supabase schema
- Stored business values
- Calculations and report formulas
- Authentication and permissions
- Customer grouping and totals
