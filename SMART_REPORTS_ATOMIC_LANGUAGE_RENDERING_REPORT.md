# PETATOE v9.4.18 — Smart Reports Atomic Language Rendering

## Confirmed root causes

1. Smart Reports calculation records were localized before aggregation in both `smart-reports-core.js` and `smart-data-engine.js`.
2. Business-data translation rebuilt a master-data signature with `JSON.stringify` during display resolution.
3. A language-change event invalidated calculation caches and triggered a full Smart Reports render.
4. `smart-router.js` rendered modular tabs directly and then called `setSmartTab`, whose lazy renderer rendered the same tab again.
5. Residual Smart Reports text had no single, scoped language owner after the global translator excluded `#smartReportsArea` for performance.

## Implemented changes

- Calculations now use canonical source records only.
- Business names are localized only in display helpers.
- Master-data translation maps are built once and invalidated only by reference/master-data changes.
- Language changes no longer clear Smart Reports data caches and no longer call `renderSmartReports()`.
- `setSmartTab` is now the only modular-tab render owner.
- Added a scoped atomic language runtime that updates only the visible Smart Reports tab and active charts.
- Original text/attribute/chart labels are retained in `WeakMap` storage so Arabic can be restored without a full rerender.
- Added revision cancellation so rapid language events cannot apply stale translations after a newer event.

## Performance protections

- No row-level localization in calculations.
- No calculation-cache invalidation on language change.
- No full Smart Reports render on language change.
- No duplicate Vehicles render during navigation.
- No global DOM scan inside Smart Reports.
- Only the active Smart Reports surface is scanned once after a language or tab event.

## Modified files

- `RELEASE_VERSION.txt`
- `index.html`
- `smart/smart-reports-core.js`
- `smart/smart-data-engine.js`
- `smart/smart-router.js`
- `smart/smart-tabs.js`
- `smart/smart-language-runtime.js`
- `i18n/localization-center/business-data.js`
