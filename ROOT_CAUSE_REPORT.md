# Root Cause Report — Phase A3.1

## Confirmed Root Cause
The Dashboard filter options and visible Settings shell elements still contained direct Arabic text without explicit translation bindings. The Backup/Restore settings module also generated its complete UI, validation errors, confirmations, and toast messages from hard-coded Arabic strings inside `settings/backup.js`.

The runtime translation fallback could translate some of these strings after rendering, but this did not satisfy the production requirement of zero hard-coded UI strings and kept the module dependent on post-render translation.

## Responsible Files
- `index.html`: unbound Dashboard filter options and Settings shell text.
- `settings/backup.js`: hard-coded Backup/Restore UI and runtime messages.

## Fix
- Added explicit `data-i18n` bindings to the affected static elements.
- Added a dedicated bilingual catalog at `i18n/localization-center/settings-backup.js`.
- Replaced Arabic literals in `settings/backup.js` with canonical key resolution through the Localization Center.
- Preserved all backup validation, import, export, Supabase, and audit behavior.
