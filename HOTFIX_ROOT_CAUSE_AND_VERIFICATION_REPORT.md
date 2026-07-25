# PETATOE v10.0.25 — Restore Enterprise Glass Header & Navigation

## Confirmed visual symptom
The supplied recording shows repeated cold-load layout changes, temporary blank/partially rendered screens, and bottom-navigation/header position instability after cache clearing.

## Confirmed regression source
The later Phase P4/P5 mobile shell and consolidated CSS replaced the previously approved Enterprise Glass Header and shared movable bottom-navigation implementation. The currently deployed shell/CSS therefore no longer matched the approved package supplied by the user.

## Applied hotfix
Restored the two approved files byte-for-byte from:
`PETATOE_v10.0.25_Mobile_Enterprise_Header_Glass_Navigation_Modified_Files_Only(1).zip`

Files restored:
- `mobile/mobile-enterprise-v10-shell.js`
- `css/mobile/mobile-enterprise-v10-consolidated.css`

## Scope controls
- No version change.
- No business logic, Supabase, database, API, authentication, permissions, service worker, desktop, or tablet change.
- No visible text added.

## Verification
- JavaScript syntax: PASSED (`node --check`).
- CSS brace balance: PASSED (355 opening / 355 closing).
- Restored JavaScript SHA-256 matches approved package exactly:
  `baa62c9b77603d3d3b96d49a90fef589b5a61396fa37d0802bc451ee4aeefdbf`
- Restored CSS SHA-256 matches approved package exactly:
  `11ca1496ad3c39a5ef135536587ade4a2c65d0fb2dbefb751df7636318477894`

## Important
This hotfix restores the approved header and navigation exactly. The separate cold-cache white/partial-render behavior should be retested after deployment; it was not masked with unrelated cache or service-worker changes in this rollback.
