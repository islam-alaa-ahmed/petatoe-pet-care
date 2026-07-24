# PETATOE v10.0.5 — Smart Router Cache Token Hotfix

## Root Cause

`i18n/localization-center/runtime.js` declares:

`10.0.5-mobile-startup-performance`

but `index.html` referenced:

`smart/smart-router.js?v=10.0.4-observability-settings-screen`

The GitHub Actions check `scripts/smart-reports-public-api-check.js` requires the Smart Router cache token to match the Localization Runtime version exactly. The mismatch caused **Smart Reports Public API** to fail and stopped the remaining workflow steps.

## Minimal Fix

Only the Smart Router script cache token in `index.html` was changed to:

`smart/smart-router.js?v=10.0.5-mobile-startup-performance`

No application logic, desktop/mobile layout, SQL, Supabase schema, localization dictionary, or Smart Reports logic was changed.
