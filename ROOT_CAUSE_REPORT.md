# Root Cause Report — Phase A1

## Confirmed Root Cause
The repository contained multiple phase-specific validators that were still treated as current checks. Several of them were pinned to historical release markers, legacy APIs, or pre-consolidation localization structures. This produced contradictory outcomes: current certification scripts passed while obsolete scripts failed.

The Smart Reports source validator also searched for literal translation keys inside `i18n/smart-reports-source.js`, although that file is now an adapter delegating to the canonical store at `i18n/localization-center/dictionary-store.js`.

## Impact
- False localization failures from historical checks.
- False confidence from running only the newest certificate.
- No single authoritative list of blocking production validators.
- Smart Reports reported 22 missing keys even though the keys existed in the canonical dictionary.

## Implemented Repair
- Added a versioned validator manifest defining production gates, diagnostics, and historical checks.
- Added one authoritative validation-suite runner.
- Updated Smart Reports localization validation to load and inspect the canonical dictionary store.
- Added a non-blocking source-surface diagnostic for hard-coded Arabic candidates.

## Scope Safety
No runtime application file, business logic, query, Supabase integration, calculation, UI component, or translation dictionary was modified.
