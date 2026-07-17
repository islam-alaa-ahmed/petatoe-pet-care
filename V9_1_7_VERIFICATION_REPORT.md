# PETATOE v9.1.7 — Enterprise Business Localization Pack 1

## Baseline
`petatoe-pet-care(13).zip`

## Root Cause
The business-data localization runtime handled services, vehicles, and customers only. Payment methods and operational/customer statuses could therefore remain Arabic in English mode. Smart Reports also localized service names explicitly, while customer, vehicle, and payment aggregates could bypass the unified localization center.

## Implemented
- Extended `PETATOE_BUSINESS_DATA_I18N` with stable localization for common payment methods.
- Added customer and appointment status localization mappings.
- Extended `localizeRecord()` to localize payment and status display fields without changing canonical stored values.
- Routed Smart Reports service, vehicle, customer, and payment display names through `PETATOE_LOCALIZATION_CENTER.business()`.
- Updated release metadata and cache-busting references to v9.1.7.
- Added a regression guard for the new business-localization paths.

## Data Safety
Canonical values remain unchanged. Localization is applied only to cloned/display records. No database, Supabase, authentication, permissions, calculations, or persistence logic was modified.

## Verification
- Business localization Pack 1 guard: Passed
- JavaScript syntax scan: Passed
- JavaScript syntax errors: 0
- New MutationObserver: 0
- Full DOM scan: 0
- Additional data reload: 0

## Modified Files
- `index.html`
- `RELEASE_VERSION.txt`
- `i18n/business-data-localization.js`
- `smart/smart-reports-core.js`
- `scripts/business-localization-pack1-check.js`
