# PETATOE v9 — FINAL6 Verification Report

## Scope

Performance and pre-login permission correction only. Existing localization dictionaries, service translations, Smart Reports text, calculations, and business data were not changed.

## Confirmed Root Causes

1. `navigation/navigation-permissions.js` evaluated the default guest identity before authentication was established. During early navigation events it could remove the active application panel and activate the `petatoeNoPermissionPanel`, causing the browser alert/message "غير متاح للصلاحية الحالية" before login.
2. `i18n/global-screen-translator.js` initialized its dictionary, DOM observer, Canvas interception, and full page scan while the authentication overlay was active. It also scanned hidden report panels, producing unnecessary main-thread work before and after login.
3. Restored sessions did not dispatch the same `petatoe:userchanged` event as a fresh login, so gated runtime components could not start deterministically after session restoration.

## Fixes

### Authentication-gated permissions

- Added a canonical authenticated-session check to navigation permissions.
- Permission filtering and active-panel enforcement now return immediately while no real session exists.
- Guest clicks no longer emit permission-denied notifications.
- Any stale no-access panel is deactivated during the login state.
- Permissions are applied after a successful fresh login or restored session only.

### Authentication-gated localization runtime

- Global DOM translation observation is disabled while logged out.
- Translation phrase index construction is deferred until an authenticated English session exists.
- Canvas localization is disabled behind the login overlay.
- Mutation queues and pending idle tasks are cleared on logout.
- Full scans target the active panel, header, navigation, and sidebar only instead of every hidden panel in the application.
- Dynamic added nodes remain translated after login through the bounded batching/idle queue introduced in FINAL3.

### Session restoration

- A valid restored session now dispatches `petatoe:userchanged` with source `auth-restore`.
- Navigation permissions and localization runtime start at the correct point after session validation.

## Files Modified

- `index.html`
- `RELEASE_VERSION.txt`
- `i18n/global-screen-translator.js`
- `navigation/navigation-permissions.js`
- `security/auth-session.js`

## Localization Preservation

- Arabic/English dictionaries: unchanged.
- Smart Reports translations: unchanged.
- Service glossary and composite service translation: unchanged.
- Existing FINAL2–FINAL5 localization output: preserved.

## Verification

- `node --check i18n/global-screen-translator.js`: Passed
- `node --check navigation/navigation-permissions.js`: Passed
- `node --check security/auth-session.js`: Passed
- Syntax check for all JavaScript files: Passed
- JavaScript syntax errors: 0

## Regression Safety

- Business logic: unchanged
- Report calculations: unchanged
- Filters: unchanged
- Datasets: unchanged
- Database: unchanged
- Supabase schema/API: unchanged
- Permission decisions after login: unchanged
- Translation dictionaries and service mappings: unchanged

## Release

- `PETATOE v9.0.0`
- `ELC_FINAL6_AUTH_GATED_PERFORMANCE_FIX`

## GitHub Commit Summary

```text
perf(auth,i18n): suspend permissions and translation runtime before login

- prevent guest permission evaluation before an authenticated session exists
- stop pre-login no-access panel activation and permission-denied alerts
- gate the global translation observer and Canvas localization by authentication
- defer translation dictionary construction until authenticated English mode
- scan only active application surfaces instead of all hidden report panels
- clear translation queues and idle work on logout
- dispatch userchanged after validated session restoration
- preserve all FINAL2 through FINAL5 translation and service-localization results
- synchronize cache-busting and release metadata
- no business logic calculation database Supabase or translation dictionary changes
```
