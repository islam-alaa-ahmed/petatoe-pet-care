# PETATOE v9 — FINAL9 Initial English Hydration Fix

## Root Cause
The saved English language was restored before all Smart Reports dictionaries, data, and dynamic report sections had finished loading. Initial rendering therefore used Arabic source fallbacks. Manually switching Arabic then English triggered the complete language application lifecycle after the screen was ready, which made those same texts translate correctly.

## Fix
- Added a one-time English hydration coordinator after authentication, localization readiness, records readiness, navigation creation, and Smart Reports tab restoration.
- Reuses the existing `PETATOE_I18N.apply('en')` lifecycle silently; no visible language switching occurs.
- Rebuilds the phrase index only when translation resources have changed.
- Checks the active English surface before running, avoiding unnecessary work.
- Limits scans to active application surfaces, visible tooltips, and open modals.
- Preserves authentication gating, batching, debounce, idle processing, translation cache, service localization, and all FINAL2–FINAL8 results.

## Files Modified
- `index.html`
- `RELEASE_VERSION.txt`
- `i18n/global-screen-translator.js`

## Verification
- `node --check i18n/global-screen-translator.js`: Passed
- Translation dictionaries: Unchanged
- Service localization: Unchanged
- Smart Reports calculations: Unchanged
- Database/Supabase: Unchanged
- Authentication and permissions: Unchanged

## Runtime API
For manual diagnosis only:

```js
PETATOE_GLOBAL_SCREEN_TRANSLATOR.hydrate()
```

This runs the same silent English hydration cycle.
