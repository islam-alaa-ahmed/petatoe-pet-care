# PETATOE v9.0.0 — FINAL7 Smart Refresh Data Readiness Fix

## Root Cause

After browser refresh, navigation restoration could reopen Smart Reports before the authenticated Supabase sales data was loaded. The previous open/refresh guard performed a single early read. When the Data Layer was not ready yet, it rendered the normal zero-row fallback and the page could remain on "Not enough data" even though records arrived later.

## Fix

- Gate Smart Reports rendering behind an authenticated user.
- Distinguish between `data not ready` and `confirmed empty data`.
- Show a temporary loading state while Supabase/Data Layer is initializing.
- Retry the data read with bounded backoff instead of rendering the empty fallback early.
- Listen to the actual window-level `petatoe:records-changed` event.
- Re-render the active Smart Report automatically as soon as records arrive.
- Reset retry state on logout, manual refresh, and restored login.
- Preserve the active Smart Reports tab after the delayed render.

## Files Modified

- `index.html`
- `RELEASE_VERSION.txt`
- `smart/smart-reports-open-refresh-guard.js`

## Verification

- `node --check smart/smart-reports-open-refresh-guard.js`: Passed
- Translation dictionaries: Unchanged
- Service localization: Unchanged
- Smart Reports calculations: Unchanged
- Filters and datasets: Unchanged
- Database and Supabase schema: Unchanged
- Authentication rules: Unchanged

## Release

`ELC_FINAL7_SMART_REFRESH_DATA_READINESS_FIX`
