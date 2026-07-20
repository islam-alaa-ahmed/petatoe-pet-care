# Root Cause Report — Phase A3.5.3

## Confirmed Root Cause
Three Smart Reports surfaces were not using one explicit localization source:

1. Vehicle Efficiency filters read generic `smart()` keys and embedded Arabic fallbacks directly in the rendering module.
2. The Smart Reports data-readiness guard selected Arabic or English manually from `document.lang` instead of resolving a catalog key.
3. Global search and recommendation interactions used source keys, but those keys were distributed across prior runtime dictionaries rather than one complete source catalog.

This made these frequently re-rendered surfaces depend on fallback strings or runtime language branching and weakened source-level localization parity.

## Fix
- Added one bilingual source catalog for readiness, Vehicle Efficiency, search and recommendation interactions.
- Routed Vehicle Efficiency through `PETATOE_LOCALIZATION_CENTER.t()` using the `smartReportsSource.vehicleEfficiency` namespace.
- Replaced manual readiness language branching with a source translation key resolved before rendering.
- Loaded the catalog before Smart Reports runtime modules.

## Business Logic Impact
None. Filter values, report calculations, record fields, routing and data-readiness behavior remain unchanged.
