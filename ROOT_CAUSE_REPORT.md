# PETATOE v10.0.2 — Post-Login Startup Performance Root Cause

## Confirmed root cause

`security/auth-session.js` invalidated a valid `PETATOEIdentityStore` cache on every login click:

- `loading = null`
- `loaded = false`
- `await ids.load()`

`loadIdentityStore()` performs three sequential Supabase reads:

1. `app_users`
2. `app_user_permissions`
3. `roles`

The same identity data had already been requested during application bootstrap through `setTimeout(loadIdentityStore, 0)`. Therefore a normal login repeated the complete identity round trip before authentication could continue.

After session creation, `petatoe:userchanged` synchronously triggered navigation permission application, while `openSession()` also called `PETATOENavigationPermissions.apply()` directly. This duplicated the permission traversal.

The safe dashboard route was only stabilized for MFA/trusted-device logins. A normal password login could expose the application shell before an active dashboard panel had been selected, producing the blank page shown after the login toast.

## Scope of correction

- Reuse the boot-time identity request or loaded identity cache.
- Await identity only when it is not ready.
- Do not invalidate users, permissions, and roles during a login attempt.
- Remove the duplicate direct navigation-permission apply call.
- Open the safe dashboard on the next animation frame for every successful login.
- Retain one short 250 ms route stabilization retry for late DOM/router hydration.
- No changes to credentials, MFA, trusted devices, session security, Supabase schema, permissions rules, or business calculations.
