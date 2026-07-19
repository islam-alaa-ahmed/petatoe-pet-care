# PETATOE v9.4.17 — Display-Layer Localization Performance

## Confirmed Root Causes

1. Smart Reports localized and cloned every invoice row before calculations.
2. Smart Data Engine repeated the same row-level localization.
3. Business-data lookup serialized complete services, cars, and customers arrays during display resolution.
4. Vehicle routing rendered the module and then called `setSmartTab`, which scheduled a second render.
5. Vehicle line and bar reports recalculated identical month/vehicle matrices in the same render cycle.

## Implemented Changes

- Calculations now use canonical source records only.
- Services, vehicles, customers, and payments are translated at display time.
- Business reference maps are built once and invalidated only by reference/storage events.
- Vehicle tabs use one render owner.
- Repeated vehicle matrices are cached within each render.
- Release metadata and browser cache tokens were synchronized.

## Modified Files

- `RELEASE_VERSION.txt`
- `index.html`
- `smart/smart-reports-core.js`
- `smart/smart-data-engine.js`
- `smart/smart-router.js`
- `smart/smart-vehicles.js`
- `i18n/localization-center/business-data.js`
- `i18n/localization-center/runtime.js`
- `i18n/localization-center/dictionary-store.js`
- release validators under `scripts/`
- `scripts/display-layer-localization-performance-check.js`
- `GITHUB_DESKTOP_SUMMARY.txt`

## Expected Runtime Behavior

- No full-record translation pass before opening reports.
- One vehicle render per tab action or local filter action.
- No repeated full master-data serialization for each displayed label.
- Language changes preserve the same calculation layer and only alter displayed names/text.
