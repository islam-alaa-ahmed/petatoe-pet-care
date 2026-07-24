# Root Cause Report — Observability Settings Screen

## Root Cause
The observability dashboard was only exposed through a keyboard shortcut and a query-string diagnostic mode. `Ctrl + Shift + P` is reserved by Chrome/Edge for the print dialog, so the application could not reliably receive the shortcut.

## Scope
- Add an administrator-only **Performance & Observability** entry inside the existing Settings & Permissions menu.
- Render the metrics as a real Settings screen.
- Keep JSON export and refresh actions.
- Change the optional shortcut to `Ctrl + Shift + O`.

## Files Responsible
- `navigation/navigation.js`: Settings menu composition and routing.
- `settings/settings.js`: Settings screen rendering.
- `diagnostics/enterprise-observability.js`: Metrics UI and observability API.
- `i18n/localization-center/dictionary-store.js`: Arabic/English strings.
