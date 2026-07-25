# PETATOE v10.0.25 — Phase P7.1
## Mobile Device Ownership & Orientation Isolation

## Confirmed Root Cause
The mobile runtime and mobile stylesheet ownership depended on the live viewport rule `max-width: 760px`.
An iPhone in landscape can exceed 760 CSS pixels, so the mobile shell, navigation isolation, mobile dashboard/report enhancements, and mobile CSS stopped owning presentation while the physical device was still a phone. Desktop chrome and desktop report layout then became visible.

## Implemented Scope
- Added `core/mobile-device-profile.js` as the canonical physical-device ownership source.
- Phone ownership is stable across portrait/landscape rotation and does not depend on the current viewport width alone.
- Added first-paint HTML device classes and orientation metadata.
- Broadened the phone layout boundary to cover coarse-pointer landscape phone viewports.
- Kept desktop cleanup rules restricted to fine-pointer desktop devices.
- Updated shell, dashboard, reports, management, experience, navigation, sidebar, and startup gate to honor stable mobile ownership.
- Updated the Mobile v10 certification rule to validate the new portrait/landscape ownership guard.

## Legacy Inventory
### Runtime-loaded mobile presentation
- `css/mobile/mobile-about-app.css`
- `css/mobile/mobile-enterprise-v10-consolidated.css`
- `mobile/mobile-enterprise-v10-shell.js`
- `mobile/mobile-enterprise-v10-dashboard.js`
- `mobile/mobile-enterprise-v10-reports.js`
- `mobile/mobile-enterprise-v10-management.js`
- `mobile/mobile-enterprise-v10-experience.js`

### Legacy CSS files still present but not directly loaded by index.html
- `css/mobile/mobile-enterprise-m1.css`
- `css/mobile/mobile-enterprise-m2.css`
- `css/mobile/mobile-enterprise-v10-shell.css`
- `css/mobile/mobile-enterprise-v10-dashboard.css`
- `css/mobile/mobile-enterprise-v10-reports.css`
- `css/mobile/mobile-enterprise-v10-management.css`
- `css/mobile/mobile-enterprise-v10-experience.css`
- `css/mobile/mobile-enterprise-v10-redesign-m1.css`

These files were not deleted in P7.1 because the consolidated stylesheet preserves source ownership markers and the certification suite still verifies their presence. They are candidates for P7.6 after dependency/reference proof.

### Desktop presentation still shared with mobile DOM
- `.topbar`
- `#sidebar`
- `#overlay`
- `#nav`
- Desktop dashboard/report panels

P7.1 prevents desktop ownership from reactivating when the phone rotates. Full DOM/presentation removal belongs to P7.2–P7.5.

## Verification
- JavaScript syntax: PASSED
- CSS brace balance: PASSED (406 / 406)
- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Runtime Translation Completion: PASSED
- Mobile Enterprise UI v10 Certification: PASSED (61 / 61)

## Not Changed
- Version/release identity
- Supabase/database/API
- Authentication/biometrics
- Permissions
- Business calculations
- Service Worker/cache version
- Desktop presentation behavior
- Localization dictionary or visible UI text
