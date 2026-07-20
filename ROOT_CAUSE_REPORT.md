# PETATOE v9.4.23 — Phase A2 Root Cause Report

## Confirmed Root Cause

`i18n/bootstrap.js` started a fixed 1.5-second reveal timer from the document head. The canonical dictionaries and the i18n engine are loaded near the end of `index.html`, after many synchronous local and CDN scripts. On a slow network, cold cache, or delayed CDN response, the timer could remove `data-pet-i18n-booting` before the English dictionary had been applied.

This created a real startup race:

1. Persisted English was detected and `dir=ltr` was applied.
2. The Arabic source DOM continued parsing while hidden.
3. The 1.5-second timer could reveal the page before `i18n/index.js` completed `applyLanguage()`.
4. Arabic or mixed text could briefly appear before runtime translation completed.

## Affected Files and Responsibilities

- `i18n/bootstrap.js`: fixed-time reveal was the primary race condition.
- `i18n/index.js`: initial-paint completion directly removed the guard without a shared readiness contract.
- `index.html`: several stable Application Shell elements still depended on selector or phrase translation instead of explicit keys.
- `css/i18n/bootstrap.css`: did not distinguish a successful localization reveal from an emergency degraded reveal.

## Impact

- Possible Arabic-to-English startup flash.
- A timeout could be mistaken for successful localization readiness.
- Startup behavior depended on machine/network speed.
- Core shell text had avoidable reliance on post-render translation.

## Implemented Fix

- Replaced the fixed timer with `window.PETATOE_I18N_BOOT`, a deterministic first-paint readiness coordinator.
- The localization engine now reveals the page only after `applyLanguage()` and its initial reapply complete.
- Emergency reveal is armed only after `DOMContentLoaded`, uses an explicit degraded state, and records the reason and duration.
- Added explicit translation bindings for topbar reports, PDF, loading state, global search placeholder, and global search shortcut.
- Added a production-gate test for startup language, direction, guard behavior, and explicit shell bindings.
