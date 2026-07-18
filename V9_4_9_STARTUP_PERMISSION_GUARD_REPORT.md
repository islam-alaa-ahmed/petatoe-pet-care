# PETATOE v9.4.9 — Startup Permission Guard

## Confirmed root cause
`treasury/treasury-core.js` executed `renderAll()` during `DOMContentLoaded` and again after 80/300 ms, before authentication and the Supabase identity/permission cache were ready. `ensureTabs()` then called `openTreasuryTab(..., true)`. When no treasury tab was yet authorized, the silent startup path still executed a native `alert()` with “Unavailable for the current permission”.

## Fix
- Treasury startup is now gated by an authenticated session and a ready identity cache.
- Removed the unconditional 80/300 ms startup retries.
- Treasury initializes after `petatoe:userchanged` and `petatoe:identity-ready`.
- Silent internal tab selection no longer displays a native permission alert.
- Explicit denied actions use the existing toast path instead of a blocking browser alert.

## Scope
No permission rules were relaxed. The change only prevents permission evaluation before identity readiness and prevents internal startup rendering from notifying the user.
