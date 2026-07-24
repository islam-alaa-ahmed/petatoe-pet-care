# PETATOE v10.0.6 — Mobile About & Update Center

## Root Cause

The project already contained a working PWA update engine in `pwa/pwa-manager.js`, but it was only exposed through the temporary global update bar. The Settings & Permissions center had no mobile About screen, no public update API, and no unified screen that displayed release metadata, build number, release date, last update check, and update state.

## Responsible Areas

- `settings/settings.js`: no mobile-only About tab or mount point.
- `pwa/pwa-manager.js`: update logic was internal and could not be invoked or observed by a Settings screen.
- `i18n/localization-center/dictionary-store.js`: no canonical Arabic/English keys for the About screen.
- `service-worker.js`: cache version had to be synchronized with the new release so update detection could activate a new worker.

## Scope

A mobile-only About screen was added and connected to the existing PWA update engine. Desktop Settings behavior and all business modules remain unchanged.
