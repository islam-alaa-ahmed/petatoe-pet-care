# PETATOE v9 — FINAL3 Global Translator Performance Fix

## Confirmed Root Cause
The previous global translator observed the full document for child, text and attribute mutations and processed every mutation synchronously. It also performed repeated full-body scans and had no translation-result cache. Heavy Smart Reports screens generated large mutation bursts, blocking the browser main thread and causing Chrome's "Page unresponsive" warning.

## Fix
- Replaced synchronous mutation processing with a deduplicated node queue.
- Processes nodes in bounded idle-time slices.
- Debounces full-screen scans.
- Disconnects the observer while the translator writes text/attributes to prevent self-trigger loops.
- Adds a bounded translation cache for repeated chart labels, months and UI phrases.
- Rebuilds dictionaries only on localization/language events instead of every scan.
- Keeps Canvas text localization but uses cached translations.
- Preserves dynamic DOM, attribute, Shadow DOM and month localization.

## Modified Files
- `index.html`
- `RELEASE_VERSION.txt`
- `i18n/global-screen-translator.js`

## Regression Safety
- Business calculations: unchanged
- Reports data: unchanged
- Filters: unchanged
- Supabase/database: unchanged
- Authentication/permissions: unchanged

## Verification
- JavaScript syntax check passed.
- Cache-busting and release metadata synchronized.
