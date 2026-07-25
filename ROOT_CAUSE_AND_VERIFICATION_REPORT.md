# PETATOE Mobile UI Corrective Hotfix

## Baseline
`petatoe-pet-care-main (4)(1).zip`

## Version policy
No release number or cache/version token was changed.

## Confirmed root causes

1. Legacy header controls were hidden only through selectors dependent on `body.pet-v10-mobile`; during parts of startup/runtime that class was not a reliable ownership boundary, allowing the old search and paw controls to reappear.
2. The legacy sidebar state (`sidebar-open`, `.sidebar.open`, `#overlay.show`) could remain active while the v10 drawer opened, leaving a visible strip from the old navigation layer.
3. Global search used a fixed `padding-top:80px`, `100vh`, and a low stacking level relative to the mobile shell. On iPhone this allowed the search surface to overlap or slide beneath the fixed header.
4. Authentication used fixed desktop-oriented padding, a fixed footer, and no `visualViewport` height synchronization. iOS keyboard and viewport resizing therefore compressed and displaced the login/MFA surface.

## Modified files
- `css/mobile/mobile-enterprise-v10-consolidated.css`
- `mobile/mobile-enterprise-v10-shell.js`
- `security/auth-session.js`

## Verification
- JavaScript syntax: passed.
- Smart Reports Translation Stability: passed 11/11.
- Mobile Enterprise UI v10 certification: passed 61 checks, 0 failures.
- Enterprise localization certification: passed.
- Production localization lockdown: passed.
- Runtime translation completion: passed.
