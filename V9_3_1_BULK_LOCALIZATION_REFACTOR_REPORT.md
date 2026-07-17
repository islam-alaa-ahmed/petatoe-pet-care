# PETATOE v9.3.1 — Bulk Localization Refactor

## Root cause fixed
The global English translator contained a MutationObserver implementation, but initialization never installed it. Translation therefore depended on manual scans and lifecycle events, allowing Arabic text to return after dynamic renders. Runtime translation was also disabled until authentication, causing Arabic-first rendering on login/startup surfaces. Native dialogs bypassed DOM translation completely.

## Changes
- Automatically install and activate the global localization MutationObserver.
- Enable English localization before authentication as well as after authentication.
- Localize native `alert`, `confirm`, and `prompt` messages through the existing unified runtime translator.
- Trigger a complete scan immediately on English activation and after user/language changes.
- Keep `PETATOE_LOCALIZATION_CENTER` as the authoritative localization runtime.
- Synchronize release and cache versions to PETATOE v9.3.1.

## Files modified
- `i18n/global-screen-translator.js`
- `i18n/localization-center/runtime.js`
- `index.html`
- `RELEASE_VERSION.txt`
- `scripts/bulk-localization-refactor-check.js`

## Verification
- JavaScript syntax check.
- Existing project localization checks.
- Dedicated Bulk Localization Refactor regression check.
