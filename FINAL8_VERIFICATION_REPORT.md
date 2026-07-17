# PETATOE v9 FINAL8 — Localization Regression Guard

## Root Cause
Several Smart Reports still generate legacy Arabic fallback and dynamic narrative text. Later changes could restore these source strings after earlier DOM-level translations. The active-only performance optimization also meant that phrases missing from the central glossary could remain mixed.

## Fix
- Expanded the persistent English safety glossary for the remaining screenshots: tax modes, all-years controls, new-customer KPIs, visit-count tooltips, contract candidates, recommendation details, two-year comparison narratives, inactive-customer analysis, ranking controls, recovery opportunities, and mixed dynamic labels.
- Limited rescans to the active Smart Reports section, tabs, visible tooltips and open modals.
- Added debounced rescans after Smart Reports actions and records updates.
- Added a localization regression baseline and a Node guard that fails when protected report files gain new Arabic-source lines.
- Preserved FINAL2–FINAL7 translations, service localization, performance batching, auth gating and data-readiness behavior.

## Modified Files
- index.html
- RELEASE_VERSION.txt
- i18n/global-screen-translator.js
- i18n/localization-regression-baseline.json
- scripts/localization-regression-check.js

## Verification
- `node --check i18n/global-screen-translator.js`: Passed
- `node scripts/localization-regression-check.js`: Passed
- Business logic: Unchanged
- Calculations: Unchanged
- Database/Supabase: Unchanged
- Permissions/Auth: Unchanged
- Smart Reports data-readiness fix: Preserved

## Release
PETATOE v9.0.0
ELC_FINAL8_LOCALIZATION_REGRESSION_GUARD
