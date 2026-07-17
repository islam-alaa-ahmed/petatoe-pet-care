# PETATOE v9.2.6 — Source Migration Pack 5

## Scope

Maintenance Center shell and user actions were migrated to the unified `PETATOE_LOCALIZATION_CENTER` source-rendering path.

## Root cause addressed

The Maintenance Center still created its main header, action buttons, KPI labels, latest-event tables, copy dialog, launcher button, and fallback error directly in Arabic. Every refresh rebuilt those Arabic strings before the DOM translator could react, causing Arabic text to return in English mode.

## Changes

- Added `i18n/maintenance-source.js` with synchronized Arabic and English dictionaries.
- Added the `mt()` adapter backed by `PETATOE_LOCALIZATION_CENTER.t()`.
- Rendered the main Maintenance Center shell directly in the selected language.
- Added dynamic RTL/LTR direction and locale-aware maintenance timestamps.
- Migrated copy-report UI, launcher button, action buttons, main KPI cards, core status section, latest errors/events, and footer.
- Loaded the maintenance dictionary before `maintenance-center.js`.
- Added a regression guard for dictionary order, key coverage, English purity, and removed direct shell literals.

## Excluded from this pack

Deep diagnostic recommendation text and historical baseline narratives remain for the next maintenance migration pack. No diagnostics calculations, snapshots, security logic, storage logic, router logic, permissions, or business workflows were changed.
