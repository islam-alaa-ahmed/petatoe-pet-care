# PETATOE v10.0.25 — Phase P6.1
## Mobile Regression Recovery & Cold Start Stabilization

## Confirmed Root Cause

1. The previous full-file header restoration replaced later P4/P5 navigation isolation and layout ownership changes inside the same mobile shell and stylesheet.
2. The active startup gate no longer contained the Phase P1 visual boot release API, so `pet-mobile-booting` could remain until the authentication layer removed it.
3. Legacy sidebar/header elements were hidden only after JavaScript body classes were added, allowing them to flash during a cold start.
4. The dashboard legacy filters could render before the mobile runtime moved the single year selector, causing a temporary duplicate/shift.

## Implemented Recovery

- Preserved the P4 functional isolation of `#sidebar`, `#overlay`, and `#nav`.
- Merged only the approved enterprise glass header and shared bottom navigation behavior into the current P6 shell.
- Restored the theme button, centered PETATOE header layout, movable navigation bubble, touch gesture, and compact-on-scroll behavior.
- Added CSS-first cold-start guards so legacy sidebar/header pieces and the old dashboard filter panel never paint on phone widths.
- Restored a startup-gate-owned boot release after two stable animation frames, with a 1100 ms safety deadline independent of authentication and data loading.
- Added a CSS safety fade so the startup cover cannot remain opaque indefinitely.
- Preserved current release/version, auth, Supabase, APIs, permissions, business logic, desktop/tablet, and service worker.

## Modified Files

- `index.html`
- `mobile/mobile-enterprise-v10-shell.js`
- `css/mobile/mobile-enterprise-v10-consolidated.css`
- `performance/mobile-startup-loading-gate.js`

## Verification

- JavaScript syntax: PASSED
- CSS braces: PASSED (406 / 406)
- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Runtime Translation Completion: PASSED
- Smart Reports Translation Stability: PASSED (11/11)
- Mobile Enterprise UI v10 Certification: PASSED (61/61)
