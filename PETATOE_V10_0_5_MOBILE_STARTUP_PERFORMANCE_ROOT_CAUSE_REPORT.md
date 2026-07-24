# PETATOE v10.0.5 — Mobile Startup Performance Root Cause Report

## Scope
Mobile runtime only (`max-width: 760px`). Desktop behavior remains on the existing path.

## Confirmed Root Causes

### 1. Sequential session restoration on mobile
- File: `security/auth-session.js`
- Functions: `restore()`, `validateSessionUser()`, `validateRemoteEnterpriseSession()`, `loadFreshUsers()`
- Cause: session restoration waited for the remote `session_touch` request, then forcibly cleared the identity loading promise and reloaded users, permissions, and roles from Supabase.
- Impact: visible startup delay before the authenticated UI became stable, plus the session message appearing after an incomplete first paint.

### 2. Incomplete UI visible before authentication restoration finished
- File: `index.html`
- Cause: the document and large legacy application shell were painted before the late-loaded authentication module completed session restoration.
- Impact: a transient/strange screen appeared before the correct mobile screen.

### 3. Excessive synchronous mobile drawer rebuilds
- File: `mobile/mobile-enterprise-v10-shell.js`
- Function: `buildDrawer()`
- Cause: every observed navigation DOM mutation immediately rebuilt the complete mobile drawer and recalculated computed styles.
- Impact: unnecessary main-thread work during startup and navigation, reducing smoothness.

## Fix Scope
- No SQL or Supabase schema changes.
- No Business Logic changes.
- No desktop routing, layout, or authentication behavior changes.
- No new visible localized text.
